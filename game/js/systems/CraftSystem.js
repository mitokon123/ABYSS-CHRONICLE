/**
 * CraftSystem.js
 * 工房での「作れるか」の判断と、実際の作成を担当する。
 *
 * ▼ 役割
 * 画面には関与しない。素材とゴールドが足りているかを調べ、足りていれば作るだけ。
 * 持ち物への反映は Game のメソッド（giveItem / spendGold）に任せる。
 */
(function (NS) {
  "use strict";

  /**
   * @param {MyGame.GameData} gameData
   */
  function CraftSystem(gameData) {
    this.data = gameData;
  }

  /**
   * 作れるものを order 順に並べて返す。
   * unlockedBy が書かれているものは、そのダンジョンをクリアするまで並ばない。
   *
   * @param {object} cleared クリア済みダンジョンの一覧（{ id: true }）
   * @returns {object[]} recipes.js のエントリ
   */
  CraftSystem.prototype.getRecipes = function (cleared) {
    var recipes = this.data.recipes || {};
    var result = [];

    for (var id in recipes) {
      if (!Object.prototype.hasOwnProperty.call(recipes, id)) continue;
      var recipe = recipes[id];

      if (recipe.unlockedBy && !(cleared && cleared[recipe.unlockedBy])) continue;
      if (!this.data.getItem(recipe.result && recipe.result.item)) continue;

      result.push(recipe);
    }

    result.sort(function (a, b) { return (a.order || 999) - (b.order || 999); });
    return result;
  };

  /**
   * 素材の過不足を調べる。画面でそのまま並べられる形で返す。
   * @returns {Array<{item:object, need:number, owned:number, enough:boolean}>}
   */
  CraftSystem.prototype.getMaterialStatus = function (game, recipe) {
    var materials = (recipe && recipe.materials) || [];
    var result = [];

    for (var i = 0; i < materials.length; i++) {
      var item = this.data.getItem(materials[i].item);
      if (!item) continue;

      var owned = game.inventory.getCount(item.id);
      result.push({
        item: item,
        need: materials[i].count,
        owned: owned,
        enough: owned >= materials[i].count
      });
    }
    return result;
  };

  /**
   * 一度に作れる回数の上限（v1.4.4）。素材・所持金・持てる数（maxStack）のいちばん厳しいもの。
   * 1回も作れなければ 0
   */
  CraftSystem.prototype.maxCraftable = function (game, recipe) {
    if (!recipe || !recipe.result) return 0;
    var resultItem = this.data.getItem(recipe.result.item);
    if (!resultItem) return 0;
    var max = Infinity;
    var materials = recipe.materials || [];
    for (var i = 0; i < materials.length; i++) {
      var need = materials[i].count || 1;
      max = Math.min(max, Math.floor(game.inventory.getCount(materials[i].item) / need));
    }
    var gold = recipe.gold || 0;
    if (gold > 0) max = Math.min(max, Math.floor((game.gold || 0) / gold));
    var per = recipe.result.count || 1;
    var maxStack = (resultItem.maxStack === undefined) ? 999 : resultItem.maxStack;
    max = Math.min(max, Math.floor((maxStack - game.inventory.getCount(resultItem.id)) / per));
    if (max === Infinity) max = Math.floor(maxStack / per);
    return Math.max(0, max);
  };

  /**
   * 作れるか。
   * @returns {{ok:boolean, reason:string}}
   *   reason: "ok" | "notEnoughMaterial" | "notEnoughGold" | "stackFull" | "unknown"
   */
  CraftSystem.prototype.canCraft = function (game, recipe) {
    if (!recipe || !recipe.result) return { ok: false, reason: "unknown" };

    var status = this.getMaterialStatus(game, recipe);
    for (var i = 0; i < status.length; i++) {
      if (!status[i].enough) return { ok: false, reason: "notEnoughMaterial" };
    }

    if (!game.canAfford(recipe.gold || 0)) return { ok: false, reason: "notEnoughGold" };

    if (!this._hasRoomForResult(game, recipe)) {
      return { ok: false, reason: "stackFull" };
    }
    return { ok: true, reason: "ok" };
  };

  /**
   * 作ったものを持ち物へ入れられるか。
   *
   * 持ち物の種類数に上限は無いので、見るのは
   * 「その品を持てる数（data/items.js の maxStack）」だけ。
   */
  CraftSystem.prototype._hasRoomForResult = function (game, recipe) {
    var resultItem = this.data.getItem(recipe.result.item);
    if (!resultItem) return false;

    var owned = game.inventory.getCount(resultItem.id);
    var maxStack = (resultItem.maxStack === undefined) ? 999 : resultItem.maxStack;

    return owned + (recipe.result.count || 1) <= maxStack;
  };

  /**
   * 作る。素材とゴールドを消費して、できたものを持ち物へ入れる。
   * @param {number} [times] 何回ぶん作るか（v1.4.4。省略で1回。作れる上限を超えたら作らない）
   * @returns {{success:boolean, reason:string, count:number}}
   */
  CraftSystem.prototype.craft = function (game, recipe, times) {
    var check = this.canCraft(game, recipe);
    if (!check.ok) return { success: false, reason: check.reason, count: 0 };
    var n = Math.max(1, Math.floor(times || 1));
    if (n > this.maxCraftable(game, recipe)) return { success: false, reason: "notEnoughMaterial", count: 0 };

    // 素材とゴールドを先に消費する（ここまでで足りることは確認済み）
    var materials = recipe.materials || [];
    for (var i = 0; i < materials.length; i++) {
      game.inventory.remove(materials[i].item, materials[i].count * n);
    }
    game.spendGold((recipe.gold || 0) * n);

    var count = (recipe.result.count || 1) * n;
    var added = game.giveItem(recipe.result.item, count);

    return { success: true, reason: "crafted", count: added };
  };

  NS.CraftSystem = CraftSystem;
})(window.MyGame);
