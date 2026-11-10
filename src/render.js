// Renders one venue's page from its six config files. No venue facts live here.
import { figure, glyph, patternSvg, courtOverlay, corners, ballShape } from './brand.js';

export const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pad2 = (n) => String(n).padStart(2, '0');
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const word = (n, cap = false) => { const w = WORDS[n] ?? String(n); return cap ? w[0].toUpperCase() + w.slice(1) : w; };
const money = (n, cur = '₱') => `${cur}${Number(n).toLocaleString('en-PH')}`;
const dateLong = (iso, o = { month: 'short', day: 'numeric', year: 'numeric' }) => new Date(iso + 'T00:00:00').toLocaleDateString('en-PH', o);

export function clock(h, { short = false } = {}) {
  const hh = ((h % 24) + 24) % 24;
  const ap = hh < 12 ? 'AM' : 'PM';
  const d = hh % 12 === 0 ? 12 : hh % 12;
  if (hh === 12 && !short) return '12 NN';
  return short ? `${d} ${ap}` : `${d}:00 ${ap}`;
}

function picture(img, { sizes = '100vw', eager = false, cls = '' } = {}) {
  const set = img.widths.map((w) => `img/${img.src}-${w}.webp ${w}w`).join(', ');
  const mid = img.widths[Math.min(1, img.widths.length - 1)];
  return `<img class="${cls}" src="img/${img.src}-${mid}.webp" srcset="${set}" sizes="${sizes}" width="${img.w}" height="${img.h}" alt="${esc(img.alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
}

// A photograph in a court frame: corner marks, a baseline and kitchen line drawn over the lower edge.
function courtFrame(img, { sizes, eager = false, cls = '', lines = true } = {}) {
  return `<div class="cf ${cls}">${picture(img, { sizes, eager, cls: 'cf__img' })}${lines ? courtOverlay : ''}${corners}</div>`;
}

// One court, drawn to pickleball markings: surround, two service boxes a side, the kitchen, the net.
export function courtArt(n, { ring = true } = {}) {
  return `<svg class="court__art" viewBox="0 0 250 160" aria-hidden="true" focusable="false">
    <rect class="c-turf" x="0" y="0" width="250" height="160" rx="3"/>
    <rect class="c-play" x="25" y="30" width="200" height="100"/>
    <rect class="c-kitchen" x="93" y="30" width="64" height="100"/>
    <path class="c-line" pathLength="100" d="M25 30h200v100H25zM93 30v100M157 30v100M25 80h68M157 80h68"/>
    <path class="c-net" d="M125 22v116"/>
    <circle class="c-post" cx="125" cy="22" r="3.5"/><circle class="c-post" cx="125" cy="138" r="3.5"/>
    <text class="c-num" x="59" y="91" text-anchor="middle">${pad2(n)}</text>
    ${ring ? '<rect class="c-ring" x="4" y="4" width="242" height="152" rx="6" pathLength="100"/>' : ''}
  </svg>`;
}

function planSvg(plan) {
  const b = plan.buildings.map((x) => `
    <g class="p-bldg p-bldg--${x.id}">
      <rect x="${x.x}" y="${x.y}" width="${x.w}" height="${x.h}" rx="4"/>
      <text class="p-label" x="${x.x + 16}" y="${x.y + 26}">${esc(x.label.toUpperCase())}</text>
    </g>`).join('');
  const rooms = plan.rooms.map((r) => `
    <g class="p-room${r.key ? ' p-room--key' : ''}">
      <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="3"/>
      ${r.label.split(' ').map((w, i, a) => `<text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 5 + (i - (a.length - 1) / 2) * 17}" text-anchor="middle">${esc(w)}</text>`).join('')}
    </g>`).join('');
  const doors = plan.doors.map((d) => d.side === 'right'
    ? `<g class="p-door"><rect x="${d.x - 7}" y="${d.y}" width="10" height="44"/><text x="${d.x - 16}" y="${d.y + 27}" text-anchor="end">${esc(d.label)}</text></g>`
    : `<g class="p-door"><rect x="${d.x - 3}" y="${d.y}" width="10" height="44"/><text x="${d.x + 16}" y="${d.y + 27}">${esc(d.label)}</text></g>`).join('');
  const p = plan.parking;
  const stalls = Array.from({ length: 9 }, (_, i) => `<path d="M${p.x + 40 + i * 58} ${p.y + p.h - 20}v-70"/>`).join('');
  return `<svg class="plan__svg" viewBox="0 0 ${plan.w} ${plan.h}" aria-hidden="true" focusable="false">
    <g class="p-park">
      <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="4"/>
      ${stalls}
      <text class="p-big" x="${p.x + 24}" y="${p.y + 64}">${esc(p.label.toUpperCase())}</text>
      <path class="p-arrow" d="M${p.x + 300} ${p.y + 40}c60 0 90-20 90-52" />
    </g>
    ${b}${rooms}${doors}
    <path class="p-divider" d="M310 70v190"/>
  </svg>`;
}

function courtButton(c, plan, tiers, settings) {
  const pos = c.plan
    ? ` style="--x:${(c.plan.x / plan.w) * 100}%;--y:${(c.plan.y / plan.h) * 100}%;--w:${(250 / plan.w) * 100}%"`
    : '';
  return `<button type="button" class="court${c.plan ? ' court--placed' : ''}" data-court="${c.id}" aria-pressed="false"${pos}>
    ${courtArt(c.number)}
    <span class="court__tag"><span class="sr">Court ${c.number}, ${esc(tiers[c.tier].label)}, ${esc(settings[c.setting].label)}. </span><span class="court__state" data-state-label>…</span></span>
  </button>`;
}

// Open-play capacity as balls on a court: taken spots filled, open spots outlined.
function capacityCourt(spots, taken) {
  const cols = spots > 12 ? 8 : spots > 8 ? 6 : 4;
  const rows = Math.ceil(spots / cols);
  const w = 250, h = 160, x0 = 25, y0 = 30, cw = 200 / cols, rh = 100 / rows;
  const balls = Array.from({ length: spots }, (_, i) => {
    const cx = x0 + cw * (i % cols) + cw / 2, cy = y0 + rh * Math.floor(i / cols) + rh / 2;
    return `<circle class="cap__ball${i < taken ? ' on' : ''}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${Math.min(cw, rh) * 0.3}"/>`;
  }).join('');
  return `<svg class="cap" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false">
    <path class="cap__line" d="M25 30h200v100H25zM125 30v100"/>${balls}
  </svg>`;
}

const arrow = '<svg class="arr" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5"/></svg>';
const net = '<div class="net" aria-hidden="true"><i></i></div>';

export function renderPage(cfg) {
  const { venue, courts, rates, booking, events, theme } = cfg;
  const L = venue.location;
  const standard = courts.courts.filter((c) => c.tier === 'standard');
  const premium = courts.courts.filter((c) => c.tier === 'premium');
  const premiumFrom = new Date(premium[0]?.from + 'T00:00:00');
  const premiumMonth = premiumFrom.toLocaleDateString('en-PH', { month: 'long' });
  const premiumShort = premiumFrom.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  const lowRate = Math.min(...Object.values(rates.table).flatMap((t) => Object.values(t)));
  const c = theme.color;
  const kebab = (k) => k.replace(/[A-Z0-9]/g, (m) => '-' + m.toLowerCase());
  const vars = Object.entries(c).map(([k, v]) => `--${kebab(k)}:${v}`).join(';');
  const img = venue.images;
  const indoor = standard.filter((x) => x.setting === 'indoor');
  const covered = standard.filter((x) => x.setting === 'covered');
  const range = (xs) => (xs.length > 1 ? `${xs[0].number}–${xs.at(-1).number}` : String(xs[0]?.number ?? ''));
  const district = L.district.replace('Brgy. ', '');
  const openTill = clock(venue.hours.close, { short: true });
  const opensAt = clock(venue.hours.open, { short: true });

  const data = JSON.stringify({
    venue: { name: venue.fullName, hours: venue.hours, timezone: L.timezone, phone: venue.contact.phone, mapsUrl: L.mapsUrl, address: `${L.street}, ${L.district}, ${L.city}` },
    courts: courts.courts.map(({ id, number, tier, setting, from, photo, photoIsCourt }) => ({ id, number, tier, setting, from: from || null, photo: photo || null, photoIsCourt: !!photoIsCourt })),
    tiers: courts.tiers, settings: courts.settings, images: venue.images, rates, booking,
    openPlay: events.openPlay.sample, tournaments: events.tournaments.sample, groups: events.groups,
  }).replace(/</g, '\\u003c');

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'SportsActivityLocation', name: venue.fullName,
    telephone: venue.contact.phone.tel, address: { '@type': 'PostalAddress', streetAddress: L.street, addressLocality: `${L.district}, ${L.city}`, addressRegion: L.province, addressCountry: L.country },
    openingHours: 'Mo-Su 08:00-02:00', hasMap: L.mapsUrl, sameAs: venue.social.map((s) => s.url),
    priceRange: `${money(lowRate)}–${money(Math.max(...Object.values(rates.table.premium)))} per court-hour`,
  }).replace(/</g, '\\u003c');

  const modeNames = { A: 'Platform', B: 'Request', C: 'Full booking' };
  const modeSwitch = booking.demoModeSwitch ? `
    <div class="modes" role="radiogroup" aria-label="Demo booking mode">
      ${['A', 'B', 'C'].map((m) => `<button type="button" role="radio" class="modes__btn" data-mode="${m}" aria-checked="${m === booking.mode}"><b>${m}</b> ${modeNames[m]}</button>`).join('')}
    </div>` : '';

  const span = venue.hours.close - venue.hours.open;
  const pct = (h) => ((h - venue.hours.open) / span) * 100;
  const bandRows = (tier) => rates.bands.map((b) => `<li><span class="band__t"><b>${esc(b.label)}</b><span class="mono">${esc(b.range)}</span></span><span class="band__p">${money(rates.table[tier][b.id])}</span></li>`).join('');
  const bandBar = (tier) => `<div class="rbar" aria-hidden="true">${rates.bands.map((b) => `<span class="rbar__seg rbar__seg--${b.id}" style="--s:${pct(b.from)}%;--e:${pct(b.to)}%"><b>${money(rates.table[tier][b.id])}</b></span>`).join('')}</div>
    <div class="ticks" aria-hidden="true">${[venue.hours.open, ...rates.bands.map((b) => b.to)].map((h) => `<span style="--at:${pct(h)}%">${clock(h, { short: true }).replace('12 PM', '12 NN')}</span>`).join('')}</div>`;

  const playCards = events.openPlay.sample.map((s) => {
    const full = s.taken >= s.spots;
    return `<article class="play" data-session="${s.id}">
      <header class="play__head"><span class="sb">${esc(s.day)} <span class="play__sample">· sample</span></span><span class="play__lvl">${esc(s.level)}</span></header>
      <p class="play__time">${clock(s.start).replace(':00', '')}<span>–${clock(s.end).replace(':00', '')}</span></p>
      <p class="play__court sb">${esc(s.court)}</p>
      ${capacityCourt(s.spots, s.taken)}
      <p class="play__spots"><b>${s.spots - s.taken}</b> of ${s.spots} spots open${full ? ' · full' : ''}</p>
      <footer class="play__foot"><span class="play__fee">${money(s.fee)}<small>a player</small></span>
        <button type="button" class="btn ${full ? 'btn--ghost' : 'btn--primary'}" data-join="${s.id}">${full ? 'Join the waitlist' : 'Join open play'}</button></footer>
    </article>`;
  }).join('');

  const t = events.tournaments.sample[0];
  const groupGlyph = ['people', 'court', 'ball', 'trophy'];

  const ballMark = (r) => `<svg class="mark__ball" viewBox="0 0 48 48" aria-hidden="true">${ballShape(24, 24, 20)}</svg>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(venue.fullName)} · Book a pickleball court in ${esc(L.city)}</title>
<meta name="description" content="${esc(venue.pitch)} Open daily ${opensAt} to ${openTill} in ${esc(L.district)}. Pick a court and a time, then book.">
<meta name="theme-color" content="${c.paper}">
<meta property="og:title" content="${esc(venue.fullName)} · Play more. Book your court.">
<meta property="og:description" content="${esc(venue.pitch)}">
<meta property="og:image" content="img/share.jpg">
<meta name="robots" content="noindex">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='${c.ink}'/><circle cx='16' cy='16' r='9' fill='${c.ball}'/><circle cx='16' cy='11.5' r='1.4' fill='${c.ink}'/><circle cx='12' cy='14' r='1.4' fill='${c.ink}'/><circle cx='20' cy='14' r='1.4' fill='${c.ink}'/><circle cx='12' cy='18.5' r='1.4' fill='${c.ink}'/><circle cx='20' cy='18.5' r='1.4' fill='${c.ink}'/><circle cx='16' cy='21' r='1.4' fill='${c.ink}'/><circle cx='16' cy='16' r='1.4' fill='${c.ink}'/></svg>`)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${theme.font.href}">
<link rel="preload" as="image" href="img/${img.hallFront.src}-1000.webp" imagesrcset="${img.hallFront.widths.map((w) => `img/${img.hallFront.src}-${w}.webp ${w}w`).join(', ')}" imagesizes="(min-width: 960px) 56vw, 100vw">
<link rel="stylesheet" href="styles.css">
<style>:root{${vars};--f-display:'${theme.font.display}',system-ui,sans-serif;--f-text:'${theme.font.text}',system-ui,sans-serif;--f-mono:'${theme.font.mono}',ui-monospace,monospace;--pat-ink:${patternSvg(c.ink)};--pat-paper:${patternSvg(c.paper)};--pat-ball:${patternSvg(c.ball)}}</style>
<script type="application/ld+json">${jsonLd}</script>
</head>
<body data-mode="${booking.mode}">
<a class="skip" href="#book">Skip to booking</a>

<div class="demobar" role="note">
  <div class="wrap demobar__in">
    <p><span class="demobar__tag">Demo</span> A concept site for ${esc(venue.fullName)}.<span class="demobar__more"> Court availability is simulated; no booking or payment here is real.</span><span class="demobar__less"> Simulated availability, nothing is real.</span></p>
    ${modeSwitch}
  </div>
</div>

<header class="nav" id="top">
  <div class="wrap nav__in">
    <a class="mark" href="#top" aria-label="${esc(venue.fullName)}, back to top">${ballMark()}<span class="mark__name">${esc(venue.name)}</span><span class="mark__place">${esc(venue.place)}</span></a>
    <nav class="nav__links" aria-label="Sections">
      <a href="#book">Courts</a><a href="#rates">Rates</a><a href="#open-play">Open play</a><a href="#visit">Visit</a>
    </nav>
    <a class="btn btn--primary nav__cta" href="#book" data-go-book>Book a court</a>
  </div>
</header>

<main>
<section class="hero" aria-labelledby="hero-title">
  <div class="wrap hero__grid">
    <div class="hero__copy">
      <p class="hero__lockup" data-enter="1">${ballMark()}<span>${esc(venue.name)}</span><span class="hero__lockup-place">${esc(venue.place)}</span></p>
      <h1 id="hero-title" class="hero__title" data-enter="2"><span class="line">Play more.</span> <span class="line"><em>Book your court.</em></span></h1>
      <p class="hero__lede" data-enter="3">${word(standard.length, true)} indoor and covered courts in ${esc(district)}, open daily till ${openTill}. ${word(premium.length, true)} premium courts take ${esc(premiumMonth)} bookings. Pick a court, pick a time, play.</p>
      <div class="hero__cta" data-enter="4">
        <a class="btn btn--primary btn--lg" href="#book" data-go-book>Book a court ${arrow}</a>
        <a class="btn btn--line btn--lg" href="#book" data-go-plan>See the courts</a>
      </div>
      <ul class="facts-strip" data-enter="5" aria-label="At a glance">
        <li><b>${pad2(standard.length)}</b><span>courts now</span></li>
        <li><b>+${pad2(premium.length)}</b><span>from ${esc(premiumShort)}</span></li>
        <li><b>${money(lowRate)}</b><span>per hour, from</span></li>
        <li><b class="facts-strip__t">${opensAt.replace(' ', '')}–${openTill.replace(' ', '')}</b><span>every day</span></li>
      </ul>
    </div>
    <div class="hero__media" data-enter="media">
      ${courtFrame(img.hallFront, { sizes: '(min-width: 960px) 56vw, 100vw', eager: true, cls: 'cf--hero' })}
      <div class="hero__fig" data-tap="serve">${figure('serve', { size: 220, cls: 'il--hero' })}</div>
      <svg class="hero__arc" viewBox="0 0 600 260" aria-hidden="true"><path d="M10 250C150 -40 420 -40 590 200"/></svg>
      <span class="hero__ball" aria-hidden="true"></span>
      <a class="next" href="#book" data-next data-go-book>
        <span class="next__k sb">Next open · <span data-next-day>Today</span></span>
        <span class="next__row"><span class="next__court sb" data-next-court>Court —</span><span class="next__time" data-next-time>Checking…</span></span>
        <span class="next__foot"><span class="next__price" data-next-price></span><span class="next__go">Book it ${arrow}</span></span>
      </a>
    </div>
  </div>
</section>

<section class="explorer" id="book" aria-labelledby="book-title">
  ${net}
  <div class="wrap">
    <header class="sec-head">
      <h2 id="book-title" class="h2">Pick a court.<br>Pick a time. <em>Play.</em></h2>
      <p class="sec-head__aside"><span class="pill pill--demo">Demo availability</span> Slots are simulated for this demo. On the live site they come from the venue's schedule.</p>
    </header>

    <div class="pickers">
      <div class="dates" role="group" aria-label="Date">
        <button type="button" class="dates__nav" data-dates="-1" aria-label="Earlier dates"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 4 6 10l6 6"/></svg></button>
        <div class="dates__track" data-date-track></div>
        <button type="button" class="dates__nav" data-dates="1" aria-label="Later dates"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m8 4 6 6-6 6"/></svg></button>
      </div>
      <div class="seg" role="radiogroup" aria-label="Time of day" data-period>
        <button type="button" role="radio" aria-checked="true" data-p="all">All day</button>
        ${rates.bands.map((b) => `<button type="button" role="radio" aria-checked="false" data-p="${b.id}">${esc(b.label)}</button>`).join('')}
      </div>
    </div>

    <div class="explore">
      <div class="explore__map">
        <div class="viewtoggle seg seg--sm" role="radiogroup" aria-label="Court view">
          <button type="button" role="radio" aria-checked="true" data-view="plan">Floor plan</button>
          <button type="button" role="radio" aria-checked="false" data-view="list">List</button>
        </div>
        <div class="plan" data-plan>
          ${planSvg(courts.plan)}
          ${standard.map((x) => courtButton(x, courts.plan, courts.tiers, courts.settings)).join('')}
          <span class="ballmark" aria-hidden="true"></span>
        </div>
        <div class="premium">
          <p class="premium__head"><span class="sb">Premium · Courts ${premium[0].number}–${premium.at(-1).number}</span><span>Open for bookings from ${esc(premiumShort)}. Not on the published floor plan yet.</span></p>
          <div class="premium__row">${premium.map((x) => courtButton(x, courts.plan, courts.tiers, courts.settings)).join('')}</div>
        </div>
        <ul class="courtlist" data-courtlist hidden></ul>
        <ul class="legend" aria-label="Legend">
          <li><i class="lg lg--open"></i>Open</li><li><i class="lg lg--few"></i>Few left</li><li><i class="lg lg--full"></i>Full</li><li><i class="lg lg--sel"></i>Your pick</li>
        </ul>
      </div>

      <aside class="panel" data-panel aria-live="polite" aria-labelledby="panel-title">
        <div class="panel__empty" data-panel-empty>
          <div class="panel__fig" data-tap="point">${figure('point', { size: 120 })}</div>
          <p class="sb panel__k">Step 1 of 3</p>
          <h3 id="panel-title" class="h3">Tap a court to see its times.</h3>
          <p>Green courts have open slots on the day you picked. Prices change with the time of day.</p>
          <p class="sb panel__k panel__k--lad" data-ladder-k>Soonest open courts</p>
          <ol class="ladder" data-ladder></ol>
        </div>
        <div class="panel__court" data-panel-court hidden>
          <header class="pc__head">
            <div>
              <p class="pc__num"><span class="sb">Court</span> <b data-pc-num>03</b></p>
              <p class="pc__meta sb" data-pc-meta>Standard · Indoor hall</p>
            </div>
            <button type="button" class="iconbtn" data-pc-close aria-label="Close court"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15"/></svg></button>
          </header>
          <figure class="pc__photo" data-pc-photo></figure>
          <p class="pc__date sb" data-pc-date></p>
          <div class="pc__notice" data-pc-notice hidden></div>
          <ul class="slots" data-slots aria-label="Start times"></ul>
          <div class="pc__dur" data-dur-wrap>
            <p class="sb pc__k">Play for</p>
            <div class="seg seg--dur" role="radiogroup" aria-label="Duration">
              ${booking.durations.map((d, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-dur="${d}">${d} hr</button>`).join('')}
            </div>
          </div>
          <div class="pc__total">
            <div><p class="sb pc__k" data-sum-line>Pick a start time</p><p class="total" data-total aria-live="polite">—</p></div>
            <button type="button" class="btn btn--primary btn--lg" data-continue disabled>Pick a time</button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</section>

<section class="rates" id="rates" aria-labelledby="rates-title">
  <div class="wrap">
    <header class="sec-head sec-head--fig">
      <div>
        <h2 id="rates-title" class="h2">By the hour.</h2>
        <p class="sec-head__aside">The venue's rates from ${dateLong(rates.effective)}. Book across two bands and each hour is priced on its own.</p>
      </div>
      <div class="sec-head__fig" data-tap="carry">${figure('carry', { size: 150 })}</div>
    </header>
    <div class="rategrid">
      <article class="rate">
        <header><h3 class="h3">Standard</h3><p class="sb">Courts ${range(standard)}</p></header>
        ${bandBar('standard')}
        <ul class="band">${bandRows('standard')}</ul>
      </article>
      <article class="rate rate--prem">
        <header><h3 class="h3">Premium</h3><p class="sb">Courts ${range(premium)} · from ${esc(premiumMonth)}</p></header>
        ${bandBar('premium')}
        <ul class="band">${bandRows('premium')}</ul>
      </article>
    </div>
    <p class="rates__fee" data-fee-note>Booking through ${esc(booking.platform.name)} adds its service fee of ${money(rates.serviceFee.perCourtHour)} per court-hour.</p>
  </div>
</section>

<section class="more" id="play-more" aria-labelledby="more-title">
  <div class="wrap more__grid">
    <div class="more__copy">
      <h2 id="more-title" class="h2">Play more.</h2>
      <p class="lede">${esc(venue.groups)} Open daily till ${openTill}, with paddles to rent at the desk.</p>
      <ul class="badges" aria-label="Made for">
        ${events.groups.map((g, i) => `<li class="badge" data-tap="glyph">${glyph(groupGlyph[i % groupGlyph.length], { size: 44 })}<span>${esc(g)}</span></li>`).join('')}
        <li class="badge badge--fact" data-tap="glyph">${glyph('moon', { size: 44 })}<span>Open till ${openTill}</span></li>
        <li class="badge badge--fact" data-tap="glyph">${glyph('paddles', { size: 44 })}<span>Paddles to rent</span></li>
      </ul>
      <button type="button" class="btn btn--ball btn--lg" data-group>Plan a group booking ${arrow}</button>
    </div>
    <div class="more__media">
      ${courtFrame(img.coveredOpen, { sizes: '(min-width: 960px) 46vw, 100vw', cls: 'cf--tilt' })}
      <div class="more__fig" data-tap="cheer">${figure('cheer', { size: 190 })}</div>
    </div>
  </div>
</section>

<section class="chapters" id="venue" aria-labelledby="venue-title">
  ${net}
  <div class="wrap">
    <header class="sec-head">
      <h2 id="venue-title" class="h2">Inside, or under the canopy.</h2>
      <p class="sec-head__aside">${esc(venue.pitch)} The front desk, dressing room and comfort rooms sit in the hall.</p>
    </header>

    <article class="chapter">
      <div class="chapter__media">
        ${courtFrame(img.hallCourt2, { sizes: '(min-width: 960px) 60vw, 100vw', cls: 'cf--a' })}
        ${courtFrame(img.hallFront, { sizes: '(min-width: 960px) 26vw, 50vw', cls: 'cf--b', lines: false })}
        <div class="chapter__fig" data-tap="wait">${figure('wait', { size: 150 })}</div>
      </div>
      <div class="chapter__copy">
        <p class="chapter__num"><b>${indoor.length}</b> courts</p>
        <h3 class="chapter__title">Indoor hall</h3>
        <p class="chapter__sub sb">Courts ${range(indoor)}</p>
        <p>${indoor.length === 1 ? 'One court' : word(indoor.length, true) + ' courts'} under a high roof, with the front desk, dressing room and comfort rooms a few steps away.</p>
        <ul class="chapter__glyphs">${glyph('net', { size: 30 })}${glyph('score', { size: 30 })}${glyph('bottle', { size: 30 })}</ul>
        <a class="btn btn--line" href="#book" data-go-plan>See courts ${range(indoor)} on the plan</a>
      </div>
    </article>

    <article class="chapter chapter--flip">
      <div class="chapter__media">
        ${courtFrame(img.coveredBanner, { sizes: '(min-width: 960px) 60vw, 100vw', cls: 'cf--a' })}
        ${courtFrame(img.hallCourt3, { sizes: '(min-width: 960px) 26vw, 50vw', cls: 'cf--b', lines: false })}
        <div class="chapter__fig" data-tap="dink">${figure('dink', { size: 150 })}</div>
      </div>
      <div class="chapter__copy">
        <p class="chapter__num"><b>${covered.length}</b> courts</p>
        <h3 class="chapter__title">Covered courts</h3>
        <p class="chapter__sub sb">Courts ${range(covered)}</p>
        <p>${word(covered.length, true)} courts under a canopy with open mesh sides, beside the free parking.</p>
        <ul class="chapter__glyphs">${glyph('ball', { size: 30 })}${glyph('sneaker', { size: 30 })}${glyph('cone', { size: 30 })}</ul>
        <a class="btn btn--line" href="#book" data-go-plan>See courts ${range(covered)} on the plan</a>
      </div>
    </article>

    <article class="chapter chapter--soon">
      <div class="chapter__media chapter__media--soon">
        <div class="soon">
          ${premium.map((x) => courtArt(x.number, { ring: false })).join('')}
          <div class="soon__fig" data-tap="ticket">${figure('ticket', { size: 130 })}</div>
        </div>
      </div>
      <div class="chapter__copy">
        <p class="chapter__num"><b>${premium.length}</b> courts</p>
        <h3 class="chapter__title">Premium courts</h3>
        <p class="chapter__sub sb">Courts ${range(premium)} · from ${esc(premiumShort)}</p>
        <p>${word(premium.length, true)} premium courts take bookings from ${esc(premiumMonth)}. Photos and their place on the plan come from the venue.</p>
        <a class="btn btn--line" href="#rates">See premium rates</a>
      </div>
    </article>

    <ul class="amen" aria-label="Amenities">
      ${venue.amenities.map((a) => `<li data-tap="glyph">${glyph(a.id, { size: 40 })}<span>${esc(a.label)}</span></li>`).join('')}
    </ul>
  </div>
</section>

<section class="openplay" id="open-play" aria-labelledby="play-title">
  <div class="wrap">
    <header class="sec-head sec-head--fig">
      <div>
        <h2 id="play-title" class="h2">No partner? <em>Join a game.</em></h2>
        <p class="sec-head__aside"><span class="pill pill--demo">Sample sessions</span> ${esc(venue.name)} hasn't listed open play yet. These show how sessions would sign up here.</p>
      </div>
      <div class="sec-head__fig" data-tap="wave">${figure('wave', { size: 150 })}</div>
    </header>
    <div class="playgrid">${playCards}</div>
  </div>
</section>

<section class="groups" id="groups" aria-labelledby="groups-title">
  <div class="wrap groups__grid">
    <div class="groups__copy">
      <h2 id="groups-title" class="h2">Bring the whole crew.</h2>
      <p class="lede">Several courts at once for ${esc(events.groups.map((g) => g.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' or $1'))}. Tell the venue the date and the headcount and it sets the courts up.</p>
      <button type="button" class="btn btn--primary btn--lg" data-group>Plan a group booking ${arrow}</button>
    </div>
    <article class="event">
      <div class="event__fig" data-tap="trophy">${figure('trophy', { size: 170 })}</div>
      <p class="event__flag"><span class="pill pill--demo">Sample event</span><span class="sb">Upcoming</span></p>
      <h3 class="event__name">${esc(t.name)}</h3>
      <dl class="event__facts">
        <div><dt>Format</dt><dd>${esc(t.format)}</dd></div>
        <div><dt>Draw</dt><dd>${t.teams} teams</dd></div>
        <div><dt>Status</dt><dd class="live">${esc(t.status)}</dd></div>
      </dl>
      <svg class="bracket" viewBox="0 0 400 88" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 6h70v20H0M70 16h40v40H70M0 46h70v20H0M110 36h50"/>
        <path d="M400 6h-70v20h70M330 16h-40v40h40M400 46h-70v20h70M290 36h-50"/>
        <path d="M160 36h80"/><circle cx="200" cy="36" r="7"/>
      </svg>
      <button type="button" class="btn btn--line" data-event="${t.id}">View the event ${arrow}</button>
    </article>
  </div>
</section>

<section class="visit" id="visit" aria-labelledby="visit-title">
  ${net}
  <div class="wrap">
    <header class="sec-head">
      <h2 id="visit-title" class="h2">Find your court.</h2>
      <p class="sec-head__aside">${esc(L.street)}, ${esc(L.district)}, ${esc(L.city)}, ${esc(L.province)}.</p>
    </header>
    <div class="visit__grid">
      <div class="route" aria-label="From the parking to your court">
        <svg class="route__svg" viewBox="0 0 640 220" aria-hidden="true">
          <path class="route__path" pathLength="100" d="M60 150C140 150 160 70 250 70S330 150 420 150S520 70 590 70"/>
          <g class="route__stop" transform="translate(60 150)">${glyph('parking', { size: 48 })}</g>
          <g class="route__stop" transform="translate(250 70)">${glyph('arrow', { size: 48 })}</g>
          <g class="route__stop" transform="translate(420 150)">${glyph('score', { size: 48 })}</g>
          <g class="route__stop" transform="translate(590 70)">${glyph('court', { size: 48 })}</g>
        </svg>
        <ol class="route__steps">
          <li><b>Park</b><span>Free parking beside the covered courts.</span></li>
          <li><b>Walk in</b><span>Hall entrance, next to the dressing room.</span></li>
          <li><b>Check in</b><span>Front desk, just inside. Paddles to rent, balls and grip for sale.</span></li>
          <li><b>Play</b><span>Your court number is on the wall.</span></li>
        </ol>
        <div class="route__fig" data-tap="lead">${figure('lead', { size: 130 })}</div>
      </div>
      <div class="visit__copy">
        <dl class="facts">
          <div><dt>Hours</dt><dd>${esc(venue.hours.label)} <span class="openstate" data-openstate></span></dd></div>
          <div><dt>Call</dt><dd><a href="tel:${venue.contact.phone.tel}">${esc(venue.contact.phone.display)}</a></dd></div>
          <div><dt>Follow</dt><dd class="soc">${venue.social.map((s) => `<a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}</a>`).join('')}</dd></div>
          <div><dt>Rated</dt><dd>${venue.rating.score.toFixed(1)} on ${esc(venue.rating.source)} · ${venue.rating.count} reviews</dd></div>
        </dl>
        <div class="visit__cta">
          <a class="btn btn--primary btn--lg" href="${esc(L.mapsUrl)}" target="_blank" rel="noopener">Get directions ${arrow}</a>
          <a class="btn btn--line btn--lg" href="tel:${venue.contact.phone.tel}">Call the front desk</a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="final" aria-labelledby="final-title">
  <div class="wrap final__in">
    <div class="final__copy">
      <h2 id="final-title" class="final__title">See you <em>on court.</em></h2>
      <p class="final__next" data-final-next>Checking tonight's courts…</p>
      <a class="btn btn--ball btn--lg" href="#book" data-go-book>Book a court ${arrow}</a>
    </div>
    <div class="final__fig" data-tap="cheer">${figure('cheer', { size: 260 })}</div>
  </div>
  <svg class="final__lines" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M100 40h1000v320H100zM600 40v320M436 40v320M764 40v320M100 200h336M764 200h336"/></svg>
</section>
</main>

<footer class="foot">
  <div class="wrap foot__in">
    <div><p class="foot__name">${ballMark()} ${esc(venue.fullName)}</p><p>${esc(L.street)}, ${esc(L.district)}, ${esc(L.city)}, ${esc(L.province)}</p><p>${esc(venue.hours.label)}</p></div>
    <div class="foot__src">
      <p>Demo concept, not the venue's official site. Photographs, rates, hours and amenities come from ${esc(venue.fullName)}'s public PickleHub listing and its rate advisory of ${dateLong(rates.effective)}; the photographs are enhanced versions of the venue's own. Availability, open play and the event are simulated. The character is a proposal for the venue.</p>
      <button type="button" class="foot__reset" data-reset hidden>Clear demo bookings on this device</button>
    </div>
  </div>
</footer>

<div class="actionbar" data-actionbar>
  <div class="actionbar__sum" data-ab-sum><span class="sb">From ${money(lowRate)} / hr</span><b>Open till ${openTill}</b></div>
  <a class="btn btn--primary" href="#book" data-ab-btn data-go-book>Book a court</a>
</div>

<dialog class="sheet" data-sheet aria-labelledby="sheet-title">
  <div class="sheet__in">
    <header class="sheet__head">
      <ol class="steps" data-steps></ol>
      <button type="button" class="iconbtn" data-sheet-close aria-label="Close"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15"/></svg></button>
    </header>
    <div class="sheet__body" data-sheet-body></div>
  </div>
</dialog>

<template id="fig-cheer">${figure('cheer', { size: 120 })}</template>
<template id="fig-ticket">${figure('ticket', { size: 120 })}</template>
<template id="fig-wait">${figure('wait', { size: 110 })}</template>

<script type="application/json" id="venue-data">${data}</script>
<script type="module" src="app.js"></script>
</body>
</html>`;
}
