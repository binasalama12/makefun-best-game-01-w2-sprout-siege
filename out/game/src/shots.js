// Deterministic screenshot scenes for SPROUT SIEGE, driven by the URL:
//   ?shot=boss&seed=7   wave 30 climax vs The Compost King, full HUD
//   ?shot=draft&seed=7  the between-wave seed-packet draft (meta screen)
//   ?shot=title&seed=7  the dense title: how-to + bestiaries + difficulties
//   ?shot=end&seed=7    victory end screen: rank, 10 stats, collection recap
// Each scene is built from the game's own systems with a fixed seed; the
// main loop fixed-steps combat scenes, then window.__shotReady is raised.

import { PLANT_BY_ID, POWER_BY_ID, TOTAL_WAVES } from './config.js';
import { waveSummary, buildWave } from './world.js';

function plant(state, lane, col, id) {
  const def = PLANT_BY_ID[id];
  const hp = Math.round(def.hp * 1.5);
  state.plants.push({ lane, col, def, id, hp, maxHp: hp, timer: Math.random() * 0.5, flash: 0 });
}
function stageGarden(state) {
  // A mature, varied defence across all five lanes.
  const rows = [
    ['bloom', 'piper', 'fern', 'berry', 'thorn', 'vine', null],
    ['bloom', 'bulb', 'piper', 'melon', 'fern', 'piper', null],
    ['bloom', 'piper', 'vine', 'bulb', 'berry', 'thorn', null],
    ['bloom', 'fern', 'piper', 'berry', 'bulb', 'melon', null],
    ['bloom', 'piper', 'thorn', 'fern', 'vine', 'piper', null],
  ];
  rows.forEach((row, lane) => row.forEach((id, col) => { if (id) plant(state, lane, col, id); }));
}

export function setupShotScene(state, api) {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot) return false;
  state.shotMode = shot;
  state.seed = parseInt(params.get('seed') || '7', 10) || 7;

  if (shot === 'boss') {
    state.mode = 'play'; state.phase = 'combat'; state.wave = TOTAL_WAVES;
    state.nectar = 235; state.gateMax = 140; state.gateHp = 64;
    state.score = 48750; state.chain = 9; state.bestChain = 11;
    state.kills = 812; state.planted = 74; state.nectarEarned = 5210; state.wavesCleared = 29;
    state.elapsed = 21 * 60 + 34;
    state.powers = ['pollen', 'roots', 'sap', 'spring', 'pollen', 'aura', 'crown'];
    stageGarden(state);
    state.spawnQueue = [];
    api.spawnPest('king', 2, 760);
    const king = state.pests[state.pests.length - 1];
    king.hp = Math.round(king.maxHp * 0.52);
    api.spawnPest('mantis', 0, 880); api.spawnPest('snail', 1, 905);
    api.spawnPest('wasp', 3, 860); api.spawnPest('beetle', 4, 815);
    api.spawnPest('slug', 2, 905); api.spawnPest('mole', 1, 640);
    const mole = state.pests[state.pests.length - 1]; mole.burrowed = true;
    api.spawnPest('grub', 0, 700); api.spawnPest('grub', 4, 930);
    state.incoming = waveSummary([{ type: 'king' }, { type: 'mantis' }, { type: 'mantis' }, { type: 'grub' }, { type: 'grub' }, { type: 'grub' }, { type: 'snail' }, { type: 'wasp' }]);
    state.banner = { title: 'WAVE 30 — THE COMPOST KING', sub: 'Fell the King and the garden is yours!', color: '#ff8a7a' };
    state.bannerT = 99; state.bannerDur = 99;
    return true;
  }

  if (shot === 'draft') {
    state.mode = 'draft'; state.phase = 'build'; state.wave = 18;
    state.nectar = 310; state.gateMax = 140; state.gateHp = 118;
    state.score = 27480; state.chain = 4; state.bestChain = 6;
    state.kills = 402; state.planted = 41; state.nectarEarned = 2980; state.wavesCleared = 17;
    state.elapsed = 12 * 60 + 8;
    state.powers = ['pollen', 'spring', 'roots', 'pollen', 'charm'];
    state.draftOptions = [POWER_BY_ID.sap, POWER_BY_ID.aura, POWER_BY_ID.bark];
    state.draftLeakFree = true; state.lastChainBonus = 1250;
    state.draftHover = 1;
    stageGarden(state);
    state.incoming = waveSummary(buildWave(18, state.seed, state.difficulty));
    return true;
  }

  if (shot === 'title') {
    state.mode = 'title'; state.wave = 8;
    state.nectar = 150; state.score = 0;
    state.best = 62480;
    stageGarden(state);
    api.spawnPest('grub', 1, 880); api.spawnPest('beetle', 3, 930); api.spawnPest('slug', 0, 800);
    for (const p of state.pests) p.x -= 0; // staged, frozen by title mode
    state.incoming = waveSummary(buildWave(1, state.seed, state.difficulty));
    return true;
  }

  if (shot === 'end') {
    state.mode = 'end'; state.victory = true; state.wave = TOTAL_WAVES;
    state.gateMax = 140; state.gateHp = 96;
    state.score = 62480; state.best = 62480;
    state.chain = 14; state.bestChain = 14;
    state.kills = 947; state.planted = 88; state.nectarEarned = 6345;
    state.wavesCleared = 30; state.bossDown = true;
    state.elapsed = 26 * 60 + 41;
    state.nectar = 420;
    state.powers = ['pollen', 'roots', 'sap', 'spring', 'crown', 'aura', 'charm', 'bark', 'pollen', 'sap'];
    stageGarden(state);
    state.incoming = [];
    return true;
  }

  return false;
}
