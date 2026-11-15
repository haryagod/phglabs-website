/*
 * PHG Labs Play: shared header/footer, saved scores, daily streaks, sharing and (optional) ads.
 * Loaded on every page with <script src="/js/core.js" defer></script>.
 */
(function () {
  // ---- Ads -------------------------------------------------------------------------------------------
  // AdSense publisher ID. Every page also has the AdSense script in its <head> (Google wants it there for
  // site verification); with Auto ads turned on in AdSense, Google places the ads itself. Empty = no ads at all.
  var ADSENSE_CLIENT = "ca-pub-8590058399315809";
  // Optional: a display ad unit ID (AdSense → Ads → By ad unit). When set, the <div class="ad"> spaces on each
  // page (sidebars and between sections, never inside a game) show that unit too. Empty = Auto ads only.
  var ADSENSE_SLOT = "";

  var NAV = [
    ["/", "Home"],
    ["/#code", "Code"],
    ["/#puzzles", "Puzzles"],
    ["/#brain", "Brain"],
    ["/chess/", "Chess"]
  ];
  var LOGO = '<svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="phg-lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4F46E5"/><stop offset="1" stop-color="#06B6D4"/></linearGradient></defs><polygon points="32,3 57.1,17.5 57.1,46.5 32,61 6.9,46.5 6.9,17.5" fill="url(#phg-lg)"/><g stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"><line x1="21" y1="22" x2="43" y2="24"/><line x1="21" y1="22" x2="27" y2="43"/><line x1="43" y1="24" x2="27" y2="43"/><line x1="43" y1="24" x2="45" y2="42"/></g><g fill="#fff"><circle cx="21" cy="22" r="5"/><circle cx="43" cy="24" r="4.2"/><circle cx="27" cy="43" r="4.6"/><circle cx="45" cy="42" r="3"/></g></svg>';

  // ---- Storage (never throws: private mode or blocked storage just means nothing is remembered) -------
  function load(key, fallback) {
    try { var v = localStorage.getItem("phgplay:" + key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem("phgplay:" + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  /** Records a score; returns true when it beats the saved best. */
  function best(game, score, lowerIsBetter) {
    var prev = load("best:" + game, null);
    var better = prev === null || (lowerIsBetter ? score < prev : score > prev);
    if (better) save("best:" + game, score);
    return better;
  }
  function getBest(game) { return load("best:" + game, null); }

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  /** Day number since 2026-01-01 in the visitor's local time: picks the same daily puzzle for everyone on a date. */
  function dayNumber() {
    var d = new Date();
    return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5);
  }
  /** Marks a daily challenge done; returns { streak, already }. */
  function markDaily(game) {
    var s = load("daily:" + game, { last: null, streak: 0 });
    var t = today();
    if (s.last === t) return { streak: s.streak, already: true };
    var y = new Date(); y.setDate(y.getDate() - 1);
    var yesterday = y.getFullYear() + "-" + String(y.getMonth() + 1).padStart(2, "0") + "-" + String(y.getDate()).padStart(2, "0");
    s.streak = s.last === yesterday ? s.streak + 1 : 1;
    s.last = t;
    save("daily:" + game, s);
    return { streak: s.streak, already: false };
  }
  function dailyState(game) {
    var s = load("daily:" + game, { last: null, streak: 0 });
    return { doneToday: s.last === today(), streak: s.streak };
  }

  // ---- UI helpers -------------------------------------------------------------------------------------
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }
  function share(text) {
    var url = location.origin + location.pathname;
    if (navigator.share) { navigator.share({ text: text, url: url }).catch(function () {}); return; }
    var full = text + "\n" + url;
    if (navigator.clipboard) navigator.clipboard.writeText(full).then(function () { toast("Copied! Paste it anywhere to share."); }, function () { toast(full); });
    else toast(full);
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---- Effects: sounds (synthesized with Web Audio, no files), haptics, confetti and small animations ---
  // Games call PLAY.fx.good(el, "+1"), .bad(el), .win(el), .lose(el) or .sound("move"). One header toggle mutes
  // sound and vibration together. Animations are skipped for visitors who ask for reduced motion.
  var soundOn = load("sound", true), ac = null, master = null;
  var reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function audio() {
    if (!soundOn) return null;
    try {
      if (!ac) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ac = new AC(); master = ac.createGain(); master.gain.value = 0.35; master.connect(ac.destination);
      }
      if (ac.state === "suspended") ac.resume();
      return ac;
    } catch (e) { return null; }
  }
  // One note: wave type, frequency (Hz), start offset and length (s), volume, optional pitch glide target
  function note(type, f, at, dur, vol, to) {
    var a = audio(); if (!a) return;
    var t = a.currentTime + (at || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  // A short filtered noise burst (the "wood" in chess moves)
  function noise(at, dur, vol, freq) {
    var a = audio(); if (!a) return;
    var n = Math.ceil(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + (at || 0);
    s.buffer = buf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 1.2; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  var SOUNDS = {
    tap: function () { note("sine", 880, 0, 0.05, 0.1, 660); },
    good: function () { note("triangle", 1318.5, 0, 0.18, 0.3); note("triangle", 1975.5, 0.08, 0.35, 0.28); },
    bad: function () { note("square", 220, 0, 0.12, 0.05, 196); note("square", 165, 0.1, 0.22, 0.05, 147); },
    win: function () {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { note("triangle", f, i * 0.09, 0.3, 0.25); });
      note("triangle", 1318.5, 0.38, 0.7, 0.22); note("sine", 2093, 0.42, 0.6, 0.07);
    },
    lose: function () { [392, 349.23, 311.13].forEach(function (f, i) { note("triangle", f, i * 0.16, 0.32, 0.18); }); },
    move: function () { noise(0, 0.07, 0.6, 900); note("sine", 180, 0, 0.06, 0.15); },
    capture: function () { noise(0, 0.1, 0.9, 700); noise(0.04, 0.08, 0.6, 1400); note("sine", 140, 0, 0.09, 0.2); },
    check: function () { note("square", 880, 0, 0.08, 0.05); note("square", 880, 0.11, 0.08, 0.05); },
    tick: function () { note("sine", 1200, 0, 0.035, 0.08); },
    pop: function () { note("sine", 500, 0, 0.09, 0.18, 1100); }
  };
  var HAPTIC = { tap: 8, good: [12, 40, 18], bad: 70, win: [20, 50, 20, 50, 40], lose: 120, move: 10, capture: 18, check: [15, 30, 15] };
  function sound(name) {
    if (!soundOn) return;
    if (SOUNDS[name]) SOUNDS[name]();
    if (HAPTIC[name] && navigator.vibrate) { try { navigator.vibrate(HAPTIC[name]); } catch (e) { /* ignore */ } }
  }
  function anim(el, cls) {
    if (!el || reduced) return;
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    clearTimeout(el["_" + cls]);
    el["_" + cls] = setTimeout(function () { el.classList.remove(cls); }, 800);
  }
  function layer(cls, x, y) {
    var d = document.createElement("div");
    d.className = cls; d.style.left = x + "px"; d.style.top = y + "px"; d.setAttribute("aria-hidden", "true");
    document.body.appendChild(d);
    return d;
  }
  // "+1" that floats up from an element
  function floatText(el, text, color) {
    if (!el || reduced) return;
    var r = el.getBoundingClientRect(), f = layer("fx-float", r.left + r.width / 2, r.top + Math.min(r.height / 2, 30));
    f.textContent = text; if (color) f.style.color = color;
    setTimeout(function () { f.remove(); }, 1100);
  }
  // A small burst of sparks around an element
  function sparkle(el) {
    if (!el || reduced) return;
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < 12; i++) {
      var a = (i / 12) * Math.PI * 2 + Math.random() * 0.4, dist = 40 + Math.random() * 50, s = layer("fx-spark", cx, cy);
      s.style.setProperty("--dx", Math.cos(a) * dist + "px"); s.style.setProperty("--dy", Math.sin(a) * dist + "px");
      s.style.background = ["#67E8F9", "#A5B4FC", "#4ADE80", "#FBBF24"][i % 4];
      setTimeout(function (s) { s.remove(); }.bind(null, s), 700);
    }
  }
  // Full-screen confetti for a finished round or a solved puzzle
  function confetti() {
    if (reduced) return;
    var c = document.createElement("canvas"), x = c.getContext("2d"), W = c.width = innerWidth, H = c.height = innerHeight, parts = [];
    c.className = "fx-confetti"; c.setAttribute("aria-hidden", "true"); document.body.appendChild(c);
    var colors = ["#6366F1", "#22D3EE", "#4ADE80", "#FBBF24", "#F472B6", "#FFFFFF"];
    for (var i = 0; i < 140; i++) {
      var left = i % 2 === 0;
      parts.push({ x: left ? 0 : W, y: H * 0.65, vx: (left ? 1 : -1) * (4 + Math.random() * 9), vy: -(9 + Math.random() * 11),
        r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4, w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, c: colors[i % colors.length] });
    }
    var t0 = performance.now();
    (function frame(now) {
      var age = now - t0;
      x.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        x.save(); x.globalAlpha = Math.max(0, 1 - age / 2200); x.translate(p.x, p.y); x.rotate(p.r);
        x.fillStyle = p.c; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2))); x.restore();
      });
      if (age < 2200) requestAnimationFrame(frame); else c.remove();
    })(t0);
  }
  var fx = {
    sound: sound, float: floatText, sparkle: sparkle, confetti: confetti,
    pop: function (el) { anim(el, "fx-pop"); },
    good: function (el, text) { sound("good"); anim(el, "fx-pop"); sparkle(el); if (text) floatText(el, text); },
    bad: function (el) { sound("bad"); anim(el, "fx-shake"); },
    win: function (el) { sound("win"); confetti(); if (el) anim(el, "fx-pop"); },
    lose: function (el) { sound("lose"); anim(el, "fx-shake"); }
  };
  // Every button gives a soft click (capture phase, so it plays before the game's own result sound)
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button, a.btn");
    if (b && !b.disabled && !b.classList.contains("sound-toggle")) sound("tap");
  }, true);
  function soundButton() {
    var b = document.createElement("button");
    b.className = "sound-toggle"; b.type = "button";
    var paint = function () {
      b.textContent = soundOn ? "🔊" : "🔇";
      b.setAttribute("aria-pressed", String(soundOn));
      b.setAttribute("aria-label", soundOn ? "Sound on. Click to mute" : "Sound off. Click to turn on");
      b.title = soundOn ? "Mute sounds" : "Turn sounds on";
    };
    b.onclick = function () { soundOn = !soundOn; save("sound", soundOn); paint(); if (soundOn) sound("pop"); };
    paint();
    return b;
  }

  // ---- Header, footer, ads ----------------------------------------------------------------------------
  function chrome() {
    var path = location.pathname;
    var header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML = '<div class="container nav"><a class="brand" href="/">' + LOGO + '<span><b>PHG</b> Labs</span><span class="play-tag">Play</span></a>' +
      '<nav class="nav-links" aria-label="Main">' + NAV.map(function (n) {
        var active = n[0] === path || (n[0] === "/chess/" && path.indexOf("/chess/") === 0);
        return '<a href="' + n[0] + '"' + (active ? ' class="active" aria-current="page"' : "") + ">" + n[1] + "</a>";
      }).join("") + "</nav></div>";
    header.querySelector(".nav").appendChild(soundButton());
    document.body.insertBefore(header, document.body.firstChild);

    var footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = '<div class="container footer-row"><span>© ' + new Date().getFullYear() + ' PHG Labs · Free games for curious minds</span>' +
      '<nav class="footer-links" aria-label="Footer"><a href="/about/">About</a><a href="/privacy/">Privacy</a><a href="/credits/">Credits</a>' +
      '<a href="https://phglabs.in/" rel="noopener">phglabs.in</a></nav></div>';
    document.body.appendChild(footer);
  }
  function ads() {
    // No ads on pages without real content (AdSense policy), e.g. the 404 page
    if (!ADSENSE_CLIENT || document.querySelector('meta[name="robots"][content*="noindex"]')) return;
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
      var s = document.createElement("script");
      s.async = true;
      s.crossOrigin = "anonymous";
      s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ADSENSE_CLIENT;
      document.head.appendChild(s);
    }
    if (!ADSENSE_SLOT) return;
    document.documentElement.classList.add("ads-on");
    document.querySelectorAll(".ad").forEach(function (slot) {
      slot.innerHTML = '<ins class="adsbygoogle" style="display:block" data-ad-client="' + ADSENSE_CLIENT + '" data-ad-slot="' + ADSENSE_SLOT + '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  }

  window.PLAY = { load: load, save: save, best: best, getBest: getBest, today: today, dayNumber: dayNumber, markDaily: markDaily,
    dailyState: dailyState, toast: toast, share: share, shuffle: shuffle, esc: esc, fx: fx };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { chrome(); ads(); });
  else { chrome(); ads(); }
})();
