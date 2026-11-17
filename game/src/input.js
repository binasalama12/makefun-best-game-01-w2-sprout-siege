// SPROUT SIEGE input: mouse planting / shovel / draft clicks / difficulty
// pick, and the keyboard (1-8 select, X shovel, Space wave, F speed,
// P pause, 1-3 draft, Enter/Esc flow). All coordinates are canvas pixels.

import { GRID, LANES, COLS, PLANTS, DIFFICULTIES } from './config.js';

export function cellAt(mx, my) {
  const col = Math.floor((mx - GRID.x) / GRID.cellW);
  const lane = Math.floor((my - GRID.y) / GRID.cellH);
  if (col < 0 || col >= COLS || lane < 0 || lane >= LANES) return null;
  return { lane, col };
}

export function draftIndexAt(mx, my) {
  for (let i = 0; i < 3; i++) {
    const x = 190 + i * 310, y = 196, w = 280, h = 268;
    if (mx >= x && mx <= x + w && my >= y && my <= y + h) return i;
  }
  return -1;
}

export function difficultyAt(mx, my) {
  for (let i = 0; i < DIFFICULTIES.length; i++) {
    const x = 42 + i * 228, y = 492, w = 212, h = 62;
    if (mx >= x && mx <= x + w && my >= y && my <= y + h) return DIFFICULTIES[i];
  }
  return null;
}

export function packetAt(mx, my) {
  const y = 592;
  if (my < y + 24 || my > y + 108) return null;
  const cardW = 118, gap = 8, x0 = 14;
  for (let i = 0; i < PLANTS.length; i++) {
    const x = x0 + i * (cardW + gap);
    if (mx >= x && mx <= x + cardW) return PLANTS[i];
  }
  return null;
}

export function waveButtonAt(mx, my) {
  const y = 592;
  return mx >= 1108 && mx <= 1108 + 156 && my >= y + 24 && my <= y + 108;
}

export function attachInput(canvas, handlers) {
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  };
  canvas.addEventListener('mousemove', (e) => handlers.onMove(pos(e)));
  canvas.addEventListener('click', (e) => handlers.onClick(pos(e), e));
  canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); handlers.onRightClick(pos(e)); });
  window.addEventListener('keydown', (e) => handlers.onKey(e));
}
