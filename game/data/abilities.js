/**
 * abilities.js
 * アビリティ（特性）の定義。モンスターが常に持っている効果。
 *
 * id / name / description : 識別子・表示名・図鑑での説明
 * category : 分類id（categories.js の ability を参照）。図鑑の並びに使う
 * effects  : 効果の配列。1つのアビリティに複数の効果を持たせられる
 *
 * ▼ 効果の種類（type）
 *
 * "statMultiplier" … ステータスに倍率を掛ける
 *     stat  : "hp" / "attack" / "defense" / "speed" / "pp"
 *     value : 倍率（1.2 なら20%上昇）
 *
 * "damageDealt" … 自分が与えるダメージに倍率を掛ける
 *     value   : 倍率
 *     element : 指定するとその属性の技のときだけ効く（省略で全部）
 *
 * "damageTaken" … 自分が受けるダメージに倍率を掛ける
 *     value   : 倍率（0.8 なら20%軽減）
 *     element : 指定するとその属性を受けたときだけ効く（省略で全部）
 *     allDamage : true なら、攻撃のほかに毒・反動・罠のダメージにも効く（カチカチ。最低1は受ける）
 *
 * "ppCostMultiplier" … 自分が技に払うPPに倍率を掛ける（端数は切り上げ。戦闘でも探索中でも効く。カチカチ）
 *     value : 倍率（1.5 なら PP3 の技に 5 払う）
 *
 * "healDealt" … 自分が使う回復の技（キュアなど）の回復量に倍率を掛ける。戦闘でも探索中でも効く
 *     value : 倍率（1.2 なら2割増し）。受ける側には関係しない。道具の回復・再生・吸血には効かない
 *
 * ▼ 戦闘中に働く効果（js/battle/BattleSystem.js が処理する）
 *
 * "regen" … ターンの終わりに、最大HPの value の割合だけ回復する
 *     value : 割合（0.06 なら6%。最低1は戻る）
 *     max   : 1ターンに戻る量の上限（書かなければ上限なし）
 *
 * "damageByTargetHp" … 相手の残りHPの割合で、与えるダメージに倍率を掛ける（v1.0.0。万全狩り）
 *     tiers : [{ atLeast: 割合, value: 倍率 } / { atMost: 割合, value: 倍率 }] を上から順に見て、最初に当てはまったもの。
 *             どれにも当てはまらなければ等倍
 *
 * "onHitStatus" … 攻撃を当てた相手を、確率で状態異常にする（v1.0.0。装備の眠花の杖）
 *     status / chance : 技の status と同じ。相手の耐性が掛かる。入らなかったときは何も出さない
 *     normalAttackOnly : true なら通常攻撃のときだけ
 *
 * "counterStatus" … 攻撃を受けたとき、攻撃してきた相手を状態異常にすることがある
 *     status  : 状態異常id（data/statuses.js）
 *     chance  : 確率。相手の耐性（statusResist）が掛かる（技の status と同じ）
 *     trigger : "hit" … ダメージを受けたらいつでも（技・通常攻撃・範囲技）
 *               "normalAttack" … 通常攻撃を受けたときだけ
 *
 * "drain" … 与えたダメージの value の割合だけ、自分のHPを戻す（技の drain と同じ）
 *     value            : 割合
 *     normalAttackOnly : true なら通常攻撃のときだけ
 *
 * "firstStrike" … 戦闘の最初のターンだけ、素早さに関係なく先に動く
 *     （同じ特性を持つ者どうしは素早さ順。スカウトはそれより先）
 *
 * "undying" … 攻撃で倒されても、そのターンの終わりまでHP0のまま踏みとどまる。
 *     ターンの終わりに倒れる（回復はできない。まだ動いていなければ動ける）。
 *     同じ側で1ターンに1体まで。毒・即死では働かない
 *
 * "shedStatus" … ターンの終わりに、状態異常に掛かっていれば chance の確率で全部治す（v1.0.0 脱皮）
 *     chance : 確率（0.6 なら60%）。道具で治せない封印も治す
 *
 * "tailwind" … 戦闘が始まってから turns ターンのあいだ、行動順を決める素早さに value を掛ける（v1.0.0 追い風）
 *     value : 倍率 / turns : 何ターン目まで効くか（戦闘の1ターン目から数える。途中で出ても延びない）
 *     能力値そのものは変えないので、仲間画面の素早さには出ない
 *
 * "wardAlly" … 1ターン目の頭に、場に出ている自分以外の仲間1体（ランダム）へ
 *     「状態異常を1回だけ防ぐ」守りをつける（v1.0.0 芽吹き）。
 *     仲間がいなければ働かない。1回防ぐか戦闘が終わると消える。
 *     防ぐのは、確率の判定を通って本当に掛かるときだけ（外れた分では減らない）
 *
 * ▼ 条件（condition。省略すると常に効く）
 *     hpBelow : 自分のHP割合がこの値以下のときだけ効く（0.25 なら1/4以下）
 *     hpAbove : 自分のHP割合がこの値以上のときだけ効く
 *
 * ★ 新しいアビリティの追加は、このファイルに1エントリ足すだけでよい。
 *   新しい「効果の種類」を足すときは js/systems/EffectSystem.js に処理を追加する。
 */
(function (NS) {
  "use strict";

  NS.rawData.abilities = {
    // --- ステータス倍率の例 ---

    tough: {
      id: "tough",
      name: "たくましい",
      category: "stat",
      description: "体が丈夫で、HPが少し高い。",
      effects: [
        { type: "statMultiplier", stat: "hp", value: 1.15 }
      ]
    },

    swiftFoot: {
      id: "swiftFoot",
      name: "俊足",
      category: "stat",
      description: "動きが速く、素早さが上がる。",
      effects: [
        { type: "statMultiplier", stat: "speed", value: 1.2 }
      ]
    },

    guts: {
      id: "guts",
      name: "こんじょう",
      category: "stat",
      description: "HPが少なくなると攻撃が大きく上がる。",
      effects: [
        { type: "statMultiplier", stat: "attack", value: 1.5,
          condition: { hpBelow: 0.25 } }
      ]
    },

    // --- ダメージ倍率の例 ---

    fireSoul: {
      id: "fireSoul",
      name: "炎の魂",
      category: "damage",
      description: "火属性の技の威力が上がる。",
      effects: [
        { type: "damageDealt", value: 1.25, element: "fire" }
      ]
    },

    glowing: {
      id: "glowing",
      name: "発光",
      category: "damage",
      description: "体が光を放ち、光属性の技の威力が上がる。",
      effects: [
        { type: "damageDealt", value: 1.25, element: "light" }
      ]
    },

    // α-9 でビリムシが「放電」になってから持つ種族がいなかったが、v1.0.1 でザンガルド（蔦這う回廊の雷の竜の子）が持つ
    charged: {
      id: "charged",
      name: "帯電",
      category: "damage",
      description: "体に電気をためており、雷属性の技の威力が上がる。",
      effects: [
        { type: "damageDealt", value: 1.25, element: "thunder" }
      ]
    },

    // 発光（光）と対になる闇のほう。倍率は炎の魂・発光とそろえてある
    duskborn: {
      id: "duskborn",
      name: "宵闇",
      category: "damage",
      description: "闇をまとっており、闇属性の技の威力が上がる。",
      effects: [
        { type: "damageDealt", value: 1.25, element: "dark" }
      ]
    },

    thickSkin: {
      id: "thickSkin",
      name: "厚い皮膚",
      category: "damage",
      description: "受けるダメージが少し減る。",
      effects: [
        { type: "damageTaken", value: 0.9 }
      ]
    },

    // --- 複数の効果を持つ例 ---

    brittleShell: {
      id: "brittleShell",
      name: "ひび割れ",
      category: "damage",
      description: "体にひびが入っている。守りは固いが、地の技を受けると砕けやすい。",
      effects: [
        { type: "statMultiplier", stat: "defense", value: 1.2 },
        // 耐性（地-3 = ×1.6）にさらに掛かるので、地の技は合計 ×1.92 になる
        { type: "damageTaken", value: 1.2, element: "earth" }
      ]
    },

    wildInstinct: {
      id: "wildInstinct",
      name: "野生の勘",
      category: "damage",
      description: "攻撃が上がるかわりに、受けるダメージも増える。",
      effects: [
        { type: "statMultiplier", stat: "attack", value: 1.2 },
        { type: "damageTaken", value: 1.15 }
      ]
    },

    // --- α-9 で足したもの（作者が決めた11種） ---

    // 厚い皮膚（常に −10%）より強いが、HPが半分を切ると働かない
    hardShell: {
      id: "hardShell",
      name: "硬い殻",
      category: "damage",
      description: "硬い殻に守られている。HPが半分以上のあいだ、受けるダメージが減る。",
      effects: [
        { type: "damageTaken", value: 0.8, condition: { hpAbove: 0.5 } }
      ]
    },

    // こんじょう（1/4以下で ×1.5）より早く働き、上がり幅は小さい
    kingsDignity: {
      id: "kingsDignity",
      name: "王の威厳",
      category: "stat",
      description: "追いつめられるほど王の意地を見せる。HPが1/3以下になると攻撃が上がる。",
      effects: [
        { type: "statMultiplier", stat: "attack", value: 1.2, condition: { hpBelow: 0.333 } }
      ]
    },

    // 属性の技が上がる特性。倍率は炎の魂・発光・帯電・宵闇とそろえてある
    waterHeart: {
      id: "waterHeart",
      name: "水の心",
      category: "damage",
      description: "水と心を通わせており、水属性の技の威力が上がる。",
      effects: [
        { type: "damageDealt", value: 1.25, element: "water" }
      ]
    },

    windFlow: {
      id: "windFlow",
      name: "風の流れ",
      category: "damage",
      description: "風の流れに乗り、風属性の技の威力が上がる。",
      effects: [
        { type: "damageDealt", value: 1.25, element: "wind" }
      ]
    },

    earthPower: {
      id: "earthPower",
      name: "大地の力",
      category: "damage",
      description: "大地の力を宿しており、地属性の技の威力が上がる。",
      effects: [
        { type: "damageDealt", value: 1.25, element: "earth" }
      ]
    },

    // 作者の指定は「最大HPの5〜10%程度」。α-9 は6%から始め、v1.0.0 で 10%・1ターン50まで（作者の指定）
    regen: {
      id: "regen",
      name: "再生",
      category: "special",
      description: "傷がみるみるふさがる。毎ターンの終わりにHPが回復する。",
      effects: [
        { type: "regen", value: 0.10, max: 50 }
      ]
    },

    // 麻痺は手番を失うので強い。毒のとげより確率を低くしてある
    discharge: {
      id: "discharge",
      name: "放電",
      category: "special",
      description: "体から電気がもれている。攻撃を受けると、ときどき相手を麻痺させる。",
      effects: [
        { type: "counterStatus", status: "paralysis", chance: 0.2, trigger: "hit" }
      ]
    },

    poisonThorn: {
      id: "poisonThorn",
      name: "毒のとげ",
      category: "special",
      description: "体に毒のとげがある。通常攻撃を受けると、ときどき相手を毒にする。",
      effects: [
        { type: "counterStatus", status: "poison", chance: 0.3, trigger: "normalAttack" }
      ]
    },

    soulDrain: {
      id: "soulDrain",
      name: "吸精",
      category: "special",
      description: "相手の精気を吸う。通常攻撃で与えたダメージの10%だけHPが回復する。",
      effects: [
        { type: "drain", value: 0.1, normalAttackOnly: true }
      ]
    },

    firstStrike: {
      id: "firstStrike",
      name: "先手",
      category: "special",
      description: "すばしこく飛び出す。戦闘の最初のターンだけ、必ず最初に動く。",
      effects: [
        { type: "firstStrike" }
      ]
    },

    undeadSoul: {
      id: "undeadSoul",
      name: "亡者の魂",
      category: "special",
      description: "死してなお動く。倒されても、そのターンだけHP0のまま踏みとどまる。" +
                   "ターンの終わりに倒れる（1ターンに1体まで）。",
      effects: [
        { type: "undying" }
      ]
    },

    // --- v1.0.0 で足したもの（萌芽の穴・若葉の洞。作者が決めたもの） ---

    // フタバムシ
    shedSkin: {
      id: "shedSkin",
      name: "脱皮",
      category: "special",
      description: "古い皮を脱ぎ捨てる。ターンの終わりに状態異常に掛かっていると、ときどき自分で治す。",
      effects: [
        { type: "shedStatus", chance: 0.6 }
      ]
    },

    // ワカバドリ
    tailwind: {
      id: "tailwind",
      name: "追い風",
      category: "special",
      description: "追い風に乗って飛び出す。戦闘が始まってから2ターンのあいだ、素早さが2倍になる。",
      effects: [
        { type: "tailwind", value: 2, turns: 2 }
      ]
    },

    // 若葉の洞の主（作者が決めたもの）。元気な相手ほど強く打ち、弱った相手には手を緩める
    fullHunt: {
      id: "fullHunt",
      name: "万全狩り",
      category: "damage",
      description: "万全な獲物ほど好んで狩る。残りHPが多い相手ほど与えるダメージが増え、弱った相手には減る。",
      effects: [
        { type: "damageByTargetHp", tiers: [
          { atLeast: 1.00, value: 1.20 },
          { atLeast: 0.75, value: 1.10 },
          { atMost: 0.50,  value: 0.90 }
        ] }
      ]
    },

    // コダマ
    sprouting: {
      id: "sprouting",
      name: "芽吹き",
      category: "special",
      description: "仲間に芽吹きの力を分ける。戦闘が始まると、自分以外の仲間1体が状態異常を1回だけ防げるようになる。",
      effects: [
        { type: "wardAlly" }
      ]
    },

    // コケキノコ（蔦這う回廊。名前と効果は作者が決めたもの 2026-10-21）。
    // 受けるダメージに、当たるたびに 0.75〜1.25 のどれかが掛かる（EffectSystem.getDamageTakenRandomMultiplier）
    gamble: {
      id: "gamble",
      name: "ギャンブル",
      category: "damage",
      description: "受けるダメージが、毎回 -25%〜+25% のあいだで増えたり減ったりする。",
      effects: [
        { type: "damageTakenRandom", min: 0.75, max: 1.25 }
      ]
    },

    // シニガミ（蔦這う回廊。名前と効果は作者が決めたもの 2026-10-21）。
    // 即死を付ける技（デス・デスラ・死の踊り）を使っても PP が減らない（BattleSystem.ppCostOf）
    reaper: {
      id: "reaper",
      name: "死神",
      category: "special",
      description: "死を司る。即死を付ける技を使っても、PPが減らない。",
      effects: [
        { type: "freeDeathSkills" }
      ]
    },

    // ウェポン（千年樹の根底。名前と効果は作者が決めたもの 2026-11-05）
    swordMaster: {
      id: "swordMaster",
      name: "剣豪",
      category: "damage",
      description: "すべての斬撃技のダメージが1.25倍になる。",
      effects: [
        { type: "damageDealt", value: 1.25, skillKind: "slash" }
      ]
    },

    // ジュエル（千年樹の根底。名前と効果は作者が決めたもの 2026-11-05）。
    // 受けるダメージはすべて ×1/3（allDamage。毒・反動・罠も。MonsterInstance.reduceDirectDamage）。
    // 技に払う PP ×1.5（端数は切り上げ。MonsterInstance.getSkillPpCost）
    hardBody: {
      id: "hardBody",
      name: "カチカチ",
      category: "damage",
      description: "すべてのダメージが1/3になり、消費PPが1.5倍になる。",
      effects: [
        { type: "damageTaken", value: 1 / 3, allDamage: true },
        { type: "ppCostMultiplier", value: 1.5 }
      ]
    }
  };
})(window.MyGame);
