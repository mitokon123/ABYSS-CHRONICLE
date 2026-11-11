/**
 * player.js
 * プレイヤーの初期状態。
 *
 * starterMonsters : 最初から連れているモンスター（種族idとレベル）
 * starterItems    : 最初から持っているアイテム（アイテムidと個数）
 * startingGold    : 最初から持っているゴールド
 * appearance      : 地図の上での見た目（絵と動き）
 *
 * ★ 開始時の内容を変えたいときは、このファイルを編集するだけでよい。
 *
 * ▼ 持ち物の種類数に上限は無い
 *   以前は inventoryMax（20種類）があったが、素材が増えるほど
 *   「店で素材が買えない」「拾ったものが入らない」が起きるだけで、
 *   遊びとして面白くなる場面が無かったのでやめた。
 *   1種類あたりの持てる数（data/items.js の maxStack）だけが上限。
 */
(function (NS) {
  "use strict";

  NS.rawData.player = {
    starterMonsters: [
      { species: "slime", level: 5 }
    ],

    starterItems: [
      { item: "herb", count: 3 },
      { item: "potion", count: 1 }
    ],

    startingGold: 50,

    /**
     * 地図の上での見た目。
     *
     * sprite     : 絵。**並べて書くとコマ絵になる**（data/sprites.js）
     * walkMotion : 歩いているあいだの動き（data/motions.js）
     * idleMotion : 立ち止まっているあいだの動き
     *
     * ▼ 向きは持たない（カニ歩き）
     *   どちらへ動いても正面を向いたまま。4方向ぶん描かなくて済む。
     *   ★ 下の rig を書いたとき（v1.2.0）は、ダンジョンでは新しい絵で4方向を向く。
     *     sprite / walkMotion / idleMotion は、rig を消したときと、まだ新しい絵にしていない画面で使う
     *
     * ▼ 立ち止まると1コマ目で止まる
     *   idleMotion にはコマ絵の指定が無いので、frame は 0 のまま。
     *   ずっと足を動かし続けさせたいときは、ここを "playerWalk" にすればよい
     *   （そのぶん、止まっているのか動いているのかは分かりにくくなる）。
     */
    appearance: {
      sprite: ["playerWalk1", "playerWalk2"],
      walkMotion: "playerWalk",
      idleMotion: "breathe",

      /**
       * 服の色を選べるようにする仕掛け。
       *
       * colorKeys … 絵のパレットの、どの記号を差し替えるか。
       *   base / light / shadow の3つで1組。3つとも替えないと、
       *   影だけ前の色のまま残って濁る。
       *
       * colors … 選べる色。**1色につき絵が2枚（コマ数ぶん）作られる**ので、
       *   増やすと起動時に作る絵も増える。6色 × 2枚 = 12枚。
       *
       * ★ 色を増やすときは、この配列に1つ足すだけでよい。
       *   絵を描き足す必要はない（js/systems/PlayerLook.js がパレットを差し替えて作る）。
       */
      colorKeys: { base: "A", light: "H", shadow: "D" },
      colors: [
        { id: "blue",   name: "青",     base: "#4a7fe0", light: "#6f9ff0", shadow: "#2f4f96" },
        { id: "red",    name: "赤",     base: "#d94f43", light: "#ec7a6d", shadow: "#8f2f26" },
        { id: "green",  name: "緑",     base: "#4aa85e", light: "#6fd183", shadow: "#2c6b3a" },
        { id: "purple", name: "紫",     base: "#8a5fd1", light: "#a985e8", shadow: "#573a8c" },
        { id: "orange", name: "だいだい", base: "#e08a3a", light: "#f0ad6a", shadow: "#96551e" },
        { id: "black",  name: "黒",     base: "#3c4152", light: "#5a6070", shadow: "#23262f" }
      ],
      defaultColor: "blue",

      /**
       * ここから下（髪型・髪の色・ズボンの色・飾り）は v1.2.0 の新しい絵（下の rig）だけに使う。
       * いまの 32×32 の絵には効かない。どれも名前と見た目を決める画面で選ぶ。
       * セーブには playerHair / playerHairColor / playerPants / playerAcc / playerAccColor として入り、無ければ既定。
       * 色は上の colors と同じ書き方（光 light と影 shadow も書く）。画面では右端に「じぶんで」も並ぶ。
       *
       * 髪型の id は js/systems/CharaRig.js の HAIR_IDS。並べた順に画面に出る
       */
      hairStyles: [
        { id: "short",    name: "短め" },
        { id: "long",     name: "長め" },
        { id: "ponytail", name: "ポニーテール" },
        { id: "spiky",    name: "ツンツン" },
        { id: "bob",      name: "ボブ" },
        { id: "slick",    name: "なでつけ" },
        { id: "medium",   name: "肩まで" }
      ],
      defaultHair: "short",

      hairColors: [
        { id: "gold",   name: "金", base: "#e8b23a", light: "#f7d774", shadow: "#b07a1e" },
        { id: "brown",  name: "茶", base: "#8a5a32", light: "#ad7a4c", shadow: "#5a3a1e" },
        { id: "black",  name: "黒", base: "#33334a", light: "#55557a", shadow: "#1e1e2c" },
        { id: "silver", name: "銀", base: "#c4c8d6", light: "#e8ebf4", shadow: "#8a8fa4" },
        { id: "red",    name: "赤", base: "#c8402e", light: "#e86a52", shadow: "#86281c" },
        { id: "blue",   name: "青", base: "#3f6fd0", light: "#6a94ea", shadow: "#284890" },
        { id: "green",  name: "緑", base: "#3f9a58", light: "#64c27c", shadow: "#286638" },
        { id: "pink",   name: "桃", base: "#e889b0", light: "#f6b0cc", shadow: "#b05a80" }
      ],
      defaultHairColor: "gold",

      // ズボンは作者の指定で、どれも濃い色にしてある（2026-10-29「なるべく濃い色に」）

      pantsColors: [
        { id: "black",  name: "黒",     base: "#34323e", light: "#4a4756", shadow: "#222029" },
        { id: "navy",   name: "紺",     base: "#2a3352", light: "#3d4a72", shadow: "#1b2138" },
        { id: "brown",  name: "こげ茶", base: "#3e2c22", light: "#563f31", shadow: "#291c15" },
        { id: "green",  name: "深緑",   base: "#263b2e", light: "#375342", shadow: "#18261d" },
        { id: "gray",   name: "灰",     base: "#4a4c56", light: "#63666f", shadow: "#33343c" },
        { id: "wine",   name: "えんじ", base: "#4a2228", light: "#643039", shadow: "#301519" }
      ],
      defaultPants: "black",

      // 飾り。いくつでも同時に着けられる（既定は何も着けない）。
      // id は CharaRig が描ける飾り（glasses / scarf / cape / band）。color は「もとの色」（色を選んでいないときの色）
      accessories: [
        { id: "glasses", name: "眼鏡",     color: "#6a6478" },
        { id: "scarf",   name: "スカーフ", color: "#c8463a" },
        { id: "cape",    name: "マント",   color: "#8a2f3a" },
        { id: "band",    name: "はちまき", color: "#f0f0f0" }
      ],
      // 飾りの色。どの飾りにも同じ一覧から選ぶ（画面では左端に「もとの色」、右端に「じぶんで」が並ぶ）。
      // 飾りは小さいので base だけ書けばよい（光と影は CharaRig が作る）。セーブには playerAccColor（飾りの id → 色の id か "#rrggbb"）
      accColors: [
        { id: "red",    name: "赤", base: "#c83a3a" },
        { id: "blue",   name: "青", base: "#3a62c8" },
        { id: "green",  name: "緑", base: "#3a9a52" },
        { id: "yellow", name: "黄", base: "#e8c040" },
        { id: "purple", name: "紫", base: "#7a4ac0" },
        { id: "white",  name: "白", base: "#f0f0f0" },
        { id: "black",  name: "黒", base: "#2e2e38" },
        { id: "brown",  name: "茶", base: "#8a5a32" }
      ],

      /**
       * 部品を重ねて作る新しい絵（v1.2.0。js/systems/CharaRig.js）。
       * これがあると、ダンジョンの地図では新しい絵（4方向・腕を振る歩き・まばたき）で歩く。
       * 消すと今までの 32×32 の絵に戻る。
       *
       * mapSize … 地図での絵の大きさ（px）。マスは32。足をマスの下にそろえ、頭は上のマスへはみ出す。
       *           36 は作者が実際の階で見比べて決めた（2026-10-29）。人の高さ 34 点（いまの 32×32 の絵は 26 点）
       * previewScale … 名前と見た目を決める画面で、64×64 の絵を何倍で見せるか
       */
      rig: {
        mapSize: 36,
        previewScale: 3
      }
    },

    /**
     * 名前を決めていないときに使う呼び名。
     * 文字盤（data/naming.js）で決めるので、最大文字数もそちらに従う。
     * ★ 以前は「あなた」だったが、名前に見えず分かりにくいので「ソラ」にした（RC-1）
     */
    defaultName: "ソラ",

    /**
     * 性別と一人称。名前と見た目を決める画面で選ぶ（あとから設定でも変えられる）。
     *
     * ★ どちらも**ゲームの進み方には何も影響しない**（ストーリー構成.md の 2）。
     *   性別と一人称は別々に選べる（組み合わせは自由）。
     *   一人称は物語の台詞に {me} と書いたところへ差し込まれる（data/story.js）。
     *
     * 選択肢を増やすときは、配列に1つ足すだけでよい。
     * 画面の1行に並ぶのは6つまで（data/ui.js の playerSetup.chip の幅で決まる）。
     */
    genders: [
      { id: "male",   name: "男性" },
      { id: "female", name: "女性" }
    ],
    defaultGender: "male",

    firstPersons: ["私", "僕", "俺", "あたし", "うち", "自分"],
    defaultFirstPerson: "私"
  };
})(window.MyGame);
