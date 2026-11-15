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
    dailyState: dailyState, toast: toast, share: share, shuffle: shuffle, esc: esc };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { chrome(); ads(); });
  else { chrome(); ads(); }
})();
