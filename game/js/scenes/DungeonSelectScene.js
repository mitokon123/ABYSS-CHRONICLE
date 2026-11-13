/**
 * DungeonSelectScene.js
 * ダンジョン選択画面。拠点の「ダンジョンへ潜る」から開く。
 *
 * 2段で選ぶ（v1.0.0）：
 *   1. 穴（地方。data/regions.js）を選ぶ  … phase "region"
 *   2. その穴の区画（ダンジョン）を選ぶ   … phase "dungeon"
 * どちらも左に一覧、右に選んでいるものの詳細を出す。
 * まだ開いていない穴・区画は選べず、開く条件を表示する。
 * 区画が1つも無い穴は「準備中」と出て入れない。
 *
 * 右の説明は共通の部品 NS.DetailPane（v1.4.0・2026-11-12 作者「ダンジョンを選ぶ画面もアップグレード」）。
 *   上の欄 … その場所の床と壁の小さな絵・名前・札（推奨Lv・クリア済・未開放・準備中）・最深階
 *   下の行 … 説明 → 出現するモンスター（絵つき・1行に1体）→ 手に入るもの（絵つき）→ 主
 *            モンスターと手に入るものは、はじめは先頭の2つだけ（detail.previewRows）。
 *            「▶ ほかに〇体を見る」を押すか C で残りが開く（2026-11-12 作者「最初の2体は表示して、あとから任意で」）
 *   入りきらなければ Q/E・ホイール・バーで送る。上の欄の後ろに、その場所の色の帯を敷く
 *
 * 一覧の中身は data/regions.js と data/dungeons.js、解放判定は DungeonCatalog が持つ。
 * 配置は data/ui.js の dungeonSelect、文言は data/messages.js の dungeonSelect。
 */
(function (NS) {
  "use strict";

  /**
   * @param {MyGame.Game} game
   * @param {object} returnScene 閉じたときに戻るシーン
   */
  function DungeonSelectScene(game, returnScene) {
    this.game = game;
    this.returnScene = returnScene;

    var ui = game.data.ui || {};
    this.theme = ui.theme || {};
    this.layout = ui.dungeonSelect || {};
    this.texts = (game.data.messages || {}).dungeonSelect || {};

    this.panel = new NS.Panel(game.ctx, this.theme);
    this.renderer = new NS.Renderer(game.ctx);
    this.backButton = new NS.BackButton(this.panel, game.data);
    this.sprites = new NS.SpriteRenderer(game.ctx, game.assets);
    this.pane = new NS.DetailPane(this.panel, this.sprites, this.layout.detail || { x: 0, y: 0, w: 0, h: 0 });

    this.phase = "region";
    this.regions = NS.DungeonCatalog.listRegions(game.data);
    this.regionIndex = this._initialRegionIndex();
    this.dungeons = [];
    this.index = 0;

    // 開いている穴が1つだけのあいだ（揺籃の穴をクリアするまで）は、穴を選ぶ段を飛ばして
    // その穴の区画の一覧をすぐ出す（作者の指定）。戻るとそのまま拠点へ
    this.singleRegion = this._unlockedRegionCount() <= 1;
    if (this.singleRegion) {
      // 自動で開いたぶんは「前に選んだ穴」に数えない（次の穴が開いた瞬間、そちらにカーソルが乗るように）
      var last = game.lastRegionId;
      this._openRegion(this.regionIndex, false);
      game.lastRegionId = last;
    }
  }

  /** 開いている穴の数 */
  DungeonSelectScene.prototype._unlockedRegionCount = function () {
    var count = 0;
    for (var i = 0; i < this.regions.length; i++) {
      if (this.isRegionUnlocked(this.regions[i])) count++;
    }
    return count;
  };

  DungeonSelectScene.prototype.enter = function () {
    this.regions = NS.DungeonCatalog.listRegions(this.game.data);
    if (this.regionIndex >= this.regions.length) this.regionIndex = 0;
    // 区画を選んでいる途中で戻ってきたときは、その穴の一覧を作り直す
    if (this.phase === "dungeon") this._openRegion(this.regionIndex, true);
  };

  /**
   * 最初にカーソルを置く穴。前に選んだ穴（game.lastRegionId。セーブはしない）、
   * 無ければ開いている穴のうち最後のもの（いちばん新しく開いた穴）
   */
  DungeonSelectScene.prototype._initialRegionIndex = function () {
    var last = this.game.lastRegionId;
    var fallback = 0;
    for (var i = 0; i < this.regions.length; i++) {
      if (last && this.regions[i].id === last) return i;
      if (this.isRegionUnlocked(this.regions[i])) fallback = i;
    }
    return fallback;
  };

  DungeonSelectScene.prototype.getSelected = function () {
    return this.dungeons[this.index] || null;
  };

  DungeonSelectScene.prototype.getSelectedRegion = function () {
    return this.regions[this.regionIndex] || null;
  };

  DungeonSelectScene.prototype.isUnlocked = function (dungeon) {
    return NS.DungeonCatalog.isUnlocked(dungeon, this.game.clearedDungeons, this.game.data);
  };

  DungeonSelectScene.prototype.isRegionUnlocked = function (region) {
    return NS.DungeonCatalog.isRegionUnlocked(region, this.game.clearedDungeons, this.game.data);
  };

  /** その穴の区画の一覧（空なら「準備中」） */
  DungeonSelectScene.prototype._dungeonsOf = function (region) {
    return region ? NS.DungeonCatalog.dungeonsInRegion(this.game.data, region.id) : [];
  };

  // --- 更新 ---

  DungeonSelectScene.prototype.update = function () {
    var input = this.game.input;

    // 戻る（ボタン・Esc）は、区画の一覧なら穴の一覧へ、穴の一覧なら拠点へ
    if (this.backButton.handleInput(input) || input.isPressed("cancel")) {
      this._back();
      return;
    }

    // 右の説明（バー・ホイール・Q/E）。バーを触っている間はほかの操作を見ない（v1.4.0）
    this.pane.setContent(this._detailContent(), this._detailKey());
    var paneResult = this.pane.handleInput(input);
    if (paneResult && paneResult.bar) return;
    if (paneResult && paneResult.toggle) { this._toggleList(paneResult.toggle); return; }
    if (input.isPressed("prevTab")) this.pane.scrollBy(-this.pane.keyRows());
    if (input.isPressed("nextTab")) this.pane.scrollBy(this.pane.keyRows());
    // C：モンスターと手に入るものの残りを、まとめて開け閉め（区画の段だけ）
    if (input.isPressed("menu") && this.phase === "dungeon") { this._toggleAllLists(); return; }

    var count = this._rowCount();
    var current = this._currentIndex();
    if (count > 0) {
      if (input.isPressed("up")) current = (current - 1 + count) % count;
      if (input.isPressed("down")) current = (current + 1) % count;
    }

    // マウス：重ねた行へ選択を移し、押したら決める
    var hovered = this._hoveredIndex(input);
    if (hovered >= 0) current = hovered;
    this._setCurrentIndex(current);

    var clicked = hovered >= 0 && input.getPointer && input.getPointer().clicked;
    if (input.isPressed("confirm") || clicked) {
      if (this.phase === "region") this._chooseRegion();
      else this._enter();
    }
  };

  DungeonSelectScene.prototype._rowCount = function () {
    return (this.phase === "region") ? this.regions.length : this.dungeons.length;
  };
  DungeonSelectScene.prototype._currentIndex = function () {
    return (this.phase === "region") ? this.regionIndex : this.index;
  };
  DungeonSelectScene.prototype._setCurrentIndex = function (value) {
    if (this.phase === "region") this.regionIndex = value;
    else this.index = value;
  };

  DungeonSelectScene.prototype._back = function () {
    if (this.phase === "dungeon" && !this.singleRegion) {
      this.phase = "region";
      return;
    }
    this.game.scenes.change(this.returnScene);
  };

  /** カーソルが乗っている行の番号（乗っていなければ -1） */
  DungeonSelectScene.prototype._hoveredIndex = function (input) {
    if (!input.getPointer) return -1;

    var pointer = input.getPointer();
    if (!pointer.inside) return -1;
    if (!pointer.moved && !pointer.clicked) return -1;

    var L = this.layout.list;
    for (var i = 0; i < this._rowCount(); i++) {
      var rect = { x: L.x, y: L.y + L.rowHeight * i, w: L.w, h: L.h };
      if (NS.Panel.containsPoint(rect, pointer)) return i;
    }
    return -1;
  };

  /** 穴を決める。開いていない・区画が無い（準備中）穴には入れない */
  DungeonSelectScene.prototype._chooseRegion = function () {
    var region = this.getSelectedRegion();
    if (!region || !this.isRegionUnlocked(region) || this._dungeonsOf(region).length === 0) {
      this.game.playError();
      return;
    }
    this._openRegion(this.regionIndex, false);
  };

  /**
   * その穴の区画の一覧へ進む。
   * カーソルは、まだクリアしていない区画のうち開いている最初のもの（無ければ先頭）に置く。
   * keepIndex が true なら、今のカーソルの位置を残す（一覧を作り直すだけ）
   */
  DungeonSelectScene.prototype._openRegion = function (regionIndex, keepIndex) {
    var region = this.regions[regionIndex];
    this.dungeons = this._dungeonsOf(region);
    this.phase = "dungeon";
    this.game.lastRegionId = region ? region.id : null;

    if (keepIndex && this.index < this.dungeons.length) return;
    this.index = 0;
    for (var i = 0; i < this.dungeons.length; i++) {
      var d = this.dungeons[i];
      if (this.isUnlocked(d) && !this.game.isDungeonCleared(d.id)) { this.index = i; break; }
    }
  };

  /** まだ中身が無い区画か（data/dungeons.js の ready: false） */
  function isPreparing(dungeon) {
    return !!dungeon && dungeon.ready === false;
  }

  /** 選んだ場所へ挑む（解放されていない・準備中なら入らない） */
  DungeonSelectScene.prototype._enter = function () {
    var dungeon = this.getSelected();
    if (!dungeon || !this.isUnlocked(dungeon)) return;
    if (isPreparing(dungeon)) {
      this.game.playError();
      return;
    }

    // ここから拠点へ戻るまでが1回の挑戦（ラン）になる
    this.game.beginRun(dungeon);
    this.game.scenes.change(new NS.DungeonScene(this.game, dungeon));
  };

  // --- 描画 ---

  DungeonSelectScene.prototype.render = function (ctx) {
    var w = this.game.canvas.width;
    var h = this.game.canvas.height;

    this.renderer.clear(this.layout.background || "#000000", w, h);
    this._renderHeading();

    if (this.phase === "region") {
      for (var r = 0; r < this.regions.length; r++) this._renderRegionRow(this.regions[r], r);
    } else {
      for (var i = 0; i < this.dungeons.length; i++) this._renderRow(this.dungeons[i], i);
    }
    this._renderDetail();
    this._renderHint();
    this.backButton.render();
  };

  DungeonSelectScene.prototype._renderHeading = function () {
    var title = this.layout.title || {};
    var subtitle = this.layout.subtitle || {};

    this.panel.drawText(this.texts.title || "", title.x, title.y,
      { font: title.font, color: title.color });
    // 穴の一覧では「潜る穴を選ぶ」、区画の一覧では選んだ穴の名前
    var text = (this.phase === "region")
      ? (this.texts.regionSubtitle || this.texts.subtitle || "")
      : (this._regionName() || this.texts.subtitle || "");
    this.panel.drawText(text, subtitle.x, subtitle.y,
      { font: subtitle.font, color: subtitle.color });
  };

  /** 選んでいる穴の名前。data/regions.js。無ければ空 */
  DungeonSelectScene.prototype._regionName = function () {
    var region = this.getSelectedRegion();
    return region ? (region.name || "") : "";
  };

  // --- 穴の一覧（1段目） ---

  /** 穴の状態の文字（区画の進み具合・未開放・準備中） */
  DungeonSelectScene.prototype._regionState = function (region, unlocked) {
    if (!unlocked) return { text: this.texts.locked, color: this.theme.hintColor };
    var progress = NS.DungeonCatalog.regionProgress(this.game.data, region.id, this.game.clearedDungeons);
    // 区画が無い、または全部が準備中なら「準備中」（区画の名前は中に入ると見られる）
    var ready = this._dungeonsOf(region).filter(function (d) { return !isPreparing(d); });
    if (progress.total === 0 || ready.length === 0) {
      return { text: this.texts.comingSoon || "準備中", color: this.theme.hintColor };
    }
    var text = (this.texts.regionProgress || "{cleared}/{total} 区画")
      .replace("{cleared}", progress.cleared).replace("{total}", progress.total);
    var done = progress.cleared >= progress.total;
    return { text: text, color: done ? this.theme.cursorColor : this.theme.subTextColor };
  };

  DungeonSelectScene.prototype._regionTheme = function (region, unlocked) {
    if (!unlocked || !region || !region.theme) return null;
    return (this.game.data.dungeonThemes || {})[region.theme] || null;
  };

  /** 穴の一覧の1件 */
  DungeonSelectScene.prototype._renderRegionRow = function (region, i) {
    var L = this.layout.list;
    var t = this.theme;
    var rect = { x: L.x, y: L.y + L.rowHeight * i, w: L.w, h: L.h };
    var unlocked = this.isRegionUnlocked(region);
    var selected = (i === this.regionIndex);
    var origin = this.panel.innerOrigin(rect);

    this.panel.drawBox(rect);
    this._renderBar(rect, this._regionTheme(region, unlocked));

    if (selected) this.panel.drawText("▶", rect.x - 18, origin.y + 24, { color: t.cursorColor });

    var name = unlocked ? region.name : (this.texts.unknownName || "？？？");
    this.panel.drawText(name, origin.x, origin.y + 18,
      { color: !unlocked ? t.hintColor : (selected ? t.cursorColor : t.textColor) });

    var state = this._regionState(region, unlocked);
    if (state.text) {
      this.panel.drawText(state.text, rect.x + rect.w - (t.padding || 8), origin.y + 18,
        { align: "right", font: t.smallFont, color: state.color });
    }

    var subtitle = unlocked ? (region.subtitle || "") : (this.texts.unknownName || "");
    this.panel.drawText(subtitle, origin.x, origin.y + 40, { font: t.smallFont, color: t.subTextColor });
  };

  /** 「揺籃の穴 の主を4体記録すると開く」 */
  DungeonSelectScene.prototype._regionLockedHint = function (region) {
    var condition = region.unlockedBy || {};
    var source = condition.region ? (this.game.data.regions || {})[condition.region] : null;
    if (source) {
      var total = NS.DungeonCatalog.idsInRegion(this.game.data, source.id).length;
      return (this.texts.regionLockedHint || "{region} の主を{count}体記録すると開く")
        .replace("{region}", source.name)
        .replace("{count}", (typeof condition.count === "number") ? condition.count : total);
    }
    var required = this._requiredNameShown(condition);
    return (this.texts.lockedHint || "").replace("{name}", required || "");
  };

  /**
   * 開く条件に出す場所の名前。まだクリアしていないものだけを「、」でつなぐ。
   * ★ その場所自体がまだ開いていなければ、名前は伏せて「？？？」にする
   *   （未開放の区画は一覧でも名前を伏せているので、条件の文から名前が漏れないように）
   */
  DungeonSelectScene.prototype._requiredNameShown = function (condition) {
    if (!condition) return null;
    var data = this.game.data;
    var cleared = this.game.clearedDungeons || {};
    var ids = NS.DungeonCatalog._conditionIds(condition, data);
    var names = [];
    for (var i = 0; i < ids.length; i++) {
      if (cleared[ids[i]]) continue;
      var d = NS.DungeonCatalog.get(data, ids[i]);
      var known = d && this.isUnlocked(d) && this.isRegionUnlocked((data.regions || {})[d.region] || null);
      names.push(known ? d.name : (this.texts.unknownName || "？？？"));
    }
    return names.length ? names.join("、") : null;
  };

  /**
   * その場所のテーマ（色）を返す。まだ行けない場所は中身を見せないので null。
   */
  DungeonSelectScene.prototype._themeOf = function (dungeon, unlocked) {
    if (!unlocked || !dungeon || !dungeon.theme) return null;
    return (this.game.data.dungeonThemes || {})[dungeon.theme] || null;
  };

  /** 表示する名前。まだ行けない場所は伏せる */
  DungeonSelectScene.prototype._nameOf = function (dungeon, unlocked) {
    if (unlocked) return dungeon.name;
    return this.texts.unknownName || "？？？";
  };

  /** 一覧の1件を描く */
  DungeonSelectScene.prototype._renderRow = function (dungeon, i) {
    var L = this.layout.list;
    var t = this.theme;
    var rect = { x: L.x, y: L.y + L.rowHeight * i, w: L.w, h: L.h };

    this.panel.drawBox(rect);

    var unlocked = this.isUnlocked(dungeon);
    var selected = (i === this.index);
    var origin = this.panel.innerOrigin(rect);

    this._renderThemeBar(rect, dungeon, unlocked);

    if (selected) {
      this.panel.drawText("▶", rect.x - 18, origin.y + 24, { color: t.cursorColor });
    }

    // 未開放の場所は名前を伏せ、灰色にして「まだ分からない」ことを示す
    var nameColor = !unlocked ? t.hintColor
                  : (selected ? t.cursorColor : t.textColor);
    this.panel.drawText(this._nameOf(dungeon, unlocked), origin.x, origin.y + 18,
      { color: nameColor });

    // 右上に状態（クリア済／未開放／準備中）
    var preparing = isPreparing(dungeon);
    var state = this.game.isDungeonCleared(dungeon.id) ? this.texts.cleared
              : (!unlocked ? this.texts.locked : (preparing ? this.texts.comingSoon : null));
    if (state) {
      this.panel.drawText(state, rect.x + rect.w - (t.padding || 8), origin.y + 18,
        { align: "right", font: t.smallFont,
          color: (unlocked && !preparing) ? t.cursorColor : t.hintColor });
    }

    // 未開放なら、どんな場所かも伏せる
    var subtitle = unlocked ? (dungeon.subtitle || "") : (this.texts.unknownName || "");
    this.panel.drawText(subtitle, origin.x, origin.y + 40,
      { font: t.smallFont, color: t.subTextColor });

    // 準備中の区画（ready: false）は、階数と推奨レベルを出さない（作っている途中で変わるため）
    if (preparing) return;

    var floors = unlocked
      ? (this.texts.floorsLabel || "").replace("{floors}", dungeon.floors)
      : "";
    this.panel.drawText(floors, origin.x, origin.y + 58,
      { font: t.smallFont, color: t.hintColor });

    // 推奨レベル（初めて入るときの目安）。最深階の隣に出す
    if (unlocked && dungeon.recommendedLevel) {
      this.panel.ctx.font = t.smallFont;
      var gap = this.panel.ctx.measureText(floors).width + 16;
      this.panel.drawText(this._recommendedText(dungeon), origin.x + gap, origin.y + 58,
        { font: t.smallFont, color: this._recommendedColor(dungeon) });
    }
  };

  /** 「推奨Lv5」 */
  DungeonSelectScene.prototype._recommendedText = function (dungeon) {
    return (this.texts.recommendedLabel || "推奨Lv{level}").replace("{level}", dungeon.recommendedLevel);
  };

  /**
   * 推奨レベルの色。連れている仲間でいちばん高いレベルが推奨に届いていなければ、
   * 注意の色にする（まだ早いかもしれない、と一目で分かるように）
   */
  DungeonSelectScene.prototype._recommendedColor = function (dungeon) {
    var t = this.theme;
    var best = this._bestLevel();
    return (best >= dungeon.recommendedLevel) ? t.subTextColor : (this.layout.underLevelColor || "#e8896a");
  };

  /**
   * 一覧の左端に、その場所の色の帯を出す。
   * 一覧を眺めるだけで「緑の坑道・赤い亀裂・青い深層」と雰囲気が分かるようにする。
   * まだ行けない場所は、雰囲気も伏せて一律の暗い色にする。
   */
  DungeonSelectScene.prototype._renderThemeBar = function (rect, dungeon, unlocked) {
    this._renderBar(rect, this._themeOf(dungeon, unlocked));
  };

  /** 一覧の左端の色の帯（穴の一覧と区画の一覧で共通）。theme が null なら伏せた色 */
  DungeonSelectScene.prototype._renderBar = function (rect, theme) {
    var bar = this.layout.themeBar;
    if (!bar || !bar.width) return;

    var tiles = (theme && theme.tiles) || {};
    var color = tiles.wall || this.layout.lockedColor || "#242a3a";

    var ctx = this.game.ctx;
    var gradient = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, tiles.floor || this.layout.lockedColor || "#242a3a");

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(rect.x + 2, rect.y + 2, bar.width, rect.h - 4);
    ctx.restore();
  };

  // --- 右の説明（v1.4.0。共通の DetailPane） ---

  /** 右の説明の中身。穴の段と区画の段で作り分ける */
  DungeonSelectScene.prototype._detailContent = function () {
    return (this.phase === "region") ? this._regionContent() : this._dungeonContent();
  };

  /** 選ぶものが変わったら、説明を先頭へ戻す */
  DungeonSelectScene.prototype._detailKey = function () {
    var chosen = (this.phase === "region") ? this.getSelectedRegion() : this.getSelected();
    return this.phase + ":" + (chosen ? chosen.id : "");
  };

  /** いま説明している場所の色（帯と小さな絵）。まだ行けない場所は null */
  DungeonSelectScene.prototype._detailTheme = function () {
    if (this.phase === "region") {
      var region = this.getSelectedRegion();
      return region ? this._regionTheme(region, this.isRegionUnlocked(region)) : null;
    }
    var dungeon = this.getSelected();
    return dungeon ? this._themeOf(dungeon, this.isUnlocked(dungeon)) : null;
  };

  /** 右側：枠 → 色の帯 → 説明（DetailPane。枠は自分で描くので rect.noBox） */
  DungeonSelectScene.prototype._renderDetail = function () {
    var rect = this.layout.detail;
    if (!rect) return;
    this.panel.drawBox(rect);
    this._renderBanner(rect, this._detailTheme());
    this.pane.setContent(this._detailContent(), this._detailKey());
    this.pane.render("");
  };

  /**
   * 上の欄の後ろに敷く、その場所の色の帯。色は実際のダンジョンの壁と床の色なので、
   * 潜る前に雰囲気が伝わる。下へ行くほど透明にして、下端に線を作らない。
   * まだ行けない場所は一律の暗い色
   */
  DungeonSelectScene.prototype._renderBanner = function (rect, theme) {
    var banner = rect.banner;
    if (!banner || !banner.height) return;
    var tiles = (theme && theme.tiles) || {};
    var locked = this.layout.lockedColor || "#242a3a";
    var ctx = this.game.ctx;
    var top = rect.y + 2;
    var gradient = ctx.createLinearGradient(0, top, 0, top + banner.height);
    gradient.addColorStop(0, tiles.wall || locked);
    gradient.addColorStop(0.5, (theme && theme.background) || locked);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.globalAlpha = (typeof banner.alpha === "number") ? banner.alpha : 1;
    ctx.fillStyle = gradient;
    ctx.fillRect(rect.x + 2, top, rect.w - 4, banner.height);
    ctx.restore();
  };

  /**
   * 上の欄の絵：その場所の床と壁を、6×6 マスの小さな見取り図にしたもの（階段つき）。
   * DetailPane の head.drawPicture に渡す
   */
  var SWATCH = ["WWWWWW", "WFFFFW", "WFFWFW", "WFSFFW", "WFFFFW", "WWWWWW"];
  DungeonSelectScene.prototype._swatchDrawer = function (theme) {
    var ctx = this.game.ctx;
    var tiles = (theme && theme.tiles) || {};
    return function (x, y, size) {
      var cell = size / SWATCH.length;
      ctx.save();
      for (var r = 0; r < SWATCH.length; r++) {
        for (var c = 0; c < SWATCH[r].length; c++) {
          var kind = SWATCH[r].charAt(c);
          ctx.fillStyle = kind === "W" ? (tiles.wall || "#3a4266") : kind === "S" ? (tiles.stairs || tiles.wall || "#3a4266") : (tiles.floor || "#141820");
          ctx.fillRect(Math.round(x + c * cell), Math.round(y + r * cell), Math.ceil(cell), Math.ceil(cell));
          if (kind === "S") {
            // 階段：明るい段を2本
            ctx.fillStyle = "rgba(255,255,255,0.35)";
            ctx.fillRect(Math.round(x + c * cell + 1), Math.round(y + r * cell + cell * 0.3), Math.ceil(cell - 2), 1);
            ctx.fillRect(Math.round(x + c * cell + 1), Math.round(y + r * cell + cell * 0.7), Math.ceil(cell - 2), 1);
          }
        }
      }
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, size - 1, size - 1);
      ctx.restore();
    };
  };

  /** 文を折り返して行に足す（style は color / dim など、どの行にも付ける値） */
  function pushWrapped(lines, text, charsPerLine, style) {
    var wrapped = splitDescription(text || "", charsPerLine);
    for (var i = 0; i < wrapped.length; i++) {
      var line = { text: wrapped[i] };
      for (var key in style) if (Object.prototype.hasOwnProperty.call(style, key)) line[key] = style[key];
      lines.push(line);
    }
  }

  DungeonSelectScene.prototype._charsPerLine = function () {
    return (this.layout.detail || {}).charsPerLine || 26;
  };

  /** 連れている仲間でいちばん高いレベル */
  DungeonSelectScene.prototype._bestLevel = function () {
    var members = (this.game.party && this.game.party.getMembers) ? this.game.party.getMembers() : [];
    var best = 0;
    for (var i = 0; i < members.length; i++) best = Math.max(best, members[i].level || 0);
    return best;
  };

  /** 穴の説明：絵・名前・進み具合／ひと言／区画の一覧（主の絵・状態） */
  DungeonSelectScene.prototype._regionContent = function () {
    var region = this.getSelectedRegion();
    if (!region) return null;
    var t = this.theme;
    var T = this.texts;
    var unlocked = this.isRegionUnlocked(region);
    var theme = this._regionTheme(region, unlocked);
    var head = { name: unlocked ? region.name : (T.unknownName || "？？？"),
                 nameColor: unlocked ? t.textColor : t.hintColor, chips: [] };
    if (theme) head.drawPicture = this._swatchDrawer(theme);
    else head.mark = "？";
    var lines = [];

    if (!unlocked) {
      head.chips.push({ label: T.locked || "", color: t.hintColor });
      pushWrapped(lines, this._regionLockedHint(region), this._charsPerLine(), { dim: true });
      return { head: head, lines: lines };
    }

    var state = this._regionState(region, true);
    head.chips.push({ label: state.text, color: state.color });
    var dungeons = this._dungeonsOf(region);
    var range = this._levelRange(dungeons);
    if (range) {
      head.sub = fill(range.min === range.max ? (T.recommendedLabel || "推奨Lv{level}") : (T.regionLevelRange || "推奨Lv{min}〜{max}"),
        { level: range.min, min: range.min, max: range.max });
    }

    if (region.subtitle) pushWrapped(lines, region.subtitle, this._charsPerLine(), {});
    if (dungeons.length === 0) {
      lines.push({ text: "" });
      pushWrapped(lines, T.comingSoonHint || "", this._charsPerLine(), { dim: true });
      return { head: head, lines: lines };
    }

    var progress = NS.DungeonCatalog.regionProgress(this.game.data, region.id, this.game.clearedDungeons);
    lines.push({ text: "" });
    lines.push({ heading: true, text: T.sectionsLabel || "", right: fill(T.countLabel || "{n}/{total}", { n: progress.cleared, total: progress.total }),
                 rightColor: progress.cleared >= progress.total ? t.cursorColor : t.hintColor });
    for (var i = 0; i < dungeons.length; i++) {
      lines.push(this._sectionLine(dungeons[i]));
      // その下に、最深階と主の有無（開いていて準備中でない区画だけ）
      var detail = this._sectionDetail(dungeons[i]);
      if (detail) lines.push({ indent: 24, text: detail, dim: true });
    }
    return { head: head, lines: lines };
  };

  /** 推奨レベルの幅（準備中・未開放の区画は数えない）。無ければ null */
  DungeonSelectScene.prototype._levelRange = function (dungeons) {
    var min = 0, max = 0;
    for (var i = 0; i < dungeons.length; i++) {
      var d = dungeons[i];
      if (isPreparing(d) || !this.isUnlocked(d) || !d.recommendedLevel) continue;
      if (!min || d.recommendedLevel < min) min = d.recommendedLevel;
      if (d.recommendedLevel > max) max = d.recommendedLevel;
    }
    return min ? { min: min, max: max } : null;
  };

  /** 穴の説明の区画1行：クリア済みなら主の絵、右に状態（クリア済・推奨Lv・未開放・準備中） */
  DungeonSelectScene.prototype._sectionLine = function (dungeon) {
    var t = this.theme;
    var T = this.texts;
    var open = this.isUnlocked(dungeon);
    var cleared = this.game.isDungeonCleared(dungeon.id);
    var line = { text: open ? dungeon.name : (T.unknownName || "？？？"),
                 color: !open ? t.hintColor : (cleared ? t.cursorColor : t.textColor) };
    // 絵はクリアした区画の主。主のいない区画（蔦這う回廊）は絵の場所を空けるだけ
    var bossSpecies = cleared ? this._bossSpecies(dungeon) : null;
    if (bossSpecies) line.sprite = bossSpecies.sprite;
    else if (open && !dungeon.boss) line.indent = 24;
    else line.unknownSprite = true;
    if (cleared) { line.right = T.cleared || ""; line.rightColor = t.cursorColor; }
    else if (!open) { line.right = T.locked || ""; line.rightColor = t.hintColor; }
    else if (isPreparing(dungeon)) { line.right = T.comingSoon || ""; line.rightColor = t.hintColor; }
    else if (dungeon.recommendedLevel) { line.right = this._recommendedText(dungeon); line.rightColor = this._recommendedColor(dungeon); }
    return line;
  };

  /** 穴の説明の区画の2行目「最深 B5F ・ 主なし」。未開放・準備中は null */
  DungeonSelectScene.prototype._sectionDetail = function (dungeon) {
    if (!this.isUnlocked(dungeon) || isPreparing(dungeon)) return null;
    var parts = [(this.texts.floorsLabel || "").replace("{floors}", dungeon.floors)];
    if (!dungeon.boss) parts.push(this.texts.noBoss || "主なし");
    return parts.join(this.texts.joiner || " ・ ");
  };

  /** その区画の主の種族（data/monsters.js）。主がいなければ null */
  DungeonSelectScene.prototype._bossSpecies = function (dungeon) {
    var boss = (this.game.data.bosses || {})[dungeon && dungeon.boss];
    return boss ? ((this.game.data.monsters || {})[boss.species] || null) : null;
  };

  /** 区画の説明：絵・名前・推奨Lv・状態・最深階／説明／モンスター／手に入るもの／主 */
  DungeonSelectScene.prototype._dungeonContent = function () {
    var dungeon = this.getSelected();
    if (!dungeon) return null;
    var t = this.theme;
    var T = this.texts;
    var unlocked = this.isUnlocked(dungeon);
    var preparing = isPreparing(dungeon);
    var cleared = this.game.isDungeonCleared(dungeon.id);
    var theme = this._themeOf(dungeon, unlocked);
    var cpl = this._charsPerLine();
    var head = { name: this._nameOf(dungeon, unlocked), nameColor: unlocked ? t.textColor : t.hintColor, chips: [] };
    if (theme) head.drawPicture = this._swatchDrawer(theme);
    else head.mark = "？";
    var lines = [];

    // 解放されていなければ、開く条件だけ
    if (!unlocked) {
      head.chips.push({ label: T.locked || "", color: t.hintColor });
      var required = this._requiredNameShown(dungeon.unlockedBy);
      pushWrapped(lines, (T.lockedHint || "").replace("{name}", required || ""), cpl, { dim: true });
      return { head: head, lines: lines };
    }
    // 準備中の区画は、中身がまだ無いことだけ（階数と推奨レベルは作っている途中で変わるので出さない）
    if (preparing) {
      head.chips.push({ label: T.comingSoon || "", color: t.hintColor });
      pushWrapped(lines, T.sectionComingSoonHint || T.comingSoonHint || "", cpl, { dim: true });
      return { head: head, lines: lines };
    }

    if (dungeon.recommendedLevel) head.chips.push({ label: this._recommendedText(dungeon), color: this._recommendedColor(dungeon) });
    if (cleared) head.chips.push({ label: T.cleared || "", color: t.cursorColor });
    head.sub = (T.floorsLabel || "").replace("{floors}", dungeon.floors);

    // 仲間の最高レベルが推奨に届いていなければ、上の欄の最深階の横に、あといくつかを添える（注意の色）
    var best = this._bestLevel();
    if (dungeon.recommendedLevel && best > 0 && best < dungeon.recommendedLevel) {
      head.sub += fill(T.underLevel || "　仲間の最高Lv{best}（あと{diff}）", { best: best, diff: dungeon.recommendedLevel - best });
      head.subColor = this.layout.underLevelColor || "#e8896a";
    }

    pushWrapped(lines, dungeon.description || "", cpl, {});

    var monsters = this._monsterLines(dungeon);
    lines.push({ text: "" });
    lines.push({ heading: true, text: T.monstersLabel || "", right: monsters.count, rightColor: t.hintColor });
    this._pushFolded(lines, monsters.lines, "monsters", T.moreMonsters);

    var items = this._itemLines(dungeon, cleared);
    lines.push({ text: "" });
    lines.push({ heading: true, text: T.dropsLabel || "", right: items.count, rightColor: t.hintColor });
    this._pushFolded(lines, items.lines, "items", T.moreItems);

    // 最深階に待つ相手。クリア済みなら絵と名前とレベル
    var boss = (this.game.data.bosses || {})[dungeon.boss];
    if (boss) {
      lines.push({ text: "" });
      lines.push({ heading: true, text: T.bossLabel || "" });
      var species = cleared ? this._bossSpecies(dungeon) : null;
      if (cleared) {
        lines.push({ sprite: species ? species.sprite : null, unknownSprite: !species,
                     text: (boss.title || "") + (species ? "  " + species.name : ""), color: t.textColor,
                     right: "Lv" + boss.level, rightColor: t.subTextColor });
      } else {
        lines.push({ unknownSprite: true, text: T.unknownBoss || "？？？", dim: true });
      }
    }
    return { head: head, lines: lines };
  };

  /**
   * 先頭の previewRows 行だけ並べ、残りがあれば「▶ ほかに〇体を見る」（押すか C で開く）。
   * 開いているときは全部並べ、最後に「▼ たたむ」。開け閉めは game.dungeonListsOpen に覚える
   * （区画を変えても、画面を閉じても残る。セーブはしない。工房の「手に入る場所」と同じ）
   */
  DungeonSelectScene.prototype._pushFolded = function (lines, entries, key, moreText) {
    var t = this.theme;
    var preview = (this.layout.detail || {}).previewRows || 2;
    if (entries.length <= preview) { lines.push.apply(lines, entries); return; }
    var open = !!this._openLists()[key];
    lines.push.apply(lines, open ? entries : entries.slice(0, preview));
    lines.push({ indent: 24, toggle: key, color: open ? t.cursorColor : t.subTextColor,
                 text: open ? (this.texts.foldLabel || "▼ たたむ")
                            : fill(moreText || "▶ ほかに{n}つを見る", { n: entries.length - preview }) });
  };

  DungeonSelectScene.prototype._openLists = function () {
    if (!this.game.dungeonListsOpen) this.game.dungeonListsOpen = {};
    return this.game.dungeonListsOpen;
  };

  DungeonSelectScene.prototype._toggleList = function (key) {
    var open = this._openLists();
    open[key] = !open[key];
  };

  /** C：どちらかが閉じていれば両方開く。両方開いていれば両方たたむ */
  DungeonSelectScene.prototype._toggleAllLists = function () {
    if (!this._hasFolded()) return;
    var open = this._openLists();
    var next = !(open.monsters && open.items);
    open.monsters = next;
    open.items = next;
  };

  /** いま選んでいる区画に、たためる一覧（先頭の2つより多い）があるか */
  DungeonSelectScene.prototype._hasFolded = function () {
    var dungeon = this.getSelected();
    if (this.phase !== "dungeon" || !dungeon || !this.isUnlocked(dungeon) || isPreparing(dungeon)) return false;
    var preview = (this.layout.detail || {}).previewRows || 2;
    return this._monsterLines(dungeon).lines.length > preview ||
           this._itemLines(dungeon, this.game.isDungeonCleared(dungeon.id)).lines.length > preview;
  };

  /**
   * 出現するモンスター（1行に1体。絵と、名前を属性の色で。右に「仲間にした」）。
   * 一度も戦っていない種族は「？」の絵と「？？？」（2026-10-27 作者の指定）。
   * 戦ったかどうかは図鑑と同じ記録（discovery の monstersSeen。戦闘が始まった時点で付く）
   * @returns {{ lines: object[], count: string }} count は「見た数/全部」
   */
  DungeonSelectScene.prototype._monsterLines = function (dungeon) {
    var data = this.game.data;
    var discovery = this.game.discovery;
    var t = this.theme;
    var species = NS.DungeonCatalog.getSpecies(data, dungeon);
    var lines = [];
    var seen = 0;

    for (var i = 0; i < species.length; i++) {
      if (discovery && !discovery.isMonsterSeen(species[i].id)) {
        lines.push({ unknownSprite: true, text: this.texts.unknownEntry || "？？？", dim: true });
        continue;
      }
      seen++;
      var element = (data.elements || {})[species[i].element];
      var caught = discovery && discovery.isMonsterCaught && discovery.isMonsterCaught(species[i].id);
      lines.push({ sprite: species[i].sprite, text: species[i].name,
                   color: (element && element.color) || t.textColor,
                   right: caught ? (this.texts.caughtMark || "") : "", rightColor: t.hintColor });
    }
    return { lines: lines, count: fill(this.texts.countLabel || "{n}/{total}", { n: seen, total: species.length }) };
  };

  /**
   * 手に入るもの（1行に1つ。絵と、名前を分類の色で。ボスの分はクリア後に出る）。
   * 一度も手に入れていないものは「？」と「？？？」（2026-10-27 作者の指定）。
   * 入手したかどうかは図鑑と同じ記録（discovery の itemsObtained。Game.giveItem で付く）
   */
  DungeonSelectScene.prototype._itemLines = function (dungeon, cleared) {
    var data = this.game.data;
    var discovery = this.game.discovery;
    var items = NS.DungeonCatalog.getDropItems(data, dungeon, cleared);
    var categories = (data.categories || {}).item || {};
    var lines = [];
    var got = 0;

    for (var i = 0; i < items.length; i++) {
      if (discovery && !discovery.isItemObtained(items[i].id)) {
        lines.push({ unknownSprite: true, text: this.texts.unknownEntry || "？？？", dim: true });
        continue;
      }
      got++;
      var category = categories[items[i].category];
      lines.push({ icon: items[i].icon, text: items[i].name,
                   color: (category && category.color) || this.theme.textColor });
    }
    if (lines.length === 0) lines.push({ text: this.texts.noDrops || "", dim: true });
    return { lines: lines, count: fill(this.texts.countLabel || "{n}/{total}", { n: got, total: items.length }) };
  };

  DungeonSelectScene.prototype._renderHint = function () {
    var pos = this.layout.hint || { x: 48, y: 570 };
    var text = (this.phase === "region") ? (this.texts.regionHint || this.texts.hint)
             : (this.singleRegion ? (this.texts.hintSingle || this.texts.hint) : this.texts.hint);
    // たためる一覧があれば「C: ほかも見る」、右の説明が入りきらないときだけ「Q/E: 送る」（v1.4.0）
    var extra = (this._hasFolded() ? (this.texts.hintMore || "") : "") + (this.pane.canScroll() ? (this.texts.hintScroll || "") : "");
    text = fill(text || "", { extra: extra });
    this.panel.drawText(text, pos.x, pos.y,
      { font: this.theme.smallFont, color: this.theme.hintColor });
  };

  /** 改行で区切ったうえ、長い行は文字数で折り返す */
  function splitDescription(text, charsPerLine) {
    var result = [];
    var paragraphs = text.split("\n");

    for (var i = 0; i < paragraphs.length; i++) {
      var lines = wrapText(paragraphs[i], charsPerLine);
      for (var j = 0; j < lines.length; j++) result.push(lines[j]);
    }
    return result;
  }

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

  NS.DungeonSelectScene = DungeonSelectScene;
})(window.MyGame);
