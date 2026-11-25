export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicMode = 'off'; // 'off' | 'level1' | 'level2'
    this.geigerCooldown = 0;
  }

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.48;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.48, this.ctx.currentTime, 0.03);
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  _noiseBuffer(duration) {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  playTone(freq, duration, type = 'square', gainPeak = 0.2, freqEnd = null, delay = 0) {
    if (!this.ctx || !this.master || this.muted) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
    }
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playGeigerClick(intensity = 0.5) {
    if (!this.ctx || !this.master || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.025);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2600 + Math.random() * 1800;
    filter.Q.value = 3;
    const gain = this.ctx.createGain();
    const peak = 0.06 + intensity * 0.11;
    gain.gain.setValueAtTime(peak, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(now);
  }

  updateGeiger(dt, radiationRatio) {
    if (!this.ctx || this.muted) return;
    this.geigerCooldown -= dt;
    if (this.geigerCooldown <= 0) {
      this.playGeigerClick(radiationRatio);
      const minInterval = Math.max(0.055, 0.42 - radiationRatio * 0.34);
      this.geigerCooldown = minInterval * (0.45 + Math.random() * 1.1);
    }
  }

  playStep() {
    this.playTone(130, 0.06, 'triangle', 0.14, 72);
  }

  playBlockedMove() {
    this.playTone(95, 0.11, 'sawtooth', 0.16, 65);
  }

  playWaterJet(boosted = false) {
    if (!this.ctx || !this.master || this.muted) return;
    const now = this.ctx.currentTime;
    const dur = boosted ? 0.38 : 0.26;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(dur);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(boosted ? 1800 : 1200, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + dur);
    filter.Q.value = 1.4;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(boosted ? 0.35 : 0.24, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(now);

    if (boosted) {
      this.playTone(540, 0.18, 'sine', 0.14, 880);
    }
  }

  playExtinguish() {
    this.playTone(390, 0.12, 'triangle', 0.18, 660);
    this.playTone(660, 0.15, 'sine', 0.14, 920, 0.08);
  }

  playShield() {
    this.playTone(220, 0.22, 'sawtooth', 0.16, 440);
    this.playTone(330, 0.26, 'sine', 0.18, 660, 0.05);
  }

  playShieldBlock() {
    this.playTone(520, 0.14, 'square', 0.2, 980);
    this.playTone(780, 0.18, 'triangle', 0.18, 1240, 0.06);
  }

  playValveTurn(completed = false) {
    this.playTone(170, 0.14, 'square', 0.2, 110);
    this.playTone(260, 0.16, 'triangle', 0.16, 190, 0.05);
    if (completed) {
      this.playTone(440, 0.15, 'sine', 0.18, 660, 0.12);
      this.playTone(660, 0.24, 'sine', 0.2, 880, 0.22);
    }
  }

  playRadiationWarning() {
    this.playTone(740, 0.14, 'sawtooth', 0.16, 700);
    this.playTone(560, 0.16, 'sawtooth', 0.15, 520, 0.16);
  }

  playRadiationHit() {
    this.playTone(140, 0.36, 'sawtooth', 0.28, 42);
    this.playTone(92, 0.38, 'square', 0.2, 36, 0.04);
  }

  playRelayHorn() {
    this.playTone(330, 0.14, 'triangle', 0.2, 330);
    this.playTone(440, 0.22, 'triangle', 0.22, 440, 0.14);
  }

  playVictory() {
    const notes = [392, 493.88, 587.33, 783.99];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.22, 'triangle', 0.2, null, idx * 0.11);
    });
  }

  playGameOver() {
    const notes = [293.66, 261.63, 220, 146.83];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.26, 'sawtooth', 0.18, n * 0.92, idx * 0.16);
    });
  }

  startMusic(mode = 'level1') {
    if (this.musicMode === mode && this.musicTimer) return;
    this.stopMusic();
    this.musicMode = mode;
    this.musicStep = 0;

    const bassL1 = [98, 98, 110, 98, 130.81, 116.54, 98, 87.31];
    const bassL2 = [82.41, 82.41, 98, 92.5, 110, 82.41, 73.42, 82.41];
    const intervalMs = mode === 'level2' ? 320 : 380;

    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || this.muted || this.musicMode === 'off') return;
      const seq = this.musicMode === 'level2' ? bassL2 : bassL1;
      const freq = seq[this.musicStep % seq.length];
      this.playTone(freq, 0.18, 'triangle', 0.08, freq * 0.98);
      if (this.musicStep % 4 === 2) {
        this.playTone(freq * 2, 0.08, 'sine', 0.04, freq * 1.95);
      }
      this.musicStep++;
    }, intervalMs);
  }

  stopMusic() {
    this.musicMode = 'off';
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
