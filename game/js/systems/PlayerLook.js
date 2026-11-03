/**
 * PlayerLook.js
 * 主人公の服の色ちがいの絵を、起動時に作る。
 *
 * ▼ 絵を描き足さずに色を増やす
 *   もとの絵（playerWalk1 / playerWalk2）のパレットのうち、
 *   服にあたる3つの記号（地の色・光の面・影）だけを差し替えた写しを作る。
 *   形はまったく同じなので、色を増やしても描く手間は増えない。
 *
 *   playerWalk1 ＋ 赤 → playerWalk1_red
 *
 * ▼ どこで呼ぶか
 *   js/main.js で、AssetLoader.build の**前**に1回だけ呼ぶ。
 *   絵ができあがったあとに足しても、描画物が作られない。
 *
 * ▼ 影も一緒に替える理由
 *   地の色だけ替えると、影と光の面が青いまま残る。
 *   赤い服に青い影がつくので、汚れて見える。3つで1組にしてある。
 *
 * 色そのものは data/player.js の appearance.colors。ここに色は書かない。
 *
 * ▼ 自分で作った色（RC-1）
 *   用意した色のほかに、色コード（"#4a7fe0" の形）もそのまま色として使える。
 *   セーブには色のid の代わりに色コードが入る。
 *   光の面と影は、地の色から自動で作る（lightOf / shadowOf）。
 *   その絵は起動時には作れないので、使うときに作って描画物へ足す（ensureCustom）。
 *   そのため main.js で PlayerLook.assets に AssetLoader を渡しておく。
 */
(function (NS) {
  "use strict";

  var CUSTOM_SUFFIX = "custom";   // 自分で作った色の絵のid の後ろに付ける名前

  var PlayerLook = {

    /** 描画物を作る先（js/main.js が入れる）。自分で作った色の絵を後から足すのに使う */
    assets: null,

    /** 自分で作った色（"#rrggbb"）か */
    isCustom: function (colorId) {
      return typeof colorId === "string" && /^#[0-9a-fA-F]{6}$/.test(colorId);
    },

    /** その色の絵のid（もとのid + "_" + 色のid） */
    variantId: function (spriteId, colorId) {
      return spriteId + "_" + colorId;
    },

    /** data/player.js の appearance */
    appearanceOf: function (gameData) {
      return (gameData.player || {}).appearance || {};
    },

    /** 選べる色の一覧 */
    colorsOf: function (gameData) {
      return this.appearanceOf(gameData).colors || [];
    },

    /** 既定の色のid（書かれていなければ最初の色） */
    defaultColorId: function (gameData) {
      var look = this.appearanceOf(gameData);
      if (look.defaultColor) return look.defaultColor;

      var colors = look.colors || [];
      return colors.length > 0 ? colors[0].id : null;
    },

    /** その色があるか。無ければ既定の色に落とす（自分で作った色はそのまま） */
    resolveColorId: function (gameData, colorId) {
      if (this.isCustom(colorId)) return colorId.toLowerCase();
      var colors = this.colorsOf(gameData);
      for (var i = 0; i < colors.length; i++) {
        if (colors[i].id === colorId) return colorId;
      }
      return this.defaultColorId(gameData);
    },

    /** 色の定義（名前や色コードを出すのに使う）。自分で作った色は名前が色コードになる */
    colorDef: function (gameData, colorId) {
      if (this.isCustom(colorId)) return this.customDef(colorId);
      var colors = this.colorsOf(gameData);
      for (var i = 0; i < colors.length; i++) {
        if (colors[i].id === colorId) return colors[i];
      }
      return null;
    },

    /**
     * その色で歩かせるときの絵のid（コマ数ぶんの配列）。
     * 色が見つからない場合は、もとの絵をそのまま返す（絵が出ないよりはよい）。
     */
    spritesFor: function (gameData, colorId) {
      var look = this.appearanceOf(gameData);
      var base = look.sprite || [];
      var list = isArray(base) ? base : [base];

      var id = this.resolveColorId(gameData, colorId);
      if (!id) return list;

      // 自分で作った色は、その色の絵をここで作る（同じ色ならすでにあるので作り直さない）
      var suffix = id;
      if (this.isCustom(id)) {
        this.ensureCustom(gameData, id);
        suffix = CUSTOM_SUFFIX;
      }

      var out = [];
      for (var i = 0; i < list.length; i++) {
        var variant = this.variantId(list[i], suffix);
        // 作られていない場合に備えて、無ければもとの絵で描く
        out.push(gameData.sprites[variant] ? variant : list[i]);
      }
      return out;
    },

    /**
     * 色ちがいの絵をまとめて作り、gameData.sprites へ登録する。
     * @returns {number} 作った絵の枚数
     */
    buildVariants: function (gameData) {
      var look = this.appearanceOf(gameData);
      var base = look.sprite || [];
      var list = isArray(base) ? base : [base];
      var keys = look.colorKeys || {};
      var colors = look.colors || [];

      var made = 0;
      for (var c = 0; c < colors.length; c++) {
        for (var s = 0; s < list.length; s++) {
          if (this._makeOne(gameData, list[s], colors[c], keys)) made++;
        }
      }
      return made;
    },

    /** 1枚ぶん作る。もとの絵が無ければ何もしない */
    _makeOne: function (gameData, spriteId, color, keys) {
      var source = gameData.sprites[spriteId];
      if (!source || !source.pixels || !source.palette) return false;

      var palette = {};
      for (var key in source.palette) palette[key] = source.palette[key];

      // 服の3色だけ差し替える。輪郭・肌・髪はもとのまま
      if (keys.base   && color.base)   palette[keys.base]   = color.base;
      if (keys.light  && color.light)  palette[keys.light]  = color.light;
      if (keys.shadow && color.shadow) palette[keys.shadow] = color.shadow;

      // 形は共有する（同じ配列を指すだけ。写しは作らない）
      var def = { pixels: source.pixels, palette: palette };
      var id = this.variantId(spriteId, color.suffix || color.id);
      gameData.sprites[id] = def;

      // 起動のあとに作った絵（自分で作った色）は、描画物も作っておく
      if (color.suffix && this.assets) {
        var one = {};
        one[id] = def;
        this.assets.build(one);
      }
      return true;
    },

    // --- 自分で作った色 ---

    /** 色コードから、光の面・影まで入った色の定義を作る */
    customDef: function (hex) {
      var base = hex.toLowerCase();
      return {
        id: base,
        name: base.toUpperCase(),
        base: base,
        // 用意した6色と同じくらいの差（光の面は少し白へ、影はかなり黒へ寄せる）
        light: mix(base, "#ffffff", 0.25),
        shadow: mix(base, "#000000", 0.36),
        suffix: CUSTOM_SUFFIX
      };
    },

    /**
     * 自分で作った色の絵を用意する。絵のid は色によらず「もとのid_custom」で1組だけ持ち、
     * 色が変わったときだけ作り直す（選ぶたびに絵が増えていかないように）。
     */
    ensureCustom: function (gameData, hex) {
      var key = hex.toLowerCase();
      if (this._customBuilt === key) return;

      var look = this.appearanceOf(gameData);
      var base = look.sprite || [];
      var list = isArray(base) ? base : [base];
      var color = this.customDef(key);
      for (var s = 0; s < list.length; s++) this._makeOne(gameData, list[s], color, look.colorKeys || {});
      this._customBuilt = key;
    },

    _customBuilt: null,

    // --- 部品を重ねて作る絵（v1.0.2。js/systems/CharaRig.js） ---

    /**
     * 地図で新しい絵を使うか。data/player.js の appearance.rig が書かれていて、
     * CharaRig.js が読めているときだけ（読めていなければ今までの 32×32 の絵で描く）
     */
    usesRig: function (gameData) {
      return !!(this.appearanceOf(gameData).rig && NS.CharaRig);
    },

    /**
     * 一覧（data/player.js の appearance[listKey]）から id の定義を探す。"#rrggbb" なら自分で作った色。
     * 無い id なら既定（appearance[defaultKey]。書かれていなければ最初）。一覧も無ければ null
     */
    listDef: function (gameData, listKey, defaultKey, id) {
      if (this.isCustom(id)) return this.customDef(id);
      var look = this.appearanceOf(gameData), list = look[listKey] || [], i;
      for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      for (i = 0; i < list.length; i++) if (list[i].id === look[defaultKey]) return list[i];
      return list[0] || null;
    },

    /** ズボンの色（pantsColors）・髪の色（hairColors）・髪型（hairStyles）の定義 */
    pantsDef: function (gameData, id) { return this.listDef(gameData, "pantsColors", "defaultPants", id); },
    hairColorDef: function (gameData, id) { return this.listDef(gameData, "hairColors", "defaultHairColor", id); },
    hairStyleDef: function (gameData, id) { return this.listDef(gameData, "hairStyles", "defaultHair", id); },

    /** 着けている飾りの id のうち、data/player.js の accessories にあるものだけを残す */
    accIdsOf: function (gameData, ids) {
      var list = this.appearanceOf(gameData).accessories || [], out = [];
      for (var i = 0; i < list.length; i++) {
        if (ids && ids.indexOf(list[i].id) >= 0) out.push(list[i].id);
      }
      return out;
    },

    /**
     * 飾りの色の id（data/player.js の accColors）か "#rrggbb" を色コードにする。
     * 選んでいない・無い id なら null（その飾りの「もとの色」になる）
     */
    accColorHex: function (gameData, id) {
      if (this.isCustom(id)) return id.toLowerCase();
      var list = this.appearanceOf(gameData).accColors || [];
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].base;
      return null;
    },

    /**
     * 選んだもの（{ gender, color, hair, hairColor, pants, acc, accColor }。どれも id。無ければ既定）から、
     * CharaRig に渡す見た目を作る。名前と見た目を決める画面は、決める前の値でこれを呼ぶ。
     * accColor は { 飾りの id: 色の id }
     */
    rigOptions: function (gameData, sel) {
      sel = sel || {};
      var cloth = this.colorDef(gameData, this.resolveColorId(gameData, sel.color));
      var hair = this.hairStyleDef(gameData, sel.hair);
      var hairColor = this.hairColorDef(gameData, sel.hairColor);
      var pants = this.pantsDef(gameData, sel.pants);
      var accIds = this.accIdsOf(gameData, sel.acc), acc = {};
      var accList = this.appearanceOf(gameData).accessories || [];
      for (var i = 0; i < accIds.length; i++) {
        // 選んだ色 → その飾りの「もとの色」→ CharaRig の既定の色、の順
        var hex = this.accColorHex(gameData, (sel.accColor || {})[accIds[i]]);
        for (var k = 0; !hex && k < accList.length; k++) if (accList[k].id === accIds[i]) hex = accList[k].color;
        acc[accIds[i]] = hex ? { color: hex } : true;
      }
      return {
        body: sel.gender === "female" ? "female" : "male",
        hair: hair ? hair.id : "short",
        hairColor: tones(hairColor),
        cloth: tones(cloth),
        pants: tones(pants),
        acc: acc
      };
    },

    /** いまの主人公（セーブに入っている選び方）の見た目 */
    rigOptionsOf: function (game) {
      return this.rigOptions(game.data, {
        gender: game.getPlayerGender(), color: game.getPlayerColor(),
        hair: game.playerHair, hairColor: game.playerHairColor,
        pants: game.playerPants, acc: game.playerAcc, accColor: game.playerAccColor
      });
    },

    /**
     * 地図で使う絵（4方向 × 歩き4コマ・立ち止まり3コマ）。canvas で返す。
     * 見た目と大きさが変わったときだけ描き直す（毎フレーム描くと重い）。
     */
    rigFrames: function (game, size) {
      return this.framesFor(this.rigOptionsOf(game), size);
    },

    /** rigOptions の見た目を、その大きさで4方向ぶん描く。描いたものは覚えておく（少しだけ） */
    framesFor: function (opts, size) {
      var key = JSON.stringify(opts) + "@" + size;
      if (this._frames[key]) return this._frames[key];

      var R = NS.CharaRig, f = R.frames(R.makeLook(opts), size), out = { walk: {}, idle: {} };
      for (var d = 0; d < R.DIRS.length; d++) {
        var dir = R.DIRS[d];
        out.walk[dir] = f.walk[dir].map(function (img) { return R.toCanvas(img, 1); });
        out.idle[dir] = f.idle[dir].map(function (img) { return R.toCanvas(img, 1); });
      }
      // 見た目を決める画面で次々に選び直すと溜まるので、増えすぎたら捨てる
      if (++this._frameCount > 12) { this._frames = {}; this._frameCount = 1; }
      this._frames[key] = out;
      return out;
    },

    _frames: {},
    _frameCount: 0,

    // --- 物語の場面の人物（v1.0.2） ---

    /**
     * 人の見た目（CharaRig.makeLook に渡すもの）。
     * "player" なら主人公（いまの性別・服の色）、ほかは data/sprites_story.js の charaLooks のid。
     * 新しい絵が使えない（CharaRig.js が読めていない・主人公の rig が無い）ときは null
     */
    personOptions: function (game, id) {
      if (!NS.CharaRig || !this.assets || !this.assets.put) return null;
      if (id === "player") return this.usesRig(game.data) ? this.rigOptionsOf(game) : null;
      return (game.data.charaLooks || {})[id] || null;
    },

    /**
     * 物語の場面に立たせる絵（正面・立ち止まり3コマ。64×64）を描画物に登録し、そのidを返す。
     * 見た目が変わったときだけ描き直す。使えなければ null
     */
    personSpriteIds: function (game, id) {
      var opts = this.personOptions(game, id);
      if (!opts) return null;
      var key = JSON.stringify(opts);
      var cache = this._people[id];
      if (cache && cache.key === key) return cache.ids;

      var R = NS.CharaRig, look = R.makeLook(opts), ids = [];
      for (var i = 0; i < R.IDLE.length; i++) {
        var spriteId = "person_" + id + "_" + i;
        this.assets.put(spriteId, R.toCanvas(R.render(look, "down", R.IDLE[i], 64, false), 1));
        ids.push(spriteId);
      }
      this._people[id] = { key: key, ids: ids };
      return ids;
    },
    _people: {},

    // --- 色の計算（色を作る画面で使う） ---

    /** "#rrggbb" → { h:0〜359, s:0〜100, l:0〜100 } */
    hexToHsl: function (hex) {
      var rgb = toRgb(hex);
      var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var l = (max + min) / 2;
      var h = 0, s = 0;
      if (max !== min) {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
        else if (max === g) h = ((b - r) / d + 2);
        else h = ((r - g) / d + 4);
        h *= 60;
      }
      return { h: Math.round(h) % 360, s: Math.round(s * 100), l: Math.round(l * 100) };
    },

    /** { h, s, l } → "#rrggbb" */
    hslToHex: function (h, s, l) {
      s /= 100; l /= 100;
      var c = (1 - Math.abs(2 * l - 1)) * s;
      var x = c * (1 - Math.abs((h / 60) % 2 - 1));
      var m = l - c / 2;
      var rgb = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
              : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
      return "#" + rgb.map(function (v) { return hex2(Math.round((v + m) * 255)); }).join("");
    }
  };

  /** 色の定義から、CharaRig に渡す3色だけを抜き出す（無ければ null ＝ CharaRig の既定の色） */
  function tones(def) {
    return def ? { base: def.base, light: def.light, shadow: def.shadow } : null;
  }

  function toRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function hex2(v) {
    v = Math.max(0, Math.min(255, v));
    return (v < 16 ? "0" : "") + v.toString(16);
  }

  /** 2つの色を混ぜる（rate は b の割合） */
  function mix(a, b, rate) {
    var x = toRgb(a), y = toRgb(b);
    return "#" + [0, 1, 2].map(function (i) {
      return hex2(Math.round(x[i] + (y[i] - x[i]) * rate));
    }).join("");
  }

  function isArray(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
  }

  NS.PlayerLook = PlayerLook;
})(window.MyGame);
