/**
 * SpriteRenderer.js
 * AssetLoader が用意した描画物を、指定ピクセル位置・サイズで描く。
 * ドット絵の拡大は imageSmoothingEnabled=false（Game側で設定）によりくっきり表示される。
 */
(function (NS) {
  "use strict";

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {MyGame.AssetLoader} assets
   */
  function SpriteRenderer(ctx, assets) {
    this.ctx = ctx;
    this.assets = assets;
  }

  /**
   * スプライトを描く。
   * @param {string} id スプライトid
   * @param {number} dx 描画先X（px）
   * @param {number} dy 描画先Y（px）
   * @param {number} dw 描画幅（px）
   * @param {number} dh 描画高（px）
   */
  SpriteRenderer.prototype.draw = function (id, dx, dy, dw, dh) {
    var img = this.assets ? this.assets.get(id) : null;
    if (!img) return;
    // 画像方式(Image)はロード完了前は描かない（コード生成のCanvasは常に描画可）
    if (img instanceof HTMLImageElement && !img.complete) return;
    this.ctx.drawImage(img, dx, dy, dw, dh);
  };

  /**
   * 動きをつけて描く。
   *
   * transform は MyGame.Motion.of() が返すもの。
   * 渡さなければ draw() と同じ描き方になるので、動きの有無で呼び分けなくてよい。
   *
   * 伸縮は「足元の中央」を基準にする。中央を基準にすると、
   * 大きくなったときに地面へめり込み、小さくなると浮いて見えるため。
   * ぶら下がっているもの（天井から垂れる蔦など）は逆に上端を固定したいので、
   * transform.anchor === "top" のときだけ上をそろえる。
   *
   * 縦横は別々に伸縮できる。scale が全体の倍率で、scaleX / scaleY はそこへ掛ける。
   * 縦横を少しずらして動かすと、1枚の絵のままでも呼吸しているように見える。
   *
   * @param {string|string[]} id スプライトid。配列ならコマ絵として frame 番目を使う
   * @param {number} dx 描画枠の左X
   * @param {number} dy 描画枠の上Y
   * @param {number} dw 描画枠の幅
   * @param {number} dh 描画枠の高さ
   * @param {object} [transform]
   *   { offsetX, offsetY, scale, scaleX, scaleY, alpha, rotate, frame, anchor }
   *   rotate は「何回まわすか」（1 で1回転）。回すときだけ中心を軸にする
   */
  SpriteRenderer.prototype.drawMotion = function (id, dx, dy, dw, dh, transform) {
    if (!transform) {
      this.draw(pickFrame(id, 0), dx, dy, dw, dh);
      return;
    }

    var alpha = (transform.alpha === undefined) ? 1 : transform.alpha;
    if (alpha <= 0) return;

    // 上の数行を動かさない絵（天井の裂け目からぶら下がる蔦など）
    if (transform.pinTop > 0) {
      this._drawPinned(id, dx, dy, dw, dh, transform, alpha);
      return;
    }

    var scale = (transform.scale === undefined) ? 1 : transform.scale;
    var w = dw * scale * axis(transform.scaleX);
    var h = dh * scale * axis(transform.scaleY);

    var x = dx + (transform.offsetX || 0) + (dw - w) / 2;
    // 足元をそろえる（anchor: "top" のときだけ上をそろえる）
    var y = dy + (transform.offsetY || 0) +
      (transform.anchor === "top" ? 0 : (dh - h));
    var spriteId = pickFrame(id, transform.frame);
    var rotate = transform.rotate || 0;

    if (alpha >= 1 && !rotate) {
      this.draw(spriteId, x, y, w, h);
      return;
    }

    this.ctx.save();
    // すでに掛かっている濃さを打ち消さないよう、掛け合わせる
    if (alpha < 1) this.ctx.globalAlpha = this.ctx.globalAlpha * alpha;

    if (rotate) {
      // 回転は絵の中心を軸にする（足元を軸にすると弧を描いて飛んでいく）
      this.ctx.translate(x + w / 2, y + h / 2);
      this.ctx.rotate(rotate * Math.PI * 2);
      this.draw(spriteId, -w / 2, -h / 2, w, h);
    } else {
      this.draw(spriteId, x, y, w, h);
    }
    this.ctx.restore();
  };

  /**
   * 上の数行（transform.pinTop 行）を動かさずに、残りだけを動かして描く（RC-1。カゲヅタの裂け目）。
   *
   *   動かさない部分 … 位置もそのまま。濃さは、絵全体が薄くなったとき（倒れて消えるとき）だけ一緒に薄くする。
   *                    被弾の点滅（0.6 まで）では薄くしない
   *   動く部分       … 上端を、動かさない部分の下端にそろえる（＝裂け目から垂れる蔦）。
   *                    離れないよう offsetX / offsetY は使わない。伸縮（scaleY）で伸び縮みし、
   *                    回転（rotate）は上端の中央を軸にする（振り子）
   */
  SpriteRenderer.prototype._drawPinned = function (id, dx, dy, dw, dh, transform, alpha) {
    var img = this.assets ? this.assets.get(pickFrame(id, transform.frame)) : null;
    if (!img) return;
    if (img instanceof HTMLImageElement && !img.complete) return;

    var srcW = img.width, srcH = img.height;
    var pin = Math.min(transform.pinTop, srcH - 1);
    var pinH = dh * pin / srcH;
    var ctx = this.ctx;

    // 動かさない部分
    ctx.save();
    var stillAlpha = Math.min(1, alpha / 0.6);
    if (stillAlpha < 1) ctx.globalAlpha = ctx.globalAlpha * stillAlpha;
    ctx.drawImage(img, 0, 0, srcW, pin, dx, dy, dw, pinH);
    ctx.restore();

    // 動く部分
    var scale = (transform.scale === undefined) ? 1 : transform.scale;
    var w = dw * scale * axis(transform.scaleX);
    var h = (dh - pinH) * scale * axis(transform.scaleY);
    if (w <= 0 || h <= 0) return;

    var x = dx + (dw - w) / 2;
    var y = dy + pinH;
    ctx.save();
    if (alpha < 1) ctx.globalAlpha = ctx.globalAlpha * alpha;
    var rotate = transform.rotate || 0;
    if (rotate) {
      ctx.translate(x + w / 2, y);
      ctx.rotate(rotate * Math.PI * 2);
      ctx.drawImage(img, 0, pin, srcW, srcH - pin, -w / 2, 0, w, h);
    } else {
      ctx.drawImage(img, 0, pin, srcW, srcH - pin, x, y, w, h);
    }
    ctx.restore();
  };

  /** 縦横それぞれの倍率。書かれていなければ1（＝scale だけが効く） */
  function axis(value) {
    return (value === undefined || value === null) ? 1 : value;
  }

  /** コマ絵なら frame 番目のidを、1枚だけならそのidを返す */
  function pickFrame(id, frame) {
    if (Object.prototype.toString.call(id) !== "[object Array]") return id;
    if (id.length === 0) return null;
    return id[(frame || 0) % id.length];
  }

  NS.SpriteRenderer = SpriteRenderer;
})(window.MyGame);
