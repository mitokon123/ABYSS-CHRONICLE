/**
 * shop.js
 * 拠点の店の設定。
 *
 * sellRate : 売値の割合。売値 = items.js の price × sellRate（切り捨て）。全店で共通
 *
 * shops    : 店の一覧。画面上部のタブで切り替える
 *   id         : 識別子
 *   name       : タブと見出しに出す名前
 *   subtitle   : 見出しの下に出す一言
 *   keeper     : 店主の絵（data/sprites_ui.js を参照）。省略すると誰もいない
 *   keeperMotion : 店主の動き（data/motions.js のid）。省略すると動かない
 *   type       : 何を売る店か。省略すると "item"（ふつうの品物）
 *                "blessing" … 加護を売る店。品物は data/blessings.js の
 *                  locked: true が付いたものが自動的に並ぶ（stock は使わない）。
 *                  買った加護は恒久的に残り、売ることはできない
 *   unlockedBy : 店そのものが開く条件。省略すると最初から開いている
 *                書き方は data/dungeons.js の unlockedBy と同じ
 *                （"id" / ["id","id"] / {dungeons,count} / {region,count}）
 *   stock      : 店に並ぶ品物
 *     item       : アイテムid（data/items.js を参照）
 *     price      : 買値。省略すると items.js の price をそのまま使う
 *     unlockedBy : この品だけが後から並ぶ条件。省略すると最初から並ぶ
 *     from       : 書かなくてよい。素材のステージの小見出し（「苔むす坑道」など）は
 *                  data/items.js の from から出す（図鑑と同じ）。店だけ別にしたいときだけ書く
 *   lines      : 店主の台詞。店主の左にふきだしで出る。場面ごとに何個か書くと、その中から選ばれる
 *     greet   … 店に入ったとき・店を切り替えたとき
 *     buy     … 買ったとき
 *     sell    … 売ったとき
 *     noMoney … お金が足りないとき
 *     idle    … しばらく何もしていないとき・店主を押したとき
 *     1つの台詞は文字だけで書くか、{ text, when } で条件を付ける。
 *       when の書き方は物語の場面と同じ（data/story.js）：
 *         { cleared: "ダンジョンid" } / { event: "yomiryuAmbush" } / { caught: "種族id" } など
 *     ★ ふきだしは2行まで。1行は19字くらいで自動で折り返す
 *
 * ★ 店を増やすときは shops に1エントリ足すだけでよい。
 *   品揃えを変えるときは、その店の stock を編集するだけ。
 *
 * ▼ 品揃えが増える店・増えない店
 *   よろず屋は品ごとに unlockedBy を書いてあるので、進むほど並ぶ品が増える。
 *   あとから増やす店は、品揃えを固定にしてもよい（品に unlockedBy を書かないだけ）。
 *
 * ▼ 店で買えないもの
 *   苔の外套は工房でしか作れない（data/recipes.js）。
 *   「素材を集めて作る」ことに意味を持たせたいものは、ここに並べない。
 *
 * ▼ 並ぶ順番
 *   stock に書いた順ではなく、画面では次の順に並べ替えて見出しを挟む。
 *     1. 分類（data/categories.js の item.order）… 回復 → 装備 → 素材 → 重要
 *     2. 手に入るステージ（data/items.js の from）の順 … 素材はステージごとにまとまり、小見出しが入る
 *     3. 値段の安い順 … 手が届くものから目に入る
 *     4. ここに書いた順 … 上が同じときだけ
 *   並びを変えたいときは categories.js の order を入れ替えるのが手軽。
 *   売る側も同じ分類の順に並ぶ（持ち物の画面と行き来しても迷わないように）。
 */
(function (NS) {
  "use strict";

  NS.rawData.shop = {
    sellRate: 0.5,

    shops: [
      {
        id: "general",
        name: "よろず屋",
        keeper: "keeperGeneral",
        keeperMotion: "breathe",
        unlockedBy: null,
        // 深い頭巾をかぶった行商。気さくな口調（台詞は作者が決めたもの）
        lines: {
          greet: [
            "いらっしゃい。今日は何が要るんだい？",
            "おや、また来たね。品は揃ってるよ。",
            "潜る前の備えは、ここで済ませていきな。"
          ],
          buy: [
            "毎度あり！",
            "いい買い物だ。無事に帰ってきなよ。",
            "はいよ。使いどころを間違えなさんな。"
          ],
          sell: [
            "ほう、いい品だね。買い取らせてもらうよ。",
            "これなら欲しがる客がいる。毎度。",
            "深淵の素材がなきゃ、地上の暮らしは回らないのさ。"
          ],
          noMoney: [
            "おっと、お代が足りないようだね。",
            "ツケはやってないんだ。すまないね。"
          ],
          idle: [
            "帰還の石はお守りみたいなもんさ。ひとつは持っておきな。",
            "深く潜るほど、素材にもいい値がつくよ。",
            "スライムは弱いって？ ……案外、しぶといもんさ。",
            "支部長は堅いけど、悪い人じゃないよ。",
            "オルドの旦那は無口だろ？ あれで面倒見はいいんだよ。",
            { text: "素材をなくしたって？ 深淵は取り立てが厳しいね。", when: { event: "defeated" } },
            "揺籃の穴は新人の穴さ。……とはいえ、油断は禁物だよ。",
            { text: "亀裂のほうが、近ごろ妙に熱いって話だよ。", when: { cleared: "mossyMine" } },
            { text: "毒沼に行くなら、解毒草を忘れずにね。", when: { cleared: "silentDepths" } },
            { text: "クロニクラーになったんだって？ おめでとさん。", when: { cleared: "venomMarsh" } }
          ]
        },
        // 進むほど品が増える店。苔の外套だけは工房でしか手に入らない
        stock: [
          { item: "herb" },
          { item: "potion" },
          // 帰り道の保険。最初から買えるようにして、無理をするかどうかを選ばせる
          { item: "returnStone" },
          { item: "fangCharm" },
          // PPの回復。技を使う戦い方を選べるようにするため、早めに置く
          { item: "spiritBerry", unlockedBy: "mossyMine" },
          { item: "stoneBand", unlockedBy: "mossyMine" },
          // スカウトしやすくする香（RC-1）。坑道をクリアすると並ぶ
          { item: "scoutIncense", unlockedBy: "mossyMine" },
          { item: "glowLantern", unlockedBy: "mossyMine" },
          // ▼ 素材。どれも「そのステージをクリアしてから」並ぶ。
          //   店ではステージごとに小見出しを挟んで並べる（ステージは data/items.js の from）。
          //   主のドロップ（坑道の核・灼熱の牙・黄泉竜の鱗・毒嚢など）は並べない ——
          //   主を倒すこと自体に意味を残すため

          // 工房で使う素材。坑道をクリアすると取り扱いが始まる
          { item: "oreShard", unlockedBy: "mossyMine" },
          { item: "glowDust", unlockedBy: "mossyMine" },
          // 亀裂の素材
          { item: "emberAsh", unlockedBy: "scorchingFissure" },
          { item: "ashFeather", unlockedBy: "scorchingFissure" },
          { item: "scorchedShell", unlockedBy: "scorchingFissure" },

          // 毒を治す薬。深層をクリアすると取り扱いが始まる。
          //   毒が出てくるのはステージ4からなので、それまで並べても使い道が無い
          { item: "antidote", unlockedBy: "silentDepths" },

          // 深層の素材。クリアしてから取り扱いが始まる。
          // 黄泉竜の鱗（ヨミリュウのドロップ）は並べない —— 竜を狩ること自体に意味を残すため
          { item: "slimeShard", unlockedBy: "silentDepths" },
          { item: "duskDew", unlockedBy: "silentDepths" },
          { item: "twistedVine", unlockedBy: "silentDepths" },
          { item: "stormWing", unlockedBy: "silentDepths" },

          // 毒沼の素材。クリアしてから取り扱いが始まる（α-9 のテストプレイで追加）。
          // 毒嚢（ヌシガエルのドロップ）と骨の護符（買えない装備）は並べない
          { item: "venomStinger", unlockedBy: "venomMarsh" },
          { item: "rustedBone", unlockedBy: "venomMarsh" },
          { item: "muddyShell", unlockedBy: "venomMarsh" },

          // 第一章クリア後の装備（お金の使いみち。値段は作者が決めたもの）。
          // 工房で作れるいちばん良い装備は超えない強さ（data/items.js のコメント）
          { item: "explorerSword",    unlockedBy: "venomMarsh" },
          { item: "thickLeatherVest", unlockedBy: "venomMarsh" },
          { item: "spiritRing",       unlockedBy: "venomMarsh" },
          { item: "travelerCharm",    unlockedBy: "venomMarsh" },

          // 大きく回復する薬。毒沼をクリアしてから並ぶ。
          //   毒沼までは回復薬（50G / 50回復）で足りる。
          //   ここで初めて「1ターンで100戻す」選択肢を出す
          { item: "elixir", unlockedBy: "venomMarsh" }
        ]
      },

      // 加護を売る店。品物がアイテムではなく加護なので type: "blessing" を付ける。
      // 何を売るかは data/blessings.js の locked: true / price が決めるので、
      // ここに stock は書かない（加護を増やせば自動的に並ぶ）
      {
        id: "mystic",
        name: "謎の商人",
        subtitle: "深淵の底から来たという",
        keeper: "keeperMystic",
        keeperMotion: "breathe",
        type: "blessing",
        unlockedBy: "silentDepths",
        stock: [],
        // 正体は最後まで明かさない（ストーリー構成.md の 5）。はぐらかす口調で、
        // 振り返ると分かる匂わせ（どこにでも現れる・モンスターが寄らない・穴はつながっている）だけを置く。
        // 台詞は作者が決めたもの。加護は売れないので sell は無い
        lines: {
          greet: [
            "……おや、よく来たね。",
            "また会ったね……いや、初めてだったかな。",
            "息がしやすい日だね。"
          ],
          buy: [
            "代金は確かに……どこへ行くかは、聞かないでおくれ。",
            "よい選択だ。穴の底で、きっと役に立つ。",
            "その加護……穴の外へは連れていけないよ。"
          ],
          noMoney: [
            "足りないね……焦ることはない。穴は逃げないよ。"
          ],
          idle: [
            "どこから来たか？ 深いところさ。それ以上は、商売の秘密だよ。",
            "モンスターは、私には寄ってこない……不思議かい？",
            "穴はどれも、どこかでつながっている。そう思わないかい。",
            { text: "塞がれた穴があるそうだね……少し、息苦しい。", when: { cleared: "venomMarsh" } },
            { text: "その子……ずいぶん深いところから来たね。", when: { caught: "abyssDragon" } }
          ]
        }
      }

      // ★ 店を増やすときは、ここに1エントリ足すだけでよい。
      //   unlockedBy には data/dungeons.js と同じ書き方が使える
      //   （"id" / ["id","id"] / {dungeons,count} / {region,count}）。
    ]
  };
})(window.MyGame);
