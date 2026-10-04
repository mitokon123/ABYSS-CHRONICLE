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
       * 高まる。輪が足元から立ち上がり、粒がゆっくり昇る。
       * 強化・弱体の技に使う（当てるのではなく「まとう」感じにしてある）。
       *   rings … 立ち上がる輪の数   rise … どこまで昇るか
       */
      aura: {
        shape: "aura",
        duration: 620,
        glow: 12,
        rings: 3,
        radius: 34,
        rise: 46,
        lineWidth: 3,
        count: 10,
        minSize: 3,
        maxSize: 5
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
      }
    }
  };
})(window.MyGame);
