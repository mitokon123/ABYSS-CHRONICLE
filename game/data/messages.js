/**
 * messages.js
 * 画面に表示する文言のテンプレート。文言の変更・翻訳はこのファイルだけで行える。
 *
 * {name} のような波括弧の部分が、実行時に実際の値へ置き換わる。
 * 使用できる差し込み名は各行のコメントを参照。
 */
(function (NS) {
  "use strict";

  NS.rawData.messages = {
    /** 画面をまたいで使う文言 */
    common: {
      back: "戻る"
    },

    battle: {
      encounter:    "野生の {name} が現れた!",              // name
      useSkill:     "{actor} の {skill}!",                  // actor, skill
      wait:         "{actor} は ようすを みている...",       // actor
      miss:         "しかし {target} には当たらなかった!",  // target
      // ダメージの行の頭に付く（単独の行にはしない。2026-11-03 作者の指定）
      critical:     "クリティカル!",

      // 相性の良し悪しは文章では知らせない（空にすると、その行は出なくなる）。
      // 数字と画面の効果で伝える。
      //   抜群 … 橙に光って揺れる／いまひとつ … 数字が小さく灰色になる
      // 文章で出したくなったら、ここに文言を書き戻すだけでよい。
      effective:    "",
      resisted:     "",

      // 「効かない」はダメージ0の理由が分からなくなるため残す
      immune:       "{target} には効かない!",               // target
      damage:       "{target} に {amount} のダメージ!",     // target, amount
      // 防御で削り切って0になったとき（属性無効の immune とは別）
      noDamage:     "{target} にダメージを与えられなかった!", // target
      faint:        "{target} は倒れた!",                   // target

      // バフ／デバフ（data/skills.js の modifier）。
      // 技ごとの言い回しは skills.js の modifier.message に書ける。
      // 書かなかった技は、ここの文がそのまま使われる
      modifierUp:   "{target} は {skill} で 力を高めた!",    // target, skill
      modifierDown: "{target} は {skill} で 力を そがれた!", // target, skill
      modifierAgain:"{target} の {skill} を かけ直した!",    // target, skill
      modifierEnd:  "{target} の {skill} の効果が切れた。",  // target, skill
      // 何が上がった／下がったかを、画面の能力名で必ず足す（2026-11-03 作者の指定。BattleMessageFormatter._modifierText）。
      //   技の言い回しがあれば「言い回し＋ modifierStatLine」、無ければ modifierStat の1文
      modifierStat:     "{target} の {stats}",                 // target, stats
      modifierStatLine: "{nouns}が {verb}!",                  // nouns（攻撃と防御）, verb
      logStats: { hp: "HP", attack: "攻撃", defense: "防御", speed: "素早さ", pp: "PP", accuracy: "命中",
                  damageTaken: "受けるダメージ", damageDealt: "与えるダメージ",
                  resist: "{what}への耐性", allStatus: "状態異常" },
      // ×1.5 以上・×0.5 以下は「大きく」
      logChange: { up: "上がった", upBig: "大きく上がった", down: "下がった", downBig: "大きく下がった",
                   more: "増えた", less: "減った" },
      nounJoin: "と",

      // 1行にまとめる文（2026-11-03 作者の指定。BattleMessageFormatter.annotate）
      //   全体の技で2体以上が受けた／何回か当てる技／2体以上に入らなかった・当たらなかった／全体に掛けた強化・弱体
      groupName:    "{target}たち",                                       // target（先頭の名前）
      groupDamage:  "{target}たち は 平均 {amount} のダメージを受けた!",   // target, amount
      groupFail:    "しかし {target}たち には効かなかった",               // target
      groupMiss:    "しかし {target}たち には当たらなかった!",            // target
      multiHitOne:  "{target} に {hits}回 当たって 合計 {amount} のダメージ!", // target, hits, amount
      multiHitMany: "{hits}回 当たって {list} のダメージ!",              // hits, list
      multiHitPart: "{target} に {amount}",                              // target, amount
      listJoin:     "・",

      // 状態異常。ふつうは data/statuses.js に書いた言い回し
      // （message / tickMessage / cureMessage / blockMessage）が使われる。
      // ここの文は、statuses.js にその言い回しを書かなかったときの受け皿
      // 状態異常の文は「！」を付けない（statuses.js の言い回しと揃える）
      statusApplied: "{target} は {status} になった",         // target, status
      statusDamage:  "{target} は {status} で {amount} のダメージ", // target, status, amount
      statusEnd:     "{target} の {status} が治った。",        // target, status
      statusBlocked: "{target} は {status} で動けない",        // target, status
      statusMiss:    "しかし {target} には効かなかった",       // target, status
      // 弱体が弱体への耐性で入らなかった（2026-10-15）
      modifierMiss:  "しかし {target} には効かなかった",       // target
      // 反動（捨て身の体当たり）・力をためる（ちからため）
      recoil:        "{target} は 反動で {amount} のダメージを受けた!", // target, amount
      charge:        "{target} は 力をためた!",                // target
      // v1.4.1：ためている間にもう一度ためた・次の手番で乗る技を使わずに消えた
      chargeFailed:  "しかし {target} は もう力をためている",   // target
      chargeLost:    "{target} の ためた力が 消えた",           // target
      statusImmune:  "{target} には {status} が効かない",      // target, status
      // 与えたダメージの一部を自分のHPに変える技（data/skills.js の drain）
      drained:      "{target} は {amount} 吸い取った!",      // target, amount
      // HPを回復する技（data/skills.js の heal）
      healed:       "{target} の HPが {amount} 回復した!",   // target, amount
      groupHealed:  "{target}たち の HPが 平均 {amount} 回復した!", // target, amount（キュアオール）
      healFull:     "しかし {target} は 元気なままだ",       // target
      healFullAll:  "しかし みんな 元気なままだ",            // キュアオールで誰も減っていなかった
      cured:        "{target} の {status}が 治った!",        // target, status（クレンズ）
      cureNone:     "しかし {target} には 治すものがなかった", // target
      // 倒れた仲間を起こす技（リザレクト）
      revived:      "{target} は 起き上がった!",              // target
      reviveFail:   "しかし {target} は 起き上がらなかった",  // target
      reviveNone:   "しかし {target} は 倒れていない",        // target
      // 相手のPPを減らす技（ミステリーダンス。v1.0.0）
      ppDamage:     "{target} の PPが {amount} 減った!",      // target, amount
      ppDamageNone: "しかし {target} の PPは もう残っていない", // target

      // 戦闘中に働く特性（data/abilities.js の regen / counterStatus / drain / firstStrike / undying）。
      //   abilityTriggered … 特性が働いた合図（先手・脱皮など）。
      //   状態異常を付ける特性・装備（放電・毒のとげ・眠花の杖）は名乗らない（v1.0.0・作者の指定）
      abilityTriggered: "{target} の {ability}!",             // target, ability
      abilityRegen:     "{target} は {ability}で HPが {amount} 回復した", // target, ability, amount
      abilityPpRegen:   "{target} は {ability}で PPが {amount} 戻った",   // target, ability, amount（ppRegen。2026-11-10）
      abilityDrain:     "{target} は {ability}で HPを {amount} 吸い取った", // target, ability, amount
      undying:          "{target} は {ability}で 踏みとどまった!", // target, ability
      undyingEnd:       "{target} の魂が 尽きた…",              // target
      // 加護の「先手」は全員に掛かるので、ターンの頭に1行でまとめて出す
      partyFirstStrike: "{ability}の加護で 仲間が先に動く!",   // ability
      // v1.0.0。追い風（最初の数ターン素早さが上がる）・芽吹き（仲間の状態異常を1回防ぐ）
      tailwind:         "{target} は {ability}に乗って 素早くなった!", // target, ability
      tailwindEnd:      "{target} の {ability}が やんだ。",             // target, ability
      wardGiven:        "{target} の {ability}! {ally} は 状態異常を1回 防げるようになった", // target, ability, ally
      wardBlocked:      "{target} は {status}を 防いだ!",               // target, status
      // 守りを付ける技（芽吹きの加護。技の wardStatus）で、守りが付いた1体ごと
      wardSkill:        "{target} は 状態異常を1回 防げるようになった",  // target
      expGained:    "{amount} の経験値を獲得!",             // amount
      goldGained:   "{amount}G を手に入れた!",              // amount
      levelUp:      "{actor} はレベル {level} に上がった!", // actor, level
      skillLearned: "{actor} は {skill} を覚えた!",          // actor, skill
      // 愛情度の段階が上がった（data/affection.js）。stage は段階の名前（慣れ・信頼・絆）
      affectionUp:  "{actor} との関係が「{stage}」になった!",  // actor, stage
      fleeSuccess:  "うまく逃げ切れた!",
      fleeFailed:   "逃げられない!",
      enemyFled:    "{actor} は 逃げ出した!",  // actor
      win:          "戦いに勝った!",
      lose:         "目の前が真っ暗になった...",
      noSkill:      "{actor} は何もできない!",              // actor
      defend:      "{actor} は身を守っている!",            // actor
      // 防御と行動できなくなる状態異常（v1.0.0）。眠っていると守れず、防御中に眠る・動けないと解ける
      defendFailed: "{target} は {status}で 身を守れない",  // target, status
      defendBroken: "{target} の 防御が解けた!",            // target, status
      itemDropped:  "{name} を {count}個 手に入れた!",      // name, count
      dropLost:     "{name} を持ちきれなかった...",         // name

      // 味方と敵を見分けるための表示
      enemyNamePrefix: "敵の ",        // ログ上で敵の名前の前に付く
      enemySuffixes: ["A","B","C","D","E","F"]  // 同名の敵が並んだときの印
    },

    scout: {
      attempt:   "{actor} は {name} を仲間に誘った!",        // actor, name
      success:   "やった! {name} が仲間になった!",           // name
      battleEnd: "スカウトに成功し、戦いは終わった。",
      refused:   "しかし {name} は 応じてくれなかった...",   // name
      // まだ誘えない相手（シニガミ：ストーリーを全部クリアするまで）。文は仮（v1.0.0）
      locked:    "{name} は 誘いに 耳を貸さない……",         // name
      partyFull: "しかし これ以上連れていけない!",
      // 誘いの香（スカウトしやすくする道具）
      boostStart:   "甘い香りが漂いはじめた。次のターンから仲間に誘いやすくなる!",
      boostAlready: "もう香りは漂っている。",

      // パーティがいっぱいのときに選ぶ行き先
      choiceTitle:  "{name} をどうする?",                    // name
      choiceSwap:   "入れ替える",
      choiceRelease:"逃がす",
      choiceStore:  "拠点に送る",
      choiceHint:   "↑↓: 選択    決定: 決定",
      selectMember: "だれと入れ替える?",
      selectHint:   "↑↓: 選択    決定: 決定    Esc: 戻る",

      swapped:      "{out} と入れ替えて {in} が仲間になった!", // out, in
      swappedNote:  "{out} は拠点へ送られた",                  // out
      released:     "{name} を逃がした。",                     // name
      stored:       "{name} は拠点へ送られた。",               // name
      storageFull:  "拠点がいっぱいで預けられない!"
    },

    command: {
      // ターンの頭の「戦う／逃げる」
      go:      "戦う",
      tactic:  "作戦",     // 仲間ごとの作戦を変える（v1.0.0。行動にはならない）
      flee:    "逃げる",
      log:     "ログ",     // この戦いの文を見返す（v1.4.0。行動にはならない）
      // 仲間ごとのコマンド
      attack:  "攻撃",
      fight:   "技",
      defend:  "防御",
      scout:   "スカウト",
      swap:    "交代",
      item:    "道具",
      inspect: "状態を見る",
      // 倒れている仲間の枠で「交代しない」を選ぶとき（そのまま次の仲間の番へ）
      skip:    "そのまま",
      back:    "戻る"
    },

    /** 戦闘画面（3対3・素早さ順） */
    battleUi: {
      // 画面上部の発動の札（強化・弱体・特性・加護が働いたとき）
      popupStatUp:   "{stat}上昇",                              // stat
      popupStatDown: "{stat}低下",                              // stat
      popupStats:    { hp: "HP", attack: "攻撃力", defense: "防御力", speed: "素早さ", pp: "PP",
                       accuracy: "命中", other: "能力" },
      popupPartyAll: "仲間全員",
      popupEnemyAll: "敵全員",
      popupEnemyPrefix: "敵の",   // 札の持ち主が敵のとき、名前の前に付ける

      // レベルアップの結果の窓（能力名は上の popupStats を使う）
      levelResultTitle:   "{name}　Lv{from} → Lv{to}",   // name, from, to
      levelResultStat:    "{before} → {after}",           // before, after
      levelResultUp:      "(+{n})",                       // n
      levelResultLearned: "新しく覚えた技",
      levelResultHint:    "決定: 閉じる",

      // ターンの頭
      turnPrompt:  "どうする?",
      hintTurn:    "↑↓: 選択    決定: 決定    C: ログ",
      cannotFlee:  "主からは逃げられない!",
      // 状態を見る
      inspectNone: "状態異常なし",
      turnsLeft:   "あと{n}ターン",                        // n
      turnsLasting:"治すまで続く",
      hintInspect: "←→: 別の相手を見る    決定/Esc: 戻る",

      commandFor:  "{name} は どうする?",                    // name
      selectTarget:"だれに?",
      selectSkill: "どの技?",
      // 技の並べ方（Q/E で切り替え。2026-10-15）
      skillSortTitle: "並び",
      skillSortModes: { learned: "覚えた順", role: "働きごと", kind: "種類ごと", element: "属性ごと" },
      skillSortHint:  "Q/E: 並び替え",
      skillStats:  "威力{power}　命中{accuracy}%　PP{pp}",   // power, accuracy, pp
      // ダメージを与えない技（回復・バフ／デバフ・状態異常だけ）。威力を並べない
      skillStatsNoPower: "命中{accuracy}%　PP{pp}",          // accuracy, pp
      // 技の範囲の札（v1.4.0。技の target ごと）
      targetLabels: { enemy: "敵1体", allEnemies: "敵全体", ally: "味方1体", allAllies: "味方全体", self: "自分" },
      // 技の効き目（v1.4.0）。スカウトしたことのある種族の敵だけ。listMark は技の一覧の印
      effectMarks: { weak: "◎ よく効く", resist: "△ 効きにくい", immune: "× 効かない", listMark: "◎" },
      // 戦闘のログ（v1.4.0）
      logTitle:    "戦闘のログ",
      logStart:    "― 戦いのはじまり ―",
      logTurn:     "― {n}ターン目 ―",                     // n
      logEmpty:    "まだ何も起きていない",
      logPosition: "{from}-{to} / {total}",
      logHint:     "↑↓: 1行ずつ    ←→: 1画面ずつ    ホイールでも送れる    決定/Esc/C: 閉じる",
      selectItem:  "どの道具?",
      noItems:     "使える道具がない",
      notEnoughPp: "PPが足りない!",
      noReviveTarget: "倒れた仲間がいない",

      // 掛かっている強化・弱体の印は絵で出す（data/ui.js の icons、data/sprites_icons.js）

      itemUsed:    "{actor} は {item} を使った!",            // actor, item
      // 効果の種類ごとに文を分ける（持ち物画面の used と同じ考え方）
      itemHealed: {
        healHp:     "{name} の HPが {amount} 回復した!",     // name, amount
        healPp:     "{name} の PPが {amount} 戻った!",       // name, amount
        cureStatus: "{name} の 状態異常が治った!",            // name
        revive:     "{name} は 起き上がった!",                // name（神鳥の羽。v1.0.0）
        default:    "{name} に効果があった"                  // name
      },
      itemNoEffect:"しかし 効果がなかった",
      // 選んだ相手が、使う番までに倒されていた（道具は減らない）
      itemTargetFainted: "しかし {name} は 倒れていた",       // name
      // 交代（その仲間のこのターンの行動になる）。
      // 倒れた仲間は自動では下がらない。次のターンに交代だけ選べる
      commandFainted: "{name} は 倒れている",               // name
      selectSwap:  "だれと交代する?",
      noReserve:   "控えの仲間がいない",
      swapped:     "{out} は 下がり {in} が 前に出た!",       // out, in
      swapFailed:  "交代できなかった",
      hintSwap:    "↑↓: 選ぶ    決定: 交代    Esc: 戻る",
      // 作戦（v1.0.0）。ターンの頭の「作戦」→ 仲間を選ぶ → 作戦を選ぶ
      selectTacticMember: "だれの作戦を変える?",
      selectTactic:       "{name} の作戦は?",                 // name
      tacticCurrent:      "いま",
      hintCommand: "↑↓: 選択    決定: 決定    Esc: 前の仲間へ    C: ログ",
      // 相手は横一列に並んでいるので、左右で選ぶ
      hintTarget:  "←→: 相手を選ぶ    決定: 決定    Esc: 戻る"
    },

    title: {
      // 題字の下の副題。いまは出していない（書けば data/ui.js の title.subtitle の位置に出る）
      newGame:  "新しく始める",
      continue: "続きから",
      // 探索を中断したファイルがあるときだけ出る
      resume:   "中断したところから",
      // バージョン表記の隣のアイコン。カーソルを乗せたときだけ出す
      patchNote:"パッチノート",
      // メニューの下の1行（v1.4.0）。保存した日時がいちばん新しいファイル。{time} はプレイ時間
      lastPlayed: "前回：スロット{slot}  {name}  ・  {time}",
      hint:     "↑↓: 選択    決定: Enter / Space / Z",
      // 左下のクレジット1件ぶん。{label} {name} {url} は data/audio.js の credits から
      credit:   "{label}：{name} {url}",

      // いまは使っていない（v1.3.1 から、3つとも空でも「続きから」の一覧へ進み、ファイルから読み込める）
      noSaveAny: "セーブデータがありません"
    },

    /** パッチノート（更新履歴） */
    patchNote: {
      title:     "パッチノート",
      subtitle:  "これまでの更新",
      empty:     "このバージョンはまだ開発中です。",
      hintList:  "↑↓: バージョン    →/決定: 内容を読む    Esc: 戻る",
      hintNotes: "↑↓: 読み進める    ←: バージョン一覧へ    Esc: 戻る"
    },

    save: {
      saved:           "セーブしました",
      unavailable:     "このブラウザではセーブできません",
      error:           "セーブに失敗しました",
      loaded:          "セーブデータを読み込みました",
      empty:           "セーブデータがありません",
      broken:          "セーブデータが壊れています",
      versionMismatch: "セーブデータの形式が古いです"
    },

    /**
     * 物語の場面（js/scenes/StoryScene.js）。
     * draft は、文章がまだ仮の場面（data/story.js の draft: true）で右上に出る印。
     */
    story: {
      hint:        "Enter・クリック: 次へ    Esc: 飛ばす",
      choiceHint:  "↑↓: 選ぶ    Enter・クリック: 決める    Esc: 飛ばす",
      skipConfirm: "もう一度 Esc で飛ばす",
      draft:       "（仮の文章）"
    },

    /**
     * 拠点（ホーム）画面。
     * comingSoon は、まだ実装していない項目を選んだときの表示。
     */
    home: {
      title:      "拠点",
      // 拠点の名前はまだ決まっていない（ストーリー構成.md の 8）。決まったら subtitle に書く
      gold:       "所持金 {amount}G",                       // amount
      dungeon:    "ダンジョンへ潜る",
      party:      "仲間",
      shop:       "ショップ",
      craft:      "工房",
      blessing:   "加護を選ぶ",
      items:      "持ち物",
      dex:        "図鑑",
      help:       "遊び方",
      save:       "セーブ",
      settings:   "設定",
      comingSoon: "{name} は準備中",                        // name
      locked:     "{name} は {required} をクリアすると使える", // name, required
      lockedShort:"{name} はまだ使えない",                   // name
      statusTitle:"パーティ",
      emptyParty: "仲間がいない",
      // メニューの右端に出す札（何かあるときだけ）
      //   badgeCraft … いまの素材とお金で作れるものがある
      //   badgeShop  … 前に店を開いたときより、並ぶ品が増えた
      //   badgeDex   … 前に図鑑を開いたときより、記録が増えた
      // 仲間の一覧の経験値のバーの右に出す数字（次のレベルまで）。レベル上限なら expMax
      expLeft:    "あと {n}",
      expMax:     "MAX",
      badgeCraft: "作れる",
      badgeShop:  "新入荷",
      badgeDex:   "NEW",
      // メニューの下のひと言（v1.4.0）。キーはメニューの value（data/home.js）。26文字くらいまで
      descriptions: {
        dungeon:  "穴の区画を選んで潜る。",
        party:    "仲間の並び・装備・作戦を決める。預かり所もここ。",
        shop:     "道具・装備・素材を売り買いする。",
        craft:    "拾った素材から、道具や装備を作る。",
        blessing: "潜ったとき選択肢に出す加護を決める。",
        items:    "持っている道具を使う。装備も見比べられる。",
        dex:      "出会ったモンスターや手に入れた品の記録。",
        help:     "困ったときに読む。",
        save:     "いまの進み具合をファイルに残す。",
        settings: "音・表示・操作キーなど。"
      },
      // ひと言の下の「いまの様子」（v1.4.0。HomeScene._buildMenuInfo）
      info: {
        nextDungeon:        "次は {name}（推奨Lv{level}）",   // name, level
        nextDungeonNoLevel: "次は {name}",                    // name
        allCleared:         "開いている区画は、すべてクリアした",
        party:              "連れている仲間 {n}/{max}　預かり所 {stored}",  // n, max, stored
        craft:              "いまの素材で作れるもの {n}",       // n, total
        craftNone:          "いまの素材で作れるものは無い",     // total
        shopNew:            "新しく並んだ品がある",
        blessing:           "編成 {active}/{max}",              // active, max
        items:              "持ち物 {n} 種類",                  // n
        dex:                "出会ったモンスター {seen}　仲間にした {caught}", // seen, caught
        save:               "いまのファイル：スロット{n}"        // n
      },
      hint:       "↑↓: 選択    決定: 決定    Esc: タイトルへ",
      // Esc でタイトルへ戻る前の確認。既定は「いいえ」
      toTitleTitle: "タイトルに戻りますか？",
      toTitleBody:  "セーブしていない進行は失われます",
      toTitleNote:  "※ 残したいときは先に「セーブ」を",
      toTitleYes:   "はい",
      toTitleNo:    "いいえ",
      toTitleHint:  "↑↓: 選択    決定: 決定    Esc: やめる"
    },

    /**
     * 主人公の名前と服の色を決める画面。
     * 新しく始めるときと、あとから設定で変えるときの両方で使う。
     */
    playerSetup: {
      titleNew:  "あなたのこと",
      titleEdit: "名前と見た目",
      subtitle:  "あとから設定でいつでも変えられます",

      nameLabel:  "なまえ",
      nameAction: "決定で変える",
      nameTitle:  "あなたの名前を決める",
      colorLabel: "ふくの色",
      genderLabel: "性別",
      firstPersonLabel: "一人称",
      // 新しい絵（v1.2.0）のときだけ出る欄
      hairLabel: "髪型",
      hairColorLabel: "髪の色",
      pantsLabel: "ズボンの色",
      accLabel: "飾り",
      accColorLabel: "飾りの色",
      accColorOriginal: "もとの色",   // 飾りの色のいちばん左の見本の名前

      start: "この姿で始める",
      apply: "この内容にする",

      // v1.4.0：右の欄の見出し・左の姿の下・下のひと言
      sectionYou:  "あなた",
      sectionLook: "見た目",
      facingLabels: ["↓", "←", "↑", "→", "自動"],   // 左の姿の向きの札（Q/E で送る）
      profile: "{gender}・一人称「{me}」",
      mapSizeLabel: "冒険中の大きさ",
      descriptions: {
        name:        "物語や会話で呼ばれる名前。8文字まで。決定で文字盤を開く",
        gender:      "体つきが変わる。ゲームの進み方には影響しない",
        firstPerson: "物語の台詞で、あなたが自分を呼ぶときの言葉",
        hair:        "髪の形。どちらの性別でも、どの髪型でも選べる",
        hairColor:   "髪の色。いちばん右の「＋」で、好きな色を作れる",
        color:       "ふく（上着）の色。いちばん右の「＋」で、好きな色を作れる",
        pants:       "ズボンの色。いちばん右の「＋」で、好きな色を作れる",
        acc:         "飾りは、いくつでも着けられる。決定で着ける／外す",
        accColor:    "上の欄で選んでいる飾りの色。左端は、その飾りのもとの色",
        doneNew:     "この姿で冒険を始める。名前と見た目は、あとから拠点の「設定」で変えられる",
        doneEdit:    "この内容にする。Esc なら、変えずに戻る"
      },

      // 自分で色を作る（色見本のいちばん右）
      // 色見本の「じぶんで」（右下に＋の付いた見本）を選んでいるときの案内
      hintCustom:    "↑↓: 選択    ←→: 色を選ぶ    決定: この色を作り直す",
      editorTitle:   "ふくの色を作る",
      editorTitleHair:  "髪の色を作る",
      editorTitlePants: "ズボンの色を作る",
      editorTitleAcc:   "{acc}の色を作る",   // {acc} に飾りの名前が入る
      hueLabel:      "色合い",
      satLabel:      "あざやかさ",
      lightLabel:    "明るさ",
      editorOk:      "決める",
      editorCancel:  "やめる",
      hintEditor:    "↑↓: 選ぶ    ←→: 動かす（押し続けると速く）    決定: 決める    Esc: やめる",

      // 飾りの欄にいるとき（いくつでも着けられる）
      hintAcc:  "↑↓: 選択    ←→: 飾りを選ぶ    決定: 着ける／外す",
      // 飾りの色の欄。色を選ぶと、その飾りを着ける
      hintAccColor: "←→: 色を選ぶ（左端はもとの色）    色を変える飾りは、上の欄で選ぶ",

      hintNew:  "↑↓: 選択    ←→: 選ぶ    決定: 決定    Q / E: 向き    R: おまかせ",
      hintEdit: "↑↓: 選択    ←→: 選ぶ    決定: 決定    Q / E: 向き    R: おまかせ    Esc: 戻る"
    },

    /**
     * セーブファイルを選ぶ画面。
     * 「新しく始める」と「続きから」の両方がここを通るので、
     * 見出しと問いかけだけを場合ごとに分けている。
     */
    saveSlot: {
      titleNew:      "どこに記録しますか",
      subtitleNew:   "選んだファイルに、この冒険が記録されます",
      titleContinue: "つづきから",
      subtitleContinue: "遊ぶファイルを選んでください",
      // 拠点のセーブ。書き込む先を選ぶ（いま遊んでいるファイルが最初に選ばれている）
      titleSave:     "どこにセーブしますか",
      subtitleSave:  "いま遊んでいるのは スロット{n} です",   // n
      // 中断したところから再開する
      titleResume:    "中断したところから",
      subtitleResume: "再開するファイルを選んでください",

      slotLabel: "スロット{n}",                      // n
      empty:     "空き",
      broken:    "読み込めません（形式が違います）",
      // 2行目は仲間の絵を並べたあとに続ける（v1.4.0。「ほか{rest}体」は絵で分かるので外した）
      party:     "{name} Lv{level}",                 // name, level（rest も使える）
      status:    "{gold}G",   // gold。クリアした区画の数は出さない（作者の指定 2026-11-13）
      place:     "{name} B{floor}F",                 // name, floor
      atHome:    "拠点",
      // 合計プレイ時間。1時間未満は「12分」、それ以上は「3時間45分」
      playTime:     "{h}時間{m}分",                  // h, m
      playTimeMin:  "{m}分",                         // m
      // 探索を中断したところがあるファイル
      suspended: "中断中: {name} B{floor}F",         // name, floor

      // 選べないスロットを選ぼうとしたとき
      emptyNote:  "このファイルにはデータがありません",
      brokenNote: "このファイルは読み込めません",

      // 確認（はい／いいえ）。上書きになるときだけ文を変える
      confirmNew:           "スロット{n} で始めますか?",            // n
      confirmNewBody:       "このファイルに記録していきます",
      confirmOverwrite:     "スロット{n} を上書きします",           // n
      confirmOverwriteBody: "{name} Lv{level} のデータが消えます",  // name, level
      confirmNote:          "※ 消したデータは戻せません",
      confirmLoad:          "スロット{n} で遊びますか?",            // n
      confirmLoadBody:      "{name} Lv{level} から再開します",      // name, level
      // 拠点のセーブ。別のファイルに中身があるときは「上書き」の文を使う
      confirmSave:          "スロット{n} にセーブしますか?",         // n
      confirmSaveBody:      "いまの状態を記録します",
      // 中断からの再開
      confirmResume:        "スロット{n} の続きを再開しますか?",     // n
      confirmResumeBody:    "{place} から再開します",                // place
      confirmResumeNote:    "※ 再開すると中断したところは消えます",
      yes: "はい",
      no:  "いいえ",

      /**
       * --- ファイルの整理（コピー・移動・削除）---
       * 「つづきから」の一覧で Q/E を押すと入る。
       */
      titleManage:    "ファイルの整理",
      subtitleManage: "コピー・移動・削除・ファイルへの書き出しができます",
      titleCopyTo:    "どこにコピーしますか",
      titleMoveTo:    "どこへ移しますか",
      subtitlePick:   "スロット{n} の行き先を選んでください",   // n

      // 画面右下のボタン（マウスだけの人のための出入り口）
      manageButton:     "整理する",
      manageButtonExit: "整理をやめる",

      actionTitle:  "スロット{n} をどうしますか",              // n
      actionCopy:   "コピーする",
      actionMove:   "移動する",
      actionDelete: "削除する",
      actionExport: "ファイルに書き出す",
      actionBack:   "やめる",

      /**
       * --- ファイルへの書き出しと読み込み（v1.3.1）---
       * 書き出しは整理のメニューから。読み込みは「つづきから」の一覧のボタンか L キー。
       */
      importButton:          "ファイルから読み込む",
      subtitleContinueEmpty: "データがありません。書き出したファイルから読み込めます",
      titleImportTo:   "どこに読み込みますか",
      subtitleImport:  "{name} Lv{level} のファイルを入れる先を選んでください",   // name, level
      confirmImport:   "スロット{to} に読み込みますか?",                       // to
      exported:     "書き出しました（ダウンロードの場所を見てください）",
      imported:     "読み込みました",
      importBroken: "このファイルは読み込めません",
      importVersion:"形式が違うので読み込めません",
      unavailable:  "この環境ではセーブを使えません",

      sameSlotNote: "同じファイルは選べません",

      confirmDelete:      "スロット{from} を削除しますか?",           // from
      confirmDeleteBody:  "このファイルのデータが消えます",
      confirmCopy:        "スロット{from} をコピーしますか?",         // from
      confirmMove:        "スロット{from} を移しますか?",             // from
      // 行き先が空きのとき／中身があるとき
      confirmPlainBody:   "スロット{to} に入れます",                  // to
      confirmReplaceBody: "スロット{to} の {name} Lv{level} が消えます", // to, name, level

      // 結果の知らせ（SaveManager が返す reason をそのまま引く）
      copied:  "コピーしました",
      moved:   "移しました",
      deleted: "削除しました",
      sameSlot:"同じファイルは選べません",
      error:   "うまくいきませんでした",

      hint:           "↑↓: 選択    決定: 決定    Esc: タイトルへ",
      hintSave:       "↑↓: 選択    決定: ここにセーブ    Esc: 拠点へ",
      hintWithManage: "↑↓: 選択  決定: 遊ぶ  Q/E: 整理  L: 読み込む  Esc: 戻る",
      hintImportOnly: "L: ファイルから読み込む    Esc: タイトルへ",
      hintManaging:   "↑↓: 選択  決定: このファイルを整理  Q/E: やめる  L: 読み込む",
      hintAction:     "↑↓: 選択    決定: 決定    Esc: やめる",
      hintPick:       "↑↓: 行き先を選ぶ    決定: 決定    Esc: 戻る",
      hintConfirm:    "↑↓: 選択    決定: 決定    Esc: やめる"
    },

    /**
     * 初めての場面で出る説明（ふきだし）。
     * 中身は data/tutorial.js。ここは操作の案内だけ。
     *
     * ★ Esc の案内を必ず出すこと。「いつでもやめられる」ことが分からないと、
     *   説明を邪魔だと感じた人の逃げ道が無くなる。
     */
    tutorial: {
      hintMore: "決定: 次へ（残り{count}）    Esc: これ以降は出さない",  // count
      hintLast: "決定: 閉じる    Esc: これ以降は出さない"
    },

    /**
     * 遊び方（よくある質問）。
     * 質問と答えそのものは data/help.js が持つ。ここは画面まわりだけ。
     */
    help: {
      title:    "遊び方",
      subtitle: "困ったときに読む",
      // 答えの送りは Q/E。↑↓ は質問を選ぶのに使っているため。{extra} は答えが入りきらないときだけ hintScroll
      hint:     "↑↓: 質問を選ぶ{extra}   Esc: 戻る",
      hintScroll: "   Q/E・ホイール: 答えを送る",
      // 右の上の欄（v1.4.0）
      position: "{n} / {total} 問目"            // n, total（その分類の中で）
    },

    /** ショップ */
    shop: {
      title:        "ショップ",
      tabBuy:       "買う",
      tabSell:      "売る",
      owned:        "所持 {count}",                         // count
      effectLabel:  "効果",
      // 右の説明（v1.4.0）
      ownedSell:    "所持 {count}　売値 {price}G",           // count, price（売る一覧）
      compareLabel: "仲間がつけると",                        // 装備の、連れている仲間ごとの変わり方
      compareWorn:  "装備中",
      compareNone:  "能力は変わらない",
      compareNoSlot:"つけられない",
      compareSwap:  "{name} と入れ替え",                     // name（いまの装備）
      usedInLabel:  "使い道（工房）",                        // 素材などを使うレシピ（いま並んでいるものだけ）

      // 買うときの確認（個数 → はい／いいえ）
      countLabel:   "個数",
      maxCount:     "最大 {max}個まで",                      // max
      unitPrice:    "1個 {price}G",                          // price
      unitSellPrice:"1個 {price}Gで売れる",                  // price
      totalLabel:   "合計",
      afterGold:    "買うと残り {amount}G",                  // amount
      afterGoldSell:"売ると {amount}G になる",               // amount
      confirmBuy:   "{name} を{count}個 {price}Gで買いますか?", // name, count, price
      confirmSell:  "{name} を{count}個 {price}Gで売りますか?", // name, count, price
      yes:          "はい",
      no:           "いいえ",

      bought:       "{name} を{count}個 {price}Gで買った",    // name, count, price
      sold:         "{name} を{count}個 {price}Gで売った",    // name, count, price
      notEnoughGold:"お金が足りない",
      // ★ 持ち物の種類数に上限は無い（枠が埋まって買えないことは起きない）。
      //   出るのは「その品を持てる数（items.js の maxStack）」に達したときだけ
      stackFull:    "これ以上は持てない",
      cannotSell:   "これは売れない",
      notOwned:     "持っていない",
      noStock:      "並んでいる品物がない",
      nothingToSell:"売れるものがない",
      // 加護を売る店（data/shop.js の type: "blessing"）
      //   ★ ここは owned にしないこと。上の owned（"所持 {count}"）と
      //     同じ名前で二重に書いてあり、こちらが勝って
      //     品物の説明欄の「所持 3」から個数が消えていた
      blessingOwned:  "所持",
      blessingPrice:  "{price}G",                        // price
      // 買ったあと、いま選択肢に入っているかどうか（入れておける数に上限がある）
      blessingActive:   "選択肢に入っている",
      blessingInactive: "外している（拠点で入れ替える）",
      noBlessings:    "売り物がない",
      confirmBlessing:"{name} を {price}Gで買いますか?",   // name, price
      blessingBought: "{name} を {price}Gで手に入れた",   // name, price
      // 選択肢に入れておける数がいっぱいのとき、続けて出す
      blessingFull:   "（選択肢がいっぱい。拠点で入れ替える）",
      already:        "もう持っている",
      notForSale:     "これは売り物ではない",
      // {extra} には、絞り込みがあるとき hintFilter が入る（v1.4.0）
      hint:         "↑↓: 選択   ←→: 買う / 売る{extra}   決定: 決定   Esc: 戻る",
      // 2軒以上開いているときだけ、店の移動を案内する
      hintShops:    "↑↓: 選択   ←→: 買う/売る   Q/E: 店を変える{extra}   決定: 決定   Esc: 戻る",
      hintFilter:   "   F: 絞り込み",
      // 絞り込み（v1.4.0）。札は「≡ 素材・苔むす坑道」
      filterLabel:  "≡ {name}",                 // name
      filters: { all: "すべて", use: "回復・道具", weapon: "武器", armor: "防具", accessory: "アクセサリー", material: "素材" },
      filterSource: "素材・{name}",              // name（手に入る場所。恒常素材も）
      // 数字の左右に ◀▶ が出ているので、左右が1個ずつ・上下がまとめて
      hintQuantity: "←→: 1個ずつ    ↑↓: 10個ずつ    決定: 確認へ    Esc: やめる",
      hintConfirm:  "↑↓: 選択    決定: 決定    Esc: 個数へ戻る"
    },

    /** 工房（素材から作る） */
    craft: {
      title:        "工房",
      subtitle:     "拾った素材から道具を作る",
      materialLabel:"必要な素材",
      costLabel:    "費用",
      effectLabel:  "効果",
      // 右の上の欄（v1.4.0）。count は持っている数
      ownedLabel:   "所持 {count}",
      // 足りない素材の下の「▶ 手に入る場所」。押すか C で開くと、図鑑と同じ中身が並ぶ（v1.4.0。中身の文は messages.dex）
      sourcesLabel: "手に入る場所",
      sourceNone:   "まだ分かっていない",
      empty:        "まだ作れるものがない",
      emptyFiltered:"当てはまるものがない",
      // 絞り込み（←→ か F で切り替え。2026-11-09）
      filterLabel:  "絞り込み：{name}  F",
      filters:      { all: "すべて", ready: "作れるもの", use: "道具", weapon: "武器", armor: "防具", accessory: "アクセサリー" },
      crafted:      "{name} を{count}個 作った!",            // name, count
      notEnoughMaterial:"素材が足りない",
      notEnoughGold:"お金が足りない",
      // 買うときと同じで、出るのは maxStack に達したときだけ
      stackFull:    "これ以上は持てない",
      yes:          "はい",
      no:           "いいえ",
      // {extra} には、足りない素材があれば hintSources、右の説明が入りきらなければ hintScroll が入る（v1.4.0）
      hint:         "↑↓: 選択   ←→/F: 絞り込み{extra}   決定: 作る   Esc: 戻る",
      hintSources:  "   C: 手に入る場所",
      hintScroll:   "   Q/E: 送る",
      hintConfirm:  "↑↓: 選択    決定: 決定    Esc: やめる"
    },

    /** 加護を選ぶ画面（拠点） */
    blessingSelect: {
      title:      "加護を選ぶ",
      subtitle:   "潜ったときに選択肢へ出る加護を決める",
      count:      "編成 {active}/{max}",           // active, max
      markOn:     "◆ ",   // 入れている加護の印
      markOff:    "◇ ",   // 外している加護の印
      rowOn:      "入れている",
      rowOff:     "外している",
      rarityLabel:"出やすさ",
      stateOn:    "選択肢に入れている",
      stateOff:   "選択肢から外している",
      effectLabel:"効果",
      // 一覧の等級の見出し（v1.4.0）。右に「入れている数/持っている数」
      tierHeader: "- {name}（{rate}%） -",           // name, rate
      tierHeaderRight: "{on}/{all}",                 // on, all
      // 等級ごとの編成数。0個の等級があると、その枠は選択肢に出てこない
      tierLabel:  "等級ごとの編成",
      tierName:   "{name}  {rate}%",                 // name, rate
      tierCount:  "{count}個",                       // count
      tierEmptyNote: "0個の等級があると、その枠は選択肢に出てこない。",
      // 絞り込み（v1.4.0）
      filterLabel: "≡ {name}",                       // name
      filters: { all: "すべて", on: "入れているもの", off: "外しているもの" },
      emptyFiltered: "当てはまる加護がない",
      hintScroll: "   Q/E: 送る",
      turnedOn:   "{name} を選択肢に入れた",       // name
      turnedOff:  "{name} を選択肢から外した",     // name
      // 上限に達しているとき。どれかを外してから、と伝える
      full:       "編成は{max}個まで。どれかを外してから入れる",  // max
      notOwned:   "まだ持っていない",
      empty:      "持っている加護がない",
      // {extra} には、右の説明が入りきらないとき hintScroll が入る
      hint:       "↑↓: 選択   決定: 入れる / 外す   F: 絞り込み{extra}   Esc: 戻る"
    },

    /** 設定画面 */
    settings: {
      // 別の画面を開く項目（type: "action"）を選んでいるときに出す案内
      openAction: "決定で開く",
      title:        "設定",
      subtitle:     "ゲームの設定と操作キーの確認",
      volumeTitle:  "ゲーム設定",
      keysTitle:    "操作キー",
      hint:         "↑↓: 選択    ←→: 変更    Q/E・ホイール: 操作キーを送る    Esc: 戻る",
      saved:        "設定を保存しました",
      saveFailed:   "設定を保存できませんでした"
    },

    /** 持ち物画面 */
    items: {
      title:       "持ち物",
      subtitle:    "所持しているアイテム",
      empty:       "何も持っていない",
      countLabel:  "所持数",
      // 種類数に上限は無いので、持っている数だけを出す
      slotsLabel:  "{used}種類",                     // used
      selectTarget:"だれに使う?",
      // 相手を選んでいる間、選んだ道具と残りの数を出す（続けて使えるので。2026-11-09）
      targetItem:  "{item}  のこり {count}",              // item, count
      /**
       * 使ったあとの知らせ。**効果の種類ごとに文を分ける**。
       * 種類は data/items.js の effect.type（js/systems/ItemUsage.js が処理する）。
       *
       * ★ 以前は1つの文しか無く、精気の実（PP回復）でも
       *   「HPが 5 回復した!」と出てしまっていた。
       * 新しい効果を足したら、ここにも1行足す。書かなければ default が使われる
       */
      used: {
        healHp:     "{name} の HPが {amount} 回復した!",  // name, amount
        healPp:     "{name} の PPが {amount} 戻った!",    // name, amount
        cureStatus: "{name} の 状態異常が治った!",         // name
        revive:     "{name} は 起き上がった!",             // name（神鳥の羽。v1.0.0）
        default:    "{name} に {item} を使った"           // name, item
      },
      usedAlone:   "{item} を使った",                   // item（相手を選ばないもの）
      noEffect:    "しかし 効果がなかった",
      // 倒れている仲間には使えない（蘇生の道具だけは別）
      targetFainted: "{name} は 倒れていて 使えない",       // name
      // 蘇生の道具を、倒れていない仲間に使おうとした（v1.0.0）
      notFainted:  "{name} は 倒れていない",               // name
      cannotUse:   "ここでは使えない",
      // 右の説明（v1.4.0）
      ownedLabel:  "所持 {count}",                     // count
      sellLabel:   "　売値 {price}G",                  // price（売れるものだけ、所持の後ろに続ける）
      useLabel:    "使うと",
      useTexts: {
        healHp:     "HPが {value} 回復する",           // value
        healPp:     "PPが {value} 戻る",               // value
        cureStatus: "{names} を治す",                  // names（状態異常の名前）
        revive:     "倒れた仲間が HP{percent}% で起き上がる", // percent
        escape:     "ダンジョンから拠点へ帰る"
      },
      usableInLabel: "使える所：{where}",               // where
      sceneNames:  { home: "拠点", dungeon: "探索中", battle: "戦闘" },
      usableHere:  "ここで使える",
      notUsableHere: "ここでは使えない",
      effectLabel: "効果",
      compareLabel:"仲間がつけると",
      usedInLabel: "使い道（工房）",
      sourcesLabel:"手に入る場所",
      sourceNone:  "まだ分かっていない",
      // {extra} には、右の説明が入りきらないとき hintScroll が入る
      hintList:    "↑↓: 選択   C: 手に入る場所{extra}   決定: 使う   Esc: 戻る",
      hintScroll:  "   Q/E: 送る",
      hintTarget:  "↑↓: 相手を選ぶ    決定: 使う（続けて使える）    Esc: 一覧へ"
    },

    /** 図鑑画面 */
    /** 名前をつける文字盤 */
    naming: {
      titleRename: "{name} の名前を決める",   // name（いまの名前・新規につけるときも同じ）
      // 2026-10-27 キーボードで打つ形にした。{max} は最大文字数
      hint:        "キーボードで入力（漢字・英字も使える。{max}文字まで）\nEnter: 決める    Esc: やめる    ↓: ボタンへ",
      fieldLabel:  "名前",
      done:        "けってい",
      cancel:      "やめる",
      renamed:     "{old} は {new} になった!", // old, new
      keptName:    "名前はそのままにした。"
    },

    dex: {
      // 栞（表の切り替え）の名前
      tabMonsters:  "モンスター",
      tabItems:     "アイテム",
      tabAbilities: "特性",
      tabSkills:    "技",
      tabNatures:   "性格",
      tabBlessings: "加護",
      totalLabel:   "全",
      rarityLabel:  "出やすさ: ",
      effectLabel:  "効果",
      natureNote:   "性格は仲間になったときに決まり、あとから変わらない。",
      blessingNote: "加護はダンジョンで階を降りるたびに選ぶ。その挑戦のあいだだけ効く。",
      // 謎の商人から買うまで伏せておく加護の説明
      blessingLockedNote: "まだ手にしていない加護。買えば選択肢に混ざるようになる。",
      unknownAbility: "まだ見たことがない特性。",
      unknownSkill: "まだ見たことがない技。",
      ownerLabel:   "持っているモンスター",
      learnerLabel: "覚えるモンスター",
      // 絆の報酬で覚える技（専用技）は、レベルの代わりにこう出す
      learnByBond:  "絆で覚える",
      powerLabel:   "威力",
      powerNormal:  "通常攻撃と同じ",
      skillKindLabel: "種類",
      modifierLabel:"効果",
      durationLabel:"{n}ターン",       // n
      selfTarget:   "（自分にかける）",
      // 状態異常をあたえる技。確率は相手の耐性で下がるので、そのことも添える
      statusLabel:  "状態異常",
      statusNote:   "相手の耐性で通りにくくなる",
      ppLabel:      "消費PP",
      accuracyLabel:"命中",
      // 使う回復の技の回復量の倍率（healDealt。粘晶のネックレス）。「回復の技 ×1.2」と出る
      healDealtLabel: "回復の技",
      criticalLabel:"クリティカル",
      knownLabel:   "判明",
      unknownName:  "???",
      unknownDesc:  "まだ出会っていない。",
      unknownItem:  "まだ手に入れていない。",
      seenLabel:    "発見",
      caughtLabel:  "仲間",
      obtainedLabel:"入手",
      elementLabel: "属性",
      scoutLabel:   "スカウト率",
      resistanceLabel: "耐性",
      // アイテムの出どころ（落とすモンスター・宝箱）。会っていない相手は名前と確率を伏せる
      sourceLabel:  "手に入る場所",
      sourceNone:   "まだ分かっていない",
      sourceDrop:   "{name}  {rate}%",       // name, rate
      // 区画で落とす確率が違う種族（data/dungeons.js の dropOverrides）は区画の名前を添える
      sourceDropAt: "{name}（{area}）  {rate}%",   // name, area, rate
      sourceChest:  "宝箱（どこでも）",
      sourceChestAt:"宝箱（{name}）",         // name
      // 落とすもの。一度仲間にすると、その種族から取れるものが全て見える
      dropLabel:    "落とすもの",
      // 区画で落とす確率が違う種族だけ、区画ごとに分けて見出しを付ける
      dropAreaLabel:"〈{area}〉",               // area
      notCaught:    "（未加入）",
      // 愛情度で書き足される記録の見出し。stage は段階の名前（慣れ・信頼・絆）
      recordLabel:  "― {stage} ―",
      // --- モンスターの表（見開きの本。v1.4.0） ---
      numberLabel:   "No.",
      bookUnknownName: "？？？",                  // まだ出会っていない相手の名前
      bookUnknownMark: "？",                      // 絵・能力・耐性の、まだ分からない所
      bookNotCaughtNote: "仲間にすると、くわしく書きこめる。",   // 出会っただけの相手の、説明の代わり
      recordUnknown: "？？？",                    // まだ読めない記録・落とすもの・特性
      statsLabel:    "能力",
      maxLevelShort: "Lv上限",
      abilityLabel:  "特性",
      abilityRecordLabel: "― 特性：{name} ―",    // name。左のページの最後に、特性の説明を書く
      dropNone:      "なし",
      hintBook:      "←→: めくる    Q/E: 栞    ↑↓: 記録を送る    R: 並べ替え    Esc: 戻る",
      // 落とすものが区画で違う種族を開いているとき
      hintBookDrops: "←→: めくる    Q/E: 栞    ↑↓: 記録を送る    決定: 落とすものの続き    R: 並べ替え",

      // --- ほかの表（左のページに一覧・右のページに説明） ---
      ownedLabel:    "所持 {n}",               // n
      sellLabel:     "売値 {g}G",              // g
      sellNone:      "売れない",
      sourceShop:    "{shop}で買える",          // shop。いま並んでいる店だけ
      sourceCraft:   "工房で作れる",            // いま作れるレシピだけ。下に材料が並ぶ
      usedInLabel:   "使い道（工房）",          // これを材料にして作れるもの
      usedCount:     "{n}個使う",              // n
      // 技の「当たる相手」の札（data/skills.js の target）
      targetNames:   { enemy: "敵1体", allEnemies: "敵全体", self: "自分", ally: "味方1体", allAllies: "味方全体" },
      natureUp:      "{stat}↑",                // stat
      natureDown:    "{stat}↓",                // stat
      natureFlat:    "補正なし",
      natureMembersLabel: "この性格の仲間",     // 連れている仲間と預かり所
      natureMembersNone:  "いない",
      hint:          "↑↓: 選択    Q/E: 栞    Esc: 戻る",
      hintScrollable:"↑↓: 選択    Q/E: 栞    決定: 説明を読む    Esc: 戻る",
      hintDetail:    "↑↓: 説明をスクロール    決定/Esc: 一覧へ戻る",
      // 並べ方の札（モンスター・アイテム・技の表。R か、札を押して切り替え）
      sortLabel:     "並び：{mode}",          // mode
      sortModes:     { family: "系統ごと", element: "属性ごと", kind: "種類ごと", role: "働きごと", category: "分類ごと", price: "値段順", name: "名前順", order: "図鑑の順" },
      hintSkills:    "↑↓: 選択    Q/E: 栞    R: 並べ替え    Esc: 戻る",
      hintSkillsScrollable: "↑↓: 選択    Q/E: 栞    R: 並べ替え    決定: 説明を読む    Esc: 戻る"
    },

    /** ダンジョン選択画面 */
    dungeonSelect: {
      title:      "ダンジョン",
      subtitle:   "挑む場所を選ぶ",
      floorsLabel:"最深 B{floors}F",           // floors
      // 推奨レベル（初めて入るときの目安。data/dungeons.js の recommendedLevel）
      recommendedLabel: "推奨Lv{level}",       // level
      cleared:    "クリア済",
      locked:     "未開放",
      lockedHint: "{name} をクリアすると挑める", // name
      // まだ開放されていない場所は、名前も雰囲気も伏せる
      unknownName: "？？？",
      monstersLabel:"出現するモンスター",
      dropsLabel: "手に入るもの",
      noDrops:    "まだ分かっていない",
      bossLabel:  "主",
      unknownBoss:"？？？",
      // まだ戦っていないモンスター・まだ手に入れていないもの（出現するモンスター・手に入るもの の欄）
      unknownEntry:"？？？",
      // {extra} には、右の説明が入りきらないとき hintScroll が入る（v1.4.0）
      hint:       "↑↓: 選択   決定: 挑む{extra}   Esc: 穴の一覧へ",
      // 開いている穴が1つだけのとき（穴を選ぶ段が出ない）
      hintSingle: "↑↓: 選択   決定: 挑む{extra}   Esc: 戻る",
      hintScroll: "   Q/E: 送る",
      hintMore:   "   C: ほかも見る",
      // 右の説明（v1.4.0）
      // 出現するモンスター・手に入るものの残り（はじめは先頭の2つだけ。押すか C で開く）
      moreMonsters:     "▶ ほかに{n}体を見る",                  // n
      moreItems:        "▶ ほかに{n}個を見る",                  // n
      foldLabel:        "▼ たたむ",
      countLabel:       "{n}/{total}",                          // n, total（見た数・手に入れた数・クリアした数）
      caughtMark:       "仲間にした",
      underLevel:       "　仲間の最高Lv{best}（あと{diff}）",   // best, diff（上の欄の「最深 B4F」に続ける）
      regionLevelRange: "推奨Lv{min}〜{max}",                    // min, max
      noBoss:           "主なし",
      joiner:           " ・ ",
      // 穴（地方）を選ぶ1段目（v1.0.0）
      regionSubtitle:   "潜る穴を選ぶ",
      regionHint:       "↑↓: 選択   決定: 区画を選ぶ{extra}   Esc: 戻る",
      regionProgress:   "{cleared}/{total} 区画",               // cleared, total
      regionLockedHint: "{region} の主を{count}体記録すると開く", // region, count
      sectionsLabel:    "区画",
      comingSoon:       "準備中",
      comingSoonHint:   "この穴の区画は、まだ準備中。",
      sectionComingSoonHint: "この区画は、まだ準備中。"
    },

    /**
     * 仕掛けマス（data/features.js）を踏んだときの文言。
     *
     * ★ ここのキーは**コードに名前が書かれていない**。
     *   FeatureSystem が仕掛けのidから組み立てて引く。
     *     texts[id]             … 踏んだときの文（chest / spring / trap）
     *     texts[id + "Prompt"]  … 使うか聞く文（confirm: true の仕掛けだけ）
     *     texts[id + "Skipped"] … 使わずにおいたときの文
     *   「どこからも呼ばれていない」と早合点して消さないこと。
     *   仕掛けを増やすときは、同じ並びでキーを足せばコードは触らなくてよい。
     */
    feature: {
      chest:        "宝箱を見つけた!",
      chestGot:     "{name} を {count}個 手に入れた!",     // name, count
      chestFull:    "しかし {name} を持ちきれなかった...", // name
      spring:       "澄んだ泉がわいている。",
      springHealed: "仲間のHPとPPが全回復した!",
      springCured:  "仲間の状態異常が治った!",
      springHealedCured: "仲間のHP・PPが全回復し、状態異常も治った!",
      springFull:   "しかし 誰も疲れていなかった",
      // 使うかどうかを聞くとき（data/features.js の confirm: true）
      //   〇〇Prompt の 〇〇 は仕掛けのid。新しい仕掛けにも同じ書き方で足せる
      springPrompt: "澄んだ泉がわいている。\n水を浴びますか?",
      springSkipped:"泉には手をつけなかった",
      confirmYes:   "使う",
      confirmNo:    "やめておく",
      trap:         "罠を踏んでしまった!",
      trapHit:      "仲間はダメージを受けた!",
      trapNoEffect: "しかし 誰にも当たらなかった"
    },

    /** 階を降りたときに選ぶ加護 */
    blessing: {
      title:      "深淵の加護",
      subtitle:   "1つ選ぶ。この挑戦のあいだだけ、仲間全員に効く",
      ownedHeading: "受けている加護（{n}）",   // n（v1.4.0 で札を並べる枠にした）
      ownedNone:  "まだ無い",
      ownedMore:  "ほか{n}",                  // n
      rarityLabel: "出やすさ ",
      // 選択肢が3つに満たなかったとき。理由を出さないと不具合に見える
      //   （等級を引いてから中身を選ぶので、その等級を編成していないと枠が空になる）
      fewChoices: "編成している加護が偏っているので、選択肢が減っている",
      hint:       "↑↓: 選択    決定: 決める"
    },

    /** 挑戦の結果画面（拠点へ戻る前に出る） */
    result: {
      escaped:     "帰還",
      cleared:     "討伐",
      passed:      "踏破",     // 主のいない区画を出口から抜けた（蔦這う回廊）
      scouted:     "勧誘",
      defeated:    "全滅",
      reached:     "{name}  B{floor}F まで",              // name, floor
      gold:        "手に入れたゴールド  {amount}G",       // amount
      gainedLabel: "持ち帰ったもの",
      lostLabel:   "落としてきたもの",
      nothing:     "何も持ち帰れなかった",
      // はじめてクリアしたときだけ出る。手動セーブのゲームなので、
      // 黙って書き換えると気づけない
      savedNote:   "クリアを記録しました（セーブ済み）",
      toHome:      "拠点へ",
      // 右の欄（v1.4.0）
      partyLabel:     "仲間",
      levelUp:        "Lv{before} → Lv{after}",   // before, after
      joinedLabel:    "仲間になった",
      blessingsLabel: "受けていた加護",
      hint:        "↑↓・ホイール: 送る    決定/クリック: 拠点へ"
    },

    dungeon: {
      // 地図に重ねるボタン（キーボードの P / I と同じ）
      buttonParty: "仲間",
      buttonItems: "持ち物",

      // 階段で出す問いかけ（ここでしか引き返せない）
      stairsPrompt:  "下へ続く階段がある。\nどうする?",
      bossPrompt:    "この先に強い気配がする。\nどうする?",
      choiceDescend: "次の階へ降りる",
      choiceFight:   "主に挑む",
      choiceReturn:  "拠点へ戻る",
      choiceStay:    "まだ残る",
      // 主のいない区画の最深階の階段（出口。2026-10-27。文は私の案）
      exitPrompt:    "奥から 外の風が吹いてくる。\nどうする?",
      choiceExit:    "出口から抜ける",
      cannotLeave:   "ここからは戻れない（階段か 帰還の石が要る）",
      descend:   "B{floor}F へ降りた",                      // floor
      bossAhead: "強い気配がする...",
      exitAhead: "出口が近い...",                           // 主のいない区画の最深階
      // ※ 毒の歩きダメージには知らせを出さない。
      //   5歩ごとに画面中央を遮ってしまうため。左上のパーティ表示で分かる
      // 中断（探索中にセーブは無い。中断して置いておき、タイトルから再開する）
      suspendPrompt: "ここで中断して タイトルへ戻りますか?\n再開すると 中断したところは消えます",
      suspendYes:    "中断する",
      suspendNo:     "やめる",
      // 画面下部の情報欄
      infoBar:   "{name} B{floor}F/{floors}F  移動:WASD/矢印  仲間:P  持ち物:I  中断:F"
    },

    boss: {
      appear: "{name} が立ちふさがった!"                    // name
    },

    /**
     * 一度きりの出来事（data/dungeons.js の events）で、戦闘の始めに出す一言。
     * キーは出来事の message に書いた名前。{name} は相手の名前
     */
    events: {
      yomiryuAmbush: "暗がりから {name} が襲いかかってきた!"
    },

    // エンディングは今は簡素な内容。ボスを増やしたら差し替える想定。
    ending: {
      title:    "クリア!",
      body:     "深層の主を倒した!",
      thanks:   "遊んでくれてありがとう",
      hint:     "決定キーでタイトルへ"
    },

    party: {
      title:       "仲間",
      empty:       "仲間がいない",
      fainted:     "瀕死",

      // 預かり所（拠点にいる仲間）
      tabParty:    "連れていく",
      tabStorage:  "預かり所",
      // 預かり所の画面（v1.3.0。30体ずつの箱に絵を並べる）
      boxTitle:        "預かり所",
      boxCount:        "預けている数 {n}/{max}",            // n, max
      boxPartyHead:    "連れていく {n}/{max}",              // n, max
      boxName:         "箱 {n}/{total}",                    // n, total
      boxNameFiltered: "絞り込み中 {n}/{total}",            // n, total
      boxEmptyCell:    "空き",
      boxSort:         "並び：{mode}（R）",                 // mode（下の boxSortLabels）
      boxSortLabels: { stored: "預けた順", level: "レベルが高い順", dex: "図鑑の順", element: "属性の順" },
      boxFilter:       "絞り込み：{mode}（F）",             // mode
      boxFilterAll:    "すべて",
      boxFilterTitle:  "絞り込み",
      boxFilterElement:"属性",
      boxFilterSpecies:"種族",
      boxFilterCount:  "{n}体",                             // n
      boxFilteredEmpty:"当てはまる仲間はいない（F で絞り込みを変える）",
      boxSwapPrompt:   "{name} と入れ替えて預ける仲間を選ぶ",  // name
      boxSwapped:      "{taken} をパーティに加え、{stored} を預けた", // taken, stored
      boxMarking:      "印 {n}体",                          // n
      boxReleaseMarked:"印の仲間を逃がす（C）",
      boxStopMarking:  "やめる（Esc）",
      actionReleaseMany: "まとめて逃がす",
      releaseManyTitle:  "{n}体を逃がしますか?",            // n
      releasedMany:      "{n}体を逃がした",                 // n
      releaseManyKept:   "{n}体を逃がした（{name} は装備を持ち物に戻せないので残した）", // n, name
      releaseManyNone:   "印をつけた仲間がいない",
      // 決定を押したときに出る項目
      actionInspect:"様子を見る",
      actionDeposit:"預かり所へ預ける",
      actionTake:   "パーティに加える",
      actionReorder:"並び替える",
      actionName:    "名前を変える",
      actionEquip:  "装備",
      // 作戦（v1.0.0。data/battle.js の tactics）
      actionTactic:  "作戦：{tactic}",                        // tactic
      tacticCurrent: "（いま）",
      tacticChanged: "{name} の作戦を「{tactic}」にした。",   // name, tactic
      hintTactic:    "↑↓: 作戦を選ぶ    決定: この作戦にする    Esc: やめる",
      actionRelease:"逃がす",
      // 探索中に技を使う（回復の技など。攻撃の技は出ない）
      actionFieldSkill: "技を使う",
      fieldSkillCost:   "PP{pp}",                                        // pp
      fieldSkillUsed:   "{user} の {skill}! {target} の HPが {amount} 回復した", // user, skill, target, amount
      fieldSkillNoPp:   "PPが足りない",
      fieldSkillFull:   "{target} は元気なままだ",                        // target
      fieldSkillCured:  "{user} の {skill}! {target} の {status}が治った", // user, skill, target, status
      fieldSkillNothingToCure: "{target} には治すものがない",             // target
      fieldSkillFainted:"{target} は倒れていて使えない",                  // target
      fieldSkillAllHealed: "{user} の {skill}! みんなの HPが 回復した",    // user, skill
      fieldSkillAllFull:   "みんな元気なままだ",
      fieldSkillRevived:   "{user} の {skill}! {target} は 起き上がった", // user, skill, target
      fieldSkillReviveFail:"{user} の {skill}! しかし {target} は 起き上がらなかった", // user, skill, target
      fieldSkillNotFainted:"{target} は倒れていない",                     // target
      hintFieldSkill:   "↑↓: 技を選ぶ    決定: 決定    Esc: やめる",
      hintFieldTarget:  "↑↓: 相手を選ぶ    決定: 使う（続けて使える）    Esc: 技選びへ",
      actionCancel: "やめる",
      // 逃がすときの確認（拠点でだけ選べる）。既定は「いいえ」
      releaseTitle:      "{name} を逃がしますか?",               // name
      releaseBody:       "逃がした仲間は、もう戻ってきません",
      releaseNoteEquip:  "着けている装備は持ち物に戻ります",
      releaseYes:        "逃がす",
      releaseNo:         "やめる",
      released:          "{name} を逃がした",                    // name
      cannotReleaseLast: "最後の1体は逃がせない",
      cannotReleasePartner: "{name} は最初の相棒だ。逃がすことはできない", // name
      releaseStackFull:  "装備を持ち物に戻せない（持てる数がいっぱい）",
      hintRelease:       "↑↓: 選択    決定: 決定    Esc: やめる",

      stored:      "{name} を預かり所へ預けた",       // name
      tookOut:     "{name} をパーティに加えた",       // name
      storageFull: "預かり所がいっぱいだ",
      partyFull:   "パーティがいっぱい（先に誰かを預ける）",
      cannotStoreLast: "最後の1体は預けられない",

      // 耐性（装備の分まで足したあとの値を全属性ぶん出す。装備で動いたぶんは「(+3)」と隣に出る）
      resistanceLabel: "属性への耐性",
      // 状態異常への耐性。狭い詳細欄には入らないので「様子を見る」でだけ出す
      statusResistLabel: "状態異常への耐性",
      // 特性と装備でいま効いている効果をまとめた欄（「様子を見る」の右下）。
      // ステータスや耐性の加算は数値の隣に「(+15)」と出ているので、ここには並べない
      effectLabel: "効果",
      // 戦闘中に働く特性の効果を1行にしたもの（js/systems/EffectSystem.js の describeEffect）
      effectRegen:        "毎ターン HP{percent}%回復",          // percent
      effectRegenMax:     "毎ターン HP{percent}%回復（上限{max}）", // percent, max
      effectPpRegen:      "毎ターン PP{value}回復",              // value（ppRegen。2026-11-10）
      // 相手の残りHPで与ダメージが変わる（万全狩り。v1.0.0）。後ろに「100%以上 ×1.2・…」が続く
      effectByTargetHp:   "相手HP ",
      // 攻撃を当てたときに相手を状態異常にする（v1.0.0 眠花の杖）
      effectOnHit:        "攻撃で {percent}%で相手を{status}",   // percent, status
      effectOnHitNormal:  "通常攻撃で {percent}%で相手を{status}", // percent, status
      effectCounter:      "被弾時 {percent}%で相手を{status}",  // percent, status
      effectCounterNormal:"通常攻撃の被弾時 {percent}%で相手を{status}", // percent, status
      // 攻撃を受けたときに相手へ弱体（ねばねば。2026-11-11）。what は「素早さ ×0.75」
      effectCounterModifier: "被弾時 {percent}%で相手の{what}",   // percent, what
      // 技で掛かる毎ターンの回復（樹液の膜。2026-11-11）
      effectRegenOverTime: "毎ターン HP{min}〜{max}%回復",         // min, max
      effectDrain:        "与ダメージの{percent}%を吸収",       // percent
      effectDrainNormal:  "通常攻撃の与ダメージの{percent}%を吸収", // percent
      effectFirstStrike:  "最初のターンに必ず先に動く",
      effectUndying:      "倒されてもそのターンは踏みとどまる",
      // v1.0.0（脱皮・追い風・芽吹き）
      effectShedStatus:   "ターンの終わりに{percent}%で状態異常を治す",   // percent
      effectTailwind:     "最初の{turns}ターン 素早さ×{value}",            // turns, value
      effectWardAlly:     "戦闘の始めに仲間1体の状態異常を1回防ぐ",

      // 装備
      equipLabel:   "装備",
      // 枠の名前は data/categories.js の equipSlot。
      // 一覧では「武器：灼牙の戦刃」「防具：-」のように枠ごとに出す
      slotEmpty:    "-",
      // 一覧の詳細欄（狭い）では、空いている枠を数でまとめる
      slotsEmpty:   "空き {n}",                         // n
      unequipLabel: "外す",
      // 装備の画面（v1.3.0）
      equipScreenTitle: "装備",
      equipCandidates:  "{slot}の候補",                 // slot（「アクセサリー1」など）
      equipSort:        "並び：{mode}（R）",            // mode（下の equipSortLabels）
      equipSortLabels: {
        inventory: "持ち物の順", attack: "攻撃が上がる順", defense: "防御が上がる順",
        speed: "素早さが上がる順", hp: "HPが上がる順", pp: "PPが上がる順"
      },
      equipNoCandidates: "この枠に着けられる装備がない",
      unequipAll:       "すべて外す",
      unequipAllNote:   "決定で、この仲間の装備をすべて持ち物へ戻す",
      unequippedAll:    "{name} の装備をすべて外した",  // name
      equipNothingToRemove: "外す装備がない",
      equipCompareNow:  "今",
      equipCompareNext: "着けたら",
      equipCompareHint: "候補を選ぶと、着けたときの変わり方が出る",
      equipCompareEmpty:"（なし）",
      // ほかの仲間が着けているものを移す
      equipFromOwner:   "{owner} から移す",              // owner
      equipGiveOwner:   "{owner} には {item} を渡す",    // owner, item
      equipStoreOld:    "{item} は持ち物へ戻す",         // item
      equipTaken:       "{owner} の {item} を {name} に着けた",                 // owner, item, name
      equipTakenSwap:   "{owner} の {item} を {name} に着け、{owner} に {given} を渡した", // owner, item, name, given
      equipTakenStore:  "{owner} の {item} を {name} に着け、{stored} は持ち物へ戻した", // owner, item, name, stored
      equipped:     "{name} に {item} を着けた",        // name, item
      // 枠が埋まっていたので、先に着けていたものと入れ替えた
      equipSwapped: "{out} を外して {item} を着けた",   // out, item
      unequipped:   "{name} を外した",                  // name
      // 同じ装備は2つ着けられない（アクセサリー枠が2つあっても）
      equipDuplicate: "{item} はもう着けている",        // item
      noEquipment:  "着けられる装備がない",
      noEquipmentHint:"ショップや工房で手に入る",
      // 同じ装備を maxStack いっぱいまで持っているときだけ出る（めったに無い）
      stackFull:    "これ以上は持てないので外せない",
      // 全属性の耐性の書き方（宝珠の首飾り「全属性への耐性 +2」）
      allElements:  "全属性",

      // {extra} には、右の欄が入りきらないとき hintScroll が入る（v1.4.0）
      hintNormal:  "↑↓: 選択   ←→: 預かり所   決定: この仲間を選ぶ{extra}   Esc: 閉じる",
      hintScroll:  "   Q/E: 送る",
      hintBox:       "決定: 出し入れ   C: ほかの操作   Q/E: 箱   R: 並べ替え   F: 絞り込み   Esc: 戻る",
      hintBoxSwap:   "↑↓: 預ける仲間を選ぶ    決定: 入れ替える    Esc: やめる",
      hintBoxMark:   "決定: 印をつける・外す    C: 印の仲間を逃がす    Esc: やめる",
      hintBoxFilter: "↑↓: 選ぶ    決定: 絞り込む    Esc: やめる",
      // 探索中（預かり所へ手が届かないとき）
      hintNoStorage: "↑↓: 選択   決定: この仲間を選ぶ{extra}   Esc: 探索へ戻る",
      hintAction:  "↑↓: 選択    決定: 決定    Esc: やめる",
      hintReorder: "↑↓: 移動先を選ぶ    決定: そこへ入れ替え    Esc: やめる",
      hintEquipSlots: "↑↓: 枠を選ぶ    ←→: 仲間を切替    決定: 候補へ    R: 並べ替え    Esc: 戻る",
      hintEquipItems: "↑↓: 候補を選ぶ    ←→: 仲間を切替    決定: 着ける・外す    R: 並べ替え    Esc: 枠へ",
      hintInspect: "↑↓: 別の仲間   ←→: ページ切替{extra}   決定・愛情度を押す: 愛情度の詳細   Esc: 戻る",
      // 様子を見るのページ（左上の札）。モンスター説明は図鑑と同じ説明と、愛情度の記録
      inspectPageStats: "ステータス",
      inspectPageSkills: "技・特性",
      inspectPageNotes: "モンスター説明",
      skillCount: "{label}（{n}）",       // 「技（12）」。仲間の一覧の右の欄・様子を見るの左の欄・技・特性のページの見出し（label, n）
      notesNoRecords:   "（関係が深まると、記録が書き足されていく）",
      natureLabel: "性格",
      natureHeading: "{label}　{name}",   // 様子を見るの性格の棒の見出し「性格　素直」（label, name）
      attackLabel: "攻撃",
      defenseLabel:"防御",
      speedLabel:  "素早さ",
      expLabel:    "次のLvまで",
      expMaxLevel: "レベル上限",          // 上限に届いて、もう上がらないとき（「次のLvまで」の代わり）
      levelWithMax: "Lv{level}/{max}",    // 「様子を見る」の名前の下。max はレベル上限（level, max）
      totalExpLabel: "累計経験値",        // 「様子を見る」のステータスのページ
      skillLabel:  "技",
      abilityLabel:"特性",
      // 愛情度（「様子を見る」の名前の下）。count は「いま/次の段階に要る数」
      affectionLabel: "愛情度 {stage}（{count}）",   // stage, count
      // 「効果」欄に出す愛情度の上がり。出どころの欄には段階の名前が出る
      affectionEffect: "全能力 ×{value}",            // value

      // --- 愛情度の詳細（「様子を見る」で愛情度の札を押す・決定で開く） ---
      hintAffection:  "決定・Esc・クリック: 閉じる",
      affectionTitle: "{name} との関係",               // name
      affectionNow:   "いまの段階：{stage}（{count}回）", // stage, count
      affectionNext:  "次の「{stage}」まで あと {n} 回",  // stage, n
      affectionMax:   "いちばん深い段階に届いている",
      affectionNeed:  "{n}回",                          // n
      affectionStatReward:  "全能力 +{value}%",          // value
      affectionStatTotal:   "（合わせて +{value}%）",     // value
      affectionSkillReward: "「{skill}」を覚える",        // skill
      // 絆の報酬を、届くまで伏せるときの表示（data/affection.js の hideBondRewardUntilReached）
      affectionHidden:  "？？？",
      // 絆に届いたが、その種族の報酬がまだ決まっていないとき
      affectionNoReward: "―",
      affectionNotes: [
        "勝った戦闘で、場に出ていると深まる。控えでは深まらない。",
        "深まるほど、図鑑にその種族の記録が書き足される。",
        "絆（180回）に届いたら、それより上は数えない。"
      ]
    }
  };
})(window.MyGame);
