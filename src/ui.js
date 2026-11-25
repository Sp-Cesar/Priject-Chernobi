import { GAME_CONFIG, LEVELS, HISTORICAL_IMPACT, COMMAND_LABELS } from './config.js';

export class GameUI {
  constructor({ game, voice, sound }) {
    this.game = game;
    this.voice = voice;
    this.sound = sound;

    this.els = {
      screenCover: document.getElementById('screen-cover'),
      screenGame: document.getElementById('screen-game'),
      dialog: document.getElementById('mission-dialog'),
      dialogIcon: document.getElementById('dialog-icon'),
      dialogHeroGrid: document.getElementById('dialog-hero-grid'),
      dialogBanner: document.getElementById('dialog-banner'),
      dialogKicker: document.getElementById('dialog-kicker'),
      dialogTitle: document.getElementById('dialog-title'),
      dialogBody: document.getElementById('dialog-body'),
      dialogTelemetry: document.getElementById('dialog-telemetry'),
      dialogStats: document.getElementById('dialog-stats'),
      dialogFacts: document.getElementById('dialog-facts'),
      dialogPrimaryBtn: document.getElementById('dialog-primary-btn'),
      dialogSecondaryBtn: document.getElementById('dialog-secondary-btn'),
      dialogTertiaryBtn: document.getElementById('dialog-tertiary-btn'),

      mode1pBtn: document.getElementById('mode-1p-btn'),
      mode2pBtn: document.getElementById('mode-2p-btn'),
      playersForm: document.getElementById('players-form'),
      p2FieldGroup: document.getElementById('p2-field-group'),
      p1Input: document.getElementById('p1-name'),
      p2Input: document.getElementById('p2-name'),
      coverMicBtn: document.getElementById('cover-mic-btn'),
      coverMicIcon: document.getElementById('cover-mic-icon'),
      coverMicLabel: document.getElementById('cover-mic-label'),
      coverStartBtn: document.getElementById('cover-start-btn'),
      coverMicStatus: document.getElementById('cover-mic-status'),
      coverVuFill: document.getElementById('cover-vu-fill'),
      coverTranscript: document.getElementById('cover-transcript'),

      pauseBtn: document.getElementById('pause-btn'),
      muteBtn: document.getElementById('mute-btn'),
      muteIcon: document.getElementById('mute-icon'),
      muteLabel: document.getElementById('mute-label'),
      gameMicBtn: document.getElementById('game-mic-btn'),
      gameMicIcon: document.getElementById('game-mic-icon'),
      gameMicLabel: document.getElementById('game-mic-label'),
      kbToggleBtn: document.getElementById('kb-toggle-btn'),
      kbPanel: document.getElementById('kb-backup-panel'),

      hudP1Card: document.getElementById('hud-p1-card'),
      hudP2Card: document.getElementById('hud-p2-card'),
      hudP1Name: document.getElementById('hud-p1-name'),
      hudP2Name: document.getElementById('hud-p2-name'),
      hudP1Score: document.getElementById('hud-p1-score'),
      hudP2Score: document.getElementById('hud-p2-score'),
      hudP1State: document.getElementById('hud-p1-state'),
      hudP2State: document.getElementById('hud-p2-state'),
      hudP1Rad: document.getElementById('hud-p1-rad'),
      hudP2Rad: document.getElementById('hud-p2-rad'),

      hudLevelTitle: document.getElementById('hud-level-title'),
      hudProgressLabel: document.getElementById('hud-progress-label'),
      hudProgressFill: document.getElementById('hud-progress-fill'),
      hudClockLabel: document.getElementById('hud-clock-label'),
      hudShiftTimer: document.getElementById('hud-shift-timer'),
      hudLives: document.getElementById('hud-lives'),

      hudMsv: document.getElementById('hud-msv'),
      hudDanger: document.getElementById('hud-danger'),
      geigerNeedle: document.getElementById('geiger-needle'),
      voiceRadar: document.getElementById('voice-radar'),

      voiceStatusPill: document.getElementById('voice-status-pill'),
      voiceVuFill: document.getElementById('voice-vu-fill'),
      voiceBoostIndicator: document.getElementById('voice-boost-indicator'),
      voiceTranscript: document.getElementById('voice-transcript'),
      voiceLastCmd: document.getElementById('voice-last-cmd'),
      valveCmdItem: document.getElementById('cmd-item-valve'),
      cmdItemRelay: document.getElementById('cmd-item-relay'),
      btnBackupRelay: document.getElementById('btn-backup-relay'),
      liveAnnouncer: document.getElementById('live-announcer'),
    };

    this.cmdFlashTimer = null;
    this.dialogAction = null;
    this.secondaryAction = null;
    this.tertiaryAction = null;
    this.lastRenderedLives = -1;
    this.lastVoiceState = 'idle';
    this.selectedMode = '1p';

    this.latestVolume = 0;
    this.radarAngle = 0;
    this.radarSamples = new Array(28).fill(0.08);
    this.radarCtx = this.els.voiceRadar ? this.els.voiceRadar.getContext('2d') : null;

    this._bindEvents();
    this._startRadarLoop();
  }

  _bindEvents() {
    const activateAudioAndMic = async () => {
      this.sound.unlock();
      if (!this.voice.active) {
        await this.voice.start();
      } else {
        this.voice.stop();
      }
      this._syncMicButtons();
    };

    this.els.mode1pBtn.addEventListener('click', () => this._setMode('1p'));
    this.els.mode2pBtn.addEventListener('click', () => this._setMode('2p'));

    this.els.coverMicBtn.addEventListener('click', activateAudioAndMic);
    this.els.gameMicBtn.addEventListener('click', activateAudioAndMic);

    this.els.coverStartBtn.addEventListener('click', async () => {
      this.sound.unlock();
      if (!this.voice.active && this.voice.supported) {
        await this.voice.start();
        this._syncMicButtons();
      }
      this.game.startNewCampaign(this.els.p1Input.value, this.els.p2Input.value, this.selectedMode);
    });

    this.els.pauseBtn.addEventListener('click', () => {
      this.sound.unlock();
      this.game.togglePause();
    });

    this.els.muteBtn.addEventListener('click', () => {
      this.sound.unlock();
      const muted = this.sound.toggleMute();
      this.els.muteBtn.setAttribute('aria-pressed', String(muted));
      this.els.muteIcon.src = muted ? 'assets/sprites/ui/audio_off.png' : 'assets/sprites/ui/audio_on.png';
      this.els.muteLabel.textContent = muted ? 'AUDIO: OFF' : 'AUDIO: ON';
    });

    this.els.kbToggleBtn.addEventListener('click', () => {
      const expanded = this.els.kbToggleBtn.getAttribute('aria-expanded') === 'true';
      const next = !expanded;
      this.els.kbToggleBtn.setAttribute('aria-expanded', String(next));
      this.els.kbPanel.hidden = !next;
    });

    this.els.dialogPrimaryBtn.addEventListener('click', () => {
      this.sound.unlock();
      if (this.dialogAction) {
        const fn = this.dialogAction;
        this.dialogAction = null;
        this.els.dialog.close();
        fn();
      }
    });

    this.els.dialogSecondaryBtn.addEventListener('click', () => {
      this.sound.unlock();
      if (this.secondaryAction) {
        const fn = this.secondaryAction;
        this.secondaryAction = null;
        this.els.dialog.close();
        fn();
      }
    });

    this.els.dialogTertiaryBtn.addEventListener('click', () => {
      this.sound.unlock();
      if (this.tertiaryAction) {
        const fn = this.tertiaryAction;
        this.tertiaryAction = null;
        this.els.dialog.close();
        fn();
      }
    });

    this.els.dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      if (this.game.paused) {
        this.game.setPaused(false);
        return;
      }
      if (this.secondaryAction) {
        this.els.dialogSecondaryBtn.click();
      }
    });

    document.querySelectorAll('[data-cmd]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.sound.unlock();
        const cmd = btn.getAttribute('data-cmd');
        this.triggerCommandFromUI(cmd, false);
      });
    });
  }

  _setMode(mode) {
    this.selectedMode = mode === '2p' ? '2p' : '1p';
    this.els.mode1pBtn.setAttribute('aria-pressed', String(this.selectedMode === '1p'));
    this.els.mode2pBtn.setAttribute('aria-pressed', String(this.selectedMode === '2p'));
    this.els.playersForm.dataset.mode = this.selectedMode;
    this.els.p2FieldGroup.hidden = this.selectedMode === '1p';
  }

  _startRadarLoop() {
    if (!this.radarCtx) return;
    let lastDraw = 0;
    const step = (now) => {
      if (now - lastDraw >= 65) {
        lastDraw = now;
        this.radarAngle = (this.radarAngle + 0.24) % (Math.PI * 2);
        const val = this.voice.active
          ? Math.max(0.08, this.latestVolume)
          : 0.08 + 0.06 * Math.sin(now * 0.004);
        this.radarSamples.shift();
        this.radarSamples.push(val);
        this._drawVoiceRadar(now);
      }
      window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

  _drawVoiceRadar(now) {
    const ctx = this.radarCtx;
    const canvas = this.els.voiceRadar;
    if (!ctx || !canvas) return;
    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = '#060d08';
    ctx.fillRect(0, 0, W, H);

    // Subtle phosphor grid
    ctx.strokeStyle = '#112a18';
    ctx.lineWidth = 1;
    for (let x = 58; x < W; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(58, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    // Left circular radar sweep
    const cx = 26;
    const cy = 26;
    const r = 20;
    ctx.strokeStyle = '#1f5e2c';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.stroke();

    // Sweep sector
    ctx.strokeStyle = this.voice.active ? '#48ff62' : '#268a39';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(this.radarAngle) * r, cy + Math.sin(this.radarAngle) * r);
    ctx.stroke();

    // Radar blip
    const blipPulse = Math.floor(now / 320) % 2 === 0;
    ctx.fillStyle = blipPulse ? '#ff7828' : '#f2d64b';
    ctx.fillRect(cx + 6, cy - 8, 3, 3);

    // Right voice spectrum bars
    const startX = 58;
    const barW = 6;
    const gap = 2;
    for (let i = 0; i < this.radarSamples.length; i++) {
      const s = Math.min(1, this.radarSamples[i]);
      const bh = Math.max(4, Math.round(s * (H - 10)));
      const bx = startX + i * (barW + gap);
      const by = Math.round((H - bh) / 2);
      ctx.fillStyle = s >= GAME_CONFIG.VOICE_BOOST_THRESHOLD
        ? '#f2d64b'
        : (this.voice.active ? '#48ff62' : '#235e30');
      ctx.fillRect(bx, by, barW, bh);
    }
  }

  triggerCommandFromUI(cmd, boosted = false) {
    if (this.els.dialog.open && cmd === 'NEXT') {
      this.els.dialogPrimaryBtn.click();
      return;
    }
    this.game.handleCommand(cmd, COMMAND_LABELS[cmd] || cmd, boosted);
    this.showRecognizedCommand(cmd, boosted);
  }

  _syncMicButtons() {
    const active = this.voice.active;
    const iconSrc = active ? 'assets/sprites/ui/mic_on.png' : 'assets/sprites/ui/mic_off.png';
    this.els.coverMicBtn.setAttribute('aria-pressed', String(active));
    this.els.coverMicIcon.src = iconSrc;
    this.els.coverMicLabel.textContent = active ? 'MIC ACTIVO (PARAR)' : 'PROBAR MICRÓFONO';

    this.els.gameMicBtn.setAttribute('aria-pressed', String(active));
    this.els.gameMicIcon.src = iconSrc;
    this.els.gameMicLabel.textContent = active ? 'MIC: ON' : 'MIC: OFF';
  }

  updateVoiceStatus({ state, message }) {
    this._syncMicButtons();
    this.els.coverMicStatus.textContent = message;
    this.els.coverMicStatus.dataset.state = state;

    const labels = {
      listening: 'SEÑAL ACTIVA',
      requesting: 'SOLICITANDO...',
      denied: 'SIN PERMISO',
      network: 'USA CHROME/EDGE',
      unsupported: 'NO SOPORTADO',
      warning: 'RECONECTANDO',
      idle: 'SEÑAL OFF',
    };
    this.els.voiceStatusPill.textContent = labels[state] || 'MIC';
    this.els.voiceStatusPill.dataset.state = state;

    if (state === 'network') {
      this.els.voiceTranscript.textContent = 'Abre http://127.0.0.1:4173 en Chrome o Edge.';
    } else if (state === 'denied' || state === 'unsupported') {
      this.els.voiceTranscript.textContent = message;
    } else if (state === 'listening' && this.lastVoiceState !== 'listening') {
      this.els.voiceTranscript.textContent = 'Escuchando comandos...';
    } else if (state === 'idle') {
      this.els.voiceTranscript.textContent = 'Esperando comando...';
    }
    this.lastVoiceState = state;
  }

  updateVolume(level) {
    this.latestVolume = level;
    const pct = Math.round(Math.min(1, level) * 100);
    this.els.coverVuFill.style.inlineSize = `${pct}%`;
    this.els.voiceVuFill.style.inlineSize = `${pct}%`;
    const isBoost = level >= GAME_CONFIG.VOICE_BOOST_THRESHOLD;
    this.els.voiceBoostIndicator.dataset.boost = String(isBoost);
    this.els.voiceBoostIndicator.textContent = isBoost ? 'POTENCIA: ALTA!' : 'POTENCIA: NORMAL';
  }

  updateTranscript(text) {
    const display = text ? `"${text}"` : 'Esperando comando...';
    this.els.coverTranscript.textContent = display;
    this.els.voiceTranscript.textContent = display;
  }

  showRecognizedCommand(cmd, boosted) {
    const label = COMMAND_LABELS[cmd] || cmd;
    this.els.voiceLastCmd.textContent = boosted ? `${label} x2` : label;
    this.els.voiceLastCmd.dataset.active = 'true';
    window.clearTimeout(this.cmdFlashTimer);
    this.cmdFlashTimer = window.setTimeout(() => {
      this.els.voiceLastCmd.dataset.active = 'false';
    }, 600);
  }

  _formatScore(score) {
    return String(Math.max(0, Math.floor(score))).padStart(6, '0');
  }

  _formatTime(sec) {
    const total = Math.max(0, Math.round(sec));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  _getRadStatus(rad) {
    if (rad >= 80) return { label: 'CRÍTICO', level: 'crit' };
    if (rad >= 50) return { label: 'CONTAMINADO', level: 'high' };
    if (rad >= 22) return { label: 'EXPUESTO', level: 'warn' };
    return { label: 'ESTABLE', level: 'safe' };
  }

  onStateChange(snap) {
    const isCover = snap.state === 'COVER';
    const isPlaying = this.game.isPlaying();
    this.els.screenCover.hidden = !isCover;
    this.els.screenGame.hidden = isCover;
    this.els.screenGame.dataset.mode = snap.mode || '1p';
    this.els.pauseBtn.hidden = !isPlaying;

    if (isCover) {
      if (this.els.dialog.open) this.els.dialog.close();
      document.title = `${GAME_CONFIG.TITLE} | ${GAME_CONFIG.AUTHOR}`;
      return;
    }

    if (isPlaying) {
      if (snap.paused) {
        this._openDialog({
          variant: 'pause',
          icon: 'assets/sprites/ui/rad_icon.png',
          kicker: 'SISTEMA EN ESPERA',
          title: 'MISIÓN EN PAUSA',
          body: 'La simulación del reactor y la exposición radiactiva están detenidas. Puedes reanudar, reiniciar este nivel o volver a la portada.',
          telemetryHtml: `
            <div>SECTOR: <span class="tel-warn">${this._escape(snap.level ? snap.level.name : 'REACTOR')}</span></div>
            <div>PROGRESO: <span class="tel-warn">${this._escape(snap.progress.label.toUpperCase())}</span></div>
            <div>TIEMPO: ${this._formatTime(snap.missionElapsed)} • MODO: ${snap.mode === '2p' ? '2 JUGADORES' : '1 JUGADOR'}</div>
          `,
          statsHtml: '',
          facts: [],
          primaryLabel: '[ ENTER ] REANUDAR',
          onPrimary: () => this.game.setPaused(false),
          secondaryLabel: 'REINICIAR NIVEL',
          onSecondary: () => this.game.restartCurrentLevel(),
          tertiaryLabel: 'PORTADA',
          onTertiary: () => this.game.returnToCover(),
        });
      } else if (this.els.dialog.open) {
        this.els.dialog.close();
      }
      this.announce(snap.paused ? 'PAUSA' : snap.state);
      return;
    }

    if (snap.state === 'BRIEFING_1') {
      const lvl = LEVELS[1];
      document.title = `Nivel 1 — ${GAME_CONFIG.TITLE}`;
      this._openDialog({
        variant: 'briefing',
        icon: 'assets/sprites/ui/rad_icon.png',
        kicker: lvl.dateLabel,
        title: lvl.name,
        body: `${lvl.briefing} ${lvl.objectiveText}`,
        statsHtml: this._renderControlsGuide(1, snap.mode),
        facts: [],
        primaryLabel: '[ ENTER ] COMENZAR NIVEL 1',
        onPrimary: () => this.game.beginPlayingLevel(),
      });
    } else if (snap.state === 'INTERMISSION') {
      this._openDialog({
        variant: 'intermission',
        icon: 'assets/sprites/ui/rad_icon.png',
        kicker: 'NIVEL 1 COMPLETADO — TECHO CONTENIDO',
        title: '¡FUEGO Y GRAFITO CONTENIDOS!',
        body: 'Los focos del techo fueron contenidos a tiempo evitando el colapso estructural. El núcleo aún amenaza los tanques de agua subterráneos.',
        statsHtml: this._renderScoreSummary(snap),
        facts: [
          'En la realidad, 3,828 liquidadores limpiaron el techo de la Unidad 4 en turnos de 40 a 90 segundos.',
          'Descenso inmediato al subsuelo del 4 de mayo de 1986.',
        ],
        primaryLabel: '[ ENTER ] IR AL NIVEL 2',
        onPrimary: () => this.game.advanceFromIntermission(),
      });
    } else if (snap.state === 'BRIEFING_2') {
      const lvl = LEVELS[2];
      document.title = `Nivel 2 — ${GAME_CONFIG.TITLE}`;
      this._openDialog({
        variant: 'briefing',
        icon: 'assets/sprites/ui/warning_tri.png',
        kicker: lvl.dateLabel,
        title: lvl.name,
        body: `${lvl.briefing} ${lvl.objectiveText}`,
        statsHtml: this._renderControlsGuide(2, snap.mode),
        facts: [],
        primaryLabel: '[ ENTER ] DESCENDER A TÚNELES',
        onPrimary: () => this.game.beginPlayingLevel(),
      });
    } else if (snap.state === 'VICTORY') {
      document.title = `Misión Cumplida — ${GAME_CONFIG.TITLE}`;
      const totalScore = snap.mode === '2p'
        ? snap.players[1].score + snap.players[2].score
        : snap.players[1].score;
      this._openDialog({
        variant: 'victory',
        icon: 'assets/sprites/ui/trophy.png',
        banner: 'assets/spritesheets/victory_chernobyl.png',
        kicker: 'TRANSMISIÓN ESTABLE — MISIÓN HISTÓRICA CUMPLIDA',
        title: '¡SEGUNDA EXPLOSIÓN EVITADA!',
        body: 'Los tanques subterráneos fueron drenados a tiempo. El sacrificio coordinado de los liquidadores salvó a millones de personas.',
        telemetryHtml: `
          <div>TIEMPO SOBREVIVIDO: <span class="tel-warn">${this._formatTime(snap.missionElapsed)}</span></div>
          <div>ESTADO DEL REACTOR: ESTABILIZADO</div>
          <div>PUNTUACIÓN TOTAL: <span class="tel-warn">${this._formatScore(totalScore)} PTS</span></div>
        `,
        statsHtml: this._renderScoreSummary(snap),
        facts: HISTORICAL_IMPACT.facts,
        primaryLabel: '[ ENTER ] JUGAR DE NUEVO',
        onPrimary: () => this.game.startNewCampaign(this.els.p1Input.value, this.els.p2Input.value, this.selectedMode),
        secondaryLabel: '[ ESC ] PORTADA',
        onSecondary: () => this.game.returnToCover(),
      });
    } else if (snap.state === 'GAMEOVER') {
      document.title = `Conexión Perdida — ${GAME_CONFIG.TITLE}`;
      this._openDialog({
        variant: 'gameover',
        icon: 'assets/sprites/ui/skull.png',
        banner: 'assets/spritesheets/gameover_chernobyl.png',
        kicker: 'CONEXIÓN PERDIDA — ERROR DE SEÑAL',
        title: 'LIQUIDADOR CAÍDO — DOSIS LETAL',
        body: 'La radiación superó el umbral de supervivencia. Usa "ESCUDO" ante las alertas de pulso para protegerte de la radiación.',
        telemetryHtml: `
          <div>TIEMPO SOBREVIVIDO: <span class="tel-warn">${this._formatTime(snap.missionElapsed)}</span></div>
          <div>RADIACIÓN FINAL: <span class="tel-crit">CRÍTICA</span></div>
          <div>CAUSA: <span class="tel-crit">EXPOSICIÓN LETAL</span></div>
        `,
        statsHtml: this._renderScoreSummary(snap),
        facts: [HISTORICAL_IMPACT.facts[1], HISTORICAL_IMPACT.facts[3]],
        primaryLabel: '[ ENTER ] REINTENTAR',
        onPrimary: () => this.game.startNewCampaign(this.els.p1Input.value, this.els.p2Input.value, this.selectedMode),
        secondaryLabel: '[ ESC ] PORTADA',
        onSecondary: () => this.game.returnToCover(),
      });
    }

    this.announce(snap.state);
  }

  _openDialog({
    variant,
    icon,
    banner,
    kicker,
    title,
    body,
    telemetryHtml,
    statsHtml,
    facts,
    primaryLabel,
    onPrimary,
    secondaryLabel,
    onSecondary,
    tertiaryLabel,
    onTertiary,
  }) {
    this.els.dialog.dataset.variant = variant || 'briefing';
    if (icon) {
      this.els.dialogIcon.src = icon;
      this.els.dialogIcon.hidden = false;
    } else {
      this.els.dialogIcon.hidden = true;
    }

    if (banner) {
      this.els.dialogBanner.src = banner;
      this.els.dialogBanner.hidden = false;
    } else {
      this.els.dialogBanner.hidden = true;
    }

    this.els.dialogKicker.textContent = kicker;
    this.els.dialogTitle.textContent = title;
    this.els.dialogBody.textContent = body;

    if (telemetryHtml) {
      this.els.dialogTelemetry.innerHTML = telemetryHtml;
      this.els.dialogTelemetry.hidden = false;
    } else {
      this.els.dialogTelemetry.innerHTML = '';
      this.els.dialogTelemetry.hidden = true;
    }

    if (this.els.dialogHeroGrid) {
      this.els.dialogHeroGrid.hidden = !banner && !telemetryHtml;
    }

    this.els.dialogStats.innerHTML = statsHtml || '';

    this.els.dialogFacts.innerHTML = '';
    if (facts && facts.length > 0) {
      this.els.dialogFacts.hidden = false;
      facts.forEach((f) => {
        const li = document.createElement('li');
        li.textContent = f;
        this.els.dialogFacts.appendChild(li);
      });
    } else {
      this.els.dialogFacts.hidden = true;
    }

    this.els.dialogPrimaryBtn.textContent = primaryLabel;
    this.dialogAction = onPrimary;

    if (secondaryLabel && onSecondary) {
      this.els.dialogSecondaryBtn.hidden = false;
      this.els.dialogSecondaryBtn.textContent = secondaryLabel;
      this.secondaryAction = onSecondary;
    } else {
      this.els.dialogSecondaryBtn.hidden = true;
      this.secondaryAction = null;
    }

    if (tertiaryLabel && onTertiary) {
      this.els.dialogTertiaryBtn.hidden = false;
      this.els.dialogTertiaryBtn.textContent = tertiaryLabel;
      this.tertiaryAction = onTertiary;
    } else {
      this.els.dialogTertiaryBtn.hidden = true;
      this.tertiaryAction = null;
    }

    if (!this.els.dialog.open) {
      this.els.dialog.showModal();
    }
    this.els.dialogPrimaryBtn.focus();
  }

  _renderControlsGuide(levelId, mode = '1p') {
    const valveCard = levelId === 2
      ? `
        <div class="control-card featured">
          <div class="control-sprites">
            <img class="pixel-icon" src="assets/sprites/hazards/valve_closed.png" width="28" height="28" alt="">
            <span class="control-arrow">→</span>
            <img class="pixel-icon" src="assets/sprites/hazards/valve_open.png" width="28" height="28" alt="">
          </div>
          <div class="control-text">
            <span class="control-action">ABRIR VÁLVULAS DE DRENAJE</span>
            <span class="control-voice">VOZ: "VÁLVULA" / "ABRIR" (fuerte = x2)</span>
            <span class="control-key">TECLADO: [ V ] o [ F ]</span>
          </div>
        </div>
      `
      : '';

    const fourthCard = mode === '2p'
      ? `
          <div class="control-card">
            <div class="control-sprites">
              <img class="pixel-icon" src="assets/sprites/ui/portrait_p1.png" width="24" height="24" alt="">
              <img class="pixel-icon" src="assets/sprites/ui/portrait_p2.png" width="24" height="24" alt="">
            </div>
            <div class="control-text">
              <span class="control-action">RELEVO 2 JUGADORES</span>
              <span class="control-voice">VOZ: "RELEVO" / "CAMBIO"</span>
              <span class="control-key">TECLADO: [ R ]</span>
            </div>
          </div>
      `
      : `
          <div class="control-card">
            <div class="control-sprites">
              <img class="pixel-icon" src="assets/sprites/ui/rad_icon.png" width="24" height="24" alt="">
            </div>
            <div class="control-text">
              <span class="control-action">PAUSAR MISIÓN</span>
              <span class="control-voice">VOZ: "PAUSA" / "REANUDAR"</span>
              <span class="control-key">TECLADO: [ P ] / [ ESC ]</span>
            </div>
          </div>
      `;

    return `
      <div class="controls-guide" aria-label="Guía de controles por voz y teclado">
        <div class="controls-guide-head">
          <span class="guide-badge voice">
            <img class="pixel-icon" src="assets/sprites/ui/mic_on.png" width="16" height="16" alt="">
            CONTROL POR VOZ
          </span>
          <span class="guide-badge key">
            <img class="pixel-icon" src="assets/sprites/ui/keyboard.png" width="16" height="16" alt="">
            RESPALDO TECLADO
          </span>
        </div>
        <div class="controls-guide-grid">
          ${valveCard}
          <div class="control-card">
            <div class="control-sprites pad-sprites">
              <img class="pixel-icon" src="assets/sprites/ui/arrow_up.png" width="16" height="16" alt="">
              <img class="pixel-icon" src="assets/sprites/ui/arrow_down.png" width="16" height="16" alt="">
              <img class="pixel-icon" src="assets/sprites/ui/arrow_left.png" width="16" height="16" alt="">
              <img class="pixel-icon" src="assets/sprites/ui/arrow_right.png" width="16" height="16" alt="">
            </div>
            <div class="control-text">
              <span class="control-action">MOVERSE POR EL SECTOR</span>
              <span class="control-voice">VOZ: "ARRIBA / ABAJO / IZQ / DER"</span>
              <span class="control-key">TECLADO: [ WASD ] / [ FLECHAS ]</span>
            </div>
          </div>

          <div class="control-card">
            <div class="control-sprites">
              <img class="pixel-icon" src="assets/sprites/p1/action_water.png" width="32" height="32" alt="">
              <img class="pixel-icon" src="assets/sprites/hazards/fire_1.png" width="24" height="24" alt="">
            </div>
            <div class="control-text">
              <span class="control-action">APAGAR FUEGO Y GRAFITO</span>
              <span class="control-voice">VOZ: "AGUA" (voz fuerte = doble)</span>
              <span class="control-key">TECLADO: [ ESPACIO ]</span>
            </div>
          </div>

          <div class="control-card">
            <div class="control-sprites">
              <img class="pixel-icon" src="assets/sprites/p1/shield.png" width="32" height="32" alt="">
              <img class="pixel-icon" src="assets/sprites/ui/warning_tri.png" width="16" height="16" alt="">
            </div>
            <div class="control-text">
              <span class="control-action">ESCUDO ANTI-PULSO</span>
              <span class="control-voice">VOZ: "ESCUDO" / "CUBRIR"</span>
              <span class="control-key">TECLADO: [ E ] / [ SHIFT ]</span>
            </div>
          </div>

          ${fourthCard}
        </div>
      </div>
    `;
  }

  _renderScoreSummary(snap) {
    const p1 = snap.players[1];
    const p2 = snap.players[2];
    const is2p = snap.mode === '2p';
    return `
      <div class="summary-grid ${is2p ? '' : 'single'}">
        <div class="summary-card p1">
          <strong>${this._escape(p1.name)}${is2p ? ' (J1)' : ''}</strong>
          <span>Puntaje: ${this._formatScore(p1.score)} pts</span>
          <span>Focos apagados: ${p1.stats.extinguished}</span>
          <span>Pulsos bloqueados: ${p1.stats.pulsesBlocked}</span>
          <span>Válvulas abiertas: ${p1.stats.valvesOpened}</span>
        </div>
        ${is2p ? `
        <div class="summary-card p2">
          <strong>${this._escape(p2.name)} (J2)</strong>
          <span>Puntaje: ${this._formatScore(p2.score)} pts</span>
          <span>Focos apagados: ${p2.stats.extinguished}</span>
          <span>Pulsos bloqueados: ${p2.stats.pulsesBlocked}</span>
          <span>Válvulas abiertas: ${p2.stats.valvesOpened}</span>
        </div>` : ''}
      </div>
    `;
  }

  _escape(str) {
    return String(str).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[ch]));
  }

  _renderLives(lives) {
    if (this.lastRenderedLives === lives) return;
    this.lastRenderedLives = lives;
    const container = this.els.hudLives;
    container.innerHTML = '';
    for (let i = 0; i < GAME_CONFIG.TEAM_MAX_LIVES; i++) {
      const img = document.createElement('img');
      img.className = 'pixel-icon heart-icon';
      img.width = 18;
      img.height = 18;
      img.alt = '';
      img.src = i < lives ? 'assets/sprites/ui/heart_full.png' : 'assets/sprites/ui/heart_empty.png';
      container.appendChild(img);
    }
    container.setAttribute('aria-label', `${Math.max(0, lives)} de ${GAME_CONFIG.TEAM_MAX_LIVES} vidas`);
  }

  updateHud(snap) {
    const p1 = snap.players[1];
    const p2 = snap.players[2];

    this.els.hudP1Name.textContent = p1.name;
    this.els.hudP2Name.textContent = p2.name;
    this.els.hudP1Score.textContent = this._formatScore(p1.score);
    this.els.hudP2Score.textContent = this._formatScore(p2.score);

    const s1 = this._getRadStatus(p1.radiation);
    const s2 = this._getRadStatus(p2.radiation);
    this.els.hudP1State.textContent = s1.label;
    this.els.hudP1State.dataset.level = s1.level;
    this.els.hudP2State.textContent = s2.label;
    this.els.hudP2State.dataset.level = s2.level;

    this.els.hudP1Rad.style.inlineSize = `${Math.round(p1.radiation)}%`;
    this.els.hudP2Rad.style.inlineSize = `${Math.round(p2.radiation)}%`;

    this.els.hudP1Card.dataset.active = String(snap.activePlayerId === 1);
    this.els.hudP2Card.dataset.active = String(snap.activePlayerId === 2);

    const is2p = snap.mode === '2p';
    this.els.hudP2Card.hidden = !is2p;
    if (this.els.cmdItemRelay) this.els.cmdItemRelay.hidden = !is2p;
    if (this.els.btnBackupRelay) this.els.btnBackupRelay.hidden = !is2p;

    this.els.hudLevelTitle.textContent = snap.level ? snap.level.name : 'MISIÓN';
    this.els.hudProgressLabel.textContent = snap.progress.label.toUpperCase();
    const pct = Math.round((snap.progress.current / Math.max(1, snap.progress.total)) * 100);
    this.els.hudProgressFill.style.inlineSize = `${pct}%`;

    if (this.els.hudClockLabel) {
      this.els.hudClockLabel.textContent = is2p ? 'RELEVO' : 'TIEMPO';
    }
    this.els.hudShiftTimer.textContent = is2p
      ? `${Math.max(0, Math.ceil(snap.shiftTimer))}s`
      : this._formatTime(snap.missionElapsed);
    this._renderLives(snap.teamLives);

    // Analog Geiger readout & needle angle
    const active = snap.players[snap.activePlayerId];
    const msv = Math.round(14 + active.radiation * 4.2 + (snap.pulseWarned ? 120 : 0));
    const norm = Math.min(1, msv / 480);
    const jitter = Math.sin(performance.now() * 0.045) * (snap.pulseWarned || active.radiation > 45 ? 4.2 : 1.1);
    const deg = -52 + norm * 104 + jitter;

    if (this.els.geigerNeedle) {
      this.els.geigerNeedle.style.setProperty('--needle-deg', `${deg.toFixed(1)}deg`);
    }
    if (this.els.hudMsv) {
      this.els.hudMsv.textContent = `${msv} mSv/h`;
    }
    if (this.els.hudDanger) {
      let dangerTxt = 'PELIGRO: MODERADO';
      let lvl = 'safe';
      if (snap.pulseWarned || active.radiation >= 75) {
        dangerTxt = 'PELIGRO: EXTREMO';
        lvl = 'crit';
      } else if (active.radiation >= 45) {
        dangerTxt = 'PELIGRO: ALTO';
        lvl = 'high';
      } else if (active.radiation >= 20) {
        dangerTxt = 'PELIGRO: ELEVADO';
        lvl = 'warn';
      }
      this.els.hudDanger.textContent = dangerTxt;
      this.els.hudDanger.dataset.level = lvl;
    }

    if (this.els.valveCmdItem) {
      this.els.valveCmdItem.dataset.highlight = String(snap.levelId === 2);
    }
  }

  announce(text) {
    if (this.els.liveAnnouncer) {
      this.els.liveAnnouncer.textContent = text;
    }
  }
}
