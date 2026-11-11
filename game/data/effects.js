/**
 * effects.js
 * 技を当てたときに出す演出の「型」。
 *
 * ▼ 考え方
 * 技ごとに絵を用意しない。形の型をいくつか用意し、
 * 色は data/elements.js の属性色をそのまま使う。
 * こうすると、同じ「弾ける」が火なら赤く、水なら青く出る。
 * 技が増えても、増えるのは data/skills.js の effect 1行だけ。
 *
 * ▼ 書き方
 * shape    : どんな形で描くか（描き方は js/ui/SkillEffect.js が持つ）
 * duration : 出てから消えるまでの時間（ms）
 * glow     : にじみの強さ。暗い背景で色が沈まないようにする。0で無し
 * hitSe    : この型で当たったときの音（data/audio.js の se のid）。
 *            書かなければ hit（打撃音）。斬る型だけ slash（斬撃音）にしてある。
 *            通常攻撃は種族の attackEffect（data/monsters.js）で型が決まるので、
 *            爪や翼で斬る種族は自然と斬撃音になる
 * 残りの項目は shape ごとに意味が変わる（下のコメントを参照）
 *
 * 色は指定しない。使う技の属性から決まる。
 * どうしても固定したいときだけ color を書く。
 *
 * ★ 型を増やすときは、ここに1エントリ足して
 *   js/ui/SkillEffect.js に描き方を1つ足す（他は変更不要）。
 */
(function (NS) {
  "use strict";

  NS.rawData.effects = {
    // 属性が無いときに使う色（data/elements.js の none と同じ）
    defaultColor: "#9aa4c0",
    // どの型でも中心に置く明るい芯の色
    coreColor: "#ffffff",

    /**
     * 強化・弱体（data/skills.js の modifier）の演出の色。
     *
     * これらの技は属性ではなく「何が変わるか」で色を決める。
     * そのほうが、守りが上がったのか攻撃が上がったのかが目で分かるため。
     * 上がるときも下がるときも同じ色で、向きは名前の横の印（↑↓）で伝える。
     */
    statColors: {
      hp:      "#5fd18c",   // 緑
      attack:  "#e8542a",   // 赤
      defense: "#4fb0d1",   // 青
      speed:   "#7fd9a8",   // 明るい緑
      pp:      "#8b6fd6"    // 紫
    },

    shapes: {
      /**
       * 打つ。中心から輪が広がり、短い線が四方へ散る。
       *   radius … 輪がどこまで広がるか
       *   rays / rayLength … 散る線の本数と長さ
       */
      impact: {
        shape: "impact",
        duration: 420,
        glow: 8,
        radius: 54,
        lineWidth: 4,
        rays: 7,
        rayLength: 26
      },

      /**
       * 斬る。太い筋が斜めに走る。
       *   streaks … 筋の本数（少しずつ遅れて走る）
       *   length / thickness … 筋の長さと太さ
       *   tilt … 傾き（回転数。0.125 で45度）
       */
      slash: {
        shape: "slash",
        hitSe: "slash",
        duration: 460,
        glow: 10,
        streaks: 3,
        length: 108,
        thickness: 9,
        tilt: -0.1,
        spread: 24
      },

      /**
       * 弾ける。中心から粒が放射状に飛ぶ。
       *   count / radius … 粒の数と飛ぶ距離
       */
      burst: {
        shape: "burst",
        duration: 580,
        glow: 12,
        count: 22,
        radius: 66,
        minSize: 4,
        maxSize: 9
      },

      /**
       * 閃光。円が一気に広がって、すぐ消える。
       *   radius … どこまで広がるか
       *   alpha  … いちばん濃いときの薄さ。上げすぎると相手が見えなくなる
       */
      flash: {
        shape: "flash",
        duration: 440,
        glow: 18,
        radius: 76,
        alpha: 0.55
      },

      /**
       * 光芒。閃光の一段上（シャインなど、属性の基本技より強い技に）。
       * 大きく閃いたあと、光の筋が四方へ伸び、輪が外へ抜け、少し遅れてもう一度光る。
       *   radius     … 最初の閃きの大きさ（flash の 76 より大きい）
       *   rays / rayLength / rayWidth … 筋の本数・長さ・太さ（1本おきに短くなる）
       *   ringRadius / ringWidth      … 外へ抜ける輪
       *   alpha      … 閃きの濃さ。flash と同じく上げすぎると相手が見えなくなる
       * ★ さらに上の技を作るときは、この数値を上げるより新しい型を足すほうがよい
       *   （「最終奥義」に見せるための型はまだ無い）
       */
      radiance: {
        shape: "radiance",
        duration: 640,
        glow: 22,
        radius: 96,
        rays: 8,
        rayLength: 126,
        rayWidth: 5,
        ringRadius: 136,
        ringWidth: 4,
        alpha: 0.55
      },

      /**
       * --- 属性技の2段目（RC-1。シャインの radiance と同じく、1段目の型の一段上） ---
       */

      // フレイム。burst の一段上。大きく弾け、足元から炎の舌が立ち昇り、輪が抜けて、もう一度小さく弾ける
      //   tongues / tongueHeight / tongueWidth … 炎の数・高さ・太さ   accentColor … 3つに1つの炎と火の粉の色
      blaze: {
        shape: "blaze",
        duration: 720,
        glow: 18,
        accentColor: "#ffd75e",
        radius: 84,
        count: 26,
        minSize: 4,
        maxSize: 9,
        tongues: 7,
        tongueHeight: 96,
        tongueWidth: 18,
        ringRadius: 124,
        ringWidth: 4
      },

      // ウェーブ。rain の一段上。白い泡を乗せた波が横から2枚打ち寄せ、しぶきが散り、足元に波紋が広がる
      //   waveWidth / waveHeight / thickness … 波の大きさと太さ   drops / splash … しぶきの数と飛ぶ強さ
      surge: {
        shape: "surge",
        duration: 820,
        glow: 14,
        waveWidth: 160,
        waveHeight: 74,
        thickness: 12,
        drops: 24,
        splash: 96,
        minSize: 3,
        maxSize: 6,
        rippleRadius: 72,
        footY: 30
      },

      // ロックスパイク。shards の一段上。足元から尖った岩が突き上がり、かけらが飛び散って、土煙が広がる
      //   spikes / spikeHeight / spikeWidth / spread … 棘の数・高さ・太さ・並ぶ幅   gravity … かけらの落ちる強さ
      spikes: {
        shape: "spikes",
        duration: 820,
        glow: 10,
        spikes: 5,
        spikeHeight: 84,
        spikeWidth: 22,
        spread: 92,
        footY: 34,
        count: 16,
        radius: 84,
        gravity: 170,
        minSize: 4,
        maxSize: 8,
        dustRadius: 84
      },

      /**
       * 降りそそぐ。上から粒が落ちてくる。
       *   spread … 左右の広がり   height … どこから落ちてくるか
       */
      rain: {
        shape: "rain",
        duration: 680,
        glow: 10,
        count: 26,
        spread: 56,
        height: 78,
        minSize: 4,
        maxSize: 7
      },

      /**
       * 共鳴（RC-1）。共鳴の技を出した本人のまわりに出す（当てる演出とは別）。
       * 足元に響きの輪が何重にも広がり、光の粒が本人のまわりを巡りながら昇る。
       * 色は技の属性（回復の共鳴はHPの緑）。data/categories.js の skillKind.resonance.casterEffect が指す
       *   ripples / radius / flatten … 広がる輪の数・大きさ・つぶれ具合（足元の楕円に見せる）
       *   motes / orbit / rise        … 巡る粒の数・回る半径・昇る高さ
       *   turns                       … 粒が回る回数
       */
      //   layered: true … 奥（体の後ろ）と手前を描き分ける。後ろを回る粒はモンスターの後ろに隠れる（RC-1）
      resonance: {
        shape: "resonance",
        layered: true,
        duration: 760,
        glow: 14,
        ripples: 3,
        radius: 58,
        flatten: 0.38,
        lineWidth: 3,
        motes: 8,
        orbit: 30,
        rise: 34,
        turns: 1.2,
        minSize: 3,
        maxSize: 5
      },

      /**
       * 砕ける。粒が横へ飛び、落ちていく。
       *   gravity … 落ちる強さ
       */
      shards: {
        shape: "shards",
        duration: 620,
        glow: 10,
        count: 18,
        radius: 58,
        gravity: 100,
        minSize: 4,
        maxSize: 8
      },

      /**
       * 毒の息。並びの中心で吐き出され、左右へもくもくと広がる。
       * 1体ずつではなく並び全体に1回だけ出す型なので、技の側に effectAt: "center" を書く。
       *   spread  … 左右にどこまで広がるか（敵3体の両端 ±210 より少し広く）
       *   height  … 上下の広がり
       *   count / minSize / maxSize … 煙の玉の数と大きさ
       *   bubbles … 煙の中から昇る泡の数
       *   color / accentColor … 毒の色は属性に無いので、ここで固定する
       *     （紫の煙に、毒の印と同じ緑を混ぜる。data/statuses.js の poison.color）
       *   ほかに書けるもの（火の息・奈落の息で使う）
       *     color を書かない … 技の属性の色になる
       *     particle       … 昇る粒の形。"bubble"（泡の輪・既定）／"spark"（四角い粒）
       *     particleColor  … 粒の色（省略で accentColor）
       *     lift           … 煙が昇る高さ（既定 12）
       *     particleScale  … 粒の大きさの倍率（既定 1）
       */
      miasma: {
        shape: "miasma",
        duration: 1000,
        glow: 14,
        color: "#9b59c9",
        accentColor: "#7fd06a",
        spread: 250,
        height: 70,
        count: 22,
        minSize: 18,
        maxSize: 34,
        bubbles: 16
      },

      /**
       * 火の息。どくのいきと同じ「息」の形で、色は火の属性色（橙）。
       * 3つに1つの煙を黄色にし、火の粉（spark）を散らす。熱で煙が高く昇る（lift）
       */
      flameBreath: {
        shape: "miasma",
        duration: 950,
        glow: 18,
        accentColor: "#ffd75e",
        particle: "spark",
        spread: 250,
        height: 70,
        lift: 34,
        count: 24,
        minSize: 16,
        maxSize: 32,
        bubbles: 22
      },

      /**
       * 眠りの胞子（キノコン）。眠りの印と同じ淡い紫の煙に、白い泡がゆっくり昇る。
       * ほかの息より遅く、低く広がる（眠気が漂う感じ）
       */
      sporeCloud: {
        shape: "miasma",
        duration: 1200,
        glow: 12,
        color: "#a88ce0",
        accentColor: "#e0d6ff",
        particleColor: "#f2eeff",
        particle: "bubble",
        spread: 250,
        height: 60,
        lift: 6,
        count: 22,
        minSize: 16,
        maxSize: 30,
        bubbles: 14
      },

      /**
       * あわ。色は水の属性色（青）。
       * 3つに1つの煙を淡い水色にし、大きめの泡の輪（particleScale）をたくさん昇らせる。
       * 泡は軽いので少しだけ浮く
       */
      bubbleBreath: {
        shape: "miasma",
        duration: 1000,
        glow: 14,
        accentColor: "#bfe9ff",
        particleColor: "#e6f7ff",
        particle: "bubble",
        particleScale: 1.8,
        spread: 250,
        height: 70,
        lift: 16,
        count: 20,
        minSize: 14,
        maxSize: 28,
        bubbles: 26
      },

      /**
       * 奈落の息。色は闇の属性色（紫）。
       * 3つに1つの煙を濃い闇色にして底の深さを出し、薄紫の粒が漂う。煙はあまり昇らない（重い闇）
       */
      abyssBreath: {
        shape: "miasma",
        duration: 1100,
        glow: 16,
        accentColor: "#3a2466",
        particleColor: "#c9b8ff",
        particle: "spark",
        spread: 260,
        height: 80,
        lift: 4,
        count: 26,
        minSize: 20,
        maxSize: 38,
        bubbles: 18
      },

      /**
       * --- 全体の共鳴（RC-1。ゲイル・ダークネビュラ・ボルト） ---
       * 息と同じく並び全体に1回だけ出す型（effectAt: "center"）。
       * 相手ひとりずつの位置を画面からもらうので、つむじ風や稲妻はそれぞれの相手の上に出る
       */

      // ゲイル。風の筋が並びを左から右へ駆け抜け、相手ごとの足元からつむじ風が昇る
      //   streaks / streakLength … 風の筋の数と長さ   rings / swirlRadius / rise … つむじ風の輪
      galeSweep: {
        shape: "galeSweep",
        duration: 900,
        glow: 12,
        spread: 270,
        height: 80,
        streaks: 10,
        streakLength: 150,
        thickness: 4,
        rings: 3,
        swirlRadius: 42,
        rise: 64,
        lineWidth: 3,
        count: 20,
        minSize: 4,
        maxSize: 7
      },

      // しんくうは。三日月の風の刃が相手ひとりずつへ飛んで切り、切り口へ空気が吸い込まれる
      //   travel … 刃が飛ぶ距離   bladeRadius … 刃の大きさ   stagger … 相手ごとの遅れ   pullRadius … 吸い込みの輪
      vacuumWave: {
        shape: "vacuumWave",
        duration: 820,
        glow: 12,
        travel: 220,
        bladeRadius: 44,
        thickness: 7,
        stagger: 0.08,
        cutLength: 100,
        pullRadius: 60,
        lineWidth: 3,
        count: 8,
        minSize: 3,
        maxSize: 5
      },

      // 稲妻斬り。斜めの一閃のあと、切り口へ稲妻が落ちて火花が散る（音は当たった瞬間の雷。技の hitSe）
      //   tilt … 一閃の傾き（回転数）   boltAt … 稲妻が落ち始める時刻   height / jag … 稲妻の長さとジグザグ
      thunderSlash: {
        shape: "thunderSlash",
        duration: 720,
        glow: 16,
        length: 130,
        thickness: 10,
        tilt: 0.36,
        boltAt: 0.3,
        height: 150,
        segments: 6,
        jag: 26,
        boltWidth: 7,
        glowRadius: 26,
        sparks: 9,
        sparkRadius: 46
      },

      // ダークネビュラ。渦を巻く闇の雲が並び全体を呑み込み、中で星が瞬く
      //   turns … 雲が回る量   coreRadius … 相手ごとに沈む闇の大きさ   stars / starColor … 星
      darkNebula: {
        shape: "nebula",
        duration: 1100,
        glow: 16,
        accentColor: "#2a1650",
        starColor: "#e6dcff",
        spread: 270,
        height: 100,
        count: 40,
        minSize: 14,
        maxSize: 28,
        turns: 0.35,
        coreRadius: 40,
        stars: 18
      },

      // ボルト。相手ひとりずつに稲妻が少しずつ遅れて落ち、並び全体が光る
      //   height … 稲妻の長さ   stagger … 相手ごとの遅れ   jag … ジグザグの幅   alpha … 全体の閃きの濃さ
      thunderstorm: {
        shape: "thunderstorm",
        duration: 900,
        glow: 20,
        spread: 270,
        height: 170,
        stagger: 0.08,
        segments: 7,
        jag: 34,
        boltWidth: 7,
        alpha: 0.3,
        sparks: 8,
        sparkRadius: 40
      },

      // いなずま（ザンガルドの体技）。ボルトと同じ型で、稲妻を太く・ほぼ同時に落とし、短く強く光らせる
      lightning: {
        shape: "thunderstorm",
        duration: 720,
        glow: 24,
        spread: 270,
        height: 200,
        stagger: 0.03,
        segments: 6,
        jag: 40,
        boltWidth: 11,
        alpha: 0.42,
        sparks: 12,
        sparkRadius: 52
      },

      /**
       * --- 技の大幅追加（2026-10-20）の型 ---
       * 無属性の技が多いので、灰色にならないよう、意味の分かる色を color で固定したものがある。
       * 強化・弱体で能力が変わる技（シールド・ブレイブ・鎧くずし など）は、color を書かず statColors の色になる
       */

      // 二連斬り。× の字に2本走る（1回当たるごとに出る）
      crossSlash: {
        shape: "crossSlash", hitSe: "slash", duration: 440, glow: 10,
        length: 112, thickness: 8, tilt: 0.125, delay: 0.2
      },

      // 捨て身の体当たり。打つ（impact）の重い版。反動の重さが伝わるよう、赤みのある色で固定
      crash: {
        shape: "crash", duration: 620, glow: 12, color: "#ff8a5c",
        radius: 74, lineWidth: 6, cracks: 7, crackLength: 50, count: 14, gravity: 150, minSize: 4, maxSize: 8
      },

      // ちからため。力が体に吸い込まれる。攻撃の赤
      gather: {
        shape: "gather", duration: 760, glow: 14, color: "#e8542a",
        radius: 86, count: 18, rings: 3, minSize: 3, maxSize: 6
      },

      // 鎧くずし。六角の盾が砕ける。色は下がる能力（防御の青）
      shatter: {
        shape: "shatter", duration: 760, glow: 10,
        radius: 46, fly: 42, gravity: 130
      },

      // しびれ針。針が刺さり、小さな稲妻が散る。麻痺の黄色（data/statuses.js の paralysis.color）
      needle: {
        shape: "needle", hitSe: "slash", duration: 560, glow: 12, color: "#ffd75e",
        length: 70, sparks: 7, sparkLength: 18
      },

      // シールド。六角の障壁。色は上がる能力（防御の青）
      barrier: {
        shape: "barrier", duration: 820, glow: 12, radius: 52
      },

      // 堅守の陣。障壁と同じ形で、受けるダメージが減ることを防御の青で見せる（能力ではないので色を固定）
      fortress: {
        shape: "barrier", duration: 900, glow: 14, color: "#4fb0d1", radius: 56
      },

      // ブレイブ・鼓舞の舞。矢じりが昇る。色は上がる能力（攻撃の赤）
      rally: {
        shape: "rally", duration: 760, glow: 12,
        radius: 42, rise: 72, count: 9, laneGap: 22, chevron: 9
      },

      // 足止めの舞。帯が巻きつき、締まりながら足元へずり落ちる。色は下がる能力（素早さの緑）
      entangle: {
        shape: "entangle", duration: 900, glow: 10,
        ribbons: 3, radius: 44, height: 72, turns: 1.6, groundRadius: 42, count: 8, minSize: 3, maxSize: 5
      },

      // ミステリーダンス。相手の体から光の玉が渦を巻いて抜け出し、頭の上で星が回る。PPの紫（statColors.pp）に桃色を混ぜる
      mystery: {
        shape: "mystery", duration: 1000, glow: 14, color: "#8b6fd6", accentColor: "#ff8ad8",
        count: 12, radius: 70, turns: 1.2, stars: 5, minSize: 4, maxSize: 7
      },

      // ヘイスト。速い筋が駆け抜ける。色は上がる能力（素早さの緑）
      haste: {
        shape: "haste", duration: 700, glow: 10,
        streaks: 9, width: 130, height: 72, radius: 36
      },

      // ハウリング。自分のまわりに咆哮の輪。与えるダメージが上がるので攻撃の赤で固定
      howl: {
        shape: "roar", duration: 760, glow: 12, color: "#e8542a",
        waves: 4, radius: 84, flatten: 0.75, lineWidth: 5, spikes: 14
      },

      // 威圧の咆哮。並び全体に1回だけ広がる咆哮（技の側に effectAt: "center"）。色は下がる能力（攻撃の赤）
      intimidate: {
        shape: "roar", duration: 900, glow: 14,
        waves: 4, radius: 300, flatten: 0.3, lineWidth: 6, spikes: 28
      },

      // 〇〇ベール。光の幕。色は守る属性（data/elements.js と同じ色）
      veilFire:    { shape: "veil", duration: 900, glow: 14, color: "#e8542a", width: 64, height: 92, strips: 7, count: 12, minSize: 3, maxSize: 5 },
      veilWater:   { shape: "veil", duration: 900, glow: 14, color: "#4fb0d1", width: 64, height: 92, strips: 7, count: 12, minSize: 3, maxSize: 5 },
      veilWind:    { shape: "veil", duration: 900, glow: 14, color: "#7fd9a8", width: 64, height: 92, strips: 7, count: 12, minSize: 3, maxSize: 5 },
      veilEarth:   { shape: "veil", duration: 900, glow: 14, color: "#c8a35e", width: 64, height: 92, strips: 7, count: 12, minSize: 3, maxSize: 5 },
      veilThunder: { shape: "veil", duration: 900, glow: 14, color: "#ffd75e", width: 64, height: 92, strips: 7, count: 12, minSize: 3, maxSize: 5 },
      veilLight:   { shape: "veil", duration: 900, glow: 14, color: "#f2f0d8", width: 64, height: 92, strips: 7, count: 12, minSize: 3, maxSize: 5 },
      veilDark:    { shape: "veil", duration: 900, glow: 14, color: "#8b6fd6", width: 64, height: 92, strips: 7, count: 12, minSize: 3, maxSize: 5 },

      // 幻惑の息。目をくらます暗い息（盲目の色。data/statuses.js の blind.color）。粒は暗い火の粉
      blindMist: {
        shape: "miasma", duration: 1100, glow: 8, color: "#6b625c",
        accentColor: "#2a2420", particleColor: "#d8d0c8", particle: "spark",
        spread: 250, height: 70, lift: 8, count: 24, minSize: 16, maxSize: 32, bubbles: 14
      },

      // しびれ粉。黄色い粉が広がり、きらきらした粒が舞う（麻痺の色）
      numbCloud: {
        shape: "miasma", duration: 1100, glow: 14, color: "#e8c84a",
        accentColor: "#fff3a0", particleColor: "#fffbe0", particle: "spark",
        spread: 250, height: 64, lift: 10, count: 22, minSize: 14, maxSize: 28, bubbles: 22
      },

      // サイレス。印の輪が締まる（封印の色。data/statuses.js の seal.color）
      sealRing: {
        shape: "sealRing", duration: 820, glow: 12, color: "#a77bd6", radius: 58, marks: 8
      },

      // 不吉な舞。頭の上の輪から影がしたたる（呪いの色。data/statuses.js の curse.color）
      hex: {
        shape: "hex", duration: 960, glow: 12, color: "#c04a7a", accentColor: "#3a1430",
        headOffset: 46, drips: 7, fall: 80, count: 12, minSize: 8, maxSize: 14
      },

      // ディンド。朝の光のような、やわらかいきらめき
      wake: {
        shape: "sparkle", duration: 760, glow: 14, color: "#ffe9a8", radius: 44, stars: 10, spread: 70, alpha: 0.5
      },

      // リカバー。澄んだ光が大きくふくらみ、きらめきが多い
      purify: {
        shape: "sparkle", duration: 900, glow: 18, color: "#bff4ff", radius: 58, stars: 16, spread: 86, alpha: 0.6
      },

      // 死神の鎌（シニガミ。2026-10-21 に作り直した）。刃の軌跡と残像 → 閃き → 体を横切る裂け目が割れる → 魂が昇る → 足元の波紋
      // 時間（作者の指定で長くした）：三日月は 0〜0.2 で走り、crescentHold（0.42）まで残ってから薄れる。
      //   赤い裂け目は cutAt（0.36）から。前は三日月がすぐ消え、裂け目も 0.16 で出ていた
      reap: {
        shape: "reap", duration: 2000, glow: 18, crescentHold: 0.42, cutAt: 0.36, color: "#d8dce8", accentColor: "#c0102a", particleColor: "#140812",
        soulColor: "#bfe0ff", souls: 7, soulRise: 110,
        // 三日月を大きく（作者の指定。前は radius 78・width 18）。裂け目・閃き・波紋もそれに合わせて大きくした
        radius: 125, width: 30, count: 24, minSize: 3, maxSize: 8, flashRadius: 95, cutLength: 130, ringRadius: 150
      },

      // 死神の鎌の前ぶれ。技を出した瞬間にシニガミのまわりに出す（技の casterEffect）。
      // 闇が吸い込まれ、足元の輪が縮み、最後に赤い目が強く光る。溜め（技の windupMs 840）と同じ長さ
      reapOmen: {
        shape: "reapOmen", duration: 840, glow: 10, color: "#2a0a18", accentColor: "#c0102a",
        radius: 92, count: 22, minSize: 6, maxSize: 12, eyeOffset: 16, eyeGap: 12
      },

      // 即死の技（デス・デスラ・死の踊り）。頭の上に赤黒い輪が浮かび、影がしたたって靄が沈む（不吉な舞と同じ形・色だけ違う）
      deathMark: {
        shape: "hex", duration: 1000, glow: 14, color: "#c0102a", accentColor: "#120008",
        headOffset: 46, drips: 9, fall: 86, count: 14, minSize: 8, maxSize: 15
      },

      // クレンズレイン。澄んだ水色の雨が降り、きらめく
      cleanseRain: {
        shape: "rain", duration: 760, glow: 12, color: "#9fe3ff", count: 26, spread: 56, height: 80, minSize: 3, maxSize: 6
      },

      /**
       * --- v1.3.0：ほかの技の演出を借りていた技の専用の型（2026-11-03 作者の指定で全部専用に） ---
       * 色を書いていないものは、属性の色か、変わる能力の色（statColors）になる
       */

      // キュア。体がやわらかく光り、十字の光が昇る（HPの緑）
      healing: {
        shape: "healing", duration: 820, glow: 14, color: "#5fd18c", radius: 34, crosses: 6, crossSize: 7, rise: 70
      },
      // キュアラ。キュアの大きい版。上から光の柱が降りる
      healingGreat: {
        shape: "healing", duration: 1000, glow: 18, color: "#5fd18c", radius: 40, crosses: 10, crossSize: 8, rise: 86, column: true
      },
      // キュアオール。キュアラと同じ量を全員へ。柱は降りず、1体ずつ十字の光が昇る
      healingAll: {
        shape: "healing", duration: 960, glow: 16, color: "#5fd18c", radius: 38, crosses: 8, crossSize: 7, rise: 78
      },
      // リザレクト。金色の光の柱が降り、十字の光が高く昇る（起きたときだけ出る）
      reviveRise: {
        shape: "healing", duration: 1200, glow: 22, color: "#ffe08a", radius: 44, crosses: 12, crossSize: 8, rise: 100, column: true
      },
      // 樹液の膜（ジュエキスライムの絆の技。2026-11-11）。琥珀のしずくが落ち、透けた膜が頭から体を包み、光が走って泡が昇る
      sapVeil: {
        shape: "sapVeil", duration: 1300, glow: 12, color: "#f0b040", deepColor: "#a86414", radius: 40, drops: 4
      },
      // クレンズ。澄んだ雫が落ちて輪が広がり、きらめく
      cleanseDrop: {
        shape: "cleanse", duration: 860, glow: 12, color: "#9fe3ff", count: 7
      },
      // 主のやくそう。葉が体を巡りながら昇る
      herbLeaves: {
        shape: "herbLeaves", duration: 900, glow: 10, color: "#84c95a", count: 8
      },
      // こうか。板が集まって体を覆う。色は上がる能力（防御の青）
      hardenShell: {
        shape: "hardenShell", duration: 820, glow: 12, plates: 6, radius: 44
      },
      // ちからぬき。赤い粒が抜け出て、矢じりが沈む。色は下がる能力（攻撃の赤）
      drainAway: {
        shape: "drainAway", duration: 860, glow: 10, count: 14, minSize: 3, maxSize: 6
      },
      // 立ち塞がる。足元から石積みの壁がせり上がる
      standWall: {
        shape: "standWall", duration: 900, glow: 8, color: "#b9a27a", width: 96, height: 104
      },
      // 朧羽。ぼんやりした羽が舞い落ち、もやが包む（1体ずつに出る）
      hazyFeathers: {
        shape: "hazyFeathers", duration: 1000, glow: 12, color: "#a596d0", count: 7
      },
      // 導きの光。光が降りて体を照らし、足元から前へ光の跡が流れる（素早さの緑ではなく光の色で固定）
      guidingLight: {
        shape: "guidingLight", duration: 900, glow: 16, color: "#fff0a8"
      },
      // 王の号令。冠の光と、二重の衝撃の輪（王の金）
      royalCommand: {
        shape: "royalCommand", duration: 900, glow: 16, color: "#ffd75e"
      },
      // ララバイ。音符が揺れながら昇り、z が浮かぶ
      lullaby: {
        shape: "lullaby", duration: 1000, glow: 10, color: "#ff9ad0", count: 5
      },
      // 芽吹きの加護。足元から双葉が芽を出し、花びらが昇る
      sproutBlessing: {
        shape: "sproutBlessing", duration: 1000, glow: 10, color: "#84c95a", count: 5
      },
      // サンダー。上から稲妻が落ち、またたいて足元に光が弾ける（雷の色）
      thunderBolt: {
        shape: "thunderBolt", duration: 620, glow: 20, height: 150
      },
      // 青い眼光。二つの鋭い光がまたたき、横へ筋が走る（ヌマボネの眼窩の青）
      blueGlare: {
        shape: "blueGlare", duration: 760, glow: 16, color: "#5fa8ff"
      },
      // グレア。光の十字が大きく開いてすぐ閉じる（光の色）
      glareBeam: {
        shape: "glareBeam", duration: 620, glow: 22, length: 90
      },
      // 幻惑の瞳。大きな瞳が開き、渦の輪が広がる
      dazzleEye: {
        shape: "dazzleEye", duration: 860, glow: 14, color: "#c07ae0"
      },
      // ウィンド。三日月の刃が横切り、渦が残る（風の色）
      windCutter: {
        shape: "windCutter", hitSe: "slash", duration: 620, glow: 12, blades: 3
      },
      // 吸血。牙が噛み合い、赤い雫が昇る
      fangDrain: {
        shape: "fang", hitSe: "slash", duration: 760, glow: 10, color: "#d8344a", spill: "drops", count: 8
      },
      // 焔牙。牙が噛み合い、炎が立ち昇る（火の色）
      blazeFang: {
        shape: "fang", hitSe: "slash", duration: 760, glow: 16, spill: "flames", count: 10
      },
      // 歯車投げ。回る歯車が飛んできて当たり、火花が散る（真鍮の色）。1回当たるごとに出る
      gearHit: {
        shape: "gearHit", hitSe: "slash", duration: 520, glow: 10, color: "#c49a3a", radius: 16
      },
      // どくばり。針が突き刺さり、毒の雫が飛び散る（毒の色。data/statuses.js の poison.color）
      poisonSting: {
        shape: "poisonSting", hitSe: "slash", duration: 640, glow: 10, color: "#7fd06a", count: 9
      },
      // シャドウ。足元の影から黒い手が伸びて包む（闇の色）
      shadowGrasp: {
        shape: "shadowGrasp", duration: 760, glow: 12, count: 6
      },
      // 火炎斬り（v1.3.0）。三日月の太刀筋が右上から左下へ走り、筋に沿って炎の舌が立ち昇る。
      //   radius / width … 太刀筋の大きさと太さ   flames / flameHeight … 炎の数と高さ   embers … 火の粉
      flameSlash: {
        shape: "flameSlash", hitSe: "slash", duration: 720, glow: 18,
        radius: 92, width: 24, flames: 9, flameHeight: 66, embers: 12, minSize: 3, maxSize: 6
      },
      // 流水斬り。水の帯がS字に流れ、薄い帯が2本追いかける。水しぶきが飛んで落ちる。
      //   length / amplitude / width … 帯の長さ・うねり・太さ   drops / gravity … 雫の数と落ち方
      flowSlash: {
        shape: "flowSlash", hitSe: "slash", duration: 760, glow: 14,
        length: 184, amplitude: 30, width: 20, drops: 16, gravity: 110, minSize: 3, maxSize: 6
      },
      // 疾風斬り。細く鋭い筋が速く3本走り、切り口から風の線が横へ流れる。ほかの3つより短い。
      //   length / width … 筋の長さと太さ   gusts … 風の線の数
      galeSlash: {
        shape: "galeSlash", hitSe: "slash", duration: 460, glow: 12,
        length: 190, width: 7, gusts: 9
      },
      // 岩砕斬り。太い一撃が真上から落ち、当たったところから岩のかけらが飛び散る。
      //   length / width … 一撃の長さと太さ   cracks … ひび   rocks / gravity … かけらの数と落ち方
      rockSlash: {
        shape: "rockSlash", hitSe: "slash", duration: 760, glow: 10,
        length: 170, width: 52, cracks: 6, crackLength: 62, rocks: 12, gravity: 170, minSize: 6, maxSize: 13
      },

      // 烈火崩地斬（ウェポンの絆の技）。相手ひとりずつを炎の一閃で斬り下ろし、足元が割れて岩と火の粉が噴き上がる。
      // 並び全体に1回だけ出す型（技の側に effectAt: "center"）。一閃と火の粉は属性の色（火）、ひびと岩は earthColor（地の色）
      //   stagger … 相手ごとの遅れ   length / thickness … 一閃   crackWidth / groundY … ひびの幅と足元の位置   rise … 噴き上がる高さ
      blazingRift: {
        shape: "blazingRift", hitSe: "slash", duration: 1050, glow: 16,
        earthColor: "#c8a35e", stagger: 0.07,
        length: 190, thickness: 14, tilt: 0.17,
        crackWidth: 120, groundY: 48, rise: 96,
        rocks: 8, embers: 12, minSize: 4, maxSize: 9
      }
    }
  };
})(window.MyGame);
