/**
 * NameInput.js
 * 名前をつけるための入力欄。
 *
 * ▼ しくみ（2026-10-27 文字盤から作り替えた。作者の指定）
 * ゲーム画面は Canvas なので、そのままでは日本語入力（IME）が使えない。
 * そこで、Canvas の上にふつうの文字入力欄（<input>）を重ねて置く。
 * キーボードで打てて、漢字・英字・記号も使える（スマホでは画面のキーボードが出る）。
 * 欄の位置と大きさは、画面が拡大縮小されても Canvas に合わせて毎フレーム置き直す。
 *
 * 入力欄に文字を打っているあいだ、ゲームのキー操作は止まる（js/core/Input.js が入力欄のキーを拾わない）。
 *
 * 最大文字数は data/naming.js、置き場所と色は data/ui.js の nameInput が持つ。
 *
 * ▼ 操作
 *   Enter          … 決める（変換中の Enter は変換の確定に使われ、決めない）
 *   Esc / 右クリック … やめる
 *   「けってい」「やめる」のボタンはマウスでも押せる
 *
 * 使い方
 *   this.nameInput = new MyGame.NameInput(panel, game.data);
 *   this.nameInput.open("スライム", "見出し", 10);
 *   update: var r = this.nameInput.handleInput(input);
 *           r && r.type === "done"   → r.name が決まった名前
 *           r && r.type === "cancel" → やめた
 *   render: this.nameInput.render(clock);
 */
(function (NS) {
  "use strict";

  /**
   * @param {MyGame.Panel} panel
   * @param {MyGame.GameData} gameData
   */
  function NameInput(panel, gameData) {
    this.panel = panel;
    this.data = gameData;
    this.config = gameData.naming || {};
    this.layout = ((gameData.ui || {}).nameInput) || {};
    this.texts = ((gameData.messages || {}).naming) || {};

    this.text = "";
    this.title = "";
    this.maxLength = this.config.maxLength || 10;
    this.isOpen = false;
    this._result = null;
    this._field = null;
    this._composing = false;
    this._focusRow = 0;   // キーボードで欄の外にいるとき：0 けってい / 1 やめる
  }

  /** 文字数（漢字・絵文字も1文字と数える） */
  NameInput.countChars = function (text) {
    return charsOf(text).length;
  };

  /** 長すぎるぶんを切る */
  NameInput.clip = function (text, max) {
    var chars = charsOf(text);
    return chars.length > max ? chars.slice(0, max).join("") : String(text || "");
  };

  /**
   * 入力欄を開く。
   * @param {string} [initialName] 最初から入れておく名前
   * @param {string} [title] 上に出す見出し
   * @param {number} [maxLength] 最大文字数（省略すると naming.js の maxLength）
   */
  NameInput.prototype.open = function (initialName, title, maxLength) {
    this.maxLength = maxLength || this.config.maxLength || 10;
    this.text = NameInput.clip(initialName || "", this.maxLength);
    this.title = title || "";
    this.isOpen = true;
    this._result = null;
    this._composing = false;

    var field = this._ensureField();
    field.value = this.text;
    field.style.display = "block";
    this._place();
    // 開いた直後のキー（名前を変えるを選んだ決定キー）を拾わないよう、1拍おいてから入れる
    setTimeout(function () {
      field.focus();
      try { field.setSelectionRange(field.value.length, field.value.length); } catch (e) { /* 古い環境 */ }
    }, 0);
  };

  /** 入力欄を閉じる（結果を返したときに自分で呼ぶ） */
  NameInput.prototype.close = function () {
    this.isOpen = false;
    if (this._field) {
      this._field.blur();
      this._field.style.display = "none";
    }
  };

  // --- 入力欄（<input>）---

  NameInput.prototype._ensureField = function () {
    if (this._field) return this._field;

    var self = this;
    var field = document.createElement("input");
    field.type = "text";
    field.autocomplete = "off";
    field.spellcheck = false;
    field.setAttribute("aria-label", this.texts.fieldLabel || "名前");
    field.style.cssText = "position:fixed;display:none;box-sizing:border-box;margin:0;" +
      "padding:0 8px;border:2px solid #ffd75e;border-radius:0;outline:none;" +
      "background:#080a14;color:#e8eaf0;font-family:monospace;z-index:10;";

    field.addEventListener("compositionstart", function () { self._composing = true; });
    field.addEventListener("compositionend", function () {
      self._composing = false;
      self._syncFromField();
    });
    field.addEventListener("input", function () {
      if (!self._composing) self._syncFromField();
      else self.text = field.value;
    });
    field.addEventListener("keydown", function (e) {
      // 変換中の Enter / Esc は IME のもの（keyCode 229 は変換中の印。古いブラウザ向け）
      if (e.isComposing || self._composing || e.keyCode === 229) return;
      if (e.key === "Enter") {
        e.preventDefault();
        self._syncFromField();
        self._result = { type: "done", name: self.text };
      } else if (e.key === "Escape") {
        e.preventDefault();
        self._result = { type: "cancel" };
      } else if (e.key === "ArrowDown" || e.key === "Tab") {
        // 欄から下のボタンへ移る（キーボードだけでも「やめる」を選べるように）
        e.preventDefault();
        self._focusRow = 0;
        field.blur();
      }
    });

    document.body.appendChild(field);
    this._field = field;
    return field;
  };

  /** 欄の中身を最大文字数に収めて、this.text に写す */
  NameInput.prototype._syncFromField = function () {
    var field = this._field;
    if (!field) return;
    var clipped = NameInput.clip(field.value.replace(/[\r\n\t]/g, ""), this.maxLength);
    if (clipped !== field.value) field.value = clipped;
    this.text = clipped;
  };

  /** Canvas 上の欄の矩形を、画面（CSS）の位置に直して欄を置く */
  NameInput.prototype._place = function () {
    var field = this._field;
    var F = this.layout.field;
    var canvas = this.panel.ctx && this.panel.ctx.canvas;
    if (!field || !F || !canvas) return;

    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var sx = rect.width / canvas.width;
    var sy = rect.height / canvas.height;

    field.style.left = (rect.left + F.x * sx) + "px";
    field.style.top = (rect.top + F.y * sy) + "px";
    field.style.width = (F.w * sx) + "px";
    field.style.height = (F.h * sy) + "px";
    field.style.fontSize = Math.round((F.fontSize || 20) * sy) + "px";
  };

  // --- 入力 ---

  /**
   * @returns {null | {type:"done", name:string} | {type:"cancel"}}
   */
  NameInput.prototype.handleInput = function (input) {
    if (!this.isOpen) return null;

    var result = this._result;
    this._result = null;

    var focused = this._field && document.activeElement === this._field;
    var pointer = input.getPointer ? input.getPointer() : null;

    if (!result && pointer && pointer.inside) {
      if (pointer.moved) {
        if (NS.Panel.containsPoint(this._buttonRect(0), pointer)) this._focusRow = 0;
        else if (NS.Panel.containsPoint(this._buttonRect(1), pointer)) this._focusRow = 1;
      }
      if (pointer.clicked) {
        if (NS.Panel.containsPoint(this._buttonRect(0), pointer)) {
          this._syncFromField();
          result = { type: "done", name: this.text };
        } else if (NS.Panel.containsPoint(this._buttonRect(1), pointer)) {
          result = { type: "cancel" };
        } else if (this._field) {
          // 欄の外を押して入力が外れたら、欄へ戻す
          this._field.focus();
        }
      }
    }

    // 欄の外にいるとき（↓/Tab で抜けた・ほかを押した）は、ゲームのキーでボタンを選ぶ
    if (!result && !focused) {
      if (input.isPressed("left") || input.isPressed("right")) this._focusRow = 1 - this._focusRow;
      if (input.isPressed("up") && this._field) this._field.focus();
      if (input.isPressed("confirm")) {
        result = (this._focusRow === 0) ? { type: "done", name: this.text } : { type: "cancel" };
      }
    }
    // 右クリック（取り消し）は欄の中にいても効く
    if (!result && pointer && pointer.right) result = { type: "cancel" };
    if (!result && !focused && input.isPressed("cancel")) result = { type: "cancel" };

    if (result) this.close();
    return result;
  };

  // --- ボタンの位置 ---

  /** 0 けってい / 1 やめる */
  NameInput.prototype._buttonRect = function (index) {
    var B = this.layout.buttons || { x: 0, y: 0, w: 120, h: 32, gap: 16 };
    return { x: B.x + index * (B.w + B.gap), y: B.y, w: B.w, h: B.h };
  };

  // --- 描画 ---

  NameInput.prototype.render = function (clock) {
    var t = this.panel.theme;
    var L = this.layout;

    // 画面の大きさが変わっても欄がずれないよう、毎フレーム置き直す
    if (this.isOpen) this._place();

    // 後ろの画面を暗くして、入力欄だけが目に入るようにする（窓は半透明なので、後ろの文字と重なって読みにくい）
    var ctx = this.panel.ctx;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (L.box) this.panel.drawBox(L.box);

    if (this.title && L.title) {
      this.panel.drawText(this.title, L.title.x, L.title.y,
        { font: t.font, color: t.textColor });
    }

    this._renderFieldFrame();
    this._renderCount();
    this._renderButtons();
    this._renderHint();
  };

  /** 欄の後ろの枠（<input> が出るまでの一瞬や、欄が外れたときにも場所が分かるように） */
  NameInput.prototype._renderFieldFrame = function () {
    var F = this.layout.field;
    if (!F) return;
    var ctx = this.panel.ctx;
    ctx.fillStyle = "rgba(8,10,20,0.9)";
    ctx.fillRect(F.x, F.y, F.w, F.h);
    ctx.strokeStyle = this.panel.theme.panelBorder || "#3a4266";
    ctx.lineWidth = 1;
    ctx.strokeRect(F.x + 0.5, F.y + 0.5, F.w - 1, F.h - 1);
  };

  /** あと何文字入るか（「4 / 10」） */
  NameInput.prototype._renderCount = function () {
    var C = this.layout.count;
    if (!C) return;
    var t = this.panel.theme;
    var n = NameInput.countChars(this.text);
    var full = n >= this.maxLength;
    this.panel.drawText(n + " / " + this.maxLength, C.x, C.y,
      { align: C.align || "right", font: t.smallFont,
        color: full ? (t.cursorColor || "#ffd75e") : t.subTextColor });
  };

  NameInput.prototype._renderButtons = function () {
    var labels = [this.texts.done || "けってい", this.texts.cancel || "やめる"];
    var focused = this._field && document.activeElement === this._field;
    for (var i = 0; i < labels.length; i++) {
      this._drawButton(this._buttonRect(i), labels[i], !focused && this._focusRow === i);
    }
  };

  NameInput.prototype._drawButton = function (rect, label, selected) {
    var t = this.panel.theme;
    var ctx = this.panel.ctx;

    ctx.fillStyle = selected ? (t.buttonHoverBg || "rgba(74,107,168,0.45)") : "rgba(8,10,20,0.8)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = selected ? (t.cursorColor || "#ffd75e") : (t.panelBorder || "#3a4266");
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);

    this.panel.drawText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 5, {
      align: "center", font: t.font || "14px monospace",
      color: selected ? (t.cursorColor || "#ffd75e") : t.textColor
    });
  };

  NameInput.prototype._renderHint = function () {
    var H = this.layout.hint;
    if (!H) return;
    var lines = String(this.texts.hint || "").replace("{max}", this.maxLength).split("\n");
    for (var i = 0; i < lines.length; i++) {
      this.panel.drawText(lines[i], H.x, H.y + i * (H.lineHeight || 18),
        { align: H.align || "left", font: this.panel.theme.smallFont, color: this.panel.theme.hintColor });
    }
  };

  /** 文字列を1文字ずつに分ける（サロゲートペアの漢字・絵文字を2文字と数えないように） */
  function charsOf(text) {
    var s = String(text || "");
    return Array.from ? Array.from(s) : s.split("");
  }

  NS.NameInput = NameInput;
})(window.MyGame);
