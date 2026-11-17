[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/binasalama12/makefun-best-game-01-w2-sprout-siege/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/binasalama12/makefun-best-game-01-w2-sprout-siege/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# SPROUT SIEGE

**SPROUT SIEGE — grow the turrets, hold the gate: 3 gardens, 30 waves, 8 defenders, 7 pests, boss The Compost King**

A garden tower defense on a 2D canvas — no libraries, no build step, no network.
Open `game/index.html` from any static server and play.

## The game

Plant **living turrets** from seed packets on a 5-lane trellis. Pests march the
lanes from the right toward your **garden gate**; every kill and every Sunbloom
pays **nectar**, and nectar plants more defenders. Between waves you **draft
1 of 3 new seed packets** — eight stacking powers (Golden Pollen, Thick Roots,
Swift Sap, Nectar Spring, Frost Crown, Thorn Aura, Sun Charm, Gate Bark) that
grow your collection for the whole run. Leak-free waves build a **chain** that
multiplies your score into the tens of thousands. Hold the gate through
**3 gardens × 10 waves** — the Verdant Trellis, Thornwood Hollow and the Ember
Conservatory — and on **wave 30, The Compost King** comes for the gate himself:
a mountain of mulch that sheds Grubs and stomps plants flat. Fell him to win,
then keep going in the **Endless Greenhouse**, where waves scale forever.

- **8 defender plants**, each a distinct role: Peapod Piper (shooter), Frost
  Fern (slow), Bomb Berry (splash), Thorn Sniper (burst), Sunbloom (economy),
  Bulwark Bulb (wall), Volt Vine (chain lightning ×3), Mortar Melon (lobbed AoE).
- **7 pest types**, each behaving differently: Grub (basic), Runner Beetle
  (fast), Armored Snail (flat armor), Splitter Slug (splits into Grubs),
  Spitter Wasp (ranged), Burrow Mole (burrows untargetable to mid-lane),
  Shield Mantis (damage-blocking shield) — plus the boss, **The Compost King**.
- **3 difficulties** (Sprout / Gardener / Siege Master) and an Endless mode.
- Full HUD in every action frame: nectar, gate HP bar, wave counter, explicit
  WIN / LOSE lines, incoming-wave panel (pest types + counts), active seed
  collection panel, leak-free combo chain and score.
- Juice: floating damage / nectar / score numbers, event banners ("WAVE 30 —
  THE COMPOST KING"), pollen particles, compost bursts, chain lightning, and a
  procedurally textured garden background that changes per garden.

## Controls

- **Mouse:** click a seed packet, then a trellis cell to plant. Click draft
  cards to pick. Right-click / **X**: shovel (refunds half the packet).
- **1–8:** select a seed packet. **Space:** start the next wave.
- **F:** cycle game speed ×1/×2/×3. **P:** pause. **R:** restart the run.
- **Enter:** start / restart. **E** (after victory): Endless Greenhouse.

## Screens

`screenshots/` holds four real renders of the game itself, in dossier order:
the wave-30 boss climax against The Compost King with the full HUD and lanes
full, the between-wave seed-packet draft screen, the dense title screen
(how-to, defender + pest bestiaries, difficulties and Endless), and the
victory end screen with gardener rank, ten run statistics and the seed
collection recap.

## Layout

- `game/index.html` — the page and stage.
- `game/src/config.js` — gardens, all 8 plants, 7 pests, the boss, 8 seed
  powers, difficulties and scoring.
- `game/src/world.js` — wave composition, pest scaling, incoming summaries,
  the draft deck.
- `game/src/render.js` — all canvas art: textured gardens, gate, plants,
  pests, projectiles, particles, floating numbers, lightning.
- `game/src/hud.js` — top bar, incoming + collection panels, seed-packet bar,
  event banners.
- `game/src/screens.js` — title, draft and end screens.
- `game/src/main.js` — the game loop and state: planting, combat, chains,
  drafts, the boss fight, win / lose / endless.
- `game/src/input.js`, `game/src/audio.js`, `game/src/rng.js` — controls,
  WebAudio synth blips, seeded RNG.
- `game/src/shots.js` — deterministic `?shot=` scenes used to render the
  screenshots.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` out and
  writes the dossier.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## Hand in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
node serve.ts        # or any static server over game/, to play it
```

MIT licensed — see `LICENSE`.
