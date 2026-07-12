/*
 * The video player: sharing, seekable chapters, and quality that follows the
 * connection — always automatically. There is no quality control, by design: the
 * viewer is a fuel-pump dealer, and a picker only asks them to guess at their own
 * bandwidth. The buffer already knows the answer, and keeps knowing it as the
 * signal moves.
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

  /* ---------------- share + copy ---------------- */

  var sharePanel = doc.querySelector('.share-panel');
  if (sharePanel) {
    var url = sharePanel.getAttribute('data-url');
    var shareBtn = doc.getElementById('share');
    var copyBtn = doc.getElementById('copy');

    var title = function () {
      return sharePanel.getAttribute('data-text-' + lang()) || '';
    };

    // The native sheet is the point where it exists: on an Android phone it opens
    // straight into WhatsApp, which is how these videos actually travel between
    // dealers. It is hidden rather than shown-and-broken where there is no sheet.
    if (navigator.share) {
      shareBtn.hidden = false;
      shareBtn.addEventListener('click', function () {
        navigator
          .share({ title: title(), text: str('shareText') + ' ' + title(), url: url })
          .catch(function () {
            /* the viewer dismissed the sheet — not an error, say nothing */
          });
      });
    }

    // Copy is always offered alongside it. Not everyone wants a share sheet — some
    // want the link itself, to paste into a message they are already writing.
    copyBtn.addEventListener('click', function () {
      var ok = function () {
        toast(str('copied'));
      };
      var no = function () {
        // Show the link anyway, so they can select it by hand rather than be stuck.
        toast(str('failed') + ' ' + url);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(ok, no);
        return;
      }

      // Old WebViews have no clipboard API at all.
      try {
        var ta = doc.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        doc.body.appendChild(ta);
        ta.select();
        var done = doc.execCommand('copy');
        doc.body.removeChild(ta);
        if (done) ok();
        else no();
      } catch (_e) {
        no();
      }
    });
  }

  /* ---------------- the ladder ---------------- */

  // Cheapest first. None of these is ever offered as a choice: quality is always
  // automatic. Asking a fuel-pump dealer to choose between "Data saver" and "Clear"
  // is asking them to guess at their own bandwidth — a question the player can
  // answer from the buffer, correctly, and keep answering as the signal moves.
  var LEVELS = ['tiny', 'low', 'high'];

  var sources = {
    tiny: video.getAttribute('data-tiny'),
    low: video.getAttribute('data-low'),
    high: video.getAttribute('data-high'),
  };

  var dl = doc.getElementById('dl');

  /** Which rung is actually playing, as an index into LEVELS. */
  var level = 1;

  // There is no manual override any more, and no stored preference. A viewer who
  // once tapped "Clear" would otherwise stay pinned to 720p forever, on any
  // connection, with no control left to un-pin it — so the old key is cleared out.
  try {
    localStorage.removeItem('dk_quality');
  } catch (_e) {
    /* private mode — nothing to clear */
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

  // Watching offline should cost the least data that is still worth watching, so
  // the download is always the 360p file, whatever happens to be streaming.
  if (dl) dl.setAttribute('href', sources.low);

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
    if (video.paused || video.ended) return;

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
    if (video.ended) return;
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
      var want = startLevel();
      if (want < level) setLevel(want, 'dropped');
    });
  }

  // The <source> in the markup is the 360p file, so a viewer with no JS still gets
  // something playable. Setting .src here overrides it (per spec the src attribute
  // wins over <source> children), and preload="none" means nothing is fetched until
  // they press play — so choosing a rung up front costs no bytes.
  level = startLevel();
  video.src = sources[LEVELS[level]];
  if (dl) dl.setAttribute('href', sources.low);

  // Say so when we open at the floor because the connection already looks bad.
  // Otherwise a soft picture reads as a broken video rather than a deliberate
  // kindness — and this is the only moment the viewer would have no other clue.
  if (level === 0) toast(str('slow'));

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
