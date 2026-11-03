/**
 * dungeonThemes.js
 * ダンジョンの「見た目」だけをまとめたファイル。色と床の飾りを決める。
 *
 * data/dungeons.js の theme に、ここのidを書いて結びつける。
 *   mossyMine: { ..., theme: "mine" }
 * theme を書かなかったダンジョンは、data/dungeon.js と data/ui.js の既定の色になる。
 *
 * name        : 何のテーマか（コードからは使わない。読む人のための覚え書き）
 * background  : マップの外側（余白）の色
 * tiles       : タイルの色。キーは data/dungeon.js の tiles の name
 *     wall / floor / stairs
 *   書かなかったものは data/dungeon.js の色をそのまま使う
 * stairsMark  : 階段に重ねる記号の見た目（省略時は data/ui.js の dungeon.stairsMark）
 * battle      : その場所で戦うときの背景。省略すると data/ui.js の battle.background
 *     gradientTop / gradientBottom … 上から下へのグラデーション
 *     groundY / groundColor / edgeColor … 立っている地面の帯と、その上端の線
 *     particles … 漂うもの（data/ui.js の粒子と同じ書き方。速さを負にすると昇る）
 * tilePatterns: 壁や床に描く模様（v1.0.0）。書かなければ色だけ（今までどおり）。
 *     キーはタイルの name（wall / floor など）、値は模様の配列（上から順に重ねる）。
 *     模様の type（描き方は js/scenes/DungeonScene.js の TILE_PATTERNS）：
 *       speckle … 粒を散らす      { colors: [...], count, size }
 *       edge    … 隣が別のタイルの側の縁に、ぎざぎざの帯（草の生え際など）
 *                 { side: "top"/"bottom"/"left"/"right", color, tipColor, width }
 *       roots   … 細い筋がくねくね伸びる（根・ひび） { color, count, length, chance }
 *       sprout  … 小さな双葉を1つ置く               { colors: [茎, 明るい葉], chance }
 *     どれもマスの位置から決まるので、同じ階なら何度描いても同じ模様になる。
 *     階ごとに一度だけ描いておくので、模様を増やしても重くならない。
 * decorations : 床に散らす飾り。当たり判定も効果も無く、見た目だけのもの
 *     count : 1階層あたりに置く個数（min〜max からランダム）
 *     table : 何を置くか。weight は出やすさの比
 *   絵の実体は data/sprites.js。飾りを増やすときは、そちらに1つ足して
 *   ここの table に並べるだけでよい（コードの変更は要らない）。
 *
 * ★ 地方が増えたら、その地方のテーマをここに足す。
 *   複数のダンジョンで同じテーマを使い回してもよい（同じ地方の見た目を揃えたいとき）。
 */
(function (NS) {
  "use strict";

  NS.rawData.dungeonThemes = {
    // 苔むす坑道。湿った岩と苔。深淵の入口らしく、暗いが緑がかっている
    mine: {
      name: "苔むした坑道",
      background: "#060a08",
      tiles: {
        wall:   "#3a4a3c",
        floor:  "#141c17",
        stairs: "#2a3a2c"
      },
      decorations: {
        count: { min: 10, max: 16 },
        table: [
          { sprite: "decoMoss",   weight: 1.0 },
          { sprite: "decoPebble", weight: 0.6 }
        ]
      },
      // 戦闘の背景：湿った緑の岩肌。胞子がゆっくり漂う
      battle: {
        gradientTop: "#16291d",
        gradientBottom: "#060b08",
        groundY: 346, groundColor: "#0b1710", edgeColor: "#2a4a33",
        particles: {
          count: 22, color: "#6fa84f", minSize: 1, maxSize: 2,
          minSpeed: -13, maxSpeed: -4, minAlpha: 0.08, maxAlpha: 0.30,
          minDriftX: -5, maxDriftX: 5
        }
      }
    },

    // 灼熱の亀裂。焼けた岩肌と、まだ熱を持っている床のひび
    ember: {
      name: "焼けた岩",
      background: "#0d0503",
      tiles: {
        wall:   "#5a2f22",
        floor:  "#1e1010",
        stairs: "#4a2418"
      },
      stairsMark: { color: "#ffb15e" },
      decorations: {
        count: { min: 8, max: 14 },
        table: [
          { sprite: "decoEmber",  weight: 1.0 },
          { sprite: "decoPebble", weight: 0.4 }
        ]
      },
      // 戦闘の背景：焼けた岩と、下から昇る火の粉
      battle: {
        gradientTop: "#3a1409",
        gradientBottom: "#0d0503",
        groundY: 346, groundColor: "#1c0c07", edgeColor: "#6b2f17",
        particles: {
          count: 30, color: "#ffa32e", minSize: 1, maxSize: 2.5,
          minSpeed: -34, maxSpeed: -10, minAlpha: 0.15, maxAlpha: 0.55,
          minDriftX: -8, maxDriftX: 8
        }
      }
    },

    // 静寂の深層。冷たく青い。ここまで来た者の骨が転がっている
    depths: {
      name: "冷えた最深部",
      background: "#04050c",
      tiles: {
        wall:   "#343a5e",
        floor:  "#0f1220",
        stairs: "#252b48"
      },
      decorations: {
        count: { min: 6, max: 12 },
        table: [
          { sprite: "decoBone",   weight: 0.8 },
          { sprite: "decoPebble", weight: 0.6 }
        ]
      },
      // 戦闘の背景：冷たく静かな最深部。細かい塵がゆっくり降る
      battle: {
        gradientTop: "#141a33",
        gradientBottom: "#03050c",
        groundY: 346, groundColor: "#080b16", edgeColor: "#2c3762",
        particles: {
          count: 26, color: "#8ea0d8", minSize: 1, maxSize: 1.8,
          minSpeed: 5, maxSpeed: 16, minAlpha: 0.06, maxAlpha: 0.26,
          minDriftX: -3, maxDriftX: 3
        }
      }
    },

    /**
     * 腐食の毒沼。深層の主が沈んでいた、そのさらに下。
     *
     * ★ 坑道（mine）と同じ緑にしないこと。
     *   坑道は「湿った岩と苔」の落ち着いた深緑（壁 #3a4a3c）。
     *   ここは「体に悪い」黄緑に振ってある（壁 #4a5a2e）。
     *   並べると別の場所だと分かるよう、彩度と黄色みで差をつけた。
     *
     * 毒がここから出るので、見ただけで「長居したくない」と思える色にしている。
     */
    venom: {
      name: "澱んだ毒沼",
      background: "#070a04",
      tiles: {
        wall:   "#4a5a2e",
        floor:  "#16200f",
        stairs: "#3a4a22"
      },
      // 階段だけは毒々しい黄緑にして、沼の中でも見つけやすくする
      stairsMark: { color: "#c8e05a" },
      decorations: {
        count: { min: 10, max: 16 },
        table: [
          // 苔と骨。沼に沈んだものが覗いている、という見立て
          { sprite: "decoMoss",   weight: 1.0 },
          { sprite: "decoBone",   weight: 0.7 },
          { sprite: "decoPebble", weight: 0.4 }
        ]
      },
      // 戦闘の背景：澱んだ黄緑。毒の胞子がゆっくり昇る（坑道より濃く・多い）
      battle: {
        gradientTop: "#24331a",
        gradientBottom: "#070a04",
        groundY: 346, groundColor: "#101806", edgeColor: "#4a6b28",
        particles: {
          count: 34, color: "#b8d94a", minSize: 1, maxSize: 2.5,
          minSpeed: -16, maxSpeed: -5, minAlpha: 0.10, maxAlpha: 0.38,
          minDriftX: -6, maxDriftX: 6
        }
      }
    },

    /**
     * 萌芽の穴（v1.0.0）。名前のとおり「芽吹く」穴。
     * 土の壁から根がのぞき、床の際には若い草が生え、床のあちこちに双葉が顔を出している。
     *
     * ★ 揺籃の穴の緑と分けること。
     *   苔むす坑道 … 灰色がかった深緑の岩（壁 #3a4a3c）
     *   腐食の毒沼 … 体に悪い黄緑（壁 #4a5a2e）
     *   ここ       … 壁は土の茶色、緑は差し色の「若葉の明るい緑」だけに使う
     * ★ 穴を選ぶ画面の色の帯と、1つ目の区画「若葉の洞」に使う。
     *   ほかの区画（ivy / rootdeep）は、この色を土台に少しずつずらしてある
     *   （spore は胞子煙る菌床のためのもの。菌床はなくなった〈作者 2026-10-30〉が、組は使わずに残してある）
     */
    houga: {
      name: "芽吹く土",
      background: "#070806",
      tiles: {
        wall:   "#4b3a26",
        floor:  "#17190f",
        stairs: "#2c3a1a"
      },
      // 階段は若葉の色にして、土の中でも見つけやすくする
      stairsMark: { color: "#9be36a" },
      tilePatterns: {
        wall: [
          { type: "speckle", colors: ["#5c4830", "#3d2f1d"], count: 7, size: 2 },   // 土の粒
          { type: "roots", color: "#2f2416", count: 2, length: 9, chance: 0.6 },     // 壁を這う根
          { type: "edge", side: "bottom", color: "#4f8f30", tipColor: "#8fd45a", width: 5 }  // 床に面した下端の草
        ],
        floor: [
          { type: "speckle", colors: ["#20241a", "#101309"], count: 6, size: 2 },   // 湿った土
          { type: "sprout", colors: ["#4f8f30", "#8fd45a"], chance: 0.1 }            // ところどころの双葉
        ]
      },
      decorations: {
        count: { min: 12, max: 18 },
        table: [
          { sprite: "decoSprout", weight: 1.0 },
          { sprite: "decoBud",    weight: 0.5 },
          { sprite: "decoPebble", weight: 0.3 }
        ]
      },
      // 戦闘の背景：若葉の緑が上から差し、花粉のような淡い粒がゆっくり昇る
      battle: {
        gradientTop: "#22381a",
        gradientBottom: "#070806",
        groundY: 346, groundColor: "#141a0b", edgeColor: "#5f9a3a",
        particles: {
          count: 28, color: "#d8f0a0", minSize: 1, maxSize: 2,
          minSpeed: -12, maxSpeed: -3, minAlpha: 0.10, maxAlpha: 0.40,
          minDriftX: -6, maxDriftX: 6
        }
      }
    },

    /**
     * 蔦這う回廊（萌芽の穴の2区画目）。古い石の回廊を、蔦が覆い尽くしている。
     * 壁は土ではなく石（灰みの茶）で、その上を緑の蔓が長く這う。戦いでは葉がゆっくり舞い落ちる
     */
    ivy: {
      name: "蔦に覆われた石",
      background: "#070806",
      tiles: {
        wall:   "#45402f",
        floor:  "#16160f",
        stairs: "#2c3a1a"
      },
      stairsMark: { color: "#9be36a" },
      tilePatterns: {
        wall: [
          { type: "speckle", colors: ["#524b38", "#363224"], count: 6, size: 2 },   // 石の肌
          { type: "roots", color: "#3f7a2a", count: 3, length: 15, chance: 0.9 },    // 壁を這う蔓
          { type: "edge", side: "bottom", color: "#3f7a2a", tipColor: "#6fb84a", width: 6 }  // 垂れ下がる葉
        ],
        floor: [
          { type: "speckle", colors: ["#1f1f16", "#0f0f09"], count: 6, size: 2 },
          { type: "sprout", colors: ["#3f7a2a", "#6fb84a"], chance: 0.06 }
        ]
      },
      decorations: {
        count: { min: 12, max: 18 },
        table: [
          { sprite: "decoVine",   weight: 1.0 },
          { sprite: "decoSprout", weight: 0.4 },
          { sprite: "decoPebble", weight: 0.4 }
        ]
      },
      // 戦闘の背景：くすんだ緑。葉が上からゆっくり舞い落ちる（速さを正にすると降る）
      battle: {
        gradientTop: "#2a3320",
        gradientBottom: "#080906",
        groundY: 346, groundColor: "#15180d", edgeColor: "#4f7a32",
        particles: {
          count: 22, color: "#7fbf5a", minSize: 1.5, maxSize: 3,
          minSpeed: 4, maxSpeed: 12, minAlpha: 0.15, maxAlpha: 0.45,
          minDriftX: -10, maxDriftX: 10
        }
      }
    },

    /**
     * 胞子煙る菌床のための組。きのこが一面に生え、胞子が煙のように漂う。
     * 壁と床は紫がかった土。床に面した壁の下端には白い菌糸がはびこる。戦いでは胞子が濃く漂う
     * ★ 菌床は作者がなくした（2026-10-30。萌芽の穴の区画は3つ）。どこからも使っていないが、あとで使えるように残してある
     */
    spore: {
      name: "胞子の漂う菌床",
      background: "#08060a",
      tiles: {
        wall:   "#3b2f38",
        floor:  "#141017",
        stairs: "#2e2236"
      },
      stairsMark: { color: "#d8b8ff" },
      tilePatterns: {
        wall: [
          { type: "speckle", colors: ["#4a3a46", "#2c2229"], count: 7, size: 2 },
          { type: "edge", side: "bottom", color: "#8a7898", tipColor: "#d8c8e8", width: 3 }  // 菌糸
        ],
        floor: [
          { type: "speckle", colors: ["#1e1822", "#3a2e46"], count: 7, size: 1 }    // かすかに光る胞子
        ]
      },
      decorations: {
        count: { min: 14, max: 22 },
        table: [
          { sprite: "decoMushroom", weight: 1.0 },
          { sprite: "decoPebble",   weight: 0.3 }
        ]
      },
      // 戦闘の背景：紫の霞。胞子が煙のように多く、ゆっくり昇る
      battle: {
        gradientTop: "#2c2236",
        gradientBottom: "#09070b",
        groundY: 346, groundColor: "#120d16", edgeColor: "#6a4f88",
        particles: {
          count: 44, color: "#d8c0f0", minSize: 1, maxSize: 3,
          minSpeed: -9, maxSpeed: -2, minAlpha: 0.06, maxAlpha: 0.32,
          minDriftX: -8, maxDriftX: 8
        }
      }
    },

    /**
     * 千年樹の根底（萌芽の穴の3区画目で最後。主がいる）。穴の底まで伸びた巨木の根のあいだ。
     * 壁は暗い樹皮と土、太い根が何本も走る。差し色は樹液の琥珀色。戦いでは琥珀の光の粒がゆっくり昇る
     */
    rootdeep: {
      name: "巨木の根のあいだ",
      background: "#060403",
      tiles: {
        wall:   "#2e2318",
        floor:  "#110d08",
        stairs: "#3a2a14"
      },
      stairsMark: { color: "#e8b04a" },
      tilePatterns: {
        wall: [
          { type: "speckle", colors: ["#3a2c1e", "#22190f"], count: 6, size: 2 },
          { type: "roots", color: "#5a4228", count: 3, length: 16, chance: 1 },      // 太い根
          { type: "roots", color: "#7a5a34", count: 1, length: 8, chance: 0.5 },     // 光の当たる根
          { type: "edge", side: "bottom", color: "#4a3622", tipColor: "#8a6236", width: 4 }
        ],
        floor: [
          { type: "speckle", colors: ["#1a140c", "#0a0704"], count: 6, size: 2 },
          { type: "speckle", colors: ["#6a4a1a"], count: 1, size: 1 }               // ところどころの樹液の光
        ]
      },
      decorations: {
        count: { min: 10, max: 16 },
        table: [
          { sprite: "decoRoot",   weight: 1.0 },
          { sprite: "decoPebble", weight: 0.5 },
          { sprite: "decoBud",    weight: 0.2 }
        ]
      },
      // 戦闘の背景：暗い琥珀。樹液の光の粒がまばらに、ゆっくり昇る
      battle: {
        gradientTop: "#2a1d10",
        gradientBottom: "#070503",
        groundY: 346, groundColor: "#110b06", edgeColor: "#7a5428",
        particles: {
          count: 18, color: "#e8b04a", minSize: 1, maxSize: 2,
          minSpeed: -10, maxSpeed: -3, minAlpha: 0.10, maxAlpha: 0.45,
          minDriftX: -4, maxDriftX: 4
        }
      }
    }
  };
})(window.MyGame);
