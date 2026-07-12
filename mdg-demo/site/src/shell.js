/*
 * Language toggle. Both languages ship in the HTML; this flips which one
 * CSS reveals, and remembers the choice.
 *
 * Hand-written ES5-flavoured JS: no bundler, no dependencies, because the target
 * is a cheap Android phone that may still be on an old WebView. Inlined into the
 * page at build time — and only into the pages that actually use it.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var btn = document.getElementById('lang');
  if (!btn) return;

  btn.addEventListener('click', function () {
    var lang = root.getAttribute('data-lang') === 'hi' ? 'en' : 'hi';
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    try {
      localStorage.setItem('dk_lang', lang);
    } catch (_e) {
      /* private mode — the toggle still works for this page view */
    }
    // Search adds its own listener for the same click. Listeners fire in the order
    // they were registered and this file is inlined first, so data-lang is already
    // updated by the time search re-renders its results in the new language.
  });
})();
