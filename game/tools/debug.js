/**
 * debug.js  デバッグ画面の中身（v1.3.0。開発用。ゲーム本体ではない。debug.html から読む）
 *
 * ▼ できること
 *   セーブ … 図鑑・区画・道具・お金が全部そろったセーブを作る／読む／書く
 *   進行   … お金・道具・図鑑・区画のクリア・準備中の区画・加護・物語の見た記録
 *   仲間   … レベル・愛情度・性格・個体値・作戦・技・出し入れ
 *   戦闘   … チート（減らない・一撃など）、好きな相手・主・区画の敵との戦闘を始める、好きな階へ行く
 *   裏側   … 戦っている全員の実際の値と、次の行動の見込み、AI の決定・行動順・ダメージの内訳の記録
 *
 * ▼ 作りの決めごと
 *   ・ゲーム本体のファイルには何も足さない。ここで関数を包む（wrap）だけ。
 *     なのでチートは debug.html の中でしか掛からない
 *   ・「次の行動の見込み」は AI の決まりを書き写さず、本物の関数を別の乱数で何度も呼んで数える。
 *     AI を直しても見込みがずれないように
 *   ・包めなかった関数（名前が変わった場合）は上の帯に赤で出す
 */
(function () {
  "use strict";

  var NS = window.MyGame;
  var esc = window.DevPage.esc;
  var game = null;
  var data = null;
  var panel, bodyEl, nowEl, msgEl;
  var tab = "save";
  var missing = [];        // 包めなかった関数

  // --- チート（8124 のブラウザに覚えておく） ---

  var CHEAT_KEY = "abyssDebug.cheats";
  var cheats = {
    noDamage: false,      // 味方のHPが減らない
    noPpCost: false,      // 味方のPPが減らない
    oneHit: false,        // 味方の攻撃で一撃
    alwaysHit: false,     // 味方の攻撃は必ず当たる
    crit: "off",          // "ally" 味方は必ずクリティカル / "never" 全員なし
    enemyIdle: false,     // 敵は何もしない
    scoutAlways: false,   // スカウトは必ず成功
    dropAll: false,       // 落とし物を全部落とす
    expMul: 1,
    goldMul: 1,
    encounter: "normal",  // "none" 出ない / "always" 歩くたびに出る
    openPreparing: false  // 準備中の区画（ready: false）に入れる
  };
  try {
    var stored = JSON.parse(window.localStorage.getItem(CHEAT_KEY) || "{}");
    Object.keys(stored).forEach(function (k) { if (k in cheats) cheats[k] = stored[k]; });
  } catch (e) { /* 読めなければ既定のまま */ }

  function saveCheats() {
    try { window.localStorage.setItem(CHEAT_KEY, JSON.stringify(cheats)); } catch (e) { /* 覚えられないだけ */ }
  }

  // --- 記録（裏側のログ） ---

  var LOG_MAX = 1500;
  var logs = [];
  var logShow = { turn: true, ai: true, order: true, dmg: true, event: true };
  var logVersion = 0;
  var sampling = false;     // 見込みを数えているあいだは記録しない
  var aiCtx = null;         // いま決めている敵の行動の記録
  var tacticCtx = null;     // いま決めている作戦の記録

  function addLog(kind, text) {
    if (sampling) return;
    logs.push({ kind: kind, text: text });
    if (logs.length > LOG_MAX) logs.splice(0, logs.length - LOG_MAX);
    logVersion++;
  }

  function round(v, n) { var p = Math.pow(10, n || 0); return Math.round(v * p) / p; }
  function pct(v) { return round(v * 100, 1) + "%"; }

  function isOurs(m) {
    if (!game || !m) return false;
    if (game.party && game.party.getMembers().indexOf(m) >= 0) return true;
    return !!(game.storage && game.storage.getMembers().indexOf(m) >= 0);
  }

  function skillName(id) {
    var s = data.getSkill ? data.getSkill(id) : null;
    return s ? s.name : id;
  }

  function nameOf(m) { return m ? m.getName() : "?"; }

  /** 行動の中身を文にする。own / foes はその行動者から見た味方・相手の盤面 */
  function actionText(action, own, foes) {
    if (!action) return "なし";
    switch (action.type) {
      case "skill": {
        var skill = data.getSkill(action.skillId) || {};
        var who = "";
        if (action.target) who = nameOf(action.target);
        else if (skill.target === "allEnemies") who = "相手全体";
        else if (skill.target === "allAllies") who = "味方全体";
        else if (skill.target === "self") who = "自分";
        else if (skill.target === "ally") who = nameOf((own || [])[action.targetIndex]);
        else who = nameOf((foes || [])[action.targetIndex]);
        return (skill.name || action.skillId) + (action.forceCritical ? "（必ずクリティカル）" : "") + " → " + who;
      }
      case "tactic": return "作戦で決める（手番のとき）";
      case "wait": return "何もしない";
      case "skip": return "何もしない";
      case "item": return "道具 " + ((data.getItem(action.itemId) || {}).name || action.itemId);
      case "scout": return "スカウト";
      case "swap": return "交代";
      case "flee": return "逃げる";
      default: return action.type;
    }
  }

  // --- ゲームの関数を包む ---

  function wrap(proto, name, fn) {
    var orig = proto && proto[name];
    if (typeof orig !== "function") { missing.push(name); return; }
    proto[name] = function () { return fn.call(this, orig, arguments); };
    proto[name].__orig = orig;
  }

  function installWraps() {
    var MI = NS.MonsterInstance.prototype;
    var BS = NS.BattleSystem.prototype;

    // 味方の HP・PP
    wrap(MI, "takeDamage", function (orig, args) {
      if (cheats.noDamage && isOurs(this)) return this.currentHp;
      return orig.apply(this, args);
    });
    wrap(MI, "canPayPp", function (orig, args) {
      if (cheats.noPpCost && isOurs(this)) return true;
      return orig.apply(this, args);
    });
    wrap(MI, "payPp", function (orig, args) {
      if (cheats.noPpCost && isOurs(this)) return true;
      return orig.apply(this, args);
    });

    // 報酬
    wrap(MI, "getExpReward", function (orig, args) { return Math.floor(orig.apply(this, args) * (cheats.expMul || 1)); });
    wrap(MI, "getGoldReward", function (orig, args) { return Math.floor(orig.apply(this, args) * (cheats.goldMul || 1)); });

    wrap(NS.ScoutSystem.prototype, "roll", function (orig, args) {
      var result = orig.apply(this, args);
      addLog("ai", "スカウト：" + nameOf(args[0]) + " 成功率 " + pct(result.rate) + " → " + (cheats.scoutAlways ? "成功（チート）" : (result.success ? "成功" : "失敗")));
      if (cheats.scoutAlways) { result.success = true; result.reason = "joined"; }
      return result;
    });
    wrap(NS.DropSystem.prototype, "rollFor", function (orig, args) {
      if (!cheats.dropAll) return orig.apply(this, args);
      var real = this.random;
      this.random = { next: function () { return 0; }, nextInt: function (a, b) { return b; } };
      try { return orig.apply(this, args); } finally { this.random = real; }
    });
    wrap(NS.EncounterSystem.prototype, "onStep", function (orig, args) {
      if (cheats.encounter === "none") return null;
      if (cheats.encounter === "always") return this.createEnemyGroup();
      return orig.apply(this, args);
    });

    // --- 戦闘 ---

    wrap(BS, "takeTurn", function (orig, args) {
      var actions = args[0] || [];
      var slots = this.getFieldSlots();
      var foes = this.getFieldEnemies();
      var own = this.getFieldAllies();
      addLog("turn", "── ターン " + (this.turnCount + 1) + " ──");
      for (var i = 0; i < slots.length; i++) {
        if (slots[i].isFainted() && !actions[i]) continue;
        addLog("ai", "[命令] " + nameOf(slots[i]) + "：" + actionText(actions[i], own, foes));
      }
      var events = orig.apply(this, args);
      if (this.finished) addLog("turn", "── 戦闘終了：" + this.result + " ──");
      return events;
    });

    wrap(BS, "_buildTurnOrder", function (orig, args) {
      var order = orig.apply(this, args);
      if (!sampling) {
        addLog("order", "行動順：" + order.map(function (s) {
          var sp = (s.speed === Infinity) ? "先頭" : round(s.speed, 1);
          return nameOf(s.actor) + "(速" + sp + (s.firstStrike ? "・先手" : "") + (s.actions > 1 ? "・" + s.actions + "回" : "") + ")";
        }).join(" → "));
      }
      return order;
    });

    // 敵の行動。乱数をのぞいて、技を出すかどうかの引きを書き残す
    wrap(BS, "_chooseEnemyAction", function (orig, args) {
      var enemy = args[0];
      var field = args[1];
      if (sampling) return orig.apply(this, args);
      if (cheats.enemyIdle) {
        addLog("ai", "[敵] " + nameOf(enemy) + "：何もしない（チート）");
        return { type: "wait" };
      }

      var patternAt = enemy.actionPattern ? enemy.patternIndex : null;
      var rolls = [];
      var random = this.random;
      var realNext = random.next;
      random.next = function () { var v = realNext.call(random); rolls.push(v); return v; };
      aiCtx = { rolls: rolls, rate: null, roll: null };
      var action, ctx = aiCtx;
      try { action = orig.apply(this, args); }
      finally { random.next = realNext; aiCtx = null; }

      var why;
      if (patternAt !== null) {
        why = "決まった順番 " + (patternAt % enemy.actionPattern.length + 1) + "/" + enemy.actionPattern.length + " 番目";
      } else if (ctx.rate !== null) {
        var hit = ctx.roll < ctx.rate;
        why = "技を出す確率 " + pct(ctx.rate) + "・引き " + round(ctx.roll, 3) + (hit ? "（技を出す）" : "（通常攻撃）");
      } else {
        why = "PP切れの動き";
      }
      addLog("ai", "[敵] " + nameOf(enemy) + "：" + why + " → " + actionText(action, this.getFieldEnemies(), field));
      return action;
    });

    wrap(BS, "_skillRateFor", function (orig, args) {
      var rate = orig.apply(this, args);
      if (aiCtx) {
        aiCtx.rate = rate;
        aiCtx.roll = aiCtx.rolls.length ? aiCtx.rolls[aiCtx.rolls.length - 1] : null;
      }
      return rate;
    });

    wrap(BS, "_tryEnemyFlee", function (orig, args) {
      var enemy = args[0];
      var fled = orig.apply(this, args);
      if (typeof enemy.fleeRate === "number") {
        addLog("ai", "[敵] " + nameOf(enemy) + "：逃げる確率 " + pct(enemy.fleeRate) + " → " + (fled ? "逃げた" : "残った"));
      }
      return fled;
    });

    // 作戦の決定。上から順にどこで決まったか、攻撃なら何を比べたかを書き残す
    wrap(BS, "_chooseTacticAction", function (orig, args) {
      if (sampling) return orig.apply(this, args);
      var actor = args[0];
      var side = args[1];
      var tactic = (args[2] && (((data.battle || {}).tactics || {}).list || {})[args[2]]) || (actor.getTactic && actor.getTactic()) || {};
      var ctx = tacticCtx = { steps: [], estimates: [], value: null };
      var action;
      try { action = orig.apply(this, args); } finally { tacticCtx = null; }
      var own = (side === "ally") ? this.getFieldAllies() : this.getFieldEnemies();
      var foes = (side === "ally") ? this.getFieldEnemies() : this.getFieldAllies();
      var text = "[作戦] " + nameOf(actor) + "（" + (tactic.name || "?") + "）：" + ctx.steps.join("／") +
        " ⇒ " + actionText(action, own, foes);
      if (ctx.value !== null) text += "（評価 " + round(ctx.value, 1) + "）";
      if (ctx.estimates.length) {
        var seen = {};
        var list = ctx.estimates.filter(function (e) {
          var k = e.skill + "|" + e.foe;
          if (seen[k]) return false;
          seen[k] = true;
          return true;
        });
        text += "\n　見積り：" + list.map(function (e) { return e.skill + "→" + e.foe + " " + e.damage; }).join("・");
      }
      addLog("ai", text);
      return action;
    });

    [["_tacticRevive", "蘇生"], ["_tacticHeal", "回復"], ["_tacticCure", "治す"],
     ["_tacticSupport", "補助"], ["_tacticAttack", "攻撃"]].forEach(function (pair) {
      wrap(BS, pair[0], function (orig, args) {
        var picked = orig.apply(this, args);
        if (tacticCtx) {
          tacticCtx.steps.push(pair[1] + (picked ? "○" : "×"));
          if (picked && typeof picked.value === "number") tacticCtx.value = picked.value;
        }
        return picked;
      });
    });

    // ダメージ。本物の計算の結果に、計算に使った値を添えて書き残す
    wrap(BS, "calcDamage", function (orig, args) {
      var attacker = args[0], defender = args[1], skill = args[2], estimate = args[3];
      if (estimate) {
        var est = orig.apply(this, args);
        if (tacticCtx) tacticCtx.estimates.push({ skill: skill.name, foe: nameOf(defender), damage: est.immune ? "無効" : est.damage });
        return est;
      }
      var mid = sampling ? null : orig.call(this, attacker, defender, skill, true);
      var result = orig.apply(this, args);
      if (cheats.oneHit && isOurs(attacker)) {
        result = { damage: Math.max(1, defender.currentHp), critical: result.critical, elementMultiplier: result.elementMultiplier, immune: false };
      }
      if (!sampling) {
        var elementId = this._damageElementOf(attacker, defender, skill);
        var effects = this.effects;
        var dealt = effects ? effects.getDamageDealtMultiplier(attacker, elementId, skill) : 1;
        var taken = effects ? effects.getDamageTakenMultiplier(defender, elementId) : 1;
        var hpMul = this._targetHpMultiplier(attacker, defender);
        addLog("dmg", nameOf(attacker) + " → " + nameOf(defender) + "　" + skill.name + "：" +
          (result.immune ? "無効" : result.damage) + (result.critical ? "（クリティカル）" : "") +
          "\n　攻" + attacker.getAttack() + "・防" + defender.getDefense() + "・威力" + (skill.power || 0) + "・" + (skill.kind || "") +
          "・属性" + elementId + "×" + round(result.elementMultiplier, 2) +
          "・与" + round(dealt, 2) + "・受" + round(taken, 2) + (hpMul !== 1 ? "・残りHP" + round(hpMul, 2) : "") +
          (defender._defending ? "・防御中" : "") + (attacker._chargeMul ? "・ため×" + round(attacker._chargeMul, 2) : "") +
          "　／ふつうの見積り " + (mid && !mid.immune ? mid.damage : 0) +
          "　受ける前のHP " + defender.currentHp + "/" + defender.getMaxHp());
      }
      return result;
    });

    wrap(BS, "_rollCritical", function (orig, args) {
      if (cheats.crit === "never") return false;
      if (cheats.crit === "ally" && isOurs(args[1])) return true;
      return orig.apply(this, args);
    });
    wrap(BS, "_accuracyMultiplier", function (orig, args) {
      if (cheats.alwaysHit && isOurs(args[0])) return 1e6;
      return orig.apply(this, args);
    });
    wrap(BS, "_isEvaded", function (orig, args) {
      if (cheats.alwaysHit && isOurs(args[0])) return false;
      return orig.apply(this, args);
    });

    // 1回の行動で起きたことを、ゲームの文で書き残す
    wrap(BS, "_performAction", function (orig, args) {
      var events = args[1];
      var before = events.length;
      var result = orig.apply(this, args);
      if (!sampling) {
        var fmt = new NS.BattleMessageFormatter(data.messages, data.statuses, data.elements);
        for (var i = before; i < events.length; i++) {
          var line = "";
          try { line = fmt.formatOne(events[i]); } catch (e) { line = ""; }
          if (typeof line === "string" && line) addLog("event", line);
        }
      }
      return result;
    });
  }

  // --- 次の行動の見込み（本物の関数を、別の乱数で何度も呼んで数える） ---

  var SAMPLES = 300;

  function samplePlan(sys, m, side) {
    var realRandom = sys.random;
    var pattern = m.patternIndex;
    var support = m._tacticSupportNext;
    var chooseEnemy = NS.BattleSystem.prototype._chooseEnemyAction;
    var skills = {}, targets = {};
    sampling = true;
    sys.random = new NS.Random();
    try {
      var own = (side === "ally") ? sys.getFieldAllies() : sys.getFieldEnemies();
      var foes = (side === "ally") ? sys.getFieldEnemies() : sys.getFieldAllies();
      for (var i = 0; i < SAMPLES; i++) {
        m.patternIndex = pattern;
        m._tacticSupportNext = support;
        var action = (side === "enemy")
          ? chooseEnemy.call(sys, m, foes)
          : sys._chooseTacticAction(m, "ally");
        if (action.type === "tactic") action = sys._chooseTacticAction(m, side, action.tacticId);
        var text = actionText(action, own, foes);
        var parts = text.split(" → ");
        skills[parts[0]] = (skills[parts[0]] || 0) + 1;
        if (parts[1]) targets[parts[1]] = (targets[parts[1]] || 0) + 1;
      }
    } catch (e) {
      return "数えられなかった：" + e.message;
    } finally {
      sys.random = realRandom;
      m.patternIndex = pattern;
      m._tacticSupportNext = support;
      sampling = false;
    }
    function list(table) {
      return Object.keys(table).sort(function (a, b) { return table[b] - table[a]; })
        .map(function (k) { return k + " " + Math.round(table[k] * 100 / SAMPLES) + "%"; }).join("・");
    }
    var out = list(skills);
    var aim = list(targets);
    return aim ? out + "　／　狙い：" + aim : out;
  }

  // --- 操作の部品 ---

  function say(text, ng) {
    msgEl.textContent = text;
    msgEl.className = ng ? "ng" : "";
  }

  function scene() { return game.scenes.current; }
  function sceneName(s) {
    if (!s) return "なし";
    var names = ["TitleScene", "HomeScene", "DungeonScene", "BattleScene", "PartyScene", "DexScene", "StoryScene", "ResultScene",
      "ShopScene", "CraftScene", "ItemScene", "SaveSlotScene", "DungeonSelectScene", "SettingsScene", "HelpScene", "EndingScene",
      "BlessingScene", "BlessingSelectScene", "PatchNoteScene", "PlayerSetupScene"];
    for (var i = 0; i < names.length; i++) {
      if (NS[names[i]] && s instanceof NS[names[i]]) return names[i];
    }
    return "ほかの画面";
  }
  function battleScene() {
    var s = scene();
    return (s instanceof NS.BattleScene) ? s : null;
  }

  function goHome() {
    game.ensureProgress();
    game.run = null;
    game.scenes.change(new NS.HomeScene(game));
  }

  function monsterIds() { return Object.keys(data.monsters || {}); }
  function itemIds() { return Object.keys(data.items || {}); }
  function skillIds() { return Object.keys(data.skills || {}); }
  function dungeonList() { return NS.DungeonCatalog.list(data); }

  function maxAffection() {
    var stages = (data.affection || {}).stages || [];
    return stages.length ? stages[stages.length - 1].need : 0;
  }

  function setLevel(m, level) {
    var lv = Math.max(1, Math.min(m.getMaxLevel(), Math.floor(Number(level)) || 1));
    m.level = lv;
    m.exp = 0;
    var learned = NS.MonsterData.skillsUpToLevel(m.getSpecies(), lv);
    for (var i = 0; i < learned.length; i++) {
      if (m.skills.indexOf(learned[i]) < 0) m.skills.push(learned[i]);
    }
    m.currentHp = m.getMaxHp();
    m.currentPp = m.getMaxPp();
    if (game.discovery) {
      learned.forEach(function (id) { game.discovery.markSkillLearned(id); });
    }
  }

  function setAffection(m, value) {
    m.affection = Math.max(0, Math.floor(Number(value)) || 0);
    if (m.getAffectionMax) m.affection = Math.min(m.getAffectionMax(), m.affection);   // ゲームと同じく上限（180）で止める
    m._learnBondSkill();
    m.currentHp = Math.min(m.getMaxHp(), m.currentHp);
    m.currentPp = Math.min(m.getMaxPp(), m.currentPp);
    if (game.discovery) game.discovery.markAffectionStage(m.speciesId, m.getAffectionStageIndex());
  }

  function newMonster(id, level) {
    var m = new NS.MonsterInstance(id, 1, data, { nature: "balanced", ivs: { hp: 0, attack: 0, defense: 0, speed: 0 } });
    setLevel(m, level);
    if (game.discovery) game.discovery.markMonsterCaught(id);
    return m;
  }

  function fillDex() {
    game.ensureProgress();
    var d = game.discovery;
    var top = Math.max(0, ((data.affection || {}).stages || []).length - 1);
    monsterIds().forEach(function (id) {
      d.markMonsterCaught(id);
      d.markMonsterDefeated(id);
      d.markAffectionStage(id, top);
    });
    itemIds().forEach(function (id) { d.markItemObtained(id); });
    skillIds().forEach(function (id) { d.markSkillLearned(id); });
  }

  function clearAllDungeons() {
    game.ensureProgress();
    dungeonList().forEach(function (d) { game.markDungeonCleared(d.id); });
  }

  function giveAllItems(count) {
    game.ensureProgress();
    itemIds().forEach(function (id) {
      var have = game.inventory.getCount(id);
      if (have < count) game.inventory.add(id, count - have);
    });
  }

  function buyAllBlessings() {
    game.ensureProgress();
    Object.keys(data.blessings || {}).forEach(function (id) { game.markBlessingBought(id); });
  }

  /** デバッグ用のセーブを作って、そのファイルで拠点へ行く */
  function makeDebugSave(opts) {
    var sm = game.saveManager;
    if (sm.hasSave(opts.slot) && !window.confirm("8124 のファイル " + opts.slot + " を上書きします。よろしいですか？")) return;

    game.setSaveSlot(opts.slot);
    ["party", "storage", "inventory", "gold", "discovery", "clearedDungeons", "boughtBlessings", "offBlessings",
     "homeSeen", "run", "playerColor", "playerPants", "playerHair", "playerHairColor", "playerAcc", "playerAccColor",
     "playerGender", "playerFirstPerson"].forEach(function (k) { game[k] = null; });
    game.playTime = 0;
    game.doneEvents = {};
    game.playerName = "デバッグ";
    game.tutorial.loadSaveData(null, true);
    game.story.loadSaveData(null, true);
    game.resetFileSettings();
    game.ensureProgress();

    game.gold = opts.gold;
    if (opts.dex) fillDex();
    if (opts.cleared) clearAllDungeons();
    if (opts.items) giveAllItems(99);
    if (opts.blessings) buyAllBlessings();

    // 最初の相棒はそのまま育てて、残りの枠と預かり所に全種族を1体ずつ入れる
    game.party.getMembers().forEach(function (m) {
      setLevel(m, opts.level);
      if (opts.bond) setAffection(m, maxAffection());
    });
    if (opts.allSpecies) {
      var have = {};
      game.party.getMembers().forEach(function (m) { have[m.speciesId] = true; });
      monsterIds().forEach(function (id) {
        if (have[id]) return;
        var m = newMonster(id, opts.level);
        if (opts.bond) setAffection(m, maxAffection());
        if (!game.party.isFull()) game.party.add(m);
        else game.storage.add(m);
      });
    }
    var result = game.saveProgress();
    game.scenes.change(new NS.HomeScene(game));
    say(result.success ? "ファイル " + opts.slot + " にデバッグ用のセーブを作りました。" : "セーブに失敗：" + result.reason, !result.success);
    render();
  }

  function loadSlot(slot) {
    var sm = game.saveManager;
    sm.setSlot(slot);
    var result = sm.load();
    if (!result.success) { sm.setSlot(game.getSaveSlot()); say("読めませんでした：" + result.reason, true); return; }
    game.setSaveSlot(slot);
    game.applyLoadedState(result.state);
    game.loadFileSettings();
    game.scenes.change(new NS.HomeScene(game));
    say("ファイル " + slot + " を読みました。");
    render();
  }

  function saveInfo(slot) {
    try {
      var raw = window.localStorage.getItem(game.saveManager.keyFor(slot));
      if (!raw) return "空";
      var p = JSON.parse(raw);
      var size = (p.party && p.party.members ? p.party.members.length : (p.party && p.party.length)) || 0;
      return (p.playerName || "(名前なし)") + "・" + (p.gold || 0) + "G・仲間" + size + "・" + String(p.savedAt || "").slice(0, 16).replace("T", " ");
    } catch (e) {
      return "読めない";
    }
  }

  // --- 戦闘を始める ---

  function makeDungeonScene(def, floor) {
    game.ensureProgress();
    game.beginRun(def);
    var s = new NS.DungeonScene(game, def);
    var f = Math.max(1, Math.min(def.floors || 1, Math.floor(Number(floor)) || 1));
    if (f > 1) {
      s.floor = f;
      s.encounters.setFloor(f);
      if (game.run) game.run.recordFloor(f);
      s._generate();
    }
    return s;
  }

  function startSpeciesBattle(id, level, count) {
    game.ensureProgress();
    var cur = scene();
    if (cur instanceof NS.BattleScene) { say("戦闘が終わってから始めてください。", true); return; }
    var back = (cur instanceof NS.DungeonScene || cur instanceof NS.HomeScene) ? cur : new NS.HomeScene(game);
    var random = new NS.Random();
    var enemies = [];
    var n = Math.max(1, Math.min(3, Math.floor(Number(count)) || 1));
    for (var i = 0; i < n; i++) {
      var e = NS.MonsterInstance.create(id, Math.max(1, Math.floor(Number(level)) || 1), data, random);
      if (e.useEnemySkills) e.useEnemySkills();
      enemies.push(e);
    }
    var battle = new NS.BattleScene(game, game.party, enemies, back, function () { return false; }, {});
    game.audio.playBgm(battle.getBgmId());
    game.scenes.change(battle, "encounter");
  }

  function startEntryBattle(dungeonId, floor, species) {
    var def = data.dungeons[dungeonId];
    if (!def) return;
    var s = makeDungeonScene(def, floor);
    var group = null;
    if (species === "*") {
      group = s.encounters.createEnemyGroup();
    } else {
      var table = s.encounters.getTable();
      for (var i = 0; i < table.length; i++) {
        if (table[i].species === species) { group = [s.encounters.createEnemyFrom(table[i])]; break; }
      }
    }
    if (!group || !group.length) { say("その階の出現表に、その相手がいません。", true); return; }
    s._startBattle(group);
  }

  function startBossBattle(dungeonId) {
    var def = data.dungeons[dungeonId];
    var boss = def && (data.bosses || {})[def.boss];
    if (!boss) { say("その区画に主はいません。", true); return; }
    var s = makeDungeonScene(def, def.floors || 1);
    s._startBossBattle(boss);
  }

  function endBattle(result) {
    var s = battleScene();
    if (!s) { say("いまは戦闘していません。", true); return; }
    var list = (result === "win") ? s.system.enemies : s.system.getFieldSlots();
    list.forEach(function (m) { m.currentHp = 0; });
    if (s.phase === "command") {
      s.actions = [];
      s._resolveTurn();
      say(result === "win" ? "敵を全滅させました。" : "味方の場を全滅させました。");
    } else {
      say("HPを0にしました。次のターンで決着します。");
    }
  }

  // --- 画面 ---

  var TABS = [["save", "セーブ"], ["progress", "進行"], ["party", "仲間"], ["battle", "戦闘"], ["inside", "裏側"]];

  function options(list, selected) {
    return list.map(function (o) {
      var v = o[0];
      return "<option value='" + esc(v) + "'" + (String(v) === String(selected) ? " selected" : "") + ">" + esc(o[1]) + "</option>";
    }).join("");
  }
  function monsterOptions() {
    return options(monsterIds().map(function (id) { return [id, data.monsters[id].name + "（" + id + "）"]; }));
  }
  function dungeonOptions(selected) {
    return options(dungeonList().map(function (d) { return [d.id, d.name + (d.ready === false ? "（準備中）" : "")]; }), selected);
  }
  function check(id, label, on, act) {
    return "<label><input type='checkbox' id='" + id + "'" + (on ? " checked" : "") + (act ? " data-chg='" + act + "'" : "") + "> " + esc(label) + "</label>";
  }
  function val(id) { var el = document.getElementById(id); return el ? el.value : ""; }
  function on(id) { var el = document.getElementById(id); return !!(el && el.checked); }

  function render() {
    var buttons = TABS.map(function (t) {
      return "<button data-act='tab' data-tab='" + t[0] + "' class='" + (tab === t[0] ? "on" : "") + "'>" + t[1] + "</button>";
    }).join("");
    document.getElementById("tabs").innerHTML = buttons;
    var fn = { save: renderSave, progress: renderProgress, party: renderParty, battle: renderBattle, inside: renderInside }[tab];
    bodyEl.innerHTML = fn();
    lastLogShown = -1;
    lastFieldHtml = null;
    tickInside();
    renderNow();
  }

  function renderNow() {
    var parts = ["画面 " + sceneName(scene())];
    var b = battleScene();
    if (b) parts.push("phase " + b.phase + "・ターン " + b.system.turnCount);
    parts.push("ファイル " + game.getSaveSlot());
    if (typeof game.gold === "number") parts.push(game.gold + "G");
    nowEl.innerHTML = esc(parts.join("　")) + (missing.length
      ? "<br><span style='color:#ff8d8d'>包めなかった関数：" + esc(missing.join("、")) + "（名前が変わったかも）</span>" : "");
  }

  function renderSave() {
    var slots = [];
    for (var i = 1; i <= game.saveManager.slotCount; i++) slots.push(i);
    return "<h3>デバッグ用のセーブを作る</h3>" +
      "<div class='line'>ファイル <select id='mkSlot'>" + options(slots.map(function (n) { return [n, n + "：" + saveInfo(n)]; }), slots[slots.length - 1]) + "</select></div>" +
      "<div class='line'>レベル <input id='mkLevel' type='number' value='50' min='1'>　お金 <input id='mkGold' type='number' value='9999999' style='width:90px'></div>" +
      "<div class='line'>" +
        check("mkDex", "図鑑を全部開く", true) + check("mkCleared", "全区画クリア済み", true) + check("mkItems", "道具を全部 99 個", true) +
        check("mkBless", "加護を全部買う", true) + check("mkAll", "全種族を連れる・預ける", true) + check("mkBond", "愛情度を絆まで", true) +
      "</div>" +
      "<div class='line'><button class='big' data-act='mkSave'>作って拠点へ</button></div>" +
      "<div class='note'>物語とチュートリアルは見た扱いで始まる。主人公の見た目は既定のまま。作ったセーブは 8124 の app.html からも「続きから」で読めるが、チートはこのページの中だけで掛かる。</div>" +
      "<h3>ファイル</h3>" +
      slots.map(function (n) {
        return "<div class='line'><b>" + n + "</b>　" + esc(saveInfo(n)) +
          "　<button data-act='loadSlot' data-slot='" + n + "'>読む</button> <button data-act='clearSlot' data-slot='" + n + "'>消す</button></div>";
      }).join("") +
      "<div class='line'><button data-act='saveNow'>いまの状態をいまのファイルへセーブ</button> <button data-act='home'>拠点へ</button> <button data-act='title'>タイトルへ</button></div>";
  }

  function renderProgress() {
    if (!game.party) return "<div class='note'>まだセーブを読んでいません。「セーブ」の画面で作るか読むかしてください。</div>";
    var cleared = dungeonList().map(function (d) {
      return "<label><input type='checkbox' data-chg='clearedOne' data-id='" + esc(d.id) + "'" + (game.isDungeonCleared(d.id) ? " checked" : "") + "> " +
        esc(d.name) + (d.ready === false ? "（準備中）" : "") + "</label>";
    }).join("");
    return "<h3>お金</h3><div class='line'><input id='pgGold' type='number' value='" + (game.gold || 0) + "' style='width:110px' data-chg='gold'> G</div>" +
      "<h3>道具</h3><div class='line'><select id='pgItem'>" + options(itemIds().map(function (id) { return [id, data.items[id].name]; })) + "</select> " +
      "×<input id='pgItemN' type='number' value='10'> <button data-act='addItem'>足す</button> <button data-act='allItems'>全部 99 個</button> <button data-act='noItems'>持ち物を空に</button></div>" +
      "<h3>図鑑</h3><div class='line'><button data-act='fillDex'>全部開く</button> <button data-act='emptyDex'>空にする</button>　" +
        "見た " + game.discovery.countMonstersSeen() + "・仲間 " + game.discovery.countMonstersCaught() + "・道具 " + game.discovery.countItemsObtained() + "</div>" +
      "<h3>区画</h3><div class='line'>" + check("pgPrep", "準備中の区画に入れる（このページの中だけ）", cheats.openPreparing, "openPreparing") + "</div>" +
      "<div class='line'><button data-act='clearAll'>全部クリア済みに</button> <button data-act='clearNone'>全部未クリアに</button></div><div class='grid2'>" + cleared + "</div>" +
      "<h3>好きな階へ行く</h3><div class='line'><select id='goDungeon'>" + dungeonOptions() + "</select> 階 <input id='goFloor' type='number' value='1' min='1'> <button data-act='goFloor'>入る</button></div>" +
      "<h3>加護</h3><div class='line'><button data-act='buyBless'>全部買う</button></div>" +
      "<h3>物語・チュートリアル</h3><div class='line'><button data-act='storyAll'>全部見た扱い</button> <button data-act='storyNone'>まだ見ていない扱い</button> <button data-act='eventsReset'>一度きりの出来事を戻す</button></div>" +
      "<div class='note'>ここで変えた値は、セーブするまでファイルには残らない。</div>";
  }

  function monsterRow(m, listName, i) {
    var tactics = ((data.battle || {}).tactics || {}).list || {};
    var stage = m.getAffectionStage();
    var skills = m.skills.map(function (id) {
      return "<span class='chip'>" + esc(skillName(id)) + "<a data-act='delSkill' data-list='" + listName + "' data-i='" + i + "' data-skill='" + esc(id) + "'>×</a></span>";
    }).join("");
    var attr = "data-list='" + listName + "' data-i='" + i + "'";
    return "<div class='card'>" +
      "<span class='name'>" + esc(m.getName()) + "</span>" + (m.partner ? " ★相棒" : "") + "　" +
      "Lv<input type='number' value='" + m.level + "' min='1' data-chg='level' " + attr + ">/" + m.getMaxLevel() + "　" +
      "愛<input type='number' value='" + (m.affection || 0) + "' min='0' data-chg='affection' " + attr + ">" + esc(stage ? stage.name : "") + "　" +
      "<select data-chg='nature' " + attr + ">" + options(Object.keys(data.natures).map(function (id) { return [id, data.natures[id].name]; }), m.natureId) + "</select>　" +
      "<select data-chg='tactic' " + attr + ">" + options(Object.keys(tactics).map(function (id) { return [id, tactics[id].name]; }), m.getTactic() ? m.getTactic().id : "") + "</select>" +
      "<div class='stat'>HP " + m.currentHp + "/" + m.getMaxHp() + "　PP " + m.currentPp + "/" + m.getMaxPp() + "　攻 " + m.getAttack() + "　防 " + m.getDefense() + "　速 " + m.getSpeed() +
        "　個体値 " + [m.ivs.hp, m.ivs.attack, m.ivs.defense, m.ivs.speed || 0].join("/") + "</div>" +
      "<div>" + skills + "</div>" +
      "<div class='line'><button data-act='healOne' " + attr + ">全回復</button> <button data-act='ivMax' " + attr + ">個体値を最大</button> " +
        "<button data-act='addSkill' " + attr + ">選んだ技を足す</button> <button data-act='allSkills' " + attr + ">レベル順の技を全部</button> " +
        "<button data-act='moveMon' " + attr + ">" + (listName === "party" ? "預ける" : "連れる") + "</button> <button data-act='delMon' " + attr + ">消す</button></div>" +
      "</div>";
  }

  function listOf(name) { return name === "party" ? game.party : game.storage; }

  function renderParty() {
    if (!game.party) return "<div class='note'>まだセーブを読んでいません。「セーブ」の画面で作るか読むかしてください。</div>";
    return "<div class='line'>全員：Lv <input id='allLv' type='number' value='50'> <button data-act='allLevel'>にする</button> " +
      "<button data-act='allBond'>愛情度を絆まで</button> <button data-act='allHeal'>全回復</button> <button data-act='saveNow'>セーブ</button></div>" +
      "<div class='line'>足す：<select id='addMon'>" + monsterOptions() + "</select> Lv <input id='addLv' type='number' value='50'> " +
      "<button data-act='addMon' data-to='party'>連れる</button> <button data-act='addMon' data-to='storage'>預ける</button></div>" +
      "<div class='line'>足す技：<select id='addSkillId'>" + options(skillIds().map(function (id) { return [id, data.skills[id].name + "（" + id + "）"]; })) + "</select></div>" +
      "<h3>連れている仲間（" + game.party.size() + "）</h3>" +
      game.party.getMembers().map(function (m, i) { return monsterRow(m, "party", i); }).join("") +
      "<h3>預かり所（" + game.storage.size() + "）</h3>" +
      game.storage.getMembers().map(function (m, i) { return monsterRow(m, "storage", i); }).join("");
  }

  function renderBattle() {
    var dungeonId = (dungeonList()[0] || {}).id;
    return "<h3>チート（戦闘の中で切り替えられる）</h3><div class='grid2'>" +
        check("c_noDamage", "味方のHPが減らない", cheats.noDamage, "cheat") +
        check("c_noPpCost", "味方のPPが減らない", cheats.noPpCost, "cheat") +
        check("c_oneHit", "味方の攻撃で一撃", cheats.oneHit, "cheat") +
        check("c_alwaysHit", "味方の攻撃は必ず当たる", cheats.alwaysHit, "cheat") +
        check("c_enemyIdle", "敵は何もしない", cheats.enemyIdle, "cheat") +
        check("c_scoutAlways", "スカウトは必ず成功", cheats.scoutAlways, "cheat") +
        check("c_dropAll", "落とし物を全部落とす", cheats.dropAll, "cheat") +
      "</div>" +
      "<div class='line'>クリティカル <select data-chg='cheatSel' data-key='crit'>" + options([["off", "ふつう"], ["ally", "味方は必ず"], ["never", "全員なし"]], cheats.crit) + "</select>　" +
        "敵の出方 <select data-chg='cheatSel' data-key='encounter'>" + options([["normal", "ふつう"], ["none", "出ない"], ["always", "歩くたびに出る"]], cheats.encounter) + "</select></div>" +
      "<div class='line'>経験値 ×<input type='number' value='" + cheats.expMul + "' min='0' data-chg='cheatNum' data-key='expMul'>　お金 ×<input type='number' value='" + cheats.goldMul + "' min='0' data-chg='cheatNum' data-key='goldMul'></div>" +
      "<h3>好きな相手と戦う（補正なしの種族そのまま）</h3><div class='line'><select id='btMon'>" + monsterOptions() + "</select> Lv <input id='btLv' type='number' value='30'> 数 <input id='btN' type='number' value='1' min='1' max='3'> <button data-act='btSpecies'>戦う</button></div>" +
      "<h3>区画の敵と戦う（本番と同じ補正・動き）</h3><div class='line'><select id='btDungeon' data-chg='btDungeon'>" + dungeonOptions(dungeonId) + "</select> 階 <input id='btFloor' type='number' value='1' min='1' data-chg='btDungeon'> " +
        "<select id='btEntry'>" + entryOptions(dungeonId, 1) + "</select> <button data-act='btEntry'>戦う</button> <button data-act='btBoss'>主と戦う</button></div>" +
      "<h3>戦闘中</h3><div class='line'><button data-act='endWin'>敵を全滅（勝つ）</button> <button data-act='endLose'>味方を全滅（負ける）</button> <button data-act='allHeal'>味方を全回復</button></div>" +
      "<div class='note'>裏側のタブで、AI の決定と計算の中身を見られる。</div>";
  }

  function entryOptions(dungeonId, floor) {
    var def = data.dungeons[dungeonId];
    if (!def) return "";
    var enc = new NS.EncounterSystem(data, new NS.Random(), def);
    enc.setFloor(Math.floor(Number(floor)) || 1);
    var list = [["*", "出現表から引く"]];
    enc.tableForFloor(enc.getTable()).forEach(function (e) {
      var sp = data.monsters[e.species];
      list.push([e.species, (sp ? sp.name : e.species) + "（重み " + (e.weight === undefined ? "-" : e.weight) + "）"]);
    });
    return options(list);
  }

  function renderInside() {
    return "<h3>戦っている全員</h3><div id='field'></div>" +
      "<h3>記録</h3><div class='line'>" +
        check("l_turn", "ターン", logShow.turn, "logShow") + check("l_ai", "AIの決定", logShow.ai, "logShow") + check("l_order", "行動順", logShow.order, "logShow") +
        check("l_dmg", "ダメージ", logShow.dmg, "logShow") + check("l_event", "文", logShow.event, "logShow") +
        "<button data-act='logClear'>消す</button> <button data-act='logCopy'>写す</button></div>" +
      "<div id='log'></div>" +
      "<div class='note'>1ターンの計算はコマンドを決めた瞬間に終わるので、記録は演出より先に出る。</div>";
  }

  // --- 裏側の更新 ---

  var lastFieldHtml = null, lastLogShown = -1;
  var planCache = {}, planSig = "";
  var abilitySystem = null;

  function statusText(m) {
    var out = [];
    (m.statusEffects || []).forEach(function (s) {
      var def = data.getStatus ? data.getStatus(s.id) : null;
      out.push((def ? def.name : s.id) + (s.remaining === null || s.remaining === undefined ? "" : "(" + s.remaining + ")"));
    });
    return out.join("・");
  }
  function modifierText(m) {
    return (m.modifiers || []).map(function (x) { return x.name + "(" + x.remaining + ")"; }).join("・");
  }
  function resistText(m) {
    var out = [];
    Object.keys(data.elements || {}).forEach(function (id) {
      var v = m.getResistance(id);
      if (v) out.push(((data.elements[id] || {}).name || id) + v);
    });
    var st = [];
    Object.keys(data.statuses || {}).forEach(function (id) {
      var v = m.isImmuneToStatus(id) ? "無効" : m.getStatusResist(id);
      if (v) st.push(((data.statuses[id] || {}).name || id) + v);
    });
    var base = (data.battle || {}).debuffResistBase;
    return "耐性 " + (out.join(" ") || "なし") + "　状態 " + (st.join(" ") || "なし") + "　弱体 " + m.getDebuffResist(base) +
      (m.getEvasion() ? "　回避 " + pct(m.getEvasion()) : "");
  }
  function abilityText(m) {
    if (!abilitySystem) abilitySystem = new NS.AbilitySystem(data);
    return abilitySystem.getAbilities(m).map(function (a) { return a.name; }).join("・");
  }
  function enemySettings(m, sys) {
    var out = [];
    // 決まった順番で動く相手は、技の確率を見ない
    if (m.actionPattern) out.push("決まった順番 " + ((m.patternIndex || 0) % m.actionPattern.length + 1) + "/" + m.actionPattern.length);
    else out.push("技の確率 " + pct(NS.BattleSystem.prototype._skillRateFor.__orig.call(sys, m)));
    if (m.enemyTactic) out.push("作戦 " + m.enemyTactic);
    if (m.skillWeights) out.push("重み " + Object.keys(m.skillWeights).map(function (k) { return skillName(k) + m.skillWeights[k]; }).join(" "));
    if (m.infinitePp) out.push("PP無限");
    if (m.actionsPerTurn) out.push("1ターンの行動 " + JSON.stringify(m.actionsPerTurn));
    if (typeof m.fleeRate === "number") out.push("逃げる " + pct(m.fleeRate));
    if (typeof m.fixedStatLevel === "number") out.push("能力はLv" + m.fixedStatLevel + "で固定");
    if (m.rewardMultiplier) out.push("報酬×" + m.rewardMultiplier);
    out.push("倒すと 経験値 " + m.getExpReward() + "・" + m.getGoldReward() + "G");
    return out.join("　");
  }

  function combatantCard(m, side, i, sys) {
    var flags = [];
    if (m._defending) flags.push("防御中");
    if (m._charged) flags.push("ためている");
    if (m._undying) flags.push("踏みとどまり");
    var key = side + i;
    var attr = "data-side='" + side + "' data-i='" + i + "'";
    var tactic = m.getTactic ? m.getTactic() : null;
    return "<div class='card " + side + (m.isFainted() ? " down" : "") + "'>" +
      "<span class='name'>" + esc(m.getName()) + "</span> Lv" + m.level + "　" + esc(((data.natures || {})[m.natureId] || {}).name || "") +
        (abilityText(m) ? "　特性 " + esc(abilityText(m)) : "") + (side === "ally" && tactic ? "　作戦 " + esc(tactic.name || "") : "") +
      "<div class='stat'>HP " + m.currentHp + "/" + m.getMaxHp() + "　PP " + m.currentPp + "/" + m.getMaxPp() + "　攻 " + m.getAttack() + "　防 " + m.getDefense() + "　速 " + m.getSpeed() + "</div>" +
      (statusText(m) ? "<div>状態異常：" + esc(statusText(m)) + "</div>" : "") +
      (modifierText(m) ? "<div>強化・弱体：" + esc(modifierText(m)) + "</div>" : "") +
      (flags.length ? "<div>" + flags.join("・") + "</div>" : "") +
      "<div class='note'>" + esc(resistText(m)) + "</div>" +
      (side === "enemy" ? "<div class='note'>" + esc(enemySettings(m, sys)) + "</div>" : "") +
      "<div class='plan'>次の見込み：" + esc(planCache[key] || "") + "</div>" +
      "<div class='line'><button data-act='hpFull' " + attr + ">HP満</button> <button data-act='hpOne' " + attr + ">HP1</button> <button data-act='hpZero' " + attr + ">HP0</button> " +
        "<button data-act='ppFull' " + attr + ">PP満</button> <button data-act='ppZero' " + attr + ">PP0</button></div>" +
      "</div>";
  }

  function fieldSignature(sys, list) {
    return sys.turnCount + "|" + list.map(function (m) {
      return m.currentHp + "," + m.currentPp + "," + (m.modifiers || []).length + "," + (m.statusEffects || []).length + "," + (m.patternIndex || 0);
    }).join(";");
  }

  function tickInside() {
    if (tab !== "inside") return;
    var fieldEl = document.getElementById("field");
    var logEl = document.getElementById("log");
    if (!fieldEl || !logEl) return;

    var b = battleScene();
    var html;
    if (!b) {
      html = "<div class='note'>いまは戦闘していません。</div>";
    } else {
      var sys = b.system;
      var allies = sys.getFieldSlots();
      var enemies = sys.enemies;
      var sig = fieldSignature(sys, allies.concat(enemies));
      if (sig !== planSig) {
        planSig = sig;
        planCache = {};
        allies.forEach(function (m, i) {
          if (m.isFainted()) planCache["ally" + i] = "倒れている";
          else if (!m.isTacticAi || !m.isTacticAi()) planCache["ally" + i] = "命令を待つ";
          else planCache["ally" + i] = samplePlan(sys, m, "ally");
        });
        enemies.forEach(function (m, i) {
          planCache["enemy" + i] = m.isFainted() ? "倒れている" : samplePlan(sys, m, "enemy");
        });
      }
      html = allies.map(function (m, i) { return combatantCard(m, "ally", i, sys); }).join("") +
             enemies.map(function (m, i) { return combatantCard(m, "enemy", i, sys); }).join("");
    }
    if (html !== lastFieldHtml) {
      fieldEl.innerHTML = html;
      lastFieldHtml = html;
    }

    if (lastLogShown !== logVersion) {
      var nearEnd = logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 40;
      logEl.innerHTML = logs.filter(function (l) { return logShow[l.kind]; }).map(function (l) {
        return "<div class='k-" + l.kind + "'>" + esc(l.text) + "</div>";
      }).join("");
      if (nearEnd) logEl.scrollTop = logEl.scrollHeight;
      lastLogShown = logVersion;
    }
  }

  // --- 操作 ---

  function monsterAt(el) {
    return listOf(el.dataset.list).getMembers()[Number(el.dataset.i)];
  }
  function combatantAt(el) {
    var b = battleScene();
    if (!b) return null;
    return (el.dataset.side === "ally" ? b.system.getFieldSlots() : b.system.enemies)[Number(el.dataset.i)];
  }
  function refreshHud(m) {
    // 戦闘中の HP バーは表示用の値を見ているので、いまの値にそろえる
    var b = battleScene();
    if (b && b.animator) b.animator.snap([m]);
  }

  var ACT = {
    tab: function (el) { tab = el.dataset.tab; render(); },
    home: function () { goHome(); render(); },
    title: function () { game.useTitleSettings(); game.scenes.change(new NS.TitleScene(game)); render(); },
    mkSave: function () {
      makeDebugSave({
        slot: Number(val("mkSlot")), level: Number(val("mkLevel")) || 1, gold: Number(val("mkGold")) || 0,
        dex: on("mkDex"), cleared: on("mkCleared"), items: on("mkItems"), blessings: on("mkBless"), allSpecies: on("mkAll"), bond: on("mkBond")
      });
    },
    loadSlot: function (el) { loadSlot(Number(el.dataset.slot)); },
    clearSlot: function (el) {
      var n = Number(el.dataset.slot);
      if (!window.confirm("8124 のファイル " + n + " を消します。よろしいですか？")) return;
      game.saveManager.clear(n);
      say("ファイル " + n + " を消しました。");
      render();
    },
    saveNow: function () {
      if (!game.party) { say("セーブするものがありません。", true); return; }
      var r = game.saveProgress();
      say(r.success ? "ファイル " + game.getSaveSlot() + " へセーブしました。" : "セーブに失敗：" + r.reason, !r.success);
    },
    addItem: function () {
      game.inventory.add(val("pgItem"), Math.max(1, Number(val("pgItemN")) || 1));
      game.discovery.markItemObtained(val("pgItem"));
      say("足しました。所持 " + game.inventory.getCount(val("pgItem")));
    },
    allItems: function () { giveAllItems(99); say("道具を全部 99 個にしました。"); },
    noItems: function () { game.inventory.clear(); say("持ち物を空にしました。"); },
    fillDex: function () { fillDex(); say("図鑑を全部開きました。"); render(); },
    emptyDex: function () { game.discovery = new NS.Discovery(); say("図鑑を空にしました。"); render(); },
    clearAll: function () { clearAllDungeons(); render(); },
    clearNone: function () { game.clearedDungeons = {}; render(); },
    goFloor: function () {
      var def = data.dungeons[val("goDungeon")];
      if (!def) return;
      game.scenes.change(makeDungeonScene(def, val("goFloor")));
      render();
    },
    buyBless: function () { buyAllBlessings(); say("加護を全部買いました。"); },
    storyAll: function () { game.tutorial.loadSaveData(null, true); game.story.loadSaveData(null, true); say("物語とチュートリアルを見た扱いにしました。"); },
    storyNone: function () { game.tutorial.loadSaveData(null, false); game.story.loadSaveData(null, false); say("物語とチュートリアルを見ていない扱いにしました。"); },
    eventsReset: function () { game.doneEvents = {}; say("一度きりの出来事を戻しました。"); },

    allLevel: function () {
      var lv = val("allLv");
      game.party.getMembers().concat(game.storage.getMembers()).forEach(function (m) { setLevel(m, lv); });
      render();
    },
    allBond: function () {
      game.party.getMembers().concat(game.storage.getMembers()).forEach(function (m) { setAffection(m, maxAffection()); });
      render();
    },
    allHeal: function () {
      if (!game.party) return;
      game.party.getMembers().forEach(function (m) { m.healFull(); m.clearAllStatuses(); refreshHud(m); });
      say("味方を全回復しました。");
      render();
    },
    addMon: function (el) {
      var m = newMonster(val("addMon"), val("addLv"));
      var to = listOf(el.dataset.to);
      if (to.isFull()) { say("いっぱいです。", true); return; }
      to.add(m);
      render();
    },
    healOne: function (el) { var m = monsterAt(el); m.healFull(); m.clearAllStatuses(); render(); },
    ivMax: function (el) {
      var m = monsterAt(el);
      var top = (data.growth || {}).ivMax || 0;
      m.ivs = { hp: top, attack: top, defense: top, speed: top };
      m.healFull();
      render();
    },
    addSkill: function (el) {
      var m = monsterAt(el);
      var id = val("addSkillId");
      if (m.skills.indexOf(id) < 0) m.skills.push(id);
      render();
    },
    allSkills: function (el) {
      var m = monsterAt(el);
      ((m.getSpecies() || {}).learnset || []).forEach(function (entry) {
        if (m.skills.indexOf(entry.skill) < 0) m.skills.push(entry.skill);
      });
      render();
    },
    delSkill: function (el) {
      var m = monsterAt(el);
      m.skills = m.skills.filter(function (id) { return id !== el.dataset.skill; });
      render();
    },
    moveMon: function (el) {
      var i = Number(el.dataset.i);
      if (el.dataset.list === "party") {
        if (game.party.size() <= 1) { say("連れている仲間を0にはできません。", true); return; }
        if (game.storage.isFull()) { say("預かり所がいっぱいです。", true); return; }
        game.storage.add(game.party.remove(i));
      } else {
        if (game.party.isFull()) { say("連れている仲間がいっぱいです。", true); return; }
        game.party.add(game.storage.remove(i));
      }
      render();
    },
    delMon: function (el) {
      var i = Number(el.dataset.i);
      if (el.dataset.list === "party" && game.party.size() <= 1) { say("連れている仲間を0にはできません。", true); return; }
      listOf(el.dataset.list).remove(i);
      render();
    },

    btSpecies: function () { startSpeciesBattle(val("btMon"), val("btLv"), val("btN")); },
    btEntry: function () { startEntryBattle(val("btDungeon"), val("btFloor"), val("btEntry")); },
    btBoss: function () { startBossBattle(val("btDungeon")); },
    endWin: function () { endBattle("win"); },
    endLose: function () { endBattle("lose"); },

    hpFull: function (el) { var m = combatantAt(el); if (m) { m.currentHp = m.getMaxHp(); refreshHud(m); } },
    hpOne: function (el) { var m = combatantAt(el); if (m) { m.currentHp = 1; refreshHud(m); } },
    hpZero: function (el) { var m = combatantAt(el); if (m) { m.currentHp = 0; refreshHud(m); } },
    ppFull: function (el) { var m = combatantAt(el); if (m) m.currentPp = m.getMaxPp(); },
    ppZero: function (el) { var m = combatantAt(el); if (m) m.currentPp = 0; },

    logClear: function () { logs.length = 0; logVersion++; },
    logCopy: function () {
      var text = logs.filter(function (l) { return logShow[l.kind]; }).map(function (l) { return l.text; }).join("\n");
      if (window.navigator.clipboard) {
        window.navigator.clipboard.writeText(text).then(function () { say("記録を写しました。"); }, function () { say("写せませんでした。", true); });
      }
    }
  };

  var CHG = {
    gold: function (el) { game.gold = Math.max(0, Number(el.value) || 0); },
    openPreparing: function (el) { cheats.openPreparing = el.checked; saveCheats(); applyPreparing(); render(); },
    clearedOne: function (el) {
      if (el.checked) game.clearedDungeons[el.dataset.id] = true;
      else delete game.clearedDungeons[el.dataset.id];
    },
    level: function (el) { setLevel(monsterAt(el), el.value); render(); },
    affection: function (el) { setAffection(monsterAt(el), el.value); render(); },
    nature: function (el) { var m = monsterAt(el); m.natureId = el.value; m.currentHp = Math.min(m.currentHp, m.getMaxHp()); render(); },
    tactic: function (el) { monsterAt(el).setTactic(el.value); render(); },
    cheat: function (el) { cheats[el.id.slice(2)] = el.checked; saveCheats(); },
    cheatSel: function (el) { cheats[el.dataset.key] = el.value; saveCheats(); },
    cheatNum: function (el) { cheats[el.dataset.key] = Math.max(0, Number(el.value) || 0); saveCheats(); },
    btDungeon: function () { document.getElementById("btEntry").innerHTML = entryOptions(val("btDungeon"), val("btFloor")); },
    logShow: function (el) { logShow[el.id.slice(2)] = el.checked; logVersion++; }
  };

  // 準備中の区画（ready: false）を開ける／閉じる。data/ のファイルは書き換えない
  var preparing = [];
  function applyPreparing() {
    preparing.forEach(function (d) {
      if (cheats.openPreparing) delete d.ready;
      else d.ready = false;
    });
  }

  function bindPanel() {
    panel.innerHTML = "<div id='bar'><div id='now'></div><div id='msg'></div><div id='tabs'></div></div><div id='body'></div>";
    bodyEl = document.getElementById("body");
    nowEl = document.getElementById("now");
    msgEl = document.getElementById("msg");

    panel.addEventListener("click", function (e) {
      var t = e.target.closest("[data-act]");
      if (!t) return;
      try {
        ACT[t.dataset.act](t);
      } catch (err) {
        say("失敗しました：" + err.message, true);
        console.error(err);
      }
      // ボタンに残ったキー操作でゲームが動かなくならないように、押したら外す
      if (t.blur) t.blur();
    });
    panel.addEventListener("change", function (e) {
      var t = e.target;
      if (t.dataset && t.dataset.chg) {
        try {
          CHG[t.dataset.chg](t);
        } catch (err) {
          say("失敗しました：" + err.message, true);
          console.error(err);
        }
      }
      if (t.tagName === "SELECT" && t.blur) t.blur();
    });
    // パネルで打つキーをゲームの操作にしない（Enter は欄を抜ける）
    panel.addEventListener("keydown", function (e) {
      e.stopPropagation();
      if (e.key === "Enter" && e.target.blur) e.target.blur();
    });
  }

  function tick() {
    if (!game) return;
    // 罠や毒の歩きダメージも止める（HP を直接引いている所があるので、戦闘の外では毎回戻す）
    if (cheats.noDamage && game.party && !battleScene()) {
      game.party.getMembers().forEach(function (m) { if (m.currentHp < m.getMaxHp()) m.currentHp = m.getMaxHp(); });
    }
    renderNow();
    tickInside();
  }

  // --- 起動 ---

  function boot() {
    panel = document.getElementById("panel");
    bindPanel();
    installWraps();

    // ゲームの起動は js/main.js をそのまま使う。始まるところだけ掴む
    var realStart = NS.Game.prototype.start;
    NS.Game.prototype.start = function () {
      game = this;
      data = this.data;
      var result = realStart.apply(this, arguments);
      preparing = dungeonList().filter(function (d) { return d.ready === false; });
      applyPreparing();
      render();
      window.setInterval(tick, 400);
      window.__debug = { game: game, cheats: cheats, logs: logs };
      return result;
    };

    var s = document.createElement("script");
    s.src = "js/main.js?t=" + Date.now();
    s.onload = function () {
      // ページの読み込みがもう終わっていれば、main.js の待っている合図を出し直す
      if (document.readyState === "complete") window.dispatchEvent(new Event("load"));
    };
    document.head.appendChild(s);
  }

  window.DebugPanel = { boot: boot };
})();
