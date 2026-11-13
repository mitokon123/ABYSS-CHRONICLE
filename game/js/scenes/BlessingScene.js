/**
 * BlessingScene.js
 * 階を降りたときに出る「加護を選ぶ」画面。
 *
 * 選んだ加護はそのラン限りで、パーティ全員に掛かる。
 * 候補を選ぶのは BlessingSystem、効果を配るのは Game。この画面は表示と入力だけを行う。
 *
 * ▼ 操作
 *   ↑↓ / マウス … 選ぶ
 *   決定          … その加護を得て、探索へ戻る
 *
 * この画面は取り消せない（必ず1つ選ぶ）。
 *
 * ▼ 見た目（v1.4.0・2026-11-12。拠点の「加護を選ぶ」とそろえた）
 *   候補の枠 … 左に出やすさの色の帯と加護の絵、名前、右に出やすさの札、説明、効果（「攻撃 ×1.1」）
 *   下の枠   … いま受けている加護を、絵と名前の札で並べる（札の色は出やすさの色）
 *
 * 配置は data/ui.js の blessing、文言は data/messages.js の blessing。
 */
(function (NS) {
  "use strict";

  /**
   * @param {MyGame.Game} game
   * @param {object[]} choices 選ばせる加護（data/blessings.js の定義）
   * @param {object} returnScene 選び終わったら戻るシーン
   */
  function BlessingScene(game, choices, returnScene) {
    this.game = game;
    this.choices = choices || [];
    this.returnScene = returnScene;

    var ui = game.data.ui || {};
    this.theme = ui.theme || {};
    this.layout = ui.blessing || {};
    this.texts = (game.data.messages || {}).blessing || {};

    this.panel = new NS.Panel(game.ctx, this.theme);
    this.renderer = new NS.Renderer(game.ctx);
    this.sprites = new NS.SpriteRenderer(game.ctx, game.assets);

    this.index = 0;
    this.elapsed = 0;
  }

  BlessingScene.prototype.enter = function () {
    this.index = 0;
    this.elapsed = 0;
  };

  // --- 更新 ---

  BlessingScene.prototype.update = function (dt) {
    this.elapsed += dt;

    var input = this.game.input;
    var count = this.choices.length;
    if (count === 0) {
      this._finish();
      return;
    }

    if (input.isPressed("up")) this.index = (this.index - 1 + count) % count;
    if (input.isPressed("down")) this.index = (this.index + 1) % count;

    // マウス：重ねた候補へ移り、押したら決まる
    var hovered = this._hoveredIndex(input);
    if (hovered >= 0) this.index = hovered;

    var clicked = hovered >= 0 && input.getPointer && input.getPointer().clicked;
    if (input.isPressed("confirm") || clicked) this._choose();
  };

  BlessingScene.prototype._choose = function () {
    var blessing = this.choices[this.index];
    if (blessing) this.game.addBlessing(blessing);
    this._finish();
  };

  BlessingScene.prototype._finish = function () {
    this.game.scenes.change(this.returnScene);
  };

  /** カーソルが乗っている候補の番号（乗っていなければ -1） */
  BlessingScene.prototype._hoveredIndex = function (input) {
    if (!input.getPointer) return -1;

    var pointer = input.getPointer();
    if (!pointer.inside) return -1;
    if (!pointer.moved && !pointer.clicked) return -1;

    for (var i = 0; i < this.choices.length; i++) {
      if (NS.Panel.containsPoint(this._cardRect(i), pointer)) return i;
    }
    return -1;
  };

  /** 候補1つ分の枠 */
  BlessingScene.prototype._cardRect = function (index) {
    var L = this.layout.card || { x: 140, y: 190, w: 520, h: 86, gap: 100 };
    return { x: L.x, y: L.y + L.gap * index, w: L.w, h: L.h };
  };

  // --- 描画 ---

  BlessingScene.prototype.render = function (ctx) {
    var w = this.game.canvas.width;
    var h = this.game.canvas.height;

    this.renderer.clear(this.layout.background || "#0a0f1c", w, h);

    this._renderHeading(w);
    for (var i = 0; i < this.choices.length; i++) this._renderCard(i);
    this._renderShortNote(w);
    this._renderOwned();
    this._renderHint();
  };

  /**
   * 選択肢が満たなかったときの断り書き。
   *
   * 枠は「等級を引いてから、その等級の加護を選ぶ」順で作るので、
   * 引いた等級を1つも編成していないと枠が空になる（BlessingSystem を参照）。
   * 何も言わずに2つしか出さないと不具合に見えるので、理由をその場に出す。
   * ＝「絞り込みすぎている」と気づける唯一の場所。
   */
  BlessingScene.prototype._renderShortNote = function (w) {
    var full = (((this.game.data.run || {}).blessing) || {}).choiceCount || 3;
    if (this.choices.length >= full) return;

    var note = this.texts.fewChoices;
    if (!note) return;

    // いちばん下のカードの少し下に置く（カードの数で位置が変わる）
    var rect = this._cardRect(Math.max(0, this.choices.length - 1));
    this.panel.drawText(note, w / 2, rect.y + rect.h + 26,
      { align: "center", font: this.theme.smallFont, color: this.theme.hintColor });
  };

  BlessingScene.prototype._renderHeading = function (w) {
    var title = this.layout.title || { y: 100 };
    var subtitle = this.layout.subtitle || { y: 130 };

    this.panel.drawText(this.texts.title || "", w / 2, title.y,
      { align: "center", font: title.font || "24px monospace", color: title.color });
    this.panel.drawText(this.texts.subtitle || "", w / 2, subtitle.y,
      { align: "center", font: subtitle.font || this.theme.smallFont,
        color: subtitle.color || this.theme.subTextColor });
  };

  BlessingScene.prototype._renderCard = function (index) {
    var t = this.theme;
    var rect = this._cardRect(index);
    var blessing = this.choices[index];
    var selected = (index === this.index);
    var ctx = this.panel.ctx;
    var data = this.game.data;
    var rarity = NS.BlessingSystem.getRarity(data, blessing);
    var tierColor = rarity.color || t.subTextColor;

    this.panel.drawBox(rect);

    // 左端に出やすさの色の帯（よく出る・ふつう・少ない・まれ が一目で分かるように）
    ctx.save();
    ctx.fillStyle = tierColor;
    ctx.globalAlpha = selected ? 1 : 0.7;
    ctx.fillRect(rect.x + 2, rect.y + 2, 4, rect.h - 4);
    ctx.restore();

    // 選んでいる候補は枠を強調する
    if (selected) {
      ctx.strokeStyle = t.cursorColor || "#ffd75e";
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
      this.panel.drawText("▶", rect.x - 20, rect.y + rect.h / 2 + 5, { color: t.cursorColor });
    }

    var C = this.layout.cardInner || {};
    var iconSize = C.iconSize || 40;
    this.sprites.draw(C.icon || "iconBlessing", rect.x + 16, rect.y + Math.floor((rect.h - iconSize) / 2), iconSize, iconSize);

    var x = rect.x + 16 + iconSize + 14;
    var right = rect.x + rect.w - 12;
    this.panel.drawText(blessing.name, x, rect.y + 28,
      { color: selected ? t.cursorColor : t.textColor });

    // 右上：出やすさの札
    if (rarity.label) {
      var label = (this.texts.rarityLabel || "出やすさ ") + rarity.label;
      drawChip(this.panel, label, right, rect.y + 12, tierColor, t);
    }

    this.panel.drawText(blessing.description || "", x, rect.y + 50,
      { font: t.smallFont, color: t.subTextColor });

    // 効果（「攻撃 ×1.1」）。説明の文よりも正確な数字
    var effects = (blessing.effects || []).map(function (e) { return NS.EffectSystem.describeEffect(e, data); })
      .filter(function (text) { return !!text; });
    if (effects.length) {
      this.panel.drawText(effects.join("　"), x, rect.y + 70,
        { font: t.smallFont, color: selected ? tierColor : t.hintColor });
    }
  };

  /** 右端をそろえた札（枠つきの小さな文字）。幅を返す */
  function drawChip(panel, label, right, y, color, t) {
    var ctx = panel.ctx;
    ctx.save();
    ctx.font = t.smallFont || "12px monospace";
    var w = Math.ceil(ctx.measureText(label).width) + 14;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(right - w, y, w, 20);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(right - w + 0.5, y + 0.5, w - 1, 19);
    ctx.restore();
    panel.drawText(label, right - w + 7, y + 15, { font: t.smallFont, color: color });
    return w;
  }

  /**
   * いま受けている加護（重ねて強くなることが分かるように）。
   * 枠の中に、絵と名前の札を左から並べ、入りきらなければ折り返す（2段まで。あふれたら「ほかN」）
   */
  BlessingScene.prototype._renderOwned = function () {
    var box = this.layout.ownedBox;
    var run = this.game.run;
    if (!box || !run) return;

    var owned = run.getBlessings();
    var t = this.theme;
    this.panel.drawBox(box);
    var origin = this.panel.innerOrigin(box);
    this.panel.drawText(fill(this.texts.ownedHeading || "受けている加護（{n}）", { n: owned.length }),
      origin.x, origin.y + 12, { font: t.smallFont, color: t.hintColor });
    if (owned.length === 0) {
      this.panel.drawText(this.texts.ownedNone || "", origin.x + 150, origin.y + 12,
        { font: t.smallFont, color: t.hintColor });
      return;
    }

    var ctx = this.panel.ctx;
    var x = origin.x, y = origin.y + 22;
    var right = box.x + box.w - (t.padding || 8);
    var rowH = box.rowHeight || 24;
    var maxRows = box.rows || 2;
    var row = 0;
    for (var i = 0; i < owned.length; i++) {
      ctx.font = t.smallFont || "12px monospace";
      var w = Math.ceil(ctx.measureText(owned[i].name).width) + 30;
      if (x + w > right) {
        row++;
        x = origin.x;
        y += rowH;
      }
      if (row >= maxRows) {
        this.panel.drawText(fill(this.texts.ownedMore || "ほか{n}", { n: owned.length - i }), right, y - rowH + 15,
          { align: "right", font: t.smallFont, color: t.hintColor });
        break;
      }
      var rarity = NS.BlessingSystem.getRarity(this.game.data, owned[i]);
      var color = rarity.color || t.subTextColor;
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(x, y, w, 20);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 19);
      ctx.restore();
      this.sprites.draw("iconBlessing", x + 3, y + 2, 16, 16);
      this.panel.drawText(owned[i].name, x + 22, y + 15, { font: t.smallFont, color: color });
      x += w + 6;
    }
  };

  /** テンプレートの {key} を置き換える */
  function fill(template, values) {
    if (!template) return "";
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return (values[key] !== undefined) ? values[key] : match;
    });
  }

  BlessingScene.prototype._renderHint = function () {
    var pos = this.layout.hint || { x: 400, y: 560 };
    this.panel.drawText(this.texts.hint || "", pos.x, pos.y,
      { align: "center", font: this.theme.smallFont, color: this.theme.hintColor });
  };

  NS.BlessingScene = BlessingScene;
})(window.MyGame);
