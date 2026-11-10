(function () {
  'use strict';
  var me = document.currentScript;
  function onLoad(fn) { if (document.readyState === 'complete') fn(); else window.addEventListener('load', fn); }
  // Which lecture is this page? 1) data-lecture-id on <body>, 2) the entry in data/lectures.js
  // whose "content" path is this page, 3) the file name.
  function resolveId() {
    var a = document.body.getAttribute('data-lecture-id');
    if (a) return a;
    var path = decodeURIComponent(location.pathname), list = (window.LECTURES && window.LECTURES.lectures) || [];
    for (var k = 0; k < list.length; k++) {
      var c = list[k].content;
      if (c && path.slice(-(c.length + 1)) === '/' + c) return list[k].id;
    }
    return path.split('/').pop().replace(/\.html?$/i, '');
  }
  function boot() {
    var id = resolveId();
    if (!id || id.charAt(0) === '_' || !window.Store) return;
    start(id);
  }
  function start(id) {
  var css = '.lt-bar{position:fixed;left:0;right:0;bottom:0;z-index:65;display:flex;gap:8px;align-items:center;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:#142D4E;color:#fff;box-shadow:0 -2px 10px rgba(0,0,0,.15)}' +
    '.lt-bar button,.lt-bar a{border:0;border-radius:10px;padding:10px 12px;font:600 14px system-ui,Tahoma,sans-serif;background:#4A90C2;color:#fff;text-decoration:none;cursor:pointer}' +
    '.lt-bar .lt-done{background:#198754;flex:1}.lt-bar .lt-undo{background:#ffc107;color:#142D4E;flex:1}' +
    '.lt-pct{font:700 13px system-ui;min-width:44px;text-align:center}' +
    '.lt-sheet{position:fixed;left:0;right:0;bottom:0;max-height:75vh;overflow:auto;z-index:60;background:#fff;border-radius:16px 16px 0 0;padding:16px 16px 90px;box-shadow:0 -6px 24px rgba(0,0,0,.25);display:none}' +
    '.lt-sheet.open{display:block}.lt-sheet textarea{width:100%;min-height:80px;border:1px solid #cfd8e3;border-radius:10px;padding:10px;font:16px system-ui,Tahoma,sans-serif;box-sizing:border-box}' +
    '.lt-note{border:1px solid #e1e7ee;border-radius:10px;padding:10px;margin:8px 0;white-space:pre-wrap;overflow-wrap:anywhere}' +
    '.lt-note small{display:block;margin-top:6px}.lt-note button{background:#F4F6F8;color:#142D4E;margin-inline-end:6px;padding:6px 10px;border:0;border-radius:8px;cursor:pointer}' +
    '.lt-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:84px;background:#142D4E;color:#fff;padding:8px 14px;border-radius:20px;z-index:80;font:14px system-ui}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  document.body.style.paddingBottom = '80px';

  var cur = Store.lecture(id);
  if (!cur || !cur.status || cur.status === 'not_started') Store.setLecture(id, { status: 'in_progress' });

  var bar = document.createElement('div'); bar.className = 'lt-bar';
  bar.innerHTML = '<a href="../index.html#lectures">&larr; Lectures</a><span class="lt-pct"></span>' +
    '<button type="button" class="lt-main"></button><button type="button" class="lt-notes">Notes</button>';
  var sheet = document.createElement('div'); sheet.className = 'lt-sheet';
  sheet.innerHTML = '<h3 style="margin-top:0">My Notes</h3><textarea placeholder="Write a note... (saved automatically as a draft)"></textarea>' +
    '<p><button type="button" class="lt-add" style="background:#198754;color:#fff;border:0;border-radius:10px;padding:10px 14px;font-weight:600">Add note</button></p><div class="lt-list"></div>';
  document.body.appendChild(sheet); document.body.appendChild(bar);

  var pctEl = bar.querySelector('.lt-pct'), main = bar.querySelector('.lt-main');
  function toast(t) { var e = document.createElement('div'); e.className = 'lt-toast'; e.textContent = t; document.body.appendChild(e); setTimeout(function () { e.remove(); }, 1800); }
  function paint() {
    var s = Store.lecture(id) || {};
    var done = s.status === 'completed';
    pctEl.textContent = done ? '100%' : Math.min(99, Math.round(s.reading || 0)) + '%';
    main.textContent = done ? 'Back to In Progress' : 'Mark as Completed';
    main.className = 'lt-main ' + (done ? 'lt-undo' : 'lt-done');
  }
  main.addEventListener('click', function () {
    var s = Store.lecture(id) || {};
    if (s.status === 'completed') { Store.setLecture(id, { status: 'in_progress' }); toast('Moved back to In Progress'); }
    else { Store.setLecture(id, { status: 'completed' }); toast('Marked as completed'); }
    paint();
  });

  var ta = sheet.querySelector('textarea'), list = sheet.querySelector('.lt-list'), timer;
  ta.value = Store.draft(id);
  ta.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { Store.setDraft(id, ta.value); }, 400); });
  sheet.querySelector('.lt-add').addEventListener('click', function () {
    var t = ta.value.trim(); if (!t) return;
    Store.addNote(id, t); ta.value = ''; Store.setDraft(id, ''); drawNotes();
  });
  function drawNotes() {
    list.innerHTML = '';
    var ns = Store.notes(id);
    if (!ns.length) { list.innerHTML = '<p style="color:#5b6b7f">No notes yet.</p>'; return; }
    ns.forEach(function (n) {
      var d = document.createElement('div'); d.className = 'lt-note';
      var p = document.createElement('div'); p.textContent = n.text; d.appendChild(p);
      var sm = document.createElement('small');
      var e = document.createElement('button'); e.type = 'button'; e.textContent = 'Edit';
      var x = document.createElement('button'); x.type = 'button'; x.textContent = 'Delete';
      e.addEventListener('click', function () {
        var t = prompt('Edit note', n.text);
        if (t !== null && t.trim()) { Store.editNote(id, n.id, t.trim()); drawNotes(); }
      });
      x.addEventListener('click', function () { if (confirm('Delete this note?')) { Store.deleteNote(id, n.id); drawNotes(); } });
      sm.appendChild(e); sm.appendChild(x); d.appendChild(sm); list.appendChild(d);
    });
  }
  drawNotes();
  bar.querySelector('.lt-notes').addEventListener('click', function () { sheet.classList.toggle('open'); });

  function sectionNow() {
    var hs = document.querySelectorAll('h1,h2,h3'), name = '';
    for (var i = 0; i < hs.length; i++) { if (hs[i].getBoundingClientRect().top <= 80) name = hs[i].textContent.trim(); else break; }
    return name;
  }
  var tick;
  function track() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.round(window.scrollY / max * 100) : 0;
    var s = Store.lecture(id) || {};
    var patch = { scrollY: Math.round(window.scrollY), section: sectionNow() };
    if (pct > (s.reading || 0)) patch.reading = pct;
    if (s.status !== 'completed' && s.status !== 'in_progress') patch.status = 'in_progress';
    Store.setLecture(id, patch);
    Store.setLast({ id: id, section: patch.section, time: Date.now() });
    paint();
  }
  window.addEventListener('scroll', function () { clearTimeout(tick); tick = setTimeout(track, 300); }, { passive: true });
  onLoad(function () {
    var s = Store.lecture(id) || {};
    if (!location.hash && s.scrollY) setTimeout(function () { window.scrollTo(0, s.scrollY); }, 60);
    Store.setLast({ id: id, section: s.section || '', time: Date.now() });
    if (window.LECTURE_QUIZ && window.NursingQuiz) {
      var q = document.getElementById('quiz');
      if (q) NursingQuiz.mount(q, { lectureId: id, questions: window.LECTURE_QUIZ });
    }
    paint();
  });
  paint();
  }
  if (window.LECTURES) boot();
  else {
    var s = document.createElement('script');
    s.src = me.src.replace(/js\/lecture-tools\.js.*$/, 'data/lectures.js');
    s.onload = boot; s.onerror = boot;
    document.head.appendChild(s);
  }
})();
