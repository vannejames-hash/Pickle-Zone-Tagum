// Court explorer + booking flow. Reads everything from #venue-data; no venue facts in here.
const D = JSON.parse(document.getElementById('venue-data').textContent);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pad2 = (n) => String(n).padStart(2, '0');
const cur = D.rates.currency;
const money = (n) => `${cur}${Number(n).toLocaleString('en-PH')}`;
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

/* ---------- time ---------- */
const OPEN = D.venue.hours.open;
const CLOSE = D.venue.hours.close; // 26 = 2 AM next day
const toD = (iso) => new Date(iso + 'T00:00:00Z');
const addDays = (iso, n) => { const d = toD(iso); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const fmt = (iso, o) => toD(iso).toLocaleDateString('en-PH', { timeZone: 'UTC', ...o });
function manilaNow() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: D.venue.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const g = (t) => p.find((x) => x.type === t).value;
  return { date: `${g('year')}-${g('month')}-${g('day')}`, hour: +g('hour'), min: +g('minute') };
}
// The venue's day runs 8 AM to 2 AM, so 12:30 AM still belongs to yesterday's schedule.
function venueNow() {
  const n = manilaNow();
  if (n.hour < CLOSE - 24) return { date: addDays(n.date, -1), hour: n.hour + 24, min: n.min };
  return n;
}
const NOW = venueNow();
function clock(h, { short = false } = {}) {
  const hh = ((h % 24) + 24) % 24;
  const ap = hh < 12 ? 'AM' : 'PM';
  const d = hh % 12 === 0 ? 12 : hh % 12;
  return short ? `${d} ${ap}` : `${d}:00 ${ap}`;
}
function span(h, d) {
  const [an, ap] = clock(h, { short: true }).split(' ');
  const [bn, bp] = clock(h + d, { short: true }).split(' ');
  return ap === bp ? `${an}–${bn} ${bp}` : `${an} ${ap} – ${bn} ${bp}`;
}
const isOpenNow = () => { const n = manilaNow(); const h = n.hour < CLOSE - 24 ? n.hour + 24 : n.hour; return h >= OPEN && h < CLOSE; };

/* ---------- rates ---------- */
const bandOf = (h) => D.rates.bands.find((b) => h >= b.from && h < b.to);
const rateAt = (court, h) => D.rates.table[court.tier][bandOf(h).id];
const courtPrice = (court, h, d) => { let t = 0; for (let i = 0; i < d; i++) t += rateAt(court, h + i); return t; };
const feeFor = (d, mode) => (D.rates.serviceFee.modes.includes(mode) ? D.rates.serviceFee.perCourtHour * d : 0);

/* ---------- availability (simulated) ---------- */
const COURTS = D.courts;
const byId = Object.fromEntries(COURTS.map((c) => [c.id, c]));
const HOURS = Array.from({ length: CLOSE - OPEN }, (_, i) => OPEN + i);
const mine = new Map(Object.entries(store.get('pz-mine') || {}));
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
function status(court, date, h) {
  if (court.from && date < court.from) return 'soon';
  if (date < NOW.date || (date === NOW.date && h <= NOW.hour)) return 'past';
  const k = `${court.id}|${date}|${h}`;
  if (mine.has(k)) return mine.get(k);
  const dow = toD(date).getUTCDay();
  let load = (D.booking.demoLoad[h] ?? 0.2) + (dow === 5 || dow === 6 ? D.booking.weekendBoost : 0);
  if (court.tier === 'premium') load -= 0.12;
  return hash(`${date}|${court.id}|${h}`) < load ? 'booked' : 'open';
}
const inPeriod = (h, p) => p === 'all' || bandOf(h).id === p;
function openSlots(court, date, p = 'all') { return HOURS.filter((h) => inPeriod(h, p) && status(court, date, h) === 'open'); }
function courtState(court, date, p) {
  if (court.from && date < court.from) return { state: 'soon', label: `From ${fmt(court.from, { month: 'short', day: 'numeric' })}` };
  const n = openSlots(court, date, p).length;
  if (n === 0) return { state: 'full', label: date === NOW.date && HOURS.every((h) => h <= NOW.hour || !inPeriod(h, p)) ? 'Done today' : 'Full' };
  return { state: n <= 2 ? 'few' : 'open', label: n <= 2 ? `${n} left` : `${n} open` };
}
const maxDur = (court, date, h) => { let d = 0; while (d < 3 && h + d < CLOSE && status(court, date, h + d) === 'open') d++; return d; };

/* ---------- state ---------- */
const S = { date: NOW.date, period: 'all', court: null, hour: null, dur: 1, mode: store.get('pz-mode') || D.booking.mode, view: matchMedia('(max-width: 599px)').matches ? 'list' : 'plan' };
const DATES = Array.from({ length: D.booking.daysAhead }, (_, i) => addDays(NOW.date, i));

/* ---------- motion helpers ---------- */
const EASE_OUT = 'cubic-bezier(.2,.8,.2,1)';
function replay(el, cls) { if (!el || reduce) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
// A ball's flight: x moves steadily, y rises and falls — sampled from a quadratic curve.
function arcFrames(x0, y0, x1, y1, lift, n = 18) {
  const cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - lift;
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    const x = u * u * x0 + 2 * u * t * cx + t * t * x1;
    const y = u * u * y0 + 2 * u * t * cy + t * t * y1;
    return { transform: `translate(${x}px, ${y}px)`, offset: t };
  });
}
function setRoll(el, text) {
  if (!el || el.dataset.v === text) return;
  el.dataset.v = text;
  el.innerHTML = `<span class="roll">${esc(text)}</span>`;
}

/* ---------- dates ---------- */
const track = $('[data-date-track]');
function renderDates() {
  track.innerHTML = DATES.map((d, i) => {
    const day = toD(d).getUTCDate();
    const top = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : fmt(d, { weekday: 'short' });
    const month = day === 1 || i === 0 ? `<span class="dt__m">${fmt(d, { month: 'short' })}</span>` : '';
    const prem = COURTS.some((c) => c.from === d) ? '<span class="dt__flag">Premium</span>' : '';
    return `<button type="button" class="dt" data-date="${d}" aria-pressed="${d === S.date}" aria-label="${fmt(d, { weekday: 'long', month: 'long', day: 'numeric' })}">${month}<span class="dt__w">${top}</span><span class="dt__d">${day}</span>${prem}</button>`;
  }).join('');
}
track.addEventListener('click', (e) => { const b = e.target.closest('[data-date]'); if (b) setDate(b.dataset.date); });
$$('[data-dates]').forEach((b) => b.addEventListener('click', () => track.scrollBy({ left: Number(b.dataset.dates) * track.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' })));
function setDate(d, { keep = false } = {}) {
  S.date = d;
  if (!keep) { S.hour = null; S.dur = 1; }
  $$('.dt', track).forEach((b) => b.setAttribute('aria-pressed', b.dataset.date === d));
  const on = $(`.dt[data-date="${d}"]`, track);
  on?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  renderAll();
  replay($('.slots'), 'swap');
}

/* ---------- period ---------- */
$('[data-period]').addEventListener('click', (e) => {
  const b = e.target.closest('[data-p]'); if (!b) return;
  S.period = b.dataset.p;
  $$('[data-p]').forEach((x) => x.setAttribute('aria-checked', x === b));
  if (S.hour !== null && !inPeriod(S.hour, S.period)) S.hour = null;
  renderAll();
  replay($('.slots'), 'swap');
});

/* ---------- courts ---------- */
const plan = $('[data-plan]');
const ballmark = $('.ballmark');
function renderCourts() {
  $$('.court').forEach((b) => {
    const c = byId[b.dataset.court];
    const st = courtState(c, S.date, S.period);
    b.dataset.state = st.state;
    $('[data-state-label]', b).textContent = st.label;
    b.setAttribute('aria-pressed', S.court === c.id);
  });
  document.querySelector('.explore').classList.toggle('has-sel', !!S.court);
  renderList();
  renderLadder();
}
function renderList() {
  const list = $('[data-courtlist]');
  list.innerHTML = COURTS.map((c) => {
    const st = courtState(c, S.date, S.period);
    const next = openSlots(c, S.date, S.period)[0];
    return `<li><button type="button" class="crow" data-court-pick="${c.id}" data-state="${st.state}" aria-pressed="${S.court === c.id}">
      <span class="crow__art">${courtArtMini()}<span class="crow__num">${pad2(c.number)}</span></span>
      <span class="crow__t"><b>Court ${c.number}</b><span>${esc(D.tiers[c.tier].label)} · ${esc(D.settings[c.setting].label)}</span></span>
      <span class="crow__n"><b>${esc(st.label)}</b>${next !== undefined ? `<span>Next ${clock(next, { short: true })}</span>` : ''}</span>
    </button></li>`;
  }).join('') + (S.court ? `<li class="crow__all"><button type="button" class="btn btn--ghost btn--full" data-all-courts>Show all ${COURTS.length} courts</button></li>` : '');
}
function renderLadder() {
  const ranked = COURTS.map((c) => ({ c, n: openSlots(c, S.date, S.period), st: courtState(c, S.date, S.period) }))
    .filter((x) => x.n.length).sort((a, b) => a.n[0] - b.n[0] || b.n.length - a.n.length).slice(0, 3);
  $('[data-ladder]').innerHTML = ranked.length
    ? ranked.map(({ c, n }) => `<li><button type="button" class="lad" data-court-pick="${c.id}"><span class="sb">Court ${pad2(c.number)}</span><b>${clock(n[0])}</b><span>${money(rateAt(c, n[0]))}/hr</span></button></li>`).join('')
    : `<li class="lad lad--none">No open courts in this window. Try another day or time.</li>`;
  $('[data-ladder-k]').hidden = !ranked.length;
}
function pickCourt(id, { from } = {}) {
  const prev = S.court;
  S.court = id; S.hour = null; S.dur = 1;
  const c = byId[id];
  if (from?.hour !== undefined) S.hour = from.hour;
  renderAll();
  const btn = $(`.court[data-court="${id}"]`);
  flyBall(prev, btn);
  replay($('[data-panel-court]'), 'enter');
  if (matchMedia('(max-width: 959px)').matches && !from?.noScroll) {
    $('[data-panel]').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  return c;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('.court, [data-court-pick]');
  if (!b) return;
  const id = b.dataset.court || b.dataset.courtPick;
  if (S.court === id && b.classList.contains('court')) { closeCourt(); return; }
  pickCourt(id);
});
function closeCourt() { S.court = null; S.hour = null; renderAll(); }
$('[data-pc-close]').addEventListener('click', closeCourt);
$('[data-courtlist]').addEventListener('click', (e) => { if (e.target.closest('[data-all-courts]')) closeCourt(); });

// The ball hops to the court you picked.
function flyBall(prevId, btn) {
  if (!btn || !ballmark || S.view !== 'plan') return;
  const pr = plan.getBoundingClientRect();
  const r = btn.getBoundingClientRect();
  const inPlan = btn.classList.contains('court--placed');
  const host = inPlan ? plan : btn.parentElement.parentElement;
  const hr = host.getBoundingClientRect();
  if (ballmark.parentElement !== host) host.appendChild(ballmark);
  const x1 = r.left - hr.left + r.width * 0.77, y1 = r.top - hr.top + r.height * 0.5;
  const last = ballmark._pos;
  ballmark.classList.add('on');
  if (reduce || !last || last.host !== host) {
    ballmark.style.transform = `translate(${x1}px, ${y1}px)`;
    ballmark._pos = { x: x1, y: y1, host };
    if (!reduce) ballmark.animate([{ transform: `translate(${x1}px, ${y1 - 40}px)`, opacity: 0 }, { transform: `translate(${x1}px, ${y1}px)`, opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.5,0,.75,0)' });
    return;
  }
  const dist = Math.hypot(x1 - last.x, y1 - last.y);
  ballmark.animate(arcFrames(last.x, last.y, x1, y1, Math.min(160, 40 + dist * 0.35)), { duration: 380 + Math.min(260, dist * 0.4), easing: 'linear', fill: 'forwards' })
    .finished.then(() => { ballmark.style.transform = `translate(${x1}px, ${y1}px)`; }).catch(() => {});
  ballmark._pos = { x: x1, y: y1, host };
  void pr;
}

/* ---------- view toggle ---------- */
$('.viewtoggle').addEventListener('click', (e) => {
  const b = e.target.closest('[data-view]'); if (!b) return;
  setView(b.dataset.view);
});
function setView(v) {
  S.view = v;
  $$('.viewtoggle [data-view]').forEach((x) => x.setAttribute('aria-checked', x.dataset.view === v));
  $('[data-plan]').hidden = v !== 'plan';
  $('.premium').hidden = v !== 'plan';
  $('[data-courtlist]').hidden = v !== 'list';
}

/* ---------- court panel ---------- */
function photoFor(c) {
  const img = D.images[c.photo];
  if (!img) return '<div class="pc__ph"><span class="mono">Photo to come</span></div>';
  const set = img.widths.map((w) => `img/${img.src}-${w}.webp ${w}w`).join(', ');
  return `<img src="img/${img.src}-${img.widths[0]}.webp" srcset="${set}" sizes="(min-width: 960px) 420px, 100vw" width="${img.w}" height="${img.h}" alt="${esc(img.alt)}" loading="lazy">`;
}
function renderPanel() {
  const empty = $('[data-panel-empty]'), box = $('[data-panel-court]');
  if (!S.court) { empty.hidden = false; box.hidden = true; return; }
  empty.hidden = true; box.hidden = false;
  const c = byId[S.court];
  $('[data-pc-num]').textContent = pad2(c.number);
  $('[data-pc-meta]').textContent = `${D.tiers[c.tier].label} · ${D.settings[c.setting].label}`;
  const ph = $('[data-pc-photo]');
  if (ph.dataset.c !== c.id) { ph.dataset.c = c.id; ph.innerHTML = photoFor(c); }
  const open = openSlots(c, S.date, S.period).length;
  $('[data-pc-date]').textContent = `${fmt(S.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${open ? `${open} open` : 'no open slots'}`;

  const notice = $('[data-pc-notice]');
  const soon = c.from && S.date < c.from;
  notice.hidden = !soon;
  if (soon) notice.innerHTML = `<p>Premium courts take bookings from <b>${fmt(c.from, { weekday: 'short', month: 'short', day: 'numeric' })}</b>.</p><button type="button" class="btn btn--line" data-jump="${c.from}">Jump to ${fmt(c.from, { month: 'short', day: 'numeric' })}</button>`;

  const slots = $('[data-slots]');
  const hours = HOURS.filter((h) => inPeriod(h, S.period));
  const past = hours.filter((h) => status(c, S.date, h) === 'past').length;
  const shown = soon ? [] : hours.filter((h) => status(c, S.date, h) !== 'past');
  slots.innerHTML = (past && !soon ? `<li class="slots__past mono">${past === hours.length ? 'This window has passed today' : 'Earlier times have passed'}</li>` : '') +
    shown.map((h, i) => {
      const st = status(c, S.date, h);
      const sel = S.hour !== null && h >= S.hour && h < S.hour + S.dur;
      const word = { open: 'Open', booked: 'Booked', mine: 'Yours', pending: 'Requested' }[st];
      const late = h >= 24 ? '<span class="slot__late">after midnight</span>' : '';
      return `<li style="--i:${i}"><button type="button" class="slot slot--${st}${sel ? ' is-sel' : ''}${sel && h === S.hour ? ' is-start' : ''}" data-hour="${h}" ${st === 'open' ? '' : 'disabled'} aria-pressed="${sel}">
        <span class="slot__t">${clock(h)}${late}</span><span class="slot__p">${money(rateAt(c, h))}</span><span class="slot__s">${word}</span></button></li>`;
    }).join('');

  const md = S.hour !== null ? maxDur(c, S.date, S.hour) : 0;
  $$('[data-dur]').forEach((b) => {
    const d = Number(b.dataset.dur);
    b.disabled = S.hour !== null && d > md;
    b.setAttribute('aria-checked', d === S.dur);
  });
  $('[data-dur-wrap]').classList.toggle('is-off', S.hour === null);

  const cont = $('[data-continue]');
  if (S.hour === null) {
    $('[data-sum-line]').textContent = soon ? 'Pick a December date' : 'Pick a start time';
    setRoll($('[data-total]'), '—');
    cont.disabled = true; cont.textContent = 'Pick a time';
  } else {
    const total = courtPrice(c, S.hour, S.dur);
    $('[data-sum-line]').textContent = `${S.dur * 60} min · ${span(S.hour, S.dur)}`;
    setRoll($('[data-total]'), money(total));
    cont.disabled = false;
    cont.innerHTML = `${S.mode === 'B' ? 'Request' : 'Book'} ${clock(S.hour)} <svg class="arr" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5"/></svg>`;
  }
}
$('[data-slots]').addEventListener('click', (e) => {
  const b = e.target.closest('[data-hour]'); if (!b || b.disabled) return;
  const h = Number(b.dataset.hour);
  S.hour = S.hour === h ? null : h;
  if (S.hour !== null) S.dur = Math.min(S.dur, maxDur(byId[S.court], S.date, h)) || 1;
  renderPanel(); renderBar();
  if (S.hour !== null) replay($('.pc__total'), 'pulse');
});
$('[data-dur-wrap]').addEventListener('click', (e) => {
  const b = e.target.closest('[data-dur]'); if (!b || b.disabled) return;
  S.dur = Number(b.dataset.dur); renderPanel(); renderBar();
});
$('[data-panel]').addEventListener('click', (e) => { const j = e.target.closest('[data-jump]'); if (j) setDate(j.dataset.jump, { keep: true }); });
$('[data-continue]').addEventListener('click', () => openBooking());

/* ---------- action bar (phones) ---------- */
function renderBar() {
  const sum = $('[data-ab-sum]'), btn = $('[data-ab-btn]');
  if (S.court && S.hour !== null) {
    const c = byId[S.court];
    sum.innerHTML = `<span class="sb">Court ${pad2(c.number)} · ${fmt(S.date, { weekday: 'short' })} ${toD(S.date).getUTCDate()} · ${span(S.hour, S.dur)}</span><b>${money(courtPrice(c, S.hour, S.dur))}</b>`;
    btn.textContent = S.mode === 'B' ? 'Request' : 'Book now';
    btn.dataset.ready = '1';
  } else {
    sum.innerHTML = `<span class="sb">From ${money(Math.min(...Object.values(D.rates.table.standard)))} / hr</span><b>${S.court ? `Court ${pad2(byId[S.court].number)}: pick a time` : 'Open till 2 AM'}</b>`;
    btn.textContent = 'Book a court';
    delete btn.dataset.ready;
  }
}
$('[data-ab-btn]').addEventListener('click', (e) => { if (e.currentTarget.dataset.ready) { e.preventDefault(); openBooking(); } });

/* ---------- next open court (hero, final) ---------- */
function nextOpen() {
  for (let i = 0; i < 3; i++) {
    const d = addDays(NOW.date, i);
    let best = null;
    for (const c of COURTS) {
      const s = openSlots(c, d)[0];
      if (s !== undefined && (!best || s < best.h)) best = { c, h: s, d };
    }
    if (best) return best;
  }
  return null;
}
function renderNext() {
  const n = nextOpen();
  if (!n) return;
  const day = n.d === NOW.date ? 'Today' : n.d === addDays(NOW.date, 1) ? 'Tomorrow' : fmt(n.d, { weekday: 'long' });
  $('[data-next-day]').textContent = day;
  $('[data-next-court]').textContent = `Court ${pad2(n.c.number)}`;
  $('[data-next-time]').textContent = clock(n.h);
  $('[data-next-price]').textContent = `${money(rateAt(n.c, n.h))} / hr`;
  $('[data-final-next]').textContent = `Next open: Court ${n.c.number}, ${day.toLowerCase() === 'today' ? 'today' : day} at ${clock(n.h)}.`;
  $$('[data-next]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    setView('plan');
    if (S.date !== n.d) setDate(n.d);
    goBook();
    setTimeout(() => pickCourt(n.c.id, { from: { hour: n.h, noScroll: true } }), reduce ? 0 : 450);
  }));
}
function goBook() { $('#book').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
$$('[data-go-book]').forEach((a) => a.addEventListener('click', (e) => { if (a.hasAttribute('data-next') || a.dataset.ready) return; e.preventDefault(); goBook(); }));
$$('[data-go-plan]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); setView('plan'); goBook(); }));

function renderOpenState() {
  const el = $('[data-openstate]'); if (!el) return;
  el.textContent = isOpenNow() ? 'Open now' : 'Closed now · opens 8 AM';
  el.dataset.open = isOpenNow();
}

/* ---------- mode switch ---------- */
function setMode(m) {
  S.mode = m; store.set('pz-mode', m);
  document.body.dataset.mode = m;
  $$('[data-mode]').forEach((b) => b.setAttribute('aria-checked', b.dataset.mode === m));
  renderPanel(); renderBar();
}
$$('.modes__btn').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

function renderAll() { renderCourts(); renderPanel(); renderBar(); }

/* ---------- sheet (booking, join, group, event) ---------- */
const sheet = $('[data-sheet]');
const body = $('[data-sheet-body]');
let flow = null;
function setSteps(names, at) {
  $('[data-steps]').innerHTML = names.map((n, i) => `<li class="${i < at ? 'done' : i === at ? 'now' : ''}"${i === at ? ' aria-current="step"' : ''}><span class="mono">${pad2(i + 1)}</span>${esc(n)}</li>`).join('');
}
function openSheet() {
  if (!sheet.open) { sheet.showModal(); document.documentElement.classList.add('lock'); }
  replay(sheet, 'opening');
}
function closeSheet() {
  if (!sheet.open) return;
  if (reduce) { sheet.close(); return; }
  sheet.classList.add('closing');
  setTimeout(() => { sheet.classList.remove('closing'); sheet.close(); }, 200);
}
sheet.addEventListener('close', () => { document.documentElement.classList.remove('lock'); flow = null; });
$('[data-sheet-close]').addEventListener('click', closeSheet);
sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
sheet.addEventListener('cancel', (e) => { e.preventDefault(); closeSheet(); });

function ticket(b, { status: st, fee = true } = {}) {
  const c = byId[b.court];
  return `<div class="ticket${st ? ` ticket--${st}` : ''}">
    <div class="ticket__court">${courtArtMini()}<p><span class="mono">Court</span><b>${pad2(c.number)}</b></p></div>
    <dl class="ticket__facts">
      <div><dt>Date</dt><dd>${fmt(b.date, { weekday: 'short', month: 'short', day: 'numeric' })}</dd></div>
      <div><dt>Time</dt><dd>${span(b.hour, b.dur)}${b.hour >= 24 ? `<small class="late">early ${fmt(addDays(b.date, 1), { weekday: 'short' })}</small>` : ''}</dd></div>
      <div><dt>Court</dt><dd>${esc(D.tiers[c.tier].label)} · ${esc(D.settings[c.setting].label)}</dd></div>
      ${fee ? `<div><dt>Court fee</dt><dd>${money(courtPrice(c, b.hour, b.dur))}</dd></div>` : ''}
    </dl>
  </div>`;
}
function courtArtMini() {
  return '<svg class="mini" viewBox="0 0 250 160" aria-hidden="true"><rect class="c-turf" width="250" height="160" rx="3"/><rect class="c-play" x="25" y="30" width="200" height="100"/><rect class="c-kitchen" x="93" y="30" width="64" height="100"/><path class="c-line" d="M25 30h200v100H25zM93 30v100M157 30v100M25 80h68M157 80h68"/><path class="c-net" d="M125 22v116"/></svg>';
}
const field = (id, label, { type = 'text', req = true, auto = '', mode = '', hint = '', ph = '' } = {}) => `
  <div class="fld"><label for="${id}">${esc(label)}${req ? '' : ' <span>optional</span>'}</label>
  <input id="${id}" name="${id}" type="${type}"${req ? ' required' : ''}${auto ? ` autocomplete="${auto}"` : ''}${mode ? ` inputmode="${mode}"` : ''}${ph ? ` placeholder="${esc(ph)}"` : ''} aria-describedby="${id}-err">
  ${hint ? `<p class="fld__hint">${esc(hint)}</p>` : ''}<p class="fld__err" id="${id}-err" aria-live="polite"></p></div>`;
const contactFields = (p) => field(`${p}-name`, 'Name', { auto: 'name' }) + field(`${p}-mobile`, 'Mobile number', { type: 'tel', auto: 'tel', mode: 'tel', ph: '09XX XXX XXXX' });
function validate(form) {
  let ok = true;
  $$('input[required], select[required]', form).forEach((i) => {
    const err = $(`#${i.id}-err`);
    let msg = '';
    const v = i.value.trim();
    if (!v) msg = i.type === 'tel' ? 'Add a mobile number so the venue can reach you.' : i.id === 'ev-team' ? 'Add a team name.' : /name$/.test(i.id) ? 'Add your name.' : 'Fill this in.';
    else if (i.type === 'tel' && !/^(09|\+?639)\d{9}$/.test(v.replace(/[\s-]/g, ''))) msg = 'Use a PH mobile number, like 0917 123 4567.';
    if (err) err.textContent = msg;
    i.setAttribute('aria-invalid', !!msg);
    if (msg && ok) { i.focus(); ok = false; }
  });
  return ok;
}
const refCode = (b) => `${D.booking.refPrefix}-${b.date.slice(5).replace('-', '')}-${pad2(byId[b.court].number)}${pad2(b.hour % 24)}`;

function openBooking() {
  if (!S.court || S.hour === null) return;
  flow = { kind: 'court', b: { court: S.court, date: S.date, hour: S.hour, dur: S.dur }, mode: S.mode };
  const names = { A: ['Review', D.booking.platform.name], B: ['Your details', 'Request sent'], C: ['Your details', 'Deposit', 'Confirmed'] }[S.mode];
  flow.names = names;
  if (S.mode === 'A') stepReview(); else stepDetails();
  openSheet();
}
function stepReview() {
  const { b } = flow; const c = byId[b.court];
  const fee = feeFor(b.dur, 'A'), base = courtPrice(c, b.hour, b.dur);
  setSteps(flow.names, 0);
  body.innerHTML = `<h2 id="sheet-title" class="sheet__title">Check your court.</h2>${ticket(b, { fee: false })}
    <dl class="bill"><div><dt>Court fee</dt><dd>${money(base)}</dd></div><div><dt>${esc(D.rates.serviceFee.label)}</dt><dd>${money(fee)}</dd></div><div class="bill__t"><dt>Total on ${esc(D.booking.platform.name)}</dt><dd>${money(base + fee)}</dd></div></dl>
    <p class="note">You'll finish on ${esc(D.booking.platform.name)}, where ${esc(D.venue.name)} takes its bookings, and pay with ${esc(D.booking.platform.payment.replace(D.booking.platform.name + ' ', ''))}. Choose Court ${c.number} at ${clock(b.hour)} there.</p>
    <a class="btn btn--primary btn--lg btn--full" href="${esc(D.booking.platform.url)}" target="_blank" rel="noopener" data-handoff>Continue on ${esc(D.booking.platform.name)} <svg class="arr" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5"/></svg></a>`;
  $('[data-handoff]', body).addEventListener('click', () => { setSteps(flow.names, 1); });
}
function stepDetails() {
  const { b } = flow; const c = byId[b.court];
  setSteps(flow.names, 0);
  const sum = courtPrice(c, b.hour, b.dur);
  body.innerHTML = `<h2 id="sheet-title" class="sheet__title">${flow.mode === 'B' ? 'Request this court.' : 'Lock in your court.'}</h2>${ticket(b)}
    <form class="form" novalidate data-form>
      ${contactFields('bk')}
      ${field('bk-email', 'Email', { type: 'email', req: false, auto: 'email', hint: 'For the receipt.' })}
      <button class="btn btn--primary btn--lg btn--full" type="submit">${flow.mode === 'B' ? `Send request · ${money(sum)}` : 'Continue to deposit'}</button>
      <p class="note">No account needed. ${flow.mode === 'B' ? `${esc(D.venue.name)} confirms by text or call.` : ''}</p>
    </form>`;
  const f = $('[data-form]', body);
  setTimeout(() => $('input', f)?.focus(), reduce ? 0 : 260);
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate(f)) return;
    flow.who = { name: f['bk-name'].value.trim(), mobile: f['bk-mobile'].value.trim() };
    if (flow.mode === 'B') { hold('pending'); stepDone('pending'); } else stepPay();
  });
}
function stepPay() {
  const { b } = flow; const c = byId[b.court];
  const total = courtPrice(c, b.hour, b.dur);
  const dep = Math.round((total * D.booking.deposit.percent) / 100);
  setSteps(flow.names, 1);
  body.innerHTML = `<h2 id="sheet-title" class="sheet__title">Hold it with a deposit.</h2>
    <p class="sumline mono">Court ${pad2(c.number)} · ${fmt(b.date, { weekday: 'short', month: 'short', day: 'numeric' })} · ${span(b.hour, b.dur)}</p>
    <fieldset class="paychoice"><legend class="sr">How much to pay now</legend>
      <label class="pay"><input type="radio" name="pay" value="${dep}" checked><span><b>Deposit · ${D.booking.deposit.percent}%</b><span>${money(dep)} now, ${money(total - dep)} later</span></span><span class="pay__amt">${money(dep)}</span></label>
      <label class="pay"><input type="radio" name="pay" value="${total}"><span><b>Pay in full</b><span>Nothing left to settle</span></span><span class="pay__amt">${money(total)}</span></label>
    </fieldset>
    <p class="demo-pay"><span class="pill pill--demo">Demo</span> This step shows where payment would sit. No card, wallet or money is involved.</p>
    <button class="btn btn--primary btn--lg btn--full" type="button" data-pay>Pay ${money(dep)} · demo</button>`;
  const btn = $('[data-pay]', body);
  $$('input[name=pay]', body).forEach((r) => r.addEventListener('change', () => { btn.textContent = `Pay ${money(Number(r.value))} · demo`; }));
  btn.addEventListener('click', () => {
    flow.paid = Number($('input[name=pay]:checked', body).value);
    flow.total = total;
    btn.disabled = true; btn.classList.add('is-busy'); btn.innerHTML = '<span class="spin" aria-hidden="true"></span> Confirming';
    setTimeout(() => { hold('mine'); stepDone('mine'); }, reduce ? 200 : 900);
  });
}
function hold(kind) {
  const { b } = flow;
  for (let i = 0; i < b.dur; i++) mine.set(`${b.court}|${b.date}|${b.hour + i}`, kind);
  store.set('pz-mine', Object.fromEntries(mine));
  if ($('[data-reset]')) $('[data-reset]').hidden = false;
  S.hour = null;
  renderAll();
}
function stepDone(kind) {
  const { b } = flow; const c = byId[b.court];
  setSteps(flow.names, flow.names.length - 1);
  const ref = refCode(b);
  const pending = kind === 'pending';
  body.innerHTML = `<div class="done${pending ? ' done--pending' : ''}">
    <div class="done__fig" data-tap="${pending ? 'ticket' : 'cheer'}">${$(`#fig-${pending ? 'ticket' : 'cheer'}`)?.innerHTML || ''}</div>
    <p class="done__k mono">${pending ? 'Request sent' : 'Booked'} · ${ref}</p>
    <h2 id="sheet-title" class="sheet__title">${pending ? `Sent. ${esc(D.venue.name)} will confirm.` : `You're on Court ${c.number}.`}</h2>
    ${ticket(b, { status: pending ? 'pending' : 'ok' })}
    <dl class="bill">${pending
      ? `<div><dt>Status</dt><dd>Waiting for the venue</dd></div><div><dt>Reply to</dt><dd>${esc(flow.who.mobile)}</dd></div>`
      : `<div><dt>Paid now</dt><dd>${money(flow.paid)}</dd></div><div><dt>Balance</dt><dd>${money(flow.total - flow.paid)}</dd></div>`}</dl>
    <div class="done__acts">
      <button type="button" class="btn btn--line" data-ics>Add to calendar</button>
      <a class="btn btn--line" href="${esc(D.venue.mapsUrl)}" target="_blank" rel="noopener">Get directions</a>
    </div>
    <button type="button" class="btn btn--primary btn--lg btn--full" data-sheet-done>Done</button>
    <p class="note">Demo: nothing was sent to ${esc(D.venue.name)}. ${pending ? 'On the live site the venue sees this request and replies.' : 'On the live site this booking would be held for you.'}</p>
  </div>`;
  if (!reduce) $('.done', body).animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: EASE_OUT });
  $('[data-ics]', body).addEventListener('click', () => downloadIcs(b, ref, pending));
  $('[data-sheet-done]', body).addEventListener('click', closeSheet);
}
function downloadIcs(b, ref, pending) {
  const c = byId[b.court];
  const at = (h) => { const d = h >= 24 ? addDays(b.date, 1) : b.date; return `${d.replace(/-/g, '')}T${pad2(h % 24)}0000`; };
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//courtside//demo//EN', 'BEGIN:VEVENT', `UID:${ref}@demo`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;TZID=${D.venue.timezone}:${at(b.hour)}`, `DTEND;TZID=${D.venue.timezone}:${at(b.hour + b.dur)}`,
    `SUMMARY:Pickleball · Court ${c.number}${pending ? ' (requested)' : ''}`, `LOCATION:${D.venue.name}, ${D.venue.address}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), download: `${ref}.ics` });
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Open play
$$('[data-join]').forEach((btn) => btn.addEventListener('click', () => {
  const s = D.openPlay.find((x) => x.id === btn.dataset.join);
  const full = s.taken >= s.spots;
  flow = { kind: 'play', names: [full ? 'Waitlist' : 'Your spot', 'Done'] };
  setSteps(flow.names, 0);
  body.innerHTML = `<h2 id="sheet-title" class="sheet__title">${full ? 'Get on the waitlist.' : 'Take a spot.'}</h2>
    <div class="ticket ticket--play"><p class="mono">${esc(s.day.toUpperCase())} · ${esc(s.court.toUpperCase())}</p><p class="ticket__big">${clock(s.start)}</p><p>${esc(s.level)} · ${money(s.fee)} a player · ${s.spots - s.taken} of ${s.spots} spots left</p></div>
    <form class="form" novalidate data-form>${contactFields('op')}
      <fieldset class="fld"><legend>Your level</legend><div class="seg seg--sm" role="radiogroup" aria-label="Your level">${['Beginner', 'Intermediate', 'Advanced'].map((l, i) => `<label class="seg__opt"><input type="radio" name="lvl" value="${l}"${i === 1 ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div></fieldset>
      <button class="btn btn--primary btn--lg btn--full" type="submit">${full ? 'Join the waitlist' : `Join · ${money(s.fee)}`}</button>
      <p class="note"><span class="pill pill--demo">Sample session</span> Nothing is sent.</p></form>`;
  openSheet();
  const f = $('[data-form]', body);
  f.addEventListener('submit', (e) => {
    e.preventDefault(); if (!validate(f)) return;
    setSteps(flow.names, 1);
    body.innerHTML = `<div class="done"><p class="done__k mono">${full ? 'Waitlist' : 'You’re in'}</p><h2 id="sheet-title" class="sheet__title">${full ? 'You’re next in line.' : 'See you on court.'}</h2><p>${esc(s.day)}, ${clock(s.start)} · ${esc(s.court)}. ${full ? 'If a spot opens, you get a text.' : 'Bring a paddle, or rent one at the desk.'}</p><button type="button" class="btn btn--primary btn--lg btn--full" data-sheet-done>Done</button><p class="note">Demo: a sample session, nothing was sent.</p></div>`;
    $('[data-sheet-done]', body).addEventListener('click', closeSheet);
  });
}));

// Group booking request
$('[data-group]')?.addEventListener('click', () => {
  flow = { kind: 'group', names: ['Your group', 'Sent'] };
  setSteps(flow.names, 0);
  const max = COURTS.length;
  body.innerHTML = `<h2 id="sheet-title" class="sheet__title">Plan a group booking.</h2>
    <form class="form" novalidate data-form>
      <div class="fld"><label for="gp-type">What's the occasion</label><select id="gp-type" required>${D.groups.map((g) => `<option>${esc(g)}</option>`).join('')}</select><p class="fld__err" id="gp-type-err"></p></div>
      <div class="row2">
        <div class="fld"><label for="gp-date">Date</label><input id="gp-date" type="date" required min="${NOW.date}" value="${addDays(NOW.date, 7)}"><p class="fld__err" id="gp-date-err"></p></div>
        <div class="fld"><label for="gp-courts">Courts</label><select id="gp-courts" required>${Array.from({ length: max - 1 }, (_, i) => `<option${i === 1 ? ' selected' : ''}>${i + 2}</option>`).join('')}</select><p class="fld__err" id="gp-courts-err"></p></div>
      </div>
      ${contactFields('gp')}
      <button class="btn btn--primary btn--lg btn--full" type="submit">Send to ${esc(D.venue.name)}</button>
      <p class="note">The venue replies with times and a price. Demo: nothing is sent.</p>
    </form>`;
  openSheet();
  const f = $('[data-form]', body);
  f.addEventListener('submit', (e) => {
    e.preventDefault(); if (!validate(f)) return;
    setSteps(flow.names, 1);
    body.innerHTML = `<div class="done done--pending"><p class="done__k mono">Request sent</p><h2 id="sheet-title" class="sheet__title">${esc(f['gp-courts'].value)} courts, ${fmt(f['gp-date'].value, { weekday: 'long', month: 'short', day: 'numeric' })}.</h2><p>${esc(D.venue.name)} replies to ${esc(f['gp-mobile'].value)} with times and a quote.</p><button type="button" class="btn btn--primary btn--lg btn--full" data-sheet-done>Done</button><p class="note">Demo: nothing was sent.</p></div>`;
    $('[data-sheet-done]', body).addEventListener('click', closeSheet);
  });
});

// Sample event
$$('[data-event]').forEach((btn) => btn.addEventListener('click', () => {
  const t = D.tournaments.find((x) => x.id === btn.dataset.event);
  flow = { kind: 'event', names: ['Event', 'Registered'] };
  setSteps(flow.names, 0);
  body.innerHTML = `<p class="mono sheet__k"><span class="pill pill--demo">Sample event</span></p><h2 id="sheet-title" class="sheet__title">${esc(t.name)}</h2>
    <dl class="bill"><div><dt>Format</dt><dd>${esc(t.format)}</dd></div><div><dt>Draw</dt><dd>${t.teams} teams</dd></div><div><dt>Status</dt><dd>${esc(t.status)}</dd></div><div><dt>Date</dt><dd>${esc(t.when)}</dd></div></dl>
    <form class="form" novalidate data-form>${field('ev-team', 'Team name')}${contactFields('ev')}
      <button class="btn btn--primary btn--lg btn--full" type="submit">Register a team</button><p class="note">An interface sample. ${esc(D.venue.name)} has no dated tournament listed.</p></form>`;
  openSheet();
  const f = $('[data-form]', body);
  f.addEventListener('submit', (e) => {
    e.preventDefault(); if (!validate(f)) return;
    setSteps(flow.names, 1);
    body.innerHTML = `<div class="done"><p class="done__k mono">Registered</p><h2 id="sheet-title" class="sheet__title">${esc(f['ev-team'].value)} is in the draw.</h2><button type="button" class="btn btn--primary btn--lg btn--full" data-sheet-done>Done</button><p class="note">Demo: a sample event, nothing was sent.</p></div>`;
    $('[data-sheet-done]', body).addEventListener('click', closeSheet);
  });
}));

/* ---------- hero entrance: lines draw, the ball arcs onto the court ---------- */
function heroBall() {
  const media = $('.hero__media'), ball = $('.hero__ball');
  if (!media || !ball) return;
  const r = media.getBoundingClientRect();
  const fig = $('.hero__fig')?.getBoundingClientRect(), card = $('.next')?.getBoundingClientRect();
  const x0 = fig ? fig.left - r.left + fig.width * 0.42 : r.width * 0.08, y0 = fig ? fig.top - r.top + fig.height * 0.1 : r.height * 0.7;
  const x1 = card ? card.left - r.left + card.width * 0.5 : r.width * 0.75, y1 = card ? card.bottom - r.top + 14 : r.height * 0.2;
  if (reduce) { ball.style.transform = `translate(${x1}px, ${y1}px)`; ball.style.opacity = 1; return; }
  const svg = $('.hero__arc');
  svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
  const cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - r.height * 0.32;
  const path = svg.querySelector('path');
  path.setAttribute('d', `M${x0} ${y0}Q${cx} ${cy} ${x1} ${y1}`);
  const len = path.getTotalLength();
  path.style.strokeDasharray = `2 9`;
  svg.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 760, delay: 900, easing: 'cubic-bezier(.3,.1,.3,1)', fill: 'backwards' });
  const frames = arcFrames(x0, y0, x1, y1, r.height * 0.32 - (y0 - Math.min(y0, y1)), 24).map((f) => ({ ...f, opacity: 1 }));
  frames[0].opacity = 0;
  replay($('.hero__fig .il'), 'tap');
  ball.animate(frames, { duration: 760, delay: 900, easing: 'cubic-bezier(.3,.1,.3,1)', fill: 'both' }).finished.then(() => {
    ball.style.transform = `translate(${x1}px, ${y1}px)`; ball.style.opacity = 1;
    ball.animate([{ transform: `translate(${x1}px, ${y1}px)` }, { transform: `translate(${x1 - 10}px, ${y1 - 18}px)` }, { transform: `translate(${x1 - 18}px, ${y1}px)` }], { duration: 360, easing: 'ease-in-out', fill: 'forwards' })
      .finished.then(() => { ball.style.transform = `translate(${x1 - 18}px, ${y1}px)`; }).catch(() => {});
  }).catch(() => {});
  void len;
}

/* ---------- explorer moment: courts light up once, in walking order ---------- */
function lightPlan() {
  const ex = $('.explorer');
  if (reduce || !('IntersectionObserver' in window)) { ex.classList.add('lit'); return; }
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { ex.classList.add('lit'); io.disconnect(); } }, { threshold: 0.25 });
  io.observe($('[data-plan]'));
}
function actionBar() {
  const bar = $('[data-actionbar]');
  const io = new IntersectionObserver(([e]) => bar.classList.toggle('show', !e.isIntersecting), { threshold: 0.15 });
  io.observe($('.hero__cta'));
}

// Tap a character or a glyph: one beat of its own action.
document.addEventListener('click', (e) => {
  const host = e.target.closest('[data-tap]');
  if (!host) return;
  const fig = host.querySelector('.il');
  if (fig) replay(fig, 'tap');
});


// Demo reset: clears bookings made on this device.
const reset = $('[data-reset]');
if (reset) {
  reset.hidden = !mine.size;
  reset.addEventListener('click', () => { mine.clear(); store.set('pz-mine', {}); reset.hidden = true; renderAll(); });
}

/* ---------- boot ---------- */
renderDates();
setView(S.view);
setMode(S.mode);
renderAll();
renderNext();
renderOpenState();
lightPlan();
actionBar();
document.documentElement.classList.add('ready');
if (document.fonts?.ready) document.fonts.ready.then(heroBall); else heroBall();
