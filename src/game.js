import { GAME_CONFIG, LEVELS, COMMAND_LABELS } from './config.js';
import { P1_FRAMES, HAZARD_FRAMES } from './sprites.js';
import { EffectsEngine } from './particles.js';

export class ChernobylGame {
  constructor({ canvas, sprites, sound, onStateChange, onHudUpdate }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sprites = sprites;
    this.sound = sound;
    this.effects = new EffectsEngine();
    this.onStateChange = onStateChange || (() => {});
    this.onHudUpdate = onHudUpdate || (() => {});

    // Offscreen canvas for Level 2 flashlight darkness mask
    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = GAME_CONFIG.CANVAS_WIDTH;
    this.lightCanvas.height = GAME_CONFIG.CANVAS_HEIGHT;
    this.lightCtx = this.lightCanvas.getContext('2d');

    this.state = 'COVER';
    this.mode = '1p';
    this.paused = false;
    this.levelId = 1;
    this.level = null;
    this.hazards = [];
    this.valves = [];

    this.players = {
      1: this._makePlayer(1, 'Liquidador 1', 'p1'),
      2: this._makePlayer(2, 'Liquidador 2', 'p2'),
    };
    this.activePlayerId = 1;
    this.teamLives = GAME_CONFIG.TEAM_MAX_LIVES;

    this.shiftTimer = GAME_CONFIG.SHIFT_DURATION;
    this.relayTimer = 0;
    this.relayMessage = '';

    this.pulseTimer = 9.5;
    this.pulseWarned = false;
    this.missionElapsed = 0;
    this.globalTime = 0;

    this.rafId = null;
    this.lastFrame = 0;
    this.lastHudSync = 0;
  }

  _makePlayer(id, name, sheetKey) {
    return {
      id,
      name,
      sheetKey,
      col: id === 1 ? 0 : GAME_CONFIG.BOARD_COLS - 1,
      row: 2,
      drawX: (id === 1 ? 0 : GAME_CONFIG.BOARD_COLS - 1) * GAME_CONFIG.TILE_SIZE,
      drawY: 2 * GAME_CONFIG.TILE_SIZE,
      facing: { dx: id === 1 ? 1 : -1, dy: 0 },
      flipX: id === 2,
      animState: 'idle',
      animTimer: 0,
      radiation: 0,
      shieldTimer: 0,
      score: 0,
      stats: {
        extinguished: 0,
        pulsesBlocked: 0,
        valvesOpened: 0,
      },
    };
  }

  setPlayerNames(p1Name, p2Name) {
    this.players[1].name = (p1Name || '').trim() || 'Liquidador 1';
    this.players[2].name = (p2Name || '').trim() || 'Liquidador 2';
    this.emitHud();
  }

  startLoop() {
    if (this.rafId) return;
    this.lastFrame = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
      this.lastFrame = now;
      this.update(dt, now);
      this.render();
      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  stopLoop() {
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  startNewCampaign(p1Name, p2Name, mode = '1p') {
    this.mode = mode === '2p' ? '2p' : '1p';
    this.paused = false;
    this.players[1] = this._makePlayer(1, (p1Name || '').trim() || 'Liquidador 1', 'p1');
    this.players[2] = this._makePlayer(2, (p2Name || '').trim() || 'Liquidador 2', 'p2');
    this.teamLives = GAME_CONFIG.TEAM_MAX_LIVES;
    this.missionElapsed = 0;
    this.prepareLevel(1);
    this._setState('BRIEFING_1');
  }

  setPaused(paused) {
    if (!this.isPlaying()) return;
    const next = Boolean(paused);
    if (this.paused === next) return;
    this.paused = next;
    if (this.paused) {
      this.sound.stopMusic();
    } else {
      this.sound.startMusic(this.levelId === 2 ? 'level2' : 'level1');
    }
    this.onStateChange(this.getSnapshot());
    this.emitHud();
  }

  togglePause() {
    this.setPaused(!this.paused);
  }

  restartCurrentLevel() {
    this.paused = false;
    this.prepareLevel(this.levelId);
    this.beginPlayingLevel();
  }

  prepareLevel(levelId) {
    this.levelId = levelId;
    const template = LEVELS[levelId];
    this.level = template;
    this.hazards = template.hazards.map((h) => ({ ...h }));
    this.valves = template.valves.map((v) => ({ ...v }));

    this.players[1].col = template.p1Start.col;
    this.players[1].row = template.p1Start.row;
    this.players[1].drawX = template.p1Start.col * GAME_CONFIG.TILE_SIZE;
    this.players[1].drawY = template.p1Start.row * GAME_CONFIG.TILE_SIZE;
    this.players[1].facing = { dx: 1, dy: 0 };
    this.players[1].flipX = false;
    this.players[1].radiation = Math.min(this.players[1].radiation, 30);
    this.players[1].shieldTimer = 0;

    this.players[2].col = template.p2Start.col;
    this.players[2].row = template.p2Start.row;
    this.players[2].drawX = template.p2Start.col * GAME_CONFIG.TILE_SIZE;
    this.players[2].drawY = template.p2Start.row * GAME_CONFIG.TILE_SIZE;
    this.players[2].facing = { dx: -1, dy: 0 };
    this.players[2].flipX = true;
    this.players[2].radiation = Math.min(this.players[2].radiation, 30);
    this.players[2].shieldTimer = 0;

    this.activePlayerId = 1;
    this.shiftTimer = GAME_CONFIG.SHIFT_DURATION;
    this.relayTimer = 0;
    this.pulseTimer = template.pulseInterval;
    this.pulseWarned = false;
    this.effects = new EffectsEngine();
    this.emitHud();
  }

  beginPlayingLevel() {
    this.paused = false;
    if (this.levelId === 1) {
      this._setState('PLAYING_1');
      this.sound.startMusic('level1');
    } else {
      this._setState('PLAYING_2');
      this.sound.startMusic('level2');
    }
    this.sound.playRelayHorn();
    const p = this.getActivePlayer();
    this.effects.addFloatingText(
      p.drawX + GAME_CONFIG.TILE_SIZE / 2,
      p.drawY + 14,
      this.mode === '2p' ? `¡TURNO ${p.name.toUpperCase()}!` : `¡ADELANTE ${p.name.toUpperCase()}!`,
      p.id === 1 ? '#ffe58f' : '#9ee6ff'
    );
    this.emitHud();
  }

  advanceFromIntermission() {
    this.paused = false;
    this.prepareLevel(2);
    this._setState('BRIEFING_2');
  }

  returnToCover() {
    this.paused = false;
    this.sound.stopMusic();
    this._setState('COVER');
  }

  _setState(nextState) {
    this.state = nextState;
    this.onStateChange(this.getSnapshot());
    this.emitHud();
  }

  isPlaying() {
    return this.state === 'PLAYING_1' || this.state === 'PLAYING_2';
  }

  getActivePlayer() {
    return this.players[this.activePlayerId];
  }

  getRestingPlayer() {
    return this.players[this.activePlayerId === 1 ? 2 : 1];
  }

  getLevelProgress() {
    if (!this.level) return { current: 0, total: 1, label: '0/0' };
    if (this.levelId === 1) {
      const cleared = this.hazards.filter((h) => h.hp <= 0).length;
      return { current: cleared, total: this.hazards.length, label: `${cleared}/${this.hazards.length} focos` };
    }
    const opened = this.valves.filter((v) => v.progress >= v.maxProgress).length;
    return { current: opened, total: this.valves.length, label: `${opened}/${this.valves.length} válvulas` };
  }

  getSnapshot() {
    return {
      state: this.state,
      mode: this.mode,
      paused: this.paused,
      levelId: this.levelId,
      level: this.level,
      activePlayerId: this.activePlayerId,
      teamLives: this.teamLives,
      shiftTimer: this.shiftTimer,
      pulseTimer: this.pulseTimer,
      pulseWarned: this.pulseWarned,
      relayTimer: this.relayTimer,
      missionElapsed: this.missionElapsed,
      progress: this.getLevelProgress(),
      players: {
        1: { ...this.players[1], stats: { ...this.players[1].stats } },
        2: { ...this.players[2], stats: { ...this.players[2].stats } },
      },
    };
  }

  emitHud() {
    this.onHudUpdate(this.getSnapshot());
  }

  // ---------- Commands & Actions ----------
  handleCommand(cmd, rawWord = '', boosted = false) {
    if (!this.isPlaying()) return false;
    if (cmd === 'PAUSE') {
      if (!this.paused) {
        this.setPaused(true);
        return true;
      }
      return false;
    }
    if (this.paused || this.relayTimer > 0) return false;

    const p = this.getActivePlayer();
    const cx = p.drawX + GAME_CONFIG.TILE_SIZE / 2;
    const cy = p.drawY + GAME_CONFIG.TILE_SIZE / 2;

    switch (cmd) {
      case 'UP':
        return this._movePlayer(p, 0, -1);
      case 'DOWN':
        return this._movePlayer(p, 0, 1);
      case 'LEFT':
        return this._movePlayer(p, -1, 0);
      case 'RIGHT':
        return this._movePlayer(p, 1, 0);
      case 'WATER':
        return this._useWater(p, boosted);
      case 'SHIELD':
        return this._useShield(p);
      case 'VALVE':
        return this._useValve(p, boosted);
      case 'RELAY':
        if (this.mode === '2p') {
          this.triggerRelay('¡RELEVO SOLICITADO!');
          return true;
        }
        this.effects.addFloatingText(cx, cy - 14, 'MODO 1 JUGADOR', '#f2d64b');
        return false;
      default:
        if (rawWord) {
          this.effects.addFloatingText(cx, cy - 10, COMMAND_LABELS[cmd] || rawWord, '#a4ffdc');
        }
        return false;
    }
  }

  _movePlayer(p, dx, dy) {
    p.facing = { dx, dy };
    if (dx < 0) p.flipX = true;
    if (dx > 0) p.flipX = false;

    const nextCol = p.col + dx;
    const nextRow = p.row + dy;

    if (
      nextCol < 0 ||
      nextCol >= GAME_CONFIG.BOARD_COLS ||
      nextRow < 0 ||
      nextRow >= GAME_CONFIG.BOARD_ROWS
    ) {
      this.sound.playBlockedMove();
      this.effects.triggerShake(3, 0.12);
      this.effects.addFloatingText(
        p.drawX + GAME_CONFIG.TILE_SIZE / 2,
        p.drawY + 12,
        'BORDE DEL SECTOR',
        '#ff9a1f'
      );
      return false;
    }

    const blockingHazard = this.hazards.find(
      (h) => h.hp > 0 && h.col === nextCol && h.row === nextRow
    );
    if (blockingHazard) {
      this.sound.playBlockedMove();
      this.effects.triggerShake(4, 0.14);
      this.effects.addFloatingText(
        nextCol * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
        nextRow * GAME_CONFIG.TILE_SIZE + 18,
        '¡USA AGUA!',
        '#ffdd55'
      );
      return false;
    }

    p.col = nextCol;
    p.row = nextRow;
    p.animState = 'walk';
    p.animTimer = 0.28;
    this.sound.playStep();
    this.emitHud();
    return true;
  }

  _useWater(p, boosted) {
    p.animState = 'water';
    p.animTimer = 0.42;
    const cx = p.drawX + GAME_CONFIG.TILE_SIZE / 2;
    const cy = p.drawY + GAME_CONFIG.TILE_SIZE / 2;

    this.sound.playWaterJet(boosted);
    this.effects.emitWaterJet(cx, cy, p.facing.dx, p.facing.dy, boosted);
    this.effects.emitVoiceWave(cx, cy, boosted);

    // Hit hazards in front (up to 2 tiles) OR orthogonally adjacent (1 tile)
    const dmg = boosted ? 2 : 1;
    let hits = 0;
    let extinguishedNow = 0;

    for (const h of this.hazards) {
      if (h.hp <= 0) continue;
      const dist = Math.abs(h.col - p.col) + Math.abs(h.row - p.row);
      const inFront1 = h.col === p.col + p.facing.dx && h.row === p.row + p.facing.dy;
      const inFront2 = h.col === p.col + p.facing.dx * 2 && h.row === p.row + p.facing.dy * 2;
      if (dist <= 1 || inFront1 || inFront2) {
        h.hp = Math.max(0, h.hp - dmg);
        hits++;
        const hx = h.col * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
        const hy = h.row * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
        this.effects.emitSteam(hx, hy, 16);

        if (h.hp === 0) {
          extinguishedNow++;
          p.stats.extinguished += 1;
          const pts = boosted ? 250 : 200;
          p.score += pts;
          this.sound.playExtinguish();
          this.effects.addFloatingText(
            hx,
            hy - 10,
            boosted ? `+${pts} ¡POTENCIADO!` : `+${pts} ¡EXTINGUIDO!`,
            boosted ? '#ffe58f' : '#a4ffdc'
          );
        } else {
          p.score += 75;
          this.effects.addFloatingText(hx, hy - 10, '+75 ENFRIADO (1/2)', '#38d9ff');
        }
      }
    }

    if (hits === 0) {
      this.effects.addFloatingText(
        cx,
        cy - 16,
        boosted ? '¡CHORRO POTENCIADO!' : 'CHORRO DE AGUA',
        '#38d9ff'
      );
    }

    this.emitHud();
    this._checkObjectives();
    return true;
  }

  _useShield(p) {
    p.shieldTimer = GAME_CONFIG.SHIELD_DURATION;
    p.animState = 'shield';
    p.animTimer = 0.65;
    const cx = p.drawX + GAME_CONFIG.TILE_SIZE / 2;
    const cy = p.drawY + GAME_CONFIG.TILE_SIZE / 2;
    this.sound.playShield();
    this.effects.addRing(cx, cy, 78, '#22ff99', 4);
    this.effects.addFloatingText(cx, cy - 22, '¡ESCUDO DE PLOMO!', '#22ff99');
    this.emitHud();
    return true;
  }

  _useValve(p, boosted) {
    const cx = p.drawX + GAME_CONFIG.TILE_SIZE / 2;
    const cy = p.drawY + GAME_CONFIG.TILE_SIZE / 2;

    if (this.levelId !== 2) {
      this.effects.addFloatingText(cx, cy - 14, 'VÁLVULAS EN NIVEL 2', '#f2c94c');
      return false;
    }

    const target = this.valves.find(
      (v) => v.progress < v.maxProgress && Math.abs(v.col - p.col) + Math.abs(v.row - p.row) <= 1
    );
    if (!target) {
      this.sound.playBlockedMove();
      this.effects.addFloatingText(cx, cy - 14, 'ACÉRCATE A UNA VÁLVULA', '#ff9a1f');
      return false;
    }

    const step = boosted ? 2 : 1;
    target.progress = Math.min(target.maxProgress, target.progress + step);
    const completed = target.progress >= target.maxProgress;
    const vx = target.col * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
    const vy = target.row * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;

    this.sound.playValveTurn(completed);
    this.effects.emitVoiceWave(vx, vy, boosted);
    this.effects.emitSparks(vx, vy, completed ? 18 : 10, completed ? '#22ff99' : '#ffe58f');

    if (completed) {
      p.score += 350;
      p.stats.valvesOpened += 1;
      this.effects.addRing(vx, vy, 92, '#22ff99', 5);
      this.effects.addFloatingText(vx, vy - 14, '+350 ¡VÁLVULA ABIERTA!', '#22ff99');
    } else {
      p.score += 150;
      this.effects.addFloatingText(vx, vy - 14, '+150 ¡GIRADA 50%! DI VÁLVULA', '#ffe58f');
    }

    this.emitHud();
    this._checkObjectives();
    return true;
  }

  triggerRelay(label = '¡CAMBIO DE TURNO!') {
    if (!this.isPlaying() || this.relayTimer > 0) return;

    const outgoing = this.getActivePlayer();
    this.activePlayerId = this.activePlayerId === 1 ? 2 : 1;
    const incoming = this.getActivePlayer();

    // Resting teammate gets partial decontamination while off-shift
    outgoing.radiation = Math.max(0, outgoing.radiation - 22);
    outgoing.shieldTimer = 0;

    this.shiftTimer = GAME_CONFIG.SHIFT_DURATION;
    this.relayTimer = GAME_CONFIG.RELAY_BANNER_DURATION;
    this.relayMessage = `${label} ENTRA ${incoming.name.toUpperCase()}`;

    this.sound.playRelayHorn();
    this.effects.emitSteam(
      incoming.drawX + GAME_CONFIG.TILE_SIZE / 2,
      incoming.drawY + GAME_CONFIG.TILE_SIZE / 2,
      18
    );
    this.effects.addRing(
      incoming.drawX + GAME_CONFIG.TILE_SIZE / 2,
      incoming.drawY + GAME_CONFIG.TILE_SIZE / 2,
      82,
      incoming.id === 1 ? '#f2c94c' : '#38bdf8',
      4
    );
    this.emitHud();
  }

  _checkObjectives() {
    if (this.levelId === 1) {
      const remaining = this.hazards.some((h) => h.hp > 0);
      if (!remaining) {
        this.sound.stopMusic();
        this.sound.playVictory();
        this._setState('INTERMISSION');
      }
    } else if (this.levelId === 2) {
      const remaining = this.valves.some((v) => v.progress < v.maxProgress);
      if (!remaining) {
        this.sound.stopMusic();
        this.sound.playVictory();
        this._setState('VICTORY');
      }
    }
  }

  // ---------- Main Update ----------
  update(dt, now) {
    if (this.paused) return;

    this.globalTime += dt;
    this.effects.update(dt);

    if (!this.isPlaying()) return;

    // Smooth visual interpolation for players
    for (const id of [1, 2]) {
      const p = this.players[id];
      const targetX = p.col * GAME_CONFIG.TILE_SIZE;
      const targetY = p.row * GAME_CONFIG.TILE_SIZE;
      const lerp = Math.min(1, dt * 14);
      p.drawX += (targetX - p.drawX) * lerp;
      p.drawY += (targetY - p.drawY) * lerp;

      if (p.animTimer > 0) {
        p.animTimer = Math.max(0, p.animTimer - dt);
        if (p.animTimer === 0) p.animState = 'idle';
      }
      if (p.shieldTimer > 0) {
        p.shieldTimer = Math.max(0, p.shieldTimer - dt);
      }
    }

    // Pause hazards/timers briefly during relay banner
    if (this.relayTimer > 0) {
      this.relayTimer = Math.max(0, this.relayTimer - dt);
      if (now - this.lastHudSync > 120) {
        this.lastHudSync = now;
        this.emitHud();
      }
      return;
    }

    this.missionElapsed += dt;
    if (this.mode === '2p') {
      this.shiftTimer -= dt;
      if (this.shiftTimer <= 0) {
        this.triggerRelay('¡TIEMPO DE EXPOSICIÓN LÍMITE!');
        return;
      }
    }

    const active = this.getActivePlayer();

    // Ambient radiation exposure near active hazards
    let nearbyHazards = 0;
    for (const h of this.hazards) {
      if (h.hp <= 0) continue;
      const dist = Math.abs(h.col - active.col) + Math.abs(h.row - active.row);
      if (dist <= 1) nearbyHazards++;
    }
    const ambientRate = (this.levelId === 2 ? 1.8 : 1.3) + nearbyHazards * 2.1;
    const radFactor = active.shieldTimer > 0 ? 0.15 : 1.0;
    active.radiation = Math.min(100, active.radiation + ambientRate * radFactor * dt);
    this.sound.updateGeiger(dt, Math.min(1, active.radiation / 100 + nearbyHazards * 0.2));

    // Periodic intense radiation pulse
    this.pulseTimer -= dt;
    if (this.pulseTimer <= this.level.pulseWarning && !this.pulseWarned) {
      this.pulseWarned = true;
      this.sound.playRadiationWarning();
      this.effects.addFloatingText(
        GAME_CONFIG.CANVAS_WIDTH / 2,
        42,
        '¡ALERTA PULSO! DI "ESCUDO"',
        '#ff604d'
      );
    }

    if (this.pulseTimer <= 0) {
      this.pulseTimer = this.level.pulseInterval;
      this.pulseWarned = false;
      this._resolveRadiationPulse(active);
    }

    if (active.radiation >= 100) {
      this._handleOverexposure(active);
    }

    // Ambient sparks on active fires
    if (Math.random() < dt * 7) {
      const liveFires = this.hazards.filter((h) => h.hp > 0);
      if (liveFires.length > 0) {
        const pick = liveFires[Math.floor(Math.random() * liveFires.length)];
        this.effects.emitSparks(
          pick.col * GAME_CONFIG.TILE_SIZE + 48,
          pick.row * GAME_CONFIG.TILE_SIZE + 40,
          1,
          pick.type === 'fire' ? '#ff9a1f' : '#22ff99'
        );
      }
    }

    if (now - this.lastHudSync > 120) {
      this.lastHudSync = now;
      this.emitHud();
    }
  }

  _resolveRadiationPulse(active) {
    const cx = active.drawX + GAME_CONFIG.TILE_SIZE / 2;
    const cy = active.drawY + GAME_CONFIG.TILE_SIZE / 2;

    if (active.shieldTimer > 0) {
      active.score += 150;
      active.stats.pulsesBlocked += 1;
      this.sound.playShieldBlock();
      this.effects.addRing(cx, cy, 130, '#22ff99', 6);
      this.effects.triggerFlash('#22ff99', 0.22);
      this.effects.addFloatingText(cx, cy - 26, '+150 ¡PULSO BLOQUEADO!', '#22ff99');
    } else {
      active.radiation = Math.min(100, active.radiation + this.level.pulseDamage);
      this.sound.playRadiationHit();
      this.effects.triggerShake(9, 0.35);
      this.effects.triggerFlash('#ff3322', 0.38);
      this.effects.addRing(GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2, 340, '#22ff99', 5);
      this.effects.addFloatingText(cx, cy - 26, `-${this.level.pulseDamage}% ¡PULSO SIN ESCUDO!`, '#ff604d');
    }
    this.emitHud();
  }

  _handleOverexposure(active) {
    this.teamLives -= 1;
    active.radiation = 0;
    this.sound.playRadiationHit();
    this.effects.triggerShake(12, 0.45);
    this.effects.triggerFlash('#ff2222', 0.55);

    if (this.teamLives <= 0) {
      this.sound.stopMusic();
      this.sound.playGameOver();
      this._setState('GAMEOVER');
      return;
    }

    if (this.mode === '2p') {
      this.triggerRelay('¡DOSIS CRÍTICA! EVACUANDO Y');
    } else {
      const cx = active.drawX + GAME_CONFIG.TILE_SIZE / 2;
      const cy = active.drawY + GAME_CONFIG.TILE_SIZE / 2;
      this.effects.emitSteam(cx, cy, 20);
      this.effects.addFloatingText(cx, cy - 20, '¡TRAJE DESCONTAMINADO! (-1 VIDA)', '#f2d64b');
      this.emitHud();
    }
  }

  // ---------- Render ----------
  render() {
    const ctx = this.ctx;
    const W = GAME_CONFIG.CANVAS_WIDTH;
    const H = GAME_CONFIG.CANVAS_HEIGHT;

    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false;

    if (!this.level || !this.sprites.loaded) {
      ctx.fillStyle = '#090e16';
      ctx.fillRect(0, 0, W, H);
      return;
    }

    const shake = this.effects.getShakeOffset();
    ctx.save();
    ctx.translate(shake.x, shake.y);

    // 1. Tile map
    const tileMap = this.level.tileMap;
    const waterFrameShift = Math.floor(this.globalTime * 2) % 2;
    for (let r = 0; r < GAME_CONFIG.BOARD_ROWS; r++) {
      for (let c = 0; c < GAME_CONFIG.BOARD_COLS; c++) {
        let tileIdx = tileMap[r][c];
        if (this.levelId === 2 && tileIdx === 2) {
          tileIdx = 2 + waterFrameShift;
        }
        this.sprites.drawFrame(
          ctx,
          this.level.sheetKey,
          tileIdx,
          c * GAME_CONFIG.TILE_SIZE,
          r * GAME_CONFIG.TILE_SIZE,
          GAME_CONFIG.TILE_SIZE
        );
      }
    }

    // 2. Subtle tactical grid lines & active sector highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let c = 1; c < GAME_CONFIG.BOARD_COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * GAME_CONFIG.TILE_SIZE, 0);
      ctx.lineTo(c * GAME_CONFIG.TILE_SIZE, H);
      ctx.stroke();
    }
    for (let r = 1; r < GAME_CONFIG.BOARD_ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * GAME_CONFIG.TILE_SIZE);
      ctx.lineTo(W, r * GAME_CONFIG.TILE_SIZE);
      ctx.stroke();
    }

    // 3. Valves (Level 2)
    for (const v of this.valves) {
      const vx = v.col * GAME_CONFIG.TILE_SIZE;
      const vy = v.row * GAME_CONFIG.TILE_SIZE;
      const open = v.progress >= v.maxProgress;
      this.sprites.drawFrame(
        ctx,
        'hazards',
        open ? HAZARD_FRAMES.VALVE_OPEN : HAZARD_FRAMES.VALVE_CLOSED,
        vx,
        vy,
        GAME_CONFIG.TILE_SIZE
      );
      this._drawTileBar(ctx, vx + 14, vy + 6, GAME_CONFIG.TILE_SIZE - 28, 7, v.progress / v.maxProgress, open ? '#22ff99' : '#ff604d');
    }

    // 4. Active Hazards (Fire / Graphite)
    const hazardAnim = Math.floor(this.globalTime * 5) % 2;
    for (const h of this.hazards) {
      if (h.hp <= 0) continue;
      const hx = h.col * GAME_CONFIG.TILE_SIZE;
      const hy = h.row * GAME_CONFIG.TILE_SIZE;
      const frame =
        h.type === 'fire'
          ? (hazardAnim === 0 ? HAZARD_FRAMES.FIRE_1 : HAZARD_FRAMES.FIRE_2)
          : (hazardAnim === 0 ? HAZARD_FRAMES.GRAPHITE_1 : HAZARD_FRAMES.GRAPHITE_2);
      this.sprites.drawFrame(ctx, 'hazards', frame, hx, hy, GAME_CONFIG.TILE_SIZE);
      if (h.maxHp > 1) {
        this._drawTileBar(ctx, hx + 16, hy + 6, GAME_CONFIG.TILE_SIZE - 32, 6, h.hp / h.maxHp, '#00e5ff');
      }
    }

    // 5. Players (Resting player drawn only in 2P mode)
    const active = this.getActivePlayer();
    if (this.mode === '2p') {
      const resting = this.getRestingPlayer();
      this._drawPlayer(ctx, resting, false);
    }
    this._drawPlayer(ctx, active, true);

    // 6. Effects (particles, water jets, rings, floating labels)
    this.effects.draw(ctx);

    // 7. Level 2 Flashlight darkness overlay
    if (this.level.darkness) {
      this._renderDarkness(ctx, active);
    }

    // 8. Radiation pulse warning border & countdown banner (Chernobyl CRT frame)
    if (this.pulseWarned && this.isPlaying()) {
      const pulseBlink = 0.45 + 0.4 * Math.sin(this.globalTime * 14);
      ctx.save();
      ctx.strokeStyle = `rgba(230, 69, 50, ${pulseBlink})`;
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, W - 8, H - 8);

      const bw = 460;
      const bh = 34;
      const bx = W / 2 - bw / 2;
      const by = 10;
      ctx.fillStyle = '#070907';
      ctx.fillRect(bx + 4, by + 4, bw, bh);
      ctx.fillStyle = '#1b0b09';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = '#e64532';
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.strokeStyle = '#070907';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx - 2, by - 2, bw + 4, bh + 4);

      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#070907';
      ctx.fillText(`! PULSO EN ${this.pulseTimer.toFixed(1)}s - DI "ESCUDO" !`, W / 2 + 2, by + 23);
      ctx.fillStyle = '#f2d64b';
      ctx.fillText(`! PULSO EN ${this.pulseTimer.toFixed(1)}s - DI "ESCUDO" !`, W / 2, by + 21);
      ctx.restore();
    }

    // 9. Relay banner (Chernobyl rusted metal + phosphor screen)
    if (this.relayTimer > 0) {
      const accent = active.id === 1 ? '#f2d64b' : '#62b6e6';
      const rw = W - 72;
      const rh = 96;
      const rx = 36;
      const ry = H / 2 - rh / 2;
      ctx.save();
      ctx.fillStyle = '#070907';
      ctx.fillRect(rx + 6, ry + 6, rw, rh);
      ctx.fillStyle = '#4a5044';
      ctx.fillRect(rx - 4, ry - 4, rw + 8, rh + 8);
      ctx.fillStyle = '#8a441f';
      ctx.fillRect(rx - 4, ry - 4, 14, 8);
      ctx.fillRect(rx + rw - 10, ry + rh - 4, 14, 8);
      ctx.fillStyle = '#0a120d';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(rx + 2, ry + 2, rw - 4, rh - 4);
      ctx.strokeStyle = '#070907';
      ctx.lineWidth = 3;
      ctx.strokeRect(rx - 4, ry - 4, rw + 8, rh + 8);

      ctx.textAlign = 'center';
      ctx.font = '13px "Press Start 2P", monospace';
      ctx.fillStyle = '#070907';
      ctx.fillText('RELEVO DE LIQUIDADORES', W / 2 + 2, H / 2 - 8);
      ctx.fillStyle = '#48ff62';
      ctx.fillText('RELEVO DE LIQUIDADORES', W / 2, H / 2 - 10);

      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = '#070907';
      ctx.fillText(this.relayMessage, W / 2 + 2, H / 2 + 22);
      ctx.fillStyle = accent;
      ctx.fillText(this.relayMessage, W / 2, H / 2 + 20);
      ctx.restore();
    }

    this.effects.drawScreenOverlay(ctx, W, H);
    ctx.restore();
  }

  _drawPlayer(ctx, p, isActive) {
    const cx = p.drawX + GAME_CONFIG.TILE_SIZE / 2;
    const cy = p.drawY + GAME_CONFIG.TILE_SIZE / 2;
    const color = p.id === 1 ? '#f2c94c' : '#38bdf8';

    ctx.save();
    if (!isActive) {
      ctx.globalAlpha = 0.42;
    } else {
      // Tactical active ring + facing direction indicator
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, p.drawY + GAME_CONFIG.TILE_SIZE - 12, 28, 10, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Facing chevron
      const fx = cx + p.facing.dx * 38;
      const fy = cy + p.facing.dy * 38;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(fx, fy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    let frame = Math.floor(this.globalTime * 3) % 2 === 0 ? P1_FRAMES.IDLE_1 : P1_FRAMES.IDLE_2;
    if (p.shieldTimer > 0) {
      frame = P1_FRAMES.SHIELD;
    } else if (p.animState === 'water') {
      frame = P1_FRAMES.WATER;
    } else if (p.animState === 'walk') {
      frame = P1_FRAMES.WALK;
    }

    this.sprites.drawFrame(ctx, p.sheetKey, frame, p.drawX, p.drawY, GAME_CONFIG.TILE_SIZE, p.flipX);

    // Shield progress ring if active
    if (p.shieldTimer > 0 && isActive) {
      ctx.strokeStyle = '#22ff99';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 44, -Math.PI / 2, -Math.PI / 2 + (p.shieldTimer / GAME_CONFIG.SHIELD_DURATION) * Math.PI * 2);
      ctx.stroke();
    }

    // Player tag badge (Chernobyl phosphor frame)
    const tagW = isActive ? 34 : 58;
    const tagX = Math.round(cx - tagW / 2);
    const tagY = Math.round(p.drawY - 2);
    ctx.fillStyle = '#070907';
    ctx.fillRect(tagX - 2, tagY - 2, tagW + 4, 18);
    ctx.fillStyle = '#0a120d';
    ctx.fillRect(tagX, tagY, tagW, 14);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(tagX, tagY, tagW, 14);
    ctx.fillStyle = color;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isActive ? `J${p.id}` : `J${p.id}(R)`, cx, tagY + 11);
    ctx.restore();
  }

  _drawTileBar(ctx, x, y, w, h, ratio, color) {
    const fillW = Math.round(w * Math.max(0, Math.min(1, ratio)));
    ctx.fillStyle = '#070907';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#0a120d';
    ctx.fillRect(x, y, w, h);
    if (fillW > 0) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, fillW, h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(x, y, fillW, 1);
    }
    ctx.fillStyle = '#070907';
    for (let sx = 8; sx < w; sx += 8) {
      ctx.fillRect(x + sx, y, 2, h);
    }
  }

  _renderDarkness(ctx, active) {
    const lctx = this.lightCtx;
    const W = GAME_CONFIG.CANVAS_WIDTH;
    const H = GAME_CONFIG.CANVAS_HEIGHT;

    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, W, H);
    lctx.fillStyle = 'rgba(4, 10, 6, 0.88)';
    lctx.fillRect(0, 0, W, H);

    lctx.globalCompositeOperation = 'destination-out';

    // Active player's main flashlight halo
    const px = active.drawX + GAME_CONFIG.TILE_SIZE / 2;
    const py = active.drawY + GAME_CONFIG.TILE_SIZE / 2;
    const mainGrad = lctx.createRadialGradient(px, py, 28, px, py, GAME_CONFIG.FLASHLIGHT_RADIUS);
    mainGrad.addColorStop(0, 'rgba(0,0,0,1)');
    mainGrad.addColorStop(0.65, 'rgba(0,0,0,0.88)');
    mainGrad.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = mainGrad;
    lctx.beginPath();
    lctx.arc(px, py, GAME_CONFIG.FLASHLIGHT_RADIUS, 0, Math.PI * 2);
    lctx.fill();

    // Small beacon glows on valves & live hazards so players have spatial orientation
    for (const v of this.valves) {
      const vx = v.col * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
      const vy = v.row * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
      const g = lctx.createRadialGradient(vx, vy, 8, vx, vy, 58);
      g.addColorStop(0, 'rgba(0,0,0,0.85)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g;
      lctx.beginPath();
      lctx.arc(vx, vy, 58, 0, Math.PI * 2);
      lctx.fill();
    }

    for (const h of this.hazards) {
      if (h.hp <= 0) continue;
      const hx = h.col * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
      const hy = h.row * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
      const g = lctx.createRadialGradient(hx, hy, 6, hx, hy, 52);
      g.addColorStop(0, 'rgba(0,0,0,0.75)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g;
      lctx.beginPath();
      lctx.arc(hx, hy, 52, 0, Math.PI * 2);
      lctx.fill();
    }

    ctx.drawImage(this.lightCanvas, 0, 0);
  }
}
