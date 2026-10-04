/**
 * sprites_abyss.js
 * 揺籃の穴（region: "cradle"）に出るモンスターの絵。
 *
 * ここに入るのは、揺籃の穴のダンジョンのうち
 * 苔むす坑道・灼熱の亀裂・静寂の深層に出る種族（毒沼は data/sprites_marsh.js）。
 * ★ ファイル名は地方の id を "cradle" にする前のまま（読み込み先を変えないため）。
 *
 * 別の地方が増えたら data/sprites_〇〇.js を新しく作る。
 * 書き方（パレット・pixels）と分け方の方針は data/sprites.js を参照。
 */
(function (NS) {
  "use strict";

  NS.extend("sprites", {

    // --- どの階でも出るもの ---

    /**
     * α-5で 32×32 に描き直した。3枚（slime / slimeStretch / slimeSquash）とも
     * 「16×16をそのまま2倍に拡大してから塗り直す」方式（やり方は batty のコメント参照）。
     *
     * ★ 3枚とも足元の行が29でそろっていることを確認してある。
     *   ここがずれると、跳ねる動き（slimeIdle）で絵が切り替わるたびに浮き上がる。
     *   縦横の関係も保たれている：
     *     伸びる 28×24 ／ ふつう 26×26 ／ 潰れる 22×32
     *
     * ハイライト（L）は作者が置いた位置に戻してある。
     * 塗り直しに任せると輪郭沿いの明るいふちに吸収されて、照りが消える。
     */
    slime: {
      palette: {
        ".": null,
        "K": "#071a12",   // 輪郭
        "N": "#16402c",   // 面と面のさかい・いちばん深い影
        "D": "#2f8a5d",   // 影
        "G": "#5fd18c",   // 体（緑）
        "H": "#86e5ad",   // 光の当たる面
        "L": "#a8f0c4",   // ハイライト
        "W": "#ffffff"    // 目
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...............KKKK.............",
        "..............KNNNNK............",
        "...........KKKHHHHHHKKK.........",
        "..........KNNNHGGGGHNNNK........",
        ".........KHHLLGGGGGGHHHHK.......",
        "........KNHGLLGGGGGGGGGHNK......",
        ".......KHHLLGGGGGGGGGGGGHHK.....",
        "......KNHGLLGGGGGGGGGGGGGHNK....",
        "......KNHGGGGGGGGGGGGGGGGDNK....",
        "......KNHGGGGGGGGGGGGGGGGDNK....",
        ".....KHHGGWWWWGGGGGGWWWWGGDDK...",
        "....KNHGGGWWWWGGGGGGWWWWGGGDNK..",
        "....KNHGGGWWWWGGGGGGWWWWGGGDNK..",
        "....KNHGGGWWWWGGGGGGWWWWGGGDNK..",
        "....KNHGGGGGGGGGGGGGGGGGGGGDNK..",
        "....KNHGGGGGGGGGGGGGGGGGGGGDNK..",
        "....KNHGGGGGGGGGGGGGGGGGGGGDNK..",
        "....KNHGGGGGGGGGGGGGGGGGGGGDNK..",
        "....KNHGGGGGGGGGGGGGGGGGGGGDNK..",
        "....KNHGGGGGGGGGGGGGGGGGGGGDNK..",
        "....KNHGGGGGGGGGGGGGGGGGGGGDNK..",
        "....KNHDGGGGGGGGGGGGGGGGGGDDNK..",
        "....KNNNDGGGGGGGGGGGGGGGGDNNNK..",
        ".....KKKDDDDDDDDDDDDDDDDDDKKK...",
        "........KNNNNNNNNNNNNNNNNK......",
        ".........KKKKKKKKKKKKKKKK.......",
        "................................",
        "................................"
      ]
    },

    /**
     * スライムの眠った姿（RC-1）。slime をそのまま写し、目だけを閉じた形（︶）に変えた。
     * 閉じた目の色は起きているときと同じ白（W）（作者の指定）。
     * 形（輪郭・ハイライト）は1ドットも変えていない。脱力して潰れる感じは、
     * 絵ではなく動き（data/motions.js の slimeSleeping）で出している
     */
    slimeSleep: {
      palette: {
        ".": null,
        "K": "#071a12",
        "N": "#16402c",
        "D": "#2f8a5d",
        "G": "#5fd18c",
        "H": "#86e5ad",
        "L": "#a8f0c4",
        "W": "#ffffff"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...............KKKK.............",
        "..............KNNNNK............",
        "...........KKKHHHHHHKKK.........",
        "..........KNNNHGGGGHNNNK........",
        ".........KHHLLGGGGGGHHHHK.......",
        "........KNHGLLGGGGGGGGGHNK......",
        ".......KHHLLGGGGGGGGGGGGHHK.....",
        "......KNHGLLGGGGGGGGGGGGGHNK....",
        "......KNHGGGGGGGGGGGGGGGGDNK....",
        "......KNHGGGGGGGGGGGGGGGGDNK....",
        ".....KHHGGGGGGGGGGGGGGGGGGDDK...",
        "....KNHGGGGGGGGGGGGGGGGGGGGDNK..",
        "....KNHGGGWGGWGGGGGGWGGWGGGDNK..",
        "....KNHGGGGWWGGGGGGGGWWGGGGDNK..",
        "....KNHGGGGGGGGGGGGGGGGGGGGDNK..",
        "....KNHGGGGGGGGGGGGGGGGGGGGDNK..",
        "....KNHGGGGGGGGGGGGGGGGGGGGDNK..",
        "....KNHGGGGGGGGGGGGGGGGGGGGDNK..",
        "....KNHGGGGGGGGGGGGGGGGGGGGDNK..",
        "....KNHGGGGGGGGGGGGGGGGGGGGDNK..",
        "....KNHGGGGGGGGGGGGGGGGGGGGDNK..",
        "....KNHDGGGGGGGGGGGGGGGGGGDDNK..",
        "....KNNNDGGGGGGGGGGGGGGGGDNNNK..",
        ".....KKKDDDDDDDDDDDDDDDDDDKKK...",
        "........KNNNNNNNNNNNNNNNNK......",
        ".........KKKKKKKKKKKKKKKK.......",
        "................................",
        "................................"
      ]
    },

    // スライムの潰れた姿。地面に着いた瞬間に使う（横に広がり、背が低い）
    //   足元（下から2行目）を slime と揃えてあるので、切り替えても浮き上がらない
    slimeSquash: {
      palette: {
        ".": null,
        "K": "#071a12",
        "N": "#16402c",
        "D": "#2f8a5d",
        "G": "#5fd18c",
        "H": "#86e5ad",
        "L": "#a8f0c4",
        "W": "#ffffff"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............KKKKKK.............",
        "............KNNNNNNK............",
        ".......KKKKKHHHHHHHHKKKKK.......",
        "......KNNNNNHGGGGGGHNNNNNK......",
        "...KKKHHLLHHGGGGGGGGHHHHHHKKK...",
        "..KNNNHGLLGGGGGGGGGGGGGGGHNNNK..",
        "..KNHHGGGGGGGGGGGGGGGGGGGGHHNK..",
        "..KNHGGGGGGGGGGGGGGGGGGGGGGDNK..",
        ".KHHGGWWWWGGGGGGGGGGGGWWWWGGDDK.",
        "KNHGGGWWWWGGGGGGGGGGGGWWWWGGGDNK",
        "KNHGGGWWWWGGGGGGGGGGGGWWWWGGGDNK",
        "KNHGGGWWWWGGGGGGGGGGGGWWWWGGGDNK",
        "KNHGGGGGGGGGGGGGGGGGGGGGGGGGGDNK",
        "KNHGGGGGGGGGGGGGGGGGGGGGGGGGGDNK",
        "KNHGGGGGGGGGGGGGGGGGGGGGGGGGGDNK",
        "KNHGGGGGGGGGGGGGGGGGGGGGGGGGGDNK",
        "KNHGGGGGGGGGGGGGGGGGGGGGGGGGGDNK",
        "KNHGGGGGGGGGGGGGGGGGGGGGGGGGGDNK",
        "KNNNGGGGGGGGGGGGGGGGGGGGGGGGNNNK",
        ".KNNDDDDDDDDDDDDDDDDDDDDDDDDNNK.",
        "..KNNNNNNNNNNNNNNNNNNNNNNNNNNK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK...",
        "................................",
        "................................"
      ]
    },

    // スライムの伸びた姿。跳んでいる途中に使う（縦に伸びて、細い）
    slimeStretch: {
      palette: {
        ".": null,
        "K": "#071a12",
        "N": "#16402c",
        "D": "#2f8a5d",
        "G": "#5fd18c",
        "H": "#86e5ad",
        "L": "#a8f0c4",
        "W": "#ffffff"
      },
      pixels: [
        "................................",
        "................................",
        ".............KKKK...............",
        "............KNNNNK..............",
        "...........KHHHHHHK.............",
        "..........KNHGGGGHNK............",
        ".........KHHLLGGGGHHK...........",
        "........KNHGLLGGGGGHNK..........",
        ".......KHHLLGGGGGGGGHHKKK.......",
        "......KNHGLLGGGGGGGGGHHHNK......",
        ".....KHHGGGGGGGGGGGGGGHHHHK.....",
        "....KNHGGGGGGGGGGGGGGGGGGHNK....",
        "....KNHGGGGGGGGGGGGGGGGGGDNK....",
        "....KNHGGGGGGGGGGGGGGGGGGDNK....",
        "....KNHGGGWWWWGGGGWWWWGGGDNK....",
        "....KNHGGGWWWWGGGGWWWWGGGDNK....",
        "....KNHGGGWWWWGGGGWWWWGGGDNK....",
        "....KNHGGGWWWWGGGGWWWWGGGDNK....",
        "....KNHGGGGGGGGGGGGGGGGGGDNK....",
        "....KNHGGGGGGGGGGGGGGGGGGDNK....",
        "....KNHGGGGGGGGGGGGGGGGGGDNK....",
        "....KNHGGGGGGGGGGGGGGGGGGDNK....",
        "....KNHGGGGGGGGGGGGGGGGGGDNK....",
        "....KNHGGGGGGGGGGGGGGGGGGDNK....",
        "....KNHGGGGGGGGGGGGGGGGGGDNK....",
        "....KNHDGGGGGGGGGGGGGGGGDDNK....",
        "....KNNNDGGGGGGGGGGGGGGDNNNK....",
        ".....KKKDDDDDDDDDDDDDDDDKKK.....",
        "........KNNNNNNNNNNNNNNK........",
        ".........KKKKKKKKKKKKKK.........",
        "................................",
        "................................"
      ]
    },

    /**
     * 静寂の深層の主。α-5で 32×32 に描き直した。
     *
     * 前は 16×16 のスライムに小さな王冠を乗せただけで、雑魚と同じ大きさだった。
     * いまは枠いっぱいの大きな体にして、「大きな体と王冠」という説明どおりにしてある。
     *
     * ★ 体の色をミズダマリの水色から深い青へ移してある。
     *   ミズダマリも同じ #4fb0d1 を使っていたので、そのままだと
     *   最後の主が「大きいミズダマリ」に見えてしまう。
     *
     * 目は外が高く内が低い平行四辺形（吊り上がった目）。
     * 最初は白い長方形に黒目を置いたが、眼鏡にしか見えなかった。
     * 口はへの字に大きく取ってある。小さいと締まらない。
     *
     * ─── 立体に見せるためにやっていること ───
     * こいつだけは手足が無い「球」なので、magmaBeast とはやり方が違う。
     * 輪郭からの距離ではなく、**光源（左上）からの距離**で階調を決めている。
     * 輪郭沿いに明暗を置くと、球ではなく縁取りのある平らな円になる。
     *
     *   ・左上に近いほど明るい（P → L → B → D → N の5段）
     *   ・いちばん下の2行だけ一段明るく戻す＝床からの反射光。
     *     これが無いと、球が背景に貼りついて見える
     *   ・王冠にも同じ向きの陰影を入れる。
     *     体だけ球で王冠が平らだと、シールを貼ったように見える
     *   ・口は体の下側（暗いところ）にあるので、まわりを一段明るくして
     *     へこみに見せている
     */
    kingSlime: {
      palette: {
        ".": null,
        "K": "#08101f",   // 輪郭・目鼻立ち・王冠とのさかい
        "N": "#12294a",   // いちばん深い影（右下）
        "D": "#1b3a63",   // 体の影・底の反射光
        "B": "#2f66a8",   // 体（深い青）
        "L": "#5b9fd8",   // 照り
        "P": "#8fc7ee",   // ハイライト（左上）
        "Y": "#ffd75e",   // 王冠
        "O": "#c99b22",   // 王冠の影
        "W": "#dff2ff"    // 目
      },
      pixels: [
        "........KK..KK.KK.KK..KK........",
        ".......KYYKKYYKYYKYYKKYOK.......",
        ".......KYYYYYYYYYYYYYYYOK.......",
        ".......KYYYYYYYYYYYYOOOOK.......",
        ".......KYYYYYYYYYYYOOOOOK.......",
        ".......KOOOOOOOOOOOOOOOOK.......",
        "........KKKOOOOOOOOOOKKK........",
        "...........KKKKKKKKKK...........",
        "........KKKLLLLLBBBBBKKK........",
        "......KKPPPPPPLLLBBBBBDDKK......",
        ".....KLPPPPPPLLLLLBBBBBDDDK.....",
        "....KLLPPPPPPPLLLLBBBBBDDDDK....",
        "...KBLLLLLLPPPPLLLBBBBBDDDDNK...",
        "..KBBLLLLLPPPPPLLLBBBBBDDDDNNK..",
        "..KBBLLLPPPPPPPLLLBBBBBDDDDNNK..",
        ".KBBBKKKKKPPPPLLLLBBBBKKKKKNNNK.",
        ".KBBBWWWWKKKPLLLLLBBKKKWWWWNNNK.",
        ".KBBBWWWWWWKKLLLLBBKKWWWWWWNNNK.",
        "KBBBBWWWKKKWLLLLBBBBWKKKWWWNNNNK",
        "KDBBBBWWKKKWLLLBBBBBWKKKWWNNNNNK",
        "KDBBBBBBWWWWBBBBBBBBWWWWDNNNNNNK",
        "KDDBBBBBBBBBBBBBBBBBDDDDNNNNNNNK",
        "KDDDBBBBBBBBBBBBBBBBBDDDNNNNNNNK",
        "KDDDDDBBBBBBKKKKKKKKDDDNNNNNNNNK",
        "KDDDDDDDBBKKKKKKKKKKKKNNNNNNNNNK",
        "KNDDDDDDDKKKKKKKKKKKKKKNNNNNNNNK",
        ".KNNDDDDDDKKKDDDDDDKKKNNNNNNNNK.",
        ".KNNNNNNNNNNNNNNNNNNNNNNNNNNNNK.",
        ".KNNDDDDDDDDDDDDDDDDDDDDDDDDNNK.",
        "..KKNDDDDDDDDDDDDDDDDDDDDDDNKK..",
        "....KKKKKKKKKKKKKKKKKKKKKKKK....",
        "................................"
      ]
    },

    /**
     * キングスライムの縮んだ姿と眠り（RC-1）。形は kingSlime の行を抜いただけで描き直していない。
     * 王冠が枠のいちばん上まであるので、行を足して伸ばした絵は作れない。伸びる動きは拡大縮小（scaleY）で出す。
     *   kingSlimeSquash … 口の下の21・22行を抜き、上に空行を足した（王冠ごと2ドット沈む。図鑑「冠は体に沈んだまま」）
     *   kingSlimeSleep  … 縮んだ姿で目を閉じた。目の中（W と黒目の K）を、目の外でいちばん近い体のマスの色で埋め、
     *                     斜めの眉の線（15行）だけを残して閉じたまぶたに見せている。
     *                     ★ 一律に下の行の色で埋めると、左上からの光の階調とつながらず、目の跡が暗い四角・帯に浮く
     *                       （一度そうなって直した）。いちばん近いマスから拾うと、まわりの明るさとつながる。
     *                     寝ているので王冠を少し傾けた（作者の指定）。王冠（2〜9行）を6列ずつの帯に分け、
     *                     左の帯（〜12列）を1段上げ、右の帯（19列〜）を1段下げた。1列ずつずらすと縁がギザギザに崩れるので帯にしている
     */
    kingSlimeSquash: {
      palette: {
        ".": null, "K": "#08101f", "N": "#12294a", "D": "#1b3a63", "B": "#2f66a8",
        "L": "#5b9fd8", "P": "#8fc7ee", "Y": "#ffd75e", "O": "#c99b22", "W": "#dff2ff"
      },
      pixels: [
        "................................",
        "................................",
        "........KK..KK.KK.KK..KK........",
        ".......KYYKKYYKYYKYYKKYOK.......",
        ".......KYYYYYYYYYYYYYYYOK.......",
        ".......KYYYYYYYYYYYYOOOOK.......",
        ".......KYYYYYYYYYYYOOOOOK.......",
        ".......KOOOOOOOOOOOOOOOOK.......",
        "........KKKOOOOOOOOOOKKK........",
        "...........KKKKKKKKKK...........",
        "........KKKLLLLLBBBBBKKK........",
        "......KKPPPPPPLLLBBBBBDDKK......",
        ".....KLPPPPPPLLLLLBBBBBDDDK.....",
        "....KLLPPPPPPPLLLLBBBBBDDDDK....",
        "...KBLLLLLLPPPPLLLBBBBBDDDDNK...",
        "..KBBLLLLLPPPPPLLLBBBBBDDDDNNK..",
        "..KBBLLLPPPPPPPLLLBBBBBDDDDNNK..",
        ".KBBBKKKKKPPPPLLLLBBBBKKKKKNNNK.",
        ".KBBBWWWWKKKPLLLLLBBKKKWWWWNNNK.",
        ".KBBBWWWWWWKKLLLLBBKKWWWWWWNNNK.",
        "KBBBBWWWKKKWLLLLBBBBWKKKWWWNNNNK",
        "KDBBBBWWKKKWLLLBBBBBWKKKWWNNNNNK",
        "KDBBBBBBWWWWBBBBBBBBWWWWDNNNNNNK",
        "KDDDDDBBBBBBKKKKKKKKDDDNNNNNNNNK",
        "KDDDDDDDBBKKKKKKKKKKKKNNNNNNNNNK",
        "KNDDDDDDDKKKKKKKKKKKKKKNNNNNNNNK",
        ".KNNDDDDDDKKKDDDDDDKKKNNNNNNNNK.",
        ".KNNNNNNNNNNNNNNNNNNNNNNNNNNNNK.",
        ".KNNDDDDDDDDDDDDDDDDDDDDDDDDNNK.",
        "..KKNDDDDDDDDDDDDDDDDDDDDDDNKK..",
        "....KKKKKKKKKKKKKKKKKKKKKKKK....",
        "................................"
      ]
    },

    kingSlimeSleep: {
      palette: {
        ".": null, "K": "#08101f", "N": "#12294a", "D": "#1b3a63", "B": "#2f66a8",
        "L": "#5b9fd8", "P": "#8fc7ee", "Y": "#ffd75e", "O": "#c99b22", "W": "#dff2ff"
      },
      pixels: [
        "................................",
        "........KK..K...................",
        ".......KYYKKYK.KK.K.............",
        ".......KYYYYYYKYYKYK..KK........",
        ".......KYYYYYYYYYYYYKKYOK.......",
        ".......KYYYYYYYYYYYYYYYOK.......",
        ".......KOOOOOYYYYYYYOOOOK.......",
        "........KKKOOOOOOOOOOOOOK.......",
        "...........KKOOOOOOOOOOOK.......",
        ".............KKKKKKOOKKK........",
        "........KKKLLLLLBBBKKKKK........",
        "......KKPPPPPPLLLBBBBBDDKK......",
        ".....KLPPPPPPLLLLLBBBBBDDDK.....",
        "....KLLPPPPPPPLLLLBBBBBDDDDK....",
        "...KBLLLLLLPPPPLLLBBBBBDDDDNK...",
        "..KBBLLLLLPPPPPLLLBBBBBDDDDNNK..",
        "..KBBLLLPPPPPPPLLLBBBBBDDDDNNK..",
        ".KBBBKKKKKPPPPLLLLBBBBKKKKKNNNK.",
        ".KBBBBLLPPPPPLLLLLBBBBBDDDNNNNK.",
        ".KBBBBBBPPPPPLLLLBBBBBBBNNNNNNK.",
        "KBBBBBBBBBLLLLLLBBBBBBDDDNNNNNNK",
        "KDBBBBBBBBLLLLLBBBBBBBDDDNNNNNNK",
        "KDBBBBBBBBBBBBBBBBBBBDDDDNNNNNNK",
        "KDDDDDBBBBBBKKKKKKKKDDDNNNNNNNNK",
        "KDDDDDDDBBKKKKKKKKKKKKNNNNNNNNNK",
        "KNDDDDDDDKKKKKKKKKKKKKKNNNNNNNNK",
        ".KNNDDDDDDKKKDDDDDDKKKNNNNNNNNK.",
        ".KNNNNNNNNNNNNNNNNNNNNNNNNNNNNK.",
        ".KNNDDDDDDDDDDDDDDDDDDDDDDDDNNK.",
        "..KKNDDDDDDDDDDDDDDDDDDDDDDNKK..",
        "....KKKKKKKKKKKKKKKKKKKKKKKK....",
        "................................"
      ]
    },

    /**
     * キングスライムの動くコマ（RC-1 の作り直し）。王冠・目・口・ゼリーの体をそれぞれ動かす。形は描き直していない。
     *   LeanL / LeanR … 待機の揺れ。体の上ほど横へずらし（0〜11行は2、12〜17行は1）、王冠を傾けた
     *                   （王冠を9列ずつ左右に分け、傾く側を1段下げる。寝姿の傾け方と同じく帯でずらす）
     *   Roar    … 口（23〜28行）を大きく開けた。口の中 R、舌 T、上の牙 W。王の号令・ブレス・飛びかかり
     *   Stretch … 体の左右2列ずつ（2・3・28・29列）を抜いて細くし、口を開けた。跳んでいる途中（縦の伸びは scaleY で足す）
     *   Pop     … 口の下の21・22行と28行を抜いて体だけ3ドット沈め、王冠を元の高さに残した（着地の衝撃で王冠が浮く）
     *   Ouch    … 目を閉じ（寝姿と同じ埋め方）、王冠を右へ傾けた（被弾）
     *   Calm    … 目を閉じただけ（共鳴で力を響かせるとき）
     *   Happy   … 目を「∩」の笑い目にした（レベルアップ・スカウトに応じたとき）
     */
    kingSlimeLeanL: {
      palette: {
        ".": null, "K": "#08101f", "N": "#12294a", "D": "#1b3a63", "B": "#2f66a8", "L": "#5b9fd8",
        "P": "#8fc7ee", "W": "#dff2ff", "O": "#c99b22", "Y": "#ffd75e", "R": "#5a1030", "T": "#e0607a"
      },
      pixels: [
        "......K.........KK..KK..........",
        ".....KYK..KK.KKKYYKKYOK.........",
        ".....KYYKKYYKYYKYYYYYOK.........",
        ".....KYYYYYYYYYYYYOOOOK.........",
        ".....KYYYYYYYYYYYOOOOOK.........",
        ".....KOYYYYYYYYYOOOOOOK.........",
        "......KOOOOOOOOOOOOKKK..........",
        ".......KKOOOOOOOKKK.............",
        "......KKKKKKKKKKBBBKKK..........",
        "....KKPPPPPPLLLBBBBBDDKK........",
        "...KLPPPPPPLLLLLBBBBBDDDK.......",
        "..KLLPPPPPPPLLLLBBBBBDDDDK......",
        "..KBLLLLLLPPPPLLLBBBBBDDDDNK....",
        ".KBBLLLLLPPPPPLLLBBBBBDDDDNNK...",
        ".KBBLLLPPPPPPPLLLBBBBBDDDDNNK...",
        "KBBBKKKKKPPPPLLLLBBBBKKKKKNNNK..",
        "KBBBWWWWKKKPLLLLLBBKKKWWWWNNNK..",
        "KBBBWWWWWWKKLLLLBBKKWWWWWWNNNK..",
        "KBBBBWWWKKKWLLLLBBBBWKKKWWWNNNNK",
        "KDBBBBWWKKKWLLLBBBBBWKKKWWNNNNNK",
        "KDBBBBBBWWWWBBBBBBBBWWWWDNNNNNNK",
        "KDDBBBBBBBBBBBBBBBBBDDDDNNNNNNNK",
        "KDDDBBBBBBBBBBBBBBBBBDDDNNNNNNNK",
        "KDDDDDBBBBBBKKKKKKKKDDDNNNNNNNNK",
        "KDDDDDDDBBKKKKKKKKKKKKNNNNNNNNNK",
        "KNDDDDDDDKKKKKKKKKKKKKKNNNNNNNNK",
        ".KNNDDDDDDKKKDDDDDDKKKNNNNNNNNK.",
        ".KNNNNNNNNNNNNNNNNNNNNNNNNNNNNK.",
        ".KNNDDDDDDDDDDDDDDDDDDDDDDDDNNK.",
        "..KKNDDDDDDDDDDDDDDDDDDDDDDNKK..",
        "....KKKKKKKKKKKKKKKKKKKKKKKK....",
        "................................"
      ]
    },

    kingSlimeLeanR: {
      palette: {
        ".": null, "K": "#08101f", "N": "#12294a", "D": "#1b3a63", "B": "#2f66a8", "L": "#5b9fd8",
        "P": "#8fc7ee", "W": "#dff2ff", "O": "#c99b22", "Y": "#ffd75e", "R": "#5a1030", "T": "#e0607a"
      },
      pixels: [
        "..........KK..KK.........K......",
        ".........KYYKKYYKKK.KK..KOK.....",
        ".........KYYYYYYKYYKYYKKYOK.....",
        ".........KYYYYYYYYYYYYYYYOK.....",
        ".........KYYYYYYYYYYYYOOOOK.....",
        ".........KOOOOOOYYYYYOOOOOK.....",
        "..........KKKOOOOOOOOOOOOK......",
        ".............KKKOOOOOOOKK.......",
        "..........KKKLLLKKKKKKKKKK......",
        "........KKPPPPPPLLLBBBBBDDKK....",
        ".......KLPPPPPPLLLLLBBBBBDDDK...",
        "......KLLPPPPPPPLLLLBBBBBDDDDK..",
        "....KBLLLLLLPPPPLLLBBBBBDDDDNK..",
        "...KBBLLLLLPPPPPLLLBBBBBDDDDNNK.",
        "...KBBLLLPPPPPPPLLLBBBBBDDDDNNK.",
        "..KBBBKKKKKPPPPLLLLBBBBKKKKKNNNK",
        "..KBBBWWWWKKKPLLLLLBBKKKWWWWNNNK",
        "..KBBBWWWWWWKKLLLLBBKKWWWWWWNNNK",
        "KBBBBWWWKKKWLLLLBBBBWKKKWWWNNNNK",
        "KDBBBBWWKKKWLLLBBBBBWKKKWWNNNNNK",
        "KDBBBBBBWWWWBBBBBBBBWWWWDNNNNNNK",
        "KDDBBBBBBBBBBBBBBBBBDDDDNNNNNNNK",
        "KDDDBBBBBBBBBBBBBBBBBDDDNNNNNNNK",
        "KDDDDDBBBBBBKKKKKKKKDDDNNNNNNNNK",
        "KDDDDDDDBBKKKKKKKKKKKKNNNNNNNNNK",
        "KNDDDDDDDKKKKKKKKKKKKKKNNNNNNNNK",
        ".KNNDDDDDDKKKDDDDDDKKKNNNNNNNNK.",
        ".KNNNNNNNNNNNNNNNNNNNNNNNNNNNNK.",
        ".KNNDDDDDDDDDDDDDDDDDDDDDDDDNNK.",
        "..KKNDDDDDDDDDDDDDDDDDDDDDDNKK..",
        "....KKKKKKKKKKKKKKKKKKKKKKKK....",
        "................................"
      ]
    },

    kingSlimeRoar: {
      palette: {
        ".": null, "K": "#08101f", "N": "#12294a", "D": "#1b3a63", "B": "#2f66a8", "L": "#5b9fd8",
        "P": "#8fc7ee", "W": "#dff2ff", "O": "#c99b22", "Y": "#ffd75e", "R": "#5a1030", "T": "#e0607a"
      },
      pixels: [
        "........KK..KK.KK.KK..KK........",
        ".......KYYKKYYKYYKYYKKYOK.......",
        ".......KYYYYYYYYYYYYYYYOK.......",
        ".......KYYYYYYYYYYYYOOOOK.......",
        ".......KYYYYYYYYYYYOOOOOK.......",
        ".......KOOOOOOOOOOOOOOOOK.......",
        "........KKKOOOOOOOOOOKKK........",
        "...........KKKKKKKKKK...........",
        "........KKKLLLLLBBBBBKKK........",
        "......KKPPPPPPLLLBBBBBDDKK......",
        ".....KLPPPPPPLLLLLBBBBBDDDK.....",
        "....KLLPPPPPPPLLLLBBBBBDDDDK....",
        "...KBLLLLLLPPPPLLLBBBBBDDDDNK...",
        "..KBBLLLLLPPPPPLLLBBBBBDDDDNNK..",
        "..KBBLLLPPPPPPPLLLBBBBBDDDDNNK..",
        ".KBBBKKKKKPPPPLLLLBBBBKKKKKNNNK.",
        ".KBBBWWWWKKKPLLLLLBBKKKWWWWNNNK.",
        ".KBBBWWWWWWKKLLLLBBKKWWWWWWNNNK.",
        "KBBBBWWWKKKWLLLLBBBBWKKKWWWNNNNK",
        "KDBBBBWWKKKWLLLBBBBBWKKKWWNNNNNK",
        "KDBBBBBBWWWWBBBBBBBBWWWWDNNNNNNK",
        "KDDBBBBBBBBBBBBBBBBBDDDDNNNNNNNK",
        "KDDDBBBBBBBBBBBBBBBBBDDDNNNNNNNK",
        "KDDDDDBBBBBBKKKKKKKKDDDNNNNNNNNK",
        "KDDDDDDDBBKKWRRRRRRWKKNNNNNNNNNK",
        "KNDDDDDDDKRRRRRRRRRRRRKNNNNNNNNK",
        ".KNNDDDDDDKRRRTTTTRRRKNNNNNNNNK.",
        ".KNNNNNNNNNKRRTTTTRRKNNNNNNNNNK.",
        ".KNNDDDDDDDDKKKKKKKKDDDDDDDDNNK.",
        "..KKNDDDDDDDDDDDDDDDDDDDDDDNKK..",
        "....KKKKKKKKKKKKKKKKKKKKKKKK....",
        "................................"
      ]
    },

    kingSlimeStretch: {
      palette: {
        ".": null, "K": "#08101f", "N": "#12294a", "D": "#1b3a63", "B": "#2f66a8", "L": "#5b9fd8",
        "P": "#8fc7ee", "W": "#dff2ff", "O": "#c99b22", "Y": "#ffd75e", "R": "#5a1030", "T": "#e0607a"
      },
      pixels: [
        "........KK..KK.KK.KK..KK........",
        ".......KYYKKYYKYYKYYKKYOK.......",
        ".......KYYYYYYYYYYYYYYYOK.......",
        ".......KYYYYYYYYYYYYOOOOK.......",
        ".......KYYYYYYYYYYYOOOOOK.......",
        ".......KOOOOOOOOOOOOOOOOK.......",
        "........KKKOOOOOOOOOOKKK........",
        "...........KKKKKKKKKK...........",
        "........KKKLLLLLBBBBBKKK........",
        "......KKPPPPPPLLLBBBBBDDKK......",
        ".....KLPPPPPPLLLLLBBBBBDDDK.....",
        "....KLLPPPPPPPLLLLBBBBBDDDDK....",
        "...KBLLLLLLPPPPLLLBBBBBDDDDNK...",
        "...KBLLLLLPPPPPLLLBBBBBDDDDNK...",
        "...KBLLLPPPPPPPLLLBBBBBDDDDNK...",
        "...KBKKKKKPPPPLLLLBBBBKKKKKNK...",
        "...KBWWWWKKKPLLLLLBBKKKWWWWNK...",
        "...KBWWWWWWKKLLLLBBKKWWWWWWNK...",
        "..KBBWWWKKKWLLLLBBBBWKKKWWWNNK..",
        "..KDBBWWKKKWLLLBBBBBWKKKWWNNNK..",
        "..KDBBBBWWWWBBBBBBBBWWWWDNNNNK..",
        "..KDBBBBBBBBBBBBBBBBDDDDNNNNNK..",
        "..KDBBBBBBBBBBBBBBBBBDDDNNNNNK..",
        "..KDDDBBBBBBKKKKKKKKDDDNNNNNNK..",
        "..KDDDDDBBKKWRRRRRRWKKNNNNNNNK..",
        "..KNDDDDDKRRRRRRRRRRRRKNNNNNNK..",
        "...KDDDDDDKRRRTTTTRRRKNNNNNNK...",
        "...KNNNNNNNKRRTTTTRRKNNNNNNNK...",
        "...KDDDDDDDDKKKKKKKKDDDDDDDDK...",
        "...KNDDDDDDDDDDDDDDDDDDDDDDNK...",
        "....KKKKKKKKKKKKKKKKKKKKKKKK....",
        "................................"
      ]
    },

    kingSlimePop: {
      palette: {
        ".": null, "K": "#08101f", "N": "#12294a", "D": "#1b3a63", "B": "#2f66a8", "L": "#5b9fd8",
        "P": "#8fc7ee", "W": "#dff2ff", "O": "#c99b22", "Y": "#ffd75e", "R": "#5a1030", "T": "#e0607a"
      },
      pixels: [
        "........KK..KK.KK.KK..KK........",
        ".......KYYKKYYKYYKYYKKYOK.......",
        ".......KYYYYYYYYYYYYYYYOK.......",
        ".......KYYYYYYYYYYYYOOOOK.......",
        ".......KYYYYYYYYYYYOOOOOK.......",
        ".......KOOOOOOOOOOOOOOOOK.......",
        "........KKKOOOOOOOOOOKKK........",
        "...........KKKKKKKKKK...........",
        "................................",
        "................................",
        "................................",
        "........KKKLLLLLBBBBBKKK........",
        "......KKPPPPPPLLLBBBBBDDKK......",
        ".....KLPPPPPPLLLLLBBBBBDDDK.....",
        "....KLLPPPPPPPLLLLBBBBBDDDDK....",
        "...KBLLLLLLPPPPLLLBBBBBDDDDNK...",
        "..KBBLLLLLPPPPPLLLBBBBBDDDDNNK..",
        "..KBBLLLPPPPPPPLLLBBBBBDDDDNNK..",
        ".KBBBKKKKKPPPPLLLLBBBBKKKKKNNNK.",
        ".KBBBWWWWKKKPLLLLLBBKKKWWWWNNNK.",
        ".KBBBWWWWWWKKLLLLBBKKWWWWWWNNNK.",
        "KBBBBWWWKKKWLLLLBBBBWKKKWWWNNNNK",
        "KDBBBBWWKKKWLLLBBBBBWKKKWWNNNNNK",
        "KDBBBBBBWWWWBBBBBBBBWWWWDNNNNNNK",
        "KDDDDDBBBBBBKKKKKKKKDDDNNNNNNNNK",
        "KDDDDDDDBBKKKKKKKKKKKKNNNNNNNNNK",
        "KNDDDDDDDKKKKKKKKKKKKKKNNNNNNNNK",
        ".KNNDDDDDDKKKDDDDDDKKKNNNNNNNNK.",
        ".KNNNNNNNNNNNNNNNNNNNNNNNNNNNNK.",
        "..KKNDDDDDDDDDDDDDDDDDDDDDDNKK..",
        "....KKKKKKKKKKKKKKKKKKKKKKKK....",
        "................................"
      ]
    },

    kingSlimeOuch: {
      palette: {
        ".": null, "K": "#08101f", "N": "#12294a", "D": "#1b3a63", "B": "#2f66a8", "L": "#5b9fd8",
        "P": "#8fc7ee", "W": "#dff2ff", "O": "#c99b22", "Y": "#ffd75e", "R": "#5a1030", "T": "#e0607a"
      },
      pixels: [
        "........KK..KK.K................",
        ".......KYYKKYYKYK.KK..KK........",
        ".......KYYYYYYYYYKYYKKYOK.......",
        ".......KYYYYYYYYYYYYYYYOK.......",
        ".......KYYYYYYYYYYYYOOOOK.......",
        ".......KOOOOOOOOYYYOOOOOK.......",
        "........KKKOOOOOOOOOOOOOK.......",
        "...........KKKKKOOOOOKKK........",
        "........KKKLLLLLKKKKKKKK........",
        "......KKPPPPPPLLLBBBBBDDKK......",
        ".....KLPPPPPPLLLLLBBBBBDDDK.....",
        "....KLLPPPPPPPLLLLBBBBBDDDDK....",
        "...KBLLLLLLPPPPLLLBBBBBDDDDNK...",
        "..KBBLLLLLPPPPPLLLBBBBBDDDDNNK..",
        "..KBBLLLPPPPPPPLLLBBBBBDDDDNNK..",
        ".KBBBKKKKKPPPPLLLLBBBBKKKKKNNNK.",
        ".KBBBBBBBKKKPLLLLLBBKKKBNNNNNNK.",
        ".KBBBBBBBLLKKLLLLBBKKBBNNNNNNNK.",
        "KBBBBBBBBLLLLLLLBBBBBBBBNNNNNNNK",
        "KDBBBBBBBLLLLLLBBBBBBBBNNNNNNNNK",
        "KDBBBBBBBBBBBBBBBBBBBBDDDNNNNNNK",
        "KDDBBBBBBBBBBBBBBBBBDDDDNNNNNNNK",
        "KDDDBBBBBBBBBBBBBBBBBDDDNNNNNNNK",
        "KDDDDDBBBBBBKKKKKKKKDDDNNNNNNNNK",
        "KDDDDDDDBBKKKKKKKKKKKKNNNNNNNNNK",
        "KNDDDDDDDKKKKKKKKKKKKKKNNNNNNNNK",
        ".KNNDDDDDDKKKDDDDDDKKKNNNNNNNNK.",
        ".KNNNNNNNNNNNNNNNNNNNNNNNNNNNNK.",
        ".KNNDDDDDDDDDDDDDDDDDDDDDDDDNNK.",
        "..KKNDDDDDDDDDDDDDDDDDDDDDDNKK..",
        "....KKKKKKKKKKKKKKKKKKKKKKKK....",
        "................................"
      ]
    },

    kingSlimeCalm: {
      palette: {
        ".": null, "K": "#08101f", "N": "#12294a", "D": "#1b3a63", "B": "#2f66a8", "L": "#5b9fd8",
        "P": "#8fc7ee", "W": "#dff2ff", "O": "#c99b22", "Y": "#ffd75e", "R": "#5a1030", "T": "#e0607a"
      },
      pixels: [
        "........KK..KK.KK.KK..KK........",
        ".......KYYKKYYKYYKYYKKYOK.......",
        ".......KYYYYYYYYYYYYYYYOK.......",
        ".......KYYYYYYYYYYYYOOOOK.......",
        ".......KYYYYYYYYYYYOOOOOK.......",
        ".......KOOOOOOOOOOOOOOOOK.......",
        "........KKKOOOOOOOOOOKKK........",
        "...........KKKKKKKKKK...........",
        "........KKKLLLLLBBBBBKKK........",
        "......KKPPPPPPLLLBBBBBDDKK......",
        ".....KLPPPPPPLLLLLBBBBBDDDK.....",
        "....KLLPPPPPPPLLLLBBBBBDDDDK....",
        "...KBLLLLLLPPPPLLLBBBBBDDDDNK...",
        "..KBBLLLLLPPPPPLLLBBBBBDDDDNNK..",
        "..KBBLLLPPPPPPPLLLBBBBBDDDDNNK..",
        ".KBBBKKKKKPPPPLLLLBBBBKKKKKNNNK.",
        ".KBBBBBBBKKKPLLLLLBBKKKBNNNNNNK.",
        ".KBBBBBBBLLKKLLLLBBKKBBNNNNNNNK.",
        "KBBBBBBBBLLLLLLLBBBBBBBBNNNNNNNK",
        "KDBBBBBBBLLLLLLBBBBBBBBNNNNNNNNK",
        "KDBBBBBBBBBBBBBBBBBBBBDDDNNNNNNK",
        "KDDBBBBBBBBBBBBBBBBBDDDDNNNNNNNK",
        "KDDDBBBBBBBBBBBBBBBBBDDDNNNNNNNK",
        "KDDDDDBBBBBBKKKKKKKKDDDNNNNNNNNK",
        "KDDDDDDDBBKKKKKKKKKKKKNNNNNNNNNK",
        "KNDDDDDDDKKKKKKKKKKKKKKNNNNNNNNK",
        ".KNNDDDDDDKKKDDDDDDKKKNNNNNNNNK.",
        ".KNNNNNNNNNNNNNNNNNNNNNNNNNNNNK.",
        ".KNNDDDDDDDDDDDDDDDDDDDDDDDDNNK.",
        "..KKNDDDDDDDDDDDDDDDDDDDDDDNKK..",
        "....KKKKKKKKKKKKKKKKKKKKKKKK....",
        "................................"
      ]
    },

    kingSlimeHappy: {
      palette: {
        ".": null, "K": "#08101f", "N": "#12294a", "D": "#1b3a63", "B": "#2f66a8", "L": "#5b9fd8",
        "P": "#8fc7ee", "W": "#dff2ff", "O": "#c99b22", "Y": "#ffd75e", "R": "#5a1030", "T": "#e0607a"
      },
      pixels: [
        "........KK..KK.KK.KK..KK........",
        ".......KYYKKYYKYYKYYKKYOK.......",
        ".......KYYYYYYYYYYYYYYYOK.......",
        ".......KYYYYYYYYYYYYOOOOK.......",
        ".......KYYYYYYYYYYYOOOOOK.......",
        ".......KOOOOOOOOOOOOOOOOK.......",
        "........KKKOOOOOOOOOOKKK........",
        "...........KKKKKKKKKK...........",
        "........KKKLLLLLBBBBBKKK........",
        "......KKPPPPPPLLLBBBBBDDKK......",
        ".....KLPPPPPPLLLLLBBBBBDDDK.....",
        "....KLLPPPPPPPLLLLBBBBBDDDDK....",
        "...KBLLLLLLPPPPLLLBBBBBDDDDNK...",
        "..KBBLLLLLPPPPPLLLBBBBBDDDDNNK..",
        "..KBBLLLPPPPPPPLLLBBBBBDDDDNNK..",
        ".KBBBBBBPPPPPPLLLLBBBBBBBNNNNNK.",
        ".KBBBBKKKKPPPLLLLLBBBBKKKKNNNNK.",
        ".KBBBKKBBKKLLLLLLBBBBKKNNKKNNNK.",
        "KBBBBKBBBLKLLLLLBBBBBKBBNNKNNNNK",
        "KDBBBBBBBLLLLLLBBBBBBBBNNNNNNNNK",
        "KDBBBBBBBBBBBBBBBBBBBBDDDNNNNNNK",
        "KDDBBBBBBBBBBBBBBBBBDDDDNNNNNNNK",
        "KDDDBBBBBBBBBBBBBBBBBDDDNNNNNNNK",
        "KDDDDDBBBBBBKKKKKKKKDDDNNNNNNNNK",
        "KDDDDDDDBBKKKKKKKKKKKKNNNNNNNNNK",
        "KNDDDDDDDKKKKKKKKKKKKKKNNNNNNNNK",
        ".KNNDDDDDDKKKDDDDDDKKKNNNNNNNNK.",
        ".KNNNNNNNNNNNNNNNNNNNNNNNNNNNNK.",
        ".KNNDDDDDDDDDDDDDDDDDDDDDDDDNNK.",
        "..KKNDDDDDDDDDDDDDDDDDDDDDDNKK..",
        "....KKKKKKKKKKKKKKKKKKKKKKKK....",
        "................................"
      ]
    },

    /**
     * α-5で 32×32 に描き直した。
     *
     * ★ ステージ1の6種は「16×16をそのまま2倍に拡大してから塗り直す」方式で作った。
     *   シルエットが1マスも変わらないので、キャラクターが別物にならない。
     *   やっているのは次の3つだけ。
     *     1. 2倍に拡大（形はそのまま）
     *     2. 拡大でできた四角い出っ張りの角を1マス落とす（ギザギザを消す）
     *     3. 内側を明暗6段で塗り直し、元の絵で内側にあった輪郭線は
     *        いちばん暗い段で「面と面のさかい」として戻す
     *   目や苔など、意味のある色はそのまま残す。
     *
     * コウモリは翼を体より一段暗く落としてある。
     * 落とさないと、角を丸めたときに翼と体が溶けて一枚の板に見える。
     */
    batty: {
      palette: {
        ".": null,
        "K": "#12091f",   // 輪郭
        "M": "#2e2158",   // 面と面のさかい・翼の影
        "D": "#4a3a80",   // 影
        "P": "#5a44a0",   // 翼
        "V": "#8b6fd6",   // 体（紫）
        "L": "#a88ce0",   // 光の当たる面
        "W": "#ffe36e"    // 目
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "....KK....................KK....",
        "...KPPK..................KPPK...",
        "..KMPPMK................KMPPMK..",
        "..KMPPPPK....KKKK......KPPPDMK..",
        "..KMPPPPMK..KMMMMK....KMPPPDMK..",
        "..KMPPPPPPKKLLLLLLKKKKPPPPPDMK..",
        "..KMPPPPPPMMLVVVVLMMMMPPPPPDMK..",
        "..KMPPPPPPMMVVVVVVMMMMPPPPPDMK..",
        "..KMPPPPPPMMVVVVVVMMMMPPPPPDMK..",
        "..KMPPPPMMVVWWVVWWVVMMMMPPPDMK..",
        "...KPPDDMMVVWWVVWWVVMMMMDDDDK...",
        "....KMMMMMVVVVVVVVVVMMMMMMMK....",
        ".....KKKMMVVVVVVVVVVMMKKKKK.....",
        "........KMLVVVVVVVVPMK..........",
        "........KMLVVVVVVVVPMK..........",
        "........KMLVVVVVVVVPMK..........",
        ".........KLLVVVVVVPPK...........",
        "..........KMLVVVVPMK............",
        "...........KLLPPPPK.............",
        "............KMMMMK..............",
        ".............KKKK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * コウモリの羽ばたき（RC-1）。batty の体（10〜21列）は1ドットも変えず、翼だけを傾けた。
     *   翼の各列を「体からの距離 × 0.45」行ずらし（先ほど大きく動く）、
     *   ずらしてできた輪郭の切れ目だけを K で埋めてある。
     * battyUp … 翼を振り上げた姿　／　battyDown … 翼を振り下ろした姿
     */
    battyUp: {
      palette: {
        ".": null, "K": "#12091f", "M": "#2e2158", "D": "#4a3a80",
        "P": "#5a44a0", "V": "#8b6fd6", "L": "#a88ce0", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "....K......................K....",
        "..KKPK....................KPKK..",
        "..KMPPK..................KPPMK..",
        "..KMPPMK................KMPDMK..",
        "..KMPPPK................KPPDMK..",
        "..KMPPPPK..............KPPPDMK..",
        "..KMPPPPMK...KKKK.....KMPPPDMK..",
        "..KMPPPPPK..KMMMMK....KPPPPDMK..",
        "..KMPPPPPPKKLLLLLLKKKKPPPPPDMK..",
        "..KMPPPPPPMMLVVVVLMMMMPPPPPDMK..",
        "...KPPPPPPMMVVVVVVMMMMPPPPPDK...",
        "....KPDPMPMMVVVVVVMMMMPMPDDK....",
        "....KMMDMMVVWWVVWWVVMMMMDMMK....",
        ".....KKMMMVVWWVVWWVVMMMMMKK.....",
        ".......KMMVVVVVVVVVVMMMKK.......",
        "........KMVVVVVVVVVVMMK.........",
        "........KMLVVVVVVVVPMK..........",
        "........KMLVVVVVVVVPMK..........",
        "........KMLVVVVVVVVPMK..........",
        ".........KLLVVVVVVPPK...........",
        "..........KMLVVVVPMK............",
        "...........KLLPPPPK.............",
        "............KMMMMK..............",
        ".............KKKK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    battyDown: {
      palette: {
        ".": null, "K": "#12091f", "M": "#2e2158", "D": "#4a3a80",
        "P": "#5a44a0", "V": "#8b6fd6", "L": "#a88ce0", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".....K....................K.....",
        "....KPKK.....KKKK.......KKPK....",
        "...KPPMPKK..KMMMMK....KKPMPPK...",
        "..KMPPPPMPKKLLLLLLKKKKPMPPPPMK..",
        "..KMPPPPPPMMLVVVVLMMMMPPPPPDMK..",
        "..KMPPPPPPMMVVVVVVMMMMPPPPPDMK..",
        "..KMPPPPPPMMVVVVVVMMMMPPPPPDMK..",
        "..KMPPPPPMVVWWVVWWVVMMMPPPPDMK..",
        "..KMPPPPMMVVWWVVWWVVMMMMPPPDMK..",
        "..KMPPPDMMVVVVVVVVVVMMMMDPPDMK..",
        "..KMPPDMMMVVVVVVVVVVMMKMMDDDMK..",
        "..KKPMMKMMLVVVVVVVVPMK.KKMMDKK..",
        "....KKK.KMLVVVVVVVVPMK...KKK....",
        "........KMLVVVVVVVVPMK..........",
        "........KKLLVVVVVVPPK...........",
        "..........KMLVVVVPMK............",
        "...........KLLPPPPK.............",
        "............KMMMMK..............",
        ".............KKKK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * コウモリの眠った姿（RC-1）。batty をそのまま写し、目の上の行だけ体の色にして
     * 細い線の目（閉じた目。色は起きているときと同じ黄色）にした。
     * 天井から逆さに下がって眠る（図鑑の記録どおり）のは、絵ではなく動き（batSleeping）で逆さにしている
     */
    battySleep: {
      palette: {
        ".": null, "K": "#12091f", "M": "#2e2158", "D": "#4a3a80",
        "P": "#5a44a0", "V": "#8b6fd6", "L": "#a88ce0", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "....KK....................KK....",
        "...KPPK..................KPPK...",
        "..KMPPMK................KMPPMK..",
        "..KMPPPPK....KKKK......KPPPDMK..",
        "..KMPPPPMK..KMMMMK....KMPPPDMK..",
        "..KMPPPPPPKKLLLLLLKKKKPPPPPDMK..",
        "..KMPPPPPPMMLVVVVLMMMMPPPPPDMK..",
        "..KMPPPPPPMMVVVVVVMMMMPPPPPDMK..",
        "..KMPPPPPPMMVVVVVVMMMMPPPPPDMK..",
        "..KMPPPPMMVVVVVVVVVVMMMMPPPDMK..",
        "...KPPDDMMVVWWVVWWVVMMMMDDDDK...",
        "....KMMMMMVVVVVVVVVVMMMMMMMK....",
        ".....KKKMMVVVVVVVVVVMMKKKKK.....",
        "........KMLVVVVVVVVPMK..........",
        "........KMLVVVVVVVVPMK..........",
        "........KMLVVVVVVVVPMK..........",
        ".........KLLVVVVVVPPK...........",
        "..........KMLVVVVPMK............",
        "...........KLLPPPPK.............",
        "............KMMMMK..............",
        ".............KKKK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    // --- 苔むす坑道 ---

    // 16×16を2倍に拡大して塗り直した（やり方は batty のコメントを参照）。
    // 背の苔（M）と目（W）はそのまま残してある
    mossRat: {
      palette: {
        ".": null,
        "K": "#1a140d",   // 輪郭
        "N": "#3a3026",   // 面と面のさかい・いちばん深い影
        "D": "#6b5f4a",   // 影・尻尾
        "G": "#9a8b70",   // 体（灰茶）
        "H": "#b5a68a",   // 光の当たる面
        "M": "#6fa84f",   // 背の苔
        "W": "#ffe36e"    // 目
      },
      pixels: [
        "................................",
        "................................",
        ".....KK..................KK.....",
        "....KNNK................KNNK....",
        "...KHHHHK..............KHHHHK...",
        "..KNHGGHNK............KNHGGHNK..",
        "..KNHGGDNK............KNHGGDNK..",
        "...KHHGDNK............KNHGDDK...",
        "....KNHGGGKKKKKKKKKKKKGGGDNK....",
        "....KNHGGGNNNNNNNNNNNNGGGDNK....",
        "...KHHGGMMHHHHHHHHHHHHMMGGDDK...",
        "..KNHGGGMMGGGGGGGGGGGGMMGGGDNK..",
        "..KNHGGGGGMMGGGGGGGGMMGGGGGDNK..",
        "..KNHGGGGGMMGGGGGGGGMMGGGGGDNK..",
        "..KNHGWWWWGGGGGGGGGGGGWWWWGDNK..",
        "..KNHGWWWWGGGGGGGGGGGGWWWWGDNK..",
        "..KNHGWWWWGGGGGGGGGGGGWWWWGDNK..",
        "..KNHGWWWWGGGGGGGGGGGGWWWWGDNK..",
        "..KNHGGGGGGGGGNNNNGGGGGGGGGDNK..",
        "..KNHGGGGGGGGGNNNNGGGGGGGGGDNK..",
        "..KNHGGGGGGGGGGGGGGGGGGGGGGDNK..",
        "...KHHGGGGGGGGGGGGGGGGGGGGDDK...",
        "....KNHGGGGGGGGGGGGGGGGGGDNK....",
        "....KNHGGGGGGGGGGGGGGGGGGDNK....",
        ".KKKNNGGGGGGGGGGGGGGGGGGGDNK....",
        "KDKKNNDDGGGGDDDDGGGGDDDDDDNK....",
        "KK..KNNNDGGDNNNNDGGDNNNNDDNK....",
        ".....KKKDDDDKKKKDDDDKKKKKKK.....",
        "........KNNK....KNNK............",
        ".........KK......KK.............",
        "................................",
        "................................"
      ]
    },

    /**
     * コケネズミの身構え・跳び上がり・眠り（RC-1）。mossRat の行を抜き差ししただけで、
     * 1行の中身（形・色）は1ドットも変えていない。足（28〜29行）の位置もそのまま。
     *   mossRatCrouch  … 模様のない胴の行（20・22行）を2つ抜き、上に空行を足した（背が2ドット低い）
     *   mossRatStretch … 胴の行（20行）を2つ足し、上の空行を抜いた（背が2ドット高い）
     *   mossRatSleep   … 身構えの姿の目を閉じた形（︶）にした。色は起きているときと同じ黄色
     */
    mossRatCrouch: {
      palette: {
        ".": null, "K": "#1a140d", "N": "#3a3026", "D": "#6b5f4a",
        "G": "#9a8b70", "H": "#b5a68a", "M": "#6fa84f", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        ".....KK..................KK.....",
        "....KNNK................KNNK....",
        "...KHHHHK..............KHHHHK...",
        "..KNHGGHNK............KNHGGHNK..",
        "..KNHGGDNK............KNHGGDNK..",
        "...KHHGDNK............KNHGDDK...",
        "....KNHGGGKKKKKKKKKKKKGGGDNK....",
        "....KNHGGGNNNNNNNNNNNNGGGDNK....",
        "...KHHGGMMHHHHHHHHHHHHMMGGDDK...",
        "..KNHGGGMMGGGGGGGGGGGGMMGGGDNK..",
        "..KNHGGGGGMMGGGGGGGGMMGGGGGDNK..",
        "..KNHGGGGGMMGGGGGGGGMMGGGGGDNK..",
        "..KNHGWWWWGGGGGGGGGGGGWWWWGDNK..",
        "..KNHGWWWWGGGGGGGGGGGGWWWWGDNK..",
        "..KNHGWWWWGGGGGGGGGGGGWWWWGDNK..",
        "..KNHGWWWWGGGGGGGGGGGGWWWWGDNK..",
        "..KNHGGGGGGGGGNNNNGGGGGGGGGDNK..",
        "..KNHGGGGGGGGGNNNNGGGGGGGGGDNK..",
        "...KHHGGGGGGGGGGGGGGGGGGGGDDK...",
        "....KNHGGGGGGGGGGGGGGGGGGDNK....",
        ".KKKNNGGGGGGGGGGGGGGGGGGGDNK....",
        "KDKKNNDDGGGGDDDDGGGGDDDDDDNK....",
        "KK..KNNNDGGDNNNNDGGDNNNNDDNK....",
        ".....KKKDDDDKKKKDDDDKKKKKKK.....",
        "........KNNK....KNNK............",
        ".........KK......KK.............",
        "................................",
        "................................"
      ]
    },

    mossRatStretch: {
      palette: {
        ".": null, "K": "#1a140d", "N": "#3a3026", "D": "#6b5f4a",
        "G": "#9a8b70", "H": "#b5a68a", "M": "#6fa84f", "W": "#ffe36e"
      },
      pixels: [
        ".....KK..................KK.....",
        "....KNNK................KNNK....",
        "...KHHHHK..............KHHHHK...",
        "..KNHGGHNK............KNHGGHNK..",
        "..KNHGGDNK............KNHGGDNK..",
        "...KHHGDNK............KNHGDDK...",
        "....KNHGGGKKKKKKKKKKKKGGGDNK....",
        "....KNHGGGNNNNNNNNNNNNGGGDNK....",
        "...KHHGGMMHHHHHHHHHHHHMMGGDDK...",
        "..KNHGGGMMGGGGGGGGGGGGMMGGGDNK..",
        "..KNHGGGGGMMGGGGGGGGMMGGGGGDNK..",
        "..KNHGGGGGMMGGGGGGGGMMGGGGGDNK..",
        "..KNHGWWWWGGGGGGGGGGGGWWWWGDNK..",
        "..KNHGWWWWGGGGGGGGGGGGWWWWGDNK..",
        "..KNHGWWWWGGGGGGGGGGGGWWWWGDNK..",
        "..KNHGWWWWGGGGGGGGGGGGWWWWGDNK..",
        "..KNHGGGGGGGGGNNNNGGGGGGGGGDNK..",
        "..KNHGGGGGGGGGNNNNGGGGGGGGGDNK..",
        "..KNHGGGGGGGGGGGGGGGGGGGGGGDNK..",
        "..KNHGGGGGGGGGGGGGGGGGGGGGGDNK..",
        "..KNHGGGGGGGGGGGGGGGGGGGGGGDNK..",
        "...KHHGGGGGGGGGGGGGGGGGGGGDDK...",
        "....KNHGGGGGGGGGGGGGGGGGGDNK....",
        "....KNHGGGGGGGGGGGGGGGGGGDNK....",
        ".KKKNNGGGGGGGGGGGGGGGGGGGDNK....",
        "KDKKNNDDGGGGDDDDGGGGDDDDDDNK....",
        "KK..KNNNDGGDNNNNDGGDNNNNDDNK....",
        ".....KKKDDDDKKKKDDDDKKKKKKK.....",
        "........KNNK....KNNK............",
        ".........KK......KK.............",
        "................................",
        "................................"
      ]
    },

    mossRatSleep: {
      palette: {
        ".": null, "K": "#1a140d", "N": "#3a3026", "D": "#6b5f4a",
        "G": "#9a8b70", "H": "#b5a68a", "M": "#6fa84f", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        ".....KK..................KK.....",
        "....KNNK................KNNK....",
        "...KHHHHK..............KHHHHK...",
        "..KNHGGHNK............KNHGGHNK..",
        "..KNHGGDNK............KNHGGDNK..",
        "...KHHGDNK............KNHGDDK...",
        "....KNHGGGKKKKKKKKKKKKGGGDNK....",
        "....KNHGGGNNNNNNNNNNNNGGGDNK....",
        "...KHHGGMMHHHHHHHHHHHHMMGGDDK...",
        "..KNHGGGMMGGGGGGGGGGGGMMGGGDNK..",
        "..KNHGGGGGMMGGGGGGGGMMGGGGGDNK..",
        "..KNHGGGGGMMGGGGGGGGMMGGGGGDNK..",
        "..KNHGGGGGGGGGGGGGGGGGGGGGGDNK..",
        "..KNHGGGGGGGGGGGGGGGGGGGGGGDNK..",
        "..KNHGWGGWGGGGGGGGGGGGWGGWGDNK..",
        "..KNHGGWWGGGGGGGGGGGGGGWWGGDNK..",
        "..KNHGGGGGGGGGNNNNGGGGGGGGGDNK..",
        "..KNHGGGGGGGGGNNNNGGGGGGGGGDNK..",
        "...KHHGGGGGGGGGGGGGGGGGGGGDDK...",
        "....KNHGGGGGGGGGGGGGGGGGGDNK....",
        ".KKKNNGGGGGGGGGGGGGGGGGGGDNK....",
        "KDKKNNDDGGGGDDDDGGGGDDDDDDNK....",
        "KK..KNNNDGGDNNNNDGGDNNNNDDNK....",
        ".....KKKDDDDKKKKDDDDKKKKKKK.....",
        "........KNNK....KNNK............",
        ".........KK......KK.............",
        "................................",
        "................................"
      ]
    },

    // 16×16を2倍に拡大して塗り直した（やり方は batty のコメントを参照）。
    // 岩なので、そのあと3×2マスごとの粗いノイズで明暗を1段ずらしてざらつかせている。
    // なめらかな階調のままだとスライムの質感になり、岩に見えない
    rocky: {
      palette: {
        ".": null,
        "K": "#1a1916",   // 輪郭
        "N": "#35342f",   // 面と面のさかい・いちばん深い影
        "D": "#4f4d47",   // ひび・影
        "S": "#7d7a72",   // 岩肌
        "H": "#9b9890",   // 光の当たる面
        "P": "#b8b5ac",   // いちばん明るいふち
        "M": "#6fa84f",   // 苔
        "W": "#ffd75e"    // 目
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        ".........KKKKKKKKKKKKKK.........",
        "........KNNNDDDDDDNNNNNK........",
        ".......KSHHHPPPPPPHHHHHHK.......",
        "......KNSSSSHHHHHHSSSSSHNK......",
        ".....KPPHHMMSSSSSSHHMMHHHHK.....",
        "....KNPHHHMMSSSSSSHHMMHHSHNK....",
        "...KHHSSSSSSDDDSSSDDDSSSDDSHK...",
        "..KNHSSSSSSSDDDSSSDDDSSSDDDHNK..",
        "..KDPHSSWWWWSSSDDDSSWWWWSSSSDK..",
        "..KDPHSSWWWWSSSDDDSSWWWWSSSSDK..",
        "..KNHSSSWWWWSSSHHHDDWWWWSSSDNK..",
        "..KNHSSSWWWWSSSHHHDDWWWWSSSDNK..",
        "..KDPHSSSSSSHHHDDDHHHSSSHHHDNK..",
        "..KDPHSSSSSSHHHDDDHHHSSSHHHDNK..",
        "..KNHSSSSDDDDDDSSSHHHHHHSSSSDK..",
        "..KNHSSSSDDDDDDSSSHHHHHHSSSSDK..",
        "..KNHSDDDDNNNNDDDDDDDDSSDDDSDK..",
        "..KNHSDDDDNNNNDDDDDDDDSSDDDSDK..",
        "..KNHSDDDSSSDDDHHHSSSDDDSSSDNK..",
        "...KHHDDDSSSDDDHHHSSSDDDSSDDK...",
        "....KNHSSHHHSSSDDDSSSSSSSDNK....",
        ".....KHHDSHHSSSDDDSSSSDDDDK.....",
        "......KNNNDSSSSSSSSSSSDDNK......",
        ".......KKKDDDDDDDDDDDSKKK.......",
        "..........KNNNNNNNNNNK..........",
        "...........KKKKKKKKKK...........",
        "................................",
        "................................"
      ]
    },

    /**
     * イワゴローの目だけを変えた姿（RC-1）。岩なので潰れも伸びもしない。形は rocky と1ドットも変えていない。
     *   rockyNarrow … 細目。目（12〜15行）の上2行を岩肌（S）にした。力を溜める・踏ん張る顔
     *   rockySleep  … 閉じた目。目の上3行を岩肌にして、下の1行だけ残した（色は起きているときと同じ黄色）。
     *                 眠り・被弾で目をつぶるときに使う
     */
    rockyNarrow: {
      palette: {
        ".": null, "K": "#1a1916", "N": "#35342f", "D": "#4f4d47", "S": "#7d7a72",
        "H": "#9b9890", "P": "#b8b5ac", "M": "#6fa84f", "W": "#ffd75e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        ".........KKKKKKKKKKKKKK.........",
        "........KNNNDDDDDDNNNNNK........",
        ".......KSHHHPPPPPPHHHHHHK.......",
        "......KNSSSSHHHHHHSSSSSHNK......",
        ".....KPPHHMMSSSSSSHHMMHHHHK.....",
        "....KNPHHHMMSSSSSSHHMMHHSHNK....",
        "...KHHSSSSSSDDDSSSDDDSSSDDSHK...",
        "..KNHSSSSSSSDDDSSSDDDSSSDDDHNK..",
        "..KDPHSSSSSSSSSDDDSSSSSSSSSSDK..",
        "..KDPHSSSSSSSSSDDDSSSSSSSSSSDK..",
        "..KNHSSSWWWWSSSHHHDDWWWWSSSDNK..",
        "..KNHSSSWWWWSSSHHHDDWWWWSSSDNK..",
        "..KDPHSSSSSSHHHDDDHHHSSSHHHDNK..",
        "..KDPHSSSSSSHHHDDDHHHSSSHHHDNK..",
        "..KNHSSSSDDDDDDSSSHHHHHHSSSSDK..",
        "..KNHSSSSDDDDDDSSSHHHHHHSSSSDK..",
        "..KNHSDDDDNNNNDDDDDDDDSSDDDSDK..",
        "..KNHSDDDDNNNNDDDDDDDDSSDDDSDK..",
        "..KNHSDDDSSSDDDHHHSSSDDDSSSDNK..",
        "...KHHDDDSSSDDDHHHSSSDDDSSDDK...",
        "....KNHSSHHHSSSDDDSSSSSSSDNK....",
        ".....KHHDSHHSSSDDDSSSSDDDDK.....",
        "......KNNNDSSSSSSSSSSSDDNK......",
        ".......KKKDDDDDDDDDDDSKKK.......",
        "..........KNNNNNNNNNNK..........",
        "...........KKKKKKKKKK...........",
        "................................",
        "................................"
      ]
    },

    rockySleep: {
      palette: {
        ".": null, "K": "#1a1916", "N": "#35342f", "D": "#4f4d47", "S": "#7d7a72",
        "H": "#9b9890", "P": "#b8b5ac", "M": "#6fa84f", "W": "#ffd75e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        ".........KKKKKKKKKKKKKK.........",
        "........KNNNDDDDDDNNNNNK........",
        ".......KSHHHPPPPPPHHHHHHK.......",
        "......KNSSSSHHHHHHSSSSSHNK......",
        ".....KPPHHMMSSSSSSHHMMHHHHK.....",
        "....KNPHHHMMSSSSSSHHMMHHSHNK....",
        "...KHHSSSSSSDDDSSSDDDSSSDDSHK...",
        "..KNHSSSSSSSDDDSSSDDDSSSDDDHNK..",
        "..KDPHSSSSSSSSSDDDSSSSSSSSSSDK..",
        "..KDPHSSSSSSSSSDDDSSSSSSSSSSDK..",
        "..KNHSSSSSSSSSSHHHDDSSSSSSSDNK..",
        "..KNHSSSWWWWSSSHHHDDWWWWSSSDNK..",
        "..KDPHSSSSSSHHHDDDHHHSSSHHHDNK..",
        "..KDPHSSSSSSHHHDDDHHHSSSHHHDNK..",
        "..KNHSSSSDDDDDDSSSHHHHHHSSSSDK..",
        "..KNHSSSSDDDDDDSSSHHHHHHSSSSDK..",
        "..KNHSDDDDNNNNDDDDDDDDSSDDDSDK..",
        "..KNHSDDDDNNNNDDDDDDDDSSDDDSDK..",
        "..KNHSDDDSSSDDDHHHSSSDDDSSSDNK..",
        "...KHHDDDSSSDDDHHHSSSDDDSSDDK...",
        "....KNHSSHHHSSSDDDSSSSSSSDNK....",
        ".....KHHDSHHSSSDDDSSSSDDDDK.....",
        "......KNNNDSSSSSSSSSSSDDNK......",
        ".......KKKDDDDDDDDDDDSKKK.......",
        "..........KNNNNNNNNNNK..........",
        "...........KKKKKKKKKK...........",
        "................................",
        "................................"
      ]
    },

    // 16×16を2倍に拡大して塗り直した（やり方は batty のコメントを参照）。
    // 翅（L）だけは体の黄色ではなく水色の段に置き換えている。
    // 同じ階調で塗ると、翅が体から生えた光の塊に見えて虫にならない
    glowBug: {
      palette: {
        ".": null,
        "K": "#1a1608",   // 輪郭
        "N": "#6b5a2e",   // 面と面のさかい・胴
        "D": "#c9a83e",   // 影
        "Y": "#ffe36e",   // 光る部分
        "H": "#fff2a8",   // 光の当たる面
        "C": "#7fb0d8",   // 翅の影
        "L": "#bfe4ff",   // 翅
        "I": "#e6f6ff",   // 翅の明るいところ
        "W": "#3a2f10"    // 目
      },
      pixels: [
        "................................",
        "................................",
        ".............KKKKKK.............",
        "............KNNNNNNK............",
        "...........KHHHHHHHHK...........",
        "..........KNHYYYYYYHNK..........",
        ".........KHHWWYYYYWWHHK.........",
        "....KK...KHHWWYYYYWWDHK...KK....",
        "...KIIK...KNHYYYYYYDNK...KIIK...",
        "..KNIINK...KHHYYYYDDK...KNIINK..",
        "..KNILIIK...KNNNNNNK...KIILCNK..",
        "..KNILLINK..KNNNNNNK..KNILLCNK..",
        "..KNILLLIIKKDDDDDDDDKKIILLLCNK..",
        "...KIILLLINNDDDDDDDDNNILLLCCK...",
        "....KNILLLNNDDDDDDDDNNLLLCNK....",
        ".....KIICCNNDDDDDDDDNNCCCCK.....",
        "......KNNNNNDDDDDDDDNNNNNK......",
        ".......KKKKKDDDDDDDDKKKKK.......",
        "............KNDDDNNK............",
        "............KNDDDNNK............",
        "............KNHYYDNK............",
        "............KNHYYDNK............",
        "...........KHHYYYYDDK...........",
        "...........KHHYYYYDDK...........",
        "............KNHYYDNK............",
        ".............KHHDDK.............",
        "..............KNNK..............",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * ヒカリムシの姿（RC-1）。どれも glowBug から作り、形は描き直していない。
     *   glowBugUp / glowBugDown … 翅の上げ・下げ。コウモリと同じ作り方で、体（頭・胴・尾）は1ドットも変えず、
     *     翅の列だけを「体からの距離 × 0.45」行ずらした（輪郭の切れ目だけ K で補修）
     *   glowBugBright … 尾の光る部分（20〜25行）を1段明るい色へ塗り替えた（D→Y、Y→H）。「褒めると明るく光る」
     *   glowBugSleep  … 目の上の行（6行）を頭の色にして目を閉じ、尾の光を1段暗くした（H→Y、Y→D、D→N）。
     *     図鑑の記録「眠っているときは消えかけの火のようだ」
     */
    glowBugUp: {
      palette: {
        ".": null, "K": "#1a1608", "N": "#6b5a2e", "D": "#c9a83e", "Y": "#ffe36e",
        "H": "#fff2a8", "C": "#7fb0d8", "L": "#bfe4ff", "I": "#e6f6ff", "W": "#3a2f10"
      },
      pixels: [
        "................................",
        "................................",
        ".............KKKKKK.............",
        "............KNNNNNNK............",
        "....K......KHHHHHHHHK......K....",
        "..KKIK....KNHYYYYYYHNK....KIKK..",
        "..KNIIK..KHHWWYYYYWWHHK..KIINK..",
        "..KNIINK.KHHWWYYYYWWDHK.KNICNK..",
        "..KNILIK..KNHYYYYYYDNK..KILCNK..",
        "..KNILLIK..KHHYYYYDDK..KILLCNK..",
        "...KILLINK..KNNNNNNK..KNILLCK...",
        "....KILLIK..KNNNNNNK..KILLCK....",
        "....KNILLIKKDDDDDDDDKKILLCNK....",
        ".....KILLINNDDDDDDDDNNILLCK.....",
        "......KICLNNDDDDDDDDNNLCCK......",
        "......KNNCNNDDDDDDDDNNCNNK......",
        ".......KKNNNDDDDDDDDNNNKK.......",
        ".........KKKDDDDDDDDKKK.........",
        "............KNDDDNNK............",
        "............KNDDDNNK............",
        "............KNHYYDNK............",
        "............KNHYYDNK............",
        "...........KHHYYYYDDK...........",
        "...........KHHYYYYDDK...........",
        "............KNHYYDNK............",
        ".............KHHDDK.............",
        "..............KNNK..............",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    glowBugDown: {
      palette: {
        ".": null, "K": "#1a1608", "N": "#6b5a2e", "D": "#c9a83e", "Y": "#ffe36e",
        "H": "#fff2a8", "C": "#7fb0d8", "L": "#bfe4ff", "I": "#e6f6ff", "W": "#3a2f10"
      },
      pixels: [
        "................................",
        "................................",
        ".............KKKKKK.............",
        "............KNNNNNNK............",
        "...........KHHHHHHHHK...........",
        "..........KNHYYYYYYHNK..........",
        ".........KHHWWYYYYWWHHK.........",
        ".........KHHWWYYYYWWDHK.........",
        "..........KNHYYYYYYDNK..........",
        ".....K.....KHHYYYYDDK.....K.....",
        "....KIKK....KNNNNNNK....KKIK....",
        "...KIINIKK..KNNNNNNK..KKINIIK...",
        "..KNILIINIKKDDDDDDDDKKINIILINK..",
        "..KNILLLIINNDDDDDDDDNNIILLLCNK..",
        "..KNILLLLLNNDDDDDDDDNNLLLLLCNK..",
        "..KNIILLLCNNDDDDDDDDNNCLLLCCNK..",
        "..KKINIICNNNDDDDDDDDNNNCCCNCKK..",
        "....KKINNKKKDDDDDDDDKKKNNCKK....",
        "......KKK...KNDDDNNK...KKK......",
        "............KNDDDNNK............",
        "............KNHYYDNK............",
        "............KNHYYDNK............",
        "...........KHHYYYYDDK...........",
        "...........KHHYYYYDDK...........",
        "............KNHYYDNK............",
        ".............KHHDDK.............",
        "..............KNNK..............",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    glowBugBright: {
      palette: {
        ".": null, "K": "#1a1608", "N": "#6b5a2e", "D": "#c9a83e", "Y": "#ffe36e",
        "H": "#fff2a8", "C": "#7fb0d8", "L": "#bfe4ff", "I": "#e6f6ff", "W": "#3a2f10"
      },
      pixels: [
        "................................",
        "................................",
        ".............KKKKKK.............",
        "............KNNNNNNK............",
        "...........KHHHHHHHHK...........",
        "..........KNHYYYYYYHNK..........",
        ".........KHHWWYYYYWWHHK.........",
        "....KK...KHHWWYYYYWWDHK...KK....",
        "...KIIK...KNHYYYYYYDNK...KIIK...",
        "..KNIINK...KHHYYYYDDK...KNIINK..",
        "..KNILIIK...KNNNNNNK...KIILCNK..",
        "..KNILLINK..KNNNNNNK..KNILLCNK..",
        "..KNILLLIIKKDDDDDDDDKKIILLLCNK..",
        "...KIILLLINNDDDDDDDDNNILLLCCK...",
        "....KNILLLNNDDDDDDDDNNLLLCNK....",
        ".....KIICCNNDDDDDDDDNNCCCCK.....",
        "......KNNNNNDDDDDDDDNNNNNK......",
        ".......KKKKKDDDDDDDDKKKKK.......",
        "............KNDDDNNK............",
        "............KNDDDNNK............",
        "............KNHHHYNK............",
        "............KNHHHYNK............",
        "...........KHHHHHHYYK...........",
        "...........KHHHHHHYYK...........",
        "............KNHHHYNK............",
        ".............KHHYYK.............",
        "..............KNNK..............",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    glowBugSleep: {
      palette: {
        ".": null, "K": "#1a1608", "N": "#6b5a2e", "D": "#c9a83e", "Y": "#ffe36e",
        "H": "#fff2a8", "C": "#7fb0d8", "L": "#bfe4ff", "I": "#e6f6ff", "W": "#3a2f10"
      },
      pixels: [
        "................................",
        "................................",
        ".............KKKKKK.............",
        "............KNNNNNNK............",
        "...........KHHHHHHHHK...........",
        "..........KNHYYYYYYHNK..........",
        ".........KHHYYYYYYYYHHK.........",
        "....KK...KHHWWYYYYWWDHK...KK....",
        "...KIIK...KNHYYYYYYDNK...KIIK...",
        "..KNIINK...KHHYYYYDDK...KNIINK..",
        "..KNILIIK...KNNNNNNK...KIILCNK..",
        "..KNILLINK..KNNNNNNK..KNILLCNK..",
        "..KNILLLIIKKDDDDDDDDKKIILLLCNK..",
        "...KIILLLINNDDDDDDDDNNILLLCCK...",
        "....KNILLLNNDDDDDDDDNNLLLCNK....",
        ".....KIICCNNDDDDDDDDNNCCCCK.....",
        "......KNNNNNDDDDDDDDNNNNNK......",
        ".......KKKKKDDDDDDDDKKKKK.......",
        "............KNDDDNNK............",
        "............KNDDDNNK............",
        "............KNYDDNNK............",
        "............KNYDDNNK............",
        "...........KYYDDDDNNK...........",
        "...........KYYDDDDNNK...........",
        "............KNYDDNNK............",
        ".............KYYNNK.............",
        "..............KNNK..............",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    // --- 灼熱の亀裂 ---

    /**
     * α-5で 32×32 に描き直した。
     *
     * ★ 形は 16×16 のときの比率をそのまま倍にしただけ。
     *   翼は縦長の板、外側の2列だけが熱を持つ、体は板のあいだの細い灰色、
     *   くちばしと尾の先だけ燃え差し色。この配置を崩すとハイバネでなくなる。
     *
     *   一度、翼を斜めに広げて三角形にしてみたが、鳥ではなく蛾に見えた。
     *   翼を「上へ立てた板」に保つのが、この子が鳥に見える条件。
     *
     * 元と変えたのは次の2つだけ。
     *   ・右の翼を2行ぶん下げた（羽ばたきの途中に見える。元は左右対称）
     *   ・体から離れたところに灰を数点散らした（「灰をまとって舞う」）
     *
     * 目は1組だけ（コウモリで目が4つに見えた失敗を繰り返さないため）。
     * 飛んでいるので枠の下は空けてある。
     */
    ashWing: {
      palette: {
        ".": null,
        "K": "#1c1613",   // 輪郭
        "N": "#3a322d",   // いちばん深い影
        "D": "#5e5650",   // 影（奥になる右の翼）
        "A": "#9a938d",   // 体（灰）
        "H": "#bdb6ae",   // 光の当たる面・舞う灰
        "P": "#ded8d0",   // いちばん明るいふち
        "E": "#ff9a3c",   // 燃え差し（翼の外縁・くちばし・尾）
        "Y": "#ffd07a",   // 燃え差しの明るいところ
        "W": "#ffe36e"    // 目
      },
      pixels: [
        "....KKKK........................",
        "...KYEHHK.......................",
        "..KYEHHHK....HD.........KKKK....",
        "..KYEAADHK...D.........KAAEYK...",
        "..KYEAADDK............KAAAAEYK..",
        "..KYEAADDK............KAADDEYK..",
        "..KYEAADDK..KKKKKKKK..KAADDEYK..",
        "..KYEAADDK.KHHHHHHHHK.KAADDEYK..",
        "...KYEAAAAKPPPPHHHHHHKDDDDDEYK..",
        "...KYEDAAAKKKHAAAAAKKKDDDDDEYK..",
        "....KYEDDDKWWAAAAAAWWKDDDDEYK...",
        ".....KKEDDKWWAAAAAAWWKDDDDEYK...",
        ".......KKKKDAAAAAAAADKDDDEKK....",
        "...........KHHEEEEDDK.KEYK......",
        "...........KHHAYYADDK.KKK.......",
        "............KHHAADDK............",
        ".....HD.....KNNNNNNK............",
        ".....D......KNNNNNDK............",
        ".............KHHDDK.............",
        ".............KHHDDK......DH.....",
        "..............KKKK........D.....",
        "..............KHHK..............",
        ".........HD...KHHK..............",
        ".........D.....KK...............",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * ハイバネのたたんだ姿・眠り（RC-1）。体（11〜20列）は1ドットも変えていない。
     *   ashWingFold  … 左の翼も2行下げた（両方の翼が低い＝たたむ。図鑑「冷えた場所では、羽をたたんで歩く」）
     *   ashWingSleep … たたんだ姿で目を閉じた（目の上の行を体の色 A に、下の行だけ残す）
     * 羽ばたきのコマは下の ashWingUp 〜 ashWingDown（RC-1 の作り直しで、板の平行移動から、付け根で回す形に変えた）
     */

    ashWingFold: {
      palette: {
        ".": null, "K": "#1c1613", "N": "#3a322d", "D": "#5e5650", "A": "#9a938d",
        "H": "#bdb6ae", "P": "#ded8d0", "E": "#ff9a3c", "Y": "#ffd07a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "....KKKK.....HD.........KKKK....",
        "...KYEHHK....D.........KAAEYK...",
        "..KYEHHHK.............KAAAAEYK..",
        "..KYEAADHK............KAADDEYK..",
        "..KYEAADDK..KKKKKKKK..KAADDEYK..",
        "..KYEAADDK.KHHHHHHHHK.KAADDEYK..",
        "..KYEAADDKKPPPPHHHHHHKDDDDDEYK..",
        "..KYEAADDKKKKHAAAAAKKKDDDDDEYK..",
        "...KYEAAAAKWWAAAAAAWWKDDDDEYK...",
        "...KYEDAAAKWWAAAAAAWWKDDDDEYK...",
        "....KYEDDDKDAAAAAAAADKDDDEKK....",
        ".....KKEDDKKHHEEEEDDK.KEYK......",
        ".......KKK.KHHAYYADDK.KKK.......",
        "............KHHAADDK............",
        ".....HD.....KNNNNNNK............",
        ".....D......KNNNNNDK............",
        ".............KHHDDK.............",
        ".............KHHDDK......DH.....",
        "..............KKKK........D.....",
        "..............KHHK..............",
        ".........HD...KHHK..............",
        ".........D.....KK...............",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    ashWingSleep: {
      palette: {
        ".": null, "K": "#1c1613", "N": "#3a322d", "D": "#5e5650", "A": "#9a938d",
        "H": "#bdb6ae", "P": "#ded8d0", "E": "#ff9a3c", "Y": "#ffd07a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "....KKKK.....HD.........KKKK....",
        "...KYEHHK....D.........KAAEYK...",
        "..KYEHHHK.............KAAAAEYK..",
        "..KYEAADHK............KAADDEYK..",
        "..KYEAADDK..KKKKKKKK..KAADDEYK..",
        "..KYEAADDK.KHHHHHHHHK.KAADDEYK..",
        "..KYEAADDKKPPPPHHHHHHKDDDDDEYK..",
        "..KYEAADDKKKKHAAAAAKKKDDDDDEYK..",
        "...KYEAAAAKAAAAAAAAAAKDDDDEYK...",
        "...KYEDAAAKWWAAAAAAWWKDDDDEYK...",
        "....KYEDDDKDAAAAAAAADKDDDEKK....",
        ".....KKEDDKKHHEEEEDDK.KEYK......",
        ".......KKK.KHHAYYADDK.KKK.......",
        "............KHHAADDK............",
        ".....HD.....KNNNNNNK............",
        ".....D......KNNNNNDK............",
        ".............KHHDDK.............",
        ".............KHHDDK......DH.....",
        "..............KKKK........D.....",
        "..............KHHK..............",
        ".........HD...KHHK..............",
        ".........D.....KK...............",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * ハイバネの羽ばたき（RC-1 の作り直し。作者の指定「羽ばたいてほしい」）。
     * 元の絵（ashWing）の翼を切り出し、付け根（左は10.5行・10.5列、右は10.5行・21.5列）を軸に回した。
     * 左は反時計回り・右は時計回りで、翼の先が外 → 横 → 下へ振り下ろされる。
     * 回した翼を先に描き、輪郭 K を補ってから、灰の点 → 体の順に上から重ねる（翼は体の後ろ）。0度で回すと元の絵と1ドットも変わらない。
     *   ashWingUp   … -8度（少し内へ振り上げた）。上の端で切れる翼の先だけ K でふさいだ
     *   ashWingOut  … 30度・0.95倍
     *   ashWingMid  … 60度・0.86倍
     *   ashWingFlat … 90度・0.82倍（真横）
     *   ashWingDown … 115度・0.82倍（振り下ろしきった）
     * 横へ倒すほど少し縮めているのは、32×32 の枠からはみ出さないため（縮めないと横の端で翼の先が切れる）
     */
    ashWingUp: {
      palette: {
        ".": null, "K": "#1c1613", "N": "#3a322d", "D": "#5e5650", "A": "#9a938d",
        "H": "#bdb6ae", "P": "#ded8d0", "E": "#ff9a3c", "Y": "#ffd07a", "W": "#ffe36e"
      },
      pixels: [
        "....KKKKK.......................",
        "...KYEHHHK..............KKK.....",
        "...KYEAHHK...HD........KKEYK....",
        "...KYEAADHK..D........KAAAEYK...",
        "...KYEAADDK..........KAAADEYK...",
        "...KYEAADDK..........KAADDEYK...",
        "..KYEEAADDK.KKKKKKKK.KAADDEEYK..",
        "...KYEADDK.KHHHHHHHHK.KAADDEYK..",
        "...KYEDAAAKPPPPHHHHHHKDDDDDEYK..",
        "....KYEAAAKKKHAAAAAKKKDDDDEYK...",
        ".....KKDDDKWWAAAAAAWWKDDDDEYK...",
        "......KEDDKWWAAAAAAWWKDDDEKK....",
        ".......KKKKDAAAAAAAADKDDDK......",
        "...........KHHEEEEDDK.KEYK......",
        "...........KHHAYYADDK..KK.......",
        "............KHHAADDK............",
        ".....HD.....KNNNNNNK............",
        ".....D......KNNNNNDK............",
        ".............KHHDDK.............",
        ".............KHHDDK......DH.....",
        "..............KKKK........D.....",
        "..............KHHK..............",
        ".........HD...KHHK..............",
        ".........D.....KK...............",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    ashWingOut: {
      palette: {
        ".": null, "K": "#1c1613", "N": "#3a322d", "D": "#5e5650", "A": "#9a938d",
        "H": "#bdb6ae", "P": "#ded8d0", "E": "#ff9a3c", "Y": "#ffd07a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        ".............HD.................",
        "...K.........D..................",
        ".KKHKK..........................",
        "KYEHHHK..................KKKK...",
        "KEHADDDK....KKKKKKKK....KAAAAKK.",
        "KYEAADDK...KHHHHHHHHK...KAAAAYK.",
        "KYEAAADDKK.PPPPHHHHHHK.KAADDAEK.",
        ".KYEAADAAK.KKHAAAAAKKKKDDADDEYK.",
        ".KYEAAAAAAKWWAAAAAAWWKDDDDDDEYK.",
        "..KYYEDADDDWWAAAAAAWWKDDDDDEYK..",
        "...KKYYEEDKDAAAAAAAADKDDDEEYYK..",
        ".....KKKKK.KHHEEEEDDKEDDDEYKK...",
        "...........KHHAYYADDKKYKKKK.....",
        "............KHHAADDK..K.........",
        ".....HD.....KNNNNNNK............",
        ".....D......KNNNNNDK............",
        ".............KHHDDK.............",
        ".............KHHDDK......DH.....",
        "..............KKKK........D.....",
        "..............KHHK..............",
        ".........HD...KHHK..............",
        ".........D.....KK...............",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    ashWingMid: {
      palette: {
        ".": null, "K": "#1c1613", "N": "#3a322d", "D": "#5e5650", "A": "#9a938d",
        "H": "#bdb6ae", "P": "#ded8d0", "E": "#ff9a3c", "Y": "#ffd07a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        ".............HD.................",
        ".............D..................",
        "................................",
        "................................",
        "............KKKKKKKK............",
        "..K........KHHHHHHHHK...........",
        ".KHKKK.....PPPPHHHHHHK....K.....",
        ".KHHHDKKKK.KKHAAAAAKKKKKKKAKK...",
        "KEHADDDDAAKWWAAAAAAWWKDDAAAAAK..",
        "KEEAAADAADDWWAAAAAAWWKDDDADDAYK.",
        "KYYEEAAAADDDAAAAAAAADKDDDDDEEK..",
        ".KKYYEEEEKKKHHEEEEDDKDDDDDEYYK..",
        "...KKYYYYK.KHHAYYADDKEEEEEYKK...",
        ".....KKKK...KHHAADDKKKKYKYK.....",
        ".....HD.....KNNNNNNK...K.K......",
        ".....D......KNNNNNDK............",
        ".............KHHDDK.............",
        ".............KHHDDK......DH.....",
        "..............KKKK........D.....",
        "..............KHHK..............",
        ".........HD...KHHK..............",
        ".........D.....KK...............",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    ashWingFlat: {
      palette: {
        ".": null, "K": "#1c1613", "N": "#3a322d", "D": "#5e5650", "A": "#9a938d",
        "H": "#bdb6ae", "P": "#ded8d0", "E": "#ff9a3c", "Y": "#ffd07a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        ".............HD.................",
        ".............D..................",
        "................................",
        "................................",
        "............KKKKKKKK............",
        "...........KHHHHHHHHK...........",
        "...........PPPPHHHHHHK..........",
        "...........KKHAAAAAKKK..........",
        "........KKKWWAAAAAAWWKKK........",
        "....KKKKAADWWAAAAAAWWKDDKKK.....",
        "...KHDDDAADDAAAAAAAADKDDAAAK....",
        "..KHAAAAADEKHHEEEEDDKDDDDDAAK...",
        "..KEAAAAEEYKHHAYYADDKEDDDDAEK...",
        "..KYEEEEYYK.KHHAADDKYYEEEEEYK...",
        "...KYYYYKK..KNNNNNNKKKYYYYYK....",
        "....KKKK....KNNNNNDK..KKKKK.....",
        ".............KHHDDK.............",
        ".............KHHDDK......DH.....",
        "..............KKKK........D.....",
        "..............KHHK..............",
        ".........HD...KHHK..............",
        ".........D.....KK...............",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    ashWingDown: {
      palette: {
        ".": null, "K": "#1c1613", "N": "#3a322d", "D": "#5e5650", "A": "#9a938d",
        "H": "#bdb6ae", "P": "#ded8d0", "E": "#ff9a3c", "Y": "#ffd07a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        ".............HD.................",
        ".............D..................",
        "................................",
        "................................",
        "............KKKKKKKK............",
        "...........KHHHHHHHHK...........",
        "...........PPPPHHHHHHK..........",
        "...........KKHAAAAAKKK..........",
        ".........KKWWAAAAAAWWKK.........",
        "........KAAWWAAAAAAWWKDK........",
        ".......KKAADAAAAAAAADKDKK.......",
        ".....KKDDDAKHHEEEEDDKDAAAK......",
        ".....KDDDAAKHHAYYADDKDDAAAK.....",
        "....KHDAAAEYKHHAADDKEEDDAAK.....",
        "....KHHAEEYKKNNNNNNKYYEEAK......",
        "....KEEEYYKKKNNNNNDKKKYYYK......",
        ".....KKYKK...KHHDDK...KKK.......",
        ".......K.....KHHDDK......DH.....",
        "..............KKKK........D.....",
        "..............KHHK..............",
        ".........HD...KHHK..............",
        ".........D.....KK...............",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * 焼けてひび割れた岩。α-5で 32×32 に描き直した。
     *
     * ★ 形は 16×16 のまま。横長の丸い岩・大きく左右に離れた2つの目・橙のひび。
     *   目を中央に寄せると顔が主役になって「岩」に見えなくなるので、
     *   元と同じくらい離してある。
     *
     * ★ 岩肌はわざとざらつかせてある（3×2マスごとの粗いノイズで明暗を1段ずらす）。
     *   なめらかな階調にするとスライムのような質感になり、岩に見えない。
     *
     * ひびは折れ線でたどって、中心を明るい橙（Y）、その両脇を橙（E）、
     * さらに外を黒（K）にしてある。1色だけで引くとただの線に見えるが、
     * 3段にすると「割れた奥から熱が覗いている」ように見える。
     *
     * 目のまわりは1マスぐるりと黒で囲む。ひびと同じ黄系なので、
     * 囲まないと縮めたときにひびと混ざって顔が消える。
     */
    crackRock: {
      palette: {
        ".": null,
        "K": "#150f0d",   // 輪郭・ひびのいちばん外
        "N": "#2a211d",   // いちばん深い影
        "D": "#453833",   // 影
        "S": "#6b5a52",   // 焼けた岩肌
        "H": "#8d7a70",   // 光の当たる面
        "P": "#b0998c",   // いちばん明るいふち
        "E": "#ff7a2a",   // 光るひび
        "Y": "#ffb45e",   // ひびの芯
        "W": "#ffd75e"    // 目
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "...........KKKKKKKKKK...........",
        "........KKKPPPPPKEKPPKKK........",
        "......KKHPPHPPPPPKYKHPPPKK......",
        ".....KPPPKKPHHHHHKEKPPPPPPK.....",
        "....KPPKKKEKSSSSSSKEKPPPHHPK....",
        "...KPHKKEYKKDDDSSSKYKSSSSSSPK...",
        "..KPHHKYKKKSDDDSKKKEKSSSDDSHPK..",
        "..KPKKKKKSSSSSSKKEKYKSSKKKKKPK..",
        ".KPPKWWWKSSSSKKKYKEKKSSKWWWKPPK.",
        ".KPHKWWEKHHHKKEEKKYKDSSKWWEKDHK.",
        ".KPHKKKKKHHKKYKKKHKEKSSKKKKKDNK.",
        ".KPPPHSSSSSKEKKDDDHKEKKSHHHDDNK.",
        ".KPPPHSSSSKKYKHDDDHHKYEKKHHDDNK.",
        ".KPHHSSSSDKEKKDSSSHHHKEEYKSSSDK.",
        "..KPHHSSSKKEKDDSSSHHHKYKKEKSDK..",
        "..KPHHNDDKYKKDDDDDSSKKEKDKYKDK..",
        "...KPHSNNKEKDDDDDDSSKEKKNNKEK...",
        "....KPSSNDKYKDDHHHSSKYKNNNNK....",
        ".....KKSSDKEKNNSSSDDDKKNNKK.....",
        ".......KKPPKKDDNNNDDNNNKK.......",
        ".........KKKHNNNNNNNKKK.........",
        "............KKKKKKKK............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * ヒビイワの姿（RC-1）。形は crackRock と1ドットも変えず、色だけを塗り替えた。
     * 目（13〜14行、左5〜7列・右24〜26列）はひびの色塗り替えから外してある（目の中にも E があるため）。
     *   crackRockNarrow … 細目。目の上の行（13）を K にした。溜め・被弾のとき
     *   crackRockHot    … 細目に加えて、ひびを1段明るく（E→Y、Y→W）。力を込めると、ひびの奥の熱が噴き出す
     *   crackRockSleep  … 目を閉じ（細目と同じく上の行を K、下の行が線になる）、ひびの熱を暗くした（Y→E、E→D）。
     *                     冷えて眠っている。図鑑「ひびの奥は今も熱を持つ」
     */
    crackRockNarrow: {
      palette: {
        ".": null, "K": "#150f0d", "N": "#2a211d", "D": "#453833", "S": "#6b5a52",
        "H": "#8d7a70", "P": "#b0998c", "E": "#ff7a2a", "Y": "#ffb45e", "W": "#ffd75e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "...........KKKKKKKKKK...........",
        "........KKKPPPPPKEKPPKKK........",
        "......KKHPPHPPPPPKYKHPPPKK......",
        ".....KPPPKKPHHHHHKEKPPPPPPK.....",
        "....KPPKKKEKSSSSSSKEKPPPHHPK....",
        "...KPHKKEYKKDDDSSSKYKSSSSSSPK...",
        "..KPHHKYKKKSDDDSKKKEKSSSDDSHPK..",
        "..KPKKKKKSSSSSSKKEKYKSSKKKKKPK..",
        ".KPPKKKKKSSSSKKKYKEKKSSKKKKKPPK.",
        ".KPHKWWEKHHHKKEEKKYKDSSKWWEKDHK.",
        ".KPHKKKKKHHKKYKKKHKEKSSKKKKKDNK.",
        ".KPPPHSSSSSKEKKDDDHKEKKSHHHDDNK.",
        ".KPPPHSSSSKKYKHDDDHHKYEKKHHDDNK.",
        ".KPHHSSSSDKEKKDSSSHHHKEEYKSSSDK.",
        "..KPHHSSSKKEKDDSSSHHHKYKKEKSDK..",
        "..KPHHNDDKYKKDDDDDSSKKEKDKYKDK..",
        "...KPHSNNKEKDDDDDDSSKEKKNNKEK...",
        "....KPSSNDKYKDDHHHSSKYKNNNNK....",
        ".....KKSSDKEKNNSSSDDDKKNNKK.....",
        ".......KKPPKKDDNNNDDNNNKK.......",
        ".........KKKHNNNNNNNKKK.........",
        "............KKKKKKKK............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    crackRockHot: {
      palette: {
        ".": null, "K": "#150f0d", "N": "#2a211d", "D": "#453833", "S": "#6b5a52",
        "H": "#8d7a70", "P": "#b0998c", "E": "#ff7a2a", "Y": "#ffb45e", "W": "#ffd75e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "...........KKKKKKKKKK...........",
        "........KKKPPPPPKYKPPKKK........",
        "......KKHPPHPPPPPKWKHPPPKK......",
        ".....KPPPKKPHHHHHKYKPPPPPPK.....",
        "....KPPKKKYKSSSSSSKYKPPPHHPK....",
        "...KPHKKYWKKDDDSSSKWKSSSSSSPK...",
        "..KPHHKWKKKSDDDSKKKYKSSSDDSHPK..",
        "..KPKKKKKSSSSSSKKYKWKSSKKKKKPK..",
        ".KPPKKKKKSSSSKKKWKYKKSSKKKKKPPK.",
        ".KPHKWWEKHHHKKYYKKWKDSSKWWEKDHK.",
        ".KPHKKKKKHHKKWKKKHKYKSSKKKKKDNK.",
        ".KPPPHSSSSSKYKKDDDHKYKKSHHHDDNK.",
        ".KPPPHSSSSKKWKHDDDHHKWYKKHHDDNK.",
        ".KPHHSSSSDKYKKDSSSHHHKYYWKSSSDK.",
        "..KPHHSSSKKYKDDSSSHHHKWKKYKSDK..",
        "..KPHHNDDKWKKDDDDDSSKKYKDKWKDK..",
        "...KPHSNNKYKDDDDDDSSKYKKNNKYK...",
        "....KPSSNDKWKDDHHHSSKWKNNNNK....",
        ".....KKSSDKYKNNSSSDDDKKNNKK.....",
        ".......KKPPKKDDNNNDDNNNKK.......",
        ".........KKKHNNNNNNNKKK.........",
        "............KKKKKKKK............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    crackRockSleep: {
      palette: {
        ".": null, "K": "#150f0d", "N": "#2a211d", "D": "#453833", "S": "#6b5a52",
        "H": "#8d7a70", "P": "#b0998c", "E": "#ff7a2a", "Y": "#ffb45e", "W": "#ffd75e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "...........KKKKKKKKKK...........",
        "........KKKPPPPPKDKPPKKK........",
        "......KKHPPHPPPPPKEKHPPPKK......",
        ".....KPPPKKPHHHHHKDKPPPPPPK.....",
        "....KPPKKKDKSSSSSSKDKPPPHHPK....",
        "...KPHKKDEKKDDDSSSKEKSSSSSSPK...",
        "..KPHHKEKKKSDDDSKKKDKSSSDDSHPK..",
        "..KPKKKKKSSSSSSKKDKEKSSKKKKKPK..",
        ".KPPKKKKKSSSSKKKEKDKKSSKKKKKPPK.",
        ".KPHKWWEKHHHKKDDKKEKDSSKWWEKDHK.",
        ".KPHKKKKKHHKKEKKKHKDKSSKKKKKDNK.",
        ".KPPPHSSSSSKDKKDDDHKDKKSHHHDDNK.",
        ".KPPPHSSSSKKEKHDDDHHKEDKKHHDDNK.",
        ".KPHHSSSSDKDKKDSSSHHHKDDEKSSSDK.",
        "..KPHHSSSKKDKDDSSSHHHKEKKDKSDK..",
        "..KPHHNDDKEKKDDDDDSSKKDKDKEKDK..",
        "...KPHSNNKDKDDDDDDSSKDKKNNKDK...",
        "....KPSSNDKEKDDHHHSSKEKNNNNK....",
        ".....KKSSDKDKNNSSSDDDKKNNKK.....",
        ".......KKPPKKDDNNNDDNNNKK.......",
        ".........KKKHNNNNNNNKKK.........",
        "............KKKKKKKK............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * マグマの中で暮らすカニ。
     *
     * この絵は制作者が MakeBead で描いた 32×31 のドット絵を、
     * 参考絵/bead-pattern(２).png から1マスずつ機械的に読み取ったもの
     * （方眼1マス=20px、中心の色を拾ってそのまま記号にしている）。
     * 元絵は31行で最後の1行が空だったので、上に2行足して32行に揃え、
     * ハサミが下端に来るようにしてある。
     *
     * 直すときは png ではなくこの配列を直接いじってよい。
     * ただし色は下のパレット9色から選ぶこと（元絵と同じ材料）。
     *
     * 僕が描いた版（ハサミを前に構えた甲羅型）は差し替えで消えている。
     * 脚が左右に4本ずつ生えていること、ハサミが甲羅の下から前へ出ていることが、
     * こちらのほうがはるかにカニに見える理由。
     *
     * ★ ハサミ（行23〜31）だけは後から描き直している。甲羅・脚・目は元絵のまま。
     *   元絵のハサミには次の3つの問題があった。
     *     ・左右が鏡になっていない（形の合わないマスが38個あった）
     *     ・口（開き）が無く、曲がった塊なのでツノか口ヒゲに見えた
     *     ・左のハサミの輪郭が下側で途切れていた
     *   いまは目の中心（列15.5）で鏡にして、上の細い指と下の太い手のあいだに
     *   3マス×2マスの口を空けてある。カニのハサミは上の指のほうが細いので、
     *   上下を同じ太さにすると万力に見える。
     */
    magmaCrab: {
      palette: {
        ".": null,
        "K": "#180b09",   // 輪郭
        "Z": "#111111",   // 差し色の黒
        "D": "#422620",   // 影
        "A": "#5c3a30",   // 殻
        "H": "#7d5245",   // 光の当たる面
        "R": "#ff5000",   // マグマ（濃い）
        "E": "#ff6a1e",   // マグマ
        "Y": "#ff8000",   // マグマ（明るい）
        "W": "#ffe36e"    // 目
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............RW...RW............",
        ".............RW...RW............",
        ".............KD...DK............",
        ".............ZD...DZ............",
        "..........KKKKZKKKZKKKKK........",
        "........KKZZHHHHHHHHHHHKK.......",
        "...KK..KZZHHHHHHHHHHHEHHHK.KKK..",
        "..KKDKKZHHHHHHHHEEHHHHHHHZKKAKK.",
        ".KK.KKKHHHEEAAAAAAAAHHHHHHKK..K.",
        "KK...KKHHAAAAAAAAAAAEEAAAAZK....",
        "..KKDKKAAAAAAAAAAAAAEEAAAAZDKK..",
        "..KKKZZAAAAEEAAAAAAAAAAAKKZKDDK.",
        ".KKD..KYYAAAAAAAEAAAAAAYYK...KD.",
        ".KK...KYYEKAAAAAAAAAAAEYYK.D.KK.",
        ".K..K.KYEEKAAAAAAAAAAAAEYK....KK",
        "...KK.KYEKKKKKKKKKKKKKKEYK..K..K",
        "..KKKKYEEEEEEK....KEEEEEEYK.DK..",
        "..KK.KYEEEK..........KEEEYK..D..",
        "...K.KYEEEK..........KEEEYK.....",
        ".....KYEEEERK......KREEEEYK.....",
        "......KKRRRK........KRRRKK......"
      ]
    },

    /**
     * マグマガニの姿（RC-1）。制作者が MakeBead で描いた絵なので、形は1ドットも変えず、目と色だけを変えた。
     *   magmaCrabHide … 目を引っ込めた（11〜12行の目をまるごと消し、茎の根元だけ残す）。怯える・被弾のとき。
     *                   図鑑「殻の中で様子をうかがっている」
     *   magmaCrabGlow … マグマを1段明るくした（R→E、E→Y、Y→W。目は除く）。ハサミが白熱して光る。
     *                   図鑑「殻を固める前に、必ず一度だけハサミを鳴らす」の、鳴らす瞬間
     *   magmaCrabCool … 目を引っ込め、マグマを暗く冷ました（この絵だけの色 y/e/r を足してある）。
     *                   殻が固まった姿＝眠り・自分にかける技（こうか）
     */
    magmaCrabHide: {
      palette: {
        ".": null, "K": "#180b09", "Z": "#111111", "D": "#422620", "A": "#5c3a30", "H": "#7d5245",
        "R": "#ff5000", "E": "#ff6a1e", "Y": "#ff8000", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............KD...DK............",
        ".............ZD...DZ............",
        "..........KKKKZKKKZKKKKK........",
        "........KKZZHHHHHHHHHHHKK.......",
        "...KK..KZZHHHHHHHHHHHEHHHK.KKK..",
        "..KKDKKZHHHHHHHHEEHHHHHHHZKKAKK.",
        ".KK.KKKHHHEEAAAAAAAAHHHHHHKK..K.",
        "KK...KKHHAAAAAAAAAAAEEAAAAZK....",
        "..KKDKKAAAAAAAAAAAAAEEAAAAZDKK..",
        "..KKKZZAAAAEEAAAAAAAAAAAKKZKDDK.",
        ".KKD..KYYAAAAAAAEAAAAAAYYK...KD.",
        ".KK...KYYEKAAAAAAAAAAAEYYK.D.KK.",
        ".K..K.KYEEKAAAAAAAAAAAAEYK....KK",
        "...KK.KYEKKKKKKKKKKKKKKEYK..K..K",
        "..KKKKYEEEEEEK....KEEEEEEYK.DK..",
        "..KK.KYEEEK..........KEEEYK..D..",
        "...K.KYEEEK..........KEEEYK.....",
        ".....KYEEEERK......KREEEEYK.....",
        "......KKRRRK........KRRRKK......"
      ]
    },

    magmaCrabGlow: {
      palette: {
        ".": null, "K": "#180b09", "Z": "#111111", "D": "#422620", "A": "#5c3a30", "H": "#7d5245",
        "R": "#ff5000", "E": "#ff6a1e", "Y": "#ff8000", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............RW...RW............",
        ".............RW...RW............",
        ".............KD...DK............",
        ".............ZD...DZ............",
        "..........KKKKZKKKZKKKKK........",
        "........KKZZHHHHHHHHHHHKK.......",
        "...KK..KZZHHHHHHHHHHHYHHHK.KKK..",
        "..KKDKKZHHHHHHHHYYHHHHHHHZKKAKK.",
        ".KK.KKKHHHYYAAAAAAAAHHHHHHKK..K.",
        "KK...KKHHAAAAAAAAAAAYYAAAAZK....",
        "..KKDKKAAAAAAAAAAAAAYYAAAAZDKK..",
        "..KKKZZAAAAYYAAAAAAAAAAAKKZKDDK.",
        ".KKD..KWWAAAAAAAYAAAAAAWWK...KD.",
        ".KK...KWWYKAAAAAAAAAAAYWWK.D.KK.",
        ".K..K.KWYYKAAAAAAAAAAAAYWK....KK",
        "...KK.KWYKKKKKKKKKKKKKKYWK..K..K",
        "..KKKKWYYYYYYK....KYYYYYYWK.DK..",
        "..KK.KWYYYK..........KYYYWK..D..",
        "...K.KWYYYK..........KYYYWK.....",
        ".....KWYYYYEK......KEYYYYWK.....",
        "......KKEEEK........KEEEKK......"
      ]
    },

    /**
     * マグマガニの共鳴でハサミを外へ開く姿（RC-1。作者の指定「腕（ハサミ）が外側に開くように」）。
     * magmaCrabGlow（ハサミが白熱した姿）から作った。ハサミの画素（23〜31行の、殻の本体色 A・H 以外）を、
     * 上の付け根（23行）を軸に、下へ行くほど外へずらした（左は左へ・右は右へ。23行で0、31行で最大）。
     * 26行の殻の下の輪郭線（9〜22列）は動かさない。殻・脚・目・上の腕の付け根は変えていない。
     *   magmaCrabOpen1 … 最大2列（半分開いた）
     *   magmaCrabOpen2 … 最大4列（いっぱいに開いた）。5列だと脚（0〜5列）を潰しすぎるので4列まで
     */
    magmaCrabOpen1: {
      palette: {
        ".": null, "K": "#180b09", "Z": "#111111", "D": "#422620", "A": "#5c3a30", "H": "#7d5245",
        "R": "#ff5000", "E": "#ff6a1e", "Y": "#ff8000", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............RW...RW............",
        ".............RW...RW............",
        ".............KD...DK............",
        ".............ZD...DZ............",
        "..........KKKKZKKKZKKKKK........",
        "........KKZZHHHHHHHHHHHKK.......",
        "...KK..KZZHHHHHHHHHHHYHHHK.KKK..",
        "..KKDKKZHHHHHHHHYYHHHHHHHZKKAKK.",
        ".KK.KKKHHHYYAAAAAAAAHHHHHHKK..K.",
        "KK...KKHHAAAAAAAAAAAYYAAAAZK....",
        "..KKDKKAAAAAAAAAAAAAYYAAAAZDKK..",
        "..KKKZZAAAAYYAAAAAAAAAAAKKZKDDK.",
        ".KKD..KWWAAAAAAAYAAAAAAWWK...KD.",
        ".KK...KWWYKAAAAAAAAAAAYWWK.D.KK.",
        ".K..KKWYYK.AAAAAAAAAAAA.YWK...KK",
        "...KKKWY.KKKKKKKKKKKKKK.YWK.K..K",
        "..KKKWYYYYYYK......KYYYYYYWKDK..",
        "..KKKWYYYK............KYYYWK.D..",
        "...KWYYYK..............KYYYWK...",
        "...KWYYYYEK..........KEYYYYWK...",
        "....KKEEEK............KEEEKK...."
      ]
    },

    magmaCrabOpen2: {
      palette: {
        ".": null, "K": "#180b09", "Z": "#111111", "D": "#422620", "A": "#5c3a30", "H": "#7d5245",
        "R": "#ff5000", "E": "#ff6a1e", "Y": "#ff8000", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............RW...RW............",
        ".............RW...RW............",
        ".............KD...DK............",
        ".............ZD...DZ............",
        "..........KKKKZKKKZKKKKK........",
        "........KKZZHHHHHHHHHHHKK.......",
        "...KK..KZZHHHHHHHHHHHYHHHK.KKK..",
        "..KKDKKZHHHHHHHHYYHHHHHHHZKKAKK.",
        ".KK.KKKHHHYYAAAAAAAAHHHHHHKK..K.",
        "KK...KKHHAAAAAAAAAAAYYAAAAZK....",
        "..KKDKKAAAAAAAAAAAAAYYAAAAZDKK..",
        "..KKKZZAAAAYYAAAAAAAAAAAKKZKDDK.",
        ".KKD..KWWAAAAAAAYAAAAAAWWK...KD.",
        ".KK..KWWYK.AAAAAAAAAAA.YWWKD.KK.",
        ".K..KKWYYK.AAAAAAAAAAAA.YWK...KK",
        "...KKWY..KKKKKKKKKKKKKK..YWKK..K",
        "..KKWYYYYYYK........KYYYYYYWKK..",
        "..KWYYYK................KYYYWK..",
        "..KWYYYK................KYYYWK..",
        ".KWYYYYEK..............KEYYYYWK.",
        "..KKEEEK................KEEEKK.."
      ]
    },

    magmaCrabCool: {
      palette: {
        ".": null, "K": "#180b09", "Z": "#111111", "D": "#422620", "A": "#5c3a30", "H": "#7d5245",
        "R": "#ff5000", "E": "#ff6a1e", "Y": "#ff8000", "W": "#ffe36e",
        "y": "#a8421a", "e": "#83301a", "r": "#5e2416"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............KD...DK............",
        ".............ZD...DZ............",
        "..........KKKKZKKKZKKKKK........",
        "........KKZZHHHHHHHHHHHKK.......",
        "...KK..KZZHHHHHHHHHHHeHHHK.KKK..",
        "..KKDKKZHHHHHHHHeeHHHHHHHZKKAKK.",
        ".KK.KKKHHHeeAAAAAAAAHHHHHHKK..K.",
        "KK...KKHHAAAAAAAAAAAeeAAAAZK....",
        "..KKDKKAAAAAAAAAAAAAeeAAAAZDKK..",
        "..KKKZZAAAAeeAAAAAAAAAAAKKZKDDK.",
        ".KKD..KyyAAAAAAAeAAAAAAyyK...KD.",
        ".KK...KyyeKAAAAAAAAAAAeyyK.D.KK.",
        ".K..K.KyeeKAAAAAAAAAAAAeyK....KK",
        "...KK.KyeKKKKKKKKKKKKKKeyK..K..K",
        "..KKKKyeeeeeeK....KeeeeeeyK.DK..",
        "..KK.KyeeeK..........KeeeyK..D..",
        "...K.KyeeeK..........KeeeyK.....",
        ".....KyeeeerK......KreeeeyK.....",
        "......KKrrrK........KrrrKK......"
      ]
    },

    /**
     * マグマガニの動くコマ（RC-1 の作り直し）。脚・ハサミ・目の柄をそれぞれ切り出して動かした。形は描き直していない。
     *   脚   … 左は0〜6列、右は26〜31列の16〜31行（ハサミの色は除く）。左右を逆向きに1段ずらすと、足踏みに見える
     *   ハサミ … 23〜31行の左5〜13列・右18〜26列のオレンジ（Y・E・R・W）と、それに接する輪郭 K
     *   目   … 11〜12行（目玉）だけを横へずらすと、柄の先が傾いてきょろきょろする
     *   LegsA / LegsB … 待機の足踏み。目も左右へ向く
     *   ClawUp … ハサミを白熱させて（Glow の色）3段持ち上げ、殻の前に構えた
     *   Snap   … 持ち上げたハサミを内へ2列寄せて挟んだ。寄せて空いた殻のへりは K でふさいだ
     *   RunA / RunB … ハサミを2段上げたまま、脚を大きく交互に動かす横歩き。ハサミを上げて空いた殻の穴は K でふさいだ
     */
    magmaCrabLegsA: {
      palette: {
        ".": null, "K": "#180b09", "Z": "#111111", "D": "#422620", "A": "#5c3a30", "H": "#7d5245",
        "R": "#ff5000", "E": "#ff6a1e", "Y": "#ff8000", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "............RW...RW.............",
        "............RW...RW.............",
        ".............KD...DK............",
        ".............ZD...DZ............",
        "..........KKKKZKKKZKKKKK........",
        "...KK...KKZZHHHHHHHHHHHKK.......",
        "..KKDK.KZZHHHHHHHHHHHEHHHK......",
        ".KK.KKKZHHHHHHHHEEHHHHHHHZKKKK..",
        "KK...KKHHHEEAAAAAAAAHHHHHHKKAKK.",
        "..KKDKKHHAAAAAAAAAAAEEAAAAZK..K.",
        "..KKK.KAAAAAAAAAAAAAEEAAAAZK....",
        ".KKD.ZZAAAAEEAAAAAAAAAAAKKZDKK..",
        ".KK...KYYAAAAAAAEAAAAAAYYK.KDDK.",
        ".K..K.KYYEKAAAAAAAAAAAEYYK...KD.",
        "...KK.KYEEKAAAAAAAAAAAAEYK.D.KK.",
        "..KKK.KYEKKKKKKKKKKKKKKEYK....KK",
        "..KK.KYEEEEEEK....KEEEEEEYK.K..K",
        "...K.KYEEEK..........KEEEYK.DK..",
        ".....KYEEEK..........KEEEYK..D..",
        ".....KYEEEERK......KREEEEYK.....",
        "......KKRRRK........KRRRKK......"
      ]
    },

    magmaCrabLegsB: {
      palette: {
        ".": null, "K": "#180b09", "Z": "#111111", "D": "#422620", "A": "#5c3a30", "H": "#7d5245",
        "R": "#ff5000", "E": "#ff6a1e", "Y": "#ff8000", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "..............RW...RW...........",
        "..............RW...RW...........",
        ".............KD...DK............",
        ".............ZD...DZ............",
        "..........KKKKZKKKZKKKKK........",
        "........KKZZHHHHHHHHHHHKK..KKK..",
        ".......KZZHHHHHHHHHHHEHHHK.KAKK.",
        "...KK.KZHHHHHHHHEEHHHHHHHZKK..K.",
        "..KKDKKHHHEEAAAAAAAAHHHHHHKK....",
        ".KK.KKKHHAAAAAAAAAAAEEAAAAZDKK..",
        "KK...KKAAAAAAAAAAAAAEEAAAAZKDDK.",
        "..KKDKZAAAAEEAAAAAAAAAAAKKZ..KD.",
        "..KKK.KYYAAAAAAAEAAAAAAYYK.D.KK.",
        ".KKD..KYYEKAAAAAAAAAAAEYYK....KK",
        ".KK...KYEEKAAAAAAAAAAAAEYK..K..K",
        ".K..K.KYEKKKKKKKKKKKKKKEYK..DK..",
        "...KKKYEEEEEEK....KEEEEEEYK..D..",
        "..KKKKYEEEK..........KEEEYK.....",
        "..KK.KYEEEK..........KEEEYK.....",
        "...K.KYEEEERK......KREEEEYK.....",
        "......KKRRRK........KRRRKK......"
      ]
    },

    magmaCrabClawUp: {
      palette: {
        ".": null, "K": "#180b09", "Z": "#111111", "D": "#422620", "A": "#5c3a30", "H": "#7d5245",
        "R": "#ff5000", "E": "#ff6a1e", "Y": "#ff8000", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............RW...RW............",
        ".............RW...RW............",
        ".............KD...DK............",
        ".............ZD...DZ............",
        "..........KKKKZKKKZKKKKK........",
        "........KKZZHHHHHHHHHHHKK.......",
        "...KK..KZZHHHHHHHHHHHYHHHK.KKK..",
        "..KKDKKZHHHHHHHHYYHHHHHHHZKKAKK.",
        ".KK.KKKHHHYYAAAAAAAAHHHHHHKK..K.",
        "KK...KKWWAAAAAAAAAAAYYAWWKZK....",
        "..KKDKKWWYKAAAAAAAAAYYYWWKZDKK..",
        "..KKKZKWYYKYYAAAAAAAAAAYWKZKDDK.",
        ".KKD..KWYKAAAAAAYAAAAAAYWK...KD.",
        ".KK..KWYYYYYYKAAAAKYYYYYYWKD.KK.",
        ".K..KKWYYYKAAAAAAAAAAKYYYWK...KK",
        "...KKKWYYYKKKKKKKKKKKKYYYWK.K..K",
        "..KKKKWYYYYEK......KEYYYYWK.DK..",
        "..KK..KKEEEK........KEEEKK...D..",
        "...K............................",
        "................................",
        "................................"
      ]
    },

    magmaCrabSnap: {
      palette: {
        ".": null, "K": "#180b09", "Z": "#111111", "D": "#422620", "A": "#5c3a30", "H": "#7d5245",
        "R": "#ff5000", "E": "#ff6a1e", "Y": "#ff8000", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............RW...RW............",
        ".............RW...RW............",
        ".............KD...DK............",
        ".............ZD...DZ............",
        "..........KKKKZKKKZKKKKK........",
        "........KKZZHHHHHHHHHHHKK.......",
        "...KK..KZZHHHHHHHHHHHYHHHK.KKK..",
        "..KKDKKZHHHHHHHHYYHHHHHHHZKKAKK.",
        ".KK.KKKHHHYYAAAAAAAAHHHHHHKK..K.",
        "KK...KKHKWWAAAAAAAAAYWWKAAZK....",
        "..KKDKKAKWWYKAAAAAAAYWWKAAZDKK..",
        "..KKKZZAKWYYKAAAAAAAAYWKKKZKDDK.",
        ".KKD...KKWYKAAAAYAAAAYWKK....KD.",
        ".KK....KWYYYYYYKKYYYYYYWK..D.KK.",
        ".K..K..KWYYYKAAAAAAKYYYWK.....KK",
        "...KK..KWYYYKKKKKKKKYYYWK...K..K",
        "..KKK..KWYYYYEK..KEYYYYWK...DK..",
        "..KK....KKEEEK....KEEEKK.....D..",
        "...K............................",
        "................................",
        "................................"
      ]
    },

    magmaCrabRunA: {
      palette: {
        ".": null, "K": "#180b09", "Z": "#111111", "D": "#422620", "A": "#5c3a30", "H": "#7d5245",
        "R": "#ff5000", "E": "#ff6a1e", "Y": "#ff8000", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............RW...RW............",
        ".............RW...RW............",
        ".............KD...DK............",
        ".............ZD...DZ............",
        "...KK.....KKKKZKKKZKKKKK........",
        "..KKDK..KKZZHHHHHHHHHHHKK.......",
        ".KK.KK.KZZHHHHHHHHHHHYHHHK......",
        "KK...KKZHHHHHHHHYYHHHHHHHZKKKK..",
        "..KKDKKHHHYYAAAAAAAAHHHHHHKKAKK.",
        "..KKK.KHHAAAAAAAAAAAYYAAAAZK..K.",
        ".KKD..KWWAAAAAAAAAAAYYAWWKZK....",
        ".KK..ZKWWYKYYAAAAAAAAAYWWKZDKK..",
        ".K..K.KWYYKAAAAAYAAAAAAYWK.KDDK.",
        "...KK.KWYKKAAAAAAAAAAAKYWK...KD.",
        "..KKKKWYYYYYYKAAAAKYYYYYYWKD.KK.",
        "..KK.KWYYYKKKKKKKKKKKKYYYWK...KK",
        "...K.KWYYYKK........KKYYYWK.K..K",
        ".....KWYYYYEK......KEYYYYWK.DK..",
        "......KKEEEK........KEEEKK...D..",
        "................................",
        "................................"
      ]
    },

    magmaCrabRunB: {
      palette: {
        ".": null, "K": "#180b09", "Z": "#111111", "D": "#422620", "A": "#5c3a30", "H": "#7d5245",
        "R": "#ff5000", "E": "#ff6a1e", "Y": "#ff8000", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............RW...RW............",
        ".............RW...RW............",
        ".............KD...DK............",
        ".............ZD...DZ............",
        "..........KKKKZKKKZKKKKK...KKK..",
        "........KKZZHHHHHHHHHHHKK..KAKK.",
        ".......KZZHHHHHHHHHHHYHHHK.K..K.",
        "...KK.KZHHHHHHHHYYHHHHHHHZKK....",
        "..KKDKKHHHYYAAAAAAAAHHHHHHKDKK..",
        ".KK.KKKHHAAAAAAAAAAAYYAAAAZKDDK.",
        "KK...KKWWAAAAAAAAAAAYYAWWKZ..KD.",
        "..KKDKKWWYKYYAAAAAAAAAYWWKZD.KK.",
        "..KKK.KWYYKAAAAAYAAAAAAYWK....KK",
        ".KKD..KWYKKAAAAAAAAAAAKYWK..K..K",
        ".KK..KWYYYYYYKAAAAKYYYYYYWK.DK..",
        ".K..KKWYYYKKKKKKKKKKKKYYYWK..D..",
        "...KKKWYYYKK........KKYYYWK.....",
        "..KKKKWYYYYEK......KEYYYYWK.....",
        "..KK..KKEEEK........KEEEKK......",
        "...K............................",
        "................................"
      ]
    },

    // 燃えさしの炭が起き上がったもの。5種の中でいちばん小さく描いて、
    // 見ただけで「弱いほう」と分かるようにしてある。
    // 炭の色を暗くしすぎると背景に沈んで目と炎だけが浮くので、少し明るめにしている
    /**
     * α-5で 32×32 に描き直した。
     *
     * 「燃えさしの炭」なので、炭の塊を割れた形にして、
     * 割れ目の奥から熾火（E）が覗くようにしてある。ここで炭だと伝わる。
     * 炎は頭の上に1つだけ、左へ傾けて立ちのぼらせる。
     *
     * 枠は埋めていない。5種の中でいちばん弱く、群れで湧く役なので、
     * 並べたときに実際に小さく見えるようにしてある。
     */
    cinderling: {
      palette: {
        ".": null,
        "K": "#0f0a08",   // 輪郭・炭の割れ目
        "N": "#1e1512",   // いちばん深い影
        "D": "#2e211c",   // 影
        "C": "#463430",   // 炭
        "H": "#6b544c",   // 光の当たる面
        "P": "#8f746a",   // いちばん明るいふち
        "E": "#ff6a1e",   // 割れ目の奥の熾火
        "F": "#ff9a3c",   // 炎
        "Y": "#ffe9a8",   // 炎の芯
        "W": "#ffd75e"    // 目
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "...............YY...............",
        "..............YYYY..............",
        ".............YYFEY..............",
        ".............YFFFEY.............",
        ".............FFFFEY.............",
        "..............FFFEE.............",
        "...........KKKCCCCDKK...........",
        ".........KKHHHCCCCCCCKK.........",
        "........KHPPPPPPCCCKCCCK........",
        "........KPPPKPPCCEKKDCCCK.......",
        ".......KHHHHKKECFEKDDDDCK.......",
        ".......KHHKKCKEFCCCKKDDDK.......",
        ".......KHHWWCCKECCCWWDDDK.......",
        ".......KHHWWCCKCCCCWWFDK........",
        "........KHHKCFCCCCCDEDDK........",
        "........KHHKKECCCCCDDDDK........",
        ".........KHHKENNNNNNNNK.........",
        ".........KHHCNNNNNNNNNK.........",
        "..........KHHCDDDDCDDK..........",
        "..........KKKKKKKKKKKK..........",
        "..........KHHK....KCCK..........",
        "..........KHHK....KCCK..........",
        ".........KKKKKK..KKKKK..........",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * スミビの姿（RC-1）。炭の体は変えず、炎と目と色だけを変えた。
     *   cinderlingFlare … 炎を高くした（炎の行を2行足し、上へ伸ばした）。燃え上がる・喜ぶ
     *   cinderlingHot   … 炎と割れ目の熾火を1段明るくし（E→F、F→Y）、目を細めた（15行を体の色に）。攻めるとき
     *   cinderlingSmall … 炎を小さくした（上の3行を消す）＋目を細めた。弱る・被弾のとき（水に弱い）
     *   cinderlingSleep … 炎をさらに小さく（2行だけ）暗くし、目を閉じた（15行を体の色に、16行を暗い黄 w に）。
     *                     図鑑「燃え尽きる前に、次の炭へ火を移して」の、消えかけの熾火。
     *                     暗い色 e／w はこの絵だけのパレットに足した
     * 目を消すときは、目のいちばん近い体のマスの色で埋める（一律の色だと、まわりの光と合わずに浮く）
     */
    cinderlingFlare: {
      palette: {
        ".": null, "K": "#0f0a08", "N": "#1e1512", "D": "#2e211c", "C": "#463430", "H": "#6b544c",
        "P": "#8f746a", "E": "#ff6a1e", "F": "#ff9a3c", "Y": "#ffe9a8", "W": "#ffd75e"
      },
      pixels: [
        "................................",
        "...............YY...............",
        "..............YYYY..............",
        ".............YYFEY..............",
        ".............YYFEY..............",
        ".............YFFFEY.............",
        ".............FFFFEY.............",
        ".............FFFFEY.............",
        "..............FFFEE.............",
        "...........KKKCCCCDKK...........",
        ".........KKHHHCCCCCCCKK.........",
        "........KHPPPPPPCCCKCCCK........",
        "........KPPPKPPCCEKKDCCCK.......",
        ".......KHHHHKKECFEKDDDDCK.......",
        ".......KHHKKCKEFCCCKKDDDK.......",
        ".......KHHWWCCKECCCWWDDDK.......",
        ".......KHHWWCCKCCCCWWFDK........",
        "........KHHKCFCCCCCDEDDK........",
        "........KHHKKECCCCCDDDDK........",
        ".........KHHKENNNNNNNNK.........",
        ".........KHHCNNNNNNNNNK.........",
        "..........KHHCDDDDCDDK..........",
        "..........KKKKKKKKKKKK..........",
        "..........KHHK....KCCK..........",
        "..........KHHK....KCCK..........",
        ".........KKKKKK..KKKKK..........",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    cinderlingHot: {
      palette: {
        ".": null, "K": "#0f0a08", "N": "#1e1512", "D": "#2e211c", "C": "#463430", "H": "#6b544c",
        "P": "#8f746a", "E": "#ff6a1e", "F": "#ff9a3c", "Y": "#ffe9a8", "W": "#ffd75e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "...............YY...............",
        "..............YYYY..............",
        ".............YYYFY..............",
        ".............YYYYFY.............",
        ".............YYYYFY.............",
        "..............YYYFF.............",
        "...........KKKCCCCDKK...........",
        ".........KKHHHCCCCCCCKK.........",
        "........KHPPPPPPCCCKCCCK........",
        "........KPPPKPPCCFKKDCCCK.......",
        ".......KHHHHKKFCYFKDDDDCK.......",
        ".......KHHKKCKFYCCCKKDDDK.......",
        ".......KHHHCCCKFCCCCDDDDK.......",
        ".......KHHWWCCKCCCCWWYDK........",
        "........KHHKCYCCCCCDFDDK........",
        "........KHHKKFCCCCCDDDDK........",
        ".........KHHKFNNNNNNNNK.........",
        ".........KHHCNNNNNNNNNK.........",
        "..........KHHCDDDDCDDK..........",
        "..........KKKKKKKKKKKK..........",
        "..........KHHK....KCCK..........",
        "..........KHHK....KCCK..........",
        ".........KKKKKK..KKKKK..........",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    cinderlingSmall: {
      palette: {
        ".": null, "K": "#0f0a08", "N": "#1e1512", "D": "#2e211c", "C": "#463430", "H": "#6b544c",
        "P": "#8f746a", "E": "#ff6a1e", "F": "#ff9a3c", "Y": "#ffe9a8", "W": "#ffd75e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............YFFFEY.............",
        ".............FFFFEY.............",
        "..............FFFEE.............",
        "...........KKKCCCCDKK...........",
        ".........KKHHHCCCCCCCKK.........",
        "........KHPPPPPPCCCKCCCK........",
        "........KPPPKPPCCEKKDCCCK.......",
        ".......KHHHHKKECFEKDDDDCK.......",
        ".......KHHKKCKEFCCCKKDDDK.......",
        ".......KHHHCCCKECCCCDDDDK.......",
        ".......KHHWWCCKCCCCWWFDK........",
        "........KHHKCFCCCCCDEDDK........",
        "........KHHKKECCCCCDDDDK........",
        ".........KHHKENNNNNNNNK.........",
        ".........KHHCNNNNNNNNNK.........",
        "..........KHHCDDDDCDDK..........",
        "..........KKKKKKKKKKKK..........",
        "..........KHHK....KCCK..........",
        "..........KHHK....KCCK..........",
        ".........KKKKKK..KKKKK..........",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    cinderlingSleep: {
      palette: {
        ".": null, "K": "#0f0a08", "N": "#1e1512", "D": "#2e211c", "C": "#463430", "H": "#6b544c",
        "P": "#8f746a", "E": "#ff6a1e", "F": "#ff9a3c", "Y": "#ffe9a8", "W": "#ffd75e",
        "e": "#a83c14", "w": "#a8853a"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............EEEEeF.............",
        "..............EEEee.............",
        "...........KKKCCCCDKK...........",
        ".........KKHHHCCCCCCCKK.........",
        "........KHPPPPPPCCCKCCCK........",
        "........KPPPKPPCCeKKDCCCK.......",
        ".......KHHHHKKeCEeKDDDDCK.......",
        ".......KHHKKCKeECCCKKDDDK.......",
        ".......KHHHCCCKeCCCCDDDDK.......",
        ".......KHHwwCCKCCCCwwEDK........",
        "........KHHKCECCCCCDeDDK........",
        "........KHHKKeCCCCCDDDDK........",
        ".........KHHKeNNNNNNNNK.........",
        ".........KHHCNNNNNNNNNK.........",
        "..........KHHCDDDDCDDK..........",
        "..........KKKKKKKKKKKK..........",
        "..........KHHK....KCCK..........",
        "..........KHHK....KCCK..........",
        ".........KKKKKK..KKKKK..........",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * 静寂の深層の雑魚。α-5で 32×32 に描き直した。
     *
     * 前は 16×16 の丸い塊に四角い目を2つ並べただけで、
     * ミズダマリ・スライムと並べるとシルエットが同じだった。
     *
     * 「底に溜まった闇がひとりでに形を持った」ものなので、
     * 次の3つで他とぶつからないようにしてある。
     *   ・左へ折れながら立ちのぼる細い煙（ここが体の一部だと分かるよう2〜3px幅）
     *   ・重心を右へ寄せた本体。目は左寄りなので、傾いて見える
     *   ・太さも長さも違う3本に割れて落ちる裾
     *
     * ★ 目は大きな単眼で、上まぶたを重くしてある。
     *   ゲーム中で目が1つなのはこいつだけなので、拠点の36pxでも見分けがつく。
     *   「一体では頼りない」という説明にも合わせている。
     */
    murkling: {
      palette: {
        ".": null,
        "K": "#0e0a18",   // 輪郭
        "D": "#1c1530",   // 影になる右下
        "P": "#3d3060",   // 闇の体
        "L": "#6b57a0",   // 光の当たる左上
        "V": "#8b6fd6",   // ほどけていく紫（闇属性の色）。煙の先と裾の先
        "W": "#e6e0ff"    // 目
      },
      pixels: [
        "................................",
        ".............KKK................",
        "............KVK.................",
        "...........KVK..................",
        "..........KVVK..................",
        "..........KVVVK.................",
        "...........KVVVKK...............",
        "...........KLLLPDKKK............",
        "..........KLLLPPPPDDKK..........",
        ".........KLLLPPPPPPPDDKK........",
        "........KLLLPPPPPPPPPPDDKK......",
        ".......KLLLPPPPPPPPPPPPDDDK.....",
        "......KLLLPPPPPPPPPPPPPPDDDK....",
        ".....KLLLPPKKKPPPPPPPPPPPDDDK...",
        ".....KLLLKKKKKKKPPPPPPPPPDDDK...",
        "....KLLLWWWWWWWWWPPPPPPPPPDDDK..",
        "....KLLWWWWWVWWWWWPPPPPPPPDDDK..",
        "....KLLWWWWVVVWWWWPPPPPPPPDDDK..",
        "....KLLWWWWVVVWWWWPPPPPPPPDDDK..",
        "....KLLLWWWVVVWWWPPPPPPPPDDDK...",
        ".....KLLLWWWVWWWPPPPPPPPPDDDK...",
        ".....KPPPPPPPPPPPPPPPPPPDDDK....",
        "......KPPPPPPPPPPPPPPPPPDDDK....",
        "......KPPPPPPPPPPPPPPPPDDDK.....",
        ".......KPPPPPKPPPPPKPPPDDDK.....",
        ".......KVVVVK.KVVVK.KVVVVVK.....",
        ".......KVVVK...KVVK..KVVVVK.....",
        "........KVVK...KVK...KVVVK......",
        "........KKK.....KK....KVVK......",
        "......................KVVK......",
        ".......................KKK......",
        "................................"
      ]
    },

    /**
     * ヨドミの姿（RC-1）。体の形は変えず、目・煙・色だけを変えた。
     * 目は単眼（15〜20行の W と瞳 V）。目を消すときは、同じ行の、目の外でいちばん近いマスの色で埋める
     * （体の階調は左が L・右が P と横に変わるので、これで目の跡が浮かない）。
     *   murklingNarrow … 目を細めた（15・16・20行を体の色に。17〜19行だけ残る）。溜め・被弾のとき
     *   murklingGlare  … 細目に加えて、瞳を明るい紫 M（この絵だけの色）にした。攻めるとき
     *   murklingGlow   … 煙・裾の先・瞳の紫 V を、明るい紫 M にした。闇が濃く輝く。共鳴・自分にかける技・喜ぶとき
     *   murklingSleep  … 目を閉じ（18行に細い線）、煙を短く（1〜4行を消す）、紫を暗くした（V→v）。
     *                    図鑑「光の届かない場所に、少しずつ闇が溜まって」の、沈んだ闇
     */
    murklingNarrow: {
      palette: {
        ".": null, "K": "#0e0a18", "D": "#1c1530", "P": "#3d3060", "L": "#6b57a0", "V": "#8b6fd6", "W": "#e6e0ff"
      },
      pixels: [
        "................................",
        ".............KKK................",
        "............KVK.................",
        "...........KVK..................",
        "..........KVVK..................",
        "..........KVVVK.................",
        "...........KVVVKK...............",
        "...........KLLLPDKKK............",
        "..........KLLLPPPPDDKK..........",
        ".........KLLLPPPPPPPDDKK........",
        "........KLLLPPPPPPPPPPDDKK......",
        ".......KLLLPPPPPPPPPPPPDDDK.....",
        "......KLLLPPPPPPPPPPPPPPDDDK....",
        ".....KLLLPPKKKPPPPPPPPPPPDDDK...",
        ".....KLLLKKKKKKKPPPPPPPPPDDDK...",
        "....KLLLLLLLLPPPPPPPPPPPPPDDDK..",
        "....KLLLLLLLLPPPPPPPPPPPPPDDDK..",
        "....KLLWWWWVVVWWWWPPPPPPPPDDDK..",
        "....KLLWWWWVVVWWWWPPPPPPPPDDDK..",
        "....KLLLWWWVVVWWWPPPPPPPPDDDK...",
        ".....KLLLLLLLPPPPPPPPPPPPDDDK...",
        ".....KPPPPPPPPPPPPPPPPPPDDDK....",
        "......KPPPPPPPPPPPPPPPPPDDDK....",
        "......KPPPPPPPPPPPPPPPPDDDK.....",
        ".......KPPPPPKPPPPPKPPPDDDK.....",
        ".......KVVVVK.KVVVK.KVVVVVK.....",
        ".......KVVVK...KVVK..KVVVVK.....",
        "........KVVK...KVK...KVVVK......",
        "........KKK.....KK....KVVK......",
        "......................KVVK......",
        ".......................KKK......",
        "................................"
      ]
    },

    murklingGlare: {
      palette: {
        ".": null, "K": "#0e0a18", "D": "#1c1530", "P": "#3d3060", "L": "#6b57a0", "V": "#8b6fd6", "W": "#e6e0ff",
        "M": "#d9c2ff"
      },
      pixels: [
        "................................",
        ".............KKK................",
        "............KVK.................",
        "...........KVK..................",
        "..........KVVK..................",
        "..........KVVVK.................",
        "...........KVVVKK...............",
        "...........KLLLPDKKK............",
        "..........KLLLPPPPDDKK..........",
        ".........KLLLPPPPPPPDDKK........",
        "........KLLLPPPPPPPPPPDDKK......",
        ".......KLLLPPPPPPPPPPPPDDDK.....",
        "......KLLLPPPPPPPPPPPPPPDDDK....",
        ".....KLLLPPKKKPPPPPPPPPPPDDDK...",
        ".....KLLLKKKKKKKPPPPPPPPPDDDK...",
        "....KLLLLLLLLPPPPPPPPPPPPPDDDK..",
        "....KLLLLLLLLPPPPPPPPPPPPPDDDK..",
        "....KLLWWWWMMMWWWWPPPPPPPPDDDK..",
        "....KLLWWWWMMMWWWWPPPPPPPPDDDK..",
        "....KLLLWWWMMMWWWPPPPPPPPDDDK...",
        ".....KLLLLLLLPPPPPPPPPPPPDDDK...",
        ".....KPPPPPPPPPPPPPPPPPPDDDK....",
        "......KPPPPPPPPPPPPPPPPPDDDK....",
        "......KPPPPPPPPPPPPPPPPDDDK.....",
        ".......KPPPPPKPPPPPKPPPDDDK.....",
        ".......KVVVVK.KVVVK.KVVVVVK.....",
        ".......KVVVK...KVVK..KVVVVK.....",
        "........KVVK...KVK...KVVVK......",
        "........KKK.....KK....KVVK......",
        "......................KVVK......",
        ".......................KKK......",
        "................................"
      ]
    },

    murklingGlow: {
      palette: {
        ".": null, "K": "#0e0a18", "D": "#1c1530", "P": "#3d3060", "L": "#6b57a0", "V": "#8b6fd6", "W": "#e6e0ff",
        "M": "#d9c2ff"
      },
      pixels: [
        "................................",
        ".............KKK................",
        "............KMK.................",
        "...........KMK..................",
        "..........KMMK..................",
        "..........KMMMK.................",
        "...........KMMMKK...............",
        "...........KLLLPDKKK............",
        "..........KLLLPPPPDDKK..........",
        ".........KLLLPPPPPPPDDKK........",
        "........KLLLPPPPPPPPPPDDKK......",
        ".......KLLLPPPPPPPPPPPPDDDK.....",
        "......KLLLPPPPPPPPPPPPPPDDDK....",
        ".....KLLLPPKKKPPPPPPPPPPPDDDK...",
        ".....KLLLKKKKKKKPPPPPPPPPDDDK...",
        "....KLLLWWWWWWWWWPPPPPPPPPDDDK..",
        "....KLLWWWWWMWWWWWPPPPPPPPDDDK..",
        "....KLLWWWWMMMWWWWPPPPPPPPDDDK..",
        "....KLLWWWWMMMWWWWPPPPPPPPDDDK..",
        "....KLLLWWWMMMWWWPPPPPPPPDDDK...",
        ".....KLLLWWWMWWWPPPPPPPPPDDDK...",
        ".....KPPPPPPPPPPPPPPPPPPDDDK....",
        "......KPPPPPPPPPPPPPPPPPDDDK....",
        "......KPPPPPPPPPPPPPPPPDDDK.....",
        ".......KPPPPPKPPPPPKPPPDDDK.....",
        ".......KMMMMK.KMMMK.KMMMMMK.....",
        ".......KMMMK...KMMK..KMMMMK.....",
        "........KMMK...KMK...KMMMK......",
        "........KKK.....KK....KMMK......",
        "......................KMMK......",
        ".......................KKK......",
        "................................"
      ]
    },

    murklingSleep: {
      palette: {
        ".": null, "K": "#0e0a18", "D": "#1c1530", "P": "#3d3060", "L": "#6b57a0", "V": "#8b6fd6", "W": "#e6e0ff",
        "v": "#5f4a94"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "..........KvvvK.................",
        "...........KvvvKK...............",
        "...........KLLLPDKKK............",
        "..........KLLLPPPPDDKK..........",
        ".........KLLLPPPPPPPDDKK........",
        "........KLLLPPPPPPPPPPDDKK......",
        ".......KLLLPPPPPPPPPPPPDDDK.....",
        "......KLLLPPPPPPPPPPPPPPDDDK....",
        ".....KLLLPPKKKPPPPPPPPPPPDDDK...",
        ".....KLLLKKKKKKKPPPPPPPPPDDDK...",
        "....KLLLLLLLLPPPPPPPPPPPPPDDDK..",
        "....KLLLLLLLLPPPPPPPPPPPPPDDDK..",
        "....KLLLLLLLLPPPPPPPPPPPPPDDDK..",
        "....KLLLvvvvvvvvvPPPPPPPPPDDDK..",
        "....KLLLLLLLLPPPPPPPPPPPPDDDK...",
        ".....KLLLLLLLPPPPPPPPPPPPDDDK...",
        ".....KPPPPPPPPPPPPPPPPPPDDDK....",
        "......KPPPPPPPPPPPPPPPPPDDDK....",
        "......KPPPPPPPPPPPPPPPPDDDK.....",
        ".......KPPPPPKPPPPPKPPPDDDK.....",
        ".......KvvvvK.KvvvK.KvvvvvK.....",
        ".......KvvvK...KvvK..KvvvvK.....",
        "........KvvK...KvK...KvvvK......",
        "........KKK.....KK....KvvK......",
        "......................KvvK......",
        ".......................KKK......",
        "................................"
      ]
    },

    /**
     * 深層の妨害役。α-5で 32×32 に描き直した。
     *
     * 前は「丸い顔＋点目ふたつ」で、ヨドミと見分けがつかず蔦にも見えなかった。
     *
     * いまは「亜空間の裂け目から垂れ下がる蔦」。
     * 上の裂け目が他のどの種族とも違うシルエットになるので、
     * 色を塗りつぶしても、これがカゲヅタだと分かる。
     *
     * ねらいは「うざいけど憎めない」。
     * 出どころ（裂け目）は不気味に、ぶら下がっている本体は丸くて目を大きく。
     * ちからぬきを何度も撃たれて苛立つ相手だが、見た目で許せる、という手触りにしたい。
     */
    kageZuta: {
      palette: {
        ".": null,
        "K": "#0c1410",   // 輪郭
        "D": "#100a1c",   // 裂け目の奥（ほぼ黒）
        "R": "#8b6fd6",   // 裂け目のふち
        "G": "#1c2e21",   // 影になっている蔦
        "M": "#2a4732",   // 蔦
        "L": "#44704e",   // 光の当たる葉
        "W": "#eaf6ee",   // 目
        "P": "#c88ab0"    // ほお
      },
      pixels: [
        ".......KKKKKKKKKKKKKKKKK........",
        "....KKKRRRRRRRRRRRRRRRRRKKKK....",
        "..KKRRRDDDDDDDDDDDDDDDDDRRRRRKK.",
        "KKRRDDDDDDDDDDDDDDDDDDDDDDDDRRRK",
        "..KKRRRDDDDDDDDDDDDDDDDDRRRRRKK.",
        "....KKKRRRRRRRRRRRRRRRRRKKKK....",
        ".......KKKKKKGMGKKKKKKKKK.......",
        "..............KGMGK.............",
        "..............KGMGK.............",
        ".........KKLLKKGMGK.............",
        "........KLLLLLKGMGK.............",
        ".........KKLLKKGMGK.............",
        "..............KGMGK.............",
        "..............KGMGKKLLKK........",
        "..............KGMGKLLLLLK.......",
        "..............KGMGKKLLKK........",
        "..............KGMGK.............",
        ".............KGMMMGK............",
        "..........KKKGMMMMMGKKK.........",
        ".........KGMMLLLLLLLMMGK........",
        "........KGMLLLLLLLLLLLMGK.......",
        "........KGMLWWLLLLLWWLMGK.......",
        "........KGMLWWLLLLLWWLMGK.......",
        "........KGMLLLLLLLLLLLMGK.......",
        "........KGMLPPLLLLLPPLMGK.......",
        "........KGMLLLLKKLLLLLMGK.......",
        ".........KGMLLLLLLLLLMGK........",
        "..........KGMMLLLLLMMGK.........",
        "...........KKGMMMMMGKK..........",
        ".............KKGMGKK............",
        "..............KKGKK.............",
        "................................"
      ]
    },

    /**
     * カゲヅタの姿（RC-1）。本体（丸い体・蔦・裂け目）の形は変えず、葉・目・色だけを変えた。
     * 葉は2枚（左：9〜11行の左、右：13〜15行の右）。蔦の柄（14〜18列）は動かさず、葉の画素だけを上下に2行ずらした。
     * 目は同じ行の、目の外でいちばん近いマスの色で埋める（目の跡が浮かない）。
     *   kageZutaNarrow … 葉を2行上げ、目を細めた（21行を体の色に）。攻めるとき（葉を振り上げる）
     *   kageZutaGlow   … 葉を2行上げ、裂け目のふち R を明るい紫 T（この絵だけの色）にした。共鳴・自分にかける技・喜ぶとき
     *   kageZutaDroop  … 葉を2行下げ（垂れる）、目を細めた。被弾のとき
     *   kageZutaSleep  … 葉を2行下げ、目を閉じ（21行を埋め、22行に暗い線 w）、裂け目のふちを暗い紫 r にした。
     *                    図鑑「裂け目の奥に根があり、蔦だけをこちらへ伸ばしている」の、しぼんだ蔦
     */
    kageZutaNarrow: {
      palette: {
        ".": null, "K": "#0c1410", "D": "#100a1c", "R": "#8b6fd6", "G": "#1c2e21", "M": "#2a4732",
        "L": "#44704e", "W": "#eaf6ee", "P": "#c88ab0"
      },
      pixels: [
        ".......KKKKKKKKKKKKKKKKK........",
        "....KKKRRRRRRRRRRRRRRRRRKKKK....",
        "..KKRRRDDDDDDDDDDDDDDDDDRRRRRKK.",
        "KKRRDDDDDDDDDDDDDDDDDDDDDDDDRRRK",
        "..KKRRRDDDDDDDDDDDDDDDDDRRRRRKK.",
        "....KKKRRRRRRRRRRRRRRRRRKKKK....",
        ".......KKKKKKGMGKKKKKKKKK.......",
        ".........KKLLKKGMGK.............",
        "........KLLLLLKGMGK.............",
        ".........KKLLKKGMGK.............",
        "..............KGMGK.............",
        "..............KGMGKKLLKK........",
        "..............KGMGKLLLLLK.......",
        "..............KGMGKKLLKK........",
        "..............KGMGK.............",
        "..............KGMGK.............",
        "..............KGMGK.............",
        ".............KGMMMGK............",
        "..........KKKGMMMMMGKKK.........",
        ".........KGMMLLLLLLLMMGK........",
        "........KGMLLLLLLLLLLLMGK.......",
        "........KGMLLLLLLLLLLLMGK.......",
        "........KGMLWWLLLLLWWLMGK.......",
        "........KGMLLLLLLLLLLLMGK.......",
        "........KGMLPPLLLLLPPLMGK.......",
        "........KGMLLLLKKLLLLLMGK.......",
        ".........KGMLLLLLLLLLMGK........",
        "..........KGMMLLLLLMMGK.........",
        "...........KKGMMMMMGKK..........",
        ".............KKGMGKK............",
        "..............KKGKK.............",
        "................................"
      ]
    },

    kageZutaGlow: {
      palette: {
        ".": null, "K": "#0c1410", "D": "#100a1c", "R": "#8b6fd6", "G": "#1c2e21", "M": "#2a4732",
        "L": "#44704e", "W": "#eaf6ee", "P": "#c88ab0", "T": "#d0b8ff"
      },
      pixels: [
        ".......KKKKKKKKKKKKKKKKK........",
        "....KKKTTTTTTTTTTTTTTTTTKKKK....",
        "..KKTTTDDDDDDDDDDDDDDDDDTTTTTKK.",
        "KKTTDDDDDDDDDDDDDDDDDDDDDDDDTTTK",
        "..KKTTTDDDDDDDDDDDDDDDDDTTTTTKK.",
        "....KKKTTTTTTTTTTTTTTTTTKKKK....",
        ".......KKKKKKGMGKKKKKKKKK.......",
        ".........KKLLKKGMGK.............",
        "........KLLLLLKGMGK.............",
        ".........KKLLKKGMGK.............",
        "..............KGMGK.............",
        "..............KGMGKKLLKK........",
        "..............KGMGKLLLLLK.......",
        "..............KGMGKKLLKK........",
        "..............KGMGK.............",
        "..............KGMGK.............",
        "..............KGMGK.............",
        ".............KGMMMGK............",
        "..........KKKGMMMMMGKKK.........",
        ".........KGMMLLLLLLLMMGK........",
        "........KGMLLLLLLLLLLLMGK.......",
        "........KGMLWWLLLLLWWLMGK.......",
        "........KGMLWWLLLLLWWLMGK.......",
        "........KGMLLLLLLLLLLLMGK.......",
        "........KGMLPPLLLLLPPLMGK.......",
        "........KGMLLLLKKLLLLLMGK.......",
        ".........KGMLLLLLLLLLMGK........",
        "..........KGMMLLLLLMMGK.........",
        "...........KKGMMMMMGKK..........",
        ".............KKGMGKK............",
        "..............KKGKK.............",
        "................................"
      ]
    },

    kageZutaDroop: {
      palette: {
        ".": null, "K": "#0c1410", "D": "#100a1c", "R": "#8b6fd6", "G": "#1c2e21", "M": "#2a4732",
        "L": "#44704e", "W": "#eaf6ee", "P": "#c88ab0"
      },
      pixels: [
        ".......KKKKKKKKKKKKKKKKK........",
        "....KKKRRRRRRRRRRRRRRRRRKKKK....",
        "..KKRRRDDDDDDDDDDDDDDDDDRRRRRKK.",
        "KKRRDDDDDDDDDDDDDDDDDDDDDDDDRRRK",
        "..KKRRRDDDDDDDDDDDDDDDDDRRRRRKK.",
        "....KKKRRRRRRRRRRRRRRRRRKKKK....",
        ".......KKKKKKGMGKKKKKKKKK.......",
        "..............KGMGK.............",
        "..............KGMGK.............",
        "..............KGMGK.............",
        "..............KGMGK.............",
        ".........KKLLKKGMGK.............",
        "........KLLLLLKGMGK.............",
        ".........KKLLKKGMGK.............",
        "..............KGMGK.............",
        "..............KGMGKKLLKK........",
        "..............KGMGKLLLLLK.......",
        ".............KGMMMGKLLKK........",
        "..........KKKGMMMMMGKKK.........",
        ".........KGMMLLLLLLLMMGK........",
        "........KGMLLLLLLLLLLLMGK.......",
        "........KGMLLLLLLLLLLLMGK.......",
        "........KGMLWWLLLLLWWLMGK.......",
        "........KGMLLLLLLLLLLLMGK.......",
        "........KGMLPPLLLLLPPLMGK.......",
        "........KGMLLLLKKLLLLLMGK.......",
        ".........KGMLLLLLLLLLMGK........",
        "..........KGMMLLLLLMMGK.........",
        "...........KKGMMMMMGKK..........",
        ".............KKGMGKK............",
        "..............KKGKK.............",
        "................................"
      ]
    },

    kageZutaSleep: {
      palette: {
        ".": null, "K": "#0c1410", "D": "#100a1c", "R": "#8b6fd6", "G": "#1c2e21", "M": "#2a4732",
        "L": "#44704e", "W": "#eaf6ee", "P": "#c88ab0", "r": "#4d3d80", "w": "#a8b8ac"
      },
      pixels: [
        ".......KKKKKKKKKKKKKKKKK........",
        "....KKKrrrrrrrrrrrrrrrrrKKKK....",
        "..KKrrrDDDDDDDDDDDDDDDDDrrrrrKK.",
        "KKrrDDDDDDDDDDDDDDDDDDDDDDDDrrrK",
        "..KKrrrDDDDDDDDDDDDDDDDDrrrrrKK.",
        "....KKKrrrrrrrrrrrrrrrrrKKKK....",
        ".......KKKKKKGMGKKKKKKKKK.......",
        "..............KGMGK.............",
        "..............KGMGK.............",
        "..............KGMGK.............",
        "..............KGMGK.............",
        ".........KKLLKKGMGK.............",
        "........KLLLLLKGMGK.............",
        ".........KKLLKKGMGK.............",
        "..............KGMGK.............",
        "..............KGMGKKLLKK........",
        "..............KGMGKLLLLLK.......",
        ".............KGMMMGKLLKK........",
        "..........KKKGMMMMMGKKK.........",
        ".........KGMMLLLLLLLMMGK........",
        "........KGMLLLLLLLLLLLMGK.......",
        "........KGMLLLLLLLLLLLMGK.......",
        "........KGMLwwLLLLLwwLMGK.......",
        "........KGMLLLLLLLLLLLMGK.......",
        "........KGMLPPLLLLLPPLMGK.......",
        "........KGMLLLLKKLLLLLMGK.......",
        ".........KGMLLLLLLLLLMGK........",
        "..........KGMMLLLLLMMGK.........",
        "...........KKGMMMMMGKK..........",
        ".............KKGMGKK............",
        "..............KKGKK.............",
        "................................"
      ]
    },

    /**
     * 唯一の雷使い。α-5で 32×32 に描き直した。
     *
     * 前は黄色い楕円に四角い目を2つ並べただけで、虫の形になっていなかった。
     * いまは「小さな体に電気をためこんだ虫」を、次の4つで出している。
     *   ・頭→胸→腹の3節。くびれを入れないと、ただの塊に見える
     *   ・左右で高さも角度も違う翅（左は上へ、右は横から下へ）。羽ばたきの途中
     *   ・体から離した3か所の火花。「触れると弾ける」を体の外に出している
     *   ・複眼はあいだを2マス空ける。詰めると白い帯になって顔が潰れる
     *
     * ★ 枠を埋めていない（上7行・下5行が空）。
     *   深層でいちばん素早く、いちばん小さいので、
     *   他と並べたときに実際に小さく・浮いて見えるようにしてある。
     *   絵を大きくすると、この「小ささ」が消える。
     */
    boltBug: {
      palette: {
        ".": null,
        "K": "#150f06",   // 輪郭
        "O": "#c8891a",   // 体の濃いところ・腹の節・脚
        "Y": "#ffd75e",   // 体（雷の色）
        "H": "#fff2b0",   // 体の照り
        "B": "#3f8fa8",   // 翅の濃いところ
        "C": "#7fd9e8",   // 翅
        "W": "#ffffff"    // 複眼と火花
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............K.........W........",
        ".............K....K...W.........",
        "..............K...K....W........",
        "........KKKK.KKKKKK.............",
        "......KKCCBKKWWYYWWK............",
        "....KKCCCCBKKKWYYWKK............",
        "...KCCCCCCBKKWWYYWWK............",
        "...KCCCCCCBK.KHYYOK.............",
        "....KKCCCCBKKHYYYYOKKKKK........",
        "......KKCCBKHYYYYYYOKBCCKKK.....",
        "........KKKKHYYYYYYOKBCCCCCKK...",
        "............KHYYYYOKKBCCCCCKK...",
        ".....W....O..KHYYOK.KBCCKKK.....",
        "......W..O..KHYYYYOKKKKK........",
        ".....W...OO.KOOOOOOK.OO.........",
        ".........O..KHYYYYOK..O.........",
        ".............KOOOOK...W.........",
        ".............KHYYOK..W..........",
        "..............KOOK....W.........",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * ビリムシの姿（RC-1）。頭・胸・腹の体（12〜19列）の形は変えず、翅・火花・色・目だけを変えた。
     *   boltBugUp   … 翅を振り上げた（翅の列を、体からの距離 × 0.45 行ずつ上へずらした）
     *   boltBugDown … 翅を振り下ろした（同じく × 0.3 行ずつ下へ）。ずらしたあとの輪郭の切れ目は K で補修した
     *   boltBugCharge … 帯電した（体を1段明るく Y→H・O→Y にし、火花 W を8点足した）。
     *                   図鑑「触れると弾けるのは、驚いたときだけ」。攻めるとき・被弾（驚いて弾ける）・喜ぶとき
     *   boltBugSleep  … 翅を下げ、火花を消し、体を暗く（Y→O、H→Y、O→o。この絵だけの暗い色 o）して、目を閉じた
     *                   （目の上下の行を体の色で埋め、真ん中の行に暗い線 w）
     * ふだんは [Up, 元, Down, 元] の4コマで、ごく速く羽ばたく（boltFlit）
     */
    boltBugUp: {
      palette: {
        ".": null, "K": "#150f06", "O": "#c8891a", "Y": "#ffd75e", "H": "#fff2b0", "B": "#3f8fa8",
        "C": "#7fd9e8", "W": "#ffffff"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............K.........W........",
        ".............K....K...W.........",
        "...KKKKKKK....K...K....W........",
        "...KCCCCCCKK.KKKKKK.............",
        "...KCCCCCCBKKWWYYWWK............",
        "....KKCCCCBKKKWYYWKK............",
        ".....KCCCCBKKWWYYWWK......K.....",
        "......KKCCBK.KHYYOK...KKKKCKK...",
        ".......KCCBKKHYYYYOKKKCCCCCK....",
        "........KKBKHYYYYYYOKBCCCCK.....",
        "..........KKHYYYYYYOKBCCKK......",
        "............KHYYYYOKKBCCK.......",
        ".....W....O..KHYYOK.KBKK........",
        "......W..O..KHYYYYOKKKKK........",
        ".....W...OO.KOOOOOOK.OO.........",
        ".........O..KHYYYYOK..O.........",
        ".............KOOOOK...W.........",
        ".............KHYYOK..W..........",
        "..............KOOK....W.........",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    boltBugDown: {
      palette: {
        ".": null, "K": "#150f06", "O": "#c8891a", "Y": "#ffd75e", "H": "#fff2b0", "B": "#3f8fa8",
        "C": "#7fd9e8", "W": "#ffffff"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............K.........W........",
        ".............K....K...W.........",
        "..............K...K....W........",
        "..........KK.KKKKKK.............",
        "........KKBKKWWYYWWK............",
        ".......KCCBKKKWYYWKK............",
        "......KCCCBKKWWYYWWK............",
        "....KKCCCCBK.KHYYOK.............",
        "...KCCCCCCBKKHYYYYOKKK..........",
        "...KCCCCCCBKHYYYYYYOKBKK........",
        "....KKCCCCKKHYYYYYYOKBCCK.......",
        "......KKKK..KHYYYYOKKBCCCKK.....",
        ".....W....O..KHYYOK.KBCCCCCKK...",
        "......W..O..KHYYYYOKKKCCKCCKK...",
        ".....W...OO.KOOOOOOK.OOK.KK.....",
        ".........O..KHYYYYOK..O.........",
        ".............KOOOOK...W.........",
        ".............KHYYOK..W..........",
        "..............KOOK....W.........",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    boltBugCharge: {
      palette: {
        ".": null, "K": "#150f06", "O": "#c8891a", "Y": "#ffd75e", "H": "#fff2b0", "B": "#3f8fa8",
        "C": "#7fd9e8", "W": "#ffffff"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "..............W.................",
        ".................W..............",
        ".........W...K.........W........",
        ".........W...K....K...W.........",
        "........W.....K...K....W........",
        "........KKKK.KKKKKK.............",
        "......KKCCBKKWWHHWWK............",
        "....KKCCCCBKKKWHHWKK............",
        "...KCCCCCCBKKWWHHWWK............",
        "...KCCCCCCBK.KHHHYK.............",
        "....KKCCCCBKKHHHHHYKKKKK........",
        "......KKCCBKHHHHHHHYKBCCKKK.....",
        "........KKKKHHHHHHHYKBCCCCCKK...",
        "............KHHHHHYKKBCCCCCKK...",
        ".....W....O..KHHHYK.KBCCKKK.....",
        "......W..O..KHHHHHYKKKKK.W......",
        ".....W...OO.KYYYYYYK.OO...W.....",
        ".........O..KHHHHHYK..O.........",
        ".............KYYYYK...W.........",
        ".............KHYYOK..W..........",
        "..............KOOK....W.........",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    boltBugSleep: {
      palette: {
        ".": null, "K": "#150f06", "O": "#c8891a", "Y": "#ffd75e", "H": "#fff2b0", "B": "#3f8fa8",
        "C": "#7fd9e8", "W": "#ffffff", "o": "#8a5c10", "w": "#b0a880"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............K..................",
        ".............K....K.............",
        "..............K...K.............",
        "..........KK.KKKKKK.............",
        "........KKBKKKOOOOKK............",
        ".......KCCBKKKwOOwKK............",
        "......KCCCBKKKOOOOKK............",
        "....KKCCCCBK.KYOOoK.............",
        "...KCCCCCCBKKYOOOOoKKK..........",
        "...KCCCCCCBKYOOOOOOoKBKK........",
        "....KKCCCCKKYOOOOOOoKBCCK.......",
        "......KKKK..KYOOOOoKKBCCCKK.....",
        "..........O..KYOOoK.KBCCCCCKK...",
        ".........O..KYOOOOoKKKCCKCCKK...",
        ".........OO.KooooooK.OOK.KK.....",
        ".........O..KYOOOOoK..O.........",
        ".............KooooK.............",
        ".............KYOOoK.............",
        "..............KOOK..............",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * ビリムシの動くコマ（RC-1 の作り直し）。翅・触角・腹の針・脚・火花を動かした。形は描き直していない。
     *   火花 … まわりの白い火花（W）3か所を、それぞれ左右に裏返す。元の絵と交互に出すと、ぱちぱち弾けて見える
     *   触角 … 左の先（7行13列）を1列外へ、右の先（8行18列）を1列外へ。元と交互でぴくっと動く
     *   BaseB / UpB / DownB … 元・Up・Down の火花を裏返し、触角を動かしたもの（UpB・BaseB）。待機で元の3枚と交互に出す
     *   Sting     … Up の翅のまま、腹（21〜26行）の縞を2行足して伸ばし、先に白い針（W）を出した。脚は体へ1列たたむ
     *   StingDown … 同じ腹で翅を下げたもの。Sting と交互に出すと、針を突き出したまま羽ばたく
     */
    boltBugBaseB: {
      palette: {
        ".": null, "K": "#150f06", "O": "#c8891a", "Y": "#ffd75e", "H": "#fff2b0",
        "B": "#3f8fa8", "C": "#7fd9e8", "W": "#ffffff"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "............K..........W........",
        ".............K.....K....W.......",
        "..............K...K....W........",
        "........KKKK.KKKKKK.............",
        "......KKCCBKKWWYYWWK............",
        "....KKCCCCBKKKWYYWKK............",
        "...KCCCCCCBKKWWYYWWK............",
        "...KCCCCCCBK.KHYYOK.............",
        "....KKCCCCBKKHYYYYOKKKKK........",
        "......KKCCBKHYYYYYYOKBCCKKK.....",
        "........KKKKHYYYYYYOKBCCCCCKK...",
        "............KHYYYYOKKBCCCCCKK...",
        "......W...O..KHYYOK.KBCCKKK.....",
        ".....W...O..KHYYYYOKKKKK........",
        "......W..OO.KOOOOOOK.OO.........",
        ".........O..KHYYYYOK..O.........",
        ".............KOOOOK..W..........",
        ".............KHYYOK...W.........",
        "..............KOOK...W..........",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    boltBugUpB: {
      palette: {
        ".": null, "K": "#150f06", "O": "#c8891a", "Y": "#ffd75e", "H": "#fff2b0",
        "B": "#3f8fa8", "C": "#7fd9e8", "W": "#ffffff"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "............K..........W........",
        ".............K.....K....W.......",
        "...KKKKKKK....K...K....W........",
        "...KCCCCCCKK.KKKKKK.............",
        "...KCCCCCCBKKWWYYWWK............",
        "....KKCCCCBKKKWYYWKK............",
        ".....KCCCCBKKWWYYWWK......K.....",
        "......KKCCBK.KHYYOK...KKKKCKK...",
        ".......KCCBKKHYYYYOKKKCCCCCK....",
        "........KKBKHYYYYYYOKBCCCCK.....",
        "..........KKHYYYYYYOKBCCKK......",
        "............KHYYYYOKKBCCK.......",
        "......W...O..KHYYOK.KBKK........",
        ".....W...O..KHYYYYOKKKKK........",
        "......W..OO.KOOOOOOK.OO.........",
        ".........O..KHYYYYOK..O.........",
        ".............KOOOOK..W..........",
        ".............KHYYOK...W.........",
        "..............KOOK...W..........",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    boltBugDownB: {
      palette: {
        ".": null, "K": "#150f06", "O": "#c8891a", "Y": "#ffd75e", "H": "#fff2b0",
        "B": "#3f8fa8", "C": "#7fd9e8", "W": "#ffffff"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............K.........W........",
        ".............K....K.....W.......",
        "..............K...K....W........",
        "..........KK.KKKKKK.............",
        "........KKBKKWWYYWWK............",
        ".......KCCBKKKWYYWKK............",
        "......KCCCBKKWWYYWWK............",
        "....KKCCCCBK.KHYYOK.............",
        "...KCCCCCCBKKHYYYYOKKK..........",
        "...KCCCCCCBKHYYYYYYOKBKK........",
        "....KKCCCCKKHYYYYYYOKBCCK.......",
        "......KKKK..KHYYYYOKKBCCCKK.....",
        "......W...O..KHYYOK.KBCCCCCKK...",
        ".....W...O..KHYYYYOKKKCCKCCKK...",
        "......W..OO.KOOOOOOK.OOK.KK.....",
        ".........O..KHYYYYOK..O.........",
        ".............KOOOOK..W..........",
        ".............KHYYOK...W.........",
        "..............KOOK...W..........",
        "...............KK...............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    boltBugSting: {
      palette: {
        ".": null, "K": "#150f06", "O": "#c8891a", "Y": "#ffd75e", "H": "#fff2b0",
        "B": "#3f8fa8", "C": "#7fd9e8", "W": "#ffffff"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............K.........W........",
        ".............K....K.....W.......",
        "...KKKKKKK....K...K....W........",
        "...KCCCCCCKK.KKKKKK.............",
        "...KCCCCCCBKKWWYYWWK............",
        "....KKCCCCBKKKWYYWKK............",
        ".....KCCCCBKKWWYYWWK......K.....",
        "......KKCCBK.KHYYOK...KKKKCKK...",
        ".......KCCBKKHYYYYOKKKCCCCCK....",
        "........KKBKHYYYYYYOKBCCCCK.....",
        "..........KKHYYYYYYOKBCCKK......",
        "............KHYYYYOKKBCCK.......",
        "......W....O.KHYYOK.KBKK........",
        ".....W....O.KHYYYYOKKKKK........",
        "......W...OOKOOOOOOKOO..........",
        "..........O.KHYYYYOK.O..........",
        "............KOOOOOOK.W..........",
        "............KHYYYYOK..W.........",
        ".............KOOOOK..W..........",
        ".............KHYYOK.............",
        "..............KOOK..............",
        "...............KK...............",
        "...............WW...............",
        "...............W................",
        "................................"
      ]
    },

    boltBugStingDown: {
      palette: {
        ".": null, "K": "#150f06", "O": "#c8891a", "Y": "#ffd75e", "H": "#fff2b0",
        "B": "#3f8fa8", "C": "#7fd9e8", "W": "#ffffff"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".............K.........W........",
        ".............K....K...W.........",
        "..............K...K....W........",
        "..........KK.KKKKKK.............",
        "........KKBKKWWYYWWK............",
        ".......KCCBKKKWYYWKK............",
        "......KCCCBKKWWYYWWK............",
        "....KKCCCCBK.KHYYOK.............",
        "...KCCCCCCBKKHYYYYOKKK..........",
        "...KCCCCCCBKHYYYYYYOKBKK........",
        "....KKCCCCKKHYYYYYYOKBCCK.......",
        "......KKKK..KHYYYYOKKBCCCKK.....",
        ".....W.....O.KHYYOK.KBCCCCCKK...",
        "......W...O.KHYYYYOKKKCCKCCKK...",
        ".....W....OOKOOOOOOKOO.K.KK.....",
        "..........O.KHYYYYOK.O..........",
        "............KOOOOOOK..W.........",
        "............KHYYYYOK.W..........",
        ".............KOOOOK...W.........",
        ".............KHYYOK.............",
        "..............KOOK..............",
        "...............KK...............",
        "...............WW...............",
        "...............W................",
        "................................"
      ]
    },

    /**
     * 深層の攻撃役。α-5で 32×32 に描き直した。
     *
     * ★ 腕はつけていない。
     *   前は「水の腕を2本振り上げた」形にしていたが、細い腕は触角に見え、
     *   太くすると急須の注ぎ口に見えた。スライム型に手足を足そうとするのが
     *   そもそも無理だったので、姿勢そのもので殴り役を表している。
     *
     * 「近づいたものを重い水塊で叩き潰す」を、次の3つで出している。
     *   ・上が重く、前へせり出した塊（崩れる寸前の波。今にも落ちてきそうに見える）
     *   ・そこを支えるくびれ。細いほど上の重さが出る
     *   ・足元だけ水たまりとして横へ広がる
     *
     * ヨドミが「上が細く下が広い」ので、こちらはちょうど逆。
     * 並べたときにシルエットの段階で見分けがつく。
     * 目は傾いたスリット2本にして、せり出した塊の下から見下ろす顔にしてある。
     */
    puddling: {
      palette: {
        ".": null,
        "K": "#08141c",   // 輪郭
        "D": "#16303e",   // 影になる右下
        "B": "#23495c",   // 深いところの水
        "A": "#316f8a",   // 明るいところの水
        "S": "#4fb0d1",   // 上と左のふちの照り（水属性の色）
        "W": "#dff2f8"    // 目
      },
      pixels: [
        "................................",
        "................................",
        ".........KKKKKKKKKKK............",
        "......KKKSSSSSSSSSSSKKK.........",
        "....KKSSSAAAAAAAAAAASSSKK.......",
        "...KSSAAAAAAAAAAAAAAAAASSK......",
        "..KSAAAAABBBBBBBBBBBAAAAASK.....",
        ".KSAAABBBBBBBBBBBBBBBBBAAASK....",
        ".KSAABBBBBBBBBBBBBBBBBBBBAAK....",
        ".KSAABBBBBBBBBBBBBBBBBBBBBAAK...",
        ".KSAABBWWWBBBBBBBBBBWWWBBBDAK...",
        ".KSAABBBWWWBBBBBBBBWWWBBBBDDK...",
        ".KSAABBBBWWWBBBBBBWWWBBBBBDDK...",
        "..KSAABBBBBBBBBBBBBBBBBBBBDDK...",
        "...KSAABBBBBBBBBBBBBBBBBBDDK....",
        "....KSAABBBBBBBBBBBBBBBBDDK.....",
        ".....KSAABBBBBBBBBBBBBBDDK......",
        "......KSAABBBBBBBBBBBBDDK.......",
        ".......KSAABBBBBBBBBBDDK........",
        "........KSAABBBBBBBBDDK.........",
        ".........KSAABBBBBBDDK..........",
        "..........KSAABBBBDDK...........",
        "...........KSAABBBDDK...........",
        "...........KSAABBBDDK...........",
        "............KSAABBDDK...........",
        "............KSAABBBDDK..........",
        "..........KKAABBBBBBBSKK........",
        "........KKSSBBBBBBBBBASSKK......",
        "......KKSSAADDDDDDDDDAAASSKK....",
        "....KKSSAAAADDDDDDDDDDAAAASSK...",
        ".....KKKKKKKKKKKKKKKKKKKKKKK....",
        "................................"
      ]
    },

    /**
     * ミズダマリの姿（RC-1）。形は puddling の行を抜き差ししただけ・色を塗り替えただけで、描き直していない。
     * 目（10〜12行）より上の、幅の変わらない8・9行を使う。
     *   puddlingSquash … 8・9行を抜き、上に空行を足した（塊が2ドット低く潰れる。目の行は動かない）。叩きつける・被弾
     *   puddlingTall   … 8・9行を複製して2行足し、上の空行を抜いた（塊が2ドット高くせり上がる）。溜める・立ち上がる
     *   puddlingGlow   … 水の色を1段明るく（S→T、A→S、B→A、D→B）。目はそのまま。共鳴・自分にかける技
     *   puddlingSleep  … Squash の目を閉じ（10・12行を体の色で埋め、11行に明るい線 L）、体を1段暗く（S→A、A→B）。
     *                    図鑑「乾くと小さくしぼむ」。暗い色・線の色 T・L はこの絵だけのパレットに足した
     */
    puddlingSquash: {
      palette: {
        ".": null, "K": "#08141c", "D": "#16303e", "B": "#23495c", "A": "#316f8a", "S": "#4fb0d1", "W": "#dff2f8"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        ".........KKKKKKKKKKK............",
        "......KKKSSSSSSSSSSSKKK.........",
        "....KKSSSAAAAAAAAAAASSSKK.......",
        "...KSSAAAAAAAAAAAAAAAAASSK......",
        "..KSAAAAABBBBBBBBBBBAAAAASK.....",
        ".KSAAABBBBBBBBBBBBBBBBBAAASK....",
        ".KSAABBWWWBBBBBBBBBBWWWBBBDAK...",
        ".KSAABBBWWWBBBBBBBBWWWBBBBDDK...",
        ".KSAABBBBWWWBBBBBBWWWBBBBBDDK...",
        "..KSAABBBBBBBBBBBBBBBBBBBBDDK...",
        "...KSAABBBBBBBBBBBBBBBBBBDDK....",
        "....KSAABBBBBBBBBBBBBBBBDDK.....",
        ".....KSAABBBBBBBBBBBBBBDDK......",
        "......KSAABBBBBBBBBBBBDDK.......",
        ".......KSAABBBBBBBBBBDDK........",
        "........KSAABBBBBBBBDDK.........",
        ".........KSAABBBBBBDDK..........",
        "..........KSAABBBBDDK...........",
        "...........KSAABBBDDK...........",
        "...........KSAABBBDDK...........",
        "............KSAABBDDK...........",
        "............KSAABBBDDK..........",
        "..........KKAABBBBBBBSKK........",
        "........KKSSBBBBBBBBBASSKK......",
        "......KKSSAADDDDDDDDDAAASSKK....",
        "....KKSSAAAADDDDDDDDDDAAAASSK...",
        ".....KKKKKKKKKKKKKKKKKKKKKKK....",
        "................................"
      ]
    },

    puddlingTall: {
      palette: {
        ".": null, "K": "#08141c", "D": "#16303e", "B": "#23495c", "A": "#316f8a", "S": "#4fb0d1", "W": "#dff2f8"
      },
      pixels: [
        ".........KKKKKKKKKKK............",
        "......KKKSSSSSSSSSSSKKK.........",
        "....KKSSSAAAAAAAAAAASSSKK.......",
        "...KSSAAAAAAAAAAAAAAAAASSK......",
        "..KSAAAAABBBBBBBBBBBAAAAASK.....",
        ".KSAAABBBBBBBBBBBBBBBBBAAASK....",
        ".KSAABBBBBBBBBBBBBBBBBBBBAAK....",
        ".KSAABBBBBBBBBBBBBBBBBBBBBAAK...",
        ".KSAABBBBBBBBBBBBBBBBBBBBAAK....",
        ".KSAABBBBBBBBBBBBBBBBBBBBBAAK...",
        ".KSAABBWWWBBBBBBBBBBWWWBBBDAK...",
        ".KSAABBBWWWBBBBBBBBWWWBBBBDDK...",
        ".KSAABBBBWWWBBBBBBWWWBBBBBDDK...",
        "..KSAABBBBBBBBBBBBBBBBBBBBDDK...",
        "...KSAABBBBBBBBBBBBBBBBBBDDK....",
        "....KSAABBBBBBBBBBBBBBBBDDK.....",
        ".....KSAABBBBBBBBBBBBBBDDK......",
        "......KSAABBBBBBBBBBBBDDK.......",
        ".......KSAABBBBBBBBBBDDK........",
        "........KSAABBBBBBBBDDK.........",
        ".........KSAABBBBBBDDK..........",
        "..........KSAABBBBDDK...........",
        "...........KSAABBBDDK...........",
        "...........KSAABBBDDK...........",
        "............KSAABBDDK...........",
        "............KSAABBBDDK..........",
        "..........KKAABBBBBBBSKK........",
        "........KKSSBBBBBBBBBASSKK......",
        "......KKSSAADDDDDDDDDAAASSKK....",
        "....KKSSAAAADDDDDDDDDDAAAASSK...",
        ".....KKKKKKKKKKKKKKKKKKKKKKK....",
        "................................"
      ]
    },

    puddlingGlow: {
      palette: {
        ".": null, "K": "#08141c", "D": "#16303e", "B": "#23495c", "A": "#316f8a", "S": "#4fb0d1", "W": "#dff2f8",
        "T": "#a8e4f4"
      },
      pixels: [
        "................................",
        "................................",
        ".........KKKKKKKKKKK............",
        "......KKKTTTTTTTTTTTKKK.........",
        "....KKTTTSSSSSSSSSSSTTTKK.......",
        "...KTTSSSSSSSSSSSSSSSSSTTK......",
        "..KTSSSSSAAAAAAAAAAASSSSSTK.....",
        ".KTSSSAAAAAAAAAAAAAAAAASSSTK....",
        ".KTSSAAAAAAAAAAAAAAAAAAAASSK....",
        ".KTSSAAAAAAAAAAAAAAAAAAAAASSK...",
        ".KTSSAAWWWAAAAAAAAAAWWWAAABSK...",
        ".KTSSAAAWWWAAAAAAAAWWWAAAABBK...",
        ".KTSSAAAAWWWAAAAAAWWWAAAAABBK...",
        "..KTSSAAAAAAAAAAAAAAAAAAAABBK...",
        "...KTSSAAAAAAAAAAAAAAAAAABBK....",
        "....KTSSAAAAAAAAAAAAAAAABBK.....",
        ".....KTSSAAAAAAAAAAAAAABBK......",
        "......KTSSAAAAAAAAAAAABBK.......",
        ".......KTSSAAAAAAAAAABBK........",
        "........KTSSAAAAAAAABBK.........",
        ".........KTSSAAAAAABBK..........",
        "..........KTSSAAAABBK...........",
        "...........KTSSAAABBK...........",
        "...........KTSSAAABBK...........",
        "............KTSSAABBK...........",
        "............KTSSAAABBK..........",
        "..........KKSSAAAAAAATKK........",
        "........KKTTAAAAAAAAASTTKK......",
        "......KKTTSSBBBBBBBBBSSSTTKK....",
        "....KKTTSSSSBBBBBBBBBBSSSSTTK...",
        ".....KKKKKKKKKKKKKKKKKKKKKKK....",
        "................................"
      ]
    },

    puddlingSleep: {
      palette: {
        ".": null, "K": "#08141c", "D": "#16303e", "B": "#23495c", "A": "#316f8a", "S": "#4fb0d1", "W": "#dff2f8",
        "L": "#7fc8e0"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        ".........KKKKKKKKKKK............",
        "......KKKAAAAAAAAAAAKKK.........",
        "....KKAAABBBBBBBBBBBAAAKK.......",
        "...KAABBBBBBBBBBBBBBBBBAAK......",
        "..KABBBBBBBBBBBBBBBBBBBBBAK.....",
        ".KABBBBBBBBBBBBBBBBBBBBBBBAK....",
        ".KABBBBBBBBBBBBBBBBBBBBBBBDBK...",
        ".KABBBBBLLLBBBBBBBBLLLBBBBDDK...",
        ".KABBBBBBBBBBBBBBBBBBBBBBBDDK...",
        "..KABBBBBBBBBBBBBBBBBBBBBBDDK...",
        "...KABBBBBBBBBBBBBBBBBBBBDDK....",
        "....KABBBBBBBBBBBBBBBBBBDDK.....",
        ".....KABBBBBBBBBBBBBBBBDDK......",
        "......KABBBBBBBBBBBBBBDDK.......",
        ".......KABBBBBBBBBBBBDDK........",
        "........KABBBBBBBBBBDDK.........",
        ".........KABBBBBBBBDDK..........",
        "..........KABBBBBBDDK...........",
        "...........KABBBBBDDK...........",
        "...........KABBBBBDDK...........",
        "............KABBBBDDK...........",
        "............KABBBBBDDK..........",
        "..........KKBBBBBBBBBAKK........",
        "........KKAABBBBBBBBBBAAKK......",
        "......KKAABBDDDDDDDDDBBBAAKK....",
        "....KKAABBBBDDDDDDDDDDBBBBAAK...",
        ".....KKKKKKKKKKKKKKKKKKKKKKK....",
        "................................"
      ]
    },

    /**
     * ゲーム中で初めての竜。48×48（sizeScale 1.35 で他より一回り大きく表示）。
     *
     * この絵は制作者が MakeBead で描いた 48×45 のドット絵を、
     * 参考絵/bead-pattern(1).png から1マスずつ機械的に読み取ったもの。
     * 目で書き写すと 2000 マス超のどこかを必ず間違えるので、
     * 画像のマス目（20px 間隔）の中心色を拾って変換している。
     * 元絵は 45 行なので、上に空行を3つ足して 48 行に揃えた
     * （足が下端に来るまま。BattleScene は下端そろえで描画する）。
     *
     * 直すときは元の png ではなくこの配列を直接いじってよい。
     * ただし色は下のパレット10色から選ぶこと（元絵と同じ材料）。
     */
    abyssDragon: {
      palette: {
        ".": null,
        "K": "#0a0710",   // 輪郭・影（いちばん多い）
        "P": "#3d2c5c",   // 体の鱗
        "M": "#1d1430",   // 翼の膜
        "L": "#57407f",   // 光の当たる鱗
        "H": "#7a683f",   // 角と爪
        "X": "#000000",   // Black（差し込みの黒）
        "Y": "#222222",   // Dark Charcoal
        "Z": "#111111",   // Very Dark Gray
        "I": "#dddddd",   // Near White（目のハイライト）
        "W": "#ff5e5e"    // 目
      },
      pixels: [
        "................................................",
        "................................................",
        "................................................",
        "................................................",
        "......................L.L........KK.............",
        "......................LLLP.......KHKK...........",
        ".....KKKKKK...........LLLPP......KHHK...........",
        "..KKKKMMMMKKKKKK.......LMPKK.....KHHK...........",
        "..KKMMMMMMMMMMXKK......MLPKHK....KKHHK..........",
        "..KKKMMMMMMMMMMMKK......LKKKHKK....KHKK.........",
        "...MMMMMMMMMMMMMMK.K....LLKKHHHKK..KHHHK........",
        "....MMMMMMMMMMMMMKKK.....LMMKHHHK...KHHK........",
        ".....MMMMMMMMMKKKKZKK...LMMLKKHHHKK.KHHKK.......",
        ".....MMMMMMKKKKMMMMMKK...LLLKKKHHHKKKHHHKK......",
        ".....MMMMKKKMMMMMMMMMK...LLLMMKKHHHKKHHHKKK.....",
        ".....MMKKKMMMMMMMMMMMKK...LMMLKKHHHKKKKKKPPK....",
        "....MMKKMMMMMMMMMMMMMKK...MKKKKKKHKPPKKPPPPK....",
        "...KKKKMMMMMMMMMMMMKKK....MLLLKXKKKPPPPPPPPK....",
        "...KMMMMMMMMMMMMMKKKKK.....LLLKKPPPPPPPPPPKKX...",
        "...MMMMMMMMMMMMKKKMMKK.....LLLKPPPPPPPPPPPKIX...",
        "..MMM..MMMMMMMKKMMMMKK....LLLKKPPPPKKKPPPPKWK...",
        "...........KKKKMMMMMXK....KKKKKKZPPKIIKPPPKKK...",
        "............KKMMMMMMMKKKKKKKXPPKKPPPKWWKPPPPK...",
        ".KKK........KMMMMMMMMKKKKXPPPPPKKPPPPKKKPPPPK...",
        ".KPPKK.....KKMMMMMMMMMKKPPPPPPPPKKPPPPPPPPPPKK..",
        "..KPPK.....KKMMM..MKKKKPPPPPPPPPPPLLLPKPPPPPXK..",
        "..KPPPK...KKKKM.....KKXPPPPPPLLLLLLLLLKKPPPPPK..",
        "..KPPPK....KKK.....KKKPPPPPKPLLLLLLKXLLLKLPPLK..",
        "..KKPPPK..........KKPPPKPPPKLYLLLLLKKKLLLKPPKK..",
        "...KPPPPK.......KKPPPPPKPPPKLLYYLLKK..KLLLKK....",
        "...KKPPPK......KXPPPPPPKKPPKLLLLYYKK...KKKK.....",
        "....KPPPKK....KPPPPZXPPPKPPKKLLLLLKKK...........",
        "....KPPPKKKKKKPPPPKKKKZPKKPPPKKLLKKPPK..........",
        "....KPPPPPPPPPPPPKPPKKKPLKKPPPKKKXPPPPK.........",
        "....KPPPPPPPPPPPKPPPPPKKYLKKPHHKYKKPPPPKK.......",
        "....KPPPPPPPPPPPKPPPPPPKYLLLKHKLLKKKPPPHHK......",
        "....KLLPPPPPPPPPKPPPPPPKLYLLLKKKKK..KKKHK.......",
        ".....KLLPPPPPPLKPPPPPPPKLLYLLLKKPKK...KK........",
        "......KKLLPLLLXKPPPPPPPKLLYYYKKPPPKK............",
        ".......KKLLLKKKXPPPPPPPKLLLYKKPPPPPKK...........",
        ".........KKKK.KZPPPPPPKKLLLKKPPPPPPPK...........",
        "..............KKPPPPZKKKKKKKXXPPPPPKK...........",
        "..............KKKPPPKK.....KZPPPPPKK............",
        "..............KPPKKKK......KXPPPPKKKK...........",
        "..............KPPPPPK......KKPPPPPPHKK..........",
        "..............KPPPPPKK......KKPPPHPPHK..........",
        "..............KHPHPHKK.......KKKKKHKK...........",
        "..............KHKHKHK.............KK............"
      ]
    },

    /**
     * ヨミリュウの姿（RC-1）。制作者が MakeBead で描いた絵なので、体・頭・角・脚の形は変えていない。
     * RC-1 の作り直し（作者「手、尻尾、翼をちゃんと動かしてやりたい」）で、翼・尻尾・前足を部位ごとに切り出し、
     * それぞれの付け根を軸に回すようにした。0度で回すと元の絵と1マスも変わらない。
     *   翼   … 手前の大きな翼（4〜27行・0〜23列の濃い色 M・K・X・Z）。付け根は23行・22列。正で振り上げ、負で振り下ろし
     *   尻尾 … 22〜31行は0〜9列、32〜40行は0〜15列。付け根は36.5行・15.5列。正で先が下がる（体へ巻く）
     *   前足 … 手前の前足（32〜37行・33〜41列。爪 H）。付け根（肩）は33行・34.5列。負で振り上げる
     * 重ねる順は 翼 → 尻尾 → 体 → 前足（翼と尻尾は体の後ろ、前足は体の前）。
     * 回したあとは、関節のまわりで3方をふさがれた穴を K で埋め、回してはぐれた1マスは消した。
     *   abyssDragonWingUp     … 翼 14度・尻尾 5度（待機の振り上げ）
     *   abyssDragonWingUpMid  … 翼 7度・尻尾 3度（その途中）
     *   abyssDragonWingDownMid… 翼 -8度（0.95倍）・尻尾 -3度
     *   abyssDragonWingDown   … 翼 -16度（0.9倍）・尻尾 -5度（振り下ろし。下げるほど少し縮めて、翼の先が枠の左で切れないようにした）
     *   abyssDragonGlare      … 目を細めた（目の上の白いハイライト I を輪郭色 K にして、赤い部分だけ残した）
     * ★ 以前は「翼は列ごとに上下へずらす」方式だった（回転は縁がガタガタになったため）。
     *   今は、描く先のマスから元の絵のマスを逆にたどる回し方にしたので、膜に穴は空かない
     */
    abyssDragonWingUp: {
      palette: {
        ".": null, "K": "#0a0710", "P": "#3d2c5c", "M": "#1d1430", "L": "#57407f", "H": "#7a683f",
        "X": "#000000", "Y": "#222222", "Z": "#111111", "I": "#dddddd", "W": "#ff5e5e"
      },
      pixels: [
        "................................................",
        "................................................",
        "................................................",
        "......KKKKKKKK..................................",
        "......KKMMMMMMK.......L.L........KK.............",
        "......KKKMMMMMKKKK....LLLP.......KHKK...........",
        ".......MMMMMMMMMMMKK..LLLPP......KHHK...........",
        ".......MMMMMMMMMMMXKK..LMPKK.....KHHK...........",
        "........MMMMMMMMMMMKK...LPKHK....KKHHK..........",
        "........MMMMMMMMMMMMK...LKKKHKK....KHKK.........",
        "........MMMMMMMMMMMMK.K.LLKKHHHKK..KHHHK........",
        ".......MMMMKKMKKKKKKKKK..LMMKHHHK...KHHK........",
        "......MMKKKKMKMMMMMMMZKKLMMLKKHHHKK.KHHKK.......",
        ".....KKKKKMMMMMMMMMMMMKK.LLLKKKHHHKKKHHHKK......",
        ".....KMMMMMMMMMMMMMMMMMK.LLLMMKKHHHKKHHHKKK.....",
        "...MMMMMMMMMMMMMMMMMMMMKK.LMMLKKHHHKKKKKKPPK....",
        "....MM..MMMMMMMMMMMMMMMKK.MKKKKKKHKPPKKPPPPK....",
        "........MMMMMMMMMMKKKKK...MLLLKXKKKPPPPPPPPK....",
        "............MMMKKKKMKKK....LLLKKPPPPPPPPPPKKX...",
        "............KKKKKMMMMKK....LLLKPPPPPPPPPPPKIX...",
        "............KKMMMMMMMKK...LLLKKPPPPKKKPPPPKWK...",
        "...........KKMMMMMMMXKK...KKKKKKZPPKIIKPPPKKK...",
        "..KKK......KKMMMMMMMMKKKKKKKXPPKKPPPKWWKPPPPK...",
        "..KPPKK...KKKMMMMMMMMKKKKXPPPPPKKPPPPKKKPPPPK...",
        "...KPPK...KKKM....MKMMKKPPPPPPPPKKPPPPPPPPPPKK..",
        "...KPPPK...KK......KKKKPPPPPPPPPPPLLLPKPPPPPXK..",
        "...KPPPK...........KKXKPPPPPPLLLLLLLLLKKPPPPPK..",
        "...KKPPPK..........KKKPPPPPKPLLLLLLKXLLLKLPPLK..",
        "....KPPPPK........KKPPPKPPPKLYLLLLLKKKLLLKPPKK..",
        "....KKPPPK......KKPPPPPKPPPKLLYYLLKK..KLLLKK....",
        "....KPPPKK.....KXPPPPPPKKPPKLLLLYYKK...KKKK.....",
        "....KPPPKK....KPPPPZXPPPKPPKKLLLLLKKK...........",
        "....KPPPPPKKKKPPPPKKKKZPKKPPPKKLLKKPPK..........",
        "....KPPPPPPPPPPPPKPPKKKPLKKPPPKKKXPPPPK.........",
        "....KPPPPPPPPPPPKPPPPPKKYLKKPHHKYKKPPPPKK.......",
        "....KLLPPPPPPPPPKPPPPPPKYLLLKHKLLKKKPPPHHK......",
        ".....KLLPPPPPPPPKPPPPPPKLYLLLKKKKK..KKKHK.......",
        "......KKLLPPPPLKPPPPPPPKLLYLLLKKPKK...KK........",
        ".......KKLPLLLXKPPPPPPPKLLYYYKKPPPKK............",
        ".........KLLKKKXPPPPPPPKLLLYKKPPPPPKK...........",
        "..........KKKKKZPPPPPPKKLLLKKPPPPPPPK...........",
        "..............KKPPPPZKKKKKKKXXPPPPPKK...........",
        "..............KKKPPPKK.....KZPPPPPKK............",
        "..............KPPKKKK......KXPPPPKKKK...........",
        "..............KPPPPPK......KKPPPPPPHKK..........",
        "..............KPPPPPKK......KKPPPHPPHK..........",
        "..............KHPHPHKK.......KKKKKHKK...........",
        "..............KHKHKHK.............KK............"
      ]
    },

    abyssDragonWingDown: {
      palette: {
        ".": null, "K": "#0a0710", "P": "#3d2c5c", "M": "#1d1430", "L": "#57407f", "H": "#7a683f",
        "X": "#000000", "Y": "#222222", "Z": "#111111", "I": "#dddddd", "W": "#ff5e5e"
      },
      pixels: [
        "................................................",
        "................................................",
        "................................................",
        "................................................",
        "......................L.L........KK.............",
        "......................LLLP.......KHKK...........",
        "......................LLLPP......KHHK...........",
        ".......................LMPKK.....KHHK...........",
        "........................LPKHK....KKHHK..........",
        "........................LKKKHKK....KHKK.........",
        "........................LLKKHHHKK..KHHHK........",
        ".......K..KKKK...........LMMKHHHK...KHHK........",
        "...KKKMMKKMXKKK.K.......LMMLKKHHHKK.KHHKK.......",
        "...KMMMMMMMMMMMKK........LLLKKKHHHKKKHHHKK......",
        ".KKMMMMMMMMMMMMKZKKK.....LLLMMKKHHHKKHHHKKK.....",
        ".KKKMMMMMMMMKKKKMMKK......LMMLKKHHHKKKKKKPPK....",
        ".KMMMMMMMMMMKKMMMMMKK.....MKKKKKKHKPPKKPPPPK....",
        "....MMMMMMKKMMMMMMMKK.....MLLLKXKKKPPPPPPPPK....",
        ".....MMMMKKMMMMMMMKKK......LLLKKPPPPPPPPPPKKX...",
        ".....MMMKKMMMMMMMMKKK......LLLKPPPPPPPPPPPKIX...",
        ".....MMKMMMMMMMMMKMKK.....LLLKKPPPPKKKPPPPKWK...",
        ".....MMKMMMMMMMKKMMMKK....KKKKKKZPPKIIKPPPKKK...",
        "....KKKMMMMMMMKKMMMMMKKKKKKKXPPKKPPPKWWKPPPPK...",
        "....KMMMMMMMMMKKMMMMMKKKKXPPPPPKKPPPPKKKPPPPK...",
        "KKK.KMMKMM..KKKMMMMMMMKKPPPPPPPPKKPPPPPPPPPPKK..",
        "KPPKKMM......KMMMMMMKKKPPPPPPPPPPPLLLPKPPPPPXK..",
        ".KPPKK.......KKMM..MKKKPPPPPPLLLLLLLLLKKPPPPPK..",
        ".KPPPK.......KKMM..KKKPPPPPKPLLLLLLKXLLLKLPPLK..",
        ".KPPPK.......KKKK.KKPPPKPPPKLYLLLLLKKKLLLKPPKK..",
        ".KKPPPK.......KKKKPPPPPKPPPKLLYYLLKK..KLLLKK....",
        "..KPPPPK......KKXPPPPPPKKPPKLLLLYYKK...KKKK.....",
        "...KKPPPK.....KPPPPZXPPPKPPKKLLLLLKKK...........",
        "....KPPPKKKKKKPPPPKKKKZPKKPPPKKLLKKPPK..........",
        "....KPPPKKPPPPPPPKPPKKKPLKKPPPKKKXPPPPK.........",
        "....KPPPPPPPPPPPKPPPPPKKYLKKPHHKYKKPPPPKK.......",
        "....KPPPPPPPPPPPKPPPPPPKYLLLKHKLLKKKPPPHHK......",
        "....KPPPPPPPPPPPKPPPPPPKLYLLLKKKKK..KKKHK.......",
        "....KLLPPPPPPPLKPPPPPPPKLLYLLLKKPKK...KK........",
        ".....KLLPPPLLLXKPPPPPPPKLLYYYKKPPPKK............",
        "......KKLLLLKKKXPPPPPPPKLLLYKKPPPPPKK...........",
        ".......KKLKKKKKZPPPPPPKKLLLKKPPPPPPPK...........",
        ".........K....KKPPPPZKKKKKKKXXPPPPPKK...........",
        "..............KKKPPPKK.....KZPPPPPKK............",
        "..............KPPKKKK......KXPPPPKKKK...........",
        "..............KPPPPPK......KKPPPPPPHKK..........",
        "..............KPPPPPKK......KKPPPHPPHK..........",
        "..............KHPHPHKK.......KKKKKHKK...........",
        "..............KHKHKHK.............KK............"
      ]
    },

    abyssDragonWingDownMid: {
      palette: {
        ".": null, "K": "#0a0710", "P": "#3d2c5c", "M": "#1d1430", "L": "#57407f", "H": "#7a683f",
        "X": "#000000", "Y": "#222222", "Z": "#111111", "I": "#dddddd", "W": "#ff5e5e"
      },
      pixels: [
        "................................................",
        "................................................",
        "................................................",
        "................................................",
        "......................L.L........KK.............",
        "......................LLLP.......KHKK...........",
        "......................LLLPP......KHHK...........",
        ".......................LMPKK.....KHHK...........",
        "........................LPKHK....KKHHK..........",
        "....KKKKKKKKKK..........LKKKHKK....KHKK.........",
        "..KKKMMMMMMMMXKK........LLKKHHHKK..KHHHK........",
        ".KKMMMMMMMMMMMMMK........LMMKHHHK...KHHK........",
        ".KKKMMMMMMMMMMMMKKK.....LMMLKKHHHKK.KHHKK.......",
        "..MMMMMMMMMMMMMKKZKK.....LLLKKKHHHKKKHHHKK......",
        "....MMMMMMMMMKMMMMMKK....LLLMMKKHHHKKHHHKKK.....",
        ".....MMMMMKKKKMMMMMMKK....LMMLKKHHHKKKKKKPPK....",
        ".....MMMMKKMMMMMMMMMKK....MKKKKKKHKPPKKPPPPK....",
        ".....MMKKKMMMMMMMMMMK.....MLLLKXKKKPPPPPPPPK....",
        ".....MKKMMMMMMMMMMKKK......LLLKKPPPPPPPPPPKKX...",
        "....MMKMMMMMMMMMMKKKKK.....LLLKPPPPPPPPPPPKIX...",
        "...KKKMMMMMMMMMKKKMMKK....LLLKKPPPPKKKPPPPKWK...",
        "....KMMMMMMMMMKKMMMMXK....KKKKKKZPPKIIKPPPKKK...",
        "....MM..MMMMKKKMMMMMMKKKKKKKXPPKKPPPKWWKPPPPK...",
        "...MM.......KKMMMMMMMKKKKXPPPPPKKPPPPKKKPPPPK...",
        "KKKK........KKMMMMMMMMKKPPPPPPPPKKPPPPPPPPPPKK..",
        "KPPKK.......KKMMMMKKKKKPPPPPPPPPPPLLLPKPPPPPXK..",
        ".KPPK.......KKMMM...KKXPPPPPPLLLLLLLLLKKPPPPPK..",
        "..KPPPK....KKKKM...KKKPPPPPKPLLLLLLKXLLLKLPPLK..",
        "..KPPPPK....KKK...KKPPPKPPPKLYLLLLLKKKLLLKPPKK..",
        "..KKPPPPK.......KKPPPPPKPPPKLLYYLLKK..KLLLKK....",
        "...KPPPPK......KXPPPPPPKKPPKLLLLYYKK...KKKK.....",
        "...KKPPPKK....KPPPPZXPPPKPPKKLLLLLKKK...........",
        "....KPPPKKKKKKPPPPKKKKZPKKPPPKKLLKKPPK..........",
        "....KPPPPPPPPPPPPKPPKKKPLKKPPPKKKXPPPPK.........",
        "....KPPPPPPPPPPPKPPPPPKKYLKKPHHKYKKPPPPKK.......",
        "....KPPPPPPPPPPPKPPPPPPKYLLLKHKLLKKKPPPHHK......",
        "....KPLPPPPPPPPPKPPPPPPKLYLLLKKKKK..KKKHK.......",
        "....KLLLPPPPPPLKPPPPPPPKLLYLLLKKPKK...KK........",
        ".....KKKLLPLLLXKPPPPPPPKLLYYYKKPPPKK............",
        ".......KKLLLKKKXPPPPPPPKLLLYKKPPPPPKK...........",
        ".........KKKKKKZPPPPPPKKLLLKKPPPPPPPK...........",
        "..............KKPPPPZKKKKKKKXXPPPPPKK...........",
        "..............KKKPPPKK.....KZPPPPPKK............",
        "..............KPPKKKK......KXPPPPKKKK...........",
        "..............KPPPPPK......KKPPPPPPHKK..........",
        "..............KPPPPPKK......KKPPPHPPHK..........",
        "..............KHPHPHKK.......KKKKKHKK...........",
        "..............KHKHKHK.............KK............"
      ]
    },

    abyssDragonGlare: {
      palette: {
        ".": null, "K": "#0a0710", "P": "#3d2c5c", "M": "#1d1430", "L": "#57407f", "H": "#7a683f",
        "X": "#000000", "Y": "#222222", "Z": "#111111", "I": "#dddddd", "W": "#ff5e5e"
      },
      pixels: [
        "................................................",
        "................................................",
        "................................................",
        "................................................",
        "......................L.L........KK.............",
        "......................LLLP.......KHKK...........",
        ".....KKKKKK...........LLLPP......KHHK...........",
        "..KKKKMMMMKKKKKK.......LMPKK.....KHHK...........",
        "..KKMMMMMMMMMMXKK......MLPKHK....KKHHK..........",
        "..KKKMMMMMMMMMMMKK......LKKKHKK....KHKK.........",
        "...MMMMMMMMMMMMMMK.K....LLKKHHHKK..KHHHK........",
        "....MMMMMMMMMMMMMKKK.....LMMKHHHK...KHHK........",
        ".....MMMMMMMMMKKKKZKK...LMMLKKHHHKK.KHHKK.......",
        ".....MMMMMMKKKKMMMMMKK...LLLKKKHHHKKKHHHKK......",
        ".....MMMMKKKMMMMMMMMMK...LLLMMKKHHHKKHHHKKK.....",
        ".....MMKKKMMMMMMMMMMMKK...LMMLKKHHHKKKKKKPPK....",
        "....MMKKMMMMMMMMMMMMMKK...MKKKKKKHKPPKKPPPPK....",
        "...KKKKMMMMMMMMMMMMKKK....MLLLKXKKKPPPPPPPPK....",
        "...KMMMMMMMMMMMMMKKKKK.....LLLKKPPPPPPPPPPKKX...",
        "...MMMMMMMMMMMMKKKMMKK.....LLLKPPPPPPPPPPPKKX...",
        "..MMM..MMMMMMMKKMMMMKK....LLLKKPPPPKKKPPPPKWK...",
        "...........KKKKMMMMMXK....KKKKKKZPPKKKKPPPKKK...",
        "............KKMMMMMMMKKKKKKKXPPKKPPPKWWKPPPPK...",
        ".KKK........KMMMMMMMMKKKKXPPPPPKKPPPPKKKPPPPK...",
        ".KPPKK.....KKMMMMMMMMMKKPPPPPPPPKKPPPPPPPPPPKK..",
        "..KPPK.....KKMMM..MKKKKPPPPPPPPPPPLLLPKPPPPPXK..",
        "..KPPPK...KKKKM.....KKXPPPPPPLLLLLLLLLKKPPPPPK..",
        "..KPPPK....KKK.....KKKPPPPPKPLLLLLLKXLLLKLPPLK..",
        "..KKPPPK..........KKPPPKPPPKLYLLLLLKKKLLLKPPKK..",
        "...KPPPPK.......KKPPPPPKPPPKLLYYLLKK..KLLLKK....",
        "...KKPPPK......KXPPPPPPKKPPKLLLLYYKK...KKKK.....",
        "....KPPPKK....KPPPPZXPPPKPPKKLLLLLKKK...........",
        "....KPPPKKKKKKPPPPKKKKZPKKPPPKKLLKKPPK..........",
        "....KPPPPPPPPPPPPKPPKKKPLKKPPPKKKXPPPPK.........",
        "....KPPPPPPPPPPPKPPPPPKKYLKKPHHKYKKPPPPKK.......",
        "....KPPPPPPPPPPPKPPPPPPKYLLLKHKLLKKKPPPHHK......",
        "....KLLPPPPPPPPPKPPPPPPKLYLLLKKKKK..KKKHK.......",
        ".....KLLPPPPPPLKPPPPPPPKLLYLLLKKPKK...KK........",
        "......KKLLPLLLXKPPPPPPPKLLYYYKKPPPKK............",
        ".......KKLLLKKKXPPPPPPPKLLLYKKPPPPPKK...........",
        ".........KKKK.KZPPPPPPKKLLLKKPPPPPPPK...........",
        "..............KKPPPPZKKKKKKKXXPPPPPKK...........",
        "..............KKKPPPKK.....KZPPPPPKK............",
        "..............KPPKKKK......KXPPPPKKKK...........",
        "..............KPPPPPK......KKPPPPPPHKK..........",
        "..............KPPPPPKK......KKPPPHPPHK..........",
        "..............KHPHPHKK.......KKKKKHKK...........",
        "..............KHKHKHK.............KK............"
      ]
    },

    /**
     * ヨミリュウの追加の姿（RC-1。作者の指定：待機で翼をゆっくり動かす／噛みつくように／体技は浮いて尻尾も動かす）。
     *   abyssDragonWingUpMid … 翼 7度・尻尾 3度（上の abyssDragonWingUp の説明の回し方）。待機・共鳴で、ゆっくり動かす途中の絵
     *   abyssDragonMouth     … 口を開けた。口は、マズルの濃い紫（上あご）と薄い紫（下あご）の境目の斜めの輪郭線
     *                          （口の角 25〜26行・38列 → 28行・41列 → 29行・42〜43列）。作者の指摘で作り直した。
     *                          上あごとこの線は動かさず、線より下の下あご（27〜30行の37〜42列）だけを、
     *                          口の角を軸に先へ行くほど下げた（38列0・39〜40列1・41〜42列2行）。
     *                          あいたところは口の中の暗い赤 R（この絵だけの色）、下あごの右と下には輪郭 K を足した
     *   abyssDragonMouthWide … 口を大きく開けた。作者の指定で**上あごごと頭も動かす**：
     *                          頭（30列より右で、上あごの下の線より上＝角・目・上あご）を、首の付け根を軸に
     *                          「(列−30) × 0.15」行ずつ上へずらした（鼻先ほど大きく上がる。最大2行）。
     *                          頭が上がってあいた首のところは、その列の首の色（24行）を伸ばして埋めた。
     *                          下あごは 38〜39列1・40列2・41〜42列3行下げた。上あごの先に白い牙 I を2本。
     *                          列ごとにずらした段差で角の輪郭に空いた3マスは K で埋めた。噛みつく・ブレス
     *   ★ 最初の版は、この線を見ずに頭の右下の塊をまとめて下げていて、目の下が割れて見えた（作者「口の位置が終わってる」）
     *   abyssDragonHoverUp   … 翼 18度・尻尾 -6度（体技で浮いているとき。翼を振り上げ、尻尾の先は下がる）
     *   abyssDragonHoverDown … 翼 -24度（0.85倍）・尻尾 8度（翼を打ち下ろし、尻尾の先が上へはね上がる）
     *   abyssDragonClawUp    … 前足を -45度振り上げ、目を細めた（Glare の目）。翼 8度・尻尾 4度。爪で引っかく前の溜め
     *   abyssDragonClawSwipe … 前足を 20度振り下ろした（引っかいた瞬間）。翼 -6度・尻尾 -4度
     *   abyssDragonBreathWide… MouthWide（頭を上げて口を大きく開けた姿）に、翼 14度・尻尾 6度を足した。ブレスで体を大きく見せる
     *   abyssDragonSleep     … 両目を閉じ（目の白と赤を K に）、翼を -22度（0.88倍）でたたみ、尻尾を 10度巻き込み、前足を 12度下ろした
     * 尻尾の角度は、正で先が上がって体へ寄り、負で先が下がる
     */
    abyssDragonWingUpMid: {
      palette: {
        ".": null, "K": "#0a0710", "P": "#3d2c5c", "M": "#1d1430", "L": "#57407f", "H": "#7a683f",
        "X": "#000000", "Y": "#222222", "Z": "#111111", "I": "#dddddd", "W": "#ff5e5e"
      },
      pixels: [
        "................................................",
        "................................................",
        "................................................",
        "................................................",
        ".......KKKK...........L.L........KK.............",
        "....KKKKMMMKK.........LLLP.......KHKK...........",
        "....KKMMMMMMKKKKKK....LLLPP......KHHK...........",
        "....KKKMMMMMMMMMXKK....LMPKK.....KHHK...........",
        ".....MMMMMMMMMMMMMK.....LPKHK....KKHHK..........",
        "......MMMMMMMMMMMMMK....LKKKHKK....KHKK.........",
        "......MMMMMMMMMMMMKK....LLKKHHHKK..KHHHK........",
        "......MMMMMMMMMKKKKKK....LMMKHHHK...KHHK........",
        "......MMMMMMKKKKMMMZKK..LMMLKKHHHKK.KHHKK.......",
        "......MMKKKKKMMMMMMMMKK..LLLKKKHHHKKKHHHKK......",
        ".....MMKKMKMMMMMMMMMMMK..LLLMMKKHHHKKHHHKKK.....",
        "....KKKKMMMMMMMMMMMMMMKK..LMMLKKHHHKKKKKKPPK....",
        "....KMMMMMMMMMMMMMMMMMKK..MKKKKKKHKPPKKPPPPK....",
        "....MMMMMMMMMMMMMMMMKKK...MLLLKXKKKPPPPPPPPK....",
        "...MM..MMMMMMMMKKKKKKKK....LLLKKPPPPPPPPPPKKX...",
        "..........MMMMKKMMMMKK.....LLLKPPPPPPPPPPPKIX...",
        "...........KKKKMMMMMKK....LLLKKPPPPKKKPPPPKWK...",
        "............KKMMMMMMXK....KKKKKKZPPKIIKPPPKKK...",
        "..KKK.......KMMMMMMMMKKKKKKKXPPKKPPPKWWKPPPPK...",
        "..KPPK.....KKMMMMMMMMKKKKXPPPPPKKPPPPKKKPPPPK...",
        "...KPPK....KKMMM..MMMMKKPPPPPPPPKKPPPPPPPPPPKK..",
        "...KPPK...KKKKM...MKKKKPPPPPPPPPPPLLLPKPPPPPXK..",
        "...KPPPK..KKKK.....KKKXPPPPPPLLLLLLLLLKKPPPPPK..",
        "..KKPPKK...........KKKPPPPPKPLLLLLLKXLLLKLPPLK..",
        "...KPPPK..........KKPPPKPPPKLYLLLLLKKKLLLKPPKK..",
        "...KKPPPK.......KKPPPPPKPPPKLLYYLLKK..KLLLKK....",
        "....KPPPK......KXPPPPPPKKPPKLLLLYYKK...KKKK.....",
        "....KPPPKK....KPPPPZXPPPKPPKKLLLLLKKK...........",
        "....KPPPKKKKKKPPPPKKKKZPKKPPPKKLLKKPPK..........",
        "....KPPPPPPPPPPPPKPPKKKPLKKPPPKKKXPPPPK.........",
        "....KPPPPPPPPPPPKPPPPPKKYLKKPHHKYKKPPPPKK.......",
        "....KLPPPPPPPPPPKPPPPPPKYLLLKHKLLKKKPPPHHK......",
        ".....KLPPPPPPPPPKPPPPPPKLYLLLKKKKK..KKKHK.......",
        "......LLPPPPPPLKPPPPPPPKLLYLLLKKPKK...KK........",
        "......KKLLPLLLXKPPPPPPPKLLYYYKKPPPKK............",
        ".......KKLLLKKKXPPPPPPPKLLLYKKPPPPPKK...........",
        ".........KKKKKKZPPPPPPKKLLLKKPPPPPPPK...........",
        "..............KKPPPPZKKKKKKKXXPPPPPKK...........",
        "..............KKKPPPKK.....KZPPPPPKK............",
        "..............KPPKKKK......KXPPPPKKKK...........",
        "..............KPPPPPK......KKPPPPPPHKK..........",
        "..............KPPPPPKK......KKPPPHPPHK..........",
        "..............KHPHPHKK.......KKKKKHKK...........",
        "..............KHKHKHK.............KK............"
      ]
    },

    abyssDragonMouth: {
      palette: {
        ".": null, "K": "#0a0710", "P": "#3d2c5c", "M": "#1d1430", "L": "#57407f", "H": "#7a683f",
        "X": "#000000", "Y": "#222222", "Z": "#111111", "I": "#dddddd", "W": "#ff5e5e",
        "R": "#5a1020"
      },
      pixels: [
        "................................................",
        "................................................",
        "................................................",
        "................................................",
        "......................L.L........KK.............",
        "......................LLLP.......KHKK...........",
        ".....KKKKKK...........LLLPP......KHHK...........",
        "..KKKKMMMMKKKKKK.......LMPKK.....KHHK...........",
        "..KKMMMMMMMMMMXKK......MLPKHK....KKHHK..........",
        "..KKKMMMMMMMMMMMKK......LKKKHKK....KHKK.........",
        "...MMMMMMMMMMMMMMK.K....LLKKHHHKK..KHHHK........",
        "....MMMMMMMMMMMMMKKK.....LMMKHHHK...KHHK........",
        ".....MMMMMMMMMKKKKZKK...LMMLKKHHHKK.KHHKK.......",
        ".....MMMMMMKKKKMMMMMKK...LLLKKKHHHKKKHHHKK......",
        ".....MMMMKKKMMMMMMMMMK...LLLMMKKHHHKKHHHKKK.....",
        ".....MMKKKMMMMMMMMMMMKK...LMMLKKHHHKKKKKKPPK....",
        "....MMKKMMMMMMMMMMMMMKK...MKKKKKKHKPPKKPPPPK....",
        "...KKKKMMMMMMMMMMMMKKK....MLLLKXKKKPPPPPPPPK....",
        "...KMMMMMMMMMMMMMKKKKK.....LLLKKPPPPPPPPPPKKX...",
        "...MMMMMMMMMMMMKKKMMKK.....LLLKPPPPPPPPPPPKIX...",
        "..MMM..MMMMMMMKKMMMMKK....LLLKKPPPPKKKPPPPKWK...",
        "...........KKKKMMMMMXK....KKKKKKZPPKIIKPPPKKK...",
        "............KKMMMMMMMKKKKKKKXPPKKPPPKWWKPPPPK...",
        ".KKK........KMMMMMMMMKKKKXPPPPPKKPPPPKKKPPPPK...",
        ".KPPKK.....KKMMMMMMMMMKKPPPPPPPPKKPPPPPPPPPPKK..",
        "..KPPK.....KKMMM..MKKKKPPPPPPPPPPPLLLPKPPPPPXK..",
        "..KPPPK...KKKKM.....KKXPPPPPPLLLLLLLLLKKPPPPPK..",
        "..KPPPK....KKK.....KKKPPPPPKPLLLLLLKXLLRKLPPLK..",
        "..KKPPPK..........KKPPPKPPPKLYLLLLLKKKLLRKPPKK..",
        "...KPPPPK.......KKPPPPPKPPPKLLYYLLKK..KLLRKK....",
        "...KKPPPK......KXPPPPPPKKPPKLLLLYYKK...KLLR.....",
        "....KPPPKK....KPPPPZXPPPKPPKKLLLLLKKK...KLLK....",
        "....KPPPKKKKKKPPPPKKKKZPKKPPPKKLLKKPPK...KK.....",
        "....KPPPPPPPPPPPPKPPKKKPLKKPPPKKKXPPPPK.........",
        "....KPPPPPPPPPPPKPPPPPKKYLKKPHHKYKKPPPPKK.......",
        "....KPPPPPPPPPPPKPPPPPPKYLLLKHKLLKKKPPPHHK......",
        "....KLLPPPPPPPPPKPPPPPPKLYLLLKKKKK..KKKHK.......",
        ".....KLLPPPPPPLKPPPPPPPKLLYLLLKKPKK...KK........",
        "......KKLLPLLLXKPPPPPPPKLLYYYKKPPPKK............",
        ".......KKLLLKKKXPPPPPPPKLLLYKKPPPPPKK...........",
        ".........KKKK.KZPPPPPPKKLLLKKPPPPPPPK...........",
        "..............KKPPPPZKKKKKKKXXPPPPPKK...........",
        "..............KKKPPPKK.....KZPPPPPKK............",
        "..............KPPKKKK......KXPPPPKKKK...........",
        "..............KPPPPPK......KKPPPPPPHKK..........",
        "..............KPPPPPKK......KKPPPHPPHK..........",
        "..............KHPHPHKK.......KKKKKHKK...........",
        "..............KHKHKHK.............KK............"
      ]
    },

    abyssDragonMouthWide: {
      palette: {
        ".": null, "K": "#0a0710", "P": "#3d2c5c", "M": "#1d1430", "L": "#57407f", "H": "#7a683f",
        "X": "#000000", "Y": "#222222", "Z": "#111111", "I": "#dddddd", "W": "#ff5e5e",
        "R": "#5a1020"
      },
      pixels: [
        "................................................",
        "................................................",
        "................................................",
        "..................................K.............",
        "......................L.L........KHKK...........",
        "......................LLLP.......KHHK...........",
        ".....KKKKKK...........LLLPP......KHHK...........",
        "..KKKKMMMMKKKKKK.......LMPKK.....KKHHK..........",
        "..KKMMMMMMMMMMXKK......MLPKHK....KKKHKK.........",
        "..KKKMMMMMMMMMMMKK......LKKKHKK....KHHHK........",
        "...MMMMMMMMMMMMMMK.K....LLKKHHHKK...KHHKK.......",
        "....MMMMMMMMMMMMMKKK.....LMMKHHHKKKKKHHKKK......",
        ".....MMMMMMMMMKKKKZKK...LMMLKKHHHKKKKHHHKKK.....",
        ".....MMMMMMKKKKMMMMMKK...LLLKKKHHHHKKHHHKPPK....",
        ".....MMMMKKKMMMMMMMMMK...LLLMMKKHHHKKKKKPPPK....",
        ".....MMKKKMMMMMMMMMMMKK...LMMLKKHHKPPKKPPPPK....",
        "....MMKKMMMMMMMMMMMMMKK...MKKKKKKHKPPPPPPPKKX...",
        "...KKKKMMMMMMMMMMMMKKK....MLLLKXKKPPPPPPPPKIX...",
        "...KMMMMMMMMMMMMMKKKKK.....LLLKKPPPPPPPPPPKWK...",
        "...MMMMMMMMMMMMKKKMMKK.....LLLKPPPPKKKPPPPKKK...",
        "..MMM..MMMMMMMKKMMMMKK....LLLKKPPPPKIIKPPPPPK...",
        "...........KKKKMMMMMXK....KKKKKKZPPPKWWKPPPPK...",
        "............KKMMMMMMMKKKKKKKXPPKKPPPPKKKPPPPKK..",
        ".KKK........KMMMMMMMMKKKKXPPPPPKKPPPPPPPPPPPXK..",
        ".KPPKK.....KKMMMMMMMMMKKPPPPPPPPKKPPPPKPPPPPPK..",
        "..KPPK.....KKMMM..MKKKKPPPPPPPPPPPLLLPKKKLPPLK..",
        "..KPPPK...KKKKM.....KKXPPPPPPLLLLLLLLLRRRKPPKK..",
        "..KPPPK....KKK.....KKKPPPPPKPLLLLLLKXLRRRIKK....",
        "..KKPPPK..........KKPPPKPPPKLYLLLLLKKKLRRR......",
        "...KPPPPK.......KKPPPPPKPPPKLLYYLLKK..KLLR......",
        "...KKPPPK......KXPPPPPPKKPPKLLLLYYKK...KLLI.....",
        "....KPPPKK....KPPPPZXPPPKPPKKLLLLLKKK...KLLK....",
        "....KPPPKKKKKKPPPPKKKKZPKKPPPKKLLKKPPK...KK.....",
        "....KPPPPPPPPPPPPKPPKKKPLKKPPPKKKXPPPPK.........",
        "....KPPPPPPPPPPPKPPPPPKKYLKKPHHKYKKPPPPKK.......",
        "....KPPPPPPPPPPPKPPPPPPKYLLLKHKLLKKKPPPHHK......",
        "....KLLPPPPPPPPPKPPPPPPKLYLLLKKKKK..KKKHK.......",
        ".....KLLPPPPPPLKPPPPPPPKLLYLLLKKPKK...KK........",
        "......KKLLPLLLXKPPPPPPPKLLYYYKKPPPKK............",
        ".......KKLLLKKKXPPPPPPPKLLLYKKPPPPPKK...........",
        ".........KKKK.KZPPPPPPKKLLLKKPPPPPPPK...........",
        "..............KKPPPPZKKKKKKKXXPPPPPKK...........",
        "..............KKKPPPKK.....KZPPPPPKK............",
        "..............KPPKKKK......KXPPPPKKKK...........",
        "..............KPPPPPK......KKPPPPPPHKK..........",
        "..............KPPPPPKK......KKPPPHPPHK..........",
        "..............KHPHPHKK.......KKKKKHKK...........",
        "..............KHKHKHK.............KK............"
      ]
    },

    abyssDragonHoverUp: {
      palette: {
        ".": null, "K": "#0a0710", "P": "#3d2c5c", "M": "#1d1430", "L": "#57407f", "H": "#7a683f",
        "X": "#000000", "Y": "#222222", "Z": "#111111", "I": "#dddddd", "W": "#ff5e5e"
      },
      pixels: [
        "................................................",
        "................................................",
        "........KKKKKK..................................",
        ".......KKMMKMMKKK...............................",
        ".......KKKMMMMMKK.....L.L........KK.............",
        "........MMMMMMMMMKKK..LLLP.......KHKK...........",
        "........MMMMMMMMMMMXK.LLLPP......KHHK...........",
        ".........MMMMMMMMMMMKK.LMPKK.....KHHK...........",
        ".........MMMMMMMMMMMKKK.LPKHK....KKHHK..........",
        ".........MMMMMMMMMMMMK..LKKKHKK....KHKK.........",
        "........MMMMKMKKMMKMMK.KLLKKHHHKK..KHHHK........",
        ".......MMMKKKKKMKKMKKKKK.LMMKHHHK...KHHK........",
        ".....KKKKKKMKMMMMMMMMMKKLMMLKKHHHKK.KHHKK.......",
        ".....MMMMMMMMMMMMMMMMMMKKLLLKKKHHHKKKHHHKK......",
        "....MMMMMMMMMMMMMMMMMMMMKLLLMMKKHHHKKHHHKKK.....",
        ".....MM..MMMMMMMMMMMMMMKK.LMMLKKHHHKKKKKKPPK....",
        "........MMMMMMMMMMMMMMMKK.MKKKKKKHKPPKKPPPPK....",
        "............MMMMKKMKKKKKK.MLLLKXKKKPPPPPPPPK....",
        "............KKKKKMKMMKK....LLLKKPPPPPPPPPPKKX...",
        ".............KKKMMMMMKK....LLLKPPPPPPPPPPPKIX...",
        "............KMMMMMMMMKK...LLLKKPPPPKKKPPPPKWK...",
        "...........KKMMMMMMMMKK...KKKKKKZPPKIIKPPPKKK...",
        "..........KKKMMMMMMMMKKKKKKKXPPKKPPPKWWKPPPPK...",
        "..........KKKMMMKMMMMKKKKXPPPPPKKPPPPKKKPPPPK...",
        ".KK.......KKK....MKKMMKKPPPPPPPPKKPPPPPPPPPPKK..",
        "KPPKK..............KKKKPPPPPPPPPPPLLLPKPPPPPXK..",
        "KKPPK..............KKXKPPPPPPLLLLLLLLLKKPPPPPK..",
        ".KPPPK.............KKKPPPPPKPLLLLLLKXLLLKLPPLK..",
        ".KPPPK............KKPPPKPPPKLYLLLLLKKKLLLKPPKK..",
        ".KKPPPK.........KKPPPPPKPPPKLLYYLLKK..KLLLKK....",
        "..KPPPPK.......KXPPPPPPKKPPKLLLLYYKK...KKKK.....",
        "..KKPPPK......KPPPPZXPPPKPPKKLLLLLKKK...........",
        "....KPPPKKKKKKPPPPKKKKZPKKPPPKKLLKKPPK..........",
        "....KPPPKKKPPPPPPKPPKKKPLKKPPPKKKXPPPPK.........",
        "....KPPPPPPPPPPPKPPPPPKKYLKKPHHKYKKPPPPKK.......",
        "....KPPPPPPPPPPPKPPPPPPKYLLLKHKLLKKKPPPHHK......",
        "....KPPPPPPPPPPPKPPPPPPKLYLLLKKKKK..KKKHK.......",
        "....KLLPPPPPPPLKPPPPPPPKLLYLLLKKPKK...KK........",
        ".....KLLPPPLLLXKPPPPPPPKLLYYYKKPPPKK............",
        "......KKLLPLKKKXPPPPPPPKLLLYKKPPPPPKK...........",
        ".......KKLLKKKKZPPPPPPKKLLLKKPPPPPPPK...........",
        ".........KK...KKPPPPZKKKKKKKXXPPPPPKK...........",
        "..............KKKPPPKK.....KZPPPPPKK............",
        "..............KPPKKKK......KXPPPPKKKK...........",
        "..............KPPPPPK......KKPPPPPPHKK..........",
        "..............KPPPPPKK......KKPPPHPPHK..........",
        "..............KHPHPHKK.......KKKKKHKK...........",
        "..............KHKHKHK.............KK............"
      ]
    },

    abyssDragonHoverDown: {
      palette: {
        ".": null, "K": "#0a0710", "P": "#3d2c5c", "M": "#1d1430", "L": "#57407f", "H": "#7a683f",
        "X": "#000000", "Y": "#222222", "Z": "#111111", "I": "#dddddd", "W": "#ff5e5e"
      },
      pixels: [
        "................................................",
        "................................................",
        "................................................",
        "................................................",
        "......................L.L........KK.............",
        "......................LLLP.......KHKK...........",
        "......................LLLPP......KHHK...........",
        ".......................LMPKK.....KHHK...........",
        "........................LPKHK....KKHHK..........",
        "........................LKKKHKK....KHKK.........",
        "........................LLKKHHHKK..KHHHK........",
        ".........................LMMKHHHK...KHHK........",
        "........................LMMLKKHHHKK.KHHKK.......",
        "..........KKK............LLLKKKHHHKKKHHHKK......",
        "......KKKKMXMK.K.........LLLMMKKHHHKKHHHKKK.....",
        "...KKMMMMMMMMMKKKKK.......LMMLKKHHHKKKKKKPPK....",
        "...KMMMMMMMMMMKZMKK.......MKKKKKKHKPPKKPPPPK....",
        ".KKMMMMMMMMMKMMMMMMK......MLLLKXKKKPPPPPPPPK....",
        ".KKKMMMMMMMKKMMMMMMK.......LLLKKPPPPPPPPPPKKX...",
        "..KMMMMMMMKMMMMMMMKK.......LLLKPPPPPPPPPPPKIX...",
        "...KMMMMMKKMMMMMMKKKK.....LLLKKPPPPKKKPPPPKWK...",
        "...KKKMMMKMMMMMMMKMKK.....KKKKKKZPPKIIKPPPKKK...",
        "...KPPMMKMMMMMMKKMMMXKKKKKKKXPPKKPPPKWWKPPPPK...",
        "....KPKKMMMMMMMKKMMMMKKKKXPPPPPKKPPPPKKKPPPPK...",
        "....KPPKMMMMMMKKMMMMMMMKPPPPPPPPKKPPPPPPPPPPKK..",
        "...KPPPKMMMMKKKKMMMMMKKPPPPPPPPPPPLLLPKPPPPPXK..",
        "...KKPPKK.....KMMM....KPPPPPPLLLLLLLLLKKPPPPPK..",
        "....KPPPK.....KKMMKKKKPPPPPKPLLLLLLKXLLLKLPPLK..",
        "....KPPPPK....KKKMKKPPPKPPPKLYLLLLLKKKLLLKPPKK..",
        ".....KPPPK....KKKKPPPPPKPPPKLLYYLLKK..KLLLKK....",
        ".....KPPPKK...KKXPPPPPPKKPPKLLLLYYKK...KKKK.....",
        ".....KPPPKKK..KPPPPZXPPPKPPKKLLLLLKKK...........",
        "....KPPPPPPPKKKPPPKKKKZPKKPPPKKLLKKPPK..........",
        "....KPPPPPPPPPPPPKPPKKKPLKKPPPKKKXPPPPK.........",
        "....KPPPPPPPPPPPKPPPPPKKYLKKPHHKYKKPPPPKK.......",
        ".....LLPPPPPPPPPKPPPPPPKYLLLKHKLLKKKPPPHHK......",
        ".....KLLPPPPPPPPKPPPPPPKLYLLLKKKKK..KKKHK.......",
        "......KKLLPLPPLKPPPPPPPKLLYLLLKKPKK...KK........",
        ".......KKLLLLLXKPPPPPPPKLLYYYKKPPPKK............",
        ".........KKKKKKXPPPPPPPKLLLYKKPPPPPKK...........",
        ".............KZKPPPPPPKKLLLKKPPPPPPPK...........",
        "..............KKPPPPZKKKKKKKXXPPPPPKK...........",
        "..............KKKPPPKK.....KZPPPPPKK............",
        "..............KPPKKKK......KXPPPPKKKK...........",
        "..............KPPPPPK......KKPPPPPPHKK..........",
        "..............KPPPPPKK......KKPPPHPPHK..........",
        "..............KHPHPHKK.......KKKKKHKK...........",
        "..............KHKHKHK.............KK............"
      ]
    },

    abyssDragonSleep: {
      palette: {
        ".": null, "K": "#0a0710", "P": "#3d2c5c", "M": "#1d1430", "L": "#57407f", "H": "#7a683f",
        "X": "#000000", "Y": "#222222", "Z": "#111111", "I": "#dddddd", "W": "#ff5e5e"
      },
      pixels: [
        "................................................",
        "................................................",
        "................................................",
        "................................................",
        "......................L.L........KK.............",
        "......................LLLP.......KHKK...........",
        "......................LLLPP......KHHK...........",
        ".......................LMPKK.....KHHK...........",
        "........................LPKHK....KKHHK..........",
        "........................LKKKHKK....KHKK.........",
        "........................LLKKHHHKK..KHHHK........",
        ".........................LMMKHHHK...KHHK........",
        "..........KK............LMMLKKHHHKK.KHHKK.......",
        "......KKKKMXKK.K.........LLLKKKHHHKKKHHHKK......",
        "...KKMMKMMMMMMKKKK.......LLLMMKKHHHKKHHHKKK.....",
        "...KMMMMMMMMMMKZKKK.......LMMLKKHHHKKKKKKPPK....",
        ".KKMMMMMMMMMKKKMMMKK......MKKKKKKHKPPKKPPPPK....",
        ".KKKMMMMMMMMKMMMMMMKK.....MLLLKXKKKPPPPPPPPK....",
        ".KKMMMMMMMKKMMMMMMMK.......LLLKKPPPPPPPPPPKKX...",
        "....MMMMMMKMMMMMMMKKK......LLLKPPPPPPPPPPPKKX...",
        "....KMMMMKMMMMMMKKKKK.....LLLKKPPPPKKKPPPPKKK...",
        "...KKKMKKMMMMMMMKKMKK.....KKKKKKZPPKKKKPPPKKK...",
        "...KPPKKKMMMMMMKMMMMXKKKKKKKXPPKKPPPKKKKPPPPK...",
        "....KPPKMMMMMMMKMMMMMKKKKXPPPPPKKPPPPKKKPPPPK...",
        "....KPPPMMMMMMKKMMMMMMMKPPPPPPPPKKPPPPPPPPPPKK..",
        "....KPPPKMM...KMMMMMMKKPPPPPPPPPPPLLLPKPPPPPXK..",
        "....KKPPK.....KMMM...KKPPPPPPLLLLLLLLLKKPPPPPK..",
        "....KPPPK....KKMMMKKKKPPPPPKPLLLLLLKXLLLKLPPLK..",
        "....KKPPPK...KKKKMKKPPPKPPPKLYLLLLLKKKLLLKPPKK..",
        ".....KPPPK...KKKKKPPPPPKPPPKLLYYLLKK..KLLLKK....",
        ".....KPPPKK...KKXPPPPPPKKPPKLLLLYYKK...KKKK.....",
        ".....KPPPKKKKKKPPPPZXPPPKPPKKLLLLLKKK...........",
        ".....KPPPPPPPKKPPPKKKKZPKKPPPKKLLKKPP...........",
        "....KPPPPPPPPPPPPKPPKKKPLKKPPPKKKXPPPK..........",
        "....KLLPPPPPPPPPKPPPPPKKYLKKPHHKYKKPPPK.........",
        ".....KLPPPPPPPPPKPPPPPPKYLLLKHKLKKKKPPPKK.......",
        "......KLPPPPPPPPKPPPPPPKLYLLLKKKKK.KKPHHK.......",
        ".......KLLPLLPLKPPPPPPPKLLYLLLKKPKK.KKHK........",
        ".......KKLLLLLXKPPPPPPPKLLYYYKKPPPKK.KK.........",
        "........KKKKKKXKPPPPPPPKLLLYKKPPPPPKK...........",
        ".............KZKPPPPPPKKLLLKKPPPPPPPK...........",
        "..............KKPPPPZKKKKKKKXXPPPPPKK...........",
        "..............KKKPPPKK.....KZPPPPPKK............",
        "..............KPPKKKK......KXPPPPKKKK...........",
        "..............KPPPPPK......KKPPPPPPHKK..........",
        "..............KPPPPPKK......KKPPPHPPHK..........",
        "..............KHPHPHKK.......KKKKKHKK...........",
        "..............KHKHKHK.............KK............"
      ]
    },

    abyssDragonClawUp: {
      palette: {
        ".": null, "K": "#0a0710", "P": "#3d2c5c", "M": "#1d1430", "L": "#57407f", "H": "#7a683f",
        "X": "#000000", "Y": "#222222", "Z": "#111111", "I": "#dddddd", "W": "#ff5e5e"
      },
      pixels: [
        "................................................",
        "................................................",
        "................................................",
        "................................................",
        "....K..KKKKKK.........L.L........KK.............",
        "....KKKKMMMMK.........LLLP.......KHKK...........",
        "....KKMMMMMMKKKKKK....LLLPP......KHHK...........",
        ".....KKMMMMMMMMMXKK....LMPKK.....KHHK...........",
        ".....MMMMMMMMMMMMMK.....LPKHK....KKHHK..........",
        "......MMMMMMMMMMMMMK....LKKKHKK....KHKK.........",
        ".......MMMMMMMMMMMMK.K..LLKKHHHKK..KHHHK........",
        "......MMMMMMMMMMKKKKKK...LMMKHHHK...KHHK........",
        "......MMMMKKKKKKMMMZKK..LMMLKKHHHKK.KHHKK.......",
        "......MMKKKMKMMMMMMMMKK..LLLKKKHHHKKKHHHKK......",
        "....KMMKKMMMMMMMMMMMMMK..LLLMMKKHHHKKHHHKKK.....",
        "....KKKKMMMMMMMMMMMMMMKK..LMMLKKHHHKKKKKKPPK....",
        "....KMMMMMMMMMMMMMMMMMKK..MKKKKKKHKPPKKPPPPK....",
        "...MMMMMMMMMMMMMMMKMKKK...MLLLKXKKKPPPPPPPPK....",
        "....M..MMMMMMMMMKKKKKKK....LLLKKPPPPPPPPPPKKX...",
        "...........MMMKKMMMMKK.....LLLKPPPPPPPPPPPKKX...",
        "...........KKKKMMMMMKK....LLLKKPPPPKKKPPPPKWK...",
        "............KKMMMMMMXK....KKKKKKZPPKKKKPPPKKK...",
        "..KKK.......KMMMMMMMMKKKKKKKXPPKKPPPKWWKPPPPK...",
        "..KPPKK....KKMMMMMMMMKKKKXPPPPPKKPPPPKKKPPPPK...",
        "...KPPK...KKKMMM..MMMMKKPPPPPPPPKKPPPPPPPPPPKK..",
        "...KPPPK...KKKM...MKKKKPPPPPPPPPPPLLLPKPPPPPXK..",
        "...KPPPK...KK......KKKXPPPPPPLLLLLLLLLKKPPPPPK..",
        "...KKPPPK..........KKKPPPPPKPLLLLLLKXLLLKLPPLK..",
        "...KKPPPP.........KKPPPKPPPKLYLLLLLKKKLLLKPPKK..",
        "...KKPPPK.......KKPPPPPKPPPKLLYYLLKK..KKLKKK....",
        "....KPPPK......KXPPPPPPKKPPKLLLLYYKKKKKKHKK.....",
        "....KPPPKK....KPPPPZXPPPKPPKKLLLLLKPPPPHHK......",
        "....KPPPKKKKKKPPPPKKKKZPKKPPPKKLLKKPPPPKHK......",
        "....KPPPPPPPPPPPPKPPKKKPLKKPPPKKKKPKPPKKK.......",
        "....KPPPPPPPPPPPKPPPPPKKYLKKPHHKYKKKK.K.........",
        "....KLLPPPPPPPPPKPPPPPPKYLLLKHKLLKKK............",
        ".....KLLPPPPPPPPKPPPPPPKLYLLLKKKKK..............",
        "......KKPPPPPPLKPPPPPPPKLLYLLLKKPKK.............",
        ".......KLLPLLLXKPPPPPPPKLLYYYKKPPPKK............",
        "........KLLLKKKXPPPPPPPKLLLYKKPPPPPKK...........",
        ".........KKKKKKZPPPPPPKKLLLKKPPPPPPPK...........",
        "..............KKPPPPZKKKKKKKXXPPPPPKK...........",
        "..............KKKPPPKK.....KZPPPPPKK............",
        "..............KPPKKKK......KXPPPPKKKK...........",
        "..............KPPPPPK......KKPPPPPPHKK..........",
        "..............KPPPPPKK......KKPPPHPPHK..........",
        "..............KHPHPHKK.......KKKKKHKK...........",
        "..............KHKHKHK.............KK............"
      ]
    },

    abyssDragonClawSwipe: {
      palette: {
        ".": null, "K": "#0a0710", "P": "#3d2c5c", "M": "#1d1430", "L": "#57407f", "H": "#7a683f",
        "X": "#000000", "Y": "#222222", "Z": "#111111", "I": "#dddddd", "W": "#ff5e5e"
      },
      pixels: [
        "................................................",
        "................................................",
        "................................................",
        "................................................",
        "......................L.L........KK.............",
        "......................LLLP.......KHKK...........",
        "......................LLLPP......KHHK...........",
        ".......................LMPKK.....KHHK...........",
        ".....KKKKK..............LPKHK....KKHHK..........",
        "....KMMMMKKKKKKK........LKKKHKK....KHKK.........",
        "..KKKMMMMMMMMXMKK.......LLKKHHHKK..KHHHK........",
        "..KKKMMMMMMMMMMMK.K......LMMKHHHK...KHHK........",
        "..KKMMMMMMMMMMMMKKK.....LMMLKKHHHKK.KHHKK.......",
        "....MMMMMMMMMKKKKZKK.....LLLKKKHHHKKKHHHKK......",
        ".....MMMMMMMKKMMMMMKK....LLLMMKKHHHKKHHHKKK.....",
        ".....MMMMMMKMMMMMMMMKK....LMMLKKHHHKKKKKKPPK....",
        ".....MMMMKKMMMMMMMMMKK....MKKKKKKHKPPKKPPPPK....",
        ".....MMKKKMMMMMMMMMMK.....MLLLKXKKKPPPPPPPPK....",
        "....MMKKMMMMMMMMMMMKKK.....LLLKKPPPPPPPPPPKKX...",
        "...KKKKMMMMMMMMMMKKMKK.....LLLKPPPPPPPPPPPKKX...",
        "....KMMMMMMMMMMKKKMMKK....LLLKKPPPPKKKPPPPKWK...",
        "....MMMMMMMMMMKKMMMMXK....KKKKKKZPPKKKKPPPKKK...",
        "...MMM..M..KKKKMMMMMMKKKKKKKXPPKKPPPKWWKPPPPK...",
        ".............KMMMMMMMKKKKXPPPPPKKPPPPKKKPPPPK...",
        "KKK..........KMMMMMMMMKKPPPPPPPPKKPPPPPPPPPPKK..",
        "KPPKK.......KKMMMKMKKKKPPPPPPPPPPPLLLPKPPPPPXK..",
        ".KPPK.......KKMM...KKKXPPPPPPLLLLLLLLLKKPPPPPK..",
        ".KPPPK.....KKKKM...KKKPPPPPKPLLLLLLKXLLLKLPPLK..",
        ".KPPPK......KKK...KKPPPKPPPKLYLLLLLKKKLLLKPPKK..",
        ".KKPPPK.........KKPPPPPKPPPKLLYYLLKK..KLLLKK....",
        "...KPPPPK......KXPPPPPPKKPPKLLLLYYKK...KKKK.....",
        "...KKPPPKK....KPPPPZXPPPKPPKKLLLLLKKK...........",
        "....KPPPKKKKKKPPPPKKKKZPKKPPPKKLLKKP............",
        "....KPPPPPPPPPPPPKPPKKKPLKKPPPKKKXPPPK..........",
        "....KPPPPPPPPPPPKPPPPPKKYLKKPHHKKKPPPPK.........",
        "....KPPPPPPPPPPPKPPPPPPKYLLLKHKLKKKPPP..........",
        "....KPPPPPPPPPPPKPPPPPPKLYLLLKKKKK.PPPKK........",
        "....KLLPPPPPPPLKPPPPPPPKLLYLLLKKPKKKKKHHK.......",
        ".....KLLLLPLLLXKPPPPPPPKLLYYYKKPPPKKKKK.........",
        "......KKKLLLKKKXPPPPPPPKLLLYKKPPPPPKK...........",
        ".......KKKKKKKKZPPPPPPKKLLLKKPPPPPPPK...........",
        "..............KKPPPPZKKKKKKKXXPPPPPKK...........",
        "..............KKKPPPKK.....KZPPPPPKK............",
        "..............KPPKKKK......KXPPPPKKKK...........",
        "..............KPPPPPK......KKPPPPPPHKK..........",
        "..............KPPPPPKK......KKPPPHPPHK..........",
        "..............KHPHPHKK.......KKKKKHKK...........",
        "..............KHKHKHK.............KK............"
      ]
    },

    abyssDragonBreathWide: {
      palette: {
        ".": null, "K": "#0a0710", "P": "#3d2c5c", "M": "#1d1430", "L": "#57407f", "H": "#7a683f",
        "X": "#000000", "Y": "#222222", "Z": "#111111", "I": "#dddddd", "W": "#ff5e5e",
        "R": "#5a1020"
      },
      pixels: [
        "................................................",
        "................................................",
        "................................................",
        "......KKKKKKKK....................K.............",
        "......KKMMMMMMK.......L.L........KHKK...........",
        "......KKKMMMMMKKKK....LLLP.......KHHK...........",
        ".......MMMMMMMMMMMKK..LLLPP......KHHK...........",
        ".......MMMMMMMMMMMXKK..LMPKK.....KKHHK..........",
        "........MMMMMMMMMMMKK...LPKHK....KKKHKK.........",
        "........MMMMMMMMMMMMK...LKKKHKK....KHHHK........",
        "........MMMMMMMMMMMMK.K.LLKKHHHKK...KHHKK.......",
        ".......MMMMKKMKKKKKKKKK..LMMKHHHKKKKKHHKKK......",
        "......MMKKKKMKMMMMMMMZKKLMMLKKHHHKKKKHHHKKK.....",
        ".....KKKKKMMMMMMMMMMMMKK.LLLKKKHHHHKKHHHKPPK....",
        ".....KMMMMMMMMMMMMMMMMMK.LLLMMKKHHHKKKKKPPPK....",
        "...MMMMMMMMMMMMMMMMMMMMKK.LMMLKKHHKPPKKPPPPK....",
        "....MM..MMMMMMMMMMMMMMMKK.MKKKKKKHKPPPPPPPKKX...",
        "........MMMMMMMMMMKKKKK...MLLLKXKKPPPPPPPPKIX...",
        "............MMMKKKKMKKK....LLLKKPPPPPPPPPPKWK...",
        "............KKKKKMMMMKK....LLLKPPPPKKKPPPPKKK...",
        "............KKMMMMMMMKK...LLLKKPPPPKIIKPPPPPK...",
        "...........KKMMMMMMMXKK...KKKKKKZPPPKWWKPPPPK...",
        "..KKK......KKMMMMMMMMKKKKKKKXPPKKPPPPKKKPPPPKK..",
        "..KPPKK...KKKMMMMMMMMKKKKXPPPPPKKPPPPPPPPPPPXK..",
        "...KPPK...KKKM....MKMMKKPPPPPPPPKKPPPPKPPPPPPK..",
        "...KPPPK...KK......KKKKPPPPPPPPPPPLLLPKKKLPPLK..",
        "...KPPPK...........KKXKPPPPPPLLLLLLLLLRRRKPPKK..",
        "...KKPPPK..........KKKPPPPPKPLLLLLLKXLRRRIKK....",
        "....KPPPPK........KKPPPKPPPKLYLLLLLKKKLRRR......",
        "....KKPPPK......KKPPPPPKPPPKLLYYLLKK..KLLR......",
        "....KKPPPKK....KXPPPPPPKKPPKLLLLYYKK...KLLI.....",
        "....KPPPKKK...KPPPPZXPPPKPPKKLLLLLKKK...KLLK....",
        "....KPPPPPPKKKPPPPKKKKZPKKPPPKKLLKKPPK...KK.....",
        "....KPPPPPPPPPPPPKPPKKKPLKKPPPKKKXPPPPK.........",
        "....KPPPPPPPPPPPKPPPPPKKYLKKPHHKYKKPPPPKK.......",
        "....KLLPPPPPPPPPKPPPPPPKYLLLKHKLLKKKPPPHHK......",
        ".....KLLPPPPPPPPKPPPPPPKLYLLLKKKKK..KKKHK.......",
        "......KKLLPPPPLKPPPPPPPKLLYLLLKKPKK...KK........",
        ".......KKLLLLLXKPPPPPPPKLLYYYKKPPPKK............",
        ".........KKLKKKXPPPPPPPKLLLYKKPPPPPKK...........",
        "...........KKKKZPPPPPPKKLLLKKPPPPPPPK...........",
        "..............KKPPPPZKKKKKKKXXPPPPPKK...........",
        "..............KKKPPPKK.....KZPPPPPKK............",
        "..............KPPKKKK......KXPPPPKKKK...........",
        "..............KPPPPPK......KKPPPPPPHKK..........",
        "..............KPPPPPKK......KKPPPHPPHK..........",
        "..............KHPHPHKK.......KKKKKHKK...........",
        "..............KHKHKHK.............KK............"
      ]
    },

    /**
     * 灼熱の亀裂の主。α-5で 32×32 に描き直した。
     *
     * 前は 16×16 の丸い塊に耳を足しただけで、獣に見えていなかった。
     * いまは低く構えた四足獣にしてある。
     *   ・頭を下げ、腰を高くした捕食者の姿勢。まっすぐ立たせると犬に見える
     *   ・体を横いっぱいに伸ばす。ここで坑道の主より一回り大きく見せている
     *   ・脚は4本とも描く。2本だと座っているように見える
     *
     * ★ たてがみは「背中の炎の棘」にしてある。
     *   首から背中へ帯状に流すと、炎ではなくマントか翼に見えた。
     *   棘3本に分けて、あいだに体の色を残すと炎に見える。
     *   光らせるのは棘・尻尾・口の中だけ。耳の先まで光らせると触角に見える。
     *
     * ★ 後ろ脚2本のあいだは必ず2マス空ける。
     *   隣り合わせに置くと1つの塊に融合して、3本足に見える（実際に一度そうなった）。
     *   前脚は胸から生やす。胴からだけ生やすと、胴の左端との
     *   あいだに隙間ができて脚が浮く。
     *
     * ─── 立体に見せるためにやっていること ───
     * 最初は輪郭沿いに明暗を1pxずつ入れただけで、ヨミリュウと並べると
     * 一枚板に見えた。立体感は次の4つで出している。順番に効く。
     *
     *   1. 重なる面のあいだに「黒（K）の切れ目」を入れる。いちばん効く。
     *      同系色の濃淡でぼかすと、面が繋がって平らに見える
     *   2. 肩と腿を「丸い塊」として描く。四足獣が立体に見えるのはこの2つがあるから。
     *      あいだの脇腹は落として、2つの塊を分ける
     *   3. 奥側の脚2本を2段暗く落とす。4本を同じ明るさで塗ると同じ平面に並んで見える
     *   4. 明暗を6段（K/N/D/A/H/P）持つ。光は左上から。
     *      背中と頭のてっぺんに P のふちを通すと、丸みの頂点が分かる
     */
    magmaBeast: {
      palette: {
        ".": null,
        "K": "#2b0f08",   // 輪郭・面と面のさかい
        "N": "#3d1608",   // いちばん深い影（奥側の脚・脇腹）
        "D": "#5a2211",   // 影
        "A": "#8c3a1e",   // 体（熱を持った赤茶）
        "H": "#b25436",   // 光の当たる面
        "P": "#d4744f",   // いちばん明るいふち（背・頭のてっぺん）
        "F": "#ff7a2a",   // 背中の炎
        "E": "#ffb14a",   // 炎の明るいところ・口の中
        "W": "#ffe36e"    // 目
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...KK....KK.....................",
        "..KHHK..KHHK....................",
        "..KHHK..KHHK....................",
        "...KHHKKHDK.....................",
        ".KKPPPPPPPPKK...................",
        "KPPKKPHHAKKKHK.EE...............",
        "KHHWWAAAAWWKHHEEEE.EE........EEE",
        "KHHWWAAAAWWKAHEFFEEEEE......EEEE",
        "KDAAAAADDDDKAKFFFFEFFE.EE...EFFE",
        ".KDDDDDDDDDDK.EFFFFFFFEEEE.EFFFE",
        "..KKEEEEEKAAAKAAAAAAAAEFFE.EFFE.",
        "...KKEEEEKAAAPPPPPPAAANNAAKFFE..",
        "...KHHDDAAAAPKPPPPAAANAPPPPPPK..",
        "....KKKKAAANAKHHHANKNAPPPPPPAAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHAKKKKKKNKNKKKKKHHAK..",
        "........KHHK.KNNNNNNKKKKKHHAK...",
        "........KHHK..KDDDKKAANNKKANNK..",
        "........KHHK..KDDK..KHHK..KDDK..",
        "........KKKK..KKKK..KKKK..KKKK..",
        "........KDDK..KNNK..KDDK..KNNK..",
        ".......KDDDDKKNNNNKKDDDDKKNNNNK.",
        ".......KKKKKKKKKKKKKKKKKKKKKKKK.",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * マグマウルフの姿（RC-1）。体は作り込んであるので形は1ドットも変えず、色だけを塗り替えた。
     * 背中の炎は13列より右（左は頭。口の中の E もあるので分けている）。
     *   magmaBeastBlaze … 炎を1段明るく（F→E、E→W）。図鑑「たてがみの炎は、怒ると強まり」
     *   magmaBeastRage  … Blaze に加えて目を細めた（目の上の行 10 を体の色 A に）。溜める・被弾のとき
     *   magmaBeastSleep … 伏せた姿（RC-1 の作り直しで、色だけの姿から描き足した。下の magmaBeastIdleA の説明を参照）。
     *                     口の光を消し（E→D）、炎を暗い熾火にした（E→F、F→D）。図鑑「眠ると熾火のように小さくなる」
     */
    magmaBeastBlaze: {
      palette: {
        ".": null, "K": "#2b0f08", "N": "#3d1608", "D": "#5a2211", "A": "#8c3a1e", "H": "#b25436",
        "P": "#d4744f", "F": "#ff7a2a", "E": "#ffb14a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...KK....KK.....................",
        "..KHHK..KHHK....................",
        "..KHHK..KHHK....................",
        "...KHHKKHDK.....................",
        ".KKPPPPPPPPKK...................",
        "KPPKKPHHAKKKHK.WW...............",
        "KHHWWAAAAWWKHHWWWW.WW........WWW",
        "KHHWWAAAAWWKAHWEEWWWWW......WWWW",
        "KDAAAAADDDDKAKEEEEWEEW.WW...WEEW",
        ".KDDDDDDDDDDK.WEEEEEEEWWWW.WEEEW",
        "..KKEEEEEKAAAKAAAAAAAAWEEW.WEEW.",
        "...KKEEEEKAAAPPPPPPAAANNAAKEEW..",
        "...KHHDDAAAAPKPPPPAAANAPPPPPPK..",
        "....KKKKAAANAKHHHANKNAPPPPPPAAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHAKKKKKKNKNKKKKKHHAK..",
        "........KHHK.KNNNNNNKKKKKHHAK...",
        "........KHHK..KDDDKKAANNKKANNK..",
        "........KHHK..KDDK..KHHK..KDDK..",
        "........KKKK..KKKK..KKKK..KKKK..",
        "........KDDK..KNNK..KDDK..KNNK..",
        ".......KDDDDKKNNNNKKDDDDKKNNNNK.",
        ".......KKKKKKKKKKKKKKKKKKKKKKKK.",
        "................................",
        "................................",
        "................................"
      ]
    },

    magmaBeastRage: {
      palette: {
        ".": null, "K": "#2b0f08", "N": "#3d1608", "D": "#5a2211", "A": "#8c3a1e", "H": "#b25436",
        "P": "#d4744f", "F": "#ff7a2a", "E": "#ffb14a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...KK....KK.....................",
        "..KHHK..KHHK....................",
        "..KHHK..KHHK....................",
        "...KHHKKHDK.....................",
        ".KKPPPPPPPPKK...................",
        "KPPKKPHHAKKKHK.WW...............",
        "KHHAAAAAAAAKHHWWWW.WW........WWW",
        "KHHWWAAAAWWKAHWEEWWWWW......WWWW",
        "KDAAAAADDDDKAKEEEEWEEW.WW...WEEW",
        ".KDDDDDDDDDDK.WEEEEEEEWWWW.WEEEW",
        "..KKEEEEEKAAAKAAAAAAAAWEEW.WEEW.",
        "...KKEEEEKAAAPPPPPPAAANNAAKEEW..",
        "...KHHDDAAAAPKPPPPAAANAPPPPPPK..",
        "....KKKKAAANAKHHHANKNAPPPPPPAAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHAKKKKKKNKNKKKKKHHAK..",
        "........KHHK.KNNNNNNKKKKKHHAK...",
        "........KHHK..KDDDKKAANNKKANNK..",
        "........KHHK..KDDK..KHHK..KDDK..",
        "........KKKK..KKKK..KKKK..KKKK..",
        "........KDDK..KNNK..KDDK..KNNK..",
        ".......KDDDDKKNNNNKKDDDDKKNNNNK.",
        ".......KKKKKKKKKKKKKKKKKKKKKKKK.",
        "................................",
        "................................",
        "................................"
      ]
    },

    magmaBeastSleep: {
      palette: {
        ".": null, "K": "#2b0f08", "N": "#3d1608", "D": "#5a2211", "A": "#8c3a1e", "H": "#b25436",
        "P": "#d4744f", "F": "#ff7a2a", "E": "#ffb14a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "...KK....KK.....................",
        "..KHHK..KHHK....................",
        "..KHHK..KHHKK...................",
        "...KHHKKHDKAHKKFF...............",
        ".KKPPPPPPPPKHHFFFF.FF........FFF",
        "KPPKKPHHAKKKAHFDDFFFFF......FFFF",
        "KHHAAAAAAAAKAKDDDDFDDF.FF...FDDF",
        "KHHKKAAAAKKKAKFDDDDDDDFFFF.FDDDF",
        "KDAAAAADDDDKAKAAAAAAAAFDDF.FDDF.",
        ".KDDDDDDDDDDKPPPPPPAAANNAAKDDF..",
        "..KKDDDDDAAAPKPPPPAAANAPPPPPPK..",
        "...KKDDDDAANAKHHHANKNAPPPPPPAAK.",
        "...KHHDDAHHNAKHHHADKDDHHHHHHHAK.",
        "....KKKKAHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHAKKKKKKNKNKKKKKHHAK..",
        "........KHHKKKNNNNNNKKKKKHHAK...",
        "........KHHKDDKDDDKKAANNKKANNK..",
        ".......KDDDDKKNNNNKKDDDDKKNNNNK.",
        ".......KKKKKKKKKKKKKKKKKKKKKKKK.",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * マグマウルフの動くコマ（RC-1 の作り直し）。元の絵から部位を切り出して動かした。形は描き直していない。
     *   頭   … 4〜13行の0〜11列（耳・顔）と、14〜17行の2〜8列（口の光とあご）。首の隙間は体の色 A で埋める
     *   あご … 16〜17行の3〜7列。下げたぶんの隙間を F（口の奥の炎）で埋めると、口が開く
     *   脚   … 24〜28行を4本（左から 8・14・20・26列）に分けて、下ほど大きく横へずらす（走る・跳ぶ）
     *   炎   … 背中の炎の先（9〜10行）を左右へ、尻尾の炎を傾けたり伸ばしたりする（待機の揺らめき）
     *   IdleA / IdleB … 待機。尻尾の炎が傾く／伸びる、たてがみの先が左右へなびく
     *   Crouch … 脚を1段縮め、頭を下げて細目（飛びかかる前の溜め）
     *   Leap   … 前脚を前へ、後脚を後ろへ伸ばし、口を開けた細目（飛びかかり）
     *   Bite   … 頭を下げて口を大きく開けた細目（噛みつく瞬間）
     *   RunA / RunB … 走る2コマ（脚を開く／集める）。体技・斬撃の突進
     *   Howl   … 頭を2段上げて口を開け、炎を明るく・尻尾を伸ばす（共鳴・自分にかける技）
     *   Breath … 頭を下げて口を3段開け、炎を明るく（火の息）
     *   Flinch … 頭を引いて目をつぶり、尻尾がすくむ（被弾）
     *   magmaBeastSleep は伏せた姿：脚の3行を抜いて体を落とし、頭をさらに下げて目を閉じ、炎を熾火にした
     */
    magmaBeastIdleA: {
      palette: {
        ".": null, "K": "#2b0f08", "N": "#3d1608", "D": "#5a2211", "A": "#8c3a1e", "H": "#b25436",
        "P": "#d4744f", "F": "#ff7a2a", "E": "#ffb14a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...KK....KK.....................",
        "..KHHK..KHHK....................",
        "..KHHK..KHHK....................",
        "...KHHKKHDK.....................",
        ".KKPPPPPPPPKK...................",
        "KPPKKPHHAKKKHK..EE..............",
        "KHHWWAAAAWWKHH.EEEE.EE.....EEE..",
        "KHHWWAAAAWWKAHEFFEEEEE.....EEEE.",
        "KDAAAAADDDDKAKFFFFEFFE.EE..EFFE.",
        ".KDDDDDDDDDDK.EFFFFFFFEEEE.EFFFE",
        "..KKEEEEEKAAAKAAAAAAAAEFFE.EFFE.",
        "...KKEEEEKAAAPPPPPPAAANNAAKFFE..",
        "...KHHDDAAAAPKPPPPAAANAPPPPPPK..",
        "....KKKKAAANAKHHHANKNAPPPPPPAAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHAKKKKKKNKNKKKKKHHAK..",
        "........KHHK.KNNNNNNKKKKKHHAK...",
        "........KHHK..KDDDKKAANNKKANNK..",
        "........KHHK..KDDK..KHHK..KDDK..",
        "........KKKK..KKKK..KKKK..KKKK..",
        "........KDDK..KNNK..KDDK..KNNK..",
        ".......KDDDDKKNNNNKKDDDDKKNNNNK.",
        ".......KKKKKKKKKKKKKKKKKKKKKKKK.",
        "................................",
        "................................",
        "................................"
      ]
    },

    magmaBeastIdleB: {
      palette: {
        ".": null, "K": "#2b0f08", "N": "#3d1608", "D": "#5a2211", "A": "#8c3a1e", "H": "#b25436",
        "P": "#d4744f", "F": "#ff7a2a", "E": "#ffb14a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...KK....KK.....................",
        "..KHHK..KHHK....................",
        "..KHHK..KHHK....................",
        "...KHHKKHDK.....................",
        ".KKPPPPPPPPKK...................",
        "KPPKKPHHAKKKHKEE.............EEE",
        "KHHWWAAAAWWKHEEEE.EE........EEEE",
        "KHHWWAAAAWWKAHEFFEEEEE......EEEE",
        "KDAAAAADDDDKAKFFFFEFFE.EE...EFFE",
        ".KDDDDDDDDDDK.EFFFFFFFEEEE.EFFFE",
        "..KKEEEEEKAAAKAAAAAAAAEFFE.EFFE.",
        "...KKEEEEKAAAPPPPPPAAANNAAKFFE..",
        "...KHHDDAAAAPKPPPPAAANAPPPPPPK..",
        "....KKKKAAANAKHHHANKNAPPPPPPAAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHAKKKKKKNKNKKKKKHHAK..",
        "........KHHK.KNNNNNNKKKKKHHAK...",
        "........KHHK..KDDDKKAANNKKANNK..",
        "........KHHK..KDDK..KHHK..KDDK..",
        "........KKKK..KKKK..KKKK..KKKK..",
        "........KDDK..KNNK..KDDK..KNNK..",
        ".......KDDDDKKNNNNKKDDDDKKNNNNK.",
        ".......KKKKKKKKKKKKKKKKKKKKKKKK.",
        "................................",
        "................................",
        "................................"
      ]
    },

    magmaBeastCrouch: {
      palette: {
        ".": null, "K": "#2b0f08", "N": "#3d1608", "D": "#5a2211", "A": "#8c3a1e", "H": "#b25436",
        "P": "#d4744f", "F": "#ff7a2a", "E": "#ffb14a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "...KK....KK.....................",
        "..KHHK..KHHK....................",
        "..KHHK..KHHK....................",
        "...KHHKKHDKAK...................",
        ".KKPPPPPPPPKHKKEE...............",
        "KPPKKPHHAKKKHHEEEE.EE........EEE",
        "KHHAAAAAAAAKAHEFFEEEEE......EEEE",
        "KHHWWAAAAWWKAKFFFFEFFE.EE...EFFE",
        "KDAAAAADDDDKAKEFFFFFFFEEEE.EFFFE",
        ".KDDDDDDDDDDKKAAAAAAAAEFFE.EFFE.",
        "..KKEEEEEKAAAPPPPPPAAANNAAKFFE..",
        "...KKEEEEAAAPKPPPPAAANAPPPPPPK..",
        "...KHHDDAAANAKHHHANKNAPPPPPPAAK.",
        "....KKKKAHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHAKKKKKKNKNKKKKKHHAK..",
        "........KHHK.KNNNNNNKKKKKHHAK...",
        "........KHHK..KDDDKKAANNKKANNK..",
        "........KHHK..KDDK..KHHK..KDDK..",
        "........KDDK..KNNK..KDDK..KNNK..",
        ".......KDDDDKKNNNNKKDDDDKKNNNNK.",
        ".......KKKKKKKKKKKKKKKKKKKKKKKK.",
        "................................",
        "................................",
        "................................"
      ]
    },

    magmaBeastLeap: {
      palette: {
        ".": null, "K": "#2b0f08", "N": "#3d1608", "D": "#5a2211", "A": "#8c3a1e", "H": "#b25436",
        "P": "#d4744f", "F": "#ff7a2a", "E": "#ffb14a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...KK....KK.....................",
        "..KHHK..KHHK....................",
        "..KHHK..KHHK....................",
        "...KHHKKHDK.....................",
        ".KKPPPPPPPPKK...................",
        "KPPKKPHHAKKKHK.EE...............",
        "KHHAAAAAAAAKHHEEEE.EE........EEE",
        "KHHWWAAAAWWKAHEFFEEEEE......EEEE",
        "KDAAAAADDDDKAKFFFFEFFE.EE...EFFE",
        ".KDDDDDDDDDDK.EFFFFFFFEEEE.EFFFE",
        "..KKEEEEEKAAAKAAAAAAAAEFFE.EFFE.",
        "...KKEEEEKAAAPPPPPPAAANNAAKFFE..",
        "...KFFFFAAAAPKPPPPAAANAPPPPPPK..",
        "...KFFFFAAANAKHHHANKNAPPPPPPAAK.",
        "...KHHDDKHHNAKHHHADKDDHHHHHHHAK.",
        "....KKKKKHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHAKKKKKKNKNKKKKKHHAK..",
        "........KHHK.KNNNNNNKKKKKHHAK...",
        "........KHHK..KDDDKKAANNKKANNK..",
        "........KHHK..KDDK..KHHK..KDDK..",
        ".......KKKK..KKKK....KKKK.KKKK..",
        ".......KDDK..KNNK....KDDK..KNNK.",
        ".....KDDDDKKNNNNK....KDDDDKNNNNK",
        ".....KKKKKKKKKKKK....KKKKKKKKKKK",
        "................................",
        "................................",
        "................................"
      ]
    },

    magmaBeastBite: {
      palette: {
        ".": null, "K": "#2b0f08", "N": "#3d1608", "D": "#5a2211", "A": "#8c3a1e", "H": "#b25436",
        "P": "#d4744f", "F": "#ff7a2a", "E": "#ffb14a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "...KK....KK.....................",
        "..KHHK..KHHK....................",
        "..KHHK..KHHK....................",
        "...KHHKKHDKAK...................",
        ".KKPPPPPPPPKHKKEE...............",
        "KPPKKPHHAKKKHHEEEE.EE........EEE",
        "KHHAAAAAAAAKAHEFFEEEEE......EEEE",
        "KHHWWAAAAWWKAKFFFFEFFE.EE...EFFE",
        "KDAAAAADDDDKAKEFFFFFFFEEEE.EFFFE",
        ".KDDDDDDDDDDKKAAAAAAAAEFFE.EFFE.",
        "..KKEEEEEKAAAPPPPPPAAANNAAKFFE..",
        "...KKEEEEAAAPKPPPPAAANAPPPPPPK..",
        "...KFFFFAAANAKHHHANKNAPPPPPPAAK.",
        "...KFFFFAHHNAKHHHADKDDHHHHHHHAK.",
        "...KHHDDKHHNAKHHHADKDDHHHHHHHAK.",
        "....KKKKKHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHAKKKKKKNKNKKKKKHHAK..",
        "........KHHK.KNNNNNNKKKKKHHAK...",
        "........KHHK..KDDDKKAANNKKANNK..",
        "........KHHK..KDDK..KHHK..KDDK..",
        "........KKKK..KKKK..KKKK..KKKK..",
        "........KDDK..KNNK..KDDK..KNNK..",
        ".......KDDDDKKNNNNKKDDDDKKNNNNK.",
        ".......KKKKKKKKKKKKKKKKKKKKKKKK.",
        "................................",
        "................................",
        "................................"
      ]
    },

    magmaBeastRunA: {
      palette: {
        ".": null, "K": "#2b0f08", "N": "#3d1608", "D": "#5a2211", "A": "#8c3a1e", "H": "#b25436",
        "P": "#d4744f", "F": "#ff7a2a", "E": "#ffb14a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...KK....KK.....................",
        "..KHHK..KHHK....................",
        "..KHHK..KHHK....................",
        "...KHHKKHDK.....................",
        ".KKPPPPPPPPKK...................",
        "KPPKKPHHAKKKHK..EE..............",
        "KHHAAAAAAAAKHH.EEEE.EE.......EEE",
        "KHHWWAAAAWWKAHEFFEEEEE......EEEE",
        "KDAAAAADDDDKAKFFFFEFFE.EE...EFFE",
        ".KDDDDDDDDDDK.EFFFFFFFEEEE.EFFFE",
        "..KKEEEEEKAAAKAAAAAAAAEFFE.EFFE.",
        "...KKEEEEKAAAPPPPPPAAANNAAKFFE..",
        "...KHHDDAAAAPKPPPPAAANAPPPPPPK..",
        "....KKKKAAANAKHHHANKNAPPPPPPAAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHAKKKKKKNKNKKKKKHHAK..",
        "........KHHK.KNNNNNNKKKKKHHAK...",
        "........KHHK..KDDDKKAANNKKANNK..",
        "........KHHK..KDDK..KHHK..KDDK..",
        ".......KKKK..KKKK....KKKK.KKKK..",
        ".......KDDK..KNNK....KDDK..KNNK.",
        ".....KDDDDKKNNNNK....KDDDDKNNNNK",
        ".....KKKKKKKKKKKK....KKKKKKKKKKK",
        "................................",
        "................................",
        "................................"
      ]
    },

    magmaBeastRunB: {
      palette: {
        ".": null, "K": "#2b0f08", "N": "#3d1608", "D": "#5a2211", "A": "#8c3a1e", "H": "#b25436",
        "P": "#d4744f", "F": "#ff7a2a", "E": "#ffb14a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...KK....KK.....................",
        "..KHHK..KHHK....................",
        "..KHHK..KHHK....................",
        "...KHHKKHDK.....................",
        ".KKPPPPPPPPKK...................",
        "KPPKKPHHAKKKHKEE................",
        "KHHAAAAAAAAKHEEEE.EE.........EEE",
        "KHHWWAAAAWWKAHEFFEEEEE......EEEE",
        "KDAAAAADDDDKAKFFFFEFFE.EE...EFFE",
        ".KDDDDDDDDDDK.EFFFFFFFEEEE.EFFFE",
        "..KKEEEEEKAAAKAAAAAAAAEFFE.EFFE.",
        "...KKEEEEKAAAPPPPPPAAANNAAKFFE..",
        "...KHHDDAAAAPKPPPPAAANAPPPPPPK..",
        "....KKKKAAANAKHHHANKNAPPPPPPAAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHAKKKKKKNKNKKKKKHHAK..",
        "........KHHK.KNNNNNNKKKKKHHAK...",
        "........KHHK..KDDDKKAANNKKANNK..",
        "........KHHK..KDDK..KHHK..KDDK..",
        "........KKKK...KKKKKKKK..KKKK...",
        ".........KDDK..KNNKKDDK..KNNK...",
        "........KDDDDKKNNNKDDDDKNNNNK...",
        "........KKKKKKKKKKKKKKKKKKKKK...",
        "................................",
        "................................",
        "................................"
      ]
    },

    magmaBeastHowl: {
      palette: {
        ".": null, "K": "#2b0f08", "N": "#3d1608", "D": "#5a2211", "A": "#8c3a1e", "H": "#b25436",
        "P": "#d4744f", "F": "#ff7a2a", "E": "#ffb14a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "...KK....KK.....................",
        "..KHHK..KHHK....................",
        "..KHHK..KHHK....................",
        "...KHHKKHDK.....................",
        ".KKPPPPPPPPK....................",
        "KPPKKPHHAKKK....................",
        "KHHWWAAAAWWKK...................",
        "KHHWWAAAAWWKHKKWW............WWW",
        "KDAAAAADDDDKHHWWWW.WW.......WWWW",
        ".KDDDDDDDDDDKHWEEWWWWW......WWWW",
        "..KKEEEEEAAAAKEEEEWEEW.WW...WEEW",
        "...KKEEEEAAAAKWEEEEEEEWWWW.WEEEW",
        "...KFFFFAKAAAKAAAAAAAAWEEW.WEEW.",
        "...KFFFFAKAAAPPPPPPAAANNAAKEEW..",
        "...KHHDDAAAAPKPPPPAAANAPPPPPPK..",
        "....KKKKAAANAKHHHANKNAPPPPPPAAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHAKKKKKKNKNKKKKKHHAK..",
        "........KHHK.KNNNNNNKKKKKHHAK...",
        "........KHHK..KDDDKKAANNKKANNK..",
        "........KHHK..KDDK..KHHK..KDDK..",
        "........KKKK..KKKK..KKKK..KKKK..",
        "........KDDK..KNNK..KDDK..KNNK..",
        ".......KDDDDKKNNNNKKDDDDKKNNNNK.",
        ".......KKKKKKKKKKKKKKKKKKKKKKKK.",
        "................................",
        "................................",
        "................................"
      ]
    },

    magmaBeastBreath: {
      palette: {
        ".": null, "K": "#2b0f08", "N": "#3d1608", "D": "#5a2211", "A": "#8c3a1e", "H": "#b25436",
        "P": "#d4744f", "F": "#ff7a2a", "E": "#ffb14a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "...KK....KK.....................",
        "..KHHK..KHHK....................",
        "..KHHK..KHHK....................",
        "...KHHKKHDKAK...................",
        ".KKPPPPPPPPKHKKWW...............",
        "KPPKKPHHAKKKHHWWWW.WW........WWW",
        "KHHAAAAAAAAKAHWEEWWWWW......WWWW",
        "KHHWWAAAAWWKAKEEEEWEEW.WW...WEEW",
        "KDAAAAADDDDKAKWEEEEEEEWWWW.WEEEW",
        ".KDDDDDDDDDDKKAAAAAAAAWEEW.WEEW.",
        "..KKEEEEEKAAAPPPPPPAAANNAAKEEW..",
        "...KKEEEEAAAPKPPPPAAANAPPPPPPK..",
        "...KFFFFAAANAKHHHANKNAPPPPPPAAK.",
        "...KFFFFAHHNAKHHHADKDDHHHHHHHAK.",
        "...KFFFFKHHNAKHHHADKDDHHHHHHHAK.",
        "...KHHDDKHHNAKHHHADKDDHHHHHHHAK.",
        "....KKKKKHHAKKKKKKNKNKKKKKHHAK..",
        "........KHHK.KNNNNNNKKKKKHHAK...",
        "........KHHK..KDDDKKAANNKKANNK..",
        "........KHHK..KDDK..KHHK..KDDK..",
        "........KKKK..KKKK..KKKK..KKKK..",
        "........KDDK..KNNK..KDDK..KNNK..",
        ".......KDDDDKKNNNNKKDDDDKKNNNNK.",
        ".......KKKKKKKKKKKKKKKKKKKKKKKK.",
        "................................",
        "................................",
        "................................"
      ]
    },

    magmaBeastFlinch: {
      palette: {
        ".": null, "K": "#2b0f08", "N": "#3d1608", "D": "#5a2211", "A": "#8c3a1e", "H": "#b25436",
        "P": "#d4744f", "F": "#ff7a2a", "E": "#ffb14a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "...KK....KK.....................",
        "..KHHK..KHHK....................",
        "..KHHK..KHHK....................",
        "...KHHKKHDK.....................",
        ".KKPPPPPPPPK....................",
        "KPPKKPHHAKKKK...................",
        "KHHAAAAAAAAKHKKEE...............",
        "KHHKKAAAAKKKHHEEEE.EE......EEE..",
        "KDAAAAADDDDKAHEFFEEEEE.....EEEE.",
        ".KDDDDDDDDDDKKFFFFEFFE.EE..EFFE.",
        "..KKEEEEEAAAAKEFFFFFFFEEEE.EFFFE",
        "...KKEEEEKAAAKAAAAAAAAEFFE.EFFE.",
        "...KHHDDAKAAAPPPPPPAAANNAAKFFE..",
        "....KKKKAAAAPKPPPPAAANAPPPPPPK..",
        ".......KAAANAKHHHANKNAPPPPPPAAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHNAKHHHADKDDHHHHHHHAK.",
        "........KHHAKKKKKKNKNKKKKKHHAK..",
        "........KHHK.KNNNNNNKKKKKHHAK...",
        "........KHHK..KDDDKKAANNKKANNK..",
        "........KHHK..KDDK..KHHK..KDDK..",
        "........KKKK..KKKK..KKKK..KKKK..",
        "........KDDK..KNNK..KDDK..KNNK..",
        ".......KDDDDKKNNNNKKDDDDKKNNNNK.",
        ".......KKKKKKKKKKKKKKKKKKKKKKKK.",
        "................................",
        "................................",
        "................................"
      ]
    },

    // 16×16を2倍に拡大して塗り直した（やり方は batty のコメントを参照）。
    // 柄（S）だけは傘の紫ではなく白い段に置き換えている。
    // 傘と柄は別の材質なので、同じ階調で塗ると一続きの塊に見える
    sporin: {
      palette: {
        ".": null,
        "K": "#160f1e",   // 輪郭
        "N": "#3a2850",   // 面と面のさかい・いちばん深い影
        "D": "#5f3f80",   // 傘の影
        "P": "#8a5fb0",   // 傘（紫）
        "H": "#a87ed0",   // 傘の光の当たる面
        "U": "#bdb49e",   // 柄の影
        "S": "#e8e0d0",   // 柄
        "T": "#faf5e8",   // 柄の光の当たる面
        "W": "#e8d5ff",   // 傘のまだら
        "E": "#2a1f38"    // 目
      },
      pixels: [
        "................................",
        "................................",
        "...........KKKKKKKKKK...........",
        "..........KNNNNNNNNNNK..........",
        ".......KKKHHHHHHHHHHHHKKK.......",
        "......KNNNHPPPPPPPPPPHNNNK......",
        ".....KHHHHPPPPWWWWPPPPHHHHK.....",
        "....KNHPPPPPPPWWWWPPPPPPPHNK....",
        "...KHHPPWWWWPPPPPPPPWWWWPPHHK...",
        "..KNHPPPWWWWPPPPPPPPWWWWPPPHNK..",
        "..KNHPPPPPPPPPPPPPPPPPPPPPPDNK..",
        "..KNHPPPPPPPPPPPPPPPPPPPPPPDNK..",
        ".KHHPPPPPPWWWWPPPPWWWWPPPPPPDDK.",
        "KNHPPPPPPPWWWWPPPPWWWWPPPPPPPDNK",
        "KNHPPPPPPPPPPPPPPPPPPPPPPPPPPDNK",
        ".KHHDDDDPPPPPPPPPPPPPPPPDDDDDDK.",
        "..KNNNNNNNNNNNNNNNNNNNNNNNNNNK..",
        "...KKKKKNNNNNNNNNNNNNNNNKKKKK...",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSEESSSSEESUNK........",
        "........KNTSEESSSSEESUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTUSSSSSSSSUUNK........",
        "........KNNNUSSSSSSUNNNK........",
        ".........KKKUUUUUUUUKKK.........",
        "............KNNNNNNK............",
        ".............KKKKKK............."
      ]
    },

    /**
     * キノコンの縮む・伸びる・眠り（RC-1）。sporin の行を抜き差ししただけで、1行の中身（形・色）は変えていない。
     * 根元（30〜31行）の位置もそのまま。
     *   sporinSquash  … 目の下の模様のない柄の行（22・23行）を2つ抜き、上に空行を足した（背が2ドット低い）
     *   sporinStretch … 同じ柄の行を2つ足し、上の空行を抜いた（背が2ドット高い）
     *   sporinSleep   … 縮んだ姿で目を閉じた（目の上の行を柄の色 S にして、下の行だけ残す）。
     *                   図鑑の「笠を閉じて、じっとしている」を、笠を下ろして縮こまる形で見せる
     */
    sporinSquash: {
      palette: {
        ".": null, "K": "#160f1e", "N": "#3a2850", "D": "#5f3f80", "P": "#8a5fb0", "H": "#a87ed0",
        "U": "#bdb49e", "S": "#e8e0d0", "T": "#faf5e8", "W": "#e8d5ff", "E": "#2a1f38"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...........KKKKKKKKKK...........",
        "..........KNNNNNNNNNNK..........",
        ".......KKKHHHHHHHHHHHHKKK.......",
        "......KNNNHPPPPPPPPPPHNNNK......",
        ".....KHHHHPPPPWWWWPPPPHHHHK.....",
        "....KNHPPPPPPPWWWWPPPPPPPHNK....",
        "...KHHPPWWWWPPPPPPPPWWWWPPHHK...",
        "..KNHPPPWWWWPPPPPPPPWWWWPPPHNK..",
        "..KNHPPPPPPPPPPPPPPPPPPPPPPDNK..",
        "..KNHPPPPPPPPPPPPPPPPPPPPPPDNK..",
        ".KHHPPPPPPWWWWPPPPWWWWPPPPPPDDK.",
        "KNHPPPPPPPWWWWPPPPWWWWPPPPPPPDNK",
        "KNHPPPPPPPPPPPPPPPPPPPPPPPPPPDNK",
        ".KHHDDDDPPPPPPPPPPPPPPPPDDDDDDK.",
        "..KNNNNNNNNNNNNNNNNNNNNNNNNNNK..",
        "...KKKKKNNNNNNNNNNNNNNNNKKKKK...",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSEESSSSEESUNK........",
        "........KNTSEESSSSEESUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTUSSSSSSSSUUNK........",
        "........KNNNUSSSSSSUNNNK........",
        ".........KKKUUUUUUUUKKK.........",
        "............KNNNNNNK............",
        ".............KKKKKK............."
      ]
    },

    sporinStretch: {
      palette: {
        ".": null, "K": "#160f1e", "N": "#3a2850", "D": "#5f3f80", "P": "#8a5fb0", "H": "#a87ed0",
        "U": "#bdb49e", "S": "#e8e0d0", "T": "#faf5e8", "W": "#e8d5ff", "E": "#2a1f38"
      },
      pixels: [
        "...........KKKKKKKKKK...........",
        "..........KNNNNNNNNNNK..........",
        ".......KKKHHHHHHHHHHHHKKK.......",
        "......KNNNHPPPPPPPPPPHNNNK......",
        ".....KHHHHPPPPWWWWPPPPHHHHK.....",
        "....KNHPPPPPPPWWWWPPPPPPPHNK....",
        "...KHHPPWWWWPPPPPPPPWWWWPPHHK...",
        "..KNHPPPWWWWPPPPPPPPWWWWPPPHNK..",
        "..KNHPPPPPPPPPPPPPPPPPPPPPPDNK..",
        "..KNHPPPPPPPPPPPPPPPPPPPPPPDNK..",
        ".KHHPPPPPPWWWWPPPPWWWWPPPPPPDDK.",
        "KNHPPPPPPPWWWWPPPPWWWWPPPPPPPDNK",
        "KNHPPPPPPPPPPPPPPPPPPPPPPPPPPDNK",
        ".KHHDDDDPPPPPPPPPPPPPPPPDDDDDDK.",
        "..KNNNNNNNNNNNNNNNNNNNNNNNNNNK..",
        "...KKKKKNNNNNNNNNNNNNNNNKKKKK...",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSEESSSSEESUNK........",
        "........KNTSEESSSSEESUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTUSSSSSSSSUUNK........",
        "........KNNNUSSSSSSUNNNK........",
        ".........KKKUUUUUUUUKKK.........",
        "............KNNNNNNK............",
        ".............KKKKKK............."
      ]
    },

    sporinSleep: {
      palette: {
        ".": null, "K": "#160f1e", "N": "#3a2850", "D": "#5f3f80", "P": "#8a5fb0", "H": "#a87ed0",
        "U": "#bdb49e", "S": "#e8e0d0", "T": "#faf5e8", "W": "#e8d5ff", "E": "#2a1f38"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...........KKKKKKKKKK...........",
        "..........KNNNNNNNNNNK..........",
        ".......KKKHHHHHHHHHHHHKKK.......",
        "......KNNNHPPPPPPPPPPHNNNK......",
        ".....KHHHHPPPPWWWWPPPPHHHHK.....",
        "....KNHPPPPPPPWWWWPPPPPPPHNK....",
        "...KHHPPWWWWPPPPPPPPWWWWPPHHK...",
        "..KNHPPPWWWWPPPPPPPPWWWWPPPHNK..",
        "..KNHPPPPPPPPPPPPPPPPPPPPPPDNK..",
        "..KNHPPPPPPPPPPPPPPPPPPPPPPDNK..",
        ".KHHPPPPPPWWWWPPPPWWWWPPPPPPDDK.",
        "KNHPPPPPPPWWWWPPPPWWWWPPPPPPPDNK",
        "KNHPPPPPPPPPPPPPPPPPPPPPPPPPPDNK",
        ".KHHDDDDPPPPPPPPPPPPPPPPDDDDDDK.",
        "..KNNNNNNNNNNNNNNNNNNNNNNNNNNK..",
        "...KKKKKNNNNNNNNNNNNNNNNKKKKK...",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSEESSSSEESUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTSSSSSSSSSSUNK........",
        "........KNTUSSSSSSSSUUNK........",
        "........KNNNUSSSSSSUNNNK........",
        ".........KKKUUUUUUUUKKK.........",
        "............KNNNNNNK............",
        ".............KKKKKK............."
      ]
    },

    /**
     * 苔むす坑道の主。α-5で 32×32 に描き直した。
     *
     * 前は 16×16 に顔と短い脚を詰めた「箱」で、巨人に見えなかった。
     * いまは全身の人型にしてある。「石の巨人」を出しているのは次の3つ。
     *   ・胴より広い肩。ここが巨人らしさの正体で、細くすると案山子になる
     *   ・胴と腕のあいだの1マスの隙間。無いとただの太い塊に見える
     *   ・細い首。頭が肩に埋もれると顔が消える
     *
     * ★ 苔は「上を向いた面」にだけ、まだらに置いてある。
     *   全部の上端に1pxずつ乗せると蛍光ラインの作業着に見えたので、
     *   頭と肩（y<=14）に限り、3マス幅くらいのまとまりで生やしている。
     *
     * ★ 苔は「面と面のさかい（K）」より先に置く。
     *   あとから置くと切れ目を塗りつぶして、肩に緑の帯ができる。
     *
     * ─── 立体に見せるためにやっていること（magmaBeast と同じ4項目）───
     *   1. 重なる面のあいだに黒（K）の切れ目。あご下・腕の付け根・腰・肘・膝。
     *      ただし肩を横一文字に切ると天秤棒を担いだように見えるので、
     *      切るのは腕の付け根（左右の端）だけにしてある
     *   2. 胸と腿を「塊」として起こす。平らな板に手足を生やすと案山子になる
     *   3. 影の側（右）を一段落とす。左右が同じ明るさだと正面の板に見える
     *   4. 明暗6段（K/N/D/S/H/P）。光は左上から
     */
    mossGolem: {
      palette: {
        ".": null,
        "K": "#131a10",   // 輪郭・面と面のさかい・ひび
        "N": "#26261f",   // いちばん深い影
        "D": "#3b3a30",   // 石の影
        "S": "#6e6a5c",   // 石の体
        "H": "#918c7c",   // 光の当たる石
        "P": "#b3ae9c",   // いちばん明るいふち（胸の張り）
        "M": "#3f7030",   // 苔のふち
        "G": "#6bb04f",   // 苔
        "W": "#a8f0c4"    // 光る目
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "............KKKKKKKK............",
        "...........KGGGHHHGGK...........",
        "...........KKKKKKKKKK...........",
        "...........KNWWNNWWNK...........",
        "...........KNWWNNWWNK...........",
        "...........NNNNSSNNNN...........",
        "............KKHSSDKK............",
        "..............KHHK..............",
        "....KKKKKKKKKKKKKKKKKKKKKKKK....",
        "...KHHHHHHHHGGSSSSGGGMMMSSSGK...",
        "...KHHHHHHHHGGSSSSGGGMMMSSSGK...",
        "...KHHSSSSSSSSSSSSSSSSSSSSDDK...",
        ".KKKKKKKSSSSSSSSSSSSSSSSKKKKKKK.",
        ".KHHSSSSDSHHPPPPPPPHHHSDSSSSDSK.",
        "KHHSSSSSDSHHHPPPPPHHKHSDSSSSSSSK",
        "KHHSSSSSKSSHKHHHHHHKKSSKSSSSSDDK",
        "KHHSSDDK.KHHKKSSSSSSDDK.KSSSSDDK",
        "KKKKKKKK.KHHSKSSSSSSSSDKKKKKKKKK",
        "KHHSSSSSKKSSSSKSDSSSSSKKDDDDDDDK",
        "KHHSSSDDK.KHHSSSDSSDDK..KSSDDDDK",
        "KHHDDDDDK.KKKKKKKKKKKK..KKKKKKK.",
        ".KHHDDDK.KKKKKKK.KKKKKKK........",
        "..KKKKKK.KHHHHHK.KSSSSSK........",
        ".........KHHHHDK.KSSSSHK........",
        ".........KKKKKKK.KKKKKKK........",
        "........KHHDDDDDKDDDDDDDK.......",
        "........KHHKKDDDHDDDKDDDK.......",
        ".......KKKKKKKKKKKKKKKKKKK......",
        "................................"
      ]
    },

    /**
     * モスゴーレムの目だけを変えた姿（RC-1）。体（肩・腕・首）は作り込んであるので、形は1ドットも変えていない。
     *   mossGolemNarrow … 細目。光る目（6〜7行）の上の行を顔の影（N）にして、光る線だけ残した。溜める・被弾のとき
     *   mossGolemSleep  … 目の光を消した（2行とも N）。図鑑「長い時間、同じ姿勢で眠っていた」の石像に戻る
     */
    mossGolemNarrow: {
      palette: {
        ".": null, "K": "#131a10", "N": "#26261f", "D": "#3b3a30", "S": "#6e6a5c", "H": "#918c7c",
        "P": "#b3ae9c", "M": "#3f7030", "G": "#6bb04f", "W": "#a8f0c4"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "............KKKKKKKK............",
        "...........KGGGHHHGGK...........",
        "...........KKKKKKKKKK...........",
        "...........KNNNNNNNNK...........",
        "...........KNWWNNWWNK...........",
        "...........NNNNSSNNNN...........",
        "............KKHSSDKK............",
        "..............KHHK..............",
        "....KKKKKKKKKKKKKKKKKKKKKKKK....",
        "...KHHHHHHHHGGSSSSGGGMMMSSSGK...",
        "...KHHHHHHHHGGSSSSGGGMMMSSSGK...",
        "...KHHSSSSSSSSSSSSSSSSSSSSDDK...",
        ".KKKKKKKSSSSSSSSSSSSSSSSKKKKKKK.",
        ".KHHSSSSDSHHPPPPPPPHHHSDSSSSDSK.",
        "KHHSSSSSDSHHHPPPPPHHKHSDSSSSSSSK",
        "KHHSSSSSKSSHKHHHHHHKKSSKSSSSSDDK",
        "KHHSSDDK.KHHKKSSSSSSDDK.KSSSSDDK",
        "KKKKKKKK.KHHSKSSSSSSSSDKKKKKKKKK",
        "KHHSSSSSKKSSSSKSDSSSSSKKDDDDDDDK",
        "KHHSSSDDK.KHHSSSDSSDDK..KSSDDDDK",
        "KHHDDDDDK.KKKKKKKKKKKK..KKKKKKK.",
        ".KHHDDDK.KKKKKKK.KKKKKKK........",
        "..KKKKKK.KHHHHHK.KSSSSSK........",
        ".........KHHHHDK.KSSSSHK........",
        ".........KKKKKKK.KKKKKKK........",
        "........KHHDDDDDKDDDDDDDK.......",
        "........KHHKKDDDHDDDKDDDK.......",
        ".......KKKKKKKKKKKKKKKKKKK......",
        "................................"
      ]
    },

    mossGolemSleep: {
      palette: {
        ".": null, "K": "#131a10", "N": "#26261f", "D": "#3b3a30", "S": "#6e6a5c", "H": "#918c7c",
        "P": "#b3ae9c", "M": "#3f7030", "G": "#6bb04f", "W": "#a8f0c4"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "............KKKKKKKK............",
        "...........KGGGHHHGGK...........",
        "...........KKKKKKKKKK...........",
        "...........KNNNNNNNNK...........",
        "...........KNNNNNNNNK...........",
        "...........NNNNSSNNNN...........",
        "............KKHSSDKK............",
        "..............KHHK..............",
        "....KKKKKKKKKKKKKKKKKKKKKKKK....",
        "...KHHHHHHHHGGSSSSGGGMMMSSSGK...",
        "...KHHHHHHHHGGSSSSGGGMMMSSSGK...",
        "...KHHSSSSSSSSSSSSSSSSSSSSDDK...",
        ".KKKKKKKSSSSSSSSSSSSSSSSKKKKKKK.",
        ".KHHSSSSDSHHPPPPPPPHHHSDSSSSDSK.",
        "KHHSSSSSDSHHHPPPPPHHKHSDSSSSSSSK",
        "KHHSSSSSKSSHKHHHHHHKKSSKSSSSSDDK",
        "KHHSSDDK.KHHKKSSSSSSDDK.KSSSSDDK",
        "KKKKKKKK.KHHSKSSSSSSSSDKKKKKKKKK",
        "KHHSSSSSKKSSSSKSDSSSSSKKDDDDDDDK",
        "KHHSSSDDK.KHHSSSDSSDDK..KSSDDDDK",
        "KHHDDDDDK.KKKKKKKKKKKK..KKKKKKK.",
        ".KHHDDDK.KKKKKKK.KKKKKKK........",
        "..KKKKKK.KHHHHHK.KSSSSSK........",
        ".........KHHHHDK.KSSSSHK........",
        ".........KKKKKKK.KKKKKKK........",
        "........KHHDDDDDKDDDDDDDK.......",
        "........KHHKKDDDHDDDKDDDK.......",
        ".......KKKKKKKKKKKKKKKKKKK......",
        "................................"
      ]
    },

    // --- 灼熱の亀裂 ---

    /**
     * α-5で 32×32 に描き直した。
     *
     * ★ 形は 16×16 のときのまま。頭の炎・丸い体・大きな白い目・短い足。
     *   一度これを「二足の獣」に描き直したが、それは解像度の話ではなく
     *   キャラクターそのものを別物にしてしまっていた。
     *   このバージョンでやるのは大きさと陰影だけで、誰であるかは変えない。
     *
     * ★ 体は「角を丸めた四角」。球ではない。
     *   16×16の元の絵を数えると、幅11・高さ7で、側面はほぼ垂直だった。
     *   丸い球にすると、かわいくはなるが別のモンスターになる。
     *   階調も球のような放射状ではなく、上と左からの向きでつけている。
     *
     * 足の裏側を一段明るく戻して、床からの反射光にしてある。
     *
     * ★ 目は薄い黄の点だけ。白目も黒い瞳も置かない。
     *   32×32になったので白目と瞳を描き分けてみたが、
     *   目が大きくなったぶん睨んでいるように見えて怖くなった。
     *   16×16のときと同じ「点2つ」がこいつの顔。
     *   元は真っ白（#ffffff）だったが、橙の体の上では白が浮くので
     *   少し黄に寄せてある（#fff3c4）。
     *   丸く塗ろうとして半径で判定すると十字の光になるので、
     *   4×4の角を落とした塊で置いている。
     */
    flamin: {
      palette: {
        ".": null,
        "K": "#3a1002",   // 輪郭・面と面のさかい
        "D": "#9c3312",   // 影
        "R": "#e8542a",   // 体（赤）
        "H": "#ff7a45",   // 光の当たる面
        "P": "#ffa06b",   // ハイライト（左上）
        "O": "#ffa32e",   // 炎（橙）
        "Y": "#ffe66e",   // 炎（黄）
        "W": "#fff3c4"    // 目（薄い黄）
      },
      pixels: [
        "................................",
        "................................",
        "...............YY...............",
        "..............YYYY..............",
        ".............YYOOYY.............",
        ".............YOOOOY.............",
        "............YOOOOOOY............",
        "............YOOOOOOY............",
        "...........YOOOOOOOOY...........",
        "...........YOOOOOOOOY...........",
        "............YOOOOOOOY...........",
        "........KKKKKKKKKKKKKKKK........",
        "......KKPPPPRRRRRRRRHPPPKK......",
        ".....KPPHHHHRRRRRRRRRHHHPPK.....",
        ".....KPHHHHHRRRRRRRRRHHHHHK.....",
        ".....KPHHHHWWRRRRRRWWHHHHHK.....",
        ".....KPHHHWWWWRRRRWWWWRRHHK.....",
        ".....KPHHHWWWWRRRRWWWWRRRDK.....",
        ".....KPHHHRWWRRRRRRWWRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRDDK.....",
        "......KKHHHRRDDDDDDRRRRDKK......",
        "........KKKKKKKKKKKKKKKK........",
        ".........KPHK......KPHK.........",
        ".........KDDK......KDDK.........",
        "........KKKKKK....KKKKKK........",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * フレイミンの姿（RC-1）。体は変えず、炎と目と色だけを変えた。
     *   flaminFlare … 炎を高くした（炎の行を2行足して上へ伸ばした）。燃え上がる・喜ぶ
     *   flaminRage  … 炎を赤くし（O→r、Y→y。この絵だけの色）、目を細めた（15行を体の色に）。
     *                 図鑑「炎の色で機嫌が分かる。赤いときは、近づかないほうがいい」。攻めるとき
     *   flaminSmall … 炎を小さくし（上の6行を消す）、目を細めた。被弾のとき（水に弱い）
     *   flaminSleep … 炎を暗い熾火（o。この絵だけの色）にして小さくし、目を閉じた（15〜17行を消し、18行を暗い黄 w に）
     * 目を消すときは、同じ行の、目の外でいちばん近いマスの色で埋める（体の階調は横に変わるので、
     * 上下から拾うと明るいマスが暗い面の中に浮く。一度そうなって直した）
     */
    flaminFlare: {
      palette: {
        ".": null, "K": "#3a1002", "D": "#9c3312", "R": "#e8542a", "H": "#ff7a45",
        "P": "#ffa06b", "O": "#ffa32e", "Y": "#ffe66e", "W": "#fff3c4"
      },
      pixels: [
        "...............YY...............",
        "..............YYYY..............",
        "..............YYYY..............",
        ".............YYOOYY.............",
        ".............YOOOOY.............",
        ".............YOOOOY.............",
        "............YOOOOOOY............",
        "............YOOOOOOY............",
        "...........YOOOOOOOOY...........",
        "...........YOOOOOOOOY...........",
        "............YOOOOOOOY...........",
        "........KKKKKKKKKKKKKKKK........",
        "......KKPPPPRRRRRRRRHPPPKK......",
        ".....KPPHHHHRRRRRRRRRHHHPPK.....",
        ".....KPHHHHHRRRRRRRRRHHHHHK.....",
        ".....KPHHHHWWRRRRRRWWHHHHHK.....",
        ".....KPHHHWWWWRRRRWWWWRRHHK.....",
        ".....KPHHHWWWWRRRRWWWWRRRDK.....",
        ".....KPHHHRWWRRRRRRWWRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRDDK.....",
        "......KKHHHRRDDDDDDRRRRDKK......",
        "........KKKKKKKKKKKKKKKK........",
        ".........KPHK......KPHK.........",
        ".........KDDK......KDDK.........",
        "........KKKKKK....KKKKKK........",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    flaminRage: {
      palette: {
        ".": null, "K": "#3a1002", "D": "#9c3312", "R": "#e8542a", "H": "#ff7a45",
        "P": "#ffa06b", "O": "#ffa32e", "Y": "#ffe66e", "W": "#fff3c4",
        "r": "#ff3a1a", "y": "#ff8a2a"
      },
      pixels: [
        "................................",
        "................................",
        "...............yy...............",
        "..............yyyy..............",
        ".............yyrryy.............",
        ".............yrrrry.............",
        "............yrrrrrry............",
        "............yrrrrrry............",
        "...........yrrrrrrrry...........",
        "...........yrrrrrrrry...........",
        "............yrrrrrrry...........",
        "........KKKKKKKKKKKKKKKK........",
        "......KKPPPPRRRRRRRRHPPPKK......",
        ".....KPPHHHHRRRRRRRRRHHHPPK.....",
        ".....KPHHHHHRRRRRRRRRHHHHHK.....",
        ".....KPHHHHHRRRRRRRRHHHHHHK.....",
        ".....KPHHHWWWWRRRRWWWWRRHHK.....",
        ".....KPHHHWWWWRRRRWWWWRRRDK.....",
        ".....KPHHHRWWRRRRRRWWRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRDDK.....",
        "......KKHHHRRDDDDDDRRRRDKK......",
        "........KKKKKKKKKKKKKKKK........",
        ".........KPHK......KPHK.........",
        ".........KDDK......KDDK.........",
        "........KKKKKK....KKKKKK........",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    flaminSmall: {
      palette: {
        ".": null, "K": "#3a1002", "D": "#9c3312", "R": "#e8542a", "H": "#ff7a45",
        "P": "#ffa06b", "O": "#ffa32e", "Y": "#ffe66e", "W": "#fff3c4"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "...........YOOOOOOOOY...........",
        "...........YOOOOOOOOY...........",
        "............YOOOOOOOY...........",
        "........KKKKKKKKKKKKKKKK........",
        "......KKPPPPRRRRRRRRHPPPKK......",
        ".....KPPHHHHRRRRRRRRRHHHPPK.....",
        ".....KPHHHHHRRRRRRRRRHHHHHK.....",
        ".....KPHHHHHRRRRRRRRHHHHHHK.....",
        ".....KPHHHWWWWRRRRWWWWRRHHK.....",
        ".....KPHHHWWWWRRRRWWWWRRRDK.....",
        ".....KPHHHRWWRRRRRRWWRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRDDK.....",
        "......KKHHHRRDDDDDDRRRRDKK......",
        "........KKKKKKKKKKKKKKKK........",
        ".........KPHK......KPHK.........",
        ".........KDDK......KDDK.........",
        "........KKKKKK....KKKKKK........",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    flaminSleep: {
      palette: {
        ".": null, "K": "#3a1002", "D": "#9c3312", "R": "#e8542a", "H": "#ff7a45",
        "P": "#ffa06b", "O": "#ffa32e", "Y": "#ffe66e", "W": "#fff3c4",
        "o": "#b5541c", "w": "#c9b878"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "...........OooooooooO...........",
        "...........OooooooooO...........",
        "............OoooooooO...........",
        "........KKKKKKKKKKKKKKKK........",
        "......KKPPPPRRRRRRRRHPPPKK......",
        ".....KPPHHHHRRRRRRRRRHHHPPK.....",
        ".....KPHHHHHRRRRRRRRRHHHHHK.....",
        ".....KPHHHHHRRRRRRRRHHHHHHK.....",
        ".....KPHHHHHRRRRRRRRRRRRHHK.....",
        ".....KPHHHHHRRRRRRRRRRRRRDK.....",
        ".....KPHHHRwwRRRRRRwwRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRDDK.....",
        "......KKHHHRRDDDDDDRRRRDKK......",
        "........KKKKKKKKKKKKKKKK........",
        ".........KPHK......KPHK.........",
        ".........KDDK......KDDK.........",
        "........KKKKKK....KKKKKK........",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * フレイミンの脚を動かすコマ（RC-1 の作り直し。作者「スミビに近い」→ 炎と目だけでなく、脚で見分けがつくようにした）。
     * 形は描き直していない。脚は25〜27行（左8〜13列・右18〜23列）、炎は2〜10行。
     *   flaminStepL / StepR … 片方の脚を1段上げ、炎の先（2〜5行）を反対側へ1列なびかせた。待機で交互に出すと、落ち着かず足踏みする
     *   flaminCrouch … Rage（赤い炎・細目）から脚の上の行（25行）を抜いて、体ごと1段沈めた。飛びかかる前の溜め
     *   flaminAir    … Rage の足の裏（27行）を消して脚をたたみ、炎の上半分を1段上へ伸ばした。跳んでいるところ
     */
    flaminStepL: {
      palette: {
        ".": null, "K": "#3a1002", "D": "#9c3312", "R": "#e8542a", "H": "#ff7a45",
        "P": "#ffa06b", "O": "#ffa32e", "Y": "#ffe66e", "W": "#fff3c4"
      },
      pixels: [
        "................................",
        "................................",
        "................YY..............",
        "...............YYYY.............",
        "..............YYOOYY............",
        "..............YOOOOY............",
        "............YOOOOOOY............",
        "............YOOOOOOY............",
        "...........YOOOOOOOOY...........",
        "...........YOOOOOOOOY...........",
        "............YOOOOOOOY...........",
        "........KKKKKKKKKKKKKKKK........",
        "......KKPPPPRRRRRRRRHPPPKK......",
        ".....KPPHHHHRRRRRRRRRHHHPPK.....",
        ".....KPHHHHHRRRRRRRRRHHHHHK.....",
        ".....KPHHHHWWRRRRRRWWHHHHHK.....",
        ".....KPHHHWWWWRRRRWWWWRRHHK.....",
        ".....KPHHHWWWWRRRRWWWWRRRDK.....",
        ".....KPHHHRWWRRRRRRWWRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRDDK.....",
        "......KKHHHRRDDDDDDRRRRDKK......",
        "........KKPHKKKKKKKKKKKK........",
        ".........KDDK......KPHK.........",
        "........KKKKKK.....KDDK.........",
        "..................KKKKKK........",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    flaminStepR: {
      palette: {
        ".": null, "K": "#3a1002", "D": "#9c3312", "R": "#e8542a", "H": "#ff7a45",
        "P": "#ffa06b", "O": "#ffa32e", "Y": "#ffe66e", "W": "#fff3c4"
      },
      pixels: [
        "................................",
        "................................",
        "..............YY................",
        ".............YYYY...............",
        "............YYOOYY..............",
        "............YOOOOY..............",
        "............YOOOOOOY............",
        "............YOOOOOOY............",
        "...........YOOOOOOOOY...........",
        "...........YOOOOOOOOY...........",
        "............YOOOOOOOY...........",
        "........KKKKKKKKKKKKKKKK........",
        "......KKPPPPRRRRRRRRHPPPKK......",
        ".....KPPHHHHRRRRRRRRRHHHPPK.....",
        ".....KPHHHHHRRRRRRRRRHHHHHK.....",
        ".....KPHHHHWWRRRRRRWWHHHHHK.....",
        ".....KPHHHWWWWRRRRWWWWRRHHK.....",
        ".....KPHHHWWWWRRRRWWWWRRRDK.....",
        ".....KPHHHRWWRRRRRRWWRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRDDK.....",
        "......KKHHHRRDDDDDDRRRRDKK......",
        "........KKKKKKKKKKKKPHKK........",
        ".........KPHK......KDDK.........",
        ".........KDDK.....KKKKKK........",
        "........KKKKKK..................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    flaminCrouch: {
      palette: {
        ".": null, "K": "#3a1002", "D": "#9c3312", "R": "#e8542a", "H": "#ff7a45",
        "P": "#ffa06b", "O": "#ffa32e", "Y": "#ffe66e", "W": "#fff3c4",
        "r": "#ff3a1a", "y": "#ff8a2a"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "...............yy...............",
        "..............yyyy..............",
        ".............yyrryy.............",
        ".............yrrrry.............",
        "............yrrrrrry............",
        "............yrrrrrry............",
        "...........yrrrrrrrry...........",
        "...........yrrrrrrrry...........",
        "............yrrrrrrry...........",
        "........KKKKKKKKKKKKKKKK........",
        "......KKPPPPRRRRRRRRHPPPKK......",
        ".....KPPHHHHRRRRRRRRRHHHPPK.....",
        ".....KPHHHHHRRRRRRRRRHHHHHK.....",
        ".....KPHHHHHRRRRRRRRHHHHHHK.....",
        ".....KPHHHWWWWRRRRWWWWRRHHK.....",
        ".....KPHHHWWWWRRRRWWWWRRRDK.....",
        ".....KPHHHRWWRRRRRRWWRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRDDK.....",
        "......KKHHHRRDDDDDDRRRRDKK......",
        "........KKKKKKKKKKKKKKKK........",
        ".........KDDK......KDDK.........",
        "........KKKKKK....KKKKKK........",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    flaminAir: {
      palette: {
        ".": null, "K": "#3a1002", "D": "#9c3312", "R": "#e8542a", "H": "#ff7a45",
        "P": "#ffa06b", "O": "#ffa32e", "Y": "#ffe66e", "W": "#fff3c4",
        "r": "#ff3a1a", "y": "#ff8a2a"
      },
      pixels: [
        "................................",
        "...............yy...............",
        "..............yyyy..............",
        ".............yyrryy.............",
        ".............yrrrry.............",
        "............yrrrrrry............",
        "............yrrrrrry............",
        "............yrrrrrry............",
        "...........yrrrrrrrry...........",
        "...........yrrrrrrrry...........",
        "............yrrrrrrry...........",
        "........KKKKKKKKKKKKKKKK........",
        "......KKPPPPRRRRRRRRHPPPKK......",
        ".....KPPHHHHRRRRRRRRRHHHPPK.....",
        ".....KPHHHHHRRRRRRRRRHHHHHK.....",
        ".....KPHHHHHRRRRRRRRHHHHHHK.....",
        ".....KPHHHWWWWRRRRWWWWRRHHK.....",
        ".....KPHHHWWWWRRRRWWWWRRRDK.....",
        ".....KPHHHRWWRRRRRRWWRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRRDK.....",
        ".....KPHHHRRRRRRRRRRRRRRDDK.....",
        "......KKHHHRRDDDDDDRRRRDKK......",
        "........KKKKKKKKKKKKKKKK........",
        ".........KPHK......KPHK.........",
        ".........KKKK......KKKK.........",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    }
  });
})(window.MyGame);
