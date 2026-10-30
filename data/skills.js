/**
 * skills.js
 * スキル（技）の定義。数値はすべてここで管理する。
 *
 * kind          : 技の種類（data/categories.js の skillKind）
 *                   resonance 共鳴 / breath ブレス / body 体技 / slash 斬撃 / dance 踊り
 *                 通常攻撃だけは書かない（どの種類にも入らない）。
 *                 種類で決まるもの：計算の係数（battle.js の damage.byKind）・
 *                 ブレスの「よけられない・クリティカルなし」（skillKind の rules）・封印で止まるか（共鳴だけ）
 * power         : 威力（0 なら通常攻撃と同じ計算になる）
 *                 ★ 斬撃（kind: "slash"）だけは「通常攻撃の基礎に掛ける倍率」（噛みつく＝1.15。2026-10-22 作者の指定）。
 *                   画面にもそのまま「威力 1.15」と出る。死神の鎌（踊りで damageKind が斬撃）は今までどおり威力の数
 *                 ★ ただし heal / modifier / status のどれかを持つ技は、威力0だと
 *                   「掛けるだけでダメージを与えない技」になる。
 *                   その技は図鑑・戦闘の説明に「威力」の行が出ない（BattleSystem.dealsDamage）
 * pp            : 使うのに必要なPP。0 なら何度でも使える
 * accuracy      : 命中率（0〜1）。書かなければ battle.js の defaultAccuracy（=100%）
 * criticalBonus : クリティカル率への上乗せ（書かなければ 0）
 * canCritical   : false と書くとクリティカルが出なくなる。
 *                 範囲全体の技はこれを付ける方針（1体ずつ判定すると、
 *                 運だけで一気に崩れる回ができてしまうため）。ブレスは書かなくても false
 * evadable      : false と書くと、相手の回避率（monsters.js の evasion）で
 *                 かわされなくなる。省略すると かわされる（ブレスは書かなくても false）
 * target        : 対象。次の3つが書ける
 *     "enemy"      … 相手を1体選ぶ
 *     "self"       … 自分。相手を選ばずに出せる
 *     "ally"       … 味方を1体選ぶ（自分も選べる）。回復役の技はこれ
 *     "allEnemies" … 向かい側の盤面にいる全員。宣言とPPの支払いは1回で、
 *                    命中判定とダメージは1体ずつ出す（避ける子・耐える子が出る）
 *     "allAllies"  … 自分の側の盤面にいる全員（自分も含む。v1.0.0 芽吹きの加護）。相手を選ばずに出せ、外れない。
 *                    書ける働きは modifier（全員に強化）と wardStatus（BattleSystem._performSkillOnAllies）
 *
 * wardStatus    : true で、状態異常を1回防ぐ守りを付ける（特性「芽吹き」と同じ守り）。
 *                 すでに守りがある者は付け直すだけ（重ならない）。戦闘が終わると消える。いまは使っている技が無い
 * drain         : 与えたダメージのうち、何割を自分のHPに戻すか（0〜1）。
 *                 書かなければ吸わない。威力を低くして釣り合いを取る
 * cureStatus    : 状態異常を治す技（クレンズ）。{ statuses: ["poison"] } のように書く
 *                 （道具の cureStatus と同じ決まり。statuses を省略すると curable のものを全部）。
 *                 治すものが無ければ「治すものがなかった」になる。探索中にも使える
 * ppDamage      : 相手のPPを減らす技（v1.0.0 ミステリーダンス）。{ min, max } の幅で減らす。PPが足りなければ残りぶんだけ
 * useMessage    : 技を出したときの文を差し替える（「{actor} は やくそうを 使った!」のように、技に見せたくないとき）
 * heal          : HPを回復する技。{ min, max } か { amount } を書く
 *                 ★ 攻撃力では変わらない固定値にすること。
 *                   攻撃力に比例させると、育てるほど回復量まで伸びて手がつけられなくなる
 * ▼ modifier : 一時的な強化・弱体（バフ／デバフ）。書かなければ何も掛からない
 *     duration : 何ターン続くか。かけたターンを含めて数える
 *     effects  : 掛かる効果。書き方は data/abilities.js の特性とまったく同じ
 *                （statMultiplier / statBonus / damageDealt / damageTaken）
 *     message  : かかったときの文（省略時は messages.js の modifierUp / modifierDown）
 *     popup    : 画面上部の札に出す言葉（省略時は「防御力上昇」のように、変わる能力から作る）
 *     effects には accuracyMultiplier（命中の倍率。盲目とは別）も書ける
 * cover         : true なら「立ち塞がる」。ターンの頭で（素早さに関係なく）出し、そのターン
 *                 向かい側からの攻撃をすべて自分が受ける（範囲全体の技も全員ぶん）。
 *                 受けるダメージを減らしたいときは modifier で damageTaken を掛ける（BattleSystem._applyCovers）
 *   威力（power）を持たない技は、掛けるだけでダメージを与えない。
 *   同じ技を重ねがけしても効果は重ならず、残りターン数が建て直されるだけ。
 *   戦闘が終わると全部消える。
 * ▼ status : 状態異常をあたえる。書き方は modifier と同じ考え方で1行だけ
 *     { id: "poison", chance: 0.6 }
 *   chance に相手の耐性（monsters.js の statusResist）が掛かって通りやすさが決まる。
 *   中身は data/statuses.js。威力も持つ技（どくばり）は、毒を入れたあとダメージへ進む。
 *   範囲技（allEnemies）では**1体ずつ判定する**ので、かかる子とかからない子が分かれる。
 * element       : 属性id（elements.js を参照）。"none" は耐性の影響を受けない
 * effect        : 当たったときの演出の型（data/effects.js の shapes のid）
 *                 省略すると演出なし。色は element から決まるので指定しない
 *                 （型の側に color が書いてあれば、そちらが優先。毒の息 miasma など）
 * effectAt      : "center" と書くと、演出を1体ずつではなく、並び全体の中心に1回だけ出す。
 *                 範囲技を「1回の息」に見せたいときに使う（どくのいき）
 * se            : 出した瞬間の音（data/audio.js の se のid）。省略で無音。
 *                 ★ se を書いた技は、当たったときの打撃／斬撃音を鳴らさない（技の音だけで完結）。
 *                 se の無い技は、effect の型（data/effects.js の hitSe）から打撃／斬撃が鳴る
 * hitSe         : 当たった音を自分で決めたいときだけ書く（"hit" / "slash" で鳴らす、null で止める）。ふつうは書かない
 * windupMs      : 技を出してから当たるまでの時間（ミリ秒）。溜めの長い専用の動きと、当たる瞬間をそろえるときだけ書く（死神の鎌）
 * damageKind    : ダメージの計算だけ、別の種類の式を使う（死神の鎌：踊りだが斬撃の式）
 * maxDamage     : 1回あたりのダメージの上限（二連斬り＝200。何回か当てる技は1回ずつに掛かる）。書かなければ上限なし
 * modifierSe    : 強化・弱体が掛かった瞬間の音を変えたいときだけ書く（null で鳴らさない。〇〇ベール）。
 *                 書かなければ buff / debuff が鳴る（BattleScene._playModifierSe）
 * description   : 技を選ぶときに出る説明文
 * fieldUse      : 探索中（戦闘の外）に、仲間画面の「技を使う」から使えるか。
 *                 ・威力を持つ技（攻撃の技）は、何を書いても使えない
 *                 ・HPを回復する技（heal）は、書かなくても使える（使わせたくないときは false）
 *                 ・それ以外の技は true と書いたものだけ（いまの仕組みで働くのは回復だけ）
 *                 判定は Game.isFieldSkill
 * showInDex     : false なら図鑑の「技」に載せない（省略すると載る）。
 *                 通常攻撃は覚える技ではなくコマンドなので、これで隠してある
 *
 * ★ 新しい技の追加は、このファイルに1エントリ足すだけでよい。
 *   演出も、型の名前を1行書くだけ（技ごとに絵を用意しない）。
 */
(function (NS) {
  "use strict";

  NS.rawData.skills = {
    // 「攻撃」コマンドで使う通常攻撃。PPを使わないので何度でも出せる
    normalAttack: {
      id: "normalAttack",
      name: "攻撃",
      power: 0,
      pp: 0,
      target: "enemy",
      element: "none",
      effect: "impact",
      // 覚える技ではなくコマンドなので、図鑑には載せない
      showInDex: false,
      description: "PPを使わない基本の攻撃。いつでも出せる。"
    },

    tackle: {
      id: "tackle",
      name: "体当たり",
      kind: "body",
      // α-10 で 10 → 7。最序盤に通常攻撃の7倍出ていたため（通常攻撃にも威力3を足した。data/battle.js）
      power: 7,
      pp: 1,
      accuracy: 1.0,
      target: "enemy",
      element: "none",
      effect: "impact",
      description: "体ごとぶつかる。消費が軽く、必ず当たる。"
    },

    bite: {
      id: "bite",
      name: "噛みつく",
      kind: "slash",
      // 斬撃なので倍率（通常攻撃の基礎 ×1.15）。2026-10-22 に威力15 から（作者）
      power: 1.15,
      pp: 2,
      accuracy: 0.9,
      criticalBonus: 0.15,
      target: "enemy",
      element: "none",
      effect: "slash",
      description: "鋭くかみつく。クリティカルが出やすいが、やや外れやすい。"
    },

    // 各属性の基本技。威力15 / PP2 / 命中100% でそろえてある
    ember: {
      id: "ember",
      name: "ファイア",
      kind: "resonance",
      power: 15,
      pp: 2,
      accuracy: 1.0,
      target: "enemy",
      element: "fire",
      effect: "burst",
      se: "fire",
      description: "小さな炎を放つ。火に弱い相手によく効く。"
    },

    rockThrow: {
      id: "rockThrow",
      name: "ストーン",
      kind: "resonance",
      power: 15,
      pp: 2,
      accuracy: 1.0,
      target: "enemy",
      element: "earth",
      effect: "shards",
      se: "earth",
      description: "石を投げつける。地に弱い相手によく効く。"
    },

    glimmer: {
      id: "glimmer",
      name: "フラッシュ",
      kind: "resonance",
      power: 15,
      pp: 2,
      accuracy: 1.0,
      target: "enemy",
      element: "light",
      effect: "flash",
      se: "light",
      description: "強い光を浴びせる。光に弱い相手によく効く。"
    },

    darkSpore: {
      id: "darkSpore",
      name: "シャドウ",
      kind: "resonance",
      power: 15,
      pp: 2,
      accuracy: 1.0,
      target: "enemy",
      element: "dark",
      effect: "rain",
      se: "dark",
      description: "闇をまとわせる。闇に弱い相手によく効く。"
    },

    aqua: {
      id: "aqua",
      name: "アクア",
      kind: "resonance",
      power: 15,
      pp: 2,
      accuracy: 1.0,
      target: "enemy",
      element: "water",
      effect: "rain",
      se: "water",
      description: "水をぶつける。水に弱い相手によく効く。"
    },

    gust: {
      id: "gust",
      name: "ウィンド",
      kind: "resonance",
      power: 15,
      pp: 2,
      accuracy: 1.0,
      target: "enemy",
      element: "wind",
      effect: "slash",
      se: "wind",
      // 見た目は「切る」が、共鳴なのでその場から放つ（RC-1 から動きは技の種類で決まる）
      description: "鋭い風で切りつける。風に弱い相手によく効く。"
    },

    // --- 範囲技 ---

    // ゲーム中で初めての範囲全体の技。マグマウルフだけが使う。
    // 1体あたりの威力は基本技と同じ15で、3体に届くぶん総量は3倍になる。
    // そのかわりクリティカルが出ず、PPも重い（息の技に共通の決まり）
    fireBreath: {
      id: "fireBreath",
      name: "火の息",
      // ブレスは種類の決まりで「よけられない・クリティカルなし」（data/categories.js の skillKind）。
      // 息は広がるのでよけようがなく、範囲全体の技は3体それぞれでクリティカルを判定すると
      // 運だけで一気に崩れる回ができてしまうため
      kind: "breath",
      power: 15,
      pp: 3,
      accuracy: 1.0,
      target: "allEnemies",
      element: "fire",
      // 炎の息が並びの中心から広がる（どくのいきと同じ出し方）
      effect: "flameBreath",
      effectAt: "center",
      se: "fireBreath",
      description: "熱い息を吐き、相手全体を焼く。1体ずつへの威力は低い。"
    },

    // 重い体をそのまま叩きつける。属性を持たないので耐性で軽くならない
    bodyPress: {
      id: "bodyPress",
      name: "ボディプレス",
      kind: "body",
      power: 20,
      pp: 4,
      accuracy: 1.0,
      target: "enemy",
      element: "none",
      effect: "impact",
      se: "bodyPress",
      description: "全体重をかけてのしかかる。重い一撃だが、消費するPPも大きい。"
    },

    // 威力を低くするかわりに、与えたぶんの一部を自分のHPに変える。
    // 削る速さより「粘れること」に価値がある技
    drainBite: {
      id: "drainBite",
      name: "吸血",
      kind: "slash",
      // 斬撃なので倍率（通常攻撃の基礎 ×0.85）。2026-10-22 に威力5 から（作者）
      power: 0.85,
      pp: 2,
      accuracy: 1.0,
      target: "enemy",
      element: "none",
      effect: "slash",
      drain: 0.3,
      description: "相手に噛みついて精力を吸う。与えたダメージの3割ぶん、自分のHPが回復する。"
    },

    // 竜だけが使う範囲技。火の息と同じ枠（威力15/PP3）で、属性だけが違う。
    // 範囲技の方針どおり、よけられず・クリティカルも出ない
    abyssBreath: {
      id: "abyssBreath",
      name: "奈落の息",
      kind: "breath",
      power: 15,
      pp: 3,
      accuracy: 1.0,
      target: "allEnemies",
      element: "dark",
      // 闇の息が並びの中心から広がる（どくのいきと同じ出し方）
      effect: "abyssBreath",
      effectAt: "center",
      se: "darkBreath",
      description: "底なしの闇を吐き出し、相手全体を呑み込む。"
    },

    // ゲーム中で初めての回復技。
    // 回復量は攻撃力に比例させず固定にしてある（育てても回復量は変わらない）
    cure: {
      id: "cure",
      name: "キュア",
      kind: "resonance",
      power: 0,
      pp: 2,
      accuracy: 1.0,
      target: "ally",
      element: "none",
      effect: "aura",
      heal: { min: 35, max: 45 },
      description: "味方1体のHPを回復する。回復する量は使う者の強さでは変わらない。"
    },

    // キュアの上（RC-1・作者の指定）。回復量はキュアの2倍強、PPは3倍
    greaterCure: {
      id: "greaterCure",
      name: "キュアラ",
      kind: "resonance",
      power: 0,
      pp: 6,
      accuracy: 1.0,
      target: "ally",
      element: "none",
      effect: "aura",
      heal: { min: 75, max: 105 },
      description: "味方1体のHPを大きく回復する。回復する量は使う者の強さでは変わらない。"
    },

    // 毒を治す（RC-1・作者の指定）。解毒草と同じ働きの技。
    // cureStatus … 治す状態異常（書き方は道具の cureStatus と同じ。statuses を省略すると治せるものを全部）。
    // 探索中にも仲間画面から使える（Game.isFieldSkill）
    cleanse: {
      id: "cleanse",
      name: "クレンズ",
      kind: "resonance",
      power: 0,
      pp: 1,
      accuracy: 1.0,
      target: "ally",
      element: "none",
      effect: "aura",
      cureStatus: { statuses: ["poison"] },
      description: "味方1体の毒を治す。"
    },

    // --- 強化・弱体の技 ---

    harden: {
      id: "harden",
      name: "こうか",
      kind: "body",
      power: 0,
      pp: 2,
      accuracy: 1.0,
      target: "self",
      element: "none",
      effect: "aura",
      modifier: {
        duration: 3,
        // この技だけの言い回し。書かなければ messages.js の modifierUp が使われる
        message: "{target} の 守りが 高まった!",
        // 防御 ×1.5 だけ。α-9 までは受けるダメージ ×0.8 も混ぜていたが、
        // 序盤から効きすぎ、成長率の段階で防御が伸びる後半はほぼ無敵になったので外した
        // （2026-09-29 作者の判断。防御の高い種族が使うほど効く、素直な技にしてある）
        effects: [
          { type: "statMultiplier", stat: "defense", value: 1.5 }
        ]
      },
      description: "体を硬くして、しばらく守りを上げる。"
    },

    // こうか（自分を強くする）と対になる、相手を弱くするほうの技。
    // 弱体であることは自動で判定されるので、印は赤・演出は上から下になる
    sapStrength: {
      id: "sapStrength",
      name: "ちからぬき",
      kind: "body",
      power: 0,
      pp: 2,
      accuracy: 1.0,
      target: "enemy",
      // こうかと同じく無属性。耐性で効いたり効かなかったりすると分かりにくいため
      element: "none",
      effect: "aura",
      modifier: {
        duration: 3,
        message: "{target} の 攻める力が 落ちた!",
        // 攻撃はダメージ式で係数を掛けられる側（通常攻撃 0.75・技 0.40）なので、倍率がそのまま効く。
        // 防御と違って引き算ではないため、こうかのような補強は要らない
        // 2026-10-16 作者の指定で 0.8 → 0.75
        effects: [
          { type: "statMultiplier", stat: "attack", value: 0.75 }
        ]
      },
      description: "相手にからみついて力を奪い、しばらく攻撃を下げる。"
    },

    /**
     * --- 状態異常をあたえる技 ---
     *
     * 書き方はバフ／デバフ（modifier）と同じ考え方で、1行足すだけ。
     *   status: { id: "poison", chance: 0.6 }
     * 通る確率は、ここに書いた chance に相手の耐性が掛かる
     * （data/statuses.js の説明を参照。耐性10で無効、5で半減）。
     *
     * ★ 属性は無属性にしてある。
     *   毒に効く属性は無いので、属性耐性で通ったり通らなかったりすると
     *   何が効いているのか分からなくなる。通りやすさは statusResist だけで決める。
     */

    // 単体に毒。「殴るためではなく毒を入れるための技」という位置づけ。
    // 斬撃なので倍率（通常攻撃の基礎 ×0.75）。2026-10-22 に威力8 から（作者）
    venomSting: {
      id: "venomSting",
      name: "どくばり",
      kind: "slash",
      power: 0.75,
      pp: 2,
      accuracy: 1.0,
      target: "enemy",
      element: "none",
      effect: "impact",
      se: "venomSting",
      status: { id: "poison", chance: 0.6 },
      description: "毒を含んだ針で刺す。高い確率で相手を毒におかす。"
    },

    // 全体に毒。ダメージは無く、毒を撒くことだけが役目。
    // 息の技なので、火の息・奈落の息と同じくよけられない
    venomBreath: {
      id: "venomBreath",
      name: "どくのいき",
      kind: "breath",
      power: 0,
      pp: 3,
      accuracy: 1.0,
      target: "allEnemies",
      element: "none",
      // 毒の息が並びの中心から広がる（1体ずつではなく1回だけ）
      effect: "miasma",
      effectAt: "center",
      se: "venomBreath",
      // 1体ずつ判定するので、避ける子・かかる子が分かれる。
      // 単体（60%）より低いのは、3体に届くぶんの釣り合い
      status: { id: "poison", chance: 0.35 },
      description: "毒の息を吐き、相手全体を毒におかす。"
    },

    /**
     * あわ。ヌシガエルが使う水の範囲技。
     *
     * 火の息・奈落の息と同じ枠（PP3 / 全体 / よけられない / クリティカルなし）。
     * 水属性の範囲技はこれが初めてで、火・闇に続く3つ目の「息」枠になる。
     * ★ 威力だけ12のまま（火の息・奈落の息は15に上げた）。主の技なので別枠で見ている
     *
     * ★ 主のローテで効くのはこれ。
     *   通常攻撃（威力0・単体）を1回撃つより、全体に届くぶん
     *   1ターンあたりのダメージ総量が3倍近くになる。
     *   「攻撃」ばかりのローテだと主が弱くなるのは、単体×威力0を繰り返すため
     */
    bubble: {
      id: "bubble",
      name: "あわ",
      kind: "breath",
      power: 12,
      pp: 3,
      accuracy: 1.0,
      target: "allEnemies",
      element: "water",
      // 泡の息が並びの中心から広がる（どくのいきと同じ出し方）
      effect: "bubbleBreath",
      effectAt: "center",
      se: "bubble",
      description: "泡を吐き出して相手全体を包む。"
    },

    // 光の大技。サンダーと同じ「特別枠」で、威力を上げてPPを重くしてある
    //   他の属性の基本技 … 威力15 / PP2
    //   シャイン         … 威力32 / PP5
    // 闇に強く守られた相手（ヨミリュウ）を崩すための答えとして置いてある
    shine: {
      id: "shine",
      name: "シャイン",
      kind: "resonance",
      power: 32,
      pp: 5,
      accuracy: 1.0,
      target: "enemy",
      element: "light",
      effect: "radiance",   // 閃光（flash）の一段上。技が強くなったと分かる見せ方
      se: "shine",
      description: "目を灼くほどの光を放つ。闇を頼る相手ほど深く突き刺さる。"
    },

    // 雷だけは他の属性と枠が違う。elements.js の方針どおり、
    // 威力を上げるかわりにPPを重くして「強いが撃てる回数が少ない」形にしてある
    //   他の属性の基本技 … 威力15 / PP2
    //   サンダー         … 威力20 / PP3
    // 使い手はビリムシ1種だけ。仲間にすれば、こちらも撃てるようになる
    thunderBolt: {
      id: "thunderBolt",
      name: "サンダー",
      kind: "resonance",
      power: 20,
      pp: 3,
      accuracy: 1.0,
      target: "enemy",
      element: "thunder",
      effect: "flash",
      se: "thunder",
      description: "強い電気を落とす。威力は高いが、消費するPPも大きい。"
    },

    /**
     * --- 属性技の2段目（tier2。RC-1） ---
     * 数値は 早見表/技.txt のまま（作者の判断：共鳴の係数が ×1.50 になったあとも見直さない。
     * 光の2段目のシャインが、もう同じ帯で釣り合っているため）。
     * 覚えるのは同じ属性の1段目を覚える種族で、Lv18 前後（data/monsters.js の learnset）。
     * いまの敵（深層 Lv10〜15・毒沼 Lv14〜19）は、ほとんど使ってこない高さに置いてある。
     * 全体の技は、今の全体技と同じく「よけられない・クリティカルなし」。
     * 音は2段目専用の se_*_2.wav（data/audio.js の flame〜volt）
     */
    flame: {
      id: "flame",
      name: "フレイム",
      kind: "resonance",
      power: 36,
      pp: 5,
      accuracy: 1.0,
      target: "enemy",
      element: "fire",
      effect: "blaze",   // ファイア（burst）の一段上。シャインの radiance と同じ考え方
      se: "flame",
      description: "燃えさかる炎を放つ。火に弱い相手を大きく焼く。"
    },

    wave: {
      id: "wave",
      name: "ウェーブ",
      kind: "resonance",
      power: 30,
      pp: 4,
      accuracy: 1.0,
      target: "enemy",
      element: "water",
      effect: "surge",   // アクア（rain）の一段上
      se: "wave",
      description: "大きな波を打ちつける。水に弱い相手によく効く。"
    },

    // 風は全体の属性。1体ずつへの威力を下げて、3体に届かせる
    gale: {
      id: "gale",
      name: "ゲイル",
      kind: "resonance",
      power: 25,
      pp: 5,
      accuracy: 1.0,
      target: "allEnemies",
      element: "wind",
      // 全体の型。並び全体に1回だけ出す（data/effects.js の全体の共鳴）
      effect: "galeSweep",
      effectAt: "center",
      se: "gale",
      evadable: false,
      canCritical: false,
      description: "吹き荒れる風で、相手全体を切り裂く。"
    },

    // 当てたあとに、相手の受けるダメージを2ターン上げる（当てたその一撃には乗らない。BattleSystem._resolveHit）
    rockSpike: {
      id: "rockSpike",
      name: "ロックスパイク",
      kind: "resonance",
      power: 30,
      pp: 6,
      accuracy: 1.0,
      target: "enemy",
      element: "earth",
      effect: "spikes",   // ストーン（shards）の一段上
      se: "rockSpike",
      modifier: {
        duration: 2,
        message: "{target} の 守りに ひびが入った!",
        popup: "被ダメージ上昇",
        effects: [ { type: "damageTaken", value: 1.10 } ]
      },
      description: "岩の棘で突き上げる。当たった相手は2ターンのあいだ、受けるダメージが少し増える。"
    },

    darkNebula: {
      id: "darkNebula",
      name: "ダークネビュラ",
      kind: "resonance",
      power: 26,
      pp: 6,
      accuracy: 1.0,
      target: "allEnemies",
      element: "dark",
      effect: "darkNebula",
      effectAt: "center",
      se: "darkNebula",
      evadable: false,
      canCritical: false,
      description: "闇の雲を広げ、相手全体を呑み込む。"
    },

    // 雷の枠（強いが重い）のまま全体へ。1体ずつ麻痺を判定する（ダメージを見せたあと）
    volt: {
      id: "volt",
      name: "ボルト",
      kind: "resonance",
      power: 35,
      pp: 11,
      accuracy: 1.0,
      target: "allEnemies",
      element: "thunder",
      effect: "thunderstorm",
      effectAt: "center",
      se: "volt",
      evadable: false,
      canCritical: false,
      status: { id: "paralysis", chance: 0.15 },
      description: "雷を降らせ、相手全体を撃つ。まひさせることがある。"
    },

    /**
     * --- 専用技（愛情度が「絆」に届くと覚える。data/monsters.js の bondReward） ---
     * 効果・数値は作者が決めたもの（早見表/絆と記録.txt）。
     * その種族らしい働きで個性を出す。どれも覚えるのはその種族だけ（learnset には書かない）
     */

    // スライム。最初の相棒が仲間の盾になる。
    // cover … ターンの頭で（素早さに関係なく）立ち塞がり、そのターン向かい側からの攻撃を
    //         すべて自分が受ける（範囲全体の技も全員ぶん）。受けるダメージは modifier で軽くする
    standGuard: {
      id: "standGuard",
      name: "立ち塞がる",
      kind: "body",
      power: 0,
      pp: 5,
      accuracy: 1.0,
      target: "self",
      element: "none",
      effect: "aura",
      cover: true,
      modifier: {
        duration: 1,
        message: "{target} は 仲間の前に立ち塞がった!",
        popup: "立ち塞がる",
        effects: [ { type: "damageTaken", value: 0.75 } ]
      },
      description: "使ったターンのあいだ、仲間への攻撃をすべて引き受ける。受けるダメージは少し減る。"
    },

    // コウモリ。羽ばたきで相手の目を眩ませる。盲目（状態異常）とは別の弱体で、両方掛かれば重なる
    hazyWing: {
      id: "hazyWing",
      name: "朧羽",
      // 踊りの第1号。羽ばたいて惑わす
      kind: "dance",
      power: 0,
      pp: 8,
      accuracy: 1.0,
      target: "allEnemies",
      element: "dark",
      effect: "aura",
      evadable: false,
      canCritical: false,
      modifier: {
        duration: 2,
        message: "{target} は 朧な羽ばたきに 目を奪われた",
        effects: [ { type: "accuracyMultiplier", value: 0.8 } ]
      },
      description: "朧な羽ばたきで、相手全体の命中率を2ターンのあいだ下げる。"
    },

    // ヒカリムシ。味方を先へ導く光（2026-10-16 作者の指定で 共鳴 → 体技。封印されても出せる）
    guidingLight: {
      id: "guidingLight",
      name: "導きの光",
      kind: "body",
      power: 0,
      pp: 6,
      accuracy: 1.0,
      target: "ally",
      element: "light",
      effect: "aura",
      modifier: {
        duration: 3,
        message: "{target} は 光に導かれ、足が軽くなった!",
        // 2026-10-20 作者の指定で ×2.0 → ×2.25
        effects: [ { type: "statMultiplier", stat: "speed", value: 2.25 } ]
      },
      description: "味方1体を光で導き、3ターンのあいだ素早さを大きく上げる。"
    },

    // キノコン。味方が使える初めての眠りの技
    sleepSpore: {
      id: "sleepSpore",
      name: "眠りの胞子",
      // 胞子を撒くのでブレス（よけられない・クリティカルなし は種類の決まり）
      kind: "breath",
      power: 0,
      pp: 8,
      accuracy: 1.0,
      target: "allEnemies",
      element: "none",
      effect: "sporeCloud",
      effectAt: "center",
      // 2026-10-20 作者の指定で 50% → 70%
      status: { id: "sleep", chance: 0.7 },
      description: "眠りを誘う胞子を撒き、相手全体を眠らせることがある。"
    },

    // キングスライム。王として自らを奮い立たせる。特性「王の威厳」と重なる
    kingsCommand: {
      id: "kingsCommand",
      name: "王の号令",
      kind: "body",
      power: 0,
      pp: 10,
      accuracy: 1.0,
      target: "self",
      element: "none",
      effect: "aura",
      modifier: {
        duration: 3,
        message: "{target} は 王の号令を上げた!",
        // 2026-10-20 作者の指定で 攻撃・防御 ×1.5 → 攻撃 ×1.75・防御 ×2.0（ブレイブ＋シールドに負けていたため）
        effects: [
          { type: "statMultiplier", stat: "attack", value: 1.75 },
          { type: "statMultiplier", stat: "defense", value: 2.0 }
        ]
      },
      description: "王の号令を上げ、3ターンのあいだ自分の攻撃と防御を大きく上げる。"
    },

    // フレイミン（絆の技）。燃える牙の一撃。
    // 斬撃なので倍率（通常攻撃の基礎 ×1.5）。2026-10-22 に威力50 から（作者。×1.88 の案は Lv99 で強すぎたので 1.5）
    blazeFang: {
      id: "blazeFang",
      name: "焔牙",
      kind: "slash",
      power: 1.5,
      pp: 6,
      accuracy: 1.0,
      criticalBonus: 0.4,
      target: "enemy",
      element: "fire",
      effect: "slash",
      se: "fire",
      description: "燃える牙で食らいつく。威力が高く、クリティカルがとても出やすい。"
    },

    // ヌマボネ。眼窩の青い光で呪う。味方が使える初めての呪いの技
    // （2026-10-16 作者の指定で 共鳴 → 体技、呪い 75% → 80%）
    blueGlare: {
      id: "blueGlare",
      name: "青い眼光",
      kind: "body",
      power: 0,
      pp: 7,
      accuracy: 1.0,
      target: "enemy",
      element: "dark",
      effect: "flash",
      se: "dark",
      status: { id: "curse", chance: 0.8 },
      description: "眼窩の青い光で見つめ、相手を呪うことがある。"
    },

    /**
     * --- v1.0.0 萌芽の穴・若葉の洞で足した技（作者が決めたもの） ---
     * どちらも、いまは敵のときに使う技（data/monsters.js の enemySkills）。
     */

    // ユラツボミ。揺れながら眠りを誘う。踊りなので封印されても出せる
    lullaby: {
      id: "lullaby",
      name: "ララバイ",
      kind: "dance",
      power: 0,
      pp: 4,
      accuracy: 1.0,
      target: "enemy",
      element: "none",
      effect: "aura",
      status: { id: "sleep", chance: 0.75 },
      description: "ゆらゆらと揺れて眠りを誘い、相手1体を眠らせることがある。"
    },

    // コダマ。強い光で目をくらませる。共鳴なので封印されると出せない。
    // 盲目にする技はこれが最初
    glare: {
      id: "glare",
      name: "グレア",
      kind: "resonance",
      power: 0,
      pp: 4,
      accuracy: 1.0,
      target: "enemy",
      element: "light",
      effect: "flash",
      se: "light",
      status: { id: "blind", chance: 0.65 },
      description: "まばゆい光を放ち、相手1体を盲目にすることがある。"
    },

    // コダマの専用技（絆。作者が決めたもの 2026-10-13）。味方全員の、すべての状態異常の耐性を3ターン +4。
    // 効果・PP・範囲・属性・種類（体技。封印されても出せる）は作者の指定
    // ★ 耐性は10で無効なので、もとが6以上の状態異常はこのあいだ効かなくなる
    sproutBlessing: {
      id: "sproutBlessing",
      name: "芽吹きの加護",
      kind: "body",
      power: 0,
      pp: 15,
      accuracy: 1.0,
      target: "allAllies",
      element: "none",
      effect: "aura",
      modifier: {
        duration: 3,
        message: "{target} は 芽吹きの加護に 包まれた!",
        popup: "状態異常耐性上昇",
        effects: [ { type: "resistBonus", status: "all", value: 4 } ]
      },
      description: "芽吹きの加護で味方全体を包み、3ターンのあいだ、すべての状態異常にかかりにくくする。"
    },

    /**
     * --- 技の大幅追加（2026-10-15。採用・数値は作者が決めたもの。my game/技の追加案.md） ---
     * 名前・覚える種族は 2026-10-20 に作者が確定（my game の 技と習得_最終版.md。learnset は data/monsters.js の Lv22〜30）。
     * id は仮の名前のころのまま（セーブが技を id で持っているので変えない）。
     * 種類の使い分け：共鳴は効き目が大きいが封印で止まる／踊りは封印されても出せる
     */

    // A. 強化（味方に掛ける）
    fightSong: {
      id: "fightSong", name: "ブレイブ", kind: "resonance", power: 0, pp: 3, accuracy: 1.0,
      target: "ally", element: "none", effect: "rally",
      modifier: { duration: 3, message: "{target} の 闘志が 高まった!",
        effects: [ { type: "statMultiplier", stat: "attack", value: 1.5 } ] },
      description: "闘志を呼び起こす響きで、味方1体の攻撃を3ターンのあいだ上げる。"
    },
    guardSong: {
      id: "guardSong", name: "シールド", kind: "resonance", power: 0, pp: 3, accuracy: 1.0,
      target: "ally", element: "none", effect: "barrier",
      modifier: { duration: 3, message: "{target} の 守りが 高まった!",
        effects: [ { type: "statMultiplier", stat: "defense", value: 1.5 } ] },
      description: "守りを固める響きで、味方1体の防御を3ターンのあいだ上げる。"
    },
    galeSong: {
      id: "galeSong", name: "ヘイスト", kind: "resonance", power: 0, pp: 3, accuracy: 1.0,
      target: "ally", element: "none", effect: "haste",
      modifier: { duration: 3, message: "{target} の 足が 軽くなった!",
        effects: [ { type: "statMultiplier", stat: "speed", value: 1.5 } ] },
      description: "風のような響きで、味方1体の素早さを3ターンのあいだ上げる。"
    },
    rallyDance: {
      id: "rallyDance", name: "鼓舞の舞", kind: "dance", power: 0, pp: 7, accuracy: 1.0,
      target: "allAllies", element: "none", effect: "rally",
      modifier: { duration: 3, message: "{target} の 攻める力が 上がった!",
        effects: [ { type: "statMultiplier", stat: "attack", value: 1.25 } ] },
      description: "仲間を鼓舞する舞で、味方全体の攻撃を3ターンのあいだ少し上げる。"
    },
    fortressForm: {
      id: "fortressForm", name: "堅守の陣", kind: "dance", power: 0, pp: 12, accuracy: 1.0,
      target: "allAllies", element: "none", effect: "fortress",
      modifier: { duration: 2, message: "{target} は 守りの陣に 入った!", popup: "被ダメージ低下",
        effects: [ { type: "damageTaken", value: 0.85 } ] },
      description: "守りの陣を敷き、味方全体の受けるダメージを2ターンのあいだ減らす。"
    },
    powerResonance: {
      id: "powerResonance", name: "ハウリング", kind: "resonance", power: 0, pp: 7, accuracy: 1.0,
      target: "self", element: "none", effect: "howl",
      // 2026-10-20 作者の指定で ×1.2・2ターン → ×1.35・3ターン（2ターンだと強くなるのが次の1回だけだった）
      modifier: { duration: 3, message: "{target} の 力が 共鳴している!", popup: "与ダメージ上昇",
        effects: [ { type: "damageDealt", value: 1.35 } ] },
      description: "自分の力を共鳴させ、3ターンのあいだ与えるダメージを上げる。"
    },
    // 〇〇ベール（属性ごとに7つ）。主の得意属性を読んで先に張る技。
    // 音は7つとも se_veil だけ（作者の指定。modifierSe: null で、掛かったときの強化の音は鳴らさない）。
    // 属性は守る属性そのもの（2026-10-22 作者の指定。前は7つとも無属性で、図鑑・技の一覧で「なし」と出ていた）。
    // ダメージを与えない技なので、属性は表示・並べ替え・共鳴の響きの色にだけ効く（相手の耐性で軽くなったりはしない）
    wardSongFire: {
      id: "wardSongFire", name: "ファイアベール", kind: "resonance", power: 0, pp: 4, accuracy: 1.0, se: "veil", modifierSe: null,
      target: "allAllies", element: "fire", effect: "veilFire",
      modifier: { duration: 3, message: "{target} は 火に 強くなった!", popup: "火耐性上昇",
        effects: [ { type: "resistBonus", element: "fire", value: 3 } ] },
      description: "味方全体の火への耐性を、3ターンのあいだ上げる。"
    },
    wardSongWater: {
      id: "wardSongWater", name: "アクアベール", kind: "resonance", power: 0, pp: 4, accuracy: 1.0, se: "veil", modifierSe: null,
      target: "allAllies", element: "water", effect: "veilWater",
      modifier: { duration: 3, message: "{target} は 水に 強くなった!", popup: "水耐性上昇",
        effects: [ { type: "resistBonus", element: "water", value: 3 } ] },
      description: "味方全体の水への耐性を、3ターンのあいだ上げる。"
    },
    wardSongWind: {
      id: "wardSongWind", name: "ウィンドベール", kind: "resonance", power: 0, pp: 4, accuracy: 1.0, se: "veil", modifierSe: null,
      target: "allAllies", element: "wind", effect: "veilWind",
      modifier: { duration: 3, message: "{target} は 風に 強くなった!", popup: "風耐性上昇",
        effects: [ { type: "resistBonus", element: "wind", value: 3 } ] },
      description: "味方全体の風への耐性を、3ターンのあいだ上げる。"
    },
    wardSongEarth: {
      id: "wardSongEarth", name: "ストーンベール", kind: "resonance", power: 0, pp: 4, accuracy: 1.0, se: "veil", modifierSe: null,
      target: "allAllies", element: "earth", effect: "veilEarth",
      modifier: { duration: 3, message: "{target} は 地に 強くなった!", popup: "地耐性上昇",
        effects: [ { type: "resistBonus", element: "earth", value: 3 } ] },
      description: "味方全体の地への耐性を、3ターンのあいだ上げる。"
    },
    wardSongThunder: {
      id: "wardSongThunder", name: "サンダーベール", kind: "resonance", power: 0, pp: 4, accuracy: 1.0, se: "veil", modifierSe: null,
      target: "allAllies", element: "thunder", effect: "veilThunder",
      modifier: { duration: 3, message: "{target} は 雷に 強くなった!", popup: "雷耐性上昇",
        effects: [ { type: "resistBonus", element: "thunder", value: 3 } ] },
      description: "味方全体の雷への耐性を、3ターンのあいだ上げる。"
    },
    wardSongLight: {
      id: "wardSongLight", name: "ライトベール", kind: "resonance", power: 0, pp: 4, accuracy: 1.0, se: "veil", modifierSe: null,
      target: "allAllies", element: "light", effect: "veilLight",
      modifier: { duration: 3, message: "{target} は 光に 強くなった!", popup: "光耐性上昇",
        effects: [ { type: "resistBonus", element: "light", value: 3 } ] },
      description: "味方全体の光への耐性を、3ターンのあいだ上げる。"
    },
    wardSongDark: {
      id: "wardSongDark", name: "ダークベール", kind: "resonance", power: 0, pp: 4, accuracy: 1.0, se: "veil", modifierSe: null,
      target: "allAllies", element: "dark", effect: "veilDark",
      modifier: { duration: 3, message: "{target} は 闇に 強くなった!", popup: "闇耐性上昇",
        effects: [ { type: "resistBonus", element: "dark", value: 3 } ] },
      description: "味方全体の闇への耐性を、3ターンのあいだ上げる。"
    },

    // B. 弱体（相手に掛ける。主など弱体の耐性を持つ相手には入らないことがある）
    armorBreak: {
      id: "armorBreak", name: "鎧くずし", kind: "body", power: 10, pp: 6, accuracy: 1.0,
      target: "enemy", element: "none", effect: "shatter",
      modifier: { duration: 3, message: "{target} の 守りが 崩れた!",
        effects: [ { type: "statMultiplier", stat: "defense", value: 0.5 } ] },
      description: "体ごとぶつかって守りを崩す。当たった相手は3ターンのあいだ防御が下がる。"
    },
    slowDance: {
      id: "slowDance", name: "足止めの舞", kind: "dance", power: 0, pp: 3, accuracy: 1.0,
      target: "enemy", element: "none", effect: "entangle",
      modifier: { duration: 3, message: "{target} の 足が 重くなった!",
        effects: [ { type: "statMultiplier", stat: "speed", value: 0.5 } ] },
      description: "まとわりつく舞で、相手1体の素早さを3ターンのあいだ大きく下げる。"
    },
    intimidRoar: {
      id: "intimidRoar", name: "威圧の咆哮", kind: "breath", power: 0, pp: 7, accuracy: 1.0,
      // 演出は並び全体に1回だけ広がる咆哮（effectAt: "center"）
      target: "allEnemies", element: "none", effect: "intimidate", effectAt: "center",
      // 2026-10-20 作者の指定で ×0.85・2ターン → ×0.77・3ターン
      modifier: { duration: 3, message: "{target} は 威圧されて 力が 落ちた!",
        effects: [ { type: "statMultiplier", stat: "attack", value: 0.77 } ] },
      description: "大きく吠えて威圧し、相手全体の攻撃を3ターンのあいだ下げる。"
    },

    // C. 状態異常
    dazzleMist: {
      id: "dazzleMist", name: "幻惑の息", kind: "breath", power: 0, pp: 5, accuracy: 1.0,
      target: "allEnemies", element: "none", effect: "blindMist", effectAt: "center",
      status: { id: "blind", chance: 0.45 },
      description: "目をくらます息を吐き、相手全体を盲目にすることがある。"
    },
    sealSong: {
      id: "sealSong", name: "サイレス", kind: "resonance", power: 0, pp: 4, accuracy: 1.0,
      target: "enemy", element: "none", effect: "sealRing",
      status: { id: "seal", chance: 0.7 },
      description: "共鳴を乱す響きで、相手1体を封印にすることがある。"
    },
    numbPowder: {
      id: "numbPowder", name: "しびれ粉", kind: "body", power: 0, pp: 5, accuracy: 1.0,
      target: "allEnemies", element: "none", effect: "numbCloud", effectAt: "center",
      evadable: false, canCritical: false,
      status: { id: "paralysis", chance: 0.45 },
      description: "しびれる粉を撒き散らし、相手全体を麻痺にすることがある。"
    },
    numbNeedle: {
      // 斬撃なので倍率（通常攻撃の基礎 ×0.75）。2026-10-22 に威力10 から（作者）
      id: "numbNeedle", name: "しびれ針", kind: "slash", power: 0.75, pp: 4, accuracy: 1.0,
      target: "enemy", element: "none", effect: "needle",
      status: { id: "paralysis", chance: 0.4 },
      description: "しびれを含んだ針で刺す。当たった相手を麻痺にすることがある。"
    },
    curseSong: {
      id: "curseSong", name: "不吉な舞", kind: "dance", power: 0, pp: 6, accuracy: 1.0,
      target: "allEnemies", element: "none", effect: "hex",
      evadable: false, canCritical: false,
      status: { id: "curse", chance: 0.5 },
      description: "不吉な歌と踊りで、相手全体を呪いにすることがある。"
    },

    // D. 治す
    wakeSong: {
      id: "wakeSong", name: "ディンド", kind: "resonance", power: 0, pp: 2, accuracy: 1.0,
      target: "ally", element: "none", effect: "wake",
      cureStatus: { statuses: ["sleep", "paralysis"] },
      description: "味方1体の眠りと麻痺を治す。"
    },
    purifyLight: {
      id: "purifyLight", name: "リカバー", kind: "resonance", power: 0, pp: 6, accuracy: 1.0,
      target: "ally", element: "none", effect: "purify",
      // 封印も治す（2026-10-16 作者の指定）。封印は道具では治せない（curable: false）ので、治すものを並べて書く
      cureStatus: { statuses: ["poison", "paralysis", "sleep", "seal", "blind", "curse"] },
      description: "味方1体の、状態異常を全て治す。"
    },
    purifyRain: {
      id: "purifyRain", name: "クレンズレイン", kind: "resonance", power: 0, pp: 3, accuracy: 1.0,
      target: "allAllies", element: "none", effect: "cleanseRain",
      cureStatus: { statuses: ["poison"] },
      description: "味方全体の毒を治す。"
    },

    // E. 攻撃に何かが付く技（新しい仕組み。BattleSystem の _applyRecoil・_applyCharge・hits）
    recklessTackle: {
      // 2026-10-20 作者の指定で 威力40 → 35・反動 1/4 → 与えたダメージそのまま
      id: "recklessTackle", name: "捨て身の体当たり", kind: "body", power: 35, pp: 4, accuracy: 1.0,
      target: "enemy", element: "none", effect: "crash",
      recoil: 1.0,
      description: "捨て身でぶつかる。威力が高いが、与えたダメージと同じだけ自分も受ける。"
    },
    chargeUp: {
      id: "chargeUp", name: "ちからため", kind: "body", power: 0, pp: 0, accuracy: 1.0,
      target: "self", element: "none", effect: "gather",
      charge: { min: 1.85, max: 2.25 },
      description: "力をためる。次にダメージを与える技か攻撃が、1.85〜2.25倍になる。"
    },
    doubleSlash: {
      // 2026-10-20 作者の指定で 威力12 → 10・1回のダメージ上限200（斬撃は攻撃力がよく効き、2回ぶん伸びるので終盤に強すぎた）。
      // 2026-10-22 から斬撃は倍率なので、1回 ×0.7（2回で ×1.4）。上限200は残す（作者：無くすと強化や装備で大きく上回る）
      id: "doubleSlash", name: "二連斬り", kind: "slash", power: 0.7, pp: 4, accuracy: 1.0,
      target: "enemy", element: "none", effect: "crossSlash",
      hits: 2, maxDamage: 200,
      description: "続けざまに2回斬りつける。1回ずつ命中を判定する。"
    },
    // 稲妻斬り（2026-10-22 作者の指定：斬撃・雷・PP4・1体）。斬撃なので倍率（通常攻撃の基礎 ×1.2）。
    // 最初は威力18・補正 ×1.05 だったが、斬撃を倍率にしたので 1.2 にまとめた（作者）。
    // 雷の斬撃はゲームで初めて。覚えるのはザンガルド（Lv22）。敵のザンガルドも使う（data/dungeons.js の IVY_ZAN）
    thunderSlash: {
      id: "thunderSlash", name: "稲妻斬り", kind: "slash", power: 1.2, pp: 4, accuracy: 1.0,
      // 音は当たった瞬間に雷（サンダーと同じ音）。出した瞬間には鳴らさない（斬ってから落ちる）
      target: "enemy", element: "thunder", effect: "thunderSlash", hitSe: "thunder",
      description: "稲妻をまとった刃で、相手1体を斬りつける。"
    },

    /**
     * --- v1.0.0 若葉の洞の主の技（作者が決めたもの） ---
     * いまは主の行動手順（data/bosses.js の hollowLord）だけで使う
     */

    // 眠りを誘う息を全体に吐く。眠りの胞子（50%）より入りにくい
    sleepBreath: {
      id: "sleepBreath",
      name: "眠りの息",
      kind: "breath",
      power: 0,
      pp: 4,
      accuracy: 1.0,
      target: "allEnemies",
      element: "none",
      effect: "sporeCloud",
      effectAt: "center",
      status: { id: "sleep", chance: 0.35 },
      description: "眠りを誘う息を吐き、相手全体を眠らせることがある。"
    },

    // 地中に根を伸ばし、相手全体を下から突き上げる
    rootSpike: {
      id: "rootSpike",
      name: "ルートスパイク",
      kind: "body",
      power: 20,
      pp: 7,
      accuracy: 1.0,
      target: "allEnemies",
      element: "earth",
      effect: "spikes",
      se: "rockSpike",
      canCritical: false,
      description: "根を伸ばして、相手全体を下から突き上げる。"
    },

    // しんくうは（2026-10-22 作者の指定：体技・風・全体・威力20・PP5）。
    // 全体技だがよけられる。ダメージを与える全体の体技はよけられる、という作者の決め（ルートスパイクも同じ）。
    // クリティカルは出ない。覚えるのはツリガネ（Lv30）
    vacuumWave: {
      id: "vacuumWave",
      name: "しんくうは",
      kind: "body",
      power: 20,
      pp: 5,
      accuracy: 1.0,
      target: "allEnemies",
      element: "wind",
      effect: "vacuumWave",
      effectAt: "center",
      se: "wind",
      canCritical: false,
      description: "真空の刃を飛ばして、相手全体を切り裂く。"
    },

    // いなずま（2026-10-26 作者の指定：体技・雷・全体・威力25・PP8）。しんくうはと同じく、全体の体技なのでよけられる。
    // クリティカルは出ない。覚えるのはザンガルド（Lv27）。演出はボルトと同じ型を、太く速くしたもの（data/effects.js の lightning）
    lightning: {
      id: "lightning",
      name: "いなずま",
      kind: "body",
      power: 25,
      pp: 8,
      accuracy: 1.0,
      target: "allEnemies",
      element: "thunder",
      effect: "lightning",
      effectAt: "center",
      se: "thunder",
      canCritical: false,
      description: "体にためた雷を落とし、相手全体を撃つ。"
    },

    // 目を見開いて相手を惑わせる
    dazzleEye: {
      id: "dazzleEye",
      name: "幻惑の瞳",
      kind: "body",
      power: 0,
      pp: 5,
      accuracy: 1.0,
      target: "enemy",
      element: "none",
      effect: "flash",
      status: { id: "blind", chance: 0.60 },
      description: "怪しく光る目で見つめ、相手1体を盲目にすることがある。"
    },

    // 不思議な踊りで相手の気力を奪う。PPを減らす技はこれが最初（ppDamage。BattleSystem._applyPpDamage）
    mysteryDance: {
      id: "mysteryDance",
      name: "ミステリーダンス",
      kind: "dance",
      power: 0,
      pp: 5,
      accuracy: 1.0,
      target: "enemy",
      element: "none",
      effect: "mystery",
      ppDamage: { min: 3, max: 7 },
      description: "不思議な踊りで、相手1体のPPを3〜7減らす。"
    },

    /**
     * --- シニガミの技（蔦這う回廊。名前・数値は作者が決めたもの 2026-10-21） ---
     * 即死を付ける技（status の id が instantDeath）は、特性「死神」を持つ者が使うと PP を使わない（BattleSystem.ppCostOf）。
     * 即死は主には効かない（data/battle.js の bossImmuneToStatus）
     */

    // 死神の鎌。踊りだが、ダメージの計算は斬撃の式（damageKind: "slash"）。よけられない（説明には書かない。作者）。
    // PP666 なので、仲間のシニガミ（PP666）は満タンから1回だけ撃てる。敵のときは PP が減らない（data/dungeons.js の infinitePp）。
    // 動きは専用（motion: "reap" → monsters.js の shinigami の motions.reap）
    deathScythe: {
      id: "deathScythe",
      name: "死神の鎌",
      kind: "dance",
      damageKind: "slash",
      power: 666,
      pp: 666,
      accuracy: 1.0,
      evadable: false,
      target: "enemy",
      element: "none",
      effect: "reap",
      // 技を出した瞬間、シニガミのまわりに出す前ぶれ（data/effects.js の reapOmen。種類の演出の代わり）
      casterEffect: "reapOmen",
      hitSe: "slash",
      motion: "reap",
      // 技を出してから当たるまで（ミリ秒）。専用の動き reaperScythe の振り下ろしのコマ（0.56 × 1500ms）にそろえてある
      windupMs: 840,
      description: "死神の鎌を振り下ろす。"
    },

    // 死の踊り。相手全体に即死を 25%。よけられない（説明には書かない。作者）
    deathDance: {
      id: "deathDance", name: "死の踊り", kind: "dance", power: 0, pp: 10, accuracy: 1.0,
      target: "allEnemies", element: "none", effect: "deathMark",
      evadable: false, canCritical: false,
      status: { id: "instantDeath", chance: 0.25 },
      description: "死を招く踊りで、相手全体を即死させることがある。"
    },

    // デス。相手1体に即死を 35%
    death: {
      id: "death", name: "デス", kind: "resonance", power: 0, pp: 6, accuracy: 1.0,
      target: "enemy", element: "none", effect: "deathMark",
      status: { id: "instantDeath", chance: 0.35 },
      description: "死の響きで、相手1体を即死させることがある。"
    },

    // デスラ。相手全体に即死を 25%。全体の技の決まりどおり、よけられない・クリティカルなし
    deathra: {
      id: "deathra", name: "デスラ", kind: "resonance", power: 0, pp: 12, accuracy: 1.0,
      target: "allEnemies", element: "none", effect: "deathMark",
      evadable: false, canCritical: false,
      status: { id: "instantDeath", chance: 0.25 },
      description: "死の響きで、相手全体を即死させることがある。"
    },

    // 主が頭の葉から薬草を取って、自分に使う（道具の薬草と同じ20回復）。
    // 技ではなく道具を使った見え方にするので、宣言の文を useMessage で差し替え、図鑑には載せない
    bossHerb: {
      id: "bossHerb",
      name: "やくそう",
      power: 0,
      pp: 0,
      accuracy: 1.0,
      target: "self",
      element: "none",
      heal: { amount: 20 },
      useMessage: "{actor} は やくそうを 使った!",
      showInDex: false,
      description: "頭の葉から薬草を取って、自分に使う。"
    }
  };
})(window.MyGame);
