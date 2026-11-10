(function (w) {
  'use strict';
  var KEY = 'nursingAcademy.v1';
  var STATUSES = ['not_started', 'in_progress', 'completed'];
  function isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }
  function blank() {
    return { app: 'nursing-academy', version: 1, lectures: {}, notes: {}, drafts: {}, quizzes: {},
      last: null, settings: {} };
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (isObj(d)) {
          var b = blank();
          Object.keys(b).forEach(function (k) { if (d[k] !== undefined) b[k] = d[k]; });
          return b;
        }
      }
    } catch (e) { /* fall through */ }
    return blank();
  }
  var data = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { return false; } }
  // Always re-read before writing so two open tabs never overwrite each other.
  function mutate(fn) { data = load(); var r = fn(data); save(); return r; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  var Store = {
    STATUSES: STATUSES,
    get: function () { data = load(); return data; },
    lecture: function (id) { return Store.get().lectures[id] || null; },
    setLecture: function (id, patch) {
      return mutate(function (d) {
        var cur = d.lectures[id] || {};
        Object.keys(patch).forEach(function (k) { cur[k] = patch[k]; });
        cur.updated = Date.now();
        d.lectures[id] = cur;
        return cur;
      });
    },
    setLast: function (o) { mutate(function (d) { d.last = o; }); },
    notes: function (id) { return Store.get().notes[id] || []; },
    addNote: function (id, text) {
      mutate(function (d) {
        if (!Array.isArray(d.notes[id])) d.notes[id] = [];
        d.notes[id].push({ id: uid(), text: text, created: Date.now(), updated: Date.now() });
      });
    },
    editNote: function (id, nid, text) {
      mutate(function (d) {
        (d.notes[id] || []).forEach(function (n) { if (n.id === nid) { n.text = text; n.updated = Date.now(); } });
      });
    },
    deleteNote: function (id, nid) {
      mutate(function (d) { d.notes[id] = (d.notes[id] || []).filter(function (n) { return n.id !== nid; }); });
    },
    draft: function (id) { return Store.get().drafts[id] || ''; },
    setDraft: function (id, text) { mutate(function (d) { if (text) d.drafts[id] = text; else delete d.drafts[id]; }); },
    quizzes: function (id) { return Store.get().quizzes[id] || []; },
    addQuiz: function (id, res) {
      mutate(function (d) {
        if (!Array.isArray(d.quizzes[id])) d.quizzes[id] = [];
        res.at = Date.now();
        d.quizzes[id].push(res);
        if (d.quizzes[id].length > 50) d.quizzes[id] = d.quizzes[id].slice(-50);
      });
    }
  };
  w.Store = Store;
})(window);
