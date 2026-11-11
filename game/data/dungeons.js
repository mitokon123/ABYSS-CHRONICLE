/**
 * dungeons.js
 * 挑めるダンジョン（ステージ）の一覧。拠点の「ダンジョンへ潜る」で選ぶ。
 *
 * order       : 選択画面での並び順
 * region      : どの地方（穴）にあるか。data/regions.js の id（"cradle"＝揺籃の穴・"houga"＝萌芽の穴）
 * name        : 表示名
 * subtitle    : 一覧に出す短い説明
 * description : 詳細に出す説明
 * floors      : 最深階。ここまで潜るとボスがいる
 * recommendedLevel : 推奨レベル。**そのダンジョンに初めて入るときの目安**。ダンジョン選択に「推奨Lv5」と出る
 *   ★ 下のコメントに出てくる「推奨レベル16」「推奨Lv20」は、主を倒す目安として以前書いたもの。
 *     画面に出す推奨はこちら（坑道5・亀裂9・深層13・毒沼17）
 * unlockedBy  : 挑めるようになる条件（null なら最初から挑める）。次の書き方ができる
 *     "mossyMine"                        … そのダンジョンをクリア
 *     ["mossyMine", "scorchingFissure"]  … 並べた全部をクリア
 *     { dungeons: [...], count: 2 }      … 並べたうちの2つをクリア
 *     { region: "cradle" }               … その地方を全部クリア
 *     { region: "cradle", count: 3 }     … その地方のうち3つをクリア
 * theme       : 見た目（色と床の飾り）。data/dungeonThemes.js のidを書く
 *               省略すると既定の色になる。同じテーマを複数のダンジョンで使い回してもよい
 * generation  : マップ生成の設定。省略した項目は data/dungeon.js の既定を使う
 * encounter   : この場所の敵の出方
 *   rate      : 1歩あたりの遭遇確率（省略時は data/enemies.js の既定）
 *   groupSize : 一度に出てくる敵の数。2通りの書き方ができる
 *     { min: 1, max: 3 }  … min〜max から均等に選ぶ
 *     [ { count: 1, weight: 0.4 }, { count: 3, weight: 0.2 }, … ]
 *                         … 体数ごとに出やすさを変える（多い数を渋くしたいとき）
 *   levelRange: この場所の出現レベルの既定
 *   table     : 出現候補（species / weight / minLevel / maxLevel / minFloor / maxFloor）
 *     minLevel / maxLevel : その種族だけの出現レベル（階やダンジョンの指定より優先）
 *     minFloor / maxFloor : 出る階を絞る。省略すると全階に出る
 *       例: { species: "…", weight: 0.4, minFloor: 3 } … B3F以降だけ
 *   perFloor  : 階ごとの上書き（"1" が B1F）。書いた項目だけが上書きされる
 *     rate / levelRange / groupSize を階ごとに変えられる（table は変えられない
 *     ——出る種族を階で絞りたいときは、上の minFloor / maxFloor を使う）
 *     例: "3": { levelRange:{min:2,max:4}, groupSize:{min:1,max:2} }
 * featureTables : その場所だけの仕掛けの中身。仕掛けid（chest など）ごとに書く
 *   data/features.js の共通の中身に「足される」（上書きではない）ので、
 *   薬草・回復薬・精気の実はどのダンジョンでも出続ける。
 *   ここにはその場所で手に入る素材を並べる。書き方はドロップと同じ：
 *     chest: [{ item, weight, min, max }]
 *   minFloor / maxFloor を書くと、その階だけで出る（例: 回廊の絡み主根は minFloor: 4 で B4F だけ）
 * fixedChests : 中身の決まった宝箱（v1.3.0）。[{ floor, item, count, chance }]。その階に、features の数とは別に置く。
 *   抽選はせず、書いた中身だけが入る（中断して再開しても同じ中身。FeatureSystem.place）
 *   chance を書くとその確率で置く（書かなければ必ず置く。回廊の絡み主根 0.6）
 *   ★ 主が落とす素材（苔むした核・灼熱の牙）は入れない。
 *     倒すこと自体に意味を残すため
 * dropOverrides : 区画ごとの落とすもの（2026-11-10）。{ 種族id: [drops と同じ書き方] }。
 *   その区画では、種族の drops（data/monsters.js）のかわりにこちらを使う（足すのではなく置き換え）。
 *   図鑑は区画で確率が違う種族だけ、区画ごとに分けて出す（DropSystem.dropsIn・DexScene）
 * boss        : 最深階に出るボスのid（data/bosses.js を参照）
 *   書かない区画は「主なし」。最深階の階段が出口になり、抜けるとクリア（結果は「踏破」。蔦這う回廊 2026-10-27）
 * ready       : false と書くと「準備中」（名前は選択画面に出るが入れない）。中身を作り終えたら行ごと消す（v1.0.0）
 * events      : 一度きりの出来事（決まった階で必ず起きる戦い）。1件に書けるもの
 *   id               : 識別子。**済ませたかどうかをこのidでセーブに残す**ので変えないこと
 *   floor            : 起きる階
 *   afterSteps       : その階で何歩歩いたら起きるか（1 なら最初の1歩）
 *   onlyBeforeClear  : true なら、そのダンジョンをクリアした後は起きない
 *   enemy            : 相手の種族id。その階の出現表に同じ種族があれば、
 *                      倍率（statMultiplier）と行動の順番（actionPattern）もそこから引く
 *   bgm              : 戦闘の曲（data/audio.js の bgm）。省略でその穴のふつうの戦闘曲（data/regions.js の battleBgm）
 *   message          : 戦闘の始めの一言（data/messages.js の events のキー）
 *   allowFlee / allowScout : 逃げられるか・誘えるか（省略で可）
 *   keepItemsOnDefeat: true なら、負けても拾ったものを失わない
 *   ★ 起きた瞬間に「済ませた」印が付く。逃げても負けても、同じファイルでは二度と起きない
 *
 * ★ ダンジョンを増やすときは、このファイルに1エントリ足すだけでよい。
 *
 * ─────────────────────────────────────────────
 * ▼ 今後の方針（ステージをどう増やしていくか）
 *
 * 【第1段階】1〜4ステージ目までは一本道。すべて同じ地方 "cradle"（揺籃の穴）に置く。
 *   前のステージをクリアすると次が開く、という今の形をそのまま伸ばす。
 *   モンスターもこのファイルと data/monsters.js にまとめて書く。
 *   （もとは5ステージの予定だったが、4に短縮して地方解放を早めることにした）
 *
 * 【第2段階】4ステージ目をクリアすると「地方選択」が開く。ここで自由度が大きく上がる。
 *   地方ごとに出るモンスター・強さ・難易度が変わり、いくつもの地方を並べて選べる。
 *   揺籃の穴とは別の穴が増えるので、そこで初めてファイルを分ける：
 *     data/dungeons/ には置かず、地方ごとに data/monsters_〇〇.js のように分割する。
 *     （1ファイルが大きくなりすぎるのを防ぐため。読み込みは app.html の配列に足すだけ）
 *
 * 【区切り】ここまでできたら v1.0.0（正式リリース）。
 *   4ステージ目の unlockedBy は今までどおり前のステージ、
 *   地方選択の解放条件は { region: "cradle" } で書ける（判定はもう入っている）。
 *
 * 【解放条件について】
 *   地方が並列になると「この地方を全部クリアしたら次の地方」という条件が要る。
 *   そのために unlockedBy は複数条件を書けるようにしてある（上の説明を参照）。
 *   判定は js/systems/DungeonCatalog.js の isUnlocked が行う。
 *
 * 【エンディング】
 *   いまは data/bosses.js の主が全員 isFinal: false で、エンディングは流れない。
 *   地方が増えたら「全地方クリアで最終地方が開く」形になる見込み。ここは保留中。
 * ─────────────────────────────────────────────
 */
(function (NS) {
  "use strict";

  /**
   * --- 蔦這う回廊の出現の表の1件ずつ（階ごとの表で使い回すので、先に置いておく） ---
   * 中身の説明は ivyCorridor の encounter のコメントを参照
   */
  // カゲヅタ（作者の指定 2026-10-21）：技を使う確率 55%・PP ×1.25。
  // 経験値・ゴールドは ×1.5（2026-10-27 作者の指定。種族の 22 / 9 は揺籃の穴の値のままで、回廊のほかの種族の約半分だったため）
  var IVY_KAGE = { species: "kageZuta", weight: 0.6,
    skills: ["sapStrength", "cure", "slowDance", "darkNebula"],
    skillRate: 0.55,
    statMultiplier: { pp: 1.25 },
    rewardMultiplier: 1.5 };
  // ヌマボネ（作者の指定 2026-10-21）：サイレス・不吉な舞を 35%
  var IVY_BONE = { species: "marshBone", weight: 0.7,
    skills: ["sealSong", "curseSong"],
    skillRate: 0.35 };
  // コケキノコ（作者の指定 2026-10-21）：しびれ粉 60%・堅守の陣 40%、技を使う確率 30%
  var IVY_MOSS = { species: "mossShroom", weight: 0.6,
    skills: ["numbPowder", "fortressForm"],
    skillWeights: { numbPowder: 0.6, fortressForm: 0.4 },
    skillRate: 0.3 };
  // ツリガネ（作者の指定 2026-10-22）：デス 80%・ゲイル 20%、技を使う確率 40%。重み 0.4。1体だけの戦いにはしない
  var IVY_BELL = { species: "tsurigane", weight: 0.4,
    skills: ["death", "gale"],
    skillWeights: { death: 0.8, gale: 0.2 },
    skillRate: 0.4 };
  // ザンガルド（作者の指定 2026-10-26）：技を使う確率 50%。そのうち稲妻斬り 75%・必ずクリティカルの通常攻撃 25%。重み 0.35。
  // 二連斬りは使わせない（仲間のときだけ）。criticalAttack は技ではなく「必ずクリティカルの通常攻撃」の選択肢
  // （skillWeights にだけ書く。BattleSystem._chooseEnemyAction）
  // ★ PP が尽きて稲妻斬りを撃てなくなったら、毎手番「必ずクリティカルの通常攻撃」だけになる
  //   （作者の指定 2026-10-27。そこまで長引く戦いはまず無いので、長引かせた側への罰。BattleSystem._outOfSkills）
  var IVY_ZAN = { species: "thunderDragon", weight: 0.35,
    skills: ["thunderSlash"],
    skillWeights: { thunderSlash: 75, criticalAttack: 25 },
    skillRate: 0.5 };
  /**
   * シニガミ（作者の指定 2026-10-21）。深い階ほど出やすい（重み 1階0.067 → 4階0.167。最初の 0.1〜0.25 の 2/3）。
   *   solo        … 出たら1体だけの戦い（ヨミリュウと同じ）
   *   Lv1 固定    … どのレベル帯でも同じ能力（種族の上限も Lv1）。経験値266・ゴールド166 そのまま
   *   行動        … 死神の鎌 80%・死の踊り 15%・通常攻撃 5%（技を使う確率 95% を 80:15 に分ける）
   *   infinitePp  … 敵のあいだ PP が減らない
   *   effects     … 敵のあいだだけ耐性を上乗せ（種族の +5 に足して、全属性 +9・全状態異常 +10）
   */
  /** 回廊の表の1件を、重みだけ変えて複製する（階ごとに出やすさを変えるため。技などの中身はそのまま） */
  function ivyAt(entry, weight) {
    var copy = {};
    for (var key in entry) {
      if (Object.prototype.hasOwnProperty.call(entry, key)) copy[key] = entry[key];
    }
    copy.weight = weight;
    return copy;
  }
  function ivyReaper(weight) {
    return { species: "shinigami", weight: weight, solo: true, minLevel: 1, maxLevel: 1,
      skills: ["deathScythe", "deathDance"],
      skillWeights: { deathScythe: 80, deathDance: 15 },
      skillRate: 0.95,
      infinitePp: true,
      effects: [
        { type: "resistBonus", element: "all", value: 4 },
        { type: "resistBonus", status: "all", value: 5 }
      ] };
  }

  /**
   * --- 千年樹の根底の出現の表の1件ずつ（v1.3.0。2026-11-04） ---
   * 4種とも敵のときの動きは作者が決めた。階ごとの重み（下の perFloor）は私の案。
   *   コハクカブト … 技を使う確率 40%。ブレイブ 50%・シールド 30%・堅守の陣 20%（作者 2026-11-06）
   *   ジュエキスライム … 技を使う確率 60%。キュアラ・足止めの舞・あわ。回復は仲間のHPが6割を切ってから（作者 2026-11-11）
   *   ウェポン … 技を使う確率 55%。作戦「全力で攻める」と同じ決め方で、火水風地の斬撃からいちばんダメージの出るものを選ぶ（作者 2026-11-05）
   *   ジュエル … ほかの敵といっしょにも、2体でも出る。毎手番 25% で逃げる。能力値はどの階でも Lv30 の表の値に固定。
   *              そこに HP は1体ずつ ×0.3〜0.5、防御 ×5、素早さ ×5。技はロックスパイクを 40%。
   *              状態異常と弱体はどれも効かない（全属性 10 は種族の値のまま）。どれも仲間にすると外れる（作者 2026-11-05）
   */
  var ROOT_BEETLE = { species: "amberBeetle", weight: 0.3,
    skills: ["fightSong", "guardSong", "fortressForm"],
    skillWeights: { fightSong: 0.5, guardSong: 0.3, fortressForm: 0.2 },
    skillRate: 0.4 };
  var ROOT_SAP = { species: "sapSlime", weight: 0.3,
    skills: ["greaterCure", "slowDance", "bubble"],
    skillRate: 0.6 };
  var ROOT_WEAPON = { species: "weaponBot", weight: 0.3,
    skills: ["flameSlash", "flowSlash", "galeSlash", "rockSlash"],
    skillRate: 0.55,
    tactic: "attack" };
  function rootJewel(weight) {
    return { species: "jewelOre", weight: weight,
      fleeRate: 0.25,
      fixedStatLevel: 30,
      statMultiplier: { hp: { min: 0.3, max: 0.5 }, defense: 5, speed: 5 },
      skills: ["rockSpike"],
      skillRate: 0.4,
      debuffResist: 10,
      effects: [
        { type: "resistBonus", status: "all", value: 10 }
      ] };
  }

  NS.rawData.dungeons = {
    mossyMine: {
      id: "mossyMine",
      order: 1,
      region: "cradle",
      name: "苔むす坑道",
      theme: "mine",
      subtitle: "深淵への入口。浅く、なだらか。",
      description: "かつて誰かが掘った古い坑道。\n" +
                   "壁は苔に覆われ、おとなしいモンスターが住み着いている。\n" +
                   "深淵へ降りる者は、まずここを通る。",
      floors: 3,
      recommendedLevel: 5,
      unlockedBy: null,
      generation: { width: 25, height: 18, roomMin: 3, roomMax: 7, roomCount: 8, attempts: 200 },
      encounter: {
        rate: 0.08,
        groupSize: { min: 1, max: 1 },
        levelRange: { min: 1, max: 1 },
        table: [
          { species: "slime",   weight: 1.0 },
          { species: "batty",   weight: 0.8 },
          { species: "mossRat", weight: 0.9 },
          { species: "rocky",   weight: 0.6 },
          { species: "glowBug", weight: 0.7 },
          { species: "sporin",  weight: 0.6 }
        ],
        // 深く潜るほど強い個体が増える
        perFloor: {
          "1": { levelRange: { min: 1, max: 1 }, groupSize: { min: 1, max: 1 } },
          "2": { levelRange: { min: 1, max: 3 }, groupSize: { min: 1, max: 1 } },
          "3": { levelRange: { min: 2, max: 4 }, groupSize: { min: 1, max: 2 } }
        }
      },
      // 坑道の宝箱。倒して集めるのと同じ素材が、探索でも手に入る
      featureTables: {
        chest: [
          { item: "oreShard", weight: 0.50, min: 1, max: 2 },
          { item: "glowDust", weight: 0.35, min: 1, max: 1 }
        ]
      },
      boss: "mineKeeper"
    },

    scorchingFissure: {
      id: "scorchingFissure",
      order: 2,
      region: "cradle",
      name: "灼熱の亀裂",
      theme: "ember",
      subtitle: "熱気が立ちのぼる裂け目。火のモンスターが多い。",
      description: "地の底から熱を吹き上げる大きな裂け目。\n" +
                   "炎をまとうモンスターが群れており、火に弱い者には厳しい。\n" +
                   "道は狭く入り組んでいる。",
      floors: 4,
      recommendedLevel: 9,
      unlockedBy: "mossyMine",
      generation: { width: 25, height: 18, roomMin: 3, roomMax: 5, roomCount: 10, attempts: 220 },
      encounter: {
        rate: 0.10,
        groupSize: { min: 1, max: 2 },
        levelRange: { min: 4, max: 8 },
        // 在来種だけが出る。コウモリとスライムは坑道のモンスターなので、ここには出さない。
        // 弱いものほど重みを大きくして、雑魚が多く・壁役がたまに出るようにしてある
        // 重みの合計が 4.0 なので、そのまま割合になる
        //   スミビ 22.5% / フレイミン 22.5% / ハイバネ 20% / ヒビイワ 17.5% / マグマガニ 17.5%
        table: [
          { species: "cinderling", weight: 0.9 },
          { species: "flamin",     weight: 0.9 },
          { species: "ashWing",    weight: 0.8 },
          { species: "crackRock",  weight: 0.7 },
          { species: "magmaCrab",  weight: 0.7 }
        ],
        // 上2階は浅場、下2階でレベルも数も一段上がる
        perFloor: {
          "1": { levelRange: { min: 4, max: 8 },  groupSize: { min: 1, max: 2 } },
          "2": { levelRange: { min: 4, max: 8 },  groupSize: { min: 1, max: 2 } },
          "3": { levelRange: { min: 5, max: 10 }, groupSize: { min: 2, max: 3 } },
          "4": { levelRange: { min: 5, max: 10 }, groupSize: { min: 2, max: 3 } }
        }
      },
      // 亀裂の宝箱。焼けた殻はいちばん出にくいマグマガニの素材なので、ここでも渋くしてある。
      // 鉱石のかけらはヒビイワとマグマガニも落とすので、この階でも拾える
      featureTables: {
        chest: [
          { item: "emberAsh",      weight: 0.45, min: 1, max: 2 },
          { item: "ashFeather",    weight: 0.35, min: 1, max: 1 },
          { item: "oreShard",      weight: 0.30, min: 1, max: 2 },
          { item: "scorchedShell", weight: 0.25, min: 1, max: 1 }
        ]
      },
      boss: "blazeBeast"
    },

    silentDepths: {
      id: "silentDepths",
      order: 3,
      region: "cradle",
      name: "静寂の深層",
      theme: "depths",
      subtitle: "音の絶えた最深部。深層の主が待つ。",
      description: "物音ひとつしない、深淵のいちばん底。\n" +
                   "ここまで潜った者だけが、その主と対峙できる。",
      // 5階だと一本道が長すぎたので4階に短縮した（亀裂と同じ深さ）
      floors: 4,
      recommendedLevel: 13,
      unlockedBy: "scorchingFissure",
      generation: { width: 25, height: 18, roomMin: 4, roomMax: 8, roomCount: 7, attempts: 200 },
      // 推奨レベルは16。敵はそれより少し下に置いて、育ててから来る場所にしてある
      encounter: {
        rate: 0.09,
        groupSize: { min: 2, max: 3 },
        levelRange: { min: 10, max: 15 },
        // 在来種だけが出る。コウモリ・スライムは坑道、フレイミンは亀裂のモンスターなので、
        // 深層には残していない（灼熱の亀裂と同じ考え方）
        //
        // ★ この表は上2階（B1F・B2F）ぶん。下2階は perFloor で表ごと差し替える。
        //   重みの合計を 1.00 にしてあるので、数字がそのまま出現率になる
        table: [
          { species: "murkling", weight: 0.33 },
          { species: "kageZuta", weight: 0.27 },
          { species: "puddling", weight: 0.23 },
          { species: "boltBug",  weight: 0.17 }
        ],
        // 上2階は軽く、降りるほど数とレベルが上がる。
        // B4Fだけ下限が13なので、主の前で必ず一段重くなる
        perFloor: {
          "1": { levelRange: { min: 10, max: 13 }, groupSize: { min: 1, max: 2 } },
          "2": { levelRange: { min: 10, max: 13 }, groupSize: { min: 1, max: 2 } },
          // B3Fはビリムシが一気に増える。雷持ちが多い階として、
          // ここを抜けるのに雷耐性が要るようにしてある
          "3": {
            levelRange: { min: 10, max: 15 },
            groupSize: { min: 2, max: 2 },
            table: [
              { species: "murkling", weight: 0.27 },
              { species: "kageZuta", weight: 0.25 },
              { species: "puddling", weight: 0.22 },
              { species: "boltBug",  weight: 0.26 }
            ]
          },
          // B4Fだけ体数を重み付きにしてある。
          // 均等（1〜3体）だと3体が33%も出て、主の直前が重くなりすぎるため。
          //
          // 竜はこの階にしか出ない。最深部の門番という位置づけで、
          // 在来種4種を少しずつ削って16%ぶんの枠を作っている
          "4": {
            levelRange: { min: 13, max: 15 },
            groupSize: [
              { count: 1, weight: 0.4 },
              { count: 2, weight: 0.4 },
              { count: 3, weight: 0.2 }
            ],
            table: [
              { species: "murkling",    weight: 0.24 },
              { species: "kageZuta",    weight: 0.22 },
              { species: "puddling",    weight: 0.20 },
              { species: "boltBug",     weight: 0.18 },
              // ★ 竜は「特殊な出方」をする。
              //   solo: true    … 引かれたら、その1体だけの戦いになる。
              //                   出会う確率は変わらず、変わるのは体数だけ。
              //                   竜＋雑魚2体は推奨レベル16で勝率33%、竜2体は13%だった。
              //                   単体なら97%なので、そこだけを外している。
              //   statMultiplier … 単体でしか出ないぶん、1体としては手強くする。
              //                    HP・攻撃・守りを揃えて上げてある（門番としての格）。
              //   actionPattern … 主と同じ「決まった順番」で動く。
              //                   闇の息（全体）→ 噛みつく → 通常攻撃 の3手で一巡。
              //                   読めれば「息の番だけ守る」という戦い方ができる。
              //   ※ statMultiplier も actionPattern も、仲間にすると外れる
              { species: "abyssDragon", weight: 0.16,
                solo: true,
                statMultiplier: { hp: 2.25, attack: 1.25, defense: 1.25 },
                actionPattern: ["abyssBreath", "bite", "normalAttack"] }
            ]
          }
        }
      },
      /**
       * 一度きりの出来事（書き方は上の説明の events を参照）。
       *
       * ★ ヨミリュウの待ち伏せ（ストーリー構成.md の 6「揺籃の穴」）。
       *   入門の穴にいるはずのない竜に、初めて地下4階へ来たとき必ず出会う。
       *   負けることを想定した「負けイベント」に近い位置づけだが、勝つこともできる。
       *   強さは上の表の竜と同じ（倍率・行動の順番を表から引くので、調整は1か所で済む）。
       *   負けたら、ふつうの全滅と同じく拾ったものを落とす
       *   （物語の場面8「持っていたはずの素材は、どこにもない」と合わせるため）。
       *   逃げること・誘うこともできる。
       *   この深層をクリアした後のセーブでは起きない。
       */
      events: [
        { id: "yomiryuAmbush", floor: 4, afterSteps: 1, onlyBeforeClear: true,
          enemy: "abyssDragon", bgm: "boss", message: "yomiryuAmbush",
          allowFlee: true, keepItemsOnDefeat: false }
      ],
      // 深層の宝箱。在来種を足すたびに、その素材をここにも並べる。
      // 深淵の欠片は宝箱1つの 8%（作者の表 2026-11-10。共通の中身 1.5 を含めた割合）。
      // 黄泉竜の鱗は宝箱から外した（作者の表 2026-11-10。ヨミリュウを倒して手に入れる）
      featureTables: {
        chest: [
          { item: "abyssFragment", weight: 0.245, min: 1, max: 1 },
          { item: "duskDew",       weight: 0.45, min: 1, max: 2 },
          { item: "twistedVine",   weight: 0.30, min: 1, max: 1 },
          { item: "stormWing",     weight: 0.22, min: 1, max: 1 },
          { item: "slimeShard",    weight: 0.35, min: 1, max: 2 }
        ]
      },
      boss: "abyssKing"
    },

    /**
     * 腐食の毒沼（ステージ4）。
     *
     * ★ ここが「毒」の場所。
     *   状態異常は毒だけをここで出す（麻痺・眠りなどはステージ5以降）。
     *   歩くだけで毒が削ってくるので、解毒草（深層クリアで店に並ぶ）が要る。
     *   ＝ 深層をクリアすると「薬が買えるようになる」と「毒の場所が開く」が同時に起きる。
     *
     * ★ 深層の主を倒すと、底が抜けてさらに下へ道が開ける、という位置づけ。
     *   「静寂の深層＝いちばん底」だったので、その先を出すための筋立て。
     *
     * ▼ 強さの合わせ方
     *   推奨Lv20。敵の上限は19で「推奨−1」にそろえてある（深層と同じ形）。
     *   在来種の基礎値はステージ3とほぼ同じ帯に置き、格はレベルと成長率で出している
     *   （data/monsters.js の在来種のコメントを参照）。
     */
    venomMarsh: {
      id: "venomMarsh",
      order: 4,
      region: "cradle",
      name: "腐食の毒沼",
      theme: "venom",
      subtitle: "底が抜けた先の沼。空気そのものが毒を含む。",
      description: "深層の主が沈んでいた、そのさらに下。\n" +
                   "底の抜けた先に、澱んだ沼が広がっている。\n" +
                   "空気そのものが毒を含み、立っているだけで蝕まれる。",
      // ★ 3階。亀裂・深層（4階）より短い。
      //   歩くだけで毒が削ってくる場所なので、長いと「削られに行くだけの階」が増える。
      //   そのぶん1階ごとの密度を上げてある（B2Fから2体、B3Fは主の直前）。
      //   加護は1階降りるごとなので、ここで選べるのは2回（深層は3回）
      floors: 3,
      recommendedLevel: 17,
      unlockedBy: "silentDepths",
      // 沼なので、深層より部屋を大きく・数を少なくして「開けた場所」にする
      generation: { width: 25, height: 18, roomMin: 4, roomMax: 9, roomCount: 6, attempts: 200 },
      // 推奨レベルは20。敵はそれより少し下に置く（深層と同じ考え方）
      encounter: {
        rate: 0.09,
        groupSize: { min: 2, max: 3 },
        levelRange: { min: 14, max: 19 },
        // 在来種だけが出る。深層のモンスター（ヨドミ・カゲヅタなど）はここには残していない。
        // 重みの合計を 1.00 にしてあるので、数字がそのまま出現率になる
        //   ドクバチ 42% / ドロガメ 33% / ヌマボネ 25%
        table: [
          { species: "venomBee",  weight: 0.42 },
          { species: "mudTurtle", weight: 0.33 },
          { species: "marshBone", weight: 0.25 }
        ],
        // 3階しかないので、階ごとの役割をはっきり分けてある
        perFloor: {
          // 浅場。軽く当たって沼に慣れる階
          "1": { levelRange: { min: 14, max: 17 }, groupSize: { min: 1, max: 2 } },
          // ドロガメが増える。壁役が2体並ぶので、削り切る手段が要る階
          "2": {
            levelRange: { min: 14, max: 19 },
            groupSize: { min: 2, max: 2 },
            table: [
              { species: "venomBee",  weight: 0.36 },
              { species: "mudTurtle", weight: 0.40 },
              { species: "marshBone", weight: 0.24 }
            ]
          },
          // 主の直前。深層B4Fと同じく、体数を重み付きにして重くなりすぎないようにする
          "3": {
            levelRange: { min: 17, max: 19 },
            groupSize: [
              { count: 1, weight: 0.4 },
              { count: 2, weight: 0.4 },
              { count: 3, weight: 0.2 }
            ]
          }
        }
      },
      // 沼の宝箱。倒して集めるのと同じ素材が、探索でも手に入る。
      // 毒嚢（主のドロップ）は入れない —— 主を倒すこと自体に意味を残すため
      featureTables: {
        chest: [
          { item: "venomStinger", weight: 0.40, min: 1, max: 2 },
          { item: "rustedBone",   weight: 0.32, min: 1, max: 1 },
          { item: "muddyShell",   weight: 0.26, min: 1, max: 1 },
          // 解毒草は沼の中でこそ要る。買い忘れても拾える逃げ道として置いてある
          { item: "antidote",     weight: 0.30, min: 1, max: 1 }
        ]
      },
      boss: "swampLord"
    },

    /**
     * ─────────────────────────────────────────────
     * 萌芽の穴（2つ目の地方。v1.0.0）
     *
     * 区画の名前と数は作者が決めたもの（2026-10-05）。揺籃の穴の主を4体記録すると穴が開く（data/regions.js）。
     * 階の大きさは 40×28（画面の約1.6×1.5枚。地図が主人公に合わせて動く）。
     *
     * ★ 区画は3つ（若葉の洞・蔦這う回廊・千年樹の根底）。3つとも開いている（根底は 2026-11-11）。
     *   新しい区画を足すときは ready: false で置き、中身（encounter・boss・featureTables・subtitle・description）を
     *   書いたら ready の行を消す（主なしの区画は boss を書かない）。ready: false の区画は名前だけ出て「準備中」と出る
     * ★ 敵のレベル帯は Lv21〜31。推奨レベルは 22・25・30（作者「30くらいに抑えたい」2026-10-05）。どれも4階
     * ─────────────────────────────────────────────
     */
    sproutHollow: {
      id: "sproutHollow",
      order: 5,
      region: "houga",
      name: "若葉の洞",
      // 一言と説明は作者から「おまかせ」（2026-10-09）で私が書いたもの。差し替えてよい
      subtitle: "若葉に覆われた洞。甘い花粉が眠りを誘う。",
      description: "萌芽の穴に入ってすぐの、若葉に覆われた洞。\n" +
                   "柔らかな緑の奥で、芽吹いたばかりの命がひしめいている。\n" +
                   "甘い花粉の香りに気を許せば、そのまま眠りに落ちる。",
      floors: 4,
      recommendedLevel: 22,
      unlockedBy: null,          // 穴が開いた時点で挑める（穴の条件は regions.js）
      theme: "houga",
      generation: { width: 40, height: 28, roomMin: 4, roomMax: 9, roomCount: 13, attempts: 320 },
      // 階ごとのレベルと体数は作者が決めたもの（2026-10-09）。
      // 1歩あたりの遭遇率と種族の重みは仮（作者が見て調整する）
      encounter: {
        // 階が揺籃の約2.5倍広く歩数が増えるので、揺籃（0.08〜0.10）より少し下げてある
        rate: 0.07,
        groupSize: { min: 1, max: 3 },
        levelRange: { min: 22, max: 25 },
        // 種族の重みは monsters.js の spawnRate（1.0/1.0/0.8/0.7/0.25）の比のまま。
        // 合計を 1.00 にしてあるので、数字がそのまま出現率になる
        //   フタバムシ 27% / ユラツボミ 27% / ワカバドリ 21% / コケガメ 18% / コダマ 7%（珍しい）
        table: [
          { species: "futabaMushi", weight: 0.27 },
          { species: "yuraTsubomi", weight: 0.27 },
          { species: "wakabaDori",  weight: 0.21 },
          { species: "kokeGame",    weight: 0.18 },
          { species: "kodama",      weight: 0.07 }
        ],
        perFloor: {
          "1": { levelRange: { min: 21, max: 23 } },
          "2": { levelRange: { min: 22, max: 25 } },
          "3": { levelRange: { min: 22, max: 25 } },
          "4": { levelRange: { min: 24, max: 25 } }
        }
      },
      // 1階に置く仕掛けの数（作者の依頼で宝箱を増やした 2026-10-14）。
      // 階が揺籃の約2.5倍広いので、宝箱は既定（1〜2個）の倍ほど。泉と罠は既定のまま（作者の指定「いつもどおり」）。
      // ★ ここに書くと既定（data/dungeon.js の featureCounts）と丸ごと入れ替わるので、泉と罠も書いておく
      features: {
        chest:  { min: 3, max: 4 },
        spring: { min: 0, max: 1 },
        trap:   { min: 1, max: 2 }
      },
      // 洞の宝箱。倒して集めるのと同じ素材が、探索でも手に入る。
      // 若木の心材（主のドロップ）は入れない —— 主を倒すこと自体に意味を残すため。
      // 芽吹きの種はコダマ（珍しい）の素材なので渋くしてある（深層の黄泉竜の鱗と同じ扱い）。
      // 回復の道具は共通の中身（薬草・精気の実・回復薬）に、深淵の雫を足してある
      // （敵が Lv20 を超え、薬草の20回復では追いつかなくなるため）
      featureTables: {
        chest: [
          { item: "shedHusk",    weight: 0.40, min: 1, max: 2 },
          { item: "sleepPollen", weight: 0.32, min: 1, max: 1 },
          { item: "leafFeather", weight: 0.30, min: 1, max: 1 },
          { item: "mossyShell",  weight: 0.26, min: 1, max: 1 },
          { item: "sproutSeed",  weight: 0.10, min: 1, max: 1 },
          { item: "elixir",      weight: 0.12, min: 1, max: 1 }
        ]
      },
      // 主（v1.0.0。強さと行動は作者が決めたもの。data/bosses.js）
      boss: "hollowLord"
    },

    ivyCorridor: {
      id: "ivyCorridor",
      order: 6,
      region: "houga",
      name: "蔦這う回廊",
      // 一言と説明は作者から「おまかせ」（2026-10-27）で私が書いたもの。差し替えてよい
      subtitle: "光の届かない回廊。蔦が足を、声を絡め取る。",
      // 1行は句読点こみで20文字まで（詳細欄の幅。超えると途中で折り返す）
      description: "若葉の洞の奥へ続く、光の届かない回廊。\n" +
                   "壁も天井も蔦に覆われ、闇から伸びるものが\n" +
                   "足を、声を、ときには命さえも絡め取る。",
      floors: 4,
      recommendedLevel: 25,
      unlockedBy: "sproutHollow",
      theme: "ivy",
      generation: { width: 40, height: 28, roomMin: 3, roomMax: 7, roomCount: 15, attempts: 340 },
      /**
       * コンセプト：光の届かない、絡みつく通路。敵が足止め・しびれ・封印・呪いなど「動きを奪う」技を初めて使う（2026-10-21）。
       * 出るモンスター：カゲヅタ・ヌマボネ（既存）／コケキノコ（キノコンの亜種）／
       * ツリガネ（即死の共鳴）／ザンガルド（剣を携えた雷の竜）／シニガミ（珍しい・初見殺し）。
       * ★ 主はいない（作者 2026-10-27）。最深階（B4F）の階段が出口で、抜けるとクリア（boss を書かない）。
       * ★ 2026-10-28 に ready の行を消して遊べるようにした（v1.1.0 の締め。作者の指定）
       */
      encounter: {
        rate: 0.07,
        groupSize: { min: 1, max: 3 },
        // 敵のレベルは Lv24〜27（作者 2026-10-21）。階ごとの分け方は下の perFloor（作者から任された 2026-10-27）
        levelRange: { min: 24, max: 27 },
        // 種族ごとの役（重みは perFloor に階ごとに書いてある）
        //   カゲヅタ：ちからぬき・足止めの舞で弱らせ、キュアで癒やし、ダークネビュラで全体を削る（技55%・PP ×1.25）
        //   ヌマボネ：サイレス（封印）と不吉な舞（全体に呪い）を35%。呪いは受けるダメージ ×1.3 なので、
        //             不吉な舞 → 高い攻撃（Lv24〜27 で48〜55）の通常攻撃がつながる
        //   コケキノコ：しびれ粉（全体に麻痺45%）60%・堅守の陣 40%、技30%。堅守の陣が掛かっているあいだはしびれ粉だけ
        //   ツリガネ：デス（1体に即死35%）80%・ゲイル 20%、技40%。即死の耐性が無い仲間は、運が悪いと一撃で倒れる
        //   ザンガルド：技50%。稲妻斬り 75%・必ずクリティカルの通常攻撃 25%（1手番あたり 37.5% / 12.5%）
        //   中身は このファイルの頭の IVY_KAGE / IVY_BONE / IVY_MOSS / IVY_BELL / IVY_ZAN / ivyReaper（どれも仲間にすると外れる）
        table: [ IVY_KAGE, IVY_BONE, IVY_MOSS, IVY_BELL, IVY_ZAN ],
        /**
         * 階ごとの出方（作者が決めたもの 2026-10-28。前日の私の案を作者が直した）。
         * 重みは作者の表の % をそのまま書いてある（1体ぶんの枠でその種族が選ばれる割合）。
         *   浅い階は、弱らせる・縛る相手（カゲヅタ・ヌマボネ・コケキノコ）で「動きを奪われる」に慣れる。
         *   深い階ほど、即死のツリガネと一撃の重いザンガルドが増え、体数も増える。
         * シニガミは階ごとの表にだけ入る（深い階ほど出やすい。作者の指定 2026-10-21）。
         *
         *   階   Lv     体数（1/2/3体）   カゲヅタ ヌマボネ コケキノコ ツリガネ ザンガルド シニガミ
         *   B1F 24〜25  50/50/ 0%         30%     30%     20%       8%       8%        4%
         *   B2F 24〜26  30/50/20%         25%     25%     15%      15%      15%        5%
         *   B3F 25〜27  20/50/30%         20%     20%     23%      15%      17%        5%
         *   B4F 26〜27  20/40/40%         16%     12%     15%      20%      29%        7%
         *   ★ B4F は 2026-10-28 に作者が直した（カゲヅタ +1・ザンガルド +4・シニガミ -1）。合計 99% なので、実際は 99 で割った割合
         *     （重みは相対なので、ほぼ表のまま）
         *   （1回の戦闘で会う割合は README の表）
         */
        perFloor: {
          "1": {
            levelRange: { min: 24, max: 25 },
            groupSize: [ { count: 1, weight: 0.5 }, { count: 2, weight: 0.5 } ],
            table: [ ivyAt(IVY_KAGE, 0.30), ivyAt(IVY_BONE, 0.30), ivyAt(IVY_MOSS, 0.20),
                     ivyAt(IVY_BELL, 0.08), ivyAt(IVY_ZAN, 0.08), ivyReaper(0.04) ]
          },
          "2": {
            levelRange: { min: 24, max: 26 },
            groupSize: [ { count: 1, weight: 0.3 }, { count: 2, weight: 0.5 }, { count: 3, weight: 0.2 } ],
            table: [ ivyAt(IVY_KAGE, 0.25), ivyAt(IVY_BONE, 0.25), ivyAt(IVY_MOSS, 0.15),
                     ivyAt(IVY_BELL, 0.15), ivyAt(IVY_ZAN, 0.15), ivyReaper(0.05) ]
          },
          "3": {
            levelRange: { min: 25, max: 27 },
            groupSize: [ { count: 1, weight: 0.2 }, { count: 2, weight: 0.5 }, { count: 3, weight: 0.3 } ],
            table: [ ivyAt(IVY_KAGE, 0.20), ivyAt(IVY_BONE, 0.20), ivyAt(IVY_MOSS, 0.23),
                     ivyAt(IVY_BELL, 0.15), ivyAt(IVY_ZAN, 0.17), ivyReaper(0.05) ]
          },
          "4": {
            levelRange: { min: 26, max: 27 },
            groupSize: [ { count: 1, weight: 0.2 }, { count: 2, weight: 0.4 }, { count: 3, weight: 0.4 } ],
            table: [ ivyAt(IVY_KAGE, 0.16), ivyAt(IVY_BONE, 0.12), ivyAt(IVY_MOSS, 0.15),
                     ivyAt(IVY_BELL, 0.20), ivyAt(IVY_ZAN, 0.29), ivyReaper(0.07) ]
          }
        }
      },
      // 1階に置く仕掛けの数。宝箱は 4〜5（作者の指定 2026-11-01。灯り苔・絡み主根が宝箱だけで、集まりにくかった）
      // （★ ここに書くと既定と丸ごと入れ替わるので、泉と罠も書いておく）
      features: {
        chest:  { min: 4, max: 5 },
        spring: { min: 0, max: 1 },
        trap:   { min: 1, max: 2 }
      },
      // 回廊の宝箱（作者の指定 2026-10-27「このステージの素材を出す」）。
      // 灯り苔・絡み主根は宝箱でしか手に入らない回廊の素材。
      //   灯り苔はほかの素材の倍の重み（作者の指定 2026-11-01。宝箱1つで約15%）。
      //   絡み主根は B4F だけ（minFloor: 4。FeatureSystem）で宝箱1つの 5%（作者の表 2026-11-10）。
      //   そのほかに B4F には 60% で、絡み主根が1つ入った宝箱が置かれる（下の fixedChests）
      // 深淵の欠片は宝箱1つの 3%（作者の表 2026-11-10）。
      // 金角のかけらは宝箱から外した（作者の表 2026-11-10。ザンガルドの珍しいドロップだけ）。
      // 髑髏の護符・弔いの小鐘・神鳥の羽は装備・貴重品なので入れない
      featureTables: {
        chest: [
          { item: "twistedVine",      weight: 0.30, min: 1, max: 2 },
          { item: "rustedBone",       weight: 0.28, min: 1, max: 1 },
          { item: "mossSpore",        weight: 0.28, min: 1, max: 2 },
          { item: "windChimeFeather", weight: 0.28, min: 1, max: 1 },
          { item: "blueThunderScale", weight: 0.26, min: 1, max: 1 },
          { item: "glowMoss",         weight: 0.56, min: 1, max: 2 },
          { item: "abyssFragment",    weight: 0.11, min: 1, max: 1 },
          // 重み 0.195 で B4F の宝箱の 5%
          { item: "tangledTaproot",   weight: 0.195, min: 1, max: 1, minFloor: 4 },
          { item: "elixir",           weight: 0.12, min: 1, max: 1 }
        ]
      },
      // 中身の決まった宝箱（作者の指定 2026-11-01）。B4F に、絡み主根が1つ入った宝箱を置く。
      // chance … 置かれる確率（作者の表 2026-11-10 で 60%。それまでは必ず置いていた）。
      // 上の features の数とは別に置かれる（置かれた階は B4F の宝箱が 5〜6 個になる）
      fixedChests: [
        { floor: 4, item: "tangledTaproot", count: 1, chance: 0.6 }
      ],
      // 区画ごとの落とすもの（DropSystem.dropsIn。作者の表 2026-11-10）。
      // ヌマボネは毒沼（data/monsters.js の drops）と確率を変えてある
      dropOverrides: {
        marshBone: [
          { item: "rustedBone",    rate: 0.32, min: 1, max: 1 },
          { item: "abyssFragment", rate: 0.15, min: 1, max: 1 },
          { item: "boneCharm",     rate: 0.15, min: 1, max: 1 }
        ]
      }
    },

    /**
     * 千年樹の根底（萌芽の穴の最後の区画。v1.3.0 で入れる。区画を3つにしたのは v1.2.1）。
     * ★ 萌芽の穴の区画は3つ（作者 2026-10-30）。3つ目だった「胞子煙る菌床」はなくし、蔦這う回廊の次がここになった。
     *   見た目の組 spore（data/dungeonThemes.js）と、きのこの飾りの絵は使わずに残してある。
     * ★ 主がいる（作者 2026-10-30）。主は下のカラクリモリ。
     *   作者が決めた値（2026-11-01）：Lv32・主のとき HP1050 攻135 防65 速40・PP無限（infinitePp）・
     *   1ターンに1〜2回動く（actionsPerTurn）・仲間にできる・落とすものは私に任された（琥珀の芯を案として入れた）・
     *   効かない状態異常は毒と麻痺（immuneToStatus: ["poison", "paralysis"]。全主共通の即死・封印・盲目も効かない。眠り・呪いは効く）
     * モチーフ（作者 2026-11-01）：琥珀と樹液（千年の時）＋千年樹の番人＋機械のモンスター。
     * 在来種（作者 2026-11-04）：4種・4階・Lv28〜31。ウェポン・ジュエル・コハクカブト・ジュエキスライム（data/monsters.js。4種とも作者が確定）。
     * 主（作者 2026-11-03）：大きなからくり（木と真鍮・根が絡む・胸に琥珀の芯）。雷・弱点は地・特性は放電。
     *   「最序盤最後のヌシなだけあってかなり強めにしたい」。行動の順番・専用技 歯車投げも作者が決めた。
     *   名前「カラクリモリ」は作者が確定（2026-11-10。data/bosses.js の rootsWarden・monsters.js の gearWarden）
     * 推奨Lv 30（作者の予定は「推奨は30くらいに抑えたい」）。
     * ★ 2026-11-11 に ready の行を消して遊べるようにした（作者の指定）。一言・説明・素材・琥珀の芯は私の案を作者がそのまま確定
     */
    ancientRoots: {
      id: "ancientRoots",
      order: 7,
      region: "houga",
      name: "千年樹の根底",
      // 一言と説明は私の案を作者が確定（2026-11-11）。1行は句読点こみで20文字まで
      subtitle: "止まった時の底で、番人が根を守る。",
      description: "千年樹の根が張りめぐらされた、穴の底。\n" +
                   "琥珀の中で時は止まり、古いからくりが\n" +
                   "いまも根を守り続けている。",
      floors: 4,
      recommendedLevel: 30,
      unlockedBy: "ivyCorridor",
      theme: "rootdeep",
      generation: { width: 40, height: 28, roomMin: 4, roomMax: 10, roomCount: 11, attempts: 320 },
      /**
       * 階ごとの出方（私の案を作者が了承 2026-11-11。ジュエルは出る割合 3〜5%）。
       *   階   Lv     体数（1/2/3体）   甲虫 スライム ウェポン ジュエル
       *   B1F 28〜29  50/50/ 0%         45%   45%      7%      3%
       *   B2F 28〜30  30/50/20%         33%   33%     30%      4%
       *   B3F 29〜30  20/50/30%         27%   27%     41%      5%
       *   B4F 30〜31  20/40/40%         22%   23%     50%      5%
       */
      encounter: {
        rate: 0.07,
        groupSize: { min: 1, max: 3 },
        levelRange: { min: 28, max: 31 },
        table: [ ROOT_BEETLE, ROOT_SAP, ROOT_WEAPON ],
        perFloor: {
          "1": {
            levelRange: { min: 28, max: 29 },
            groupSize: [ { count: 1, weight: 0.5 }, { count: 2, weight: 0.5 } ],
            table: [ ivyAt(ROOT_BEETLE, 0.45), ivyAt(ROOT_SAP, 0.45), ivyAt(ROOT_WEAPON, 0.07), rootJewel(0.03) ]
          },
          "2": {
            levelRange: { min: 28, max: 30 },
            groupSize: [ { count: 1, weight: 0.3 }, { count: 2, weight: 0.5 }, { count: 3, weight: 0.2 } ],
            table: [ ivyAt(ROOT_BEETLE, 0.33), ivyAt(ROOT_SAP, 0.33), ivyAt(ROOT_WEAPON, 0.30), rootJewel(0.04) ]
          },
          "3": {
            levelRange: { min: 29, max: 30 },
            groupSize: [ { count: 1, weight: 0.2 }, { count: 2, weight: 0.5 }, { count: 3, weight: 0.3 } ],
            table: [ ivyAt(ROOT_BEETLE, 0.27), ivyAt(ROOT_SAP, 0.27), ivyAt(ROOT_WEAPON, 0.41), rootJewel(0.05) ]
          },
          "4": {
            levelRange: { min: 30, max: 31 },
            groupSize: [ { count: 1, weight: 0.2 }, { count: 2, weight: 0.4 }, { count: 3, weight: 0.4 } ],
            table: [ ivyAt(ROOT_BEETLE, 0.22), ivyAt(ROOT_SAP, 0.23), ivyAt(ROOT_WEAPON, 0.50), rootJewel(0.05) ]
          }
        }
      },
      // 1階に置く仕掛けの数は回廊と同じ
      features: {
        chest:  { min: 4, max: 5 },
        spring: { min: 0, max: 1 },
        trap:   { min: 1, max: 2 }
      },
      featureTables: {
        chest: [
          { item: "amberShard",    weight: 0.30, min: 1, max: 2 },
          { item: "ancientSap",    weight: 0.30, min: 1, max: 2 },
          { item: "brassGear",     weight: 0.26, min: 1, max: 1 },
          { item: "glowMoss",      weight: 0.14, min: 1, max: 1 },
          // 深淵の欠片は宝箱1つの 3%。宝珠のかけらは宝箱から外した（作者の表 2026-11-10。ジュエルだけ）
          { item: "abyssFragment", weight: 0.082, min: 1, max: 1 },
          { item: "elixir",        weight: 0.15, min: 1, max: 1 }
        ]
      },
      // 主（v1.3.0。data/bosses.js）。B4F の階段で出る
      boss: "rootsWarden"
    }
  };
})(window.MyGame);
