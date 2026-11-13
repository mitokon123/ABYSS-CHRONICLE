// 見た目の確かめ用（開発のみ・8124）。check.html などで読み込んだあと、コンソールから呼ぶ。
// 本物の画面を、試し用の仲間と持ち物で、ページの左上の canvas に描く。セーブには触らない。
window.__shotSetup = function () {
  var NS = window.MyGame; var gd = NS.DataLoader.build(NS.rawData);
  if (NS.PlayerLook) NS.PlayerLook.buildVariants(gd);
  var assets = new NS.AssetLoader(); assets.build(gd.sprites);
  var cv = document.getElementById("shot");
  if (!cv) {
    cv = document.createElement("canvas"); cv.width = 800; cv.height = 600; cv.id = "shot";
    cv.style.cssText = "position:fixed;left:0;top:0;z-index:9999;width:600px;height:450px;background:#000";
    document.body.appendChild(cv); document.body.style.overflow = "hidden";
  }
  var g2 = cv.getContext("2d");
  var ids = Object.keys(gd.monsters);
  var weapons = Object.keys(gd.items).filter(function (id) { var it = gd.items[id]; return it.equip && NS.EffectSystem.slotOf(it) === "weapon"; });
  var party = new NS.Party(6);
  var a = new NS.MonsterInstance(ids[0], 20, gd, {}); a.equipment = [weapons[0]];
  party.add(a); party.add(new NS.MonsterInstance(ids[1], 30, gd, {})); party.add(new NS.MonsterInstance(ids[2], 25, gd, {}));
  var storage = new NS.MonsterStorage(300); storage.add(new NS.MonsterInstance(ids[3], 18, gd, {}));
  var cats = (gd.categories || {}).item || {};
  var inv = { getCount: function () { return 3; }, slotCount: function () { return 12; },
    groupByCategory: function () { return Object.keys(cats).map(function (c) { return { category: cats[c], slots: Object.keys(gd.items).filter(function (id) { return gd.items[id].category === c; }).slice(0, 5).map(function (id) { return { itemId: id, count: 3 }; }) }; }).filter(function (g) { return g.slots.length; }); } };
  var cleared = {}; Object.keys(gd.dungeons || {}).forEach(function (k) { cleared[k] = true; });
  window.__pressed = {}; window.__wheel = 0;
  var input = { isPressed: function (k) { return !!window.__pressed[k]; }, isDown: function () { return false; },
    getPointer: function () { return window.__pointer || { x: -1, y: -1, inside: false, clicked: false, wheel: 0, moved: false, down: false }; } };
  var game = { ctx: g2, canvas: cv, data: gd, assets: assets, clock: 0, input: input, discovery: new NS.Discovery(), clearedDungeons: cleared,
    party: party, storage: storage, gold: 1234, inventory: inv, canAfford: function () { return true; },
    hasBoughtBlessing: function () { return false; }, isBlessingActive: function () { return false; },
    audio: { playBgm: function () {}, playSe: function () {} }, playError: function () {}, story: null, scenes: { change: function () {} } };
  window.__err = null;
  return {
    game: game, scene: null,
    open: function (scene) { this.scene = scene; this.step(null); return this; },
    step: function (k) {
      window.__pressed = {}; if (k) window.__pressed[k] = true; game.clock += 16;
      try { this.scene.update(16); } catch (e) { window.__err = String(e.stack); }
      window.__pressed = {}; window.__pointer = null;
      g2.clearRect(0, 0, 800, 600);
      try { this.scene.render(g2); } catch (e) { window.__err = String(e.stack); }
      return window.__err || "ok";
    }
  };
};
