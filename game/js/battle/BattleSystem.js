/**
 * BattleSystem.js
 * ターン制戦闘のロジック。描画は一切行わず、結果を「イベントの配列」で返す。
 * 画面（BattleScene）はそのイベントを読んで表示するだけでよい。
 *
 * ▼ 戦闘の流れ
 *   1. 盤面（味方・敵とも最大 battleFieldSize 体）に出ている全員の行動を決める
 *   2. 味方・敵をまとめて素早さの大きい順に並べ、その順で行動する
 *
 * ▼ 味方の枠（slots）
 *   味方の盤面は「枠」で持つ。開始時に戦える者を先頭から埋め、
 *   以後は**倒れても自動では入れ替わらない**。倒れた枠はそのまま残り、
 *   次のターンに交代コマンドで手動で入れ替える（倒れた枠は交代しか選べない）。
 *   蘇生技を足すときに、勝手に入れ替わっていると戻す相手がいなくなるため。
 *   倒れた枠の交代は、その枠に手番が無いので、だれよりも先に済ませる。
 *
 * ▼ 受け取るモンスターについて
 * 特定のクラスに依存しない。次のインターフェースを満たすオブジェクトなら何でもよい。
 *   getName() / getMaxHp() / getAttack() / getDefense() / getSpeed()
 *   isFainted() / takeDamage(n) / currentHp / skills
 *   getSpecies()（任意。経験値の算出に使用）
 *
 * ▼ 数値はすべて data/battle.js から取得する（このファイルに数値を書かない）。
 */
(function (NS) {
  "use strict";

  /**
   * @param {MyGame.GameData} gameData
   * @param {MyGame.Random} random
   */
  function BattleSystem(gameData, random) {
    this.data = gameData;
    this.random = random;
    // 特性・装備によるダメージ倍率の集計に使う
    this.effects = NS.EffectSystem ? new NS.EffectSystem(gameData) : null;
    this.allies = [];
    this.enemies = [];
    this.slots = [];    // 味方の盤面の枠（倒れた者も残る）
    this.fieldSize = (gameData.config || {}).battleFieldSize || 3;
    this.finished = false;
    this.result = null; // "win" | "lose" | "flee" | その他（外部から終了させた場合）
    // 何ターン目か（特性「先手」が最初のターンを見分けるのに使う）
    this.turnCount = 0;
    // このターンに特性「亡者の魂」が働いた側（1ターンに1体まで）
    this._undyingSides = {};
  }

  /**
   * 戦闘を開始する。
   * @param {object[]} allies 味方（戦える者が先頭から盤面に出る）
   * @param {object[]} enemies 敵
   */
  BattleSystem.prototype.start = function (allies, enemies) {
    this.allies = allies || [];
    this.enemies = enemies || [];
    this.finished = false;
    this.result = null;
    this.turnCount = 0;

    // 枠を埋めるのはこのときだけ。以後は交代（replaceSlot）でしか変わらない
    this._resetFieldMarks();
    this.slots = aliveMembers(this.allies, this.fieldSize);
    // 最初から場に出ている仲間に印を付ける（勝ったときの愛情度に使う）
    for (var i = 0; i < this.slots.length; i++) this.slots[i]._appeared = true;
  };

  /**
   * 戦闘中だけ使う印を、開始時にすべて消してから付け直す。
   *
   * これらは前の戦闘の状態が残ると誤動作するため、必ずここで初期化する。
   *   _removed   … 盤面から取り除かれた（スカウトで仲間になった等）
   *                 消し忘れると、その個体は次の戦闘以降ずっと行動しなくなる
   *   _defending … 防御中
   *   _appeared  … この戦闘で一度でも場に出た（勝ったときに愛情度が入る。控えには入らない）
   *   _undying / _undyingUsed … 特性「亡者の魂」で踏みとどまっている／この戦闘で使った
   *   _statusWard … 特性「芽吹き」でつけた、状態異常を1回防ぐ守り（v1.0.0）
   *   _tacticSupportNext … 作戦「補助中心」で、次に見る種類（強化・弱体・状態異常の順番。v1.0.0）
   *   _charged / _chargeMul … 「ためる」でためた力／いまの行動に掛かっている倍率
   *   _chargeFresh … ためたその手番のあいだ true（次の手番の終わりに、乗らなければ消すため。v1.4.1）
   */
  BattleSystem.prototype._resetFieldMarks = function () {
    var i;
    for (i = 0; i < this.allies.length; i++) {
      this.allies[i]._removed = false;
      this.allies[i]._defending = false;
      this.allies[i]._appeared = false;
      this.allies[i]._undying = false;
      this.allies[i]._undyingUsed = false;
      this.allies[i]._statusWard = null;
      this.allies[i]._tacticSupportNext = 0;
      this.allies[i]._charged = null;
      this.allies[i]._chargeMul = null;
      this.allies[i]._chargeFresh = false;
    }
    for (i = 0; i < this.enemies.length; i++) {
      this.enemies[i]._removed = false;
      this.enemies[i]._defending = false;
      this.enemies[i]._undying = false;
      this.enemies[i]._undyingUsed = false;
      this.enemies[i]._statusWard = null;
      this.enemies[i]._charged = null;
      this.enemies[i]._chargeMul = null;
      this.enemies[i]._chargeFresh = false;
    }
  };

  // --- 盤面の参照 ---

  /**
   * 味方の枠。倒れた者もその場に残る。
   * 行動を決める順・画面に並べる順はこれ。
   */
  BattleSystem.prototype.getFieldSlots = function () {
    return this.slots;
  };

  /** 盤面に出ていて、まだ戦える味方（狙える・動ける者） */
  BattleSystem.prototype.getFieldAllies = function () {
    return aliveMembers(this.slots, this.fieldSize);
  };

  /**
   * 枠の中身を入れ替える（交代）。
   * 出ていく者が枠にいない、入る者がもう枠にいる、のどちらかなら何もしない。
   */
  BattleSystem.prototype.replaceSlot = function (outgoing, incoming) {
    var index = this.slots.indexOf(outgoing);
    if (index < 0 || !incoming || this.slots.indexOf(incoming) >= 0) return false;

    this.slots[index] = incoming;
    incoming._appeared = true;   // 交代で出たぶんも「場に出た」に数える
    return true;
  };

  /** 盤面に出ている敵 */
  BattleSystem.prototype.getFieldEnemies = function () {
    return aliveMembers(this.enemies, this.fieldSize);
  };

  BattleSystem.prototype.isOver = function () { return this.finished; };
  BattleSystem.prototype.getResult = function () { return this.result; };

  // --- ターン進行 ---

  /**
   * 味方の枠ごとの行動を受け取り、1ターン分を解決する。
   *
   * @param {object[]} slotActions 枠（getFieldSlots）と同じ並びの行動
   *   { type: "skill", skillId, targetIndex } … 技を使う（targetIndex は盤面の敵の番号）
   *   { type: "item",  itemId, targetIndex, targetSide } … 道具を使う（実際の効果は呼び出し側で適用済み）
   *   { type: "scout", targetIndex }  … スカウト（判定は呼び出し側）
   *   { type: "swap",  incoming }     … 交代（入れ替えは呼び出し側）
   *   { type: "flee" }                … 逃走（1人でも選べば逃走判定を行う）
   *   { type: "skip" }                … 何もしない
   * @returns {object[]} 発生したイベントの配列
   */
  BattleSystem.prototype.takeTurn = function (slotActions) {
    var events = [];
    if (this.finished) return events;

    // 受け取った配列は触らない（済ませた交代を skip に置き換えるため写す）
    var actions = (slotActions || []).slice();

    // 倒れた枠の交代は、だれよりも先に済ませる（倒れた者に手番は無い）
    this._applyFaintedSwaps(actions, events);

    // 作戦で動く仲間のうち、このターン防御するものを決める（防御はターンの頭で構えるため）
    this._applyTacticDefend(actions);

    var fieldAllies = this.getFieldAllies();
    var fieldEnemies = this.getFieldEnemies();
    if (fieldAllies.length === 0 || fieldEnemies.length === 0) {
      this._finish(events);
      return events;
    }

    // 防御は前のターンの分を解除してから、このターンの分を設定する
    this._applyDefend(actions, events);

    // 「逃げる」は行動順の前にまとめて判定する
    if (containsFlee(actions)) {
      if (this._tryFlee(events)) return events;
    }

    this.turnCount++;
    this._undyingSides = {};

    // 戦闘の始めに働く特性（追い風・芽吹き）。行動より先に知らせる
    if (this.turnCount === 1) this._applyBattleStartAbilities(events);

    var order = this._buildTurnOrder(fieldAllies, fieldEnemies, actions);

    // このターンにまだ手番が残っている者の印（防御中に麻痺を受けたときの判定に使う。_breakDefendByStatus）
    this._markPendingSteps(order);

    // 加護の「先手」は全員に掛かるので、1体ずつ名乗らせず、ターンの頭に1行でまとめて知らせる
    this._announcePartyFirstStrike(order, events);

    // 「立ち塞がる」（cover を持つ技）は、防御と同じく素早さに関係なくターンの頭で済ませる
    this._applyCovers(order, events);

    for (var i = 0; i < order.length; i++) {
      var step = order[i];
      step.actor._pendingStep = false;
      // 先に倒された者、盤面から取り除かれた者（スカウトされた等）は行動しない
      if (step.actor.isFainted() || step.actor._removed) continue;
      // ターンの頭で済ませた行動（立ち塞がる）。それもその者の手番なので、ためた力はここで消える
      if (step._done) { this._expireCharge(step.actor, step.side, events); continue; }

      // 特性「先手」で先に動いた者は、そうと分かるように名乗る（加護のぶんは上でまとめて出した）
      if (typeof step.firstStrike === "string" && step.firstStrikeKind !== "blessing") {
        events.push(this._abilityEvent(step.actor, step.side, step.firstStrike, step.firstStrikeKind));
      }

      this._performAction(step, events);
      // 「ためる」の倍率は、その行動のあいだだけ。乗らない手番だったら、ためた力も消える（麻痺・眠りで動けなかったときも）
      step.actor._chargeMul = null;
      this._expireCharge(step.actor, step.side, events);
      if (this._checkFinish(events)) return events;

      // 1ターンに何度も動く主（data/bosses.js の actionsPerTurn）は、続けてもう一度動く。
      // 2回目の行動はそのときに決め直す（1回目で倒れた仲間を狙い続けないように）
      for (var extra = 1; extra < (step.actions || 1); extra++) {
        if (step.actor.isFainted() || step.actor._removed) break;
        if (this._alwaysBlockingStatus(step.actor)) break;   // 眠ったら、残りの手番も無い
        var again = { actor: step.actor, side: step.side, speed: step.speed,
          action: this._chooseEnemyAction(step.actor, this.getFieldAllies()) };
        this._performAction(again, events);
        step.actor._chargeMul = null;
        this._expireCharge(step.actor, step.side, events);
        if (this._checkFinish(events)) return events;
      }
    }

    // 立ち塞がるのは、そのターンのあいだだけ
    this._clearCovers();

    // 亡者の魂で踏みとどまっていた者は、ここで倒れる
    this._expireUndying(events);
    if (this._checkFinish(events)) return events;

    // 状態異常のダメージ（毒）と、残りターンを減らす処理
    this._tickStatuses(events);
    if (this._checkFinish(events)) return events;

    // 特性「脱皮」。残りターンを減らしたあとに見るので、自然に解けたものは数えない
    this._tickShedStatus(events);

    // 特性「再生」。毒のあとに戻すので、毒で倒れた者は戻らない
    this._tickRegen(events);
    // 毎ターンPPが戻る装備（樹液の護符・雫の指輪。ppRegen）
    this._tickPpRegen(events);

    // バフ／デバフの残りターンを1つ減らす（ターンの最後にまとめて）
    this._tickModifiers(events);
    // 控えに下がっている仲間も、状態異常と強化・弱体のターンだけは進む（v1.3.1）
    this._tickBench();

    // 特性「追い風」が切れるターンなら知らせる
    this._tickTailwindEnd(events);

    this._checkFinish(events);
    return events;
  };

  /**
   * 倒れている枠が選んだ交代を、行動順より前に済ませる。
   * 済ませた枠の行動は skip に置き換える（入ってきた者はこのターン動かない）。
   */
  BattleSystem.prototype._applyFaintedSwaps = function (actions, events) {
    for (var i = 0; i < this.slots.length; i++) {
      var action = actions[i];
      if (!action || action.type !== "swap") continue;

      var actor = this.slots[i];
      if (!actor.isFainted()) continue;   // 生きている者の交代は素早さ順のまま

      if (this.onNonSkillAction) {
        this.onNonSkillAction({ actor: actor, side: "ally", action: action }, events);
      }
      actions[i] = { type: "skip" };
    }
  };

  /**
   * 盤面に出ている全員の状態異常を1ターン進める。
   * ダメージのあるもの（毒）はここで削り、残りターンが尽きたものは外す。
   */
  BattleSystem.prototype._tickStatuses = function (events) {
    this._tickStatusSide(this.getFieldAllies(), "ally", events);
    this._tickStatusSide(this.getFieldEnemies(), "enemy", events);
  };

  BattleSystem.prototype._tickStatusSide = function (group, side, events) {
    for (var i = 0; i < group.length; i++) {
      var monster = group[i];
      if (!monster.tickStatuses || monster.isFainted()) continue;

      // ダメージのある状態異常（毒）
      var defs = monster.getStatusDefs();
      for (var d = 0; d < defs.length; d++) {
        var damage = this._statusTickDamage(monster, defs[d]);
        if (damage <= 0) continue;

        monster.takeDamage(damage);
        events.push({
          type: "statusDamage", targetSide: side,
          targetName: monster.getName(), target: monster,
          statusId: defs[d].id, statusName: defs[d].name,
          amount: damage, currentHp: monster.currentHp, maxHp: monster.getMaxHp()
        });
        if (monster.isFainted()) {
          events.push({ type: "faint", targetSide: side,
            targetName: monster.getName(), target: monster });
          break;
        }
      }

      // 残りターンを1つ減らし、切れたものを知らせる
      var expired = monster.tickStatuses();
      for (var j = 0; j < expired.length; j++) {
        events.push({
          type: "statusEnd", targetSide: side,
          targetName: monster.getName(), target: monster,
          statusId: expired[j].id, statusName: expired[j].name
        });
      }
    }
  };

  /**
   * 状態異常1つぶんの、ターン終了時ダメージ。
   *
   * 割合ダメージは最大HPが大きい相手ほど効きすぎるので、
   * data/statuses.js の max で上限を掛けてある。
   */
  BattleSystem.prototype._statusTickDamage = function (monster, def) {
    var spec = def.turnDamage;
    if (!spec) return 0;

    var damage = Math.floor(monster.getMaxHp() * (spec.hpRatio || 0));
    if (spec.max !== undefined) damage = Math.min(damage, spec.max);
    damage = Math.max(spec.min === undefined ? 1 : spec.min, damage);
    // 特性「カチカチ」はこのダメージも減る
    if (monster.reduceDirectDamage) damage = monster.reduceDirectDamage(damage);

    // leaveAtLeast を書くと、そのぶんは必ず残す（戦闘中の毒は 0＝倒れうる）
    var floor = spec.leaveAtLeast === undefined ? 0 : spec.leaveAtLeast;
    var allowed = Math.max(0, monster.currentHp - floor);
    return Math.min(damage, allowed);
  };

  /**
   * 盤面に出ている全員のバフ／デバフを1ターン進め、切れたものを知らせる。
   *
   * ターンの最後にまとめて行うので、
   * 「3ターン続く」と書いた効果は、かけたターンを含めて3ターン効く。
   */
  BattleSystem.prototype._tickModifiers = function (events) {
    this._tickSide(this.getFieldAllies(), "ally", events);
    this._tickSide(this.getFieldEnemies(), "enemy", events);
  };

  /**
   * 控え（場に出ていない仲間）の状態異常と強化・弱体を、1ターン分進める（v1.3.1。作者の希望）。
   * 交代で下げても、裏でターンが経てば麻痺や足止めは解ける（樹液の膜などの強化も同じく減る）。
   *   ・残りターンが減るだけ。毒のダメージ・再生・PPの回復など、ターンの終わりの効き目は場に出ている者だけ
   *   ・毒のように残りターンを持たないものは、控えでも減らない（いままでどおり）
   *   ・控えのことなので、切れても文は出さない（前に出たときの印で分かる）
   */
  BattleSystem.prototype._tickBench = function () {
    var field = this.slots || [];
    for (var i = 0; i < this.allies.length; i++) {
      var monster = this.allies[i];
      if (field.indexOf(monster) >= 0 || monster.isFainted()) continue;
      if (monster.tickStatuses) monster.tickStatuses();
      if (monster.tickModifiers) monster.tickModifiers();
    }
  };

  BattleSystem.prototype._tickSide = function (group, side, events) {
    for (var i = 0; i < group.length; i++) {
      var monster = group[i];
      if (!monster.tickModifiers) continue;

      var expired = monster.tickModifiers();
      for (var j = 0; j < expired.length; j++) {
        events.push({
          type: "modifierEnd", targetSide: side,
          targetName: monster.getName(), target: monster,
          skillName: expired[j].name
        });
      }
    }
  };

  /**
   * 戦闘が終わったので、掛かっているバフ／デバフをすべて外す。
   * 持ち帰ってしまうと、次の戦闘に効果が残ってしまう。
   */
  BattleSystem.prototype.clearAllModifiers = function () {
    var everyone = (this.allies || []).concat(this.enemies || []);
    for (var i = 0; i < everyone.length; i++) {
      if (everyone[i].clearModifiers) everyone[i].clearModifiers();
      // 芽吹きの守り（_statusWard）も、その戦闘かぎり
      everyone[i]._statusWard = null;
      // 状態異常も一緒に片づける。ただし毒（persists）だけは持ち帰る
      if (everyone[i].clearBattleStatuses) everyone[i].clearBattleStatuses();
    }
  };

  /**
   * 味方・敵の行動をまとめ、素早さの大きい順に並べる。
   * 同じ素早さのときの決め方は data/battle.js の speedTieBreak。
   *
   * ただしスカウトだけは特別で、
   *   ・誘った1体だけが味方から行動する（他の味方は動かない）
   *   ・素早さに関係なく最初に行動する
   * 失敗した場合は、そのあと敵だけが行動する。
   *
   * ★ ここから小技が生まれている（意図して残してある）
   *
   *   他の味方の行動は、この行動順から丸ごと外れる。攻撃も技も道具も出ない。
   *   ところが防御だけは別で、takeTurn が行動順を組む「前」に
   *   _applyDefend で allyActions から直接かけているため、そのまま効く。
   *
   *   つまり 1体目・2体目に防御を選んでから3体目で誘うと、
   *   前の2体が守りを固めた状態のまま誘える。
   *   逆に1体目で誘うと、残り2体は何もできずにターンが終わる。
   *
   *   「誘うのは最後の1体」「その前は防御」と気づいた人が得をする形なので、
   *   このまま残す。防御以外も通したくなったら、ここで
   *   スカウト以外の味方の step も並べるようにすればよい。
   */
  BattleSystem.prototype._buildTurnOrder = function (fieldAllies, fieldEnemies, actions) {
    var i;
    var enemySteps = [];
    var slots = this.slots;

    for (i = 0; i < fieldEnemies.length; i++) {
      enemySteps.push(this._withFirstStrike({
        actor: fieldEnemies[i], side: "enemy",
        action: this._chooseEnemyAction(fieldEnemies[i], fieldAllies),
        speed: this._rollSpeed(fieldEnemies[i]),
        actions: this._rollActionCount(fieldEnemies[i])
      }));
    }

    // スカウトを選んだ味方がいれば、その1体だけが先に行動する
    var scoutIndex = findScoutIndex(actions);
    if (scoutIndex >= 0 && slots[scoutIndex] && !slots[scoutIndex].isFainted()) {
      var scoutStep = {
        actor: slots[scoutIndex], side: "ally",
        action: actions[scoutIndex], speed: Infinity
      };
      return [scoutStep].concat(this._sortBySpeed(enemySteps));
    }

    // 行動は枠ごとに受け取っている。倒れている枠は手番を持たない
    var steps = enemySteps;
    for (i = 0; i < slots.length; i++) {
      if (slots[i].isFainted()) continue;
      var action = (actions && actions[i]) || { type: "skip" };
      steps.push(this._withFirstStrike({
        actor: slots[i], side: "ally",
        action: action, speed: this._rollSpeed(slots[i])
      }));
    }

    return this._sortBySpeed(steps);
  };

  /**
   * 「先手」（firstStrike）が働くなら、行動に印を付けて返す。働くのは戦闘の最初のターンだけ。
   *   firstStrike     … 出どころの名前（特性・加護）。働かなければ付けない
   *   firstStrikeKind … 出どころの種類（"ability" / "blessing" など）
   */
  BattleSystem.prototype._withFirstStrike = function (step) {
    if (this.turnCount !== 1) return step;
    var found = this._findEffect(step.actor, "firstStrike");
    if (found) {
      step.firstStrike = found.name || "";
      step.firstStrikeKind = found.kind;
    }
    return step;
  };

  /**
   * 加護の「先手」を、ターンの頭に1行でまとめて知らせる（側と加護ごとに1回）。
   * 加護は仲間全員に掛かるので、1体ずつ「○○ の 疾き初手!」と並ぶと読みにくいため
   */
  BattleSystem.prototype._announcePartyFirstStrike = function (order, events) {
    var told = {};
    for (var i = 0; i < order.length; i++) {
      var step = order[i];
      if (step.firstStrikeKind !== "blessing" || typeof step.firstStrike !== "string") continue;
      var key = step.side + ":" + step.firstStrike;
      if (told[key]) continue;
      told[key] = true;
      events.push({ type: "partyFirstStrike", side: step.side, targetSide: step.side,
        abilityName: step.firstStrike, sourceKind: "blessing" });
    }
  };

  /**
   * 行動順を決めるための素早さ。
   * 毎ターン speedVariance の範囲でぶれるので、
   * 素早さが近い者どうしは順番が入れ替わることがある。
   */
  BattleSystem.prototype._rollSpeed = function (actor) {
    var config = (this.data.battle || {}).speedVariance || {};
    var min = (typeof config.min === "number") ? config.min : 1;
    var max = (typeof config.max === "number") ? config.max : 1;

    return actor.getSpeed() * this._tailwindMultiplier(actor) * (min + this.random.next() * (max - min));
  };

  /**
   * このターンに何回動くか（v1.3.0）。ふつうは1回。
   * 主の actionsPerTurn（data/bosses.js。{ min, max }）があれば、その幅で毎ターン引き直す。
   * 2回目以降は1回目のすぐ後に続けて動く（takeTurn）
   */
  BattleSystem.prototype._rollActionCount = function (actor) {
    var spec = actor && actor.actionsPerTurn;
    if (!spec) return 1;
    var min = Math.max(1, Math.floor(numberOr(spec.min, 1)));
    var max = Math.max(min, Math.floor(numberOr(spec.max, min)));
    return this.random.nextInt(min, max);
  };

  /** 特性「追い風」（tailwind）。戦闘の最初の turns ターンだけ、行動順の素早さに倍率を掛ける */
  BattleSystem.prototype._tailwindMultiplier = function (actor) {
    var turn = this.turnCount;
    var found = this._findEffect(actor, "tailwind", function (effect) {
      return turn <= (effect.turns || 1);
    });
    return found ? (found.effect.value || 1) : 1;
  };

  BattleSystem.prototype._sortBySpeed = function (steps) {
    var tieBreak = (this.data.battle || {}).speedTieBreak || "random";
    var random = this.random;

    // 並べ替えが安定するよう、あらかじめ同速時の順位を決めておく
    for (var i = 0; i < steps.length; i++) {
      if (tieBreak === "allyFirst") steps[i]._tie = (steps[i].side === "ally") ? 0 : 1;
      else if (tieBreak === "enemyFirst") steps[i]._tie = (steps[i].side === "enemy") ? 0 : 1;
      else steps[i]._tie = random.next();
    }

    steps.sort(function (a, b) {
      // 特性「先手」が働いている者は、素早さに関係なく先に並ぶ（その中では素早さ順）
      var firstA = (a.firstStrike !== null && a.firstStrike !== undefined) ? 1 : 0;
      var firstB = (b.firstStrike !== null && b.firstStrike !== undefined) ? 1 : 0;
      if (firstA !== firstB) return firstB - firstA;
      if (b.speed !== a.speed) return b.speed - a.speed;
      return a._tie - b._tie;
    });
    return steps;
  };

  // 出る場所の表の skillWeights に書ける「必ずクリティカルの通常攻撃」（技ではない選択肢。ザンガルド）
  var CRITICAL_ATTACK = "criticalAttack";

  /** PP が足りず、持っている技が1つも使えないか（技を持っていない相手も true） */
  BattleSystem.prototype._outOfSkills = function (enemy) {
    var skills = enemy.skills || [];
    for (var i = 0; i < skills.length; i++) {
      if (this._canUseSkill(enemy, skills[i])) return false;
    }
    return true;
  };

  /**
   * 敵の行動を決める。
   * data/battle.js の enemyAi.skillRate の確率で技を使い、それ以外は通常攻撃。
   * PPが足りない技は候補から外し、使える技が無ければ通常攻撃をする。
   */
  BattleSystem.prototype._chooseEnemyAction = function (enemy, fieldAllies) {
    var target = this._pickTargetIndex(fieldAllies);
    var fallback = { type: "skill", skillId: this.getNormalAttackId(), targetIndex: target };

    // 決まった順番を持っている相手（主など）は、そのとおりに動く
    if (enemy.actionPattern) return this._patternAction(enemy, target, fallback);

    // criticalAttack を持つ相手（ザンガルド）は、PP が尽きて技が1つも使えなくなったら、
    // 毎回「必ずクリティカルの通常攻撃」になる（2026-10-27 作者の指定。そこまで長引く戦いはまず無いので）
    var critWeight = enemy.skillWeights ? numberOr(enemy.skillWeights[CRITICAL_ATTACK], 0) : 0;
    if (critWeight > 0 && this._outOfSkills(enemy)) {
      return { type: "skill", skillId: this.getNormalAttackId(), targetIndex: target, forceCritical: true };
    }

    if (this.random.next() >= this._skillRateFor(enemy)) return fallback;

    // 出現の表に tactic を書いた敵は、技を使う番には仲間の作戦と同じ決め方をする（ウェポン＝全力で攻める。
    // 手番が来たときに _chooseTacticAction で決める。作者の指定 2026-11-05）
    if (enemy.enemyTactic) return { type: "tactic", tacticId: enemy.enemyTactic, targetIndex: target };

    var usable = [];
    var skills = enemy.skills || [];
    for (var i = 0; i < skills.length; i++) {
      if (!this._canUseSkill(enemy, skills[i])) continue;
      // 倒れた仲間を起こす技（リザレクト）は敵は使わない
      if ((this.data.getSkill(skills[i]) || {}).revive) continue;
      // すでに効いている強化・弱体は掛け直しても意味がないので選ばない
      // （重ねがけはターン数が建て直されるだけ。手番を捨てることになる）
      if (this._modifierAlreadyOn(enemy, skills[i])) continue;
      // 全員満タンなら回復技は選ばない（手番を捨てることになる）
      if (this._healPointless(enemy, skills[i])) continue;
      // 種族に enemyAi.healBelow があれば、そこまで減った仲間がいるときだけ回復技を使う
      if (this._healTooEarly(enemy, skills[i])) continue;
      usable.push(skills[i]);
    }
    // skillWeights に criticalAttack（必ずクリティカルの通常攻撃）があれば、技と並べて選択肢に入れる（v1.1.0 ザンガルド）。
    // PP が尽きたときは、上の _outOfSkills で技の確率に関係なく毎回これになる
    if (critWeight > 0) usable.push(CRITICAL_ATTACK);
    if (usable.length === 0) return fallback;

    // 技ごとの選ばれやすさ（data/dungeons.js の table の skillWeights）があれば、その重みで選ぶ。
    // 使えない技（PP不足・掛け直し）は上で外れているので、残った技の重みで割り直される
    var chosen = this._pickWeightedSkill(enemy, usable);
    if (chosen === CRITICAL_ATTACK) {
      return { type: "skill", skillId: this.getNormalAttackId(), targetIndex: target, forceCritical: true };
    }
    var skill = this.data.getSkill(chosen);

    // 状態異常を治す技（クレンズ）は、治せるものが掛かっている仲間へ
    if (skill && skill.target === "ally" && skill.cureStatus && !skill.heal) {
      return { type: "skill", skillId: chosen, targetIndex: this._curableIndex(enemy, skill) };
    }
    // 味方にかける技は、狙う先が自分の側になる。いちばん傷ついた仲間を治す
    if (skill && skill.target === "ally") {
      return { type: "skill", skillId: chosen, targetIndex: this._mostWoundedIndex(enemy) };
    }
    return { type: "skill", skillId: chosen, targetIndex: target };
  };

  /** 自分の側で、最大HPからいちばん減っている仲間の番号 */
  BattleSystem.prototype._mostWoundedIndex = function (actor) {
    var field = (this.enemies.indexOf(actor) >= 0)
      ? this.getFieldEnemies() : this.getFieldAllies();

    var best = 0, worst = Infinity;
    for (var i = 0; i < field.length; i++) {
      var m = field[i];
      if (m.isFainted()) continue;
      var ratio = m.currentHp / m.getMaxHp();
      if (ratio < worst) { worst = ratio; best = i; }
    }
    return best;
  };

  /**
   * 回復技だが、自分の側に効く仲間が一人もいないか。
   *   HPを治す技 … 減っている仲間がいない
   *   状態異常を治す技（クレンズ） … 治せる状態異常の仲間がいない
   */
  BattleSystem.prototype._healPointless = function (actor, skillId) {
    var skill = this.data.getSkill(skillId);
    if (!skill || skill.power || !(skill.heal || skill.cureStatus)) return false;

    var field = (this.enemies.indexOf(actor) >= 0)
      ? this.getFieldEnemies() : this.getFieldAllies();

    for (var i = 0; i < field.length; i++) {
      if (field[i].isFainted()) continue;
      if (skill.heal && field[i].currentHp < field[i].getMaxHp()) return false;
      if (skill.cureStatus && BattleSystem.hasCurable(field[i], skill.cureStatus)) return false;
    }
    return true;
  };

  /**
   * HPを治す技を、まだ使わないほうがよいか（敵のときだけ。data/monsters.js の enemyAi.healBelow）。
   * 自分の側に、最大HPの healBelow 未満まで減った仲間が一人もいなければ使わない。
   * 書いていない種族は今までどおり（減っている仲間がいれば使う）
   */
  BattleSystem.prototype._healTooEarly = function (actor, skillId) {
    var species = actor.getSpecies ? actor.getSpecies() : null;
    var limit = species && species.enemyAi && species.enemyAi.healBelow;
    if (typeof limit !== "number") return false;

    var skill = this.data.getSkill(skillId);
    if (!skill || skill.power || !skill.heal) return false;

    var field = (this.enemies.indexOf(actor) >= 0)
      ? this.getFieldEnemies() : this.getFieldAllies();
    for (var i = 0; i < field.length; i++) {
      if (field[i].isFainted()) continue;
      if (field[i].currentHp < field[i].getMaxHp() * limit) return false;
    }
    return true;
  };

  /** 自分の側で、その技が治せる状態異常に掛かっている仲間の番号（いなければ 0） */
  BattleSystem.prototype._curableIndex = function (actor, skill) {
    var field = (this.enemies.indexOf(actor) >= 0)
      ? this.getFieldEnemies() : this.getFieldAllies();
    for (var i = 0; i < field.length; i++) {
      if (!field[i].isFainted() && BattleSystem.hasCurable(field[i], skill.cureStatus)) return i;
    }
    return 0;
  };

  /**
   * その相手が技を出す確率。
   *
   * ふつうは data/battle.js の enemyAi.skillRate（全体の既定）を使うが、
   * data/monsters.js の種族に skillRate を書くと、その種族だけ変えられる。
   * 妨害役のように「技を出してこそ意味がある」相手を高くするための仕組み。
   */
  /**
   * 使える技から1つ選ぶ。enemy.skillWeights（{ 技id: 重み }。出る場所ごと）があればその重みで、
   * 無ければ均等に選ぶ。重みを書いていない技は 1 として扱う
   */
  BattleSystem.prototype._pickWeightedSkill = function (enemy, usable) {
    var weights = enemy.skillWeights;
    if (!weights) return this.random.pick(usable);
    var total = 0, i;
    for (i = 0; i < usable.length; i++) total += numberOr(weights[usable[i]], 1);
    var roll = this.random.next() * total;
    for (i = 0; i < usable.length; i++) {
      roll -= numberOr(weights[usable[i]], 1);
      if (roll < 0) return usable[i];
    }
    return usable[usable.length - 1];
  };

  BattleSystem.prototype._skillRateFor = function (enemy) {
    // 出る場所ごとの確率（data/dungeons.js の table の skillRate。EncounterSystem.createEnemyFrom）が最優先
    if (typeof enemy.skillRateOverride === "number") return enemy.skillRateOverride;
    var species = enemy.getSpecies ? enemy.getSpecies() : null;
    if (species && typeof species.skillRate === "number") return species.skillRate;

    var rate = ((this.data.battle || {}).enemyAi || {}).skillRate;
    return (typeof rate === "number") ? rate : 1;
  };

  /**
   * 敵が狙う位置を選ぶ。
   *
   * 重みは data/battle.js の targetWeights（前に置いた仲間ほど狙われる）。
   * 盤面の数が重みの数と違うときは、出ている数だけで割り直すので、
   * 1体でも3体でも同じ書き方で動く。
   * 重みが書かれていなければ、今までどおり均等に選ぶ。
   */
  BattleSystem.prototype._pickTargetIndex = function (fieldAllies) {
    var count = fieldAllies.length;
    if (count <= 1) return 0;

    var weights = (this.data.battle || {}).targetWeights;
    if (!weights || weights.length === 0) {
      return this.random.nextInt(0, count - 1);
    }

    var total = 0;
    var i;
    for (i = 0; i < count; i++) total += numberOr(weights[i], 0);
    if (total <= 0) return this.random.nextInt(0, count - 1);

    var roll = this.random.next() * total;
    for (i = 0; i < count; i++) {
      roll -= numberOr(weights[i], 0);
      if (roll < 0) return i;
    }
    return count - 1;
  };

  /**
   * 決まった順番の次の1つを行動に変える。
   * PPが足りない技に当たったときは通常攻撃に落ちるが、順番そのものは進める
   * （撃てなかった回に足踏みして、ずっと同じ技を狙い続けないように）。
   *
   * 手順の1つは、技id の文字列のほかに次の形でも書ける（v1.0.0）。
   *   { skill: "normalAttack", critical: true } … 必ずクリティカルになる
   *   { choice: [ { weight: 0.5, skill: "normalAttack", critical: true },
   *               { weight: 0.5, skill: "gale" } ] }   … 重みで1つ選ぶ（その手番ごとに引き直す）
   */
  BattleSystem.prototype._patternAction = function (enemy, target, fallback) {
    var entry = enemy.nextPatternAction();
    if (!entry) return fallback;

    if (entry && typeof entry === "object" && entry.choice) entry = this._pickChoice(entry.choice);
    if (!entry) return fallback;
    var skillId = (typeof entry === "object") ? entry.skill : entry;
    var forceCritical = (typeof entry === "object") && entry.critical === true;

    if (skillId === "wait") return { type: "wait" };
    if (!this._canUseSkill(enemy, skillId)) return fallback;

    var action = { type: "skill", skillId: skillId, targetIndex: target };
    if (forceCritical) action.forceCritical = true;
    return action;
  };

  // --- 作戦（v1.0.0。data/battle.js の tactics） ---

  /**
   * 作戦で動く仲間の行動を、その者の番が来たときに決める。
   * 上から順に見て、最初に当てはまったものをする（決まりは作者の指定。data/battle.js の tactics の説明）：
   *   1. 回復（healBelow を下回った味方がいれば）
   *   2. 状態異常を治す（cure）
   *   3. 補助（support。強化 → 弱体 → 状態異常 の順に、まだ掛かっていないもの）
   *   4. 攻撃（attack。"best" か "finishOnly"）
   * 道具・スカウト・交代・逃げるは選ばない（主人公が決めること）。即死の技はどの作戦でも使わない
   *
   * @param {string} [tacticId] 作戦の id。敵（出現の表の tactic）が渡す。無ければ本人に決めてある作戦
   */
  BattleSystem.prototype._chooseTacticAction = function (actor, side, tacticId) {
    var named = tacticId ? (((this.data.battle || {}).tactics || {}).list || {})[tacticId] : null;
    var tactic = named || (actor.getTactic && actor.getTactic()) || {};
    var own = aliveOf((side === "ally") ? this.getFieldAllies() : this.getFieldEnemies());
    var foes = aliveOf((side === "ally") ? this.getFieldEnemies() : this.getFieldAllies());

    var normalId = this.getNormalAttackId();
    var skills = [], revives = [];
    var list = actor.skills || [];
    for (var i = 0; i < list.length; i++) {
      var skill = this.data.getSkill(list[i]);
      if (!skill || list[i] === normalId) continue;
      if (!this._canUseSkill(actor, list[i])) continue;
      // 立ち塞がる（cover）はターンの頭で構える技なので、番が来てからでは間に合わない
      if (skill.cover) continue;
      // 即死の技は使わない（作者の指定）
      if (this._isInstantDeathSkill(skill)) continue;
      // 倒れた仲間を起こす技（リザレクト）は、回復や攻撃の候補とは分けて見る
      if (skill.revive) { revives.push(skill); continue; }
      skills.push(skill);
    }

    var picked = this._tacticRevive(revives, own, side, tactic);
    if (!picked && typeof tactic.healBelow === "number") picked = this._tacticHeal(actor, skills, own, tactic);
    if (!picked && tactic.cure) picked = this._tacticCure(skills, own);
    if (!picked && tactic.support) picked = this._tacticSupport(actor, skills, own, foes);
    if (!picked) picked = this._tacticAttack(actor, skills, foes, tactic);
    if (!picked) return { type: "skill", skillId: normalId, targetIndex: 0 };

    return { type: "skill", skillId: picked.skill.id, target: picked.target || null, targetIndex: 0 };
  };

  /**
   * 倒れた仲間を起こす（作戦の reviveSafeHp。いまは「仲間を守る」の 40%。作者 2026-11-06）。
   * 場に倒れた仲間がいて、生きている味方のHPがどれも reviveSafeHp 以上のときだけ、枠の順で最初の1体へ使う
   */
  BattleSystem.prototype._tacticRevive = function (revives, own, side, tactic) {
    if (revives.length === 0 || typeof tactic.reviveSafeHp !== "number") return null;
    for (var i = 0; i < own.length; i++) {
      if (own[i].currentHp / Math.max(1, own[i].getMaxHp()) < tactic.reviveSafeHp) return null;
    }
    var slots = (side === "ally") ? this.getFieldSlots() : this.enemies;
    for (var s = 0; s < slots.length; s++) {
      if (slots[s].isFainted() && !slots[s]._undying && !slots[s]._removed) {
        return { skill: revives[0], target: slots[s] };
      }
    }
    return null;
  };

  function aliveOf(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) if (!list[i].isFainted() && !list[i]._removed) out.push(list[i]);
    return out;
  }

  /** 回復の技の、だいたいの回復量（{min,max} の真ん中か amount） */
  function healAmountOf(skill) {
    var h = skill.heal || {};
    if (typeof h.amount === "number") return h.amount;
    return ((h.min || 0) + (h.max || h.min || 0)) / 2;
  }

  /** 即死を入れる技か（data/statuses.js の instantKill。作戦では使わない） */
  BattleSystem.prototype._isInstantDeathSkill = function (skill) {
    if (!skill || !skill.status) return false;
    var def = this.data.getStatus ? this.data.getStatus(skill.status.id) : null;
    return !!(def && def.instantKill);
  };

  /** PPが軽い順（同じなら後ろの比べ方に任せる） */
  function cheaperFirst(a, b) { return (a.pp || 0) - (b.pp || 0); }

  /**
   * 回復：healBelow を下回った味方を治す。
   *   下回った味方が2体以上で、味方全体を治す技があれば全体の技
   *   そうでなければ、いちばん減っている味方を単体の技で（単体が無ければ全体の技）
   * 技の選び方：
   *   cheapHeal … PPのいちばん軽いもの（全回復を優先しない）
   *   ふつう    … 減ったHPを全部埋められる技のうち、回復量がいちばん小さいもの（無駄が少ない）。
   *               全部埋められる技が無ければ、回復量がいちばん大きいもの（全回復を最優先にする）
   */
  BattleSystem.prototype._tacticHeal = function (actor, skills, own, tactic) {
    var wounded = own.filter(function (m) {
      return m.currentHp / Math.max(1, m.getMaxHp()) < tactic.healBelow;
    });
    if (wounded.length === 0) return null;
    wounded.sort(function (a, b) {
      return a.currentHp / Math.max(1, a.getMaxHp()) - b.currentHp / Math.max(1, b.getMaxHp());
    });
    var worst = wounded[0];

    var heals = skills.filter(function (s) { return s.heal && !s.power; });
    var group = heals.filter(function (s) { return s.target === "allAllies"; });
    var single = heals.filter(function (s) {
      return s.target === "ally" || (s.target === "self" && worst === actor);
    });

    var list, target;
    if (wounded.length >= 2 && group.length > 0) { list = group; target = null; }
    else if (single.length > 0) { list = single; target = worst; }
    else if (group.length > 0) { list = group; target = null; }
    else return null;

    if (tactic.cheapHeal) {
      list.sort(function (a, b) { return cheaperFirst(a, b) || healAmountOf(a) - healAmountOf(b); });
      return { skill: list[0], target: target };
    }
    var missing = worst.getMaxHp() - worst.currentHp;
    list.sort(function (a, b) { return healAmountOf(a) - healAmountOf(b) || cheaperFirst(a, b); });
    for (var i = 0; i < list.length; i++) {
      if (healAmountOf(list[i]) >= missing) return { skill: list[i], target: target };
    }
    return { skill: list[list.length - 1], target: target };
  };

  /** その技で、その仲間の状態異常がいくつ治るか */
  function curedCountOf(monster, spec) {
    var only = (spec && spec.statuses) || null;
    var defs = monster.getStatusDefs ? monster.getStatusDefs() : [];
    var count = 0;
    for (var i = 0; i < defs.length; i++) {
      if (only ? only.indexOf(defs[i].id) >= 0 : defs[i].curable) count++;
    }
    return count;
  }

  /**
   * 状態異常を治す：いちばん多く治せる技を使う（掛かっている状態異常に合った技だけが候補）。
   *   治せる状態異常に掛かっている味方が2体以上で、味方全体を治す技があれば全体の技（治る数の合計で比べる）
   *   そうでなければ単体の技を、いちばん多く治る味方へ（単体が無ければ全体の技）。同じならPPの軽いほう
   */
  BattleSystem.prototype._tacticCure = function (skills, own) {
    var cures = skills.filter(function (s) { return s.cureStatus && !s.power; });
    if (cures.length === 0) return null;

    function bestGroup() {
      var best = null;
      for (var i = 0; i < cures.length; i++) {
        if (cures[i].target !== "allAllies") continue;
        var total = 0;
        for (var j = 0; j < own.length; j++) total += curedCountOf(own[j], cures[i].cureStatus);
        if (total > 0 && (!best || total > best.n || (total === best.n && cheaperFirst(cures[i], best.skill) < 0))) {
          best = { skill: cures[i], target: null, n: total };
        }
      }
      return best;
    }
    function bestSingle() {
      var best = null;
      for (var i = 0; i < cures.length; i++) {
        if (cures[i].target !== "ally") continue;
        for (var j = 0; j < own.length; j++) {
          var n = curedCountOf(own[j], cures[i].cureStatus);
          if (n > 0 && (!best || n > best.n || (n === best.n && cheaperFirst(cures[i], best.skill) < 0))) {
            best = { skill: cures[i], target: own[j], n: n };
          }
        }
      }
      return best;
    }

    var affected = 0;
    for (var k = 0; k < own.length; k++) {
      for (var c = 0; c < cures.length; c++) {
        if (curedCountOf(own[k], cures[c].cureStatus) > 0) { affected++; break; }
      }
    }
    if (affected === 0) return null;
    if (affected >= 2) return bestGroup() || bestSingle();
    return bestSingle() || bestGroup();
  };

  /** 強化・弱体の効果量（倍率は1からの離れ具合。加算・耐性はおおよそ同じ物差しにそろえる） */
  function modifierAmountOf(modifier) {
    var effects = (modifier && modifier.effects) || [];
    var total = 0;
    for (var i = 0; i < effects.length; i++) {
      var e = effects[i];
      if (e.type === "statMultiplier" || e.type === "damageDealt" ||
          e.type === "damageTaken" || e.type === "accuracyMultiplier") total += Math.abs((e.value || 1) - 1);
      else if (e.type === "statBonus") total += Math.abs(e.value || 0) / 20;
      else if (e.type === "resistBonus") total += Math.abs(e.value || 0) / 10;
    }
    return total;
  }

  /** 前の配列のほうが大きければ正（先頭から順に比べる。ほぼ同じ値は同じとみなす） */
  function compareKeys(a, b) {
    for (var i = 0; i < a.length; i++) {
      if (Math.abs(a[i] - b[i]) > 1e-6) return a[i] - b[i];
    }
    return 0;
  }

  /**
   * 補助：強化 → 弱体 → 状態異常 を1手ずつ順番に、まだ掛かっていない相手がいる技を使う（種類の中の比べ方は作者の指定）。
   * 同じ種類の中の比べ方（作者の指定）
   *   強化     … 範囲＝効果量 ＞ 持続ターン   （範囲と効果量は同じ重みで足して比べる）
   *   弱体     … 効果量 ＞ 範囲 ＞ 持続ターン
   *   状態異常 … 持続ターン＝範囲 ＞ 効き    （効き＝入る確率×相手の耐性。耐性しだいなので最後）
   * 範囲は 全体＝1・1体＝0.5、持続ターンは状態異常なら平均ターン（自然に解けないものは6）を6で割ったもの。
   * PP減らし（ミステリーダンス）は、この3つに入らないので使わない
   */
  BattleSystem.prototype._tacticSupport = function (actor, skills, own, foes) {
    var self = this;
    function lacksMod(m, s) { return !(m.getModifier && m.getModifier(s.id)); }
    function statusChance(m, s) {
      var id = s.status.id;
      if (m.isImmuneToStatus && m.isImmuneToStatus(id)) return 0;
      var defs = m.getStatusDefs ? m.getStatusDefs() : [];
      for (var k = 0; k < defs.length; k++) if (defs[k].id === id) return 0;
      var chance = (s.status.chance === undefined) ? 1 : s.status.chance;
      return chance * self._statusResistMultiplier(m, id);
    }
    function rangeOf(s) { return (s.target === "allAllies" || s.target === "allEnemies") ? 1 : 0.5; }
    function pickRandom(list) { return list.length > 0 ? self.random.pick(list) : null; }

    var buffs = [], debuffs = [], statuses = [];
    for (var i = 0; i < skills.length; i++) {
      var s = skills[i];
      if (BattleSystem.dealsDamage(s) || s.heal || s.cureStatus) continue;

      if (s.modifier) {
        var amount = modifierAmountOf(s.modifier);
        var turns = s.modifier.duration || 1;
        if (isRaising(s.modifier)) {
          var target = null, useful;
          if (s.target === "self") useful = lacksMod(actor, s);
          else if (s.target === "ally") { target = pickRandom(own.filter(function (m) { return lacksMod(m, s); })); useful = !!target; }
          else useful = own.some(function (m) { return lacksMod(m, s); });
          if (useful) buffs.push({ skill: s, target: target, key: [rangeOf(s) + Math.min(1, amount), turns] });
        } else {
          // 弱体が効かない相手（弱体への耐性 10）には使わない
          var canDebuff = function (m) { return lacksMod(m, s) && self._debuffResistMultiplier(m) > 0; };
          var foe = null, ok;
          if (s.target === "enemy") { foe = pickRandom(foes.filter(canDebuff)); ok = !!foe; }
          else ok = foes.some(canDebuff);
          if (ok) debuffs.push({ skill: s, target: foe, key: [amount, rangeOf(s), turns] });
        }
      } else if (s.status) {
        var def = this.data.getStatus ? this.data.getStatus(s.status.id) : null;
        var dur = (def && def.duration) ? ((def.duration.min || 1) + (def.duration.max || def.duration.min || 1)) / 2 : 6;
        var bestFoe = null, bestChance = 0, sum = 0, n = 0;
        for (var f = 0; f < foes.length; f++) {
          var ch = statusChance(foes[f], s);
          if (ch <= 0) continue;
          sum += ch; n++;
          if (ch > bestChance) { bestChance = ch; bestFoe = foes[f]; }
        }
        if (n === 0) continue;
        var effect = (s.target === "allEnemies") ? sum / n : bestChance;
        statuses.push({ skill: s, target: (s.target === "allEnemies") ? null : bestFoe,
                        key: [Math.min(1, dur / 6) + rangeOf(s), effect] });
      }
    }

    // 強化 → 弱体 → 状態異常 を順番に回す（使えるものが無い種類は飛ばす）。
    // 強化から順に「全部掛け終わるまで次へ進まない」にすると、強化は数ターンで切れて掛け直しになるので、
    // 弱体・状態異常にいつまでも手が回らなかった（試しで確かめた）
    var groups = [buffs, debuffs, statuses];
    var start = actor._tacticSupportNext || 0;
    for (var step = 0; step < groups.length; step++) {
      var g = (start + step) % groups.length;
      if (groups[g].length === 0) continue;
      groups[g].sort(function (a, b) {
        return compareKeys(b.key, a.key) || cheaperFirst(a.skill, b.skill);
      });
      actor._tacticSupportNext = (g + 1) % groups.length;
      return groups[g][0];
    }
    return null;
  };

  /**
   * 攻撃。
   *   "best"（ふつう） … 見積もりのダメージ（クリティカルなし・ぶれは真ん中。属性・相手の耐性と防御・命中と回避を見る）が
   *                     いちばん大きいもの。1体の技は相手の残りHPを超えるぶんは数えず、倒しきれる相手を少し高く見る（とどめ優先）。
   *                     全体の技は全員ぶんを足す。同じくらいならPPの軽いほう。通常攻撃がいちばんなら通常攻撃
   *   "finishOnly"     … 通常攻撃で倒せる相手がいれば通常攻撃。いなくて、技なら倒せる相手がいれば、その技のうちPPのいちばん軽いもの。
   *                     どちらでもなければ通常攻撃（PPを節約）
   */
  BattleSystem.prototype._tacticAttack = function (actor, skills, foes, tactic) {
    if (foes.length === 0) return null;
    var self = this;
    var normal = this.data.getSkill(this.getNormalAttackId());
    var candidates = [normal];
    for (var i = 0; i < skills.length; i++) {
      var s = skills[i];
      if (!BattleSystem.dealsDamage(s) || s.target === "ally" || s.target === "self" || s.target === "allAllies") continue;
      candidates.push(s);
    }

    if (tactic.attack === "finishOnly") return this._tacticFinish(actor, candidates, foes);

    function valueOn(skill, foe) {
      var est = self.calcDamage(actor, foe, skill, true);
      if (est.immune) return 0;
      var hit = (skill.accuracy === undefined ? 1 : skill.accuracy) * self._accuracyMultiplier(actor, skill);
      if (self.data.getSkillRule(skill, "evadable") !== false && foe.getEvasion) hit *= (1 - foe.getEvasion());
      // 何回か当てる技（二段斬り）は回数ぶん
      var total = est.damage * Math.max(1, skill.hits || 1);
      var dmg = total * hit;
      var value = Math.min(dmg, foe.currentHp) + (total >= foe.currentHp ? foe.currentHp * 0.5 : 0);
      // 反動のある技（捨て身の体当たり）。反動で自分が倒れるなら使わない。そうでなければ受けるぶんを差し引く
      if (skill.recoil) {
        var back = Math.max(1, Math.floor(total * skill.recoil));
        if (back >= actor.currentHp) return -1;
        value -= back * 0.5;
      }
      return value;
    }

    var best = null;
    for (var c = 0; c < candidates.length; c++) {
      var skill = candidates[c];
      if (!skill) continue;
      var value = 0, target = null;
      if (skill.target === "allEnemies") {
        for (var f = 0; f < foes.length; f++) value += valueOn(skill, foes[f]);
      } else {
        var top = -1;
        for (var g = 0; g < foes.length; g++) {
          var v = valueOn(skill, foes[g]);
          if (v > top) { top = v; target = foes[g]; }
        }
        value = top;
      }
      value -= (skill.pp || 0) * 0.01;
      if (!best || value > best.value) best = { skill: skill, target: target, value: value };
    }
    return best;
  };

  /**
   * PPを節約（attack: "finishOnly"）。倒せると見積もれたときだけ技を使う。
   * candidates の先頭は通常攻撃
   */
  BattleSystem.prototype._tacticFinish = function (actor, candidates, foes) {
    var self = this;
    var normal = candidates[0];
    function estimate(skill, foe) {
      var est = self.calcDamage(actor, foe, skill, true);
      return est.immune ? 0 : est.damage * Math.max(1, skill.hits || 1);
    }
    // 倒せる相手のうち、残りHPのいちばん多いもの（無ければ null）
    function killable(skill) {
      var pick = null;
      for (var i = 0; i < foes.length; i++) {
        var dmg = estimate(skill, foes[i]);
        // 反動で自分も倒れる技（捨て身の体当たり）では止めを刺さない
        if (skill.recoil && Math.max(1, Math.floor(dmg * skill.recoil)) >= actor.currentHp) continue;
        if (dmg >= foes[i].currentHp && (!pick || foes[i].currentHp > pick.currentHp)) pick = foes[i];
      }
      return pick;
    }

    var byNormal = killable(normal);
    if (byNormal) return { skill: normal, target: byNormal };

    var list = candidates.slice(1).sort(cheaperFirst);
    for (var i = 0; i < list.length; i++) {
      var foe = killable(list[i]);
      if (foe) return { skill: list[i], target: list[i].target === "allEnemies" ? null : foe };
    }

    // どの技でも倒せないときは、通常攻撃がいちばん効く相手へ
    var best = null, top = -1;
    for (var j = 0; j < foes.length; j++) {
      var v = Math.min(estimate(normal, foes[j]), foes[j].currentHp);
      if (v > top) { top = v; best = foes[j]; }
    }
    return { skill: normal, target: best };
  };

  /**
   * 作戦で動く仲間が、このターン防御するか（ターンの頭で決める）。
   * 自分のHPが defendBelow を下回り、自分では回復の技を使えず、場のほかの仲間に回復の技を使える者がいるとき
   * （治してもらうまで身を守る。治し手がいないのに守り続けると、いつまでも動かなくなるため）
   */
  BattleSystem.prototype._applyTacticDefend = function (actions) {
    for (var i = 0; i < this.slots.length; i++) {
      var action = actions[i];
      if (!action || action.type !== "tactic") continue;
      var actor = this.slots[i];
      if (!actor || actor.isFainted() || !actor.getTactic) continue;
      var tactic = actor.getTactic() || {};
      if (typeof tactic.defendBelow !== "number") continue;
      if (actor.currentHp / Math.max(1, actor.getMaxHp()) >= tactic.defendBelow) continue;
      if (this._canHealNow(actor)) continue;

      var others = this.getFieldAllies();
      var healer = false;
      for (var j = 0; j < others.length; j++) {
        if (others[j] !== actor && !others[j].isFainted() && this._canHealNow(others[j])) { healer = true; break; }
      }
      if (healer) actions[i] = { type: "defend", tactic: true };
    }
  };

  /** HPを治す技を、いまのPPで使えるか */
  BattleSystem.prototype._canHealNow = function (monster) {
    var list = monster.skills || [];
    for (var i = 0; i < list.length; i++) {
      var s = this.data.getSkill(list[i]);
      if (s && s.heal && !s.power && this._canUseSkill(monster, list[i])) return true;
    }
    return false;
  };

  /** 重み（weight）つきの候補から1つ選ぶ */
  BattleSystem.prototype._pickChoice = function (list) {
    var total = 0, i;
    for (i = 0; i < list.length; i++) total += numberOr(list[i].weight, 1);
    var roll = this.random.next() * total;
    for (i = 0; i < list.length; i++) {
      roll -= numberOr(list[i].weight, 1);
      if (roll < 0) return list[i];
    }
    return list[list.length - 1] || null;
  };

  /**
   * その技の効果が、もう自分に掛かっているか。
   * 自分にかける強化・弱体だけを見る（相手にかける技は毎回意味がある）。
   */
  BattleSystem.prototype._modifierAlreadyOn = function (monster, skillId) {
    var skill = this.data.getSkill(skillId);
    if (!skill || !skill.modifier || skill.target !== "self") return false;
    if (!monster.getModifier) return false;

    return !!monster.getModifier(skillId);
  };

  /**
   * 防御を設定し直す。
   * 前のターンの防御はここで解除されるので、効果は「選んだターンの間」だけ続く。
   *
   * ★ 行動できなくなる状態異常とは両立しない（v1.0.0・作者の指定）。
   *   ・眠っている者は身を守れない（ここで防御にしない）
   *   ・防御中に眠り・即死を受けたら、その場で防御が解ける（_breakDefendByStatus）
   *   ・麻痺は五分。手番で動けたら防御が続き、動けなかったら解ける（_blockedByStatus）。
   *     手番が済んだあとに麻痺を受けたときは、その場で同じ確率を振る
   */
  BattleSystem.prototype._applyDefend = function (actions, events) {
    var i;
    // まず全員の防御を解除する
    for (i = 0; i < this.allies.length; i++) this.allies[i]._defending = false;
    for (i = 0; i < this.enemies.length; i++) this.enemies[i]._defending = false;

    for (i = 0; i < this.slots.length; i++) {
      var action = actions && actions[i];
      if (!action || action.type !== "defend") continue;
      var monster = this.slots[i];
      if (monster.isFainted()) continue;

      var sleeping = this._alwaysBlockingStatus(monster);
      if (sleeping) {
        events.push({ type: "defendFailed", targetSide: "ally",
          targetName: monster.getName(), target: monster, statusId: sleeping.id, statusName: sleeping.name });
        continue;
      }

      monster._defending = true;
      events.push({ type: "defend", side: "ally", actorName: monster.getName(), target: monster });
    }
  };

  /** 行動順に並んだ者に「まだ手番がある」印（_pendingStep）を付け、ほかの者からは外す */
  BattleSystem.prototype._markPendingSteps = function (order) {
    var everyone = (this.allies || []).concat(this.enemies || []);
    for (var i = 0; i < everyone.length; i++) everyone[i]._pendingStep = false;
    for (var j = 0; j < order.length; j++) {
      if (!order[j]._done) order[j].actor._pendingStep = true;
    }
  };

  /** 必ず手番を失う状態異常（眠り。blocksTurn: "always"）に掛かっていれば、その定義。無ければ null */
  BattleSystem.prototype._alwaysBlockingStatus = function (monster) {
    var defs = monster.getStatusDefs ? monster.getStatusDefs() : [];
    for (var i = 0; i < defs.length; i++) {
      if (defs[i].blocksTurn === "always") return defs[i];
    }
    return null;
  };

  /**
   * 防御中に状態異常を受けたとき、防御が解けるか。
   *   即死 … 倒れるので黙って外す
   *   眠り（blocksTurn: "always"） … 必ず解ける
   *   麻痺（blocksTurn が確率） … まだ手番が来ていなければ、手番の判定（_blockedByStatus）に任せる。
   *                               もう手番が済んでいれば（または手番の無いターンなら）、ここで同じ確率を振る
   */
  BattleSystem.prototype._breakDefendByStatus = function (target, def, targetSide, events) {
    if (!target || !target._defending || !def) return;
    if (def.instantKill) { target._defending = false; return; }

    var block = def.blocksTurn;
    var broken = false;
    if (block === "always") broken = true;
    else if (typeof block === "number" && !target._pendingStep) broken = this.random.next() < block;
    if (!broken) return;

    target._defending = false;
    events.push({ type: "defendBroken", targetSide: targetSide,
      targetName: target.getName(), target: target, statusId: def.id, statusName: def.name });
  };

  /** 「攻撃」に使う技id */
  BattleSystem.prototype.getNormalAttackId = function () {
    return (this.data.battle || {}).normalAttackSkill || "normalAttack";
  };

  /**
   * その技を今のPPで使えるか。
   * PPを持たない相手（テスト用の簡易オブジェクトなど）は常に使える扱い。
   */
  BattleSystem.prototype._canUseSkill = function (actor, skillId) {
    var skill = this.data.getSkill(skillId);
    if (!skill) return false;

    var cost = this.ppCostOf(actor, skill);
    if (cost <= 0) return true;
    if (!actor.canPayPp) return true;
    return actor.canPayPp(cost);
  };

  /**
   * その者がその技を使うときに払うPP（v1.0.0）。ふつうは技の pp のまま。
   *   ・敵として PP が減らない者（data/dungeons.js の出現の表の infinitePp。シニガミ）… 0
   *   ・特性「死神」（効果の種類 freeDeathSkills）を持つ者が、即死を付ける技を使うとき … 0
   *   ・特性「カチカチ」（効果の種類 ppCostMultiplier）… ×1.5（MonsterInstance.getSkillPpCost）
   * 戦闘の画面（技の一覧の PP 表示・使えるかどうか）もこれを見る
   */
  BattleSystem.prototype.ppCostOf = function (actor, skill) {
    var cost = (skill && skill.pp) || 0;
    if (cost <= 0 || !actor) return 0;
    if (actor.infinitePp) return 0;
    if (skill.status && skill.status.id === "instantDeath" && this._hasEffect(actor, "freeDeathSkills")) return 0;
    return actor.getSkillPpCost ? actor.getSkillPpCost(skill) : cost;
  };

  /** 特性・装備・強化などに、その種類の効果が1つでもあるか */
  BattleSystem.prototype._hasEffect = function (monster, type) {
    if (!this.effects || !this.effects.collectEffects) return false;
    var list = this.effects.collectEffects(monster) || [];
    for (var i = 0; i < list.length; i++) if (list[i] && list[i].type === type) return true;
    return false;
  };

  /** 1体分の行動を実行する */
  BattleSystem.prototype._performAction = function (step, events) {
    var action = step.action || { type: "skip" };

    // 状態異常で動けないか（麻痺・眠り）。動けなければ、そこで手番が終わる。
    // ただし交代は止めない（入れ替えるのは本人ではなく主人公。眠った仲間を下げて立て直せるように。v1.0.0・作者の指定）
    if (action.type !== "swap" && this._blockedByStatus(step, events)) return;

    // 逃げることのある敵（出現の表の fleeRate。ジュエル）。動けるときだけ、手番の頭で逃げるかを決める
    if (step.side === "enemy" && this._tryEnemyFlee(step.actor, events)) return;

    // 作戦で動く仲間は、ここ（自分の番が来たとき）で行動を決める（v1.0.0。_chooseTacticAction）
    if (action.type === "tactic") {
      action = this._chooseTacticAction(step.actor, step.side, action.tacticId);
      step.action = action;
    }

    // ようすをみる。何もしないが、何もしなかったと分かるようにする
    if (action.type === "wait") {
      events.push({ type: "wait", side: step.side, actorName: step.actor.getName() });
      return;
    }

    // 技以外（道具・スカウトなど）は、BattleSystem は中身を知らない。
    // 呼び出し側が設定した onNonSkillAction に、正しい行動順のタイミングで処理を任せる。
    if (action.type !== "skill") {
      if (this.onNonSkillAction) this.onNonSkillAction(step, events);
      return;
    }

    // 封印。技は使えないが、通常攻撃はできる
    if (this._sealedFrom(step, action, events)) return;

    var skill = this.data.getSkill(action.skillId);

    // 番が来るまでに PP が足りなくなった、味方や自分へ向ける技（キュア・こうかなど）は通常攻撃に切り替わる。
    // 相手も向かい側から選び直す（味方や自分を殴らないように）
    if (skill && (skill.target === "ally" || skill.target === "self") && !this._canUseSkill(step.actor, action.skillId)) {
      action = { type: "skill", skillId: this.getNormalAttackId(), targetIndex: 0 };
      skill = this.data.getSkill(action.skillId);
    }

    // 範囲全体の技は、向かい側の盤面にいる全員が対象
    if (skill && skill.target === "allEnemies") {
      var group = (step.side === "ally") ? this.getFieldEnemies() : this.getFieldAllies();
      this._performSkillOnAll(step.actor, group.slice(), action.skillId, step.side, events);
      return;
    }

    // 味方全体にかける技（芽吹きの加護。v1.0.0）は、自分の側の盤面にいる全員（自分も含む）
    if (skill && skill.target === "allAllies") {
      var own = (step.side === "ally") ? this.getFieldAllies() : this.getFieldEnemies();
      this._performSkillOnAllies(step.actor, own.slice(), action.skillId, step.side, events);
      return;
    }

    // 倒れた仲間を起こす技（リザレクト）は、ふつうの「生きている相手」の選び方を通らない
    if (skill && skill.revive) {
      this._performRevive(step, action, skill, events);
      return;
    }

    // 自分にかける技（バフなど）は相手を選ばない
    var target = (skill && skill.target === "self")
      ? step.actor
      : this._resolveTarget(step, action, skill);
    if (!target) return;

    // 向かい側を狙う技は、立ち塞がっている者がいればそちらへ向く（自分・味方にかける技は変えない）
    if (!skill || (skill.target !== "self" && skill.target !== "ally")) {
      target = this._coverFor(target, step.side);
    }

    // 「必ずクリティカル」（主の行動手順 _patternAction・出る場所の表の criticalAttack の forceCritical）は、この1回だけ効かせる
    this._forceCritical = action.forceCritical === true;
    try {
      this._performSkill(step.actor, target, action.skillId, step.side, events);
    } finally {
      this._forceCritical = false;
    }
  };

  /**
   * 倒れた仲間を起こす技（data/skills.js の revive。リザレクト）。
   * 道具の神鳥の羽と同じく、選んだ個体そのものへ向ける。外れてもPPは払う。
   * 番が来るまでに相手が起きていた（別の技・道具で）なら「倒れていない」と伝える
   */
  BattleSystem.prototype._performRevive = function (step, action, skill, events) {
    var side = step.side;
    var actor = step.actor;
    var slots = (side === "ally") ? this.getFieldSlots() : this.enemies;
    var target = action.target || slots[action.targetIndex || 0];
    if (!target) return;
    if (!this._prepareSkill(actor, skill.id, side, events)) return;

    if (!target.isFainted() || target._undying) {
      events.push({ type: "reviveNone", side: side, targetSide: side,
        targetName: target.getName(), target: target });
      return;
    }
    if (this.random.next() >= numberOr(skill.revive.chance, 1)) {
      events.push({ type: "reviveFail", side: side, targetSide: side,
        targetName: target.getName(), target: target, se: "miss" });
      return;
    }
    var result = NS.ItemUsage.reviveTarget(target, skill.revive.hpRatio);
    events.push({
      type: "revive", side: side, targetSide: side,
      targetName: target.getName(), target: target, skillId: skill.id,
      // 形は回復の出来事とそろえてある（緑の数字・HPバー・回復の動き）
      healAmount: result.amount, revealTarget: target, revealHp: target.currentHp,
      // 見せた瞬間に状態異常の印を消す（起きるときに全部外れる）
      statusTarget: target, statusIds: []
    });
  };

  /**
   * 状態異常で手番そのものを失うか（麻痺・眠り）。
   *
   * data/statuses.js の blocksTurn を見る。
   *   "always" … 必ず動けない（眠り）
   *   数値      … その確率で動けない（麻痺の0.5）
   *
   * 複数掛かっているときは、上から順に見て**最初に止めたものだけ**を知らせる。
   * 「眠っている」と「しびれて動けない」が同時に並ぶと、何で止まったのか分からないため。
   *
   * @returns {boolean} 止められたか
   */
  BattleSystem.prototype._blockedByStatus = function (step, events) {
    var actor = step.actor;
    var defs = actor.getStatusDefs ? actor.getStatusDefs() : [];

    for (var i = 0; i < defs.length; i++) {
      var block = defs[i].blocksTurn;
      if (block === undefined || block === null) continue;

      var stopped = (block === "always") || (this.random.next() < block);
      if (!stopped) continue;

      events.push({
        type: "statusBlocked", targetSide: step.side,
        targetName: actor.getName(), target: actor,
        statusId: defs[i].id, statusName: defs[i].name
      });
      // 防御していた者は、動けなかったら防御が解ける（麻痺で動けたときは続く。v1.0.0）
      if (actor._defending) {
        actor._defending = false;
        events.push({ type: "defendBroken", targetSide: step.side,
          targetName: actor.getName(), target: actor, statusId: defs[i].id, statusName: defs[i].name });
      }
      return true;
    }
    return false;
  };

  /**
   * 封印で、その技が使えないか。
   *
   * ★ 通常攻撃（data/battle.js の normalAttackSkill）は止めない。
   *   「攻撃」はコマンドであって覚えた技ではないので、
   *   これも封じると何もできない相手になってしまう。
   * ★ blocksSkillKinds を書いた状態異常は、その種類の技だけを止める
   *   （封印は共鳴だけ。斬撃・体技などは封印中も出せる）
   *
   * @returns {boolean} 止められたか
   */
  BattleSystem.prototype._sealedFrom = function (step, action, events) {
    var actor = step.actor;
    var normalId = (this.data.battle || {}).normalAttackSkill;
    if (action.skillId === normalId) return false;
    var skill = this.data.getSkill(action.skillId);

    var defs = actor.getStatusDefs ? actor.getStatusDefs() : [];
    for (var i = 0; i < defs.length; i++) {
      var kinds = defs[i].blocksSkillKinds;
      if (kinds) {
        if (!skill || kinds.indexOf(skill.kind) < 0) continue;
      } else if (!defs[i].blocksSkills) {
        continue;
      }

      events.push({
        type: "statusBlocked", targetSide: step.side,
        targetName: actor.getName(), target: actor,
        statusId: defs[i].id, statusName: defs[i].name
      });
      return true;
    }
    return false;
  };

  /**
   * 命中率に掛かる倍率（盲目）。
   * 属性耐性と同じで、引き算ではなく掛け算にそろえてある。
   * 盲目（状態異常の accuracyMul）は、通常攻撃・体技・斬撃にだけ掛かる（2026-11-03 作者の指定。_isPhysicalAction）。
   * skill を渡さなければ、今までどおり何にでも掛ける
   */
  BattleSystem.prototype._accuracyMultiplier = function (actor, skill) {
    var defs = actor && actor.getStatusDefs ? actor.getStatusDefs() : [];
    var total = 1;

    // ignoreBlind の技（体当たり。v1.4.1）は盲目の効果を受けない。朧羽などの命中の倍率（下）は受ける
    var blindApplies = !skill || (this._isPhysicalAction(skill) && !skill.ignoreBlind);
    for (var i = 0; i < defs.length && blindApplies; i++) {
      if (typeof defs[i].accuracyMul === "number") total *= defs[i].accuracyMul;
    }
    // 弱体・装備などの命中の倍率（朧羽など。盲目とは別に掛け合わさる）
    if (this.effects && actor) total *= this.effects.getAccuracyMultiplier(actor);
    return total;
  };

  /**
   * 体を使う行動か（通常攻撃・体技・斬撃）。ちからため の倍率と盲目は、これにだけ効く（2026-11-03 作者の指定）。
   * 種類は画面に出る種類（skill.kind）で見る。死神の鎌（踊り。計算だけ斬撃）は踊りなので入らない
   */
  BattleSystem.prototype._isPhysicalAction = function (skill) {
    if (!skill) return false;
    if (skill.id === this.getNormalAttackId()) return true;
    return skill.kind === "body" || skill.kind === "slash";
  };

  /**
   * ちからため が乗る技か（v1.4.1・2026-11-12 作者の指定）。
   * 1体の通常攻撃・体技・斬撃で、ダメージを与えるもの。全体の技には乗らない
   */
  BattleSystem.prototype._chargeApplies = function (skill) {
    if (!skill || !BattleSystem.dealsDamage(skill) || !this._isPhysicalAction(skill)) return false;
    return (skill.target || "enemy") === "enemy";
  };

  /**
   * 手番のあとに、ためた力を消すか決める（v1.4.1）。
   * ためたその手番なら残す（次の手番まで）。次の手番で乗る技を使っていれば、もう _useSkill で消えている。
   * それ以外（乗らない技・防御・道具・麻痺や眠りで動けなかった）は、ここで消える
   */
  BattleSystem.prototype._expireCharge = function (actor, side, events) {
    if (!actor || !actor._charged) return;
    if (actor._chargeFresh) { actor._chargeFresh = false; return; }
    actor._charged = null;
    if (!actor.isFainted || !actor.isFainted()) {
      events.push({ type: "chargeLost", targetSide: side, targetName: actor.getName(), target: actor });
    }
  };

  /**
   * 殴られて目を覚ますか（眠り）。
   *
   * ダメージを受けたときにだけ呼ぶ。
   * 「起こしてしまうので殴れない」という読み合いを作るための仕掛け。
   */
  BattleSystem.prototype._wakeOnDamage = function (target, events) {
    var defs = target && target.getStatusDefs ? target.getStatusDefs() : [];

    for (var i = 0; i < defs.length; i++) {
      var chance = defs[i].wakeOnDamage;
      if (typeof chance !== "number") continue;
      if (this.random.next() >= chance) continue;

      target.removeStatus(defs[i].id);
      events.push({
        type: "statusEnd", targetName: target.getName(), target: target,
        statusId: defs[i].id, statusName: defs[i].name
      });
    }
  };

  /**
   * 行動時点での対象を決める。
   *
   * 対象は「番号」ではなく「選んだ個体そのもの」で覚えておく（action.target）。
   * 番号だけで覚えると、先に別の相手が倒れて並びがずれたときに
   * 狙っていない相手を攻撃してしまうため。
   * 選んだ相手が既に倒れている場合だけ、生きている別の相手に切り替える。
   */
  BattleSystem.prototype._resolveTarget = function (step, action, skill) {
    var candidates = this._candidatesFor(step.side, skill);
    if (candidates.length === 0) return null;

    // 選んだ個体が今も戦えるならそのまま
    if (action.target && !action.target.isFainted()
        && candidates.indexOf(action.target) >= 0) {
      return action.target;
    }

    // 個体を覚えていない場合（敵の行動など）は番号で探す
    var index = action.targetIndex;
    if (index === undefined || index === null) index = 0;

    var target = candidates[index];
    if (target && !target.isFainted()) return target;

    return candidates[0] || null;
  };

  /**
   * その技が狙える相手の一覧。
   *
   * ふつうは向かい側だが、味方にかける技（target: "ally"）だけは
   * 行動した側の盤面から選ぶ。回復役を成り立たせるための分岐。
   */
  BattleSystem.prototype._candidatesFor = function (side, skill) {
    var own = (side === "ally") ? this.getFieldAllies() : this.getFieldEnemies();
    var foe = (side === "ally") ? this.getFieldEnemies() : this.getFieldAllies();
    return (skill && skill.target === "ally") ? own : foe;
  };

  /**
   * HPを回復する技。
   * 回復量は data/skills.js の heal（{ min, max } または { amount }）で決める。
   *
   * ★ 攻撃力では変わらない固定値にしてある。
   *   攻撃力に比例させると、育てるほど回復量まで伸びて手がつけられなくなるため。
   */
  BattleSystem.prototype._applyHeal = function (actor, target, skill, side, events) {
    // 亡者の魂で踏みとどまっている者（HP0）も回復できない
    if (!target || !target.heal || target.isFainted() || target._undying) return;

    var spec = skill.heal || {};
    var min = (typeof spec.min === "number") ? spec.min
            : ((typeof spec.amount === "number") ? spec.amount : 0);
    var max = (typeof spec.max === "number") ? spec.max : min;
    if (max < min) max = min;

    var amount = (max > min) ? this.random.nextInt(min, max) : min;
    if (amount <= 0) return;

    // 使う側の「回復の技」への倍率（粘晶のネックレスなど。data/items.js の healDealt）
    if (this.effects) amount = Math.floor(amount * this.effects.getHealDealtMultiplier(actor));

    var before = target.currentHp;
    target.heal(amount);

    var healed = target.currentHp - before;
    if (healed <= 0) {
      // 満タンで効果がなかったことは伝える（手番を捨てたと分かるように）
      events.push({
        type: "healFull", side: side,
        // 治す相手は行動した側にいる。書かないと「敵の」が付いてしまう
        targetSide: side,
        targetName: target.getName(), target: target
      });
      return;
    }

    // イベントの形は道具の回復・吸血とそろえてある（画面側は変更不要）
    events.push({
      type: "heal", side: side,
      targetSide: side,
      targetName: target.getName(),
      healAmount: healed,
      revealTarget: target,
      revealHp: target.currentHp,
      // 画面が回復の技の演出を出すのに使う（キュアなど。v1.3.0）。道具の回復には付かない
      target: target, skillId: skill.id
    });
  };

  /**
   * 状態異常を治す技（data/skills.js の cureStatus。クレンズ）。
   * 治すものが無ければ「治すものがなかった」と伝える（回復技の満タンと同じ扱い。手番を捨てたと分かるように）。
   * 出来事の形は道具の解毒草とそろえてある（statusTarget / statusIds で、見せた瞬間に印を消す）
   */
  BattleSystem.prototype._applyCure = function (target, skill, side, events) {
    if (!target || target.isFainted() || target._undying) return;

    var cured = BattleSystem.cureStatuses(target, skill.cureStatus);
    if (cured.length === 0) {
      events.push({ type: "cureNone", side: side, targetSide: side,
        targetName: target.getName(), target: target });
      return;
    }

    var left = target.getStatusDefs ? target.getStatusDefs() : [];
    var ids = [];
    for (var i = 0; i < left.length; i++) ids.push(left[i].id);
    events.push({
      type: "cure", side: side,
      // 画面が「技で治した」と分かるように（技の演出を出すのはこのときだけ。特性「脱皮」の cure には付かない）
      skillId: skill.id,
      // 治す相手は行動した側にいる。書かないと「敵の」が付いてしまう
      targetSide: side,
      targetName: target.getName(), target: target,
      statusNames: cured.map(function (def) { return def.name; }),
      statusTarget: target, statusIds: ids,
      se: "heal"
    });
  };

  /**
   * 相手のPPを減らす（技の ppDamage。v1.0.0）。{ min, max } の幅で減らし、残りが足りなければ残りぶんだけ。
   * 出来事は ppTarget / ppValue を持つので、画面は見せた瞬間にPPバーを減らす（PPを戻す道具と同じ見せ方）
   */
  BattleSystem.prototype._applyPpDamage = function (target, skill, side, events) {
    if (!target || target.currentPp === undefined) return;
    var spec = skill.ppDamage || {};
    var min = numberOr(spec.min, 1), max = numberOr(spec.max, min);
    var amount = Math.min(target.currentPp, this.random.nextInt(min, max));
    target.currentPp -= amount;
    events.push({
      type: "ppDamage", targetSide: opposite(side),
      targetName: target.getName(), target: target, amount: amount,
      ppTarget: target, ppValue: target.currentPp,
      // 減ったときは弱体と同じ音（作者の指定）。減らなかったとき（PPが0）は鳴らさない
      se: amount > 0 ? "debuff" : null
    });
  };

  /**
   * 状態異常を治す（技の cureStatus。戦闘と探索中の技 Game.useFieldSkill の両方が使う）。
   *   spec.statuses: ["poison"] … 書いたものだけ治す
   *   statuses を省略           … curable: true のものを全部治す（道具の cureStatus と同じ決まり）
   * @returns {object[]} 治した状態異常の定義（data/statuses.js）。無ければ空
   */
  BattleSystem.cureStatuses = function (target, spec) {
    if (!target || !target.getStatusDefs || !target.removeStatus) return [];
    var only = (spec && spec.statuses) || null;
    var defs = target.getStatusDefs();
    var picked = [];
    // 治しながら配列が縮むので、先に「治すもの」を決めてから外す
    for (var i = 0; i < defs.length; i++) {
      if (only ? only.indexOf(defs[i].id) < 0 : !defs[i].curable) continue;
      picked.push(defs[i]);
    }
    var cured = [];
    for (var j = 0; j < picked.length; j++) {
      if (target.removeStatus(picked[j].id)) cured.push(picked[j]);
    }
    return cured;
  };

  /** その相手に、技が治せる状態異常が掛かっているか（敵が意味のないクレンズを選ばないように） */
  BattleSystem.hasCurable = function (target, spec) {
    if (!target || !target.getStatusDefs) return false;
    var only = (spec && spec.statuses) || null;
    var defs = target.getStatusDefs();
    for (var i = 0; i < defs.length; i++) {
      if (only ? only.indexOf(defs[i].id) >= 0 : defs[i].curable) return true;
    }
    return false;
  };

  /**
   * 状態異常を1つかける。
   *
   * 通るかどうかは「技に書いた確率 × 耐性の倍率」で決まる。
   * 耐性の式は属性耐性とまったく同じ（data/battle.js の resistance）ので、
   * 耐性10で無効、5で半減になる。覚える仕組みを2つにしないため。
   *
   * ★ 即死だけは特別で、次の2つを先に見る。
   *   ・主（ボス）は受け付けない
   *   ・味方が最後の1体のときは効かない（HP1で耐える）
   *   運だけで挑戦が終わるのを防ぐため。罠の leaveAtLeast: 1 と同じ考え方。
   */
  BattleSystem.prototype._applyStatus = function (actor, target, skill, side, events) {
    var spec = skill.status;
    var def = this.data.getStatus ? this.data.getStatus(spec.id) : null;
    if (!def) return;

    var targetSide = (target === actor || skill.target === "ally") ? side : opposite(side);

    // 完全に無効な相手（主の即死耐性など）
    if (target.isImmuneToStatus && target.isImmuneToStatus(spec.id)) {
      events.push({ type: "statusImmune", targetSide: targetSide,
        targetName: target.getName(), target: target, statusId: spec.id, statusName: def.name });
      return;
    }

    var chance = (spec.chance === undefined) ? 1 : spec.chance;
    chance *= this._statusResistMultiplier(target, spec.id);
    if (this.random.next() >= chance) {
      events.push({ type: "statusMiss", targetSide: targetSide,
        targetName: target.getName(), target: target, statusId: spec.id, statusName: def.name });
      return;
    }

    // 特性「芽吹き」の守り。本当に掛かるときだけ1回防いで消える
    if (this._consumeWard(target, def, targetSide, events)) return;

    if (def.instantKill) {
      if (target._defending) target._defending = false;
      this._applyInstantKill(target, def, targetSide, events);
      return;
    }

    var applied = target.addStatus(spec.id, this.random);
    if (!applied) return;

    events.push({
      type: "status", targetSide: targetSide,
      targetName: target.getName(), target: target,
      statusId: spec.id, statusName: def.name,
      renewed: applied.renewed
    });
    // 眠り・麻痺を受けたら、防御が解けることがある（v1.0.0）
    this._breakDefendByStatus(target, def, targetSide, events);
  };

  /**
   * 即死を通す。
   *
   * 最後の1体でも守らない。最後の味方に通れば、そこで挑戦が終わる。
   * だからこそ耐性装備を積む意味が生まれる、という設計にしてある。
   */
  BattleSystem.prototype._applyInstantKill = function (target, def, targetSide, events) {
    target.takeDamage(target.currentHp);
    events.push({ type: "status", targetSide: targetSide,
      targetName: target.getName(), target: target,
      statusId: def.id, statusName: def.name, renewed: false });
    // statusId は「何で倒れたか」。即死の音が倒れる音を兼ねるので、画面側はこれを見て faint の音を省く
    events.push({ type: "faint", targetSide: targetSide,
      targetName: target.getName(), target: target, statusId: def.id });
  };

  /**
   * 状態異常の通りやすさ。属性耐性と同じ式を使う。
   *   耐性が0以上   … 倍率 = 1 - 耐性 × resistStep
   *   耐性がマイナス … 倍率 = 1 + |耐性| × weaknessStep
   */
  BattleSystem.prototype._statusResistMultiplier = function (target, statusId) {
    if (!target.getStatusResist) return 1;
    return this._resistValueMultiplier(target.getStatusResist(statusId));
  };

  /**
   * 弱体が入る確率（弱体への耐性。MonsterInstance.getDebuffResist）。表は状態異常の耐性と同じ。
   * 主は共通の値（data/battle.js の bossDebuffResist）か、主ごとの値（data/bosses.js の debuffResist）を持つ
   */
  BattleSystem.prototype._debuffResistMultiplier = function (target) {
    if (!target || !target.getDebuffResist) return 1;
    var base = (this.data.battle || {}).debuffResistBase;
    return Math.min(1, this._resistValueMultiplier(target.getDebuffResist(base)));
  };

  /** 耐性の値 → 倍率（属性・状態異常・弱体で共通の表。data/battle.js の resistance） */
  BattleSystem.prototype._resistValueMultiplier = function (resist) {
    var config = (this.data.battle || {}).resistance || {};
    if (resist >= (config.immuneAt || 10)) return 0;

    var step = (resist >= 0)
      ? 1 - resist * (config.resistStep || 0.1)
      : 1 + Math.abs(resist) * (config.weaknessStep || 0.2);

    return Math.max(config.minMultiplier || 0, step);
  };

  /**
   * バフ／デバフを1つかける。
   * 効果の中身は data/skills.js の modifier に書いてあり、
   * 書き方は特性・装備・加護と同じなので、ここは渡すだけでよい。
   */
  BattleSystem.prototype._applyModifier = function (actor, target, skill, side, events) {
    if (!target.addModifier) return;

    // 弱体への耐性（2026-10-15。作者の指定）。相手に掛ける弱体は、耐性の倍率の確率でしか入らない。
    // 入らなければ「MISS」（状態異常が入らなかったときと同じ見せ方）。耐性 0 の相手には乱数を使わない
    var hostile = (target !== actor && skill.target !== "self" && skill.target !== "ally" && skill.target !== "allAllies");
    if (hostile && !isRaising(skill.modifier)) {
      var chance = this._debuffResistMultiplier(target);
      if (chance < 1 && this.random.next() >= chance) {
        events.push({ type: "modifierMiss", side: side, targetSide: opposite(side),
          targetName: target.getName(), target: target, skillId: skill.id });
        return;
      }
    }

    var applied = target.addModifier(skill);
    if (!applied) return;

    events.push({
      type: "modifier", side: side,
      // 自分・味方にかける技では対象が行動した側と同じになるので、対象の側も渡す
      // （味方にかける強化で「敵の ○○」と出ないように。導きの光など）
      targetSide: (target === actor || skill.target === "ally" || skill.target === "allAllies") ? side : opposite(side),
      targetName: target.getName(), target: target,
      skillId: skill.id, skillName: skill.name,
      // 画面が印を出すのに使う（実際の効果より遅れて出すので、中身も渡しておく）
      effects: skill.modifier.effects || [],
      message: skill.modifier.message || null,
      // 画面上部の札に出す言葉（書いていなければ画面が能力から作る）
      popup: skill.modifier.popup || null,
      // 同じものが既に掛かっていた場合は「かけ直した」と分かるようにする
      renewed: applied.renewed,
      // 上がったのか下がったのかは、画面側が印の色を決めるのに使う
      raised: isRaising(skill.modifier)
    });
  };

  function opposite(side) { return (side === "ally") ? "enemy" : "ally"; }

  /**
   * その効果が「強くする」ものか。
   * ステータスの倍率が1より大きい、または受けるダメージが1より小さければ強化とみなす。
   */
  function isRaising(spec) {
    var effects = (spec && spec.effects) || [];
    for (var i = 0; i < effects.length; i++) {
      var e = effects[i];
      if (e.type === "statMultiplier" && e.value > 1) return true;
      if (e.type === "statBonus" && e.value > 0) return true;
      if (e.type === "damageDealt" && e.value > 1) return true;
      if (e.type === "damageTaken" && e.value < 1) return true;
      if (e.type === "accuracyMultiplier" && e.value > 1) return true;
      if (e.type === "resistBonus" && e.value > 0) return true;
      // 毎ターン戻す効果（樹液の膜）
      if ((e.type === "regenOverTime" || e.type === "ppRegen") && (e.value || e.min) > 0) return true;
    }
    return false;
  }

  /** 技を使用し、PPの支払い・命中判定・ダメージ適用を行う（単体） */
  BattleSystem.prototype._performSkill = function (actor, target, skillId, side, events) {
    var skill = this._prepareSkill(actor, skillId, side, events);
    if (!skill) return;

    // 何回か当てる技（二段斬り。技の hits）。1回ずつ命中を判定し、相手が倒れたらそこで止める
    // randomTargets（歯車投げ。v1.3.0）は1回ごとに向かい側の盤面からでたらめに1体選ぶ（立ち塞がる者がいればそちらへ）。
    // 相手が全員倒れるまで続ける
    var hits = Math.max(1, skill.hits || 1);
    for (var h = 0; h < hits; h++) {
      if (h > 0 && actor.isFainted()) break;
      var aim = target;
      if (skill.randomTargets) {
        aim = this._randomFoe(side, skill);
        if (!aim) break;
      } else if (h > 0 && (target.isFainted() || target._removed)) break;
      this._resolveHit(actor, aim, skill, side, events);
    }
  };

  /** 向かい側の盤面の、倒れていない1体をでたらめに（立ち塞がる者がいればそちら）。いなければ null */
  BattleSystem.prototype._randomFoe = function (side, skill) {
    var group = this._candidatesFor(side, skill);
    var alive = [];
    for (var i = 0; i < group.length; i++) {
      if (!group[i].isFainted() && !group[i]._removed) alive.push(group[i]);
    }
    if (alive.length === 0) return null;
    return this._coverFor(alive[this.random.nextInt(0, alive.length - 1)], side);
  };

  /**
   * 範囲全体の技。
   * 「〜の○○!」の宣言とPPの支払いは1回だけ行い、
   * 命中判定とダメージは相手ごとに出す（1体ずつ避けたり耐えたりできる）。
   */
  BattleSystem.prototype._performSkillOnAll = function (actor, targets, skillId, side, events) {
    var skill = this._prepareSkill(actor, skillId, side, events);
    if (!skill) return;

    // PPが足りずに通常攻撃へ切り替わった場合は、範囲技ではないので1体だけ。
    // 立ち塞がっている者がいれば、ほかの攻撃と同じくそちらへ向く（v1.3.1 で直した。前は素通りしていた）
    if (skill.target !== "allEnemies") {
      if (targets[0]) this._resolveHit(actor, this._coverFor(targets[0], side), skill, side, events);
      return;
    }

    // 相手ごとの出来事を一度べつに受けて、あとで「同時に見せる」順に並べ直す
    var segments = [];
    for (var i = 0; i < targets.length; i++) {
      // 立ち塞がっている者がいれば、1体ずつそちらへ向く（全員ぶんを1体で受ける）
      var target = this._coverFor(targets[i], side);
      // この技で先に倒れた相手は飛ばす
      if (target.isFainted() || target._removed) continue;
      var start = events.length;
      this._resolveHit(actor, target, skill, side, events);
      segments.push({ target: target, events: events.splice(start, events.length - start) });
    }
    this._pushSimultaneous(actor, skill, segments, events);
  };

  /**
   * 全体の技の出来事を、画面が「同時に」見せられる順に並べ直す（RC-1。作者の指定）。
   * 計算は相手1体ずつ済んでいるので、変わるのは見せる順番だけ。
   *
   *   1. 当たり … 全員の ダメージ／外れ／無効（と、いまひとつ等の印）  → 同時に出す
   *   2. 倒れる … 全員の 倒れた／踏みとどまった                       → 同時に出す
   *   3. そのほか … 吸収・特性の反撃・目を覚ます など（相手の順のまま）
   *   4. 追加の効果 … 技の状態異常の結果・技の弱体                     → 同時に出す
   * 同時に出す出来事には、同じ番号の simul を付ける（BattleScene が待たずに続けて見せる）。
   *
   * ★ 立ち塞がるで同じ相手が2回以上受けたときは並べ直さない（同じ所に数字が重なるため）
   */
  BattleSystem.prototype._pushSimultaneous = function (actor, skill, segments, events) {
    var i, j;
    var targets = [];
    for (i = 0; i < segments.length; i++) {
      if (targets.indexOf(segments[i].target) >= 0) {
        for (j = 0; j < segments.length; j++) Array.prototype.push.apply(events, segments[j].events);
        return;
      }
      targets.push(segments[i].target);
    }

    // ダメージより先に入る状態異常（どくのいき・即死）は、当たりの側に入れる（即死→倒れる の順を守る）
    var earlyStatus = !!skill.status && !this._statusAfterDamage(skill);
    var heads = [], falls = [], rest = [], extras = [];
    for (i = 0; i < segments.length; i++) {
      var list = segments[i].events;
      j = 0;
      while (j < list.length && (SIMUL_HEAD[list[j].type] ||
             (earlyStatus && STATUS_RESULT[list[j].type] && list[j].target !== actor))) {
        heads.push(list[j++]);
      }
      for (; j < list.length; j++) {
        var e = list[j];
        if (e.type === "faint" || e.type === "undying") falls.push(e);
        // 技が入れた状態異常（反撃で本人に返ってきたものは除く）と、技の弱体
        else if (STATUS_RESULT[e.type] && e.target !== actor) extras.push(e);
        else if ((e.type === "modifier" || e.type === "modifierMiss") && e.skillId === skill.id) extras.push(e);
        else rest.push(e);
      }
    }

    var groups = [heads, falls, rest, extras];
    for (i = 0; i < groups.length; i++) {
      // 3. そのほか は順番に見せる。ほかは2つ以上あれば同時
      if (i !== 2 && groups[i].length > 1) {
        this._simulSeq = (this._simulSeq || 0) + 1;
        for (j = 0; j < groups[i].length; j++) groups[i][j].simul = this._simulSeq;
      }
      Array.prototype.push.apply(events, groups[i]);
    }
  };

  /**
   * 味方全体にかける技（target: "allAllies"。v1.0.0）。宣言とPPの支払いは1回だけ。
   * 味方にかけるので、命中・回避の判定はしない。書ける働きは次のとおり：
   *   heal / cureStatus … 全員を治す（単体の回復・クレンズと同じ。いまは使っている技が無い）
   *   modifier         … 全員に強化を掛ける（単体の強化と同じ。芽吹きの加護の「全状態異常の耐性 +4」）
   *   wardStatus: true … 全員に「状態異常を1回防ぐ守り」（_statusWard。特性「芽吹き」と同じもの）を付ける。
   *                      すでに守りがある者は付け直すだけ（2回ぶんにはならない）。いまは使っている技が無い
   * 全員ぶんの出来事は同時に見せる（simul）。守りの音は最初の1つだけに付ける（重なって大きくならないように）
   */
  BattleSystem.prototype._performSkillOnAllies = function (actor, targets, skillId, side, events) {
    var skill = this._prepareSkill(actor, skillId, side, events);
    if (!skill) return;

    // PPが足りずに通常攻撃へ切り替わった場合は、向かい側の1体を殴る
    if (skill.target !== "allAllies") {
      var foes = this._candidatesFor(side, skill);
      for (var f = 0; f < foes.length; f++) {
        if (foes[f].isFainted()) continue;
        this._resolveHit(actor, this._coverFor(foes[f], side), skill, side, events);
        return;
      }
      return;
    }

    this._simulSeq = (this._simulSeq || 0) + 1;
    var seq = this._simulSeq, first = true, cured = false, healedAny = false;
    for (var i = 0; i < targets.length; i++) {
      var target = targets[i];
      if (target.isFainted() || target._removed) continue;
      // 回復・状態異常を治す・強化（作戦の「全体を治す技」も同じ道を通る）
      var start = events.length;
      if (skill.heal) {
        // 全体の回復では、満タンの仲間ごとに「元気なままだ」を並べない（誰も減っていなければ最後に1回だけ）
        var healEvents = [];
        this._applyHeal(actor, target, skill, side, healEvents);
        for (var he = 0; he < healEvents.length; he++) {
          if (healEvents[he].type === "healFull") continue;
          events.push(healEvents[he]);
          healedAny = true;
        }
      }
      if (skill.cureStatus) {
        // 全体を治す技では、治すものが無かった仲間ごとに「治すものがなかった」を並べない（最後に1回だけ）
        var cureEvents = [];
        this._applyCure(target, skill, side, cureEvents);
        for (var ce = 0; ce < cureEvents.length; ce++) {
          if (cureEvents[ce].type === "cureNone") continue;
          events.push(cureEvents[ce]);
          cured = true;
        }
      }
      if (skill.modifier) this._applyModifier(actor, target, skill, side, events);
      for (var k = start; k < events.length; k++) events[k].simul = seq;
      if (skill.wardStatus) {
        target._statusWard = { name: skill.name };
        events.push({ type: "wardSkill", side: side, targetSide: side,
          targetName: target.getName(), target: target, skillId: skill.id,
          simul: seq, se: first ? "buff" : null });
        first = false;
      }
    }
    if (skill.cureStatus && !cured) {
      events.push({ type: "cureNone", side: side, targetSide: side, targetName: actor.getName(), target: actor });
    }
    if (skill.heal && !healedAny) {
      events.push({ type: "healFull", side: side, targetSide: side, targetName: actor.getName(), target: actor, everyone: true });
    }
  };

  // 全体の技で「当たり」として同時に見せる出来事
  var SIMUL_HEAD = { critical: true, effective: true, resisted: true, damage: true, miss: true, immune: true };
  var STATUS_RESULT = { status: true, statusMiss: true, statusImmune: true };

  /**
   * 技を出せる形にととのえる（PPの支払いと宣言まで）。
   * 出せなければ null を返す。
   */
  BattleSystem.prototype._prepareSkill = function (actor, skillId, side, events) {
    var skill = this.data.getSkill(skillId);
    if (!skill) {
      events.push({ type: "noSkill", side: side, actorName: actor.getName() });
      return null;
    }

    // PPが足りない技は出せないので、通常攻撃に切り替える
    if (!this._canUseSkill(actor, skillId)) {
      skill = this.data.getSkill(this.getNormalAttackId());
      if (!skill) {
        events.push({ type: "noSkill", side: side, actorName: actor.getName() });
        return null;
      }
    }

    // PPを支払う（通常攻撃は0なので減らない。特性「死神」・敵の infinitePp は ppCostOf が0にする）
    var ppCost = this.ppCostOf(actor, skill);
    if (ppCost && actor.payPp) actor.payPp(ppCost);

    // 「ためる」で力をためていれば、この行動のダメージに倍率を掛ける（二段斬りなら2回とも）。
    // 倍率はこの行動のあいだだけ（takeTurn が行動のあとに外す）。
    // 乗るのは1体の通常攻撃・体技・斬撃だけ（v1.4.1。全体の技には乗らない）。
    // 乗らない技を出したときは、行動のあとに消える（_expireCharge）
    if (actor._charged && this._chargeApplies(skill)) {
      var c = actor._charged;
      actor._chargeMul = c.min + this.random.next() * ((c.max || c.min) - c.min);
      actor._charged = null;
    }

    events.push({
      type: "useSkill", side: side,
      actorName: actor.getName(), skillName: skill.name,
      // 画面側が踏み込みの動きや技の演出を付けられるよう、
      // 行動した本人と使った技も渡す（damage で target を渡しているのと同じ理由）
      actor: actor, skill: skill,
      // 払ったあとのPP。画面はこの出来事を見せた瞬間にPPバーを減らす（HPと同じ見せ方）
      ppAfter: actor.currentPp
    });
    return skill;
  };

  /** 相手1体ぶんの命中判定・効果・ダメージ */
  BattleSystem.prototype._resolveHit = function (actor, target, skill, side, events) {
    var battle = this.data.battle || {};
    var accuracy = (skill.accuracy === undefined)
      ? (battle.defaultAccuracy === undefined ? 1 : battle.defaultAccuracy)
      : skill.accuracy;

    // 盲目などで命中率が下がる。
    // このあとに回避判定がもう一度あることに注意（当たりにくさは2段構え）
    accuracy *= this._accuracyMultiplier(actor, skill);

    if (this.random.next() >= accuracy) {
      events.push({ type: "miss", side: side, targetName: target.getName(), target: target });
      return;
    }

    // 相手がかわす。命中判定を抜けたあとの、受け手側の最後の関門。
    // 自分にかける技と、evadable: false と書いた技はかわせない
    if (this._isEvaded(actor, target, skill)) {
      events.push({ type: "miss", side: side, targetName: target.getName(), target: target });
      return;
    }

    // 力をためる技（ちからため）。次の自分の手番まで残る（v1.4.1）。
    // ためている間にもう一度使っても何も起きない（重ねがけはできない）。その手番で乗る技を出していないので、行動のあとに消える
    if (skill.charge) {
      if (actor._charged) {
        events.push({ type: "chargeFailed", targetSide: side, targetName: actor.getName(), target: actor });
        return;
      }
      actor._charged = skill.charge;
      actor._chargeFresh = true;
      events.push({ type: "charge", targetSide: side, targetName: actor.getName(), target: actor, se: "buff" });
      return;
    }

    // HPを回復する技。威力を持たない技はここで終わり
    if (skill.heal) {
      this._applyHeal(actor, target, skill, side, events);
      if (!skill.power) return;
    }

    // 相手のPPを減らす技（ミステリーダンス。v1.0.0）。威力を持たない技はここで終わり
    if (skill.ppDamage) {
      this._applyPpDamage(target, skill, side, events);
      if (!skill.power) return;
    }

    // 状態異常を治す技（クレンズ）。威力を持たない技はここで終わり
    if (skill.cureStatus) {
      this._applyCure(target, skill, side, events);
      if (!skill.power) return;
    }

    // バフ／デバフをかけるだけの技はここで終わり。
    // 威力も持つ技（ロックスパイク）は、ダメージを見せたあとで掛ける（その一撃には乗らない）
    if (skill.modifier && !skill.power) {
      this._applyModifier(actor, target, skill, side, events);
      return;
    }

    // 状態異常をかける技。
    //   ダメージの無い技（どくのいき）… ここで入るか、入らなければ MISS
    //   ダメージも持つ技（どくばり）… ダメージを見せたあと、追加で入るか MISS（作者の指定。_applyLateStatus）
    //   即死だけは先に判定する（通った相手には、そのあとダメージを与えない）
    var lateStatus = this._statusAfterDamage(skill);
    if (skill.status && !lateStatus) {
      this._applyStatus(actor, target, skill, side, events);
      if (target.isFainted()) return;
      if (!skill.power) return;
    }

    var result = this.calcDamage(actor, target, skill);

    // 無効化されたときはダメージを与えず、その旨だけ知らせる
    if (result.immune) {
      events.push({ type: "immune", side: side, targetName: target.getName(), target: target });
      return;
    }

    if (result.critical) {
      events.push({ type: "critical", side: side, targetName: target.getName(), target: target });
    }
    // 属性の通りやすさ（等倍のときは何も出さない）
    if (result.elementMultiplier > 1) {
      events.push({ type: "effective", side: side, targetName: target.getName(), target: target });
    } else if (result.elementMultiplier < 1) {
      events.push({ type: "resisted", side: side, targetName: target.getName(), target: target });
    }

    target.takeDamage(result.damage);

    events.push({
      type: "damage", side: side,
      targetName: target.getName(), amount: result.damage,
      currentHp: target.currentHp, maxHp: target.getMaxHp(),
      // 画面側がダメージ表示の位置を決められるよう、対象そのものも渡す
      target: target, critical: result.critical
    });

    // 0ダメージ（当たったが、びくともしなかった）。吸血・とげ・目を覚ますは起きない。
    // 画面側は被弾の動きをせず「ダメージを与えられなかった」と出す（BattleScene）。
    // 当たってはいるので、追加の状態異常の判定はする
    if (result.damage <= 0) {
      if (skill.modifier) this._applyModifier(actor, target, skill, side, events);
      if (lateStatus) this._applyStatus(actor, target, skill, side, events);
      return;
    }

    // 与えたダメージの一部を自分のHPに変える（吸血など）。
    // 倒しきった相手からも吸えるので、faint より先に処理する
    this._applyDrain(actor, skill, result.damage, side, events);

    // 反動（捨て身の体当たり。技の recoil）。与えたダメージの一部を自分も受ける。倒れることもある
    this._applyRecoil(actor, skill, result.damage, side, events);

    // 特性「亡者の魂」。倒れるはずのところを、このターンだけ踏みとどまる
    if (target.isFainted()) this._tryUndying(target, opposite(side), events);

    if (target.isFainted()) {
      events.push({ type: "faint", side: side, targetName: target.getName(), target: target });
      // 倒されても、とげや電気は相手に返る
      this._applyCounterStatus(actor, target, skill, side, events);
      return;
    }

    // 特性「放電」「毒のとげ」。攻撃してきた相手を状態異常にすることがある
    this._applyCounterStatus(actor, target, skill, side, events);

    // 殴られて目を覚ます（眠り）。倒れた相手には意味がないので、そのあとに置く
    this._wakeOnDamage(target, events);

    // ダメージのあとの追加の状態異常（どくばりの毒など）。入らなければ MISS。
    // 目を覚ます判定より後に置く（眠らせる技で、入れた眠りがその場で覚めないように）。
    // 倒した相手には入れない（上で return している）。
    // 威力を持つ弱体の技（ロックスパイク）も、同じくここで掛ける
    if (skill.modifier) this._applyModifier(actor, target, skill, side, events);
    if (lateStatus) this._applyStatus(actor, target, skill, side, events);

    // 装備・特性の「当てたら状態異常」（眠花の杖など。v1.0.0）。目を覚ます判定のあとに置く（入れた眠りが覚めないように）
    this._applyOnHitStatus(actor, target, skill, side, events);
  };

  /**
   * 反動。与えたダメージ × recoil を自分が受ける（最低1）。HP が 0 になれば倒れる
   */
  BattleSystem.prototype._applyRecoil = function (actor, skill, damage, side, events) {
    if (!skill.recoil || damage <= 0 || !actor || actor.isFainted()) return;
    var amount = Math.max(1, Math.floor(damage * skill.recoil));
    // 特性「カチカチ」は反動も減る
    if (actor.reduceDirectDamage) amount = actor.reduceDirectDamage(amount);
    actor.takeDamage(amount);
    events.push({ type: "recoil", targetSide: side, targetName: actor.getName(), target: actor,
      amount: amount, currentHp: actor.currentHp, maxHp: actor.getMaxHp() });
    if (actor.isFainted()) {
      events.push({ type: "faint", targetSide: side, targetName: actor.getName(), target: actor });
    }
  };

  /**
   * 攻撃を当てた相手を、確率で状態異常にする（効果の種類 onHitStatus。v1.0.0）。
   *   status / chance … 技の status と同じ。相手の耐性が掛かる
   *   normalAttackOnly … true なら通常攻撃のときだけ
   * 入らなかったときは何も出さない（毎回「効かなかった」が出ると、通常攻撃のたびに文が増えるため）。
   * 入ったときも出どころ（装備・特性）は名乗らず、「攻撃 → ダメージ → 眠ってしまった」とだけ出す（作者の指定）
   */
  BattleSystem.prototype._applyOnHitStatus = function (actor, target, skill, side, events) {
    if (!actor || !target || target.isFainted()) return;
    var normal = (skill.id === this.getNormalAttackId());
    var found = this._findEffects(actor, "onHitStatus", function (effect) {
      return !effect.normalAttackOnly || normal;
    });
    var targetSide = opposite(side);

    for (var i = 0; i < found.length; i++) {
      var spec = found[i].effect;
      var def = this.data.getStatus ? this.data.getStatus(spec.status) : null;
      if (!def || def.instantKill) continue;
      if (target.getStatus && target.getStatus(spec.status)) continue;
      if (target.isImmuneToStatus && target.isImmuneToStatus(spec.status)) continue;

      var chance = (spec.chance === undefined) ? 1 : spec.chance;
      chance *= this._statusResistMultiplier(target, spec.status);
      if (this.random.next() >= chance) continue;

      // 芽吹きの守りがあれば、ここで1回防ぐ
      if (this._consumeWard(target, def, targetSide, events)) continue;

      var applied = target.addStatus(spec.status, this.random);
      if (!applied) continue;
      // 文では名乗らず、札だけ出す
      events.push(this._abilityPopupEvent(actor, side, found[i]));
      events.push({
        type: "status", targetSide: targetSide,
        targetName: target.getName(), target: target,
        statusId: spec.status, statusName: def.name, renewed: applied.renewed
      });
      this._breakDefendByStatus(target, def, targetSide, events);
    }
  };

  /**
   * 状態異常をダメージのあとで判定する技か。
   * ダメージを持つ状態異常の技（どくばり）だけ。即死はダメージより先（通ったら殴らない）
   */
  BattleSystem.prototype._statusAfterDamage = function (skill) {
    if (!skill.status || !skill.power) return false;
    var def = this.data.getStatus ? this.data.getStatus(skill.status.id) : null;
    return !(def && def.instantKill);
  };

  // --- 戦闘中に働く特性（data/abilities.js） ---

  /**
   * その個体に掛かっている、指定した種類の効果を並べて返す。
   * 特性・装備・加護のどこから来たものでも拾う（書き方が共通なので）。
   * 条件（condition）を満たさないものは外す。
   *
   * @param {object} monster
   * @param {string} type 効果の種類（"regen" など）
   * @param {function} [filter] 効果を受け取り、使うなら true
   * @returns {object[]} [{ effect, name, kind }]。name は出どころの名前、
   *   kind は出どころの種類（"ability" 特性／"equipment" 装備／"blessing" 加護／"" 不明）
   */
  BattleSystem.prototype._findEffects = function (monster, type, filter) {
    if (!this.effects || !monster) return [];

    var effects = this.effects.collectEffects(monster);
    var result = [];
    for (var i = 0; i < effects.length; i++) {
      var effect = effects[i];
      if (effect.type !== type) continue;
      if (filter && !filter(effect)) continue;
      if (!this.effects._matchCondition(monster, effect.condition)) continue;
      var source = this._effectSource(monster, effect);
      result.push({ effect: effect, name: source.name, kind: source.kind });
    }
    return result;
  };

  /** _findEffects の最初の1件（無ければ null） */
  BattleSystem.prototype._findEffect = function (monster, type, filter) {
    return this._findEffects(monster, type, filter)[0] || null;
  };

  /**
   * その効果がどこから来たか。{ name, kind }（分からなければ name は空文字、kind も空文字）
   *   kind … "ability" 特性／"equipment" 装備／"blessing" 加護
   * 画面が文やポップアップの色を出し分けるのに使う
   */
  BattleSystem.prototype._effectSource = function (monster, effect) {
    var i;
    var abilities = (this.effects.abilitySystem)
      ? this.effects.abilitySystem.getAbilities(monster) : [];
    for (i = 0; i < abilities.length; i++) {
      if ((abilities[i].effects || []).indexOf(effect) >= 0) return { name: abilities[i].name, kind: "ability" };
    }
    var equipments = this.effects.getEquipments(monster);
    for (i = 0; i < equipments.length; i++) {
      if (((equipments[i].equip || {}).effects || []).indexOf(effect) >= 0) {
        return { name: equipments[i].name, kind: "equipment" };
      }
    }
    // 技で掛かった効果（樹液の膜の毎ターンの回復）。札は強化の色で出す
    var mods = monster.modifiers || [];
    for (i = 0; i < mods.length; i++) {
      if ((mods[i].effects || []).indexOf(effect) >= 0) return { name: mods[i].name, kind: "buff" };
    }
    // 加護（そのラン限り）。個体には効果だけが配られているので、定義から名前を探す
    var blessings = this.data.blessings || {};
    for (var id in blessings) {
      if (!Object.prototype.hasOwnProperty.call(blessings, id)) continue;
      if ((blessings[id].effects || []).indexOf(effect) >= 0) return { name: blessings[id].name, kind: "blessing" };
    }
    return { name: "", kind: "" };
  };

  /**
   * 特性・装備が働いたことを、文は出さずに画面上部の札だけで知らせる出来事（v1.0.0）。
   * 状態異常を付ける特性・装備（放電・毒のとげ・眠花の杖）に使う。BattleScene は待たずに次の出来事へ進む
   * @param {object} found _findEffects の1件（{ name, kind }）
   */
  BattleSystem.prototype._abilityPopupEvent = function (monster, side, found) {
    return { type: "abilityPopup", targetSide: side,
      targetName: monster.getName(), target: monster, abilityName: found.name, sourceKind: found.kind || "" };
  };

  /** 「○○ の 先手!」のような、特性が働いた合図の出来事 */
  BattleSystem.prototype._abilityEvent = function (monster, side, name, kind) {
    return { type: "ability", targetSide: side,
      targetName: monster.getName(), target: monster, abilityName: name, sourceKind: kind || "" };
  };

  /**
   * 特性「放電」「毒のとげ」（counterStatus）。
   * 攻撃を受けた側が持っていれば、攻撃してきた相手を状態異常にすることがある。
   *
   * 通りやすさは技の状態異常と同じく「確率 × 相手の耐性」。
   * すでに同じ状態異常に掛かっている相手には働かない（かけ直しの文が毎回出ないように）。
   * 即死は扱わない（返しで即死させる特性は作らない方針）。
   */
  BattleSystem.prototype._applyCounterStatus = function (attacker, defender, skill, side, events) {
    if (!attacker || attacker === defender || attacker.isFainted()) return;

    var normal = (skill.id === this.getNormalAttackId());
    var found = this._findEffects(defender, "counterStatus", function (effect) {
      return effect.trigger !== "normalAttack" || normal;
    });

    for (var i = 0; i < found.length; i++) {
      var spec = found[i].effect;
      var def = this.data.getStatus ? this.data.getStatus(spec.status) : null;
      if (!def || def.instantKill) continue;
      if (attacker.getStatus && attacker.getStatus(spec.status)) continue;
      if (attacker.isImmuneToStatus && attacker.isImmuneToStatus(spec.status)) continue;

      var chance = (spec.chance === undefined) ? 1 : spec.chance;
      chance *= this._statusResistMultiplier(attacker, spec.status);
      if (this.random.next() >= chance) continue;

      // 芽吹きの守りがあれば、返しの状態異常も1回防ぐ
      if (attacker._statusWard) {
        this._consumeWard(attacker, def, side, events);
        continue;
      }

      var applied = attacker.addStatus(spec.status, this.random);
      if (!applied) continue;

      // 特性の名乗り（「〇〇 の 毒のとげ!」）は出さない。攻撃 → ダメージ → 毒を受けた、だけにする（v1.0.0・作者の指定）。
      // 画面上部の札だけは出す（abilityPopup。文は無く、待たずに次の文と一緒に出る）
      events.push(this._abilityPopupEvent(defender, opposite(side), found[i]));
      events.push({
        type: "status", targetSide: side,
        targetName: attacker.getName(), target: attacker,
        statusId: spec.status, statusName: def.name, renewed: applied.renewed
      });
      this._breakDefendByStatus(attacker, def, side, events);
    }

    this._applyCounterModifier(attacker, defender, skill, side, events);
  };

  /**
   * 特性「ねばねば」（counterModifier。2026-11-11 作者の指定。ジュエキスライム）。
   * 攻撃を受けた側が持っていれば、攻撃してきた相手に弱体を掛けることがある。
   *   kinds … 働く技の種類（"body" 体技・"slash" 斬撃）。通常攻撃ではいつでも働く
   *   chance … 確率。相手の弱体への耐性が掛かる（技の弱体と同じ。入らなくても MISS は出さない）
   *   modifier … 掛ける弱体（技の modifier と同じ書き方）
   * すでに同じ弱体が掛かっている相手には働かない（掛け直しの文が毎回出ないように）。
   * 弱体の名前は特性の名前（印と「効果が切れた」の文に出る）
   */
  BattleSystem.prototype._applyCounterModifier = function (attacker, defender, skill, side, events) {
    if (!attacker || attacker === defender || attacker.isFainted() || !attacker.addModifier) return;

    var normal = (skill.id === this.getNormalAttackId());
    var found = this._findEffects(defender, "counterModifier", function (effect) {
      return normal || !effect.kinds || effect.kinds.indexOf(skill.kind) >= 0;
    });

    for (var i = 0; i < found.length; i++) {
      var spec = found[i].effect;
      if (!spec.modifier) continue;
      var fake = { id: "counter_" + (found[i].name || "ability"), name: found[i].name,
                   target: "enemy", modifier: spec.modifier };
      if (attacker.getModifier && attacker.getModifier(fake.id)) continue;

      var chance = (spec.chance === undefined) ? 1 : spec.chance;
      chance *= this._debuffResistMultiplier(attacker);
      if (this.random.next() >= chance) continue;

      var applied = attacker.addModifier(fake);
      if (!applied) continue;

      events.push(this._abilityPopupEvent(defender, opposite(side), found[i]));
      events.push({
        type: "modifier", side: opposite(side), targetSide: side,
        targetName: attacker.getName(), target: attacker,
        skillId: fake.id, skillName: fake.name,
        effects: spec.modifier.effects || [],
        message: spec.modifier.message || null,
        popup: spec.modifier.popup || null,
        renewed: applied.renewed,
        raised: isRaising(spec.modifier)
      });
    }
  };

  /**
   * 特性「亡者の魂」（undying）。倒れるはずの個体を、このターンだけHP0で残す。
   *
   *   ・同じ側で1ターンに1体まで（_undyingSides）
   *   ・1体につき1戦闘に1回まで（_undyingUsed）
   *   ・攻撃で倒れたときだけ。毒・即死では働かない（ここを呼ぶのは _resolveHit だけ）
   * 踏みとどまっているあいだは MonsterInstance.isFainted が false を返すので、
   * まだ動いていなければ手番が回ってくる。回復は受け付けない（MonsterInstance.heal）。
   * ターンの終わりに _expireUndying で倒れる。
   *
   * @returns {boolean} 踏みとどまったか
   */
  BattleSystem.prototype._tryUndying = function (target, targetSide, events) {
    if (target._undyingUsed || this._undyingSides[targetSide]) return false;

    var found = this._findEffect(target, "undying");
    if (!found) return false;

    target._undying = true;
    target._undyingUsed = true;
    this._undyingSides[targetSide] = true;

    events.push({ type: "undying", targetSide: targetSide,
      targetName: target.getName(), target: target, abilityName: found.name, sourceKind: found.kind });
    return true;
  };

  /** 踏みとどまっていた者を、ターンの終わりに倒す */
  BattleSystem.prototype._expireUndying = function (events) {
    var groups = [{ list: this.slots, side: "ally" }, { list: this.enemies, side: "enemy" }];

    for (var g = 0; g < groups.length; g++) {
      var list = groups[g].list || [];
      for (var i = 0; i < list.length; i++) {
        var monster = list[i];
        if (!monster._undying) continue;

        monster._undying = false;
        monster.currentHp = 0;
        events.push({ type: "undyingEnd", targetSide: groups[g].side,
          targetName: monster.getName(), target: monster });
        events.push({ type: "faint", targetSide: groups[g].side,
          targetName: monster.getName(), target: monster });
      }
    }
  };

  /** 戦闘が終わるときに、踏みとどまりの印を外す（持ち越さない） */
  BattleSystem.prototype._clearUndying = function () {
    var everyone = (this.allies || []).concat(this.enemies || []);
    for (var i = 0; i < everyone.length; i++) everyone[i]._undying = false;
    this._clearCovers();
  };

  // --- 立ち塞がる（data/skills.js の cover） ---

  /**
   * cover を持つ技（スライムの「立ち塞がる」）を、ターンの頭で先に済ませる。
   *
   * 防御と同じく、素早さに関係なく最初に効く。そうしないと、先に動いた敵の攻撃を受け止められない。
   * 技そのもの（PPの支払い・自分への modifier＝受けるダメージの軽減）はここで出し、
   * 本人には _covering の印を付ける。その印があるあいだ、向かい側からの攻撃は本人へ向く（_coverFor）。
   * 麻痺・眠りで動けないとき、封印で技が出せないときは立ち塞がれない。PPが足りなければ、ふだんの手番で通常攻撃になる
   */
  BattleSystem.prototype._applyCovers = function (order, events) {
    for (var i = 0; i < order.length; i++) {
      var step = order[i];
      var action = step.action;
      if (!action || action.type !== "skill") continue;
      var skill = this.data.getSkill(action.skillId);
      if (!skill || !skill.cover) continue;
      if (step.actor.isFainted() || step.actor._removed) continue;
      if (!this._canUseSkill(step.actor, action.skillId)) continue;

      step._done = true;
      if (this._blockedByStatus(step, events)) continue;
      if (this._sealedFrom(step, action, events)) continue;

      this._performSkill(step.actor, step.actor, action.skillId, step.side, events);
      step.actor._covering = true;
    }
  };

  /**
   * 攻撃の的を、立ち塞がっている仲間へ差し替える。
   * 向かい側（守る側）に _covering の者がいて、まだ立っていれば、その者が受ける。
   * 範囲全体の技も1体ずつこれを通すので、「全員ぶん」を1体で受けることになる。
   * 立ち塞がっていた者が倒れたら、残りはふつうに当たる
   * @param {object} target 本来の的
   * @param {string} attackerSide 攻撃する側
   */
  BattleSystem.prototype._coverFor = function (target, attackerSide) {
    if (!target) return target;
    var group = (attackerSide === "ally") ? this.getFieldEnemies() : this.getFieldAllies();
    for (var i = 0; i < group.length; i++) {
      var m = group[i];
      if (m._covering && m !== target && !m.isFainted() && !m._removed) return m;
    }
    return target;
  };

  BattleSystem.prototype._clearCovers = function () {
    var everyone = (this.allies || []).concat(this.enemies || []);
    for (var i = 0; i < everyone.length; i++) everyone[i]._covering = false;
  };

  /**
   * 特性「再生」（regen）。ターンの終わりに、最大HPの割合だけ戻す。
   * 満タンのときは何も出さない。
   */
  BattleSystem.prototype._tickRegen = function (events) {
    var groups = [{ list: this.getFieldAllies(), side: "ally" },
                  { list: this.getFieldEnemies(), side: "enemy" }];

    for (var g = 0; g < groups.length; g++) {
      for (var i = 0; i < groups[g].list.length; i++) {
        var monster = groups[g].list[i];
        if (!monster.heal || monster.isFainted()) continue;

        // 特性・装備・加護の再生（いちばん先に見つかった1つだけ）と、
        // 技で掛かった「毎ターン戻す」効果（regenOverTime。樹液の膜）は別々に戻す（重なる）
        var sources = [];
        var found = this._findEffect(monster, "regen");
        if (found) {
          var amount = Math.max(1, Math.floor(monster.getMaxHp() * (found.effect.value || 0)));
          // max を書いた効果は、1ターンに戻る量に上限がある（特性「再生」は50。v1.0.0）
          if (found.effect.max) amount = Math.min(amount, found.effect.max);
          sources.push({ amount: amount, name: found.name, kind: found.kind });
        }
        var overTime = this._findEffects(monster, "regenOverTime");
        for (var o = 0; o < overTime.length; o++) {
          var spec = overTime[o].effect;
          // min〜max の割合を毎ターン抽選する（樹液の膜は 10〜15%）
          var ratio = (spec.max > spec.min) ? spec.min + (spec.max - spec.min) * this.random.next() : (spec.min || 0);
          sources.push({ amount: Math.max(1, Math.floor(monster.getMaxHp() * ratio)),
                         name: overTime[o].name, kind: overTime[o].kind });
        }

        for (var s = 0; s < sources.length; s++) {
          var before = monster.currentHp;
          monster.heal(sources[s].amount);
          var healed = monster.currentHp - before;
          if (healed <= 0) continue;

          // 形は回復の出来事とそろえてある（画面側は healAmount を見て回復の演出を出す）
          events.push({
            type: "regen", targetSide: groups[g].side,
            targetName: monster.getName(), abilityName: sources[s].name, sourceKind: sources[s].kind,
            target: monster,
            healAmount: healed, revealTarget: monster, revealHp: monster.currentHp
          });
        }
      }
    }
  };

  /**
   * 毎ターンPPが戻る（効果の種類 ppRegen。2026-11-10 樹液の護符・雫の指輪）。
   * ターンの終わりに value だけ戻す（割合ではなく数）。いくつ着けていても足し合わせる。
   * 満タン・倒れている者には何も出さない。出来事は ppTarget / ppValue を持つので、画面はPPバーをその瞬間に伸ばす
   */
  BattleSystem.prototype._tickPpRegen = function (events) {
    var groups = [{ list: this.getFieldAllies(), side: "ally" },
                  { list: this.getFieldEnemies(), side: "enemy" }];

    for (var g = 0; g < groups.length; g++) {
      for (var i = 0; i < groups[g].list.length; i++) {
        var monster = groups[g].list[i];
        if (monster.currentPp === undefined || !monster.getMaxPp || monster.isFainted()) continue;

        var found = this._findEffects(monster, "ppRegen");
        if (found.length === 0) continue;
        var amount = 0;
        for (var f = 0; f < found.length; f++) amount += found[f].effect.value || 0;

        var before = monster.currentPp;
        monster.currentPp = Math.min(monster.getMaxPp(), before + amount);
        var restored = monster.currentPp - before;
        if (restored <= 0) continue;

        events.push({
          type: "ppRegen", targetSide: groups[g].side,
          targetName: monster.getName(), abilityName: found[0].name, sourceKind: found[0].kind,
          target: monster, amount: restored,
          ppTarget: monster, ppValue: monster.currentPp
        });
      }
    }
  };

  // --- v1.0.0 で足した特性（脱皮・追い風・芽吹き。data/abilities.js） ---

  /**
   * 1ターン目の頭に働く特性。
   *   追い風（tailwind） … 名乗るだけ。素早さは _rollSpeed が turns ターン目まで倍にする
   *   芽吹き（wardAlly） … 場に出ている自分以外の仲間1体（ランダム）に、状態異常を1回防ぐ守り（_statusWard）をつける。
   *                         仲間がいなければ働かない（名乗りも出さない）
   * 戦闘を始めたときに場にいた者だけが対象（あとから交代で出た者には働かない）
   */
  BattleSystem.prototype._applyBattleStartAbilities = function (events) {
    var groups = [{ list: this.getFieldAllies(), side: "ally" },
                  { list: this.getFieldEnemies(), side: "enemy" }];

    for (var g = 0; g < groups.length; g++) {
      var list = groups[g].list;
      for (var i = 0; i < list.length; i++) {
        var monster = list[i];
        if (monster.isFainted()) continue;

        var wind = this._findEffect(monster, "tailwind");
        if (wind) {
          events.push({ type: "tailwind", targetSide: groups[g].side,
            targetName: monster.getName(), target: monster, abilityName: wind.name, sourceKind: wind.kind });
        }

        var ward = this._findEffect(monster, "wardAlly");
        if (!ward) continue;
        var others = [];
        for (var j = 0; j < list.length; j++) {
          if (list[j] !== monster && !list[j].isFainted() && !list[j]._statusWard) others.push(list[j]);
        }
        if (others.length === 0) continue;

        var picked = this.random.pick(others);
        picked._statusWard = { name: ward.name };
        events.push({ type: "wardGiven", targetSide: groups[g].side,
          targetName: monster.getName(), target: monster, abilityName: ward.name, sourceKind: ward.kind,
          allyName: picked.getName(), ally: picked });
      }
    }
  };

  /**
   * 芽吹きの守りで状態異常を防ぐ。守りがあれば消して「防いだ」を出す。
   * @returns {boolean} 防いだか
   */
  BattleSystem.prototype._consumeWard = function (target, def, targetSide, events) {
    if (!target || !target._statusWard) return false;
    target._statusWard = null;
    events.push({ type: "wardBlocked", targetSide: targetSide,
      targetName: target.getName(), target: target, statusId: def.id, statusName: def.name });
    return true;
  };

  /**
   * 特性「脱皮」（shedStatus）。ターンの終わりに状態異常に掛かっていれば、確率で全部治す。
   * 道具で治せない封印も治す（皮ごと脱ぎ捨てる）。出来事の形はクレンズ（_applyCure）とそろえてある
   */
  BattleSystem.prototype._tickShedStatus = function (events) {
    var groups = [{ list: this.getFieldAllies(), side: "ally" },
                  { list: this.getFieldEnemies(), side: "enemy" }];

    for (var g = 0; g < groups.length; g++) {
      for (var i = 0; i < groups[g].list.length; i++) {
        var monster = groups[g].list[i];
        if (monster.isFainted() || monster._undying || !monster.getStatusDefs) continue;

        var defs = monster.getStatusDefs();
        if (defs.length === 0) continue;
        var found = this._findEffect(monster, "shedStatus");
        if (!found) continue;

        var chance = (found.effect.chance === undefined) ? 1 : found.effect.chance;
        if (this.random.next() >= chance) continue;

        var cured = BattleSystem.cureStatuses(monster,
          { statuses: defs.map(function (def) { return def.id; }) });
        if (cured.length === 0) continue;

        var side = groups[g].side;
        events.push(this._abilityEvent(monster, side, found.name, found.kind));
        events.push({
          type: "cure", side: side, targetSide: side,
          targetName: monster.getName(), target: monster,
          statusNames: cured.map(function (def) { return def.name; }),
          statusTarget: monster,
          statusIds: monster.getStatusDefs().map(function (def) { return def.id; }),
          se: "heal"
        });
      }
    }
  };

  /** 特性「追い風」が効く最後のターンの終わりに「やんだ」と知らせる */
  BattleSystem.prototype._tickTailwindEnd = function (events) {
    var turn = this.turnCount;
    var groups = [{ list: this.getFieldAllies(), side: "ally" },
                  { list: this.getFieldEnemies(), side: "enemy" }];

    for (var g = 0; g < groups.length; g++) {
      for (var i = 0; i < groups[g].list.length; i++) {
        var monster = groups[g].list[i];
        if (monster.isFainted()) continue;
        var found = this._findEffect(monster, "tailwind", function (effect) {
          return (effect.turns || 1) === turn;
        });
        if (!found) continue;
        events.push({ type: "tailwindEnd", targetSide: groups[g].side,
          targetName: monster.getName(), target: monster, abilityName: found.name });
      }
    }
  };

  /**
   * 与えたダメージの一部を、行動した本人のHPに戻す。
   * 割合は data/skills.js の drain（0〜1）。書いていない技では何も起きない。
   *
   * イベントの形は「道具で回復したとき」と同じ（healAmount / revealTarget / revealHp）に
   * そろえてあるので、画面側の再生処理は変更しなくてよい。
   */
  BattleSystem.prototype._applyDrain = function (actor, skill, damage, side, events) {
    if (damage <= 0) return;
    if (!actor || !actor.heal || actor.isFainted()) return;

    // 技の drain が無ければ、特性（吸精）の drain を見る。両方あっても技のほうだけ
    var rate = skill.drain || 0;
    var abilityName = null;
    var abilityKind = "";
    if (!rate) {
      var normal = (skill.id === this.getNormalAttackId());
      var found = this._findEffect(actor, "drain", function (effect) {
        return !effect.normalAttackOnly || normal;
      });
      if (found) {
        rate = found.effect.value || 0;
        abilityName = found.name;
        abilityKind = found.kind;
      }
    }
    if (!rate) return;

    // 1未満に切り捨てられて「吸ったのに0」にならないよう、最低1は戻す
    var amount = Math.max(1, Math.floor(damage * rate));
    var before = actor.currentHp;
    actor.heal(amount);

    var healed = actor.currentHp - before;
    if (healed <= 0) return;   // 満タンなら何も起きない（文も出さない）

    events.push({
      type: "drain", side: side,
      // 吸うのは行動した本人。書かないと「敵の」が付いてしまう
      targetSide: side,
      targetName: actor.getName(),
      // 特性で吸ったときは名前を出す（技の吸血は技名が既に出ている）
      abilityName: abilityName,
      sourceKind: abilityKind,
      target: actor,
      healAmount: healed,
      revealTarget: actor,
      revealHp: actor.currentHp
    });
  };

  /**
   * ダメージを計算する。式・数値は data/battle.js。
   *
   *   技      基礎 = 攻撃力×skill.attackFactor + 技威力×skill.powerFactor - 防御力×defenseFactor
   *   通常攻撃 基礎 = 攻撃力×normal.attackFactor + normal.power           - 防御力×defenseFactor
   *   斬撃     基礎 = max(0, 通常攻撃の基礎) × 技の power（倍率。噛みつく＝1.15。2026-10-22）
   *   ダメージ = floor( max(0, 基礎) × 属性倍率 × クリティカル倍率 × 防御 × 特性装備 × 乱数 )
   *   クリティカルのときは 基礎 から防御力を引かず、倍率は data/battle.js の critical
   *   （共鳴だけ byKind で以前のまま：防御は引く・2.0）
   *
   * 「通常攻撃」は normalAttackSkill の技だけ。体当たりなどの無属性技は技の式。
   *
   * @returns {{damage:number, critical:boolean, elementMultiplier:number, immune:boolean}}
   */
  BattleSystem.prototype.calcDamage = function (attacker, defender, skill, estimate) {
    var battle = this.data.battle || {};
    var config = battle.damage || {};

    var elementId = this._damageElementOf(attacker, defender, skill);
    if (this._isImmune(defender, elementId)) {
      return { damage: 0, critical: false, elementMultiplier: 0, immune: true };
    }

    var isNormal = (skill.id === this.getNormalAttackId());
    // 技は種類ごとの係数（data/battle.js の damage.byKind）。無ければ共通の skill。
    // 技に damageKind があれば、計算だけその種類の式を使う（死神の鎌：踊りだが斬撃の式。v1.0.0）
    var calcKind = skill.damageKind || skill.kind;
    // 斬撃は「通常攻撃の基礎 × 倍率」（2026-10-22 作者の指定）。斬撃の技の power は倍率（噛みつく＝1.15）。
    // 死神の鎌（踊りで damageKind が斬撃）は今までどおり、下の種類ごとの係数で計算する
    // 1体の体技も同じ形（v1.4.1・2026-11-12 作者の指定。クリティカルは categories.js の体技の決まりで出ない）。
    // 全体の体技は威力そのものが基礎（固定ダメージ。攻撃力・防御力は効かない。BattleSystem.bodyModeOf）
    var bodyMode = isNormal ? null : BattleSystem.bodyModeOf(skill);
    var slashRate = (!isNormal && ((skill.kind === "slash" && !skill.damageKind) || bodyMode === "rate"))
      ? numberOr(skill.power, 1) : null;
    var fixedBase = (bodyMode === "fixed") ? Math.max(0, numberOr(skill.power, 0)) : null;
    var useNormal = isNormal || slashRate !== null;
    var factors = useNormal
      ? config.normal
      : (((config.byKind || {})[calcKind]) || config.skill);
    factors = factors || {};
    var attackFactor = numberOr(factors.attackFactor, 1);
    var powerFactor = numberOr(factors.powerFactor, 1);
    // 防御の引き方も種類ごとに変えられる（共鳴・ブレスは半分など）。無ければ共通の値
    var defenseFactor = numberOr(factors.defenseFactor, numberOr(config.defenseFactor, 0));
    var randomMin = numberOr(config.randomMin, 1);
    var randomMax = numberOr(config.randomMax, 1);
    var minDamage = numberOr(config.minDamage, 1);

    // 通常攻撃は技の威力ではなく、data/battle.js の normal.power（小さな上乗せ）を使う。
    // 最序盤に攻撃力だけだと2〜3しか出ず、威力を持つ技との差が開きすぎるため
    var power = useNormal ? numberOr(factors.power, 0) : (skill.power || 0);

    // クリティカルは先に決める（防御を引くかどうかが変わるため）
    var critConfig = battle.critical || {};
    // 技の種類ごとの上書き（共鳴は以前のまま）。通常攻撃は種類を持たない
    var critKind = (!isNormal && (critConfig.byKind || {})[calcKind]) || {};
    // 見積もり（作戦のAIが技を比べるとき）は乱数を使わない：クリティカルなし・ぶれは真ん中
    var critical = estimate ? false : this._rollCritical(skill, attacker);
    // クリティカルのときは防御力を引かない（RC-1。属性の耐性は下の elementMultiplier でそのまま効く）
    var ignoreDefense = critical &&
      ((critKind.ignoreDefense !== undefined) ? critKind.ignoreDefense : critConfig.ignoreDefense) === true;

    // 防御で0を下回っても、そこから先はマイナスにしない
    var base = attacker.getAttack() * attackFactor
             + power * powerFactor
             - (ignoreDefense ? 0 : defender.getDefense() * defenseFactor);
    base = Math.max(0, base);
    if (slashRate !== null) base *= slashRate;
    // 全体の体技：威力がそのまま基礎（属性・乱数・防御コマンド・特性と装備はこのあと掛かる）
    if (fixedBase !== null) base = fixedBase;

    var elementMultiplier = this._elementMultiplier(defender, elementId);
    // 倍率は技の種類ごと（共鳴だけ 2.0）。無ければ共通の multiplier
    var criticalMultiplier = critical
      ? numberOr(critKind.multiplier, numberOr(critConfig.multiplier, 1))
      : 1;

    // 防御中はどんなダメージも軽くなる（属性もクリティカルも問わない）
    var defendMultiplier = defender._defending
      ? numberOr((battle.defend || {}).multiplier, 1)
      : 1;

    // 特性・装備（攻める側の上乗せ・受ける側の軽減）
    var abilityMultiplier = 1;
    if (this.effects) {
      abilityMultiplier = this.effects.getDamageDealtMultiplier(attacker, elementId, skill)
                        * this.effects.getDamageTakenMultiplier(defender, elementId)
                        * this._targetHpMultiplier(attacker, defender);
      // 特性「ギャンブル」：受けるダメージが当たるたびに上下する（見積もりでは真ん中）
      if (this.effects.getDamageTakenRandomMultiplier) {
        abilityMultiplier *= this.effects.getDamageTakenRandomMultiplier(defender, estimate ? null : this.random);
      }
    }

    var variance = estimate ? (randomMin + randomMax) / 2
                            : randomMin + this.random.next() * (randomMax - randomMin);
    // 「ためる」の倍率（この行動のあいだだけ。見積もりでは、ためていれば真ん中の値）
    if (estimate) {
      if (attacker._charged && this._chargeApplies(skill)) abilityMultiplier *= (attacker._charged.min + (attacker._charged.max || attacker._charged.min)) / 2;
    } else if (attacker._chargeMul) {
      abilityMultiplier *= attacker._chargeMul;
    }
    var damage = Math.floor(
      base * elementMultiplier * criticalMultiplier * defendMultiplier
           * abilityMultiplier * variance);
    // 1回あたりのダメージの上限（技の maxDamage。二連斬り＝200。何回か当てる技は1回ずつに掛かる）
    if (skill.maxDamage > 0) damage = Math.min(damage, skill.maxDamage);
    if (estimate) return { damage: Math.max(0, damage), critical: false, elementMultiplier: elementMultiplier, immune: false };

    // 0になったら、ときどきだけ minDamage（1）通す（data/battle.js の zeroDamageChipChance）。
    // 以前は必ず1通していたので、硬い相手にも通常攻撃を重ねれば必ず削れた
    if (damage < minDamage) {
      var chipChance = numberOr(config.zeroDamageChipChance, 1);
      damage = (this.random.next() < chipChance) ? minDamage : 0;
    }

    return {
      damage: damage,
      critical: critical,
      elementMultiplier: elementMultiplier,
      immune: false
    };
  };

  /**
   * ダメージの計算に使う属性。ふつうは技の属性（element）。
   * 2つの属性を持つ技（element2。烈火崩地斬の火・地）は、相手ひとりずつについて、
   * 耐性・無効・特性・装備まで見て、よく効くほうの属性で当たる。同じなら element のほう
   */
  BattleSystem.prototype._damageElementOf = function (attacker, defender, skill) {
    var first = skill.element || "none";
    if (!skill.element2) return first;
    var self = this;
    function strength(id) {
      if (self._isImmune(defender, id)) return 0;
      var value = self._elementMultiplier(defender, id);
      if (self.effects) {
        value *= self.effects.getDamageDealtMultiplier(attacker, id, skill)
               * self.effects.getDamageTakenMultiplier(defender, id);
      }
      return value;
    }
    return (strength(skill.element2) > strength(first)) ? skill.element2 : first;
  };

  /**
   * 相手がかわしたか。
   *
   * 命中率（技の側の当たりやすさ）とは別に、受け手が持つ「よけやすさ」。
   * ほとんどのモンスターは0なので、素早い相手だけがときどきかわす。
   *
   * 自分や味方にかける技はかわしようがなく、
   * data/skills.js に evadable: false と書いた技もかわせない。
   * 種類で決まっている技（ブレス）も同じ（data/categories.js の skillKind の rules）。
   */
  BattleSystem.prototype._isEvaded = function (actor, target, skill) {
    if (target === actor) return false;
    // 味方にかける技（回復など）を、素早い仲間がよけてしまわないように
    if (skill.target === "ally") return false;
    if (this.data.getSkillRule(skill, "evadable") === false) return false;
    if (!target.getEvasion) return false;

    var evasion = target.getEvasion();
    if (evasion <= 0) return false;

    return this.random.next() < evasion;
  };

  /**
   * 特性「万全狩り」など（効果の種類 damageByTargetHp。v1.0.0）。
   * 相手の残りHPの割合で、与えるダメージに倍率を掛ける。tiers は上から順に見て、最初に当てはまったものを使う。
   *   { atLeast: 0.75, value: 1.10 } … 残りHPが75%以上なら ×1.10
   *   { atMost: 0.5, value: 0.9 }    … 残りHPが50%以下なら ×0.9
   * どれにも当てはまらなければ等倍
   */
  BattleSystem.prototype._targetHpMultiplier = function (attacker, defender) {
    if (!defender || !defender.getMaxHp) return 1;
    var ratio = defender.currentHp / Math.max(1, defender.getMaxHp());
    var found = this._findEffects(attacker, "damageByTargetHp");
    var total = 1;
    for (var i = 0; i < found.length; i++) {
      var tiers = found[i].effect.tiers || [];
      for (var j = 0; j < tiers.length; j++) {
        var tier = tiers[j];
        var hit = (tier.atLeast !== undefined) ? ratio >= tier.atLeast
                : (tier.atMost !== undefined) ? ratio <= tier.atMost : false;
        if (hit) { total *= numberOr(tier.value, 1); break; }
      }
    }
    return total;
  };

  /**
   * クリティカルが出たか。確率は 共通値 + 技の criticalBonus + 種族の criticalBonus。
   * 種族の criticalBonus は data/monsters.js に書く（ザンガルド 0.04 で 3% → 7%。作者の指定 2026-10-28）。
   * 仲間でも敵でも同じように効く
   */
  BattleSystem.prototype._rollCritical = function (skill, attacker) {
    // 行動手順の「必ずクリティカル」（主の forceCritical。v1.0.0）
    if (this._forceCritical) return true;
    // クリティカルを出さない技（範囲全体の技・ブレスなど）
    if (this.data.getSkillRule(skill, "canCritical") === false) return false;

    var config = (this.data.battle || {}).critical || {};
    var species = attacker && attacker._species;
    var rate = numberOr(config.baseRate, 0) + numberOr(skill.criticalBonus, 0) +
               numberOr(species && species.criticalBonus, 0);
    return this.random.next() < rate;
  };

  /**
   * 属性倍率を返す。
   *   耐性が0以上   … 倍率 = 1 - 耐性 × resistStep
   *   耐性がマイナス … 倍率 = 1 + |耐性| × weaknessStep
   * 弱点側のほうが1あたりの動きを大きくしてあるので、
   * 「苦手な相手にはよく通る」がはっきり出る。
   *
   * 無属性（physical）は耐性の影響を受けないので常に 1。
   */
  BattleSystem.prototype._elementMultiplier = function (defender, elementId) {
    if (this._isNonElemental(elementId)) return 1;
    if (!defender.getResistance) return 1;

    var config = (this.data.battle || {}).resistance || {};
    var minMultiplier = numberOr(config.minMultiplier, 0);
    var resistance = defender.getResistance(elementId) || 0;

    if (resistance < 0) {
      return 1 + (-resistance) * numberOr(config.weaknessStep, 0);
    }
    return Math.max(minMultiplier, 1 - resistance * numberOr(config.resistStep, 0));
  };

  /**
   * その属性が完全に効かないか。
   * immunities に書かれている場合と、耐性が immuneAt 以上の場合の両方。
   * （耐性を上げきることが「無効」に行き着くようにしてある）
   */
  BattleSystem.prototype._isImmune = function (defender, elementId) {
    if (this._isNonElemental(elementId)) return false;
    if (defender.isImmuneTo && defender.isImmuneTo(elementId)) return true;

    var immuneAt = (this.data.battle || {}).resistance || {};
    if (immuneAt.immuneAt === undefined || !defender.getResistance) return false;

    return (defender.getResistance(elementId) || 0) >= immuneAt.immuneAt;
  };

  /** 耐性計算の対象外（無属性）か */
  BattleSystem.prototype._isNonElemental = function (elementId) {
    var element = (this.data.elements || {})[elementId];
    return !element || !!element.physical;
  };

  /** 逃走を試みる。成功したら戦闘終了して true */
  BattleSystem.prototype._tryFlee = function (events) {
    var rate = (this.data.battle || {}).fleeSuccessRate || 0;
    if (this.random.next() < rate) {
      events.push({ type: "fleeSuccess" });
      // ほかの終わり方（勝ち・負け・スカウト）と同じ後片づけをする（v1.3.1 で直した）。
      // 前はここで外していなかったので、逃げたあとも強化・弱体と麻痺・眠りなどが残り、次の戦闘へ持ち越していた
      var end = this.finishWith("flee");
      for (var i = 0; i < end.length; i++) events.push(end[i]);
      return true;
    }
    events.push({ type: "fleeFailed" });
    return false;
  };

  /**
   * 敵が逃げるかを判定する（v1.3.0）。逃げたら盤面から取り除く。倒したわけではないので経験値は入らない。
   * 誰も残らなければ戦いは流れる（結果 "enemyFled"）。倒れた相手だけが残るときは _checkFinish が勝ちにする。
   * @returns {boolean} 逃げたら true
   */
  BattleSystem.prototype._tryEnemyFlee = function (enemy, events) {
    if (!enemy.fleeRate || this.random.next() >= enemy.fleeRate) return false;

    events.push({ type: "enemyFled", actorName: enemy.getName(), target: enemy });
    this.removeEnemy(enemy);
    if (this.enemies.length === 0) {
      var end = this.finishWith("enemyFled");
      for (var i = 0; i < end.length; i++) events.push(end[i]);
    }
    return true;
  };

  /** 勝敗が決したかを判定し、決していれば終了処理を行う */
  BattleSystem.prototype._checkFinish = function (events) {
    if (this.finished) return true;
    if (firstAlive(this.enemies) && firstAlive(this.allies)) return false;

    this._finish(events);
    return true;
  };

  /** 戦闘終了処理（勝利時は経験値を付与） */
  BattleSystem.prototype._finish = function (events) {
    if (this.finished) return;
    this.finished = true;

    // 掛かっている強化・弱体は持ち帰らせない。
    // 経験値より先に外すのは、レベルアップの結果（能力値の前後）に強化の分を混ぜないため
    this.clearAllModifiers();

    if (!firstAlive(this.enemies)) {
      this.result = "win";
      this._clearUndying();
      // 勝ったときは「戦いに勝った!」（勝利の曲）を先に出し、経験値・レベルアップはそのあと（作者の指定）。
      // 画面側は勝利の曲を流してから少し間を置く（BattleScene の battleEnd）
      events.push({ type: "battleEnd", result: this.result });
      this._awardExp(events);
      this._awardAffection(events);
      return;
    }
    this.result = "lose";
    this._clearUndying();
    events.push({ type: "battleEnd", result: this.result });
  };

  /**
   * 戦闘を外部要因で終了させる（スカウト成功など）。
   * BattleSystem は終了理由の中身を知らず、結果の文字列を保持するだけにしている。
   */
  /**
   * 敵を盤面から取り除く（スカウトで仲間になった場合など）。
   * 倒したわけではないので、経験値の対象にもならない。
   */
  BattleSystem.prototype.removeEnemy = function (enemy) {
    var index = this.enemies.indexOf(enemy);
    if (index < 0) return false;

    enemy._removed = true;
    this.enemies.splice(index, 1);
    return true;
  };

  BattleSystem.prototype.finishWith = function (result) {
    var events = [];
    if (this.finished) return events;
    this.finished = true;
    this.result = result;
    // 掛かっている強化・弱体は持ち帰らせない
    this.clearAllModifiers();
    this._clearUndying();
    events.push({ type: "battleEnd", result: result });
    return events;
  };

  /** 倒した敵の経験値を、生存している味方全員へ付与する */
  BattleSystem.prototype._awardExp = function (events) {
    var total = 0;
    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];

      // レベルに応じた量は個体が計算する。
      // 持たない相手（テスト用の簡易オブジェクトなど）は種族の基準値をそのまま使う
      if (typeof enemy.getExpReward === "function") {
        total += enemy.getExpReward();
      } else {
        var species = enemy.getSpecies ? enemy.getSpecies() : null;
        if (species && species.expReward) total += species.expReward;
      }
    }
    if (total <= 0) return;

    events.push({ type: "expGained", amount: total });

    for (var j = 0; j < this.allies.length; j++) {
      var ally = this.allies[j];
      if (ally.isFainted() || !ally.gainExp) continue;

      var before = ally.level;
      var statsBefore = statSnapshot(ally);
      var gained = ally.gainExp(total);
      if (gained.levels > 0) {
        var learnedNames = [];
        for (var n = 0; n < gained.learned.length; n++) {
          var learnedSkill = this.data.getSkill(gained.learned[n]);
          learnedNames.push(learnedSkill ? learnedSkill.name : gained.learned[n]);
        }
        events.push({
          type: "levelUp", actorName: ally.getName(),
          fromLevel: before, toLevel: ally.level,
          // 画面側が喜ぶ動きを付けられるよう、本人も渡す
          actor: ally,
          // レベルアップの結果（画面中央の窓）に出す、能力値の前後と覚えた技
          statsBefore: statsBefore, statsAfter: statSnapshot(ally),
          learnedNames: learnedNames
        });
        for (var k = 0; k < gained.learned.length; k++) {
          var skill = this.data.getSkill(gained.learned[k]);
          events.push({
            type: "skillLearned", actorName: ally.getName(),
            // 図鑑に「覚えた」と記録するのは画面側なので、idも渡す
            // （BattleSystem は Game を知らないまま済ませたい）
            skillId: gained.learned[k],
            skillName: skill ? skill.name : gained.learned[k]
          });
        }
      }
    }
  };

  /**
   * 勝ったとき、この戦闘で一度でも場に出た仲間の愛情度を上げる（data/affection.js）。
   * 控えには入らない。倒れていても、場に出ていれば数える。
   * 段階が上がった仲間だけ、知らせの出来事を出す
   */
  BattleSystem.prototype._awardAffection = function (events) {
    var amount = (this.data.affection || {}).gainPerWin || 0;
    if (amount <= 0) return;

    for (var i = 0; i < this.allies.length; i++) {
      var ally = this.allies[i];
      if (!ally._appeared || !ally.gainAffection) continue;

      var result = ally.gainAffection(amount);
      if (result.to <= result.from) continue;

      var stage = ally.getAffectionStage();
      events.push({
        type: "affectionUp", actorName: ally.getName(), actor: ally,
        stageIndex: result.to, stageName: stage ? stage.name : ""
      });
      for (var k = 0; k < result.learned.length; k++) {
        var skill = this.data.getSkill(result.learned[k]);
        events.push({
          type: "skillLearned", actorName: ally.getName(),
          skillId: result.learned[k],
          skillName: skill ? skill.name : result.learned[k]
        });
      }
    }
  };

  // --- 内部ヘルパ ---

  /** レベルアップの前後を比べるための能力値（最大HP・攻撃・防御・素早さ・最大PP） */
  function statSnapshot(monster) {
    return {
      hp: monster.getMaxHp ? monster.getMaxHp() : 0,
      attack: monster.getAttack ? monster.getAttack() : 0,
      defense: monster.getDefense ? monster.getDefense() : 0,
      speed: monster.getSpeed ? monster.getSpeed() : 0,
      pp: monster.getMaxPp ? monster.getMaxPp() : 0
    };
  }

  /** 戦闘可能な者を先頭から最大 limit 体まで集める */
  function aliveMembers(list, limit) {
    var result = [];
    for (var i = 0; i < list.length && result.length < limit; i++) {
      if (!list[i].isFainted()) result.push(list[i]);
    }
    return result;
  }

  function firstAlive(list) {
    for (var i = 0; i < list.length; i++) {
      if (!list[i].isFainted()) return list[i];
    }
    return null;
  }

  /** 数値として使える値ならそれを、そうでなければ既定値を返す */
  function numberOr(value, fallback) {
    return (typeof value === "number") ? value : fallback;
  }

  function containsFlee(actions) {
    for (var i = 0; i < (actions || []).length; i++) {
      if (actions[i] && actions[i].type === "flee") return true;
    }
    return false;
  }

  /** スカウトを選んだ味方の位置（いなければ -1） */
  function findScoutIndex(actions) {
    for (var i = 0; i < (actions || []).length; i++) {
      if (actions[i] && actions[i].type === "scout") return i;
    }
    return -1;
  }

  /**
   * その技がダメージを与えるか。
   *
   * 威力0の意味は技によって違う。
   *   回復・バフ／デバフ・状態異常を持つ技 … 威力0なら掛けるだけでダメージは無い
   *   それ以外（通常攻撃） … 威力0でも通常攻撃と同じ計算でダメージを与える
   * _resolveHit の「威力を持たない技はここで終わり」と同じ判定。
   * 図鑑・戦闘の技の説明で「威力」を出すかどうかにも使う
   */
  /**
   * その技の強化・弱体が「強くする」ものか（isRaising と同じ判定）。
   * 演出の向き（強化は下から上・弱体は上から下）を、戦闘の外（動きの見本ページ）でも揃えるために出している
   */
  /**
   * 技の働き（data/categories.js の skillRole の id）。図鑑と戦闘の技選びの「働きごと」の並びに使う
   */
  BattleSystem.skillRoleOf = function (skill) {
    if (!skill) return "attack";
    if (BattleSystem.dealsDamage(skill)) return "attack";
    if (skill.heal || skill.cureStatus || skill.revive) return "heal";
    if (skill.status) return "status";
    if (skill.ppDamage) return "debuff";
    if (skill.modifier && !isRaising(skill.modifier) &&
        skill.target !== "self" && skill.target !== "ally" && skill.target !== "allAllies") return "debuff";
    return "buff";
  };

  /**
   * 技を並べ替えて、見出しごとにまとめる（図鑑と戦闘の技選びで共通）。
   *   mode … "element"（属性ごと）/ "kind"（種類ごと）/ "role"（働きごと）/ "name"（名前順）/ "order"（そのまま）
   *   ids  … 技id の配列（この順が「そのまま」の並び）
   * @returns {Array<{ group: {id,name,color}|null, ids: string[] }>} 見出しの無い並びは group が null の1つだけ
   */
  BattleSystem.groupSkills = function (data, ids, mode, nameOf) {
    var skills = ids.map(function (id) { return data.getSkill(id); });
    if (mode === "order" || !mode) return [{ group: null, ids: ids.slice() }];
    if (mode === "name") {
      var sorted = ids.slice().sort(function (a, b) {
        var na = nameOf ? nameOf(a) : (data.getSkill(a) || {}).name || "";
        var nb = nameOf ? nameOf(b) : (data.getSkill(b) || {}).name || "";
        // 名前の分からないもの（nameOf が null を返す）は最後に、元の順のまま
        if (na === null || nb === null) return (na === null) - (nb === null) || ids.indexOf(a) - ids.indexOf(b);
        return na.localeCompare(nb, "ja") || ids.indexOf(a) - ids.indexOf(b);
      });
      return [{ group: null, ids: sorted }];
    }
    var cats = data.categories || {};
    var defs, keyOf;
    if (mode === "kind") { defs = cats.skillKind || {}; keyOf = function (s) { return s.kind || "other"; }; }
    else if (mode === "role") { defs = cats.skillRole || {}; keyOf = function (s) { return BattleSystem.skillRoleOf(s); }; }
    else { defs = data.elements || {}; keyOf = function (s) { return s.element || "none"; }; }

    var groups = {}, keys = [];
    for (var i = 0; i < ids.length; i++) {
      var key = skills[i] ? keyOf(skills[i]) : "other";
      if (!groups[key]) { groups[key] = []; keys.push(key); }
      groups[key].push(ids[i]);
    }
    keys.sort(function (a, b) {
      var oa = defs[a] && typeof defs[a].order === "number" ? defs[a].order : 999;
      var ob = defs[b] && typeof defs[b].order === "number" ? defs[b].order : 999;
      return (oa - ob) || (keys.indexOf(a) - keys.indexOf(b));
    });
    return keys.map(function (key) {
      var def = defs[key] || { id: key, name: (key === "other" ? "その他" : key) };
      return { group: { id: key, name: def.name, color: def.color }, ids: groups[key] };
    });
  };

  BattleSystem.isRaising = function (skill) {
    return !!(skill && skill.modifier) && isRaising(skill.modifier);
  };

  /**
   * 体技の計算の分け方（v1.4.1・2026-11-12 作者の指定）。
   *   "rate"  … 1体の体技：通常攻撃の基礎 × 威力（倍率）。斬撃からクリティカルを抜いたもの
   *   "fixed" … 全体の体技：威力がそのまま基礎（固定ダメージ。攻撃力・防御力は効かない）
   *   null    … 体技でない・ダメージの無い体技・計算だけ別の種類の技（damageKind）
   */
  BattleSystem.bodyModeOf = function (skill) {
    if (!skill || skill.kind !== "body" || skill.damageKind || !skill.power) return null;
    var target = skill.target || "enemy";
    if (target === "allEnemies" || target === "allAllies") return "fixed";
    return (target === "enemy") ? "rate" : null;
  };

  BattleSystem.dealsDamage = function (skill) {
    if (!skill) return false;
    if (skill.power) return true;
    return !(skill.heal || skill.modifier || skill.status || skill.cureStatus || skill.ppDamage || skill.wardStatus || skill.charge || skill.revive);
  };

  NS.BattleSystem = BattleSystem;
})(window.MyGame);
