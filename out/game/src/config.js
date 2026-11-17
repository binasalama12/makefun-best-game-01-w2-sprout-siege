// SPROUT SIEGE configuration: gardens, defender plants, pests, seed powers,
// waves and scoring. A 5-lane garden tower defense on a 1280x720 canvas:
// plant living turrets on the trellis, hold the garden gate (left) against
// pests marching in from the right, harvest nectar, draft seed packets
// between waves, and face The Compost King on wave 30.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 52;

// Trellis grid: 5 lanes x 7 columns. Gate sits at the left edge (x < GRID.x).
export const LANES = 5;
export const COLS = 7;
export const GRID = { x: 170, y: 110, cellW: 118, cellH: 94 };
export const GATE_X = 158; // pests crossing this x damage the gate
export const SPAWN_X = 992;

export const GARDENS = [
  {
    name: 'Verdant Trellis', waves: [1, 10],
    sky: '#2e5d2a', skyTop: '#79b657', soil: '#5a4028', soilAlt: '#63492e',
    lane: '#3f7a34', laneAlt: '#46853a', path: '#8a6a44', trellis: '#c9a86a',
    accent: '#ffd94d', text: '#fff7d6', glow: '#b6e34d',
  },
  {
    name: 'Thornwood Hollow', waves: [11, 20],
    sky: '#1d2f4a', skyTop: '#3d5a80', soil: '#3d2f22', soilAlt: '#463627',
    lane: '#2c4a3e', laneAlt: '#335646', path: '#5c4a33', trellis: '#9a7d4f',
    accent: '#7fd4ff', text: '#e6f4ff', glow: '#54b9ff',
  },
  {
    name: 'Ember Conservatory', waves: [21, 30],
    sky: '#4a2418', skyTop: '#8a4a2a', soil: '#4a2f1e', soilAlt: '#553723',
    lane: '#5a3d24', laneAlt: '#654628', path: '#7a5636', trellis: '#d8b078',
    accent: '#ff9a4d', text: '#ffe9d2', glow: '#ff8a3d',
  },
];

export function gardenForWave(wave) {
  if (wave <= 10) return GARDENS[0];
  if (wave <= 20) return GARDENS[1];
  return GARDENS[2];
}
export function gardenIndexForWave(wave) {
  if (wave <= 10) return 0;
  if (wave <= 20) return 1;
  return 2;
}

// 8 defender plants. role drives behaviour in main.js:
// shooter | frost | splash | sniper | economy | wall | chain | mortar
export const PLANTS = [
  { id: 'piper', name: 'Peapod Piper', role: 'shooter', cost: 50, hp: 120, dmg: 14, rate: 0.85, range: 999, color: '#5ec94f', dark: '#2f7a28', desc: 'Steady pea shooter down its lane.' },
  { id: 'fern', name: 'Frost Fern', role: 'frost', cost: 75, hp: 110, dmg: 6, rate: 1.1, range: 999, slow: 0.45, slowDur: 2.2, color: '#7fd4e8', dark: '#2a7a94', desc: 'Chills pests: 45% slow for 2.2s.' },
  { id: 'berry', name: 'Bomb Berry', role: 'splash', cost: 100, hp: 130, dmg: 22, rate: 1.9, range: 999, splash: 62, color: '#e85a7a', dark: '#94283e', desc: 'Bursting berries splash whole clusters.' },
  { id: 'thorn', name: 'Thorn Sniper', role: 'sniper', cost: 125, hp: 100, dmg: 85, rate: 2.6, range: 999, color: '#c94fe0', dark: '#6e2894', desc: 'One huge thorn, fired slowly, hits hard.' },
  { id: 'bloom', name: 'Sunbloom', role: 'economy', cost: 50, hp: 110, dmg: 0, rate: 6.0, range: 0, yield: 25, color: '#ffd94d', dark: '#b8860b', desc: 'Grows +25 nectar every few seconds.' },
  { id: 'bulb', name: 'Bulwark Bulb', role: 'wall', cost: 40, hp: 620, dmg: 0, rate: 0, range: 0, color: '#a88a5a', dark: '#6b5322', desc: 'A living wall: 620 HP of pure stubborn.' },
  { id: 'vine', name: 'Volt Vine', role: 'chain', cost: 110, hp: 115, dmg: 18, rate: 1.5, range: 999, chain: 3, color: '#ffe94d', dark: '#a8940b', desc: 'Lightning arcs to 3 pests at once.' },
  { id: 'melon', name: 'Mortar Melon', role: 'mortar', cost: 150, hp: 140, dmg: 34, rate: 2.8, range: 999, splash: 78, color: '#4fb86e', dark: '#1f6e3a', desc: 'Lobs melons over walls for big splash.' },
];
export const PLANT_BY_ID = Object.fromEntries(PLANTS.map((p) => [p.id, p]));

// 7 pest types with distinct behaviours (see main.js update logic).
export const PESTS = [
  { id: 'grub', name: 'Grub', hp: 55, speed: 26, dmg: 8, nectar: 6, score: 60, color: '#c9b458', dark: '#8a7a2e', desc: 'Basic muncher. Marches, chews, dies.' },
  { id: 'beetle', name: 'Runner Beetle', hp: 34, speed: 58, dmg: 6, nectar: 7, score: 80, color: '#e87a3d', dark: '#94401a', desc: 'Fast and fragile — outruns slow towers.' },
  { id: 'snail', name: 'Armored Snail', hp: 260, speed: 13, dmg: 14, nectar: 14, score: 160, armor: 4, color: '#8a9ab5', dark: '#4a5a75', desc: 'Shell armor soaks 4 per hit. Very slow.' },
  { id: 'slug', name: 'Splitter Slug', hp: 90, speed: 22, dmg: 8, nectar: 8, score: 110, color: '#7ae08a', dark: '#2e7a3d', desc: 'Splits into two Grubs when killed.' },
  { id: 'wasp', name: 'Spitter Wasp', hp: 70, speed: 24, dmg: 5, nectar: 11, score: 140, range: 170, color: '#e8d44d', dark: '#94820b', desc: 'Stops and spits at plants from range.' },
  { id: 'mole', name: 'Burrow Mole', hp: 110, speed: 30, dmg: 10, nectar: 12, score: 150, color: '#9a6b4f', dark: '#5c3d28', desc: 'Burrows untargetable until mid-lane.' },
  { id: 'mantis', name: 'Shield Mantis', hp: 150, speed: 20, dmg: 12, nectar: 15, score: 180, shield: 60, color: '#4fd8a8', dark: '#1f7a5c', desc: 'Leaf shield blocks the first 60 damage.' },
];
export const PEST_BY_ID = Object.fromEntries(PESTS.map((p) => [p.id, p]));

export const BOSS = {
  id: 'king', name: 'The Compost King', hp: 5200, speed: 7, dmg: 40,
  nectar: 300, score: 5000, color: '#7a5a2e', dark: '#453114',
  desc: 'Wave 30. A mountain of mulch that spawns Grubs and stomps plants flat.',
};

// 8 drafted seed-packet powers: the collectible layer. Drafted 1-of-3
// between waves; each has a real, stacking effect in main.js.
export const POWERS = [
  { id: 'pollen', name: 'Golden Pollen', icon: '✿', desc: '+15% damage for every plant, forever.', },
  { id: 'roots', name: 'Thick Roots', icon: '♣', desc: '+25% max HP for every plant, forever.', },
  { id: 'sap', name: 'Swift Sap', icon: '»', desc: 'Plants fire 12% faster, forever.', },
  { id: 'spring', name: 'Nectar Spring', icon: '❀', desc: '+20% nectar from kills and blooms.', },
  { id: 'crown', name: 'Frost Crown', icon: '❄', desc: 'Frost slows 20% harder and lasts +1s.', },
  { id: 'aura', name: 'Thorn Aura', icon: '✦', desc: 'Plants reflect 30% of bite damage back.', },
  { id: 'charm', name: 'Sun Charm', icon: '☀', desc: 'Sunblooms ripen 35% faster.', },
  { id: 'bark', name: 'Gate Bark', icon: '▣', desc: '+40 max gate HP and repair 25 now.', },
];
export const POWER_BY_ID = Object.fromEntries(POWERS.map((p) => [p.id, p]));

export const DIFFICULTIES = [
  { id: 'sprout', name: 'Sprout', hpMul: 0.8, nectarMul: 1.25, scoreMul: 1.0, desc: 'Gentle pests, rich nectar.' },
  { id: 'gardener', name: 'Gardener', hpMul: 1.0, nectarMul: 1.0, scoreMul: 1.5, desc: 'The intended siege. Score x1.5.' },
  { id: 'siege', name: 'Siege Master', hpMul: 1.3, nectarMul: 0.9, scoreMul: 2.2, desc: 'Brutal pests. Score x2.2.' },
];

export const TOTAL_WAVES = 30;
export const START_NECTAR = 150;
export const GATE_HP = 100;

export const SCORE = {
  leakFreeWave: 250,   // base, multiplied by the leak-free chain
  waveClear: 150,
  gardenClear: 1000,
  bossDown: 5000,
};
