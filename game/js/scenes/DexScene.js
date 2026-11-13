/**
 * DexScene.js
 * 図鑑画面。画面ぜんぶが「開いた本」（v1.4.0。見本は dex-mockups.html の案 B）。
 * 上の栞が表（モンスター／アイテム／特性／技／性格／加護）で、Q/E か栞を押して切り替える。
 *
 * 「まだ発見していないもの」は ？ で伏せて表示し、
 * 全体の中でどれだけ集まったかが分かるようにしている。
 * 発見の記録は Discovery が持つ。
 *
 * 配置と色は data/ui.js の dex、文言は data/messages.js の dex で管理する。
 *
 * ▼ モンスターの表（1体で見開き1つ）
 *   左のページ … 番号・名前・系統と属性・台座に立つ絵・説明・愛情度の記録（慣れ・信頼・絆）・特性の説明
 *   右のページ … 能力の五角形・耐性の表・落とすもの・特性の名前
 *   下の帯     … 前後の相手の絵。←→ でめくる（押しっぱなしで送れる）。絵を押してもめくれる
 *   ↑↓ … 左のページの文を送る　　R … 並べ替え　　決定 … 落とすものの区画を切り替える（区画で違う種族だけ）
 *   出会っただけの相手は絵・名前・系統・属性・能力まで。まだ出会っていない相手はすべて「？」
 *
 * ▼ ほかの表（左のページに一覧・右のページに説明）
 *   一覧は分類（categories.js）ごとに区切って並べる。
 *   説明が長いとページに収まらないため、いったん「行の配列」を組み立ててから
 *   入る分だけ描く。決定キーで説明へカーソルを移すと、上下でスクロールできる。
 */
(function (NS) {
  "use strict";

  /**
   * 表の並び。
   * モンスター・アイテム・特性・技は「出会ったもの」を集める図鑑、
   * 性格・加護は「どんなものがあるか」を確かめる一覧（最初から全部見える）。
   */
  var TABS = ["monsters", "items", "abilities", "skills", "natures", "blessings"];

  /**
   * @param {MyGame.Game} game
   * @param {object} returnScene 閉じたときに戻るシーン
   */
  function DexScene(game, returnScene) {
    this.game = game;
    this.returnScene = returnScene;

    var ui = game.data.ui || {};
    this.theme = ui.theme || {};
    this.layout = ui.dex || {};
    this.texts = (game.data.messages || {}).dex || {};

    this.panel = new NS.Panel(game.ctx, this.theme);
    this.sprites = new NS.SpriteRenderer(game.ctx, game.assets);
    this.renderer = new NS.Renderer(game.ctx);
    this.list = new NS.ScrollList(this.panel, this.layout.list, { sprites: this.sprites });
    this.backButton = new NS.BackButton(this.panel, game.data);
    this.abilitySystem = new NS.AbilitySystem(game.data);

    this.tabIndex = 0;
    this.focus = "list";     // "list"（一覧を選ぶ）/ "detail"（説明を読む）
    this.detailScroll = 0;   // 詳細の表示開始行

    // モンスターの表（見開きの本）
    this.monsterIds = [];    // いまの並べ方での種族idの並び
    this.monsterId = null;   // 開いている種族
    this.pageScroll = 0;     // 左のページの文を送った量（px）
    this.dropGroup = 0;      // 落とすものの、いま見せている区画（区画で違う種族だけ）
    this._holds = {};        // 押しっぱなしで送るための覚え（_heldStep）
    this._pageCache = null;  // 左のページの文（種族が変わるまで使い回す）
    this._statMaxes = {};    // 能力の五角形の目盛り（_statMax）

    this._rebuildList();
  }

  DexScene.prototype.enter = function () {
    this._pageCache = null;
    this._rebuildList();
    this.focus = "list";
    this.detailScroll = 0;
    this.pageScroll = 0;
    this.dropGroup = 0;
  };

  DexScene.prototype.getTab = function () { return TABS[this.tabIndex]; };

  // --- 一覧の組み立て ---

  DexScene.prototype._rebuildList = function () {
    var tab = this.getTab();
    var rows;

    // モンスターの表は一覧を使わない（見開きの本。並びだけ決める）
    if (tab === "monsters") {
      this._rebuildMonsterOrder();
      this.list.setRows([]);
      return;
    }

    if (tab === "items") rows = this._buildItemRows();
    else if (tab === "abilities") rows = this._buildAbilityRows();
    else if (tab === "skills") rows = this._buildSkillRows();
    else if (tab === "natures") rows = this._buildNatureRows();
    else rows = this._buildBlessingRows();

    this.list.setRows(rows);
  };

  /** 性格を並べる（分類が無いので見出し無しの一覧） */
  DexScene.prototype._buildNatureRows = function () {
    return flatRows(this.game.data.natures, function (id, nature) {
      return { label: nature.name, value: id };
    });
  };

  /**
   * その加護をもう知っているか。
   *
   * 最初から選択肢に出るもの（locked でないもの）は、いつでも見える。
   * 謎の商人が売っているもの（locked）は、買うまで伏せる。
   * 買わないと一生出会わない加護の名前と効果が、図鑑で先に見えてしまうため。
   */
  DexScene.prototype._isBlessingKnown = function (id, blessing) {
    if (!blessing.locked) return true;
    return !!(this.game.hasBoughtBlessing && this.game.hasBoughtBlessing(id));
  };

  /** 加護を並べる（出やすさは言葉で右に出す） */
  DexScene.prototype._buildBlessingRows = function () {
    var data = this.game.data;
    return flatRows(data.blessings, function (id, blessing) {
      var known = this._isBlessingKnown(id, blessing);
      if (!known) {
        return { label: this.texts.unknownName || "???", value: id };
      }
      var rarity = NS.BlessingSystem.getRarity(data, blessing);
      return {
        label: blessing.name,
        right: rarity.label,
        rightColor: rarity.color,
        value: id
      };
    }.bind(this));
  };

  /**
   * 特性が判明しているか。
   * その特性を持つモンスターを1体でも仲間にしていれば分かる、という扱い。
   * （モンスター図鑑でも、特性は仲間にしたときだけ見えるようにしてある）
   * @param {string} abilityId
   */
  DexScene.prototype._isAbilityKnown = function (abilityId) {
    return this._ownersOf(abilityId, true).length > 0;
  };

  /**
   * その特性を持つモンスターを探す。
   * @param {string} abilityId
   * @param {boolean} caughtOnly 仲間にしたものだけに絞るか
   */
  DexScene.prototype._ownersOf = function (abilityId, caughtOnly) {
    var monsters = this.game.data.monsters || {};
    var discovery = this.game.discovery;
    var result = [];

    for (var id in monsters) {
      if (!Object.prototype.hasOwnProperty.call(monsters, id)) continue;
      var abilities = this._effectiveAbilities(monsters[id]);
      if (abilities.indexOf(abilityId) < 0) continue;
      if (caughtOnly && !this._dexOpen(id)) continue;
      result.push(monsters[id]);
    }
    return result;
  };

  /**
   * そのモンスターの詳しいところを図鑑で見せてよいか。ふつうは仲間にしたら。
   * 倒すだけで開く種族もある（dexOnDefeat。シニガミ。Discovery.isMonsterDexOpen）
   */
  DexScene.prototype._dexOpen = function (id) {
    var discovery = this.game.discovery;
    if (!discovery) return false;
    if (discovery.isMonsterDexOpen) return discovery.isMonsterDexOpen(id, this.game.data.getMonsterData(id));
    return discovery.isMonsterCaught(id);
  };

  /** 実際に効いている特性のidだけを返す（1体あたりの上限を反映する） */
  DexScene.prototype._effectiveAbilities = function (species) {
    var list = this.abilitySystem.resolveAbilities(species);
    var ids = [];
    for (var i = 0; i < list.length; i++) ids.push(list[i].id);
    return ids;
  };

  /** 特性を分類ごとに並べる */
  DexScene.prototype._buildAbilityRows = function () {
    var data = this.game.data;
    var categories = (data.categories || {}).ability || {};

    return buildRows(data.abilities, categories, "category", function (id, ability) {
      var known = this._isAbilityKnown(id);
      return {
        label: known ? ability.name : (this.texts.unknownName || "???"),
        right: known ? (this.texts.knownLabel || "") : "",
        value: id
      };
    }.bind(this));
  };

  /**
   * 図鑑に載せる技だけを集める。
   * 通常攻撃のように showInDex: false と書かれたものは外す
   * （覚える技ではなくコマンドなので、集める対象にならない）。
   */
  DexScene.prototype._dexSkills = function () {
    var skills = this.game.data.skills || {};
    var result = {};

    for (var id in skills) {
      if (!Object.prototype.hasOwnProperty.call(skills, id)) continue;
      if (skills[id].showInDex === false) continue;
      result[id] = skills[id];
    }
    return result;
  };

  /**
   * その技が判明しているか。
   *
   * ★ 条件は「仲間が実際に覚えたか」。種族を捕まえただけでは判明しない。
   *   技はレベルで覚えるので、捕獲を条件にしていたころは
   *   Lv1のスライムを1体捕まえただけで、Lv11で覚える「キュア」まで出ていた。
   *   特性は種族そのものが持つものなので、そちらは捕獲だけで判明してよい。
   *
   * 記録は Discovery が持つ（逃がした個体が覚えていた技も残る）。
   * @param {string} skillId
   */
  DexScene.prototype._isSkillKnown = function (skillId) {
    var discovery = this.game.discovery;
    return !!(discovery && discovery.isSkillLearned(skillId));
  };

  /**
   * その技を覚えるモンスターを探す。
   * @param {string} skillId
   * @param {boolean} caughtOnly 仲間にしたものだけに絞るか
   * @returns {object[]} [{ monster, level }] level は覚えるレベル
   */
  DexScene.prototype._learnersOf = function (skillId, caughtOnly) {
    var monsters = this.game.data.monsters || {};
    var discovery = this.game.discovery;
    var result = [];

    for (var id in monsters) {
      if (!Object.prototype.hasOwnProperty.call(monsters, id)) continue;
      var level = learnLevel(monsters[id], skillId);
      // 絆の報酬で覚える技（専用技など）は、レベルではなく「絆」で覚える
      var bond = ((monsters[id].bondReward || {}).skill === skillId);
      if (level === null && !bond) continue;
      if (caughtOnly && !this._dexOpen(id)) continue;
      result.push({ monster: monsters[id], level: level, bond: bond && level === null });
    }
    return result;
  };

  /** 技の並べ方（R で切り替える。2026-10-15）。選んだ並びは図鑑を閉じても覚えておく（セーブはしない） */
  var SKILL_SORTS = ["element", "kind", "role", "name", "order"];

  DexScene.prototype._skillSort = function () {
    var mode = this.game.dexSkillSort;
    return SKILL_SORTS.indexOf(mode) >= 0 ? mode : SKILL_SORTS[0];
  };

  /** モンスターの並べ方（R で切り替える。2026-11-06）。技と同じく、図鑑を閉じても覚えておく（セーブはしない） */
  var MONSTER_SORTS = ["family", "element", "name", "order"];

  DexScene.prototype._monsterSort = function () {
    var mode = this.game.dexMonsterSort;
    return MONSTER_SORTS.indexOf(mode) >= 0 ? mode : MONSTER_SORTS[0];
  };

  /** アイテムの並べ方（R で切り替える。2026-11-09 作者の依頼）。ほかの表と同じく、図鑑を閉じても覚えておく（セーブはしない） */
  var ITEM_SORTS = ["category", "price", "name", "order"];

  DexScene.prototype._itemSort = function () {
    var mode = this.game.dexItemSort;
    return ITEM_SORTS.indexOf(mode) >= 0 ? mode : ITEM_SORTS[0];
  };

  /** 並べ替えのある表と、その並べ方の一覧・覚えておく場所（game のこの名前） */
  var SORTABLE = {
    skills:   { modes: SKILL_SORTS,   key: "dexSkillSort" },
    monsters: { modes: MONSTER_SORTS, key: "dexMonsterSort" },
    items:    { modes: ITEM_SORTS,    key: "dexItemSort" }
  };

  /** その表に並べ替えがあるか（技・モンスター・アイテム） */
  DexScene.prototype._hasSort = function () {
    return !!SORTABLE[this.getTab()];
  };

  /** いまの表の並べ方 */
  DexScene.prototype._currentSort = function () {
    var tab = this.getTab();
    if (tab === "monsters") return this._monsterSort();
    if (tab === "items") return this._itemSort();
    return this._skillSort();
  };

  /** いまの表の並べ方を変える */
  DexScene.prototype._changeSort = function (direction) {
    var sortable = SORTABLE[this.getTab()];
    if (!sortable) return;
    var modes = sortable.modes;
    this.game[sortable.key] = modes[(modes.indexOf(this._currentSort()) + direction + modes.length) % modes.length];
    this._rebuildList();
    this.detailScroll = 0;
  };

  /**
   * 技を並べる。並べ方は属性ごと・種類ごと・働きごと・名前順・図鑑の順（data/skills.js に書いた順）。
   * 名前順では、まだ判明していない技は最後にまとめる（名前の並びで中身が分かってしまわないように）
   */
  DexScene.prototype._buildSkillRows = function () {
    var data = this.game.data;
    var self = this;
    var ids = Object.keys(this._dexSkills());
    var groups = NS.BattleSystem.groupSkills(data, ids, this._skillSort(), function (id) {
      return self._isSkillKnown(id) ? data.getSkill(id).name : null;
    });

    var rows = [];
    for (var g = 0; g < groups.length; g++) {
      if (groups[g].group) {
        rows.push({ type: "header", label: "- " + groups[g].group.name + " -", color: groups[g].group.color });
      }
      for (var i = 0; i < groups[g].ids.length; i++) {
        var id = groups[g].ids[i];
        var known = this._isSkillKnown(id);
        var skillElement = known ? (data.elements || {})[data.getSkill(id).element] : null;
        rows.push({
          type: "entry",
          label: known ? data.getSkill(id).name : (this.texts.unknownName || "???"),
          // 属性の絵（無属性は絵が無いので、字下げだけそろう）
          icon: skillElement ? skillElement.icon : null,
          right: known ? (this.texts.knownLabel || "") : "",
          value: id
        });
      }
    }
    return rows;
  };

  /** 並べ方の札の当たり判定（描いたときに覚える） */
  DexScene.prototype._clickedSortLabel = function (input) {
    var pointer = input.getPointer ? input.getPointer() : null;
    return !!(pointer && pointer.clicked && this._sortRect && NS.Panel.containsPoint(this._sortRect, pointer));
  };

  /**
   * モンスターの並び（種族idの配列）。並べ方は系統ごと・属性ごと・名前順・図鑑の順（data/monsters.js に書いた順）。
   * 名前順では、まだ出会っていないものは最後にまとめる（技の名前順と同じ）
   */
  DexScene.prototype._monsterOrder = function () {
    var data = this.game.data;
    var discovery = this.game.discovery;
    var mode = this._monsterSort();
    var ids = Object.keys(data.monsters);
    var makeEntry = function (id) { return { value: id }; };
    var rows = null;

    if (mode === "family") rows = buildRows(data.monsters, (data.categories || {}).monster || {}, "family", makeEntry);
    else if (mode === "element") rows = buildRows(data.monsters, data.elements || {}, "element", makeEntry);
    if (rows) {
      return rows.filter(function (row) { return row.type === "entry"; })
                 .map(function (row) { return row.value; });
    }
    if (mode === "order") return ids;

    return ids.slice().sort(function (a, b) {
      var sa = discovery.isMonsterSeen(a), sb = discovery.isMonsterSeen(b);
      if (sa !== sb) return sa ? -1 : 1;
      if (!sa) return ids.indexOf(a) - ids.indexOf(b);
      return data.monsters[a].name.localeCompare(data.monsters[b].name, "ja") || ids.indexOf(a) - ids.indexOf(b);
    });
  };

  /** 並びを作り直す。開いている種族はそのまま（並べ替えても同じ相手のページにいる） */
  DexScene.prototype._rebuildMonsterOrder = function () {
    this.monsterIds = this._monsterOrder();
    if (this.monsterIds.indexOf(this.monsterId) < 0) {
      this.monsterId = this.monsterIds.length ? this.monsterIds[0] : null;
      this.pageScroll = 0;
      this.dropGroup = 0;
    }
  };

  /**
   * アイテムを並べる。並べ方は分類ごと（既定）・値段順・名前順・図鑑の順（data/items.js に書いた順）。
   *   分類ごと … 分類（category）ごとに区切り、装備はさらに武器・防具・アクセサリー、素材は手に入るステージで分ける
   *   値段順   … 分類ごとに区切り、その中を値段の高い順に（同じ値段なら図鑑の順）
   *   名前順・図鑑の順 … 区切らずに並べる
   * 値段順・名前順では、まだ手に入れていないものを最後にまとめる（並びで値段や名前が分からないように）
   */
  DexScene.prototype._buildItemRows = function () {
    var data = this.game.data;
    var discovery = this.game.discovery;
    var categories = (data.categories || {}).item || {};
    var mode = this._itemSort();
    var ids = Object.keys(data.items);

    var makeEntry = function (id, item) {
      var obtained = discovery.isItemObtained(id);
      return {
        label: obtained ? item.name : (this.texts.unknownName || "???"),
        // 絵も、手に入れるまでは見せない
        icon: obtained ? item.icon : null,
        right: obtained ? (this.texts.obtainedLabel || "") : "",
        value: id
      };
    }.bind(this);

    if (mode === "order") return flatRows(data.items, makeEntry);

    if (mode === "price" || mode === "name") {
      var sorted = ids.slice().sort(function (a, b) {
        var oa = discovery.isItemObtained(a), ob = discovery.isItemObtained(b);
        if (oa !== ob) return oa ? -1 : 1;
        if (!oa) return ids.indexOf(a) - ids.indexOf(b);
        var ia = data.items[a], ib = data.items[b];
        var diff = (mode === "price")
          ? (ib.price || 0) - (ia.price || 0)
          : ia.name.localeCompare(ib.name, "ja");
        return diff || ids.indexOf(a) - ids.indexOf(b);
      });
      if (mode === "name") {
        return sorted.map(function (id) {
          var entry = makeEntry(id, data.items[id]);
          entry.type = "entry";
          return entry;
        });
      }
      // 並べ替えた順に入れ直して、分類の見出しだけ付ける（buildRows は渡した順のまま並べる）
      var byPrice = {};
      for (var i = 0; i < sorted.length; i++) byPrice[sorted[i]] = data.items[sorted[i]];
      return buildRows(byPrice, categories, "category", makeEntry);
    }

    // 小見出し：装備は枠（武器・防具・アクセサリー）、素材は手に入るステージ（items.js の from）。
    // ステージの並びは data/dungeons.js の order（店の素材と同じ並び）
    var defs = {};
    var slotDefs = (data.categories || {}).equipSlot || {};
    for (var slot in slotDefs) {
      if (Object.prototype.hasOwnProperty.call(slotDefs, slot)) defs[slot] = slotDefs[slot];
    }
    var dungeons = data.dungeons || {};
    for (var dungeonId in dungeons) {
      if (!Object.prototype.hasOwnProperty.call(dungeons, dungeonId)) continue;
      defs[dungeonId] = { name: dungeons[dungeonId].name, order: dungeons[dungeonId].order };
    }
    // ダンジョンではない小見出し（恒常素材など。data/categories.js の materialSource）
    var sources = (data.categories || {}).materialSource || {};
    for (var sourceId in sources) {
      if (Object.prototype.hasOwnProperty.call(sources, sourceId)) defs[sourceId] = sources[sourceId];
    }
    var subgroups = {
      keyOf: function (id, item) {
        if (item.equip) return NS.EffectSystem.slotOf(item);
        return item.from || null;
      },
      defs: defs
    };

    return buildRows(data.items, categories, "category", makeEntry, subgroups);
  };

  // --- 更新 ---

  DexScene.prototype.update = function () {
    var input = this.game.input;

    // 「戻る」ボタンはどの状態でも押せる
    if (this.backButton.handleInput(input)) {
      this.game.scenes.change(this.returnScene);
      return;
    }

    // 説明を読んでいる間は、上下がスクロールになる
    if (this.focus === "detail") {
      this._updateDetailFocus(input);
      return;
    }

    // 栞（表の切り替え）は Q/E か、栞を押す。←→ はモンスターの表でページをめくるのに使う
    if (input.isPressed("prevTab")) this._changeTab(-1);
    if (input.isPressed("nextTab")) this._changeTab(1);
    if (this._clickedTab(input)) return;

    // 技・モンスター・アイテムの表は、R（または並びの札を押す）で並べ方を変えられる
    if (this._hasSort() && (input.isPressed("sort") || this._clickedSortLabel(input))) {
      this._changeSort(1);
      return;
    }

    // モンスターの表は見開きの本
    if (this.getTab() === "monsters") {
      this._updateBook(input);
      return;
    }

    // 説明の上でホイールを回したら、そのままスクロールする
    if (this._scrollDetailByWheel(input)) return;

    // 一覧を動かしたら、詳細は先頭から読み直す
    if (this.list.handleInput(input)) this.detailScroll = 0;

    // 説明が枠に収まりきらないときだけ、読むモードに入れる
    var confirmed = input.isPressed("confirm") || this.list.clickedEntry(input);
    if (confirmed && this._canScrollDetail()) {
      this.focus = "detail";
      return;
    }

    if (input.isPressed("cancel")) {
      this.game.scenes.change(this.returnScene);
    }
  };

  DexScene.prototype._updateDetailFocus = function (input) {
    var max = this._maxDetailScroll();

    if (input.isPressed("up")) this.detailScroll = Math.max(0, this.detailScroll - 1);
    if (input.isPressed("down")) this.detailScroll = Math.min(max, this.detailScroll + 1);

    // 読んでいる間は、枠の外で回してもスクロールできるようにする
    this._applyWheel(input.getPointer ? input.getPointer().wheel : 0);

    if (input.isPressed("cancel") || input.isPressed("confirm")) {
      this.focus = "list";
      this.detailScroll = 0;
    }
  };

  /**
   * 説明の上でホイールを回したときのスクロール。
   * 一覧を選んでいる状態でも、読むモードに入らずそのまま読み進められる。
   * @returns {boolean} スクロールしたか
   */
  DexScene.prototype._scrollDetailByWheel = function (input) {
    if (!input.getPointer) return false;

    var pointer = input.getPointer();
    if (!pointer.wheel || !pointer.inside) return false;
    if (!NS.Panel.containsPoint(this.layout.detail, pointer)) return false;

    return this._applyWheel(pointer.wheel);
  };

  /** スクロール量を加える（範囲内に収める） */
  DexScene.prototype._applyWheel = function (wheel) {
    if (!wheel) return false;

    var max = this._maxDetailScroll();
    var next = Math.max(0, Math.min(max, this.detailScroll + wheel));
    if (next === this.detailScroll) return false;

    this.detailScroll = next;
    return true;
  };

  /**
   * 詳細の中身と、何行入るかを測る。
   *
   * 描画のときだけ測っていると、更新の順番によっては
   * 1つ前の内容の行数でスクロール量を判断してしまう。
   * そうならないよう、更新でも描画でもこの結果を使う。
   *
   * @returns {{content:object|null, top:number, bottom:number, visible:number, total:number}}
   */
  DexScene.prototype._measureDetail = function () {
    var rect = this.layout.detail;
    var t = this.theme;
    var lh = t.lineHeight || 18;

    var tab = this.getTab();
    var content;
    if (tab === "monsters") content = null;   // モンスターの表は見開きの本（_renderMonsterBook）
    else if (tab === "items") content = this._buildItemDetail();
    else if (tab === "abilities") content = this._buildAbilityDetail();
    else if (tab === "skills") content = this._buildSkillDetail();
    else if (tab === "natures") content = this._buildNatureDetail();
    else content = this._buildBlessingDetail();

    var origin = this.panel.innerOrigin(rect);
    // 上の見出し（絵・名前・札）はスクロールさせず、その下の行だけを送る
    var top = origin.y + ((content && content.head) ? this._headHeight(content.head) : 0) + 20;

    var bottom = rect.y + rect.h - (t.padding || 8);
    var lines = (content && content.lines) || [];

    return {
      content: content,
      top: top,
      bottom: bottom,
      visible: Math.max(1, Math.floor((bottom - top) / lh) + 1),
      total: lines.length
    };
  };

  /** 詳細をどこまで下げられるか（0 なら全部見えている） */
  DexScene.prototype._maxDetailScroll = function () {
    var m = this._measureDetail();
    return Math.max(0, m.total - m.visible);
  };

  DexScene.prototype._canScrollDetail = function () {
    return this._maxDetailScroll() > 0;
  };

  DexScene.prototype._changeTab = function (direction) {
    this.tabIndex = (this.tabIndex + direction + TABS.length) % TABS.length;
    this.detailScroll = 0;
    this._holds = {};
    this._rebuildList();
  };

  /** 上部のタブをマウスで押したか（押されたらその表へ切り替える） */
  DexScene.prototype._clickedTab = function (input) {
    if (!input.getPointer || !input.getPointer().clicked) return false;

    var T = this.layout.tabs;
    if (!T) return false;

    var pointer = input.getPointer();
    for (var i = 0; i < TABS.length; i++) {
      var rect = { x: T.x + (T.w + T.gap) * i, y: T.y, w: T.w, h: T.h };
      if (!NS.Panel.containsPoint(rect, pointer)) continue;

      if (i !== this.tabIndex) {
        this.tabIndex = i;
        this.detailScroll = 0;
        this._rebuildList();
      }
      return true;
    }
    return false;
  };

  // --- 描画 ---

  DexScene.prototype.render = function (ctx) {
    var w = this.game.canvas.width;
    var h = this.game.canvas.height;

    this.renderer.clear(this.layout.background || "#000000", w, h);

    // 栞は本の後ろから出ているので、先に描く
    this._renderTabs();
    this._renderBookFrame();
    this._renderProgress();
    this._renderSortLabel();

    if (this.getTab() === "monsters") {
      this._renderMonsterBook();
    } else {
      this.list.render(this.game.clock);
      this._renderDetail();
    }

    this._renderHint();
    this.backButton.render();
  };

  /**
   * 右のページの説明（モンスター以外の表）。
   * 中身は各タブが「行の配列」で作り、ここがページに入る分だけ描く。
   */
  DexScene.prototype._renderDetail = function () {
    var rect = this.layout.detail;

    var m = this._measureDetail();
    if (!m.content) return;

    var t = this.theme;
    var lh = t.lineHeight || 18;

    if (m.content.head) this._renderHead(m.content.head);

    // 内容が変わって行数が減った場合に、行き過ぎたままにならないようにする
    var max = Math.max(0, m.total - m.visible);
    if (this.detailScroll > max) this.detailScroll = max;

    var lines = m.content.lines || [];
    var end = Math.min(lines.length, this.detailScroll + m.visible);
    var y = m.top;

    for (var i = this.detailScroll; i < end; i++) {
      this._renderLine(lines[i], y);
      y += lh;
    }

    this._renderDetailScrollMarks(rect, m);
  };

  // --- 右のページの見出しと行（モンスター以外の表。v1.4.0） ---
  //
  // 説明は { head, lines } で作る。
  //   head  … ページの上に固定で出す。{ icon（絵のid）, mark（絵の代わりの1文字）, name, nameColor, chips: [{ label, color, icon }], sub }
  //   lines … その下に1行ずつ。{ text, color, heading（見出しの色）, dim（まだ分からない色）, icon（16px の絵）,
  //           sprite（モンスターの絵）, unknownSprite（絵の代わりに「？」）, right（右端の文）, rightColor, indent, bar（性格の倍率） }

  /** 見出しの高さ（絵があれば絵の分だけ高い） */
  DexScene.prototype._headHeight = function (head) {
    return (head.icon || head.mark) ? 84 : (head.sub ? 70 : 52);
  };

  DexScene.prototype._renderHead = function (head) {
    var rect = this.layout.detail;
    var origin = this.panel.innerOrigin(rect);
    var t = this.theme;
    var b = this.layout.book || {};
    var ctx = this.panel.ctx;
    var x = origin.x, y = origin.y;
    var hasPicture = !!(head.icon || head.mark);

    if (hasPicture) {
      // 小さな台座に、絵を3倍（48px）で立てる
      ctx.lineWidth = 1;
      ctx.fillStyle = b.pedestal || "rgba(184,154,90,0.12)";
      ctx.beginPath(); ctx.ellipse(x + 30, y + 62, 30, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = b.pedestalLine || "rgba(184,154,90,0.4)";
      ctx.beginPath(); ctx.ellipse(x + 30, y + 62, 30, 7, 0, 0, Math.PI * 2); ctx.stroke();
      if (head.icon) this.sprites.draw(head.icon, x + 6, y + 14, 48, 48);
      else this.panel.drawText(head.mark, x + 30, y + 54, { align: "center", font: "30px monospace", color: b.dim || "#5a4e36" });
      x += 72;
    }

    this.panel.drawText(head.name || "", x, y + (hasPicture ? 30 : 22),
      { font: b.headFont || "18px monospace", color: head.nameColor || b.name || t.textColor });

    var chipX = x, chipY = y + (hasPicture ? 38 : 32);
    var chips = head.chips || [];
    for (var i = 0; i < chips.length; i++) {
      chipX += this._chip(chips[i].label, chipX, chipY, chips[i].color, chips[i].icon) + 6;
    }
    if (head.sub) {
      this.panel.drawText(head.sub, x, chipY + (chips.length ? 36 : 16), { font: t.smallFont, color: t.subTextColor });
    }

    // 見出しと本文の境目の線
    var lineY = y + this._headHeight(head) - 2;
    ctx.strokeStyle = b.frame || "#3a3020";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(origin.x, lineY + 0.5); ctx.lineTo(rect.x + rect.w - (t.padding || 8), lineY + 0.5); ctx.stroke();
  };

  /** 右のページの1行。y は文字の下端 */
  DexScene.prototype._renderLine = function (line, y) {
    var rect = this.layout.detail;
    var origin = this.panel.innerOrigin(rect);
    var t = this.theme;
    var b = this.layout.book || {};
    var x = origin.x + (line.indent || 0);
    var right = rect.x + rect.w - 28;
    var color = line.color || (line.heading ? (b.gold || t.cursorColor) : line.dim ? (b.dim || t.hintColor) : (b.paper || t.subTextColor));

    if (line.sprite) {
      this.sprites.draw(firstFrame(line.sprite), x, y - 15, 18, 18);
      x += 24;
    } else if (line.unknownSprite) {
      this.panel.drawText(this.texts.bookUnknownMark || "？", x + 9, y, { align: "center", font: t.smallFont, color: b.dim || t.hintColor });
      x += 24;
    } else if (line.icon) {
      this.sprites.draw(line.icon, x, y - 13, 16, 16);
      x += 22;
    }

    // 性格の倍率：まんなか（×1.0）から左右に伸びる棒
    if (line.bar) {
      var barX = origin.x + 70, barW = 170, mid = barX + barW / 2;
      var ctx = this.panel.ctx;
      ctx.fillStyle = t.hpBarBg || "#2a3350";
      ctx.fillRect(barX, y - 9, barW, 8);
      var span = Math.max(-1, Math.min(1, (line.bar.value - 1) / (line.bar.range || 0.2)));
      ctx.fillStyle = line.bar.color || t.cursorColor;
      if (span > 0) ctx.fillRect(mid, y - 9, Math.round(barW / 2 * span), 8);
      else if (span < 0) ctx.fillRect(mid + Math.round(barW / 2 * span), y - 9, Math.round(-barW / 2 * span), 8);
      ctx.fillStyle = b.ink || t.textColor;
      ctx.fillRect(mid, y - 11, 1, 12);
    }

    if (line.text) this.panel.drawText(line.text, x, y, { font: line.font || t.smallFont, color: color });
    if (line.right) {
      this.panel.drawText(line.right, right, y,
        { align: "right", font: t.smallFont, color: line.rightColor || color });
    }
  };

  /** 続きがあることを示す印。読むモードのときは色を変えて分かるようにする */
  DexScene.prototype._renderDetailScrollMarks = function (rect, m) {
    var t = this.theme;
    var color = (this.focus === "detail") ? t.cursorColor : t.hintColor;

    if (this.detailScroll > 0) {
      this.panel.drawText("▲", rect.x + rect.w - 16, m.top - 4,
        { font: t.smallFont, color: color });
    }
    if (this.detailScroll + m.visible < m.total) {
      this.panel.drawText("▼", rect.x + rect.w - 16, m.bottom,
        { font: t.smallFont, color: color });
    }
  };

  /** 栞（表の切り替え）。本の上から出ている */
  DexScene.prototype._renderTabs = function () {
    var T = this.layout.tabs;
    if (!T) return;

    var t = this.theme;
    var labels = [this.texts.tabMonsters || "", this.texts.tabItems || "",
                  this.texts.tabAbilities || "", this.texts.tabSkills || "",
                  this.texts.tabNatures || "", this.texts.tabBlessings || ""];

    for (var i = 0; i < labels.length; i++) {
      var x = T.x + (T.w + T.gap) * i;
      var selected = (i === this.tabIndex);

      this.panel.ctx.fillStyle = selected ? (T.activeBg || "#7a5a1e") : (T.bg || "#1f2740");
      this.panel.ctx.fillRect(x, T.y, T.w, T.h);

      this.panel.drawText(labels[i], x + T.w / 2, T.y + 20,
        { align: "center", font: t.smallFont,
          color: selected ? (T.activeText || t.cursorColor) : t.subTextColor });
    }
  };

  /** 本の位置と、左右のページの文を書き始める左端 */
  DexScene.prototype._geo = function () {
    var b = this.layout.book || {};
    var x = (b.x === undefined) ? 24 : b.x;
    var y = (b.y === undefined) ? 44 : b.y;
    var w = b.w || 752;
    var h = b.h || 452;
    return { x: x, y: y, w: w, h: h, mid: x + w / 2, lx: x + 28, rx: x + w / 2 + 30 };
  };

  /** 本の表紙・左右のページ・のどの影・ページの枠の線 */
  DexScene.prototype._renderBookFrame = function () {
    var ctx = this.panel.ctx;
    var b = this.layout.book || {};
    var g = this._geo();

    ctx.fillStyle = b.cover || "#2a2014";
    ctx.fillRect(g.x - 6, g.y - 4, g.w + 12, g.h + 10);
    ctx.fillStyle = b.pageLeft || "#101626";
    ctx.fillRect(g.x, g.y, g.w / 2 - 4, g.h);
    ctx.fillStyle = b.pageRight || "#0f1524";
    ctx.fillRect(g.mid + 4, g.y, g.w / 2 - 4, g.h);

    var shade = ctx.createLinearGradient(g.mid - 18, 0, g.mid + 18, 0);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(0.5, "rgba(0,0,0,0.55)");
    shade.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shade;
    ctx.fillRect(g.mid - 18, g.y, 36, g.h);

    ctx.strokeStyle = b.frame || "#3a3020";
    ctx.lineWidth = 1;
    ctx.strokeRect(g.x + 10.5, g.y + 10.5, g.w / 2 - 24, g.h - 21);
    ctx.strokeRect(g.mid + 13.5, g.y + 10.5, g.w / 2 - 24, g.h - 21);
  };

  /** 並べ方の札（「並び：属性ごと」。右下）。押すと次の並びに変わる（キーは R） */
  DexScene.prototype._renderSortLabel = function () {
    this._sortRect = null;
    if (!this._hasSort()) return;
    var pos = this.layout.sort;
    if (!pos) return;
    var t = this.theme;
    var modes = this.texts.sortModes || {};
    var text = (this.texts.sortLabel || "{mode}").replace("{mode}", modes[this._currentSort()] || this._currentSort());
    var ctx = this.panel.ctx;
    ctx.save();
    ctx.font = t.smallFont || "12px monospace";
    var w = Math.ceil(ctx.measureText(text).width);
    ctx.restore();
    // pos.x は札の右端（文字の数が変わっても右をそろえる）
    this._sortRect = { x: pos.x - w - 12, y: pos.y - 15, w: w + 12, h: 20 };
    ctx.fillStyle = "rgba(74,107,168,0.25)";
    ctx.fillRect(this._sortRect.x, this._sortRect.y, this._sortRect.w, this._sortRect.h);
    this.panel.drawText(text, pos.x - 6, pos.y, { align: "right", font: t.smallFont, color: t.cursorColor });
  };

  /** 収集率（発見数／総数） */
  DexScene.prototype._renderProgress = function () {
    var pos = this.layout.progress;
    if (!pos) return;

    var data = this.game.data;
    var discovery = this.game.discovery;
    var text;

    var tab = this.getTab();
    if (tab === "monsters") {
      text = (this.texts.caughtLabel || "") + " " + discovery.countMonstersCaught() +
             " / " + (this.texts.seenLabel || "") + " " + discovery.countMonstersSeen() +
             " / " + Object.keys(data.monsters).length;
    } else if (tab === "items") {
      text = (this.texts.obtainedLabel || "") + " " + discovery.countItemsObtained() +
             " / " + Object.keys(data.items).length;
    } else if (tab === "abilities" || tab === "skills") {
      var isKnown = (tab === "abilities")
        ? this._isAbilityKnown.bind(this)
        : this._isSkillKnown.bind(this);
      var ids = Object.keys((tab === "abilities" ? data.abilities : this._dexSkills()) || {});
      var known = 0;
      for (var i = 0; i < ids.length; i++) {
        if (isKnown(ids[i])) known++;
      }
      text = (this.texts.knownLabel || "") + " " + known + " / " + ids.length;
    } else if (tab === "blessings") {
      // 買わないと出会えない加護があるので、集めた数として出す
      var blessings = data.blessings || {};
      var ids = Object.keys(blessings);
      var owned = 0;
      for (var b = 0; b < ids.length; b++) {
        if (this._isBlessingKnown(ids[b], blessings[ids[b]])) owned++;
      }
      text = (this.texts.knownLabel || "") + " " + owned + " / " + ids.length;
    } else {
      // 性格は集めるものではないので、総数だけを出す
      text = (this.texts.totalLabel || "") + " " + Object.keys(data.natures || {}).length;
    }

    this.panel.drawText(text, pos.x, pos.y,
      { align: "right", font: this.theme.smallFont, color: this.theme.subTextColor });
  };

  // ============================================================
  // モンスターの表：見開きの本（v1.4.0）
  // ============================================================

  /** 能力の五角形に並べる順（上から時計回り）。名前は仲間画面と同じもの（messages.party） */
  var BOOK_STATS = [
    { key: "baseHp",      label: "HP" },
    { key: "baseAttack",  partyLabel: "attackLabel" },
    { key: "baseDefense", partyLabel: "defenseLabel" },
    { key: "baseSpeed",   partyLabel: "speedLabel" },
    { key: "basePp",      label: "PP" }
  ];

  /** 落とすものを1度に並べる数（これより多い種族・区画で違う種族は、決定で次を見る） */
  var DROP_ROWS = 3;

  /**
   * その相手をどこまで見せるか。
   *   "open" … 仲間にした（倒すだけで開く種族は、倒した）。すべて見せる
   *   "seen" … 出会っただけ。絵・名前・系統・属性・能力まで
   *   "none" … まだ出会っていない。すべて「？」
   */
  DexScene.prototype._monsterKind = function (id) {
    if (this._dexOpen(id)) return "open";
    var discovery = this.game.discovery;
    return (discovery && discovery.isMonsterSeen(id)) ? "seen" : "none";
  };

  /** 図鑑の番号（data/monsters.js に書いた順。並べ替えても変わらない） */
  DexScene.prototype._monsterNumber = function (id) {
    var n = Object.keys(this.game.data.monsters || {}).indexOf(id) + 1;
    return (this.texts.numberLabel || "No.") + (n < 10 ? "00" : n < 100 ? "0" : "") + n;
  };

  /**
   * 五角形の目盛り（その能力の「満タン」の値）。
   * いちばん大きい種族（主など）に合わせると、ほとんどの種族が小さくなるので、
   * 8割の種族が収まる値を満タンにする（はみ出す種族は満タンで止まる）
   */
  DexScene.prototype._statMax = function (key) {
    if (this._statMaxes[key]) return this._statMaxes[key];
    var monsters = this.game.data.monsters || {};
    var values = Object.keys(monsters).map(function (id) { return monsters[id][key] || 0; })
                       .sort(function (a, b) { return a - b; });
    this._statMaxes[key] = values[Math.floor(values.length * 0.8)] || 1;
    return this._statMaxes[key];
  };

  // --- 操作 ---

  DexScene.prototype._updateBook = function (input) {
    var pointer = input.getPointer ? input.getPointer() : null;
    var lineHeight = (this.layout.book || {}).lineHeight || 17;

    if (this.monsterIds.length > 0) {
      // ←→ でめくる（押しっぱなしで送れる）
      var step = this._heldStep(input, "left", "right");
      if (step) this._flip(step);

      // 帯の絵・◀▶ を押してもめくれる。落とすものの欄を押すと、次の区画に変わる
      if (pointer && pointer.clicked) {
        var hit = this._stripHit(pointer);
        if (hit && hit.flip) this._flip(hit.flip);
        else if (hit && hit.id) this._openMonster(hit.id);
        else if (this._dropRect && NS.Panel.containsPoint(this._dropRect, pointer)) this._nextDropPage();
      }

      // ホイール：帯の上ならめくる。ほかは左のページの文を送る
      if (pointer && pointer.wheel && pointer.inside) {
        if (NS.Panel.containsPoint(this._stripRect(), pointer)) this._flip(pointer.wheel > 0 ? 1 : -1);
        else this._scrollPage(pointer.wheel * lineHeight);
      }

      // ↑↓ で左のページの文を送る
      var move = this._heldStep(input, "up", "down");
      if (move) this._scrollPage(move * lineHeight);

      if (input.isPressed("confirm")) this._nextDropPage();
    }

    if (input.isPressed("cancel")) this.game.scenes.change(this.returnScene);
  };

  /**
   * 押した瞬間と、押しっぱなしの間の「1つ送る」を返す（-1 / 0 / 1）。
   * 種族が多いので、←→ を1回ずつ押さなくても送れるようにする。
   * 待つ時間は data/ui.js の dex.repeat（delay … 送り始めるまで／interval … 送る間隔。ms）
   */
  DexScene.prototype._heldStep = function (input, negative, positive) {
    var now = this.game.clock || 0;
    var repeat = this.layout.repeat || {};
    var key = negative + "/" + positive;

    var pressed = input.isPressed(negative) ? negative : (input.isPressed(positive) ? positive : null);
    if (pressed) {
      this._holds[key] = { action: pressed, next: now + (repeat.delay || 380) };
      return (pressed === negative) ? -1 : 1;
    }

    var hold = this._holds[key];
    if (!hold) return 0;
    if (!input.isDown || !input.isDown(hold.action)) { delete this._holds[key]; return 0; }
    if (now < hold.next) return 0;
    hold.next = now + (repeat.interval || 90);
    return (hold.action === negative) ? -1 : 1;
  };

  /** 前後の相手へめくる（端までいったら反対の端へ） */
  DexScene.prototype._flip = function (direction) {
    var count = this.monsterIds.length;
    if (!count) return;
    var index = this.monsterIds.indexOf(this.monsterId);
    this._openMonster(this.monsterIds[(index + direction + count) % count]);
  };

  /** その種族のページを開く。文と落とすものは頭から */
  DexScene.prototype._openMonster = function (id) {
    if (id === this.monsterId) return;
    this.monsterId = id;
    this.pageScroll = 0;
    this.dropGroup = 0;
  };

  DexScene.prototype._scrollPage = function (amount) {
    this.pageScroll = Math.max(0, Math.min(this._pageMax(), this.pageScroll + amount));
  };

  /** 落とすものの次の区画（または続き）を見せる。1つしか無ければ何もしない */
  DexScene.prototype._nextDropPage = function () {
    var pages = this._dropPages(this.monsterId);
    if (pages.length < 2) return;
    this.dropGroup = (this.dropGroup + 1) % pages.length;
  };

  // --- 左のページの文 ---

  /** 左のページで、文を見せる範囲（絵の下からページの下まで） */
  DexScene.prototype._pageView = function () {
    var g = this._geo();
    return { x: g.x + 14, y: g.y + 216, w: g.w / 2 - 32, h: g.h - 234 };
  };

  /**
   * 左のページの文を、行の配列で返す（[{ text, color, h, extra }]。h は行の高さ・extra は同じ行の右に添える文）。
   *   説明 → 愛情度の記録（慣れ・信頼・絆。まだ読めない段階は見出しと「？？？」）→ 特性の説明
   * 出会っただけ・まだ出会っていない相手は、説明の代わりに一言だけ。
   * 種族が変わるまで使い回す（図鑑を開いている間に、記録が増えることは無い）
   */
  DexScene.prototype._pageLines = function () {
    var id = this.monsterId;
    if (this._pageCache && this._pageCache.id === id) return this._pageCache.lines;

    var data = this.game.data;
    var b = this.layout.book || {};
    var texts = this.texts;
    var monster = data.getMonsterData(id) || {};
    var kind = this._monsterKind(id);
    var chars = b.charsPerLine || 26;
    var lineHeight = b.lineHeight || 17;
    var paper = b.paper || "#c9c0a8", gold = b.gold || "#b89a5a", dim = b.dim || "#5a4e36";
    var lines = [];

    function push(text, color, extra) { lines.push({ text: text, color: color, h: lineHeight, extra: extra || null }); }
    function gap(h) { lines.push({ text: "", h: h }); }
    function wrapped(text, color) {
      var parts = wrapText(text || "", chars);
      for (var i = 0; i < parts.length; i++) push(parts[i], color);
    }

    if (kind === "open") wrapped(monster.description, paper);
    else push((kind === "seen" ? texts.bookNotCaughtNote : texts.unknownDesc) || "", dim);
    gap(10);

    // 愛情度の記録。どこまで読めるかは、その種族でいちばん深まった段階（Discovery.getAffectionStage）
    var stages = (data.affection || {}).stages || [];
    var discovery = this.game.discovery;
    var reached = (kind === "open" && discovery && discovery.getAffectionStage) ? discovery.getAffectionStage(id) : 0;
    var records = monster.records || {};
    for (var s = 1; s < stages.length; s++) {
      var label = (texts.recordLabel || "― {stage} ―").replace("{stage}", stages[s].name);
      if (s <= reached && records[stages[s].id]) {
        push(label, gold);
        wrapped(records[stages[s].id], paper);
      } else {
        push(label, dim, { text: texts.recordUnknown || "？？？", dx: 84, color: dim });
      }
      gap(6);
    }

    // 特性の説明（右のページには名前だけ出している）
    if (kind === "open") {
      var abilities = this.abilitySystem.resolveAbilities(monster);
      for (var a = 0; a < abilities.length; a++) {
        push((texts.abilityRecordLabel || "― 特性：{name} ―").replace("{name}", abilities[a].name), gold);
        wrapped(abilities[a].description, paper);
        gap(6);
      }
    }

    this._pageCache = { id: id, lines: lines };
    return lines;
  };

  /** 左のページの文をどこまで送れるか（px。0 なら全部見えている） */
  DexScene.prototype._pageMax = function () {
    var lines = this._pageLines();
    var total = 0;
    for (var i = 0; i < lines.length; i++) total += lines[i].h;
    // 最後の行のあとの空きは数えない
    if (lines.length && !lines[lines.length - 1].text) total -= lines[lines.length - 1].h;
    return Math.max(0, total - this._pageView().h);
  };

  // --- 落とすもの ---

  /**
   * 右のページの「落とすもの」を、1度に見せる分ごとに分けて返す。[{ areas, drops }]
   * 区画で違う種族（_dropGroups が2つ以上）は区画ごと。1つの区画に DROP_ROWS より多ければ、続きを次に回す。
   * 仲間にしていない相手は空（「？？？」と出す）
   */
  DexScene.prototype._dropPages = function (id) {
    if (!id || this._monsterKind(id) !== "open") return [];
    var data = this.game.data;
    var groups = this._dropGroups(data.getMonsterData(id) || {});
    var pages = [];

    for (var g = 0; g < groups.length; g++) {
      var drops = (groups[g].drops || []).filter(function (drop) { return !!data.getItem(drop.item); });
      var areas = (groups.length > 1) ? groups[g].areas : [];
      if (drops.length === 0) { if (groups.length > 1) pages.push({ areas: areas, drops: [] }); continue; }
      for (var i = 0; i < drops.length; i += DROP_ROWS) {
        pages.push({ areas: areas, drops: drops.slice(i, i + DROP_ROWS) });
      }
    }
    return pages;
  };

  // --- 描く ---

  DexScene.prototype._renderMonsterBook = function () {
    this._dropRect = null;
    var id = this.monsterId;
    var monster = id ? this.game.data.getMonsterData(id) : null;
    if (!monster) return;

    var kind = this._monsterKind(id);
    this._renderLeftPage(id, monster, kind);
    this._renderRightPage(id, monster, kind);
    this._renderStrip();
  };

  /** 枠つきの小さな札（系統・属性）。属性は絵（icon）つき。描いた幅を返す */
  DexScene.prototype._chip = function (label, x, y, color, iconId) {
    var ctx = this.panel.ctx;
    var t = this.theme;
    color = color || t.subTextColor;

    ctx.font = t.smallFont || "12px monospace";
    var left = iconId ? 22 : 7;
    var w = Math.ceil(ctx.measureText(label).width) + left + (iconId ? 8 : 7);

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(x, y, w, 20);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 19);
    if (iconId) this.sprites.draw(iconId, x + 3, y + 2, 16, 16);
    this.panel.drawText(label, x + left, y + 15, { font: t.smallFont, color: color });
    return w;
  };

  /** 左のページ：番号・名前・系統と属性・台座に立つ絵・説明と記録 */
  DexScene.prototype._renderLeftPage = function (id, monster, kind) {
    var data = this.game.data;
    var t = this.theme;
    var b = this.layout.book || {};
    var g = this._geo();
    var ctx = this.panel.ctx;
    var texts = this.texts;
    var known = (kind !== "none");
    var gold = b.gold || "#b89a5a", dim = b.dim || "#5a4e36";

    this.panel.drawText(this._monsterNumber(id), g.lx, g.y + 36, { font: t.smallFont, color: gold });
    this.panel.drawText(known ? monster.name : (texts.bookUnknownName || "？？？"), g.lx, g.y + 62,
      { font: b.nameFont || "22px monospace", color: known ? (b.name || "#f0e6cc") : dim });

    if (known) {
      var family = ((data.categories || {}).monster || {})[monster.family];
      var element = (data.elements || {})[monster.element];
      var x = g.lx;
      if (family) x += this._chip(family.name, x, g.y + 72, family.color, null) + 6;
      if (element) x += this._chip(element.name, x, g.y + 72, element.color, element.icon) + 6;
      if (!this.game.discovery.isMonsterCaught(id)) {
        this.panel.drawText(texts.notCaught || "", Math.max(x + 4, g.lx + 200), g.y + 87,
          { font: t.smallFont, color: t.hintColor });
      }
    }

    // 台座と絵。絵は今までの図鑑と同じく、種族ごとの動きで動かす
    var px = g.x + g.w / 4, py = g.y + 196;
    ctx.lineWidth = 1;
    ctx.fillStyle = b.pedestal || "rgba(184,154,90,0.12)";
    ctx.beginPath(); ctx.ellipse(px, py, 84, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = b.pedestalLine || "rgba(184,154,90,0.4)";
    ctx.beginPath(); ctx.ellipse(px, py, 84, 16, 0, 0, Math.PI * 2); ctx.stroke();

    if (known) {
      var size = Math.round((b.spriteSize || 104) * Math.min(b.spriteMaxScale || 1.15, monster.sizeScale || 1));
      this.sprites.drawMotion(monster.sprite, px - size / 2, py - size + 6, size, size,
        NS.Motion.forSprite(data, monster.sprite, monster.motion, this.game.clock, 0));
    } else {
      this.panel.drawText(texts.bookUnknownMark || "？", px, py - 22,
        { align: "center", font: b.unknownFont || "64px monospace", color: b.frame || "#3a3020" });
    }

    // 説明と記録。入りきらない分は ↑↓ で送る
    var view = this._pageView();
    var lines = this._pageLines();
    var max = this._pageMax();
    if (this.pageScroll > max) this.pageScroll = max;

    ctx.save();
    ctx.beginPath();
    ctx.rect(view.x, view.y, view.w, view.h);
    ctx.clip();
    var y = view.y - this.pageScroll;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.text && y + line.h > view.y && y < view.y + view.h) {
        this.panel.drawText(line.text, g.lx, y + 14, { font: t.smallFont, color: line.color });
        if (line.extra) {
          this.panel.drawText(line.extra.text, g.lx + line.extra.dx, y + 14,
            { font: t.smallFont, color: line.extra.color });
        }
      }
      y += line.h;
    }
    ctx.restore();

    if (this.pageScroll > 0) {
      this.panel.drawText("▲", g.mid - 32, view.y + 12, { font: t.smallFont, color: gold });
    }
    if (this.pageScroll < max) {
      this.panel.drawText("▼", g.mid - 32, view.y + view.h - 2, { font: t.smallFont, color: gold });
    }
  };

  /** 右のページ：能力の五角形・耐性の表・落とすもの・特性 */
  DexScene.prototype._renderRightPage = function (id, monster, kind) {
    var data = this.game.data;
    var t = this.theme;
    var b = this.layout.book || {};
    var g = this._geo();
    var ctx = this.panel.ctx;
    var texts = this.texts;
    var party = (data.messages || {}).party || {};
    var known = (kind !== "none"), open = (kind === "open");
    var gold = b.gold || "#b89a5a", dim = b.dim || "#5a4e36", ink = b.ink || "#e0d6bc";
    var rx = g.rx;
    var i;

    // --- 能力（基礎値）の五角形 ---
    this.panel.drawText(texts.statsLabel || "", rx, g.y + 36, { font: t.smallFont, color: gold });

    var cx = rx + 160, cy = g.y + 124, radius = b.statRadius || 64;
    var count = BOOK_STATS.length;
    function point(index, r) {
      var angle = -Math.PI / 2 + index * Math.PI * 2 / count;
      return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    }
    function polygon(radiusOf) {
      ctx.beginPath();
      for (var k = 0; k < count; k++) {
        var p = point(k, radiusOf(k));
        if (k) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y);
      }
      ctx.closePath();
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = b.grid || "rgba(184,154,90,0.25)";
    var rings = [1, 0.66, 0.33];
    for (i = 0; i < rings.length; i++) {
      polygon(function () { return radius * rings[i]; });
      ctx.stroke();
    }

    if (known) {
      var self = this;
      polygon(function (k) {
        var ratio = (monster[BOOK_STATS[k].key] || 0) / self._statMax(BOOK_STATS[k].key);
        return radius * Math.min(1, Math.max(0.08, ratio));
      });
      ctx.fillStyle = b.statFill || "rgba(255,215,94,0.28)";
      ctx.fill();
      ctx.strokeStyle = t.cursorColor || "#ffd75e";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.lineWidth = 1;
    }

    for (i = 0; i < count; i++) {
      var stat = BOOK_STATS[i];
      var name = stat.label || party[stat.partyLabel] || "";
      var at = point(i, radius + 18);
      this.panel.drawText(name + " " + (known ? (monster[stat.key] || 0) : (texts.bookUnknownMark || "？")),
        at.x, at.y + 4, { align: "center", font: b.statFont || "11px monospace", color: known ? ink : dim });
    }

    // スカウト率とレベル上限は、仲間にした種族だけ
    if (open) {
      var growth = data.growth || {};
      var maxLevel = monster.maxLevel || growth.defaultMaxLevel || 50;
      if (growth.levelCap) maxLevel = Math.min(maxLevel, growth.levelCap);
      this.panel.drawText(
        (texts.scoutLabel || "") + " " + Math.round((monster.scoutRate || 0) * 100) + "%   " +
        (texts.maxLevelShort || "") + " " + maxLevel,
        rx, g.y + 222, { font: t.smallFont, color: t.subTextColor });
    }

    // --- 耐性の表（絵のある属性をぜんぶ。弱点は赤・強いものは青） ---
    var top = g.y + 252;
    this.panel.drawText(texts.resistanceLabel || "", rx, top, { font: t.smallFont, color: gold });

    var elements = data.elements || {};
    var elementIds = Object.keys(elements).filter(function (key) { return !!elements[key].icon; });
    var resistances = monster.resistances || {};
    for (i = 0; i < elementIds.length; i++) {
      var element = elements[elementIds[i]];
      var value = resistances[elementIds[i]] || 0;
      var ex = rx + (i % 4) * 82, ey = top + 10 + Math.floor(i / 4) * 30;

      ctx.fillStyle = !open ? "rgba(255,255,255,0.03)"
        : value > 0 ? (b.resistBg || "rgba(79,140,232,0.18)")
        : value < 0 ? (b.weakBg || "rgba(232,84,42,0.2)") : "rgba(255,255,255,0.04)";
      ctx.fillRect(ex, ey, 76, 24);
      this.sprites.draw(element.icon, ex + 4, ey + 4, 16, 16);
      this.panel.drawText(element.name, ex + 24, ey + 16,
        { font: t.smallFont, color: (open && value) ? t.textColor : t.hintColor });
      this.panel.drawText(
        !open ? (texts.bookUnknownMark || "？") : (value === 0 ? "-" : (value > 0 ? "+" : "") + value),
        ex + 70, ey + 16,
        { align: "right", font: t.smallFont,
          color: !open ? dim : value > 0 ? (b.resistText || "#8fb8ff") : value < 0 ? (b.weakText || "#ff9a7a") : t.hintColor });
    }

    // --- 落とすもの ---
    var dropTop = top + 90;
    this.panel.drawText(texts.dropLabel || "", rx, dropTop, { font: t.smallFont, color: gold });

    if (open) {
      var pages = this._dropPages(id);
      if (this.dropGroup >= pages.length) this.dropGroup = 0;
      var page = pages[this.dropGroup];

      // 区画で違う種族・3つより多い種族は、決定（またはこの欄を押す）で次を見る
      if (pages.length > 1) {
        var area = page.areas.length ? fillText(texts.dropAreaLabel || "〈{area}〉", { area: page.areas.join("・") }) + "  " : "";
        this.panel.drawText(area + (this.dropGroup + 1) + "/" + pages.length, rx + 310, dropTop,
          { align: "right", font: t.smallFont, color: t.subTextColor });
        this._dropRect = { x: rx - 6, y: dropTop - 14, w: 322, h: 22 + DROP_ROWS * 22 };
      }

      if (!page || page.drops.length === 0) {
        this.panel.drawText(texts.dropNone || "-", rx, dropTop + 22, { font: t.smallFont, color: dim });
      } else {
        for (i = 0; i < page.drops.length; i++) {
          var drop = page.drops[i];
          var item = data.getItem(drop.item);
          var rowY = dropTop + 22 + i * 22;

          // 個数に幅があるものは「（1〜2個）」を添える
          var min = (drop.min === undefined) ? 1 : drop.min;
          var most = (drop.max === undefined) ? min : drop.max;
          var amount = (most > min) ? ("（" + min + "〜" + most + "個）") : "";

          if (item.icon) this.sprites.draw(item.icon, rx, rowY - 14, 16, 16);
          this.panel.drawText(item.name + amount, rx + 22, rowY, { font: t.smallFont, color: b.dropText || "#d8ceb4" });
          this.panel.drawText(Math.round((drop.rate || 0) * 100) + "%", rx + 310, rowY,
            { align: "right", font: t.smallFont, color: b.dropText || "#d8ceb4" });
        }
      }
    } else {
      this.panel.drawText(texts.recordUnknown || "？？？", rx, dropTop + 22, { font: t.smallFont, color: dim });
    }

    // --- 特性（名前だけ。説明は左のページの最後） ---
    var abilityText = texts.recordUnknown || "？？？";
    if (open) {
      var abilities = this.abilitySystem.resolveAbilities(monster);
      var names = [];
      for (i = 0; i < abilities.length; i++) names.push(abilities[i].name);
      abilityText = names.length ? names.join("・") : "-";
    }
    this.panel.drawText((texts.abilityLabel || "") + "  " + abilityText, rx, g.y + g.h - 24,
      { font: t.smallFont, color: open ? ink : dim });
  };

  // --- 下の帯（前後の相手） ---

  /** 帯の配置（data/ui.js の dex.strip） */
  DexScene.prototype._stripLayout = function () {
    var S = this.layout.strip || {};
    return {
      x: S.x || 330, y: S.y || 508, pitch: S.pitch || 66,
      w: S.w || 56, h: S.h || 44, side: S.side || 4
    };
  };

  /** 帯ぜんたいの範囲（◀ から ▶ まで） */
  DexScene.prototype._stripRect = function () {
    var S = this._stripLayout();
    var left = S.x - S.side * S.pitch - 36;
    return { x: left, y: S.y, w: (S.x + S.side * S.pitch + S.w + 26) - left, h: S.h };
  };

  /** いま帯に並ぶ相手（[{ id, current, rect }]。端では片側が空く）と、◀▶ の範囲 */
  DexScene.prototype._stripSlots = function () {
    var S = this._stripLayout();
    var index = this.monsterIds.indexOf(this.monsterId);
    var slots = [];
    for (var k = -S.side; k <= S.side; k++) {
      var i = index + k;
      if (i < 0 || i >= this.monsterIds.length) continue;
      slots.push({ id: this.monsterIds[i], current: k === 0,
                   rect: { x: S.x + k * S.pitch, y: S.y, w: S.w, h: S.h } });
    }
    return {
      slots: slots,
      prev: { x: S.x - S.side * S.pitch - 36, y: S.y, w: 30, h: S.h },
      next: { x: S.x + S.side * S.pitch + S.w, y: S.y, w: 26, h: S.h }
    };
  };

  /** 帯のどこを押したか。{ flip: -1/1 }（◀▶）か { id }（絵）。帯の外なら null */
  DexScene.prototype._stripHit = function (pointer) {
    var strip = this._stripSlots();
    if (NS.Panel.containsPoint(strip.prev, pointer)) return { flip: -1 };
    if (NS.Panel.containsPoint(strip.next, pointer)) return { flip: 1 };
    for (var i = 0; i < strip.slots.length; i++) {
      if (NS.Panel.containsPoint(strip.slots[i].rect, pointer)) return { id: strip.slots[i].id };
    }
    return null;
  };

  DexScene.prototype._renderStrip = function () {
    var t = this.theme;
    var b = this.layout.book || {};
    var ctx = this.panel.ctx;
    var data = this.game.data;
    var discovery = this.game.discovery;
    var strip = this._stripSlots();

    this.panel.drawText("◀", strip.prev.x + 4, strip.prev.y + 30, { font: t.font, color: t.subTextColor });
    this.panel.drawText("▶", strip.next.x + 4, strip.next.y + 30, { font: t.font, color: t.subTextColor });

    for (var i = 0; i < strip.slots.length; i++) {
      var slot = strip.slots[i];
      var r = slot.rect;
      var monster = data.getMonsterData(slot.id) || {};
      var kind = this._monsterKind(slot.id);

      ctx.fillStyle = slot.current ? (b.stripCurrent || "rgba(255,215,94,0.12)") : (b.stripBg || "#0e1424");
      ctx.fillRect(r.x, r.y, r.w, r.h);
      if (slot.current) {
        ctx.strokeStyle = t.cursorColor || "#ffd75e";
        ctx.lineWidth = 2;
        ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      }

      if (kind === "none") {
        this.panel.drawText(this.texts.bookUnknownMark || "？", r.x + r.w / 2, r.y + 30,
          { align: "center", font: "18px monospace", color: b.stripUnknown || "#4a5578" });
      } else {
        var size = slot.current ? 40 : 32;
        this.sprites.draw(firstFrame(monster.sprite), r.x + (r.w - size) / 2, r.y + (r.h - size) / 2, size, size);
      }
      if (discovery.isMonsterCaught(slot.id)) {
        this.panel.drawText("★", r.x + r.w - 3, r.y + 11,
          { align: "right", font: "10px monospace", color: t.cursorColor });
      }
    }
  };

  /** コマ絵（配列）なら1枚目 */
  function firstFrame(sprite) {
    return (Object.prototype.toString.call(sprite) === "[object Array]") ? sprite[0] : sprite;
  }

  /**
   * いま読める愛情度の記録を [{ label, text }] で返す（label は「― 慣れ ―」の見出し）。
   * 仲間の「様子を見る」（モンスター説明のページ）が使う。
   * 図鑑の左のページ（_pageLines）は、まだ読めない段階も「？？？」で出すので自分で組み立てている。
   * どこまで読めるかは、その種族でいちばん深まった段階（Discovery.getAffectionStage）
   * @param {MyGame.Game} game
   * @param {string} speciesId
   */
  /**
   * アイテムの手に入る場所を、図鑑を開かずに行で返す（工房の「足りない素材」で使う。v1.4.0）。
   * 図鑑のアイテムのページと同じ中身・同じ伏せ方（会っていない相手は「？？？」）。
   * 行の形は右のページと同じ（{ text, sprite, unknownSprite, icon, right, indent, dim }）
   * @param {MyGame.Game} game
   * @param {string} itemId
   */
  DexScene.itemSources = function (game, itemId, options) {
    var view = Object.create(DexScene.prototype);
    view.game = game;
    view.texts = (game.data.messages || {}).dex || {};
    // reveal … アイテムの名前は伏せない（工房・お店。レシピはそこで名前ごと見えているので）。モンスターは伏せたまま
    view._revealItems = !!(options && options.reveal);
    return view._itemSources(itemId);
  };

  /** そのアイテムを材料にして作れるもの（いま工房に並んでいるレシピだけ）。行の形は itemSources と同じ */
  DexScene.itemUses = function (game, itemId, options) {
    var view = Object.create(DexScene.prototype);
    view.game = game;
    view.texts = (game.data.messages || {}).dex || {};
    view._revealItems = !!(options && options.reveal);
    return view._itemUses(itemId);
  };

  DexScene.recordEntries = function (game, speciesId) {
    var species = game.data.getMonsterData ? game.data.getMonsterData(speciesId) : null;
    var records = (species && species.records) || {};
    var stages = (game.data.affection || {}).stages || [];
    var reached = (game.discovery && game.discovery.getAffectionStage)
      ? game.discovery.getAffectionStage(speciesId) : 0;
    var label = ((game.data.messages || {}).dex || {}).recordLabel || "― {stage} ―";

    var result = [];
    for (var i = 1; i <= reached && i < stages.length; i++) {
      var text = records[stages[i].id];
      if (!text) continue;
      result.push({ label: label.replace("{stage}", stages[i].name), text: text });
    }
    return result;
  };

  /**
   * その種族の落とすものを、区画ごとにまとめて返す。[{ areas: [区画の名前], drops }]
   *
   * どの区画でも同じ（dropOverrides を書いていない）なら、種族の drops の1件だけ（areas は空）。
   * 違う区画があるときは、出る区画のうち開いているものだけを、同じ中身どうしでまとめて並べる。
   * まだ開いていない区画の名前は出さない（先の区画の名前が図鑑から分かってしまわないように）。
   */
  DexScene.prototype._dropGroups = function (monster) {
    var data = this.game.data;
    var base = monster.drops || [];
    var plain = [{ areas: [], drops: base }];
    if (!NS.DungeonCatalog || !NS.DropSystem) return plain;

    var dungeons = NS.DungeonCatalog.list(data);
    var cleared = this.game.clearedDungeons;
    var groups = [];
    var byKey = {};
    var varies = false;

    for (var i = 0; i < dungeons.length; i++) {
      var d = dungeons[i];
      if (!speciesIn(NS.DungeonCatalog.getSpecies(data, d), monster.id)) continue;
      var drops = NS.DropSystem.dropsIn(d, monster.id, base) || [];
      if (drops !== base) varies = true;

      var region = (data.regions || {})[d.region];
      var open = NS.DungeonCatalog.isUnlocked(d, cleared, data) &&
                 (!region || NS.DungeonCatalog.isRegionUnlocked(region, cleared, data));
      if (!open) continue;

      var key = JSON.stringify(drops);
      if (!byKey[key]) {
        byKey[key] = { areas: [], drops: drops };
        groups.push(byKey[key]);
      }
      byKey[key].areas.push(d.name);
    }

    if (!varies || groups.length === 0) return plain;
    if (groups.length === 1) return [{ areas: [], drops: groups[0].drops }];
    return groups;
  };

  function speciesIn(list, id) {
    for (var i = 0; i < (list || []).length; i++) {
      if (list[i].id === id) return true;
    }
    return false;
  }

  // ============================================================
  // ほかの表の右のページ（v1.4.0。{ head, lines } で作る。描き方は _renderHead / _renderLine）
  // ============================================================

  /** まだ分からないものの見出し（名前は「？？？」・絵の代わりに「？」） */
  DexScene.prototype._unknownHead = function (withMark) {
    var b = this.layout.book || {};
    return { mark: withMark ? (this.texts.bookUnknownMark || "？") : null,
             name: this.texts.bookUnknownName || "？？？", nameColor: b.dim || this.theme.hintColor };
  };

  /** 見出しの行（金色） */
  function heading(text) { return { text: text, heading: true }; }
  /** 空きの行 */
  function blank() { return { text: "" }; }

  /** アイテムの説明 */
  DexScene.prototype._buildItemDetail = function () {
    var selected = this.list.getSelected();
    if (!selected) return null;

    var data = this.game.data;
    var item = data.getItem(selected.value);
    if (!item) return null;

    var texts = this.texts;
    var lines = [];

    if (!this.game.discovery.isItemObtained(selected.value)) {
      lines.push({ text: texts.unknownItem || "", dim: true });
      return { head: this._unknownHead(true), lines: lines };
    }

    // 見出し：絵・名前・分類（装備は「装備・武器」）・持っている数と売値
    var chips = [];
    var category = ((data.categories || {}).item || {})[item.category];
    if (category) {
      var label = category.name;
      if (item.equip) label += "・" + NS.EffectSystem.slotName(item, data);
      chips.push({ label: label, color: category.color });
    }
    var shop = new NS.ShopSystem(data);
    var sell = shop.getSellPrice(item);
    var owned = this.game.inventory ? this.game.inventory.getCount(item.id) : 0;
    var sub = fillText(texts.ownedLabel || "所持 {n}", { n: owned }) + "　" +
              (sell > 0 ? fillText(texts.sellLabel || "売値 {g}G", { g: sell }) : (texts.sellNone || "売れない"));

    this._pushWrapped(lines, item.description);

    // 装備なら効果
    if (item.equip) {
      lines.push(blank());
      lines.push(heading(texts.effectLabel || ""));
      var effects = item.equip.effects || [];
      for (var e = 0; e < effects.length; e++) {
        var text = NS.EffectSystem.describeEffect(effects[e], data);
        if (text) this._pushWrapped(lines, "・" + text);
      }
    }

    // 手に入る場所：落とす相手・宝箱・店・工房
    var sources = this._itemSources(item.id);
    lines.push(blank());
    lines.push(heading(texts.sourceLabel || ""));
    if (sources.length === 0) lines.push({ text: texts.sourceNone || "", dim: true });
    for (var s = 0; s < sources.length; s++) lines.push(sources[s]);

    // 使い道：これを材料にして、工房で作れるもの
    var uses = this._itemUses(item.id);
    if (uses.length > 0) {
      lines.push(blank());
      lines.push(heading(texts.usedInLabel || ""));
      for (var u = 0; u < uses.length; u++) lines.push(uses[u]);
    }

    return { head: { icon: item.icon, name: item.name, chips: chips, sub: sub }, lines: lines };
  };

  /**
   * そのアイテムの出どころを、右のページの行で返す。
   *
   * ★ まだ会っていないモンスターは名前も絵も伏せる（？？？）。
   *   図鑑に載っていない相手が「何を落とすか」で先に分かってしまうと、
   *   出会いの楽しみが減る。会っていれば確率まで出す。
   * 店と工房は、いま開いているものだけ（まだ並んでいない店の品は出さない）。
   */
  DexScene.prototype._itemSources = function (itemId) {
    var data = this.game.data;
    var discovery = this.game.discovery;
    var texts = this.texts;
    var cleared = this.game.clearedDungeons || {};
    var lines = [];
    var id;

    // 落とすモンスター（主も種族の drops に書いてある）。
    // 区画で確率が違う種族は「ヌマボネ（蔦這う回廊）  15%」のように区画ごとに出す（_dropGroups）
    var monsters = data.monsters || {};
    for (id in monsters) {
      if (!Object.prototype.hasOwnProperty.call(monsters, id)) continue;
      var seen = discovery.isMonsterSeen(id);
      // 会っていない相手は区画も伏せて、1行だけ出す
      var groups = seen ? this._dropGroups(monsters[id]) : [{ areas: [], drops: monsters[id].drops || [] }];
      for (var g = 0; g < groups.length; g++) {
        var drops = groups[g].drops || [];
        for (var i = 0; i < drops.length; i++) {
          if (drops[i].item !== itemId) continue;
          var name = seen ? monsters[id].name : (texts.unknownName || "???");
          if (groups[g].areas.length > 0) name += "（" + groups[g].areas.join("・") + "）";
          lines.push({
            sprite: seen ? monsters[id].sprite : null,
            unknownSprite: !seen,
            text: name,
            dim: !seen,
            right: seen ? Math.round((drops[i].rate || 0) * 100) + "%" : "?%"
          });
        }
      }
    }

    // 宝箱。どこでも出る中身と、その場所だけの中身
    var chest = ((data.features || {}).chest || {}).effect || {};
    if (tableHas(chest.table, itemId)) lines.push({ text: texts.sourceChest || "宝箱" });

    var dungeons = data.dungeons || {};
    for (id in dungeons) {
      if (!Object.prototype.hasOwnProperty.call(dungeons, id)) continue;
      var tables = dungeons[id].featureTables || {};
      if (tableHas(tables.chest, itemId)) {
        lines.push({ text: fillText(texts.sourceChestAt || "宝箱（{name}）", { name: dungeons[id].name }) });
      }
    }

    // 店（いま並んでいる店だけ。加護の店は品物を売らない）
    if (NS.ShopSystem) {
      var shopSystem = new NS.ShopSystem(data);
      var shops = shopSystem.getShops(cleared);
      for (var k = 0; k < shops.length; k++) {
        if (shops[k].type === "blessing") continue;
        var stock = shopSystem.getStock(cleared, shops[k]);
        for (var st = 0; st < stock.length; st++) {
          if (stock[st].item.id !== itemId) continue;
          lines.push({ icon: "iconShop", text: fillText(texts.sourceShop || "{shop}で買える", { shop: shops[k].name }),
                       right: stock[st].price + "G" });
        }
      }
    }

    // 工房（いま作れるレシピだけ）。材料も並べる
    var recipes = this._openRecipes();
    for (var r = 0; r < recipes.length; r++) {
      if ((recipes[r].result || {}).item !== itemId) continue;
      lines.push({ icon: "iconCraft", text: texts.sourceCraft || "工房で作れる",
                   right: recipes[r].gold ? recipes[r].gold + "G" : "" });
      var materials = recipes[r].materials || [];
      for (var m = 0; m < materials.length; m++) {
        lines.push(this._itemRow(materials[m].item, "×" + materials[m].count, 22));
      }
    }
    return lines;
  };

  /** そのアイテムを材料にして作れるもの（いま作れるレシピだけ） */
  DexScene.prototype._itemUses = function (itemId) {
    var recipes = this._openRecipes();
    var lines = [];
    for (var r = 0; r < recipes.length; r++) {
      var materials = recipes[r].materials || [];
      for (var m = 0; m < materials.length; m++) {
        if (materials[m].item !== itemId) continue;
        lines.push(this._itemRow((recipes[r].result || {}).item, fillText(this.texts.usedCount || "{n}個使う", { n: materials[m].count }), 0));
      }
    }
    return lines;
  };

  /** いま工房に並んでいるレシピ */
  DexScene.prototype._openRecipes = function () {
    if (!NS.CraftSystem) return [];
    return new NS.CraftSystem(this.game.data).getRecipes(this.game.clearedDungeons || {});
  };

  /** アイテム1つの行（絵と名前。まだ手に入れていないものは「？？？」） */
  DexScene.prototype._itemRow = function (itemId, right, indent) {
    var item = this.game.data.getItem(itemId) || {};
    var known = this._revealItems || this.game.discovery.isItemObtained(itemId);
    return {
      indent: indent || 0,
      icon: known ? item.icon : null,
      unknownSprite: !known,
      text: known ? item.name : (this.texts.unknownName || "???"),
      dim: !known,
      right: right
    };
  };

  function tableHas(table, itemId) {
    for (var i = 0; i < (table || []).length; i++) {
      if (table[i].item === itemId) return true;
    }
    return false;
  }

  function fillText(template, values) {
    return (template || "").replace(/\{(\w+)\}/g, function (m, key) {
      return (values[key] !== undefined) ? values[key] : m;
    });
  }

  /**
   * モンスターの行（絵と名前）。図鑑で詳しく開いていない相手は「？？？」。
   * 特性の「持っているモンスター」・技の「覚えるモンスター」で使う
   */
  DexScene.prototype._monsterRow = function (species, right) {
    var open = this._dexOpen(species.id);
    return {
      sprite: open ? species.sprite : null,
      unknownSprite: !open,
      text: open ? species.name : (this.texts.unknownName || "???"),
      dim: !open,
      right: open ? right : "?"
    };
  };

  /** 特性の説明 */
  DexScene.prototype._buildAbilityDetail = function () {
    var selected = this.list.getSelected();
    if (!selected) return null;

    var data = this.game.data;
    var ability = (data.abilities || {})[selected.value];
    if (!ability) return null;

    var texts = this.texts;
    var lines = [];

    // まだ持っているモンスターを仲間にしていなければ伏せる
    if (!this._isAbilityKnown(selected.value)) {
      lines.push({ text: texts.unknownAbility || "", dim: true });
      return { head: this._unknownHead(false), lines: lines };
    }

    var chips = [];
    var category = ((data.categories || {}).ability || {})[ability.category];
    if (category) chips.push({ label: category.name, color: category.color });

    this._pushWrapped(lines, ability.description);

    // この特性を持つモンスター。まだ仲間にしていない相手も「？？？」で並ぶ（あと何体いるかが分かる）
    var owners = this._ownersOf(selected.value, false);
    if (owners.length > 0) {
      lines.push(blank());
      lines.push(heading(texts.ownerLabel || ""));
      for (var i = 0; i < owners.length; i++) lines.push(this._monsterRow(owners[i], ""));
    }
    return { head: { name: ability.name, chips: chips }, lines: lines };
  };

  /** 技の説明 */
  DexScene.prototype._buildSkillDetail = function () {
    var selected = this.list.getSelected();
    if (!selected) return null;

    var data = this.game.data;
    var skill = data.getSkill(selected.value);
    if (!skill) return null;

    var t = this.theme;
    var texts = this.texts;
    var lines = [];

    // まだ覚えるモンスターを仲間にしていなければ伏せる
    if (!this._isSkillKnown(selected.value)) {
      lines.push({ text: texts.unknownSkill || "", dim: true });
      return { head: this._unknownHead(false), lines: lines };
    }

    // 見出し：属性の絵・名前・属性／種類／当たる相手の札
    var chips = [];
    var element = (data.elements || {})[skill.element];
    // 混合属性（烈火崩地斬の火と地）は、属性ごとに別の札にする（2026-11-12 作者「わけてほしい」）
    var skillElements = data.getSkillElements(skill);
    for (var se = 0; se < skillElements.length; se++) {
      chips.push({ label: skillElements[se].name, color: skillElements[se].color, icon: skillElements[se].icon });
    }
    var kind = data.getSkillKind(skill);
    if (kind) chips.push({ label: kind.name, color: kind.color });
    var target = (texts.targetNames || {})[skill.target];
    if (target) chips.push({ label: target, color: t.subTextColor });

    // 数字は右にそろえる。ダメージを与えない技（回復・バフ／デバフ・状態異常だけの技）は、威力の行ごと出さない。
    //   判定は戦闘と同じ BattleSystem.dealsDamage
    if (skill.power) {
      lines.push({ text: texts.powerLabel || "", right: String(data.formatSkillPower(skill)) });
    } else if (NS.BattleSystem.dealsDamage(skill)) {
      lines.push({ text: texts.powerLabel || "", right: texts.powerNormal || "-" });
    }
    lines.push({ text: texts.ppLabel || "", right: String(skill.pp || 0) });

    // accuracy を書いていない技は data/battle.js の既定値で当たる
    var fallback = (data.battle || {}).defaultAccuracy;
    var accuracy = (skill.accuracy === undefined) ? ((fallback === undefined) ? 1 : fallback) : skill.accuracy;
    lines.push({ text: texts.accuracyLabel || "", right: Math.round(accuracy * 100) + "%" });
    if (skill.criticalBonus) {
      lines.push({ text: texts.criticalLabel || "", right: "+" + Math.round(skill.criticalBonus * 100) + "%" });
    }
    // 種類の決まり（共鳴は防御を半分だけ引く、など）
    if (kind && kind.note) this._pushWrapped(lines, kind.note, { dim: true });

    // 一時的な強化・弱体（バフ／デバフ）。効果の説明は EffectSystem に任せる
    if (skill.modifier) {
      lines.push(blank());
      lines.push({ text: texts.modifierLabel || "", heading: true,
                   right: (texts.durationLabel || "{n}ターン").replace("{n}", skill.modifier.duration || 1) });
      var mods = skill.modifier.effects || [];
      for (var m = 0; m < mods.length; m++) {
        var line = NS.EffectSystem.describeEffect(mods[m], data);
        if (line) this._pushWrapped(lines, "・" + line);
      }
    }

    // 状態異常をあたえる技。色は data/statuses.js のもの（戦闘中の印と同じ色）
    if (skill.status) {
      var status = data.getStatus ? data.getStatus(skill.status.id) : null;
      if (status) {
        var chance = (skill.status.chance === undefined) ? 1 : skill.status.chance;
        lines.push(blank());
        lines.push({ text: (texts.statusLabel || "") + "  " + status.name, icon: status.icon,
                     color: status.color || t.cursorColor, right: Math.round(chance * 100) + "%" });
        // 通る確率は相手の耐性で下がる。数字だけ見て決められると誤解を招く
        lines.push({ text: texts.statusNote || "", dim: true });
      }
    }

    lines.push(blank());
    this._pushWrapped(lines, skill.description);

    // この技を覚えるモンスター。まだ仲間にしていない相手も「？？？」で並ぶ
    var learners = this._learnersOf(selected.value, false);
    if (learners.length > 0) {
      lines.push(blank());
      lines.push(heading(texts.learnerLabel || ""));
      for (var i = 0; i < learners.length; i++) {
        lines.push(this._monsterRow(learners[i].monster,
          learners[i].bond ? (texts.learnByBond || "絆") : "Lv" + learners[i].level));
      }
    }

    return { head: { icon: element && element.icon, name: skill.name, chips: chips }, lines: lines };
  };

  /**
   * 性格の説明。どのステータスが上がり下がりするかを、×1.0 を中心にした棒で並べる。
   * 倍率1.0（変化なし）の項目も、比べやすいように出す。
   * その下に、いまこの性格の仲間（連れている仲間と預かり所）を並べる。
   */
  DexScene.prototype._buildNatureDetail = function () {
    var selected = this.list.getSelected();
    if (!selected) return null;

    var nature = (this.game.data.natures || {})[selected.value];
    if (!nature) return null;

    var t = this.theme;
    var texts = this.texts;
    var party = (this.game.data.messages || {}).party || {};
    var lines = [];
    var chips = [];

    var stats = [
      { key: "hp", label: "HP" },
      { key: "attack", label: party.attackLabel || "攻撃" },
      { key: "defense", label: party.defenseLabel || "防御" },
      { key: "speed", label: party.speedLabel || "素早さ" }
    ];

    var up = t.hpBarHigh || "#5fd18c", down = t.hpBarLow || "#e8542a";
    for (var i = 0; i < stats.length; i++) {
      var value = (nature[stats[i].key] === undefined) ? 1 : nature[stats[i].key];
      var color = value > 1 ? up : value < 1 ? down : t.subTextColor;
      lines.push({ text: stats[i].label, bar: { value: value, color: color, range: 0.2 },
                   right: "×" + (Math.round(value * 100) % 10 === 0 ? value.toFixed(1) : value.toFixed(2)), rightColor: color });
      if (value > 1) chips.push({ label: fillText(texts.natureUp || "{stat}↑", { stat: stats[i].label }), color: up });
      if (value < 1) chips.push({ label: fillText(texts.natureDown || "{stat}↓", { stat: stats[i].label }), color: down });
    }
    if (chips.length === 0) chips.push({ label: texts.natureFlat || "補正なし", color: t.subTextColor });

    lines.push(blank());
    this._pushWrapped(lines, texts.natureNote, { dim: true });

    // この性格の仲間（連れている仲間・預かり所）
    var members = [];
    var groups = [this.game.party, this.game.storage];
    for (var g = 0; g < groups.length; g++) {
      var list = (groups[g] && groups[g].getMembers) ? groups[g].getMembers() : [];
      for (var k = 0; k < list.length; k++) {
        if (list[k] && list[k].natureId === selected.value) members.push(list[k]);
      }
    }
    lines.push(blank());
    lines.push({ text: texts.natureMembersLabel || "", heading: true, right: members.length ? String(members.length) : "" });
    if (members.length === 0) lines.push({ text: texts.natureMembersNone || "", dim: true });
    for (var n = 0; n < members.length; n++) {
      var species = members[n].getSpecies ? members[n].getSpecies() : null;
      lines.push({ sprite: species ? species.sprite : null, text: members[n].getName(), right: "Lv" + members[n].level });
    }

    return { head: { name: nature.name, chips: chips }, lines: lines };
  };

  /** 加護の説明。効果と出やすさを出す */
  DexScene.prototype._buildBlessingDetail = function () {
    var selected = this.list.getSelected();
    if (!selected) return null;

    var blessing = (this.game.data.blessings || {})[selected.value];
    if (!blessing) return null;

    var texts = this.texts;
    var lines = [];

    // まだ買っていない加護は、名前も効果も出さない。
    // 一覧で伏せておいて説明で見えたら、伏せた意味がない
    if (!this._isBlessingKnown(selected.value, blessing)) {
      this._pushWrapped(lines, texts.blessingLockedNote, { dim: true });
      return { head: this._unknownHead(true), lines: lines };
    }

    var rarity = NS.BlessingSystem.getRarity(this.game.data, blessing);
    var chips = [{ label: (texts.rarityLabel || "") + rarity.label, color: rarity.color || this.theme.subTextColor }];

    this._pushWrapped(lines, blessing.description);
    lines.push(blank());
    lines.push(heading(texts.effectLabel || ""));
    var effects = blessing.effects || [];
    for (var i = 0; i < effects.length; i++) {
      var text = NS.EffectSystem.describeEffect(effects[i], this.game.data);
      if (text) this._pushWrapped(lines, "・" + text);
    }

    lines.push(blank());
    this._pushWrapped(lines, texts.blessingNote, { dim: true });

    return { head: { icon: "iconBlessing", name: blessing.name, chips: chips }, lines: lines };
  };

  /** 長い文章を折り返して行に足す（extra は行に付ける色など） */
  DexScene.prototype._pushWrapped = function (lines, text, extra) {
    var chars = (this.layout.detail || {}).charsPerLine || 15;
    var wrapped = wrapText(text || "", chars);
    for (var i = 0; i < wrapped.length; i++) {
      var line = { text: wrapped[i] };
      for (var key in (extra || {})) line[key] = extra[key];
      lines.push(line);
    }
  };

  DexScene.prototype._renderHint = function () {
    var pos = this.layout.hint || { x: 48, y: 584 };
    var hint;

    // 並べ替えのある表（技・アイテム）は R の案内も出す
    var skills = this._hasSort();
    if (this.getTab() === "monsters") {
      // 落とすものが区画で違う種族を開いているときだけ、決定の案内を足す
      hint = (this._dropPages(this.monsterId).length > 1) ? this.texts.hintBookDrops : this.texts.hintBook;
    }
    else if (this.focus === "detail") hint = this.texts.hintDetail;
    else if (this._canScrollDetail()) hint = skills ? this.texts.hintSkillsScrollable : this.texts.hintScrollable;
    else hint = skills ? this.texts.hintSkills : this.texts.hint;

    this.panel.drawText(hint || "", pos.x, pos.y,
      { font: this.theme.smallFont, color: this.theme.hintColor });
  };

  // --- 共通ヘルパ ---

  /**
   * 定義一覧を分類ごとに区切った行の配列にする。
   * @param {object} definitions id → 定義
   * @param {object} categories 分類の定義
   * @param {string} categoryKey 定義の中で分類idを指すキー名
   * @param {function} makeEntry (id, definition) → 行の内容
   * @param {object} [subgroups] 分類の中をさらに分けるとき（装備を武器・防具・アクセサリーに）
   *   { keyOf: (id, definition) → 小分類id か null, defs: { id: { name, order, color } } }
   *   小分類の見出しは分類の見出しより一段小さく（"武器" のように）出す
   */
  function buildRows(definitions, categories, categoryKey, makeEntry, subgroups) {
    var groups = {};

    for (var id in definitions) {
      if (!Object.prototype.hasOwnProperty.call(definitions, id)) continue;
      var categoryId = definitions[id][categoryKey] || "other";
      if (!groups[categoryId]) groups[categoryId] = [];
      groups[categoryId].push(id);
    }

    var ordered = Object.keys(groups).sort(function (a, b) {
      var oa = categories[a] ? categories[a].order : 999;
      var ob = categories[b] ? categories[b].order : 999;
      return oa - ob;
    });

    var rows = [];
    for (var i = 0; i < ordered.length; i++) {
      var category = categories[ordered[i]] || { name: ordered[i] };
      rows.push({ type: "header", label: "- " + category.name + " -", color: category.color });

      var ids = groups[ordered[i]];
      if (subgroups) ids = sortBySubgroup(ids, definitions, subgroups);

      var currentSub = null;
      for (var j = 0; j < ids.length; j++) {
        var sub = subgroups ? subgroups.keyOf(ids[j], definitions[ids[j]]) : null;
        if (sub && sub !== currentSub) {
          var def = subgroups.defs[sub] || { name: sub };
          rows.push({ type: "header", label: "  " + def.name, color: def.color || category.color });
          currentSub = sub;
        }
        var entry = makeEntry(ids[j], definitions[ids[j]]);
        entry.type = "entry";
        rows.push(entry);
      }
    }
    return rows;
  }

  /** 小分類の order 順に並べ替える（小分類の無いものは元の順のまま先頭） */
  function sortBySubgroup(ids, definitions, subgroups) {
    var indexed = ids.map(function (id, index) {
      var sub = subgroups.keyOf(id, definitions[id]);
      var order = (sub && subgroups.defs[sub]) ? subgroups.defs[sub].order : -1;
      return { id: id, order: order, index: index };
    });
    indexed.sort(function (a, b) {
      return (a.order - b.order) || (a.index - b.index);
    });
    return indexed.map(function (x) { return x.id; });
  }

  /**
   * 分類で区切らず、そのまま並べた行を作る。
   * 性格・加護のように分類を持たないものに使う。
   */
  function flatRows(definitions, makeEntry) {
    var rows = [];

    for (var id in definitions) {
      if (!Object.prototype.hasOwnProperty.call(definitions, id)) continue;
      var entry = makeEntry(id, definitions[id]);
      entry.type = "entry";
      rows.push(entry);
    }
    return rows;
  }

  /**
   * その種族がその技を覚えるレベル。覚えないなら null。
   * 同じ技が複数の行に書かれていても、いちばん早いレベルを返す。
   */
  function learnLevel(species, skillId) {
    var learnset = (species && species.learnset) || [];
    var found = null;

    for (var i = 0; i < learnset.length; i++) {
      if (learnset[i].skill !== skillId) continue;
      if (found === null || learnset[i].level < found) found = learnset[i].level;
    }
    return found;
  }

  /** 文字数で折り返す（等幅フォント前提の簡易処理） */
  // 折り返しは共通（js/namespace.js の MyGame.wrapText。行の頭に句読点を置かない）
  function wrapText(text, charsPerLine) {
    return NS.wrapText(text, charsPerLine);
  }

  NS.DexScene = DexScene;
})(window.MyGame);
