/**
 * BlessingSelectScene.js
 * 拠点の「加護を選ぶ」。潜ったときに選択肢へ出る加護を決める。
 *
 * 持っている加護を一覧にして、1つずつ「入れる／外す」を切り替えるだけの画面。
 * 入れておける数には上限があり（data/run.js の blessing.activeMax）、
 * いっぱいのときは、どれかを外さないと新しいものを入れられない。
 *
 * 何を持っているか・入れているかは Game が持ち、この画面は表示と入力だけを担当する。
 * 配置は data/ui.js の blessingSelect、文言は data/messages.js の blessingSelect。
 *
 * ▼ 操作
 *   ↑↓   … 加護を選ぶ
 *   決定   … 入れる／外すを切り替える（行を押しても同じ）
 *   F      … 絞り込み（すべて → 等級ごと → 入れているもの → 外しているもの。右上の札を押しても変わる）
 *   Q/E・ホイール・バー … 右の説明を送る
 *   Esc    … 拠点へ戻る
 *
 * ▼ v1.4.0（2026-11-12 作者「使いやすさを求めましょう…等級ごとに絞り込みできるように」）
 *   一覧は等級ごとに見出しを挟み、その中で入れているものを先に並べる。
 *   右は共通の部品 NS.DetailPane：絵・名前・等級の札・入れているか／説明／効果／等級ごとの編成（0個の等級は赤）
 */
(function (NS) {
  "use strict";

  var NOTICE_DURATION = 1800;

  /**
   * @param {MyGame.Game} game
   * @param {object} returnScene 閉じたときに戻るシーン
   */
  function BlessingSelectScene(game, returnScene) {
    this.game = game;
    this.returnScene = returnScene;

    var ui = game.data.ui || {};
    this.theme = ui.theme || {};
    this.layout = ui.blessingSelect || {};
    this.texts = (game.data.messages || {}).blessingSelect || {};

    this.panel = new NS.Panel(game.ctx, this.theme);
    this.sprites = new NS.SpriteRenderer(game.ctx, game.assets);
    this.list = new NS.ScrollList(this.panel, this.layout.list, { sprites: this.sprites });
    this.pane = new NS.DetailPane(this.panel, this.sprites, this.layout.detail || { x: 0, y: 0, w: 0, h: 0 });
    this.backButton = new NS.BackButton(this.panel, game.data);
    this.notice = new NS.Notice(this.theme.notice);

    this._rebuildList();
  }

  BlessingSelectScene.prototype.enter = function () {
    this.notice.clear();
    this._rebuildList();
  };

  // --- 一覧の組み立て ---

  // --- 絞り込み（v1.4.0） ---

  /** 等級の表（data/run.js の blessing.rarityTiers） */
  BlessingSelectScene.prototype._tiers = function () {
    return (((this.game.data.run || {}).blessing) || {}).rarityTiers || [];
  };

  /** その加護の等級の番号（rarityTiers の何番目か） */
  BlessingSelectScene.prototype._tierIndex = function (blessing) {
    var rarity = NS.BlessingSystem.getRarity(this.game.data, blessing);
    var tiers = this._tiers();
    for (var i = 0; i < tiers.length; i++) if (tiers[i].label === rarity.label) return i;
    return tiers.length;
  };

  /** 絞り込みの並び：all → tier:0〜 → on → off。1つも当てはまらない等級は飛ばす */
  BlessingSelectScene.prototype._availableFilters = function () {
    var ids = this.game.getOwnedBlessingIds();
    var blessings = this.game.data.blessings || {};
    var present = {};
    for (var i = 0; i < ids.length; i++) {
      if (blessings[ids[i]]) present[this._tierIndex(blessings[ids[i]])] = true;
    }
    var filters = ["all"];
    for (var k = 0; k < this._tiers().length; k++) if (present[k]) filters.push("tier:" + k);
    filters.push("on", "off");
    return filters;
  };

  BlessingSelectScene.prototype._currentFilter = function () {
    var filters = this.filters || ["all"];
    return filters.indexOf(this.game.blessingFilter) >= 0 ? this.game.blessingFilter : "all";
  };

  BlessingSelectScene.prototype._matches = function (filter, id, blessing) {
    if (filter === "on") return this.game.isBlessingActive(id);
    if (filter === "off") return !this.game.isBlessingActive(id);
    if (filter.indexOf("tier:") === 0) return this._tierIndex(blessing) === Number(filter.slice(5));
    return true;
  };

  BlessingSelectScene.prototype._changeFilter = function () {
    var filters = this.filters || ["all"];
    var index = filters.indexOf(this._currentFilter());
    this.game.blessingFilter = filters[(index + 1) % filters.length];
    this.notice.clear();
    var keep = this.list.getSelected() ? this.list.getSelected().value : null;
    this._rebuildList();
    this._focus(keep);
  };

  BlessingSelectScene.prototype._filterName = function (filter) {
    var names = this.texts.filters || {};
    if (filter.indexOf("tier:") === 0) {
      var tier = this._tiers()[Number(filter.slice(5))];
      return tier ? tier.label : filter;
    }
    return names[filter] || filter;
  };

  // --- 一覧の組み立て ---

  /**
   * 持っている加護を、等級ごとに見出しを挟んで並べる（v1.4.0）。
   * 等級の中では入れているものを先に。入れているものは等級の色の ◆、外しているものは ◇ で、文字を少し薄く
   */
  BlessingSelectScene.prototype._rebuildList = function () {
    this.filters = this._availableFilters();
    var filter = this._currentFilter();
    var ids = this.game.getOwnedBlessingIds();
    var blessings = this.game.data.blessings || {};
    var tiers = this._tiers();
    var t = this.theme;
    var self = this;
    var rows = [];

    var groups = [];
    for (var g = 0; g <= tiers.length; g++) groups.push([]);
    for (var i = 0; i < ids.length; i++) {
      var blessing = blessings[ids[i]];
      if (!blessing || !this._matches(filter, ids[i], blessing)) continue;
      groups[this._tierIndex(blessing)].push(ids[i]);
    }

    for (var k = 0; k < groups.length; k++) {
      var list = groups[k];
      if (list.length === 0) continue;
      list.sort(function (a, b) {
        return (self.game.isBlessingActive(a) ? 0 : 1) - (self.game.isBlessingActive(b) ? 0 : 1);
      });
      var tier = tiers[k] || { label: "", color: t.subTextColor, rate: 0 };
      var activeCount = list.filter(function (id) { return self.game.isBlessingActive(id); }).length;
      rows.push({
        type: "header",
        label: fill(this.texts.tierHeader || "- {name} -", { name: tier.label, rate: Math.round((tier.rate || 0) * 100) }),
        right: fill(this.texts.tierHeaderRight || "", { on: activeCount, all: list.length }),
        color: tier.color || t.subTextColor
      });
      for (var r = 0; r < list.length; r++) {
        var active = this.game.isBlessingActive(list[r]);
        rows.push({
          type: "entry",
          label: (active ? (this.texts.markOn || "◆ ") : (this.texts.markOff || "◇ ")) + blessings[list[r]].name,
          right: active ? (this.texts.rowOn || "") : (this.texts.rowOff || ""),
          rightColor: active ? (tier.color || t.cursorColor) : t.hintColor,
          color: active ? t.textColor : t.subTextColor,
          value: list[r]
        });
      }
    }

    if (rows.length === 0) {
      rows.push({ type: "header", label: (filter === "all" ? this.texts.empty : this.texts.emptyFiltered) || "", color: t.hintColor });
    }
    this.list.setRows(rows);
  };

  /** いま選んでいる加護（無ければ null） */
  BlessingSelectScene.prototype._selected = function () {
    var row = this.list.getSelected();
    if (!row || !row.value) return null;
    return (this.game.data.blessings || {})[row.value] || null;
  };

  // --- 更新 ---

  BlessingSelectScene.prototype.update = function (dt) {
    var input = this.game.input;

    this.notice.update(dt);

    if (this.backButton.handleInput(input)) {
      this.game.scenes.change(this.returnScene);
      return;
    }

    // 右の説明（バー・ホイール・Q/E）。バーを触っている間はほかの操作を見ない
    this.pane.setContent(this._detailContent(), this._selectedKey());
    var paneResult = this.pane.handleInput(input);
    if (paneResult && paneResult.bar) return;
    if (input.isPressed("prevTab")) this.pane.scrollBy(-this.pane.keyRows());
    if (input.isPressed("nextTab")) this.pane.scrollBy(this.pane.keyRows());

    // 絞り込み（F・右上の札）
    if (input.isPressed("filter") || this._clickedFilterLabel(input)) { this._changeFilter(); return; }

    this.list.handleInput(input);

    if (input.isPressed("cancel")) {
      this.game.scenes.change(this.returnScene);
      return;
    }
    if (input.isPressed("confirm") || this.list.clickedEntry(input)) this._toggle();
  };

  BlessingSelectScene.prototype._clickedFilterLabel = function (input) {
    var pointer = input.getPointer ? input.getPointer() : null;
    return !!(pointer && pointer.clicked && this._filterRect && NS.Panel.containsPoint(this._filterRect, pointer));
  };

  /** 入れる／外すを切り替える。いっぱいのときは理由を出すだけ */
  BlessingSelectScene.prototype._toggle = function () {
    var row = this.list.getSelected();
    if (!row || !row.value) return;

    var blessing = (this.game.data.blessings || {})[row.value];
    var result = this.game.toggleBlessing(row.value);

    if (!result.changed) {
      this._showNotice(fill(this.texts[result.reason] || result.reason,
        { max: this.game.getBlessingActiveMax() }));
      this.game.playError();
      return;
    }

    this._showNotice(fill(result.active ? this.texts.turnedOn : this.texts.turnedOff,
      { name: blessing ? blessing.name : row.value }));

    // 並べ替えが入るので、選んでいた加護を追いかける
    var keep = row.value;
    this._rebuildList();
    this._focus(keep);
  };

  /** 指定の加護にカーソルを合わせる */
  BlessingSelectScene.prototype._focus = function (blessingId) {
    for (var i = 0; i < this.list.rows.length; i++) {
      if (this.list.rows[i].value === blessingId) {
        this.list.setIndex(i);
        return;
      }
    }
    // 絞り込みで一覧から消えたとき（「入れているもの」で外した など）は、元の位置に近い行へ
    var at = Math.min(this.list.index || 0, this.list.rows.length - 1);
    for (var d = 0; d < this.list.rows.length; d++) {
      if (this.list.rows[at + d] && this.list.rows[at + d].type === "entry") { this.list.setIndex(at + d); return; }
      if (this.list.rows[at - d] && this.list.rows[at - d].type === "entry") { this.list.setIndex(at - d); return; }
    }
  };

  BlessingSelectScene.prototype._showNotice = function (text) {
    this.notice.show(text, NOTICE_DURATION);
  };

  // --- 描画 ---

  BlessingSelectScene.prototype.render = function (ctx) {
    var w = this.game.canvas.width;
    var h = this.game.canvas.height;

    ctx.fillStyle = this.theme.background || "#0b1016";
    ctx.fillRect(0, 0, w, h);

    this._renderHeading();
    this._renderCount();
    this._renderFilterLabel();
    this.list.render(this.game.clock);
    this._renderDetail();
    this._renderHint();

    this._renderNotice();
    this.backButton.render();
  };

  /** 知らせ。工房・ショップと同じ出し方にそろえてある */
  BlessingSelectScene.prototype._renderNotice = function () {
    if (!this.notice.isActive()) return;
    var pos = this.layout.notice || { x: 400, y: 526 };

    var ctx = this.game.ctx;
    ctx.save();
    ctx.globalAlpha = this.notice.getAlpha();
    this.panel.drawText(this.notice.getText(), pos.x, pos.y,
      { align: "center", color: this.theme.cursorColor });
    ctx.restore();
  };

  BlessingSelectScene.prototype._renderHeading = function () {
    var title = this.layout.title || {};
    var subtitle = this.layout.subtitle || {};

    this.panel.drawText(this.texts.title || "", title.x, title.y,
      { font: title.font, color: title.color });
    this.panel.drawText(this.texts.subtitle || "", subtitle.x, subtitle.y,
      { font: subtitle.font, color: subtitle.color });
  };

  /** 右上に「入れている数 / 上限」を出す。上限に達していたら色を変える */
  BlessingSelectScene.prototype._renderCount = function () {
    var pos = this.layout.count;
    if (!pos) return;

    var active = this.game.countActiveBlessings();
    var max = this.game.getBlessingActiveMax();
    var full = (active >= max);

    this.panel.drawText(fill(this.texts.count, { active: active, max: max }), pos.x, pos.y,
      { align: "right", font: pos.font || this.theme.font,
        color: full ? (this.theme.cursorColor || "#ffd75e") : (pos.color || this.theme.textColor) });
  };

  /** 一覧の右上の絞り込みの札（「≡ 等級：まれ」）。押すと次に変わる */
  BlessingSelectScene.prototype._renderFilterLabel = function () {
    this._filterRect = null;
    var pos = this.layout.filter;
    if (!pos) return;
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

  BlessingSelectScene.prototype._selectedKey = function () {
    var row = this.list.getSelected();
    return (row && row.value) ? row.value : null;
  };

  /** 右側：選んでいる加護の説明（DetailPane）。何も選べないときも等級ごとの編成は出す */
  BlessingSelectScene.prototype._renderDetail = function () {
    if (!this.layout.detail) return;
    this.pane.setContent(this._detailContent(), this._selectedKey());
    this.pane.render(this.texts.empty || "");
  };

  BlessingSelectScene.prototype._detailContent = function () {
    var t = this.theme;
    var data = this.game.data;
    var texts = this.texts;
    var rect = this.layout.detail || {};
    var lines = [];
    var i;
    var blessing = this._selected();
    var head = null;

    if (blessing) {
      var id = this._selectedKey();
      var rarity = NS.BlessingSystem.getRarity(data, blessing);
      var active = this.game.isBlessingActive(id);
      head = {
        icon: "iconBlessing", name: blessing.name,
        chips: [{ label: (texts.rarityLabel || "") + " " + rarity.label, color: rarity.color || t.subTextColor }],
        sub: active ? (texts.stateOn || "") : (texts.stateOff || ""),
        subColor: active ? (t.cursorColor || "#ffd75e") : t.hintColor
      };
      var desc = wrapText(blessing.description || "", rect.charsPerLine || 26);
      for (i = 0; i < desc.length; i++) lines.push({ text: desc[i] });
      var effects = blessing.effects || [];
      if (effects.length > 0) {
        lines.push({});
        lines.push({ heading: true, text: texts.effectLabel || "" });
        for (i = 0; i < effects.length; i++) {
          var text = NS.EffectSystem.describeEffect(effects[i], data);
          if (text) lines.push({ text: "・" + text });
        }
      }
      lines.push({});
    }

    // 等級ごとの編成（いちばん大事な情報。0個の等級は、選択肢の枠が空のまま出てこない）
    var tiers = this._tiers();
    var counts = this._countByTier(tiers);
    lines.push({ heading: true, text: texts.tierLabel || "",
                 right: fill(texts.count, { active: this.game.countActiveBlessings(), max: this.game.getBlessingActiveMax() }),
                 rightColor: t.subTextColor });
    for (i = 0; i < tiers.length; i++) {
      var empty = (counts[i] === 0);
      lines.push({
        text: fill(texts.tierName || "{name}  {rate}%", { name: tiers[i].label, rate: Math.round((tiers[i].rate || 0) * 100) }),
        color: tiers[i].color || t.textColor,
        right: fill(texts.tierCount || "{count}個", { count: counts[i] }),
        rightColor: empty ? (t.hpBarLow || "#e8542a") : t.textColor
      });
    }
    if (counts.indexOf(0) >= 0) {
      var note = wrapText(texts.tierEmptyNote || "", rect.charsPerLine || 26);
      for (i = 0; i < note.length; i++) lines.push({ text: note[i], color: t.hpBarLow || "#e8542a" });
    }
    return { head: head, lines: lines };
  };

  /** 等級ごとに、いま選択肢に入れている数を数える */
  BlessingSelectScene.prototype._countByTier = function (tiers) {
    var counts = [];
    var i;
    for (i = 0; i < tiers.length; i++) counts.push(0);

    var ids = this.game.getOwnedBlessingIds();
    for (i = 0; i < ids.length; i++) {
      if (!this.game.isBlessingActive(ids[i])) continue;

      var blessing = (this.game.data.blessings || {})[ids[i]];
      var rarity = NS.BlessingSystem.getRarity(this.game.data, blessing);
      for (var k = 0; k < tiers.length; k++) {
        if (tiers[k].label === rarity.label) { counts[k]++; break; }
      }
    }
    return counts;
  };

  BlessingSelectScene.prototype._renderHint = function () {
    var pos = this.layout.hint;
    if (!pos) return;

    this.panel.drawText(fill(this.texts.hint || "", { extra: this.pane.canScroll() ? (this.texts.hintScroll || "") : "" }), pos.x, pos.y,
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

  NS.BlessingSelectScene = BlessingSelectScene;
})(window.MyGame);
