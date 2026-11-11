/**
 * recipes.js
 * 工房で作れるものの一覧（レシピ）。
 *
 * id         : 識別子
 * result     : 作れるもの { item, count }（アイテムid と個数）
 * materials  : 必要な素材 [{ item, count }]
 * gold       : 作るのに必要なゴールド。書かなければ無料（素材だけで作れる）
 * unlockedBy : このダンジョンをクリアするまで並ばない（省略で最初から作れる）
 * order      : 一覧での並び順（小さいほど先）
 *
 * ★ 作れるものを増やすときは、このファイルに1エントリ足すだけでよい。
 *   装備もアイテムの一種なので、回復薬と同じ書き方で作れる。
 */
(function (NS) {
  "use strict";

  NS.rawData.recipes = {
    potion: {
      id: "potion",
      order: 1,
      result: { item: "potion", count: 1 },
      materials: [ { item: "herb", count: 2 } ]
    },

    stoneBand: {
      id: "stoneBand",
      order: 2,
      result: { item: "stoneBand", count: 1 },
      materials: [ { item: "oreShard", count: 3 } ]
    },

    glowLantern: {
      id: "glowLantern",
      order: 3,
      result: { item: "glowLantern", count: 1 },
      materials: [
        { item: "glowDust", count: 2 },
        { item: "oreShard", count: 2 }
      ],
      unlockedBy: "mossyMine"
    },

    // ボスの落とすものを使う。倒す理由になるレシピ
    mossCharm: {
      id: "mossCharm",
      order: 4,
      result: { item: "mossCharm", count: 1 },
      materials: [
        { item: "mossyCore", count: 1 },
        { item: "oreShard", count: 6 }
      ],
      unlockedBy: "mossyMine"
    },

    /**
     * --- 灼熱の亀裂で集まる素材で作るもの ---
     *
     * 解放は「亀裂をクリア」ではなく「坑道をクリア」。
     * 素材は亀裂に潜っている最中に集まるので、クリアを待たせると
     * 素材を持っているのに作れない時間ができてしまう。
     * 灼牙の戦刃だけは主を倒さないと素材がそろわないので、
     * 一覧に出しておいても先に作られる心配はない。
     */

    swiftPlume: {
      id: "swiftPlume",
      order: 5,
      result: { item: "swiftPlume", count: 1 },
      materials: [
        { item: "ashFeather", count: 3 },
        { item: "emberAsh", count: 3 }
      ],
      unlockedBy: "mossyMine"
    },

    emberWard: {
      id: "emberWard",
      order: 6,
      result: { item: "emberWard", count: 1 },
      materials: [
        { item: "emberAsh", count: 3 },
        { item: "ashFeather", count: 2 }
      ],
      unlockedBy: "mossyMine"
    },

    // 亀裂の素材で作る武器。火の技を使う仲間向け
    emberBlade: {
      id: "emberBlade",
      order: 7,
      result: { item: "emberBlade", count: 1 },
      materials: [
        { item: "emberAsh", count: 2 },
        { item: "scorchedShell", count: 1 },
        { item: "oreShard", count: 2 }
      ],
      unlockedBy: "mossyMine"
    },

    // 灼熱の獣の落とすものを使う。苔の外套（守り）に対する、攻めの装備
    blazeCharm: {
      id: "blazeCharm",
      order: 8,
      result: { item: "blazeCharm", count: 1 },
      materials: [
        { item: "blazingFang", count: 1 },
        { item: "scorchedShell", count: 2 },
        { item: "ashFeather", count: 1 }
      ],
      unlockedBy: "mossyMine"
    },

    /**
     * --- 静寂の深層で集まる素材で作るもの ---
     *
     * 亀裂のときと同じで、解放は「深層をクリア」ではなく「亀裂をクリア」。
     * 素材は深層に潜っている最中に集まるので、クリアを待たせると
     * 素材を持っているのに作れない時間ができてしまう。
     * 黄泉鱗の鎧だけはヨミリュウ（B4Fのみ・出現16%）を倒さないと素材がそろわないので、
     * 一覧に出しておいても先に作られる心配はない。
     */

    duskWard: {
      id: "duskWard",
      order: 9,
      result: { item: "duskWard", count: 1 },
      materials: [
        { item: "duskDew", count: 3 },
        { item: "slimeShard", count: 2 }
      ],
      unlockedBy: "scorchingFissure"
    },

    stormVeil: {
      id: "stormVeil",
      order: 10,
      result: { item: "stormVeil", count: 1 },
      materials: [
        { item: "stormWing", count: 2 },
        { item: "twistedVine", count: 2 }
      ],
      unlockedBy: "scorchingFissure"
    },

    // 深層の素材で作る武器。攻撃は戦刃に届かないが速さも付く
    abyssFang: {
      id: "abyssFang",
      order: 11,
      result: { item: "abyssFang", count: 1 },
      materials: [
        { item: "abyssFragment", count: 2 },
        { item: "slimeShard", count: 2 },
        { item: "duskDew", count: 1 }
      ],
      unlockedBy: "scorchingFissure"
    },

    // 黄泉竜の鱗を使う。ヨミリュウを狩る理由になるレシピ
    dragonGuard: {
      id: "dragonGuard",
      order: 12,
      result: { item: "dragonGuard", count: 1 },
      materials: [
        { item: "dragonScale", count: 1 },
        { item: "twistedVine", count: 3 },
        { item: "abyssFragment", count: 2 }
      ],
      unlockedBy: "scorchingFissure"
    },

    // 深層の主の落とすものを使う。ステージ3を締めくくる装備
    crownCircle: {
      id: "crownCircle",
      order: 13,
      result: { item: "crownCircle", count: 1 },
      materials: [
        { item: "crownShard", count: 1 },
        { item: "dragonScale", count: 1 },
        { item: "abyssFragment", count: 3 }
      ],
      unlockedBy: "scorchingFissure"
    },

    /**
     * --- 腐食の毒沼で集まる素材で作るもの ---
     *
     * 亀裂・深層と同じで、解放は「毒沼をクリア」ではなく「深層をクリア」。
     * 素材は沼に潜っている最中に集まるので、クリアを待たせると
     * 素材を持っているのに作れない時間ができてしまう。
     *
     * ★ 毒よけの護符は**主の素材を使わない**。
     *   毒沼は歩くだけで削られる場所なので、その答えは
     *   主を倒す前に手に入らないと意味がない。
     *   毒嚢を使う「毒沼の冠」だけが、主を倒してから作れる。
     */

    // 毒沼の答え。毒耐性 +7（通る確率が3割になる）
    venomWard: {
      id: "venomWard",
      order: 14,
      result: { item: "venomWard", count: 1 },
      materials: [
        { item: "venomStinger", count: 2 },
        { item: "muddyShell", count: 2 }
      ],
      unlockedBy: "silentDepths"
    },

    // 石の帽子（防+4）の上位。深層の素材で作る中堅の防具
    mireArmor: {
      id: "mireArmor",
      order: 15,
      result: { item: "mireArmor", count: 1 },
      materials: [
        { item: "muddyShell", count: 3 },
        { item: "rustedBone", count: 2 }
      ],
      unlockedBy: "silentDepths"
    },

    // 毒沼の素材で作る武器。闇の技を使う仲間向け
    marshSpear: {
      id: "marshSpear",
      order: 16,
      result: { item: "marshSpear", count: 1 },
      materials: [
        { item: "rustedBone", count: 2 },
        { item: "abyssFragment", count: 2 }
      ],
      unlockedBy: "silentDepths"
    },

    // 沼の主の毒嚢を使う。毒沼を抜けた証になる装備
    venomCrown: {
      id: "venomCrown",
      order: 17,
      result: { item: "venomCrown", count: 1 },
      materials: [
        { item: "venomSac", count: 1 },
        { item: "rustedBone", count: 2 },
        { item: "abyssFragment", count: 2 }
      ],
      unlockedBy: "silentDepths"
    },

    /**
     * --- スライムのかけらで作るもの（RC-1） ---
     *
     * かけらは深層で大量に余るので、その使い道として作者が考えた3つ。
     * 素材はかけらだけで、ほかと同じくお金は要らない。
     * 解放は深層をクリアしてから（作者の指定）
     */

    slimeBlade: {
      id: "slimeBlade",
      order: 18,
      result: { item: "slimeBlade", count: 1 },
      materials: [ { item: "slimeShard", count: 4 } ],
      unlockedBy: "silentDepths"
    },

    slimeMail: {
      id: "slimeMail",
      order: 19,
      result: { item: "slimeMail", count: 1 },
      materials: [ { item: "slimeShard", count: 5 } ],
      unlockedBy: "silentDepths"
    },

    slimeNecklace: {
      id: "slimeNecklace",
      order: 20,
      result: { item: "slimeNecklace", count: 1 },
      materials: [ { item: "slimeShard", count: 5 } ],
      unlockedBy: "silentDepths"
    },

    /**
     * --- 萌芽の穴・若葉の洞で集まる素材で作るもの（v1.0.0）---
     *
     * 解放は「毒沼をクリア」（萌芽の穴が開くのと同じとき）。素材は若葉の洞に潜っている最中に集まるので、
     * 亀裂・深層・毒沼と同じく、その区画のクリアは待たせない。
     * 揺籃の穴の素材（鉱石のかけら・泥甲羅・灰の羽根）も使う。
     * ★ 眠りよけの鈴は主の素材を使わない（毒よけの護符と同じ理由。眠りが初めて出る区画なので、主の前に要る）。
     *   若芽の護符はコダマ（珍しい）、若木の大剣は主を倒さないと素材がそろわない。
     * ★ 店で素材を買って作って売っても得をしないことを確かめてある（材料の買値の合計 ＞ 売値）
     */

    sleepWard: {
      id: "sleepWard",
      order: 21,
      result: { item: "sleepWard", count: 1 },
      materials: [
        { item: "sleepPollen", count: 2 },
        { item: "shedHusk", count: 2 }
      ],
      unlockedBy: "venomMarsh"
    },

    leafPlume: {
      id: "leafPlume",
      order: 22,
      result: { item: "leafPlume", count: 1 },
      materials: [
        { item: "leafFeather", count: 3 },
        { item: "ashFeather", count: 1 }
      ],
      unlockedBy: "venomMarsh"
    },

    sproutBlade: {
      id: "sproutBlade",
      order: 23,
      result: { item: "sproutBlade", count: 1 },
      materials: [
        { item: "leafFeather", count: 2 },
        { item: "shedHusk", count: 3 },
        { item: "oreShard", count: 2 }
      ],
      unlockedBy: "venomMarsh"
    },

    mossShellArmor: {
      id: "mossShellArmor",
      order: 24,
      result: { item: "mossShellArmor", count: 1 },
      materials: [
        { item: "mossyShell", count: 2 },
        { item: "muddyShell", count: 2 }
      ],
      unlockedBy: "venomMarsh"
    },

    // ユラツボミの花粉を使う杖（作者が考えたもの）。
    // 材料の買値 430G ＞ 売値 300G（2026-11-10 に素材の値段が上がって、作って売っても得をしなくなった）
    sleepStaff: {
      id: "sleepStaff",
      order: 25,
      result: { item: "sleepStaff", count: 1 },
      materials: [
        { item: "sleepPollen", count: 3 },
        { item: "leafFeather", count: 1 },
        { item: "shedHusk", count: 1 }
      ],
      unlockedBy: "venomMarsh"
    },

    // コダマの種を使う。珍しい相手を探す理由になるレシピ
    sproutCharm: {
      id: "sproutCharm",
      order: 26,
      result: { item: "sproutCharm", count: 1 },
      materials: [
        { item: "sproutSeed", count: 1 },
        { item: "sleepPollen", count: 2 },
        { item: "shedHusk", count: 1 }
      ],
      unlockedBy: "venomMarsh"
    },

    // 若葉の洞の主の芯を使う。区画を抜けた証になる装備
    heartwoodBlade: {
      id: "heartwoodBlade",
      order: 27,
      result: { item: "heartwoodBlade", count: 1 },
      materials: [
        { item: "heartwood", count: 1 },
        { item: "mossyShell", count: 2 },
        { item: "shedHusk", count: 2 }
      ],
      unlockedBy: "venomMarsh"
    },

    /**
     * --- 萌芽の穴・蔦這う回廊の素材で作るもの（作者の指定 2026-10-27。名前は 2026-10-28 に確定）---
     *
     * ★ 解放は前の区画（若葉の洞）のクリア。ほかの区画の作り方と同じ（作者の指定 2026-10-30）。
     * ★ 店で素材を買って作って売っても得をしないことを確かめてある（材料の買値の合計 ＞ 売値）。
     *   風鳴りの胴衣：買値 385G ＞ 売値 310G ／ 蒼雷の剣：金角のかけらは店に無い
     *   蔦断ちの護符：絡み主根・弔いの小鐘は店に無い
     */

    paralysisWard: {
      id: "paralysisWard",
      order: 28,
      result: { item: "paralysisWard", count: 1 },
      materials: [
        { item: "blueThunderScale", count: 2 },
        { item: "mossSpore", count: 2 }
      ],
      unlockedBy: "sproutHollow"
    },

    sealWard: {
      id: "sealWard",
      order: 29,
      result: { item: "sealWard", count: 1 },
      materials: [
        { item: "windChimeFeather", count: 2 },
        { item: "rustedBone", count: 2 }
      ],
      unlockedBy: "sproutHollow"
    },

    curseWard: {
      id: "curseWard",
      order: 30,
      result: { item: "curseWard", count: 1 },
      materials: [
        { item: "twistedVine", count: 3 },
        { item: "abyssFragment", count: 1 }
      ],
      unlockedBy: "sproutHollow"
    },

    windChimeVest: {
      id: "windChimeVest",
      order: 31,
      result: { item: "windChimeVest", count: 1 },
      materials: [
        { item: "windChimeFeather", count: 3 },
        { item: "twistedVine", count: 2 }
      ],
      unlockedBy: "sproutHollow"
    },

    blueThunderBlade: {
      id: "blueThunderBlade",
      order: 32,
      result: { item: "blueThunderBlade", count: 1 },
      materials: [
        { item: "blueThunderScale", count: 3 },
        { item: "goldHornShard", count: 1 },
        { item: "rustedBone", count: 2 }
      ],
      unlockedBy: "sproutHollow"
    },

    // 宝箱でしか出ない絡み主根（B4F）と、ツリガネの落とす弔いの小鐘を使う。回廊を歩き尽くした証になる護符
    ivyBreakerCharm: {
      id: "ivyBreakerCharm",
      order: 33,
      result: { item: "ivyBreakerCharm", count: 1 },
      materials: [
        { item: "tangledTaproot", count: 1 },
        { item: "glowMoss", count: 3 },
        { item: "mourningBell", count: 1 }
      ],
      unlockedBy: "sproutHollow"
    },

    /**
     * ================================================================
     * 2026-11-10 に足したレシピ（作者の案 新装備まとめ.txt。材料は作者が決めたもの）
     * ================================================================
     * 解放は作者の書いた「ひとつ前のステージクリア後」＝千年樹の根底の1つ前の、回廊クリア（作者の確認 2026-11-10）。表の19個はすべて回廊クリア。
     * 「その他」の6つ（灼殻の鎧・燃え殻の指輪＝坑道、毒針の細剣・土よけの札＝深層、嵐よけの札・陽よけの札＝毒沼）は、作者が書いた区画。
     *
     * ★ 材料が全部店で買えるものは、作って売っても得をしないか確かめた（材料の買値 ＞ 売値）
     *   （2026-11-10 の素材の値上げのあとの値）
     *   灼殻の鎧    215G ＞ 150G     燃え殻の指輪 100G ＞ 90G     毒針の細剣 200G ＞ 140G
     *   土よけの札  130G ＞ 85G      嵐よけの札  235G ＞ 130G     陽よけの札 210G ＞ 120G
     *   翠風の羽飾り 315G ＞ 280G（風切りの羽根は 灰の羽根×3＋燃え殻×3 の 195G で数えた）
     *   聖輝の提灯  若芽の種（店に無い）を使う。店の分だけで 625G ＞ 450G（光る提灯は工房で作ると 150G。11-10 に材料を増やした）
     *   晴嵐の胴衣  705G ＞ 600G（風鳴りの胴衣は 風鳴りの羽×3＋ねじれ蔦×2 の 385G）
     *   琥珀の雷よけ札 210G ＞ 120G  琥珀の鎧 770G ＞ 425G（11-10 に材料を増やした）
     *   ほかは店に無い素材（主の素材・深淵の欠片・金角のかけら・絡み主根・若芽の種・宝珠のかけら・落とす装備）を使う
     *
     * ★ 反対に「材料をそのまま売るほうが、作った装備を売るより高い」ものが無いようにしてある（2026-11-10。作者）。
     *   素材の値上げで21個がそうなったので、装備の売値が材料の売値の約1.1倍になるように値段を上げた
     *   （灼牙の戦刃 400・黄泉鱗の鎧 520・王冠の輪 750・毒よけの護符 300・泥重の甲 410・毒沼の冠 670・眠りよけの鈴 390・
     *    若枝の剣 500・若芽の護符 460・若木の大剣 720・痺れよけの鱗飾り 390・声守りの鈴 350・蔦断ちの護符 1550・深淵の首飾り 340・
     *    嵐よけの札 260・陽よけの札 240・聖輝の提灯 900・琥珀の雷よけ札 240・琥珀の鎧 850・機巧の胴衣 1200・七護の環 2700）。
     *   七護の環は材料の護符が上がったぶん。素材や装備の値段を変えたら、道具の見本（item-viewer.html）か早見表で両方を確かめる
     */

    // --- 坑道クリア ---
    scorchedShellArmor: {
      id: "scorchedShellArmor",
      order: 34,
      result: { item: "scorchedShellArmor", count: 1 },
      materials: [
        { item: "scorchedShell", count: 2 },
        { item: "ashFeather", count: 1 },
        { item: "oreShard", count: 2 }
      ],
      unlockedBy: "mossyMine"
    },
    emberRing: {
      id: "emberRing",
      order: 35,
      result: { item: "emberRing", count: 1 },
      materials: [
        { item: "emberAsh", count: 2 },
        { item: "scorchedShell", count: 1 }
      ],
      unlockedBy: "mossyMine"
    },

    // --- 回廊クリア（作者の表「ひとつ前のステージクリア後」＝千年樹の根底の1つ前の回廊。作者の確認 11-10） ---
    dewdropRing: {
      id: "dewdropRing",
      order: 36,
      result: { item: "dewdropRing", count: 1 },
      materials: [
        { item: "crownShard", count: 1 },
        { item: "slimeShard", count: 4 },
        { item: "duskDew", count: 1 }
      ],
      unlockedBy: "ivyCorridor"
    },
    duskDewCloak: {
      id: "duskDewCloak",
      order: 37,
      result: { item: "duskDewCloak", count: 1 },
      materials: [
        { item: "mossCharm", count: 1 },
        { item: "duskDew", count: 3 },
        { item: "abyssFragment", count: 1 }
      ],
      unlockedBy: "ivyCorridor"
    },
    abyssNecklace: {
      id: "abyssNecklace",
      order: 40,
      result: { item: "abyssNecklace", count: 1 },
      materials: [
        { item: "abyssFragment", count: 2 },
        { item: "venomStinger", count: 1 },
        { item: "twistedVine", count: 1 }
      ],
      unlockedBy: "ivyCorridor"
    },
    jadeWindPlume: {
      id: "jadeWindPlume",
      order: 43,
      result: { item: "jadeWindPlume", count: 1 },
      materials: [
        { item: "swiftPlume", count: 1 },
        { item: "leafFeather", count: 1 },
        { item: "ashFeather", count: 1 }
      ],
      unlockedBy: "ivyCorridor"
    },

    // --- 深層クリア（作者の表の「その他」） ---
    venomRapier: {
      id: "venomRapier",
      order: 38,
      result: { item: "venomRapier", count: 1 },
      materials: [
        { item: "venomStinger", count: 2 },
        { item: "rustedBone", count: 1 },
        { item: "oreShard", count: 1 }
      ],
      unlockedBy: "silentDepths"
    },
    earthWard: {
      id: "earthWard",
      order: 39,
      result: { item: "earthWard", count: 1 },
      materials: [
        { item: "oreShard", count: 2 },
        { item: "muddyShell", count: 1 }
      ],
      unlockedBy: "silentDepths"
    },

    // --- 毒沼クリア（作者の表の「その他」。結晶は毒沼クリアで店に並ぶ） ---
    galeWard: {
      id: "galeWard",
      order: 41,
      result: { item: "galeWard", count: 1 },
      materials: [
        { item: "breezeCrystal", count: 2 },
        { item: "leafFeather", count: 1 }
      ],
      unlockedBy: "venomMarsh"
    },
    sunWard: {
      id: "sunWard",
      order: 42,
      result: { item: "sunWard", count: 1 },
      materials: [
        { item: "sunCrystal", count: 2 },
        { item: "glowDust", count: 1 }
      ],
      unlockedBy: "venomMarsh"
    },

    // --- 回廊クリア（続き。回廊の素材・回廊で手に入る装備を使うもの） ---
    radiantLantern: {
      id: "radiantLantern",
      order: 44,
      result: { item: "radiantLantern", count: 1 },
      materials: [
        { item: "glowLantern", count: 1 },
        { item: "glowMoss", count: 3 },
        { item: "glowDust", count: 3 },
        { item: "sunCrystal", count: 2 },
        { item: "sproutSeed", count: 1 }
      ],
      unlockedBy: "ivyCorridor"
    },
    // 7つのよけを1つずつ（着けているものは数えない。持ち物にあるものだけ）
    sevenWardRing: {
      id: "sevenWardRing",
      order: 45,
      result: { item: "sevenWardRing", count: 1 },
      materials: [
        { item: "venomWard", count: 1 },
        { item: "boneCharm", count: 1 },
        { item: "sleepWard", count: 1 },
        { item: "paralysisWard", count: 1 },
        { item: "sealWard", count: 1 },
        { item: "curseWard", count: 1 },
        { item: "abyssNecklace", count: 1 }
      ],
      unlockedBy: "ivyCorridor"
    },
    flameFangTachi: {
      id: "flameFangTachi",
      order: 46,
      result: { item: "flameFangTachi", count: 1 },
      materials: [
        { item: "blazeCharm", count: 1 },
        { item: "blazingFang", count: 1 },
        { item: "scorchedShell", count: 3 },
        { item: "windChimeFeather", count: 2 }
      ],
      unlockedBy: "ivyCorridor"
    },
    rootboundSpear: {
      id: "rootboundSpear",
      order: 47,
      result: { item: "rootboundSpear", count: 1 },
      materials: [
        { item: "marshSpear", count: 1 },
        { item: "tangledTaproot", count: 1 },
        { item: "rustedBone", count: 2 }
      ],
      unlockedBy: "ivyCorridor"
    },
    clearGaleVest: {
      id: "clearGaleVest",
      order: 48,
      result: { item: "clearGaleVest", count: 1 },
      materials: [
        { item: "windChimeVest", count: 1 },
        { item: "breezeCrystal", count: 2 },
        { item: "sunCrystal", count: 2 }
      ],
      unlockedBy: "ivyCorridor"
    },
    ancientWoodRing: {
      id: "ancientWoodRing",
      order: 49,
      result: { item: "ancientWoodRing", count: 1 },
      materials: [
        { item: "heartwood", count: 1 },
        { item: "mossyShell", count: 2 },
        { item: "mossSpore", count: 2 }
      ],
      unlockedBy: "ivyCorridor"
    },
    wraithBell: {
      id: "wraithBell",
      order: 50,
      result: { item: "wraithBell", count: 1 },
      materials: [
        { item: "boneCharm", count: 1 },
        { item: "mourningBell", count: 1 },
        { item: "abyssFragment", count: 2 }
      ],
      unlockedBy: "ivyCorridor"
    },
    hunterFangCharm: {
      id: "hunterFangCharm",
      order: 51,
      result: { item: "hunterFangCharm", count: 1 },
      materials: [
        { item: "blazingFang", count: 1 },
        { item: "goldHornShard", count: 1 },
        { item: "rustedBone", count: 2 }
      ],
      unlockedBy: "ivyCorridor"
    },

    // --- 回廊クリア（千年樹の根底の素材） ---
    amberThunderWard: {
      id: "amberThunderWard",
      order: 52,
      result: { item: "amberThunderWard", count: 1 },
      materials: [
        { item: "amberShard", count: 1 },
        { item: "ancientSap", count: 1 }
      ],
      unlockedBy: "ivyCorridor"
    },
    amberArmor: {
      id: "amberArmor",
      order: 53,
      result: { item: "amberArmor", count: 1 },
      materials: [
        { item: "amberShard", count: 5 },
        { item: "mossyShell", count: 2 },
        { item: "ancientSap", count: 1 }
      ],
      unlockedBy: "ivyCorridor"
    },
    gearGreatsword: {
      id: "gearGreatsword",
      order: 54,
      result: { item: "gearGreatsword", count: 1 },
      materials: [
        { item: "brassGear", count: 3 },
        { item: "amberCore", count: 1 }
      ],
      unlockedBy: "ivyCorridor"
    },
    roaringThunderBlade: {
      id: "roaringThunderBlade",
      order: 55,
      result: { item: "roaringThunderBlade", count: 1 },
      materials: [
        { item: "blueThunderBlade", count: 1 },
        { item: "brassGear", count: 2 },
        { item: "goldHornShard", count: 1 }
      ],
      unlockedBy: "ivyCorridor"
    },
    sapCharm: {
      id: "sapCharm",
      order: 56,
      result: { item: "sapCharm", count: 1 },
      materials: [
        { item: "ancientSap", count: 3 },
        { item: "sproutSeed", count: 1 }
      ],
      unlockedBy: "ivyCorridor"
    },
    jewelNecklace: {
      id: "jewelNecklace",
      order: 57,
      result: { item: "jewelNecklace", count: 1 },
      materials: [
        { item: "jewelShard", count: 1 },
        { item: "amberShard", count: 2 },
        { item: "tangledTaproot", count: 1 }
      ],
      unlockedBy: "ivyCorridor"
    },
    clockworkVest: {
      id: "clockworkVest",
      order: 58,
      result: { item: "clockworkVest", count: 1 },
      materials: [
        { item: "amberCore", count: 1 },
        { item: "ancientSap", count: 2 },
        { item: "brassGear", count: 3 }
      ],
      unlockedBy: "ivyCorridor"
    }
  };
})(window.MyGame);
