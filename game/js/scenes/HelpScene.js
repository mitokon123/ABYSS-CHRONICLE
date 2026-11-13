/**
 * HelpScene.js
 * 「遊び方」画面。よくある質問を分類ごとに並べ、選ぶと答えを出す。
 *
 * 中身（質問と答え）は data/help.js、配置は data/ui.js の help、
 * 画面まわりの文言は data/messages.js の help が持つ。
 * この画面は**読むだけ**で、ゲームの状態を一切変えない。
 *
 * ▼ 図鑑や持ち物と同じ「左に一覧・右に中身」の形にしてある。
 *   困って開く画面なので、他の画面と操作を変えないほうがよい。
 *
 * ▼ 答えが長いときは右側を送れる（↑↓ではなく Q/E とホイール・右のバー）。
 *   ↑↓ は一覧の移動に使うので、そこを奪わない。
 *
 * ▼ 右は共通の部品 NS.DetailPane（v1.4.0・2026-11-12。ほかの画面とそろえた）
 *   上の欄 … 「？」の絵・分類の名前（分類の色）・その分類の何問目か
 *   その下 … 質問（見出しの色）→ 答え（段落のあいだは1行あける）
 */
(function (NS) {
  "use strict";

  function HelpScene(game, returnScene) {
    this.game = game;
    this.returnScene = returnScene;

    var ui = game.data.ui || {};
    this.theme = ui.theme || {};
    this.layout = ui.help || {};
    this.texts = (game.data.messages || {}).help || {};
    this.help = game.data.help || {};

    this.panel = new NS.Panel(game.ctx, this.theme);
    this.list = new NS.ScrollList(this.panel, this.layout.list);
    this.sprites = new NS.SpriteRenderer(game.ctx, game.assets);
    this.pane = new NS.DetailPane(this.panel, this.sprites, this.layout.detail || { x: 0, y: 0, w: 0, h: 0 });
    this.backButton = new NS.BackButton(this.panel, game.data);


    this._buildList();
  }

  HelpScene.prototype.enter = function () {};

  /**
   * その質問をいま出してよいか。
   *
   * ★ まだ出会っていない機能の質問は隠す。
   *   工房も加護も見ていない人に「加護の選択とは?」と並べると、
   *   答えではなく疑問が増えるため。
   *   条件の書き方は data/dungeons.js の unlockedBy と同じ。
   */
  HelpScene.prototype._isUnlocked = function (entry) {
    // 中身を別の場所から作る質問は、中身が空なら出さない
    // （素材を1つも使っていないのに「音楽について」が並ぶのを防ぐ）
    if (entry.answerFrom && this._generatedAnswer(entry.answerFrom).length === 0) {
      return false;
    }

    if (!entry.unlockedBy) return true;
    if (!NS.DungeonCatalog) return true;

    return NS.DungeonCatalog.isConditionMet(
      entry.unlockedBy, this.game.clearedDungeons, this.game.data);
  };

  /**
   * データから組み立てる答え。
   *
   * ★ 手で書くと二重管理になるものだけをここで作る。
   *   音の出どころは data/audio.js の credits に書いてあるので、
   *   遊び方のためにもう一度書き写さない（片方だけ直す事故を防ぐ）。
   */
  HelpScene.prototype._generatedAnswer = function (kind) {
    if (kind !== "audioCredits") return [];

    var credits = (this.game.data.audio || {}).credits || [];
    var lines = [];

    // 1件を「名前」「何に使っているか」「URL」の3行に分ける。
    // 1行につなげると、URLが途中で折り返されて読みにくかったため
    for (var i = 0; i < credits.length; i++) {
      var c = credits[i];
      var parts = [];
      parts.push((c.label ? c.label + "：" : "") + (c.name || ""));
      if (c.note) parts.push(c.note);
      if (c.url) parts.push(c.url);
      lines.push(parts.join("\n"));
    }
    return lines;
  };

  /** 分類ごとに見出しを挟んで、質問を並べる */
  HelpScene.prototype._buildList = function () {
    var categories = this.help.categories || {};
    var entries = this.help.entries || {};

    // 分類を order 順に
    var order = [];
    for (var cid in categories) order.push(categories[cid]);
    order.sort(function (a, b) { return (a.order || 999) - (b.order || 999); });

    var rows = [];
    for (var c = 0; c < order.length; c++) {
      var category = order[c];
      var mine = [];
      for (var eid in entries) {
        if (entries[eid].category !== category.id) continue;
        if (!this._isUnlocked(entries[eid])) continue;
        mine.push(entries[eid]);
      }
      // 中身が1つも無い分類は、見出しごと出さない
      if (mine.length === 0) continue;

      mine.sort(function (a, b) { return (a.order || 999) - (b.order || 999); });
      rows.push({ type: "header", label: "- " + category.name + " -", color: category.color });

      for (var m = 0; m < mine.length; m++) {
        rows.push({ type: "entry", label: mine[m].question, value: mine[m].id });
      }
    }
    this.list.setRows(rows);
  };

  // --- 更新 ---

  HelpScene.prototype.update = function () {
    var input = this.game.input;

    if (this.backButton.handleInput(input) || input.isPressed("cancel")) {
      this.game.scenes.change(this.returnScene);
      return;
    }

    // 右の答え（バー・ホイール・Q/E）。バーを触っている間はほかの操作を見ない
    this.pane.setContent(this._answerContent(), this._answerKey());
    var paneResult = this.pane.handleInput(input);
    if (paneResult && paneResult.bar) return;
    if (input.isPressed("prevTab")) this.pane.scrollBy(-this.pane.keyRows());
    if (input.isPressed("nextTab")) this.pane.scrollBy(this.pane.keyRows());

    // 質問を変えたら、答えは先頭から読み直す（DetailPane が key の変化で先頭へ戻す）
    this.list.handleInput(input);
  };

  /** 選んでいる質問のid（答えを先頭へ戻す目印） */
  HelpScene.prototype._answerKey = function () {
    var selected = this.list.getSelected();
    return selected ? selected.value : null;
  };

  /** 右の答えの中身（DetailPane の { head, lines }） */
  HelpScene.prototype._answerContent = function () {
    var selected = this.list.getSelected();
    if (!selected) return null;
    var entry = (this.help.entries || {})[selected.value];
    if (!entry) return null;
    var t = this.theme;
    var category = (this.help.categories || {})[entry.category] || {};

    // その分類の何問目か（一覧に出ているものだけで数える）
    var rows = this.list.rows || [];
    var n = 0, total = 0;
    for (var r = 0; r < rows.length; r++) {
      if (rows[r].type !== "entry") continue;
      var other = (this.help.entries || {})[rows[r].value];
      if (!other || other.category !== entry.category) continue;
      total++;
      if (rows[r].value === entry.id) n = total;
    }

    var head = { mark: "？", name: category.name || "", nameColor: category.color || t.textColor,
                 sub: fill(this.texts.position || "{n} / {total} 問目", { n: n, total: total }) };
    var lines = [];
    var perLine = (this.layout.answer && this.layout.answer.charsPerLine) || 26;
    var question = wrapText(entry.question, perLine - 2);
    for (var q = 0; q < question.length; q++) lines.push({ heading: true, text: question[q], font: t.font });
    lines.push({});
    var answer = this._answerLines();
    for (var i = 0; i < answer.length; i++) lines.push({ text: answer[i] });
    return { head: head, lines: lines };
  };

  /** いま選んでいる質問の答えを、折り返した行の配列にする */
  HelpScene.prototype._answerLines = function () {
    var selected = this.list.getSelected();
    if (!selected) return [];

    var entry = (this.help.entries || {})[selected.value];
    if (!entry) return [];

    var perLine = (this.layout.answer && this.layout.answer.charsPerLine) || 20;
    var lines = [];
    var paragraphs = entry.answerFrom
      ? this._generatedAnswer(entry.answerFrom)
      : (entry.answer || []);

    for (var p = 0; p < paragraphs.length; p++) {
      // 段落のあいだは1行空ける。続きものに見えないように
      if (p > 0) lines.push("");
      // 段落の中の「\n」はそこで必ず改行する（音の出どころのURLなど）
      var rows = String(paragraphs[p]).split("\n");
      for (var r = 0; r < rows.length; r++) {
        var wrapped = wrapText(rows[r], perLine);
        for (var i = 0; i < wrapped.length; i++) lines.push(wrapped[i]);
      }
    }
    return lines;
  };

  // --- 描画 ---

  HelpScene.prototype.render = function (ctx) {
    var L = this.layout;

    ctx.fillStyle = L.background || "#0a0f1c";
    ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

    var title = L.title || {};
    var subtitle = L.subtitle || {};
    this.panel.drawText(this.texts.title || "", title.x, title.y,
      { font: title.font, color: title.color });
    this.panel.drawText(this.texts.subtitle || "", subtitle.x, subtitle.y,
      { font: subtitle.font, color: subtitle.color });

    this.list.render(this.game.clock);
    this._renderAnswer();
    this._renderHint();
    this.backButton.render();
  };

  /** 右：答え（DetailPane） */
  HelpScene.prototype._renderAnswer = function () {
    if (!this.layout.detail) return;
    this.pane.setContent(this._answerContent(), this._answerKey());
    this.pane.render("");
  };

  HelpScene.prototype._renderHint = function () {
    var hint = this.layout.hint;
    if (!hint) return;

    // 答えが入りきらないときだけ「Q/E・ホイール: 答えを送る」（v1.4.0）
    this.panel.drawText(fill(this.texts.hint || "", { extra: this.pane.canScroll() ? (this.texts.hintScroll || "") : "" }), hint.x, hint.y,
      { font: this.theme.smallFont, color: this.theme.hintColor });
  };

  /**
   * 行の先頭に来てはいけない文字（句読点・閉じ括弧）。
   * この画面は読ませるための画面なので、
   * 「。」で始まる行が出ないようにしている。
   */
  // 折り返しは共通（js/namespace.js の MyGame.wrapText）。
  // 切れ目の次が句読点なら前の行へ送る作りは、もとはこの画面だけにあった（2026-11-10 に全画面へ広げた）
  function wrapText(text, charsPerLine) {
    return NS.wrapText(text, charsPerLine);
  }

  /** テンプレートの {key} を置き換える */
  function fill(template, values) {
    if (!template) return "";
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return (values[key] !== undefined) ? values[key] : match;
    });
  }

  NS.HelpScene = HelpScene;
})(window.MyGame);
