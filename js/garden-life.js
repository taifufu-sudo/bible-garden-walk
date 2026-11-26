// Natural Organic Living Animal Animation Engine (requestAnimationFrame Physics)
// Replaces stiff linear sliding with:
// - Smooth curved quadratic Bezier stroll paths (never robotic straight lines)
// - Stride-synced squash & stretch, micro-surge step cadence, and realistic ground-shadow scaling
// - Distinct species personalities:
//     * Bunny: true discrete parabolic hop -> soft landing squash -> brief ear-twitch pause -> next hop!
//     * Dove: graceful airborne curved swoop/flutter above its shadow -> gentle landing bob!
//     * Lamb / Camel / Deer: unhurried gentle stepping gait with soft sway, periodic grazing nod & breathing!
// - Continuous gentle idle breathing & grazing while resting (never frozen like a statue!)
// - Instant clean pause when touched/dragged, and peaceful still sleep breathing at Night.

import { getItemDef } from './garden-catalog.js';

function computeDepthScale(yPct) {
  const norm = Math.max(0, Math.min(1, (yPct - 36) / 58));
  return 0.56 + norm * 0.52; // Tuned for panoramic 16:9 lawn
}

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

const SPECIES_CONFIG = {
  lamb:  { mode: 'stroll', radiusX: 6.5, radiusY: 4.0, speedPctPerSec: 2.2, stepFreq: 2.3, hopHeight: 4.5, minIdle: 3200, maxIdle: 7200, naturalRight: false },
  camel: { mode: 'stroll', radiusX: 7.0, radiusY: 3.6, speedPctPerSec: 1.7, stepFreq: 1.7, hopHeight: 3.5, minIdle: 4000, maxIdle: 8200, naturalRight: false },
  deer:  { mode: 'stroll', radiusX: 8.5, radiusY: 4.5, speedPctPerSec: 2.6, stepFreq: 2.5, hopHeight: 6.0, minIdle: 3000, maxIdle: 6800, naturalRight: true  },
  bunny: { mode: 'hop',    radiusX: 7.5, radiusY: 4.5, hopDistMin: 2.2, hopDistMax: 3.8, hopDur: 460, hopHeight: 14, hopsPerBurst: [2, 3], minIdle: 2800, maxIdle: 6200, naturalRight: true },
  dove:  { mode: 'glide',  radiusX: 9.5, radiusY: 5.5, speedPctPerSec: 4.0, liftHeight: 22, minIdle: 3200, maxIdle: 7400, naturalRight: false }
};

export class GardenLifeController {
  constructor() {
    this.actors = new Map(); // uid -> actor state
    this.rafId = null;
    this.sleeping = false;
    this.lastNow = 0;
  }

  stopAll() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.actors.clear();
  }

  pauseUid(uid) {
    const actor = this.actors.get(uid);
    if (!actor) return;
    actor.paused = true;
    // Reset dynamic sprite/shadow transforms so dragging aligns cleanly under pointer
    if (actor.spriteEl) {
      actor.spriteEl.style.transform = actor.facingFlip ? 'scaleX(-1)' : 'none';
    }
    if (actor.shadowEl) {
      actor.shadowEl.style.scale = '1';
    }
  }

  attach(stageEl, gardenItems, { animalsSleep, selectedUid }) {
    this.stopAll();
    this.sleeping = animalsSleep;
    if (!stageEl || animalsSleep) return;

    const now = performance.now();
    for (const placed of gardenItems) {
      const def = getItemDef(placed.itemId);
      if (!def || def.category !== 'animal') continue;
      if (placed.uid === selectedUid) continue;

      const el = stageEl.querySelector(`.placed-item[data-uid="${placed.uid}"]`);
      if (!el) continue;
      const spriteEl = el.querySelector('.placed-sprite');
      const shadowEl = el.querySelector('.item-ground-shadow');
      if (!spriteEl) continue;

      // Clear any CSS transitions on left/top/width so rAF drives silky 60fps organic motion
      el.style.transition = 'none';

      const cfg = SPECIES_CONFIG[def.id] || SPECIES_CONFIG.lamb;
      const actor = {
        uid: placed.uid,
        el,
        spriteEl,
        shadowEl,
        def,
        cfg,
        homeX: placed.xPct,
        homeY: placed.yPct,
        x: placed.xPct,
        y: placed.yPct,
        scaleMult: placed.scaleMult || 1.0,
        facingFlip: Boolean(placed.flipX),
        paused: false,
        breathPhase: Math.random() * Math.PI * 2,
        state: 'idle', // 'idle' | 'graze' | 'move' | 'hop-pause'
        stateStart: now,
        stateDur: 1000 + Math.random() * 3200,
        // Path params
        p0x: placed.xPct, p0y: placed.yPct,
        pcx: placed.xPct, pcy: placed.yPct,
        p1x: placed.xPct, p1y: placed.yPct,
        hopsRemaining: 0
      };
      this.actors.set(placed.uid, actor);
    }

    if (this.actors.size > 0) {
      this.lastNow = now;
      const tick = ts => {
        this._frame(ts);
        if (this.actors.size > 0 && !this.sleeping) {
          this.rafId = requestAnimationFrame(tick);
        }
      };
      this.rafId = requestAnimationFrame(tick);
    }
  }

  _pickSafeTarget(actor, maxDistX, maxDistY) {
    const angle = Math.random() * Math.PI * 2;
    const mag = 0.45 + Math.random() * 0.55;
    let tx = actor.homeX + Math.cos(angle) * maxDistX * mag;
    let ty = actor.homeY + Math.sin(angle) * maxDistY * mag;

    // Keep comfortably inside panoramic 16:9 open lawn (avoid sky, cottage upper-left, and lotus pond lower-left)
    tx = Math.max(10, Math.min(92, tx));
    ty = Math.max(43, Math.min(91, ty));
    if (tx < 26 && ty > 66) {
      tx = 28 + Math.random() * 6;
    }
    if (tx < 28 && ty < 56) {
      ty = 57 + Math.random() * 4;
    }
    return { tx, ty };
  }

  _startMove(actor, now) {
    const cfg = actor.cfg;
    if (cfg.mode === 'hop') {
      // Discrete rabbit hop: pick a short hop step toward a gentle target near home
      if (actor.hopsRemaining <= 0) {
        const [minH, maxH] = cfg.hopsPerBurst;
        actor.hopsRemaining = minH + Math.floor(Math.random() * (maxH - minH + 1));
        const { tx, ty } = this._pickSafeTarget(actor, cfg.radiusX, cfg.radiusY);
        actor.burstTargetX = tx;
        actor.burstTargetY = ty;
      }
      const dxAll = (actor.burstTargetX ?? actor.homeX) - actor.x;
      const dyAll = (actor.burstTargetY ?? actor.homeY) - actor.y;
      const distAll = Math.hypot(dxAll, dyAll) || 1;
      const stepLen = Math.min(distAll, cfg.hopDistMin + Math.random() * (cfg.hopDistMax - cfg.hopDistMin));
      const nx = Math.max(10, Math.min(92, actor.x + (dxAll / distAll) * stepLen));
      const ny = Math.max(43, Math.min(91, actor.y + (dyAll / distAll) * stepLen));

      this._updateFacing(actor, nx - actor.x);
      actor.p0x = actor.x; actor.p0y = actor.y;
      actor.p1x = nx; actor.p1y = ny;
      actor.pcx = (actor.x + nx) / 2; actor.pcy = (actor.y + ny) / 2;
      actor.state = 'move';
      actor.stateStart = now;
      actor.stateDur = cfg.hopDur + Math.round((Math.random() - 0.5) * 70);
      actor.hopsRemaining--;
      return;
    }

    // Stroll (lamb/camel/deer) or Glide (dove) along a gentle natural curve
    const { tx, ty } = this._pickSafeTarget(actor, cfg.radiusX, cfg.radiusY);
    const dx = tx - actor.x;
    const dy = ty - actor.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.8) {
      actor.state = 'idle';
      actor.stateStart = now;
      actor.stateDur = 2200;
      return;
    }

    this._updateFacing(actor, dx);

    // Add gentle perpendicular curve midpoint so movement arcs naturally instead of skating straight!
    const perpScale = (Math.random() > 0.5 ? 1 : -1) * Math.min(2.6, dist * 0.28);
    const nxPerp = -dy / dist;
    const nyPerp = dx / dist;

    actor.p0x = actor.x; actor.p0y = actor.y;
    actor.p1x = tx; actor.p1y = ty;
    actor.pcx = (actor.x + tx) / 2 + nxPerp * perpScale;
    actor.pcy = Math.max(42, Math.min(91, (actor.y + ty) / 2 + nyPerp * perpScale));

    actor.state = 'move';
    actor.stateStart = now;
    actor.stateDur = Math.max(1500, Math.round((dist / cfg.speedPctPerSec) * 1000));
  }

  _updateFacing(actor, dx) {
    if (Math.abs(dx) < 0.25) return;
    const movingRight = dx > 0;
    actor.facingFlip = movingRight ? !actor.cfg.naturalRight : actor.cfg.naturalRight;
  }

  _frame(now) {
    for (const actor of this.actors.values()) {
      if (actor.paused || !actor.el.isConnected) continue;

      const elapsed = now - actor.stateStart;
      const tRaw = Math.min(1, elapsed / Math.max(1, actor.stateDur));
      const cfg = actor.cfg;

      let liftY = 0;       // px upward hop/flutter
      let scaleX = 1.0;
      let scaleY = 1.0;
      let tiltDeg = 0;
      let shadowScale = 1.0;

      if (actor.state === 'idle') {
        // Gentle calm organic breathing while resting on the grass
        const breath = Math.sin(now * 0.0022 + actor.breathPhase);
        scaleY = 1.0 + breath * 0.018;
        scaleX = 1.0 - breath * 0.010;

        if (tRaw >= 1) {
          // 35% chance to do a cute gentle grazing nod / look-around, 65% chance to stroll/hop!
          if (Math.random() < 0.35) {
            actor.state = 'graze';
            actor.stateStart = now;
            actor.stateDur = 1400 + Math.random() * 900;
            if (Math.random() < 0.4) actor.facingFlip = !actor.facingFlip;
          } else {
            this._startMove(actor, now);
          }
        }
      } else if (actor.state === 'graze') {
        // Soft natural head-dip grazing or happy little settle wiggle
        const g = Math.sin(tRaw * Math.PI);
        tiltDeg = g * (actor.facingFlip ? -4.2 : 4.2);
        scaleY = 1.0 - g * 0.035;
        scaleX = 1.0 + g * 0.025;
        if (tRaw >= 1) {
          actor.state = 'idle';
          actor.stateStart = now;
          actor.stateDur = 1600 + Math.random() * 2600;
        }
      } else if (actor.state === 'hop-pause') {
        // Cute soft landing squash recovery between bunny hops
        const squash = Math.sin(tRaw * Math.PI);
        scaleY = 1.0 - squash * 0.07;
        scaleX = 1.0 + squash * 0.06;
        if (tRaw >= 1) {
          if (actor.hopsRemaining > 0) {
            this._startMove(actor, now);
          } else {
            actor.state = 'idle';
            actor.stateStart = now;
            actor.stateDur = cfg.minIdle + Math.random() * (cfg.maxIdle - cfg.minIdle);
          }
        }
      } else if (actor.state === 'move') {
        let u = easeInOutSine(tRaw);

        if (cfg.mode === 'stroll') {
          // Micro-surge stride modulation so steps push forward naturally instead of sliding smoothly on ice!
          const steps = Math.max(2, Math.round((actor.stateDur / 1000) * cfg.stepFreq));
          const stepPhase = tRaw * steps * Math.PI;
          const strideBounce = Math.abs(Math.sin(stepPhase));
          const envelope = Math.sin(tRaw * Math.PI); // Smooth start & stop fade!
          const surge = Math.sin(stepPhase * 2) * (0.012 / steps) * envelope;
          u = Math.max(0, Math.min(1, u + surge));

          liftY = strideBounce * cfg.hopHeight * (0.45 + 0.55 * envelope);
          // Subtle squash at footfall, gentle stretch mid-step
          scaleY = 1.0 + (strideBounce - 0.35) * 0.045 * envelope;
          scaleX = 1.0 - (strideBounce - 0.35) * 0.028 * envelope;
          // Gentle natural side-to-side waddle tilt alternating each step
          tiltDeg = Math.sin(stepPhase) * 2.4 * envelope;
          shadowScale = 1.0 - strideBounce * 0.08 * envelope;
        } else if (cfg.mode === 'hop') {
          // True parabolic rabbit hop with takeoff stretch & airborne tuck!
          const arc = Math.sin(tRaw * Math.PI);
          liftY = arc * cfg.hopHeight;
          scaleY = 1.0 + (arc - 0.25) * 0.11;
          scaleX = 1.0 - (arc - 0.25) * 0.07;
          tiltDeg = (0.5 - tRaw) * (actor.facingFlip ? -10 : 10);
          shadowScale = 1.0 - arc * 0.26;
        } else if (cfg.mode === 'glide') {
          // Graceful dove airborne swoop with soft wing flutter!
          const arc = Math.sin(tRaw * Math.PI);
          const flutter = Math.sin(now * 0.022) * 3.5 * arc;
          liftY = arc * cfg.liftHeight + flutter;
          scaleY = 1.0 + Math.sin(now * 0.022) * 0.05 * arc;
          tiltDeg = Math.cos(tRaw * Math.PI) * (actor.facingFlip ? -6 : 6);
          shadowScale = 1.0 - arc * 0.34;
        }

        // Quadratic Bezier curved path position
        const mu = 1 - u;
        actor.x = mu * mu * actor.p0x + 2 * mu * u * actor.pcx + u * u * actor.p1x;
        actor.y = mu * mu * actor.p0y + 2 * mu * u * actor.pcy + u * u * actor.p1y;

        const depthScale = computeDepthScale(actor.y);
        const widthPct = actor.def.baseWidthPct * depthScale * actor.scaleMult;
        actor.el.style.left = `${actor.x.toFixed(2)}%`;
        actor.el.style.top = `${actor.y.toFixed(2)}%`;
        actor.el.style.width = `${widthPct.toFixed(2)}%`;
        actor.el.style.zIndex = String(Math.round(actor.y));

        if (tRaw >= 1) {
          if (cfg.mode === 'hop') {
            actor.state = 'hop-pause';
            actor.stateStart = now;
            actor.stateDur = 190 + Math.random() * 110;
          } else {
            actor.state = 'idle';
            actor.stateStart = now;
            actor.stateDur = cfg.minIdle + Math.random() * (cfg.maxIdle - cfg.minIdle);
          }
        }
      }

      // Apply organic sprite transform (anchored at bottom feet!) & matching shadow scale
      const flipSign = actor.facingFlip ? -1 : 1;
      actor.spriteEl.style.transformOrigin = '50% 94%';
      actor.spriteEl.style.transform =
        `translate3d(0, ${(-liftY).toFixed(2)}px, 0) rotate(${tiltDeg.toFixed(2)}deg) scale(${(flipSign * scaleX).toFixed(4)}, ${scaleY.toFixed(4)})`;

      if (actor.shadowEl) {
        actor.shadowEl.style.scale = `${shadowScale.toFixed(3)}`;
      }
    }
  }
}
