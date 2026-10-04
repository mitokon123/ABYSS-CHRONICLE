/**
 * categories.js
 * アイテムとモンスターの「分類」定義。図鑑や持ち物の並び・絞り込みに使う。
 *
 * item     : アイテムの分類（回復・素材など）
 * monster  : モンスターの分類（系統。属性とは別の軸）
 * skillKind: 技の種類（共鳴・ブレス・体技・斬撃・踊り）
 *
 * 共通の項目
 *   id    : 識別子
 *   name  : 表示名
 *   order : 並び順（小さいほど先）
 *   color : 見出しに使う色
 *
 * ★ 分類を増やすときは、このファイルに1エントリ足すだけでよい。
 *   アイテム側は items.js の category、モンスター側は monsters.js の family で参照する。
 */
(function (NS) {
  "use strict";

  NS.rawData.categories = {
    item: {
      heal:      { id: "heal",      name: "回復", order: 1, color: "#5fd18c" },
      tool:      { id: "tool",      name: "道具", order: 2, color: "#7fd9a8" },
      equipment: { id: "equipment", name: "装備", order: 3, color: "#7fd9e8" },
      material:  { id: "material",  name: "素材", order: 4, color: "#c8a35e" },
      key:       { id: "key",       name: "重要", order: 5, color: "#e8b4ff" }
    },

    /**
     * 装備の枠（items.js の equip.slot）。「装備」の中をさらに分ける小分類。
     * 図鑑・持ち物・店の一覧の見出しと、仲間画面の「武器：」のような表示名に使う。
     * 枠がいくつあるかは config.js の equipSlots。
     */
    equipSlot: {
      weapon:    { id: "weapon",    name: "武器",       order: 1, color: "#e8a86a" },
      armor:     { id: "armor",     name: "防具",       order: 2, color: "#7fb0e8" },
      accessory: { id: "accessory", name: "アクセサリー", order: 3, color: "#c8a3e8" }
    },

    monster: {
      slimeKind:     { id: "slimeKind",     name: "スライム系", order: 1, color: "#5fd18c" },
      beastKind:     { id: "beastKind",     name: "獣系",       order: 2, color: "#c8a35e" },
      insectKind:    { id: "insectKind",    name: "虫系",       order: 3, color: "#a8d86f" },
      constructKind: { id: "constructKind", name: "造物系",     order: 4, color: "#7d7a72" },
      birdKind:      { id: "birdKind",      name: "鳥系",       order: 5, color: "#7fd9e8" },
      plantKind:     { id: "plantKind",     name: "植物系",     order: 6, color: "#8a5fb0" },
      dragonKind:    { id: "dragonKind",    name: "竜系",       order: 7, color: "#e8542a" },
      demonKind:     { id: "demonKind",     name: "魔族系",     order: 8, color: "#b06fd6" }
    },

    // 特性の分類（図鑑での並びと見出しに使う）
    ability: {
      stat:   { id: "stat",   name: "能力変化", order: 1, color: "#4fb0d1" },
      damage: { id: "damage", name: "ダメージ", order: 2, color: "#e8542a" },
      // 戦闘中に何かを起こす特性（再生・放電・先手など）
      special: { id: "special", name: "特殊", order: 3, color: "#b48ce0" }
    },

    /**
     * 技の種類（skills.js の kind）。通常攻撃はどれにも入らない。
     *   rules : その種類の技すべてに付く決まり。技の側に同じ項目を書けば、そちらが優先
     *           evadable: false … よけられない / canCritical: false … クリティカルが出ない
     *   note  : 図鑑の技の「種類」の下に添える一言（15文字で折り返す）。rules や封印を変えたら直すこと
     * 計算の係数は data/battle.js の damage.byKind、封印で止まる種類は data/statuses.js の seal。
     * 特徴は 技の種類.md。
     */
    skillKind: {
      // 技の威力に頼る。元の威力が高く、追加効果を持つものが多い。封印で止まるのはこの種類だけ
      // casterEffect … 技を出した本人のまわりに出す演出（data/effects.js の型。RC-1）
      resonance: { id: "resonance", name: "共鳴", order: 1, color: "#b48ce0",
                   note: "封印されると使えない", casterEffect: "resonance" },
      // 威力に頼る。PPが少なめ。状態異常や全体へのダメージ
      breath:    { id: "breath",    name: "ブレス", order: 2, color: "#7fd9e8",
                   rules: { evadable: false, canCritical: false },
                   note: "よけられない・クリティカルなし" },
      // 攻撃力も大きく関わる。属性技・強化／弱体の技がそろう
      body:      { id: "body",      name: "体技", order: 3, color: "#e8a86a" },
      // 攻撃力に大きく頼る。属性技や全体技もある
      slash:     { id: "slash",     name: "斬撃", order: 4, color: "#e8542a" },
      // 特殊効果が多く、攻め方もいろいろ
      dance:     { id: "dance",     name: "踊り", order: 5, color: "#ffd75e" }
    }
  };
})(window.MyGame);
