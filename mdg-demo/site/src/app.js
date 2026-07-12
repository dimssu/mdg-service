/*
 * Everything the guide site runs on the client. It is deliberately tiny, written
 * in ES5-flavoured JS with no bundler and no dependencies, because the target is
 * a cheap Android phone that may still be on an old WebView.
 *
 * It does three things: switch language, switch video quality without losing the
 * viewer's place, and jump to a chapter. If it never loads, the page still shows
 * Hindi copy and a playable data-saver video — nothing here is load-bearing.
 */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  /* ---------------- language ---------------- */

  function setLang(lang) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang);
    try {
      localStorage.setItem('dk_lang', lang);
    } catch (_e) {
      /* private mode — the toggle still works for this page view */
    }
  }

  var langBtn = doc.getElementById('lang');
  if (langBtn) {
    langBtn.addEventListener('click', function () {
      setLang(root.getAttribute('data-lang') === 'hi' ? 'en' : 'hi');
    });
  }

  /* ---------------- player ---------------- */

  var video = doc.getElementById('v');
  if (!video) return;

  var sources = {
    low: video.getAttribute('data-low'),
    high: video.getAttribute('data-high'),
  };

  /**
   * Pick a starting quality.
   *
   * Chrome on Android — which is essentially every user here — exposes the real
   * connection, so trust it: anything short of 4g, or an explicit Data Saver, gets
   * the 360p file. Where the API doesn't exist (iOS, desktop) we assume a decent
   * link and start clear. Either way the viewer can override, and the choice sticks.
   */
  function autoQuality() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return { q: 'high', forced: false };
    if (c.saveData) return { q: 'low', forced: true };
    var t = c.effectiveType;
    if (t === 'slow-2g' || t === '2g' || t === '3g') return { q: 'low', forced: true };
    return { q: 'high', forced: false };
  }

  var saved = null;
  try {
    saved = localStorage.getItem('dk_quality');
  } catch (_e) {
    /* ignore */
  }

  var auto = autoQuality();
  var quality = saved === 'low' || saved === 'high' ? saved : auto.q;

  // Only nag about the downgrade when we chose it for them, not when they did.
  var note = doc.getElementById('note');
  if (note && !saved && auto.forced) note.hidden = false;

  var dl = doc.getElementById('dl');
  var buttons = doc.querySelectorAll('.q');

  function paint() {
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      b.setAttribute('aria-pressed', String(b.getAttribute('data-q') === quality));
    }
    if (dl) dl.setAttribute('href', sources[quality]);
  }

  /**
   * Swapping the source resets the element, so carry the playhead and the
   * play/pause state across by hand — otherwise changing quality mid-video throws
   * the viewer back to the start, which on a slow link means re-downloading
   * everything they already waited for.
   */
  function setQuality(next) {
    if (next === quality) return;
    var at = video.currentTime;
    var wasPlaying = !video.paused && !video.ended;

    quality = next;
    try {
      localStorage.setItem('dk_quality', next);
    } catch (_e) {
      /* ignore */
    }
    if (note) note.hidden = true;

    video.src = sources[next];
    // preload="none" means load() costs nothing until the viewer actually plays.
    video.load();

    if (at > 0 || wasPlaying) {
      video.addEventListener('loadedmetadata', function once() {
        video.removeEventListener('loadedmetadata', once);
        if (at > 0) {
          try {
            video.currentTime = at;
          } catch (_e) {
            /* seeking past a not-yet-buffered point — just start from 0 */
          }
        }
        if (wasPlaying) {
          var p = video.play();
          if (p && p.catch) p.catch(function () {});
        }
      });
      // load() alone won't fetch metadata while preload="none", so if they were
      // mid-playback we have to ask for the bytes explicitly.
      if (wasPlaying) video.load();
    }

    paint();
  }

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function () {
      setQuality(this.getAttribute('data-q'));
    });
  }

  // The <source> in the markup is the data-saver file, so a no-JS visitor still
  // gets a playable video. Setting .src here overrides it (per spec, the src
  // attribute wins over <source> children) before a single byte is requested.
  video.src = sources[quality];
  paint();

  /* ---------------- chapters ---------------- */

  function seek(seconds) {
    var go = function () {
      try {
        video.currentTime = seconds;
      } catch (_e) {
        /* ignore */
      }
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    };

    // Nothing is buffered until the first play, so wait for metadata before seeking.
    if (video.readyState > 0) {
      go();
    } else {
      video.addEventListener('loadedmetadata', function once() {
        video.removeEventListener('loadedmetadata', once);
        go();
      });
      video.load();
    }
  }

  var chapters = doc.querySelectorAll('[data-t]');
  for (var j = 0; j < chapters.length; j++) {
    chapters[j].addEventListener('click', function (e) {
      e.preventDefault();
      seek(parseFloat(this.getAttribute('data-t')) || 0);
      video.scrollIntoView({ block: 'center' });
    });
  }

  // Deep link straight to a moment: /give-points#t=42
  var m = /(?:^|#)t=(\d+(?:\.\d+)?)/.exec(location.hash);
  if (m) seek(parseFloat(m[1]));
})();
