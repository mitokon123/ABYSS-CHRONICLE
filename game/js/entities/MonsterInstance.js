/**
 * MonsterInstance.js
 * プレイヤーが実際に所持する（または戦闘に出てくる）モンスターの個体。
 * 種族は speciesId で MonsterData（data/monsters.js）を参照する。
 *
 * 個体が持つもの：レベル / 現在HP / 経験値 / 覚えている技 / 性格 / 個体値 / 装備 / 状態異常
 * ステータスの計算式・数値はすべて data/growth.js で管理する。
 */
(function (NS) {
  "use strict";

  /**
   * @param {string} speciesId 種族id
   * @param {number} level レベル
   * @param {MyGame.GameData} gameData データ参照窓口
   * @param {object} [options] { nature, ivs, skills }
   */
  function MonsterInstance(speciesId, level, gameData, options) {
    options = options || {};

    this.speciesId = speciesId;
    this.level = level;
    this.exp = 0;

    this._data = gameData;
    this._species = gameData.getMonsterData(speciesId);

    // つけた名前。null なら種族名で呼ばれる（data/naming.js の文字盤でつける）
    this.nickname = options.nickname || null;

    this.natureId = options.nature || "balanced";
    // 個体値（同じ種族・同じレベルでも個体ごとに差が出る）
    this.ivs = options.ivs || { hp: 0, attack: 0, defense: 0, speed: 0 };

    // 覚えている技（省略時はレベルまでの習得技）
    this.skills = options.skills ||
      NS.MonsterData.skillsUpToLevel(this._species, level);

    // 身につけている装備（data/items.js の id の配列）。枠は config.equipSlots
    this.equipment = options.equipment || [];

    // 作戦（data/battle.js の tactics.list の id）。null なら既定（tactics.default＝命令する）。v1.0.0
    this.tactic = options.tactic || null;

    // 愛情度。勝った戦闘で場に出ていた回数の合計（data/affection.js）。
    // 段階が上がると能力が少し上がり、絆で専用技を覚える。下がることはない
    this.affection = 0;
    /**
     * 掛かっている状態異常（data/statuses.js）。
     *
     * 中身は { id, remaining, steps } の配列。
     *   remaining … 自然に解けるまでの残りターン。null なら自然には解けない（毒）
     *   steps     … ダンジョンを歩いた歩数の数え（毒の歩きダメージに使う）
     *
     * 種類の違うものは同時に掛かる。同じものを重ねてかけた場合は
     * 残りターンが建て直されるだけ（バフ／デバフと同じ扱い）。
     *
     * ★ 毒（persists: true）だけは戦闘が終わっても残るので、セーブに含める。
     */
    this.statusEffects = options.statusEffects || [];

    /**
     * 一時的な強化・弱体（バフ／デバフ）。
     *
     * 状態異常（statusEffects）とは別物として持つ。
     * こちらは「ステータスや倍率が変わるだけ」で、行動そのものは変えない。
     *
     * 中身は { id, name, effects, remaining } の配列で、
     * effects の書き方は特性・装備・加護とまったく同じ。
     * EffectSystem がここも読むので、ダメージ計算側は何も変えなくてよい。
     *
     * 戦闘のあいだだけのものなので、セーブには含めない。
     */
    this.modifiers = [];

    /**
     * 「その戦いに敵として出ているあいだ」だけ掛かる補正。
     *
     *   data/bosses.js の statMultiplier      … 主として立ちはだかるとき
     *   data/dungeons.js の table の statMultiplier … 特殊な出方をする在来種
     *
     * 敵を強くするのに基礎値やレベルを上げると、
     * 仲間にしたときまで強くなったり、報酬が膨らんだりする。
     * 立ちはだかる相手としての強さは、ここで別に足す。
     *
     * 書き方は特性・装備と同じ effects の配列。EffectSystem がここも読む。
     * スカウトで作り直した個体には引き継がれない。
     */
    this.encounterEffects = [];

    /**
     * 決まった順番で行動させたいときの手順（data/bosses.js の actionPattern）。
     * null なら今までどおり、確率で技を選ぶ。
     *
     * 主の動きが読めるようになるので、覚えれば対処できる相手にできる。
     * 戦闘ごとに個体を作り直すので、順番は毎回はじめから。
     */
    this.actionPattern = null;
    this.patternIndex = 0;

    this.currentHp = this.getMaxHp();
    this.currentPp = this.getMaxPp();
  }

  /**
   * ランダムな個体を生成する（野生モンスターなどに使用）。
   * @param {string} speciesId
   * @param {number} level
   * @param {MyGame.GameData} gameData
   * @param {MyGame.Random} random
   */
  MonsterInstance.create = function (speciesId, level, gameData, random) {
    var growth = gameData.growth || {};
    var ivMax = growth.ivMax || 0;
    var natureIds = Object.keys(gameData.natures || {});

    return new MonsterInstance(speciesId, level, gameData, {
      nature: random ? random.pick(natureIds) : natureIds[0],
      ivs: {
        hp: random ? random.nextInt(0, ivMax) : 0,
        attack: random ? random.nextInt(0, ivMax) : 0,
        defense: random ? random.nextInt(0, ivMax) : 0,
        speed: random ? random.nextInt(0, ivMax) : 0
      }
    });
  };

  // --- 参照 ---

  /**
   * その戦いのあいだだけ掛かる補正を設定する。
   * 主（data/bosses.js）と、特殊な出方をする在来種（data/dungeons.js）の両方で使う。
   *
   * @param {object} multipliers { hp, attack, defense, speed, pp } の倍率。
   *   書かなかったステータスは等倍。null / 空を渡すと補正なしに戻る
   */
  MonsterInstance.prototype.setEncounterMultipliers = function (multipliers) {
    this.encounterEffects = [];

    for (var stat in (multipliers || {})) {
      if (!Object.prototype.hasOwnProperty.call(multipliers, stat)) continue;

      var value = multipliers[stat];
      if (typeof value !== "number" || value === 1) continue;
      this.encounterEffects.push({ type: "statMultiplier", stat: stat, value: value });
    }

    // 最大値が変わるので、満タンにし直す
    // （作った直後に呼ぶ前提。補正前のHPのまま戦い始めないように）
    this.currentHp = this.getMaxHp();
    this.currentPp = this.getMaxPp();
  };

  /**
   * 敵として出ていたあいだだけのものを、すべて外す（スカウトで仲間になるとき。BattleScene._recruitFrom）。
   *
   * 主は作り直すので要らないが、在来種は戦った個体をそのまま連れて行くため、
   * 敵として足したもの（EncounterSystem.createEnemyFrom・DungeonScene._startBossBattle）を
   * ここで1つずつ外す。敵のときだけのものを新しく足したら、ここにも足すこと。
   *   倍率・効果（encounterEffects）… 外さないとセーブを読み直すまで HP×2.25 のままだった（ヨミリュウ）
   *   技（enemySkills・出る場所の skills）… 外さないと敵のときの技のままセーブされる
   */
  MonsterInstance.prototype.leaveEncounter = function () {
    // HP は「最大HPに対する割合」を保つ。そのまま持ち越すと、敵のとき HP×0.3〜0.5 のジュエルが 4/10 で仲間になる
    var hpRatio = this.currentHp / Math.max(1, this.getMaxHp());
    this.encounterEffects = [];
    this.fixedStatLevel = undefined;
    this.actionPattern = null;
    this.patternIndex = 0;
    this.skillRateOverride = undefined;
    this.skillWeights = undefined;
    this.enemyTactic = undefined;
    this.infinitePp = false;
    this.fleeRate = undefined;
    this.actionsPerTurn = undefined;
    this.rewardMultiplier = undefined;
    this.dropsOverride = undefined;
    this._bossImmuneToStatus = [];
    this._debuffResistOverride = null;
    if (this._species) this.skills = NS.MonsterData.skillsUpToLevel(this._species, this.level);

    // 戦闘中のもの。パーティが満員で行き先を選ぶときは、戦闘の後片づけの対象に入らないため
    this.clearModifiers();
    this.clearBattleStatuses();
    this._statusWard = null;
    this._undying = false;
    this._defending = false;
    this._removed = false;
    this.displaySuffix = null;

    this.currentHp = (this.currentHp > 0) ? Math.max(1, Math.round(hpRatio * this.getMaxHp())) : 0;
    this.currentPp = Math.min(this.currentPp, this.getMaxPp());
  };

  /**
   * 敵として出るときの技に入れ替える（data/monsters.js の enemySkills）。
   * 野生の敵と主を作ったところで呼ぶ。enemySkills の無い種族は何も変わらない。
   * 仲間になるときは useLearnedSkills で覚える技の一覧に戻す。
   */
  MonsterInstance.prototype.useEnemySkills = function () {
    var skills = NS.MonsterData.enemySkillsUpToLevel(this._species, this.level);
    if (skills) this.skills = skills;
  };

  /**
   * 覚える技の一覧（learnset）のとおりに技を戻す。仲間になるときに呼ぶ。
   * 戻さないと、敵のときの技のままセーブされてしまう（読み込みでも消えない）。
   */
  MonsterInstance.prototype.useLearnedSkills = function () {
    if (!this._species || !this._species.enemySkills) return;
    this.skills = NS.MonsterData.skillsUpToLevel(this._species, this.level);
  };

  /**
   * 決まった順番で行動させる。
   * @param {string[]} pattern 技idの並び。"wait" と書くと、そのターンは何もしない
   */
  MonsterInstance.prototype.setActionPattern = function (pattern) {
    this.actionPattern = (pattern && pattern.length > 0) ? pattern.slice() : null;
    this.patternIndex = 0;
  };

  /**
   * 手順の次の1つを取り出して、順番を1つ進める。
   * 手順を持っていなければ null（呼び出し側が今までどおりの選び方をする）。
   * @returns {string|null} 技id または "wait"
   */
  MonsterInstance.prototype.nextPatternAction = function () {
    if (!this.actionPattern) return null;

    var entry = this.actionPattern[this.patternIndex % this.actionPattern.length];
    this.patternIndex++;
    return entry;
  };

  // --- バフ／デバフ ---

  /**
   * 効果をかける。同じ技のものが既に掛かっていたら、
   * 効果は重ねずにターン数だけ建て直す（強さが青天井にならないように）。
   *
   * @param {object} skill data/skills.js の1件（modifier を持つもの）
   * @returns {{ mod:object, renewed:boolean }|null} 掛からなかったときは null
   */
  MonsterInstance.prototype.addModifier = function (skill) {
    var spec = skill && skill.modifier;
    if (!spec || !spec.effects || spec.effects.length === 0) return null;

    var existing = this.getModifier(skill.id);
    if (existing) {
      existing.remaining = spec.duration || 1;
      return { mod: existing, renewed: true };
    }

    var mod = {
      id: skill.id,
      name: skill.name,
      effects: spec.effects,
      remaining: spec.duration || 1
    };
    this.modifiers.push(mod);
    return { mod: mod, renewed: false };
  };

  /** 掛かっている効果を1つ探す（無ければ null） */
  MonsterInstance.prototype.getModifier = function (skillId) {
    for (var i = 0; i < this.modifiers.length; i++) {
      if (this.modifiers[i].id === skillId) return this.modifiers[i];
    }
    return null;
  };

  /**
   * 1ターン分進める。残りが尽きたものを取り除いて返す。
   * @returns {object[]} 切れた効果
   */
  MonsterInstance.prototype.tickModifiers = function () {
    var expired = [];
    var alive = [];

    for (var i = 0; i < this.modifiers.length; i++) {
      var mod = this.modifiers[i];
      mod.remaining--;
      if (mod.remaining > 0) alive.push(mod);
      else expired.push(mod);
    }
    this.modifiers = alive;
    return expired;
  };

  /** 掛かっている効果をすべて外す（戦闘が終わったとき） */
  MonsterInstance.prototype.clearModifiers = function () {
    this.modifiers = [];
  };

  // --- 状態異常（定義は data/statuses.js） ---

  /**
   * 状態異常をかける。
   *
   * 同じものが既に掛かっていれば、残りターンを建て直すだけ（バフ／デバフと同じ）。
   * 種類の違うものは重ねて掛かる。
   *
   * @param {string} statusId data/statuses.js のid
   * @param {MyGame.Random} [random] 残りターンを min〜max から選ぶのに使う
   * @returns {{ status:object, renewed:boolean }|null} 掛からなかったときは null
   */
  MonsterInstance.prototype.addStatus = function (statusId, random) {
    var def = this._data.getStatus ? this._data.getStatus(statusId) : null;
    if (!def) return null;

    var remaining = null;
    if (def.duration) {
      var min = def.duration.min || 1;
      var max = def.duration.max || min;
      remaining = random ? random.nextInt(min, max) : max;
    }

    var existing = this.getStatus(statusId);
    if (existing) {
      existing.remaining = remaining;
      return { status: existing, renewed: true };
    }

    var entry = { id: statusId, remaining: remaining, steps: 0 };
    this.statusEffects.push(entry);
    return { status: entry, renewed: false };
  };

  /** 掛かっている状態異常を1つ探す（無ければ null） */
  MonsterInstance.prototype.getStatus = function (statusId) {
    for (var i = 0; i < this.statusEffects.length; i++) {
      if (this.statusEffects[i].id === statusId) return this.statusEffects[i];
    }
    return null;
  };

  /** 掛かっている状態異常の定義を、掛かった順に返す（画面が印を出すのに使う） */
  MonsterInstance.prototype.getStatusDefs = function () {
    var out = [];
    for (var i = 0; i < this.statusEffects.length; i++) {
      var def = this._data.getStatus ? this._data.getStatus(this.statusEffects[i].id) : null;
      if (def) out.push(def);
    }
    return out;
  };

  /**
   * 状態異常を1つ外す。
   * @returns {object|null} 外した定義（掛かっていなければ null）
   */
  MonsterInstance.prototype.removeStatus = function (statusId) {
    for (var i = 0; i < this.statusEffects.length; i++) {
      if (this.statusEffects[i].id !== statusId) continue;
      this.statusEffects.splice(i, 1);
      return this._data.getStatus ? this._data.getStatus(statusId) : null;
    }
    return null;
  };

  /**
   * 1ターン分進める。残りが尽きたものを取り除いて返す。
   * 毒のように remaining が null のものは、ここでは減らない。
   * @returns {object[]} 切れた状態異常の定義
   */
  MonsterInstance.prototype.tickStatuses = function () {
    var expired = [];
    var alive = [];

    for (var i = 0; i < this.statusEffects.length; i++) {
      var entry = this.statusEffects[i];
      if (entry.remaining === null || entry.remaining === undefined) {
        alive.push(entry);
        continue;
      }
      entry.remaining--;
      if (entry.remaining > 0) alive.push(entry);
      else {
        var def = this._data.getStatus ? this._data.getStatus(entry.id) : null;
        if (def) expired.push(def);
      }
    }
    this.statusEffects = alive;
    return expired;
  };

  /**
   * 戦闘が終わったので、持ち帰らない状態異常を外す。
   * persists: true のもの（毒）だけが残る。
   */
  MonsterInstance.prototype.clearBattleStatuses = function () {
    var kept = [];
    for (var i = 0; i < this.statusEffects.length; i++) {
      var def = this._data.getStatus ? this._data.getStatus(this.statusEffects[i].id) : null;
      if (def && def.persists) kept.push(this.statusEffects[i]);
    }
    this.statusEffects = kept;
  };

  /** すべての状態異常を外す（拠点に帰ったとき） */
  MonsterInstance.prototype.clearAllStatuses = function () {
    this.statusEffects = [];
  };

  /**
   * ダンジョンを1歩進んだぶんの処理。
   * walkDamage を書いた状態異常（いまは毒だけ）がHPを削る。
   *
   * ★ HPは leaveAtLeast より下げない。
   *   戦闘の外で戦闘不能になる経路は、このゲームにまだ1つも無い
   *   （罠も leaveAtLeast: 1 で必ず1残す）。毒だけ例外にはしない。
   *
   * ★ 歩数は状態異常ごとに数える（entry.steps）。
   *   途中で毒が治って掛け直されたら、数えも0からになる。
   *
   * @returns {Array<{def:object, amount:number}>} 実際に削れたもの
   */
  MonsterInstance.prototype.walkStep = function () {
    var result = [];
    if (this.isFainted()) return result;   // 倒れている仲間はこれ以上削らない

    for (var i = 0; i < this.statusEffects.length; i++) {
      var entry = this.statusEffects[i];
      var def = this._data.getStatus ? this._data.getStatus(entry.id) : null;
      var walk = def && def.walkDamage;
      if (!walk) continue;

      entry.steps = (entry.steps || 0) + 1;
      if (entry.steps < (walk.everySteps || 1)) continue;
      entry.steps = 0;

      var floor = (walk.leaveAtLeast === undefined) ? 1 : walk.leaveAtLeast;
      var amount = Math.min(this.reduceDirectDamage(walk.amount || 1), Math.max(0, this.currentHp - floor));
      if (amount <= 0) continue;

      this.currentHp -= amount;
      result.push({ def: def, amount: amount });
    }
    return result;
  };

  /**
   * 状態異常への耐性（装備込み。-5〜10 に収まる。書かれていなければ 0）。
   *
   * 属性耐性とまったく同じ形にしてある。種族の statusResist に書き、
   * 装備で足すときも属性と同じ resistBonus を使う。
   * 覚える仕組みを2つにしないため。
   *
   * @param {string} statusId
   */
  MonsterInstance.prototype.getStatusResist = function (statusId) {
    var resists = (this._species && this._species.statusResist) || {};
    var value = resists[statusId];
    var base = (value === undefined) ? 0 : value;

    // 装備などで耐性そのものを底上げできる（毒よけの護符など）。
    // "status" を渡さないと属性耐性として引かれてしまうので注意
    var effects = this._getEffects();
    var total = effects ? (base + effects.getResistBonus(this, statusId, "status")) : base;
    return this._clampResist(total);
  };

  /**
   * 主として出ているあいだだけ効かない状態異常を決める。
   * 渡すのは DungeonScene._bossImmunities（data/battle.js の bossImmuneToStatus
   * ＋ その主だけの data/bosses.js の immuneToStatus）。
   *
   * 種族そのものに書かず、ここで別に持つのは statMultiplier と同じ理由。
   * 仲間に迎えたときは、その種族そのままの耐性に戻る。
   */
  MonsterInstance.prototype.setBossStatusImmunity = function (list) {
    this._bossImmuneToStatus = list || [];
  };

  /**
   * 弱体への耐性（-5〜10。2026-10-15）。相手から掛けられる弱体が入る確率を下げる（表は状態異常の耐性と同じ）。
   * 種族の debuffResist（書かなければ baseValue ＝ data/battle.js の debuffResistBase）。
   * 主として出ているあいだは setDebuffResist の値で上書きする
   */
  MonsterInstance.prototype.getDebuffResist = function (baseValue) {
    var own = this._species && this._species.debuffResist;
    var value = (typeof this._debuffResistOverride === "number")
      ? this._debuffResistOverride
      : ((typeof own === "number") ? own : (baseValue || 0));
    return Math.max(-5, Math.min(10, value));
  };

  /** 主として立ちはだかるあいだの弱体への耐性（DungeonScene._startBossBattle）。数でなければ外す */
  MonsterInstance.prototype.setDebuffResist = function (value) {
    this._debuffResistOverride = (typeof value === "number") ? value : null;
  };

  /** その状態異常を完全に無効化するか（主が毒を受け付けない、など） */
  MonsterInstance.prototype.isImmuneToStatus = function (statusId) {
    var list = (this._species && this._species.immuneToStatus) || [];
    if (list.indexOf(statusId) >= 0) return true;

    var boss = this._bossImmuneToStatus || [];
    return boss.indexOf(statusId) >= 0;
  };

  MonsterInstance.prototype.getSpecies = function () { return this._species; };

  /**
   * 表示名。
   * 名前をつけていればそれを、つけていなければ種族名を返す。
   * 同じ名前の相手が同時に出たときは displaySuffix（"A" など）が付き、
   * ログ上で見分けられるようになる。
   */
  MonsterInstance.prototype.getName = function () {
    var base = this.nickname || (this._species ? this._species.name : this.speciesId);
    return this.displaySuffix ? (base + this.displaySuffix) : base;
  };

  /**
   * 名前をつける。
   * 空にすると種族名に戻る。長すぎるぶんは data/naming.js の maxLength で切る。
   * @param {string} name
   * @returns {string|null} 実際についた名前（種族名に戻した場合は null）
   */
  MonsterInstance.prototype.setNickname = function (name) {
    var text = (name === null || name === undefined) ? "" : String(name);
    // 前後の空白は名前として意味を持たないので落とす
    text = text.replace(/^[\s　]+|[\s　]+$/g, "");

    // 漢字・絵文字も1文字と数えて切る（2026-10-27 キーボード入力にしたため。Array.from はサロゲートペアを1文字にする）
    var max = ((this._data && this._data.naming) || {}).maxLength;
    var chars = Array.from ? Array.from(text) : text.split("");
    if (typeof max === "number" && chars.length > max) text = chars.slice(0, max).join("");

    this.nickname = text || null;
    return this.nickname;
  };
  MonsterInstance.prototype.getSpriteId = function () {
    return this._species ? this._species.sprite : null;
  };

  /**
   * 画面に出るときの大きさの倍率（data/monsters.js の sizeScale）。
   * 書いていない種族は 1.0。
   *
   * 絵の解像度（16×16 / 32×32 / 48×48）とは別物。
   * 解像度は「どれだけ細かく描けるか」、こちらは「どれだけ大きく見えるか」。
   */
  MonsterInstance.prototype.getSizeScale = function () {
    var scale = this._species && this._species.sizeScale;
    return (typeof scale === "number" && scale > 0) ? scale : 1;
  };

  /**
   * 姿の名前（"squash" / "stretch" / "sleep" など）に対応する絵のid。
   * data/monsters.js の poses に書いた種族だけが持つ。無ければ null（ふつうの絵のまま）
   */
  MonsterInstance.prototype.getPoseSpriteId = function (pose) {
    if (!pose || !this._species || !this._species.poses) return null;
    return this._species.poses[pose] || null;
  };

  /** ふだんの絵の動かし方（data/motions.js のid）。種族が決める */
  MonsterInstance.prototype.getMotionId = function () {
    return this._species ? this._species.motion : null;
  };

  /**
   * 場面ごとの動き（"attack" / "hit" など）。
   *
   * 種族が motions を書いていなければ、data/motions.js の motionDefaults を使う。
   * こうしておくと、モンスターを1体足すのにモーションの行を書かなくてよい。
   *
   * 種族側は「変えたい場面だけ」書けばよく、
   * その場面だけ動かしたくなければ null と書く（既定へは落ちない）。
   *
   * @param {string} kind data/motions.js の motionDefaults.action のキー
   */
  MonsterInstance.prototype.getActionMotionId = function (kind) {
    var motions = (this._species && this._species.motions) || null;
    if (motions && Object.prototype.hasOwnProperty.call(motions, kind)) {
      return motions[kind] || null;
    }

    var defaults = (this._data && this._data.motionDefaults) || {};
    return (defaults.action && defaults.action[kind]) || null;
  };

  /**
   * 動きの位相のずらし（0〜1）。
   * 同じ種族が並んだときに全員が同じ動きで揃わないよう、個体ごとに変える。
   * 生成時に決めた値なので、画面を開き直しても動きが飛ばない。
   */
  MonsterInstance.prototype.getMotionPhase = function () {
    if (this._motionPhase === undefined) {
      var ivs = this.ivs || {};
      var seed = this.speciesId + ":" + this.natureId + ":" +
        [ivs.hp, ivs.attack, ivs.defense, ivs.speed].join(",");
      this._motionPhase = NS.Motion ? NS.Motion.phaseFromSeed(seed) : 0;
    }
    return this._motionPhase;
  };
  MonsterInstance.prototype.getNature = function () {
    return (this._data.natures || {})[this.natureId] || null;
  };

  /**
   * この個体のレベル上限。
   * 種族の maxLevel を使い、無ければ既定値。どちらも levelCap は超えない。
   */
  MonsterInstance.prototype.getMaxLevel = function () {
    var growth = this._data.growth || {};
    var cap = growth.levelCap || 99;
    var speciesMax = this._species && this._species.maxLevel;
    var max = speciesMax || growth.defaultMaxLevel || cap;
    return Math.min(cap, max);
  };

  /**
   * 指定属性に対する耐性（装備込み。-5〜10 に収まる。書かれていなければ 0）。
   * @param {string} elementId
   */
  MonsterInstance.prototype.getResistance = function (elementId) {
    var resistances = (this._species && this._species.resistances) || {};
    var value = resistances[elementId];
    var base = (value === undefined) ? 0 : value;

    // 装備などで耐性そのものを底上げできる（炎よけの札など）
    var effects = this._getEffects();
    var total = effects ? (base + effects.getResistBonus(this, elementId)) : base;
    return this._clampResist(total);
  };

  /**
   * 攻撃をかわす確率（0〜1）。書かれていなければ 0。
   * ほとんどのモンスターは0で、素早い相手だけが持つ。
   */
  MonsterInstance.prototype.getEvasion = function () {
    var value = this._species && this._species.evasion;
    return (typeof value === "number") ? Math.max(0, Math.min(1, value)) : 0;
  };

  /**
   * 通常攻撃の演出の型（data/effects.js の shapes のid）。
   * 書かれていなければ null で、そのときは技側の effect が使われる。
   * 噛みつく相手・硬い体でぶつかる相手で見た目を変えるために使う。
   */
  MonsterInstance.prototype.getAttackEffectId = function () {
    return (this._species && this._species.attackEffect) || null;
  };

  /** 指定属性を完全に無効化するか */
  MonsterInstance.prototype.isImmuneTo = function (elementId) {
    var immunities = (this._species && this._species.immunities) || [];
    return immunities.indexOf(elementId) >= 0;
  };

  // --- ステータス計算（式・数値は data/growth.js） ---

  /**
   * 指定ステータスの成長率の段階を返す（from の小さい順）。
   *
   * monsters.js の growthRate は数値・オブジェクト・段階の配列で書ける。
   *   growthRate: 0.08                      … 全ステータス共通
   *   growthRate: { hp: 0.12, attack: 0.06 } … ステータスごと
   *   growthRate: { hp: [{ from: 1, rate: 0.16 }, { from: 22, rate: 0.20 }] }
   *                                          … レベルで成長率が変わる（何段階でも）
   * 書かれていない項目は default → growth.js の defaultGrowthRate の順に使い、
   * どの値も minGrowthRate より小さくはしない。maxGrowthRate は書いてあるときだけ効く（今は書いていない）。
   *
   * @param {string} statKey "hp" / "attack" / "defense" / "speed" / "pp"
   * @returns {{from:number, rate:number}[]}
   */
  MonsterInstance.prototype._growthStages = function (statKey) {
    var growth = this._data.growth || {};
    var fallback = numberOr(growth.defaultGrowthRate, 0);
    var defined = this._species && this._species.growthRate;

    var value;
    if (typeof defined === "number") {
      value = defined;
    } else if (defined && typeof defined === "object") {
      value = defined[statKey];
      if (value === undefined) value = defined["default"];
    }
    if (value === undefined || value === null) value = fallback;

    var clamp = function (rate) {
      var min = numberOr(growth.minGrowthRate, rate);
      var max = numberOr(growth.maxGrowthRate, rate);
      return Math.max(min, Math.min(max, rate));
    };

    if (!Array.isArray(value)) return [{ from: 1, rate: clamp(numberOr(value, fallback)) }];

    var stages = [];
    for (var i = 0; i < value.length; i++) {
      if (!value[i]) continue;
      stages.push({ from: numberOr(value[i].from, 1), rate: clamp(numberOr(value[i].rate, fallback)) });
    }
    if (stages.length === 0) return [{ from: 1, rate: clamp(fallback) }];
    stages.sort(function (a, b) { return a.from - b.from; });
    return stages;
  };

  /**
   * そのレベルで効いている成長率（図鑑・様子を見るなどの表示用）。
   * @param {string} statKey
   * @param {number} [level] 省略するといまのレベル
   */
  MonsterInstance.prototype.getGrowthRate = function (statKey, level) {
    return stageAt(this._growthStages(statKey), level || this.level, "rate", 0);
  };

  /**
   * Lv1 から level までに伸びた量（成長率の合計）。ステータス計算の本体。
   *
   *   レベルが1上がるたびに、「(そのレベルで効いている成長率 + 全体の足し算) × 全体の倍率」だけ伸びる。
   *   全体の足し算・倍率は data/growth.js の globalGrowth（全モンスター共通。Lv〇から）。
   *
   * ★ 段階が切り替わっても、それまでに伸びた分はそのまま。変わるのは「そこから先」の伸びだけ。
   *   段階も全体の倍率も無ければ (level - 1) × 成長率 になり、α-9 までと同じ。
   *
   * @param {string} statKey
   * @param {number} [level] 省略するといまのレベル
   */
  MonsterInstance.prototype.getGrowthProgress = function (statKey, level) {
    // fixedStatLevel … 敵のあいだだけ、そのレベルの能力値で固定する（ジュエル。EncounterSystem.createEnemyFrom）
    level = level || this.fixedStatLevel || this.level;
    if (level <= 1) return 0;

    var stages = this._growthStages(statKey);
    var global = globalGrowthStages(this._data);

    // 段階と全体の倍率の切り替わりで区切り、区間ごとにまとめて足す
    var points = [2];
    var addPoint = function (from) {
      if (from > 2 && from <= level && points.indexOf(from) < 0) points.push(from);
    };
    for (var i = 0; i < stages.length; i++) addPoint(stages[i].from);
    for (var j = 0; j < global.length; j++) addPoint(global[j].from);
    points.sort(function (a, b) { return a - b; });

    // 1レベルあたりの伸び = (種族の成長率 + 全体の足し算) × 全体の倍率
    var total = 0;
    for (var k = 0; k < points.length; k++) {
      var start = points[k];
      var end = (k + 1 < points.length) ? points[k + 1] : level + 1;
      var perLevel = (stageAt(stages, start, "rate", 0) + stageAt(global, start, "add", 0))
                   * stageAt(global, start, "multiplier", 1);
      total += (end - start) * Math.max(0, perLevel);
    }
    return total;
  };

  /**
   * 段階の並び（from の小さい順）から、そのレベルで効いている値を取り出す。
   * 最初の段階の from より前のレベルは、最初の段階の値を使う。
   */
  function stageAt(stages, level, key, fallback) {
    if (!stages || stages.length === 0) return fallback;
    var found = stages[0];
    for (var i = 1; i < stages.length; i++) {
      if (stages[i].from <= level) found = stages[i];
    }
    return numberOr(found[key], fallback);
  }

  /**
   * data/growth.js の globalGrowth を from の小さい順に並べたもの。
   * 最初の from より前は倍率 1（何も変えない）なので、先頭に Lv1 の段階を足しておく
   */
  function globalGrowthStages(data) {
    var list = ((data && data.growth) || {}).globalGrowth || [];
    var result = [];
    for (var i = 0; i < list.length; i++) {
      if (!list[i]) continue;
      result.push({ from: numberOr(list[i].from, 1),
                    multiplier: numberOr(list[i].multiplier, 1),
                    add: numberOr(list[i].add, 0) });
    }
    result.sort(function (a, b) { return a.from - b.from; });
    if (result.length > 0 && result[0].from > 1) result.unshift({ from: 1, multiplier: 1, add: 0 });
    return result;
  }

  /**
   * 耐性の合計を、決められた範囲（data/battle.js の resistance）に収める。
   *
   * 属性・状態異常のどちらもここを通す。上限は immuneAt と同じ値なので、
   * 「完全無効より上」は作れない。装備を重ねても無駄が出るだけで壊れない。
   *
   * @param {number} value 種族の値＋装備などの合計
   */
  MonsterInstance.prototype._clampResist = function (value) {
    var config = ((this._data.battle || {}).resistance) || {};
    var max = (config.maxValue === undefined) ? config.immuneAt : config.maxValue;
    var min = config.minValue;

    if (max !== undefined && value > max) return max;
    if (min !== undefined && value < min) return min;
    return value;
  };

  /** 効果（特性・装備）の集計係。必要になったときだけ作る */
  MonsterInstance.prototype._getEffects = function () {
    if (!NS.EffectSystem) return null;
    if (!this._effectSystem) this._effectSystem = new NS.EffectSystem(this._data);
    return this._effectSystem;
  };

  /**
   * 特性・装備によるステータス倍率を返す。
   * 仕組みが読み込まれていない場合でも動くよう、無ければ 1 を返す。
   * @param {string} stat "hp" / "attack" / "defense" / "speed" / "pp"
   */
  MonsterInstance.prototype.getEffectStatMultiplier = function (stat) {
    var effects = this._getEffects();
    if (!effects) return 1;

    // 「HPが少ないとき」のような条件は最大HPを見る。
    // その最大HP自体に効果が掛かっていると堂々巡りになるため、
    // 計算中にもう一度呼ばれたら倍率なしとして扱う。
    if (this._calculatingEffects) return 1;

    this._calculatingEffects = true;
    try {
      return effects.getStatMultiplier(this, stat);
    } finally {
      this._calculatingEffects = false;
    }
  };

  /** 特性・装備によるステータスへの加算（無ければ 0） */
  MonsterInstance.prototype.getEffectStatBonus = function (stat) {
    var effects = this._getEffects();
    if (!effects) return 0;
    if (this._calculatingEffects) return 0;

    this._calculatingEffects = true;
    try {
      return effects.getStatBonus(this, stat);
    } finally {
      this._calculatingEffects = false;
    }
  };

  /**
   * 実効ステータスを計算する。
   * 式: floor( 基礎値 × (1 + 伸びた量) × 性格補正 × 効果倍率 ) + 個体値 + 効果加算
   *   伸びた量       … getGrowthProgress（段階が無ければ (Lv-1) × 成長率）
   *   効果倍率／効果加算 … 特性と装備（EffectSystem がまとめて集計する）
   * fixedStatLevel があるあいだは、そのレベルの表の値に固定する（性格補正と個体値も入れない）
   */
  MonsterInstance.prototype._calcStat = function (baseKey, ivKey, natureKey) {
    if (!this._species) return 1;
    var fixed = !!this.fixedStatLevel;
    var progress = this.getGrowthProgress(ivKey);
    var nature = fixed ? null : this.getNature();
    var natureMul = nature ? (nature[natureKey] || 1) : 1;
    var effectMul = this.getEffectStatMultiplier(ivKey);

    var base = this._species[baseKey] || 0;
    // 固定のときは「表の値 × 倍率」を四捨五入（防御 200×5＝1000。HP 10×0.3〜0.5＝3〜5 で 5 も同じように出す）
    var value = fixed
      ? Math.round(Math.floor(base * (1 + progress)) * effectMul)
      : base * (1 + progress) * natureMul * effectMul;

    // 加算はマイナスの装備でも0未満にならないようにする
    var total = Math.floor(value) + (fixed ? 0 : (this.ivs[ivKey] || 0)) + this.getEffectStatBonus(ivKey);
    return this._capStat(Math.max(1, total));
  };

  /**
   * 能力値の上限（data/growth.js の statCap。α-10 で 9999）で止める。
   * 装備・加護・戦闘中の強化もすべて掛けたあとの値に効く（画面の欄が4桁までの幅のため）。
   *
   * ★ 主・特殊な出方の敵（setEncounterMultipliers の補正が掛かっている間）は止めない。
   *   主の強さは倍率で作っているので、上限で止めると倍率が効かなくなるため
   */
  MonsterInstance.prototype._capStat = function (value) {
    var cap = (this._data.growth || {}).statCap;
    if (typeof cap !== "number") return value;
    if (this.encounterEffects && this.encounterEffects.length > 0) return value;
    return Math.min(cap, value);
  };

  MonsterInstance.prototype.getMaxHp = function () {
    return this._calcStat("baseHp", "hp", "hp");
  };
  MonsterInstance.prototype.getAttack = function () {
    return this._calcStat("baseAttack", "attack", "attack");
  };
  MonsterInstance.prototype.getDefense = function () {
    return this._calcStat("baseDefense", "defense", "defense");
  };
  /** 素早さ。大きいほど戦闘で先に行動する */
  MonsterInstance.prototype.getSpeed = function () {
    return this._calcStat("baseSpeed", "speed", "speed");
  };

  /**
   * PPの最大値。技を使うのに必要な資源で、通常攻撃には使わない。
   * 式はステータスと同じだが、性格補正と個体値は掛からない。
   */
  MonsterInstance.prototype.getMaxPp = function () {
    if (!this._species) return 0;

    var base = this._species.basePp || 0;
    var value = base * (1 + this.getGrowthProgress("pp"))
              * this.getEffectStatMultiplier("pp");

    return this._capStat(Math.max(1, Math.floor(value) + this.getEffectStatBonus("pp")));
  };

  // --- PP 操作 ---

  /**
   * この個体がその技に払うPP。特性「カチカチ」は ×1.5（端数は切り上げ。PP1 の技は 2、PP3 の技は 5）。
   * 戦闘（BattleSystem.ppCostOf）と探索中（Game.useFieldSkill）、仲間画面の表示が同じ値を見る。
   * 小数の誤差で 10 × 1.3 が 14 にならないよう、切り上げる前に少しだけ引く
   */
  MonsterInstance.prototype.getSkillPpCost = function (skill) {
    var cost = (skill && skill.pp) || 0;
    if (cost <= 0) return 0;
    var effects = this._getEffects();
    var multiplier = (effects && effects.getPpCostMultiplier) ? effects.getPpCostMultiplier(this) : 1;
    return (multiplier === 1) ? cost : Math.ceil(cost * multiplier - 1e-9);
  };

  /** その消費量を払えるか */
  MonsterInstance.prototype.canPayPp = function (cost) {
    return this.currentPp >= (cost || 0);
  };

  /**
   * PPを支払う。足りなければ何もせず false。
   * @returns {boolean} 支払えたか
   */
  MonsterInstance.prototype.payPp = function (cost) {
    cost = cost || 0;
    if (!this.canPayPp(cost)) return false;
    this.currentPp -= cost;
    return true;
  };

  // --- HP 操作 ---

  /**
   * 倒れているか。
   * 特性「亡者の魂」で踏みとどまっているあいだ（_undying。BattleSystem が立てる）は、
   * HPが0でも倒れていない扱いにする。そのターンの終わりに BattleSystem が外す
   */
  MonsterInstance.prototype.isFainted = function () {
    return this.currentHp <= 0 && !this._undying;
  };

  /**
   * 攻撃のほかのダメージ（毒・反動・罠）を、特性「カチカチ」のぶん減らす。最低1は受ける。
   * 攻撃のダメージは BattleSystem.calcDamage の damageTaken で減るので、ここを通さない。
   * 即死はダメージではないので減らない
   */
  MonsterInstance.prototype.reduceDirectDamage = function (amount) {
    if (amount <= 0) return amount;
    var effects = this._getEffects();
    var multiplier = (effects && effects.getAllDamageMultiplier) ? effects.getAllDamageMultiplier(this) : 1;
    return (multiplier === 1) ? amount : Math.max(1, Math.floor(amount * multiplier));
  };

  MonsterInstance.prototype.takeDamage = function (amount) {
    this.currentHp = Math.max(0, this.currentHp - amount);
    return this.currentHp;
  };

  MonsterInstance.prototype.heal = function (amount) {
    // 亡者の魂で踏みとどまっている者は、回復を受け付けない（そのターンの終わりに倒れる）
    if (this._undying) return this.currentHp;
    this.currentHp = Math.min(this.getMaxHp(), this.currentHp + amount);
    return this.currentHp;
  };

  /** 全回復（HPとPPの両方を戻す） */
  MonsterInstance.prototype.healFull = function () {
    this.currentHp = this.getMaxHp();
    this.currentPp = this.getMaxPp();
  };

  // --- 経験値・レベルアップ ---

  /**
   * この個体を倒したときに相手が得る経験値。
   * レベルが高い相手ほど多くもらえる。
   *   floor( expReward × (1 + (Lv - 1) × expRewardPerLevel) )
   * 種族に expFixed: true と書くと、レベルに関係なく expReward そのまま（ジュエル 3000）
   */
  MonsterInstance.prototype.getExpReward = function () {
    if (!this._species) return 0;

    // rewardMultiplier … 出る場所の表で決めた倍率（EncounterSystem。蔦這う回廊のカゲヅタ）
    var base = (this._species.expReward || 0) * (this.rewardMultiplier || 1);
    var perLevel = (this._data.growth || {}).expRewardPerLevel;
    if (!perLevel || this._species.expFixed) return Math.floor(base);

    return Math.floor(base * (1 + (this.level - 1) * perLevel));
  };

  /**
   * この個体を倒したときに得られるゴールド。
   * 経験値と同じく、レベルが高い相手ほど多い。
   */
  MonsterInstance.prototype.getGoldReward = function () {
    if (!this._species) return 0;

    var base = (this._species.goldReward || 0) * (this.rewardMultiplier || 1);
    var perLevel = (this._data.growth || {}).goldRewardPerLevel;
    if (!perLevel) return Math.floor(base);

    return Math.floor(base * (1 + (this.level - 1) * perLevel));
  };

  /**
   * 次のレベルに必要な経験値: floor( expBase × level ^ expExponent × 段階の倍率 )
   *   段階の倍率 … data/growth.js の expStages。「Lv〇に上がる分から何倍」（全員共通）
   * @param {number} [level] 省略するといまのレベル（そのレベルから次へ上がるのに要る量）
   */
  MonsterInstance.prototype.getExpToNextLevel = function (level) {
    level = level || this.level;
    var growth = this._data.growth || {};
    var base = growth.expBase || 10;
    var exponent = growth.expExponent || 1.5;
    return Math.floor(base * Math.pow(level, exponent) * expStageMultiplier(growth, level + 1));
  };

  /**
   * これまでに得た経験値の合計（いまのレベルまでに使った分 ＋ いまのレベルで貯めている分）。
   * 保存はしておらず、いまの必要経験値の表から計算し直す
   */
  MonsterInstance.prototype.getTotalExp = function () {
    var total = this.exp || 0;
    for (var level = 1; level < this.level; level++) total += this.getExpToNextLevel(level);
    return total;
  };

  /** そのレベルに上がるのに掛かる倍率（data/growth.js の expStages。無ければ 1） */
  function expStageMultiplier(growth, targetLevel) {
    var stages = growth.expStages || [];
    var best = null;
    for (var i = 0; i < stages.length; i++) {
      if (!stages[i] || numberOr(stages[i].from, 1) > targetLevel) continue;
      if (!best || stages[i].from > best.from) best = stages[i];
    }
    return best ? numberOr(best.multiplier, 1) : 1;
  }

  /**
   * 経験値を加算し、必要ならレベルアップする。
   * @returns {{levels:number, learned:string[]}} 上がったレベル数と新しく覚えた技
   */
  MonsterInstance.prototype.gainExp = function (amount) {
    var maxLevel = this.getMaxLevel();
    var result = { levels: 0, learned: [] };

    this.exp += amount;
    while (this.level < maxLevel && this.exp >= this.getExpToNextLevel()) {
      this.exp -= this.getExpToNextLevel();
      this.level++;
      result.levels++;

      // レベルアップで覚える技を習得
      var newSkills = NS.MonsterData.skillsLearnedAtLevel(this._species, this.level);
      for (var i = 0; i < newSkills.length; i++) {
        if (this.skills.indexOf(newSkills[i]) === -1) {
          this.skills.push(newSkills[i]);
          result.learned.push(newSkills[i]);
        }
      }
    }
    // 最大HPを超えないよう補正
    this.currentHp = Math.min(this.currentHp, this.getMaxHp());
    return result;
  };

  // --- 愛情度（data/affection.js） ---

  /** 段階の表（上から順） */
  MonsterInstance.prototype._affectionStages = function () {
    return ((this._data && this._data.affection) || {}).stages || [];
  };

  /** 愛情度から段階の番号を求める（0 = 出会い） */
  MonsterInstance.prototype._stageIndexOf = function (value) {
    var stages = this._affectionStages();
    var index = 0;
    for (var i = 0; i < stages.length; i++) {
      if (value >= (stages[i].need || 0)) index = i;
    }
    return index;
  };

  /** いまの段階の番号（0 = 出会い） */
  MonsterInstance.prototype.getAffectionStageIndex = function () {
    return this._stageIndexOf(this.affection || 0);
  };

  /** いまの段階の定義（{ id, name, need, … }） */
  MonsterInstance.prototype.getAffectionStage = function () {
    return this._affectionStages()[this.getAffectionStageIndex()] || null;
  };

  /** 次の段階の定義（いちばん上なら null） */
  MonsterInstance.prototype.getNextAffectionStage = function () {
    return this._affectionStages()[this.getAffectionStageIndex() + 1] || null;
  };

  /** いまの段階までに上がった能力の割合の合計（0.06 = +6%） */
  MonsterInstance.prototype.getAffectionBonus = function () {
    var stages = this._affectionStages();
    var upTo = this.getAffectionStageIndex();
    var total = 0;
    for (var i = 0; i <= upTo && i < stages.length; i++) total += stages[i].statBonus || 0;
    return total;
  };

  /**
   * 愛情度で上がっている能力。書き方は特性・装備と同じ effects なので、
   * EffectSystem がここも読めば、ステータス計算は何も変えなくてよい。
   *   ・慣れ・信頼の全能力の上がり（どの種族も同じ）
   *   ・絆に届いていれば、その種族だけの報酬の effects（data/monsters.js の bondReward）
   */
  MonsterInstance.prototype.getAffectionEffects = function () {
    var effects = [];
    var bonus = this.getAffectionBonus();
    if (bonus > 0) {
      var stats = ((this._data && this._data.affection) || {}).stats || [];
      for (var i = 0; i < stats.length; i++) {
        effects.push({ type: "statMultiplier", stat: stats[i], value: 1 + bonus });
      }
    }
    if (this.hasReachedBondReward()) {
      var reward = this.getBondReward();
      if (reward && reward.effects) effects = effects.concat(reward.effects);
    }
    return effects;
  };

  /**
   * その種族だけの報酬（data/monsters.js の bondReward）。決まっていなければ null。
   * 古い書き方（bondSkill: "技のid"）も読める
   */
  MonsterInstance.prototype.getBondReward = function () {
    var sp = this._species;
    if (!sp) return null;
    if (sp.bondReward) return sp.bondReward;
    if (sp.bondSkill) return { skill: sp.bondSkill };
    return null;
  };

  /** 種族ごとの報酬を受け取る段階（bondReward: true）に届いているか */
  MonsterInstance.prototype.hasReachedBondReward = function () {
    var stages = this._affectionStages();
    var upTo = this.getAffectionStageIndex();
    for (var i = 0; i <= upTo && i < stages.length; i++) {
      if (stages[i].bondReward) return true;
    }
    return false;
  };

  /**
   * 愛情度を足す。段階が上がったら、その段階の専用技も覚える。
   * @returns {{from:number, to:number, learned:string[]}} 段階の番号（上がっていなければ from === to）
   */
  MonsterInstance.prototype.gainAffection = function (amount) {
    var from = this.getAffectionStageIndex();
    var maxHpBefore = this.getMaxHp();
    var maxPpBefore = this.getMaxPp();

    this.affection = (this.affection || 0) + (amount || 0);
    var to = this.getAffectionStageIndex();
    var learned = [];

    if (to > from) {
      // 最大値が上がったぶんだけ、いまの値も上げる（上がった瞬間に減って見えないように）
      this.currentHp = Math.min(this.getMaxHp(), this.currentHp + Math.max(0, this.getMaxHp() - maxHpBefore));
      this.currentPp = Math.min(this.getMaxPp(), this.currentPp + Math.max(0, this.getMaxPp() - maxPpBefore));
      learned = this._learnBondSkill();
    }
    return { from: from, to: to, learned: learned };
  };

  /**
   * 報酬を受け取る段階に届いていれば、その種族の報酬の技（bondReward.skill）を覚える。
   * 技を書いていない種族（能力・耐性だけの報酬、まだ決まっていない）では何もしない。
   * 能力・耐性のほうは getAffectionEffects が掛けるので、ここでは扱わない。
   * @returns {string[]} 新しく覚えた技
   */
  MonsterInstance.prototype._learnBondSkill = function () {
    var reward = this.getBondReward();
    var skillId = reward && reward.skill;
    if (!skillId || !this._data.getSkill(skillId)) return [];
    if (this.skills.indexOf(skillId) >= 0) return [];
    if (!this.hasReachedBondReward()) return [];

    this.skills.push(skillId);
    return [skillId];
  };

  // --- 作戦（v1.0.0） ---

  /** いまの作戦の定義（data/battle.js の tactics.list）。決めていなければ既定のもの */
  MonsterInstance.prototype.getTactic = function () {
    var tactics = (this._data.battle || {}).tactics || {};
    var list = tactics.list || {};
    return list[this.tactic] || list[tactics.default] || null;
  };

  /** 作戦を変える。無い id は既定に戻す（null で保存） */
  MonsterInstance.prototype.setTactic = function (id) {
    var tactics = (this._data.battle || {}).tactics || {};
    this.tactic = (id && (tactics.list || {})[id] && id !== tactics.default) ? id : null;
    return this.tactic;
  };

  /** 作戦で動くか（コマンドを聞かない） */
  MonsterInstance.prototype.isTacticAi = function () {
    var tactic = this.getTactic();
    return !!(tactic && tactic.ai);
  };

  // --- セーブ・ロード ---

  /**
   * 保存用のデータへ変換する。
   * 種族データ（不変）は保存せず、種族idだけを持つ。
   * こうしておけば data/monsters.js を調整しても、既存のセーブがそのまま使える。
   */
  MonsterInstance.prototype.toSaveData = function () {
    return {
      speciesId: this.speciesId,
      nickname: this.nickname || null,
      level: this.level,
      exp: this.exp,
      currentHp: this.currentHp,
      currentPp: this.currentPp,
      natureId: this.natureId,
      ivs: { hp: this.ivs.hp, attack: this.ivs.attack,
             defense: this.ivs.defense, speed: this.ivs.speed || 0 },
      skills: this.skills.slice(),
      equipment: (this.equipment || []).slice(),
      affection: this.affection || 0,
      // 作戦。既定（命令する）のままなら書かない
      tactic: this.tactic || undefined,
      // 最初の相棒（はじめから一緒にいるスライム）。逃がせない。物語の場面にも立つ
      partner: this.partner ? true : undefined,
      // 状態異常。ふつうは拠点へ帰った時点で空になるが、
      // 毒（persists）はダンジョンの途中でセーブすると残ったままになる。
      // これを保存しないと、セーブして再開するだけで毒が消せてしまう
      statusEffects: this.statusEffects.map(function (entry) {
        return { id: entry.id, remaining: entry.remaining, steps: entry.steps || 0 };
      })
    };
  };

  /**
   * 保存用データから個体を復元する。
   * @param {object} saved toSaveData() が返した内容
   * @param {MyGame.GameData} gameData
   * @returns {MonsterInstance|null} 種族が見つからない場合は null
   */
  MonsterInstance.fromSaveData = function (saved, gameData) {
    if (!saved || !gameData.getMonsterData(saved.speciesId)) return null;

    // 定義が消えた装備は読み飛ばす（データを変更しても安全に読めるように）
    var equipment = [];
    var saved_equipment = saved.equipment || [];
    for (var i = 0; i < saved_equipment.length; i++) {
      var item = gameData.getItem(saved_equipment[i]);
      if (item && item.equip) equipment.push(saved_equipment[i]);
    }

    // 技も同じように、データを変更しても読めるようにそろえ直す。
    // セーブは覚えている技の一覧をそのまま持っているので、これをしないと
    // data/monsters.js の learnset に技を足しても、すでに居る個体には一生届かない。
    var skills = [];
    var savedSkills = saved.skills || [];
    for (var s = 0; s < savedSkills.length; s++) {
      // 定義が消えた技は読み飛ばす
      if (gameData.getSkill(savedSkills[s]) && skills.indexOf(savedSkills[s]) === -1) {
        skills.push(savedSkills[s]);
      }
    }
    // そのレベルなら覚えているはずの技を補う
    var species = gameData.getMonsterData(saved.speciesId);
    var learned = NS.MonsterData.skillsUpToLevel(species, saved.level);
    for (var t = 0; t < learned.length; t++) {
      if (skills.indexOf(learned[t]) === -1) skills.push(learned[t]);
    }

    var instance = new MonsterInstance(saved.speciesId, saved.level, gameData, {
      nature: saved.natureId,
      ivs: saved.ivs,
      skills: skills,
      equipment: equipment
    });
    // 名前は setNickname を通す（古いセーブや、長さの決まりが変わった場合にそろえる）
    instance.setNickname(saved.nickname);
    instance.exp = saved.exp || 0;
    // 最初の相棒の印。古いセーブには無いので、Game._ensurePartner が付け直す
    instance.partner = !!saved.partner;
    // 愛情度。古いセーブには無いので 0 から。
    // HP・PP を戻すより先に入れる（最大値が愛情度で上がっているため）
    instance.affection = saved.affection || 0;
    // 作戦。古いセーブには無い・定義が消えた作戦は既定（命令する）に戻す
    instance.setTactic(saved.tactic);
    // 絆の報酬の技があとから決まった場合も、もう絆に届いている仲間には覚えさせる
    instance._learnBondSkill();
    // 最大値を超えないように補正してから戻す
    instance.currentHp = Math.max(0, Math.min(instance.getMaxHp(), saved.currentHp));
    // 古いセーブには PP が無いので、その場合は満タンにする
    instance.currentPp = (saved.currentPp === undefined)
      ? instance.getMaxPp()
      : Math.max(0, Math.min(instance.getMaxPp(), saved.currentPp));

    // 状態異常。定義が消えたものは読み飛ばす（データを変更しても安全に読めるように）
    instance.statusEffects = [];
    var savedStatuses = saved.statusEffects || [];
    for (var u = 0; u < savedStatuses.length; u++) {
      if (!gameData.getStatus || !gameData.getStatus(savedStatuses[u].id)) continue;
      instance.statusEffects.push({
        id: savedStatuses[u].id,
        remaining: savedStatuses[u].remaining,
        steps: savedStatuses[u].steps || 0
      });
    }
    return instance;
  };

  /** 数値として使える値ならそれを、そうでなければ既定値を返す */
  function numberOr(value, fallback) {
    return (typeof value === "number") ? value : fallback;
  }

  NS.MonsterInstance = MonsterInstance;
})(window.MyGame);
