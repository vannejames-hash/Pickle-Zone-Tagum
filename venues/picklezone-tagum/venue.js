// venueConfig: who the venue is, where, when it opens, how to reach it.
// Every fact here is sourced in SOURCES.md. Anything not yet confirmed is null, never guessed.
export default {
  id: 'picklezone-tagum',
  name: 'Picklezone',
  place: 'Tagum',
  fullName: 'Picklezone Tagum',
  // The venue's own words (PickleHub "About"), kept short.
  pitch: 'Premium indoor and covered outdoor pickleball courts in Tagum City.',
  groups: 'Wide courts made to host big groups, corporate outings, family reunions and friendly tournaments.',
  location: {
    street: 'Purok Dela Cruz',
    district: 'Brgy. Mankilam',
    city: 'Tagum City',
    province: 'Davao del Norte',
    country: 'PH',
    short: 'Mankilam, Tagum City',
    mapsUrl: 'https://www.google.com/maps/place/Picklezone+Tagum/data=!4m7!3m6!1s0x32f953003fb3db49:0xa3d807c4c37c87bd!8m2!3d7.4583239!4d125.7930749!16s%2Fg%2F11mymx1fl3',
    timezone: 'Asia/Manila',
  },
  hours: {
    label: 'Open daily, 8 AM to 2 AM',
    open: 8, // 08:00
    close: 26, // 02:00 next day, as hours past midnight of the opening day
    days: 'Everyday',
  },
  contact: {
    phone: { display: '0927 649 4636', tel: '+639276494636' },
    email: null,
  },
  social: [
    { id: 'facebook', label: 'Facebook', handle: 'picklezonetagum', url: 'https://facebook.com/picklezonetagum' },
    { id: 'instagram', label: 'Instagram', handle: 'picklezonetagum', url: 'https://instagram.com/picklezonetagum' },
  ],
  rating: { source: 'Google', score: 5, count: 6, asOf: '2026-11-10' },
  amenities: [
    { id: 'parking', label: 'Free parking' },
    { id: 'restrooms', label: 'Restrooms' },
    { id: 'dressing', label: 'Dressing rooms' },
    { id: 'paddles', label: 'Paddle rental' },
    { id: 'cafe', label: 'Café and refreshments' },
    { id: 'shop', label: 'Balls, overgrip, edge tape and kitchen clips for sale' },
  ],
  // The venue's own photographs (its PickleHub gallery), enhanced for the web on 10 Nov 2026: the same
  // courts, angles and signage, cleaned and relit. Originals in source/, enhanced files in source/enhanced/.
  images: {
    hallFront: { src: 'hall-front', widths: [640, 1000, 1672], w: 1672, h: 940, enhanced: true, alt: 'An indoor court at Picklezone, net up, the Picklezone sign on the back wall' },
    hallCourt2: { src: 'hall-court2', widths: [640, 1000, 1672], w: 1672, h: 941, enhanced: true, alt: 'Court 2 in the indoor hall, with benches along the side' },
    hallCourt3: { src: 'hall-court3', widths: [640, 1000, 1672], w: 1672, h: 941, enhanced: true, alt: 'Court 3 in the indoor hall, daylight from the big door' },
    coveredBanner: { src: 'covered-banner', widths: [640, 1000, 1672], w: 1672, h: 941, enhanced: true, alt: 'A covered court under the canopy, Picklezone banner at the far end' },
    coveredOpen: { src: 'covered-open', widths: [640, 1000, 1672], w: 1672, h: 941, enhanced: true, alt: 'A covered court with open mesh sides and trees outside' },
  },
  logo: null, // vector owed by the venue; the site sets the name in type until then
};
