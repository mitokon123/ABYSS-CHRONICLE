/**
 * HomeScene.js
 * 拠点（ホーム）画面。ダンジョンへ出発する前の準備を行う場所。
 *
 * 左にメニュー、右に手持ちの一覧を出す。
 * 未実装の項目（もちもの・ずかん・せってい）は枠だけ用意してあり、
 * 選ぶと「じゅんびちゅう」と表示する。実装できたら MENU_ITEMS の
 * ready を true にして、_openFeature に処理を足すだけでよい。
 *
 * ▼ 選んでいる項目のひと言（v1.4.0・2026-11-12）
 *   メニューの下に2行：何ができるか（messages.home.descriptions）と、いまの様子
 *   （次に潜る区画・作れるものの数・編成の数など。_menuInfo）。使えない項目は開く条件
 *
 * 配置・配色は data/ui.js の home、文言は data/messages.js の home で管理する。
 */
(function (NS) {
  "use strict";

  var NOTICE_DURATION = 1600;      // 通知を表示しておく時間（ms）
  var RETURN_NOTICE_DURATION = 3600; // 帰還の知らせは読ませたいので長めに出す

  // メニューの並び・絵・解放条件は data/home.js が持つ

  /**
   * @param {MyGame.Game} game
   * @param {string} [notice] 開いたときに一度だけ表示する知らせ（挑戦の結果など）
   */
  function HomeScene(game, notice) {
    this.game = game;
    this._pendingNotice = notice || null;

    var ui = game.data.ui || {};
    this.theme = ui.theme || {};
    this.layout = ui.home || {};
    this.texts = (game.data.messages || {}).home || {};

    this.panel = new NS.Panel(game.ctx, this.theme);
    this.hpBar = new NS.HpBar(game.ctx, this.theme);
    this.sprites = new NS.SpriteRenderer(game.ctx, game.assets);
    this.renderer = new NS.Renderer(game.ctx);
    // 描き手を渡すと、項目の左に絵がつく（data/ui.js の menu.iconSize）
    this.menu = new NS.CommandMenu(this.panel, this.layout.menu, this.sprites);

    this.particles = new NS.ParticleField(
      this.layout.particles, game.canvas.width, game.canvas.height
    );

    this.random = new NS.Random();

    this.notice = new NS.Notice(this.theme.notice);
    // 初めての場面で出る説明（出ているあいだはメニューを操作できない）
    this.tutorial = new NS.TutorialBox(this.panel, game);

    // Esc で出す「タイトルに戻りますか？」。セーブせずに戻ってしまう事故を防ぐ
    this.confirming = false;
    this.confirmMenu = new NS.CommandMenu(this.panel, (this.layout.confirm || {}).menu);
    this.confirmMenu.setItems([
      { label: this.texts.toTitleNo  || "いいえ", value: "no" },
      { label: this.texts.toTitleYes || "はい",   value: "yes" }
    ]);

    // 画面に出している所持金。実際の額へ向かって少しずつ動かす
    this._shownGold = null;

    // たき火を囲む仲間（data/ui.js の home.camp）。
    // 1回だけの動き（喜ぶ）は MotionPlayer、次に何かする時刻とうたた寝の終わりは席ごとに持つ
    this.campMotions = new NS.MotionPlayer(game.data);
    // 絆の仲間に触れたときのハート（v1.4.4）
    this.hearts = new NS.HeartBurst(((game.data.ui || {}).theme || {}).hearts);
    this._campNext = [];
    this._dozeUntil = [];

    this._ensureParty();
    this._buildMenu();
  }

  /** 進行データ（パーティ・持ち物・発見記録）を用意する */
  HomeScene.prototype._ensureParty = function () {
    this.game.ensureProgress();
    // 拠点では仲間を常に全快にしておく（スカウトした仲間・装備の着け替えも含めて）
    this.game.restoreAtHome();
  };

  /**
   * メニューを組み立てる。
   * まだ使えない項目も並べるが、灰色にして「今は選べない」ことを示す
   * （隠してしまうと、何が増えるのか分からなくなるため）。
   */
  HomeScene.prototype._buildMenu = function () {
    var entries = (this.game.data.home || {}).menu || [];
    var items = [];
    var keep = this.menu.index;   // 組み直しても、選んでいた場所に戻す
    var badges = this._menuBadges();

    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var locked = !this._isEntryUnlocked(entry);

      items.push({
        label: this.texts[entry.key] || entry.key,
        value: entry.value,
        ready: entry.ready !== false,
        locked: locked,
        unlockedBy: entry.unlockedBy,
        icon: entry.icon,
        color: locked ? this.theme.hintColor : null,
        // まだ使えない項目には札を出さない
        badge: locked ? null : (badges[entry.value] || null)
      });
    }
    this.menu.setItems(items);
    if (keep > 0 && keep < items.length) this.menu.index = keep;
  };

  // --- メニューの札（作れる・新入荷・NEW） ---

  /**
   * メニューの右端に出す札。{ craft: "作れる", shop: "新入荷", dex: "NEW" } のうち、当てはまるものだけ。
   *
   * 店と図鑑は「前に開いたときから増えたか」を見るので、何を見たかを game.homeSeen に持つ
   * （セーブにも入る）。持っていないとき（新しく始めた・古いセーブ）は、
   * いま並んでいるものを全部見たことにして始める。最初から印だらけにならないように。
   */
  HomeScene.prototype._menuBadges = function () {
    var game = this.game;
    if (!game.inventory || !game.discovery) return {};

    if (!game.homeSeen) {
      game.homeSeen = { shop: this._shopKeysSeenNow(), dex: this._dexCount() };
    }

    var badges = {};
    if (this._canCraftSomething()) badges.craft = this.texts.badgeCraft || "!";

    var seen = game.homeSeen.shop || {};
    var keys = this._shopListedKeys();
    for (var i = 0; i < keys.length; i++) {
      if (!seen[keys[i]]) { badges.shop = this.texts.badgeShop || "!"; break; }
    }

    if (this._dexCount() > (game.homeSeen.dex || 0)) badges.dex = this.texts.badgeDex || "!";
    return badges;
  };

  /** いまの素材とお金で、工房で作れるものが1つでもあるか */
  HomeScene.prototype._canCraftSomething = function () {
    if (!NS.CraftSystem) return false;
    var craft = new NS.CraftSystem(this.game.data);
    var recipes = craft.getRecipes(this.game.clearedDungeons);
    for (var i = 0; i < recipes.length; i++) {
      if (craft.canCraft(this.game, recipes[i]).ok) return true;
    }
    return false;
  };

  /**
   * いま開いている店に並んでいるものの一覧（"item:herb" / "blessing:firstStrike" の形）。
   * 謎の商人（type: "blessing"）は加護を並べるので、加護のid で数える
   */
  HomeScene.prototype._shopListedKeys = function () {
    var data = this.game.data;
    var cleared = this.game.clearedDungeons;
    var shops = (data.shop || {}).shops || [];
    var system = NS.ShopSystem ? new NS.ShopSystem(data) : null;
    var met = function (condition) {
      return !condition || !NS.DungeonCatalog || NS.DungeonCatalog.isConditionMet(condition, cleared, data);
    };
    var keys = [];

    for (var i = 0; i < shops.length; i++) {
      var shop = shops[i];
      if (!met(shop.unlockedBy)) continue;

      if (shop.type === "blessing") {
        var blessings = data.blessings || {};
        for (var id in blessings) {
          if (!Object.prototype.hasOwnProperty.call(blessings, id)) continue;
          if (blessings[id].locked && met(blessings[id].unlockedBy)) keys.push("blessing:" + id);
        }
      } else if (system) {
        var stock = system.getStock(cleared, shop);
        for (var s = 0; s < stock.length; s++) keys.push("item:" + stock[s].item.id);
      }
    }
    return keys;
  };

  /** いま並んでいるものを「見た」として { key: true } にする */
  HomeScene.prototype._shopKeysSeenNow = function () {
    var seen = {};
    var keys = this._shopListedKeys();
    for (var i = 0; i < keys.length; i++) seen[keys[i]] = true;
    return seen;
  };

  /**
   * 図鑑の記録の数。見た・仲間にした種族、手に入れたアイテム、覚えた技、
   * 愛情度で書き足された記録（段階の数）を足したもの。増えたら「NEW」
   */
  HomeScene.prototype._dexCount = function () {
    var d = this.game.discovery || {};
    var count = 0;
    var groups = [d.monstersSeen, d.monstersCaught, d.itemsObtained, d.skillsLearned];
    for (var i = 0; i < groups.length; i++) count += Object.keys(groups[i] || {}).length;
    var stages = d.affectionStages || {};
    for (var id in stages) {
      if (Object.prototype.hasOwnProperty.call(stages, id)) count += stages[id] || 0;
    }
    return count;
  };

  /** 店・図鑑を開いたら、いまの分は見たことにする（札が消える） */
  HomeScene.prototype._markSeen = function (value) {
    var game = this.game;
    if (!game.homeSeen) return;
    if (value === "shop") game.homeSeen.shop = this._shopKeysSeenNow();
    if (value === "dex") game.homeSeen.dex = this._dexCount();
  };

  /** その項目が使えるか。条件の判定はダンジョンや店と同じ仕組みを使う */
  HomeScene.prototype._isEntryUnlocked = function (entry) {
    if (!entry.unlockedBy) return true;
    if (!NS.DungeonCatalog) return true;

    return NS.DungeonCatalog.isConditionMet(
      entry.unlockedBy, this.game.clearedDungeons, this.game.data);
  };

  HomeScene.prototype.enter = function () {
    // 拠点まわりの画面（仲間・持ち物・設定…）から戻ってきても、
    // 同じidなので曲は流れたまま途切れない。
    // 店と工房だけは自分の曲を持つので、戻るとここで拠点の曲に戻る
    this.game.audio.playBgm("home");
    this._ensureParty();
    // 戻ってくるたびに組み直す（クリアして使えるようになった項目を反映するため）
    this._buildMenu();
    // ひと言の「いまの様子」も作り直す（作れるもの・持ち物の数は戻るたびに変わる）
    this._infoCache = {};

    // 帰還時の知らせ（失ったものなど）は、開いたときに一度だけ出す
    if (this._pendingNotice) {
      this._showNotice(this._pendingNotice, RETURN_NOTICE_DURATION);
      this._pendingNotice = null;
    }

    // 初めて拠点を開いたときの説明。
    // 知らせを出したときは重ならないよう、次に開いたときへ回す
    if (this.game.tutorial && !this.notice.isActive()) {
      this.tutorial.show(this.game.tutorial.take("homeReturn"));
    }
  };

  // --- 更新 ---

  HomeScene.prototype.update = function (dt) {
    this.particles.update(dt);
    this._updateGold();

    this.notice.update(dt);

    // たき火の仲間は、説明や確認の窓が出ていても動き続ける（押せるのは窓が無いときだけ）
    var busy = this.tutorial.isActive() || this.confirming;
    this._updateCamp(busy ? null : this.game.input);

    // 説明を出している間はメニューを触らせない
    if (this.tutorial.isActive()) {
      this.tutorial.handleInput(this.game.input);
      return;
    }

    if (this.confirming) {
      this._updateConfirm();
      return;
    }

    var result = this.menu.handleInput(this.game.input);
    if (!result) return;

    if (result.type === "cancel") {
      this.confirmMenu.index = 0;   // 既定は「いいえ」
      this.confirming = true;
      return;
    }
    if (result.type === "confirm") this._select(result.value);
  };

  // --- たき火を囲む仲間 ---

  /** 範囲 [min, max] の中からばらけた値 */
  HomeScene.prototype._between = function (range, fallback) {
    var r = range || fallback;
    return r[0] + this.random.next() * (r[1] - r[0]);
  };

  /** その席の当たり判定（押すと喜ぶ） */
  HomeScene.prototype._seatRect = function (monster, index) {
    var C = this.layout.camp;
    var size = Math.round(C.spriteSize * (monster.getSizeScale ? monster.getSizeScale() : 1));
    return { x: C.seats[index] - size / 2, y: C.baseY - size, w: size, h: size };
  };

  /**
   * ときどき喜ぶ・うたた寝する。押されたら喜ぶ（眠っていれば起きてから）。
   * @param {MyGame.Input|null} input 窓が出ているときは null（押せない）
   */
  HomeScene.prototype._updateCamp = function (input) {
    var C = this.layout.camp;
    var party = this.game.party;
    if (!C || !party) return;

    var clock = this.game.clock || 0;
    this.campMotions.update(clock);
    var pointer = (input && input.getPointer) ? input.getPointer() : null;

    for (var i = 0; i < party.size() && i < C.seats.length; i++) {
      var monster = party.get(i);

      // 最初は席ごとにずらして始める（全員が同時に喜ばないように）
      if (!this._campNext[i]) this._campNext[i] = clock + this._between([1500, (C.cheerEvery || [7000])[0]], [1500, 7000]);

      var clicked = pointer && pointer.clicked && pointer.inside &&
                    NS.Panel.containsPoint(this._seatRect(monster, i), pointer);

      if (clicked) {
        this._dozeUntil[i] = 0;
        this._cheer(monster);
        // 絆（愛情度の報酬の段階）の仲間は、ときどきハートを出す（v1.4.4・作者の指定）
        if (monster.hasReachedBondReward && monster.hasReachedBondReward() &&
            this.random.next() < (C.bondHeartChance === undefined ? 0.5 : C.bondHeartChance)) {
          var seat = this._seatRect(monster, i);
          this.hearts.add(seat.x + seat.w / 2, seat.y + 4, clock, C.bondHearts || 3);
        }
        this._campNext[i] = clock + this._between(C.cheerEvery, [7000, 15000]);
        continue;
      }
      if (clock < this._campNext[i]) continue;

      if (this._dozeUntil[i] > clock) continue;   // 眠っているあいだは何もしない
      if (this._dozeUntil[i]) {
        // 目を覚ましたところ。すぐには喜ばない
        this._dozeUntil[i] = 0;
        this._campNext[i] = clock + this._between(C.cheerEvery, [7000, 15000]);
        continue;
      }

      if (this.random.next() < (C.dozeChance || 0)) {
        var doze = this._between(C.dozeFor, [6000, 11000]);
        this._dozeUntil[i] = clock + doze;
        this._campNext[i] = clock + doze;
      } else {
        this._cheer(monster);
        this._campNext[i] = clock + this._between(C.cheerEvery, [7000, 15000]);
      }
    }
  };

  /** 喜ぶ動き（その種族の levelUp。スライムなら跳ねる、コウモリなら羽ばたく） */
  HomeScene.prototype._cheer = function (monster) {
    var id = monster.getActionMotionId ? monster.getActionMotionId("levelUp") : null;
    // 向きは戦闘で味方が喜ぶときと同じ（BattleScene の levelUp）
    if (id) this.campMotions.play(monster, id, this.game.clock, 1);
  };

  /** 仲間を席に描く。足もとに影を落とし、眠っていれば頭の上に z を昇らせる */
  HomeScene.prototype._renderCamp = function (ctx) {
    var C = this.layout.camp;
    var party = this.game.party;
    if (!C || !party) return;

    var data = this.game.data;
    var clock = this.game.clock || 0;

    for (var i = 0; i < party.size() && i < C.seats.length; i++) {
      var monster = party.get(i);
      var rect = this._seatRect(monster, i);
      var dozing = this._dozeUntil[i] > clock;

      ctx.save();
      ctx.fillStyle = C.shadow || "rgba(0,0,0,0.4)";
      ctx.beginPath();
      ctx.ellipse(C.seats[i], C.baseY - 1, rect.w * 0.34, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      var sprite = monster.getSpriteId();
      var phase = monster.getMotionPhase();
      // うたた寝は戦闘の眠りと同じ動き（種族が motions.sleeping を持っていればそちら）
      var idle = dozing
        ? NS.Motion.of(data, monster.getActionMotionId("sleeping") || "sleeping", clock, phase)
        : NS.Motion.forSprite(data, sprite, monster.getMotionId(), clock, phase);
      var combined = NS.Motion.combine(idle, this.campMotions.get(monster, clock));

      var poseSprite = combined.pose ? monster.getPoseSpriteId(combined.pose) : null;
      if (poseSprite) {
        sprite = poseSprite;
        combined.frame = 0;
      } else if (dozing && Object.prototype.toString.call(sprite) === "[object Array]") {
        combined.frame = 0;   // 眠りの絵が無い種族は、コマ絵の1枚目で止める
      }
      this.sprites.drawMotion(sprite, rect.x, rect.y, rect.w, rect.h, combined);

      if (dozing) this._renderZzz(ctx, rect, clock, i);
    }
    // 絆の仲間のハート（v1.4.4）。仲間より手前
    if (this.hearts) this.hearts.render(ctx, clock);
  };

  /** 眠っている印。小さな z が2つ、ずれて昇って消える */
  HomeScene.prototype._renderZzz = function (ctx, rect, clock, seed) {
    var C = this.layout.camp;
    for (var k = 0; k < 2; k++) {
      var t = ((clock + seed * 700 + k * 1100) % 2200) / 2200;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t) * 0.9;
      ctx.font = (k === 0 ? 10 : 12) + "px monospace";
      ctx.fillStyle = C.zzzColor || "#9fb3ff";
      ctx.fillText("z", rect.x + rect.w * 0.75 + t * 8, rect.y + 4 - t * 18);
      ctx.restore();
    }
  };

  /** 「タイトルに戻りますか？」の操作。Esc と「いいえ」は拠点に残る */
  HomeScene.prototype._updateConfirm = function () {
    var result = this.confirmMenu.handleInput(this.game.input);
    if (!result) return;

    if (result.type === "cancel" || result.value === "no") {
      this.confirming = false;
      return;
    }
    if (result.value === "yes") {
      this.game.scenes.change(new NS.TitleScene(this.game));
    }
  };

  HomeScene.prototype._select = function (value) {
    var selected = this.menu.getSelected();
    if (!selected) return;

    // 未実装の項目は知らせるだけで、画面は変えない
    if (selected.ready === false) {
      var template = this.texts.comingSoon || "{name}";
      this._showNotice(template.replace("{name}", selected.label));
      this.game.playError();
      return;
    }

    // まだ使えない項目は、何をすれば使えるかを知らせる
    if (selected.locked) {
      this._showNotice(this._lockedMessage(selected));
      this.game.playError();
      return;
    }

    this._openFeature(value);
  };

  /** 「○○ は △△ をクリアすると使える」。条件の名前が分からなければ短い文 */
  HomeScene.prototype._lockedMessage = function (item) {
    var required = NS.DungeonCatalog
      ? NS.DungeonCatalog.conditionName(
          this.game.data, item.unlockedBy, this.game.clearedDungeons)
      : null;

    if (!required) {
      return (this.texts.lockedShort || "{name}").replace("{name}", item.label);
    }
    return (this.texts.locked || "{name}")
      .replace("{name}", item.label)
      .replace("{required}", required);
  };

  /** 実装済みの項目を開く */
  HomeScene.prototype._openFeature = function (value) {
    this._markSeen(value);
    switch (value) {
      case "dungeon":
        // どの場所へ挑むかを選んでもらう
        this.game.scenes.change(new NS.DungeonSelectScene(this.game, this));
        break;
      case "party":
        this.game.scenes.change(new NS.PartyScene(this.game, this));
        break;
      case "shop":
        this.game.scenes.change(new NS.ShopScene(this.game, this));
        break;
      case "craft":
        this.game.scenes.change(new NS.CraftScene(this.game, this));
        break;
      case "blessing":
        this.game.scenes.change(new NS.BlessingSelectScene(this.game, this));
        break;
      case "items":
        this.game.scenes.change(new NS.ItemScene(this.game, this));
        break;
      case "dex":
        this.game.scenes.change(new NS.DexScene(this.game, this));
        break;
      case "help":
        this.game.scenes.change(new NS.HelpScene(this.game, this));
        break;
      case "save":
        this._save();
        break;
      case "settings":
        this.game.scenes.change(new NS.SettingsScene(this.game, this));
        break;
    }
  };

  /**
   * 拠点からのセーブ。書き込む先のファイルを選ぶ画面へ。
   * 実際に書くのは SaveSlotScene（mode "save"）。書けたら音が鳴り、ここへ戻ってくる
   */
  HomeScene.prototype._save = function () {
    this.game.scenes.change(new NS.SaveSlotScene(this.game, this, "save"));
  };

  /**
   * 表示中の所持金を、実際の額へ近づける。
   *
   * 買い物から戻ったときに数字がすっと動くので、増えたか減ったかが分かる。
   * 差が1未満になったら、端数を残さないよう実際の額に合わせる。
   */
  HomeScene.prototype._updateGold = function () {
    var actual = this.game.gold || 0;

    // 初めて開いたときは、0から数え上げずにその額から始める
    if (this._shownGold === null) {
      this._shownGold = actual;
      return;
    }

    var diff = actual - this._shownGold;
    if (Math.abs(diff) < 1) {
      this._shownGold = actual;
      return;
    }
    this._shownGold += diff * ((this.layout.gold || {}).countSpeed || 0.14);
  };

  HomeScene.prototype._showNotice = function (text, duration) {
    this.notice.show(text, duration || NOTICE_DURATION);
  };

  // --- 描画 ---

  HomeScene.prototype.render = function (ctx) {
    var w = this.game.canvas.width;
    var h = this.game.canvas.height;

    this._renderBackground(ctx, w, h);
    this._renderScenery(ctx, w, h);
    this._renderCamp(ctx);
    this.particles.render(ctx);
    this._renderHeading(ctx);
    this._renderGold();
    this.menu.render(this.game.clock);
    this._renderMenuDescription();
    this._renderPartyStatus();
    this._renderNotice(ctx);
    // 操作説明は暗幕より上に出す（確認中の操作が読めるように）
    if (this.confirming) this._renderConfirm(ctx);
    this._renderHint(ctx);
    this.tutorial.render();
  };

  /** 「タイトルに戻りますか？」の窓。後ろを暗く落として問いかけだけに目を向けさせる */
  HomeScene.prototype._renderConfirm = function (ctx) {
    var C = this.layout.confirm;
    if (!C) return;
    var t = this.theme;

    ctx.save();
    ctx.fillStyle = C.veil || "rgba(4,6,12,0.72)";
    ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    ctx.fillStyle = C.background || "#0d1220";
    ctx.fillRect(C.box.x, C.box.y, C.box.w, C.box.h);
    ctx.restore();
    this.panel.drawBox(C.box);

    ctx.save();
    ctx.textAlign = "center";
    ctx.font = t.font || "14px monospace";
    ctx.fillStyle = t.cursorColor || "#ffd75e";
    ctx.fillText(this.texts.toTitleTitle || "", C.title.x, C.title.y);

    ctx.font = t.smallFont || "12px monospace";
    ctx.fillStyle = t.textColor || "#e8eaf0";
    ctx.fillText(this.texts.toTitleBody || "", C.body.x, C.body.y);

    ctx.fillStyle = t.hintColor || "#5b6688";
    ctx.fillText(this.texts.toTitleNote || "", C.note.x, C.note.y);
    ctx.restore();

    this.confirmMenu.render(this.game.clock);
  };

  /**
   * 背景の景色。穴（揺籃の穴）のそばで、たき火を囲む場所を絵で見せる。
   *
   * パネルより先に描くので、上下の余白にだけ見える。
   * 地面 → 穴 → たき火 の順。穴は地面より手前に描かないと埋まってしまう。
   */
  HomeScene.prototype._renderScenery = function (ctx, w, h) {
    var S = this.layout.scenery;
    if (!S) return;

    this._renderGround(ctx, w, h, S.ground);
    this._renderHole(ctx, S.hole);
    this._renderCampfire(ctx, S.campfire);
  };

  /** 画面の下にある深い穴。ふちだけがうっすら光る */
  HomeScene.prototype._renderHole = function (ctx, hole) {
    if (!hole) return;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(hole.cx, hole.cy, hole.rx, hole.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = hole.color || "#000000";
    ctx.fill();

    if (hole.rimColor) {
      ctx.strokeStyle = hole.rimColor;
      ctx.lineWidth = hole.rimWidth || 2;
      ctx.stroke();
    }
    ctx.restore();
  };

  /** 穴のふちの地面。上端に細い線を引いて手前と奥を分ける */
  HomeScene.prototype._renderGround = function (ctx, w, h, ground) {
    if (!ground) return;

    ctx.save();
    ctx.fillStyle = ground.color || "#000000";
    ctx.fillRect(0, ground.y, w, h - ground.y);

    if (ground.edgeColor) {
      ctx.fillStyle = ground.edgeColor;
      ctx.fillRect(0, ground.y, w, 1);
    }
    ctx.restore();
  };

  /** たき火。まわりの明かりをゆっくり強弱させ、炎そのものは blaze で揺らす */
  HomeScene.prototype._renderCampfire = function (ctx, fire) {
    if (!fire) return;

    var size = fire.size || 32;
    var centerX = fire.x + size / 2;
    var centerY = fire.y + size / 2;

    if (fire.glowRadius) {
      var radius = Math.max(1,
        NS.Motion.value(fire.glowPulse, this.game.clock, 0, fire.glowRadius));
      var glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      glow.addColorStop(0, fire.glowColor || "#ffffff");
      glow.addColorStop(1, "rgba(0,0,0,0)");

      ctx.save();
      ctx.globalAlpha = (fire.glowAlpha === undefined) ? 0.15 : fire.glowAlpha;
      ctx.fillStyle = glow;
      ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
      ctx.restore();
    }

    this.sprites.drawMotion("campfire", fire.x, fire.y, size, size,
      NS.Motion.of(this.game.data, fire.motion, this.game.clock, 0));
  };

  HomeScene.prototype._renderBackground = function (ctx, w, h) {
    var L = this.layout;
    var gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, L.gradientTop || "#000000");
    gradient.addColorStop(1, L.gradientBottom || "#000000");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  };

  HomeScene.prototype._renderHeading = function (ctx) {
    var L = this.layout;
    var title = L.title || {};
    var subtitle = L.subtitle || {};

    this.panel.drawText(this.texts.title || "", title.x, title.y,
      { font: title.font, color: title.color });
    this.panel.drawText(this.texts.subtitle || "", subtitle.x, subtitle.y,
      { font: subtitle.font, color: subtitle.color });
  };

  /** 所持金。買い物の前後で必ず見えるよう、拠点では常に出しておく */
  HomeScene.prototype._renderGold = function () {
    var pos = this.layout.gold;
    if (!pos) return;

    var template = this.texts.gold || "{amount}G";
    var shown = (this._shownGold === null) ? (this.game.gold || 0) : this._shownGold;

    // 上限（v1.4.4）に届いていれば色を変える
    var full = this.game.isGoldFull && this.game.isGoldFull() && Math.round(shown) >= this.game.getMaxGold();
    this.panel.drawText(template.replace("{amount}", Math.round(shown)),
      pos.x, pos.y,
      { align: "right", font: pos.font || this.theme.font,
        color: full ? (this.theme.goldFullColor || "#ff9a3a") : (pos.color || this.theme.cursorColor) });
  };

  /** 右側に手持ちの一覧を表示する */
  HomeScene.prototype._renderPartyStatus = function () {
    var S = this.layout.status;
    if (!S) return;

    var t = this.theme;
    this.panel.drawBox(S);

    var origin = this.panel.innerOrigin(S);
    this.panel.drawText(this.texts.statusTitle || "", origin.x, origin.y + 12,
      { font: t.smallFont, color: t.subTextColor });

    var party = this.game.party;
    if (!party || party.isEmpty()) {
      this.panel.drawText(this.texts.emptyParty || "", origin.x, origin.y + 44);
      return;
    }

    var listTop = origin.y + 30;
    for (var i = 0; i < party.size(); i++) {
      this._renderPartyRow(party.get(i), origin.x, listTop + S.rowHeight * i, S);
    }
  };

  HomeScene.prototype._renderPartyRow = function (monster, x, y, S) {
    var t = this.theme;

    var sprite = monster.getSpriteId();
    // 種族ごとの大きさ（sizeScale）。下端をそろえて上へ伸ばす
    var base = S.spriteSize;
    var size = Math.round(base * (monster.getSizeScale ? monster.getSizeScale() : 1));
    this.sprites.drawMotion(sprite, x - (size - base) / 2, y + (base - size), size, size,
      NS.Motion.forSprite(this.game.data, sprite, monster.getMotionId(),
        this.game.clock, monster.getMotionPhase()));

    // 文字の開始位置は元の大きさで決める（大きい相手でも行がずれないように）
    var textX = x + base + 14;
    var heading = monster.getName() + "  Lv" + monster.level;
    this.panel.drawText(heading, textX, y + 14);

    // 愛情度の印（慣れ・信頼・絆）。名前の右に出す。出会いの段階には出さない
    var ctx = this.panel.ctx;
    ctx.save();
    ctx.font = t.font || "14px monospace";
    var headingW = ctx.measureText(heading).width;
    ctx.restore();
    var stage = monster.getAffectionStage ? monster.getAffectionStage() : null;
    if (stage && stage.icon) {
      var a = S.affectionIcon || 13;
      this.sprites.draw(stage.icon, textX + headingW + 6, y + 14 - a + 2, a, a);
    }

    this._renderEquipIcons(monster, y);

    // HP・PP・次のレベルまでの経験値。どれも細くして、右に小さな数字を添える
    var barW = S.hpBarWidth;
    var numX = textX + barW + 8;
    var numFont = S.barFont || t.smallFont;
    var numColor = t.subTextColor;

    // 数字は10pxずつ下げる（詰めると字の上下が触れて読みにくい）
    this.hpBar.draw(textX, y + 21, barW, 4, monster.currentHp, monster.getMaxHp());
    this.panel.drawText("HP " + monster.currentHp + "/" + monster.getMaxHp(), numX, y + 26,
      { font: numFont, color: numColor });

    this.hpBar.drawPp(textX, y + 31, barW, 3, monster.currentPp, monster.getMaxPp());
    this.panel.drawText("PP " + monster.currentPp + "/" + monster.getMaxPp(), numX, y + 36,
      { font: numFont, color: numColor });

    var exp = this._expProgress(monster);
    this.hpBar.draw(textX, y + 41, barW, 3, exp.ratio, 1,
      { color: S.expBarColor || "#b48ce0" });
    this.panel.drawText(exp.label, numX, y + 46, { font: numFont, color: numColor });
  };

  /**
   * 次のレベルまでの進み具合。{ ratio: 0〜1, label: "あと 12" }。
   * レベル上限に届いていれば満タンで「MAX」
   */
  HomeScene.prototype._expProgress = function (monster) {
    var max = monster.getMaxLevel ? monster.getMaxLevel() : 99;
    if (monster.level >= max) return { ratio: 1, label: this.texts.expMax || "MAX" };
    var need = monster.getExpToNextLevel ? monster.getExpToNextLevel() : 0;
    var have = monster.exp || 0;
    var ratio = need > 0 ? Math.max(0, Math.min(1, have / need)) : 0;
    var template = this.texts.expLeft || "あと {n}";
    return { ratio: ratio, label: template.replace("{n}", Math.max(0, need - have)) };
  };

  /**
   * 着けている装備を、行の右上に小さな絵で並べる（武器・防具・アクセサリー2つの順。data/config.js の equipSlots）。
   * 空いている枠は薄い四角だけ出す（あといくつ着けられるかが分かるように）
   */
  HomeScene.prototype._renderEquipIcons = function (monster, y) {
    var S = this.layout.status;
    var t = this.theme;
    var data = this.game.data;
    var size = S.equipIcon || 13;
    var gap = 2;
    var slots = (data.config || {}).equipSlots || [];
    var right = S.x + S.w - (t.padding || 8);
    var x0 = right - slots.length * (size + gap) + gap;

    // 枠ごとに、着けている装備を前から割り当てる
    var worn = (monster.equipment || []).slice();
    var ctx = this.panel.ctx;
    for (var i = 0; i < slots.length; i++) {
      var item = null;
      for (var k = 0; k < worn.length; k++) {
        var candidate = data.getItem(worn[k]);
        if (candidate && NS.EffectSystem.slotOf(candidate) === slots[i]) {
          item = candidate;
          worn.splice(k, 1);
          break;
        }
      }
      var x = x0 + i * (size + gap);
      var top = y + 14 - size + 2;
      if (item && item.icon) {
        this.sprites.draw(item.icon, x, top, size, size);
      } else {
        ctx.save();
        ctx.strokeStyle = t.panelBorder || "#3a4560";
        ctx.globalAlpha = 0.6;
        ctx.strokeRect(x + 0.5, top + 0.5, size - 1, size - 1);
        ctx.restore();
      }
    }
  };

  HomeScene.prototype._renderNotice = function (ctx) {
    if (!this.notice.isActive()) return;
    var pos = this.layout.notice || { x: 400, y: 470 };

    ctx.save();
    ctx.globalAlpha = this.notice.getAlpha();
    ctx.font = "14px monospace";
    ctx.fillStyle = this.theme.cursorColor || "#ffd75e";
    ctx.textAlign = "center";
    ctx.fillText(this.notice.getText(), pos.x, pos.y);
    ctx.restore();
  };

  /** メニューの下：選んでいる項目のひと言と、いまの様子（v1.4.0） */
  HomeScene.prototype._renderMenuDescription = function () {
    var pos = this.layout.description;
    var item = this.menu.getSelected ? this.menu.getSelected() : null;
    if (!pos || !item || this.confirming) return;
    var t = this.theme;
    var lh = pos.lineHeight || 20;
    var descriptions = this.texts.descriptions || {};
    if (item.locked) {
      this.panel.drawText(this._lockedMessage(item), pos.x, pos.y, { font: t.smallFont, color: t.hintColor });
      return;
    }
    this.panel.drawText(descriptions[item.value] || "", pos.x, pos.y, { font: t.smallFont, color: t.subTextColor });
    var info = this._menuInfo(item.value);
    if (info) this.panel.drawText(info, pos.x, pos.y + lh, { font: t.smallFont, color: t.cursorColor });
  };

  /**
   * いまの様子（1行）。無い項目は空。重い計算（作れるものの数など）もあるので、拠点に戻るたびに1回だけ作る
   */
  HomeScene.prototype._menuInfo = function (value) {
    if (!this._infoCache) this._infoCache = {};
    if (Object.prototype.hasOwnProperty.call(this._infoCache, value)) return this._infoCache[value];
    var info = "";
    try { info = this._buildMenuInfo(value); } catch (e) { info = ""; }
    this._infoCache[value] = info;
    return info;
  };

  HomeScene.prototype._buildMenuInfo = function (value) {
    var game = this.game;
    var data = game.data;
    var T = this.texts.info || {};
    if (value === "dungeon") {
      // まだクリアしていない、開いている区画のうち最初のもの
      var regions = NS.DungeonCatalog.listRegions(data);
      for (var r = 0; r < regions.length; r++) {
        if (!NS.DungeonCatalog.isRegionUnlocked(regions[r], game.clearedDungeons, data)) continue;
        var list = NS.DungeonCatalog.dungeonsInRegion(data, regions[r].id);
        for (var d = 0; d < list.length; d++) {
          var dungeon = list[d];
          if (dungeon.ready === false || game.clearedDungeons[dungeon.id]) continue;
          if (!NS.DungeonCatalog.isUnlocked(dungeon, game.clearedDungeons, data)) continue;
          return fill(dungeon.recommendedLevel ? T.nextDungeon : T.nextDungeonNoLevel,
            { name: dungeon.name, level: dungeon.recommendedLevel });
        }
      }
      return T.allCleared || "";
    }
    if (value === "party") {
      var partySize = game.party ? game.party.getMembers().length : 0;
      var max = (game.party && game.party.maxSize) || 6;
      return fill(T.party, { n: partySize, max: max, stored: game.storage ? game.storage.size() : 0 });
    }
    if (value === "craft") {
      var craft = new NS.CraftSystem(data);
      var recipes = craft.getRecipes(game.clearedDungeons);
      var can = 0;
      for (var i = 0; i < recipes.length; i++) if (craft.canCraft(game, recipes[i]).ok) can++;
      return can > 0 ? fill(T.craft, { n: can, total: recipes.length }) : fill(T.craftNone, { total: recipes.length });
    }
    if (value === "shop") {
      var badges = this._menuBadges();
      return badges.shop ? (T.shopNew || "") : "";
    }
    if (value === "blessing") {
      return fill(T.blessing, { active: game.countActiveBlessings(), max: game.getBlessingActiveMax() });
    }
    if (value === "items") {
      return fill(T.items, { n: game.inventory && game.inventory.slotCount ? game.inventory.slotCount() : 0 });
    }
    if (value === "dex") {
      var discovery = game.discovery;
      return discovery ? fill(T.dex, { seen: discovery.countMonstersSeen(), caught: discovery.countMonstersCaught() }) : "";
    }
    if (value === "save") {
      return game.getSaveSlot ? fill(T.save, { n: game.getSaveSlot() }) : "";
    }
    return "";
  };

  /** テンプレートの {key} を置き換える */
  function fill(template, values) {
    if (!template) return "";
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return (values[key] !== undefined) ? values[key] : match;
    });
  }

  HomeScene.prototype._renderHint = function (ctx) {
    var pos = this.layout.hint || { x: 48, y: 570 };
    var text = this.confirming ? this.texts.toTitleHint : this.texts.hint;
    this.panel.drawText(text || "", pos.x, pos.y,
      { font: this.theme.smallFont, color: this.theme.hintColor });
  };

  NS.HomeScene = HomeScene;
})(window.MyGame);
