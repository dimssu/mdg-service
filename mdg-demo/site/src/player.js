/*
 * The video player: sharing, seekable chapters, and quality that follows the
 * connection instead of being guessed once and left alone.
 *
 * Hand-written ES5-flavoured JS: no bundler, no dependencies, because the target
 * is a cheap Android phone that may still be on an old WebView.
 *
 * WHY NOT HLS. Real adaptive streaming (hls.js) is the textbook answer, and it was
 * measured and rejected: the light build is 106 kB gzipped. On the 2G connection
 * this site exists to serve, that is roughly 17 seconds of library download BEFORE
 * the first byte of video — paid by exactly the viewer it is meant to rescue. The
 * clips are 0.7–5 MB, so the machinery would cost a sixth of the payload it manages.
 *
 * The same job is done here against three progressive MP4 rungs in about 2 kB. The
 * signal is the one every ABR algorithm actually relies on: whether the buffer is
 * filling faster than it drains. A rung that cannot keep the buffer ahead of the
 * playhead is the wrong rung — no bandwidth estimate required. A switch re-requests
 * from the current byte offset (servers honour Range), so it costs a short rebuffer,
 * never a restart.
 */
(function () {
  'use strict';

  var doc = document;

  var video = doc.getElementById('v');
  if (!video) return;

  /* ---------------- strings + toast ---------------- */

  var strings = {};
  try {
    strings = JSON.parse(doc.getElementById('str').textContent);
  } catch (_e) {
    /* no strings — the player still works, it just stays quiet */
  }

  function lang() {
    return doc.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'hi';
  }

  function str(key) {
    var s = strings[lang()] || strings.hi || {};
    return s[key] || '';
  }

  var toastEl = doc.getElementById('toast');
  var toastTimer = null;

  function toast(message) {
    if (!toastEl || !message) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.hidden = true;
    }, 4500);
  }

  /* ---------------- share ---------------- */

  var shareBtn = doc.getElementById('share');
  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      var url = shareBtn.getAttribute('data-url');
      var title = shareBtn.getAttribute('data-text-' + lang()) || '';

      // The native sheet is the point: on an Android phone it opens straight into
      // WhatsApp, which is how these videos will actually travel between dealers.
      if (navigator.share) {
        navigator
          .share({ title: title, text: str('shareText') + ' ' + title, url: url })
          .catch(function () {
            /* the viewer dismissed the sheet — not an error, say nothing */
          });
        return;
      }

      // Desktop, or an old WebView with no share sheet: put it on the clipboard.
      var copied = function () {
        toast(str('copied'));
      };
      var failed = function () {
        // Still show the link — they can select it by hand rather than be stuck.
        toast(str('failed') + ' ' + url);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(copied, failed);
        return;
      }

      try {
        var ta = doc.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        doc.body.appendChild(ta);
        ta.select();
        var ok = doc.execCommand('copy');
        doc.body.removeChild(ta);
        if (ok) copied();
        else failed();
      } catch (_e) {
        failed();
      }
    });
  }

  /* ---------------- the ladder ---------------- */

  // Cheapest first. `tiny` (240p) is never offered as a choice — it is where
  // automatic switching lands when the connection genuinely cannot carry more.
  var LEVELS = ['tiny', 'low', 'high'];

  var sources = {
    tiny: video.getAttribute('data-tiny'),
    low: video.getAttribute('data-low'),
    high: video.getAttribute('data-high'),
  };

  var note = doc.getElementById('note');
  var dl = doc.getElementById('dl');
  var buttons = doc.querySelectorAll('.q');

  /** What the VIEWER chose: 'auto' | 'low' | 'high'. */
  var mode = 'auto';
  /** Which rung is actually playing, as an index into LEVELS. */
  var level = 1;

  try {
    var saved = localStorage.getItem('dk_quality');
    if (saved === 'auto' || saved === 'low' || saved === 'high') mode = saved;
  } catch (_e) {
    /* private mode — default to auto */
  }

  function conn() {
    return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  }

  /**
   * The rung to open on, before a single byte has been measured.
   *
   * Chrome on Android — essentially every viewer here — reports the connection, so
   * trust it. Where the API doesn't exist (iOS, desktop) assume a decent link and
   * start clear; if that guess is wrong the buffer will say so within seconds and
   * the player drops on its own.
   */
  function startLevel() {
    var c = conn();
    if (!c) return 2;
    if (c.saveData) return 0;
    var t = c.effectiveType;
    if (t === 'slow-2g' || t === '2g') return 0;
    if (t === '3g') return 1;
    return 2;
  }

  function paint() {
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      b.setAttribute('aria-pressed', String(b.getAttribute('data-q') === mode));
    }
    // Watching offline should cost the least data that is still worth watching, so
    // the download is always the 360p file, whatever happens to be streaming.
    if (dl) dl.setAttribute('href', sources.low);
  }

  /**
   * Swap the playing rung, keeping the viewer's place.
   *
   * Changing src resets the element, so the playhead and the play/pause state are
   * carried across by hand. Without this a quality change would throw the viewer
   * back to the start — on a slow link, re-downloading everything they already
   * waited for, which is the exact opposite of the point.
   */
  function setLevel(next, why) {
    next = Math.max(0, Math.min(LEVELS.length - 1, next));
    if (next === level) return;

    var at = video.currentTime;
    var wasPlaying = !video.paused && !video.ended;
    level = next;

    video.src = sources[LEVELS[level]];
    video.load();

    if (at > 0 || wasPlaying) {
      video.addEventListener('loadedmetadata', function once() {
        video.removeEventListener('loadedmetadata', once);
        if (at > 0) {
          try {
            video.currentTime = at;
          } catch (_e) {
            /* can't seek there yet — start from wherever it can */
          }
        }
        if (wasPlaying) {
          var p = video.play();
          if (p && p.catch) p.catch(function () {});
        }
      });
      // load() alone won't fetch while preload="none", so if they were mid-playback
      // we have to ask for the bytes explicitly.
      if (wasPlaying) video.load();
    }

    resetMeter();
    if (why) toast(str(why));
  }

  /* ---------------- the measurement ---------------- */

  /*
   * Buffer health, not bandwidth. One question, once a second: is the buffer ahead
   * of the playhead growing or shrinking? A rung that cannot keep it growing is
   * unaffordable on this connection, whatever a speed test would have claimed.
   */

  var stalls = 0;
  var healthy = 0; // consecutive seconds with a comfortable buffer
  var lastAhead = 0;
  var meter = null;

  function bufferedAhead() {
    var b = video.buffered;
    for (var i = 0; i < b.length; i++) {
      if (video.currentTime >= b.start(i) - 0.5 && video.currentTime <= b.end(i)) {
        return b.end(i) - video.currentTime;
      }
    }
    return 0;
  }

  function resetMeter() {
    stalls = 0;
    healthy = 0;
    lastAhead = 0;
  }

  function tick() {
    if (mode !== 'auto' || video.paused || video.ended) return;

    var ahead = bufferedAhead();

    // Losing ground with almost nothing in hand: this rung is too expensive. Drop
    // now rather than let the viewer sit and watch a spinner.
    if (ahead < 2 && ahead <= lastAhead && level > 0) {
      lastAhead = ahead;
      setLevel(level - 1, 'dropped');
      return;
    }

    healthy = ahead > 20 ? healthy + 1 : 0;

    // Comfortably ahead for a sustained stretch, and the connection isn't saying
    // otherwise: it can afford more. Deliberately far slower to climb than to fall —
    // a wrong climb costs a rebuffer, and a stall is worse than a soft picture.
    if (healthy >= 12 && level < LEVELS.length - 1) {
      var c = conn();
      var slow = c && (c.saveData || c.effectiveType === '2g' || c.effectiveType === 'slow-2g');
      if (!slow) {
        healthy = 0;
        setLevel(level + 1, 'raised');
        return;
      }
    }

    lastAhead = ahead;
  }

  // A stall is the loudest possible signal that the rung is wrong.
  video.addEventListener('waiting', function () {
    if (mode !== 'auto' || video.ended) return;
    stalls++;
    // One stall can be a hiccup. Two means the connection cannot carry this rung.
    if (stalls >= 2 && level > 0) {
      stalls = 0;
      setLevel(level - 1, 'dropped');
    }
  });

  video.addEventListener('playing', function () {
    if (!meter) meter = setInterval(tick, 1000);
  });

  var stopMeter = function () {
    if (meter) {
      clearInterval(meter);
      meter = null;
    }
  };
  video.addEventListener('pause', stopMeter);
  video.addEventListener('ended', stopMeter);

  // The connection itself changed — leaving wifi, or Data Saver switched on. Don't
  // wait for the buffer to drain to find that out.
  var c0 = conn();
  if (c0 && c0.addEventListener) {
    c0.addEventListener('change', function () {
      if (mode !== 'auto') return;
      var want = startLevel();
      if (want < level) setLevel(want, 'dropped');
    });
  }

  /* ---------------- the viewer's choice ---------------- */

  function choose(next) {
    mode = next;
    try {
      localStorage.setItem('dk_quality', next);
    } catch (_e) {
      /* ignore */
    }
    if (note) note.hidden = true;

    if (next === 'auto') setLevel(startLevel(), null);
    else setLevel(next === 'low' ? 1 : 2, null);

    paint();
  }

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', function () {
      choose(this.getAttribute('data-q'));
    });
  }

  // The <source> in the markup is the 360p file, so a viewer with no JS still gets
  // something playable. Setting .src here overrides it (per spec the src attribute
  // wins over <source> children), and preload="none" means nothing is fetched until
  // they press play — so choosing a rung up front costs no bytes.
  level = mode === 'auto' ? startLevel() : mode === 'low' ? 1 : 2;
  video.src = sources[LEVELS[level]];
  paint();

  // Say so when we opened at the floor because the connection looked bad. Otherwise
  // a soft picture reads as a broken video rather than a deliberate kindness.
  if (mode === 'auto' && level === 0 && note) {
    note.textContent = str('slow');
    note.hidden = false;
  }

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

    // Nothing is buffered before the first play, so wait for metadata to seek.
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
