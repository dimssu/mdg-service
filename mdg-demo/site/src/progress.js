/*
 * What this phone remembers about what it has watched.
 *
 * The site has no login and never will — a dealer who has to make an account to
 * watch a two-minute video does not watch the video. So everything here lives in
 * this browser's localStorage and nowhere else, and the copy says so out loud
 * ("यह इसी फ़ोन में सेव है") rather than implying a sync that does not exist.
 *
 * SHAPE: dk_p = { "<video id>": [secondsWatched, duration, epochSeconds] }
 * Three numbers per video, about 20 bytes each, so the whole library is well
 * under 2 kB even at seventy videos.
 *
 * EVERY read and write is wrapped. localStorage throws outright in a few real
 * situations — a private window on some Androids, a WebView with site data
 * disabled, storage full — and a video guide that white-screens because it could
 * not remember a timestamp would be a worse failure than forgetting. Every
 * feature built on this degrades to "a site with no memory", which is exactly
 * what the site was last week.
 *
 * ES5 only, like every other script here: no arrow functions, no const/let, no
 * template literals. It is inlined into both page types so the dashboard and the
 * player can never disagree about what "watched" means.
 */
(function (w) {
  var KEY = 'dk_p';

  /* 90%, not 100%. Nobody watches the last three seconds of a recap they have
     already read, and a tick that never appears is worse than one that appears
     slightly early. */
  var DONE = 0.9;

  function read() {
    try {
      var raw = w.localStorage.getItem(KEY);
      if (!raw) return {};
      var o = JSON.parse(raw);
      return o && typeof o === 'object' ? o : {};
    } catch (e) {
      return {};
    }
  }

  function write(o) {
    try {
      w.localStorage.setItem(KEY, JSON.stringify(o));
    } catch (e) {
      /* Full, blocked, or private. Nothing to do and nothing worth saying. */
    }
  }

  function put(id, seconds, duration) {
    if (!id || !duration || duration <= 0) return;
    var o = read();
    o[id] = [Math.round(seconds), Math.round(duration), Math.round(Date.now() / 1000)];
    write(o);
  }

  function get(id) {
    var o = read();
    var r = o[id];
    if (!r || r.length < 2) return null;
    return { seconds: r[0], duration: r[1], at: r[2] || 0 };
  }

  function watched(id) {
    var r = get(id);
    return !!r && r.duration > 0 && r.seconds / r.duration >= DONE;
  }

  /* Where to offer a resume: far enough in to be worth it, and not so far that
     the offer is really "watch the last four seconds again". */
  function resumeAt(id) {
    var r = get(id);
    if (!r || r.duration <= 0) return 0;
    if (r.seconds < 15) return 0;
    if (r.seconds / r.duration >= DONE) return 0;
    return r.seconds;
  }

  /* The most recently touched video that is not finished — the "carry on" card. */
  function lastUnfinished(ids) {
    var o = read();
    var best = null;
    for (var i = 0; i < ids.length; i++) {
      var r = o[ids[i]];
      if (!r || r.length < 2 || !r[1]) continue;
      if (r[0] / r[1] >= DONE) continue;
      if (r[0] < 15) continue;
      if (!best || (r[2] || 0) > best.at) {
        best = { id: ids[i], seconds: r[0], duration: r[1], at: r[2] || 0 };
      }
    }
    return best;
  }

  /** How many of `ids` are finished. Drives the "3/7" on a section heading. */
  function countWatched(ids) {
    var n = 0;
    for (var i = 0; i < ids.length; i++) if (watched(ids[i])) n++;
    return n;
  }

  w.dkProgress = {
    put: put,
    get: get,
    watched: watched,
    resumeAt: resumeAt,
    lastUnfinished: lastUnfinished,
    countWatched: countWatched,
  };
})(window);
