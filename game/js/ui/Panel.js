/**
 * Panel.js
 * UI の共通土台。枠付きパネルの描画と、テーマ（色・フォント）の参照をまとめる。
 * 各UI部品はこれを使うことで、data/ui.js の theme を変えるだけで見た目が揃って変わる。
 */
(function (NS) {
  "use strict";

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} theme data/ui.js の theme
   */
  function Panel(ctx, theme) {
    this.ctx = ctx;
    this.theme = theme || {};
  }

  /**
   * 枠付きパネルを描く。
   * @param {object} rect { x, y, w, h }
   */
  Panel.prototype.drawBox = function (rect) {
    var t = this.theme;
    var bw = t.borderWidth || 2;

    this.ctx.fillStyle = t.panelBg || "rgba(0,0,0,0.9)";
    this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    this.ctx.strokeStyle = t.panelBorder || "#ffffff";
    this.ctx.lineWidth = bw;
    // 線がぼやけないよう半ピクセルずらす
    this.ctx.strokeRect(rect.x + bw / 2, rect.y + bw / 2, rect.w - bw, rect.h - bw);
  };

  /**
   * テキストを描く。
   * @param {string} str
   * @param {number} x
   * @param {number} y
   * @param {object} [opts] { color, font, align }
   */
  Panel.prototype.drawText = function (str, x, y, opts) {
    opts = opts || {};
    var t = this.theme;
    this.ctx.fillStyle = opts.color || t.textColor || "#ffffff";
    this.ctx.font = opts.font || t.font || "14px monospace";
    this.ctx.textAlign = opts.align || "left";
    this.ctx.fillText(str, x, y);
    this.ctx.textAlign = "left";
  };

  /** パネル内側の左上座標を返す（padding を考慮） */
  Panel.prototype.innerOrigin = function (rect) {
    var p = this.theme.padding || 8;
    return { x: rect.x + p, y: rect.y + p };
  };

  /**
   * その座標が枠の中にあるか。マウス操作の当たり判定に使う。
   * @param {object} rect { x, y, w, h }
   * @param {object} point { x, y }
   */
  Panel.containsPoint = function (rect, point) {
    if (!rect || !point) return false;
    return point.x >= rect.x && point.x < rect.x + rect.w
        && point.y >= rect.y && point.y < rect.y + rect.h;
  };

  // ===================================================================
  // DetailPane：右の説明欄（v1.4.0）
  // ===================================================================
  //
  // 工房・お店・持ち物・仲間の画面で同じ形にそろえるための部品。
  //   上の欄（head）… 動かない。台座に立つ絵（48px）・名前・札・ひとこと
  //   その下の行（lines）… 1行ずつ。入りきらなければバー・Q/E・ホイールで送る
  //
  // 中身は画面のほうが { head, lines } で作り、setContent で渡す（毎フレーム渡してよい）。
  //   head  … { icon（絵のid）, sprite（モンスターの絵）, mark（絵の代わりの1文字）, name, nameColor, chips: [{ label, color, icon }], sub, subColor,
  //            drawPicture（function (x, y, size)。動く絵など、画面のほうで描くとき。台座は部品が描く） }
  //   lines … { text, color, heading（見出しの色）, dim（薄い色）, icon（16px の絵）, sprite（モンスターの絵 18px）,
  //            unknownSprite（絵の代わりに「？」）, right（右端の文）, rightColor,
  //            rightParts（[{ text, color }]。右端の文を色ごとに分けて描く。right にも同じ文をつなげて入れておく〈幅を測る確かめが使う〉）, indent, bar（×1.0 を中心にした棒）,
  //            toggle（押せる行。押すと handleInput が { toggle: その値 } を返す）,
  //            cols（[{ icon, text, color }] を同じ幅の列に並べる。耐性の表など。v1.4.0 仲間の画面）,
  //            parts（[{ icon, text, color }] を左から続けて並べる。属性と種類など）, font（文の字） }
  // 配置は rect（data/ui.js の各画面の detail）。lineHeight・keyRows・wheelRows も rect に書ける。
  // rect.noBox … 枠を描かない（「様子を見る」のように、大きな枠の中に置くとき）
  // 見た目はバーも含めて一覧（ScrollList）とそろえてある（theme.scrollbar）。

  var HEAD_HEIGHT = 72;

  /**
   * @param {MyGame.Panel} panel
   * @param {MyGame.SpriteRenderer} sprites
   * @param {object} rect { x, y, w, h, lineHeight?, keyRows?, wheelRows?, charsPerLine? }
   */
  function DetailPane(panel, sprites, rect) {
    this.panel = panel;
    this.sprites = sprites;
    this.rect = rect;
    this.theme = panel.theme || {};
    this.content = null;
    this.key = undefined;
    this.scroll = 0;
    this.hits = [];
    this._dragging = false;
    this._wasDown = false;
  }

  /** 中身を渡す。key が変わったら（選ぶものが変わったら）先頭へ戻す */
  DetailPane.prototype.setContent = function (content, key) {
    if (key !== this.key) {
      this.key = key;
      this.scroll = 0;
      this._dragging = false;
    }
    this.content = content || null;
  };

  DetailPane.prototype.lineHeight = function () {
    return this.rect.lineHeight || this.theme.lineHeight || 18;
  };

  /** 何行入るか。{ top, bottom, visible, total, lineHeight } */
  DetailPane.prototype.measure = function () {
    var rect = this.rect;
    var t = this.theme;
    var lh = this.lineHeight();
    var origin = this.panel.innerOrigin(rect);
    var hasHead = !!(this.content && this.content.head);
    var top = origin.y + (hasHead ? HEAD_HEIGHT : 0) + 18;
    var bottom = rect.y + rect.h - (t.padding || 8);
    return {
      top: top,
      bottom: bottom,
      lineHeight: lh,
      visible: Math.max(1, Math.floor((bottom - top) / lh) + 1),
      total: (this.content && this.content.lines) ? this.content.lines.length : 0
    };
  };

  DetailPane.prototype.maxScroll = function () {
    var m = this.measure();
    return Math.max(0, m.total - m.visible);
  };

  DetailPane.prototype.canScroll = function () { return this.maxScroll() > 0; };

  DetailPane.prototype.scrollBy = function (rows) {
    this.scroll = Math.max(0, Math.min(this.maxScroll(), this.scroll + rows));
  };

  /** Q/E で送るときの行数 */
  DetailPane.prototype.keyRows = function () { return this.rect.keyRows || 3; };

  /**
   * マウス（バー・ホイール・押せる行）。キーは画面のほうで scrollBy を呼ぶ。
   * @returns {object|null} { bar: true }（バーを触った。ほかの操作は見ない）/ { toggle: 値 }（押せる行を押した）/ null
   */
  DetailPane.prototype.handleInput = function (input) {
    if (!input || !input.getPointer) return null;
    var pointer = input.getPointer();
    var pressedNow = pointer.down && !this._wasDown;
    this._wasDown = !!pointer.down;

    var m = this.measure();
    var max = Math.max(0, m.total - m.visible);
    if (this.scroll > max) this.scroll = max;
    var track = this.barRect(m);

    if (track) {
      var handle = this.handleRect(track, m);
      if (this._dragging) {
        if (!pointer.down) { this._dragging = false; return { bar: true }; }
        var travel = track.h - handle.h;
        var ratio = travel > 0 ? (pointer.y - this._grab - track.y) / travel : 0;
        this.scroll = Math.max(0, Math.min(max, Math.round(ratio * max)));
        return { bar: true };
      }
      // 押しやすいように、溝の左右を少し広げて見る
      var hit = { x: track.x - 4, y: track.y, w: track.w + 8, h: track.h };
      if (pointer.inside && Panel.containsPoint(hit, pointer) && (pressedNow || pointer.clicked)) {
        if (pressedNow) {
          if (pointer.y >= handle.y && pointer.y <= handle.y + handle.h) {
            this._dragging = true;
            this._grab = pointer.y - handle.y;
          } else {
            var t = track.h - handle.h;
            var r = t > 0 ? (pointer.y - track.y - handle.h / 2) / t : 0;
            this.scroll = Math.max(0, Math.min(max, Math.round(r * max)));
          }
        }
        return { bar: true };
      }
    } else {
      this._dragging = false;
    }

    // ホイール（説明欄の上だけ）
    if (pointer.wheel && pointer.inside && Panel.containsPoint(this.rect, pointer)) {
      this.scrollBy(pointer.wheel * (this.rect.wheelRows || 1));
    }

    // 押せる行（描いたときの場所で見る）
    if (pointer.clicked) {
      for (var i = 0; i < this.hits.length; i++) {
        if (Panel.containsPoint(this.hits[i].rect, pointer)) return { toggle: this.hits[i].id };
      }
    }
    return null;
  };

  /** バーの溝。入りきっているときは null（出さない） */
  DetailPane.prototype.barRect = function (m) {
    m = m || this.measure();
    if (m.total <= m.visible) return null;
    var s = this.theme.scrollbar || {};
    var width = s.width || 6, margin = s.margin || 4;
    var top = m.top - m.lineHeight + 4;
    return { x: this.rect.x + this.rect.w - margin - width, y: top, w: width, h: m.bottom - top };
  };

  /** つまみ。見えている行の割合で長さ、送った行で位置を決める */
  DetailPane.prototype.handleRect = function (track, m) {
    var s = this.theme.scrollbar || {};
    var h = Math.min(track.h, Math.max(s.minHandle || 24, Math.floor(track.h * m.visible / m.total)));
    var max = Math.max(1, m.total - m.visible);
    return { x: track.x, y: track.y + (track.h - h) * (this.scroll / max), w: track.w, h: h };
  };

  DetailPane.prototype.isDragging = function () { return this._dragging; };

  /**
   * 枠・上の欄・行・バーを描く。
   * @param {string} [emptyText] 中身が無いときに出す文
   */
  DetailPane.prototype.render = function (emptyText) {
    var rect = this.rect;
    var t = this.theme;
    if (!rect.noBox) this.panel.drawBox(rect);
    this.hits = [];

    if (!this.content) {
      if (emptyText) {
        this.panel.drawText(emptyText, rect.x + (t.padding || 8), rect.y + 30,
          { font: t.smallFont, color: t.hintColor });
      }
      return;
    }

    if (this.content.head) this._renderHead(this.content.head);

    var m = this.measure();
    var max = Math.max(0, m.total - m.visible);
    if (this.scroll > max) this.scroll = max;

    var lines = this.content.lines || [];
    var end = Math.min(lines.length, this.scroll + m.visible);
    var y = m.top;
    for (var i = this.scroll; i < end; i++) {
      if (lines[i].toggle) {
        this.hits.push({ id: lines[i].toggle,
          rect: { x: rect.x + 4, y: y - m.lineHeight + 4, w: rect.w - 24, h: m.lineHeight } });
      }
      this._renderLine(lines[i], y);
      y += m.lineHeight;
    }
    this._renderBar(m);
  };

  DetailPane.prototype._renderHead = function (head) {
    var rect = this.rect;
    var origin = this.panel.innerOrigin(rect);
    var t = this.theme;
    var ctx = this.panel.ctx;
    var x = origin.x, y = origin.y;

    if (head.icon || head.sprite || head.mark || head.drawPicture) {
      ctx.save();
      ctx.fillStyle = "rgba(127,141,184,0.14)";
      ctx.beginPath(); ctx.ellipse(x + 30, y + 58, 30, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(127,141,184,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(x + 30, y + 58, 30, 7, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      if (head.drawPicture) head.drawPicture(x + 6, y + 8, 48);
      else if (head.icon) this.sprites.draw(head.icon, x + 6, y + 8, 48, 48);
      else if (head.sprite) this.sprites.draw(firstFrame(head.sprite), x + 6, y + 8, 48, 48);
      else this.panel.drawText(head.mark, x + 30, y + 50, { align: "center", font: "30px monospace", color: t.hintColor });
      x += 72;
    }

    this.panel.drawText(head.name || "", x, y + 22, { font: "18px monospace", color: head.nameColor || t.textColor });
    var chipX = x;
    var chips = head.chips || [];
    for (var i = 0; i < chips.length; i++) {
      chipX += this._chip(chips[i].label, chipX, y + 30, chips[i].color, chips[i].icon) + 6;
    }
    if (head.sub) {
      this.panel.drawText(head.sub, x, y + 66, { font: t.smallFont, color: head.subColor || t.subTextColor });
    }

    ctx.save();
    ctx.strokeStyle = t.panelBorder || "#3a4266";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(origin.x, y + HEAD_HEIGHT + 0.5);
    ctx.lineTo(rect.x + rect.w - (t.padding || 8), y + HEAD_HEIGHT + 0.5);
    ctx.stroke();
    ctx.restore();
  };

  /** 札（枠つきの小さな文字。絵を添えられる） */
  DetailPane.prototype._chip = function (label, x, y, color, iconId) {
    var ctx = this.panel.ctx;
    var t = this.theme;
    color = color || t.subTextColor;
    ctx.save();
    ctx.font = t.smallFont || "12px monospace";
    var left = iconId ? 22 : 7;
    var w = Math.ceil(ctx.measureText(label).width) + left + (iconId ? 8 : 7);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(x, y, w, 20);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 19);
    ctx.restore();
    if (iconId) this.sprites.draw(iconId, x + 3, y + 2, 16, 16);
    this.panel.drawText(label, x + left, y + 15, { font: t.smallFont, color: color });
    return w;
  };

  /** 1行。y は文字の下端 */
  DetailPane.prototype._renderLine = function (line, y) {
    var rect = this.rect;
    var origin = this.panel.innerOrigin(rect);
    var t = this.theme;
    var x = origin.x + (line.indent || 0);
    var right = rect.x + rect.w - 24;
    var color = line.color || (line.heading ? t.cursorColor : line.dim ? t.hintColor : t.subTextColor);

    if (line.sprite) {
      this.sprites.draw(firstFrame(line.sprite), x, y - 15, 18, 18);
      x += 24;
    } else if (line.unknownSprite) {
      this.panel.drawText("？", x + 9, y, { align: "center", font: t.smallFont, color: t.hintColor });
      x += 24;
    } else if (line.icon) {
      this.sprites.draw(line.icon, x, y - 13, 16, 16);
      x += 22;
    }

    if (line.bar) {
      var barX = origin.x + 70, barW = Math.max(60, rect.w - 190), mid = barX + barW / 2;
      var ctx = this.panel.ctx;
      ctx.fillStyle = t.hpBarBg || "#2a3350";
      ctx.fillRect(barX, y - 9, barW, 8);
      var span = Math.max(-1, Math.min(1, (line.bar.value - 1) / (line.bar.range || 0.2)));
      ctx.fillStyle = line.bar.color || t.cursorColor;
      if (span > 0) ctx.fillRect(mid, y - 9, Math.round(barW / 2 * span), 8);
      else if (span < 0) ctx.fillRect(mid + Math.round(barW / 2 * span), y - 9, Math.round(-barW / 2 * span), 8);
      ctx.fillStyle = t.textColor;
      ctx.fillRect(mid, y - 11, 1, 12);
    }

    if (line.parts) {
      // 色の違う短い文を、左から続けて並べる（「火」「地」「斬撃」）
      var px = x;
      for (var p = 0; p < line.parts.length; p++) {
        var part = line.parts[p];
        if (part.icon) { this.sprites.draw(part.icon, px, y - 12, 14, 14); px += 17; }
        this.panel.drawText(part.text || "", px, y, { font: line.font || t.smallFont, color: part.color || color });
        this.panel.ctx.font = line.font || t.smallFont;
        px += this.panel.ctx.measureText(part.text || "").width + 10;
      }
    }
    if (line.cols) {
      // 同じ幅の列に並べる（右端のバーの手前まで）
      var colW = Math.floor((right - x) / Math.max(1, line.cols.length));
      for (var c = 0; c < line.cols.length; c++) {
        var col = line.cols[c];
        if (!col) continue;
        var cx = x + c * colW;
        if (col.icon) { this.sprites.draw(col.icon, cx, y - 12, 14, 14); cx += 17; }
        if (col.text) this.panel.drawText(col.text, cx, y, { font: line.font || t.smallFont, color: col.color || color });
      }
    }
    if (line.text) this.panel.drawText(line.text, x, y, { font: line.font || t.smallFont, color: color });
    if (line.rightParts) {
      // 右端の文を、色の違う短い文に分けて描く（「攻撃+4」は緑・「防御-1」は赤。間は空白1つぶん）
      var ctxR = this.panel.ctx;
      ctxR.font = t.smallFont;
      var gapR = ctxR.measureText(" ").width;
      var rx = right;
      for (var rp = line.rightParts.length - 1; rp >= 0; rp--) {
        var partR = line.rightParts[rp];
        this.panel.drawText(partR.text, rx, y, { align: "right", font: t.smallFont, color: partR.color || line.rightColor || color });
        ctxR.font = t.smallFont;
        rx -= ctxR.measureText(partR.text).width + gapR;
      }
    } else if (line.right) {
      this.panel.drawText(line.right, right, y, { align: "right", font: t.smallFont, color: line.rightColor || color });
    }
  };

  DetailPane.prototype._renderBar = function (m) {
    var track = this.barRect(m);
    if (!track) return;
    var s = this.theme.scrollbar || {};
    var handle = this.handleRect(track, m);
    var ctx = this.panel.ctx;
    var radius = track.w / 2;
    ctx.save();
    ctx.fillStyle = s.track || "rgba(255,255,255,0.06)";
    roundRect(ctx, track.x, track.y, track.w, track.h, radius);
    ctx.fill();
    ctx.fillStyle = this._dragging ? (s.handleActive || "#ffd75e") : (s.handle || "#9aa4c0");
    roundRect(ctx, handle.x, handle.y, handle.w, handle.h, radius);
    ctx.fill();
    ctx.restore();
  };

  function firstFrame(sprite) {
    return (Object.prototype.toString.call(sprite) === "[object Array]") ? sprite[0] : sprite;
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  NS.DetailPane = DetailPane;

  NS.Panel = Panel;
})(window.MyGame);
