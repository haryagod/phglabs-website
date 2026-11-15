// Tiny JavaScript syntax highlighter for the code games. Returns one HTML string per line.
window.highlightJS = function (src) {
  var KW = /^(const|let|var|function|return|if|else|for|of|in|while|new|async|await|typeof|true|false|null|undefined|this)$/;
  var re = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)/g;
  return src.split("\n").map(function (line) {
    var out = "", last = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(line))) {
      out += PLAY.esc(line.slice(last, m.index));
      var t = PLAY.esc(m[0]);
      if (m[1]) out += '<span class="tok-c">' + t + "</span>";
      else if (m[2]) out += '<span class="tok-s">' + t + "</span>";
      else if (m[3]) out += '<span class="tok-n">' + t + "</span>";
      else if (KW.test(m[0])) out += '<span class="tok-k">' + t + "</span>";
      else if (m[4]) out += '<span class="tok-f">' + t + "</span>";
      else out += t;
      last = m.index + m[0].length;
    }
    return out + PLAY.esc(line.slice(last));
  });
};
window.renderCode = function (el, src, clickable) {
  el.className = "code" + (clickable ? " clickable" : "");
  el.innerHTML = window.highlightJS(src).map(function (html, i) {
    return '<div class="ln" data-line="' + (i + 1) + '"' + (clickable ? ' role="button" tabindex="0"' : "") + '><span class="n">' + (i + 1) + '</span><span class="t">' + (html || " ") + "</span></div>";
  }).join("");
};
