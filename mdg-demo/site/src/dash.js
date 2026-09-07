/*
 * What the dashboard does with what this phone remembers.
 *
 * Three things, all of them additive: a card offering to carry on where the
 * viewer stopped, a tick on every video they have finished, and a count on each
 * section heading. Every one of them is drawn AFTER first paint from
 * localStorage, so a phone with no memory of the site — a first visit, a private
 * window, a browser with site data switched off — simply shows the page as it
 * has always been, with no gap where a feature should have gone.
 *
 * ES5 only, inlined, like everything else here.
 */
(function () {
  var doc = document;
  var P = window.dkProgress;
  if (!P) return;

  /* Every video on the page, in the order they are laid out. */
  var cards = doc.querySelectorAll('.item[data-id]');
  var ids = [];
  for (var i = 0; i < cards.length; i++) ids.push(cards[i].getAttribute('data-id'));
  if (!ids.length) return;

  /* ---- a tick on what is finished ---- */
  for (var j = 0; j < cards.length; j++) {
    if (!P.watched(cards[j].getAttribute('data-id'))) continue;
    cards[j].className += ' done';
    var foot = cards[j].querySelector('.card-foot');
    if (foot) {
      var tick = doc.createElement('span');
      tick.className = 'seen';
      /* Both languages ship in the markup and CSS reveals one, exactly as the
         rest of the page does — so this cannot be the one string that fails to
         switch when the language button is pressed. */
      tick.innerHTML = '<span lang="hi">✓ देख लिया</span>' + '<span lang="en">✓ Watched</span>';
      foot.appendChild(tick);
    }
  }

  /* ---- how far through each section ---- */
  var secs = doc.querySelectorAll('.sec[data-sec]');
  for (var k = 0; k < secs.length; k++) {
    var key = secs[k].getAttribute('data-sec');
    var mine = [];
    for (var n = 0; n < cards.length; n++) {
      if (cards[n].getAttribute('data-sec') === key) mine.push(cards[n].getAttribute('data-id'));
    }
    if (mine.length < 2) continue;
    var done = P.countWatched(mine);
    if (!done) continue;
    var badge = doc.createElement('span');
    badge.className = 'sec-count';
    badge.textContent = done + '/' + mine.length;
    var h = secs[k].querySelector('h2');
    if (h && h.parentNode) h.parentNode.insertBefore(badge, h.nextSibling);
  }

  /* ---- carry on where you stopped ---- */
  var open = P.lastUnfinished(ids);
  var box = doc.getElementById('resume-card');
  if (!open || !box) return;

  var card = null;
  for (var q = 0; q < cards.length; q++) {
    if (cards[q].getAttribute('data-id') === open.id) card = cards[q];
  }
  if (!card) return;

  var title = card.querySelector('h2');
  var left = Math.max(1, Math.round((open.duration - open.seconds) / 60));
  var hiT = title ? title.querySelector('[lang="hi"]') : null;
  var enT = title ? title.querySelector('[lang="en"]') : null;

  box.innerHTML =
    '<a class="resume-a" href="/' +
    open.id +
    '">' +
    '<span class="resume-k">' +
    '<span lang="hi">जहाँ छोड़ा था</span>' +
    '<span lang="en">Where you stopped</span>' +
    '</span>' +
    '<span class="resume-t">' +
    '<span lang="hi">' +
    (hiT ? hiT.textContent : '') +
    '</span><span lang="en">' +
    (enT ? enT.textContent : '') +
    '</span>' +
    '</span>' +
    '<span class="resume-m">' +
    '<span lang="hi">' +
    left +
    ' मिनट बाकी</span>' +
    '<span lang="en">' +
    left +
    ' min left</span>' +
    '</span>' +
    '</a>';
  box.hidden = false;
})();
