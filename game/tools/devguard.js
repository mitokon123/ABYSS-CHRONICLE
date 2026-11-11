/**
 * devguard.js  開発用のページを、遊ぶ人が開いたときに断る（v1.3.0）
 *
 * 配ったフォルダの中の html をダブルクリックしたとき（file://）や、公開先のサイトで開いたときは、
 * ページの中身を読み込まずに、断りの文と「ゲームを開く」だけを出す。
 * このパソコンのサーバー（localhost の 8123・8124）で開いたときは何もしない。
 *
 * ★ 開発用のページの <head> の中で、<title> のすぐ下に読むこと。
 *   ここより後ろは、断ったときに文字として読み飛ばされる（<script> も <style> も動かない）。
 *   ゲーム本体（app.html）と入口（index.html・ABYSS CHRONICLE.html）には入れない。
 *
 * ★ 間違えて開いた人を案内するためのもので、中身を隠すものではない
 *   （ファイルそのものは配ったフォルダや公開先から読める）。
 */
(function () {
  "use strict";

  var host = window.location.hostname;
  var isLocalServer = window.location.protocol !== "file:" &&
    (host === "localhost" || host === "127.0.0.1" || host === "[::1]");
  if (isLocalServer) return;

  document.title = "開発用のページ - ABYSS CHRONICLE";
  // 読み込み中のページへ書き足す。最後の <plaintext> で、これより後ろをただの文字にして隠す
  document.write(
    "<style>" +
      "body{margin:0;background:#05070d;color:#c8d0e8;font:15px/1.9 sans-serif}" +
      "main{max-width:560px;margin:12vh auto 0;padding:24px;border:1px solid #2a3350;border-radius:8px;background:#0a0f1c}" +
      "h1{margin:0 0 12px;font-size:20px;color:#ffd75e}" +
      "p{margin:0 0 12px}" +
      "a{display:inline-block;margin-top:8px;padding:8px 20px;background:#2b3a66;border:1px solid #ffd75e;border-radius:6px;color:#fff;text-decoration:none}" +
      "small{display:block;margin-top:18px;color:#6b7590;font-size:12px}" +
    "</style></head><body><main>" +
      "<h1>このページは開発用です</h1>" +
      "<p>ゲームを作るときに使うページなので、遊ぶときは開かなくて大丈夫です。セーブにも影響はありません。</p>" +
      "<a href='app.html'>ゲームを開く</a>" +
      "<small>開発している人へ：開発用サーバーから開いてください（http://localhost:8124）。</small>" +
    "</main><plaintext style='display:none'>"
  );
})();
