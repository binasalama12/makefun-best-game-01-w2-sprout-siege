// Tiny WebAudio synth for SPROUT SIEGE: plant, shoot, pop, draft and banner
// blips. No assets, everything synthesized; silent until first user gesture.

let ac = null;

export function initAudio() {
  if (ac) return;
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
  } catch { ac = null; }
}

function tone(freq, dur, type = 'sine', vol = 0.08, slide = 0) {
  if (!ac) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t); osc.stop(t + dur + 0.02);
}

export const sfx = {
  plant() { tone(320, 0.12, 'triangle', 0.09, 180); },
  shoot() { tone(660, 0.05, 'square', 0.025); },
  pop() { tone(220, 0.09, 'sawtooth', 0.05, -140); },
  hurt() { tone(140, 0.1, 'sawtooth', 0.05, -60); },
  nectar() { tone(880, 0.08, 'sine', 0.05, 220); },
  draft() { tone(520, 0.16, 'triangle', 0.08, 260); tone(780, 0.2, 'sine', 0.06, 120); },
  banner() { tone(392, 0.14, 'triangle', 0.09); setTimeout(() => tone(587, 0.22, 'triangle', 0.09), 90); },
  leak() { tone(110, 0.25, 'sawtooth', 0.09, -50); },
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.08), i * 110)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.26, 'sawtooth', 0.06), i * 130)); },
};
