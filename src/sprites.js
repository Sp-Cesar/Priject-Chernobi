const SHEET_SOURCES = {
  p1: { path: 'assets/spritesheets/liquidador_p1_sheet.png', frameWidth: 32, frameHeight: 32 },
  p2: { path: 'assets/spritesheets/liquidador_p2_sheet.png', frameWidth: 32, frameHeight: 32 },
  hazards: { path: 'assets/spritesheets/hazards_sheet.png', frameWidth: 32, frameHeight: 32 },
  tiles_l1: { path: 'assets/spritesheets/tiles_level1_sheet.png', frameWidth: 32, frameHeight: 32 },
  tiles_l2: { path: 'assets/spritesheets/tiles_level2_sheet.png', frameWidth: 32, frameHeight: 32 },
};

export const P1_FRAMES = {
  IDLE_1: 0,
  IDLE_2: 1,
  WALK: 2,
  WATER: 3,
  SHIELD: 4,
};

export const HAZARD_FRAMES = {
  FIRE_1: 0,
  FIRE_2: 1,
  GRAPHITE_1: 2,
  GRAPHITE_2: 3,
  VALVE_CLOSED: 4,
  VALVE_OPEN: 5,
};

export class SpriteBank {
  constructor() {
    this.sheets = {};
    this.loaded = false;
  }

  async loadAll() {
    const entries = Object.entries(SHEET_SOURCES);
    await Promise.all(
      entries.map(async ([key, info]) => {
        const img = new Image();
        img.decoding = 'async';
        const promise = new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`No se pudo cargar sprite sheet: ${info.path}`));
        });
        img.src = info.path;
        await promise;
        this.sheets[key] = { ...info, img };
      })
    );
    this.loaded = true;
  }

  drawFrame(ctx, sheetKey, frameIndex, x, y, size, flipX = false) {
    const sheet = this.sheets[sheetKey];
    if (!sheet) return;
    const sx = frameIndex * sheet.frameWidth;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (flipX) {
      ctx.translate(x + size, y);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet.img, sx, 0, sheet.frameWidth, sheet.frameHeight, 0, 0, size, size);
    } else {
      ctx.drawImage(sheet.img, sx, 0, sheet.frameWidth, sheet.frameHeight, x, y, size, size);
    }
    ctx.restore();
  }
}
