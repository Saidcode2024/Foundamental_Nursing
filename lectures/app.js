(function () {
  'use strict';
  var L = [], loadError = null, filter = 'all';
  var tab = (location.hash === '#progress') ? 'progress' : 'lectures';
  var SL = { not_started: 'Not Started', in_progress: 'In Progress', completed: 'Completed' };
  var SV = function (d) { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
  var BOOK = SV('<path d="M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2z"/><path d="M22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z"/>');
  var STETH = SV('<path d="M5 3v6a5 5 0 0 0 10 0V3"/><path d="M10 14v2a5 5 0 0 0 10 0v-3"/><circle cx="20" cy="11" r="2"/>');

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function view() { return document.getElementById('view'); }
  function find(id) { for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; return null; }
  function bar(p, green) { return '<div class="bar' + (green ? ' green' : '') + '"><i style="width:' + p + '%"></i></div>'; }
  function typePill(l) { return '<span class="pill ' + l.type.toLowerCase() + '">' + l.type + '</span>'; }
  function statusPill(l) { var s = Progress.statusOf(l); return '<span class="st ' + s + '">' + SL[s] + '</span>'; }

  function card(l) {
    var p = Progress.percentOf(l), s = Progress.statusOf(l);
    return '<article class="lcard"><img class="thumb" src="' + esc(l.image) + '.jpg" data-base="' + esc(l.image) + '" data-i="0" onerror="NAImg(this)" alt="' + esc(l.titleEn) + '">' +
      (l.imageCredit ? '<p class="cap">' + esc(l.imageCredit) + (l.imageSourceUrl ? ' · <a href="' + esc(l.imageSourceUrl) + '" target="_blank" rel="noopener">source</a>' : '') + '</p>' : '') +
      '<div class="lbody"><div class="row" style="margin:0"><span class="lnum">#' + pad(l.sequence) + ' · ' + esc(l.type) + ' ' + esc(l.number) + '</span>' + typePill(l) + '</div>' +
      '<h3>' + esc(l.titleEn) + '</h3>' + 
      (l.titleAr ? '<p class="ar">' + esc(l.titleAr) + '</p>' : '') +
      '<div class="row"><span>' + statusPill(l) + (l.taken ? ' <span class="st taken">Taken</span>' : '') + '</span><span>' + p + '%</span></div>' + bar(p, s === 'completed') +
      '<div class="lfoot"><a class="btn primary" style="flex:1" href="' + esc(l.content) + '">Open Lecture</a>' +
      '<select class="sel" data-status="' + esc(l.id) + '" aria-label="Change status">' +
      Store.STATUSES.map(function (k) { return '<option value="' + k + '"' + (k === s ? ' selected' : '') + '>' + SL[k] + '</option>'; }).join('') +
      '</select></div></div></article>';
  }

  function libHtml() {
    var list = Lectures.filter(L, filter);
    return '<div class="chips">' + [['all', 'All'], ['theory', 'Theory'], ['practical', 'Practical']].map(function (c) {
      return '<button type="button" class="chip" data-filter="' + c[0] + '"' + (filter === c[0] ? ' aria-current="true"' : '') + '>' + c[1] + '</button>';
    }).join('') + '</div><p class="muted">Showing ' + list.length + ' of ' + L.length + ' lectures, in curriculum order.</p>' +
      (list.length ? '<div class="lcards">' + list.map(card).join('') + '</div>' : '<p class="empty">No lectures in this group.</p>');
  }

  function render() {
    var y = window.scrollY;
    if (loadError) {
      view().innerHTML = '<div class="err"><b>Could not load the lectures list.</b><br>' + esc(loadError) + '</div>';
      return;
    }
    var s = Progress.stats(L), h = '';
    h += '<div class="bigtabs">' +
      '<button type="button" class="bigtab" data-tab="lectures"' + (tab === 'lectures' ? ' aria-current="true"' : '') + '>Lectures</button>' +
      '<button type="button" class="bigtab" data-tab="progress"' + (tab === 'progress' ? ' aria-current="true"' : '') + '>Progress</button></div>';
    if (tab === 'progress') {
      h += '<section class="hero"><h1>Welcome Back to Your Nursing Journey</h1><p>Learn • Practice • Improve</p></section>';
      h += '<div class="stats">' +
        '<div class="stat"><b>' + s.total + '</b><span>Total Lectures</span></div>' +
        '<div class="stat c-green"><b>' + s.completed + '</b><span>Completed</span></div>' +
        '<div class="stat c-orange"><b>' + s.inprogress + '</b><span>In Progress</span></div>' +
        '<div class="stat c-gray"><b>' + s.notstarted + '</b><span>Not Started</span></div>' +
        '<div class="stat wide"><b>' + s.overall + '%</b><span>Overall Progress</span></div></div>';
      h += '<div class="card"><h3>Progress Tracking</h3>' +
        '<div class="row"><span>Whole subject</span><b>' + s.overall + '%</b></div>' + bar(s.overall, true) +
        '<div class="row"><span>' + BOOK + ' Theory (' + s.theory.completed + '/' + s.theory.total + ')</span><b>' + s.theory.pct + '%</b></div>' + bar(s.theory.pct) +
        '<div class="row"><span>' + STETH + ' Practical (' + s.practical.completed + '/' + s.practical.total + ')</span><b>' + s.practical.pct + '%</b></div>' + bar(s.practical.pct, true) +
        '<p class="muted" style="margin:12px 0 0">Remaining lectures: <b>' + s.remaining + '</b></p></div>';
      var last = Store.get().last, lec = last && find(last.id);
      h += '<div class="card"><h3>Continue Learning</h3>';
      if (lec && Progress.statusOf(lec) !== 'not_started') {
        var sec = (Store.lecture(lec.id) || {}).section || last.section;
        h += '<div class="row" style="margin-top:0"><b>#' + pad(lec.sequence) + ' ' + esc(lec.titleEn) + '</b>' + typePill(lec) + '</div>' +
          '<p class="muted" style="margin:0 0 8px">' + (sec ? 'Last section: ' + esc(sec) : 'Last section: beginning') + '</p>' +
          '<div class="row"><span>' + SL[Progress.statusOf(lec)] + '</span><b>' + Progress.percentOf(lec) + '%</b></div>' + bar(Progress.percentOf(lec)) +
          '<p style="margin:12px 0 0"><a class="btn primary block" href="' + esc(lec.content) + '">Continue</a></p>';
      } else {
        h += '<p class="empty" style="padding:6px">You have not started any lecture yet. Open one from the Lectures page and it will show up here.</p>';
      }
      h += '</div>';
    } else {
      h += '<section id="lib">' + libHtml() + '</section>';
    }
    view().innerHTML = h;
    window.scrollTo(0, y);
  }

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.status) { var l = find(t.dataset.status); if (l) { Progress.setStatus(l, t.value); render(); } }
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-tab]') : null;
    if (t) {
      tab = t.dataset.tab;
      if (history.replaceState) history.replaceState(null, '', '#' + tab);
      render(); window.scrollTo(0, 0); return;
    }
    var b = e.target.closest ? e.target.closest('[data-filter]') : null;
    if (b) { filter = b.dataset.filter; document.getElementById('lib').innerHTML = libHtml(); }
  });
  window.addEventListener('pageshow', function () { if (L.length) render(); }); // refresh after coming back from a lecture

  try { L = Lectures.load(); } catch (e) { loadError = e.message; }
  render();
})();
