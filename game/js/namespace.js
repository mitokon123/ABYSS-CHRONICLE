/**
 * namespace.js
 * このゲームで使用する唯一のグローバル名前空間を定義する。
 * 以降のすべてのファイルは、この `MyGame` の下に IIFE で登録し、
 * グローバル変数の汚染を避ける。
 *
 * - MyGame        : クラス・システムの登録先
 * - MyGame.rawData: data/*.js が登録する生データ（JSONと同等のオブジェクト）
 * - MyGame.extend : 同じ種類のデータを複数ファイルに分けて書くための追加関数
 */
window.MyGame = window.MyGame || {};
window.MyGame.rawData = window.MyGame.rawData || {};

/**
 * rawData の1カテゴリへ、まとめて項目を追加する。
 *
 * スプライトやモンスターのように数が増えていくデータは、
 * 1ファイルに全部書くと読めなくなるので、地方や用途ごとにファイルを分ける。
 * その分けたファイルから、同じカテゴリへ追加していくために使う。
 *
 *   MyGame.extend("sprites", { chest: {...}, spring: {...} });
 *
 * 読み込む順番はどうでもよい（先に呼ばれた方が入れ物を作る）。
 * ただし同じidを2つのファイルに書くと、あとから読み込んだ方で上書きされる。
 *
 * @param {string} category rawData のキー（"sprites" など）
 * @param {object} entries 追加する項目（{ id: 定義 }）
 */
window.MyGame.extend = function (category, entries) {
  var raw = window.MyGame.rawData;
  var target = raw[category] || (raw[category] = {});

  for (var id in entries) {
    if (!Object.prototype.hasOwnProperty.call(entries, id)) continue;
    target[id] = entries[id];
  }
  return target;
};

/**
 * 決められた文字数で折り返す（説明欄・図鑑・店・工房・戦闘・お知らせ・ヘルプなど、文字数で切る所はすべてこれ）。
 * 専用のファイルに分けず、最初に読む namespace.js に置いてある（新しいファイルは古い app.html だと読まれないため）。
 *
 * ★ 読みやすさのための決まり（作者の指定 2026-11-10）
 *   1. 行の頭に「。」「、」などを置かない。来るときは前の行の終わりへ送る（その行だけ1〜2文字長くなる）
 *   2. 言葉の途中で切らない（「重｛改行｝く」のようにしない）。
 *      辞書は持たないので、文字の種類で切れ目を決める（MyGame.canBreakBetween）：
 *        ・句読点や閉じかっこの後、空白の後、開きかっこの前
 *        ・ひらがなの後に、漢字・カタカナ・英数字が来る所（「鎧を｜着る」「火の｜ブレス」）
 *      漢字どうし・カタカナどうし・漢字の後のひらがな（送りがな）では切らない。
 *      いちばん後ろの切れ目で切る。行の3分の1より前にしか無いとき（長い漢字の並びなど）は、
 *      行が短くなりすぎるので文字数で切る（1. は守る）
 *
 * @param {string} text
 * @param {number} charsPerLine
 * @returns {string[]}
 */
window.MyGame.NO_LINE_START = "。、）」』】〉》”’!?！？…・:：;；ー" +
  "ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮ";

(function (NS) {
  var BREAK_AFTER = "。、，．）」』】〉》”’!?！？…・:：;； 　";
  var OPEN = "「『（(【〈《“‘";
  function isHira(c) { return c >= "ぁ" && c <= "ゟ"; }
  function isKata(c) { return c >= "゠" && c <= "ヿ" && c !== "ー" && c !== "・"; }
  function isKanji(c) { return (c >= "一" && c <= "鿿") || c === "々"; }
  function isAlnum(c) { return /[A-Za-z0-9０-９Ａ-Ｚａ-ｚ×%％+＋\-]/.test(c); }

  /** a と b のあいだで改行してよいか */
  NS.canBreakBetween = function (a, b) {
    if (!a || !b) return false;
    if (NS.NO_LINE_START.indexOf(b) >= 0) return false;
    if (OPEN.indexOf(a) >= 0) return false;
    if (BREAK_AFTER.indexOf(a) >= 0) return true;
    if (OPEN.indexOf(b) >= 0) return true;
    if (isHira(a) && (isKanji(b) || isKata(b) || isAlnum(b))) return true;
    return false;
  };

  NS.wrapText = function (text, charsPerLine) {
    var lines = [];
    var source = String(text || "");
    var per = charsPerLine || 20;
    var minLen2 = Math.ceil(per / 3);  // これより短い行になるなら、言葉の途中でも文字数で切る
    var ng = NS.NO_LINE_START;

    while (source.length > per) {
      var cut = -1;
      // 次の行の頭に句読点が来るなら、句読点まで前の行に収める（句読点の後は切れ目）
      var hang = per;
      while (hang < source.length && BREAK_AFTER.indexOf(source.charAt(hang)) >= 0) hang++;
      if (hang > per) cut = hang;
      // 行の中で、いちばん後ろの切れ目を探す（行の3分の1まで）
      for (var b = per; cut < 0 && b >= minLen2; b--) {
        if (NS.canBreakBetween(source.charAt(b - 1), source.charAt(b))) cut = b;
      }
      // 切れ目が無い：文字数で切る。ただし小さい「っ」や「ー」も行の頭に置かない
      if (cut < 0) {
        cut = per;
        while (cut < source.length && ng.indexOf(source.charAt(cut)) >= 0) cut++;
      }
      lines.push(source.slice(0, cut));
      source = source.slice(cut);
    }
    if (source.length > 0) lines.push(source);
    return lines;
  };
})(window.MyGame);
