/**
 * ShopScene.js
 * 拠点のショップ。左右キーで「買う」と「売る」を切り替える。
 *
 * 品揃え・値段の判断はすべて ShopSystem が行い、この画面は表示と入力だけを担当する。
 * 配置は data/ui.js の shop、文言は data/messages.js の shop で管理する。
 *
 * ▼ 操作
 *   ↑↓   … 選ぶ
 *   ←→   … 買う / 売る の切り替え
 *   決定   … 買う場合は「個数を決める → はい／いいえ」の2段階に進む
 *   Esc    … 1つ前へ戻る（一覧なら拠点へ）
 *
 * ▼ 右の説明（v1.4.0）
 *   共通の部品 NS.DetailPane（js/ui/Panel.js）。上の欄（絵・名前・分類・所持数）は動かさず、
 *   その下の行を右のバー・ホイールで送る（Q/E は店の切り替えなので使わない）。
 *   装備は「仲間がつけると」：連れている仲間ごとに、着けたときの能力の変わり方（いまの装備と入れ替えるならその名前）。
 *   素材などは「使い道（工房）」：いま並んでいるレシピのうち、それを使うもの（DexScene.itemUses）。
 *
 * ▼ 状態（this.phase）
 *   "list"     … 品物を選ぶ
 *   "quantity" … 何個買うかを決める（合計金額をその場に出す）
 *   "confirm"  … 「買いますか?」のはい／いいえ
 */
(function (NS) {
  "use strict";

  var NOTICE_DURATION = 1800;
  var TABS = ["buy", "sell"];

  /**
   * @param {MyGame.Game} game
   * @param {object} returnScene 閉じたときに戻るシーン
   */
  function ShopScene(game, returnScene) {
    this.game = game;
    this.returnScene = returnScene;

    var ui = game.data.ui || {};
    this.theme = ui.theme || {};
    this.layout = ui.shop || {};
    this.texts = (game.data.messages || {}).shop || {};

    this.panel = new NS.Panel(game.ctx, this.theme);
    this.renderer = new NS.Renderer(game.ctx);
    this.sprites = new NS.SpriteRenderer(game.ctx, game.assets);
    this.list = new NS.ScrollList(this.panel, this.layout.list, { sprites: this.sprites });
    this.shop = new NS.ShopSystem(game.data);

    this.confirmMenu = new NS.CommandMenu(this.panel, this.layout.confirmMenu);
    // 右の説明欄（v1.4.0）。中身は _detailContent が作る
    this.pane = new NS.DetailPane(this.panel, this.sprites, this.layout.detail || { x: 0, y: 0, w: 0, h: 0 });
    this._detailKey = null;
    this._detailCache = null;
    this.backButton = new NS.BackButton(this.panel, game.data);

    this.shops = this.shop.getShops(game.clearedDungeons);
    this.shopIndex = 0;
    this.tabIndex = 0;
    this.phase = "list";
    this.order = null;       // 買おうとしている内容 { itemId, price, count, max }
    this.notice = new NS.Notice(this.theme.notice);

    // 店主の台詞（data/shop.js の lines）。{ text, since }。出ていなければ null
    this._talk = null;
    this._idleTimer = 0;

    this._rebuildList();
  }

  ShopScene.prototype.enter = function () {
    // 店の曲。拠点へ戻ると拠点の曲に戻る（HomeScene.enter）
    this.game.audio.playBgm("shop");

    // クリア状況が変わっていると開く店が増えるので、開くたびに数え直す
    this.shops = this.shop.getShops(this.game.clearedDungeons);
    if (this.shopIndex >= this.shops.length) this.shopIndex = 0;

    this.tabIndex = 0;
    this.phase = "list";
    this.order = null;
    this.notice.clear();
    this._rebuildList();
    this._say("greet");
  };

  ShopScene.prototype.getTab = function () { return TABS[this.tabIndex]; };

  // --- 店主の台詞 ---

  /**
   * 店主に一言しゃべらせる（data/shop.js の lines）。
   * 条件（when）を満たす台詞の中から選ぶ。直前と同じ台詞はなるべく避ける
   * @param {string} kind greet / buy / sell / noMoney / idle
   */
  ShopScene.prototype._say = function (kind) {
    var shop = this.getShop();
    var list = (shop && shop.lines && shop.lines[kind]) || [];
    var candidates = [];
    for (var i = 0; i < list.length; i++) {
      var entry = (typeof list[i] === "string") ? { text: list[i] } : list[i];
      if (entry.when && !(this.game.story && this.game.story.isConditionMet(entry.when, this.game))) continue;
      candidates.push(entry.text);
    }
    this._idleTimer = 0;
    if (candidates.length === 0) return;

    var last = this._talk ? this._talk.text : null;
    if (candidates.length > 1) {
      var filtered = [];
      for (var j = 0; j < candidates.length; j++) if (candidates[j] !== last) filtered.push(candidates[j]);
      candidates = filtered;
    }
    this._talk = { text: candidates[Math.floor(Math.random() * candidates.length)], since: 0 };
  };

  /** ふきだしの時間と、何もしていないときの独り言 */
  ShopScene.prototype._updateTalk = function (dt) {
    var S = this.layout.speech || {};
    if (this._talk) this._talk.since += dt || 0;
    this._idleTimer += dt || 0;
    if (this.phase === "list" && this._idleTimer >= (S.idleInterval || 9000)) this._say("idle");
  };

  /** 店主の絵を押したか（押すと一言しゃべる） */
  ShopScene.prototype._clickedKeeper = function (input) {
    var pos = this.layout.keeper;
    var pointer = input.getPointer ? input.getPointer() : null;
    if (!pos || !pointer || !pointer.clicked) return false;
    var size = pos.size || 64;
    return NS.Panel.containsPoint({ x: pos.x, y: pos.y, w: size, h: size }, pointer);
  };

  /** いま見ている店（1軒も開いていなければ null） */
  ShopScene.prototype.getShop = function () {
    return this.shops[this.shopIndex] || null;
  };

  // --- 一覧の組み立て ---

  /** 加護を売る店を見ているか（data/shop.js の type: "blessing"） */
  ShopScene.prototype._isBlessingShop = function () {
    var shop = this.getShop();
    return !!(shop && shop.type === "blessing");
  };

  ShopScene.prototype._rebuildList = function () {
    // 買う・売るで持ち物の数が変わるので、右の説明も作り直す
    this._detailCache = null;
    // 加護は売れないので、この店では常に「買う」一覧を出す
    if (this._isBlessingShop()) {
      this.filters = null;
      this.list.setRows(this._buildBlessingRows());
      return;
    }
    // 絞り込みの候補は、いまの一覧に1つでも当てはまるものだけ（v1.4.0）
    this.filters = this._availableFilters();
    this.list.setRows(this.getTab() === "buy" ? this._buildBuyRows() : this._buildSellRows());
  };

  // --- 絞り込み（v1.4.0・2026-11-12 作者「ショップで絞り込みができるように（手に入る場所など）」） ---

  /**
   * 絞り込みの並び。F か、一覧の右上の札を押すと次へ。
   *   all … すべて  use … 回復・道具  weapon / armor / accessory … 装備の枠
   *   material … 素材すべて  from:〇〇 … その場所の素材だけ（data/items.js の from。恒常素材も）
   * 選んだものは店を閉じても覚えておく（game.shopFilter。セーブはしない。工房と同じ）
   */
  var BASE_FILTERS = ["all", "use", "weapon", "armor", "accessory", "material"];

  function filterMatches(filter, item, from) {
    if (!filter || filter === "all") return true;
    if (filter === "use") return !item.equip && item.category !== "material";
    if (filter === "material") return item.category === "material";
    if (filter.indexOf("from:") === 0) return item.category === "material" && from === filter.slice(5);
    return !!item.equip && NS.EffectSystem.slotOf(item) === filter;
  }

  /** いまのタブ（買う／売る）に並ぶ品と、その手に入る場所 [{ item, from }]（絞り込む前） */
  ShopScene.prototype._tabEntries = function () {
    var result = [];
    if (this.getTab() === "buy") {
      var stock = this.shop.getStock(this.game.clearedDungeons, this.getShop());
      for (var i = 0; i < stock.length; i++) result.push({ item: stock[i].item, from: stock[i].from });
      return result;
    }
    var inventory = this.game.inventory;
    var groups = inventory ? inventory.groupByCategory() : [];
    for (var g = 0; g < groups.length; g++) {
      for (var s = 0; s < groups[g].slots.length; s++) {
        var item = this.game.data.getItem(groups[g].slots[s].itemId);
        if (item && this.shop.canSell(item)) result.push({ item: item, from: item.from || null });
      }
    }
    return result;
  };

  ShopScene.prototype._availableFilters = function () {
    var entries = this._tabEntries();
    var shop = this.shop;
    var sources = [];
    for (var i = 0; i < entries.length; i++) {
      var from = entries[i].from;
      if (entries[i].item.category === "material" && from && sources.indexOf(from) < 0) sources.push(from);
    }
    sources.sort(function (a, b) { return shop._fromOrder(a) - shop._fromOrder(b); });
    var candidates = BASE_FILTERS.concat(sources.map(function (f) { return "from:" + f; }));
    return candidates.filter(function (filter) {
      if (filter === "all") return true;
      for (var k = 0; k < entries.length; k++) {
        if (filterMatches(filter, entries[k].item, entries[k].from)) return true;
      }
      return false;
    });
  };

  ShopScene.prototype._currentFilter = function () {
    var filters = this.filters || ["all"];
    return filters.indexOf(this.game.shopFilter) >= 0 ? this.game.shopFilter : "all";
  };

  ShopScene.prototype._changeFilter = function (direction) {
    if (!this.filters || this.filters.length <= 1) return;
    var index = this.filters.indexOf(this._currentFilter());
    this.game.shopFilter = this.filters[(index + direction + this.filters.length) % this.filters.length];
    this.notice.clear();
    this._rebuildList();
  };

  /** 絞り込みの名前（札に出す） */
  ShopScene.prototype._filterName = function (filter) {
    var names = this.texts.filters || {};
    if (filter.indexOf("from:") === 0) {
      return fill(this.texts.filterSource || "{name}", { name: this.shop.getFromName(filter.slice(5)) });
    }
    return names[filter] || filter;
  };

  ShopScene.prototype._clickedFilterLabel = function (input) {
    var pointer = input.getPointer ? input.getPointer() : null;
    return !!(pointer && pointer.clicked && this._filterRect && NS.Panel.containsPoint(this._filterRect, pointer));
  };

  /** 一覧の右上の絞り込みの札（「≡ 素材・苔むす坑道」）。右端を一覧の右端にそろえる。押すと次に変わる */
  ShopScene.prototype._renderFilterLabel = function () {
    this._filterRect = null;
    var pos = this.layout.filter;
    if (!pos || !this.filters || this.phase !== "list") return;
    var t = this.theme;
    var filter = this._currentFilter();
    var text = fill(this.texts.filterLabel || "{name}", { name: this._filterName(filter) });
    var ctx = this.panel.ctx;
    ctx.save();
    ctx.font = t.smallFont || "12px monospace";
    var w = ctx.measureText(text).width;
    ctx.restore();
    var x = pos.right - w;
    this._filterRect = { x: x - 8, y: pos.y - 17, w: w + 16, h: 24 };
    ctx.save();
    ctx.fillStyle = filter === "all" ? "rgba(74,107,168,0.18)" : "rgba(74,107,168,0.4)";
    ctx.fillRect(this._filterRect.x, this._filterRect.y, this._filterRect.w, this._filterRect.h);
    ctx.strokeStyle = filter === "all" ? (t.panelBorder || "#3a4266") : (t.cursorColor || "#ffd75e");
    ctx.lineWidth = 1;
    ctx.strokeRect(this._filterRect.x + 0.5, this._filterRect.y + 0.5, this._filterRect.w - 1, this._filterRect.h - 1);
    ctx.restore();
    this.panel.drawText(text, x, pos.y, { font: t.smallFont, color: filter === "all" ? t.subTextColor : t.cursorColor });
  };

  /**
   * 謎の商人に並ぶ加護。
   * 買ったものは値段のかわりに「持っている」と出し、選べないようにする。
   */
  ShopScene.prototype._buildBlessingRows = function () {
    var blessings = this.game.data.blessings || {};
    var t = this.theme;
    var rows = [];

    for (var id in blessings) {
      if (!Object.prototype.hasOwnProperty.call(blessings, id)) continue;

      var blessing = blessings[id];
      if (!blessing.locked) continue;   // 最初から使えるものは売らない
      // 後から並ぶ加護（data/blessings.js の unlockedBy）。条件の書き方はダンジョンと同じ
      if (blessing.unlockedBy && NS.DungeonCatalog &&
          !NS.DungeonCatalog.isConditionMet(blessing.unlockedBy, this.game.clearedDungeons, this.game.data)) {
        continue;
      }

      var owned = this.game.hasBoughtBlessing(id);
      var affordable = this.game.canAfford(blessing.price || 0);

      rows.push({
        type: "entry",
        label: blessing.name,
        right: owned ? (this.texts.blessingOwned || "所持")
                     : fill(this.texts.blessingPrice, { price: blessing.price || 0 }),
        color: owned ? t.hintColor : (affordable ? t.textColor : t.hintColor),
        // 買えないもの（もう持っている）は value を持たせない。
        // 決定を押しても何も起きなくなる（_updateList が value を見ている）
        value: owned ? null : { blessingId: id, price: blessing.price || 0 },
        // 説明を出すためのid。買ったあとも読めるよう value とは別に持つ
        blessingId: id
      });
    }

    if (rows.length === 0) {
      rows.push({ type: "header", label: this.texts.noBlessings || "売り物がない", color: t.hintColor });
    }
    return rows;
  };

  /** 店に並んでいる品物。買えないものは薄く表示する */
  ShopScene.prototype._buildBuyRows = function () {
    var stock = this.shop.getStock(this.game.clearedDungeons, this.getShop());
    var t = this.theme;
    var rows = [];
    var lastCategory = null;
    var lastFrom = null;
    var filter = this._currentFilter();

    for (var i = 0; i < stock.length; i++) {
      var item = stock[i].item;
      if (!filterMatches(filter, item, stock[i].from)) continue;

      // 分類が変わったら見出しを挟む（持ち物の画面と同じ見せ方にそろえる）
      var category = this.shop.getCategory(item);
      if (category !== lastCategory) {
        rows.push(this._categoryHeader(category));
        lastCategory = category;
        lastFrom = null;
      }

      // 手に入る場所（data/shop.js の from）が変わったら、その下に小見出しを挟む。
      // 素材を「どのステージのものか」で分けて見せる（装備の武器・防具の小見出しと同じ形）
      var from = stock[i].from;
      if (from && from !== lastFrom) {
        rows.push({
          type: "header",
          label: "  " + this.shop.getFromName(from),
          color: (category && category.subColor) || t.subTextColor
        });
      }
      lastFrom = from;

      var affordable = this.game.canAfford(stock[i].price);
      rows.push({
        type: "entry",
        label: item.name,
        icon: item.icon,
        right: stock[i].price + "G",
        color: affordable ? t.textColor : t.hintColor,
        value: { itemId: item.id, price: stock[i].price }
      });
    }
    return rows;
  };

  /** 分類の見出し。持ち物・図鑑と同じ形にそろえる */
  ShopScene.prototype._categoryHeader = function (category) {
    return {
      type: "header",
      label: "- " + ((category && category.name) || "その他") + " -",
      color: (category && category.color) || this.theme.subTextColor
    };
  };

  /**
   * 持ち物のうち、売れるもの。
   * 買う側と同じく分類ごとに並べる（持ち物の画面と行き来しても迷わないように）。
   */
  ShopScene.prototype._buildSellRows = function () {
    var inventory = this.game.inventory;
    var rows = [];
    if (!inventory) return rows;

    var groups = inventory.groupByCategory();
    var filter = this._currentFilter();

    for (var g = 0; g < groups.length; g++) {
      var group = groups[g];
      var entries = [];

      for (var s = 0; s < group.slots.length; s++) {
        var slot = group.slots[s];
        var item = this.game.data.getItem(slot.itemId);
        if (!item || !this.shop.canSell(item)) continue;
        if (!filterMatches(filter, item, item.from || null)) continue;

        var price = this.shop.getSellPrice(item);
        entries.push({
          type: "entry",
          label: item.name + " x" + slot.count,
          icon: item.icon,
          right: price + "G",
          value: { itemId: item.id, price: price }
        });
      }

      // 売れるものが1つも無い分類は、見出しごと出さない
      if (entries.length === 0) continue;

      rows.push(this._categoryHeader(group.category));
      for (var e = 0; e < entries.length; e++) rows.push(entries[e]);
    }
    return rows;
  };

  // --- 更新 ---

  ShopScene.prototype.update = function (dt) {
    var input = this.game.input;

    this.notice.update(dt);
    this._updateTalk(dt);

    // 「戻る」ボタン。個数を決めている途中なら1つ前へ戻す
    if (this.backButton.handleInput(input)) {
      this._goBack();
      return;
    }

    if (this.phase === "quantity") { this._updateQuantity(input); return; }
    if (this.phase === "confirm")  { this._updateConfirm(input); return; }

    // 上下段のタブ。左右で「買う／売る」、上のタブは店の切り替え
    if (input.isPressed("left")) this._changeTab(-1);
    if (input.isPressed("right")) this._changeTab(1);
    if (input.isPressed("prevTab")) this._changeShop(-1);
    if (input.isPressed("nextTab")) this._changeShop(1);
    if (this._clickedShopTab(input)) return;
    if (this._clickedTab(input)) return;
    if (this._clickedKeeper(input)) { this._say("idle"); return; }
    // 絞り込み（F・札を押す。v1.4.0）
    if (input.isPressed("filter") || this._clickedFilterLabel(input)) { this._changeFilter(1); return; }

    // 右の説明欄（バー・ホイール）。バーを触っている間はほかの操作を見ない
    this._detailContent();
    var paneResult = this.pane.handleInput(input);
    if (paneResult && paneResult.bar) return;

    // ScrollList が扱うのは上下移動だけ。決定・取消はここで見る
    this.list.handleInput(input);

    if (input.isPressed("cancel")) {
      this.game.scenes.change(this.returnScene);
      return;
    }
    // マウスで行を押した場合も決定と同じ扱いにする
    if (input.isPressed("confirm") || this.list.clickedEntry(input)) this._onConfirm();
  };

  // --- 個数を決める ---

  /**
   * 何個やりとりするかを決める状態に入る。
   * 買うときも売るときも同じ流れにする（誤って決定しないように）。
   * @param {string} mode "buy" / "sell"
   */
  ShopScene.prototype._beginQuantity = function (mode, choice) {
    var item = this.game.data.getItem(choice.itemId);
    var max = (mode === "buy")
      ? this.shop.getMaxBuyCount(this.game, item, choice.price)
      : this.shop.getMaxSellCount(this.game, item);

    // 1個もやりとりできないなら、理由を出して一覧のままにする
    if (max <= 0) {
      this._showNotice(this._blockedReason(mode, choice));
      this.game.playError();
      if (mode === "buy" && !this.game.canAfford(choice.price)) this._say("noMoney");
      return;
    }

    this.order = {
      mode: mode, itemId: choice.itemId, price: choice.price, count: 1, max: max
    };
    this.phase = "quantity";
  };

  /** 1個もやりとりできない理由 */
  ShopScene.prototype._blockedReason = function (mode, choice) {
    if (mode === "sell") {
      // 持っているのに売れないのは、所持金が上限（v1.4.4）のとき
      var owned = this.game.inventory.getCount(choice.itemId);
      return (owned > 0 && this.game.getGoldRoom && this.game.getGoldRoom() < this.shop.getSellPrice(this.game.data.getItem(choice.itemId)))
        ? this.texts.goldFull : this.texts.notOwned;
    }
    return this.game.canAfford(choice.price) ? this.texts.stackFull : this.texts.notEnoughGold;
  };

  /**
   * 個数を決める。
   *
   * ★ 左右が1つずつ、上下がまとめて（quantityStep）。
   *   画面には「◀ 3 ▶」と横向きの矢印が出ているので、
   *   左右を押したときに10ずつ動くと、矢印の見た目と合わない。
   *   細かく合わせるのが左右、大きく動かすのが上下。
   */
  ShopScene.prototype._updateQuantity = function (input) {
    var step = this.layout.quantityStep || 10;

    if (input.isPressed("right")) this._changeCount(1);
    if (input.isPressed("left")) this._changeCount(-1);
    if (input.isPressed("up")) this._changeCount(step);
    if (input.isPressed("down")) this._changeCount(-step);

    if (input.isPressed("cancel")) {
      this.phase = "list";
      this.order = null;
      return;
    }
    if (input.isPressed("confirm")) this._beginConfirm();
  };

  /** 個数を増減する（1〜買える上限に収める） */
  ShopScene.prototype._changeCount = function (delta) {
    if (!this.order) return;
    this.order.count = Math.max(1, Math.min(this.order.max, this.order.count + delta));
  };

  /** 合計金額 */
  ShopScene.prototype._orderTotal = function () {
    return this.order ? this.order.price * this.order.count : 0;
  };

  /** いま買おう（売ろう）としているものの名前。加護と品物の両方に対応する */
  ShopScene.prototype._orderName = function () {
    if (!this.order) return "";

    if (this.order.mode === "blessing") {
      var blessing = (this.game.data.blessings || {})[this.order.blessingId];
      return (blessing && blessing.name) || this.order.blessingId;
    }
    var item = this.game.data.getItem(this.order.itemId);
    return (item && item.name) || this.order.itemId;
  };

  // --- はい / いいえ ---

  ShopScene.prototype._beginConfirm = function () {
    this.confirmMenu.setItems([
      { label: this.texts.yes || "はい", value: "yes" },
      { label: this.texts.no || "いいえ", value: "no" }
    ]);
    this.phase = "confirm";
  };

  ShopScene.prototype._updateConfirm = function (input) {
    var result = this.confirmMenu.handleInput(input);
    if (!result) return;

    // 取り消し・いいえ は個数の選択へ戻る
    if (result.type === "cancel" || result.value === "no") {
      this.phase = "quantity";
      return;
    }
    if (result.value !== "yes") return;

    if (this.order && this.order.mode === "blessing") this._buyBlessing();
    else if (this.order && this.order.mode === "sell") this._sell();
    else this._buy();
  };

  /** 加護を買う。恒久的に残るので、持ち物ではなく Game に記録される */
  ShopScene.prototype._buyBlessing = function () {
    if (!this.order) return;

    var blessing = (this.game.data.blessings || {})[this.order.blessingId];
    var result = this.game.buyBlessing(this.order.blessingId);

    if (result.success) {
      // 上限（data/run.js の activeMax）でいっぱいなら、買っても選択肢には入らない。
      // 拠点で入れ替えてもらう必要があるので、そこまで伝える
      var text = fill(this.texts.blessingBought, { name: blessing.name, price: this.order.price });
      if (!this.game.isBlessingActive(this.order.blessingId)) {
        text += this.texts.blessingFull || "";
      }
      // 加護は「お金が動いた」音ではなく、決定音（Game が鳴らす）だけ
      this._showNotice(text);
      this._say("buy");
    } else {
      this._showNotice(this.texts[result.reason] || result.reason);
      this.game.playError();
      if (result.reason === "notEnoughGold") this._say("noMoney");
    }

    this.order = null;
    this.phase = "list";
    this._refreshList();
  };

  /** 1つ前へ戻る（一覧まで戻っていれば拠点へ） */
  ShopScene.prototype._goBack = function () {
    if (this.phase === "confirm") { this.phase = "quantity"; return; }
    if (this.phase === "quantity") { this.phase = "list"; this.order = null; return; }
    this.game.scenes.change(this.returnScene);
  };

  ShopScene.prototype._changeTab = function (direction) {
    // 加護は売れないので、この店では「買う／売る」を切り替えさせない
    if (this._isBlessingShop()) return;

    this.tabIndex = (this.tabIndex + direction + TABS.length) % TABS.length;
    this.notice.clear();
    this._rebuildList();
  };

  /** 店を切り替える。売る一覧は店に関係ないので、買う側に戻す */
  ShopScene.prototype._changeShop = function (direction) {
    var count = this.shops.length;
    if (count <= 1) return;

    this.shopIndex = (this.shopIndex + direction + count) % count;
    this.tabIndex = 0;
    this.notice.clear();
    this._rebuildList();
    this._talk = null;
    this._say("greet");   // 店が変われば店主も変わるので、あいさつし直す
  };

  /** 上段の店タブをマウスで押したか */
  ShopScene.prototype._clickedShopTab = function (input) {
    if (!input.getPointer || !input.getPointer().clicked) return false;

    var T = this.layout.shopTabs;
    if (!T) return false;

    var pointer = input.getPointer();
    for (var i = 0; i < this.shops.length; i++) {
      var rect = { x: T.x + (T.w + T.gap) * i, y: T.y, w: T.w, h: T.h };
      if (!NS.Panel.containsPoint(rect, pointer)) continue;

      if (i !== this.shopIndex) {
        this.shopIndex = i;
        this.tabIndex = 0;
        this.notice.clear();
        this._rebuildList();
        this._talk = null;
        this._say("greet");
      }
      return true;
    }
    return false;
  };

  /** 上部の「買う / 売る」をマウスで押したか */
  ShopScene.prototype._clickedTab = function (input) {
    if (this._isBlessingShop()) return false;   // 加護の店には「売る」が無い
    if (!input.getPointer || !input.getPointer().clicked) return false;

    var T = this.layout.tabs;
    if (!T) return false;

    var pointer = input.getPointer();
    for (var i = 0; i < TABS.length; i++) {
      var rect = { x: T.x + (T.w + T.gap) * i, y: T.y, w: T.w, h: T.h };
      if (!NS.Panel.containsPoint(rect, pointer)) continue;

      if (i !== this.tabIndex) {
        this.tabIndex = i;
        this.notice.clear();
        this._rebuildList();
      }
      return true;
    }
    return false;
  };

  ShopScene.prototype._onConfirm = function () {
    var selected = this.list.getSelected();
    if (!selected) return;

    // 加護は1つずつしか買えないので、個数を決める段は飛ばして確認へ進む
    if (selected.value && selected.value.blessingId) {
      this.order = {
        mode: "blessing", blessingId: selected.value.blessingId,
        price: selected.value.price, count: 1, max: 1
      };
      this._beginConfirm();
      return;
    }
    if (this._isBlessingShop()) return;   // 「所持」の行など、選べないもの

    // 買うときも売るときも、個数と金額を確かめてから実行する
    this._beginQuantity(this.getTab(), selected.value);
  };

  /** 所持金・持ち物が変わったので一覧を作り直す（カーソル位置は保つ） */
  ShopScene.prototype._refreshList = function () {
    var index = this.list.index;
    this._rebuildList();
    if (index < this.list.rows.length) this.list.setIndex(index);
  };

  ShopScene.prototype._buy = function () {
    if (!this.order) return;

    var item = this.game.data.getItem(this.order.itemId);
    var result = this.shop.buy(this.game, this.order.itemId, this.order.price, this.order.count);

    this._showNotice(result.success
      ? fill(this.texts.bought, { name: item.name, count: result.count, price: result.gold })
      : (this.texts[result.reason] || result.reason));
    if (result.success) { this.game.audio.playSe("buy"); this._say("buy"); }
    else {
      this.game.playError();
      if (result.reason === "notEnoughGold") this._say("noMoney");
    }

    this.order = null;
    this.phase = "list";
    this._refreshList();
  };

  ShopScene.prototype._sell = function () {
    if (!this.order) return;

    var item = this.game.data.getItem(this.order.itemId);
    var result = this.shop.sell(this.game, this.order.itemId, this.order.count);

    this._showNotice(result.success
      ? fill(this.texts.sold, { name: item.name, count: result.count, price: result.gold })
      : (this.texts[result.reason] || result.reason));
    // 売るときも買うときと同じ「お金が動いた」音
    if (result.success) { this.game.audio.playSe("buy"); this._say("sell"); }
    else this.game.playError();

    this.order = null;
    this.phase = "list";
    this._refreshList();
  };

  ShopScene.prototype._showNotice = function (text) {
    this.notice.show(text, NOTICE_DURATION);
  };

  // --- 描画 ---

  ShopScene.prototype.render = function (ctx) {
    var w = this.game.canvas.width;
    var h = this.game.canvas.height;

    this.renderer.clear(this.layout.background || "#000000", w, h);

    this._renderHeading();
    this._renderShopTabs();
    this._renderTabs();
    this._renderFilterLabel();
    this._renderKeeper();
    this._renderGold();
    this.list.render(this.game.clock);

    // 個数を決めている間は、説明の代わりに注文の内容を出す
    if (this.phase === "list") this._renderDetail();
    else this._renderOrder();

    this._renderNotice();
    this._renderHint();
    this.backButton.render();
  };

  /**
   * 買おうとしている内容。
   * 「何を・何個・合計いくら・買うと残りいくら」までその場で分かるようにする。
   */
  ShopScene.prototype._renderOrder = function () {
    var rect = this.layout.detail;
    if (!rect || !this.order) return;

    this.panel.drawBox(rect);

    var t = this.theme;
    var origin = this.panel.innerOrigin(rect);
    var lh = t.lineHeight || 18;
    var y = origin.y + 20;

    var selling = (this.order.mode === "sell");
    var buyingBlessing = (this.order.mode === "blessing");
    var name = this._orderName();
    var total = this._orderTotal();
    // 買えば減り、売れば増える
    var rest = (this.game.gold || 0) + (selling ? total : -total);

    this.panel.drawText(name, origin.x, y);
    y += lh + 6;

    // 加護は1つずつしか買えないので、個数の行は出さずに説明を出す
    if (buyingBlessing) {
      var blessing = (this.game.data.blessings || {})[this.order.blessingId];
      if (blessing) {
        // 枠に収まる文字数で折り返す（他の画面と同じやり方）
        var lines = wrapText(blessing.description || "",
          (this.layout.detail && this.layout.detail.charsPerLine) || 18);
        for (var i = 0; i < lines.length; i++) {
          this.panel.drawText(lines[i], origin.x, y, { font: t.smallFont, color: t.subTextColor });
          y += lh - 2;
        }
        y += 8;
      }
    } else {
      // 個数。
      // 左右で1つずつ、上下でまとめて動くことが見て分かるよう、
      // 数字の左右に ◀▶、その上下に ▲▼ を添える
      var step = this.layout.quantityStep || 10;
      var countRight = rect.x + rect.w - (t.padding || 8);

      this.panel.drawText(this.texts.countLabel || "", origin.x, y,
        { font: t.smallFont, color: t.subTextColor });

      this.panel.drawText("▲" + step, countRight, y - lh + 4,
        { align: "right", font: t.smallFont, color: t.hintColor });
      this.panel.drawText("◀ " + this.order.count + " ▶", countRight, y,
        { align: "right", color: t.cursorColor });
      this.panel.drawText("▼" + step, countRight, y + lh - 4,
        { align: "right", font: t.smallFont, color: t.hintColor });

      y += lh * 2 - 2;

      this.panel.drawText(fill(this.texts.maxCount, { max: this.order.max }), origin.x, y,
        { font: t.smallFont, color: t.hintColor });
      y += lh + 8;
    }

    // 単価と合計
    this.panel.drawText(
      fill(selling ? this.texts.unitSellPrice : this.texts.unitPrice, { price: this.order.price }),
      origin.x, y, { font: t.smallFont, color: t.subTextColor });
    y += lh;

    this.panel.drawText(this.texts.totalLabel || "", origin.x, y, { font: t.smallFont });
    this.panel.drawText(total + "G", rect.x + rect.w - (t.padding || 8), y,
      { align: "right", color: t.cursorColor });
    y += lh + 2;

    this.panel.drawText(
      fill(selling ? this.texts.afterGoldSell : this.texts.afterGold, { amount: rest }),
      origin.x, y, { font: t.smallFont, color: t.subTextColor });
    y += lh + 10;

    // はい／いいえ
    if (this.phase !== "confirm") return;

    this.panel.drawText(
      buyingBlessing
        ? fill(this.texts.confirmBlessing, { name: name, price: total })
        : fill(selling ? this.texts.confirmSell : this.texts.confirmBuy,
               { name: name, count: this.order.count, price: total }),
      origin.x, y, { font: t.smallFont, color: t.textColor });

    this.confirmMenu.render(this.game.clock);
  };

  ShopScene.prototype._renderHeading = function () {
    var title = this.layout.title || {};
    var subtitle = this.layout.subtitle || {};
    var shop = this.getShop();

    this.panel.drawText(this.texts.title || "", title.x, title.y,
      { font: title.font, color: title.color });

    // 見出しの下は、いま見ている店の一言にする
    var line = (shop && shop.subtitle) || this.texts.subtitle || "";
    this.panel.drawText(line, subtitle.x, subtitle.y,
      { font: subtitle.font, color: subtitle.color });
  };

  /**
   * 上段の店タブ。開いている店だけが並ぶ。
   * 1軒しか開いていなくても出す（どの店にいるかが分かるように）。
   */
  ShopScene.prototype._renderShopTabs = function () {
    var T = this.layout.shopTabs;
    if (!T || this.shops.length === 0) return;

    for (var i = 0; i < this.shops.length; i++) {
      this._drawTab(T, i, this.shops[i].name || "", i === this.shopIndex);
    }
  };

  ShopScene.prototype._renderTabs = function () {
    var T = this.layout.tabs;
    if (!T) return;

    var labels = [this.texts.tabBuy || "", this.texts.tabSell || ""];
    for (var i = 0; i < labels.length; i++) {
      this._drawTab(T, i, labels[i], i === this.tabIndex);
    }
  };

  /** タブ1つ分。上段（店）と下段（買う／売る）で見た目をそろえる */
  ShopScene.prototype._drawTab = function (T, index, label, selected) {
    var t = this.theme;
    var ctx = this.panel.ctx;
    var x = T.x + (T.w + T.gap) * index;

    ctx.fillStyle = selected ? "rgba(74,107,168,0.35)" : "rgba(8,10,20,0.6)";
    ctx.fillRect(x, T.y, T.w, T.h);
    ctx.strokeStyle = selected ? (t.cursorColor || "#ffd75e") : (t.panelBorder || "#3a4266");
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, T.y + 0.5, T.w - 1, T.h - 1);

    this.panel.drawText(label, x + T.w / 2, T.y + Math.round(T.h / 2) + 4,
      { align: "center", font: t.smallFont,
        color: selected ? t.cursorColor : t.subTextColor });
  };

  /** 店主。店ごとに違う相手が立っている */
  ShopScene.prototype._renderKeeper = function () {
    var pos = this.layout.keeper;
    var shop = this.getShop();
    if (!pos || !shop || !shop.keeper) return;

    var size = pos.size || 64;
    this.sprites.drawMotion(shop.keeper, pos.x, pos.y, size, size,
      NS.Motion.of(this.game.data, shop.keeperMotion, this.game.clock, 0));
    this._renderSpeech();
  };

  /**
   * 店主のふきだし。店主の左に出し、しっぽを店主へ向ける。
   * 出るときはふわっと浮かび、life が過ぎたら薄れて消える
   */
  ShopScene.prototype._renderSpeech = function () {
    var talk = this._talk;
    var S = this.layout.speech;
    if (!talk || !S) return;
    var life = S.life || 6000;
    if (talk.since >= life) return;

    var fadeIn = S.fadeIn || 200, fadeOut = S.fadeOut || 500;
    var alpha = Math.min(1, talk.since / fadeIn, (life - talk.since) / fadeOut);
    var ctx = this.panel.ctx;
    var t = this.theme;
    var box = { x: S.x, y: S.y, w: S.w, h: S.h };

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    this.panel.drawBox(box);
    // しっぽ（店主のほうへ）
    ctx.fillStyle = t.panelBg || "rgba(0,0,0,0.9)";
    ctx.strokeStyle = t.panelBorder || "#3a4560";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(box.x + box.w - 1, S.tailY - 6);
    ctx.lineTo(box.x + box.w + (S.tailLength || 12), S.tailY);
    ctx.lineTo(box.x + box.w - 1, S.tailY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    var lines = wrapText(talk.text, S.charsPerLine || 19).slice(0, 2);
    for (var i = 0; i < lines.length; i++) {
      this.panel.drawText(lines[i], box.x + (S.padX || 12), box.y + (S.padTop || 24) + (S.lineHeight || 18) * i,
        { font: S.font || t.smallFont, color: t.textColor });
    }
    ctx.restore();
  };

  ShopScene.prototype._renderGold = function () {
    var pos = this.layout.gold;
    if (!pos) return;

    var template = ((this.game.data.messages || {}).home || {}).gold || "{amount}G";
    // 上限（v1.4.4）に届いていれば色を変える
    var full = this.game.isGoldFull && this.game.isGoldFull();
    this.panel.drawText(template.replace("{amount}", this.game.gold || 0), pos.x, pos.y,
      { align: "right", font: pos.font || this.theme.font,
        color: full ? (this.theme.goldFullColor || "#ff9a3a") : (pos.color || this.theme.cursorColor) });
  };

  // --- 右の説明（v1.4.0） ---

  /** 右側：選んでいる品物（加護）の説明。枠・バーは DetailPane が描く */
  ShopScene.prototype._renderDetail = function () {
    if (!this.layout.detail) return;
    this._detailContent();
    var empty = (this.getTab() === "buy") ? this.texts.noStock : this.texts.nothingToSell;
    this.pane.render(empty || "");
  };

  /** 選んでいる行の説明 { head, lines }。選ぶもの・一覧が変わったら作り直す */
  ShopScene.prototype._detailContent = function () {
    var selected = this.list.getSelected();
    var key = null;
    if (selected) {
      key = selected.blessingId ? ("blessing:" + selected.blessingId)
          : (selected.value ? (this.getTab() + ":" + selected.value.itemId) : null);
    }
    if (key !== this._detailKey) {
      this._detailKey = key;
      this._detailCache = null;
    }
    if (key && !this._detailCache) {
      this._detailCache = selected.blessingId
        ? this._buildBlessingDetail(selected.blessingId)
        : this._buildItemDetail(selected.value);
    }
    var content = key ? this._detailCache : null;
    this.pane.setContent(content, key);
    return content;
  };

  ShopScene.prototype._buildItemDetail = function (choice) {
    var data = this.game.data;
    var item = data.getItem(choice.itemId);
    if (!item) return null;

    var texts = this.texts;
    var t = this.theme;
    var rect = this.layout.detail || {};
    var lines = [];
    var i;

    var category = ((data.categories || {}).item || {})[item.category] || { name: item.category || "" };
    var chipLabel = category.name + (item.equip ? "・" + NS.EffectSystem.slotName(item, data) : "");
    var count = this.game.inventory ? this.game.inventory.getCount(item.id) : 0;
    var sub = (this.getTab() === "sell")
      ? fill(texts.ownedSell, { count: count, price: choice.price })
      : fill(texts.owned, { count: count });

    var desc = wrapText(item.description || "", rect.charsPerLine || 26);
    for (i = 0; i < desc.length; i++) lines.push({ text: desc[i] });

    if (item.equip) {
      lines.push({});
      lines.push({ text: texts.effectLabel || "", heading: true });
      var effects = item.equip.effects || [];
      for (i = 0; i < effects.length; i++) lines.push({ text: "・" + this._describeEffect(effects[i]) });

      // 仲間がつけると（連れている仲間だけ）
      var members = (this.game.party && this.game.party.getMembers) ? this.game.party.getMembers() : [];
      if (members.length > 0) {
        lines.push({});
        lines.push({ text: texts.compareLabel || "", heading: true });
        for (i = 0; i < members.length; i++) this._pushCompare(lines, members[i], item);
      }
    } else if (NS.DexScene && NS.DexScene.itemUses) {
      // 素材など：工房での使い道（売る前に、まだ使うものか分かるように）
      var uses = NS.DexScene.itemUses(this.game, item.id, { reveal: true });
      if (uses.length > 0) {
        lines.push({});
        lines.push({ text: texts.usedInLabel || "", heading: true });
        for (i = 0; i < uses.length; i++) lines.push(uses[i]);
      }
    }

    return {
      head: { icon: item.icon, name: item.name, chips: chipLabel ? [{ label: chipLabel, color: category.color }] : [], sub: sub },
      lines: lines
    };
  };

  /**
   * 仲間1体が、その装備を着けたらどう変わるか。
   * 枠が埋まっていれば、いちばん古いものと入れ替える（Game.equipItem と同じ決まり）。
   * 能力の行：「攻撃+4 防御-1」。上がるだけなら緑・下がるだけなら赤・両方なら黄。
   */
  ShopScene.prototype._pushCompare = function (lines, member, item) {
    var data = this.game.data;
    var texts = this.texts;
    var t = this.theme;
    var species = member.getSpecies ? member.getSpecies() : null;
    var row = { sprite: species ? species.sprite : null, text: member.getName() + "  Lv" + member.level };
    var worn = (member.equipment || []).slice();

    if (worn.indexOf(item.id) >= 0) {
      row.right = texts.compareWorn || "";
      row.rightColor = t.hintColor;
      lines.push(row);
      return;
    }

    var slot = NS.EffectSystem.slotOf(item);
    var capacity = NS.EffectSystem.slotCapacity(data, slot);
    if (capacity <= 0) {
      row.right = texts.compareNoSlot || "";
      row.rightColor = t.hintColor;
      lines.push(row);
      return;
    }

    var replaced = null;
    var inSlot = worn.filter(function (id) {
      var it = data.getItem(id);
      return it && it.equip && NS.EffectSystem.slotOf(it) === slot;
    });
    if (inSlot.length >= capacity) {
      replaced = inSlot[0];
      worn.splice(worn.indexOf(replaced), 1);
    }
    worn.push(item.id);

    var changes = this._statChanges(member, worn).filter(function (c) { return c.after !== c.before; });
    if (changes.length === 0) {
      row.right = texts.compareNone || "";
      row.rightColor = t.hintColor;
    } else {
      // 上がる能力は緑、下がる能力は赤。1つずつ色を分ける
      // （2026-11-12 作者「＋とーの色表記の間違い。どちらかに依存してしまっている」。前は行ごと1色だった）
      var upColor = t.hpBarHigh || "#5fd18c";
      var downColor = t.hpBarLow || "#e8542a";
      row.rightParts = changes.map(function (c) {
        var d = c.after - c.before;
        return { text: c.label + (d > 0 ? "+" : "") + d, color: d > 0 ? upColor : downColor };
      });
      row.right = row.rightParts.map(function (p) { return p.text; }).join(" ");
    }
    lines.push(row);

    if (replaced) {
      var old = data.getItem(replaced) || {};
      lines.push({ indent: 24, icon: old.icon, text: fill(texts.compareSwap, { name: old.name || replaced }), dim: true });
    }
  };

  /**
   * 装備を一時的に差し替えて、能力の前と後を比べる（仲間の画面の _statChanges と同じやり方）。
   * 必ず元へ戻す。能力は呼ぶたびに計算されるので、持ち主の状態は変わらない
   */
  ShopScene.prototype._statChanges = function (monster, equipment) {
    var party = (this.game.data.messages || {}).party || {};
    var stats = [
      { label: "HP", read: function (m) { return m.getMaxHp(); } },
      { label: party.attackLabel || "攻撃",  read: function (m) { return m.getAttack(); } },
      { label: party.defenseLabel || "防御", read: function (m) { return m.getDefense(); } },
      { label: party.speedLabel || "素早さ", read: function (m) { return m.getSpeed(); } },
      { label: "PP", read: function (m) { return m.getMaxPp(); } }
    ];
    var before = stats.map(function (st) { return st.read(monster); });
    var original = monster.equipment;
    monster.equipment = equipment;
    var result = [];
    try {
      for (var i = 0; i < stats.length; i++) {
        result.push({ label: stats[i].label, before: before[i], after: stats[i].read(monster) });
      }
    } finally {
      monster.equipment = original;
    }
    return result;
  };

  /**
   * 謎の商人の加護。買う前は値段、買ったあとは「所持」と、いま選択肢に入っているか
   * （上限があるので、買ったのに出てこない加護がありうる）。
   */
  ShopScene.prototype._buildBlessingDetail = function (blessingId) {
    var blessing = (this.game.data.blessings || {})[blessingId];
    if (!blessing) return null;

    var texts = this.texts;
    var t = this.theme;
    var rect = this.layout.detail || {};
    var owned = this.game.hasBoughtBlessing(blessingId);
    var chips = [];
    if (NS.BlessingSystem && NS.BlessingSystem.getRarity) {
      var rarity = NS.BlessingSystem.getRarity(this.game.data, blessing);
      if (rarity) chips.push({ label: (((this.game.data.messages || {}).dex || {}).rarityLabel || "") + rarity.label, color: rarity.color || t.subTextColor });
    }

    var lines = [];
    var desc = wrapText(blessing.description || "", rect.charsPerLine || 26);
    for (var i = 0; i < desc.length; i++) lines.push({ text: desc[i] });
    var effects = blessing.effects || [];
    if (effects.length > 0) {
      lines.push({});
      lines.push({ text: texts.effectLabel || "", heading: true });
      for (var k = 0; k < effects.length; k++) {
        var text = NS.EffectSystem.describeEffect(effects[k], this.game.data);
        if (text) lines.push({ text: "・" + text });
      }
    }
    if (owned) {
      lines.push({});
      lines.push({ text: this.game.isBlessingActive(blessingId) ? (texts.blessingActive || "") : (texts.blessingInactive || ""), dim: true });
    }

    return {
      head: {
        icon: "iconBlessing", name: blessing.name, chips: chips,
        sub: owned ? (texts.blessingOwned || "") : fill(texts.blessingPrice, { price: blessing.price || 0 }),
        subColor: owned ? t.subTextColor : t.cursorColor
      },
      lines: lines
    };
  };

  /** 装備の効果1つを文章にする（組み立ては EffectSystem に任せる） */
  ShopScene.prototype._describeEffect = function (effect) {
    return NS.EffectSystem.describeEffect(effect, this.game.data);
  };

  ShopScene.prototype._renderNotice = function () {
    if (!this.notice.isActive()) return;
    var pos = this.layout.notice || { x: 400, y: 530 };

    var ctx = this.game.ctx;
    ctx.save();
    ctx.globalAlpha = this.notice.getAlpha();
    this.panel.drawText(this.notice.getText(), pos.x, pos.y,
      { align: "center", color: this.theme.cursorColor });
    ctx.restore();
  };

  ShopScene.prototype._renderHint = function () {
    var pos = this.layout.hint || { x: 48, y: 570 };
    var hint;

    if (this.phase === "quantity") hint = this.texts.hintQuantity;
    else if (this.phase === "confirm") hint = this.texts.hintConfirm;
    // 店が1軒しか開いていないときに「店を変える」と書いても混乱するだけ
    else if (this.shops.length > 1) hint = this.texts.hintShops || this.texts.hint;
    else hint = this.texts.hint;
    if (this.phase === "list") {
      hint = fill(hint || "", { extra: (this.filters && this.filters.length > 1) ? (this.texts.hintFilter || "") : "" });
    }

    this.panel.drawText(hint || "", pos.x, pos.y,
      { font: this.theme.smallFont, color: this.theme.hintColor });
  };

  /** テンプレートの {key} を置き換える */
  function fill(template, values) {
    if (!template) return "";
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return (values[key] !== undefined) ? values[key] : match;
    });
  }

  /** 文字数で折り返す（等幅フォント前提の簡易処理） */
  // 折り返しは共通（js/namespace.js の MyGame.wrapText。行の頭に句読点を置かない）
  function wrapText(text, charsPerLine) {
    return NS.wrapText(text, charsPerLine);
  }

  /**
   * 連れている仲間ごとの「その装備をつけたら」の行（お店と同じもの）。持ち物の画面でも使う
   * @returns {object[]} DetailPane の行
   */
  ShopScene.compareLines = function (game, item) {
    var view = Object.create(ShopScene.prototype);
    view.game = game;
    view.texts = (game.data.messages || {}).shop || {};
    view.theme = (game.data.ui || {}).theme || {};
    var members = (game.party && game.party.getMembers) ? game.party.getMembers() : [];
    var lines = [];
    for (var i = 0; i < members.length; i++) view._pushCompare(lines, members[i], item);
    return lines;
  };

  NS.ShopScene = ShopScene;
})(window.MyGame);
