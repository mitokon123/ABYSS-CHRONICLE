/**
 * ScoutSystem.js
 * モンスターを仲間に誘う「スカウト」の判定を担当する。
 *
 * ▼ BattleSystem からは独立している
 * 戦闘中のスカウトだけでなく、将来のフィールドでの勧誘・イベントでの加入にも
 * 使えるよう、戦闘の状態には一切依存しない。
 * 「誘う相手」と「受け取り先」を渡せば、どこからでも呼べる。
 *
 * ▼ 相手に必要なインターフェース（MonsterInstance 互換）
 *   getSpecies() : 種族データ（scoutRate を持つ）
 *   getMaxHp()   : number
 *   currentHp    : number
 *
 * ▼ 数値はすべて data/scout.js から取得する。
 */
(function (NS) {
  "use strict";

  /**
   * @param {MyGame.GameData} gameData
   * @param {MyGame.Random} random
   */
  function ScoutSystem(gameData, random) {
    this.data = gameData;
    this.random = random;
  }

  /**
   * スカウト成功率を計算する（判定は行わない。UI表示にも使える）。
   * @param {object} target 誘う相手
   * @param {object} [item] 使用する道具（scoutMultiplier を持つ）
   * @param {number} [owned] 同じ種族をすでに持っている数（省略時は 0。倍率は ownedMultiplier）
   * @returns {number} 0〜1 の成功率
   */
  ScoutSystem.prototype.calcRate = function (target, item, owned) {
    var config = this.data.scout || {};
    var species = target.getSpecies ? target.getSpecies() : null;
    if (!species) return 0;

    var baseRate = species.scoutRate || 0;
    // 成功率が決まっている種族（scoutRateFixed。v1.4.3 シニガミの 1%）は、HP・道具・持っている数・
    // 最低保証と上限のどれも掛けず、scoutRate そのままにする
    if (species.scoutRateFixed) return baseRate;
    var maxHp = target.getMaxHp();
    var hpRatio = maxHp > 0 ? Math.max(0, Math.min(1, target.currentHp / maxHp)) : 0;

    var hpBonusMax = config.hpBonusMax === undefined ? 0 : config.hpBonusMax;
    var itemMultiplier = (item && item.scoutMultiplier !== undefined)
      ? item.scoutMultiplier
      : (config.defaultItemMultiplier === undefined ? 1 : config.defaultItemMultiplier);

    var rate = baseRate * (1 + (1 - hpRatio) * hpBonusMax) * itemMultiplier
             * this.ownedMultiplier(owned);

    var minRate = config.minRate === undefined ? 0 : config.minRate;
    var maxRate = config.maxRate === undefined ? 1 : config.maxRate;
    return Math.max(minRate, Math.min(maxRate, rate));
  };

  /**
   * 同じ種族をすでに持っている数ごとの倍率（data/scout.js の ownedMultipliers）。
   * 0体なら先頭の値、表より多いときは最後の値のまま。
   */
  ScoutSystem.prototype.ownedMultiplier = function (owned) {
    var list = (this.data.scout || {}).ownedMultipliers;
    if (!list || !list.length) return 1;
    var n = Math.max(0, Math.floor(owned || 0));
    return list[Math.min(n, list.length - 1)];
  };

  /**
   * 応じてくれるかどうかの判定だけを行う（どこにも加えない）。
   *
   * ★ 加えるところまで一度にやる関数は置かない。
   *   パーティがいっぱいでも判定は行い、応じてくれたら行き先
   *   （入れ替える／逃がす／拠点に送る）を選んでもらう仕様のため、
   *   「判定」と「加える」は必ず別の手順になる。加えるのは join()。
   *
   * @param {object} target 誘う相手
   * @param {object} [options] { item, owned }
   * @returns {{success:boolean, reason:string, rate:number, target:object}}
   */
  ScoutSystem.prototype.roll = function (target, options) {
    var opts = options || {};
    var rate = this.calcRate(target, opts.item, opts.owned);
    var success = this.random.next() < rate;

    return {
      success: success,
      reason: success ? "joined" : "refused",
      rate: rate,
      target: target
    };
  };

  /**
   * 受け取り先が上限に達しているか。
   * @param {object[]|MyGame.Party} receiver
   * @param {number} [capacity] 配列を渡した場合の上限（省略時は config.partyMax）
   */
  ScoutSystem.prototype.isFull = function (receiver, capacity) {
    if (!receiver) return false;

    // 上限を自分で判断できる相手（Party など）はそれに任せる
    if (typeof receiver.isFull === "function") return receiver.isFull();

    var max = (capacity === undefined || capacity === null)
      ? (this.data.config || {}).partyMax
      : capacity;
    if (max === undefined || max === null) return false;
    return receiver.length >= max;
  };

  /**
   * 判定を行わずに受け取り先へ加える。
   * 「応じてくれたが、どこへ入れるかは呼び出し側で決める」場合に使う。
   */
  ScoutSystem.prototype.join = function (receiver, target) {
    this._addTo(receiver, target);
  };

  /** 受け取り先へ加える（Party なら add、配列なら push） */
  ScoutSystem.prototype._addTo = function (receiver, target) {
    if (!receiver) return;
    if (typeof receiver.add === "function") receiver.add(target);
    else if (typeof receiver.push === "function") receiver.push(target);
  };

  NS.ScoutSystem = ScoutSystem;
})(window.MyGame);
