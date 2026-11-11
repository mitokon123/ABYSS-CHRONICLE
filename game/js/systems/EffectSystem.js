/**
 * EffectSystem.js
 * モンスターに掛かっている効果を、すべての出どころからまとめて集計する。
 *
 * ▼ 出どころ
 *   特性（アビリティ）… 種族が持つもの。AbilitySystem が「どれが効くか」を決める
 *   装備             … 個体が身につけているもの（data/items.js の equip）
 *   愛情度           … 個体の段階ごとの能力の上がり（data/affection.js）
 *   加護（ラン限定）  … 階を降りるたびに選んだもの。個体の runEffects に入っている
 *   その戦いの補正     … 敵として出ているあいだだけ。個体の encounterEffects に入っている
 *                      （主の statMultiplier と、特殊な出方をする在来種の両方）
 *   バフ／デバフ      … 技でかかるもの。個体の modifiers に入っている（戦闘のあいだだけ）
 *
 * 出どころが増えても collectEffects に1つ足すだけでよく、
 * ステータス計算も戦闘のダメージ計算も変更しなくてよい。
 *
 * ▼ 効果の書き方は出どころによらず共通（data/abilities.js の説明を参照）
 *   { type:"statMultiplier", stat:"attack", value:1.2 }
 *   { type:"statBonus",      stat:"defense", value:3 }
 *   { type:"damageDealt",    value:1.25, element:"fire" }
 *   { type:"damageTaken",    value:0.9 }
 *   { type:"resistBonus",    element:"fire", value:3 }  … 耐性の数値そのものを上げる
 *   { type:"accuracyMultiplier", value:0.8 }  … 命中率に倍率（盲目とは別）
 *   { type:"healDealt",      value:1.2 }  … 自分が使う回復の技の回復量に倍率（粘晶のネックレス）
 *   戦闘中に働くもの（regen / regenOverTime / ppRegen / counterStatus / counterModifier / onHitStatus / damageByTargetHp / drain / firstStrike / undying / shedStatus / tailwind / wardAlly）は
 *   ここでは集めるだけで、働かせるのは BattleSystem（_findEffects で拾う）
 *
 * ▼ 倍率と加算の違い
 *   statMultiplier は掛け算、statBonus は足し算。
 *   ステータスは floor(基礎 × 倍率) のあとに加算する（個体値と同じ扱い）。
 */
(function (NS) {
  "use strict";

  /**
   * @param {MyGame.GameData} gameData
   */
  function EffectSystem(gameData) {
    this.data = gameData;
    this.abilitySystem = NS.AbilitySystem ? new NS.AbilitySystem(gameData) : null;
  }

  /**
   * そのモンスターに掛かっている効果をすべて並べて返す。
   * @param {object} monster
   * @returns {object[]}
   */
  EffectSystem.prototype.collectEffects = function (monster) {
    if (!monster) return [];
    var effects = [];
    var i;

    // 特性
    var abilities = this.abilitySystem ? this.abilitySystem.getAbilities(monster) : [];
    for (i = 0; i < abilities.length; i++) {
      effects = effects.concat(abilities[i].effects || []);
    }

    // 装備
    var equipments = this.getEquipments(monster);
    for (i = 0; i < equipments.length; i++) {
      effects = effects.concat((equipments[i].equip || {}).effects || []);
    }

    // 愛情度（段階ごとに全能力が少し上がる。data/affection.js）
    if (monster.getAffectionEffects) {
      effects = effects.concat(monster.getAffectionEffects());
    }

    // 加護（そのラン限り）。拠点へ戻ると Game が消す
    if (monster.runEffects && monster.runEffects.length > 0) {
      effects = effects.concat(monster.runEffects);
    }

    // その戦いのあいだだけの補正。
    // 主の statMultiplier と、特殊な出方をする在来種（竜など）の両方がここに入る。
    // 敵として立ちはだかっている個体にだけ付いていて、仲間にすると外れる
    if (monster.encounterEffects && monster.encounterEffects.length > 0) {
      effects = effects.concat(monster.encounterEffects);
    }

    // バフ／デバフ（その戦闘のあいだだけ）。ターン数で切れ、戦闘終了で消える
    var modifiers = monster.modifiers || [];
    for (i = 0; i < modifiers.length; i++) {
      effects = effects.concat(modifiers[i].effects || []);
    }

    // 状態異常。data/statuses.js に effects を書いたものだけが効く（いまは呪いだけ）。
    // 書き方はバフ／デバフとまったく同じなので、ダメージ計算側は何も変えなくてよい
    var statuses = monster.getStatusDefs ? monster.getStatusDefs() : [];
    for (i = 0; i < statuses.length; i++) {
      effects = effects.concat(statuses[i].effects || []);
    }

    return effects;
  };

  /**
   * 身につけている装備の定義を並べて返す。
   *
   * 枠は data/config.js の equipSlots。枠ごとの数を超えたぶんと、
   * 同じ装備の2つ目は効かない（着ける側の Game.equipItem でも止めているが、
   * データを直に触られても壊れないよう、ここでも守る）。
   *
   * @param {object} monster
   * @returns {object[]} data/items.js のエントリ
   */
  EffectSystem.prototype.getEquipments = function (monster) {
    var ids = (monster && monster.equipment) || [];
    if (typeof ids === "string") ids = [ids];   // 1つだけ持たせた場合も扱えるように

    var used = {};    // 枠id → 使った数
    var seen = {};    // 装備id → 既に数えたか
    var result = [];

    for (var i = 0; i < ids.length; i++) {
      var item = this.data.getItem(ids[i]);
      if (!item || !item.equip || seen[ids[i]]) continue;

      var slot = EffectSystem.slotOf(item);
      var count = used[slot] || 0;
      if (count >= EffectSystem.slotCapacity(this.data, slot)) continue;

      used[slot] = count + 1;
      seen[ids[i]] = true;
      result.push(item);
    }
    return result;
  };

  /** その装備の枠id。書いていない装備はアクセサリー扱い */
  EffectSystem.slotOf = function (item) {
    return (item && item.equip && item.equip.slot) || "accessory";
  };

  /** その装備の枠の表示名（data/categories.js の equipSlot）。無ければ id のまま */
  EffectSystem.slotName = function (item, gameData) {
    return EffectSystem.slotNameOf(EffectSystem.slotOf(item), gameData);
  };

  /** 枠id → 表示名 */
  EffectSystem.slotNameOf = function (slot, gameData) {
    var defs = ((gameData.categories || {}).equipSlot) || {};
    return (defs[slot] && defs[slot].name) || slot;
  };

  /** その枠が何個あるか（data/config.js の equipSlots を数える） */
  EffectSystem.slotCapacity = function (gameData, slot) {
    var slots = (gameData.config || {}).equipSlots || [];
    var count = 0;
    for (var i = 0; i < slots.length; i++) {
      if (slots[i] === slot) count++;
    }
    return count;
  };

  // --- 集計 ---

  /**
   * ステータスに掛かる倍率（何も無ければ 1）。
   * @param {string} stat "hp" / "attack" / "defense" / "speed" / "pp"
   */
  EffectSystem.prototype.getStatMultiplier = function (monster, stat) {
    var self = this;
    return this._multiply(monster, function (effect) {
      if (effect.type !== "statMultiplier" || effect.stat !== stat) return null;
      if (!self._matchCondition(monster, effect.condition)) return null;
      return effect.value;
    });
  };

  /** ステータスへの加算（何も無ければ 0） */
  EffectSystem.prototype.getStatBonus = function (monster, stat) {
    var self = this;
    return this._sum(monster, function (effect) {
      if (effect.type !== "statBonus" || effect.stat !== stat) return null;
      if (!self._matchCondition(monster, effect.condition)) return null;
      return effect.value;
    });
  };

  /**
   * 自分が与えるダメージに掛かる倍率。
   * skillKind を書いた効果は、その種類の技を使ったときだけ効く（特性「剣豪」の斬撃。通常攻撃は種類を持たないので入らない）
   */
  EffectSystem.prototype.getDamageDealtMultiplier = function (monster, elementId, skill) {
    var self = this;
    return this._multiply(monster, function (effect) {
      if (effect.type !== "damageDealt") return null;
      if (effect.element && effect.element !== elementId) return null;
      if (effect.skillKind && (!skill || skill.kind !== effect.skillKind)) return null;
      if (!self._matchCondition(monster, effect.condition)) return null;
      return effect.value;
    });
  };

  /**
   * 耐性そのものへの加算（何も無ければ 0）。
   * 倍率ではなく「耐性の数値」を動かすので、
   * data/monsters.js の resistances / statusResist に書いたのと同じ重みで効く。
   *
   * ▼ 属性と状態異常を1つの効果型で扱う
   *   { type:"resistBonus", element:"fire",  value:3 }  … 火への耐性 +3
   *   { type:"resistBonus", status:"poison", value:7 }  … 毒への耐性 +7
   *
   *   ★ どちらを書いたかで効く先が決まる。
   *     element を書いた効果は状態異常には効かず、status を書いた効果は属性に効かない。
   *     これを分けないと、炎よけの札が毒にも効いてしまう。
   *   ★ どちらも書かない resistBonus は、その種類すべてに効く（全属性・全状態異常）。
   *   ★ status: "all" は全状態異常だけ、element: "all" は全属性だけに効く（v1.0.0）
   *
   * @param {object} monster
   * @param {string} id 属性id または 状態異常id
   * @param {string} [kind] "status" なら状態異常として引く（省略時は属性）
   */
  EffectSystem.prototype.getResistBonus = function (monster, id, kind) {
    var self = this;
    var wantStatus = (kind === "status");

    return this._sum(monster, function (effect) {
      if (effect.type !== "resistBonus") return null;

      // 種類違いを弾く（炎よけの札が毒に効かないように）
      if (wantStatus && effect.element) return null;
      if (!wantStatus && effect.status) return null;

      // "all" は、その種類すべて（status: "all" … 全状態異常。属性には効かない。芽吹きの加護）
      var key = wantStatus ? effect.status : effect.element;
      if (key && key !== "all" && key !== id) return null;

      if (!self._matchCondition(monster, effect.condition)) return null;
      return effect.value;
    });
  };

  /**
   * 命中率に掛かる倍率（何も無ければ 1）。{ type:"accuracyMultiplier", value:0.8 }
   * 盲目（状態異常）とは別の仕組みで、両方掛かっていれば掛け合わさる。朧羽などの弱体で使う
   */
  EffectSystem.prototype.getAccuracyMultiplier = function (monster) {
    var self = this;
    return this._multiply(monster, function (effect) {
      if (effect.type !== "accuracyMultiplier") return null;
      if (!self._matchCondition(monster, effect.condition)) return null;
      return effect.value;
    });
  };

  /**
   * 自分が使う回復の技の回復量に掛かる倍率（何も無ければ 1）。{ type:"healDealt", value:1.2 }
   * 効くのは「使う側」。受ける側の装備は関係しない（道具の回復・再生・吸血にも効かない）。
   * 戦闘（BattleSystem._applyHeal）と探索中の技（Game.useFieldSkill）の両方が見る
   */
  EffectSystem.prototype.getHealDealtMultiplier = function (monster) {
    var self = this;
    return this._multiply(monster, function (effect) {
      if (effect.type !== "healDealt") return null;
      if (!self._matchCondition(monster, effect.condition)) return null;
      return effect.value;
    });
  };

  /**
   * 攻撃のほかのダメージ（毒・反動・罠）に掛かる倍率（何も無ければ 1）。
   * damageTaken のうち allDamage: true のものだけを見る。ふつうの軽減（厚い皮膚など）は攻撃にしか効かない
   */
  EffectSystem.prototype.getAllDamageMultiplier = function (monster) {
    return this._multiply(monster, function (effect) {
      return (effect.type === "damageTaken" && effect.allDamage) ? effect.value : null;
    });
  };

  /** 自分が技に払うPPに掛かる倍率（何も無ければ 1）。{ type:"ppCostMultiplier", value:1.5 }（特性「カチカチ」） */
  EffectSystem.prototype.getPpCostMultiplier = function (monster) {
    var self = this;
    return this._multiply(monster, function (effect) {
      if (effect.type !== "ppCostMultiplier") return null;
      if (!self._matchCondition(monster, effect.condition)) return null;
      return effect.value;
    });
  };

  /** 自分が受けるダメージに掛かる倍率 */
  EffectSystem.prototype.getDamageTakenMultiplier = function (monster, elementId) {
    var self = this;
    return this._multiply(monster, function (effect) {
      if (effect.type !== "damageTaken") return null;
      if (effect.element && effect.element !== elementId) return null;
      if (!self._matchCondition(monster, effect.condition)) return null;
      return effect.value;
    });
  };

  /**
   * 受けるダメージが毎回ばらつく効果（特性「ギャンブル」。{ type:"damageTakenRandom", min:0.75, max:1.25 }）。
   * 当たるたびに min〜max から1つ引く。乱数は呼ぶ側（BattleSystem.calcDamage）が渡す。
   * 見積もり（作戦のAI）では引かず、真ん中の値を使う（random を渡さない）。何も無ければ 1
   */
  EffectSystem.prototype.getDamageTakenRandomMultiplier = function (monster, random) {
    var self = this;
    return this._multiply(monster, function (effect) {
      if (effect.type !== "damageTakenRandom") return null;
      if (!self._matchCondition(monster, effect.condition)) return null;
      var min = (typeof effect.min === "number") ? effect.min : 1;
      var max = (typeof effect.max === "number") ? effect.max : min;
      return random ? min + random.next() * (max - min) : (min + max) / 2;
    });
  };

  /** 条件を満たしているか。condition が無ければ常に true */
  EffectSystem.prototype._matchCondition = function (monster, condition) {
    if (!condition) return true;

    var maxHp = monster.getMaxHp ? monster.getMaxHp() : 0;
    var ratio = maxHp > 0 ? (monster.currentHp / maxHp) : 0;

    if (condition.hpBelow !== undefined && ratio > condition.hpBelow) return false;
    if (condition.hpAbove !== undefined && ratio < condition.hpAbove) return false;
    return true;
  };

  /** 当てはまる効果の値をすべて掛け合わせる */
  EffectSystem.prototype._multiply = function (monster, pick) {
    var effects = this.collectEffects(monster);
    var total = 1;

    for (var i = 0; i < effects.length; i++) {
      var value = pick(effects[i]);
      if (typeof value === "number") total *= value;
    }
    return total;
  };

  /** 当てはまる効果の値をすべて足し合わせる */
  EffectSystem.prototype._sum = function (monster, pick) {
    var effects = this.collectEffects(monster);
    var total = 0;

    for (var i = 0; i < effects.length; i++) {
      var value = pick(effects[i]);
      if (typeof value === "number") total += value;
    }
    return total;
  };

  /**
   * 効果1つを日本語の1行にする（画面に出すため）。
   *
   * 装備・加護・特性のどこから来た効果でも同じ書き方になるよう、
   * 文章の組み立てはここ1か所にまとめてある。
   *
   * @param {object} effect 効果1件
   * @param {MyGame.GameData} gameData 属性名やラベルを引くために使う
   * @returns {string} 表せない種類なら空文字
   */
  EffectSystem.describeEffect = function (effect, gameData) {
    if (!effect) return "";

    var party = ((gameData.messages || {}).party) || {};
    var labels = {
      hp: "HP", pp: "PP",
      attack: party.attackLabel || "攻撃",
      defense: party.defenseLabel || "防御",
      speed: party.speedLabel || "素早さ"
    };
    var stat = labels[effect.stat] || effect.stat;
    var text = "";

    if (effect.type === "statBonus") {
      text = stat + " " + (effect.value >= 0 ? "+" : "") + effect.value;
    } else if (effect.type === "statMultiplier") {
      text = stat + " ×" + effect.value;
    } else if (effect.type === "damageDealt" || effect.type === "damageTaken") {
      var element = (gameData.elements || {})[effect.element];
      var kind = (effect.type === "damageDealt") ? "与ダメージ" : "被ダメージ";
      // 属性を書いたものだけ「火の与ダメージ」。書いていなければ全部に効くので、属性は付けない。
      // 技の種類を書いたものは「斬撃の与ダメージ」
      var skillKind = effect.skillKind ? ((gameData.categories || {}).skillKind || {})[effect.skillKind] : null;
      text = (element ? element.name + "の" : "") + (skillKind ? skillKind.name + "の" : "") + kind + " ×" + effect.value;
    } else if (effect.type === "resistBonus") {
      // 属性の耐性（炎よけの札）と、状態異常の耐性（毒よけの護符）の両方。
      // ここが無かったころは、工房や仲間画面の効果欄に**空の行**が出ていた
      var target;
      if (effect.status === "all") {
        target = party.allStatuses || "全状態異常";
      } else if (effect.element === "all") {
        target = party.allElements || "全";
      } else if (effect.status) {
        var status = (gameData.statuses || {})[effect.status];
        target = status ? status.name : effect.status;
      } else if (effect.element) {
        var el = (gameData.elements || {})[effect.element];
        target = el ? el.name : effect.element;
      } else {
        target = party.allElements || "全";
      }
      text = target + "への耐性 " + (effect.value >= 0 ? "+" : "") + effect.value;
    } else if (effect.type === "regen") {
      text = (effect.max && party.effectRegenMax)
        ? fillText(party.effectRegenMax, { percent: percentOf(effect.value), max: effect.max })
        : fillText(party.effectRegen || "HP{percent}%", { percent: percentOf(effect.value) });
    } else if (effect.type === "ppRegen") {
      text = fillText(party.effectPpRegen || "毎ターン PP{value}回復", { value: effect.value || 0 });
    } else if (effect.type === "damageByTargetHp") {
      // 「相手HP100%以上 ×1.2・75%以上 ×1.1・50%以下 ×0.9」のように並べる
      text = (party.effectByTargetHp || "") + (effect.tiers || []).map(function (tier) {
        var pct = Math.round(((tier.atLeast !== undefined) ? tier.atLeast : tier.atMost) * 100);
        return pct + "%" + ((tier.atLeast !== undefined) ? "以上" : "以下") + " ×" + tier.value;
      }).join("・");
    } else if (effect.type === "onHitStatus") {
      var hitDef = (gameData.statuses || {})[effect.status];
      text = fillText(effect.normalAttackOnly ? party.effectOnHitNormal : party.effectOnHit,
        { percent: percentOf(effect.chance === undefined ? 1 : effect.chance),
          status: hitDef ? hitDef.name : effect.status });
    } else if (effect.type === "counterStatus") {
      var counterDef = (gameData.statuses || {})[effect.status];
      text = fillText((effect.trigger === "normalAttack")
                        ? party.effectCounterNormal : party.effectCounter,
        { percent: percentOf(effect.chance === undefined ? 1 : effect.chance),
          status: counterDef ? counterDef.name : effect.status });
    } else if (effect.type === "counterModifier") {
      // 「攻撃を受けると30%で相手の素早さ ×0.75」（ねばねば）
      var counterMod = ((effect.modifier || {}).effects || [])[0];
      text = fillText(party.effectCounterModifier || "被弾時 {percent}%で相手の{what}",
        { percent: percentOf(effect.chance === undefined ? 1 : effect.chance),
          what: counterMod ? EffectSystem.describeEffect(counterMod, gameData) : "" });
    } else if (effect.type === "regenOverTime") {
      text = fillText(party.effectRegenOverTime || "毎ターン HP{min}〜{max}%回復",
        { min: percentOf(effect.min), max: percentOf(effect.max || effect.min) });
    } else if (effect.type === "drain") {
      text = fillText(effect.normalAttackOnly ? party.effectDrainNormal : party.effectDrain,
        { percent: percentOf(effect.value) });
    } else if (effect.type === "accuracyMultiplier") {
      text = (party.accuracyLabel || "命中") + " ×" + effect.value;
    } else if (effect.type === "healDealt") {
      text = (party.healDealtLabel || "回復の技") + " ×" + effect.value;
    } else if (effect.type === "firstStrike") {
      text = party.effectFirstStrike || "";
    } else if (effect.type === "undying") {
      text = party.effectUndying || "";
    } else if (effect.type === "shedStatus") {
      text = fillText(party.effectShedStatus, { percent: percentOf(effect.chance === undefined ? 1 : effect.chance) });
    } else if (effect.type === "tailwind") {
      text = fillText(party.effectTailwind, { turns: effect.turns || 1, value: effect.value });
    } else if (effect.type === "wardAlly") {
      text = party.effectWardAlly || "";
    }

    if (text && effect.condition) text += describeCondition(effect.condition);
    return text;
  };

  /** 0.06 → 6（割合を%の整数に） */
  function percentOf(value) {
    return Math.round((value || 0) * 100);
  }

  /** 文言の {key} を埋める。文言が無ければ空文字 */
  function fillText(template, values) {
    if (!template) return "";
    return String(template).replace(/\{(\w+)\}/g, function (match, key) {
      return (values[key] !== undefined) ? values[key] : match;
    });
  }

  /** 条件つきの効果に「（HP25%以下のとき）」のようなただし書きを足す */
  function describeCondition(condition) {
    if (condition.hpBelow !== undefined) {
      return "（HP" + Math.round(condition.hpBelow * 100) + "%以下のとき）";
    }
    if (condition.hpAbove !== undefined) {
      return "（HP" + Math.round(condition.hpAbove * 100) + "%以上のとき）";
    }
    return "";
  }

  NS.EffectSystem = EffectSystem;
})(window.MyGame);
