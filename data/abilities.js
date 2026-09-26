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
 *
 * ▼ 戦闘中に働く効果（js/battle/BattleSystem.js が処理する）
 *
 * "regen" … ターンの終わりに、最大HPの value の割合だけ回復する
 *     value : 割合（0.06 なら6%。最低1は戻る）
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
 * ▼ 条件（condition。省略すると常に効く）
 *     hpBelow : 自分のHP割合がこの値以下のときだけ効く（0.25 なら1/4以下）
 *     hpAbove : 自分のHP割合がこの値以上のときだけ効く
 *
 * ★ 新しいアビリティの追加は、このファイルに1エントリ足すだけでよい。
 *   新しい「効果の種類」を足すときは js/systems/AbilitySystem.js に処理を追加する。
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

    // 雷を扱えるのはビリムシだけ。α-9 でビリムシが「放電」になったので、今は持つ種族がいない
    // （図鑑では「？？？」のまま。雷の種族が増えたら持たせる）
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

    // 作者の指定は「最大HPの5〜10%程度」。まずは真ん中より少し下の6%から
    regen: {
      id: "regen",
      name: "再生",
      category: "special",
      description: "傷がみるみるふさがる。毎ターンの終わりにHPが少し回復する。",
      effects: [
        { type: "regen", value: 0.06 }
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
    }
  };
})(window.MyGame);
