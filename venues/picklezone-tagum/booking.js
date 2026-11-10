// bookingConfig: how a booking ends for this venue.
//   A  existing system: pick court and time here, finish on the venue's platform
//   B  booking request: the venue confirms each request by hand
//   C  full booking: details, deposit, instant confirmation
// Picklezone books through PickleHub today (Mode A). The demo opens on C to show the full vision;
// the demo bar switches modes live.
export default {
  mode: 'C',
  demoModeSwitch: true,
  platform: { name: 'PickleHub', url: 'https://picklehub.ph/picklezone-tagum', payment: 'PickleHub FastPay' },
  slotMinutes: 60,
  durations: [1, 2, 3],
  daysAhead: 35,
  deposit: { percent: 50 },
  refPrefix: 'PZ',
  // Simulated availability: chance a slot is taken, by start hour. Shaped on one PickleHub
  // snapshot (Tue 10 Nov 2026: evenings 6–10 PM full, mornings open). Not live data.
  demoLoad: {
    8: 0.1, 9: 0.12, 10: 0.15, 11: 0.15, 12: 0.12, 13: 0.12, 14: 0.15, 15: 0.2,
    16: 0.3, 17: 0.5, 18: 0.9, 19: 0.92, 20: 0.88, 21: 0.85, 22: 0.6, 23: 0.4, 24: 0.25, 25: 0.15,
  },
  weekendBoost: 0.12,
};
