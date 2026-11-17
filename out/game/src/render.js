// SPROUT SIEGE rendering: textured garden backgrounds, the gate, all plant
// and pest art, projectiles, particles, floating numbers, banners, the
// in-canvas HUD (top bar, incoming panel, collection panel, seed-packet
// bar) and the title / draft / end screens. Everything is drawn with canvas
// primitives — no assets, no network.

import { VIEW_W, VIEW_H, GRID, LANES, COLS, GATE_X, PLANTS, PESTS, BOSS, POWERS, DIFFICULTIES, TOTAL_WAVES, gardenForWave } from './config.js';
import { makeRng } from './rng.js';

export const particles = [];
export const floaters = [];

export function burst(x, y, color, n = 10, speed = 90) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.3 + Math.random() * 0.9);
    particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: 0.55 + Math.random() * 0.4, t: 0, color, r: 2 + Math.random() * 3 });
  }
}
export function pollen(state) {
  if (particles.length > 260) return;
  particles.push({ x: Math.random() * VIEW_W, y: GRID.y + Math.random() * 470, vx: -12 - Math.random() * 18, vy: 6 + Math.random() * 10, life: 3.2, t: 0, color: 'rgba(255,240,170,0.8)', r: 1.6 + Math.random() * 1.8, drift: true });
}
export function floatText(x, y, text, color = '#ffe94d', size = 17) {
  floaters.push({ x, y, text, color, size, t: 0, life: 1.15 });
}
export function updateFx(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.t += dt;
    if (p.t >= p.life) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (!p.drift) p.vy += 130 * dt;
  }
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i]; f.t += dt; f.y -= 34 * dt;
    if (f.t >= f.life) floaters.splice(i, 1);
  }
}
export function clearFx() { particles.length = 0; floaters.length = 0; }

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function cellCenter(lane, col) {
  return { x: GRID.x + col * GRID.cellW + GRID.cellW / 2, y: GRID.y + lane * GRID.cellH + GRID.cellH / 2 };
}
export { cellCenter };

// ---- background -----------------------------------------------------------

export function drawBackground(ctx, wave, time) {
  const g = gardenForWave(wave);
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, g.skyTop); grad.addColorStop(0.16, g.sky); grad.addColorStop(0.161, g.soil); grad.addColorStop(1, g.soilAlt);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Distant hedge silhouettes along the top of the soil band.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  const rngH = makeRng(991 + wave);
  for (let x = -20; x < VIEW_W; x += 46) {
    const h = 14 + rngH() * 22;
    ctx.beginPath(); ctx.arc(x + 23, 112, 20 + rngH() * 10, Math.PI, 0); ctx.fill();
    ctx.fillRect(x, 112 - h, 46, 4);
  }
  // Lane soil rows with alternating tint + seeded texture speckles.
  for (let lane = 0; lane < LANES; lane++) {
    const y = GRID.y + lane * GRID.cellH;
    ctx.fillStyle = lane % 2 ? g.lane : g.laneAlt;
    ctx.fillRect(GRID.x - 8, y + 3, GRID.cellW * COLS + 16, GRID.cellH - 6);
    ctx.fillStyle = g.path;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(GRID.x - 8, y + GRID.cellH / 2 - 5, GRID.cellW * COLS + 16, 10);
    ctx.globalAlpha = 1;
    const rng = makeRng(4000 + lane * 131 + Math.min(wave, 30));
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    for (let i = 0; i < 26; i++) {
      const sx = GRID.x + rng() * GRID.cellW * COLS;
      const sy = y + 8 + rng() * (GRID.cellH - 16);
      ctx.fillRect(sx, sy, 3, 2);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    for (let i = 0; i < 18; i++) {
      const sx = GRID.x + rng() * GRID.cellW * COLS;
      const sy = y + 8 + rng() * (GRID.cellH - 16);
      ctx.fillRect(sx, sy, 4, 2);
    }
    // Little wildflowers at cell corners (seeded, stable).
    for (let c = 0; c <= COLS; c++) {
      const fr = makeRng(7700 + lane * 57 + c * 13 + Math.min(wave, 30));
      if (fr() < 0.62) continue;
      const fx = GRID.x + c * GRID.cellW + (fr() - 0.5) * 14;
      const fy = y + 10 + fr() * 12;
      ctx.fillStyle = ['#ff8ab0', '#ffd94d', '#c9a0ff', '#ffffff'][Math.floor(fr() * 4)];
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2 + time * 0.3;
        ctx.beginPath(); ctx.arc(fx + Math.cos(a) * 3.4, fy + Math.sin(a) * 3.4, 2.1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.arc(fx, fy, 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Trellis posts + horizontal rails.
  ctx.fillStyle = g.trellis;
  for (let c = 0; c <= COLS; c++) {
    const x = GRID.x + c * GRID.cellW - 3;
    ctx.fillRect(x, GRID.y - 8, 6, GRID.cellH * LANES + 16);
  }
  ctx.globalAlpha = 0.55;
  ctx.fillRect(GRID.x - 8, GRID.y - 6, GRID.cellW * COLS + 16, 5);
  ctx.fillRect(GRID.x - 8, GRID.y + GRID.cellH * LANES + 1, GRID.cellW * COLS + 16, 5);
  ctx.globalAlpha = 1;
  // Cell hover grid lines.
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 1;
  for (let lane = 0; lane <= LANES; lane++) {
    ctx.beginPath(); ctx.moveTo(GRID.x, GRID.y + lane * GRID.cellH); ctx.lineTo(GRID.x + GRID.cellW * COLS, GRID.y + lane * GRID.cellH); ctx.stroke();
  }
}

// ---- gate -----------------------------------------------------------------

export function drawGate(ctx, state, time) {
  const g = gardenForWave(state.wave);
  const x = 62, w = 88, y = GRID.y - 6, h = GRID.cellH * LANES + 12;
  ctx.fillStyle = '#6b4a26'; rr(ctx, x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = g.trellis; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#7d5a30';
  for (let i = 0; i < 6; i++) ctx.fillRect(x + 8, y + 14 + i * 76, w - 16, 9);
  // Vines + leaves on the gate.
  ctx.strokeStyle = '#3f9a34'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x + 6, y + h - 8);
  ctx.bezierCurveTo(x + 30, y + h * 0.6, x + 8, y + h * 0.4, x + 26, y + 10); ctx.stroke();
  ctx.fillStyle = '#5ec94f';
  for (let i = 0; i < 7; i++) {
    const ly = y + 22 + i * 66 + Math.sin(time * 1.4 + i) * 2;
    ctx.beginPath(); ctx.ellipse(x + 16 + (i % 2) * 14, ly, 9, 5, i, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#fff7d6'; ctx.font = 'bold 15px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText('GATE', x + w / 2, y + 24);
  const frac = Math.max(0, state.gateHp / state.gateMax);
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; rr(ctx, x + 6, y + h - 24, w - 12, 12, 6); ctx.fill();
  ctx.fillStyle = frac > 0.35 ? '#5ec94f' : '#e84d4d';
  if (frac > 0) { rr(ctx, x + 6, y + h - 24, (w - 12) * frac, 12, 6); ctx.fill(); }
  ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Georgia, serif';
  ctx.fillText(`${Math.ceil(state.gateHp)}/${state.gateMax}`, x + w / 2, y + h - 14);
}

// ---- plants & pests ---------------------------------------------------------

function hpBar(ctx, x, y, w, frac, color = '#5ec94f') {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - w / 2, y, w, 5);
  ctx.fillStyle = frac > 0.35 ? color : '#e84d4d';
  ctx.fillRect(x - w / 2, y, w * Math.max(0, frac), 5);
}

export function drawPlant(ctx, plant, time) {
  const { x, y } = cellCenter(plant.lane, plant.col);
  const d = plant.def;
  const sway = Math.sin(time * 1.6 + plant.lane * 1.3 + plant.col) * 2;
  ctx.save(); ctx.translate(x, y + 16);
  // Soil mound + stem.
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(0, 14, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2f7a28'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(0, 14); ctx.quadraticCurveTo(sway, -4, sway * 1.4, -16); ctx.stroke();
  ctx.translate(sway * 1.4, -16);
  const flash = plant.flash > 0 ? 0.35 : 0;
  ctx.fillStyle = d.color;
  if (d.role === 'shooter') {
    ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = d.dark; ctx.fillRect(8, -6, 20, 12);
    ctx.fillStyle = '#bff0a8'; ctx.beginPath(); ctx.arc(-5, -6, 5, 0, Math.PI * 2); ctx.fill();
  } else if (d.role === 'frost') {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + time * 0.4;
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * 12, Math.sin(a) * 9, 11, 4.5, a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#eafcff'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
  } else if (d.role === 'splash') {
    for (const [ox, oy, r] of [[-10, 4, 11], [10, 4, 11], [0, -9, 12]]) {
      ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffb3c2'; ctx.beginPath(); ctx.arc(ox - 3, oy - 3, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = d.color;
    }
  } else if (d.role === 'sniper') {
    ctx.beginPath(); ctx.moveTo(-6, 14); ctx.lineTo(4, -24); ctx.lineTo(14, 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe9ff'; ctx.beginPath(); ctx.arc(4, -20, 4.4, 0, Math.PI * 2); ctx.fill();
  } else if (d.role === 'economy') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * 12, Math.sin(a) * 12, 8, 5, a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#b8860b'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
    const pulse = 0.6 + 0.4 * Math.sin(time * 3 + plant.col);
    ctx.strokeStyle = `rgba(255,217,77,${0.35 * pulse})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 20 + pulse * 4, 0, Math.PI * 2); ctx.stroke();
  } else if (d.role === 'wall') {
    ctx.fillStyle = d.color; rr(ctx, -19, -14, 38, 32, 12); ctx.fill();
    ctx.strokeStyle = d.dark; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-19, -2); ctx.lineTo(19, -2); ctx.moveTo(-19, 9); ctx.lineTo(19, 9); ctx.stroke();
    ctx.fillStyle = '#5ec94f'; ctx.beginPath(); ctx.ellipse(0, -18, 8, 4.6, 0.4, 0, Math.PI * 2); ctx.fill();
  } else if (d.role === 'chain') {
    ctx.strokeStyle = d.color; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-14, 14); ctx.bezierCurveTo(-12, -8, 10, -4, 8, -20); ctx.stroke();
    ctx.fillStyle = '#fff6b0';
    for (const [ox, oy] of [[-10, -2], [2, -8], [8, -19]]) { ctx.beginPath(); ctx.arc(ox, oy, 3.2, 0, Math.PI * 2); ctx.fill(); }
    if (plant.flash > 0) { ctx.strokeStyle = 'rgba(255,240,120,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -6, 24, 0, Math.PI * 2); ctx.stroke(); }
  } else if (d.role === 'mortar') {
    ctx.beginPath(); ctx.arc(0, 2, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = d.dark; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-20, 2); ctx.lineTo(20, 2); ctx.moveTo(0, -18); ctx.lineTo(0, 22); ctx.stroke();
    ctx.fillStyle = '#d8ffd0'; ctx.beginPath(); ctx.arc(-6, -7, 5, 0, Math.PI * 2); ctx.fill();
  }
  if (flash) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.beginPath(); ctx.arc(0, 0, 21, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  if (plant.hp < plant.maxHp) hpBar(ctx, x, y - 40, 44, plant.hp / plant.maxHp);
  // Ready glow for Sunbloom.
  if (d.role === 'economy' && plant.timer <= 0.4) {
    ctx.fillStyle = '#ffd94d'; ctx.font = 'bold 15px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('+25', x, y - 44);
  }
}

export function drawPest(ctx, pest, time) {
  const y = GRID.y + pest.lane * GRID.cellH + GRID.cellH / 2 + 14;
  const x = pest.x;
  const d = pest.def;
  const wob = Math.sin(time * 6 + pest.seedling) * 2;
  ctx.save(); ctx.translate(x, y + wob * 0.4);
  if (pest.type === 'mole' && pest.burrowed) {
    ctx.fillStyle = '#5c3d28'; ctx.beginPath(); ctx.ellipse(0, 10, 26, 10, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = d.color; ctx.beginPath(); ctx.arc(0, 2, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-4, 0, 2.4, 0, Math.PI * 2); ctx.arc(4, 0, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(-4, 0, 1.2, 0, Math.PI * 2); ctx.arc(4, 0, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    hpBar(ctx, x, y - 34, 40, pest.hp / pest.maxHp, '#e8a84d');
    return;
  }
  const s = pest.type === 'king' ? 2.6 : 1;
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 13, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
  if (pest.type === 'king') {
    ctx.fillStyle = d.color; ctx.beginPath(); ctx.ellipse(0, 2, 30, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = d.dark;
    for (const [ox, oy, r] of [[-16, -8, 8], [12, -12, 9], [0, 4, 10], [-6, -18, 7]]) { ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath(); ctx.moveTo(-12, -26); ctx.lineTo(-8, -36); ctx.lineTo(-2, -28); ctx.lineTo(4, -37); ctx.lineTo(9, -27); ctx.lineTo(14, -33); ctx.lineTo(13, -23); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff5a4d'; ctx.beginPath(); ctx.arc(-9, -4, 3.4, 0, Math.PI * 2); ctx.arc(9, -4, 3.4, 0, Math.PI * 2); ctx.fill();
  } else if (pest.type === 'snail') {
    ctx.fillStyle = d.color; ctx.beginPath(); ctx.arc(-4, -2, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = d.dark; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-4, -2, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(-4, -2, 4, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#d8e2f0'; ctx.beginPath(); ctx.ellipse(12, 8, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
  } else if (pest.type === 'wasp') {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    const flap = Math.sin(time * 30 + pest.seedling) * 5;
    ctx.beginPath(); ctx.ellipse(-6, -14 - flap * 0.3, 11, 4.5, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8, -14 + flap * 0.3, 11, 4.5, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = d.color; ctx.beginPath(); ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222'; ctx.fillRect(-8, -9, 5, 18); ctx.fillRect(3, -9, 5, 18);
  } else if (pest.type === 'mantis') {
    ctx.fillStyle = d.color; ctx.beginPath(); ctx.ellipse(2, 0, 14, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = d.dark; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(-8, 2); ctx.lineTo(-18, -10); ctx.moveTo(-6, 6); ctx.lineTo(-17, 12); ctx.stroke();
    if (pest.shield > 0) {
      ctx.fillStyle = 'rgba(120,255,190,0.5)';
      ctx.beginPath(); ctx.ellipse(-19, 0, 6, 17, 0.25, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#2effa0'; ctx.lineWidth = 2; ctx.stroke();
    }
  } else if (pest.type === 'beetle') {
    ctx.fillStyle = d.color; ctx.beginPath(); ctx.ellipse(0, 2, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = d.dark; ctx.lineWidth = 2.4;
    const lp = Math.sin(time * 22 + pest.seedling) * 4;
    for (const sx of [-9, 0, 9]) { ctx.beginPath(); ctx.moveTo(sx, 9); ctx.lineTo(sx - 3 + lp, 16); ctx.stroke(); }
    ctx.fillStyle = '#fff2c9'; ctx.beginPath(); ctx.arc(-11, -2, 3, 0, Math.PI * 2); ctx.fill();
  } else if (pest.type === 'slug') {
    ctx.fillStyle = d.color; ctx.beginPath(); ctx.ellipse(0, 4, 19, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9ffd2'; ctx.beginPath(); ctx.arc(-8, -2, 4, 0, Math.PI * 2); ctx.arc(4, -4, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = d.dark; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-12, -6); ctx.lineTo(-16, -14); ctx.moveTo(-4, -8); ctx.lineTo(-5, -16); ctx.stroke();
  } else { // grub
    ctx.fillStyle = d.color;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-12 + i * 8, 4 + Math.sin(time * 7 + i + pest.seedling) * 1.6, 8 - i * 0.7, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#5c4a12'; ctx.beginPath(); ctx.arc(-16, 1, 3, 0, Math.PI * 2); ctx.fill();
  }
  // Eyes look toward the gate (left).
  if (pest.type !== 'king' && pest.type !== 'snail') {
    ctx.fillStyle = '#1c1408'; ctx.beginPath(); ctx.arc(-8, -3, 2.1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (pest.slowT > 0) {
    ctx.strokeStyle = 'rgba(140,220,255,0.85)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, (pest.type === 'king' ? 62 : 24), 0, Math.PI * 2); ctx.stroke();
  }
  hpBar(ctx, x, y - (pest.type === 'king' ? 96 : 36), pest.type === 'king' ? 120 : 42, pest.hp / pest.maxHp, '#e8a84d');
  if (pest.type === 'king') {
    ctx.fillStyle = '#ffe9b8'; ctx.font = 'bold 14px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText(`THE COMPOST KING — ${Math.ceil(pest.hp)} HP`, x, y - 106);
  }
  if (pest.shield > 0 && pest.type === 'mantis') {
    ctx.fillStyle = '#a8ffd8'; ctx.font = 'bold 10px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText(`shield ${Math.ceil(pest.shield)}`, x, y - 44);
  }
}

// ---- projectiles / fx ------------------------------------------------------

export function drawProjectiles(ctx, projectiles) {
  for (const p of projectiles) {
    if (p.kind === 'pea') { ctx.fillStyle = '#8ae06a'; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill(); }
    else if (p.kind === 'frost') { ctx.fillStyle = '#bdefff'; ctx.beginPath(); ctx.arc(p.x, p.y, 5.4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#5ab6d8'; ctx.lineWidth = 1.6; ctx.stroke(); }
    else if (p.kind === 'berry') { ctx.fillStyle = '#ff6b8a'; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill(); }
    else if (p.kind === 'thorn') { ctx.fillStyle = '#e08aff'; ctx.beginPath(); ctx.moveTo(p.x + 11, p.y); ctx.lineTo(p.x - 8, p.y - 4.4); ctx.lineTo(p.x - 8, p.y + 4.4); ctx.closePath(); ctx.fill(); }
    else if (p.kind === 'spit') { ctx.fillStyle = '#d8e84d'; ctx.beginPath(); ctx.arc(p.x, p.y, 4.4, 0, Math.PI * 2); ctx.fill(); }
    else if (p.kind === 'melon') {
      const t = Math.min(1, p.prog);
      const y = p.y - Math.sin(t * Math.PI) * 74;
      ctx.fillStyle = '#4fb86e'; ctx.beginPath(); ctx.arc(p.x, y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1f6e3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x - 10, y); ctx.lineTo(p.x + 10, y); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.groundY, 10, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
}

export function drawFx(ctx) {
  for (const p of particles) {
    const a = 1 - p.t / p.life;
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of floaters) {
    const a = 1 - f.t / f.life;
    ctx.globalAlpha = Math.max(0, a);
    ctx.font = `bold ${f.size}px Georgia, serif`; ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3.4;
    ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

export function drawLightning(ctx, bolts) {
  for (const b of bolts) {
    ctx.strokeStyle = 'rgba(255,240,120,0.9)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(b.x1, b.y1);
    const mx = (b.x1 + b.x2) / 2 + (Math.random() - 0.5) * 16;
    const my = (b.y1 + b.y2) / 2 + (Math.random() - 0.5) * 16;
    ctx.lineTo(mx, my); ctx.lineTo(b.x2, b.y2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2; ctx.stroke();
  }
}
