/**
 * naming.js
 * 名前をつけるときの決まり。
 *
 * ★ 2026-10-27 文字盤をやめ、キーボードで打つ入力欄にした（作者の指定）。
 *   漢字・英字・記号も使える。しくみは js/ui/NameInput.js。置き場所は data/ui.js の nameInput。
 *
 * maxLength       : 仲間の名前の長さ（作者の指定で 8 → 10）。漢字・絵文字も1文字と数える
 *   戦闘の名前枠は 190px。12pxの等幅で全角10文字＝120px だと、名前の後ろに並ぶ強化・弱体の印が Lv 表示に届くので、
 *   名前が 100px を超えるときだけ 10px の字で出す（BattleScene._nameFont。全角10文字で100px＝前の8文字とほぼ同じ幅）
 * playerMaxLength : 主人公の名前の長さ（8 のまま。会話の文に入るので長くしない）
 */
(function (NS) {
  "use strict";

  NS.rawData.naming = {
    maxLength: 10,
    playerMaxLength: 8
  };
})(window.MyGame);
