/**
 * AudioManager.js
 * BGMと効果音を鳴らす係。
 *
 * 鳴らすものの一覧は data/audio.js、音量は data/settings.js。
 * ここには「どの音を」「どれくらいの大きさで」といった数値は書かない。
 *
 * ─────────────────────────────────────────────
 * ▼ 音源が無くても止まらない
 *
 * ファイルを置いていない・読み込めなかった音は**黙って無音になる**。
 * 一度失敗した音は覚えておき、二度と読みに行かない
 * （毎フレーム読みに行って、そのたびに失敗が積み上がるのを防ぐ）。
 *
 * ▼ 最初の操作まで鳴らせない（ブラウザの決まり）
 *
 * どのブラウザも、**画面を一度も触っていないうちは音を鳴らさない**。
 * タイトルでいきなり playBgm しても、そこでは鳴らない。
 * そこで、鳴らせなかったBGMを覚えておき、
 * 最初のクリックかキー入力（unlock）のときに鳴らし直す。
 *
 * ▼ 同じBGMは鳴らし直さない
 *
 * 拠点 → ショップ → 拠点 と移っても、同じ曲なら流れたまま。
 * 場面が変わるたびに頭から鳴り直すと、落ち着かない。
 *
 * ▼ 効果音は数個ずつ用意して使い回す
 *
 * 1つの Audio は、鳴っている最中にもう一度鳴らすと頭に戻ってしまう。
 * 同じ音が重なる場面（複数体が同時に殴られる）があるので、
 * 1種類につき数個持っておき、空いているものを使う。
 * 逆にメニュー音は重ねたくないので、data/audio.js で solo を付けた音は
 * 1つだけ持ち、頭から鳴り直す。
 * ─────────────────────────────────────────────
 */
(function (NS) {
  "use strict";

  var SE_POOL_SIZE = 4;   // 1種類の効果音を何個まで重ねられるか
  var FADE_STEP_MS = 30;  // フェードで音量を動かす間隔。長さは data/audio.js の fadeMs

  /**
   * @param {MyGame.GameData} gameData
   * @param {MyGame.SettingsManager} settings
   */
  function AudioManager(gameData, settings) {
    this.data = gameData;
    this.settings = settings || null;
    this.config = gameData.audio || {};

    this.unlocked = false;    // 一度でも操作されたか
    this.currentBgmId = null; // いま流れているBGMのid
    this.pendingBgmId = null; // 操作待ちで鳴らせなかったBGM

    this._bgm = null;         // いま鳴っている Audio
    this._sePools = {};       // id → Audio の配列
    this._failed = {};        // 読み込めなかった id（二度と読みに行かない）
  }

  // --- 設定から音量を作る ---

  AudioManager.prototype._setting = function (id, fallback) {
    if (!this.settings) return fallback;

    var value = this.settings.get(id);
    return (typeof value === "number") ? value / 100 : fallback;
  };

  /** BGMの実際の音量（0〜1） */
  AudioManager.prototype._bgmVolume = function (defVolume) {
    return clamp01((defVolume === undefined ? 1 : defVolume)
      * this._setting("masterVolume", 0.7) * this._setting("bgmVolume", 0.7));
  };

  /** 効果音の実際の音量（0〜1） */
  AudioManager.prototype._seVolume = function (defVolume) {
    return clamp01((defVolume === undefined ? 1 : defVolume)
      * this._setting("masterVolume", 0.7) * this._setting("seVolume", 0.8));
  };

  // --- 音源を用意する ---

  /** 定義を引く。file が無ければ null（＝無音） */
  AudioManager.prototype._defOf = function (kind, id) {
    var group = this.config[kind] || {};
    var def = group[id];
    if (!def || !def.file) return null;
    if (isArray(def.file) && def.file.length === 0) return null;
    return def;
  };

  /**
   * 鳴らすファイル名を1つ決める。
   *
   * ★ file に配列を書くと、そのどれかを毎回ランダムに選ぶ。
   *   同じ攻撃音が毎回まったく同じだと機械的に聞こえるので、
   *   2〜3種類を用意して散らすための仕組み。
   *     hit: { file: ["hit1.wav", "hit2.wav", "hit3.wav"] }
   */
  AudioManager.prototype._pickFile = function (def) {
    if (!isArray(def.file)) return def.file;
    return def.file[Math.floor(Math.random() * def.file.length)];
  };

  /**
   * Audio を1つ作る。作れなければ null。
   * 読み込みに失敗した音は _failed に覚えて、次からは作らない。
   */
  AudioManager.prototype._create = function (kind, id, def) {
    var file = this._pickFile(def);
    var key = kind + ":" + file;   // 配列のときはファイルごとに失敗を覚える
    if (this._failed[key]) return null;

    var self = this;
    var audio = new window.Audio((this.config.basePath || "") + file);
    audio.preload = "auto";
    audio.dataset.file = file;

    // 置き忘れ・名前違いはここで拾う。以後この音は鳴らさない
    audio.addEventListener("error", function () { self._failed[key] = true; });
    return audio;
  };

  // --- BGM ---

  /**
   * BGMを流す。同じidが既に流れていれば何もしない。
   * @param {string|null} id data/audio.js の bgm のid。null で止める
   */
  AudioManager.prototype.playBgm = function (id) {
    if (id === this.currentBgmId) return;

    // いま鳴っている曲は消え際をつけて止める（ぶつ切りにしない）
    var fadeMs = this.config.fadeMs || 0;
    var previous = this._bgm;
    this._bgm = null;
    this.pendingBgmId = null;
    if (previous) this._fadeOut(previous, fadeMs);

    this.currentBgmId = id;
    if (!id) return;

    var def = this._defOf("bgm", id);
    if (!def) return;   // 音源が無い場面は無音のまま進む

    // 戻り先（loopStart）を書いた曲は、戻り先へ戻れる鳴らし方にする（下の LoopedBgm）
    var looped = (typeof def.loopStart === "number") && def.loop !== false;
    var audio = looped ? new LoopedBgm(this, (this.config.basePath || "") + this._pickFile(def), def)
                       : this._create("bgm", id, def);
    if (!audio) return;

    audio.loop = (def.loop === undefined) ? true : !!def.loop;
    this._bgmTarget = this._bgmVolume(def.volume);
    // 出はじめも少しずつ上げる。0 から始めて目標の音量へ
    audio.volume = fadeMs > 0 ? 0 : this._bgmTarget;

    this._bgm = audio;
    this._tryPlay(audio, id);
    if (fadeMs > 0) this._fadeIn(audio, fadeMs);
  };

  /**
   * 音量を少しずつ下げて止める。
   * 止め終わるまでは別の Audio として鳴り続けるので、次の曲と少し重なる（クロスフェード）。
   */
  AudioManager.prototype._fadeOut = function (audio, ms) {
    if (ms <= 0) {
      try { audio.pause(); } catch (e) { /* 鳴っていなければ何もしなくてよい */ }
      return;
    }
    var start = audio.volume;
    var steps = Math.max(1, Math.round(ms / FADE_STEP_MS));
    var done = 0;
    var timer = setInterval(function () {
      done++;
      audio.volume = Math.max(0, start * (1 - done / steps));
      if (done >= steps) {
        clearInterval(timer);
        try { audio.pause(); } catch (e) { /* 同上 */ }
      }
    }, FADE_STEP_MS);
  };

  /**
   * 音量を 0 から目標（_bgmTarget）へ少しずつ上げる。
   * 途中で設定の音量が変わっても、目標を毎回読むので追いつく。
   * 途中で別の曲に変わったら（_bgm が別物になったら）そこでやめる。
   */
  AudioManager.prototype._fadeIn = function (audio, ms) {
    var self = this;
    var steps = Math.max(1, Math.round(ms / FADE_STEP_MS));
    var done = 0;
    this._fadingIn = audio;
    var timer = setInterval(function () {
      if (self._bgm !== audio) { clearInterval(timer); return; }
      done++;
      audio.volume = clamp01(self._bgmTarget * Math.min(1, done / steps));
      if (done >= steps) {
        clearInterval(timer);
        if (self._fadingIn === audio) self._fadingIn = null;
      }
    }, FADE_STEP_MS);
  };

  /**
   * 鳴らしてみる。ブラウザに止められたら、最初の操作まで待つ。
   * @param {HTMLAudioElement} audio
   * @param {string} id
   */
  AudioManager.prototype._tryPlay = function (audio, id) {
    var self = this;
    var promise = audio.play();

    // 古いブラウザは play() が何も返さない
    if (!promise || !promise.catch) return;

    promise.catch(function () {
      // まだ操作されていないだけなら、あとで鳴らし直す。
      // それ以外（ファイルが無い等）は _failed 側で拾われる
      if (!self.unlocked) self.pendingBgmId = id;
    });
  };

  // --- 効果音 ---

  /**
   * 効果音を鳴らす。
   * 音源が無い・まだ操作されていない場合は、何も起きない（エラーにしない）。
   */
  AudioManager.prototype.playSe = function (id) {
    if (!this.unlocked) return;   // 操作前は鳴らせない。溜めても意味がないので捨てる

    var raw = (this.config.se || {})[id];
    // ファイルが無く、合成の指定（synth）があれば、その場で音を作って鳴らす
    if (raw && !raw.file && raw.synth) {
      this._playSynth(raw);
      return;
    }

    var def = this._defOf("se", id);
    if (!def) return;

    var audio = this._takeFromPool(id, def);
    if (!audio) return;

    audio.volume = this._seVolume(def.volume);
    try {
      audio.currentTime = 0;
      var promise = audio.play();
      if (promise && promise.catch) promise.catch(function () { /* 鳴らなくても進む */ });
    } catch (e) { /* 同上 */ }
  };

  /** 空いている Audio を1つ借りる。無ければ作る */
  AudioManager.prototype._takeFromPool = function (id, def) {
    var pool = this._sePools[id];
    if (!pool) pool = this._sePools[id] = [];

    // 重ねない音（solo）は1つだけ持ち、鳴っていても頭から鳴り直す。
    // カーソルを連打すると同じ音が4つ重なって膨らむのを防ぐ
    if (def.solo && !isArray(def.file)) {
      if (pool.length > 0) return pool[0];
      var single = this._create("se", id, def);
      if (single) pool.push(single);
      return single;
    }

    // 複数ファイルの音は、毎回違うものを引きたいので使い回さず作り直す。
    // 1つだけの音は今までどおり使い回す（作り直すと読み込みが毎回走る）
    var random = isArray(def.file) && def.file.length > 1;

    if (!random) {
      for (var i = 0; i < pool.length; i++) {
        if (pool[i].paused || pool[i].ended) return pool[i];
      }
    }
    if (pool.length >= SE_POOL_SIZE) {
      var oldest = pool.shift();   // 全部鳴っていたら古いものを奪う
      if (!random) { pool.push(oldest); return oldest; }
    }

    var audio = this._create("se", id, def);
    if (!audio) return null;

    pool.push(audio);
    return audio;
  };

  // --- 合成の効果音（ファイルを置かずに、波形の指定から作る） ---

  /**
   * Web Audio の入口。最初に鳴らすときに作る（操作前に作ると止められる）。
   * 使えない環境では null（合成の音は黙って鳴らない）
   */
  AudioManager.prototype._audioContext = function () {
    if (this._ctx) return this._ctx;
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      this._ctx = new Ctor();
    } catch (e) {
      this._ctx = null;
    }
    return this._ctx;
  };

  /**
   * data/audio.js の synth（層の配列）を鳴らす。
   *
   * 1つの音は「層（layer）」を重ねて作る。層は2種類：
   *   { kind: "tone",  wave: "square"|"triangle"|"sawtooth"|"sine",
   *     from: 440, to: 220,        … 周波数。to を書くと from から滑らかに動く
   *     start: 0, duration: 0.15,  … 何秒後に鳴り始めて、何秒鳴るか
   *     gain: 0.5 }                … この層の大きさ（0〜1）
   *   { kind: "noise", filterFrom: 1200, filterTo: 200, start, duration, gain }
   *     … ざらざらした音。ローパスの周波数を動かすと「バシッ」「シュッ」になる
   *     filterType: "lowpass"（既定）| "highpass" | "bandpass"
   *       highpass は「シャー」（高い成分だけ）、bandpass は「ヒュー」（一帯だけ）
   * どちらの層にも書けるもの：
   *   attack … 何秒かけて膨らむか（省略で 0＝いきなり最大）。炎や風の「ゴォ」に使う
   *   hold   … 最大のまま何秒保つか（省略で 0＝すぐ落ち始める）。落ち方は速いので、伸ばしたいときに
   * どの層も、鳴り終わりに向けて音量が 0 へ落ちる（ぶつ切りにならない）。
   */
  AudioManager.prototype._playSynth = function (def) {
    var ctx = this._audioContext();
    if (!ctx) return;
    if (ctx.state === "suspended" && ctx.resume) ctx.resume();

    var master = ctx.createGain();
    master.gain.value = this._seVolume(def.volume);
    master.connect(ctx.destination);

    var now = ctx.currentTime;
    var layers = def.synth || [];
    for (var i = 0; i < layers.length; i++) {
      var layer = layers[i];
      var start = now + (layer.start || 0);
      var duration = layer.duration || 0.1;
      var peak = (layer.gain === undefined) ? 0.5 : layer.gain;
      var attack = Math.min(layer.attack || 0, duration);
      var hold = Math.min(layer.hold || 0, duration - attack);
      var gain = ctx.createGain();
      if (attack > 0) {
        // 膨らむ音：0 から attack 秒で最大へ
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(peak, start + attack);
      } else {
        gain.gain.setValueAtTime(peak, start);
      }
      // hold 秒は最大のまま保ち、そのあと鳴り終わりへ向けて落ちる
      if (hold > 0) gain.gain.setValueAtTime(peak, start + attack + hold);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      gain.connect(master);

      if (layer.kind === "noise") {
        var source = ctx.createBufferSource();
        source.buffer = this._noiseBuffer(ctx, duration);
        var filter = ctx.createBiquadFilter();
        filter.type = layer.filterType || "lowpass";
        filter.frequency.setValueAtTime(layer.filterFrom || 1000, start);
        if (layer.filterTo) filter.frequency.exponentialRampToValueAtTime(layer.filterTo, start + duration);
        source.connect(filter);
        filter.connect(gain);
        source.start(start);
        source.stop(start + duration);
      } else {
        var osc = ctx.createOscillator();
        osc.type = layer.wave || "square";
        osc.frequency.setValueAtTime(layer.from || 440, start);
        if (layer.to) osc.frequency.exponentialRampToValueAtTime(layer.to, start + duration);
        osc.connect(gain);
        osc.start(start);
        osc.stop(start + duration);
      }
    }
  };

  /** ホワイトノイズの波形。長さごとに作って使い回す */
  AudioManager.prototype._noiseBuffer = function (ctx, seconds) {
    this._noiseCache = this._noiseCache || {};
    var key = Math.ceil(seconds * 10);
    if (this._noiseCache[key]) return this._noiseCache[key];

    var length = Math.max(1, Math.floor(ctx.sampleRate * (key / 10)));
    var buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    var channel = buffer.getChannelData(0);
    for (var i = 0; i < length; i++) channel[i] = Math.random() * 2 - 1;

    this._noiseCache[key] = buffer;
    return buffer;
  };

  // --- 戻り先のある BGM（v1.0.3） ---

  /**
   * 戻り先（data/audio.js の loopStart）を書いた BGM を鳴らす係。
   *
   * 音声要素の loop は「ファイルの最後まで行ったら頭へ」しかできない。
   * 頭に前奏がある曲だと、繰り返すたびに前奏がもう一度鳴って不自然になる（2026-11-03 作者）。
   * Web Audio なら「loopEnd まで来たら loopStart へ」をサンプル単位で戻せ、つなぎ目に隙間も出ない。
   *
   * 音声要素と同じ形（volume・loop・play()・pause()）にしてあるので、フェード・音量の反映・操作待ちはそのまま使える。
   * file:// では読み込めない（fetch が止められる）ので、そのときと読み込みに失敗したときは
   * 音声要素2つで戻り先へ切り替える ElementLoopBgm で鳴らす（戻り先は同じ。精度は数ミリ秒）。
   */
  function LoopedBgm(manager, url, def) {
    this._url = url;
    this._def = def;
    this._volume = 1;
    this._wantPlay = false;
    this._source = null;
    this._fallback = null;
    this.loop = true;

    this._ctx = canUseWebAudioBgm() ? manager._audioContext() : null;
    if (!this._ctx) { this._useFallback(); return; }
    this._gain = this._ctx.createGain();
    this._gain.gain.value = this._volume;
    this._gain.connect(this._ctx.destination);

    var self = this;
    loadBgmBuffer(manager, this._ctx, url).then(function (buffer) {
      self._buffer = buffer;
      if (self._wantPlay) self._start();
    }, function () {
      self._useFallback();
    });
  }

  Object.defineProperty(LoopedBgm.prototype, "volume", {
    get: function () { return this._volume; },
    set: function (value) {
      this._volume = value;
      if (this._fallback) this._fallback.volume = value;
      else if (this._gain) this._gain.gain.value = value;
    }
  });

  /** 鳴らす。まだ読み込み中なら、読み終わったときに鳴り始める */
  LoopedBgm.prototype.play = function () {
    this._wantPlay = true;
    if (this._fallback) { this._fallback.loop = this.loop; return this._fallback.play(); }
    if (this._ctx.state === "suspended" && this._ctx.resume) this._ctx.resume();
    if (this._buffer && !this._source) this._start();
    // 操作前で止められているあいだは失敗を返す（AudioManager が操作を待って鳴らし直す）
    return this._ctx.state === "running" ? Promise.resolve() : Promise.reject(new Error("suspended"));
  };

  LoopedBgm.prototype.pause = function () {
    this._wantPlay = false;
    if (this._fallback) { this._fallback.pause(); return; }
    if (this._source) {
      try { this._source.stop(); } catch (e) { /* 鳴る前でもよい */ }
      this._source.disconnect();
      this._source = null;
    }
  };

  /** 頭から鳴らし、loopEnd（書かなければファイルの最後）まで来たら loopStart へ戻る */
  LoopedBgm.prototype._start = function () {
    var source = this._ctx.createBufferSource();
    source.buffer = this._buffer;
    source.loop = this.loop;
    source.loopStart = this._def.loopStart;
    source.loopEnd = (typeof this._def.loopEnd === "number") ? this._def.loopEnd : this._buffer.duration;
    source.connect(this._gain);
    source.start(0);
    this._source = source;
  };

  /** Web Audio で鳴らせないときは、音声要素2つで戻り先へ切り替える鳴らし方にする */
  LoopedBgm.prototype._useFallback = function () {
    if (this._fallback) return;
    var audio = new ElementLoopBgm(this._url, this._def);
    audio.loop = this.loop;
    audio.volume = this._volume;
    this._fallback = audio;
    if (this._gain) this._gain.disconnect();
    if (this._wantPlay) {
      var promise = audio.play();
      if (promise && promise.catch) promise.catch(function () {});
    }
  };

  /**
   * 音声要素2つで、戻り先へ戻る BGM（file:// のとき）。
   *
   * 1つ目が loopEnd（書かなければファイルの最後）の3秒前まで来たら、2つ目を「戻り先の3秒前」から**音量0で**鳴らし始める。
   * 2つの再生位置を見比べ、2つ目の速さを少し上げ下げして「1つ目が loopEnd に着くとき、2つ目がちょうど戻り先」に揃える。
   * loopEnd の少し手前で2つ目の音量を戻し、1つ目は止めずに最後まで鳴らし切る（loopEnd を書いた曲は loopEnd で止める）。
   * 次の周は役を入れ替える。
   *
   * ★ 音声要素は play() から音が出るまでに数十ミリ秒かかり、その長さも毎回揺れる。
   *   切り替えの瞬間に play() すると、その揺れがそのまま隙間になった（2026-11-03 作者「隙間をなくしたい」）。
   *   先に鳴らしておけば、切り替えは音量を変えるだけなので揺れない。
   * ★ 2つ目の音量を戻すのは loopEnd の 50ms 手前。タイマーは30msほど遅れることがあり、1つ目が鳴り終わってからだと隙間になる。
   *   1つ目を途中で止めないので、早めに戻しても曲の終わりは欠けず、数十ms 重なるだけになる。
   *   （戻り先の手前の音は曲によって曲の終わりと違うので、1つ目を早めに止めて入れ替える形にはしなかった）
   * ★ 再生位置の読み取りは数msずつ揺れるので、ずれは何回か分を均してから詰める。
   * ★ 戻り先が3秒より手前の曲や、先に鳴らすのが間に合わなかったときは、切り替えの瞬間に鳴らす形になる。
   *   画面が裏に回るとタイマーが遅れるが、そのときは曲の終わり（ended）で切り替わる
   */
  var ELEMENT_LOOP_POLL_MS = 20;   // 切り替えが近いかを見る間隔
  var ELEMENT_LOOP_PREROLL = 3;    // loopEnd の何秒前から、2つ目を音量0で鳴らして揃えるか
  var ELEMENT_LOOP_LEAD = 0.2;     // loopEnd の何秒前から、ぴったりのタイマーを掛けるか
  var ELEMENT_LOOP_EARLY = 0.05;   // 2つ目の音量を戻すのを loopEnd の何秒前にするか
  var ELEMENT_LOOP_ALIGN = 0.2;    // 2つの位置のずれを、何秒かけて詰めるか
  var ELEMENT_LOOP_START_LAG = 0.03; // 先に鳴らすとき、鳴り出すまでの遅れの見込み（そのぶん先から鳴らす）
  var ELEMENT_LOOP_LATENCY = 0.04; // 先に鳴らせなかったとき：play() から鳴り出すまでの見込み（秒）

  function ElementLoopBgm(url, def) {
    this._def = def;
    this._volume = 1;
    this._playing = false;
    this._timer = null;
    this._switchTimer = null;
    this._preroll = false;
    this._closing = null;   // 音量を戻したあと、鳴り終わるのを待っている1つ目
    this.loop = true;
    this._elements = [makeBgmElement(url), makeBgmElement(url)];
    this._cur = 0;

    var self = this;
    this._elements.forEach(function (el, index) {
      el.addEventListener("ended", function () {
        if (self._closing === el) self._finishClosing();
        // タイマーが間に合わなかったとき（画面が裏に回っていた等）
        else if (self._playing && self._cur === index) self._switch();
      });
    });
    // 2つ目は先に戻り先へ合わせておく
    seekWhenReady(this._elements[1], def.loopStart);
  }

  function makeBgmElement(url) {
    var el = new window.Audio(url);
    el.preload = "auto";
    return el;
  }

  /** 読み込みが済んでいなければ、済んでから頭出しする */
  function seekWhenReady(el, time) {
    var seek = function () { try { el.currentTime = time; } catch (e) { /* まだ読めていない */ } };
    if (el.readyState >= 1) seek();
    else el.addEventListener("loadedmetadata", seek, { once: true });
  }

  Object.defineProperty(ElementLoopBgm.prototype, "volume", {
    get: function () { return this._volume; },
    set: function (value) {
      this._volume = value;
      this._elements[this._cur].volume = value;
    }
  });

  ElementLoopBgm.prototype.play = function () {
    this._playing = true;
    var el = this._elements[this._cur];
    el.volume = this._volume;
    var self = this;
    if (!this._timer) this._timer = setInterval(function () { self._tick(); }, ELEMENT_LOOP_POLL_MS);
    return el.play();
  };

  ElementLoopBgm.prototype.pause = function () {
    this._playing = false;
    clearInterval(this._timer);
    clearTimeout(this._switchTimer);
    this._timer = this._switchTimer = null;
    this._handOver = null;
    this._elements.forEach(function (el) {
      try { el.pause(); } catch (e) { /* 鳴っていなくてもよい */ }
      el.playbackRate = 1;
    });
    // 先に鳴らしていた方・鳴り終わるのを待っていた方は、戻り先へ合わせ直しておく
    if (this._preroll || this._closing) seekWhenReady(this._elements[1 - this._cur], this._def.loopStart);
    this._preroll = false;
    this._closing = null;
  };

  ElementLoopBgm.prototype._loopEnd = function () {
    var el = this._elements[this._cur];
    return (typeof this._def.loopEnd === "number") ? this._def.loopEnd : el.duration;
  };

  /** 切り替えが近づいたら2つ目を音量0で鳴らして位置を揃え、残りの時間ぴったりにタイマーを掛ける */
  ElementLoopBgm.prototype._tick = function () {
    if (this._handOver) this._checkHandOver();
    // loopEnd を書いた曲は、ファイルの最後まで行かないので loopEnd で止める
    if (this._closing && this._closing.currentTime >= this._loopEnd()) this._finishClosing();
    if (!this._playing || !this.loop) return;
    var el = this._elements[this._cur];
    var end = this._loopEnd();
    if (!end || isNaN(end) || el.paused) return;
    var left = end - el.currentTime;
    if (!this._preroll && !this._handOver && !this._closing && left <= ELEMENT_LOOP_PREROLL && left > ELEMENT_LOOP_LEAD &&
        this._def.loopStart >= ELEMENT_LOOP_PREROLL) {
      this._startPreroll(left);
    }
    if (this._preroll) this._align(el, end);
    if (this._switchTimer || left > ELEMENT_LOOP_LEAD) return;
    var self = this;
    // 先に鳴らしていれば音量を入れ替えるだけ。そうでなければ鳴り出すまでにかかる時間のぶん早めに
    var early = this._preroll ? ELEMENT_LOOP_EARLY : ELEMENT_LOOP_LATENCY;
    this._switchTimer = setTimeout(function () { self._switch(); }, Math.max(0, (left - early) * 1000));
  };

  /** 2つ目を「戻り先の left 秒前」から音量0で鳴らし始める */
  ElementLoopBgm.prototype._startPreroll = function (left) {
    var next = this._elements[1 - this._cur];
    next.volume = 0;
    next.preservesPitch = false;   // 聞こえないので、速さを変えても音を整えなくてよい
    next.playbackRate = 1;
    try { next.currentTime = this._def.loopStart - left + ELEMENT_LOOP_START_LAG; } catch (e) { return; }   // 読めていなければ先に鳴らさない
    this._preroll = true;
    this._drift = null;
    var promise = next.play();
    if (promise && promise.catch) promise.catch(function () {});
  };

  /** 2つ目の位置が1つ目とずれていれば、速さを少し変えて詰める（音量0なので速さを変えても聞こえない） */
  ElementLoopBgm.prototype._align = function (cur, end) {
    var next = this._elements[1 - this._cur];
    if (next.paused || next.seeking || next.readyState < 3) return;
    // 正なら2つ目が先に行きすぎ、負なら遅れている
    var drift = (next.currentTime - this._def.loopStart) - (cur.currentTime - end);
    if (Math.abs(drift) > 0.5) {
      try { next.currentTime = this._def.loopStart - (end - cur.currentTime); } catch (e) { /* 次の見回りで */ }
      this._drift = null;
      return;
    }
    // 読み取りの揺れを均す
    this._drift = this._drift === null ? drift : this._drift * 0.7 + drift * 0.3;
    var d = this._drift;
    next.playbackRate = Math.abs(d) < 0.002 ? 1 : Math.max(0.5, Math.min(2, 1 - d / ELEMENT_LOOP_ALIGN));
  };

  /**
   * 先に鳴らしていれば、その音量を戻す（いまの方は鳴り終わるまでそのまま。_finishClosing で止める）。
   * そうでなければ戻り先に合わせておいた方を鳴らし、それが鳴り出したら（_checkHandOver）、いまの方を止めて戻り先へ合わせ直す
   */
  ElementLoopBgm.prototype._switch = function () {
    clearTimeout(this._switchTimer);
    this._switchTimer = null;
    if (!this._playing) return;
    if (this._handOver) this._finishHandOver();   // 前の切り替えが済んでいなければ、先に済ませる
    if (this._closing) this._finishClosing();
    var old = this._elements[this._cur];
    this._cur = 1 - this._cur;
    var next = this._elements[this._cur];
    if (this._preroll) {
      this._preroll = false;
      if (!next.paused) {
        next.playbackRate = 1;
        next.volume = this._volume;
        this._closing = old;
        if (old.ended || old.paused) this._finishClosing();   // 遅れて、もう鳴り終わっていた
        return;
      }
      // 先に鳴らしたはずが止まっていた（読み込みの遅れ等）。ふつうに切り替える
    }
    next.volume = this._volume;
    next.playbackRate = 1;
    // 先に合わせておいた頭出しが効いていなければ（読み込みが遅れた等）、ここで合わせる
    if (Math.abs(next.currentTime - this._def.loopStart) > 0.05) {
      try { next.currentTime = this._def.loopStart; } catch (e) { /* 読めていなければ頭から */ }
    }
    this._handOver = { old: old, next: next, calledAt: Date.now(), from: next.currentTime };
    var promise = next.play();
    if (promise && promise.catch) promise.catch(function () {});
  };

  /**
   * 新しい方の再生位置が動き出したら、鳴り出したとみなして古い方を止める
   * （playing の知らせは音が出る前に来るので、目安にならなかった）
   */
  ElementLoopBgm.prototype._checkHandOver = function () {
    var h = this._handOver;
    if (h.next.currentTime - h.from > 0.002) {
      this._finishHandOver();
    } else if (Date.now() - h.calledAt > 300) {
      this._finishHandOver();   // 動き出さないとき（止められた等）も、いつまでも重ねない
    }
  };

  /** 鳴り終わった（または loopEnd に着いた）1つ目を止め、次の周のために戻り先へ合わせておく */
  ElementLoopBgm.prototype._finishClosing = function () {
    var old = this._closing;
    this._closing = null;
    old.volume = 0;
    try { old.pause(); } catch (e) { /* 鳴り終わっていてもよい */ }
    seekWhenReady(old, this._def.loopStart);
  };

  ElementLoopBgm.prototype._finishHandOver = function () {
    var old = this._handOver.old;
    this._handOver = null;
    try { old.pause(); } catch (e) { /* 同上 */ }
    seekWhenReady(old, this._def.loopStart);
  };

  /** http で開いていて、Web Audio があるときだけ（file:// では fetch が止められる） */
  function canUseWebAudioBgm() {
    var protocol = window.location && window.location.protocol;
    return (protocol === "http:" || protocol === "https:") && !!(window.AudioContext || window.webkitAudioContext);
  }

  /**
   * 曲を読み込んで波形にする。同じ曲は使い回す（戦闘のたびに読み直さない）。
   * 波形は大きい（2分の曲で約40MB）ので、覚えておくのは最後に使った3曲だけ
   */
  function loadBgmBuffer(manager, ctx, url) {
    var cache = manager._bgmBuffers || (manager._bgmBuffers = []);
    for (var i = 0; i < cache.length; i++) {
      if (cache[i].url === url) {
        var hit = cache.splice(i, 1)[0];
        cache.push(hit);
        return hit.promise;
      }
    }
    var promise = fetch(url).then(function (res) {
      if (!res.ok) throw new Error("not found");
      return res.arrayBuffer();
    }).then(function (data) {
      return new Promise(function (resolve, reject) { ctx.decodeAudioData(data, resolve, reject); });
    });
    cache.push({ url: url, promise: promise });
    if (cache.length > 3) cache.shift();
    // 失敗したものは覚えない（次に鳴らすときに読み直す）
    promise.catch(function () {
      for (var j = 0; j < cache.length; j++) if (cache[j].promise === promise) cache.splice(j, 1);
    });
    return promise;
  }

  // --- 操作待ちの解除・音量の反映 ---

  /**
   * 最初のクリック／キー入力で呼ぶ。
   * ここで初めて音を鳴らせるようになる。
   */
  AudioManager.prototype.unlock = function () {
    if (this.unlocked) return;
    this.unlocked = true;

    // 戻り先のある BGM と合成の効果音は Web Audio。操作前に作られていたら、ここで動かし始める
    if (this._ctx && this._ctx.state === "suspended" && this._ctx.resume) this._ctx.resume();

    // 鳴らせずに待っていたBGMがあれば、ここで鳴らす
    if (this.pendingBgmId && this._bgm) {
      var audio = this._bgm;
      var promise = audio.play();
      if (promise && promise.catch) promise.catch(function () {});
    }
    this.pendingBgmId = null;
  };

  /**
   * 設定を変えたときに呼ぶ。いま鳴っているBGMの音量をその場で合わせる。
   * 効果音は鳴らすたびに音量を決めるので、ここでは何もしなくてよい。
   */
  AudioManager.prototype.applyVolume = function () {
    if (!this._bgm || !this.currentBgmId) return;

    var def = this._defOf("bgm", this.currentBgmId);
    this._bgmTarget = this._bgmVolume(def ? def.volume : 1);
    // 出はじめの途中なら _fadeIn が目標へ追いつく。そうでなければその場で合わせる
    if (this._fadingIn !== this._bgm) this._bgm.volume = this._bgmTarget;
  };

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function isArray(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
  }

  NS.AudioManager = AudioManager;
})(window.MyGame);
