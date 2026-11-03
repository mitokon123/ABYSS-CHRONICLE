/**
 * MonsterData.js
 * 種族データ（図鑑データ）を扱うヘルパー。
 * 種族データそのものは data/monsters.js にあり、GameData 経由で取得する。
 * ここでは「種族データに対する問い合わせ」だけを提供し、個体の状態は持たない。
 */
(function (NS) {
  "use strict";

  var MonsterData = {
    /**
     * 指定レベルまでに覚える技のidリストを返す。
     * @param {object} species 種族データ
     * @param {number} level
     * @returns {string[]}
     */
    skillsUpToLevel: function (species, level) {
      var result = [];
      var learnset = (species && species.learnset) || [];
      for (var i = 0; i < learnset.length; i++) {
        var entry = learnset[i];
        if (entry.level <= level && result.indexOf(entry.skill) === -1) {
          result.push(entry.skill);
        }
      }
      return result;
    },

    /**
     * 敵として出たときに使う技のidリストを返す（data/monsters.js の enemySkills）。
     * 書き方は learnset と同じ [{ level, skill }]。そのレベルまでのものを使う。
     * enemySkills を書いていない種族は null（呼び出し側は learnset のままにする）。
     * @returns {string[]|null}
     */
    enemySkillsUpToLevel: function (species, level) {
      if (!species || !species.enemySkills) return null;
      return MonsterData.skillsUpToLevel({ learnset: species.enemySkills }, level);
    },

    /**
     * ちょうどそのレベルで覚える技のidリストを返す（レベルアップ時に使用）。
     */
    skillsLearnedAtLevel: function (species, level) {
      var result = [];
      var learnset = (species && species.learnset) || [];
      for (var i = 0; i < learnset.length; i++) {
        if (learnset[i].level === level) result.push(learnset[i].skill);
      }
      return result;
    }
  };

  NS.MonsterData = MonsterData;
})(window.MyGame);
