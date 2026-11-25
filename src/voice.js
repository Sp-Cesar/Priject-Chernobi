import { VOICE_COMMANDS, GAME_CONFIG } from './config.js';

function normalizeWord(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

const WORD_TO_CMD = new Map();
for (const [cmd, synonyms] of Object.entries(VOICE_COMMANDS)) {
  for (const word of synonyms) {
    WORD_TO_CMD.set(normalizeWord(word), cmd);
  }
}

export class VoiceController {
  constructor({ onCommand, onTranscript, onVolume, onStatus } = {}) {
    this.onCommand = onCommand || (() => {});
    this.onTranscript = onTranscript || (() => {});
    this.onVolume = onVolume || (() => {});
    this.onStatus = onStatus || (() => {});

    this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    this.recognition = null;
    this.active = false;
    this.supported = Boolean(this.SpeechRecognition);

    // Web Audio volume meter
    this.micStream = null;
    this.audioCtx = null;
    this.analyser = null;
    this.timeData = null;
    this.volumeRaf = null;
    this.currentVolume = 0;
    this.peakVolume = 0;

    // Single-command session control, cooldown & network watchdog
    this.lastCommandAt = new Map();
    this.restartTimer = null;
    this.networkErrors = 0;
  }

  async start() {
    if (this.active) return true;

    if (!this.supported) {
      this.onStatus({
        state: 'unsupported',
        message: 'Tu navegador no soporta Web Speech API. Usa Google Chrome o Microsoft Edge (o teclado).',
      });
      return false;
    }

    this.networkErrors = 0;
    this.active = true;
    this.onStatus({ state: 'requesting', message: 'Solicitando acceso al micrófono...' });

    try {
      await this._startVolumeMeter();
    } catch (err) {
      if (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        this.active = false;
        this.onStatus({
          state: 'denied',
          message: 'Permiso de micrófono denegado. Habilítalo en el navegador o usa el respaldo de teclado.',
        });
        return false;
      }
      // Continue with SpeechRecognition if auxiliary audio meter stream fails for non-permission reasons
    }

    if (!this.active) return false;
    this._initRecognition();
    return true;
  }

  _clearRecognitionInstance() {
    const old = this.recognition;
    this.recognition = null;
    if (old) {
      old.onstart = null;
      old.onresult = null;
      old.onerror = null;
      old.onend = null;
      try {
        if (typeof old.abort === 'function') {
          old.abort();
        } else if (typeof old.stop === 'function') {
          old.stop();
        }
      } catch {
        // Ignore abort/stop errors
      }
    }
  }

  _resetRecognitionSession(delayMs = 220) {
    if (this.restartTimer) {
      window.clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this._clearRecognitionInstance();
    if (this.active) {
      this.restartTimer = window.setTimeout(() => {
        this.restartTimer = null;
        this._initRecognition();
      }, delayMs);
    }
  }

  _stopInternal() {
    this.active = false;
    if (this.restartTimer) {
      window.clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this._clearRecognitionInstance();
    this._stopVolumeMeter();
    this.onVolume(0);
  }

  stop() {
    this._stopInternal();
    this.onStatus({ state: 'idle', message: 'Micrófono detenido.' });
  }

  async _startVolumeMeter() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    if (!this.active) {
      this._stopVolumeMeter();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioCtx();
    const source = this.audioCtx.createMediaStreamSource(this.micStream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);
    this.timeData = new Uint8Array(this.analyser.fftSize);

    const sample = () => {
      if (!this.active || !this.analyser) return;
      this.analyser.getByteTimeDomainData(this.timeData);
      let sumSquares = 0;
      for (let i = 0; i < this.timeData.length; i++) {
        const norm = (this.timeData[i] - 128) / 128;
        sumSquares += norm * norm;
      }
      const rms = Math.sqrt(sumSquares / this.timeData.length);
      const level = Math.min(1, rms * 3.4);
      this.currentVolume = level;
      this.peakVolume = Math.max(level, this.peakVolume * 0.92);
      this.onVolume(level);
      this.volumeRaf = window.requestAnimationFrame(sample);
    };
    this.volumeRaf = window.requestAnimationFrame(sample);
  }

  _stopVolumeMeter() {
    if (this.volumeRaf) {
      window.cancelAnimationFrame(this.volumeRaf);
      this.volumeRaf = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.analyser = null;
  }

  _dispatchWordIfCommand(word) {
    const cmd = WORD_TO_CMD.get(word);
    if (!cmd) return false;
    const now = performance.now();
    const lastTime = this.lastCommandAt.get(cmd) || 0;
    const cooldown = (cmd === 'UP' || cmd === 'DOWN' || cmd === 'LEFT' || cmd === 'RIGHT') ? 320 : 550;
    if (now - lastTime < cooldown) return false;
    this.lastCommandAt.set(cmd, now);
    const boosted = this.peakVolume >= GAME_CONFIG.VOICE_BOOST_THRESHOLD;
    this.onCommand(cmd, word, boosted);
    return true;
  }

  _initRecognition() {
    if (!this.active || !this.SpeechRecognition) return;
    const rec = new this.SpeechRecognition();
    rec.lang = 'es-ES';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let consumed = false;
    this.recognition = rec;

    rec.onstart = () => {
      if (rec !== this.recognition) return;
      this.onStatus({ state: 'listening', message: 'Micrófono activo: habla comandos cortos con claridad.' });
    };

    rec.onresult = (event) => {
      if (rec !== this.recognition || consumed) return;
      this.networkErrors = 0;

      const startResult = Math.max(0, event.resultIndex || 0);
      for (let i = startResult; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';
        const isFinal = Boolean(result.isFinal);
        this.onTranscript(transcript.trim(), isFinal);

        const clean = normalizeWord(transcript);
        if (!clean) continue;
        const tokens = clean.split(/\s+/).filter(Boolean);

        for (let t = 0; t < tokens.length; t++) {
          const word = tokens[t];
          if (WORD_TO_CMD.has(word)) {
            this._dispatchWordIfCommand(word);
            consumed = true;
            // Immediately abort & restart a clean session so Chrome clears the previous command from its buffer
            this._resetRecognitionSession(220);
            return;
          }
        }
      }
    };

    rec.onerror = (event) => {
      if (rec !== this.recognition) return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this._stopInternal();
        this.onStatus({
          state: 'denied',
          message: 'Permiso de micrófono bloqueado. Habilítalo en la barra de direcciones.',
        });
      } else if (event.error === 'network') {
        this.networkErrors += 1;
        if (this.networkErrors >= 3) {
          this._stopInternal();
          this.onStatus({
            state: 'network',
            message: 'Servicio de voz bloqueado en este navegador. Abre http://127.0.0.1:4173 o Netlify en Google Chrome o Microsoft Edge.',
          });
        } else {
          this.onStatus({ state: 'warning', message: 'Conectando servicio de voz...' });
        }
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        this.onStatus({ state: 'warning', message: `Aviso de voz (${event.error}): reintentando...` });
      }
    };

    rec.onend = () => {
      if (rec !== this.recognition) return;
      this.recognition = null;
      if (this.active) {
        if (this.restartTimer) {
          window.clearTimeout(this.restartTimer);
        }
        this.restartTimer = window.setTimeout(() => {
          this.restartTimer = null;
          this._initRecognition();
        }, 120);
      }
    };

    try {
      rec.start();
    } catch {
      // Ignore already-started race
    }
  }
}
