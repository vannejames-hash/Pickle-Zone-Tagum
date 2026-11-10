// courtConfig: the courts, their tier and setting, and where each sits on the floor plan.
// Plan positions follow the venue's own court-layout image (PickleHub). Premium courts 6–9
// are not on that image yet, so they carry no plan position and render off-plan.
export default {
  tiers: {
    standard: { label: 'Standard', short: 'STD' },
    premium: { label: 'Premium', short: 'PRM' },
  },
  settings: {
    indoor: { label: 'Indoor hall' },
    covered: { label: 'Covered court' },
    premium: { label: 'New courts' },
  },
  courts: [
    { id: 'c1', number: 1, tier: 'standard', setting: 'indoor', photo: 'hallFront', plan: { x: 905, y: 70 } },
    { id: 'c2', number: 2, tier: 'standard', setting: 'indoor', photo: 'hallCourt2', photoIsCourt: true, plan: { x: 905, y: 410 } },
    { id: 'c3', number: 3, tier: 'standard', setting: 'indoor', photo: 'hallCourt3', photoIsCourt: true, plan: { x: 650, y: 360 } },
    { id: 'c4', number: 4, tier: 'standard', setting: 'covered', photo: 'coveredBanner', plan: { x: 320, y: 80 } },
    { id: 'c5', number: 5, tier: 'standard', setting: 'covered', photo: 'coveredOpen', plan: { x: 50, y: 80 } },
    // Venue advisory, effective 1 Nov 2026: "Pre-bookings for December are now open, including the premium courts."
    { id: 'c6', number: 6, tier: 'premium', setting: 'premium', from: '2026-12-01' },
    { id: 'c7', number: 7, tier: 'premium', setting: 'premium', from: '2026-12-01' },
    { id: 'c8', number: 8, tier: 'premium', setting: 'premium', from: '2026-12-01' },
    { id: 'c9', number: 9, tier: 'premium', setting: 'premium', from: '2026-12-01' },
  ],
  // Fixed rooms on the plan, so players can find their way in.
  plan: {
    w: 1200,
    h: 640,
    buildings: [
      { id: 'covered', label: 'Covered courts', x: 30, y: 40, w: 560, h: 240 },
      { id: 'hall', label: 'Indoor hall', x: 630, y: 40, w: 540, h: 570 },
    ],
    rooms: [
      { label: 'Dressing room', x: 645, y: 55, w: 120, h: 60 },
      { label: 'Front desk', x: 645, y: 225, w: 120, h: 80, key: true },
      { label: 'Comfort rooms', x: 1060, y: 300, w: 95, h: 85 },
    ],
    doors: [
      { label: 'Entrance', x: 590, y: 52, side: 'right' },
      { label: 'Entrance', x: 630, y: 150, side: 'left' },
    ],
    parking: { label: 'Parking', x: 30, y: 320, w: 560, h: 290 },
  },
};
