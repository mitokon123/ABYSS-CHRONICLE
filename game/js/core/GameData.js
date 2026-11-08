/**
 * GameData.js
 * 読み込み済みデータの「管理・参照窓口」。
 * 各システム／エンティティは DataLoader ではなく、この GameData を参照する。
 *
 * 例: gameData.config, gameData.monsters, gameData.getMonsterData("slime")
 */
(function (NS) {
  "use strict";

  /**
   * @param {object} raw 生データ（MyGame.rawData 相当）
   */
  function GameData(raw) {
    raw = raw || {};
    // カテゴリごとに保持（未定義でも空オブジェクトで安全に扱えるようにする）
    this.config    = raw.config    || {};
    this.monsters  = raw.monsters  || {}; // MonsterData（種族/図鑑データ）
    this.skills    = raw.skills    || {};
    this.statuses  = raw.statuses  || {}; // 状態異常（毒・麻痺など）
    this.items     = raw.items     || {};
    this.abilities = raw.abilities || {}; // 特性・パッシブ
    this.categories = raw.categories || {}; // アイテム・モンスターの分類
    this.elements  = raw.elements  || {}; // 属性（現在は表示のみ）
    this.natures   = raw.natures   || {}; // 性格（個体の味付け）
    this.growth    = raw.growth    || {}; // 成長・経験値の計算パラメータ
    this.battle    = raw.battle    || {}; // 戦闘の計算パラメータ
    this.scout     = raw.scout     || {}; // スカウトの計算パラメータ
    this.naming    = raw.naming    || {}; // 名前をつける文字盤（文字表・最大文字数）
    this.run       = raw.run       || {}; // 1回の挑戦（ラン）の設定
    this.shop      = raw.shop      || {}; // ショップの品揃えと値段
    this.recipes   = raw.recipes   || {}; // 工房で作れるもの
    this.blessings = raw.blessings || {}; // 階を降りるたびに選ぶ加護
    this.patchnotes = raw.patchnotes || {}; // 更新履歴（タイトル画面で表示）
    this.help      = raw.help      || {}; // 遊び方（よくある質問と答え）
    this.tutorial  = raw.tutorial  || {}; // 初めての場面で出る説明
    this.story     = raw.story     || {}; // 物語の場面
    this.charaLooks = raw.charaLooks || {}; // 人間の登場人物の見た目（部品を重ねて描く。data/sprites_story.js）
    this.affection = raw.affection || {}; // 愛情度の段階と報酬
    this.audio     = raw.audio     || {}; // BGMと効果音の一覧
    this.home      = raw.home      || {}; // 拠点メニューの項目
    this.player    = raw.player    || {}; // プレイヤーの初期状態
    this.save      = raw.save      || {}; // セーブの設定
    this.keys      = raw.keys      || {}; // キー割り当て
    this.settings  = raw.settings  || {}; // プレイヤー設定の定義
    this.ui        = raw.ui        || {}; // UIの配置・配色
    this.messages  = raw.messages  || {}; // 表示文言
    this.enemies   = raw.enemies   || {};
    this.bosses    = raw.bosses    || {};
    this.dungeon   = raw.dungeon   || {}; // タイル定義とマップ生成の既定
    this.dungeonThemes = raw.dungeonThemes || {}; // ダンジョンごとの色と床の飾り
    this.features  = raw.features  || {}; // 仕掛けマス（宝箱・泉・罠）の定義
    this.dungeons  = raw.dungeons  || {}; // 挑めるダンジョンの一覧
    this.regions   = raw.regions   || {}; // 地方（穴）の名前
    this.sprites   = raw.sprites   || {};
    this.motions   = raw.motions   || {}; // 絵の動かし方（浮く・呼吸する など）
    this.motionDefaults = raw.motionDefaults || {}; // 場面ごとの動きの既定（全種族共通）
    this.effects   = raw.effects   || {}; // 技を当てたときの演出の型
  }

  // --- アクセサ（存在しない id は null を返す） ---
  GameData.prototype.getMonsterData = function (id) { return this.monsters[id] || null; };
  GameData.prototype.getSkill       = function (id) { return this.skills[id]   || null; };
  GameData.prototype.getStatus      = function (id) { return this.statuses[id] || null; };
  GameData.prototype.getItem        = function (id) { return this.items[id]    || null; };
  GameData.prototype.getNature      = function (id) { return this.natures[id]  || null; };

  /** 技の種類（data/categories.js の skillKind）。種類を持たない技（通常攻撃）は null */
  GameData.prototype.getSkillKind = function (skill) {
    if (!skill || !skill.kind) return null;
    return (this.categories.skillKind || {})[skill.kind] || null;
  };

  /** 画面に出す技の属性の名前。2つあれば「火・地」（skills.js の element2）。無属性でも "無"。分からなければ null */
  GameData.prototype.getSkillElementName = function (skill) {
    var first = skill ? this.elements[skill.element] : null;
    if (!first) return null;
    var second = skill.element2 ? this.elements[skill.element2] : null;
    return second ? first.name + "・" + second.name : first.name;
  };

  /**
   * 画面に出す技の威力。斬撃の威力は通常攻撃の倍率なので、1 は "1.0" と出す（1.25 などはそのまま）。
   * ほかの種類の威力は足し算の値なので、そのまま（15 は "15"）。威力なしは "0"
   */
  GameData.prototype.formatSkillPower = function (skill) {
    var power = (skill && skill.power) || 0;
    if (skill && skill.kind === "slash" && power === Math.floor(power) && power > 0) return power.toFixed(1);
    return String(power);
  };

  /**
   * 技の決まり（evadable / canCritical など）を読む。
   * 技に書いてあればそれを、無ければ種類の rules を使う（ブレスはよけられない、など）。
   */
  GameData.prototype.getSkillRule = function (skill, key) {
    if (!skill) return undefined;
    if (skill[key] !== undefined) return skill[key];
    var kind = this.getSkillKind(skill);
    return (kind && kind.rules) ? kind.rules[key] : undefined;
  };

  NS.GameData = GameData;
})(window.MyGame);
