/**
 * CraftScene.js
 * 拠点の工房。素材とゴールドから、道具や装備を作る。
 *
 * 作れるかどうかの判断はすべて CraftSystem が行い、この画面は表示と入力だけを担当する。
 * 配置は data/ui.js の craft、文言は data/messages.js の craft で管理する。
 *
 * ▼ 操作
 *   ↑↓   … 作るものを選ぶ
 *   ←→/F … 絞り込み（すべて・作れるもの・道具・武器・防具・アクセサリー。2026-11-09）
 *   Q/E・右の上でホイール・右のバー … 右の説明を送る（入りきらないときだけ。v1.4.0）
 *   C・「▶ 手に入る場所」を押す … 足りない素材の手に入る場所を開く／閉じる（v1.4.0）
 *   決定   … 「作りますか?」のはい／いいえへ
 *
 * ▼ 右の説明（v1.4.0）
 *   上の欄（絵・名前・分類の札・所持数）は動かさず、その下の行だけを送る。
 *   行は 説明 → 効果（装備） → 必要な素材 → 費用。足りない素材の下には「▶ 手に入る場所」の行があり、
 *   開くと図鑑のアイテムのページと同じ中身を並べる（DexScene.itemSources。伏せ方も同じ）。
 *   はじめは閉じている（作者 2026-11-12「任意でプレイヤーが開けるように」）。
 *   開いた素材は game.craftOpenSources に覚え、工房を閉じても残る（セーブはしない。絞り込みと同じ）
 *   Esc    … 1つ前へ戻る（一覧なら拠点へ）
 */
(function (NS) {
  "use strict";

  var NOTICE_DURATION = 1800;

  /**
   * @param {MyGame.Game} game
   * @param {object} returnScene 閉じたときに戻るシーン
   */
  function CraftScene(game, returnScene) {
    this.game = game;
    this.returnScene = returnScene;

    var ui = game.data.ui || {};
    this.theme = ui.theme || {};
    this.layout = ui.craft || {};
    this.texts = (game.data.messages || {}).craft || {};

    this.panel = new NS.Panel(game.ctx, this.theme);
    this.renderer = new NS.Renderer(game.ctx);
    // アイテムの絵を一覧の名前の左に出す
    this.sprites = new NS.SpriteRenderer(game.ctx, game.assets);
    this.list = new NS.ScrollList(this.panel, this.layout.list, { sprites: this.sprites });
    this.confirmMenu = new NS.CommandMenu(this.panel, this.layout.confirmMenu);
    this.backButton = new NS.BackButton(this.panel, game.data);
    this.craftSystem = new NS.CraftSystem(game.data);

    this.phase = "list";   // "list" | "confirm"
    this.notice = new NS.Notice(this.theme.notice);
    // 右の説明欄（共通の部品 NS.DetailPane。js/ui/Panel.js）
    this.pane = new NS.DetailPane(this.panel, this.sprites, this.layout.detail || { x: 0, y: 0, w: 0, h: 0 });
    this._detailRecipe = null;  // 右に出しているレシピ（変わったら作り直す）
    this._detailCache = null;   // 右の中身（一覧を作り直したら作り直す）

    this._rebuildList();
  }

  CraftScene.prototype.enter = function () {
    // 工房の曲。拠点へ戻ると拠点の曲に戻る（HomeScene.enter）
    this.game.audio.playBgm("craft");

    this.phase = "list";
    this.notice.clear();
    this._rebuildList();
  };

  // --- 一覧の組み立て ---

  /**
   * 作れるものの一覧。できあがるものの分類（回復 → 装備 → …）で見出しを挟み、
   * 装備はさらに武器・防具・アクセサリーで分ける（持ち物・図鑑と同じ見せ方）。
   * 同じ見出しの中では data/recipes.js の order の順。
   */
  CraftScene.prototype._rebuildList = function () {
    var recipes = this.craftSystem.getRecipes(this.game.clearedDungeons);
    var data = this.game.data;
    var t = this.theme;
    var categories = (data.categories || {}).item || {};
    var slotDefs = (data.categories || {}).equipSlot || {};

    // 絞り込みの候補は、いま並んでいるレシピから決める（武器のレシピがまだ無ければ「武器」は出さない）
    this.filters = this._availableFilters(recipes);
    var filter = this._currentFilter();

    // 見出しごとにまとめる（分類 → 装備の枠）
    var groups = {};
    for (var i = 0; i < recipes.length; i++) {
      var item = data.getItem(recipes[i].result.item);
      if (!item) continue;
      var ready = this.craftSystem.canCraft(this.game, recipes[i]).ok;
      if (!matchesFilter(filter, item, ready)) continue;
      var categoryId = item.category || "other";
      var slot = item.equip ? NS.EffectSystem.slotOf(item) : null;
      var key = categoryId + (slot ? "/" + slot : "");
      if (!groups[key]) {
        groups[key] = { categoryId: categoryId, slot: slot, entries: [],
          order: ((categories[categoryId] || {}).order || 999) * 10
               + ((slot && slotDefs[slot]) ? slotDefs[slot].order : 0) };
      }
      groups[key].entries.push({ recipe: recipes[i], item: item, ready: ready });
    }

    var ordered = Object.keys(groups).sort(function (a, b) { return groups[a].order - groups[b].order; });
    var rows = [];
    var lastCategory = null;

    for (var g = 0; g < ordered.length; g++) {
      var group = groups[ordered[g]];
      var category = categories[group.categoryId] || { name: group.categoryId };

      if (group.categoryId !== lastCategory) {
        rows.push({ type: "header", label: "- " + category.name + " -", color: category.color });
        lastCategory = group.categoryId;
      }
      if (group.slot) {
        rows.push({ type: "header", label: "  " + NS.EffectSystem.slotNameOf(group.slot, data),
                    color: (slotDefs[group.slot] && slotDefs[group.slot].color) || category.color });
      }

      for (var e = 0; e < group.entries.length; e++) {
        var recipe = group.entries[e].recipe;
        var ready = group.entries[e].ready;
        rows.push({
          type: "entry",
          label: group.entries[e].item.name,
          icon: group.entries[e].item.icon,
          // 費用が要るレシピだけ右側に金額を出す
          right: (recipe.gold || 0) > 0 ? (recipe.gold + "G") : "",
          // 作れないものは薄く表示する
          color: ready ? t.textColor : t.hintColor,
          value: recipe
        });
      }
    }
    this.list.setRows(rows);
    // 作ったあとは素材の数が変わるので、右の中身も作り直す
    this._detailCache = null;
  };

  // --- 絞り込み（2026-11-09 作者の依頼） ---

  /**
   * 絞り込みの並び。F（または ←→・札を押す）で切り替える。
   * 選んだものは工房を閉じても覚えておく（game.craftFilter。セーブはしない。図鑑の並べ方と同じ）
   *   all … すべて  ready … いま作れるものだけ  use … 装備でないもの（回復・道具）
   *   weapon / armor / accessory … 装備の枠
   */
  var FILTERS = ["all", "ready", "use", "weapon", "armor", "accessory"];

  function matchesFilter(filter, item, ready) {
    switch (filter) {
      case "ready": return ready;
      case "use":   return !item.equip;
      case "weapon":
      case "armor":
      case "accessory":
        return !!item.equip && NS.EffectSystem.slotOf(item) === filter;
      default:      return true;
    }
  }

  /** いまのレシピで1つも当てはまらない分類は候補から外す（「すべて」「作れるもの」はいつも出す） */
  CraftScene.prototype._availableFilters = function (recipes) {
    var data = this.game.data;
    return FILTERS.filter(function (filter) {
      if (filter === "all" || filter === "ready") return true;
      for (var i = 0; i < recipes.length; i++) {
        var item = data.getItem(recipes[i].result.item);
        if (item && matchesFilter(filter, item, true)) return true;
      }
      return false;
    });
  };

  CraftScene.prototype._currentFilter = function () {
    var filters = this.filters || FILTERS;
    var filter = this.game.craftFilter;
    return filters.indexOf(filter) >= 0 ? filter : filters[0];
  };

  CraftScene.prototype._changeFilter = function (direction) {
    var filters = this.filters || FILTERS;
    var index = filters.indexOf(this._currentFilter());
    this.game.craftFilter = filters[(index + direction + filters.length) % filters.length];
    this._rebuildList();   // 選択は一覧の先頭に戻る（ScrollList.setRows）
  };

  /** 絞り込みの札の当たり判定（描いたときに覚える） */
  CraftScene.prototype._clickedFilterLabel = function (input) {
    var pointer = input.getPointer ? input.getPointer() : null;
    return !!(pointer && pointer.clicked && this._filterRect && NS.Panel.containsPoint(this._filterRect, pointer));
  };

  CraftScene.prototype._selectedRecipe = function () {
    var selected = this.list.getSelected();
    return selected ? selected.value : null;
  };

  // --- 更新 ---

  CraftScene.prototype.update = function (dt) {
    var input = this.game.input;

    this.notice.update(dt);

    // 「戻る」ボタン。確認の途中なら一覧へ戻す
    if (this.backButton.handleInput(input)) {
      if (this.phase === "confirm") this.phase = "list";
      else this.game.scenes.change(this.returnScene);
      return;
    }

    if (this.phase === "confirm") { this._updateConfirm(input); return; }

    // 絞り込み：F・←→・札を押す
    if (input.isPressed("filter") || input.isPressed("right")) { this._changeFilter(1); return; }
    if (input.isPressed("left")) { this._changeFilter(-1); return; }
    if (this._clickedFilterLabel(input)) { this._changeFilter(1); return; }

    // 右の説明欄：バー・ホイール・押せる行（「▶ 手に入る場所」）。バーを触っている間はほかの操作を見ない
    this._detailContent();
    var paneResult = this.pane.handleInput(input);
    if (paneResult && paneResult.bar) return;
    if (paneResult && paneResult.toggle) { this._toggleSource(paneResult.toggle); return; }

    // 手に入る場所を開く／閉じる：C（いまのレシピの足りない素材をまとめて）
    if (input.isPressed("menu")) { this._toggleAllSources(); return; }

    // 右の説明を送る：Q/E（v1.4.0）
    if (input.isPressed("prevTab")) this.pane.scrollBy(-this.pane.keyRows());
    if (input.isPressed("nextTab")) this.pane.scrollBy(this.pane.keyRows());

    // ScrollList が扱うのは上下移動だけ。決定・取消はここで見る
    this.list.handleInput(input);

    if (input.isPressed("cancel")) {
      this.game.scenes.change(this.returnScene);
      return;
    }
    // マウスで行を押した場合も決定と同じ扱いにする
    if (input.isPressed("confirm") || this.list.clickedEntry(input)) this._onConfirm();
  };

  CraftScene.prototype._onConfirm = function () {
    var recipe = this._selectedRecipe();
    if (!recipe) return;

    // 作れないなら理由を出すだけ（確認画面には入らない）
    var check = this.craftSystem.canCraft(this.game, recipe);
    if (!check.ok) {
      this._showNotice(this.texts[check.reason] || check.reason);
      this.game.playError();
      return;
    }

    this.confirmMenu.setItems([
      { label: this.texts.yes || "はい", value: "yes" },
      { label: this.texts.no || "いいえ", value: "no" }
    ]);
    this.phase = "confirm";
  };

  CraftScene.prototype._updateConfirm = function (input) {
    var result = this.confirmMenu.handleInput(input);
    if (!result) return;

    if (result.type === "cancel" || result.value === "no") {
      this.phase = "list";
      return;
    }
    if (result.value === "yes") this._craft();
  };

  CraftScene.prototype._craft = function () {
    var recipe = this._selectedRecipe();
    if (!recipe) return;

    var item = this.game.data.getItem(recipe.result.item);
    var result = this.craftSystem.craft(this.game, recipe);

    this._showNotice(result.success
      ? fill(this.texts.crafted, { name: item.name, count: result.count })
      : (this.texts[result.reason] || result.reason));
    if (result.success) this.game.audio.playSe("itemGet");
    else this.game.playError();

    this.phase = "list";

    // 素材と所持金が変わるので一覧を作り直す（カーソル位置は保つ）。
    // 「作れるもの」で絞っていると行が減るので、見出しに当たったら先頭のまま
    var index = this.list.index;
    this._rebuildList();
    var row = this.list.rows[index];
    if (row && row.type === "entry") this.list.setIndex(index);
  };

  CraftScene.prototype._showNotice = function (text) {
    this.notice.show(text, NOTICE_DURATION);
  };

  // --- 描画 ---

  CraftScene.prototype.render = function (ctx) {
    var w = this.game.canvas.width;
    var h = this.game.canvas.height;

    this.renderer.clear(this.layout.background || "#000000", w, h);

    this._renderHeading();
    this._renderGold();
    this._renderFilterLabel();
    this.list.render(this.game.clock);
    this._renderDetail();

    if (this.phase === "confirm") this.confirmMenu.render(this.game.clock);

    this._renderNotice();
    this._renderHint();
    this.backButton.render();
  };

  CraftScene.prototype._renderHeading = function () {
    var title = this.layout.title || {};
    var subtitle = this.layout.subtitle || {};

    this.panel.drawText(this.texts.title || "", title.x, title.y,
      { font: title.font, color: title.color });
    this.panel.drawText(this.texts.subtitle || "", subtitle.x, subtitle.y,
      { font: subtitle.font, color: subtitle.color });
  };

  CraftScene.prototype._renderGold = function () {
    var pos = this.layout.gold;
    if (!pos) return;

    var template = ((this.game.data.messages || {}).home || {}).gold || "{amount}G";
    this.panel.drawText(template.replace("{amount}", this.game.gold || 0), pos.x, pos.y,
      { align: "right", font: pos.font || this.theme.font,
        color: pos.color || this.theme.cursorColor });
  };

  /** 一覧の右上の絞り込みの札（「絞り込み：すべて　F」）。右端を一覧の右端にそろえる。押すと次に変わる */
  CraftScene.prototype._renderFilterLabel = function () {
    this._filterRect = null;
    var pos = this.layout.filter;
    if (!pos) return;
    var t = this.theme;
    var names = this.texts.filters || {};
    var filter = this._currentFilter();
    var text = (this.texts.filterLabel || "{name}").replace("{name}", names[filter] || filter);
    var ctx = this.panel.ctx;
    ctx.save();
    ctx.font = t.smallFont || "12px monospace";
    var w = ctx.measureText(text).width;
    ctx.restore();
    var x = pos.right - w;
    this._filterRect = { x: x - 6, y: pos.y - 15, w: w + 12, h: 20 };
    ctx.fillStyle = pos.background || "rgba(74,107,168,0.25)";
    ctx.fillRect(this._filterRect.x, this._filterRect.y, this._filterRect.w, this._filterRect.h);
    this.panel.drawText(text, x, pos.y, { font: t.smallFont, color: t.cursorColor });
  };

  // --- 右の説明（v1.4.0） ---

  /** 選んでいるレシピの説明。{ head, lines }。レシピが変わったら送りを先頭に戻す */
  CraftScene.prototype._detailContent = function () {
    var recipe = this._selectedRecipe();
    if (recipe !== this._detailRecipe) {
      this._detailRecipe = recipe;
      this._detailCache = null;
    }
    if (recipe && !this._detailCache) this._detailCache = this._buildDetail(recipe);
    var content = recipe ? this._detailCache : null;
    this.pane.setContent(content, recipe);
    return content;
  };

  /**
   * 右の中身を作る。行の形は図鑑の右のページと同じ
   * （{ text, heading, dim, icon, sprite, unknownSprite, right, rightColor, indent }）
   */
  CraftScene.prototype._buildDetail = function (recipe) {
    var game = this.game;
    var data = game.data;
    var t = this.theme;
    var texts = this.texts;
    var rect = this.layout.detail || {};
    var red = t.hpBarLow || "#e8542a";
    var item = data.getItem(recipe.result.item) || {};
    var count = recipe.result.count || 1;
    var lines = [];
    var i;

    // 上の欄
    var category = ((data.categories || {}).item || {})[item.category] || { name: item.category || "" };
    var chipLabel = category.name + (item.equip ? "・" + NS.EffectSystem.slotName(item, data) : "");
    var owned = game.inventory ? game.inventory.getCount(item.id) : 0;
    var head = {
      icon: item.icon,
      name: (item.name || "") + (count > 1 ? (" ×" + count) : ""),
      chips: chipLabel ? [{ label: chipLabel, color: category.color }] : [],
      sub: fill(texts.ownedLabel || "所持 {count}", { count: owned })
    };

    // できるものの説明
    var desc = wrapText(item.description || "", rect.charsPerLine || 26);
    for (i = 0; i < desc.length; i++) lines.push({ text: desc[i] });

    // 装備なら効果も
    if (item.equip) {
      lines.push({});
      lines.push({ text: texts.effectLabel || "", heading: true });
      var effects = item.equip.effects || [];
      for (i = 0; i < effects.length; i++) lines.push({ text: "・" + this._describeEffect(effects[i]) });
    }

    // 必要な素材。足りないものは数を赤くし、その下に手に入る場所を並べる
    lines.push({});
    lines.push({ text: texts.materialLabel || "", heading: true });
    var status = this.craftSystem.getMaterialStatus(game, recipe);
    for (i = 0; i < status.length; i++) {
      var material = status[i].item || {};
      lines.push({ icon: material.icon, text: material.name || "",
                   right: status[i].owned + "/" + status[i].need,
                   rightColor: status[i].enough ? null : red,
                   toggle: status[i].enough ? null : material.id });
      if (status[i].enough) continue;

      // 「▶ 手に入る場所」。押す（か C）と開く
      var open = !!this._openSources()[material.id];
      lines.push({ indent: 22, text: (open ? "▼ " : "▶ ") + (texts.sourcesLabel || ""),
                   color: open ? t.cursorColor : t.subTextColor, toggle: material.id });
      if (!open) continue;
      var sources = (NS.DexScene && NS.DexScene.itemSources) ? NS.DexScene.itemSources(game, material.id, { reveal: true }) : [];
      if (sources.length === 0) lines.push({ indent: 22, text: texts.sourceNone || "", dim: true });
      for (var k = 0; k < sources.length; k++) {
        var line = {};
        for (var key in sources[k]) {
          if (Object.prototype.hasOwnProperty.call(sources[k], key)) line[key] = sources[k][key];
        }
        line.indent = (line.indent || 0) + 22;
        lines.push(line);
      }
    }

    // 費用（無料のレシピでは行そのものを出さない）
    var gold = recipe.gold || 0;
    if (gold > 0) {
      lines.push({ text: texts.costLabel || "", right: gold + "G",
                   rightColor: game.canAfford(gold) ? null : red });
    }

    return { head: head, lines: lines };
  };

  /** 右の説明がどこまで送れるか（0 なら入りきっている） */
  CraftScene.prototype._maxDetailScroll = function () {
    if (!this.layout.detail) return 0;
    this._detailContent();
    return this.pane.maxScroll();
  };

  CraftScene.prototype._renderDetail = function () {
    if (!this.layout.detail) return;
    this._detailContent();
    // 絞り込んで何も残らなかったときは、そう書く（「まだ作れるものがない」と区別する）
    var emptyText = (this._currentFilter() !== "all" && this.texts.emptyFiltered) || this.texts.empty || "";
    this.pane.render(emptyText);
  };

  // --- 手に入る場所を開く／閉じる（v1.4.0） ---

  /** 開いている素材 { 素材のid: true }。工房を閉じても覚えておく（セーブはしない） */
  CraftScene.prototype._openSources = function () {
    if (!this.game.craftOpenSources) this.game.craftOpenSources = {};
    return this.game.craftOpenSources;
  };

  CraftScene.prototype._toggleSource = function (materialId) {
    var opened = this._openSources();
    if (opened[materialId]) delete opened[materialId];
    else opened[materialId] = true;
    this._detailCache = null;
  };

  /** いまのレシピの足りない素材を、1つでも閉じていればぜんぶ開く。ぜんぶ開いていればぜんぶ閉じる */
  CraftScene.prototype._toggleAllSources = function () {
    var recipe = this._selectedRecipe();
    if (!recipe) return;
    var missing = this.craftSystem.getMaterialStatus(this.game, recipe)
      .filter(function (st) { return !st.enough; })
      .map(function (st) { return st.item.id; });
    if (missing.length === 0) return;

    var opened = this._openSources();
    var allOpen = missing.every(function (id) { return opened[id]; });
    for (var i = 0; i < missing.length; i++) {
      if (allOpen) delete opened[missing[i]];
      else opened[missing[i]] = true;
    }
    this._detailCache = null;
  };

  /** いまのレシピに足りない素材があるか（下の案内に「C: 手に入る場所」を出すか） */
  CraftScene.prototype._hasMissing = function () {
    var recipe = this._selectedRecipe();
    if (!recipe) return false;
    return this.craftSystem.getMaterialStatus(this.game, recipe).some(function (st) { return !st.enough; });
  };

  /** 装備の効果1つを文章にする（組み立ては EffectSystem に任せる） */
  CraftScene.prototype._describeEffect = function (effect) {
    return NS.EffectSystem.describeEffect(effect, this.game.data);
  };

  CraftScene.prototype._renderNotice = function () {
    if (!this.notice.isActive()) return;
    var pos = this.layout.notice || { x: 400, y: 526 };

    var ctx = this.game.ctx;
    ctx.save();
    ctx.globalAlpha = this.notice.getAlpha();
    this.panel.drawText(this.notice.getText(), pos.x, pos.y,
      { align: "center", color: this.theme.cursorColor });
    ctx.restore();
  };

  CraftScene.prototype._renderHint = function () {
    var pos = this.layout.hint || { x: 48, y: 570 };
    var texts = this.texts;
    var hint;
    if (this.phase === "confirm") hint = texts.hintConfirm;
    else {
      // 足りない素材があれば「C: 手に入る場所」、入りきらなければ「Q/E: 送る」を足す
      var extra = (this._hasMissing() ? (texts.hintSources || "") : "")
                + (this._maxDetailScroll() > 0 ? (texts.hintScroll || "") : "");
      hint = fill(texts.hint || "", { extra: extra });
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

  NS.CraftScene = CraftScene;
})(window.MyGame);
