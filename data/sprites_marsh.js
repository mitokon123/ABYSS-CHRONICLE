/**
 * sprites_marsh.js
 * 腐食の毒沼（ステージ4）のモンスターの絵。
 *
 * MyGame.extend("sprites", ...) で足しているので、
 * sprites_abyss.js を触らずに1つのファイルとして増やせる。
 *
 * ▼ 描き方は既存の32×32と同じ決まりにそろえてある
 *   K … 輪郭（いちばん暗い）
 *   N … いちばん深い影（面と面のさかい・奥側）
 *   D … 影
 *   A … 体の地の色
 *   H … 光の当たる面
 *   P … いちばん明るいふち
 *   W … 目
 *   光は**左上から**当てる（フレイミンで決めた向き。全種そろえてある）。
 *
 * ▼ 立体に見せるための4点（マグマウルフのコメントと同じ）
 *   1. 面ごとに色を変える（線ではなく面で影をつける）
 *   2. 光の当たるふちに1段明るい色を置く
 *   3. 奥にあるものほど暗くする（手前の脚と奥の脚で色を変える）
 *   4. 接地する下端に暗い色を敷いて、床から浮かせない
 */
(function (NS) {
  "use strict";

  NS.extend("sprites", {

    /**
     * ドクバチ。沼の雑魚。速いが脆い。
     *
     * 縞のある腹と、下へ伸びた針で「毒を刺す相手」だと一目で分かるようにしてある。
     * 腹は 黄緑(H) と 紫黒(V) を交互に3段重ね、下へ向かって細くした。
     * 翅は本体より淡い灰青(G)。同じ緑で塗ると体と一続きの塊に見えてしまう。
     */
    venomBee: {
      palette: {
        ".": null,
        "K": "#0d1207",   // 輪郭
        // ※ 深い影（N）は置いていない。小さい虫なので3段も影を刻むと潰れる
        "D": "#455a1c",   // 影
        "A": "#7a962a",   // 体（黄緑）
        "H": "#a3c23a",   // 光の当たる面
        "P": "#c8e05a",   // いちばん明るいふち（毒の色）
        "V": "#3a2150",   // 腹の縞（紫黒）
        "U": "#5c3a7a",   // 縞の明るいところ
        "G": "#93a8b4",   // 翅
        "W": "#ffe36e"    // 目
      },
      pixels: [
        "................................",
        "........K..............K........",
        ".........K............K.........",
        "..........K..........K..........",
        "..........KKKKKKKKKKKK..........",
        ".........KHHHHHHHHHHHHK.........",
        "........KHHWWWWHHWWWWHHK........",
        "........KHAWWWWHHWWWWAHK........",
        ".........KAAAAAAAAAAAAK.........",
        "..........KADDDDDDDDAK..........",
        "...........KKKKKKKKKK...........",
        "..KKKKKKKKK.KKKKKKKK.KKKKKKKKK..",
        "..KGGGGGGGK.KPPHHHPK.KGGGGGGGK..",
        "..KGGGGGGGK.KPHHHHHK.KGGGGGGGK..",
        "..KGGGGGGGK.KAHHHHAK.KGGGGGGGK..",
        "..KKGGGGGKK.KADDDDAK.KKGGGGGKK..",
        "...KKKKKKK..KAAAAAAK..KKKKKKK...",
        "..........KPPHHHHHHPPK..........",
        ".........KPHHHHHHHHHHPK.........",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        ".........KHHHHHHHHHHHHK.........",
        ".........KAHHHHHHHHHHAK.........",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        "..........KHHHHHHHHHHK..........",
        "..........KAHHHHHHHHAK..........",
        "..........KVVVVVVVVVVK..........",
        "...........KUVVVVVVUK...........",
        "............KAHHHHAK............",
        ".............KAHAK..............",
        "...............KK..............."
      ]
    },

    /**
     * ドクバチの動くコマ（RC-1）。翅・触角・腹・針を元の絵から切り出して動かした。形は描き直していない。
     *   翅 … 左は11〜16行の2〜10列、右は21〜29列。付け根（13.5行・10.5列／21.5列）を軸に回す。
     *        負で振り上げ、正で振り下ろし。どちらも0.9倍（傾いて少し短く見える）。0度で回すと元の絵と1マスも変わらない
     *   Up / Down   … 翅を25度上げ・下げ
     *   UpB / DownB … 腹の22行を抜いて1行縮め（息をするように腹が縮む）、UpB は触角の先を内へ寄せた。待機で元のコマと交互に出す
     *   Curl        … 翅を上げ、腹の21・22行を抜いて2行縮めた（針を刺す前に腹を引き絞る）
     *   Sting / StingUp … Curl の腹の先に白い針 I を2行出し、先に毒のしずく Q を1つ。翅は下げ／上げ
     *   Sleep       … 翅を70度・0.8倍で体に沿ってたたみ、触角を垂らし、目の色を落とした（w）
     * 色 I・Q・w は動くコマだけで使う
     */
    venomBeeUp: {
      palette: {
        ".": null, "K": "#0d1207", "D": "#455a1c", "A": "#7a962a", "H": "#a3c23a", "P": "#c8e05a",
        "V": "#3a2150", "U": "#5c3a7a", "G": "#93a8b4", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "........K..............K........",
        ".........K............K.........",
        "..........K..........K..........",
        "..........KKKKKKKKKKKK..........",
        ".........KHHHHHHHHHHHHK.........",
        "........KHHWWWWHHWWWWHHK........",
        "........KHAWWWWHHWWWWAHK........",
        "....K....KAAAAAAAAAAAAK....K....",
        "....KKK...KADDDDDDDDAK...KKK....",
        "...KGGGKK..KKKKKKKKKK..KKGGGK...",
        "...KGGGGGKKKKKKKKKKKKKKGGGGGK...",
        "...KKGGGGGK.KPPHHHPK.KGGGGGKK...",
        "...KKGGGGGK.KPHHHHHK.KGGGGGKK...",
        ".....KKGGGK.KAHHHHAK.KGGGKK.....",
        ".......KKK..KADDDDAK..KKK.......",
        "............KAAAAAAK............",
        "..........KPPHHHHHHPPK..........",
        ".........KPHHHHHHHHHHPK.........",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        ".........KHHHHHHHHHHHHK.........",
        ".........KAHHHHHHHHHHAK.........",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        "..........KHHHHHHHHHHK..........",
        "..........KAHHHHHHHHAK..........",
        "..........KVVVVVVVVVVK..........",
        "...........KUVVVVVVUK...........",
        "............KAHHHHAK............",
        ".............KAHAK..............",
        "...............KK..............."
      ]
    },

    venomBeeDown: {
      palette: {
        ".": null, "K": "#0d1207", "D": "#455a1c", "A": "#7a962a", "H": "#a3c23a", "P": "#c8e05a",
        "V": "#3a2150", "U": "#5c3a7a", "G": "#93a8b4", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "........K..............K........",
        ".........K............K.........",
        "..........K..........K..........",
        "..........KKKKKKKKKKKK..........",
        ".........KHHHHHHHHHHHHK.........",
        "........KHHWWWWHHWWWWHHK........",
        "........KHAWWWWHHWWWWAHK........",
        ".........KAAAAAAAAAAAAK.........",
        "..........KADDDDDDDDAK..........",
        "...........KKKKKKKKKK...........",
        ".........K..KKKKKKKK..K.........",
        ".......KKGK.KPPHHHPK.KGKK.......",
        ".....KKGGGK.KPHHHHHK.KGGGKK.....",
        "...KKGGGGGK.KAHHHHAK.KGGGGGKK...",
        "...KGGGGGGKKKADDDDAKKKGGGGGGK...",
        "...KGGGGGKK.KAAAAAAK.KKGGGGGK...",
        "....KKGKK.KPPHHHHHHPPK.KKGKK....",
        "....KKK..KPHHHHHHHHHHPK..KKK....",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        ".........KHHHHHHHHHHHHK.........",
        ".........KAHHHHHHHHHHAK.........",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        "..........KHHHHHHHHHHK..........",
        "..........KAHHHHHHHHAK..........",
        "..........KVVVVVVVVVVK..........",
        "...........KUVVVVVVUK...........",
        "............KAHHHHAK............",
        ".............KAHAK..............",
        "...............KK..............."
      ]
    },

    venomBeeUpB: {
      palette: {
        ".": null, "K": "#0d1207", "D": "#455a1c", "A": "#7a962a", "H": "#a3c23a", "P": "#c8e05a",
        "V": "#3a2150", "U": "#5c3a7a", "G": "#93a8b4", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        ".........K............K.........",
        ".........K............K.........",
        "..........K..........K..........",
        "..........KKKKKKKKKKKK..........",
        ".........KHHHHHHHHHHHHK.........",
        "........KHHWWWWHHWWWWHHK........",
        "........KHAWWWWHHWWWWAHK........",
        "....K....KAAAAAAAAAAAAK....K....",
        "....KKK...KADDDDDDDDAK...KKK....",
        "...KGGGKK..KKKKKKKKKK..KKGGGK...",
        "...KGGGGGKKKKKKKKKKKKKKGGGGGK...",
        "...KKGGGGGK.KPPHHHPK.KGGGGGKK...",
        "...KKGGGGGK.KPHHHHHK.KGGGGGKK...",
        ".....KKGGGK.KAHHHHAK.KGGGKK.....",
        ".......KKK..KADDDDAK..KKK.......",
        "............KAAAAAAK............",
        "..........KPPHHHHHHPPK..........",
        ".........KPHHHHHHHHHHPK.........",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        ".........KHHHHHHHHHHHHK.........",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        "..........KHHHHHHHHHHK..........",
        "..........KAHHHHHHHHAK..........",
        "..........KVVVVVVVVVVK..........",
        "...........KUVVVVVVUK...........",
        "............KAHHHHAK............",
        ".............KAHAK..............",
        "...............KK...............",
        "................................"
      ]
    },

    venomBeeDownB: {
      palette: {
        ".": null, "K": "#0d1207", "D": "#455a1c", "A": "#7a962a", "H": "#a3c23a", "P": "#c8e05a",
        "V": "#3a2150", "U": "#5c3a7a", "G": "#93a8b4", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "........K..............K........",
        ".........K............K.........",
        "..........K..........K..........",
        "..........KKKKKKKKKKKK..........",
        ".........KHHHHHHHHHHHHK.........",
        "........KHHWWWWHHWWWWHHK........",
        "........KHAWWWWHHWWWWAHK........",
        ".........KAAAAAAAAAAAAK.........",
        "..........KADDDDDDDDAK..........",
        "...........KKKKKKKKKK...........",
        ".........K..KKKKKKKK..K.........",
        ".......KKGK.KPPHHHPK.KGKK.......",
        ".....KKGGGK.KPHHHHHK.KGGGKK.....",
        "...KKGGGGGK.KAHHHHAK.KGGGGGKK...",
        "...KGGGGGGKKKADDDDAKKKGGGGGGK...",
        "...KGGGGGKK.KAAAAAAK.KKGGGGGK...",
        "....KKGKK.KPPHHHHHHPPK.KKGKK....",
        "....KKK..KPHHHHHHHHHHPK..KKK....",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        ".........KHHHHHHHHHHHHK.........",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        "..........KHHHHHHHHHHK..........",
        "..........KAHHHHHHHHAK..........",
        "..........KVVVVVVVVVVK..........",
        "...........KUVVVVVVUK...........",
        "............KAHHHHAK............",
        ".............KAHAK..............",
        "...............KK...............",
        "................................"
      ]
    },

    venomBeeCurl: {
      palette: {
        ".": null, "K": "#0d1207", "D": "#455a1c", "A": "#7a962a", "H": "#a3c23a", "P": "#c8e05a",
        "V": "#3a2150", "U": "#5c3a7a", "G": "#93a8b4", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "........K..............K........",
        ".........K............K.........",
        "..........K..........K..........",
        "..........KKKKKKKKKKKK..........",
        ".........KHHHHHHHHHHHHK.........",
        "........KHHWWWWHHWWWWHHK........",
        "........KHAWWWWHHWWWWAHK........",
        "....K....KAAAAAAAAAAAAK....K....",
        "....KKK...KADDDDDDDDAK...KKK....",
        "...KGGGKK..KKKKKKKKKK..KKGGGK...",
        "...KGGGGGKKKKKKKKKKKKKKGGGGGK...",
        "...KKGGGGGK.KPPHHHPK.KGGGGGKK...",
        "...KKGGGGGK.KPHHHHHK.KGGGGGKK...",
        ".....KKGGGK.KAHHHHAK.KGGGKK.....",
        ".......KKK..KADDDDAK..KKK.......",
        "............KAAAAAAK............",
        "..........KPPHHHHHHPPK..........",
        ".........KPHHHHHHHHHHPK.........",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        "..........KHHHHHHHHHHK..........",
        "..........KAHHHHHHHHAK..........",
        "..........KVVVVVVVVVVK..........",
        "...........KUVVVVVVUK...........",
        "............KAHHHHAK............",
        ".............KAHAK..............",
        "...............KK...............",
        "................................",
        "................................"
      ]
    },

    venomBeeSting: {
      palette: {
        ".": null, "K": "#0d1207", "D": "#455a1c", "A": "#7a962a", "H": "#a3c23a", "P": "#c8e05a",
        "V": "#3a2150", "U": "#5c3a7a", "G": "#93a8b4", "W": "#ffe36e",
        "I": "#eef0f4", "Q": "#c050f0"
      },
      pixels: [
        "................................",
        "........K..............K........",
        ".........K............K.........",
        "..........K..........K..........",
        "..........KKKKKKKKKKKK..........",
        ".........KHHHHHHHHHHHHK.........",
        "........KHHWWWWHHWWWWHHK........",
        "........KHAWWWWHHWWWWAHK........",
        ".........KAAAAAAAAAAAAK.........",
        "..........KADDDDDDDDAK..........",
        "...........KKKKKKKKKK...........",
        ".........K..KKKKKKKK..K.........",
        ".......KKGK.KPPHHHPK.KGKK.......",
        ".....KKGGGK.KPHHHHHK.KGGGKK.....",
        "...KKGGGGGK.KAHHHHAK.KGGGGGKK...",
        "...KGGGGGGKKKADDDDAKKKGGGGGGK...",
        "...KGGGGGKK.KAAAAAAK.KKGGGGGK...",
        "....KKGKK.KPPHHHHHHPPK.KKGKK....",
        "....KKK..KPHHHHHHHHHHPK..KKK....",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        "..........KHHHHHHHHHHK..........",
        "..........KAHHHHHHHHAK..........",
        "..........KVVVVVVVVVVK..........",
        "...........KUVVVVVVUK...........",
        "............KAHHHHAK............",
        ".............KAHAK..............",
        "...............II...............",
        "...............I................",
        "................Q..............."
      ]
    },

    venomBeeStingUp: {
      palette: {
        ".": null, "K": "#0d1207", "D": "#455a1c", "A": "#7a962a", "H": "#a3c23a", "P": "#c8e05a",
        "V": "#3a2150", "U": "#5c3a7a", "G": "#93a8b4", "W": "#ffe36e",
        "I": "#eef0f4", "Q": "#c050f0"
      },
      pixels: [
        "................................",
        "........K..............K........",
        ".........K............K.........",
        "..........K..........K..........",
        "..........KKKKKKKKKKKK..........",
        ".........KHHHHHHHHHHHHK.........",
        "........KHHWWWWHHWWWWHHK........",
        "........KHAWWWWHHWWWWAHK........",
        "....K....KAAAAAAAAAAAAK....K....",
        "....KKK...KADDDDDDDDAK...KKK....",
        "...KGGGKK..KKKKKKKKKK..KKGGGK...",
        "...KGGGGGKKKKKKKKKKKKKKGGGGGK...",
        "...KKGGGGGK.KPPHHHPK.KGGGGGKK...",
        "...KKGGGGGK.KPHHHHHK.KGGGGGKK...",
        ".....KKGGGK.KAHHHHAK.KGGGKK.....",
        ".......KKK..KADDDDAK..KKK.......",
        "............KAAAAAAK............",
        "..........KPPHHHHHHPPK..........",
        ".........KPHHHHHHHHHHPK.........",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        "..........KHHHHHHHHHHK..........",
        "..........KAHHHHHHHHAK..........",
        "..........KVVVVVVVVVVK..........",
        "...........KUVVVVVVUK...........",
        "............KAHHHHAK............",
        ".............KAHAK..............",
        "...............II...............",
        "...............I................",
        "................Q..............."
      ]
    },

    venomBeeSleep: {
      palette: {
        ".": null, "K": "#0d1207", "D": "#455a1c", "A": "#7a962a", "H": "#a3c23a", "P": "#c8e05a",
        "V": "#3a2150", "U": "#5c3a7a", "G": "#93a8b4", "w": "#8a7a3a"
      },
      pixels: [
        "................................",
        "................................",
        ".........K............K.........",
        "........K.K..........K.K........",
        "..........KKKKKKKKKKKK..........",
        ".........KHHHHHHHHHHHHK.........",
        "........KHHwwwwHHwwwwHHK........",
        "........KHAwwwwHHwwwwAHK........",
        ".........KAAAAAAAAAAAAK.........",
        "..........KADDDDDDDDAK..........",
        "...........KKKKKKKKKK...........",
        "............KKKKKKKK............",
        "............KPPHHHPK............",
        "........KKKKKPHHHHHKKKKK........",
        "........KGGKKAHHHHAKKGGK........",
        ".......KGGGGKADDDDAKGGGGK.......",
        ".......KGGGGKAAAAAAKGGGGK.......",
        ".......KGGKPPHHHHHHPPKGGK.......",
        "......KGGKPHHHHHHHHHHPKGGK......",
        ".......KKKVVVVVVVVVVVVKKK.......",
        ".........KUVVVVVVVVVVUK.........",
        ".........KHHHHHHHHHHHHK.........",
        ".........KAHHHHHHHHHHAK.........",
        ".........KVVVVVVVVVVVVK.........",
        ".........KUVVVVVVVVVVUK.........",
        "..........KHHHHHHHHHHK..........",
        "..........KAHHHHHHHHAK..........",
        "..........KVVVVVVVVVVK..........",
        "...........KUVVVVVVUK...........",
        "............KAHHHHAK............",
        ".............KAHAK..............",
        "...............KK..............."
      ]
    },

    /**
     * ドロガメ。沼の壁役。
     *
     * ★ 「硬い」を甲羅の**模様**で伝える。
     *   最初は丸いドームだけで描いたが、遠目には苔むした岩と区別がつかなかった。
     *   影の色（D）で甲羅を6枚の板に割ってある。この線が入るだけで甲羅に見える。
     *
     * 甲羅は緑、体と脚は泥の色（B系）。材質を分けないと一続きの塊になる
     * （キノコンの傘と柄を分けたのと同じ理由）。
     */
    mudTurtle: {
      palette: {
        ".": null,
        "K": "#0d1207",   // 輪郭
        "N": "#23301a",   // 甲羅の下側（いちばん深い影）
        "D": "#3d5226",   // 甲羅の板のさかい
        "A": "#5f7a33",   // 甲羅
        "H": "#86a344",   // 甲羅の光の当たる面
        "P": "#b4cc63",   // 甲羅のてっぺん
        "M": "#3a2c18",   // 体の影（泥）
        "B": "#6b5636",   // 体（泥色）
        "Y": "#937c4e",   // 体の光の当たる面
        "W": "#ffe36e"    // 目
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "..........KKKKKKKKKKKK..........",
        ".......KKKPPPPPPPPPPPPKKK.......",
        ".....KKPPPPPHHHHHHHHPPPPPKK.....",
        "....KPPPHHHHHHHHHHHHHHHHPPPK....",
        "...KPPHHHHHHHDDDDDDHHHHHHHPPK...",
        "..KPHHHHHHDDDAAAAAADDDHHHHHHPK..",
        "..KHHHHHDDDAAAAAAAAAADDDHHHHHK..",
        ".KHHHHDDDAAAAAAAAAAAAAADDDHHHHK.",
        ".KHHHDDDAAAAAAAAAAAAAAAADDDHHHK.",
        ".KHHDDDAAAADDAAAAAADDAAAADDDHHK.",
        ".KHDDDAAAAADDAAAAAADDAAAAADDDHK.",
        ".KDDDAAAAAADDAAAAAADDAAAAAADDDK.",
        ".KDDNNNNNNNNNNNNNNNNNNNNNNNNDDK.",
        "..KKNNNNNNNNNNNNNNNNNNNNNNNNKK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK...",
        "....KYYYK...KYYYYYYK...KYYYK....",
        "...KYYYYYK.KYYWWYYWWYYK.KYYYYYK.",
        "...KYBBBYK.KYBWWBBWWBYK.KYBBBYK.",
        "...KBBBBBK.KBBBBBBBBBBK.KBBBBBK.",
        "...KBBMBBK.KBBMMMMMMBBK.KBBMBBK.",
        "...KMMMMMK..KMMMMMMMMK..KMMMMMK.",
        "....KKKKK....KKKKKKKK....KKKKK..",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * ドロガメの動くコマ（RC-1）。頭・前脚を元の絵から切り出して動かした。甲羅（5〜19行）は1マスも変えていない。
     *   頭 … 20〜26行の11〜22列。前脚 … 左は2〜9列、右は23〜30列（同じ行）。
     *   頭と脚を先に描き、甲羅を上から重ねる。19行より上へ動かした部分は甲羅の中へ入って見えなくなる（描かない）
     *   NeckOut … 頭の1行目を複製して、首を1段伸ばした（待機で息をする）
     *   Blink   … 目の上の行を体の色に、下の行を K にして目を閉じた
     *   Peek    … 頭を2段・脚を3段、甲羅へ引っ込めた（目だけのぞく）。Sleep はこれで目を閉じた姿（図鑑「気がつくと居眠りしている」）
     *   Hide    … 頭と脚を4段引っ込め、甲羅にこもった
     *   Bite    … 首を伸ばし、口の行の下に口の中（暗い赤 R、白い牙 I）を2行はさんで、あごを下げた。体当たり・毒の息
     *   StompL / StompR … 片方の前脚を2段上げた（足踏み）
     */
    mudTurtleNeckOut: {
      palette: {
        ".": null, "K": "#0d1207", "N": "#23301a", "D": "#3d5226", "A": "#5f7a33", "H": "#86a344",
        "P": "#b4cc63", "M": "#3a2c18", "B": "#6b5636", "Y": "#937c4e", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "..........KKKKKKKKKKKK..........",
        ".......KKKPPPPPPPPPPPPKKK.......",
        ".....KKPPPPPHHHHHHHHPPPPPKK.....",
        "....KPPPHHHHHHHHHHHHHHHHPPPK....",
        "...KPPHHHHHHHDDDDDDHHHHHHHPPK...",
        "..KPHHHHHHDDDAAAAAADDDHHHHHHPK..",
        "..KHHHHHDDDAAAAAAAAAADDDHHHHHK..",
        ".KHHHHDDDAAAAAAAAAAAAAADDDHHHHK.",
        ".KHHHDDDAAAAAAAAAAAAAAAADDDHHHK.",
        ".KHHDDDAAAADDAAAAAADDAAAADDDHHK.",
        ".KHDDDAAAAADDAAAAAADDAAAAADDDHK.",
        ".KDDDAAAAAADDAAAAAADDAAAAAADDDK.",
        ".KDDNNNNNNNNNNNNNNNNNNNNNNNNDDK.",
        "..KKNNNNNNNNNNNNNNNNNNNNNNNNKK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK...",
        "....KYYYK...KYYYYYYK...KYYYK....",
        "...KYYYYYK..KYYYYYYK....KYYYYYK.",
        "...KYBBBYK.KYYWWYYWWYYK.KYBBBYK.",
        "...KBBBBBK.KYBWWBBWWBYK.KBBBBBK.",
        "...KBBMBBK.KBBBBBBBBBBK.KBBMBBK.",
        "...KMMMMMK.KBBMMMMMMBBK.KMMMMMK.",
        "....KKKKK...KMMMMMMMMK...KKKKK..",
        ".............KKKKKKKK...........",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    mudTurtleBlink: {
      palette: {
        ".": null, "K": "#0d1207", "N": "#23301a", "D": "#3d5226", "A": "#5f7a33", "H": "#86a344",
        "P": "#b4cc63", "M": "#3a2c18", "B": "#6b5636", "Y": "#937c4e", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "..........KKKKKKKKKKKK..........",
        ".......KKKPPPPPPPPPPPPKKK.......",
        ".....KKPPPPPHHHHHHHHPPPPPKK.....",
        "....KPPPHHHHHHHHHHHHHHHHPPPK....",
        "...KPPHHHHHHHDDDDDDHHHHHHHPPK...",
        "..KPHHHHHHDDDAAAAAADDDHHHHHHPK..",
        "..KHHHHHDDDAAAAAAAAAADDDHHHHHK..",
        ".KHHHHDDDAAAAAAAAAAAAAADDDHHHHK.",
        ".KHHHDDDAAAAAAAAAAAAAAAADDDHHHK.",
        ".KHHDDDAAAADDAAAAAADDAAAADDDHHK.",
        ".KHDDDAAAAADDAAAAAADDAAAAADDDHK.",
        ".KDDDAAAAAADDAAAAAADDAAAAAADDDK.",
        ".KDDNNNNNNNNNNNNNNNNNNNNNNNNDDK.",
        "..KKNNNNNNNNNNNNNNNNNNNNNNNNKK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK...",
        "....KYYYK...KYYYYYYK...KYYYK....",
        "...KYYYYYK.KYYYYYYYYYYK.KYYYYYK.",
        "...KYBBBYK.KYBKKBBKKBYK.KYBBBYK.",
        "...KBBBBBK.KBBBBBBBBBBK.KBBBBBK.",
        "...KBBMBBK.KBBMMMMMMBBK.KBBMBBK.",
        "...KMMMMMK..KMMMMMMMMK..KMMMMMK.",
        "....KKKKK....KKKKKKKK....KKKKK..",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    mudTurtlePeek: {
      palette: {
        ".": null, "K": "#0d1207", "N": "#23301a", "D": "#3d5226", "A": "#5f7a33", "H": "#86a344",
        "P": "#b4cc63", "M": "#3a2c18", "B": "#6b5636", "Y": "#937c4e", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "..........KKKKKKKKKKKK..........",
        ".......KKKPPPPPPPPPPPPKKK.......",
        ".....KKPPPPPHHHHHHHHPPPPPKK.....",
        "....KPPPHHHHHHHHHHHHHHHHPPPK....",
        "...KPPHHHHHHHDDDDDDHHHHHHHPPK...",
        "..KPHHHHHHDDDAAAAAADDDHHHHHHPK..",
        "..KHHHHHDDDAAAAAAAAAADDDHHHHHK..",
        ".KHHHHDDDAAAAAAAAAAAAAADDDHHHHK.",
        ".KHHHDDDAAAAAAAAAAAAAAAADDDHHHK.",
        ".KHHDDDAAAADDAAAAAADDAAAADDDHHK.",
        ".KHDDDAAAAADDAAAAAADDAAAAADDDHK.",
        ".KDDDAAAAAADDAAAAAADDAAAAAADDDK.",
        ".KDDNNNNNNNNNNNNNNNNNNNNNNNNDDK.",
        "..KKNNNNNNNNNNNNNNNNNNNNNNNNKK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK...",
        "...KBBBBBK.KYBWWBBWWBYK.KBBBBBK.",
        "...KBBMBBK.KBBBBBBBBBBK.KBBMBBK.",
        "...KMMMMMK.KBBMMMMMMBBK.KMMMMMK.",
        "....KKKKK...KMMMMMMMMK...KKKKK..",
        ".............KKKKKKKK...........",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    mudTurtleHide: {
      palette: {
        ".": null, "K": "#0d1207", "N": "#23301a", "D": "#3d5226", "A": "#5f7a33", "H": "#86a344",
        "P": "#b4cc63", "M": "#3a2c18", "B": "#6b5636", "Y": "#937c4e", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "..........KKKKKKKKKKKK..........",
        ".......KKKPPPPPPPPPPPPKKK.......",
        ".....KKPPPPPHHHHHHHHPPPPPKK.....",
        "....KPPPHHHHHHHHHHHHHHHHPPPK....",
        "...KPPHHHHHHHDDDDDDHHHHHHHPPK...",
        "..KPHHHHHHDDDAAAAAADDDHHHHHHPK..",
        "..KHHHHHDDDAAAAAAAAAADDDHHHHHK..",
        ".KHHHHDDDAAAAAAAAAAAAAADDDHHHHK.",
        ".KHHHDDDAAAAAAAAAAAAAAAADDDHHHK.",
        ".KHHDDDAAAADDAAAAAADDAAAADDDHHK.",
        ".KHDDDAAAAADDAAAAAADDAAAAADDDHK.",
        ".KDDDAAAAAADDAAAAAADDAAAAAADDDK.",
        ".KDDNNNNNNNNNNNNNNNNNNNNNNNNDDK.",
        "..KKNNNNNNNNNNNNNNNNNNNNNNNNKK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK...",
        "...KBBMBBK.KBBMMMMMMBBK.KBBMBBK.",
        "...KMMMMMK..KMMMMMMMMK..KMMMMMK.",
        "....KKKKK....KKKKKKKK....KKKKK..",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    mudTurtleBite: {
      palette: {
        ".": null, "K": "#0d1207", "N": "#23301a", "D": "#3d5226", "A": "#5f7a33", "H": "#86a344",
        "P": "#b4cc63", "M": "#3a2c18", "B": "#6b5636", "Y": "#937c4e", "W": "#ffe36e",
        "R": "#5a1a10", "I": "#e8e0c8"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "..........KKKKKKKKKKKK..........",
        ".......KKKPPPPPPPPPPPPKKK.......",
        ".....KKPPPPPHHHHHHHHPPPPPKK.....",
        "....KPPPHHHHHHHHHHHHHHHHPPPK....",
        "...KPPHHHHHHHDDDDDDHHHHHHHPPK...",
        "..KPHHHHHHDDDAAAAAADDDHHHHHHPK..",
        "..KHHHHHDDDAAAAAAAAAADDDHHHHHK..",
        ".KHHHHDDDAAAAAAAAAAAAAADDDHHHHK.",
        ".KHHHDDDAAAAAAAAAAAAAAAADDDHHHK.",
        ".KHHDDDAAAADDAAAAAADDAAAADDDHHK.",
        ".KHDDDAAAAADDAAAAAADDAAAAADDDHK.",
        ".KDDDAAAAAADDAAAAAADDAAAAAADDDK.",
        ".KDDNNNNNNNNNNNNNNNNNNNNNNNNDDK.",
        "..KKNNNNNNNNNNNNNNNNNNNNNNNNKK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK...",
        "....KYYYK...KYYYYYYK...KYYYK....",
        "...KYYYYYK..KYYYYYYK....KYYYYYK.",
        "...KYBBBYK.KYYWWYYWWYYK.KYBBBYK.",
        "...KBBBBBK.KYBWWBBWWBYK.KBBBBBK.",
        "...KBBMBBK.KBBBBBBBBBBK.KBBMBBK.",
        "...KMMMMMK.KBIRRRRRRIBK.KMMMMMK.",
        "....KKKKK...KRRRRRRRRK...KKKKK..",
        "...........KBBMMMMMMBBK.........",
        "............KMMMMMMMMK..........",
        ".............KKKKKKKK...........",
        "................................",
        "................................"
      ]
    },

    mudTurtleStompL: {
      palette: {
        ".": null, "K": "#0d1207", "N": "#23301a", "D": "#3d5226", "A": "#5f7a33", "H": "#86a344",
        "P": "#b4cc63", "M": "#3a2c18", "B": "#6b5636", "Y": "#937c4e", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "..........KKKKKKKKKKKK..........",
        ".......KKKPPPPPPPPPPPPKKK.......",
        ".....KKPPPPPHHHHHHHHPPPPPKK.....",
        "....KPPPHHHHHHHHHHHHHHHHPPPK....",
        "...KPPHHHHHHHDDDDDDHHHHHHHPPK...",
        "..KPHHHHHHDDDAAAAAADDDHHHHHHPK..",
        "..KHHHHHDDDAAAAAAAAAADDDHHHHHK..",
        ".KHHHHDDDAAAAAAAAAAAAAADDDHHHHK.",
        ".KHHHDDDAAAAAAAAAAAAAAAADDDHHHK.",
        ".KHHDDDAAAADDAAAAAADDAAAADDDHHK.",
        ".KHDDDAAAAADDAAAAAADDAAAAADDDHK.",
        ".KDDDAAAAAADDAAAAAADDAAAAAADDDK.",
        ".KDDNNNNNNNNNNNNNNNNNNNNNNNNDDK.",
        "..KKNNNNNNNNNNNNNNNNNNNNNNNNKK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK...",
        "...KYBBBYK..KYYYYYYK...KYYYK....",
        "...KBBBBBK.KYYWWYYWWYYK.KYYYYYK.",
        "...KBBMBBK.KYBWWBBWWBYK.KYBBBYK.",
        "...KMMMMMK.KBBBBBBBBBBK.KBBBBBK.",
        "....KKKKK..KBBMMMMMMBBK.KBBMBBK.",
        "............KMMMMMMMMK..KMMMMMK.",
        ".............KKKKKKKK....KKKKK..",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    mudTurtleStompR: {
      palette: {
        ".": null, "K": "#0d1207", "N": "#23301a", "D": "#3d5226", "A": "#5f7a33", "H": "#86a344",
        "P": "#b4cc63", "M": "#3a2c18", "B": "#6b5636", "Y": "#937c4e", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "..........KKKKKKKKKKKK..........",
        ".......KKKPPPPPPPPPPPPKKK.......",
        ".....KKPPPPPHHHHHHHHPPPPPKK.....",
        "....KPPPHHHHHHHHHHHHHHHHPPPK....",
        "...KPPHHHHHHHDDDDDDHHHHHHHPPK...",
        "..KPHHHHHHDDDAAAAAADDDHHHHHHPK..",
        "..KHHHHHDDDAAAAAAAAAADDDHHHHHK..",
        ".KHHHHDDDAAAAAAAAAAAAAADDDHHHHK.",
        ".KHHHDDDAAAAAAAAAAAAAAAADDDHHHK.",
        ".KHHDDDAAAADDAAAAAADDAAAADDDHHK.",
        ".KHDDDAAAAADDAAAAAADDAAAAADDDHK.",
        ".KDDDAAAAAADDAAAAAADDAAAAAADDDK.",
        ".KDDNNNNNNNNNNNNNNNNNNNNNNNNDDK.",
        "..KKNNNNNNNNNNNNNNNNNNNNNNNNKK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK...",
        "....KYYYK...KYYYYYYK....KYBBBYK.",
        "...KYYYYYK.KYYWWYYWWYYK.KBBBBBK.",
        "...KYBBBYK.KYBWWBBWWBYK.KBBMBBK.",
        "...KBBBBBK.KBBBBBBBBBBK.KMMMMMK.",
        "...KBBMBBK.KBBMMMMMMBBK..KKKKK..",
        "...KMMMMMK..KMMMMMMMMK..........",
        "....KKKKK....KKKKKKKK...........",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    mudTurtleSleep: {
      palette: {
        ".": null, "K": "#0d1207", "N": "#23301a", "D": "#3d5226", "A": "#5f7a33", "H": "#86a344",
        "P": "#b4cc63", "M": "#3a2c18", "B": "#6b5636", "Y": "#937c4e", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "..........KKKKKKKKKKKK..........",
        ".......KKKPPPPPPPPPPPPKKK.......",
        ".....KKPPPPPHHHHHHHHPPPPPKK.....",
        "....KPPPHHHHHHHHHHHHHHHHPPPK....",
        "...KPPHHHHHHHDDDDDDHHHHHHHPPK...",
        "..KPHHHHHHDDDAAAAAADDDHHHHHHPK..",
        "..KHHHHHDDDAAAAAAAAAADDDHHHHHK..",
        ".KHHHHDDDAAAAAAAAAAAAAADDDHHHHK.",
        ".KHHHDDDAAAAAAAAAAAAAAAADDDHHHK.",
        ".KHHDDDAAAADDAAAAAADDAAAADDDHHK.",
        ".KHDDDAAAAADDAAAAAADDAAAAADDDHK.",
        ".KDDDAAAAAADDAAAAAADDAAAAAADDDK.",
        ".KDDNNNNNNNNNNNNNNNNNNNNNNNNDDK.",
        "..KKNNNNNNNNNNNNNNNNNNNNNNNNKK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK...",
        "...KBBBBBK.KYBKKBBKKBYK.KBBBBBK.",
        "...KBBMBBK.KBBBBBBBBBBK.KBBMBBK.",
        "...KMMMMMK.KBBMMMMMMBBK.KMMMMMK.",
        "....KKKKK...KMMMMMMMMK...KKKKK..",
        ".............KKKKKKKK...........",
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
     * ヌマボネ。沼に沈んだ者の骨。搦め手の役。
     *
     * 下半身は作らず、泥（V/U）に沈んだまま浮いている形にしてある。
     * 脚を描くとただの骸骨になるが、沼から生えていると「この場所のもの」になる。
     * 眼窩だけ毒々しい緑（W）に光らせて、骨の灰色の中で一点だけ目を引かせる。
     */
    marshBone: {
      palette: {
        ".": null,
        "K": "#0a0d10",   // 輪郭
        "N": "#1c2430",   // 肋の奥（いちばん深い影）
        "D": "#3d4a52",   // 骨の影
        "A": "#7a8a90",   // 骨
        "H": "#a8b8bc",   // 骨の光の当たる面
        "P": "#d8e4e0",   // いちばん明るいふち
        "V": "#2a3a1e",   // 沈んでいる泥
        "U": "#465a28",   // 泥の明るいところ
        "W": "#8ce05a"    // 眼窩の光
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "..........KKKKKKKKKKKK..........",
        ".........KPPPPPPPPPPPPK.........",
        "........KPHHHHHHHHHHHHPK........",
        "........KPHHHHHHHHHHHHPK........",
        "........KHHKKKKHHKKKKHHK........",
        "........KHAKWWKHHKWWKAHK........",
        "........KHAKKKKAAKKKKAHK........",
        ".........KAAAAKKKKAAAAK.........",
        ".........KDAAKAKKAKAADK.........",
        "..........KDDDDDDDDDDK..........",
        ".............KAHHAK.............",
        ".............KAHHAK.............",
        "........KKPPPPPPPPPPPPPPKK......",
        ".......KPHHHKKKKKKKKHHHPK.......",
        ".......KAHHKNNNNNNNNKHHAK.......",
        ".......KAHHKNNNNNNNNKHHAK.......",
        ".......KDAAKNNNNNNNNKAADK.......",
        ".......KDAAKNNNNNNNNKAADK.......",
        "........KKDDKNNNNNNKDDKK........",
        "..........KKDDDDDDDDKK..........",
        ".........KUUVVVVVVVVUUK.........",
        "........KUUVVVVVVVVVVUUK........",
        ".......KUUVVVVVVVVVVVVUUK.......",
        "......KUUVVVVVVVVVVVVVVUUK......",
        "......KKVVVVVVVVVVVVVVVVKK......",
        ".......KKKKKKKKKKKKKKKKKK.......",
        "................................"
      ]
    },

    /**
     * ヌマボネの動くコマ（RC-1）。頭蓋（5〜16行。首を含む）・胴（17〜24行）・泥（25〜30行）に分けて動かした。形は描き直していない。
     * 重ねる順は 胴 → 首 → 頭蓋 → 泥（泥は上から重ねるので、沈むと泥の中へ隠れる）。
     *   TiltL / TiltR … 頭蓋を首の付け根（16.5行・15.5列）を軸に5度かしげた。回してずれた輪郭は K で手直しした
     *   Jaw    … 歯と下あご（13〜14行）を2段下げ、空いたところを口の奥の暗い色 N にした（あごが外れたように開く）
     *   Glow   … 眼窩の光を明るい G にし、上下の縁まで W で光らせた（図鑑「嬉しいときに少しだけ明るくなる」）
     *   Rattle … 頭蓋を2段浮かせて首を伸ばし、目を光らせてあごを開けた（骨がかたかた鳴って飛びかかる）
     *   Sink   … 骨を3段沈め、胴の下を泥のふち（24行）でふさいだ（泥へ潜る）
     *   Sleep  … 沈んだうえ頭蓋をもう1段下げ、眼窩の光を暗い E にした
     */
    marshBoneTiltL: {
      palette: {
        ".": null, "K": "#0a0d10", "N": "#1c2430", "D": "#3d4a52", "A": "#7a8a90", "H": "#a8b8bc",
        "P": "#d8e4e0", "V": "#2a3a1e", "U": "#465a28", "W": "#8ce05a"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        ".........KKKKKKKKKKKKK..........",
        ".........KPPPPPPPPPPPPK.........",
        "........KHHHHHHHHHHHHPK.........",
        ".......KPHHHHHHHHHHHHHK.........",
        ".......KPHKKKKHHKKKKHHK.........",
        ".......KHHKWWKHHKWWKAHHK........",
        "........KHAKKKKAAKKKKAK.........",
        "........KHAAAAKKKKAAADK.........",
        ".........KDAAKAKKAKAAK..........",
        ".........KKDDDDDDDDDDK..........",
        ".............KAHHAK.............",
        ".............KAHHAK.............",
        "........KKPPPPPPPPPPPPPPKK......",
        ".......KPHHHKKKKKKKKHHHPK.......",
        ".......KAHHKNNNNNNNNKHHAK.......",
        ".......KAHHKNNNNNNNNKHHAK.......",
        ".......KDAAKNNNNNNNNKAADK.......",
        ".......KDAAKNNNNNNNNKAADK.......",
        "........KKDDKNNNNNNKDDKK........",
        "..........KKDDDDDDDDKK..........",
        ".........KUUVVVVVVVVUUK.........",
        "........KUUVVVVVVVVVVUUK........",
        ".......KUUVVVVVVVVVVVVUUK.......",
        "......KUUVVVVVVVVVVVVVVUUK......",
        "......KKVVVVVVVVVVVVVVVVKK......",
        ".......KKKKKKKKKKKKKKKKKK.......",
        "................................"
      ]
    },

    marshBoneTiltR: {
      palette: {
        ".": null, "K": "#0a0d10", "N": "#1c2430", "D": "#3d4a52", "A": "#7a8a90", "H": "#a8b8bc",
        "P": "#d8e4e0", "V": "#2a3a1e", "U": "#465a28", "W": "#8ce05a"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "...........KKKKKKKKKKK..........",
        ".........KKPPPPPPPPPPPK.........",
        ".........KPHHHHHHHHHHHPK........",
        ".........KPHHHHHHHHHHHHPK.......",
        ".........KHHKKKKHHKKKKHPK.......",
        "........KKHAKWWKHHKWWKHHK.......",
        ".........KAKKKKAAKKKKAHK........",
        ".........KAAAAKKKKAAAAHK........",
        "..........KAAKAKKAKAAAK.........",
        "..........KDDDDDDDDDDDK.........",
        ".............KAHHAK.............",
        ".............KAHHAK.............",
        "........KKPPPPPPPPPPPPPPKK......",
        ".......KPHHHKKKKKKKKHHHPK.......",
        ".......KAHHKNNNNNNNNKHHAK.......",
        ".......KAHHKNNNNNNNNKHHAK.......",
        ".......KDAAKNNNNNNNNKAADK.......",
        ".......KDAAKNNNNNNNNKAADK.......",
        "........KKDDKNNNNNNKDDKK........",
        "..........KKDDDDDDDDKK..........",
        ".........KUUVVVVVVVVUUK.........",
        "........KUUVVVVVVVVVVUUK........",
        ".......KUUVVVVVVVVVVVVUUK.......",
        "......KUUVVVVVVVVVVVVVVUUK......",
        "......KKVVVVVVVVVVVVVVVVKK......",
        ".......KKKKKKKKKKKKKKKKKK.......",
        "................................"
      ]
    },

    marshBoneJaw: {
      palette: {
        ".": null, "K": "#0a0d10", "N": "#1c2430", "D": "#3d4a52", "A": "#7a8a90", "H": "#a8b8bc",
        "P": "#d8e4e0", "V": "#2a3a1e", "U": "#465a28", "W": "#8ce05a"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "..........KKKKKKKKKKKK..........",
        ".........KPPPPPPPPPPPPK.........",
        "........KPHHHHHHHHHHHHPK........",
        "........KPHHHHHHHHHHHHPK........",
        "........KHHKKKKHHKKKKHHK........",
        "........KHAKWWKHHKWWKAHK........",
        "........KHAKKKKAAKKKKAHK........",
        ".........KAAAAKKKKAAAAK.........",
        "..........KNNNNNNNNNNK..........",
        "..........KNNNNNNNNNNK..........",
        ".........KDAAKAHHAKAADK.........",
        "..........KDDKAHHAKDDK..........",
        "........KKPPPPPPPPPPPPPPKK......",
        ".......KPHHHKKKKKKKKHHHPK.......",
        ".......KAHHKNNNNNNNNKHHAK.......",
        ".......KAHHKNNNNNNNNKHHAK.......",
        ".......KDAAKNNNNNNNNKAADK.......",
        ".......KDAAKNNNNNNNNKAADK.......",
        "........KKDDKNNNNNNKDDKK........",
        "..........KKDDDDDDDDKK..........",
        ".........KUUVVVVVVVVUUK.........",
        "........KUUVVVVVVVVVVUUK........",
        ".......KUUVVVVVVVVVVVVUUK.......",
        "......KUUVVVVVVVVVVVVVVUUK......",
        "......KKVVVVVVVVVVVVVVVVKK......",
        ".......KKKKKKKKKKKKKKKKKK.......",
        "................................"
      ]
    },

    marshBoneGlow: {
      palette: {
        ".": null, "K": "#0a0d10", "N": "#1c2430", "D": "#3d4a52", "A": "#7a8a90", "H": "#a8b8bc",
        "P": "#d8e4e0", "V": "#2a3a1e", "U": "#465a28", "W": "#8ce05a", "G": "#d4ff9a"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "..........KKKKKKKKKKKK..........",
        ".........KPPPPPPPPPPPPK.........",
        "........KPHHHHHHHHHHHHPK........",
        "........KPHHHHHHHHHHHHPK........",
        "........KHHKWWKHHKWWKHHK........",
        "........KHAKGGKHHKGGKAHK........",
        "........KHAKWWKAAKWWKAHK........",
        ".........KAAAAKKKKAAAAK.........",
        ".........KDAAKAKKAKAADK.........",
        "..........KDDDDDDDDDDK..........",
        ".............KAHHAK.............",
        ".............KAHHAK.............",
        "........KKPPPPPPPPPPPPPPKK......",
        ".......KPHHHKKKKKKKKHHHPK.......",
        ".......KAHHKNNNNNNNNKHHAK.......",
        ".......KAHHKNNNNNNNNKHHAK.......",
        ".......KDAAKNNNNNNNNKAADK.......",
        ".......KDAAKNNNNNNNNKAADK.......",
        "........KKDDKNNNNNNKDDKK........",
        "..........KKDDDDDDDDKK..........",
        ".........KUUVVVVVVVVUUK.........",
        "........KUUVVVVVVVVVVUUK........",
        ".......KUUVVVVVVVVVVVVUUK.......",
        "......KUUVVVVVVVVVVVVVVUUK......",
        "......KKVVVVVVVVVVVVVVVVKK......",
        ".......KKKKKKKKKKKKKKKKKK.......",
        "................................"
      ]
    },

    marshBoneRattle: {
      palette: {
        ".": null, "K": "#0a0d10", "N": "#1c2430", "D": "#3d4a52", "A": "#7a8a90", "H": "#a8b8bc",
        "P": "#d8e4e0", "V": "#2a3a1e", "U": "#465a28", "W": "#8ce05a", "G": "#d4ff9a"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "..........KKKKKKKKKKKK..........",
        ".........KPPPPPPPPPPPPK.........",
        "........KPHHHHHHHHHHHHPK........",
        "........KPHHHHHHHHHHHHPK........",
        "........KHHKWWKHHKWWKHHK........",
        "........KHAKGGKHHKGGKAHK........",
        "........KHAKWWKAAKWWKAHK........",
        ".........KAAAAKKKKAAAAK.........",
        "..........KNNNNNNNNNNK..........",
        "..........KNNNNNNNNNNK..........",
        ".........KDAAKAHHAKAADK.........",
        "..........KDDKAHHAKDDK..........",
        ".............KAHHAK.............",
        ".............KAHHAK.............",
        "........KKPPPPPPPPPPPPPPKK......",
        ".......KPHHHKKKKKKKKHHHPK.......",
        ".......KAHHKNNNNNNNNKHHAK.......",
        ".......KAHHKNNNNNNNNKHHAK.......",
        ".......KDAAKNNNNNNNNKAADK.......",
        ".......KDAAKNNNNNNNNKAADK.......",
        "........KKDDKNNNNNNKDDKK........",
        "..........KKDDDDDDDDKK..........",
        ".........KUUVVVVVVVVUUK.........",
        "........KUUVVVVVVVVVVUUK........",
        ".......KUUVVVVVVVVVVVVUUK.......",
        "......KUUVVVVVVVVVVVVVVUUK......",
        "......KKVVVVVVVVVVVVVVVVKK......",
        ".......KKKKKKKKKKKKKKKKKK.......",
        "................................"
      ]
    },

    marshBoneSink: {
      palette: {
        ".": null, "K": "#0a0d10", "N": "#1c2430", "D": "#3d4a52", "A": "#7a8a90", "H": "#a8b8bc",
        "P": "#d8e4e0", "V": "#2a3a1e", "U": "#465a28", "W": "#8ce05a"
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
        "..........KKKKKKKKKKKK..........",
        ".........KPPPPPPPPPPPPK.........",
        "........KPHHHHHHHHHHHHPK........",
        "........KPHHHHHHHHHHHHPK........",
        "........KHHKKKKHHKKKKHHK........",
        "........KHAKWWKHHKWWKAHK........",
        "........KHAKKKKAAKKKKAHK........",
        ".........KAAAAKKKKAAAAK.........",
        ".........KDAAKAKKAKAADK.........",
        "..........KDDDDDDDDDDK..........",
        ".............KAHHAK.............",
        ".............KAHHAK.............",
        "........KKPPPPPPPPPPPPPPKK......",
        ".......KPHHHKKKKKKKKHHHPK.......",
        ".......KAHHKNNNNNNNNKHHAK.......",
        ".......KAHHKNNNNNNNNKHHAK.......",
        ".......KUUVVVVVVVVVVVVUUK.......",
        ".........KUUVVVVVVVVUUK.........",
        "........KUUVVVVVVVVVVUUK........",
        ".......KUUVVVVVVVVVVVVUUK.......",
        "......KUUVVVVVVVVVVVVVVUUK......",
        "......KKVVVVVVVVVVVVVVVVKK......",
        ".......KKKKKKKKKKKKKKKKKK.......",
        "................................"
      ]
    },

    marshBoneSleep: {
      palette: {
        ".": null, "K": "#0a0d10", "N": "#1c2430", "D": "#3d4a52", "A": "#7a8a90", "H": "#a8b8bc",
        "P": "#d8e4e0", "V": "#2a3a1e", "U": "#465a28", "E": "#2e3a22"
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
        "..........KKKKKKKKKKKK..........",
        ".........KPPPPPPPPPPPPK.........",
        "........KPHHHHHHHHHHHHPK........",
        "........KPHHHHHHHHHHHHPK........",
        "........KHHKKKKHHKKKKHHK........",
        "........KHAKEEKHHKEEKAHK........",
        "........KHAKKKKAAKKKKAHK........",
        ".........KAAAAKKKKAAAAK.........",
        ".........KDAAKAKKAKAADK.........",
        "..........KDDDDDDDDDDK..........",
        ".............KAHHAK.............",
        "........KKPPPPPPPPPPPPPPKK......",
        ".......KPHHHKKKKKKKKHHHPK.......",
        ".......KAHHKNNNNNNNNKHHAK.......",
        ".......KAHHKNNNNNNNNKHHAK.......",
        ".......KUUVVVVVVVVVVVVUUK.......",
        ".........KUUVVVVVVVVUUK.........",
        "........KUUVVVVVVVVVVUUK........",
        ".......KUUVVVVVVVVVVVVUUK.......",
        "......KUUVVVVVVVVVVVVVVUUK......",
        "......KKVVVVVVVVVVVVVVVVKK......",
        ".......KKKKKKKKKKKKKKKKKK.......",
        "................................"
      ]
    },

    /**
     * ヌシガエル。腐食の毒沼の主。
     *
     * ★ 他の主と形がかぶらないように選んだ姿。
     *   モスゴーレム（縦に長い岩）／マグマウルフ（四つ足の獣）／
     *   キングスライム（丸い塊）／ヨミリュウ（翼）と並べて、
     *   「横に広くて低い」のはこれだけになる。
     *
     * 横幅いっぱいに口を割って、盤面に出たときの圧を出している。
     * 背中のいぼ（E）は毒の色（階段記号と同じ #c8e05a）で、
     * 「この沼の毒はこいつが出している」と見て分かるようにした。
     *
     * 32×32。表示は sizeScale 1.3 で一回り大きく出す（他の主と同じやり方）。
     */
    marshLord: {
      palette: {
        ".": null,
        "K": "#0a1008",   // 輪郭
        "N": "#16240e",   // 腹の下（いちばん深い影）
        "D": "#2c4416",   // 影
        "A": "#4a6b1e",   // 体
        "H": "#6f9128",   // 光の当たる面
        "P": "#9cbb3e",   // いちばん明るいふち（背）
        "V": "#5a2a4a",   // 口の中
        "U": "#8a4a6a",   // 口の中の明るいところ
        "E": "#c8e05a",   // 背中のいぼ（毒）
        "W": "#ffe36e"    // 目
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "........KKKK........KKKK........",
        ".......KPPPPK......KPPPPK.......",
        "......KPWWWWPK....KPWWWWPK......",
        "......KPWWKKWPK..KPWWKKWPK......",
        "......KHWWKKWHK..KHWWKKWHK......",
        ".....KHHHHHHHKKKKKKHHHHHHHK.....",
        "....KPHHHHHHHHHHHHHHHHHHHHPK....",
        "...KPHHHHHHHHHHHHHHHHHHHHHHPK...",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KPHHHHHHHHHHHHHHHHHHHHHHHHPK..",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KHHHHHHHHHHHHHHHHHHHHHHHHHHK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KVVVVVVVVVVVVVVVVVVVVVVVVVVK..",
        "..KUVVVVVVVVVVVVVVVVVVVVVVVVUK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KAHHHHHHHHHHHHHHHHHHHHHHHHAK..",
        "..KAAHHHHHHHHHHHHHHHHHHHHHHAAK..",
        "..KDAAAAAAAAAAAAAAAAAAAAAAAADK..",
        "...KDDAAAAAAAAAAAAAAAAAAAADDK...",
        "....KDDDNNNNNNNNNNNNNNNNDDDK....",
        ".....KKDDDDDDDDDDDDDDDDDDKK.....",
        ".KHHHHHK.KDDDDDDDDDDDDDK.KHHHHHK",
        ".KAHHHAK.KNNNNNNNNNNNNNK.KAHHHAK",
        ".KAAAAAK.KKKKKKKKKKKKKKK.KAAAAAK",
        ".KKKKKKK................KKKKKKK.",
        "................................"
      ]
    },

    /**
     * ヌシガエルの動くコマ（RC-1）。目・口・舌・のど袋を元の絵から動かした。形は描き直していない。
     *   目 … 左は8〜13列、右は19〜24列の7〜9行（黒目は8〜9行の10〜11列・21〜22列）
     *   Blink  … 目の白と黒目を、上から まぶたの明るい色 P → H → 閉じた線 K にした
     *   LookL / LookR … 黒目を1列ずつ横へ（きょろりと見る）
     *   Open / Gape … 口の上（5〜18行。目・頭・上くちびる）を2段／4段持ち上げ、すき間を口の奥の暗い色 R、
     *                 下あごの上に舌 T をのせた（図鑑「口を開けたまま何日も待てる」「丸ごと呑む」）
     *   Tongue … 3段開けた口から、舌を腹の前へ長く伸ばした（先は丸くふくらませた）
     *   Puff   … 腹（21〜25行）を左右へ1列ずつ広げ、のど袋を明るい E でふくらませた（鳴く・息をする）
     *   Happy  … Puff に、目を「∩」の笑い目にしたもの（図鑑「丸ごと呑んでから嬉しそうに鳴く」）
     *   Sleep  … 目を閉じ、口を1段だけ開けたまま眠る
     * 色 R・T は動くコマだけで使う
     */
    marshLordBlink: {
      palette: {
        ".": null, "K": "#0a1008", "N": "#16240e", "D": "#2c4416", "A": "#4a6b1e", "H": "#6f9128",
        "P": "#9cbb3e", "V": "#5a2a4a", "U": "#8a4a6a", "E": "#c8e05a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "........KKKK........KKKK........",
        ".......KPPPPK......KPPPPK.......",
        "......KPPPPPPK....KPPPPPPK......",
        "......KPHHHHHPK..KPHHHHHPK......",
        "......KHKKKKKHK..KHKKKKKHK......",
        ".....KHHHHHHHKKKKKKHHHHHHHK.....",
        "....KPHHHHHHHHHHHHHHHHHHHHPK....",
        "...KPHHHHHHHHHHHHHHHHHHHHHHPK...",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KPHHHHHHHHHHHHHHHHHHHHHHHHPK..",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KHHHHHHHHHHHHHHHHHHHHHHHHHHK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KVVVVVVVVVVVVVVVVVVVVVVVVVVK..",
        "..KUVVVVVVVVVVVVVVVVVVVVVVVVUK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KAHHHHHHHHHHHHHHHHHHHHHHHHAK..",
        "..KAAHHHHHHHHHHHHHHHHHHHHHHAAK..",
        "..KDAAAAAAAAAAAAAAAAAAAAAAAADK..",
        "...KDDAAAAAAAAAAAAAAAAAAAADDK...",
        "....KDDDNNNNNNNNNNNNNNNNDDDK....",
        ".....KKDDDDDDDDDDDDDDDDDDKK.....",
        ".KHHHHHK.KDDDDDDDDDDDDDK.KHHHHHK",
        ".KAHHHAK.KNNNNNNNNNNNNNK.KAHHHAK",
        ".KAAAAAK.KKKKKKKKKKKKKKK.KAAAAAK",
        ".KKKKKKK................KKKKKKK.",
        "................................"
      ]
    },

    marshLordLookL: {
      palette: {
        ".": null, "K": "#0a1008", "N": "#16240e", "D": "#2c4416", "A": "#4a6b1e", "H": "#6f9128",
        "P": "#9cbb3e", "V": "#5a2a4a", "U": "#8a4a6a", "E": "#c8e05a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "........KKKK........KKKK........",
        ".......KPPPPK......KPPPPK.......",
        "......KPWWWWPK....KPWWWWPK......",
        "......KPWKKWWPK..KPWKKWWPK......",
        "......KHWKKWWHK..KHWKKWWHK......",
        ".....KHHHHHHHKKKKKKHHHHHHHK.....",
        "....KPHHHHHHHHHHHHHHHHHHHHPK....",
        "...KPHHHHHHHHHHHHHHHHHHHHHHPK...",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KPHHHHHHHHHHHHHHHHHHHHHHHHPK..",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KHHHHHHHHHHHHHHHHHHHHHHHHHHK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KVVVVVVVVVVVVVVVVVVVVVVVVVVK..",
        "..KUVVVVVVVVVVVVVVVVVVVVVVVVUK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KAHHHHHHHHHHHHHHHHHHHHHHHHAK..",
        "..KAAHHHHHHHHHHHHHHHHHHHHHHAAK..",
        "..KDAAAAAAAAAAAAAAAAAAAAAAAADK..",
        "...KDDAAAAAAAAAAAAAAAAAAAADDK...",
        "....KDDDNNNNNNNNNNNNNNNNDDDK....",
        ".....KKDDDDDDDDDDDDDDDDDDKK.....",
        ".KHHHHHK.KDDDDDDDDDDDDDK.KHHHHHK",
        ".KAHHHAK.KNNNNNNNNNNNNNK.KAHHHAK",
        ".KAAAAAK.KKKKKKKKKKKKKKK.KAAAAAK",
        ".KKKKKKK................KKKKKKK.",
        "................................"
      ]
    },

    marshLordLookR: {
      palette: {
        ".": null, "K": "#0a1008", "N": "#16240e", "D": "#2c4416", "A": "#4a6b1e", "H": "#6f9128",
        "P": "#9cbb3e", "V": "#5a2a4a", "U": "#8a4a6a", "E": "#c8e05a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "........KKKK........KKKK........",
        ".......KPPPPK......KPPPPK.......",
        "......KPWWWWPK....KPWWWWPK......",
        "......KPWWWKKPK..KPWWWKKPK......",
        "......KHWWWKKHK..KHWWWKKHK......",
        ".....KHHHHHHHKKKKKKHHHHHHHK.....",
        "....KPHHHHHHHHHHHHHHHHHHHHPK....",
        "...KPHHHHHHHHHHHHHHHHHHHHHHPK...",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KPHHHHHHHHHHHHHHHHHHHHHHHHPK..",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KHHHHHHHHHHHHHHHHHHHHHHHHHHK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KVVVVVVVVVVVVVVVVVVVVVVVVVVK..",
        "..KUVVVVVVVVVVVVVVVVVVVVVVVVUK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KAHHHHHHHHHHHHHHHHHHHHHHHHAK..",
        "..KAAHHHHHHHHHHHHHHHHHHHHHHAAK..",
        "..KDAAAAAAAAAAAAAAAAAAAAAAAADK..",
        "...KDDAAAAAAAAAAAAAAAAAAAADDK...",
        "....KDDDNNNNNNNNNNNNNNNNDDDK....",
        ".....KKDDDDDDDDDDDDDDDDDDKK.....",
        ".KHHHHHK.KDDDDDDDDDDDDDK.KHHHHHK",
        ".KAHHHAK.KNNNNNNNNNNNNNK.KAHHHAK",
        ".KAAAAAK.KKKKKKKKKKKKKKK.KAAAAAK",
        ".KKKKKKK................KKKKKKK.",
        "................................"
      ]
    },

    marshLordOpen: {
      palette: {
        ".": null, "K": "#0a1008", "N": "#16240e", "D": "#2c4416", "A": "#4a6b1e", "H": "#6f9128",
        "P": "#9cbb3e", "V": "#5a2a4a", "U": "#8a4a6a", "E": "#c8e05a", "W": "#ffe36e",
        "R": "#3a1028", "T": "#e07aa0"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "........KKKK........KKKK........",
        ".......KPPPPK......KPPPPK.......",
        "......KPWWWWPK....KPWWWWPK......",
        "......KPWWKKWPK..KPWWKKWPK......",
        "......KHWWKKWHK..KHWWKKWHK......",
        ".....KHHHHHHHKKKKKKHHHHHHHK.....",
        "....KPHHHHHHHHHHHHHHHHHHHHPK....",
        "...KPHHHHHHHHHHHHHHHHHHHHHHPK...",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KPHHHHHHHHHHHHHHHHHHHHHHHHPK..",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KHHHHHHHHHHHHHHHHHHHHHHHHHHK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KVVVVVVVVVVVVVVVVVVVVVVVVVVK..",
        "..KRRRRRRRRRTTTTTTTTRRRRRRRRRK..",
        "..KRRRRRRRRTTTTTTTTTTRRRRRRRRK..",
        "..KUVVVVVVVVVVVVVVVVVVVVVVVVUK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KAHHHHHHHHHHHHHHHHHHHHHHHHAK..",
        "..KAAHHHHHHHHHHHHHHHHHHHHHHAAK..",
        "..KDAAAAAAAAAAAAAAAAAAAAAAAADK..",
        "...KDDAAAAAAAAAAAAAAAAAAAADDK...",
        "....KDDDNNNNNNNNNNNNNNNNDDDK....",
        ".....KKDDDDDDDDDDDDDDDDDDKK.....",
        ".KHHHHHK.KDDDDDDDDDDDDDK.KHHHHHK",
        ".KAHHHAK.KNNNNNNNNNNNNNK.KAHHHAK",
        ".KAAAAAK.KKKKKKKKKKKKKKK.KAAAAAK",
        ".KKKKKKK................KKKKKKK.",
        "................................"
      ]
    },

    marshLordGape: {
      palette: {
        ".": null, "K": "#0a1008", "N": "#16240e", "D": "#2c4416", "A": "#4a6b1e", "H": "#6f9128",
        "P": "#9cbb3e", "V": "#5a2a4a", "U": "#8a4a6a", "E": "#c8e05a", "W": "#ffe36e",
        "R": "#3a1028", "T": "#e07aa0"
      },
      pixels: [
        "................................",
        "........KKKK........KKKK........",
        ".......KPPPPK......KPPPPK.......",
        "......KPWWWWPK....KPWWWWPK......",
        "......KPWWKKWPK..KPWWKKWPK......",
        "......KHWWKKWHK..KHWWKKWHK......",
        ".....KHHHHHHHKKKKKKHHHHHHHK.....",
        "....KPHHHHHHHHHHHHHHHHHHHHPK....",
        "...KPHHHHHHHHHHHHHHHHHHHHHHPK...",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KPHHHHHHHHHHHHHHHHHHHHHHHHPK..",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KHHHHHHHHHHHHHHHHHHHHHHHHHHK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KVVVVVVVVVVVVVVVVVVVVVVVVVVK..",
        "..KRRRRRRRRRRRRRRRRRRRRRRRRRRK..",
        "..KRRRRRRRRRRRRRRRRRRRRRRRRRRK..",
        "..KRRRRRRRRRTTTTTTTTRRRRRRRRRK..",
        "..KRRRRRRRRTTTTTTTTTTRRRRRRRRK..",
        "..KUVVVVVVVVVVVVVVVVVVVVVVVVUK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KAHHHHHHHHHHHHHHHHHHHHHHHHAK..",
        "..KAAHHHHHHHHHHHHHHHHHHHHHHAAK..",
        "..KDAAAAAAAAAAAAAAAAAAAAAAAADK..",
        "...KDDAAAAAAAAAAAAAAAAAAAADDK...",
        "....KDDDNNNNNNNNNNNNNNNNDDDK....",
        ".....KKDDDDDDDDDDDDDDDDDDKK.....",
        ".KHHHHHK.KDDDDDDDDDDDDDK.KHHHHHK",
        ".KAHHHAK.KNNNNNNNNNNNNNK.KAHHHAK",
        ".KAAAAAK.KKKKKKKKKKKKKKK.KAAAAAK",
        ".KKKKKKK................KKKKKKK.",
        "................................"
      ]
    },

    marshLordTongue: {
      palette: {
        ".": null, "K": "#0a1008", "N": "#16240e", "D": "#2c4416", "A": "#4a6b1e", "H": "#6f9128",
        "P": "#9cbb3e", "V": "#5a2a4a", "U": "#8a4a6a", "E": "#c8e05a", "W": "#ffe36e",
        "R": "#3a1028", "T": "#e07aa0"
      },
      pixels: [
        "................................",
        "................................",
        "........KKKK........KKKK........",
        ".......KPPPPK......KPPPPK.......",
        "......KPWWWWPK....KPWWWWPK......",
        "......KPWWKKWPK..KPWWKKWPK......",
        "......KHWWKKWHK..KHWWKKWHK......",
        ".....KHHHHHHHKKKKKKHHHHHHHK.....",
        "....KPHHHHHHHHHHHHHHHHHHHHPK....",
        "...KPHHHHHHHHHHHHHHHHHHHHHHPK...",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KPHHHHHHHHHHHHHHHHHHHHHHHHPK..",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KHHHHHHHHHHHHHHHHHHHHHHHHHHK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KVVVVVVVVVVVVVVVVVVVVVVVVVVK..",
        "..KRRRRRRRRRRRRRRRRRRRRRRRRRRK..",
        "..KRRRRRRRRRTTTTTTTTRRRRRRRRRK..",
        "..KRRRRRRRRTTTTTTTTTTRRRRRRRRK..",
        "..KUVVVVVVVVVVKTTKVVVVVVVVVVUK..",
        "..KKKKKKKKKKKKKTTKKKKKKKKKKKKK..",
        "..KAHHHHHHHHHHKTTKHHHHHHHHHHAK..",
        "..KAAHHHHHHHHHKTTKHHHHHHHHHAAK..",
        "..KDAAAAAAAAAAKTTKAAAAAAAAAADK..",
        "...KDDAAAAAAAAKTTKAAAAAAAADDK...",
        "....KDDDNNNNNNKTTKNNNNNNDDDK....",
        ".....KKDDDDDDKKTTKKDDDDDDKK.....",
        ".KHHHHHK.KDDDKTTTTKDDDDK.KHHHHHK",
        ".KAHHHAK.KNNNKTTTTKNNNNK.KAHHHAK",
        ".KAAAAAK.KKKKKTTTTKKKKKK.KAAAAAK",
        ".KKKKKKK......KKKK......KKKKKKK.",
        "................................"
      ]
    },

    marshLordPuff: {
      palette: {
        ".": null, "K": "#0a1008", "N": "#16240e", "D": "#2c4416", "A": "#4a6b1e", "H": "#6f9128",
        "P": "#9cbb3e", "V": "#5a2a4a", "U": "#8a4a6a", "E": "#c8e05a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "........KKKK........KKKK........",
        ".......KPPPPK......KPPPPK.......",
        "......KPWWWWPK....KPWWWWPK......",
        "......KPWWKKWPK..KPWWKKWPK......",
        "......KHWWKKWHK..KHWWKKWHK......",
        ".....KHHHHHHHKKKKKKHHHHHHHK.....",
        "....KPHHHHHHHHHHHHHHHHHHHHPK....",
        "...KPHHHHHHHHHHHHHHHHHHHHHHPK...",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KPHHHHHHHHHHHHHHHHHHHHHHHHPK..",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KHHHHHHHHHHHHHHHHHHHHHHHHHHK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KVVVVVVVVVVVVVVVVVVVVVVVVVVK..",
        "..KUVVVVVVVVVVVVVVVVVVVVVVVVUK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        ".KAHHHHHHHHHHPPPPPPHHHHHHHHHHAK.",
        ".KAAHHHHHHHEEEEEEEEEEHHHHHHHAAK.",
        ".KDAAAAAAAAEEEEEEEEEEAAAAAAAADK.",
        "..KDDAAAAAAAAEEEEEEAAAAAAAADDK..",
        "...KDDDNNNNNNNNNNNNNNNNNNDDDK...",
        ".....KKDDDDDDDDDDDDDDDDDDKK.....",
        ".KHHHHHK.KDDDDDDDDDDDDDK.KHHHHHK",
        ".KAHHHAK.KNNNNNNNNNNNNNK.KAHHHAK",
        ".KAAAAAK.KKKKKKKKKKKKKKK.KAAAAAK",
        ".KKKKKKK................KKKKKKK.",
        "................................"
      ]
    },

    marshLordHappy: {
      palette: {
        ".": null, "K": "#0a1008", "N": "#16240e", "D": "#2c4416", "A": "#4a6b1e", "H": "#6f9128",
        "P": "#9cbb3e", "V": "#5a2a4a", "U": "#8a4a6a", "E": "#c8e05a", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "........KKKK........KKKK........",
        ".......KPPPPK......KPPPPK.......",
        "......KPPPKKPK....KPPKKPPK......",
        "......KPPKPPKPK..KPPKPPKPK......",
        "......KHPPPPPHK..KHPPPPPHK......",
        ".....KHHHHHHHKKKKKKHHHHHHHK.....",
        "....KPHHHHHHHHHHHHHHHHHHHHPK....",
        "...KPHHHHHHHHHHHHHHHHHHHHHHPK...",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KPHHHHHHHHHHHHHHHHHHHHHHHHPK..",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KHHHHHHHHHHHHHHHHHHHHHHHHHHK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KVVVVVVVVVVVVVVVVVVVVVVVVVVK..",
        "..KUVVVVVVVVVVVVVVVVVVVVVVVVUK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        ".KAHHHHHHHHHHPPPPPPHHHHHHHHHHAK.",
        ".KAAHHHHHHHEEEEEEEEEEHHHHHHHAAK.",
        ".KDAAAAAAAAEEEEEEEEEEAAAAAAAADK.",
        "..KDDAAAAAAAAEEEEEEAAAAAAAADDK..",
        "...KDDDNNNNNNNNNNNNNNNNNNDDDK...",
        ".....KKDDDDDDDDDDDDDDDDDDKK.....",
        ".KHHHHHK.KDDDDDDDDDDDDDK.KHHHHHK",
        ".KAHHHAK.KNNNNNNNNNNNNNK.KAHHHAK",
        ".KAAAAAK.KKKKKKKKKKKKKKK.KAAAAAK",
        ".KKKKKKK................KKKKKKK.",
        "................................"
      ]
    },

    marshLordSleep: {
      palette: {
        ".": null, "K": "#0a1008", "N": "#16240e", "D": "#2c4416", "A": "#4a6b1e", "H": "#6f9128",
        "P": "#9cbb3e", "V": "#5a2a4a", "U": "#8a4a6a", "E": "#c8e05a",
        "R": "#3a1028", "T": "#e07aa0"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "........KKKK........KKKK........",
        ".......KPPPPK......KPPPPK.......",
        "......KPPPPPPK....KPPPPPPK......",
        "......KPHHHHHPK..KPHHHHHPK......",
        "......KHKKKKKHK..KHKKKKKHK......",
        ".....KHHHHHHHKKKKKKHHHHHHHK.....",
        "....KPHHHHHHHHHHHHHHHHHHHHPK....",
        "...KPHHHHHHHHHHHHHHHHHHHHHHPK...",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KPHHHHHHHHHHHHHHHHHHHHHHHHPK..",
        "..KPHHEHHHHHHHHHHHHHHHHHEHHHPK..",
        "..KHHHHHHHHHHHHHHHHHHHHHHHHHHK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KVVVVVVVVVVVVVVVVVVVVVVVVVVK..",
        "..KRRRRRRRRTTTTTTTTTTRRRRRRRRK..",
        "..KUVVVVVVVVVVVVVVVVVVVVVVVVUK..",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
        "..KAHHHHHHHHHHHHHHHHHHHHHHHHAK..",
        "..KAAHHHHHHHHHHHHHHHHHHHHHHAAK..",
        "..KDAAAAAAAAAAAAAAAAAAAAAAAADK..",
        "...KDDAAAAAAAAAAAAAAAAAAAADDK...",
        "....KDDDNNNNNNNNNNNNNNNNDDDK....",
        ".....KKDDDDDDDDDDDDDDDDDDKK.....",
        ".KHHHHHK.KDDDDDDDDDDDDDK.KHHHHHK",
        ".KAHHHAK.KNNNNNNNNNNNNNK.KAHHHAK",
        ".KAAAAAK.KKKKKKKKKKKKKKK.KAAAAAK",
        ".KKKKKKK................KKKKKKK.",
        "................................"
      ]
    }
  });
})(window.MyGame);
