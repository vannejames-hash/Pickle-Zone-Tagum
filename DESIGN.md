# Picklezone — brand system (V2, 10 Nov 2026)

The pickleball venue product (`pickleball/`) is a separate product from the Bean O' Clock storefront
at the repo root. Same studio standard, its own identity. V1 was a well-made sports site; V2 is a
brand: an illustrated character, court-line frames, a scoreboard voice and a motion signature.

## Direction

Play. Move. Book. A modern recreational sports brand that happens to book courts. Built from the
venue's own material: the wordmark's navy and green, the court blue, the lime ball, and the venue's
photographs (its PickleHub gallery, enhanced). Premium but warm; never esports, gym or SaaS.

## Colour (themeConfig in `venues/<id>/theme.js`)

| Token | Value | Use |
|---|---|---|
| paper | #F5F4EC | page ground, cool cream |
| paperDeep | #EBEADF | alternate band (explorer, open play, visit) |
| surface | #FFFFFF | panels, cards, sheet |
| ink | #0B1A3A | text, the pen, the navy band |
| ink2 / mute | #46526B / #5D6778 | secondary text |
| rule | #D6D7CB | hairlines, dashed frames |
| zone | #1C3FAA | primary action (wordmark blue) |
| court / courtDeep | #2D72B8 / #1F5A97 | playing surface, the blue band, paddle faces |
| turf / turfDeep | #8CBF3F / #4B7816 | court surround, "open" |
| ball | #D9F24A | the ball: the character's skin, selection ring, one accent button |
| booked | #C7CDD5 | taken slots |

Pattern: a scatter of the kit (ball, paddle, arrow, scoreboard) as a 200px tile at 3–5% opacity,
on the hero (fading right), the explorer and the navy band only. Never on cards.

## Type

- **Bricolage Grotesque** (variable: opsz 12–96, wdth 75–100, wght 500–800): the display face.
  Headlines at opsz 96 / wght 800 / tracking −0.03em. One word per headline in court blue.
- **The scoreboard voice** (`.sb`): the same face at wdth 76, caps, +0.06em: court numbers, times,
  labels, "Next open". It is the venue's PA system in type.
- **DM Sans** 400–700: interface and body. **DM Mono** 400–500: prices and time ranges in tables.

## The kit (`src/brand.js`)

One pen: `--lw` 2.4px, round caps, non-scaling. Solid fills only for the ball (lime), a paddle
face (court blue) and shoes. Pen colour follows the ground (`--il-line`): navy on cream, cream on
navy, navy on blue.

**The character** is the wordmark's ball with legs, arms and a paddle. No face: the seven holes are
the ball; posture, the paddle and what it holds carry the mood. A rig of two-segment limbs posed by
angles (`poses`): serve (hero), point (empty booking panel), carry (rates), cheer (play more, final,
confirmation), wait and dink (venue chapters), ticket (premium courts, pending request), wave (open
play), trophy (event), lead (the route). Arms sit in their own groups with the shoulder as origin, so
a tap plays one beat (a swing, a wave, a hop) in CSS. The page never names it.

**Glyphs** (48-unit boxes, same pen): ball, paddle, net, cone, bottle, sneaker, whistle, scoreboard,
trophy, pin, moon, clock, arrow, people, court, and the amenities (parking, restrooms, dressing,
paddles, café, shop).

**Court lines** are the brand's frame: every photograph sits in a `.cf` court frame (corner marks,
a baseline, a kitchen line and a centre line drawn over its lower edge); a dashed "net" line divides
sections; a court's own lines draw when it is selected.

## Shape

Radius 8px on controls, 12px on panels, 0 on photographs (court frames instead). Panels carry a 2px
ink border, not a shadow. Primary buttons have a 2px solid ledge (`box-shadow: 0 2px 0`) that
presses flat on click.

## Motion

Fast, precise, athletic. `cubic-bezier(.2,.8,.2,1)` for entrances (300–800ms), `.3,0,.2,1` for
state changes (140–220ms), `.3,1.4,.4,1` (a small overshoot) for the character and court selection.
Hero: lines draw, the character enters, the ball arcs from its paddle to the "next open" card and
bounces once. Court select: lift + overshoot, lime ring draws, the court's lines redraw, the ball
hops over, the panel enters, times stagger 18ms. Taps on figures and glyphs play one beat.
Nothing is scroll-linked. Everything rests under `prefers-reduced-motion`.
