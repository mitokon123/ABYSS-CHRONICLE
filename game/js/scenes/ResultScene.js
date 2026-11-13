/**
 * ResultScene.js
 * 挑戦（ラン）が終わったときの結果画面。
 *
 * 「どこまで潜って、何を持ち帰れたか」を1枚で見せる。
 * 拠点へ戻る前に必ず通るので、拾ったものが分からないまま終わることがなくなる。
 *
 * 結果の中身は DungeonScene が組み立てて渡す。この画面は表示だけを行い、
 * 持ち物やゴールドには一切触れない（すでに Game 側で反映済み）。
 *
 * ▼ 右の欄（v1.4.0・2026-11-12）
 *   仲間（絵・名前・「Lv20 → Lv23」。上がった仲間は緑）／この挑戦で仲間になった相手／受けていた加護（出やすさの色）。
 *   挑戦を始めたときのレベルは RunSession.startLevels（Game.beginRun で覚える）。共通の部品 NS.DetailPane
 *
 * 配置は data/ui.js の result、文言は data/messages.js の result。
 */
(function (NS) {
  "use strict";

  /**
   * @param {MyGame.Game} game
   * @param {object} summary
   *   outcome  : "escaped"（無事帰還）/ "cleared"（主を倒した）/ "passed"（主のいない区画を出口から抜けた）/ "defeated"（全滅）
   *   dungeon  : 挑んだダンジョンの定義
   *   floor    : 到達した階
   *   gold     : その挑戦で得たゴールド
   *   items    : [{ itemId, count }] 手に入れたもの
   *   lostItems: [{ itemId, count }] 失ったもの（全滅時のみ）
   *   saved    : この時点で自動セーブしたか（はじめてクリアしたときだけ true）
 *   monsters : この挑戦で仲間になった個体（MonsterInstance）
 *   blessings: この挑戦で受けていた加護（data/blessings.js の定義）
 *   startLevels: [{ monster, level }] 挑戦を始めたときの仲間とレベル
   */
  function ResultScene(game, summary) {
    this.game = game;
    this.summary = summary || {};

    var ui = game.data.ui || {};
    this.theme = ui.theme || {};
    this.layout = ui.result || {};
    this.texts = (game.data.messages || {}).result || {};

    this.panel = new NS.Panel(game.ctx, this.theme);
    this.renderer = new NS.Renderer(game.ctx);
    // 持ち帰ったアイテムの絵を名前の左に出す
    this.sprites = new NS.SpriteRenderer(game.ctx, game.assets);
    this.list = new NS.ScrollList(this.panel, this.layout.list, { sprites: this.sprites });
    // 右の欄：仲間・仲間になった相手・受けていた加護（v1.4.0）
    this.pane = this.layout.detail ? new NS.DetailPane(this.panel, this.sprites, this.layout.detail) : null;
    // マウスだけでも先へ進めるように
    this.homeButton = new NS.TextButton(this.panel, this.layout.homeButton,
      this.texts.toHome || "拠点へ");

    this.list.setRows(this._buildRows());
    if (this.pane) this.pane.setContent(this._sideContent(), "result");
  }

  ResultScene.prototype.enter = function () {};

  // --- 中身の組み立て ---

  /**
   * 手に入れたもの・失ったものを1つの一覧にする。
   * 分類ごとの見出しは使わず、「手に入れた」「失った」で分ける。
   */
  ResultScene.prototype._buildRows = function () {
    var rows = [];
    var gained = this.summary.items || [];
    var lost = this.summary.lostItems || [];

    rows.push(this._header(this.texts.gainedLabel, this.theme.cursorColor));
    if (gained.length === 0) {
      rows.push(this._plain(this.texts.nothing, this.theme.hintColor));
    } else {
      this._pushItems(rows, gained, this.theme.textColor);
    }

    // 全滅したときだけ、落としてきたものを出す
    if (lost.length > 0) {
      rows.push(this._plain("", this.theme.hintColor));
      rows.push(this._header(this.texts.lostLabel, this.theme.hpBarLow || "#e8542a"));
      this._pushItems(rows, lost, this.theme.hintColor);
    }

    return rows;
  };

  ResultScene.prototype._pushItems = function (rows, entries, color) {
    for (var i = 0; i < entries.length; i++) {
      var item = this.game.data.getItem(entries[i].itemId);
      rows.push({
        type: "entry",
        label: item ? item.name : entries[i].itemId,
        icon: item ? item.icon : null,
        right: "x" + entries[i].count,
        color: color,
        value: entries[i].itemId
      });
    }
  };

  /** 右の欄の中身（DetailPane の { lines }） */
  ResultScene.prototype._sideContent = function () {
    var t = this.theme;
    var T = this.texts;
    var data = this.game.data;
    var lines = [];
    var up = t.hpBarHigh || "#5fd18c";

    // 仲間：始めたときのレベルと比べる（途中で仲間になった相手は今のレベルだけ）
    var starts = this.summary.startLevels || [];
    var members = (this.game.party && this.game.party.getMembers) ? this.game.party.getMembers() : [];
    lines.push({ heading: true, text: T.partyLabel || "仲間" });
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      var species = m.getSpecies ? m.getSpecies() : null;
      var before = null;
      for (var s = 0; s < starts.length; s++) if (starts[s].monster === m) before = starts[s].level;
      var grew = before !== null && m.level > before;
      lines.push({ sprite: species ? species.sprite : null, text: m.getName(),
                   right: grew ? fill(T.levelUp || "Lv{before} → Lv{after}", { before: before, after: m.level }) : "Lv" + m.level,
                   rightColor: grew ? up : t.subTextColor });
    }

    var joined = this.summary.monsters || [];
    if (joined.length) {
      lines.push({});
      lines.push({ heading: true, text: T.joinedLabel || "仲間になった", right: String(joined.length), rightColor: t.hintColor });
      for (var j = 0; j < joined.length; j++) {
        var sp = joined[j].getSpecies ? joined[j].getSpecies() : null;
        lines.push({ sprite: sp ? sp.sprite : null, text: joined[j].getName(), right: "Lv" + joined[j].level, rightColor: up });
      }
    }

    var blessings = this.summary.blessings || [];
    if (blessings.length) {
      lines.push({});
      lines.push({ heading: true, text: T.blessingsLabel || "受けていた加護", right: String(blessings.length), rightColor: t.hintColor });
      for (var b = 0; b < blessings.length; b++) {
        var rarity = NS.BlessingSystem.getRarity(data, blessings[b]);
        lines.push({ icon: "iconBlessing", text: blessings[b].name, color: rarity.color || t.textColor,
                     right: rarity.label || "", rightColor: rarity.color || t.hintColor });
      }
    }
    return { lines: lines };
  };

  ResultScene.prototype._header = function (label, color) {
    return { type: "header", label: "- " + (label || "") + " -", color: color };
  };

  /** 選べない1行（「何も無かった」など） */
  ResultScene.prototype._plain = function (label, color) {
    return { type: "header", label: label || "", color: color };
  };

  // --- 更新 ---

  ResultScene.prototype.update = function () {
    var input = this.game.input;

    // 右の欄（バー・ホイール）。バーを触っている間はほかの操作を見ない
    if (this.pane) {
      var paneResult = this.pane.handleInput(input);
      if (paneResult && paneResult.bar) return;
    }

    // 一覧は眺めるだけ。上下とホイールで送れる
    this.list.handleInput(input);

    // 「拠点へ」ボタン・決定キー・右クリックのどれでも先へ進む。
    // 一覧の行を押しても進まないのは、読んでいる途中で誤って閉じないようにするため。
    if (this.homeButton.handleInput(input) ||
        input.isPressed("confirm") ||
        input.isPressed("cancel")) {
      // 拠点に着いたところで流れる物語（主を倒した後など）があれば、先に流す
      this.game.playStory("homeReturn", new NS.HomeScene(this.game));
    }
  };

  // --- 描画 ---

  ResultScene.prototype.render = function (ctx) {
    var w = this.game.canvas.width;
    var h = this.game.canvas.height;

    this.renderer.clear(this.layout.background || "#0a0f1c", w, h);

    this._renderHeading();
    this._renderSummary();
    this.list.render(this.game.clock);
    if (this.pane) this.pane.render("");
    this.homeButton.render();
    this._renderHint();
  };

  /** 見出し。結果によって色と文が変わる */
  ResultScene.prototype._renderHeading = function () {
    var L = this.layout;
    var outcome = this.summary.outcome || "escaped";
    var style = (L.outcomes || {})[outcome] || {};
    var title = L.title || {};
    var subtitle = L.subtitle || {};

    this.panel.drawText(this.texts[outcome] || "", title.x, title.y,
      { align: title.align, font: title.font, color: style.color || title.color });

    this.panel.drawText(this._placeText(), subtitle.x, subtitle.y,
      { align: subtitle.align, font: subtitle.font, color: subtitle.color });

    // はじめてクリアしたときは自動でセーブされている。
    // 手動セーブのゲームなので、黙って書き換えると気づけない
    if (this.summary.saved && this.texts.savedNote) {
      var note = L.savedNote || {};
      this.panel.drawText(this.texts.savedNote,
        note.x !== undefined ? note.x : subtitle.x,
        note.y !== undefined ? note.y : subtitle.y + 22,
        { align: note.align || subtitle.align, font: note.font || subtitle.font,
          color: note.color || this.theme.cursorColor });
    }
  };

  /** 「苔むす坑道 B3F まで」 */
  ResultScene.prototype._placeText = function () {
    var dungeon = this.summary.dungeon;
    return (this.texts.reached || "")
      .replace("{name}", (dungeon && dungeon.name) || "")
      .replace("{floor}", this.summary.floor || 1);
  };

  /** 得たゴールド */
  ResultScene.prototype._renderSummary = function () {
    var pos = this.layout.gold;
    if (!pos) return;

    this.panel.drawText(
      (this.texts.gold || "{amount}G").replace("{amount}", this.summary.gold || 0),
      pos.x, pos.y,
      { align: pos.align || "left", font: pos.font, color: pos.color || this.theme.cursorColor });
  };

  /** テンプレートの {key} を置き換える */
  function fill(template, values) {
    if (!template) return "";
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return (values[key] !== undefined) ? values[key] : match;
    });
  }

  ResultScene.prototype._renderHint = function () {
    var pos = this.layout.hint || { x: 48, y: 570 };
    this.panel.drawText(this.texts.hint || "", pos.x, pos.y,
      { font: this.theme.smallFont, color: this.theme.hintColor });
  };

  NS.ResultScene = ResultScene;
})(window.MyGame);
