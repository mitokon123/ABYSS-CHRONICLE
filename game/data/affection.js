/**
 * affection.js
 * 愛情度（仲間ひとりひとりとの絆）の段階と報酬。
 *
 * 物語の上の決まりは ストーリー構成.md の 10「愛情度と図鑑の記録」。
 *
 * ▼ 上がり方
 *   **勝った戦闘で、一度でも場に出ていた仲間**に gainPerWin ずつ入る。
 *   控え（場に出ていない仲間）には入らない。経験値は控えにも全額入るので、
 *   「レベルは控えでも上がるが、絆は一緒に戦わないと深まらない」という差になる。
 *   逃げた・負けた・誘って終わった戦闘では増えない（出会ってすぐ逃げて稼げないように）。
 *   途中で倒れていても、場に出ていれば数える。
 *
 * ▼ 段階（stages）。上から順に並べる
 *   id        : 識別子。図鑑の記録（data/monsters.js の records）のキーにも使う
 *   name      : 表示名
 *   need      : この段階になるのに必要な回数（その個体が勝った戦闘に出た回数の合計）
 *   statBonus : この段階で上がる能力の割合（0.03 = +3%）。**前の段階のぶんに足していく**
 *               （慣れ +3%、信頼でさらに +3% → 合わせて +6%）
 *   bondReward: true の段階で、その種族だけの報酬（data/monsters.js の bondReward）を受け取る
 *
 * stats : statBonus が掛かる能力（HP・攻撃・防御・素早さ・PP）
 *
 * hideBondRewardUntilReached : true なら、愛情度の詳細（仲間の「様子を見る」から開く）で、
 *   絆に届くまで種族ごとの報酬を「？？？」と伏せる
 *
 * ▼ 種族ごとの報酬（data/monsters.js の bondReward）
 *   全モンスターに専用技があるわけではない。専用技の無いモンスターは、
 *   能力・耐性が上がったり、既存の技を覚えたりする。どれも同じ書き方で書ける：
 *     bondReward: { skill: "技のid" }                                   … 技を覚える（専用技でも既存の技でも）
 *     bondReward: { effects: [ { type: "statBonus", stat: "defense", value: 5 } ] } … 能力が上がる
 *     bondReward: { effects: [ { type: "resistBonus", element: "fire", value: 3 } ] } … 耐性が上がる
 *     skill と effects は両方書いてもよい。effects の書き方は特性・装備と同じ
 *
 * max : 愛情度はここで止まる（v1.4.2・2026-11-13 作者の指定。絆の 180）。勝ってもそれより上がらない。
 *   古いセーブで超えている仲間は、読み込んだときに max へそろえる（段階も報酬も変わらない）
 *
 * ★ 下がることはない。預かり所に預けても、そのまま残る。
 */
(function (NS) {
  "use strict";

  NS.rawData.affection = {
    gainPerWin: 1,
    max: 180,
    stats: ["hp", "attack", "defense", "speed", "pp"],
    hideBondRewardUntilReached: true,
    stages: [
      // icon … 拠点の仲間の一覧で、名前の横に出す印（data/sprites_icons.js）。出会いには出さない
      { id: "meet",  name: "出会い", need: 0 },
      // 必要な回数は α-9 のテストプレイで「思ったより簡単」だったので 1.5倍にした（20/60/120 → 30/90/180）
      { id: "used",  name: "慣れ",   need: 30,  statBonus: 0.03, icon: "iconAffectionUsed" },
      { id: "trust", name: "信頼",   need: 90,  statBonus: 0.03, icon: "iconAffectionTrust" },
      { id: "bond",  name: "絆",     need: 180, bondReward: true, icon: "iconAffectionBond" }
    ]
  };
})(window.MyGame);
