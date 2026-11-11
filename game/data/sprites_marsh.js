/**
 * sprites_marsh.js
 * 腐食の毒沼（ステージ4）のモンスターの絵。
 * 萌芽の穴・若葉の洞（v1.0.0）のモンスターの仮の絵も、このファイルの最後に置いてある。
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
    },

    // --- 萌芽の穴・若葉の洞（v1.0.0）---
    //
    // フタバムシ（sproutWorm）・ユラツボミ（budFlower）・ワカバドリ（leafBird）・コケガメ（mossTurtle）・コダマ（sproutSpirit）。
    //   形と陰影から下絵を起こして、32×32 の決まり（K 輪郭／N〜P の5段／光は左上）に落とし、作者が見て了承したもの。
    //   仕上げ（v1.0.0）：形は変えずに、陰影のまだら・はぐれた点・欠けた輪郭を手で直した。
    //   コケガメだけは手を入れたところが多い（足元を地面へ下ろす／草を小さな双葉に／頭と脚を描き分ける）。
    //   動くコマ・眠りの絵は、それぞれの種族の最後にまとめてある（スライム・コウモリと同じく「姿」で切り替える）。
    // 新しいファイルにしないのは、app.html が古いまま残って読まれないことがあるため。

    /** フタバムシ。いちばん多く出る雑魚。頭に双葉、節ごとに輪郭で区切り、脇から短い脚 */
    sproutWorm: {
      palette: {
        ".": null, "K": "#141508", "N": "#3c4a1a", "D": "#62782a", "A": "#8fa843", "H": "#b6cc62", "P": "#d9e894",
        "E": "#2c5a22", "L": "#4f9637", "G": "#84c95a",   // 双葉
        "S": "#4f7a2c",                                   // 茎
        "M": "#4a3a1f", "B": "#7a5f34",                   // 脚・節の斑点（土の色）
        "W": "#ffe36e"                                    // 目
      },
      pixels: [
        "................................",
        "......KKKKKK........KKKKKK......",
        ".....KGGGGGGKK....KKGGGLEEK.....",
        ".....KGGGGGGLEKKKKGGGGLLEEK.....",
        "......KEGGLLLEKSSKGGGLEEEK......",
        ".......KEELEEEEKKGLLLEEEK.......",
        "........KKKKKKKKKKKKKKKK........",
        ".........KHHHHHHHAAADDK.........",
        "........KPPPPPPHHHHAAADK........",
        ".......KPPPPPPPHHHHAAADDK.......",
        "......KHPPPPPPHHHHAAAADDNK......",
        "......KHPPPPPHHHHAAAADDDNK......",
        "......KHHHHWWWHHAAWWWDDDNK......",
        ".....KHHHHHWWWHAAAWWWDDNNNK.....",
        "......KHHHHHHAAAAAADDDNNNK......",
        "......KAAAAAAAAAADDDDNNNNK......",
        "......KAAAAAAAANNDDDNNNNNK......",
        ".......KKAAADDDDDDDNNNNKK.......",
        "......KKKKDDDDDDDNNNNNKKKK......",
        ".....KPPPAKKKDNNNNNKKKNNDNK.....",
        "....KHPPPPAADKKKKKKNNNNDDNNK....",
        "...KKHHHHHHHHDDNNNNNDDDDNNNKK...",
        "..KBBKAABAAAAAAAAADDDDDBNNKMMK..",
        "..KBBMKKAAAABADDDDDBNNNNKKMMMK..",
        "..KMKKKAKKKKKDDDNNNKKKKKNKKKMK..",
        "...KDAAAAAADDKKKKKKNNNNNNNNNK...",
        "..KKHHHHHHHHHDDNNNNNADDDDNNNKK..",
        ".KBMKABAAAAAAAAAAADDDDDNNBNKMMK.",
        ".KBBMKNNAAABADDDDDDDBNNNNNKMMMK.",
        ".KMMMMKKNNNNNNNNNNNNNNNNKKMMMMK.",
        "..KKKK..KKKKKKKKKKKKKKKK..KKKK..",
        "................................"
      ]
    },

    /** ユラツボミ。妨害役。閉じたつぼみの奥から目がのぞく。まわりに花粉（Y） */
    budFlower: {
      palette: {
        ".": null, "K": "#1a1210", "N": "#6e3a52", "D": "#a65c7c", "A": "#d98aa6", "H": "#f0b6c8", "P": "#fde0e8",
        "E": "#2a5222", "L": "#4d8c34", "G": "#7fbf55",   // 葉・がく
        "S": "#3f7a2e",                                   // 茎
        "V": "#3a1c34", "U": "#5a2c4e",                   // つぼみの奥（暗がり）
        "W": "#ffe36e",                                   // 目
        "Y": "#fff0a0"                                    // 花粉
      },
      pixels: [
        "...............KK...............",
        "..............KPHK..............",
        ".............KPPHAK.............",
        "............KHPHADAK............",
        "...........KPPHAADAAK...........",
        "..........KPPPADDNAAAK..........",
        ".........KPPPPPNNHAAADK.........",
        ".....Y..KPPPPPPHHHAAADNK........",
        "........KPPPPPHHHHAADDNK........",
        "........KPPPPKKKKKKADDNK..Y.....",
        "........KHHHKUUUUVVKDDNK........",
        ".......KHHHHKWWUVWWKNDNNK.......",
        "........KHHHKWWVVWWKNNNK........",
        "....Y...KAAAKVVVVVVKNNNK........",
        "........KAAANKKKKKKNNNNK........",
        "........KDAAANNNNNNNNNNK...Y....",
        ".....KKKKKKKDDDDDDNNKKKKKKK.....",
        "....KGGGGGGGKGGGLLEKGGGLLLEK....",
        "....KGGGGLLLEKGLLEKLGGLLEEEK....",
        "....KEEGLLLEEEKGLKEEGGLEEEEK....",
        ".....KKEEEEEEKSSSEKGLLEEEKK.....",
        "........KKKKKKSSSEKKKKKK........",
        ".............KSSSEK.............",
        "...KKKKKKKK..KSSSEK..KKKKKKKK...",
        "..KGGGGGGGLKKKSSSEKKKGGGGGLLEK..",
        ".KEGGGGGGGGLLEKSSKLGGGGGGLLEEEK.",
        "..KEGGGGGGLLLEKSSKLGGGGLLLEEEK..",
        "...KELLLLLLLEEKKKKEGGLLLEEEEK...",
        "....KEEEEEEEEEEEEEELLEEEEEEK....",
        ".....KKKEEEEEEEEEEEEEEEEKKK.....",
        "........KKKKKKKKKKKKKKKK........",
        "................................"
      ]
    },

    /** ワカバドリ。速い相手。頭に葉の冠羽、翼を広げ、腹は淡い若草色 */
    leafBird: {
      palette: {
        ".": null, "K": "#10160c", "N": "#24461f", "D": "#3b6e2e", "A": "#5c9a3e", "H": "#86c25a", "P": "#b4e083",
        "X": "#a8bd6a", "Y": "#d8e6a0", "Z": "#f2f7cf",   // 腹
        "E": "#2a5a22", "L": "#4f9a37", "G": "#8dd060",   // 冠羽（葉）
        "O": "#e0902e", "R": "#a85a1c",                   // くちばし・足
        "W": "#ffe36e"                                    // 目
      },
      pixels: [
        "...................K............",
        "..................KLK...........",
        ".................KGLK...........",
        "................KGGLEK..........",
        "................KGLEK...........",
        "............KKKKKLEKK...........",
        "...........KPPPPDKKNK...........",
        "..........KPPPPPHKNNDK..........",
        ".........KPPPPPHHDNADNK.........",
        ".........KPPPPHHHAAADDK.........",
        ".........KHPPHHHAAADDNK.........",
        "........KNHHWWHAAAWWDNNK........",
        "...KKKKK.KHHWWAAAAWWNNK.KKKKK...",
        "..KHHHAAKKAAAAAOODDNNNKKAAADNK..",
        ".KHHHHHAADKAAADRRDNNNKDHHADDNNK.",
        ".KNAHAAAADKDDDDDDNNNNKDHADDNNNK.",
        "..KNAAAADKPPNKKKKKKNADKADDNNNK..",
        "...KNDDDDKPPPKYYXXKADDKNDNNNK...",
        "....KNDDNKPHKZZZZZYKDDKNNNNK....",
        ".....KNNKHHKZZZZZYYXKDNKNNK.....",
        "......KKNKHKZZZZYYYXKNKNKK......",
        "........KAAKZZZYYYXXKNNK........",
        "........KNAKZZYYYXXXKNNK........",
        ".........KNKYYYYXXXXKNK.........",
        "..........KNKXXXXXXKNK..........",
        "...........KNKKKKKKNK...........",
        "............KKDNNNKK............",
        "...........KOKAADNKOK...........",
        "..........KOOKDDNNKORK..........",
        "...........KKKNNNNKKK...........",
        "..............KKKK..............",
        "................................"
      ]
    },

    /** コケガメ。壁役。甲羅の上に苔が盛り上がり、小さな双葉と花。体は水の色 */
    mossTurtle: {
      palette: {
        ".": null, "K": "#0e1410", "N": "#23384a", "D": "#3c5a70", "A": "#5d82a0", "H": "#86a9c4", "P": "#b4d0e2",
        "Q": "#1f3a3a", "R": "#335a58", "S": "#4f7d78",   // 甲羅
        "M": "#2d5222", "G": "#4f8a33", "L": "#78b24a", "F": "#a6d66a",   // 苔・草
        "I": "#c9a24a", "J": "#f4f0c8",                   // 花
        "W": "#ffe36e"                                    // 目
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...............KKK..............",
        "........KK.KK.KJIJK.KK.KK.......",
        ".......KFLKLGK.KJK.KFLKLGK......",
        "........KKLKK..KLK..KKLKK.......",
        ".......KKKLKKKKKLKKKKKLKKK......",
        "......KFFFFFFFLLLLLLGGGMMK......",
        ".....KFFFFFFFFFLLLLLGGGGMMK.....",
        "....KFFFFFFFFFLLLLLGGGGMMMMK....",
        "...KLFFFFFFFLLLLLLGGGGGMMMMMK...",
        "...KLLLLLLLLLLLLGGGGGMMMMMMMK...",
        "..KRKLLLLLLLLGGGGGGGMMMMMMMKQK..",
        ".KRRKFLGGGGGGGGGGGMMMMMMFLGKQQK.",
        ".KRRKFLGMGGGGGGMMMMMMMMLFLGKQQK.",
        ".KRRKGGMMMFLMMMMMMMMFLMGGGMKQQK.",
        ".KRRQKKKKFLGMMMMMMMFLGMKKKKQQQK.",
        ".KQRRQQQQKGMKKKKKKKKGMKQQQQQQQK.",
        "..KQRRRRRQKKQQQQQQQQKKQQQQQQQK..",
        "..KKRRRRRRQQQQQQQQQQQQQQQQQQKK..",
        ".KRRKKKKKKKKKKKKKKKKKKKKKKKKQQK.",
        "..KNNNNNNK.KNNNNNNNNNK.KNNNNNNK.",
        "..KHHAADDK.KHPPHHHAADK.KHAADDNK.",
        "..KHAAADDK.KHWWHHAWWDK.KAADDNNK.",
        "..KHAADDNK.KHWWHAAWWDK.KADDNNNK.",
        "...KNNNNK..KHAAAAAADNK..KNNNNK..",
        "....KKKK....KAANNADNK....KKKK...",
        ".............KDDDDNK............",
        "..............KKKKK.............",
        "................................"
      ]
    },

    /** コダマ。珍しい相手。光る種のような体に大きな双葉、葉の腕。浮いているので影を敷かない */
    sproutSpirit: {
      palette: {
        ".": null, "K": "#13180e", "N": "#6f8a5a", "D": "#9db87a", "A": "#cfe6a8", "H": "#ecf7d2", "P": "#fffbe8",
        "E": "#2c6a2a", "L": "#4fae45", "G": "#8be070",   // 葉
        "O": "#2a3a1a",                                   // 目（体が明るいので暗い色にした）
        "Y": "#fff3a0"                                    // 光の粒
      },
      pixels: [
        "................................",
        "................................",
        "......KKKKK..........KKKKK......",
        ".....KGGGGGKK......KKGGGLLK.....",
        "....KGGGGGGLLKK..KKGGGGLLEEK....",
        ".....KGGGGGLLEEKKGGGGGLLEEK.....",
        ".....KELLLLLEEEGLGGGLLEEEEK.....",
        "......KKEEEEEEEELLLLEEEEKK......",
        "........KKEEEKKGLKKEEEKK........",
        "...........KKKKGLKKKK...........",
        "....Y......KPPPHHAADK...........",
        "...........KPPHHHAADK...........",
        "...........KPHHHAADNK...........",
        "..........KPHHHAAADDNK.....Y....",
        ".........KPHHHHAAAADDNK.........",
        ".........KPPHHHAAAADDNK.........",
        ".....KKKKKPHHHHAAAADDNKKKKK.....",
        "....KGGGLKHHPOHHHAPODNKEGLEK....",
        "....KGGGLKHHOOHHAAOODNKEGLEK....",
        ".....KLLLKHHHHAAAAADDNKEEEK.....",
        "......KEEKHAAAANNAADDNKEEK......",
        ".......KKKAAAAAAADDDNNKKK.......",
        ".........KAAAAADDDDDNNK.........",
        "..........KAAAADDDDNNK..........",
        "...........KAADDDDNNK.....Y.....",
        ".....Y......KADDDDNK............",
        "............KHAADDNK............",
        "............KAADDNNK............",
        ".............KDDNNK.............",
        "..............KKKK..............",
        "................................",
        "................................"
      ]
    },

    /**
     * フタバムシの動くコマ（v1.0.0）。元の絵から行を抜き差し・切り出して動かした。形は描き直していない。
     *   LeafUp   … 双葉と茎（1〜6行）を1つ上へ。空いた行は茎でつなぐ
     *   LeafDown … 双葉の外側の先（左4〜9列・右22〜27列）を1つ下へ（しおれる）
     *   Stretch  … 節の行（21行）を1つ足し、上の空行を抜いた（背が1ドット高い）
     *   Squash   … LeafDown から、頭と節の行（20・26行）を抜いた（背が2ドット低い）
     *   Sleep    … Squash の目を閉じた形（︶）にした。色は起きているときと同じ黄色
     */
    sproutWormLeafUp: {
      palette: {
        ".": null, "K": "#141508", "N": "#3c4a1a", "D": "#62782a", "A": "#8fa843", "H": "#b6cc62",
        "P": "#d9e894", "E": "#2c5a22", "L": "#4f9637", "G": "#84c95a", "S": "#4f7a2c", "M": "#4a3a1f",
        "B": "#7a5f34", "W": "#ffe36e"
      },
      pixels: [
        "......KKKKKK........KKKKKK......",
        ".....KGGGGGGKK....KKGGGLEEK.....",
        ".....KGGGGGGLEKKKKGGGGLLEEK.....",
        "......KEGGLLLEKSSKGGGLEEEK......",
        ".......KEELEEEEKKGLLLEEEK.......",
        "........KKKKKKKKKKKKKKKK........",
        "..............KSSK..............",
        ".........KHHHHHHHAAADDK.........",
        "........KPPPPPPHHHHAAADK........",
        ".......KPPPPPPPHHHHAAADDK.......",
        "......KHPPPPPPHHHHAAAADDNK......",
        "......KHPPPPPHHHHAAAADDDNK......",
        "......KHHHHWWWHHAAWWWDDDNK......",
        ".....KHHHHHWWWHAAAWWWDDNNNK.....",
        "......KHHHHHHAAAAAADDDNNNK......",
        "......KAAAAAAAAAADDDDNNNNK......",
        "......KAAAAAAAANNDDDNNNNNK......",
        ".......KKAAADDDDDDDNNNNKK.......",
        "......KKKKDDDDDDDNNNNNKKKK......",
        ".....KPPPAKKKDNNNNNKKKNNDNK.....",
        "....KHPPPPAADKKKKKKNNNNDDNNK....",
        "...KKHHHHHHHHDDNNNNNDDDDNNNKK...",
        "..KBBKAABAAAAAAAAADDDDDBNNKMMK..",
        "..KBBMKKAAAABADDDDDBNNNNKKMMMK..",
        "..KMKKKAKKKKKDDDNNNKKKKKNKKKMK..",
        "...KDAAAAAADDKKKKKKNNNNNNNNNK...",
        "..KKHHHHHHHHHDDNNNNNADDDDNNNKK..",
        ".KBMKABAAAAAAAAAAADDDDDNNBNKMMK.",
        ".KBBMKNNAAABADDDDDDDBNNNNNKMMMK.",
        ".KMMMMKKNNNNNNNNNNNNNNNNKKMMMMK.",
        "..KKKK..KKKKKKKKKKKKKKKK..KKKK..",
        "................................"
      ]
    },

    sproutWormLeafDown: {
      palette: {
        ".": null, "K": "#141508", "N": "#3c4a1a", "D": "#62782a", "A": "#8fa843", "H": "#b6cc62",
        "P": "#d9e894", "E": "#2c5a22", "L": "#4f9637", "G": "#84c95a", "S": "#4f7a2c", "M": "#4a3a1f",
        "B": "#7a5f34", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "..........KK........KK..........",
        "......KKKKGGKK....KKGGKKKK......",
        ".....KGGGGGGLEKKKKGGGGGLEEK.....",
        ".....KGGGGLLLEKSSKGGGLLLEEK.....",
        "......KEGGLEEEEKKGLLLEEEEK......",
        ".......KEEKKKKKKKKKKKKEEK.......",
        ".........KHHHHHHHAAADDK.........",
        "........KPPPPPPHHHHAAADK........",
        ".......KPPPPPPPHHHHAAADDK.......",
        "......KHPPPPPPHHHHAAAADDNK......",
        "......KHPPPPPHHHHAAAADDDNK......",
        "......KHHHHWWWHHAAWWWDDDNK......",
        ".....KHHHHHWWWHAAAWWWDDNNNK.....",
        "......KHHHHHHAAAAAADDDNNNK......",
        "......KAAAAAAAAAADDDDNNNNK......",
        "......KAAAAAAAANNDDDNNNNNK......",
        ".......KKAAADDDDDDDNNNNKK.......",
        "......KKKKDDDDDDDNNNNNKKKK......",
        ".....KPPPAKKKDNNNNNKKKNNDNK.....",
        "....KHPPPPAADKKKKKKNNNNDDNNK....",
        "...KKHHHHHHHHDDNNNNNDDDDNNNKK...",
        "..KBBKAABAAAAAAAAADDDDDBNNKMMK..",
        "..KBBMKKAAAABADDDDDBNNNNKKMMMK..",
        "..KMKKKAKKKKKDDDNNNKKKKKNKKKMK..",
        "...KDAAAAAADDKKKKKKNNNNNNNNNK...",
        "..KKHHHHHHHHHDDNNNNNADDDDNNNKK..",
        ".KBMKABAAAAAAAAAAADDDDDNNBNKMMK.",
        ".KBBMKNNAAABADDDDDDDBNNNNNKMMMK.",
        ".KMMMMKKNNNNNNNNNNNNNNNNKKMMMMK.",
        "..KKKK..KKKKKKKKKKKKKKKK..KKKK..",
        "................................"
      ]
    },

    sproutWormStretch: {
      palette: {
        ".": null, "K": "#141508", "N": "#3c4a1a", "D": "#62782a", "A": "#8fa843", "H": "#b6cc62",
        "P": "#d9e894", "E": "#2c5a22", "L": "#4f9637", "G": "#84c95a", "S": "#4f7a2c", "M": "#4a3a1f",
        "B": "#7a5f34", "W": "#ffe36e"
      },
      pixels: [
        "......KKKKKK........KKKKKK......",
        ".....KGGGGGGKK....KKGGGLEEK.....",
        ".....KGGGGGGLEKKKKGGGGLLEEK.....",
        "......KEGGLLLEKSSKGGGLEEEK......",
        ".......KEELEEEEKKGLLLEEEK.......",
        "........KKKKKKKKKKKKKKKK........",
        ".........KHHHHHHHAAADDK.........",
        "........KPPPPPPHHHHAAADK........",
        ".......KPPPPPPPHHHHAAADDK.......",
        "......KHPPPPPPHHHHAAAADDNK......",
        "......KHPPPPPHHHHAAAADDDNK......",
        "......KHHHHWWWHHAAWWWDDDNK......",
        ".....KHHHHHWWWHAAAWWWDDNNNK.....",
        "......KHHHHHHAAAAAADDDNNNK......",
        "......KAAAAAAAAAADDDDNNNNK......",
        "......KAAAAAAAANNDDDNNNNNK......",
        ".......KKAAADDDDDDDNNNNKK.......",
        "......KKKKDDDDDDDNNNNNKKKK......",
        ".....KPPPAKKKDNNNNNKKKNNDNK.....",
        "....KHPPPPAADKKKKKKNNNNDDNNK....",
        "...KKHHHHHHHHDDNNNNNDDDDNNNKK...",
        "...KKHHHHHHHHDDNNNNNDDDDNNNKK...",
        "..KBBKAABAAAAAAAAADDDDDBNNKMMK..",
        "..KBBMKKAAAABADDDDDBNNNNKKMMMK..",
        "..KMKKKAKKKKKDDDNNNKKKKKNKKKMK..",
        "...KDAAAAAADDKKKKKKNNNNNNNNNK...",
        "..KKHHHHHHHHHDDNNNNNADDDDNNNKK..",
        ".KBMKABAAAAAAAAAAADDDDDNNBNKMMK.",
        ".KBBMKNNAAABADDDDDDDBNNNNNKMMMK.",
        ".KMMMMKKNNNNNNNNNNNNNNNNKKMMMMK.",
        "..KKKK..KKKKKKKKKKKKKKKK..KKKK..",
        "................................"
      ]
    },

    sproutWormSquash: {
      palette: {
        ".": null, "K": "#141508", "N": "#3c4a1a", "D": "#62782a", "A": "#8fa843", "H": "#b6cc62",
        "P": "#d9e894", "E": "#2c5a22", "L": "#4f9637", "G": "#84c95a", "S": "#4f7a2c", "M": "#4a3a1f",
        "B": "#7a5f34", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "..........KK........KK..........",
        "......KKKKGGKK....KKGGKKKK......",
        ".....KGGGGGGLEKKKKGGGGGLEEK.....",
        ".....KGGGGLLLEKSSKGGGLLLEEK.....",
        "......KEGGLEEEEKKGLLLEEEEK......",
        ".......KEEKKKKKKKKKKKKEEK.......",
        ".........KHHHHHHHAAADDK.........",
        "........KPPPPPPHHHHAAADK........",
        ".......KPPPPPPPHHHHAAADDK.......",
        "......KHPPPPPPHHHHAAAADDNK......",
        "......KHPPPPPHHHHAAAADDDNK......",
        "......KHHHHWWWHHAAWWWDDDNK......",
        ".....KHHHHHWWWHAAAWWWDDNNNK.....",
        "......KHHHHHHAAAAAADDDNNNK......",
        "......KAAAAAAAAAADDDDNNNNK......",
        "......KAAAAAAAANNDDDNNNNNK......",
        ".......KKAAADDDDDDDNNNNKK.......",
        "......KKKKDDDDDDDNNNNNKKKK......",
        ".....KPPPAKKKDNNNNNKKKNNDNK.....",
        "...KKHHHHHHHHDDNNNNNDDDDNNNKK...",
        "..KBBKAABAAAAAAAAADDDDDBNNKMMK..",
        "..KBBMKKAAAABADDDDDBNNNNKKMMMK..",
        "..KMKKKAKKKKKDDDNNNKKKKKNKKKMK..",
        "...KDAAAAAADDKKKKKKNNNNNNNNNK...",
        ".KBMKABAAAAAAAAAAADDDDDNNBNKMMK.",
        ".KBBMKNNAAABADDDDDDDBNNNNNKMMMK.",
        ".KMMMMKKNNNNNNNNNNNNNNNNKKMMMMK.",
        "..KKKK..KKKKKKKKKKKKKKKK..KKKK..",
        "................................"
      ]
    },

    sproutWormSleep: {
      palette: {
        ".": null, "K": "#141508", "N": "#3c4a1a", "D": "#62782a", "A": "#8fa843", "H": "#b6cc62",
        "P": "#d9e894", "E": "#2c5a22", "L": "#4f9637", "G": "#84c95a", "S": "#4f7a2c", "M": "#4a3a1f",
        "B": "#7a5f34", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "..........KK........KK..........",
        "......KKKKGGKK....KKGGKKKK......",
        ".....KGGGGGGLEKKKKGGGGGLEEK.....",
        ".....KGGGGLLLEKSSKGGGLLLEEK.....",
        "......KEGGLEEEEKKGLLLEEEEK......",
        ".......KEEKKKKKKKKKKKKEEK.......",
        ".........KHHHHHHHAAADDK.........",
        "........KPPPPPPHHHHAAADK........",
        ".......KPPPPPPPHHHHAAADDK.......",
        "......KHPPPPPPHHHHAAAADDNK......",
        "......KHPPPPPHHHHAAAADDDNK......",
        "......KHHHHWHWHHAAWAWDDDNK......",
        ".....KHHHHHWWWHAAAWWWDDNNNK.....",
        "......KHHHHHHAAAAAADDDNNNK......",
        "......KAAAAAAAAAADDDDNNNNK......",
        "......KAAAAAAAANNDDDNNNNNK......",
        ".......KKAAADDDDDDDNNNNKK.......",
        "......KKKKDDDDDDDNNNNNKKKK......",
        ".....KPPPAKKKDNNNNNKKKNNDNK.....",
        "...KKHHHHHHHHDDNNNNNDDDDNNNKK...",
        "..KBBKAABAAAAAAAAADDDDDBNNKMMK..",
        "..KBBMKKAAAABADDDDDBNNNNKKMMMK..",
        "..KMKKKAKKKKKDDDNNNKKKKKNKKKMK..",
        "...KDAAAAAADDKKKKKKNNNNNNNNNK...",
        ".KBMKABAAAAAAAAAAADDDDDNNBNKMMK.",
        ".KBBMKNNAAABADDDDDDDBNNNNNKMMMK.",
        ".KMMMMKKNNNNNNNNNNNNNNNNKKMMMMK.",
        "..KKKK..KKKKKKKKKKKKKKKK..KKKK..",
        "................................"
      ]
    },

    /**
     * ユラツボミの動くコマ（v1.0.0）。元の絵から切り出して動かした。形は描き直していない。
     *   SwayL / SwayR … つぼみの先（0〜8行）を1つ傾け、傾ける側の葉の腕（16〜21行）を下げ、反対の腕を上げた。
     *                   腕を下げた側は、つぼみの下の輪郭を K で埋め直してある
     *   Open          … つぼみの先（0〜7行）を左右へ1つずつ割り、間に奥の暗がり（V）をのぞかせた
     *   Sleep         … 目の上の行を暗がりの色にして、下の行の黄色だけ残した（閉じた目）
     */
    budFlowerSwayL: {
      palette: {
        ".": null, "K": "#1a1210", "N": "#6e3a52", "D": "#a65c7c", "A": "#d98aa6", "H": "#f0b6c8",
        "P": "#fde0e8", "E": "#2a5222", "L": "#4d8c34", "G": "#7fbf55", "S": "#3f7a2e", "V": "#3a1c34",
        "U": "#5a2c4e", "W": "#ffe36e", "Y": "#fff0a0"
      },
      pixels: [
        "..............KK................",
        ".............KPHK...............",
        "............KPPHAK..............",
        "...........KHPHADAK.............",
        "..........KPPHAADAAK............",
        ".........KPPPADDNAAAK...........",
        "........KPPPPPNNHAAADK..........",
        "....Y..KPPPPPPHHHAAADNK.........",
        ".......KPPPPPHHHHAADDNK.........",
        "........KPPPPKKKKKKADDNK..Y.....",
        "........KHHHKUUUUVVKDDNK........",
        ".......KHHHHKWWUVWWKNDNNK.......",
        "........KHHHKWWVVWWKNNNK........",
        "....Y...KAAAKVVVVVVKNNNK........",
        "........KAAANKKKKKKNNNNK........",
        "........KDAAANNNNNNNKKKKKKKY....",
        "........KKKKDDDDDDNNGGGLLLEK....",
        ".....KKKKKKKKGGGLLEKGGLLEEEK....",
        "....KGGGGGGGEKGLLEKLGGLEEEEK....",
        "....KGGGGLLLEEKGLKEELLEEEKK.....",
        "....KEEGLLLEEKSSSEKGKKKK........",
        ".....KKEEEEEKKSSSEKK............",
        "........KKKK.KSSSEK.............",
        "...KKKKKKKK..KSSSEK..KKKKKKKK...",
        "..KGGGGGGGLKKKSSSEKKKGGGGGLLEK..",
        ".KEGGGGGGGGLLEKSSKLGGGGGGLLEEEK.",
        "..KEGGGGGGLLLEKSSKLGGGGLLLEEEK..",
        "...KELLLLLLLEEKKKKEGGLLLEEEEK...",
        "....KEEEEEEEEEEEEEELLEEEEEEK....",
        ".....KKKEEEEEEEEEEEEEEEEKKK.....",
        "........KKKKKKKKKKKKKKKK........",
        "................................"
      ]
    },

    budFlowerSwayR: {
      palette: {
        ".": null, "K": "#1a1210", "N": "#6e3a52", "D": "#a65c7c", "A": "#d98aa6", "H": "#f0b6c8",
        "P": "#fde0e8", "E": "#2a5222", "L": "#4d8c34", "G": "#7fbf55", "S": "#3f7a2e", "V": "#3a1c34",
        "U": "#5a2c4e", "W": "#ffe36e", "Y": "#fff0a0"
      },
      pixels: [
        "................KK..............",
        "...............KPHK.............",
        "..............KPPHAK............",
        ".............KHPHADAK...........",
        "............KPPHAADAAK..........",
        "...........KPPPADDNAAAK.........",
        "..........KPPPPPNNHAAADK........",
        "......Y..KPPPPPPHHHAAADNK.......",
        ".........KPPPPPHHHHAADDNK.......",
        "........KPPPPKKKKKKADDNK..Y.....",
        "........KHHHKUUUUVVKDDNK........",
        ".......KHHHHKWWUVWWKNDNNK.......",
        "........KHHHKWWVVWWKNNNK........",
        "....Y...KAAAKVVVVVVKNNNK........",
        "........KAAANKKKKKKNNNNK........",
        ".....KKKKKKKANNNNNNNNNNK...Y....",
        "....KGGGGGGGDDDDDDNNKKKK........",
        "....KGGGGLLLKGGGLLEKKKKKKKK.....",
        "....KEEGLLLEEKGLLEKLGGGLLLEK....",
        ".....KKEEEEEEEKGLKEEGGLLEEEK....",
        "........KKKKEKSSSEKGGGLEEEEK....",
        "............KKSSSEKKLLEEEKK.....",
        ".............KSSSEK.KKKK........",
        "...KKKKKKKK..KSSSEK..KKKKKKKK...",
        "..KGGGGGGGLKKKSSSEKKKGGGGGLLEK..",
        ".KEGGGGGGGGLLEKSSKLGGGGGGLLEEEK.",
        "..KEGGGGGGLLLEKSSKLGGGGLLLEEEK..",
        "...KELLLLLLLEEKKKKEGGLLLEEEEK...",
        "....KEEEEEEEEEEEEEELLEEEEEEK....",
        ".....KKKEEEEEEEEEEEEEEEEKKK.....",
        "........KKKKKKKKKKKKKKKK........",
        "................................"
      ]
    },

    budFlowerOpen: {
      palette: {
        ".": null, "K": "#1a1210", "N": "#6e3a52", "D": "#a65c7c", "A": "#d98aa6", "H": "#f0b6c8",
        "P": "#fde0e8", "E": "#2a5222", "L": "#4d8c34", "G": "#7fbf55", "S": "#3f7a2e", "V": "#3a1c34",
        "U": "#5a2c4e", "W": "#ffe36e", "Y": "#fff0a0"
      },
      pixels: [
        "..............K..K..............",
        ".............KP..HK.............",
        "............KPP..HAK............",
        "...........KHPH..ADAK...........",
        "..........KPPHA..ADAAK..........",
        ".........KPPPAD..DNAAAK.........",
        "........KPPPPPN..NHAAADK........",
        ".....Y.KPPPPPPH..HHAAADNK.......",
        "........KPPPPPHHHHAADDNK........",
        "........KPPPPKKKKKKADDNK..Y.....",
        "........KHHHKUUUUVVKDDNK........",
        ".......KHHHHKWWUVWWKNDNNK.......",
        "........KHHHKWWVVWWKNNNK........",
        "....Y...KAAAKVVVVVVKNNNK........",
        "........KAAANKKKKKKNNNNK........",
        "........KDAAANNNNNNNNNNK...Y....",
        ".....KKKKKKKDDDDDDNNKKKKKKK.....",
        "....KGGGGGGGKGGGLLEKGGGLLLEK....",
        "....KGGGGLLLEKGLLEKLGGLLEEEK....",
        "....KEEGLLLEEEKGLKEEGGLEEEEK....",
        ".....KKEEEEEEKSSSEKGLLEEEKK.....",
        "........KKKKKKSSSEKKKKKK........",
        ".............KSSSEK.............",
        "...KKKKKKKK..KSSSEK..KKKKKKKK...",
        "..KGGGGGGGLKKKSSSEKKKGGGGGLLEK..",
        ".KEGGGGGGGGLLEKSSKLGGGGGGLLEEEK.",
        "..KEGGGGGGLLLEKSSKLGGGGLLLEEEK..",
        "...KELLLLLLLEEKKKKEGGLLLEEEEK...",
        "....KEEEEEEEEEEEEEELLEEEEEEK....",
        ".....KKKEEEEEEEEEEEEEEEEKKK.....",
        "........KKKKKKKKKKKKKKKK........",
        "................................"
      ]
    },

    budFlowerSleep: {
      palette: {
        ".": null, "K": "#1a1210", "N": "#6e3a52", "D": "#a65c7c", "A": "#d98aa6", "H": "#f0b6c8",
        "P": "#fde0e8", "E": "#2a5222", "L": "#4d8c34", "G": "#7fbf55", "S": "#3f7a2e", "V": "#3a1c34",
        "U": "#5a2c4e", "W": "#ffe36e", "Y": "#fff0a0"
      },
      pixels: [
        "...............KK...............",
        "..............KPHK..............",
        ".............KPPHAK.............",
        "............KHPHADAK............",
        "...........KPPHAADAAK...........",
        "..........KPPPADDNAAAK..........",
        ".........KPPPPPNNHAAADK.........",
        ".....Y..KPPPPPPHHHAAADNK........",
        "........KPPPPPHHHHAADDNK........",
        "........KPPPPKKKKKKADDNK..Y.....",
        "........KHHHKUUUUVVKDDNK........",
        ".......KHHHHKUUUVVUKNDNNK.......",
        "........KHHHKWWVVWWKNNNK........",
        "....Y...KAAAKVVVVVVKNNNK........",
        "........KAAANKKKKKKNNNNK........",
        "........KDAAANNNNNNNNNNK...Y....",
        ".....KKKKKKKDDDDDDNNKKKKKKK.....",
        "....KGGGGGGGKGGGLLEKGGGLLLEK....",
        "....KGGGGLLLEKGLLEKLGGLLEEEK....",
        "....KEEGLLLEEEKGLKEEGGLEEEEK....",
        ".....KKEEEEEEKSSSEKGLLEEEKK.....",
        "........KKKKKKSSSEKKKKKK........",
        ".............KSSSEK.............",
        "...KKKKKKKK..KSSSEK..KKKKKKKK...",
        "..KGGGGGGGLKKKSSSEKKKGGGGGLLEK..",
        ".KEGGGGGGGGLLEKSSKLGGGGGGLLEEEK.",
        "..KEGGGGGGLLLEKSSKLGGGGLLLEEEK..",
        "...KELLLLLLLEEKKKKEGGLLLEEEEK...",
        "....KEEEEEEEEEEEEEELLEEEEEEK....",
        ".....KKKEEEEEEEEEEEEEEEEKKK.....",
        "........KKKKKKKKKKKKKKKK........",
        "................................"
      ]
    },

    /**
     * ワカバドリの動くコマ（v1.0.0）。翼を元の絵から切り出し、付け根で回した（コウモリ・ハイバネと同じやり方）。
     *   翼 … 左は11〜21行の0〜9列、右は22〜31列。付け根（15.5行・10.5列／21.5列）を軸に、0.92倍で回す。
     *        体の後ろに回るので、体のマスには重ねない。回したあとに輪郭を引き直した
     *   Up / Down … 翼を28度上げ・下げ
     *   Sleep     … Down の目を閉じ（下の行の黄色だけ残す）、葉の冠羽を右下へ1つ倒した
     */
    leafBirdUp: {
      palette: {
        ".": null, "K": "#10160c", "N": "#24461f", "D": "#3b6e2e", "A": "#5c9a3e", "H": "#86c25a",
        "P": "#b4e083", "X": "#a8bd6a", "Y": "#d8e6a0", "Z": "#f2f7cf", "E": "#2a5a22", "L": "#4f9a37",
        "G": "#8dd060", "O": "#e0902e", "R": "#a85a1c", "W": "#ffe36e"
      },
      pixels: [
        "...................K............",
        "..................KLK...........",
        ".................KGLK...........",
        "................KGGLEK..........",
        "................KGLEK...........",
        "............KKKKKLEKK...........",
        "...........KPPPPDKKNK...........",
        "..........KPPPPPHKNNDK..........",
        ".........KPPPPPHHDNADNK.........",
        ".....K...KPPPPHHHAAADDK...K.....",
        "....KHKK.KHPPHHHAAADDNK.KKNK....",
        "...KHHHHKKHHWWHAAAWWDNKKADNNK...",
        "...KAHHHAKHHWWAAAAWWNNKAADNNK...",
        "...KNAAAAAAAAAAOODDNNNHHDDNNK...",
        "...KNDAAADKAAADRRDNNNKDHDDNNK...",
        "....KNDDDKKDDDDDDNNNNKKADNNK....",
        "....KNDDKKPPNKKKKKKNADKKNNNK....",
        "....KNNNKKPPPKYYXXKADDKKNNNK....",
        ".....KNHKKPHKZZZZZYKDDKKNNK.....",
        "......KK.KHKZZZZZYYXKDK.KK......",
        ".........KHKZZZZYYYXKNK.........",
        ".........KAKZZZYYYXXKNK.........",
        "........KNAKZZYYYXXXKNNK........",
        ".........KNKYYYYXXXXKNK.........",
        "..........KNKXXXXXXKNK..........",
        "...........KNKKKKKKNK...........",
        "............KKDNNNKK............",
        "...........KOKAADNKOK...........",
        "..........KOOKDDNNKORK..........",
        "...........KKKNNNNKKK...........",
        "..............KKKK..............",
        "................................"
      ]
    },

    leafBirdDown: {
      palette: {
        ".": null, "K": "#10160c", "N": "#24461f", "D": "#3b6e2e", "A": "#5c9a3e", "H": "#86c25a",
        "P": "#b4e083", "X": "#a8bd6a", "Y": "#d8e6a0", "Z": "#f2f7cf", "E": "#2a5a22", "L": "#4f9a37",
        "G": "#8dd060", "O": "#e0902e", "R": "#a85a1c", "W": "#ffe36e"
      },
      pixels: [
        "...................K............",
        "..................KLK...........",
        ".................KGLK...........",
        "................KGGLEK..........",
        "................KGLEK...........",
        "............KKKKKLEKK...........",
        "...........KPPPPDKKNK...........",
        "..........KPPPPPHKNNDK..........",
        ".........KPPPPPHHDNADNK.........",
        ".........KPPPPHHHAAADDK.........",
        ".........KHPPHHHAAADDNK.........",
        ".........KHHWWHAAAWWDNK.........",
        ".........KHHWWAAAAWWNNK.........",
        ".........KAAAAAOODDNNNK.........",
        "......KKKKKAAADRRDNNNKKKKK......",
        "....KKAAADKDDDDDDNNNNKDHAAKK....",
        "...KHHHAADPPNKKKKKKNADDHHAADK...",
        "...KHHAAADPPPKYYXXKADDADDDDNK...",
        "..KHAHAADDPHKZZZZZYKDDNDDNNNNK..",
        "...KKNNDDDHKZZZZZYYXKDNNNNNKK...",
        ".....KKNNNHKZZZZYYYXKNNNNKK.....",
        ".......KKKAKZZZYYYXXKNKKK.......",
        "........KNAKZZYYYXXXKNNK........",
        ".........KNKYYYYXXXXKNK.........",
        "..........KNKXXXXXXKNK..........",
        "...........KNKKKKKKNK...........",
        "............KKDNNNKK............",
        "...........KOKAADNKOK...........",
        "..........KOOKDDNNKORK..........",
        "...........KKKNNNNKKK...........",
        "..............KKKK..............",
        "................................"
      ]
    },

    leafBirdSleep: {
      palette: {
        ".": null, "K": "#10160c", "N": "#24461f", "D": "#3b6e2e", "A": "#5c9a3e", "H": "#86c25a",
        "P": "#b4e083", "X": "#a8bd6a", "Y": "#d8e6a0", "Z": "#f2f7cf", "E": "#2a5a22", "L": "#4f9a37",
        "G": "#8dd060", "O": "#e0902e", "R": "#a85a1c", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "....................K...........",
        "...................KLK..........",
        "..................KGLK..........",
        ".................KGGLEK.........",
        "............KKKKKKGLEK..........",
        "...........KPPPPDKLEKK..........",
        "..........KPPPPPHKNNDK..........",
        ".........KPPPPPHHDNADNK.........",
        ".........KPPPPHHHAAADDK.........",
        ".........KHPPHHHAAADDNK.........",
        ".........KHHHHHAAAAADNK.........",
        ".........KHHWWAAAAWWNNK.........",
        ".........KAAAAAOODDNNNK.........",
        "......KKKKKAAADRRDNNNKKKKK......",
        "....KKAAADKDDDDDDNNNNKDHAAKK....",
        "...KHHHAADPPNKKKKKKNADDHHAADK...",
        "...KHHAAADPPPKYYXXKADDADDDDNK...",
        "..KHAHAADDPHKZZZZZYKDDNDDNNNNK..",
        "...KKNNDDDHKZZZZZYYXKDNNNNNKK...",
        ".....KKNNNHKZZZZYYYXKNNNNKK.....",
        ".......KKKAKZZZYYYXXKNKKK.......",
        "........KNAKZZYYYXXXKNNK........",
        ".........KNKYYYYXXXXKNK.........",
        "..........KNKXXXXXXKNK..........",
        "...........KNKKKKKKNK...........",
        "............KKDNNNKK............",
        "...........KOKAADNKOK...........",
        "..........KOOKDDNNKORK..........",
        "...........KKKNNNNKKK...........",
        "..............KKKK..............",
        "................................"
      ]
    },

    /**
     * コケガメの動くコマ（v1.0.0）。頭・脚を元の絵から切り出して動かした。甲羅（0〜21行）は1マスも変えていない。
     *   頭 … 23〜30行の11〜21列。脚 … 左は2〜9列、右は23〜30列（23〜28行）。
     *   引っ込める動きは、空いているマスにだけ貼る（甲羅の後ろへ入って見えなくなる）
     *   Blink  … 目の上の行を顔の色にして、下の行の黄色だけ残した
     *   LookUp … 頭を1つ上へ（甲羅のふちの前に出る）。見上げる・息を吸う
     *   Peek   … 頭を2つ・脚を3つ引っ込めた（目だけのぞく）。Sleep はこれで目を閉じた姿
     *   Hide   … 頭を5つ・脚を4つ引っ込め、甲羅にこもった
     *   StompL / StompR … 片方の脚を2つ上げた（足踏み）
     */
    mossTurtleBlink: {
      palette: {
        ".": null, "K": "#0e1410", "N": "#23384a", "D": "#3c5a70", "A": "#5d82a0", "H": "#86a9c4",
        "P": "#b4d0e2", "Q": "#1f3a3a", "R": "#335a58", "M": "#2d5222", "G": "#4f8a33", "L": "#78b24a",
        "F": "#a6d66a", "I": "#c9a24a", "J": "#f4f0c8", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...............KKK..............",
        "........KK.KK.KJIJK.KK.KK.......",
        ".......KFLKLGK.KJK.KFLKLGK......",
        "........KKLKK..KLK..KKLKK.......",
        ".......KKKLKKKKKLKKKKKLKKK......",
        "......KFFFFFFFLLLLLLGGGMMK......",
        ".....KFFFFFFFFFLLLLLGGGGMMK.....",
        "....KFFFFFFFFFLLLLLGGGGMMMMK....",
        "...KLFFFFFFFLLLLLLGGGGGMMMMMK...",
        "...KLLLLLLLLLLLLGGGGGMMMMMMMK...",
        "..KRKLLLLLLLLGGGGGGGMMMMMMMKQK..",
        ".KRRKFLGGGGGGGGGGGMMMMMMFLGKQQK.",
        ".KRRKFLGMGGGGGGMMMMMMMMLFLGKQQK.",
        ".KRRKGGMMMFLMMMMMMMMFLMGGGMKQQK.",
        ".KRRQKKKKFLGMMMMMMMFLGMKKKKQQQK.",
        ".KQRRQQQQKGMKKKKKKKKGMKQQQQQQQK.",
        "..KQRRRRRQKKQQQQQQQQKKQQQQQQQK..",
        "..KKRRRRRRQQQQQQQQQQQQQQQQQQKK..",
        ".KRRKKKKKKKKKKKKKKKKKKKKKKKKQQK.",
        "..KNNNNNNK.KNNNNNNNNNK.KNNNNNNK.",
        "..KHHAADDK.KHPPHHHAADK.KHAADDNK.",
        "..KHAAADDK.KHPPHHAHADK.KAADDNNK.",
        "..KHAADDNK.KHWWHAAWWDK.KADDNNNK.",
        "...KNNNNK..KHAAAAAADNK..KNNNNK..",
        "....KKKK....KAANNADNK....KKKK...",
        ".............KDDDDNK............",
        "..............KKKKK.............",
        "................................"
      ]
    },

    mossTurtleLookUp: {
      palette: {
        ".": null, "K": "#0e1410", "N": "#23384a", "D": "#3c5a70", "A": "#5d82a0", "H": "#86a9c4",
        "P": "#b4d0e2", "Q": "#1f3a3a", "R": "#335a58", "M": "#2d5222", "G": "#4f8a33", "L": "#78b24a",
        "F": "#a6d66a", "I": "#c9a24a", "J": "#f4f0c8", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...............KKK..............",
        "........KK.KK.KJIJK.KK.KK.......",
        ".......KFLKLGK.KJK.KFLKLGK......",
        "........KKLKK..KLK..KKLKK.......",
        ".......KKKLKKKKKLKKKKKLKKK......",
        "......KFFFFFFFLLLLLLGGGMMK......",
        ".....KFFFFFFFFFLLLLLGGGGMMK.....",
        "....KFFFFFFFFFLLLLLGGGGMMMMK....",
        "...KLFFFFFFFLLLLLLGGGGGMMMMMK...",
        "...KLLLLLLLLLLLLGGGGGMMMMMMMK...",
        "..KRKLLLLLLLLGGGGGGGMMMMMMMKQK..",
        ".KRRKFLGGGGGGGGGGGMMMMMMFLGKQQK.",
        ".KRRKFLGMGGGGGGMMMMMMMMLFLGKQQK.",
        ".KRRKGGMMMFLMMMMMMMMFLMGGGMKQQK.",
        ".KRRQKKKKFLGMMMMMMMFLGMKKKKQQQK.",
        ".KQRRQQQQKGMKKKKKKKKGMKQQQQQQQK.",
        "..KQRRRRRQKKQQQQQQQQKKQQQQQQQK..",
        "..KKRRRRRRQQQQQQQQQQQQQQQQQQKK..",
        ".KRRKKKKKKKKNNNNNNNNNKKKKKKKQQK.",
        "..KNNNNNNK.KHPPHHHAADK.KNNNNNNK.",
        "..KHHAADDK.KHWWHHAWWDK.KHAADDNK.",
        "..KHAAADDK.KHWWHAAWWDK.KAADDNNK.",
        "..KHAADDNK.KHAAAAAADNK.KADDNNNK.",
        "...KNNNNK...KAANNADNK...KNNNNK..",
        "....KKKK.....KDDDDNK.....KKKK...",
        "..............KKKKK.............",
        "................................",
        "................................"
      ]
    },

    mossTurtlePeek: {
      palette: {
        ".": null, "K": "#0e1410", "N": "#23384a", "D": "#3c5a70", "A": "#5d82a0", "H": "#86a9c4",
        "P": "#b4d0e2", "Q": "#1f3a3a", "R": "#335a58", "M": "#2d5222", "G": "#4f8a33", "L": "#78b24a",
        "F": "#a6d66a", "I": "#c9a24a", "J": "#f4f0c8", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...............KKK..............",
        "........KK.KK.KJIJK.KK.KK.......",
        ".......KFLKLGK.KJK.KFLKLGK......",
        "........KKLKK..KLK..KKLKK.......",
        ".......KKKLKKKKKLKKKKKLKKK......",
        "......KFFFFFFFLLLLLLGGGMMK......",
        ".....KFFFFFFFFFLLLLLGGGGMMK.....",
        "....KFFFFFFFFFLLLLLGGGGMMMMK....",
        "...KLFFFFFFFLLLLLLGGGGGMMMMMK...",
        "...KLLLLLLLLLLLLGGGGGMMMMMMMK...",
        "..KRKLLLLLLLLGGGGGGGMMMMMMMKQK..",
        ".KRRKFLGGGGGGGGGGGMMMMMMFLGKQQK.",
        ".KRRKFLGMGGGGGGMMMMMMMMLFLGKQQK.",
        ".KRRKGGMMMFLMMMMMMMMFLMGGGMKQQK.",
        ".KRRQKKKKFLGMMMMMMMFLGMKKKKQQQK.",
        ".KQRRQQQQKGMKKKKKKKKGMKQQQQQQQK.",
        "..KQRRRRRQKKQQQQQQQQKKQQQQQQQK..",
        "..KKRRRRRRQQQQQQQQQQQQQQQQQQKK..",
        ".KRRKKKKKKKKKKKKKKKKKKKKKKKKQQK.",
        "..KHAADDNK.KHWWHHAWWDK.KADDNNNK.",
        "...KNNNNK..KHWWHAAWWDK..KNNNNK..",
        "....KKKK...KHAAAAAADNK...KKKK...",
        "............KAANNADNK...........",
        ".............KDDDDNK............",
        "..............KKKKK.............",
        "................................",
        "................................",
        "................................"
      ]
    },

    mossTurtleHide: {
      palette: {
        ".": null, "K": "#0e1410", "N": "#23384a", "D": "#3c5a70", "A": "#5d82a0", "H": "#86a9c4",
        "P": "#b4d0e2", "Q": "#1f3a3a", "R": "#335a58", "M": "#2d5222", "G": "#4f8a33", "L": "#78b24a",
        "F": "#a6d66a", "I": "#c9a24a", "J": "#f4f0c8", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...............KKK..............",
        "........KK.KK.KJIJK.KK.KK.......",
        ".......KFLKLGK.KJK.KFLKLGK......",
        "........KKLKK..KLK..KKLKK.......",
        ".......KKKLKKKKKLKKKKKLKKK......",
        "......KFFFFFFFLLLLLLGGGMMK......",
        ".....KFFFFFFFFFLLLLLGGGGMMK.....",
        "....KFFFFFFFFFLLLLLGGGGMMMMK....",
        "...KLFFFFFFFLLLLLLGGGGGMMMMMK...",
        "...KLLLLLLLLLLLLGGGGGMMMMMMMK...",
        "..KRKLLLLLLLLGGGGGGGMMMMMMMKQK..",
        ".KRRKFLGGGGGGGGGGGMMMMMMFLGKQQK.",
        ".KRRKFLGMGGGGGGMMMMMMMMLFLGKQQK.",
        ".KRRKGGMMMFLMMMMMMMMFLMGGGMKQQK.",
        ".KRRQKKKKFLGMMMMMMMFLGMKKKKQQQK.",
        ".KQRRQQQQKGMKKKKKKKKGMKQQQQQQQK.",
        "..KQRRRRRQKKQQQQQQQQKKQQQQQQQK..",
        "..KKRRRRRRQQQQQQQQQQQQQQQQQQKK..",
        ".KRRKKKKKKKKKKKKKKKKKKKKKKKKQQK.",
        "...KNNNNK...KAANNADNK...KNNNNK..",
        "....KKKK.....KDDDDNK.....KKKK...",
        "..............KKKKK.............",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
      ]
    },

    mossTurtleStompL: {
      palette: {
        ".": null, "K": "#0e1410", "N": "#23384a", "D": "#3c5a70", "A": "#5d82a0", "H": "#86a9c4",
        "P": "#b4d0e2", "Q": "#1f3a3a", "R": "#335a58", "M": "#2d5222", "G": "#4f8a33", "L": "#78b24a",
        "F": "#a6d66a", "I": "#c9a24a", "J": "#f4f0c8", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...............KKK..............",
        "........KK.KK.KJIJK.KK.KK.......",
        ".......KFLKLGK.KJK.KFLKLGK......",
        "........KKLKK..KLK..KKLKK.......",
        ".......KKKLKKKKKLKKKKKLKKK......",
        "......KFFFFFFFLLLLLLGGGMMK......",
        ".....KFFFFFFFFFLLLLLGGGGMMK.....",
        "....KFFFFFFFFFLLLLLGGGGMMMMK....",
        "...KLFFFFFFFLLLLLLGGGGGMMMMMK...",
        "...KLLLLLLLLLLLLGGGGGMMMMMMMK...",
        "..KRKLLLLLLLLGGGGGGGMMMMMMMKQK..",
        ".KRRKFLGGGGGGGGGGGMMMMMMFLGKQQK.",
        ".KRRKFLGMGGGGGGMMMMMMMMLFLGKQQK.",
        ".KRRKGGMMMFLMMMMMMMMFLMGGGMKQQK.",
        ".KRRQKKKKFLGMMMMMMMFLGMKKKKQQQK.",
        ".KQRRQQQQKGMKKKKKKKKGMKQQQQQQQK.",
        "..KQRRRRRQKKQQQQQQQQKKQQQQQQQK..",
        "..KKRRRRRRQQQQQQQQQQQQQQQQQQKK..",
        ".KRRKKKKKKKKKKKKKKKKKKKKKKKKQQK.",
        "..KHAAADDK.KNNNNNNNNNK.KNNNNNNK.",
        "..KHAADDNK.KHPPHHHAADK.KHAADDNK.",
        "...KNNNNK..KHWWHHAWWDK.KAADDNNK.",
        "....KKKK...KHWWHAAWWDK.KADDNNNK.",
        "...........KHAAAAAADNK..KNNNNK..",
        "............KAANNADNK....KKKK...",
        ".............KDDDDNK............",
        "..............KKKKK.............",
        "................................"
      ]
    },

    mossTurtleStompR: {
      palette: {
        ".": null, "K": "#0e1410", "N": "#23384a", "D": "#3c5a70", "A": "#5d82a0", "H": "#86a9c4",
        "P": "#b4d0e2", "Q": "#1f3a3a", "R": "#335a58", "M": "#2d5222", "G": "#4f8a33", "L": "#78b24a",
        "F": "#a6d66a", "I": "#c9a24a", "J": "#f4f0c8", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...............KKK..............",
        "........KK.KK.KJIJK.KK.KK.......",
        ".......KFLKLGK.KJK.KFLKLGK......",
        "........KKLKK..KLK..KKLKK.......",
        ".......KKKLKKKKKLKKKKKLKKK......",
        "......KFFFFFFFLLLLLLGGGMMK......",
        ".....KFFFFFFFFFLLLLLGGGGMMK.....",
        "....KFFFFFFFFFLLLLLGGGGMMMMK....",
        "...KLFFFFFFFLLLLLLGGGGGMMMMMK...",
        "...KLLLLLLLLLLLLGGGGGMMMMMMMK...",
        "..KRKLLLLLLLLGGGGGGGMMMMMMMKQK..",
        ".KRRKFLGGGGGGGGGGGMMMMMMFLGKQQK.",
        ".KRRKFLGMGGGGGGMMMMMMMMLFLGKQQK.",
        ".KRRKGGMMMFLMMMMMMMMFLMGGGMKQQK.",
        ".KRRQKKKKFLGMMMMMMMFLGMKKKKQQQK.",
        ".KQRRQQQQKGMKKKKKKKKGMKQQQQQQQK.",
        "..KQRRRRRQKKQQQQQQQQKKQQQQQQQK..",
        "..KKRRRRRRQQQQQQQQQQQQQQQQQQKK..",
        ".KRRKKKKKKKKKKKKKKKKKKKKKKKKQQK.",
        "..KNNNNNNK.KNNNNNNNNNK.KAADDNNK.",
        "..KHHAADDK.KHPPHHHAADK.KADDNNNK.",
        "..KHAAADDK.KHWWHHAWWDK..KNNNNK..",
        "..KHAADDNK.KHWWHAAWWDK...KKKK...",
        "...KNNNNK..KHAAAAAADNK..........",
        "....KKKK....KAANNADNK...........",
        ".............KDDDDNK............",
        "..............KKKKK.............",
        "................................"
      ]
    },

    mossTurtleSleep: {
      palette: {
        ".": null, "K": "#0e1410", "N": "#23384a", "D": "#3c5a70", "A": "#5d82a0", "H": "#86a9c4",
        "P": "#b4d0e2", "Q": "#1f3a3a", "R": "#335a58", "M": "#2d5222", "G": "#4f8a33", "L": "#78b24a",
        "F": "#a6d66a", "I": "#c9a24a", "J": "#f4f0c8", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "...............KKK..............",
        "........KK.KK.KJIJK.KK.KK.......",
        ".......KFLKLGK.KJK.KFLKLGK......",
        "........KKLKK..KLK..KKLKK.......",
        ".......KKKLKKKKKLKKKKKLKKK......",
        "......KFFFFFFFLLLLLLGGGMMK......",
        ".....KFFFFFFFFFLLLLLGGGGMMK.....",
        "....KFFFFFFFFFLLLLLGGGGMMMMK....",
        "...KLFFFFFFFLLLLLLGGGGGMMMMMK...",
        "...KLLLLLLLLLLLLGGGGGMMMMMMMK...",
        "..KRKLLLLLLLLGGGGGGGMMMMMMMKQK..",
        ".KRRKFLGGGGGGGGGGGMMMMMMFLGKQQK.",
        ".KRRKFLGMGGGGGGMMMMMMMMLFLGKQQK.",
        ".KRRKGGMMMFLMMMMMMMMFLMGGGMKQQK.",
        ".KRRQKKKKFLGMMMMMMMFLGMKKKKQQQK.",
        ".KQRRQQQQKGMKKKKKKKKGMKQQQQQQQK.",
        "..KQRRRRRQKKQQQQQQQQKKQQQQQQQK..",
        "..KKRRRRRRQQQQQQQQQQQQQQQQQQKK..",
        ".KRRKKKKKKKKKKKKKKKKKKKKKKKKQQK.",
        "..KHAADDNK.KHPPHHAHADK.KADDNNNK.",
        "...KNNNNK..KHWWHAAWWDK..KNNNNK..",
        "....KKKK...KHAAAAAADNK...KKKK...",
        "............KAANNADNK...........",
        ".............KDDDDNK............",
        "..............KKKKK.............",
        "................................",
        "................................",
        "................................"
      ]
    },

    /**
     * コダマの動くコマ（v1.0.0）。双葉と葉の腕を元の絵から切り出し、付け根で回した。体は描き直していない。
     *   双葉 … 左は2〜8行の2〜14列、右は17〜29列。茎の付け根（8.5行・15.5列／16.5列）を軸に回す
     *   腕   … 左は16〜21行の3〜8列、右は23〜28列。肩（18.5行・9.5列／22.5列）を軸に回す
     *   光の粒（Y）は、コマごとに場所を変えてある（またたいて見える）
     *   Up     … 双葉を14度・腕を30度上げた
     *   Down   … 双葉を12度・腕を25度下げた
     *   Bright … Up の体の色を1段ずつ明るくし、光の粒を増やした（光の技・共鳴）
     *   Sleep  … Down の目を閉じ（下の行の目の色だけ残す）、光の粒を消した
     */
    /**
     * 若葉の洞の主（v1.0.0。名前は仮）。若木の切り株に根の腕と脚が生え、頭に大きな双葉を戴く。
     * 顔は幹のうろで、奥に黄色い目が光る。下絵は形と陰影から起こした（ほかの5体と同じやり方）。
     *   幹（N〜P）と根（X・Y・Z・R）は色を分けてある。同じ茶色だと根が幹に溶けて塊に見えるため
     *   苔（M・Q）は輪郭を付けずに幹へなじませた。樹皮の筋は D・N で数本だけ引いた
     * 動くコマ：
     *   ArmsOut / ArmsUp … 根の腕（15〜25行の0〜7列／24〜31列）を肩（16.5行・7.5列／24.5列）を軸に50度・100度上げた
     *   LeafL / LeafR     … 頭の葉（0〜10行）を付け根（10.5行・16列）を軸に7度ずつ傾けた
     *   Glare             … ArmsOut の目を横に広げ、うろの奥を明るくした（にらむ・技を放つ）
     *   Sleep             … 葉を左右へしおれさせ、目を閉じた（下の行の黄色だけ残す）
     */
    sproutLord: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "E": "#2c5a22", "L": "#4f9637", "G": "#84c95a", "F": "#b8e07a",   // 葉
        "S": "#4f7a2c",                                                    // 茎
        "V": "#1a0f08", "U": "#2e1a10",                                    // うろ
        "M": "#3f6b2a", "Q": "#6f9a43",                                    // 苔
        "X": "#1c130a", "Y": "#3a2817", "Z": "#5c4229", "R": "#7a5a38",    // 根
        "W": "#ffe36e"                                                     // 目
      },
      pixels: [
        "...........KKK....KKK...........",
        "..........KEFGK..KFLEK..........",
        "...........KGGLKKFGEK...........",
        "..KKKKKKKK.KEELEGLEEK.KKKKKKKK..",
        ".KGFFFFGGLKKKKEKKEKKKKGFGGLLEEK.",
        ".KEFFFFGGGLLK.KEEK.KFFFGGLLEEEK.",
        "..KGGGGGGGLLEKKSSKKFFFGGLLEEEK..",
        "..KEELGLLLLLEEKSSKFFGGGLLEEEEK..",
        "...KKELLLLLEEEKESKGGGLLEEEEKK...",
        ".....KEEEEEEEEEKKLLLLEEEEEK.....",
        "......KKEEEEKKKKKKKKEEEEKK......",
        "........KKKKAAADDDNNKKKK........",
        "........KKPPPDPPHHHAADK.........",
        ".......KMQQQQDPPHHHAADDK........",
        "........KQMMMAAHHHHAANDK........",
        "......KKPAAAAAPKKHAAADNDKK......",
        ".....KYKPPPPKKKUUKKKADNDKZK.....",
        "....KZYKPPPKUUUUUVVVKDNNKRZK....",
        "...KRZYKHHHKUWWUVWWVKNDNKYZYK...",
        "..KRZYXKHHHKUWWVVWWVKNDNKXZYXK..",
        "..KZYXXKHHHKVVVVVVVVKNNNKXZYXK..",
        ".KZZXXKNAHDNKKKVVKKKNNNNNKXYXXK.",
        ".KYYXK.KAADANNNKKNNNNNNNK.KXXXK.",
        ".KXXK..KNAADAAANNNDDNNNNK..KXXK.",
        ".KRYXK..KDADDDDDDDNQQQNK..KXZYK.",
        ".KXXK.K.KNDDDDDDNQQQQQMMKK.KXXK.",
        "..KKKKRKKKKNDDDNNNNMMMKKKYKKKK..",
        "...KXRRRZZXKKNKKKKNKKYYZZYXXK...",
        "....KXZZYYYYXKYYXXKYYZZYYXXK....",
        ".....KXXXXXXXXXYYXXZYYXXXXK.....",
        "......KKKXXXXKKXXKKXXXXKKK......",
        ".........KKKK..KK..KKKK........."
      ]
    },

    sproutLordArmsOut: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "E": "#2c5a22", "L": "#4f9637", "G": "#84c95a", "F": "#b8e07a", "S": "#4f7a2c", "V": "#1a0f08", "U": "#2e1a10",
        "M": "#3f6b2a", "Q": "#6f9a43", "X": "#1c130a", "Y": "#3a2817", "Z": "#5c4229", "R": "#7a5a38", "W": "#ffe36e"
      },
      pixels: [
        "...........KKK....KKK...........",
        "..........KEFGK..KFLEK..........",
        "...........KGGLKKFGEK...........",
        "..KKKKKKKK.KEELEGLEEK.KKKKKKKK..",
        ".KGFFFFGGLKKKKEKKEKKKKGFGGLLEEK.",
        ".KEFFFFGGGLLK.KEEK.KFFFGGLLEEEK.",
        "..KGGGGGGGLLEKKSSKKFFFGGLLEEEK..",
        "..KEELGLLLLLEEKSSKFFGGGLLEEEEK..",
        "...KKELLLLLEEEKESKGGGLLEEEEKK...",
        ".....KEEEEEEEEEKKLLLLEEEEEK.....",
        "......KKEEEEKKKKKKKKEEEEKK......",
        "........KKKKAAADDDNNKKKK........",
        "........KKPPPDPPHHHAADK.........",
        ".......KMQQQQDPPHHHAADDK........",
        "K.KKKKK.KQMMMAAHHHHAANDK.KKKKK.K",
        "ZKRRRZYKPAAAAAPKKHAAADNDKZZYYXKX",
        "ZZYZZYYKPPPPKKKUUKKKADNDKRYZYYXX",
        "YXXXXYKKPPPKUUUUUVVVKDNNKKYXZZYX",
        "KKXXKK.KHHHKUWWUVWWVKNDNK.KKXXKK",
        "..KNK..KHHHKUWWVVWWVKNDNK..KNK..",
        "...K...KHHHKVVVVVVVVKNNNK...K...",
        ".......KAHDNKKKVVKKKNNNNK.......",
        ".......KAADANNNKKNNNNNNNK.......",
        ".......KNAADAAANNNDDNNNNK.......",
        "........KDADDDDDDDNQQQNK........",
        "......K.KNDDDDDDNQQQQQMMKK......",
        "...KKKRKKKKNDDDNNNNMMMKKKYKKK...",
        "...KXRRRZZXKKNKKKKNKKYYZZYXXK...",
        "....KXZZYYYYXKYYXXKYYZZYYXXK....",
        ".....KXXXXXXXXXYYXXZYYXXXXK.....",
        "......KKKXXXXKKXXKKXXXXKKK......",
        ".........KKKK..KK..KKKK........."
      ]
    },

    sproutLordArmsUp: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "E": "#2c5a22", "L": "#4f9637", "G": "#84c95a", "F": "#b8e07a", "S": "#4f7a2c", "V": "#1a0f08", "U": "#2e1a10",
        "M": "#3f6b2a", "Q": "#6f9a43", "X": "#1c130a", "Y": "#3a2817", "Z": "#5c4229", "R": "#7a5a38", "W": "#ffe36e"
      },
      pixels: [
        "...........KKK....KKK...........",
        "..........KEFGK..KFLEK..........",
        "...........KGGLKKFGEK...........",
        "..KKKKKKKK.KEELEGLEEK.KKKKKKKK..",
        ".KGFFFFGGLKKKKEKKEKKKKGFGGLLEEK.",
        ".KEFFFFGGGLLK.KEEK.KFFFGGLLEEEK.",
        "..KGGGGGGGLLEKKSSKKFFFGGLLEEEK..",
        "..KEELGLLLLLEEKSSKFFGGGLLEEEEK..",
        "...KKELLLLLEEEKESKGGGLLEEEEKK...",
        "KKKK.KEEEEEEEEEKKLLLLEEEEEK.KKKK",
        "RXYZK.KKEEEEKKKKKKKKEEEEKK.KXXXY",
        "YXYZZK..KKKKAAADDDNNKKKK..KXXXXZ",
        "XKXXYRK.KKPPPDPPHHHAADK..KXYYXKX",
        "KKXXYRRKMQQQQDPPHHHAADDKKYYZZXKK",
        "..KXXZZKKQMMMAAHHHHAANDKKZZXXK..",
        ".KNKKYYYPAAAAAPKKHAAADNDZRYKKNK.",
        "..K..KKKPPPPKKKUUKKKADNDKKK..K..",
        ".......KPPPKUUUUUVVVKDNNK.......",
        ".......KHHHKUWWUVWWVKNDNK.......",
        ".......KHHHKUWWVVWWVKNDNK.......",
        ".......KHHHKVVVVVVVVKNNNK.......",
        ".......KAHDNKKKVVKKKNNNNK.......",
        ".......KAADANNNKKNNNNNNNK.......",
        ".......KNAADAAANNNDDNNNNK.......",
        "........KDADDDDDDDNQQQNK........",
        "......K.KNDDDDDDNQQQQQMMKK......",
        "...KKKRKKKKNDDDNNNNMMMKKKYKKK...",
        "...KXRRRZZXKKNKKKKNKKYYZZYXXK...",
        "....KXZZYYYYXKYYXXKYYZZYYXXK....",
        ".....KXXXXXXXXXYYXXZYYXXXXK.....",
        "......KKKXXXXKKXXKKXXXXKKK......",
        ".........KKKK..KK..KKKK........."
      ]
    },

    sproutLordLeafL: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "E": "#2c5a22", "L": "#4f9637", "G": "#84c95a", "F": "#b8e07a", "S": "#4f7a2c", "V": "#1a0f08", "U": "#2e1a10",
        "M": "#3f6b2a", "Q": "#6f9a43", "X": "#1c130a", "Y": "#3a2817", "Z": "#5c4229", "R": "#7a5a38", "W": "#ffe36e"
      },
      pixels: [
        "...........KK....KKEK...........",
        "..........KFGK..KFLEK.......K...",
        ".........KEGGLKKFGEK.KKKKKKKEK..",
        "..........KEELEGLEEKKGFGGLLEEK..",
        "...KKKKKK.KEKEKKEKKKFFGGLLEEK...",
        ".KKFFFGGLKKK.KEEK.KFFGGLLEEEK...",
        "KGFFFFGGGLLKKKKSSKKFGGGLLEEEK...",
        ".KEFGGGGGGLLEEKSSKFFGLLEEEEK....",
        "..KGELGLLLLLEEKESKGGLEEEEEK.....",
        "..KEKELLLLLEEEEKKLLLEEEEKK......",
        "...K.KEEEEEEKKKKKKKKKKKK........",
        "......KKKKKKAAADDDNNKKK.........",
        "........KKPPPDPPHHHAADK.........",
        ".......KMQQQQDPPHHHAADDK........",
        "........KQMMMAAHHHHAANDK........",
        "......KKPAAAAAPKKHAAADNDKK......",
        ".....KYKPPPPKKKUUKKKADNDKZK.....",
        "....KZYKPPPKUUUUUVVVKDNNKRZK....",
        "...KRZYKHHHKUWWUVWWVKNDNKYZYK...",
        "..KRZYXKHHHKUWWVVWWVKNDNKXZYXK..",
        "..KZYXXKHHHKVVVVVVVVKNNNKXZYXK..",
        ".KZZXXKNAHDNKKKVVKKKNNNNNKXYXXK.",
        ".KYYXK.KAADANNNKKNNNNNNNK.KXXXK.",
        ".KXXK..KNAADAAANNNDDNNNNK..KXXK.",
        ".KRYXK..KDADDDDDDDNQQQNK..KXZYK.",
        ".KXXK.K.KNDDDDDDNQQQQQMMKK.KXXK.",
        "..KKKKRKKKKNDDDNNNNMMMKKKYKKKK..",
        "...KXRRRZZXKKNKKKKNKKYYZZYXXK...",
        "....KXZZYYYYXKYYXXKYYZZYYXXK....",
        ".....KXXXXXXXXXYYXXZYYXXXXK.....",
        "......KKKXXXXKKXXKKXXXXKKK......",
        ".........KKKK..KK..KKKK........."
      ]
    },

    sproutLordLeafR: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "E": "#2c5a22", "L": "#4f9637", "G": "#84c95a", "F": "#b8e07a", "S": "#4f7a2c", "V": "#1a0f08", "U": "#2e1a10",
        "M": "#3f6b2a", "Q": "#6f9a43", "X": "#1c130a", "Y": "#3a2817", "Z": "#5c4229", "R": "#7a5a38", "W": "#ffe36e"
      },
      pixels: [
        "...........KEKK....KK...........",
        "...K.......KEFGK..KFLK..........",
        "..KGKKKKKKK.KGGLKKFGEEK.........",
        "..KEFFFFGGLKKEELEGLEEK..........",
        "...KFFFFGGGLKKKEKKEKEK.KKKKKK...",
        "...KGGGGGGGLLK.KEEK.KKKGFGGLLKK.",
        "...KELGLLLLLEKKSSKKKKFFFGGLLEEEK",
        "....KELLLLLEEEKSSKFFFFGGLLEEEEK.",
        ".....KEEEEEEEEKESKGGGGGLLEEEEK..",
        "......KKEEEEEEEKKLLLGLLEEEEKEK..",
        "........KKKKKKKKKKKKLEEEEEK.K...",
        ".........KKKAAADDDNNKKKKKK......",
        "........KKPPPDPPHHHAADK.........",
        ".......KMQQQQDPPHHHAADDK........",
        "........KQMMMAAHHHHAANDK........",
        "......KKPAAAAAPKKHAAADNDKK......",
        ".....KYKPPPPKKKUUKKKADNDKZK.....",
        "....KZYKPPPKUUUUUVVVKDNNKRZK....",
        "...KRZYKHHHKUWWUVWWVKNDNKYZYK...",
        "..KRZYXKHHHKUWWVVWWVKNDNKXZYXK..",
        "..KZYXXKHHHKVVVVVVVVKNNNKXZYXK..",
        ".KZZXXKNAHDNKKKVVKKKNNNNNKXYXXK.",
        ".KYYXK.KAADANNNKKNNNNNNNK.KXXXK.",
        ".KXXK..KNAADAAANNNDDNNNNK..KXXK.",
        ".KRYXK..KDADDDDDDDNQQQNK..KXZYK.",
        ".KXXK.K.KNDDDDDDNQQQQQMMKK.KXXK.",
        "..KKKKRKKKKNDDDNNNNMMMKKKYKKKK..",
        "...KXRRRZZXKKNKKKKNKKYYZZYXXK...",
        "....KXZZYYYYXKYYXXKYYZZYYXXK....",
        ".....KXXXXXXXXXYYXXZYYXXXXK.....",
        "......KKKXXXXKKXXKKXXXXKKK......",
        ".........KKKK..KK..KKKK........."
      ]
    },

    sproutLordGlare: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "E": "#2c5a22", "L": "#4f9637", "G": "#84c95a", "F": "#b8e07a", "S": "#4f7a2c", "V": "#1a0f08", "U": "#2e1a10",
        "M": "#3f6b2a", "Q": "#6f9a43", "X": "#1c130a", "Y": "#3a2817", "Z": "#5c4229", "R": "#7a5a38", "W": "#ffe36e"
      },
      pixels: [
        "...........KKK....KKK...........",
        "..........KEFGK..KFLEK..........",
        "...........KGGLKKFGEK...........",
        "..KKKKKKKK.KEELEGLEEK.KKKKKKKK..",
        ".KGFFFFGGLKKKKEKKEKKKKGFGGLLEEK.",
        ".KEFFFFGGGLLK.KEEK.KFFFGGLLEEEK.",
        "..KGGGGGGGLLEKKSSKKFFFGGLLEEEK..",
        "..KEELGLLLLLEEKSSKFFGGGLLEEEEK..",
        "...KKELLLLLEEEKESKGGGLLEEEEKK...",
        ".....KEEEEEEEEEKKLLLLEEEEEK.....",
        "......KKEEEEKKKKKKKKEEEEKK......",
        "........KKKKAAADDDNNKKKK........",
        "........KKPPPDPPHHHAADK.........",
        ".......KMQQQQDPPHHHAADDK........",
        "K.KKKKK.KQMMMAAHHHHAANDK.KKKKK.K",
        "ZKRRRZYKPAAAAAPKKHAAADNDKZZYYXKX",
        "ZZYZZYYKPPPPKKKUUKKKADNDKRYZYYXX",
        "YXXXXYKKPPPKUUUUUVVVKDNNKKYXZZYX",
        "KKXXKK.KHHHKWWWUVWWWKNDNK.KKXXKK",
        "..KNK..KHHHKWWWVVWWWKNDNK..KNK..",
        "...K...KHHHKUUUUUUUUKNNNK...K...",
        ".......KAHDNKKKVVKKKNNNNK.......",
        ".......KAADANNNKKNNNNNNNK.......",
        ".......KNAADAAANNNDDNNNNK.......",
        "........KDADDDDDDDNQQQNK........",
        "......K.KNDDDDDDNQQQQQMMKK......",
        "...KKKRKKKKNDDDNNNNMMMKKKYKKK...",
        "...KXRRRZZXKKNKKKKNKKYYZZYXXK...",
        "....KXZZYYYYXKYYXXKYYZZYYXXK....",
        ".....KXXXXXXXXXYYXXZYYXXXXK.....",
        "......KKKXXXXKKXXKKXXXXKKK......",
        ".........KKKK..KK..KKKK........."
      ]
    },

    sproutLordSleep: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "E": "#2c5a22", "L": "#4f9637", "G": "#84c95a", "F": "#b8e07a", "S": "#4f7a2c", "V": "#1a0f08", "U": "#2e1a10",
        "M": "#3f6b2a", "Q": "#6f9a43", "X": "#1c130a", "Y": "#3a2817", "Z": "#5c4229", "R": "#7a5a38", "W": "#ffe36e"
      },
      pixels: [
        "................................",
        ".........KKKK......KKKK.........",
        "........KEFGLKK..KKFFLEK........",
        ".........KGGLLEKKGLLGEK.........",
        "........K.KEKEK..KEKEK.K........",
        "...KKKKKLKKK.KEKKEK.KKKGKKKKK...",
        ".KKFFFGGGLLK.KSKKSK.KFFFFGGLLKK.",
        "KGFFFFGGGLLEKKSKKSKKFFFGGGLLEEEK",
        "KEFGGGGGLLLEEEKESKGFFGGGGLLEEEEK",
        ".KKEELGLLLLEEEEKKLLGGLLELEEEEKK.",
        "...KKELLEEEEEKKKKKKLLEEEEEEKK...",
        ".....KEEKKKKAAADDDNNKKKKEEK.....",
        "......KKKKPPPDPPHHHAADK.KK......",
        ".......KMQQQQDPPHHHAADDK........",
        "........KQMMMAAHHHHAANDK........",
        "......KKPAAAAAPKKHAAADNDKK......",
        ".....KYKPPPPKKKUUKKKADNDKZK.....",
        "....KZYKPPPKUUUUUVVVKDNNKRZK....",
        "...KRZYKHHHKUVVUVVVVKNDNKYZYK...",
        "..KRZYXKHHHKUWWVVWWVKNDNKXZYXK..",
        "..KZYXXKHHHKVVVVVVVVKNNNKXZYXK..",
        ".KZZXXKNAHDNKKKVVKKKNNNNNKXYXXK.",
        ".KYYXK.KAADANNNKKNNNNNNNK.KXXXK.",
        ".KXXK..KNAADAAANNNDDNNNNK..KXXK.",
        ".KRYXK..KDADDDDDDDNQQQNK..KXZYK.",
        ".KXXK.K.KNDDDDDDNQQQQQMMKK.KXXK.",
        "..KKKKRKKKKNDDDNNNNMMMKKKYKKKK..",
        "...KXRRRZZXKKNKKKKNKKYYZZYXXK...",
        "....KXZZYYYYXKYYXXKYYZZYYXXK....",
        ".....KXXXXXXXXXYYXXZYYXXXXK.....",
        "......KKKXXXXKKXXKKXXXXKKK......",
        ".........KKKK..KK..KKKK........."
      ]
    },

    /**
     * 千年樹の根底の主カラクリモリ（v1.0.3。名前は作者が確定 2026-11-10）。昔だれかが千年樹を守らせるために置いた、木と真鍮のからくり。
     * 胸の窓の奥で琥珀の芯が光り、それで動いている。右の耳から肩・腕へ根が絡み、頭と肩に苔がむす。
     *   木（N〜P）・真鍮（B・C・T・I）・琥珀（J・O・Q・W）・根（X・R・Z・Y）・苔（M・G）
     *   左半分を描いて左右を写し、右側は1段暗くした（光は左上から）。根・苔・左耳のボルトはそのあとで置いた
     * 動くコマ：
     *   Glow    … 胸の芯を1段明るくした（ふだんの脈・光る技）
     *   Gear    … 肩とひじの歯車の光る歯をずらした（歯車が回る）
     *   ArmsOut … 腕を肩の高さまで上げ、はさみの手を開いた
     *   ArmsUp  … 腕を頭の上まで振り上げた
     *   Glare   … ArmsOut の目を大きく光らせ、胸の芯も明るくした（にらむ・技を放つ）
     *   Sleep   … 目の光を消し、胸の芯を暗くした（歯車が止まる）
     * カラクリモリ専用の動きのコマ（2026-11-03）。形は描き直さず、上の絵の腕・脚・頭・胸を切り分けて組み直した：
     *   Claw    … 両手のはさみを閉じた（ふだんの、はさみを開け閉めするコマ）
     *   ArmRUp / ArmLUp … 片腕だけ頭の上へ振り上げた（ArmsUp の片側。胸は Glow）
     *   StepL / StepR   … 片足を2段上げて踏み出す。反対の腕を肩の高さに上げて釣り合いをとる
     *   Crouch  … 膝を折って体を2段沈め、腕を下げた（叩きつけた瞬間・守り・溜め）
     *   SparkA / SparkB … Glare の胸と目で、腕を広げる（A）／掲げる（B）。体のまわりに火花が散る（放電・雷の技）
     *   Recoil  … 目を閉じ、腕が跳ね上がり、片足が浮く（被弾）
     *   Slump   … 膝が折れ、頭が肩に沈み、目と胸の光が消え、はさみが閉じる（倒れる）
     */
    gearWarden: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a",                     // 真鍮
        "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",                     // 琥珀（目と胸の芯）
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44",                     // 根
        "M": "#3f6b2a", "G": "#6f9a43"                                                       // 苔
      },
      pixels: [
        "..........KKKKKKKKKKKK..........",
        ".........KCMGGMTTTTMGCK.........",
        ".........KBCMCCCCCCCCBK.........",
        "........KKKHPPPPHHHHAKZK........",
        "........KCKHPAAPHAAHAKRK........",
        "........KTKHAWWDDWWAAKRK........",
        "........KCKHAQQDDQQAAKRK........",
        "........KKKHDKDKKDKDAKZK........",
        "........KKKBCCCCCCCCBKZK........",
        "...........KKBCTTCBKKKYK.KZK....",
        "..KKKKK.KKKKKKKKKKKKKKZR.ZYKKK..",
        ".KMGGTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCMIITCKKHAPAAKKKKAAHAAKKCYZITCK",
        "KCTTTTCKKHAACKJJJJKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKJOOOOJKCAAKKBCTYCBK",
        "..KCTCK.KHACKOQWWQOKCAAK.KCZCK..",
        "..KBCBK.KHACKOQQQQOKCAAK.KBCYK..",
        "..KCTCK.KHACKJOOOOJKCAAK.KCZCK..",
        "..KBCBK.KHAACKJJJJKCAAAK.KYCBK..",
        ".KCTTCK.KHAPAAKKKKAAHAAK.KCTTCK.",
        ".KTIITK.KBCCCCCCCCCCCCBK.KTIITK.",
        ".KCTTCK.KBCTTTTTTTTTTCBK.KCTTCK.",
        "..KADK..KKNDAAAAAAAADNKK..KDAK..",
        "..KADK...KNZAAAKKAAADNK...KDAK..",
        ".KBCCBK..KNYAAK..KAADNK..KBCCBK.",
        "KCTTTTCK.KZCCBK..KBCCBK.KCTTTTCK",
        "KTK..KTK.KNYAAK..KAADNK.KTK..KTK",
        "KK....KK.KZDAAK..KAADNK.KK....KK",
        "....KZZKKBCTTCK..KCTTCBKKZZK....",
        "...KZGMZZKKKKKKZZKKKKKKZZRMZK...",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    gearWardenGlow: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a", "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44", "M": "#3f6b2a", "G": "#6f9a43"
      },
      pixels: [
        "..........KKKKKKKKKKKK..........",
        ".........KCMGGMTTTTMGCK.........",
        ".........KBCMCCCCCCCCBK.........",
        "........KKKHPPPPHHHHAKZK........",
        "........KCKHPAAPHAAHAKRK........",
        "........KTKHAWWDDWWAAKRK........",
        "........KCKHAQQDDQQAAKRK........",
        "........KKKHDKDKKDKDAKZK........",
        "........KKKBCCCCCCCCBKZK........",
        "...........KKBCTTCBKKKYK.KZK....",
        "..KKKKK.KKKKKKKKKKKKKKZR.ZYKKK..",
        ".KMGGTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCMIITCKKHAPAAKKKKAAHAAKKCYZITCK",
        "KCTTTTCKKHAACKOOOOKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKOQQQQOKCAAKKBCTYCBK",
        "..KCTCK.KHACKQWWWWQKCAAK.KCZCK..",
        "..KBCBK.KHACKQWWWWQKCAAK.KBCYK..",
        "..KCTCK.KHACKOQQQQOKCAAK.KCZCK..",
        "..KBCBK.KHAACKOOOOKCAAAK.KYCBK..",
        ".KCTTCK.KHAPAAKKKKAAHAAK.KCTTCK.",
        ".KTIITK.KBCCCCCCCCCCCCBK.KTIITK.",
        ".KCTTCK.KBCTTTTTTTTTTCBK.KCTTCK.",
        "..KADK..KKNDAAAAAAAADNKK..KDAK..",
        "..KADK...KNZAAAKKAAADNK...KDAK..",
        ".KBCCBK..KNYAAK..KAADNK..KBCCBK.",
        "KCTTTTCK.KZCCBK..KBCCBK.KCTTTTCK",
        "KTK..KTK.KNYAAK..KAADNK.KTK..KTK",
        "KK....KK.KZDAAK..KAADNK.KK....KK",
        "....KZZKKBCTTCK..KCTTCBKKZZK....",
        "...KZGMZZKKKKKKZZKKKKKKZZRMZK...",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    gearWardenGear: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a", "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44", "M": "#3f6b2a", "G": "#6f9a43"
      },
      pixels: [
        "..........KKKKKKKKKKKK..........",
        ".........KCMGGMTTTTMGCK.........",
        ".........KBCMCCCCCCCCBK.........",
        "........KKKHPPPPHHHHAKZK........",
        "........KCKHPAAPHAAHAKRK........",
        "........KTKHAWWDDWWAAKRK........",
        "........KCKHAQQDDQQAAKRK........",
        "........KKKHDKDKKDKDAKZK........",
        "........KKKBCCCCCCCCBKZK........",
        "...........KKBCTTCBKKKYK.KZK....",
        "..KKKKK.KKKKKKKKKKKKKKZR.ZYKKK..",
        ".KMGGTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCMTTICKKHAPAAKKKKAAHAAKKCYZTICK",
        "KCTTTTCKKHAACKJJJJKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKJOOOOJKCAAKKBCTYCBK",
        "..KCTCK.KHACKOQWWQOKCAAK.KCZCK..",
        "..KBCBK.KHACKOQQQQOKCAAK.KBCYK..",
        "..KCTCK.KHACKJOOOOJKCAAK.KCZCK..",
        "..KBCBK.KHAACKJJJJKCAAAK.KYCBK..",
        ".KCTTCK.KHAPAAKKKKAAHAAK.KCTTCK.",
        ".KITTIK.KBCCCCCCCCCCCCBK.KITTIK.",
        ".KCTTCK.KBCTTTTTTTTTTCBK.KCTTCK.",
        "..KADK..KKNDAAAAAAAADNKK..KDAK..",
        "..KADK...KNZAAAKKAAADNK...KDAK..",
        ".KBCCBK..KNYAAK..KAADNK..KBCCBK.",
        "KCTTTTCK.KZCCBK..KBCCBK.KCTTTTCK",
        "KTK..KTK.KNYAAK..KAADNK.KTK..KTK",
        "KK....KK.KZDAAK..KAADNK.KK....KK",
        "....KZZKKBCTTCK..KCTTCBKKZZK....",
        "...KZGMZZKKKKKKZZKKKKKKZZRMZK...",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    gearWardenArmsOut: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a", "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44", "M": "#3f6b2a", "G": "#6f9a43"
      },
      pixels: [
        "..........KKKKKKKKKKKK..........",
        ".........KCMGGMTTTTMGCK.........",
        ".........KBCMCCCCCCCCBK.........",
        "KK....KKKKKHPPPPHHHHAKZKKK....KK",
        "KTK..KTKKCKHPAAPHAAHAKRKKTK..KTK",
        "KCTTTTCKKTKHAWWDDWWAAKRKKCTTTTCK",
        ".KBCCBK.KCKHAQQDDQQAAKRK.KBCCBK.",
        ".KCTTCK.KKKHDKDKKDKDAKZK.KCTTCK.",
        ".KTIITK.KKKBCCCCCCCCBKZK.KTIITK.",
        "..KCTCK....KKBCTTCBKKKYK.KCTCK..",
        "..KCTCK.KKKKKKKKKKKKKKZR.ZYTCK..",
        ".KCTTTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCTIITCKKHAPAAKKKKAAHAAKKCYZITCK",
        "KCTTTTCKKHAACKJJJJKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKJOOOOJKCAAKKBCTYCBK",
        "........KHACKOQWWQOKCAAK........",
        "........KHACKOQQQQOKCAAK........",
        "........KHACKJOOOOJKCAAK........",
        "........KHAACKJJJJKCAAAK........",
        "........KHAPAAKKKKAAHAAK........",
        "........KBCCCCCCCCCCCCBK........",
        "........KBCTTTTTTTTTTCBK........",
        "........KKNDAAAAAAAADNKK........",
        ".........KNZAAAKKAAADNK.........",
        ".........KNYAAK..KAADNK.........",
        ".........KZCCBK..KBCCBK.........",
        ".........KNYAAK..KAADNK.........",
        ".........KZDAAK..KAADNK.........",
        "....KZZKKBCTTCK..KCTTCBKKZZK....",
        "...KZGMZZKKKKKKZZKKKKKKZZRMZK...",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    gearWardenArmsUp: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a", "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44", "M": "#3f6b2a", "G": "#6f9a43"
      },
      pixels: [
        "KK....KK..KKKKKKKKKKKK..KK....KK",
        "KTK..KTK.KCMGGMTTTTMGCK.KTK..KTK",
        "KCTTTTCK.KBCMCCCCCCCCBK.KCTTTTCK",
        ".KBCCBK.KKKHPPPPHHHHAKZK.KBCCBK.",
        "..KADK..KCKHPAAPHAAHAKRK..KDAK..",
        "..KADK..KTKHAWWDDWWAAKRK..KDAK..",
        ".KCTTCK.KCKHAQQDDQQAAKRK.KCTTCK.",
        ".KTIITK.KKKHDKDKKDKDAKZK.KTIITK.",
        ".KCTTCK.KKKBCCCCCCCCBKZK.KCTTCK.",
        "..KBCBK....KKBCTTCBKKKYK.KBCBK..",
        "..KCTCK.KKKKKKKKKKKKKKZR.ZYTCK..",
        ".KCTTTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCTIITCKKHAPAAKKKKAAHAAKKCYZITCK",
        "KCTTTTCKKHAACKJJJJKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKJOOOOJKCAAKKBCTYCBK",
        "........KHACKOQWWQOKCAAK........",
        "........KHACKOQQQQOKCAAK........",
        "........KHACKJOOOOJKCAAK........",
        "........KHAACKJJJJKCAAAK........",
        "........KHAPAAKKKKAAHAAK........",
        "........KBCCCCCCCCCCCCBK........",
        "........KBCTTTTTTTTTTCBK........",
        "........KKNDAAAAAAAADNKK........",
        ".........KNZAAAKKAAADNK.........",
        ".........KNYAAK..KAADNK.........",
        ".........KZCCBK..KBCCBK.........",
        ".........KNYAAK..KAADNK.........",
        ".........KZDAAK..KAADNK.........",
        "....KZZKKBCTTCK..KCTTCBKKZZK....",
        "...KZGMZZKKKKKKZZKKKKKKZZRMZK...",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    gearWardenGlare: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a", "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44", "M": "#3f6b2a", "G": "#6f9a43"
      },
      pixels: [
        "..........KKKKKKKKKKKK..........",
        ".........KCMGGMTTTTMGCK.........",
        ".........KBCMCCCCCCCCBK.........",
        "KK....KKKKKHPPPPHHHHAKZKKK....KK",
        "KTK..KTKKCKHPQQPHQQHAKRKKTK..KTK",
        "KCTTTTCKKTKHAWWDDWWAAKRKKCTTTTCK",
        ".KBCCBK.KCKHAWWDDWWAAKRK.KBCCBK.",
        ".KCTTCK.KKKHDKDKKDKDAKZK.KCTTCK.",
        ".KTIITK.KKKBCCCCCCCCBKZK.KTIITK.",
        "..KCTCK....KKBCTTCBKKKYK.KCTCK..",
        "..KCTCK.KKKKKKKKKKKKKKZR.ZYTCK..",
        ".KCTTTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCTIITCKKHAPAAKKKKAAHAAKKCYZITCK",
        "KCTTTTCKKHAACKOOOOKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKOQQQQOKCAAKKBCTYCBK",
        "........KHACKQWWWWQKCAAK........",
        "........KHACKQWWWWQKCAAK........",
        "........KHACKOQQQQOKCAAK........",
        "........KHAACKOOOOKCAAAK........",
        "........KHAPAAKKKKAAHAAK........",
        "........KBCCCCCCCCCCCCBK........",
        "........KBCTTTTTTTTTTCBK........",
        "........KKNDAAAAAAAADNKK........",
        ".........KNZAAAKKAAADNK.........",
        ".........KNYAAK..KAADNK.........",
        ".........KZCCBK..KBCCBK.........",
        ".........KNYAAK..KAADNK.........",
        ".........KZDAAK..KAADNK.........",
        "....KZZKKBCTTCK..KCTTCBKKZZK....",
        "...KZGMZZKKKKKKZZKKKKKKZZRMZK...",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    gearWardenSleep: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a", "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44", "M": "#3f6b2a", "G": "#6f9a43"
      },
      pixels: [
        "..........KKKKKKKKKKKK..........",
        ".........KCMGGMTTTTMGCK.........",
        ".........KBCMCCCCCCCCBK.........",
        "........KKKHPPPPHHHHAKZK........",
        "........KCKHPAAPHAAHAKRK........",
        "........KTKHAKKDDKKAAKRK........",
        "........KCKHABBDDBBAAKRK........",
        "........KKKHDKDKKDKDAKZK........",
        "........KKKBCCCCCCCCBKZK........",
        "...........KKBCTTCBKKKYK.KZK....",
        "..KKKKK.KKKKKKKKKKKKKKZR.ZYKKK..",
        ".KMGGTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCMIITCKKHAPAAKKKKAAHAAKKCYZITCK",
        "KCTTTTCKKHAACKJJJJKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKJJJJJJKCAAKKBCTYCBK",
        "..KCTCK.KHACKJOQQOJKCAAK.KCZCK..",
        "..KBCBK.KHACKJOOOOJKCAAK.KBCYK..",
        "..KCTCK.KHACKJJJJJJKCAAK.KCZCK..",
        "..KBCBK.KHAACKJJJJKCAAAK.KYCBK..",
        ".KCTTCK.KHAPAAKKKKAAHAAK.KCTTCK.",
        ".KTIITK.KBCCCCCCCCCCCCBK.KTIITK.",
        ".KCTTCK.KBCTTTTTTTTTTCBK.KCTTCK.",
        "..KADK..KKNDAAAAAAAADNKK..KDAK..",
        "..KADK...KNZAAAKKAAADNK...KDAK..",
        ".KBCCBK..KNYAAK..KAADNK..KBCCBK.",
        "KCTTTTCK.KZCCBK..KBCCBK.KCTTTTCK",
        "KTK..KTK.KNYAAK..KAADNK.KTK..KTK",
        "KK....KK.KZDAAK..KAADNK.KK....KK",
        "....KZZKKBCTTCK..KCTTCBKKZZK....",
        "...KZGMZZKKKKKKZZKKKKKKZZRMZK...",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    gearWardenClaw: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a", "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44", "M": "#3f6b2a", "G": "#6f9a43"
      },
      pixels: [
        "..........KKKKKKKKKKKK..........",
        ".........KCMGGMTTTTMGCK.........",
        ".........KBCMCCCCCCCCBK.........",
        "........KKKHPPPPHHHHAKZK........",
        "........KCKHPAAPHAAHAKRK........",
        "........KTKHAWWDDWWAAKRK........",
        "........KCKHAQQDDQQAAKRK........",
        "........KKKHDKDKKDKDAKZK........",
        "........KKKBCCCCCCCCBKZK........",
        "...........KKBCTTCBKKKYK.KZK....",
        "..KKKKK.KKKKKKKKKKKKKKZR.ZYKKK..",
        ".KMGGTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCMIITCKKHAPAAKKKKAAHAAKKCYZITCK",
        "KCTTTTCKKHAACKJJJJKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKJOOOOJKCAAKKBCTYCBK",
        "..KCTCK.KHACKOQWWQOKCAAK.KCZCK..",
        "..KBCBK.KHACKOQQQQOKCAAK.KBCYK..",
        "..KCTCK.KHACKJOOOOJKCAAK.KCZCK..",
        "..KBCBK.KHAACKJJJJKCAAAK.KYCBK..",
        ".KCTTCK.KHAPAAKKKKAAHAAK.KCTTCK.",
        ".KTIITK.KBCCCCCCCCCCCCBK.KTIITK.",
        ".KCTTCK.KBCTTTTTTTTTTCBK.KCTTCK.",
        "..KADK..KKNDAAAAAAAADNKK..KDAK..",
        "..KADK...KNZAAAKKAAADNK...KDAK..",
        ".KBCCBK..KNYAAK..KAADNK..KBCCBK.",
        "KCTTTTCK.KZCCBK..KBCCBK.KCTTTTCK",
        ".KTKKTK..KNYAAK..KAADNK..KTKKTK.",
        "..KKKK...KZDAAK..KAADNK...KKKK..",
        "....KZZKKBCTTCK..KCTTCBKKZZK....",
        "...KZGMZZKKKKKKZZKKKKKKZZRMZK...",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    gearWardenArmRUp: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a", "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44", "M": "#3f6b2a", "G": "#6f9a43"
      },
      pixels: [
        "..........KKKKKKKKKKKK..KK....KK",
        ".........KCMGGMTTTTMGCK.KTK..KTK",
        ".........KBCMCCCCCCCCBK.KCTTTTCK",
        "........KKKHPPPPHHHHAKZK.KBCCBK.",
        "........KCKHPAAPHAAHAKRK..KDAK..",
        "........KTKHAWWDDWWAAKRK..KDAK..",
        "........KCKHAQQDDQQAAKRK.KCTTCK.",
        "........KKKHDKDKKDKDAKZK.KTIITK.",
        "........KKKBCCCCCCCCBKZK.KCTTCK.",
        "...........KKBCTTCBKKKYK.KBCBK..",
        "..KKKKK.KKKKKKKKKKKKKKZR.ZYTCK..",
        ".KMGGTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCMIITCKKHAPAAKKKKAAHAAKKCYZITCK",
        "KCTTTTCKKHAACKOOOOKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKOQQQQOKCAAKKBCTYCBK",
        "..KCTCK.KHACKQWWWWQKCAAK........",
        "..KBCBK.KHACKQWWWWQKCAAK........",
        "..KCTCK.KHACKOQQQQOKCAAK........",
        "..KBCBK.KHAACKOOOOKCAAAK........",
        ".KCTTCK.KHAPAAKKKKAAHAAK........",
        ".KTIITK.KBCCCCCCCCCCCCBK........",
        ".KCTTCK.KBCTTTTTTTTTTCBK........",
        "..KADK..KKNDAAAAAAAADNKK........",
        "..KADK...KNZAAAKKAAADNK.........",
        ".KBCCBK..KNYAAK..KAADNK.........",
        "KCTTTTCK.KZCCBK..KBCCBK.........",
        "KTK..KTK.KNYAAK..KAADNK.........",
        "KK....KK.KZDAAK..KAADNK.........",
        "....KZZKKBCTTCK..KCTTCBKKZZK....",
        "...KZGMZZKKKKKKZZKKKKKKZZRMZK...",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    gearWardenArmLUp: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a", "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44", "M": "#3f6b2a", "G": "#6f9a43"
      },
      pixels: [
        "KK....KK..KKKKKKKKKKKK..........",
        "KTK..KTK.KCMGGMTTTTMGCK.........",
        "KCTTTTCK.KBCMCCCCCCCCBK.........",
        ".KBCCBK.KKKHPPPPHHHHAKZK........",
        "..KADK..KCKHPAAPHAAHAKRK........",
        "..KADK..KTKHAWWDDWWAAKRK........",
        ".KCTTCK.KCKHAQQDDQQAAKRK........",
        ".KTIITK.KKKHDKDKKDKDAKZK........",
        ".KCTTCK.KKKBCCCCCCCCBKZK........",
        "..KBCBK....KKBCTTCBKKKYK.KZK....",
        "..KCTCK.KKKKKKKKKKKKKKZR.ZYKKK..",
        ".KCTTTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCTIITCKKHAPAAKKKKAAHAAKKCYZITCK",
        "KCTTTTCKKHAACKOOOOKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKOQQQQOKCAAKKBCTYCBK",
        "........KHACKQWWWWQKCAAK.KCZCK..",
        "........KHACKQWWWWQKCAAK.KBCYK..",
        "........KHACKOQQQQOKCAAK.KCZCK..",
        "........KHAACKOOOOKCAAAK.KYCBK..",
        "........KHAPAAKKKKAAHAAK.KCTTCK.",
        "........KBCCCCCCCCCCCCBK.KTIITK.",
        "........KBCTTTTTTTTTTCBK.KCTTCK.",
        "........KKNDAAAAAAAADNKK..KDAK..",
        ".........KNZAAAKKAAADNK...KDAK..",
        ".........KNYAAK..KAADNK..KBCCBK.",
        ".........KZCCBK..KBCCBK.KCTTTTCK",
        ".........KNYAAK..KAADNK.KTK..KTK",
        ".........KZDAAK..KAADNK.KK....KK",
        "....KZZKKBCTTCK..KCTTCBKKZZK....",
        "...KZGMZZKKKKKKZZKKKKKKZZRMZK...",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    gearWardenStepL: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a", "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44", "M": "#3f6b2a", "G": "#6f9a43"
      },
      pixels: [
        "..........KKKKKKKKKKKK..........",
        ".........KCMGGMTTTTMGCK.........",
        ".........KBCMCCCCCCCCBK.........",
        "........KKKHPPPPHHHHAKZKKK....KK",
        "........KCKHPAAPHAAHAKRKKTK..KTK",
        "........KTKHAWWDDWWAAKRKKCTTTTCK",
        "........KCKHAQQDDQQAAKRK.KBCCBK.",
        "........KKKHDKDKKDKDAKZK.KCTTCK.",
        "........KKKBCCCCCCCCBKZK.KTIITK.",
        "...........KKBCTTCBKKKYK.KCTCK..",
        "..KKKKK.KKKKKKKKKKKKKKZR.ZYTCK..",
        ".KMGGTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCMIITCKKHAPAAKKKKAAHAAKKCYZITCK",
        "KCTTTTCKKHAACKJJJJKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKJOOOOJKCAAKKBCTYCBK",
        "..KCTCK.KHACKOQWWQOKCAAK........",
        "..KBCBK.KHACKOQQQQOKCAAK........",
        "..KCTCK.KHACKJOOOOJKCAAK........",
        "..KBCBK.KHAACKJJJJKCAAAK........",
        ".KCTTCK.KHAPAAKKKKAAHAAK........",
        ".KTIITK.KBCCCCCCCCCCCCBK........",
        ".KCTTCK.KBCTTTTTTTTTTCBK........",
        "..KADK..KKNDAAAAAAAADNKK........",
        "..KADK...KZCCBK.KAAADNK.........",
        ".KBCCBK..KNYAAK..KAADNK.........",
        "KCTTTTCK.KZDAAK..KBCCBK.........",
        "KTK..KTKKBCTTCK..KAADNK.........",
        "KK....KK.........KAADNK.........",
        "....KZZK.........KCTTCBKKZZK....",
        "...KZGMZZRZZRRZZZKKKKKKZZRMZK...",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    gearWardenStepR: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a", "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44", "M": "#3f6b2a", "G": "#6f9a43"
      },
      pixels: [
        "..........KKKKKKKKKKKK..........",
        ".........KCMGGMTTTTMGCK.........",
        ".........KBCMCCCCCCCCBK.........",
        "KK....KKKKKHPPPPHHHHAKZK........",
        "KTK..KTKKCKHPAAPHAAHAKRK........",
        "KCTTTTCKKTKHAWWDDWWAAKRK........",
        ".KBCCBK.KCKHAQQDDQQAAKRK........",
        ".KCTTCK.KKKHDKDKKDKDAKZK........",
        ".KTIITK.KKKBCCCCCCCCBKZK........",
        "..KCTCK....KKBCTTCBKKKYK.KZK....",
        "..KCTCK.KKKKKKKKKKKKKKZR.ZYKKK..",
        ".KCTTTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCTIITCKKHAPAAKKKKAAHAAKKCYZITCK",
        "KCTTTTCKKHAACKJJJJKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKJOOOOJKCAAKKBCTYCBK",
        "........KHACKOQWWQOKCAAK.KCZCK..",
        "........KHACKOQQQQOKCAAK.KBCYK..",
        "........KHACKJOOOOJKCAAK.KCZCK..",
        "........KHAACKJJJJKCAAAK.KYCBK..",
        "........KHAPAAKKKKAAHAAK.KCTTCK.",
        "........KBCCCCCCCCCCCCBK.KTIITK.",
        "........KBCTTTTTTTTTTCBK.KCTTCK.",
        "........KKNDAAAAAAAADNKK..KDAK..",
        ".........KNZAAAK.KBCCBK...KDAK..",
        ".........KNYAAK..KAADNK..KBCCBK.",
        ".........KZCCBK..KAADNK.KCTTTTCK",
        ".........KNYAAK..KCTTCBKKTK..KTK",
        ".........KZDAAK.........KK....KK",
        "....KZZKKBCTTCK.........KZZK....",
        "...KZGMZZKKKKKKZZRZZRRZZZRMZK...",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    gearWardenCrouch: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a", "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44", "M": "#3f6b2a", "G": "#6f9a43"
      },
      pixels: [
        "................................",
        "................................",
        "..........KKKKKKKKKKKK..........",
        ".........KCMGGMTTTTMGCK.........",
        ".........KBCMCCCCCCCCBK.........",
        "........KKKHPPPPHHHHAKZK........",
        "........KCKHPAAPHAAHAKRK........",
        "........KTKHAWWDDWWAAKRK........",
        "........KCKHAQQDDQQAAKRK........",
        "........KKKHDKDKKDKDAKZK........",
        "........KKKBCCCCCCCCBKZK........",
        "...........KKBCTTCBKKKYK.KZK....",
        "..KKKKK.KKKKKKKKKKKKKKZR.ZYKKK..",
        ".KMGGTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCMIITCKKHAPAAKKKKAAHAAKKCYZITCK",
        "KCTTTTCKKHAACKOOOOKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKOQQQQOKCAAKKBCTYCBK",
        "..KCTCK.KHACKQWWWWQKCAAK.KCZCK..",
        "..KBCBK.KHACKQWWWWQKCAAK.KBCYK..",
        "..KCTCK.KHACKOQQQQOKCAAK.KCZCK..",
        "..KBCBK.KHAACKOOOOKCAAAK.KYCBK..",
        ".KCTTCK.KHAPAAKKKKAAHAAK.KCTTCK.",
        ".KTIITK.KBCCCCCCCCCCCCBK.KTIITK.",
        ".KCTTCK.KBCTTTTTTTTTTCBK.KCTTCK.",
        "..KADK..KKNDAAAAAAAADNKK..KDAK..",
        "..KADK...KZCCBK..KBCCBK...KDAK..",
        ".KBCCBK..KNYAAK..KAADNK..KBCCBK.",
        "KCTTTTCK.KZDAAK..KAADNK.KCTTTTCK",
        "KTK.KKTKKBCTTCK..KCTTCBKKTKK.KTK",
        "KK.KZGKKZKKKKKKZZKKKKKKZKKMZK.KK",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    gearWardenSparkA: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a", "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44", "M": "#3f6b2a", "G": "#6f9a43"
      },
      pixels: [
        "...I......KKKKKKKKKKKK......I...",
        "..W......KCMGGMTTTTMGCK......W..",
        "...WW....KBCMCCCCCCCCBK....WW...",
        "KK...IKKKKKHPPPPHHHHAKZKKKI...KK",
        "KTK..KTKKCKHPQQPHQQHAKRKKTK..KTK",
        "KCTTTTCKKTKHAWWDDWWAAKRKKCTTTTCK",
        ".KBCCBK.KCKHAWWDDWWAAKRK.KBCCBK.",
        ".KCTTCK.KKKHDKDKKDKDAKZK.KCTTCK.",
        ".KTIITK.KKKBCCCCCCCCBKZK.KTIITK.",
        "..KCTCK....KKBCTTCBKKKYK.KCTCK..",
        "..KCTCK.KKKKKKKKKKKKKKZR.ZYTCK..",
        ".KCTTTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCTIITCKKHAPAAKKKKAAHAAKKCYZITCK",
        "KCTTTTCKKHAACKOOOOKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKOQQQQOKCAAKKBCTYCBK",
        "........KHACKQWWWWQKCAAK........",
        ".W......KHACKQWWWWQKCAAK......W.",
        "..WI....KHACKOQQQQOKCAAK....IW..",
        "..W.....KHAACKOOOOKCAAAK.....W..",
        "........KHAPAAKKKKAAHAAK........",
        "...I....KBCCCCCCCCCCCCBK....I...",
        "....W...KBCTTTTTTTTTTCBK...W....",
        "........KKNDAAAAAAAADNKK........",
        ".........KNZAAAKKAAADNK.........",
        ".........KNYAAK..KAADNK.........",
        ".........KZCCBK..KBCCBK.........",
        ".........KNYAAK..KAADNK.........",
        ".........KZDAAK..KAADNK.........",
        "....KZZKKBCTTCK..KCTTCBKKZZK....",
        "...KZGMZZKKKKKKZZKKKKKKZZRMZK...",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    gearWardenSparkB: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a", "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44", "M": "#3f6b2a", "G": "#6f9a43"
      },
      pixels: [
        "KI....KK..KKKKKKKKKKKK..KK....IK",
        "KWI..KTK.KCMGGMTTTTMGCK.KTK..IWK",
        "KWTTTTCK.KBCMCCCCCCCCBK.KCTTTTWK",
        ".KBCCBK.KKKHPPPPHHHHAKZK.KBCCBK.",
        "..KADK..KCKHPQQPHQQHAKRK..KDAK..",
        "..KADK..KTKHAWWDDWWAAKRK..KDAK..",
        ".KCTTCK.KCKHAWWDDWWAAKRK.KCTTCK.",
        ".KTIITK.KKKHDKDKKDKDAKZK.KTIITK.",
        ".KCTTCK.KKKBCCCCCCCCBKZK.KCTTCK.",
        "..KBCBK....KKBCTTCBKKKYK.KBCBK..",
        "..KCTCK.KKKKKKKKKKKKKKZR.ZYTCK..",
        ".KCTTTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCTIITCKKHAPAAKKKKAAHAAKKCYZITCK",
        "KCTTTTCKKHAACKOOOOKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKOQQQQOKCAAKKBCTYCBK",
        "....W...KHACKQWWWWQKCAAK...W....",
        "....WI..KHACKQWWWWQKCAAK..IW....",
        ".....W..KHACKOQQQQOKCAAK..W.....",
        "........KHAACKOOOOKCAAAK........",
        ".W......KHAPAAKKKKAAHAAK......W.",
        "..W.....KBCCCCCCCCCCCCBK.....W..",
        ".I......KBCTTTTTTTTTTCBK......I.",
        "........KKNDAAAAAAAADNKK........",
        ".........KNZAAAKKAAADNK.........",
        "....I....KNYAAK..KAADNK....I....",
        ".....W...KZCCBK..KBCCBK...W.....",
        ".........KNYAAK..KAADNK.........",
        ".........KZDAAK..KAADNK.........",
        "....KZZKKBCTTCK..KCTTCBKKZZK....",
        "...KZGMZZKKKKKKZZKKKKKKZZRMZK...",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    gearWardenRecoil: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a", "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44", "M": "#3f6b2a", "G": "#6f9a43"
      },
      pixels: [
        "..........KKKKKKKKKKKK..KK....KK",
        ".........KCMGGMTTTTMGCK.KTK..KTK",
        ".........KBCMCCCCCCCCBK.KCTTTTCK",
        "KK....KKKKKHPPPPHHHHAKZK.KBCCBK.",
        "KTK..KTKKCKHPAAPHAAHAKRK..KDAK..",
        "KCTTTTCKKTKHAKKDDKKAAKRK..KDAK..",
        ".KBCCBK.KCKHABBDDBBAAKRK.KCTTCK.",
        ".KCTTCK.KKKHDKDKKDKDAKZK.KTIITK.",
        ".KTIITK.KKKBCCCCCCCCBKZK.KCTTCK.",
        "..KCTCK....KKBCTTCBKKKYK.KBCBK..",
        "..KCTCK.KKKKKKKKKKKKKKZR.ZYTCK..",
        ".KCTTTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCTIITCKKHAPAAKKKKAAHAAKKCYZITCK",
        "KCTTTTCKKHAACKJJJJKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKJOOOOJKCAAKKBCTYCBK",
        "........KHACKOQWWQOKCAAK........",
        "........KHACKOQQQQOKCAAK........",
        "........KHACKJOOOOJKCAAK........",
        "........KHAACKJJJJKCAAAK........",
        "........KHAPAAKKKKAAHAAK........",
        "........KBCCCCCCCCCCCCBK........",
        "........KBCTTTTTTTTTTCBK........",
        "........KKNDAAAAAAAADNKK........",
        ".........KNZAAAK.KBCCBK.........",
        ".........KNYAAK..KAADNK.........",
        ".........KZCCBK..KAADNK.........",
        ".........KNYAAK..KCTTCBK........",
        ".........KZDAAK.................",
        "....KZZKKBCTTCK.........KZZK....",
        "...KZGMZZKKKKKKZZRZZRRZZZRMZK...",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    gearWardenSlump: {
      palette: {
        ".": null, "K": "#120c06", "N": "#2e1f12", "D": "#4a3220", "A": "#6e4c2e", "H": "#8f6a42", "P": "#b08a5a",
        "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a", "I": "#ecd27a", "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a",
        "X": "#1c130a", "R": "#3a2817", "Z": "#5c4229", "Y": "#8a6a44", "M": "#3f6b2a", "G": "#6f9a43"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "..........KKKKKKKKKKKK..........",
        ".........KCMGGMTTTTMGCK.........",
        ".........KBCMCCCCCCCCBK.........",
        "........KKKHPPPPHHHHAKZK........",
        "........KCKHPAAPHAAHAKRK........",
        "........KTKHAKKDDKKAAKRK........",
        "........KCKHABBDDBBAAKRK........",
        "........KKKHDKDKKDKDAKZK........",
        "........KKKBCCCCCCCCBKZK.KZK....",
        "..KKKKK.KKKKKKKKKKKKKKZR.ZYKKK..",
        ".KMGGTCKKHPPPPPPHHHHHHAKKYZTTCK.",
        "KCMIITCKKHAPAAKKKKAAHAAKKCYZITCK",
        "KCTTTTCKKHAACKJJJJKCAAAKKCTYZTCK",
        "KBCTTCBKKHACKJJJJJJKCAAKKBCTYCBK",
        "..KCTCK.KHACKJOQQOJKCAAK.KCZCK..",
        "..KBCBK.KHACKJOOOOJKCAAK.KBCYK..",
        "..KCTCK.KHACKJJJJJJKCAAK.KCZCK..",
        "..KBCBK.KHAACKJJJJKCAAAK.KYCBK..",
        ".KCTTCK.KHAPAAKKKKAAHAAK.KCTTCK.",
        ".KTIITK.KBCCCCCCCCCCCCBK.KTIITK.",
        ".KCTTCK.KBCTTTTTTTTTTCBK.KCTTCK.",
        "..KADK..KKNDAAAAAAAADNKK..KDAK..",
        "..KADK...KZCCBK..KBCCBK...KDAK..",
        ".KBCCBK..KNYAAK..KAADNK..KBCCBK.",
        "KCTTTTCK.KZDAAK..KAADNK.KCTTTTCK",
        ".KTKKTKKKBCTTCK..KCTTCBKKKTKKTK.",
        "..KKKKMZZKKKKKKZZKKKKKKZZRKKKK..",
        "..KRZZRRZRRZZRRZZRRZZRRZRMGZRK..",
        "...KKKKKKKKKKKKKKKKKKKKKKKKKK..."
      ]
    },

    sproutSpiritUp: {
      palette: {
        ".": null, "K": "#13180e", "N": "#6f8a5a", "D": "#9db87a", "A": "#cfe6a8", "H": "#ecf7d2",
        "P": "#fffbe8", "E": "#2c6a2a", "L": "#4fae45", "G": "#8be070", "O": "#2a3a1a", "Y": "#fff3a0"
      },
      pixels: [
        ".......KKK............KKK.......",
        "......KGGGKK........KKLLLK......",
        ".....KGGGGGGKK....KKGGLLEEK.....",
        "......KGGGGGLLK..KGGGGLEEK......",
        "......KELLGGLLK..KGGGLEEEK......",
        ".......KKELLLEEKKGGLLEEKK.......",
        ".........KEEEEEGLGLLEEK.........",
        ".........KEEEKEELLKEEEK.........",
        "..........KKK.KGLK.KKK..........",
        "...........KKKKGLKKKK...........",
        "...........KPPPHHAADK....Y......",
        "...........KPPHHHAADK...........",
        "......Y....KPHHHAADNK...........",
        "..........KPHHHAAADDNK..........",
        "......K..KPHHHHAAAADDNK..K......",
        ".....KGKKKPPHHHAAAADDNKKKEK.....",
        "....KGGGGKPHHHHAAAADDNKGLEEK....",
        ".....KLGLKHHPOHHHAPODNKEGEK.....",
        "......KLLKHHOOHHAAOODNKEEK......",
        ".....KEEKKHHHHAAAAADDNKKEEK.....",
        "......KK.KHAAAANNAADDNK.KK......",
        ".........KAAAAAAADDDNNK.........",
        "...Y.....KAAAAADDDDDNNK.........",
        "..........KAAAADDDDNNK..........",
        "...........KAADDDDNNK...........",
        "............KADDDDNK............",
        "............KHAADDNK............",
        "............KAADDNNK........Y...",
        ".............KDDNNK.............",
        "..............KKKK..............",
        "................................",
        "................................"
      ]
    },

    sproutSpiritDown: {
      palette: {
        ".": null, "K": "#13180e", "N": "#6f8a5a", "D": "#9db87a", "A": "#cfe6a8", "H": "#ecf7d2",
        "P": "#fffbe8", "E": "#2c6a2a", "L": "#4fae45", "G": "#8be070", "O": "#2a3a1a", "Y": "#fff3a0"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "........KK............KK........",
        ".....KKKGGKK.K....K.KKGGKKK.....",
        "....KGGGGGLLKEKKKKGKGGGGGLLK....",
        "...KGGGGGGLLLEEGLGGGGGGLLLEEK...",
        "....KKGGLLLLEEEELLLGLLEEEEKK....",
        ".....KELEEEEEKKGLKKLEEEEEEK.....",
        "......KKKKEKKKKGLKKKKEKKKK......",
        "..........KKPPPHHAADKK..........",
        "...........KPPHHHAADK...........",
        "...........KPHHHAADNK...........",
        "..........KPHHHAAADDNK..........",
        "...Y.....KPHHHHAAAADDNK.........",
        ".........KPPHHHAAAADDNK.........",
        ".........KPHHHHAAAADDNK.....Y...",
        "......KKKKHHPOHHHAPODNKKKK......",
        ".....KGGLKHHOOHHAAOODNKEGLK.....",
        "....KGGGLKHHHHAAAAADDNKEGLEK....",
        "....KGKLLKHAAAANNAADDNKEEKEK....",
        ".....K.KEKAAAAAAADDDNNKEK.K.....",
        "........KKAAAAADDDDDNNKK........",
        "..........KAAAADDDDNNK..........",
        "...........KAADDDDNNK...........",
        "............KADDDDNK............",
        "............KHAADDNK....Y.......",
        ".......Y....KAADDNNK............",
        ".............KDDNNK.............",
        "..............KKKK..............",
        "................................",
        "................................"
      ]
    },

    sproutSpiritBright: {
      palette: {
        ".": null, "K": "#13180e", "N": "#6f8a5a", "D": "#9db87a", "A": "#cfe6a8", "H": "#ecf7d2",
        "P": "#fffbe8", "E": "#2c6a2a", "L": "#4fae45", "G": "#8be070", "O": "#2a3a1a", "Y": "#fff3a0"
      },
      pixels: [
        ".......KKK............KKK.......",
        "......KGGGKK........KKLLLK......",
        ".....KGGGGGGKK....KKGGLLEEK.....",
        "......KGGGGGLLK..KGGGGLEEK......",
        "......KELLGGLLK..KGGGLEEEK......",
        ".......KKELLLEEKKGGLLEEKK.......",
        ".........KEEEEEGLGLLEEK.........",
        ".........KEEEKEELLKEEEK.........",
        "..........KKK.KGLK.KKK..........",
        "...........KKKKGLKKKK...........",
        "....Y......KPPPPPHHAK....Y......",
        "...........KPPPPPHHAK...........",
        "......Y....KPPPPHHADK...........",
        "..........KPPPPHHHAADK.....Y....",
        "......K..KPPPPPHHHHAADK..K......",
        ".....KGKKKPPPPPHHHHAADKKKEK.....",
        "....KGGGGKPPPPPHHHHAADKGLEEK....",
        ".....KLGLKPPPOPPPHPOADKEGEK.....",
        "......KLLKPPOOPPHHOOADKEEK......",
        ".....KEEKKPPPPHHHHHAADKKEEK.....",
        "......KK.KPHHHHDDHHAADK.KK......",
        ".........KHHHHHHHAAADDK.........",
        "...Y.....KHHHHHAAAAADDK.........",
        "..........KHHHHAAAADDK..........",
        "...........KHHAAAADDK.....Y.....",
        ".....Y......KHAAAADK............",
        "............KPHHAADK............",
        "............KHHAADDK........Y...",
        ".............KAADDK.............",
        "..............KKKK..............",
        "................................",
        "................................"
      ]
    },

    sproutSpiritSleep: {
      palette: {
        ".": null, "K": "#13180e", "N": "#6f8a5a", "D": "#9db87a", "A": "#cfe6a8", "H": "#ecf7d2",
        "P": "#fffbe8", "E": "#2c6a2a", "L": "#4fae45", "G": "#8be070", "O": "#2a3a1a", "Y": "#fff3a0"
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "........KK............KK........",
        ".....KKKGGKK.K....K.KKGGKKK.....",
        "....KGGGGGLLKEKKKKGKGGGGGLLK....",
        "...KGGGGGGLLLEEGLGGGGGGLLLEEK...",
        "....KKGGLLLLEEEELLLGLLEEEEKK....",
        ".....KELEEEEEKKGLKKLEEEEEEK.....",
        "......KKKKEKKKKGLKKKKEKKKK......",
        "..........KKPPPHHAADKK..........",
        "...........KPPHHHAADK...........",
        "...........KPHHHAADNK...........",
        "..........KPHHHAAADDNK..........",
        ".........KPHHHHAAAADDNK.........",
        ".........KPPHHHAAAADDNK.........",
        ".........KPHHHHAAAADDNK.........",
        "......KKKKHHHHHHHAAADNKKKK......",
        ".....KGGLKHHOOHHAAOODNKEGLK.....",
        "....KGGGLKHHHHAAAAADDNKEGLEK....",
        "....KGKLLKHAAAANNAADDNKEEKEK....",
        ".....K.KEKAAAAAAADDDNNKEK.K.....",
        "........KKAAAAADDDDDNNKK........",
        "..........KAAAADDDDNNK..........",
        "...........KAADDDDNNK...........",
        "............KADDDDNK............",
        "............KHAADDNK............",
        "............KAADDNNK............",
        ".............KDDNNK.............",
        "..............KKKK..............",
        "................................",
        "................................"
      ]
    }
  });

  /**
   * コケキノコ（蔦這う回廊。キノコンの亜種。2026-10-21 作者が「C 深い森の緑」を選んだ）。
   * 形はキノコンと同じ（sprites_abyss.js の sporin・sporinSquash・sporinStretch・sporinSleep の点の並びをそのまま使う）。
   * 色の表だけ差し替える：笠を暗い森の緑に、まだらを苔の黄緑に、柄を少しくすんだ生成りに
   */
  var MOSS_SHROOM_COLORS = {
    K: "#0c140c",   // 輪郭
    N: "#1e321c",   // いちばん深い影
    D: "#2e4c2a",   // 笠の影
    P: "#3f6a3a",   // 笠（深い森の緑）
    H: "#5f8f4f",   // 笠の光の当たる面
    W: "#a8c86a",   // 笠のまだら（苔）
    E: "#142014",   // 目
    U: "#a89c80",   // 柄の影
    S: "#cfc6aa",   // 柄
    T: "#e8e0c8"    // 柄の光の当たる面
  };
  var shroomParts = { mossShroom: "sporin", mossShroomSquash: "sporinSquash",
                      mossShroomStretch: "sporinStretch", mossShroomSleep: "sporinSleep" };
  var mossSprites = {};
  for (var mossId in shroomParts) {
    var from = (NS.rawData.sprites || {})[shroomParts[mossId]];
    if (!from) continue;
    var mossPalette = {};
    for (var key in from.palette) mossPalette[key] = from.palette[key];
    for (var c in MOSS_SHROOM_COLORS) mossPalette[c] = MOSS_SHROOM_COLORS[c];
    mossSprites[mossId] = { pixels: from.pixels, palette: mossPalette };
  }
  NS.extend("sprites", mossSprites);

  /**
   * シニガミ（蔦這う回廊の初見殺し。2026-10-21）。
   * 作者の指定：黒い影の中に赤い目が2つ光り、鎌が浮いている。影の中にそれらが浮いているような感じ。
   * 影は上が煙の房になったかたまりで、下は垂れる筋。目は影の奥（A の明るい楕円）に置き、鎌は影の右に浮かべた。
   *   shinigami       … ふつうの姿（目はくすんだ赤）
   *   shinigamiRaise  … 鎌を高く振りかぶった姿（目が光る）
   *   shinigamiSwing  … 鎌を振り下ろした姿（刃が影の左下へ回る）
   * 死神の鎌の専用の動き（data/motions.js の reaperScythe）が、この3枚を切り替える
   */
  var REAPER_PALETTE = {
    ".": null,
    "K": "#030106",   // 輪郭
    "N": "#0c0816",   // 影のいちばん暗いところ・ふち
    "D": "#171126",   // 影
    "A": "#211a32",   // 影の奥のぼんやり明るいところ
    "H": "#342a48",   // 左上のふち
    "R": "#ff2a2a",   // 目
    "Q": "#ffc0b0",   // 光った目の芯
    "r": "#5a0a16",   // 目のまわりのにじみ
    "B": "#e4e8f2",   // 刃のふち
    "b": "#8a90a4",   // 刃
    "W": "#4a3624",   // 柄
    "w": "#221610",   // 柄の影
    // 振っている途中のコマ（shinigamiMid）だけで使う、刃の軌跡（先ほど明るく、通り過ぎたところほど薄い）
    "T": "#c9cfe0",
    "t": "#6a7088",
    "u": "#2e3246"
  };
  NS.extend("sprites", {
    shinigami: {
      palette: REAPER_PALETTE,
      pixels: [
        "................................",
        "................................",
        "................................",
        ".............KKKKKKKKK..........",
        "...........KKHBBBBBBBBK.........",
        "........KKKBBBBbbbbbbBBKK.......",
        ".......KHNBBNNNNNNNbbbbBBK......",
        ".......KHNNDDDDDDNNNNbbbBBK.....",
        "......KKHNDDDDDDDDNNNNKbbBw.....",
        ".....KHNNDDDAAAADDDNNNKbbbw.....",
        ".....KHNDDDAAAAAADDDNNNNbbw.....",
        "...KKKHNDDDAAAAAADDDNNNNWbK.....",
        "..KHNNNDDrrAAAArrADDDNNNWw......",
        "...KHNNDrRRrAArRRrDDDNNNWwK.....",
        "..KKHNNDDRRAAAARRADDDNNNWwNK....",
        ".KHNNNNDDrrAAAArrADDDNNNWwNNK...",
        ".KHNNNNDDDAAAAAAAADDDNNWwNNNK...",
        "KHNNNNNDDDDAAAAAADDDDNNWwNNKK...",
        "KNNNNNNDDDDAAAAAADDDDNNWwNNNNK..",
        "KKNNNNNNDDDDAAAADDDDNNNWwNNNNK..",
        "NNNNNNNNDDDDDDDDDDDDNNNWwNNNK...",
        "KNNNNNNNNDDDDDDDDDDNNNNWwNNNNK..",
        ".KNNNNNNNNDDDDDDDDNNNNWwNNNNNK..",
        "KNNNNNNNNNNDDDDDDNNNNNWwNNNNNK..",
        "KNNNNNNNNNNNNNNNNNNNNNWwNNNNNK..",
        "NNNNNNNNNNNNNNNNNNNNNNWwNNNNK...",
        "KNNNNNNNNNNNNNNNNNNNNNWwNNNNNK..",
        ".KKNNNNNNNNNNNNNNNNNNWwNNNKKK...",
        "...KNNKNNNNKNNNNNKNNNWwNNK......",
        "....KNKNNKNKNNKNNKNNKWwNK.......",
        ".....K.KNKNKNKKNNKKNKNKK........",
        ".......KNKKKNK.KNKKNKK.........."
      ]
    },
    shinigamiRaise: {
      palette: REAPER_PALETTE,
      pixels: [
        "............KKKKKBBBBKKK........",
        "...........KBBBBBbbbBBBBK.......",
        "..........KBBKKbbbKKbbbBBK......",
        "...........KKKKKKK.KbbbbbBK.....",
        "............KHNK...KKKKbbbBw....",
        "........KK.KKHNKKKKHNK.Kbbbw....",
        ".......KHNKHNNNNNNNNNK..Kbbw....",
        ".......KHNNDDDDDDNNNNK...Kbw....",
        "......KKHNDDDDDDDDNNNNK...Ww....",
        ".....KHNNDDDAAAADDDNNNKK..Ww....",
        ".....KHNDDDAAAAAADDDNNNNK.Ww....",
        "...KKKHNDrrAAAArrDDDNNNNNWw.....",
        "..KHNNNDrQRrAArQRrDDDNNNNWw.....",
        "...KHNNDDRRAAAARRADDDNNNNWw.....",
        "..KKHNNDDrrAAAArrADDDNNNNWwK....",
        ".KHNNNNDDDAAAAAAAADDDNNNNWwNK...",
        ".KHNNNNDDDAAAAAAAADDDNNNNWwNK...",
        "KHNNNNNDDDDAAAAAADDDDNNNNWwKK...",
        "KNNNNNNDDDDAAAAAADDDDNNNNWwNNK..",
        "KKNNNNNNDDDDAAAADDDDNNNNNWwNNK..",
        "NNNNNNNNDDDDDDDDDDDDNNNNNWwNK...",
        "KNNNNNNNNDDDDDDDDDDNNNNNNWwNNK..",
        ".KNNNNNNNNDDDDDDDDNNNNNNNWwNNK..",
        "KNNNNNNNNNNDDDDDDNNNNNNNWwNNNK..",
        "KNNNNNNNNNNNNNNNNNNNNNNNWwNNNK..",
        "NNNNNNNNNNNNNNNNNNNNNNNNWwNNK...",
        "KNNNNNNNNNNNNNNNNNNNNNNNWwNNNK..",
        ".KKNNNNNNNNNNNNNNNNNNNNNWwKKK...",
        "...KNNKNNNNKNNNNNKNNNNKNWw......",
        "....KNKNNKNKNNKNNKNNKNKNK.......",
        ".....K.KNKNKNKKNNKKNKNKK........",
        ".......KNKKKNK.KNKKNKK.........."
      ]
    },
    /**
     * 大きく振りかぶったコマ（作者の依頼「鎌をもっと振りかぶる」2026-10-21）。死神の鎌の溜めで使う。
     * 柄を左下から右上へ体ごと斜めに担ぎ、刃は右上の先から頭の上へ折り返して後ろを向く。
     * ここから振りの途中（Mid）→ 振り下ろし（Swing）へ、頭の上を大きく回って振り下ろす
     */
    shinigamiWindup: {
      palette: REAPER_PALETTE,
      pixels: [
        "..............KBBBBbbbbbbbbBBK..",
        ".............KBBKKKKKKKKbbbbBBK.",
        "..............KK........KKKbbBw.",
        ".............KK............KbbK.",
        "............KHNK...KK......WbbK.",
        "........KK.KKHNKKKKHNK.....WwbK.",
        ".......KHNKHNNNNNNNNNK....Ww.K..",
        ".......KHNNDDDDDDNNNNK...Ww.....",
        "......KKHNDDDDDDDDNNNNK.Ww......",
        ".....KHNNDDDAAAADDDNNNKWw.......",
        ".....KHNDDDAAAAAADDDNNNWw.......",
        "...KKKHNDDDAAAAAADDDNNWw........",
        "..KHNNNDDrrAAAArrADDDWwNNK......",
        "...KHNNDrQRrAArQRrDDWwNNNNK.....",
        "..KKKNNDDRRAAAARRADWwNNNNNNK....",
        ".KHNNNNDDrrAAAArrADWwNNNNNNNK...",
        ".KHNNNNDDDAAAAAAAAWwNNNNNNNNK...",
        "KHNNNNNDDDDAAAAAAWwNNNNNNNNKK...",
        "KNNNNNNDDDDAAAAAWwNNDNNNNNNNNK..",
        "KKNNNNNNDDDDAAAWwNNDNNNNNNNNNK..",
        "NNNNNNNNDDDDDDWwDNNDNNNNNNNNK...",
        "KNNNNNNNNDDDDDWwNNDNNNNNNNNNNK..",
        ".KNNNNNNNNDDDWwNNDNNNNNNNNNNNK..",
        "KNNNNNNNNNNDWwNNDNNNNNNNNNNNNK..",
        "KNNNNNNNNNNWwNNNNNNNNNNNNNNNNK..",
        "NNNNNNNNNNWwNNNNNNNNNNNNNNNNK...",
        "KNNNNNNNNNWwNNNNNNNNNNNNNNNNNK..",
        ".KKNNNNNNWwNNNNNNNNNNNNNNNKKK...",
        "...KNNKNWwNKNNNNNKNNNNKNNK......",
        "....KNKNNKNKNNKNNKNNKNKNK.......",
        ".....K.KNKNKNKKNNKKNKNKK........",
        ".......KNKKKNK.KNKKNKK.........."
      ]
    },
    /**
     * 振っている途中のコマ（作者の依頼 2026-10-21）。振りかぶり（Raise）と振り下ろし（Swing）のあいだに挟む。
     * 鎌を水平近くまで倒し、刃が左へ大きく伸びたように描いた（引き伸ばし）。
     * 右上（振りかぶった位置）から今の刃先まで、弧に沿って刃の軌跡を残してある（T → t → u と薄くなる）
     */
    shinigamiMid: {
      palette: REAPER_PALETTE,
      pixels: [
        "................................",
        "................................",
        "............TTTTttttt...........",
        "..........TTttttttttttt.........",
        "........TTtttt......tt.tu.......",
        "......TTttttt...........uuu.....",
        ".....TTtttt.NNNNNNN.......uu....",
        "....TTtttNNDDDDDDNNNN......uu...",
        "....TttttNDDDDDDDDNNNNK.....u...",
        "...TttttNDDDAAAADDDNNNK.....WWW.",
        "....ttttDDDAAAAAADDDNNWWWWWWwww.",
        "...KKKtNBBBBbbbAWWWWWWwwwwww..u.",
        "..KHNBBBbbrBBBbbbwwwwwNN......u.",
        "...KBBbDrQRrAwwwRrDDDNNNNNK.....",
        "..KBBbNDDRRAAAARRADDDNNNNNNK....",
        ".KBBbNNDDrrAAAArrADDDNNNNNNNK...",
        ".KBbNNNDDDAAAAAAAADDDNNNNNNNK...",
        "KHBNNNNDDDDAAAAAADDDDNNNNNNKK...",
        "KBBNNNNDDDDAAAAAADDDDNNNNNNNNK..",
        "KBNNNNNNDDDDAAAADDDDNNNNNNNNNK..",
        "NBNNNNNNDDDDDDDDDDDDNNNNNNNNK...",
        "KNNNNNNNNDDDDDDDDDDNNNNNNNNNNK..",
        ".KNNNNNNNNDDDDDDDDNNNNNNNNNNNK..",
        "KNNNNNNNNNNDDDDDDNNNNNNNNNNNNK..",
        "KNNNNNNNNNNNNNNNNNNNNNNNNNNNNK..",
        "NNNNNNNNNNNNNNNNNNNNNNNNNNNNK...",
        "KNNNNNNNNNNNNNNNNNNNNNNNNNNNNK..",
        ".KKNNNNNNNNNNNNNNNNNNNNNNNKKK...",
        "...KNNKNNNNKNNNNNKNNNNNNNK......",
        "....KNKNNKNKNNKNNKNNKNNNK.......",
        ".....K.KNKNKNKKNNKKNKNKK........",
        ".......KNKKKNK.KNKKNKK.........."
      ]
    },
    shinigamiSwing: {
      palette: REAPER_PALETTE,
      pixels: [
        "................................",
        "................................",
        "................................",
        ".............KK.................",
        "............KHNK...KK...........",
        "........KK.KKHNKKKKHNK..........",
        ".......KHNKHNNNNNNNNNK.....Ww...",
        ".......KHNNDDDDDDNNNNK....Ww....",
        "......KKHNDDDDDDDDNNNNK...Ww....",
        ".....KHNNDDDAAAADDDNNNKK.Ww.....",
        ".....KHNDDDAAAAAADDDNNNNWw......",
        "...KKKHNDDDAAAAAADDDNNNWwK......",
        "..KHNNNDDrrAAAArrADDDNNWwK......",
        "...KHNNDrQRrAArQRrDDDNWwNNK.....",
        "..KKBNNDDRRAAAARRADDDWwNNNNK....",
        ".KHNBNNDDrrAAAArrADDWwNNNNNNK...",
        ".KHNBNNDDDAAAAAAAADDWwNNNNNNK...",
        "KHNNBNNDDDDAAAAAADDWwNNNNNNKK...",
        "KNNNBbNDDDDAAAAAADWwDNNNNNNNNK..",
        "KKNNBbNNDDDDAAAADWwDNNNNNNNNNK..",
        "NNNNBbNNDDDDDDDDDWwDNNNNNNNNK...",
        "KNNNBbNNNDDDDDDDWwDNNNNNNNNNNK..",
        ".KNNBBbNNNDDDDDWwDNNNNNNNNNNNK..",
        "KNNNNBBbbNNDDDWwDNNNNNNNNNNNNK..",
        "KNNNNNBBbbNNNNWwNNNNNNNNNNNNNK..",
        "NNNNNNNBBBbbbWwNNNNNNNNNNNNNK...",
        "KNNNNNNNNBBBBbbbNNNNNNNNNNNNNK..",
        ".KKNNNNNNNNNNNNNNNNNNNNNNNKKK...",
        "...KNNKNNNNKNNNNNKNNNNKNNK......",
        "....KNKNNKNKNNKNNKNNKNKNK.......",
        ".....K.KNKNKNKKNNKKNKNKK........",
        ".......KNKKKNK.KNKKNKK.........."
      ]
    }
  });

  /**
   * ツリガネ（蔦這う回廊。2026-10-22 作者の指定）。
   * 作者の指定：黒い翼で体を包み、蔦から逆さにぶら下がる小悪魔。翼の隙間から風が鳴る。
   * 上の5行（蔦と足の爪）は動きで固定する（data/motions.js の tsuri〜 は pinTop: 5）。体は逆さなので、頭と角が下にある。
   * 翼で包んだ体が釣鐘の形になるようにした。翼の裂け目（w）から風が漏れ、外へ筋（w / v）が流れる。
   *   tsurigane      … ふつうの姿（翼で体を包んでいる）
   *   tsuriganeWind  … 風の筋の位置だけ違う。ふだんの動きで tsurigane と交互に出して、風が鳴っているように見せる
   *   tsuriganeOpen  … 翼を広げた姿（技・攻撃・喜ぶとき）。細い胴と脚が見える
   *   tsuriganeSleep … 目と口を閉じ、風が止む
   * ★ 見た目は私の下書き（作者が見て決める）
   */
  var TSURIGANE_PALETTE = {
    ".": null,
    "K": "#07050c",   // 輪郭
    "N": "#120e1c",   // 翼のいちばん暗いところ・指の骨
    "D": "#1e1830",   // 翼（影の側）
    "P": "#2c2444",   // 翼
    "H": "#4a3e66",   // 翼のふち（光の当たる側）・腕の骨
    "G": "#1d3a1a",   // 蔦の影
    "g": "#3a6b2c",   // 蔦
    "l": "#6a9c48",   // 蔦の光の当たるところ
    "F": "#cbb89a",   // 爪
    "S": "#9a7fb8",   // 肌
    "s": "#6a5288",   // 肌の影
    "E": "#b8ffe6",   // 目
    "e": "#3fbf9a",   // 目の奥
    "M": "#2a0a14",   // 口
    "T": "#f2ece0",   // 牙
    "O": "#e6dcc8",   // 角
    "w": "#d6f4ee",   // 風
    "v": "#7fb3ad"    // 風（薄い）
  };
  NS.extend("sprites", {
    tsurigane: {
      palette: TSURIGANE_PALETTE,
      pixels: [
        "................................",
        "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
        "glglgglggglgglgglgglgggllgglgglg",
        "GGGKGGGGGKGGGFFGGFFGGGKGGGGGKGGG",
        "KKKKgKKKKKKKKFFKKFFKKKKKKKKgKKKK",
        "...KgK......KSsKKsSK......KgK...",
        "....K......KKKKKKKKKK......K....",
        "..........KHPPPHNDDDNK..........",
        "..........KHPNPHNDNDNK..........",
        ".........KHPPNPHNDNDDNK.........",
        ".........KHPNPPHNDDNDNK.........",
        "....vww.KHPPNPPHNDDNDDNK.wwv....",
        ".....vwwKHwKNPPHNDDNDDNK........",
        "....vw..KHPwKPPHNDNDKwNK.wwv....",
        ".......KHPPPNPPHNDDNDKwNK.www...",
        ".......KHPPNPPPHNDDDNDDNK.......",
        ".......KHPNPPPPHNDDDDNDNK.......",
        "......KHPNPPPPPHNDDDDDNDNK......",
        "......KHNPPPPPPHNDDDDDDNNK......",
        "......KNPPPPPPPHNDDDDDDDNK......",
        "......KNPPNKssssssssKNDDNK......",
        "......KPKNKKSSTSSTSSKKNKDK......",
        ".......K.KKSSSMMMMSSSKK.K.......",
        "..........KsSSSSSSSSsK..........",
        "........KsSSEESSSSEESSsK........",
        ".......KssSSEeSSSSeESSssK.......",
        "......KsKKKsSSSSSSSSsKKKsK......",
        ".......K...KsSSSSSSsK...K.......",
        "............KOKKKKOK............",
        "...........KOK....KOK...........",
        "...........K........K...........",
        "................................"
      ]
    },
    tsuriganeWind: {
      palette: TSURIGANE_PALETTE,
      pixels: [
        "................................",
        "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
        "glglgglggglgglgglgglgggllgglgglg",
        "GGGKGGGGGKGGGFFGGFFGGGKGGGGGKGGG",
        "KKKKgKKKKKKKKFFKKFFKKKKKKKKgKKKK",
        "...KgK......KSsKKsSK......KgK...",
        "....K......KKKKKKKKKK......K....",
        "..........KHPPPHNDDDNK..........",
        "..........KHPNPHNDNDNK..........",
        ".........KHPPNPHNDNDDNK.........",
        "..vw.....KHPNPPHNDDNDNK.........",
        "....vww.KHPPNPPHNDDNDDNK........",
        "........KHHKNPPHNDDNDDNK.wwv....",
        "..vww...KHwwKPPHNDNDKKwK........",
        "....v..KHPPPNPPHNDDNDKwNK.wwwv..",
        ".......KHPPNPPPHNDDDNDDNK..v....",
        ".......KHPNPPPPHNDDDDNDNK.......",
        "......KHPNPPPPPHNDDDDDNDNK......",
        "......KHNPPPPPPHNDDDDDDNNK......",
        "......KNPPPPPPPHNDDDDDDDNK......",
        "......KNPPNKssssssssKNDDNK......",
        "......KPKNKKSSTSSTSSKKNKDK......",
        ".......K.KKSSSMMMMSSSKK.K.......",
        "..........KsSSSSSSSSsK..........",
        "........KsSSEESSSSEESSsK........",
        ".......KssSSEeSSSSeESSssK.......",
        "......KsKKKsSSSSSSSSsKKKsK......",
        ".......K...KsSSSSSSsK...K.......",
        "............KOKKKKOK............",
        "...........KOK....KOK...........",
        "...........K........K...........",
        "................................"
      ]
    },
    tsuriganeOpen: {
      palette: TSURIGANE_PALETTE,
      pixels: [
        "................................",
        "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
        "glglgglggglgglgglgglgggllgglgglg",
        "GGGKGGGGGKGGGFFGGFFGGGKGGGGGKGGG",
        "KKKKgKKKKKKKKFFKKFFKKKKKKKKgKKKK",
        "...KgK......KSsKKsSK......KgK...",
        ".KKFK.......KSsKKsSK.......KFKK.",
        ".KPHK.......KSsKKsSK.......KPDK.",
        ".KPNHK......KSsKKsSK......KPNDK.",
        ".KPNNHK.....KSsKKsSK.....KPNNDK.",
        "KPPNNNHKK...KssssssK...KKPNNNDDK",
        "KPNNNNHHHK..KSSSSssK..KPPPNNNNDK",
        "KPNNPNNHHHK.KSSSSssK.KPPPNNDNNDK",
        "KPNNPNNPPHHKKSSssssKKPPDDNNDNNDK",
        "KPNNPNPNPPHHKSSSSssKPPDDNDNDNNDK",
        "KPNNNPNPNPPHKSSssssKPDDNDNDNNNDK",
        "KNNPNPNPNNPPKSSSSssKDDNNDNDNDNNK",
        "KNDPNPNNPNPPKSSSSSsKDDNDNNDNDNNK",
        "KNDDNPPNPNNPKSsssssKDNNDNDDNNNNK",
        "KNKDNDDNPDKDKSSssSsKNKNDNNNNNKNK",
        ".K.KNDKDNKKNDssssssNNKKNNKNNK.K.",
        "...KNK.KNKKKSSTSSTSKKKKNK.KNK...",
        "...KNK..K.KSSSMMMMSSSK.K..KNK...",
        "....K.....KsSSSSSSSSsK.....K....",
        "........KsSSEESSSSEESSsK........",
        ".......KssSSEeSSSSeESSssK.......",
        "......KsKKKsSSSSSSSSsKKKsK......",
        ".......K...KsSSSSSSsK...K.......",
        "............KOKKKKOK............",
        "...........KOK....KOK...........",
        "...........K........K...........",
        "................................"
      ]
    },
    tsuriganeSleep: {
      palette: TSURIGANE_PALETTE,
      pixels: [
        "................................",
        "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
        "glglgglggglgglgglgglgggllgglgglg",
        "GGGKGGGGGKGGGFFGGFFGGGKGGGGGKGGG",
        "KKKKgKKKKKKKKFFKKFFKKKKKKKKgKKKK",
        "...KgK......KSsKKsSK......KgK...",
        "....K......KKKKKKKKKK......K....",
        "..........KHPPPHNDDDNK..........",
        "..........KHPNPHNDNDNK..........",
        ".........KHPPNPHNDNDDNK.........",
        ".........KHPNPPHNDDNDNK.........",
        "........KHPPNPPHNDDNDDNK........",
        "........KHwKNPPHNDDNDDNK........",
        "........KHPwKPPHNDNDKwNK........",
        ".......KHPPPNPPHNDDNDKwNK.......",
        ".......KHPPNPPPHNDDDNDDNK.......",
        ".......KHPNPPPPHNDDDDNDNK.......",
        "......KHPNPPPPPHNDDDDDNDNK......",
        "......KHNPPPPPPHNDDDDDDNNK......",
        "......KNPPPPPPPHNDDDDDDDNK......",
        "......KNPPNKssssssssKNDDNK......",
        "......KPKNKKSSSSSSSSKKNKDK......",
        ".......K.KKSSSSMMSSSSKK.K.......",
        "..........KsSSSSSSSSsK..........",
        "........KsSSKKSSSSKKSSsK........",
        ".......KssSSSSSSSSSSSSssK.......",
        "......KsKKKsSSSSSSSSsKKKsK......",
        ".......K...KsSSSSSSsK...K.......",
        "............KOKKKKOK............",
        "...........KOK....KOK...........",
        "...........K........K...........",
        "................................"
      ]
    }
  });

  /**
   * ザンガルド（蔦這う回廊の雷の竜の子。2026-10-26 に名前が決まった）。48×48。
   * 作者が描いた絵（参考絵/dragonkin_v5_preview_x12.png。12px のマス目・左右に背景違いの2枚）を、
   * 1マスずつ機械的に読み取ったもの（2026-10-23）。左右の板で色が違うマスを背景（"."）とした。
   * 色は元絵の24色そのまま。直すときはこの配列を直接いじってよい（色はこのパレットから選ぶ）。
   * 絵はこのまま（作者 2026-10-23）。種族の sizeScale は 1.2（作者。ヨミリュウ 1.35 より一回り小さく）。
   * 種族は data/monsters.js の thunderDragon（ザンガルド）。
   * 動きのコマ（ふだん・攻撃・技・共鳴・被弾・眠り）はこのファイルの最後（作者が描いた 2026-10-26）。
   */
  var ZAN_PALETTE = {
    ".": null,
    "K": "#0a0d24",   // 輪郭
    "N": "#0b1030",   // いちばん暗い青
    "D": "#14224f",   // 濃い青の影
    "d": "#161c48",   // 腰布の影
    "B": "#1d3a8a",   // 青の影
    "Q": "#232c6c",   // 腰布
    "q": "#243066",   // 刃のふちの影
    "P": "#2a5cc0",   // 青
    "U": "#33409a",   // 腰布の明るいところ
    "h": "#3a1a08",   // 柄
    "M": "#3f86e0",   // 明るい青
    "u": "#4a5cc0",   // 腰布の光
    "v": "#4a63b0",   // 刃の影
    "o": "#6b3a10",   // 角の根元・柄の光
    "L": "#6cb4f0",   // 水色
    "a": "#8ae8ff",   // 火花（青）
    "s": "#8fb4ec",   // 刃
    "y": "#a8610f",   // 金の影
    "A": "#a8e0fa",   // いちばん明るい水色
    "S": "#d8ecff",   // 刃の明るいところ
    "G": "#e09a14",   // 金
    "Y": "#ffc928",   // 黄（角・目）
    "l": "#ffe35a",   // 明るい黄
    "W": "#fff6b8"    // 白に近い黄（刃の光・爪）
  };

  NS.extend("sprites", {
    thunderDragon: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        "...................K............................",
        "..................KYK.....K.....................",
        "...................KlK...KYK....................",
        "...................KYYK..KYGK...................",
        "...................KlYYK.KYGK...................",
        "...................KYYYGKKGGyK..................",
        "....................KYYGyAyGyK..................",
        "....................KYYGoAAyoK..................",
        "...................KAyGyhAAooLKK................",
        "..................KAAAohBBDLLBYNK...............",
        "..................KAAAABYWNNLNYNKKK.K...........",
        "..................KALALDYWNNLALALALKNK..........",
        "..................KAALLMNNMMLMLMLMLLLK..........",
        ".................KLLLMPPPPPMPPPNNNNNPK..........",
        "................KLLMMPPPPPPPMMMMMMMKK....a......",
        ".................KKKMPPBPPBBPMPPPPK.............",
        "..................KLMKKKPBKKPPPPKK........l.....",
        ".................KLMK.KLKKMMKKKK.....KKKK.......",
        "..................KLAKALALLMMMLMKK.KKvvvWK......",
        ".................KAALPLLLLMMMLLLBKKvsSWsK.......",
        ".................KAAMBALLLlllMLMKqsSWSsqK.......",
        "................KAALPDLLLLYllPKKvSWSsqKK........",
        "................KAAMBDLMLMlWKKvsWSsqKK..........",
        "...............KAALBNPPMPMKKvsSSsqKKK...........",
        "...............KALMDNBPPKKvsSSsvKKMPK...........",
        "...............KLLPNGGKKvsSWsvKKNMMPPK..........",
        "..............KLLMPDPGysSWsvKKhDKMMPBK..........",
        "..............KMPPBLMMyWsvqKohhDKMMPDK..........",
        "...............KPBLALMPyqKKyohhDKMMBDK..........",
        "................KKMLPPDoKNhhhhhKKMMBDK..........",
        "...............KKAyBBDUoUNhUUUUUKMPBDK..........",
        "..............KAAAWWQQQQQQQQQQdQKPMMBK..........",
        "............KKAAAAALMLAUuuuUQdMKKMLMBK..........",
        "...........KAAAALLPPDLAQUuUQNMBKKMPBDK..........",
        ".KK.......KAAAALMBBDLAAQuUQdNPBK.KPDK...........",
        "KlGK....KKAALLPBDDNDMLMQUUQdNPBK.KWKWK..........",
        "KYyK...KALALMBDNDDDKLMMlUUQdlBBK..K.K...........",
        "KyMMKKKLLLMPDDNNKKK.KLMYYQdlGPDK................",
        ".KMPMLLLLPBDDNDK....KLMDYYYGMPBK................",
        ".KBPPMPPDNNNNKK.....KLPBKKQKMPDK................",
        "..KKBDBDNNKKK.......KMMDK.KKMBDK................",
        "....KKDNKK........KKLMPDK..KPMPMKK..............",
        "......KK.........KLLLLMPMKKLMLMPPPK.............",
        ".................KMMPPBBBKKMPPBBDBK.............",
        "..................KKPBBKK..KKBBDKK..............",
        "..................KWKWKWK..KWKWKWK..............",
        "...................K.K.K....K.K.K..............."
      ]
    }
  });

  /**
   * ザンガルドの動きのコマ（作者が描いた。参考絵/zangard_sprites/ の PNG 24枚。2026-10-26）。
   * 1マスずつ機械的に読み取ったもの。色は上の ZAN_PALETTE（24色）そのまま。
   * 元の並び（zangard_atlas.json）：
   *   idle   … ふだんの4枚（1枚目は thunderDragon そのもの）。220ms ずつ
   *   attack … 通常攻撃 6枚：振りかぶる → 振り上げる → 振り下ろす（4で当たる）→ 戻す
   *   magic  … 共鳴 5枚：剣を下げ、腕を胸へ寄せてから掲げる
   *   skill  … 技 8枚：2回斬る（2〜3 で1回目・5〜6 で2回目）
   *   hit    … 被弾 1枚 ／ sleep … 眠り 1枚
   * 剣先が絵の端で切れているコマがある（Attack2・Skill4 の上、Skill3・Skill6 の右）。作者の絵のまま
   */
  NS.extend("sprites", {
    thunderDragonIdle1: {
      palette: ZAN_PALETTE,
      pixels: [
        "...................K............................",
        "..................KYK.....K.....................",
        "...................KYK...KYK....................",
        "...................KlYK..KYGK...................",
        "...................KYYGK.KYGK...................",
        "...................KYYYGKKYGyK..................",
        "....................KYYGyAyGyK..................",
        "....................KYYGoAAyyK..................",
        "...................KAGGyhAAohLKK................",
        "..................KAAAyhBBDLLBYNK...............",
        "..................KAAAABYWNNLDYNKKK.K...........",
        "..................KLAAADYWNNAAALALLKNK..........",
        "..................KALLMMNNPLMMMLMMMLMK..........",
        ".................KALLMMPPPPPPPPNNNNNMK..........",
        "................KLMMMPPPPPBPMMMMMMPKK....a......",
        ".................KKKMPPBMPBBMMMPPPK.............",
        "..................KLMKKKBBKKPPBPKK........l.....",
        ".................KLMK.KLKKLPKKKK.....KKK........",
        "..................KLLKLLLLMMMLMLKK.KKvssK.......",
        ".................KAALPALALLMLMAMPKKvsSWvK.......",
        ".................KAAMBLLLLlllMLMKvsSWsvK........",
        "................KAALPDLLLLYllPKKsSWSvqK.........",
        "................KAAMBDMLMMYWKKvsSSsqKK..........",
        "...............KAALBDPMMMPKKvsSSsvKKK...........",
        "...............KLLPBNPPPPKvsSWsvKKPPK...........",
        "...............KALPNPPPKKsSWSvqKDPMPPK..........",
        "..............KLLMPDGGKvsWSsqKKDKMMPBK..........",
        "..............KMMPPPLMySSsqKKhhDKMMBBK..........",
        "...............KPPBLALBsvKKGohhDKMMBDK..........",
        "................KBLLLPByKNhhhhhKKMMBDK..........",
        ".................KyPPDDoNNhhhhKKKMMBDK..........",
        "...............KKAAABUUUUNNUUUuUKMPMDK..........",
        "..............KAAAWWQQQQQQQQQQdQKMMMBK..........",
        "............KKAAAAALMLAUuuuUQdMKKMMPBK..........",
        ".KK........KAAAALLPBDLAQUuUQdNBK.KBBDK..........",
        "KlYK.....KKAAAAMMBBDLAAQuUUdNPBK.KWKWK..........",
        "KYoK....KALALLPBDDNDMLMQUUQdNPBK..K.K...........",
        "KyMPK.KKALALMDDNDNDKLMMlUQQdNBBK................",
        ".KPMPKLLLLPBNNNNKKK.KLMYYQdlYPDK................",
        ".KPPMMLMMBDNNNKK....KLMDKllGMPBK................",
        "..KBBPBBNNNNKK......KLPBKKGKMPDK................",
        "...KKDDNNKKK........KMMDK.KKMBDK................",
        ".....KKKK.........KKLMPDK..KPMPMKK..............",
        ".................KLLLLMPMKKLMLMPPPK.............",
        ".................KMMPPBBBKKMPPBBDBK.............",
        "..................KKPBBKK..KKBBDKK..............",
        "..................KWKWKWK..KWKWKWK..............",
        "...................K.K.K....K.K.K..............."
      ]
    },
    thunderDragonIdle2: {
      palette: ZAN_PALETTE,
      pixels: [
        "...................K............................",
        "..................KYK.....K.....................",
        "...................KYK...KYK....................",
        "...................KlYK..KYGK...................",
        "...................KYYGK.KYGK...................",
        "...................KYYYGKKYGyK..................",
        "....................KYYGyAyGyK..................",
        "....................KYYGoAAyyK..................",
        "...................KAGGyhAAohLKK................",
        "..................KAAAyhBBDLLBYNK...............",
        "..................KAAAABYWNNLDYNKKK.K...........",
        "..................KLAAADYWNNAAALALLKNK..........",
        "..................KALLMMNNPLMMMLMMMLMK..........",
        ".................KALLMMPPPPPPPPNNNNNMK..........",
        "................KLMMMPPPPPBPMMMMMMPKK...........",
        ".................KKKMPPBMPBBMMMPPPK.............",
        "..................KLMKKKBBKKPPBPKK..............",
        ".................KLMK.KLKKLPKKKK....KKKK........",
        "..................KLLKLLLLMMMLMLKK.KvsSSK.......",
        ".................KAALPALALLMLMAMPKKsSWsK........",
        ".................KAAMBLLLLlllMLKKvsWSvqK........",
        "................KAALPDLLLLYllKKvsSSsqKK.........",
        "................KAAMBDMLMMYWKvsSWsvKK...........",
        "...............KAALBDPMMMPKKvSWSvqKPK...........",
        "...............KLLPBNPPPKKvsSSsqKKPPK...........",
        "...............KALPNPPPKvsSWsvKKDPMPPK..........",
        "..............KLLMPDGGKvSWSvqKhDKMMPBK..........",
        "..............KMMPPPLMySSsqKKhhDKMMBBK..........",
        "...............KPPBLALBsqKKGohhDKMMBDK..........",
        "................KBLLLPByKNhhhhhKKMMBDK..........",
        ".................KyPPDDoNNhhhhKKKMMBDK..........",
        "...............KKAAABUUUUNNUUUuUKMPMDK..........",
        "..K...........KAAAWWQQQQQQQQQQdQKMMMBK..........",
        ".KYK........KKAAAAALMLAUuuuUUdMKKMMPBK..........",
        ".KYK.......KAAAALLPBDLAQUuUUQNBK.KBBDK..........",
        ".KyyK....KKAAAAMPBDDLAAQUUUQdNBK.KWKWK..........",
        ".KMMK...KALALLPBNDNDMLMQQUQddNBK..K.K...........",
        ".KMMMKKKALALMDDNDNKKLMMBQUQdNBBK................",
        "..KMMMMLLLPBNNNNKK..KLMBllQdYPDK................",
        "..KPMMMPPBDNNNKK....KLMDKYYGMPBK................",
        "...KBBDDNNNNKK......KLPBKKQdMPDK................",
        "....KKDNKKKK........KMMDK.KKMBDK................",
        "......KK..........KKLMPDK..KPMPMKK..............",
        ".................KLLLLMPMKKLMLMPPPK.............",
        ".................KMMPPBBBKKMPPBBDBK.............",
        "..................KKPBBKK..KKBBDKK..............",
        "..................KWKWKWK..KWKWKWK..............",
        "...................K.K.K....K.K.K..............."
      ]
    },
    thunderDragonIdle3: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        "...................K............................",
        "..................KYK.....K.....................",
        "...................KlK...KYK....................",
        "...................KYYK..KYGK...................",
        "...................KlYYK.KYGK...................",
        "...................KYYYGKKGGyK..................",
        "....................KYYGyAyGyK..................",
        "....................KYYGoAAyoK..................",
        "...................KAyGyhAAooLKK................",
        "..................KAAAohBBDLLBYNK...............",
        "..................KAAAABYWNNLNYNKKK.K...........",
        "..................KALALDYWNNLALALALKNK..........",
        "..................KAALLMNNMMLMLMLMLLLK..........",
        ".................KLLLMPPPPPMPPPNNNNNPK..........",
        "................KLLMMPPPPPPPMMMMMMMKK....a......",
        ".................KKKMPPBPPBBPMPPPPK.............",
        "..................KLMKKKPBKKPPPPKK........l.....",
        ".................KLMK.KLKKMMKKKK.....KKK........",
        "..................KLAKALALLMMMLMKK.KKvsSK.......",
        ".................KAALPLLLLMMMLLLBKKvsSSvK.......",
        ".................KAAMBALLLlllMLKKvsSWsvK........",
        "................KAALPDLLLLYllKKvsSWsvKK.........",
        "................KAAMBDLMLMlWKvsSWSvqK...........",
        "...............KAALBNPPMPMKKsSWSvqKKK...........",
        "...............KALMDNBPPKKvSWSsqKKMPK...........",
        "...............KLLPNGGKKvsSSsqKKNMMPPK..........",
        "..............KLLMPDPGysSSsvKKhDKMMPBK..........",
        "..............KMPPBLMMyWsvKKohhDKMMPDK..........",
        "...............KPBLALMPyqKyyohhDKMMBDK..........",
        "................KKMLPPDoKNhhhhhKKMMBDK..........",
        "...............KKAyBBDUoUNhUUUUUKMPBDK..........",
        "..............KAAAWWQQQQQQQQQQdQKPMMBK..........",
        "..K.........KKAAAAALMLAUuuuUQdMKKMLMBK..........",
        ".KYK.......KAAAALLPBDLAQUuUQdNBKKMPBDK..........",
        ".KYK......KAAAAMMBBDLAAQuUUdNPBK.KPDK...........",
        ".KyyK...KKLALLPBDDNDMLMQUUQdNPBK.KWKWK..........",
        ".KLMK..KALALMDDNDNDKLMMlUQQdNBBK..K.K...........",
        ".KPMPKKLLLMBNNNNKKK.KLMYYQdlYPDK................",
        "..KPMMLLMBDNNNKK....KLMDKllGMPBK................",
        "..KPBPPPDNNNKK......KLPBKKGKMPDK................",
        "...KKDDNNNKK........KMMDK.KKMBDK................",
        ".....KKKKK........KKLMPDK..KPMPMKK..............",
        ".................KLLLLMPMKKLMLMPPPK.............",
        ".................KMMPPBBBKKMPPBBDBK.............",
        "..................KKPBBKK..KKBBDKK..............",
        "..................KWKWKWK..KWKWKWK..............",
        "...................K.K.K....K.K.K..............."
      ]
    },
    thunderDragonAttack0: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        "................................................",
        ".................K..............................",
        "................KYK.....K.......................",
        ".................KYK...KYK......................",
        ".................KlYK..KYGK.....................",
        ".................KYYGK.KYGK.....................",
        "......KKK........KYYYGKKYGyK....................",
        ".....KSvqK........KYYGyAyGyK....................",
        ".....KsWvK........KYYGoAAyyK....................",
        ".....KvSSvK......KAGNNhAAohNKK..................",
        "......KvSsqK....KAAAyhNBDLLBYNK.................",
        ".......KsWsK....KAAAABYWNNLDYNKKK.K.............",
        ".......KvSSvK...KLAAADYWNNAAALALLKNK............",
        "........KvSSqK..KALLMMNNPLMMMLMMMLMK............",
        ".........KsWsK.KALLMMPPPPMPPPNNNNNMK............",
        "..........KsWvKLMMMPPPPPBPMMMMMMPKK.............",
        "..........KvSSvKKKMPPPMPBBMPMPPPK...............",
        "...........KsWsqKLMKKKBBKKPPPPKK................",
        "............KsWvKMKKKKKKLLKKKKKK................",
        "............KvSSvKKAMLLLLLMMMLLMK...............",
        ".............KvSsqKALPALALLMLMLMPKK.............",
        "..............KsWsKGyBLLLLllMLMPDLLKK...........",
        "..............KvSSGyoDLLLYllPMPDDLLLLK..........",
        "..............KKGLLLPMMMMlWWlBNNPMMLMMK.........",
        ".............KAGGLAMBPMPMYWlYGyBBPMMPBPK........",
        "............KLLyhMMPDPBPPGYYyohBDPPMBBK.........",
        "............KMMBDPPDDWPPPGlYGyoDKKMMPDK.........",
        "............KPDDNKKGoWBPBGYYyohDKKMMBDK.........",
        ".............KKKK..KPBBBBoGyhhhDKKLPDDK.........",
        "...................KDBDDDyyyhhNKKMMPNK..........",
        ".................KKAANBDDhohhhDKKMLPBK..........",
        "...............KKAAAUUUUQNhUUUUUKMPBDK..........",
        "..............KAAAAAQQQQQQUQQQQQKKPDK...........",
        "............KKAAAALLPLAUuuUUQdPKKWKWK...........",
        "...........KAAAAALMBBLAQuUUQNMPK.K.K............",
        "KK........KAAALLPBDDLALQUUQdNPBK................",
        "YGK.....KKAAAMPBDDDDLLLQUUQdNPBK................",
        "yoK....KLALLPBNDNDDKMMMlUUQdlPDK................",
        "oPMKKKKLALMBDNDNKKK.KMMYlQQlGPBK................",
        "KPPMMLLLMPDDNNKK....KLPBYYYGPPDK................",
        ".KPPMMMBBNNNKK......KMMDKKQKMBDK................",
        "..KBDBDNNNKK......KKLMPDK.KKPMPMKK..............",
        "...KKDDKKK.......KLLLLMPMKKLMLMPPPK.............",
        ".....KK..........KMMPPBBBKKMPPBBDBK.............",
        "..................KKPBBKK..KKBBDKK..............",
        "..................KWKWKWK..KWKWKWK..............",
        "...................K.K.K....K.K.K..............."
      ]
    },
    thunderDragonAttack1: {
      palette: ZAN_PALETTE,
      pixels: [
        ".....KvvK.......................................",
        ".....KvWvK......K...............................",
        ".....KvSSqK....KYK.....K........................",
        "......KsWvK.....KYK...KYK.......................",
        "......KvSSqK....KlYK..KYGK......................",
        ".......KsWsK....KYYGK.KYGK......................",
        ".......KvSSqK...KYYYGKKYGyK.....................",
        "........KsWsK....KYYYyAyGyK.....................",
        "........KvSSqK...KYYyoAAoyK.....................",
        ".........KsWsK..KAGNNhAAohNKK...................",
        "..........KSSvKKAAAohNBDLLBYNK..................",
        "..........KvWsKKAAAABYWNNLDYNKKK.K..............",
        "...........KsSvKLALADYWNNALALALLKNK.............",
        "...........KvSsqKMLMMNNPLMLMLMLMLMK.............",
        "............KsWvKLPPPPPPPPPPNNNNNMK.............",
        "............KvSsqKPPPPPPPMMMMMMPKK..............",
        ".............KsWvGyBPPPBBMPPPPPK................",
        ".............KvGLMoBKBBKKPPPPKK.................",
        "............KlGLALBPKKKLLKKKKKK...KKKK..........",
        "............KGoMLMBPBLLLLMLMLMLKKKAAALK.........",
        ".............KKLPBDPDLLLLLMMMLMPAAAALMPK........",
        "...............KPDoWBDLLLlllMLMBBLLLMPPK........",
        "................KPBWNLLLMYllPPBNPPPMPBDK........",
        ".................KDNLMLMMlWWlBDNBBPMPDDK........",
        ".................KPPPPPMPYllYGyBKKMMBDK.........",
        ".................KPBPBPPPGYGGohBKKMMBDK.........",
        "..................KPBBBPPYYYGyhBKKMMPDK.........",
        "..................KBPBBBPGYGyohDKKMLMBK.........",
        "...................KBBDBDyyyhhhDKKMPBBK.........",
        "...................KDDBDDyGoohDK..KBBK..........",
        ".................KKAANDDNhhhhhNK.KWKWK..........",
        "...............KKAAAUUUUUNhUUUUUK.K.K...........",
        "..............KAAAAAQQQQQQQQQQdQK...............",
        "............KKAAAAALMLUUuUuUQdMK................",
        "...........KAAAALLPPDLAQUuUQNMBK................",
        "..........KAAAALMBBDLAAQuUQdNPBK................",
        "KK.......KAALLMBDDNDMLMUUUQdNPBK................",
        "YGK....KKLALMBBDDNDKLMMQUQddNBBK................",
        "yoK...KLLALPDDNNNKK.KLMlQQlYPPDK................",
        "oMMKKKLLLMPDDNDKK...KLMDlYGKMPBK................",
        "KPPMMLMMBDNNNKK.....KLPBKQKKMPDK................",
        ".KBBMPBDNNNKK.......KMMDKK.KMBDK................",
        "..KKDDNNKKK.......KKLMPDK..KPMPMKK..............",
        "....KKKK.........KLLLLMPMKKLMLMPPPK.............",
        ".................KMMPPBBBKKMPPBBDBK.............",
        "..................KKPBBKK..KKBBDKK..............",
        "..................KWKWKWK..KWKWKWK..............",
        "...................K.K.K....K.K.K..............."
      ]
    },
    thunderDragonAttack2: {
      palette: ZAN_PALETTE,
      pixels: [
        "........ssssssSKsK..............................",
        ".......s.s.sssKvWvK.............................",
        "......s.s.ssssKsWvK.....K.......................",
        ".........s.s.sKsWvKK...KYK......................",
        "......s.s.ssssKsSvKYK..KYGK.....................",
        ".........s.s.sKsSqKYYK.KYGK.....................",
        "........s.s.s.KSSqKYYGKKYGyK....................",
        "..............KSSqKYYGyAyGyK....................",
        "........s.s.sKvSsKKYYGoAAyyK....................",
        ".............KvSsKAGNNhAAooNKK..................",
        ".............KvWsKAAohNBDALBYNK.................",
        ".............KvWvKAAABYWNNLNYNKKK.K.............",
        ".............KsWvKLALDYWNNLALALALKNK............",
        ".............KsWvKALLMNNMMLMLMLMMMLK............",
        ".............KsSqKMMPPPPPMPPPNNNNNPK............",
        "............KKsSqKMPPPPPPPMMMMMMMKK.............",
        "...........KAKSSqKMPPPPPDBPMPPPPK...............",
        "...........KKvSsKMMKKKPBKKPPPPKK................",
        "...........KKvSsKMPKKKKKLMKKKKKK................",
        "..........KYGGGGGMMMMLALAMMMLLLMKK..............",
        "...........KGLLMooMMPBLLLLMLMLLMBLKKK...........",
        "...........KLALMPBPPBNALLLllMLLPDLLLLKK.........",
        "...........KLLPPDBDBDNMLLLYllPPBNLLLMLMK........",
        "............KBDBKKKDNMLMMlWWWBDNPPPMLPPK........",
        "............KGyK.KPMPPPPPYlWYGoBDBBMPBDK........",
        ".............KKWK.KPPBPPPGYYyohDBKKMMDDK........",
        "...............K..KPBPBPPYYYGyhDKKLLPDK.........",
        "...................KPPPBPGYGyohDKKLMPDK.........",
        "...................KBBBBDyyyhhhDKKMMBDK.........",
        "...................KDDBDDyGoohDK.KLMDNK.........",
        ".................KKAANDDNhhhhhNK.KMPDK..........",
        "...............KKAAAUUUUUNhUUUUUKKPBBK..........",
        "..............KAAAAAQQQQQQQQQQdQKWKWK...........",
        "............KKAAAAALMLAUuuuUQdMK.K.K............",
        "...........KAAAALLPPDLAQUuUQNMBK................",
        "..........KAAAALMBBDLAAQuUQdNPBK................",
        "KK.......KAALLMBDDNDMLMQUUQdNPBK................",
        "YGK....KKLALMBBDDNDKLMMlUUQdlBBK................",
        "yoK...KLLALPDDNNNKK.KLMYYQdlGPDK................",
        "oMMKKKLLLMPDDNDKK...KLMDYYYGMPBK................",
        "KPPMMLMMBDNNNKK.....KLPBKKQKMPDK................",
        ".KBBMPBDNNNKK.......KMMDK.KKMBDK................",
        "..KKDDNNKKK.......KKLMPDK..KPMPMKK..............",
        "....KKKK.........KLLLLMPMKKLMLMPPPK.............",
        ".................KMMPPBBBKKMPPBBDBK.............",
        "..................KKPBBKK..KKBBDKK..............",
        "..................KWKWKWK..KWKWKWK..............",
        "...................K.K.K....K.K.K..............."
      ]
    },
    thunderDragonAttack3: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        ".....................K..........................",
        "....................KYK.....K...................",
        ".....................KYK...KYK..................",
        ".....................KYYK..KYGK.s.s.............",
        ".....................KlYYK.KYGK..s.s............",
        ".....................KYYYGKKYGyKs.sssss.........",
        "......................KYYGyAyGyK.s.s.sss........",
        "......................KYYGoAAyyKssssssssS.......",
        ".....................KAGNNhAAooNKK.ssssKKK......",
        "....................KAAAohNBDALBYNKsssKvvSK.....",
        "....................KAAAABYWNNLNYNKKKKvsWvK.....",
        "....................KALALDYWNNLALALAKvSWsqK.....",
        "....................KAALLMNNMMLMLMLKsSSvKK......",
        "...................KALMMPPPPPMPPPKKsSSvK........",
        "..................KLLMMPPPPPPPMMKvsWSvK.........",
        "...................KKKMPBBPPDBPKvsWsqK..........",
        "....................KLMKKKPBKKKvSWsqK...........",
        "...................KLKKKLLKKMKvSSvKK............",
        "....................KLAKLLLKKsSSvKK.............",
        "...................KAALPKLKvsWSvKMPKK...........",
        "..................KAAAMBKKvsWsqKMBDLLKK.........",
        "..................KLLLPKLMyWsqKMBBNLMLMK........",
        "...................KLLKLALPyqKlBDNPMLMMPK.......",
        "...................KLLKLLMDKolYGoDBPMMPBK.......",
        "...................KLLKPMBDKoGyohBKPMMPBK.......",
        "...................KMMPKBDKGYYyohBKKMMBDK.......",
        "...................KMPPWWKPGYGyhDDKLLPDDK.......",
        "....................KPBDNKDyyyhhNKKLMBNK........",
        "...................KKDNNKDDyGoohDKKMPDDK........",
        ".................KKAAKKKDDNhhhhhKKLLPBK.........",
        "...............KKAAAUUUUUNNUUUUQKKMPBBK.........",
        "..............KAAAAAQQQQQQQQQQdQKKWBDK..........",
        "............KKAAAAALMLAUuuuUQdMK..KKWK..........",
        "...........KAAAALLPPDLAQUuUQNMBK....K...........",
        "..........KAAAALMBBDLAAQuUQdNPBK................",
        "K.......KKAALLPBDDNDMLMQUUQdNPBK................",
        "GK.....KALALMBDNDDDKLMMlUUQdlBBK................",
        "oK...KKLLLMPDDNNKKK.KLMYYQdlGPDK................",
        "PPKKKLLLLPBDDNDK....KLMDYYYGMPBK................",
        "BPPMMLMPDNNNNKK.....KLPBKKQKMPDK................",
        "KBPPPBBNNNKKK.......KMMDK.KKMBDK................",
        ".KKBDDNNKK........KKLMPDK..KPMPMKK..............",
        "...KKKKK.........KLLLLMPMKKLMLMPPPK.............",
        ".................KMMPPBBBKKMPPBBDBK.............",
        "..................KKPBBKK..KKBBDKK..............",
        "..................KWKWKWK..KWKWKWK..............",
        "...................K.K.K....K.K.K..............."
      ]
    },
    thunderDragonAttack4: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        "................................................",
        "........................K.......................",
        ".......................KYK.....K................",
        "........................KYK...KYK...............",
        "........................KYYK..KYGK..............",
        "........................KlYYK.KYGK..............",
        "........................KYYYYKKYGyK.............",
        ".........................KYYGyAyyyK.............",
        ".........................KYYGoAAyyK.............",
        "........................KAyNNhAAooNKK...........",
        ".......................KAAAooNBDALBYDK..........",
        ".......................KLAAABYWNNLNYNKKK.K......",
        ".......................KALAADYWNNLAAALALKNK.....",
        ".......................KLALMMNNMMLMMMLMMMLK.....",
        "......................KAALMPPPPPMPPPNNNNNPK.....",
        ".....................KLLMMPPPPPPPMMMMMMPKK......",
        "......................KKKMBBBPPBBPMPPPPK........",
        ".......................KLPKKKPBKKPPPPKK.........",
        "......................KKMKALAKKPPKKKK...........",
        ".....................KALKLLLLLPPPMMKK.......s...",
        "....................KAALMKALLMMPLLLPLK..........",
        "....................KAALMPKLLlllMLMPBMK...s...s.",
        "....................KLALMKKKKYllPPPBDMMK........",
        "....................KLMLKLLLPKyWGBNNPMMMK.s.s.s.",
        "....................KMMMWLAMBKoYGoBDPMMPPK...s.s",
        ".....................KMLWMMPDovKohDDPMMPBKs.s.s.",
        ".....................KLMKPBDDWSvKKDKKMMBBK.s.s.s",
        ".....................KMMPKKKosSSsvKKKLMDDKs.ssss",
        "...................KKKMPDNNoKKvsWSsKKLPDKs.s.s.s",
        ".................KKAAKDNNNKNyGKqvSWsvKKDK.ssssss",
        "...............KKAAAUUKKKKDUUUUKKqsSSsvKKs.sssss",
        "..............KAAAAAQQQQQQQQQQdQKKKvsWSvKKSsssss",
        "............KKAAAAALMLUUuUuUQdMK..KKqsSSsvKSSsss",
        "...........KAAAALLPPDLAQUuUQNMBK..KWKKvsWSsKKSSS",
        "K........KKAAAAMMBBDLAAQuUQdNPBK...KKWKqvSWsvKSS",
        "GK......KAAALLPBDDNDMLMUUUQdNPBK.....K.KKqsWSKS.",
        "oK....KKALALMDDNDDDKLMMQUQddNBBK.........KKvsSK.",
        "PMKKKKLLLLPBDDNDKKK.KLPlQQlYPBDK...........KKK..",
        "PPMMLLLLMBDNNNKK....KLPDlYGKPBPK................",
        "KPPMPMPBDNNNKK.....KLMBKKQK.KPPPK...............",
        ".KBDBDDNNNKK......KKLPBK.K..KPPBKK..............",
        "..KKKDNKKK......KKLLPBK......KBMMMKK............",
        ".....KK........KLLLMMPMK....KLMMMPPPK...........",
        "...............KMMPPBBBK....KPPPBBBBK...........",
        "................KKPBBKK......KKBBDKK............",
        "................KWKWKWK......KWKWKWK............",
        ".................K.K.K........K.K.K............."
      ]
    },
    thunderDragonAttack5: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        "................................................",
        "................................................",
        ".........................K......................",
        "........................KYK.....K...............",
        ".........................KYK...KYK..............",
        ".........................KYYK..KYGK.............",
        ".........................KlYYK.KYGK.............",
        ".........................KYYYGKKGGyK............",
        "..........................KYYGyAyGyK............",
        "..........................KYYGoAAyyK............",
        ".........................KAyNNhAAooNKK..........",
        "........................KAAAohNBDLLBYNK.........",
        "........................KAAAABYWNNLNYNKKK.K.....",
        "........................KALALDYWNNLALALALKNK....",
        "........................KAALLMNNMMLMLMLMLLLK....",
        ".......................KLLLMPPPPPMPPPNNNNNPK....",
        "......................KLLMMPPPPPPPMMMMMMMKK.....",
        ".......................KKKMBBBPPBPPMPPPPK.......",
        "........................KLPKKKPBKKPPPPKK........",
        "......................KKKPKALLKKPKKKKK..........",
        ".....................KAALKALLLLMMLLMK...........",
        ".....................KAALPKLLLMMMALMPK..........",
        "....................KAALMBKLLLllMLMBDMK.........",
        "....................KAALBDKLLYllPPBDNMMK........",
        "....................KLLPBDKKLlWWlDDNMMMMK.......",
        "....................KLLPWKLMKlllGyoDPMMMPK......",
        "....................KLLMKWALPKYGoohNPMMMPPK.....",
        "....................KLMMKMLMDKyGohDKKMMPDBK.....",
        "....................KMMPKPMBDoKoohDKKLMBDK......",
        "...................KKMBDNKBDhsKhhDKKLLPDDK......",
        ".................KKAKBNNNGKhsWsKhDKKLMBNK.......",
        "...............KKAAAUKKKKDNKqSSvKK.KMPDNK.......",
        "..............KAAAAAQQQQQQUQKvSSvKKLLPBK........",
        "............KKAAAALLPLQuuuUUQKvWsvKMPBDK........",
        "KK.........KAAAAALMBBLAQuUUQNMKsWsKWPDK.........",
        "YGK......KKAAALLPBDDLALQUUQdNPKqsWsKWK..........",
        "GoK.....KLAAAMPBDDDNLLLQuUQdNPBKqSSvK...........",
        "hMPK..KKLALLPBNNNDNKMMPQUQddNPDKKvSSvK..........",
        "KPMPKKLLLLMBDNNNKKK.KMPYUQlYPBBK.KvWsK..........",
        ".KPPMLMMPBNNNNKK....KLBDYYGKBBBK.KqsWsK.........",
        ".KPBPPPDDNNNKK....KKLMBKKQK.KBPPKKKqsSsK........",
        "..KKDDNNNKKK....KKLLPBDK.K...KPMMMKKvSSvK.......",
        "....KKKKK......KLLLMMPPK....KLMMMPPPKvWSvK......",
        "...............KMMPPBBBK....KPPPBBBBKKsWvK......",
        "................KKPBBKK......KKBBDKK..KvSK......",
        "................KWKWKWK......KWKWKWK...KK.......",
        ".................K.K.K........K.K.K............."
      ]
    },
    thunderDragonMagic0: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        "....................K...........................",
        "...................KYK.....K....................",
        "....................KYK...KYK...................",
        "....................KlYK..KYGK..................",
        "....................KYYGK.KYGK..................",
        "....................KYYYGKKYGyK.................",
        ".....................KYYYyAyGyK.................",
        ".....................KYYyoAAoyK.................",
        "....................KAGGyhAAohLKK...............",
        "...................KAAAohBBDLLBYNK..............",
        "...................KAAAABYWNNLDYNKKK.K..........",
        "...................KLALADYWNNALALALLKNK.........",
        "...................KALLMMNNPLMLMLMLMLMK.........",
        "..................KALLMPPPPPPPPPNNNNNMK.........",
        ".................KLLLMMPPPPPPMMMMMMPKK..........",
        "..................KKKMPBBPPBBMPPPPPK............",
        "...................KLMKKKBBKKPPPPKK.............",
        "..................KLKKKLLKKKKKKKK...............",
        "...................KLAKLWLLMMKLLLKK.............",
        "..................KAALPKWLAMBKyLMBLKKKK.........",
        ".................KALLLMPKMMPDoKMPDLLALLK........",
        "..................KPMMMLKPDDDSvKDNLLLLMPK.......",
        "..................KKBPPMLKKKoSSsKKMMLMPBK.......",
        "..................KMKBDPPPyoKvSWsqKMPBDDK.......",
        "..................KPPKKBPBBNKKqsWsvKPDDK........",
        "...................KBPBKDDDNKyKqsWSvKDK.........",
        "...................KPBPBKKDKGohKqsWSvKK.........",
        "...................KBBBBDDKGohhDKKvSSsK.........",
        "...................KKBBBDNyGyhhDKMKvSSsKK.......",
        ".................KKAADDDNNhhhhhKWPBKqsWsvK......",
        "...............KKAAAUUUUUNhUUUUUKKWKKqsWSvK.....",
        "..............KAAAAAQQQQQQQQQQdQK.K..KqsWSvK....",
        "............KKAAAAALMLAUuuuUQdMK......KKvSSvK...",
        "...........KAAAALLPPDLAQUuUQNMBK........KvSSK...",
        ".KK.......KAAAALMBBDLAAQuUQdNPBK.........KKK....",
        "KlGK....KKAALLPBDDNDMLMQUUQdNPBK................",
        "KYyK...KALALMBDNDDDKLMMlUUQdlBBK................",
        "KyMMKKKLLLMPDDNNKKK.KLMYYQdlGPDK................",
        ".KMPMLLLLPBDDNDK....KLMDYYYGMPBK................",
        ".KBPPMPPDNNNNKK.....KLPBKKQKMPDK................",
        "..KKBDBDNNKKK.......KMMDK.KKMBDK................",
        "....KKDNKK........KKLMPDK..KPMPMKK..............",
        "......KK.........KLLLLMPMKKLMLMPPPK.............",
        ".................KMMPPBBBKKMPPBBDBK.............",
        "..................KKPBBKK..KKBBDKK..............",
        "..................KWKWKWK..KWKWKWK..............",
        "...................K.K.K....K.K.K..............."
      ]
    },
    thunderDragonMagic1: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        "................................................",
        ".......................K........................",
        "......................KYK.....K.................",
        ".......................KYK...KYK................",
        ".......................KlYK..KYGK...............",
        ".......................KYYGK.KYGK...............",
        ".......................KYYYGKKYGGK..............",
        "........................KYYGoAyGyK..............",
        "........................KYYGoAAyyK..............",
        ".......................KAGGyhAAohLKK............",
        "......................KAAAohPBDLLBYNK...........",
        "......................KAAAABYWNNLDYNKKK.K.......",
        "......................KAALADYWNNALAAALLKNK......",
        "......................KALLMMNNPLMLMMMMMLMK......",
        ".....................KALLMMPPPPPPPPNNNNNMK......",
        "....................KLMMMPPPPPBPMMMMMMPKK.......",
        ".....................KKKMPBBPPBBMPMPPPK.........",
        "......................KLMKKKBBKKPPBPKK..........",
        ".....................KKKKKLLKKMPKKKK............",
        ".....................KLLKLLLLMMMMMMK............",
        "....................KAALMKALAMLMLLMPK...........",
        "....................KALLMPKLLlllMLPDMKK.........",
        "....................KMMMLMPKLWKKKPBDLLLK........",
        ".....................KBMMMBKKWLLMKNDMMMMK.......",
        ".....................KKPMMMMKLALMBKDLMMPPK......",
        ".....................KKPPMMLKMMMBDKDMMPBDK......",
        ".....................KPKBPPPPKBDDyoLLPBDDK......",
        ".....................KBBKBBBNGKyhSqKPBNNK.......",
        "...................KKKKBPKDNNKyKsWsKBNNK........",
        ".................KKAAAKBBBKKKGoKqSSvKNK.........",
        "...............KKAAAUUuUUDDUUUUQKsWsKK..........",
        "..............KAAAAAQQQQQQQQQQdQKqSSvK..........",
        "............KKAAAAALMLAUuuuUQdMKWKvWsK..........",
        "...........KAAAALLPPDLAQUuUQNMBKKKqSSvK.........",
        ".KK.......KAAAALMBBDLAAQuUQdNPBK..KvWsK.........",
        "KlGK....KKAALLPBDDNDMLMQUUQdNPBK..KqsSvK........",
        "KYyK...KALALMBDNDDDKLMMlUUQdlBBK...KvWsK........",
        "KyMMKKKLLLMPDDNNKKK.KLPYYQdlGPDK...KqsSvK.......",
        ".KMPMLLLLPBDDNDK....KLPDYYYGMPBK....KvWsK.......",
        ".KBPPMPPDNNNNKK.....KLBDKKQKPPBK.....KsSvK......",
        "..KKBDBDNNKKK......KLMBK..K.KPMBK....KvSsK......",
        "....KKDNKK.......KKAMPDK....KPMMMKK...KsSvK.....",
        "......KK........KLLLLMPPK..KLMLMMPPK..KvSSK.....",
        "................KMPMPBBBK..KPPPPBBBK...KvSK.....",
        ".................KKPBDKK....KKBDDKK.....KK......",
        ".................KWKWKWK....KWKWKWK.............",
        "..................K.K.K......K.K.K.............."
      ]
    },
    thunderDragonMagic2: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        "................................................",
        "......................K.........................",
        ".....................KYK.....K..................",
        "......................KYK...KYK.................",
        "......................KlYK..KYGK................",
        "......................KYYYK.KYGK................",
        "......................KYYYYKKYGyK...............",
        ".......................KYYGyAyGyK...............",
        ".......................KYYGoAAyyK...............",
        "......................KAyGyhAAohLKK.............",
        ".....................KAAAooBBDALBYDK............",
        ".....................KAAAABYWNNLNYNKKK.K........",
        ".....................KAAALDYWNNAALAAALKNK.......",
        ".....................KLLLLPNNMMLMLMMMMMLK.......",
        "....................KALLMPPPPPMPPPNNNNNPK.......",
        "...................KLLMMPPPPPPPMMMMMPPKK........",
        "....................KKKMPPBPPBBPMPPPPK.K........",
        ".....................KLMKKKPBKKPPPPKK.KWK.......",
        "....................KLKK.KLKKMMKKKK..KLMWK......",
        ".....................KLAKLLLLMMMMMMKKLMMBK......",
        "....................KAALMKALAMLMLLMPKPMBBK......",
        "....................KALLMPKLLlllMLPDLADNK.......",
        "....................KMMMLMPKLWKKKPBNLMBDK.......",
        ".....................KBMMMBKKWLLMKNDPBDK........",
        ".....................KKPMMMMKLALMBKDPDDK........",
        ".....................KKPPMMLKMMMBDKDDDNK........",
        ".....................KMKBPPPPKBDDyoDDNK.........",
        ".....................KPPKBBBNGKyhSqKKK..........",
        "...................KKKPBBKDNNKyKsWsK............",
        ".................KKAAAKBBBKKKGoKqSSvK...........",
        "...............KKAAAUUuUUDDUUUUQKsWsK...........",
        "..............KAAAAAQQQQQQQQQQdQKqSSvK..........",
        "............KKAAAAALMLAUuuuUQdMK.KvWsK..........",
        "...........KAAAALLPPDLAQUuUQNMBK.KqSSvK.........",
        ".KK.......KAAAALMBBDLAAQuUQdNPBK..KvWsK.........",
        "KlGK....KKAALLPBDDNDMLMQUUQdNPBK..KqsSvK........",
        "KYyK...KALALMBDNDDDKLMMlUUQdlBBK...KvWsK........",
        "KyMMKKKLLLMPDDNNKKK.KLPYYQdlGPDK...KqsSvK.......",
        ".KMPMLLLLPBDDNDK....KLPDYYYGMPBK....KvWsK.......",
        ".KBPPMPPDNNNNKK.....KLBDKKQKPPBK.....KsSvK......",
        "..KKBDBDNNKKK......KLMBK..K.KPMBK....KvSsK......",
        "....KKDNKK.......KKAMPDK....KPMMMKK...KsSvK.....",
        "......KK........KLLLLMPPK..KLMLMMPPK..KvSSK.....",
        "................KMPMPBBBK..KPPPPBBBK...KvSK.....",
        ".................KKPBDKK....KKBDDKK.....KK......",
        ".................KWKWKWK....KWKWKWK.............",
        "..................K.K.K......K.K.K.............."
      ]
    },
    thunderDragonMagic3: {
      palette: ZAN_PALETTE,
      pixels: [
        "......................K.........................",
        ".....................KYK.....K..................",
        "......................KYK...KYK.................",
        "......................KYYK..KYGK................",
        "......................KYYYK.KYGK................",
        "......................KYYYYKKYGyK...............",
        ".......................KYYGyAyGyK...............",
        ".......................KYYGoAAyyK........K.K....",
        "......................KAyGyhAAohLKK.....KWKWK...",
        ".....................KAAAooBBDALBYDK...KLLMK....",
        ".....................KLAAABYWNNLNYNKKK.KLMBK....",
        ".....................KALAADYWNNLAAALALKNPPBK....",
        ".....................KLLLMPNNMMLMMMMMMMLKDNK....",
        "....................KAALMPPPPPMPPPNNNNNPKPBK....",
        "...................KLLMMPPPPPPPMMMMMMPKKMBDK....",
        "....................KKKMPPBPPBBPMPPPPKALMDK.....",
        ".....................KLMKKKPBKKPPPPKKKLLPDK.....",
        "....................KLMKKLAKKMMKKKK.KLAMBDK.....",
        ".....................KKKKLLLLMPMKKKKLLMBDDK.....",
        ".....................KAAKLLLLMMMLMMLLMBNDK......",
        "....................KAALPKLLMMMMMLMBPBNNK.......",
        "...................KAAALMPKLLllMLLPDDNNK........",
        "....................KLMMMBKLMYllPPDNNNK.........",
        "....................KPMMMMPKlWKKKDNNKK..........",
        "....................KKBPPMPPKWLLMKBK............",
        "....................KPKBPPMMKLALMBKK............",
        ".....................KBKBPPMKMMMBDKK............",
        ".....................KPBKDBBDKBDDyoK............",
        ".....................KBBBKDNNGKyhSqK............",
        "...................KKKKBBDKKKGyKsWsK............",
        ".................KKAAAKBDDNNhhhKqSSvK...........",
        "...............KKAAAUUuUUDNUUUUQKsWsK...........",
        "..............KAAAAAQQQQQQQQQQdQKqSSvK..........",
        "............KKAAAAALMLAUuuuUQdMK.KvWsK..........",
        "...........KAAAALLPPDLAQUuUQNMBK.KqSSvK.........",
        ".KK.......KAAAALMBBDLAAQuUQdNPBK..KvWsK.........",
        "KlGK....KKAALLPBDDNDMLMQUUQdNPBK..KqsSvK........",
        "KYyK...KALALMBDNDDDKLMMlUUQdlBBK...KvWsK........",
        "KyMMKKKLLLMPDDNNKKK.KLPYYQdlGPDK...KqsSvK.......",
        ".KMPMLLLLPBDDNDK....KLPDYYYGMPBK....KvWsK.......",
        ".KBPPMPPDNNNNKK.....KLBDKKQKPPBK.....KsSvK......",
        "..KKBDBDNNKKK......KLMBK..K.KPMBK....KvSsK......",
        "....KKDNKK.......KKAMPDK....KPMMMKK...KsSvK.....",
        "......KK........KLLLLMPPK..KLMLMMPPK..KvSSK.....",
        "................KMPMPBBBK..KPPPPBBBK...KvSK.....",
        ".................KKPBDKK....KKBDDKK.....KK......",
        ".................KWKWKWK....KWKWKWK.............",
        "..................K.K.K......K.K.K.............."
      ]
    },
    thunderDragonMagic4: {
      palette: ZAN_PALETTE,
      pixels: [
        ".....................KGK.....K..................",
        "......................KYK...KYK.................",
        "......................KlYK..KYGK................",
        "......................KYYGK.KYGK................",
        "......................KYYYGKKYGyK...............",
        ".......................KYYYyAyGyK........K.K....",
        ".......................KYYyoAAoyK.......KWKWK...",
        "......................KAGGyhAAyhAKK....KLLMK....",
        ".....................KAAAohBBDLLBYNK...KLMBK....",
        ".....................KAAAABYWNNLDYNKKKKAPPBK....",
        ".....................KLALADYWNNALALALLKNBDNK....",
        ".....................KALLMMNNMLMLMLMLMLMKPBK....",
        "....................KALLMPPPPPPPPPNNNNNMKBDK....",
        "...................KLMLMMPPPPPPMMMMMMPKKMDK.....",
        "....................KKKMPBBPPBBMPMPPPKLLPBK.....",
        ".....................KLMKKKBPKKPPPPKKKLLPDK.....",
        "....................KLMKKLLKKPPKKKKKKALMDDK.....",
        ".....................KKKKLLLMPMKKKKLLLMBDDK.....",
        "....................KAAMKLLLMMMMMLPLLPDDNK......",
        "...................KAAALPKALLMMMALMBBDNNK.......",
        "...................KLALMBKLLMllMMMBDNNKK........",
        "...................KLMMMMPKLYllPPBBNNK..........",
        "....................KPPMMMPKlWKKKDNNK...........",
        "....................KKBPMMMPKWLLMKBK............",
        "....................KPKBPMMMKLALMBKK............",
        ".....................KPKBPMMKMLPPDKK............",
        ".....................KBPKBBBDKBDDyoK............",
        ".....................KBBBKDNNGKyoSvK............",
        "......................KBDBKKKyoKsWsK............",
        "...................KKKKBBDDNhhhKqSSvK...........",
        ".................KKAAAKKDDNNhhhhKsWsK...........",
        "...............KKAAAUUuuUNNUUUUQKqSSvK..........",
        "..............KAAAAAQQQQQQQQQQdQKKvWsK..........",
        "............KKAAAAALMLAUuuuUQdMK.KqSSvK.........",
        "...........KAAAALLPPDLAQUuUQNMBK..KvWsK.........",
        ".KK.......KAAAALMBBDLAAQuUQdNPBK..KqSSvK........",
        "KlGK....KKAALLPBDDNDMLMQUUQdNPBK...KvWsK........",
        "KYyK...KALALMBDNDDDKLMMlUUQdlBBK...KqsSvK.......",
        "KyMMKKKLLLMPDDNNKKK.KLPYYQdlGPDK....KvSsK.......",
        ".KMPMLLLLPBDDNDK....KLPDYYYGMPBK.....KsSvK......",
        ".KBPPMPPDNNNNKK.....KLBDKKQKPPBK.....KvSsK......",
        "..KKBDBDNNKKK......KLMBK..K.KPMBK.....KsWvK.....",
        "....KKDNKK.......KKAMPDK....KPMMMKK...KvSSK.....",
        "......KK........KLLLLMPPK..KLMLMMPPK...KsSK.....",
        "................KMPMPBBBK..KPPPPBBBK....KK......",
        ".................KKPBDKK....KKBDDKK.............",
        ".................KWKWKWK....KWKWKWK.............",
        "..................K.K.K......K.K.K.............."
      ]
    },
    thunderDragonSkill0: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        "................................................",
        ".................K..............................",
        "................KYK.....K.......................",
        ".................KYK...KYK......................",
        ".................KlYK..KYGK.....................",
        ".................KYYGK.KYGK.....................",
        ".................KYYYGKKYGyK....................",
        "..................KYYGyAyGyK....................",
        "..................KYYGoAAyyK....................",
        ".................KAGNNhAAohNKK..................",
        "................KAAAyhNBDLLBYNK.................",
        "................KAAAABYWNNLDYNKKK.K.............",
        "................KLAAADYWNNAAALALLKNK............",
        "................KALLMMNNPLMMMLMMMLMK............",
        "...............KALLMMPPPPMPPPNNNNNMK............",
        ".KKKK.........KLMMMPPPPPBPMMMMMMPKK.............",
        "KSSvqKK........KKKMPPBMPBBMPMPPPK...............",
        "KvSWSvqK........KLMKKKBBKKPPPPKK................",
        ".KvsSWsvKK.....KLMKKKKKKLMKKKKKK................",
        "..KKvsSSsqKK....KKAAMKLLLLMMMLLMK...............",
        "....KKvSWSvqK...KAAALPKLALLMLLLMPKK.............",
        "......KvsSWsvKK.KAALPBKLLLllMLMPDLLKK...........",
        ".......KKvsSWsvKKALPBDKLLYllPPBDDLLLLK..........",
        ".........KKvsSSsqKKGNKMMMlWWlBNNPMMLMMK.........",
        "...........KKvSWSvYKKKPPMYWlYGyDPPMMPBPK........",
        ".............KvsSWLLMPKPPGYYyohBDPPMBBK.........",
        ".............KKKvYLALBKPPGlYGyoDKKMMPDK.........",
        "............KMMPGKMMBDKWBGYYyohDKKMMBDK.........",
        ".............KBDyKPPDDKWBoGyhhhDKKLPDDK.........",
        "..............KKKKKKKKDDDyyyhhNKKMMPNK..........",
        ".................KKAANBDDhohhhDKKMLPBK..........",
        "...............KKAAAUUUUQNhUUUUUKMPBDK..........",
        "..............KAAAAAQQQQQQUQQQQQKKPDK...........",
        "............KKAAAALLPLAUuuUUQdPKKWKWK...........",
        "...........KAAAAALMBBLAQuUUQNMPK.K.K............",
        "KK........KAAALLPBDDLALQUUQdNPBK................",
        "YGK.....KKAAAMPBDDDDLLLQUUQdNPBK................",
        "yoK....KLALLPBNDNDDKMMMlUUQdlPDK................",
        "oPMKKKKLALMBDNDNKKK.KMMYlQQlGPBK................",
        "KPPMMLLLMPDDNNKK....KLPBYYYGPPDK................",
        ".KPPMMMBBNNNKK......KMMDKKQKMBDK................",
        "..KBDBDNNNKK......KKLMPDK.KKPMPMKK..............",
        "...KKDDKKK.......KLLLLMPMKKLMLMPPPK.............",
        ".....KK..........KMMPPBBBKKMPPBBDBK.............",
        "..................KKPBBKK..KKBBDKK..............",
        "..................KWKWKWK..KWKWKWK..............",
        "...................K.K.K....K.K.K..............."
      ]
    },
    thunderDragonSkill1: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        ".....................K..........................",
        "....................KYK.....K...................",
        ".....................KYK.s.KYKs.................",
        "....................sKYYK.sKYGKsss..............",
        ".....................KlYYK.KYGKsssSS............",
        ".....................KYYYGKKYGyKsSSKK...........",
        "......................KYYGyAyGyKsSKvSK..........",
        "....................s.KYYGoAAyyKSKvSSK..........",
        ".....................KAGNNhAAooNKKsWvK..........",
        "....................KAAAohNBDALBKsWsK...........",
        "....................KAAAABYWNNLKvSSqK.K.........",
        "....................KALALDYWNNKvsSvKLKNK........",
        "....................KAALLMNNMMKsWsKMMMLK........",
        "...................KALMMPPPPPKvSsqKNNNPK........",
        "..................KLLMMPPPPPKvSSvKMMMKK.........",
        "...................KKKMPBBPPKsWvKPPPK...........",
        "....................KLMKKKPKsSsqKPKK............",
        "...................KLKKKLLKvSSqKKK..............",
        "....................KLAKLLKsWvKMLMK.............",
        "...................KAALPKKsWsKMLLMPKK...........",
        "..................KAAAMGKvSSqKMLLPDLLKK.........",
        "..................KAALPKGGSvKllPPBNLMLMK........",
        "..................KLALKLLMyKWWlBDNPMLMMPK.......",
        "..................KLLKLALMBKllYGoDBPMMPPBK......",
        "..................KLMKMMMBBKYGyohBKPMMPDK.......",
        "..................KMMMKBDDKGYYyohBKKMMBDK.......",
        "...................KMMBKKKPGYGyhDDKLLPDDK.......",
        "...................KPBDWWBDyyyhhNKKLMBNK........",
        "...................KBNNKBDDyGoohDKKMPDDK........",
        ".................KKAKKKBDDNhhhhhKKLLPBK.........",
        "...............KKAAAUUUUUNNUUUUQKKMPBBK.........",
        "..............KAAAAAQQQQQQQQQQdQKKWBDK..........",
        "............KKAAAAALMLAUuuuUQdMK..KKWK..........",
        "...........KAAAALLPPDLAQUuUQNMBK....K...........",
        "..........KAAAALMBBDLAAQuUQdNPBK................",
        "K.......KKAALLPBDDNDMLMQUUQdNPBK................",
        "GK.....KALALMBDNDDDKLMMlUUQdlBBK................",
        "oK...KKLLLMPDDNNKKK.KLMYYQdlGPDK................",
        "PPKKKLLLLPBDDNDK....KLMDYYYGMPBK................",
        "BPPMMLMPDNNNNKK.....KLPBKKQKMPDK................",
        "KBPPPBBNNNKKK.......KMMDK.KKMBDK................",
        ".KKBDDNNKK........KKLMPDK..KPMPMKK..............",
        "...KKKKK.........KLLLLMPMKKLMLMPPPK.............",
        ".................KMMPPBBBKKMPPBBDBK.............",
        "..................KKPBBKK..KKBBDKK..............",
        "..................KWKWKWK..KWKWKWK..............",
        "...................K.K.K....K.K.K..............."
      ]
    },
    thunderDragonSkill2: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        "................................................",
        "........................K.......................",
        ".......................KYK.....K................",
        "........................KYK...KYK...............",
        "........................KYYK..KYGK..............",
        "........................KlYYK.KYGK..............",
        "........................KYYYYKKYGyK.............",
        ".........................KYYGyAyyyK.............",
        ".........................KYYGoAAyyK.............",
        "........................KAyNNhAAooNKK...........",
        ".......................KAAAooNBDALBYDK..........",
        ".......................KLAAABYWNNLNYNKKK.K......",
        ".......................KALAADYWNNLAAALALKNK.....",
        ".......................KLALMMNNMMLMMMLMMMLK.....",
        "......................KAALMPPPPPMPPPNNNNNPK.....",
        ".....................KLLMMPPPPPPPMMMMMMPKK......",
        "......................KKKMBBBPPBBPMPPPPK........",
        ".......................KLPKKKPBKKPPPPKK.........",
        "......................KKMKALAKKPPKKKK...........",
        ".....................KALKLLLLLPPPMMKK.......s...",
        "....................KAALMKALLMMPLLLPLK..........",
        "....................KAALMPKLLlllMLMPBMK...s...s.",
        "....................KLALMBKKLYllPPPBDMMK.......s",
        "....................KLLMPKLMKlWWGBNNPMMMK.s.s.s.",
        "....................KLLMWLALPKyYGoBDPMMPPK...s.s",
        "....................KLMMWLLMDyKKohDDPMMPBKs.s.s.",
        "....................KMMMKPMBDosvKoDKKMMBBK.s.s.s",
        "....................KMPPDKBDoSWSsKKKKLMDDKs.ssss",
        "...................KKKPBDNKKKqsSWsvKKLPDKs.s.s.s",
        ".................KKAAKDNNKDNyKKqsSSsvKKDK.ssssss",
        "...............KKAAAUUKKKDDUUUUKKvsWSsvKKs.sssss",
        "..............KAAAAAQQQQQQQQQQdQKKqvSWSsKKSsssss",
        "............KKAAAAALMLAUuuuUQdMK..KKqsSWsvKKSSss",
        "...........KAAAALLPPDLAQUuUQNMBK..KWKKqsSSsvKSSS",
        "K........KKAAAAMMBBDLAAQuUQdNPBK...KKWKKvsWSsKSS",
        "GK......KAAALLPBDDNDMLMQUUQdNPBK.....K..KqvSWsK.",
        "oK....KKALALMDDNDDDKLMMlUUQdlBBK.........KKqvsK.",
        "PMKKKKLLLLPBDDNDKKK.KLPYYQdlGBDK...........KKK..",
        "PPMMLLLLMBDNNNKK....KLPDYYYGPBPK................",
        "KPPMPMPBDNNNKK.....KLMBKKKQKKPPPK...............",
        ".KBDBDDNNNKK......KKLPBK..K.KPPBKK..............",
        "..KKKDNKKK......KKLLPBK......KBMMMKK............",
        ".....KK........KLLLMMPMK....KLMMMPPPK...........",
        "...............KMMPPBBBK....KPPPBBBBK...........",
        "................KKPBBKK......KKBBDKK............",
        "................KWKWKWK......KWKWKWK............",
        ".................K.K.K........K.K.K............."
      ]
    },
    thunderDragonSkill3: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        ".....................K..........................",
        "....................KYK.....K...................",
        ".....................KYK...KYK..................",
        ".....................KYYK..KYGK.................",
        ".....................KlYYK.KYGK.................",
        ".....................KYYYGKKYGyK................",
        "......................KYYGyAyGyK................",
        "......................KYYGoAAyyK................",
        ".....................KAGNNhAAooNKK..............",
        "....................KAAAohNBDALBYNK.............",
        "....................KAAAABYWNNLNYNKKK.K.........",
        "....................KALALDYWNNLALALALKNK........",
        "....................KAALLMNNMMLMLMLMMMLK........",
        "...................KALMMPPPPPMPPPNNNNNPK...KKK..",
        "..................KLLMMPPPPPPPMMMMMMMKK..KKvsvK.",
        "...................KKKMPBBPPDBPMPPPPK..KKvsSWvK.",
        "....................KLMKKKPBKKPPPPKKKKKvsSWsvKS.",
        "...................KLKKKLLKKMMKKKKKKvsSWSsvKKSSS",
        "....................KLAKLLLLLMLMKKvsSWSsvKKSSSss",
        "...................KAALPKLLLMMKKvsSWSsqKKsssssss",
        "..................KAAAMBKLGLKKvsSWSvqKKK.s.sssss",
        "...................KLLPBKKKKvsSWSvqKKLMMK.ssssss",
        "...................KLLMKLLLPSWsvqKKPMMMPPK.s.s.s",
        "...................KLLMKLAMByvqKKDBBPMPBDKssssss",
        "...................KLMMKMMPDKKKohBKKLMBDKs.s.s.s",
        "...................KMMMKPBDDKoyohBKLLPDDK.s.s.ss",
        "....................KMMWWKKKYGyhDDKLLBDK...s.s.s",
        "....................KMBDNKDyyyhhNKKMPDNKs.s.s.s.",
        "...................KKBNNNKDyGoohDKLLMBK......s..",
        ".................KKAAKKKKDNhhhhhKKMPBBK...s.s.s.",
        "...............KKAAAUUUUUNNUUUUQKKWBBK..........",
        "..............KAAAAAQQQQQQQQQQdQK.KWK.......s.s.",
        "............KKAAAAALMLAUuuuUQdMK...K............",
        "...........KAAAALLPPDLAQUuUQNMBK................",
        ".KK.......KAAAALMBBDLAAQuUQdNPBK................",
        "KlGK....KKAALLPBDDNDMLMQUUQdNPBK................",
        "KYyK...KALALMBDNDDDKLMMlUUQdlBBK................",
        "KyMMKKKLLLMPDDNNKKK.KLPYYQdlGPDK................",
        ".KMPMLLLLPBDDNDK....KLPDYYYGMPBK................",
        ".KBPPMPPDNNNNKK.....KLBDKKQKPPBK................",
        "..KKBDBDNNKKK......KLMBK..K.KPMBK...............",
        "....KKDNKK.......KKAMPDK....KPMMMKK.............",
        "......KK........KLLLLMPPK..KLMLMMPPK............",
        "................KMPMPBBBK..KPPPPBBBK............",
        ".................KKPBDKK....KKBDDKK.............",
        ".................KWKWKWK....KWKWKWK.............",
        "..................K.K.K......K.K.K.............."
      ]
    },
    thunderDragonSkill4: {
      palette: ZAN_PALETTE,
      pixels: [
        "......KSvKSssssssss.s.s.s.......................",
        "......KsSvKSss.s.K.s.s..........................",
        "......KvWsKSssssKYK.s.s.K.......................",
        ".......KSSvK.s.s.KYK...KYK......................",
        ".......KvWsKsss.sKYYK..KYGK.....................",
        "........KSSqKs...KlYYK.KYGK.....................",
        "........KsWsK.s..KYYYGKKYGyK....................",
        "........KvSSqK....KYYGyAyGyK....................",
        ".........KsWsK....KYYGoAAyyK....................",
        ".........KvSSqK..KAGNNhAAooNKK..................",
        "..........KsWsK.KAAAohNBDALBYNK.................",
        "..........KvSSqKKAAAABYWNNLNYNKKK.K.............",
        "...........KsWvKKKKALDYWNNLALALALKNK............",
        "...........KvSSqKLMKLMNNMMLMLMLMMMLK............",
        "............KsWvKAPKPPPPPMPPPNNNNNPK............",
        "............KvSSqKMBKPPPPPMMMMMMMKK.............",
        ".............KsWvKyBKBPPDBPMPPPPK...............",
        ".............KvGLMKPKKPBKKPPPPKK................",
        "............KlKLALBKPKKKLLKKKKKK...KKK..........",
        "............KGKMLMBKBKALALMMLLLMKKKAALK.........",
        ".............KKLPBDKBBKLLLMMMALMBAAALMPK........",
        "...............KPDKWBNKLLMllMLMBDLALLPPK........",
        "................KKBWDNKLLYllPPBDNPPMPPBK........",
        ".................KDNNKLMMlWWlBDNBBBPMBBK........",
        ".................KKKKPPPPYllYGoBKKKMPDDK........",
        "..................KPPBPPPGYGyohBPKLLPDK.........",
        "..................KBBPBPPYYYGyhDKKMMPDK.........",
        "...................KPPPBPGYGyohDKKMLMBK.........",
        "...................KBBBBDyyyhhhDKKMPBBK.........",
        "...................KDDBDDyGoohDK..KBBK..........",
        ".................KKAANDDNhhhhhNK.KWKWK..........",
        "...............KKAAAUUUUUNhUUUUUK.K.K...........",
        "..............KAAAAAQQQQQQQQQQdQK...............",
        "............KKAAAAALMLAUuuuUQdMK................",
        "...........KAAAALLPPDLAQUuUQNMBK................",
        "..........KAAAALMBBDLAAQuUQdNPBK................",
        "KK.......KAALLMBDDNDMLMQUUQdNPBK................",
        "YGK....KKLALMBBDDNDKLMMlUUQdlBBK................",
        "yoK...KLLALPDDNNNKK.KLMYYQdlGPDK................",
        "oMMKKKLLLMPDDNDKK...KLMDYYYGMPBK................",
        "KPPMMLMMBDNNNKK.....KLPBKKQKMPDK................",
        ".KBBMPBDNNNKK.......KMMDK.KKMBDK................",
        "..KKDDNNKKK.......KKLMPDK..KPMPMKK..............",
        "....KKKK.........KLLLLMPMKKLMLMPPPK.............",
        ".................KMMPPBBBKKMPPBBDBK.............",
        "..................KKPBBKK..KKBBDKK..............",
        "..................KWKWKWK..KWKWKWK..............",
        "...................K.K.K....K.K.K..............."
      ]
    },
    thunderDragonSkill5: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        ".....................K..........................",
        "....................KYK.....K...................",
        ".....................KYK...KYK..................",
        ".....................KYYK..KYGK.................",
        ".....................KlYYK.KYGK.................",
        ".....................KYYYGKKYGyK................",
        "......................KYYGyAyGyK................",
        "......................KYYGoAAyyK..s.s.s.s.......",
        ".....................KAGNNhAAooNKK...s.s.s......",
        "....................KAAAohNBDALBYNK.s.s.s.......",
        "....................KAAAABYWNNLNYNKKKsKs.s......",
        "....................KALALDYWNNLALALALKNKssss....",
        "....................KAALLMNNMMLMLMLMMMLKss.s....",
        "...................KALMMPPPPPMPPPNNNNNPKsssss...",
        "..................KLLMMPPPPPPPMMMMMMMKKs.ssss...",
        "...................KKKMPBBPPDBPMPPPPK.ssssssSS..",
        "....................KLMKKKPBKKPPPPKK.s.ssSSKSS..",
        "...................KKKKKLAKKPMKKKK....KKKKKvKK..",
        "...................KLLLKALAMMMLLLMKKKKvvsssSSWK.",
        "..................KAAAMPKGLLMKKKKKvvssSSWWSssK..",
        "..................KAALMKKKyKKvvssSSWWSSsvvqKK...",
        "..................KLMLKLLMossSSWSSssvqqKKKK.....",
        "...................KLKLAAMPWSssvvqKKKKKPK.......",
        "...................KLKMLPPDvqKKKKKBPMMPBK.......",
        "...................KLWKBDDKyKGyohBKPMPBDK.......",
        "...................KMMWKKKyoYYyohBKKMMDDK.......",
        "....................KMMBNKGYYGyhDDKLLPDK........",
        "....................KMBDNKoyyohhNKKLMBDK........",
        "...................KKBNNNKDyGoohDKKMPDDK........",
        ".................KKAAKKKKDNhhhhhKKLLPBK.........",
        "...............KKAAAUUUUUNNUUUUQKKMPBBK.........",
        "..............KAAAAAQQQQQQQQQQdQKKWBDK..........",
        "............KKAAAAALMLAUuuuUQdMK..KKWK..........",
        "...........KAAAALLPPDLAQUuUQNMBK....K...........",
        "K........KKAAAAMMBBDLAAQuUQdNPBK................",
        "GK......KAAALLPBDDNDMLMQUUQdNPBK................",
        "oK....KKALALMDDNDDDKLMMlUUQdlBBK................",
        "PMKKKKLLLLPBDDNDKKK.KLMYYQdlGPDK................",
        "PPMMLLLLMBDNNNKK....KLMDYYYGMPBK................",
        "KPPMPMPBDNNNKK......KLPBKKQKMPDK................",
        ".KBDBDDNNNKK........KMMDK.KKMBDK................",
        "..KKKDNKKK........KKLMPDK..KPMPMKK..............",
        ".....KK..........KLLLLMPMKKLMLMPPPK.............",
        ".................KMMPPBBBKKMPPBBDBK.............",
        "..................KKPBBKK..KKBBDKK..............",
        "..................KWKWKWK..KWKWKWK..............",
        "...................K.K.K....K.K.K..............."
      ]
    },
    thunderDragonSkill6: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        "................................................",
        "........................K.......................",
        ".......................KYK.....K................",
        "........................KYK...KYK...............",
        "........................KYYK..KYGK..............",
        "........................KlYYK.KYGK..............",
        "........................KYYYYKKYGyK.............",
        ".........................KYYGyAyyyK.............",
        ".........................KYYGoAAyyK.............",
        "........................KAyNNhAAooNKK...........",
        ".......................KAAAooNBDALBYDK..........",
        ".......................KLAAABYWNNLNYNKKK.K......",
        ".......................KALAADYWNNLAAALALKNK.....",
        ".......................KLALMMNNMMLMMMLMMMLK.....",
        "......................KAALMPPPPPMPPPNNNNNPK.....",
        ".....................KLLMMPPPPPPPMMMMMMPKK......",
        "......................KKKMBBBPPBBPMPPPPK........",
        ".......................KLPKKKPBKKPPPPKK.........",
        "......................KKMKALAKKPPKKKK...........",
        ".....................KALKLLLLLPPPMMKK....KKKKKKK",
        "....................KAALMKALLMMPLLKKKKKKKvvvsssv",
        "....................KAALMKKKyKKKKKvvvsssSSSWWWSs",
        "....................KLLLKLLMyvssSSSSWWSSSssvvvqK",
        "....................KMMKLALMBWWSSSssvvqqqKKKKKK.",
        ".....................KLKMMMBDvvqqqKKKKKKKBK.....",
        ".....................KMWWBDDKyKKKKDBKLMPDDK.....",
        ".....................KPMMKKKyoYyyoDKLLMDDK......",
        ".....................KKPPBNKGYGyohDKLMBDNK......",
        "...................KKKKMPDNKyyyhhNKLMBDNK.......",
        ".................KKAAAKBNNNKyGohhDKLMDNK........",
        "...............KKAAAUUuKKKKUUUUQhKKMPBK.........",
        "..............KAAAAAQQQQQQQQQQdQKKWPBBK.........",
        "............KKAAAAALMLUUuUuUQdMK..KWKK..........",
        "...........KAAAALLPPDLAQUuUQNMBK...K............",
        "K........KKAAAAMMBBDLAAQuUQdNPBK................",
        "GK......KAAALLPBDDNDMLMUUUQdNPBK................",
        "oK....KKALALMDDNDDDKLMMQUQddNBBK................",
        "PMKKKKLLLLPBDDNDKKK.KLPlQQlYPBDK................",
        "PPMMLLLLMBDNNNKK....KLPDlYGKPBPK................",
        "KPPMPMPBDNNNKK.....KLMBKKQK.KPPPK...............",
        ".KBDBDDNNNKK......KKLPBK.K..KPPBKK..............",
        "..KKKDNKKK......KKLLPBK......KBMMMKK............",
        ".....KK........KLLLMMPMK....KLMMMPPPK...........",
        "...............KMMPPBBBK....KPPPBBBBK...........",
        "................KKPBBKK......KKBBDKK............",
        "................KWKWKWK......KWKWKWK............",
        ".................K.K.K........K.K.K............."
      ]
    },
    thunderDragonSkill7: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        ".....................K..........................",
        "....................KYK.....K...................",
        ".....................KYK...KYK..................",
        ".....................KYYK..KYGK.................",
        ".....................KlYYK.KYGK.................",
        ".....................KYYYGKKYGyK................",
        "......................KYYGyAyGyK................",
        "......................KYYGoAAyyK................",
        ".....................KAGNNhAAooNKK..............",
        "....................KAAAohNBDALBYNK.............",
        "....................KAAAABYWNNLNYNKKK.K.........",
        "....................KALALDYWNNLALALALKNK........",
        "....................KAALLMNNMMLMLMLMMMLK........",
        "...................KALMMPPPPPMPPPNNNNNPK........",
        "..................KLLMMPPPPPPPMMMMMMMKK.........",
        "...................KKKMPBBPPDBPMPPPPK...........",
        "....................KLMKKKPBKKPPPPKK............",
        "...................KLKKKLLKKMMKKKK..............",
        "....................KLAKLLLLLMLMAMK.............",
        "...................KAALPKLLLMMMLLMPK............",
        "..................KAALMBKLLLllMLMBDMK...........",
        "..................KAAMBDKLLYllPMBBNMPK..........",
        "..................KAAPDKLLLlWWlBDNMPPK..........",
        ".................KAALPKKKKyYllYGoDPMPMK.........",
        ".................KLLLKLLLPKKKKKohDPMMPPK........",
        ".................KLLMKLAMBosvvvKKKKKKKBK........",
        ".................KLMPWMMPDyWWSSSsssvvvKKKKKK....",
        ".................KMPDWPBDDovvssSSWWWSSSsssvvK...",
        ".................KPNNNKKKKKKKKKqqvvvssSSWWWSSK..",
        ".................KKKKKNBDyNhhhhKKKKKKKqqqvvssK..",
        "...............KKAAAUUUUUNNUUUUQKKMMPDKKKKKKK...",
        "..............KAAAAAQQQQQQQQQQdQKKMLPBK.........",
        "............KKAAAAALMLAUuuuUQdMK.KMPBDK.........",
        "...........KAAAALLPPDLAQUuUQNMBK..KBDK..........",
        "KK........KAAAAMMBBDLAAQuUQdNPBK.KWKWK..........",
        "YGK.....KKAALLPBDDNDMLMQUUQdNPBK..K.K...........",
        "GoK....KALALMDDNDDDKLMMlUUQdlBBK................",
        "hMPKKKKLLLMPDDNDKKK.KLMYYQdlGPDK................",
        "KPMMLLLLLPDNDNKK....KLMDYYYGMPBK................",
        ".KBMPMPPDNNNKK......KLPBKKQKMPDK................",
        "..KBBBDNNNKK........KMMDK.KKMBDK................",
        "...KKDNKKK........KKLMPDK..KPMPMKK..............",
        ".....KK..........KLLLLMPMKKLMLMPPPK.............",
        ".................KMMPPBBBKKMPPBBDBK.............",
        "..................KKPBBKK..KKBBDKK..............",
        "..................KWKWKWK..KWKWKWK..............",
        "...................K.K.K....K.K.K..............."
      ]
    },
    thunderDragonHit: {
      palette: ZAN_PALETTE,
      pixels: [
        ".............K..................................",
        "............KYK.....K...........................",
        ".............KYK...KYK..........................",
        ".............KlYK..KYGK.........................",
        ".............KYYGK.KYGK.........................",
        ".............KYYYGKKYGyK........................",
        "..............KYYGoAyGyK........................",
        "..............KYYGoAAyyK........................",
        ".............KAGGyhAAohLK.......................",
        "KK..........KAAAoNAAALLLNK......................",
        "SvK.........KAAAAANALLMLNKKKK.K.................",
        "SSvKK.......KAAAALLNMLALAAALLKNK................",
        "vSWsqK......KALLMMNPPMMLMMMMMLMK................",
        "KvSWsqK....KALLMPNPPPPPPNNNNNNMK................",
        ".KvsWsqK..KLMMMPPPPPPPPKNNNNNNK.................",
        "..KKsSSvK..KKKMPPPMPBBMMMMMMMKKKKK..............",
        "....KsSSvKK.KLMKKKBBKKPMPPPPKKAALLK.............",
        ".....KvSWsqKLMK..KKKLKPPPPKKKAAALMMK............",
        "......KvSWsqKK.KKKMLLLKKKKKKAALLMMPMK...........",
        ".......KvsWsqKKAAMLLLLLMLMLLMLMPPPMPMK..........",
        "........KqsWSvKYyLPLMLMMMLLLPBBDDBBPMMK.........",
        ".........KKsSSYGoPBLLLlllMLMPDDNKBBMLPPK........",
        "...........KvSLLMPDLLLYllPPBDNNK.KKMPBDWK.......",
        "...........KKGLALBMMLMlWWlBDNNK....KPDKK........",
        "..........KAyoMMBDPPPPYllYGyBBK.....KKWK........",
        "..........KLLMPBDDyWPPGYYyyhBBK.......K.........",
        ".........KLLPBNNBBBWBPGYGGyyoDK.................",
        ".........KMPBNDKKBBBBByGYGyhDK..................",
        "..........KBDKK.KBDBDDDoyohhDK..................",
        "...........KK....KBDDDDyGoohDK..................",
        ".................KKNDDNhhhhhNKKK................",
        "...............KKAAAUUUUUhhUUuuUK...............",
        "..............KAAAAAQQQQQQQQQQdQK...............",
        "...KK.......KKAAAAALMLUUuUuUQdMK................",
        "..KlGK.....KAAAALLPBDLAQUuUQNMBK................",
        "..KYyK....KAAAAMMBBDLAAQuUQdNPBK................",
        "..KyPK..KKLALLPBDDNDMLMUUUQdNPBK................",
        "...KMMKKALALMDDNDNDKLMMQUQddNBBK................",
        "...KMMMLLLMBNNNNKKK.KLMlQQlYPPDK................",
        "...KMPMMMBDNNNKK....KLMDlYGKMPBK................",
        "....KBBBNNNNKK......KLPBKQKKPPBK................",
        ".....KBNNKKK........KMMBKK..KPMBK...............",
        "......KKK..........KKLMPBK..KPMMMKK.............",
        "..................KLLLLMPPKKLMLMMPPK............",
        "..................KMPMPPBBKKPPPPBBBK............",
        "...................KKPBDKK..KKBDDKK.............",
        "...................KWKWKWK..KWKWKWK.............",
        "....................K.K.K....K.K.K.............."
      ]
    },
    thunderDragonSleep: {
      palette: ZAN_PALETTE,
      pixels: [
        "................................................",
        "................................................",
        "................................................",
        "................................................",
        "................................................",
        "................................................",
        "................................................",
        "..........................K.....................",
        ".........................KYK.....K..............",
        "..........................KYK...KYK.............",
        "..........................KlYK..KYGK............",
        "..........................KYYGK.KYGK............",
        "..........................KYYYGKKYGyK...........",
        "...........................KYYYyAyGyK...........",
        "...........................KYYyoAAoyK...........",
        "..........................KAGGyhAAyhAK..........",
        ".........................KAAAohAAALLLK..........",
        ".........................KAAANAAALLLLNKKKK.K....",
        ".........................KLALANNNNLALALALLKNK...",
        ".........................KALLMMPMMLMLMLMLMLMK...",
        "........................KALLMPPPPPPPPPNNNNNMK...",
        ".......................KKMMMMPWPPPPMMMMMMPKK....",
        "......................KAMKKPKWMKPBBMPMPPPK......",
        ".....................KAAAMKKLLAPKKKPPPPKK.......",
        "....................KLLLLMPKMLMPBKMKKKK.........",
        ".....................KPMMMLKPBPDBKPDNBK.........",
        ".....................KKBPMMGKKDyKoDNDK..........",
        ".....................KMKBPPMyqSsKyyDBK..........",
        ".....................KPMKDDPKqSSKohBK...........",
        ".....................KMPPKKDBKsSvKDDK...........",
        ".....................KBBBPBKDKsSvKDK............",
        "...................KKKKBPBPBKKsSvKDK............",
        ".................KKAAAKPBBDDyKvWvKK.............",
        "...............KKAAAUUuUUDDUUKvWsKK.............",
        "..............KAAAAAQQQQQQQQQKvWsKK.............",
        ".............KAAAAALMLAQuuuUQKvWsK..............",
        "...........KKAAALLPPDLAUUuUQNKqSsK..............",
        "..........KAAAALMBBDLAAQuUUdNKqSSK..............",
        ".KK......KAAAAMPDDNDMLMQUUQdNKqSSK..............",
        "KlYK...KKAALLPBDDNDKLMMlUUQdlBKsSvK.............",
        "KYoK..KLLLLPDDNNNKK.KMPYYQdlGBKsSvK.............",
        "KyMPKKALLMPDNNDKK...KMMDYYYGPBKsWvK.............",
        ".KBPMLMMBDNNNKK...KKLMPDKKdKBMKvWvK.............",
        "..KBMPPDDNNKK....KLLLLMPMKKLMLKvWsK.............",
        "...KDDNNNKK......KMMPPBBBKKMPPKvWsK.............",
        "....KKKKK.........KKPBBKK..KKBBKSqK.............",
        "..................KWKWKWK..KWKWKKK..............",
        "...................K.K.K....K.K.K..............."
      ]
    }
  });

  /**
   * --- 千年樹の根底の在来種（v1.0.3。2026-11-04） ---
   * ★ 見た目は私の下書き（作者が見て決める）。
   * 種族ごとに基本の絵を1枚描き、腕や脚の動いた姿は、その部分だけを動かして作る（描き直さないので形が崩れない）。
   */
  /** 絵の一部の範囲（x0〜x1, y0〜y1）を dx, dy だけ動かした新しい絵を返す */
  function rootsMove(rows, x0, y0, x1, y1, dx, dy) {
    var grid = rows.map(function (row) { return row.split(""); });
    var moved = [];
    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        if (grid[y][x] === ".") continue;
        moved.push({ x: x + dx, y: y + dy, c: grid[y][x] });
        grid[y][x] = ".";
      }
    }
    moved.forEach(function (p) {
      if (grid[p.y] && grid[p.y][p.x] !== undefined) grid[p.y][p.x] = p.c;
    });
    return grid.map(function (row) { return row.join(""); });
  }
  /** 絵の上に文字列を重ねた新しい絵を返す。parts は [y, x, 文字列] の並び。"." は下の絵をそのまま残す */
  function rootsPaint(rows, parts) {
    var grid = rows.map(function (row) { return row.split(""); });
    parts.forEach(function (part) {
      for (var i = 0; i < part[2].length; i++) {
        if (part[2].charAt(i) !== ".") grid[part[0]][part[1] + i] = part[2].charAt(i);
      }
    });
    return grid.map(function (row) { return row.join(""); });
  }
  /** 範囲を消した新しい絵を返す */
  function rootsErase(rows, x0, y0, x1, y1) {
    return rows.map(function (row, y) {
      if (y < y0 || y > y1) return row;
      return row.substring(0, x0) + new Array(x1 - x0 + 2).join(".") + row.substring(x1 + 1);
    });
  }
  /** 色を一部だけ変えた色の表を返す */
  function rootsTint(palette, changes) {
    var result = {};
    for (var key in palette) result[key] = palette[key];
    for (var change in changes) result[change] = changes[change];
    return result;
  }

  // ウェポン：鉄と真鍮の機械。胸に炉、片目の光。左手に大剣、右手に大斧（作者の指定で武器を大きくした。48マス。2026-11-05）。
  // 刃の欠けは図鑑の「不完全な箇所は多い」から。
  var WEAPON_PALETTE = {
    ".": null,
    "K": "#14161e",   // 輪郭
    "I": "#4a5262",   // 鉄
    "i": "#7c8698",   // 鉄（光の当たるところ）
    "J": "#2e3442",   // 鉄の影
    "B": "#c49a3a",   // 真鍮
    "b": "#8a6a24",   // 真鍮の影
    "y": "#ecca6a",   // 真鍮の光
    "h": "#5a3c1c",   // 柄
    "E": "#ff8a2a",   // 炉と目の光
    "e": "#ffd060",   // 炉と目の芯
    "R": "#d2561c",   // 炉の奥
    "W": "#eaf2fa",   // 刃（光る刃先）
    "v": "#c6d2e0",   // 刃
    "w": "#9aa8ba",   // 刃の影
    "l": "#7a8898"    // 剣の溝
  };
  var WEAPON_GLOW = rootsTint(WEAPON_PALETTE, { "E": "#ffb04a", "e": "#fff0a0", "R": "#ff8a2a" });
  var WEAPON_DARK = rootsTint(WEAPON_PALETTE, { "E": "#4a2a18", "e": "#5a3418", "R": "#3a2014" });
  // 1行は 左腕と大剣（16マス）＋ 頭・胴・脚（16マス）＋ 右腕と大斧（16マス）
  var WEAPON_ROWS = [
    "................................................",
    "................................................",
    "................................................",
    ".....K............................KKKKK.........",
    "....KWK..........................KWWWvvKK.......",
    "...KWvwK.........................KWWvvvwwKKKKKK.",
    "..KWWlvwK.......................KWWvvwwwK.KybhK.",
    ".KWWvlvwwK......................KWWvvwwIKKKybhK.",
    ".KWWvlvwwK......................KWWvvwwIbBKybhK.",
    ".KWWvlvwwK.......................KWvvwwIbbKybhK.",
    ".KWWvlvwwK......................KWWvvwwKbbKybhK.",
    "..KWvlvwwK........KKKKKKKKKKKK..KWWvvwwKbbKybhK.",
    ".KWWvlvwwK.......KIiiiiiiiiiiIK.KWWvvwwIbbKybhK.",
    ".KWWvlvwwK.......KIiJJJJJJJJiIK.KWWvvwwIbBKybhK.",
    ".KWWvlvwwK.......KIiJEEEEEEJiIK.KWWvvwwIKKKybhK.",
    ".KWWvlvwK........KIiJEEeeEEJiIK.KWWvvwwwK.KybhK.",
    ".KWWvlvwwK.......KIiJEEEEEEJiIK..KWWvvvwwKKybhK.",
    ".KWWvlvwwK.......KIiJJJJJJJJiIK..KWWWvvKK.KybhK.",
    ".KWWvlvwwK.......KIIiiiiiiiiIIK...KKKKK...KybhK.",
    "KKKKKKKKKKK......KKKKKKKKKKKKKK...........KybhK.",
    "KyBBBBBBBbK.....KyyBBBBBBBBBBbbK..........KBBbK.",
    "KKKKKKKKKKK.....KBbIIIIIIIIIIbBK..........KybhK.",
    "...KbhbK........KBIKKKKKKKKKKIBK..........KybhK.",
    "...KbhbK........KBIKREEEEEERKIBK..........KybhK.",
    ".KKKKKKKKKKKKKKKKBIKEEeeeeEEKIBKKKKKKKKKKKKKKKK.",
    ".KiiiiiiIbyiiiyBKBIKEeeeeeeEKIBKByiiiybIiiiiiiK.",
    ".KIKIKIKIbBIIIBbKBIKEeeeeeeEKIBKbBIIIBbIKIKIKIK.",
    ".KIIIIIIJbbJJJbbKBIKEEeeeeEEKIBKbbJJJbbJIIIIIIK.",
    ".KKKKKKKKKKKKKKKKBIKREEEEEERKIBKKKKKKKKKKKKKKKK.",
    "...KbBbK........KBIKKKKKKKKKKIBK..........KbBbK.",
    "....KKK.........KBbIIIIIIIIIIbBK...........KKK..",
    "................KyBBBBBBBBBBBBbK................",
    ".................KKKKKKKKKKKKKK.................",
    ".................KIIIK....KIIIK.................",
    "................KIiiiK....KiiiIK................",
    "................KIiiiK....KiiiIK................",
    "................KIiiiK....KiiiIK................",
    "................KyBBbK....KyBBbK................",
    "................KBBbbK....KBBbbK................",
    "................KIIJJK....KJJIIK................",
    "................KIIJJK....KJJIIK................",
    "...............KIIIIIK....KIIIIIK...............",
    "...............KIiiIIK....KIIiiIK...............",
    "..............KIIiiIIK....KIIiiIIK..............",
    "..............KiiiiIIK....KIIiiiiK..............",
    "..............KIIIIJJK....KJJIIIIK..............",
    "..............KKKKKKKK....KKKKKKKK..............",
    "................................................"
  ];
  function weaponArms(dyL, dyR) {
    return rootsMove(rootsMove(WEAPON_ROWS, 0, 3, 15, 30, 0, dyL), 32, 3, 47, 30, 0, dyR);
  }
  var WEAPON_RAISE = weaponArms(-3, -3);
  /**
   * 武器を上下さかさまにして、手の下へ振り下ろした絵にする。
   * 手より上の武器（y0〜y1）を sum - y の行へ移し、柄の端は手の上へ出す
   */
  function weaponSwing(x0, x1, y0, y1, sum, gripX, extra) {
    var rows = rootsErase(rootsErase(WEAPON_ROWS, x0, 3, x1, 23), x0, 29, x1, 30);
    var parts = [[22, gripX + 1, "KKK"], [23, gripX, "KbBbK"]];
    for (var y = y0; y <= y1; y++) parts.push([sum - y, x0, WEAPON_ROWS[y].substring(x0, x1 + 1)]);
    return rootsPaint(rows, parts.concat(extra || []));
  }

  // コハクカブト：背に大きな琥珀を負い、中に古い影が透ける。脚は6本
  var BEETLE_PALETTE = {
    ".": null,
    "K": "#241206",   // 輪郭
    "A": "#e8a030",   // 琥珀
    "a": "#c47818",   // 琥珀の影
    "D": "#7a4410",   // 琥珀のいちばん暗いところ
    "H": "#ffd884",   // 琥珀の光
    "W": "#fff4cc",   // 照り
    "i": "#6a3a0c",   // 琥珀の中の影
    "B": "#3e2410",   // 甲虫の体
    "b": "#6a4420",   // 甲虫の体（光）
    "L": "#2e1a08",   // 脚
    "E": "#ffe060"    // 目
  };
  var BEETLE_GLOW = rootsTint(BEETLE_PALETTE, { "A": "#f0aa38", "i": "#c86a14" });
  var BEETLE_ROWS = [
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
    "..............KKKK..............",
    ".............KBbbK..............",
    "..............KbK...............",
    "...........KKKKbKKKKK...........",
    ".........KKHHHAAAAAAaKK.........",
    "........KHHWHAAAAAAAAaaK........",
    ".......KHWHAAAAAAAAAAAaaK.......",
    ".......KHHAAAiiAAAiiAAAaaK......",
    "......KHHAAAAiiiiiiiAAAAaaK.....",
    "......KHAAAAAAiiiiiAAAAAAaK.....",
    "..KK..KAAAAAAAAiiiAAAAAAAaK..KK.",
    "...KLKKaAAAAAAAAAAAAAAAAaaKKLK..",
    "....KLKKDaaaaaaaaaaaaaaaDKKLK...",
    ".....KLKKKKKKKKKKKKKKKKKKLK.....",
    "......KBbEEbbbbbbbbbbEEbBK......",
    "....KLKKBbbbbbbbbbbbbbbbbBKKLK..",
    "...KLK...KKBBBBBBBBBBKK...KLK...",
    "..KLK.....KKKKKKKKKKKK.....KLK..",
    "..KK........................KK..",
    "................................",
    "................................"
  ];
  function beetleLegs(dyL, dyR) {
    return rootsMove(rootsMove(BEETLE_ROWS, 0, 21, 5, 29, 0, dyL), 27, 21, 31, 29, 0, dyR);
  }

  // ジュエキスライム（id は sapSlime）：琥珀色の樹液が固まったもの。頭のしずくと、下へ垂れる樹液
  var SAP_PALETTE = {
    ".": null,
    "K": "#4a2408",   // 輪郭
    "S": "#e8a838",   // 樹液
    "s": "#c87e1a",   // 樹液の影
    "D": "#8a4c10",   // 樹液のいちばん暗いところ
    "H": "#ffdc88",   // 光
    "W": "#fff6d0",   // 照り
    "E": "#2a1406",   // 目
    "M": "#6a2c08"    // 口
  };
  var SAP_ROWS = [
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
    "...............KK...............",
    "..............KHSK..............",
    "..............KHSK..............",
    ".............KHSSSK.............",
    "...........KKKHSSSSKKK..........",
    ".........KKHWHSSSSSSSsKK........",
    "........KHWHSSSSSSSSSSSsK.......",
    ".......KHHSSSSSSSSSSSSSSssK.....",
    ".......KHSSSEESSSSSEESSSSsK.....",
    "......KHSSSSEESSSSSEESSSSssK....",
    "......KSSSSSSSSMMMSSSSSSSssK....",
    ".....KSSSSSSSSSSSSSSSSSSSSssK...",
    ".....KsSSSSSSSSSSSSSSSSSSSsDK...",
    "....KKsSSsDSSSSsDSSSSsDSSssDKK..",
    "....KDDsDDKKsDDKKKsDDKKDDsDDK...",
    ".....KKKK..KKK....KKK..KKKK.....",
    "...........K........K...........",
    "................................",
    "................................"
  ];

  // ジュエル：宝石の体に棲む小さな魔族。小さな角と手。人を見ると逃げる
  var JEWEL_PALETTE = {
    ".": null,
    "K": "#141030",   // 輪郭
    "Q": "#3a2a5a",   // 角
    "q": "#5a4480",   // 手
    "G": "#7fe8e0",   // 宝石
    "g": "#2fb0c8",   // 宝石の影
    "D": "#1c6a8a",   // 宝石のいちばん暗いところ
    "W": "#f2ffff",   // きらめき
    "E": "#ff3a6a",   // 目
    "e": "#7a1030"    // 目の奥
  };
  var JEWEL_ROWS = [
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "...........KQK......KQK.........",
    "...........KQQK....KQQK.........",
    "............KQKKKKKKQK..........",
    "...........KWWGGGGGGgK..........",
    "..........KWWGGGGGGGggK.........",
    ".........KWWGGGGGGGGGggK........",
    "........KWGGGGGGGGGGGGggK.......",
    ".......KWGGGEEGGGGEEGGGggK......",
    "......KWGGGGEeGGGGEeGGGGggK.....",
    ".....KWGGGGGGGGGGGGGGGGGGggK....",
    ".....KDDDDDDDDDDDDDDDDDDDDDK....",
    "...KqqKgGGGGGGGGGGGGGGGGgDKqqK..",
    "....KqK.KgGGGGGGGGGGGGGGgDK.KqK.",
    ".........KgGGGGGGGGGGGGgDK......",
    "..........KgGGGGGGGGGGgDK.......",
    "...........KgGGGGGGGGgDK........",
    "............KgGGGGGGgDK.........",
    ".............KgGGGGgDK..........",
    "..............KgGGgDK...........",
    "...............KgDK.............",
    "................KK..............",
    "................................",
    "................................",
    "................................",
    "................................"
  ];
  function jewelArms(dyL, dyR) {
    var left = rootsMove(rootsMove(JEWEL_ROWS, 0, 18, 5, 19, 0, dyL), 6, 19, 6, 19, 0, dyL);
    return rootsMove(left, 27, 18, 31, 19, 0, dyR);
  }

  NS.extend("sprites", {
    weaponBot:      { palette: WEAPON_PALETTE, pixels: WEAPON_ROWS },
    weaponBotGlow:  { palette: WEAPON_GLOW,    pixels: WEAPON_ROWS },
    weaponBotArmL:  { palette: WEAPON_PALETTE, pixels: weaponArms(2, 0) },
    weaponBotArmR:  { palette: WEAPON_PALETTE, pixels: weaponArms(0, 2) },
    weaponBotRaise: { palette: WEAPON_PALETTE, pixels: WEAPON_RAISE },
    weaponBotCharge:{ palette: WEAPON_GLOW,    pixels: WEAPON_RAISE },
    // 左の大剣を振り下ろす
    weaponBotSwingL: { palette: WEAPON_GLOW, pixels: weaponSwing(0, 15, 3, 21, 50, 3) },
    // 右の大斧を振り下ろす
    weaponBotSwingR: { palette: WEAPON_GLOW, pixels: weaponSwing(32, 47, 3, 18, 49, 42, [
      [29, 42, "KybhK"], [30, 42, "KybhK"]
    ]) },
    weaponBotStepL: { palette: WEAPON_PALETTE, pixels: rootsMove(WEAPON_ROWS, 14, 33, 21, 46, 0, -3) },
    weaponBotStepR: { palette: WEAPON_PALETTE, pixels: rootsMove(WEAPON_ROWS, 26, 33, 33, 46, 0, -3) },
    // 被弾：目が割れ、腕が下がる
    weaponBotHit:   { palette: WEAPON_PALETTE, pixels: rootsPaint(weaponArms(3, 3), [
      [14, 21, "EKEEKE"], [15, 21, "EEKKEE"], [16, 21, "EKEEKE"]
    ]) },
    // 眠り：光が消え、腕が下がったまま
    weaponBotSleep: { palette: WEAPON_DARK,    pixels: weaponArms(3, 3) },

    amberBeetle:     { palette: BEETLE_PALETTE, pixels: BEETLE_ROWS },
    amberBeetleGlow: { palette: BEETLE_GLOW,    pixels: BEETLE_ROWS },
    amberBeetleLegL: { palette: BEETLE_PALETTE, pixels: beetleLegs(-1, 0) },
    amberBeetleLegR: { palette: BEETLE_PALETTE, pixels: beetleLegs(0, -1) },
    // 脚を上げて構える
    amberBeetleRear: { palette: BEETLE_GLOW,    pixels: beetleLegs(-2, -2) },
    amberBeetleHit:  { palette: BEETLE_PALETTE, pixels: rootsPaint(beetleLegs(-1, -1), [[25, 9, "KK"], [25, 21, "KK"]]) },
    amberBeetleSleep:{ palette: BEETLE_PALETTE, pixels: rootsPaint(BEETLE_ROWS, [[25, 9, "KK"], [25, 21, "KK"]]) },

    sapSlime:      { palette: SAP_PALETTE, pixels: SAP_ROWS },
    // 垂れた樹液が伸びる（左・右）
    sapSlimeDripA: { palette: SAP_PALETTE, pixels: rootsPaint(SAP_ROWS, [[30, 11, "K"]]) },
    sapSlimeDripB: { palette: SAP_PALETTE, pixels: rootsPaint(SAP_ROWS, [[30, 20, "K"]]) },
    // 体から腕のように樹液を伸ばす（技）
    sapSlimeUp: { palette: SAP_PALETTE, pixels: rootsPaint(SAP_ROWS, [
      [17, 6, "KHK"], [18, 5, "KHSK"], [19, 6, "KSKK"],
      [17, 24, "KSK"], [18, 24, "KSsK"], [19, 23, "KKsK"]
    ]) },
    // 体を左右へ広げる（攻撃）
    sapSlimeWide: { palette: SAP_PALETTE, pixels: rootsPaint(SAP_ROWS, [
      [21, 2, "KKKKK"], [22, 2, "KHSSK"], [23, 2, "KKKKK"],
      [21, 27, "KKKK"], [22, 27, "KSsK"], [23, 27, "KKKK"]
    ]) },
    sapSlimeHit:   { palette: SAP_PALETTE, pixels: rootsPaint(SAP_ROWS, [[21, 12, "KS"], [21, 19, "SK"], [22, 12, "SK"], [22, 19, "KS"]]) },
    sapSlimeSleep: { palette: SAP_PALETTE, pixels: rootsPaint(SAP_ROWS, [[21, 12, "SS"], [21, 19, "SS"], [22, 12, "KK"], [22, 19, "KK"]]) },

    jewelOre:      { palette: JEWEL_PALETTE, pixels: JEWEL_ROWS },
    // きらめきの位置が変わる
    jewelOreShine: { palette: rootsTint(JEWEL_PALETTE, { "G": "#a0f4ec" }),
                     pixels: rootsPaint(JEWEL_ROWS, [[12, 18, "W"], [16, 11, "WW"], [21, 14, "W"]]) },
    jewelOreArmL:  { palette: JEWEL_PALETTE, pixels: jewelArms(-1, 0) },
    jewelOreArmR:  { palette: JEWEL_PALETTE, pixels: jewelArms(0, -1) },
    jewelOreUp:    { palette: JEWEL_PALETTE, pixels: jewelArms(-3, -3) },
    jewelOreHit:   { palette: JEWEL_PALETTE, pixels: rootsPaint(jewelArms(1, 1), [[14, 12, "KG"], [14, 18, "GK"], [15, 12, "GK"], [15, 18, "KG"]]) },
    jewelOreSleep: { palette: JEWEL_PALETTE, pixels: rootsPaint(jewelArms(1, 1), [[14, 12, "GG"], [14, 18, "GG"], [15, 12, "KK"], [15, 18, "KK"]]) }
  });
})(window.MyGame);
