/**
 * items.js
 * アイテムの定義。
 *
 * id          : 識別子
 * name        : 表示名
 * category    : 分類id（categories.js の item を参照）
 * icon        : 一覧で名前の左に出す 16×16 の絵（data/sprites_icons.js の iconItem〇〇）。
 *               書かなければ絵なしで名前だけ出る
 * from        : 素材が手に入るステージ（data/dungeons.js のid）。
 *               図鑑と店の一覧で、素材をステージごとに小見出し（「苔むす坑道」など）で分ける。
 *               いくつかのステージで出る素材は、最初に手に入るステージを書く
 * description : 図鑑・持ち物画面での説明文
 * maxStack    : 1種類あたりの所持上限
 * price       : ショップでの買値。0 にすると売り買いできない（重要アイテムなど）
 *   売値は data/shop.js の sellRate を掛けた額になる
 * effect      : 使ったときの効果（無い場合は使用できない）
 *   type  : "healHp" … HPを回復する（value で効果量）
 *           "escape" … その場から拠点へ帰る（相手を選ばない）
 *           "scoutBoost" … 使った次のターンから、その戦闘のあいだスカウトの成功率に multiplier を掛ける
 *                          （相手を選ばない。重ねても上がらない。BattleScene._resolveScoutBoost）
 *   value : 効果量
 * usableIn    : 使える場面。
 *     "home"    … 拠点の持ち物画面
 *     "dungeon" … 探索中の持ち物画面（I キー）
 *     "battle"  … 戦闘中
 * equip       : 装備品ならここに効果を書く（持ち物・ドロップ・ショップは共通の仕組みで扱える）
 *   slot    : 枠。"weapon"（武器）/ "armor"（防具）/ "accessory"（アクセサリー）
 *             枠の数は config.js の equipSlots（武器1・防具1・アクセサリー2）。
 *             書かなければアクセサリー扱い
 *   effects : 特性と同じ形式の配列（data/abilities.js の説明を参照）
 *     statMultiplier … ステータスに倍率
 *     statBonus      … ステータスに加算（装備でよく使う）
 *     damageDealt / damageTaken … 与える／受けるダメージに倍率
 *
 * ★ 数値は「4枠を同時に着ける」前提で決めてある（α-7 で1枠→4枠にしたときに下げた）。
 *   statBonus はレベルで増えないので、序盤ほど効きが大きい。
 *   攻撃の加算は 武器＋アクセサリー2つ で足し合わさることを忘れないこと。
 *   同じ装備は2つ着けられない（Game.equipItem）。
 *
 * ★ 新しいアイテムの追加は、このファイルに1エントリ足すだけでよい。
 */
(function (NS) {
  "use strict";

  NS.rawData.items = {
    herb: {
      id: "herb",
      name: "薬草",
      icon: "iconItemHerb",
      category: "heal",
      description: "そのへんに生えている草。HPを少し回復する。",
      maxStack: 99,
      price: 20,
      effect: { type: "healHp", value: 20 },
      usableIn: ["home", "dungeon", "battle"]
    },

    /**
     * 神鳥の羽（v1.0.0。名前と効き目は作者が決めたもの 2026-10-21）。倒れた仲間1体を、HP55%で起こす。
     * このゲームで初めての蘇生の道具（効果の種類 revive。ItemUsage）。戦闘中も探索中も拠点でも使える。
     * 戦闘では倒れた仲間にしか向けられない（BattleScene._canTarget）。
     * 店では買えない。いまはシニガミが落とす（25%）だけ。
     * ★ のちに足す、ある部族の店で 2500G で買える予定（作者）。price はその値段にしてある。
     *   売れない（unsellable。作者の指定。ShopSystem.getSellPrice が0を返す）
     */
    divineFeather: {
      id: "divineFeather",
      name: "神鳥の羽",
      icon: "iconItemDivineFeather",
      category: "heal",
      description: "神鳥が落としたと伝わる羽。倒れた仲間1体を、HPを半分ほど戻して起こす。",
      maxStack: 99,
      price: 2500,
      unsellable: true,
      effect: { type: "revive", hpRatio: 0.55 },
      usableIn: ["home", "dungeon", "battle"]
    },

    potion: {
      id: "potion",
      name: "回復薬",
      icon: "iconItemPotion",
      category: "heal",
      description: "よく効く薬。HPをそれなりに回復する。",
      maxStack: 99,
      price: 50,
      effect: { type: "healHp", value: 50 },
      usableIn: ["home", "dungeon", "battle"]
    },

    /**
     * 回復薬（50G / 50回復）の上位。毒沼をクリアすると店に並ぶ。
     *
     * ★ 1回復あたりの値段は回復薬より高い（1G → 2.5G）。
     *   それでも要るのは、**1ターンで100戻せる**から。
     *   回復薬2本と同じ量を、半分の手数で入れられることに払う値段。
     */
    elixir: {
      id: "elixir",
      name: "深淵の雫",
      icon: "iconItemElixir",
      category: "heal",
      description: "深淵の底で採れる雫。HPを大きく回復する。",
      // RC-1 で 9 → 99（作者の指定。回復の道具はそろえて 99）
      maxStack: 99,
      price: 250,
      effect: { type: "healHp", value: 100 },
      usableIn: ["home", "dungeon", "battle"]
    },

    /**
     * 毒を治す。
     *
     * ★ 毒は戦闘が終わっても消えず、ダンジョンを歩くあいだも5歩ごとに削ってくる。
     *   拠点へ帰れば消えるので、これは「帰るまで持たせる」ための薬。
     *   帰還の石（80G）より安くしてあるのは、
     *   「毒を治す」と「引き返す」が同じ値段だと、常に引き返すほうが得になるため。
     *
     * ★ 治せる状態異常は effect.statuses で決める。
     *   麻痺・眠り・盲目・呪いの薬は、それらを実際に出すステージ5以降で足す。
     *   すべてを治す万能薬を作るときは statuses を書かなければよい
     *   （data/statuses.js の curable: true が対象になる）。
     */
    antidote: {
      id: "antidote",
      name: "解毒草",
      icon: "iconItemAntidote",
      category: "heal",
      description: "苦い葉。噛むと毒が抜ける。",
      maxStack: 99,
      price: 40,
      effect: { type: "cureStatus", statuses: ["poison"] },
      usableIn: ["home", "dungeon", "battle"]
    },

    // 技を出すためのPPを戻す。回復薬（HP）に対する、もう一方の回復
    spiritBerry: {
      id: "spiritBerry",
      name: "精気の実",
      icon: "iconItemSpiritBerry",
      category: "heal",
      description: "淡く光る木の実。かじると、技を出す力が少し戻る。",
      // RC-1 で 9 → 99（作者の指定。回復の道具はそろえて 99）
      maxStack: 99,
      price: 70,
      effect: { type: "healPp", value: 5 },
      usableIn: ["home", "dungeon", "battle"]
    },

    // --- 道具 ---

    // 帰り道の保険。持っていれば、階段まで戻らなくても引き返せる
    returnStone: {
      id: "returnStone",
      name: "帰還の石",
      icon: "iconItemReturnStone",
      category: "tool",
      description: "淡く光る石。砕くと拠点へ引き戻される。使うとなくなる。",
      maxStack: 9,
      price: 80,
      effect: { type: "escape" },
      usableIn: ["dungeon"]
    },

    // スカウトしやすくする（RC-1。作者の指定：×1.5・その戦闘のあいだ・坑道クリアで店に並ぶ）。
    // 使った次のターンから効く。重ねて使っても上がらない（2つ目は減らない）。
    // スカウトできない戦い（主の初戦など）では、戦闘の道具の一覧に出ない
    scoutIncense: {
      id: "scoutIncense",
      name: "誘いの香",
      icon: "iconItemScoutIncense",
      category: "tool",
      description: "甘く漂う香。焚くと、その戦いのあいだ相手が誘いに応じやすくなる。",
      maxStack: 9,
      price: 80,
      effect: { type: "scoutBoost", multiplier: 1.5 },
      usableIn: ["battle"]
    },

    // --- 装備 ---

    /**
     * --- 武器 ---
     * 攻める力の中心。攻撃の加算はここに集め、アクセサリーの加算は小さめにしてある。
     *   獣の牙(+2) → 燃え殻の剣(+4・火) → 灼牙の戦刃(+10) → 深淵の牙(+9・速×1.1)
     *   → 粘晶の剣(+12・水) → 沼骨の槍(+14・地) → 探索者の長剣(+17・クリア後の店)
     * ★ RC-1 で作者が見直した。それまでは亀裂の戦刃(+10)が最後まで攻撃力の一番で、
     *   殴って戦う仲間（通常攻撃・斬撃・体技）に、亀裂より先で更新する武器が無かった
     */

    // 最初から買える武器。ショップに並ぶ
    fangCharm: {
      id: "fangCharm",
      name: "獣の牙",
      icon: "iconItemFangCharm",
      category: "equipment",
      description: "獣の牙を握りに据えた小さな刃。攻める力がわずかに増す。",
      maxStack: 9,
      price: 70,
      effect: null,
      usableIn: [],
      equip: {
        slot: "weapon",
        effects: [
          { type: "statBonus", stat: "attack", value: 2 }
        ]
      }
    },

    // 亀裂の素材で作る武器。火の技を使う仲間（フレイミン・スミビ）が持つと伸びる
    emberBlade: {
      id: "emberBlade",
      name: "燃え殻の剣",
      icon: "iconItemEmberBlade",
      category: "equipment",
      description: "燃え殻を鍛え直した剣。振るうと刃先に火が宿る。",
      maxStack: 9,
      price: 160,
      effect: null,
      usableIn: [],
      equip: {
        slot: "weapon",
        effects: [
          { type: "statBonus", stat: "attack", value: 4 },
          { type: "damageDealt", value: 1.10, element: "fire" }
        ]
      }
    },

    // 灼熱の獣を倒さないと作れない。亀裂の時点では攻撃の加算が最大（深層より先で抜かれる）
    blazeCharm: {
      id: "blazeCharm",
      name: "灼牙の戦刃",
      icon: "iconItemBlazeCharm",
      category: "equipment",
      description: "灼熱の獣の牙を研ぎ上げた刃。持つ者の攻める力を大きく引き上げる。",
      maxStack: 9,
      price: 300,
      effect: null,
      usableIn: [],
      // 見返りの代償は付けていない。素材のほうが十分に重いため
      // （焼けた殻は、いちばん出にくいマグマガニから20%でしか落ちない）
      equip: {
        slot: "weapon",
        effects: [
          { type: "statBonus", stat: "attack", value: 10 }
        ]
      }
    },

    // 深層の素材で作る武器。攻撃は戦刃に届かないが、速さが伸びる（加算ではなく倍率）。RC-1 で攻撃 +7 → +9
    abyssFang: {
      id: "abyssFang",
      name: "深淵の牙",
      icon: "iconItemAbyssFang",
      category: "equipment",
      description: "深淵の欠片を牙の形に削り出した刃。軽く、振りが速い。",
      maxStack: 9,
      price: 320,
      effect: null,
      usableIn: [],
      equip: {
        slot: "weapon",
        effects: [
          { type: "statBonus", stat: "attack", value: 9 },
          { type: "statMultiplier", stat: "speed", value: 1.1 }
        ]
      }
    },

    // 毒沼の素材で作る武器。地の技を使う仲間（イワゴロー・ヒビイワ・モスゴーレム）向け。
    // RC-1 で闇 → 地・攻撃 +7 → +14（作者の指定）。それまで地の火力を上げる装備が1つも無く、
    // 闇だけが武器と竜牙の指輪で重ねられた
    marshSpear: {
      id: "marshSpear",
      name: "沼骨の槍",
      icon: "iconItemMarshSpear",
      category: "equipment",
      description: "錆びた骨を束ねて穂先にした槍。沼の泥を吸った穂先は、岩のように重い。",
      maxStack: 9,
      price: 360,
      effect: null,
      usableIn: [],
      equip: {
        slot: "weapon",
        effects: [
          { type: "statBonus", stat: "attack", value: 14 },
          { type: "damageDealt", value: 1.10, element: "earth" }
        ]
      }
    },

    // スライムのかけらで作る武器（RC-1。余りがちなかけらの使い道として作者が考えたもの）。
    // 水の技を使う仲間向け。RC-1 で攻撃 +7 → +12（作者の指定）
    slimeBlade: {
      id: "slimeBlade",
      name: "粘晶の剣",
      icon: "iconItemSlimeBlade",
      category: "equipment",
      description: "スライムのかけらを固めて刃にした剣。澄んだ刃に水の力が通う。",
      maxStack: 9,
      // 売値 117G（作者の指定。最初の 180G の65%。売値は price × shop.js の sellRate 0.5）
      price: 234,
      effect: null,
      usableIn: [],
      equip: {
        slot: "weapon",
        effects: [
          { type: "statBonus", stat: "attack", value: 12 },
          { type: "damageDealt", value: 1.10, element: "water" }
        ]
      }
    },

    /**
     * --- 防具 ---
     * 防御を上げるのが役目。
     *   石の帽子(防+4) → 岩鎧の欠片(防+5) → 苔の外套(防+3/HP+10)
     *   → 雷光の羽衣(防+5/PP×1.2/雷+2) → 泥重の甲(防+12/地+3) → 黄泉鱗の鎧(防+17/闇+2)
     *
     * ★ 「受けるダメージを下げる」（damageTaken）効果は強すぎるので、防具には入れない。
     *   いまこれを持つのは毒沼の冠（×0.95）だけ。
     * ★ 素早さを下げる代償も入れない。鈍くする効果は装備から全部外してある
     *   （残っている statMultiplier の速さは、上げる側の深淵の牙 ×1.1 だけ）。
     *   v1.0.0 の若木の大剣（武器）から、作者の指定で「強いかわりに鈍くなる」代償を戻した（速×0.9）
     */

    stoneBand: {
      id: "stoneBand",
      name: "石の帽子",
      icon: "iconItemStoneBand",
      category: "equipment",
      description: "ずしりと重い石の帽子。かぶると守りが上がる。",
      maxStack: 9,
      price: 120,
      effect: null,
      usableIn: [],
      equip: {
        slot: "armor",
        effects: [
          { type: "statBonus", stat: "defense", value: 4 }
        ]
      }
    },

    // 坑道の主の核で作る。石の帽子と違って鈍くならず、HPも伸びる「軽い防具」
    mossCharm: {
      id: "mossCharm",
      name: "苔の外套",
      icon: "iconItemMossCharm",
      category: "equipment",
      description: "坑道の主の核を縫い込んだ外套。体が丈夫になる。",
      maxStack: 9,
      price: 260,
      effect: null,
      usableIn: [],
      equip: {
        slot: "armor",
        effects: [
          { type: "statBonus", stat: "defense", value: 3 },
          { type: "statBonus", stat: "hp", value: 10 }
        ]
      }
    },

    /**
     * --- 店で買う第一章クリア後の装備（腐食の毒沼クリアでよろず屋に並ぶ） ---
     * お金の使いみち。α-9 のテストプレイで、クリア時に 2700G 余ったため足した（数値と値段は作者が決めたもの）。
     * 最初は「工房で作れるいちばん良い装備は超えない」強さにしてあったが、
     * RC-1 で作者が見直した：
     *   探索者の長剣 攻+17 … 攻撃の加算だけなら武器の一番（属性の倍率は無い。800G）
     *   厚革の胴着 防+14 は黄泉鱗の鎧 防+17 の下のまま
     *   精気の指輪 PP+3 → PP+8（770G に見合う量に）
     */

    explorerSword: {
      id: "explorerSword",
      name: "探索者の長剣",
      icon: "iconItemExplorerSword",
      category: "equipment",
      description: "探索者が深く潜るときに選ぶ、癖のない長剣。",
      maxStack: 9,
      price: 800,
      effect: null,
      usableIn: [],
      equip: {
        slot: "weapon",
        effects: [
          { type: "statBonus", stat: "attack", value: 17 }
        ]
      }
    },

    thickLeatherVest: {
      id: "thickLeatherVest",
      name: "厚革の胴着",
      icon: "iconItemThickLeatherVest",
      category: "equipment",
      description: "何枚も革を重ねた胴着。重いが、そのぶん体を守る。",
      maxStack: 9,
      price: 1200,
      effect: null,
      usableIn: [],
      equip: {
        slot: "armor",
        effects: [
          { type: "statBonus", stat: "defense", value: 14 },
          { type: "statBonus", stat: "hp", value: 10 }
        ]
      }
    },

    spiritRing: {
      id: "spiritRing",
      name: "精気の指輪",
      icon: "iconItemSpiritRing",
      category: "equipment",
      description: "精気の実を磨いて嵌めた指輪。技を出す力が増す。",
      maxStack: 9,
      price: 770,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "statBonus", stat: "pp", value: 8 }
        ]
      }
    },

    travelerCharm: {
      id: "travelerCharm",
      name: "旅人の護符",
      icon: "iconItemTravelerCharm",
      category: "equipment",
      description: "長く潜る探索者のお守り。毒・痺れ・眠気を少し遠ざける。",
      maxStack: 9,
      price: 700,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "resistBonus", status: "poison", value: 3 },
          { type: "resistBonus", status: "paralysis", value: 3 },
          { type: "resistBonus", status: "sleep", value: 3 }
        ]
      }
    },

    /**
     * --- アクセサリー ---
     * 2つ着けられる。属性・耐性・速さなど、方向を足す装備。
     * ステータスの加算は武器・防具より小さくしてある（2つ重なるため）。
     */

    glowLantern: {
      id: "glowLantern",
      name: "光る提灯",
      icon: "iconItemGlowLantern",
      category: "equipment",
      description: "鱗粉を詰めた小さな提灯。光をよく通す。",
      maxStack: 9,
      price: 180,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "damageDealt", value: 1.15, element: "light" },
          { type: "statBonus", stat: "pp", value: 1 }
        ]
      }
    },

    // ゲーム中で初めて素早さが上がる装備。守りに寄せる石の帽子の対。RC-1 で素早さ +5 → +7
    swiftPlume: {
      id: "swiftPlume",
      name: "風切りの羽根",
      icon: "iconItemSwiftPlume",
      category: "equipment",
      description: "灰の羽根を束ねた飾り。体が軽くなり、動きが速くなる。",
      maxStack: 9,
      price: 200,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "statBonus", stat: "speed", value: 7 }
        ]
      }
    },

    // 火が主役の場所に潜り直すときのための装備。
    // 灼熱の亀裂を周回する（主を仲間に誘うなど）ときに効く
    emberWard: {
      id: "emberWard",
      name: "炎よけの札",
      icon: "iconItemEmberWard",
      category: "equipment",
      description: "焼けた殻を貼り合わせた札。火に対する強さそのものが増す。",
      maxStack: 9,
      price: 150,
      effect: null,
      usableIn: [],
      // 倍率ではなく「耐性の数値」を上げる。
      // 元から火に強い仲間はさらに強くなり、火が弱点の仲間は弱点が和らぐ
      equip: {
        slot: "accessory",
        effects: [
          { type: "resistBonus", element: "fire", value: 3 }
        ]
      }
    },

    // --- 静寂の深層で作る装備 ---

    // 炎よけの札（火）の対。深層は闇の技が多いので、ここでは闇を防ぐ
    duskWard: {
      id: "duskWard",
      name: "宵よけの札",
      icon: "iconItemDuskWard",
      category: "equipment",
      description: "宵の露を染み込ませた札。闇に対する強さそのものが増す。",
      maxStack: 9,
      price: 170,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "resistBonus", element: "dark", value: 3 }
        ]
      }
    },

    // ゲーム中で初めて、技を出す回数そのものを増やす装備。
    // 加算ではなく倍率にしてある。加算だと元のPPが少ない仲間ほど得をして、
    // 重い技を抱える仲間には効きにくい（狙いと逆）ため
    stormVeil: {
      id: "stormVeil",
      name: "雷光の羽衣",
      icon: "iconItemStormVeil",
      category: "equipment",
      description: "ビリムシの翅を編んだ薄衣。まとうと力の巡りが速くなり、雷を弾く。",
      maxStack: 9,
      price: 240,
      effect: null,
      usableIn: [],
      // 技を撃つ回数を増やす唯一の防具。雷への耐性も付く
      equip: {
        slot: "armor",
        effects: [
          { type: "statMultiplier", stat: "pp", value: 1.2 },
          { type: "statBonus", stat: "defense", value: 5 },
          { type: "resistBonus", element: "thunder", value: 2 }
        ]
      }
    },

    // 防具の頂点。泥重の甲（防+12）より硬い。
    // そのぶん素材が重い（ヨミリュウを倒さないと作れない）
    dragonGuard: {
      id: "dragonGuard",
      name: "黄泉鱗の鎧",
      icon: "iconItemDragonGuard",
      category: "equipment",
      description: "ヨミリュウの鱗を綴じ合わせた鎧。並の一撃では傷ひとつ付かない。",
      maxStack: 9,
      price: 420,
      effect: null,
      usableIn: [],
      equip: {
        slot: "armor",
        effects: [
          { type: "statBonus", stat: "defense", value: 17 },
          { type: "resistBonus", element: "dark", value: 2 }
        ]
      }
    },

    // 深層の主を倒さないと作れない。
    // 苔の外套＝守り、灼牙の戦刃＝攻め、に対して「どちらも少しずつ」の形にしてある
    crownCircle: {
      id: "crownCircle",
      name: "王冠の輪",
      icon: "iconItemCrownCircle",
      category: "equipment",
      description: "王の冠を打ち直した輪。身につけた者の全てをわずかに押し上げる。",
      maxStack: 9,
      price: 500,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "statBonus", stat: "hp", value: 5 },
          { type: "statBonus", stat: "attack", value: 3 },
          { type: "statBonus", stat: "defense", value: 3 },
          { type: "statBonus", stat: "speed", value: 2 }
        ]
      }
    },

    // スライムのかけらで作る防具（RC-1）。泥重の甲（防+12・地+3）より少し柔らかく、水に強い
    slimeMail: {
      id: "slimeMail",
      name: "粘晶の鎧",
      icon: "iconItemSlimeMail",
      category: "equipment",
      description: "スライムのかけらを幾重にも固めた鎧。打たれても衝撃が逃げ、水をよく弾く。",
      maxStack: 9,
      // 売値 130G（作者の指定。最初の 200G の65%）
      price: 260,
      effect: null,
      usableIn: [],
      equip: {
        slot: "armor",
        effects: [
          { type: "statBonus", stat: "defense", value: 11 },
          { type: "resistBonus", element: "water", value: 2 }
        ]
      }
    },

    // スライムのかけらで作るアクセサリー（RC-1）。
    // ゲーム中で初めて、回復の技を強くする装備。キュアを覚えるスライムに持たせる想定
    slimeNecklace: {
      id: "slimeNecklace",
      name: "粘晶のネックレス",
      icon: "iconItemSlimeNecklace",
      category: "equipment",
      description: "スライムのかけらを連ねた首飾り。癒やしの力がよく通る。",
      maxStack: 9,
      // 売値 137G（作者の指定。最初の 210G の65%）
      price: 274,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "resistBonus", element: "water", value: 2 },
          { type: "healDealt", value: 1.2 }
        ]
      }
    },

    /**
     * --- 腐食の毒沼で作れる装備 ---
     *
     * ★ ゲーム中で初めて「状態異常への耐性」を上げる装備。
     *   書き方は属性の耐性（炎よけの札）と同じ resistBonus で、
     *   element のかわりに status を書く。
     *   element と status は混ざらない（EffectSystem.getResistBonus を参照）。
     */

    // 毒沼の答え。毒耐性 +7 は「通る確率が3割になる」という重さ。
    // 沼を歩くあいだの削りも、主のどくのいきも、これ1つでほぼ止まる
    venomWard: {
      id: "venomWard",
      name: "毒よけの護符",
      icon: "iconItemVenomWard",
      category: "equipment",
      description: "毒の針をより合わせた護符。毒そのものを寄せつけなくなる。",
      maxStack: 9,
      price: 200,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "resistBonus", status: "poison", value: 7 }
        ]
      }
    },

    // 泥甲羅と骨で組んだ重い鎧。重いが速さは落ちない。
    // 黄泉鱗の鎧（防+17 / 闇耐性+2）より防御は低いかわりに、地への耐性が厚い
    mireArmor: {
      id: "mireArmor",
      name: "泥重の甲",
      icon: "iconItemMireArmor",
      category: "equipment",
      description: "泥を吸った甲羅を骨で綴じた鎧。重いが、並の攻撃はまるで通らない。",
      maxStack: 9,
      price: 260,
      effect: null,
      usableIn: [],
      equip: {
        slot: "armor",
        effects: [
          { type: "statBonus", stat: "defense", value: 12 },
          { type: "resistBonus", element: "earth", value: 3 }
        ]
      }
    },

    // 沼の主を倒さないと作れない。毒を「受けない」のではなく「返す」方向。
    // 王冠の輪（全部わずかに上げる）に対して、こちらは尖らせてある
    venomCrown: {
      id: "venomCrown",
      name: "毒沼の冠",
      icon: "iconItemVenomCrown",
      category: "equipment",
      description: "主の毒嚢を包んで戴く冠。毒を宿したまま、その力だけを借りる。",
      maxStack: 9,
      price: 540,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "resistBonus", status: "poison", value: 10 },
          { type: "statBonus", stat: "attack", value: 5 },
          { type: "damageTaken", value: 0.95 }
        ]
      }
    },

    /**
     * --- 倒してしか手に入らない装備 ---
     *
     * ショップにも工房にも並べない。特定のモンスターが低確率で落とすだけなので、
     * 「あの相手を狩りに行く」という理由になる。
     * どれも買える装備の完全上位にはせず、方向が違うものにしてある。
     */

    stoneMail: {
      id: "stoneMail",
      name: "岩鎧の欠片",
      icon: "iconItemStoneMail",
      category: "equipment",
      description: "イワゴローの体の一部。抱えていると重いが、驚くほど頑丈だ。",
      maxStack: 9,
      price: 160,
      effect: null,
      usableIn: [],
      // 石の帽子（防+4）より硬い。買えないぶんの取り柄がこの1点
      equip: {
        slot: "armor",
        effects: [
          { type: "statBonus", stat: "defense", value: 5 }
        ]
      }
    },

    windCrest: {
      id: "windCrest",
      name: "風乗りの羽飾り",
      icon: "iconItemWindCrest",
      category: "equipment",
      description: "ハイバネの風切り羽を挿した飾り。身につけると足が軽くなる。",
      maxStack: 9,
      price: 220,
      effect: null,
      usableIn: [],
      // ゲーム中で初めての風属性の装備。速さは風切りの羽根（RC-1 で +7）より少し低いかわりに、風の技も伸びる
      equip: {
        slot: "accessory",
        effects: [
          { type: "statBonus", stat: "speed", value: 5 },
          { type: "damageDealt", value: 1.10, element: "wind" }
        ]
      }
    },

    chargedCore: {
      id: "chargedCore",
      name: "帯電の芯",
      icon: "iconItemChargedCore",
      category: "equipment",
      description: "ビリムシの体内で電気をためていた芯。握ると指先がしびれる。",
      maxStack: 9,
      price: 280,
      effect: null,
      usableIn: [],
      // 雷の使い手はいまビリムシだけ（蔦這う回廊に雷の竜の子を足す予定）。いまは実質ビリムシ専用の装備
      equip: {
        slot: "accessory",
        effects: [
          { type: "damageDealt", value: 1.10, element: "thunder" },
          { type: "statBonus", stat: "pp", value: 2 }
        ]
      }
    },

    fangRing: {
      id: "fangRing",
      name: "竜牙の指輪",
      icon: "iconItemFangRing",
      category: "equipment",
      description: "ヨミリュウの牙を削って作られた指輪。持つ者に闇を纏わせる。",
      maxStack: 9,
      price: 380,
      effect: null,
      usableIn: [],
      // アクセサリーなので攻撃の加算は控えめ。闇の技を使う仲間なら武器と重ねて伸びる
      equip: {
        slot: "accessory",
        effects: [
          { type: "statBonus", stat: "attack", value: 4 },
          { type: "damageDealt", value: 1.15, element: "dark" }
        ]
      }
    },

    /**
     * ヌマボネが落とす。ゲーム中で初めての即死耐性の装備。
     *
     * ★ 即死は「最後の1体でも容赦なく効く」ようにしてある（守りを入れていない）。
     *   だからこそ備える手段が要る、という設計だったので、その答えがこれ。
     *   +7 は通る確率が3割になる重さ。種族の耐性と足せば10（完全無効）に届く。
     *
     * ★ 落とす相手が「もう死んでいる骨」なのは意図してある。
     *   ヌマボネ自身が即死耐性10（完全に効かない）を持っているので、
     *   その骨を持ち歩けば同じ守りが得られる、という筋になる。
     */
    boneCharm: {
      id: "boneCharm",
      name: "髑髏の護符",
      icon: "iconItemBoneCharm",
      category: "equipment",
      description: "ヌマボネの頭骨を削って作った護符。死そのものを一度だけ弾く。",
      maxStack: 9,
      price: 400,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "resistBonus", status: "instantDeath", value: 7 },
          { type: "statBonus", stat: "hp", value: 9 }
        ]
      }
    },

    /**
     * --- 萌芽の穴・若葉の洞の素材で作る装備（v1.0.0）---
     * ★ 名前は仮（作者が決める）。数値・値段は作者に見せる案。
     * 揺籃の穴の装備（武器は攻+17・防具は防+17が一番上）より一段上に置く。第一章は通過点なので、ここから伸ばしていく
     * （作者「まだまだインフレさせる」）。光の技を使う仲間（ユラツボミ・コダマ）が増える場所なので、光の武器を初めて置く。
     * 眠りが初めて出る場所なので、毒沼の毒よけの護符と同じく「主の素材を使わない眠りよけ」を作れるようにしてある。
     */

    // 若葉の洞の素材で作る武器。ゲーム中で初めて光の技を伸ばす武器
    sproutBlade: {
      id: "sproutBlade",
      name: "若枝の剣",
      icon: "iconItemSproutBlade",
      category: "equipment",
      description: "しなやかな若枝を芯に巻いて鍛えた剣。刃に淡い光が通う。",
      maxStack: 9,
      price: 440,
      effect: null,
      usableIn: [],
      equip: {
        slot: "weapon",
        effects: [
          { type: "statBonus", stat: "attack", value: 22 },
          { type: "damageDealt", value: 1.10, element: "light" }
        ]
      }
    },

    // コケガメの甲羅で作る防具。黄泉鱗の鎧（防+17）より大きく硬く、HPも伸びる。水と地に強い（作者の指定）
    mossShellArmor: {
      id: "mossShellArmor",
      name: "苔甲の鎧",
      icon: "iconItemMossShellArmor",
      category: "equipment",
      description: "苔むした甲羅を泥甲羅で裏打ちした鎧。重いが、打たれても苔が衝撃を吸う。",
      maxStack: 9,
      price: 480,
      effect: null,
      usableIn: [],
      equip: {
        slot: "armor",
        effects: [
          { type: "statBonus", stat: "defense", value: 33 },
          { type: "statBonus", stat: "hp", value: 10 },
          { type: "resistBonus", element: "water", value: 2 },
          { type: "resistBonus", element: "earth", value: 2 }
        ]
      }
    },

    // 若葉の洞の答え。眠り耐性 +7（通る確率が3割になる）。毒よけの護符と同じ重さ
    sleepWard: {
      id: "sleepWard",
      name: "眠りよけの鈴",
      icon: "iconItemSleepWard",
      category: "equipment",
      description: "眠り花粉を固めた玉を入れた鈴。澄んだ音が眠気を払う。",
      maxStack: 9,
      price: 220,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "resistBonus", status: "sleep", value: 7 }
        ]
      }
    },

    // 風乗りの羽飾り（速+5・風×1.1）の上位
    leafPlume: {
      id: "leafPlume",
      name: "若葉の羽飾り",
      icon: "iconItemLeafPlume",
      category: "equipment",
      description: "若葉色の羽根を束ねた飾り。追い風を受けたように体が軽い。",
      maxStack: 9,
      price: 300,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "statBonus", stat: "speed", value: 8 },
          { type: "damageDealt", value: 1.10, element: "wind" }
        ]
      }
    },

    // コダマ（珍しい）の種で作る。ゲーム中で初めて、装備でターンごとにHPが戻る（特性「再生」の 10%・上限50 より少ないが、上限は無い）
    sproutCharm: {
      id: "sproutCharm",
      name: "若芽の護符",
      icon: "iconItemSproutCharm",
      category: "equipment",
      description: "芽吹く前の種を包んだ護符。身につけた者の傷を、少しずつ塞いでいく。",
      maxStack: 9,
      price: 380,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "regen", value: 0.05 },
          { type: "statBonus", stat: "hp", value: 8 }
        ]
      }
    },

    // 若葉の洞の主を倒さないと作れない。若枝の剣より重く、地の技を伸ばす。
    // ★ 重さの代償として素早さ ×0.9（作者の指定）。RC-1 で「鈍くする装備は外す」としたが、ここから代償つきの強い装備を入れる
    heartwoodBlade: {
      id: "heartwoodBlade",
      name: "若木の大剣",
      icon: "iconItemHeartwoodBlade",
      category: "equipment",
      description: "主の芯から削り出した大剣。若木の力が、振るうたびに地を揺らす。",
      maxStack: 9,
      price: 620,
      effect: null,
      usableIn: [],
      equip: {
        slot: "weapon",
        effects: [
          { type: "statBonus", stat: "attack", value: 33 },
          { type: "damageDealt", value: 1.15, element: "earth" },
          { type: "statMultiplier", stat: "speed", value: 0.9 }
        ]
      }
    },

    // ユラツボミの花粉で作る杖。攻撃は低いが技を出す回数が増え、殴った相手を眠らせることがある（作者の指定）
    sleepStaff: {
      id: "sleepStaff",
      name: "眠花の杖",
      icon: "iconItemSleepStaff",
      category: "equipment",
      description: "眠り花粉を詰めた花を先に咲かせた杖。打たれた相手は、甘い香りにまぶたを落とす。",
      maxStack: 9,
      // 450G → 600G（作者の指定）。★ 材料を店で買うと230Gで売値300Gなので、作って売ると1本70G得をする。
      //   作者に確認したうえで、このままにしてある（2026-10-08）
      price: 600,
      effect: null,
      usableIn: [],
      equip: {
        slot: "weapon",
        effects: [
          { type: "statBonus", stat: "attack", value: 12 },
          { type: "statMultiplier", stat: "pp", value: 1.25 },
          { type: "onHitStatus", status: "sleep", chance: 0.20, normalAttackOnly: true }
        ]
      }
    },

    oreShard: {
      id: "oreShard",
      name: "鉱石のかけら",
      icon: "iconItemOreShard",
      from: "mossyMine",
      category: "material",
      description: "坑道で拾える鈍く光る石。何かの素材になりそうだ。",
      maxStack: 99,
      price: 25,
      effect: null,
      usableIn: []
    },

    glowDust: {
      id: "glowDust",
      name: "光る鱗粉",
      icon: "iconItemGlowDust",
      from: "mossyMine",
      category: "material",
      description: "暗がりでほのかに光る粉。虫が落としていった。",
      maxStack: 99,
      price: 50,
      effect: null,
      usableIn: []
    },

    // --- 灼熱の亀裂の素材 ---

    blazingFang: {
      id: "blazingFang",
      name: "灼熱の牙",
      icon: "iconItemBlazingFang",
      from: "scorchingFissure",
      category: "material",
      description: "灼熱の獣の牙。折れてなお、芯が赤く灯っている。",
      maxStack: 99,
      price: 200,
      effect: null,
      usableIn: []
    },

    emberAsh: {
      id: "emberAsh",
      name: "燃え殻",
      icon: "iconItemEmberAsh",
      from: "scorchingFissure",
      category: "material",
      description: "スミビが落としていった燃えかす。まだほのかに温かい。",
      maxStack: 99,
      price: 18,
      effect: null,
      usableIn: []
    },

    ashFeather: {
      id: "ashFeather",
      name: "灰の羽根",
      icon: "iconItemAshFeather",
      from: "scorchingFissure",
      category: "material",
      description: "灰をまとった軽い羽根。手に取ると、そのまま風に乗って飛んでいきそうだ。",
      maxStack: 99,
      price: 45,
      effect: null,
      usableIn: []
    },

    scorchedShell: {
      id: "scorchedShell",
      name: "焼けた殻",
      icon: "iconItemScorchedShell",
      from: "scorchingFissure",
      category: "material",
      description: "マグマの熱で焼き締まった殻のかけら。火をよく弾く。",
      maxStack: 99,
      price: 60,
      effect: null,
      usableIn: []
    },

    // --- 静寂の深層の素材 ---

    duskDew: {
      id: "duskDew",
      name: "宵の露",
      icon: "iconItemDuskDew",
      from: "silentDepths",
      category: "material",
      description: "ヨドミが残していった黒い雫。触れるとひやりと重い。",
      maxStack: 99,
      price: 22,
      effect: null,
      usableIn: []
    },

    crownShard: {
      id: "crownShard",
      name: "王冠のかけら",
      icon: "iconItemCrownShard",
      from: "silentDepths",
      category: "material",
      description: "深層の主がかぶっていた冠のかけら。芯に澄んだ水を宿している。",
      maxStack: 99,
      price: 260,
      effect: null,
      usableIn: []
    },

    dragonScale: {
      id: "dragonScale",
      name: "黄泉竜の鱗",
      icon: "iconItemDragonScale",
      from: "silentDepths",
      category: "material",
      description: "ヨミリュウの鱗。光にかざしても、向こう側が透けることはない。",
      maxStack: 99,
      price: 120,
      effect: null,
      usableIn: []
    },

    stormWing: {
      id: "stormWing",
      name: "雷光の翅",
      icon: "iconItemStormWing",
      from: "silentDepths",
      category: "material",
      description: "ビリムシの翅。ちぎれてもなお、指先に軽くしびれを残す。",
      maxStack: 99,
      price: 70,
      effect: null,
      usableIn: []
    },

    twistedVine: {
      id: "twistedVine",
      name: "ねじれ蔦",
      icon: "iconItemTwistedVine",
      from: "silentDepths",
      category: "material",
      description: "カゲヅタの蔦を切り取ったもの。乾いてもまだ何かに絡みつこうとする。",
      maxStack: 99,
      price: 45,
      effect: null,
      usableIn: []
    },

    // --- 腐食の毒沼の素材 ---
    // 値段は深層の素材（22〜120G）より一段上に置いてある

    venomStinger: {
      id: "venomStinger",
      name: "毒の針",
      icon: "iconItemVenomStinger",
      from: "venomMarsh",
      category: "material",
      description: "ドクバチの針。抜けても先から雫が落ちつづける。",
      maxStack: 99,
      price: 35,
      effect: null,
      usableIn: []
    },

    muddyShell: {
      id: "muddyShell",
      name: "泥甲羅",
      icon: "iconItemMuddyShell",
      from: "venomMarsh",
      category: "material",
      description: "ドロガメの甲羅のかけら。沼の泥が染み込んで、もう洗っても落ちない。",
      maxStack: 99,
      price: 60,
      effect: null,
      usableIn: []
    },

    rustedBone: {
      id: "rustedBone",
      name: "錆びた骨",
      icon: "iconItemRustedBone",
      from: "venomMarsh",
      category: "material",
      description: "沼に沈んでいた骨。長く浸かっていたせいで、赤茶けて脆い。",
      maxStack: 99,
      price: 50,
      effect: null,
      usableIn: []
    },

    // 主のドロップ。他の主の素材と同じく、必ず1つ落ちる
    venomSac: {
      id: "venomSac",
      name: "毒嚢",
      icon: "iconItemVenomSac",
      from: "venomMarsh",
      category: "material",
      description: "ヌシガエルの体内にあった袋。この沼の毒は、すべてここから出ていた。",
      maxStack: 99,
      price: 280,
      effect: null,
      usableIn: []
    },

    mossyCore: {
      id: "mossyCore",
      name: "苔むした核",
      icon: "iconItemMossyCore",
      from: "mossyMine",
      category: "material",
      description: "坑道の主を動かしていた石の核。まだ温かい。",
      maxStack: 99,
      price: 100,
      effect: null,
      usableIn: []
    },

    slimeShard: {
      id: "slimeShard",
      name: "スライムのかけら",
      icon: "iconItemSlimeShard",
      from: "silentDepths",
      category: "material",
      description: "ぷるぷるした欠片。何かの素材になりそうだ。",
      maxStack: 99,
      // RC-1 で 12 → 30（作者の指定）。12G だと、店で買ったかけらで粘晶の装備を作って売るだけで
      // お金が増え続けた（剣 48G→売値117G など）。30G なら材料のほうが高くつく（剣 120G・鎧と首飾り 150G）
      price: 30,
      effect: null,
      usableIn: []
    },

    abyssFragment: {
      id: "abyssFragment",
      name: "深淵の欠片",
      icon: "iconItemAbyssFragment",
      // ヌマボネ（毒沼）も落とすが、最初に手に入るのは深層（ヨドミ・ヨミリュウ・宝箱）
      from: "silentDepths",
      category: "material",
      description: "深部でまれに見つかる黒い欠片。強い力を感じる。",
      maxStack: 99,
      price: 80,
      effect: null,
      usableIn: []
    },

    // --- 萌芽の穴・若葉の洞の素材（v1.0.0。名前は仮）---
    // 値段は毒沼の素材（35〜60G）より一段上に置いてある

    shedHusk: {
      id: "shedHusk",
      name: "若葉の抜け殻",
      icon: "iconItemShedHusk",
      from: "sproutHollow",
      category: "material",
      description: "フタバムシが脱ぎ捨てた皮。薄いのに、指で押してもなかなか破れない。",
      maxStack: 99,
      price: 40,
      effect: null,
      usableIn: []
    },

    sleepPollen: {
      id: "sleepPollen",
      name: "眠り花粉",
      icon: "iconItemSleepPollen",
      from: "sproutHollow",
      category: "material",
      description: "ユラツボミのつぼみに溜まっていた花粉。嗅ぐと、まぶたが重くなる。",
      maxStack: 99,
      price: 45,
      effect: null,
      usableIn: []
    },

    leafFeather: {
      id: "leafFeather",
      name: "若葉の羽根",
      icon: "iconItemLeafFeather",
      from: "sproutHollow",
      category: "material",
      description: "ワカバドリの羽根。葉脈のような筋が通っていて、陽にかざすと透ける。",
      maxStack: 99,
      price: 55,
      effect: null,
      usableIn: []
    },

    mossyShell: {
      id: "mossyShell",
      name: "苔むした甲羅",
      icon: "iconItemMossyShell",
      from: "sproutHollow",
      category: "material",
      description: "コケガメの甲羅のかけら。剥がしても、苔はまだ青々としている。",
      maxStack: 99,
      price: 70,
      effect: null,
      usableIn: []
    },

    // コダマ（珍しい）が落とす。店には並べない（会うこと自体に意味を残すため。黄泉竜の鱗と同じ）
    sproutSeed: {
      id: "sproutSeed",
      name: "若芽の種",
      icon: "iconItemSproutSeed",
      from: "sproutHollow",
      category: "material",
      description: "コダマが抱えていた種。手のひらに乗せると、かすかに温かく脈打つ。",
      maxStack: 99,
      price: 150,
      effect: null,
      usableIn: []
    },

    // 主のドロップ。他の主の素材と同じく、必ず1つ落ちる
    heartwood: {
      id: "heartwood",
      name: "若木の芯",
      icon: "iconItemHeartwood",
      from: "sproutHollow",
      category: "material",
      description: "若葉の洞の主の芯。切り口から、まだ樹液がにじんでいる。",
      maxStack: 99,
      price: 320,
      effect: null,
      usableIn: []
    },

    /**
     * --- 萌芽の穴・蔦這う回廊の素材（v1.0.1） ---
     * 値段は 2026-10-28 に作者から任されて決めた（若葉の洞の同じ役の品より 3〜4割高い。回廊は1戦のゴールドも多い）。
     * 名前・説明・絵も作者が確定（2026-10-28）。
     * コケ胞子：コケキノコが落とす（28%。名前と率は作者が決めたもの 2026-10-21）。痺れよけの鱗飾りの材料
     */
    mossSpore: {
      id: "mossSpore",
      name: "コケ胞子",
      icon: "iconItemMossSpore",
      from: "ivyCorridor",
      category: "material",
      description: "コケキノコの笠から舞う胞子。湿った場所に置くと、一晩で苔が生える。",
      maxStack: 99,
      price: 60,
      effect: null,
      usableIn: []
    },

    /**
     * 風鳴りの羽：ツリガネが落とす（30%。名前と率は作者が決めたもの 2026-10-22）。
     * 声守りの鈴・風鳴りの胴衣の材料。
     * 値段は、店で買って風鳴りの胴衣を作って売っても得をしない値（材料 75×3＋45×2＝315G ＞ 売値 310G）
     */
    windChimeFeather: {
      id: "windChimeFeather",
      name: "風鳴りの羽",
      icon: "iconItemWindChimeFeather",
      from: "ivyCorridor",
      category: "material",
      description: "ツリガネの翼から抜けた黒い羽。かざすと、風もないのにかすかに鳴る。",
      maxStack: 99,
      price: 75,
      effect: null,
      usableIn: []
    },

    /**
     * 弔いの小鐘：ツリガネが落とす装備（10%。名前と効き目は作者が決めたもの 2026-10-22）。
     * 倒してしか手に入らない（店にも工房にも並べない）。PP ×1.2 はアクセサリーでは初めて（防具では雷光の羽衣）。
     * 即死への守りは髑髏の護符（+7）より軽い +4 で、そのかわり呪いも +4 防ぐ。
     * 値段 800G（売値 400G。2026-10-28）。蔦断ちの護符の材料にもなる
     */
    mourningBell: {
      id: "mourningBell",
      name: "弔いの小鐘",
      icon: "iconItemMourningBell",
      category: "equipment",
      description: "ツリガネが抱えていた小さな鐘。鳴らすと心が澄み、死の気配を遠ざける。",
      maxStack: 9,
      price: 800,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "statMultiplier", stat: "pp", value: 1.2 },
          { type: "resistBonus", status: "instantDeath", value: 4 },
          { type: "resistBonus", status: "curse", value: 4 }
        ]
      }
    },

    /**
     * 蒼雷の鱗・金角のかけら：ザンガルドが落とす（30%・10%。名前と率は作者が決めたもの 2026-10-26）。
     * 説明・絵は私の案を作者がそのまま確定（2026-10-26）。値段は 2026-10-28 に上げた（60→80・160→220）。
     * 痺れよけの鱗飾り・蒼雷の剣の材料
     */
    blueThunderScale: {
      id: "blueThunderScale",
      name: "蒼雷の鱗",
      icon: "iconItemBlueThunderScale",
      from: "ivyCorridor",
      category: "material",
      description: "ザンガルドの鱗。指でなぞると、ぱちりと青い火花が散る。",
      maxStack: 99,
      price: 80,
      effect: null,
      usableIn: []
    },
    goldHornShard: {
      id: "goldHornShard",
      name: "金角のかけら",
      icon: "iconItemGoldHornShard",
      from: "ivyCorridor",
      category: "material",
      description: "ザンガルドの角が欠けたもの。雷を受けたように、中が金色に光っている。",
      maxStack: 99,
      price: 220,
      effect: null,
      usableIn: []
    },

    /**
     * 灯り苔・絡み主根：回廊の宝箱からだけ出る素材（作者の指定 2026-10-27）。
     * 灯り苔はほかの素材と同じくらいの確率、絡み主根は B4F だけで 12%（data/dungeons.js の featureTables）。
     * 値段は最初 作者の指定（40G / 300G）で、2026-10-28 に任されて上げた（55G / 420G）。絡み主根は店に並べない
     */
    glowMoss: {
      id: "glowMoss",
      name: "灯り苔",
      icon: "iconItemGlowMoss",
      from: "ivyCorridor",
      category: "material",
      description: "回廊の壁に張りつく苔。光の届かない場所で、自分から淡く光っている。",
      maxStack: 99,
      price: 55,
      effect: null,
      usableIn: []
    },
    tangledTaproot: {
      id: "tangledTaproot",
      name: "絡み主根",
      icon: "iconItemTangledTaproot",
      from: "ivyCorridor",
      category: "material",
      description: "回廊じゅうの蔦をたどった先にある太い根。いまも何かを締めつけるように脈打つ。",
      maxStack: 99,
      price: 420,
      effect: null,
      usableIn: []
    },

    /**
     * --- 蔦這う回廊の素材で作る装備（作者の指定 2026-10-27。名前・説明・絵は 2026-10-28 に作者が確定）---
     * 値段は 2026-10-28 に任されて決めた（よけ 220→300・胴衣 440→620・剣 520→760・護符 1200）。
     * 回廊は「動きを奪われる」場所なので、麻痺・封印・呪いの耐性を1つずつ作れるようにしてある
     * （+7 は通る確率が3割になる重さ。毒よけの護符・眠りよけの鈴と同じ）。
     * どれも若葉の洞をクリアすると工房に並ぶ（data/recipes.js。前の区画のクリアで開く、いつもの形）。
     */

    paralysisWard: {
      id: "paralysisWard",
      name: "痺れよけの鱗飾り",
      icon: "iconItemParalysisWard",
      category: "equipment",
      description: "蒼雷の鱗を胞子の糊で綴った飾り。雷に慣れた鱗が、痺れを肌の手前で散らす。",
      maxStack: 9,
      price: 300,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "resistBonus", status: "paralysis", value: 7 }
        ]
      }
    },

    sealWard: {
      id: "sealWard",
      name: "声守りの鈴",
      icon: "iconItemSealWard",
      category: "equipment",
      description: "骨の鈴に風鳴りの羽を下げたもの。鳴り続ける音が、喉を塞ぐ力を払う。",
      maxStack: 9,
      price: 300,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "resistBonus", status: "seal", value: 7 }
        ]
      }
    },

    curseWard: {
      id: "curseWard",
      name: "呪いよけの蔦輪",
      icon: "iconItemCurseWard",
      category: "equipment",
      description: "ねじれ蔦で深淵の欠片を巻いた輪。絡みつく呪いを、蔦が先に引き受ける。",
      maxStack: 9,
      price: 300,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "resistBonus", status: "curse", value: 7 }
        ]
      }
    },

    // 苔甲の鎧（防+33・HP+10）より守りは低いかわりに、素早さが伸びる
    windChimeVest: {
      id: "windChimeVest",
      name: "風鳴りの胴衣",
      icon: "iconItemWindChimeVest",
      category: "equipment",
      description: "風鳴りの羽を蔦で縫いつけた胴衣。動くたびに羽が鳴り、体が風に押される。",
      maxStack: 9,
      price: 620,
      effect: null,
      usableIn: [],
      equip: {
        slot: "armor",
        effects: [
          { type: "statBonus", stat: "defense", value: 28 },
          { type: "statBonus", stat: "speed", value: 10 }
        ]
      }
    },

    // 若枝の剣（攻+22・光×1.1）の雷版で、攻撃は少し上
    blueThunderBlade: {
      id: "blueThunderBlade",
      name: "蒼雷の剣",
      icon: "iconItemBlueThunderBlade",
      category: "equipment",
      description: "蒼雷の鱗を刃に重ね、金角を柄に埋めた剣。振るうたびに青い火花が走る。",
      maxStack: 9,
      price: 760,
      effect: null,
      usableIn: [],
      equip: {
        slot: "weapon",
        effects: [
          { type: "statBonus", stat: "attack", value: 27 },
          { type: "damageDealt", value: 1.10, element: "thunder" }
        ]
      }
    },

    // 回廊の答えをまとめた護符。3つのよけ（各+7）より1つずつは軽いが、1枠で3つ防ぐ。
    // 値段は作者の表で空欄だったので、任されて決めた（2026-10-28。1200G → 売値600G。
    // 材料をそのまま売ると 210+27×3+400=691G なので、作って売っても得はしない）
    ivyBreakerCharm: {
      id: "ivyBreakerCharm",
      name: "蔦断ちの護符",
      icon: "iconItemIvyBreakerCharm",
      category: "equipment",
      description: "絡み主根を断ち、灯り苔と小鐘を封じた護符。回廊の闇が伸ばす手を、まとめて退ける。",
      maxStack: 9,
      price: 1200,
      effect: null,
      usableIn: [],
      equip: {
        slot: "accessory",
        effects: [
          { type: "resistBonus", status: "paralysis", value: 5 },
          { type: "resistBonus", status: "seal", value: 5 },
          { type: "resistBonus", status: "curse", value: 5 },
          { type: "statBonus", stat: "hp", value: 15 }
        ]
      }
    }
  };
})(window.MyGame);
