/**
 * CharaRig.js
 * 主人公の絵を「部品を重ねて」その場で作る（v1.0.2）。
 *
 * ▼ なぜ部品で作るのか
 *   男女・髪型・髪の色・服の色・飾り（眼鏡・スカーフ・マント・はちまき）を自由に組み合わせ、
 *   4方向 × 歩き4コマ ＋ 立ち止まり まで描くと、1枚ずつ描いた絵では数が追いつかない。
 *   そこで体・髪・飾りを「形」として持ち、選んだものを重ねて点の絵にする。
 *
 * ▼ 形は 64×64 の座標で書く
 *   同じ形を 48×48（地図）でも 64×64（物語。2倍にして 128 で出す）でも描ける。
 *   点の中心がその形の内側にあれば塗る。
 *
 * ▼ 塗り方（点の絵らしく見せるための決まり）
 *   1. 部品ごとに3色（光・地・影）。光は左上から。右と下の縁が影、左と上の縁が光
 *   2. 前にある部品が後ろの部品と接するところに、前の部品の側へ濃い線を引く（腕と胴の境目など）
 *   3. 前髪のすぐ下の顔は影にする（髪の落とす影）
 *   4. 最後に、絵全体の外側を輪郭の色で1点ぶん囲む
 *
 * ▼ 向き
 *   down（正面）・up（後ろ）・right（右向き）を描き、left は right を左右反転して作る。
 *
 * ▼ 歩き（4コマ）
 *   右足が前 → 左足を上げて体が浮く → 左足が前 → 右足を上げて体が浮く。
 *   腕は同じ側の足と逆に振る。歩いているあいだは髪・マント・スカーフがなびく。
 * ▼ 立ち止まり（3コマ）
 *   ふつう・息を吸って肩が1点下がる・まばたき。
 */
(function (NS) {
  "use strict";

  var OUTLINE = "#101425";   // 輪郭（いまの主人公と同じ色）
  var D = 64;                // 形を書く座標の大きさ

  // ------------------------------------------------------------------
  // 色
  // ------------------------------------------------------------------
  function toRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function hex2(v) {
    v = Math.max(0, Math.min(255, Math.round(v)));
    return (v < 16 ? "0" : "") + v.toString(16);
  }
  function mix(a, b, t) {
    var x = toRgb(a), y = toRgb(b);
    return "#" + hex2(x[0] + (y[0] - x[0]) * t) + hex2(x[1] + (y[1] - x[1]) * t) + hex2(x[2] + (y[2] - x[2]) * t);
  }

  /** "#rrggbb" か { base, light, shadow } を、光・地・影の3色にする（服の色を作る画面と同じ混ぜ方） */
  function tone(c) {
    if (!c) c = "#808080";
    if (typeof c === "string") return { b: c, l: mix(c, "#ffffff", 0.25), d: mix(c, "#000000", 0.36) };
    return { b: c.base, l: c.light || mix(c.base, "#ffffff", 0.25), d: c.shadow || mix(c.base, "#000000", 0.36) };
  }
  /** 横向きの向こう側の手足は1段暗くする */
  function farTone(t) { return { b: t.d, l: t.b, d: mix(t.d, "#000000", 0.3) }; }
  function flat(c) { return { b: c, l: c, d: c }; }

  // ------------------------------------------------------------------
  // 形（64×64 の座標で「内側か」を返す関数）
  // ------------------------------------------------------------------
  function ell(cx, cy, rx, ry) {
    return function (x, y) { var a = (x - cx) / rx, b = (y - cy) / ry; return a * a + b * b <= 1; };
  }
  function rect(x0, y0, x1, y1) {
    return function (x, y) { return x >= x0 && x < x1 && y >= y0 && y < y1; };
  }
  function poly(pts) {
    return function (x, y) {
      var inside = false;
      for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    };
  }
  /** 太さの変わる棒（腕・脚・束ねた髪）。r1 が始まり、r2 が終わりの太さ */
  function stick(x1, y1, x2, y2, r1, r2) {
    if (r2 === undefined) r2 = r1;
    var vx = x2 - x1, vy = y2 - y1, len2 = vx * vx + vy * vy || 1;
    return function (x, y) {
      var t = ((x - x1) * vx + (y - y1) * vy) / len2;
      t = t < 0 ? 0 : (t > 1 ? 1 : t);
      var dx = x - (x1 + vx * t), dy = y - (y1 + vy * t), r = r1 + (r2 - r1) * t;
      return dx * dx + dy * dy <= r * r;
    };
  }
  function any() {
    var fs = arguments;
    return function (x, y) {
      for (var i = 0; i < fs.length; i++) if (fs[i] && fs[i](x, y)) return true;
      return false;
    };
  }
  function all() {
    var fs = arguments;
    return function (x, y) {
      for (var i = 0; i < fs.length; i++) if (!fs[i](x, y)) return false;
      return true;
    };
  }
  function not(f) { return function (x, y) { return !f(x, y); }; }
  /** 0 → 1 → 0 をくり返す山（ギザギザの前髪・毛先に使う） */
  function tri(t) { t = t - Math.floor(t); return 1 - Math.abs(2 * t - 1); }
  function shift(pts, dy) {
    var out = [];
    for (var i = 0; i < pts.length; i++) out.push([pts[i][0], pts[i][1] + dy]);
    return out;
  }

  // ------------------------------------------------------------------
  // 点の絵を塗る板
  // ------------------------------------------------------------------
  /**
   * @param {number} w 横の点の数
   * @param {number} h 縦の点の数
   * @param {number} u 形の座標1つぶんが何点か（64×64 の形を 48 で描くなら 0.75）
   */
  function Sheet(w, h, u) {
    this.w = w;
    this.h = h;
    this.u = u;
    var n = w * h;
    this.color = new Array(n);
    this.layer = new Array(n);
    for (var i = 0; i < n; i++) { this.color[i] = null; this.layer[i] = -1; }
    this.metas = [];
  }

  function at(m, x, y, w, h) { return x >= 0 && y >= 0 && x < w && y < h && m[y * w + x] === 1; }

  /**
   * 部品を1つ塗る。
   * L.test   … 形
   * L.tone   … 光・地・影の3色
   * L.shade  … "flat" なら1色で塗る（書かなければ縁で光と影をつける）
   * L.sd     … 影の幅（点の数。書かなければ 64 で2点・48 で1点）
   * L.color  … 点ごとに色を決める関数（目など）。null を返した点は塗らない
   * L.group  … 同じ group どうしの境目には線を引かない（袖と手など）
   * L.line   … false なら境目の線を引かない（目・口）
   * L.shine  … 光の色にする場所（髪のつや）
   * L.castShadow  … すぐ下の点を影にする（前髪）
   * L.takesShadow … 影を受ける（顔）
   */
  Sheet.prototype.paint = function (L) {
    var w = this.w, h = this.h, u = this.u, t = L.tone;
    var m = new Array(w * h);
    for (var yy = 0; yy < h; yy++) {
      for (var xx = 0; xx < w; xx++) m[yy * w + xx] = L.test((xx + 0.5) / u, (yy + 0.5) / u) ? 1 : 0;
    }

    var idx = this.metas.length;
    this.metas.push({
      group: L.group || ("p" + idx),
      line: L.line !== false,
      lineColor: L.lineColor || mix(t.d, OUTLINE, 0.5),
      tone: t,
      takesShadow: !!L.takesShadow
    });

    var sd = L.sd || Math.max(1, Math.round(1.5 * u));
    var shadows = [];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = y * w + x;
        if (!m[i]) continue;
        var c, px = (x + 0.5) / u, py = (y + 0.5) / u;
        if (L.color) {
          c = L.color(px, py, t, u);
        } else if (L.shade === "flat") {
          c = t.b;
        } else {
          var dark = false;
          for (var k = 1; k <= sd && !dark; k++) dark = !at(m, x + k, y, w, h) || !at(m, x, y + k, w, h);
          var lite = !at(m, x - 1, y, w, h) || !at(m, x, y - 1, w, h);
          c = dark ? t.d : (lite ? t.l : t.b);
          if (!dark && L.shine && L.shine(px, py)) c = t.l;
        }
        if (c === null) continue;
        this.color[i] = c;
        this.layer[i] = idx;
        if (L.castShadow && y + 1 < h && !m[i + w]) shadows.push(i + w);
      }
    }
    for (var j = 0; j < shadows.length; j++) {
      var lay = this.layer[shadows[j]];
      if (lay >= 0 && lay !== idx && this.metas[lay].takesShadow) this.color[shadows[j]] = this.metas[lay].tone.d;
    }
  };

  /** 前の部品が後ろの部品と接するところに、前の部品の側へ線を引く */
  Sheet.prototype.lines = function () {
    var w = this.w, h = this.h, marks = [];
    var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = y * w + x, a = this.layer[i];
        if (a < 0 || !this.metas[a].line) continue;
        for (var k = 0; k < 4; k++) {
          var nx = x + nb[k][0], ny = y + nb[k][1];
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          var b = this.layer[ny * w + nx];
          if (b >= 0 && b < a && this.metas[b].group !== this.metas[a].group) { marks.push(i); break; }
        }
      }
    }
    for (var j = 0; j < marks.length; j++) this.color[marks[j]] = this.metas[this.layer[marks[j]]].lineColor;
  };

  /** 絵全体の外側を輪郭の色で囲む */
  Sheet.prototype.outline = function () {
    var w = this.w, h = this.h, c = this.color, marks = [];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = y * w + x;
        if (c[i] !== null) continue;
        if ((x > 0 && c[i - 1] !== null) || (x < w - 1 && c[i + 1] !== null) ||
            (y > 0 && c[i - w] !== null) || (y < h - 1 && c[i + w] !== null)) marks.push(i);
      }
    }
    for (var j = 0; j < marks.length; j++) c[marks[j]] = OUTLINE;
  };

  // ------------------------------------------------------------------
  // 体つき（数字は 64×64 の座標）
  // ------------------------------------------------------------------
  var BODY = {
    male: {
      torso: [[21.5, 31], [42.5, 31], [42, 39], [41, 43.5], [42.6, 49.5], [21.4, 49.5], [23, 43.5], [22, 39]],
      torsoSide: [[25.4, 31], [38.6, 31], [39.2, 43.5], [40.2, 49.5], [24, 49.5], [25, 43.5]],
      shoulder: 21.6, armR: 2.8, handR: 2.4,
      legX: 4.2, legW: 2.7, legTop: 45, boot: 4.4,
      beltY: 43.2,
      eyes: [[25, 20, 28, 24], [36, 20, 39, 24]], eyeSide: [38, 20, 40.5, 24],
      lash: false, blush: false
    },
    female: {
      torso: [[23, 31], [41, 31], [40.5, 36], [38.6, 40.5], [44.2, 51.5], [19.8, 51.5], [25.4, 40.5], [23.5, 36]],
      torsoSide: [[27, 31], [37, 31], [36.6, 36], [35.8, 40.5], [40.5, 51.5], [23.5, 51.5], [28.2, 40.5], [27.4, 36]],
      shoulder: 23.2, armR: 2.4, handR: 2.2,
      legX: 3.8, legW: 2.3, legTop: 47, boot: 6.2,
      beltY: 40.2,
      eyes: [[24.6, 19.4, 28, 24], [36, 19.4, 39.4, 24]], eyeSide: [37.6, 19.4, 40.6, 24],
      lash: true, blush: true
    }
  };

  /**
   * 服の形（胴の形・すその高さ）。体つきごとに持つ。
   *   tunic … 腰までの上着（主人公）
   *   coat  … 膝まである外套（オルド）。前の合わせ目に線が入る
   *   robe  … 足首まである長衣（イレーネ）。縁取り（trim）の色で襟・前・すそ・帯を飾る
   */
  var OUTFIT = {
    tunic: {
      male: { torso: BODY.male.torso, side: BODY.male.torsoSide, hem: 49.5 },
      female: { torso: BODY.female.torso, side: BODY.female.torsoSide, hem: 51.5 }
    },
    coat: {
      male: { torso: [[21.5, 31], [42.5, 31], [42, 39], [41.4, 43.5], [44, 56], [20, 56], [22.6, 43.5], [22, 39]],
              side: [[25.4, 31], [38.6, 31], [39.2, 43.5], [41.4, 56], [22.6, 56], [24.6, 43.5]], hem: 56 },
      female: { torso: [[23, 31], [41, 31], [40.5, 36], [39, 40.5], [43.6, 56], [20.4, 56], [25, 40.5], [23.5, 36]],
                side: [[27, 31], [37, 31], [36.6, 36], [36, 40.5], [40.6, 56], [23.4, 56], [28, 40.5], [27.4, 36]], hem: 56 }
    },
    robe: {
      male: { torso: [[21.5, 31], [42.5, 31], [42, 39], [41.4, 43.5], [45, 58], [19, 58], [22.6, 43.5], [22, 39]],
              side: [[25.4, 31], [38.6, 31], [39.2, 43.5], [42, 58], [22, 58], [24.6, 43.5]], hem: 58 },
      female: { torso: [[23, 31], [41, 31], [40.5, 36], [39, 41], [45, 58], [19, 58], [25, 41], [23.5, 36]],
                side: [[26.6, 31], [37.4, 31], [37, 36], [36.2, 41], [41.5, 58], [22.5, 58], [27.6, 41], [27, 36]], hem: 58 }
    }
  };

  /** 肩幅の広い体つき（オルド）。胴を横へ広げる */
  function widen(pts, k, center) {
    var c = center || 32, out = [];
    for (var i = 0; i < pts.length; i++) out.push([c + (pts[i][0] - c) * k, pts[i][1]]);
    return out;
  }

  function outfitOf(look) {
    var o = (OUTFIT[look.outfit] || OUTFIT.tunic)[look.body] || OUTFIT.tunic.male;
    var k = look.build === "broad" ? 1.1 : 1;
    return { torso: widen(o.torso, k), side: widen(o.side, k), hem: o.hem, kind: look.outfit || "tunic", broad: k > 1 };
  }

  // ------------------------------------------------------------------
  // 髪型。front（正面）・back（後ろ）・side（右向き）がそれぞれ
  //   { front: 顔より前の髪, behind: 体より後ろの髪, mid: 胴と手前の腕のあいだの髪,
  //     shine: つや, extra: 結び目など }
  // を返す。cy は頭の中心の高さ（息や歩きで上下する）
  // ------------------------------------------------------------------
  function bangs(x, cy, depth, amp, step) {
    return cy - depth + amp * tri((x - 32) / step + 0.5);
  }
  function shineFront(cy) {
    var a = ell(29.5, cy - 1.5, 9.5, 8), b = ell(30.8, cy + 0.4, 9.5, 8);
    return function (x, y) { return y < cy - 4 && a(x, y) && !b(x, y); };
  }
  function shineBack(cy) {
    var a = ell(30, cy - 0.5, 10, 9), b = ell(31.4, cy + 1.4, 10, 9);
    return function (x, y) { return y < cy - 3 && a(x, y) && !b(x, y); };
  }
  function shineSide(cy) {
    var a = ell(30, cy - 1.5, 9.5, 8), b = ell(31.6, cy + 0.4, 9.5, 8);
    return function (x, y) { return y < cy - 4 && a(x, y) && !b(x, y); };
  }

  /** 右向きの髪を、前髪・もみあげ・耳の上・うなじに切り分ける */
  function sideCut(shape, cy, o) {
    return function (x, y) {
      if (!shape(x, y)) return false;
      if (y < cy - 5) return true;                                            // 頭のてっぺん
      if (x > 35.6) return y < cy - o.bang + o.amp * tri((x - 35.6) / 3.2);  // 前髪
      if (x > 34) return y < cy + o.burn;                                     // もみあげ
      if (x > 29.6) return y < cy - 1.5 + o.ear;                              // 耳の上
      return y < cy + o.nape - (29.6 - x) * 0.12;                             // 後ろ頭
    };
  }

  /** 頭のまわりに尖った房を並べる（from〜to の角度に n 本） */
  function spikes(cx, cy, rx, ry, n, amp, from, to) {
    return function (x, y) {
      var dx = (x - cx) / rx, dy = (y - cy) / ry, r = Math.sqrt(dx * dx + dy * dy);
      if (r <= 1) return true;
      var ang = Math.atan2(dy, dx);
      if (ang < from || ang > to) return false;
      return r <= 1 + amp * tri((ang - from) / (to - from) * n);
    };
  }

  var SHORT_SIDE = { bang: 3.3, amp: 1.7, burn: 4, ear: 0, nape: 10 };

  var HAIR = {
    // 短め（いまの主人公の髪。前髪を眉の上でそろえ、横は頬まで）
    short: {
      front: function (P) {
        var cy = 18.5 + P.dy, cap = ell(32, cy, 14, 13);
        return {
          front: function (x, y) {
            return cap(x, y) && y < cy + 9.5 && (y < bangs(x, cy, 3.3, 1.7, 3.4) || Math.abs(x - 32) > 9.4);
          },
          shine: shineFront(cy)
        };
      },
      back: function (P) {
        var cy = 18.5 + P.dy, cap = ell(32, cy + 0.5, 14, 13.5);
        return {
          front: function (x, y) { return cap(x, y) && y < cy + 8.6 + 1.2 * tri(Math.abs(x - 32) / 3); },
          shine: shineBack(cy)
        };
      },
      side: function (P) {
        var cy = 18.5 + P.dy;
        return { front: sideCut(ell(31.3, cy, 13.4, 13), cy, SHORT_SIDE), shine: shineSide(cy) };
      }
    },

    // 長め（背中まで。顔の横の房が肩に掛かる）
    long: {
      front: function (P) {
        var base = HAIR.short.front(P), cy = 18.5 + P.dy, sw = P.sway;
        var strands = function (x, y) {
          var ax = Math.abs(x - 32);
          return ax > 9.4 && ax < 14.3 && y >= cy && y < cy + 19 - (ax - 9.4) * 0.8 + 1.4 * tri(x / 2.2);
        };
        return {
          front: any(base.front, strands),
          behind: function (x, y) {
            var t = (y - cy) / 27, xx = x - sw * t * 1.5;
            return y >= cy - 2 && y < cy + 27 + 1.6 * tri(xx / 3.4) && Math.abs(xx - 32) < 14.6 - t * 1.2;
          },
          shine: base.shine
        };
      },
      back: function (P) {
        var cy = 18.5 + P.dy, sw = P.sway, cap = ell(32, cy + 0.5, 14, 13.5);
        return {
          front: any(cap, function (x, y) {
            var t = (y - cy) / 27, xx = x - sw * t * 1.5;
            return y >= cy && y < cy + 27 + 1.6 * tri(xx / 3.4) && Math.abs(xx - 32) < 13.8 - t * 2;
          }),
          shine: shineBack(cy)
        };
      },
      side: function (P) {
        var cy = 18.5 + P.dy, sw = P.sway;
        return {
          front: sideCut(ell(31.3, cy, 13.4, 13), cy, SHORT_SIDE),
          mid: function (x, y) {
            var t = (y - cy) / 26, xx = x + sw * t * 1.6;
            return y >= cy - 1 && y < cy + 26 + 1.5 * tri(xx / 3) && xx >= 18.4 + t * 0.6 && xx < 29.8 - t * 1.6;
          },
          shine: shineSide(cy)
        };
      }
    },

    // ポニーテール（頭の後ろで1つに束ねる。結び目は服の色）
    ponytail: {
      front: function (P) {
        var cy = 18.5 + P.dy, cap = ell(32, cy, 14, 13), sw = P.sway;
        return {
          front: function (x, y) {
            return cap(x, y) && y < cy + 5.5 && (y < bangs(x, cy, 3.3, 1.7, 3.4) || Math.abs(x - 32) > 9.4);
          },
          behind: stick(42, cy - 8, 47 + sw, cy + 11, 3.4, 1.8),
          shine: shineFront(cy)
        };
      },
      back: function (P) {
        var cy = 18.5 + P.dy, cap = ell(32, cy + 0.5, 14, 13.5), sw = P.sway;
        return {
          front: any(
            function (x, y) { return cap(x, y) && y < cy + 7 + 1.2 * tri(Math.abs(x - 32) / 3); },
            stick(32, cy - 5, 32 + sw * 0.6, cy + 5, 3.8, 3.4),
            stick(32 + sw * 0.6, cy + 5, 32 + sw * 1.4, cy + 16, 3.4, 1.8)
          ),
          shine: shineBack(cy),
          extra: [{ test: ell(32, cy - 5, 2.6, 1.8), toneKey: "cloth", group: "tie", sd: 1 }]
        };
      },
      side: function (P) {
        var cy = 18.5 + P.dy, sw = P.sway;
        return {
          front: any(
            sideCut(ell(31.3, cy, 13.4, 13), cy, { bang: 3.3, amp: 1.7, burn: 4, ear: 0, nape: 7 }),
            stick(19.6, cy - 4.6, 15.6, cy + 2.6, 3.6, 3.0),
            stick(15.6, cy + 2.6, 16.6 - sw * 1.2, cy + 13, 3.0, 1.5)
          ),
          shine: shineSide(cy),
          extra: [{ test: ell(20.4, cy - 4.2, 1.6, 2.2), toneKey: "cloth", group: "tie", sd: 1 }]
        };
      }
    },

    // ツンツン（上と後ろに尖った房。前髪も深く切れ込む）
    spiky: {
      front: function (P) {
        var cy = 18.5 + P.dy;
        var base = spikes(32, cy + 0.5, 14, 12.6, 5, 0.26, -Math.PI * 0.97, -Math.PI * 0.03);
        return {
          front: function (x, y) {
            if (!base(x, y)) return false;
            if (Math.abs(x - 32) > 9.4) return y < cy + 4.5;
            return y < bangs(x, cy, 3.8, 3.0, 3.3);
          },
          shine: shineFront(cy)
        };
      },
      back: function (P) {
        var cy = 18.5 + P.dy;
        var base = spikes(32, cy + 0.5, 14, 13, 5, 0.26, -Math.PI * 0.97, -Math.PI * 0.03);
        return {
          front: function (x, y) { return base(x, y) && y < cy + 8.5 + 1.6 * tri(Math.abs(x - 32) / 2.4); },
          shine: shineBack(cy)
        };
      },
      side: function (P) {
        var cy = 18.5 + P.dy;
        var base = any(
          spikes(31, cy + 0.5, 13.4, 12.6, 4, 0.3, -Math.PI * 0.95, -Math.PI * 0.2),
          spikes(31, cy + 0.5, 13.4, 12.6, 2, 0.3, Math.PI * 0.62, Math.PI)
        );
        return { front: sideCut(base, cy, { bang: 3.8, amp: 3, burn: 3, ear: 0, nape: 8.5 }), shine: shineSide(cy) };
      }
    },

    // ボブ（あごの高さで切りそろえる。耳は隠れる）
    bob: {
      front: function (P) {
        var cy = 18.5 + P.dy, cap = ell(32, cy + 1.2, 15, 14);
        return {
          front: function (x, y) {
            return cap(x, y) && y < cy + 11.6 && (y < bangs(x, cy, 2.9, 0.9, 2.8) || Math.abs(x - 32) > 9.2);
          },
          shine: shineFront(cy)
        };
      },
      back: function (P) {
        var cy = 18.5 + P.dy, cap = ell(32, cy + 1.2, 15, 14);
        return { front: function (x, y) { return cap(x, y) && y < cy + 11.6; }, shine: shineBack(cy) };
      },
      side: function (P) {
        var cy = 18.5 + P.dy;
        return {
          front: sideCut(ell(31, cy + 1.2, 14.6, 14), cy, { bang: 2.9, amp: 0.9, burn: 11.6, ear: 13.1, nape: 11.6 }),
          shine: shineSide(cy)
        };
      }
    },

    // なでつけ（額を出して後ろへ流す。横は耳の高さまで。オルド）
    slick: {
      front: function (P) {
        var cy = 18.5 + P.dy, cap = ell(32, cy, 13.6, 12.8);
        return {
          front: function (x, y) {
            if (!cap(x, y)) return false;
            if (Math.abs(x - 32) > 10.2) return y < cy + 3;
            return y < cy - 5.6 + 0.7 * tri((x - 32) / 5);
          },
          shine: shineFront(cy)
        };
      },
      back: function (P) {
        var cy = 18.5 + P.dy, cap = ell(32, cy + 0.5, 13.6, 13);
        return { front: function (x, y) { return cap(x, y) && y < cy + 7.4; }, shine: shineBack(cy) };
      },
      side: function (P) {
        var cy = 18.5 + P.dy;
        return { front: sideCut(ell(31, cy, 13.2, 12.8), cy, { bang: 5.6, amp: 0.7, burn: 2, ear: 0, nape: 7.4 }), shine: shineSide(cy) };
      }
    },

    // 肩まで（額を出し、横と後ろを肩の高さまで下ろす。イレーネ）
    medium: {
      front: function (P) {
        var cy = 18.5 + P.dy, cap = ell(32, cy, 14.2, 13.2), sw = P.sway;
        return {
          front: function (x, y) {
            var ax = Math.abs(x - 32);
            if (cap(x, y) && y < cy - 4.6 + 0.8 * tri((x - 32) / 4)) return true;
            var xx = x - sw * Math.max(0, y - cy) / 15;
            var bx = Math.abs(xx - 32);
            return bx > 9.4 && bx < 14.4 - Math.max(0, y - cy - 8) * 0.25 && y >= cy - 6 && y < cy + 15 + 1.2 * tri(xx / 2.2);
          },
          shine: shineFront(cy)
        };
      },
      back: function (P) {
        var cy = 18.5 + P.dy, cap = ell(32, cy + 0.5, 14.2, 13.5), sw = P.sway;
        return {
          front: any(cap, function (x, y) {
            var xx = x - sw * Math.max(0, y - cy) / 15;
            return y >= cy && y < cy + 15 + 1.2 * tri(xx / 2.6) && Math.abs(xx - 32) < 14.2 - Math.max(0, y - cy - 8) * 0.25;
          }),
          shine: shineBack(cy)
        };
      },
      side: function (P) {
        var cy = 18.5 + P.dy, sw = P.sway;
        var cut = sideCut(ell(31, cy, 13.6, 13.2), cy, { bang: 4.6, amp: 0.8, burn: 4, ear: 0, nape: 10 });
        return {
          front: any(cut, function (x, y) {
            var xx = x + sw * Math.max(0, y - cy) / 12;
            return y >= cy && y < cy + 15 + 1.2 * tri(xx / 2.4) && xx >= 18.4 && xx < 31.5 - Math.max(0, y - cy - 6) * 0.3;
          }),
          shine: shineSide(cy)
        };
      }
    }
  };

  // ------------------------------------------------------------------
  // 顔
  // ------------------------------------------------------------------
  function eyeLayer(r, dy, P) {
    var x0 = r[0], y0 = r[1] + dy, x1 = r[2], y1 = r[3] + dy;
    if (P.blink) {
      return { test: rect(x0, y0 + 2.2, x1, y0 + 3.2), tone: flat(OUTLINE), shade: "flat", line: false, group: "face" };
    }
    return {
      test: rect(x0, y0, x1, y1), tone: null, line: false, group: "face",
      color: function (x, y, t, u) {
        if (y < y0 + 1) return OUTLINE;                         // 上まぶた
        if (x < x0 + 1.4 && y < y0 + 2.4) return "#ffffff";      // 目の光
        if (u >= 1 && y >= y1 - 1) return t.l;                  // 下の明るいところ（64 のときだけ）
        return t.b;
      }
    };
  }

  function pushFace(L, B, T, P, dy, side, beard) {
    var eyes = side ? [B.eyeSide] : B.eyes;
    // ひげ（頬から顎を覆い、顎の下へ少しはみ出す）。口はひげの上に描く
    if (beard) {
      L.push({
        test: side ? all(any(ell(32.5, 20 + dy, 11.6, 12.1), ell(37, 28.4 + dy, 6.4, 5)), rect(31.5, 23.4 + dy, 64, 64))
                   : all(any(ell(32, 20 + dy, 12.6, 12.2), ell(32, 28.6 + dy, 8.6, 5.4)), rect(0, 23.4 + dy, 64, 64)),
        tone: T.beard, group: "beard", sd: 1
      });
    }
    for (var i = 0; i < eyes.length; i++) {
      var e = eyeLayer(eyes[i], dy, P);
      if (!e.tone) e.tone = T.eye;
      L.push(e);
      // まつ毛（目の外側の上に1点）
      if (B.lash && !P.blink) {
        var outerRight = side || i === 1;
        var r = eyes[i];
        L.push({ test: outerRight ? rect(r[2], r[1] + dy, r[2] + 1, r[1] + 1.4 + dy) : rect(r[0] - 1, r[1] + dy, r[0], r[1] + 1.4 + dy),
                 tone: flat(OUTLINE), shade: "flat", line: false, group: "face" });
      }
    }
    var mouthColor = flat(mix(T.skin.d, "#7a3a30", 0.45));
    L.push({ test: side ? rect(40.8, 27.2 + dy, 42.4, 28.2 + dy) : rect(31, 27.2 + dy, 33, 28.2 + dy),
             tone: mouthColor, shade: "flat", line: false, group: "face" });
    if (B.blush) {
      var blush = flat(mix(T.skin.b, "#ff6f6f", 0.3));
      if (side) {
        L.push({ test: rect(37.4, 24.6 + dy, 40, 25.6 + dy), tone: blush, shade: "flat", line: false, group: "face" });
      } else {
        L.push({ test: any(rect(23.4, 24.6 + dy, 26, 25.6 + dy), rect(38, 24.6 + dy, 40.6, 25.6 + dy)),
                 tone: blush, shade: "flat", line: false, group: "face" });
      }
    }
  }

  function glassesTest(eyes, dy, side) {
    var parts = [];
    for (var i = 0; i < eyes.length; i++) {
      var r = eyes[i];
      parts.push(all(rect(r[0] - 1, r[1] - 1 + dy, r[2] + 1, r[3] + 1 + dy), not(rect(r[0], r[1] + dy, r[2], r[3] + dy))));
    }
    if (side) parts.push(rect(31.6, 21 + dy, eyes[0][0] - 1, 22 + dy));             // つる（耳まで）
    else parts.push(rect(eyes[0][2] + 1, 21 + dy, eyes[1][0] - 1, 22 + dy));         // 鼻の上の橋
    return any.apply(null, parts);
  }

  function hairLayers(T, hair) {
    var out = [];
    if (hair.extra) {
      for (var i = 0; i < hair.extra.length; i++) {
        var e = hair.extra[i];
        out.push({ test: e.test, tone: T[e.toneKey] || T.cloth, group: e.group, sd: e.sd });
      }
    }
    return out;
  }

  // ------------------------------------------------------------------
  // 正面・後ろ
  // ------------------------------------------------------------------
  function buildFront(look, P, back) {
    var B = BODY[look.body] || BODY.male, T = look.tones, A = look.acc, dy = P.dy, L = [];
    var style = HAIR[look.hair] || HAIR.short;
    var hair = style[back ? "back" : "front"](P);
    var flip = back ? -1 : 1;      // 後ろから見ると、前に出した手足は奥へ行く
    var sw = P.sway * 0.6, k, side;

    // マント（正面では体の後ろ）・後ろ髪
    if (A.cape && !back) L.push({ test: poly(shift([[20.5, 32], [43.5, 32]], dy).concat([[47.5 + sw, 56], [16.5 + sw, 56]])), tone: T.cape, group: "cape" });
    if (hair.behind) L.push({ test: hair.behind, tone: T.hair, group: "hairB", shine: null });

    // 脚と靴
    for (k = 0; k < 2; k++) {
      side = k === 0 ? -1 : 1;
      var cx = 32 + side * B.legX;
      var fwd = (k === 0 ? P.s : -P.s) * flip;
      var lift = k === 0 ? P.liftA : P.liftB;
      var foot = 62 + fwd * 0.8 - lift * 2.6;
      var top = B.legTop + P.bob;
      L.push({ test: rect(cx - B.legW, top, cx + B.legW, foot - B.boot + 0.6), tone: T.pants, group: "leg" + k });
      L.push({
        test: any(rect(cx - B.legW - 0.5, foot - B.boot, cx + B.legW + 0.5, foot - 1.6),
                  all(ell(cx, foot - 1.8, B.legW + 1.4, 2.4), rect(0, 0, 64, foot))),
        tone: T.shoes, group: "leg" + k
      });
    }

    // 胴・襟・ベルト
    var O = outfitOf(look);
    var torso = poly(shift(O.torso, dy));
    var hem = O.hem + dy;
    L.push({ test: torso, tone: T.cloth, group: "body" });
    if (!back && O.kind !== "robe") L.push({ test: poly([[28.6, 31 + dy], [35.4, 31 + dy], [32, 35.6 + dy]]), tone: T.skin, shade: "flat", group: "body" });
    if (!back && O.kind === "coat") L.push({ test: rect(31.5, 35 + dy, 32.5, hem), tone: flat(T.cloth.d), shade: "flat", group: "body" });
    if (O.kind === "robe") {
      // 縁取り：襟・前の合わせ（正面だけ）・すそ
      L.push({ test: all(torso, any(rect(0, 31 + dy, 64, 33 + dy), rect(0, hem - 2, 64, hem),
                                    back ? null : rect(30.8, 31 + dy, 33.2, hem))),
               tone: T.trim, group: "body", sd: 1 });
    }
    var by = B.beltY + dy;
    L.push({ test: all(torso, rect(0, by, 64, by + 2.6)), tone: T.belt, group: "body", sd: 1 });
    if (!back && look.buckle) L.push({ test: rect(30.6, by - 0.3, 33.4, by + 2.9), tone: T.buckle, group: "body", sd: 1 });

    // 腕（同じ側の脚と逆に振る）
    for (k = 0; k < 2; k++) {
      side = k === 0 ? -1 : 1;
      var sx = 32 + side * (32 - B.shoulder) * (O.broad ? 1.1 : 1), sy = 33.5 + dy;
      var a = (k === 0 ? -P.s : P.s) * flip;
      var hx = sx + side * 1.4, hy = 45.2 + dy;
      if (a > 0) { hx -= side * 2.4 * a; hy += 1.4 * a; }        // 前へ：内側へ寄って少し下がる
      else if (a < 0) { hx += side * 0.8 * -a; hy += 2.6 * a; }   // 後ろへ：短く見える
      var wx = sx + (hx - sx) * 0.8, wy = sy + (hy - sy) * 0.8;
      L.push({ test: stick(sx, sy, wx, wy, B.armR, B.armR - 0.2), tone: T.cloth, group: "arm" + k });
      L.push({ test: ell(hx, hy, B.handR, B.handR), tone: T.skin, group: "arm" + k, sd: 1 });
    }

    // マント（後ろから見ると体の前）
    if (A.cape && back) L.push({ test: poly(shift([[21, 31], [43, 31]], dy).concat([[47.5 + sw, 56], [16.5 + sw, 56]])), tone: T.cape, group: "cape" });
    if (A.cape && !back) {
      L.push({ test: any(ell(24.6, 33.2 + dy, 1.4, 1.4), ell(39.4, 33.2 + dy, 1.4, 1.4)), tone: T.buckle, shade: "flat", line: false, group: "clasp" });
    }

    // スカーフ
    if (A.scarf) {
      L.push({ test: ell(32, 33 + dy, 8.6, 2.5), tone: T.scarf, group: "scarf" });
      var tail = back ? [[29.2, 33.5], [34.8, 33.5], [35.4 + sw, 44], [32 + sw, 42.4], [28.6 + sw, 44]]
                      : [[33.4, 33.5], [38, 33.5], [38.8, 42.6], [36.2, 41], [33.6, 43]];
      L.push({ test: poly(shift(tail, dy)), tone: T.scarf, group: "scarf" });
    }

    // 頭（耳は頭の後ろ）
    L.push({ test: any(ell(19.8, 21.6 + dy, 1.9, 2.6), ell(44.2, 21.6 + dy, 1.9, 2.6)), tone: T.skin, group: "ear", sd: 1 });
    L.push({ test: ell(32, 20 + dy, 12.5, 12), tone: T.skin, group: "head", sd: 1, takesShadow: true });
    if (!back) pushFace(L, B, T, P, dy, false, look.beard);

    // 前の髪
    L.push({ test: hair.front, tone: T.hair, group: "hair", shine: hair.shine, castShadow: true });
    L = L.concat(hairLayers(T, hair));

    if (A.glasses && !back) L.push({ test: glassesTest(B.eyes, dy, false), tone: T.glasses, shade: "flat", line: false, group: "glasses" });
    if (A.band) {
      L.push({ test: all(ell(32, 18.5 + dy, 14.6, 13.6), rect(10, 11 + dy, 54, 14.2 + dy)), tone: T.band, group: "band", sd: 1, line: false });
      if (back) {
        L.push({ test: any(stick(32.6, 13.6 + dy, 35 + sw, 22 + dy, 1.4, 1.1),
                           stick(31.4, 13.6 + dy, 29.4 + sw, 21.4 + dy, 1.4, 1.1),
                           ell(32, 12.8 + dy, 2, 1.8)), tone: T.band, group: "band2", sd: 1 });
      }
    }
    return L;
  }

  // ------------------------------------------------------------------
  // 右向き
  // ------------------------------------------------------------------
  function pushArmSide(L, B, T, swing, dy, far) {
    var sx = far ? 31 : 32, sy = 33.6 + dy;
    var th = swing * 0.62, len = 11.2;
    var hx = sx + Math.sin(th) * len, hy = sy + Math.cos(th) * len;
    var wx = sx + (hx - sx) * 0.8, wy = sy + (hy - sy) * 0.8;
    var g = far ? "armF" : "armN";
    L.push({ test: stick(sx, sy, wx, wy, B.armR, B.armR - 0.2), tone: far ? farTone(T.cloth) : T.cloth, group: g });
    L.push({ test: ell(hx, hy, B.handR, B.handR), tone: far ? farTone(T.skin) : T.skin, group: g, sd: 1 });
  }

  function pushLegSide(L, B, T, fwd, lift, bob, far) {
    var hipX = 31.5, hipY = B.legTop + bob, ground = 62;
    var fx = hipX + Math.tan(fwd * 0.42) * (ground - hipY), fy = ground;
    if (lift) { fx = hipX - 2.2; fy = ground - 3; }
    var g = far ? "legF" : "legN";
    L.push({ test: stick(hipX, hipY, fx, fy - B.boot + 1, B.legW + 0.2, B.legW), tone: far ? farTone(T.pants) : T.pants, group: g });
    L.push({
      test: all(any(ell(fx + 1.6, fy - 2.2, B.legW + 2.2, 2.6), rect(fx - B.legW - 0.3, fy - B.boot, fx + B.legW + 0.3, fy - 1.5)),
                rect(0, 0, 64, fy)),
      tone: far ? farTone(T.shoes) : T.shoes, group: g
    });
  }

  function buildSide(look, P) {
    var B = BODY[look.body] || BODY.male, T = look.tones, A = look.acc, dy = P.dy, L = [];
    var hair = (HAIR[look.hair] || HAIR.short).side(P);
    var fl = P.flutter;

    if (A.cape) {
      L.push({ test: poly([[27.6, 31.5 + dy], [31.6, 31.5 + dy], [30, 44], [26, 56], [16.5 - fl * 2, 55], [20.5 - fl, 42]]),
               tone: T.cape, group: "cape" });
    }
    if (hair.behind) L.push({ test: hair.behind, tone: T.hair, group: "hairB" });

    pushArmSide(L, B, T, P.s, dy, true);                 // 向こうの腕
    pushLegSide(L, B, T, -P.s, P.liftB, P.bob, true);    // 向こうの脚
    pushLegSide(L, B, T, P.s, P.liftA, P.bob, false);    // 手前の脚
    if (hair.mid) L.push({ test: hair.mid, tone: T.hair, group: "hairM", shine: null });

    var O = outfitOf(look);
    var torso = poly(shift(O.side, dy));
    var hem = O.hem + dy;
    L.push({ test: torso, tone: T.cloth, group: "body" });
    if (O.kind === "robe") {
      L.push({ test: all(torso, any(rect(0, 31 + dy, 64, 33 + dy), rect(0, hem - 2, 64, hem))), tone: T.trim, group: "body", sd: 1 });
    }
    var by = B.beltY + dy;
    L.push({ test: all(torso, rect(0, by, 64, by + 2.6)), tone: T.belt, group: "body", sd: 1 });
    if (look.buckle) L.push({ test: all(torso, rect(35.6, by - 0.3, 64, by + 2.9)), tone: T.buckle, group: "body", sd: 1 });

    if (A.scarf) {
      L.push({ test: ell(32.5, 33 + dy, 6.2, 2.5), tone: T.scarf, group: "scarf" });
      L.push({ test: poly([[28, 32 + dy], [28.5, 35.5 + dy], [21.5 - fl, 40 + dy], [19.5 - fl * 1.5, 37.5 + dy]]), tone: T.scarf, group: "scarf" });
    }

    pushArmSide(L, B, T, -P.s, dy, false);               // 手前の腕

    // 頭（鼻の出っぱりつき）と耳
    L.push({ test: any(ell(32.5, 20 + dy, 11.5, 12), ell(43.4, 23.4 + dy, 1.3, 1.2)), tone: T.skin, group: "head", sd: 1, takesShadow: true });
    L.push({ test: ell(31.4, 21.8 + dy, 1.8, 2.5), tone: T.skin, group: "ear", sd: 1, line: false });
    L.push({ test: rect(31, 21 + dy, 32, 23 + dy), tone: flat(T.skin.d), shade: "flat", line: false, group: "ear" });
    pushFace(L, B, T, P, dy, true, look.beard);

    L.push({ test: hair.front, tone: T.hair, group: "hair", shine: hair.shine, castShadow: true });
    L = L.concat(hairLayers(T, hair));

    if (A.glasses) L.push({ test: glassesTest([B.eyeSide], dy, true), tone: T.glasses, shade: "flat", line: false, group: "glasses" });
    if (A.band) {
      L.push({ test: all(ell(31.3, 18.5 + dy, 13.9, 13.4), rect(10, 11 + dy, 54, 14.2 + dy)), tone: T.band, group: "band", sd: 1, line: false });
      L.push({ test: any(stick(19, 13 + dy, 13.6 - fl, 20 + dy, 1.4, 1.1),
                         stick(19, 12.8 + dy, 12.2 - fl * 1.5, 16.4 + dy, 1.4, 1.1),
                         ell(18.6, 12.8 + dy, 1.8, 2)),
               tone: T.band, group: "band2", sd: 1 });
    }
    return L;
  }

  // ------------------------------------------------------------------
  // 動き
  // ------------------------------------------------------------------
  var WALK = [
    { s: 1 },
    { s: 0, liftB: 1, bob: -1 },
    { s: -1 },
    { s: 0, liftA: 1, bob: -1 }
  ];
  var IDLE = [{}, { breath: 1 }, { blink: 1 }];

  function normalize(pose, dir, walking) {
    var p = {
      s: pose.s || 0, liftA: pose.liftA || 0, liftB: pose.liftB || 0,
      bob: pose.bob || 0, breath: pose.breath || 0, blink: !!pose.blink
    };
    p.dy = p.bob + p.breath;
    if (walking) {
      p.sway = dir === "right" || dir === "left" ? 1 + 0.4 * Math.abs(p.s) : p.s * 0.8;
      p.flutter = 1 + 0.6 * Math.abs(p.s) - p.bob * 0.5;
    } else {
      p.sway = p.breath ? 0.5 : 0;
      p.flutter = p.breath ? 0.3 : 0;
    }
    return p;
  }

  // ------------------------------------------------------------------
  // 決まった色（いまの主人公の色をそのまま使う）
  // ------------------------------------------------------------------
  var DEFAULTS = {
    skin:   { base: "#f2c9a0", light: "#fbdcbc", shadow: "#d0a37e" },
    hair:   { base: "#e8b23a", light: "#f7d774", shadow: "#b07a1e" },
    cloth:  { base: "#4a7fe0", light: "#6f9ff0", shadow: "#2f4f96" },
    pants:  { base: "#34323e", light: "#4a4756", shadow: "#222029" },   // 濃い色（作者の指定。data/player.js の pantsColors の「黒」）
    shoes:  { base: "#2a3a66", light: "#3d5288", shadow: "#1a2442" },
    belt:   { base: "#8c6a2a", light: "#a8843c", shadow: "#6a4e1c" },
    buckle: { base: "#e8c34a", light: "#fff0a0", shadow: "#a8862a" },
    eye:    { base: "#2a3a6a", light: "#5a74b0", shadow: "#1a2448" },
    scarf: "#c8463a", cape: "#8a2f3a", band: "#f0f0f0", glasses: "#6a6478"
  };

  function accColor(v, fallback) {
    return (v && typeof v === "object" && v.color) ? v.color : fallback;
  }

  var CharaRig = {
    OUTLINE: OUTLINE,
    DIRS: ["down", "left", "right", "up"],
    WALK: WALK,
    IDLE: IDLE,
    HAIR_IDS: ["short", "long", "ponytail", "spiky", "bob", "slick", "medium"],
    DEFAULTS: DEFAULTS,
    tone: tone,
    mix: mix,

    /** 歩きのコマ（150ms ごと。いまの playerWalk と同じ速さ） */
    walkFrame: function (clock) { return Math.floor(clock / 150) % WALK.length; },
    /** 立ち止まりのコマ。600ms ごとに息をし、3.2 秒に1回まばたきする */
    idleFrame: function (clock) {
      if (clock % 3200 > 3000) return 2;
      return Math.floor(clock / 600) % 2;
    },

    /**
     * 選んだものから、描くための見た目を作る。
     * o.body      … "male" / "female"
     * o.hair      … 髪型のid（HAIR_IDS）
     * o.hairColor / o.cloth / o.skin / o.eye … "#rrggbb" か { base, light, shadow }
     * o.pants / o.shoes / o.belt / o.trim     … 同じ書き方（trim は長衣の縁取り。帯もこの色になる）
     * o.outfit    … "tunic"（腰まで）/ "coat"（膝まで）/ "robe"（足首まで）
     * o.build     … "broad" で肩幅を広くする
     * o.beard     … ひげの色（true なら髪と同じ色）
     * o.buckle    … false でベルトの留め金を描かない
     * o.acc       … { glasses, scarf, cape, band }。true か { color: "#rrggbb" }
     */
    makeLook: function (o) {
      o = o || {};
      var acc = o.acc || {};
      return {
        body: o.body === "female" ? "female" : "male",
        hair: HAIR[o.hair] ? o.hair : "short",
        outfit: OUTFIT[o.outfit] ? o.outfit : "tunic",
        build: o.build === "broad" ? "broad" : "normal",
        beard: !!o.beard,
        buckle: o.buckle !== false,
        acc: { glasses: !!acc.glasses, scarf: !!acc.scarf, cape: !!acc.cape, band: !!acc.band },
        tones: {
          skin: tone(o.skin || DEFAULTS.skin),
          hair: tone(o.hairColor || DEFAULTS.hair),
          cloth: tone(o.cloth || DEFAULTS.cloth),
          pants: tone(o.pants || DEFAULTS.pants),
          shoes: tone(o.shoes || DEFAULTS.shoes),
          belt: tone(o.belt || o.trim || DEFAULTS.belt),
          buckle: tone(DEFAULTS.buckle),
          trim: tone(o.trim || DEFAULTS.buckle),
          beard: tone(o.beard && o.beard !== true ? o.beard : (o.hairColor || DEFAULTS.hair)),
          eye: tone(o.eye || DEFAULTS.eye),
          scarf: tone(accColor(acc.scarf, DEFAULTS.scarf)),
          cape: tone(accColor(acc.cape, DEFAULTS.cape)),
          band: tone(accColor(acc.band, DEFAULTS.band)),
          glasses: flat(accColor(acc.glasses, DEFAULTS.glasses))
        }
      };
    },

    /**
     * 1枚描く。
     * @param {object} look  makeLook の戻り値
     * @param {string} dir   "down" / "up" / "left" / "right"
     * @param {object} pose  WALK / IDLE の1つ
     * @param {number} size  48 / 64 など
     * @param {boolean} walking 歩いているか（髪やマントのなびき方が変わる）
     * @returns {{ size: number, pixels: Array }} pixels は "#rrggbb" か null（透明）
     */
    render: function (look, dir, pose, size, walking) {
      var P = normalize(pose || {}, dir, walking);
      var layers = dir === "up" ? buildFront(look, P, true)
                 : dir === "down" ? buildFront(look, P, false)
                 : buildSide(look, P);
      var sheet = new Sheet(size, size, size / D);
      for (var i = 0; i < layers.length; i++) sheet.paint(layers[i]);
      sheet.lines();
      sheet.outline();

      var px = sheet.color;
      if (dir === "left") {
        var out = new Array(size * size);
        for (var y = 0; y < size; y++) {
          for (var x = 0; x < size; x++) out[y * size + x] = px[y * size + (size - 1 - x)];
        }
        px = out;
      }
      return { size: size, w: size, h: size, pixels: px };
    },

    /** 4方向ぶんの歩き（4コマ）と立ち止まり（3コマ）をまとめて描く */
    frames: function (look, size) {
      var out = { walk: {}, idle: {} };
      for (var d = 0; d < this.DIRS.length; d++) {
        var dir = this.DIRS[d];
        out.walk[dir] = [];
        out.idle[dir] = [];
        for (var w = 0; w < WALK.length; w++) out.walk[dir].push(this.render(look, dir, WALK[w], size, true));
        for (var k = 0; k < IDLE.length; k++) out.idle[dir].push(this.render(look, dir, IDLE[k], size, false));
      }
      return out;
    },

    /** 描いた1枚を canvas にする（scale 倍に拡大。点はぼかさない） */
    toCanvas: function (img, scale) {
      scale = scale || 1;
      var w = img.w || img.size, h = img.h || img.size, cv = document.createElement("canvas");
      cv.width = w * scale;
      cv.height = h * scale;
      var ctx = cv.getContext("2d");
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var c = img.pixels[y * w + x];
          if (!c) continue;
          ctx.fillStyle = c;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
      return cv;
    }
  };

  NS.CharaRig = CharaRig;
})(window.MyGame);
