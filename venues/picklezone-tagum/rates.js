// rateConfig: price per court-hour by tier and time band. From the venue's advisory
// "Updated Court Rates", effective 1 Nov 2026. Hours run past midnight (26 = 2 AM).
export default {
  currency: '₱',
  effective: '2026-11-01',
  bands: [
    { id: 'morning', label: 'Morning', from: 8, to: 12, range: '8 AM – 12 NN' },
    { id: 'afternoon', label: 'Afternoon', from: 12, to: 16, range: '12 NN – 4 PM' },
    { id: 'night', label: 'Night', from: 16, to: 26, range: '4 PM – 2 AM' },
  ],
  table: {
    standard: { morning: 250, afternoon: 275, night: 300 },
    premium: { morning: 300, afternoon: 325, night: 350 },
  },
  // Charged by PickleHub on top of the court rate. Applies only when booking hands off to PickleHub.
  serviceFee: { perCourtHour: 15, label: 'PickleHub service fee', modes: ['A'] },
};
