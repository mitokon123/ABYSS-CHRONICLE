/**
 * BattleScene.js
 * 戦闘画面（3対3）。状態の進行だけを担当し、描画はすべて ui/ の部品に任せる。
 * 戦闘のルール・計算は BattleSystem、文言は BattleMessageFormatter が担当する。
 *
 * ▼ 流れ
 *   盤面の味方ぜんいんの行動を決める → 素早さの大きい順に全員が行動 → 結果を表示
 *
 * ▼ 倒れた仲間の扱い
 *   倒れても自動では控えと入れ替わらない（BattleSystem の枠を参照）。
 *   次のターン、その枠は「交代」だけを選べる。控えがいなければ飛ばす。
 *   交代した瞬間（その出来事を見せたとき）に、絵・HP・PP も入った者のものに変わる。
 *
 * ▼ 状態（this.phase）
 *   "command" … 何をするか選ぶ
 *   "skill"   … 技を選ぶ
 *   "item"    … 道具を選ぶ
 *   "target"  … 相手を選ぶ
 *   "message" … メッセージ送り待ち
 *   "done"    … 戦闘終了
 */
(function (NS) {
  "use strict";

  /**
   * @param {MyGame.Game} game
   * @param {MyGame.Party|object[]} allySource 味方。Party でも配列でも受け取れる
   * @param {object[]} enemies 敵
   * @param {object} returnScene 戦闘終了後に戻るシーン
   * @param {function(string):boolean} [onFinish] 結果を受け取るコールバック
   * @param {object} [options] { allowScout, allowFlee, scoutLevel, introMessage }
   *   scoutLevel … 仲間になったときのレベル。省略すると戦っていたレベルのまま。
   *                ボスのように、戦う強さと仲間にしたときの強さを分けたいときに使う
   */
  function BattleScene(game, allySource, enemies, returnScene, onFinish, options) {
    options = options || {};
    this.game = game;
    this.allySource = allySource;
    this.allies = (allySource && typeof allySource.getMembers === "function")
      ? allySource.getMembers()
      : allySource;
    this.enemies = enemies;
    this.returnScene = returnScene;
    this.onFinish = onFinish;

    this.allowScout = options.allowScout !== false;
    this.allowFlee = options.allowFlee !== false;
    this.scoutLevel = options.scoutLevel;
    this.introMessage = options.introMessage || null;
    // この戦いだけ別の曲にしたいとき（主ごとの曲など）。省略で場面の既定
    this.bgmId = options.bgm || null;

    var ui = game.data.ui || {};
    this.theme = ui.theme || {};
    this.layout = ui.battle || {};
    this.texts = (game.data.messages || {}).battleUi || {};

    // 描画部品
    this.panel = new NS.Panel(game.ctx, this.theme);
    this.hpBar = new NS.HpBar(game.ctx, this.theme);
    this.spriteRenderer = new NS.SpriteRenderer(game.ctx, game.assets);
    this.renderer = new NS.Renderer(game.ctx);

    this.messageLog = new NS.MessageLog(this.panel, this.layout.message, this.layout.messageLines);
    this.commandMenu = new NS.CommandMenu(this.panel, this.layout.command);
    this.subMenu = new NS.ScrollList(this.panel, this.layout.subMenu, { sprites: this.spriteRenderer });

    // 演出（HPバーの動き・ダメージ表示・画面効果）
    var animation = this.layout.animation || {};
    this.animation = animation;
    this.styles = animation.styles || {};
    this.animator = new NS.BattleAnimator(animation);
    this.floatingText = new NS.FloatingText(animation.popup);
    this.screenEffects = new NS.ScreenEffects(animation);
    // 踏み込み・のけぞりのような「1回だけ流れる動き」を覚えておく
    this.actionMotions = new NS.MotionPlayer(game.data);
    // 倒れる動きを流した相手。流し終えたら姿を消すために覚えておく
    this._faintPlayed = [];

    // 技を当てたときの演出。いま出している技を覚えて、命中したところで出す
    this.skillEffects = new NS.EffectPlayer(game.data);
    this._currentSkill = null;

    // 戦っている場所の背景。挑戦中のダンジョンから引く（data/dungeonThemes.js の battle）
    this.scenery = this._findScenery();
    this.sceneryParticles = (this.scenery && this.scenery.particles)
      ? new NS.ParticleField(this.scenery.particles, game.canvas.width, game.canvas.height)
      : null;

    // 1ターン分の出来事を1つずつ見せるための状態
    this.playbackEvents = [];
    this.playbackIndex = 0;
    this.playbackTimer = 0;
    // 演出中に「今どの並びで表示していたか」を保つ（倒れた相手もその場に残す）
    this.viewAllies = null;
    this.viewEnemies = null;

    // ロジック
    var random = new NS.Random();
    this.system = new NS.BattleSystem(game.data, random);
    this.scoutSystem = new NS.ScoutSystem(game.data, random);
    this.dropSystem = new NS.DropSystem(game.data, random);
    this.itemUsage = new NS.ItemUsage(game.data);
    this.formatter = new NS.BattleMessageFormatter(game.data.messages, game.data.statuses);

    this.phase = "message";
    this.commandIndex = 0;   // いま行動を決めている味方（盤面の番号）
    this.actions = [];       // 決まった行動
    this.pending = null;     // 決めかけの行動（対象選択中）
    this.targetIndex = 0;
    this.targetSide = "enemy";

    // 仲間になったが、パーティがいっぱいで行き先が決まっていない個体
    this.pendingScout = null;
    this._scoutError = null;  // 行き先へ入れられなかった理由

    // 何ターン目か（_resolveTurn で数える）。誘いの香が「次のターンから」効くのに使う
    this._turnCount = 0;
    // 誘いの香（data/items.js の effect.type "scoutBoost"）。{ multiplier, fromTurn }。
    // その戦闘のあいだ続き、重ねて使っても上がらない（作者の指定）
    this.scoutBoost = null;

    // 画面に出しているバフ／デバフの印。
    // 実際の効果（monster.modifiers）より遅れて増減する（_shownModifiersFor を参照）
    this.shownModifiers = [];

    // レベルアップの結果の窓（画面中央）。出ているあいだは再生を止める。
    // 何体も上がったら、先頭から1体ずつ出す（_queueLevelResult）
    this.levelResults = [];

    // 初めての場面で出る説明（出ているあいだは行動を決められない）
    this.tutorial = new NS.TutorialBox(this.panel, game);
    // 「この項目です」と矢印で指せるように、コマンド欄の位置を教える係を渡す。
    // 並びは場面で変わる（スカウトや交代が出たり出なかったり）ので、
    // 位置ではなく value で引く
    var scene = this;
    this.tutorial.setTargetResolver(function (pointAt) {
      return scene.commandMenu.rectOfValue(pointAt);
    });

    // 技以外の行動は、正しい行動順のタイミングでここに処理が回ってくる
    var self = this;
    this.system.onNonSkillAction = function (step, events) {
      self._performNonSkillAction(step, events);
    };
  }

  /**
   * この戦いで流す曲のid。
   * 開いた側の指定（主ごとの bgm）> 主の共通曲 > ふつうの戦闘曲 の順。
   * 逃げられない相手＝主、で見分けている。
   *
   * ★ 曲は enter より前、出会いの演出が始まる瞬間に鳴らしたい
   *   （DungeonScene._enterBattle）。そのために外から引けるようにしてある
   */
  BattleScene.prototype.getBgmId = function () {
    return this.bgmId || (this.allowFlee ? "battle" : "boss");
  };

  BattleScene.prototype.enter = function () {
    // 演出の頭で鳴らし始めているので、ふつうはここでは何もしない
    // （同じidなら鳴らし直さない）。演出なしで開かれたときの保険
    this.game.audio.playBgm(this.getBgmId());

    this.system.start(this.allies, this.enemies);
    this._assignEnemyLabels();
    this._recordEnemiesSeen();

    // 設定「エフェクトの濃さ」を演出に渡す（戦闘に入るたびに読み直す）
    if (this.skillEffects.setIntensity) {
      this.skillEffects.setIntensity(this._effectIntensity());
    }

    // 開始時はHPバーを実際の値に合わせておく
    this.animator.snap(this.allies);
    this.animator.snap(this.enemies);

    var messages = (this.game.data.messages || {}).battle || {};
    if (this.introMessage) {
      this.messageLog.push(this.introMessage);
    } else if (messages.encounter) {
      this.messageLog.push(messages.encounter.replace("{name}", this._enemyGroupName()));
    }
    this._showNextMessage();
  };

  /** 「スライム たち」のように、出てきた敵をひとまとめに呼ぶ */
  BattleScene.prototype._enemyGroupName = function () {
    var field = this.system.getFieldEnemies();
    if (field.length === 0) return "";
    if (field.length === 1) return field[0].getName();
    return field[0].getName() + " たち";
  };

  /**
   * 同じ名前の敵が複数いる場合に、A・B・C…の印をつける。
   * これが無いと「スライム の 攻撃!」がどちらのスライムか分からなくなる。
   */
  BattleScene.prototype._assignEnemyLabels = function () {
    var suffixes = ((this.game.data.messages || {}).battle || {}).enemySuffixes
                || ["A", "B", "C", "D", "E", "F"];
    var counts = {};
    var i, id;

    // まず同じ種族が何体いるか数える
    for (i = 0; i < this.enemies.length; i++) {
      id = this.enemies[i].speciesId;
      counts[id] = (counts[id] || 0) + 1;
    }

    var used = {};
    for (i = 0; i < this.enemies.length; i++) {
      id = this.enemies[i].speciesId;
      if (counts[id] <= 1) {
        this.enemies[i].displaySuffix = null;   // 1体だけなら印は不要
        continue;
      }
      used[id] = (used[id] || 0);
      this.enemies[i].displaySuffix = suffixes[used[id]] || String(used[id] + 1);
      used[id]++;
    }
  };

  /** 出会った敵を図鑑に「発見」として記録する */
  BattleScene.prototype._recordEnemiesSeen = function () {
    var discovery = this.game.discovery;
    if (!discovery) return;
    for (var i = 0; i < this.enemies.length; i++) {
      discovery.markMonsterSeen(this.enemies[i].speciesId);
    }
  };

  // --- メニュー構築 ---

  /**
   * いま行動を決めている仲間のコマンド欄を組む。
   * 並びは仲間ごとに変わる（倒れていれば交代だけ）ので、番が移るたびに組み直す。
   */
  BattleScene.prototype._buildCommandMenu = function () {
    var labels = (this.game.data.messages || {}).command || {};
    var actor = this._currentActor();
    var hasReserve = this._reserveMembers().length > 0;

    // 倒れている仲間にできるのは「交代」だけ。
    // ただし交代しない選択も要る（控えを温存したい・倒れた本人を戻したい）ので、
    // 「そのまま」を並べて次の仲間の番へ進めるようにしてある。
    // 控えがいないときは自動で飛ばされるので、ここには来ない（_canChoose）
    if (actor && actor.isFainted()) {
      this.commandMenu.setItems([
        { label: labels.swap || "swap", value: "swap" },
        { label: labels.skip || "skip", value: "skip" }
      ]);
      return;
    }

    // 眠っている仲間（必ず手番を失う状態異常）にできるのは「交代」と「そのまま」だけ（v1.0.0・作者の指定）。
    // 選んでも眠りで止められて無駄になるコマンドは並べない。交代は眠っていても止められない（BattleSystem._performAction）
    if (actor && this._isAsleep(actor)) {
      var sleepItems = [];
      if (hasReserve) sleepItems.push({ label: labels.swap || "swap", value: "swap" });
      sleepItems.push({ label: labels.skip || "skip", value: "skip" });
      sleepItems.push({ label: labels.inspect || "inspect", value: "inspect" });
      this.commandMenu.setItems(sleepItems);
      return;
    }

    var items = [
      { label: labels.attack || "attack", value: "attack" },  // 通常攻撃（技を選ばず即対象選択）
      { label: labels.fight  || "fight",  value: "fight" },   // 技を選ぶ
      { label: labels.defend || "defend", value: "defend" }   // 受けるダメージを減らす
    ];

    if (this.allowScout) items.push({ label: labels.scout || "scout", value: "scout" });
    // 控えがいるときだけ「交代」を出す（選べない項目を並べない）
    if (hasReserve) items.push({ label: labels.swap || "swap", value: "swap" });
    items.push({ label: labels.item || "item", value: "item" });
    // 状態を見る（行動にはならない。見終わるとここへ戻る）
    items.push({ label: labels.inspect || "inspect", value: "inspect" });
    // 「逃げる」はここには無い。ターンの頭の「戦う／逃げる」で選ぶ

    this.commandMenu.setItems(items);
  };

  /** 必ず手番を失う状態異常（眠り。data/statuses.js の blocksTurn: "always"）に掛かっているか */
  BattleScene.prototype._isAsleep = function (monster) {
    var defs = monster.getStatusDefs ? monster.getStatusDefs() : [];
    for (var i = 0; i < defs.length; i++) {
      if (defs[i].blocksTurn === "always") return true;
    }
    return false;
  };

  /**
   * ターンの頭のメニュー「戦う／逃げる」。
   * 主戦は「逃げる」を薄く出して選べないようにする（無いのではなく、できないと分かるように）。
   */
  BattleScene.prototype._buildTurnMenu = function () {
    var labels = (this.game.data.messages || {}).command || {};
    var t = this.theme;

    this.commandMenu.setItems([
      { label: labels.go   || "go",   value: "go" },
      // 仲間ごとの作戦を変える（v1.0.0）。行動にはならず、変えたらこのメニューへ戻る
      { label: labels.tactic || "tactic", value: "tactic" },
      { label: labels.flee || "flee", value: "flee",
        disabled: !this.allowFlee, color: this.allowFlee ? null : t.hintColor }
    ]);
  };

  // --- 作戦（v1.0.0）：ターンの頭の「作戦」から、仲間を選ぶ → 作戦を選ぶ ---

  BattleScene.prototype._tacticsData = function () {
    return (this.game.data.battle || {}).tactics || { order: [], list: {} };
  };

  /** 作戦を変える仲間の一覧（連れている全員。控えも変えられる） */
  BattleScene.prototype._beginTacticMember = function (keepIndex) {
    var members = this._partyMembers();
    var rows = [];
    for (var i = 0; i < members.length; i++) {
      var tactic = members[i].getTactic ? members[i].getTactic() : null;
      rows.push({
        type: "entry",
        label: members[i].getName(),
        right: tactic ? tactic.name : "",
        color: members[i].isFainted() ? this.theme.hintColor : null,
        value: members[i]
      });
    }
    this._useNormalSubMenu();
    this.subMenu.syncRows(rows, keepIndex || 0);
    this.phase = "tacticMember";
  };

  BattleScene.prototype._updateTacticMember = function (input) {
    this.subMenu.handleInput(input);
    if (input.isPressed("cancel")) { this._beginTurnMenu(); return; }
    if (!input.isPressed("confirm") && !this.subMenu.clickedEntry(input)) return;

    var selected = this.subMenu.getSelected();
    if (!selected) return;
    this._tacticMember = selected.value;
    this._tacticMemberIndex = this.subMenu.index;

    var data = this._tacticsData();
    var current = this._tacticMember.getTactic ? this._tacticMember.getTactic() : null;
    var rows = [], at = 0;
    for (var i = 0; i < (data.order || []).length; i++) {
      var tactic = data.list[data.order[i]];
      if (!tactic) continue;
      if (current && current.id === tactic.id) at = rows.length;
      rows.push({ type: "entry", label: tactic.name,
        right: (current && current.id === tactic.id) ? (this.texts.tacticCurrent || "") : "",
        value: tactic.id });
    }
    this._useNormalSubMenu();
    this.subMenu.syncRows(rows, at);
    this.phase = "tacticPick";
  };

  BattleScene.prototype._updateTacticPick = function (input) {
    this.subMenu.handleInput(input);
    if (input.isPressed("cancel")) { this._beginTacticMember(this._tacticMemberIndex); return; }
    if (!input.isPressed("confirm") && !this.subMenu.clickedEntry(input)) return;

    var selected = this.subMenu.getSelected();
    if (!selected || !this._tacticMember) return;
    this._tacticMember.setTactic(selected.value);
    this._beginTacticMember(this._tacticMemberIndex);
  };

  /** 作戦を選んでいるときの左側：選んでいる作戦（仲間の一覧ではその仲間のいまの作戦）の説明 */
  BattleScene.prototype._renderTacticInfo = function (origin, rect) {
    var selected = this.subMenu.getSelected();
    if (!selected) return;
    var tactic = null;
    if (this.phase === "tacticPick") tactic = this._tacticsData().list[selected.value];
    else if (selected.value && selected.value.getTactic) tactic = selected.value.getTactic();
    if (!tactic) return;

    var t = this.theme;
    var lh = t.lineHeight || 18;
    var y = origin.y + 20 + lh + 6;
    this.panel.drawText(tactic.name, origin.x, y);
    var lines = wrapText(tactic.description || "", (this.layout.tacticInfo || {}).wrap || 17);
    for (var i = 0; i < lines.length; i++) {
      this.panel.drawText(lines[i], origin.x, y + lh * (i + 1) + 4, { font: t.smallFont, color: t.hintColor });
    }
  };


  /** 「攻撃」コマンドで使う技id（data/battle.js） */
  BattleScene.prototype._normalAttackId = function () {
    return (this.game.data.battle || {}).normalAttackSkill || "normalAttack";
  };

  /**
   * 技の並べ方（2026-10-15）。Q/E（または右の並びの札を押す）で切り替える。
   * 選んだ並びは戦闘をまたいで覚えておく（セーブはしない）
   *   learned … 覚えた順（今までの並び）／role … 働きごと／kind … 種類ごと／element … 属性ごと
   */
  var BATTLE_SKILL_SORTS = ["learned", "role", "kind", "element"];

  BattleScene.prototype._battleSkillSort = function () {
    var mode = this.game.battleSkillSort;
    return BATTLE_SKILL_SORTS.indexOf(mode) >= 0 ? mode : BATTLE_SKILL_SORTS[0];
  };

  BattleScene.prototype._changeBattleSkillSort = function (direction) {
    var i = BATTLE_SKILL_SORTS.indexOf(this._battleSkillSort());
    this.game.battleSkillSort = BATTLE_SKILL_SORTS[(i + direction + BATTLE_SKILL_SORTS.length) % BATTLE_SKILL_SORTS.length];
    var keep = this.subMenu.getSelected();
    this._buildSkillMenu(keep ? keep.value : null);
  };

  /**
   * 技の一覧を組む。技が多くなっても選びやすいよう、技を選ぶときだけ枠を大きくし（layout.skillMenu）、
   * 並べ方に応じて見出し（働き・種類・属性）を挟む
   * @param {string} [keepId] この技にカーソルを合わせる（並べ替えたとき）
   */
  BattleScene.prototype._buildSkillMenu = function (keepId) {
    var actor = this._currentActor();
    var rows = [];
    var ids = ((actor && actor.skills) || []).filter(function (id) { return !!this.game.data.getSkill(id); }, this);
    var theme = this.theme;
    var mode = this._battleSkillSort();
    var groups = NS.BattleSystem.groupSkills(this.game.data, ids, mode === "learned" ? "order" : mode);
    var at = -1;

    for (var g = 0; g < groups.length; g++) {
      if (groups[g].group) {
        rows.push({ type: "header", label: "- " + groups[g].group.name + " -", color: groups[g].group.color });
      }
      for (var i = 0; i < groups[g].ids.length; i++) {
        var id = groups[g].ids[i];
        var skill = this.game.data.getSkill(id);
        // PPが足りない技は薄く表示して、使えないことを分かるようにする
        var affordable = this._canAfford(actor, skill);
        if (id === keepId) at = rows.length;
        rows.push({
          type: "entry",
          label: skill.name,
          // 払うPP（特性「死神」で即死の技は0になる。BattleSystem.ppCostOf）
          right: "PP" + this.system.ppCostOf(actor, skill),
          color: affordable ? theme.textColor : theme.hintColor,
          value: id
        });
      }
    }
    this.subMenu.rect = this.layout.skillMenu || this.layout.subMenu;
    if (at >= 0) this.subMenu.syncRows(rows, at);
    else this.subMenu.setRows(rows);
  };

  /** 技以外（道具・交代・作戦）の一覧は、ふつうの大きさの枠に戻す */
  BattleScene.prototype._useNormalSubMenu = function () {
    this.subMenu.rect = this.layout.subMenu;
  };

  /** その技のPPを今払えるか */
  BattleScene.prototype._canAfford = function (actor, skill) {
    var cost = this.system.ppCostOf(actor, skill);
    if (cost <= 0) return true;
    return !!(actor && actor.canPayPp && actor.canPayPp(cost));
  };

  /**
   * 控えにいる仲間。盤面の枠におらず、まだ倒れていない者。
   * 倒れている仲間は前に出せない。
   * このターンに別の仲間が「この者と交代」と決めた相手も外す
   * （2つの枠が同じ控えを選ぶと、あとの交代が成り立たない）。
   */
  BattleScene.prototype._reserveMembers = function () {
    var slots = this.system.getFieldSlots();
    var members = this._partyMembers();
    var reserves = [];

    for (var i = 0; i < members.length; i++) {
      if (slots.indexOf(members[i]) >= 0) continue;
      if (members[i].isFainted && members[i].isFainted()) continue;
      if (this._chosenAsIncoming(members[i])) continue;
      reserves.push(members[i]);
    }
    return reserves;
  };

  /** このターンの決定済みの行動の中で、もう交代先に選ばれているか */
  BattleScene.prototype._chosenAsIncoming = function (member) {
    for (var i = 0; i < this.actions.length; i++) {
      var action = this.actions[i];
      if (action && action.type === "swap" && action.incoming === member) return true;
    }
    return false;
  };

  /** 交代先の候補を並べる */
  BattleScene.prototype._buildSwapMenu = function () {
    var reserves = this._reserveMembers();
    var rows = [];

    for (var i = 0; i < reserves.length; i++) {
      rows.push({
        type: "entry",
        // レベルは右側にまとめる（名前が長いと「…」で縮むので、レベルが隠れないように）
        label: reserves[i].getName(),
        right: "Lv" + reserves[i].level + "  HP" + reserves[i].currentHp + "/" + reserves[i].getMaxHp(),
        // 番号ではなく個体そのものを覚える（並びが変わっても選んだ相手と交代できる）
        value: reserves[i]
      });
    }
    this._useNormalSubMenu();
    this.subMenu.setRows(rows);
  };

  /** 戦闘中に使える道具だけを並べる */
  BattleScene.prototype._buildItemMenu = function () {
    var inventory = this.game.inventory;
    var rows = [];

    if (inventory) {
      var slots = inventory.getSlots();
      for (var i = 0; i < slots.length; i++) {
        if (!this.itemUsage.isUsableIn(slots[i].itemId, "battle")) continue;
        // スカウトできない戦い（主の初戦など）では、誘いの香は出さない（使っても意味がない）
        if (!this.allowScout && this._isScoutBoostItem(slots[i].itemId)) continue;
        var item = this.game.data.getItem(slots[i].itemId);
        rows.push({
          type: "entry",
          label: item ? item.name : slots[i].itemId,
          icon: item ? item.icon : null,
          right: "x" + slots[i].count,
          value: slots[i].itemId
        });
      }
    }
    this._useNormalSubMenu();
    this.subMenu.setRows(rows);
  };

  // --- 更新 ---

  BattleScene.prototype.update = function (dt) {
    var input = this.game.input;

    // 設定の戦闘速度に応じて、演出全体の進み方を変える
    var scaled = dt * this._speedMultiplier();

    // 演出は常に進める（HPバーの動き・浮かぶ数字・画面効果）
    this.animator.update(scaled, this.allies);
    this.animator.update(scaled, this.enemies);
    this.floatingText.update(scaled);
    this.screenEffects.update(scaled);
    this.actionMotions.update(this.game.clock);
    this.skillEffects.update(this.game.clock);
    if (this.sceneryParticles) this.sceneryParticles.update(scaled);

    // 説明を出している間は戦闘を止める。
    // 演出だけは上で進めてあるので、読み終われば続きから動く
    if (this.tutorial.isActive()) {
      this.tutorial.handleInput(input);
      return;
    }

    // レベルアップの結果を見せている間も止める（説明が先。読み終わってから出る）
    if (this.levelResults.length > 0) {
      this._updateLevelResult(input);
      return;
    }

    switch (this.phase) {
      case "playback": this._updatePlayback(scaled, input); break;
      case "message":  this._updateMessage(input); break;
      case "turnMenu": this._updateTurnMenu(input); break;
      case "command":  this._updateCommand(input); break;
      case "inspect":  this._updateInspect(input); break;
      case "skill":    this._updateSkill(input); break;
      case "swap":     this._updateSwap(input); break;
      case "item":     this._updateItem(input); break;
      case "target":   this._updateTarget(input); break;
      case "scoutChoice": this._updateScoutChoice(input); break;
      case "scoutSwap":   this._updateScoutSwap(input); break;
      case "tacticMember": this._updateTacticMember(input); break;
      case "tacticPick":   this._updateTacticPick(input); break;
      case "done":     this._updateDone(); break;
    }
  };

  // --- 1ターン分の再生 ---

  /**
   * 設定の「戦闘速度」に対応する倍率。
   * 大きいほど演出が速く進む。設定が無ければ等倍。
   */
  BattleScene.prototype._speedMultiplier = function () {
    var table = this.animation.speedTable;
    var settings = this.game.settings;
    if (!table || !settings) return 1;

    var level = settings.get("battleSpeed");
    if (typeof level !== "number") return 1;

    return table[level - 1] || 1;
  };

  /**
   * 戦っている全員の現在PPを控える。
   * PPはターンの計算のときに一気に払われるので、そのまま描くと技を見せる前に減ってしまう。
   * 演出のあいだは控えた値で描き、技を使う出来事を見せた瞬間に減らす（HPと同じ見せ方）
   */
  BattleScene.prototype._capturePp = function () {
    var list = [];
    var everyone = this.allies.concat(this.enemies);
    for (var i = 0; i < everyone.length; i++) {
      list.push({ monster: everyone[i], pp: everyone[i].currentPp });
    }
    return list;
  };

  /** 画面に出してよいPP。演出中でなければ実際の値 */
  BattleScene.prototype._shownPpOf = function (monster) {
    var list = this.shownPp;
    if (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].monster === monster) return list[i].pp;
      }
    }
    return monster.currentPp;
  };

  /** 出来事を見せた瞬間に、PPバーをその値にする */
  BattleScene.prototype._revealPp = function (monster, pp) {
    var list = this.shownPp;
    if (!list || !monster || typeof pp !== "number") return;
    for (var i = 0; i < list.length; i++) {
      if (list[i].monster === monster) { list[i].pp = pp; return; }
    }
    list.push({ monster: monster, pp: pp });
  };

  /** 戦っている全員の現在HPを控える */
  BattleScene.prototype._captureHp = function () {
    var list = [];
    var i;
    for (i = 0; i < this.allies.length; i++) {
      list.push({ monster: this.allies[i], hp: this.allies[i].currentHp });
    }
    for (i = 0; i < this.enemies.length; i++) {
      list.push({ monster: this.enemies[i], hp: this.enemies[i].currentHp });
    }
    return list;
  };

  /** 出来事を1つずつ見せる状態に入る */
  BattleScene.prototype._startPlayback = function (events) {
    // 倒れた相手も演出が終わるまでその場に残すため、開始時の並びを覚えておく
    this.viewAllies = this.snapshotAllies;
    this.viewEnemies = this.snapshotEnemies;

    // HPバーをターン開始前の状態に戻す（減るのは攻撃を見せる瞬間）
    var snapshot = this.snapshotHp || [];
    for (var i = 0; i < snapshot.length; i++) {
      this.animator.hold(snapshot[i].monster, snapshot[i].hp);
    }
    // PPも同じ。減るのは技を使う出来事を見せる瞬間（_revealPp）
    this.shownPp = this.snapshotPp || null;

    this.playbackEvents = events || [];
    this.playbackIndex = 0;
    this.playbackTimer = 0;
    this.playbackWaiting = false;
    this.messageLog.clear();
    // 防御の構えは、演出のあいだは出来事に合わせて出し入れする（前のターンの構えはここで解く）
    this.shownGuard = [];
    this.phase = "playback";
  };

  BattleScene.prototype._updatePlayback = function (dt, input) {
    // メッセージ欄がいっぱいのときは、読み終わるまで待つ
    if (this.playbackWaiting) {
      if (input.isPressed("confirm") || input.isPressed("cancel")
          || this._clickedScreen(input)) {
        this.messageLog.clearPage();
        this.playbackWaiting = false;
      }
      return;
    }

    // 決定キーを押している間は早送りする
    var quick = input.isDown("confirm");
    this.playbackTimer -= dt * (quick ? 3 : 1);
    if (this.playbackTimer > 0) return;

    // まだ出来事が残っていれば次を見せる
    if (this.playbackIndex < this.playbackEvents.length) {
      var event = this.playbackEvents[this.playbackIndex];

      // 同時に見せる組の頭で、組の文がこのページに収まらなければ、先に送り待ちにする
      // （組の途中でページが切れると、同時に出るはずのダメージが送り待ちで分かれてしまう）
      if (this._simulNeedsPage(this.playbackIndex)) {
        this.playbackWaiting = true;
        return;
      }

      // 表示欄が埋まっていたら、古い行を消さずに送り待ちにする
      // （そうしないと味方の行動が流れて消えてしまう）
      if (this.messageLog.isFull() && this.formatter.formatOne(event)) {
        this.playbackWaiting = true;
        return;
      }

      this._playEvent(event, quick);
      this.playbackIndex++;

      // 同時に見せる組の残りは、同じフレームのうちに続けて見せる（1フレームずつずれないように）
      while (event.simul && this.playbackIndex < this.playbackEvents.length) {
        var next = this.playbackEvents[this.playbackIndex];
        if (next.simul !== event.simul) break;
        if (this.messageLog.isFull() && this.formatter.formatOne(next)) break;
        this._playEvent(next, quick);
        this.playbackIndex++;
      }
      return;
    }

    // すべて見せ終わっても、HPバーが動き切るまでは待つ
    if (!this._animationSettled()) return;

    this._endPlayback();
  };

  /**
   * その出来事が「同時に見せる組」の頭で、組の文が今のページに入りきらないか。
   * ページが空なら（入りきらなくても）待たない。組が1ページより長いときは、ふつうの送り待ちに任せる
   */
  BattleScene.prototype._simulNeedsPage = function (index) {
    var events = this.playbackEvents;
    var event = events[index];
    if (!event || !event.simul) return false;
    var prev = events[index - 1];
    if (prev && prev.simul === event.simul) return false;
    var used = this.messageLog.current.length;
    if (used === 0) return false;

    var lines = 0;
    for (var i = index; i < events.length && events[i].simul === event.simul; i++) {
      if (this.formatter.formatOne(events[i])) lines++;
    }
    return used + lines > this.messageLog.linesPerPage;
  };

  BattleScene.prototype._animationSettled = function () {
    return this.animator.isSettled(this.allies)
        && this.animator.isSettled(this.enemies)
        && !this.floatingText.isActive()
        // 倒れきる前・技の演出が消えきる前に戦闘を終わらせない
        && !this.actionMotions.isBusy(this.game.clock)
        && !this.skillEffects.isBusy(this.game.clock);
  };

  /** 出来事を1つ見せて、次までの待ち時間を決める */
  BattleScene.prototype._playEvent = function (event, quick) {
    this.messageLog.stream(this.formatter.formatOne(event));

    // 次の行動が始まったら、前の行動の札をまとめて消す（v1.0.0）
    this._dismissPopupsOnActionStart(event);
    // 強化・弱体・特性・加護が発動したら、画面上部に札を出す
    this._pushEffectPopup(event);

    var wait = quick
      ? (this.animation.quickDelay || 90)
      : (this.animation.eventDelay || 400);
    // 溜めの長い技（死神の鎌）は、技を出してから当たるまでを長くとる（data/skills.js の windupMs）。
    // 専用の動きの「振り下ろし」のコマと、当たった演出・数字の出る瞬間をそろえるため
    if (!quick && event.type === "useSkill" && event.skill && event.skill.windupMs) {
      wait = Math.max(wait, event.skill.windupMs);
    }

    // 「ここまで減った」と見せてよいHPを、この瞬間に反映する
    if (event.revealTarget) {
      this.animator.revealTo(event.revealTarget, event.revealHp);
    }
    // PPも同じ。技を使った（払った）瞬間と、PPを戻す道具を使った瞬間
    if (event.type === "useSkill" && event.actor) this._revealPp(event.actor, event.ppAfter);
    if (event.ppTarget) this._revealPp(event.ppTarget, event.ppValue);
    // 状態異常の印も、この瞬間に増やす・消す（_shownStatusesFor）
    if (event.type === "status" || event.type === "statusEnd" || event.statusIds) {
      this._revealStatusMark(event);
    }
    // 防御の構えも、この瞬間に出す・解く
    if (this.shownGuard && event.target) {
      var guardAt = this.shownGuard.indexOf(event.target);
      if (event.type === "defend" && guardAt < 0) this.shownGuard.push(event.target);
      if ((event.type === "defendBroken" || event.type === "defendFailed") && guardAt >= 0) this.shownGuard.splice(guardAt, 1);
    }

    this._playActionMotion(event);
    this._playSkillEffect(event);

    switch (event.type) {
      case "damage":
        this.animator.revealTo(event.target, event.currentHp);
        // 0ダメージは「効かない」と同じ見せ方（揺れも光りもしない「0」と、外れの音）
        if (event.amount <= 0) {
          this._applyStyle("immune", event.target, "0");
          this.game.audio.playSe("miss");
          break;
        }
        // クリティカルのときはクリティカル用の見た目にする
        this._applyStyle(event.critical ? "critical" : "damage",
          event.target, String(event.amount));
        // 打撃か斬撃かは演出の型で決まる。クリティカルも同じ音（専用の音は付けない、と決めてある）。
        // 出した瞬間の音を持つ技は null が返り、当たった音は鳴らさない
        var hitSe = this._hitSeFor();
        if (hitSe) this.game.audio.playSe(hitSe);
        // HPバーが動き切るまでは次の出来事へ進まない
        wait = Math.max(wait, this.animator.drainTime(event.amount));
        break;
      case "miss":
        this._applyStyle("miss", event.target, "MISS");
        this.game.audio.playSe("miss");
        break;
      case "effective":
        this._applyStyle("effective", event.target, null);
        break;
      // いまひとつは音なし（当たった音だけ鳴る）
      case "resisted":
        this._applyStyle("resisted", event.target, null);
        break;
      // 無効・状態異常が効かなかったのは「当たらなかった」の仲間として外れの音
      case "immune":
        this._applyStyle("immune", event.target, "0");
        this.game.audio.playSe("miss");
        break;
      // 状態異常が入らなかった（確率で外れた・効かない相手）。攻撃が外れたときと同じ「MISS」を出す（作者の指定）
      case "statusImmune":
      case "statusMiss":
      // 芽吹きの守りで防いだ（v1.0.0）。入らなかったのは同じなので、同じ見せ方
      case "wardBlocked":
      // 弱体が、弱体への耐性で入らなかった（2026-10-15）
      case "modifierMiss":
        this._applyStyle("miss", event.target, "MISS");
        this.game.audio.playSe("miss");
        break;
      // 反動（捨て身の体当たり）。自分が受けるダメージ。攻撃のダメージと同じく、見せた瞬間にHPバーを減らす
      case "recoil":
        this.animator.revealTo(event.target, event.currentHp);
        this._applyStyle("damage", event.target, String(event.amount));
        this.game.audio.playSe("hit");
        wait = Math.max(wait, this.animator.drainTime(event.amount));
        break;
      case "faint":
        this._applyStyle("faint", event.target, null);
        // 即死で倒れたときは、直前の即死の音が倒れる音を兼ねる（音を持つ状態異常が原因なら鳴らさない）
        if (!this._statusSeOf(event.statusId)) this.game.audio.playSe("faint");
        // 倒した敵を図鑑に記録する（倒すだけで図鑑が開く種族がある。シニガミ。Discovery.isMonsterDexOpen）
        if (event.target && this.enemies.indexOf(event.target) >= 0 && this.game.discovery &&
            this.game.discovery.markMonsterDefeated) {
          this.game.discovery.markMonsterDefeated(event.target.speciesId);
          // 倒すだけで図鑑が開く種族は、その種族が覚える技も図鑑に載せる（仲間にしないと技を覚えられないため）
          var defeatedSpecies = event.target.getSpecies ? event.target.getSpecies() : null;
          if (defeatedSpecies && defeatedSpecies.dexOnDefeat) {
            var learnset = defeatedSpecies.learnset || [];
            for (var ls = 0; ls < learnset.length; ls++) this.game.discovery.markSkillLearned(learnset[ls].skill);
          }
        }
        break;
      // 状態異常に掛かった瞬間。音は data/statuses.js の se（無ければ無音）
      case "status":
        this._playStatusSe(event.statusId);
        break;
      // ターン終了時の毒ダメージ。攻撃のダメージと同じく、見せた瞬間にHPバーを減らす
      case "statusDamage":
        this.animator.revealTo(event.target, event.currentHp);
        this._applyStyle("statusDamage", event.target, String(event.amount));
        this._playStatusSe(event.statusId);
        wait = Math.max(wait, this.animator.drainTime(event.amount));
        break;
      // 効果は takeTurn の時点でもう掛かっているが、
      // 印は「その出来事を見せた瞬間」に出す（HPバーと同じ考え方）
      case "modifier":
        this._revealModifier(event);
        this._playModifierSe(event);
        break;
      case "modifierEnd":
        this._hideModifier(event);
        break;
      // レベルアップで覚えた技を図鑑へ。
      // BattleSystem は Game を知らないので、記録は画面側で行う
      case "skillLearned":
        this.game.discovery.markSkillLearned(event.skillId);
        break;
      // 愛情度の段階が上がった。図鑑の記録は種族ごとなので、その種族の段階を残す
      case "affectionUp":
        if (event.actor && this.game.discovery.markAffectionStage) {
          this.game.discovery.markAffectionStage(event.actor.speciesId, event.stageIndex);
        }
        break;
      // 初めてレベルが上がったときの説明。
      // ここで出すと、レベルアップの演出が出ている画面のまま読める。
      // update が説明を見つけると再生を止めるので、読み終わってから続きが動く
      case "levelUp":
        this.game.audio.playSe("levelUp");
        if (this.game.tutorial) {
          this.tutorial.show(this.game.tutorial.take("levelUp"));
        }
        // 上がった能力と覚えた技を、画面中央の窓で見せる（成長の実感）
        this._queueLevelResult(event);
        break;
      // 勝ったら戦闘曲をやめて、勝利の曲を流す（繰り返さない。data/audio.js）。
      // 探索へ戻ると探索曲に置き換わる
      case "battleEnd":
        if (event.result === "win") {
          this.game.audio.playBgm("victory");
          // 経験値・レベルアップはこのあとに続く。勝利の曲が鳴り始めてから少し間を置く（作者の指定）
          // 決定キーで早送りしているときは待たない
          if (!quick) wait = Math.max(wait, this.animation.victoryPause || 1200);
        } else if (event.result === "lose") {
          this.game.audio.playBgm("lose");
        }
        break;
      // 逃げる音は「逃げようとした」音。失敗しても鳴る
      case "fleeSuccess":
      case "fleeFailed":
        this.game.audio.playSe("flee");
        break;
      default:
        // 画面側が組み立てた出来事に音がついていれば、見せた瞬間に鳴らす
        if (event.se) this.game.audio.playSe(event.se);
        // 交代を見せた瞬間に、画面の並びも入れ替える
        if (event.swapIn) this._showSwap(event);
        // HPの回復（技・道具・吸血）。音が付いている出来事（道具）は上で鳴らしたので重ねない
        if (event.healAmount) {
          this._applyStyle("heal", event.revealTarget, "+" + event.healAmount);
          if (!event.se) this.game.audio.playSe("heal");
          wait = Math.max(wait, this.animator.drainTime(event.healAmount));
        }
        break;
    }

    // 同じ状態異常の結果が続く（どくのいきで3体それぞれに入った／MISS）ときは、待たずに続けて見せる。
    // 一体ずつ間を空けると、全体にかけたのに順番にかかっていくように見えるため（作者の指定：できれば一度に）
    var next = this.playbackEvents && this.playbackEvents[this.playbackIndex + 1];
    if (next && isStatusResultEvent(event.type) && isStatusResultEvent(next.type) &&
        next.statusId === event.statusId) {
      wait = 0;
    }

    // 全体の技で「同時に見せる」組（BattleSystem._pushSimultaneous の simul）。
    // 組の途中は待たずに続けて見せ、組の最後で、組の中でいちばん長い待ち（HPバーが減りきるまで等）をまとめて待つ
    if (event.simul) {
      this._simulWait = Math.max(this._simulWait || 0, wait);
      if (next && next.simul === event.simul) {
        wait = 0;
      } else {
        wait = this._simulWait;
        this._simulWait = 0;
      }
    }

    // 札だけの出来事（文が無い）は待たない。続く状態異常の文と一緒に札が出る
    if (event.type === "abilityPopup") wait = 0;

    this.playbackTimer = wait;
  };

  // --- 発動の札（画面上部のポップアップ） ---

  /**
   * 出来事から、画面上部に出す札を作る。札にならない出来事なら何もしない。
   *
   *   強化／弱体（modifier）… 「防御力上昇」「攻撃力低下」（緑／赤）
   *   特性・加護・装備が働いた … その名前（「毒のとげ」「疾き初手」）。出どころで色を変える
   *     ability（先手・放電・毒のとげ）／regen・drain（再生・吸精・命の灯・吸う牙）／
   *     undying（亡者の魂）／partyFirstStrike（加護の先手をまとめたもの）／tailwind（追い風）／wardGiven（芽吹き）
   *
   * 札の左端には、誰に起きたかを小さく出す（敵なら「敵の」付き）。
   * 同じ相手・同じ札がまだ出ていれば、並べずに出し直す。
   * 文言は data/messages.js の battle.popup…、見た目は data/ui.js の battle.effectPopup。
   */
  BattleScene.prototype._pushEffectPopup = function (event) {
    var P = this.layout.effectPopup;
    if (!P || !event) return;
    var t = this.texts;

    var text = null;
    var kind = null;
    if (event.type === "modifier") {
      kind = event.raised ? "buff" : "debuff";
      // 技に札の言葉が書いてあればそれ（立ち塞がる）。
      // 無ければ変わる能力ごとに1枚ずつ（「攻撃力上昇」に「防御力上昇」が重なる。v1.0.0・作者の指定）
      if (event.popup) {
        text = event.popup;
      } else {
        var names = this._popupStatNames(event.effects || []).split("・");
        for (var n = 0; n < names.length; n++) {
          this._addEffectPopup(fill(event.raised ? t.popupStatUp : t.popupStatDown, { stat: names[n] }),
            this._popupOwnerName(event), kind, n, event);
        }
        return;
      }
    } else if (event.type === "ability" || event.type === "undying" || event.type === "partyFirstStrike" ||
               event.type === "tailwind" || event.type === "wardGiven" || event.type === "abilityPopup" ||
               ((event.type === "regen" || event.type === "drain") && event.abilityName)) {
      text = event.abilityName;
      kind = event.sourceKind || "ability";
    }
    if (!text) return;

    var owner = (event.type === "partyFirstStrike")
      ? (event.side === "enemy" ? t.popupEnemyAll : t.popupPartyAll)
      : this._popupOwnerName(event);
    this._addEffectPopup(text, owner, kind, 0, event);
  };

  /**
   * 札を1枚足す。
   * @param {number} order 同じ出来事から何枚目か。2枚目以降は chainDelay ずつ遅れて滑り込む（前の札に重なって見える）
   */
  BattleScene.prototype._addEffectPopup = function (text, owner, kind, order, event) {
    var P = this.layout.effectPopup;
    var now = this.game.clock + (order || 0) * (P.chainDelay || 70);
    if (!this.effectPopups) this.effectPopups = [];
    // 同じ札がまだ出ていれば、外していちばん上に出し直す（並べない）
    for (var i = 0; i < this.effectPopups.length; i++) {
      var p = this.effectPopups[i];
      if (p.text === text && p.owner === owner && !p.dismissAt) {
        this.effectPopups.splice(i, 1);
        break;
      }
    }
    // 新しい札は後ろに足す（描くのも後なので、前の札に重なって上に乗る）
    this.effectPopups.push({ text: text, owner: owner || "", kind: kind, start: now, dismissAt: null });

    // 出ている札が max を超えたら、古いものから消す
    var live = this.effectPopups.filter(function (q) { return !q.dismissAt; });
    for (var j = 0; j < live.length - (P.max || 3); j++) live[j].dismissAt = this._popupDismissAt(live[j], this.game.clock);

    // 特性の名乗り（先手など）は、その者の行動の頭に出る。続く技で札が消えないよう、行動の持ち主にしておく
    if (event.type === "ability" && event.target) this._popupActor = event.target;
  };

  /**
   * 行動の始まりなら、前の行動の札をまとめて消す（v1.0.0・作者の指定）。
   *   技を出した（useSkill）／眠り・麻痺で動けなかった（statusBlocked）を「行動の始まり」とみなす。
   *   同じ者の行動が続くとき（先手の名乗り → その者の技）は消さない
   */
  BattleScene.prototype._dismissPopupsOnActionStart = function (event) {
    var actor;
    if (event.type === "useSkill") actor = event.actor;
    else if (event.type === "statusBlocked") actor = event.target;
    else return;
    if (!actor) return;

    if (actor !== this._popupActor) this._dismissEffectPopups();
    this._popupActor = actor;
  };

  /** 出ている札を、すべて素早く薄れさせて消す（消え方は _renderEffectPopups の fadeOut） */
  BattleScene.prototype._dismissEffectPopups = function () {
    var list = this.effectPopups || [];
    var now = this.game.clock;
    for (var i = 0; i < list.length; i++) {
      if (!list[i].dismissAt) list[i].dismissAt = this._popupDismissAt(list[i], now);
    }
  };

  /**
   * 札が薄れ始める時刻。消す合図が来ても、出てから minShow ミリ秒たつまでは出したままにする
   * （v1.0.2.1・作者の指定「少なくとも0.8秒は表示」。次の行動がすぐ始まると、読めないうちに消えていた）
   */
  BattleScene.prototype._popupDismissAt = function (p, now) {
    var minShow = this.layout.effectPopup.minShow || 0;
    return Math.max(now, p.start + minShow);
  };

  /**
   * 強化・弱体で変わる能力の名前を「・」でつなぐ（「攻撃力・防御力」）。
   * 能力の倍率・加算と命中を拾い、受ける／与えるダメージだけの効果は「能力」とする
   */
  BattleScene.prototype._popupStatNames = function (effects) {
    var labels = this.texts.popupStats || {};
    var names = [];
    for (var i = 0; i < effects.length; i++) {
      var e = effects[i];
      var key = (e.type === "statMultiplier" || e.type === "statBonus") ? e.stat
              : (e.type === "accuracyMultiplier") ? "accuracy" : null;
      var name = key ? labels[key] : null;
      if (name && names.indexOf(name) < 0) names.push(name);
    }
    return names.length > 0 ? names.join("・") : (labels.other || "");
  };

  /** 札に出す持ち主の名前。敵なら「敵の」を付ける（文と同じ見分け方） */
  BattleScene.prototype._popupOwnerName = function (event) {
    var name = event.targetName || (event.target && event.target.getName && event.target.getName()) || "";
    if (!name) return "";
    var enemy = event.targetSide ? (event.targetSide === "enemy") : (event.side === "ally");
    return enemy ? (this.texts.popupEnemyPrefix || "") + name : name;
  };

  /**
   * 札を描く（v1.0.0 で作り直した。作者の指定）。
   *   出る … 画面の右端から slideIn ミリ秒で、定位置へ素早く滑り込む（終わりぎわに減速）
   *   並び … 同じ高さで横に並べ、後から出た札が前の札の右 overlap（1/3）に重なって上に乗る。
   *          並び全体を真ん中に寄せるので、札が増えるほど前の札は左へ滑ってずれる
   *   消える … _dismissEffectPopups で消す印（dismissAt）が付いたら、fadeOut ミリ秒で薄れて消える
   */
  BattleScene.prototype._renderEffectPopups = function (ctx, canvasWidth) {
    var P = this.layout.effectPopup;
    var list = this.effectPopups;
    if (!P || !list || list.length === 0) return;

    var now = this.game.clock;
    var slideIn = P.slideIn || 80;
    var fadeOut = P.fadeOut || 140;
    var maxLife = P.maxLife || 8000;
    var colors = P.colors || {};
    var t = this.theme;

    // 消え終わった札・消し忘れの札を外す
    var alive = [];
    for (var i = 0; i < list.length; i++) {
      var q = list[i];
      if (q.dismissAt && now - q.dismissAt >= fadeOut) continue;
      if (now - q.start >= maxLife) continue;
      alive.push(q);
    }
    this.effectPopups = alive;

    // 出番の来た札（chainDelay で遅らせたものは、出るまで並びに数えない）
    var shown = [];
    for (var s = 0; s < alive.length; s++) {
      if (now - alive[s].start >= 0) shown.push(alive[s]);
    }
    // 並び：同じ高さで横に並べ、幅の overlap ぶん前の札に重ねる。全体を真ん中に寄せるので、増えるほど左へずれる
    var step = P.w * (1 - (P.overlap === undefined ? 1 / 3 : P.overlap));
    var groupW = P.w + Math.max(0, shown.length - 1) * step;
    var startX = (canvasWidth - groupW) / 2;

    for (var k = 0; k < shown.length; k++) {
      var p = shown[k];
      var targetX = startX + k * step;
      // 出たばかりの札は右端から。並びが変わったら（札が増えて左へ寄る）、今の位置から滑って移る
      if (p.toX === undefined) {
        p.fromX = canvasWidth; p.toX = targetX; p.moveStart = p.start;
      } else if (p.toX !== targetX) {
        p.fromX = this._popupX(p, now, slideIn); p.toX = targetX; p.moveStart = now;
      }
      var x = this._popupX(p, now, slideIn);
      // 消す合図のあとも、薄れ始める時刻（dismissAt）まではそのまま出す
      var alpha = p.dismissAt ? Math.min(1, Math.max(0, 1 - (now - p.dismissAt) / fadeOut)) : 1;
      var y = P.y;
      var color = colors[p.kind] || t.cursorColor || "#ffd75e";

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = P.background || "rgba(10,15,28,0.88)";
      ctx.fillRect(x, y, P.w, P.h);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, P.w - 1, P.h - 1);
      // 左端の色帯で種類（強化・弱体・特性・加護）を見分ける
      ctx.fillRect(x, y, P.barWidth || 5, P.h);
      ctx.restore();

      var baseY = y + P.h / 2 + 5;
      ctx.save();
      ctx.globalAlpha = alpha;
      if (p.owner) {
        this.panel.drawText(p.owner, x + (P.barWidth || 5) + 8, baseY,
          { font: t.smallFont, color: t.subTextColor });
      }
      // 札の言葉は、次の札に隠れない左の2/3に収める（textX … 札の左端から言葉の真ん中まで）。
      // 持ち主の名前が長い（「敵のユラツボミ」）ときは、名前に重ならないところまで右へ逃がす
      var textX = P.textX || 118;
      if (p.owner) {
        ctx.font = t.smallFont;
        var ownerRight = (P.barWidth || 5) + 8 + ctx.measureText(p.owner).width;
        ctx.font = P.font || t.font;
        textX = Math.max(textX, ownerRight + 8 + ctx.measureText(p.text).width / 2);
      }
      this.panel.drawText(p.text, x + textX, baseY,
        { align: "center", font: P.font || t.font, color: color });
      ctx.restore();
    }
  };

  /** 札の今の横位置。fromX から toX へ slideIn ミリ秒で滑る（終わりぎわに減速） */
  BattleScene.prototype._popupX = function (p, now, slideIn) {
    var tIn = Math.min(1, Math.max(0, (now - p.moveStart) / slideIn));
    var ease = 1 - Math.pow(1 - tIn, 3);
    return p.fromX + (p.toX - p.fromX) * ease;
  };

  /**
   * 当たったときの音のid。無ければ null（鳴らさない）。
   *
   * 出した瞬間の音（skill.se）を持つ技は、当たったときの打撃音を重ねない。
   * ファイアの炎の音のあとに「ドン」と殴る音が来るのは変なので、技の音だけで完結させる。
   * それ以外（通常攻撃・体当たり・噛みつく など）は演出の型（data/effects.js の shapes）の
   * hitSe、無ければ hit（打撃）。通常攻撃は種族の attackEffect で型が決まるので、斬る種族は斬撃音になる。
   * 技に hitSe を書けば、この判断を上書きできる（"hit" で鳴らす、null で止める）。
   */
  /**
   * 強化・弱体が掛かった瞬間の音。ふつうは buff / debuff。
   * 技に modifierSe を書けば上書きできる（null で鳴らさない。〇〇ベールは技の音だけにする）
   */
  BattleScene.prototype._playModifierSe = function (event) {
    var skill = event.skillId ? this.game.data.getSkill(event.skillId) : null;
    if (skill && skill.modifierSe !== undefined) {
      if (skill.modifierSe) this.game.audio.playSe(skill.modifierSe);
      return;
    }
    this.game.audio.playSe(event.raised ? "buff" : "debuff");
  };

  BattleScene.prototype._hitSeFor = function () {
    var skill = this._currentSkill;
    if (!skill) return "hit";
    if (skill.hitSe !== undefined) return skill.hitSe;
    if (skill.se) return null;
    var effectId = this._effectIdFor(skill, this._currentSkillActor);
    var shapes = (this.game.data.effects || {}).shapes || {};
    var shape = effectId ? shapes[effectId] : null;
    return (shape && shape.hitSe) || "hit";
  };

  /** 状態異常の効果音のid（data/statuses.js の se）。無ければ null */
  BattleScene.prototype._statusSeOf = function (statusId) {
    if (!statusId) return null;
    var def = this.game.data.getStatus ? this.game.data.getStatus(statusId) : null;
    return (def && def.se) ? def.se : null;
  };

  /** 状態異常の効果音を鳴らす。書いていない状態異常は無音 */
  BattleScene.prototype._playStatusSe = function (statusId) {
    var se = this._statusSeOf(statusId);
    if (se) this.game.audio.playSe(se);
  };

  /**
   * その相手の絵を描くべきか。
   *
   * 倒れる動きは「見た目のHPが0になったあと」に始まるので、
   * HPが0になった瞬間に消してしまうと、消えてから倒れることになる。
   * そこで、倒れる動きを持っている相手は
   *   HPが0になっても残す → 倒れる動きを流す → 流し終えたら消す
   * の順にする。動きを持っていない相手は、今までどおりその場で消える。
   */
  BattleScene.prototype._shouldShowSprite = function (monster, shownHp, action) {
    if (action) return true;        // 何か動いている最中
    if (shownHp > 0) return true;   // まだ立っている

    if (this._hasFallen(monster)) return false;   // 倒れ終わった
    return this._awaitsFaint(monster);            // 倒れる動きを待っているところ
  };

  /** 倒れる動きを流し終えたか */
  BattleScene.prototype._hasFallen = function (monster) {
    if (this._faintPlayed.indexOf(monster) < 0) return false;
    return !this.actionMotions.isPlaying(monster, this.game.clock);
  };

  /** 倒れる動きを持っていて、まだ流していないか */
  BattleScene.prototype._awaitsFaint = function (monster) {
    if (!monster.getActionMotionId) return false;
    if (!monster.getActionMotionId("faint")) return false;
    return this._faintPlayed.indexOf(monster) < 0;
  };

  /**
   * 1体分の絵を描く。3つの動きを重ねる。
   *   ふだんの動き（浮く・呼吸する）
   *   ＋ 防御中の姿勢（防御しているあいだ続く）
   *   ＋ 1回だけの動き（踏み込む・のけぞる・倒れる）
   */
  BattleScene.prototype._renderMemberSprite = function (monster, x, y, size, action) {
    var sprite = monster.getSpriteId();
    // ふだんの動きの時計。麻痺で鈍く、眠りで止まる（_motionClockFor）
    var clock = this._motionClockFor(monster);

    // 状態異常が「ふだんの動き」を差し替えることがある（眠り：目を閉じて脱力し、寝息を立てる）。
    // data/statuses.js の idleMotion。こちらは止まった時計ではなく、ふつうの時計で動かす
    var statusIdle = this._statusIdleMotion(monster);
    var transform = statusIdle
      ? NS.Motion.of(this.game.data, statusIdle, this.game.clock, monster.getMotionPhase())
      : NS.Motion.forSprite(this.game.data, sprite,
          monster.getMotionId(), clock, monster.getMotionPhase());

    // 防御中は構えた姿勢を重ねる（_defending は BattleSystem が立てる）。
    // 演出中は「防御」「防御が解けた」の文を見せた瞬間に切り替える（shownGuard。v1.0.0）
    var guarding = this.shownGuard ? this.shownGuard.indexOf(monster) >= 0 : monster._defending;
    if (guarding && monster.getActionMotionId) {
      var guardId = monster.getActionMotionId("guard");
      if (guardId) {
        transform = NS.Motion.combine(transform,
          NS.Motion.of(this.game.data, guardId, clock, monster.getMotionPhase()));
      }
    }

    var combined = NS.Motion.combine(transform, action);

    // 姿（squash / stretch / sleep など）が指定されていて、その種族がその絵を持っていれば差し替える。
    // 持っていない種族は、ふつうの絵のまま動き（伸び縮み・ずれ）だけが付く
    var poseSprite = combined.pose ? monster.getPoseSpriteId(combined.pose) : null;
    if (poseSprite) {
      sprite = poseSprite;
      combined.frame = 0;
    } else if (statusIdle && Object.prototype.toString.call(sprite) === "[object Array]") {
      // 眠っているのに眠りの絵が無い種族は、コマ絵の最初の1枚で止める（跳ねたりしない）
      combined.frame = 0;
    }

    this.spriteRenderer.drawMotion(sprite, x, y, size, size, combined);

    // 眠っている印（Zzz）。小さな z が頭の上へふわっと昇って消える（data/ui.js の sleepZzz）
    if (statusIdle) this._renderSleepZzz(monster, x, y, size);
  };

  /**
   * 見えている状態異常のうち、ふだんの動きを差し替えるもの（眠りの idleMotion）。無ければ null。
   * 種族が同じ名前の場面を motions に書いていれば、そちらを使う
   * （スライムは motions: { sleeping: "slimeSleeping" } で、ほかより深く潰れて眠る）
   */
  BattleScene.prototype._statusIdleMotion = function (monster) {
    var defs = this._shownStatusesFor(monster);
    for (var i = 0; i < defs.length; i++) {
      if (!defs[i].idleMotion) continue;
      var own = monster.getActionMotionId ? monster.getActionMotionId(defs[i].idleMotion) : null;
      return own || defs[i].idleMotion;
    }
    return null;
  };

  /**
   * 眠っている仲間・敵の頭の上に、小さな「z」を順番に昇らせる。
   * 位置は絵の右上。個体ごとに位相をずらして、並んで眠っても揃わないようにする
   */
  BattleScene.prototype._renderSleepZzz = function (monster, x, y, size) {
    var Z = this.layout.sleepZzz;
    if (!Z) return;

    var ctx = this.game.ctx;
    var count = Z.count || 3;
    var period = Z.period || 1800;
    var phase = monster.getMotionPhase ? monster.getMotionPhase() : 0;

    ctx.save();
    ctx.font = Z.font || "bold 12px monospace";
    ctx.textAlign = "center";
    for (var i = 0; i < count; i++) {
      // 0〜1 を繰り返す進み具合。1つずつ少し遅れて出る
      var t = ((this.game.clock / period) + phase + i / count) % 1;
      var alpha = t < 0.2 ? t / 0.2 : (1 - t) / 0.8;
      var zx = x + size * (Z.fromX || 0.7) + (Z.driftX || 8) * t;
      var zy = y + size * (Z.fromY || 0.25) - (Z.rise || 22) * t;
      var scale = (Z.minScale || 0.7) + (1 - (Z.minScale || 0.7)) * t;

      ctx.globalAlpha = Math.max(0, alpha) * (Z.alpha || 0.9);
      ctx.fillStyle = Z.color || "#c9b8ff";
      ctx.save();
      ctx.translate(zx, zy);
      ctx.scale(scale, scale);
      ctx.fillText(Z.text || "z", 0, 0);
      ctx.restore();
    }
    ctx.restore();
  };

  /**
   * その個体の「ふだんの動き」に使う時計。
   *
   * 状態異常の motionSpeed（data/statuses.js）で進み方を変える。
   *   麻痺 0.3 … 動きが鈍くなる　／　眠り 0 … その瞬間の形で止まる
   * 時計を個体ごとに持って「前回からの経過 × 速さ」ずつ進めるので、
   * 速さが切り替わった瞬間に動きが飛ばない（眠りから覚めると、止まった形から動き出す）。
   * 状態異常は見えている印（_shownStatusesFor）で見るので、「眠ってしまった」の文と同時に止まる。
   * 1回だけの動き（踏み込み・のけぞり・倒れる）には掛けない。
   */
  BattleScene.prototype._motionClockFor = function (monster) {
    var now = this.game.clock;
    if (!this._motionClocks) this._motionClocks = new Map();

    var entry = this._motionClocks.get(monster);
    if (!entry) {
      entry = { time: now, last: now };
      this._motionClocks.set(monster, entry);
      return entry.time;
    }

    var speed = 1;
    var defs = this._shownStatusesFor(monster);
    for (var i = 0; i < defs.length; i++) {
      if (typeof defs[i].motionSpeed === "number") speed = Math.min(speed, defs[i].motionSpeed);
    }

    entry.time += (now - entry.last) * Math.max(0, speed);
    entry.last = now;
    return entry.time;
  };

  /**
   * 出来事に合わせて、踏み込み・のけぞりの動きを始める。
   *
   * どの動きになるかは data/motions.js の motionDefaults が決めるので、
   * ここでは種族を区別しない。
   */
  BattleScene.prototype._playActionMotion = function (event) {
    // 相手のいる向き。敵は上段・味方は下段なので、味方は上へ、敵は下へ動く
    var toward = (event.side === "ally") ? -1 : 1;

    if (event.type === "useSkill" && event.actor) {
      var kind = this._skillMotionKind(event.skill);
      // 自分・味方にかける技と共鳴は相手の位置と関係がない（その場で出す）ので、向きを固定する
      var still = (kind === "buff" || kind === "resonance");
      this._startMotion(event.actor, kind, still ? 1 : toward);
      // 技の種類ごとの「出した本人のまわり」の演出（共鳴の響き。data/categories.js の casterEffect）
      this._playCasterEffect(event.skill, event.actor);
      return;
    }

    // 押された相手は、攻撃してきた方向へ飛ぶ（＝踏み込みと同じ向き）。
    // 0ダメージ（びくともしなかった）のときは動かない（作者の指定）
    if (event.type === "damage" && event.target) {
      if (event.amount > 0) this._startMotion(event.target, "hit", toward);
      return;
    }

    // 倒れる・回復・レベルアップは、相手の位置と関係なく同じ向きに動く
    if (event.type === "faint" && event.target) {
      // 流したことを覚えておく。流し終えたら姿を消す判断に使う
      if (this._faintPlayed.indexOf(event.target) < 0) {
        this._faintPlayed.push(event.target);
      }
      this._startMotion(event.target, "faint", 1);
      return;
    }
    if (event.type === "levelUp" && event.actor) {
      this._startMotion(event.actor, "levelUp", 1);
      return;
    }
    // 攻撃が外れた相手は、横へ身をかわす（命中しなかったのも、かわしたのも同じ）。
    // 横へ動くだけなので、向きは敵味方で揃える。眠っている間はかわさない（寝たまま）
    if (event.type === "miss" && event.target) {
      if (!this._statusIdleMotion(event.target)) this._startMotion(event.target, "dodge", 1);
      return;
    }
    // 状態異常だけのブレス（どくのいき・眠りの胞子）が入らなかった相手も、息を避けたように身をかわす（作者の指定）。
    // ダメージのある技や、ブレス以外（青い眼光など）の「MISS」ではかわさない
    if ((event.type === "statusMiss" || event.type === "statusImmune") && event.target &&
        this._isStatusOnlyBreath(this._currentSkill)) {
      if (!this._statusIdleMotion(event.target)) this._startMotion(event.target, "dodge", 1);
      return;
    }
    // スカウトに応じた相手は、レベルアップと同じ動きで喜ぶ（作者の指定。_resolveScoutAction）
    if (event.recruited) {
      this._startMotion(event.recruited, "levelUp", 1);
      return;
    }
    if (event.healAmount && event.revealTarget) {
      this._startMotion(event.revealTarget, "heal", 1);
    }
    // 状態異常を治す技（クレンズ）で治った仲間も、回復と同じ動きをする
    if (event.type === "cure" && event.target) {
      this._startMotion(event.target, "heal", 1);
    }
  };

  /**
   * その技をどの動きで出すか（data/motions.js の motionDefaults.action のキー）。
   *
   * 技の種類（data/skills.js の kind）で決める（RC-1）。
   *   通常攻撃                  … "attack"     踏み込む
   *   共鳴                      … "resonance"  その場で響かせる（まわりに共鳴の演出も出る）
   *   ブレス                    … "breath"     吸い込んでから吐く
   *   自分・味方にかける（共鳴以外）… "buff"   その場で伸び上がる
   *   それ以外（体技・斬撃・踊り）… "technique" 勢いをつけて出す
   * 技側で変えたいときは data/skills.js に motion: "attack" などと1行足せば上書きできる。
   */
  BattleScene.prototype._skillMotionKind = function (skill) {
    if (!skill) return "attack";
    if (skill.motion) return skill.motion;
    if (skill.id === this._normalAttackId()) return "attack";

    if (skill.kind === "resonance") return "resonance";
    if (skill.kind === "breath") return "breath";
    if (skill.target === "self" || skill.target === "ally" || skill.target === "allAllies") return "buff";
    return "technique";
  };

  /**
   * 技の演出を出す。
   *
   * 技を出した時点ではまだ相手に届いていないので、
   * 当たった（外れた／効かなかった）ところで出す。
   * 踏み込みが終わったあとに演出が来るので、順番が自然になる。
   *
   * 形は技の effect、色は技の属性から決まる。
   * effect を書いていない技は、何も出ない。
   */
  BattleScene.prototype._playSkillEffect = function (event) {
    // 技を出した時点で覚えておき、当たった出来事で使う
    if (event.type === "useSkill") {
      this._currentSkill = event.skill || null;
      // 技ごとの音（data/skills.js の se）。書いていない技は、当たったときの hit だけが鳴る
      if (event.skill && event.skill.se) this.game.audio.playSe(event.skill.se);
      // 名前に注意：_currentActor は「いま行動を決めている味方」を返すメソッド。
      // 同じ名前で値を入れるとメソッドを潰してしまう（実際に一度やって戦闘が壊れた）
      this._currentSkillActor = event.actor || null;
      this._centerEffectDone = false;
      return;
    }

    if (!this._currentSkill) return;

    // 範囲の中心に1回だけ出す技（data/skills.js の effectAt: "center"。どくのいき）
    if (this._currentSkill.effectAt === "center") {
      this._playCenterEffect(event);
      return;
    }

    // ダメージの無い状態異常の技（青い眼光など）は damage が来ないので、状態異常の出来事も合図にする
    // 治した出来事は、いまの技で治したときだけ（特性「脱皮」で治ったときに、前の技の演出を出さない）
    if (event.type === "cure" && event.skillId !== this._currentSkill.id) return;
    var statusOnly = isStatusResultEvent(event.type) && !NS.BattleSystem.dealsDamage(this._currentSkill);
    if ((!isHitEvent(event.type) && !statusOnly) || !event.target) return;
    // 威力も持つ弱体の技（ロックスパイク）は、当たった時点でもう演出を出している。弱体で2回目は出さない
    if ((event.type === "modifier" || event.type === "modifierMiss") && NS.BattleSystem.dealsDamage(this._currentSkill)) return;
    // 反動は自分が受けるもの。技の演出は出さない
    if (event.type === "recoil") return;

    var effectId = this._effectIdFor(this._currentSkill, this._currentSkillActor);
    if (!effectId) return;

    var pos = this._monsterCenter(event.target);
    if (!pos) return;

    this.skillEffects.play(effectId, this.game.clock, pos.x, pos.y,
      this._skillEffectColor(this._currentSkill, effectId),
      // 強化は下から上へ、弱体は上から下へ流す
      this._effectDirection(this._currentSkill, event));
  };

  /**
   * 技を出した本人のまわりに出す演出（技の種類で決まる。data/categories.js の skillKind の casterEffect）。
   * いまは共鳴だけ：その場で力を響かせる波紋と、まわりを巡る光の粒。
   * 当たったときの演出（技の effect）とは別で、技を出した瞬間に出る。色は技の属性
   */
  BattleScene.prototype._playCasterEffect = function (skill, actor) {
    if (!actor) return;
    // 技に casterEffect があれば、種類の演出の代わりにそれを出す（死神の鎌の前ぶれ。v1.0.0）
    if (skill && skill.casterEffect) {
      var own = this._monsterCenter(actor);
      if (own) this.skillEffects.play(skill.casterEffect, this.game.clock, own.x, own.y,
        this._skillEffectColor(skill, skill.casterEffect), 1);
      return;
    }
    var kind = this.game.data.getSkillKind ? this.game.data.getSkillKind(skill) : null;
    if (!kind || !kind.casterEffect) return;

    var pos = this._monsterCenter(actor);
    if (!pos) return;
    // 回復の共鳴（キュア）は無属性なので、属性の色だと灰色になる。HPの色（緑）にする
    var color = skill.heal
      ? (((this.game.data.effects || {}).statColors || {}).hp || null)
      : this._skillEffectColor(skill, kind.casterEffect);
    this.skillEffects.play(kind.casterEffect, this.game.clock, pos.x, pos.y, color, 1);
  };

  /**
   * 並び全体の中心に、演出を1回だけ出す（effectAt: "center"）。
   *
   * 1体ずつ出すと、同じ息が3回吐かれたように見えるため。
   * 最初に誰かへ届いた（当たった・外れた・状態異常が入った／入らなかった）瞬間に出す。
   * ダメージの無い技（どくのいき）は damage が来ないので、状態異常の出来事も合図にする。
   */
  BattleScene.prototype._playCenterEffect = function (event) {
    if (this._centerEffectDone || !event.target) return;
    if (!isHitEvent(event.type) && !isStatusResultEvent(event.type)) return;

    var effectId = this._effectIdFor(this._currentSkill, this._currentSkillActor);
    if (!effectId) return;

    var pos = this._rowMiddle(event.target);
    if (!pos) return;

    this._centerEffectDone = true;
    this.skillEffects.play(effectId, this.game.clock, pos.x, pos.y,
      this._skillEffectColor(this._currentSkill, effectId), 1,
      this._skillTargetPoints());
  };

  /**
   * いま見せている技が届く相手全員の位置（全体の型が、ひとりずつに稲妻やつむじ風を出すのに使う）。
   * 次の技を出すまでの出来事から、当たった・外れた相手を拾う（すでに倒れていた相手には出さない）
   */
  BattleScene.prototype._skillTargetPoints = function () {
    var events = this.playbackEvents || [];
    var seen = [];
    var points = [];
    for (var i = this.playbackIndex; i < events.length; i++) {
      var e = events[i];
      if (i > this.playbackIndex && (e.type === "useSkill" || e.type === "battleEnd")) break;
      if (!e.target || seen.indexOf(e.target) >= 0) continue;
      // 特性「放電」などで、出した本人に状態異常が返ってくることがある。本人は技の相手ではない
      if (e.target === this._currentSkillActor) continue;
      if (!isHitEvent(e.type) && !isStatusResultEvent(e.type)) continue;
      seen.push(e.target);
      var pos = this._monsterCenter(e.target);
      if (pos) points.push({ x: pos.x, y: pos.y });
    }
    return points;
  };

  /**
   * その個体が並んでいる段の中心。並びは画面の中央に寄せてあるので、横は画面の真ん中
   */
  BattleScene.prototype._rowMiddle = function (monster) {
    var row = null;
    if (this._viewEnemies().indexOf(monster) >= 0) row = this.layout.enemyRow;
    else if (this._viewAllies().indexOf(monster) >= 0) row = this.layout.allyRow;
    if (!row) return null;

    return { x: this.game.canvas.width / 2, y: row.y + (row.spriteSize || 96) / 2 };
  };

  /**
   * 演出の向き。強化なら 1（下から上）、弱体なら -1（上から下）。
   * 強化・弱体でない技と、威力も持つ弱体の技（ロックスパイク。当てる演出なので）は向きを持たない（1 のまま）。
   */
  BattleScene.prototype._effectDirection = function (skill, event) {
    if (!skill.modifier || NS.BattleSystem.dealsDamage(skill)) return 1;
    return event.raised ? 1 : -1;
  };

  /**
   * どの形の演出を出すか。
   *
   * ふつうは技に書いてある effect。
   * 通常攻撃だけは、出した本人の attackEffect を優先する
   * （噛みつく相手と、硬い体でぶつかる相手で見た目を変えるため）。
   */
  BattleScene.prototype._effectIdFor = function (skill, actor) {
    if (actor && skill.id === this._normalAttackId() && actor.getAttackEffectId) {
      var own = actor.getAttackEffectId();
      if (own) return own;
    }
    return skill.effect;
  };

  /**
   * 演出の色を決める。
   *
   * ふつうの技は属性の色。
   * 強化・弱体の技だけは「何が変わるか」で色を変える
   * （守りなら青、攻撃なら赤…のほうが、属性の色より意味が伝わるため）。
   */
  BattleScene.prototype._skillEffectColor = function (skill, effectId) {
    // 型に色が書いてあれば、それを使う（どくのいきの毒の色など。data/effects.js）
    var shape = effectId ? ((this.game.data.effects || {}).shapes || {})[effectId] : null;
    if (shape && shape.color) return shape.color;

    if (skill.modifier) {
      var color = this._modifierColor(skill.modifier);
      if (color) return color;
    }
    return this._elementColor(skill.element);
  };

  /** 変わるステータスの色（data/effects.js の statColors）。分からなければ null */
  BattleScene.prototype._modifierColor = function (spec) {
    var colors = (this.game.data.effects || {}).statColors || {};
    var effects = (spec && spec.effects) || [];

    for (var i = 0; i < effects.length; i++) {
      var e = effects[i];
      if (e.type === "statMultiplier" || e.type === "statBonus") {
        if (colors[e.stat]) return colors[e.stat];
      }
    }
    // ダメージ倍率を変えるだけの効果は、属性があればその色を使う
    return null;
  };

  /** 技の属性の色。分からなければ null（既定の色になる） */
  BattleScene.prototype._elementColor = function (elementId) {
    var element = (this.game.data.elements || {})[elementId];
    return (element && element.color) || null;
  };

  /**
   * 「技が相手に届いた」出来事か。
   * バフ／デバフ（modifier）もここに含める。掛かった瞬間に演出を出すため。
   */
  function isHitEvent(type) {
    // wardSkill … 味方全体に守りを付ける技（芽吹きの加護）。付いた1体ごとに演出を出す
    // modifierMiss … 弱体が耐性で入らなかった。charge … 力をためた（自分）
    // cure … 状態異常を治した（ディンド・リカバーなど。治した仲間ごとに演出を出す）
    // ppDamage … 相手のPPを減らした（ミステリーダンス）
    return type === "damage" || type === "miss"
        || type === "immune" || type === "modifier" || type === "wardSkill"
        || type === "modifierMiss" || type === "charge" || type === "cure" || type === "ppDamage";
  }

  /** 状態異常だけを付けるブレスか（種類が breath で、ダメージを持たない。どくのいき・眠りの胞子） */
  BattleScene.prototype._isStatusOnlyBreath = function (skill) {
    return !!(skill && skill.kind === "breath" && skill.status && !NS.BattleSystem.dealsDamage(skill));
  };

  /** 状態異常が入った／入らなかった出来事か */
  function isStatusResultEvent(type) {
    return type === "status" || type === "statusMiss" || type === "statusImmune";
  }

  /** その個体が持っている動きを再生する（持っていなければ何もしない） */
  BattleScene.prototype._startMotion = function (monster, kind, facing) {
    if (!monster.getActionMotionId) return;

    var motionId = monster.getActionMotionId(kind);
    if (!motionId) return;

    this.actionMotions.play(monster, motionId, this.game.clock, facing);
  };

  /**
   * 場面ごとの見た目を適用する。
   * 数字の色と大きさ・画面の揺れ・発光をまとめて data/ui.js の styles から決める。
   *
   * @param {string} styleId styles のキー
   * @param {object} monster 対象（数字を出す位置に使う）
   * @param {string} [text] 浮かべる文字。null なら文字は出さない
   */
  BattleScene.prototype._applyStyle = function (styleId, monster, text) {
    var style = this.styles[styleId] || {};

    if (text) {
      var pos = this._monsterScreenPos(monster);
      if (pos) {
        this.floatingText.spawn(pos.x, pos.y, text,
          { color: style.color, font: style.font });
      }
    }

    // 画面の揺れと発光も「エフェクトの濃さ」に従う。
    // 0 のときは何も起きないので、光の点滅が苦手でも遊べる
    var scale = this._effectIntensity();
    if (scale <= 0) return;

    if (style.shake) this.screenEffects.shake(style.shake * scale);
    if (style.flash) this.screenEffects.flash(style.flash, style.flashAlpha * scale);
  };

  /**
   * 設定「エフェクトの濃さ」に対応する倍率。
   * 対応表は data/ui.js の battle.animation.effectScale。
   */
  BattleScene.prototype._effectIntensity = function () {
    var table = this.animation.effectScale;
    var settings = this.game.settings;
    if (!table || !settings) return 1;

    var level = settings.get("effectLevel");
    if (typeof level !== "number") return 1;

    var value = table[Math.max(0, Math.min(table.length - 1, level))];
    return (typeof value === "number") ? value : 1;
  };

  /** 演出を終えて、次の状態へ移る */
  BattleScene.prototype._endPlayback = function () {
    this.viewAllies = null;
    this.viewEnemies = null;

    // 見せ終わったので、表示HP・PPと印を実際の状態に揃えておく
    this.animator.snap(this.allies);
    this.animator.snap(this.enemies);
    this.shownPp = null;
    this._syncModifierMarks();
    // 状態異常の印も個体そのものに戻す（見せきれなかった出来事があってもここで揃う）
    this.shownStatusIds = null;
    // 防御の構えも個体の _defending に戻す
    this.shownGuard = null;
    // このターンの札は、演出が終わったらまとめて消す（v1.0.0）
    this._dismissEffectPopups();
    this._popupActor = null;

    this.phase = "message";   // 決定キーで次のターンへ進む
  };

  /** 画面をマウスで押したか（メッセージ送りに使う） */
  BattleScene.prototype._clickedScreen = function (input) {
    return !!(input.getPointer && input.getPointer().clicked);
  };

  /** メッセージ送り。読み終えたら次の状態へ */
  BattleScene.prototype._updateMessage = function (input) {
    // メッセージはどこを押しても進められる
    if (!input.isPressed("confirm") && !input.isPressed("cancel")
        && !this._clickedScreen(input)) return;

    if (this.messageLog.hasPending()) {
      this.messageLog.advance();
      return;
    }
    this.messageLog.clear();

    // パーティがいっぱいのままスカウトに成功していたら、行き先を選んでもらう
    if (this.pendingScout) {
      this._beginScoutChoice();
      return;
    }

    if (this.system.isOver()) {
      this.phase = "done";
      return;
    }
    this._beginTurnMenu();
  };

  // --- ターンの頭：戦う／逃げる ---

  /**
   * 毎ターンの頭に「戦う／逃げる」を出す。
   * 「戦う」で仲間ごとのコマンドへ。「逃げる」は全員ぶんの行動を逃走にして、そのまま解決する。
   */
  BattleScene.prototype._beginTurnMenu = function () {
    this.commandIndex = 0;
    this.actions = [];
    this._buildTurnMenu();
    this.phase = "turnMenu";

    // 初めての戦闘：「戦う／逃げる」の説明（コマンドの説明は「戦う」を選んでから）
    if (this.game.tutorial) this.tutorial.show(this.game.tutorial.take("turnMenu"));
  };

  BattleScene.prototype._updateTurnMenu = function (input) {
    var result = this.commandMenu.handleInput(input);
    if (!result) return;

    if (result.type === "disabled") {
      this._flashMessage(this.texts.cannotFlee);
      return;
    }
    if (result.type !== "confirm") return;

    if (result.value === "flee") {
      // 逃走はターン全体の行動。誰かひとりでも選べば判定されるが、
      // 失敗したときに他の仲間が動かないよう、全員ぶんを逃走にする
      var slots = this.system.getFieldSlots();
      this.actions = [];
      for (var i = 0; i < slots.length; i++) this.actions.push({ type: "flee" });
      this._resolveTurn();
      return;
    }
    if (result.value === "go") this._beginCommandPhase();
    if (result.value === "tactic") this._beginTacticMember(0);
  };

  // --- 状態を見る ---

  /**
   * 盤面の全員（味方→敵の順）を1体ずつ見る。行動にはならない。
   * 見始めるのは、いま行動を決めている仲間から。
   */
  BattleScene.prototype._beginInspect = function () {
    this._inspectList = this.system.getFieldSlots().concat(this.system.getFieldEnemies());
    this._inspectIndex = Math.max(0, this._inspectList.indexOf(this._currentActor()));
    this.phase = "inspect";
  };

  BattleScene.prototype._updateInspect = function (input) {
    var count = this._inspectList.length;
    if (count > 0) {
      if (input.isPressed("left") || input.isPressed("up")) {
        this._inspectIndex = (this._inspectIndex - 1 + count) % count;
      }
      if (input.isPressed("right") || input.isPressed("down")) {
        this._inspectIndex = (this._inspectIndex + 1) % count;
      }
    }
    // 決定でも取り消しでも戻る（見るだけの画面なので、どちらでも同じ）
    if (input.isPressed("cancel") || input.isPressed("confirm") || this._clickedScreen(input)) {
      this.phase = "command";
    }
  };

  // --- パーティがいっぱいのときのスカウト ---

  /** 仲間になった相手をどう扱うか選ぶ */
  BattleScene.prototype._beginScoutChoice = function () {
    var texts = (this.game.data.messages || {}).scout || {};

    this.commandMenu.setItems([
      { label: texts.choiceSwap    || "swap",    value: "swap" },
      { label: texts.choiceRelease || "release", value: "release" },
      { label: texts.choiceStore   || "store",   value: "store" }
    ]);

    // 見出しは _renderScoutChoice が直接描くので、メッセージ欄は空にしておく
    this.messageLog.clear();
    this.phase = "scoutChoice";
  };

  BattleScene.prototype._updateScoutChoice = function (input) {
    var result = this.commandMenu.handleInput(input);
    // ここは取り消せない（誘いに応じた相手の行き先を必ず決める）
    if (!result || result.type !== "confirm") return;
    if (!this.pendingScout) return;

    this._scoutError = null;  // 選び直したので前回の理由は消す

    switch (result.value) {
      case "swap":    this._beginScoutSwap(); break;
      case "release": this._releaseScout(); break;
      case "store":   this._storeScout(); break;
    }
  };

  /** どの仲間と入れ替えるかを選ぶ */
  BattleScene.prototype._beginScoutSwap = function () {
    var members = this._partyMembers();
    var rows = [];

    for (var i = 0; i < members.length; i++) {
      rows.push({
        type: "entry",
        label: members[i].getName(),
        right: "Lv" + members[i].level + "  HP" + members[i].currentHp + "/" + members[i].getMaxHp(),
        // 番号ではなく個体そのものを覚える（並びがずれても選んだ相手を預けられる）
        value: members[i]
      });
    }

    this._useNormalSubMenu();
    this.subMenu.setRows(rows);
    this.messageLog.clear();
    this.phase = "scoutSwap";
  };

  BattleScene.prototype._updateScoutSwap = function (input) {
    // ScrollList が扱うのは上下移動だけ。決定・取消はここで見る（技・道具の選択と同じ形）
    this.subMenu.handleInput(input);

    if (input.isPressed("cancel")) {
      this._beginScoutChoice();
      return;
    }
    if (!input.isPressed("confirm") && !this.subMenu.clickedEntry(input)) return;

    var selected = this.subMenu.getSelected();
    if (!selected) return;

    this._swapScout(selected.value);
  };

  /**
   * 選んだ仲間を預かり所へ送り、新しい仲間を迎える。
   * @param {object} member 預けるパーティの個体
   */
  BattleScene.prototype._swapScout = function (member) {
    var texts = (this.game.data.messages || {}).scout || {};
    var monster = this.pendingScout;
    if (!monster || !member) return;

    var index = this.game.party.getMembers().indexOf(member);
    var deposited = (index >= 0) ? this.game.depositToStorage(index) : null;
    if (!deposited) {
      // 預けられないので、まだ行き先は決まっていない。選び直してもらう
      this._scoutChoiceFailed(texts.storageFull);
      return;
    }

    this.scoutSystem.join(this.allySource, monster);
    this._recordJoined(monster);

    this._finishScoutChoice(
      fill(texts.swapped, { out: deposited.getName(), "in": monster.getName() }) + "　" +
      fill(texts.swappedNote, { out: deposited.getName() })
    );
  };

  /** 仲間にせず逃がす */
  BattleScene.prototype._releaseScout = function () {
    var texts = (this.game.data.messages || {}).scout || {};
    var monster = this.pendingScout;
    if (!monster) return;

    // 一度は応じてくれたので、図鑑には記録しておく
    if (this.game.discovery) this.game.discovery.markMonsterCaught(monster.speciesId);
    this._finishScoutChoice(fill(texts.released, { name: monster.getName() }));
  };

  /** そのまま拠点の預かり所へ送る */
  BattleScene.prototype._storeScout = function () {
    var texts = (this.game.data.messages || {}).scout || {};
    var monster = this.pendingScout;
    if (!monster) return;

    if (!this.game.storeMonster(monster)) {
      this._scoutChoiceFailed(texts.storageFull);
      return;
    }
    if (this.game.run) this.game.run.recordMonster(monster);
    this._finishScoutChoice(fill(texts.stored, { name: monster.getName() }));
  };

  /**
   * 選んだ行き先へ入れられなかったとき。
   * 相手はまだ宙に浮いたままなので、理由を出して選び直してもらう。
   */
  BattleScene.prototype._scoutChoiceFailed = function (message) {
    this._scoutError = message || null;
    this._beginScoutChoice();
  };

  /** 行き先が決まったので、結果を見せて戦闘を終える */
  BattleScene.prototype._finishScoutChoice = function (message) {
    this.pendingScout = null;
    this._scoutError = null;

    this.messageLog.clear();
    if (message) this.messageLog.push(message);
    this.messageLog.advance();
    this.phase = "message";
  };

  /** 図鑑と挑戦（ラン）へ、仲間になったことを記録する */
  BattleScene.prototype._recordJoined = function (monster) {
    if (this.game.discovery) this.game.discovery.markMonsterCaught(monster.speciesId);
    if (this.game.run) this.game.run.recordMonster(monster);
  };

  /** 味方の一覧（Party でも配列でも扱えるようにする） */
  BattleScene.prototype._partyMembers = function () {
    var source = this.allySource;
    if (source && typeof source.getMembers === "function") return source.getMembers();
    return source || [];
  };

  /** ターンの初めに、盤面の枠の行動を順に決めていく */
  BattleScene.prototype._beginCommandPhase = function () {
    this.commandIndex = 0;
    this.actions = [];
    this.phase = "command";

    // 決められる枠が1つも無ければ、そのままターンが進む
    if (this._advanceChooser()) return;

    this._buildCommandMenu();
    this._showTurnTutorials();
  };

  /**
   * 行動を決められない枠（倒れていて、控えもいない）を飛ばす。
   * 全部の枠が済んだらターンを解決する。
   * @returns {boolean} ターンを解決したか
   */
  BattleScene.prototype._advanceChooser = function () {
    var slots = this.system.getFieldSlots();

    while (this.commandIndex < slots.length &&
           (!this._canChoose(slots[this.commandIndex]) || this._isTacticAi(slots[this.commandIndex]))) {
      // 自動で飛ばした印。取り消しで戻るときの戻り先にしないため。
      // 作戦で動く仲間は、自分の番が来たときに BattleSystem が行動を決める（v1.0.0）
      var auto = this._isTacticAi(slots[this.commandIndex]) ? "tactic" : "skip";
      this.actions.push({ type: auto, auto: true });
      this.commandIndex++;
    }

    if (this.commandIndex >= slots.length) {
      this._resolveTurn();
      return true;
    }
    return false;
  };

  /** 作戦で動く仲間か（倒れている者は、交代を選ぶためにコマンドを聞く） */
  BattleScene.prototype._isTacticAi = function (actor) {
    return !!(actor && !actor.isFainted() && actor.isTacticAi && actor.isTacticAi());
  };

  /** その枠に決めることがあるか。倒れていても、控えがいれば交代を選べる */
  BattleScene.prototype._canChoose = function (actor) {
    if (!actor) return false;
    if (!actor.isFainted()) return true;
    return this._reserveMembers().length > 0;
  };

  /**
   * ターンの頭に出す説明。
   *
   * ★ 戦闘の始まりではなく**ここ**で出す。
   *   コマンド欄が画面に出ているのはこの瞬間からで、
   *   「この項目です」と矢印で指すには、指す相手が見えていないといけない。
   *   読んだ直後にそのコマンドを選べる、という点でも都合がよい。
   */
  BattleScene.prototype._showTurnTutorials = function () {
    var tutorial = this.game.tutorial;
    if (!tutorial) return;

    // 初めての戦闘。コマンドを1つずつ指しながら説明する
    var steps = tutorial.take("battleStart");

    if (this._anyEnemyWeak()) steps = steps.concat(tutorial.take("enemyWeak"));
    if (this._anyAllyHasStatus()) steps = steps.concat(tutorial.take("poisoned"));

    this.tutorial.show(steps);
  };

  /** スカウトを教えるころあいか（盤面に弱った敵がいるか） */
  BattleScene.prototype._anyEnemyWeak = function () {
    // スカウトできない相手（主のうち条件を満たしていないもの）では教えない
    if (!this.allowScout) return false;

    var field = this.system.getFieldEnemies();
    for (var i = 0; i < field.length; i++) {
      if (field[i].isFainted()) continue;
      if (field[i].currentHp / field[i].getMaxHp() <= 0.5) return true;
    }
    return false;
  };

  /** 盤面の味方に状態異常が掛かっているか */
  BattleScene.prototype._anyAllyHasStatus = function () {
    var field = this.system.getFieldAllies();
    for (var i = 0; i < field.length; i++) {
      var defs = field[i].getStatusDefs ? field[i].getStatusDefs() : [];
      if (defs.length > 0) return true;
    }
    return false;
  };

  /** いま行動を決めている枠の仲間（倒れていることもある） */
  BattleScene.prototype._currentActor = function () {
    return this.system.getFieldSlots()[this.commandIndex] || null;
  };

  BattleScene.prototype._updateCommand = function (input) {
    var result = this.commandMenu.handleInput(input);
    if (!result) return;

    // 取り消しで前の仲間の選択に戻る。最初の仲間なら「戦う／逃げる」へ戻る
    if (result.type === "cancel") {
      if (this._isFirstChooser()) this._beginTurnMenu();
      else this._backToPreviousChooser();
      return;
    }
    if (result.type !== "confirm") return;

    switch (result.value) {
      case "attack":
        // 通常攻撃は技を選ばず、そのまま相手を選ぶ
        this.pending = { type: "skill", skillId: this._normalAttackId() };
        this._beginTargetSelect("enemy");
        break;
      case "fight":
        this._buildSkillMenu();
        this.phase = "skill";
        break;
      case "defend":
        // 相手を選ぶ必要がないので、そのまま確定する
        this._commitAction({ type: "defend" });
        break;
      case "scout":
        this.pending = { type: "scout" };
        this._beginTargetSelect("enemy");
        break;
      case "swap":
        this._buildSwapMenu();
        if (!this.subMenu.hasEntries()) {
          this._flashMessage(this.texts.noReserve);
          return;
        }
        this.phase = "swap";
        break;
      case "item":
        this._buildItemMenu();
        if (!this.subMenu.hasEntries()) {
          this._flashMessage(this.texts.noItems);
          return;
        }
        this.phase = "item";
        break;
      case "inspect":
        this._beginInspect();
        break;
      // 倒れている仲間の枠で「そのまま」。何もせず次の仲間の番へ
      case "skip":
        this._commitAction({ type: "skip" });
        break;
    }
  };

  /** いま決めているのが、このターン最初に決める仲間か（自動で飛ばした枠は数えない） */
  BattleScene.prototype._isFirstChooser = function () {
    for (var i = 0; i < this.actions.length; i++) {
      if (!this.actions[i] || !this.actions[i].auto) return false;
    }
    return true;
  };

  BattleScene.prototype._updateSkill = function (input) {
    // 並べ方の切り替え（Q/E・右の並びの札）
    if (input.isPressed("prevTab")) { this._changeBattleSkillSort(-1); return; }
    if (input.isPressed("nextTab")) { this._changeBattleSkillSort(1); return; }
    var pointer = input.getPointer ? input.getPointer() : null;
    if (pointer && pointer.clicked && this._skillSortRect && NS.Panel.containsPoint(this._skillSortRect, pointer)) {
      this._changeBattleSkillSort(1);
      return;
    }

    this.subMenu.handleInput(input);

    if (input.isPressed("cancel")) {
      this.phase = "command";
      return;
    }
    if (!input.isPressed("confirm") && !this.subMenu.clickedEntry(input)) return;

    var selected = this.subMenu.getSelected();
    if (!selected) return;

    // PPが足りない技は選べない
    var skill = this.game.data.getSkill(selected.value);
    if (skill && !this._canAfford(this._currentActor(), skill)) {
      this._flashMessage(this.texts.notEnoughPp);
      return;
    }

    // 自分にかける技と範囲全体の技（相手全体・味方全体）は相手を選ばない。そのまま確定する
    if (skill && (skill.target === "self" || skill.target === "allEnemies" || skill.target === "allAllies")) {
      this._commitAction({ type: "skill", skillId: selected.value });
      return;
    }

    this.pending = { type: "skill", skillId: selected.value };
    // 味方にかける技（キュアなど）は、狙う先が向かい側ではなくこちら側になる。
    // 選ぶ仕組みは道具のときと同じものを使い回している
    this._beginTargetSelect(skill && skill.target === "ally" ? "ally" : "enemy", "skill");
  };

  /**
   * 交代する相手を選ぶ。
   * 交代はその仲間のこのターンの行動になる（選んだ本人は動かない）。
   */
  BattleScene.prototype._updateSwap = function (input) {
    this.subMenu.handleInput(input);

    if (input.isPressed("cancel")) {
      this.phase = "command";
      return;
    }
    if (!input.isPressed("confirm") && !this.subMenu.clickedEntry(input)) return;

    var selected = this.subMenu.getSelected();
    // 選べる相手がいなければ、ここで詰まらせずにコマンドへ戻す
    if (!selected) {
      this._flashMessage(this.texts.noReserve);
      this.phase = "command";
      return;
    }

    this._commitAction({ type: "swap", incoming: selected.value });
  };

  BattleScene.prototype._updateItem = function (input) {
    this.subMenu.handleInput(input);

    if (input.isPressed("cancel")) {
      this.phase = "command";
      return;
    }
    if (!input.isPressed("confirm") && !this.subMenu.clickedEntry(input)) return;

    var selected = this.subMenu.getSelected();
    if (!selected) return;

    var item = this.game.data.getItem(selected.value);
    var action = { type: "item", itemId: selected.value,
                   itemName: item ? item.name : selected.value };

    // 相手を選ばない道具（誘いの香）は、そのまま行動に決める
    if (!this.itemUsage.needsTarget(selected.value)) {
      this._commitAction(action);
      return;
    }
    this.pending = action;
    this._beginTargetSelect("ally", "item");   // 回復なので味方を選ぶ
  };

  /**
   * カーソルが乗っている盤面の相手（乗っていなければ -1）。
   * 絵と状態表示のどちらに重ねても選べるようにしてある。
   *
   * @param {string} side "enemy" / "ally"
   * @param {number} count その側に並んでいる数
   */
  BattleScene.prototype._hoveredMember = function (input, side, count) {
    if (!input.getPointer || count <= 0) return -1;

    var pointer = input.getPointer();
    if (!pointer.inside) return -1;
    if (!pointer.moved && !pointer.clicked) return -1;

    var row = (side === "enemy") ? this.layout.enemyRow : this.layout.allyRow;
    if (!row) return -1;

    for (var i = 0; i < count; i++) {
      if (NS.Panel.containsPoint(this._memberRect(i, count, row), pointer)) return i;
    }
    return -1;
  };

  /**
   * 盤面の1体分の当たり判定（絵の上端から状態表示の下端まで）。
   * 位置の求め方は _renderSide と同じにしてある。
   */
  BattleScene.prototype._memberRect = function (index, count, row) {
    var canvasWidth = this.game.canvas.width;
    var startX = (canvasWidth - row.slotGap * count) / 2;
    var centerX = startX + row.slotGap * index + row.slotGap / 2;

    var width = Math.max(row.statusW, row.spriteSize);
    return {
      x: centerX - width / 2,
      y: row.y,
      w: width,
      h: (row.statusY + row.statusH) - row.y
    };
  };

  /**
   * 相手を選ぶ状態に入る。
   * @param {string} side "enemy" / "ally"
   * @param {string} [returnPhase] 取り消したときに戻る状態（省略時はコマンド選択）
   */
  BattleScene.prototype._beginTargetSelect = function (side, returnPhase) {
    this.targetSide = side;
    this.targetReturnPhase = returnPhase || "command";
    this.phase = "target";

    // 先頭が倒れていることがある（味方側）ので、狙える最初の相手から始める
    var candidates = this._targetCandidates();
    this.targetIndex = 0;
    if (candidates.length > 0 && !this._canTarget(candidates[0])) {
      this.targetIndex = this._nextTargetIndex(candidates, 0, 1);
    }
  };

  /**
   * 狙える相手の並び。画面に並んでいる順そのもの。
   * 味方側は枠ごと（倒れた仲間も並ぶ）にしてある。
   * 生きている者だけにすると、絵の位置と番号がずれてしまう
   */
  BattleScene.prototype._targetCandidates = function () {
    return (this.targetSide === "enemy")
      ? this.system.getFieldEnemies()
      : this.system.getFieldSlots();
  };

  /**
   * その相手に、いま決めている行動を向けられるか（倒れた仲間には向けられない）。
   * 蘇生の道具（神鳥の羽。v1.0.0）を使うときだけは逆で、倒れた仲間にしか向けられない
   */
  BattleScene.prototype._canTarget = function (monster) {
    if (!monster) return false;
    if (this.pending && this.pending.type === "item" && this.itemUsage.isRevive(this.pending.itemId)) {
      return monster.isFainted() && !monster._undying;
    }
    return !monster.isFainted();
  };

  /** 狙える相手まで、向き（+1 / -1）へ進めた番号。ぐるっと回っても無ければそのまま */
  BattleScene.prototype._nextTargetIndex = function (candidates, from, direction) {
    var count = candidates.length;
    for (var step = 1; step <= count; step++) {
      var index = (from + direction * step + count) % count;
      if (this._canTarget(candidates[index])) return index;
    }
    return from;
  };

  BattleScene.prototype._updateTarget = function (input) {
    var candidates = this._targetCandidates();

    // 相手は横一列に並んでいるので、左右で選ぶ。
    // 上下でも動くようにしてあるのは、コマンドを上下で選んだ直後に
    // 手が同じ動きをしても「反応しない」と感じずに済むため
    if (candidates.length > 0) {
      if (input.isPressed("left") || input.isPressed("up")) {
        this.targetIndex = this._nextTargetIndex(candidates, this.targetIndex, -1);
      }
      if (input.isPressed("right") || input.isPressed("down")) {
        this.targetIndex = this._nextTargetIndex(candidates, this.targetIndex, 1);
      }
    }

    // マウス：相手に重ねると狙いが移り、押すとその相手に決まる
    var hovered = this._hoveredMember(input, this.targetSide, candidates.length);
    if (hovered >= 0 && !this._canTarget(candidates[hovered])) hovered = -1;
    if (hovered >= 0) this.targetIndex = hovered;

    if (input.isPressed("cancel")) {
      this.phase = this.targetReturnPhase || "command";
      return;
    }

    var clicked = hovered >= 0 && input.getPointer && input.getPointer().clicked;
    if (!input.isPressed("confirm") && !clicked) return;
    // 狙える相手が1人もいないときは決められない
    if (!this._canTarget(candidates[this.targetIndex])) return;

    var action = this.pending || {};
    action.targetIndex = this.targetIndex;
    action.targetSide = this.targetSide;
    // 並びがずれても狙った相手を攻撃できるよう、個体そのものも覚えておく
    action.target = candidates[this.targetIndex] || null;
    this._commitAction(action);
  };

  /**
   * 取り消しで、前に決めた仲間へ戻る。
   * 自動で飛ばした枠（倒れていて控えもいない）は戻り先にならない。
   */
  BattleScene.prototype._backToPreviousChooser = function () {
    if (this.commandIndex <= 0) return;

    while (this.commandIndex > 0) {
      this.commandIndex--;
      var popped = this.actions.pop();
      if (!popped || !popped.auto) break;
    }
    // 先頭まで戻ってもそこが飛ばす枠なら、決められる枠まで進め直す
    if (this._advanceChooser()) return;
    this._buildCommandMenu();
  };

  /** 1体分の行動を確定し、全員決まったらターンを解決する */
  BattleScene.prototype._commitAction = function (action) {
    this.actions.push(action);
    this.pending = null;
    this.commandIndex++;

    // スカウトを選んだら、まだ指示していない仲間を待たずにターンを締め切る。
    // そのため1ターンに誘えるのは1回だけになる。
    //
    // ここで決めた他の仲間の行動がどうなるかは BattleSystem 側で決まる。
    // 実際に効くのは防御だけで、その理由と、そこから生まれる小技については
    // BattleSystem._buildTurnOrder のコメントを参照。
    if (action.type === "scout") {
      this._resolveTurn();
      return;
    }

    // 次に決められる枠へ。無ければここでターンが解決される
    if (this._advanceChooser()) return;

    this.phase = "command";
    this._buildCommandMenu();
  };

  /** 全員の行動を素早さ順に解決し、その結果を1つずつ見せる */
  BattleScene.prototype._resolveTurn = function () {
    // 計算前の並びを控えておく（倒れた相手も演出中はその場に残すため）。
    // 味方は枠を写す。交代を見せた瞬間に、この写しの中身を入れ替える（_showSwap）
    this.snapshotAllies = this.system.getFieldSlots().slice();
    this.snapshotEnemies = this.system.getFieldEnemies();

    // 計算前のHPも控えておく。計算はここで一気に終わるので、
    // これが無いと攻撃を見せる前にHPバーが減ってしまう
    this.snapshotHp = this._captureHp();
    this.snapshotPp = this._capturePp();
    // 状態異常の印も同じ（掛かる出来事を見せる前に、印だけ先に出ないように）
    this._captureStatusMarks();

    this._turnCount++;
    var events = this.system.takeTurn(this.actions);

    // 勝ったときだけ、報酬（ゴールド・ドロップ）を渡す
    if (this.system.isOver() && this.system.getResult() === "win") {
      this._awardGold(events);
      this._awardDrops(events);
    }

    this._startPlayback(events);
  };

  /**
   * 倒した敵のゴールドを渡す。
   * 量は個体が計算する（レベルが高い相手ほど多い）。
   */
  BattleScene.prototype._awardGold = function (events) {
    var texts = (this.game.data.messages || {}).battle || {};
    var total = 0;

    for (var i = 0; i < this.enemies.length; i++) {
      var enemy = this.enemies[i];
      if (typeof enemy.getGoldReward === "function") total += enemy.getGoldReward();
    }
    if (total <= 0) return;

    var gained = this.game.giveGold(total);
    events.push({ type: "custom", text: fill(texts.goldGained, { amount: gained }) });
  };

  /**
   * 倒した敵のドロップを持ち物へ加える。
   * 判定は DropSystem、持ち物と図鑑への反映は game.giveItem に任せる。
   */
  BattleScene.prototype._awardDrops = function (events) {
    var texts = (this.game.data.messages || {}).battle || {};
    var drops = this.dropSystem.rollForGroup(this.enemies);

    for (var i = 0; i < drops.length; i++) {
      var item = this.game.data.getItem(drops[i].itemId);
      var name = item ? item.name : drops[i].itemId;

      var added = this.game.giveItem(drops[i].itemId, drops[i].count);
      if (added > 0) {
        events.push({ type: "custom", text: fill(texts.itemDropped,
          { name: name, count: added }) });
      } else {
        // 持ち物がいっぱいで入らなかった場合も、拾えなかったことを知らせる
        events.push({ type: "custom", text: fill(texts.dropLost, { name: name }) });
      }
    }
  };

  /**
   * 技以外の行動（道具・スカウト）を、行動順が回ってきたときに処理する。
   * BattleSystem から呼ばれる。
   */
  BattleScene.prototype._performNonSkillAction = function (step, events) {
    var action = step.action;
    if (action.type === "item") this._resolveItemAction(step, events);
    else if (action.type === "scout") this._resolveScoutAction(step, events);
    else if (action.type === "swap") this._resolveSwapAction(step, events);
  };

  /**
   * 交代する。
   *
   * 盤面の枠（BattleSystem.slots）の中身を入れ替え、
   * パーティの並びも同じように入れ替える（戦闘後もこの並びで残る）。
   * 交代した本人はこのターン動かない（交代が行動そのもの）。
   *
   * 出来事には出ていく者と入る者を持たせる。
   * 画面はこの出来事を見せた瞬間に、絵・HP・PPを入った者のものに切り替える（_showSwap）
   */
  BattleScene.prototype._resolveSwapAction = function (step, events) {
    var party = this.allySource;
    var incoming = step.action.incoming;
    var outgoing = step.actor;

    if (!party || typeof party.swap !== "function" || !incoming || !outgoing) {
      events.push({ type: "custom", text: this.texts.swapFailed });
      return;
    }

    var members = this._partyMembers();
    var from = members.indexOf(outgoing);
    var to = members.indexOf(incoming);

    if (from < 0 || to < 0 || !this.system.replaceSlot(outgoing, incoming)) {
      events.push({ type: "custom", text: this.texts.swapFailed });
      return;
    }
    party.swap(from, to);

    events.push({
      type: "custom",
      text: fill(this.texts.swapped, { out: outgoing.getName(), "in": incoming.getName() }),
      swapOut: outgoing, swapIn: incoming
    });
  };

  /**
   * 交代の出来事を見せた瞬間に、画面の並びを入れ替える。
   * こうしないと、演出が終わるまで下がった者の絵とHPが残ってしまう。
   */
  BattleScene.prototype._showSwap = function (event) {
    var view = this.viewAllies;
    if (!view) return;

    var index = view.indexOf(event.swapOut);
    if (index >= 0) view[index] = event.swapIn;
  };

  BattleScene.prototype._resolveItemAction = function (step, events) {
    var action = step.action;

    // 誘いの香は相手を持たない。この戦闘のスカウトのほうに効く
    if (this._isScoutBoostItem(action.itemId)) {
      this._resolveScoutBoost(step, events);
      return;
    }
    // 選んだ個体そのものを優先する（番号は枠の番号で、倒れた枠が混ざる）
    var target = action.target
              || this.system.getFieldSlots()[action.targetIndex]
              || this.system.getFieldAllies()[0];
    if (!target) return;

    events.push({ type: "custom", text: fill(this.texts.itemUsed,
      { actor: step.actor.getName(), item: action.itemName }) });

    var result = this.itemUsage.use(action.itemId, target, this.game.inventory);
    if (!result.success) {
      // 選んだあと、使う番までに相手が倒された（道具は減らない）
      var text = (result.reason === "fainted")
        ? fill(this.texts.itemTargetFainted, { name: target.getName() })
        : this.texts.itemNoEffect;
      events.push({ type: "custom", text: text });
      return;
    }

    // 文は効果の種類ごとに違う（HP回復・PP回復・状態異常を治す）
    var healed = this.texts.itemHealed || {};
    var template = healed[result.effectType] || healed.default || "";
    // 回復の音は、HP・PP・状態異常のどれを治しても同じ
    var event = {
      type: "custom",
      text: fill(template, { name: target.getName(), amount: result.amount }),
      se: "heal"
    };

    // 緑の回復表示とHPバーの反映は、HPを回復したときだけ。
    // 解毒草でHPが増えたように見せてはいけない
    if (NS.ItemUsage.healsHp(result.effectType)) {
      event.revealTarget = target;
      event.revealHp = target.currentHp;
      event.healAmount = result.amount;
    }
    // PPを戻す道具（精気の実）は、この文を見せた瞬間にPPバーを増やす
    if (result.effectType === "healPp") {
      event.ppTarget = target;
      event.ppValue = target.currentPp;
    }
    // 状態異常を治す道具は、この文を見せた瞬間に印を消す（治ったあとの中身をまるごと渡す）
    if (result.effectType === "cureStatus" && target.getStatusDefs) {
      var left = target.getStatusDefs();
      event.statusTarget = target;
      event.statusIds = [];
      for (var s = 0; s < left.length; s++) event.statusIds.push(left[s].id);
    }
    events.push(event);
  };

  /** スカウトしやすくする道具か（data/items.js の effect.type "scoutBoost"） */
  BattleScene.prototype._isScoutBoostItem = function (itemId) {
    var item = this.game.data.getItem(itemId);
    return !!(item && item.effect && item.effect.type === "scoutBoost");
  };

  /**
   * 誘いの香を使う。次のターンから、この戦闘のあいだスカウトの成功率に倍率が掛かる。
   * もう漂っているときは使わない（道具も減らない）。
   */
  BattleScene.prototype._resolveScoutBoost = function (step, events) {
    var texts = (this.game.data.messages || {}).scout || {};
    var item = this.game.data.getItem(step.action.itemId);

    events.push({ type: "custom", text: fill(this.texts.itemUsed,
      { actor: step.actor.getName(), item: step.action.itemName }) });

    if (this.scoutBoost) {
      events.push({ type: "custom", text: texts.boostAlready || this.texts.itemNoEffect });
      return;
    }
    if (!this.game.inventory || !this.game.inventory.has(item.id, 1)) {
      events.push({ type: "custom", text: this.texts.itemNoEffect });
      return;
    }

    this.game.inventory.remove(item.id, 1);
    this.scoutBoost = {
      multiplier: item.effect.multiplier || 1,
      // このターンの残りの行動には効かせない（「次のターンから」）
      fromTurn: this._turnCount + 1
    };
    events.push({ type: "custom", text: texts.boostStart || "", se: "heal" });
  };

  /** いまのスカウトに掛かる道具の倍率（ScoutSystem.roll の item に渡す形）。効いていなければ null */
  BattleScene.prototype._scoutItemBonus = function () {
    var boost = this.scoutBoost;
    if (!boost || this._turnCount < boost.fromTurn) return null;
    return { scoutMultiplier: boost.multiplier };
  };

  /**
   * 誘いに応じた相手を、仲間として加える形にして返す。
   *
   * ふつうは戦っていた個体をそのまま連れて行く。
   * scoutLevel が指定されていて、いま戦っているレベルより低い場合だけ、
   * そのレベルの個体として作り直す（ボスをそのまま仲間にすると強すぎるため）。
   * 性格と個体値は戦った個体のものを引き継ぐので、「その一体を捕まえた」感じは残る。
   */
  BattleScene.prototype._recruitFrom = function (target) {
    var level = this.scoutLevel;
    if (level === undefined || level === null || !(level < target.level)) {
      // 敵のときだけ使っていた技（data/monsters.js の enemySkills）を、覚える技の一覧に戻す
      if (target.useLearnedSkills) target.useLearnedSkills();
      return target;
    }

    var recruit = new NS.MonsterInstance(target.speciesId, level, this.game.data, {
      nature: target.natureId,
      ivs: target.ivs
    });
    // 種族が見つからないなど、作れなかったときは元の個体をそのまま渡す
    return recruit.getSpecies() ? recruit : target;
  };

  /**
   * まだ誘えない相手か（種族の scoutableWhen。v1.0.0 シニガミ）。
   *   { storyComplete: true } … ストーリーを全部クリアしたあと（Game.isStoryComplete）
   */
  BattleScene.prototype._scoutLocked = function (target) {
    var species = target && target.getSpecies ? target.getSpecies() : null;
    var when = species && species.scoutableWhen;
    if (!when) return false;
    if (when.storyComplete && !(this.game.isStoryComplete && this.game.isStoryComplete())) return true;
    return false;
  };

  BattleScene.prototype._resolveScoutAction = function (step, events) {
    var action = step.action;
    var texts = (this.game.data.messages || {}).scout || {};
    var target = this.system.getFieldEnemies()[action.targetIndex]
              || this.system.getFieldEnemies()[0];
    if (!target) return;

    var party = this.allySource;

    events.push({ type: "custom", text: fill(texts.attempt,
      { actor: step.actor.getName(), name: target.getName() }) });

    // 誘える時期が決まっている種族（シニガミ：ストーリーを全部クリアしたあと）は、それまで必ず断られる
    if (this._scoutLocked(target)) {
      events.push({ type: "custom", text: fill(texts.locked || texts.refused || "",
        { name: target.getName() }) });
      return;
    }

    // 応じてくれるかどうかは、パーティの空きに関係なく判定する。
    // いっぱいだった場合は、どう扱うかを演出のあとで選んでもらう。
    // 誘いの香が効いていれば、その倍率を道具として渡す（data/scout.js の式の「道具の倍率」）
    var result = this.scoutSystem.roll(target, { item: this._scoutItemBonus() });
    if (!result.success) {
      events.push({ type: "custom", text: fill(texts.refused, { name: target.getName() }) });
      return;
    }

    // recruited … この文を見せる瞬間に、応じた相手がレベルアップと同じ動きで喜ぶ（_playActionMotion）。
    // 敵の段からはこのあと取り除くが、演出の間は始めの並び（snapshotEnemies）で描くので姿は残っている
    events.push({ type: "custom", text: fill(texts.success, { name: target.getName() }),
      recruited: target });

    // 仲間になるのは、戦っていた個体そのものとは限らない（ボスはレベルを下げる）。
    // そのことは画面には出さない。仲間の一覧を見ればレベルは分かる
    var recruit = this._recruitFrom(target);

    if (this.scoutSystem.isFull(party)) {
      // 加える先は選んでもらうので、ここではまだパーティに入れない
      this.pendingScout = recruit;
      events.push({ type: "custom", text: texts.partyFull });
    } else {
      this.scoutSystem.join(party, recruit);
      this._recordJoined(recruit);
    }

    // 仲間になった相手は敵ではなくなり、その場で戦闘が終わる
    this.system.removeEnemy(target);

    // 戦闘中だけの印を消しておく。
    // 特に _removed を残すと、この仲間は次の戦闘から行動しなくなる
    target.displaySuffix = null;
    target._removed = false;
    target._defending = false;
    this.system.finishWith("scouted");
    if (texts.battleEnd) events.push({ type: "custom", text: texts.battleEnd });
  };

  /** 選択中に「できない」と知らせるメッセージだけ出す（行動は決めない）。決定音の代わりに失敗の音 */
  BattleScene.prototype._flashMessage = function (text) {
    if (!text) return;
    this.messageLog.push(text);
    this.messageLog.advance();
    if (this.game.playError) this.game.playError();
  };

  BattleScene.prototype._showNextMessage = function () {
    this.messageLog.advance();
    this.phase = "message";
  };

  /**
   * 戦闘終了後の遷移。
   * onFinish が true を返した場合は「呼び出し側が遷移を処理した」とみなす。
   */
  BattleScene.prototype._updateDone = function () {
    // 初めて勝ったときの締めのひとこと。
    // 画面を移る前に出す（移ってしまうと、この戦いの流れから切り離される）
    if (this.system.getResult() === "win" && this.game.tutorial) {
      var steps = this.game.tutorial.take("battleWon");
      if (steps.length > 0) {
        this.tutorial.show(steps);
        return;   // 読み終わるまで待つ。次のフレームでここへ戻ってくる
      }
    }

    var handled = this.onFinish ? this.onFinish(this.system.getResult()) : false;
    if (!handled) this.game.scenes.change(this.returnScene);
  };

  // --- 描画 ---

  /**
   * いま戦っている場所の背景設定を探す。
   * 挑戦中のダンジョン → そのテーマ → battle の順にたどる。
   * どこかで途切れたら null（共通の色で描く）。
   */
  BattleScene.prototype._findScenery = function () {
    var run = this.game.run;
    var dungeon = run && run.dungeon;
    if (!dungeon || !dungeon.theme) return null;

    var theme = (this.game.data.dungeonThemes || {})[dungeon.theme];
    return (theme && theme.battle) || null;
  };

  /**
   * 戦っている場所の背景を描く。
   * 場所ごとの設定が無ければ、今までどおり1色で塗りつぶす。
   */
  BattleScene.prototype._renderScenery = function (ctx, w, h, L) {
    var scenery = this.scenery;
    if (!scenery) {
      this.renderer.clear(L.background || "#000000", w, h);
      return;
    }

    var gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, scenery.gradientTop || L.background || "#000000");
    gradient.addColorStop(1, scenery.gradientBottom || L.background || "#000000");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // 立っている地面。上端に線を引いて、奥と手前を分ける
    if (scenery.groundY !== undefined && scenery.groundColor) {
      ctx.fillStyle = scenery.groundColor;
      ctx.fillRect(0, scenery.groundY, w, h - scenery.groundY);
      if (scenery.edgeColor) {
        ctx.fillStyle = scenery.edgeColor;
        ctx.fillRect(0, scenery.groundY, w, 1);
      }
    }

    if (this.sceneryParticles) this.sceneryParticles.render(ctx);
  };

  BattleScene.prototype.render = function (ctx) {
    var w = this.game.canvas.width;
    var h = this.game.canvas.height;
    var L = this.layout;

    this._renderScenery(ctx, w, h, L);

    // 技の演出のうち「体の後ろ」に回る部分（共鳴の奥の粒など）は、モンスターより先に描く
    this.skillEffects.render(ctx, this.game.clock, "back");

    // 揺れは盤面だけに掛ける（メッセージ欄まで揺れると読みにくいため）
    this.screenEffects.begin(ctx);
    this._renderSide(this._viewEnemies(), L.enemyRow, w, "enemy");
    this._renderSide(this._viewAllies(), L.allyRow, w, "ally");
    this.screenEffects.end(ctx);

    // 技の演出は、モンスターより手前・メッセージ欄より奥に描く（奥の層は上で描いた）
    this.skillEffects.render(ctx, this.game.clock, "front");

    if (this.phase === "command") this._renderCommand();
    else if (this.phase === "turnMenu") this._renderTurnMenu();
    else if (this.phase === "inspect") this._renderInspect();
    else if (this.phase === "skill" || this.phase === "item" || this.phase === "swap" ||
             this.phase === "tacticMember" || this.phase === "tacticPick") {
      this._renderSubMenu();
    }
    else if (this.phase === "scoutChoice") this._renderScoutChoice();
    else if (this.phase === "scoutSwap") this._renderScoutSwap();
    else {
      // 送り待ちのときは「▼」を出す
      this.messageLog.waiting = this.playbackWaiting;
      this.messageLog.render();
    }

    // 浮かぶ数字は一番手前に描く
    this.floatingText.render(ctx);

    // 発動した強化・弱体・特性・加護の札（画面上部）
    this._renderEffectPopups(ctx, w);

    // 発光は画面全体に重ねる
    this.screenEffects.renderOverlay(ctx, w, h);

    // レベルアップの結果（画面中央）。説明より下
    this._renderLevelResult(ctx, w, h);

    // 説明はすべての上。読んでいる間は他を触れない
    this.tutorial.render();
  };

  // --- レベルアップの結果（画面中央の窓） ---

  /** 能力の並び（data/messages.js の battleUi.popupStats の名前で出す） */
  var LEVEL_RESULT_STATS = ["hp", "attack", "defense", "speed", "pp"];

  /** levelUp の出来事から、窓に出す中身を作って並べる */
  BattleScene.prototype._queueLevelResult = function (event) {
    if (!event.statsBefore || !event.statsAfter) return;
    this.levelResults.push({
      name: event.actorName, from: event.fromLevel, to: event.toLevel,
      before: event.statsBefore, after: event.statsAfter,
      learned: event.learnedNames || []
    });
  };

  /** 決定・Esc・クリックで閉じる。次の仲間の結果があれば続けて出す */
  BattleScene.prototype._updateLevelResult = function (input) {
    if (input.isPressed("confirm") || input.isPressed("cancel") || this._clickedScreen(input)) {
      this.levelResults.shift();
    }
  };

  BattleScene.prototype._renderLevelResult = function (ctx, w, h) {
    var result = this.levelResults[0];
    if (!result) return;

    var L = this.layout.levelResult || {};
    var t = this.theme;
    var lh = L.lineHeight || 24;
    var pad = L.padding || 16;
    var labels = this.texts.popupStats || {};

    // 行数：見出し・空き・能力5つ・（空き・覚えた技の見出し・技の数）・空き・ヒント
    var rows = 2 + LEVEL_RESULT_STATS.length + 2;
    if (result.learned.length > 0) rows += 2 + result.learned.length;
    var boxW = L.w || 360;
    var rect = { x: Math.round((w - boxW) / 2), y: L.y || 100, w: boxW, h: pad * 2 + rows * lh };

    // 後ろを少し暗くして、窓に目を向けさせる
    if (L.dim) {
      ctx.fillStyle = L.dim;
      ctx.fillRect(0, 0, w, h);
    }
    if (L.background) {
      ctx.fillStyle = L.background;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    this.panel.drawBox(rect);

    var x = rect.x + pad;
    var y = rect.y + pad + lh - 6;

    this.panel.drawText(fill(this.texts.levelResultTitle, {
      name: result.name, from: result.from, to: result.to
    }), x, y, { font: t.font, color: t.cursorColor });
    y += lh * 2;

    for (var i = 0; i < LEVEL_RESULT_STATS.length; i++) {
      var key = LEVEL_RESULT_STATS[i];
      var before = result.before[key] || 0;
      var after = result.after[key] || 0;
      var diff = after - before;
      var color = diff > 0 ? t.textColor : (L.sameColor || t.subTextColor);

      this.panel.drawText(labels[key] || key, x, y, { color: color });
      this.panel.drawText(fill(this.texts.levelResultStat, { before: before, after: after }),
        x + (L.labelWidth || 96), y, { color: color });
      if (diff > 0) {
        this.panel.drawText(fill(this.texts.levelResultUp, { n: diff }),
          x + (L.labelWidth || 96) + (L.numberWidth || 150), y, { color: L.upColor || t.textColor });
      }
      y += lh;
    }

    if (result.learned.length > 0) {
      y += lh;
      this.panel.drawText(this.texts.levelResultLearned || "", x, y, { color: t.subTextColor });
      y += lh;
      for (var s = 0; s < result.learned.length; s++) {
        this.panel.drawText("・" + result.learned[s], x + 12, y, { color: L.skillColor || t.textColor });
        y += lh;
      }
    }

    y += lh;
    this.panel.drawText(this.texts.levelResultHint || "", rect.x + rect.w - pad, y,
      { font: t.smallFont, color: t.hintColor, align: "right" });
  };

  /**
   * 画面に並べる顔ぶれ。
   * 演出中は開始時の並びを使い、倒れた相手もその場に残して見せる。
   */
  BattleScene.prototype._viewAllies = function () {
    return this.viewAllies || this.system.getFieldSlots();
  };
  BattleScene.prototype._viewEnemies = function () {
    return this.viewEnemies || this.system.getFieldEnemies();
  };

  /**
   * 指定モンスターの画面上の位置（スプライトの中央あたり）。
   * ダメージ表示を出す場所に使う。
   */
  BattleScene.prototype._monsterScreenPos = function (monster) {
    if (!monster) return null;
    var w = this.game.canvas.width;

    var enemies = this._viewEnemies();
    var index = enemies.indexOf(monster);
    if (index >= 0) return this._slotPos(this.layout.enemyRow, enemies.length, index, w);

    var allies = this._viewAllies();
    index = allies.indexOf(monster);
    if (index >= 0) return this._slotPos(this.layout.allyRow, allies.length, index, w);

    return null;
  };

  /**
   * 指定モンスターの絵の中央。技の演出を出す場所に使う。
   * 数字は頭の上に出すが、演出は体の真ん中から出したいので分けてある。
   */
  BattleScene.prototype._monsterCenter = function (monster) {
    if (!monster) return null;
    var w = this.game.canvas.width;

    var enemies = this._viewEnemies();
    var index = enemies.indexOf(monster);
    if (index >= 0) return this._rowCenter(this.layout.enemyRow, enemies.length, index, w);

    var allies = this._viewAllies();
    index = allies.indexOf(monster);
    if (index >= 0) return this._rowCenter(this.layout.allyRow, allies.length, index, w);

    return null;
  };

  BattleScene.prototype._rowCenter = function (row, count, index, canvasWidth) {
    if (!row || count <= 0) return null;

    var startX = (canvasWidth - row.slotGap * count) / 2;
    return {
      x: startX + row.slotGap * index + row.slotGap / 2,
      y: row.y + (row.spriteSize || 96) / 2
    };
  };

  /**
   * 並びの中の1体分の位置を求める。
   * 数字はスプライトに重ならないよう、頭のすぐ上から出す
   * （離れすぎると誰への表示か分からなくなるため、少しだけ上）。
   */
  BattleScene.prototype._slotPos = function (row, count, index, canvasWidth) {
    if (!row || count <= 0) return null;

    var popup = this.animation.popup || {};
    var startX = (canvasWidth - row.slotGap * count) / 2;

    return {
      x: startX + row.slotGap * index + row.slotGap / 2,
      y: row.y + (popup.spawnOffsetY || 0)
    };
  };

  /**
   * 片側の並びを描く。人数に応じて中央に寄せる。
   */
  BattleScene.prototype._renderSide = function (members, row, canvasWidth, side) {
    if (!row) return;

    var count = members.length;
    if (count === 0) return;

    var totalWidth = row.slotGap * count;
    var startX = (canvasWidth - totalWidth) / 2;

    for (var i = 0; i < count; i++) {
      var centerX = startX + row.slotGap * i + row.slotGap / 2;
      this._renderMember(members[i], centerX, row, side, i);
    }
  };

  BattleScene.prototype._renderMember = function (monster, centerX, row, side, index) {
    var t = this.theme;

    // 種族ごとの大きさ（data/monsters.js の sizeScale）。竜のような相手は大きく出る
    var base = row.spriteSize;
    var size = Math.round(base * (monster.getSizeScale ? monster.getSizeScale() : 1));

    // HPバーは実際の値ではなく「見た目のHP」で描くので、少しずつ減っていく
    var shownHp = Math.max(0, Math.round(this.animator.getHp(monster)));

    var action = this.actionMotions.get(monster, this.game.clock);
    if (this._shouldShowSprite(monster, shownHp, action)) {
      // 下端をそろえて上へ伸ばす。こうしないと大きい相手が状態表示に食い込む
      var top = row.y + (base - size);
      this._renderMemberSprite(monster, centerX - size / 2, top, size, action);
    }

    // 状態表示（名前・Lv・HP）
    var rect = { x: centerX - row.statusW / 2, y: row.statusY,
                 w: row.statusW, h: row.statusH };
    this.panel.drawBox(rect);

    var origin = this.panel.innerOrigin(rect);
    // 倒れて枠に残っている仲間は、名前を薄くして「いま戦えない」と分かるようにする
    var fallen = (side === "ally") && shownHp <= 0 && monster.isFainted();
    this.panel.drawText(monster.getName(), origin.x, origin.y + 10,
      { font: this._nameFont(monster), color: fallen ? t.hintColor : undefined });

    // 掛かっている強化・弱体を名前の横に出す
    this._renderModifierMarks(monster, origin, origin.y + 10);

    // 敵のレベルは伏せる（味方だけ表示する）
    if (side === "ally") {
      this.panel.drawText("Lv" + monster.level,
        rect.x + rect.w - (t.padding || 8), origin.y + 10,
        { align: "right", font: t.smallFont, color: t.subTextColor });
    }

    var barW = rect.w - (t.padding || 8) * 2;
    this.hpBar.draw(origin.x, origin.y + 18, barW, 6, shownHp, monster.getMaxHp());

    if (side === "ally") {
      // 味方はPPもバーで出す（HPと同じ見方ができるように）。
      // 演出中は「見せてよいPP」で描く（技を使う出来事を見せるまで減らない）
      var shownPp = this._shownPpOf(monster);
      this.hpBar.drawPp(origin.x, origin.y + 30, barW, 5,
        shownPp, monster.getMaxPp());

      // 数値は1行にまとめる（左がPP、右がHP）
      this.panel.drawText("PP " + shownPp + "/" + monster.getMaxPp(),
        origin.x, origin.y + 46,
        { font: t.smallFont, color: t.subTextColor });
      this.panel.drawText(shownHp + "/" + monster.getMaxHp(),
        rect.x + rect.w - (t.padding || 8), origin.y + 46,
        { align: "right", font: t.smallFont, color: t.subTextColor });
    }

    this._renderMemberMarkers(monster, rect, side, index);
  };

  /**
   * 印として見せているバフ／デバフ。
   *
   * ▼ なぜ monster.modifiers をそのまま描かないか
   * 1ターンぶんの計算は takeTurn で一度に終わり、そのあと出来事を1つずつ見せていく。
   * つまり効果は「見せる前」からもう掛かっている。
   * そのまま描くと、まだ順番が回っていない相手の印が先に出てしまう。
   * HPバーを animator で遅らせているのと同じ理由で、印もここで別に持つ。
   */
  BattleScene.prototype._shownModifiersFor = function (monster) {
    var result = [];
    var shown = this.shownModifiers || [];

    for (var i = 0; i < shown.length; i++) {
      if (shown[i].monster === monster) result.push(shown[i]);
    }
    return result;
  };

  /** 「掛かった」出来事を見せた瞬間に、印を出す */
  BattleScene.prototype._revealModifier = function (event) {
    if (!event.target) return;

    var mod = event.target.getModifier ? event.target.getModifier(event.skillId) : null;
    // 掛け直しのときは、すでに出ている印をそのまま使う
    var shown = this._shownModifiersFor(event.target);
    for (var i = 0; i < shown.length; i++) {
      if (shown[i].name === event.skillName) return;
    }

    this.shownModifiers.push({
      monster: event.target,
      name: event.skillName,
      effects: (mod && mod.effects) || event.effects || []
    });
  };

  /** 効果が切れた出来事を見せた瞬間に、印を消す */
  BattleScene.prototype._hideModifier = function (event) {
    var kept = [];
    for (var i = 0; i < this.shownModifiers.length; i++) {
      var entry = this.shownModifiers[i];
      if (entry.monster === event.target && entry.name === event.skillName) continue;
      kept.push(entry);
    }
    this.shownModifiers = kept;
  };

  /**
   * 見せ終わったので、印を実際の状態に合わせ直す。
   * 途中で戦闘が終わって見せきれなかった出来事があっても、ここでずれが直る。
   */
  BattleScene.prototype._syncModifierMarks = function () {
    var everyone = (this.allies || []).concat(this.enemies || []);
    var result = [];

    for (var i = 0; i < everyone.length; i++) {
      var mods = everyone[i].modifiers || [];
      for (var j = 0; j < mods.length; j++) {
        result.push({ monster: everyone[i], name: mods[j].name, effects: mods[j].effects });
      }
    }
    this.shownModifiers = result;
  };

  /**
   * 掛かっている状態異常とバフ／デバフを、名前のうしろに絵で出す。
   * バフ／デバフはステータスの絵に矢印を重ねる（上がった＝緑、下がった＝赤）。
   *
   * 枠が狭いので「何が」「どちらへ」だけを出し、倍率もターン数も出さない。
   * 詳しくはコマンドの「状態を見る」で見られる。
   */
  /**
   * 状態表示の名前の字体。名前は10文字まで付けられる（2026-10-27。漢字も使える）が、
   * 全角9文字を超えると強化・弱体の印と Lv 表示が入りきらないので、そのときだけ1段小さくする
   * （全角10文字が 12px で120px → 10px で100px。前の上限の全角8文字 96px とほぼ同じ幅になる）
   */
  BattleScene.prototype._nameFont = function (monster) {
    var font = this.theme.smallFont || "12px monospace";
    var ctx = this.panel.ctx;
    ctx.font = font;
    return ctx.measureText(monster.getName()).width > 100 ? "10px monospace" : font;
  };

  BattleScene.prototype._renderModifierMarks = function (monster, origin, baseY) {
    var mods = this._shownModifiersFor(monster);
    var statuses = this._shownStatusesFor(monster);
    if (mods.length === 0 && statuses.length === 0) return;

    var t = this.theme;
    var ctx = this.panel.ctx;
    var font = t.smallFont || "12px monospace";
    var data = this.game.data;

    ctx.font = this._nameFont(monster);
    var x = origin.x + ctx.measureText(monster.getName()).width + 8;
    ctx.font = font;

    // 状態異常を先に出す。バフ／デバフより重いので、名前のすぐ隣に置く
    x = NS.StatusMarks.draw(this.panel, statuses, x, baseY,
      { font: font, sprites: this.spriteRenderer, data: data, gap: 2 });

    for (var i = 0; i < mods.length; i++) {
      var mark = this._modifierMark(mods[i]);
      if (!mark.stat) continue;

      x = NS.StatusMarks.drawModifier(this.panel, this.spriteRenderer, data,
        mark.stat, mark.up, x, baseY) + 2;
    }
  };

  /**
   * 印として見せている状態異常。
   *
   * ▼ なぜ個体をそのまま見ないか（バフ／デバフの _shownModifiersFor と同じ理由）
   * 1ターンぶんの計算は takeTurn で一度に終わるので、見せ始める前から状態異常はもう掛かっている。
   * 個体をそのまま描くと、コマンドを決めた直後に毒の印が出てしまう
   * （特性「毒のとげ」で実際に起きた。どくばりなど技の状態異常も同じだった）。
   *
   * そこで、見せている間（shownStatusIds がある間）はターン開始時の写しを出し、
   * 「掛かった」「治った」の出来事を見せた瞬間に増減させる。見せ終わったら個体に戻す。
   * 写しに無い個体（交代で入ってきた仲間）は、個体をそのまま見る。
   */
  BattleScene.prototype._shownStatusesFor = function (monster) {
    if (!monster || !monster.getStatusDefs) return [];

    var ids = this._shownStatusIdsOf(monster);
    if (!ids) return monster.getStatusDefs();

    var result = [];
    for (var i = 0; i < ids.length; i++) {
      var def = this.game.data.getStatus ? this.game.data.getStatus(ids[i]) : null;
      if (def) result.push(def);
    }
    return result;
  };

  /** 写しの中の、その個体の状態異常id（写しが無い・載っていなければ null） */
  BattleScene.prototype._shownStatusIdsOf = function (monster) {
    var list = this.shownStatusIds;
    if (!list) return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].monster === monster) return list[i].ids;
    }
    return null;
  };

  /** ターンの計算の前に、いま見えている状態異常を写しておく */
  BattleScene.prototype._captureStatusMarks = function () {
    var everyone = (this.allies || []).concat(this.enemies || []);
    var list = [];
    for (var i = 0; i < everyone.length; i++) {
      var defs = everyone[i].getStatusDefs ? everyone[i].getStatusDefs() : [];
      var ids = [];
      for (var j = 0; j < defs.length; j++) ids.push(defs[j].id);
      list.push({ monster: everyone[i], ids: ids });
    }
    this.shownStatusIds = list;
  };

  /**
   * 状態異常の出来事を見せた瞬間に、印を増やす・消す。
   *   status    … 掛かった（即死は印を残さないので足さない）
   *   statusEnd … 治った・切れた
   *   statusIds … 道具で治したときなど、その時点の中身をまるごと渡す出来事
   */
  BattleScene.prototype._revealStatusMark = function (event) {
    var owner = event.statusTarget || event.target;
    var ids = owner ? this._shownStatusIdsOf(owner) : null;
    if (!ids) return;

    if (event.statusIds) {
      ids.length = 0;
      for (var k = 0; k < event.statusIds.length; k++) ids.push(event.statusIds[k]);
      return;
    }

    var index = ids.indexOf(event.statusId);
    if (event.type === "status") {
      var def = this.game.data.getStatus ? this.game.data.getStatus(event.statusId) : null;
      if (index < 0 && def && !def.instantKill) ids.push(event.statusId);
    } else if (event.type === "statusEnd") {
      if (index >= 0) ids.splice(index, 1);
    }
  };

  /**
   * バフ／デバフ1つを「どのステータスが」「上がったか下がったか」に要約する。
   * 絵は data/ui.js の icons.stats から、この stat で引く。
   * @returns {{stat:string|null, up:boolean}}
   */
  BattleScene.prototype._modifierMark = function (mod) {
    return NS.StatusMarks.summarizeModifier(mod);
  };

  /** 行動を決めている味方や、選択中の対象に印をつける */
  BattleScene.prototype._renderMemberMarkers = function (monster, rect, side, index) {
    var t = this.theme;

    // いま行動を決めている味方（「戦う／逃げる」の間はまだ誰も決めていない）
    var choosing = (side === "ally")
      && this.phase !== "message" && this.phase !== "done" && this.phase !== "turnMenu"
      && this.phase !== "tacticMember" && this.phase !== "tacticPick"
      && index === this.commandIndex;
    if (choosing) {
      this.panel.drawText("▼", rect.x + rect.w / 2, rect.y - 6,
        { align: "center", color: t.cursorColor });
    }

    // 選択中の対象。状態を見ているときは、見ている相手
    var framed = (this.phase === "target" && side === this.targetSide && index === this.targetIndex)
      || (this.phase === "inspect" && this._inspectList[this._inspectIndex] === monster);
    if (framed) {
      this.panel.ctx.strokeStyle = t.cursorColor || "#ffd75e";
      this.panel.ctx.lineWidth = 2;
      this.panel.ctx.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
    }
  };

  /** コマンド欄。だれの行動を決めているかも表示する */
  BattleScene.prototype._renderCommand = function () {
    var actor = this._currentActor();
    var rect = this.layout.message;

    // 左側にメッセージ枠を出して「だれが」を示す
    this.panel.drawBox(rect);
    var origin = this.panel.innerOrigin(rect);
    if (actor) {
      // 倒れている枠は「どうする?」ではなく、倒れていることを伝える
      var template = actor.isFainted() ? this.texts.commandFainted : this.texts.commandFor;
      this.panel.drawText(fill(template, { name: actor.getName() }),
        origin.x, origin.y + 20);
    }
    this.panel.drawText(this.texts.hintCommand || "", origin.x, rect.y + rect.h - 14,
      { font: this.theme.smallFont, color: this.theme.hintColor });

    this.commandMenu.render(this.game.clock);
  };

  /** ターンの頭の「戦う／逃げる」。左に問いかけ、右にメニュー */
  BattleScene.prototype._renderTurnMenu = function () {
    var rect = this.layout.message;
    this.panel.drawBox(rect);

    var origin = this.panel.innerOrigin(rect);
    this.panel.drawText(this.texts.turnPrompt || "", origin.x, origin.y + 20);
    this.panel.drawText(this.texts.hintTurn || "", origin.x, rect.y + rect.h - 14,
      { font: this.theme.smallFont, color: this.theme.hintColor });

    this.commandMenu.render(this.game.clock);
  };

  /**
   * 「状態を見る」。見ている相手のHP・PPと、掛かっている状態異常・バフ／デバフを
   * 残りターンつきで並べる。何も掛かっていなければそう書く。
   */
  BattleScene.prototype._renderInspect = function () {
    var t = this.theme;
    var rect = this.layout.message;
    var L = this.layout.inspect || {};
    var lh = L.lineHeight || 20;
    var iconSize = L.iconSize || 16;
    var texts = this.texts;
    var data = this.game.data;

    this.panel.drawBox(rect);
    var origin = this.panel.innerOrigin(rect);
    var monster = this._inspectList[this._inspectIndex];
    if (!monster) return;

    // 左：名前・HP・PP
    var x = origin.x;
    var y = origin.y + 20;
    var isAlly = this.system.getFieldSlots().indexOf(monster) >= 0;
    this.panel.drawText(monster.getName(), x, y, { color: t.cursorColor });
    y += lh;
    this.panel.drawText("HP " + monster.currentHp + "/" + monster.getMaxHp(), x, y,
      { font: t.smallFont, color: t.subTextColor });
    y += lh;
    if (isAlly) {
      this.panel.drawText("PP " + this._shownPpOf(monster) + "/" + monster.getMaxPp(), x, y,
        { font: t.smallFont, color: t.subTextColor });
      y += lh;
    }

    // 右：状態異常とバフ／デバフ
    var cx = origin.x + (L.columnX || 300);
    var cy = origin.y + 20;
    var lines = this._inspectLines(monster);
    if (lines.length === 0) {
      this.panel.drawText(texts.inspectNone || "", cx, cy, { color: t.hintColor, font: t.smallFont });
    }
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var tx = cx;
      if (line.icon) {
        NS.StatusMarks.drawIcon(this.spriteRenderer, line.icon, tx, cy, iconSize);
        tx += iconSize + 4;
      } else if (line.stat) {
        tx = NS.StatusMarks.drawModifier(this.panel, this.spriteRenderer, data,
          line.stat, line.up, tx, cy, { size: iconSize }) + 4;
      }
      this.panel.drawText(line.text, tx, cy, { font: t.smallFont, color: line.color || t.textColor });
      if (line.right) {
        this.panel.drawText(line.right, rect.x + rect.w - (t.padding || 8) - 10, cy,
          { align: "right", font: t.smallFont, color: t.subTextColor });
      }
      cy += lh;
    }

    this.panel.drawText(texts.hintInspect || "", origin.x, rect.y + rect.h - 14,
      { font: t.smallFont, color: t.hintColor });
  };

  /**
   * 状態を見る：1体ぶんの行。状態異常 → バフ／デバフ の順。
   * @returns {Array<{text, right?, icon?, stat?, up?, color?}>}
   */
  BattleScene.prototype._inspectLines = function (monster) {
    var texts = this.texts;
    var t = this.theme;
    var data = this.game.data;
    var lines = [];
    var i;

    var statuses = (monster.statusEffects || []);
    for (i = 0; i < statuses.length; i++) {
      var def = data.getStatus ? data.getStatus(statuses[i].id) : null;
      if (!def) continue;
      var remaining = statuses[i].remaining;
      lines.push({
        icon: def.icon || null,
        text: def.name,
        color: def.color || t.textColor,
        right: (remaining === null || remaining === undefined)
          ? (texts.turnsLasting || "")
          : fill(texts.turnsLeft || "{n}", { n: remaining })
      });
    }

    var mods = monster.modifiers || [];
    for (i = 0; i < mods.length; i++) {
      var mark = NS.StatusMarks.summarizeModifier(mods[i]);
      var desc = [];
      var effects = mods[i].effects || [];
      for (var e = 0; e < effects.length; e++) {
        var text = NS.EffectSystem.describeEffect(effects[e], data);
        if (text) desc.push(text);
      }
      lines.push({
        stat: mark.stat, up: mark.up,
        text: mods[i].name + "  " + desc.join(" / "),
        color: mark.up ? (t.hpBarHigh || "#5fd18c") : (t.hpBarLow || "#e8542a"),
        right: fill(texts.turnsLeft || "{n}", { n: mods[i].remaining })
      });
    }
    return lines;
  };

  BattleScene.prototype._renderSubMenu = function () {
    var rect = this.layout.message;
    this.panel.drawBox(rect);

    var origin = this.panel.innerOrigin(rect);
    this.panel.drawText(this._subMenuLabel() || "", origin.x, origin.y + 20);

    // 選んでいるものの中身を左側に出す
    if (this.phase === "skill") this._renderSkillInfo(origin, rect);
    else if (this.phase === "item") this._renderItemInfo(origin, rect);
    else if (this.phase === "tacticMember" || this.phase === "tacticPick") this._renderTacticInfo(origin, rect);
    else this._renderSwapHint(origin, rect);

    this.subMenu.render(this.game.clock);
    this._skillSortRect = null;
    if (this.phase === "skill") this._renderSkillSort(rect);
  };

  /**
   * 技を選ぶときの右端：いまの並べ方と、切り替えの案内（2026-10-15）。
   * 並べ方の札は押しても次の並びに変わる
   */
  BattleScene.prototype._renderSkillSort = function (rect) {
    var list = this.layout.skillMenu || this.layout.subMenu;
    var t = this.theme;
    var x = list.x + list.w + 14;
    var right = rect.x + rect.w - 12;
    if (right - x < 60) return;
    var modes = this.texts.skillSortModes || {};
    var mode = this._battleSkillSort();
    var y = rect.y + 30;

    this.panel.drawText(this.texts.skillSortTitle || "", x, y, { font: t.smallFont, color: t.hintColor });
    this._skillSortRect = { x: x - 4, y: y + 6, w: right - x + 8, h: 24 };
    this.panel.ctx.fillStyle = "rgba(74,107,168,0.25)";
    this.panel.ctx.fillRect(this._skillSortRect.x, this._skillSortRect.y, this._skillSortRect.w, this._skillSortRect.h);
    this.panel.drawText(modes[mode] || mode, x + 4, y + 23, { font: t.font, color: t.cursorColor });
    this.panel.drawText(this.texts.skillSortHint || "", x, rect.y + rect.h - 14, { font: t.smallFont, color: t.hintColor });
  };

  BattleScene.prototype._subMenuLabel = function () {
    if (this.phase === "skill") return this.texts.selectSkill;
    if (this.phase === "item") return this.texts.selectItem;
    if (this.phase === "tacticMember") return this.texts.selectTacticMember;
    if (this.phase === "tacticPick") return fill(this.texts.selectTactic || "",
      { name: this._tacticMember ? this._tacticMember.getName() : "" });
    return this.texts.selectSwap;
  };

  /** 交代を選んでいるときの案内（技や道具のような詳細は無い） */
  BattleScene.prototype._renderSwapHint = function (origin, rect) {
    this.panel.drawText(this.texts.hintSwap || "", origin.x, rect.y + rect.h - 14,
      { font: this.theme.smallFont, color: this.theme.hintColor });
  };

  /**
   * 選んでいる技の内容（属性・威力・命中・PP・説明）。
   * 数値も説明も data/skills.js のものをそのまま出す。
   */
  BattleScene.prototype._renderSkillInfo = function (origin, rect) {
    var selected = this.subMenu.getSelected();
    if (!selected) return;

    var skill = this.game.data.getSkill(selected.value);
    if (!skill) return;

    var t = this.theme;
    var info = this.layout.skillInfo || {};
    var lh = t.lineHeight || 18;
    var y = origin.y + 20 + lh + 6;

    // 技名と属性
    var element = (this.game.data.elements || {})[skill.element];
    this.panel.drawText(skill.name, origin.x, y);
    if (element) {
      this.panel.drawText("[" + element.name + "]",
        origin.x + (info.elementOffsetX || 110), y,
        { font: t.smallFont, color: element.color });
    }
    // 技の種類（共鳴・ブレスなど。data/categories.js の skillKind）
    var kind = this.game.data.getSkillKind(skill);
    if (kind) {
      this.panel.drawText("[" + kind.name + "]",
        origin.x + (info.kindOffsetX || 150), y,
        { font: t.smallFont, color: kind.color });
    }
    y += lh;

    // 威力・命中・PP。ダメージを与えない技（回復・支援・状態異常だけ）は威力を出さない
    var accuracy = (skill.accuracy === undefined)
      ? ((this.game.data.battle || {}).defaultAccuracy || 1)
      : skill.accuracy;
    var statsTemplate = NS.BattleSystem.dealsDamage(skill)
      ? this.texts.skillStats
      : (this.texts.skillStatsNoPower || this.texts.skillStats);
    this.panel.drawText(
      fill(statsTemplate, {
        power: skill.power || 0,
        accuracy: Math.round(accuracy * 100),
        pp: skill.pp || 0
      }),
      origin.x, y, { font: t.smallFont, color: t.subTextColor });
    y += lh + 4;

    // 説明
    var lines = wrapText(skill.description || "", info.charsPerLine || 20);
    for (var i = 0; i < lines.length; i++) {
      this.panel.drawText(lines[i], origin.x, y, { font: t.smallFont, color: t.subTextColor });
      y += lh;
    }
  };

  /** 選んでいる道具の説明 */
  BattleScene.prototype._renderItemInfo = function (origin, rect) {
    var selected = this.subMenu.getSelected();
    if (!selected) return;

    var item = this.game.data.getItem(selected.value);
    if (!item) return;

    var t = this.theme;
    var info = this.layout.skillInfo || {};
    var lh = t.lineHeight || 18;
    var y = origin.y + 20 + lh + 6;

    this.panel.drawText(item.name, origin.x, y);
    y += lh + 4;

    var lines = wrapText(item.description || "", info.charsPerLine || 20);
    for (var i = 0; i < lines.length; i++) {
      this.panel.drawText(lines[i], origin.x, y, { font: t.smallFont, color: t.subTextColor });
      y += lh;
    }
  };

  /** 仲間になった相手の行き先を選ぶ画面（コマンド欄を流用する） */
  BattleScene.prototype._renderScoutChoice = function () {
    var texts = (this.game.data.messages || {}).scout || {};
    var rect = this.layout.message;

    this.panel.drawBox(rect);
    var origin = this.panel.innerOrigin(rect);

    if (this.pendingScout) {
      this.panel.drawText(fill(texts.choiceTitle, { name: this.pendingScout.getName() }),
        origin.x, origin.y + 20);
    }
    // 入れられなかった理由（預かり所がいっぱい など）
    if (this._scoutError) {
      this.panel.drawText(this._scoutError, origin.x, origin.y + 44,
        { font: this.theme.smallFont, color: this.theme.hpBarLow || "#e8542a" });
    }
    this.panel.drawText(texts.choiceHint || "", origin.x, rect.y + rect.h - 14,
      { font: this.theme.smallFont, color: this.theme.hintColor });

    this.commandMenu.render(this.game.clock);
  };

  /** どの仲間と入れ替えるかを選ぶ画面 */
  BattleScene.prototype._renderScoutSwap = function () {
    var texts = (this.game.data.messages || {}).scout || {};
    var rect = this.layout.message;

    this.panel.drawBox(rect);
    var origin = this.panel.innerOrigin(rect);
    this.panel.drawText(texts.selectMember || "", origin.x, origin.y + 20);
    this.panel.drawText(texts.selectHint || "", origin.x, rect.y + rect.h - 14,
      { font: this.theme.smallFont, color: this.theme.hintColor });

    this.subMenu.render(this.game.clock);
  };

  /** 文字数で折り返す（等幅フォント前提の簡易処理） */
  function wrapText(text, charsPerLine) {
    var lines = [];
    for (var i = 0; i < text.length; i += charsPerLine) {
      lines.push(text.substr(i, charsPerLine));
    }
    return lines;
  }

  /** テンプレートの {key} を置き換える */
  function fill(template, values) {
    if (!template) return "";
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return (values[key] !== undefined) ? values[key] : match;
    });
  }

  NS.BattleScene = BattleScene;
})(window.MyGame);
