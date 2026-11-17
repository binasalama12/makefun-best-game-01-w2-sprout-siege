// SPROUT SIEGE — main loop and game state.
//
// Plant living turrets from seed packets on a 5-lane trellis. Pests march
// the lanes in waves; kills and Sunblooms pay nectar; between waves you
// draft 1 of 3 new seed packets whose powers stack forever. Hold the garden
// gate through 3 gardens x 10 waves and fell The Compost King on wave 30,
// then keep going in the Endless Greenhouse.

import { GRID, COLS, LANES, GATE_X, SPAWN_X, PLANTS, PLANT_BY_ID, PEST_BY_ID, BOSS, POWER_BY_ID, DIFFICULTIES, TOTAL_WAVES, START_NECTAR, GATE_HP, SCORE, gardenIndexForWave } from './config.js';
import { buildWave, pestStats, waveSummary, draftChoices } from './world.js';
import { drawBackground, drawGate, drawPlant, drawPest, drawProjectiles, drawLightning, drawFx, burst, pollen, floatText, updateFx, clearFx, cellCenter } from './render.js';
import { drawTopBar, drawSidePanels, drawSeedBar, drawBanner } from './hud.js';
import { drawTitleScreen, drawDraftScreen, drawEndScreen } from './screens.js';
import { attachInput, cellAt, draftIndexAt, difficultyAt, packetAt, waveButtonAt } from './input.js';
import { initAudio, sfx } from './audio.js';
import { setupShotScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const BASE_SEED = 20261118;

const state = {
  mode: 'title',           // title | play | draft | end
  phase: 'build',          // build | combat (within play)
  wave: 1, time: 0, elapsed: 0,
  nectar: START_NECTAR, gateHp: GATE_HP, gateMax: GATE_HP,
  score: 0, chain: 0, bestChain: 0,
  plants: [], pests: [], projectiles: [], bolts: [],
  spawnQueue: [], waveTime: 0, waveLeaked: false,
  powers: [], draftOptions: [], draftHover: -1, draftLeakFree: false, lastChainBonus: 0,
  incoming: [], nextIncoming: [],
  selectedPlant: 'piper', shovel: false,
  kills: 0, planted: 0, nectarEarned: 0, wavesCleared: 0, bossDown: false,
  victory: false, endless: false, paused: false, speed: 1,
  difficulty: DIFFICULTIES[1],
  banner: null, bannerT: 0, bannerDur: 0,
  seed: BASE_SEED, shotMode: null,
  best: parseInt(localStorage.getItem('sprout-best') || '0', 10) || 0,
  mouse: { x: 0, y: 0 },
};
window.__sprout = state;

// ---- power helpers ---------------------------------------------------------

const pCount = (id) => state.powers.filter((p) => p === id).length;
const dmgMul = () => 1 + 0.15 * pCount('pollen');
const rateMul = () => 1 + 0.12 * pCount('sap');
const nectarMul = () => 1 + 0.2 * pCount('spring');
const frostMul = () => 1 + 0.2 * pCount('crown');
const bloomMul = () => 1 + 0.35 * pCount('charm');

function gainNectar(n, x, y) {
  const v = Math.round(n * nectarMul());
  state.nectar += v; state.nectarEarned += v;
  if (x !== undefined) floatText(x, y, `+${v} 🍯`, '#ffd94d', 15);
}
function gainScore(n, x, y) {
  const v = Math.round(n * state.difficulty.scoreMul);
  state.score += v;
  if (x !== undefined) floatText(x, y, `+${v.toLocaleString('en-US')}`, '#fff7d6', 14);
}
function setBanner(title, sub, color = '#ffd94d', dur = 2.6) {
  state.banner = { title, sub, color };
  state.bannerT = dur; state.bannerDur = dur;
  sfx.banner();
}

// ---- planting / spawning -----------------------------------------------------

function plantAt(lane, col, id) {
  const def = PLANT_BY_ID[id];
  if (!def) return false;
  if (state.plants.some((p) => p.lane === lane && p.col === col)) return false;
  if (state.nectar < def.cost) { floatText(GRID.x + col * 118 + 59, GRID.y + lane * 94 + 30, 'Need more 🍯!', '#ff8a7a', 15); return false; }
  state.nectar -= def.cost;
  const hp = Math.round(def.hp * (1 + 0.25 * pCount('roots')));
  state.plants.push({ lane, col, def, id, hp, maxHp: hp, timer: 0.4, flash: 0 });
  state.planted++;
  burst(GRID.x + col * 118 + 59, GRID.y + lane * 94 + 60, '#5ec94f', 8, 60);
  sfx.plant();
  return true;
}

function spawnPest(type, lane, x = SPAWN_X) {
  const def = type === 'king' ? BOSS : PEST_BY_ID[type];
  const st = pestStats(type, state.wave, state.difficulty);
  state.pests.push({
    type, def, lane, x,
    hp: st.hp, maxHp: st.maxHp, shield: st.shield, maxShield: st.maxShield,
    armor: st.armor, speed: st.speed, dmg: st.dmg, nectar: st.nectar, score: st.score,
    range: st.range, slowT: 0, slowMul: 1, chewT: 0, spitT: 1 + Math.random(), spawnT: 3,
    burrowed: type === 'mole', seedling: Math.random() * 10,
  });
}

function startWave() {
  state.spawnQueue = buildWave(state.wave, state.seed, state.difficulty);
  state.incoming = waveSummary(state.spawnQueue);
  state.waveTime = 0; state.waveLeaked = false; state.phase = 'combat';
  const gNames = ['Verdant Trellis', 'Thornwood Hollow', 'Ember Conservatory'];
  if (state.wave === TOTAL_WAVES) setBanner('WAVE 30 — THE COMPOST KING', 'Fell the King and the garden is yours!', '#ff8a7a', 3.4);
  else if ((state.wave - 1) % 10 === 0 && state.wave > 1) setBanner(`WAVE ${state.wave} — ${gNames[gardenIndexForWave(state.wave)]}`, 'A new garden. New pests join the march.', '#8ae06a', 3);
  else setBanner(`WAVE ${state.wave}`, `${state.spawnQueue.length} pests incoming — hold the gate!`, '#ffd94d', 2.2);
}

function endWave() {
  state.wavesCleared = Math.max(state.wavesCleared, Math.min(state.wave, TOTAL_WAVES));
  let bonus = SCORE.waveClear;
  state.draftLeakFree = !state.waveLeaked;
  if (!state.waveLeaked) {
    state.chain++; state.bestChain = Math.max(state.bestChain, state.chain);
    state.lastChainBonus = SCORE.leakFreeWave * state.chain;
    bonus += state.lastChainBonus;
  } else {
    state.chain = 0; state.lastChainBonus = 0;
  }
  if (state.wave % 10 === 0 && state.wave < TOTAL_WAVES) bonus += SCORE.gardenClear;
  gainScore(bonus);
  if (state.wave >= TOTAL_WAVES && !state.endless) {
    state.victory = true; state.bossDown = true;
    finishRun();
    return;
  }
  state.draftOptions = draftChoices(state.seed, state.wave, state.powers.length);
  state.mode = 'draft';
  sfx.draft();
}

function pickDraft(i) {
  const p = state.draftOptions[i];
  if (!p) return;
  state.powers.push(p.id);
  if (p.id === 'bark') {
    state.gateMax += 40;
    state.gateHp = Math.min(state.gateMax, state.gateHp + 65);
    floatText(300, 300, 'Gate +40 max, +65 repaired!', '#8ae06a', 18);
  }
  if (p.id === 'roots') {
    for (const pl of state.plants) { const add = Math.round(pl.def.hp * 0.25); pl.maxHp += add; pl.hp += add; }
  }
  state.wave++;
  state.phase = 'build';
  state.mode = 'play';
  state.nextIncoming = waveSummary(buildWave(state.wave, state.seed, state.difficulty));
  state.incoming = state.nextIncoming;
  setBanner(`WAVE ${state.wave} — PLANT YOUR DEFENCES`, `${p.name} joins your collection. Press Space when ready.`, '#8ae06a', 2.4);
}

function finishRun() {
  state.mode = 'end';
  if (state.score > state.best) {
    state.best = state.score;
    try { localStorage.setItem('sprout-best', String(state.best)); } catch { /* private */ }
  }
  if (state.victory) sfx.win(); else sfx.lose();
}

function startRun() {
  state.nectar = START_NECTAR; state.gateHp = GATE_HP; state.gateMax = GATE_HP;
  state.score = 0; state.chain = 0; state.bestChain = 0;
  state.plants = []; state.pests = []; state.projectiles = []; state.bolts = [];
  state.powers = []; state.wave = 1; state.elapsed = 0;
  state.kills = 0; state.planted = 0; state.nectarEarned = 0; state.wavesCleared = 0;
  state.bossDown = false; state.victory = false; state.endless = false;
  state.phase = 'build'; state.mode = 'play'; state.paused = false; state.speed = 1;
  state.incoming = waveSummary(buildWave(1, state.seed, state.difficulty));
  clearFx();
  setBanner('SPROUT SIEGE', 'Plant defenders, then press Space to unleash wave 1.', '#ffd94d', 3);
}

function startEndless() {
  state.endless = true; state.mode = 'play'; state.phase = 'build';
  state.wave = TOTAL_WAVES + 1;
  state.incoming = waveSummary(buildWave(state.wave, state.seed, state.difficulty));
  setBanner('ENDLESS GREENHOUSE', 'Waves scale forever. How long can the garden hold?', '#8ae06a', 3);
}

// ---- combat ------------------------------------------------------------------

function damagePest(pest, raw, kind) {
  let dmg = raw;
  if (pest.shield > 0) {
    const absorbed = Math.min(pest.shield, dmg);
    pest.shield -= absorbed; dmg -= absorbed;
    if (absorbed > 0) floatText(pest.x, pestY(pest) - 46, `shield -${Math.round(absorbed)}`, '#a8ffd8', 12);
    if (dmg <= 0) return;
  }
  dmg = Math.max(1, dmg - (pest.armor || 0));
  pest.hp -= dmg;
  if (kind === 'frost') {
    const def = PLANT_BY_ID.fern;
    pest.slowMul = Math.min(pest.slowMul, 1 - def.slow * frostMul());
    pest.slowT = Math.max(pest.slowT, def.slowDur + (pCount('crown') > 0 ? 1 : 0));
  }
  if (pest.hp <= 0 && !pest.dead) killPest(pest);
}
function pestY(pest) { return GRID.y + pest.lane * GRID.cellH + GRID.cellH / 2; }

function killPest(pest) {
  pest.dead = true;
  state.kills++;
  const { x } = pest; const y = pestY(pest);
  burst(x, y, pest.def.color, pest.type === 'king' ? 46 : 13, pest.type === 'king' ? 170 : 100);
  gainNectar(pest.nectar, x, y - 18);
  gainScore(pest.score, x, y - 36);
  floatText(x, y + 8, pest.type === 'king' ? 'KING COMPOSTED!' : 'composted!', '#8ae06a', pest.type === 'king' ? 22 : 13);
  sfx.pop();
  if (pest.type === 'slug') {
    spawnPest('grub', pest.lane, x + 16); spawnPest('grub', pest.lane, x + 40);
    const g1 = state.pests[state.pests.length - 2], g2 = state.pests[state.pests.length - 1];
    if (g1) { g1.hp = Math.round(g1.hp * 0.7); g1.maxHp = g1.hp; }
    if (g2) { g2.hp = Math.round(g2.hp * 0.7); g2.maxHp = g2.hp; }
  }
  if (pest.type === 'king') {
    state.bossDown = true;
    gainScore(SCORE.bossDown);
    setBanner('THE COMPOST KING IS MULCH!', '+5,000 — the garden erupts in pollen!', '#ffd94d', 3.4);
  }
}

function firePlant(pl) {
  const def = pl.def;
  const cx = GRID.x + pl.col * GRID.cellW + GRID.cellW / 2 + 16;
  const cy = GRID.y + pl.lane * GRID.cellH + GRID.cellH / 2 - 14;
  const targets = state.pests.filter((p) => p.lane === pl.lane && !p.dead && !p.burrowed && p.x > cx - 6);
  if (def.role === 'economy') {
    gainNectar(def.yield, cx - 16, cy - 26);
    burst(cx - 16, cy - 10, '#ffd94d', 7, 55);
    sfx.nectar();
    return;
  }
  if (!targets.length) return;
  targets.sort((a, b) => a.x - b.x);
  const t = targets[0];
  pl.flash = 0.12;
  if (def.role === 'chain') {
    const chainTargets = [t];
    const others = state.pests.filter((p) => p !== t && !p.dead && !p.burrowed && Math.abs(p.x - t.x) < 150 && Math.abs(p.lane - t.lane) <= 1)
      .sort((a, b) => Math.abs(a.x - t.x) - Math.abs(b.x - t.x)).slice(0, (def.chain || 3) - 1);
    chainTargets.push(...others);
    let px = cx, py = cy;
    for (const ct of chainTargets) {
      state.bolts.push({ x1: px, y1: py, x2: ct.x, y2: pestY(ct), ttl: 0.14 });
      damagePest(ct, def.dmg * dmgMul(), 'chain');
      px = ct.x; py = pestY(ct);
    }
    sfx.shoot();
    return;
  }
  if (def.role === 'mortar') {
    state.projectiles.push({ kind: 'melon', x: cx, y: cy, sx: cx, sy: cy, tx: t.x, groundY: pestY(t) + 14, prog: 0, flight: 0.85, lane: pl.lane, dmg: def.dmg * dmgMul(), splash: def.splash });
    sfx.shoot();
    return;
  }
  const kind = def.role === 'shooter' ? 'pea' : def.role === 'frost' ? 'frost' : def.role === 'splash' ? 'berry' : 'thorn';
  state.projectiles.push({ kind, x: cx, y: cy, vx: 540, lane: pl.lane, dmg: def.dmg * dmgMul(), splash: def.splash || 0 });
  sfx.shoot();
}

function update(dt) {
  state.time += dt;
  if (state.bannerT > 0) state.bannerT -= dt;
  updateFx(dt);
  if (Math.random() < dt * 6) pollen(state);
  for (const b of state.bolts) b.ttl -= dt;
  state.bolts = state.bolts.filter((b) => b.ttl > 0);
  if (state.mode !== 'play' || state.paused) return;
  state.elapsed += dt;
  for (const pl of state.plants) if (pl.flash > 0) pl.flash -= dt;

  if (state.phase === 'combat') {
    state.waveTime += dt;
    while (state.spawnQueue.length && state.spawnQueue[0].delay <= state.waveTime) {
      const s = state.spawnQueue.shift();
      spawnPest(s.type, s.lane);
    }
  }

  // Plants act.
  for (const pl of state.plants) {
    if (pl.def.role === 'wall') continue;
    pl.timer -= dt;
    if (pl.timer <= 0) {
      const before = state.projectiles.length + state.bolts.length;
      firePlant(pl);
      const fired = state.projectiles.length + state.bolts.length > before || pl.def.role === 'economy';
      const baseRate = pl.def.role === 'economy' ? pl.def.rate / bloomMul() : pl.def.rate / rateMul();
      pl.timer = fired ? baseRate : 0.18;
    }
  }

  // Projectiles.
  for (const pr of state.projectiles) {
    if (pr.kind === 'melon') {
      pr.prog += dt / pr.flight;
      pr.x = pr.sx + (pr.tx - pr.sx) * pr.prog;
      pr.y = pr.sy + (pr.groundY - 14 - pr.sy) * pr.prog;
      if (pr.prog >= 1) {
        pr.done = true;
        burst(pr.tx, pr.groundY, '#4fb86e', 16, 120);
        for (const p of state.pests) {
          if (p.dead || p.burrowed) continue;
          const d = Math.hypot(p.x - pr.tx, pestY(p) + 14 - pr.groundY);
          if (d <= pr.splash + 18) damagePest(p, pr.dmg, 'melon');
        }
      }
      continue;
    }
    if (pr.kind === 'spit') {
      pr.x += pr.vx * dt;
      const pl = state.plants.find((p) => p.lane === pr.lane && p.col === pr.targetCol);
      if (!pl || pl.hp <= 0) { pr.done = true; continue; }
      const tx = GRID.x + pr.targetCol * GRID.cellW + GRID.cellW / 2;
      if (pr.x <= tx + 8) {
        pr.done = true;
        pl.hp -= pr.dmg; pl.flash = 0.15;
        burst(tx, pestY({ lane: pr.lane }), '#d8e84d', 5, 60);
        if (pl.hp <= 0) removePlant(pl);
      }
      continue;
    }
    pr.x += pr.vx * dt;
    if (pr.x > SPAWN_X + 60) { pr.done = true; continue; }
    const hit = state.pests.filter((p) => p.lane === pr.lane && !p.dead && !p.burrowed && Math.abs(p.x - pr.x) < 22)
      .sort((a, b) => a.x - b.x)[0];
    if (hit) {
      pr.done = true;
      if (pr.splash) {
        burst(hit.x, pestY(hit), '#ff6b8a', 12, 110);
        for (const p of state.pests) {
          if (p.dead || p.burrowed) continue;
          if (Math.hypot(p.x - hit.x, pestY(p) - pestY(hit)) <= pr.splash + 14) damagePest(p, pr.dmg, pr.kind);
        }
      } else {
        damagePest(hit, pr.dmg, pr.kind);
        burst(pr.x, pr.y, '#ffffff', 4, 50);
      }
    }
  }
  state.projectiles = state.projectiles.filter((p) => !p.done);

  // Pests act.
  for (const pest of state.pests) {
    if (pest.dead) continue;
    if (pest.slowT > 0) { pest.slowT -= dt; if (pest.slowT <= 0) pest.slowMul = 1; }
    const y = pestY(pest);
    if (pest.burrowed && pest.x < GRID.x + COLS * GRID.cellW * 0.45) {
      pest.burrowed = false;
      burst(pest.x, y + 10, '#9a6b4f', 12, 80);
      floatText(pest.x, y - 30, 'SURFACED!', '#ffb347', 13);
    }
    // Boss spawns grubs.
    if (pest.type === 'king') {
      pest.spawnT -= dt;
      if (pest.spawnT <= 0) { pest.spawnT = 5.5; spawnPest('grub', pest.lane, pest.x + 60); floatText(pest.x, y - 110, 'The King sheds a Grub!', '#ff8a7a', 13); }
    }
    // Find plant being chewed: the rightmost plant whose cell front is at/behind pest front.
    const frontX = pest.x - 16;
    const col = Math.floor((frontX - GRID.x) / GRID.cellW);
    const target = (!pest.burrowed && col >= 0 && col < COLS)
      ? state.plants.find((p) => p.lane === pest.lane && p.col === col) : null;
    // Wasp ranged behaviour.
    if (pest.type === 'wasp' && !pest.burrowed) {
      const ahead = state.plants.filter((p) => p.lane === pest.lane && (GRID.x + p.col * GRID.cellW + GRID.cellW / 2) < pest.x)
        .sort((a, b) => b.col - a.col)[0];
      if (ahead && pest.x - (GRID.x + ahead.col * GRID.cellW + GRID.cellW / 2) <= pest.range) {
        pest.spitT -= dt;
        if (pest.spitT <= 0) {
          pest.spitT = 1.5;
          state.projectiles.push({ kind: 'spit', x: pest.x - 14, y: y - 6, vx: -330, lane: pest.lane, targetCol: ahead.col, dmg: 9 });
        }
        continue;
      }
    }
    if (target) {
      pest.chewT += dt;
      const dps = pest.dmg * (pest.type === 'king' ? 3.2 : 1.5);
      target.hp -= dps * dt; target.flash = Math.max(target.flash, 0.05);
      const reflect = 0.3 * pCount('aura');
      if (reflect > 0) pest.hp -= dps * reflect * dt;
      if (pest.hp <= 0 && !pest.dead) killPest(pest);
      if (target.hp <= 0) removePlant(target);
    } else {
      pest.x -= pest.speed * pest.slowMul * dt * (pest.type === 'king' ? 1 : 1);
    }
    // Leak!
    if (pest.x < GATE_X) {
      pest.dead = true; pest.leaked = true;
      const gateDmg = pest.type === 'king' ? 40 : Math.max(4, Math.round(pest.dmg * 0.9));
      state.gateHp -= gateDmg;
      state.waveLeaked = true;
      burst(GATE_X, y, '#e84d4d', 18, 130);
      floatText(GATE_X + 30, y - 20, `GATE -${gateDmg}!`, '#ff8a7a', 18);
      sfx.leak();
      if (state.gateHp <= 0) {
        state.gateHp = 0;
        state.victory = false;
        finishRun();
        return;
      }
    }
  }
  state.pests = state.pests.filter((p) => !p.dead);

  // Wave cleared?
  if (state.phase === 'combat' && !state.spawnQueue.length && !state.pests.length && state.mode === 'play') {
    endWave();
  }
}

function removePlant(pl) {
  burst(GRID.x + pl.col * GRID.cellW + GRID.cellW / 2, GRID.y + pl.lane * GRID.cellH + 50, '#8a6a44', 12, 90);
  state.plants = state.plants.filter((p) => p !== pl);
  sfx.hurt();
}

// ---- render --------------------------------------------------------------------

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground(ctx, Math.min(state.wave, TOTAL_WAVES), state.time);
  // Hover highlight.
  if (state.mode === 'play' && state.phase !== 'combat' || state.mode === 'play') {
    const cell = cellAt(state.mouse.x, state.mouse.y);
    if (cell && state.mode === 'play') {
      ctx.fillStyle = state.shovel ? 'rgba(255,90,77,0.25)' : 'rgba(255,255,255,0.16)';
      ctx.fillRect(GRID.x + cell.col * GRID.cellW + 3, GRID.y + cell.lane * GRID.cellH + 3, GRID.cellW - 6, GRID.cellH - 6);
    }
  }
  drawGate(ctx, state, state.time);
  for (const pl of state.plants) drawPlant(ctx, pl, state.time);
  // Draw pests sorted so the boss towers behind its lane-mates visually.
  const sorted = [...state.pests].sort((a, b) => (a.type === 'king' ? -1 : 0) - (b.type === 'king' ? -1 : 0));
  for (const pest of sorted) drawPest(ctx, pest, state.time);
  drawProjectiles(ctx, state.projectiles);
  drawLightning(ctx, state.bolts);
  drawFx(ctx);
  drawTopBar(ctx, state);
  drawSidePanels(ctx, state);
  drawSeedBar(ctx, state);
  drawBanner(ctx, state);
  if (state.paused && state.mode === 'play') {
    ctx.fillStyle = 'rgba(6,10,4,0.6)'; ctx.fillRect(0, 54, canvas.width, 538);
    ctx.fillStyle = '#fff7d6'; ctx.font = 'bold 40px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('PAUSED', 520, 330);
    ctx.font = '16px Georgia, serif'; ctx.fillText('Press P to resume', 520, 362);
    ctx.textAlign = 'left';
  }
  if (state.mode === 'title') drawTitleScreen(ctx, state, state.time);
  else if (state.mode === 'draft') drawDraftScreen(ctx, state);
  else if (state.mode === 'end') drawEndScreen(ctx, state);
}

// ---- input handlers --------------------------------------------------------------

function onClick(pos, e) {
  initAudio();
  if (acResume()) { /* noop */ }
  if (state.mode === 'title') {
    const d = difficultyAt(pos.x, pos.y);
    if (d) { state.difficulty = d; sfx.draft(); return; }
    startRun();
    return;
  }
  if (state.mode === 'draft') {
    const i = draftIndexAt(pos.x, pos.y);
    if (i >= 0) { pickDraft(i); sfx.draft(); }
    return;
  }
  if (state.mode === 'end') {
    if (state.victory) return; // keys handle endless/new run
    startRun();
    return;
  }
  // play mode
  const pk = packetAt(pos.x, pos.y);
  if (pk) { state.selectedPlant = pk.id; state.shovel = false; sfx.shoot(); return; }
  if (state.phase === 'build' && waveButtonAt(pos.x, pos.y)) { startWave(); return; }
  const cell = cellAt(pos.x, pos.y);
  if (cell) {
    if (state.shovel || e.shiftKey) {
      const pl = state.plants.find((p) => p.lane === cell.lane && p.col === cell.col);
      if (pl) { removePlant(pl); gainNectar(Math.floor(pl.def.cost / 2)); floatText(pl.col * 118 + GRID.x + 59, GRID.y + cell.lane * 94 + 30, 'shovelled', '#b9d8a8', 13); }
      state.shovel = false;
      return;
    }
    plantAt(cell.lane, cell.col, state.selectedPlant);
  }
}
function acResume() { return false; }

function onKey(e) {
  initAudio();
  const k = e.key;
  if (state.mode === 'title') {
    if (k === 'Enter' || k === ' ') { e.preventDefault(); startRun(); }
    return;
  }
  if (state.mode === 'draft') {
    if (['1', '2', '3'].includes(k)) { pickDraft(parseInt(k, 10) - 1); sfx.draft(); }
    return;
  }
  if (state.mode === 'end') {
    if (k === 'Enter') startRun();
    else if ((k === 'e' || k === 'E') && state.victory) startEndless();
    return;
  }
  if (k >= '1' && k <= '8') { state.selectedPlant = PLANTS[parseInt(k, 10) - 1].id; state.shovel = false; }
  else if (k === 'x' || k === 'X') state.shovel = !state.shovel;
  else if (k === ' ') { e.preventDefault(); if (state.phase === 'build') startWave(); }
  else if (k === 'f' || k === 'F') state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 3 : 1;
  else if (k === 'p' || k === 'P') state.paused = !state.paused;
  else if (k === 'r' || k === 'R') startRun();
}

attachInput(canvas, {
  onMove: (pos) => {
    state.mouse = pos;
    if (state.mode === 'draft') state.draftHover = draftIndexAt(pos.x, pos.y);
  },
  onClick,
  onRightClick: () => { state.shovel = !state.shovel; },
  onKey,
});

// ---- boot / shot scenes -----------------------------------------------------------

const api = { startRun, startWave, plantAt, spawnPest, state };
const isShot = setupShotScene(state, api);

let last = performance.now();
let shotFrames = 0;
function frame(now) {
  const rawDt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!isShot) {
    const steps = state.speed;
    for (let i = 0; i < steps; i++) update(rawDt);
  }
  render();
  if (isShot) {
    shotFrames++;
    if (shotFrames >= 4) { window.__shotReady = true; return; }
  }
  requestAnimationFrame(frame);
}
if (isShot) {
  // Fixed-step the staged scene so two renders come out identical.
  for (let i = 0; i < 40; i++) update(1 / 30);
  render();
}
requestAnimationFrame(frame);
