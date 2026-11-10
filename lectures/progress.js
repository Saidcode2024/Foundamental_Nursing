(function (w) {
  'use strict';
  var P = {
    statusOf: function (lec) {
      var s = Store.lecture(lec.id);
      return s && s.status ? s.status : (lec.initialStatus || 'not_started');
    },
    percentOf: function (lec) {
      var st = P.statusOf(lec);
      if (st === 'completed') return 100;
      if (st === 'not_started') return 0;
      var s = Store.lecture(lec.id);
      return Math.min(99, Math.max(0, Math.round((s && s.reading) || 0)));
    },
    setStatus: function (lec, status) {
      var patch = { status: status };
      if (status === 'not_started') { patch.reading = 0; patch.scrollY = 0; patch.section = ''; }
      Store.setLecture(lec.id, patch);
    },
    stats: function (list) {
      var r = { total: list.length, completed: 0, inprogress: 0, notstarted: 0,
        theory: { total: 0, completed: 0, pct: 0 }, practical: { total: 0, completed: 0, pct: 0 } };
      list.forEach(function (l) {
        var st = P.statusOf(l), g = l.type === 'Practical' ? r.practical : r.theory;
        g.total++;
        if (st === 'completed') { r.completed++; g.completed++; }
        else if (st === 'in_progress') r.inprogress++;
        else r.notstarted++;
      });
      function pc(a, b) { return b ? Math.round(a / b * 100) : 0; }
      r.overall = pc(r.completed, r.total);
      r.theory.pct = pc(r.theory.completed, r.theory.total);
      r.practical.pct = pc(r.practical.completed, r.practical.total);
      r.remaining = r.total - r.completed;
      return r;
    }
  };
  w.Progress = P;
})(window);
