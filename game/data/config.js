/**
 * config.js
 * ゲーム全体の基本設定。数値はコードに直接書かず、ここで管理する。
 * （中身は JSON と同じ構造。将来 config.json へ移行しやすい形にしてある）
 */
(function (NS) {
  "use strict";

  NS.rawData.config = {
    gameTitle: "ABYSS CHRONICLE", // ゲーム名
    worldName: "Monstoria",       // 世界名
    // バージョン表記（履歴は data/patchnotes.js）。RC はリリース前（Release Candidate）の仕上げ版。
    // 書き方（作者が決めた 2026-11-11）：1.区画や機能を足す版.細かな調整（例 1.2.1）。
    //   それまでの 1.0.1／1.0.2／1.0.2.1／1.0.3 は、さかのぼって 1.1.0／1.2.0／1.2.1／1.3.0 に付け直した（1.0.0 はそのまま）
    // α-10 → RC-1（2026-10-05 に締めた）→ 1.0.0（新しい地方と地方選択。若葉の洞までで 2026-10-22 に締めた）
    // → 1.1.0（蔦這う回廊。2026-10-28 に締めた）→ 1.2.0（主人公の見た目。2026-10-30 に締めた）
    // → 1.2.1（細かな調整。2026-10-30。萌芽の穴の区画を3つに・札0.8秒・HPバー0.25秒・回廊の工房の解放）
    // → 1.3.0（千年樹の根底。2026-10-30 から作り、2026-11-11 に締めた）
    // → 1.3.1（細かな調整とバグの修正。2026-11-11 から。作者の指定）
    version: "1.3.1",
    canvasWidth: 800,   // 画面の横幅（px）
    canvasHeight: 600,  // 画面の縦幅（px）
    tileSize: 32,       // 1タイルの大きさ（px）
    partyMax: 6,        // 連れていける最大数
    storageMax: 300,    // 拠点の預かり所に預けられる数（v1.3.0 で 30 → 300。30体ずつの箱が10個）
    storageBoxSize: 30, // 預かり所の画面の1箱に並べる数（data/ui.js の party.box.grid の cols × 行）
    battleFieldSize: 3, // 戦闘盤面に同時に出せる数（味方・敵とも）
    abilityMax: 1,      // モンスター1体が持てる特性の数（超えた分は無視される）

    /**
     * 装備の枠。1体につきこの並びのぶんだけ着けられる。
     * 各装備がどの枠かは data/items.js の equip.slot（weapon / armor / accessory）。
     * 同じ種類の枠が2つあっても、**同じ装備を2つ着けることはできない**（Game.equipItem）。
     * 枠の表示名・並びは data/categories.js の equipSlot。
     */
    equipSlots: ["weapon", "armor", "accessory", "accessory"]
  };
})(window.MyGame);
