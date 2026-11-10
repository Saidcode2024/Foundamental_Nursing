(function (w) {
  'use strict';
  // Reads window.LECTURES from data/lectures.js (a plain script, so it works even when
  // index.html is opened straight from the file manager, no server needed).
  w.Lectures = {
    load: function () {
      var raw = w.LECTURES, arr = raw && Array.isArray(raw.lectures) ? raw.lectures : [];
      if (!arr.length) throw new Error('data/lectures.js is missing or empty.');
      var seen = {}, out = [];
      arr.forEach(function (l) {
        if (!l || !l.id || seen[l.id] || (l.type !== 'Theory' && l.type !== 'Practical') || !l.titleEn || !l.content) {
          console.warn('Skipped invalid lecture entry:', l); return;
        }
        seen[l.id] = 1; out.push(l);
      });
      out.sort(function (a, b) { return a.sequence - b.sequence; });
      return out;
    },
    filter: function (list, f) {
      if (f === 'theory') return list.filter(function (l) { return l.type === 'Theory'; });
      if (f === 'practical') return list.filter(function (l) { return l.type === 'Practical'; });
      return list;
    }
  };
})(window);
