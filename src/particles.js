export class EffectsEngine {
  constructor() {
    this.particles = [];
    this.rings = [];
    this.floatingTexts = [];
    this.beams = [];
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.flashColor = '#22ff99';
    this.flashAlpha = 0;
  }

  triggerShake(intensity = 6, duration = 0.25) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  triggerFlash(color = '#ff4433', alpha = 0.35) {
    this.flashColor = color;
    this.flashAlpha = Math.max(this.flashAlpha, alpha);
  }

  addFloatingText(x, y, text, color = '#ffe58f') {
    this.floatingTexts.push({
      x,
      y,
      vy: -36,
      text,
      color,
      life: 1.15,
      maxLife: 1.15,
    });
  }

  addRing(x, y, maxRadius, color = '#22ff99', lineWidth = 4) {
    this.rings.push({
      x,
      y,
      radius: 8,
      maxRadius,
      color,
      lineWidth,
      life: 0.55,
      maxLife: 0.55,
    });
  }

  emitSparks(x, y, count = 10, color = '#ff9a1f') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 35,
        size: 3 + Math.floor(Math.random() * 4),
        color,
        gravity: 160,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
      });
    }
  }

  emitWaterJet(fromX, fromY, dirX, dirY, boosted = false) {
    const baseAngle = Math.atan2(dirY, dirX);
    const count = boosted ? 34 : 22;
    const range = boosted ? 220 : 155;
    this.beams.push({
      x1: fromX,
      y1: fromY,
      x2: fromX + dirX * range,
      y2: fromY + dirY * range,
      boosted,
      life: 0.24,
      maxLife: 0.24,
    });

    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * (boosted ? 0.5 : 0.38);
      const speed = (boosted ? 260 : 195) + Math.random() * 130;
      const a = baseAngle + spread;
      this.particles.push({
        x: fromX,
        y: fromY,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        size: boosted ? 5 : 4,
        color: i % 3 === 0 ? '#c8f8ff' : '#38d9ff',
        gravity: 45,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
      });
    }
  }

  emitSteam(x, y, count = 14) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 28,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 45,
        vy: -25 - Math.random() * 55,
        size: 5 + Math.floor(Math.random() * 5),
        color: i % 2 === 0 ? '#e5f4ff' : '#a9c0d4',
        gravity: -20,
        life: 0.5 + Math.random() * 0.45,
        maxLife: 0.95,
      });
    }
  }

  emitVoiceWave(x, y, boosted = false) {
    this.addRing(x, y, boosted ? 110 : 72, boosted ? '#ffe58f' : '#38bdf8', boosted ? 5 : 3);
  }

  update(dt) {
    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
      if (this.shakeTime === 0) this.shakeIntensity = 0;
    }
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 1.4);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      if (r.life <= 0) {
        this.rings.splice(i, 1);
        continue;
      }
      const progress = 1 - r.life / r.maxLife;
      r.radius = 8 + (r.maxRadius - 8) * progress;
    }

    for (let i = this.beams.length - 1; i >= 0; i--) {
      this.beams[i].life -= dt;
      if (this.beams[i].life <= 0) this.beams.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      t.y += t.vy * dt;
    }
  }

  getShakeOffset() {
    if (this.shakeTime <= 0) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * 2 * this.shakeIntensity,
      y: (Math.random() - 0.5) * 2 * this.shakeIntensity,
    };
  }

  draw(ctx) {
    // Water jet core beams
    for (const b of this.beams) {
      const alpha = b.life / b.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = b.boosted ? '#c8f8ff' : '#38d9ff';
      ctx.lineWidth = b.boosted ? 12 : 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.restore();
    }

    // Expanding rings
    for (const r of this.rings) {
      const alpha = r.life / r.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.lineWidth;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Pixel particles
    for (const p of this.particles) {
      const alpha = Math.min(1, p.life / (p.maxLife * 0.6));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size);
      ctx.restore();
    }

    // Floating feedback labels (8-bit pixel font + hard drop shadow)
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    const canvasW = ctx.canvas ? ctx.canvas.width : 672;
    for (const t of this.floatingTexts) {
      const alpha = Math.min(1, t.life / 0.45);
      const tx = Math.max(105, Math.min(canvasW - 105, Math.round(t.x)));
      const ty = Math.round(t.y);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#05070f';
      ctx.fillText(t.text, tx + 2, ty + 2);
      ctx.fillText(t.text, tx - 1, ty);
      ctx.fillText(t.text, tx + 1, ty);
      ctx.fillText(t.text, tx, ty - 1);
      ctx.fillText(t.text, tx, ty + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, tx, ty);
    }
    ctx.restore();
  }

  drawScreenOverlay(ctx, width, height) {
    if (this.flashAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }
}
