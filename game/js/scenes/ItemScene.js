/**
 * ItemScene.js
 * 持ち物画面。分類ごとに所持アイテムを並べ、選ぶと説明を表示する。
 * 使えるアイテムは、対象のモンスターを選んで使用できる。
 *
 * ▼ 状態（this.phase）
 *   "list"   … アイテムを選ぶ
 *   "target" … 使う相手（パーティ）を選ぶ。使ったあともその道具が残っていればここに留まり、
 *              続けて使える（2026-11-09 作者の依頼）。使い切るか Esc で一覧へ
 *
 * ▼ 右の説明（v1.4.0）
 *   共通の部品 NS.DetailPane（js/ui/Panel.js）。上の欄（絵・名前・分類・所持数と売値）は動かさず、
 *   その下を右のバー・Q/E・ホイールで送る。
 *   使う道具は「使うと」（何が起きるか）と使える所、装備は効果と「仲間がつけると」（お店と同じ）、
 *   素材は「使い道（工房）」。どれも最後に「▶ 手に入る場所」（押すか C で開く。工房と同じ）
 *
 * 配置は data/ui.js の items、文言は data/messages.js の items で管理する。
 */
(function (NS) {
  "use strict";

  var NOTICE_DURATION = 1600;

  /**
   * @param {MyGame.Game} game
   * @param {object} returnScene 閉じたときに戻るシーン
   * @param {string} [useScene] 使えるアイテムの場面id（data/items.js の usableIn と対応）
   *   拠点なら "home"、探索中なら "dungeon"。省略すると "home"
   * @param {function} [onEscape] 拠点へ帰るアイテムを使ったときに呼ばれる
   *   （どう帰るかは開いた側が決める。ここは「使えた」ことだけを伝える）
   */
  function ItemScene(game, returnScene, useScene, onEscape) {
    this.game = game;
    this.returnScene = returnScene;
    this.useScene = useScene || "home";
    this.onEscape = onEscape || null;

    var ui = game.data.ui || {};
    this.theme = ui.theme || {};
    this.layout = ui.items || {};
    this.texts = (game.data.messages || {}).items || {};

    this.panel = new NS.Panel(game.ctx, this.theme);
    this.hpBar = new NS.HpBar(game.ctx, this.theme);
    this.renderer = new NS.Renderer(game.ctx);
    // 使う相手の状態異常の印（仲間画面・戦闘と同じ絵）とアイテムの絵を描くのに使う
    this.sprites = new NS.SpriteRenderer(game.ctx, game.assets);
    this.list = new NS.ScrollList(this.panel, this.layout.list, { sprites: this.sprites });
    this.backButton = new NS.BackButton(this.panel, game.data);
    this.usage = new NS.ItemUsage(game.data);
    // 右の説明欄（v1.4.0）
    this.pane = new NS.DetailPane(this.panel, this.sprites, this.layout.detail || { x: 0, y: 0, w: 0, h: 0 });
    this._detailKey = null;
    this._detailCache = null;

    this.phase = "list";
    this.targetIndex = 0;
    this.notice = new NS.Notice(this.theme.notice);

    this._rebuildList();
  }

  ItemScene.prototype.enter = function () {
    this.phase = "list";
    this._rebuildList();
  };

  /**
   * 持ち物から一覧の行を組み立てる（分類ごとに見出しを挟む）。
   * 装備は「装備」の中で武器・防具・アクセサリーに分けて、小さい見出しを挟む
   * @param {string} [keepItemId] 作り直したあともカーソルを置いておく道具。
   *   使い切って無くなったら、そのとき居た位置にいちばん近い道具へ
   */
  ItemScene.prototype._rebuildList = function (keepItemId) {
    var oldIndex = this.list.index;
    this._buildRows();
    if (!keepItemId) return;

    var rows = this.list.rows;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].type === "entry" && rows[i].value === keepItemId) { this.list.setIndex(i); return; }
    }
    // 無くなった：前の位置から下へ、無ければ上へ、近い道具を探す
    for (var d = 0; d < rows.length; d++) {
      var down = oldIndex + d, up = oldIndex - d;
      if (rows[down] && rows[down].type === "entry") { this.list.setIndex(down); return; }
      if (rows[up] && rows[up].type === "entry") { this.list.setIndex(up); return; }
    }
  };

  ItemScene.prototype._buildRows = function () {
    // 使うと個数が変わるので、右の説明も作り直す
    this._detailCache = null;
    var inventory = this.game.inventory;
    var data = this.game.data;
    var slotDefs = (data.categories || {}).equipSlot || {};
    var rows = [];

    if (inventory) {
      var groups = inventory.groupByCategory();
      for (var g = 0; g < groups.length; g++) {
        var group = groups[g];
        rows.push({ type: "header", label: "- " + group.category.name + " -",
                    color: group.category.color });

        var slots = sortByEquipSlot(group.slots, data, slotDefs);
        var currentSub = null;
        for (var s = 0; s < slots.length; s++) {
          var slot = slots[s];
          var item = data.getItem(slot.itemId);

          var sub = (item && item.equip) ? NS.EffectSystem.slotOf(item) : null;
          if (sub && sub !== currentSub) {
            rows.push({ type: "header", label: "  " + NS.EffectSystem.slotNameOf(sub, data),
                        color: (slotDefs[sub] && slotDefs[sub].color) || group.category.color });
            currentSub = sub;
          }
          rows.push({
            type: "entry",
            label: item ? item.name : slot.itemId,
            icon: item ? item.icon : null,
            right: "x" + slot.count,
            value: slot.itemId
          });
        }
      }
    }
    this.list.setRows(rows);
  };

  /** 装備を枠の順（武器 → 防具 → アクセサリー）に並べ替える。装備でないものは元の順 */
  function sortByEquipSlot(slots, data, slotDefs) {
    var indexed = slots.map(function (slot, index) {
      var item = data.getItem(slot.itemId);
      var sub = (item && item.equip) ? NS.EffectSystem.slotOf(item) : null;
      var order = (sub && slotDefs[sub]) ? slotDefs[sub].order : -1;
      return { slot: slot, order: order, index: index };
    });
    indexed.sort(function (a, b) { return (a.order - b.order) || (a.index - b.index); });
    return indexed.map(function (x) { return x.slot; });
  }

  // --- 更新 ---

  ItemScene.prototype.update = function (dt) {
    this.notice.update(dt);

    if (this.phase === "target") this._updateTarget();
    else this._updateList();
  };

  ItemScene.prototype._updateList = function () {
    var input = this.game.input;
    if (this.backButton.handleInput(input)) {
      this.game.scenes.change(this.returnScene);
      return;
    }

    // 右の説明欄：バー・ホイール・「▶ 手に入る場所」。バーを触っている間はほかの操作を見ない（v1.4.0）
    this._detailContent();
    var paneResult = this.pane.handleInput(input);
    if (paneResult && paneResult.bar) return;
    if (paneResult && paneResult.toggle) { this._toggleSource(paneResult.toggle); return; }
    var current = this.list.getSelected();
    if (input.isPressed("menu") && current) { this._toggleSource(current.value); return; }
    if (input.isPressed("prevTab")) this.pane.scrollBy(-this.pane.keyRows());
    if (input.isPressed("nextTab")) this.pane.scrollBy(this.pane.keyRows());

    this.list.handleInput(input);

    if (input.isPressed("cancel")) {
      this.game.scenes.change(this.returnScene);
      return;
    }
    // マウスで行を押した場合も決定と同じ扱いにする
    if (input.isPressed("confirm") || this.list.clickedEntry(input)) this._beginUse();
  };

  /** 使えるアイテムなら対象選択へ進む */
  ItemScene.prototype._beginUse = function () {
    var selected = this.list.getSelected();
    if (!selected) return;

    if (!this.usage.isUsableIn(selected.value, this.useScene)) {
      this._showNotice(this.texts.cannotUse || "");
      this.game.playError();
      return;
    }

    // 帰還の石のように相手を選ばないものは、その場で使う
    if (!this.usage.needsTarget(selected.value)) {
      this._useWithoutTarget(selected.value);
      return;
    }

    this.targetIndex = 0;
    this.phase = "target";
  };

  /**
   * 相手を選ばずに使う。
   * 拠点へ帰るものは、使えたことを画面の持ち主（探索画面）へ伝える。
   */
  ItemScene.prototype._useWithoutTarget = function (itemId) {
    var escaping = this.usage.isEscape(itemId);
    var result = this.usage.use(itemId, null, this.game.inventory);

    if (!result.success) {
      this._showNotice(this.texts.cannotUse || "");
      this.game.playError();
      return;
    }

    if (escaping && this.onEscape) {
      this.game.audio.playSe("escape");
      this.onEscape();
      return;   // 画面が切り替わるので、この先は何もしない
    }

    this._showNotice((this.texts.usedAlone || "{item}").replace("{item}", result.itemName));
    this._rebuildList(itemId);
  };

  ItemScene.prototype._updateTarget = function () {
    var input = this.game.input;
    var party = this.game.party;
    var size = party ? party.size() : 0;

    if (size > 0) {
      if (input.isPressed("up")) this.targetIndex = (this.targetIndex - 1 + size) % size;
      if (input.isPressed("down")) this.targetIndex = (this.targetIndex + 1) % size;
    }

    if (input.isPressed("cancel")) {
      this.phase = "list";
      return;
    }
    if (input.isPressed("confirm")) this._useOnTarget();
  };

  ItemScene.prototype._useOnTarget = function () {
    var selected = this.list.getSelected();
    var target = this.game.party.get(this.targetIndex);
    if (!selected || !target) return;

    var result = this.usage.use(selected.value, target, this.game.inventory);

    if (result.success) {
      // 文は効果の種類ごとに違う（HP回復・PP回復・状態異常を治す）
      var used = this.texts.used || {};
      var template = used[result.effectType] || used.default || "";
      this._showNotice(template
        .replace("{name}", target.getName())
        .replace("{amount}", result.amount)
        .replace("{item}", result.itemName));
      // 回復の音（戦闘中と同じ。HP・PP・状態異常のどれでも）
      this.game.audio.playSe("heal");
    } else if (result.reason === "noEffect") {
      this._showNotice(this.texts.noEffect || "");
      this.game.playError();
    } else if (result.reason === "fainted") {
      this._showNotice((this.texts.targetFainted || "").replace("{name}", target.getName()));
      this.game.playError();
    } else if (result.reason === "notFainted") {
      // 蘇生の道具を、倒れていない仲間に使おうとした（v1.0.0）
      this._showNotice((this.texts.notFainted || "").replace("{name}", target.getName()));
      this.game.playError();
    } else {
      this._showNotice(this.texts.cannotUse || "");
      this.game.playError();
    }

    // 使って個数が変わるので一覧を作り直す（選んでいた道具の上にカーソルを残す）。
    // まだ残っていれば相手を選ぶところに留まり、同じ相手にも別の相手にも続けて使える（2026-11-09 作者の依頼）。
    // 使い切ったら一覧へ戻る
    var itemId = selected.value;
    this._rebuildList(itemId);
    var still = this.list.getSelected();
    if (!(still && still.value === itemId)) this.phase = "list";
  };

  ItemScene.prototype._showNotice = function (text) {
    this.notice.show(text, NOTICE_DURATION);
  };

  // --- 描画 ---

  ItemScene.prototype.render = function (ctx) {
    var w = this.game.canvas.width;
    var h = this.game.canvas.height;

    this.renderer.clear(this.layout.background || "#000000", w, h);
    this._renderHeading();

    if (this.list.hasEntries()) {
      this.list.render(this.game.clock);
    } else {
      this.panel.drawBox(this.layout.list);
      var origin = this.panel.innerOrigin(this.layout.list);
      this.panel.drawText(this.texts.empty || "", origin.x, origin.y + 24);
    }

    if (this.phase === "target") this._renderTargets();
    else this._renderDetail();

    this._renderNotice(ctx);
    this._renderHint();
    this.backButton.render();
  };

  ItemScene.prototype._renderHeading = function () {
    var L = this.layout;
    var title = L.title || {};
    var subtitle = L.subtitle || {};
    var inventory = this.game.inventory;

    this.panel.drawText(this.texts.title || "", title.x, title.y,
      { font: title.font, color: title.color });

    // 持っている種類数を副題の代わりに出す（種類数に上限は無い）
    var text = this.texts.subtitle || "";
    if (inventory && this.texts.slotsLabel) {
      text = this.texts.slotsLabel.replace("{used}", inventory.slotCount());
    }
    this.panel.drawText(text, subtitle.x, subtitle.y,
      { font: subtitle.font, color: subtitle.color });
  };

  /** 右側：選択中アイテムの説明（v1.4.0。枠・バーは DetailPane が描く） */
  ItemScene.prototype._renderDetail = function () {
    if (!this.layout.detail) return;
    this._detailContent();
    this.pane.render("");
  };

  /** 選んでいる道具の説明 { head, lines }。選ぶもの・個数・開け閉めが変わったら作り直す */
  ItemScene.prototype._detailContent = function () {
    var selected = this.list.getSelected();
    var key = selected ? selected.value : null;
    if (key !== this._detailKey) {
      this._detailKey = key;
      this._detailCache = null;
    }
    if (key && !this._detailCache) this._detailCache = this._buildDetail(key);
    var content = key ? this._detailCache : null;
    this.pane.setContent(content, key);
    return content;
  };

  ItemScene.prototype._buildDetail = function (itemId) {
    var game = this.game;
    var data = game.data;
    var item = data.getItem(itemId);
    if (!item) return null;

    var texts = this.texts;
    var t = this.theme;
    var rect = this.layout.detail || {};
    var lines = [];
    var i;

    var category = ((data.categories || {}).item || {})[item.category] || { name: item.category || "" };
    var chipLabel = category.name + (item.equip ? "・" + NS.EffectSystem.slotName(item, data) : "");
    var chips = chipLabel ? [{ label: chipLabel, color: category.color }] : [];
    var count = game.inventory ? game.inventory.getCount(item.id) : 0;
    var sub = fill(texts.ownedLabel || "所持 {count}", { count: count });
    var shop = NS.ShopSystem ? new NS.ShopSystem(data) : null;
    if (shop && shop.canSell(item)) sub += fill(texts.sellLabel || "　売値 {price}G", { price: shop.getSellPrice(item) });

    var desc = wrapText(item.description || "", rect.charsPerLine || 26);
    for (i = 0; i < desc.length; i++) lines.push({ text: desc[i] });

    // 使う道具：何が起きるか・どこで使えるか
    if (item.effect) {
      var effectText = this._describeUse(item.effect);
      if (effectText) {
        lines.push({});
        lines.push({ text: texts.useLabel || "", heading: true });
        lines.push({ text: "・" + effectText });
      }
      var scenes = item.usableIn || [];
      var names = texts.sceneNames || {};
      if (scenes.length > 0) {
        var where = scenes.map(function (sc) { return names[sc] || sc; }).join("・");
        var here = this.usage.isUsableIn(item.id, this.useScene);
        lines.push({ text: fill(texts.usableInLabel || "使える所：{where}", { where: where }),
                     right: here ? (texts.usableHere || "") : (texts.notUsableHere || ""),
                     rightColor: here ? (t.hpBarHigh || "#5fd18c") : t.hintColor });
      }
    }

    // 装備：効果と、連れている仲間がつけたときの変わり方（お店と同じ）
    if (item.equip) {
      lines.push({});
      lines.push({ text: texts.effectLabel || "", heading: true });
      var effects = item.equip.effects || [];
      for (i = 0; i < effects.length; i++) lines.push({ text: "・" + NS.EffectSystem.describeEffect(effects[i], data) });
      if (NS.ShopScene && NS.ShopScene.compareLines) {
        var compare = NS.ShopScene.compareLines(game, item);
        if (compare.length > 0) {
          lines.push({});
          lines.push({ text: texts.compareLabel || "", heading: true });
          for (i = 0; i < compare.length; i++) lines.push(compare[i]);
        }
      }
    }

    // 素材など：工房での使い道（いま並んでいるレシピ）
    if (!item.equip && !item.effect && NS.DexScene && NS.DexScene.itemUses) {
      var uses = NS.DexScene.itemUses(game, item.id, { reveal: true });
      if (uses.length > 0) {
        lines.push({});
        lines.push({ text: texts.usedInLabel || "", heading: true });
        for (i = 0; i < uses.length; i++) lines.push(uses[i]);
      }
    }

    // 手に入る場所（押すか C で開く。工房と同じ）
    if (NS.DexScene && NS.DexScene.itemSources) {
      var open = !!this._openSources()[item.id];
      lines.push({});
      lines.push({ text: (open ? "▼ " : "▶ ") + (texts.sourcesLabel || ""),
                   color: open ? t.cursorColor : t.subTextColor, toggle: item.id });
      if (open) {
        var sources = NS.DexScene.itemSources(game, item.id, { reveal: true });
        if (sources.length === 0) lines.push({ indent: 22, text: texts.sourceNone || "", dim: true });
        for (i = 0; i < sources.length; i++) {
          var line = {};
          for (var key in sources[i]) {
            if (Object.prototype.hasOwnProperty.call(sources[i], key)) line[key] = sources[i][key];
          }
          line.indent = (line.indent || 0) + 22;
          lines.push(line);
        }
      }
    }

    return { head: { icon: item.icon, name: item.name, chips: chips, sub: sub }, lines: lines };
  };

  /** 使ったときに起きること（data/items.js の effect）を1行の文にする */
  ItemScene.prototype._describeUse = function (effect) {
    var texts = this.texts.useTexts || {};
    var data = this.game.data;
    switch (effect.type) {
      case "healHp": return fill(texts.healHp, { value: effect.value });
      case "healPp": return fill(texts.healPp, { value: effect.value });
      case "revive":  return fill(texts.revive, { percent: Math.round((effect.hpRatio || 0) * 100) });
      case "escape":  return texts.escape || "";
      case "cureStatus":
        var names = (effect.statuses || []).map(function (id) {
          var def = (data.statuses || {})[id];
          return (def && def.name) || id;
        });
        return fill(texts.cureStatus, { names: names.join("・") });
      default: return texts[effect.type] || "";
    }
  };

  /** 手に入る場所を開いた道具 { id: true }。工房と同じ入れ物を使う（開け閉めがそろう） */
  ItemScene.prototype._openSources = function () {
    if (!this.game.craftOpenSources) this.game.craftOpenSources = {};
    return this.game.craftOpenSources;
  };

  ItemScene.prototype._toggleSource = function (itemId) {
    var opened = this._openSources();
    if (opened[itemId]) delete opened[itemId];
    else opened[itemId] = true;
    this._detailCache = null;
  };

  /** 使う相手（パーティ）の選択 */
  ItemScene.prototype._renderTargets = function () {
    var rect = this.layout.detail;
    if (!rect) return;

    var t = this.theme;
    this.panel.drawBox(rect);

    var origin = this.panel.innerOrigin(rect);
    this.panel.drawText(this.texts.selectTarget || "", origin.x, origin.y + 16,
      { color: t.cursorColor });

    // 選んだ道具と残りの数（続けて使うので、あといくつあるかが分かるように）
    var chosen = this.list.getSelected();
    var chosenItem = chosen ? this.game.data.getItem(chosen.value) : null;
    if (chosenItem && this.texts.targetItem) {
      this.panel.drawText(this.texts.targetItem
          .replace("{item}", chosenItem.name)
          .replace("{count}", this.game.inventory.getCount(chosenItem.id)),
        rect.x + rect.w - (t.padding || 8), origin.y + 16,
        { align: "right", font: t.smallFont, color: t.subTextColor });
    }

    var party = this.game.party;
    if (!party) return;

    var rowHeight = 54;
    var top = origin.y + 44;
    // PPを戻す道具（精気の実）を選んでいるときは、HPではなくPPを出す（誰に使うか選べるように）
    var showPp = this._selectedRestoresPp();

    for (var i = 0; i < party.size(); i++) {
      var monster = party.get(i);
      var y = top + rowHeight * i;
      var selected = (i === this.targetIndex);

      if (selected) this.panel.drawText("▶", origin.x, y, { color: t.cursorColor });
      var heading = monster.getName() + " Lv" + monster.level;
      this.panel.drawText(heading, origin.x + 18, y,
        { color: selected ? t.cursorColor : t.textColor, font: t.smallFont });

      // 掛かっている状態異常の印（毒など）。解毒草を誰に使うか選べるように
      this.panel.ctx.font = t.smallFont || "12px monospace";
      NS.StatusMarks.draw(this.panel, NS.StatusMarks.defsOf(monster),
        origin.x + 18 + this.panel.ctx.measureText(heading).width + 8, y,
        { maxX: rect.x + rect.w - (t.padding || 8), sprites: this.sprites, data: this.game.data });

      if (showPp) {
        this.hpBar.drawPp(origin.x + 18, y + 8, 160, 8, monster.currentPp, monster.getMaxPp());
        this.panel.drawText("PP " + monster.currentPp + "/" + monster.getMaxPp(),
          origin.x + 18, y + 30, { font: t.smallFont, color: t.subTextColor });
      } else {
        this.hpBar.draw(origin.x + 18, y + 8, 160, 8, monster.currentHp, monster.getMaxHp());
        this.panel.drawText(monster.currentHp + "/" + monster.getMaxHp(),
          origin.x + 18, y + 30, { font: t.smallFont, color: t.subTextColor });
      }
    }
  };

  /** いま選んでいる道具が、PPを戻すもの（data/items.js の effect.type "healPp"）か */
  ItemScene.prototype._selectedRestoresPp = function () {
    var selected = this.list.getSelected();
    var item = selected ? this.game.data.getItem(selected.value) : null;
    return !!(item && item.effect && item.effect.type === "healPp");
  };

  ItemScene.prototype._renderNotice = function (ctx) {
    if (!this.notice.isActive()) return;
    var pos = this.layout.notice || { x: 400, y: 526 };

    ctx.save();
    ctx.globalAlpha = this.notice.getAlpha();
    ctx.font = "14px monospace";
    ctx.fillStyle = this.theme.cursorColor || "#ffd75e";
    ctx.textAlign = "center";
    ctx.fillText(this.notice.getText(), pos.x, pos.y);
    ctx.restore();
  };

  ItemScene.prototype._renderHint = function () {
    var pos = this.layout.hint || { x: 48, y: 570 };
    var text = (this.phase === "target") ? this.texts.hintTarget
      : fill(this.texts.hintList || "", { extra: this.pane.canScroll() ? (this.texts.hintScroll || "") : "" });
    this.panel.drawText(text || "", pos.x, pos.y,
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

  NS.ItemScene = ItemScene;
})(window.MyGame);
