/**
 * ui.js
 * UI の見た目とレイアウト。ここを編集するだけで画面の配置・色・文字サイズを変更できる。
 * （コード側に座標や色を直接書かないための設定ファイル）
 *
 * theme  : 共通の色・フォント
 * battle : 戦闘画面の各パーツの配置
 *   x, y, w, h はキャンバス左上からのピクセル座標。
 */
(function (NS) {
  "use strict";

  NS.rawData.ui = {
    /**
     * 画面を切り替えるときの暗転。
     *   duration … 暗くする時間（ms）。明るく戻すのにも同じだけかかるので、
     *              切り替え全体ではこの2倍になる
     *   color    … 暗幕の色
     * duration を 0 にすると、演出なしで即座に切り替わる。
     */
    /**
     * effects … 場面ごとの特別な切り替え方。change() の第2引数でidを指す。
     *   duration / color … 省略すると上の共通の値を使う
     *   blockMax … 何倍まで粗くするか（モザイク）。1以下で無効
     *   turns    … 何回まわすか      zoom … 最後にどれだけ寄るか（1で等倍）
     *   veilPower… 暗くなり始めを遅らせる度合い（1でまっすぐ暗くなる）
     *              歪みを見せたい演出では上げる。上げないと歪む前に真っ暗になる
     */
    /**
     * 画面の切り替え（js/core/SceneManager.js）。
     *   duration … 演出全体の長さ（ms）。暗くする＋明るく戻す
     *   outRatio … そのうち「暗くする」に使う割合。省略で 0.5（行き帰り同じ）
     */
    transition: {
      duration: 130,
      color: "#04060c",
      effects: {
        // 敵と出会ったとき。粗くなりながら渦を巻いて寄っていく。
        // 行き（渦）に 3/4 を使い、戦闘画面は 1/4 でさっと現れる。
        // 戦闘曲は演出の頭から鳴る
        encounter: {
          duration: 1750, outRatio: 0.75, color: "#0b0f1a",
          blockMax: 28, turns: 0.4, zoom: 1.6, veilPower: 3.2
        }
      }
    },

    /**
     * 文字の隣に出す小さな絵（data/sprites_icons.js）。
     *   size      … 描く大きさ（px）。文字の高さに合わせてある
     *   stats     … バフ／デバフの印に使うステータスの絵。other は与・被ダメージが変わるもの
     *   arrowUp / arrowDown … ステータスの絵に重ねる矢印
     * 属性・状態異常の絵は、それぞれ data/elements.js / data/statuses.js の icon。
     */
    icons: {
      size: 14,
      stats: {
        hp: "iconStatHp", attack: "iconStatAttack", defense: "iconStatDefense",
        speed: "iconStatSpeed", pp: "iconStatPp", other: "iconStatOther"
      },
      arrowUp: "iconArrowUp",
      arrowDown: "iconArrowDown"
    },

    theme: {
      panelBg: "rgba(8,10,20,0.92)",
      panelBorder: "#3a4266",
      borderWidth: 2,
      textColor: "#e8eaf0",
      subTextColor: "#9aa4c0",
      hintColor: "#5b6688",
      cursorColor: "#ffd75e",
      // 選択中を示す「▶」の明滅。どこを選んでいるか目で追いやすくする。
      //   CommandMenu に時計を渡した画面だけで効く（渡さない画面は点滅しない）
      cursorPulse: { amplitude: -0.28, speed: 0.0035 },
      // 選んでいる項目を右へずらす量（px）。どれを選んでいるか目で追いやすくする
      selectedShift: 4,
      // 一時的な知らせ（js/ui/Notice.js）が、出るとき・消えるときにかける時間（ms）
      //   消えるほうを長くすると、読み終わってからそっと消える感じになる
      notice: { fadeIn: 140, fadeOut: 340 },
      font: "14px monospace",
      smallFont: "12px monospace",
      largeFont: "16px monospace",
      lineHeight: 18,
      padding: 10,
      hpBarBg: "#2a3350",
      hpBarHigh: "#5fd18c",
      hpBarMid: "#ffd75e",
      hpBarLow: "#e8542a",
      hpMidThreshold: 0.5,   // この割合以下で色が変わる
      hpLowThreshold: 0.25,

      // PPバー。HPと見分けられるよう、残量で色を変えず常にこの色で描く
      ppBarBg: "#243048",
      ppBarColor: "#4fb0d1",

      // アイテムの絵（data/sprites_icons.js の iconItem〇〇。どれも 16×16）の大きさ
      //   listIconSize   … 一覧の名前の左（js/ui/ScrollList.js）
      //   detailIconSize … 説明欄の左上（js/ui/StatusMarks.js の drawItemIcon）。16 の整数倍にするとドットがそろう
      listIconSize: 16,
      detailIconSize: 32,

      // マウス用の「戻る」ボタン。全画面で同じ位置に出す
      backButton: { x: 688, y: 552, w: 84, h: 30 },
      buttonHoverBg: "rgba(74,107,168,0.45)",

      /**
       * 一覧（js/ui/ScrollList.js）のスクロールバー。枠の右端に細く出す。
       *   width / margin … 太さと、枠の右端からの余白
       *   minHandle      … つまみの最小の長さ（行が多くても掴めるように）
       *   smoothing      … 1フレームで目標へ近づく割合（0〜1。1 で即座、小さいほどぬるっと動く）
       *   track / handle / handleActive … 溝・つまみ・掴んでいるときの色
       *   wheelRows      … ホイール1段で何行ぶん動くか（設定の「スクロール速度」が掛かる）
       */
      scrollbar: {
        width: 6, margin: 4, minHandle: 24, smoothing: 0.35,
        track: "rgba(255,255,255,0.06)",
        handle: "rgba(154,164,192,0.55)",
        handleActive: "rgba(255,215,94,0.85)",
        wheelRows: 1
      }
    },

    /**
     * タイトル画面。
     * 深淵（Abyss）へ落ちていく雰囲気を、背景のグラデーションと
     * ゆっくり降る粒子で表現している。数値はすべてここで調整できる。
     */
    title: {
      // 背景のたてグラデーション（上から下へ）
      gradientTop: "#0a1020",
      gradientBottom: "#02040a",

      // 降ってくる粒子。奥から手前へ3層に分けて重ねると奥行きが出る
      //   奥ほど小さく・遅く・薄く、手前ほど大きく・速く・濃く
      //   driftX は横に流れる速さ（1秒あたりpx）。落ちる向きがそろわず自然に見える
      particleLayers: [
        { count: 50, color: "#39496f", minSize: 1,   maxSize: 1.6,
          minSpeed: 4,  maxSpeed: 11, minAlpha: 0.12, maxAlpha: 0.30,
          minDriftX: -3, maxDriftX: 3 },
        { count: 34, color: "#6f86c9", minSize: 1.5, maxSize: 2.5,
          minSpeed: 12, maxSpeed: 24, minAlpha: 0.22, maxAlpha: 0.55,
          minDriftX: -6, maxDriftX: 6 },
        { count: 14, color: "#a8c0ff", minSize: 2.5, maxSize: 4,
          minSpeed: 30, maxSpeed: 52, minAlpha: 0.30, maxAlpha: 0.75,
          minDriftX: -10, maxDriftX: 10 }
      ],

      // 深淵を表す同心円（奥行きの演出）
      //   円はゆっくり外へ広がり続ける。落ちていく感じを出すため
      abyss: {
        centerX: 400,
        centerY: 262,
        rings: 6,
        baseRadius: 56,
        ringGap: 46,
        color: "#4a6ba8",
        lineWidth: 1.5,
        minAlpha: 0.10,      // 明滅の下限
        maxAlpha: 0.45,      // 明滅の上限
        fadePerRing: 0.13,   // 外側の円ほど薄くする量
        pulseSpeed: 0.0012,  // 明滅の速さ
        expandSpeed: 0.00012 // 広がる速さ（1msあたり円1つ分）。0で止まる
      },

      // 画面のふちを暗く落とす（中央へ視線を集める）
      vignette: { color: "#000308", innerRatio: 0.30, alpha: 0.60 },

      // 開いたときの演出。黒からゆっくり明け、題字がせり上がる
      intro: { duration: 1000, riseY: 20 },

      // ゲーム名
      //   float     … ゆっくり浮き沈みする量（上が負）
      //   glowPulse … 光のにじみの増減。glowBlur を中心に揺れる
      logo: { x: 400, y: 186, font: "50px monospace", color: "#e6ecff",
              glowColor: "#4a7fe0", glowBlur: 20, letterSpacing: 5,
              float: { amplitude: -3, speed: 0.0009 },
              glowPulse: { amplitude: 9, speed: 0.0016 } },
      // 世界名
      world: { x: 400, y: 228, font: "16px monospace", color: "#7f8db8" },
      // 副題
      subtitle: { x: 400, y: 258, font: "13px monospace", color: "#55638c" },

      // 「新しく始める」「続きから」の2つ。
      // 項目の左に絵が付くので、以前より横幅を広げてある
      menu: { x: 288, y: 340, w: 224, h: 74, lineHeight: 32, iconSize: 20 },

      /**
       * バージョン表記の隣に置く、パッチノートを開くボタン。
       *
       *   idleAlpha   … ふだんの濃さ。薄くしておき、隅の飾りとして邪魔しない
       *   activeAlpha … カーソルを乗せたときの濃さ
       *   label       … 乗せたときだけ出す文字の位置
       *
       * ★ x/y はアイコンの左上。当たり判定も同じ四角なので、
       *   位置を変えれば押せる場所も一緒に動く
       */
      patchButton: {
        icon: "iconPatchNote",
        x: 744, y: 566, size: 22,
        idleAlpha: 0.5, activeAlpha: 1,
        // ★ 文字はアイコンの**上**に出す。
        //   バージョン表記と同じ行に置くと重なって読めなくなる
        label: { x: 766, y: 558 }
      },

      notice: { x: 400, y: 464 },
      // 操作案内。左下のクレジット（4行）と行がぶつからないよう、その上に置く
      hint: { x: 400, y: 522 },
      version: { x: 736, y: 590 },

      /**
       * 素材のクレジット（data/audio.js の credits）。左下に置く。
       * 2件以上あるときは、下から上へ lineHeight ずつ積み上げる
       * （1件目がいちばん下＝バージョン表記と同じ行）。
       */
      credit: { x: 16, y: 590, lineHeight: 16 }
    },

    /**
     * 戦闘画面（3対3）。
     * 敵は上段、味方は下段に、盤面の並び順で左から配置する。
     * slotGap は1体分の横幅。盤面の人数が変わっても中央に寄るよう、
     * 描画側が人数から開始位置を計算する。
     */
    battle: {
      background: "#0b0f1a",

      // 敵（上段）
      enemyRow:    { y: 62,  spriteSize: 96, slotGap: 210, statusY: 168, statusW: 190, statusH: 46 },
      // 味方（下段）。HPバーの下にPPバーを出すぶん、敵より縦に長い
      allyRow:     { y: 250, spriteSize: 96, slotGap: 210, statusY: 350, statusW: 190, statusH: 64 },

      // 発動の札（強化・弱体・特性・加護が働いたとき、画面上部の真ん中に出る）
      //   v1.0.0（作者の指定）：右から slideIn ミリ秒で素早く滑り込む。
      //   同じ行動の中で続けて出た札は、同じ高さで前の札の右 overlap（幅の1/3）に重なって上に乗る。
      //   並び全体を真ん中に寄せるので、札が増えるほど全体が左へ寄っていく（作者の指定）。
      //   textX … 札の左端から言葉の真ん中まで（次の札に隠れない左の2/3に収める）
      //   時間では消えない。次の行動が始まったとき（別の者の技・眠りで動けない番）と、
      //   ターンの演出が終わったときに、出ている札がまとめて fadeOut ミリ秒で薄れて消える（BattleScene._dismissEffectPopups）。
      //   ただし出てから minShow ミリ秒たつまでは消さない（v1.0.2.1）
      //   maxLife は消し忘れの保険。max 枚を超えたら古い札から消す
      //   ★ 3枚で横幅 630px（画面は800px）。v1.0.0 で 320 → 270 に狭めた（作者の指定）
      //   colors … 左端の色帯と文字の色。buff 強化／debuff 弱体／ability 特性／blessing 加護／equipment 装備
      effectPopup: {
        y: 6, w: 270, h: 24, max: 3, overlap: 1 / 3, textX: 118,
        // chainDelay … 1つの出来事から何枚も出るとき（王の号令の攻撃力上昇・防御力上昇）、2枚目以降を遅らせる量
        // slideIn は 80 → 180（作者の指定。0.08秒では速すぎた）
        slideIn: 180, fadeOut: 140, maxLife: 8000, chainDelay: 70,
        // minShow … 札が出てから、消す合図が来ても出したままにする長さ（ミリ秒）。
        //   v1.0.2.1 で足した（作者の指定「少なくとも0.8秒は表示」）。次の行動がすぐ始まると読めないうちに消えていたため
        minShow: 800,
        barWidth: 5,
        font: "14px monospace",
        background: "rgba(10,15,28,0.88)",
        colors: {
          buff: "#5fd18c", debuff: "#e8542a",
          ability: "#b48ce0", blessing: "#ffd75e", equipment: "#7fd9e8"
        }
      },

      /**
       * 眠っている印（RC-1）。小さな z が絵の右上から、右上へ漂いながら昇って消える。
       *   fromX / fromY … 出てくる位置（絵の大きさに対する割合）
       *   rise / driftX … 昇る高さ・右へ流れる量（px）　period … 1つが昇りきるまで（ms）
       *   count … 同時に出す数（少しずつ遅れて出る）
       */
      sleepZzz: {
        text: "z", count: 3, period: 1800,
        fromX: 0.72, fromY: 0.22, rise: 24, driftX: 10,
        minScale: 0.7, alpha: 0.9,
        font: "bold 13px monospace", color: "#c9b8ff"
      },

      /**
       * レベルアップの結果（画面中央の窓）。上がった能力を「攻撃力 50 → 55 (+5)」の形で並べ、
       * 覚えた技があれば下に出す。決定・Esc・クリックで閉じる。複数が上がったら1体ずつ順に出す。
       * 高さは行数から決まる（y は上端）
       */
      levelResult: {
        w: 380, y: 96, padding: 18, lineHeight: 24,
        labelWidth: 96,     // 「攻撃力」など能力名の欄の幅
        numberWidth: 150,   // 「50 → 55」の欄の幅（そのあとに「(+5)」）
        dim: "rgba(0,0,0,0.45)",
        background: "#0a0f1c",  // 窓の中を塗りつぶす色（後ろのHPバーが透けないように）
        upColor: "#5fd18c",     // 上がった数（+5）
        sameColor: "#6b7590",   // 上がらなかった能力
        skillColor: "#ffd75e"   // 覚えた技の名前
      },

      // メッセージ欄
      message: { x: 20, y: 428, w: 760, h: 152 },
      messageLines: 6,  // 一度に表示する行数（超えると送り待ちになる）
      // コマンド欄（メッセージ欄に重ねて表示）
      command: { x: 540, y: 428, w: 240, h: 152 },
      // 技・道具の一覧
      subMenu: { x: 280, y: 428, w: 250, h: 152, visibleRows: 5, rowHeight: 26 },
      // 技を選ぶときの一覧（2026-10-15）。覚える技が増えても見渡せるよう、横に広く・行を詰めて6行にした。
      // 右に残った幅（メッセージ欄の右端まで）に、並べ方と切り替えの案内を出す（BattleScene._renderSkillSort）
      skillMenu: { x: 280, y: 428, w: 340, h: 152, visibleRows: 6, rowHeight: 22 },
      // 選んでいる技・道具の内容（メッセージ欄の左側に出す）
      //   kindOffsetX … 技の種類（[共鳴] など）を出す位置。属性の札の右
      skillInfo: { charsPerLine: 16, elementOffsetX: 110, kindOffsetX: 150 },

      /**
       * 「状態を見る」の欄（メッセージ欄に重ねて出す）。
       * 左に見ている相手の名前とHP・PP、右に状態異常とバフ／デバフを残りターンつきで並べる。
       *   columnX … 右側（状態の一覧）の左端
       *   lineHeight … 1行の高さ
       *   iconSize … 印の絵の大きさ
       */
      inspect: { columnX: 300, lineHeight: 20, iconSize: 16 },

      /**
       * 行動の再生（アニメーション）に関する設定。
       * 1ターン分の出来事を、この間隔で1つずつ見せていく。
       */
      animation: {
        // 出来事1つあたりの待ち時間（ms）。
        //   文章を読み切れる長さにしてある。これが戦闘のテンポの基準になる
        eventDelay: 620,
        // 勝ったとき、勝利の曲が鳴り始めてから経験値・レベルアップを出すまでの間（ms。作者の指定で RC-1 から）。
        // 戦闘速度の設定は掛かる（ほかの待ち時間と同じ）。決定キーを押していれば quickDelay で飛ばせる
        victoryPause: 1200,
        quickDelay: 90,         // 決定キーを押している間の待ち時間（ms）
        hpDrainPerSecond: 38,   // HPバーが1秒に動く量。大きいほど速く減る
        hpMinDrainTime: 220,    // 少量のダメージでも最低これだけ時間をかける（ms）
        // どんなに大きいダメージ・回復でも、これより長くはかけない（ms）。v1.0.2.1（作者の指定「0.25秒以内」）。
        //   1秒に38では、3桁のダメージでバーが何秒も動き続けてテンポが悪かった。
        //   この時間に収まらない量のときだけ、収まる速さに上げる（少しのダメージは今までどおり）
        //   ★ 250 ではなく 240：画面は1コマ約17msずつ進むので、250 だと最後のコマが 0.25秒をわずかに越える
        hpMaxDrainTime: 240,

        /**
         * 戦闘速度（設定の battleSpeed 1〜8）に対応する倍率。
         * 大きいほど速い。待ち時間はこの値で割り、HPバーの速さは掛ける。
         *
         * 「標準」（4番目 = 1.0）が eventDelay そのままの速さ。
         * いちばん遅い 0.5 では 620 ÷ 0.5 = 1240ms かけて1つずつ見せる。
         */
        speedTable: [0.5, 0.65, 0.8, 1.0, 1.25, 1.6, 2.1, 2.8],

        /**
         * エフェクトの濃さ（設定の effectLevel 0〜3）に対応する倍率。
         * 技の演出の濃さ・にじみと、画面の揺れ・発光に掛かる。
         *
         * 0 は「全くなし」で、演出そのものを出さない
         *   （光の点滅が苦手な人でも遊べるように）。
         * 「標準」（3番目 = 1.0）が今までどおり。
         */
        effectScale: [0, 0.5, 1.0, 1.6],

        // ダメージなどの数字が浮かび上がる演出
        popup: {
          duration: 720,        // 表示時間（ms）
          rise: 46,             // 浮かび上がる高さ（px）
          spawnOffsetY: -2,     // スプライト上端からの位置（マイナスで少し上）
          spreadX: 16,          // 同じ相手に重ならないよう左右へ散らす幅（px）
          driftX: 10,           // 浮かびながら横へ流れる量（px）
          popScale: 1.5,        // 出た瞬間の大きさ（1.0で等倍）
          popTime: 0.18,        // 大きさが元に戻るまでの割合（0〜1）
          fadeStart: 0.65,      // 薄くなり始める割合（0〜1）
          outlineColor: "#0b0f1a"
        },

        /**
         * 場面ごとの見た目。
         *   color / font : 浮かぶ文字の色と大きさ
         *   shake        : 画面の揺れの強さ（0で揺れない）
         *   flash        : 画面全体を一瞬染める色（省略で光らない）
         *   flashAlpha   : 光の濃さ
         *
         * ★ 演出を変えたいときは、ここの数値と色を触るだけでよい。
         */
        styles: {
          damage:    { color: "#ffffff", font: "20px monospace", shake: 3 },
          critical:  { color: "#ffd75e", font: "30px monospace", shake: 12,
                       flash: "#ffd75e", flashAlpha: 0.28 },
          effective: { color: "#ff9c5e", font: "24px monospace", shake: 7,
                       flash: "#ff9c5e", flashAlpha: 0.18 },
          resisted:  { color: "#9aa4c0", font: "17px monospace", shake: 0 },
          heal:      { color: "#5fd18c", font: "20px monospace", shake: 0,
                       flash: "#5fd18c", flashAlpha: 0.12 },
          miss:      { color: "#9aa4c0", font: "18px monospace", shake: 0 },
          immune:    { color: "#8b6fd6", font: "18px monospace", shake: 0 },
          // ターン終了時の毒ダメージ。殴られたわけではないので揺らさない
          statusDamage: { color: "#7fd06a", font: "18px monospace", shake: 0 },
          faint:     { shake: 6 }
        },

        // 画面の揺れ・光の持続時間（ms）
        shakeDuration: 260,
        flashDuration: 220
      }
    },

    /**
     * 拠点（ホーム）画面。
     * ダンジョンへ出発する前の準備場所。左にメニュー、右に手持ちの一覧を出す。
     * 将来ここに施設（回復・倉庫・強化など）を増やしていく想定。
     */
    home: {
      gradientTop: "#121a2e",
      gradientBottom: "#070b16",

      // 拠点のたき火のような、ゆっくり昇る光の粒
      particles: {
        count: 26,
        color: "#c8a35e",
        minSize: 1,
        maxSize: 2.5,
        minSpeed: -18,   // 負の値で上へ昇る
        maxSpeed: -5,
        minAlpha: 0.12,
        maxAlpha: 0.5
      },

      // 背景の景色。パネルの下に敷くので、上下の余白にだけ見える
      //   hole     … 画面の下にある穴（揺籃の穴）。拠点はそのそばにある
      //   ground   … 穴のふちの地面
      //   campfire … たき火。data/motions.js の blaze で揺らす
      //              glow は火のまわりの明かり。glowPulse でゆっくり強弱がつく
      //   ※ 穴は地面より「あと」に描く。先に描くと地面に埋まって見えなくなる
      scenery: {
        ground:   { y: 498, color: "#0b1120", edgeColor: "#1e2a45" },
        // ふちが画面のいちばん下に出るよう、中心を画面外に置く。
        //   上端（cy - ry = 586）が操作説明の文字より下に来るようにしてある。
        //   上げすぎると、ふちの線が文字を横切ってしまう
        hole:     { cx: 400, cy: 700, rx: 340, ry: 114,
                    color: "#02040a", rimColor: "#31426b", rimWidth: 2 },
        campfire: { x: 664, y: 502, size: 52, motion: "blaze",
                    glowColor: "#ffb15e", glowRadius: 104, glowAlpha: 0.20,
                    glowPulse: { amplitude: 18, period: 1700 } }
      },

      /**
       * たき火を囲む仲間（RC-1）。パーティの並び順に seats の席へ座る。
       *   baseY      … 足もとの高さ（大きい種族は上へ伸びる）
       *   seats      … 1人目から順の、足もとの中心のx。火（x 664〜716）の左に詰め、2人目だけ右へ
       *   spriteSize … 絵の大きさ（種族の sizeScale が掛かる）
       *   cheerEvery … ときどき喜ぶ動きをする間隔（ms。この範囲でばらける）
       *   dozeChance … 喜ぶ代わりにうたた寝する割合。dozeFor のあいだ眠りの動きになる
       *   押すと喜ぶ（眠っていれば起きて喜ぶ）
       */
      camp: {
        baseY: 556,
        seats: [630, 752, 574, 518, 462, 406],
        spriteSize: 40,
        shadow: "rgba(0,0,0,0.4)",
        cheerEvery: [7000, 15000],
        dozeChance: 0.3,
        dozeFor: [6000, 11000],
        zzzColor: "#9fb3ff"
      },

      title:    { x: 48, y: 62, font: "26px monospace", color: "#e6ecff" },
      subtitle: { x: 48, y: 88, font: "13px monospace", color: "#7f8db8" },
      // 所持金（右寄せ）。countSpeed は増減を数字が追いかける速さ（1に近いほど速い）
      gold:     { x: 760, y: 66, font: "16px monospace", color: "#ffd75e",
                  countSpeed: 0.14 },

      // lineHeight で項目の間隔を広げ、拠点らしい落ち着いた見た目にする
      //   iconSize を書くと、項目の左に絵がつく（0や未指定なら文字だけ）
      menu:   { x: 48, y: 122, w: 280, h: 372, lineHeight: 36, iconSize: 22 },
      // 右側の手持ち一覧（最大6体）。RC-1 で PP・経験値のバー、装備の絵、愛情度の印を足した
      //   1行目：名前とLv・愛情度の印（affectionIcon）・右端に装備の絵4つ（equipIcon。空きの枠は薄い四角）
      //   その下：HP（4px）・PP（3px）・次のレベルまでの経験値（3px）の細いバーと、右に小さな数字（barFont）
      //   rowHeight … 6体 × 56 ＋ 見出し30 で枠（372）に収まる
      status: { x: 360, y: 122, w: 400, h: 372, rowHeight: 56, spriteSize: 36, hpBarWidth: 150,
                barFont: "10px monospace", equipIcon: 13, affectionIcon: 13,
                expBarColor: "#b48ce0" },

      // 知らせ（帰還の結果など）。下の帯にはたき火を囲む仲間がいるので、見出しと枠のあいだに出す
      notice: { x: 400, y: 112 },
      hint:   { x: 48, y: 570 },

      // Esc で出す「タイトルに戻りますか？」の窓。見た目はセーブ画面の確認と同じ
      confirm: {
        veil:       "rgba(4,6,12,0.72)",
        background: "#0d1220",
        box:   { x: 220, y: 200, w: 360, h: 210 },
        title: { x: 400, y: 244 },
        body:  { x: 400, y: 276 },
        note:  { x: 400, y: 300 },
        menu:  { x: 336, y: 314, w: 128, h: 68, lineHeight: 28 }
      }
    },

    /**
     * 持ち物画面。左に一覧（分類ごとの見出しつき）、右に説明を出す。
     */
    items: {
      background: "#0a0f1c",
      title:    { x: 48, y: 62, font: "26px monospace", color: "#e6ecff" },
      subtitle: { x: 48, y: 88, font: "13px monospace", color: "#7f8db8" },

      list:   { x: 48, y: 122, w: 400, h: 372, rowHeight: 26, visibleRows: 12 },
      detail: { x: 470, y: 122, w: 290, h: 372 },

      notice: { x: 400, y: 526 },
      hint:   { x: 48, y: 570 }
    },

    /**
     * 物語の場面（js/scenes/StoryScene.js）。中身は data/story.js。
     *
     *   charsPerSecond … 1秒に出す文字数（決定で途中を飛ばせる）
     *   pageFade       … ページが浮かび上がる時間（ms）。文字はそのあとから出る
     *   skipWindow     … Esc を1回押してから、もう1回で飛ばせる時間（ms）
     *   narration      … 語り。centerY を中心に行の塊を縦に並べる
     *   dialogue       … 会話。box が下の窓、nameTag が名前の札（窓の上の縁に乗る）
     *   more           … 出きったページに出す「次へ」の印。blink は点滅の周期（ms）
     *   draftBadge     … 仮の文章（draft: true）の印の位置。右寄せ
     *   hint           … 右下の操作案内。warnColor は「もう一度で飛ばす」のときの色
     *
     *   ▼ 演出
     *   title          … 見出しのページ（style: "title"）。字間 spacingFrom から spacing へ詰めながら浮かぶ
     *   bgFade         … 背景が切り替わるとき、溶かして重ねる時間（ms）
     *   actorEnter     … 立ち絵が登場の動きをする時間（ms）。actorDistance はその移動量（px）
     *   letterbox      … 上下の黒い帯（場面に letterbox: true と書いたときだけ）
     *   vignette       … 四隅を暗くする濃さ
     *   fx             … 揺れ（shake）と光（flash）の既定。設定「エフェクトの濃さ」で掛けられる
     *   backdrops      … 背景の一覧。data/story.js の bg でこの id を書く。
     *                    kind ごとの描き方は js/ui/StoryBackdrop.js の冒頭を参照
     *     粒子（particles / stars）: count 数 / color / minSize・maxSize / speed 速さ / alpha 濃さ /
     *                                top・bottom 縦の範囲 / left・right 横の範囲
     */
    story: {
      background: "#05070d",
      charsPerSecond: 40,
      pageFade: 400,
      skipWindow: 2000,
      bgFade: 700,
      blackFade: 900,     // 暗転（transition: "black"）が明けるまでの時間
      actorEnter: 700,
      actorExit: 500,     // いなくなった立ち絵が薄れて消えるまでの時間
      actorDistance: 60,
      letterbox: { height: 48, time: 800, color: "#000000" },
      vignette: { alpha: 0.55 },
      fx: {
        shake: { power: 7, time: 500 },
        flash: { color: "#ffffff", alpha: 0.85, time: 450 },
        // 別の背景を一瞬だけ重ねる（記憶がよぎる）。bg は重ねる背景
        memory: { bg: "burning", alpha: 0.55, time: 1400 }
      },
      title: { font: "30px monospace", color: "#e6ecff", glow: "rgba(120,160,255,0.6)",
               centerY: 270, lineHeight: 52, spacing: 6, spacingFrom: 30,
               lineWidth: 220, ruleColor: "#4a6ba8", duration: 1600 },
      narration: { centerY: 280, lineHeight: 36, font: "20px monospace", color: "#e6ecff", moreGap: 40,
                   shadowColor: "rgba(0,0,0,0.9)", shadowBlur: 8 },
      // 選択肢の枠。会話の窓（dialogue.box）の右上、拠点の夜で立つ人物の頭より上に置く。
      // bottom は枠の下端の y（人物の頭はおよそ y 300。v1.0.2 で人物を 128 にしたので 336 から上げた）
      choice: { x: 590, w: 170, bottom: 292, itemHeight: 34, padY: 10, font: "18px monospace" },

      // 人間の登場人物（主人公・data/story.js で person を書いた人）を、部品を重ねた新しい絵で立たせるときの大きさ（v1.0.2）。
      // 絵は 64×64 なので 128 でちょうど2倍。新しい絵が使えないときは、actors に書いた size の 32×32 の絵になる
      personSize: 128,

      backdrops: {
        // 何も無い闇
        void:    { kind: "void", color: "#05070d" },
        // 深淵（タイトルと同じ、奥へ広がる円）
        abyss:   { kind: "abyss", top: "#05070d", bottom: "#0d1830", centerY: 250,
                   rings: 7, baseRadius: 30, ringGap: 46, ringSpeed: 0.012, squash: 0.42,
                   ringColor: "#4a6ba8",
                   particles: { count: 40, color: "#a8c0ff", minSize: 1, maxSize: 2.5, speed: 0.03, alpha: 0.6 } },
        // 燃える村の夜（主人公の過去）
        //   flames は家並みの向こうで揺れる炎（屋根の上に先だけ覗く）
        burning: { kind: "embers", top: "#12040a", bottom: "#4a1206",
                   glowColor: "#ff6a2a", glowRadius: 560, glowAlpha: 0.95, glowOffset: -20,
                   flames: { count: 8, width: 70, height: 150, color: "#ff5a1a", tipColor: "#ffb04a", alpha: 0.85 },
                   skyline: { y: 470, color: "#070204", minWidth: 40, maxWidth: 90,
                              minHeight: 24, maxHeight: 70, gap: 10 },
                   particles: { count: 90, color: "#ffcf7a", minSize: 2, maxSize: 4, speed: 0.06, alpha: 1 } },
        // 拠点の夜。景色を上へずらして、下に会話の窓が出てもたき火が見えるようにしてある
        camp:    { kind: "camp", shiftY: -130,
                   stars: { count: 50, color: "#c8d4ff", top: 0, bottom: 300, minSize: 1, maxSize: 2, alpha: 0.6 },
                   particles: { count: 16, color: "#ffb060", top: 250, bottom: 400, left: 650, right: 730,
                                minSize: 1, maxSize: 2.5, speed: 0.03, alpha: 0.9 } },
        // 星の夜空（試験を終えた夜）
        night:   { kind: "stars", top: "#02030a", bottom: "#0e1630",
                   stars: { count: 140, color: "#e6ecff", top: 0, bottom: 470, minSize: 1, maxSize: 2.2, alpha: 0.9 },
                   shootingStar: { period: 5200, duration: 700, length: 120, color: "#e6ecff" },
                   horizon: { y: 500, color: "#03040a" } },
        // ダンジョンの中。色は data/dungeonThemes.js から引く
        mine:    { kind: "cave", theme: "mine",
                   particles: { count: 30, speed: 0.01, alpha: 0.4, minSize: 1, maxSize: 2 } },
        ember:   { kind: "cave", theme: "ember",
                   particles: { count: 45, color: "#ff9a50", speed: 0.02, alpha: 0.6, minSize: 1, maxSize: 2.5 } },
        depths:  { kind: "cave", theme: "depths", depthAlpha: 0.7,
                   particles: { count: 30, speed: 0.008, alpha: 0.35, minSize: 1, maxSize: 2 } },
        venom:   { kind: "cave", theme: "venom",
                   particles: { count: 35, color: "#9adf6a", speed: 0.01, alpha: 0.4, minSize: 1, maxSize: 2.5 } }
      },
      dialogue: {
        box: { x: 40, y: 420, w: 720, h: 130 },
        nameTag: { x: 60, y: 402, h: 30, padX: 14 },
        nameFont: "16px monospace", nameColor: "#ffd75e",
        font: "18px monospace", color: "#e6ecff",
        padX: 28, padTop: 58, lineHeight: 30
      },
      more: { text: "▼", font: "14px monospace", color: "#7f8db8", blink: 900 },
      draftBadge: { x: 780, y: 30, font: "13px monospace", color: "#c07a5a" },
      hint: { x: 780, y: 585, font: "12px monospace", color: "#5b6688", warnColor: "#ffd75e" }
    },

    /**
     * 主人公の名前と見た目を決める画面（js/scenes/PlayerSetupScene.js）。
     *
     * 左に「選んでいる姿で歩いている絵」、右に決める項目を縦に並べる。
     *   preview.x/y  … 絵の**中心**の座標。新しい絵は 64×64 を data/player.js の rig.previewScale 倍（3倍＝192）。
     *                  size は新しい絵が使えないときの 32×32 の絵の大きさ。labelY は名前を出す高さ
     *   rows         … 名前・性別・一人称・髪型・髪の色・ふくの色・ズボンの色・飾り・飾りの色、いちばん下が決定。
     *                  h+gap ずつ下にずれる（10 × 43 で、決定の下端が y 529）
     *   swatch       … 色見本1つぶんの大きさと間隔。縦は欄の中央
     *                  （いちばん多い飾りの色は もとの色＋8色＋じぶんで ＝ 10並び、右に飾りの名前が入る）
     *   chip         … 札。x は並びの左端（色見本と揃える）。幅は文字に合わせ、w より狭くはしない。
     *                  髪型の7つ（ポニーテールがいちばん長い）が欄に収まる大きさにしてある
     *   done.h       … 決定のボタンの高さ（位置は欄の並びのいちばん下）
     */
    playerSetup: {
      background: "#0a0f1c",
      title:    { x: 32, y: 52, font: "26px monospace", color: "#e6ecff" },
      subtitle: { x: 32, y: 78, font: "13px monospace", color: "#7f8db8" },

      preview: { boxX: 32, boxY: 100, boxW: 216, boxH: 429,
                 x: 140, y: 290, size: 176, labelY: 486 },

      rows:   { x: 264, y: 100, w: 504, h: 38, gap: 5 },
      swatch: { x: 352, size: 26, gap: 8 },
      chip:   { x: 352, w: 40, h: 26, gap: 5, padX: 7, font: "12px monospace",
                cursorFill: "rgba(255,215,94,0.18)" },   // 飾りの欄で、いま指している札の地
      done:   { h: 42 },

      /**
       * 色を自分で作る窓（ふく・髪・ズボンの「じぶんで」の見本で決定を押すと開く）。
       *   bar     … つまみを動かす横棒。x は窓の左からの位置、y は1本目の上端、gap は棒どうしの間
       *   swatch  … できた色の見本（色コードを横に出す）
       *   buttons … 「決める」「やめる」
       *   step    … 左右を1回押したときに動く量。押し続けると repeatMs ごとに続けて動く
       */
      colorEditor: {
        veil: "rgba(4,6,12,0.72)",
        box:  { x: 190, y: 140, w: 420, h: 300 },
        bar:  { x: 130, y: 70, w: 250, h: 14, gap: 44, handleW: 6 },
        swatch: { x: 30, y: 212, size: 34 },
        buttons: { y: 250, w: 110, h: 32, gap: 16 },
        step: { h: 6, s: 4, l: 3 },
        repeatDelayMs: 320, repeatMs: 45
      },

      hint:   { x: 32, y: 570 }
    },

    /**
     * セーブファイルを選ぶ画面（js/scenes/SaveSlotScene.js）。
     *
     * スロットは縦に3つ。1つぶんの高さは row.h、間隔は row.gap。
     * ★ スロットを4つ以上にするときは、row.h を詰めるか row.y を上げること
     *   （3つ × (96+14) で 470px 使う。上の見出しと下の案内で残りが埋まる）
     */
    saveSlot: {
      background: "#0a0f1c",
      title:    { x: 48, y: 62, font: "26px monospace", color: "#e6ecff" },
      subtitle: { x: 48, y: 88, font: "13px monospace", color: "#7f8db8" },

      row:  { x: 60, y: 118, w: 680, h: 96, gap: 14 },
      // スロットの絵。1つの枠の中での位置
      icon: { size: 28, offsetY: 20 },
      iconName: "iconSlot",
      textPadding: 10,
      lineHeight: 22,

      // 確認の窓。後ろを暗く落としてから出す。
      // ★ menu が box の下端に触れないよう、box は menu より 28px ぶん長くしてある
      confirm: {
        veil:       "rgba(4,6,12,0.72)",
        background: "#0d1220",
        box:   { x: 220, y: 200, w: 360, h: 210 },
        title: { x: 400, y: 244 },
        body:  { x: 400, y: 276 },
        note:  { x: 400, y: 300 },
        menu:  { x: 336, y: 314, w: 128, h: 68, lineHeight: 28 }
      },

      /**
       * 整理モードで出す「コピー／移動／削除／やめる」。
       * 確認の窓より小さく、後ろは暗く落とさない
       * （どのファイルを選んでいるかが見えていたほうがよい）。
       */
      action: {
        background: "#0d1220",
        box:   { x: 268, y: 214, w: 264, h: 186 },
        title: { x: 400, y: 244 },
        menu:  { x: 310, y: 258, w: 180, h: 128, lineHeight: 28 }
      },

      // 整理モードへの出入り口。「戻る」の左に置く
      manageButton: { x: 566, y: 552, w: 112, h: 30 },

      notice: { x: 400, y: 528 },
      hint:   { x: 48, y: 570 }
    },

    /**
     * チュートリアルのふきだし（js/ui/TutorialBox.js）。
     *
     * 高さは書かない。**説明の行数から計算する**ので、
     * 3行の説明でも5行の説明でも、余白が空いたりはみ出したりしない。
     *   titleHeight … 枠の上端から見出しまで
     *   lineHeight  … 本文の行間
     *   hintHeight  … 本文の下から操作案内まで
     *
     * 戦闘中でも盤面の上半分が見えるよう、少し下に置いてある。
     */
    tutorial: {
      box:        { x: 176, y: 168, w: 448 },
      // 後ろを完全に隠す色。共通の枠は半透明なので、ここだけ不透明にしている
      background: "#0d1220",
      padding:    20,
      titleHeight: 30,
      titleFont:  "17px monospace",
      lineHeight: 22,
      hintHeight: 30,

      /**
       * 「この項目です」と指すときの見た目（data/tutorial.js の pointAt）。
       *   padding  … 囲みを指し先より何px外側に広げるか
       *   headSize … 矢じりの大きさ
       */
      pointer: { color: "#ffd75e", lineWidth: 2, padding: 3, headSize: 9 }
    },

    /**
     * 遊び方（よくある質問）。左に質問の一覧、右に答え。
     *
     * 持ち物の画面より一覧を細く・答えを広くしてある。
     * 質問は短く、答えは長いため。
     *
     *   answer.charsPerLine … 何文字で折り返すか（smallFont が 12px なので
     *     枠の幅 362 − 余白20 ≒ 342px。全角24文字ぶんに収まる）
     *   answer.visibleLines … 一度に出す行数。これを超えると▲▼が出て Q/E で送れる
     */
    help: {
      background: "#0a0f1c",
      title:    { x: 48, y: 62, font: "26px monospace", color: "#e6ecff" },
      subtitle: { x: 48, y: 88, font: "13px monospace", color: "#7f8db8" },

      list:   { x: 48, y: 122, w: 330, h: 372, rowHeight: 26, visibleRows: 13 },
      detail: { x: 398, y: 122, w: 362, h: 372 },
      answer: { charsPerLine: 24, lineHeight: 20, visibleLines: 14 },

      hint:   { x: 48, y: 570 }
    },

    /**
     * 図鑑画面。上でタブ（モンスター／アイテム）を切り替え、
     * 左に一覧、右に詳細を出す。
     */
    /**
     * 名前をつける入力欄（js/ui/NameInput.js）。2026-10-27 文字盤から作り替えた。
     *   field   … 文字を打つ欄（Canvas の座標。この上に本物の入力欄が重なる）。fontSize は欄の文字の大きさ
     *   count   … 「4 / 10」の文字数
     *   buttons … 「けってい」「やめる」の2つ（左上と1つぶんの大きさ・間）
     */
    nameInput: {
      box:     { x: 180, y: 180, w: 440, h: 270 },
      title:   { x: 200, y: 212 },
      field:   { x: 200, y: 232, w: 400, h: 44, fontSize: 20 },
      count:   { x: 600, y: 296, align: "right" },
      buttons: { x: 270, y: 340, w: 120, h: 34, gap: 20 },
      hint:    { x: 400, y: 408, align: "center", lineHeight: 18 }
    },

    dex: {
      background: "#0a0f1c",
      title:    { x: 48, y: 62, font: "26px monospace", color: "#e6ecff" },
      subtitle: { x: 48, y: 88, font: "13px monospace", color: "#7f8db8" },

      // タブは6つ（モンスター／アイテム／特性／技／性格／加護）
      // 幅は 48 + 112×6 + 6×5 = 750 で、右端に余白が残るようにしてある
      tabs:   { x: 48, y: 108, w: 112, h: 30, gap: 6 },
      list:   { x: 48, y: 152, w: 400, h: 342, rowHeight: 26, visibleRows: 11 },
      // 右の詳細欄。入りきらない説明は決定キーでスクロールして読む
      //   charsPerLine … 説明文を折り返す文字数
      detail: { x: 470, y: 152, w: 290, h: 342, spriteSize: 72, charsPerLine: 18 },

      // 収集数。タブが5つに増えて重なったため、タブの上（副題の行）へ移した
      progress: { x: 760, y: 88 },
      // 技の表の並べ方の札（技の表のときだけ。押すと次の並びに変わる）
      sort:     { x: 470, y: 88 },
      hint:     { x: 48, y: 570 }
    },

    /**
     * パッチノート。左にバージョンの一覧、右にその内容を出す。
     *   tag         … 種類（追加・調整など）を示す色つきの札の大きさ
     *   legend.gap  … 上部に並べる凡例の間隔
     */
    patchNote: {
      background: "#0a0f1c",
      title:    { x: 48, y: 62, font: "26px monospace", color: "#e6ecff" },
      subtitle: { x: 48, y: 88, font: "13px monospace", color: "#7f8db8" },

      legend: { x: 320, y: 86, gap: 74 },
      tag: { w: 34, h: 16 },
      tagTextColor: "#0a0f1c",
      // 話題の見出し（「■ 戦い」など。data/patchnotes.js の { section }）の色
      sectionColor: "#8fb8ff",

      // visibleRows … 一度に出すバージョンの数。
      //   ★ バージョンは増え続けるので、入りきらない前提で送れるようにしてある。
      //     これが無かったころは8個目から枠の外へはみ出していた
      list:  { x: 48, y: 122, w: 250, h: 372, rowHeight: 56, visibleRows: 6 },
      selectedBg: "rgba(74,107,168,0.3)",
      notes: { x: 316, y: 112, w: 444, h: 382, charsPerLine: 30 },

      hint: { x: 48, y: 570 }
    },

    /**
     * 加護を選ぶ画面。候補を縦に並べる。
     * card.gap は2つ目以降の候補が下へずれる量。
     */
    blessing: {
      background: "#0a0f1c",
      title:    { y: 96,  font: "24px monospace", color: "#e6ecff" },
      subtitle: { y: 126, font: "13px monospace", color: "#7f8db8" },

      card:  { x: 150, y: 170, w: 500, h: 84, gap: 98 },
      owned: { x: 400, y: 500 },
      hint:  { x: 400, y: 560 }
    },

    /**
     * ショップ。左に品物の一覧、右に選んだ品物の説明を出す。
     */
    shop: {
      background: "#0a0f1c",
      title:    { x: 48, y: 62, font: "26px monospace", color: "#e6ecff" },
      subtitle: { x: 48, y: 88, font: "13px monospace", color: "#7f8db8" },
      gold:     { x: 760, y: 66, font: "16px monospace", color: "#ffd75e" },

      // 上段：店の切り替え（開いている店だけ並ぶ）
      //   Q/E または左右キーの上段で切り替える
      shopTabs: { x: 48, y: 100, w: 130, h: 28, gap: 6 },
      // 下段：買う / 売る
      tabs:     { x: 48, y: 136, w: 160, h: 28, gap: 8 },
      list:     { x: 48, y: 176, w: 400, h: 318, rowHeight: 26, visibleRows: 10 },
      detail:   { x: 470, y: 176, w: 290, h: 318, charsPerLine: 18 },

      // 店主。詳細欄の右上に立たせる（動きは data/shop.js の keeperMotion）
      keeper: { x: 684, y: 88, size: 80 },
      // 店主のふきだし（台詞は data/shop.js の lines）。店主の左に出す
      //   tailY        … しっぽの高さ（店主の口のあたり）
      //   life         … 出している時間（ms）。fadeIn / fadeOut は出始めと消え際
      //   idleInterval … 何もしていないとき、店主が独り言を言う間隔（ms）
      speech: { x: 396, y: 98, w: 272, h: 56, padX: 12, padTop: 24, lineHeight: 18,
                font: "13px monospace", charsPerLine: 19, tailY: 124, tailLength: 12,
                life: 6000, fadeIn: 200, fadeOut: 500, idleInterval: 9000 },

      // 買う個数を決めるとき
      quantityStep: 10,  // ←→ で一度に増減する数
      confirmMenu: { x: 560, y: 400, w: 190, h: 80, lineHeight: 26 },

      notice: { x: 400, y: 526 },
      hint:   { x: 48, y: 570 }
    },

    /**
     * 工房。左に作れるものの一覧、右に必要な素材と説明を出す。
     */
    craft: {
      background: "#0a0f1c",
      title:    { x: 48, y: 62, font: "26px monospace", color: "#e6ecff" },
      subtitle: { x: 48, y: 88, font: "13px monospace", color: "#7f8db8" },
      gold:     { x: 760, y: 66, font: "16px monospace", color: "#ffd75e" },

      list:   { x: 48, y: 122, w: 400, h: 372, rowHeight: 26, visibleRows: 12 },
      detail: { x: 470, y: 122, w: 290, h: 372, charsPerLine: 18 },

      confirmMenu: { x: 560, y: 400, w: 190, h: 80, lineHeight: 26 },
      notice: { x: 400, y: 526 },
      hint:   { x: 48, y: 570 }
    },

    /**
     * 加護を選ぶ画面。工房と同じ「左に一覧・右に詳細」の形にそろえてある。
     * 右上には所持金ではなく「入れている数 / 上限」を出す。
     */
    blessingSelect: {
      background: "#0a0f1c",
      title:    { x: 48, y: 62, font: "26px monospace", color: "#e6ecff" },
      subtitle: { x: 48, y: 88, font: "13px monospace", color: "#7f8db8" },
      count:    { x: 760, y: 66, font: "16px monospace", color: "#e6ecff" },

      list:   { x: 48, y: 122, w: 400, h: 372, rowHeight: 26, visibleRows: 12 },
      detail: { x: 470, y: 122, w: 290, h: 372, charsPerLine: 18 },

      // 等級ごとの編成数。詳細欄の下半分に、いつも同じ場所で出す。
      //   0個の等級があると選択肢の枠が1つ空くので、ここが実質の要
      tierSummary: { x: 482, y: 330, lineHeight: 18 },

      notice: { x: 400, y: 526 },
      hint:   { x: 48, y: 570 }
    },

    /**
     * ダンジョン選択画面。左に一覧、右に選んだ場所の詳細を出す。
     */
    dungeonSelect: {
      background: "#0a0f1c",
      title:    { x: 48, y: 62, font: "26px monospace", color: "#e6ecff" },
      subtitle: { x: 48, y: 88, font: "13px monospace", color: "#7f8db8" },

      // 一覧の1件分。2件目以降は rowHeight ずつ下にずれる
      list:   { x: 48, y: 122, w: 400, h: 78, rowHeight: 90 },

      // 場所の雰囲気を色で示す（data/dungeonThemes.js の色をそのまま使う）
      //   themeBar   … 一覧の左端に出す帯
      //   lockedColor… まだ行けない場所の色（中身を見せない）
      themeBar:    { width: 6 },
      lockedColor: "#242a3a",
      // 推奨レベルに、連れている仲間の最高レベルが届いていないときの色
      underLevelColor: "#e8896a",

      // 右の詳細欄。説明・出現モンスター・手に入るものを縦に並べる
      //   charsPerLine … 説明文を折り返す文字数
      //   columns / columnWidth … モンスター名などを何列で並べるか
      //   banner … 上部に出す、その場所の色の帯
      detail: { x: 470, y: 122, w: 290, h: 400,
                lineHeight: 18, charsPerLine: 20, columns: 2, columnWidth: 132,
                banner: { height: 44 } },

      hint: { x: 48, y: 570 }
    },

    /**
     * 挑戦の結果画面。拠点へ戻る前に必ず通る。
     *   outcomes … 結果ごとの見出しの色
     */
    result: {
      background: "#0a0f1c",
      title:    { x: 400, y: 96, font: "28px monospace", color: "#e6ecff", align: "center" },
      subtitle: { x: 400, y: 128, font: "14px monospace", color: "#7f8db8", align: "center" },
      // はじめてクリアしたときだけ出る「自動でセーブした」の一行。
      // 副題と所持金のあいだに置く（出ない挑戦のほうが多いので、間が空くだけ）
      savedNote:{ x: 400, y: 148, font: "12px monospace", color: "#5fd18c", align: "center" },
      gold:     { x: 400, y: 168, font: "18px monospace", color: "#ffd75e", align: "center" },
      list:     { x: 230, y: 196, w: 340, h: 300, rowHeight: 26, visibleRows: 10 },
      // マウスだけでも先へ進めるようにするボタン
      homeButton: { x: 330, y: 512, w: 140, h: 32 },
      hint:     { x: 48, y: 570 },
      outcomes: {
        escaped:  { color: "#e6ecff" },
        cleared:  { color: "#ffd75e" },
        passed:   { color: "#ffd75e" },   // 主のいない区画を出口から抜けた（クリアなので討伐と同じ色）
        scouted:  { color: "#5fd18c" },   // ボスを仲間にして帰ってきた
        defeated: { color: "#e8542a" }
      }
    },

    /**
     * 設定画面。左に調整できる項目、右に操作キーの一覧を出す。
     */
    settings: {
      background: "#0a0f1c",
      title:    { x: 48, y: 62, font: "26px monospace", color: "#e6ecff" },
      subtitle: { x: 48, y: 88, font: "13px monospace", color: "#7f8db8" },

      // 左：音量などの調整項目。
      // h は最低の高さで、項目が増えたぶんは SettingsScene が自動で伸ばす
      // ※ 項目は7つまでは右の枠と同じ高さに収まる。8つ以上にするときは
      //   rowHeight を詰めるか、右のキー一覧のように送れるようにすること
      items: { x: 48, y: 122, w: 340, h: 240, rowHeight: 44, barWidth: 150, barHeight: 8 },

      // 右：操作キーの一覧。入りきらないぶんはホイール・右端のバー・Q/E で送る
      //   visibleRows … 一度に出す行数（これを超えるとスクロールバーが出る）
      keys:  { x: 412, y: 122, w: 348, h: 372, rowHeight: 30, visibleRows: 10 },

      notice: { x: 400, y: 526 },
      hint:   { x: 48, y: 570 }
    },

    /**
     * 探索画面。マップは 25x18 タイル（=800x576px）で、
     * 上端の手持ち表示と下端の情報欄はその外側・内側に重ねて描く。
     */
    dungeon: {
      background: "#05070d",
      // 左上のパーティ表示（名前・状態異常の印・HP）。
      //   高さは書かない。仲間の人数から決まる（DungeonScene._renderPartyStatus）
      //   width … 枠の横幅。名前が長いときは「…」で切り詰める
      // width は、名前8文字と HP「9999/9999」（4桁。data/growth.js の statCap）が並んで入る幅
      partyStatus: { x: 0, y: 0, width: 212, padding: 8, rowHeight: 16,
                     bg: "rgba(0,0,0,0.6)", color: "#c8d0e8", font: "12px monospace" },
      infoBar:   { height: 24, bg: "rgba(0,0,0,0.7)", color: "#c8d0e8", font: "13px monospace" },
      notice:    { height: 40, bg: "rgba(8,10,20,0.92)", color: "#ffd75e", font: "15px monospace" },
      // 階段の見た目。sprite があればそれを描き、無ければ text の記号を描く。
      // ダンジョンのテーマ側で上書きすれば、場所ごとに別の絵にもできる
      stairsMark: { sprite: "stairsDown", text: "▼", color: "#ffd75e", font: "20px monospace" },
      // ※ プレイヤーの絵と動きは data/player.js の appearance に移した
      //   （見た目はUIの配置ではなく、そのキャラクターの持ち物なので）
      // 1マス進むのにかける時間（ms）。マスからマスへ滑って移動する。
      //   歩く間隔（130ms）より短くしておくと、一歩ごとに落ち着いて見える。
      //   0 にすると今までどおり瞬間移動になる
      playerMoveDuration: 105,
      // 階を降りるときの暗転。画面は変わらないので、シーンが自分で行う
      stairFade: { duration: 300, color: "#04060c" },

      // マウスだけでも操作できるよう、地図の右下に重ねるボタン。
      //   キーボードの P / I と同じ働きをする
      buttons: {
        party: { x: 594, y: 544, w: 94, h: 26 },
        items: { x: 694, y: 544, w: 94, h: 26 }
      },
      /**
       * その場で決めてもらう問いかけの窓（仕掛けを使うか・階段で降りるか など）。
       *
       * 高さは書かない。問いかけの行数と選択肢の数から計算するので、
       * 選択肢が2つでも3つでも、はみ出さずに収まる。
       *   lineHeight     … 問いかけの行間
       *   menuLineHeight … 選択肢の行間
       *   gap            … 問いかけの枠と選択肢の枠のすき間
       */
      prompt: { x: 236, y: 168, w: 330, lineHeight: 20, menuLineHeight: 26, gap: 10 }
    },

    party: {
      background: "#0b0f1a",
      title: { x: 32, y: 42 },
      // 「連れていく / 預かり所」の切り替え表示（gap は2つ目の左へのずれ）
      tabs: { x: 200, y: 42, gap: 150 },
      // 一覧の1行分の配置。2体目以降は rowHeight ずつ下にずれる
      //   visible … 画面に同時に出す行数（預かり所はこれより多く入るので、枠の中でスクロールする。
      //             右端にスクロールバーが出る。動かし方は持ち物・図鑑の一覧と同じ）
      //   cursorSpace … 行の左に出す「▶」の幅（枠の左へはみ出して描く分）
      list: { x: 32, y: 58, w: 480, h: 62, rowHeight: 70, visible: 6, cursorSpace: 22 },
      spriteSize: 48,
      hpBarWidth: 220,
      // 先頭から何体が戦闘に出るかを示す線
      fieldDivider: { color: "#ffd75e", label: "出撃" },
      // 選択中の個体の詳細
      // 下端は「戻る」ボタン（theme.backButton の y 552）の少し上まで。
      // 中身が多い仲間は行間を詰めて収める（PartyScene._detailLineHeight）
      detail: { x: 540, y: 58, w: 228, h: 484 },
      /**
       * 装備の画面（v1.0.3。画面ぜんぶを使う。js/scenes/PartyScene.js の _renderEquipScreen）
       *   monster … 左上の ◀ 絵・名前 ▶（spriteSize は絵の大きさ）
       *   slots   … 左の枠の一覧と「すべて外す」。labelX は枠の名前、nameX は装備の名前の位置（枠の左端から）
       *   items   … 右の候補。headHeight は見出し（枠の名前・並べ方）の高さ、effectX は主な効果の列（枠の左端から）
       *   compare … 下の見比べ。colB は「着けたら」の列、colStats はステータスの列（枠の左端から）
       */
      equip: {
        monster: { x: 32, y: 58, w: 300, h: 84, spriteSize: 48 },
        slots:   { x: 32, y: 150, w: 300, h: 156, rowHeight: 26, labelX: 30, nameX: 128 },
        items:   { x: 348, y: 58, w: 420, h: 248, rowHeight: 26, headHeight: 30, effectX: 196 },
        compare: { x: 32, y: 316, w: 736, h: 226, colB: 250, colStats: 520, lineHeight: 20 }
      },
      /**
       * 預かり所の画面（v1.0.3。js/scenes/PartyScene.js の _renderBoxView）
       *   party  … 左の連れていく仲間の列（rowHeight は1体ぶん、spriteSize は絵）
       *   grid   … 中の箱。cols 列のマス（cell は1マスの大きさ、gap はマスの間）。headHeight は「◀ 箱 1/10 ▶」の高さ
       *   footer … 下の並べ方・絞り込みと、操作の札
       *   detail … 右の詳細（一覧の右の欄と同じ描き方）
       *   filter … 絞り込みの一覧（箱の上に重ねる）
       *   cellColor … マスの地の色 / markColor … まとめて逃がす印 / chipColor … 操作の札の地の色
       */
      box: {
        party:  { x: 32, y: 58, w: 170, h: 306, rowHeight: 46, spriteSize: 32 },
        grid:   { x: 214, y: 58, w: 326, h: 306, headHeight: 34, cols: 6, cell: 50, gap: 2, spriteSize: 36 },
        footer: { x: 32, y: 374, w: 508, h: 168, lineHeight: 26 },
        detail: { x: 552, y: 58, w: 216, h: 484 },
        filter: { x: 250, y: 110, w: 300, h: 340, rowHeight: 24 },
        cellColor: "#121a2e",
        markColor: "#e86a8a",
        chipColor: "#18213a",
        levelFont: "10px monospace"
      },
      // 「この仲間をどうするか」の項目。
      // h は最低の高さで、項目が増えたぶんは CommandMenu が自動で伸ばす
      actionMenu: { x: 300, y: 180, w: 220, h: 140, lineHeight: 28 },
      // 探索中に使う技の一覧と、その相手の一覧（「この仲間をどうするか」と同じ場所に重ねる）
      //   h は最低の高さ。項目が増えたぶんは CommandMenu が自動で伸ばす
      fieldSkillMenu:  { x: 300, y: 180, w: 240, h: 68,  lineHeight: 28 },
      fieldTargetMenu: { x: 300, y: 150, w: 260, h: 110, lineHeight: 28 },
      // 作戦を選ぶ（v1.0.0）。説明は下の知らせ欄に出る
      tacticMenu:      { x: 300, y: 130, w: 260, h: 110, lineHeight: 28 },
      // 「逃がしますか?」の窓。拠点の「タイトルに戻りますか?」と同じ見た目
      releaseConfirm: {
        veil:       "rgba(4,6,12,0.72)",
        background: "#0d1220",
        box:   { x: 220, y: 200, w: 360, h: 210 },
        title: { x: 400, y: 244 },
        body:  { x: 400, y: 276 },
        note:  { x: 400, y: 300 },
        menu:  { x: 336, y: 314, w: 128, h: 68, lineHeight: 28 }
      },

      /**
       * 「様子を見る」の画面。画面ぜんぶを1枚の枠にして、3列に分ける。
       *   左   … 絵（sprite.x/y は**中心**の座標）と名前、その下に特性と技の数
       *   ページは3つ（←→）：ステータス ／ 技・特性 ／ モンスター説明
       *   中央 … ステータス（装備で上がったぶんは「(+8)」）と装備、装備の効果
       *   右   … 属性耐性と状態異常耐性（2列の表。装備で上がったぶんは「(+3)」）
       * 文字は一覧の詳細欄より一段大きい（font）。ゆっくり眺める画面なので読みやすさを優先
       */
      inspect: {
        box:    { x: 32, y: 48, w: 736, h: 470 },
        // 左上のページの札（ステータス ／ モンスター説明）。枠の左上からのずれ
        tabs:   { x: 16, y: 24, gap: 20, font: "14px monospace" },
        // モンスター説明のページ。絵と名前の右に、図鑑の説明と愛情度の記録を出す
        notes:  { x: 268, y: 104, lineHeight: 22, font: "14px monospace" },
        // 技・特性のページ（v1.0.3）。技が多くて入らないときは行の間を minLineHeight まで詰める。
        //   elementX / kindX / statsX … 属性・種類・威力などの列（x からのずれ）
        //   abilityGap … 技の一覧と特性の間。abilityLineHeight … 特性の説明の行の高さ
        skills: { x: 268, y: 104, lineHeight: 22, minLineHeight: 16, font: "14px monospace",
                  elementX: 150, kindX: 186, statsX: 256, abilityGap: 14, abilityLineHeight: 18 },
        sprite: { x: 150, y: 160, size: 128 },
        name:   { y: 246 },
        left:   { x: 64, y: 316, lineHeight: 20 },
        stats:  { x: 268, y: 96, lineHeight: 22, font: "14px monospace" },
        resist: { x: 502, y: 96, lineHeight: 22, colWidth: 126, font: "14px monospace", iconSize: 16 },
        // 特性と装備でいま効いている効果。耐性の表の下に続けて出す。
        //   gap      … 状態異常の表との間隔
        //   font     … 効果の文（「素早さ ×1.1」）
        //   fromFont … どこから来ているか（「（深淵の牙）」）。小さくして主張させない
        effects: { gap: 12, lineHeight: 18, font: "13px monospace", fromFont: "11px monospace" }
      },

      // 愛情度の詳細。「様子を見る」の上に重ねる窓（js/scenes/PartyScene.js の _renderAffectionDetail）
      //   colNeed / colReward … 段階の一覧の「必要な回数」「報酬」の列の位置（窓の左端から）
      affectionDetail: {
        box: { x: 150, y: 110, w: 500, h: 320 },
        padX: 28, padTop: 40, titleGap: 34, sectionGap: 34, rowHeight: 28,
        colNeed: 120, colReward: 190, barColor: "#ffb0c8"
      },

      hint: { x: 32, y: 576 }
    }
  };
})(window.MyGame);
