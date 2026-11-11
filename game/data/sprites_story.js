/**
 * sprites_story.js
 * 物語の場面に立つ人物の絵（data/story.js の actors から sprite で参照する）。
 *
 * ★ 見た目はこの絵で確定（ストーリー構成.md の「導入で話す人物」）。
 *   描き直すときは id を変えなければ、場面の側（data/story.js）は触らなくてよい。
 *
 * 大きさは主人公（playerWalk1）と同じ 32×32。並べたときに背丈がそろうようにしてある。
 * 書き方（パレット・pixels）は data/sprites.js を参照。
 */
(function (NS) {
  "use strict";

  NS.extend("sprites", {

    /**
     * オルド（試験官）。ベテランの探索者。
     * 灰色の髪と髭、膝まである茶色の外套。主人公より肩幅を広くしてある
     */
    npcOrd: {
      palette: {
        ".": null,
        "K": "#101425",   // 輪郭・目
        "G": "#8e949e",   // 髪
        "W": "#c4c8d0",   // 髭
        "S": "#e0b48c",   // 肌
        "T": "#b88a66",   // 肌の影
        "L": "#8a6440",   // 外套の光が当たる面
        "C": "#6b4a2e",   // 外套
        "c": "#4a321e",   // 外套の影
        "M": "#2a1e14",   // ベルト
        "P": "#34343e",   // ズボン
        "N": "#1e1a16"    // 靴
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "............KKKKKKKK............",
        "...........KGGGGGGGGK...........",
        "..........KGGGGGGGGGGK..........",
        "..........KGGSSSSSSGGK..........",
        "..........KGSSSSSSSSGK..........",
        "..........KGSKKSSKKSGK..........",
        "..........KGSSSSSSSSGK..........",
        "..........KSWWWTTWWWSK..........",
        "..........KSWWWWWWWWSK..........",
        "...........KWWWWWWWWK...........",
        "........KLLLLLLLLLLLLLLK........",
        "........KLLCCCCcCCCCCccK........",
        "........KLLCCCCcCCCCCccK........",
        "......KLLLLCCCCcCCCCCccccK......",
        "......KLLLLCCCCcCCCCCccccK......",
        "......KSSLLCCCCcCCCCCccSSK......",
        "........KLLCCCCcCCCCCccK........",
        "........KMMMMMMMMMMMMMMK........",
        "........KLLCCCCcCCCCCccK........",
        "........KLLCCCCcCCCCCccK........",
        "........KLLCCCCcCCCCCccK........",
        "........KKKKKKKKKKKKKKKK........",
        "..........KPPK...KPPK...........",
        "..........KPPK...KPPK...........",
        ".........KNNNK...KNNNK..........",
        ".........KKKKK...KKKKK..........",
        "................................",
        "................................"
      ]
    },

    /**
     * イレーネ（探索者協会の支部長）。
     * 肩まで届く暗い髪、金の縁取りのある紺の長衣
     */
    npcIrene: {
      palette: {
        ".": null,
        "K": "#101425",   // 輪郭・目
        "H": "#3a2a4a",   // 髪
        "h": "#5a4470",   // 髪の光
        "S": "#f2d0b0",   // 肌
        "T": "#d4a88a",   // 肌の影・口
        "R": "#2e3f7a",   // 長衣
        "r": "#1f2b58",   // 長衣の影
        "O": "#d8b24a",   // 金の縁取り
        "N": "#1a1a26"    // 靴
      },
      pixels: [
        "................................",
        "................................",
        "................................",
        "................................",
        "............KKKKKKKK............",
        "...........KhHHHHHHHK...........",
        "..........KhHHHHHHHHHK..........",
        "..........KHHSSSSSSHHK..........",
        "..........KHSSSSSSSSHK..........",
        "..........KHSKKSSKKSHK..........",
        "..........KHSSSSSSSSHK..........",
        "..........KHSSSTTSSSHK..........",
        ".........KHHKSSSSSSKHHK.........",
        ".........KHHHKSSSSKHHHK.........",
        ".........KHHOOOOOOOOHHK.........",
        ".........KHRRRROORRRrHK.........",
        ".........KHRRRROORRRrHK.........",
        ".......KRRRRRRROORRRRrrrK.......",
        ".......KRRRRRRROORRRRrrrK.......",
        ".......KSSRRRRROORRRRrSSK.......",
        ".........KRRRRROORRRrrK.........",
        ".........KOOOOOOOOOOOOK.........",
        ".........KRRRRROORRRrrK.........",
        "........KRRRRRROORRRRrrK........",
        "........KRRRRRROORRRRrrK........",
        ".......KRRRRRRROORRRRrrrK.......",
        ".......KRRRRRRROORRRRrrrK.......",
        ".......KOOOOOOOOOOOOOOOOK.......",
        "..........KNNK....KNNK..........",
        "..........KKKK....KKKK..........",
        "................................",
        "................................"
      ]
    }
  });

  /**
   * 人間の登場人物の見た目（v1.2.0）。
   * 部品を重ねて描く仕組み（js/systems/CharaRig.js）で、主人公と同じ大きさ・描き方にそろえる。
   * ★ これから出る人間の登場人物も、ここに1人ずつ足していく（作者の指定 2026-10-29）。
   *   書き方は CharaRig.makeLook の説明のとおり。色は上の 32×32 の絵の色をそのまま使っている。
   *
   * ★ いまは見本（chara-viewer.html）で見るだけ。物語の場面ではまだ上の 32×32 の絵を使っている。
   */
  NS.extend("charaLooks", {
    // オルド：灰色の髪と髭、膝まである茶色の外套。肩幅を広く
    ord: {
      name: "オルド",
      body: "male", build: "broad", outfit: "coat", hair: "slick", buckle: false,
      skin:      { base: "#e0b48c", light: "#ecc8a4", shadow: "#b88a66" },
      hairColor: { base: "#8e949e", light: "#b4b9c2", shadow: "#686d78" },
      beard:     { base: "#c4c8d0", light: "#e2e5ea", shadow: "#9a9fab" },
      cloth:     { base: "#6b4a2e", light: "#8a6440", shadow: "#4a321e" },
      belt:      { base: "#2a1e14", light: "#3e2e20", shadow: "#1a120c" },
      pants:     { base: "#34343e", light: "#4a4a56", shadow: "#22222a" },
      shoes:     { base: "#1e1a16", light: "#34302a", shadow: "#120f0c" },
      eye:       { base: "#2a2a34", light: "#4a4a5a", shadow: "#1a1a22" }
    },

    // イレーネ：肩まで届く暗い髪、金の縁取りのある紺の長衣
    irene: {
      name: "イレーネ",
      body: "female", outfit: "robe", hair: "medium", buckle: false,
      skin:      { base: "#f2d0b0", light: "#fadfc6", shadow: "#d4a88a" },
      hairColor: { base: "#3a2a4a", light: "#5a4470", shadow: "#24182e" },
      cloth:     { base: "#2e3f7a", light: "#40549a", shadow: "#1f2b58" },
      trim:      { base: "#d8b24a", light: "#f0d47a", shadow: "#a8862a" },
      shoes:     { base: "#1a1a26", light: "#2e2e40", shadow: "#101018" },
      eye:       { base: "#3a2a5a", light: "#6a5490", shadow: "#24183a" }
    },

    // 探索者（場面6。名前なし）：形は主人公と同じで、髪と服の色だけ変える
    scout: {
      name: "探索者",
      body: "male", outfit: "tunic", hair: "short",
      hairColor: { base: "#6a4a2a", light: "#8a6a44", shadow: "#4a3018" },
      cloth:     { base: "#5a7a4a", light: "#7a9a64", shadow: "#3e5a36" }
    }
  });
})(window.MyGame);
