// SPROUT SIEGE world logic: wave compositions, spawn queues and the draft
// deck. Pure functions over a seeded RNG so any wave is reproducible.

import { LANES, PESTS, PEST_BY_ID, BOSS, POWERS, TOTAL_WAVES } from './config.js';
import { makeRng, randInt, shuffle } from './rng.js';

// Which pest types are unlocked by a given wave (1-based).
export function unlockedPests(wave) {
  const ids = ['grub'];
  if (wave >= 2) ids.push('beetle');
  if (wave >= 4) ids.push('slug');
  if (wave >= 6) ids.push('snail');
  if (wave >= 9) ids.push('wasp');
  if (wave >= 13) ids.push('mole');
  if (wave >= 17) ids.push('mantis');
  return ids;
}

// Build the spawn queue for a wave: an array of { type, lane, delay }.
// Count and HP scale with the wave; composition weights favour the newest
// unlocks slightly so each garden teaches its new pest. Wave 30 is the boss
// plus an escort trickle. Endless waves (31+) keep scaling forever.
export function buildWave(wave, seed, difficulty) {
  const rng = makeRng((seed ^ (wave * 2654435761)) >>> 0);
  const queue = [];
  const endless = wave > TOTAL_WAVES;
  const effWave = endless ? TOTAL_WAVES + (wave - TOTAL_WAVES) * 0.7 : wave;
  const count = Math.round(6 + effWave * 1.55);
  const pool = unlockedPests(Math.min(wave, TOTAL_WAVES));
  const weights = { grub: 34, beetle: 20, slug: 14, snail: 12, wasp: 10, mole: 9, mantis: 8 };
  let t = 1.2;
  for (let i = 0; i < count; i++) {
    let total = 0;
    for (const id of pool) total += weights[id] || 5;
    let roll = rng() * total;
    let type = pool[0];
    for (const id of pool) { roll -= weights[id] || 5; if (roll <= 0) { type = id; break; } }
    const lane = randInt(rng, 0, LANES - 1);
    t += Math.max(0.45, 1.5 - effWave * 0.028) * (0.55 + rng() * 0.9);
    queue.push({ type, lane, delay: t });
  }
  // Every 5th wave ends with a mini-surge in one lane.
  if (wave % 5 === 0 && wave !== TOTAL_WAVES) {
    const lane = randInt(rng, 0, LANES - 1);
    for (let i = 0; i < 4; i++) queue.push({ type: 'beetle', lane, delay: t + 0.7 + i * 0.5 });
  }
  if (wave === TOTAL_WAVES) {
    queue.push({ type: 'king', lane: 2, delay: 2.0 });
    for (let i = 0; i < 10; i++) {
      queue.push({ type: i % 3 === 0 ? 'mantis' : 'grub', lane: randInt(rng, 0, LANES - 1), delay: 6 + i * 3.4 });
    }
    queue.sort((a, b) => a.delay - b.delay);
  }
  return queue;
}

// HP / speed scaling for a spawned pest.
export function pestStats(typeId, wave, difficulty) {
  const base = typeId === 'king' ? BOSS : PEST_BY_ID[typeId];
  const growth = 1 + (wave - 1) * 0.16 + Math.max(0, wave - TOTAL_WAVES) * 0.22;
  return {
    hp: Math.round(base.hp * growth * difficulty.hpMul),
    maxHp: Math.round(base.hp * growth * difficulty.hpMul),
    speed: base.speed * (1 + Math.min(0.35, (wave - 1) * 0.008)),
    dmg: base.dmg,
    nectar: Math.round(base.nectar * difficulty.nectarMul),
    score: base.score,
    shield: base.shield ? Math.round(base.shield * growth) : 0,
    maxShield: base.shield ? Math.round(base.shield * growth) : 0,
    armor: base.armor || 0,
    range: base.range || 0,
  };
}

// Human-readable incoming panel: [{ name, count }] for a wave queue.
export function waveSummary(queue) {
  const counts = new Map();
  for (const q of queue) counts.set(q.type, (counts.get(q.type) || 0) + 1);
  const out = [];
  for (const [id, n] of counts) {
    const name = id === 'king' ? BOSS.name : PEST_BY_ID[id].name;
    out.push({ id, name, count: n });
  }
  return out;
}

// Draft: 3 distinct seed packets offered between waves. Already-owned powers
// stay in the deck (they stack), so the deck never empties.
export function draftChoices(seed, wave, ownedCount) {
  const rng = makeRng((seed ^ (wave * 40503) ^ 0xd2a7) >>> 0);
  return shuffle(rng, POWERS).slice(0, 3);
}

export { PESTS };
