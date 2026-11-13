/**
 * PartyScene.js
 * パーティ編成画面。手持ちの一覧表示と並び替えを行う。
 * 先頭に近い個体から戦闘に出るため、並び順の変更がそのまま編成になる。
 *
 * 拠点の「預かり所」との出し入れもここで行う（左右キーで預かり所の画面を開く。v1.3.0 から箱に絵を並べる画面）。
 *
 * ▼ 操作
 *   上下   … カーソル移動
 *   左右   … 預かり所の画面を開く（操作は「預かり所の画面」の節）
 *   決定   … その仲間に対して何をするかを選ぶ（下記）
 *   Esc/X  … 1つ前へ戻る、または画面を閉じる
 *
 * ▼ 決定を押すと出る項目
 *   連れていく側 … 預ける / 並び替え / 装備 / やめる
 *   預かり所側   … パーティに加える / 装備 / やめる
 *
 * 「選んで、その相手に何をするか決める」という一方向の流れにしてある。
 * （以前は2体を選んで入れ替える方式だったが、何が起きるか分かりにくかった）
 *
 * ▼ 右の説明（v1.4.0）
 *   一覧・預かり所の右の欄と、「様子を見る」の技・特性／モンスター説明のページは、
 *   共通の部品 NS.DetailPane（js/ui/Panel.js）。入りきらなければ右のバー・Q/E・ホイールで送る
 *   （預かり所では Q/E が箱の切り替えなので、バーとホイールだけ）。
 *   「様子を見る」のステータスのページには、性格の上がり下がりの棒も出す。
 *
 * 配置・配色は data/ui.js の party、文言は data/messages.js の party で管理する。
 */
(function (NS) {
  "use strict";

  /**
   * @param {MyGame.Game} game
   * @param {object} returnScene 閉じたときに戻るシーン
   * @param {object} [options] { allowStorage } … false にすると預かり所を出さない
   *   探索中は拠点の預かり所へ手が届かないので、DungeonScene から false で開く
   */
  function PartyScene(game, returnScene, options) {
    this.game = game;
    this.returnScene = returnScene;

    var ui = game.data.ui || {};
    this.theme = ui.theme || {};
    this.layout = ui.party || {};
    this.texts = (game.data.messages || {}).party || {};

    this.panel = new NS.Panel(game.ctx, this.theme);
    this.hpBar = new NS.HpBar(game.ctx, this.theme);
    this.sprites = new NS.SpriteRenderer(game.ctx, game.assets);
    this.renderer = new NS.Renderer(game.ctx);

    // 右の説明欄（v1.4.0）。一覧の右・預かり所の右・「様子を見る」の技と説明のページ
    var none = { x: 0, y: 0, w: 0, h: 0 };
    this.pane = new NS.DetailPane(this.panel, this.sprites, this.layout.detail || none);
    this.boxPane = new NS.DetailPane(this.panel, this.sprites, (this.layout.box || {}).detail || none);
    this.inspectPane = new NS.DetailPane(this.panel, this.sprites, (this.layout.inspect || {}).pane || none);

    // 預かり所は拠点にしか無い。探索中は連れている仲間の並び替えだけを行う
    this.allowStorage = !(options && options.allowStorage === false);

    this.index = 0;         // カーソル位置
    this.tab = "party";     // "party" | "storage"
    // "list"（一覧）/ "action"（何をするか）/ "reorder"（並び替え先）/ "equip"（装備の画面）
    this.mode = "list";
    this.reorderFrom = -1;  // 並び替えの移動元

    var self = this;
    // 装備の画面の候補（v1.3.0）。行は _renderEquipRow が描く
    this.equipList = new NS.ScrollList(this.panel, this._equipListRect(), {
      renderRow: function (row, index, y, selected) { self._renderEquipRow(row, y, selected); }
    });
    // 仲間・預かり所の一覧。行（絵とHPバーの箱）は _renderRow が描き、
    // スクロール・ホイール・右端のバーは ScrollList に任せる（他の一覧と同じ動き）
    this.listView = new NS.ScrollList(this.panel, this._listViewRect(), {
      renderRow: function (row, index, y) { self._renderRow(row.monster, index, y); }
    });
    this.actionMenu = new NS.CommandMenu(this.panel, this.layout.actionMenu);
    // 探索中に技を使う：技を選ぶ → 相手を選ぶ
    this.fieldSkillMenu = new NS.CommandMenu(this.panel, this.layout.fieldSkillMenu || this.layout.actionMenu);
    this.fieldTargetMenu = new NS.CommandMenu(this.panel, this.layout.fieldTargetMenu || this.layout.actionMenu);
    this.fieldSkillId = null;
    // 作戦を選ぶ（v1.0.0）
    this.tacticMenu = new NS.CommandMenu(this.panel, this.layout.tacticMenu || this.layout.fieldTargetMenu || this.layout.actionMenu);
    // 「逃がしますか?」の はい／いいえ。元に戻せないので、既定は「やめる」
    this.releaseMenu = new NS.CommandMenu(this.panel, (this.layout.releaseConfirm || {}).menu);
    this.releaseMenu.setItems([
      { label: this.texts.releaseNo  || "no",  value: "no" },
      { label: this.texts.releaseYes || "yes", value: "yes" }
    ]);
    // 預かり所の画面（v1.3.0。30体ずつの箱に絵を並べる）。状態は _openBoxView で整える
    this.boxView = false;
    this.boxFocus = "box";      // "party"（左の連れていく列）/ "box"（箱のマス）
    this.boxPartyIndex = 0;
    this.boxPage = 0;           // いま見ている箱
    this.boxCell = 0;           // 箱の中のマス
    this.storageSort = 0;       // STORAGE_SORTS の何番目か（閉じても覚えておく）
    this.storageFilter = null;  // { kind: "element" | "species", id }
    this.marking = false;       // まとめて逃がす：印をつけている最中
    this.marks = [];            // 印をつけた個体
    this.swapMonster = null;    // パーティがいっぱいのとき、入れ替えで加える個体
    this.filterList = new NS.ScrollList(this.panel, (this.layout.box || {}).filter ||
      { x: 240, y: 100, w: 300, h: 330, rowHeight: 24 });
    this.backButton = new NS.BackButton(this.panel, game.data);
    // 名前をつける入力欄（Canvas の上に本物の入力欄を重ねる。漢字・英字も打てる）
    this.nameInput = new NS.NameInput(this.panel, game.data);
    this._notice = null;
  }

  PartyScene.prototype.enter = function () {
    this.index = 0;
    this.tab = "party";
    this.mode = "list";
    this.reorderFrom = -1;
    this._notice = null;
    this.listView.resetScroll();
    this.boxView = false;
    this.marking = false;
    this.marks = [];
  };

  /** いま見ている側の一覧 */
  PartyScene.prototype._currentList = function () {
    return this._listOf(this.tab);
  };

  PartyScene.prototype._listOf = function (tab) {
    return (tab === "storage") ? this.game.storage : this.game.party;
  };

  /** カーソルが指している個体 */
  PartyScene.prototype._selected = function () {
    var list = this._currentList();
    return list ? list.get(this.index) : null;
  };

  // --- 更新 ---

  PartyScene.prototype.update = function () {
    var input = this.game.input;

    // 名前をつけている間は、他の操作を受け付けない（入力欄に集中させる）
    if (this.mode === "naming") { this._updateNamingMode(input); return; }

    // 「戻る」ボタン。何かを選んでいる途中なら一覧へ戻す
    if (this.backButton.handleInput(input)) {
      if (this.mode === "list" && this.boxView) this._cancelBoxView();
      else if (this.mode === "list") this.game.scenes.change(this.returnScene);
      else if (this.mode === "affection") this.mode = "inspect";   // 愛情度の詳細は「様子を見る」へ戻す
      else if (this.mode === "boxSwap") this._cancelBoxSwap();
      else { this.mode = "list"; this.reorderFrom = -1; }
      return;
    }

    if (this.mode === "affection") { this._updateAffectionMode(input); return; }
    if (this.mode === "release") { this._updateReleaseMode(input); return; }
    if (this.mode === "releaseMany") { this._updateReleaseManyMode(input); return; }
    if (this.mode === "boxSwap")   { this._updateBoxSwap(input); return; }
    if (this.mode === "boxFilter") { this._updateBoxFilter(input); return; }
    if (this.mode === "tactic")      { this._updateTacticMode(input); return; }
    if (this.mode === "fieldSkill")  { this._updateFieldSkillMode(input); return; }
    if (this.mode === "fieldTarget") { this._updateFieldTargetMode(input); return; }
    if (this.mode === "equip")   { this._updateEquipMode(input); return; }
    if (this.mode === "action")  { this._updateActionMode(input); return; }
    if (this.mode === "reorder") { this._updateReorderMode(input); return; }
    if (this.mode === "inspect") { this._updateInspectMode(input); return; }
    if (this.boxView) { this._updateBoxView(input); return; }

    // 右の欄：バー・ホイール・Q/E で送る。バーを触っている間はほかの操作を見ない（v1.4.0）
    var paneResult = this.pane.handleInput(input);
    if (paneResult && paneResult.bar) return;
    if (input.isPressed("prevTab")) this.pane.scrollBy(-this.pane.keyRows());
    if (input.isPressed("nextTab")) this.pane.scrollBy(this.pane.keyRows());

    this._moveCursor(input);

    // 左右で預かり所の画面を開く（預かり所が使えるときだけ。v1.3.0 から別の画面）
    if (this.allowStorage) {
      if (input.isPressed("left") || input.isPressed("right")) { this._openBoxView(); return; }
      if (this._clickedTab(input)) return;
    }

    // E は装備への近道（一覧の項目からも選べる）
    if (input.isPressed("equip")) this._beginEquip();

    if (input.isPressed("confirm") || this._clickedRow(input)) this._beginAction();
    if (input.isPressed("cancel") || input.isPressed("party")) {
      this.game.scenes.change(this.returnScene);
    }
  };

  /**
   * 上下・マウス・ホイール・右端のバーで選択と表示を動かす。
   * 動かし方は持ち物・図鑑などの一覧（ScrollList）とそろえてある：
   *   上下キー … 選択を1つ動かし、枠の外ならそこまでスクロール（端で折り返す）
   *   ホイール … 選択は動かさず、中身だけをずらす
   *   右端のバー … つまんで動かす（入りきらないときだけ出る。預かり所で使う）
   */
  PartyScene.prototype._moveCursor = function (input) {
    this._syncListView();
    if (this._currentList().size() <= 0) return;

    this.listView.handleInput(input);
    this.index = this.listView.index;
  };

  /**
   * 一覧の見た目（ScrollList）の中身を、いまの表と選択に合わせる。
   * 行は個体の並びそのもの（見出しは無い）。描くのは _renderRow
   */
  PartyScene.prototype._syncListView = function () {
    var list = this._currentList();
    var rows = [];
    for (var i = 0; i < (list ? list.size() : 0); i++) {
      rows.push({ type: "entry", value: i, monster: list.get(i) });
    }
    this.listView.syncRows(rows, this.index);
  };

  /**
   * 一覧の枠。行の箱（list.w）の右に、スクロールバーの分だけ幅を足す。
   * 高さは visible 行ぶん。行の左に出す「▶」の分だけ、左へはみ出して描けるようにする
   */
  PartyScene.prototype._listViewRect = function () {
    var L = this.layout.list;
    var bar = this.theme.scrollbar || {};
    var visible = L.visible || 6;
    return {
      x: L.x, y: L.y,
      w: L.w + (bar.width || 6) + (bar.margin || 4) * 2,
      h: L.rowHeight * visible,
      rowHeight: L.rowHeight,
      visibleRows: visible,
      frame: false,
      clipLeft: L.cursorSpace || 0
    };
  };

  /** 行をマウスで押したか（_moveCursor のあとに呼ぶ。バーを離した瞬間は数えない） */
  PartyScene.prototype._clickedRow = function (input) {
    return this.listView.clickedEntry(input);
  };

  /** 上部の「連れていく / 預かり所」をマウスで押したか */
  PartyScene.prototype._clickedTab = function (input) {
    if (!input.getPointer || !input.getPointer().clicked) return false;

    var pos = this.layout.tabs;
    if (!pos) return false;

    var pointer = input.getPointer();
    var tabs = ["party", "storage"];

    for (var i = 0; i < tabs.length; i++) {
      var rect = { x: pos.x + pos.gap * i - 8, y: pos.y - 16, w: pos.gap - 12, h: 24 };
      if (!NS.Panel.containsPoint(rect, pointer)) continue;
      if (tabs[i] === "storage") this._openBoxView();
      return true;
    }
    return false;
  };

  // --- 選んだ仲間に何をするか ---

  PartyScene.prototype._beginAction = function () {
    if (!this._selected()) return;

    this.actionMenu.setItems(this._buildActionItems());
    this.mode = "action";
    this._notice = null;
  };

  /** 表によって選べることが変わる */
  PartyScene.prototype._buildActionItems = function () {
    var items = [];

    // 何も変えない項目なので先頭に置く（間違えて押しても損がない）
    items.push({ label: this.texts.actionInspect || "inspect", value: "inspect" });

    // 探索中だけ、回復などの技を使える（戦闘の外。攻撃の技は出ない。Game.isFieldSkill）
    var selected = this._selected();
    if (this.game.run && this.tab === "party" && selected && !selected.isFainted() &&
        this.game.fieldSkillsOf(selected).length > 0) {
      items.push({ label: this.texts.actionFieldSkill || "skill", value: "fieldSkill" });
    }

    if (this.tab === "party") {
      // 探索中は預けられない（預かり所は拠点にある）
      if (this.allowStorage) {
        items.push({ label: this.texts.actionDeposit || "deposit", value: "deposit" });
      }
      // 並び替えは仲間の一覧でだけ（預かり所の画面の左の列は、出し入れのための列）
      if (!this.boxView) items.push({ label: this.texts.actionReorder || "reorder", value: "reorder" });
    } else {
      items.push({ label: this.texts.actionTake || "take", value: "take" });
    }

    items.push({ label: this.texts.actionEquip || "equip", value: "equip" });
    // 作戦（v1.0.0）。いまの作戦を項目に添える
    var tactic = selected && selected.getTactic ? selected.getTactic() : null;
    items.push({ label: fill(this.texts.actionTactic || "tactic", { tactic: tactic ? tactic.name : "" }), value: "tactic" });
    items.push({ label: this.texts.actionName || "name", value: "name" });
    // 逃がすのは拠点でだけ（探索中に連れている仲間を手放すと、挑戦の記録と食い違うため）
    if (this.allowStorage) {
      items.push({ label: this.texts.actionRelease || "release", value: "release" });
    }
    // 預かり所の仲間は、印をつけてまとめて逃がせる（v1.3.0）
    if (this.boxView && this.tab === "storage") {
      items.push({ label: this.texts.actionReleaseMany || "release many", value: "releaseMany" });
    }
    items.push({ label: this.texts.actionCancel || "cancel", value: "cancel" });
    return items;
  };

  // --- 探索中に技を使う ---

  /** 使える技の一覧を出す（「キュア  PP2」。PPが足りない技は薄く出す） */
  PartyScene.prototype._beginFieldSkill = function () {
    var user = this._selected();
    if (!user) return;

    var items = [];
    var ids = this.game.fieldSkillsOf(user);
    for (var i = 0; i < ids.length; i++) {
      var skill = this.game.data.getSkill(ids[i]);
      var fieldCost = user.getSkillPpCost ? user.getSkillPpCost(skill) : (skill.pp || 0);
      var affordable = !fieldCost || !user.canPayPp || user.canPayPp(fieldCost);
      items.push({
        label: skill.name + "  " + fill(this.texts.fieldSkillCost, { pp: fieldCost }),
        value: ids[i],
        color: affordable ? null : this.theme.hintColor
      });
    }
    this.fieldSkillMenu.setItems(items);
    this.mode = "fieldSkill";
    this._notice = null;
  };

  PartyScene.prototype._updateFieldSkillMode = function (input) {
    var result = this.fieldSkillMenu.handleInput(input);
    if (!result) return;
    if (result.type === "cancel") { this.mode = "list"; return; }
    if (result.type !== "confirm") return;

    var user = this._selected();
    var skill = this.game.data.getSkill(result.value);
    var skillCost = (skill && user.getSkillPpCost) ? user.getSkillPpCost(skill) : ((skill && skill.pp) || 0);
    if (skillCost && user.canPayPp && !user.canPayPp(skillCost)) {
      this._notice = this.texts.fieldSkillNoPp || null;
      this.game.playError();
      return;
    }
    this.fieldSkillId = result.value;
    this._buildFieldTargets();
    this.fieldTargetMenu.index = this.index;   // まずは使う本人に合わせておく
    this.mode = "fieldTarget";
  };

  /** 使う相手の一覧（連れている仲間。名前とHP）。使うたびに作り直してHPを更新する */
  PartyScene.prototype._buildFieldTargets = function () {
    var keep = this.fieldTargetMenu.index;
    var items = [];
    var party = this.game.party;
    for (var i = 0; i < party.size(); i++) {
      var m = party.get(i);
      items.push({
        label: m.getName() + "  " + m.currentHp + "/" + m.getMaxHp(),
        value: i,
        color: m.isFainted() ? this.theme.hintColor : null
      });
    }
    this.fieldTargetMenu.setItems(items);
    if (keep > 0 && keep < items.length) this.fieldTargetMenu.index = keep;
  };

  /**
   * 相手を決めて使う。使ったあとも相手選びに残る（続けて回復できるように）。Esc で技選びへ戻る
   */
  PartyScene.prototype._updateFieldTargetMode = function (input) {
    var result = this.fieldTargetMenu.handleInput(input);
    if (!result) return;
    if (result.type === "cancel") { this._beginFieldSkill(); return; }
    if (result.type !== "confirm") return;

    var user = this._selected();
    var target = this.game.party.get(result.value);
    var skill = this.game.data.getSkill(this.fieldSkillId);
    var done = this.game.useFieldSkill(user, this.fieldSkillId, target);

    if (done.success) {
      // 状態異常を治す技（クレンズ）は「○○が治った」、HPの回復は「HPが n 回復した」。
      // 全体の回復（キュアオール）は「みんなの」、起こす技（リザレクト）は起きたかどうかを出す
      var usedText = done.cured ? this.texts.fieldSkillCured
        : done.allHealed ? this.texts.fieldSkillAllHealed
        : done.revived ? this.texts.fieldSkillRevived
        : done.reviveFailed ? this.texts.fieldSkillReviveFail
        : this.texts.fieldSkillUsed;
      this._notice = fill(usedText, {
        user: user.getName(), skill: skill ? skill.name : "",
        target: target.getName(), amount: done.amount,
        status: (done.cured || []).join("・")
      });
      this.game.audio.playSe(done.reviveFailed ? "miss" : "heal");
      this._buildFieldTargets();
      return;
    }

    var key = { noPp: "fieldSkillNoPp", fainted: "fieldSkillFainted", full: "fieldSkillFull",
                allFull: "fieldSkillAllFull", notFainted: "fieldSkillNotFainted",
                nothingToCure: "fieldSkillNothingToCure" }[done.reason];
    this._notice = key ? fill(this.texts[key], { target: target ? target.getName() : "" }) : null;
    this.game.playError();
  };

  // --- 逃がす ---

  /** 「逃がしますか?」を出す。最後の1体は、聞く前に断る */
  PartyScene.prototype._beginRelease = function () {
    var monster = this._selected();
    if (!monster) return;

    // 最初の相棒は逃がせない（聞く前に断る）
    if (monster.partner) {
      this._notice = fill(this.texts.cannotReleasePartner, { name: monster.getName() });
      this.game.playError();
      this.mode = "list";
      return;
    }
    if (this.tab === "party" && this.game.party.size() <= 1) {
      this._notice = this.texts.cannotReleaseLast || null;
      this.game.playError();
      this.mode = "list";
      return;
    }
    this.releaseMenu.index = 0;   // 既定は「やめる」
    this.mode = "release";
    this._notice = null;
  };

  PartyScene.prototype._updateReleaseMode = function (input) {
    var result = this.releaseMenu.handleInput(input);
    if (!result) return;

    if (result.type === "cancel" || result.value === "no") {
      this.mode = "list";
      return;
    }
    if (result.value !== "yes") return;

    var done = this.game.releaseMonster(this.tab, this.index);
    this.mode = "list";

    if (!done.success) {
      this._notice = (done.reason === "stackFull") ? (this.texts.releaseStackFull || null)
                   : (done.reason === "last") ? (this.texts.cannotReleaseLast || null)
                   : (done.reason === "partner")
                     ? fill(this.texts.cannotReleasePartner, { name: done.monster.getName() })
                   : null;
      this.game.playError();
      return;
    }
    this._notice = fill(this.texts.released, { name: done.monster.getName() });
    this._clampIndex();
  };

  /** 「逃がしますか?」の窓。後ろを暗く落として、問いかけだけに目を向けさせる */
  PartyScene.prototype._renderReleaseConfirm = function (ctx) {
    var C = this.layout.releaseConfirm;
    // まとめて逃がすときは、印をつけた仲間ぜんぶ（v1.3.0）
    var many = (this.mode === "releaseMany");
    var targets = many ? this.marks : [this._selected()];
    if (!C || !targets[0]) return;
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
    // 元に戻せない操作なので、見出しは危ない色にする
    ctx.fillStyle = t.dangerColor || "#e8542a";
    ctx.fillText(many ? fill(this.texts.releaseManyTitle, { n: targets.length })
                      : fill(this.texts.releaseTitle, { name: targets[0].getName() }), C.title.x, C.title.y);

    ctx.font = t.smallFont || "12px monospace";
    ctx.fillStyle = t.textColor || "#e8eaf0";
    ctx.fillText(this.texts.releaseBody || "", C.body.x, C.body.y);

    // 装備を着けているときだけ「持ち物に戻る」と添える
    var equipped = targets.some(function (m) { return (m.equipment || []).length > 0; });
    if (equipped) {
      ctx.fillStyle = t.hintColor || "#5b6688";
      ctx.fillText(this.texts.releaseNoteEquip || "", C.note.x, C.note.y);
    }
    ctx.restore();

    this.releaseMenu.render(this.game.clock);
  };

  PartyScene.prototype._updateActionMode = function (input) {
    var result = this.actionMenu.handleInput(input);
    if (!result) return;

    if (result.type === "cancel" || result.value === "cancel") {
      this.mode = "list";
      return;
    }
    if (result.type !== "confirm") return;
    this._runAction(result.value);
  };

  /** 「この仲間をどうするか」の項目を実行する（預かり所の画面の下の札からも呼ぶ） */
  PartyScene.prototype._runAction = function (value) {
    this.mode = "list";
    switch (value) {
      case "inspect": this.mode = "inspect"; this.inspectPage = "stats"; break;
      case "deposit": this._depositToStorage(); break;
      case "take":
        // 預かり所の画面でパーティがいっぱいなら、入れ替える相手を選ぶ
        if (this.boxView && this.game.party.isFull()) this._beginBoxSwap(this._selected());
        else this._takeFromStorage();
        break;
      case "releaseMany": this._beginMarking(); break;
      case "reorder": this._beginReorder(); break;
      case "equip":   this._beginEquip(); break;
      case "name":    this._beginNaming(); break;
      case "release": this._beginRelease(); break;
      case "fieldSkill": this._beginFieldSkill(); break;
      case "tactic":  this._beginTactic(); break;
    }
  };

  // --- 作戦（v1.0.0。data/battle.js の tactics） ---

  /** 作戦の一覧を出す。カーソルはいまの作戦に置く。説明は一覧のすぐ下に出す（_renderTacticInfo） */
  PartyScene.prototype._beginTactic = function () {
    var monster = this._selected();
    if (!monster || !monster.getTactic) return;
    var tactics = (this.game.data.battle || {}).tactics || { order: [], list: {} };
    var current = monster.getTactic();
    var items = [], at = 0;
    for (var i = 0; i < (tactics.order || []).length; i++) {
      var tactic = tactics.list[tactics.order[i]];
      if (!tactic) continue;
      var isCurrent = current && current.id === tactic.id;
      if (isCurrent) at = items.length;
      items.push({ label: tactic.name + (isCurrent ? "  " + (this.texts.tacticCurrent || "") : ""), value: tactic.id });
    }
    this.tacticMenu.setItems(items);
    this.tacticMenu.index = at;
    this.mode = "tactic";
    this._notice = null;
  };

  /** カーソルの作戦の説明を、一覧のすぐ下の枠に出す */
  PartyScene.prototype._renderTacticInfo = function () {
    var selected = this.tacticMenu.items ? this.tacticMenu.items[this.tacticMenu.index] : null;
    var tactics = (this.game.data.battle || {}).tactics || { list: {} };
    var tactic = selected ? tactics.list[selected.value] : null;
    if (!tactic) return;

    var t = this.theme;
    var info = this.layout.tacticInfo || {};
    var menu = this.tacticMenu._boxRect();
    var lh = t.lineHeight || 18;
    var pad = t.padding || 8;
    var padX = info.padX || 12;
    var box = { x: menu.x, y: menu.y + menu.h + (info.gap || 6), w: menu.w, h: pad * 2 + lh * (info.lines || 2) };
    this.panel.drawBox(box);

    var lines = wrapByWidth(this.panel.ctx, tactic.description || "", box.w - padX * 2, t.smallFont);
    for (var i = 0; i < lines.length; i++) {
      this.panel.drawText(lines[i], box.x + padX, box.y + pad + lh * (i + 1) - 4,
        { font: t.smallFont, color: t.subTextColor });
    }
  };

  PartyScene.prototype._updateTacticMode = function (input) {
    var result = this.tacticMenu.handleInput(input);
    if (!result) return;
    if (result.type === "cancel") { this.mode = "list"; this._notice = null; return; }
    if (result.type !== "confirm") return;

    var monster = this._selected();
    if (!monster) return;
    monster.setTactic(result.value);
    var tactic = monster.getTactic();
    this._notice = fill(this.texts.tacticChanged, { name: monster.getName(), tactic: tactic ? tactic.name : "" });
    this.mode = "list";
  };

  // --- 様子を見る ---

  // ページの並び（左上の札もこの順）。技が多いと左の欄からはみ出したので、技は専用のページにした（v1.3.0）
  var INSPECT_PAGES = ["stats", "skills", "notes"];

  /**
   * 眺めるだけの画面。何も変えない。
   *
   * 一覧の詳細欄は狭くて、絵も48pxしか出ない。
   * ここでは画面いっぱいを使って、絵を大きく出し、
   * 一覧では出しきれない**状態異常の耐性**まで並べる。
   *
   * ↑↓で他の仲間へそのまま移れる（いちいち一覧へ戻らなくてよい）。
   */
  PartyScene.prototype._updateInspectMode = function (input) {
    var size = this._currentList().size();

    // 技・特性／モンスター説明のページは、右をバー・ホイール・Q/E で送る（v1.4.0）
    if (this.inspectPage === "skills" || this.inspectPage === "notes") {
      var paneResult = this.inspectPane.handleInput(input);
      if (paneResult && paneResult.bar) return;
      if (input.isPressed("prevTab")) this.inspectPane.scrollBy(-this.inspectPane.keyRows());
      if (input.isPressed("nextTab")) this.inspectPane.scrollBy(this.inspectPane.keyRows());
    }

    if (size > 0) {
      if (input.isPressed("up")) this.index = (this.index - 1 + size) % size;
      if (input.isPressed("down")) this.index = (this.index + 1) % size;
    }

    // ←→ でページを切り替える（ステータス → 技・特性 → モンスター説明）。上部の札を押しても切り替わる
    var step = input.isPressed("right") ? 1 : (input.isPressed("left") ? -1 : 0);
    if (step) {
      var at = INSPECT_PAGES.indexOf(this.inspectPage || "stats");
      this.inspectPage = INSPECT_PAGES[(Math.max(0, at) + step + INSPECT_PAGES.length) % INSPECT_PAGES.length];
    }
    var tabPointer = input.getPointer ? input.getPointer() : null;
    if (tabPointer && tabPointer.clicked && this._inspectTabRects) {
      for (var p = 0; p < this._inspectTabRects.length; p++) {
        if (NS.Panel.containsPoint(this._inspectTabRects[p].rect, tabPointer)) {
          this.inspectPage = this._inspectTabRects[p].page;
          return;
        }
      }
    }

    // 愛情度の欄を押す（または決定）と、愛情度の詳細を開く
    var pointer = input.getPointer ? input.getPointer() : null;
    var clicked = pointer && pointer.clicked && this._affectionRect &&
                  NS.Panel.containsPoint(this._affectionRect, pointer);
    if (clicked || input.isPressed("confirm")) { this.mode = "affection"; return; }

    if (input.isPressed("cancel")) this.mode = "list";
  };

  /** 愛情度の詳細：決定・Esc・クリックで「様子を見る」へ戻る */
  PartyScene.prototype._updateAffectionMode = function (input) {
    var pointer = input.getPointer ? input.getPointer() : null;
    if (input.isPressed("cancel") || input.isPressed("confirm") || (pointer && pointer.clicked)) {
      this.mode = "inspect";
    }
  };

  // --- 名前をつける ---

  PartyScene.prototype._beginNaming = function () {
    var monster = this._selected();
    if (!monster) return;

    var texts = (this.game.data.messages || {}).naming || {};
    this.nameInput.open(
      monster.nickname || "",
      (texts.titleRename || "").replace("{name}", monster.getName()));

    this.mode = "naming";
    this._notice = null;
  };

  PartyScene.prototype._updateNamingMode = function (input) {
    var result = this.nameInput.handleInput(input);
    if (!result) return;

    var texts = (this.game.data.messages || {}).naming || {};

    if (result.type === "cancel") {
      this._notice = texts.keptName || null;
      this.mode = "list";
      return;
    }

    var monster = this._selected();
    if (monster) {
      var before = monster.getName();
      monster.setNickname(result.name);
      this._notice = (texts.renamed || "")
        .replace("{old}", before)
        .replace("{new}", monster.getName());
    }
    this.mode = "list";
  };

  // --- 並び替え ---

  PartyScene.prototype._beginReorder = function () {
    this.reorderFrom = this.index;
    this.mode = "reorder";
  };

  PartyScene.prototype._updateReorderMode = function (input) {
    this._moveCursor(input);

    if (input.isPressed("cancel")) {
      this.mode = "list";
      this.reorderFrom = -1;
      return;
    }
    if (!input.isPressed("confirm") && !this._clickedRow(input)) return;

    this.game.party.swap(this.reorderFrom, this.index);
    this.reorderFrom = -1;
    this.mode = "list";
  };

  // --- 装備 ---

  // --- 装備の画面（v1.3.0。画面ぜんぶを使う） ---
  //
  //   左上 … 仲間（◀ ▶ と ←→ で、いま見ている表の中の仲間を切り替える）
  //   左   … 枠（武器・防具・アクセサリー1・2）と「すべて外す」
  //   右   … 選んでいる枠の候補：外す → 持ち物の装備 → ほかの仲間が着けているもの
  //   下   … 見比べ（今の装備 ／ 選んでいる候補 ／ ステータスの 前 → 後）
  //
  // 操作は「枠を選ぶ → 決定で候補へ → 決定で着ける」。着けたら枠へ戻る。
  // ほかの仲間が着けているものを選ぶと、こちらのその枠のものと入れ替える（Game.takeEquipmentFrom）。
  // 候補は R（並べ替え）で「持ち物の順」「攻撃が上がる順」などに並べ替えられる。

  /** 候補の並べ替えの順番。label は data/messages.js の party.equipSortLabels */
  var EQUIP_SORTS = ["inventory", "attack", "defense", "speed", "hp", "pp"];
  // _statChanges が返す並び（HP・攻撃・防御・素早さ・PP）の何番目か
  var EQUIP_SORT_STAT = { hp: 0, attack: 1, defense: 2, speed: 3, pp: 4 };

  /**
   * 選んでいる仲間の装備の画面を開く。
   * 着けられるものが1つも無くても画面は開く（押しても何も起きない、を避けるため）。
   */
  PartyScene.prototype._beginEquip = function () {
    var monster = this._currentList().get(this.index);
    if (!monster) return;

    this.mode = "equip";
    this.equipFocus = "slots";   // "slots"（枠を選ぶ）/ "items"（候補を選ぶ）
    this.equipSlotIndex = 0;
    this.equipSort = this.equipSort || 0;   // 並べ替えは画面を閉じても覚えておく
    this._notice = null;
    this._rebuildEquipRows();
  };

  PartyScene.prototype._equipMonster = function () {
    return this._currentList().get(this.index);
  };

  /**
   * 枠の位置ごとの行（data/config.js の equipSlots の順）。
   * アクセサリーのように同じ種類が2つある枠は、着けた順に1つ目・2つ目へ入る。
   * @returns {Array<{slot:string, label:string, index:number, itemId:string|null}>}
   *   index … monster.equipment の何番目か（空いていれば -1）
   */
  PartyScene.prototype._equipSlotRows = function (monster) {
    var data = this.game.data;
    var slots = (data.config || {}).equipSlots || [];
    var list = (monster && monster.equipment) || [];
    var used = {};
    var nth = {};
    var rows = [];

    for (var s = 0; s < slots.length; s++) {
      var slot = slots[s];
      var found = -1;
      for (var i = 0; i < list.length; i++) {
        if (used[i]) continue;
        var item = data.getItem(list[i]);
        if (item && item.equip && NS.EffectSystem.slotOf(item) === slot) { found = i; break; }
      }
      if (found >= 0) used[found] = true;

      nth[slot] = (nth[slot] || 0) + 1;
      var label = NS.EffectSystem.slotNameOf(slot, data);
      if (NS.EffectSystem.slotCapacity(data, slot) > 1) label += nth[slot];

      rows.push({ slot: slot, label: label, index: found, itemId: found >= 0 ? list[found] : null });
    }
    return rows;
  };

  /** 左の「すべて外す」の行を選んでいるか（枠の行の次にある） */
  PartyScene.prototype._onUnequipAllRow = function (monster) {
    return this.equipSlotIndex >= this._equipSlotRows(monster).length;
  };

  /** 選んでいる枠の行（「すべて外す」を選んでいれば null） */
  PartyScene.prototype._currentEquipSlot = function (monster) {
    return this._equipSlotRows(monster)[this.equipSlotIndex] || null;
  };

  /** ほかの仲間（いま見ている表と、拠点なら預かり所も） */
  PartyScene.prototype._otherMembers = function (monster) {
    var lists = [this.game.party];
    if (this.allowStorage) lists.push(this.game.storage);
    var result = [];
    for (var l = 0; l < lists.length; l++) {
      var members = lists[l].getMembers();
      for (var i = 0; i < members.length; i++) {
        if (members[i] !== monster) result.push(members[i]);
      }
    }
    return result;
  };

  /**
   * 選んでいる枠の候補。外す → 持ち物の装備 → ほかの仲間が着けているもの。
   * 並べ替えは「外す」を除いた候補にだけ掛ける。
   * @returns {object[]} ScrollList の行（描くのは _renderEquipRow）
   */
  PartyScene.prototype._buildEquipRows = function (monster, slotRow) {
    if (!monster || !slotRow) return [];
    var data = this.game.data;
    var rows = [];
    var entries = [];
    var i, j;

    if (slotRow.index >= 0) {
      rows.push({ type: "entry", kind: "unequip", label: this.texts.unequipLabel || "",
                  value: { action: "unequip", index: slotRow.index } });
    }

    var slots = this.game.inventory.getSlots();
    for (i = 0; i < slots.length; i++) {
      var item = data.getItem(slots[i].itemId);
      if (!item || !item.equip || NS.EffectSystem.slotOf(item) !== slotRow.slot) continue;
      entries.push({ type: "entry", kind: "item", itemId: item.id, label: item.name, icon: item.icon,
                     right: "x" + slots[i].count, value: { action: "equip", itemId: item.id } });
    }

    var others = this._otherMembers(monster);
    for (i = 0; i < others.length; i++) {
      var worn = others[i].equipment || [];
      for (j = 0; j < worn.length; j++) {
        var w = data.getItem(worn[j]);
        if (!w || !w.equip || NS.EffectSystem.slotOf(w) !== slotRow.slot) continue;
        entries.push({ type: "entry", kind: "other", itemId: w.id, label: w.name, icon: w.icon,
                       right: others[i].getName(), owner: others[i],
                       value: { action: "take", owner: others[i], ownerIndex: j } });
      }
    }

    // 並べ替え：選んだ能力が上がる順（同じなら元の並び）
    var own = monster.equipment || [];
    for (i = 0; i < entries.length; i++) {
      entries[i].order = i;
      // ほかの枠にもう着けている（選んでも「もう着けている」になる）ものは薄く描く
      var at = own.indexOf(entries[i].itemId);
      entries[i].worn = at >= 0 && at !== slotRow.index;
      entries[i].changes = this._statChanges(monster, this._equipmentAfter(monster, slotRow, entries[i].value));
    }
    var stat = EQUIP_SORT_STAT[EQUIP_SORTS[this.equipSort || 0]];
    if (stat !== undefined) {
      entries.sort(function (a, b) {
        var da = a.changes[stat].after - a.changes[stat].before;
        var db = b.changes[stat].after - b.changes[stat].before;
        return (db - da) || (a.order - b.order);
      });
    }
    return rows.concat(entries);
  };

  /** 候補を作り直す。keepIndex を渡すと、なるべく同じ位置にカーソルを残す */
  PartyScene.prototype._rebuildEquipRows = function (keepIndex) {
    var monster = this._equipMonster();
    var slotRow = monster ? this._currentEquipSlot(monster) : null;
    this.equipList.setRows(this._buildEquipRows(monster, slotRow));
    if (keepIndex !== undefined && this.equipList.rows.length > 0) {
      this.equipList.setIndex(Math.min(keepIndex, this.equipList.rows.length - 1));
    }
  };

  PartyScene.prototype._updateEquipMode = function (input) {
    var monster = this._equipMonster();
    if (!monster) { this.mode = "list"; return; }

    // マウス：◀ ▶・並べ替え・枠の行
    if (this._handleEquipPointer(input, monster)) return;

    if (input.isPressed("left"))  { this._switchEquipMonster(-1); return; }
    if (input.isPressed("right")) { this._switchEquipMonster(1); return; }
    if (input.isPressed("sort"))  { this._cycleEquipSort(); return; }
    if (input.isPressed("equip")) { this.mode = "list"; return; }

    if (this.equipFocus === "slots") {
      var count = this._equipSlotRows(monster).length + 1;   // 最後は「すべて外す」
      if (input.isPressed("up"))   this._selectEquipSlot((this.equipSlotIndex - 1 + count) % count);
      if (input.isPressed("down")) this._selectEquipSlot((this.equipSlotIndex + 1) % count);

      // 候補の上にマウスを重ねたら、候補を選んでいる状態にする（キーの上下は枠に使う）
      if (this.equipList.handleInput(input, { keys: false })) this.equipFocus = "items";
      if (this.equipList.clickedEntry(input)) { this._applyEquipChoice(this.equipList.getSelected()); return; }

      if (input.isPressed("cancel")) { this.mode = "list"; return; }
      if (input.isPressed("confirm")) {
        if (this._onUnequipAllRow(monster)) this._unequipAll(monster);
        else if (this.equipList.hasEntries()) this.equipFocus = "items";
        else { this._notice = this.texts.equipNoCandidates || null; this.game.playError(); }
      }
      return;
    }

    this.equipList.handleInput(input);
    if (input.isPressed("cancel")) { this.equipFocus = "slots"; return; }
    if (input.isPressed("confirm") || this.equipList.clickedEntry(input)) {
      this._applyEquipChoice(this.equipList.getSelected());
    }
  };

  /** 枠を選ぶ（候補を作り直す） */
  PartyScene.prototype._selectEquipSlot = function (index) {
    if (index === this.equipSlotIndex) return;
    this.equipSlotIndex = index;
    this._rebuildEquipRows();
  };

  /** ←→・◀ ▶：いま見ている表の中で、隣の仲間へ（枠の選択はそのまま） */
  PartyScene.prototype._switchEquipMonster = function (direction) {
    var size = this._currentList().size();
    if (size <= 1) return;
    this.index = (this.index + direction + size) % size;
    this._notice = null;
    this._rebuildEquipRows();
  };

  PartyScene.prototype._cycleEquipSort = function () {
    this.equipSort = ((this.equipSort || 0) + 1) % EQUIP_SORTS.length;
    this._rebuildEquipRows();
  };

  /**
   * マウスで ◀ ▶・並べ替え・枠の行を押したか。押したらその操作をして true。
   * 枠の行は、重ねただけで選ぶ（候補が入れ替わる）。押すと候補へ移る
   */
  PartyScene.prototype._handleEquipPointer = function (input, monster) {
    if (!input.getPointer) return false;
    var pointer = input.getPointer();
    if (!pointer.inside) return false;
    var hit = this._equipHitRects || {};

    if (pointer.clicked) {
      if (NS.Panel.containsPoint(hit.prev, pointer)) { this._switchEquipMonster(-1); return true; }
      if (NS.Panel.containsPoint(hit.next, pointer)) { this._switchEquipMonster(1); return true; }
      if (NS.Panel.containsPoint(hit.sort, pointer)) { this._cycleEquipSort(); return true; }
    }
    if (!pointer.moved && !pointer.clicked) return false;

    var slotRects = hit.slots || [];
    for (var i = 0; i < slotRects.length; i++) {
      if (!NS.Panel.containsPoint(slotRects[i], pointer)) continue;
      this.equipFocus = "slots";
      this._selectEquipSlot(i);
      if (pointer.clicked) {
        if (this._onUnequipAllRow(monster)) this._unequipAll(monster);
        else if (this.equipList.hasEntries()) this.equipFocus = "items";
      }
      return pointer.clicked;
    }
    return false;
  };

  /** 「すべて外す」 */
  PartyScene.prototype._unequipAll = function (monster) {
    if (!(monster.equipment || []).length) {
      this._notice = this.texts.equipNothingToRemove || null;
      this.game.playError();
      return;
    }
    var result = this.game.unequipAll(monster);
    if (result.kept > 0) {
      this._notice = this.texts.stackFull || null;
      this.game.playError();
    } else {
      this._notice = fill(this.texts.unequippedAll, { name: monster.getName() });
    }
    this._rebuildEquipRows();
  };

  /** 候補を決定した：外す・着ける・ほかの仲間から移す。済んだら枠へ戻る */
  PartyScene.prototype._applyEquipChoice = function (row) {
    var monster = this._equipMonster();
    var slotRow = monster ? this._currentEquipSlot(monster) : null;
    if (!monster || !slotRow || !row) return;
    var data = this.game.data;
    var choice = row.value;
    var keep = this.equipList.index;
    var ok = true;

    if (choice.action === "unequip") {
      var removed = this.game.unequipItem(monster, choice.index);
      ok = !!removed;
      this._notice = removed
        ? fill(this.texts.unequipped, { name: data.getItem(removed).name })
        : (this.texts.stackFull || null);
    } else if (choice.action === "take") {
      var taken = this.game.takeEquipmentFrom(monster, slotRow.index, choice.owner, choice.ownerIndex);
      ok = taken.success;
      if (taken.success) {
        var names = { name: monster.getName(), owner: choice.owner.getName(),
                      item: data.getItem(taken.itemId).name,
                      given: taken.given ? data.getItem(taken.given).name : "",
                      stored: taken.stored ? data.getItem(taken.stored).name : "" };
        var takenText = taken.given ? this.texts.equipTakenSwap
                      : taken.stored ? this.texts.equipTakenStore : this.texts.equipTaken;
        this._notice = fill(takenText, names);
      } else {
        this._notice = this._equipFailText(taken.reason, row.label);
      }
    } else {
      var result = this.game.equipItemAt(monster, choice.itemId, slotRow.index);
      ok = result.success;
      if (result.success && result.replaced) {
        var out = data.getItem(result.replaced);
        this._notice = fill(this.texts.equipSwapped, { out: out ? out.name : result.replaced, item: row.label });
      } else if (result.success) {
        this._notice = fill(this.texts.equipped, { name: monster.getName(), item: row.label });
      } else {
        this._notice = this._equipFailText(result.reason, row.label);
      }
    }

    if (!ok) {
      this.game.playError();
      this._rebuildEquipRows(keep);
      return;
    }
    // 着けたら枠へ戻る（続けて次の枠を選べるように）
    this.equipFocus = "slots";
    this._rebuildEquipRows();
  };

  PartyScene.prototype._equipFailText = function (reason, itemName) {
    if (reason === "duplicate") return fill(this.texts.equipDuplicate, { item: itemName });
    return this.texts.stackFull || null;
  };

  // --- 預かり所の画面（v1.3.0。30体ずつの箱に絵を並べる） ---
  //
  //   左 … 連れていく仲間（決定で預ける）
  //   中 … 箱（6×5 のマス。決定でパーティに加える。いっぱいなら入れ替える相手を選ぶ）
  //   右 … 選んでいる仲間の詳細。下 … 並べ方・絞り込み・この仲間への操作の札
  //
  // 預かり所の中身は1本の並び（MonsterStorage.members。セーブの形は前と同じ）。
  // 箱はその並びを30体ずつに区切って見せているだけで、並べ替え・絞り込みも見せ方だけを変える。

  /** 並べ方。label は data/messages.js の party.boxSortLabels */
  var STORAGE_SORTS = ["stored", "level", "dex", "element"];

  PartyScene.prototype._boxLayout = function () { return this.layout.box || {}; };
  PartyScene.prototype._boxSize = function () { return (this.game.data.config || {}).storageBoxSize || 30; };
  PartyScene.prototype._boxCols = function () { return (this._boxLayout().grid || {}).cols || 6; };

  PartyScene.prototype._openBoxView = function () {
    this.boxView = true;
    this.mode = "list";
    this.boxFocus = this.game.storage.isEmpty() ? "party" : "box";
    this.boxPartyIndex = Math.max(0, Math.min(this.index, this.game.party.size() - 1));
    this.boxPage = 0;
    this.boxCell = 0;
    this.marking = false;
    this.marks = [];
    this._notice = null;
    this._syncBoxSelection();
  };

  /** Esc・戻る：印をつけている最中ならそれをやめ、そうでなければ仲間の一覧へ戻る */
  PartyScene.prototype._cancelBoxView = function () {
    if (this.marking) { this._stopMarking(); return; }
    this.boxView = false;
    this.tab = "party";
    this.index = Math.max(0, Math.min(this.boxPartyIndex, this.game.party.size() - 1));
    this.mode = "list";
    this._notice = null;
    this.listView.resetScroll();
  };

  /** 種族の属性 */
  PartyScene.prototype._monsterElement = function (monster) {
    var species = monster.getSpecies ? monster.getSpecies() : null;
    return (species && species.element) || "none";
  };

  PartyScene.prototype._matchesStorageFilter = function (monster, filter) {
    if (!filter) return true;
    if (filter.kind === "element") return this._monsterElement(monster) === filter.id;
    return monster.speciesId === filter.id;
  };

  /**
   * 箱に並べる順の、預かり所の位置の並び（絞り込みと並べ方を掛けたあと）。
   * @returns {number[]} storage.members の何番目か
   */
  PartyScene.prototype._storageView = function () {
    var members = this.game.storage.getMembers();
    var data = this.game.data;
    var view = [];
    for (var i = 0; i < members.length; i++) {
      if (this._matchesStorageFilter(members[i], this.storageFilter)) view.push(i);
    }

    var mode = STORAGE_SORTS[this.storageSort || 0];
    if (mode === "stored") return view;

    var dex = {};
    Object.keys(data.monsters || {}).forEach(function (id, n) { dex[id] = n; });
    var elements = data.elements || {};
    var self = this;
    var elementOrder = function (m) { var e = elements[self._monsterElement(m)]; return e ? (e.order || 0) : 999; };
    view.sort(function (a, b) {
      var ma = members[a], mb = members[b];
      var d = 0;
      if (mode === "level") d = mb.level - ma.level;
      else if (mode === "element") d = elementOrder(ma) - elementOrder(mb);
      // 同じなら図鑑の順、それも同じなら預けた順
      return d || ((dex[ma.speciesId] || 0) - (dex[mb.speciesId] || 0)) || (a - b);
    });
    return view;
  };

  /** 箱の数。絞り込んでいなければ上限ぶん（300なら10箱）、絞り込み中は当てはまる数ぶん */
  PartyScene.prototype._boxPageCount = function (view) {
    var size = this._boxSize();
    var max = this.game.storage.maxSize;
    var count = (this.storageFilter || !max) ? view.length + (max ? 0 : 1) : max;
    return Math.max(1, Math.ceil(count / size));
  };

  /** その箱のマスにいる個体の、預かり所の位置（空きなら -1） */
  PartyScene.prototype._boxCellIndex = function (view, page, cell) {
    var k = page * this._boxSize() + cell;
    return (k < view.length) ? view[k] : -1;
  };

  /**
   * 箱のカーソルを、ほかの操作（様子を見る・装備など）が使う tab / index に写す。
   * 空きのマスは index -1（_selected() が null になる）
   */
  PartyScene.prototype._syncBoxSelection = function () {
    if (this.boxFocus === "party") {
      this.tab = "party";
      this.boxPartyIndex = Math.max(0, Math.min(this.boxPartyIndex, this.game.party.size() - 1));
      this.index = this.boxPartyIndex;
    } else {
      this.tab = "storage";
      this.index = this._boxCellIndex(this._storageView(), this.boxPage, this.boxCell);
    }
    this._boxSynced = { tab: this.tab, index: this.index };
  };

  /**
   * ほかの画面（様子を見るの↑↓・装備の←→）で選びが変わって戻ってきたら、箱のカーソルをそこへ合わせる
   */
  PartyScene.prototype._adoptBoxSelection = function () {
    var s = this._boxSynced;
    if (!s || (s.tab === this.tab && s.index === this.index)) return;
    if (this.tab === "party") {
      this.boxFocus = "party";
      this.boxPartyIndex = this.index;
    } else if (this.index >= 0) {
      var at = this._storageView().indexOf(this.index);
      if (at >= 0) {
        this.boxFocus = "box";
        this.boxPage = Math.floor(at / this._boxSize());
        this.boxCell = at % this._boxSize();
      }
    }
    this._syncBoxSelection();
  };

  PartyScene.prototype._updateBoxView = function (input) {
    this._adoptBoxSelection();
    var pages = this._boxPageCount(this._storageView());
    if (this.boxPage >= pages) this.boxPage = pages - 1;

    var boxPaneResult = this.boxPane.handleInput(input);
    if (boxPaneResult && boxPaneResult.bar) return;
    if (this._handleBoxPointer(input)) return;

    if (input.isPressed("prevTab")) this._switchBox(-1);
    if (input.isPressed("nextTab")) this._switchBox(1);
    if (input.isPressed("sort")) this._cycleStorageSort();
    if (input.isPressed("filter")) { this._beginStorageFilter(); return; }

    this._moveBoxCursor(input);
    this._syncBoxSelection();

    if (input.isPressed("confirm")) { this._boxConfirm(); return; }
    if (input.isPressed("menu")) {
      if (this.marking) this._beginReleaseMarked();
      else this._beginAction();
      return;
    }
    if (input.isPressed("cancel") || input.isPressed("party")) this._cancelBoxView();
  };

  /**
   * ↑↓←→。箱の左端から←で左の列へ、右端から→でも左の列へ回る（列 → 箱 → 列 の輪）。
   * 印をつけている間は箱の中だけを回る
   */
  PartyScene.prototype._moveBoxCursor = function (input) {
    var cols = this._boxCols();
    var rows = Math.ceil(this._boxSize() / cols);
    var partySize = this.game.party.size();

    if (this.boxFocus === "party") {
      if (partySize > 0) {
        if (input.isPressed("up"))   this.boxPartyIndex = (this.boxPartyIndex - 1 + partySize) % partySize;
        if (input.isPressed("down")) this.boxPartyIndex = (this.boxPartyIndex + 1) % partySize;
      }
      var row = Math.min(rows - 1, this.boxPartyIndex);
      if (input.isPressed("right")) { this.boxFocus = "box"; this.boxCell = row * cols; }
      if (input.isPressed("left"))  { this.boxFocus = "box"; this.boxCell = row * cols + cols - 1; }
      return;
    }

    var col = this.boxCell % cols;
    var r = Math.floor(this.boxCell / cols);
    var toParty = !this.marking && partySize > 0;
    if (input.isPressed("up"))   r = (r - 1 + rows) % rows;
    if (input.isPressed("down")) r = (r + 1) % rows;
    if (input.isPressed("left")) {
      if (col === 0 && toParty) { this.boxFocus = "party"; this.boxPartyIndex = Math.min(r, partySize - 1); return; }
      col = (col - 1 + cols) % cols;
    }
    if (input.isPressed("right")) {
      if (col === cols - 1 && toParty) { this.boxFocus = "party"; this.boxPartyIndex = Math.min(r, partySize - 1); return; }
      col = (col + 1) % cols;
    }
    this.boxCell = Math.min(this._boxSize() - 1, r * cols + col);
  };

  PartyScene.prototype._switchBox = function (direction) {
    var pages = this._boxPageCount(this._storageView());
    this.boxPage = (this.boxPage + direction + pages) % pages;
    this.boxFocus = "box";
    this._syncBoxSelection();
  };

  PartyScene.prototype._cycleStorageSort = function () {
    this.storageSort = ((this.storageSort || 0) + 1) % STORAGE_SORTS.length;
    this._syncBoxSelection();
  };

  /** 決定：左の列なら預ける。箱なら加える（いっぱいなら入れ替え）。印をつけている間は印を付け外し */
  PartyScene.prototype._boxConfirm = function () {
    if (this.boxFocus === "party") {
      if (this.marking) return;
      this._depositToStorage();
      this._syncBoxSelection();
      return;
    }
    var monster = this._selected();
    if (!monster) return;
    if (this.marking) { this._toggleMark(monster); return; }
    if (this.game.party.isFull()) { this._beginBoxSwap(monster); return; }
    this._takeFromStorage();
    this._syncBoxSelection();
  };

  // 入れ替え：パーティがいっぱいのとき、加える仲間と入れ替えて預ける仲間を左の列から選ぶ

  PartyScene.prototype._beginBoxSwap = function (monster) {
    if (!monster) return;
    this.swapMonster = monster;
    this.swapReturn = { page: this.boxPage, cell: this.boxCell };
    this.mode = "boxSwap";
    this.boxFocus = "party";
    this._syncBoxSelection();
    this._notice = fill(this.texts.boxSwapPrompt, { name: monster.getName() });
  };

  PartyScene.prototype._cancelBoxSwap = function () {
    this.mode = "list";
    this.swapMonster = null;
    this.boxFocus = "box";
    if (this.swapReturn) { this.boxPage = this.swapReturn.page; this.boxCell = this.swapReturn.cell; }
    this._notice = null;
    this._syncBoxSelection();
  };

  PartyScene.prototype._updateBoxSwap = function (input) {
    var size = this.game.party.size();
    var clicked = false;
    var pointer = input.getPointer ? input.getPointer() : null;
    var rects = (this._boxHitRects || {}).party || [];
    if (pointer && pointer.inside && (pointer.moved || pointer.clicked)) {
      for (var i = 0; i < rects.length; i++) {
        if (!NS.Panel.containsPoint(rects[i], pointer)) continue;
        this.boxPartyIndex = i;
        clicked = pointer.clicked;
      }
    }
    if (size > 0) {
      if (input.isPressed("up"))   this.boxPartyIndex = (this.boxPartyIndex - 1 + size) % size;
      if (input.isPressed("down")) this.boxPartyIndex = (this.boxPartyIndex + 1) % size;
    }
    this._syncBoxSelection();

    if (input.isPressed("cancel")) { this._cancelBoxSwap(); return; }
    if (!input.isPressed("confirm") && !clicked) return;

    var storageIndex = this.game.storage.getMembers().indexOf(this.swapMonster);
    var done = this.game.swapWithStorage(this.boxPartyIndex, storageIndex);
    var notice = done ? fill(this.texts.boxSwapped, { taken: done.taken.getName(), stored: done.stored.getName() }) : null;
    this._cancelBoxSwap();
    this._notice = notice;
  };

  // 絞り込み：属性か種族を1つ選ぶ（預かり所にいるものだけ並ぶ）

  PartyScene.prototype._beginStorageFilter = function () {
    var data = this.game.data;
    var members = this.game.storage.getMembers();
    var texts = this.texts;
    var countText = function (n) { return fill(texts.boxFilterCount, { n: n }); };
    var byElement = {}, bySpecies = {};
    for (var i = 0; i < members.length; i++) {
      var e = this._monsterElement(members[i]);
      byElement[e] = (byElement[e] || 0) + 1;
      bySpecies[members[i].speciesId] = (bySpecies[members[i].speciesId] || 0) + 1;
    }

    var rows = [{ type: "entry", label: texts.boxFilterAll || "", value: null, right: countText(members.length) }];
    var elements = data.elements || {};
    var elementIds = Object.keys(byElement).sort(function (a, b) {
      return ((elements[a] || {}).order || 0) - ((elements[b] || {}).order || 0);
    });
    if (elementIds.length) rows.push({ type: "header", label: texts.boxFilterElement || "" });
    elementIds.forEach(function (id) {
      rows.push({ type: "entry", label: (elements[id] || {}).name || id,
                  value: { kind: "element", id: id }, right: countText(byElement[id]) });
    });
    var speciesIds = Object.keys(data.monsters || {}).filter(function (id) { return bySpecies[id]; });
    if (speciesIds.length) rows.push({ type: "header", label: texts.boxFilterSpecies || "" });
    speciesIds.forEach(function (id) {
      rows.push({ type: "entry", label: data.monsters[id].name || id,
                  value: { kind: "species", id: id }, right: countText(bySpecies[id]) });
    });

    this.filterList.setRows(rows);
    var current = this.storageFilter;
    for (var r = 0; r < rows.length; r++) {
      var v = rows[r].value;
      if (rows[r].type === "entry" && ((!v && !current) || (v && current && v.kind === current.kind && v.id === current.id))) {
        this.filterList.setIndex(r);
        break;
      }
    }
    this.mode = "boxFilter";
  };

  PartyScene.prototype._updateBoxFilter = function (input) {
    this.filterList.handleInput(input);
    if (input.isPressed("cancel")) { this.mode = "list"; return; }
    if (!input.isPressed("confirm") && !this.filterList.clickedEntry(input)) return;
    var row = this.filterList.getSelected();
    if (!row) return;
    this.storageFilter = row.value;
    this.boxPage = 0;
    this.boxCell = 0;
    this.boxFocus = "box";
    this.mode = "list";
    this._syncBoxSelection();
  };

  /** 絞り込みの札に出す名前 */
  PartyScene.prototype._storageFilterLabel = function () {
    var f = this.storageFilter;
    var data = this.game.data;
    if (!f) return this.texts.boxFilterAll || "";
    if (f.kind === "element") return ((data.elements || {})[f.id] || {}).name || f.id;
    return ((data.monsters || {})[f.id] || {}).name || f.id;
  };

  // まとめて逃がす：箱のマスに印をつけ、C（または下の札）でまとめて逃がす

  PartyScene.prototype._beginMarking = function () {
    this.marking = true;
    this.marks = [];
    this.boxFocus = "box";
    var selected = this._selected();
    if (selected && this.tab === "storage" && !selected.partner) this.marks.push(selected);
    this._notice = null;
    this._syncBoxSelection();
  };

  PartyScene.prototype._stopMarking = function () {
    this.marking = false;
    this.marks = [];
    this._notice = null;
  };

  PartyScene.prototype._toggleMark = function (monster) {
    if (monster.partner) {
      this._notice = fill(this.texts.cannotReleasePartner, { name: monster.getName() });
      this.game.playError();
      return;
    }
    var at = this.marks.indexOf(monster);
    if (at >= 0) this.marks.splice(at, 1);
    else this.marks.push(monster);
    this._notice = null;
  };

  PartyScene.prototype._beginReleaseMarked = function () {
    if (this.marks.length === 0) {
      this._notice = this.texts.releaseManyNone || null;
      this.game.playError();
      return;
    }
    this.releaseMenu.index = 0;   // 既定は「やめる」
    this.mode = "releaseMany";
    this._notice = null;
  };

  PartyScene.prototype._updateReleaseManyMode = function (input) {
    var result = this.releaseMenu.handleInput(input);
    if (!result) return;
    this.mode = "list";
    if (result.type === "cancel" || result.value !== "yes") return;

    // 1体ずつ Game.releaseMonster を通す（装備を持ち物へ戻せない仲間はそこで残す）
    var released = 0, kept = null;
    var marks = this.marks.slice();
    for (var i = 0; i < marks.length; i++) {
      var at = this.game.storage.getMembers().indexOf(marks[i]);
      if (at < 0) continue;
      var done = this.game.releaseMonster("storage", at);
      if (done.success) released++;
      else if (!kept) kept = marks[i];
    }
    this._stopMarking();
    this._notice = kept ? fill(this.texts.releaseManyKept, { n: released, name: kept.getName() })
                        : fill(this.texts.releasedMany, { n: released });
    if (kept) this.game.playError();
    this._syncBoxSelection();
  };

  /**
   * マウス：左の列・箱のマスは重ねると選び、押すと決定と同じ。
   * ◀ ▶（箱）・並べ方・絞り込み・下の札は押すと働く。箱の上でホイールを回すと箱を送る
   * @returns {boolean} 何かをしたら true（このフレームのキーは見ない）
   */
  PartyScene.prototype._handleBoxPointer = function (input) {
    var pointer = input.getPointer ? input.getPointer() : null;
    if (!pointer || !pointer.inside) return false;
    var hit = this._boxHitRects || {};
    var i;

    if (pointer.wheel && NS.Panel.containsPoint(hit.grid, pointer)) {
      this._switchBox(pointer.wheel > 0 ? 1 : -1);
      return true;
    }
    if (pointer.clicked) {
      if (NS.Panel.containsPoint(hit.prev, pointer)) { this._switchBox(-1); return true; }
      if (NS.Panel.containsPoint(hit.next, pointer)) { this._switchBox(1); return true; }
      if (NS.Panel.containsPoint(hit.sort, pointer)) { this._cycleStorageSort(); return true; }
      if (NS.Panel.containsPoint(hit.filter, pointer)) { this._beginStorageFilter(); return true; }
      var actions = hit.actions || [];
      for (i = 0; i < actions.length; i++) {
        if (!NS.Panel.containsPoint(actions[i].rect, pointer)) continue;
        if (actions[i].value === "releaseMarked") this._beginReleaseMarked();
        else if (actions[i].value === "stopMarking") this._stopMarking();
        else this._runAction(actions[i].value);
        return true;
      }
    }
    if (!pointer.moved && !pointer.clicked) return false;

    var party = hit.party || [];
    for (i = 0; i < party.length; i++) {
      if (!NS.Panel.containsPoint(party[i], pointer)) continue;
      this.boxFocus = "party";
      this.boxPartyIndex = i;
      this._syncBoxSelection();
      if (pointer.clicked) this._boxConfirm();
      return pointer.clicked;
    }
    var cells = hit.cells || [];
    for (i = 0; i < cells.length; i++) {
      if (!NS.Panel.containsPoint(cells[i], pointer)) continue;
      this.boxFocus = "box";
      this.boxCell = i;
      this._syncBoxSelection();
      if (pointer.clicked) this._boxConfirm();
      return pointer.clicked;
    }
    return false;
  };

  // --- 出し入れ ---

  /** 預かり所からパーティへ加える（空きがあるときだけ） */
  PartyScene.prototype._takeFromStorage = function () {
    var storage = this.game.storage;
    if (!storage || storage.isEmpty()) return;

    if (this.game.party.isFull()) {
      this._notice = this.texts.partyFull || null;
      this.game.playError();
      return;
    }

    var monster = storage.get(this.index);
    if (!monster || !this.game.takeFromStorage(this.index)) return;

    this._notice = fill(this.texts.tookOut, { name: monster.getName() });
    this._clampIndex();
  };

  /** パーティの1体を預かり所へ預ける */
  PartyScene.prototype._depositToStorage = function () {
    var party = this.game.party;
    var index = this.index;

    if (!party || party.size() <= 1) {
      // 最後の1体を預けると戦えなくなるので、預けさせない
      this._notice = this.texts.cannotStoreLast || null;
      this.game.playError();
      return;
    }

    var monster = party.get(index);
    if (!monster) return;

    if (!this.game.depositToStorage(index)) {
      this._notice = this.texts.storageFull || null;
      this.game.playError();
      return;
    }

    this._notice = fill(this.texts.stored, { name: monster.getName() });
    this._clampIndex();
  };

  /** 件数が変わったあと、カーソルを一覧の中へ収める */
  PartyScene.prototype._clampIndex = function () {
    var size = this._currentList().size();
    if (this.index >= size) this.index = Math.max(0, size - 1);
  };

  /** テンプレートの {key} を置き換える */
  function fill(template, values) {
    if (!template) return "";
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return (values[key] !== undefined) ? values[key] : match;
    });
  }

  // --- 描画 ---

  PartyScene.prototype.render = function (ctx) {
    var w = this.game.canvas.width;
    var h = this.game.canvas.height;
    var L = this.layout;
    var t = this.theme;

    this.renderer.clear(L.background || "#000000", w, h);

    // 様子を見ている間は画面ぜんぶを使う（一覧もタブも出さない）
    if (this.mode === "inspect" || this.mode === "affection") {
      var inspected = this._currentList().get(this.index);
      this._renderInspect(inspected);
      // 愛情度の詳細は「様子を見る」の上に重ねる
      if (this.mode === "affection") this._renderAffectionDetail(inspected);
      this._renderHint(L, t);
      this.backButton.render();
      return;
    }

    // 装備も画面ぜんぶを使う（v1.3.0）
    if (this.mode === "equip") {
      this._renderEquipScreen(this._equipMonster());
      this._renderHint(L, t);
      this.backButton.render();
      return;
    }

    if (this.boxView) {
      // 預かり所（v1.3.0）：左に連れていく仲間、中に箱、右に詳細
      this._renderBoxView();
    } else {
      this.panel.drawText(this.texts.title || "party",
        L.title.x, L.title.y, { font: t.largeFont });

      this._renderTabs(L, t);

      var list = this._currentList();
      if (!list || list.isEmpty()) {
        this.panel.drawText(this.texts.empty || "", L.list.x, L.list.y + 30);
      } else {
        this._syncListView();
        this.listView.render(this.game.clock);

        this._renderDetail(list.get(this.index));
      }
    }

    // 「この仲間に何をするか」の項目
    if (this.mode === "action") this.actionMenu.render(this.game.clock);
    // 「逃がしますか?」は一覧の手前に重ねる（操作説明はその上に出す）
    if (this.mode === "release" || this.mode === "releaseMany") this._renderReleaseConfirm(ctx);
    // 探索中に使う技と、その相手
    if (this.mode === "fieldSkill") this.fieldSkillMenu.render(this.game.clock);
    if (this.mode === "tactic") {
      this.tacticMenu.render(this.game.clock);
      this._renderTacticInfo();
    }
    if (this.mode === "fieldTarget") this.fieldTargetMenu.render(this.game.clock);

    // 名前をつけている間は、入力欄を画面の手前に重ねる。
    // 案内は入力欄が自分で出すので、ここのヒントと「戻る」は出さない
    // （入力欄の間は他の操作を受け付けないため、押せるものを見せない）
    if (this.mode === "naming") {
      this.nameInput.render(this.game.clock);
      return;
    }

    this._renderHint(L, t);
    this.backButton.render();
  };

  /** 装備の候補の枠（見出しの行を除いた、行を並べるところ） */
  PartyScene.prototype._equipListRect = function () {
    var r = (this.layout.equip || {}).items || { x: 348, y: 58, w: 420, h: 248, rowHeight: 26, headHeight: 30 };
    var head = r.headHeight || 30;
    var rows = Math.max(1, Math.floor((r.h - head - 6) / r.rowHeight));
    return { x: r.x, y: r.y + head, w: r.w, h: rows * r.rowHeight,
             rowHeight: r.rowHeight, visibleRows: rows, frame: false };
  };

  /** 装備の画面ぜんぶ */
  PartyScene.prototype._renderEquipScreen = function (monster) {
    if (!monster) return;
    var E = this.layout.equip || {};
    var t = this.theme;
    this._equipHitRects = {};

    this.panel.drawText(this.texts.equipScreenTitle || this.texts.equipLabel || "",
      this.layout.title.x, this.layout.title.y, { font: t.largeFont });

    var slotRows = this._equipSlotRows(monster);
    this._renderEquipMonster(monster, E.monster || { x: 32, y: 58, w: 300, h: 84 });
    this._renderEquipSlots(monster, slotRows, E.slots || { x: 32, y: 150, w: 300, h: 156, rowHeight: 26 });
    this._renderEquipCandidates(monster, slotRows[this.equipSlotIndex] || null,
      E.items || { x: 348, y: 58, w: 420, h: 248, headHeight: 30 });
    this._renderEquipCompare(monster, slotRows[this.equipSlotIndex] || null,
      E.compare || { x: 32, y: 316, w: 736, h: 226 });
  };

  /** 左上：◀ 絵・名前・Lv ▶（仲間が1体なら矢印は出さない） */
  PartyScene.prototype._renderEquipMonster = function (monster, box) {
    var t = this.theme;
    this.panel.drawBox(box);

    var size = box.spriteSize || 48;
    var spriteId = monster.getSpriteId();
    this.sprites.drawMotion(spriteId, box.x + 36, box.y + (box.h - size) / 2, size, size,
      NS.Motion.forSprite(this.game.data, spriteId, monster.getMotionId(),
        this.game.clock, monster.getMotionPhase()));

    var textX = box.x + 36 + size + 14;
    this.panel.drawText(monster.getName(), textX, box.y + box.h / 2 - 2);
    var size2 = this._currentList().size();
    this.panel.drawText("Lv" + monster.level + "    " + (this.index + 1) + "/" + size2,
      textX, box.y + box.h / 2 + 18, { font: t.smallFont, color: t.subTextColor });

    if (size2 <= 1) return;
    var midY = box.y + box.h / 2 + 6;
    this.panel.drawText("◀", box.x + 12, midY, { color: t.cursorColor });
    this.panel.drawText("▶", box.x + box.w - 12, midY, { align: "right", color: t.cursorColor });
    this._equipHitRects.prev = { x: box.x, y: box.y, w: 30, h: box.h };
    this._equipHitRects.next = { x: box.x + box.w - 30, y: box.y, w: 30, h: box.h };
  };

  /** 左：枠ごとに今の装備。最後に「すべて外す」 */
  PartyScene.prototype._renderEquipSlots = function (monster, slotRows, box) {
    var t = this.theme;
    var data = this.game.data;
    var rowHeight = box.rowHeight || 26;
    var labelX = box.x + (box.labelX || 30);
    var nameX = box.x + (box.nameX || 128);
    var focused = (this.equipFocus === "slots");
    this.panel.drawBox(box);
    this._equipHitRects.slots = [];

    var rows = slotRows.concat([{ unequipAll: true }]);
    for (var i = 0; i < rows.length; i++) {
      var top = box.y + 8 + rowHeight * i;
      var y = top + rowHeight - 8;
      var selected = (i === this.equipSlotIndex);
      this._equipHitRects.slots.push({ x: box.x, y: top, w: box.w, h: rowHeight });

      if (selected) {
        this.panel.drawText("▶", box.x + 10, y, { color: focused ? t.cursorColor : t.hintColor });
      }
      if (rows[i].unequipAll) {
        this.panel.drawText(this.texts.unequipAll || "", labelX, y,
          { color: selected && focused ? t.cursorColor : t.subTextColor });
        continue;
      }

      this.panel.drawText(rows[i].label, labelX, y, { font: t.smallFont, color: t.subTextColor });
      var item = rows[i].itemId ? data.getItem(rows[i].itemId) : null;
      if (!item) {
        this.panel.drawText(this.texts.slotEmpty || "-", nameX, y, { color: t.hintColor });
        continue;
      }
      NS.StatusMarks.drawIcon(this.sprites, item.icon, nameX, y, 16);
      this.panel.ctx.font = t.font || "14px monospace";
      this.panel.drawText(clipText(this.panel.ctx, item.name, box.x + box.w - 12 - (nameX + 20)), nameX + 20, y,
        { color: selected && focused ? t.cursorColor : t.textColor });
    }
  };

  /** 右：選んでいる枠の候補。見出しに枠の名前と並べ方（押すと並べ替え） */
  PartyScene.prototype._renderEquipCandidates = function (monster, slotRow, box) {
    var t = this.theme;
    this.panel.drawBox(box);

    var headY = box.y + 22;
    var title = slotRow
      ? fill(this.texts.equipCandidates, { slot: slotRow.label })
      : (this.texts.unequipAll || "");
    this.panel.drawText(title, box.x + 12, headY, { font: t.smallFont, color: t.subTextColor });

    var sortLabels = this.texts.equipSortLabels || {};
    var sortText = fill(this.texts.equipSort, { mode: sortLabels[EQUIP_SORTS[this.equipSort || 0]] || "" });
    this.panel.drawText(sortText, box.x + box.w - 12, headY,
      { align: "right", font: t.smallFont, color: t.cursorColor });
    this.panel.ctx.font = t.smallFont || "12px monospace";
    var sortW = this.panel.ctx.measureText(sortText).width;
    this._equipHitRects.sort = { x: box.x + box.w - 12 - sortW - 4, y: box.y + 4, w: sortW + 12, h: 26 };

    if (!slotRow) {
      this.panel.drawText(this.texts.unequipAllNote || "", box.x + 16, headY + 34,
        { font: t.smallFont, color: t.hintColor });
      return;
    }
    if (!this.equipList.hasEntries()) {
      this.panel.drawText(this.texts.equipNoCandidates || "", box.x + 16, headY + 34,
        { font: t.smallFont, color: t.hintColor });
      this.panel.drawText(this.texts.noEquipmentHint || "", box.x + 16, headY + 54,
        { font: t.smallFont, color: t.hintColor });
      return;
    }
    this.equipList.render(this.game.clock);
  };

  /**
   * 候補の1行：▶ 絵 名前　主な効果　右端に所持数（ほかの仲間のものは、その仲間の名前）。
   * 枠を選んでいる間は、カーソルを薄く出す
   */
  PartyScene.prototype._renderEquipRow = function (row, top, selected) {
    var t = this.theme;
    var rect = this.equipList.rect;
    var box = (this.layout.equip || {}).items || {};
    var ctx = this.panel.ctx;
    var y = top + rect.rowHeight - 8;
    var focused = (this.equipFocus === "items");
    var x = rect.x + 10;
    var rightX = rect.x + rect.w - 12 - this.equipList.barSpace();

    if (selected) this.panel.drawText("▶", x, y, { color: focused ? t.cursorColor : t.hintColor });

    var nameX = x + 22;
    if (row.icon) { NS.StatusMarks.drawIcon(this.sprites, row.icon, nameX, y, 16); nameX += 20; }
    var effectX = rect.x + (box.effectX || 196);

    var color = t.textColor;
    if (row.kind === "unequip") color = t.subTextColor;
    if (row.kind === "other") color = t.subTextColor;
    if (row.worn) color = t.hintColor;
    if (selected && focused && !row.worn) color = t.cursorColor;

    ctx.font = t.font || "14px monospace";
    var nameMax = (row.kind === "unequip") ? rightX - nameX : effectX - 8 - nameX;
    this.panel.drawText(clipText(ctx, row.label, nameMax), nameX, y, { color: color });

    var rightW = 0;
    if (row.right) {
      ctx.font = t.smallFont || "12px monospace";
      rightW = ctx.measureText(row.right).width;
      this.panel.drawText(row.right, rightX, y, { align: "right", font: t.smallFont,
        color: row.kind === "other" ? (t.hintColor) : t.subTextColor });
    }

    // 主な効果（装備の効果を「・」でつないで、入るだけ）
    if (row.itemId) {
      var item = this.game.data.getItem(row.itemId);
      var text = this._describeEquip(item).map(function (l) { return l.replace(/^・/, ""); }).join("・");
      ctx.font = t.smallFont || "12px monospace";
      this.panel.drawText(clipText(ctx, text, rightX - rightW - 10 - effectX), effectX, y,
        { font: t.smallFont, color: t.subTextColor });
    }
  };

  /**
   * 下：見比べ。左に今の装備、中に選んでいる候補（候補を選んでいるときだけ）、右にステータスの 前 → 後。
   * ほかの仲間から移すときは、その仲間に何を渡すかも書く
   */
  PartyScene.prototype._renderEquipCompare = function (monster, slotRow, box) {
    var t = this.theme;
    var data = this.game.data;
    var lh = box.lineHeight || 20;
    var colA = box.x + 16;
    var colB = box.x + (box.colB || 250);
    var colS = box.x + (box.colStats || 520);
    var bottom = box.y + box.h - 10;
    var self = this;
    this.panel.drawBox(box);

    function itemLines(item, x, y, maxW) {
      if (!item) {
        self.panel.drawText(self.texts.equipCompareEmpty || "-", x, y, { color: t.hintColor });
        return;
      }
      NS.StatusMarks.drawIcon(self.sprites, item.icon, x, y, 16);
      self.panel.ctx.font = t.font || "14px monospace";
      self.panel.drawText(clipText(self.panel.ctx, item.name, maxW - 20), x + 20, y);
      var lines = self._describeEquip(item);
      self.panel.ctx.font = t.smallFont || "12px monospace";
      for (var i = 0; i < lines.length && y + lh * (i + 1) <= bottom; i++) {
        self.panel.drawText(clipText(self.panel.ctx, lines[i], maxW), x, y + lh * (i + 1),
          { font: t.smallFont, color: t.subTextColor });
      }
    }

    var headY = box.y + 24;
    var firstY = headY + lh + 4;

    // 左：今の装備
    this.panel.drawText(this.texts.equipCompareNow || "", colA, headY, { font: t.smallFont, color: t.hintColor });
    if (slotRow) itemLines(slotRow.itemId ? data.getItem(slotRow.itemId) : null, colA, firstY, colB - colA - 16);

    // 中：選んでいる候補（候補を選んでいるときだけ）
    var row = (this.equipFocus === "items" && slotRow) ? this.equipList.getSelected() : null;
    this.panel.drawText(this.texts.equipCompareNext || "", colB, headY, { font: t.smallFont, color: t.hintColor });
    if (!row) {
      var note = slotRow ? this.texts.equipCompareHint : this.texts.unequipAllNote;
      this.panel.ctx.font = t.smallFont || "12px monospace";
      var wrapped = wrapByWidth(this.panel.ctx, note || "", colS - colB - 20, t.smallFont);
      for (var w = 0; w < wrapped.length; w++) {
        this.panel.drawText(wrapped[w], colB, firstY + lh * w, { font: t.smallFont, color: t.hintColor });
      }
    } else if (row.kind === "unequip") {
      this.panel.drawText(this.texts.unequipLabel || "", colB, firstY, { color: t.subTextColor });
    } else {
      itemLines(data.getItem(row.itemId), colB, firstY, colS - colB - 20);
      // ほかの仲間から移すときの、相手側のこと
      if (row.kind === "other") {
        var old = slotRow.itemId ? data.getItem(slotRow.itemId) : null;
        var gives = old && (row.owner.equipment || []).indexOf(old.id) < 0;
        var text = fill(this.texts.equipFromOwner, { owner: row.owner.getName() });
        if (gives) text += "　" + fill(this.texts.equipGiveOwner, { owner: row.owner.getName(), item: old.name });
        else if (old) text += "　" + fill(this.texts.equipStoreOld, { item: old.name });
        this.panel.ctx.font = t.smallFont || "12px monospace";
        this.panel.drawText(clipText(this.panel.ctx, text, box.x + box.w - 16 - colB), colB, bottom,
          { font: t.smallFont, color: t.cursorColor });
      }
    }

    // 右：ステータス（候補を選んでいれば 前 → 後、そうでなければ今の値）
    var changes = row
      ? (row.changes || this._statChanges(monster, this._equipmentAfter(monster, slotRow, row.value)))
      : this._statChanges(monster, monster.equipment || []);
    var right = box.x + box.w - 16;
    for (var i = 0; i < changes.length; i++) {
      var c = changes[i];
      var y = firstY + lh * i;
      var color = t.textColor;
      if (c.after > c.before) color = t.hpBarHigh || "#5fd18c";
      else if (c.after < c.before) color = t.hpBarLow || "#e8542a";
      this.panel.drawText(c.label, colS, y, { font: t.smallFont, color: t.hintColor });
      this.panel.drawText(row ? c.before + " → " + c.after : String(c.before), right, y,
        { align: "right", color: row ? color : t.textColor });
    }
  };

  /**
   * その候補を選んだあとの、この仲間の装備の並び（実際には着け替えない。見せるためだけ）。
   * 選んでいる枠の位置に入る（空いていれば足す）。外すならその位置を抜く
   *
   * @param {object} monster
   * @param {object} slotRow _equipSlotRows の1行
   * @param {{action:string, index?:number, itemId?:string, owner?:object, ownerIndex?:number}} choice
   * @returns {string[]}
   */
  PartyScene.prototype._equipmentAfter = function (monster, slotRow, choice) {
    var list = (monster.equipment || []).slice();
    if (choice.action === "unequip") {
      list.splice(choice.index, 1);
      return list;
    }
    var itemId = (choice.action === "take")
      ? (choice.owner.equipment || [])[choice.ownerIndex]
      : choice.itemId;
    for (var i = 0; i < list.length; i++) {
      if (i !== slotRow.index && list[i] === itemId) return list;   // 同じものは2つ着けられない
    }
    if (slotRow.index >= 0) list[slotRow.index] = itemId;
    else list.push(itemId);
    return list;
  };

  /** 幅に収まらない文字列を切り詰めて「…」を付ける（呼ぶ前に ctx.font を合わせておく） */
  function clipText(ctx, text, maxWidth) {
    text = String(text || "");
    if (maxWidth <= 0) return "";
    if (ctx.measureText(text).width <= maxWidth) return text;
    for (var len = text.length - 1; len > 0; len--) {
      var cut = text.slice(0, len) + "…";
      if (ctx.measureText(cut).width <= maxWidth) return cut;
    }
    return "…";
  }

  /**
   * その装備にしたときの、ステータスの変化を返す。
   *
   * 装備を一時的に差し替えて計算し、必ず元へ戻す。
   * ステータスは呼ばれるたびに計算されるので、こうしても持ち主の状態は変わらない。
   *
   * @param {object} monster
   * @param {string[]} equipment 着け替えたあとの装備id
   * @returns {Array<{label:string, before:number, after:number}>}
   */
  PartyScene.prototype._statChanges = function (monster, equipment) {
    var texts = this.texts;
    var stats = [
      { label: "HP", read: function (m) { return m.getMaxHp(); } },
      { label: texts.attackLabel || "攻撃",  read: function (m) { return m.getAttack(); } },
      { label: texts.defenseLabel || "防御", read: function (m) { return m.getDefense(); } },
      { label: texts.speedLabel || "素早さ", read: function (m) { return m.getSpeed(); } },
      { label: "PP", read: function (m) { return m.getMaxPp(); } }
    ];

    var before = [];
    var i;
    for (i = 0; i < stats.length; i++) before.push(stats[i].read(monster));

    var original = monster.equipment;
    monster.equipment = equipment;

    var result = [];
    try {
      for (i = 0; i < stats.length; i++) {
        result.push({ label: stats[i].label, before: before[i], after: stats[i].read(monster) });
      }
    } finally {
      monster.equipment = original;
    }
    return result;
  };

  /** 装備の効果を1行ずつの文章にする（組み立ては EffectSystem に任せる） */
  PartyScene.prototype._describeEquip = function (item) {
    var effects = (item.equip || {}).effects || [];
    var lines = [];

    for (var i = 0; i < effects.length; i++) {
      var text = NS.EffectSystem.describeEffect(effects[i], this.game.data);
      if (text) lines.push("・" + text);
    }
    return lines;
  };

  /** 上部の「パーティ / 預かり所」切り替え表示 */
  /** 預かり所の画面ぜんぶ（v1.3.0） */
  PartyScene.prototype._renderBoxView = function () {
    var B = this._boxLayout();
    var t = this.theme;
    var storage = this.game.storage;
    var view = this._storageView();
    this._boxHitRects = { party: [], cells: [], actions: [] };

    this.panel.drawText(this.texts.boxTitle || "", this.layout.title.x, this.layout.title.y, { font: t.largeFont });
    var grid = B.grid || { x: 214, y: 58, w: 326, h: 306 };
    this.panel.drawText(fill(this.texts.boxCount, { n: storage.size(), max: storage.maxSize || "-" }),
      grid.x + grid.w, this.layout.title.y, { align: "right", font: t.smallFont, color: t.subTextColor });

    this._renderBoxParty(B.party || { x: 32, y: 58, w: 170, h: 306, rowHeight: 46, spriteSize: 32 });
    this._renderBoxGrid(grid, view);
    this._renderBoxFooter(B.footer || { x: 32, y: 374, w: 508, h: 168 }, view);

    var detail = B.detail || { x: 552, y: 58, w: 216, h: 484 };
    var selected = this._selected();
    if (selected) {
      this._renderDetail(selected, detail);
    } else {
      this.panel.drawBox(detail);
      this.panel.drawText(this.texts.boxEmptyCell || "", detail.x + detail.w / 2, detail.y + 40,
        { align: "center", font: t.smallFont, color: t.hintColor });
    }

    if (this.mode === "boxFilter") this._renderBoxFilter(B);
  };

  /** 左：連れていく仲間（入れ替えの相手を選んでいる間は、選んでいる行を強く出す） */
  PartyScene.prototype._renderBoxParty = function (P) {
    var t = this.theme;
    var party = this.game.party;
    var ctx = this.panel.ctx;
    var rowHeight = P.rowHeight || 46;
    var size = P.spriteSize || 32;
    var fieldSize = this.game.data.config.battleFieldSize || 3;
    var swapping = (this.mode === "boxSwap");
    this.panel.drawBox(P);

    this.panel.drawText(fill(this.texts.boxPartyHead, { n: party.size(), max: party.maxSize }),
      P.x + 10, P.y + 20, { font: t.smallFont, color: swapping ? t.cursorColor : t.subTextColor });

    for (var i = 0; i < party.size(); i++) {
      var m = party.get(i);
      var top = P.y + 28 + rowHeight * i;
      var rect = { x: P.x + 6, y: top, w: P.w - 12, h: rowHeight - 4 };
      this._boxHitRects.party.push(rect);
      var selected = (this.boxFocus === "party" && i === this.boxPartyIndex);

      if (selected) this._strokeRect(rect, swapping ? (t.dangerColor || "#e8542a") : t.cursorColor);
      var sprite = m.getSpriteId();
      this.sprites.drawMotion(sprite, rect.x + 4, rect.y + (rect.h - size) / 2, size, size,
        selected ? NS.Motion.forSprite(this.game.data, sprite, m.getMotionId(), this.game.clock, m.getMotionPhase()) : null);

      var textX = rect.x + size + 12;
      ctx.font = t.font || "14px monospace";
      this.panel.drawText(clipText(ctx, m.getName(), rect.x + rect.w - 6 - textX), textX, rect.y + 18,
        { color: selected ? t.cursorColor : t.textColor });
      this.panel.drawText("Lv" + m.level, textX, rect.y + 34, { font: t.smallFont, color: t.subTextColor });
      if (i < fieldSize) {
        this.panel.drawText((this.layout.fieldDivider || {}).label || "", rect.x + rect.w - 6, rect.y + 34,
          { align: "right", font: t.smallFont, color: (this.layout.fieldDivider || {}).color || t.cursorColor });
      }
    }
  };

  /** 中：箱。見出しに ◀ 箱 n/10 ▶、下に 6×5 のマス */
  PartyScene.prototype._renderBoxGrid = function (G, view) {
    var t = this.theme;
    var B = this._boxLayout();
    var ctx = this.panel.ctx;
    var cols = this._boxCols();
    var size = this._boxSize();
    var cell = G.cell || 50, gap = G.gap || 2;
    var sprite = G.spriteSize || 36;
    var pages = this._boxPageCount(view);
    this.panel.drawBox(G);
    this._boxHitRects.grid = G;

    var headY = G.y + 22;
    var title = this.storageFilter ? fill(this.texts.boxNameFiltered, { n: this.boxPage + 1, total: pages })
                                   : fill(this.texts.boxName, { n: this.boxPage + 1, total: pages });
    this.panel.drawText(title, G.x + G.w / 2, headY, { align: "center" });
    if (pages > 1) {
      this.panel.drawText("◀", G.x + 14, headY, { color: t.cursorColor });
      this.panel.drawText("▶", G.x + G.w - 14, headY, { align: "right", color: t.cursorColor });
      this._boxHitRects.prev = { x: G.x, y: G.y, w: 60, h: G.headHeight || 34 };
      this._boxHitRects.next = { x: G.x + G.w - 60, y: G.y, w: 60, h: G.headHeight || 34 };
    }

    var left = G.x + Math.floor((G.w - cols * cell - (cols - 1) * gap) / 2);
    var top0 = G.y + (G.headHeight || 34);
    var members = this.game.storage.getMembers();
    var markColor = B.markColor || t.dangerColor || "#e8542a";

    for (var c = 0; c < size; c++) {
      var rect = { x: left + (c % cols) * (cell + gap), y: top0 + Math.floor(c / cols) * (cell + gap), w: cell, h: cell };
      this._boxHitRects.cells.push(rect);
      ctx.fillStyle = B.cellColor || "#121a2e";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

      var at = this._boxCellIndex(view, this.boxPage, c);
      var m = at >= 0 ? members[at] : null;
      var selected = (this.boxFocus === "box" && c === this.boxCell);
      var marked = m && this.marks.indexOf(m) >= 0;
      if (m) {
        var id = m.getSpriteId();
        this.sprites.drawMotion(id, rect.x + (cell - sprite) / 2, rect.y + 3, sprite, sprite,
          selected ? NS.Motion.forSprite(this.game.data, id, m.getMotionId(), this.game.clock, m.getMotionPhase()) : null);
        NS.StatusMarks.drawElement(this.sprites, this.game.data, this._monsterElement(m), rect.x + 3, rect.y + 12, { size: 10 });
        this.panel.drawText(String(m.level), rect.x + cell - 3, rect.y + cell - 3,
          { align: "right", font: B.levelFont || "10px monospace", color: t.subTextColor });
        if (m === this.swapMonster && this.mode === "boxSwap") this._strokeRect(rect, t.cursorColor);
      }
      if (marked) {
        this._strokeRect(rect, markColor);
        this.panel.drawText("✓", rect.x + 3, rect.y + cell - 3, { font: t.smallFont, color: markColor });
      }
      if (selected) this._strokeRect(rect, t.cursorColor);
    }
  };

  /** 下：並べ方・絞り込みの札と、選んでいる仲間への操作の札（押すとその操作） */
  PartyScene.prototype._renderBoxFooter = function (F, view) {
    var t = this.theme;
    var ctx = this.panel.ctx;
    var lh = F.lineHeight || 24;
    this.panel.drawBox(F);

    var x = F.x + 12, y = F.y + 24;
    var sortText = fill(this.texts.boxSort, { mode: (this.texts.boxSortLabels || {})[STORAGE_SORTS[this.storageSort || 0]] || "" });
    var filterText = fill(this.texts.boxFilter, { mode: this._storageFilterLabel() });
    ctx.font = t.smallFont || "12px monospace";
    var sortW = ctx.measureText(sortText).width;
    this.panel.drawText(sortText, x, y, { font: t.smallFont, color: t.cursorColor });
    this._boxHitRects.sort = { x: x - 4, y: y - 16, w: sortW + 8, h: 22 };
    var fx = x + sortW + 28;
    this.panel.drawText(filterText, fx, y, { font: t.smallFont, color: this.storageFilter ? t.cursorColor : t.subTextColor });
    this._boxHitRects.filter = { x: fx - 4, y: y - 16, w: ctx.measureText(filterText).width + 8, h: 22 };

    y += lh;
    var chips;
    if (this.marking) {
      this.panel.drawText(fill(this.texts.boxMarking, { n: this.marks.length }), x, y + 4,
        { color: (this._boxLayout().markColor || t.dangerColor) });
      chips = [{ label: this.texts.boxReleaseMarked || "", value: "releaseMarked" },
               { label: this.texts.boxStopMarking || "", value: "stopMarking" }];
      y += lh;
    } else if (this.storageFilter && view.length === 0) {
      this.panel.drawText(this.texts.boxFilteredEmpty || "", x, y + 4, { font: t.smallFont, color: t.hintColor });
      return;
    } else if (this._selected() && this.mode !== "boxSwap") {
      chips = this._buildActionItems().filter(function (item) { return item.value !== "cancel"; });
    } else {
      return;
    }

    // 札を左から並べ、入らなければ次の行へ
    var cx = x, cy = y;
    for (var i = 0; i < chips.length; i++) {
      ctx.font = t.smallFont || "12px monospace";
      var w = ctx.measureText(chips[i].label).width + 18;
      if (cx + w > F.x + F.w - 10) { cx = x; cy += 30; }
      var rect = { x: cx, y: cy, w: w, h: 24 };
      ctx.fillStyle = this._boxLayout().chipColor || "#18213a";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      this._strokeRect(rect, t.panelBorder || "#3a4266");
      this.panel.drawText(chips[i].label, rect.x + 9, rect.y + 16, { font: t.smallFont });
      this._boxHitRects.actions.push({ rect: rect, value: chips[i].value });
      cx += w + 8;
    }
  };

  /** 絞り込みの一覧（箱の上に重ねる） */
  PartyScene.prototype._renderBoxFilter = function (B) {
    var ctx = this.panel.ctx;
    var r = this.filterList.rect;
    ctx.save();
    ctx.fillStyle = "rgba(4,6,12,0.6)";
    ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    ctx.restore();
    // 見出しの帯（一覧の枠のすぐ上。下の箱の見出しと重ならないように地を塗る）
    this.panel.drawBox({ x: r.x, y: r.y - 30, w: r.w, h: 32 });
    this.panel.drawText(this.texts.boxFilterTitle || "", r.x + 12, r.y - 9, { color: this.theme.cursorColor });
    this.filterList.render(this.game.clock);
  };

  /** 枠線だけを描く（マス・札の縁、選んでいるものの印） */
  PartyScene.prototype._strokeRect = function (rect, color) {
    var ctx = this.panel.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
    ctx.restore();
  };

  PartyScene.prototype._renderTabs = function (L, t) {
    var pos = L.tabs || { x: L.title.x + 160, y: L.title.y, gap: 130 };
    var party = this.game.party;
    var storage = this.game.storage;

    var labels = [
      { id: "party",
        text: (this.texts.tabParty || "party") +
              " " + (party ? party.size() : 0) + "/" + (party ? party.maxSize : 0) }
    ];

    // 預かり所へ手が届かない場面（探索中）では、表そのものを出さない
    if (this.allowStorage) {
      labels.push({ id: "storage",
        text: (this.texts.tabStorage || "storage") +
              " " + (storage ? storage.size() : 0) + "/" + (storage ? storage.maxSize : 0) });
    }

    for (var i = 0; i < labels.length; i++) {
      var selected = (labels[i].id === this.tab);
      this.panel.drawText(labels[i].text, pos.x + pos.gap * i, pos.y,
        { font: t.smallFont, color: selected ? t.cursorColor : t.hintColor });
    }
  };

  PartyScene.prototype._renderHint = function (L, t) {
    // 一時的な知らせ（預けた・連れ出した）があればそれを優先して出す
    if (this._notice) {
      this.panel.drawText(this._notice, L.hint.x, L.hint.y,
        { color: t.cursorColor, font: t.smallFont });
      return;
    }

    var hint;
    if (this.mode === "equip") hint = (this.equipFocus === "items") ? this.texts.hintEquipItems : this.texts.hintEquipSlots;
    else if (this.mode === "inspect") {
      hint = fill(this.texts.hintInspect || "", {
        extra: (this.inspectPage === "skills" || this.inspectPage === "notes") ? this._paneScrollHint(this.inspectPane) : ""
      });
    }
    else if (this.mode === "affection") hint = this.texts.hintAffection;
    else if (this.mode === "action") hint = this.texts.hintAction;
    else if (this.mode === "release" || this.mode === "releaseMany") hint = this.texts.hintRelease;
    else if (this.mode === "boxSwap") hint = this.texts.hintBoxSwap;
    else if (this.mode === "boxFilter") hint = this.texts.hintBoxFilter;
    else if (this.mode === "fieldSkill") hint = this.texts.hintFieldSkill;
    else if (this.mode === "tactic") hint = this.texts.hintTactic;
    else if (this.mode === "fieldTarget") hint = this.texts.hintFieldTarget;
    else if (this.mode === "reorder") hint = this.texts.hintReorder;
    else if (this.boxView) hint = this.marking ? this.texts.hintBoxMark : this.texts.hintBox;
    // 探索中は表の切り替えが無いので、その案内を出さない
    else if (!this.allowStorage) hint = fill(this.texts.hintNoStorage || this.texts.hintNormal || "", { extra: this._paneScrollHint(this.pane) });
    else hint = fill(this.texts.hintNormal || "", { extra: this._paneScrollHint(this.pane) });

    this.panel.drawText(hint || "", L.hint.x, L.hint.y,
      { color: t.hintColor, font: t.smallFont });
  };

  /**
   * 一覧の1行を描く。
   * @param {number} i 一覧の中での番号
   * @param {number} [start] 画面に出している先頭の番号（描く位置の基準）
   */
  /**
   * 一覧の1行（1体ぶんの箱）。ScrollList から呼ばれる
   * @param {number} top 行の上端（スクロールのずれ込み）
   */
  PartyScene.prototype._renderRow = function (monster, i, top) {
    if (!monster) return;
    var L = this.layout;
    var t = this.theme;
    var rect = {
      x: L.list.x,
      y: top,
      w: L.list.w,
      h: L.list.h
    };

    this.panel.drawBox(rect);

    // カーソル・選択中の印
    if (i === this.index) {
      this.panel.drawText("▶", rect.x - 18, rect.y + 34, { color: t.cursorColor });
    }
    // 並び替えの移動元
    if (this.mode === "reorder" && this.tab === "party" && i === this.reorderFrom) {
      this.panel.drawText("◆", rect.x - 18, rect.y + 16, { color: t.cursorColor });
    }

    // スプライト。種族ごとの大きさ（sizeScale）を掛けたうえで、
    // 中心をそろえて描く（行の高さは変わらないので、はみ出しは上下に散る）
    var base = L.spriteSize;
    var size = Math.round(base * (monster.getSizeScale ? monster.getSizeScale() : 1));
    var sprite = monster.getSpriteId();
    this.sprites.drawMotion(sprite,
      rect.x + 8 - (size - base) / 2, rect.y + (rect.h - size) / 2, size, size,
      NS.Motion.forSprite(this.game.data, sprite, monster.getMotionId(),
        this.game.clock, monster.getMotionPhase()));

    // 文字の開始位置は元の大きさで決める（大きい相手でも行がずれないように）
    var textX = rect.x + base + 20;

    // 盤面に出る位置（先頭から battleFieldSize 体）に印をつける（パーティ側のみ）
    var fieldSize = this.game.data.config.battleFieldSize || 3;
    if (this.tab === "party" && i < fieldSize) {
      var divider = L.fieldDivider || {};
      this.panel.drawText(divider.label || "", rect.x + rect.w - 10, rect.y + 18,
        { align: "right", color: divider.color || t.cursorColor, font: t.smallFont });
    }

    var heading = monster.getName() + "  Lv" + monster.level;
    this.panel.drawText(heading, textX, rect.y + 22);

    // 掛かっている状態異常の印。戦闘中・ダンジョンの左上と同じ絵
    this.panel.ctx.font = t.font || "14px monospace";
    NS.StatusMarks.draw(this.panel, NS.StatusMarks.defsOf(monster),
      textX + this.panel.ctx.measureText(heading).width + 8, rect.y + 22,
      { maxX: rect.x + rect.w - 46, sprites: this.sprites, data: this.game.data });   // 右上の「出撃」の手前で止める

    // HPバーと数値（戦闘不能なら表示を変える）
    var barWidth = L.hpBarWidth || (rect.w - size - 40);
    this.hpBar.draw(textX, rect.y + 32, barWidth, 8, monster.currentHp, monster.getMaxHp());
    var hpText = monster.isFainted()
      ? (this.texts.fainted || "fainted")
      : monster.currentHp + "/" + monster.getMaxHp();
    this.panel.drawText(hpText, textX, rect.y + 52,
      { color: monster.isFainted() ? t.hpBarLow : t.subTextColor, font: t.smallFont });
  };

  /**
   * 選択中の個体の詳細を描く（v1.4.0 から共通の部品 NS.DetailPane。入りきらなければバー・Q/E・ホイールで送る）
   * @param {object} [box] 枠（省略時は一覧の右の欄 layout.detail。預かり所の画面は layout.box.detail）
   */
  PartyScene.prototype._renderDetail = function (monster, box) {
    if (!monster) return;
    var pane = (box && box !== this.layout.detail) ? this.boxPane : this.pane;
    pane.setContent(this._buildMonsterDetail(monster, pane.rect), monster);
    pane.render("");
  };

  /** 性格の札（「攻撃↑」「防御↓」。補正が無ければ「補正なし」）。図鑑の性格のページと同じ書き方 */
  PartyScene.prototype._natureChips = function (nature) {
    var t = this.theme;
    var dex = (this.game.data.messages || {}).dex || {};
    var up = t.hpBarHigh || "#5fd18c", down = t.hpBarLow || "#e8542a";
    var chips = [];
    var stats = this._natureStats();
    for (var i = 0; i < stats.length && nature; i++) {
      var value = (nature[stats[i].key] === undefined) ? 1 : nature[stats[i].key];
      if (value > 1) chips.push({ label: fill(dex.natureUp || "{stat}↑", { stat: stats[i].label }), color: up });
      if (value < 1) chips.push({ label: fill(dex.natureDown || "{stat}↓", { stat: stats[i].label }), color: down });
    }
    if (chips.length === 0) chips.push({ label: dex.natureFlat || "補正なし", color: t.subTextColor });
    return chips;
  };

  /** 性格が掛かる能力（data/natures.js のキー） */
  PartyScene.prototype._natureStats = function () {
    return [
      { key: "hp", label: "HP" },
      { key: "attack", label: this.texts.attackLabel || "攻撃" },
      { key: "defense", label: this.texts.defenseLabel || "防御" },
      { key: "speed", label: this.texts.speedLabel || "素早さ" }
    ];
  };

  /**
   * 一覧（と預かり所）の右の欄の中身 { head, lines }。
   * 上の欄：動く絵・名前・性格の札・「Lv20/99　素直」。
   * その下：状態異常 → 能力（装備で変わったぶんは「(+2)」）→ 技（属性の絵・消費PP）→ 特性（説明つき）→ 装備 → 耐性2つ
   */
  PartyScene.prototype._buildMonsterDetail = function (monster, rect) {
    var t = this.theme;
    var texts = this.texts;
    var data = this.game.data;
    var self = this;
    var lines = [];
    var i;
    var ctx = this.panel.ctx;
    var maxWidth = rect.w - 24 - (t.padding || 8) - 26;   // 行末に「）。」を寄せても入るよう、2文字ぶん空ける
    var up = t.hpBarHigh || "#5fd18c", down = t.hpBarLow || "#e8542a";
    function blank() { lines.push({}); }

    var nature = monster.getNature();
    var spriteId = monster.getSpriteId();
    var head = {
      name: monster.getName(),
      chips: this._natureChips(nature),
      sub: fill(texts.levelWithMax || "Lv{level}/{max}", {
        level: monster.level, max: monster.getMaxLevel ? monster.getMaxLevel() : monster.level
      }) + "　" + (nature ? nature.name : "-"),
      drawPicture: function (x, y, size) {
        self.sprites.drawMotion(spriteId, x, y, size, size,
          NS.Motion.forSprite(data, spriteId, monster.getMotionId(), self.game.clock, monster.getMotionPhase()));
      }
    };

    // 掛かっている状態異常（3つずつ並べる）
    var defs = NS.StatusMarks.defsOf(monster);
    for (i = 0; i < defs.length; i += 3) {
      lines.push({ cols: defs.slice(i, i + 3).map(function (d) {
        return { icon: d.icon || null, text: d.name, color: d.color || down };
      }) });
    }
    if (monster.isFainted()) lines.push({ text: texts.fainted || "", color: down });

    // 能力
    var bare = this._statsWithout(monster);
    function stat(label, text, value, baseValue) {
      var diff = value - baseValue;
      lines.push({ text: label, right: text + (diff ? " (" + (diff > 0 ? "+" : "") + diff + ")" : ""),
                   rightColor: diff > 0 ? up : diff < 0 ? down : t.textColor });
    }
    stat("HP", monster.currentHp + "/" + monster.getMaxHp(), monster.getMaxHp(), bare.hp);
    stat("PP", monster.currentPp + "/" + monster.getMaxPp(), monster.getMaxPp(), bare.pp);
    stat(texts.attackLabel || "攻撃", String(monster.getAttack()), monster.getAttack(), bare.attack);
    stat(texts.defenseLabel || "防御", String(monster.getDefense()), monster.getDefense(), bare.defense);
    stat(texts.speedLabel || "素早さ", String(monster.getSpeed()), monster.getSpeed(), bare.speed);
    lines.push({ text: this._nextExpText(monster), dim: true });

    // 技（属性の絵・名前・消費PP）
    blank();
    lines.push({ heading: true, text: fill(texts.skillCount || "{label} {n}", { label: texts.skillLabel || "", n: monster.skills.length }) });
    for (i = 0; i < monster.skills.length; i++) {
      var skill = data.getSkill(monster.skills[i]);
      if (!skill) continue;
      var element = (data.elements || {})[skill.element] || {};
      lines.push({ icon: element.icon || null, indent: element.icon ? 0 : 22, text: skill.name,
                   right: "PP" + (monster.getSkillPpCost ? monster.getSkillPpCost(skill) : (skill.pp || 0)), rightColor: t.hintColor });
    }

    // 特性（名前と説明）
    var abilities = this._getAbilities(monster);
    if (abilities.length > 0) {
      blank();
      lines.push({ heading: true, text: texts.abilityLabel || "" });
      for (i = 0; i < abilities.length; i++) {
        lines.push({ text: "・" + abilities[i].name, color: t.textColor });
        var desc = wrapByWidth(ctx, abilities[i].description || "", maxWidth - 12, t.smallFont);
        for (var d = 0; d < desc.length; d++) lines.push({ indent: 12, text: desc[d], dim: true });
      }
    }

    // 装備（枠ごと。空いている枠も出す）
    blank();
    lines.push({ heading: true, text: texts.equipLabel || "" });
    var slotLines = this._equipSlotLines(monster);
    for (i = 0; i < slotLines.length; i++) {
      var worn = slotLines[i].itemId ? data.getItem(slotLines[i].itemId) : null;
      lines.push({ icon: worn ? worn.icon : null, indent: worn ? 0 : 22, text: slotLines[i].text,
                   color: slotLines[i].empty ? t.hintColor : t.textColor });
    }

    // 耐性（2列）。強いところは青、弱いところは赤
    function resist(label, rows) {
      if (!rows.length) return;
      blank();
      lines.push({ heading: true, text: label || "" });
      for (var r = 0; r < rows.length; r += 2) {
        lines.push({ cols: rows.slice(r, r + 2).map(function (row) {
          return { icon: row.icon, text: row.name + " " + (row.value > 0 ? "+" : "") + row.value,
                   color: row.value > 0 ? (t.hpBarFull || "#4fb0d1") : row.value < 0 ? down : t.hintColor };
        }) });
      }
    }
    if (monster.getResistance) resist(texts.resistanceLabel, this._elementRows(monster));
    resist(texts.statusResistLabel, this._statusRows(monster));

    return { head: head, lines: lines };
  };

  /** 仲間の画面の一覧・預かり所の右の欄（入りきらないとき Q/E で送れる。案内の {extra}） */
  PartyScene.prototype._paneScrollHint = function (pane) {
    return (pane && pane.canScroll()) ? (this.texts.hintScroll || "") : "";
  };

  /**
   * 装備を枠ごとに1行ずつ。「武器：灼牙の戦刃」「防具：-」のように、
   * 空いている枠も出す（何が着けられるかが一目で分かるように）。
   * @returns {Array<{text:string, empty:boolean}>}
   */
  PartyScene.prototype._equipSlotLines = function (monster) {
    var data = this.game.data;
    var empty = this.texts.slotEmpty || "-";
    var slots = (data.config || {}).equipSlots || [];
    var equipped = (monster.equipment || []).slice();
    var lines = [];

    for (var s = 0; s < slots.length; s++) {
      var label = NS.EffectSystem.slotNameOf(slots[s], data) + "：";
      var found = -1;
      for (var i = 0; i < equipped.length; i++) {
        var item = data.getItem(equipped[i]);
        if (item && item.equip && NS.EffectSystem.slotOf(item) === slots[s]) { found = i; break; }
      }
      if (found >= 0) {
        var worn = data.getItem(equipped[found]);
        lines.push({ text: label + worn.name, empty: false, itemId: worn.id });
        equipped.splice(found, 1);   // 同じ種類の2つ目の枠には次のものが入る
      } else {
        lines.push({ text: label + empty, empty: true });
      }
    }
    return lines;
  };

  /**
   * 「様子を見る」の画面。眺めるだけで、何も変えない。
   *
   * 左に絵（一覧の48pxではなく大きく出す。動きもそのまま）、
   * 中央にステータスと装備、右に耐性を2種類ならべる。
   *
   * ★ 状態異常の耐性を出せるのはここだけ。
   *   一覧の詳細欄には属性耐性までしか入らなかった。
   */
  PartyScene.prototype._renderInspect = function (monster) {
    if (!monster) return;

    var t = this.theme;
    var L = this.layout.inspect || {};
    var rect = L.box || { x: 32, y: 48, w: 736, h: 470 };
    this.panel.drawBox(rect);

    // --- 左：絵と名前 ---
    var sp = L.sprite || { x: 128, y: 170, size: 128 };
    var base = sp.size || 128;
    var size = Math.round(base * (monster.getSizeScale ? monster.getSizeScale() : 1));
    var spriteId = monster.getSpriteId();

    this.sprites.drawMotion(spriteId,
      sp.x - size / 2, sp.y - size / 2, size, size,
      NS.Motion.forSprite(this.game.data, spriteId, monster.getMotionId(),
        this.game.clock, monster.getMotionPhase()));

    this.panel.drawText(monster.getName(), sp.x, (L.name || {}).y || 268,
      { align: "center", font: t.largeFont });

    // 「Lv45/99　勇敢」。/ の後ろはレベル上限（どこまで育つか）
    var nature = monster.getNature();
    var levelText = fill(this.texts.levelWithMax || "Lv{level}/{max}", {
      level: monster.level,
      max: monster.getMaxLevel ? monster.getMaxLevel() : monster.level
    });
    this.panel.drawText(levelText + "　" + (nature ? nature.name : "-"),
      sp.x, ((L.name || {}).y || 268) + 24,
      { align: "center", font: t.smallFont, color: t.subTextColor });
    this._renderAffection(monster, sp.x, ((L.name || {}).y || 268) + 42);

    // 左の下：特性（技は数が多いとはみ出すので「技・特性」のページへ）
    this._renderInspectAbilities(monster, L.left || { x: 64, y: 316, lineHeight: 20 });

    // 左上：ページの札（ステータス ／ 技・特性 ／ モンスター説明）
    this._renderInspectTabs(rect, L.tabs || {});

    // 技・特性のページ：右側に覚えている技の一覧と、特性の説明
    if (this.inspectPage === "skills") {
      this._renderInspectSkillPage(monster, rect, L.skills || {});
      return;
    }

    // モンスター説明のページ：右側に図鑑と同じ説明と、愛情度の記録を出す
    if (this.inspectPage === "notes") {
      this._renderInspectNotes(monster, rect, L.notes || {});
      return;
    }

    // --- 中央：ステータス・装備・装備の効果 ---
    var mid = L.stats || { x: 268, y: 96, lineHeight: 22 };
    var natureY = this._renderInspectStats(monster, mid);
    var NL = L.nature || {};
    this._renderInspectNature(monster, { x: mid.x, y: natureY + (NL.gap === undefined ? 10 : NL.gap),
      lineHeight: NL.lineHeight, font: NL.font || mid.font, barX: NL.barX, barW: NL.barW });

    // --- 右：耐性2種 → その下に効果 ---
    var right = L.resist || { x: 502, y: 96, lineHeight: 22, colWidth: 126 };
    var y = this._renderResistTable(monster, right,
      this.texts.resistanceLabel, this._elementRows(monster));
    y = this._renderResistTable(monster, { x: right.x, y: y + 10,
      lineHeight: right.lineHeight, colWidth: right.colWidth,
      font: right.font, iconSize: right.iconSize },
      this.texts.statusResistLabel, this._statusRows(monster));

    var fx = L.effects || {};
    this._renderEffectList(monster, {
      x: right.x, y: y + (fx.gap === undefined ? 10 : fx.gap),
      lineHeight: fx.lineHeight || 18,
      font: fx.font || right.font, fromFont: fx.fromFont,
      // 枠の内側まで。ここを越えるなら出どころの表記を省く
      maxX: rect.x + rect.w - (t.padding || 10)
    });
  };

  /**
   * 様子を見る：左上のページの札。いまのページは明るく、もう一方は薄く出す。
   * 押すとそのページへ移る（当たり判定は _inspectTabRects に残す）
   */
  PartyScene.prototype._renderInspectTabs = function (box, T) {
    var t = this.theme;
    var ctx = this.panel.ctx;
    var labels = {
      stats: this.texts.inspectPageStats || "stats",
      skills: this.texts.inspectPageSkills || "skills",
      notes: this.texts.inspectPageNotes || "notes"
    };
    var pages = [];
    for (var p = 0; p < INSPECT_PAGES.length; p++) {
      pages.push({ page: INSPECT_PAGES[p], label: labels[INSPECT_PAGES[p]] });
    }
    var x = box.x + (T.x === undefined ? 16 : T.x);
    var y = box.y + (T.y === undefined ? 22 : T.y);
    var gap = T.gap === undefined ? 18 : T.gap;
    var font = T.font || t.font;

    this._inspectTabRects = [];
    for (var i = 0; i < pages.length; i++) {
      var active = ((this.inspectPage || "stats") === pages[i].page);
      ctx.font = font;
      var w = ctx.measureText(pages[i].label).width;
      this.panel.drawText(pages[i].label, x, y,
        { font: font, color: active ? t.cursorColor : t.hintColor });
      if (active) {
        ctx.save();
        ctx.fillStyle = t.cursorColor || "#ffd75e";
        ctx.fillRect(x, y + 4, w, 2);   // いまのページに下線
        ctx.restore();
      }
      this._inspectTabRects.push({ page: pages[i].page, rect: { x: x - 4, y: y - 16, w: w + 8, h: 24 } });
      x += w + gap;
    }
  };

  /** 幅に収まるよう、1文字ずつ測って折り返す（日本語は単語の区切りが無いため） */
  /** 「次のLvまで 123」。レベル上限に届いていたら「レベル上限」 */
  PartyScene.prototype._nextExpText = function (monster) {
    if (monster.getMaxLevel && monster.level >= monster.getMaxLevel()) {
      return this.texts.expMaxLevel || "MAX";
    }
    var needed = Math.max(0, monster.getExpToNextLevel() - monster.exp);
    return (this.texts.expLabel || "next") + " " + formatNumber(needed);
  };

  /** 3桁ごとに「,」を入れる（累計経験値は100万を超える） */
  function formatNumber(n) {
    return String(Math.floor(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function wrapByWidth(ctx, text, maxWidth, font) {
    ctx.save();
    ctx.font = font;
    var lines = [];
    var line = "";
    // MyGame.wrapText と同じ決まり：句読点は幅を超えても前の行に残す（行の頭に「。」を置かない）。
    // 言葉の途中では切らず、行の中のいちばん後ろの切れ目（MyGame.canBreakBetween）まで戻って切る
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var next = line + ch;
      var hang = NS.NO_LINE_START.indexOf(ch) >= 0;
      if (line && !hang && ctx.measureText(next).width > maxWidth) {
        var cut = -1;
        for (var b = line.length; b >= Math.ceil(line.length / 3); b--) {
          var after = b < line.length ? line.charAt(b) : ch;
          if (NS.canBreakBetween(line.charAt(b - 1), after)) { cut = b; break; }
        }
        if (cut < 0) cut = line.length;   // 切れ目が無い（長い漢字の並びなど）：幅で切る
        lines.push(line.slice(0, cut));
        line = line.slice(cut) + ch;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    ctx.restore();
    return lines;
  }

  /**
   * 様子を見る：名前の下の愛情度。「愛情度 慣れ（32/60）」の形で、次の段階までの数を出す。
   * いちばん上の段階では、合計の数だけ出す
   */
  PartyScene.prototype._renderAffection = function (monster, x, y) {
    this._affectionRect = null;
    if (!monster.getAffectionStage) return;
    var stage = monster.getAffectionStage();
    if (!stage) return;
    var next = monster.getNextAffectionStage();
    var count = next ? (monster.affection + "/" + next.need) : String(monster.affection);
    var text = (this.texts.affectionLabel || "愛情度 {stage}（{count}）")
      .replace("{stage}", stage.name).replace("{count}", count);

    // 押せることが分かるよう、枠で囲んだ札にする。カーソルが乗ると枠が光る
    var t = this.theme;
    var ctx = this.panel.ctx;
    ctx.font = t.smallFont || "12px monospace";
    var w = ctx.measureText(text).width + 16;
    var rect = { x: Math.round(x - w / 2), y: y - 13, w: Math.round(w), h: 19 };
    var pointer = this.game.input.getPointer ? this.game.input.getPointer() : null;
    var hovered = pointer && pointer.inside && NS.Panel.containsPoint(rect, pointer);

    ctx.save();
    ctx.strokeStyle = hovered ? (t.cursorColor || "#ffd75e") : (t.panelBorder || "#3a4560");
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
    ctx.restore();
    this.panel.drawText(text, x, y, { align: "center", font: t.smallFont, color: t.cursorColor });
    this._affectionRect = rect;
  };

  /** 段階ごとの報酬の文（「全能力 +3%」など）。伏せるときは「？？？」 */
  PartyScene.prototype._affectionRewardText = function (monster, stages, i) {
    var stage = stages[i];
    var config = this.game.data.affection || {};
    var parts = [];

    if (stage.statBonus) {
      var total = 0;
      for (var k = 0; k <= i; k++) total += stages[k].statBonus || 0;
      var text = (this.texts.affectionStatReward || "全能力 +{value}%")
        .replace("{value}", Math.round(stage.statBonus * 100));
      // 前の段階のぶんに足していくので、合わせた値も添える
      if (total > stage.statBonus) {
        text += (this.texts.affectionStatTotal || "（合わせて +{value}%）")
          .replace("{value}", Math.round(total * 100));
      }
      parts.push(text);
    }

    if (stage.bondReward) {
      var reached = monster.getAffectionStageIndex() >= i;
      if (config.hideBondRewardUntilReached && !reached) {
        parts.push(this.texts.affectionHidden || "？？？");
      } else {
        var reward = monster.getBondReward ? monster.getBondReward() : null;
        var described = this._bondRewardText(reward);
        parts.push(described || this.texts.affectionNoReward || "―");
      }
    }
    return parts.length > 0 ? parts.join("・") : "―";
  };

  /** 種族ごとの報酬（data/monsters.js の bondReward）を文にする */
  PartyScene.prototype._bondRewardText = function (reward) {
    if (!reward) return "";
    var gameData = this.game.data;
    var parts = [];
    if (reward.skill) {
      var skill = gameData.getSkill(reward.skill);
      parts.push((this.texts.affectionSkillReward || "「{skill}」を覚える")
        .replace("{skill}", skill ? skill.name : reward.skill));
    }
    for (var i = 0; i < (reward.effects || []).length; i++) {
      var text = NS.EffectSystem.describeEffect(reward.effects[i], gameData);
      if (text) parts.push(text);
    }
    return parts.join("・");
  };

  /**
   * 愛情度の詳細。「様子を見る」の上に重ねる窓。
   *   いまの段階と、次の段階までの残り（棒で見せる）
   *   段階の一覧（必要な回数・報酬。届いた段階には印）
   *   深まり方の説明
   * 配置は data/ui.js の party.affectionDetail、文言は data/messages.js の party
   */
  PartyScene.prototype._renderAffectionDetail = function (monster) {
    if (!monster || !monster.getAffectionStage) return;
    var t = this.theme;
    var A = this.layout.affectionDetail || {};
    var box = A.box || { x: 150, y: 96, w: 500, h: 380 };
    var ctx = this.panel.ctx;
    var stages = (this.game.data.affection || {}).stages || [];
    var current = monster.getAffectionStageIndex();
    var stage = stages[current];
    var next = stages[current + 1] || null;

    // 後ろの「様子を見る」を暗くして、窓を浮かせる
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    ctx.restore();
    this.panel.drawBox(box);

    var x = box.x + (A.padX || 24);
    var y = box.y + (A.padTop || 36);

    this.panel.drawText((this.texts.affectionTitle || "{name} との関係").replace("{name}", monster.getName()),
      x, y, { font: t.largeFont });
    y += A.titleGap || 32;

    // いまの段階と、次まで
    this.panel.drawText((this.texts.affectionNow || "いまの段階：{stage}（{count}回）")
      .replace("{stage}", stage ? stage.name : "-").replace("{count}", monster.affection),
      x, y, { color: t.cursorColor });
    y += 22;

    var barW = box.w - (A.padX || 24) * 2;
    var from = stage ? (stage.need || 0) : 0;
    var ratio = next ? Math.max(0, Math.min(1, (monster.affection - from) / ((next.need || 1) - from))) : 1;
    ctx.save();
    ctx.fillStyle = t.hpBarBack || "#1a2033";
    ctx.fillRect(x, y - 8, barW, 8);
    ctx.fillStyle = A.barColor || t.cursorColor || "#ffd75e";
    ctx.fillRect(x, y - 8, Math.round(barW * ratio), 8);
    ctx.restore();
    y += 18;

    var remain = next
      ? (this.texts.affectionNext || "次の「{stage}」まで あと {n} 回").replace("{stage}", next.name)
          .replace("{n}", Math.max(0, (next.need || 0) - monster.affection))
      : (this.texts.affectionMax || "いちばん深い段階に届いている");
    this.panel.drawText(remain, x, y, { font: t.smallFont, color: t.subTextColor });
    y += A.sectionGap || 30;

    // 段階の一覧
    var colNeed = A.colNeed || 110;
    var colReward = A.colReward || 180;
    for (var i = 0; i < stages.length; i++) {
      var reached = i <= current;
      var mark = (i === current) ? "▶" : (reached ? "✓" : "・");
      var color = reached ? t.textColor : t.hintColor;
      this.panel.drawText(mark + " " + stages[i].name, x, y, { color: i === current ? t.cursorColor : color });
      this.panel.drawText((this.texts.affectionNeed || "{n}回").replace("{n}", stages[i].need || 0),
        x + colNeed, y, { color: color });
      this.panel.drawText(this._affectionRewardText(monster, stages, i), x + colReward, y,
        { font: t.smallFont, color: color });
      y += A.rowHeight || 26;
    }
    y += 10;

    // 深まり方
    var notes = this.texts.affectionNotes || [];
    for (var n = 0; n < notes.length; n++) {
      this.panel.drawText(notes[n], x, y, { font: t.smallFont, color: t.subTextColor });
      y += 18;
    }
  };

  /** 様子を見る：左の下の、特性と技の数（技の中身は「技・特性」のページ） */
  PartyScene.prototype._renderInspectAbilities = function (monster, pos) {
    var t = this.theme;
    var lh = pos.lineHeight || 20;
    var x = pos.x, y = pos.y;

    var abilities = this._getAbilities(monster);
    if (abilities.length > 0) {
      this.panel.drawText(this.texts.abilityLabel || "", x, y, { font: t.smallFont });
      y += lh;
      for (var i = 0; i < abilities.length; i++) {
        this.panel.drawText("・" + abilities[i].name, x, y, { font: t.smallFont, color: t.subTextColor });
        y += lh;
      }
      y += 6;
    }

    this.panel.drawText(fill(this.texts.skillCount || "{label} {n}", {
      label: this.texts.skillLabel || "", n: monster.skills.length
    }), x, y, { font: t.smallFont });
  };

  /**
   * 様子を見る：技・特性のページ（v1.4.0 から DetailPane。入りきらなければバー・Q/E・ホイールで送る）。
   * 技ごとに：属性の絵・名前・威力／命中／PP（戦闘の技の欄と同じ数字）、その下に属性・種類と説明。
   * その下に特性の名前と説明。配置は data/ui.js の party.inspect.pane
   */
  PartyScene.prototype._renderInspectSkillPage = function (monster) {
    this.inspectPane.setContent(this._buildInspectSkills(monster), "skills:" + this.index);
    this.inspectPane.render("");
  };

  PartyScene.prototype._buildInspectSkills = function (monster) {
    var t = this.theme;
    var data = this.game.data;
    var texts = this.texts;
    var battleTexts = (data.messages || {}).battleUi || {};
    var rect = this.inspectPane.rect;
    var font = rect.font || t.font;
    var ctx = this.panel.ctx;
    var maxWidth = rect.w - 24 - (t.padding || 8) - 26;   // 行末に「）。」を寄せても入るよう、2文字ぶん空ける
    var defaultAccuracy = (data.battle || {}).defaultAccuracy || 1;
    var lines = [];
    var i, d;

    lines.push({ heading: true, font: font, text: fill(texts.skillCount || "{label} {n}", { label: texts.skillLabel || "", n: monster.skills.length }) });
    for (i = 0; i < monster.skills.length; i++) {
      var skill = data.getSkill(monster.skills[i]);
      if (!skill) continue;
      var element = (data.elements || {})[skill.element] || {};
      var accuracy = (skill.accuracy === undefined) ? defaultAccuracy : skill.accuracy;
      var template = NS.BattleSystem.dealsDamage(skill)
        ? battleTexts.skillStats : (battleTexts.skillStatsNoPower || battleTexts.skillStats);
      if (i > 0) lines.push({});
      lines.push({ icon: element.icon || null, indent: element.icon ? 0 : 22, text: skill.name, font: font, color: t.textColor,
                   right: fill(template || "", {
                     power: data.formatSkillPower(skill), accuracy: Math.round(accuracy * 100),
                     pp: monster.getSkillPpCost ? monster.getSkillPpCost(skill) : (skill.pp || 0)
                   }), rightColor: t.subTextColor });
      // 属性（1つずつ、その属性の色。混合属性は「火」「地」と分ける）と種類（種類の色）
      var kind = data.getSkillKind ? data.getSkillKind(skill) : null;
      var parts = data.getSkillElements(skill).map(function (el) { return { text: el.name, color: el.color }; });
      if (kind) parts.push({ text: kind.name, color: kind.color });
      if (parts.length) lines.push({ indent: 22, parts: parts });
      var desc = wrapByWidth(ctx, skill.description || "", maxWidth - 22, t.smallFont);
      for (d = 0; d < desc.length; d++) lines.push({ indent: 22, text: desc[d], dim: true });
    }

    var abilities = this._getAbilities(monster);
    if (abilities.length > 0) {
      lines.push({});
      lines.push({});
      lines.push({ heading: true, font: font, text: texts.abilityLabel || "" });
      for (i = 0; i < abilities.length; i++) {
        lines.push({ text: "・" + abilities[i].name, font: font, color: t.textColor });
        var adesc = wrapByWidth(ctx, abilities[i].description || "", maxWidth - 14, t.smallFont);
        for (d = 0; d < adesc.length; d++) lines.push({ indent: 14, text: adesc[d] });
      }
    }
    return { lines: lines };
  };

  /**
   * 様子を見る：モンスター説明のページ（v1.4.0 から DetailPane。記録が増えても送って読める）。
   * 図鑑と同じ説明文と、その種族で読めるようになった愛情度の記録（DexScene.recordEntries）
   */
  PartyScene.prototype._renderInspectNotes = function (monster) {
    this.inspectPane.setContent(this._buildInspectNotes(monster), "notes:" + this.index);
    this.inspectPane.render("");
  };

  PartyScene.prototype._buildInspectNotes = function (monster) {
    var t = this.theme;
    var rect = this.inspectPane.rect;
    var font = rect.font || t.font;
    var ctx = this.panel.ctx;
    var maxWidth = rect.w - 24 - (t.padding || 8) - 26;   // 行末に「）。」を寄せても入るよう、2文字ぶん空ける
    var lines = [];
    function push(text, line) {
      var wrapped = wrapByWidth(ctx, text || "", maxWidth, font);
      for (var w = 0; w < wrapped.length; w++) {
        var row = { text: wrapped[w], font: font };
        for (var k in line) if (Object.prototype.hasOwnProperty.call(line, k)) row[k] = line[k];
        lines.push(row);
      }
    }

    var species = monster.getSpecies ? monster.getSpecies() : null;
    push((species && species.description) || "", { color: t.textColor });
    var entries = NS.DexScene ? NS.DexScene.recordEntries(this.game, monster.speciesId) : [];
    for (var i = 0; i < entries.length; i++) {
      lines.push({});
      push(entries[i].label, { heading: true });
      push(entries[i].text, { color: t.textColor });
    }
    // まだ記録が1つも無いときは、深まれば書き足されることだけ知らせる
    if (entries.length === 0 && this.texts.notesNoRecords) {
      lines.push({});
      push(this.texts.notesNoRecords, { dim: true });
    }
    return { lines: lines };
  };

  /**
   * 様子を見る：ステータスのページの、性格の棒（v1.4.0）。
   * ×1.0 を真ん中にして、上がる能力は右へ緑、下がる能力は左へ赤（図鑑の性格のページと同じ）
   * @returns {number} 描き終えたあとのy
   */
  PartyScene.prototype._renderInspectNature = function (monster, pos) {
    var t = this.theme;
    var N = pos;
    var nature = monster.getNature();
    if (!nature) return pos.y;
    var font = N.font || t.font;
    var lh = N.lineHeight || 20;
    var x = N.x, y = N.y;
    var barX = x + (N.barX || 64), barW = N.barW || 120, mid = barX + barW / 2;
    var up = t.hpBarHigh || "#5fd18c", down = t.hpBarLow || "#e8542a";
    var ctx = this.panel.ctx;

    this.panel.drawText(fill(this.texts.natureHeading || "{label}　{name}", { label: this.texts.natureLabel || "", name: nature.name }),
      x, y, { font: font });
    y += lh;
    var stats = this._natureStats();
    for (var i = 0; i < stats.length; i++) {
      var value = (nature[stats[i].key] === undefined) ? 1 : nature[stats[i].key];
      var color = value > 1 ? up : value < 1 ? down : t.hintColor;
      this.panel.drawText(stats[i].label, x, y, { font: t.smallFont, color: t.subTextColor });
      ctx.save();
      ctx.fillStyle = t.hpBarBg || "#2a3350";
      ctx.fillRect(barX, y - 9, barW, 8);
      var span = Math.max(-1, Math.min(1, (value - 1) / 0.2));
      ctx.fillStyle = color;
      if (span > 0) ctx.fillRect(mid, y - 9, Math.round(barW / 2 * span), 8);
      else if (span < 0) ctx.fillRect(mid + Math.round(barW / 2 * span), y - 9, Math.round(-barW / 2 * span), 8);
      ctx.fillStyle = t.textColor;
      ctx.fillRect(mid, y - 11, 1, 12);
      ctx.restore();
      var text = "×" + (Math.round(value * 100) % 10 === 0 ? value.toFixed(1) : value.toFixed(2));
      this.panel.drawText(text, barX + barW + 8, y, { font: t.smallFont, color: color });
      y += lh;
    }
    return y;
  };

  /**
   * 様子を見る：中央のステータス欄。
   * 装備で上がった（下がった）ぶんは、値の隣に「(+8)」「(-2)」と出す。
   * 装備を外した状態と比べているので、特性・加護のぶんは含まない（装備の効き目だけが見える）。
   */
  PartyScene.prototype._renderInspectStats = function (monster, pos) {
    var t = this.theme;
    var lh = pos.lineHeight || 22;
    var font = pos.font || t.font;
    var x = pos.x, y = pos.y;
    var i;
    var self = this;

    var bare = this._statsWithout(monster);   // 装備なしのときの値

    function statLine(text, value, baseValue) {
      self.panel.drawText(text, x, y, { font: font, color: t.subTextColor });
      var diff = value - baseValue;
      if (diff !== 0) {
        self.panel.ctx.font = font;
        var w = self.panel.ctx.measureText(text).width;
        self.panel.drawText("(" + (diff > 0 ? "+" : "") + diff + ")", x + w + 6, y,
          { font: t.smallFont, color: diff > 0 ? (t.hpBarHigh || "#5fd18c") : (t.hpBarLow || "#e8542a") });
      }
      y += lh;
    }

    statLine("HP " + monster.currentHp + "/" + monster.getMaxHp(), monster.getMaxHp(), bare.hp);
    statLine("PP " + monster.currentPp + "/" + monster.getMaxPp(), monster.getMaxPp(), bare.pp);
    statLine((this.texts.attackLabel || "攻撃") + " " + monster.getAttack(), monster.getAttack(), bare.attack);
    statLine((this.texts.defenseLabel || "防御") + " " + monster.getDefense(), monster.getDefense(), bare.defense);
    statLine((this.texts.speedLabel || "素早さ") + " " + monster.getSpeed(), monster.getSpeed(), bare.speed);
    this.panel.drawText(this._nextExpText(monster), x, y, { font: font, color: t.subTextColor });
    y += lh;
    // これまでに得た経験値の合計。レベル上限まで育てたあとも増え続ける
    this.panel.drawText((this.texts.totalExpLabel || "累計") + " " + formatNumber(monster.getTotalExp()),
      x, y, { font: font, color: t.subTextColor });
    y += lh + 6;

    // 装備（枠ごと）。名前だけを並べる。
    // 効果は1つずつ書かず、特性のぶんとまとめて右下の「効果」欄に出す
    // （装備の下に並べると、4枠ぶんで欄が窮屈になっていた）
    this.panel.drawText(this.texts.equipLabel || "", x, y, { font: font });
    y += lh;
    var slotLines = this._equipSlotLines(monster);
    for (i = 0; i < slotLines.length; i++) {
      this.panel.drawText("・" + slotLines[i].text, x, y,
        { font: font, color: slotLines[i].empty ? t.hintColor : t.textColor });
      y += lh;
    }
    return y;
  };

  /**
   * 特性と装備から得ている効果を、ひとまとめにして並べる。
   *
   * ★ ステータスの加算（攻撃+3 など）と耐性の加算は入れない。
   *   その2つは、すでに数値の隣に「(+15)」「(+5)」として出ている。
   *   ここに並べると同じことを二度書くことになり、欄だけが伸びる。
   *   出すのは**他では見えない効果**（倍率・与ダメージ・被ダメージ）だけ。
   *
   * @returns {{text:string, from:string}[]}
   */
  PartyScene.prototype._effectLines = function (monster) {
    var gameData = this.game.data;
    var lines = [];
    var i, j;

    function push(effects, from) {
      for (var k = 0; k < (effects || []).length; k++) {
        var effect = effects[k];
        // 加算は数値の隣に出ているので、ここでは繰り返さない
        if (effect.type === "statBonus" || effect.type === "resistBonus") continue;
        var text = NS.EffectSystem.describeEffect(effect, gameData);
        if (text) lines.push({ text: text, from: from });
      }
    }

    var abilities = this._getAbilities(monster);
    for (i = 0; i < abilities.length; i++) push(abilities[i].effects, abilities[i].name);

    var equipment = monster.equipment || [];
    for (j = 0; j < equipment.length; j++) {
      var item = gameData.getItem(equipment[j]);
      if (item) push((item.equip || {}).effects, item.name);
    }

    // 愛情度の上がり。全能力に同じだけ掛かるので、1行にまとめる
    var bonus = monster.getAffectionBonus ? monster.getAffectionBonus() : 0;
    if (bonus > 0) {
      var stage = monster.getAffectionStage();
      lines.push({
        text: (this.texts.affectionEffect || "全能力 ×{value}").replace("{value}", String(Math.round((1 + bonus) * 100) / 100)),
        from: stage ? stage.name : ""
      });
    }

    // 絆の報酬の能力・耐性。装備と違って外せないので、数値の隣の「(+5)」には出ない。
    // ここでは加算も含めて全部並べる
    if (monster.hasReachedBondReward && monster.hasReachedBondReward()) {
      var reward = monster.getBondReward();
      var bondName = (((gameData.affection || {}).stages || []).filter(function (s) { return s.bondReward; })[0] || {}).name || "";
      for (var b = 0; b < ((reward && reward.effects) || []).length; b++) {
        var bondText = NS.EffectSystem.describeEffect(reward.effects[b], gameData);
        if (bondText) lines.push({ text: bondText, from: bondName });
      }
    }
    return lines;
  };

  /**
   * 様子を見る：右下の「効果」欄。特性と装備でいま効いているものを並べる。
   *
   * 1行が「素早さ ×1.1（深淵の牙）」の形。どこから来ている効果かが分かると、
   * 装備を外すか迷ったときに判断できる。
   * 何も無いときは見出しごと出さない（空の見出しだけ残ると、壊れて見える）。
   */
  PartyScene.prototype._renderEffectList = function (monster, pos) {
    var t = this.theme;
    var lines = this._effectLines(monster);
    if (lines.length === 0) return pos.y;

    var lh = pos.lineHeight || 18;
    var y = pos.y;

    this.panel.drawText(this.texts.effectLabel || "", pos.x, y,
      { font: pos.font || t.smallFont, color: t.cursorColor });
    y += lh;

    var font = pos.font || t.smallFont;
    var fromFont = pos.fromFont || t.smallFont;

    for (var i = 0; i < lines.length; i++) {
      var text = lines[i].text;
      this.panel.drawText(text, pos.x, y, { font: font, color: t.textColor });

      // 出どころ（特性名・装備名）は、効果の後ろに薄く小さく。
      // 「攻撃 ×1.5（HP25%以下のとき）」のように文が長いときは、はみ出すので出さない
      // （どの効果が効いているか自体は、効果の文だけで分かる）
      this.panel.ctx.font = font;
      var w = this.panel.ctx.measureText(text).width;
      this.panel.ctx.font = fromFont;
      var from = "（" + lines[i].from + "）";
      if (!pos.maxX || pos.x + w + 4 + this.panel.ctx.measureText(from).width <= pos.maxX) {
        this.panel.drawText(from, pos.x + w + 4, y, { font: fromFont, color: t.hintColor });
      }
      y += lh;
    }
    return y;
  };

  /**
   * 装備を全部外したときのステータス。「装備でいくつ上がっているか」を出すために使う。
   * 一時的に外して計算し、必ず戻す（ステータスは呼ばれるたびに計算されるので、持ち主は変わらない）
   */
  PartyScene.prototype._statsWithout = function (monster) {
    var original = monster.equipment;
    monster.equipment = [];
    try {
      return {
        hp: monster.getMaxHp(), pp: monster.getMaxPp(),
        attack: monster.getAttack(), defense: monster.getDefense(), speed: monster.getSpeed()
      };
    } finally {
      monster.equipment = original;
    }
  };

  /** 属性耐性の行（並びは elements.js の order） */
  PartyScene.prototype._elementRows = function (monster) {
    var elements = this.game.data.elements || {};
    var ids = Object.keys(elements).filter(function (id) { return id !== "none"; });
    ids.sort(function (a, b) { return (elements[a].order || 0) - (elements[b].order || 0); });

    // 装備で上がったぶん（bonus）は、装備を外した値と比べて出す
    var bare = this._resistancesWithout(monster, ids, "element");
    return ids.map(function (id, i) {
      var value = monster.getResistance(id) || 0;
      return { name: elements[id].name, icon: elements[id].icon || null,
               value: value, bonus: value - bare[i] };
    });
  };

  /** 状態異常耐性の行（並びは statuses.js に書いた順） */
  PartyScene.prototype._statusRows = function (monster) {
    var statuses = this.game.data.statuses || {};
    if (!monster.getStatusResist) return [];

    var ids = Object.keys(statuses);
    var bare = this._resistancesWithout(monster, ids, "status");
    return ids.map(function (id, i) {
      var value = monster.getStatusResist(id) || 0;
      return { name: statuses[id].name, icon: statuses[id].icon || null,
               value: value, bonus: value - bare[i] };
    });
  };

  /** 装備を全部外したときの耐性（属性 or 状態異常）。一時的に外して計算し、必ず戻す */
  PartyScene.prototype._resistancesWithout = function (monster, ids, kind) {
    var original = monster.equipment;
    monster.equipment = [];
    try {
      return ids.map(function (id) {
        return (kind === "status" ? monster.getStatusResist(id) : monster.getResistance(id)) || 0;
      });
    } finally {
      monster.equipment = original;
    }
  };

  /**
   * 耐性を2列の表にして描く。属性でも状態異常でも同じ見た目にする。
   * 強いところは青、弱いところは赤。等倍（0）は目立たせない。
   * @returns {number} 描き終えたあとのy
   */
  PartyScene.prototype._renderResistTable = function (monster, pos, label, rows) {
    var t = this.theme;
    var lh = pos.lineHeight || 18;
    var colWidth = pos.colWidth || 118;
    var y = pos.y;

    this.panel.drawText(label || "", pos.x, y, { font: pos.font || t.smallFont, color: t.cursorColor });
    y += lh;

    for (var i = 0; i < rows.length; i++) {
      var v = rows[i].value;
      var color = t.hintColor;
      if (v > 0) color = t.hpBarFull || "#4fb0d1";
      else if (v < 0) color = t.hpBarLow || "#e8542a";

      var cx = pos.x + (i % 2) * colWidth;
      // 名前の前に絵（属性・状態異常）。無いものは文字だけ
      if (rows[i].icon) {
        NS.StatusMarks.drawIcon(this.sprites, rows[i].icon, cx, y, pos.iconSize || 14);
        cx += (pos.iconSize || 14) + 4;
      }
      var text = rows[i].name + " " + (v > 0 ? "+" : "") + v;
      this.panel.drawText(text, cx, y, { color: color, font: pos.font || t.smallFont });

      // 装備で動いたぶん。「(+3)」のように値の隣へ小さく
      var bonus = rows[i].bonus || 0;
      if (bonus !== 0) {
        this.panel.ctx.font = pos.font || t.smallFont;
        var w = this.panel.ctx.measureText(text).width;
        this.panel.drawText("(" + (bonus > 0 ? "+" : "") + bonus + ")", cx + w + 4, y,
          { font: t.smallFont, color: bonus > 0 ? (t.hpBarHigh || "#5fd18c") : (t.hpBarLow || "#e8542a") });
      }

      if (i % 2 === 1) y += lh;
    }
    // 奇数個で終わったら、その行ぶんを送る
    if (rows.length % 2 === 1) y += lh;
    return y;
  };

  /** そのモンスターが実際に持っている特性の定義を並べる（1体あたりの上限を反映） */
  PartyScene.prototype._getAbilities = function (monster) {
    if (!NS.AbilitySystem) return [];
    if (!this._abilitySystem) this._abilitySystem = new NS.AbilitySystem(this.game.data);
    return this._abilitySystem.getAbilities(monster);
  };

  NS.PartyScene = PartyScene;
})(window.MyGame);
