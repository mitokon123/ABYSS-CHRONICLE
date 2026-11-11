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
      this._renderRegionDetail();
    } else {
      for (var i = 0; i < this.dungeons.length; i++) this._renderRow(this.dungeons[i], i);
      this._renderDetail();
    }
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

  /** 右側：選んでいる穴の詳細（ひと言と区画の一覧。開いていなければ条件だけ） */
  DungeonSelectScene.prototype._renderRegionDetail = function () {
    var rect = this.layout.detail;
    var region = this.getSelectedRegion();
    if (!rect || !region) return;

    this.panel.drawBox(rect);
    var t = this.theme;
    var origin = this.panel.innerOrigin(rect);
    var lh = rect.lineHeight || t.lineHeight || 18;
    var unlocked = this.isRegionUnlocked(region);
    var name = unlocked ? region.name : (this.texts.unknownName || "？？？");

    var y = this._renderBanner(rect, this._regionTheme(region, unlocked), name, unlocked) + lh + 6;

    if (!unlocked) {
      this._renderLines(wrapText(this._regionLockedHint(region), rect.charsPerLine || 15),
        origin.x, y, t.hintColor, lh);
      return;
    }

    if (region.subtitle) {
      y = this._renderLines(splitDescription(region.subtitle, rect.charsPerLine || 15),
        origin.x, y, t.subTextColor, lh) + lh;
    }

    var dungeons = this._dungeonsOf(region);
    if (dungeons.length === 0) {
      this._renderLines(wrapText(this.texts.comingSoonHint || "", rect.charsPerLine || 15),
        origin.x, y, t.hintColor, lh);
      return;
    }

    // 区画の一覧。開いていない区画は名前を伏せる
    this.panel.drawText(this.texts.sectionsLabel || "", origin.x, y, { font: t.smallFont, color: t.hintColor });
    y += lh;
    for (var i = 0; i < dungeons.length; i++) {
      var d = dungeons[i];
      var open = this.isUnlocked(d);
      var cleared = this.game.isDungeonCleared(d.id);
      var mark = cleared ? (this.texts.cleared || "") : (isPreparing(d) ? (this.texts.comingSoon || "") : "");
      this.panel.drawText((open ? d.name : (this.texts.unknownName || "？？？")) +
        (mark ? "  " + mark : ""),
        origin.x, y, { font: t.smallFont, color: !open ? t.hintColor : (cleared ? t.cursorColor : t.textColor) });
      y += lh;
    }
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
    var members = (this.game.party && this.game.party.getMembers) ? this.game.party.getMembers() : [];
    var best = 0;
    for (var i = 0; i < members.length; i++) best = Math.max(best, members[i].level || 0);
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

  /**
   * 右側：選んでいる場所の詳細。
   * 上から順に 説明 → 出現するモンスター → 手に入るもの → 主 を縦に流し込む。
   */
  DungeonSelectScene.prototype._renderDetail = function () {
    var rect = this.layout.detail;
    if (!rect) return;

    this.panel.drawBox(rect);

    var dungeon = this.getSelected();
    if (!dungeon) return;

    var t = this.theme;
    var origin = this.panel.innerOrigin(rect);
    var lh = rect.lineHeight || t.lineHeight || 18;
    var unlocked = this.isUnlocked(dungeon);

    // 帯の下端から少し離して書き始める（帯と文章がくっつくと読みにくい）
    var y = this._renderDetailBanner(rect, dungeon, unlocked) + lh + 6;

    // 解放されていなければ、必要な条件だけを出す
    if (!unlocked) {
      var required = this._requiredNameShown(dungeon.unlockedBy);
      var hint = (this.texts.lockedHint || "").replace("{name}", required || "");
      this._renderLines(wrapText(hint, rect.charsPerLine || 15),
        origin.x, y, t.hintColor, lh);
      return;
    }

    // 準備中の区画は、中身がまだ無いことだけを出す
    if (isPreparing(dungeon)) {
      this._renderLines(wrapText(this.texts.sectionComingSoonHint || this.texts.comingSoonHint || "",
        rect.charsPerLine || 15), origin.x, y, t.hintColor, lh);
      return;
    }

    y = this._renderLines(
      splitDescription(dungeon.description || "", rect.charsPerLine || 15),
      origin.x, y, t.subTextColor, lh);

    y += lh;
    y = this._renderSection(this.texts.monstersLabel,
      this._monsterEntries(dungeon), origin.x, y, rect, lh);

    y += lh - 4;
    y = this._renderSection(this.texts.dropsLabel,
      this._itemEntries(dungeon), origin.x, y, rect, lh);

    // 最深階に待つ相手。クリア済みなら名前を出す
    var boss = (this.game.data.bosses || {})[dungeon.boss];
    if (!boss) return;

    y += lh - 4;
    var known = this.game.isDungeonCleared(dungeon.id);
    this.panel.drawText(
      (this.texts.bossLabel || "") + " " +
      (known ? (boss.title || "") : (this.texts.unknownBoss || "")),
      origin.x, y, { font: t.smallFont, color: t.cursorColor });
  };

  /**
   * 詳細欄の上部に、その場所の色の帯と名前を出す。
   * 帯の色は実際のダンジョンの壁と床の色なので、潜る前に雰囲気が伝わる。
   *
   * 帯は下へ行くほど枠の色へ溶けるようにして、下端に線を引かない。
   * 線を引くと文章のすぐ上に横線が走って、窮屈に見えるため。
   *
   * @returns {number} 帯の下端のy（続きはここから離して書く）
   */
  DungeonSelectScene.prototype._renderDetailBanner = function (rect, dungeon, unlocked) {
    return this._renderBanner(rect, this._themeOf(dungeon, unlocked), this._nameOf(dungeon, unlocked), unlocked);
  };

  /** 詳細欄の上部の帯と名前（穴の詳細と区画の詳細で共通）。帯の下端のyを返す */
  DungeonSelectScene.prototype._renderBanner = function (rect, theme, name, unlocked) {
    var origin = this.panel.innerOrigin(rect);
    var banner = rect.banner;

    if (!banner || !banner.height) {
      var plainY = origin.y + 20;
      this.panel.drawText(name, origin.x, plainY);
      return plainY;
    }

    var tiles = (theme && theme.tiles) || {};
    var locked = this.layout.lockedColor || "#242a3a";

    var ctx = this.game.ctx;
    var top = rect.y + 2;
    var bottom = top + banner.height;

    // 上は壁の色、下は枠の色。境目が出ないよう、下端は透明にして溶かす
    var gradient = ctx.createLinearGradient(0, top, 0, bottom);
    gradient.addColorStop(0, tiles.wall || locked);
    gradient.addColorStop(0.55, (theme && theme.background) || locked);
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(rect.x + 2, top, rect.w - 4, banner.height);
    ctx.restore();

    // 名前は帯の上寄りに置く（下は溶けているので、そこに文字を置くと沈んで見える）
    this.panel.drawText(name,
      origin.x, top + Math.floor(banner.height * 0.42) + 6,
      { color: unlocked ? this.theme.textColor : this.theme.hintColor });

    return bottom;
  };

  /** 文字列の配列を1行ずつ描き、次の描画位置を返す */
  DungeonSelectScene.prototype._renderLines = function (lines, x, y, color, lh) {
    for (var i = 0; i < lines.length; i++) {
      this.panel.drawText(lines[i], x, y, { font: this.theme.smallFont, color: color });
      y += lh;
    }
    return y;
  };

  /**
   * 見出し＋名前の一覧を、指定の列数で並べる。
   * @param {string} label 見出し
   * @param {object[]} entries [{ text, color }]
   * @returns {number} 次の描画位置
   */
  DungeonSelectScene.prototype._renderSection = function (label, entries, x, y, rect, lh) {
    var t = this.theme;
    var columns = rect.columns || 2;
    var columnWidth = rect.columnWidth || 130;

    this.panel.drawText(label || "", x, y, { font: t.smallFont, color: t.hintColor });
    y += lh;

    for (var i = 0; i < entries.length; i++) {
      var col = i % columns;
      this.panel.drawText(entries[i].text, x + columnWidth * col, y,
        { font: t.smallFont, color: entries[i].color || t.textColor });
      if (col === columns - 1) y += lh;
    }
    // 最後の行が埋まりきらなかった場合も1行ぶん進める
    if (entries.length % columns !== 0) y += lh;
    return y;
  };

  /**
   * 出現するモンスター（名前を属性の色で出す）。
   * 一度も戦っていない種族は「？？？」（2026-10-27 作者の指定）。
   * 戦ったかどうかは図鑑と同じ記録（discovery の monstersSeen。戦闘が始まった時点で付く）
   */
  DungeonSelectScene.prototype._monsterEntries = function (dungeon) {
    var data = this.game.data;
    var discovery = this.game.discovery;
    var species = NS.DungeonCatalog.getSpecies(data, dungeon);
    var entries = [];

    for (var i = 0; i < species.length; i++) {
      if (discovery && !discovery.isMonsterSeen(species[i].id)) {
        entries.push({ text: this.texts.unknownEntry || "？？？", color: this.theme.hintColor });
        continue;
      }
      var element = (data.elements || {})[species[i].element];
      entries.push({
        text: species[i].name,
        color: (element && element.color) || this.theme.textColor
      });
    }
    return entries;
  };

  /**
   * 手に入るもの（名前を分類の色で出す。ボスの分はクリア後に出る）。
   * 一度も手に入れていないものは「？？？」（2026-10-27 作者の指定）。
   * 入手したかどうかは図鑑と同じ記録（discovery の itemsObtained。Game.giveItem で付く）
   */
  DungeonSelectScene.prototype._itemEntries = function (dungeon) {
    var data = this.game.data;
    var discovery = this.game.discovery;
    var cleared = this.game.isDungeonCleared(dungeon.id);
    var items = NS.DungeonCatalog.getDropItems(data, dungeon, cleared);
    var categories = (data.categories || {}).item || {};
    var entries = [];

    for (var i = 0; i < items.length; i++) {
      if (discovery && !discovery.isItemObtained(items[i].id)) {
        entries.push({ text: this.texts.unknownEntry || "？？？", color: this.theme.hintColor });
        continue;
      }
      var category = categories[items[i].category];
      entries.push({
        text: items[i].name,
        color: (category && category.color) || this.theme.textColor
      });
    }
    if (entries.length === 0) {
      entries.push({ text: this.texts.noDrops || "", color: this.theme.hintColor });
    }
    return entries;
  };

  DungeonSelectScene.prototype._renderHint = function () {
    var pos = this.layout.hint || { x: 48, y: 570 };
    var text = (this.phase === "region") ? (this.texts.regionHint || this.texts.hint)
             : (this.singleRegion ? (this.texts.hintSingle || this.texts.hint) : this.texts.hint);
    this.panel.drawText(text || "", pos.x, pos.y,
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

  /** 文字数で折り返す（等幅フォント前提の簡易処理） */
  // 折り返しは共通（js/namespace.js の MyGame.wrapText。行の頭に句読点を置かない）
  function wrapText(text, charsPerLine) {
    return NS.wrapText(text, charsPerLine);
  }

  NS.DungeonSelectScene = DungeonSelectScene;
})(window.MyGame);
