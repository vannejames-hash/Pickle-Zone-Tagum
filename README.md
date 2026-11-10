# Courtside — pickleball venue booking demo

A branded venue site with a court explorer and booking flow. First venue: **Picklezone Tagum**.
Dependency-free: a Node build renders static HTML from config; one ES module runs the explorer and booking.

```bash
node build.mjs                       # builds dist/picklezone-tagum/
node serve.mjs picklezone-tagum 4330 # http://localhost:4330
```

## A venue is six config files

`venues/<id>/`

| File | What it holds |
|---|---|
| `venue.js` | name, address, hours, contact, social, amenities, photos |
| `courts.js` | courts (number, tier, setting, photo), floor-plan positions, rooms, doors, parking |
| `rates.js` | time bands and price per tier per band, platform service fee |
| `booking.js` | booking mode (A/B/C), durations, deposit, platform link, demo availability curve |
| `events.js` | open play, tournaments (real vs sample), group types |
| `theme.js` | colours and fonts |

Plus `img/` (WebP at 800/1400/2000 widths), `source/` (originals) and `SOURCES.md`.

A new venue changes these files only. No UI code holds venue facts.

## Booking modes

- **A — Existing system:** pick court and time here, finish on the venue's platform (PickleHub for Picklezone, with its ₱15/hr fee shown).
- **B — Booking request:** details, then a request the venue confirms by hand.
- **C — Full booking:** details, deposit (demo), instant confirmation.

`booking.mode` sets the default; the demo bar switches modes live so an owner can see all three.

## Data shape, ready for an admin later

venues → courts → rates → availability → bookings, plus openPlay and tournaments, all plain objects in config.
Availability is simulated in `src/app.js` (`status()`); a backend would replace that one function.

## Structure

- `src/brand.js` — the illustration kit: the character rig and poses, glyphs, pattern, court-frame overlays
- `src/render.js` — page sections, floor-plan SVG, court graphic
- `src/app.js` — availability, pricing, explorer, booking sheet, motion
- `src/styles.css` — the system (see DESIGN.md)
