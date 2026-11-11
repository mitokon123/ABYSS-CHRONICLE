/**
 * regions.js
 * 地方（穴）の一覧。data/dungeons.js の region がここの id を指す。
 *
 * 物語の上では、Monstoria に開いた深淵の穴ひとつひとつが「地方」になる。
 * いまのダンジョン4つ（坑道・亀裂・深層・毒沼）は、どれも揺籃の穴の中の区画。
 * （ストーリー構成.md の 6）
 *
 * ダンジョン選択は「穴を選ぶ → 区画（ダンジョン）を選ぶ」の2段（v1.0.0）。
 *
 * id         : 識別子（dungeons.js の region、解放条件の { region: "…" } で使う）
 * name       : 表示名
 * order      : 穴を選ぶ画面に並ぶ順
 * subtitle   : 穴を選ぶ画面で名前の下に出る一言（空なら出さない）
 * theme      : 穴を選ぶ画面の色の帯に使う見た目（data/dungeonThemes.js のid）
 * unlockedBy : この穴が開く条件（data/dungeons.js の unlockedBy と同じ書き方）
 *              { region: "cradle", count: 4 } … 揺籃の穴の区画を4つクリアしたら
 * battleBgm  : この穴のふつうの戦闘曲（data/audio.js の bgm のid）。書かなければ battle。
 *              主との戦いは今までどおり boss（または data/bosses.js の bgm）
 *
 * ★ 穴を増やすときは、ここに1つ足して、dungeons.js の region をそのidにする。
 *   区画（ダンジョン）が1つも無い穴は、開いていても「準備中」と出て入れない。
 */
(function (NS) {
  "use strict";

  NS.rawData.regions = {
    cradle: {
      id: "cradle",
      name: "揺籃の穴",
      order: 1,
      // ストーリー構成.md の 6「探索者が最も簡単に潜れる穴として知られている」
      subtitle: "探索者が最初に潜る、いちばん浅い穴。",
      theme: "mine",
      unlockedBy: null
    },

    /**
     * 2つ目の穴（v1.0.0。作者の決定 2026-10-05）。
     * 揺籃の穴の主を4体すべて記録する（4区画をクリアする）と開く。
     * 区画は3つ（若葉の洞・蔦這う回廊・千年樹の根底。data/dungeons.js）。
     *   はじめは4つ（3つ目に胞子煙る菌床）の予定だったが、作者が3つに減らした（2026-10-30）。千年樹の根底が最後で、主がいる。
     * 敵は Lv22〜33（〜35）の予定。若葉の洞（v1.0.0）・蔦這う回廊（v1.1.0）・千年樹の根底（v1.3.0。2026-11-11 に開いた）。
     * ★ subtitle は作者から「いまのところおまかせ」（2026-10-05）で私が書いたもの。差し替えてよい
     */
    houga: {
      id: "houga",
      name: "萌芽の穴",
      order: 2,
      subtitle: "命が芽吹き、絶えず育ち続ける若い穴。",
      theme: "houga",
      // ふつうの戦闘曲（作者の指定 2026-10-09。主との戦いは揺籃と同じ boss）
      battleBgm: "hougaBattle",
      unlockedBy: { region: "cradle", count: 4 }
    }
  };
})(window.MyGame);
