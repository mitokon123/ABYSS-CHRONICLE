/**
 * PatchNoteScene.js
 * パッチノート（更新履歴）の画面。タイトル画面から開く。
 *
 * 左にバージョンの一覧、右にその内容を出す。
 * 過去のバージョンも同じ操作で読み返せるようにしてある。
 *
 * 項目の種類（追加・調整・修正など）は色つきの札で示す。
 * 種類と色は data/patchnotes.js の types で決まるので、
 * 種類を増やしてもこのコードは変更しなくてよい。
 *
 * ▼ 操作
 *   ↑↓        … 左でバージョンを選ぶ
 *   ←→ / 決定 … 内容側へ移り、↑↓で読み進める
 *   ホイール    … カーソルの位置にある側をスクロール
 *   右端のバー  … どちらの枠も、持ち物などの一覧と同じバーでつまんで送れる（js/ui/ScrollList.js）
 *   Esc / 戻る … タイトルへ
 */
(function (NS) {
  "use strict";

  /**
   * @param {MyGame.Game} game
   * @param {object} returnScene 閉じたときに戻るシーン
   */
  function PatchNoteScene(game, returnScene) {
    this.game = game;
    this.returnScene = returnScene;

    var ui = game.data.ui || {};
    this.theme = ui.theme || {};
    this.layout = ui.patchNote || {};
    this.texts = (game.data.messages || {}).patchNote || {};

    var notes = game.data.patchnotes || {};
    this.versions = notes.versions || [];
    this.types = notes.types || {};

    this.panel = new NS.Panel(game.ctx, this.theme);
    this.renderer = new NS.Renderer(game.ctx);
    this.backButton = new NS.BackButton(this.panel, game.data);

    this.index = 0;       // 選んでいるバージョン
    this.focus = "list";  // "list"（バージョンを選ぶ）/ "notes"（内容を読む）

    var self = this;
    var L = this.layout.list;
    // 左：バージョンの一覧。枠は自分で描き、行も自分で描く
    var rows = this._visibleVersions();
    this.list = new NS.ScrollList(this.panel, {
      x: L.x, y: L.y, w: L.w, h: rows * L.rowHeight, rowHeight: L.rowHeight,
      visibleRows: rows, frame: false
    }, {
      renderRow: function (row, i, y, selected) { self._renderVersionRow(row, y, selected); }
    });

    // 右：内容。見出し（バージョン名）の下から行を並べる
    var N = this.layout.notes;
    var lh = this.theme.lineHeight || 18;
    var origin = this.panel.innerOrigin(N);
    var lines = this._visibleLines();
    this.notes = new NS.ScrollList(this.panel, {
      x: N.x, y: origin.y + 40 - (lh - 4), w: N.w, h: lines * lh, rowHeight: lh,
      visibleRows: lines, frame: false
    }, {
      readOnly: true,
      renderRow: function (row, i, y) { self._renderNoteLine(row, y + lh - 4); }
    });
  }

  PatchNoteScene.prototype.enter = function () {
    this.index = 0;
    this.focus = "list";

    var rows = [];
    for (var i = 0; i < this.versions.length; i++) {
      rows.push({ type: "entry", version: this.versions[i] });
    }
    this.list.setRows(rows);
    this._loadNotes();
  };

  /**
   * バージョン一覧に一度に出せる行数。
   *
   * ★ 書いていなければ枠の高さから計算する。
   *   バージョンは増え続けるので、**入りきらない前提**で作ってある。
   *   これが無かったころは、8個目から枠の外へはみ出して
   *   下の操作説明に重なっていた。
   */
  PatchNoteScene.prototype._visibleVersions = function () {
    var L = this.layout.list;
    if (L.visibleRows) return L.visibleRows;
    return Math.max(1, Math.floor((L.h - 10) / L.rowHeight));
  };

  /** 選んでいるバージョンの内容を、右の枠に入れ直す（先頭から読む） */
  PatchNoteScene.prototype._loadNotes = function () {
    var lines = this._buildLines();
    for (var i = 0; i < lines.length; i++) lines[i].type = "line";
    this.notes.setRows(lines);
  };

  PatchNoteScene.prototype.getSelected = function () {
    return this.versions[this.index] || null;
  };

  // --- 更新 ---

  PatchNoteScene.prototype.update = function () {
    var input = this.game.input;

    if (this.backButton.handleInput(input) || input.isPressed("cancel")) {
      this.game.scenes.change(this.returnScene);
      return;
    }

    // カーソルを重ねた側を操作できるようにする
    this._updateFocusByPointer(input);

    // バーとホイールはどちらの枠でも効く。上下キーは操作中の側だけ
    var focus = this.focus;
    this._updateList(input, focus === "list");
    this._updateNotes(input, focus === "notes");
  };

  /** マウスを重ねた側へ操作の対象を移す */
  PatchNoteScene.prototype._updateFocusByPointer = function (input) {
    if (!input.getPointer) return;
    // バーをつまんだまま枠の外へ出ても、つまんだ側の操作を続ける
    if (this.list.isDragging() || this.notes.isDragging()) return;

    var pointer = input.getPointer();
    if (!pointer.inside) return;
    if (!pointer.moved && !pointer.clicked && !pointer.wheel) return;

    if (NS.Panel.containsPoint(this.layout.list, pointer)) this.focus = "list";
    else if (NS.Panel.containsPoint(this.layout.notes, pointer)) this.focus = "notes";
  };

  /**
   * 左の一覧。上下キー・マウスを重ねる・ホイール・バーで動かす。
   * @param {boolean} active 操作中の側か（上下キーと決定を見る）
   */
  PatchNoteScene.prototype._updateList = function (input, active) {
    if (this.versions.length === 0) return;

    this.list.handleInput(input, { keys: active });

    // 別のバージョンを選んだら、内容は先頭から読み直す
    if (this.list.index !== this.index) {
      this.index = this.list.index;
      this._loadNotes();
    }

    if (active && (input.isPressed("confirm") || input.isPressed("right"))) this.focus = "notes";
  };

  /**
   * 右の内容。上下キーで1行ずつ、ホイールとバーでも送れる。
   * @param {boolean} active 操作中の側か（上下キーと ← を見る）
   */
  PatchNoteScene.prototype._updateNotes = function (input, active) {
    this.notes.handleInput(input);
    if (!active) return;

    if (input.isPressed("up")) this.notes.scrollByRows(-1);
    if (input.isPressed("down")) this.notes.scrollByRows(1);
    if (input.isPressed("left")) this.focus = "list";
  };

  // --- 内容の組み立て ---

  /**
   * 選んでいるバージョンの内容を、描く行の配列にする。
   * 長い文は折り返し、2行目以降は種類の札のぶんだけ字下げする。
   *
   * @returns {Array<{text:string, tag:object|null}>}
   */
  PatchNoteScene.prototype._buildLines = function () {
    var version = this.getSelected();
    if (!version) return [];

    var chars = this.layout.notes.charsPerLine || 34;
    var entries = version.entries || [];
    var lines = [];

    for (var i = 0; i < entries.length; i++) {
      // 話題の見出し（{ section: "戦い" }）。札は付けず、色を変えて1行で出す
      if (entries[i].section) {
        lines.push({ text: (this.texts.sectionMark || "■ ") + entries[i].section, tag: null, heading: true });
        continue;
      }

      var type = this.types[entries[i].type] || null;
      var wrapped = wrapText(entries[i].text || "", chars);

      for (var j = 0; j < wrapped.length; j++) {
        // 札は1行目にだけ付ける
        lines.push({ text: wrapped[j], tag: (j === 0) ? type : null });
      }
      lines.push({ text: "", tag: null });   // 項目のあいだに1行あける
    }
    return lines;
  };

  PatchNoteScene.prototype._visibleLines = function () {
    var N = this.layout.notes;
    var lh = this.theme.lineHeight || 18;
    return Math.max(1, Math.floor((N.h - (this.theme.padding || 8) * 2 - 24) / lh));
  };

  // --- 描画 ---

  PatchNoteScene.prototype.render = function (ctx) {
    var w = this.game.canvas.width;
    var h = this.game.canvas.height;

    this.renderer.clear(this.layout.background || "#0a0f1c", w, h);

    this._renderHeading();
    this._renderLegend();
    this._renderVersionList();
    this._renderNotes();
    this._renderHint();
    this.backButton.render();
  };

  PatchNoteScene.prototype._renderHeading = function () {
    var title = this.layout.title || {};
    var subtitle = this.layout.subtitle || {};

    this.panel.drawText(this.texts.title || "", title.x, title.y,
      { font: title.font, color: title.color });
    this.panel.drawText(this.texts.subtitle || "", subtitle.x, subtitle.y,
      { font: subtitle.font, color: subtitle.color });
  };

  /** 色が何を表すかの凡例。上部に並べる */
  PatchNoteScene.prototype._renderLegend = function () {
    var pos = this.layout.legend;
    if (!pos) return;

    var x = pos.x;
    for (var id in this.types) {
      if (!Object.prototype.hasOwnProperty.call(this.types, id)) continue;
      var type = this.types[id];

      this._drawTag(type, x, pos.y);
      x += pos.gap;
    }
  };

  /** 種類の札（色つきの小さな四角に文字） */
  PatchNoteScene.prototype._drawTag = function (type, x, y) {
    var T = this.layout.tag || { w: 34, h: 16 };
    var ctx = this.panel.ctx;

    ctx.fillStyle = type.color || this.theme.subTextColor;
    ctx.fillRect(x, y - T.h + 3, T.w, T.h);

    this.panel.drawText(type.label, x + T.w / 2, y,
      { align: "center", font: this.theme.smallFont, color: this.layout.tagTextColor || "#0a0f1c" });
  };

  /**
   * 左：バージョンの一覧（新しいものが上）。
   * 出ている行だけを描く。入りきらないぶんは右端のバーで送る
   */
  PatchNoteScene.prototype._renderVersionList = function () {
    var L = this.layout.list;
    this.panel.drawBox({ x: L.x, y: L.y - 10, w: L.w, h: L.h });
    this.list.render(this.game.clock);
  };

  /** バージョン1行（row の上端 y から描く）。バーが出ているときはその幅を空ける */
  PatchNoteScene.prototype._renderVersionRow = function (row, y, selected) {
    var L = this.layout.list;
    var t = this.theme;
    var version = row.version;
    var w = L.w - this.list.barSpace();

    if (selected) {
      this.panel.ctx.fillStyle = this.layout.selectedBg || "rgba(74,107,168,0.3)";
      this.panel.ctx.fillRect(L.x + 2, y, w - 4, L.rowHeight - 4);
    }

    this.panel.drawText(version.version, L.x + 12, y + 20,
      { color: selected ? t.cursorColor : t.textColor });
    this.panel.drawText(version.date || "", L.x + w - 12, y + 20,
      { align: "right", font: t.smallFont, color: t.hintColor });
    // ひとこと説明は枠より長くなることがあるので、はみ出すぶんは「…」で切る
    this.panel.drawText(clipText(this.panel, version.summary || "", w - 24, t.smallFont),
      L.x + 12, y + 38, { font: t.smallFont, color: t.subTextColor });
  };

  /** 右：選んでいるバージョンの内容 */
  PatchNoteScene.prototype._renderNotes = function () {
    var N = this.layout.notes;
    var t = this.theme;

    this.panel.drawBox(N);

    var version = this.getSelected();
    if (!version) return;

    var origin = this.panel.innerOrigin(N);
    var lh = t.lineHeight || 18;

    // 見出し（バージョン名）
    this.panel.drawText(version.version + "　" + (version.summary || ""),
      origin.x, origin.y + 16,
      { color: (this.focus === "notes") ? t.cursorColor : t.textColor });

    // まだ中身の無いバージョン（開発中）は、空欄に見えないよう一言出す
    if (this.notes.rows.length === 0) {
      this.panel.drawText(this.texts.empty || "", origin.x, origin.y + 44,
        { font: t.smallFont, color: t.hintColor });
      return;
    }

    this.notes.render();
  };

  /** 内容の1行（y は文字の下端） */
  PatchNoteScene.prototype._renderNoteLine = function (line, y) {
    var t = this.theme;
    var x = this.panel.innerOrigin(this.layout.notes).x;
    var textX = x + (this.layout.tag || {}).w + 10;

    if (line.tag) this._drawTag(line.tag, x, y);
    if (line.heading) {
      // 見出しは札の位置から書き始め、目立つ色にする
      this.panel.drawText(line.text, x, y,
        { font: t.font, color: this.layout.sectionColor || t.cursorColor });
    } else if (line.text) {
      this.panel.drawText(line.text, textX, y, { font: t.smallFont, color: t.textColor });
    }
  };

  PatchNoteScene.prototype._renderHint = function () {
    var pos = this.layout.hint || { x: 48, y: 570 };
    var hint = (this.focus === "notes") ? this.texts.hintNotes : this.texts.hintList;

    this.panel.drawText(hint || "", pos.x, pos.y,
      { font: this.theme.smallFont, color: this.theme.hintColor });
  };

  /**
   * 決められた幅に収まるよう、はみ出すぶんを「…」に置き換える。
   *
   * 文字数ではなく**実際に測った幅**で切る。
   * 全角と半角が混ざる（「α-1」と日本語）ので、文字数では合わないため。
   */
  function clipText(panel, text, maxWidth, font) {
    var ctx = panel.ctx;
    ctx.save();
    ctx.font = font || panel.theme.smallFont || "12px monospace";

    if (ctx.measureText(text).width <= maxWidth) {
      ctx.restore();
      return text;
    }

    var cut = text;
    while (cut.length > 1 && ctx.measureText(cut + "…").width > maxWidth) {
      cut = cut.slice(0, -1);
    }
    ctx.restore();
    return cut + "…";
  }

  /** 文字数で折り返す（等幅フォント前提の簡易処理） */
  // 折り返しは共通（js/namespace.js の MyGame.wrapText。行の頭に句読点を置かない）
  function wrapText(text, charsPerLine) {
    return NS.wrapText(text, charsPerLine);
  }

  NS.PatchNoteScene = PatchNoteScene;
})(window.MyGame);
