/**
 * BattleMessageFormatter.js
 * BattleSystem が返すイベントを、表示用の文字列へ変換する。
 *
 * 文言そのものは data/messages.js のテンプレートを使うため、
 * 文章を変えたいときはデータファイルを編集するだけでよい（このコードは変更不要）。
 */
(function (NS) {
  "use strict";

  /**
   * @param {object} messages data/messages.js の messages
   * @param {object} [statuses] data/statuses.js。状態異常ごとの言い回しを読むのに使う。
   *   渡さなければ、battle 側の既定文だけで動く
   */
  function BattleMessageFormatter(messages, statuses, elements) {
    this.templates = (messages || {}).battle || {};
    this.statuses = statuses || {};
    this.elements = elements || {};
  }

  // 1つの行動のなかで、文をまとめる対象の出来事
  var HIT_RESULT = { damage: true, miss: true, immune: true };
  var FAIL_RESULT = { statusMiss: true, statusImmune: true, modifierMiss: true };
  // 行動の区切り（ここで1つの行動の出来事が終わる）
  var ACTION_BREAK = { useSkill: true, wait: true, defend: true, statusBlocked: true, statusDamage: true,
                       modifierEnd: true, battleEnd: true, custom: true, noSkill: true };

  /**
   * 1ターンぶんの出来事を見て、まとめて1行にする出来事に文（logText）を書き込む（2026-11-03 作者の指定）。
   * 出来事そのもの（数字・演出・HPバー）は1つずつ見せるので触らない。変えるのは文だけ。
   *   クリティカル      … 「クリティカル!」の行を出さず、ダメージの行の頭に付ける
   *   何回か当てる技    … 二連斬り・歯車投げは、当たった回数と合計を1行に
   *   全体の技          … 2体以上が受けたら「先頭の名前たち は 平均 N のダメージを受けた!」の1行に
   *   入らなかった      … 状態異常・弱体・攻撃が2体以上に入らなかったら「先頭の名前たち には 効かなかった」の1行に
   *   全体の強化・弱体  … 同じ技で2体以上に掛かったら「先頭の名前たち」の1行に
   * logText が "" の出来事は、文を出さない（BattleScene は文の無い出来事として扱う）
   */
  BattleMessageFormatter.prototype.annotate = function (events) {
    var list = events || [];
    var i = 0;
    while (i < list.length) {
      if (list[i].type !== "useSkill") { i++; continue; }
      var head = list[i];
      var j = i + 1;
      while (j < list.length && !ACTION_BREAK[list[j].type]) j++;
      this._annotateAction(head, list.slice(i + 1, j));
      i = j;
    }
    return list;
  };

  BattleMessageFormatter.prototype._annotateAction = function (head, group) {
    var skill = head.skill || {};
    var side = head.side;
    var k, e;
    // この行動で相手（や味方）に起きた結果だけ。特性の反撃などで本人に返ってきたものは除く
    var hits = [], fails = [], mods = [], misses = [], results = [];
    for (k = 0; k < group.length; k++) {
      e = group[k];
      if (e.type === "critical") { e.logText = ""; continue; }
      if (e.target && e.target === head.actor && e.type !== "modifier") continue;
      if (HIT_RESULT[e.type]) results.push(e);
      if (e.type === "damage" || e.type === "immune") hits.push(e);
      if (e.type === "miss") misses.push(e);
      if (FAIL_RESULT[e.type]) fails.push(e);
      if (e.type === "modifier" && e.skillId === skill.id) mods.push(e);
    }

    // クリティカルはダメージの行の頭に付ける（何回か当てる技・全体の技でまとめた行も同じ）
    for (k = 0; k < hits.length; k++) {
      if (hits[k].type === "damage" && hits[k].critical) hits[k]._critical = true;
    }

    if ((skill.hits || 1) > 1 && results.length >= 2) {
      this._mergeMultiHit(results);
    } else {
      if (distinctTargets(hits) >= 2) this._mergeAllDamage(hits);
      if (distinctTargets(misses) >= 2) this._mergeGroup(misses, this.templates.groupMiss);
    }
    if (distinctTargets(fails) >= 2) this._mergeGroup(fails, this.templates.groupFail);
    if (distinctTargets(mods) >= 2 && sameModifier(mods)) this._mergeModifiers(mods);
  };

  /** 二連斬り・歯車投げ：当たった回数と合計（相手が何体かなら相手ごとの合計）を、最初の結果の行に */
  BattleMessageFormatter.prototype._mergeMultiHit = function (results) {
    var t = this.templates;
    var order = [], totals = {}, landed = 0, critical = false;
    for (var k = 0; k < results.length; k++) {
      var e = results[k];
      if (e.type !== "damage") continue;
      landed++;
      if (e._critical) critical = true;
      var name = this._targetName(e);
      if (!(name in totals)) { totals[name] = 0; order.push(name); }
      totals[name] += Math.max(0, e.amount);
    }
    var text;
    if (landed === 0) {
      text = fill(t.miss, { target: this._targetName(results[0]) });
    } else if (order.length === 1) {
      text = fill(t.multiHitOne, { target: order[0], hits: landed, amount: totals[order[0]] });
    } else {
      var parts = [];
      for (var p = 0; p < order.length; p++) parts.push(fill(t.multiHitPart, { target: order[p], amount: totals[order[p]] }));
      text = fill(t.multiHitMany, { hits: landed, list: parts.join(t.listJoin || "・") });
    }
    if (critical && t.critical) text = t.critical + " " + text;
    // 無効（immune）だった回は、その回の行のまま残す
    this._writeOnce(results.filter(function (r) { return r.type !== "immune"; }), text);
  };

  /** 全体の技で2体以上が受けた：先頭の名前たち は 平均 N のダメージを受けた */
  BattleMessageFormatter.prototype._mergeAllDamage = function (hits) {
    var t = this.templates;
    var damages = hits.filter(function (e) { return e.type === "damage"; });
    if (damages.length < 2) return;
    var sum = 0;
    for (var k = 0; k < damages.length; k++) sum += Math.max(0, damages[k].amount);
    var text = fill(t.groupDamage, { target: this._targetName(damages[0]), amount: Math.round(sum / damages.length) });
    // 無効だった相手は、その相手の行のまま残す
    this._writeOnce(damages, text);
  };

  /** 同じ結果が2体以上：先頭の名前たち で1行 */
  BattleMessageFormatter.prototype._mergeGroup = function (list, template) {
    if (!template) return;
    this._writeOnce(list, fill(template, { target: this._targetName(list[0]) }));
  };

  /** 全体に掛けた強化・弱体：先頭の名前たち で、技の言い回し＋変わった能力 */
  BattleMessageFormatter.prototype._mergeModifiers = function (mods) {
    var t = this.templates;
    var name = fill(t.groupName || "{target}たち", { target: this._targetName(mods[0]) });
    this._writeOnce(mods, this._modifierText(mods[0], name));
  };

  /** list の最初の出来事に文を書き、残りは文を出さない */
  BattleMessageFormatter.prototype._writeOnce = function (list, text) {
    for (var k = 0; k < list.length; k++) list[k].logText = (k === 0) ? text : "";
  };

  /**
   * 強化・弱体の文。技ごとの言い回し（skills.js の modifier.message）は残し、
   * 何が上がった／下がったかを画面の能力名で必ず足す（2026-11-03 作者の指定）
   */
  BattleMessageFormatter.prototype._modifierText = function (event, targetName) {
    var t = this.templates;
    var stats = this._modifierStatText(event.effects || []);
    if (event.message) {
      var flavor = fill(event.message, { target: targetName, skill: event.skillName });
      return stats ? flavor + " " + stats : flavor;
    }
    if (event.renewed) return fill(t.modifierAgain, { target: targetName, skill: event.skillName });
    if (stats) return fill(t.modifierStat, { target: targetName, stats: stats });
    return fill(event.raised ? t.modifierUp : t.modifierDown, { target: targetName, skill: event.skillName });
  };

  /** 効果の並び → 「攻撃と防御が 大きく上がった!」のような文（作れなければ ""） */
  BattleMessageFormatter.prototype._modifierStatText = function (effects) {
    var t = this.templates;
    var names = t.logStats || {};
    var words = t.logChange || {};
    var items = [];
    for (var k = 0; k < effects.length; k++) {
      var e = effects[k];
      var noun = null, verb = null;
      if (e.type === "statMultiplier" || e.type === "statBonus") {
        noun = names[e.stat] || e.stat;
        var up = (e.type === "statMultiplier") ? e.value > 1 : e.value > 0;
        var big = (e.type === "statMultiplier") && (up ? e.value >= 1.5 : e.value <= 0.5);
        verb = up ? (big ? words.upBig : words.up) : (big ? words.downBig : words.down);
      } else if (e.type === "accuracyMultiplier") {
        noun = names.accuracy;
        verb = e.value > 1 ? words.up : words.down;
      } else if (e.type === "damageTaken") {
        noun = names.damageTaken;
        verb = e.value < 1 ? words.less : words.more;
      } else if (e.type === "damageDealt") {
        noun = names.damageDealt;
        verb = e.value > 1 ? words.more : words.less;
      } else if (e.type === "resistBonus") {
        var what = e.element ? ((this.elements[e.element] || {}).name || e.element)
                             : (e.status === "all" ? names.allStatus : ((this.statuses[e.status] || {}).name || e.status));
        noun = fill(names.resist, { what: what });
        verb = e.value > 0 ? words.up : words.down;
      }
      if (noun && verb) items.push({ noun: noun, verb: verb });
    }
    if (items.length === 0) return "";
    var sameVerb = items.every(function (it) { return it.verb === items[0].verb; });
    if (sameVerb) {
      return fill(t.modifierStatLine, { nouns: items.map(function (it) { return it.noun; }).join(t.nounJoin || "と"), verb: items[0].verb });
    }
    return items.map(function (it) { return fill(t.modifierStatLine, { nouns: it.noun, verb: it.verb }); }).join(" ");
  };

  function distinctTargets(list) {
    var seen = [];
    for (var k = 0; k < list.length; k++) {
      if (list[k].target && seen.indexOf(list[k].target) < 0) seen.push(list[k].target);
    }
    return seen.length;
  }

  // 同じ技の強化・弱体で、文が同じ形になるものだけまとめる（かけ直しと初めてが混ざったらまとめない）
  function sameModifier(mods) {
    for (var k = 1; k < mods.length; k++) {
      if (mods[k].renewed !== mods[0].renewed || mods[k].raised !== mods[0].raised) return false;
    }
    return true;
  }

  /**
   * 状態異常ごとの言い回しを取り出す（無ければ null）。
   * 「毒におかされている」のように、状態異常ごとに言い方を変えたいので、
   * 文言は data/statuses.js の1件ずつに持たせてある。
   */
  BattleMessageFormatter.prototype._statusText = function (event, key) {
    var def = this.statuses[event.statusId];
    return (def && def[key]) || null;
  };

  /** 状態異常の文に埋める値。statuses.js と既定文のどちらでも使えるよう両方の名前を入れる */
  BattleMessageFormatter.prototype._statusValues = function (event) {
    var name = this._targetName(event);
    return { name: name, target: name, status: event.statusName, amount: event.amount };
  };

  /**
   * イベント配列を文字列配列へ変換する。
   * 表示不要なイベントは読み飛ばす。
   * @param {object[]} events
   * @returns {string[]}
   */
  BattleMessageFormatter.prototype.format = function (events) {
    this.annotate(events);
    var lines = [];
    for (var i = 0; i < (events || []).length; i++) {
      var line = this.formatOne(events[i]);
      if (line) lines.push(line);
    }
    return lines;
  };

  /**
   * 行動した側の表示名。敵なら「敵の」を付けて味方と区別できるようにする。
   * （味方にも敵にも同じ名前のモンスターが並ぶことがあるため）
   */
  BattleMessageFormatter.prototype._actorName = function (event) {
    return this._decorate(event.actorName, event.side === "enemy");
  };

  /**
   * 対象の表示名。対象は行動した側の反対にいるので、side を反転して判断する。
   */
  BattleMessageFormatter.prototype._targetName = function (event) {
    // targetSide が書かれていればそれに従う。
    // 自分にかける技のように、対象が行動した側と同じこともあるため
    if (event.targetSide) return this._decorate(event.targetName, event.targetSide === "enemy");
    return this._decorate(event.targetName, event.side === "ally");
  };

  BattleMessageFormatter.prototype._decorate = function (name, isEnemy) {
    if (!isEnemy || !name) return name;
    return (this.templates.enemyNamePrefix || "") + name;
  };

  /**
   * イベント1件を文字列へ変換する（対応しないものは null）。
   */
  BattleMessageFormatter.prototype.formatOne = function (event) {
    var t = this.templates;

    // annotate がまとめた文（"" なら文を出さない）
    if (event.logText !== undefined) return event.logText || null;

    switch (event.type) {
      // 呼び出し側が文章を組み立て済みのもの（道具・スカウトなど）
      case "custom":
        return event.text || null;
      case "defend":
        return fill(t.defend, { actor: this._actorName(event) });
      case "defendFailed":
        return fill(t.defendFailed, this._statusValues(event));
      case "defendBroken":
        return fill(t.defendBroken, this._statusValues(event));
      case "wait":
        return fill(t.wait, { actor: this._actorName(event) });
      case "useSkill":
        // 技に useMessage があれば、その文で宣言する（主のやくそう。v1.0.0）
        if (event.skill && event.skill.useMessage) {
          return fill(event.skill.useMessage, { actor: this._actorName(event), skill: event.skillName });
        }
        return fill(t.useSkill, { actor: this._actorName(event), skill: event.skillName });
      // 相手のPPを減らした（ミステリーダンス）
      case "ppDamage":
        return fill(event.amount > 0 ? t.ppDamage : t.ppDamageNone,
                    { target: this._targetName(event), amount: event.amount });
      case "miss":
        return fill(t.miss, { target: this._targetName(event) });
      // クリティカルは単独の行にしない。ダメージの行の頭に付ける（2026-11-03 作者の指定）
      case "critical":
        return null;
      case "effective":
        return t.effective || null;
      case "resisted":
        return t.resisted || null;
      case "immune":
        return fill(t.immune, { target: this._targetName(event) });
      case "damage":
        // 0ダメージ（防御で削り切った）は「0 のダメージ」ではなく、通らなかったことを伝える
        if (event.amount <= 0 && t.noDamage) {
          return fill(t.noDamage, { target: this._targetName(event) });
        }
        var damageLine = fill(t.damage, { target: this._targetName(event), amount: event.amount });
        return (event.critical && t.critical) ? t.critical + " " + damageLine : damageLine;
      case "faint":
        return fill(t.faint, { target: this._targetName(event) });
      case "modifier":
        // 技ごとの言い回し＋変わった能力（_modifierText）
        return this._modifierText(event, this._targetName(event));
      case "drain":
        // 特性（吸精）で吸ったときは、特性の名前を出す
        if (event.abilityName) {
          return fill(t.abilityDrain, { target: this._targetName(event),
            ability: event.abilityName, amount: event.healAmount });
        }
        return fill(t.drained, { target: this._targetName(event), amount: event.healAmount });

      // 戦闘中に働く特性（data/abilities.js）
      case "ability":
        return fill(t.abilityTriggered,
                    { target: this._targetName(event), ability: event.abilityName });
      case "regen":
        return fill(t.abilityRegen, { target: this._targetName(event),
          ability: event.abilityName, amount: event.healAmount });
      case "undying":
        return fill(t.undying,
                    { target: this._targetName(event), ability: event.abilityName });
      case "undyingEnd":
        return fill(t.undyingEnd, { target: this._targetName(event) });
      case "partyFirstStrike":
        return fill(t.partyFirstStrike, { ability: event.abilityName });
      // v1.0.0 追い風・芽吹き
      case "tailwind":
        return fill(t.tailwind, { target: this._targetName(event), ability: event.abilityName });
      case "tailwindEnd":
        return fill(t.tailwindEnd, { target: this._targetName(event), ability: event.abilityName });
      case "wardGiven":
        return fill(t.wardGiven, { target: this._targetName(event), ability: event.abilityName,
          ally: this._targetName({ targetName: event.allyName, targetSide: event.targetSide }) });
      case "wardBlocked":
        return fill(t.wardBlocked, this._statusValues(event));
      case "wardSkill":
        return fill(t.wardSkill, { target: this._targetName(event) });
      case "heal":
        return fill(t.healed, { target: this._targetName(event), amount: event.healAmount });
      case "healFull":
        return fill(t.healFull, { target: this._targetName(event) });
      // 状態異常を治す技（クレンズ）
      case "cure":
        return fill(t.cured, { target: this._targetName(event),
                               status: (event.statusNames || []).join("・") });
      case "cureNone":
        return fill(t.cureNone, { target: this._targetName(event) });
      case "modifierEnd":
        return fill(t.modifierEnd,
                    { target: this._targetName(event), skill: event.skillName });

      // 状態異常。言い回しは data/statuses.js に1件ずつ書いてあり、
      // 書いていなければ battle 側の既定文で埋める。
      // {name} と {target} はどちらも「敵の」付きの表示名。
      // statuses.js 側では {name}、既定文では {target} と書き分けてあるだけで中身は同じ
      case "status":
        return fill(this._statusText(event, "message") || t.statusApplied,
                    this._statusValues(event));
      case "statusDamage":
        return fill(this._statusText(event, "tickMessage") || t.statusDamage,
                    this._statusValues(event));
      case "statusEnd":
        return fill(this._statusText(event, "cureMessage") || t.statusEnd,
                    this._statusValues(event));
      case "statusBlocked":
        return fill(this._statusText(event, "blockMessage") || t.statusBlocked,
                    this._statusValues(event));
      case "statusMiss":
        return fill(t.statusMiss, this._statusValues(event));
      case "modifierMiss":
        return fill(t.modifierMiss || t.statusMiss, { target: this._targetName(event) });
      case "recoil":
        return fill(t.recoil, { target: this._targetName(event), amount: event.amount });
      case "charge":
        return fill(t.charge, { target: this._targetName(event) });
      case "statusImmune":
        return fill(t.statusImmune, this._statusValues(event));
      case "expGained":
        return fill(t.expGained, { amount: event.amount });
      case "levelUp":
        return fill(t.levelUp, { actor: event.actorName, level: event.toLevel });
      case "skillLearned":
        return fill(t.skillLearned, { actor: event.actorName, skill: event.skillName });
      case "affectionUp":
        return fill(t.affectionUp, { actor: event.actorName, stage: event.stageName });
      case "fleeSuccess":
        return t.fleeSuccess || null;
      case "fleeFailed":
        return t.fleeFailed || null;
      case "noSkill":
        return fill(t.noSkill, { actor: event.actorName });
      case "battleEnd":
        if (event.result === "win") return t.win || null;
        if (event.result === "lose") return t.lose || null;
        return null; // 逃走時は fleeSuccess で既に表示済み
      default:
        return null;
    }
  };

  /** テンプレートの {key} を values の値で置き換える */
  function fill(template, values) {
    if (!template) return null;
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return (values[key] !== undefined) ? values[key] : match;
    });
  }

  NS.BattleMessageFormatter = BattleMessageFormatter;
})(window.MyGame);
