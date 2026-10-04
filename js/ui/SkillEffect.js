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

  /** 粒の大きさ。番号ごとに変える */
  function sizeOf(d, index) {
    var min = (d.minSize === undefined) ? 2 : d.minSize;
    var max = (d.maxSize === undefined) ? min : d.maxSize;
    return min + (max - min) * wobble(index + 3);
  }

  NS.SkillEffect = SkillEffect;
})(window.MyGame);
