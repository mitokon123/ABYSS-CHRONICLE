/**
 * sprites_icons.js
 * 属性・状態異常・ステータス（バフ／デバフ）の小さな絵。
 *
 * どれも 16×16。文字の隣に 12〜16px で出すので、
 * 細かい模様は入れず「色と形」で見分けられることを優先している。
 *
 *   iconElem〇〇   … 属性（data/elements.js の icon から指す）
 *   iconStatus〇〇 … 状態異常（data/statuses.js の icon から指す）
 *   iconStat〇〇   … ステータス。バフ／デバフの印に使う（data/ui.js の icons.stats から指す）
 *   iconArrowUp / iconArrowDown … ステータスの絵の右下に重ねる矢印（上がった／下がった）
 *   iconItem〇〇   … アイテム（data/items.js の icon から指す）
 *
 * 書き方（パレット・pixels）は data/sprites.js を参照。
 * 光は左上から。K が輪郭、H が光、D が影。
 */
(function (NS) {
  "use strict";

  NS.extend("sprites", {

    // ================= 属性 =================

    // 火：ゆらめく炎。芯が黄色く、外へ行くほど赤い
    iconElemFire: {
      palette: { ".": null, "K": "#5a1a08", "R": "#e8542a", "O": "#ff9a3c", "Y": "#ffe27a" },
      pixels: [
        "................",
        ".......K........",
        "......KRK.......",
        "......KRK...K...",
        ".....KRRK..KRK..",
        ".....KRRRK.KRK..",
        "....KRROORKRRK..",
        "....KROOYORRRK..",
        "...KRROYYYORRK..",
        "...KROOYYYOORK..",
        "...KROYYYYYORK..",
        "...KROOYYYOORK..",
        "....KROOOOORK...",
        ".....KRRRRRK....",
        "......KKKKK.....",
        "................"
      ]
    },

    // 水：しずく。左上に光の点
    iconElemWater: {
      palette: { ".": null, "K": "#123a6a", "B": "#4fb0d1", "D": "#2a78b8", "H": "#d8f4ff" },
      pixels: [
        "................",
        ".......K........",
        ".......K........",
        "......KBK.......",
        "......KBK.......",
        ".....KBBBK......",
        ".....KBBBK......",
        "....KHBBBBK.....",
        "....KHBBBBDK....",
        "...KBBBBBBDDK...",
        "...KBBBBBBDDK...",
        "...KBBBBBDDDK...",
        "....KBBBDDDK....",
        ".....KBDDDK.....",
        "......KKKK......",
        "................"
      ]
    },

    // 風：巻いた風の筋（渦）
    iconElemWind: {
      palette: { ".": null, "K": "#1e5a3a", "G": "#7fe0a8", "H": "#d6fff0" },
      pixels: [
        "................",
        "................",
        "......KKKKK.....",
        "....KKGGHGGKK...",
        "...KGGKKKKKGGK..",
        "...KGK.....KGK..",
        "..KGK...KKK.KGK.",
        "..KGK..KGHGK.KK.",
        "..KGK..KGK.K....",
        "..KGK..KGK......",
        "...KGK.KGGK.....",
        "...KGGK.KGGK....",
        "....KGGKKKGK....",
        ".....KKGGGK.....",
        ".......KKK......",
        "................"
      ]
    },

    // 地：角ばった岩
    iconElemEarth: {
      palette: { ".": null, "K": "#3a2a14", "A": "#a8804a", "D": "#7a5a30", "H": "#d8b478" },
      pixels: [
        "................",
        "................",
        "........KK......",
        ".......KHAK.....",
        "......KHAAAK....",
        ".....KHAAAADK...",
        "....KHAAAAADK...",
        "...KHAAAAAADDK..",
        "...KAAAAAADDDK..",
        "..KAAAAAADDDDK..",
        "..KAAAAADDDDDK..",
        "..KAAAADDDDDDK..",
        "..KAAADDDDDDDK..",
        "..KKKKKKKKKKKK..",
        "................",
        "................"
      ]
    },

    // 雷：いなずま
    iconElemThunder: {
      palette: { ".": null, "K": "#5a4a08", "Y": "#ffe25e", "H": "#fff8c8" },
      pixels: [
        "................",
        "........KKKK....",
        ".......KHYYK....",
        "......KHYYK.....",
        "......KYYYK.....",
        ".....KHYYK......",
        ".....KYYYKKK....",
        "....KHYYYYYYK...",
        "....KKKKKYYK....",
        "........KYYK....",
        ".......KYYK.....",
        ".......KYK......",
        "......KYK.......",
        "......KK........",
        ".....K..........",
        "................"
      ]
    },

    // 光：輝く星
    iconElemLight: {
      palette: { ".": null, "K": "#6a5a10", "Y": "#ffe9a0", "H": "#ffffff" },
      pixels: [
        "................",
        ".......KK.......",
        ".......KYK......",
        ".......KYK......",
        "...K...KYK...K..",
        "...KK.KHYYK.KK..",
        "....KKKHYYKKK...",
        ".....KHHYYYK....",
        ".....KYYYYYK....",
        "....KKKYYYKKK...",
        "...KK.KYYYK.KK..",
        "...K...KYK...K..",
        ".......KYK......",
        ".......KYK......",
        ".......KK.......",
        "................"
      ]
    },

    // 闇：三日月
    iconElemDark: {
      palette: { ".": null, "K": "#1a0e2c", "P": "#8a5fb0", "D": "#5a3a80", "H": "#d0b0ff" },
      pixels: [
        "................",
        "................",
        ".......KKKK.....",
        ".....KKHPPPK....",
        "....KHPPKKKK....",
        "...KHPPK........",
        "...KPPK.........",
        "..KPPK..........",
        "..KPPK..........",
        "..KPPDK.........",
        "...KPDDK........",
        "...KDDDDK.......",
        "....KDDDDKKKK...",
        ".....KKDDDDDK...",
        ".......KKKKK....",
        "................"
      ]
    },

    // ================= 状態異常 =================

    // 毒：紫の泡が立つしずく
    iconStatusPoison: {
      palette: { ".": null, "K": "#2c1440", "P": "#9a5fd1", "D": "#6a3a9a", "H": "#e0c0ff", "G": "#7fd06a" },
      pixels: [
        "................",
        "...KK...........",
        "..KGGK..K.......",
        "..KGGK.KGK......",
        "...KK...K.......",
        "......KK........",
        ".....KPPK.......",
        "....KHPPPK......",
        "....KHPPPDK.....",
        "...KPPPPPDDK....",
        "...KPPPPPDDK....",
        "...KPPPPDDDK....",
        "....KPPDDDK.....",
        ".....KDDDK......",
        "......KKK.......",
        "................"
      ]
    },

    // 麻痺：ぐるぐる回る星（目を回している）
    iconStatusParalysis: {
      palette: { ".": null, "K": "#5a4a08", "Y": "#ffd75e", "H": "#fff4c0" },
      pixels: [
        "................",
        "......K.........",
        ".....KYK....KK..",
        "...KKKYKKK.KYK..",
        "...KHYYYYK.KK...",
        "....KYYYK.......",
        "...KYYKYYK......",
        "...KK...KK......",
        "..........K.....",
        ".........KYK....",
        ".KK....KKKYKKK..",
        "KYK....KHYYYYK..",
        ".KK.....KYYYK...",
        ".......KYYKYYK..",
        ".......KK...KK..",
        "................"
      ]
    },

    // 眠り：Z が3つ
    iconStatusSleep: {
      palette: { ".": null, "K": "#1a2a5a", "B": "#8fb0ff", "H": "#e0ecff" },
      pixels: [
        "................",
        "........KKKKKK..",
        "........KHBBBK..",
        "........KKKBBK..",
        "..........KBK...",
        ".........KBK....",
        "........KBBKKK..",
        "........KBBBBK..",
        "...KKKKKKKKKKK..",
        "...KHBBBK.......",
        "...KKKBBK.......",
        ".....KBK........",
        "....KBK.........",
        "...KBBKKK.......",
        "...KBBBBK.......",
        "...KKKKKK......."
      ]
    },

    // 封印：錠前
    iconStatusSeal: {
      palette: { ".": null, "K": "#2a2a30", "S": "#9a9aa8", "D": "#5a5a68", "Y": "#d8b048", "H": "#e8e8f0" },
      pixels: [
        "................",
        ".....KKKKK......",
        "....KSHHHSK.....",
        "...KSK...KSK....",
        "...KSK...KSK....",
        "...KSK...KSK....",
        "..KKKKKKKKKKK...",
        "..KYYYYYYYYYK...",
        "..KYYYYKYYYYK...",
        "..KYYYKDKYYYK...",
        "..KYYYYKYYYYK...",
        "..KYYYYKYYYYK...",
        "..KYYYYYYYYYK...",
        "..KDDDDDDDDDK...",
        "..KKKKKKKKKKK...",
        "................"
      ]
    },

    // 盲目：閉じた目（まつげ付き）
    iconStatusBlind: {
      palette: { ".": null, "K": "#3a3a48", "S": "#b0b0c0" },
      pixels: [
        "................",
        "................",
        "................",
        "................",
        "................",
        "..KK........KK..",
        "...KK......KK...",
        "....KKK..KKK....",
        "......KKKK......",
        "....KSKKKKSK....",
        "...KS.K..K.SK...",
        "...K..KS.SK..K..",
        "......K..K......",
        "................",
        "................",
        "................"
      ]
    },

    // 呪い：紫の炎のような影
    iconStatusCurse: {
      palette: { ".": null, "K": "#1a0a2a", "P": "#7a3aa8", "D": "#4a1a70", "H": "#c080ff" },
      pixels: [
        "................",
        "........K.......",
        ".......KPK......",
        "...K...KPK..K...",
        "..KPK.KHPPK.KPK.",
        "..KPK.KHPPPKKPK.",
        "..KPPKKPPPPPPPK.",
        "..KPPPPPPDDPPPK.",
        "...KPPPKDDDKPK..",
        "...KPPKDKDDKPK..",
        "...KPPKDDDDKPK..",
        "....KPPKDDKPK...",
        "....KPPPKKPPK...",
        ".....KPPPPPK....",
        "......KKKKK.....",
        "................"
      ]
    },

    // 即死：どくろ
    iconStatusInstantDeath: {
      palette: { ".": null, "K": "#101018", "W": "#e8e8f0", "D": "#a0a0b0" },
      pixels: [
        "................",
        ".....KKKKKK.....",
        "....KWWWWWWK....",
        "...KWWWWWWWWK...",
        "...KWWWWWWWWK...",
        "...KWKKWWKKWK...",
        "...KKKKWWKKKK...",
        "...KWKKWWKKWK...",
        "...KWWWWWWWWK...",
        "....KWWKKWWK....",
        ".....KKWWKK.....",
        ".....KWKKWK.....",
        ".....KDKKDK.....",
        ".....KKKKKK.....",
        "................",
        "................"
      ]
    },

    // ================= ステータス（バフ／デバフの印） =================

    // HP：ハート
    iconStatHp: {
      palette: { ".": null, "K": "#5a1020", "R": "#e8425a", "H": "#ffb0c0" },
      pixels: [
        "................",
        "................",
        "...KKK...KKK....",
        "..KHRRK.KRRRK...",
        ".KHRRRRKRRRRRK..",
        ".KRRRRRRRRRRRK..",
        ".KRRRRRRRRRRRK..",
        ".KRRRRRRRRRRRK..",
        "..KRRRRRRRRRK...",
        "...KRRRRRRRK....",
        "....KRRRRRK.....",
        ".....KRRRK......",
        "......KRK.......",
        ".......K........",
        "................",
        "................"
      ]
    },

    // 攻撃：剣
    iconStatAttack: {
      palette: { ".": null, "K": "#2a2a30", "S": "#c8ccd8", "H": "#ffffff", "B": "#8a5a2e", "Y": "#d8b048" },
      pixels: [
        "................",
        "...........KK...",
        "..........KHSK..",
        ".........KHSSK..",
        "........KHSSK...",
        ".......KHSSK....",
        "......KHSSK.....",
        ".....KHSSK......",
        "..K.KHSSK.......",
        "..KKKSSK........",
        "..KYYYK.........",
        ".KBKYYYK........",
        "KBBK.KKK........",
        ".KBK............",
        "..K.............",
        "................"
      ]
    },

    // 防御：盾
    iconStatDefense: {
      palette: { ".": null, "K": "#12305a", "B": "#4f80d1", "D": "#2a5aa0", "H": "#c0dcff" },
      pixels: [
        "................",
        "...KKKKKKKKK....",
        "..KHBBBBBBBBK...",
        "..KHBBBBBBBDK...",
        "..KHBBBKBBBDK...",
        "..KHBBKHKBBDK...",
        "..KBBBKHKBDDK...",
        "..KBBBBKBBDDK...",
        "..KBBBBBBBDDK...",
        "...KBBBBBDDK....",
        "...KBBBBDDDK....",
        "....KBBBDDK.....",
        ".....KBDDK......",
        "......KDK.......",
        ".......K........",
        "................"
      ]
    },

    // 素早さ：羽根
    iconStatSpeed: {
      palette: { ".": null, "K": "#1a4a5a", "C": "#7fd9e8", "H": "#e0fbff", "D": "#3a90a8" },
      pixels: [
        "................",
        "...........KK...",
        "..........KHCK..",
        ".........KHCCK..",
        "........KHCCDK..",
        ".......KHCCDK...",
        "......KHCCDDK...",
        ".....KHCCDDK....",
        "....KHCCDDK.....",
        "....KCCDDK......",
        "...KCCDDK.......",
        "...KCDDK........",
        "..KDDKK.........",
        "..KKK...........",
        ".K..............",
        "................"
      ]
    },

    // PP：光る玉
    iconStatPp: {
      palette: { ".": null, "K": "#2a1a5a", "P": "#8f7fe8", "D": "#5a48b0", "H": "#e8e0ff" },
      pixels: [
        "................",
        "................",
        ".....KKKKKK.....",
        "....KHHPPPPK....",
        "...KHHPPPPPPK...",
        "...KHPPPPPPDK...",
        "..KHPPPPPPPDDK..",
        "..KPPPPPPPPDDK..",
        "..KPPPPPPPDDDK..",
        "..KPPPPPPDDDDK..",
        "...KPPPPDDDDK...",
        "...KPPPDDDDDK...",
        "....KPDDDDDK....",
        ".....KKKKKK.....",
        "................",
        "................"
      ]
    },

    // 与ダメージ・被ダメージ（「効」）：はじける印
    iconStatOther: {
      palette: { ".": null, "K": "#5a3a08", "Y": "#ffd75e", "H": "#fff4c0", "O": "#ff9a3c" },
      pixels: [
        "................",
        ".......K........",
        "..K...KYK...K...",
        "..KK..KYK..KK...",
        "...KK.KYK.KK....",
        "....KKKHKKK.....",
        "..KKKHHHHHKKK...",
        ".KYYYHHOHHYYYK..",
        "..KKKHHHHHKKK...",
        "....KKKOKKK.....",
        "...KK.KOK.KK....",
        "..KK..KOK..KK...",
        "..K...KOK...K...",
        ".......K........",
        "................",
        "................"
      ]
    },

    // 矢印。ステータスの絵の右下に重ねる（上がった＝緑、下がった＝赤）
    iconArrowUp: {
      palette: { ".": null, "K": "#0a2a14", "G": "#5fd18c" },
      pixels: [
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "............K...",
        "...........KGK..",
        "..........KGGGK.",
        ".........KGGGGGK",
        ".........KKKGKKK",
        "...........KGK..",
        "...........KGK..",
        "...........KKK.."
      ]
    },

    iconArrowDown: {
      palette: { ".": null, "K": "#3a0a0a", "R": "#e8542a" },
      pixels: [
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "...........KKK..",
        "...........KRK..",
        "...........KRK..",
        ".........KKKRKKK",
        ".........KRRRRRK",
        "..........KRRRK.",
        "...........KRK..",
        "............K..."
      ]
    },

    // ================= 愛情度の段階（data/affection.js の stages の icon） =================
    // 慣れ＝輪郭だけのハート、信頼＝桃色で満ちたハート、絆＝金に輝くハート。出会いには印を出さない

    iconAffectionUsed: {
      palette: { ".": null, "K": "#4a1a2a", "P": "#f5a3c0" },
      pixels: [
        "................",
        "...KKK....KKK...",
        "..KPPPK..KPPPK..",
        ".KP...PKKP...PK.",
        "KP.....PP.....PK",
        "KP............PK",
        "KP............PK",
        ".KP..........PK.",
        "..KP........PK..",
        "...KP......PK...",
        "....KP....PK....",
        ".....KP..PK.....",
        "......KPPK......",
        ".......KK.......",
        "................",
        "................"
      ]
    },

    iconAffectionTrust: {
      palette: { ".": null, "K": "#4a1a2a", "P": "#f06090", "H": "#ffb0c8", "W": "#ffffff", "D": "#b03060" },
      pixels: [
        "................",
        "...KKK....KKK...",
        "..KHHPK..KPPPK..",
        ".KHWPPPKKPPPPPK.",
        "KHHPPPPPPPPPPPPK",
        "KHPPPPPPPPPPPPPK",
        "KPPPPPPPPPPPPPDK",
        ".KPPPPPPPPPPPDK.",
        "..KPPPPPPPPPDK..",
        "...KPPPPPPPDK...",
        "....KPPPPPDK....",
        ".....KPPPDK.....",
        "......KPDK......",
        ".......KK.......",
        "................",
        "................"
      ]
    },

    iconAffectionBond: {
      palette: { ".": null, "K": "#4a2a08", "P": "#ffcf4a", "H": "#fff2b0", "W": "#ffffff",
                 "D": "#c08a1e", "S": "#fff6c8" },
      pixels: [
        "..............S.",
        "...KKK....KKK.S.",
        "..KHHPK..KPPPK..",
        ".KHWPPPKKPPPPPK.",
        "KHHPPPPPPPPPPPPK",
        "KHPPPPPPPPPPPPPK",
        "KPPPPPPPPPPPPPDK",
        ".KPPPPPPPPPPPDK.",
        "..KPPPPPPPPPDK..",
        "...KPPPPPPPDK...",
        "....KPPPPPDK....",
        ".....KPPPDK.....",
        "......KPDK......",
        ".......KK.......",
        ".S..............",
        "................"
      ]
    },

    // ================= 仲間にしたことのある種族（v1.0.3） =================
    // 戦闘で、敵の状態表示の右上に出す（BattleScene._renderMember）。図鑑の「仲間」と同じ意味。
    // 愛情度のハートと見分けがつくよう、空色の丸に白い印
    iconCaught: {
      palette: { ".": null, "K": "#0e2a3a", "B": "#4ab8e8", "H": "#a8e4ff", "D": "#2a7aa8", "W": "#ffffff" },
      pixels: [
        "................",
        ".....KKKKKK.....",
        "...KKHHBBBBKK...",
        "..KHHBBBBBBBDK..",
        "..KHBBBBBBBWDK..",
        ".KHBBBBBBBWWBDK.",
        ".KHBBBBBBWWBBDK.",
        ".KBBWBBBWWBBBDK.",
        ".KBBWWBWWBBBBDK.",
        ".KBBBWWWBBBBBDK.",
        "..KBBBWBBBBBDK..",
        "..KDBBBBBBBDDK..",
        "...KKDDDDDDKK...",
        ".....KKKKKK.....",
        "................",
        "................"
      ]
    },

    // ================= アイテム =================
    // 一覧で名前の左に出す（data/items.js の icon から指す）。
    // 同じ回復でも、HP は赤、PP は青、毒消しは青緑の葉、と色で分ける

    // 薬草：3枚葉の小枝。明るい黄緑
    iconItemHerb: {
      palette: { ".": null, "K": "#1e3a14", "L": "#a8e870", "G": "#5ab83a", "D": "#2e7a24", "S": "#7a9a3a" },
      pixels: [
        "................",
        "......KKK.......",
        ".....KLLGK......",
        ".....KLGGK......",
        ".KKK.KLGDK.KKK..",
        "KLLGKKGGDKKGGGK.",
        "KLGGGKKGDKGGGDK.",
        ".KGGGDKSKKGGDDK.",
        "..KGDDKSKGGDDK..",
        "...KKKKSKKDDK...",
        "......KSKKKK....",
        "......KSK.......",
        ".....KSK........",
        ".....KSK........",
        ".....KK.........",
        "................"
      ]
    },

    // 回復薬：丸い瓶に赤い薬。コルクの栓
    iconItemPotion: {
      palette: { ".": null, "K": "#2a2438", "C": "#a0703a", "W": "#c8e0f0", "H": "#ffffff",
                 "R": "#e8445a", "P": "#ff9aa8", "D": "#a02838" },
      pixels: [
        "................",
        ".....KKKKKK.....",
        ".....KCCCCK.....",
        ".....KKKKKK.....",
        "......KHWK......",
        "......KHWK......",
        ".....KKHWKK.....",
        "....KWHWWWWK....",
        "...KWHRRRRRWK...",
        "...KHRRRRRRRK...",
        "...KHRPRRRRDK...",
        "...KRPRRRRRDK...",
        "...KRRRRRRDDK...",
        "....KRRRRDDK....",
        ".....KKKKKK.....",
        "................"
      ]
    },

    // 深淵の雫：紫の雫。芯が淡く光り、まわりに光の粒
    iconItemElixir: {
      palette: { ".": null, "K": "#1a0e30", "V": "#6a3ab8", "L": "#a880e8", "D": "#3a1a78",
                 "C": "#5ad8f0", "W": "#e8ffff", "Y": "#c8f0ff" },
      pixels: [
        "................",
        ".......KK.....Y.",
        "......KVVK......",
        "......KVVK......",
        ".....KVVVVK.....",
        ".....KVLVVK.....",
        "....KVLVVVVK....",
        "....KLVVVVDK....",
        "...KVLVCCVVDK...",
        "...KVVCWCCVDK...",
        "...KVVCCCCVDK...",
        "...KVVVCCVDDK...",
        "....KVVVVDDK....",
        ".Y...KDDDDK.....",
        "......KKKK......",
        "................"
      ]
    },

    // 解毒草：幅の広い1枚葉。青緑で、葉脈が白っぽく通る
    iconItemAntidote: {
      palette: { ".": null, "K": "#123a2a", "T": "#3aa878", "L": "#d0f0a0", "D": "#1f6a4a", "S": "#7a8a3a" },
      pixels: [
        "................",
        "...........KKK..",
        ".........KKTTTK.",
        ".......KKTTLTTK.",
        "......KTTTLTTDK.",
        ".....KTTTLTTTDK.",
        "....KTTTLTTTDK..",
        "....KTTLTTTTDK..",
        "...KTTLTTTTDK...",
        "...KTLTTTTDDK...",
        "...KTLTTTDDK....",
        "...KLTTDDDK.....",
        "..KLKKKKKK......",
        ".KSK............",
        ".KK.............",
        "................"
      ]
    },

    // 精気の実：淡く光る青い実。PP の色にそろえてある
    iconItemSpiritBerry: {
      palette: { ".": null, "K": "#0e2a4a", "B": "#4fb0d1", "H": "#e0f8ff", "D": "#2a6a9a",
                 "G": "#5ab84a", "S": "#6a4a2a" },
      pixels: [
        "................",
        "........KK......",
        ".......KGGK.....",
        "......KGGK......",
        ".....KKSKKK.....",
        "....KBBSBBBK....",
        "...KBHHBBBBBK...",
        "...KBHBBBBBBK...",
        "..KBBBBBBBBBDK..",
        "..KBBBBBBBBBDK..",
        "..KBBBBBBBBDDK..",
        "..KBBBBBBBDDDK..",
        "...KBBBBBDDDK...",
        "....KDDDDDDK....",
        ".....KKKKKK.....",
        "................"
      ]
    },

    // --- 道具 ---

    // 帰還の石：淡く光る丸い石。表に渦の模様
    iconItemReturnStone: {
      palette: { ".": null, "K": "#1a2a3a", "S": "#7ab8c8", "H": "#c8f0f8", "D": "#3a6a80",
                 "W": "#ffffff", "G": "#9ae8f8" },
      pixels: [
        "..G.............",
        "............G...",
        "......KKKKK.....",
        "....KKHHHSSKK...",
        "...KHHSSSSSSSK..",
        "..KHSSSWWWSSSDK.",
        "..KHSSWSSSWSSDK.",
        "..KSSSWSWSWSSDK.",
        "..KSSSWSSWWSSDK.",
        "..KSSSSWSSSSDDK.",
        "...KSSSSWWSDDK..",
        "...KDSSSSSDDDK..",
        "....KKDDDDDKK...",
        "......KKKKK.....",
        ".G...........G..",
        "................"
      ]
    },

    // 誘いの香：小さな香炉から、甘い桃色の煙が揺れて昇る
    iconItemScoutIncense: {
      palette: { ".": null, "K": "#2a1a10", "B": "#8a6a4a", "H": "#b89068", "D": "#5a4028",
                 "E": "#ff9a3c", "P": "#f0a0c8", "Q": "#ffd6ea" },
      pixels: [
        "........Q.......",
        ".......P.Q......",
        "......P...Q.....",
        ".......PP.P.....",
        ".........PP.....",
        "........P.Q.....",
        ".......PP.......",
        "......KEEK......",
        "..KKKKHEEHKKKK..",
        "..KHHHHHHHHHDK..",
        "...KBBBBBBBDK...",
        "....KBBBBBDK....",
        ".....KDDDDK.....",
        "....KKKKKKKK....",
        "....KDDDDDDK....",
        ".....KKKKKK....."
      ]
    },

    // --- 素材 ---
    // 色は、落とすモンスターの絵のパレットから取っている（ひと目で出どころが分かるように）

    // 鉱石のかけら：角ばった灰色の石に、金色の鉱脈
    iconItemOreShard: {
      palette: { ".": null, "K": "#1a1916", "S": "#7d7a72", "H": "#9b9890", "P": "#b8b5ac",
                 "D": "#4f4d47", "O": "#d8b45a", "Q": "#fff0b0" },
      pixels: [
        "................",
        "................",
        "........KK......",
        "......KKPHK.....",
        ".....KPHHSSK....",
        "....KPHHOSSSK...",
        "...KPHHOQOSSDK..",
        "..KHHSSSOSSDDK..",
        "..KHSSSSSSDDDK..",
        "..KSSOSSSDDDK...",
        "...KSQOSDDDDK...",
        "...KSSSDDDDK....",
        "....KKDDDKK.....",
        "......KKK.......",
        "................",
        "................"
      ]
    },

    // 光る鱗粉：黄色い粉の小山と、舞う光の粒（ヒカリムシの色）
    iconItemGlowDust: {
      palette: { ".": null, "K": "#1a1608", "N": "#6b5a2e", "D": "#c9a83e", "Y": "#ffe36e",
                 "H": "#fff2a8", "W": "#ffffff" },
      pixels: [
        "................",
        "...W.......H....",
        "..WHW...........",
        "...W....H....W..",
        ".......HWH......",
        "..H.....H.......",
        "..........Y.....",
        ".....Y..........",
        "........KKK.....",
        "......KKHYYKK...",
        "....KKHYYYYYDK..",
        "...KHYYYYYYDDDK.",
        "..KYYYYYYYDDDNK.",
        "..KDDDDDDDDNNNK.",
        "...KKKKKKKKKKK..",
        "................"
      ]
    },

    // 灼熱の牙：右上の折れ口と芯が赤く灯る、反った牙
    iconItemBlazingFang: {
      palette: { ".": null, "K": "#2b0f08", "I": "#f0e0c0", "J": "#c8b090", "D": "#8a6a50",
                 "R": "#ff5000", "O": "#ffb040" },
      pixels: [
        "................",
        ".........KK.KK..",
        "........KOOKOOK.",
        "........KRORROK.",
        "........KIRORJK.",
        ".......KIIRRJDK.",
        ".......KIIRJJDK.",
        "......KIIIJJDK..",
        "......KIIJJDDK..",
        ".....KIIJJDDK...",
        "....KIIJJDDK....",
        "...KIIJDDDK.....",
        "..KIJDDKK.......",
        ".KIDKK..........",
        ".KK.............",
        "................"
      ]
    },

    // 燃え殻：炭のかたまりに、橙に光るひび（スミビの色）
    iconItemEmberAsh: {
      palette: { ".": null, "K": "#0f0a08", "N": "#1e1512", "D": "#2e211c", "C": "#463430",
                 "H": "#6b544c", "P": "#8f746a", "R": "#ff6a20", "O": "#ffb040" },
      pixels: [
        "................",
        ".........O......",
        "................",
        "......KKKK......",
        "....KKPHHCKK....",
        "...KPHHCCRCDK...",
        "..KPHCCCROCDDK..",
        "..KHCRCCCRCDDK..",
        "..KHCORCCCDDNK..",
        "..KCCCCRCDDDNK..",
        "...KCCDDDDDNK...",
        "....KKNNNNKK....",
        "......KKKK......",
        "...........O....",
        "................",
        "................"
      ]
    },

    // 灰の羽根：灰色の羽根。軸が斜めに通る（ハイバネの色）
    iconItemAshFeather: {
      palette: { ".": null, "K": "#1c1613", "N": "#3a322d", "D": "#5e5650", "A": "#9a938d",
                 "H": "#bdb6ae", "P": "#ded8d0", "Q": "#e8e0d0" },
      pixels: [
        "................",
        "............KK..",
        "..........KKHPK.",
        ".........KHPHAK.",
        "........KHPHANK.",
        ".......KHPHAADK.",
        "......KHPNAADK..",
        ".....KHPHAANK...",
        "....KHPQAADK....",
        "....KPQANDK.....",
        "...KHQAADK......",
        "...KQDDKK.......",
        "..KQKKK.........",
        ".KQK............",
        ".KK.............",
        "................"
      ]
    },

    // 焼けた殻：焼き締まった殻のかけら。割れ目にマグマ（マグマガニの色）
    iconItemScorchedShell: {
      palette: { ".": null, "K": "#180b09", "D": "#422620", "A": "#5c3a30", "H": "#7d5245",
                 "P": "#9a6a58", "R": "#ff5000", "O": "#ffa040" },
      pixels: [
        "................",
        "................",
        "................",
        "................",
        ".....KKKKKK.....",
        "...KKPHHHHAKK...",
        "..KPHHAAHAAADK..",
        ".KPHAAROAAAADDK.",
        ".KHAARAAOAAADDK.",
        ".KHAAAAAAROADDK.",
        ".KAAAAAAAAAADDK.",
        "..KDDDDDDDDDDK..",
        "...KK.KKKK.KK...",
        "................",
        "................",
        "................"
      ]
    },

    // 宵の露：重たい黒い雫。ふちだけ紫に光る（ヨドミの色）
    iconItemDuskDew: {
      palette: { ".": null, "K": "#0e0a18", "D": "#1c1530", "P": "#3d3060", "L": "#6b57a0",
                 "V": "#8b6fd6", "W": "#e6e0ff" },
      pixels: [
        "................",
        ".......K........",
        ".......K........",
        "......KPK.......",
        "......KPK.......",
        ".....KLPDK......",
        ".....KLPDK......",
        "....KLPPPDK.....",
        "...KLWPPPDDK....",
        "...KLPPPPDDK....",
        "..KLPPPPPDDDK...",
        "..KVPPPPPDDDK...",
        "..KVPPPPDDDDK...",
        "...KVPPDDDDK....",
        "....KKKKKKK.....",
        "................"
      ]
    },

    // 王冠のかけら：金の冠の折れた一片。青い石がはまっている（キングスライムの色）
    iconItemCrownShard: {
      palette: { ".": null, "K": "#2a1a08", "G": "#e8b830", "H": "#fff0a0", "D": "#a87818",
                 "B": "#5b9fd8", "P": "#8fc7ee", "N": "#2f66a8" },
      pixels: [
        "................",
        "...K............",
        "..KHK.....K.....",
        "..KHK....KGK....",
        ".KHGGK...KGK....",
        ".KHGGK..KGGDK...",
        ".KHGGGKKGGGDK...",
        ".KHGGGGGGGGDDK..",
        ".KHGKKKKGGGDDK..",
        ".KGKPBNKGGGDDK..",
        ".KGKBBNKGGDDDK..",
        ".KGGKKKGGGDDK...",
        ".KDDDDDDDDDK....",
        "..KKK.KKK.KK....",
        "................",
        "................"
      ]
    },

    // 黄泉竜の鱗：紫の鱗1枚。内側に一回り小さい鱗の筋
    // （ヨミリュウの色。そのままでは暗い枠に沈むので一段明るく）
    iconItemDragonScale: {
      palette: { ".": null, "K": "#0a0710", "M": "#2a1d48", "P": "#4a3670", "L": "#6a50a0",
                 "H": "#a088d0" },
      pixels: [
        "................",
        "................",
        "....KKKKKKKK....",
        "...KHHLLLLLPK...",
        "..KHLLLLPPPPMK..",
        "..KHLLPPPPPPMK..",
        "..KLLKKKKKKPMK..",
        "..KLPKHLLPKPMK..",
        "..KLPKLPPMKPMK..",
        "...KPPKPMKPMK...",
        "...KPPKMMKPMK...",
        "....KPPKKPMK....",
        ".....KPPPMK.....",
        "......KMMK......",
        ".......KK.......",
        "................"
      ]
    },

    // 雷光の翅：水色の翅と翅脈。先に小さな火花（ビリムシの色）
    iconItemStormWing: {
      palette: { ".": null, "K": "#123a4a", "B": "#3f8fa8", "C": "#7fd9e8", "H": "#d8f8ff",
                 "Y": "#ffd75e" },
      pixels: [
        "..............Y.",
        ".........KKKK..Y",
        ".......KKCCHHK..",
        "......KCCCCHHK.Y",
        ".....KCBCCCCHK..",
        "....KCCBCCCCCK..",
        "...KCCCCBCCCCK..",
        "...KCBCCCBCCK...",
        "..KCCCBCCCBCK...",
        "..KCCCCBCCCK....",
        ".KCCBCCCBCK.....",
        ".KCCCBCCKK......",
        "KBCCCCKK........",
        "KBBKKK..........",
        "KK..............",
        "................"
      ]
    },

    // ねじれ蔦：輪を描いてねじれた蔦と葉（カゲヅタの色。そのままでは暗い枠に沈むので一段明るく）
    iconItemTwistedVine: {
      palette: { ".": null, "K": "#0c1410", "M": "#44704e", "L": "#6aa070", "H": "#a0d8a0" },
      pixels: [
        "................",
        "...........KKK..",
        "..........KHLLK.",
        ".........KLLMK..",
        "....KK..KMKKK...",
        "...KHLK.KMK.....",
        "...KLLMKMK......",
        "....KKMMK.......",
        ".....KMMKK......",
        "....KMKKMMK.....",
        "...KMK..KLMK....",
        "..KMK..KLMK.....",
        "..KMK.KLMK......",
        "...KMKMMK.......",
        "....KMMK........",
        ".....KK........."
      ]
    },

    // 毒の針：銀の針。先から紫の毒が垂れる（ドクバチの色）
    iconItemVenomStinger: {
      palette: { ".": null, "K": "#0d1207", "A": "#7a962a", "H": "#a3c23a", "P": "#c8e05a",
                 "I": "#eef0f4", "J": "#a8aab8", "Q": "#c050f0", "R": "#e090ff" },
      pixels: [
        "................",
        "...........KKK..",
        "..........KPHAK.",
        ".........KPHAAK.",
        ".........KHAAK..",
        "........KIJKK...",
        ".......KIJK.....",
        "......KIJK......",
        ".....KIJK.......",
        "....KIJK........",
        "...KIJK.........",
        "...KJK..........",
        "...KK...........",
        "..KQK...........",
        ".KRQQK..........",
        "..KKK..........."
      ]
    },

    // 泥甲羅：板の継ぎ目が見える甲羅のかけら。下のほうに泥が染みている（ドロガメの色）
    iconItemMuddyShell: {
      palette: { ".": null, "K": "#0d1207", "D": "#3d5226", "A": "#5f7a33", "H": "#86a344",
                 "P": "#b4cc63", "M": "#5a4428" },
      pixels: [
        "................",
        "................",
        "................",
        ".....KKKKKK.....",
        "...KKPPHHHHKK...",
        "..KPHHDHHHDHAK..",
        ".KHHHDAHHHADAAK.",
        ".KHDDDADDDDDAAK.",
        ".KHAAADAAADAADK.",
        ".KAAAADAAADAADK.",
        ".KMAADDDDDDMMDK.",
        "..KMMMAAAMMMDK..",
        "...KKKKKKKKKK...",
        "................",
        "................",
        "................"
      ]
    },

    // 錆びた骨：斜めの骨。赤茶けて、ところどころ錆の色
    iconItemRustedBone: {
      palette: { ".": null, "K": "#1a0e08", "A": "#b87a50", "H": "#d8a078", "D": "#7a4a2a",
                 "R": "#9a5030", "P": "#e8c8a8" },
      pixels: [
        "................",
        "..........KK....",
        ".........KPHK...",
        ".........KHAKKK.",
        "........KHAAPHK.",
        ".......KHARKAAK.",
        "......KHADKKKK..",
        ".....KHADK......",
        "....KHRDK.......",
        "...KHADK........",
        ".KKKAADK........",
        "KHPAKDDK........",
        "KAAKRADK........",
        ".KKKADK.........",
        "...KDK..........",
        "....K..........."
      ]
    },

    // 毒嚢：口をしばった紫の袋。下から毒が垂れる
    iconItemVenomSac: {
      palette: { ".": null, "K": "#1a0a20", "V": "#9040c0", "L": "#c070f0", "D": "#5a2080",
                 "W": "#f0d8ff", "Q": "#c050f0", "G": "#4a6b1e" },
      pixels: [
        "................",
        ".......KK.......",
        "......KGGK......",
        "......KGGK......",
        ".....KKKKKK.....",
        "....KLLVVVVK....",
        "...KLWLVVVVDK...",
        "..KLWLVVVVVVDK..",
        "..KLLVVVVVVVDK..",
        "..KVVVVVVVVDDK..",
        "..KVVVVVVVDDDK..",
        "...KVVVVVDDDK...",
        "....KDDDDDDK....",
        ".....KKQKKK.....",
        ".......Q........",
        "................"
      ]
    },

    // 苔むした核：苔の生えた丸い石。芯がまだ温かく光る（モスゴーレムの色）
    iconItemMossyCore: {
      palette: { ".": null, "K": "#131a10", "S": "#6e6a5c", "H": "#918c7c", "P": "#b3ae9c",
                 "D": "#3b3a30", "M": "#4a8a3a", "G": "#7ab84a", "O": "#ffb050" },
      pixels: [
        "................",
        "................",
        "......KKKK......",
        "....KKGGMHKK....",
        "...KGGMMHHSSK...",
        "..KGMMHPHSSSDK..",
        "..KMHHPHSOSSDK..",
        ".KHHPHSOOOSSDDK.",
        ".KHPHSSOOSSSDDK.",
        ".KHHSSSSSSSDDMK.",
        "..KSSSSSSDDMMK..",
        "..KDSSSDDDMMGK..",
        "...KKDDDDMGKK...",
        ".....KKKKKK.....",
        "................",
        "................"
      ]
    },

    // スライムのかけら：ぷるんとした緑のかたまり（スライムの色）
    iconItemSlimeShard: {
      palette: { ".": null, "K": "#071a12", "N": "#16402c", "D": "#2f8a5d", "G": "#5fd18c",
                 "H": "#86e5ad", "L": "#a8f0c4" },
      pixels: [
        "................",
        "................",
        "................",
        "................",
        "................",
        ".....KKKKK......",
        "....KLLHGGK.....",
        "...KLHGGGGGK....",
        "..KHLGGGGGGDK...",
        "..KHGGGGGGGDK...",
        ".KHGGGGGGGGDDK..",
        ".KHGGGGGGGGDDK..",
        ".KGGGGGGGGDDNK..",
        "..KDDDDDDDNNK...",
        "...KKKKKKKKK....",
        "................"
      ]
    },

    // 深淵の欠片：黒い結晶のかけら。ふちが紫に光る
    iconItemAbyssFragment: {
      palette: { ".": null, "K": "#1a1030", "X": "#1e1236", "P": "#3a2866", "V": "#8b6fd6",
                 "W": "#e6e0ff" },
      pixels: [
        "........K.......",
        ".......KVK......",
        ".......KVK......",
        "......KVPXK.....",
        "......KVPXK.....",
        ".....KVPPXXK....",
        ".....KVPXXXK....",
        "....KVWPXXXXK...",
        "....KVPPXXXXK...",
        "...KVPPXXXXXK...",
        "...KVPXXXXXK....",
        "....KVPXXXXK....",
        "....KVPXXXK.....",
        ".....KVXXK......",
        "......KXK.......",
        ".......K........"
      ]
    },

    // --- 装備 ---
    // 武器は右上へ斜めに構えた向きでそろえる（左下が柄）。
    // 色は、作るのに使う素材・元になったモンスターから取っている

    // 探索者の長剣：癖のない鋼の剣。金のつば
    iconItemExplorerSword: {
      palette: { ".": null, "K": "#1a1e26", "H": "#ffffff", "B": "#c8d2dc", "D": "#7a8898",
                 "G": "#c89830", "g": "#f0d070", "A": "#6a4a2a", "a": "#4a3018", "O": "#d8b040" },
      pixels: [
        ".............K..",
        "............KHK.",
        "...........KHBK.",
        "..........KHBDK.",
        ".........KHBDK..",
        "........KHBDK...",
        ".....K.KHBDK....",
        "....KgKHBDK.....",
        "....KggBDK......",
        "...KKAGGK.......",
        "..KOAaKggK......",
        "..KOOK.KK.......",
        "...KOK..........",
        "....K...........",
        "................",
        "................"
      ]
    },

    // 獣の牙：牙の色の短い刃
    iconItemFangCharm: {
      palette: { ".": null, "K": "#2a1a0e", "H": "#fff8e8", "B": "#f0e0c0", "D": "#b8a078",
                 "G": "#7a4a28", "g": "#a06a3a", "A": "#5a3a20", "a": "#3a2410", "O": "#f0e0c0" },
      pixels: [
        "................",
        "................",
        "................",
        "...........K....",
        "..........KHK...",
        ".........KHBK...",
        "........KHBDK...",
        ".......KHBDK....",
        ".....KKHBDK.....",
        "....KggBDK......",
        "...KKAGGK.......",
        "..KOAaKgK.......",
        "..KOOK.K........",
        "...KOK..........",
        "....K...........",
        "................"
      ]
    },

    // 燃え殻の剣：炭色の刃。刃先と縁に火が宿る
    iconItemEmberBlade: {
      palette: { ".": null, "K": "#0f0a08", "H": "#ff9a3c", "B": "#6b544c", "D": "#2e211c",
                 "G": "#463430", "g": "#6b544c", "A": "#7a3a1a", "a": "#4a200a", "O": "#ff9a3c",
                 "R": "#e8542a", "Y": "#ffe27a" },
      pixels: [
        "............KRK.",
        "...........KRYRK",
        "...........KHKRK",
        "..........KHBKK.",
        ".........KHBDK..",
        "........KHBDK...",
        ".....K.KHBDK....",
        "....KgKHBDK.....",
        "....KggBDK......",
        "...KKAGGK.......",
        "..KOAaKggK......",
        "..KOOK.KK.......",
        "...KOK..........",
        "....K...........",
        "................",
        "................"
      ]
    },

    // 灼牙の戦刃：幅広の赤く灼けた刃
    iconItemBlazeCharm: {
      palette: { ".": null, "K": "#2b0f08", "H": "#ffd0a0", "B": "#e8542a", "D": "#8c3a1e",
                 "G": "#5a2211", "g": "#8c3a1e", "A": "#3d1608", "a": "#2b0f08", "O": "#ff9a3c" },
      pixels: [
        "............K...",
        "...........KHK..",
        "..........KHBK..",
        ".........KHBBK..",
        "........KHBBBK..",
        ".......KHBBBDK..",
        "....K.KHBBBDK...",
        "...KgKHBBBDK....",
        "...KggBBBDK.....",
        "....KgGBDK......",
        "..KKAaGGK.......",
        ".KOOaKKggK......",
        "..KOOK.KK.......",
        "...KK...........",
        "................",
        "................"
      ]
    },

    // 深淵の牙：紫に透ける細身の刃
    iconItemAbyssFang: {
      palette: { ".": null, "K": "#0e0a18", "H": "#c8b8ff", "B": "#6b57a0", "D": "#2a1a48",
                 "G": "#6b57a0", "g": "#8b6fd6", "A": "#3d3060", "a": "#1e1236", "O": "#8b6fd6" },
      pixels: [
        "................",
        ".............K..",
        "............KHK.",
        "...........KHBK.",
        "..........KHBDK.",
        ".........KHBDK..",
        "........KHBDK...",
        "......KKHBDK....",
        ".....KgHBDK.....",
        ".....KgGDK......",
        "...KKAaGGK......",
        "..KOOaKKK.......",
        "...KOOK.........",
        "....KK..........",
        "................",
        "................"
      ]
    },

    // 沼骨の槍：骨の柄と穂先。錆色の綴じ目と、にじむ闇の粒
    iconItemMarshSpear: {
      palette: { ".": null, "K": "#0a0d10", "A": "#a8b8bc", "a": "#5a6a70", "H": "#e8f0ec",
                 "B": "#a8b8bc", "D": "#5a6a70", "G": "#9a5030", "g": "#c87048", "V": "#8b6fd6" },
      pixels: [
        "................",
        ".......V...KKK..",
        "....V.....KHBBK.",
        ".........KHBBK..",
        "........KHBBDK..",
        "..V....KgBBDK...",
        ".......KgGKK....",
        "......KAaGK.....",
        ".....KAaKK......",
        "....KAaK........",
        "...KAaK.........",
        "..KAaK..........",
        ".KAaK...........",
        "KaaK............",
        ".KK.............",
        "................"
      ]
    },

    // 厚革の胴着：茶色の革。縫い目と金具つきの帯
    iconItemThickLeatherVest: {
      palette: { ".": null, "K": "#1e120a", "A": "#8a5a30", "H": "#b07a48", "D": "#5a3a1e",
                 "S": "#d8b080", "B": "#3a2414", "G": "#c89830" },
      pixels: [
        "....KK....KK....",
        "..KKHHK..KHHKK..",
        ".KHHAAHKKHAAHHK.",
        "KHAAAAAHHAAAAAHK",
        "KHAAASAAAASAAADK",
        "KHAAAAAAAAAAAADK",
        ".KHAASAAAASAADK.",
        "..KHAAAAAAAADK..",
        "..KHASAAAASADK..",
        "..KBBBBGGBBBBK..",
        "..KHASAAAASADK..",
        "..KHAAAAAAAADK..",
        "...KHDDDDDDDK...",
        "....KKKKKKKK....",
        "................",
        "................"
      ]
    },

    // 黄泉鱗の鎧：紫の鱗を段に綴じた鎧（ヨミリュウの色を一段明るく）
    iconItemDragonGuard: {
      palette: { ".": null, "K": "#0a0710", "A": "#4a3670", "H": "#8a70b8", "D": "#2a1d48",
                 "S": "#a088d0" },
      pixels: [
        "....KK....KK....",
        "..KKHHK..KHHKK..",
        ".KHHAAHKKHAAHHK.",
        "KHAAASAHHSAAASHK",
        "KHAAAAAAAAAAAADK",
        "KHDDADDDADDDADDK",
        ".KHSAAASAAASADK.",
        "..KHAAAAAAAADK..",
        "..KHDDADDDADDK..",
        "..KHASAAASAADK..",
        "..KHAAAAAAAADK..",
        "..KHADDDADDDDK..",
        "...KHDDDDDDDK...",
        "....KKKKKKKK....",
        "................",
        "................"
      ]
    },

    // 泥重の甲：甲羅の板を骨で綴じた鎧。裾に泥（ドロガメの色）
    iconItemMireArmor: {
      palette: { ".": null, "K": "#0d1207", "A": "#5f7a33", "H": "#86a344", "D": "#3d5226",
                 "S": "#d8e4e0", "M": "#5a4428", "P": "#b4cc63" },
      pixels: [
        "....KK....KK....",
        "..KKHHK..KHHKK..",
        ".KHHAAHKKHAAHHK.",
        "KHAASAADDAASAAHK",
        "KHAAAAADDAAAAADK",
        "KHAAAPADDAPAAADK",
        ".KHAAAADDAAAADK.",
        "..KDDDDSSDDDDK..",
        "..KHAAADDAAADK..",
        "..KHAAADDAAADK..",
        "..KHAAADDAAADK..",
        "..KMMMMMMMMMMK..",
        "...KMDMDMDMDK...",
        "....KKKKKKKK....",
        "................",
        "................"
      ]
    },

    // 岩鎧の欠片：ひびの入った丸い岩に、革の帯（イワゴローの色）
    iconItemStoneMail: {
      palette: { ".": null, "K": "#1a1916", "A": "#7d7a72", "H": "#9b9890", "P": "#b8b5ac",
                 "D": "#4f4d47", "N": "#35342f", "S": "#6a4a2a" },
      pixels: [
        "................",
        "................",
        ".....KKKKKK.....",
        "....KHHHHHHK....",
        "...KPPAAAANHK...",
        "..KPAAAAAANAHK..",
        ".KHANAAAANAAAHK.",
        ".KHAANAAANAAADK.",
        ".KHAANAAAANAADK.",
        ".KSSSSSSSSSSSSK.",
        ".KHAAANAAAANADK.",
        "..KHANAAAAAADK..",
        "...KHNAAAAADK...",
        "....KHDDDDDK....",
        ".....KKKKKK.....",
        "................"
      ]
    },

    // 石の帽子：丸い石の帽子。つばに影
    iconItemStoneBand: {
      palette: { ".": null, "K": "#1a1916", "A": "#8a8478", "H": "#b0aa9c", "D": "#5a564c",
                 "P": "#d0cabc", "N": "#3a3830" },
      pixels: [
        "................",
        "................",
        "......KKKK......",
        "....KKHHHHKK....",
        "...KHHPAAAHHK...",
        "..KHAPAAANAAHK..",
        "..KHPAAAANAADK..",
        ".KHAAAAAAANAAHK.",
        ".KHAAAAAAANAADK.",
        ".KHAAAAAAAAAADK.",
        "KHNNNNNNNNNNNNHK",
        "KHDDDDDDDDDDDDDK",
        ".KKKKKKKKKKKKKK.",
        "................",
        "................",
        "................"
      ]
    },

    // 苔の外套：苔の生えた頭巾つきの外套。胸に核の留め具（モスゴーレムの色）
    iconItemMossCharm: {
      palette: { ".": null, "K": "#131a10", "A": "#3a6a2a", "H": "#5a9a3a", "D": "#24461a",
                 "N": "#0e1a0a", "M": "#7ab84a", "S": "#918c7c", "O": "#ffb050" },
      pixels: [
        "......KKKK......",
        ".....KHMHHK.....",
        "....KHMAAAHK....",
        "...KHANNNNAHK...",
        "...KHANNNNADK...",
        "..KHAANNNNAAHK..",
        "..KHAAAAAAAADK..",
        ".KHAAAASSAAAAHK.",
        ".KHAAAAOSAAAADK.",
        ".KHAMAADAAAAADK.",
        "KHAAAAADAAAMAAHK",
        "KHAMAMADAAAAAADK",
        "KHAAAAADAAMAAADK",
        ".KHDDDDDDDDDDDK.",
        "..KKKKKKKKKKKK..",
        "................"
      ]
    },

    // 雷光の羽衣：水色の薄衣に稲妻の筋（ビリムシの色）
    iconItemStormVeil: {
      palette: { ".": null, "K": "#123a4a", "A": "#7fd9e8", "H": "#d8f8ff", "D": "#3f8fa8",
                 "Y": "#ffd75e" },
      pixels: [
        "..Y..KK..KK.....",
        "....KHHKKHHK..Y.",
        "...KHAADHAAHK...",
        "..KHAAADAAAAHK..",
        ".KHAAAADAAAAAHK.",
        "KHAADAADYAADAAHK",
        "KHADKHADAYDKHADK",
        "KHDKKHADYADKKHDK",
        ".KK.KHADAYDK.KK.",
        "...KHAADAAAHK...",
        "...KHAADAAADK...",
        "..KHAAADAAAAHK..",
        "..KHAAADAAAADK..",
        "YKHDDDDDDDDDDHK.",
        "..KKKKKKKKKKKK..",
        "................"
      ]
    },

    // 精気の指輪：銀の輪に青い石（精気の実の色）
    iconItemSpiritRing: {
      palette: { ".": null, "K": "#1a1e26", "A": "#b8c4d0", "H": "#f0f4f8", "D": "#6a7888",
                 "B": "#4fb0d1", "L": "#e0f8ff", "N": "#2a6a9a" },
      pixels: [
        "................",
        "................",
        "......KKKK......",
        ".....KLLBBK.....",
        "....KBBBBBBK....",
        "....KBBBBNBK....",
        "....KHBBNNHK....",
        "...KHADDDDAHK...",
        "..KHADKKKKHAHK..",
        "..KHDK....KHDK..",
        "..KHDK....KHDK..",
        "..KHAHKKKKHADK..",
        "...KHAHHHHADK...",
        "....KHDAADDK....",
        ".....KKHDKK.....",
        ".......KK......."
      ]
    },

    // 竜牙の指輪：紫の輪に、白い牙が立つ（ヨミリュウの色）
    iconItemFangRing: {
      palette: { ".": null, "K": "#0a0710", "A": "#4a3670", "H": "#8a70b8", "D": "#2a1d48",
                 "F": "#f0e8d8", "G": "#a89a80", "V": "#8b6fd6" },
      pixels: [
        ".......KK.......",
        "......KFGK......",
        "......KFFK......",
        ".....KFFFGK.....",
        ".....KFFFGK.....",
        "....KVFFFGVK....",
        "....KHHAAHHK....",
        "...KHADDDDAHK...",
        "..KHADKKKKHAHK..",
        "..KHDK....KHDK..",
        "..KHDK....KHDK..",
        "..KHAHKKKKHADK..",
        "...KHAHHHHADK...",
        "....KHDAADDK....",
        ".....KKHDKK.....",
        ".......KK......."
      ]
    },

    // 王冠の輪：金の輪を斜め上から見たところ。前に青い石（キングスライムの色）
    iconItemCrownCircle: {
      palette: { ".": null, "K": "#2a1a08", "A": "#e8b830", "H": "#fff0a0", "D": "#a87818",
                 "B": "#5b9fd8", "L": "#8fc7ee", "N": "#2f66a8" },
      pixels: [
        "................",
        "................",
        "................",
        ".......KK.......",
        "...K..KHHK..K...",
        "..KHK.KHDK.KHK..",
        "..KHKKHAAHKKHK..",
        "..KHHHDDDDHHDK..",
        ".KHADKKKKKKHAHK.",
        "KHADK......KHAHK",
        "KHADK......KHADK",
        ".KHAHKKKKKKHADK.",
        "..KHDHHLBHHDDK..",
        "...KKKHBNDKKK...",
        "......KKKK......",
        "................"
      ]
    },

    // 毒沼の冠：沼の緑の冠に、紫の毒嚢がはまる（ヌシガエルの色）
    iconItemVenomCrown: {
      palette: { ".": null, "K": "#0a1008", "A": "#4a6b1e", "H": "#6f9128", "D": "#2c4416",
                 "Q": "#c050f0", "L": "#e090ff", "N": "#5a2080" },
      pixels: [
        "................",
        "................",
        ".......KK.......",
        "......KHHK......",
        "..KK..KHDK..KK..",
        ".KHHK.KHDK.KHHK.",
        ".KHDKKKHDKKKHDK.",
        ".KHAHHHAAHHHADK.",
        ".KHAAAAAAAAAADK.",
        ".KHAAALQQQAAADK.",
        ".KHAAAQQQQAAADK.",
        ".KHAAANQQNAAADK.",
        ".KHDDDDDDDDDDDK.",
        "..KKKKKKKKKKKK..",
        "................",
        "................"
      ]
    },

    // 旅人の護符：革ひもに木の札。白い印と赤い点
    iconItemTravelerCharm: {
      palette: { ".": null, "K": "#1e120a", "C": "#8a5a30", "A": "#c8a070", "H": "#e8c898",
                 "D": "#8a6a40", "W": "#f8f0e0", "R": "#c84a3a" },
      pixels: [
        "...K........K...",
        "..KCK......KCK..",
        "...KCK....KCK...",
        "...KCK....KCK...",
        "....KCK..KCK....",
        "....KCK..KCK....",
        ".....KCKKCK.....",
        ".....KCKKCK.....",
        "......KHHK......",
        ".....KHAAHK.....",
        "....KHAWWAHK....",
        "....KHAWRADK....",
        "....KHAWAADK....",
        ".....KHAADK.....",
        "......KHDK......",
        ".......KK......."
      ]
    },

    // 毒よけの護符：毒の針を束ねて紫のひもで縛ったもの（ドクバチの色）
    iconItemVenomWard: {
      palette: { ".": null, "K": "#0d1207", "C": "#7a962a", "I": "#eef0f4", "J": "#a8aab8",
                 "Q": "#c050f0", "G": "#c8e05a" },
      pixels: [
        "...K........K...",
        "..KCK......KCK..",
        "...KCK....KCK...",
        "...KCK....KCK...",
        "....KCK..KCK....",
        "....KCK..KCK....",
        ".....KCKKCK.....",
        ".....KCKKCK.....",
        ".....KIGGJK.....",
        ".....KIJIJK.....",
        ".....KQQQQK.....",
        ".....KIJIJK.....",
        ".....KIJIJK.....",
        ".....KIJIJK.....",
        ".....KIJIJK.....",
        "......KKKK......"
      ]
    },

    // 髑髏の護符：小さな頭骨。眼窩が青く光る（ヌマボネの青い眼光）
    iconItemBoneCharm: {
      palette: { ".": null, "K": "#0a0d10", "C": "#3d4a52", "A": "#c8d4d0", "H": "#eef4f0",
                 "D": "#7a8a90", "N": "#1c2430", "E": "#4fb0d1" },
      pixels: [
        "...K........K...",
        "..KCK......KCK..",
        "...KCK....KCK...",
        "...KCK....KCK...",
        "....KCK..KCK....",
        "....KCK..KCK....",
        ".....KCKKCK.....",
        ".....KCKKCK.....",
        ".....KHHHHK.....",
        "....KHAAAAHK....",
        "....KHNAANDK....",
        "....KHEAAEDK....",
        "....KHAAAADK....",
        ".....KHNADK.....",
        ".....KHDNDK.....",
        "......KKKK......"
      ]
    },

    // 炎よけの札：殻色の札に赤い炎の印（マグマガニの殻）
    iconItemEmberWard: {
      palette: { ".": null, "K": "#180b09", "A": "#c8946a", "H": "#e8b88a", "D": "#8a5a40",
                 "R": "#e8542a", "O": "#ff9a3c", "C": "#7a4a2a", "N": "#5c3a30" },
      pixels: [
        "......KCCK......",
        "....KKKCKKKK....",
        "...KHHHHHHHHK...",
        "...KHAAAAAADK...",
        "...KHAARAAADK...",
        "...KHAAARAADK...",
        "...KHAAOAAADK...",
        "...KHARARAADK...",
        "...KHAROORADK...",
        "...KHARRRRADK...",
        "...KHAAAAAADK...",
        "...KHNNNNNNDK...",
        "...KHAAAAAADK...",
        "...KHDDDDDDDK...",
        "....KKKKKKKK....",
        "................"
      ]
    },

    // 宵よけの札：宵色の札に淡い紫の輪の印（ヨドミの色）
    iconItemDuskWard: {
      palette: { ".": null, "K": "#0e0a18", "A": "#3d3060", "H": "#6b57a0", "D": "#1c1530",
                 "V": "#c8b8ff", "C": "#8b6fd6", "N": "#8b6fd6" },
      pixels: [
        "......KCCK......",
        "....KKKCKKKK....",
        "...KHHHHHHHHK...",
        "...KHAAAAAADK...",
        "...KHAAAAAADK...",
        "...KHAVVVVADK...",
        "...KHAVAAVADK...",
        "...KHAVAAVADK...",
        "...KHAVVVVADK...",
        "...KHAAAAAADK...",
        "...KHANNNNADK...",
        "...KHAAAAAADK...",
        "...KHANNNNADK...",
        "...KHDDDDDDDK...",
        "....KKKKKKKK....",
        "................"
      ]
    },

    // 光る提灯：鱗粉が黄色く光る丸い提灯（ヒカリムシの色）
    iconItemGlowLantern: {
      palette: { ".": null, "K": "#1a1608", "A": "#ffe36e", "H": "#fff8d0", "D": "#c9a83e",
                 "N": "#6b5a2e", "M": "#3a2a14", "W": "#ffffff" },
      pixels: [
        "................",
        ".......NN.......",
        "......N..N......",
        ".....KN..NK.....",
        "....KMMMMMMK....",
        ".....KHDADK.....",
        "....KHADAAHK....",
        "...KHAWDAAAHK...",
        "...KHAWDAAADK...",
        "...KHAADAAADK...",
        "...KHAADAAADK...",
        "....KHADAADK....",
        ".....KHDADK.....",
        "....KMMMMMMK....",
        ".....KKKKKK.....",
        "................"
      ]
    },

    // 風切りの羽根：灰の羽根3枚を扇に束ね、赤いひもで結ぶ（ハイバネの色）
    iconItemSwiftPlume: {
      palette: { ".": null, "K": "#1c1613", "A": "#9a938d", "H": "#ded8d0", "D": "#5e5650",
                 "R": "#c84a3a", "r": "#8a2a20", "Q": "#ded8d0" },
      pixels: [
        ".......KK.......",
        "......KHHK......",
        "..KK.KHDAHK.KK..",
        ".KHHKKHDADKKHHK.",
        "KHADHKHDADKHDAHK",
        "KHADDKHDADKHDADK",
        ".KHADKHDADKDADK.",
        "..KHDHKDDKHDDK..",
        "...KHDKDDKDDK...",
        "....KHKDDKHK....",
        ".....KRRRrK.....",
        ".....KRRRrK.....",
        "......KQQK......",
        "......KQQK......",
        ".......KK.......",
        "................"
      ]
    },

    // 風乗りの羽飾り：白い羽根2枚を金の留め具で挿した飾り。赤い玉つき
    iconItemWindCrest: {
      palette: { ".": null, "K": "#1c1613", "A": "#bdb6ae", "H": "#f0ece4", "D": "#7a726a",
                 "G": "#e8b830", "g": "#a87818", "R": "#d84a4a" },
      pixels: [
        "...........KK...",
        "..........KHHK..",
        ".........KHADHK.",
        "........KHADADK.",
        ".......KHADADK..",
        "......KHADADK...",
        ".....KHAADDKKK..",
        "....KHAADKKHHHK.",
        "...KHAADKHHADDHK",
        "...KHADKHDDDDDK.",
        "..KGGGADDDDKKK..",
        "..KGGGgKKKK.....",
        ".KRGggK.........",
        ".KRRKK..........",
        "..KK............",
        "................"
      ]
    },

    // 帯電の芯：金具で挟んだ黄色く光る芯。まわりに火花（ビリムシの色）
    iconItemChargedCore: {
      palette: { ".": null, "K": "#150f06", "A": "#ffd75e", "H": "#fff2b0", "D": "#c8891a",
                 "M": "#5a5a6a", "m": "#9a9aaa", "C": "#7fd9e8" },
      pixels: [
        ".......C........",
        ".....KKKKKK.....",
        "....KmmmmmmK....",
        "....KMMMMMMK....",
        ".....KHHHHK.....",
        "..C..KHAADK.....",
        "...C.KHAADK.....",
        "..C..KHAADK.....",
        ".....KHAADK..C..",
        ".....KHAADK.C...",
        ".....KHAADK..C..",
        ".....KHDDDK.....",
        "....KmmmmmmK....",
        "....KMMMMMMK....",
        ".....KKKKKK.....",
        "................"
      ]
    },

    // --- スライムのかけらで作る装備（RC-1）。どれもスライムの緑の結晶 ---

    // 粘晶の剣：透きとおった緑の刃に、青みのつばと握り
    iconItemSlimeBlade: {
      palette: { ".": null, "K": "#071a12", "H": "#e0fff0", "B": "#86e5ad", "D": "#2f8a5d",
                 "G": "#3a6a8a", "g": "#6a9ac0", "A": "#2a4a5a", "a": "#16303c", "O": "#5fd18c" },
      pixels: [
        ".............K..",
        "............KHK.",
        "...........KHBK.",
        "..........KHBDK.",
        ".........KHBDK..",
        "........KHBDK...",
        ".....K.KHBDK....",
        "....KgKHBDK.....",
        "....KggBDK......",
        "...KKAGGK.......",
        "..KOAaKggK......",
        "..KOOK.KK.......",
        "...KOK..........",
        "....K...........",
        "................",
        "................"
      ]
    },

    // 粘晶の鎧：緑の結晶を十字の継ぎ目で組んだ胴。左胸に照り
    iconItemSlimeMail: {
      palette: { ".": null, "K": "#071a12", "A": "#5fd18c", "H": "#a8f0c4", "D": "#2f8a5d",
                 "N": "#16402c", "W": "#e0fff0" },
      pixels: [
        "....KK....KK....",
        "..KKHHK..KHHKK..",
        ".KHHAAHKKHAAHHK.",
        "KHAAAAANHAAAAAHK",
        "KHAWAAANAAAAAADK",
        "KHAAWAANAAAAAADK",
        ".KHAAWANAAAAADK.",
        "..KNNNNNNNNNNK..",
        "..KHAAANAAAADK..",
        "..KHAAANAWAADK..",
        "..KHAAANAAAADK..",
        "..KHAAANAAAADK..",
        "...KHDDDDDDDK...",
        "....KKKKKKKK....",
        "................",
        "................"
      ]
    },

    // 粘晶のネックレス：小さな粒を連ねた銀の鎖に、しずく形の結晶
    iconItemSlimeNecklace: {
      palette: { ".": null, "K": "#071a12", "C": "#c8d4d0", "c": "#86e5ad", "A": "#5fd18c",
                 "H": "#a8f0c4", "D": "#2f8a5d", "W": "#ffffff" },
      pixels: [
        "...K........K...",
        "..KCK......KCK..",
        "...KCK....KCK...",
        "...KcK....KcK...",
        "....KCK..KCK....",
        "....KcK..KcK....",
        ".....KCKKCK.....",
        ".....KCKKCK.....",
        "......KHHK......",
        ".....KHWAHK.....",
        "....KHWAAAHK....",
        "....KHAAAADK....",
        "....KHAAAADK....",
        ".....KHAADK.....",
        "......KHDK......",
        ".......KK......."
      ]
    },

    // --- 萌芽の穴・若葉の洞の素材と装備（v1.0.0）---
    // 剣・羽飾り・首飾り・鎧は既存のアイコン（探索者の長剣・灼牙の戦刃・風切りの羽根・粘晶のネックレス・厚革の胴着）の形を
    // そのまま使い、材料の色に塗り替えた（向きと大きさが一覧でそろうように）。ほかは新しく描いた

    // 若葉の抜け殻：脱ぎ捨てた皮。節の筋が入り、右上の裂け目から中が空っぽに見える（フタバムシの色）
    iconItemShedHusk: {
      palette: { ".": null, "K": "#2a3214", "N": "#4a5a24", "D": "#8a9a4a", "A": "#c8d48a",
                 "H": "#eef4c8" },
      pixels: [
        "................",
        "................",
        "........KKKK....",
        "......KKNNNNK...",
        ".....KHAKNNNK...",
        "....KHHAADKNK...",
        "...KHHAAADDK....",
        "...KHADAAADK....",
        "..KHHAADAADK....",
        "..KHAAAADADK....",
        "..KHADAAADK.....",
        "..KHAADAADK.....",
        "...KHAAADK......",
        "....KKDDK.......",
        ".....KK.........",
        "................"
      ]
    },

    // 眠り花粉：ふわりと固まった桃色の花粉。まわりに黄色い粒（ユラツボミの色）
    iconItemSleepPollen: {
      palette: { ".": null, "K": "#4a2238", "D": "#b8607e", "A": "#e89ab8", "H": "#fcd8e6",
                 "Y": "#fff0a0" },
      pixels: [
        "................",
        "..Y.........Y...",
        ".......KKK......",
        "......KHHAK..Y..",
        "...KKKHHAAKKK...",
        "..KHHAKAADKHAK..",
        ".KHHHAAKDKHHAAK.",
        ".KHHAAAADKHAADK.",
        ".KHAAAADDKAAADK.",
        "..KAADDDKKADDK..",
        "...KKKKK..KKK...",
        ".....Y......Y...",
        "................",
        "...Y......Y.....",
        "................",
        "................"
      ]
    },

    // 若葉の羽根：灰の羽根と同じ形を、若葉色に（ワカバドリの色）
    iconItemLeafFeather: {
      palette: { ".": null, "K": "#16260f", "N": "#2c5a22", "D": "#3f7a2c", "A": "#5fa83f",
                 "H": "#8dd060", "P": "#c8f0a0", "Q": "#e8ffd0" },
      pixels: [
        "................",
        "............KK..",
        "..........KKHPK.",
        ".........KHPHAK.",
        "........KHPHANK.",
        ".......KHPHAADK.",
        "......KHPNAADK..",
        ".....KHPHAANK...",
        "....KHPQAADK....",
        "....KPQANDK.....",
        "...KHQAADK......",
        "...KQDDKK.......",
        "..KQKKK.........",
        ".KQK............",
        ".KK.............",
        "................"
      ]
    },

    // 苔むした甲羅：泥甲羅と同じ形のかけらに、上から苔が乗る（コケガメの色）
    iconItemMossyShell: {
      palette: { ".": null, "K": "#0e1410", "D": "#2b4a48", "A": "#4f7d78", "H": "#86b0a8",
                 "P": "#b4d0e2", "M": "#335a58", "G": "#78b24a", "L": "#4f8a33", "F": "#a6d66a" },
      pixels: [
        "................",
        "................",
        "................",
        ".....KKKKKK.....",
        "...KKGGLGGGKK...",
        "..KGFGLGGLGHAK..",
        ".KHHHDAHHHADAAK.",
        ".KHDDDADDDDDAAK.",
        ".KHAAADAAADAADK.",
        ".KAAAADAAADAADK.",
        ".KMAADDDDDDMMDK.",
        "..KMMMAAAMMMDK..",
        "...KKKKKKKKKK...",
        "................",
        "................",
        "................"
      ]
    },

    // 若芽の種：小さな双葉が出かけた種。そばに光の粒（コダマの色）
    iconItemSproutSeed: {
      palette: { ".": null, "K": "#2a1c0e", "N": "#5c4229", "D": "#8a6a3a", "A": "#c8a060",
                 "H": "#ecd29a", "P": "#fff4d0", "G": "#84c95a", "L": "#4f9637", "S": "#4f7a2c",
                 "Y": "#fff3a0" },
      pixels: [
        "................",
        "...KKK....KKK...",
        "..KGGLK..KLGGK..",
        "...KGGLKKLGGK...",
        "....KKKLLKKK....",
        "......KSSK...Y..",
        ".....KHHAAK.....",
        "....KHPHAAAK....",
        "....KHHAAADK....",
        "...KHHAAAADDK...",
        "..Y.KHAAAADDK...",
        "...KHAAAADDDK...",
        "....KAADDDDK....",
        ".....KDDDNK.....",
        "......KKKK......",
        "................"
      ]
    },

    // 若木の芯：輪切りの断面。年輪の真ん中から、若葉色の樹液がにじむ（主の色）
    iconItemHeartwood: {
      palette: { ".": null, "K": "#1c130a", "X": "#4a3220", "D": "#8a6a42", "A": "#c8a070",
                 "H": "#e8c898", "Y": "#b8e07a" },
      pixels: [
        "................",
        "................",
        ".....KKKKKK.....",
        "...KKXXXXXXKK...",
        "..KXHHHHAAAAXK..",
        ".KXHHAAAAAAADXK.",
        ".KXHAADDDDAADXK.",
        "KXHAADAAAADAADXK",
        "KXHAADAYYADAADXK",
        "KXHAADAYYADAADXK",
        "KXHAADAAAADAADXK",
        ".KXAAADDDDAADXK.",
        ".KXAAAAAAAADDXK.",
        "..KXDAAAADDDXK..",
        "...KKXXXXXXKK...",
        ".....KKKKKK....."
      ]
    },

    // 琥珀の芯：千年樹の根底の主の胸にあった琥珀。真鍮の枠に収まり、中で光が揺れる
    iconItemAmberCore: {
      palette: { ".": null, "K": "#1c130a", "B": "#5a4316", "C": "#8a6a24", "T": "#c49a3a",
                 "J": "#7a3408", "O": "#c8661a", "Q": "#f0a030", "W": "#ffe08a" },
      pixels: [
        "................",
        ".....KKKKKK.....",
        "...KKCTTTTCKK...",
        "..KCTKKKKKKTCK..",
        "..KTKJJOOJJKTK..",
        ".KCKJOOQQOOJKCK.",
        ".KTKJOQWWQOJKTK.",
        ".KTKOQWWWQOOKTK.",
        ".KTKOQWQQQOJKTK.",
        ".KTKJOQQQOOJKTK.",
        ".KCKJJOOOOJJKCK.",
        "..KTKJJJJJJKTK..",
        "..KCTKKKKKKTCK..",
        "...KKCBBBBCKK...",
        ".....KKKKKK.....",
        "................"
      ]
    },

    // 千年樹の根底の素材（v1.0.3）
    // 琥珀のかけら：コハクカブトの背から欠けたもの
    iconItemAmberShard: {
      palette: { ".": null, "K": "#241206", "A": "#e8a030", "a": "#c47818", "D": "#7a4410",
                 "H": "#ffd884", "W": "#fff4cc", "i": "#6a3a0c" },
      pixels: [
        "................",
        ".......KK.......",
        "......KWHK......",
        ".....KWHAAK.....",
        "....KHAAAAaK....",
        "....KAAiAAaK....",
        "...KHAiiAAaaK...",
        "...KHAAiAAaaK...",
        "...KAAAAAaaDK...",
        "....KAAAaaDK....",
        "....KAaaaDK.....",
        ".....KaaDK......",
        "......KDK.......",
        ".......K........",
        "................",
        "................"
      ]
    },
    // 千年樹の樹液：とろりと落ちる琥珀色のしずく
    iconItemAncientSap: {
      palette: { ".": null, "K": "#4a2408", "S": "#e8a838", "s": "#c87e1a", "H": "#ffdc88", "W": "#fff6d0" },
      pixels: [
        "................",
        ".......KK.......",
        "......KHSK......",
        "......KHSK......",
        ".....KHSSSK.....",
        "....KHWSSSsK....",
        "...KHWSSSSSsK...",
        "...KHSSSSSSsK...",
        "...KSSSSSSSsK...",
        "...KSSSSSSssK...",
        "....KsSSSssK....",
        ".....KKsssKK....",
        ".......KKK......",
        "................",
        "................",
        "................"
      ]
    },
    // 真鍮の歯車：ウェポンの体から外れた歯車
    iconItemBrassGear: {
      palette: { ".": null, "K": "#1c130a", "B": "#c49a3a", "I": "#7c8698" },
      pixels: [
        "................",
        "......KKKK......",
        "...KK.KBBK.KK...",
        "..KBBKKBBKKBBK..",
        "..KBBBBBBBBBBK..",
        "...KBBKKKKBBK...",
        ".KKKBKIIIIKBKKK.",
        ".KBBBKIKKIKBBBK.",
        ".KBBBKIKKIKBBBK.",
        ".KKKBKIIIIKBKKK.",
        "...KBBKKKKBBK...",
        "..KBBBBBBBBBBK..",
        "..KBBKKBBKKBBK..",
        "...KK.KBBK.KK...",
        "......KKKK......",
        "................"
      ]
    },
    // 宝珠のかけら：ジュエルの体のかけら
    iconItemJewelShard: {
      palette: { ".": null, "K": "#141030", "G": "#7fe8e0", "g": "#2fb0c8", "D": "#1c6a8a", "W": "#f2ffff" },
      pixels: [
        "................",
        "................",
        "....KKKKKKKK....",
        "...KWWGGGGggK...",
        "..KWGGGGGGGggK..",
        "..KKKKKKKKKKKK..",
        "..KDgGGGGGGgDK..",
        "...KDgGGGGgDK...",
        "....KDgGGgDK....",
        ".....KDggDK.....",
        "......KDDK......",
        ".......KK.......",
        "................",
        "................",
        "................",
        "................"
      ]
    },

    // 若枝の剣：探索者の長剣の形。若葉色に光る刃と、葉のつば
    iconItemSproutBlade: {
      palette: { ".": null, "K": "#14200e", "H": "#f4ffe8", "B": "#b8e0a0", "D": "#5e9a48",
                 "G": "#4f9637", "g": "#84c95a", "A": "#6a4a2a", "a": "#4a3018", "O": "#84c95a" },
      pixels: [
        ".............K..",
        "............KHK.",
        "...........KHBK.",
        "..........KHBDK.",
        ".........KHBDK..",
        "........KHBDK...",
        ".....K.KHBDK....",
        "....KgKHBDK.....",
        "....KggBDK......",
        "...KKAGGK.......",
        "..KOAaKggK......",
        "..KOOK.KK.......",
        "...KOK..........",
        "....K...........",
        "................",
        "................"
      ]
    },

    // 若木の大剣：灼牙の戦刃の形（幅広）。木の刃と、葉のつば
    iconItemHeartwoodBlade: {
      palette: { ".": null, "K": "#1c130a", "H": "#e8c898", "B": "#a07a4a", "D": "#5c4229",
                 "G": "#2c5a22", "g": "#4f9637", "A": "#3a2817", "a": "#1c130a", "O": "#84c95a" },
      pixels: [
        "............K...",
        "...........KHK..",
        "..........KHBK..",
        ".........KHBBK..",
        "........KHBBBK..",
        ".......KHBBBDK..",
        "....K.KHBBBDK...",
        "...KgKHBBBDK....",
        "...KggBBBDK.....",
        "....KgGBDK......",
        "..KKAaGGK.......",
        ".KOOaKKggK......",
        "..KOOK.KK.......",
        "...KK...........",
        "................",
        "................"
      ]
    },

    // 眠花の杖：木の杖の先に桃色の花。まわりに花粉の粒（ユラツボミの色）
    iconItemSleepStaff: {
      palette: { ".": null, "K": "#2a1420", "A": "#e89ab8", "H": "#fcd8e6", "D": "#b8607e",
                 "Y": "#ffe36e", "g": "#4f9637", "S": "#8f6a42", "s": "#5c4229", "P": "#fff0a0" },
      pixels: [
        "...........KKK..",
        "..........KAHAK.",
        ".........KAHYHAK",
        ".........KDAHADK",
        "....P.....KDDDK.",
        ".........KgK..P.",
        "........KSsK....",
        ".......KSsK.....",
        "......KSsK......",
        ".....KSsK.......",
        "....KSsK........",
        "...KSsK.........",
        "..KSsK..........",
        ".KSsK...........",
        ".KKK............",
        "................"
      ]
    },

    // 眠りよけの鈴：金の鈴に桃色のひも。舌（中の玉）は花粉の色
    iconItemSleepWard: {
      palette: { ".": null, "K": "#3a2410", "H": "#fff0b0", "A": "#e8c060", "D": "#a87828",
                 "R": "#e89ab8", "r": "#b8607e", "P": "#f4b8cc" },
      pixels: [
        "................",
        "......KKKK......",
        ".....KRRrrK.....",
        "......KRrK......",
        ".....KKHHKK.....",
        "....KHHAAADK....",
        "....KHAAAADK....",
        "...KHHAAAAADK...",
        "...KHAAAAAADK...",
        "..KHHAAAAAADDK..",
        "..KHAAAAAAADDK..",
        ".KHAAAAAAAADDDK.",
        ".KKKKKKKKKKKKKK.",
        "......KPPK......",
        ".......KK.......",
        "................"
      ]
    },

    // 若葉の羽飾り：風切りの羽根の形を若葉色に。金のひも
    iconItemLeafPlume: {
      palette: { ".": null, "K": "#16260f", "A": "#5fa83f", "H": "#c8f0a0", "D": "#2f6a2a",
                 "R": "#e8c060", "r": "#a87828", "Q": "#c8f0a0" },
      pixels: [
        ".......KK.......",
        "......KHHK......",
        "..KK.KHDAHK.KK..",
        ".KHHKKHDADKKHHK.",
        "KHADHKHDADKHDAHK",
        "KHADDKHDADKHDADK",
        ".KHADKHDADKDADK.",
        "..KHDHKDDKHDDK..",
        "...KHDKDDKDDK...",
        "....KHKDDKHK....",
        ".....KRRRrK.....",
        ".....KRRRrK.....",
        "......KQQK......",
        "......KQQK......",
        ".......KK.......",
        "................"
      ]
    },

    // 若芽の護符：粘晶のネックレスの形。銀と若葉色の鎖に、芽の出た種
    iconItemSproutCharm: {
      palette: { ".": null, "K": "#1a1408", "C": "#c8d4d0", "c": "#84c95a", "A": "#c8a060",
                 "H": "#ecd29a", "D": "#8a6a3a", "W": "#fff4d0", "G": "#84c95a" },
      pixels: [
        "...K........K...",
        "..KCK......KCK..",
        "...KCK....KCK...",
        "...KcK....KcK...",
        "....KCK..KCK....",
        "....KcK..KcK....",
        ".....KCKKCK.....",
        ".....KCKKCK.....",
        "......KGGK......",
        ".....KHWAHK.....",
        "....KHWAAAHK....",
        "....KHAAAADK....",
        "....KHAAAADK....",
        ".....KHAADK.....",
        "......KHDK......",
        ".......KK......."
      ]
    },

    // 苔甲の鎧：厚革の胴着の形を甲羅の色に。肩と帯に苔
    iconItemMossShellArmor: {
      palette: { ".": null, "K": "#0e1410", "A": "#4f7d78", "H": "#86b0a8", "D": "#2b4a48",
                 "M": "#4f8a33", "F": "#a6d66a" },
      pixels: [
        "....KK....KK....",
        "..KKMMK..KMMKK..",
        ".KMFAAHKKHAAFMK.",
        "KHAAAAAHHAAAAAHK",
        "KHAAADAAAADAAADK",
        "KHAAAAAAAAAAAADK",
        ".KHAADAAAADAADK.",
        "..KHAAAAAAAADK..",
        "..KHADAAAADADK..",
        "..KMMMMFFMMMMK..",
        "..KHADAAAADADK..",
        "..KHAAAAAAAADK..",
        "...KHDDDDDDDK...",
        "....KKKKKKKK....",
        "................",
        "................"
      ]
    }
  });

  /**
   * コケ胞子（コケキノコの素材。2026-10-21）：眠り花粉と同じ形を、苔の緑に塗り替えた（仮の絵）。
   * まわりの粒は、コケキノコの笠のまだらと同じ黄緑
   */
  /**
   * 神鳥の羽（蘇生の道具。2026-10-21）：若葉の羽根と同じ形を、白と金に塗り替えた（仮の絵）
   */
  var leaf = (NS.rawData.sprites || {}).iconItemLeafFeather;
  if (leaf) {
    NS.extend("sprites", {
      iconItemDivineFeather: {
        pixels: leaf.pixels,
        palette: { ".": null, "K": "#4a3410", "N": "#9a7020", "D": "#c89a30", "A": "#f0d070",
                   "H": "#fff0b0", "P": "#fffbe8", "Q": "#ffffff" }
      }
    });
  }

  var pollen = (NS.rawData.sprites || {}).iconItemSleepPollen;
  if (pollen) {
    NS.extend("sprites", {
      iconItemMossSpore: {
        pixels: pollen.pixels,
        palette: { ".": null, "K": "#142014", "D": "#3f6a3a", "A": "#6f9a52", "H": "#b8d890", "Y": "#d8ec9a" }
      }
    });
  }

  /**
   * 風鳴りの羽（ツリガネの素材。2026-10-22）：灰の羽根と同じ形を、ツリガネの翼の黒紫に塗り替え、
   * 軸だけ風の色（薄い青緑）にした（仮の絵）
   */
  var ash = (NS.rawData.sprites || {}).iconItemAshFeather;
  if (ash) {
    NS.extend("sprites", {
      iconItemWindChimeFeather: {
        pixels: ash.pixels,
        palette: { ".": null, "K": "#07050c", "N": "#1e1830", "D": "#2c2444", "A": "#4a3e66",
                   "H": "#7a6a9c", "P": "#9a8cc0", "Q": "#d6f4ee" }
      }
    });
  }

  /**
   * 弔いの小鐘（ツリガネが落とす装備。2026-10-22）：黒紫の紐で吊った、くすんだ金の小さな鐘（仮の絵）
   */
  NS.extend("sprites", {
    iconItemMourningBell: {
      palette: { ".": null, "K": "#1a1408", "N": "#4a3a1c", "D": "#7a6030", "A": "#a88a48",
                 "H": "#d8bc78", "P": "#f4e6b8", "R": "#4a3e66" },
      pixels: [
        "................",
        ".......KK.......",
        "......KRRK......",
        "......KRRK......",
        ".....KKNNKK.....",
        "....KNDAHDNK....",
        "....KDAHPADK....",
        "...KNDAHPADNK...",
        "...KDAAHPAADK...",
        "...KDAAHHAADK...",
        "..KNDAAAAAADNK..",
        "..KDDAAAAAADDK..",
        ".KNNNNNNNNNNNNK.",
        ".KHPPHHHHHHPPHK.",
        "..KKKKKDDKKKKK..",
        ".......KK......."
      ]
    }
  });

  /**
   * 蒼雷の鱗（ザンガルドの素材。2026-10-26）：黄泉竜の鱗と同じ形を、ザンガルドの青に塗り替えた（作者が確定）
   */
  var scale = (NS.rawData.sprites || {}).iconItemDragonScale;
  if (scale) {
    NS.extend("sprites", {
      iconItemBlueThunderScale: {
        pixels: scale.pixels,
        palette: { ".": null, "K": "#0a0d24", "M": "#1d3a8a", "P": "#2a5cc0", "L": "#3f86e0",
                   "H": "#a8e0fa" }
      }
    });
  }

  /**
   * 金角のかけら（ザンガルドの素材。2026-10-26）：折れた金の角の先。根元の割れ口に雷の水色がのぞく（作者が確定）。
   * 色はザンガルドの角（sprites_marsh.js の thunderDragon の Y・G・y・l）
   */
  NS.extend("sprites", {
    iconItemGoldHornShard: {
      palette: { ".": null, "K": "#2a1606", "y": "#a8610f", "G": "#e09a14", "Y": "#ffc928",
                 "l": "#ffe35a", "W": "#fff6b8", "A": "#8ae8ff" },
      pixels: [
        "................",
        "..........K.....",
        ".........KWK....",
        ".........KlK....",
        "........KlYK....",
        "........KlYGK...",
        ".......KlYYGK...",
        ".......KlYGGK...",
        "......KlYYGyK...",
        "......KlYGGyK...",
        ".....KlYYGGyK...",
        ".....KWYGGyyK...",
        "....KAAWAyAAK...",
        "....KKAKAKAKK...",
        "......K.K.K.....",
        "................"
      ]
    }
  });

  /**
   * 蔦這う回廊の素材と装備（2026-10-27）。どれも既存の絵の形を借りて塗り替えた仮の絵（作者が見て決める）。
   *   灯り苔       … 光る鱗粉の形を、光る苔の緑に
   *   絡み主根     … ねじれ蔦の形を、根の茶色に
   *   痺れよけの鱗飾り … 毒よけの護符の形を、蒼雷の鱗の青と黄色の火花に
   *   声守りの鈴   … 眠りよけの鈴の形を、骨の白と風鳴りの羽の黒紫のひもに
   *   呪いよけの蔦輪 … 竜牙の指輪の形を、蔦の緑の輪と深淵の欠片の紫に
   *   風鳴りの胴衣 … 厚革の胴着の形を、ツリガネの黒紫と風の青緑に
   *   蒼雷の剣     … 若枝の剣の形を、青い刃と金のつばに
   *   蔦断ちの護符 … 若芽の護符の形を、蔦の鎖と灯り苔の光に
   */
  var sprites = NS.rawData.sprites || {};
  var recolor = {
    iconItemGlowMoss: { from: "iconItemGlowDust",
      palette: { ".": null, "K": "#0c1a10", "N": "#2f5a32", "D": "#5f9a4a", "Y": "#a8f070",
                 "H": "#d8ffb0", "W": "#f4fff0" } },
    iconItemTangledTaproot: { from: "iconItemTwistedVine",
      palette: { ".": null, "K": "#1a1008", "M": "#6a4424", "L": "#9a6a3a", "H": "#d0a070" } },
    iconItemParalysisWard: { from: "iconItemVenomWard",
      palette: { ".": null, "K": "#0a0d24", "C": "#4f7a2c", "I": "#a8e0fa", "J": "#3f86e0",
                 "Q": "#ffe35a", "G": "#b8d890" } },
    iconItemSealWard: { from: "iconItemSleepWard",
      palette: { ".": null, "K": "#14121c", "H": "#f4f4ec", "A": "#c8ccc4", "D": "#7a8080",
                 "R": "#4a3e66", "r": "#2c2444", "P": "#d6f4ee" } },
    iconItemCurseWard: { from: "iconItemFangRing",
      palette: { ".": null, "K": "#0c1410", "A": "#44704e", "H": "#a0d8a0", "D": "#24402c",
                 "F": "#b890e8", "G": "#6a4a9a", "V": "#8b6fd6" } },
    iconItemWindChimeVest: { from: "iconItemThickLeatherVest",
      palette: { ".": null, "K": "#07050c", "A": "#4a3e66", "H": "#7a6a9c", "D": "#2c2444",
                 "S": "#d6f4ee", "B": "#1e1830", "G": "#8ad8c8" } },
    iconItemBlueThunderBlade: { from: "iconItemSproutBlade",
      palette: { ".": null, "K": "#0a0d24", "H": "#e8f8ff", "B": "#a8e0fa", "D": "#2a5cc0",
                 "G": "#a8610f", "g": "#ffc928", "A": "#3a2817", "a": "#1c130a", "O": "#ffe35a" } },
    iconItemIvyBreakerCharm: { from: "iconItemSproutCharm",
      palette: { ".": null, "K": "#0c1410", "C": "#6aa070", "c": "#44704e", "A": "#5f9a4a",
                 "H": "#a8f070", "D": "#2f5a32", "W": "#f4fff0", "G": "#d8bc78" } }
  };
  var ivyIcons = {};
  for (var iconId in recolor) {
    var base = sprites[recolor[iconId].from];
    if (base) ivyIcons[iconId] = { pixels: base.pixels, palette: recolor[iconId].palette };
  }
  NS.extend("sprites", ivyIcons);

  /**
   * 2026-11-10 に足した道具・素材・装備（作者の案 新装備まとめ.txt）。
   * 既存の絵の形を借りて塗り替えた絵（作者が見て了承 11-10）。from が借りた形。
   * 札・指輪・胴着・剣の一部は、このあとの段で形から描き直した
   */
  var recolor1110 = {
    // 回復の道具
    iconItemNumbLeaf: { from: "iconItemAntidote",      // 解毒草の葉を、しびれの黄色に
      palette: { ".": null, "K": "#2a2408", "T": "#d8b830", "L": "#fff0a0", "D": "#8a7418", "S": "#7a6a3a" } },
    iconItemVoiceTonic: { from: "iconItemPotion",      // 回復薬の瓶を、封印の紫に
      palette: { ".": null, "K": "#2a2438", "C": "#a0703a", "W": "#c8e0f0", "H": "#ffffff",
                 "R": "#9a6ad8", "P": "#d0b0ff", "D": "#5a3a98" } },
    iconItemPurifyingSalt: { from: "iconItemGlowDust", // 光る鱗粉の山を、白い塩に
      palette: { ".": null, "K": "#1a1a20", "N": "#6a6a78", "D": "#b8b8c4", "Y": "#e8e8f0",
                 "H": "#f4f4fa", "W": "#ffffff" } },
    iconItemClearEyeDew: { from: "iconItemElixir",     // 深淵の雫を、澄んだ水色に
      palette: { ".": null, "K": "#0a1a2a", "V": "#3a8ac8", "L": "#8ad0f0", "D": "#1a4a78",
                 "C": "#c8f4ff", "W": "#ffffff", "Y": "#e8fcff" } },
    iconItemWakeFlower: { from: "iconItemHerb",        // 薬草を、桃色の花に
      palette: { ".": null, "K": "#3a1424", "L": "#ffc0d8", "G": "#e870a0", "D": "#a03a68", "S": "#7a9a3a" } },
    iconItemAncientHoney: { from: "iconItemElixir",    // 深淵の雫を、琥珀色の蜜に
      palette: { ".": null, "K": "#241206", "V": "#c47818", "L": "#e8a030", "D": "#7a4410",
                 "C": "#ffd884", "W": "#fff4cc", "Y": "#ffe8a8" } },
    iconItemGreatSpiritBerry: { from: "iconItemSpiritBerry", // 精気の実を、濃い青紫に
      palette: { ".": null, "K": "#140e3a", "B": "#7a6ae0", "H": "#f0e8ff", "D": "#3a2a9a",
                 "G": "#5ab84a", "S": "#6a4a2a" } },
    iconItemPanacea: { from: "iconItemPotion",         // 回復薬の瓶を、金色に
      palette: { ".": null, "K": "#2a1a08", "C": "#a0703a", "W": "#c8e0f0", "H": "#ffffff",
                 "R": "#e8b830", "P": "#fff0a0", "D": "#a87818" } },

    // 素材
    iconItemSunCrystal: { from: "iconItemJewelShard",  // 宝珠のかけらを、日向の黄色に
      palette: { ".": null, "K": "#2a1a06", "G": "#ffe080", "g": "#e8b030", "D": "#a86a10", "W": "#fffbe0" } },
    iconItemBreezeCrystal: { from: "iconItemJewelShard", // 宝珠のかけらを、風の青緑に
      palette: { ".": null, "K": "#06201a", "G": "#b0f4e0", "g": "#3aa088", "D": "#1a5a48", "W": "#f0fffa" } },

    // 防具
    iconItemAmberArmor: { from: "iconItemMossShellArmor",
      palette: { ".": null, "K": "#241206", "A": "#c47818", "H": "#ffd884", "D": "#7a4410",
                 "M": "#e8a030", "F": "#fff4cc" } },
    iconItemDuskDewCloak: { from: "iconItemMossCharm",
      palette: { ".": null, "K": "#0a0d1e", "A": "#2a3a6a", "H": "#4a5a9a", "D": "#18203e",
                 "N": "#06081a", "M": "#7a8ae0", "S": "#8a8098", "O": "#c8d8ff" } },
    iconItemScorchedShellArmor: { from: "iconItemStoneMail",
      palette: { ".": null, "K": "#2b0f08", "A": "#a8461e", "H": "#d8683a", "P": "#ff9a3c",
                 "D": "#6a2a10", "N": "#3d1608", "S": "#8c3a1e" } },

    // 武器
    iconItemFlameFangTachi: { from: "iconItemBlazeCharm",
      palette: { ".": null, "K": "#2b0808", "H": "#fff0c0", "B": "#ff7a2a", "D": "#c83a1a",
                 "G": "#4a3e66", "g": "#7a6a9c", "A": "#2a1a08", "a": "#140a04", "O": "#ffd040" } },
    iconItemRootboundSpear: { from: "iconItemMarshSpear",
      palette: { ".": null, "K": "#0a0d08", "A": "#b8c0a8", "a": "#5a6a50", "H": "#f0f4e8",
                 "B": "#b8c0a8", "D": "#5a6a50", "G": "#6a4424", "g": "#9a6a3a", "V": "#5f9a4a" } },
    iconItemVenomRapier: { from: "iconItemEmberBlade",
      palette: { ".": null, "K": "#0a0f08", "H": "#c8f0a0", "B": "#8a9a8a", "D": "#2e3a2a",
                 "G": "#3a4a30", "g": "#6a7a5a", "A": "#4a2a6a", "a": "#2a1440", "O": "#7fd06a",
                 "R": "#8b6fd6", "Y": "#e0ffc0" } },

    // アクセサリー
    iconItemSapCharm: { from: "iconItemSproutCharm",
      palette: { ".": null, "K": "#1a1008", "C": "#ffd884", "c": "#e8a030", "A": "#c47818",
                 "H": "#ffe8a8", "D": "#7a4410", "W": "#fff4cc", "G": "#84c95a" } },
    iconItemJewelNecklace: { from: "iconItemSlimeNecklace",
      palette: { ".": null, "K": "#141030", "C": "#d8bc78", "c": "#7fe8e0", "A": "#2fb0c8",
                 "H": "#c8fcff", "D": "#1c6a8a", "W": "#ffffff" } },
    iconItemAbyssNecklace: { from: "iconItemSlimeNecklace",
      palette: { ".": null, "K": "#0a0718", "C": "#8a8098", "c": "#a880e8", "A": "#6a3ab8",
                 "H": "#c8a8ff", "D": "#3a1a78", "W": "#f0e8ff" } },
    iconItemRadiantLantern: { from: "iconItemGlowLantern",
      palette: { ".": null, "K": "#14141e", "A": "#f4f4ff", "H": "#ffffff", "D": "#c8c8e8",
                 "N": "#8a8ab0", "M": "#3a3a58", "W": "#ffffff" } },
    iconItemJadeWindPlume: { from: "iconItemLeafPlume",
      palette: { ".": null, "K": "#06201a", "A": "#2fb08a", "H": "#b0f4e0", "D": "#146a52",
                 "R": "#8ae8ff", "r": "#3a8ac8", "Q": "#e0fff4" } },
    iconItemSevenWardRing: { from: "iconItemCrownCircle",
      palette: { ".": null, "K": "#1a1a20", "A": "#d8dce8", "H": "#ffffff", "D": "#8a90a8",
                 "B": "#e8445a", "L": "#ffd75e", "N": "#7fd06a" } },
    iconItemWraithBell: { from: "iconItemMourningBell",
      palette: { ".": null, "K": "#0a0d10", "N": "#2a3440", "D": "#5a6a78", "A": "#8a9aa8",
                 "H": "#c8d4d0", "P": "#eef4f0", "R": "#6a3ab8" } },
    iconItemHunterFangCharm: { from: "iconItemBoneCharm",
      palette: { ".": null, "K": "#2b0f08", "C": "#5a2211", "A": "#f0e8d8", "H": "#fffaf0",
                 "D": "#a89a80", "N": "#3d1608", "E": "#ffc928" } }
  };
  var icons1110 = {};
  for (var newIconId in recolor1110) {
    var newBase = sprites[recolor1110[newIconId].from];
    if (newBase) icons1110[newIconId] = { pixels: newBase.pixels, palette: recolor1110[newIconId].palette };
  }

  /**
   * 同じ形の使い回しを減らすため、新しく描き直した装備の絵（作者「使いまわし多いから、少し回しを減らす」2026-11-10）。
   * 札4枚は札の形をそろえたまま、真ん中の印だけをそれぞれ描いた（もとは4枚とも炎の印の塗り替え）。
   * 指輪3つ・胴着2つ・剣1つは形から描いた。
   */
  // 札の外側（炎よけの札と同じ）。真ん中の6行×6列だけ差し替える
  function wardWith(mark) {
    var top = ["......KCCK......", "....KKKCKKKK....", "...KHHHHHHHHK...", "...KHAAAAAADK..."];
    var bottom = ["...KHAAAAAADK...", "...KHNNNNNNDK...", "...KHAAAAAADK...", "...KHDDDDDDDK...",
                  "....KKKKKKKK....", "................"];
    var middle = [];
    for (var i = 0; i < mark.length; i++) middle.push("...KH" + mark[i] + "DK...");
    return top.concat(middle, bottom);
  }
  var wardPalette = function (card, mark) {
    return { ".": null, "K": "#180b09", "A": card[0], "H": card[1], "D": card[2],
             "R": mark[0], "O": mark[1], "C": "#7a4a2a", "N": "#5c3a30" };
  };
  var plainCard = ["#c8946a", "#e8b88a", "#8a5a40"];
  NS.extend("sprites", icons1110);
  NS.extend("sprites", {
    // 琥珀の雷札：琥珀色の札に、青い稲妻
    iconItemAmberThunderWard: {
      palette: wardPalette(["#e8a030", "#ffd884", "#a86a18"], ["#3f86e0", "#a8e0fa"]),
      pixels: wardWith(["AAAORA", "AAORAA", "AORRRA", "AAAORA", "AAORAA", "AORAAA"])
    },
    // 地よけの札：山の印（左が明るい面）
    iconItemEarthWard: {
      palette: wardPalette(plainCard, ["#6a4424", "#b08048"]),
      pixels: wardWith(["AAAAAA", "AAORAA", "AOORRA", "AORRRA", "OORRRR", "RRRRRR"])
    },
    // 風よけの札：巻いて流れる風の筋
    iconItemGaleWard: {
      palette: wardPalette(plainCard, ["#3aa088", "#7ae0c0"]),
      pixels: wardWith(["AAAAAA", "RRRRRA", "AAAARA", "AORRAA", "OOOOAA", "AAAAAA"])
    },
    // 陽よけの札：縁どりのある日輪と、四すみの光
    iconItemSunWard: {
      palette: wardPalette(plainCard, ["#e8b830", "#fff0a0"]),
      pixels: wardWith(["RAAAAR", "AROORA", "ROOOOR", "ROOOOR", "AROORA", "RAAAAR"])
    },

    // 雫の指輪：平たい銀の輪に、しずく形の水色の石
    iconItemDewdropRing: {
      palette: { ".": null, "K": "#071a2a", "A": "#b8c8d8", "H": "#f0f8ff", "D": "#6a7a90",
                 "V": "#5ad8f0", "G": "#a8e0fa", "W": "#e8ffff", "B": "#2a8ab8" },
      pixels: [
        "................",
        ".......KK.......",
        "......KWVK......",
        "......KWVK......",
        ".....KWGVVK.....",
        ".....KGVVVK.....",
        "....KWVVVVBK....",
        "....KGVVVVBK....",
        ".....KVVBBK.....",
        "...KHHKKKKADK...",
        "..KHAKK..KKADK..",
        "..KHK......KDK..",
        "..KHAKK..KKADK..",
        "...KHAAAAAADK...",
        "....KDDDDDDK....",
        ".....KKKKKK....."
      ]
    },
    // 炎の指輪：丸い鉄の輪に、ゆらぐ炎の石
    iconItemEmberRing: {
      palette: { ".": null, "K": "#180b09", "A": "#8c3a1e", "H": "#c85a2a", "D": "#5a2211",
                 "R": "#e8542a", "O": "#ff9a3c", "Y": "#ffe080" },
      pixels: [
        ".......K..K.....",
        "......KYK.KK....",
        ".....KOYKKOK....",
        ".....KOYYOOK....",
        "....KROYYOOK....",
        "....KRROOORK....",
        "....KKRRRRKK....",
        "...KHAKKKKADK...",
        "..KHAK....KADK..",
        "..KHK......KDK..",
        "..KHK......KDK..",
        "..KHK......KDK..",
        "..KHAK....KDDK..",
        "...KADKKKKDDK...",
        "....KDDDDDDK....",
        ".....KKKKKK....."
      ]
    },
    // 古木の指輪：木目の太い輪から、若葉が2枚芽吹く
    iconItemAncientWoodRing: {
      palette: { ".": null, "K": "#1c130a", "A": "#9a6a3a", "H": "#c8945a", "D": "#5c4229",
                 "N": "#3a2817", "S": "#6a4424", "L": "#c8f0a0", "G": "#5fa83f" },
      pixels: [
        "................",
        ".........KKK....",
        "...KKK..KLLLK...",
        "..KLLGK.KLGGK...",
        "..KLGGKKGGK.....",
        "...KKGKGKK......",
        ".....KSSK.......",
        "...KKHHSAAKK....",
        "..KHAAKKKKADK...",
        ".KHAK......KADK.",
        ".KNAK......KANK.",
        ".KHDK......KDDK.",
        "..KANKKKKKKDNK..",
        "...KDDAAAADDK...",
        "....KKKKKKKK....",
        "................"
      ]
    },

    // からくりの胴着：真鍮の胸当て。丸い肩当てと、胸に琥珀の芯の歯車
    iconItemClockworkVest: {
      palette: { ".": null, "K": "#1c140a", "A": "#a87828", "H": "#d8b060", "D": "#6a4a18",
                 "S": "#fff0c0", "B": "#3a2817", "G": "#6a5020", "g": "#e8c060", "O": "#ffb030" },
      pixels: [
        "................",
        "..KKK......KKK..",
        ".KHHAK....KAHHK.",
        ".KHAAKKKKKKAADK.",
        "..KKHAAAAAAADK..",
        "...KHAAKKKAADK..",
        "...KHAKGgGKADK..",
        "...KHKGgOgGKDK..",
        "...KHAKGgGKADK..",
        "...KHAAKKKAADK..",
        "...KHSAAAAASDK..",
        "...KHAAAAAAADK..",
        "....KHDDDDDDK...",
        "....KBBBBBBBK...",
        ".....KKKKKKK....",
        "................"
      ]
    },
    // 晴嵐の胴衣：頭巾つきの上着。前を金の留め具で閉じ、袖と胸に風の筋が流れる
    iconItemClearGaleVest: {
      palette: { ".": null, "K": "#08201a", "A": "#3aa088", "H": "#7ae0c0", "D": "#1a5a48",
                 "S": "#ffc840", "W": "#d0fff0" },
      pixels: [
        "......KKKK......",
        ".....KHHAAK.....",
        "....KHAKKAAK....",
        "....KHK..KDK....",
        "..KKKHAKKADKKK..",
        ".KHAKHAASAADKDK.",
        "KHAAKHAAKAADKADK",
        "KHWAKHAWKAADKADK",
        "KHAAKHAAKWWDKADK",
        "KHAAKHAAKAADKADK",
        ".KKKKHAAKAWDKKK.",
        "....KHAAKAADK...",
        "....KHAWKAADK...",
        "....KHDDKDDDK...",
        "....KKKKKKKKK...",
        "................"
      ]
    },

    // 歯車の大剣：真鍮の幅広の刃。峰に歯車の歯が2つ立ち、つばは丸い歯車
    iconItemGearGreatsword: {
      palette: { ".": null, "K": "#1c140a", "H": "#fff0c0", "B": "#d8b060", "D": "#8a6a28",
                 "G": "#6a5020", "g": "#c89830", "A": "#3a2817", "a": "#1c130a", "O": "#ffd884" },
      pixels: [
        "...........KKK..",
        "..........KHBDK.",
        ".........KHBBDDK",
        "........KHBBBDK.",
        ".......KHBBBDK..",
        "......KHBBBDDK..",
        ".....KHBBBDK....",
        "...KKKKHBBDK....",
        "..KgOgKHBDK.....",
        "..KOGOKBDK......",
        "..KgOgKKK.......",
        "..KKAKK.........",
        ".KAaK...........",
        "KAaK............",
        "KOK.............",
        ".K.............."
      ]
    },

    // 轟雷の剣：刃の縁が稲妻のように折れる。金のつば
    iconItemRoaringThunderBlade: {
      palette: { ".": null, "K": "#0a0d24", "H": "#ffffff", "B": "#ffe35a", "D": "#3f86e0",
                 "G": "#e09a14", "g": "#ffc928", "A": "#2a1a40", "a": "#140c24", "O": "#a8e0fa" },
      pixels: [
        "............KK..",
        "...........KHBK.",
        "..........KHBDK.",
        ".........KHBDK..",
        "........KHBBDK..",
        "..........KBDK..",
        ".........KHBK...",
        "........KHBDK...",
        ".......KHBBDK...",
        ".....K..KHDK....",
        "....KgK.KDK.....",
        "....KggKBK......",
        "...KKAGGK.......",
        "..KOAaKggK......",
        "..KOOK.KK.......",
        "...KOK.........."
      ]
    }
  });
})(window.MyGame);
