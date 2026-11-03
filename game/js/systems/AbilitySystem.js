/**
 * AbilitySystem.js
 * アビリティ（特性）のうち、「どれが効くか」を決める。
 *
 * ▼ 役割
 * 種族データから、実際に効く特性の定義を並べて返すだけ。
 * 効果の集計（倍率を掛け合わせる・条件を見る）は js/systems/EffectSystem.js が
 * 装備・加護・強化とまとめて行う。
 *
 * ▼ 相手に必要なインターフェース
 *   getSpecies() : 種族データ（abilities に特性idの配列を持つ）
 */
(function (NS) {
  "use strict";

  /**
   * @param {MyGame.GameData} gameData
   */
  function AbilitySystem(gameData) {
    this.data = gameData;
  }

  /**
   * そのモンスターが持つアビリティの定義を並べて返す。
   *
   * 1体が持てる数は data/config.js の abilityMax まで（現在は1つ）。
   * データに多く書かれていても、先頭から数えてこの数までしか効かない。
   *
   * @param {object} monster
   * @returns {object[]}
   */
  AbilitySystem.prototype.getAbilities = function (monster) {
    var species = (monster && monster.getSpecies) ? monster.getSpecies() : null;
    return this.resolveAbilities(species);
  };

  /**
   * 種族データから、実際に効く特性の定義を並べて返す。
   * 図鑑など、個体が無い場面でも使えるようにしてある。
   * @param {object} species 種族データ
   */
  AbilitySystem.prototype.resolveAbilities = function (species) {
    var ids = (species && species.abilities) || [];
    var limit = (this.data.config || {}).abilityMax;
    if (typeof limit !== "number") limit = ids.length;

    var result = [];
    for (var i = 0; i < ids.length && result.length < limit; i++) {
      var ability = (this.data.abilities || {})[ids[i]];
      if (ability) result.push(ability);
    }
    return result;
  };

  NS.AbilitySystem = AbilitySystem;
})(window.MyGame);
