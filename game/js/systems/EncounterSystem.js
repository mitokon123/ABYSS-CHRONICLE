/**
 * EncounterSystem.js
 * 「敵と遭遇するか」の判定と、遭遇した敵の一団を作ることを担当する。
 *
 * どの敵が出るかはダンジョンごとに違うので、挑んでいるダンジョンの定義を受け取る。
 * さらに階ごとの上書き（perFloor）があれば、そちらを優先する。
 * 書かれていない項目は data/enemies.js の既定値を使う。
 *
 * ▼ 設定の探す順番
 *   出現レベル … 種族ごとの指定 → その階の指定 → その場所の指定 → 全体の既定
 *   敵の数     … その階の指定 → その場所の指定 → 全体の既定
 *   出現表     … その階の指定 → その場所の指定
 *
 * ▼ 出現表の1件に書けるもの（data/dungeons.js）
 *   species        : 種族id
 *   weight         : 出やすさ
 *   minFloor / maxFloor : その階にだけ出す
 *   minLevel / maxLevel : その種族だけレベル範囲を変える
 *   solo           : true なら、引かれたときにその1体だけの戦いになる
 *   statMultiplier : その戦いのあいだだけ掛かる倍率（主と同じ仕組み。仲間にすると外れる）
 */
(function (NS) {
  "use strict";

  /**
   * @param {MyGame.GameData} gameData
   * @param {MyGame.Random} random
   * @param {object} [dungeon] 挑んでいるダンジョンの定義（data/dungeons.js の1件）
   */
  function EncounterSystem(gameData, random, dungeon) {
    this.data = gameData;
    this.random = random;
    this.dungeon = dungeon || null;
    this.floor = 1;             // 今いる階（perFloor の参照に使う）
    this._stepsSinceBattle = 0; // 戦闘後の経過歩数（連続遭遇の抑制に使用）
  }

  /** 今いる階を伝える（階を降りるたびに呼ぶ） */
  EncounterSystem.prototype.setFloor = function (floor) {
    this.floor = floor || 1;
  };

  /** その階だけの上書き設定（無ければ空） */
  EncounterSystem.prototype.getFloorConfig = function () {
    var perFloor = this.getEncounterConfig().perFloor;
    return (perFloor && perFloor[String(this.floor)]) || {};
  };

  /** 戦闘が終わったときに呼ぶ（猶予歩数をリセット） */
  EncounterSystem.prototype.resetGrace = function () {
    this._stepsSinceBattle = 0;
  };

  /** そのダンジョンの出現設定（無ければ空） */
  EncounterSystem.prototype.getEncounterConfig = function () {
    return (this.dungeon && this.dungeon.encounter) || {};
  };

  /**
   * 今の階の出現表。
   *
   * 階ごとの表（perFloor の table）があればそちらを、無ければその場所の表を使う。
   * 階ごとに表を書くと、同じ種族の出やすさを階によって変えられる。
   *   例: ビリムシを B3F だけ多く出す
   * minFloor / maxFloor だけでは「出る・出ない」しか変えられないので、
   * 配分そのものを階ごとに決めたいときはこちらを使う。
   *
   * 階ごとの表を書いた階では、その場所の表は使われない（混ざらない）。
   * 書いていない階は今までどおり、その場所の表がそのまま使われる。
   */
  EncounterSystem.prototype.getTable = function () {
    var floorTable = this.getFloorConfig().table;
    if (floorTable && floorTable.length > 0) return floorTable;
    return this.getEncounterConfig().table || [];
  };

  /**
   * 1歩進んだときに呼ぶ。遭遇したら敵の一団（配列）を返し、しなければ null。
   * @returns {MyGame.MonsterInstance[]|null}
   */
  EncounterSystem.prototype.onStep = function () {
    var defaults = this.data.enemies || {};
    var config = this.getEncounterConfig();
    this._stepsSinceBattle++;

    // 戦闘直後の猶予中は遭遇しない
    if (this._stepsSinceBattle <= (defaults.gracePeriod || 0)) return null;

    var rate = numberOr(this.getFloorConfig().rate,
                        numberOr(config.rate, numberOr(defaults.encounterRate, 0)));
    if (this.random.next() >= rate) return null;

    return this.createEnemyGroup();
  };

  /**
   * 敵を groupSize に従って複数体つくる。
   * 盤面に出せる数（config.battleFieldSize）は超えない。
   * @returns {MyGame.MonsterInstance[]|null}
   */
  EncounterSystem.prototype.createEnemyGroup = function () {
    var config = this.getEncounterConfig();
    var table = this.getTable();
    if (table.length === 0) return null;

    var defaults = this.data.enemies || {};
    var fieldSize = (this.data.config || {}).battleFieldSize || 3;
    var size = this.getFloorConfig().groupSize
            || config.groupSize || defaults.defaultGroupSize || { min: 1, max: 1 };

    var count = this.resolveGroupCount(size, fieldSize);
    var allowed = this.tableForFloor(table);

    // 先に「どの種族が出るか」だけを決める。
    // 実体を作る前に決めるのは、solo を見つけたときに引き直さずに済ませるため
    var picked = [];
    for (var i = 0; i < count; i++) {
      var entry = pickByWeight(allowed, this.random);
      if (entry) picked.push(entry);
    }
    if (picked.length === 0) return null;

    // 単体でしか現れない種（solo）が混ざっていたら、その1体だけの戦いにする。
    //
    // 出会う確率は変わらない。変わるのは「出たときに何体で来るか」だけ。
    // 竜のような特別な相手が雑魚と一緒に出ると、
    // 推奨レベルでは勝ち目のない戦いになってしまうため。
    var solo = null;
    for (var s = 0; s < picked.length; s++) {
      if (picked[s].solo) { solo = picked[s]; break; }
    }
    if (solo) picked = [solo];

    var group = [];
    for (var j = 0; j < picked.length; j++) {
      var enemy = this.createEnemyFrom(picked[j]);
      if (enemy) group.push(enemy);
    }
    return group.length > 0 ? group : null;
  };

  /**
   * 出現テーブルの1エントリから敵を1体つくる。
   *
   * エントリに書けるもの（どちらも主と同じ仕組みなので、仲間にすると外れる）
   *   statMultiplier … その戦いのあいだだけ強くする。
   *                    「単体でしか出ないぶん、1体としては手強い」を作るのに使う。
   *                    { min, max } と書くと1体ずつ幅の中から決まる（ジュエルのHP。rollMultipliers）
   *   fixedStatLevel … 敵のあいだ、能力値をそのレベルの表の値に固定する（性格補正と個体値も入れない。ジュエル 30）。
   *                    レベルそのものは変えないので、ゴールドや仲間にしたあとの能力値は本来のレベルのまま
   *   actionPattern  … 決まった順番で行動させる。主と同じ書き方（"wait" も使える）。
   *                    門番のような相手を「読めば対処できる」形にできる
   *   skills         … その場所でだけ使う技（技idの配列）。種族の learnset・enemySkills より優先する。
   *                    同じ種族でも、出る場所ごとに役を変えられる（v1.0.0 蔦這う回廊のカゲヅタ・ヌマボネ）
   *   skillRate      … その場所でだけの、技を使う確率（種族の skillRate より優先）
   *   skillWeights   … 技ごとの選ばれやすさ { 技id: 重み }（書かなければ均等。コケキノコ：しびれ粉0.6・堅守の陣0.4）。
   *                    技idのかわりに criticalAttack と書くと「必ずクリティカルの通常攻撃」を選択肢に入れられる（ザンガルド）
   *   tactic         … 技を使う番の決め方を、仲間の作戦（data/battle.js の tactics.list の id）と同じにする（ウェポン "attack"）
   *   infinitePp     … true なら、敵のあいだ PP が減らない（シニガミ）
   *   fleeRate       … 手番の頭で逃げる確率（0〜1。ジュエル）
   *   debuffResist   … 敵のあいだの弱体への耐性（ジュエル）
   *   rewardMultiplier … 倒したときの経験値・ゴールドの倍率（種族の値は変えずに、その場所だけ。回廊のカゲヅタ 1.5）
   *   effects        … 敵のあいだだけ足す効果。特性・装備と同じ書き方（シニガミの耐性の上乗せ）
   *   （落とすものは表の1件ではなく、ダンジョンの dropOverrides に種族ごとに書く。DropSystem.dropsIn）
   *   ※ どれも仲間にすると外れる（スカウトした個体は覚える技の一覧で作り直す）
   *
   * @param {object} entry data/dungeons.js の table の1件
   * @returns {MyGame.MonsterInstance|null}
   */
  EncounterSystem.prototype.createEnemyFrom = function (entry) {
    if (!entry) return null;

    var range = this.resolveLevelRange(entry);
    var level = this.random.nextInt(range.min, range.max);
    var enemy = NS.MonsterInstance.create(entry.species, level, this.data, this.random);
    if (!enemy) return null;

    // 敵のときだけ使う技（data/monsters.js の enemySkills）があれば入れ替える
    if (enemy.useEnemySkills) enemy.useEnemySkills();
    // 敵のあいだだけ、そのレベルの表の値に固定する（ジュエル。倍率はこのあと掛かる）
    if (typeof entry.fixedStatLevel === "number") {
      enemy.fixedStatLevel = entry.fixedStatLevel;
      enemy.currentHp = enemy.getMaxHp();
      enemy.currentPp = enemy.getMaxPp();
    }
    if (entry.statMultiplier && enemy.setEncounterMultipliers) {
      enemy.setEncounterMultipliers(this.rollMultipliers(entry.statMultiplier));
    }
    if (entry.actionPattern && enemy.setActionPattern) {
      enemy.setActionPattern(entry.actionPattern);
    }
    // その場所でだけの技と、技を使う確率
    if (Array.isArray(entry.skills) && entry.skills.length > 0) enemy.skills = entry.skills.slice();
    if (typeof entry.skillRate === "number") enemy.skillRateOverride = entry.skillRate;
    if (entry.skillWeights) enemy.skillWeights = entry.skillWeights;
    // 技を使う番は、仲間の作戦と同じ決め方（ウェポン。BattleSystem._chooseEnemyAction）
    if (entry.tactic) enemy.enemyTactic = entry.tactic;
    // 敵のときだけ PP が減らない（シニガミ。BattleSystem.ppCostOf）
    if (entry.infinitePp) enemy.infinitePp = true;
    // 敵のときだけ、手番の頭でこの確率で逃げる（ジュエル。BattleSystem._tryEnemyFlee）
    if (typeof entry.fleeRate === "number") enemy.fleeRate = entry.fleeRate;
    // 敵のときだけの弱体への耐性（ジュエル。主と同じ setDebuffResist）
    if (typeof entry.debuffResist === "number" && enemy.setDebuffResist) enemy.setDebuffResist(entry.debuffResist);
    // その場所でだけ、倒したときの経験値・ゴールドに倍率を掛ける（蔦這う回廊のカゲヅタ。MonsterInstance.getExpReward）
    if (typeof entry.rewardMultiplier === "number") enemy.rewardMultiplier = entry.rewardMultiplier;
    // その区画でだけの落とすもの（data/dungeons.js の dropOverrides。回廊のヌマボネ。DropSystem.rollFor）
    var dropsHere = NS.DropSystem && NS.DropSystem.dropsIn(this.dungeon, entry.species, null);
    if (dropsHere) enemy.dropsOverride = dropsHere;
    // 敵のときだけ足す効果（特性・装備と同じ書き方。シニガミの「敵のときは耐性が高い」）。statMultiplier のあとに足す
    if (Array.isArray(entry.effects) && entry.effects.length > 0) {
      enemy.encounterEffects = (enemy.encounterEffects || []).concat(entry.effects);
    }
    return enemy;
  };

  /**
   * statMultiplier の中の幅（{ min, max }）を、この1体ぶんの倍率に決める。数字はそのまま。
   * 1体ずつ別に引くので、同じ戦いのジュエル2体でも HP が違う（hp: { min: 0.3, max: 0.5 }）
   */
  EncounterSystem.prototype.rollMultipliers = function (multipliers) {
    var result = {};
    for (var stat in multipliers) {
      if (!Object.prototype.hasOwnProperty.call(multipliers, stat)) continue;
      var value = multipliers[stat];
      result[stat] = (value && typeof value === "object")
        ? value.min + this.random.next() * (value.max - value.min)
        : value;
    }
    return result;
  };

  /**
   * 一度に出す敵の数を決める。
   *
   * data/dungeons.js の groupSize には2通りの書き方ができる。
   *   { min: 1, max: 3 }
   *     … min〜max から均等に選ぶ（1体・2体・3体が同じ割合）
   *   [ { count: 1, weight: 0.4 }, { count: 2, weight: 0.4 }, { count: 3, weight: 0.2 } ]
   *     … 体数ごとに出やすさを変える。「3体はたまにしか出ない」を作れる
   *
   * どちらの書き方でも、盤面に出せる数（config.battleFieldSize）は超えない。
   */
  EncounterSystem.prototype.resolveGroupCount = function (size, fieldSize) {
    if (Array.isArray(size)) {
      var entry = pickByWeight(size, this.random);
      var picked = entry ? numberOr(entry.count, 1) : 1;
      return Math.max(1, Math.min(fieldSize, picked));
    }

    var min = Math.max(1, numberOr(size.min, 1));
    var max = Math.min(fieldSize, Math.max(min, numberOr(size.max, min)));
    return this.random.nextInt(min, max);
  };

  /**
   * 今いる階に出てよいエントリだけを残す。
   *
   * data/dungeons.js の table に minFloor / maxFloor を書くと、
   * 「深い階にしか出ない」「浅い階にしか出ない」種族を作れる。
   * どちらも省略したエントリは、これまでどおり全階に出る。
   *   例: { species: "…", weight: 0.4, minFloor: 3 }  … B3F以降だけ
   *
   * ▼ 全部が消えてしまったときは、元の表をそのまま返す。
   *   その階だけ敵が一体も出なくなるより、書き間違いに気づけるまで
   *   遊べる状態を保つほうを優先している。
   */
  EncounterSystem.prototype.tableForFloor = function (table) {
    var allowed = [];

    for (var i = 0; i < table.length; i++) {
      var entry = table[i];
      if (entry.minFloor !== undefined && this.floor < entry.minFloor) continue;
      if (entry.maxFloor !== undefined && this.floor > entry.maxFloor) continue;
      allowed.push(entry);
    }
    return allowed.length > 0 ? allowed : table;
  };

  /**
   * 出現レベルの範囲を決める。
   * 「その種族の指定 → その階の指定 → その場所の指定 → 全体の既定」の順に探す。
   * @param {object} entry 出現テーブルの1エントリ
   * @returns {{min:number, max:number}}
   */
  EncounterSystem.prototype.resolveLevelRange = function (entry) {
    var defaults = this.data.enemies || {};
    var config = this.getEncounterConfig();
    var fallback = defaults.defaultLevel || { min: 1, max: 1 };
    var zoneRange = this.getFloorConfig().levelRange || config.levelRange || fallback;

    // 種族ごとの指定は片方だけでも書ける（もう片方はその階の既定を使う）
    var min = (entry && entry.minLevel !== undefined) ? entry.minLevel : zoneRange.min;
    var max = (entry && entry.maxLevel !== undefined) ? entry.maxLevel : zoneRange.max;

    min = numberOr(min, 1);
    max = numberOr(max, min);
    if (max < min) max = min;   // 逆に書かれていても壊れないようにする

    return { min: min, max: max };
  };

  /** 数値として使える値ならそれを、そうでなければ既定値を返す */
  function numberOr(value, fallback) {
    return (typeof value === "number") ? value : fallback;
  }

  // 重み付き抽選
  function pickByWeight(table, random) {
    var total = 0;
    for (var i = 0; i < table.length; i++) total += (table[i].weight || 0);
    if (total <= 0) return null;

    var r = random.next() * total;
    for (var j = 0; j < table.length; j++) {
      r -= (table[j].weight || 0);
      if (r < 0) return table[j];
    }
    return table[table.length - 1];
  }

  NS.EncounterSystem = EncounterSystem;
})(window.MyGame);
