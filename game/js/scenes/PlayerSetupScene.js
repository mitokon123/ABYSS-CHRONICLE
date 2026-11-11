/**
 * PlayerSetupScene.js
 * 主人公の名前・性別・一人称・見た目を決める画面。
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
 * ▼ 見た目は「選んだ姿」をその場で見せる
 *   名前だけ並べても、着せたところが想像できない。
 *   選んでいる姿を左に大きく出し、上下左右へ向きを変えながら歩かせて見せる。
 *
 * ▼ 見た目の欄（v1.2.0。新しい絵 js/systems/CharaRig.js が使えるとき）
 *   髪型・髪の色・ふくの色・ズボンの色・飾り。
 *   CharaRig.js が読めていない（古い app.html が残っている）ときは、今までどおり
 *   ふくの色だけを選ぶ画面になり、左には 32×32 の絵が歩く。
 *
 * ▼ 色は用意した色のほかに「じぶんで」作れる（RC-1。v1.2.0 から髪とズボンも）
 *   色見本のいちばん右が「じぶんで」。そこで決定を押すと、色合い・あざやかさ・明るさの
 *   3本のつまみで色を作る窓が開く（phase "color"）。できた色は色コード（#rrggbb）のまま
 *   セーブに入り、絵は js/systems/PlayerLook.js がその場で作る。
 *   色コードを文字で打つ形にしなかったのは、A・D・E などのキーが移動や決定に使われていて、
 *   打った文字と操作がぶつかるため。
 *
 * ▼ 飾りはいくつでも着けられる
 *   ほかの欄は「左右で1つ選ぶ」だが、飾りだけは左右で札を選び、決定で着ける／外す。
 *   その下の「飾りの色」は、飾りの欄で最後に指した飾りの色（飾りごとに別々）。
 *   いちばん左はその飾りの「もとの色」。着けていない飾りの色を選ぶと、その飾りを着ける
 *   （色を選んだのに姿に出ないと、効いていないように見えるため）。
 *
 * ▼ 性別と一人称は、ゲームの進み方には何も影響しない（data/player.js）
 *   一人称だけは、物語の台詞の {me} に差し込まれる。性別は新しい絵の体つきになる。
 *
 * 配置は data/ui.js の playerSetup、文言は data/messages.js の playerSetup。
 * 選択肢は data/player.js。
 */
(function (NS) {
  "use strict";

  // 色見本の欄（用意した色 ＋「じぶんで」）
  var PALETTES = ["color", "hairColor", "pants", "accColor"];
  // 札の欄（1つ選ぶ）。飾り（acc）も札だが、いくつでも着けられる
  var CHIPS = ["gender", "firstPerson", "hair", "acc"];
  // 見た目を歩かせて見せるときの向きの順と、1つの向きを見せる時間
  var PREVIEW_DIRS = ["down", "left", "up", "right"];
  var PREVIEW_TURN_MS = 1500;

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
    var look = NS.PlayerLook.appearanceOf(game.data);
    this.useRig = NS.PlayerLook.usesRig(game.data);
    this.genders = player.genders || [];
    this.firstPersons = player.firstPersons || [];
    this.hairStyles = look.hairStyles || [];
    this.accessories = look.accessories || [];

    // 上から並ぶ欄。新しい絵が使えないときは、今までどおり ふくの色 だけ
    this.rows = this.useRig
      ? ["name", "gender", "firstPerson", "hair", "hairColor", "color", "pants", "acc", "accColor", "done"]
      : ["name", "color", "gender", "firstPerson", "done"];
    // 飾りが1つも無ければ、飾りと飾りの色の欄は出さない
    if (!this.accessories.length) {
      this.rows = this.rows.filter(function (k) { return k !== "acc" && k !== "accColor"; });
    }

    // いまの値から始める（あとから変えるときは、今の名前と見た目が入っている）
    this.name = game.getPlayerName();
    this.palettes = {
      color: makePalette(NS.PlayerLook.colorsOf(game.data), game.getPlayerColor(), "#4a7fe0"),
      hairColor: makePalette(look.hairColors || [],
        game.playerHairColor || look.defaultHairColor, "#e8b23a"),
      pants: makePalette(look.pantsColors || [], game.playerPants || look.defaultPants, "#34323e")
    };
    this.genderIndex = indexById(this.genders, game.getPlayerGender());
    this.firstPersonIndex = Math.max(0, this.firstPersons.indexOf(game.getPlayerFirstPerson()));
    this.hairIndex = indexById(this.hairStyles, game.playerHair || look.defaultHair);
    this.accOn = {};
    var accIds = NS.PlayerLook.accIdsOf(game.data, game.playerAcc);
    for (var i = 0; i < accIds.length; i++) this.accOn[accIds[i]] = true;
    this.accCursor = 0;

    // 飾りの色は飾りごとに1つずつ色見本を持つ。左端は「もとの色」（id は null ＝ 色を選んでいない）。
    // 「飾りの色」の欄（palettes.accColor）は、いま指している飾りのものを見せる
    var accColors = look.accColors || [], savedAcc = game.playerAccColor || {};
    this.accPalettes = {};
    for (i = 0; i < this.accessories.length; i++) {
      var a = this.accessories[i];
      var list = [{ id: null, name: this.texts.accColorOriginal || "もとの色", base: a.color || "#888888" }].concat(accColors);
      this.accPalettes[a.id] = makePalette(list, savedAcc[a.id] || null, a.color || "#888888");
    }
    var self = this;
    Object.defineProperty(this.palettes, "accColor", {
      enumerable: true,
      get: function () {
        var acc = self.accessories[self.accCursor];
        return acc ? self.accPalettes[acc.id] : null;
      }
    });

    this.editor = null;   // 色を作る窓を開いているあいだの値（_openColorEditor）
    this._repeatAt = 0;   // 左右を押し続けたときに、次に動かす時刻
    this._chipRects = {}; // 札の四角（文字の幅で決まるので、一度測って覚えておく）

    // "main" … 欄を選ぶ / "name" … 文字盤を開いている / "color" … 色を作る窓
    this.phase = "main";
    this.row = 0;   // this.rows の何番目か
  }

  /**
   * 色見本の欄の中身。list の色の右に「じぶんで」（customIndex）が並ぶ。
   * いまの色が色コードなら「じぶんで」を選んだ状態から始める
   */
  function makePalette(list, currentId, fallbackHex) {
    var p = { list: list, customIndex: list.length };
    if (NS.PlayerLook.isCustom(currentId)) {
      p.index = p.customIndex;
      p.customHex = currentId.toLowerCase();
    } else {
      p.index = indexById(list, currentId);
      // まだ作っていなければ、いま選んでいる色から作り始める
      p.customHex = (list[p.index] && list[p.index].base) || fallbackHex;
    }
    return p;
  }

  function indexById(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return i;
    }
    return 0;
  }

  PlayerSetupScene.prototype.enter = function () {
    this.phase = "main";
  };

  /** 色見本の欄で選んでいる色のid（用意した色のid か、自分で作った色の色コード） */
  PlayerSetupScene.prototype._paletteId = function (kind) {
    var p = this.palettes[kind];
    if (p.index === p.customIndex) return p.customHex;
    var c = p.list[p.index];
    return c ? c.id : null;
  };

  /** ふくの色の定義（左の 32×32 の絵の名前に使う）。自分で作った色は名前が色コード */
  PlayerSetupScene.prototype._currentColor = function () {
    var id = this._paletteId("color");
    return id ? NS.PlayerLook.colorDef(this.game.data, id) : null;
  };

  /** 着けている飾りの id（data/player.js の並び順） */
  PlayerSetupScene.prototype._accIds = function () {
    var out = [];
    for (var i = 0; i < this.accessories.length; i++) {
      if (this.accOn[this.accessories[i].id]) out.push(this.accessories[i].id);
    }
    return out;
  };

  /** 飾りごとの色（{ 飾りの id: 色の id か色コード }）。「もとの色」のものは入れない */
  PlayerSetupScene.prototype._accColors = function () {
    var out = {};
    for (var id in this.accPalettes) {
      var p = this.accPalettes[id];
      var c = (p.index === p.customIndex) ? p.customHex : (p.list[p.index] || {}).id;
      if (c) out[id] = c;
    }
    return out;
  };

  /** いま指している飾りを着ける（その飾りの色を選んだとき） */
  PlayerSetupScene.prototype._wearCurrentAcc = function () {
    var acc = this.accessories[this.accCursor];
    if (acc) this.accOn[acc.id] = true;
  };

  /** いま選んでいる内容（決める前の値）。PlayerLook.rigOptions に渡す */
  PlayerSetupScene.prototype._selection = function () {
    var gender = this.genders[this.genderIndex];
    var hair = this.hairStyles[this.hairIndex];
    return {
      gender: gender ? gender.id : null,
      color: this._paletteId("color"),
      hair: hair ? hair.id : null,
      hairColor: this._paletteId("hairColor"),
      pants: this._paletteId("pants"),
      acc: this._accIds(),
      accColor: this._accColors()
    };
  };

  PlayerSetupScene.prototype._rowKind = function () {
    return this.rows[this.row];
  };

  // --- 選択肢（左右で送るもの）---

  /**
   * 左右で選ぶ欄の中身。欄ごとに「いくつあるか」「いま何番目か」を1か所で扱う。
   * 飾りの欄は「どの札を指しているか」（着けているかどうかは決定で切り替える）
   * @returns {{count:number, get:function, set:function}|null}
   */
  PlayerSetupScene.prototype._choiceOf = function (kind) {
    var self = this;
    if (PALETTES.indexOf(kind) >= 0) {
      var p = this.palettes[kind];
      if (!p) return null;
      return { count: p.list.length + 1,
               get: function () { return p.index; },
               set: function (i) {
                 p.index = i;
                 if (kind === "accColor") self._wearCurrentAcc();
               } };
    }
    var field = { gender: "genderIndex", firstPerson: "firstPersonIndex", hair: "hairIndex", acc: "accCursor" }[kind];
    if (!field) return null;
    var list = { gender: this.genders, firstPerson: this.firstPersons,
                 hair: this.hairStyles, acc: this.accessories }[kind];
    return { count: list.length,
             get: function () { return self[field]; },
             set: function (i) { self[field] = i; } };
  };

  /** 札に書く文字 */
  PlayerSetupScene.prototype._chipLabels = function (kind) {
    if (kind === "firstPerson") return this.firstPersons.slice();
    var list = { gender: this.genders, hair: this.hairStyles, acc: this.accessories }[kind] || [];
    var names = [];
    for (var i = 0; i < list.length; i++) names.push(list[i].name || "");
    return names;
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

    var n = this.rows.length;
    if (input.isPressed("up")) this.row = (this.row + n - 1) % n;
    if (input.isPressed("down")) this.row = (this.row + 1) % n;

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

    for (var r = 0; r < this.rows.length; r++) {
      var kind = this.rows[r];
      var choice = this._choiceOf(kind);
      if (!choice) continue;
      for (var i = 0; i < choice.count; i++) {
        if (!NS.Panel.containsPoint(this._optionRect(kind, i), pointer)) continue;
        if (pointer.moved || pointer.clicked) {
          this.row = r;
          choice.set(i);
        }
        if (pointer.clicked) {
          // 「じぶんで」の見本を押したら色を作る窓を開く。飾りの札は押すと着ける／外す
          var p = this.palettes[kind];
          if (p && i === p.customIndex) this._openColorEditor(kind);
          if (kind === "acc") this._toggleAcc();
        }
        return;
      }
    }

    // 名前の欄と決定のボタン
    var nameRow = this.rows.indexOf("name");
    if (NS.Panel.containsPoint(this._rowRect(nameRow), pointer)) {
      if (pointer.moved) this.row = nameRow;
      if (pointer.clicked) this._openNameInput();
    } else if (NS.Panel.containsPoint(this._doneRect(), pointer)) {
      if (pointer.moved) this.row = this.rows.indexOf("done");
      if (pointer.clicked) this._finish();
    }
  };

  PlayerSetupScene.prototype._activateRow = function () {
    var kind = this._rowKind();
    var p = this.palettes[kind];
    if (kind === "name") this._openNameInput();
    else if (kind === "done") this._finish();
    else if (kind === "acc") this._toggleAcc();
    // 「じぶんで」を選んでいるときだけ、決定で色を作る窓を開く
    else if (p && p.index === p.customIndex) this._openColorEditor(kind);
    // ほかの選ぶ欄で決定を押しても何もしない（左右で選ぶものなので）
  };

  /** 指している飾りを着ける／外す */
  PlayerSetupScene.prototype._toggleAcc = function () {
    var acc = this.accessories[this.accCursor];
    if (acc) this.accOn[acc.id] = !this.accOn[acc.id];
  };

  // --- 色を作る窓 ---

  var SLIDERS = ["h", "s", "l"];   // 色合い・あざやかさ・明るさ。4行目は「決める／やめる」
  var EDITOR_ROWS = SLIDERS.length + 1;
  var SLIDER_RANGE = { h: [0, 359], s: [0, 100], l: [5, 95] };

  /** kind … どの欄の色を作るか（color / hairColor / pants） */
  PlayerSetupScene.prototype._openColorEditor = function (kind) {
    var p = this.palettes[kind];
    var hsl = NS.PlayerLook.hexToHsl(p.customHex);
    this.editor = { kind: kind, h: hsl.h, s: hsl.s, l: Math.max(5, Math.min(95, hsl.l)),
                    row: 0, button: 0, original: p.customHex, dragging: -1 };
    p.index = p.customIndex;
    if (kind === "accColor") this._wearCurrentAcc();
    this.phase = "color";
  };

  /** 窓を閉じる。apply が false なら開く前の色に戻す */
  PlayerSetupScene.prototype._closeColorEditor = function (apply) {
    if (!apply && this.editor) this.palettes[this.editor.kind].customHex = this.editor.original;
    this.editor = null;
    this.phase = "main";
  };

  /** つまみの値から色コードを作り直す（左の姿もその場で変わる） */
  PlayerSetupScene.prototype._applyEditor = function () {
    var E = this.editor;
    this.palettes[E.kind].customHex = NS.PlayerLook.hslToHex(E.h, E.s, E.l);
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
    // 主人公の名前は会話の文に入るので、仲間（10文字）より短い 8文字まで（data/naming.js）
    this.nameInput.open(this.name, this.texts.nameTitle || "",
      (this.game.data.naming || {}).playerMaxLength || 8);
    this.phase = "name";
  };

  /** 決めた内容をゲームへ移して、次の画面へ進む */
  PlayerSetupScene.prototype._finish = function () {
    var sel = this._selection();

    this.game.playerName = this.name;
    // 自分で作った色は色コード（#rrggbb）のまま入る
    this.game.playerColor = sel.color;
    this.game.playerGender = sel.gender;
    this.game.playerFirstPerson = this.firstPersons[this.firstPersonIndex] || null;
    // 新しい絵の見た目は、その欄を出したときだけ書き換える（出していなければ選べていないので）
    if (this.useRig) {
      this.game.playerHair = sel.hair;
      this.game.playerHairColor = sel.hairColor;
      this.game.playerPants = sel.pants;
      this.game.playerAcc = sel.acc;
      this.game.playerAccColor = sel.accColor;
    }

    if (this.mode === "edit") {
      this.game.scenes.change(this.returnScene);
      return;
    }
    // 新規のときは、ここから冒険が始まる。オープニングを流してから拠点へ
    this.game.playStory("newGame", new NS.HomeScene(this.game));
  };

  // --- 位置 ---

  PlayerSetupScene.prototype._rowRect = function (index) {
    var r = this.layout.rows || { x: 264, y: 100, w: 504, h: 40, gap: 6 };
    return { x: r.x, y: r.y + (r.h + (r.gap || 0)) * index, w: r.w, h: r.h };
  };

  /**
   * 選ぶ欄の、i 番目の選択肢の四角。
   * 色は同じ大きさの見本を並べる。札は文字の幅に合わせる（「ポニーテール」と「ボブ」で幅が違う）
   */
  PlayerSetupScene.prototype._optionRect = function (kind, i) {
    var row = this._rowRect(this.rows.indexOf(kind));
    if (this.palettes[kind]) {
      var s = this.layout.swatch || { x: 352, size: 26, gap: 8 };
      return { x: s.x + (s.size + (s.gap || 0)) * i, y: row.y + Math.floor((row.h - s.size) / 2),
               w: s.size, h: s.size };
    }
    var rects = this._chipRects[kind] || (this._chipRects[kind] = this._measureChips(kind));
    var r = rects[i] || { x: 0, w: 0 };
    var c = this.layout.chip || {};
    return { x: r.x, y: row.y + Math.floor((row.h - (c.h || 26)) / 2), w: r.w, h: c.h || 26 };
  };

  /** 札の左端と幅（横の並びだけ）。幅は文字の幅＋左右の余白で、w より狭くはしない */
  PlayerSetupScene.prototype._measureChips = function (kind) {
    var c = this.layout.chip || {};
    var ctx = this.panel.ctx;
    var labels = this._chipLabels(kind);
    var out = [], x = c.x || 352;
    ctx.save();
    ctx.font = c.font || this.theme.smallFont || "13px monospace";
    for (var i = 0; i < labels.length; i++) {
      var w = Math.max(c.w || 40, Math.ceil(ctx.measureText(labels[i]).width) + (c.padX || 7) * 2);
      out.push({ x: x, w: w });
      x += w + (c.gap || 0);
    }
    ctx.restore();
    return out;
  };

  /** 決定のボタン。欄の並びのいちばん下（高さだけ done.h） */
  PlayerSetupScene.prototype._doneRect = function () {
    var rect = this._rowRect(this.rows.indexOf("done"));
    rect.h = (this.layout.done || {}).h || rect.h;
    return rect;
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
    var labels = {
      gender: this.texts.genderLabel || "性別", firstPerson: this.texts.firstPersonLabel || "一人称",
      hair: this.texts.hairLabel || "髪型", acc: this.texts.accLabel || "飾り",
      color: this.texts.colorLabel || "ふくの色", hairColor: this.texts.hairColorLabel || "髪の色",
      pants: this.texts.pantsLabel || "ズボンの色", accColor: this.texts.accColorLabel || "飾りの色"
    };
    for (var i = 0; i < this.rows.length; i++) {
      var kind = this.rows[i];
      if (kind === "name") this._renderNameRow();
      else if (kind === "done") this._renderDone();
      else if (this.palettes[kind]) this._renderPaletteRow(kind, labels[kind]);
      else this._renderChipRow(kind, labels[kind]);
    }
    this._renderHint();

    if (this.mode === "edit") this.backButton.render();

    // 文字盤と色を作る窓は、開いているあいだ全部の上に重ねる
    if (this.phase === "name") this.nameInput.render(this.game.clock);
    if (this.phase === "color") {
      this._renderColorEditor();
      this._renderHint();   // 窓の操作説明は暗幕より上に出す
    }
  };

  /** 左：選んでいる姿で、実際に歩いているところを見せる */
  PlayerSetupScene.prototype._renderPreview = function () {
    var p = this.layout.preview;
    if (!p) return;

    this.panel.drawBox({ x: p.boxX, y: p.boxY, w: p.boxW, h: p.boxH });
    if (this.useRig) this._renderRigPreview(p);
    else this._renderSpritePreview(p);
  };

  /** 新しい絵：上下左右へ向きを変えながら歩かせる（どの向きの姿も見られるように） */
  PlayerSetupScene.prototype._renderRigPreview = function (p) {
    var R = NS.CharaRig;
    var opts = NS.PlayerLook.rigOptions(this.game.data, this._selection());
    var frames = NS.PlayerLook.framesFor(opts, 64);
    var clock = this.game.clock || 0;
    var dir = PREVIEW_DIRS[Math.floor(clock / PREVIEW_TURN_MS) % PREVIEW_DIRS.length];
    var img = frames.walk[dir][R.walkFrame(clock)];
    var scale = (NS.PlayerLook.appearanceOf(this.game.data).rig || {}).previewScale || 3;
    var size = 64 * scale;
    var x = Math.round(p.x - size / 2), y = Math.round(p.y - size / 2);
    var ctx = this.panel.ctx;

    ctx.save();
    // 足もとの影（絵の足はおよそ 64 の 61 段目）
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(p.x, y + 60 * scale, 15 * scale, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x, y, size, size);
    ctx.restore();

    this.panel.drawText(this.name || "", p.x, p.labelY,
      { align: "center", color: this.theme.subTextColor });
  };

  /** 今までの 32×32 の絵（新しい絵が使えないとき）。ふくの色の名前を下に出す */
  PlayerSetupScene.prototype._renderSpritePreview = function (p) {
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
    var rect = this._rowRect(this.rows.indexOf(kind));
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
    var chips = this.layout.chip || { x: 352 };
    var baseY = rect.y + rect.h / 2 + 6;

    this.panel.drawText(this.name || "", chips.x, baseY,
      { color: frame.selected ? t.cursorColor : t.textColor });
    this.panel.drawText(this.texts.nameAction || "", rect.x + rect.w - 12, baseY,
      { align: "right", font: t.smallFont, color: t.hintColor });
  };

  /** 色見本の欄（ふく・髪・ズボン・飾り）。いちばん右が「じぶんで」 */
  PlayerSetupScene.prototype._renderPaletteRow = function (kind, label) {
    var frame = this._renderRowFrame(kind, label);
    var t = this.theme;
    var p = this.palettes[kind];

    // 飾りの色は、どの飾りの色かを右端に出す（飾りの欄で指しているもの）
    if (kind === "accColor") {
      var acc = this.accessories[this.accCursor];
      this.panel.drawText(acc ? acc.name : "", frame.rect.x + frame.rect.w - 12, frame.rect.y + frame.rect.h / 2 + 5,
        { align: "right", font: t.smallFont, color: this.accOn[acc.id] ? t.cursorColor : t.subTextColor });
    }

    var ctx = this.panel.ctx;
    for (var i = 0; i <= p.list.length; i++) {
      var sw = this._optionRect(kind, i);
      var custom = (i === p.customIndex);
      ctx.save();
      ctx.fillStyle = custom ? p.customHex : (p.list[i].base || "#888888");
      ctx.fillRect(sw.x, sw.y, sw.w, sw.h);
      // 選んでいる色だけ枠を付ける。色そのものは変えない（見本なので）
      ctx.strokeStyle = (i === p.index)
        ? (t.cursorColor || "#ffd75e")
        : (t.panelBorder || "#3a4560");
      ctx.lineWidth = (i === p.index) ? 3 : 1;
      ctx.strokeRect(sw.x, sw.y, sw.w, sw.h);
      ctx.restore();

      // 「じぶんで」の見本には、作れることが分かるよう右下に＋を付ける
      if (custom) {
        ctx.save();
        ctx.fillStyle = "rgba(10,15,28,0.75)";
        ctx.fillRect(sw.x + sw.w - 12, sw.y + sw.h - 12, 11, 11);
        ctx.restore();
        this.panel.drawText("+", sw.x + sw.w - 6.5, sw.y + sw.h - 2.5,
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
    var hex = this.palettes[E.kind].customHex;
    var labels = [this.texts.hueLabel || "色合い", this.texts.satLabel || "あざやかさ",
                  this.texts.lightLabel || "明るさ"];
    var acc = this.accessories[this.accCursor];
    var titles = { color: this.texts.editorTitle, hairColor: this.texts.editorTitleHair,
                   pants: this.texts.editorTitlePants,
                   accColor: (this.texts.editorTitleAcc || "{acc}の色を作る").replace("{acc}", acc ? acc.name : "") };

    ctx.save();
    ctx.fillStyle = C.veil || "rgba(4,6,12,0.72)";
    ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    ctx.fillStyle = t.panelBg || "#0d1220";
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.restore();
    this.panel.drawBox(box);

    this.panel.drawText(titles[E.kind] || "", box.x + 24, box.y + 36,
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
    ctx.fillStyle = hex;
    ctx.fillRect(sx, sy, S.size, S.size);
    ctx.strokeStyle = t.panelBorder || "#3a4560";
    ctx.strokeRect(sx + 0.5, sy + 0.5, S.size - 1, S.size - 1);
    ctx.restore();
    this.panel.drawText(hex.toUpperCase(), sx + S.size + 12, sy + S.size / 2 + 5,
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

  /**
   * 札の欄（性別・一人称・髪型・飾り）。選んでいるもの（飾りは着けているもの）を光らせる。
   * 飾りの欄では、いま指している札の地を明るくする（光る＝着けている、とは別）
   */
  PlayerSetupScene.prototype._renderChipRow = function (kind, label) {
    var frame = this._renderRowFrame(kind, label);

    var t = this.theme;
    var c = this.layout.chip || {};
    var labels = this._chipLabels(kind);
    var current = this._choiceOf(kind).get();
    var ctx = this.panel.ctx;

    for (var i = 0; i < labels.length; i++) {
      var r = this._optionRect(kind, i);
      var on = (kind === "acc") ? !!this.accOn[this.accessories[i].id] : (i === current);

      ctx.save();
      // 飾りの色の欄にいるときも、どの飾りの色を選んでいるのか分かるよう地を明るくしておく
      var pointing = frame.selected || (this._rowKind() === "accColor" && this.phase === "main");
      if (kind === "acc" && pointing && i === current) {
        ctx.fillStyle = c.cursorFill || "rgba(255,215,94,0.18)";
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }
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

    var kind = this._rowKind();
    var p = this.palettes[kind];
    var text;
    if (this.phase === "name") text = "";   // 文字盤が自分で案内を出す
    else if (this.phase === "color") text = this.texts.hintEditor;
    // 「じぶんで」を選んでいるときは、決定で色を作れることを知らせる
    else if (p && p.index === p.customIndex) text = this.texts.hintCustom;
    else if (kind === "acc") text = this.texts.hintAcc;
    else if (kind === "accColor") text = this.texts.hintAccColor;
    else text = (this.mode === "new" ? this.texts.hintNew : this.texts.hintEdit);

    this.panel.drawText(text || "", hint.x, hint.y,
      { font: this.theme.smallFont, color: this.theme.hintColor });
  };

  NS.PlayerSetupScene = PlayerSetupScene;
})(window.MyGame);
