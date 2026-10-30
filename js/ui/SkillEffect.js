/**
 * SkillEffect.js
 * 技の演出を1つ描く。状態を持たない描画だけの部品。
 *
 * 「いつ・どこで・何色で」は呼び出し側（EffectPlayer）が持ち、
 * ここは「進み具合 0〜1 を渡されたら、その瞬間の絵を描く」だけを行う。
 *
 * 形の種類は data/effects.js の shapes、色は属性の色。
 * 乱数は使わない。粒の向きは番号から決めるので、
 * 何度描いても同じ形になり、ちらつかない。
 *
 * ★ 型を増やすときは SHAPES に関数を1つ足す（他は変更不要）。
 */
(function (NS) {
  "use strict";

  /**
   * 形ごとの描き方。
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} d data/effects.js の1件
   * @param {number} t 進み具合（0〜1）
   * @param {object} p { x, y, color, coreColor, phase }
   *   phase … 0〜1。同じ技を続けて出しても同じ向きにならないためのずらし
   */
  var SHAPES = {
    /** 打つ：輪が広がり、短い線が四方へ散る */
    impact: function (ctx, d, t, p) {
      var alpha = fadeOut(t);
      var radius = (d.radius || 40) * easeOut(t);

      setAlpha(ctx, alpha);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, (d.lineWidth || 3) * (1 - t));
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      var rays = d.rays || 6;
      var length = d.rayLength || 18;
      for (var i = 0; i < rays; i++) {
        var angle = turns(i / rays + p.phase);
        var inner = radius * 0.7;
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(angle) * inner, p.y + Math.sin(angle) * inner);
        ctx.lineTo(p.x + Math.cos(angle) * (inner + length * (1 - t)),
                   p.y + Math.sin(angle) * (inner + length * (1 - t)));
        ctx.stroke();
      }

      // 当たった瞬間の芯
      if (t < 0.35) {
        setAlpha(ctx, 1 - t / 0.35);
        ctx.fillStyle = p.coreColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 * (1 - t / 0.35), 0, Math.PI * 2);
        ctx.fill();
      }
    },

    /** 斬る：太い筋が少しずつ遅れて走る */
    slash: function (ctx, d, t, p) {
      var streaks = d.streaks || 3;
      var length = d.length || 90;
      var angle = turns(d.tilt || -0.1);
      var dx = Math.cos(angle);
      var dy = Math.sin(angle);
      // 筋を並べる向き（走る向きと直角）
      var nx = -dy;
      var ny = dx;

      ctx.lineCap = "round";

      for (var i = 0; i < streaks; i++) {
        // 順番に遅れて走らせる
        var sub = span(t, i * 0.16, 0.55);
        if (sub <= 0) continue;

        var offset = (i - (streaks - 1) / 2) * (d.spread || 20);
        var cx = p.x + nx * offset;
        var cy = p.y + ny * offset;

        setAlpha(ctx, fadeOut(sub));
        ctx.strokeStyle = (sub < 0.4) ? p.coreColor : p.color;
        ctx.lineWidth = (d.thickness || 5) * (1 - sub * 0.5);

        // 端から端へ走らせる。前半は伸び、後半は根元が消えていく
        var head = easeOut(Math.min(1, sub * 1.6));
        var tail = Math.max(0, (sub - 0.45) / 0.55);
        ctx.beginPath();
        ctx.moveTo(cx + dx * length * (tail - 0.5), cy + dy * length * (tail - 0.5));
        ctx.lineTo(cx + dx * length * (head - 0.5), cy + dy * length * (head - 0.5));
        ctx.stroke();
      }
      ctx.lineCap = "butt";
    },

    /** 弾ける：中心から粒が放射状に飛ぶ */
    burst: function (ctx, d, t, p) {
      var count = d.count || 12;
      var radius = d.radius || 50;
      var reach = radius * easeOut(t);

      setAlpha(ctx, fadeOut(t));
      ctx.fillStyle = p.color;

      for (var i = 0; i < count; i++) {
        var angle = turns(i / count + p.phase);
        // 粒ごとに飛ぶ距離を変える（そろって見えないように）
        var scatter = 0.65 + wobble(i) * 0.35;
        var size = sizeOf(d, i) * (1 - t * 0.6);
        if (size <= 0) continue;

        ctx.fillRect(p.x + Math.cos(angle) * reach * scatter - size / 2,
                     p.y + Math.sin(angle) * reach * scatter - size / 2,
                     size, size);
      }

      if (t < 0.3) {
        setAlpha(ctx, 1 - t / 0.3);
        ctx.fillStyle = p.coreColor;
        var core = 8 * (1 - t / 0.3);
        ctx.fillRect(p.x - core / 2, p.y - core / 2, core, core);
      }
    },

    /**
     * 閃光：円が一気に広がって、すぐ消える。
     *
     * 他の型と違い、最初から薄れ始める（fadeOut を使わない）。
     * 消えるのが遅いと、ただの濁った円になって相手が見えなくなるため。
     */
    flash: function (ctx, d, t, p) {
      var radius = (d.radius || 60) * easeOut(t);
      var decay = (1 - t) * (1 - t);   // 最初から一気に薄れる

      setAlpha(ctx, decay * (d.alpha === undefined ? 0.45 : d.alpha));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // 内側の芯。ここだけは強く光らせて「閃いた」感じを出す
      setAlpha(ctx, Math.max(0, 1 - t * 3));
      ctx.fillStyle = p.coreColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    },

    /**
     * 光芒：閃光の一段上。大きく閃いたあと、光の筋が四方へ伸び、輪が外へ抜ける。
     *
     * 閃光（flash）と同じ「最初から薄れる」考え方だが、
     *   ・筋が伸びる（0〜0.7）
     *   ・輪が広がる（0.15〜1）
     *   ・少し遅れてもう一度小さく光る（0.35〜0.65）
     * の3つを重ねて「一発で終わらない」重さを出す。大技の中間くらいの見せ方。
     *   radius / rays / rayLength / ringRadius / alpha は data/effects.js
     */
    radiance: function (ctx, d, t, p) {
      var radius = d.radius || 90;
      var alpha = (d.alpha === undefined) ? 0.5 : d.alpha;

      // 1. 最初の閃き（flash より大きく、少しだけ長く残す）
      var decay = (1 - t) * (1 - t);
      setAlpha(ctx, decay * alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * easeOut(Math.min(1, t * 1.4)), 0, Math.PI * 2);
      ctx.fill();

      setAlpha(ctx, Math.max(0, 1 - t * 2.5));
      ctx.fillStyle = p.coreColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius * 0.38 * (1 - t * 0.5), 0, Math.PI * 2);
      ctx.fill();

      // 2. 光の筋。ゆっくり回りながら伸び、細くなって消える
      var rays = d.rays || 8;
      var length = d.rayLength || 120;
      var raySub = span(t, 0, 0.7);
      if (raySub > 0) {
        ctx.lineCap = "round";
        for (var i = 0; i < rays; i++) {
          var angle = turns(i / rays + p.phase + t * 0.04);
          // 1本おきに長さを変えて、単調な放射に見せない
          var scale = (i % 2 === 0) ? 1 : 0.62;
          var reach = length * scale * easeOut(raySub);
          setAlpha(ctx, fadeOut(raySub) * 0.9);
          ctx.strokeStyle = (raySub < 0.25) ? p.coreColor : p.color;
          ctx.lineWidth = Math.max(1, (d.rayWidth || 5) * (1 - raySub * 0.7));
          ctx.beginPath();
          ctx.moveTo(p.x + Math.cos(angle) * radius * 0.2, p.y + Math.sin(angle) * radius * 0.2);
          ctx.lineTo(p.x + Math.cos(angle) * reach, p.y + Math.sin(angle) * reach);
          ctx.stroke();
        }
        ctx.lineCap = "butt";
      }

      // 3. 外へ抜ける輪
      var ringSub = span(t, 0.15, 0.85);
      if (ringSub > 0) {
        setAlpha(ctx, fadeOut(ringSub) * 0.8);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, (d.ringWidth || 4) * (1 - ringSub));
        ctx.beginPath();
        ctx.arc(p.x, p.y, (d.ringRadius || 130) * easeOut(ringSub), 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. 遅れてもう一度、小さく光る（余韻）
      var echo = span(t, 0.35, 0.3);
      if (echo > 0) {
        setAlpha(ctx, (1 - echo) * (1 - echo) * alpha * 0.7);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.55 * easeOut(echo), 0, Math.PI * 2);
        ctx.fill();
      }
    },

    /**
     * 業火（フレイム）：弾ける（burst）の一段上。シャインの radiance と同じ考え方で、
     *   1. 大きく弾ける … 中心が強く光り、火の粉が四方へ飛ぶ
     *   2. 炎の舌 … 相手の足元から、揺れる炎が何本も立ち昇る（3つに1つは accentColor）
     *   3. 外へ抜ける輪と、少し遅れてもう一度小さく弾ける（余韻）
     *   tongues / tongueHeight / tongueWidth … 炎の数・高さ・太さ
     */
    blaze: function (ctx, d, t, p) {
      var radius = d.radius || 80;
      var accent = d.accentColor || p.coreColor;
      var i;

      // 2. 炎の舌（体の下から昇る。先に描いて、弾ける粒を手前に出す）
      var tongues = d.tongues || 7;
      var tongueH = d.tongueHeight || 90;
      var tongueW = d.tongueWidth || 18;
      for (i = 0; i < tongues; i++) {
        var ts = span(t, 0.05 + wobble(i + 3) * 0.25, 0.65);
        if (ts <= 0 || ts >= 1) continue;
        var lane = (i / (tongues - 1 || 1) - 0.5) * radius * 1.3;
        var baseY = p.y + radius * 0.45;
        var h = tongueH * (0.6 + wobble(i + 9) * 0.4) * easeOut(Math.min(1, ts * 1.8)) * (1 - ts * 0.3);
        var w = tongueW * (1 - ts * 0.5);
        var sway = Math.sin((ts * 3 + wobble(i)) * Math.PI * 2) * 6;
        setAlpha(ctx, fadeOut(ts) * 0.8);
        ctx.fillStyle = (i % 3 === 0) ? accent : p.color;
        ctx.beginPath();
        ctx.moveTo(p.x + lane - w / 2, baseY);
        ctx.quadraticCurveTo(p.x + lane - w / 2 + sway, baseY - h * 0.6, p.x + lane + sway * 1.6, baseY - h);
        ctx.quadraticCurveTo(p.x + lane + w / 2 + sway, baseY - h * 0.6, p.x + lane + w / 2, baseY);
        ctx.closePath();
        ctx.fill();
      }

      // 1. 中心の閃き
      if (t < 0.4) {
        var ft = t / 0.4;
        setAlpha(ctx, (1 - ft) * (1 - ft) * 0.6);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.7 * easeOut(ft), 0, Math.PI * 2);
        ctx.fill();
        setAlpha(ctx, 1 - ft);
        ctx.fillStyle = p.coreColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.22 * (1 - ft * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }

      // 1. 四方へ飛ぶ火の粉
      var count = d.count || 26;
      var reach = radius * easeOut(Math.min(1, t * 1.3));
      setAlpha(ctx, fadeOut(t));
      for (i = 0; i < count; i++) {
        var angle = turns(i / count + p.phase);
        var scatter = 0.6 + wobble(i) * 0.4;
        var size = sizeOf(d, i) * (1 - t * 0.6);
        if (size <= 0) continue;
        ctx.fillStyle = (i % 4 === 0) ? accent : p.color;
        ctx.fillRect(p.x + Math.cos(angle) * reach * scatter - size / 2,
                     p.y + Math.sin(angle) * reach * scatter - size / 2 - t * 18, size, size);
      }

      // 3. 外へ抜ける輪
      var ring = span(t, 0.1, 0.7);
      if (ring > 0 && ring < 1) {
        setAlpha(ctx, fadeOut(ring) * 0.8);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, (d.ringWidth || 4) * (1 - ring));
        ctx.beginPath();
        ctx.arc(p.x, p.y, (d.ringRadius || 120) * easeOut(ring), 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3. 余韻：もう一度小さく弾ける
      var echo = span(t, 0.38, 0.35);
      if (echo > 0 && echo < 1) {
        setAlpha(ctx, (1 - echo) * 0.8);
        ctx.fillStyle = accent;
        for (i = 0; i < 10; i++) {
          var ea = turns(i / 10 + p.phase + 0.05);
          var er = radius * 0.55 * easeOut(echo);
          ctx.fillRect(p.x + Math.cos(ea) * er - 3, p.y + Math.sin(ea) * er - 3, 6, 6);
        }
      }
    },

    /**
     * 大波（ウェーブ）：降りそそぐ（rain）の一段上。
     *   1. 波 … 横から相手へ、白い泡を乗せた弧が打ち寄せる（2枚目が少し遅れて続く）
     *   2. しぶき … 打ち当たったところから、粒が放物線を描いて飛び散る
     *   3. 足元の波紋 … 平たい輪が広がる
     *   waveWidth / waveHeight … 波の幅と高さ   drops … しぶきの数
     */
    surge: function (ctx, d, t, p) {
      var waveW = d.waveWidth || 150;
      var waveH = d.waveHeight || 70;
      var i;

      // 1. 波（2枚）
      ctx.lineCap = "round";
      for (var k = 0; k < 2; k++) {
        var ws = span(t, k * 0.14, 0.55);
        if (ws <= 0 || ws >= 1) continue;
        var dir = (p.phase < 0.5) ? 1 : -1;   // 左右どちらから来るかを、出すたびに変える
        // 相手の手前から、相手を越えるところまで打ち寄せる
        var cx = p.x - dir * waveW * (0.9 - 1.15 * easeOut(ws));
        var top = p.y - waveH * (0.4 + 0.6 * Math.sin(Math.min(1, ws * 1.4) * Math.PI / 2)) + ws * waveH * 0.5;
        var thick = (d.thickness || 12) * (1 - ws * 0.5) * (k === 0 ? 1 : 0.7);
        setAlpha(ctx, fadeOut(ws) * 0.85);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = thick;
        ctx.beginPath();
        ctx.moveTo(cx - dir * waveW * 0.5, p.y + waveH * 0.35);
        ctx.quadraticCurveTo(cx - dir * waveW * 0.1, top - waveH * 0.2, cx + dir * waveW * 0.35, top + waveH * 0.15);
        ctx.stroke();
        // 波頭の泡
        setAlpha(ctx, fadeOut(ws));
        ctx.strokeStyle = p.coreColor;
        ctx.lineWidth = Math.max(1, thick * 0.35);
        ctx.beginPath();
        ctx.moveTo(cx - dir * waveW * 0.05, top - waveH * 0.08);
        ctx.quadraticCurveTo(cx + dir * waveW * 0.15, top - waveH * 0.12, cx + dir * waveW * 0.35, top + waveH * 0.15);
        ctx.stroke();
      }
      ctx.lineCap = "butt";

      // 2. しぶき（波が当たってから）
      var drops = d.drops || 22;
      ctx.fillStyle = p.color;
      for (i = 0; i < drops; i++) {
        var ds = span(t, 0.3 + wobble(i + 5) * 0.15, 0.55);
        if (ds <= 0 || ds >= 1) continue;
        var ang = turns(0.75 + (wobble(i) - 0.5) * 0.45);   // 真上を中心に、扇形に広がる
        var speed = (d.splash || 90) * (0.5 + wobble(i + 11) * 0.5);
        var x = p.x + Math.cos(ang) * speed * ds;
        var y = p.y + Math.sin(ang) * speed * ds + 140 * ds * ds;
        var size = sizeOf(d, i) * (1 - ds * 0.4);
        setAlpha(ctx, fadeOut(ds));
        ctx.fillStyle = (i % 3 === 0) ? p.coreColor : p.color;
        ctx.fillRect(x - size / 2, y - size / 2, size, size * 1.3);
      }

      // 3. 足元の波紋
      var footY = p.y + (d.footY || 30);
      for (i = 0; i < 2; i++) {
        var rs = span(t, 0.3 + i * 0.15, 0.55);
        if (rs <= 0 || rs >= 1) continue;
        var r = (d.rippleRadius || 70) * easeOut(rs);
        setAlpha(ctx, fadeOut(rs) * 0.8);
        ctx.strokeStyle = (rs < 0.25) ? p.coreColor : p.color;
        ctx.lineWidth = Math.max(1, 3 * (1 - rs));
        ctx.beginPath();
        ctx.ellipse(p.x, footY, r, r * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    },

    /**
     * 岩の棘（ロックスパイク）：砕ける（shards）の一段上。
     *   1. 棘 … 相手の足元から、尖った岩が何本も突き上がり、しばらく残って崩れる
     *   2. 破片 … 突き上がった勢いで、岩のかけらが飛んで落ちる
     *   3. 土煙 … 足元に平たい輪が広がる
     *   spikes / spikeHeight / spikeWidth … 棘の数・高さ・太さ
     */
    spikes: function (ctx, d, t, p) {
      var footY = p.y + (d.footY || 34);
      var spikes = d.spikes || 5;
      var spikeH = d.spikeHeight || 80;
      var spikeW = d.spikeWidth || 20;
      var i;

      // 3. 土煙（いちばん奥）
      var dust = span(t, 0.05, 0.6);
      if (dust > 0 && dust < 1) {
        setAlpha(ctx, fadeOut(dust) * 0.5);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, footY, (d.dustRadius || 80) * easeOut(dust), 12 * (1 - dust * 0.5), 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 1. 棘。真ん中ほど高く、外側ほど低く傾く
      for (i = 0; i < spikes; i++) {
        var ss = span(t, Math.abs(i - (spikes - 1) / 2) * 0.05, 0.9);
        if (ss <= 0 || ss >= 1) continue;
        var rel = (i / (spikes - 1 || 1)) - 0.5;
        var h = spikeH * (1 - Math.abs(rel) * 0.8) * (0.85 + wobble(i) * 0.15);
        // 突き上がり（最初の2割）→ 残る → 沈みながら薄れる
        var grow = easeOut(Math.min(1, ss * 5));
        var sink = (ss > 0.6) ? (ss - 0.6) / 0.4 : 0;
        var tipH = h * grow * (1 - sink * 0.6);
        var bx = p.x + rel * (d.spread || 90);
        var lean = rel * 26;
        var w = spikeW * (1 - Math.abs(rel) * 0.3);
        setAlpha(ctx, 1 - sink);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(bx - w / 2, footY);
        ctx.lineTo(bx + lean * grow, footY - tipH);
        ctx.lineTo(bx + w / 2, footY);
        ctx.closePath();
        ctx.fill();
        // 片側を明るくして、岩の面に見せる
        setAlpha(ctx, (1 - sink) * 0.55);
        ctx.fillStyle = p.coreColor;
        ctx.beginPath();
        ctx.moveTo(bx - w / 2, footY);
        ctx.lineTo(bx + lean * grow, footY - tipH);
        ctx.lineTo(bx - w / 6, footY);
        ctx.closePath();
        ctx.fill();
      }

      // 2. 破片（突き上がった直後から飛び、落ちる）
      var count = d.count || 16;
      ctx.fillStyle = p.color;
      for (i = 0; i < count; i++) {
        var fs = span(t, 0.08 + wobble(i + 7) * 0.12, 0.7);
        if (fs <= 0 || fs >= 1) continue;
        var ang = turns(0.5 + 0.25 + (wobble(i) - 0.5) * 0.55);   // 上向きに散る
        var speed = (d.radius || 80) * (0.6 + wobble(i + 13) * 0.6);
        var x = p.x + Math.cos(ang) * speed * fs;
        var y = footY - 10 + Math.sin(ang) * speed * fs + (d.gravity || 160) * fs * fs;
        var size = sizeOf(d, i);
        setAlpha(ctx, fadeOut(fs));
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    },

    /** 降りそそぐ：上から粒が落ちてくる */
    rain: function (ctx, d, t, p) {
      var count = d.count || 14;
      var spread = d.spread || 60;
      var height = d.height || 80;

      ctx.fillStyle = p.color;

      for (var i = 0; i < count; i++) {
        // 1粒ずつ落ち始めをずらす
        var sub = span(t, wobble(i) * 0.45, 0.55);
        if (sub <= 0) continue;

        var lane = (i / (count - 1 || 1)) - 0.5;
        var x = p.x + lane * spread * 2 + wobble(i + 7) * 10 - 5;
        var y = p.y - height + height * easeIn(sub) * 1.6;
        var size = sizeOf(d, i);

        setAlpha(ctx, fadeOut(sub));
        // 落ちるものは少し縦に伸ばす
        ctx.fillRect(x - size / 2, y - size, size, size * 2.2);
      }
    },

    /**
     * 高まる（弱体では 沈む）：輪が流れ、粒が一緒に動く。
     * 当てる技と違って中心で弾けず、上下へ抜けていく形にしてある。
     *
     * direction が 1 なら下から上へ（強化）、-1 なら上から下へ（弱体）。
     * すぼまり方も向きに合わせるので、逆さにしても「沈んでいく」ように見える。
     */
    aura: function (ctx, d, t, p) {
      var rings = d.rings || 3;
      var radius = d.radius || 30;
      var rise = d.rise || 40;
      var dir = (p.direction === -1) ? -1 : 1;
      var i;

      // 流れる輪。少しずつ遅れて始まり、進むほど細くなる
      for (i = 0; i < rings; i++) {
        var sub = span(t, i * 0.18, 0.62);
        if (sub <= 0) continue;

        var y = p.y + dir * (rise * 0.5 - rise * easeOut(sub));
        // 進む先ほど小さくすぼまる
        var r = radius * (1 - sub * 0.55);

        setAlpha(ctx, fadeOut(sub) * (1 - sub * 0.4));
        ctx.strokeStyle = (sub < 0.3) ? p.coreColor : p.color;
        ctx.lineWidth = Math.max(1, (d.lineWidth || 3) * (1 - sub * 0.5));
        ctx.beginPath();
        // 平たい輪にして「面が流れていく」ように見せる
        ctx.ellipse(p.x, y, r, r * 0.34, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 一緒に流れる粒
      var count = d.count || 10;
      ctx.fillStyle = p.color;
      for (i = 0; i < count; i++) {
        var ps = span(t, wobble(i) * 0.5, 0.5);
        if (ps <= 0) continue;

        var lane = (wobble(i + 11) - 0.5) * radius * 1.8;
        var py = p.y + dir * (rise * 0.5 - rise * 1.2 * easeOut(ps));
        var size = sizeOf(d, i);

        setAlpha(ctx, fadeOut(ps));
        ctx.fillRect(p.x + lane - size / 2, py - size / 2, size, size);
      }
    },

    /**
     * 共鳴（RC-1）：技を出した本人のまわりで、力が響き合う。
     *   1. 足元から、平たい響きの輪が何重にも外へ広がる（少しずつ遅れて）
     *   2. 光の粒が本人のまわりを巡りながら、足元から頭の上へ昇る
     *   3. 出した瞬間だけ、体の中心がやわらかく光る
     * 当てる演出ではないので、中心で弾けない。色は技の属性
     *
     * ★ 奥と手前を描き分ける（data/effects.js の layered: true）。
     *   p.layer が "back" のとき … 輪の奥半分と、体の後ろを回っている粒（モンスターより先に描かれる）
     *   p.layer が "front" のとき … 輪の手前半分と、体の前を回っている粒・中心の光
     *   p.layer が無いとき       … 全部（奥と手前を分けない呼び方）
     */
    resonance: function (ctx, d, t, p) {
      var ripples = d.ripples || 3;
      var radius = d.radius || 56;
      var flatten = d.flatten || 0.38;
      var footY = p.y + (d.footY || 26);
      var drawBack = (p.layer !== "front");
      var drawFront = (p.layer !== "back");
      var i;

      // 3. 体の中心のやわらかい光（最初の4割）。体に重なって光るので手前に描く
      var glow = span(t, 0, 0.4);
      if (drawFront && glow > 0 && glow < 1) {
        setAlpha(ctx, 0.35 * (1 - glow));
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 0.45 * (0.6 + 0.4 * easeOut(glow)), 0, Math.PI * 2);
        ctx.fill();
      }

      // 1. 足元から広がる響きの輪
      for (i = 0; i < ripples; i++) {
        var sub = span(t, i * 0.2, 0.55);
        if (sub <= 0 || sub >= 1) continue;
        var r = radius * (0.25 + 0.75 * easeOut(sub));
        setAlpha(ctx, fadeOut(sub) * 0.9);
        ctx.strokeStyle = (sub < 0.2) ? p.coreColor : p.color;
        ctx.lineWidth = Math.max(1, (d.lineWidth || 3) * (1 - sub * 0.6));
        // 楕円の上半分（π〜2π）が奥、下半分（0〜π）が手前
        if (drawBack) {
          ctx.beginPath();
          ctx.ellipse(p.x, footY, r, r * flatten, 0, Math.PI, Math.PI * 2);
          ctx.stroke();
        }
        if (drawFront) {
          ctx.beginPath();
          ctx.ellipse(p.x, footY, r, r * flatten, 0, 0, Math.PI);
          ctx.stroke();
        }
      }

      // 2. まわりを巡りながら昇る光の粒
      var motes = d.motes || 8;
      var orbit = d.orbit || 30;
      var rise = d.rise || 34;
      var spin = d.turns || 1;
      ctx.fillStyle = p.color;
      for (i = 0; i < motes; i++) {
        var ms = span(t, (i % 3) * 0.08, 0.84);
        if (ms <= 0 || ms >= 1) continue;
        var angle = turns(i / motes + ms * spin + p.phase);
        // sin が負（楕円の上側）を回っている粒は体の後ろ、正なら体の前
        var behind = Math.sin(angle) < 0;
        if ((behind && !drawBack) || (!behind && !drawFront)) continue;
        var mx = p.x + Math.cos(angle) * orbit;
        var my = footY + Math.sin(angle) * orbit * flatten - rise * 1.6 * easeOut(ms);
        var size = sizeOf(d, i);
        // 出てくるときはふわっと、最後は薄れて消える
        var a = ms < 0.15 ? ms / 0.15 : fadeOut((ms - 0.15) / 0.85);
        setAlpha(ctx, a);
        ctx.fillRect(mx - size / 2, my - size / 2, size, size);
      }
    },

    /**
     * 息：中心で吐き出された煙が、左右へもくもくと広がる（どくのいき・火の息・奈落の息）。
     *
     *   1. 煙の玉 … 中心から左右へ流れながら膨らみ、薄れて消える（3つに1つは accentColor）
     *   2. 粒     … 煙の中から昇る。particle で形を選ぶ
     *                "bubble"（既定）… 輪の泡（毒）／ "spark" … 四角い火の粉（火・闇）
     *   3. 芯     … 吐き出した瞬間だけ、中心が濃く光る
     *   lift … 煙が昇る高さ（火は熱で高く昇る）
     * 並び全体に1回だけ出す型（data/skills.js の effectAt: "center"）。
     */
    miasma: function (ctx, d, t, p) {
      var spread = d.spread || 240;
      var height = d.height || 60;
      var lift = (d.lift === undefined) ? 12 : d.lift;
      var accent = d.accentColor || p.color;
      var particleColor = d.particleColor || accent;
      var i;

      // 1. 煙の玉。左右交互に振り分け、届く距離をばらけさせる
      var puffs = d.count || 16;
      for (i = 0; i < puffs; i++) {
        var sub = span(t, wobble(i) * 0.25, 0.75);
        if (sub <= 0) continue;

        var dir = (i % 2 === 0) ? 1 : -1;
        var reach = spread * (0.1 + wobble(i + 5) * 0.9);
        var x = p.x + dir * reach * easeOut(sub);
        var y = p.y + (wobble(i + 9) - 0.5) * height * easeOut(sub) - sub * lift;
        var r = sizeOf(d, i) * (0.45 + easeOut(sub) * 0.9);

        setAlpha(ctx, fadeOut(sub) * 0.42);
        ctx.fillStyle = (i % 3 === 0) ? accent : p.color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. 粒。煙が広がってから、あちこちで昇る
      var bubbles = d.bubbles || 12;
      var spark = (d.particle === "spark");
      ctx.strokeStyle = particleColor;
      ctx.fillStyle = particleColor;
      ctx.lineWidth = 1.5;
      for (i = 0; i < bubbles; i++) {
        var bs = span(t, 0.2 + wobble(i + 21) * 0.45, 0.35);
        if (bs <= 0) continue;

        var bx = p.x + (wobble(i + 31) - 0.5) * spread * 1.7;
        var by = p.y + height * 0.35 - easeOut(bs) * height;
        var br = (2 + wobble(i + 41) * 3) * (d.particleScale || 1);

        setAlpha(ctx, fadeOut(bs) * 0.9);
        if (spark) {
          // 火の粉：小さな四角が揺れながら昇り、だんだん小さくなる
          var sz = br * (1 - bs * 0.6);
          var sway = Math.sin((bs + wobble(i + 51)) * Math.PI * 4) * 4;
          ctx.fillRect(bx + sway - sz / 2, by - sz / 2, sz, sz);
        } else {
          ctx.beginPath();
          ctx.arc(bx, by, br, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 3. 吐き出した瞬間の芯
      if (t < 0.25) {
        setAlpha(ctx, (1 - t / 0.25) * 0.7);
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 22 * (0.6 + t * 1.6), 0, Math.PI * 2);
        ctx.fill();
      }
    },

    /**
     * 全体の風（ゲイル）：並び全体を、風の筋が左から右へ駆け抜ける。
     *   1. 風の筋 … 少しずつ遅れて横切る、ゆるく曲がった線
     *   2. つむじ風 … 相手ひとりずつの足元から、平たい輪が回りながら昇る
     *   3. 舞う粒 … 筋と一緒に流れながら上下に揺れる
     * 並び全体に1回だけ出す型（data/skills.js の effectAt: "center"）。相手の位置は p.points
     */
    galeSweep: function (ctx, d, t, p) {
      var spread = d.spread || 260;
      var height = d.height || 70;
      var points = pointsOf(p);
      var i, k;

      // 1. 風の筋
      var streaks = d.streaks || 9;
      ctx.lineCap = "round";
      for (i = 0; i < streaks; i++) {
        var sub = span(t, wobble(i) * 0.35, 0.55);
        if (sub <= 0 || sub >= 1) continue;
        var y = p.y + (wobble(i + 13) - 0.5) * height;
        var len = (d.streakLength || 150) * (0.6 + wobble(i + 17) * 0.4);
        var head = -spread - len + (spread * 2 + len * 2) * easeOut(sub);
        var tail = head - len;
        var bend = (wobble(i + 23) - 0.5) * 22;
        setAlpha(ctx, fadeOut(sub) * 0.85);
        ctx.strokeStyle = (i % 3 === 0) ? p.coreColor : p.color;
        ctx.lineWidth = Math.max(1, (d.thickness || 4) * (1 - sub * 0.5));
        ctx.beginPath();
        ctx.moveTo(p.x + tail, y);
        ctx.quadraticCurveTo(p.x + (head + tail) / 2, y + bend, p.x + head, y);
        ctx.stroke();
      }

      // 2. つむじ風
      var rings = d.rings || 3;
      for (k = 0; k < points.length; k++) {
        for (i = 0; i < rings; i++) {
          var rs = span(t, 0.12 + k * 0.06 + i * 0.1, 0.6);
          if (rs <= 0 || rs >= 1) continue;
          var r = (d.swirlRadius || 40) * (1 - rs * 0.4) * (1 - i * 0.15);
          var cy = points[k].y + 30 - rs * (d.rise || 60) - i * 14;
          var start = turns(rs * 1.5 + i * 0.3 + p.phase);
          setAlpha(ctx, fadeOut(rs) * 0.9);
          ctx.strokeStyle = (rs < 0.25) ? p.coreColor : p.color;
          ctx.lineWidth = Math.max(1, (d.lineWidth || 3) * (1 - rs * 0.5));
          ctx.beginPath();
          ctx.ellipse(points[k].x, cy, r, r * 0.3, 0, start, start + Math.PI * 1.4);
          ctx.stroke();
        }
      }
      ctx.lineCap = "butt";

      // 3. 舞う粒
      var count = d.count || 18;
      ctx.fillStyle = p.color;
      for (i = 0; i < count; i++) {
        var ps = span(t, 0.1 + wobble(i + 31) * 0.4, 0.5);
        if (ps <= 0 || ps >= 1) continue;
        var px = p.x - spread + spread * 2 * easeOut(ps) + (wobble(i + 37) - 0.5) * 60;
        var py = p.y + (wobble(i + 41) - 0.5) * height + Math.sin((ps + wobble(i)) * Math.PI * 3) * 10;
        var size = sizeOf(d, i);
        setAlpha(ctx, fadeOut(ps));
        ctx.fillRect(px - size / 2, py - size / 2, size, size * 0.6);
      }
    },

    /**
     * 真空の刃（しんくうは）：相手ひとりずつへ、三日月の風の刃が飛んでいって切る。
     *   1. 刃 … 左から三日月形の刃が滑ってきて、相手の上で消える（相手ごとに stagger ずつ遅れる）
     *   2. 切り口 … 刃が届いたところに、細い斜めの線が走る
     *   3. 吸い込み … 切った跡へ空気が吸い込まれる。輪と粒が外から内へ縮む（真空）
     *   travel … 刃が飛ぶ距離   bladeRadius … 刃の大きさ   pullRadius … 吸い込みの輪の大きさ
     */
    vacuumWave: function (ctx, d, t, p) {
      var points = pointsOf(p);
      var stagger = (d.stagger === undefined) ? 0.08 : d.stagger;
      var travel = d.travel || 220;
      var br = d.bladeRadius || 44;
      var pull = d.pullRadius || 60;
      var i, k;
      ctx.lineCap = "round";

      for (k = 0; k < points.length; k++) {
        var tx = points[k].x, ty = points[k].y;
        var lag = k * stagger;

        // 1. 刃（")" の形。内と外の2本で厚みを出す）
        var bs = span(t, lag, 0.36);
        if (bs > 0 && bs < 1) {
          var bx = tx - travel * (1 - easeOut(bs));
          var by = ty - 10 * (1 - bs);
          var a = (bs > 0.8) ? (1 - bs) / 0.2 : 1;
          var j;
          for (j = 0; j < 3; j++) {
            setAlpha(ctx, a * (j === 0 ? 0.95 : 0.4 - j * 0.12));
            ctx.strokeStyle = (j === 0) ? p.coreColor : p.color;
            ctx.lineWidth = (d.thickness || 7) * (1 - j * 0.3);
            ctx.beginPath();
            // 後ろに残像を2つ引く
            ctx.arc(bx - br * 0.6 - j * 26, by, br * (1 - j * 0.08), -0.95, 0.95);
            ctx.stroke();
          }
        }

        // 2. 切り口
        var cs = span(t, lag + 0.3, 0.3);
        if (cs > 0 && cs < 1) {
          var len = (d.cutLength || 100) * easeOut(Math.min(1, cs * 2));
          setAlpha(ctx, fadeOut(cs));
          ctx.strokeStyle = p.coreColor;
          ctx.lineWidth = Math.max(1, 4 * (1 - cs));
          ctx.beginPath();
          ctx.moveTo(tx - len * 0.5, ty + len * 0.22);
          ctx.lineTo(tx + len * 0.5, ty - len * 0.22);
          ctx.stroke();
        }

        // 3. 吸い込み（輪が外から内へ縮む）
        for (i = 0; i < 2; i++) {
          var ps = span(t, lag + 0.34 + i * 0.1, 0.36);
          if (ps <= 0 || ps >= 1) continue;
          var r = pull * (1 - easeIn(ps)) + 4;
          setAlpha(ctx, Math.min(1, ps * 4) * (1 - ps) * 0.9);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = d.lineWidth || 3;
          ctx.beginPath();
          ctx.ellipse(tx, ty, r, r * 0.55, -0.4, 0, Math.PI * 2);
          ctx.stroke();
        }
        var count = d.count || 8;
        ctx.fillStyle = p.color;
        for (i = 0; i < count; i++) {
          var qs = span(t, lag + 0.34 + wobble(i + k * 7) * 0.12, 0.4);
          if (qs <= 0 || qs >= 1) continue;
          var ang = turns(wobble(i + k * 11 + 5));
          var dist = pull * 1.3 * (1 - easeIn(qs));
          var size = sizeOf(d, i);
          setAlpha(ctx, fadeOut(qs));
          ctx.fillRect(tx + Math.cos(ang) * dist - size / 2, ty + Math.sin(ang) * dist * 0.6 - size / 2, size, size);
        }
      }
      ctx.lineCap = "butt";
    },

    /**
     * 稲妻斬り：斜めに一閃 → 切り口へ稲妻が落ちる → 火花が散る。
     *   1. 一閃 … 太い筋が1本、右上から左下へ走る（slash の1本ぶん）
     *   2. 稲妻 … 一閃が走り切ったところで、相手の上から切り口の真ん中へ落ちる（明滅して消える）
     *   3. 火花 … 落ちたところから、短い線が放射状に散る
     *   length / thickness / tilt … 一閃   boltAt … 稲妻が落ち始める時刻（0〜1）   height / jag … 稲妻
     */
    thunderSlash: function (ctx, d, t, p) {
      var i;
      var angle = turns(d.tilt === undefined ? 0.36 : d.tilt);
      var dx = Math.cos(angle), dy = Math.sin(angle);
      var length = d.length || 130;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // 1. 一閃
      var ss = span(t, 0, 0.42);
      if (ss > 0 && ss < 1) {
        var head = easeOut(Math.min(1, ss * 1.8));
        var tail = Math.max(0, (ss - 0.4) / 0.6);
        var layers = [[p.color, d.thickness || 10, 0.85], [p.coreColor, (d.thickness || 10) * 0.4, 1]];
        for (i = 0; i < layers.length; i++) {
          setAlpha(ctx, fadeOut(ss) * layers[i][2]);
          ctx.strokeStyle = layers[i][0];
          ctx.lineWidth = layers[i][1] * (1 - ss * 0.4);
          ctx.beginPath();
          ctx.moveTo(p.x + dx * length * (tail - 0.5), p.y + dy * length * (tail - 0.5));
          ctx.lineTo(p.x + dx * length * (head - 0.5), p.y + dy * length * (head - 0.5));
          ctx.stroke();
        }
      }

      // 2. 稲妻
      var boltAt = (d.boltAt === undefined) ? 0.3 : d.boltAt;
      var bs = span(t, boltAt, 0.5);
      if (bs > 0 && bs < 1) {
        var segs = d.segments || 6;
        var jag = d.jag || 26;
        var top = p.y - (d.height || 150);
        var reach = easeOut(Math.min(1, bs * 6));
        var vis = (bs < 0.3) ? 1 : ((Math.floor(bs * 14) % 2 === 0) ? 0.8 : 0.3) * fadeOut(bs);
        var flick = Math.floor(t * 10);
        var path = [];
        for (var s = 0; s <= segs; s++) {
          var f = s / segs;
          if (f > reach) break;
          var off = (s === 0 || s === segs) ? 0 : (wobble(s * 13 + flick * 7) - 0.5) * jag;
          path.push({ x: p.x + off, y: top + (p.y - top) * f });
        }
        if (path.length >= 2) {
          var bl = [[p.color, d.boltWidth || 7, 0.8], [p.coreColor, 2.5, 1]];
          for (i = 0; i < bl.length; i++) {
            setAlpha(ctx, vis * bl[i][2]);
            ctx.strokeStyle = bl[i][0];
            ctx.lineWidth = bl[i][1] * (1 - bs * 0.4);
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (var q = 1; q < path.length; q++) ctx.lineTo(path[q].x, path[q].y);
            ctx.stroke();
          }
        }
        // 落ちた瞬間、切り口が丸く光る
        if (reach >= 1) {
          var gl = span(bs, 0.15, 0.5);
          if (gl > 0 && gl < 1) {
            setAlpha(ctx, (1 - gl) * 0.7);
            ctx.fillStyle = p.coreColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, (d.glowRadius || 26) * (0.5 + gl * 0.8), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 3. 火花
      var sparks = d.sparks || 9;
      for (i = 0; i < sparks; i++) {
        var ks = span(t, boltAt + 0.1 + wobble(i + 5) * 0.08, 0.4);
        if (ks <= 0 || ks >= 1) continue;
        var a = turns(wobble(i + 9));
        var r0 = 10 + (d.sparkRadius || 46) * easeOut(ks) * 0.4;
        var r1 = 10 + (d.sparkRadius || 46) * easeOut(ks);
        setAlpha(ctx, fadeOut(ks));
        ctx.strokeStyle = (i % 3 === 0) ? p.coreColor : p.color;
        ctx.lineWidth = 2.5 * (1 - ks * 0.6);
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(a) * r0, p.y + Math.sin(a) * r0);
        ctx.lineTo(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1);
        ctx.stroke();
      }
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";
    },

    /**
     * 全体の闇（ダークネビュラ）：並び全体を、渦を巻く闇の雲が呑み込む。
     *   1. 雲 … 平たい楕円の上を回りながら、外から内へ縮んでいく（呑み込む）
     *   2. 沈む闇 … 相手ひとりずつに、濃い闇の玉が広がって包む
     *   3. 星 … 雲の中で、小さな光が瞬いて消える（星雲）
     *   accentColor … 雲の3つに1つと沈む闇の色（濃い闇色）  starColor … 星の色
     */
    nebula: function (ctx, d, t, p) {
      var spread = d.spread || 260;
      var height = d.height || 90;
      var accent = d.accentColor || p.color;
      var points = pointsOf(p);
      var i, k;

      // 2. 沈む闇（雲より先に描いて、雲の下に沈んで見せる）
      for (k = 0; k < points.length; k++) {
        var ds = span(t, 0.2 + k * 0.05, 0.65);
        if (ds <= 0 || ds >= 1) continue;
        var cr = (d.coreRadius || 38) * easeOut(ds);
        setAlpha(ctx, fadeOut(ds) * 0.55);
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.ellipse(points[k].x, points[k].y, cr, cr * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        setAlpha(ctx, fadeOut(ds) * 0.8);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, 3 * (1 - ds));
        ctx.beginPath();
        ctx.ellipse(points[k].x, points[k].y, cr * 1.2, cr * 1.0, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 1. 渦を巻く雲
      var puffs = d.count || 28;
      for (i = 0; i < puffs; i++) {
        var sub = span(t, wobble(i) * 0.2, 0.8);
        if (sub <= 0 || sub >= 1) continue;
        var angle = turns(i / puffs + sub * (d.turns || 0.35) + p.phase);
        var shrink = 1 - easeIn(sub) * 0.45;
        var reach = 0.55 + wobble(i + 5) * 0.45;
        var x = p.x + Math.cos(angle) * spread * reach * shrink;
        var y = p.y + Math.sin(angle) * height * 0.5 * reach * shrink;
        var r = sizeOf(d, i) * (0.5 + easeOut(Math.min(1, sub * 2)) * 0.7);
        var a = (sub < 0.2) ? sub / 0.2 : fadeOut((sub - 0.2) / 0.8);
        // 半分を濃い闇色にして、明るい泡ではなく「暗い雲」に見せる
        var dark = (i % 2 === 0);
        setAlpha(ctx, a * (dark ? 0.5 : 0.28));
        ctx.fillStyle = dark ? accent : p.color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. 星の瞬き（十字の小さな光）
      var stars = d.stars || 16;
      ctx.fillStyle = d.starColor || p.coreColor;
      for (i = 0; i < stars; i++) {
        var ss = span(t, 0.15 + wobble(i + 21) * 0.55, 0.3);
        if (ss <= 0 || ss >= 1) continue;
        var sx = p.x + (wobble(i + 27) - 0.5) * spread * 1.8;
        var sy = p.y + (wobble(i + 33) - 0.5) * height;
        var sz = (3 + wobble(i + 39) * 3) * (1 - Math.abs(ss - 0.5) * 2);
        setAlpha(ctx, 1 - Math.abs(ss - 0.5) * 2);
        ctx.fillRect(sx - sz, sy - 0.75, sz * 2, 1.5);
        ctx.fillRect(sx - 0.75, sy - sz, 1.5, sz * 2);
      }
    },

    /**
     * 全体の雷（ボルト）：相手ひとりずつに稲妻が落ち、並び全体が白く光る。
     *   1. 閃き … 落ちた瞬間、並び全体の帯が光る
     *   2. 稲妻 … 上から相手へ、ジグザグの光が少しずつ遅れて落ち、明滅して消える（枝分かれつき）
     *   3. 火花 … 落ちたところから四方へ散る
     *   height … 稲妻の長さ（相手の上どこから落ちるか）  stagger … 相手ごとの遅れ
     */
    thunderstorm: function (ctx, d, t, p) {
      var spread = d.spread || 260;
      var height = d.height || 170;
      var stagger = (d.stagger === undefined) ? 0.08 : d.stagger;
      var points = pointsOf(p);
      var i, k, s;

      // 1. 並び全体の閃き
      var flash = span(t, 0.04, 0.35);
      if (flash > 0 && flash < 1) {
        // 角のある帯だと箱に見えるので、ふちの柔らかい横長の楕円にする
        var fa = (1 - flash) * (1 - flash) * (d.alpha === undefined ? 0.3 : d.alpha);
        var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, spread);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        setAlpha(ctx, fa);
        ctx.fillStyle = grad;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(1, height * 0.45 / spread);
        ctx.translate(-p.x, -p.y);
        ctx.beginPath();
        ctx.arc(p.x, p.y, spread, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. 稲妻
      var segs = d.segments || 7;
      var jag = d.jag || 34;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (k = 0; k < points.length; k++) {
        var bs = span(t, k * stagger, 0.5);
        if (bs <= 0 || bs >= 1) continue;
        // 落ちきるまで（最初の2割）は先端が伸びる。そのあとは明滅しながら消える
        var reach = easeOut(Math.min(1, bs * 5));
        var vis = (bs < 0.3) ? 1 : ((Math.floor(bs * 14) % 2 === 0) ? 0.75 : 0.25) * fadeOut(bs);
        var flick = Math.floor(t * 10);   // 明滅のたびに少し形を変える
        var bx = points[k].x;
        var by = points[k].y;
        var top = by - height;
        var path = [];
        for (s = 0; s <= segs; s++) {
          var f = s / segs;
          if (f > reach) break;
          var off = (s === 0 || s === segs) ? 0 : (wobble(k * 31 + s + flick * 7) - 0.5) * jag;
          path.push({ x: bx + off, y: top + (by - top) * f });
        }
        if (path.length < 2) continue;

        var layers = [
          { color: p.color, width: d.boltWidth || 7, alpha: 0.8 },
          { color: p.coreColor, width: 2.5, alpha: 1 }
        ];
        for (var l = 0; l < layers.length; l++) {
          setAlpha(ctx, vis * layers[l].alpha);
          ctx.strokeStyle = layers[l].color;
          ctx.lineWidth = layers[l].width * (1 - bs * 0.4);
          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          for (s = 1; s < path.length; s++) ctx.lineTo(path[s].x, path[s].y);
          ctx.stroke();
          // 枝分かれ。真ん中あたりから斜めに短く
          var mid = path[Math.min(path.length - 1, Math.floor(segs / 2))];
          if (path.length > segs / 2 + 1) {
            var dir = (wobble(k + 61) < 0.5) ? -1 : 1;
            ctx.beginPath();
            ctx.moveTo(mid.x, mid.y);
            ctx.lineTo(mid.x + dir * jag * 0.8, mid.y + height * 0.12);
            ctx.lineTo(mid.x + dir * jag * 1.1, mid.y + height * 0.24);
            ctx.stroke();
          }
        }

        // 3. 火花（落ちきってから）
        var sp = span(bs, 0.2, 0.8);
        if (sp > 0 && sp < 1) {
          var sparks = d.sparks || 8;
          ctx.fillStyle = (sp < 0.3) ? p.coreColor : p.color;
          setAlpha(ctx, fadeOut(sp));
          for (i = 0; i < sparks; i++) {
            var ang = turns(i / sparks + p.phase + k * 0.13);
            var dist = (d.sparkRadius || 40) * easeOut(sp) * (0.6 + wobble(i + k * 5) * 0.4);
            var sz = 4 * (1 - sp * 0.6);
            ctx.fillRect(bx + Math.cos(ang) * dist - sz / 2,
                         by + Math.sin(ang) * dist * 0.6 + sp * sp * 20 - sz / 2, sz, sz);
          }
        }
      }
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";
    },

    /**
     * --- 技の大幅追加（2026-10-20）で足した型 ---
     */

    /** 交差する斬撃（二連斬り）：2本の太い筋が × の字に、少しずらして走る。交わったところが光る */
    crossSlash: function (ctx, d, t, p) {
      var length = d.length || 110;
      var thick = d.thickness || 8;
      var tilt = (d.tilt === undefined) ? 0.125 : d.tilt;
      var delay = (d.delay === undefined) ? 0.2 : d.delay;
      ctx.lineCap = "round";
      for (var i = 0; i < 2; i++) {
        var sub = span(t, i * delay, 0.55);
        if (sub <= 0 || sub >= 1) continue;
        var a = turns((i === 0 ? tilt : 0.5 - tilt) + (p.phase - 0.5) * 0.03);
        var dx = Math.cos(a), dy = Math.sin(a);
        // 先端が先に走り、尾があとから追いつく
        var head = -length / 2 + length * easeOut(Math.min(1, sub * 1.7));
        var tail = -length / 2 + length * easeIn(sub);
        var layers = [[p.color, thick], [p.coreColor, thick * 0.35]];
        for (var l = 0; l < layers.length; l++) {
          setAlpha(ctx, fadeOut(sub));
          ctx.strokeStyle = layers[l][0];
          ctx.lineWidth = Math.max(1, layers[l][1] * (1 - sub * 0.6));
          ctx.beginPath();
          ctx.moveTo(p.x + dx * tail, p.y + dy * tail);
          ctx.lineTo(p.x + dx * head, p.y + dy * head);
          ctx.stroke();
        }
      }
      ctx.lineCap = "butt";
      // 2本目が交わった瞬間の光
      var f = span(t, delay + 0.12, 0.3);
      if (f > 0 && f < 1) {
        setAlpha(ctx, 1 - f);
        ctx.fillStyle = p.coreColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 + 10 * (1 - f), 0, Math.PI * 2);
        ctx.fill();
      }
    },

    /**
     * 激突（捨て身の体当たり）：打つ（impact）の重い版。
     * 衝撃の輪が2重に広がり、中心からひびが走り、かけらが飛んで落ちる
     */
    crash: function (ctx, d, t, p) {
      var radius = d.radius || 70;
      var i;
      // 衝撃の輪
      for (i = 0; i < 2; i++) {
        var s = span(t, i * 0.12, 0.6);
        if (s <= 0 || s >= 1) continue;
        var r = radius * easeOut(s) * (1 - i * 0.2);
        setAlpha(ctx, fadeOut(s));
        ctx.strokeStyle = (i === 0) ? p.coreColor : p.color;
        ctx.lineWidth = Math.max(1, (d.lineWidth || 6) * (1 - s));
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, r, r * 0.8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // ひび。中心から折れ曲がりながら伸びる
      var cracks = d.cracks || 7;
      var cs = span(t, 0, 0.35);
      if (cs > 0) {
        setAlpha(ctx, fadeOut(t));
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        for (i = 0; i < cracks; i++) {
          var ang = turns(i / cracks + p.phase);
          var len = (d.crackLength || 48) * (0.6 + wobble(i) * 0.4) * easeOut(cs);
          var bend = (wobble(i + 7) - 0.5) * 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + Math.cos(ang) * len * 0.5, p.y + Math.sin(ang) * len * 0.5);
          ctx.lineTo(p.x + Math.cos(ang + bend) * len, p.y + Math.sin(ang + bend) * len);
          ctx.stroke();
        }
        ctx.lineJoin = "miter";
      }
      // かけら
      var count = d.count || 14;
      ctx.fillStyle = p.color;
      for (i = 0; i < count; i++) {
        var ps = span(t, 0.05, 0.9);
        var a2 = turns(i / count + p.phase + 0.03);
        var sp = (d.radius || 70) * (0.7 + wobble(i + 13) * 0.5);
        var x = p.x + Math.cos(a2) * sp * easeOut(ps);
        var y = p.y + Math.sin(a2) * sp * easeOut(ps) * 0.6 + (d.gravity || 140) * ps * ps;
        var size = sizeOf(d, i);
        setAlpha(ctx, fadeOut(ps));
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
      // 当たった瞬間の大きな芯
      if (t < 0.3) {
        setAlpha(ctx, 1 - t / 0.3);
        ctx.fillStyle = p.coreColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 16 * (1 - t / 0.3) + 4, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    /**
     * 力をためる（ちからため）：まわりから粒が体の中心へ吸い込まれ、輪がすぼまっていき、
     * 最後に体がどくんと脈打つ
     */
    gather: function (ctx, d, t, p) {
      var radius = d.radius || 84;
      var i;
      // 吸い込まれる粒（尾を引く）
      var count = d.count || 18;
      ctx.lineCap = "round";
      for (i = 0; i < count; i++) {
        var s = span(t, wobble(i) * 0.3, 0.5);
        if (s <= 0 || s >= 1) continue;
        var ang = turns(i / count + p.phase);
        var r = radius * (1 - easeIn(s));
        var r2 = r + 14 * (1 - s);
        setAlpha(ctx, (s < 0.2 ? s / 0.2 : 1) * 0.9);
        ctx.strokeStyle = (i % 3 === 0) ? p.coreColor : p.color;
        ctx.lineWidth = sizeOf(d, i) * 0.7;
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(ang) * r2, p.y + Math.sin(ang) * r2 * 0.8);
        ctx.lineTo(p.x + Math.cos(ang) * r, p.y + Math.sin(ang) * r * 0.8);
        ctx.stroke();
      }
      ctx.lineCap = "butt";
      // すぼまる輪
      var rings = d.rings || 3;
      for (i = 0; i < rings; i++) {
        var rs = span(t, i * 0.14, 0.5);
        if (rs <= 0 || rs >= 1) continue;
        var rr = radius * (1 - easeOut(rs)) + 6;
        setAlpha(ctx, rs < 0.3 ? rs / 0.3 : 1 - (rs - 0.3) / 0.7);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2 + 2 * rs;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, rr, rr * 0.8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // 脈打つ（ためきった瞬間）
      var pulse = span(t, 0.68, 0.32);
      if (pulse > 0 && pulse < 1) {
        setAlpha(ctx, (1 - pulse) * 0.8);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10 + 26 * easeOut(pulse), 0, Math.PI * 2);
        ctx.fill();
        setAlpha(ctx, 1 - pulse);
        ctx.fillStyle = p.coreColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8 * (1 - pulse) + 3, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    /**
     * 守りを砕く（鎧くずし）：相手の前に六角の盾が浮かび、ひびが入って、かけらになって落ちる。
     * 色は下がる能力（防御の青。data/effects.js の statColors）
     */
    shatter: function (ctx, d, t, p) {
      var R = d.radius || 46;
      var sides = 6;
      var i;
      var appear = span(t, 0, 0.28);
      var brk = span(t, 0.32, 0.68);
      // 当たった瞬間の芯
      if (t < 0.22) {
        setAlpha(ctx, 1 - t / 0.22);
        ctx.fillStyle = p.coreColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12 * (1 - t / 0.22) + 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (brk <= 0) {
        // 盾が現れ、ひびが走る
        var scale = 0.8 + 0.2 * easeOut(appear);
        setAlpha(ctx, appear * 0.25);
        ctx.fillStyle = p.color;
        polygonPath(ctx, p.x, p.y, R * scale, sides, 0, 1);
        ctx.fill();
        setAlpha(ctx, appear);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        polygonPath(ctx, p.x, p.y, R * scale, sides, 0, 1);
        ctx.stroke();
        var crack = span(t, 0.16, 0.16);
        if (crack > 0) {
          ctx.strokeStyle = p.coreColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x - R * 0.5 * crack, p.y - R * 0.7 * crack);
          ctx.lineTo(p.x + 4, p.y - 4);
          ctx.lineTo(p.x - 6, p.y + 8);
          ctx.lineTo(p.x + R * 0.4 * crack, p.y + R * 0.75 * crack);
          ctx.stroke();
        }
        return;
      }
      // かけら。六角を6枚の三角に分けて、外へ飛ばしながら落とす
      for (i = 0; i < sides; i++) {
        var a0 = turns(i / sides), a1 = turns((i + 1) / sides), am = (a0 + a1) / 2;
        var fly = (d.fly || 40) * easeOut(brk) * (0.7 + wobble(i) * 0.6);
        var ox = Math.cos(am) * fly;
        var oy = Math.sin(am) * fly * 0.6 + (d.gravity || 120) * brk * brk;
        var rot = (wobble(i + 5) - 0.5) * 2.4 * brk;
        ctx.save();
        ctx.translate(p.x + ox, p.y + oy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a0) * R * 0.92, Math.sin(a0) * R * 0.92);
        ctx.lineTo(Math.cos(a1) * R * 0.92, Math.sin(a1) * R * 0.92);
        ctx.closePath();
        setAlpha(ctx, fadeOut(brk) * 0.3);
        ctx.fillStyle = p.color;
        ctx.fill();
        setAlpha(ctx, fadeOut(brk));
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    },

    /**
     * 針（しびれ針）：細い針が横から突き刺さり、刺さったところから小さな稲妻が散る
     */
    needle: function (ctx, d, t, p) {
      var len = d.length || 70;
      var thrust = span(t, 0, 0.25);
      var i;
      // 針（刺さったら少し残って消える）
      if (t < 0.55) {
        var tipX = p.x - 12 + 12 * easeOut(thrust);
        var tailX = tipX - len * (0.4 + 0.6 * (1 - easeOut(thrust)) * 0.5);
        setAlpha(ctx, t < 0.4 ? 1 : 1 - (t - 0.4) / 0.15);
        ctx.strokeStyle = p.coreColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(tailX - len * (1 - easeOut(thrust)), p.y - 4);
        ctx.lineTo(tipX, p.y);
        ctx.stroke();
      }
      // 刺さったところから散る小さな稲妻
      var sparks = d.sparks || 6;
      var ss = span(t, 0.2, 0.8);
      if (ss <= 0) return;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      for (i = 0; i < sparks; i++) {
        var flick = (Math.floor(ss * 12 + i) % 3 === 0) ? 0.3 : 1;
        var ang = turns(i / sparks + p.phase);
        var r0 = 6 + 20 * easeOut(ss);
        var seg = (d.sparkLength || 16) * (1 - ss * 0.5);
        var x0 = p.x + Math.cos(ang) * r0, y0 = p.y + Math.sin(ang) * r0;
        var nx = -Math.sin(ang), ny = Math.cos(ang);
        setAlpha(ctx, fadeOut(ss) * flick);
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + Math.cos(ang) * seg * 0.5 + nx * 5, y0 + Math.sin(ang) * seg * 0.5 + ny * 5);
        ctx.lineTo(x0 + Math.cos(ang) * seg * 0.6 - nx * 4, y0 + Math.sin(ang) * seg * 0.6 - ny * 4);
        ctx.lineTo(x0 + Math.cos(ang) * seg, y0 + Math.sin(ang) * seg);
        ctx.stroke();
      }
      ctx.lineJoin = "miter";
    },

    /**
     * 守りの障壁（シールド・堅守の陣）：体のまわりに六角の障壁が立ち上がり、光の帯が斜めに走って、
     * 薄れながら消える
     */
    barrier: function (ctx, d, t, p) {
      var R = d.radius || 52;
      var grow = span(t, 0, 0.3);
      var scale = 0.65 + 0.35 * easeOut(grow);
      var a = (t < 0.3) ? grow : fadeOut((t - 0.3) / 0.7);
      var i;
      // 面（ごく薄く）
      setAlpha(ctx, a * 0.18);
      ctx.fillStyle = p.color;
      polygonPath(ctx, p.x, p.y, R * scale, 6, turns(1 / 12), 1.15);
      ctx.fill();
      // ふち（二重）
      for (i = 0; i < 2; i++) {
        setAlpha(ctx, a * (i === 0 ? 1 : 0.5));
        ctx.strokeStyle = (i === 0) ? p.color : p.coreColor;
        ctx.lineWidth = (i === 0) ? 3 : 1.5;
        polygonPath(ctx, p.x, p.y, R * scale * (1 - i * 0.12), 6, turns(1 / 12), 1.15);
        ctx.stroke();
      }
      // 光の帯（障壁の中を斜めに走る）
      var sweep = span(t, 0.25, 0.4);
      if (sweep > 0 && sweep < 1) {
        ctx.save();
        polygonPath(ctx, p.x, p.y, R * scale, 6, turns(1 / 12), 1.15);
        ctx.clip();
        var sx = p.x - R * 1.4 + R * 2.8 * easeOut(sweep);
        setAlpha(ctx, (1 - sweep) * 0.7);
        ctx.strokeStyle = p.coreColor;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(sx - 20, p.y + R * 1.3);
        ctx.lineTo(sx + 20, p.y - R * 1.3);
        ctx.stroke();
        ctx.restore();
      }
      // 角に灯る光
      var corner = span(t, 0.2, 0.5);
      if (corner > 0 && corner < 1) {
        ctx.fillStyle = p.coreColor;
        for (i = 0; i < 6; i++) {
          var ang = turns(i / 6 + 1 / 12);
          setAlpha(ctx, (1 - Math.abs(corner - 0.5) * 2) * a);
          ctx.fillRect(p.x + Math.cos(ang) * R * scale - 2.5, p.y + Math.sin(ang) * R * scale * 1.15 - 2.5, 5, 5);
        }
      }
    },

    /**
     * 奮い立つ（ブレイブ・鼓舞の舞）：足元に輪が広がり、矢じりの形（＾）が何列も昇っていく
     */
    rally: function (ctx, d, t, p) {
      var i;
      var rise = d.rise || 70;
      // 足元の輪
      var gs = span(t, 0, 0.5);
      if (gs > 0 && gs < 1) {
        var gr = (d.radius || 40) * easeOut(gs);
        setAlpha(ctx, 1 - gs);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 34, gr, gr * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // 昇る矢じり
      var count = d.count || 9;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (i = 0; i < count; i++) {
        var s = span(t, (i % 3) * 0.1 + Math.floor(i / 3) * 0.16, 0.5);
        if (s <= 0 || s >= 1) continue;
        var lane = ((i % 3) - 1) * (d.laneGap || 22) + (wobble(i) - 0.5) * 6;
        var y = p.y + 30 - rise * easeOut(s);
        var w = (d.chevron || 9) * (1 - s * 0.3);
        setAlpha(ctx, fadeOut(s));
        ctx.strokeStyle = (s < 0.25) ? p.coreColor : p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x + lane - w, y + w * 0.8);
        ctx.lineTo(p.x + lane, y);
        ctx.lineTo(p.x + lane + w, y + w * 0.8);
        ctx.stroke();
      }
      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";
    },

    /**
     * 疾く（ヘイスト）：体のまわりを、横向きの速い筋が右から左へ何本も駆け抜け、足元で輪が回る
     */
    haste: function (ctx, d, t, p) {
      var i;
      var count = d.streaks || 8;
      var width = d.width || 120;
      ctx.lineCap = "round";
      for (i = 0; i < count; i++) {
        var s = span(t, wobble(i) * 0.4, 0.4);
        if (s <= 0 || s >= 1) continue;
        var y = p.y + (wobble(i + 3) - 0.5) * (d.height || 70);
        var len = 30 + wobble(i + 9) * 30;
        var head = p.x + width / 2 - width * easeOut(s);
        setAlpha(ctx, fadeOut(s) * 0.9);
        ctx.strokeStyle = (i % 3 === 0) ? p.coreColor : p.color;
        ctx.lineWidth = 2 + wobble(i + 5) * 2;
        ctx.beginPath();
        ctx.moveTo(head, y);
        ctx.lineTo(head + len, y);
        ctx.stroke();
      }
      ctx.lineCap = "butt";
      // 足元で回る輪
      var rs = span(t, 0.1, 0.8);
      if (rs > 0 && rs < 1) {
        var start = turns(rs * 2 + p.phase);
        setAlpha(ctx, fadeOut(rs));
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 30, d.radius || 36, (d.radius || 36) * 0.3, 0, start, start + Math.PI * 1.3);
        ctx.stroke();
      }
    },

    /**
     * 咆哮（ハウリング・威圧の咆哮）：中心から、平たい音の輪が何重にも広がる。
     * 輪のふちに小さなとげを付けて、ただの波紋より荒々しく見せる。
     *   radius / flatten … どこまで広がるか・つぶれ具合（威圧の咆哮は並び全体に届くよう大きく）
     */
    roar: function (ctx, d, t, p) {
      var waves = d.waves || 4;
      var radius = d.radius || 80;
      var flatten = (d.flatten === undefined) ? 0.7 : d.flatten;
      var spikes = d.spikes || 14;
      var i, k;
      for (i = 0; i < waves; i++) {
        var s = span(t, i * 0.12, 0.6);
        if (s <= 0 || s >= 1) continue;
        var r = radius * easeOut(s);
        setAlpha(ctx, fadeOut(s) * (1 - i * 0.12));
        ctx.strokeStyle = (s < 0.2) ? p.coreColor : p.color;
        ctx.lineWidth = Math.max(1, (d.lineWidth || 5) * (1 - s * 0.7));
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, r, r * flatten, 0, 0, Math.PI * 2);
        ctx.stroke();
        // ふちのとげ
        ctx.beginPath();
        for (k = 0; k < spikes; k++) {
          var ang = turns(k / spikes + i * 0.03 + p.phase);
          var cx = Math.cos(ang), cy = Math.sin(ang);
          ctx.moveTo(p.x + cx * r, p.y + cy * r * flatten);
          ctx.lineTo(p.x + cx * (r + 10 * (1 - s)), p.y + cy * (r + 10 * (1 - s)) * flatten);
        }
        ctx.stroke();
      }
    },

    /**
     * ベール（〇〇ベール）：上から光の幕が降りて体を包み、ゆらめいてから、粒になって消える。
     * 色は守る属性の色（data/effects.js で属性ごとに7つ書いてある）
     */
    veil: function (ctx, d, t, p) {
      var w = d.width || 64;
      var h = d.height || 92;
      var strips = d.strips || 7;
      var drop = easeOut(span(t, 0, 0.35));
      var a = (t < 0.35) ? drop : fadeOut((t - 0.35) / 0.65);
      var i;
      var top = p.y - h / 2 - 20 * (1 - drop);
      var bottom = top + h * drop;
      // 幕。縦の帯を並べ、それぞれゆらめかせる
      for (i = 0; i < strips; i++) {
        var f = i / (strips - 1);
        var x = p.x - w / 2 + w * f;
        var sway = Math.sin(turns(t * 1.5 + f * 0.8 + p.phase)) * 5;
        // 端ほど薄く、真ん中ほど濃い（丸い幕に見せる）
        var edge = 1 - Math.abs(f - 0.5) * 1.2;
        setAlpha(ctx, a * 0.35 * edge);
        ctx.strokeStyle = (i % 2 === 0) ? p.color : p.coreColor;
        ctx.lineWidth = (i % 2 === 0) ? 7 : 2;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.quadraticCurveTo(x + sway, (top + bottom) / 2, x - sway * 0.5, bottom);
        ctx.stroke();
      }
      // 幕のふち（上の弧）
      setAlpha(ctx, a * 0.9);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(p.x, top, w / 2 + 4, 10, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      // 消えぎわの粒（幕のあたりから昇る）
      var count = d.count || 12;
      ctx.fillStyle = p.color;
      for (i = 0; i < count; i++) {
        var s = span(t, 0.45 + wobble(i) * 0.25, 0.3);
        if (s <= 0 || s >= 1) continue;
        var px = p.x + (wobble(i + 4) - 0.5) * w;
        var py = p.y + (wobble(i + 8) - 0.5) * h * 0.8 - 24 * s;
        var size = sizeOf(d, i);
        setAlpha(ctx, 1 - s);
        ctx.fillRect(px - size / 2, py - size / 2, size, size);
      }
    },

    /**
     * 封じの輪（サイレス）：体のまわりに印の付いた輪が浮かび、回りながら締まって、× の字で閉じる
     */
    sealRing: function (ctx, d, t, p) {
      var R = d.radius || 58;
      var marks = d.marks || 8;
      var close = span(t, 0, 0.55);
      var r = R * (1 - 0.45 * easeIn(close));
      var a = (t < 0.15) ? t / 0.15 : fadeOut(t);
      var rot = turns(close * 0.5 + p.phase);
      var i;
      setAlpha(ctx, a);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, r, r * 0.85, 0, 0, Math.PI * 2);
      ctx.stroke();
      // 輪の上の印（小さなひし形）
      ctx.fillStyle = p.coreColor;
      for (i = 0; i < marks; i++) {
        var ang = rot + turns(i / marks);
        var mx = p.x + Math.cos(ang) * r, my = p.y + Math.sin(ang) * r * 0.85;
        ctx.beginPath();
        ctx.moveTo(mx, my - 5);
        ctx.lineTo(mx + 4, my);
        ctx.lineTo(mx, my + 5);
        ctx.lineTo(mx - 4, my);
        ctx.closePath();
        ctx.fill();
      }
      // 締まりきったら × で閉じる
      var x = span(t, 0.5, 0.5);
      if (x > 0 && x < 1) {
        var s = 22 * easeOut(Math.min(1, x * 3));
        setAlpha(ctx, fadeOut(x));
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x - s, p.y - s);
        ctx.lineTo(p.x + s, p.y + s);
        ctx.moveTo(p.x + s, p.y - s);
        ctx.lineTo(p.x - s, p.y + s);
        ctx.stroke();
        ctx.lineCap = "butt";
      }
    },

    /**
     * 呪いの印（不吉な舞）：頭の上に暗い輪が浮かび、そこから細い影がしたたり落ち、
     * 体のまわりを黒い靄が巻きながら沈んでいく
     */
    hex: function (ctx, d, t, p) {
      var i;
      var accent = d.accentColor || p.color;
      var headY = p.y - (d.headOffset || 46);
      // 頭の上の輪
      var rs = span(t, 0, 0.4);
      var ra = (t < 0.4) ? rs : fadeOut((t - 0.4) / 0.6);
      setAlpha(ctx, ra);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(p.x, headY, 22 * (0.6 + 0.4 * easeOut(rs)), 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      // したたる影
      var drips = d.drips || 7;
      for (i = 0; i < drips; i++) {
        var s = span(t, 0.2 + wobble(i) * 0.35, 0.45);
        if (s <= 0 || s >= 1) continue;
        var x = p.x + (wobble(i + 3) - 0.5) * 36;
        var y = headY + 4 + easeIn(s) * (d.fall || 80);
        setAlpha(ctx, fadeOut(s));
        ctx.fillStyle = (i % 2 === 0) ? p.color : accent;
        ctx.fillRect(x - 2, y - 6, 4, 10);
      }
      // 巻きながら沈む靄
      var puffs = d.count || 12;
      for (i = 0; i < puffs; i++) {
        var ps = span(t, 0.15 + wobble(i + 11) * 0.3, 0.55);
        if (ps <= 0 || ps >= 1) continue;
        var ang = turns(i / puffs + ps * 0.6 + p.phase);
        var px = p.x + Math.cos(ang) * 40;
        var py = p.y - 20 + ps * 50 + Math.sin(ang) * 10;
        setAlpha(ctx, fadeOut(ps) * 0.4);
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(px, py, sizeOf(d, i), 0, Math.PI * 2);
        ctx.fill();
      }
    },

    /**
     * 清め（ディンド・リカバー）：やわらかい光がふくらみ、十字のきらめきが体のまわりで瞬きながら昇る
     */
    sparkle: function (ctx, d, t, p) {
      var i;
      var glowS = span(t, 0, 0.6);
      if (glowS > 0 && glowS < 1) {
        var gr = (d.radius || 44) * (0.5 + 0.5 * easeOut(glowS));
        var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gr);
        grad.addColorStop(0, p.coreColor);
        grad.addColorStop(0.4, p.color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        setAlpha(ctx, (1 - glowS) * (d.alpha || 0.5));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, gr, 0, Math.PI * 2);
        ctx.fill();
      }
      var stars = d.stars || 10;
      for (i = 0; i < stars; i++) {
        var s = span(t, wobble(i) * 0.45, 0.5);
        if (s <= 0 || s >= 1) continue;
        var x = p.x + (wobble(i + 5) - 0.5) * (d.spread || 70);
        var y = p.y + 24 - (wobble(i + 9) * 30 + 40 * easeOut(s));
        var tw = 1 - Math.abs(s - 0.5) * 2;
        var sz = (3 + wobble(i + 2) * 4) * tw;
        setAlpha(ctx, tw);
        ctx.fillStyle = (i % 2 === 0) ? p.coreColor : p.color;
        ctx.fillRect(x - sz, y - 1, sz * 2, 2);
        ctx.fillRect(x - 1, y - sz, 2, sz * 2);
      }
    },

    /**
     * まとわりつく（足止めの舞）：細い帯が何本も体のまわりを巻きながら締まっていき、
     * 足元へずり落ちて重りのように沈む。足元に重い輪が残る
     *   ribbons … 巻く帯の数   turns … 何周巻くか   radius / height … 巻く大きさ
     */
    entangle: function (ctx, d, t, p) {
      var ribbons = d.ribbons || 3;
      var radius = d.radius || 44;
      var height = d.height || 70;
      var wraps = d.turns || 1.6;
      var steps = 28;
      var i, k;
      ctx.lineCap = "round";
      for (i = 0; i < ribbons; i++) {
        var s = span(t, i * 0.1, 0.75);
        if (s <= 0 || s >= 1) continue;
        // 巻きつく長さが伸び、輪が締まり、全体が下へずり落ちる
        var grow = easeOut(Math.min(1, s * 1.8));
        var tight = 1 - 0.35 * easeIn(s);
        var sink = 18 * easeIn(s);
        var start = turns(i / ribbons + p.phase);
        setAlpha(ctx, fadeOut(s) * 0.9);
        ctx.strokeStyle = (i % 2 === 0) ? p.color : p.coreColor;
        ctx.lineWidth = (i % 2 === 0) ? 4 : 2;
        ctx.beginPath();
        for (k = 0; k <= steps; k++) {
          var f = (k / steps) * grow;
          var ang = start + turns(f * wraps);
          var x = p.x + Math.cos(ang) * radius * tight;
          // 上から下へ巻き下ろす。奥（sin が負）を少し上げて楕円の帯に見せる
          var y = p.y - height / 2 + height * f + Math.sin(ang) * radius * 0.28 * tight + sink;
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.lineCap = "butt";
      // 足元の重い輪（締まりきったあたりから）
      var g = span(t, 0.45, 0.55);
      if (g > 0 && g < 1) {
        var gr = (d.groundRadius || 40) * (1 - 0.2 * easeOut(g));
        setAlpha(ctx, (1 - g) * 0.9);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4 * (1 - g * 0.5);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + height / 2 + 6, gr, gr * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // こぼれ落ちる粒
      var count = d.count || 8;
      ctx.fillStyle = p.color;
      for (i = 0; i < count; i++) {
        var ps = span(t, 0.3 + wobble(i) * 0.4, 0.35);
        if (ps <= 0 || ps >= 1) continue;
        var px = p.x + (wobble(i + 3) - 0.5) * radius * 1.6;
        var py = p.y + easeIn(ps) * height * 0.7;
        var size = sizeOf(d, i);
        setAlpha(ctx, 1 - ps);
        ctx.fillRect(px - size / 2, py - size / 2, size, size * 1.6);
      }
    },

    /**
     * 気力を抜かれる（ミステリーダンス）：体の中心から光の玉がいくつも、渦を巻きながら外へ抜け出して消える。
     * 頭の上では小さな星がくるくる回る（目が回る感じ）。玉は色を交互にして、不思議な踊りらしくする
     *   count / radius / turns … 抜ける玉の数・どこまで離れるか・何周回るか   stars … 頭の上の星
     */
    mystery: function (ctx, d, t, p) {
      var count = d.count || 12;
      var radius = d.radius || 70;
      var accent = d.accentColor || p.coreColor;
      var i;
      // 抜け出す玉（尾を引く）
      for (i = 0; i < count; i++) {
        var s = span(t, wobble(i) * 0.35, 0.6);
        if (s <= 0 || s >= 1) continue;
        var dir = (i % 2 === 0) ? 1 : -1;
        var base = turns(i / count + p.phase);
        for (var trail = 2; trail >= 0; trail--) {
          var ts = Math.max(0, s - trail * 0.05);
          var ang = base + dir * turns(ts * (d.turns || 1.2));
          var r = radius * easeOut(ts);
          var x = p.x + Math.cos(ang) * r;
          var y = p.y + Math.sin(ang) * r * 0.7 - ts * 20;
          var size = sizeOf(d, i) * (1 - ts * 0.5) * (1 - trail * 0.25);
          setAlpha(ctx, fadeOut(s) * (1 - trail * 0.35));
          ctx.fillStyle = (i % 3 === 0) ? p.coreColor : ((i % 3 === 1) ? p.color : accent);
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // 頭の上で回る星
      var ss = span(t, 0.2, 0.8);
      if (ss > 0 && ss < 1) {
        var stars = d.stars || 5;
        var headY = p.y - (d.headOffset || 44);
        ctx.fillStyle = accent;
        for (i = 0; i < stars; i++) {
          var a = turns(i / stars + ss * 1.5);
          var sx = p.x + Math.cos(a) * 22;
          var sy = headY + Math.sin(a) * 6;
          var sz = 4 + (Math.sin(a) + 1) * 1.5;   // 手前ほど大きく
          setAlpha(ctx, fadeOut(ss));
          ctx.fillRect(sx - sz, sy - 1, sz * 2, 2);
          ctx.fillRect(sx - 1, sy - sz, 2, sz * 2);
        }
      }
      // はじめに、体の中心がふっと光る
      if (t < 0.25) {
        setAlpha(ctx, (1 - t / 0.25) * 0.6);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 18 + 20 * t, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    /**
     * 死神の鎌（2026-10-21 に作り直した）。当たった瞬間から、次の順に重なって起きる。
     *   1. 刃の軌跡（0〜0.24）… 太い三日月が相手の上から右下へ、体を横切って走る。少し遅れて残像が2枚ついてくる。
     *                            三日月の外側に、ぼやけた太い帯（振りの風圧）が一緒に流れる
     *   2. 閃き（0.08〜0.3）   … 白い芯が一瞬はじけ、すぐ赤黒い光に変わって広がる
     *   3. 裂け目（0.16〜0.62）… 相手の体を斜めに横切る赤い一本線が走り、太くなってから上下に割れて離れていく
     *   4. 魂（0.24〜0.96）    … 青白い魂がいくつも、ゆらゆら揺れながら相手から抜けて昇っていく
     *   5. 黒い粒（0.18〜0.8） … 軌跡に沿って黒い羽根のような粒が舞い、落ちる
     *   6. 波紋（0.32〜0.92）  … 足元から赤黒い輪が、地面を這うように広がって消える
     *   radius … 刃の軌跡の大きさ   width … いちばん太いところ   accentColor … 裂け目・閃き・波紋の色
     *   soulColor … 魂の色   souls … 魂の数
     */
    reap: function (ctx, d, t, p) {
      var R = d.radius || 78;
      var width = d.width || 18;
      var accent = d.accentColor || p.color;
      // 軌跡の円の中心は相手の右上、ちょうど半径ぶん離れたところ。弧の真ん中が相手の体を横切る
      var cx = p.x + R * 0.7, cy = p.y - R * 0.7;
      var a0 = Math.PI * 0.88, a1 = Math.PI * 1.62;   // 左上 → 相手 → 下へ回る角度（真ん中 1.25π が相手）
      var i, k;

      // 三日月を塗りで描く。外側の弧（R + 太さ/2）と内側の弧（R - 太さ/2）で囲み、真ん中ほど太い。
      // progress … 0〜1 のどこまで走ったか（先端だけが伸びていく）
      function crescentPath(progress, widthScale) {
        var steps = 30, s, f, ang, w;
        ctx.beginPath();
        for (s = 0; s <= steps; s++) {
          f = (s / steps) * progress;
          ang = a0 + (a1 - a0) * f;
          w = (width * Math.sin(Math.PI * f) + 1) * widthScale;
          var ox = cx + Math.cos(ang) * (R + w / 2), oy = cy - Math.sin(ang) * (R + w / 2);
          if (s === 0) ctx.moveTo(ox, oy); else ctx.lineTo(ox, oy);
        }
        for (s = steps; s >= 0; s--) {
          f = (s / steps) * progress;
          ang = a0 + (a1 - a0) * f;
          w = (width * Math.sin(Math.PI * f) + 1) * widthScale;
          ctx.lineTo(cx + Math.cos(ang) * (R - w / 2), cy - Math.sin(ang) * (R - w / 2));
        }
        ctx.closePath();
      }
      function crescent(progress, alphaScale, widthScale, color) {
        if (progress <= 0) return;
        setAlpha(ctx, alphaScale);
        ctx.fillStyle = color || p.color;
        crescentPath(progress, widthScale);
        ctx.fill();
        // 刃の芯（白く細く）
        if (!color) {
          ctx.fillStyle = p.coreColor;
          crescentPath(progress, widthScale * 0.35);
          ctx.fill();
        }
      }

      // 1. 刃の軌跡：風圧の帯 → 残像2枚 → 本体。
      //    走り終えた三日月は、裂け目が出るまでしばらく残してから薄れる（作者の指定：三日月の時間を長く）
      var holdEnd = (d.crescentHold === undefined) ? 0.4 : d.crescentHold;
      var sweep = easeOut(span(t, 0, 0.2));
      var fade = 1 - span(t, holdEnd, 0.18);
      if (fade > 0) {
        // 風圧の帯（三日月の少し外側を、太く薄く）
        if (sweep > 0) {
          setAlpha(ctx, 0.18 * fade);
          ctx.fillStyle = p.color;
          crescentPath(sweep, 2.8);
          ctx.fill();
        }
        crescent(easeOut(span(t, 0.05, 0.2)) , 0.25 * fade, 0.8, accent);   // 残像（遅れて赤く）
        crescent(easeOut(span(t, 0.025, 0.2)), 0.45 * fade, 0.9);
        crescent(sweep, fade, 1);
      }

      // 2. 閃き：白い芯 → 赤黒い光
      var flash = span(t, 0.08, 0.22);
      if (flash > 0 && flash < 1) {
        var fr = (d.flashRadius || 70) * easeOut(flash);
        var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, fr);
        grad.addColorStop(0, flash < 0.3 ? p.coreColor : accent);
        grad.addColorStop(0.45, accent);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        setAlpha(ctx, (1 - flash) * 0.85);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, fr, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. 裂け目：体を斜めに横切る線が走り、太くなってから上下に割れて離れる。
      //    三日月が走り終えてから一拍おいて出す（作者の指定：赤い斬撃までの時間を長く。cutAt）
      var cutAt = (d.cutAt === undefined) ? 0.16 : d.cutAt;
      var cut = span(t, cutAt, 0.4);
      if (cut > 0 && cut < 1) {
        var len = (d.cutLength || 90);
        // 刃が相手を通り過ぎた向き（弧の接線。左上 → 右下）に沿って切れる
        var dirX = Math.cos(Math.PI * 0.25), dirY = Math.sin(Math.PI * 0.25);
        var nx = -dirY, ny = dirX;                                           // 線に直角
        var run = easeOut(Math.min(1, cut * 3));                             // 走る（最初の1/3）
        var split = easeIn(span(cut, 0.4, 0.6)) * 9;                         // 割れて離れる
        var thick = 2 + 5 * Math.sin(Math.PI * Math.min(1, cut * 1.6));
        for (k = -1; k <= 1; k += 2) {
          var ox = nx * split * k, oy = ny * split * k;
          setAlpha(ctx, 1 - easeIn(cut));
          ctx.strokeStyle = accent;
          ctx.lineWidth = split > 0.5 ? thick * 0.6 : thick;
          ctx.beginPath();
          ctx.moveTo(p.x - dirX * len / 2 + ox, p.y - dirY * len / 2 + oy);
          ctx.lineTo(p.x - dirX * len / 2 + dirX * len * run + ox, p.y - dirY * len / 2 + dirY * len * run + oy);
          ctx.stroke();
          if (split <= 0.5) break;   // 割れる前は1本だけ
        }
        // 割れ目の芯（白く細く）
        if (cut < 0.45) {
          setAlpha(ctx, 1 - cut * 2);
          ctx.strokeStyle = p.coreColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x - dirX * len / 2, p.y - dirY * len / 2);
          ctx.lineTo(p.x - dirX * len / 2 + dirX * len * run, p.y - dirY * len / 2 + dirY * len * run);
          ctx.stroke();
        }
      }

      // 4. 魂：青白い玉が尾を引きながら、ゆらゆら昇る
      var souls = d.souls || 6;
      var soulColor = d.soulColor || "#bfe0ff";
      for (i = 0; i < souls; i++) {
        // 魂は裂け目が入ってから抜けていく
        var ss = span(t, cutAt + 0.08 + wobble(i + 50) * 0.18, 0.45);
        if (ss <= 0 || ss >= 1) continue;
        var baseX = p.x + (wobble(i + 60) - 0.5) * 50;
        for (k = 0; k < 4; k++) {
          var st = Math.max(0, ss - k * 0.04);
          var sx = baseX + Math.sin((st * 3 + wobble(i)) * Math.PI * 2) * 8;
          var sy = p.y + 10 - st * (d.soulRise || 90);
          var sr = (4.5 - k) * (1 - st * 0.5);
          if (sr <= 0) continue;
          setAlpha(ctx, (1 - st) * (k === 0 ? 0.9 : 0.35));
          ctx.fillStyle = soulColor;
          ctx.beginPath();
          ctx.arc(sx, sy, sr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. 黒い粒（羽根）：軌跡に沿って舞い、ひらひら落ちる
      var count = d.count || 18;
      ctx.fillStyle = d.particleColor || "#140812";
      for (i = 0; i < count; i++) {
        var ps = span(t, 0.18 + wobble(i) * 0.2, 0.6);
        if (ps <= 0 || ps >= 1) continue;
        var ang = a0 + (a1 - a0) * wobble(i + 3);
        var px = cx + Math.cos(ang) * R + Math.sin((ps + wobble(i)) * Math.PI * 4) * 6;
        var py = cy - Math.sin(ang) * R + 40 * ps * ps;
        var size = sizeOf(d, i) * (1 - ps * 0.4);
        setAlpha(ctx, 1 - ps);
        ctx.fillRect(px - size / 2, py - size * 0.35, size, size * 0.7);
      }

      // 6. 足元の波紋：赤黒い輪が地面を這って広がる
      var ring = span(t, cutAt + 0.12, 0.45);
      if (ring > 0 && ring < 1) {
        var rr = (d.ringRadius || 110) * easeOut(ring);
        setAlpha(ctx, (1 - ring) * 0.8);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 4 * (1 - ring) + 1;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 34, rr, rr * 0.22, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    },

    /**
     * 死神の鎌の前ぶれ（技を出した瞬間、シニガミのまわりに出す。当たるまでの溜めのあいだ続く）。
     *   ・まわりの闇が渦を巻きながら体へ吸い込まれる（黒い煙の玉が外から内へ）
     *   ・目の高さで赤い光が2つ、強く瞬く
     *   ・足元に赤黒い輪が、外から内へ縮んでいく
     *   eyeOffset … 目の高さ（中心から上へ）  eyeGap … 目と目の間
     */
    reapOmen: function (ctx, d, t, p) {
      var R = d.radius || 90;
      var accent = d.accentColor || "#c0102a";
      var i;
      // 吸い込まれる闇
      var count = d.count || 22;
      for (i = 0; i < count; i++) {
        var s = span(t, wobble(i) * 0.4, 0.55);
        if (s <= 0 || s >= 1) continue;
        var ang = turns(i / count + s * 0.35 + p.phase);
        var r = R * (1 - easeIn(s));
        setAlpha(ctx, (s < 0.2 ? s / 0.2 : 1) * 0.55);
        ctx.fillStyle = (i % 3 === 0) ? "#2a1430" : "#05020a";
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(ang) * r, p.y + Math.sin(ang) * r * 0.7, sizeOf(d, i) * (1 - s * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
      // 縮んでいく輪
      var rs = span(t, 0.1, 0.8);
      if (rs > 0 && rs < 1) {
        var rr = R * 1.1 * (1 - easeOut(rs)) + 12;
        setAlpha(ctx, rs < 0.2 ? rs / 0.2 : 0.8);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 30, rr, rr * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // 赤い目の瞬き（溜めの終わりに強く光る）
      var eye = span(t, 0.55, 0.4);
      if (eye > 0 && eye < 1) {
        var ey = p.y - (d.eyeOffset || 14), gap = d.eyeGap || 12;
        var glow = Math.sin(Math.PI * eye);
        for (i = -1; i <= 1; i += 2) {
          var g = ctx.createRadialGradient(p.x + i * gap / 2, ey, 0, p.x + i * gap / 2, ey, 14 * glow + 2);
          g.addColorStop(0, "#ffd0c0");
          g.addColorStop(0.35, accent);
          g.addColorStop(1, "rgba(0,0,0,0)");
          setAlpha(ctx, glow);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x + i * gap / 2, ey, 14 * glow + 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },

    /** 砕ける：粒が横へ飛び、落ちていく */
    shards: function (ctx, d, t, p) {
      var count = d.count || 12;
      var radius = d.radius || 46;
      var gravity = d.gravity || 90;

      setAlpha(ctx, fadeOut(t));
      ctx.fillStyle = p.color;

      for (var i = 0; i < count; i++) {
        var angle = turns(i / count + p.phase);
        var speed = 0.6 + wobble(i) * 0.4;
        var x = p.x + Math.cos(angle) * radius * speed * easeOut(t);
        // 横に飛びながら落ちる
        var y = p.y + Math.sin(angle) * radius * speed * easeOut(t) * 0.5
                    + gravity * t * t;
        var size = sizeOf(d, i);

        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }
  };

  var SkillEffect = {
    /**
     * 演出を1つ描く。
     * @param {CanvasRenderingContext2D} ctx
     * @param {object} definition data/effects.js の shapes の1件
     * @param {number} progress 進み具合（0〜1）。範囲外なら何も描かない
     * @param {object} params { x, y, color, coreColor, phase }
     */
    draw: function (ctx, definition, progress, params) {
      if (!definition || progress < 0 || progress >= 1) return;

      var shape = SHAPES[definition.shape];
      if (!shape) return;

      // 設定「エフェクトの濃さ」。0 なら何も描かない
      intensity = (params.intensity === undefined) ? 1 : params.intensity;
      if (intensity <= 0) return;

      ctx.save();

      // にじみ。暗い背景では、これが無いと色つきの粒が沈んで見えない。
      // 色は演出の色そのものなので、属性ごとにその色で光る
      if (definition.glow) {
        ctx.shadowColor = params.color || "#ffffff";
        ctx.shadowBlur = definition.glow * intensity;
      }

      shape(ctx, definition, progress, {
        x: params.x,
        y: params.y,
        color: params.color || "#ffffff",
        coreColor: params.coreColor || "#ffffff",
        phase: params.phase || 0,
        // 上下の向き。1 が既定で、-1 なら逆さまに出す（弱体の演出に使う）
        direction: (params.direction === -1) ? -1 : 1,
        // "back" / "front" … 奥と手前を描き分ける型（layered）のとき、どちらの層か。null なら全部描く
        layer: params.layer || null,
        // 並び全体に出す型で、相手ひとりずつの位置（[{x, y}]）。無ければ pointsOf が決める
        points: params.points || null
      });
      ctx.restore();
    },

    /** その形が描けるか（データの書き間違いを早く気づけるように） */
    has: function (shapeName) {
      return !!SHAPES[shapeName];
    }
  };

  // --- 補助（すべて決まった値を返す。乱数は使わない） ---

  /**
   * いま描いている演出の濃さ（設定の effectLevel）。
   *
   * 形の関数はどれも ctx.globalAlpha を自分で設定するので、
   * 外から掛けても上書きされてしまう。そこで setAlpha を通し、
   * ここで濃さを掛けてから設定する。draw のあいだだけ使う値。
   */
  var intensity = 1;

  /** 濃さの設定を掛けてから、描く濃さを決める */
  function setAlpha(ctx, value) {
    ctx.globalAlpha = Math.max(0, Math.min(1, value * intensity));
  }

  /** 回転数をラジアンに直す */
  function turns(value) { return value * Math.PI * 2; }

  /** だんだん遅くなる */
  function easeOut(x) { return 1 - (1 - x) * (1 - x); }

  /** だんだん速くなる */
  function easeIn(x) { return x * x; }

  /** 終わりに向かって薄くなる（後半だけ効かせる） */
  function fadeOut(t) {
    if (t < 0.55) return 1;
    return Math.max(0, 1 - (t - 0.55) / 0.45);
  }

  /**
   * 全体の進み具合から、1本ぶんの進み具合を切り出す。
   * @param {number} t 全体（0〜1）
   * @param {number} start 始まる時点（0〜1）
   * @param {number} length 長さ（0〜1）
   * @returns {number} 0以下ならまだ始まっていない
   */
  function span(t, start, length) {
    if (length <= 0) return 0;
    var sub = (t - start) / length;
    if (sub <= 0) return 0;
    return Math.min(1, sub);
  }

  /** 番号から 0〜1 のばらつきを作る（同じ番号なら必ず同じ値） */
  function wobble(index) {
    var value = Math.sin(index * 12.9898) * 43758.5453;
    return value - Math.floor(value);
  }

  /**
   * 並び全体に出す型で使う、相手ひとりずつの位置。
   * 画面が渡してくれればそれ（p.points）、無ければ中心と左右 210 の3か所（3体並んだときの位置）
   */
  function pointsOf(p) {
    if (p.points && p.points.length) return p.points;
    return [{ x: p.x - 210, y: p.y }, { x: p.x, y: p.y }, { x: p.x + 210, y: p.y }];
  }

  /**
   * 正多角形の道筋を作る（盾・障壁の六角）。
   *   rotation … 回す量（ラジアン）  stretchY … 縦の伸ばし具合（1 で正多角形）
   */
  function polygonPath(ctx, x, y, r, sides, rotation, stretchY) {
    ctx.beginPath();
    for (var i = 0; i < sides; i++) {
      var a = (rotation || 0) + (i / sides) * Math.PI * 2;
      var px = x + Math.cos(a) * r;
      var py = y + Math.sin(a) * r * (stretchY || 1);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  /** 粒の大きさ。番号ごとに変える */
  function sizeOf(d, index) {
    var min = (d.minSize === undefined) ? 2 : d.minSize;
    var max = (d.maxSize === undefined) ? min : d.maxSize;
    return min + (max - min) * wobble(index + 3);
  }

  NS.SkillEffect = SkillEffect;
})(window.MyGame);
