import { SpriteBank } from './sprites.js';
import { SoundEngine } from './audio.js';
import { VoiceController } from './voice.js';
import { ChernobylGame } from './game.js';
import { GameUI } from './ui.js';

async function bootstrap() {
  const canvas = document.getElementById('game-canvas');
  const sprites = new SpriteBank();
  const sound = new SoundEngine();

  let ui = null;
  let game = null;

  const voice = new VoiceController({
    onCommand: (cmd, rawWord, boosted) => {
      if (!ui || !game) return;
      ui.showRecognizedCommand(cmd, boosted);
      if (ui.els.dialog.open && cmd === 'NEXT') {
        ui.triggerCommandFromUI('NEXT', boosted);
        return;
      }
      game.handleCommand(cmd, rawWord, boosted);
    },
    onTranscript: (text) => {
      if (ui) ui.updateTranscript(text);
    },
    onVolume: (level) => {
      if (ui) ui.updateVolume(level);
    },
    onStatus: (status) => {
      if (ui) ui.updateVoiceStatus(status);
    },
  });

  game = new ChernobylGame({
    canvas,
    sprites,
    sound,
    onStateChange: (snap) => ui?.onStateChange(snap),
    onHudUpdate: (snap) => ui?.updateHud(snap),
  });

  ui = new GameUI({ game, voice, sound });

  // Keyboard fallback so classroom demo always has an instant safety net
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return;
    }

    if (ui.els.dialog.open) {
      if (e.code === 'KeyP' && game.isPlaying() && game.paused) {
        e.preventDefault();
        sound.unlock();
        game.setPaused(false);
      }
      return;
    }

    if (!game.isPlaying()) return;

    if (e.code === 'KeyP' || e.code === 'Escape') {
      e.preventDefault();
      sound.unlock();
      game.togglePause();
      return;
    }

    if (game.paused) return;

    const keyMap = {
      ArrowUp: 'UP',
      KeyW: 'UP',
      ArrowDown: 'DOWN',
      KeyS: 'DOWN',
      ArrowLeft: 'LEFT',
      KeyA: 'LEFT',
      ArrowRight: 'RIGHT',
      KeyD: 'RIGHT',
      Space: 'WATER',
      KeyE: 'SHIELD',
      ShiftLeft: 'SHIELD',
      ShiftRight: 'SHIELD',
      KeyV: 'VALVE',
      KeyF: 'VALVE',
      KeyR: 'RELAY',
    };

    const cmd = keyMap[e.code];
    if (cmd) {
      e.preventDefault();
      sound.unlock();
      ui.triggerCommandFromUI(cmd, false);
    }
  });

  try {
    await sprites.loadAll();
  } catch (err) {
    console.error(err);
  }

  game.startLoop();
  ui.onStateChange(game.getSnapshot());
}

bootstrap();
