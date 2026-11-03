/**
 * devpage.js  開発用ページの共通部品（v1.0.2。ゲーム本体では読まない）
 *
 * data-check.html（データの点検）と sound-list.html（効果音の一覧）が使う。
 *   DevPage.loadGame(done)     … app.html の読み込み一覧どおりにゲームのファイルを読む（js/main.js は除く）
 *   DevPage.sources(files)     … 読んだファイルの中身（文字）を集める。「どこで使っているか」を探すため
 *   DevPage.namespaces(raw)    … id の置き場所（技・道具・絵・動き・効果音 …）ごとの id の一覧
 *   DevPage.references(raw)    … データの中で、ほかの id を指している所をぜんぶ拾う（RULES のとおり）
 *   DevPage.findInText(texts, id) … id を "id" / 'id' の形で書いている所（ファイルと行）
 *
 * ★ どの項目がどこを指すかは RULES に書く。データに新しい指し先が増えたら、ここに1行足す。
 *   "*" は名前1つ、"**" は途中いくつでも、"[]" は並びの中身。
 */
(function () {
  "use strict";

  // id の置き場所。label は画面に出す名前
  var SPACES = {
    monsters:      { label: "モンスター（data/monsters.js）", get: function (r) { return r.monsters; } },
    items:         { label: "道具（data/items.js）",          get: function (r) { return r.items; } },
    skills:        { label: "技（data/skills.js）",           get: function (r) { return r.skills; } },
    abilities:     { label: "特性（data/abilities.js）",      get: function (r) { return r.abilities; } },
    statuses:      { label: "状態異常（data/statuses.js）",   get: function (r) { return r.statuses; } },
    elements:      { label: "属性（data/elements.js）",       get: function (r) { return r.elements; } },
    sprites:       { label: "絵（data/sprites_〇〇.js）",      get: function (r) { return r.sprites; } },
    motions:       { label: "動き（data/motions.js）",        get: function (r) { return r.motions; } },
    se:            { label: "効果音（data/audio.js の se）",  get: function (r) { return r.audio && r.audio.se; } },
    bgm:           { label: "BGM（data/audio.js の bgm）",    get: function (r) { return r.audio && r.audio.bgm; } },
    shapes:        { label: "演出の型（data/effects.js）",     get: function (r) { return r.effects && r.effects.shapes; } },
    dungeons:      { label: "ダンジョン（data/dungeons.js）", get: function (r) { return r.dungeons; } },
    bosses:        { label: "主（data/bosses.js）",           get: function (r) { return r.bosses; } },
    regions:       { label: "穴（data/regions.js）",          get: function (r) { return r.regions; } },
    themes:        { label: "見た目の組（data/dungeonThemes.js）", get: function (r) { return r.dungeonThemes; } },
    people:        { label: "人物（charaLooks）",             get: function (r) { return r.charaLooks; } },
    monsterFamily: { label: "モンスターの分類（categories.js）", get: function (r) { return r.categories && r.categories.monster; } },
    itemCategory:  { label: "道具の分類（categories.js）",    get: function (r) { return r.categories && r.categories.item; } },
    abilityCategory: { label: "特性の分類（categories.js）",  get: function (r) { return r.categories && r.categories.ability; } },
    equipSlot:     { label: "装備の枠（categories.js）",      get: function (r) { return r.categories && r.categories.equipSlot; } },
    skillKind:     { label: "技の種類（categories.js）",      get: function (r) { return r.categories && r.categories.skillKind; } },
    // 場面の名前（attack / reap など）。どれかの種族の motions に書いてあればよい
    motionKinds:   { label: "動きの場面（monsters.js の motions）", get: function (r) {
      var out = {};
      Object.keys(r.monsters || {}).forEach(function (id) {
        Object.keys(r.monsters[id].motions || {}).forEach(function (k) { out[k] = true; });
      });
      return out;
    } }
  };

  /**
   * どの項目が、どの置き場所の id を指すか。
   *   [ 場所, 置き場所, 書き足し ]
   *   書き足し：keys … 値ではなく、入れ物の「名前（キー）」を確かめる
   *             allow … 置き場所に無くてもよい値（"wait" など、決まった言葉）
   */
  var RULES = [
    // モンスター
    ["monsters.*.family", "monsterFamily"],
    ["monsters.*.resistances", "elements", { keys: true }],
    ["monsters.*.statusResist", "statuses", { keys: true }],
    ["monsters.*.immunities[]", "elements"],
    ["monsters.*.abilities[]", "abilities"],
    ["monsters.*.sprite[]", "sprites"],
    ["monsters.*.poses.*", "sprites"],
    ["monsters.*.motions.*", "motions"],
    ["monsters.*.attackEffect", "shapes"],
    // 技
    ["skills.*.effect", "shapes"],
    ["skills.*.casterEffect", "shapes"],
    ["skills.*.kind", "skillKind"],
    ["skills.*.hitSe", "se"],
    // 技の motion は動きの id ではなく場面の名前（種族の motions のキー。死神の鎌の "reap"）
    ["skills.*.motion", "motionKinds"],
    ["effects.shapes.*.hitSe", "se"],
    // 道具・特性
    ["items.*.category", "itemCategory"],
    ["items.*.from", "dungeons"],
    ["items.*.equip.slot", "equipSlot"],
    ["abilities.*.category", "abilityCategory"],
    // ダンジョン・主・穴
    ["dungeons.*.region", "regions"],
    ["dungeons.*.theme", "themes"],
    ["dungeons.*.boss", "bosses"],
    ["dungeons.**.enemy", "monsters"],
    ["dungeons.**.skills[]", "skills"],
    ["**.actionPattern[]", "skills", { allow: ["wait"] }],
    ["bosses.*.scoutableWhen", "dungeons"],
    ["regions.*.theme", "themes"],
    ["regions.*.battleBgm", "bgm"],
    // 店・物語・宝箱など
    ["shop.shops[].keeper", "sprites"],
    ["shop.shops[].keeperMotion", "motions"],
    ["**.caught", "monsters"],
    ["**.cleared", "dungeons"],
    ["story.**.monster", "monsters"],
    ["story.**.person", "people"],
    ["features.*.usedSprite", "sprites"],
    ["audio.ui.confirm", "se"],
    ["audio.ui.cancel", "se"],
    ["audio.ui.cursor", "se"],
    ["audio.ui.error", "se"],
    ["battle.normalAttackSkill", "skills"],
    ["battle.bossImmuneToStatus[]", "statuses"],
    // どこに書いても同じものを指す名前
    ["**.item", "items"],
    ["**.species", "monsters"],
    ["**.skill", "skills"],
    ["**.sprite", "sprites"],
    ["**.icon", "sprites"],
    ["**.motion", "motions"],
    ["**.idleMotion", "motions"],
    ["**.walkMotion", "motions"],
    ["**.se", "se"],
    ["**.bgm", "bgm", { allow: ["none"] }],
    ["**.element", "elements", { allow: ["all"] }],
    ["**.status", "statuses", { allow: ["all"] }],
    ["**.statuses[]", "statuses"],
    ["**.immuneToStatus[]", "statuses"],
    ["**.unlockedBy", "dungeons"],
    ["**.unlockedBy[]", "dungeons"],
    ["**.unlockedBy.dungeons[]", "dungeons"],
    ["**.unlockedBy.region", "regions"]
  ];

  // 調べない置き場所（文章・見た目の数字・絵や動きそのもの）
  var SKIP_TOP = { messages: 1, help: 1, patchnotes: 1, keys: 1, config: 1, sprites: 1, motions: 1, motionsTuned: 1, ui: 1, tutorial: 1 };

  function patternToRegExp(p) {
    var s = p.replace(/[.+?^${}()|\\]/g, "\\$&")
             .replace(/\[\]/g, "\u0001")
             .replace(/\*\*/g, "\u0002")
             .replace(/\*/g, "[^.\\[]+")
             .replace(/\u0002/g, ".*")
             .replace(/\u0001/g, "\\[\\]");
    return new RegExp("^" + s + "$");
  }
  var COMPILED = RULES.map(function (r) { return { re: patternToRegExp(r[0]), space: r[1], opt: r[2] || {} }; });

  function namespaces(raw) {
    var out = {};
    Object.keys(SPACES).forEach(function (k) {
      var group = SPACES[k].get(raw) || {};
      out[k] = {};
      Object.keys(group).forEach(function (id) { out[k][id] = true; });
    });
    return out;
  }

  /**
   * データの中で id を指している所をぜんぶ拾う。
   * 1つの値に当てはまる決まりが複数あっても、最初に当たったもの1つだけを使う（上の行ほど優先）。
   * @returns [{ path（見せる場所。並びは [番号]）, space, value, ok, key（キーを確かめたもの） }]
   */
  function references(raw) {
    var spaces = namespaces(raw);
    var refs = [];

    function rule(matchPath, wantKeys) {
      for (var i = 0; i < COMPILED.length; i++) {
        var c = COMPILED[i];
        if (!!c.opt.keys !== wantKeys) continue;
        if (c.re.test(matchPath)) return c;
      }
      return null;
    }
    function add(c, show, value, isKey) {
      var ok = !!spaces[c.space][value] || (c.opt.allow || []).indexOf(value) >= 0;
      refs.push({ path: show, space: c.space, value: value, ok: ok, key: isKey });
    }
    function walk(v, match, show, depth) {
      if (depth > 12 || v === null || v === undefined) return;
      if (typeof v === "string") {
        var c = rule(match, false);
        if (c) add(c, show, v, false);
        return;
      }
      if (Array.isArray(v)) {
        for (var i = 0; i < v.length; i++) walk(v[i], match + "[]", show + "[" + i + "]", depth + 1);
        return;
      }
      if (typeof v === "object") {
        var kc = rule(match, true);
        Object.keys(v).forEach(function (k) {
          if (kc) add(kc, show + "." + k, k, true);
          walk(v[k], match + "." + k, show + "." + k, depth + 1);
        });
      }
    }
    Object.keys(raw).forEach(function (top) {
      if (!SKIP_TOP[top]) walk(raw[top], top, top, 0);
    });
    return refs;
  }

  // --- 読み込み ---

  function loadGame(done) {
    fetch("app.html?n=" + Date.now()).then(function (res) { return res.text(); }).then(function (html) {
      var files = [];
      var re = /"((?:js|data)\/[^"]+\.js)"/g, m;
      while ((m = re.exec(html))) {
        if (m[1] !== "js/main.js" && files.indexOf(m[1]) < 0) files.push(m[1]);
      }
      (function next(i) {
        if (i >= files.length) { done(files); return; }
        var s = document.createElement("script");
        s.src = files[i] + "?t=" + Date.now();
        s.onload = s.onerror = function () { next(i + 1); };
        document.head.appendChild(s);
      })(0);
    });
  }

  /** ファイルの中身を集める。{ "data/skills.js": "…" } */
  function sources(files) {
    var out = {};
    return Promise.all(files.map(function (f) {
      return fetch(f + "?n=" + Date.now()).then(function (r) { return r.ok ? r.text() : ""; })
        .then(function (t) { out[f] = stripTuned(t); }, function () { out[f] = ""; });
    })).then(function () { return out; });
  }

  // 動きの調整ページが書くところ（data/motions.js の末尾）は「使っている所」に数えない
  function stripTuned(text) {
    var a = text.indexOf("// ▼▼▼ 動きの調整ページが書くところ");
    var b = text.indexOf("// ▲▲▲ 動きの調整ページが書くところ（ここまで）");
    return (a >= 0 && b > a) ? text.slice(0, a) + text.slice(b) : text;
  }

  /**
   * "id" / 'id' と書いてある所。
   * @param {Object} texts sources() の結果
   * @param {Function} [filter] ファイル名で絞る
   * @returns [{ file, line }]
   */
  function findInText(texts, id, filter) {
    var hits = [];
    var re = new RegExp("[\"']" + id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\"']");
    Object.keys(texts).forEach(function (f) {
      if (filter && !filter(f)) return;
      var t = texts[f];
      if (!re.test(t)) return;
      var lines = t.split("\n");
      for (var i = 0; i < lines.length; i++) {
        if (re.test(lines[i])) hits.push({ file: f, line: i + 1 });
      }
    });
    return hits;
  }

  /** 開発用サーバーで開いているか（保存やファイルの一覧が使えるか） */
  function ping() {
    return fetch("/api/ping").then(function (r) { return r.json(); })
      .then(function (d) { return !!(d && d.ok); }, function () { return false; });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c];
    });
  }

  window.DevPage = {
    SPACES: SPACES,
    RULES: RULES,
    loadGame: loadGame,
    sources: sources,
    namespaces: namespaces,
    references: references,
    findInText: findInText,
    ping: ping,
    esc: esc
  };
})();
