/**
 * Formats a product code to standard format without '#' symbol,
 * padded with leading zeros (e.g., 1 -> '001', 12 -> '012', 120 -> '120').
 */
export const formatProductCode = (val: any, fallbackNum?: number): string => {
  const clean = val !== undefined && val !== null ? String(val).trim().replace(/^#+/, '') : '';
  if (clean && /^\d+$/.test(clean)) {
    return clean.padStart(3, '0');
  }
  if (clean) return clean;
  if (fallbackNum !== undefined && fallbackNum !== null && !isNaN(Number(fallbackNum))) {
    return String(fallbackNum).padStart(3, '0');
  }
  return '';
};

export const STANDARD_CRACKER_CATEGORIES = [
  'One Sound Crackers',
  'Sparklers',
  'Ground Chakkars',
  'Flower Pots',
  'Sound Bombs',
  'Rockets',
  'Garland Crackers (Wala)',
  'Aerial Shots & Repeaters',
  'Fancy Novelties & Kids',
  'Gift Boxes',
  'Match Boxes',
  'General',
];

/**
 * Intelligently determines the appropriate category for a cracker product
 * based on its name or existing category.
 */
export const inferCategoryFromProductName = (productName: string, existingCategory?: string): string => {
  const cleanCat = (existingCategory || '').trim();
  const isGeneric = !cleanCat || cleanCat.toLowerCase() === 'general' || cleanCat.toLowerCase() === 'uncategorized' || cleanCat.toLowerCase() === 'default';

  const name = (productName || '').toLowerCase().trim();
  if (!name) return !isGeneric ? cleanCat : 'General';

  // 1. Sparklers (Electric / Color / Green / Red Sparklers)
  if (name.includes('sparkler') || name.includes('sparkeler') || name.includes('மத்தாப்பு') || name.includes('spark')) {
    return 'Sparklers';
  }

  // 2. Ground Chakkars (Chakkar / Zamin Chakkar / Spinning)
  if (name.includes('chakkar') || name.includes('chakkaram') || name.includes('chakar') || name.includes('chakka') || name.includes('spinning') || name.includes('சக்கரம்') || name.includes('சங்கு')) {
    return 'Ground Chakkars';
  }

  // 3. Flower Pots & Fountains (Flower Pot / Koti / Colour Koti / Tri Colour / Fountain)
  if (name.includes('flower pot') || name.includes('flowerpot') || name.includes('koti') || name.includes('fountain') || name.includes('tri colour') || name.includes('tri color') || name.includes('புஸ்வாணம்')) {
    return 'Flower Pots';
  }

  // 4. Aerial Shots & Repeaters (Sky Shots / Cake Repeaters / Multi Shots)
  if (
    name.includes('shot') ||
    name.includes('shots') ||
    name.includes('repeater') ||
    name.includes('sky out') ||
    name.includes('aerial') ||
    name.includes('sky shot') ||
    name.includes('night sky') ||
    name.includes('cake') ||
    name.includes('வானவேடிக்கை')
  ) {
    return 'Aerial Shots & Repeaters';
  }

  // 5. Sound Bombs (Atom Bomb / Hydro Bomb / Bullet Bomb / Dynamite)
  if (
    name.includes('bomb') ||
    name.includes('hydro') ||
    name.includes('atom') ||
    name.includes('bullet') ||
    name.includes('dynamite') ||
    name.includes('thunder') ||
    name.includes('classic bomb') ||
    name.includes('digital bomb') ||
    name.includes('king bomb') ||
    name.includes('பாம்') ||
    name.includes('வெடிகுண்டு')
  ) {
    return 'Sound Bombs';
  }

  // 6. Rockets (Baby Rocket / Lunik / Parachute / Whistling)
  if (name.includes('rocket') || name.includes('lunik') || name.includes('parachute') || name.includes('ராக்கெட்')) {
    return 'Rockets';
  }

  // 7. Garland Crackers / Wala / Lar (100 Wala / 1000 Wala / 28 Chorsa / 56 Giant)
  if (
    name.includes('wala') ||
    name.includes('vaala') ||
    name.includes('lar') ||
    name.includes('garland') ||
    name.includes('chorsa') ||
    name.includes('giant') ||
    name.includes('சரவெடி') ||
    name.includes('வாலா')
  ) {
    return 'Garland Crackers (Wala)';
  }

  // 8. Gift Boxes (Combo Pack / Family Box / Gift Box)
  if (name.includes('gift box') || name.includes('gift pack') || name.includes('combo') || name.includes('assorted box') || name.includes('கிப்ட்')) {
    return 'Gift Boxes';
  }

  // 9. Match Boxes
  if (name.includes('match box') || name.includes('matches') || name.includes('safety match') || name.includes('mega match')) {
    return 'Match Boxes';
  }

  // 10. One Sound Crackers (Kuruvi / Lakshmi / Ganesh / Dheivam / Bijili / Sound Crackers / 2 3/4 / 3 1/2 / 4")
  if (
    name.includes('kuruvi') ||
    name.includes('guruvi') ||
    name.includes('lakshmi') ||
    name.includes('laxmi') ||
    name.includes('ganesh') ||
    name.includes('dheivam') ||
    name.includes('sound cracker') ||
    name.includes('one sound') ||
    name.includes('bijili') ||
    name.includes('bijli') ||
    name.includes('2 3/4') ||
    name.includes('3 1/2') ||
    name.includes('4"') ||
    name.includes('5"') ||
    name.includes('bird') ||
    name.includes('குருவி') ||
    name.includes('லட்சுமி') ||
    name.includes('வெடி')
  ) {
    return 'One Sound Crackers';
  }

  // 11. Fancy Novelties & Kids Special
  if (
    name.includes('star') ||
    name.includes('twinkling') ||
    name.includes('peacock') ||
    name.includes('pencil') ||
    name.includes('snake') ||
    name.includes('photo flash') ||
    name.includes('magic') ||
    name.includes('pop') ||
    name.includes('smoke') ||
    name.includes('cap') ||
    name.includes('roll cap') ||
    name.includes('ring cap') ||
    name.includes('butterfly') ||
    name.includes('helicopter') ||
    name.includes('drone') ||
    name.includes('siren') ||
    name.includes('whistle') ||
    name.includes('kids')
  ) {
    return 'Fancy Novelties & Kids';
  }

  return !isGeneric ? cleanCat : 'General';
};
