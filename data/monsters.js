/**
 * monsters.js
 * MonsterData（種族データ／図鑑データ）の定義。
 * 「実際に所持する個体」は MonsterInstance が別に持つ（ここは不変の種族情報）。
 *
 * family      : 分類id（categories.js の monster を参照）
 * element     : 属性id（elements.js を参照）。このモンスター自身の属性
 * resistances : 属性ごとの耐性（-5〜10）。書かない属性は 0（等倍）
 *   高いほどその属性のダメージを受けにくい。マイナスは受けるダメージが増える
 *   倍率 = 1 - 耐性 × 0.10（data/battle.js の resistance.resistStep）
 *   マイナスのときは 倍率 = 1 + |耐性| × 0.20（同 weaknessStep）。-5 で2倍
 * immunities  : 完全に無効化する属性idの配列（耐性の値にかかわらずダメージ0）
 *
 * ▼ statusResist : 状態異常ごとの耐性。**式は属性耐性とまったく同じ**
 *   （data/battle.js の resistance）。覚える仕組みを2つにしないため。
 *     10 … 完全に効かない    5 … 通る確率が半分    0 … そのまま
 *   足りないぶんは装備の resistBonus で足す（属性耐性と同じ書き方）。
 *
 *   ★ 全23種すべてに、7つの状態異常ぶんを書いてある。書き忘れを0にするため。
 *     0（＝そのまま通る）も使う。書き忘れとの区別は
 *     「全種そろっているか」を data の検査で見ればよい（早見表と突き合わせる）。
 *
 *   ★ 値は制作者が早見表（早見表/状態異常耐性.txt）で決めている。
 *     このファイルとその表は必ず同じ値にしておくこと。
 *
 *   ★ α-8 で大幅に下げた。**ほとんどの種族・ほとんどの状態異常は 0**。
 *     耐性が高いままだと、装備（毒よけの護符 +7 など）で足しても効きが変わらず、
 *     装備を着ける理由そのものが無くなるため。
 *     耐性を持たせるのは「その状態異常を受ける理由が無い」相手だけにする。
 *       例：コウモリ・ハイバネ 盲目10（目に頼らない）／ビリムシ 麻痺10（雷そのもの）
 *           イワゴロー・ヒビイワ 毒10（岩）／カゲヅタ 眠り10（植物）
 *           ヌマボネ 即死10（もう死んでいる）
 *
 *   ★ 主（ボス）として立ちはだかっているあいだは、
 *     data/battle.js の bossImmuneToStatus が 即死・封印・盲目 を無効にする（全ボス共通）。
 *     いまの主4体は data/bosses.js で毒も個別に無効にしてある。
 *     ここの値が効くのは、スカウトして仲間にしたあと。
 * maxLevel    : このモンスターのレベル上限（省略時は growth.js の defaultMaxLevel）
 *   growth.js の levelCap（99）を超えることはできない
 * growthRate  : 1レベルごとのステータス上昇率（0.01 以上。上限なし）
 *   数値で書くと全ステータス共通：
 *     growthRate: 0.08
 *   オブジェクトで書くとステータスごとに指定できる（書かない項目は default を使う）：
 *     growthRate: { hp: 0.12, attack: 0.06, default: 0.08 }
 *   段階の配列で書くと、レベルで成長率が変わる（何段階でも。α-10。詳しくは data/growth.js）：
 *     growthRate: { hp: [{ from: 1, rate: 0.16 }, { from: 22, rate: 0.20 }], attack: 0.16 }
 *     切り替わっても、それまでに伸びた分はそのまま。Lv22 以降で切り替えれば第一章の主は変わらない
 * description : 図鑑での説明文。**主人公が書いた記録**として書く（ストーリー構成.md の 2）。
 *   序盤の主人公はモンスターを恐れているので、警戒した事務的な書き方で揃える
 *   （属性 → 見た目・生態 → 注意書き → 弱い属性）。
 *   ★ いまの文章は作者が直したもの（α-9）。「魔物」とは書かず「モンスター」で統一する。
 *   ★ 弱い属性は「主人公が知っている弱点」だけを書く。耐性の数値と全部は合わないが、わざと。
 *     （雷は使えるモンスターが少なく、主人公がまだ試せていない。キングスライムなどに雷の弱点が無いのはそのため）
 *     一覧は 早見表/図鑑説明文.txt。**このファイルとその表は必ず同じ文にしておくこと**
 * records     : 愛情度の段階ごとに図鑑へ書き足される、主人公の記録（data/affection.js）。
 *   { used: "慣れの文", trust: "信頼の文", bond: "絆の文" } の形。キーは段階の id。
 *   その種族でいちばん深まった段階までが図鑑に出る。書いていない段階は何も出ない。
 *   ★ まだどの種族にも書いていない（文章は作者が決める）
 * bondReward  : 絆の段階で受け取る、その種族だけの報酬（書き方は data/affection.js の冒頭）。
 *   全モンスターに専用技があるわけではない。専用技の無いモンスターは、能力・耐性が上がったり、既存の技を覚えたりする。
 *     { skill: "技のid" } / { effects: [ … ] } / 両方
 *   ★ まだどの種族にも決めていない。あとから書いても、もう絆に届いている仲間は次に読み込んだとき受け取る
 * baseHp/baseAttack/baseDefense/baseSpeed : 基本ステータス
 *   baseSpeed … 素早さ。大きいほど戦闘で先に行動する
 * basePp      : PPの基本値。技を使うと減る（通常攻撃はPPを使わない）
 * evasion     : 攻撃をかわす確率（0〜1）。書かなければ 0
 *   命中率（技の当たりやすさ）とは別で、受け手が持つ「よけやすさ」。
 *   かわすと 0ダメージで MISS と出る。素早い種族にだけ持たせる
 * attackEffect: 通常攻撃の演出の型（data/effects.js の shapes のid）。
 *   書かなければ技側の effect（impact）。噛みつく相手は "slash"、
 *   硬い体でぶつかる相手は "shards" のように、見た目を種族ごとに変えられる
 * scoutRate   : スカウト成功率の基準値（0〜1）
 * spawnRate   : 出現の重み（相対値）
 * learnset    : 覚える技 [{ level, skill }]
 * abilities   : 特性id（abilities.js を参照）。
 *   1体が持てる数は config.js の abilityMax まで（現在は1つ）
 *
 * ▼ 基礎値の決め方 —— 上げすぎないこと
 *   ステータスは 基礎値 × (1 + (Lv-1) × 成長率) なので、基礎値の差はレベルで増幅される。
 *     基礎HP20 → Lv15で 62
 *     基礎HP30 → Lv15で 93
 *   つまり基礎値を10上げると、Lv15では31上がる（3.1倍になって効く）。
 *   「深いステージだから少し高めに」とやると、後半で手がつけられなくなる。
 *
 *   強いステージの相手は、基礎値ではなく次のどれかで格を出すこと。
 *     ・成長率の配分を尖らせる（速いか硬いか、どれか1つを伸ばす）
 *     ・出現レベルを上げる（data/dungeons.js の levelRange）
 *     ・技・特性・耐性で役割を作る
 *     ・ボスなら data/bosses.js の statMultiplier
 *
 *   目安：在来種の基礎値は HP30 / 攻10 / 防12 / 速12 を超えない。
 *   （現在の最大は HP30ミズダマリ・攻9キノコン&ビリムシ・防11ヒビイワ・速11ビリムシ）
 *
 * sizeScale   : 画面に出るときの大きさの倍率（省略すると 1.0）。
 *   竜のように「大きい相手」を、実際に大きく見せるためのもの。
 *   絵そのものの解像度（16×16 / 32×32 / 48×48）とは別で、
 *   解像度を上げても表示の大きさは変わらない。両方を組み合わせて使う。
 *
 *   ★ 絵は「下端をそろえて上へ伸びる」ように描かれる。
 *     大きくしても足元の位置は動かず、状態表示（名前・HP）にもかぶらない。
 *   ★ 上げすぎると枠からはみ出す。戦闘の枠は縦106pxなので、
 *     1.4（134px）くらいまでが目安。
 *
 * skillRate   : 敵として出たとき、通常攻撃ではなく技を選ぶ確率（0〜1）。
 *   書かなければ data/battle.js の enemyAi.skillRate（全体の既定）を使う。
 *   妨害役のように「技を出してこそ意味がある」相手だけ上げる
 * expReward   : 倒したときに得られる経験値（Lv1のときの量。レベルに応じて増える）
 * goldReward  : 倒したときに得られるゴールド（同上）
 * drops       : 倒したときに落とすアイテム（複数指定でき、それぞれ独立して判定する）
 *   item : アイテムid（items.js を参照）
 *   rate : 落とす確率（0〜1）
 *   min / max : 落とす個数の範囲（省略時は1個）
 * sprite      : スプライトid（data/sprites_〇〇.js を参照）
 * motion      : ふだんの絵の動かし方（data/motions.js のid）。省略すると動かない
 * poses       : 姿の名前 → 絵のid（RC-1）。動きの poses がこの名前で絵を切り替える
 *   例 poses: { squash: "slimeSquash", stretch: "slimeStretch", sleep: "slimeSleep" }
 *   sleep を書くと、眠っている間その絵になる（書かない種族はふつうの絵のまま脱力する）
 * motions     : 場面ごとの動き（data/motions.js のid）。書いた場面だけ動く
 *     attack  … 技を出すとき      hit     … 攻撃を受けたとき
 *     faint   … 倒れるとき        heal    … 回復したとき
 *     guard   … 防御しているあいだ（ずっと続く動き）
 *     levelUp … レベルが上がったとき
 *   省略した場面では動かない。同じidを別の種族で使い回してもよい
 *
 * ★ 新しいモンスターの追加は、このファイルに1エントリ足すだけでよい。
 */
(function (NS) {
  "use strict";

  NS.rawData.monsters = {
    slime: {
      id: "slime",
      name: "スライム",
      // 愛情度で書き足される記録と、絆の報酬（早見表/絆と記録.txt。作者が決めたもの）
      records: {
        used:  "水辺では、ほかのスライムと体を寄せ合って眠る。冷えると少し固くなる。",
        trust: "撫でられるのが好きで、手を止めると体を押しつけてくる。怒ると小さく震える。",
        bond:  "足元にいるのが、当たり前になった。この温かさを、もう怖いとは思わない。"
      },
      bondReward: { skill: "standGuard" },
      family: "slimeKind",
      element: "water",
      resistances: { water: 5, thunder: -2, dark: -1 },
      immunities: [],
      // 体が液体なので毒は薄まり、神経が無いので麻痺・眠りも通りにくい。目も持たない
      statusResist: { poison: 8, paralysis: 5, sleep: 0, seal: 0,
                      blind: 0, curse: 0, instantDeath: 5 },
      // 上限99の3種のうちの1体。強さで抜けるのではなく、長く付き合える枠
      maxLevel: 99,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.40 }, { from: 50, rate: 0.50 }, { from: 55, rate: 0.65 }, { from: 61, rate: 0.35 }, { from: 80, rate: 0.30 }],
        attack:  [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.40 }, { from: 40, rate: 0.55 }, { from: 50, rate: 0.70 }, { from: 71, rate: 0.60 }],
        defense: [{ from: 1, rate: 0.18 }, { from: 25, rate: 1.00 }, { from: 40, rate: 1.30 }, { from: 50, rate: 1.60 }, { from: 61, rate: 0.85 }],
        speed:   [{ from: 1, rate: 0.13 }, { from: 25, rate: 0.55 }, { from: 40, rate: 0.74 }, { from: 50, rate: 0.93 }, { from: 61, rate: 0.66 }],
        pp:      [{ from: 1, rate: 0.10 }, { from: 25, rate: 0.40 }, { from: 40, rate: 1.20 }, { from: 50, rate: 0.90 }, { from: 91, rate: 1.10 }]
      },
      description: "水属性。柔らかい体は打撃を吸い込み、傷もすぐに塞がる。見た目よりずっとしぶとい。動きは遅いが、人を襲う可能性はある。近づくときは注意すること。闇と雷に弱い。",
      baseHp: 22,
      baseAttack: 5,
      baseDefense: 4,
      baseSpeed: 3,
      basePp: 4,
      scoutRate: 0.45,
      evasion: 0,
      spawnRate: 1.0,
      learnset: [
        { level: 1, skill: "tackle" },
        // ゲーム中で唯一の水属性。灼熱の亀裂に入るころに間に合う位置に置いてある。
        // ステージ1のあいだは体当たりだけなので、そこの難易度は変わらない
        { level: 8, skill: "aqua" },
        // 最初の1体が、育てると回復役にもなる。
        // 深層（推奨Lv16）に入るより手前で覚えるので、潜る前に頼れる
        { level: 11, skill: "cure" },
        // 属性技の2段目（RC-1）。2段目はどの種族も Lv18 前後にそろえてある（data/skills.js の tier2）
        { level: 18, skill: "wave" },
        // 回復役としての伸び（RC-1・作者の指定）。毒沼に入るころに毒を治せる
        { level: 18, skill: "cleanse" },
        { level: 26, skill: "greaterCure" }
      ],
      abilities: ["tough"],
      expReward: 8,
      goldReward: 4,
      drops: [
        { item: "herb", rate: 0.12, min: 1, max: 1 }
      ],
      // コマ絵の見本。ふつうの姿を使い回すので、描き足したのは2枚だけ
      sprite: ["slimeStretch", "slime", "slimeStretch", "slimeSquash"],
      motion: "slimeIdle",
      // 姿（RC-1）。動き（data/motions.js）の poses が名前で指す絵。
      //   squash 潰れた姿 ／ stretch 伸びた姿 ／ sleep 目を閉じて脱力した姿（眠り）
      poses: { squash: "slimeSquash", stretch: "slimeStretch", sleep: "slimeSleep" },
      // 場面ごとの動き（RC-1 でスライム専用に作った。姿を切り替えながら動く）
      motions: {
        attack:    "slimeTackle",
        resonance: "slimeResonate",
        breath:    "slimeBreath",
        technique: "slimeTechnique",
        buff:      "slimeBuff",
        hit:       "slimeHit",
        dodge:     "slimeDodge",
        faint:     "fall",
        heal:      "recover",
        guard:     "guard",
        levelUp:   "slimeCheer",
        // 眠っている間（data/statuses.js の sleep.idleMotion を種族ごとに差し替える）
        sleeping:  "slimeSleeping"
      }
    },
    batty: {
      id: "batty",
      name: "コウモリ",
      records: {
        used:  "昼は天井の割れ目に逆さに下がって眠る。群れの中でも決まった場所があるらしい。",
        trust: "明かりを嫌うが、たき火の明かりだけは平気なようだ。肩に止まりたがる。",
        bond:  "背後にいても、もう驚かない。そこにいるのが分かるから。"
      },
      bondReward: { skill: "hazyWing" },
      family: "beastKind",
      element: "dark",
      resistances: { dark: 3, earth: 3, fire: -2, thunder: -2 },
      immunities: [],
      // 超音波で「見て」いるので盲目がほとんど効かない。闇の眷属なので呪いにも強い
      statusResist: { poison: 0, paralysis: 0, sleep: 5, seal: 0,
                      blind: 10, curse: 0, instantDeath: 5 },
      // 上限99の3種のうちの1体。育て切ると素早さが全種で最も高くなる
      maxLevel: 99,
      // ステータスごとに成長率を変える例：素早さだけ伸びやすい
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.12 }, { from: 25, rate: 0.28 }, { from: 40, rate: 0.45 }, { from: 50, rate: 0.40 }, { from: 61, rate: 0.75 }],
        attack:  [{ from: 1, rate: 0.18 }, { from: 25, rate: 0.45 }, { from: 50, rate: 0.60 }, { from: 61, rate: 0.35 }],
        defense: [{ from: 1, rate: 0.14 }, { from: 25, rate: 0.70 }, { from: 40, rate: 0.90 }, { from: 50, rate: 1.25 }, { from: 61, rate: 0.60 }],
        speed:   [{ from: 1, rate: 0.18 }, { from: 25, rate: 0.75 }, { from: 40, rate: 1.50 }, { from: 45, rate: 1.10 }, { from: 61, rate: 0.66 }],
        pp:      [{ from: 1, rate: 0.12 }, { from: 25, rate: 0.65 }, { from: 40, rate: 0.82 }, { from: 50, rate: 0.98 }, { from: 61, rate: 0.59 }]
      },
      description: "闇属性。暗がりを好み、素早く飛び回る。気づいたときには背後にいる。明かりを絶やさないこと。火に弱い。",
      baseHp: 16,
      baseAttack: 8,
      baseDefense: 2,
      baseSpeed: 8,
      basePp: 4,
      // ひらひら飛ぶのでよくかわす
      evasion: 0.10,
      attackEffect: "slash",
      scoutRate: 0.35,
      spawnRate: 0.8,
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 3, skill: "bite" },
        // 打たれ弱さ（防御2）を、自分で回復して補えるようにする
        { level: 9, skill: "drainBite" }
      ],
      abilities: ["swiftFoot"],
      expReward: 8,
      goldReward: 5,
      drops: [],
      // 羽ばたきのコマ絵（RC-1）。振り上げ → 水平 → 振り下ろし → 水平
      sprite: ["battyUp", "batty", "battyDown", "batty"],
      motion: "batFlutter",
      // 姿（RC-1）。up 翼を振り上げ ／ down 振り下ろし ／ sleep 目を閉じた姿
      poses: { up: "battyUp", down: "battyDown", sleep: "battySleep" },
      // 場面ごとの動き（RC-1 でコウモリ専用に作った）。
      // 飛んでいるので跳ねない。喜ぶときは羽ばたきながら一回転し、倒れるときは傾いて落ちる。
      // 眠るときは天井から下がるように逆さになる
      motions: {
        attack:    "batBite",
        resonance: "batResonate",
        breath:    "batBreath",
        technique: "batTechnique",
        buff:      "batBuff",
        hit:       "batHit",
        dodge:     "batDodge",
        faint:     "tumble",
        levelUp:   "batCheer",
        sleeping:  "batSleeping"
      }
    },
    // --- 苔むす坑道のモンスター ---

    mossRat: {
      id: "mossRat",
      name: "コケネズミ",
      records: {
        used:  "背の苔は湿り気で色が変わる。乾くと灰色になり、少し元気がなくなる。",
        trust: "拾ったものを巣に溜め込む癖がある。荷物の中身が、ときどき減っている。",
        bond:  "小さな体で、誰より先に前へ出る。無理はするなと、何度言っても聞かない。"
      },
      bondReward: { effects: [
        { type: "resistBonus", element: "fire", value: 3 },
        { type: "resistBonus", element: "wind", value: 3 }
      ] },
      family: "beastKind",
      element: "earth",
      // 小さな牙で噛む
      attackEffect: "slash",
      resistances: { earth: 5, wind: -1, fire: -2 },
      immunities: [],
      // ただの獣なので、どれもあまり効かない。特性「ど根性」ぶん即死だけ少し高い
      statusResist: { poison: 0, paralysis: 2, sleep: 2, seal: 0,
                      blind: 0, curse: 0, instantDeath: 0 },
      maxLevel: 60,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.14 }, { from: 25, rate: 0.55 }, { from: 40, rate: 0.25 }, { from: 50, rate: 0.20 }],
        attack:  [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.30 }, { from: 40, rate: 0.35 }, { from: 50, rate: 0.24 }],
        defense: [{ from: 1, rate: 0.15 }, { from: 25, rate: 0.40 }, { from: 40, rate: 0.35 }, { from: 50, rate: 0.30 }],
        speed:   [{ from: 1, rate: 0.15 }, { from: 25, rate: 0.65 }, { from: 40, rate: 0.30 }],
        pp:      [{ from: 1, rate: 0.10 }, { from: 25, rate: 0.50 }, { from: 40, rate: 0.25 }, { from: 50, rate: 0.18 }]
      },
      description: "地属性。背に苔を生やした小型の獣。坑道の壁を走り回り、足元から来る。小さいからと油断しないこと。火に弱い。",
      baseHp: 17,
      baseAttack: 7,
      baseDefense: 3,
      baseSpeed: 8,
      basePp: 4,
      scoutRate: 0.40,
      spawnRate: 0.9,
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 4, skill: "bite" },
        // RC-1・作者の指定。坑道の敵は Lv4 までなので、野生のコケネズミは使ってこない
        { level: 14, skill: "cure" }
      ],
      abilities: ["guts"],
      expReward: 11,
      goldReward: 5,
      drops: [
        { item: "herb", rate: 0.14, min: 1, max: 1 }
      ],
      sprite: "mossRat",
      motion: "ratHop",
      poses: { crouch: "mossRatCrouch", stretch: "mossRatStretch", sleep: "mossRatSleep" },
      motions: {
        attack: "ratBite", resonance: "ratResonate", breath: "ratBreath",
        technique: "ratTechnique", buff: "ratBuff", hit: "ratHit", dodge: "ratDodge",
        faint: "fall", levelUp: "ratCheer", sleeping: "ratSleeping"
      }
    },

    rocky: {
      id: "rocky",
      name: "イワゴロー",
      records: {
        used:  "一日の大半を動かずに過ごす。苔が生えるまで同じ場所にいることもある。",
        trust: "考えているのか眠っているのか、見分けがつかない。呼ぶと少しだけ転がってくる。",
        bond:  "重くて、遅くて、動じない。その背に寄りかかると落ち着く。"
      },
      bondReward: { effects: [ { type: "resistBonus", element: "water", value: 5 } ] },
      family: "constructKind",
      element: "earth",
      resistances: { earth: 4, water: -2 },
      immunities: [],
      // 岩なので毒がまったく通らない。技を組み立てる頭は無いので封印は半分効く
      statusResist: { poison: 10, paralysis: 0, sleep: 0, seal: 5,
                      blind: 0, curse: 0, instantDeath: 0 },
      maxLevel: 60,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.18 }, { from: 25, rate: 0.40 }, { from: 50, rate: 0.48 }],
        attack:  [{ from: 1, rate: 0.15 }, { from: 25, rate: 0.30 }, { from: 40, rate: 0.37 }, { from: 50, rate: 0.44 }],
        defense: [{ from: 1, rate: 0.20 }, { from: 25, rate: 0.50 }, { from: 40, rate: 0.55 }, { from: 50, rate: 0.77 }],
        speed:   [{ from: 1, rate: 0.06 }, { from: 25, rate: 0.29 }, { from: 40, rate: 0.36 }, { from: 50, rate: 0.32 }],
        pp:      [{ from: 1, rate: 0.10 }, { from: 25, rate: 0.32 }, { from: 40, rate: 0.41 }, { from: 50, rate: 0.44 }]
      },
      description: "地属性。岩が動いているとしか思えない。硬く、攻撃が通りにくいが移動は遅い。水に弱い。",
      baseHp: 25,
      baseAttack: 6,
      baseDefense: 9,
      baseSpeed: 2,
      basePp: 4,
      // 岩の体でぶつかるので、当たると砕けた音がする見た目にする
      attackEffect: "shards",
      scoutRate: 0.35,
      spawnRate: 0.6,
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 5, skill: "rockThrow" },
        { level: 18, skill: "rockSpike" }
      ],
      abilities: ["earthPower"],
      expReward: 12,
      goldReward: 8,
      drops: [
        { item: "oreShard", rate: 0.25, min: 1, max: 2 },
        // 買えない装備。イワゴローは坑道の6種のうちの1体なので、
        // 出現率で薄まるぶんを見込んで確率は高めにしてある
        { item: "stoneMail", rate: 0.19, min: 1, max: 1 }
      ],
      sprite: "rocky",
      motion: "rockIdle",
      // 目だけを変えた姿（RC-1）。細目＝力を溜める顔、閉じた目＝眠り・被弾
      poses: { narrow: "rockyNarrow", wince: "rockySleep", sleep: "rockySleep" },
      // 岩なので潰れも伸びもしない。転がる・揺れる・重く跳ねる（RC-1）。倒れるというより崩れる
      motions: {
        attack: "rockTackle", resonance: "rockResonate", breath: "rockBreath",
        technique: "rockTechnique", buff: "rockBuff", hit: "rockHit", dodge: "rockDodge",
        faint: "crumble", levelUp: "rockCheer", sleeping: "rockSleeping"
      }
    },

    glowBug: {
      id: "glowBug",
      name: "ヒカリムシ",
      records: {
        used:  "光は呼吸に合わせて強まり、弱まる。眠っているときは消えかけの火のようだ。",
        trust: "褒めると明るく光る。分かりやすい。",
        bond:  "暗い道で、いつも少し前を飛ぶ。この光についていけば迷わない。"
      },
      bondReward: { skill: "guidingLight" },
      family: "insectKind",
      element: "light",
      // 闇はもともと -3 だった。深層のヨミリュウ（闇の範囲技持ち）への答えが
      // この1種しかいないのに、その息で一撃で落ちてしまうため -2 に緩めた
      resistances: { light: 7, dark: -2 },
      immunities: [],
      // 自ら光るので盲目が効かず、光は呪いを弾く。虫なので体そのものは脆い
      statusResist: { poison: 0, paralysis: 0, sleep: 0, seal: 5,
                      blind: 0, curse: 0, instantDeath: 5 },
      // 深層のヨミリュウへの答えを担うので、坑道の雑魚だが上限は高くしてある
      maxLevel: 80,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.14 }, { from: 25, rate: 0.50 }, { from: 50, rate: 0.40 }, { from: 71, rate: 0.35 }],
        attack:  [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.50 }, { from: 40, rate: 0.40 }, { from: 61, rate: 0.18 }, { from: 75, rate: 1.50 }],
        defense: [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.65 }, { from: 50, rate: 0.81 }, { from: 61, rate: 0.45 }],
        speed:   [{ from: 1, rate: 0.18 }, { from: 25, rate: 0.50 }, { from: 40, rate: 0.49 }, { from: 50, rate: 0.59 }, { from: 61, rate: 0.35 }],
        pp:      [{ from: 1, rate: 0.15 }, { from: 25, rate: 0.90 }, { from: 40, rate: 0.99 }, { from: 61, rate: 0.55 }]
      },
      description: "光属性。尾を光らせて飛ぶ虫。暗い坑道では道しるべになるが、その光に別のモンスターが寄ってくるかもしれない。闇に弱い。",
      baseHp: 18,
      baseAttack: 8,
      baseDefense: 3,
      baseSpeed: 8,
      basePp: 6,
      // 小さく速く飛ぶのでかわしやすい
      evasion: 0.10,
      scoutRate: 0.35,
      spawnRate: 0.7,
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 4, skill: "glimmer" },
        // 攻撃の伸びが低いので、技の威力で仕事をさせる。
        // 深層のヨミリュウ（闇に完全耐性・光が弱点）への答えがこれ
        { level: 13, skill: "shine" }
      ],
      abilities: ["glowing"],
      expReward: 14,
      goldReward: 7,
      drops: [
        { item: "glowDust", rate: 0.25, min: 1, max: 1 }
      ],
      // ふだんは翅のコマ絵で羽ばたく（RC-1）。上げ → 水平 → 下げ → 水平
      sprite: ["glowBugUp", "glowBug", "glowBugDown", "glowBug"],
      motion: "bugGlow",
      // 姿（RC-1）。翅の上げ下げ・尾が明るく光る・目を閉じて光が弱まる（眠り）
      poses: { up: "glowBugUp", down: "glowBugDown", bright: "glowBugBright", sleep: "glowBugSleep" },
      // 飛んでいるので落ちる
      motions: {
        attack: "bugDive", resonance: "bugResonate", breath: "bugBreath",
        technique: "bugTechnique", buff: "bugBuff", hit: "bugHit", dodge: "bugDodge",
        faint: "tumble", levelUp: "bugCheer", sleeping: "bugSleeping"
      }
    },

    sporin: {
      id: "sporin",
      name: "キノコン",
      records: {
        used:  "胞子は湿った日に多く撒く。乾いた場所では笠を閉じて、じっとしている。",
        trust: "気に入らないことがあると、胞子で抗議してくる。くしゃみが止まらない。",
        bond:  "胞子を撒く相手を、選ぶようになった……たぶん、信用されたのだと思う。"
      },
      bondReward: { skill: "sleepSpore" },
      family: "plantKind",
      element: "dark",
      resistances: { earth: 4, dark: 2, light: -1 },
      immunities: [],
      // 自分が闇の胞子（毒）を撒く側なので毒に強い。目を持たず、闇にも近い
      statusResist: { poison: 10, paralysis: 0, sleep: 0, seal: 0,
                      blind: 0, curse: 0, instantDeath: 3 },
      maxLevel: 70,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.15 }, { from: 25, rate: 0.20 }, { from: 40, rate: 0.30 }, { from: 50, rate: 0.45 }, { from: 61, rate: 0.88 }],
        attack:  [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.40 }, { from: 50, rate: 0.60 }],
        defense: [{ from: 1, rate: 0.14 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.45 }, { from: 50, rate: 0.65 }, { from: 61, rate: 0.45 }],
        speed:   [{ from: 1, rate: 0.12 }, { from: 25, rate: 0.21 }, { from: 40, rate: 0.35 }, { from: 50, rate: 0.51 }, { from: 61, rate: 0.41 }],
        pp:      [{ from: 1, rate: 0.14 }, { from: 25, rate: 0.41 }, { from: 40, rate: 0.68 }, { from: 50, rate: 0.99 }, { from: 61, rate: 0.79 }]
      },
      description: "闇属性。坑道の湿った隅に生えるキノコのモンスター。近づくと胞子を撒く。光に弱い。",
      baseHp: 24,
      baseAttack: 9,
      baseDefense: 6,
      baseSpeed: 5,
      basePp: 5,
      scoutRate: 0.25,
      spawnRate: 0.6,
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 5, skill: "darkSpore" },
        { level: 18, skill: "darkNebula" }
      ],
      abilities: ["wildInstinct"],
      expReward: 16,
      goldReward: 8,
      drops: [
        { item: "herb", rate: 0.15, min: 1, max: 1 }
      ],
      sprite: "sporin",
      motion: "sporeSway",
      // 姿（RC-1）。柄の行を抜き差しした 縮む・伸びる と、縮んで目を閉じた眠り
      poses: { squash: "sporinSquash", stretch: "sporinStretch", sleep: "sporinSleep" },
      // 根が生えているので大きくは動かない。胞子の技はくしゃみで撒く。きのこなので、しぼむように崩れる
      motions: {
        attack: "shroomBonk", resonance: "shroomResonate", breath: "shroomSneeze",
        technique: "shroomTechnique", buff: "shroomBuff", hit: "shroomHit", dodge: "shroomDodge",
        faint: "crumble", levelUp: "shroomCheer", sleeping: "shroomSleeping"
      }
    },

    // ボス用の種族。通常のモンスターと同じ形式なので、
    // 出現テーブル(dungeons.js)に入れれば通常敵としても使える。
    mossGolem: {
      id: "mossGolem",
      name: "モスゴーレム",
      records: {
        used:  "苔は上を向いた面にだけ生える。長い時間、同じ姿勢で眠っていた証だ。",
        trust: "動きは遅いが、足元の小さな仲間を踏まないよう、気をつけて歩く。",
        bond:  "坑道の奥で眠っていた巨人が、今は隣を歩いている。不思議な気分だ。"
      },
      bondReward: { effects: [
        { type: "statMultiplier", stat: "defense", value: 1.25 },
        { type: "statMultiplier", stat: "hp", value: 1.08 }
      ] },
      family: "constructKind",
      element: "earth",
      // 全身が苔に覆われているぶん、火と光に弱い
      resistances: { earth: 5, water: 2, fire: -2, light: -2 },
      immunities: [],
      // 石の体なので毒・麻痺・眠りが通らない。主なので即死にも強い
      //   ※ 主として立ちはだかっているあいだは即死・封印・盲目が効かず（data/battle.js）、
      //     毒も bosses.js で無効にしてある。この値が効くのは、スカウトして仲間にしたあと
      statusResist: { poison: 8, paralysis: 7, sleep: 8, seal: 0,
                      blind: 7, curse: 0, instantDeath: 9 },
      maxLevel: 50,
      // 守りとHPが伸び、足は止まったまま。ヒビイワ（構造体の在来種）の上位版という形
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.17 }, { from: 25, rate: 0.35 }, { from: 40, rate: 0.65 }],
        attack:  [{ from: 1, rate: 0.14 }, { from: 25, rate: 0.45 }, { from: 40, rate: 0.55 }],
        defense: [{ from: 1, rate: 0.19 }, { from: 25, rate: 0.65 }, { from: 40, rate: 0.75 }],
        speed:   [{ from: 1, rate: 0.07 }, { from: 25, rate: 0.31 }, { from: 40, rate: 0.26 }],
        pp:      [{ from: 1, rate: 0.10 }, { from: 25, rate: 0.33 }, { from: 40, rate: 0.55 }]
      },
      description: "地属性。探索者の間では坑道の主と呼ばれている。苔に覆われた石の巨人で、坑道の奥で長く眠っていたらしい。一撃が重い。光に弱い。",
      // 基礎値は「仲間にしたとき」の強さ。在来種の最強格（ヒビイワ 28/8/11/3）と
      // 並ぶ程度に抑えてある。主として立ちはだかるときの強さは
      // data/bosses.js の statMultiplier で足す
      baseHp: 30,
      baseAttack: 8,
      baseDefense: 11,
      baseSpeed: 3,
      basePp: 4,
      // ボスなので渋い。瀕死まで削って5%（満タンでは2%）
      scoutRate: 0.02,
      spawnRate: 0,      // 通常のエンカウントでは出ない
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 5, skill: "rockThrow" },
        { level: 18, skill: "rockSpike" }
      ],
      abilities: ["thickSkin"],
      expReward: 90,
      goldReward: 55,
      drops: [
        { item: "mossyCore", rate: 1.0, min: 1, max: 1 }
      ],
      sprite: "mossGolem",
      // 主は雑魚より一回り大きく画面に出す。奥のステージほど大きくしてある
      // （坑道1.15 → 亀裂1.25 → 深層1.4）。表示だけで、ステータスには効かない
      sizeScale: 1.15,
      motion: "golemBreathe",
      // 目だけを変えた姿（RC-1）。細目＝溜める・被弾、眠り＝目の光が消える
      poses: { narrow: "mossGolemNarrow", sleep: "mossGolemSleep" },
      // 石の巨人なので、溜めが長く、ゆっくり重い。飛び跳ねない（RC-1）
      motions: {
        attack: "golemSlam", resonance: "golemResonate", breath: "golemBreath",
        technique: "golemTechnique", buff: "golemBuff", hit: "golemHit", dodge: "golemDodge",
        faint: "crumble", levelUp: "golemCheer", sleeping: "golemSleeping"
      }
    },

    // 灼熱の亀裂の主。フレイミンが雑魚として出るので、専用の種族を用意した
    magmaBeast: {
      id: "magmaBeast",
      name: "マグマウルフ",
      records: {
        used:  "たてがみの炎は、怒ると強まり、眠ると熾火のように小さくなる。",
        trust: "撫でるには手袋が要る。それでも頭を差し出してくる。",
        bond:  "焦げ跡の残る道を、もう避けなくなった。その先にいるのが分かっているから。"
      },
      bondReward: { effects: [
        { type: "resistBonus", element: "water", value: 5 },
        { type: "resistBonus", element: "wind", value: 2 }
      ] },
      family: "beastKind",
      element: "fire",
      // 火は完全に無効（data/battle.js の immuneAt が10）。水は最大の弱点のまま
      resistances: { fire: 10, water: -4, wind: -1 },
      immunities: [],
      // 主なので即死に強い。獣なので目は効く
      statusResist: { poison: 0, paralysis: 10, sleep: 0, seal: 9,
                      blind: 9, curse: 0, instantDeath: 9 },
      maxLevel: 50,
      // 攻めと速さが伸び、守りが置いていかれる。育てるほど「殴られる前に殴る」形になる
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.31 }, { from: 35, rate: 0.25 }, { from: 40, rate: 0.19 }],
        attack:  [{ from: 1, rate: 0.19 }, { from: 25, rate: 0.40 }, { from: 40, rate: 0.30 }],
        defense: [{ from: 1, rate: 0.11 }, { from: 25, rate: 0.30 }, { from: 40, rate: 0.25 }],
        speed:   [{ from: 1, rate: 0.17 }, { from: 25, rate: 0.65 }, { from: 40, rate: 0.50 }],
        pp:      [{ from: 1, rate: 0.13 }, { from: 25, rate: 0.30 }, { from: 40, rate: 0.50 }, { from: 45, rate: 1.25 }]
      },
      description: "火属性。探索者の間では亀裂の主と呼ばれている。たてがみが燃えていて、通った跡はすべて焦げている。近づくだけで肌が焼ける。火の息には注意。水に弱い。",
      // 基礎値は「仲間にしたとき」の強さ。在来種より少し上、という程度に抑えてある。
      // 主として立ちはだかるときの強さは data/bosses.js の statMultiplier で足す
      baseHp: 35,
      baseAttack: 16,
      // 防御はダメージ式で「×0.25 を引く」形なので、上げすぎると誰も削れなくなる。
      // 補正込みで29（坑道の主と同じ）に収まる値にしてある
      baseDefense: 8,
      baseSpeed: 7,
      basePp: 6,
      // 牙で噛みつく
      attackEffect: "slash",
      scoutRate: 0.03,
      spawnRate: 0,      // 通常のエンカウントでは出ない
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 4, skill: "bite" },
        { level: 8, skill: "ember" },
        // この獣だけが使う範囲技。仲間にすると、育てて初めて手に入る
        { level: 10, skill: "fireBreath" },
        { level: 18, skill: "flame" }
      ],
      abilities: ["fireSoul"],
      expReward: 115,
      goldReward: 80,
      drops: [
        { item: "blazingFang", rate: 1.0, min: 1, max: 1 }
      ],
      // 待機は [元, IdleA, 元, IdleB]：尻尾の炎が傾く・伸びる、たてがみの先がなびく（RC-1）
      sprite: ["magmaBeast", "magmaBeastIdleA", "magmaBeast", "magmaBeastIdleB"],
      sizeScale: 1.25,
      motion: "beastBreathe",
      // 頭・あご・脚・尻尾を動かした姿（RC-1 の作り直し）。rage・blaze は色だけの姿（今は使っていない）
      poses: { rage: "magmaBeastRage", blaze: "magmaBeastBlaze", sleep: "magmaBeastSleep",
               idleA: "magmaBeastIdleA", idleB: "magmaBeastIdleB",
               crouch: "magmaBeastCrouch", leap: "magmaBeastLeap", bite: "magmaBeastBite",
               runA: "magmaBeastRunA", runB: "magmaBeastRunB",
               howl: "magmaBeastHowl", breath: "magmaBeastBreath", flinch: "magmaBeastFlinch" },
      // 捕食者なので溜めは短く、飛びかかりは大きい（RC-1）。炎なので、燃え尽きるように崩れる
      motions: {
        attack: "wolfPounce", resonance: "wolfResonate", breath: "wolfBreath",
        technique: "wolfTechnique", buff: "wolfBuff", hit: "wolfHit", dodge: "wolfDodge",
        faint: "crumble", levelUp: "wolfCheer", sleeping: "wolfSleeping"
      }
    },

    kingSlime: {
      id: "kingSlime",
      name: "キングスライム",
      records: {
        used:  "冠は体に沈んだまま落ちない。どこで手に入れたのかは分からない。",
        trust: "ほかのスライムが近くにいると、体を少し大きくする。",
        bond:  "王は王でも、甘えるときは普通のスライムと変わらない。"
      },
      bondReward: { skill: "kingsCommand" },
      family: "slimeKind",
      element: "water",
      resistances: { water: 9, thunder: -3, dark: -1 },
      immunities: [],
      // 最後の主。スライムの性質（液体・神経なし・目なし）に、王としての格が乗る
      statusResist: { poison: 10, paralysis: 10, sleep: 0, seal: 0,
                      blind: 5, curse: 2, instantDeath: 9 },
      // 王なので上限はいちばん高い。ヨミリュウ(75)より上に置いてある
      maxLevel: 85,
      // 王らしくHPと守りに寄せ、足は捨てる。
      // 立ちはだかるときの強さは data/bosses.js の statMultiplier で足す
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.19 }, { from: 25, rate: 0.25 }, { from: 45, rate: 0.37 }, { from: 55, rate: 0.60 }, { from: 61, rate: 0.15 }, { from: 80, rate: 1.05 }],
        attack:  [{ from: 1, rate: 0.15 }, { from: 25, rate: 0.20 }, { from: 30, rate: 0.35 }, { from: 55, rate: 0.65 }, { from: 61, rate: 0.30 }],
        defense: [{ from: 1, rate: 0.17 }, { from: 25, rate: 0.25 }, { from: 50, rate: 0.63 }, { from: 65, rate: 0.40 }],
        speed:   [{ from: 1, rate: 0.07 }, { from: 25, rate: 0.15 }, { from: 50, rate: 0.30 }],
        pp:      [{ from: 1, rate: 0.13 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.40 }, { from: 50, rate: 0.55 }, { from: 61, rate: 0.35 }]
      },
      basePp: 7,
      description: "水属性。探索者の間では深層の主と呼ばれている。スライムたちの王で、頭に冠を載せている。体が大きく、体重を生かしたボディプレスは強力。闇に弱い。",
      // 基礎値は「仲間にしたとき」の強さ。在来種の目安（HP30/攻10/防12/速12）内に収めてある。
      // 以前は 60/12/8/5 だったので、仲間にするとLv1で在来種を大きく超えていた
      baseHp: 28,
      baseAttack: 10,
      baseDefense: 10,
      baseSpeed: 4,
      // 最後のボスなので、ゴーレムより少しだけ渋くない。瀕死で7.5%
      scoutRate: 0.03,
      spawnRate: 0,      // 通常のエンカウントでは出ない
      learnset: [
        { level: 1, skill: "tackle" },
        // 王だけが使う重い一撃。ローテーションの軸になる
        { level: 2, skill: "bodyPress" },
        { level: 6, skill: "bite" },
        // 水の王なので水も使う。ローテーションで撃つので、必ず覚えている必要がある
        { level: 8, skill: "aqua" },
        // 主としてのローテーション（data/bosses.js）には入れていない。仲間にして育てると覚える
        { level: 18, skill: "wave" }
      ],
      abilities: ["kingsDignity"],
      expReward: 80,
      goldReward: 50,
      // 他の2体の主と同じく、専用の素材を必ず落とす
      drops: [
        { item: "crownShard", rate: 1.0, min: 1, max: 1 }
      ],
      // 待機は [元, LeanL, 元, LeanR]：体が左右に揺れ、王冠が傾く（RC-1）
      sprite: ["kingSlime", "kingSlimeLeanL", "kingSlime", "kingSlimeLeanR"],
      // 最後の主なので、ヨミリュウ（1.35）より大きい
      sizeScale: 1.4,
      motion: "kingWobble",
      // 姿（RC-1 の作り直し）。王冠・目・口・ゼリーの体を動かした絵。縦に伸びるのは scaleY で足す（王冠が枠の上まであるため）
      poses: { squash: "kingSlimeSquash", sleep: "kingSlimeSleep",
               stretch: "kingSlimeStretch", pop: "kingSlimePop", roar: "kingSlimeRoar",
               leanL: "kingSlimeLeanL", leanR: "kingSlimeLeanR",
               ouch: "kingSlimeOuch", calm: "kingSlimeCalm", happy: "kingSlimeHappy" },
      motions: {
        attack: "kingTackle", resonance: "kingResonate", breath: "kingBreath",
        technique: "kingTechnique", buff: "kingBuff", hit: "kingHit", dodge: "kingDodge",
        faint: "fall", levelUp: "kingCheer", sleeping: "kingSleeping"
      }
    },
    // --- 灼熱の亀裂のモンスター ---

    ashWing: {
      id: "ashWing",
      name: "ハイバネ",
      records: {
        used:  "熱い風の上でしか長く飛べない。冷えた場所では、羽をたたんで歩く。",
        trust: "羽の灰を払ってやると喜ぶ。ほかの誰にもさせないらしい。",
        bond:  "軽く脆い体で、いつも一番に飛び込んでいく。帰ってくる場所は、ここだ。"
      },
      bondReward: { effects: [
        { type: "resistBonus", element: "water", value: 3 },
        { type: "statMultiplier", stat: "speed", value: 1.18 }
      ] },
      family: "birdKind",
      element: "wind",
      // 空を行くので地の技が届きにくい。熱の中で暮らすぶん火にも強いが、
      // 濡れた羽と、雷を受け止める体の軽さが弱点
      resistances: { fire: 5, earth: 4, thunder: -2, water: -2 },
      immunities: [],
      // 体がひどく軽い鳥。空を見ているので盲目が効かないが、打たれ弱い
      statusResist: { poison: 0, paralysis: 0, sleep: 0, seal: 0,
                      blind: 10, curse: 0, instantDeath: 0 },
      maxLevel: 70,
      // 素早さだけ突出させる。そのぶん打たれ弱い
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.12 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.35 }, { from: 50, rate: 0.40 }, { from: 65, rate: 0.55 }],
        attack:  [{ from: 1, rate: 0.18 }, { from: 25, rate: 0.45 }, { from: 40, rate: 0.55 }, { from: 50, rate: 0.75 }],
        defense: [{ from: 1, rate: 0.11 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.45 }, { from: 50, rate: 0.50 }, { from: 61, rate: 0.25 }],
        speed:   [{ from: 1, rate: 0.20 }, { from: 25, rate: 0.45 }, { from: 40, rate: 0.55 }, { from: 50, rate: 0.60 }, { from: 61, rate: 0.85 }],
        pp:      [{ from: 1, rate: 0.13 }, { from: 25, rate: 0.41 }, { from: 40, rate: 0.50 }, { from: 50, rate: 0.60 }, { from: 61, rate: 0.25 }]
      },
      description: "風属性。灰をまとって舞う鳥。亀裂の熱に乗って、上から来る。体は軽く脆い。水に弱い。",
      baseHp: 14,
      baseAttack: 7,
      baseDefense: 3,
      baseSpeed: 10,
      basePp: 5,
      // いちばん速いので、いちばんよくかわす
      evasion: 0.10,
      attackEffect: "slash",
      scoutRate: 0.30,
      spawnRate: 0.8,
      learnset: [
        { level: 1, skill: "tackle" },
        // 出現レベルが4〜8なので、ほとんどの個体がウィンドを持って出てくる。
        // プレイヤーがこの場所で初めて風の技に出会う
        { level: 4, skill: "gust" },
        // RC-1・作者の指定。亀裂の敵は Lv10 までなので、野生のハイバネは使ってこない
        { level: 15, skill: "cure" },
        { level: 18, skill: "gale" }
      ],
      abilities: ["windFlow"],
      expReward: 15,
      goldReward: 8,
      drops: [
        { item: "ashFeather", rate: 0.28, min: 1, max: 1 },
        // 買えない装備。ゲーム中で唯一、風の技が伸びる
        { item: "windCrest", rate: 0.13, min: 1, max: 1 }
      ],
      // ふだんは翼のコマ絵で羽ばたく（RC-1 の作り直し）。翼を付け根で回し、
      // 立てた翼 → 外 → 斜め → 真横 → 振り下ろし → 戻る → 少し振り上げ、を1往復にしている
      sprite: ["ashWing", "ashWingOut", "ashWingMid", "ashWingFlat", "ashWingDown",
               "ashWingFlat", "ashWingMid", "ashWingOut", "ashWing", "ashWingUp"],
      // 体がひどく軽いので、羽ばたきは速いが体は熱に乗ってゆっくり漂う
      motion: "ashDrift",
      // 姿（RC-1 の作り直し）。up（振り上げ）・out・mid・flat（真横）・down（振り下ろし）・fold（たたむ）・sleep
      poses: { up: "ashWingUp", out: "ashWingOut", mid: "ashWingMid", flat: "ashWingFlat", down: "ashWingDown",
               fold: "ashWingFold", sleep: "ashWingSleep" },
      motions: {
        attack: "ashDive", resonance: "ashResonate", breath: "ashBreath",
        technique: "ashSwoop", buff: "ashBuff", hit: "ashHit", dodge: "ashDodge",
        faint: "tumble", levelUp: "ashCheer", sleeping: "ashSleeping"
      }
    },

    crackRock: {
      id: "crackRock",
      name: "ヒビイワ",
      records: {
        used:  "ひびの奥は今も熱を持つ。冷えるとひびが広がるので、火の近くを好む。",
        trust: "石をぶつけられるのを嫌う……当然だ。",
        bond:  "ひびは塞がらない。それでも、崩れずに隣にいる。"
      },
      bondReward: { effects: [ { type: "resistBonus", element: "earth", value: 7 } ] },
      family: "constructKind",
      element: "earth",
      // 熱で焼かれてひびだらけ。火は効きにくいが、石を打ちつけられると砕ける。
      // ゲーム中で初めての「地の弱点」を持つモンスター
      resistances: { fire: 8, earth: -3, water: -2 },
      immunities: [],
      // イワゴローと同じ岩なので、耐性もそろえてある
      statusResist: { poison: 10, paralysis: 0, sleep: 0, seal: 5,
                      blind: 0, curse: 0, instantDeath: 0 },
      maxLevel: 60,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.40 }],
        attack:  [{ from: 1, rate: 0.15 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.30 }, { from: 50, rate: 0.55 }],
        defense: [{ from: 1, rate: 0.18 }, { from: 25, rate: 0.45 }, { from: 40, rate: 0.50 }, { from: 50, rate: 0.75 }],
        speed:   [{ from: 1, rate: 0.08 }, { from: 25, rate: 0.20 }, { from: 40, rate: 0.45 }, { from: 50, rate: 0.20 }],
        pp:      [{ from: 1, rate: 0.10 }, { from: 25, rate: 0.21 }, { from: 40, rate: 0.26 }, { from: 50, rate: 0.31 }]
      },
      description: "地属性。熱でひび割れた岩のモンスター。守りは固いが、同じ石をぶつけると割れる。地に弱い。",
      baseHp: 25,
      baseAttack: 8,
      baseDefense: 11,
      baseSpeed: 3,
      basePp: 4,
      attackEffect: "shards",
      scoutRate: 0.27,
      spawnRate: 0.6,
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 5, skill: "rockThrow" },
        { level: 18, skill: "rockSpike" }
      ],
      abilities: ["brittleShell"],
      // 硬くて時間がかかるぶんゴールドは多いが、経験値は控えめ。
      // 「稼ぎ相手ではあるが、育成相手ではない」位置づけ
      expReward: 12,
      goldReward: 12,
      drops: [
        { item: "oreShard", rate: 0.28, min: 1, max: 2 }
      ],
      sprite: "crackRock",
      motion: "crackPulse",
      // 色だけを塗り替えた姿（RC-1）。細目・ひびの熱が噴き出す・目を閉じてひびが冷える（眠り）
      poses: { narrow: "crackRockNarrow", hot: "crackRockHot", sleep: "crackRockSleep" },
      // 岩なので潰れも伸びもしない。力を込めるとひびが燃える（RC-1）。倒れるというより崩れる
      motions: {
        attack: "crackTackle", resonance: "crackResonate", breath: "crackBreath",
        technique: "crackTechnique", buff: "crackBuff", hit: "crackHit", dodge: "crackDodge",
        faint: "crumble", levelUp: "crackCheer", sleeping: "crackSleeping"
      }
    },

    magmaCrab: {
      id: "magmaCrab",
      name: "マグマガニ",
      records: {
        used:  "殻を固める前に、必ず一度だけハサミを鳴らす。",
        trust: "動かないのは、怖がりだからだ。殻の中で様子をうかがっている。",
        bond:  "背を向けても、もう平気だ。その殻は、守るために固まっている。"
      },
      bondReward: { effects: [
        { type: "resistBonus", element: "water", value: 3 },
        { type: "statMultiplier", stat: "defense", value: 1.2 }
      ] },
      family: "insectKind",
      element: "fire",
      // マグマの中で暮らすので火はほとんど効かない。水をかけられると固まる
      resistances: { fire: 9, water: -4, thunder: -1, light: -1 },
      immunities: [],
      // 硬い殻に覆われているので毒が回らない。封印と呪いは完全に弾く
      statusResist: { poison: 0, paralysis: 5, sleep: 5, seal: 0,
                      blind: 0, curse: 0, instantDeath: 0 },
      maxLevel: 65,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.18 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.35 }, { from: 50, rate: 0.30 }, { from: 61, rate: 0.40 }],
        attack:  [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.40 }, { from: 50, rate: 0.35 }, { from: 63, rate: 1.35 }],
        // 防御は Lv50 から 1.25・Lv61 から 1.35 だったが、こうか・絆・加護が重なると 854 になり
        // ほぼ無敵だったので下げた（2026-09-29 作者）
        defense: [{ from: 1, rate: 0.15 }, { from: 25, rate: 0.30 }, { from: 40, rate: 0.50 }, { from: 50, rate: 0.75 }, { from: 61, rate: 1.00 }],
        speed:   [{ from: 1, rate: 0.10 }, { from: 25, rate: 0.16 }, { from: 40, rate: 0.26 }, { from: 50, rate: 0.40 }, { from: 61, rate: 0.80 }],
        pp:      [{ from: 1, rate: 0.12 }, { from: 25, rate: 0.21 }, { from: 40, rate: 1.00 }, { from: 50, rate: 0.50 }, { from: 61, rate: 0.40 }]
      },
      description: "火属性。マグマの中で暮らす中型のモンスター。殻を固めてじっと動かない。動かないからといって、背を向けないこと。水に弱い。",
      baseHp: 22,
      baseAttack: 10,
      baseDefense: 10,
      baseSpeed: 4,
      basePp: 5,
      // ハサミで挟む（α-10 で破片から斬撃へ）
      attackEffect: "slash",
      scoutRate: 0.22,
      spawnRate: 0.5,
      learnset: [
        { level: 1, skill: "tackle" },
        // この場所で初めて「守りを固める敵」に出会う
        { level: 4, skill: "harden" },
        { level: 7, skill: "ember" },
        { level: 18, skill: "flame" }
      ],
      abilities: ["hardShell"],
      // 硬くて時間がかかるわりに実入りは薄い。稼ぎ相手はヒビイワのほう
      expReward: 20,
      goldReward: 3,
      // ゴールドが渋いぶん、素材で報われる
      drops: [
        { item: "scorchedShell", rate: 0.28, min: 1, max: 1 },
        { item: "oreShard", rate: 0.22, min: 1, max: 1 }
      ],
      // 待機は [元, LegsA, 元, LegsB]：脚が足踏みし、目の柄がきょろきょろする（RC-1）
      sprite: ["magmaCrab", "magmaCrabLegsA", "magmaCrab", "magmaCrabLegsB"],
      motion: "crabIdle",
      // 姿（RC-1）。目を引っ込める・ハサミが白熱する・殻が固まる（マグマが冷える。眠り・こうか）・ハサミを開く。
      // 作り直しで、ハサミを持ち上げる・挟む・横歩き・足踏みを足した
      poses: { hide: "magmaCrabHide", glow: "magmaCrabGlow", cool: "magmaCrabCool", sleep: "magmaCrabCool",
               open1: "magmaCrabOpen1", open2: "magmaCrabOpen2",
               clawUp: "magmaCrabClawUp", snap: "magmaCrabSnap", runA: "magmaCrabRunA", runB: "magmaCrabRunB",
               legsA: "magmaCrabLegsA", legsB: "magmaCrabLegsB" },
      // カニなので横歩き。攻めるときはハサミが白熱し、怖がりなので被弾では目を引っ込める（RC-1）。殻なので、砕ける
      motions: {
        attack: "crabPinch", resonance: "crabResonate", breath: "crabBreath",
        technique: "crabScuttle", buff: "crabHarden", hit: "crabHit", dodge: "crabDodge",
        faint: "crumble", levelUp: "crabCheer", sleeping: "crabSleeping"
      }
    },

    cinderling: {
      id: "cinderling",
      name: "スミビ",
      records: {
        used:  "燃え尽きる前に、次の炭へ火を移して群れを保っている。",
        trust: "たき火に入りたがる。止めないと、ずっと入っている。",
        bond:  "小さな熾火だが、夜の冷えはこれで十分しのげる。"
      },
      bondReward: { effects: [
        { type: "statMultiplier", stat: "hp", value: 1.2 },
        { type: "statMultiplier", stat: "attack", value: 1.05 }
      ] },
      // ゲーム中で初めての魔族系（炭に火が宿ったもの）
      family: "demonKind",
      element: "fire",
      // 亀裂の在来種なので火には強いが、火が消える水にはとても弱い
      resistances: { fire: 6, water: -3, earth: -1 },
      immunities: [],
      // 燃えさしなので、どれもそこそこ通る。消されやすい（即死0）
      statusResist: { poison: 0, paralysis: 0, sleep: 0, seal: 0,
                      blind: 0, curse: 2, instantDeath: 0 },
      maxLevel: 50,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.13 }, { from: 25, rate: 0.36 }, { from: 40, rate: 0.30 }, { from: 45, rate: 0.23 }],
        attack:  [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.35 }, { from: 45, rate: 1.50 }],
        defense: [{ from: 1, rate: 0.14 }, { from: 25, rate: 0.59 }, { from: 40, rate: 0.50 }],
        speed:   [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.54 }, { from: 40, rate: 0.45 }, { from: 50, rate: 0.33 }],
        pp:      [{ from: 1, rate: 0.11 }, { from: 25, rate: 0.32 }, { from: 40, rate: 0.27 }, { from: 50, rate: 0.20 }]
      },
      description: "火属性。燃えさしの炭が起き上がったもの。一体ずつは弱いが、群れで湧く。水に弱い。",
      baseHp: 15,
      baseAttack: 7,
      baseDefense: 3,
      baseSpeed: 6,
      basePp: 4,
      // 小さくてちょろちょろしている
      evasion: 0.05,
      // 数が多く、いちばん仲間にしやすい
      scoutRate: 0.40,
      spawnRate: 1.1,
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 3, skill: "ember" },
        { level: 18, skill: "flame" }
      ],
      abilities: ["firstStrike"],
      expReward: 12,
      goldReward: 6,
      // いちばん多く出るので、いちばん安い素材を配る役
      drops: [
        { item: "emberAsh", rate: 0.32, min: 1, max: 2 }
      ],
      sprite: "cinderling",
      // 燃えさしの炭なので、火の勢いが安定せず小刻みに揺れる
      motion: "emberIdle",
      // 姿（RC-1）。炎が燃え上がる・強まる（攻め）・縮む（被弾）・消えかけて目を閉じる（眠り）
      poses: { flare: "cinderlingFlare", hot: "cinderlingHot", small: "cinderlingSmall", sleep: "cinderlingSleep" },
      // 小さくてちょろちょろしている。炭の体は動かさず、炎と目で見せる（RC-1）
      motions: {
        attack: "cinderTackle", resonance: "cinderResonate", breath: "cinderBreath",
        technique: "cinderRoll", buff: "cinderBuff", hit: "cinderHit", dodge: "cinderDodge",
        faint: "crumble", levelUp: "cinderCheer", sleeping: "cinderSleeping"
      }
    },

    flamin: {
      id: "flamin",
      name: "フレイミン",
      records: {
        used:  "炎の色で機嫌が分かる。赤いときは、近づかないほうがいい。",
        trust: "牙をむくのは、知らない相手にだけだった。",
        bond:  "炎の色は、ずっと穏やかな橙のままだ。"
      },
      bondReward: { skill: "blazeFang" },
      family: "beastKind",
      element: "fire",
      resistances: { fire: 8, water: -3 },
      immunities: [],
      // 気性が荒く、しびれにくい。ただし目と呪いには無防備
      statusResist: { poison: 0, paralysis: 5, sleep: 0, seal: 0,
                      blind: 5, curse: 0, instantDeath: 5 },
      // 上限99の3種のうちの1体。序盤で捕まえても最後まで通用する
      maxLevel: 99,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.14 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.40 }, { from: 50, rate: 0.45 }, { from: 71, rate: 0.40 }],
        attack:  [{ from: 1, rate: 0.18 }, { from: 25, rate: 0.40 }, { from: 40, rate: 0.65 }, { from: 50, rate: 1.10 }, { from: 61, rate: 0.70 }],
        defense: [{ from: 1, rate: 0.15 }, { from: 25, rate: 0.30 }, { from: 40, rate: 0.50 }, { from: 50, rate: 0.67 }, { from: 95, rate: 1.30 }],
        speed:   [{ from: 1, rate: 0.15 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.40 }, { from: 50, rate: 0.60 }, { from: 61, rate: 0.47 }],
        pp:      [{ from: 1, rate: 0.12 }, { from: 25, rate: 0.65 }, { from: 40, rate: 0.50 }, { from: 50, rate: 0.70 }, { from: 85, rate: 0.60 }]
      },
      description: "火属性。体に炎をまとう獣。気性が荒く近づくと牙をむく。水に弱い。",
      baseHp: 19,
      baseAttack: 8,
      baseDefense: 5,
      baseSpeed: 8,
      basePp: 5,
      evasion: 0.05,
      attackEffect: "slash",
      scoutRate: 0.25,
      spawnRate: 0.5,
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 3, skill: "ember" },
        { level: 18, skill: "flame" }
      ],
      abilities: ["fireSoul"],
      expReward: 15,
      goldReward: 8,
      drops: [],
      // 待機は [元, StepL, 元, StepR]：跳ねるたびに脚を交互に上げて足踏みする（RC-1 の作り直し。スミビと見分けるため）
      sprite: ["flamin", "flaminStepL", "flamin", "flaminStepR"],
      // 気性が荒いので、落ち着かず細かく跳ねる
      motion: "flameHop",
      // 姿（RC-1）。炎が燃え上がる・赤くなる（怒り）・縮む（被弾）・暗い熾火で目を閉じる（眠り）。
      // 作り直しで、脚を動かす姿（足踏み・身を沈める・脚をたたんで跳ぶ）を足した
      poses: { flare: "flaminFlare", rage: "flaminRage", small: "flaminSmall", sleep: "flaminSleep",
               stepL: "flaminStepL", stepR: "flaminStepR", crouch: "flaminCrouch", air: "flaminAir" },
      // 気性が荒い獣なので、溜めは短く飛びかかりは大きい。攻めるときは炎が赤くなる（RC-1）。炎なので、燃え尽きるようにその場で小さくなる
      motions: {
        attack: "flaminBite", resonance: "flaminResonate", breath: "flaminBreath",
        technique: "flaminPounce", buff: "flaminBuff", hit: "flaminHit", dodge: "flaminDodge",
        faint: "crumble", levelUp: "flaminCheer", sleeping: "flaminSleeping"
      }
    },

    // --- 静寂の深層の在来種 ---

    // 深層の雑魚。スミビ（亀裂の雑魚）にあたる位置づけで、数で押してくる
    murkling: {
      id: "murkling",
      name: "ヨドミ",
      records: {
        used:  "光の届かない場所に、少しずつ闇が溜まって生まれるらしい。",
        trust: "ひとつ目で、じっと見つめてくる。何を考えているのかは分からない。",
        bond:  "底に溜まった闇にも、居場所はあるのだと思う。"
      },
      bondReward: { effects: [
        { type: "resistBonus", element: "light", value: 3 },
        { type: "resistBonus", status: "blind", value: 7 },
        { type: "resistBonus", status: "curse", value: 5 }
      ] },
      family: "demonKind",
      element: "dark",
      // 闇そのものなので光に灼かれる。
      // 深層の在来種は雷に弱くしてある（雷はまだ耐性持ちが0体で、誰にでも通る属性）
      resistances: { dark: 6, light: -3, thunder: -2 },
      immunities: [],
      // 澱みそのもの。目を持たず、闇に近いので呪いも効きにくい
      statusResist: { poison: 0, paralysis: 0, sleep: 2, seal: 0,
                      blind: 0, curse: 4, instantDeath: 0 },
      maxLevel: 60,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.15 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.35 }, { from: 50, rate: 0.20 }],
        attack:  [{ from: 1, rate: 0.15 }, { from: 25, rate: 0.32 }, { from: 40, rate: 0.30 }],
        defense: [{ from: 1, rate: 0.13 }, { from: 25, rate: 0.40 }, { from: 40, rate: 0.33 }, { from: 50, rate: 0.25 }],
        speed:   [{ from: 1, rate: 0.13 }, { from: 25, rate: 0.41 }, { from: 40, rate: 0.40 }, { from: 50, rate: 0.30 }],
        pp:      [{ from: 1, rate: 0.11 }, { from: 25, rate: 0.38 }, { from: 40, rate: 0.32 }, { from: 50, rate: 0.24 }]
      },
      description: "闇属性。底に溜まった闇が形を持ったもの。一体では頼りないが、群れで湧く。光に弱い。",
      baseHp: 18,
      baseAttack: 8,
      baseDefense: 5,
      baseSpeed: 7,
      basePp: 4,
      // 数がいちばん多いので、この階でもっとも仲間にしやすい
      scoutRate: 0.38,
      spawnRate: 1.0,
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 5, skill: "darkSpore" },
        { level: 18, skill: "darkNebula" },
        // RC-1・作者の指定。深層の敵は Lv15 までなので、野生のヨドミは使ってこない
        { level: 19, skill: "cleanse" }
      ],
      abilities: ["soulDrain"],
      expReward: 17,
      goldReward: 5,
      // いちばん多く出るので、いちばん安い素材を配る役（スミビと同じ役回り）。
      // 深淵の欠片は宝箱でしか手に入らなかったので、こことヨミリュウにも持たせた
      drops: [
        { item: "duskDew", rate: 0.30, min: 1, max: 2 },
        { item: "abyssFragment", rate: 0.28, min: 1, max: 1 }
      ],
      sprite: "murkling",
      motion: "murkFloat",
      // 姿（RC-1）。目を細める・瞳が光る・闇が明るい紫に輝く・目を閉じて煙が短く暗くなる（眠り）
      poses: { narrow: "murklingNarrow", glare: "murklingGlare", glow: "murklingGlow", sleep: "murklingSleep" },
      // 闇そのもので実体が薄い。消える・にじむ動き（RC-1）。崩れるというより沈んで消える
      motions: {
        attack: "murkBump", resonance: "murkResonate", breath: "murkBreath",
        technique: "murkSeep", buff: "murkBuff", hit: "murkHit", dodge: "murkDodge",
        faint: "fall", levelUp: "murkCheer", sleeping: "murkSleeping"
      }
    },

    // 深層の妨害役。キノコン（坑道の闇・植物系）の深層版にあたる。
    // ゲーム中で初めて「相手を弱くする技」を使ってくる相手
    kageZuta: {
      id: "kageZuta",
      name: "カゲヅタ",
      records: {
        used:  "裂け目の奥に根があり、蔦だけをこちらへ伸ばしている。",
        trust: "力を吸うのは、弱っている相手からだけだ。",
        bond:  "絡みついてくる蔦、今は手首に軽く巻きつくだけだ。"
      },
      bondReward: { effects: [
        { type: "resistBonus", element: "fire", value: 4 },
        { type: "statMultiplier", stat: "hp", value: 1.05 },
        { type: "statMultiplier", stat: "attack", value: 1.05 }
      ] },
      family: "plantKind",
      element: "dark",
      // 蔦で打ちつける
      attackEffect: "slash",
      // 植物なので火に灼かれる。ここまでに火のモンスターを育てていれば刺さる
      resistances: { dark: 5, earth: 3, fire: -4, light: -2, thunder: -1 },
      immunities: [],
      // 目を持たず、植物なので眠らない。ただし毒は素通りする
      statusResist: { poison: 0, paralysis: 0, sleep: 10, seal: 0,
                      blind: 7, curse: 0, instantDeath: 0 },
      maxLevel: 60,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.17 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.45 }, { from: 50, rate: 0.60 }],
        attack:  [{ from: 1, rate: 0.12 }, { from: 25, rate: 0.20 }, { from: 40, rate: 0.35 }, { from: 50, rate: 0.60 }],
        defense: [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.30 }, { from: 40, rate: 0.50 }, { from: 50, rate: 0.75 }],
        speed:   [{ from: 1, rate: 0.11 }, { from: 25, rate: 0.15 }, { from: 40, rate: 0.25 }, { from: 50, rate: 0.35 }],
        pp:      [{ from: 1, rate: 0.13 }, { from: 25, rate: 0.35 }, { from: 40, rate: 0.55 }, { from: 50, rate: 0.80 }]
      },
      description: "闇属性。闇の底で根を張る蔦。絡みつかれると、少しずつ力を吸われる。足元に注意すること。火に弱い。",
      baseHp: 23,
      baseAttack: 5,
      baseDefense: 7,
      baseSpeed: 4,
      basePp: 6,
      // 妨害役なので、技を出してこそ意味がある。全体の既定（25%）より高くしてある
      skillRate: 0.35,
      // 数は多くない。倒すより先に「ちからぬき」を撃ってくる厄介役
      scoutRate: 0.30,
      spawnRate: 0.6,
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 3, skill: "sapStrength" },
        { level: 8, skill: "darkSpore" },
        // RC-1・作者の指定。★ 深層の B3F・B4F（Lv13〜15）の野生のカゲヅタは、仲間をキュアで治してくる
        { level: 13, skill: "cure" },
        { level: 18, skill: "darkNebula" },
        { level: 19, skill: "cleanse" }
      ],
      abilities: ["regen"],
      expReward: 22,
      goldReward: 9,
      drops: [
        { item: "twistedVine", rate: 0.26, min: 1, max: 1 }
      ],
      sprite: "kageZuta",
      // 天井の裂け目からぶら下がっているので、蔦が伸び縮みして亜空間へ出入りする
      motion: "riftIdle",
      // 姿（RC-1）。葉を上げて目を細める・裂け目が輝く・葉が垂れる・葉を垂らして目を閉じ裂け目が暗くなる（眠り）
      poses: { narrow: "kageZutaNarrow", glow: "kageZutaGlow", droop: "kageZutaDroop", sleep: "kageZutaSleep" },
      // 天井の裂け目からぶら下がっているので、前後ではなく しなる・揺れる・伸び縮み（anchor: "top"）（RC-1）
      motions: {
        attack: "zutaLash", resonance: "zutaResonate", breath: "zutaBreath",
        technique: "zutaSwing", buff: "zutaBuff", hit: "zutaHit", dodge: "zutaDodge",
        faint: "fall", levelUp: "zutaCheer", sleeping: "zutaSleeping"
      }
    },

    // ゲーム中で唯一、雷を扱うモンスター。
    // 敵としては「速くて痛いが脆い」相手、仲間にすれば雷の使い手になる。
    //
    // ★ 出現率が低いかわりに危険、という立ち位置。強さは意図したもの。
    //   先手を取ってサンダーで40〜47削ってくるが、こちらもLv13でHP41しかない。
    //   「見かけたら先に倒す」判断をさせるための相手なので、
    //   ダメージが大きいことを理由に弱めないこと。
    boltBug: {
      id: "boltBug",
      name: "ビリムシ",
      records: {
        used:  "雨の前は電気が強くなる。天気を知るのにちょうどいい。",
        trust: "触れると弾けるのは、驚いたときだけらしい。",
        bond:  "素手で触れても、もう弾けない。"
      },
      bondReward: { effects: [
        { type: "statMultiplier", stat: "pp", value: 1.2 },
        { type: "damageDealt", value: 1.25, element: "thunder" }
      ] },
      family: "insectKind",
      element: "thunder",
      // 雷を身に宿しているので雷には強い。地に落とされると電気が抜ける
      resistances: { thunder: 6, wind: 3, earth: -3 },
      immunities: [],
      // ★ 雷を身に宿しているので、しびれることが無い（10＝完全に効かない）。
      //   マグマウルフの火10と同じ「一点だけ突き抜けている」形。
      //   そのかわり虫なので、体そのものは脆いまま
      statusResist: { poison: 0, paralysis: 10, sleep: 0, seal: 2,
                      blind: 0, curse: 0, instantDeath: 0 },
      // 仲間にする価値を持たせたいので、上限は高めにしてある
      maxLevel: 70,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.12 }, { from: 25, rate: 0.25 }, { from: 35, rate: 0.50 }, { from: 45, rate: 0.63 }, { from: 61, rate: 0.25 }],
        attack:  [{ from: 1, rate: 0.17 }, { from: 25, rate: 0.30 }, { from: 45, rate: 0.65 }, { from: 61, rate: 0.30 }],
        defense: [{ from: 1, rate: 0.12 }, { from: 25, rate: 0.25 }, { from: 30, rate: 0.45 }, { from: 65, rate: 0.25 }],
        speed:   [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.27 }, { from: 40, rate: 0.34 }, { from: 50, rate: 0.41 }, { from: 61, rate: 0.25 }],
        pp:      [{ from: 1, rate: 0.14 }, { from: 25, rate: 0.75 }, { from: 40, rate: 0.90 }, { from: 50, rate: 1.11 }, { from: 61, rate: 0.65 }]
      },
      description: "雷属性。小さな体に電気をためこんだ虫。触れると弾ける。素手で触らないこと。地に弱い。",
      baseHp: 16,
      baseAttack: 8,
      baseDefense: 4,
      baseSpeed: 12,
      basePp: 5,
      evasion: 0.05,
      // 渋め。この階でいちばん仲間にする価値がある相手なので、簡単には応じない
      scoutRate: 0.18,
      spawnRate: 0.5,
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 6, skill: "thunderBolt" },
        // 2段目でいちばん重い全体技（麻痺つき）なので、ほかより2つ遅い
        { level: 20, skill: "volt" }
      ],
      abilities: ["discharge"],
      expReward: 25,
      goldReward: 14,
      drops: [
        { item: "stormWing", rate: 0.24, min: 1, max: 1 },
        // 買えない装備。雷を扱えるのはビリムシだけなので、実質この種族専用になる
        { item: "chargedCore", rate: 0.15, min: 1, max: 1 }
      ],
      // ふだんは翅のコマ絵で、ごく速く羽ばたく（RC-1）。上げ → 元 → 下げ → 元 を2回。
      // 2回目は火花が裏返り、触角がぴくっと動く（作り直しで足した）
      sprite: ["boltBugUp", "boltBug", "boltBugDown", "boltBug",
               "boltBugUpB", "boltBugBaseB", "boltBugDownB", "boltBugBaseB"],
      motion: "boltFlit",
      // 姿（RC-1）。翅の上げ下げ・帯電して火花が増える・翅を下げて暗くなり目を閉じる（眠り）。
      // 作り直しで、火花と触角の違うコマ（upB・downB）と、腹の針を突き出す姿（sting・stingDown）を足した
      poses: { up: "boltBugUp", down: "boltBugDown", upB: "boltBugUpB", downB: "boltBugDownB",
               charge: "boltBugCharge", sting: "boltBugSting", stingDown: "boltBugStingDown", sleep: "boltBugSleep" },
      // 飛んでいるので、傾きながら落ちる。いちばん速く、驚くと電気が弾ける（RC-1）
      motions: {
        attack: "boltRush", resonance: "boltResonate", breath: "boltBreath",
        technique: "boltZigzag", buff: "boltBuff", hit: "boltHit", dodge: "boltDodge",
        faint: "tumble", levelUp: "boltCheer", sleeping: "boltSleeping"
      }
    },

    // 深層の壁役。マグマガニ（亀裂の壁役）にあたる位置づけで、こうかで固めてくる。
    // 主（キングスライム）と同じスライム系にして、この階の主属性が水だと先に見せておく
    puddling: {
      id: "puddling",
      name: "ミズダマリ",
      records: {
        used:  "底の水が集まるほど重く、強くなる。乾くと小さくしぼむ。",
        trust: "水たまりのふりをして、踏まれるのを待つ遊びが好きだ。",
        bond:  "重い水の腕は、今は仲間を守るために振り上げられる。"
      },
      bondReward: { effects: [ { type: "statMultiplier", stat: "attack", value: 1.2 } ] },
      family: "slimeKind",
      element: "water",
      // 水そのものなので火は通らない。電気を流されるといちばん効く
      resistances: { water: 7, fire: 2, thunder: -4, earth: -2 },
      immunities: [],
      // 水そのもの。形が決まっていないので、どの状態異常もほどほどに効きにくい
      //
      // ☆ 麻痺10（完全に効かない）は、属性の雷 -4（2倍のダメージ）と向きが逆。
      //   「電気は通すが、しびれる神経が無い」と読めば通る。意図した組み合わせ
      statusResist: { poison: 3, paralysis: 10, sleep: 0, seal: 0,
                      blind: 0, curse: 0, instantDeath: 0 },
      maxLevel: 70,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.18 }, { from: 25, rate: 0.30 }, { from: 40, rate: 0.50 }, { from: 61, rate: 0.45 }],
        attack:  [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.30 }, { from: 50, rate: 0.55 }, { from: 61, rate: 0.40 }],
        defense: [{ from: 1, rate: 0.14 }, { from: 25, rate: 0.31 }, { from: 40, rate: 0.45 }, { from: 55, rate: 0.55 }, { from: 63, rate: 0.99 }],
        speed:   [{ from: 1, rate: 0.08 }, { from: 25, rate: 0.15 }, { from: 40, rate: 0.20 }, { from: 55, rate: 0.30 }, { from: 61, rate: 0.45 }],
        pp:      [{ from: 1, rate: 0.14 }, { from: 25, rate: 0.27 }, { from: 40, rate: 0.45 }, { from: 50, rate: 0.55 }, { from: 61, rate: 0.50 }]
      },
      description: "水属性。底の水が集まって形を取ったもの。重い水の塊で叩き潰してくる。水たまりに見えても踏まないこと。雷に弱い。",
      // 攻撃特化。壁役ではないので、HP・防御・PPは低く抑えてある。
      // 速さも捨ててあるので「先に殴られてから殴り返す」形になる
      baseHp: 16,
      baseAttack: 12,
      baseDefense: 5,
      baseSpeed: 6,
      basePp: 4,
      scoutRate: 0.25,
      spawnRate: 0.7,
      // こうかは持たせない。使われると殴りでは17発かかり、戦闘がだれてしまう。
      // 硬さはHPと防御だけで表し、崩し方は「雷を通す」に一本化した
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 9, skill: "aqua" },
        { level: 18, skill: "wave" }
      ],
      abilities: ["waterHeart"],
      expReward: 20,
      goldReward: 10,
      // 定義だけあって入手経路の無かった「スライムのかけら」を、ここで配る
      drops: [
        { item: "slimeShard", rate: 0.30, min: 1, max: 2 }
      ],
      // 水の腕で叩くので、砕けるような当たり方にする
      attackEffect: "shards",
      sprite: "puddling",
      // 上が重い水の塊なので、縦横が入れ替わるように波打つ
      motion: "waterWobble",
      // 姿（RC-1）。潰れる・せり上がる（行を抜き差し）・水が明るく光る・潰れて目を閉じて暗くなる（眠り）
      poses: { squash: "puddlingSquash", tall: "puddlingTall", glow: "puddlingGlow", sleep: "puddlingSleep" },
      // 重い水の塊。せり上がって叩きつける・水たまりに化けて忍び寄る（RC-1）
      motions: {
        attack: "puddleSlam", resonance: "puddleResonate", breath: "puddleBreath",
        technique: "puddleAmbush", buff: "puddleBuff", hit: "puddleHit", dodge: "puddleDodge",
        faint: "fall", levelUp: "puddleCheer", sleeping: "puddleSleeping"
      }
    },

    // ゲーム中で初めての竜系。深層のB3F・B4Fにしか出ない（dungeons.js の minFloor）。
    //
    // ★「初見殺し」として作ってある。
    //   ・ほとんどの属性が通らず、殴っても防御に弾かれる
    //   ・全体をまとめて焼く「奈落の息」を持つ
    //   ・ただし光だけは2倍で通る（耐性 光-5）。
    //     答えはステージ1のヒカリムシ（フラッシュ）で、知っていれば半分の手数で倒せる。
    //   知らないと詰み、知っていれば勝てる、という形にするための配置なので、
    //   耐性と光の弱点はセットで扱うこと。片方だけ動かさない
    abyssDragon: {
      id: "abyssDragon",
      name: "ヨミリュウ",
      records: {
        used:  "揺籃の穴にいた理由は、まだ分からない。協会の記録にも残っていない。",
        trust: "息は仲間のいる方へは決して吐かない。",
        bond:  "勝てる相手とは思えなかった。今は隣にいる。"
      },
      bondReward: { effects: [
        { type: "resistBonus", element: "light", value: 3 },
        { type: "statMultiplier", stat: "hp", value: 1.15 },
        { type: "statMultiplier", stat: "defense", value: 1.1 }
      ] },
      family: "dragonKind",
      element: "dark",
      // 闇+10 は battle.js の immuneAt に達するので、闇の技は完全に効かない。
      // 光だけが2倍で通る、という一点突破の形にしてある
      resistances: { dark: 10, earth: 5, fire: 3, water: 3, light: -5 },
      immunities: [],
      // 闇の頂点。麻痺と即死は完全に効かない。
      // 通るのは眠りと呪い ——「眠らせてから殴る」が搦め手になる。
      // ★ 出るときの倍率と行動手順は data/dungeons.js のエントリに書いてある
      //   （HP×2.25・攻×0.9・防×1.25／闇の息→噛みつく→通常攻撃）。
      //   ここの値は「仲間にしたとき」の素の強さ
      statusResist: { poison: 5, paralysis: 10, sleep: 0, seal: 5,
                      blind: 3, curse: 0, instantDeath: 10 },
      // 上限まで育てると全種で最も強くなる（攻撃・防御・PPが1位）。
      // 上限99の3種より低いのは、そちらが「長く付き合う枠」で格とは別軸だから
      maxLevel: 75,
      // 基礎値は在来種の目安内に収め、格は成長率の配分と耐性で出している
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.25 }, { from: 35, rate: 0.35 }, { from: 50, rate: 0.50 }, { from: 61, rate: 0.30 }],
        attack:  [{ from: 1, rate: 0.17 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.35 }, { from: 61, rate: 0.35 }, { from: 74, rate: 1.30 }],
        defense: [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.20 }, { from: 40, rate: 0.50 }, { from: 45, rate: 0.35 }, { from: 61, rate: 0.20 }, { from: 74, rate: 1.00 }],
        speed:   [{ from: 1, rate: 0.12 }, { from: 25, rate: 0.20 }, { from: 40, rate: 0.30 }, { from: 50, rate: 0.35 }, { from: 61, rate: 0.19 }],
        pp:      [{ from: 1, rate: 0.14 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.30 }, { from: 50, rate: 0.45 }, { from: 61, rate: 0.30 }]
      },
      description: "闇属性。揺籃の穴にいるはずのない竜。鱗は光を通さず吐く息は闇そのもの。勝てる相手とは思えない。見かけたら逃げること。光に弱い。",
      baseHp: 26,
      baseAttack: 12,
      baseDefense: 12,
      baseSpeed: 10,
      basePp: 8,
      // 牙と爪で裂く
      attackEffect: "slash",
      // この階でいちばん渋い。倒すこと自体が目的になる相手
      scoutRate: 0.10,
      spawnRate: 0.25,
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 5, skill: "bite" },
        // 出現下限がLv10なので、出会う個体は必ず持っている
        { level: 10, skill: "abyssBreath" }
      ],
      abilities: ["duskborn"],
      expReward: 40,
      goldReward: 30,
      drops: [
        { item: "dragonScale", rate: 0.35, min: 1, max: 1 },
        { item: "abyssFragment", rate: 0.28, min: 1, max: 1 },
        // 買えない装備。
        //
        // ★ ここだけ極端に高いのは、竜そのものが出ないから。
        //   B4Fにしか出ず、しかも単体出現。
        //   「レアな相手」×「レアなドロップ」で二重に薄まるので、
        //   5%にしていたころは実測417戦＝27回の挑戦に1つだった
        //   （他の買えない装備は4〜8回）。竜を約20体倒す計算になる。
        //   20%にして、竜を5体倒せば1つ ＝ 約7回の挑戦に落ち着かせた。
        //
        // ☆ この率を触るときは、必ず「戦闘あたり」ではなく
        //   「挑戦（ラン）あたり」で見ること。竜の出現率を通すと3倍以上変わる
        { item: "fangRing", rate: 0.20, min: 1, max: 1 }
      ],
      // ふだんは翼をゆっくり羽ばたき、尻尾を揺らす（RC-1 の作り直し）。
      // 元 → 半分上げ → 上げ → 半分上げ → 元 → 半分下げ → 下げ → 半分下げ。尻尾は翼と一緒に上下する
      sprite: ["abyssDragon", "abyssDragonWingUpMid", "abyssDragonWingUp", "abyssDragonWingUpMid",
               "abyssDragon", "abyssDragonWingDownMid", "abyssDragonWingDown", "abyssDragonWingDownMid"],
      // 竜なので、他のモンスターより一回り大きく画面に出す
      sizeScale: 1.35,
      // 大きいものほどゆっくり深く息をする。縦と横をずらして、体と翼を別々に動かす
      motion: "dragonBreathe",
      // 姿（RC-1）。翼・尻尾・前足を付け根で回した姿と、目を細める・口を開ける・眠り（目を閉じ、翼をたたみ、尻尾を巻く）。
      // 体・頭・角・脚は動かさない（口のあごと MouthWide の頭だけが、その姿で動く）
      poses: {
        rest: "abyssDragon",
        up: "abyssDragonWingUp", upMid: "abyssDragonWingUpMid",
        down: "abyssDragonWingDown", downMid: "abyssDragonWingDownMid",
        glare: "abyssDragonGlare", mouth: "abyssDragonMouth", mouthWide: "abyssDragonMouthWide",
        breathWide: "abyssDragonBreathWide",
        hoverUp: "abyssDragonHoverUp", hoverDown: "abyssDragonHoverDown",
        clawUp: "abyssDragonClawUp", clawSwipe: "abyssDragonClawSwipe",
        sleep: "abyssDragonSleep"
      },
      // 全種でいちばん大きく重いので、どの動きも長くゆっくり。動じず、圧をかける（RC-1）
      motions: {
        attack: "dragonClaw", resonance: "dragonResonate", breath: "dragonBreath",
        technique: "dragonSwoop", buff: "dragonBuff", hit: "dragonHit", dodge: "dragonDodge",
        faint: "crumble", levelUp: "dragonCheer", sleeping: "dragonSleeping"
      }
    },

    /**
     * --- 腐食の毒沼の在来種（ステージ4・推奨Lv20） ---
     *
     * ★ 基礎値はステージ3とほぼ同じ帯に置いてある。
     *   基礎値を上げて格を出すと、仲間にしたときにレベル差以上に強くなる
     *   （基礎値+10はLv15で+31になる）。格はレベルと成長率と技で出す。
     *
     * ★ 強さは「回復なしで何戦もつか」で合わせてある。
     *   1戦ごとの勝率で見ると、満タンから始まるのでどれも100%になり、
     *   きつさが測れない。実際の挑戦では回復せずに連戦するので、そちらで測った。
     *     ステージ3 B1F 7戦 / B4F 3戦（味方Lv16）
     *     ステージ4 B1F 7戦 / B4F 3戦（味方Lv20）  ← 同じ手応えにそろえた
     *   最初に置いた案では B4F が2戦しかもたず、ステージ3より厳しくなっていた。
     *   ドクバチとヌマボネの攻撃を1段下げて合わせてある。
     */

    // 沼の雑魚。速いが脆い。毒を入れてくる相手。
    // ステージ3のビリムシと同じ「先に動いて削る」役だが、こちらは毒を持つ
    venomBee: {
      id: "venomBee",
      name: "ドクバチ",
      records: {
        used:  "群れは、沼の匂いでまとまっているらしい。",
        trust: "針をしまったまま、頭の上を回るのが好きだ。",
        bond:  "毒の針を今はこちらに向けない。"
      },
      bondReward: { effects: [
        { type: "statMultiplier", stat: "attack", value: 1.07 },
        { type: "statMultiplier", stat: "speed", value: 1.13 }
      ] },
      family: "insectKind",
      element: "dark",
      // 針で刺す
      attackEffect: "slash",
      resistances: { dark: 5, wind: 2, fire: -1, light: -2 },
      immunities: [],
      // 自分が毒を使う側なので毒は完全に効かない。羽音で眠らないが、体は脆い
      statusResist: { poison: 10, paralysis: 0, sleep: 0, seal: 2,
                      blind: 2, curse: 6, instantDeath: 0 },
      maxLevel: 65,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.13 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.35 }, { from: 50, rate: 0.40 }, { from: 61, rate: 0.20 }],
        attack:  [{ from: 1, rate: 0.18 }, { from: 25, rate: 0.40 }, { from: 40, rate: 0.50 }, { from: 55, rate: 0.40 }],
        defense: [{ from: 1, rate: 0.11 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.35 }, { from: 55, rate: 0.55 }, { from: 61, rate: 0.25 }],
        speed:   [{ from: 1, rate: 0.17 }, { from: 25, rate: 0.28 }, { from: 40, rate: 0.36 }, { from: 50, rate: 0.40 }, { from: 61, rate: 0.20 }],
        pp:      [{ from: 1, rate: 0.12 }, { from: 25, rate: 0.30 }, { from: 40, rate: 0.35 }, { from: 50, rate: 0.40 }, { from: 61, rate: 0.25 }]
      },
      description: "闇属性。毒沼の上を群れで飛ぶ蜂。刺された傷より、あとに残る毒のほうが長く効く。解毒草を持って入ること。光に弱い。",
      baseHp: 17,
      baseAttack: 8,
      baseDefense: 5,
      baseSpeed: 12,
      basePp: 5,
      // 小さく速いのでかわしやすい（ビリムシと同じ0.05〜0.06の帯）
      evasion: 0.06,
      scoutRate: 0.36,
      spawnRate: 1.0,
      learnset: [
        { level: 1, skill: "tackle" },
        // 出現下限がLv14なので、出会う個体は必ず毒を持っている
        { level: 4, skill: "venomSting" },
        { level: 12, skill: "bite" }
      ],
      abilities: ["poisonThorn"],
      expReward: 28,
      goldReward: 10,
      drops: [
        { item: "venomStinger", rate: 0.30, min: 1, max: 2 }
      ],
      // ふだんは翅のコマ絵で速く羽ばたく（RC-1）。2回に1回は腹が縮んで息をし、触角が動く
      sprite: ["venomBeeUp", "venomBee", "venomBeeDown", "venomBee",
               "venomBeeUpB", "venomBee", "venomBeeDownB", "venomBee"],
      motion: "beeHover",
      // 姿（RC-1）。翅の上げ下げ・腹が縮む・腹を引き絞る・針を出す・翅をたたんで眠る
      poses: { up: "venomBeeUp", down: "venomBeeDown", upB: "venomBeeUpB", downB: "venomBeeDownB",
               curl: "venomBeeCurl", sting: "venomBeeSting", stingUp: "venomBeeStingUp", sleep: "venomBeeSleep" },
      // 針で刺す虫なので、攻撃は腹を引き絞ってから針を突き出す（RC-1）。飛んでいるので、傾きながら落ちる
      motions: {
        attack: "beeSting", resonance: "beeResonate", breath: "beeBreath",
        technique: "beeDart", buff: "beeBuff", hit: "beeHit", dodge: "beeDodge",
        faint: "tumble", levelUp: "beeCheer", sleeping: "beeSleeping"
      }
    },

    // 沼の壁役。カゲヅタ（深層の壁役）の一段上。
    // 硬いだけでなく、甲羅の泥から毒の息を吐くので放置もできない
    mudTurtle: {
      id: "mudTurtle",
      name: "ドロガメ",
      records: {
        used:  "甲羅の泥を落とすと、毒の息も弱まる。泥が毒の元らしい。",
        trust: "甲羅に登られても怒らない。気がつくと居眠りしている。",
        bond:  "風下に立っても、もう平気だ。"
      },
      bondReward: { effects: [
        { type: "resistBonus", element: "thunder", value: 3 },
        { type: "statMultiplier", stat: "defense", value: 1.3 }
      ] },
      family: "beastKind",
      element: "earth",
      resistances: { earth: 7, water: 2, thunder: -2 },
      immunities: [],
      // 甲羅に覆われているので毒と麻痺が通りにくい。ただし呪いと即死には無防備
      statusResist: { poison: 8, paralysis: 0, sleep: 0, seal: 5,
                      blind: 5, curse: 0, instantDeath: 0 },
      maxLevel: 65,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.18 }, { from: 25, rate: 0.30 }, { from: 40, rate: 0.45 }, { from: 61, rate: 0.35 }],
        attack:  [{ from: 1, rate: 0.13 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.35 }],
        defense: [{ from: 1, rate: 0.17 }, { from: 25, rate: 0.50 }, { from: 40, rate: 0.60 }, { from: 55, rate: 0.70 }, { from: 61, rate: 0.43 }],
        speed:   [{ from: 1, rate: 0.08 }, { from: 25, rate: 0.20 }, { from: 61, rate: 0.15 }],
        pp:      [{ from: 1, rate: 0.12 }, { from: 25, rate: 0.25 }, { from: 40, rate: 0.55 }, { from: 50, rate: 0.30 }, { from: 61, rate: 0.25 }]
      },
      description: "地属性。沼底の泥をかぶった亀。甲羅に溜めた泥から、たえず毒の息を漏らしている。風下に立たないこと。雷に弱い。",
      baseHp: 25,
      baseAttack: 6,
      baseDefense: 10,
      baseSpeed: 3,
      basePp: 5,
      scoutRate: 0.28,
      spawnRate: 0.8,
      // こうかは持たせない（ミズダマリと同じ理由。硬い相手をさらに硬くすると戦闘がだれる）
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 10, skill: "venomBreath" }
      ],
      abilities: ["hardShell"],
      expReward: 32,
      goldReward: 14,
      drops: [
        { item: "muddyShell", rate: 0.28, min: 1, max: 1 },
        { item: "oreShard", rate: 0.20, min: 1, max: 1 }
      ],
      // ふだんは首をゆっくり伸ばして息をし、ときどきまばたきする（RC-1）
      sprite: ["mudTurtle", "mudTurtleNeckOut", "mudTurtle", "mudTurtleBlink"],
      motion: "turtleBreathe",
      // 姿（RC-1）。頭と前脚を動かした絵。甲羅は変えていない
      poses: { neckOut: "mudTurtleNeckOut", blink: "mudTurtleBlink", peek: "mudTurtlePeek", hide: "mudTurtleHide",
               bite: "mudTurtleBite", stompL: "mudTurtleStompL", stompR: "mudTurtleStompR", sleep: "mudTurtleSleep" },
      // 重く遅い壁役。攻めるときも守るときも甲羅にこもる（RC-1）。甲羅なので、倒れるというより崩れる
      motions: {
        attack: "turtleTackle", resonance: "turtleResonate", breath: "turtleBreath",
        technique: "turtleSpin", buff: "turtleBuff", hit: "turtleHit", dodge: "turtleDodge",
        faint: "crumble", levelUp: "turtleCheer", sleeping: "turtleSleeping"
      }
    },

    // 沼に沈んだ者の骨。搦め手の役。
    // 骨なので毒と眠りがほとんど効かず、毒で押す戦い方の「答えにならない相手」になる
    marshBone: {
      id: "marshBone",
      name: "ヌマボネ",
      records: {
        used:  "骨は沼の泥をまとって形を保っている。乾くと、ばらばらになるらしい。",
        trust: "眼窩の青い光は、嬉しいときに少しだけ明るくなる。",
        bond:  "長く見ていたいものではない、と書いた。訂正する。"
      },
      bondReward: { skill: "blueGlare" },
      family: "demonKind",
      element: "dark",
      resistances: { dark: 7, earth: 2, fire: -1, light: -2 },
      immunities: [],
      // ★ 骨なので毒・麻痺・眠りが通りにくく、**即死は完全に効かない**（もう死んでいる）。
      //   毒だけで押す戦い方に、この階で一度ブレーキをかける相手
      statusResist: { poison: 8, paralysis: 0, sleep: 0, seal: 0,
                      blind: 0, curse: 5, instantDeath: 10 },
      maxLevel: 70,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.16 }, { from: 25, rate: 0.20 }, { from: 40, rate: 0.30 }, { from: 55, rate: 0.40 }, { from: 65, rate: 0.30 }],
        attack:  [{ from: 1, rate: 0.15 }, { from: 25, rate: 0.20 }, { from: 54, rate: 0.88 }, { from: 61, rate: 0.35 }],
        defense: [{ from: 1, rate: 0.13 }, { from: 25, rate: 0.33 }, { from: 44, rate: 0.44 }, { from: 50, rate: 0.50 }],
        speed:   [{ from: 1, rate: 0.13 }, { from: 25, rate: 0.15 }, { from: 40, rate: 0.30 }, { from: 50, rate: 0.40 }, { from: 61, rate: 0.35 }],
        pp:      [{ from: 1, rate: 0.15 }, { from: 25, rate: 0.30 }, { from: 40, rate: 0.50 }, { from: 50, rate: 0.75 }, { from: 61, rate: 0.60 }]
      },
      description: "闇属性。沼に沈んだ骨が、泥に浮いたまま動いている。眼窩の奥だけが青く光る。長く見ていたいものではない。光に弱い。",
      baseHp: 20,
      baseAttack: 11,
      baseDefense: 6,
      baseSpeed: 8,
      basePp: 7,
      scoutRate: 0.24,
      spawnRate: 0.7,
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 6, skill: "sapStrength" },
        { level: 12, skill: "darkSpore" },
        // 毒沼の敵は Lv19 までなので、野生のヌマボネは使ってこない（仲間にして育てると覚える）
        { level: 20, skill: "darkNebula" }
      ],
      abilities: ["undeadSoul"],
      expReward: 36,
      goldReward: 17,
      drops: [
        { item: "rustedBone", rate: 0.28, min: 1, max: 1 },
        { item: "abyssFragment", rate: 0.20, min: 1, max: 1 },
        // 買えない装備。ゲーム中で初めての即死耐性。
        //   ☆ 率は必ず「戦闘あたり」ではなく「挑戦（ラン）あたり」で見ること。
        //     ヌマボネは毒沼の25%を占めるので、同じ率でも他の種族より早く集まる
        { item: "boneCharm", rate: 0.16, min: 1, max: 1 }
      ],
      // ふだんは泥の上で揺れながら、頭蓋が首の上でかくりとかしぐ（RC-1）
      sprite: ["marshBone", "marshBoneTiltL", "marshBone", "marshBoneTiltR"],
      motion: "boneSway",
      // 姿（RC-1）。頭蓋をかしげる・あごを開ける・眼窩が光る・頭蓋が浮く・泥へ沈む・眠る
      poses: { tiltL: "marshBoneTiltL", tiltR: "marshBoneTiltR", jaw: "marshBoneJaw", glow: "marshBoneGlow",
               rattle: "marshBoneRattle", sink: "marshBoneSink", sleep: "marshBoneSleep" },
      // 跳べないので、かわすときも潜るときも泥へ沈む（RC-1）。骨なので崩れ落ちる
      motions: {
        attack: "boneLunge", resonance: "boneResonate", breath: "boneBreath",
        technique: "boneAmbush", buff: "boneBuff", hit: "boneHit", dodge: "boneDodge",
        faint: "crumble", levelUp: "boneCheer", sleeping: "boneSleeping"
      }
    },

    // 腐食の毒沼の主（data/bosses.js の swampLord が使う種族）。
    // 主として出るときだけ倍率が掛かる。仲間にすればこの素の値に戻る
    marshLord: {
      id: "marshLord",
      name: "ヌシガエル",
      records: {
        used:  "口を開けたまま何日も待てる。待つことが、狩りそのものらしい。",
        trust: "食べ物を分けると、丸ごと呑んでから嬉しそうに鳴く。",
        bond:  "沼の主は、呑み込まずに待っていてくれる。"
      },
      bondReward: { effects: [
        { type: "statMultiplier", stat: "attack", value: 1.08 },
        { type: "statMultiplier", stat: "defense", value: 1.18 }
      ] },
      family: "beastKind",
      element: "water",
      resistances: { water: 5, earth: 3, dark: 3, light: -2, thunder: -3 },
      immunities: [],
      // この沼の毒はこいつが出しているので、毒は完全に効かない（10）。
      // 大きく鈍いので麻痺・眠りは意外と通る
      statusResist: { poison: 10, paralysis: 0, sleep: 0, seal: 10,
                      blind: 0, curse: 0, instantDeath: 9 },
      maxLevel: 80,
      // 成長率の段階（α-10・作者が決めたもの。早見表/成長率の段階.txt）。Lv24 までは α-9 と同じ
      growthRate: {
        hp:      [{ from: 1, rate: 0.18 }, { from: 25, rate: 0.30 }, { from: 40, rate: 0.35 }, { from: 55, rate: 0.46 }, { from: 65, rate: 0.30 }],
        attack:  [{ from: 1, rate: 0.17 }, { from: 25, rate: 0.25 }, { from: 35, rate: 0.40 }, { from: 45, rate: 0.55 }, { from: 55, rate: 0.30 }],
        defense: [{ from: 1, rate: 0.14 }, { from: 25, rate: 0.30 }, { from: 40, rate: 0.25 }, { from: 50, rate: 0.45 }, { from: 61, rate: 0.35 }],
        speed:   [{ from: 1, rate: 0.08 }, { from: 25, rate: 0.25 }, { from: 50, rate: 0.40 }, { from: 61, rate: 0.20 }],
        pp:      [{ from: 1, rate: 0.13 }, { from: 25, rate: 0.20 }, { from: 40, rate: 0.30 }, { from: 50, rate: 0.45 }, { from: 61, rate: 0.25 }, { from: 75, rate: 0.75 }]
      },
      description: "水属性。探索者の間では沼の主と呼ばれている。動かずに口だけを開けて待ち、近づいたものを丸ごと呑む。間合いを測ってから近づくこと。雷に弱い。",
      baseHp: 30,
      baseAttack: 11,
      baseDefense: 8,
      baseSpeed: 5,
      basePp: 7,
      scoutRate: 0.12,
      // 主なので、ふつうの遭遇には出ない
      spawnRate: 0,
      learnset: [
        { level: 1, skill: "tackle" },
        { level: 3, skill: "bodyPress" },
        { level: 6, skill: "bubble" },
        { level: 8, skill: "venomBreath" },
        { level: 14, skill: "bite" }
      ],
      abilities: ["thickSkin"],
      expReward: 140,
      goldReward: 95,
      drops: [
        { item: "venomSac", rate: 1.0, min: 1, max: 1 }
      ],
      // ふだんはのど袋をふくらませて息をし、目をきょろりと動かし、ときどきまばたきする（RC-1）
      sprite: ["marshLord", "marshLordPuff", "marshLord", "marshLordLookL", "marshLordBlink",
               "marshLord", "marshLordPuff", "marshLord", "marshLordLookR", "marshLord"],
      // 横に広い主。他の3体（1.15 / 1.25 / 1.4）の間に置いてある
      sizeScale: 1.3,
      motion: "lordBreathe",
      // 姿（RC-1）。目・口・舌・のど袋を動かした絵
      poses: { blink: "marshLordBlink", lookL: "marshLordLookL", lookR: "marshLordLookR",
               open: "marshLordOpen", gape: "marshLordGape", tongue: "marshLordTongue",
               puff: "marshLordPuff", happy: "marshLordHappy", sleep: "marshLordSleep" },
      // 待って丸ごと呑む主。体技は舌で絡め取って呑む（RC-1）
      motions: {
        attack: "lordSlam", resonance: "lordResonate", breath: "lordBreath",
        technique: "lordTongue", buff: "lordBuff", hit: "lordHit", dodge: "lordDodge",
        faint: "fall", levelUp: "lordCheer", sleeping: "lordSleeping"
      }
    }
  };
})(window.MyGame);
