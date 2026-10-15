/* Carried over from films/graphics/graphics.html: backdrop plates + odometers.
   The icon sprite is injected here so every panel file can <use href="#i-…">
   without repeating it. */
document.body.insertAdjacentHTML('afterbegin', '<svg style="display:none">\n <symbol id="i-phone" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10.5 18.5h3"/></symbol>\n <symbol id="i-tablet" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.6"/><path d="M11 16.6h2"/></symbol>\n <symbol id="i-chat" viewBox="0 0 24 24"><path d="M21 11.6c0 4-3.9 7.2-8.7 7.2a10 10 0 0 1-2.6-.33L4.6 21l1.1-3.9A6.9 6.9 0 0 1 3.6 11.6c0-4 3.9-7.2 8.7-7.2s8.7 3.2 8.7 7.2Z"/></symbol>\n <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 6.8V12l3.4 2"/></symbol>\n <symbol id="i-doc" viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></symbol>\n <symbol id="i-lock" viewBox="0 0 24 24"><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.4"/><path d="M8 10.5V7.4a4 4 0 0 1 8 0v3.1"/><circle cx="12" cy="15.6" r="1.4"/></symbol>\n <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.6 10 17.5 19.2 7"/></symbol>\n <symbol id="i-alert" viewBox="0 0 24 24"><path d="M12 8.4v5"/><circle cx="12" cy="17.1" r="1.15" fill="currentColor" stroke="none"/><path d="M12 3.4 22 20.4H2Z"/></symbol>\n <symbol id="i-drop" viewBox="0 0 24 24"><path d="M12 3s6 6.7 6 10.6A6 6 0 0 1 6 13.6C6 9.7 12 3 12 3Z"/></symbol>\n <symbol id="i-send" viewBox="0 0 24 24"><path d="M21.5 2.5 11 13"/><path d="M21.5 2.5 15 21.5 11 13 2.5 9Z"/></symbol>\n <symbol id="i-cal" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="16" rx="2.4"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/></symbol>\n <symbol id="i-gauge" viewBox="0 0 24 24"><path d="M4 18a9 9 0 1 1 16 0"/><path d="M12 18l4.2-5.2"/><circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none"/></symbol>\n</svg>');

/* Backdrop plates: a defocused frame from the film behind every panel. */
for (const p of document.querySelectorAll('.panel[data-plate]')) {
  p.style.backgroundImage = `url(../plates/${p.dataset.plate}.jpg)`;
}

/* Odometers. Each digit becomes a column of 0-9 twice over; the column is then
   rolled down to land on its digit, so the figure counts itself up instead of
   simply appearing. Separators and the currency mark stay fixed. */
for (const el of document.querySelectorAll('.odo[data-n]')) {
  const prefix = el.textContent.trim();
  el.textContent = '';
  if (prefix) { const f = document.createElement('span'); f.className = 'fix'; f.textContent = prefix; el.appendChild(f); }
  [...el.dataset.n].forEach((ch, i) => {
    if (!/[0-9]/.test(ch)) {
      const f = document.createElement('span'); f.className = 'fix'; f.textContent = ch; el.appendChild(f); return;
    }
    const col = document.createElement('span');
    col.className = 'col';
    col.style.setProperty('--d', ch);
    col.style.animationDelay = (-(0.05 + i * 0.09)).toFixed(2) + 's';
    for (let r = 0; r < 2; r++) for (let d = 0; d <= 9; d++) {
      const s = document.createElement('span'); s.textContent = d; col.appendChild(s);
    }
    el.appendChild(col);
  });
}

/* The reach grid: dots fly in from the edges and settle, rather than fading up
   in place — arrival, not a switch being thrown. */
const g = document.getElementById('dotgrid');
if (g) {
  for (let i = 0; i < 112; i++) {
    const col = i % 14, row = Math.floor(i / 14);
    const d = document.createElement('i');
    d.className = 'anim a-scatter';
    d.style.setProperty('--sx', ((col - 6.5) * 26).toFixed(0) + 'px');
    d.style.setProperty('--sy', ((row - 3.5) * 34 - 70).toFixed(0) + 'px');
    d.style.animationDelay = (-(0.1 + col * 0.035 + row * 0.05)).toFixed(2) + 's';
    g.appendChild(d);
  }
}
