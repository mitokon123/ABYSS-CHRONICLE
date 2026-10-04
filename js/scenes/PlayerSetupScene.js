/**
 * PlayerSetupScene.js
 * 主人公の名前・服の色・性別・一人称を決める画面。
 *
 * ▼ 2つの入口から同じ画面を使う
 *   ・新しく始めるとき（セーブファイルを選んだ直後）
 *   ・拠点の「設定」から、あとで変えたいとき
 *   決めるものは同じなので、画面を2つ作らない。
 *   違うのは**やめたときにどこへ戻るか**だけ（mode）。
 *
 * ▼ mode
 *   "new"  … 新規。やめてもタイトルへは戻さず、そのまま決めてもらう
 *            （名前と色が決まらないまま冒険に出ると、あとで直す入口が遠い）
 *   "edit" … あとから変更。Esc でそのまま戻れる
 *
 * ▼ 色は「選んだ姿」をその場で見せる
 *   色の名前だけ並べても、着せたところが想像できない。
 *   選んでいる色の絵を大きく出し、歩かせて見せる。
 *
 * ▼ 色は用意した6色のほかに「じぶんで」作れる（RC-1）
 *   色見本のいちばん右が「じぶんで」。そこで決定を押すと、色合い・あざやかさ・明るさの
 *   3本のつまみで色を作る窓が開く（phase "color"）。できた色は色コード（#rrggbb）のまま
 *   セーブに入り、絵は js/systems/PlayerLook.js がその場で作る。
 *   色コードを文字で打つ形にしなかったのは、A・D・E などのキーが移動や決定に使われていて、
 *   打った文字と操作がぶつかるため。
 *
 * ▼ 性別と一人称は、ゲームの進み方には何も影響しない（data/player.js）
 *   一人称だけは、物語の台詞の {me} に差し込まれる。
 *
 * 配置は data/ui.js の playerSetup、文言は data/messages.js の playerSetup。
 * 色・性別・一人称の選択肢は data/player.js。
 */
(function (NS) {
  "use strict";

  // 上から並ぶ欄。left/right で選ぶのは color / gender / firstPerson の3つ
  var ROWS = ["name", "color", "gender", "firstPerson", "done"];

  function PlayerSetupScene(game, returnScene, mode) {
    this.game = game;
    this.returnScene = returnScene;
    this.mode = (mode === "edit") ? "edit" : "new";

    var ui = game.data.ui || {};
    this.theme = ui.theme || {};
    this.layout = ui.playerSetup || {};
    this.texts = (game.data.messages || {}).playerSetup || {};

    this.panel = new NS.Panel(game.ctx, this.theme);
    this.sprites = new NS.SpriteRenderer(game.ctx, game.assets);
    this.renderer = new NS.Renderer(game.ctx);
    this.nameInput = new NS.NameInput(this.panel, game.data);
    this.backButton = new NS.BackButton(this.panel, game.data);

    var player = game.data.player || {};
    this.colors = NS.PlayerLook.colorsOf(game.data);
    this.genders = player.genders || [];
    this.firstPersons = player.firstPersons || [];

    // いまの値から始める（あとから変えるときは、今の名前と色が入っている）
    this.name = game.getPlayerName();

    // 色見本は用意した色のあとに「じぶんで」が1つ並ぶ（customIndex がその番号）
    var current = game.getPlayerColor();
    this.customIndex = this.colors.length;
    if (NS.PlayerLook.isCustom(current)) {
      this.colorIndex = this.customIndex;
      this.customHex = current;
    } else {
      this.colorIndex = this._indexOfColor(current);
      // まだ作っていなければ、いま着ている色から作り始める
      var preset = this.colors[this.colorIndex];
      this.customHex = (preset && preset.base) || "#4a7fe0";
    }
    this.editor = null;   // 色を作る窓を開いているあいだの値（_openColorEditor）
    this._repeatAt = 0;   // 左右を押し続けたときに、次に動かす時刻
    this.genderIndex = indexById(this.genders, game.getPlayerGender());
    this.firstPersonIndex = Math.max(0, this.firstPersons.indexOf(game.getPlayerFirstPerson()));

    // "main" … 欄を選ぶ / "name" … 文字盤を開いている
    this.phase = "main";
    this.row = 0;   // ROWS の何番目か
  }

  PlayerSetupScene.prototype.enter = function () {
    this.phase = "main";
  };

  PlayerSetupScene.prototype._indexOfColor = function (colorId) {
    return indexById(this.colors, colorId);
  };

  /** 選んでいる色のid（用意した色のid か、自分で作った色の色コード） */
  PlayerSetupScene.prototype._currentColorId = function () {
    if (this.colorIndex === this.customIndex) return this.customHex;
    var color = this.colors[this.colorIndex];
    return color ? color.id : null;
  };

  /** 選んでいる色の定義（名前・色）。自分で作った色は名前が色コード */
  PlayerSetupScene.prototype._currentColor = function () {
    var id = this._currentColorId();
    return id ? NS.PlayerLook.colorDef(this.game.data, id) : null;
  };

  PlayerSetupScene.prototype._rowKind = function () {
    return ROWS[this.row];
  };

  function indexById(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return i;
    }
    return 0;
  }

  // --- 選択肢（左右で送るもの）---

  /**
   * 左右で選ぶ欄の中身。欄ごとに「いくつあるか」「いま何番目か」を1か所で扱う。
   * @returns {{count:number, get:function, set:function}|null}
   */
  PlayerSetupScene.prototype._choiceOf = function (kind) {
    var self = this;
    if (kind === "color") {
      // 用意した色 ＋「じぶんで」
      return { count: this.colors.length + 1,
               get: function () { return self.colorIndex; },
               set: function (i) { self.colorIndex = i; } };
    }
    if (kind === "gender") {
      return { count: this.genders.length,
               get: function () { return self.genderIndex; },
               set: function (i) { self.genderIndex = i; } };
    }
    if (kind === "firstPerson") {
      return { count: this.firstPersons.length,
               get: function () { return self.firstPersonIndex; },
               set: function (i) { self.firstPersonIndex = i; } };
    }
    return null;
  };

  /** 性別・一人称の札に書く文字 */
  PlayerSetupScene.prototype._chipLabels = function (kind) {
    if (kind === "gender") {
      var names = [];
      for (var i = 0; i < this.genders.length; i++) names.push(this.genders[i].name || "");
      return names;
    }
    if (kind === "firstPerson") return this.firstPersons.slice();
    return [];
  };

  // --- 更新 ---

  PlayerSetupScene.prototype.update = function () {
    if (this.phase === "name") this._updateName();
    else if (this.phase === "color") this._updateColorEditor();
    else this._updateMain();
  };

  PlayerSetupScene.prototype._updateName = function () {
    var result = this.nameInput.handleInput(this.game.input);
    if (!result) return;

    if (result.type === "done") {
      // 空のまま決めた場合は、既定の呼び名に戻す
      this.name = result.name || (this.game.data.player || {}).defaultName || "";
    }
    this.phase = "main";
  };

  PlayerSetupScene.prototype._updateMain = function () {
    var input = this.game.input;

    // あとから変更のときだけ、そのまま戻れる
    if (this.mode === "edit" &&
        (this.backButton.handleInput(input) || input.isPressed("cancel"))) {
      this.game.scenes.change(this.returnScene);
      return;
    }

    if (input.isPressed("up")) this.row = (this.row + ROWS.length - 1) % ROWS.length;
    if (input.isPressed("down")) this.row = (this.row + 1) % ROWS.length;

    // 左右は、選ぶものがある欄にいるときだけ効く（別の欄にいて替わると迷う）
    var choice = this._choiceOf(this._rowKind());
    if (choice && choice.count > 0) {
      if (input.isPressed("left")) choice.set((choice.get() - 1 + choice.count) % choice.count);
      if (input.isPressed("right")) choice.set((choice.get() + 1) % choice.count);
    }

    this._handleMouse(input);

    if (input.isPressed("confirm")) this._activateRow();
  };

  /** 色見本・札・名前の欄・決定のボタンを直接押せるようにする */
  PlayerSetupScene.prototype._handleMouse = function (input) {
    if (!input.getPointer) return;

    var pointer = input.getPointer();
    if (!pointer.inside) return;

    // 色見本・性別・一人称の札
    var kinds = ["color", "gender", "firstPerson"];
    for (var k = 0; k < kinds.length; k++) {
      var choice = this._choiceOf(kinds[k]);
      for (var i = 0; i < choice.count; i++) {
        if (!NS.Panel.containsPoint(this._optionRect(kinds[k], i), pointer)) continue;
        if (pointer.moved || pointer.clicked) {
          this.row = ROWS.indexOf(kinds[k]);
          choice.set(i);
        }
        // 「じぶんで」の見本を押したら、色を作る窓を開く
        if (pointer.clicked && kinds[k] === "color" && i === this.customIndex) this._openColorEditor();
        return;
      }
    }

    // 名前の欄と決定のボタン
    if (NS.Panel.containsPoint(this._rowRect(ROWS.indexOf("name")), pointer)) {
      if (pointer.moved) this.row = ROWS.indexOf("name");
      if (pointer.clicked) this._openNameInput();
    } else if (NS.Panel.containsPoint(this._doneRect(), pointer)) {
      if (pointer.moved) this.row = ROWS.indexOf("done");
      if (pointer.clicked) this._finish();
    }
  };

  PlayerSetupScene.prototype._activateRow = function () {
    var kind = this._rowKind();
    if (kind === "name") this._openNameInput();
    else if (kind === "done") this._finish();
    // 「じぶんで」を選んでいるときだけ、決定で色を作る窓を開く
    else if (kind === "color" && this.colorIndex === this.customIndex) this._openColorEditor();
    // ほかの選ぶ欄で決定を押しても何もしない（左右で選ぶものなので）
  };

  // --- 色を作る窓 ---

  var SLIDERS = ["h", "s", "l"];   // 色合い・あざやかさ・明るさ。4行目は「決める／やめる」
  var EDITOR_ROWS = SLIDERS.length + 1;
  var SLIDER_RANGE = { h: [0, 359], s: [0, 100], l: [5, 95] };

  PlayerSetupScene.prototype._openColorEditor = function () {
    var hsl = NS.PlayerLook.hexToHsl(this.customHex);
    this.editor = { h: hsl.h, s: hsl.s, l: Math.max(5, Math.min(95, hsl.l)),
                    row: 0, button: 0, original: this.customHex, dragging: -1 };
    this.colorIndex = this.customIndex;
    this.phase = "color";
  };

  /** 窓を閉じる。apply が false なら開く前の色に戻す */
  PlayerSetupScene.prototype._closeColorEditor = function (apply) {
    if (!apply && this.editor) this.customHex = this.editor.original;
    this.editor = null;
    this.phase = "main";
  };

  /** つまみの値から色コードを作り直す（左の姿もその場で変わる） */
  PlayerSetupScene.prototype._applyEditor = function () {
    var E = this.editor;
    this.customHex = NS.PlayerLook.hslToHex(E.h, E.s, E.l);
  };

  PlayerSetupScene.prototype._stepSlider = function (index, direction) {
    var E = this.editor;
    var key = SLIDERS[index];
    var step = ((this.layout.colorEditor || {}).step || {})[key] || 5;
    var range = SLIDER_RANGE[key];
    var value = E[key] + step * direction;
    // 色合いだけは輪になっている（赤の先はまた赤）
    if (key === "h") value = (value % 360 + 360) % 360;
    else value = Math.max(range[0], Math.min(range[1], value));
    E[key] = value;
    this._applyEditor();
  };

  /**
   * 左右の向き（押した瞬間と、押し続けたとき）。
   * 押し続けると少し待ってから続けて動く。色合いは1周が長いので、これが無いと疲れる
   */
  PlayerSetupScene.prototype._heldDirection = function (input) {
    var C = this.layout.colorEditor || {};
    var now = this.game.clock || 0;
    if (input.isPressed("left") || input.isPressed("right")) {
      this._repeatAt = now + (C.repeatDelayMs || 320);
      return input.isPressed("left") ? -1 : 1;
    }
    var held = input.isDown("left") ? -1 : (input.isDown("right") ? 1 : 0);
    if (held && now >= this._repeatAt) {
      this._repeatAt = now + (C.repeatMs || 45);
      return held;
    }
    return 0;
  };

  PlayerSetupScene.prototype._updateColorEditor = function () {
    var input = this.game.input;
    var E = this.editor;

    if (input.isPressed("cancel")) { this._closeColorEditor(false); return; }

    if (input.isPressed("up")) E.row = (E.row + EDITOR_ROWS - 1) % EDITOR_ROWS;
    if (input.isPressed("down")) E.row = (E.row + 1) % EDITOR_ROWS;

    if (E.row < SLIDERS.length) {
      var direction = this._heldDirection(input);
      if (direction) this._stepSlider(E.row, direction);
    } else if (input.isPressed("left") || input.isPressed("right")) {
      E.button = E.button ? 0 : 1;
    }

    if (this._editorMouse(input)) return;

    // 「やめる」を選んで決定したときだけ戻す。ほかはどこで決定しても決める
    if (input.isPressed("confirm")) this._closeColorEditor(!(E.row === SLIDERS.length && E.button === 1));
  };

  /** つまみの棒の四角（画面の座標） */
  PlayerSetupScene.prototype._barRect = function (index) {
    var C = this.layout.colorEditor || {};
    var b = C.bar || {};
    return { x: C.box.x + b.x, y: C.box.y + b.y + (b.gap || 44) * index, w: b.w, h: b.h };
  };

  /** 「決める」(0)・「やめる」(1) の四角 */
  PlayerSetupScene.prototype._editorButtonRect = function (index) {
    var C = this.layout.colorEditor || {};
    var B = C.buttons || {};
    var total = B.w * 2 + (B.gap || 0);
    var x0 = C.box.x + C.box.w - 24 - total;
    return { x: x0 + (B.w + (B.gap || 0)) * index, y: C.box.y + B.y, w: B.w, h: B.h };
  };

  /**
   * マウス：棒を押す・つまんで動かすと値が変わる。ボタンを押すと閉じる。
   * @returns {boolean} 窓を閉じたか
   */
  PlayerSetupScene.prototype._editorMouse = function (input) {
    if (!input.getPointer) return false;
    var pointer = input.getPointer();
    var E = this.editor;

    if (!pointer.down) E.dragging = -1;

    for (var i = 0; i < SLIDERS.length; i++) {
      var bar = this._barRect(i);
      // 押しやすいよう、上下に少し広めに当たりを取る
      var hit = { x: bar.x - 4, y: bar.y - 8, w: bar.w + 8, h: bar.h + 16 };
      var over = pointer.inside && NS.Panel.containsPoint(hit, pointer);
      // 押したまま動かす（つまむ）か、棒の上で押して離す（すばやいクリックは押している間が1コマも無い）
      var grabbing = pointer.down && (E.dragging === i || (E.dragging < 0 && over));
      if (grabbing || (pointer.clicked && over && E.dragging < 0)) {
        if (pointer.down) E.dragging = i;
        E.row = i;
        var key = SLIDERS[i];
        var range = SLIDER_RANGE[key];
        var ratio = Math.max(0, Math.min(1, (pointer.x - bar.x) / bar.w));
        E[key] = Math.round(range[0] + (range[1] - range[0]) * ratio);
        this._applyEditor();
      } else if (over && pointer.moved && E.dragging < 0) {
        E.row = i;
      }
    }

    if (!pointer.inside || E.dragging >= 0) return false;
    for (var b = 0; b < 2; b++) {
      if (!NS.Panel.containsPoint(this._editorButtonRect(b), pointer)) continue;
      if (pointer.moved) { E.row = SLIDERS.length; E.button = b; }
      if (pointer.clicked) { this._closeColorEditor(b === 0); return true; }
    }
    return false;
  };

  PlayerSetupScene.prototype._openNameInput = function () {
    this.nameInput.open(this.name, this.texts.nameTitle || "");
    this.phase = "name";
  };

  /** 決めた内容をゲームへ移して、次の画面へ進む */
  PlayerSetupScene.prototype._finish = function () {
    var color = this._currentColor();
    var gender = this.genders[this.genderIndex];

    this.game.playerName = this.name;
    // 自分で作った色は色コード（#rrggbb）のまま入る
    this.game.playerColor = color ? color.id : null;
    this.game.playerGender = gender ? gender.id : null;
    this.game.playerFirstPerson = this.firstPersons[this.firstPersonIndex] || null;

    if (this.mode === "edit") {
      this.game.scenes.change(this.returnScene);
      return;
    }
    // 新規のときは、ここから冒険が始まる。オープニングを流してから拠点へ
    this.game.playStory("newGame", new NS.HomeScene(this.game));
  };

  // --- 位置 ---

  PlayerSetupScene.prototype._rowRect = function (index) {
    var r = this.layout.rows || { x: 310, y: 122, w: 442, h: 62, gap: 12 };
    return { x: r.x, y: r.y + (r.h + (r.gap || 0)) * index, w: r.w, h: r.h };
  };

  /** 選ぶ欄の、i 番目の選択肢の四角（色は色見本、性別・一人称は札） */
  PlayerSetupScene.prototype._optionRect = function (kind, i) {
    if (kind === "color") {
      var s = this.layout.swatch || { x: 420, y: 210, size: 34, gap: 12 };
      return { x: s.x + (s.size + (s.gap || 0)) * i, y: s.y, w: s.size, h: s.size };
    }
    var c = this.layout.chip || { x: 420, w: 48, h: 30, gap: 6 };
    var row = this._rowRect(ROWS.indexOf(kind));
    return {
      x: c.x + (c.w + (c.gap || 0)) * i,
      y: row.y + Math.floor((row.h - c.h) / 2),
      w: c.w, h: c.h
    };
  };

  PlayerSetupScene.prototype._doneRect = function () {
    return this.layout.done || { x: 310, y: 426, w: 442, h: 52 };
  };

  // --- 描画 ---

  PlayerSetupScene.prototype.render = function (ctx) {
    var L = this.layout;

    this.renderer.clear(L.background || "#0a0f1c",
      this.game.canvas.width, this.game.canvas.height);

    var title = L.title || {};
    var subtitle = L.subtitle || {};
    var heading = (this.mode === "new") ? this.texts.titleNew : this.texts.titleEdit;

    this.panel.drawText(heading || "", title.x, title.y,
      { font: title.font, color: title.color });
    this.panel.drawText(this.texts.subtitle || "", subtitle.x, subtitle.y,
      { font: subtitle.font, color: subtitle.color });

    this._renderPreview();
    this._renderNameRow();
    this._renderColorRow();
    this._renderChipRow("gender", this.texts.genderLabel || "性別");
    this._renderChipRow("firstPerson", this.texts.firstPersonLabel || "一人称");
    this._renderDone();
    this._renderHint();

    if (this.mode === "edit") this.backButton.render();

    // 文字盤と色を作る窓は、開いているあいだ全部の上に重ねる
    if (this.phase === "name") this.nameInput.render(this.game.clock);
    if (this.phase === "color") {
      this._renderColorEditor();
      this._renderHint();   // 窓の操作説明は暗幕より上に出す
    }
  };

  /** 左：選んでいる色で、実際に歩いているところを見せる */
  PlayerSetupScene.prototype._renderPreview = function () {
    var p = this.layout.preview;
    if (!p) return;

    this.panel.drawBox({ x: p.boxX, y: p.boxY, w: p.boxW, h: p.boxH });

    var color = this._currentColor();
    var sprites = NS.PlayerLook.spritesFor(this.game.data, color ? color.id : null);
    var look = NS.PlayerLook.appearanceOf(this.game.data);

    // 立ち姿ではなく歩いているところを出す。実際に動く姿が分かるように
    var motion = NS.Motion.forSprite(this.game.data, sprites,
      look.walkMotion || "playerWalk", this.game.clock, 0);

    this.sprites.drawMotion(sprites,
      p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, motion);

    if (color) {
      this.panel.drawText(color.name || "", p.x, p.labelY,
        { align: "center", color: this.theme.subTextColor });
    }
  };

  /** 欄の枠と、左の見出し。選んでいれば枠を光らせる */
  PlayerSetupScene.prototype._renderRowFrame = function (kind, label) {
    var rect = this._rowRect(ROWS.indexOf(kind));
    var selected = (this._rowKind() === kind) && this.phase === "main";

    this.panel.drawBox(rect);
    if (selected) this._outline(rect);

    var origin = this.panel.innerOrigin(rect);
    this.panel.drawText(label, origin.x, rect.y + rect.h / 2 + 5,
      { font: this.theme.smallFont, color: this.theme.subTextColor });
    return { rect: rect, selected: selected };
  };

  PlayerSetupScene.prototype._renderNameRow = function () {
    var frame = this._renderRowFrame("name", this.texts.nameLabel || "なまえ");
    var rect = frame.rect;
    var t = this.theme;
    var chips = this.layout.chip || { x: 420 };
    var baseY = rect.y + rect.h / 2 + 6;

    this.panel.drawText(this.name || "", chips.x, baseY,
      { color: frame.selected ? t.cursorColor : t.textColor });
    this.panel.drawText(this.texts.nameAction || "", rect.x + rect.w - 12, baseY,
      { align: "right", font: t.smallFont, color: t.hintColor });
  };

  PlayerSetupScene.prototype._renderColorRow = function () {
    this._renderRowFrame("color", this.texts.colorLabel || "ふくの色");
    var t = this.theme;

    var ctx = this.panel.ctx;
    for (var i = 0; i <= this.colors.length; i++) {
      var sw = this._optionRect("color", i);
      var custom = (i === this.customIndex);
      ctx.save();
      ctx.fillStyle = custom ? this.customHex : (this.colors[i].base || "#888888");
      ctx.fillRect(sw.x, sw.y, sw.w, sw.h);
      // 選んでいる色だけ枠を付ける。色そのものは変えない（見本なので）
      ctx.strokeStyle = (i === this.colorIndex)
        ? (t.cursorColor || "#ffd75e")
        : (t.panelBorder || "#3a4560");
      ctx.lineWidth = (i === this.colorIndex) ? 3 : 1;
      ctx.strokeRect(sw.x, sw.y, sw.w, sw.h);
      ctx.restore();

      // 「じぶんで」の見本には、作れることが分かるよう右下に＋を付ける
      if (custom) {
        ctx.save();
        ctx.fillStyle = "rgba(10,15,28,0.75)";
        ctx.fillRect(sw.x + sw.w - 13, sw.y + sw.h - 13, 12, 12);
        ctx.restore();
        this.panel.drawText("+", sw.x + sw.w - 7, sw.y + sw.h - 3,
          { align: "center", font: t.smallFont, color: t.cursorColor });
      }
    }
  };

  /** 色を作る窓。後ろを暗く落として、3本のつまみと、できた色・色コードを出す */
  PlayerSetupScene.prototype._renderColorEditor = function () {
    var C = this.layout.colorEditor;
    var E = this.editor;
    if (!C || !E) return;

    var t = this.theme;
    var ctx = this.panel.ctx;
    var box = C.box;
    var labels = [this.texts.hueLabel || "色合い", this.texts.satLabel || "あざやかさ",
                  this.texts.lightLabel || "明るさ"];

    ctx.save();
    ctx.fillStyle = C.veil || "rgba(4,6,12,0.72)";
    ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    ctx.fillStyle = t.panelBg || "#0d1220";
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.restore();
    this.panel.drawBox(box);

    this.panel.drawText(this.texts.editorTitle || "", box.x + 24, box.y + 36,
      { color: t.cursorColor });

    for (var i = 0; i < SLIDERS.length; i++) {
      var bar = this._barRect(i);
      var selected = (E.row === i);
      this.panel.drawText(labels[i], box.x + 24, bar.y + bar.h - 2,
        { font: t.smallFont, color: selected ? t.cursorColor : t.subTextColor });
      this._renderSliderBar(i, bar, selected);
      this.panel.drawText(String(E[SLIDERS[i]]), bar.x + bar.w + 10, bar.y + bar.h - 2,
        { font: t.smallFont, color: t.subTextColor });
    }

    // できた色と色コード
    var S = C.swatch || {};
    var sx = box.x + S.x, sy = box.y + S.y;
    ctx.save();
    ctx.fillStyle = this.customHex;
    ctx.fillRect(sx, sy, S.size, S.size);
    ctx.strokeStyle = t.panelBorder || "#3a4560";
    ctx.strokeRect(sx + 0.5, sy + 0.5, S.size - 1, S.size - 1);
    ctx.restore();
    this.panel.drawText(this.customHex.toUpperCase(), sx + S.size + 12, sy + S.size / 2 + 5,
      { color: t.textColor });

    // 決める／やめる
    var names = [this.texts.editorOk || "決める", this.texts.editorCancel || "やめる"];
    for (var b = 0; b < 2; b++) {
      var r = this._editorButtonRect(b);
      var on = (E.row === SLIDERS.length && E.button === b);
      this.panel.drawBox(r);
      if (on) this._outline(r);
      this.panel.drawText(names[b], r.x + r.w / 2, r.y + r.h / 2 + 5,
        { align: "center", color: on ? t.cursorColor : t.textColor });
    }
  };

  /**
   * つまみの棒1本。棒そのものを「その値を動かすとどうなるか」の色の帯にする
   * （色合いの棒は虹、あざやかさは灰色→その色、明るさは黒→その色→白）
   */
  PlayerSetupScene.prototype._renderSliderBar = function (index, bar, selected) {
    var E = this.editor;
    var key = SLIDERS[index];
    var range = SLIDER_RANGE[key];
    var ctx = this.panel.ctx;
    var steps = 48;

    ctx.save();
    for (var k = 0; k < steps; k++) {
      var v = range[0] + (range[1] - range[0]) * (k / (steps - 1));
      // 色合いの帯は、あざやかさが低いと灰色一色になって選べないので、見やすい色で出す
      var h = key === "h" ? v : E.h;
      var s = key === "s" ? v : (key === "h" ? Math.max(E.s, 60) : E.s);
      var l = key === "l" ? v : (key === "h" ? 50 : E.l);
      ctx.fillStyle = NS.PlayerLook.hslToHex(Math.round(h) % 360, Math.round(s), Math.round(l));
      var x0 = bar.x + Math.floor(bar.w * k / steps);
      var x1 = bar.x + Math.floor(bar.w * (k + 1) / steps);
      ctx.fillRect(x0, bar.y, x1 - x0, bar.h);
    }
    ctx.strokeStyle = selected ? (this.theme.cursorColor || "#ffd75e") : (this.theme.panelBorder || "#3a4560");
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(bar.x - 0.5, bar.y - 0.5, bar.w + 1, bar.h + 1);

    // つまみ（白い縦の棒）
    var hw = ((this.layout.colorEditor || {}).bar || {}).handleW || 6;
    var ratio = (E[key] - range[0]) / (range[1] - range[0]);
    var hx = Math.round(bar.x + bar.w * ratio - hw / 2);
    ctx.fillStyle = "#0a0f1c";
    ctx.fillRect(hx - 1, bar.y - 4, hw + 2, bar.h + 8);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(hx, bar.y - 3, hw, bar.h + 6);
    ctx.restore();
  };

  /** 性別・一人称の欄。選択肢を札にして横に並べ、選んでいるものだけ光らせる */
  PlayerSetupScene.prototype._renderChipRow = function (kind, label) {
    this._renderRowFrame(kind, label);

    var t = this.theme;
    var c = this.layout.chip || {};
    var labels = this._chipLabels(kind);
    var current = this._choiceOf(kind).get();
    var ctx = this.panel.ctx;

    for (var i = 0; i < labels.length; i++) {
      var r = this._optionRect(kind, i);
      var on = (i === current);

      ctx.save();
      ctx.strokeStyle = on ? (t.cursorColor || "#ffd75e") : (t.panelBorder || "#3a4560");
      ctx.lineWidth = on ? 2 : 1;
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      ctx.restore();

      this.panel.drawText(labels[i], r.x + r.w / 2, r.y + r.h / 2 + 5,
        { align: "center", font: c.font || t.smallFont,
          color: on ? (t.cursorColor || "#ffd75e") : t.subTextColor });
    }
  };

  PlayerSetupScene.prototype._renderDone = function () {
    var rect = this._doneRect();
    var t = this.theme;
    var selected = (this._rowKind() === "done") && this.phase === "main";

    this.panel.drawBox(rect);
    if (selected) this._outline(rect);

    var label = (this.mode === "new") ? this.texts.start : this.texts.apply;
    this.panel.drawText(label || "", rect.x + rect.w / 2, rect.y + rect.h / 2 + 6,
      { align: "center", color: selected ? t.cursorColor : t.textColor });
  };

  /** 選んでいる欄を囲む */
  PlayerSetupScene.prototype._outline = function (rect) {
    var ctx = this.panel.ctx;
    ctx.save();
    ctx.strokeStyle = this.theme.cursorColor || "#ffd75e";
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
    ctx.restore();
  };

  PlayerSetupScene.prototype._renderHint = function () {
    var hint = this.layout.hint;
    if (!hint) return;

    var text;
    if (this.phase === "name") text = "";   // 文字盤が自分で案内を出す
    else if (this.phase === "color") text = this.texts.hintEditor;
    else if (this._rowKind() === "color" && this.colorIndex === this.customIndex) {
      // 「じぶんで」を選んでいるときは、決定で色を作れることを知らせる
      text = this.texts.hintCustom;
    } else text = (this.mode === "new" ? this.texts.hintNew : this.texts.hintEdit);

    this.panel.drawText(text || "", hint.x, hint.y,
      { font: this.theme.smallFont, color: this.theme.hintColor });
  };

  NS.PlayerSetupScene = PlayerSetupScene;
})(window.MyGame);
