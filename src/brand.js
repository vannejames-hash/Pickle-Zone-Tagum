// Picklezone's illustration kit.
//
// One pen draws everything: a single stroke weight (CSS --lw, non-scaling), round caps and joins, no
// internal shading. Solid fills only where the sport has them: the ball (lime), a paddle face (court
// blue), a sneaker sole. Colours come from CSS so the same drawing works on cream, on navy and on blue:
//   --il-line  the pen        --il-ball  the ball's fill       --il-face  a paddle face
//
// THE RALLY. The character is the ball from the venue's own wordmark, given legs, arms and a paddle.
// It has no face: the six holes are the ball, and its mood lives in posture, the paddle and what it
// holds. Every appearance is an action (serving, dinking, pointing at the plan, carrying paddles,
// waving players in, lifting a trophy, cheering). The page never names it.
//
// The figure is a rig: every limb is a two-segment chain turned by angles in `poses`, baked into
// coordinates at build time. Arms and the paddle sit in their own <g> with a transform-origin at the
// shoulder, so CSS can swing them for a tap reaction without re-posing the whole figure.

const f = (n) => Number(Number(n).toFixed(1));
const RAD = Math.PI / 180;

// Skeleton, in figure units. Origin: the ground between the feet. y runs up as negative numbers.
export const rig = {
  r: 40, body: [0, -78],
  shoulderF: [30, -86], shoulderB: [-30, -86],
  hipF: [14, -42], hipB: [-14, -42],
  upperArm: 30, foreArm: 28, thigh: 24, shin: 22,
};

// Angles in degrees. 0 hangs straight down. Negative swings forward (to the right) on the front limb;
// on the back limb positive swings out behind. `y` lifts the whole figure; `tilt` leans the body.
export const poses = {
  // Paddle back, ball tossed up from the other hand: the first thing the hero does.
  serve:  { sF: 140, eF: 20, sB: -40, eB: -120, hF: -18, kF: 24, hB: 14, kB: 8, tilt: -6, toss: true, paddle: 'f', pad: -30 },
  // Low dink at the kitchen: knees bent, paddle out front.
  dink:   { sF: -56, eF: -24, sB: 50, eB: 40, hF: -40, kF: 60, hB: 30, kB: 50, tilt: 10, y: 12, paddle: 'f', pad: 50 },
  // Waiting for a court: paddle under the arm, other hand on the hip.
  wait:   { sF: -22, eF: -96, sB: 44, eB: -130, hF: 0, kF: 0, hB: 10, kB: 0, tilt: 0, paddle: 'f', pad: 100 },
  // Pointing at the plan.
  point:  { sF: -110, eF: 10, sB: 20, eB: 10, hF: 0, kF: 0, hB: 0, kB: 0, tilt: 0, paddle: 'b', pad: 30 },
  // Both arms up, feet off the floor.
  cheer:  { sF: -160, eF: -20, sB: 160, eB: 20, hF: -20, kF: 50, hB: 20, kB: 50, tilt: 0, y: -22, paddle: 'f', pad: -20 },
  // Two paddles stacked under one arm, walking.
  carry:  { sF: -16, eF: -90, sB: 28, eB: 10, hF: -28, kF: 20, hB: 30, kB: 36, tilt: 4, stack: true },
  // Waving players in.
  wave:   { sF: -150, eF: -50, sB: 24, eB: 10, hF: 0, kF: 0, hB: 0, kB: 0, tilt: 0, paddle: 'b', pad: 30 },
  // Lifting a trophy with both hands.
  trophy: { sF: -150, eF: -40, sB: 150, eB: 40, hF: 0, kF: 0, hB: 0, kB: 0, tilt: 0, cup: true },
  // Holding the booking out: a small ticket in the front hand.
  ticket: { sF: -70, eF: -60, sB: 30, eB: 10, hF: 0, kF: 0, hB: 0, kB: 0, tilt: 4, card: true, paddle: 'b', pad: 30 },
  // Reading a paddle like a map: pointing it the way to the court.
  lead:   { sF: -90, eF: 0, sB: 36, eB: 20, hF: -24, kF: 20, hB: 24, kB: 30, tilt: 6, paddle: 'f', pad: 90 },
};

const rot = (x, y, a, cx = 0, cy = 0) => {
  const s = Math.sin(a * RAD), c = Math.cos(a * RAD);
  const dx = x - cx, dy = y - cy;
  return [cx + dx * c - dy * s, cy + dx * s + dy * c];
};
const chain = (from, a1, l1, a2, l2) => {
  // a: 0 points down (+y). Negative turns toward +x (forward) when applied as a clockwise SVG rotation.
  const ang = (a) => (a + 90) * RAD; // direction angle in radians
  const mid = [from[0] + Math.cos(ang(a1)) * l1, from[1] + Math.sin(ang(a1)) * l1];
  const end = [mid[0] + Math.cos(ang(a1 + a2)) * l2, mid[1] + Math.sin(ang(a1 + a2)) * l2];
  return { mid, end };
};
const P = (pts) => pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' ');

// The ball: the circle and the hole layout from the wordmark, one solid fill.
export function ballShape(cx, cy, r, { cls = 'il-ball', holes = true } = {}) {
  const h = holes ? [[0, -0.52], [0.45, -0.26], [-0.45, -0.26], [0.45, 0.26], [-0.45, 0.26], [0, 0.52], [0, 0]].map(([x, y]) => `<circle class="il-hole" cx="${f(cx + x * r)}" cy="${f(cy + y * r)}" r="${f(r * 0.14)}"/>`).join('') : '';
  return `<circle class="${cls}" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"/>${h}`;
}

// A paddle drawn along its own axis (handle at the origin, face up the -y axis), then placed.
function paddleAt(x, y, angle, { scale = 1, face = true } = {}) {
  const s = scale;
  return `<g class="il-paddle" transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)}) scale(${s})">
    <path class="il-handle" d="M-4 0h8v-20h-8z"/>
    <path class="${face ? 'il-face' : 'il-line'}" d="M-16 -20c-8 -10 -10 -26 -6 -40c3 -12 12 -18 22 -18s19 6 22 18c4 14 2 30 -6 40z"/>
    <path class="il-edge" d="M-16 -20c-8 -10 -10 -26 -6 -40c3 -12 12 -18 22 -18s19 6 22 18c4 14 2 30 -6 40"/>
  </g>`;
}

// Renders one pose as an SVG group in figure units. Use `figure()` for a complete, sized <svg>.
export function figureGroup(name) {
  const p = poses[name] || poses.wait;
  const y = p.y || 0;
  const tilt = p.tilt || 0;
  const [bx, by] = rig.body;
  const sh = (s) => rot(s[0], s[1], tilt, bx, by);
  const sF = sh(rig.shoulderF), sB = sh(rig.shoulderB);
  const legF = chain(rig.hipF, p.hF, rig.thigh, p.kF, rig.shin);
  const legB = chain(rig.hipB, p.hB, rig.thigh, p.kB, rig.shin);
  const armF = chain(sF, p.sF, rig.upperArm, p.eF, rig.foreArm);
  const armB = chain(sB, p.sB, rig.upperArm, p.eB, rig.foreArm);
  const handAngleF = p.sF + p.eF + 90, handAngleB = p.sB + p.eB + 90; // forearm direction, 0 = +x
  const shoe = ([x, yy], dir) => `<path class="il-shoe" d="M${f(x - 10)} ${f(yy)}h${dir * 24}c4 0 6 -2 6 -5s-3 -5 -8 -5h-${dir * 14}z"/><path class="il-line" d="M${f(x - 4)} ${f(yy - 5)}h${dir * 8}"/>`;
  const padAng = (hand) => (hand === 'f' ? handAngleF : handAngleB) + 90 + (p.pad || 0);
  return `<g class="il-fig" data-pose="${name}" transform="translate(0 ${f(y)})">
    <g class="il-legs">
      <polyline class="il-line" points="${P([rig.hipB, legB.mid, legB.end])}"/>${shoe(legB.end, 1)}
      <polyline class="il-line" points="${P([rig.hipF, legF.mid, legF.end])}"/>${shoe(legF.end, 1)}
    </g>
    <g class="il-body" transform="rotate(${tilt} ${bx} ${by})">${ballShape(bx, by, rig.r, { cls: 'il-ball il-skin' })}</g>
    <g class="il-arm il-arm--b" style="transform-origin:${f(sB[0])}px ${f(sB[1])}px">
      <polyline class="il-line" points="${P([sB, armB.mid, armB.end])}"/>
      <circle class="il-hand" cx="${f(armB.end[0])}" cy="${f(armB.end[1])}" r="4"/>
      ${p.paddle === 'b' ? paddleAt(armB.end[0], armB.end[1], padAng('b'), { face: false }) : ''}
      ${p.toss ? ballShape(armB.end[0] - 6, armB.end[1] - 34, 10, { cls: 'il-ball il-toss' }) : ''}
    </g>
    <g class="il-arm il-arm--f" style="transform-origin:${f(sF[0])}px ${f(sF[1])}px">
      <polyline class="il-line" points="${P([sF, armF.mid, armF.end])}"/>
      <circle class="il-hand" cx="${f(armF.end[0])}" cy="${f(armF.end[1])}" r="4"/>
      ${p.paddle === 'f' ? paddleAt(armF.end[0], armF.end[1], padAng('f')) : ''}
      ${p.stack ? paddleAt(armF.end[0] + 6, armF.end[1] - 8, 72, { face: false }) + paddleAt(armF.end[0] + 2, armF.end[1] - 2, 80) : ''}
      ${p.cup ? `<g class="il-cup" transform="translate(${f((armF.end[0] + armB.end[0]) / 2)} ${f(Math.min(armF.end[1], armB.end[1]) - 6)})"><path class="il-line" d="M-18 -36h36v8c0 14 -8 24 -18 24s-18 -10 -18 -24zM-18 -32c-10 0 -14 4 -14 10s6 12 14 12M18 -32c10 0 14 4 14 10s-6 12 -14 12M0 -4v10M-10 6h20v6h-20z"/></g>` : ''}
      ${p.card ? `<g class="il-card" transform="translate(${f(armF.end[0] + 10)} ${f(armF.end[1] - 4)}) rotate(-8)"><rect class="il-paper" x="-16" y="-22" width="36" height="26" rx="3"/><path class="il-line" d="M-10 -14h20M-10 -8h14M-10 -2h8"/></g>` : ''}
    </g>
  </g>`;
}

// A complete figure: `size` is its height in CSS px; the viewBox leaves room for a raised paddle.
export function figure(name, { size = 160, cls = '', label = '' } = {}) {
  const w = 260, h = 236;
  return `<svg class="il ${cls}" viewBox="-130 -206 ${w} ${h}" width="${f((size * w) / h)}" height="${size}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'} focusable="false" data-fig="${name}"><g class="il-ground">${figureGroup(name)}</g></svg>`;
}

// Glyphs: 48-unit boxes, the same pen. Fills: ball only.
export const glyphs = {
  ball: `${ballShape(24, 24, 17)}`,
  paddle: `<path class="il-line" d="M19 44l3-14M29 44l-3-14"/><path class="il-face" d="M14 30c-6-6-8-18-3-25a13 13 0 0 1 26 0c5 7 3 19-3 25z"/>`,
  net: `<path class="il-line" d="M4 10v30M44 10v30M4 14h40M4 36h40M12 14v22M20 14v22M28 14v22M36 14v22M4 22h40M4 29h40"/>`,
  cone: `<path class="il-line" d="M18 40 23 8h2l5 32M8 40h32M14 30h20M16 22h16"/>`,
  bottle: `<path class="il-line" d="M19 6h10v6c5 2 6 6 6 10v20a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4V22c0-4 1-8 6-10zM13 24h22M13 36h22"/>`,
  sneaker: `<path class="il-line" d="M6 34c0-6 6-8 12-9l8-9c2 4 6 7 12 8c4 1 6 4 6 8v4H6zM6 36h38M18 25l4 5M24 22l4 5"/>`,
  whistle: `<path class="il-line" d="M6 20h22l12-6v12l-12-6M6 20a10 10 0 1 0 20 0a10 10 0 1 0-20 0M16 20h0"/>`,
  score: `<path class="il-line" d="M6 10h36v28H6zM24 10v28M6 24h36"/><path class="il-line" d="M12 17h6M12 31h6M30 17h6M30 31h6"/>`,
  trophy: `<path class="il-line" d="M14 8h20v8c0 10-5 16-10 16s-10-6-10-16zM14 12c-6 0-8 2-8 6s4 8 8 8M34 12c6 0 8 2 8 6s-4 8-8 8M24 32v6M16 42h16v-4H16z"/>`,
  pin: `<path class="il-line" d="M24 44s-14-14-14-24a14 14 0 0 1 28 0c0 10-14 24-14 24z"/><circle class="il-line" cx="24" cy="20" r="5"/>`,
  moon: `<path class="il-line" d="M30 6a16 16 0 1 0 12 24A12 12 0 0 1 30 6z"/>`,
  clock: `<circle class="il-line" cx="24" cy="24" r="17"/><path class="il-line" d="M24 13v11l7 5"/>`,
  arrow: `<path class="il-line" d="M8 24h30M28 14l10 10-10 10"/>`,
  people: `${ballShape(16, 18, 9, { holes: false })}${ballShape(32, 18, 9, { holes: false })}<path class="il-line" d="M4 42c0-8 5-13 12-13s12 5 12 13M20 42c0-8 5-13 12-13s12 5 12 13"/>`,
  court: `<path class="il-line" d="M4 8h40v32H4zM4 24h40M24 8v32M15 8v32M33 8v32" /><path class="il-line" d="M4 8h40v32H4zM24 8v32M4 24h11M33 24h11M15 8v32M33 8v32"/>`,
  // Amenities, same pen.
  parking: `<path class="il-line" d="M12 6h24v36H12zM19 34V14h7a5 5 0 0 1 0 10h-7"/>`,
  restrooms: `<circle class="il-line" cx="15" cy="10" r="4"/><path class="il-line" d="M9 32V22a6 6 0 0 1 12 0v10M12 32v10M18 32v10"/><circle class="il-line" cx="33" cy="10" r="4"/><path class="il-line" d="M26 30l3-10a4 4 0 0 1 8 0l3 10zM30 30v12M36 30v12"/>`,
  dressing: `<path class="il-line" d="M24 8a3 3 0 1 1 3 3c-2 0-3 2-3 4l16 9v4H8v-4l16-9"/>`,
  paddles: `<path class="il-line" d="M12 42l4-12M30 42l-4-12"/><path class="il-line" d="M9 30c-5-6-6-16-1-22a11 11 0 0 1 22 0c5 6 4 16-1 22zM27 30c-5-6-6-16-1-22"/>`,
  cafe: `<path class="il-line" d="M8 18h26v8a10 10 0 0 1-10 10h-6A10 10 0 0 1 8 26zM34 20h3a4 4 0 0 1 0 8h-3M16 6c0 3 3 3 3 6M23 6c0 3 3 3 3 6M10 42h26"/>`,
  shop: `${ballShape(18, 20, 10)}<path class="il-line" d="M30 34h12M30 40h12M30 28h12"/>`,
};
export const glyph = (id, { size = 48, cls = '', label = '' } = {}) =>
  `<svg class="il il-glyph ${cls}" viewBox="0 0 48 48" width="${size}" height="${size}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'} focusable="false">${glyphs[id] || ''}</svg>`;

// The brand pattern: a loose scatter of the kit, one tile, for low-opacity grounds.
export function patternSvg(line = '#0B1A3A') {
  const s = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240' fill='none' stroke='${line}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
    <circle cx='40' cy='44' r='16'/><circle cx='40' cy='36' r='2.4' fill='${line}' stroke='none'/><circle cx='47' cy='46' r='2.4' fill='${line}' stroke='none'/><circle cx='33' cy='46' r='2.4' fill='${line}' stroke='none'/>
    <g transform='translate(150 60) rotate(-30)'><path d='M-10 26c-6-6-8-18-3-25a13 13 0 0 1 26 0c5 7 3 19-3 25zM-3 26l-3 12M3 26l3 12'/></g>
    <path d='M70 160h40M100 150l10 10-10 10'/>
    <path d='M180 150h30v24h-30zM195 150v24M180 162h8M207 162h3'/>
    <circle cx='200' cy='210' r='16'/><circle cx='200' cy='202' r='2.4' fill='${line}' stroke='none'/><circle cx='207' cy='212' r='2.4' fill='${line}' stroke='none'/><circle cx='193' cy='212' r='2.4' fill='${line}' stroke='none'/>
    <path d='M30 210h6M44 210h6M58 210h6'/>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(s.replace(/\s+/g, ' '))}")`;
}

// Court lines over a photograph: a baseline, the kitchen line and the centre line, in the frame's corner.
export const courtOverlay = `<svg class="cf__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M0 86H100"/><path pathLength="1" d="M0 70H100"/><path pathLength="1" d="M50 70V100"/></svg>`;
// Corner marks, drawn once around a frame.
export const corners = `<svg class="cf__corners" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path vector-effect="non-scaling-stroke" d="M0 10V0h10M90 0h10v10M100 90v10H90M10 100H0V90"/></svg>`;
