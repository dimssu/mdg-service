/*
 * Search across the library — titles, subtitles, descriptions and chapters.
 *
 * Hand-written ES5-flavoured JS: no bundler, no dependencies, because the target
 * is a cheap Android phone that may still be on an old WebView. Inlined into the
 * page at build time — and only into the pages that actually use it.
 */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var langBtn = doc.getElementById('lang');

  var qInput = doc.getElementById('q');
  if (qInput) initSearch(qInput);

  function initSearch(input) {
    var index, strings;
    try {
      index = JSON.parse(doc.getElementById('idx').textContent);
      strings = JSON.parse(doc.getElementById('str').textContent);
    } catch (_e) {
      return; // no index — leave the plain, working list alone rather than break it
    }

    var list = doc.getElementById('list');
    var items = [].slice.call(list.querySelectorAll('.item'));
    var empty = doc.getElementById('empty');
    var countEl = doc.getElementById('count');
    var sizeEl = doc.getElementById('size');
    var clearBtn = doc.getElementById('qx');

    function lang() {
      return root.getAttribute('data-lang') === 'en' ? 'en' : 'hi';
    }

    // The placeholder is the one string that can't just sit in the markup twice.
    function syncPlaceholder() {
      input.setAttribute('placeholder', input.getAttribute('data-ph-' + lang()) || '');
    }
    syncPlaceholder();

    /**
     * Score one video against one search word.
     *
     * A hit in the title counts for more than one buried in a description, and a
     * word starting a title counts for more than one in the middle of it — so
     * "point" surfaces "Giving points to a warrior" above a video that merely
     * mentions points in passing.
     *
     * BOTH languages are always searched, whichever is on screen: people type in
     * whatever reaches their fingers first, and on an Android keyboard that is
     * often not the language they are reading.
     */
    function scoreWord(entry, w) {
      var best = 0;
      var chapter = null;

      function hit(text, atBoundary, inside) {
        var i = text.toLowerCase().indexOf(w);
        if (i < 0) return 0;
        // A match at a word boundary is what they meant; mid-word is a coincidence.
        var edge = i === 0 || /[\s(—·,.'"-]/.test(text.charAt(i - 1));
        return edge ? atBoundary : inside;
      }

      for (var l = 0; l < 2; l++) {
        best = Math.max(best, hit(entry.t[l], 100, 55));
        best = Math.max(best, hit(entry.s[l], 45, 30));
        best = Math.max(best, hit(entry.d[l], 22, 14));
      }

      // Aliases. Substring matching can't bridge a vocabulary gap — the login video
      // is titled "Logging in to the app", so the obvious query, "login", matched
      // nothing at all. Scored just under a real title hit: a deliberate synonym
      // should win comfortably without outranking a video that says the word itself.
      // `inside` is 0 — a mid-word hit in a bag of keywords is noise, not intent.
      best = Math.max(best, hit(entry.k, 80, 0));

      for (var c = 0; c < entry.c.length; c++) {
        var ch = entry.c[c];
        var s = Math.max(hit(ch[1], 60, 35), hit(ch[2], 60, 35));
        if (s > 0) {
          best = Math.max(best, s);
          // Keep the strongest chapter — that is the moment worth linking to.
          if (!chapter || s > chapter.s) {
            chapter = { s: s, t: ch[0], hi: ch[1], en: ch[2] };
          }
        }
      }

      return { score: best, chapter: chapter };
    }

    function search(query) {
      var words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (!words.length) return null;

      var out = [];
      for (var i = 0; i < index.length; i++) {
        var total = 0;
        var chapter = null;
        var all = true;

        for (var w = 0; w < words.length; w++) {
          var r = scoreWord(index[i], words[w]);
          // Every word has to land somewhere, or this isn't the video they meant.
          if (r.score === 0) {
            all = false;
            break;
          }
          total += r.score;
          if (r.chapter && (!chapter || r.chapter.s > chapter.s)) chapter = r.chapter;
        }

        if (all) out.push({ i: i, score: total, chapter: chapter });
      }

      // Ties keep the taught order — part 1 before part 4.
      out.sort(function (a, b) {
        return b.score - a.score || a.i - b.i;
      });
      return { results: out, words: words };
    }

    /* --- highlighting --- */

    function highlight(el, words) {
      var raw = el.getAttribute('data-raw');
      if (raw === null) {
        raw = el.textContent;
        el.setAttribute('data-raw', raw);
      }
      if (!words || !words.length) {
        el.textContent = raw;
        return;
      }

      var lower = raw.toLowerCase();
      var ranges = [];
      for (var i = 0; i < words.length; i++) {
        var from = 0;
        var at;
        while ((at = lower.indexOf(words[i], from)) !== -1) {
          ranges.push([at, at + words[i].length]);
          from = at + words[i].length;
        }
      }
      if (!ranges.length) {
        el.textContent = raw;
        return;
      }

      ranges.sort(function (a, b) {
        return a[0] - b[0];
      });

      var frag = doc.createDocumentFragment();
      var cursor = 0;
      for (var r = 0; r < ranges.length; r++) {
        if (ranges[r][0] < cursor) continue; // overlaps a range already emitted
        if (ranges[r][0] > cursor) {
          frag.appendChild(doc.createTextNode(raw.slice(cursor, ranges[r][0])));
        }
        var mk = doc.createElement('mark');
        mk.textContent = raw.slice(ranges[r][0], ranges[r][1]);
        frag.appendChild(mk);
        cursor = ranges[r][1];
      }
      if (cursor < raw.length) frag.appendChild(doc.createTextNode(raw.slice(cursor)));

      el.textContent = '';
      el.appendChild(frag);
    }

    /** The card's own title + subtitle, in both languages (one is display:none). */
    function markable(item) {
      return [].slice.call(item.querySelectorAll('h2, .card-body > p'));
    }

    /* --- render --- */

    function clock(sec) {
      var s = Math.round(sec);
      var r = s % 60;
      return Math.floor(s / 60) + ':' + (r < 10 ? '0' : '') + r;
    }

    function setCount(pick) {
      // Both languages live inside the pill; rewrite each in place.
      var spans = countEl.querySelectorAll('[lang]');
      for (var i = 0; i < spans.length; i++) {
        spans[i].textContent = pick(strings[spans[i].getAttribute('lang')] || strings.hi);
      }
    }

    function reset() {
      for (var i = 0; i < items.length; i++) {
        items[i].hidden = false;
        items[i].classList.remove('best');
        items[i].querySelector('.hits').hidden = true;
        var m = markable(items[i]);
        for (var j = 0; j < m.length; j++) highlight(m[j], null);
        list.appendChild(items[i]); // put the taught order back
      }
      empty.hidden = true;
      if (sizeEl) sizeEl.hidden = false;
      setCount(function (s) {
        return s.all;
      });
      clearBtn.hidden = true;
    }

    function render(query) {
      var found = search(query);
      if (!found) {
        reset();
        return;
      }

      clearBtn.hidden = false;
      var results = found.results;
      var words = found.words;

      for (var i = 0; i < items.length; i++) {
        items[i].hidden = true;
        items[i].classList.remove('best');
        items[i].querySelector('.hits').hidden = true;
        // Strip the previous query's highlights. They're on hidden cards so nobody
        // sees them, but a card that reappears must not arrive still marked up.
        var stale = markable(items[i]);
        for (var k = 0; k < stale.length; k++) highlight(stale[k], null);
      }

      for (var r = 0; r < results.length; r++) {
        var res = results[r];
        var item = items[res.i];
        item.hidden = false;
        // Only call something the best match when there is something to beat.
        if (r === 0 && results.length > 1) {
          item.setAttribute('data-best', (strings[lang()] || strings.hi).best);
          item.classList.add('best');
        }
        list.appendChild(item); // re-append in rank order: best rises to the top

        var m = markable(item);
        for (var j = 0; j < m.length; j++) highlight(m[j], words);

        var hits = item.querySelector('.hits');
        hits.textContent = '';
        if (res.chapter) {
          // The hit was inside a chapter, so offer that exact second of the video.
          var a = doc.createElement('a');
          a.className = 'hit';
          a.href = index[res.i].u + '#t=' + res.chapter.t;
          var t = doc.createElement('span');
          t.className = 'hit-t';
          t.textContent = clock(res.chapter.t);
          var label = doc.createElement('span');
          label.textContent = res.chapter[lang()];
          a.appendChild(t);
          a.appendChild(label);
          hits.appendChild(a);
          highlight(label, words);
          hits.hidden = false;
        } else {
          hits.hidden = true;
        }
      }

      var n = results.length;
      empty.hidden = n > 0;
      if (sizeEl) sizeEl.hidden = true;
      setCount(function (s) {
        return n === 1 ? s.one : s.many.replace('{n}', n);
      });
    }

    input.addEventListener('input', function () {
      render(input.value);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        input.value = '';
        reset();
        return;
      }
      // Enter goes straight to the best match — that is what the ranking is for.
      if (e.key === 'Enter') {
        var found = search(input.value);
        if (found && found.results.length) {
          var top = found.results[0];
          location.href = index[top.i].u + (top.chapter ? '#t=' + top.chapter.t : '');
        }
      }
    });

    clearBtn.addEventListener('click', function () {
      input.value = '';
      reset();
      input.focus();
    });

    doc.getElementById('showall').addEventListener('click', function () {
      input.value = '';
      reset();
      input.focus();
    });

    // Switching language must re-render the hits, the count and the placeholder.
    if (langBtn) {
      langBtn.addEventListener('click', function () {
        syncPlaceholder();
        render(input.value);
      });
    }
  }
})();
