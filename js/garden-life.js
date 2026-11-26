// Organic Living Animal Wandering Engine
// Gently animates placed animals (lamb, dove, camel, bunny, deer) strolling/hopping
// within a cozy radius around their home spot during Morning, Noon, and Dusk.
// Automatically pauses while dragged/selected and stops completely at Night when sleeping!

import { getItemDef } from './garden-catalog.js';

const PERSONALITIES = {
  lamb:  { radiusX: 6.5, radiusY: 3.2, minPause: 2600, maxPause: 5800, walkDur: 2800, gaitClass: 'gait-stroll' },
  camel: { radiusX: 7.0, radiusY: 3.0, minPause: 3400, maxPause: 6800, walkDur: 3400, gaitClass: 'gait-stroll' },
  deer:  { radiusX: 8.5, radiusY: 3.8, minPause: 2400, maxPause: 5400, walkDur: 2600, gaitClass: 'gait-stroll' },
  bunny: { radiusX: 7.5, radiusY: 4.0, minPause: 1800, maxPause: 4200, walkDur: 1900, gaitClass: 'gait-hop' },
  dove:  { radiusX: 9.0, radiusY: 4.8, minPause: 2200, maxPause: 5000, walkDur: 2500, gaitClass: 'gait-flutter' }
};

function computeDepthScale(yPct) {
  const norm = Math.max(0, Math.min(1, (yPct - 36) / 58));
  return 0.56 + norm * 0.56;
}

export class GardenLifeController {
  constructor() {
    this.timers = new Map(); // uid -> timeoutId
    this.activeWalkers = new Map(); // uid -> { el, homeX, homeY, curX, curY, def, scaleMult, flipX }
    this.pausedUids = new Set();
    this.sleeping = false;
  }

  stopAll() {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
    this.activeWalkers.clear();
    this.pausedUids.clear();
  }

  pauseUid(uid) {
    this.pausedUids.add(uid);
    const t = this.timers.get(uid);
    if (t) clearTimeout(t);
    this.timers.delete(uid);
    const w = this.activeWalkers.get(uid);
    if (w && w.el) {
      w.el.classList.remove('is-walking', 'gait-stroll', 'gait-hop', 'gait-flutter');
      w.el.style.transition = '';
    }
  }

  attach(stageEl, gardenItems, { animalsSleep, selectedUid }) {
    this.stopAll();
    this.sleeping = animalsSleep;
    if (!stageEl || animalsSleep) return;

    for (const placed of gardenItems) {
      const def = getItemDef(placed.itemId);
      if (!def || def.category !== 'animal') continue;
      if (placed.uid === selectedUid) continue;

      const el = stageEl.querySelector(`.placed-item[data-uid="${placed.uid}"]`);
      if (!el) continue;

      const walker = {
        uid: placed.uid,
        el,
        def,
        homeX: placed.xPct,
        homeY: placed.yPct,
        curX: placed.xPct,
        curY: placed.yPct,
        scaleMult: placed.scaleMult || 1.0,
        baseFlipX: Boolean(placed.flipX)
      };
      this.activeWalkers.set(placed.uid, walker);

      // Stagger initial wander start so animals move organically, not in lockstep
      const initialDelay = 900 + Math.random() * 2800;
      const tid = setTimeout(() => this._step(placed.uid), initialDelay);
      this.timers.set(placed.uid, tid);
    }
  }

  _step(uid) {
    if (this.sleeping || this.pausedUids.has(uid)) return;
    const w = this.activeWalkers.get(uid);
    if (!w || !w.el || !w.el.isConnected) return;

    const p = PERSONALITIES[w.def.id] || PERSONALITIES.lamb;

    // Pick a gentle nearby point around the animal's home spot, strictly staying on open lawn
    const angle = Math.random() * Math.PI * 2;
    const dist = 0.4 + Math.random() * 0.6;
    let nextX = w.homeX + Math.cos(angle) * p.radiusX * dist;
    let nextY = w.homeY + Math.sin(angle) * p.radiusY * dist;

    // Keep safely inside the open lawn (avoid cottage roof & lower-left lotus pond edge)
    nextX = Math.max(12, Math.min(91, nextX));
    nextY = Math.max(42, Math.min(91, nextY));
    if (nextX < 32 && nextY > 68) {
      // Gently steer away from the lower-left lotus pond
      nextX = 34 + Math.random() * 6;
    }

    const dx = nextX - w.curX;
    const facingRight = dx > 0.3;
    const facingLeft = dx < -0.3;

    // Our default sprites (lamb, dove, camel, bunny, deer) mostly face left/front-left except deer (faces right).
    // Flip smoothly toward movement direction!
    const naturalFacesRight = (w.def.id === 'deer' || w.def.id === 'bunny');
    let flip = w.baseFlipX;
    if (facingRight) flip = !naturalFacesRight;
    else if (facingLeft) flip = naturalFacesRight;

    const spriteEl = w.el.querySelector('.placed-sprite');
    if (spriteEl) {
      spriteEl.style.transform = flip ? 'scaleX(-1)' : 'none';
    }

    const depthScale = computeDepthScale(nextY);
    const widthPct = w.def.baseWidthPct * depthScale * w.scaleMult;
    const dur = p.walkDur + Math.round((Math.random() - 0.5) * 600);

    w.el.style.transition = `left ${dur}ms ease-in-out, top ${dur}ms ease-in-out, width ${dur}ms ease-in-out`;
    w.el.classList.add('is-walking', p.gaitClass);
    w.el.style.left = `${nextX.toFixed(2)}%`;
    w.el.style.top = `${nextY.toFixed(2)}%`;
    w.el.style.width = `${widthPct.toFixed(2)}%`;
    w.el.style.zIndex = String(Math.round(nextY));

    w.curX = nextX;
    w.curY = nextY;

    // Finish walking, pause peacefully to graze/rest, then schedule next stroll
    const stopTid = setTimeout(() => {
      if (!w.el || !w.el.isConnected) return;
      w.el.classList.remove('is-walking', p.gaitClass);
      const pause = p.minPause + Math.random() * (p.maxPause - p.minPause);
      const nextTid = setTimeout(() => this._step(uid), pause);
      this.timers.set(uid, nextTid);
    }, dur);
    this.timers.set(uid, stopTid);
  }
}
