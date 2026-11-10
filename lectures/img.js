(function (w) {
  'use strict';
  var EX = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
  // Called by <img onerror>: tries the next extension; .svg (built-in drawing) always exists.
  w.NAImg = function (el) {
    var i = (+el.getAttribute('data-i') || 0) + 1;
    if (i >= EX.length) { el.onerror = null; return; }
    el.setAttribute('data-i', i);
    el.src = el.getAttribute('data-base') + EX[i];
  };
})(window);
