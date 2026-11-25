import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, 'assets');
const SHEETS_DIR = path.join(ASSETS_DIR, 'spritesheets');
const SPRITES_DIR = path.join(ASSETS_DIR, 'sprites');
const PIXEL_DIR = path.join(ASSETS_DIR, 'pixeledit');

// ---------- CRC32 & Binary Helpers ----------
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter type None
    rgba.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function createZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  // DOS time/date for 2026-04-26 01:23:00
  const dosTime = 0x0ae0;
  const dosDate = 0x5c9a;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const dataBuf = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
    const compressed = zlib.deflateRawSync(dataBuf, { level: 6 });
    const useStore = compressed.length >= dataBuf.length;
    const payload = useStore ? dataBuf : compressed;
    const method = useStore ? 0 : 8;
    const crc = crc32(dataBuf);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(payload.length, 18);
    localHeader.writeUInt32LE(dataBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const localRecord = Buffer.concat([localHeader, nameBuf, payload]);
    localParts.push(localRecord);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(payload.length, 20);
    centralHeader.writeUInt32LE(dataBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(Buffer.concat([centralHeader, nameBuf]));
    offset += localRecord.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, eocd]);
}

// ---------- Pixel Canvas ----------
function parseHex(hex) {
  if (!hex || hex === 'transparent') return [0, 0, 0, 0];
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const a = clean.length === 8 ? parseInt(clean.slice(6, 8), 16) : 255;
  return [r, g, b, a];
}

class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = Buffer.alloc(width * height * 4);
  }

  setRGBA(x, y, r, g, b, a = 255) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) return;
    const idx = (iy * this.width + ix) * 4;
    if (a === 255) {
      this.data[idx] = r;
      this.data[idx + 1] = g;
      this.data[idx + 2] = b;
      this.data[idx + 3] = 255;
    } else if (a > 0) {
      const alpha = a / 255;
      const inv = 1 - alpha;
      this.data[idx] = Math.round(r * alpha + this.data[idx] * inv);
      this.data[idx + 1] = Math.round(g * alpha + this.data[idx + 1] * inv);
      this.data[idx + 2] = Math.round(b * alpha + this.data[idx + 2] * inv);
      this.data[idx + 3] = Math.min(255, Math.round(a + this.data[idx + 3] * inv));
    }
  }

  px(x, y, hex) {
    const [r, g, b, a] = parseHex(hex);
    this.setRGBA(x, y, r, g, b, a);
  }

  rect(x, y, w, h, hex) {
    const [r, g, b, a] = parseHex(hex);
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        this.setRGBA(x + dx, y + dy, r, g, b, a);
      }
    }
  }

  circle(cx, cy, radius, hex) {
    const [r, g, b, a] = parseHex(hex);
    const r2 = radius * radius;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= r2) {
          this.setRGBA(cx + dx, cy + dy, r, g, b, a);
        }
      }
    }
  }

  line(x0, y0, x1, y1, hex) {
    const [r, g, b, a] = parseHex(hex);
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0;
    let y = y0;
    while (true) {
      this.setRGBA(x, y, r, g, b, a);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  blit(src, destX, destY) {
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const idx = (y * src.width + x) * 4;
        const a = src.data[idx + 3];
        if (a > 0) {
          this.setRGBA(
            destX + x,
            destY + y,
            src.data[idx],
            src.data[idx + 1],
            src.data[idx + 2],
            a
          );
        }
      }
    }
  }

  scaleInteger(factor) {
    const out = new PixelCanvas(this.width * factor, this.height * factor);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (y * this.width + x) * 4;
        const r = this.data[idx];
        const g = this.data[idx + 1];
        const b = this.data[idx + 2];
        const a = this.data[idx + 3];
        if (a === 0) continue;
        for (let sy = 0; sy < factor; sy++) {
          for (let sx = 0; sx < factor; sx++) {
            out.setRGBA(x * factor + sx, y * factor + sy, r, g, b, a);
          }
        }
      }
    }
    return out;
  }

  toPNG() {
    return encodePNG(this.width, this.height, this.data);
  }
}

// ---------- Palette ----------
const PALETTE = {
  outline: '#0d1117',
  p1Suit: '#f2c94c',
  p1Shadow: '#b8891d',
  p1Hi: '#ffe58f',
  p2Suit: '#38bdf8',
  p2Shadow: '#1477a8',
  p2Hi: '#9ee6ff',
  leadVest: '#4a525a',
  leadDark: '#2c3238',
  leadHi: '#74808c',
  maskDark: '#1b2026',
  visor: '#a6f4ff',
  visorDim: '#3d8fa3',
  boot: '#181c20',
  hose: '#283640',
  water: '#38d9ff',
  waterHi: '#c8f8ff',
  shieldGlow: '#22ff99',
  shieldDeep: '#0c8f62',
  fireOuter: '#ff5500',
  fireMid: '#ff9a1f',
  fireCore: '#ffdd55',
  fireWhite: '#fff5c0',
  graphiteBase: '#232830',
  graphiteEdge: '#39414d',
  cherenkov: '#22ff99',
  cherenkovBright: '#a4ffdc',
  cherenkovCyan: '#00e5ff',
  valveRed: '#c83226',
  valveRedHi: '#ff604d',
  valveGreen: '#22ff99',
  valveGreenDark: '#118f58',
  steel: '#8c96a4',
  steelDark: '#515966',
  concrete: '#4a525a',
  concreteDark: '#353b42',
  concreteLight: '#606a75',
  hazardYellow: '#e0b228',
  hazardBlack: '#181b20',
  tunnelFloor: '#242c35',
  tunnelDark: '#171d24',
  tunnelMoist: '#2e4152',
  waterTile1: '#14445e',
  waterTile2: '#1b5f80',
  rust: '#a83226',
};

// ---------- Sprite Builders (32x32) ----------
function drawLiquidator(variant, frameName) {
  const c = new PixelCanvas(32, 32);
  const suit = variant === 'p1' ? PALETTE.p1Suit : PALETTE.p2Suit;
  const suitShadow = variant === 'p1' ? PALETTE.p1Shadow : PALETTE.p2Shadow;
  const suitHi = variant === 'p1' ? PALETTE.p1Hi : PALETTE.p2Hi;

  const bob = frameName === 'idle_2' ? 1 : 0;
  const walkShift = frameName === 'walk_1' ? 1 : 0;

  // Ground shadow
  c.rect(9, 29, 14, 2, '#090d12aa');

  // Shield aura behind/around sprite
  if (frameName === 'shield') {
    for (let y = 2; y < 30; y++) {
      for (let x = 2; x < 30; x++) {
        const dx = x - 15.5;
        const dy = y - 16;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d >= 12.2 && d <= 13.8) {
          c.px(x, y, (x + y) % 2 === 0 ? PALETTE.shieldGlow : PALETTE.cherenkovCyan);
        } else if (d < 12.2) {
          c.px(x, y, '#22ff9922');
        }
      }
    }
  }

  // Helmet + Hood (y: 3..13)
  c.rect(10, 3 + bob, 12, 2, PALETTE.outline);
  c.rect(9, 5 + bob, 14, 8, PALETTE.outline);
  c.rect(10, 4 + bob, 12, 2, suitHi);
  c.rect(10, 6 + bob, 12, 7, suit);
  c.rect(19, 6 + bob, 3, 7, suitShadow);

  // Protective helmet ridge / stripe
  c.rect(14, 3 + bob, 4, 2, variant === 'p1' ? '#ffe58f' : '#d2f4ff');
  c.rect(11, 5 + bob, 10, 1, suitHi);

  // Gas mask & Visor (y: 7..13)
  c.rect(11, 7 + bob, 10, 6, PALETTE.maskDark);
  c.rect(12, 8 + bob, 3, 3, PALETTE.visor);
  c.rect(17, 8 + bob, 3, 3, PALETTE.visor);
  c.px(12, 8 + bob, '#ffffff');
  c.px(17, 8 + bob, '#ffffff');
  c.rect(14, 10 + bob, 4, 3, PALETTE.leadDark); // respirator snout
  c.rect(15, 11 + bob, 2, 2, PALETTE.steel);
  c.rect(13, 13 + bob, 6, 2, PALETTE.hose);

  // Torso + Lead Apron Vest (y: 14..22)
  c.rect(8, 14 + bob, 16, 9, PALETTE.outline);
  c.rect(9, 14 + bob, 14, 8, suit);
  c.rect(11, 14 + bob, 10, 8, PALETTE.leadVest);
  c.rect(11, 14 + bob, 10, 1, PALETTE.leadHi);
  c.rect(18, 15 + bob, 3, 7, PALETTE.leadDark);
  // Radiation badge on chest
  c.rect(13, 17 + bob, 2, 2, variant === 'p1' ? PALETTE.p1Hi : PALETTE.cherenkovCyan);
  // Belt
  c.rect(9, 21 + bob, 14, 2, PALETTE.maskDark);
  c.rect(15, 21 + bob, 2, 2, PALETTE.p1Hi);

  // Arms
  if (frameName === 'action_water') {
    // Left arm supporting nozzle
    c.rect(6, 15 + bob, 3, 5, PALETTE.outline);
    c.rect(7, 16 + bob, 2, 4, suitShadow);
    // Extended right arm holding brass/steel hose nozzle
    c.rect(22, 15 + bob, 6, 4, PALETTE.outline);
    c.rect(22, 16 + bob, 5, 2, suit);
    c.rect(26, 15 + bob, 4, 4, PALETTE.steelDark);
    c.rect(27, 16 + bob, 3, 2, PALETTE.steel);
    // Water spray bursts at muzzle
    c.px(30, 16 + bob, PALETTE.waterHi);
    c.px(31, 15 + bob, PALETTE.water);
    c.px(31, 17 + bob, PALETTE.water);
    c.px(30, 18 + bob, PALETTE.waterHi);
  } else if (frameName === 'shield') {
    // Arms raised holding protective lead plate in front
    c.rect(6, 14 + bob, 3, 6, PALETTE.outline);
    c.rect(7, 15 + bob, 2, 4, suit);
    c.rect(23, 14 + bob, 3, 6, PALETTE.outline);
    c.rect(23, 15 + bob, 2, 4, suitShadow);
    // Front tactical lead shield plate
    c.rect(19, 12 + bob, 6, 12, PALETTE.outline);
    c.rect(20, 13 + bob, 4, 10, PALETTE.leadHi);
    c.rect(21, 14 + bob, 2, 8, PALETTE.shieldGlow);
  } else {
    // Standard arms
    c.rect(6, 15 + bob + walkShift, 3, 6, PALETTE.outline);
    c.rect(7, 16 + bob + walkShift, 2, 4, suit);
    c.rect(7, 20 + bob + walkShift, 2, 1, PALETTE.leadDark);

    c.rect(23, 15 + bob - walkShift, 3, 6, PALETTE.outline);
    c.rect(23, 16 + bob - walkShift, 2, 4, suitShadow);
    c.rect(23, 20 + bob - walkShift, 2, 1, PALETTE.leadDark);
  }

  // Legs & Boots (y: 23..29)
  const leftLegY = frameName === 'walk_1' ? 22 : 23;
  const rightLegY = frameName === 'walk_1' ? 24 : 23;

  // Left leg
  c.rect(10, leftLegY, 5, 6, PALETTE.outline);
  c.rect(11, leftLegY, 3, 4, suit);
  c.rect(10, leftLegY + 4, 5, 3, PALETTE.boot);
  c.rect(11, leftLegY + 4, 3, 1, PALETTE.leadDark);

  // Right leg
  c.rect(17, rightLegY, 5, 6, PALETTE.outline);
  c.rect(18, rightLegY, 3, 4, suitShadow);
  c.rect(17, rightLegY + 4, 5, 3, PALETTE.boot);
  c.rect(18, rightLegY + 4, 3, 1, PALETTE.leadDark);

  return c;
}

function drawFireFrame(alt) {
  const c = new PixelCanvas(32, 32);
  // Ash base
  c.rect(5, 26, 22, 4, PALETTE.outline);
  c.rect(6, 27, 20, 2, '#3a1a14');
  // Outer flame
  const pts = alt
    ? [[8,26,16,8],[10,16,12,10],[12,9,8,8],[14,5,4,5],[6,21,4,6],[22,20,4,6]]
    : [[7,26,18,8],[9,15,14,11],[13,7,6,9],[15,3,3,5],[21,19,5,7],[6,22,4,5]];
  for (const [x, y, w, h] of pts) {
    c.rect(x, y - 5, w, h, PALETTE.fireOuter);
  }
  // Mid flame
  c.rect(10, alt ? 14 : 13, 12, 13, PALETTE.fireMid);
  c.rect(12, alt ? 9 : 8, 8, 7, PALETTE.fireMid);
  // Hot core
  c.rect(12, alt ? 18 : 17, 8, 9, PALETTE.fireCore);
  c.rect(14, alt ? 13 : 14, 4, 6, PALETTE.fireWhite);
  // Floating sparks
  c.px(alt ? 9 : 23, alt ? 7 : 6, PALETTE.fireCore);
  c.px(alt ? 24 : 8, alt ? 10 : 12, PALETTE.fireWhite);
  c.px(16, alt ? 3 : 2, PALETTE.fireMid);
  return c;
}

function drawGraphiteFrame(alt) {
  const c = new PixelCanvas(32, 32);
  // Cherenkov ground aura
  c.rect(4, 24, 24, 5, alt ? '#22ff9944' : '#00e5ff33');
  // Irregular graphite block
  c.rect(6, 9, 20, 18, PALETTE.outline);
  c.rect(8, 7, 16, 20, PALETTE.outline);
  c.rect(7, 10, 18, 16, PALETTE.graphiteBase);
  c.rect(9, 8, 14, 18, PALETTE.graphiteBase);
  c.rect(9, 8, 13, 3, PALETTE.graphiteEdge);
  c.rect(7, 11, 3, 12, PALETTE.graphiteEdge);

  // Glowing radioactive cracks
  const glow1 = alt ? PALETTE.cherenkovBright : PALETTE.cherenkov;
  const glow2 = alt ? PALETTE.cherenkov : PALETTE.cherenkovCyan;
  c.line(10, 12, 15, 16, glow1);
  c.line(15, 16, 21, 13, glow2);
  c.line(15, 16, 14, 23, glow1);
  c.line(18, 18, 22, 22, glow2);
  c.px(15, 16, '#ffffff');
  c.px(11, 20, glow2);
  c.px(21, 10, glow1);
  return c;
}

function drawValveFrame(open) {
  const c = new PixelCanvas(32, 32);
  const rim = open ? PALETTE.valveGreen : PALETTE.valveRed;
  const hi = open ? PALETTE.cherenkovBright : PALETTE.valveRedHi;
  const core = open ? PALETTE.valveGreenDark : '#7d1b14';

  // Pipe mount base
  c.rect(11, 22, 10, 7, PALETTE.outline);
  c.rect(12, 23, 8, 5, PALETTE.steelDark);
  c.rect(13, 24, 6, 3, PALETTE.steel);
  c.rect(6, 25, 20, 4, PALETTE.outline);
  c.rect(7, 26, 18, 2, PALETTE.steelDark);

  // Stem
  c.rect(14, 15, 4, 9, PALETTE.outline);
  c.rect(15, 15, 2, 8, PALETTE.steel);

  // Circular wheel
  for (let y = 4; y <= 20; y++) {
    for (let x = 8; x <= 24; x++) {
      const dx = x - 16;
      const dy = y - 12;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= 8.5 && d >= 5.2) {
        c.px(x, y, d > 7.4 ? PALETTE.outline : (dy < 0 ? hi : rim));
      }
    }
  }
  // Spokes (rotated when open)
  if (open) {
    c.line(11, 7, 21, 17, rim);
    c.line(21, 7, 11, 17, rim);
  } else {
    c.rect(15, 6, 2, 12, rim);
    c.rect(10, 11, 12, 2, rim);
  }
  // Center hub
  c.rect(14, 10, 4, 4, PALETTE.outline);
  c.rect(15, 11, 2, 2, core);

  // Status indicator light
  c.rect(23, 4, 5, 5, PALETTE.outline);
  c.rect(24, 5, 3, 3, open ? PALETTE.valveGreen : '#ff3333');
  return c;
}

function drawTileL1(type) {
  const c = new PixelCanvas(32, 32);
  c.rect(0, 0, 32, 32, PALETTE.concrete);
  // Subtle grid border
  c.rect(0, 0, 32, 1, PALETTE.concreteLight);
  c.rect(0, 0, 1, 32, PALETTE.concreteLight);
  c.rect(0, 31, 32, 1, PALETTE.concreteDark);
  c.rect(31, 0, 1, 32, PALETTE.concreteDark);

  // Concrete noise speckles
  for (let i = 0; i < 24; i++) {
    const px = (i * 11 + 5) % 30 + 1;
    const py = (i * 17 + 3) % 30 + 1;
    c.px(px, py, i % 2 === 0 ? PALETTE.concreteDark : PALETTE.concreteLight);
  }

  if (type === 'roof_cracked') {
    c.line(4, 6, 15, 16, PALETTE.concreteDark);
    c.line(15, 16, 26, 13, PALETTE.concreteDark);
    c.line(15, 16, 19, 28, '#232830');
    c.line(5, 7, 15, 17, '#232830');
  } else if (type === 'roof_hazard') {
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        if (y < 6 || y >= 26) {
          c.px(x, y, Math.floor((x + y) / 5) % 2 === 0 ? PALETTE.hazardYellow : PALETTE.hazardBlack);
        }
      }
    }
  } else if (type === 'roof_grate') {
    c.rect(3, 3, 26, 26, '#272c33');
    for (let x = 5; x < 28; x += 4) {
      c.rect(x, 4, 2, 24, '#161a1f');
      c.rect(x + 2, 4, 1, 24, PALETTE.steelDark);
    }
    c.rect(3, 3, 26, 2, PALETTE.steelDark);
    c.rect(3, 27, 26, 2, PALETTE.steelDark);
  }
  return c;
}

function drawTileL2(type) {
  const c = new PixelCanvas(32, 32);
  c.rect(0, 0, 32, 32, PALETTE.tunnelFloor);
  c.rect(0, 0, 32, 1, PALETTE.tunnelMoist);
  c.rect(0, 31, 32, 1, PALETTE.tunnelDark);
  c.rect(31, 0, 1, 32, PALETTE.tunnelDark);

  if (type === 'tunnel_pipe') {
    c.rect(0, 9, 32, 14, PALETTE.tunnelDark);
    c.rect(0, 10, 32, 11, PALETTE.steelDark);
    c.rect(0, 12, 32, 3, PALETTE.steel);
    c.rect(6, 9, 3, 13, PALETTE.rust);
    c.rect(22, 9, 3, 13, PALETTE.rust);
  } else if (type === 'tunnel_water_1' || type === 'tunnel_water_2') {
    const shift = type === 'tunnel_water_2' ? 3 : 0;
    c.rect(1, 1, 30, 30, PALETTE.waterTile1);
    for (let y = 4; y < 29; y += 6) {
      for (let x = 2; x < 28; x += 8) {
        const wx = 2 + ((x + shift) % 24);
        c.rect(wx, y, 5, 1, PALETTE.waterTile2);
        c.px(wx + 1, y, '#298eb8');
      }
    }
  } else {
    // Wet floor puddles
    c.rect(6, 8, 8, 5, PALETTE.tunnelMoist);
    c.rect(18, 19, 9, 6, PALETTE.tunnelMoist);
    c.px(9, 10, '#3a5d75');
    c.px(21, 21, '#3a5d75');
  }
  return c;
}

function drawCoverArtwork() {
  const low = new PixelCanvas(320, 180);

  // Toxic Chernobyl night sky gradient with ash haze
  for (let y = 0; y < 126; y++) {
    const col = y < 38 ? '#0a120d' : y < 78 ? '#132218' : '#1f3324';
    low.rect(0, y, 320, 1, col);
  }
  // Toxic cloud bands
  low.rect(18, 22, 68, 7, '#294230');
  low.rect(34, 18, 42, 5, '#33523b');
  low.rect(206, 28, 86, 8, '#294230');
  low.rect(224, 24, 52, 5, '#33523b');

  // Cherenkov ionized beam shooting into toxic sky from destroyed Reactor 4
  for (let y = 0; y < 122; y++) {
    const half = 10 + Math.floor((122 - y) * 0.11);
    low.rect(160 - half, y, half * 2, 1, '#22ff9922');
    low.rect(160 - Math.floor(half * 0.5), y, half, 1, '#48ff6238');
    low.rect(160 - 4, y, 8, 1, '#c4ffd255');
  }

  // Cooling tower silhouette (right background)
  low.rect(254, 72, 34, 54, '#0f1712');
  low.rect(258, 60, 26, 12, '#141f18');
  low.rect(260, 56, 22, 4, '#1b291f');

  // Iconic Red & White Ventilation Stack (VT-2)
  low.rect(186, 28, 10, 82, '#141813');
  for (let sy = 30; sy < 106; sy += 10) {
    low.rect(187, sy, 8, 5, sy % 20 === 10 ? '#a83226' : '#b9c2ab');
  }

  // Reactor 4 Building + Sarcophagus/Ruined Hall
  low.rect(76, 86, 168, 44, '#171c16');
  low.rect(86, 92, 54, 38, '#232920');
  low.rect(182, 92, 54, 38, '#232920');
  for (let wx = 92; wx < 134; wx += 8) {
    low.rect(wx, 98, 4, 6, '#374032');
    low.rect(wx, 108, 4, 6, '#272f24');
  }
  for (let wx = 188; wx < 230; wx += 8) {
    low.rect(wx, 98, 4, 6, '#374032');
    low.rect(wx, 108, 4, 6, '#f2d64b66');
  }
  // Destroyed open reactor core gap
  low.rect(140, 84, 40, 44, '#090d0a');
  low.rect(144, 96, 32, 28, '#e6453255');
  low.rect(148, 102, 24, 22, '#ff7828aa');
  low.rect(152, 108, 16, 16, '#48ff62');
  low.rect(155, 112, 10, 10, '#c4ffd2');
  low.rect(136, 80, 8, 12, '#3c4337');
  low.rect(176, 78, 8, 14, '#3c4337');

  // Foreground concrete & rusted hazard stripe
  low.rect(0, 126, 320, 54, '#141713');
  low.rect(0, 126, 320, 3, '#383f33');
  for (let x = 0; x < 320; x += 12) {
    low.rect(x, 129, 6, 3, '#d6a422');
    low.rect(x + 6, 129, 6, 3, '#111410');
  }

  // Glowing embers & fallout motes
  const embers = [
    [130,72,'#ff7828'],[146,56,'#f2d64b'],[172,64,'#e64532'],
    [154,40,'#48ff62'],[165,30,'#c4ffd2'],[120,88,'#f2d64b'],[195,82,'#ff7828']
  ];
  for (const [ex, ey, col] of embers) {
    low.rect(ex, ey, 2, 2, col);
  }

  const p1 = drawLiquidator('p1', 'action_water').scaleInteger(2);
  const p2 = drawLiquidator('p2', 'shield').scaleInteger(2);
  low.blit(p1, 24, 112);
  low.blit(p2, 232, 112);

  return low.scaleInteger(2); // 640x360
}

function drawPripyatSkyBackground() {
  const low = new PixelCanvas(320, 180);
  for (let y = 0; y < 180; y++) {
    const col = y < 44 ? '#0c1510' : y < 96 ? '#14231a' : y < 138 ? '#1c3124' : '#0f1611';
    low.rect(0, y, 320, 1, col);
  }
  // Moody toxic clouds
  low.rect(14, 24, 92, 10, '#223829');
  low.rect(36, 18, 54, 6, '#2a4533');
  low.rect(180, 30, 110, 12, '#223829');
  low.rect(210, 22, 62, 8, '#2a4533');

  // Far Pripyat buildings left
  low.rect(8, 92, 24, 60, '#101813');
  low.rect(36, 102, 20, 50, '#101813');
  low.rect(62, 114, 28, 38, '#131d16');

  // Cooling tower & Reactor 4 silhouette right-center
  low.rect(198, 98, 72, 54, '#0f1712');
  low.rect(224, 48, 8, 54, '#111914'); // VT-2 stack
  for (let sy = 50; sy < 86; sy += 8) {
    low.rect(225, sy, 6, 4, sy % 16 === 2 ? '#59231d' : '#4a5448');
  }
  low.rect(278, 86, 28, 66, '#0d140f'); // cooling tower

  // Subtle industrial horizontal pipes along bottom
  low.rect(0, 152, 320, 28, '#0b100d');
  low.rect(0, 150, 320, 3, '#1f2920');
  low.rect(0, 162, 320, 2, '#18211a');
  return low.scaleInteger(2);
}

function drawPortrait(variant) {
  const c = new PixelCanvas(32, 32);
  const K = '#070907';
  const hood = variant === 'p1' ? '#6e7647' : '#4f6266';
  const hoodDark = variant === 'p1' ? '#464d2b' : '#324044';
  const hoodHi = variant === 'p1' ? '#959e67' : '#738c91';
  const lens = variant === 'p1' ? '#48ff62' : '#58d4ff';
  const lensHi = variant === 'p1' ? '#d0ffda' : '#d6f5ff';

  // Dark phosphor background with slight grid
  c.rect(0, 0, 32, 32, '#0a120d');
  for (let y = 0; y < 32; y += 2) {
    c.rect(0, y, 32, 1, '#0d1811');
  }

  // Shoulders & jacket
  c.rect(4, 22, 24, 10, K);
  c.rect(5, 23, 22, 9, hoodDark);
  c.rect(7, 23, 18, 8, hood);
  c.rect(10, 24, 12, 8, '#363b32'); // vest straps

  // Hood outline & shape
  c.rect(7, 3, 18, 20, K);
  c.rect(6, 6, 20, 15, K);
  c.rect(8, 4, 16, 18, hood);
  c.rect(9, 4, 12, 2, hoodHi);
  c.rect(20, 6, 4, 15, hoodDark);

  // Inner gas mask face
  c.rect(9, 7, 14, 14, '#1b1f1c');
  c.rect(10, 8, 12, 12, '#292f2b');

  // Glowing tactical lenses
  c.rect(10, 10, 5, 4, K);
  c.rect(17, 10, 5, 4, K);
  c.rect(11, 11, 3, 2, lens);
  c.rect(18, 11, 3, 2, lens);
  c.px(11, 11, lensHi);
  c.px(18, 11, lensHi);

  // Respirator snout + side canister
  c.rect(13, 14, 6, 7, K);
  c.rect(14, 15, 4, 5, '#485046');
  c.rect(15, 16, 2, 3, '#6b7568');
  c.rect(7, 15, 5, 6, K);
  c.rect(8, 16, 3, 4, '#3a4038');
  c.px(9, 17, '#7c3f1d'); // rust valve cap
  return c;
}

function drawGeigerPlate() {
  const c = new PixelCanvas(96, 64);
  const K = '#070907';
  // Outer metal box
  c.rect(0, 0, 96, 64, K);
  c.rect(2, 2, 92, 60, '#4a5044');
  c.rect(2, 2, 92, 2, '#697260');
  c.rect(2, 60, 92, 2, '#2c3128');

  // Rust patches on corners
  c.rect(2, 2, 9, 6, '#7c3f1d');
  c.rect(84, 3, 10, 6, '#5e2d13');
  c.rect(3, 53, 10, 9, '#5e2d13');
  c.rect(82, 54, 12, 8, '#7c3f1d');

  // 4 steel rivets
  for (const [rx, ry] of [[5, 5], [88, 5], [5, 56], [88, 56]]) {
    c.rect(rx, ry, 3, 3, K);
    c.px(rx + 1, ry + 1, '#98a38f');
  }

  // Dial bezel & olive-cream meter window
  c.rect(9, 8, 78, 46, K);
  c.rect(11, 10, 74, 42, '#c8cfa8');
  c.rect(11, 10, 74, 3, '#9aa37b');

  // Colored radial scale arc centered at (48, 50)
  for (let deg = -56; deg <= 56; deg += 2) {
    const rad = (deg - 90) * (Math.PI / 180);
    const col = deg < -14 ? '#28c852' : deg < 22 ? '#e6c229' : '#e64532';
    for (let r = 29; r <= 35; r++) {
      const x = Math.round(48 + Math.cos(rad) * r);
      const y = Math.round(50 + Math.sin(rad) * r);
      c.px(x, y, col);
    }
    if (deg % 14 === 0) {
      for (let r = 26; r <= 36; r++) {
        const x = Math.round(48 + Math.cos(rad) * r);
        const y = Math.round(50 + Math.sin(rad) * r);
        c.px(x, y, K);
      }
    }
  }

  // Tiny center radiation emblem
  c.rect(45, 31, 6, 6, '#2e3326');
  c.px(47, 33, '#c8cfa8');
  c.px(48, 34, '#c8cfa8');

  // Pivot screw base at bottom center (48, 50)
  c.rect(44, 47, 8, 5, K);
  c.rect(45, 48, 6, 3, '#4a5044');
  return c;
}

function drawModalBanner(kind) {
  const low = new PixelCanvas(160, 70);
  const isVictory = kind === 'victory';

  // Sky
  for (let y = 0; y < 50; y++) {
    const col = isVictory
      ? (y < 20 ? '#0d1b13' : '#183322')
      : (y < 20 ? '#111714' : '#1f2822');
    low.rect(0, y, 160, 1, col);
  }

  // Horizon ruins & VT-2 stack
  low.rect(14, 34, 24, 18, '#101511');
  low.rect(44, 28, 18, 24, '#131914');
  low.rect(108, 30, 36, 22, '#101511');
  low.rect(122, 12, 5, 22, '#0d120e'); // chimney

  if (isVictory) {
    // Stabilized green Cherenkov dome glow
    for (let y = 10; y < 48; y++) {
      const w = 10 + Math.floor((48 - y) * 0.2);
      low.rect(80 - w, y, w * 2, 1, '#48ff6222');
    }
    low.rect(62, 34, 36, 18, '#232b22');
    low.rect(74, 40, 12, 12, '#48ff62');
  } else {
    // Ash / rain streaks
    for (let i = 0; i < 42; i++) {
      const rx = (i * 23 + 7) % 156;
      const ry = (i * 13 + 3) % 52;
      low.line(rx, ry, rx - 2, ry + 3, '#728275');
    }
  }

  // Concrete ground
  low.rect(0, 50, 160, 20, '#1e241d');
  low.rect(0, 50, 160, 2, '#3a4236');

  if (isVictory) {
    const p1 = drawLiquidator('p1', 'shield');
    const p2 = drawLiquidator('p2', 'idle_1');
    low.blit(p1, 26, 24);
    low.blit(p2, 102, 24);
  } else {
    // Fallen stalker/liquidator silhouette inspired by guide 2
    low.rect(52, 43, 38, 13, '#070907');
    low.rect(54, 44, 34, 10, '#4f5946');
    low.rect(82, 34, 14, 14, '#070907');
    low.rect(84, 36, 10, 10, '#626d56'); // hooded head
    low.rect(86, 39, 3, 2, '#48ff62'); // fading eye glow
    low.rect(42, 51, 14, 6, '#384032'); // legs
  }

  return low.scaleInteger(2); // 320x140
}

// ---------- Pyxel Edit (.pyxel) Builder ----------
function buildPyxelArchive({ width, height, tileWidth, tileHeight, sheetCanvas, layerName, framesCount }) {
  const paletteHex = Object.values(PALETTE).map((h) => h.replace('#', '').slice(0, 6));
  const docData = {
    version: '0.4.3',
    name: layerName,
    canvas: {
      width,
      height,
      tileWidth,
      tileHeight,
      numLayers: 1,
      layers: {
        '0': {
          name: layerName,
          alpha: 255,
          hidden: false,
          blendMode: 'normal',
          parentIndex: -1,
          type: 'tile_layer',
          muted: false,
          soloed: false,
          collapsed: false,
          tileRefs: {},
        },
      },
    },
    tileset: {
      tileWidth,
      tileHeight,
      tilesWide: framesCount,
      fixedWidth: true,
      numTiles: framesCount,
    },
    animations: {
      '0': {
        name: 'default',
        baseTile: 0,
        length: framesCount,
        frameDuration: 180,
        frameDurationMultipliers: Array(framesCount).fill(100),
      },
    },
    palette: {
      width: 8,
      height: Math.ceil(paletteHex.length / 8),
      colors: Object.fromEntries(paletteHex.map((hex, i) => [String(i), hex])),
      numColors: paletteHex.length,
    },
    settings: {
      ExportImage_scale: 1,
    },
  };

  const entries = [
    { name: 'docData.json', data: JSON.stringify(docData, null, 2) },
    { name: 'layer0.png', data: sheetCanvas.toPNG() },
  ];

  for (let i = 0; i < framesCount; i++) {
    const tile = new PixelCanvas(tileWidth, tileHeight);
    for (let y = 0; y < tileHeight; y++) {
      for (let x = 0; x < tileWidth; x++) {
        const sx = i * tileWidth + x;
        const idx = (y * sheetCanvas.width + sx) * 4;
        tile.setRGBA(
          x,
          y,
          sheetCanvas.data[idx],
          sheetCanvas.data[idx + 1],
          sheetCanvas.data[idx + 2],
          sheetCanvas.data[idx + 3]
        );
      }
    }
    entries.push({ name: `tile${i}.png`, data: tile.toPNG() });
  }

  return createZip(entries);
}

// ---------- 16x16 UI Icon Builders ----------
function drawGrid16(rows, palette) {
  const c = new PixelCanvas(16, 16);
  for (let y = 0; y < 16; y++) {
    const row = rows[y] || '';
    for (let x = 0; x < 16; x++) {
      const ch = row[x];
      if (ch && ch !== '.' && palette[ch]) {
        c.px(x, y, palette[ch]);
      }
    }
  }
  return c;
}

function drawUiIcon(name) {
  const K = '#05070f';
  switch (name) {
    case 'heart_full':
      return drawGrid16([
        '................',
        '..kkkk....kkkk..',
        '.krrrrk..krrrrk.',
        'krwrrrrkkrrrrdrk',
        'krwrrrrrrrrrrdrk',
        'krrrrrrrrrrrrdrk',
        'krrrrrrrrrrrrdrk',
        '.krrrrrrrrrrdrk.',
        '..krrrrrrrrdrk..',
        '...krrrrrrdrk...',
        '....krrrrdrk....',
        '.....krrdrk.....',
        '......kddk......',
        '.......kk.......',
        '................',
        '................',
      ], { k: K, r: '#e63232', d: '#9e1313', w: '#ffffff' });

    case 'heart_empty':
      return drawGrid16([
        '................',
        '..kkkk....kkkk..',
        '.kbbbbk..kbbbbk.',
        'kbdddddkkdddddbk',
        'kbddddddddddddbk',
        'kbddddddddddddbk',
        'kbddddddddddddbk',
        '.kbddddddddddbk.',
        '..kbddddddddbk..',
        '...kbddddddbk...',
        '....kbddddbk....',
        '.....kbddbk.....',
        '......kbbk......',
        '.......kk.......',
        '................',
        '................',
      ], { k: K, b: '#5c6ea8', d: '#141936' });

    case 'rad_icon':
      return drawGrid16([
        '....kkkkkkkk....',
        '..kkwyyyyyyyk...',
        '.kwyyyyyyyyyyk..',
        '.kyykkkyykkkyyk.',
        'kyykkkkyykkkkyyk',
        'kyykkkkyykkkkyyk',
        'kyyyyyykkgyyyyyk',
        'kyyyyykYYkyyyyyk',
        'kyyyyyykkgyyyyyk',
        'kyyyyykkkkyyyyyk',
        'kyyyykkkkkkyyyyk',
        '.kyykkkkkkkkyyk.',
        '.kyyyyyyyyyyyyk.',
        '..kggggggggggk..',
        '....kkkkkkkk....',
        '................',
      ], { k: K, y: '#ffd426', g: '#b87b00', w: '#fff8c9', Y: '#ffd426' });

    case 'mic_on':
      return drawGrid16([
        '.....kkkkkk.....',
        '....kwgggggk....',
        '....kggggddk....',
        '....kggggddk....',
        '....kggggddk....',
        '..k.kggggddk.k..',
        '..k.kggggddk.k..',
        '..k..kkkkkk..k..',
        '..kk........kk..',
        '...kkkkkkkkkk...',
        '.......kk.......',
        '.......kk.......',
        '....kkkkkkkk....',
        '...kssssssssk...',
        '...kkkkkkkkkk...',
        '................',
      ], { k: K, g: '#28c852', d: '#147a32', w: '#b8ffd0', s: '#dce6f4' });

    case 'mic_off':
      return drawGrid16([
        '.rr..kkkkkk.....',
        'krrrkssssssk....',
        '.krrkssddssk....',
        '..krrkssddsk....',
        '...krrkssddk....',
        '..k.krrksddk.k..',
        '..k.kssrrddk.k..',
        '..k..kkkrrk..k..',
        '..kk.....rr.kk..',
        '...kkkkkkrrkk...',
        '.......kk.rr....',
        '.......kk..rr...',
        '....kkkkkkkkrk..',
        '...kddddddddkrr.',
        '...kkkkkkkkkk...',
        '................',
      ], { k: K, s: '#8fa0bf', d: '#4f5d7a', r: '#e63232' });

    case 'audio_on':
      return drawGrid16([
        '................',
        '......kk....kk..',
        '.....kwsk..kbbk.',
        '....kwssk...kbbk',
        '.kkkksssk.k..kbk',
        'kwssssssk.kb.kbk',
        'ksssssssk.kb.kbk',
        'kssssdddk.kb.kbk',
        'kssssdddk.kb.kbk',
        '.kkkkdddk.k..kbk',
        '....kdddk...kbbk',
        '.....kddk..kbbk.',
        '......kk....kk..',
        '................',
        '................',
        '................',
      ], { k: K, s: '#dce6f4', d: '#7a8cb0', w: '#ffffff', b: '#38bdf8' });

    case 'audio_off':
      return drawGrid16([
        '................',
        '......kk........',
        '.....kwsk.k..k..',
        '....kwsskkrrkrr.',
        '.kkkksssk.krrrk.',
        'kwssssssk..krrk.',
        'ksssssssk.krrrk.',
        'kssssdddkkrrkrr.',
        'kssssdddk.k..k..',
        '.kkkkdddk.......',
        '....kdddk.......',
        '.....kddk.......',
        '......kk........',
        '................',
        '................',
        '................',
      ], { k: K, s: '#8fa0bf', d: '#4f5d7a', w: '#dce6f4', r: '#e63232' });

    case 'keyboard':
      return drawGrid16([
        '................',
        '.......kk.......',
        '.......kk.......',
        '.kkkkkkkkkkkkkk.',
        'kwwwwwwwwwwwwwwk',
        'kwksksksksksksyk',
        'kwkkkkkkkkkkkkyk',
        'kwksksksksksksyk',
        'kwkkkkkkkkkkkkyk',
        'kwksksssssskssyk',
        'kddddddddddddddk',
        '.kkkkkkkkkkkkkk.',
        '................',
        '................',
        '................',
        '................',
      ], { k: K, w: '#dce6f4', s: '#7a8cb0', d: '#485675', y: '#ffd426' });

    case 'trophy':
      return drawGrid16([
        '..kkkkkkkkkkkk..',
        '.kwwyyyyyyyyggk.',
        'kdkwyyyyyyyyggdk',
        'kdkwyyyyyyyyggdk',
        'kdkwyyyyyyyyggdk',
        '.kkwyyyyyyyygkk.',
        '...kdyyyyyygk...',
        '....kdyyyygk....',
        '.....kdyygk.....',
        '......kddk......',
        '......kddk......',
        '....kkwyygkk....',
        '...kggggggggk...',
        '...kkkkkkkkkk...',
        '................',
        '................',
      ], { k: K, y: '#ffd426', g: '#b87b00', w: '#fff8c9', d: '#8a5800' });

    case 'skull':
      return drawGrid16([
        '....kkkkkkkk....',
        '..kkwwwwwwwwkk..',
        '.kwwssssssssssk.',
        '.kwssssssssssdk.',
        'kwsskksssskkssdk',
        'kwskkkksskkkkssk',
        'kwsskksssskkssdk',
        'ksssssskkssssddk',
        '.kssssksskssddk.',
        '..kssssssssddk..',
        '...kskskskskk...',
        '...kskskskskk...',
        '....kkkkkkkk....',
        '................',
        '................',
        '................',
      ], { k: K, w: '#ffffff', s: '#dce6f4', d: '#7a8cb0' });

    case 'arrow_up':
      return drawGrid16([
        '.......kk.......',
        '......kyyk......',
        '.....kwyyyk.....',
        '....kwyyyygk....',
        '...kwyyyyyggk...',
        '..kwyyyyyyyggk..',
        '.kwyyyyyyyyyggk.',
        '.kkkkkyyyggkkkk.',
        '.....kyyygk.....',
        '.....kyyygk.....',
        '.....kyyygk.....',
        '.....kyyygk.....',
        '.....kggggk.....',
        '.....kkkkkk.....',
        '................',
        '................',
      ], { k: K, y: '#ffd426', g: '#b87b00', w: '#fff8c9' });

    case 'arrow_down':
      return drawGrid16([
        '.....kkkkkk.....',
        '.....kwyyyk.....',
        '.....kyyygk.....',
        '.....kyyygk.....',
        '.....kyyygk.....',
        '.....kyyygk.....',
        '.kkkkkyyyggkkkk.',
        '.kwyyyyyyyyyggk.',
        '..kgyyyyyyyggk..',
        '...kgyyyyyggk...',
        '....kgyyyggk....',
        '.....kgyggk.....',
        '......kggk......',
        '.......kk.......',
        '................',
        '................',
      ], { k: K, y: '#ffd426', g: '#b87b00', w: '#fff8c9' });

    case 'arrow_left':
      return drawGrid16([
        '................',
        '......kk........',
        '.....kwyk.......',
        '....kwyyk.......',
        '...kwyyyk.......',
        '..kwyyyykkkkkkk.',
        '.kwyyyyyyyyyyygk',
        '.kgggggggggggggk',
        '..kggggggggggggk',
        '...kggggkkkkkkk.',
        '....kgggk.......',
        '.....kggk.......',
        '......kk........',
        '................',
        '................',
        '................',
      ], { k: K, y: '#ffd426', g: '#b87b00', w: '#fff8c9' });

    case 'arrow_right':
      return drawGrid16([
        '................',
        '........kk......',
        '.......kywk.....',
        '.......kyyyk....',
        '.......kyyywk...',
        '.kkkkkkkyyyygk..',
        'kwyyyyyyyyyyygk.',
        'kgggggggggggggk.',
        'kggggggggggggk..',
        '.kkkkkkkggggk...',
        '.......kgggk....',
        '.......kggk.....',
        '........kk......',
        '................',
        '................',
        '................',
      ], { k: K, y: '#ffd426', g: '#b87b00', w: '#fff8c9' });

    case 'warning_tri':
      return drawGrid16([
        '................',
        '.......kk.......',
        '......koyk......',
        '.....kooyok.....',
        '.....koyyok.....',
        '....kooyyook....',
        '....koykkyok....',
        '...kooykkyook...',
        '...koyykkyyok...',
        '..kooyyyoyyook..',
        '..koyykokyyook..',
        '.kooyykkkyyoook.',
        '.kddddddddddddk.',
        '.kkkkkkkkkkkkkk.',
        '................',
        '................',
      ], { k: K, o: '#d95b16', y: '#f2a629', d: '#7c2e0a' });

    case 'biohazard':
      return drawGrid16([
        '....kkkkkkkk....',
        '..kkddddddddkk..',
        '.kdokkkkkkkkodk.',
        '.kdkkoooooookdk.',
        'kdkkooddddoookdk',
        'kdkokdkkkkdkoook',
        'kdkookkkkkkoookd',
        'kdkkoodkkdoookdk',
        'kdkkkookkookkkdk',
        'kdkookkkkkkoookd',
        '.kdkokooooookdk.',
        '.kdokkkkkkkkodk.',
        '..kkddddddddkk..',
        '....kkkkkkkk....',
        '................',
        '................',
      ], { k: K, o: '#e65a1c', d: '#7c2e0a' });

    default:
      return new PixelCanvas(16, 16);
  }
}

// ---------- Main Export Pipeline ----------
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function saveSheetAndFrames(sheetName, spriteSubdir, pyxelName, frameDefs, frameSize = 32) {
  const sheet = new PixelCanvas(frameDefs.length * frameSize, frameSize);
  const subDir = path.join(SPRITES_DIR, spriteSubdir);
  ensureDir(subDir);

  frameDefs.forEach((def, idx) => {
    const canvas = def.draw();
    sheet.blit(canvas, idx * frameSize, 0);
    fs.writeFileSync(path.join(subDir, `${def.name}.png`), canvas.toPNG());
  });

  const sheetPath = path.join(SHEETS_DIR, sheetName);
  fs.writeFileSync(sheetPath, sheet.toPNG());

  const pyxelBuf = buildPyxelArchive({
    width: sheet.width,
    height: sheet.height,
    tileWidth: frameSize,
    tileHeight: frameSize,
    sheetCanvas: sheet,
    layerName: spriteSubdir,
    framesCount: frameDefs.length,
  });
  fs.writeFileSync(path.join(PIXEL_DIR, pyxelName), pyxelBuf);

  return {
    sheet: `assets/spritesheets/${sheetName}`,
    pyxel: `assets/pixeledit/${pyxelName}`,
    frameWidth: frameSize,
    frameHeight: frameSize,
    frames: frameDefs.map((f, i) => ({ index: i, name: f.name, file: `assets/sprites/${spriteSubdir}/${f.name}.png` })),
  };
}

function main() {
  ensureDir(SHEETS_DIR);
  ensureDir(SPRITES_DIR);
  ensureDir(PIXEL_DIR);

  const manifest = {
    project: 'Chernobil 86: Turno de 90 Segundos',
    author: 'Cesar Sachun Pozo',
    pixelSize: 32,
    palette: PALETTE,
    assets: {},
  };

  manifest.assets.liquidador_p1 = saveSheetAndFrames(
    'liquidador_p1_sheet.png',
    'p1',
    'liquidador_p1.pyxel',
    [
      { name: 'idle_1', draw: () => drawLiquidator('p1', 'idle_1') },
      { name: 'idle_2', draw: () => drawLiquidator('p1', 'idle_2') },
      { name: 'walk_1', draw: () => drawLiquidator('p1', 'walk_1') },
      { name: 'action_water', draw: () => drawLiquidator('p1', 'action_water') },
      { name: 'shield', draw: () => drawLiquidator('p1', 'shield') },
    ]
  );

  manifest.assets.liquidador_p2 = saveSheetAndFrames(
    'liquidador_p2_sheet.png',
    'p2',
    'liquidador_p2.pyxel',
    [
      { name: 'idle_1', draw: () => drawLiquidator('p2', 'idle_1') },
      { name: 'idle_2', draw: () => drawLiquidator('p2', 'idle_2') },
      { name: 'walk_1', draw: () => drawLiquidator('p2', 'walk_1') },
      { name: 'action_water', draw: () => drawLiquidator('p2', 'action_water') },
      { name: 'shield', draw: () => drawLiquidator('p2', 'shield') },
    ]
  );

  manifest.assets.hazards = saveSheetAndFrames(
    'hazards_sheet.png',
    'hazards',
    'hazards_objects.pyxel',
    [
      { name: 'fire_1', draw: () => drawFireFrame(false) },
      { name: 'fire_2', draw: () => drawFireFrame(true) },
      { name: 'graphite_1', draw: () => drawGraphiteFrame(false) },
      { name: 'graphite_2', draw: () => drawGraphiteFrame(true) },
      { name: 'valve_closed', draw: () => drawValveFrame(false) },
      { name: 'valve_open', draw: () => drawValveFrame(true) },
    ]
  );

  manifest.assets.level1_tiles = saveSheetAndFrames(
    'tiles_level1_sheet.png',
    'level1',
    'escenario_nivel1.pyxel',
    [
      { name: 'roof_concrete', draw: () => drawTileL1('roof_concrete') },
      { name: 'roof_cracked', draw: () => drawTileL1('roof_cracked') },
      { name: 'roof_hazard', draw: () => drawTileL1('roof_hazard') },
      { name: 'roof_grate', draw: () => drawTileL1('roof_grate') },
    ]
  );

  manifest.assets.level2_tiles = saveSheetAndFrames(
    'tiles_level2_sheet.png',
    'level2',
    'escenario_nivel2.pyxel',
    [
      { name: 'tunnel_floor', draw: () => drawTileL2('tunnel_floor') },
      { name: 'tunnel_pipe', draw: () => drawTileL2('tunnel_pipe') },
      { name: 'tunnel_water_1', draw: () => drawTileL2('tunnel_water_1') },
      { name: 'tunnel_water_2', draw: () => drawTileL2('tunnel_water_2') },
    ]
  );

  const uiIconNames = [
    'heart_full',
    'heart_empty',
    'rad_icon',
    'mic_on',
    'mic_off',
    'audio_on',
    'audio_off',
    'keyboard',
    'trophy',
    'skull',
    'arrow_up',
    'arrow_down',
    'arrow_left',
    'arrow_right',
    'warning_tri',
    'biohazard',
  ];
  manifest.assets.ui_8bit = saveSheetAndFrames(
    'ui_8bit_sheet.png',
    'ui',
    'ui_8bit.pyxel',
    uiIconNames.map((name) => ({ name, draw: () => drawUiIcon(name) })),
    16
  );

  manifest.assets.portraits = saveSheetAndFrames(
    'portraits_sheet.png',
    'ui',
    'portraits.pyxel',
    [
      { name: 'portrait_p1', draw: () => drawPortrait('p1') },
      { name: 'portrait_p2', draw: () => drawPortrait('p2') },
    ],
    32
  );

  const geigerCanvas = drawGeigerPlate();
  fs.writeFileSync(path.join(SPRITES_DIR, 'ui', 'geiger_plate.png'), geigerCanvas.toPNG());
  manifest.assets.geiger_plate = {
    file: 'assets/sprites/ui/geiger_plate.png',
    width: geigerCanvas.width,
    height: geigerCanvas.height,
  };

  const bgSky = drawPripyatSkyBackground();
  fs.writeFileSync(path.join(SHEETS_DIR, 'bg_pripyat_sky.png'), bgSky.toPNG());
  manifest.assets.bg_pripyat_sky = {
    file: 'assets/spritesheets/bg_pripyat_sky.png',
    width: bgSky.width,
    height: bgSky.height,
  };

  const gameOverBanner = drawModalBanner('gameover');
  fs.writeFileSync(path.join(SHEETS_DIR, 'gameover_chernobyl.png'), gameOverBanner.toPNG());
  manifest.assets.gameover_banner = {
    file: 'assets/spritesheets/gameover_chernobyl.png',
    width: gameOverBanner.width,
    height: gameOverBanner.height,
  };

  const victoryBanner = drawModalBanner('victory');
  fs.writeFileSync(path.join(SHEETS_DIR, 'victory_chernobyl.png'), victoryBanner.toPNG());
  manifest.assets.victory_banner = {
    file: 'assets/spritesheets/victory_chernobyl.png',
    width: victoryBanner.width,
    height: victoryBanner.height,
  };

  const coverCanvas = drawCoverArtwork();
  fs.writeFileSync(path.join(SHEETS_DIR, 'portada_chernobyl86.png'), coverCanvas.toPNG());
  manifest.assets.cover = {
    file: 'assets/spritesheets/portada_chernobyl86.png',
    width: coverCanvas.width,
    height: coverCanvas.height,
  };

  fs.writeFileSync(path.join(PIXEL_DIR, 'sprites_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Generated all sprites, spritesheets, cover art, and .pyxel files successfully.');
}

main();
