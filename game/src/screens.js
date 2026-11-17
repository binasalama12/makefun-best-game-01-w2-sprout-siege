// SPROUT SIEGE full screens: the dense title (how-to + defender bestiary +
// pest bestiary + difficulties + endless), the between-wave seed draft
// (the meta screen), and the end screen (letter rank, 8+ stats, seed
// collection recap). All drawn over the live garden so every frame is rich.

import { VIEW_W, VIEW_H, PLANTS, PESTS, BOSS, POWERS, POWER_BY_ID, DIFFICULTIES, TOTAL_WAVES } from './config.js';
import { rr } from './hud.js';

function panel(ctx, x, y, w, h, title, accent = '#8ae06a') {
  ctx.fillStyle = 'rgba(8,14,6,0.90)'; rr(ctx, x, y, w, h, 12); ctx.fill();
  ctx.strokeStyle = '#5a7a4a'; ctx.lineWidth = 1.5; ctx.stroke();
  if (title) {
    ctx.fillStyle = accent; ctx.font = 'bold 14px Georgia, serif'; ctx.textAlign = 'left';
    ctx.fillText(title, x + 14, y + 22);
  }
}

export function drawTitleScreen(ctx, state, time) {
  ctx.fillStyle = 'rgba(6,10,4,0.45)'; ctx.fillRect(0, 54, VIEW_W, VIEW_H - 54);
  // Headline.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94d'; ctx.font = 'bold 54px Georgia, serif';
  ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = 7;
  ctx.strokeText('SPROUT SIEGE', 640, 108); ctx.fillText('SPROUT SIEGE', 640, 108);
  ctx.fillStyle = '#fff7d6'; ctx.font = '17.5px Georgia, serif';
  ctx.fillText('Grow the turrets, hold the gate: 3 gardens · 30 waves · 8 defenders · 7 pests · boss The Compost King', 640, 134);
  // How to play.
  panel(ctx, 26, 148, 300, 300, 'HOW TO PLAY');
  ctx.fillStyle = '#fff7d6'; ctx.font = '13.5px Georgia, serif'; ctx.textAlign = 'left';
  const how = [
    '1. Pick a seed packet below,',
    '   click a trellis cell to plant.',
    '2. Pests march the 5 lanes from',
    '   the right toward your GATE.',
    '3. Kills + Sunblooms earn 🍯 nectar.',
    '   Spend it on more defenders.',
    '4. After each wave, DRAFT 1 of 3',
    '   new seed packets — powers stack.',
    '5. Leak-free waves build your',
    '   CHAIN: each one pays more score.',
    '6. Clear wave 30 and fell',
    '   THE COMPOST KING to win.',
    '',
    'WIN: wave 30 cleared, boss down.',
    'LOSE: gate HP reaches 0.',
    '',
    'Keys: 1–8 plant · X shovel ·',
    'Space next wave · F speed · P pause',
  ];
  how.forEach((line, i) => ctx.fillText(line, 42, 184 + i * 18.5));
  // Defender bestiary.
  panel(ctx, 340, 148, 430, 300, '🌱 DEFENDERS — 8 LIVING TURRETS', '#ffd94d');
  ctx.font = '12.5px Georgia, serif';
  PLANTS.forEach((d, i) => {
    const y = 182 + i * 32;
    ctx.fillStyle = d.color; ctx.beginPath(); ctx.arc(362, y - 4, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff7d6'; ctx.font = 'bold 12.5px Georgia, serif';
    ctx.fillText(`${d.name} — 🍯${d.cost}`, 378, y);
    ctx.fillStyle = '#b9d8a8'; ctx.font = '12px Georgia, serif';
    ctx.fillText(d.desc, 378, y + 14);
    ctx.font = '12.5px Georgia, serif';
  });
  // Pest bestiary.
  panel(ctx, 784, 148, 470, 300, '🐛 PESTS — 7 TYPES + THE BOSS', '#ffb347');
  const all = [...PESTS, BOSS];
  all.forEach((d, i) => {
    const y = 180 + i * 32.5;
    ctx.fillStyle = d.color; ctx.beginPath(); ctx.arc(806, y - 4, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = i === all.length - 1 ? '#ff8a7a' : '#fff7d6'; ctx.font = 'bold 12.5px Georgia, serif';
    ctx.fillText(d.name, 822, y);
    ctx.fillStyle = '#b9d8a8'; ctx.font = '12px Georgia, serif';
    const desc = d.desc.length > 52 ? d.desc.slice(0, 52) + '…' : d.desc;
    ctx.fillText(desc, 822, y + 14);
    ctx.font = '12.5px Georgia, serif';
  });
  // Difficulties + endless + draft powers strip.
  panel(ctx, 26, 460, 700, 128, 'DIFFICULTY — click one, then click anywhere to start');
  DIFFICULTIES.forEach((d, i) => {
    const x = 42 + i * 228;
    const sel = state.difficulty.id === d.id;
    ctx.fillStyle = sel ? '#3f7a34' : '#1c2a16'; rr(ctx, x, 492, 212, 62, 9); ctx.fill();
    ctx.strokeStyle = sel ? '#ffd94d' : '#5a7a4a'; ctx.lineWidth = sel ? 2.6 : 1.3; ctx.stroke();
    ctx.fillStyle = '#fff7d6'; ctx.font = 'bold 14.5px Georgia, serif'; ctx.textAlign = 'left';
    ctx.fillText(d.name, x + 12, 516);
    ctx.fillStyle = '#b9d8a8'; ctx.font = '12px Georgia, serif';
    ctx.fillText(d.desc, x + 12, 536);
  });
  ctx.fillStyle = '#ffd94d'; ctx.font = 'bold 13.5px Georgia, serif';
  ctx.fillText('After the campaign: ENDLESS GREENHOUSE — waves 31+ scale forever, chain never resets.', 42, 576);
  panel(ctx, 740, 460, 514, 128, '✿ 8 SEED POWERS TO DRAFT (1-of-3 after every wave)');
  ctx.font = '12px Georgia, serif';
  POWERS.forEach((p, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 756 + col * 254, y = 494 + row * 23;
    ctx.fillStyle = '#fff7d6'; ctx.fillText(`${p.icon} ${p.name}`, x, y);
  });
  // Start prompt + best score: a solid CTA pill over the seed bar so the
  // lines never collide with the packet cards underneath.
  ctx.fillStyle = 'rgba(8,14,6,0.95)'; rr(ctx, 300, 600, 680, 62, 12); ctx.fill();
  ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 2; ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8ae06a'; ctx.font = 'bold 18px Georgia, serif';
  const blink = 0.65 + 0.35 * Math.sin(time * 3);
  ctx.globalAlpha = blink;
  ctx.fillText('— CLICK OR PRESS ENTER TO PLANT YOUR FIRST DEFENDERS —', 640, 626);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#b9d8a8'; ctx.font = '12.5px Georgia, serif';
  ctx.fillText(`Best score: ${state.best.toLocaleString('en-US')} · Full runs reach the tens of thousands through leak-free chains`, 640, 650);
  ctx.textAlign = 'left';
}

export function drawDraftScreen(ctx, state) {
  ctx.fillStyle = 'rgba(6,10,4,0.62)'; ctx.fillRect(0, 54, VIEW_W, 538);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94d'; ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText(`WAVE ${state.wave - 1} HELD!`, 640, 118);
  ctx.fillStyle = '#fff7d6'; ctx.font = '17px Georgia, serif';
  ctx.fillText(state.draftLeakFree ? `Leak-free! Chain ×${state.chain} — bonus +${state.lastChainBonus.toLocaleString('en-US')} score` : 'The gate took damage — chain reset. Draft a seed packet to grow stronger:', 640, 146);
  ctx.font = '15px Georgia, serif'; ctx.fillStyle = '#b9d8a8';
  ctx.fillText('DRAFT 1 OF 3 SEED PACKETS — it joins your collection and stacks forever', 640, 172);
  state.draftOptions.forEach((p, i) => {
    const x = 150 + i * 300, y = 196, w = 270, h = 268;
    const hover = state.draftHover === i;
    ctx.fillStyle = hover ? '#2c4a22' : '#16240f'; rr(ctx, x, y, w, h, 14); ctx.fill();
    ctx.strokeStyle = hover ? '#ffd94d' : '#5a7a4a'; ctx.lineWidth = hover ? 3.2 : 1.8; ctx.stroke();
    ctx.fillStyle = '#ffd94d'; ctx.font = '44px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText(p.icon, x + w / 2, y + 66);
    ctx.fillStyle = '#fff7d6'; ctx.font = 'bold 21px Georgia, serif';
    ctx.fillText(p.name, x + w / 2, y + 104);
    const owned = state.powers.filter((id) => id === p.id).length;
    ctx.fillStyle = '#8ae06a'; ctx.font = '13.5px Georgia, serif';
    ctx.fillText(owned ? `Already in collection ×${owned} — stacks!` : 'New for your collection!', x + w / 2, y + 128);
    ctx.fillStyle = '#e8f4d8'; ctx.font = '14.5px Georgia, serif';
    // Wrap the description to two lines.
    const words = p.desc.split(' ');
    let line1 = '', line2 = '';
    for (const w2 of words) { if ((line1 + ' ' + w2).trim().length <= 30) line1 = (line1 + ' ' + w2).trim(); else line2 = (line2 + ' ' + w2).trim(); }
    ctx.fillText(line1, x + w / 2, y + 162);
    ctx.fillText(line2, x + w / 2, y + 184);
    ctx.fillStyle = '#ffb347'; ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText(`PRESS ${i + 1} OR CLICK`, x + w / 2, y + 238);
  });
  // Collection recap strip.
  ctx.fillStyle = 'rgba(8,14,6,0.92)'; rr(ctx, 150, 486, 870, 62, 10); ctx.fill();
  ctx.strokeStyle = '#5a7a4a'; ctx.stroke();
  ctx.fillStyle = '#8ae06a'; ctx.font = 'bold 13px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText('YOUR COLLECTION SO FAR:', 168, 510);
  ctx.fillStyle = '#fff7d6'; ctx.font = '13px Georgia, serif';
  const counts = new Map();
  for (const id of state.powers) counts.set(id, (counts.get(id) || 0) + 1);
  const recap = [...counts.entries()].map(([id, n]) => `${POWER_BY_ID[id].name}${n > 1 ? ` ×${n}` : ''}`).join(' · ') || '— nothing yet, this is your first packet —';
  ctx.fillText(recap.length > 112 ? recap.slice(0, 112) + '…' : recap, 168, 532);
  ctx.textAlign = 'left';
}

export function rankFor(state) {
  if (!state.victory) return state.wave >= 25 ? 'B' : state.wave >= 18 ? 'C' : state.wave >= 10 ? 'D' : 'F';
  if (state.gateHp >= 90 && state.chain >= 12) return 'S';
  if (state.gateHp >= 70) return 'A';
  if (state.gateHp >= 45) return 'B';
  return 'C';
}

export function drawEndScreen(ctx, state) {
  ctx.fillStyle = 'rgba(6,10,4,0.78)'; ctx.fillRect(0, 54, VIEW_W, VIEW_H - 54);
  const rank = rankFor(state);
  ctx.textAlign = 'center';
  ctx.fillStyle = state.victory ? '#ffd94d' : '#ff8a7a'; ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText(state.victory ? '🌻 THE GARDEN HOLDS! 🌻' : 'THE GATE HAS FALLEN', 640, 112);
  ctx.fillStyle = '#fff7d6'; ctx.font = '17px Georgia, serif';
  ctx.fillText(state.victory
    ? `Wave ${TOTAL_WAVES} cleared — The Compost King is mulch. The Endless Greenhouse is open (press E).`
    : `The pests overran the gate on wave ${state.wave}. The garden remembers its defenders.`, 640, 140);
  // Big rank letter.
  ctx.fillStyle = 'rgba(8,14,6,0.92)'; rr(ctx, 70, 168, 210, 250, 16); ctx.fill();
  ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 2.4; ctx.stroke();
  ctx.fillStyle = '#b9d8a8'; ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('GARDENER RANK', 175, 198);
  ctx.fillStyle = rank === 'S' ? '#ffd94d' : rank === 'A' ? '#8ae06a' : '#fff7d6';
  ctx.font = 'bold 150px Georgia, serif';
  ctx.fillText(rank, 175, 348);
  ctx.fillStyle = '#b9d8a8'; ctx.font = '13px Georgia, serif';
  ctx.fillText(state.victory ? 'judged on gate HP + chain' : 'judged on waves survived', 175, 392);
  // Stats grid — 10 stats.
  panel(ctx, 306, 168, 560, 250, 'RUN STATISTICS');
  const mins = Math.floor(state.elapsed / 60), secs = Math.floor(state.elapsed % 60);
  const stats = [
    ['Final score', state.score.toLocaleString('en-US')],
    ['Waves cleared', `${state.wavesCleared} / ${TOTAL_WAVES}`],
    ['Pests composted', String(state.kills)],
    ['Gate HP remaining', `${Math.ceil(Math.max(0, state.gateHp))} / ${state.gateMax}`],
    ['Best leak-free chain', `×${state.bestChain}`],
    ['Plants grown', String(state.planted)],
    ['Nectar harvested', String(Math.floor(state.nectarEarned))],
    ['Bosses felled', state.bossDown ? '1 — The Compost King' : '0'],
    ['Seed packets drafted', String(state.powers.length)],
    ['Time in the garden', `${mins}m ${String(secs).padStart(2, '0')}s`],
  ];
  ctx.font = '14.5px Georgia, serif';
  stats.forEach(([k, v], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 326 + col * 272, y = 206 + row * 43;
    ctx.fillStyle = '#b9d8a8'; ctx.textAlign = 'left'; ctx.fillText(k, x, y);
    ctx.fillStyle = '#fff7d6'; ctx.font = 'bold 15.5px Georgia, serif'; ctx.fillText(v, x, y + 19);
    ctx.font = '14.5px Georgia, serif';
  });
  // Collection recap.
  panel(ctx, 892, 168, 330, 250, '✿ SEED COLLECTION RECAP', '#ffd94d');
  const counts = new Map();
  for (const id of state.powers) counts.set(id, (counts.get(id) || 0) + 1);
  ctx.font = '13.5px Georgia, serif'; ctx.textAlign = 'left';
  if (!counts.size) { ctx.fillStyle = '#b9d8a8'; ctx.fillText('No packets drafted.', 908, 206); }
  let yy = 206;
  for (const [id, n] of counts) {
    const p = POWER_BY_ID[id];
    ctx.fillStyle = '#ffd94d'; ctx.fillText(p.icon, 908, yy);
    ctx.fillStyle = '#fff7d6'; ctx.fillText(`${p.name}${n > 1 ? ` ×${n}` : ''}`, 928, yy);
    yy += 24;
  }
  ctx.fillStyle = '#b9d8a8'; ctx.font = '12.5px Georgia, serif';
  ctx.fillText(`${counts.size} of 8 powers collected`, 908, yy + 6);
  // Final score + actions.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94d'; ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText(`FINAL SCORE  ${state.score.toLocaleString('en-US')}`, 640, 470);
  ctx.fillStyle = '#b9d8a8'; ctx.font = '14px Georgia, serif';
  ctx.fillText(`Best: ${state.best.toLocaleString('en-US')}`, 640, 496);
  ctx.fillStyle = '#8ae06a'; ctx.font = 'bold 18px Georgia, serif';
  const blink = 0.65 + 0.35 * Math.sin(state.time * 3);
  ctx.globalAlpha = blink;
  ctx.fillText(state.victory ? 'ENTER: new run · E: Endless Greenhouse' : 'ENTER: try again — the seeds believe in you', 640, 540);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}
