// SPROUT SIEGE HUD: the top bar (nectar, gate HP, wave, score, combo,
// WIN/LOSE), the right-hand incoming + collection panels, the bottom
// seed-packet bar, and centre event banners. Drawn on canvas so screenshots
// carry the full HUD in one frame.

import { VIEW_W, GRID, LANES, PLANTS, POWER_BY_ID, TOTAL_WAVES, gardenForWave } from './config.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export { rr };

export function drawTopBar(ctx, state) {
  ctx.fillStyle = 'rgba(10,18,8,0.92)'; ctx.fillRect(0, 0, VIEW_W, 52);
  ctx.fillStyle = '#3f7a34'; ctx.fillRect(0, 52, VIEW_W, 3);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  // Nectar (currency).
  ctx.fillStyle = '#ffd94d'; ctx.font = 'bold 21px Georgia, serif';
  ctx.fillText('🍯', 14, 35);
  ctx.fillStyle = '#fff7d6'; ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(String(Math.floor(state.nectar)), 46, 35);
  ctx.fillStyle = '#b9d8a8'; ctx.font = '11px Georgia, serif';
  ctx.fillText('NECTAR', 46, 48);
  // Gate HP bar (resource bar 1).
  ctx.fillStyle = '#b9d8a8'; ctx.font = '11px Georgia, serif';
  ctx.fillText('GATE HP', 148, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.16)'; rr(ctx, 148, 21, 170, 15, 7); ctx.fill();
  const gf = Math.max(0, state.gateHp / state.gateMax);
  ctx.fillStyle = gf > 0.35 ? '#5ec94f' : '#e84d4d';
  if (gf > 0) { rr(ctx, 148, 21, 170 * gf, 15, 7); ctx.fill(); }
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Georgia, serif';
  ctx.fillText(`${Math.ceil(state.gateHp)} / ${state.gateMax}`, 158, 33);
  // Wave + garden (resource: progress).
  const g = gardenForWave(Math.min(state.wave, TOTAL_WAVES));
  ctx.fillStyle = '#fff7d6'; ctx.font = 'bold 19px Georgia, serif'; ctx.textAlign = 'center';
  const waveLabel = state.endless ? `ENDLESS WAVE ${state.wave}` : `WAVE ${Math.min(state.wave, TOTAL_WAVES)} / ${TOTAL_WAVES}`;
  ctx.fillText(waveLabel, 470, 26);
  ctx.fillStyle = g.accent; ctx.font = '12.5px Georgia, serif';
  ctx.fillText(state.endless ? 'Endless Greenhouse' : g.name, 470, 44);
  // Combo chain.
  ctx.textAlign = 'left';
  ctx.fillStyle = state.chain > 0 ? '#ffb347' : '#7a8a72'; ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText(`⛓ LEAK-FREE ×${state.chain}`, 612, 26);
  ctx.fillStyle = '#b9d8a8'; ctx.font = '11px Georgia, serif';
  ctx.fillText('CHAIN', 612, 44);
  // Score.
  ctx.fillStyle = '#fff7d6'; ctx.font = 'bold 20px Georgia, serif'; ctx.textAlign = 'right';
  ctx.fillText(state.score.toLocaleString('en-US'), 892, 26);
  ctx.fillStyle = '#b9d8a8'; ctx.font = '11px Georgia, serif';
  ctx.fillText('SCORE', 892, 44);
  // WIN / LOSE — explicit, always on the action frame.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#8ae06a'; ctx.font = 'bold 13.5px Georgia, serif';
  ctx.fillText(state.endless ? 'WIN: survive — every wave held grows the chain' : 'WIN: clear wave 30 — fell The Compost King', 1266, 21);
  ctx.fillStyle = '#ff8a7a'; ctx.font = 'bold 13.5px Georgia, serif';
  ctx.fillText('LOSE: the gate falls to 0 HP', 1266, 41);
  ctx.textAlign = 'left';
}

export function drawSidePanels(ctx, state) {
  const x = 1024, w = 240;
  // Incoming / threat panel.
  ctx.fillStyle = 'rgba(10,18,8,0.88)'; rr(ctx, x, GRID.y - 2, w, 218, 10); ctx.fill();
  ctx.strokeStyle = '#5a7a4a'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = '#ffb347'; ctx.font = 'bold 13px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText(state.phase === 'combat' ? '⚠ INCOMING — THIS WAVE' : '⚠ INCOMING — NEXT WAVE', x + 12, GRID.y + 20);
  ctx.font = '13.5px Georgia, serif';
  let yy = GRID.y + 44;
  const list = state.incoming.slice(0, 7);
  if (!list.length) { ctx.fillStyle = '#b9d8a8'; ctx.fillText('— all clear —', x + 12, yy); yy += 20; }
  for (const item of list) {
    ctx.fillStyle = item.id === 'king' ? '#ff8a7a' : '#fff7d6';
    ctx.fillText(`${item.name}`, x + 12, yy);
    ctx.textAlign = 'right'; ctx.fillText(`×${item.count}`, x + w - 12, yy); ctx.textAlign = 'left';
    yy += 21;
  }
  ctx.fillStyle = '#b9d8a8'; ctx.font = '12px Georgia, serif';
  ctx.fillText(`Pests left: ${state.pests.length + state.spawnQueue.length}`, x + 12, GRID.y + 204);
  // Active seed collection panel.
  const cy = GRID.y + 228;
  ctx.fillStyle = 'rgba(10,18,8,0.88)'; rr(ctx, x, cy, w, 240, 10); ctx.fill();
  ctx.strokeStyle = '#5a7a4a'; ctx.stroke();
  ctx.fillStyle = '#8ae06a'; ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText(`✿ SEED COLLECTION (${state.powers.length})`, x + 12, cy + 20);
  ctx.font = '12.5px Georgia, serif';
  let py = cy + 42;
  if (!state.powers.length) {
    ctx.fillStyle = '#b9d8a8';
    ctx.fillText('Draft a packet after each wave.', x + 12, py); py += 17;
    ctx.fillText('8 powers to collect — they stack!', x + 12, py); py += 17;
  }
  const counts = new Map();
  for (const id of state.powers) counts.set(id, (counts.get(id) || 0) + 1);
  for (const [id, n] of counts) {
    const p = POWER_BY_ID[id];
    ctx.fillStyle = '#fff7d6';
    ctx.fillText(`${p.icon} ${p.name}${n > 1 ? ` ×${n}` : ''}`, x + 12, py);
    py += 19;
    if (py > cy + 228) break;
  }
}

export function drawSeedBar(ctx, state) {
  const y = 592, h = 118;
  ctx.fillStyle = 'rgba(10,18,8,0.94)'; ctx.fillRect(0, y, VIEW_W, h + 12);
  ctx.fillStyle = '#3f7a34'; ctx.fillRect(0, y, VIEW_W, 3);
  ctx.font = '11px Georgia, serif'; ctx.fillStyle = '#b9d8a8'; ctx.textAlign = 'left';
  ctx.fillText('SEED PACKETS — click a packet, then click a trellis cell (keys 1–8) · right-click / X: shovel · Space: start wave · P: pause · F: speed', 14, y + 16);
  const cardW = 118, gap = 8, x0 = 14;
  PLANTS.forEach((d, i) => {
    const x = x0 + i * (cardW + gap);
    const afford = state.nectar >= d.cost;
    const selected = state.selectedPlant === d.id;
    ctx.fillStyle = selected ? '#3f7a34' : afford ? '#22331c' : '#1a2016';
    rr(ctx, x, y + 24, cardW, 84, 8); ctx.fill();
    ctx.strokeStyle = selected ? '#ffd94d' : afford ? '#5a7a4a' : '#39443a';
    ctx.lineWidth = selected ? 3 : 1.4; ctx.stroke();
    ctx.fillStyle = d.color; ctx.beginPath(); ctx.arc(x + 20, y + 48, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff7d6'; ctx.font = 'bold 12px Georgia, serif';
    ctx.fillText(d.name, x + 36, y + 52);
    ctx.fillStyle = afford ? '#ffd94d' : '#8a7a5a'; ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText(`🍯 ${d.cost}`, x + 8, y + 78);
    ctx.fillStyle = '#b9d8a8'; ctx.font = '11px Georgia, serif';
    const roleLine = { shooter: 'DPS lane', frost: 'slow', splash: 'splash', sniper: 'burst', economy: '+nectar', wall: 'tank', chain: 'chain ×3', mortar: 'lob AoE' }[d.role];
    ctx.fillText(`${i + 1} · ${roleLine}${d.dmg ? ` · ${d.dmg} dmg` : ''}`, x + 8, y + 95);
  });
  // Wave control button area.
  const bx = 1108, bw = 156;
  ctx.fillStyle = state.phase === 'build' ? '#b8860b' : '#22331c';
  rr(ctx, bx, y + 24, bw, 84, 8); ctx.fill();
  ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = '#fff7d6'; ctx.font = 'bold 15px Georgia, serif'; ctx.textAlign = 'center';
  if (state.phase === 'build') {
    ctx.fillText(state.wave === 1 && state.powers.length === 0 ? '▶ START' : '▶ NEXT WAVE', bx + bw / 2, y + 58);
    ctx.font = '12px Georgia, serif'; ctx.fillText(`Wave ${state.wave} when ready`, bx + bw / 2, y + 78);
  } else {
    ctx.fillText(`WAVE ${Math.min(state.wave, TOTAL_WAVES)}…`, bx + bw / 2, y + 58);
    ctx.font = '12px Georgia, serif';
    ctx.fillText(`speed ×${state.speed} (F)`, bx + bw / 2, y + 78);
  }
  ctx.textAlign = 'left';
}

export function drawBanner(ctx, state) {
  if (!state.banner || state.bannerT <= 0) return;
  const a = Math.min(1, state.bannerT / 0.5, (state.bannerDur - state.bannerT) / 0.4 + 0.2);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, a));
  const y = 210;
  ctx.fillStyle = 'rgba(8,14,6,0.82)'; rr(ctx, 240, y - 44, 560, 84, 14); ctx.fill();
  ctx.strokeStyle = state.banner.color || '#ffd94d'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = state.banner.color || '#ffd94d'; ctx.font = 'bold 30px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText(state.banner.title, 520, y - 4);
  ctx.fillStyle = '#fff7d6'; ctx.font = '16.5px Georgia, serif';
  ctx.fillText(state.banner.sub || '', 520, y + 24);
  ctx.restore();
}
