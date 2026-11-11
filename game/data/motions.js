/**
 * motions.js
 * 「絵をどう動かすか」の定義。モンスターやUIの部品がこれを名前で参照する。
 *
 * 1枚の絵を動かして見せる方式なので、コマ絵を描き足さなくても
 * この1行を足すだけで新しい動きが作れる。数値はすべてこのファイルに置く。
 *
 * ▼ 使い方
 *   data/monsters.js の種族に motion: "float" と書く。
 *   実際の計算は js/ui/Motion.js、描画は SpriteRenderer.drawMotion。
 *
 * ▼ 動かせるもの（チャンネル）
 *   offsetX : 左右のずれ（px）
 *   offsetY : 上下のずれ（px）。画面は下が＋なので、上へ動かすには負の値
 *   scale   : 大きさ。1 を基準にした増減（0.04 なら 0.96〜1.04 の間で伸縮）
 *             足元を基準に伸縮するので、浮き上がって見えない
 *   scaleX  : 横だけの倍率。scale に掛かる
 *   scaleY  : 縦だけの倍率。scale に掛かる
 *             ★ 縦と横を少しずらして動かすと、1枚の絵のままでも
 *               「息をしている」ように見える（dragonBreathe がその例）
 *   alpha   : 濃さ。1 を基準にした増減（0.2 なら 0.8〜1.0 の間で明滅）
 *   lift    : （1回だけの動きだけ。RC-1）相手の位置に関係なく、画面の上へ浮く量（px。正で上へ）。
 *             offsetY は敵は下へ・味方は上へと向きが入れ替わるので、「上へ浮く」は lift で書く（dragonSwoop がその例）
 *
 * ▼ 伸縮の基準（チャンネルではなく、定義そのものに書く）
 *   anchor: "top"  … 上端を固定して伸び縮みする。
 *                    天井からぶら下がっているもの向け（riftIdle がその例）。
 *                    書かなければ足元が固定される（ふつうはこちら）
 *   pinTop: 7      … 絵の上から7行を「動かさない」（RC-1。天井の裂け目など）。残りだけを動かす。
 *                    残りは上端が動かない部分の下端にくっついたままなので、
 *                    offsetX / offsetY は効かない（離れてしまうため）。伸び縮み（scaleY）と回転（rotate。上端の中央が軸）で動かす。
 *                    倒れて消えるとき以外は、動かさない部分は薄くならない。
 *                    ふだんの動きに書けば、重ねる1回だけの動きにも効く（riftIdle・zuta〜がその例）
 *
 * ▼ チャンネルの中身
 *   amplitude : どれだけ動くか
 *   speed     : 速さ（1ミリ秒あたりのラジアン）。0.002 でおよそ3秒に1往復
 *   period    : 1往復にかかるミリ秒。speed の代わりにこちらで書いてもよい
 *               コマ絵と合わせたいときは、必ずこちらで書く（下の slimeIdle 参照）
 *   wave      : 波の形
 *       "sin"    … -1〜1 を行き来する（既定）。ふわふわした往復
 *       "bounce" … 0〜1 を跳ねる。片方向だけに動かしたいとき（跳ねる、など）
 *       "blink"  … 0か1。かちっと切り替わる明滅
 *   phase     : 位相のずらし（0〜1）。チャンネル同士をずらしたいときに使う
 *
 * ▼ コマ絵
 *   frames: { interval: 200 }
 *   と書くと 200ms ごとに次の絵へ切り替わる。
 *   種族側は sprite に絵を並べて書くだけ：
 *     slime: { sprite: ["slime1", "slime2", "slime3"], motion: "frameNormal" }
 *
 *   ★ 枚数はここに書かない。絵の枚数から読み取るので、
 *     絵を1枚足しても減らしても、このファイルは直さなくてよい。
 *
 *   ★ コマ絵と「ずっと続く動き」は重ねられる。
 *     形が変わりながら、なめらかに浮くこともできる（slimeIdle がその例）。
 *     つまり2〜3枚描くだけでよく、滑らかなループを描き切る必要はない。
 *
 * ★ 動きを増やすときは、このファイルに1エントリ足すだけでよい。
 *
 * ★ いちばん下に「動きの調整ページが書くところ」がある（v1.2.0）。
 *   motion-viewer.html の調整の欄で「保存」すると、開発用サーバー（tools/devserver.py）がそこだけを書き直す。
 *   そこにある id は、上の本体の行より優先される。手では直さない。
 *
 * ─────────────────────────────────────────────
 * ▼ 場面ごとの動き（攻撃・被弾・技を放つ…）は、書かなくても全種族に付く
 *
 * このファイルの下の方に motionDefaults がある。
 * data/monsters.js に motions を書いていない種族は、全員そこから拾う。
 * つまり新しいモンスターを足しても、モーションの行は1行も要らない。
 *
 * 種族ごとに変えたいときだけ、data/monsters.js に1行：
 *   motions: { faint: "crumble" }        // 倒れ方だけ差し替える
 *   motions: { attack: null }            // その場面だけ動かさない
 * 書いた場面だけが上書きされ、残りは既定のまま。
 *
 * 【技のエフェクト】いちばん行数が増えるのはここなので、
 *   「技ごとに絵を用意しない」ことを原則にしている。
 *
 *   ・形の型を10個ほど用意する（斬る／弾ける／貫く／降りそそぐ など）
 *   ・色は data/elements.js の属性色をそのまま使う
 *     → 同じ「弾ける」が、火なら赤く、水なら青く出る
 *   ・技側は effect: "burst" の1行だけ
 * ─────────────────────────────────────────────
 */
(function (NS) {
  "use strict";

  NS.rawData.motions = {
    // ─────────────────────────────────────────
    // ここから blaze までは「汎用のひな形」。
    //
    // α-5で全種に専用の動きを持たせたので、
    // 種族が使っているひな形は無い。breathe は店主、blaze は拠点のたき火が使う。
    // どこからも使っていなかった sway / hop / flutter / heavy は v1.3.1 で消した。
    //
    // 新しい種族を作るときは、近いもの（下の専用モーションも含む）を写して名前を付け替え、
    // 下の「種族ごとの専用モーション」に1つ足すのが早い。
    // ─────────────────────────────────────────

    // 動かない。motion を書いていないのと同じ
    none: {},

    // ふわふわ浮く。地に足がついていないもの
    float: {
      offsetY: { amplitude: -2.5, speed: 0.0018 }
    },

    // 呼吸。立っているものの「生きている感じ」を出す最も控えめな動き
    breathe: {
      scale: { amplitude: 0.035, speed: 0.0016 }
    },

    // 明滅。光るもの向け。ゆっくり浮きながら光の強さが変わる
    glow: {
      offsetY: { amplitude: -1.5, speed: 0.0016 },
      alpha:   { amplitude: -0.14, speed: 0.0048 }
    },

    // 炎。速く小刻みに揺れ、明るさも変わる
    blaze: {
      offsetY: { amplitude: -1.5, speed: 0.0062 },
      offsetX: { amplitude: 0.8, speed: 0.0091, phase: 0.33 },
      alpha:   { amplitude: -0.10, speed: 0.0085 }
    },

    // 竜の呼吸。大きいものほど、ゆっくり・深く息をする
    //
    // 縦と横を同じ速さで、少しだけ位相をずらして動かしているのが要点。
    // 同時に動かすと絵がただ拡大縮小するだけだが、ずらすと
    //   胸が横にふくらむ → 少し遅れて背が伸びる → 抜ける
    // という順になり、体と翼が別々に動いて見える。
    // period は4.2秒。1体だけ極端に遅いので、並んだときに存在感が出る。
    //
    // 上下のずれ（offsetY）はあえて使っていない。足を地面から浮かせると
    // 重さが消えるので、伸縮だけにして足元は動かさないでおく
    //
    // RC-1：翼をゆっくり動かす（作者の指定）。作り直しで、翼と尻尾を付け根で回すコマ8枚にした：
    //   sprite: [元, 半分上げ, 上げ, 半分上げ, 元, 半分下げ, 下げ, 半分下げ] × 420ms ＝ 3.4秒で1回。尻尾も翼と一緒に上下する。
    // 息（scale）は今のまま
    dragonBreathe: {
      frames: { interval: 420 },
      scaleX: { amplitude: 0.028, period: 4200 },
      scaleY: { amplitude: 0.024, period: 4200, phase: 0.18 }
    },

    // 亜空間から出入りする。天井の裂け目からぶら下がっているもの向け
    //
    // anchor: "top" で裂け目の側を固定してあるので、
    // 縦に縮むと下端（蔦の先）だけが裂け目へ吸い込まれていく。
    // 濃さを少し遅らせて動かすと、引っ込むときに薄くなって
    // 「向こう側へ入った」ように見える
    //   RC-1：pinTop: 7 … 絵の上から7行（裂け目）は動かさない。蔦だけが伸び縮みして揺れる
    //   （SpriteRenderer._drawPinned。蔦は上端が裂け目にくっついたまま。横のずれは rotate の小さな揺れに置き換えた）
    riftIdle: {
      anchor:  "top",
      pinTop:  7,
      scaleY:  { amplitude: -0.11, period: 3000 },
      rotate:  { amplitude: 0.004, period: 3000, phase: 0.25 },
      alpha:   { amplitude: -0.10, period: 3000, phase: 0.08 }
    },

    // ─────────────────────────────────────────
    // 種族ごとの専用モーション（α-5）
    //
    // 上の float / glow などは「その形のものなら何でも使える」汎用品で、
    // 3〜4種が同じ動きを共有していた。絵を 32×32 に描き直したので、
    // 種族ごとに1つずつ持たせて、動きでも見分けがつくようにしてある。
    //
    // ▼ 作るときの決まりごと
    //   ・地に足がついているものは offsetY を使わない。
    //     浮かせると重さが消える（ヨミリュウ・モスゴーレムがその例）
    //   ・wave:"bounce" は |sin| なので、位相を 0.5 ずらしても何も変わらない。
    //     跳ねる動きに着地の潰れを合わせるときは phase: 0.25（＝|cos|）を使う
    //   ・速さは period（1往復のミリ秒）で書く。speed で書くと丸め誤差でずれる
    // ─────────────────────────────────────────

    // コウモリ：羽ばたき（RC-1 でコマ絵にした）。
    //   sprite: ["battyUp", "batty", "battyDown", "batty"] … 振り上げ → 水平 → 振り下ろし → 水平
    //   4コマ × 90ms = 360ms ＝ 上下の揺れの period。振り下ろした直後に体がいちばん高く浮く（phase）
    batFlutter: {
      frames:  { interval: 90 },
      offsetY: { amplitude: -2.5, period: 360, phase: 0.375 }
    },

    // コケネズミ：跳ねて、着地した瞬間に潰れる
    //   phase: 0.25 で |cos| になるので、いちばん高いところで潰れが0、
    //   地面に着いた瞬間に潰れが最大になる
    ratHop: {
      offsetY: { amplitude: -4.0,  period: 1000, wave: "bounce" },
      scaleY:  { amplitude: -0.06, period: 1000, wave: "bounce", phase: 0.25 }
    },

    // イワゴロー：足が遅い岩。ほとんど動かず、わずかに傾くだけ
    rockIdle: {
      rotate: { amplitude: 0.004, period: 4600 },
      scaleY: { amplitude: 0.012, period: 4600, phase: 0.25 }
    },

    // ヒカリムシ：羽ばたきだけ速く、光はゆっくり明滅する（図鑑「光は呼吸に合わせて強まり、弱まる」）。
    //   RC-1 で羽ばたきをコマ絵にした（α-10 までは scaleX で体ごと横に縮めていた）。
    //   sprite: ["glowBugUp", "glowBug", "glowBugDown", "glowBug"] … 4コマ × 60ms = 240ms（コウモリより速い）
    bugGlow: {
      frames:  { interval: 60 },
      offsetY: { amplitude: -1.8,  period: 1900 },
      alpha:   { amplitude: -0.12, period: 1400 }
    },

    // キノコン：根が生えているので、ゆっくり傾いて胞子がにじむ
    sporeSway: {
      offsetX: { amplitude: 1.3,   period: 3800 },
      scaleY:  { amplitude: 0.018, period: 3800, phase: 0.30 },
      alpha:   { amplitude: -0.05, period: 2600 }
    },

    // スミビ：燃えさしの炭。小刻みに揺れ、火の勢いが安定しない
    emberIdle: {
      offsetY: { amplitude: -1.2,  period: 520 },
      offsetX: { amplitude: 0.7,   period: 380, phase: 0.33 },
      alpha:   { amplitude: -0.08, period: 300 }
    },

    // フレイミン：気性が荒い。落ち着かず細かく跳ねる
    //   RC-1 の作り直し：コマ絵 [元, StepL, 元, StepR] × 190ms で、跳ねるたびに左右の脚を交互に上げて足踏みする
    //   （跳ねる周期 760ms ＝ コマ4枚ぶん）。スミビ（脚のない炭の塊）と、ここで見分けがつく
    flameHop: {
      frames:  { interval: 190 },
      offsetY: { amplitude: -2.6,  period: 760, wave: "bounce" },
      scaleY:  { amplitude: -0.05, period: 760, wave: "bounce", phase: 0.25 },
      alpha:   { amplitude: -0.06, period: 620 }
    },

    // ハイバネ：体がひどく軽い。熱に乗って漂う（羽ばたきだけ速い）。
    //   RC-1 で羽ばたきをコマ絵にした（α-10 までは scaleX で体ごと横に縮めていた）。
    //   sprite: [振り上げ, 水平, 振り下ろし途中, いちばん下, 振り下ろし途中, 水平] … 6コマ × 70ms = 420ms（前と同じ速さ）
    //   RC-1 の作り直し：コマ絵10枚（翼を付け根で回した羽ばたき）を 60ms ずつ。1往復 600ms
    ashDrift: {
      frames:  { interval: 60 },
      offsetY: { amplitude: -3.2,  period: 2600 },
      offsetX: { amplitude: 1.8,   period: 3400, phase: 0.40 }
    },

    // ヒビイワ：岩の遅い呼吸に、ひびから漏れる熱の明滅を重ねる
    crackPulse: {
      scaleY: { amplitude: 0.016, period: 3600 },
      alpha:  { amplitude: -0.09, period: 1800 }
    },

    // マグマガニ：じっと動かない。たまに横へ体重を移すだけ
    //   RC-1 の作り直し：コマ絵 [元, LegsA, 元, LegsB] で、脚が足踏みし、目の柄がきょろきょろする
    crabIdle: {
      frames:  { interval: 340 },
      offsetX: { amplitude: 1.1,   period: 3200 },
      scaleY:  { amplitude: 0.010, period: 3200, phase: 0.25 }
    },

    // ヨドミ：浮きながら、裾の滴が伸び縮みする
    murkFloat: {
      offsetY: { amplitude: -2.4,  period: 2800 },
      scaleY:  { amplitude: 0.035, period: 2800, phase: 0.25 },
      alpha:   { amplitude: -0.07, period: 3600 }
    },

    // ミズダマリ：上が重い水の塊。縦横が入れ替わるように波打つ
    waterWobble: {
      scaleX:  { amplitude: 0.030,  period: 2200 },
      scaleY:  { amplitude: -0.030, period: 2200 },
      offsetX: { amplitude: 1.0,    period: 2200, phase: 0.25 }
    },

    // --- 腐食の毒沼 ---

    // ドクバチ：羽ばたきで小刻みに上下する。虫なのでいちばん速い周期
    //   RC-1：コマ絵 [Up, 元, Down, 元, UpB, 元, DownB, 元] × 50ms で翅を打ち、2回に1回は腹が縮んで息をし、触角が動く
    beeHover: {
      frames:  { interval: 50 },
      offsetY: { amplitude: -1.6, period: 260 },
      offsetX: { amplitude: 0.6,  period: 620 }
    },

    // ドロガメ：甲羅は動かさず、ゆっくり息をするだけ。
    // 足元を基準に縦だけ伸縮させるので、甲羅が浮いて見えない
    //   RC-1：コマ絵 [元, NeckOut, 元, Blink] × 850ms で、首をゆっくり伸ばして息をし、ときどきまばたきする
    turtleBreathe: {
      frames: { interval: 850 },
      scaleY: { amplitude: 0.016, period: 3400 }
    },

    // ヌマボネ：泥に浮いたまま、ゆらりと傾く。
    // 上下ではなく左右に揺らすと「沈んでいて動けない」感じが出る
    //   RC-1：コマ絵 [元, TiltL, 元, TiltR] × 750ms（左右の揺れ 3000ms と同じ周期）で、頭蓋が首の上でかくりとかしぐ
    boneSway: {
      frames:  { interval: 750 },
      offsetX: { amplitude: 1.4,   period: 3000 },
      offsetY: { amplitude: -1.0,  period: 1500 },
      alpha:   { amplitude: -0.05, period: 3800 }
    },

    // ヌシガエル：大きいものほどゆっくり深く息をする。
    // 横に広い体なので、縦より横をわずかに大きく動かす
    //   RC-1：コマ絵10枚 × 600ms で、のど袋をふくらませて息をし、目をきょろりと動かし、ときどきまばたきする
    lordBreathe: {
      frames: { interval: 600 },
      scaleX: { amplitude: 0.020, period: 3800 },
      scaleY: { amplitude: 0.014, period: 3800, phase: 0.25 }
    },

    // ビリムシ：小さくて速い。帯電で小刻みに震える。
    //   RC-1 で羽ばたきをコマ絵にした（α-10 までは scaleX で体ごと縮めていた）。
    //   sprite: ["boltBugUp", "boltBug", "boltBugDown", "boltBug"] … 4コマ × 45ms = 180ms（いちばん速い羽ばたき）
    boltFlit: {
      frames:  { interval: 45 },
      offsetY: { amplitude: -1.6, period: 300 },
      offsetX: { amplitude: 0.8,  period: 190, phase: 0.5 }
    },

    // モスゴーレム：石の巨人。呼吸が非常に遅く、足元は動かさない
    golemBreathe: {
      scaleY: { amplitude: 0.022, period: 5200 }
    },

    // マグマウルフ：獣の呼吸。竜より速く浅い。背の炎がゆらぐ
    //   RC-1 の作り直し：コマ絵 [元, IdleA, 元, IdleB] で、尻尾の炎が傾いたり伸びたりし、たてがみの先が左右へなびく
    beastBreathe: {
      frames: { interval: 190 },
      scaleX: { amplitude: 0.020,  period: 2600 },
      scaleY: { amplitude: 0.016,  period: 2600, phase: 0.18 },
      alpha:  { amplitude: -0.05,  period: 1300 }
    },

    // キングスライム：大きなゼリーの塊。ゆっくり大きく波打つ
    //   RC-1 の作り直し：コマ絵 [元, LeanL, 元, LeanR] で体が左右に揺れ、王冠が傾く。
    //   伸縮は1往復をコマ4枚ぶん（400 × 4）に合わせ、傾いた瞬間に横へ広がる
    kingWobble: {
      frames: { interval: 400 },
      scaleX: { amplitude: 0.030,  period: 1600 },
      scaleY: { amplitude: -0.030, period: 1600 }
    },

    // --- コマ絵を使うとき ---
    //
    // 絵を2枚以上並べた種族に付ける。切り替える速さだけを決めればよい。
    //   slime: { sprite: ["slime1", "slime2"], motion: "frameNormal" }

    frameNormal: { frames: { interval: 200 } },

    /**
     * 地図を歩くプレイヤー。
     *
     * 2枚の絵（足の位置が1pxずれているだけ）を交互に出しながら、
     * 一歩ごとに軽く跳ねる。上半身は同じ絵なので、
     * 下半身だけが左右に振れて横歩きに見える。
     *
     * ★ 跳ねる period は interval と同じにしてある。
     *   足が入れ替わる瞬間に体がいちばん高くなるので、
     *   足を踏み出して体が浮く、という形になる。
     *   speed で書くと丸め誤差でだんだんずれるので、必ず period で書くこと。
     */
    playerWalk: {
      frames:  { interval: 150 },
      offsetY: { amplitude: -1, period: 150, wave: "bounce" }
    },

    // --- スライムの跳ねる動き（コマ絵と揺れを組み合わせた見本）---
    //
    // ★ コマ絵と上下の揺れを「ぴったり合わせる」書き方の例。
    //   コマ数 × interval ＝ 揺れの period にすると、
    //   地面に着いた瞬間に潰れ、跳んでいる間に伸びる、という形になる。
    //     4コマ × 220ms = 880ms ＝ period
    //   ここを合わせておけば、個体ごとに位相をずらしても崩れない。
    //   （speed で書くと丸めた誤差でだんだんずれるので、必ず period で書く）
    //
    //   絵は2枚描き足すだけでよい（潰れた姿・伸びた姿）。
    //   ふつうの姿は使い回すので、4コマの並びが2枚で作れる：
    //     sprite: ["slimeStretch", "slime", "slimeStretch", "slimeSquash"]
    //       0 …… 地面から昇る途中（伸びる）
    //       1 …… いちばん高いところ（ふつう）
    //       2 …… 落ちる途中（伸びる）
    //       3 …… 地面に着いた瞬間（潰れる）
    slimeIdle: {
      frames:  { interval: 220 },
      offsetY: { amplitude: -2.5, period: 880 }   // 220 × 4コマ
    },

    // ─────────────────────────────────────────
    // 1回だけ流れる動き（攻撃・被弾）
    //
    // duration を持つものが「1回流れて終わる」動き。上のものとは書き方が違う。
    //   amount … どれだけ動くか
    //   shape  … 出て戻るときの形
    //       "outBack"（既定）… 素早く出て、ゆっくり戻る。踏み込みらしい
    //           outRatio で「出きるまでの割合」を変えられる（既定 0.3）
    //       "pulse"          … なめらかに出て、なめらかに戻る
    //       "decay"          … 大きく始まり、揺れながら収まる。当たった衝撃らしい
    //           cycles で揺れる回数を変えられる（既定 2）
    //       "fade"           … 最大から、まっすぐ元へ戻るだけ
    //       "hops"           … count 回（既定2）、出て戻るを繰り返す（2回飛びかかる、など）
    //
    // 上下の向きは画面側が決める（相手のいる方向へ ±1 を掛ける）。
    // 戦闘は敵が上段・味方が下段なので、踏み込みは横ではなく縦になる。
    //
    // 種族ごとに変えたいときは data/monsters.js に1行：
    //   motions: { attack: "lunge", hit: "recoil" }
    // 書かなければ、その種族は攻撃・被弾で動かない。
    // ─────────────────────────────────────────

    // 踏み込む。相手の方へ素早く出て、ゆっくり戻る
    lunge: {
      duration: 300,
      offsetY: { amount: 26, shape: "outBack", outRatio: 0.28 },
      scale:   { amount: 0.08, shape: "outBack", outRatio: 0.28 }
    },

    // 技を放つ。踏み込みとの違いは「溜め」があること。
    //
    // windup は前半で相手と逆へ引き、後半で勢いよく出て戻る。
    // lunge より長く（460ms）、出る量は少なめにしてある。
    // ぶつかりに行く踏み込みではなく、その場から放つ動きに見せるため
    cast: {
      duration: 460,
      offsetY: { amount: 15,   shape: "windup", backRatio: 0.45 },
      scaleX:  { amount: 0.07, shape: "windup", backRatio: 0.45 },
      scaleY:  { amount: 0.09, shape: "windup", backRatio: 0.45 }
    },

    // --- 技の種類ごとの動き（RC-1。BattleScene._skillMotionKind が技の種類で選ぶ） ---

    // 共鳴。相手へは動かず、その場ですっと伸び上がって力を響かせる。
    // まわりには共鳴の演出（data/effects.js の resonance）が別に出る
    resonate: {
      duration: 640,
      offsetY: { amount: -8,   shape: "pulse" },
      scaleY:  { amount: 0.08, shape: "pulse" },
      scaleX:  { amount: -0.03, shape: "pulse" }
    },

    // ブレス。前半で吸い込んで（引いて膨らむ）、後半で相手へ向かって吐き出す
    exhale: {
      duration: 640,
      offsetY: { amount: 14,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.08, shape: "pulse" }
    },

    // 体技・斬撃・踊り。通常攻撃の踏み込みより、少し溜めてから勢いよく出る
    strike: {
      duration: 420,
      offsetY: { amount: 30,   shape: "windup", backRatio: 0.3 },
      scale:   { amount: 0.08, shape: "pulse" }
    },

    // 自分や味方にかける技（強化・回復）。相手の方へは動かず、その場で伸び上がる
    charge: {
      duration: 440,
      offsetY: { amount: -9,   shape: "pulse" },
      scaleY:  { amount: 0.11, shape: "pulse" },
      scaleX:  { amount: -0.04, shape: "pulse" }
    },

    // のけぞる。押された方へ飛んで、揺れながら収まる。同時に一瞬薄くなる
    recoil: {
      duration: 260,
      offsetY: { amount: 13, shape: "decay", cycles: 2 },
      alpha:   { amount: -0.45, shape: "fade" }
    },

    // --- 倒れる ---
    //
    // どれも shape: "rise" で、元に戻らずそのまま消える。
    // 終わったら描かないこと（BattleScene が「倒れ終わったか」を見ている）。

    // 倒れる（標準）。沈みながら縮んで消えていく
    fall: {
      duration: 460,
      offsetY: { amount: 20, shape: "rise" },
      scale:   { amount: -0.2, shape: "rise" },
      alpha:   { amount: -1, shape: "rise" }
    },

    // 落ちる。飛んでいるものが体勢を崩し、傾きながら落ちていく
    tumble: {
      duration: 520,
      offsetY: { amount: 32, shape: "rise" },
      rotate:  { amount: 0.35, shape: "rise" },
      alpha:   { amount: -1, shape: "rise" }
    },

    // 崩れる。重いものがその場で小さく潰れていく。あまり動かない
    crumble: {
      duration: 560,
      offsetY: { amount: 7, shape: "rise" },
      scale:   { amount: -0.5, shape: "rise" },
      alpha:   { amount: -1, shape: "rise" }
    },

    // 回復。ふわっと浮いて膨らみ、元へ戻る
    recover: {
      duration: 440,
      offsetY: { amount: -7, shape: "pulse" },
      scale:   { amount: 0.13, shape: "pulse" }
    },

    // レベルアップ：小さく跳ねる
    cheerHop: {
      duration: 520,
      offsetY: { amount: -20, shape: "pulse" },
      scale:   { amount: 0.07, shape: "pulse" }
    },

    // 防御中。1回で終わらず、防御しているあいだ続く（duration を持たない）
    //   offset で「縮こまった姿勢」そのものをずらすだけ。震えなどの動きは付けない（RC-1、作者の指定）。
    //   縮める基準は足元なので、小さくなっても浮かない
    guard: {
      scale: { offset: -0.08 }
    },

    // 回避。攻撃が外れた（命中しなかった・かわした）とき、横へさっと身をかわして戻る。
    //   回避率を持たない種族にも付く（外れはどの種族にも起こる。回避の装備も足す予定）。
    //   outBack … 素早く出て、ゆっくり戻る
    dodge: {
      duration: 400,
      offsetX: { amount: 24, outRatio: 0.25 },
      offsetY: { amount: -4, shape: "pulse" }
    },

    /**
     * 眠っている間のふだんの動き（data/statuses.js の sleep の idleMotion）。全種族共通。
     * 少し潰れて脱力した姿勢（offset）のまま、ゆっくり寝息を立てる（amplitude）。
     * pose: "sleep" … 種族が眠りの絵（data/monsters.js の poses.sleep）を持っていれば、その絵になる。
     *   持っていない種族は、ふつうの絵のまま脱力と寝息だけが付く
     */
    sleeping: {
      pose: "sleep",
      scaleY: { offset: -0.05, amplitude: 0.025, period: 2600 },
      scaleX: { offset: 0.03, amplitude: -0.012, period: 2600 }
    },

    // ─────────────────────────────────────────
    // スライム専用（RC-1）。絵を切り替える「姿」（poses）を使う見本。
    //
    //   poses: [{ at: 0〜1, pose: "姿の名前" }, ...]
    //     その割合（動きの長さに対する）を過ぎたら、その姿の絵に切り替わる。null でふつうの絵に戻る。
    //     姿の名前から絵への対応は、種族の data/monsters.js の poses に書く：
    //       poses: { squash: "slimeSquash", stretch: "slimeStretch", sleep: "slimeSleep" }
    //     姿の絵を持たない種族にこの動きを付けても、伸び縮み・ずれだけで壊れずに動く。
    //
    //   ★ 他の種族に同じ動きを付けるときは、絵を2枚（潰れた姿・伸びた姿）描き足して
    //     poses を書くだけでよい。動きの定義はこのまま使い回せる
    // ─────────────────────────────────────────

    // 通常攻撃（体当たり）。潰れて溜め → 伸びて飛びかかる → 当たって潰れる → 戻る
    slimeTackle: {
      duration: 460,
      offsetY: { amount: 28, shape: "windup", backRatio: 0.25 },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.25, pose: "stretch" },
        { at: 0.55, pose: "squash" },
        { at: 0.72, pose: null }
      ]
    },

    // 体技・斬撃・踊り。通常攻撃（1回跳ぶ）と見分けがつくよう、2回続けて飛びかかる（作者の指定）。
    //   shape: "hops" … count 回、出て戻るを繰り返す（Motion.js）。姿も1回ごとに 潰れる→伸びる→潰れる
    slimeTechnique: {
      duration: 760,
      offsetY: { amount: 30, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.06, pose: "stretch" },
        { at: 0.42, pose: "squash" },
        { at: 0.56, pose: "stretch" },
        { at: 0.92, pose: "squash" },
        { at: 0.98, pose: null }
      ]
    },

    // 共鳴。一度沈んでから、すっと縦に伸びて力を響かせる（その場から動かない）
    slimeResonate: {
      duration: 700,
      offsetY: { amount: -10, shape: "pulse" },
      scaleY:  { amount: 0.05, shape: "pulse" },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.15, pose: "stretch" },
        { at: 0.82, pose: null }
      ]
    },

    // ブレス。ぷくっと膨らんで吸い込み（ふつうの姿のまま大きく）、伸びて前へ吐き出す
    slimeBreath: {
      duration: 680,
      offsetY: { amount: 16,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.12, shape: "pulse" },
      poses: [
        { at: 0,    pose: null },
        { at: 0.5,  pose: "stretch" },
        { at: 0.82, pose: null }
      ]
    },

    // 自分・味方にかける技（立ち塞がる・王の号令など）。潰れてから伸び上がる
    slimeBuff: {
      duration: 500,
      offsetY: { amount: -10, shape: "pulse" },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.25, pose: "stretch" },
        { at: 0.72, pose: null }
      ]
    },

    // 被弾。ぐにゃっと潰れて押され、揺れながら戻る
    slimeHit: {
      duration: 320,
      offsetY: { amount: 12,   shape: "decay", cycles: 2 },
      alpha:   { amount: -0.4, shape: "fade" },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.45, pose: null }
      ]
    },

    // 回避。潰れてから伸びて、横へぴょんと跳んでかわす
    slimeDodge: {
      duration: 440,
      offsetX: { amount: 26, outRatio: 0.3 },
      offsetY: { amount: -10, shape: "pulse" },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.1,  pose: "stretch" },
        { at: 0.42, pose: "squash" },
        { at: 0.56, pose: null }
      ]
    },

    // 眠っている間（スライム専用）。全種族共通の sleeping より深く潰れて、ぐったり寝る。
    // 絵は目を閉じた姿（poses.sleep = slimeSleep）
    slimeSleeping: {
      pose: "sleep",
      scaleY: { offset: -0.12, amplitude: 0.03, period: 2600 },
      scaleX: { offset: 0.07, amplitude: -0.015, period: 2600 }
    },

    // ─────────────────────────────────────────
    // コウモリ専用（RC-1）。姿は up（翼を振り上げ）／down（振り下ろし）／sleep（目を閉じた姿）。
    // 飛んでいるので跳ねない。翼の上げ下げで勢いを見せる
    // ─────────────────────────────────────────

    // 通常攻撃（噛みつき）。翼を振り上げて溜め → 振り下ろして一気に襲いかかる
    batBite: {
      duration: 440,
      offsetY: { amount: 30, shape: "windup", backRatio: 0.3 },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.3,  pose: "down" },
        { at: 0.65, pose: null }
      ]
    },

    // 体技・斬撃・踊り。スライムと同じく、2回続けて襲いかかる（1回ごとに翼を打ち下ろす）
    batTechnique: {
      duration: 760,
      offsetY: { amount: 30, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.1,  pose: "down" },
        { at: 0.38, pose: "up" },
        { at: 0.6,  pose: "down" },
        { at: 0.88, pose: null }
      ]
    },

    // 共鳴。その場で少し舞い上がり、小刻みに羽ばたきながら力を響かせる
    batResonate: {
      duration: 700,
      offsetY: { amount: -14, shape: "pulse" },
      poses: [
        { at: 0,   pose: "up" },   { at: 0.1, pose: "down" },
        { at: 0.2, pose: "up" },   { at: 0.3, pose: "down" },
        { at: 0.4, pose: "up" },   { at: 0.5, pose: "down" },
        { at: 0.6, pose: "up" },   { at: 0.7, pose: "down" },
        { at: 0.8, pose: null }
      ]
    },

    // ブレス。翼を振り上げて身を引き（吸い込む）、振り下ろしながら前へ吐き出す
    batBreath: {
      duration: 660,
      offsetY: { amount: 14,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.5,  pose: "down" },
        { at: 0.85, pose: null }
      ]
    },

    // 自分・味方にかける技。その場で羽ばたいて浮き上がる
    batBuff: {
      duration: 520,
      offsetY: { amount: -12, shape: "pulse" },
      poses: [
        { at: 0,    pose: "down" }, { at: 0.15, pose: "up" },
        { at: 0.3,  pose: "down" }, { at: 0.45, pose: "up" },
        { at: 0.6,  pose: "down" }, { at: 0.78, pose: null }
      ]
    },

    // 被弾。翼を跳ね上げてのけぞり、揺れながら戻る
    batHit: {
      duration: 300,
      offsetY: { amount: 13,   shape: "decay", cycles: 2 },
      alpha:   { amount: -0.45, shape: "fade" },
      poses: [
        { at: 0,   pose: "up" },
        { at: 0.5, pose: null }
      ]
    },

    // 回避。翼をひと打ちして、横へひらりと逃げる
    batDodge: {
      duration: 380,
      offsetX: { amount: 28, outRatio: 0.22 },
      offsetY: { amount: -8, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.12, pose: "down" },
        { at: 0.4,  pose: "up" },
        { at: 0.55, pose: null }
      ]
    },

    // レベルアップ。羽ばたきながら、その場で一回転（rotate の一回転に翼の上げ下げを足したもの）
    batCheer: {
      duration: 560,
      rotate:  { amount: 1,   shape: "rise" },
      offsetY: { amount: -12, shape: "pulse" },
      poses: [
        { at: 0,   pose: "up" },   { at: 0.2, pose: "down" },
        { at: 0.4, pose: "up" },   { at: 0.6, pose: "down" },
        { at: 0.8, pose: "up" },   { at: 0.95, pose: null }
      ]
    },

    // 眠っている間。図鑑の記録「昼は天井の割れ目に逆さに下がって眠る」のとおり、逆さになって眠る。
    //   rotate の offset 0.5 ＝ 半回転（逆さ）。そこから小さく揺れる（ぶら下がっている感じ）
    batSleeping: {
      pose: "sleep",
      rotate: { offset: 0.5, amplitude: 0.012, period: 3200 },
      scaleY: { offset: -0.02, amplitude: 0.02, period: 2600 }
    },

    // レベルアップ。潰れて溜め、伸びて跳び上がり、潰れて着地する
    slimeCheer: {
      duration: 600,
      offsetY: { amount: -24, shape: "pulse" },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.12, pose: "stretch" },
        { at: 0.8,  pose: "squash" },
        { at: 0.92, pose: null }
      ]
    },

    // ─────────────────────────────────────────
    // コケネズミ専用（RC-1）。姿は crouch（身構えて背を低く）／stretch（伸び上がる）／sleep（丸まって目を閉じる）。
    // すばしこい小動物なので、どの動きもスライムより短く、キビキビ動く
    // ─────────────────────────────────────────

    // 通常攻撃（噛みつき）。身を低くして溜め → 伸びて素早く飛びかかる
    ratBite: {
      duration: 400,
      offsetY: { amount: 30, shape: "windup", backRatio: 0.3 },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.3,  pose: "stretch" },
        { at: 0.6,  pose: "crouch" },
        { at: 0.75, pose: null }
      ]
    },

    // 体技・斬撃・踊り。2回続けて飛びかかる（スライム・コウモリと同じ決まり）
    ratTechnique: {
      duration: 700,
      offsetY: { amount: 30, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.06, pose: "stretch" },
        { at: 0.42, pose: "crouch" },
        { at: 0.56, pose: "stretch" },
        { at: 0.92, pose: "crouch" },
        { at: 0.98, pose: null }
      ]
    },

    // 共鳴。身を低くしてから後ろ足で立ち上がり、耳を立てて力を響かせる（その場から動かない）
    ratResonate: {
      duration: 700,
      offsetY: { amount: -8,   shape: "pulse" },
      scaleY:  { amount: 0.04, shape: "pulse" },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.15, pose: "stretch" },
        { at: 0.82, pose: null }
      ]
    },

    // ブレス。身を縮めて吸い込み、伸び上がりながら前へ吐き出す
    ratBreath: {
      duration: 640,
      offsetY: { amount: 14,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.08, shape: "pulse" },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.5,  pose: "stretch" },
        { at: 0.85, pose: null }
      ]
    },

    // 自分・味方にかける技。身構えてから、ぴょんと伸び上がる
    ratBuff: {
      duration: 480,
      offsetY: { amount: -12, shape: "pulse" },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.22, pose: "stretch" },
        { at: 0.72, pose: null }
      ]
    },

    // 被弾。身をすくめて押され、揺れながら戻る
    ratHit: {
      duration: 300,
      offsetY: { amount: 12,   shape: "decay", cycles: 2 },
      alpha:   { amount: -0.4, shape: "fade" },
      poses: [
        { at: 0,   pose: "crouch" },
        { at: 0.5, pose: null }
      ]
    },

    // 回避。身を低くしてから、横へ素早く跳んでかわす
    ratDodge: {
      duration: 360,
      offsetX: { amount: 28, outRatio: 0.25 },
      offsetY: { amount: -8, shape: "pulse" },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.08, pose: "stretch" },
        { at: 0.38, pose: "crouch" },
        { at: 0.52, pose: null }
      ]
    },

    // レベルアップ。喜んでその場で2回跳ねる（1回ごとに 身構える → 伸びる）
    ratCheer: {
      duration: 640,
      offsetY: { amount: -20, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.06, pose: "stretch" },
        { at: 0.42, pose: "crouch" },
        { at: 0.56, pose: "stretch" },
        { at: 0.92, pose: "crouch" },
        { at: 0.98, pose: null }
      ]
    },

    // 眠っている間。丸まって（背の低い姿で目を閉じる）小さく寝息を立てる。跳ねるのは止まる
    ratSleeping: {
      pose: "sleep",
      scaleY: { offset: -0.03, amplitude: 0.03, period: 2400 },
      scaleX: { offset: 0.02,  amplitude: -0.015, period: 2400 }
    },

    // ─────────────────────────────────────────
    // イワゴロー専用（RC-1）。姿は narrow（細目）／wince・sleep（目を閉じる）。
    // 岩なので潰れも伸びもしない。図鑑の記録「重くて、遅くて、動じない」「呼ぶと少しだけ転がってくる」のとおり、
    // 溜めを長く取って、転がる（rotate）・揺れる・ドスンと重い、で見せる。どの動きもほかより少し長い
    // ─────────────────────────────────────────

    // 通常攻撃（体当たり）。細目でじっくり身を引き、ごろんと転がってぶつかる
    rockTackle: {
      duration: 560,
      offsetY: { amount: 26,   shape: "windup", backRatio: 0.45 },
      rotate:  { amount: 0.07, shape: "windup", backRatio: 0.45 },
      poses: [
        { at: 0,    pose: "narrow" },
        { at: 0.7,  pose: null }
      ]
    },

    // 体技・斬撃・踊り。2回続けて転がってぶつかる（ほかの種族と同じ決まり）。1回ごとに揺り戻す
    rockTechnique: {
      duration: 880,
      offsetY: { amount: 26,   shape: "hops", count: 2 },
      rotate:  { amount: 0.06, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "narrow" },
        { at: 0.9,  pose: null }
      ]
    },

    // 共鳴。その場で細目になり、地響きのように小刻みに震えて力を響かせる（動かない）
    rockResonate: {
      duration: 760,
      offsetX: { amount: 3,     shape: "wobble", cycles: 7 },
      scale:   { amount: 0.04,  shape: "pulse" },
      poses: [
        { at: 0,    pose: "narrow" },
        { at: 0.85, pose: null }
      ]
    },

    // ブレス。ぐっと膨らんで吸い込み（細目）、目を開いて前へ吐き出す
    rockBreath: {
      duration: 720,
      offsetY: { amount: 12,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.08, shape: "pulse" },
      poses: [
        { at: 0,    pose: "narrow" },
        { at: 0.5,  pose: null }
      ]
    },

    // 自分・味方にかける技。細目で少し浮いて、ドスンと座り直す（踏ん張る）
    rockBuff: {
      duration: 560,
      offsetY: { amount: -8, shape: "pulse" },
      poses: [
        { at: 0,    pose: "narrow" },
        { at: 0.8,  pose: null }
      ]
    },

    // 被弾。ほとんど動じない。目をつぶって、わずかに押されるだけ
    rockHit: {
      duration: 320,
      offsetY: { amount: 5,     shape: "decay", cycles: 2 },
      alpha:   { amount: -0.35, shape: "fade" },
      poses: [
        { at: 0,   pose: "wince" },
        { at: 0.6, pose: null }
      ]
    },

    // 回避。重いので素早くはよけない。少しだけ横へ転がって外す
    rockDodge: {
      duration: 520,
      offsetX: { amount: 16,   outRatio: 0.35 },
      rotate:  { amount: 0.05, outRatio: 0.35 }
    },

    // レベルアップ・スカウトに応じたとき。ドスン、ドスンと重く2回跳ねる
    rockCheer: {
      duration: 900,
      offsetY: { amount: -12, shape: "hops", count: 2 }
    },

    // 眠っている間。目を閉じて、ほとんど動かない（図鑑の「考えているのか眠っているのか、見分けがつかない」）。
    // 寝息もごくわずか
    rockSleeping: {
      pose: "sleep",
      scaleY: { offset: -0.01, amplitude: 0.006, period: 5200 }
    },

    // ─────────────────────────────────────────
    // ヒカリムシ専用（RC-1）。姿は up／down（翅の上げ下げ）・bright（尾が明るく光る）・sleep（目を閉じて光が弱まる）。
    // 小さく軽い虫なので、コウモリより速く小刻みに動く。光の技・喜ぶときは尾を明るく光らせる
    // ─────────────────────────────────────────

    // 通常攻撃（体当たり）。翅を振り上げて溜め → 小さくジグザグに揺れながら突っ込む
    bugDive: {
      duration: 420,
      offsetY: { amount: 28, shape: "windup", backRatio: 0.3 },
      offsetX: { amount: 5,  shape: "wobble", cycles: 2 },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.3,  pose: "down" },
        { at: 0.45, pose: "up" },
        { at: 0.6,  pose: "down" },
        { at: 0.75, pose: null }
      ]
    },

    // 体技・斬撃・踊り。2回続けて突っ込む（ほかの種族と同じ決まり）。1回ごとに翅を打つ
    bugTechnique: {
      duration: 720,
      offsetY: { amount: 28, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.1,  pose: "down" },
        { at: 0.38, pose: "up" },
        { at: 0.6,  pose: "down" },
        { at: 0.88, pose: null }
      ]
    },

    // 共鳴。その場で少し舞い上がり、尾をいちばん明るく光らせてふくらむ（光を響かせる）
    bugResonate: {
      duration: 700,
      offsetY: { amount: -10,  shape: "pulse" },
      scale:   { amount: 0.08, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.12, pose: "bright" },
        { at: 0.85, pose: null }
      ]
    },

    // ブレス。翅を振り上げて身を引き（吸い込む）、振り下ろしながら前へ吐き出す
    bugBreath: {
      duration: 620,
      offsetY: { amount: 12,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.5,  pose: "down" },
        { at: 0.85, pose: null }
      ]
    },

    // 自分・味方にかける技（導きの光など）。小刻みに羽ばたいて浮き、最後に尾をぱっと光らせる
    bugBuff: {
      duration: 560,
      offsetY: { amount: -12, shape: "pulse" },
      poses: [
        { at: 0,    pose: "down" }, { at: 0.1, pose: "up" },
        { at: 0.2,  pose: "down" }, { at: 0.3, pose: "up" },
        { at: 0.4,  pose: "bright" },
        { at: 0.85, pose: null }
      ]
    },

    // 被弾。翅を跳ね上げて弾き飛ばされ、揺れながら戻る（軽いので大きめに押される）
    bugHit: {
      duration: 300,
      offsetY: { amount: 15,    shape: "decay", cycles: 2 },
      alpha:   { amount: -0.45, shape: "fade" },
      poses: [
        { at: 0,   pose: "up" },
        { at: 0.5, pose: null }
      ]
    },

    // 回避。小さく速いので、翅を打って横へすばやく逃げる
    bugDodge: {
      duration: 340,
      offsetX: { amount: 30, outRatio: 0.2 },
      offsetY: { amount: -6, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },   { at: 0.1, pose: "down" },
        { at: 0.25, pose: "up" },   { at: 0.4, pose: "down" },
        { at: 0.55, pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。図鑑「褒めると明るく光る」のとおり、尾を明るく光らせて跳ね上がる
    bugCheer: {
      duration: 640,
      offsetY: { amount: -16,  shape: "pulse" },
      scale:   { amount: 0.08, shape: "pulse" },
      poses: [
        { at: 0,    pose: "bright" },
        { at: 0.92, pose: null }
      ]
    },

    // 眠っている間。目を閉じて尾の光が弱まり（消えかけの火）、ゆっくり、低く漂う
    bugSleeping: {
      pose: "sleep",
      offsetY: { offset: 3, amplitude: -1.2, period: 3000 },
      alpha:   { amplitude: -0.15, period: 3000 }
    },

    // ─────────────────────────────────────────
    // キノコン専用（RC-1）。姿は squash（縮む）／stretch（伸びる）／sleep（縮んで目を閉じる）。
    // 根が生えているので、その場から大きくは動かない。体を傾けたり、縮んで伸びたりして見せる。
    // 胞子の技（ブレス）は図鑑の「くしゃみが止まらない」のとおり、くしゃみで撒く
    // ─────────────────────────────────────────

    // 通常攻撃（体当たり）。縮んで溜め → 伸びて笠から突っ込む（少し前へ傾く）
    shroomBonk: {
      duration: 480,
      offsetY: { amount: 26,   shape: "windup", backRatio: 0.3 },
      rotate:  { amount: 0.02, shape: "windup", backRatio: 0.3 },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.3,  pose: "stretch" },
        { at: 0.6,  pose: "squash" },
        { at: 0.75, pose: null }
      ]
    },

    // 体技・斬撃・踊り。2回続けて突っ込む（ほかの種族と同じ決まり）
    shroomTechnique: {
      duration: 760,
      offsetY: { amount: 26, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.06, pose: "stretch" },
        { at: 0.42, pose: "squash" },
        { at: 0.56, pose: "stretch" },
        { at: 0.92, pose: "squash" },
        { at: 0.98, pose: null }
      ]
    },

    // 共鳴。縮んでから伸び上がり、笠を小刻みにふるわせて力を響かせる（その場から動かない）
    shroomResonate: {
      duration: 720,
      offsetX: { amount: 2,    shape: "wobble", cycles: 5 },
      scaleY:  { amount: 0.04, shape: "pulse" },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.15, pose: "stretch" },
        { at: 0.82, pose: null }
      ]
    },

    // ブレス（胞子の技）。くしゃみ。縮んで息を吸い（溜めを長く）、伸びながら「はっくしょん」と前へつんのめる
    shroomSneeze: {
      duration: 680,
      offsetY: { amount: 14,   shape: "windup", backRatio: 0.55 },
      rotate:  { amount: 0.03, shape: "windup", backRatio: 0.55 },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.55, pose: "stretch" },
        { at: 0.8,  pose: null }
      ]
    },

    // 自分・味方にかける技。縮んでから、ぐっと伸び上がる
    shroomBuff: {
      duration: 520,
      offsetY: { amount: -8, shape: "pulse" },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.25, pose: "stretch" },
        { at: 0.75, pose: null }
      ]
    },

    // 被弾。縮こまって押され、揺れながら戻る
    shroomHit: {
      duration: 320,
      offsetY: { amount: 11,   shape: "decay", cycles: 2 },
      alpha:   { amount: -0.4, shape: "fade" },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.5,  pose: null }
      ]
    },

    // 回避。根が生えているので跳んではよけない。体を横へしならせて（傾けて）かわす
    shroomDodge: {
      duration: 460,
      offsetX: { amount: 10,   outRatio: 0.3 },
      rotate:  { amount: 0.05, outRatio: 0.3 }
    },

    // レベルアップ・スカウトに応じたとき。縮んで伸びてを2回くり返し、ぴょこぴょこ喜ぶ
    shroomCheer: {
      duration: 760,
      offsetY: { amount: -12, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.06, pose: "stretch" },
        { at: 0.42, pose: "squash" },
        { at: 0.56, pose: "stretch" },
        { at: 0.92, pose: "squash" },
        { at: 0.98, pose: null }
      ]
    },

    // 眠っている間。縮んで目を閉じ（図鑑「笠を閉じて、じっとしている」）、ゆっくり傾くだけ
    shroomSleeping: {
      pose: "sleep",
      rotate: { amplitude: 0.004, period: 4200 },
      scaleY: { amplitude: 0.015, period: 2800 }
    },

    // ─────────────────────────────────────────
    // モスゴーレム専用（RC-1）。姿は narrow（細目）／sleep（目の光が消える）。形は変えず、目だけ変わる。
    // 石の巨人なので、どの動きも溜めが長く、ゆっくり重い。飛び跳ねない
    // ─────────────────────────────────────────

    // 通常攻撃。細目で大きく身を引いて溜め、ずしんと踏み込んで叩きつける
    golemSlam: {
      duration: 680,
      offsetY: { amount: 24,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.04, shape: "windup", backRatio: 0.5 },
      poses: [
        { at: 0,    pose: "narrow" },
        { at: 0.62, pose: null }
      ]
    },

    // 体技・斬撃・踊り。2回続けて踏み込む（ほかの種族と同じ決まり）
    golemTechnique: {
      duration: 1000,
      offsetY: { amount: 22, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "narrow" },
        { at: 0.92, pose: null }
      ]
    },

    // 共鳴。細目で力を溜め、目を見開くと同時に体が地響きのように震える（その場から動かない）
    golemResonate: {
      duration: 800,
      offsetX: { amount: 3,    shape: "wobble", cycles: 6 },
      scale:   { amount: 0.04, shape: "pulse" },
      poses: [
        { at: 0,    pose: "narrow" },
        { at: 0.3,  pose: null }
      ]
    },

    // ブレス。ゆっくり胸をふくらませて吸い込み（細目）、目を開いて前へ吐き出す
    golemBreath: {
      duration: 760,
      offsetY: { amount: 10,   shape: "windup", backRatio: 0.55 },
      scale:   { amount: 0.07, shape: "pulse" },
      poses: [
        { at: 0,    pose: "narrow" },
        { at: 0.55, pose: null }
      ]
    },

    // 自分・味方にかける技。細目で胸を張り、ぐっと背を伸ばす
    golemBuff: {
      duration: 640,
      scaleY:  { amount: 0.05, shape: "pulse" },
      offsetY: { amount: -4,   shape: "pulse" },
      poses: [
        { at: 0,    pose: "narrow" },
        { at: 0.8,  pose: null }
      ]
    },

    // 被弾。巨体なのでほとんど揺るがない。目を細めて、わずかに押されるだけ
    golemHit: {
      duration: 320,
      offsetY: { amount: 4,    shape: "decay", cycles: 2 },
      alpha:   { amount: -0.3, shape: "fade" },
      poses: [
        { at: 0,   pose: "narrow" },
        { at: 0.6, pose: null }
      ]
    },

    // 回避。ゆっくり半歩ずれて外す（足が遅いので大きくは動かない）
    golemDodge: {
      duration: 600,
      offsetX: { amount: 12,    outRatio: 0.4 },
      rotate:  { amount: 0.015, outRatio: 0.4 }
    },

    // レベルアップ・スカウトに応じたとき。跳ねずに、巨体をゆさゆさと左右に揺らして喜ぶ
    golemCheer: {
      duration: 900,
      rotate:  { amount: 0.025, shape: "wobble", cycles: 2 },
      offsetY: { amount: -6,    shape: "pulse" }
    },

    // 眠っている間。目の光が消え、石像のようにほとんど動かない。呼吸はふだんよりさらに遅い
    golemSleeping: {
      pose: "sleep",
      scaleY: { amplitude: 0.012, period: 7000 }
    },

    // ─────────────────────────────────────────
    // マグマウルフ専用（RC-1、作り直し）。頭・あご・脚・尻尾の炎を動かす。
    // 姿（data/monsters.js の poses）：
    //   crouch（脚を縮めて頭を下げる）／leap（脚を前後へ伸ばし口を開ける）／bite（頭を下げて大きく噛む）
    //   runA・runB（走る2コマ）／howl（頭を上げて吠える。炎が明るい）／breath（頭を下げて口を大きく開ける）
    //   flinch（頭を引いて目をつぶる）／sleep（伏せて目を閉じ、炎が熾火に）
    // 図鑑「たてがみの炎は、怒ると強まり、眠ると熾火のように小さくなる」。捕食者なので、溜めは短く、飛びかかりは速く大きい
    // ─────────────────────────────────────────

    // 通常攻撃（噛みつき）。身を縮めて溜め → 脚を伸ばして飛びかかる → 頭を下げて噛みつく
    wolfPounce: {
      duration: 520,
      offsetY: { amount: 34, shape: "windup", backRatio: 0.35 },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.35, pose: "leap" },
        { at: 0.58, pose: "bite" },
        { at: 0.82, pose: null }
      ]
    },

    // 体技・斬撃・踊り（作者の指定で、2回飛びかかる形とは別の動き）。
    // 走り込み：身を縮めてから、脚を開く・集めるを繰り返して駆け寄り、跳んで噛みつく。左右にも少し揺れる
    wolfTechnique: {
      duration: 860,
      offsetY: { amount: 38,  shape: "windup", backRatio: 0.2 },
      offsetX: { amount: 3,   shape: "wobble", cycles: 3 },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.18, pose: "runA" }, { at: 0.28, pose: "runB" },
        { at: 0.38, pose: "runA" }, { at: 0.48, pose: "runB" },
        { at: 0.58, pose: "leap" },
        { at: 0.7,  pose: "bite" },
        { at: 0.88, pose: null }
      ]
    },

    // 共鳴（火の粉など）。身を縮めてから頭を上げて吠え、炎を燃え上がらせる（その場から動かない）
    wolfResonate: {
      duration: 760,
      offsetX: { amount: 1.5,  shape: "wobble", cycles: 5 },
      offsetY: { amount: -5,   shape: "pulse" },
      scale:   { amount: 0.04, shape: "pulse" },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.18, pose: "howl" },
        { at: 0.86, pose: null }
      ]
    },

    // ブレス（火の息）。頭を上げて吸い込み（身を引く）、頭を下げて大きく口を開け、前へ吐き出す
    wolfBreath: {
      duration: 720,
      offsetY: { amount: 14,   shape: "windup", backRatio: 0.45 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "howl" },
        { at: 0.45, pose: "breath" },
        { at: 0.9,  pose: null }
      ]
    },

    // 自分・味方にかける技。身を縮めてから、頭を上げて吠える
    wolfBuff: {
      duration: 600,
      scaleY:  { amount: 0.04, shape: "pulse" },
      offsetY: { amount: -6,   shape: "pulse" },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.22, pose: "howl" },
        { at: 0.85, pose: null }
      ]
    },

    // 被弾。頭を引いて目をつぶり、尻尾がすくむ。押されて揺れながら戻る
    wolfHit: {
      duration: 340,
      offsetY: { amount: 12,   shape: "decay", cycles: 2 },
      alpha:   { amount: -0.4, shape: "fade" },
      poses: [
        { at: 0,   pose: "flinch" },
        { at: 0.7, pose: null }
      ]
    },

    // 回避。身を縮め、脚を伸ばして横へ跳び、脚を集めて着地する
    wolfDodge: {
      duration: 400,
      offsetX: { amount: 32, outRatio: 0.22 },
      offsetY: { amount: -8, shape: "pulse" },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.1,  pose: "runA" },
        { at: 0.42, pose: "runB" },
        { at: 0.6,  pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。2回跳ねながら尻尾の炎を大きく振り、最後に吠えて喜ぶ
    // （図鑑「それでも頭を差し出してくる」）
    wolfCheer: {
      duration: 760,
      offsetY: { amount: -14, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "idleA" }, { at: 0.12, pose: "idleB" },
        { at: 0.24, pose: "idleA" }, { at: 0.36, pose: "idleB" },
        { at: 0.48, pose: "idleA" }, { at: 0.6,  pose: "idleB" },
        { at: 0.72, pose: "howl" },
        { at: 0.95, pose: null }
      ]
    },

    // 眠っている間。伏せて目を閉じ、炎が熾火になる。獣らしくゆっくり深い寝息を立てる
    wolfSleeping: {
      pose: "sleep",
      scaleY: { offset: -0.01, amplitude: 0.025, period: 3200 },
      scaleX: { offset: 0.01,  amplitude: -0.01, period: 3200 }
    },

    // ─────────────────────────────────────────
    // キングスライム専用（RC-1、作り直し）。王冠・目・口・ゼリーの体を動かす。
    // 姿（data/monsters.js の poses）：
    //   squash（王冠ごと沈む）／stretch（細くなって口を開ける。縦の伸びは scaleY で足す）／pop（体だけ沈み、王冠が浮く）
    //   roar（口を大きく開ける）／leanL・leanR（体が傾き王冠も傾く）／ouch（目を閉じ王冠がずれる）
    //   calm（目を閉じる）／happy（笑い目）／sleep（沈んで目を閉じ、王冠が傾く）
    // 大きく重いゼリーなので、スライムより溜めが長く、着地で大きく揺れる
    // ─────────────────────────────────────────

    // 通常攻撃（体当たり）。沈んで溜め → 細く伸びて口を開けて飛びかかる → 着地の衝撃で王冠が浮く
    kingTackle: {
      duration: 580,
      offsetY: { amount: 30,   shape: "windup", backRatio: 0.35 },
      scaleY:  { amount: 0.08, shape: "windup", backRatio: 0.35 },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.3,  pose: "stretch" },
        { at: 0.6,  pose: "pop" },
        { at: 0.76, pose: "squash" },
        { at: 0.88, pose: null }
      ]
    },

    // 体技・斬撃・踊り（ボディプレスなど。作者の指定で、2回飛びかかる形とは別の動き）。
    // 大きく1回跳び上がって（lift）口を開けたまま相手の上へ落ち、どすんと着地して王冠が浮き、ゼリーが揺れる
    kingTechnique: {
      duration: 920,
      offsetY: { amount: 30,   shape: "windup", backRatio: 0.2 },
      lift:    { amount: 26,   shape: "pulse" },
      scaleY:  { amount: 0.09, shape: "pulse" },
      scaleX:  { amount: 0.06, shape: "wobble", cycles: 3 },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.16, pose: "stretch" },
        { at: 0.58, pose: "pop" },
        { at: 0.7,  pose: "squash" },
        { at: 0.8,  pose: "leanL" },
        { at: 0.88, pose: "leanR" },
        { at: 0.96, pose: null }
      ]
    },

    // 共鳴（アクアなど）。目を閉じて集中し、ゼリーを左右にぷるぷる震わせて力を響かせる（その場から動かない）
    kingResonate: {
      duration: 780,
      scaleY:  { amount: 0.06, shape: "pulse" },
      scaleX:  { amount: 0.04, shape: "wobble", cycles: 4 },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.12, pose: "calm" },
        { at: 0.88, pose: null }
      ]
    },

    // ブレス。沈んで吸い込み、ぷくっと膨らみながら口を大きく開けて前へ吐き出す
    kingBreath: {
      duration: 720,
      offsetY: { amount: 14,   shape: "windup", backRatio: 0.45 },
      scale:   { amount: 0.10, shape: "pulse" },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.42, pose: "roar" },
        { at: 0.9,  pose: null }
      ]
    },

    // 自分・味方にかける技（王の号令など）。沈んでから、縦にぐっと伸び上がって口を開けて号令する
    kingBuff: {
      duration: 660,
      offsetY: { amount: -8,   shape: "pulse" },
      scaleY:  { amount: 0.10, shape: "pulse" },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.2,  pose: "roar" },
        { at: 0.85, pose: null }
      ]
    },

    // 被弾。目をつぶって王冠がずれ、ゼリーの体がぶるんと揺れて戻る
    kingHit: {
      duration: 400,
      offsetY: { amount: 9,    shape: "decay", cycles: 2 },
      scaleX:  { amount: 0.08, shape: "decay", cycles: 3 },
      alpha:   { amount: -0.35, shape: "fade" },
      poses: [
        { at: 0,   pose: "ouch" },
        { at: 0.6, pose: null }
      ]
    },

    // 回避。大きな体を横へぬるりと滑らせてかわす。動き出しは上が遅れて傾き、戻りで逆へ傾く
    kingDodge: {
      duration: 500,
      offsetX: { amount: 20,   outRatio: 0.3 },
      scaleX:  { amount: 0.08, shape: "pulse" },
      poses: [
        { at: 0,    pose: "leanL" },
        { at: 0.35, pose: "leanR" },
        { at: 0.65, pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。図鑑「甘えるときは普通のスライムと変わらない」のとおり、
    // スライムと同じく 沈む → 跳ぶ → 沈んで着地 で喜ぶ。跳んでいるあいだは笑い目
    kingCheer: {
      duration: 660,
      offsetY: { amount: -20,  shape: "pulse" },
      scaleY:  { amount: 0.08, shape: "pulse" },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.12, pose: "happy" },
        { at: 0.8,  pose: "squash" },
        { at: 0.9,  pose: "happy" }
      ]
    },

    // 眠っている間。王冠ごと沈んで目を閉じ、大きな体でゆっくり寝息を立てる
    kingSleeping: {
      pose: "sleep",
      scaleX: { offset: 0.03,  amplitude: 0.025,  period: 3400 },
      scaleY: { offset: -0.02, amplitude: -0.025, period: 3400 }
    },

    // ─────────────────────────────────────────
    // ハイバネ専用（RC-1、作り直し）。翼を付け根で回したコマで羽ばたく。
    // 姿は up（少し振り上げ）／out（外へ）／mid（斜め）／flat（真横）／down（振り下ろし）／fold（たたむ）／sleep。
    // 羽ばたき1回 ＝ up → out → flat → down → flat → out（下の技は、この並びを速さを変えて使う）。
    // いちばん速く、体は軽く脆い。図鑑「いつも一番に飛び込んでいく」のとおり、溜めは短く、動きは鋭い
    // ─────────────────────────────────────────

    // 通常攻撃（斬撃のくちばし）。翼を振り上げ、一気に打ち下ろし、振り下ろしたまま一直線に突っ込む
    ashDive: {
      duration: 420,
      offsetY: { amount: 34, shape: "windup", backRatio: 0.25 },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.16, pose: "out" },
        { at: 0.22, pose: "flat" },
        { at: 0.28, pose: "down" },
        { at: 0.62, pose: "mid" },
        { at: 0.74, pose: null }
      ]
    },

    // 体技・斬撃・踊り（作者の指定で、ほかの種族の「2回突っ込む」とは別の動きにした）。
    // 旋回して突っ込む：横へ弧を描いて舞い上がりながら2回大きく羽ばたき、体を傾け、翼を振り下ろしたまま斜めに急降下する。
    //   offsetX pulse … 横へ出て戻る　／　offsetY windup … 身を引いてから前へ　→ 2つが重なって弧になる
    //   rotate pulse  … 旋回するときの体の傾き
    ashSwoop: {
      duration: 780,
      offsetX: { amount: 36,   shape: "pulse" },
      offsetY: { amount: 34,   shape: "windup", backRatio: 0.45 },
      rotate:  { amount: 0.07, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },   { at: 0.05, pose: "out" },  { at: 0.1,  pose: "flat" },
        { at: 0.15, pose: "down" }, { at: 0.2,  pose: "flat" }, { at: 0.25, pose: "out" },
        { at: 0.3,  pose: "up" },   { at: 0.35, pose: "out" },  { at: 0.4,  pose: "flat" },
        { at: 0.45, pose: "down" }, { at: 0.5,  pose: "flat" }, { at: 0.54, pose: "up" },
        { at: 0.6,  pose: "down" },
        { at: 0.88, pose: "mid" },
        { at: 0.95, pose: null }
      ]
    },

    // 共鳴（ウィンドなど）。熱に乗ってふわりと舞い上がり、速く羽ばたいて風を起こす（その場から動かない）
    ashResonate: {
      duration: 720,
      offsetY: { amount: -14, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },   { at: 0.04, pose: "out" },  { at: 0.08, pose: "flat" },
        { at: 0.12, pose: "down" }, { at: 0.16, pose: "flat" }, { at: 0.2,  pose: "out" },
        { at: 0.24, pose: "up" },   { at: 0.28, pose: "out" },  { at: 0.32, pose: "flat" },
        { at: 0.36, pose: "down" }, { at: 0.4,  pose: "flat" }, { at: 0.44, pose: "out" },
        { at: 0.48, pose: "up" },   { at: 0.52, pose: "out" },  { at: 0.56, pose: "flat" },
        { at: 0.6,  pose: "down" }, { at: 0.64, pose: "flat" }, { at: 0.68, pose: "out" },
        { at: 0.72, pose: "up" },   { at: 0.8,  pose: null }
      ]
    },

    // ブレス。翼を振り上げて身を引き（吸い込む）、打ち下ろしながら前へ吐き出す
    ashBreath: {
      duration: 640,
      offsetY: { amount: 14,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.46, pose: "out" },
        { at: 0.5,  pose: "flat" },
        { at: 0.55, pose: "down" },
        { at: 0.8,  pose: "mid" },
        { at: 0.88, pose: null }
      ]
    },

    // 自分・味方にかける技。大きく2回羽ばたいて、ふわりと浮き上がる
    ashBuff: {
      duration: 560,
      offsetY: { amount: -12, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },   { at: 0.07, pose: "out" },  { at: 0.14, pose: "flat" },
        { at: 0.21, pose: "down" }, { at: 0.28, pose: "flat" }, { at: 0.35, pose: "out" },
        { at: 0.42, pose: "up" },   { at: 0.49, pose: "out" },  { at: 0.56, pose: "flat" },
        { at: 0.63, pose: "down" }, { at: 0.7,  pose: "flat" }, { at: 0.8,  pose: null }
      ]
    },

    // 被弾。体が軽く脆いので大きく弾かれ、翼が跳ね上がってから遅れて戻る
    ashHit: {
      duration: 340,
      offsetY: { amount: 16,    shape: "decay", cycles: 2 },
      alpha:   { amount: -0.45, shape: "fade" },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.35, pose: "out" },
        { at: 0.55, pose: null }
      ]
    },

    // 回避。いちばん速いので、翼をひと打ちして横へすばやく抜ける
    ashDodge: {
      duration: 360,
      offsetX: { amount: 34, outRatio: 0.2 },
      offsetY: { amount: -8, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.08, pose: "flat" },
        { at: 0.16, pose: "down" },
        { at: 0.4,  pose: "flat" },
        { at: 0.5,  pose: "out" },
        { at: 0.6,  pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。図鑑「羽の灰を払ってやると喜ぶ」のとおり、
    // ふわりと浮いて、体をぶるぶる震わせながら速く羽ばたいて灰を払う
    ashCheer: {
      duration: 700,
      offsetY: { amount: -14, shape: "pulse" },
      offsetX: { amount: 3,   shape: "wobble", cycles: 5 },
      poses: [
        { at: 0,    pose: "up" },   { at: 0.05, pose: "out" },  { at: 0.1,  pose: "flat" },
        { at: 0.15, pose: "down" }, { at: 0.2,  pose: "flat" }, { at: 0.25, pose: "out" },
        { at: 0.3,  pose: "up" },   { at: 0.35, pose: "out" },  { at: 0.4,  pose: "flat" },
        { at: 0.45, pose: "down" }, { at: 0.5,  pose: "flat" }, { at: 0.55, pose: "out" },
        { at: 0.6,  pose: "up" },   { at: 0.65, pose: "flat" }, { at: 0.7,  pose: "down" },
        { at: 0.85, pose: null }
      ]
    },

    // 眠っている間。翼をたたみ（図鑑「冷えた場所では、羽をたたんで歩く」）、目を閉じて低く、ゆっくり漂う
    ashSleeping: {
      pose: "sleep",
      offsetY: { offset: 4, amplitude: -1.2, period: 3400 }
    },

    // ─────────────────────────────────────────
    // ヒビイワ専用（RC-1）。姿は narrow（細目）／hot（細目＋ひびの熱が噴き出す）／sleep（目を閉じ、ひびが冷える）。
    // イワゴローと同じ岩なので潰れも伸びもしない。重さはイワゴローと同じくらいで、力を込めるとひびが燃える。
    // 脆い（図鑑「石をぶつけられるのを嫌う」）ので、被弾ではイワゴローより大きく揺れる
    // ─────────────────────────────────────────

    // 通常攻撃（体当たり）。ひびを燃やして身を引き、ごろんと転がってぶつかる
    crackTackle: {
      duration: 560,
      offsetY: { amount: 26,   shape: "windup", backRatio: 0.45 },
      rotate:  { amount: 0.07, shape: "windup", backRatio: 0.45 },
      poses: [
        { at: 0,   pose: "hot" },
        { at: 0.7, pose: null }
      ]
    },

    // 体技・斬撃・踊り。2回続けて転がってぶつかる（ほかの種族と同じ決まり）
    crackTechnique: {
      duration: 880,
      offsetY: { amount: 26,   shape: "hops", count: 2 },
      rotate:  { amount: 0.06, shape: "hops", count: 2 },
      poses: [
        { at: 0,   pose: "hot" },
        { at: 0.9, pose: null }
      ]
    },

    // 共鳴（ストーンなど）。ひびの熱を噴き出させ、小刻みに震えて力を響かせる（その場から動かない）
    crackResonate: {
      duration: 760,
      offsetX: { amount: 3,    shape: "wobble", cycles: 7 },
      scale:   { amount: 0.04, shape: "pulse" },
      poses: [
        { at: 0,    pose: "hot" },
        { at: 0.85, pose: null }
      ]
    },

    // ブレス。ひびを燃やして膨らみ（吸い込む）、目を開いて前へ吐き出す
    crackBreath: {
      duration: 720,
      offsetY: { amount: 12,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.08, shape: "pulse" },
      poses: [
        { at: 0,    pose: "hot" },
        { at: 0.5,  pose: null }
      ]
    },

    // 自分・味方にかける技。ひびを燃やして少し浮き、ドスンと座り直す
    crackBuff: {
      duration: 560,
      offsetY: { amount: -8, shape: "pulse" },
      poses: [
        { at: 0,   pose: "hot" },
        { at: 0.8, pose: null }
      ]
    },

    // 被弾。目をつぶり、脆い体がぐらぐら揺れる（イワゴローより大きく）
    crackHit: {
      duration: 380,
      offsetY: { amount: 7,     shape: "decay", cycles: 2 },
      offsetX: { amount: 3,     shape: "wobble", cycles: 3 },
      alpha:   { amount: -0.35, shape: "fade" },
      poses: [
        { at: 0,   pose: "narrow" },
        { at: 0.6, pose: null }
      ]
    },

    // 回避。重いので素早くはよけない。少しだけ横へ転がって外す
    crackDodge: {
      duration: 520,
      offsetX: { amount: 16,   outRatio: 0.35 },
      rotate:  { amount: 0.05, outRatio: 0.35 }
    },

    // レベルアップ・スカウトに応じたとき。ひびを明るく燃やして、ドスン、ドスンと重く2回跳ねる
    crackCheer: {
      duration: 900,
      offsetY: { amount: -12, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "hot" },
        { at: 0.95, pose: null }
      ]
    },

    // 眠っている間。目を閉じ、ひびの熱が冷えて暗くなる。ほとんど動かない
    crackSleeping: {
      pose: "sleep",
      scaleY: { offset: -0.01, amplitude: 0.006, period: 5200 }
    },

    // ─────────────────────────────────────────
    // マグマガニ専用（RC-1、作り直し）。脚・ハサミ・目の柄を動かす。
    // 姿は hide（目を引っ込める）／glow（ハサミが白熱）／cool（殻が固まる。眠り・こうか）／open1・open2（ハサミを外へ開く）／
    // clawUp（白熱したハサミを持ち上げて構える）／snap（持ち上げたハサミで挟む）／runA・runB（ハサミを上げたまま横歩き）。
    // 図鑑「殻を固める前に、必ず一度だけハサミを鳴らす」「動かないのは、怖がりだから」
    //   → 攻めるときはハサミが白熱する。怖がりなので、被弾では目を引っ込める。
    // カニなので横歩き。前後の踏み込みより、横へ動く
    // ─────────────────────────────────────────

    // 通常攻撃（ハサミで挟む）。ハサミを持ち上げて溜め、素早く前へ出て2回挟む
    crabPinch: {
      duration: 500,
      offsetY: { amount: 28, shape: "windup", backRatio: 0.35 },
      poses: [
        { at: 0,    pose: "clawUp" },
        { at: 0.38, pose: "snap" },
        { at: 0.52, pose: "clawUp" },
        { at: 0.62, pose: "snap" },
        { at: 0.8,  pose: null }
      ]
    },

    // 体技・斬撃・踊り（作者の指定で、2回突っ込む動きとは別にした）。
    // ハサミを上げたまま脚を動かして横歩きで左右にゆさぶり、前へ出て挟む（カニの横歩き）
    //   offsetX wobble … 左右にゆさぶる　／　offsetY windup … そのあと前へ出る
    crabScuttle: {
      duration: 820,
      offsetX: { amount: 20, shape: "wobble", cycles: 1.5 },
      offsetY: { amount: 30, shape: "windup", backRatio: 0.6 },
      poses: [
        { at: 0,    pose: "runA" }, { at: 0.08, pose: "runB" },
        { at: 0.16, pose: "runA" }, { at: 0.24, pose: "runB" },
        { at: 0.32, pose: "runA" }, { at: 0.4,  pose: "runB" },
        { at: 0.48, pose: "runA" }, { at: 0.56, pose: "runB" },
        { at: 0.62, pose: "clawUp" },
        { at: 0.72, pose: "snap" },
        { at: 0.9,  pose: null }
      ]
    },

    // 共鳴（エンバーなど）。作者の指定で、ハサミを外側へ大きく開く。
    // ハサミを白熱させながら 少し開く → いっぱいに開く（殻がふるえて熱を響かせる）→ 閉じて戻る（その場から動かない）
    crabResonate: {
      duration: 900,
      offsetX: { amount: 2,    shape: "wobble", cycles: 6 },
      scale:   { amount: 0.05, shape: "pulse" },
      poses: [
        { at: 0,    pose: "glow" },
        { at: 0.15, pose: "open1" },
        { at: 0.3,  pose: "open2" },
        { at: 0.7,  pose: "open1" },
        { at: 0.85, pose: "glow" },
        { at: 0.95, pose: null }
      ]
    },

    // ブレス。目を引っ込めて身を沈め（吸い込む）、ハサミを持ち上げて体を起こし、前へ吐く
    crabBreath: {
      duration: 720,
      offsetY: { amount: 12,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "hide" },
        { at: 0.45, pose: "clawUp" },
        { at: 0.9,  pose: null }
      ]
    },

    // 自分・味方にかける技（こうか＝殻を固める）。ハサミを持ち上げて一度だけ鳴らし（図鑑のとおり）、殻が固まる（マグマが冷える）
    crabHarden: {
      duration: 820,
      scaleY: { amount: -0.05, shape: "pulse" },
      poses: [
        { at: 0,    pose: "clawUp" },
        { at: 0.16, pose: "snap" },
        { at: 0.3,  pose: "cool" },
        { at: 0.85, pose: null }
      ]
    },

    // 被弾。怖がりなので目を引っ込め、殻ごと押されて揺れる
    crabHit: {
      duration: 340,
      offsetY: { amount: 8,     shape: "decay", cycles: 2 },
      alpha:   { amount: -0.4,  shape: "fade" },
      poses: [
        { at: 0,   pose: "hide" },
        { at: 0.7, pose: null }
      ]
    },

    // 回避。脚を動かして横歩きで素早く横へずれる（カニなので跳ばない）
    crabDodge: {
      duration: 400,
      offsetX: { amount: 30, outRatio: 0.25 },
      poses: [
        { at: 0,    pose: "legsA" }, { at: 0.1,  pose: "legsB" },
        { at: 0.2,  pose: "legsA" }, { at: 0.3,  pose: "legsB" },
        { at: 0.45, pose: "legsA" }, { at: 0.6,  pose: "legsB" },
        { at: 0.75, pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。ハサミを持ち上げてカチカチ鳴らしながら、横にちょこちょこ動いて喜ぶ
    crabCheer: {
      duration: 780,
      offsetX: { amount: 8,   shape: "wobble", cycles: 3 },
      offsetY: { amount: -6,  shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "clawUp" }, { at: 0.12, pose: "snap" },
        { at: 0.24, pose: "clawUp" }, { at: 0.36, pose: "snap" },
        { at: 0.48, pose: "clawUp" }, { at: 0.6,  pose: "snap" },
        { at: 0.72, pose: "clawUp" }, { at: 0.9,  pose: null }
      ]
    },

    // 眠っている間。目を引っ込め、マグマが冷えて殻が固まる（図鑑「殻の中で様子をうかがっている」）。ほとんど動かない
    crabSleeping: {
      pose: "cool",
      scaleY: { offset: -0.02, amplitude: 0.008, period: 4400 }
    },

    // ─────────────────────────────────────────
    // スミビ専用（RC-1）。姿は flare（炎が燃え上がる）／hot（炎が強まり目を細める）／small（炎が縮む・目を細める）／
    // sleep（炎が消えかけ、目を閉じる）。炭の体は動かさず、炎と目で気持ちを見せる。
    // 小さくてちょろちょろしている（回避率あり）ので、動きは速く軽い。水に弱い（被弾で炎が縮む）
    // ─────────────────────────────────────────

    // 通常攻撃（体当たり）。炎を強めて目を細め、ぴょんと身を引いて勢いよくぶつかる
    cinderTackle: {
      duration: 420,
      offsetY: { amount: 28, shape: "windup", backRatio: 0.3 },
      poses: [
        { at: 0,    pose: "hot" },
        { at: 0.75, pose: null }
      ]
    },

    // 体技・斬撃・踊り（作者の指定で、2回突っ込む動きとは別にした）。
    // 火の玉になって 1回転しながら突っ込む（炎が体のまわりで回る）
    cinderRoll: {
      duration: 720,
      offsetY: { amount: 30,  shape: "windup", backRatio: 0.4 },
      rotate:  { amount: 1,   shape: "rise" },
      poses: [
        { at: 0,    pose: "hot" },
        { at: 0.85, pose: null }
      ]
    },

    // 共鳴（ファイアなど）。炎を高く燃え上がらせ、体を小刻みにふるわせる（その場から動かない）
    cinderResonate: {
      duration: 720,
      offsetX: { amount: 2,    shape: "wobble", cycles: 5 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "flare" },
        { at: 0.85, pose: null }
      ]
    },

    // ブレス。炎を縮めて息を吸い、燃え上がらせながら前へ吐き出す
    cinderBreath: {
      duration: 680,
      offsetY: { amount: 12,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "small" },
        { at: 0.5,  pose: "flare" },
        { at: 0.85, pose: null }
      ]
    },

    // 自分・味方にかける技。炎をぱっと燃え上がらせて、ぴょんと跳ねる
    cinderBuff: {
      duration: 500,
      offsetY: { amount: -12, shape: "pulse" },
      poses: [
        { at: 0,    pose: "flare" },
        { at: 0.8,  pose: null }
      ]
    },

    // 被弾。水に弱いので、炎が縮んで目を細め、軽い体が大きく弾かれる
    cinderHit: {
      duration: 320,
      offsetY: { amount: 15,   shape: "decay", cycles: 2 },
      alpha:   { amount: -0.45, shape: "fade" },
      poses: [
        { at: 0,    pose: "small" },
        { at: 0.75, pose: null }
      ]
    },

    // 回避。ちょろちょろしているので、ジグザグにすばやく横へ逃げる
    cinderDodge: {
      duration: 340,
      offsetX: { amount: 24, shape: "wobble", cycles: 1.5 },
      offsetY: { amount: -6, shape: "pulse" }
    },

    // レベルアップ・スカウトに応じたとき。図鑑「たき火に入りたがる」のとおり、炎を高く燃え上がらせて、
    // その場でちょこちょこ2回跳ねる
    cinderCheer: {
      duration: 640,
      offsetY: { amount: -14, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "flare" },
        { at: 0.95, pose: null }
      ]
    },

    // 眠っている間。炎が消えかけの熾火になり、目を閉じる（図鑑「燃え尽きる前に、次の炭へ火を移して」）。ほとんど動かない
    cinderSleeping: {
      pose: "sleep",
      alpha:   { amplitude: -0.1, period: 2400 },
      scaleY:  { offset: -0.02, amplitude: 0.008, period: 3000 }
    },

    // ─────────────────────────────────────────
    // フレイミン専用（RC-1）。姿は flare（炎が燃え上がる）／rage（炎が赤くなり目を細める）／small（炎が縮む・目を細める）／
    // sleep（炎が暗い熾火になり、目を閉じる）。体は変えず、炎と目と色で気持ちを見せる。
    // 図鑑「炎の色で機嫌が分かる。赤いときは、近づかないほうがいい」「牙をむくのは、知らない相手にだけだった」
    //   → 攻めるときは炎が赤くなる（怒り）。喜ぶときは、穏やかな橙の炎が高く燃え上がる。
    // 気性が荒い獣なので、溜めは短く、飛びかかりは大きい
    // ─────────────────────────────────────────

    // 通常攻撃（牙で噛みつく）。炎を赤くして目を細め、脚を縮めて身を低くし、脚をたたんで一気に飛びかかる
    flaminBite: {
      duration: 460,
      offsetY: { amount: 32, shape: "windup", backRatio: 0.3 },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.3,  pose: "air" },
        { at: 0.6,  pose: "rage" },
        { at: 0.78, pose: null }
      ]
    },

    // 体技・斬撃・踊り（作者の指定で、2回突っ込む動きとは別にした）。
    // 飛びかかる前に、身を低く沈めて体をひねり（溜めを長く。その間も足踏みして地面をかく）、脚をたたんで大きく飛びかかる
    flaminPounce: {
      duration: 820,
      offsetY: { amount: 44,   shape: "windup", backRatio: 0.55 },
      rotate:  { amount: 0.06, shape: "windup", backRatio: 0.55 },
      scale:   { amount: 0.06, shape: "windup", backRatio: 0.55 },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.14, pose: "stepL" }, { at: 0.24, pose: "crouch" },
        { at: 0.34, pose: "stepR" }, { at: 0.44, pose: "crouch" },
        { at: 0.55, pose: "air" },
        { at: 0.8,  pose: "rage" },
        { at: 0.92, pose: null }
      ]
    },

    // 共鳴（ファイアなど）。炎を高く燃え上がらせ、小刻みにふるえて熱を響かせる（その場から動かない）
    flaminResonate: {
      duration: 720,
      offsetX: { amount: 2,    shape: "wobble", cycles: 6 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "flare" },
        { at: 0.85, pose: null }
      ]
    },

    // ブレス。炎を縮めて息を吸い、赤く燃え上がらせながら前へ吐き出す
    flaminBreath: {
      duration: 700,
      offsetY: { amount: 14,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.07, shape: "pulse" },
      poses: [
        { at: 0,    pose: "small" },
        { at: 0.5,  pose: "rage" },
        { at: 0.9,  pose: null }
      ]
    },

    // 自分・味方にかける技。炎を高く燃え上がらせて、ぐっと身を起こす
    flaminBuff: {
      duration: 520,
      scaleY:  { amount: 0.05, shape: "pulse" },
      offsetY: { amount: -8,   shape: "pulse" },
      poses: [
        { at: 0,    pose: "flare" },
        { at: 0.8,  pose: null }
      ]
    },

    // 被弾。水に弱いので、炎が縮んで目を細め、大きく弾かれる
    flaminHit: {
      duration: 320,
      offsetY: { amount: 13,   shape: "decay", cycles: 2 },
      alpha:   { amount: -0.4, shape: "fade" },
      poses: [
        { at: 0,    pose: "small" },
        { at: 0.75, pose: null }
      ]
    },

    // 回避。脚を縮めてから、脚をたたんで身軽に横へ跳んでかわす
    flaminDodge: {
      duration: 400,
      offsetX: { amount: 30, outRatio: 0.2 },
      offsetY: { amount: -8, shape: "pulse" },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.1,  pose: "air" },
        { at: 0.5,  pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。図鑑「炎の色は、ずっと穏やかな橙」のとおり、
    // 穏やかな橙の炎を高く燃え上がらせて、足踏みしながらその場で2回跳ねて喜ぶ
    flaminCheer: {
      duration: 700,
      offsetY: { amount: -16, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "stepL" }, { at: 0.12, pose: "flare" },
        { at: 0.38, pose: "stepR" }, { at: 0.5,  pose: "stepL" },
        { at: 0.62, pose: "flare" }, { at: 0.88, pose: "stepR" },
        { at: 0.97, pose: null }
      ]
    },

    // 眠っている間。炎が暗い熾火になり、目を閉じる。獣らしくゆっくり寝息を立てる
    flaminSleeping: {
      pose: "sleep",
      scaleY: { offset: -0.02, amplitude: 0.025, period: 3000 },
      scaleX: { offset: 0.01,  amplitude: -0.01, period: 3000 }
    },

    // ─────────────────────────────────────────
    // ヨドミ専用（RC-1）。姿は narrow（目を細める）／glare（細目＋瞳が明るく光る）／glow（煙・裾・瞳が明るい紫に輝く）／
    // sleep（目を閉じ、煙が短くなり、紫が暗くなる）。体の形は変えない。
    // 闇そのもので、ひとつ目でじっと見つめてくる。動きはぬるりとして、実体が薄い（消える・にじむ）
    // ─────────────────────────────────────────

    // 通常攻撃。目を細め、瞳を光らせてじっと見つめてから、ぬるりと近づいてぶつかる
    murkBump: {
      duration: 500,
      offsetY: { amount: 26, shape: "windup", backRatio: 0.4 },
      poses: [
        { at: 0,    pose: "glare" },
        { at: 0.75, pose: null }
      ]
    },

    // 体技・斬撃・踊り（作者の指定で、2回突っ込む動きとは別にした）。
    // 闇に溶けて（すっと薄くなり）忍び寄り、相手の目の前で濃く現れて襲う
    //   alpha pulse … 途中でほとんど見えなくなる　／　offsetY windup … そのあいだに前へ出る
    murkSeep: {
      duration: 900,
      offsetY: { amount: 34,   shape: "windup", backRatio: 0.45 },
      alpha:   { amount: -0.75, shape: "pulse" },
      poses: [
        { at: 0,    pose: "narrow" },
        { at: 0.55, pose: "glare" },
        { at: 0.9,  pose: null }
      ]
    },

    // 共鳴（闇の胞子など）。煙と裾を明るい紫に輝かせ、体をふくらませてにじむように震える（その場から動かない）
    murkResonate: {
      duration: 780,
      offsetX: { amount: 2,    shape: "wobble", cycles: 5 },
      scale:   { amount: 0.07, shape: "pulse" },
      poses: [
        { at: 0,    pose: "glow" },
        { at: 0.88, pose: null }
      ]
    },

    // ブレス。闇を吸い込んで縮み（目を細める）、明るく輝きながら前へ吐き出す
    murkBreath: {
      duration: 720,
      offsetY: { amount: 12,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.08, shape: "pulse" },
      poses: [
        { at: 0,    pose: "narrow" },
        { at: 0.5,  pose: "glow" },
        { at: 0.9,  pose: null }
      ]
    },

    // 自分・味方にかける技。闇を明るく輝かせて、ゆっくり浮き上がる
    murkBuff: {
      duration: 640,
      offsetY: { amount: -10, shape: "pulse" },
      poses: [
        { at: 0,    pose: "glow" },
        { at: 0.85, pose: null }
      ]
    },

    // 被弾。実体が薄いので、体がにじんで揺れ（横に散る）、目を細める
    murkHit: {
      duration: 360,
      offsetX: { amount: 5,    shape: "wobble", cycles: 3 },
      offsetY: { amount: 9,    shape: "decay",  cycles: 2 },
      alpha:   { amount: -0.5, shape: "fade" },
      poses: [
        { at: 0,    pose: "narrow" },
        { at: 0.7,  pose: null }
      ]
    },

    // 回避。霧のように薄くなって、横へすっとずれる
    murkDodge: {
      duration: 460,
      offsetX: { amount: 26,   outRatio: 0.3 },
      alpha:   { amount: -0.6, shape: "pulse" }
    },

    // レベルアップ・スカウトに応じたとき。闇を明るく輝かせて、ふわりと高く浮き上がる（じっと見つめてくる目のまま）
    murkCheer: {
      duration: 760,
      offsetY: { amount: -18,  shape: "pulse" },
      scaleY:  { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "glow" },
        { at: 0.92, pose: null }
      ]
    },

    // 眠っている間。目を閉じ、煙が短く暗くなって、底に沈むように低くゆっくり息をする
    murkSleeping: {
      pose: "sleep",
      offsetY: { offset: 4, amplitude: -1, period: 3600 },
      alpha:   { amplitude: -0.1, period: 3600 }
    },

    // ─────────────────────────────────────────
    // カゲヅタ専用（RC-1）。姿は narrow（葉を上げ・目を細める）／glow（葉を上げ・裂け目が輝く）／droop（葉を垂らし・目を細める）／
    // sleep（葉を垂らして目を閉じ、裂け目が暗くなる）。本体の形は変えず、葉・目・色だけが変わる。
    // 天井の裂け目からぶら下がっているので、動きは前後ではなく、しなる・揺れる・伸び縮み。
    // 作者の指定で、**裂け目（絵の上から7行）は動かさない**（pinTop: 7。SpriteRenderer._drawPinned）。
    //   ・蔦は上端が裂け目にくっついたまま。offsetX / offsetY は使えない（蔦が裂け目から離れるため）。
    //     前へ出る動きは、蔦を伸ばす（scaleY）で出す
    //   ・回転（rotate）は蔦の上端の中央（＝裂け目）を軸にする（振り子）
    // 図鑑「力を吸うのは、弱っている相手からだけだ」「絡みついてくる蔦」
    // ─────────────────────────────────────────

    // 通常攻撃（蔦で打つ）。葉を振り上げて目を細め、蔦を縮めて溜めてから、しならせて前へ打ち下ろす（伸ばす）
    zutaLash: {
      duration: 480,
      anchor:  "top",
      pinTop:  7,
      scaleY:  { amount: 0.32, shape: "windup", backRatio: 0.35 },
      poses: [
        { at: 0,    pose: "narrow" },
        { at: 0.75, pose: null }
      ]
    },

    // 体技・斬撃・踊り（作者の指定で、2回突っ込む動きとは別にした）。
    // 裂け目を支点に蔦を振り子のように大きく振ってから、勢いをつけて絡みつくように打ち下ろす
    zutaSwing: {
      duration: 880,
      anchor:  "top",
      pinTop:  7,
      rotate:  { amount: 0.06, shape: "wobble", cycles: 1.5 },
      scaleY:  { amount: 0.30, shape: "windup", backRatio: 0.6 },
      poses: [
        { at: 0,    pose: "narrow" },
        { at: 0.9,  pose: null }
      ]
    },

    // 共鳴（シャドウなど）。裂け目を明るく輝かせ、蔦を大きくしならせて力を響かせる（その場から動かない）
    zutaResonate: {
      duration: 760,
      anchor:  "top",
      pinTop:  7,
      rotate:  { amount: 0.025, shape: "wobble", cycles: 3 },
      scaleY:  { amount: 0.10,  shape: "pulse" },
      poses: [
        { at: 0,    pose: "glow" },
        { at: 0.88, pose: null }
      ]
    },

    // ブレス。蔦を縮めて（吸い込む）、裂け目を輝かせながら一気に伸ばして吐く
    zutaBreath: {
      duration: 700,
      anchor:  "top",
      pinTop:  7,
      scaleY:  { amount: 0.28, shape: "windup", backRatio: 0.5 },
      poses: [
        { at: 0,    pose: "narrow" },
        { at: 0.5,  pose: "glow" },
        { at: 0.9,  pose: null }
      ]
    },

    // 自分・味方にかける技（ちからぬきなどの弱体は相手に向かうので共鳴側）。裂け目を輝かせて、蔦をぐっと伸ばす
    zutaBuff: {
      duration: 600,
      anchor:  "top",
      pinTop:  7,
      scaleY:  { amount: 0.16, shape: "pulse" },
      poses: [
        { at: 0,    pose: "glow" },
        { at: 0.85, pose: null }
      ]
    },

    // 被弾。葉が垂れて目を細め、蔦が縮んで裂け目へ引っ込みかけて、揺れながら戻る
    zutaHit: {
      duration: 360,
      anchor:  "top",
      pinTop:  7,
      scaleY:  { amount: -0.40, shape: "decay", cycles: 2 },
      rotate:  { amount: 0.03,  shape: "wobble", cycles: 2 },
      alpha:   { amount: -0.4,  shape: "fade" },
      poses: [
        { at: 0,    pose: "droop" },
        { at: 0.7,  pose: null }
      ]
    },

    // 回避。作者の指定で、蔦が裂け目へ一瞬で引っ込んで消え、すぐ戻る
    //   scaleY pulse -0.96 … 途中でほとんど 0（＝裂け目に吸い込まれる）になって戻る。裂け目は動かない
    zutaDodge: {
      duration: 320,
      anchor:  "top",
      pinTop:  7,
      scaleY:  { amount: -0.96, shape: "pulse" }
    },

    // レベルアップ・スカウトに応じたとき。図鑑「手首に軽く巻きつくだけだ」のとおり、
    // 裂け目を輝かせ、蔦をゆらゆらと嬉しそうに揺らす
    zutaCheer: {
      duration: 800,
      anchor:  "top",
      pinTop:  7,
      rotate:  { amount: 0.04, shape: "wobble", cycles: 3 },
      scaleY:  { amount: 0.10, shape: "pulse" },
      poses: [
        { at: 0,    pose: "glow" },
        { at: 0.92, pose: null }
      ]
    },

    // 眠っている間（草なので眠りは効かないが、味方にすると眠る）。葉を垂らして目を閉じ、蔦がゆっくり縮んで伸びる
    zutaSleeping: {
      pose: "sleep",
      anchor:  "top",
      pinTop:  7,
      scaleY:  { amplitude: -0.05, period: 4200 },
      alpha:   { amplitude: -0.08, period: 4200 }
    },

    // ─────────────────────────────────────────
    // ツリガネ専用（2026-10-22）。蔦から逆さにぶら下がる小悪魔。
    // 上の5行（蔦と足の爪）は動かさない（pinTop: 5）。回転は蔦をつかむ足を軸にした振り子になる。
    // 姿は open（翼を広げる）・sleep（目と口を閉じ、風が止む）。ふだんは2コマ（風の筋の向きが変わる）
    // ─────────────────────────────────────────

    // ふだん。釣鐘のようにゆっくり揺れ、翼の隙間の風の筋が 2コマで入れ替わる
    bellHang: {
      frames:  { interval: 420 },
      anchor:  "top",
      pinTop:  5,
      rotate:  { amplitude: 0.035, period: 3400 },
      scaleY:  { amplitude: 0.015, period: 1700, phase: 0.25 }
    },

    // 通常攻撃・体技など。翼を広げながら大きく振りかぶり、振り子の勢いで前へ伸びる
    bellSwoop: {
      duration: 760,
      anchor:  "top",
      pinTop:  5,
      rotate:  { amount: 0.09, shape: "wobble", cycles: 1.5 },
      scaleY:  { amount: 0.22, shape: "windup", backRatio: 0.5 },
      poses: [
        { at: 0.15, pose: "open" },
        { at: 0.85, pose: null }
      ]
    },

    // 共鳴（デス・ゲイルなど）。翼を広げ、小刻みに揺れて風を鳴らす（その場から動かない）
    bellResonate: {
      duration: 800,
      anchor:  "top",
      pinTop:  5,
      rotate:  { amount: 0.03, shape: "wobble", cycles: 4 },
      scaleY:  { amount: 0.08, shape: "pulse" },
      poses: [
        { at: 0,    pose: "open" },
        { at: 0.88, pose: null }
      ]
    },

    // 被弾。翼で包んだまま大きく揺さぶられ、揺れながら戻る
    bellHit: {
      duration: 420,
      anchor:  "top",
      pinTop:  5,
      rotate:  { amount: 0.08, shape: "decay", cycles: 2 },
      scaleY:  { amount: -0.12, shape: "decay", cycles: 2 },
      alpha:   { amount: -0.4,  shape: "fade" }
    },

    // 回避。振り子のように大きく横へ逃げて戻る
    bellDodge: {
      duration: 360,
      anchor:  "top",
      pinTop:  5,
      rotate:  { amount: 0.22, shape: "pulse" }
    },

    // レベルアップ・スカウトに応じたとき。翼を広げて、くるくると揺れる
    bellCheer: {
      duration: 900,
      anchor:  "top",
      pinTop:  5,
      rotate:  { amount: 0.07, shape: "wobble", cycles: 3 },
      scaleY:  { amount: 0.08, shape: "pulse" },
      poses: [
        { at: 0,    pose: "open" },
        { at: 0.9,  pose: null }
      ]
    },

    // 眠っている間。風が止み、ゆっくり揺れるだけ
    bellSleeping: {
      pose: "sleep",
      anchor:  "top",
      pinTop:  5,
      rotate:  { amplitude: 0.02, period: 5200 },
      alpha:   { amplitude: -0.06, period: 5200 }
    },

    // ─────────────────────────────────────────
    // ビリムシ専用（RC-1、作り直し）。翅・触角・腹の針・火花を動かす。
    // 姿は up／down（翅の上げ下げ）・upB／downB（火花を裏返し触角が動く）・charge（帯電して体が明るくなり、火花が増える）・
    // sting／stingDown（腹を伸ばして針を出す。翅の上げ・下げ）・sleep（翅を下げ、火花が消え、暗くなり、目を閉じる）。
    // いちばん速く、小さい。図鑑「触れると弾けるのは、驚いたときだけ」→ 被弾は驚いて弾ける（charge）
    // ─────────────────────────────────────────

    // 通常攻撃（体当たり）。翅を速く打って溜め、帯電して一気に突っ込む
    boltRush: {
      duration: 400,
      offsetY: { amount: 32, shape: "windup", backRatio: 0.25 },
      poses: [
        { at: 0,    pose: "up" },   { at: 0.07, pose: "downB" },
        { at: 0.14, pose: "upB" },  { at: 0.21, pose: "down" },
        { at: 0.28, pose: "charge" },
        { at: 0.62, pose: "downB" },
        { at: 0.75, pose: null }
      ]
    },

    // 体技・斬撃・踊り（作者の指定で、2回突っ込む動きとは別にした）。
    // 稲妻のようにジグザグに切り返しながら突っ込み（翅は速く打ったまま）、最後に腹の針を突き出して刺す
    boltZigzag: {
      duration: 680,
      offsetX: { amount: 40, shape: "wobble", cycles: 2.5 },
      offsetY: { amount: 34, shape: "windup", backRatio: 0.2 },
      poses: [
        { at: 0,    pose: "charge" },
        { at: 0.08, pose: "up" },  { at: 0.14, pose: "downB" },
        { at: 0.2,  pose: "upB" }, { at: 0.26, pose: "down" },
        { at: 0.32, pose: "up" },  { at: 0.38, pose: "downB" },
        { at: 0.44, pose: "upB" }, { at: 0.5,  pose: "down" },
        { at: 0.56, pose: "sting" }, { at: 0.63, pose: "stingDown" },
        { at: 0.7,  pose: "sting" }, { at: 0.77, pose: "stingDown" },
        { at: 0.88, pose: null }
      ]
    },

    // 共鳴（サンダーなど）。帯電した姿と火花の弾ける姿を速く切り替えて、体を大きくふるわせる（その場から動かない）
    boltResonate: {
      duration: 720,
      offsetX: { amount: 3,    shape: "wobble", cycles: 8 },
      scale:   { amount: 0.08, shape: "pulse" },
      poses: [
        { at: 0,    pose: "charge" }, { at: 0.1,  pose: "upB" },
        { at: 0.18, pose: "charge" }, { at: 0.28, pose: "downB" },
        { at: 0.36, pose: "charge" }, { at: 0.46, pose: "upB" },
        { at: 0.54, pose: "charge" }, { at: 0.64, pose: "downB" },
        { at: 0.72, pose: "charge" }, { at: 0.88, pose: null }
      ]
    },

    // ブレス。翅を振り上げて身を引き（電気をためる）、帯電しながら前へ吐き出す
    boltBreath: {
      duration: 620,
      offsetY: { amount: 12,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },  { at: 0.12, pose: "downB" },
        { at: 0.24, pose: "upB" }, { at: 0.36, pose: "down" },
        { at: 0.5,  pose: "charge" },
        { at: 0.9,  pose: null }
      ]
    },

    // 自分・味方にかける技。帯電して、翅を速く打ってぴょんと浮き上がる
    boltBuff: {
      duration: 500,
      offsetY: { amount: -12, shape: "pulse" },
      poses: [
        { at: 0,    pose: "charge" },
        { at: 0.2,  pose: "upB" },  { at: 0.3, pose: "down" },
        { at: 0.4,  pose: "up" },   { at: 0.5, pose: "downB" },
        { at: 0.6,  pose: "charge" },
        { at: 0.85, pose: null }
      ]
    },

    // 被弾。驚いて電気が弾け（火花が増える）、翅がすくむ。軽い体が大きく弾かれる
    boltHit: {
      duration: 320,
      offsetY: { amount: 16,    shape: "decay", cycles: 2 },
      offsetX: { amount: 4,     shape: "wobble", cycles: 3 },
      alpha:   { amount: -0.4,  shape: "fade" },
      poses: [
        { at: 0,    pose: "charge" },
        { at: 0.35, pose: "downB" },
        { at: 0.6,  pose: null }
      ]
    },

    // 回避。稲妻のように瞬間的に横へ跳ぶ（一瞬ちらつく）。翅はいちばん速く打つ
    boltDodge: {
      duration: 300,
      offsetX: { amount: 40,   outRatio: 0.15 },
      alpha:   { amount: -0.5, shape: "pulse" },
      poses: [
        { at: 0,    pose: "upB" }, { at: 0.12, pose: "down" },
        { at: 0.24, pose: "up" },  { at: 0.36, pose: "downB" },
        { at: 0.5,  pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。帯電して火花をまき散らしながら、ぴょんぴょん跳ね回る
    boltCheer: {
      duration: 660,
      offsetY: { amount: -16, shape: "hops", count: 3 },
      offsetX: { amount: 6,   shape: "wobble", cycles: 3 },
      poses: [
        { at: 0,    pose: "charge" }, { at: 0.1,  pose: "upB" },
        { at: 0.2,  pose: "down" },   { at: 0.3,  pose: "charge" },
        { at: 0.4,  pose: "upB" },    { at: 0.5,  pose: "down" },
        { at: 0.6,  pose: "charge" }, { at: 0.7,  pose: "upB" },
        { at: 0.8,  pose: "downB" },  { at: 0.95, pose: null }
      ]
    },

    // 眠っている間。翅を下げ、火花が消えて暗くなり、目を閉じる。羽ばたきは止まって、低くゆっくり漂う
    boltSleeping: {
      pose: "sleep",
      offsetY: { offset: 4, amplitude: -1, period: 3200 }
    },

    // ─────────────────────────────────────────
    // ミズダマリ専用（RC-1）。姿は squash（潰れる）／tall（せり上がる）／glow（水が明るく光る）／sleep（潰れて目を閉じ、暗くなる）。
    // 上が重い水の塊で、攻撃特化。図鑑「水たまりのふりをして、踏まれるのを待つ遊びが好きだ」「乾くと小さくしぼむ」
    // ─────────────────────────────────────────

    // 通常攻撃（重い水塊で叩き潰す）。塊を高くせり上げて、ずしんと叩きつける（潰れる）
    puddleSlam: {
      duration: 560,
      offsetY: { amount: 26,   shape: "windup", backRatio: 0.45 },
      poses: [
        { at: 0,    pose: "tall" },
        { at: 0.45, pose: "squash" },
        { at: 0.8,  pose: null }
      ]
    },

    // 体技・斬撃・踊り（作者の指定で、2回突っ込む動きとは別にした）。
    // 水たまりのふりをしてぺたんこになって忍び寄り、相手の足元でざばっと立ち上がって叩く
    //   scaleY pulse … 途中でほとんど平らな水たまりになる　／　offsetY windup … そのあいだに前へ滑る
    puddleAmbush: {
      duration: 920,
      offsetY: { amount: 36,   shape: "windup", backRatio: 0.55 },
      scaleY:  { amount: -0.5, shape: "pulse" },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.72, pose: "tall" },
        { at: 0.9,  pose: null }
      ]
    },

    // 共鳴（アクアなど）。水を明るく光らせ、塊をふくらませてぷるぷる波打たせる（その場から動かない）
    puddleResonate: {
      duration: 780,
      scaleX:  { amount: 0.05, shape: "wobble", cycles: 4 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "glow" },
        { at: 0.88, pose: null }
      ]
    },

    // ブレス。塊を高くせり上げて水を吸い込み、潰れながら前へ吐き出す
    puddleBreath: {
      duration: 720,
      offsetY: { amount: 14,   shape: "windup", backRatio: 0.5 },
      poses: [
        { at: 0,    pose: "tall" },
        { at: 0.5,  pose: "squash" },
        { at: 0.9,  pose: null }
      ]
    },

    // 自分・味方にかける技。水を明るく光らせて、ぐっとせり上がる
    puddleBuff: {
      duration: 640,
      poses: [
        { at: 0,    pose: "glow" },
        { at: 0.3,  pose: "tall" },
        { at: 0.85, pose: null }
      ]
    },

    // 被弾。水なのでぐにゃっと潰れて、ぷるぷると波打って戻る
    puddleHit: {
      duration: 400,
      offsetY: { amount: 8,    shape: "decay", cycles: 2 },
      scaleX:  { amount: 0.08, shape: "decay", cycles: 3 },
      alpha:   { amount: -0.35, shape: "fade" },
      poses: [
        { at: 0,   pose: "squash" },
        { at: 0.6, pose: null }
      ]
    },

    // 回避。水たまりのようにぺたんこに溶けて、横へつるっと滑って外す
    puddleDodge: {
      duration: 460,
      offsetX: { amount: 28,   outRatio: 0.3 },
      scaleY:  { amount: -0.55, shape: "pulse" },
      poses: [
        { at: 0,   pose: "squash" },
        { at: 0.7, pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。図鑑「水たまりのふりをして、踏まれるのを待つ」のとおり、
    // ぺたんこの水たまりになってから、ぽんっと立ち上がる、を2回くり返して喜ぶ
    puddleCheer: {
      duration: 900,
      scaleY:  { amount: -0.5, shape: "hops", count: 2 },
      offsetY: { amount: -8,   shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.22, pose: "tall" },
        { at: 0.5,  pose: "squash" },
        { at: 0.72, pose: "tall" },
        { at: 0.95, pose: null }
      ]
    },

    // 眠っている間。図鑑「乾くと小さくしぼむ」のとおり、潰れて目を閉じ、暗くなって、小さくしぼんだまま動かない
    puddleSleeping: {
      pose: "sleep",
      scale:  { offset: -0.06, amplitude: 0.01, period: 4400 }
    },

    // ─────────────────────────────────────────
    // ヨミリュウ専用（RC-1、作り直し）。制作者が描いた絵なので、体・頭・角・脚の形は変えず、
    // 翼・尻尾・前足を付け根で回した姿と、目・口を変えた姿を切り替える。姿（data/monsters.js の poses）：
    //   up・upMid／downMid・down（翼と尻尾の上げ下げ）・hoverUp／hoverDown（浮いて大きく羽ばたく。尻尾は翼と逆へ）
    //   clawUp（前足を振り上げ目を細める）・clawSwipe（前足で引っかく）・glare（目を細める）
    //   mouth・mouthWide（口を開ける・頭ごと大きく開ける）・breathWide（大きく開けて翼を広げる）・sleep
    // 全種でいちばん大きく重いので、どの動きも長く、ゆっくり（溜めが深く、揺れは小さい）。
    // 図鑑「揺籃の穴にいるはずのない竜」「勝てる相手とは思えない」→ 動じず、圧をかける動き
    // ─────────────────────────────────────────

    // 通常攻撃（噛みつく）。作者の指定で、体はあまり上下させず、口を大きく開けて、閉じて噛みつく見た目にした。
    //   口を開ける → 大きく開ける → 目を細めて閉じる（＝噛みつく）。体はわずかに前へ出るだけ
    dragonClaw: {
      duration: 640,
      offsetY: { amount: 10,   shape: "windup", backRatio: 0.4 },
      scale:   { amount: 0.03, shape: "windup", backRatio: 0.4 },
      poses: [
        { at: 0,    pose: "mouth" },
        { at: 0.25, pose: "mouthWide" },
        { at: 0.52, pose: "glare" },
        { at: 0.78, pose: null }
      ]
    },

    // 体技・斬撃・踊り（作者の指定で、2回突っ込む動きとは別にした）。
    // 翼を大きく打って少し浮き上がり（lift）、尻尾を翼と逆へ振りながらゆっくり近づき、
    // 前足を振り上げて爪で引っかき、口を開けて噛みつく。
    //   lift … 相手の位置に関係なく上へ浮く（Motion.js）。前へ出る量（offsetY）は小さく
    dragonSwoop: {
      duration: 1500,
      lift:    { amount: 14,   shape: "pulse" },
      offsetY: { amount: 14,   shape: "windup", backRatio: 0.65 },
      scale:   { amount: 0.03, shape: "pulse" },
      poses: [
        { at: 0,    pose: "hoverUp" },   { at: 0.14, pose: "hoverDown" },
        { at: 0.28, pose: "hoverUp" },   { at: 0.42, pose: "hoverDown" },
        { at: 0.54, pose: "clawUp" },
        { at: 0.68, pose: "clawSwipe" },
        { at: 0.78, pose: "mouthWide" },
        { at: 0.88, pose: "glare" },
        { at: 0.96, pose: null }
      ]
    },

    // 共鳴（闇の技など）。動きは今のまま（体をふくらませ、地響きのように震える）で、作者の指定で翼をゆっくり動かす
    dragonResonate: {
      duration: 1200,
      offsetX: { amount: 2,    shape: "wobble", cycles: 6 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "upMid" },
        { at: 0.2,  pose: "up" },
        { at: 0.5,  pose: "upMid" },
        { at: 0.62, pose: "rest" },
        { at: 0.74, pose: "downMid" },
        { at: 0.86, pose: "down" },
        { at: 0.96, pose: null }
      ]
    },

    // ブレス（奈落の息）。作者の指定で、頭を上げ（体を少し後ろへ反らす）、体を少し大きくしながら、頭を少し突き出す（口を開ける）。
    // 作り直しで、口を大きく開けるところで翼も広げる（breathWide）
    //   rotate … 反時計回り＝頭が上がる（絵は右向きなので）／ scale … 体が大きくなる ／ offsetY windup … 最後に少し前へ突き出す
    dragonBreath: {
      duration: 1200,
      rotate:  { amount: -0.02, shape: "pulse" },
      scale:   { amount: 0.06,  shape: "pulse" },
      offsetY: { amount: 10,    shape: "windup", backRatio: 0.6 },
      poses: [
        { at: 0,    pose: "upMid" },
        { at: 0.25, pose: "mouth" },
        { at: 0.45, pose: "breathWide" },
        { at: 0.85, pose: "mouth" },
        { at: 0.95, pose: null }
      ]
    },

    // 自分・味方にかける技。翼を大きく打って、堂々と身を起こす
    dragonBuff: {
      duration: 800,
      offsetY: { amount: -8,   shape: "pulse" },
      scale:   { amount: 0.04, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.2,  pose: "downMid" },
        { at: 0.35, pose: "down" },
        { at: 0.55, pose: "up" },
        { at: 0.85, pose: null }
      ]
    },

    // 被弾。ほとんど動じない。目を細め、前足を少し振り上げて構え、わずかに押されるだけ（図鑑「勝てる相手とは思えない」）
    dragonHit: {
      duration: 420,
      offsetY: { amount: 6,     shape: "decay", cycles: 2 },
      alpha:   { amount: -0.3,  shape: "fade" },
      poses: [
        { at: 0,    pose: "clawUp" },
        { at: 0.45, pose: "glare" },
        { at: 0.75, pose: null }
      ]
    },

    // 回避。重いので大きくは動かない。翼をひと打ちして、横へ少し跳ぶ
    dragonDodge: {
      duration: 560,
      offsetX: { amount: 22,   outRatio: 0.3 },
      offsetY: { amount: -6,   shape: "pulse" },
      poses: [
        { at: 0,    pose: "hoverUp" },
        { at: 0.3,  pose: "hoverDown" },
        { at: 0.5,  pose: "downMid" },
        { at: 0.65, pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。翼を大きく打ちながら、咆哮のように体をふくらませる（上下の動きは小さく）
    dragonCheer: {
      duration: 1100,
      offsetY: { amount: -5,   shape: "pulse" },
      scale:   { amount: 0.07, shape: "pulse" },
      poses: [
        { at: 0,    pose: "hoverUp" }, { at: 0.2,  pose: "hoverDown" },
        { at: 0.4,  pose: "hoverUp" }, { at: 0.6,  pose: "hoverDown" },
        { at: 0.78, pose: "breathWide" }, { at: 0.95, pose: null }
      ]
    },

    // ─────────────────────────────────────────
    // ドクバチ専用（RC-1）。姿は up／down（翅の上げ下げ）・upB／downB（腹が縮み、触角が動く）・
    // curl（翅を上げて腹を引き絞る）・sting／stingUp（腹の先から白い針と毒のしずくを出す。翅の下げ・上げ）・sleep（翅をたたむ）。
    // 小さく速く、群れで飛ぶ。図鑑「針をしまったまま、頭の上を回るのが好きだ」「毒の針を今はこちらに向けない」
    // ─────────────────────────────────────────

    // 通常攻撃（針で刺す）。腹を引き絞って身を引き、針を突き出して刺す（翅は打ったまま）
    beeSting: {
      duration: 420,
      offsetY: { amount: 30, shape: "windup", backRatio: 0.3 },
      poses: [
        { at: 0,    pose: "curl" },
        { at: 0.3,  pose: "sting" },
        { at: 0.42, pose: "stingUp" },
        { at: 0.54, pose: "sting" },
        { at: 0.72, pose: null }
      ]
    },

    // 体技・斬撃・踊り（2回突っ込む形とは別の動き）。翅を速く打って左右に舞い、腹を引き絞ってから、
    // 針を突き出したまま羽ばたいて何度も刺す
    beeDart: {
      duration: 760,
      offsetX: { amount: 22, shape: "wobble", cycles: 1.5 },
      offsetY: { amount: 32, shape: "windup", backRatio: 0.5 },
      poses: [
        { at: 0,    pose: "up" },   { at: 0.06, pose: "down" },
        { at: 0.12, pose: "upB" },  { at: 0.18, pose: "downB" },
        { at: 0.24, pose: "up" },   { at: 0.3,  pose: "down" },
        { at: 0.36, pose: "upB" },  { at: 0.42, pose: "downB" },
        { at: 0.48, pose: "curl" },
        { at: 0.6,  pose: "sting" }, { at: 0.68, pose: "stingUp" },
        { at: 0.76, pose: "sting" }, { at: 0.84, pose: "stingUp" },
        { at: 0.93, pose: null }
      ]
    },

    // 共鳴（闇の技など）。その場で翅をいちばん速く打ち、羽音で力を響かせる（腹も息をする）
    beeResonate: {
      duration: 700,
      offsetX: { amount: 2,    shape: "wobble", cycles: 7 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },  { at: 0.07, pose: "downB" },
        { at: 0.14, pose: "upB" }, { at: 0.21, pose: "down" },
        { at: 0.28, pose: "up" },  { at: 0.35, pose: "downB" },
        { at: 0.42, pose: "upB" }, { at: 0.49, pose: "down" },
        { at: 0.56, pose: "up" },  { at: 0.63, pose: "downB" },
        { at: 0.7,  pose: "upB" }, { at: 0.77, pose: "down" },
        { at: 0.86, pose: null }
      ]
    },

    // ブレス。腹を引き絞って身を引き（吸い込む）、針の先から毒を吹きつける
    beeBreath: {
      duration: 640,
      offsetY: { amount: 12,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "curl" },
        { at: 0.5,  pose: "sting" },
        { at: 0.62, pose: "stingUp" },
        { at: 0.74, pose: "sting" },
        { at: 0.88, pose: null }
      ]
    },

    // 自分・味方にかける技。速く羽ばたいて、ふわりと浮き上がる
    beeBuff: {
      duration: 520,
      offsetY: { amount: -12, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },  { at: 0.1,  pose: "down" },
        { at: 0.2,  pose: "upB" }, { at: 0.3,  pose: "downB" },
        { at: 0.4,  pose: "up" },  { at: 0.5,  pose: "down" },
        { at: 0.6,  pose: "upB" }, { at: 0.8,  pose: null }
      ]
    },

    // 被弾。体が脆いので大きく弾かれ、腹がすくんで翅が止まる
    beeHit: {
      duration: 320,
      offsetY: { amount: 15,    shape: "decay", cycles: 2 },
      alpha:   { amount: -0.45, shape: "fade" },
      poses: [
        { at: 0,    pose: "curl" },
        { at: 0.4,  pose: "downB" },
        { at: 0.6,  pose: null }
      ]
    },

    // 回避。翅をいちばん速く打って、横へすばやく抜ける
    beeDodge: {
      duration: 360,
      offsetX: { amount: 32, outRatio: 0.2 },
      offsetY: { amount: -6, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },  { at: 0.1, pose: "downB" },
        { at: 0.2,  pose: "upB" }, { at: 0.3, pose: "down" },
        { at: 0.5,  pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。図鑑「針をしまったまま、頭の上を回るのが好きだ」のとおり、
    // 腹を縮めて針をしまったまま、羽ばたきながらくるりと1回まわる（一回転に翅の羽ばたきを足したもの）
    beeCheer: {
      duration: 600,
      rotate:  { amount: 1,   shape: "rise" },
      offsetY: { amount: -12, shape: "pulse" },
      poses: [
        { at: 0,    pose: "upB" },  { at: 0.12, pose: "downB" },
        { at: 0.24, pose: "upB" },  { at: 0.36, pose: "downB" },
        { at: 0.48, pose: "upB" },  { at: 0.6,  pose: "downB" },
        { at: 0.72, pose: "upB" },  { at: 0.84, pose: "downB" },
        { at: 0.95, pose: null }
      ]
    },

    // 眠っている間。翅を体に沿ってたたみ、触角を垂らし、目の色が落ちる。低く、ゆっくり漂う
    beeSleeping: {
      pose: "sleep",
      offsetY: { offset: 4, amplitude: -1, period: 3200 }
    },

    // ─────────────────────────────────────────
    // ドロガメ専用（RC-1）。姿は neckOut（首を伸ばす）／blink（目を閉じる）／peek（頭と脚を半分引っ込める）／
    // hide（甲羅にこもる）／bite（首を伸ばして口を開ける）／stompL・stompR（前脚の足踏み）／sleep（半分引っ込めて居眠り）。
    // 重く遅い壁役。図鑑「甲羅に登られても怒らない。気がつくと居眠りしている」「泥が毒の元らしい」
    // ─────────────────────────────────────────

    // 通常攻撃（体当たり）。前脚で地面を踏みしめてから、甲羅にこもってどすんとぶつかり、顔を出す
    turtleTackle: {
      duration: 640,
      offsetY: { amount: 22, shape: "windup", backRatio: 0.4 },
      poses: [
        { at: 0,    pose: "stompL" },
        { at: 0.14, pose: "stompR" },
        { at: 0.28, pose: "hide" },
        { at: 0.74, pose: "peek" },
        { at: 0.88, pose: null }
      ]
    },

    // 体技・斬撃・踊り（2回突っ込む形とは別の動き）。甲羅にこもって1回転しながら滑り込み、ぶつかってから顔を出す
    turtleSpin: {
      duration: 900,
      offsetY: { amount: 28, shape: "windup", backRatio: 0.3 },
      rotate:  { amount: 1,  shape: "rise" },
      poses: [
        { at: 0,    pose: "peek" },
        { at: 0.1,  pose: "hide" },
        { at: 0.86, pose: "peek" },
        { at: 0.95, pose: null }
      ]
    },

    // 共鳴（地の技など）。首を伸ばし、前脚で交互に地面を踏み鳴らして地響きを起こす（その場から動かない）
    turtleResonate: {
      duration: 800,
      offsetX: { amount: 1.5,  shape: "wobble", cycles: 4 },
      scale:   { amount: 0.04, shape: "pulse" },
      poses: [
        { at: 0,    pose: "neckOut" },
        { at: 0.15, pose: "stompL" }, { at: 0.3,  pose: "stompR" },
        { at: 0.45, pose: "stompL" }, { at: 0.6,  pose: "stompR" },
        { at: 0.75, pose: "neckOut" },
        { at: 0.9,  pose: null }
      ]
    },

    // ブレス（毒の息）。頭を半分引っ込めて吸い込み、首を伸ばし口を開けて吐き出す
    turtleBreath: {
      duration: 760,
      offsetY: { amount: 10,   shape: "windup", backRatio: 0.45 },
      scale:   { amount: 0.05, shape: "pulse" },
      poses: [
        { at: 0,    pose: "peek" },
        { at: 0.45, pose: "bite" },
        { at: 0.88, pose: null }
      ]
    },

    // 自分・味方にかける技。甲羅にこもって身を固め、ゆっくり顔を出す
    turtleBuff: {
      duration: 700,
      scaleY: { amount: -0.04, shape: "pulse" },
      poses: [
        { at: 0,    pose: "hide" },
        { at: 0.65, pose: "peek" },
        { at: 0.85, pose: null }
      ]
    },

    // 被弾。とっさに甲羅にこもる。重いのでほとんど押されない
    turtleHit: {
      duration: 420,
      offsetY: { amount: 5,    shape: "decay", cycles: 2 },
      alpha:   { amount: -0.3, shape: "fade" },
      poses: [
        { at: 0,    pose: "hide" },
        { at: 0.6,  pose: "peek" },
        { at: 0.82, pose: null }
      ]
    },

    // 回避。跳べないので、甲羅にこもって横へずりっと滑る
    turtleDodge: {
      duration: 460,
      offsetX: { amount: 18, outRatio: 0.3 },
      poses: [
        { at: 0,    pose: "hide" },
        { at: 0.6,  pose: "peek" },
        { at: 0.8,  pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。首を伸ばして、前脚で交互に足踏みしながら小さく2回跳ねる
    turtleCheer: {
      duration: 760,
      offsetY: { amount: -6, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "neckOut" },
        { at: 0.15, pose: "stompL" }, { at: 0.3,  pose: "stompR" },
        { at: 0.45, pose: "stompL" }, { at: 0.6,  pose: "stompR" },
        { at: 0.75, pose: "neckOut" },
        { at: 0.95, pose: null }
      ]
    },

    // 眠っている間。頭と脚を半分引っ込めて目を閉じ、ゆっくり深く息をする（図鑑「気がつくと居眠りしている」）
    turtleSleeping: {
      pose: "sleep",
      scaleY: { offset: -0.02, amplitude: 0.014, period: 4200 }
    },

    // ─────────────────────────────────────────
    // ヌマボネ専用（RC-1）。姿は tiltL・tiltR（頭蓋をかしげる）／jaw（あごが外れたように開く）／glow（眼窩が明るく光る）／
    // rattle（頭蓋が浮いて目が光り、あごを開ける）／sink（泥へ沈む）／sleep（沈んで眼窩の光が消える）。
    // 下半身は泥に沈んだまま。図鑑「乾くと、ばらばらになるらしい」「眼窩の青い光は、嬉しいときに少しだけ明るくなる」
    // ─────────────────────────────────────────

    // 通常攻撃（体当たり）。頭蓋をかしげて溜め、骨をかたかた鳴らして（頭蓋が浮く）飛びかかり、あごで噛む
    boneLunge: {
      duration: 560,
      offsetY: { amount: 26, shape: "windup", backRatio: 0.35 },
      poses: [
        { at: 0,    pose: "tiltL" },
        { at: 0.18, pose: "tiltR" },
        { at: 0.35, pose: "rattle" },
        { at: 0.6,  pose: "jaw" },
        { at: 0.78, pose: null }
      ]
    },

    // 体技・斬撃・踊り（2回突っ込む形とは別の動き）。泥へ潜って滑り寄り、相手の足元で頭蓋を浮かせて噛みつく
    boneAmbush: {
      duration: 820,
      offsetY: { amount: 30,   shape: "windup", backRatio: 0.55 },
      alpha:   { amount: -0.35, shape: "pulse" },
      poses: [
        { at: 0,    pose: "sink" },
        { at: 0.58, pose: "rattle" },
        { at: 0.74, pose: "jaw" },
        { at: 0.9,  pose: null }
      ]
    },

    // 共鳴（ちからぬきなど）。眼窩を光らせ、頭蓋を左右にかくかく揺らして力を響かせる（その場から動かない）
    boneResonate: {
      duration: 760,
      scale:   { amount: 0.04, shape: "pulse" },
      poses: [
        { at: 0,    pose: "glow" },
        { at: 0.2,  pose: "tiltL" }, { at: 0.32, pose: "glow" },
        { at: 0.44, pose: "tiltR" }, { at: 0.56, pose: "glow" },
        { at: 0.88, pose: null }
      ]
    },

    // ブレス（闇の胞子など）。泥へ沈んで吸い込み、あごを外して前へ吐き出す
    boneBreath: {
      duration: 720,
      offsetY: { amount: 12,   shape: "windup", backRatio: 0.45 },
      scale:   { amount: 0.05, shape: "pulse" },
      poses: [
        { at: 0,    pose: "sink" },
        { at: 0.45, pose: "jaw" },
        { at: 0.88, pose: null }
      ]
    },

    // 自分・味方にかける技。眼窩を光らせて、頭蓋を浮かせる
    boneBuff: {
      duration: 560,
      offsetY: { amount: -6, shape: "pulse" },
      poses: [
        { at: 0,    pose: "glow" },
        { at: 0.85, pose: null }
      ]
    },

    // 被弾。骨がぐらつき、頭蓋が左右にかくかく揺れて泥へ沈みかける
    boneHit: {
      duration: 380,
      offsetY: { amount: 10,   shape: "decay", cycles: 2 },
      alpha:   { amount: -0.4, shape: "fade" },
      poses: [
        { at: 0,    pose: "sink" },
        { at: 0.3,  pose: "tiltR" },
        { at: 0.5,  pose: "tiltL" },
        { at: 0.72, pose: null }
      ]
    },

    // 回避。跳べないので、泥へ沈んで横へずれる
    boneDodge: {
      duration: 440,
      offsetX: { amount: 22, outRatio: 0.3 },
      poses: [
        { at: 0,    pose: "sink" },
        { at: 0.72, pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。図鑑「嬉しいときに少しだけ明るくなる」のとおり、眼窩を光らせて頭蓋を左右に揺らす
    boneCheer: {
      duration: 720,
      offsetY: { amount: -8, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "glow" },
        { at: 0.25, pose: "tiltL" }, { at: 0.4, pose: "glow" },
        { at: 0.55, pose: "tiltR" }, { at: 0.7, pose: "glow" },
        { at: 0.95, pose: null }
      ]
    },

    // 眠っている間。泥へ沈み、頭蓋を落として眼窩の光が消える。ゆっくり漂う
    boneSleeping: {
      pose: "sleep",
      offsetX: { amplitude: 0.8, period: 4200 }
    },

    // ─────────────────────────────────────────
    // ヌシガエル専用（RC-1）。姿は blink／lookL・lookR（目）・open／gape（口を開ける・大きく開ける）・
    // tongue（舌を伸ばす）・puff（のど袋をふくらませる）・happy（笑い目でふくらむ）・sleep（口を少し開けたまま眠る）。
    // 横に広い沼の主。図鑑「口を開けたまま何日も待てる」「丸ごと呑んでから嬉しそうに鳴く」。重いので動きは大きくゆっくり
    // ─────────────────────────────────────────

    // 通常攻撃（体当たり）。のど袋をふくらませて跳び上がり、口を開けてどすんとのしかかる
    lordSlam: {
      duration: 640,
      offsetY: { amount: 24, shape: "windup", backRatio: 0.3 },
      lift:    { amount: 14, shape: "pulse" },
      scaleX:  { amount: 0.05, shape: "wobble", cycles: 2 },
      poses: [
        { at: 0,    pose: "blink" },
        { at: 0.15, pose: "puff" },
        { at: 0.55, pose: "open" },
        { at: 0.8,  pose: null }
      ]
    },

    // 体技・斬撃・踊り（2回突っ込む形とは別の動き）。口を開けて舌を伸ばし、相手を絡め取って大口で呑み、のどをふくらませる
    lordTongue: {
      duration: 900,
      offsetY: { amount: 12, shape: "windup", backRatio: 0.4 },
      poses: [
        { at: 0,    pose: "open" },
        { at: 0.18, pose: "tongue" },
        { at: 0.5,  pose: "gape" },
        { at: 0.68, pose: "puff" },
        { at: 0.9,  pose: null }
      ]
    },

    // 共鳴（バブルなど）。その場でのど袋を何度もふくらませて鳴き、泡を吹く（その場から動かない）
    lordResonate: {
      duration: 860,
      scale:   { amount: 0.04, shape: "pulse" },
      poses: [
        { at: 0,    pose: "puff" },  { at: 0.18, pose: null },
        { at: 0.32, pose: "puff" },  { at: 0.5,  pose: null },
        { at: 0.64, pose: "puff" },  { at: 0.88, pose: null }
      ]
    },

    // ブレス（毒の息）。口を開けて吸い込み、大口を開けて吐き出す
    lordBreath: {
      duration: 800,
      offsetY: { amount: 10,   shape: "windup", backRatio: 0.45 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "open" },
        { at: 0.45, pose: "gape" },
        { at: 0.88, pose: null }
      ]
    },

    // 自分・味方にかける技。のど袋を大きくふくらませて、ぐっと身を起こす
    lordBuff: {
      duration: 640,
      scaleY:  { amount: 0.05, shape: "pulse" },
      offsetY: { amount: -6,   shape: "pulse" },
      poses: [
        { at: 0,    pose: "puff" },
        { at: 0.85, pose: null }
      ]
    },

    // 被弾。目をつぶって、重い体がわずかに押される
    lordHit: {
      duration: 400,
      offsetY: { amount: 7,    shape: "decay", cycles: 2 },
      alpha:   { amount: -0.35, shape: "fade" },
      poses: [
        { at: 0,    pose: "blink" },
        { at: 0.7,  pose: null }
      ]
    },

    // 回避。横へ小さく跳ぶ。跳ぶ方を目で追う
    lordDodge: {
      duration: 480,
      offsetX: { amount: 22, outRatio: 0.3 },
      offsetY: { amount: -6, shape: "pulse" },
      poses: [
        { at: 0,    pose: "blink" },
        { at: 0.15, pose: "lookR" },
        { at: 0.65, pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。図鑑「丸ごと呑んでから嬉しそうに鳴く」のとおり、大口で呑んでから、笑い目でのどをふくらませて鳴く
    lordCheer: {
      duration: 900,
      offsetY: { amount: -8, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "gape" },
        { at: 0.2,  pose: "puff" },
        { at: 0.38, pose: "happy" }, { at: 0.55, pose: "puff" },
        { at: 0.72, pose: "happy" }, { at: 0.95, pose: null }
      ]
    },

    // 眠っている間。目を閉じ、口を少し開けたまま（図鑑「口を開けたまま何日も待てる」）、ゆっくり深く息をする
    lordSleeping: {
      pose: "sleep",
      scaleX: { offset: 0.01,  amplitude: 0.02,  period: 4400 },
      scaleY: { offset: -0.02, amplitude: 0.014, period: 4400, phase: 0.25 }
    },

    // 眠っている間。作者の指定で、頭を下げ（体を少し前へ傾ける）、目を閉じ、もう少し脱力する。
    //   rotate の offset … 時計回り＝頭が下がる（絵は右向き）／ scaleY の offset … 背が沈んで、力が抜けた感じ
    dragonSleeping: {
      pose: "sleep",
      rotate: { offset: 0.014 },
      scaleX: { offset: 0.012,  amplitude: 0.028, period: 5600 },
      scaleY: { offset: -0.05,  amplitude: 0.028, period: 5600, phase: 0.18 }
    },

    // ═════════════════════════════════════════
    // 萌芽の穴・若葉の洞（v1.0.0）。5体とも、スライムと同じく「姿」（poses）を切り替えて動く。
    // 姿の絵は data/sprites_marsh.js の最後。ふだんの動き（〜Idle など）はコマ絵の並びと周期を合わせてある
    // ═════════════════════════════════════════

    // ─────────────────────────────────────────
    // フタバムシ。姿は leafUp（双葉が上がる）／leafDown（双葉がしおれる）／stretch（伸びる）／squash（縮む）／sleep。
    // 芋虫なので跳ねない。体を伸び縮みさせて動き、双葉がそれについてくる
    // ─────────────────────────────────────────

    // ふだん：縮んで伸びる（尺取り）。双葉が体より少し遅れて上下する。
    //   sprite: [元, LeafUp, Stretch, LeafUp, 元, LeafDown, Squash, LeafDown] × 240ms ＝ 1920ms
    wormIdle: {
      frames: { interval: 240 },
      scaleX: { amplitude: -0.012, period: 1920 }
    },

    // 通常攻撃（体当たり）。縮んで溜め → 伸びて飛びかかる → 当たって縮む
    wormTackle: {
      duration: 480,
      offsetY: { amount: 26, shape: "windup", backRatio: 0.3 },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.3,  pose: "stretch" },
        { at: 0.6,  pose: "squash" },
        { at: 0.75, pose: null }
      ]
    },

    // 体技・斬撃・踊り（ロックスパイクなど）。2回続けて伸び上がって打ちつける
    wormTechnique: {
      duration: 800,
      offsetY: { amount: 26, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.08, pose: "stretch" },
        { at: 0.42, pose: "squash" },
        { at: 0.58, pose: "stretch" },
        { at: 0.9,  pose: "squash" },
        { at: 0.97, pose: null }
      ]
    },

    // 共鳴。縮んで力をためてから、伸び上がって双葉を広げる（その場から動かない）
    wormResonate: {
      duration: 720,
      offsetY: { amount: -6,   shape: "pulse" },
      scaleY:  { amount: 0.05, shape: "pulse" },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.18, pose: "stretch" },
        { at: 0.5,  pose: "leafUp" },
        { at: 0.85, pose: null }
      ]
    },

    // ブレス。縮んで吸い込み、伸びながら前へ吐き出す
    wormBreath: {
      duration: 680,
      offsetY: { amount: 14,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.08, shape: "pulse" },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.5,  pose: "stretch" },
        { at: 0.85, pose: null }
      ]
    },

    // 自分・味方にかける技。双葉を上げて、伸び上がる
    wormBuff: {
      duration: 520,
      offsetY: { amount: -8, shape: "pulse" },
      poses: [
        { at: 0,    pose: "leafUp" },
        { at: 0.25, pose: "stretch" },
        { at: 0.75, pose: null }
      ]
    },

    // 被弾。縮こまって双葉がしおれ、揺れながら戻る
    wormHit: {
      duration: 340,
      offsetY: { amount: 10,   shape: "decay", cycles: 2 },
      alpha:   { amount: -0.4, shape: "fade" },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.45, pose: "leafDown" },
        { at: 0.75, pose: null }
      ]
    },

    // 回避。縮んでから、横へ這うように身をよじる
    wormDodge: {
      duration: 440,
      offsetX: { amount: 20, outRatio: 0.3 },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.3,  pose: "stretch" },
        { at: 0.6,  pose: null }
      ]
    },

    // 防御中。縮こまって双葉をたたむ（ずっと続く）
    wormGuard: {
      pose: "squash",
      scale: { offset: -0.04 }
    },

    // レベルアップ・スカウトに応じたとき。縮んで溜め、伸び上がって双葉を広げ、2回小さく跳ねる
    wormCheer: {
      duration: 680,
      offsetY: { amount: -10, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "squash" },
        { at: 0.12, pose: "leafUp" },
        { at: 0.5,  pose: "squash" },
        { at: 0.62, pose: "leafUp" },
        { at: 0.95, pose: null }
      ]
    },

    // 眠っている間。縮んで双葉がしおれ、目を閉じる（Sleep の絵）。ゆっくり深く息をする
    wormSleeping: {
      pose: "sleep",
      scaleY: { offset: -0.03, amplitude: 0.025, period: 3000 },
      scaleX: { offset: 0.02,  amplitude: -0.012, period: 3000 }
    },

    // ─────────────────────────────────────────
    // ユラツボミ。姿は swayL・swayR（つぼみを傾け、葉の腕を上げ下げする）／open（つぼみの先が開く）／sleep。
    // 名前のとおり、ゆらゆら揺れる。根が生えているので、その場から大きくは動かない
    // ─────────────────────────────────────────

    // ふだん：左右にゆっくり揺れる。
    //   sprite: [元, SwayL, 元, SwayR] × 520ms ＝ 2080ms ＝ 横の揺れの周期（傾いた側へ体も寄る）
    budSway: {
      frames:  { interval: 520 },
      offsetX: { amplitude: -1.2, period: 2080 },
      scaleY:  { amplitude: 0.012, period: 1040 }
    },

    // 通常攻撃。後ろへ傾いて溜め、反対へ振り下ろすように打つ
    budSwat: {
      duration: 500,
      offsetY: { amount: 22, shape: "windup", backRatio: 0.35 },
      poses: [
        { at: 0,    pose: "swayR" },
        { at: 0.35, pose: "swayL" },
        { at: 0.75, pose: null }
      ]
    },

    // 体技・斬撃・踊り（ララバイなど）。左右に大きく揺れて踊り、最後につぼみを開いて眠りを誘う
    budDance: {
      duration: 1000,
      offsetX: { amount: 3,    shape: "wobble", cycles: 3 },
      offsetY: { amount: -5,   shape: "pulse" },
      poses: [
        { at: 0,    pose: "swayL" }, { at: 0.14, pose: "swayR" },
        { at: 0.28, pose: "swayL" }, { at: 0.42, pose: "swayR" },
        { at: 0.56, pose: "swayL" }, { at: 0.7,  pose: "open" },
        { at: 0.92, pose: null }
      ]
    },

    // 共鳴（フラッシュ・キュアなど）。すっと伸び上がり、つぼみの先を開いて光を放つ（その場から動かない）
    budResonate: {
      duration: 720,
      offsetY: { amount: -8,   shape: "pulse" },
      scaleY:  { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: null },
        { at: 0.2,  pose: "open" },
        { at: 0.82, pose: null }
      ]
    },

    // ブレス。後ろへ傾いて吸い込み、つぼみを開いて前へ吐き出す
    budBreath: {
      duration: 680,
      offsetY: { amount: 12,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "swayR" },
        { at: 0.5,  pose: "open" },
        { at: 0.85, pose: null }
      ]
    },

    // 自分・味方にかける技。左右に一度揺れてから、つぼみを開く
    budBuff: {
      duration: 560,
      offsetY: { amount: -6, shape: "pulse" },
      poses: [
        { at: 0,    pose: "swayL" },
        { at: 0.2,  pose: "swayR" },
        { at: 0.4,  pose: "open" },
        { at: 0.8,  pose: null }
      ]
    },

    // 被弾。押されて大きくのけぞり、揺れながら戻る
    budHit: {
      duration: 380,
      offsetY: { amount: 10,   shape: "decay", cycles: 2 },
      alpha:   { amount: -0.4, shape: "fade" },
      poses: [
        { at: 0,    pose: "swayR" },
        { at: 0.3,  pose: "swayL" },
        { at: 0.6,  pose: null }
      ]
    },

    // 回避。根が生えているので跳ばず、横へぐにゃりと身をかわす
    budDodge: {
      duration: 420,
      offsetX: { amount: 14, outRatio: 0.3 },
      poses: [
        { at: 0,    pose: "swayR" },
        { at: 0.55, pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。左右に揺れてから、つぼみを開いて喜ぶ
    budCheer: {
      duration: 760,
      offsetY: { amount: -8, shape: "pulse" },
      poses: [
        { at: 0,    pose: "swayL" },
        { at: 0.18, pose: "swayR" },
        { at: 0.36, pose: "open" },
        { at: 0.9,  pose: null }
      ]
    },

    // 眠っている間。目を閉じ（Sleep の絵）、ゆっくり左右に揺れながら息をする
    budSleeping: {
      pose: "sleep",
      offsetX: { amplitude: 0.8, period: 4000 },
      scaleY:  { offset: -0.03, amplitude: 0.02, period: 4000, phase: 0.25 }
    },

    // ─────────────────────────────────────────
    // ワカバドリ。姿は up（翼を振り上げ）／down（振り下ろし）／sleep（翼をたたみ、目を閉じる）。
    // コウモリと同じく、翼の上げ下げで勢いを見せる。追い風に乗る速い鳥なので、羽ばたきは速め
    // ─────────────────────────────────────────

    // ふだん：その場で羽ばたいて浮く。
    //   sprite: [Up, 元, Down, 元] × 100ms ＝ 400ms ＝ 上下の揺れの周期。振り下ろした直後に体がいちばん高く浮く
    birdHover: {
      frames:  { interval: 100 },
      offsetY: { amplitude: -2.2, period: 400, phase: 0.375 }
    },

    // 通常攻撃（ついばむ）。翼を振り上げて溜め → 振り下ろして一気に突っ込む
    birdPeck: {
      duration: 420,
      offsetY: { amount: 30, shape: "windup", backRatio: 0.3 },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.3,  pose: "down" },
        { at: 0.65, pose: null }
      ]
    },

    // 体技・斬撃・踊り。2回続けて突っ込む（1回ごとに翼を打ち下ろす）
    birdTechnique: {
      duration: 720,
      offsetY: { amount: 30, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.1,  pose: "down" },
        { at: 0.38, pose: "up" },
        { at: 0.6,  pose: "down" },
        { at: 0.88, pose: null }
      ]
    },

    // 共鳴（ウィンド・ゲイルなど）。その場で舞い上がり、小刻みに羽ばたいて風を起こす
    birdResonate: {
      duration: 700,
      offsetY: { amount: -14, shape: "pulse" },
      poses: [
        { at: 0,   pose: "up" },   { at: 0.1, pose: "down" },
        { at: 0.2, pose: "up" },   { at: 0.3, pose: "down" },
        { at: 0.4, pose: "up" },   { at: 0.5, pose: "down" },
        { at: 0.6, pose: "up" },   { at: 0.7, pose: "down" },
        { at: 0.8, pose: null }
      ]
    },

    // ブレス。翼を振り上げて身を引き（吸い込む）、振り下ろしながら前へ吐き出す
    birdBreath: {
      duration: 640,
      offsetY: { amount: 14,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.5,  pose: "down" },
        { at: 0.85, pose: null }
      ]
    },

    // 自分・味方にかける技。羽ばたいて浮き上がる
    birdBuff: {
      duration: 520,
      offsetY: { amount: -12, shape: "pulse" },
      poses: [
        { at: 0,    pose: "down" }, { at: 0.15, pose: "up" },
        { at: 0.3,  pose: "down" }, { at: 0.45, pose: "up" },
        { at: 0.6,  pose: "down" }, { at: 0.78, pose: null }
      ]
    },

    // 被弾。翼を跳ね上げてのけぞり、揺れながら戻る
    birdHit: {
      duration: 300,
      offsetY: { amount: 13,   shape: "decay", cycles: 2 },
      alpha:   { amount: -0.45, shape: "fade" },
      poses: [
        { at: 0,   pose: "up" },
        { at: 0.5, pose: null }
      ]
    },

    // 回避。翼をひと打ちして、横へすばやく逃げる（コウモリより少し遠くへ）
    birdDodge: {
      duration: 360,
      offsetX: { amount: 30, outRatio: 0.2 },
      offsetY: { amount: -8, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.12, pose: "down" },
        { at: 0.4,  pose: "up" },
        { at: 0.55, pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。羽ばたきながら、その場で一回転
    birdCheer: {
      duration: 560,
      rotate:  { amount: 1,   shape: "rise" },
      offsetY: { amount: -12, shape: "pulse" },
      poses: [
        { at: 0,   pose: "up" },   { at: 0.2, pose: "down" },
        { at: 0.4, pose: "up" },   { at: 0.6, pose: "down" },
        { at: 0.8, pose: "up" },   { at: 0.95, pose: null }
      ]
    },

    // 眠っている間。翼をたたんで目を閉じ（Sleep の絵）、地面に降りて小さく息をする
    birdSleeping: {
      pose: "sleep",
      scaleY: { offset: -0.04, amplitude: 0.02, period: 2600 },
      scaleX: { offset: 0.02,  amplitude: -0.01, period: 2600 }
    },

    // ─────────────────────────────────────────
    // コケガメ。姿は blink（まばたき）／lookUp（頭を上げる）／peek（頭と脚を半分引っ込める）／hide（甲羅にこもる）／
    // stompL・stompR（脚の足踏み）／sleep（半分引っ込めて居眠り）。
    // 重い壁役。ドロガメと同じく、こもる・顔を出すで見せる。甲羅の苔と双葉は動かさない
    // ─────────────────────────────────────────

    // ふだん：ゆっくり息をしながら、見上げる・まばたき・足踏みをくり返す。
    //   sprite: [元, LookUp, 元, Blink, 元, StompL, 元, StompR] × 700ms
    kokeBreathe: {
      frames: { interval: 700 },
      scaleY: { amplitude: 0.012, period: 2800 }
    },

    // 通常攻撃（噛みつく・体当たり）。足踏みしてから、頭を突き出してぶつかる
    kokeBite: {
      duration: 600,
      offsetY: { amount: 20, shape: "windup", backRatio: 0.4 },
      poses: [
        { at: 0,    pose: "stompL" },
        { at: 0.15, pose: "stompR" },
        { at: 0.4,  pose: "lookUp" },
        { at: 0.8,  pose: null }
      ]
    },

    // 体技・斬撃・踊り。甲羅にこもって滑り込み、ぶつかってから顔を出す
    kokeSlide: {
      duration: 760,
      offsetY: { amount: 26, shape: "windup", backRatio: 0.3 },
      poses: [
        { at: 0,    pose: "peek" },
        { at: 0.12, pose: "hide" },
        { at: 0.8,  pose: "peek" },
        { at: 0.92, pose: null }
      ]
    },

    // 共鳴（ウェーブ・クレンズなど）。頭を上げ、脚で交互に地面を踏み鳴らして力を響かせる（その場から動かない）
    kokeResonate: {
      duration: 800,
      offsetX: { amount: 1.2,  shape: "wobble", cycles: 4 },
      scale:   { amount: 0.04, shape: "pulse" },
      poses: [
        { at: 0,    pose: "lookUp" },
        { at: 0.15, pose: "stompL" }, { at: 0.3,  pose: "stompR" },
        { at: 0.45, pose: "stompL" }, { at: 0.6,  pose: "stompR" },
        { at: 0.75, pose: "lookUp" },
        { at: 0.9,  pose: null }
      ]
    },

    // ブレス（あわ）。頭を半分引っ込めて吸い込み、頭を上げて吐き出す
    kokeBreath: {
      duration: 740,
      offsetY: { amount: 10,   shape: "windup", backRatio: 0.45 },
      scale:   { amount: 0.05, shape: "pulse" },
      poses: [
        { at: 0,    pose: "peek" },
        { at: 0.45, pose: "lookUp" },
        { at: 0.86, pose: null }
      ]
    },

    // 自分・味方にかける技。甲羅にこもって身を固め、ゆっくり顔を出す
    kokeBuff: {
      duration: 680,
      scaleY: { amount: -0.04, shape: "pulse" },
      poses: [
        { at: 0,    pose: "hide" },
        { at: 0.6,  pose: "peek" },
        { at: 0.82, pose: null }
      ]
    },

    // 被弾。とっさに甲羅にこもる。重いのでほとんど押されない
    kokeHit: {
      duration: 420,
      offsetY: { amount: 5,    shape: "decay", cycles: 2 },
      alpha:   { amount: -0.3, shape: "fade" },
      poses: [
        { at: 0,    pose: "hide" },
        { at: 0.6,  pose: "peek" },
        { at: 0.82, pose: null }
      ]
    },

    // 回避。跳べないので、甲羅にこもって横へずりっと滑る
    kokeDodge: {
      duration: 460,
      offsetX: { amount: 16, outRatio: 0.3 },
      poses: [
        { at: 0,    pose: "hide" },
        { at: 0.6,  pose: "peek" },
        { at: 0.8,  pose: null }
      ]
    },

    // 防御中。甲羅にこもったまま（ずっと続く。特性「硬い殻」らしく）
    kokeGuard: {
      pose: "hide",
      scale: { offset: -0.03 }
    },

    // レベルアップ・スカウトに応じたとき。頭を上げて、脚で交互に足踏みしながら小さく2回跳ねる
    kokeCheer: {
      duration: 760,
      offsetY: { amount: -6, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "lookUp" },
        { at: 0.15, pose: "stompL" }, { at: 0.3,  pose: "stompR" },
        { at: 0.45, pose: "stompL" }, { at: 0.6,  pose: "stompR" },
        { at: 0.75, pose: "lookUp" },
        { at: 0.95, pose: null }
      ]
    },

    // 眠っている間。頭と脚を半分引っ込めて目を閉じ、ゆっくり深く息をする
    kokeSleeping: {
      pose: "sleep",
      scaleY: { offset: -0.02, amplitude: 0.014, period: 4200 }
    },

    // ─────────────────────────────────────────
    // コダマ。姿は up（双葉と腕を上げる）／down（下げる）／bright（体が光る）／sleep。
    // 浮いている精なので、ずっと漂う。光の粒はコマごとに場所が変わり、またたいて見える
    // ─────────────────────────────────────────

    // ふだん：ふわふわ漂いながら、双葉と腕をゆっくり上げ下げする。
    //   sprite: [元, Up, 元, Down] × 300ms ＝ 1200ms ＝ 上下の揺れの周期（双葉を上げたときに体が浮く）
    kodamaFloat: {
      frames:  { interval: 300 },
      offsetY: { amplitude: -2.6, period: 1200, phase: 0.25 },
      alpha:   { amplitude: -0.06, period: 2400 }
    },

    // 通常攻撃。双葉と腕を上げて溜め、振り下ろしながら体ごとぶつかる
    kodamaBump: {
      duration: 460,
      offsetY: { amount: 26, shape: "windup", backRatio: 0.3 },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.3,  pose: "down" },
        { at: 0.7,  pose: null }
      ]
    },

    // 体技・斬撃・踊り。2回続けてぶつかる
    kodamaTechnique: {
      duration: 760,
      offsetY: { amount: 26, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.1,  pose: "down" },
        { at: 0.4,  pose: "up" },
        { at: 0.6,  pose: "down" },
        { at: 0.9,  pose: null }
      ]
    },

    // 共鳴（シャイン・グレアなど）。舞い上がって双葉を広げ、体を光らせる（その場から動かない）
    kodamaResonate: {
      duration: 760,
      offsetY: { amount: -12,  shape: "pulse" },
      scaleY:  { amount: 0.05, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.2,  pose: "bright" },
        { at: 0.85, pose: null }
      ]
    },

    // ブレス。双葉を下げて身を縮め、上げながら前へ吐き出す
    kodamaBreath: {
      duration: 660,
      offsetY: { amount: 14,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "down" },
        { at: 0.5,  pose: "up" },
        { at: 0.85, pose: null }
      ]
    },

    // 自分・味方にかける技。光りながら、ふわりと浮き上がる
    kodamaBuff: {
      duration: 560,
      offsetY: { amount: -10, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.25, pose: "bright" },
        { at: 0.78, pose: null }
      ]
    },

    // 被弾。双葉と腕がしおれ、揺れながら戻る
    kodamaHit: {
      duration: 320,
      offsetY: { amount: 12,   shape: "decay", cycles: 2 },
      alpha:   { amount: -0.45, shape: "fade" },
      poses: [
        { at: 0,    pose: "down" },
        { at: 0.5,  pose: null }
      ]
    },

    // 回避。双葉を上げて、横へふわりと流れる
    kodamaDodge: {
      duration: 420,
      offsetX: { amount: 26, outRatio: 0.25 },
      offsetY: { amount: -6, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.5,  pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。光りながら、その場で一回転する
    kodamaCheer: {
      duration: 620,
      rotate:  { amount: 1,   shape: "rise" },
      offsetY: { amount: -12, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.2,  pose: "bright" },
        { at: 0.8,  pose: "up" },
        { at: 0.95, pose: null }
      ]
    },

    // 眠っている間。双葉と腕を下げ、目を閉じて（Sleep の絵）、低く漂う
    kodamaSleeping: {
      pose: "sleep",
      offsetY: { offset: 3, amplitude: -1, period: 3400 },
      scaleY:  { offset: -0.02, amplitude: 0.02, period: 3400 }
    },

    // ─────────────────────────────────────────
    // 若葉の洞の主ヒコバエ。姿は armsOut（根の腕を広げる）／armsUp（掲げる）／leafL・leafR（頭の葉が揺れる）／
    // glare（目を見開く）／sleep（葉がしおれ、目を閉じる）。
    // 根を張った重い主なので跳ねない。ゆっくり息をし、頭の葉が風に揺れる
    // ─────────────────────────────────────────

    // ふだん：深く息をしながら、頭の葉が左右に揺れる。
    //   sprite: [元, LeafL, 元, LeafR] × 560ms ＝ 2240ms。息はその2倍の周期でゆっくり
    woodLordBreathe: {
      frames: { interval: 560 },
      scaleX: { amplitude: 0.014, period: 4480 },
      scaleY: { amplitude: 0.020, period: 4480, phase: 0.2 }
    },

    // 通常攻撃。根の腕を高く掲げて溜め、振り下ろして叩きつける
    woodLordSlam: {
      duration: 640,
      offsetY: { amount: 22, shape: "windup", backRatio: 0.45 },
      poses: [
        { at: 0,    pose: "armsUp" },
        { at: 0.45, pose: "armsOut" },
        { at: 0.8,  pose: null }
      ]
    },

    // 体技・斬撃・踊り。根の腕を広げて、左右に振り回しながら2回踏み込む
    woodLordSweep: {
      duration: 860,
      offsetY: { amount: 20, shape: "hops", count: 2 },
      offsetX: { amount: 2,  shape: "wobble", cycles: 2 },
      poses: [
        { at: 0,    pose: "armsUp" },
        { at: 0.2,  pose: "armsOut" },
        { at: 0.5,  pose: "armsUp" },
        { at: 0.7,  pose: "armsOut" },
        { at: 0.92, pose: null }
      ]
    },

    // 共鳴（地の技など）。根の腕を掲げ、目を見開いて地の力を響かせる（その場から動かない）
    woodLordResonate: {
      duration: 820,
      offsetY: { amount: -6,   shape: "pulse" },
      scaleY:  { amount: 0.05, shape: "pulse" },
      poses: [
        { at: 0,    pose: "armsUp" },
        { at: 0.35, pose: "glare" },
        { at: 0.85, pose: null }
      ]
    },

    // ブレス。腕を広げて身を引き（吸い込む）、目を見開いて吐き出す
    woodLordBreath: {
      duration: 760,
      offsetY: { amount: 12,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.05, shape: "pulse" },
      poses: [
        { at: 0,    pose: "armsOut" },
        { at: 0.5,  pose: "glare" },
        { at: 0.88, pose: null }
      ]
    },

    // 自分・味方にかける技。根の腕を掲げ、頭の葉を揺らす
    woodLordBuff: {
      duration: 720,
      offsetY: { amount: -6, shape: "pulse" },
      poses: [
        { at: 0,    pose: "armsUp" },
        { at: 0.3,  pose: "leafL" },
        { at: 0.5,  pose: "leafR" },
        { at: 0.7,  pose: "armsUp" },
        { at: 0.88, pose: null }
      ]
    },

    // 被弾。腕が跳ね、頭の葉が揺れる。重いのでほとんど押されない
    woodLordHit: {
      duration: 420,
      offsetY: { amount: 5,    shape: "decay", cycles: 2 },
      alpha:   { amount: -0.3, shape: "fade" },
      poses: [
        { at: 0,    pose: "armsOut" },
        { at: 0.3,  pose: "leafR" },
        { at: 0.6,  pose: "leafL" },
        { at: 0.85, pose: null }
      ]
    },

    // 回避。根を引きずって、横へわずかにずれる
    woodLordDodge: {
      duration: 460,
      offsetX: { amount: 12, outRatio: 0.35 },
      poses: [
        { at: 0,    pose: "leafL" },
        { at: 0.6,  pose: null }
      ]
    },

    // レベルアップ・スカウトに応じたとき。根の腕を掲げ、頭の葉を揺らして小さく2回跳ねる
    woodLordCheer: {
      duration: 800,
      offsetY: { amount: -6, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "armsUp" },
        { at: 0.25, pose: "leafL" },
        { at: 0.5,  pose: "armsUp" },
        { at: 0.75, pose: "leafR" },
        { at: 0.95, pose: null }
      ]
    },

    // 眠っている間。頭の葉がしおれ、目を閉じて（Sleep の絵）、ゆっくり深く息をする
    woodLordSleeping: {
      pose: "sleep",
      scaleX: { offset: 0.01,  amplitude: 0.016, period: 5000 },
      scaleY: { offset: -0.03, amplitude: 0.018, period: 5000, phase: 0.25 }
    },

    // ─────────────────────────────────────────
    // 千年樹の根底の主・カラクリモリ（v1.3.0・2026-11-03）。木と真鍮のからくり。
    // 姿は data/monsters.js の gearWarden の poses（絵は sprites_marsh.js の gearWarden〜）。
    //   armRUp / armLUp（片腕を振り上げる）・stepL / stepR（片足を上げて踏み出す）・crouch（膝を折って沈む）・
    //   sparkA / sparkB（胸を開いて火花が散る）・recoil（被弾）・slump（倒れる）・armsOut / armsUp・sleep
    // 重いからくりなので跳ねない。腕を振り上げ、踏み込み、膝を折って叩きつける。雷の技は体中から火花を散らす
    // ─────────────────────────────────────────

    // ふだん：胸の芯が脈打ち、はさみの手が開け閉めし、歯車が回る（sprite の4枚 × 560ms）。
    //   体はからくりらしく小さく上下するだけ
    gearIdle: {
      frames: { interval: 560 },
      offsetY: { amplitude: -0.8, period: 2240 },
      scaleY:  { amplitude: 0.010, period: 2240, phase: 0.25 }
    },

    // 通常攻撃。右腕を振り上げて溜め、左足で踏み込みながら、膝を折って叩きつける
    gearSlam: {
      duration: 760,
      offsetY: { amount: 24, shape: "windup", backRatio: 0.45 },
      scaleY:  { amount: -0.05, shape: "windup", backRatio: 0.45 },
      poses: [
        { at: 0,    pose: "armRUp" },
        { at: 0.3,  pose: "stepL" },
        { at: 0.45, pose: "crouch" },
        { at: 0.82, pose: null }
      ]
    },

    // 体技・斬撃・踊り（鎧くずし・歯車投げ・しびれ粉）。右・左と交互に腕を振り上げ、踏み込んで2回叩きつける
    gearPummel: {
      duration: 980,
      offsetY: { amount: 18, shape: "hops", count: 2 },
      offsetX: { amount: 3,  shape: "wobble", cycles: 2 },
      poses: [
        { at: 0,    pose: "armRUp" },
        { at: 0.16, pose: "stepL" },
        { at: 0.26, pose: "crouch" },
        { at: 0.46, pose: "armLUp" },
        { at: 0.62, pose: "stepR" },
        { at: 0.72, pose: "crouch" },
        { at: 0.9,  pose: null }
      ]
    },

    // 共鳴（雷の技）。腕を広げて胸を開き、体中から火花を散らす（その場から動かない）
    gearResonate: {
      duration: 900,
      offsetY: { amount: -5,   shape: "pulse" },
      scaleY:  { amount: 0.05, shape: "pulse" },
      offsetX: { amount: 1.5,  shape: "wobble", cycles: 4 },
      poses: [
        { at: 0,    pose: "armsOut" },
        { at: 0.18, pose: "sparkA" },
        { at: 0.34, pose: "sparkB" },
        { at: 0.5,  pose: "sparkA" },
        { at: 0.66, pose: "sparkB" },
        { at: 0.86, pose: null }
      ]
    },

    // ブレス。膝を折って溜め、伸び上がって胸から吐き出す
    gearBreath: {
      duration: 800,
      offsetY: { amount: 12,   shape: "windup", backRatio: 0.5 },
      scale:   { amount: 0.05, shape: "pulse" },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.5,  pose: "sparkA" },
        { at: 0.88, pose: null }
      ]
    },

    // 自分・味方にかける技（こうか・ちからため・鼓舞の舞）。膝を折って力をため、腕を広げ、振り上げる
    gearBuff: {
      duration: 820,
      offsetY: { amount: -6, shape: "pulse" },
      poses: [
        { at: 0,    pose: "crouch" },
        { at: 0.3,  pose: "armsOut" },
        { at: 0.5,  pose: "armsUp" },
        { at: 0.7,  pose: "armsOut" },
        { at: 0.88, pose: null }
      ]
    },

    // 被弾。目を閉じ、腕が跳ね上がって片足が浮く。重いのでほとんど押されない
    gearHit: {
      duration: 440,
      offsetY: { amount: 5,    shape: "decay", cycles: 2 },
      offsetX: { amount: 2,    shape: "wobble", cycles: 3 },
      alpha:   { amount: -0.3, shape: "fade" },
      poses: [
        { at: 0,    pose: "recoil" },
        { at: 0.55, pose: "crouch" },
        { at: 0.85, pose: null }
      ]
    },

    // 回避。片足ずつ踏みかえて、横へずれる
    gearDodge: {
      duration: 480,
      offsetX: { amount: 14, outRatio: 0.35 },
      poses: [
        { at: 0,    pose: "stepL" },
        { at: 0.3,  pose: "stepR" },
        { at: 0.6,  pose: null }
      ]
    },

    // 守り。膝を折って沈んだまま構える
    gearGuard: {
      pose: "crouch",
      scaleX: { offset: 0.02 }
    },

    // 倒れる。腕が跳ね、膝が折れて頭が肩に沈み、光が消えて崩れる
    gearFall: {
      duration: 1000,
      offsetY: { amount: 8,     shape: "rise" },
      scale:   { amount: -0.35, shape: "rise" },
      alpha:   { amount: -1,    shape: "rise" },
      poses: [
        { at: 0,    pose: "recoil" },
        { at: 0.2,  pose: "slump" }
      ]
    },

    // レベルアップ・スカウトに応じたとき。左右に足踏みし、両腕を掲げて火花を散らす
    gearCheer: {
      duration: 900,
      offsetY: { amount: -5, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "stepL" },
        { at: 0.25, pose: "armsUp" },
        { at: 0.45, pose: "stepR" },
        { at: 0.7,  pose: "sparkB" },
        { at: 0.92, pose: null }
      ]
    },

    // 眠っている間。目と胸の光が消え（Sleep の絵）、歯車が止まったまま、ほとんど動かない
    gearSleeping: {
      pose: "sleep",
      scaleY: { offset: -0.02, amplitude: 0.008, period: 5200 }
    },

    // ─────────────────────────────────────────
    // 千年樹の根底の在来種（v1.3.0・2026-11-04）。姿は data/monsters.js の poses（絵は sprites_marsh.js の末尾）
    // ─────────────────────────────────────────

    // ウェポン：ふだんは炉が脈打ち、左右の腕が交互に上下する（sprite の4枚）
    weaponIdle: {
      frames: { interval: 420 },
      offsetY: { amplitude: -0.6, period: 1680 }
    },
    // 通常攻撃。両腕を振り上げ、踏み込みながら剣を横へ振り抜く
    weaponSlash: {
      duration: 640,
      offsetY: { amount: 22, shape: "windup", backRatio: 0.4 },
      poses: [
        { at: 0,    pose: "raise" },
        { at: 0.42, pose: "swingL" },
        { at: 0.85, pose: null }
      ]
    },
    // 斬撃の技。剣と斧で2度斬る
    weaponCleave: {
      duration: 860,
      offsetY: { amount: 16, shape: "hops", count: 2 },
      offsetX: { amount: 3,  shape: "wobble", cycles: 2 },
      poses: [
        { at: 0,    pose: "raise" },
        { at: 0.2,  pose: "swingL" },
        { at: 0.46, pose: "raise" },
        { at: 0.62, pose: "swingR" },
        { at: 0.9,  pose: null }
      ]
    },
    // 力をためる。腕を掲げ、炉が明るくなる
    weaponBuff: {
      duration: 760,
      offsetY: { amount: -5, shape: "pulse" },
      poses: [
        { at: 0,    pose: "raise" },
        { at: 0.25, pose: "charge" },
        { at: 0.85, pose: null }
      ]
    },
    weaponHit: {
      duration: 400,
      offsetY: { amount: 5,    shape: "decay", cycles: 2 },
      offsetX: { amount: 3,    shape: "wobble", cycles: 3 },
      alpha:   { amount: -0.3, shape: "fade" },
      poses: [
        { at: 0,    pose: "hit" },
        { at: 0.8,  pose: null }
      ]
    },
    weaponDodge: {
      duration: 460,
      offsetX: { amount: 16, outRatio: 0.35 },
      poses: [
        { at: 0,    pose: "stepL" },
        { at: 0.3,  pose: "stepR" },
        { at: 0.6,  pose: null }
      ]
    },
    weaponCheer: {
      duration: 860,
      offsetY: { amount: -5, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "stepL" },
        { at: 0.25, pose: "raise" },
        { at: 0.5,  pose: "stepR" },
        { at: 0.72, pose: "charge" },
        { at: 0.92, pose: null }
      ]
    },
    weaponSleeping: {
      pose: "sleep",
      scaleY: { offset: -0.02, amplitude: 0.008, period: 5000 }
    },

    // コハクカブト：ふだんはほとんど動かない（作者 2026-11-10）。
    //   絵は16コマで、ほとんどが止まった絵。光が2回・脚の踏みかえが左右1回ずつ、9.6秒で1周する
    beetleIdle: {
      frames: { interval: 600 },
      scaleY: { amplitude: 0.005, period: 4800 }
    },
    // 攻撃・技。どっしり構えたまま、少しだけ前へ押し出す
    //   （作者「技をうったりするときもなるべく動かないように」2026-11-10。
    //    前は 26 突っ込んで脚を左右に踏みかえていた → 8 だけ・脚の踏みかえなし）
    beetleRam: {
      duration: 600,
      offsetY: { amount: 8, shape: "windup", backRatio: 0.45 },
      scaleY:  { amount: -0.02, shape: "windup", backRatio: 0.45 },
      poses: [
        { at: 0,    pose: "rear" },
        { at: 0.7,  pose: null }
      ]
    },
    // 守りを固める・共鳴・ブレス。その場でわずかに沈み、琥珀が明るくなる
    //   （作者 2026-11-10。前は縦 −0.08・横 +0.04 の伸び縮み → −0.03・+0.015）
    beetleBrace: {
      duration: 640,
      scaleY: { amount: -0.03,  shape: "pulse" },
      scaleX: { amount: 0.015, shape: "pulse" },
      poses: [
        { at: 0,    pose: "rear" },
        { at: 0.8,  pose: null }
      ]
    },
    beetleHit: {
      duration: 400,
      offsetY: { amount: 3,    shape: "decay", cycles: 2 },
      offsetX: { amount: 2,    shape: "wobble", cycles: 3 },
      alpha:   { amount: -0.3, shape: "fade" },
      poses: [
        { at: 0,    pose: "hit" },
        { at: 0.8,  pose: null }
      ]
    },
    beetleCheer: {
      duration: 820,
      offsetY: { amount: -5, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "legL" },
        { at: 0.25, pose: "rear" },
        { at: 0.5,  pose: "legR" },
        { at: 0.75, pose: "rear" },
        { at: 0.92, pose: null }
      ]
    },
    beetleSleeping: {
      pose: "sleep",
      scaleY: { offset: -0.03, amplitude: 0.01, period: 5000 }
    },

    // ジュエキスライム：ふだんはゆっくり伸び縮みし、体の下から樹液が垂れる（sprite の4枚）
    sapIdle: {
      frames: { interval: 620 },
      scaleX: { amplitude: 0.03,  period: 2480 },
      scaleY: { amplitude: -0.03, period: 2480 }
    },
    // 体当たり。体を左右へ広げて、ねばりつく
    sapBump: {
      duration: 600,
      offsetY: { amount: 20, shape: "windup", backRatio: 0.4 },
      scaleX:  { amount: 0.1,  shape: "pulse" },
      scaleY:  { amount: -0.1, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.4,  pose: "wide" },
        { at: 0.85, pose: null }
      ]
    },
    // 回復・足止め。腕のように樹液を伸ばす
    sapCast: {
      duration: 780,
      offsetY: { amount: -5, shape: "pulse" },
      scaleY:  { amount: 0.06, shape: "pulse" },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.45, pose: "wide" },
        { at: 0.65, pose: "up" },
        { at: 0.88, pose: null }
      ]
    },
    sapHit: {
      duration: 420,
      scaleX: { amount: 0.1,  shape: "decay", cycles: 2 },
      scaleY: { amount: -0.1, shape: "decay", cycles: 2 },
      alpha:  { amount: -0.3, shape: "fade" },
      poses: [
        { at: 0,    pose: "hit" },
        { at: 0.8,  pose: null }
      ]
    },
    sapCheer: {
      duration: 800,
      offsetY: { amount: -7, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.5,  pose: "wide" },
        { at: 0.75, pose: "up" },
        { at: 0.92, pose: null }
      ]
    },
    sapSleeping: {
      pose: "sleep",
      scaleY: { offset: -0.05, amplitude: 0.02, period: 4600 },
      scaleX: { offset: 0.03,  amplitude: 0.01, period: 4600, phase: 0.25 }
    },

    // ジュエル：ふだんはふわふわ浮き、きらめきが動き、小さな手が交互に動く
    jewelFloat: {
      frames: { interval: 360 },
      offsetY: { amplitude: -3, period: 1440 }
    },
    // 体当たり。小さな手を上げて、すばやくぶつかる
    jewelBump: {
      duration: 420,
      offsetY: { amount: 18, shape: "windup", backRatio: 0.45 },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.85, pose: null }
      ]
    },
    jewelHit: {
      duration: 360,
      offsetX: { amount: 3,    shape: "wobble", cycles: 4 },
      alpha:   { amount: -0.2, shape: "fade" },
      poses: [
        { at: 0,    pose: "hit" },
        { at: 0.8,  pose: null }
      ]
    },
    jewelDodge: {
      duration: 320,
      offsetX: { amount: 20, outRatio: 0.3 }
    },
    // 逃げる。手を上げて跳ね上がり、消える
    jewelFlee: {
      duration: 560,
      lift:  { amount: 46, shape: "rise" },
      alpha: { amount: -1, shape: "rise" },
      poses: [
        { at: 0, pose: "up" }
      ]
    },
    // 倒れる。小さく震えて砕ける
    jewelShatter: {
      duration: 760,
      offsetX: { amount: 3,     shape: "wobble", cycles: 6 },
      scale:   { amount: -0.45, shape: "rise" },
      alpha:   { amount: -1,    shape: "rise" },
      poses: [
        { at: 0, pose: "hit" }
      ]
    },
    jewelCheer: {
      duration: 700,
      offsetY: { amount: -8, shape: "hops", count: 2 },
      poses: [
        { at: 0,    pose: "up" },
        { at: 0.9,  pose: null }
      ]
    },
    jewelSleeping: {
      pose: "sleep",
      offsetY: { amplitude: -1, period: 4200 }
    },

    /**
     * --- シニガミ（蔦這う回廊の初見殺し。2026-10-21） ---
     * 姿は sprites_marsh.js の shinigami（ふつう）・shinigamiRaise（振りかぶる）・shinigamiSwing（振り下ろす）。
     * 影なので跳ねたり歩いたりしない。漂い、揺らぎ、すっと間合いを詰める
     */

    // ふだん：ゆっくり上下に漂い、影の濃さが揺らぐ（実体の無い感じ）
    reaperFloat: {
      offsetY: { amplitude: -3.0,  period: 2600 },
      offsetX: { amplitude: 1.0,   period: 3900, phase: 0.3 },
      alpha:   { amplitude: -0.14, period: 1900 }
    },

    /**
     * 死神の鎌（専用の動き。作者の指定。2026-10-21 に作り直した）。技の側に motion: "reap" と書いてある。
     *   0.00〜0.20  鎌を振りかぶる（raise）
     *   0.20〜0.50  さらに大きく、肩に担ぐように振りかぶる（windup）。小刻みに震える（来る、と分からせる）
     *   0.50        振りの途中のコマ（mid：刃が伸び、軌跡が残る）
     *   0.56        振り下ろしのコマ（swing）。ここで当たる（技の windupMs 840 ＝ 0.56 × 1500）
     *   0.56〜0.88  振り抜いたまま止まる（残心）
     * ★ 作者の指定「撃ったときにシニガミ自体が動きすぎないように」で、体の踏み込み・ふくらみ・傾きは小さくしてある。
     *   見せ場は鎌の絵の切り替わりと、当たった演出（data/effects.js の reap）に任せる
     */
    reaperScythe: {
      duration: 1500,
      offsetY: { amount: 10,   shape: "windup", backRatio: 0.5 },
      offsetX: { amount: 0.8,  shape: "wobble", cycles: 9 },
      scale:   { amount: 0.04, shape: "pulse" },
      poses: [
        { at: 0,    pose: "raise" },
        { at: 0.20, pose: "windup" },
        { at: 0.50, pose: "mid" },
        { at: 0.56, pose: "swing" },
        { at: 0.88, pose: null }
      ]
    },

    // 通常攻撃：鎌を軽く振る（死神の鎌より溜めが短く、踏み込みも浅い）。
    // 振りかぶり → 振りの途中（mid：刃が伸びて軌跡が見える。作者の依頼）→ 振り下ろし
    reaperSlash: {
      duration: 620,
      offsetY: { amount: 24, shape: "windup", backRatio: 0.3 },
      poses: [
        { at: 0,    pose: "raise" },
        { at: 0.26, pose: "mid" },
        { at: 0.36, pose: "swing" },
        { at: 0.78, pose: null }
      ]
    },

    // 踊り（死の踊り）など：鎌を振りかぶっては振り下ろし、影ごとゆらゆら揺れる
    reaperDance: {
      duration: 900,
      offsetX: { amount: 6,    shape: "wobble", cycles: 2 },
      rotate:  { amount: 0.05, shape: "wobble", cycles: 2 },
      poses: [
        { at: 0,    pose: "raise" },
        { at: 0.24, pose: "mid" },
        { at: 0.3,  pose: "swing" },
        { at: 0.55, pose: "raise" },
        { at: 0.74, pose: "mid" },
        { at: 0.8,  pose: "swing" },
        { at: 0.95, pose: null }
      ]
    },

    // 共鳴（デス・デスラ）：その場で鎌を掲げ、目を光らせて影がふくらむ（動かない）
    reaperResonate: {
      duration: 820,
      offsetY: { amount: -8,   shape: "pulse" },
      scale:   { amount: 0.08, shape: "pulse" },
      poses: [
        { at: 0,    pose: "raise" },
        { at: 0.85, pose: null }
      ]
    },

    // 被弾：影が散るように薄れて、揺れる
    reaperHit: {
      duration: 340,
      offsetX: { amount: 6,    shape: "decay", cycles: 2 },
      alpha:   { amount: -0.6, shape: "fade" }
    },

    // 回避：影がすっと横へ流れて消え、また現れる
    reaperDodge: {
      duration: 460,
      offsetX: { amount: 18,  outRatio: 0.3 },
      alpha:   { amount: -0.7, shape: "fade" }
    },

    // 倒れる：影がほどけて消える（縮みながら上へ薄れる）
    reaperFade: {
      duration: 700,
      offsetY: { amount: -14, shape: "rise" },
      scale:   { amount: -0.3, shape: "rise" },
      alpha:   { amount: -1,  shape: "rise" }
    },

    /**
     * --- ザンガルド（蔦這う回廊の雷の竜の子。2026-10-26） ---
     * 作者の指定「体全体を動かす・脈動感があったほうがいい（腕と剣だけはよくない）」。
     * 姿の絵は作者が描いた（data/sprites_marsh.js の thunderDragon〜。参考絵/zangard_sprites/ の zangard_atlas.json）。
     * コマの長さは作者の atlas の比のまま。当たる瞬間（技を出して約400ms。BattleScene の eventDelay）に
     * 振り下ろし・突きのコマが来るようにしてある。体の伸び縮み・踏み込みは、その上に軽く重ねているだけ。
     * 技ごとには分けない（作者：DQM のように、技の種類ごとに同じ動き）。
     * ★ 2026-10-27 作者が動きの見本で見て確定（攻撃 460ms・技 480ms・被弾の絵 200ms を含めて）。
     * 絵は右向き（rotate は回転数。正で前へ倒れる・負で反る。0.03 で約11°）
     */

    // ふだん：作者の idle 4枚（220ms ずつ＝880ms）。胸のふくらみはコマ2周（1760ms）で1回
    zanBreathe: {
      frames:  { interval: 220 },
      scaleY:  { amplitude: 0.02,  period: 1760 },
      scaleX:  { amplitude: 0.012, period: 1760, phase: 0.5 },
      offsetY: { amplitude: -1,    period: 1760, phase: 0.1 }
    },

    // 通常攻撃（剣で斬る）：atlas の attack 6枚（120/120/70/70/110/160ms ＝ 650ms）。
    // 振りかぶる → 振り上げる → 振り下ろす（attack4）→ 戻す
    // 2026-10-27 作者「もうちょい速く、特に通常攻撃」→ 650ms を 460ms に縮めた（比はそのまま。85/85/50/50/78/112ms）。
    //   振り下ろし（attack4）は 269〜347ms。当たる瞬間（約400ms）は振り抜いたあと（attack5）になる
    zanSlash: {
      duration: 460,
      offsetY: { amount: 22,    shape: "windup", backRatio: 0.23 },
      rotate:  { amount: 0.012, shape: "windup", backRatio: 0.23 },
      scale:   { amount: 0.03,  shape: "windup", backRatio: 0.23 },
      poses: [
        { at: 0,     pose: "attack0" },
        { at: 0.185, pose: "attack1" },
        { at: 0.369, pose: "attack2" },
        { at: 0.477, pose: "attack3" },
        { at: 0.585, pose: "attack4" },
        { at: 0.754, pose: "attack5" }
      ]
    },

    // 体技・斬撃（稲妻斬り・二連斬り・いなずま）：atlas の skill 8枚で2回斬る。
    // 作者「長すぎるかも、短くしてもいい」→ atlas の 730ms を 600ms に縮めた（比はそのまま。90/58/66/58/74/58/74/122ms）。
    // 2026-10-27 作者「もうちょい速く」→ さらに 480ms に縮めた（72/46/53/46/59/46/59/98ms）。
    // 1回目の振り下ろしが 118〜218ms、2回目の突き（skill6）が 323〜383ms で、当たる瞬間（約400ms）の直前
    zanCleave: {
      duration: 480,
      offsetY: { amount: 26,    shape: "windup", backRatio: 0.35 },
      rotate:  { amount: 0.015, shape: "windup", backRatio: 0.35 },
      scale:   { amount: 0.04,  shape: "windup", backRatio: 0.35 },
      poses: [
        { at: 0,     pose: "skill0" },
        { at: 0.15,  pose: "skill1" },
        { at: 0.247, pose: "skill2" },
        { at: 0.357, pose: "skill3" },
        { at: 0.453, pose: "skill4" },
        { at: 0.577, pose: "skill5" },
        { at: 0.673, pose: "skill6" },
        { at: 0.797, pose: "skill7" }
      ]
    },

    // 共鳴（サンダー）：atlas の magic 5枚（140/120/120/120/220ms ＝ 720ms）。
    // 剣を下げ、腕を胸へ寄せてから掲げる。その場で胸をふくらませ、帯電したように震える（踏み込まない）
    zanResonate: {
      duration: 720,
      scaleY:  { amount: 0.05,   shape: "pulse" },
      scaleX:  { amount: 0.03,   shape: "pulse" },
      rotate:  { amount: -0.008, shape: "pulse" },
      offsetX: { amount: 1,      shape: "wobble", cycles: 6 },
      poses: [
        { at: 0,     pose: "magic0" },
        { at: 0.194, pose: "magic1" },
        { at: 0.361, pose: "magic2" },
        { at: 0.528, pose: "magic3" },
        { at: 0.694, pose: "magic4" }
      ]
    },

    // ちからため：共鳴と同じ magic 5枚。身を沈めてから、反り返って体をふくらませる
    zanGather: {
      duration: 720,
      scaleY:  { amount: 0.07,   shape: "windup", backRatio: 0.35 },
      rotate:  { amount: -0.012, shape: "pulse" },
      offsetY: { amount: -5,     shape: "windup", backRatio: 0.35 },
      poses: [
        { at: 0,     pose: "magic0" },
        { at: 0.194, pose: "magic1" },
        { at: 0.361, pose: "magic2" },
        { at: 0.528, pose: "magic3" },
        { at: 0.694, pose: "magic4" }
      ]
    },

    // 被弾：atlas の hit 1枚でのけぞって揺れ戻る。
    // 2026-10-27 作者「被弾だけ切り替わる時間を速く」→ hit の絵は最初の 200ms だけ（前は 420ms ずっと）。
    //   そのあとはふだんの絵に戻り、体の揺れ戻りだけが 420ms まで続く
    zanHit: {
      duration: 420,
      offsetY: { amount: 7,     shape: "decay", cycles: 2 },
      rotate:  { amount: -0.018, shape: "decay", cycles: 2 },
      alpha:   { amount: -0.3,  shape: "fade" },
      poses: [
        { at: 0,    pose: "hit" },
        { at: 0.48, pose: null }
      ]
    },

    // 回避：横へすべる（作者）
    zanDodge: {
      duration: 520,
      offsetX: { amount: 24, outRatio: 0.3 }
    },

    // レベルアップ・スカウトに応じたとき：共鳴の動きを速めに流す（作者。720ms → 480ms）
    zanCheer: {
      duration: 480,
      scaleY:  { amount: 0.05,   shape: "pulse" },
      scaleX:  { amount: 0.03,   shape: "pulse" },
      rotate:  { amount: -0.008, shape: "pulse" },
      offsetX: { amount: 1,      shape: "wobble", cycles: 4 },
      poses: [
        { at: 0,     pose: "magic0" },
        { at: 0.194, pose: "magic1" },
        { at: 0.361, pose: "magic2" },
        { at: 0.528, pose: "magic3" },
        { at: 0.694, pose: "magic4" }
      ]
    }
  };

  /**
   * 場面ごとの動きの既定。
   *
   * data/monsters.js に motions を書いていない種族は、全員ここから拾う。
   * これを置いたおかげで、モンスターを1体足すのに
   * モーションの行を書き足す必要がなくなっている。
   *
   * ▼ action … 場面 → 上の一覧のid
   *   attack    … 通常攻撃を出した
   *   resonance … 共鳴の技を出した（攻撃も回復も。まわりに共鳴の演出も出る）
   *   breath    … ブレスの技を出した
   *   technique … 体技・斬撃・踊りの技を出した（相手に向ける技）
   *   buff      … 自分・味方にかける技を出した（共鳴以外）
   *   cast      … 技側で motion: "cast" と書いたときだけ使う（離れて放つ）
   *   hit       … ダメージを受けた
   *   guard     … 防御中（1回で終わらず、防御しているあいだ続く。少し小さくなるだけ）
   *   dodge     … 攻撃が外れた（命中しなかった・かわした）。眠っている間は動かない
   *   heal      … 回復した
   *   faint     … 倒れた
   *   levelUp   … レベルが上がった。スカウトに応じたときも同じ動きを使う
   *
   * どの場面になるかは技の種類（data/skills.js の kind）で決まる（BattleScene._skillMotionKind）。
   * 技ごとに変えたいときは data/skills.js に motion: "attack" などと書けば上書きできる。
   * （α-10 までは技の effect で「踏み込む／放つ」を分けていた。RC-1 で技の種類に切り替えた）
   */
  NS.rawData.motionDefaults = {
    action: {
      attack:    "lunge",
      resonance: "resonate",
      breath:    "exhale",
      technique: "strike",
      buff:      "charge",
      cast:      "cast",
      hit:       "recoil",
      guard:     "guard",
      dodge:     "dodge",
      heal:      "recover",
      faint:     "fall",
      levelUp:   "cheerHop"
    }
  };

  // ▼▼▼ 動きの調整ページが書くところ。手で直さない（tools/devserver.py が丸ごと書き直す）▼▼▼
  // 気に入った調整は、上の本体の行へ移してからここを消す。ここにある id は本体より優先される。
  var tuned = {};
  for (var tunedId in tuned) NS.rawData.motions[tunedId] = tuned[tunedId];
  NS.rawData.motionsTuned = Object.keys(tuned);   // 見本ページで ★ を付ける
  // ▲▲▲ 動きの調整ページが書くところ（ここまで）
})(window.MyGame);
