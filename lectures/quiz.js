(function (w) {
  'use strict';
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') e.className = attrs[k]; else if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function rating(p) { return p >= 90 ? 'Excellent' : p >= 75 ? 'Very good' : p >= 60 ? 'Good' : 'Needs review'; }
  // questions: [{q, qAr, options:[4 strings], answer:index, why, whyAr}]
  w.NursingQuiz = {
    mount: function (el, opt) {
      var qs = (opt.questions || []).filter(function (q) {
        return q && q.q && Array.isArray(q.options) && q.options.length >= 2 && q.options[q.answer] !== undefined;
      });
      if (!qs.length) return;
      var i = 0, score = 0, missed = [];
      function start() { i = 0; score = 0; missed = []; show(); }
      function show() {
        var q = qs[i];
        el.innerHTML = '';
        var box = h('div', { class: 'card quiz' });
        box.appendChild(h('div', { class: 'muted', text: 'Question ' + (i + 1) + ' / ' + qs.length }));
        box.appendChild(h('h3', { text: q.q }));
        if (q.qAr) box.appendChild(h('p', { class: 'ar', dir: 'rtl', text: q.qAr }));
        var fb = h('div', { class: 'quiz-fb' });
        var btns = [];
        q.options.forEach(function (o, k) {
          var b = h('button', { class: 'opt', type: 'button', text: o });
          b.addEventListener('click', function () {
            btns.forEach(function (x) { x.disabled = true; });
            btns[q.answer].classList.add('right');
            if (k === q.answer) score++; else { b.classList.add('wrong'); missed.push({ q: q.q, correct: q.options[q.answer], why: q.why || '' }); }
            fb.appendChild(h('p', { text: (k === q.answer ? 'Correct. ' : 'Not quite. ') + (q.why || '') }));
            if (q.whyAr) fb.appendChild(h('p', { class: 'ar', dir: 'rtl', text: q.whyAr }));
            var nx = h('button', { class: 'btn primary', type: 'button', text: i + 1 < qs.length ? 'Next' : 'See result' });
            nx.addEventListener('click', function () { i++; if (i < qs.length) show(); else done(); });
            fb.appendChild(nx);
          });
          btns.push(b); box.appendChild(b);
        });
        box.appendChild(fb);
        el.appendChild(box);
      }
      function done() {
        var pct = Math.round(score / qs.length * 100);
        Store.addQuiz(opt.lectureId, { score: score, total: qs.length, missed: missed });
        el.innerHTML = '';
        var box = h('div', { class: 'card quiz' }, [
          h('h3', { text: 'Result: ' + score + ' / ' + qs.length }),
          h('p', { text: rating(pct) + ' (' + pct + '%)' })
        ]);
        var rt = h('button', { class: 'btn primary', type: 'button', text: 'Retake Quiz' });
        rt.addEventListener('click', start);
        box.appendChild(rt);
        el.appendChild(box);
      }
      start();
    }
  };
})(window);
