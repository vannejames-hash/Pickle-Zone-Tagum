// eventConfig: open play, tournaments, group bookings.
// Picklezone lists no open play on PickleHub (checked 10 Nov 2026) and no dated tournament.
// Entries with sample: true are interface samples, labelled on the page, never real sessions.
export default {
  openPlay: {
    real: [],
    sample: [
      { id: 'op-thu', day: 'Thursday', start: 19, end: 21, level: 'Intermediate', spots: 16, taken: 12, fee: 250, court: 'Courts 1–2' },
      { id: 'op-sat', day: 'Saturday', start: 9, end: 11, level: 'Beginner friendly', spots: 12, taken: 5, fee: 200, court: 'Court 4' },
      { id: 'op-sun', day: 'Sunday', start: 20, end: 22, level: 'Advanced', spots: 8, taken: 8, fee: 300, court: 'Court 3' },
    ],
  },
  tournaments: {
    real: [],
    sample: [
      { id: 't-open', name: 'Picklezone Open', format: "Men's doubles", teams: 16, status: 'Registration open', when: 'Sample date' },
    ],
  },
  // Real: the venue says its courts are made for these.
  groups: ['Big groups', 'Corporate outings', 'Family reunions', 'Friendly tournaments'],
};
