export const kaonMoveset = {
  // Light Attacks
  neutralLight: { name: 'Orb Jab', type: 'light', baseDamage: 2, knockbackMultiplier: 1.0, duration: 20, cooldown: 20, hitbox: { width: 20, height: 20, offsetX: 60, offsetY: 20 } },
  sideLight: { name: 'Ki Orb', type: 'light', baseDamage: 3, knockbackMultiplier: 1.0, duration: 28, cooldown: 30, hitbox: { width: 15, height: 15, offsetX: 80, offsetY: 25 } },
  upLight: { name: 'Orb Pop', type: 'light', baseDamage: 2, knockbackMultiplier: 1.0, verticalKnockback: true, duration: 24, cooldown: 25, hitbox: { width: 40, height: 40, offsetX: 10, offsetY: -40 } },
  downLight: { name: 'Pulse Sweep', type: 'light', baseDamage: 1, knockbackMultiplier: 1.0, duration: 22, cooldown: 30, hitbox: { width: 100, height: 20, offsetX: -20, offsetY: 40 } },
  // Heavy Attacks
  neutralHeavy: { name: 'Core Beam', type: 'heavy', baseDamage: 8, knockbackMultiplier: 2.0, duration: 30, cooldown: 70, hitbox: { width: 130, height: 12, offsetX: 80, offsetY: -5 } },
  sideHeavy: { name: 'Big Bang Attack', type: 'heavy', baseDamage: 15, knockbackMultiplier: 1.7, duration: 60, cooldown: 90, hitbox: { width: 120, height: 80, offsetX: 80, offsetY: -20 } },
  upHeavy: { name: 'Gravity Spike', type: 'heavy', baseDamage: 12, knockbackMultiplier: 1.8, verticalKnockback: true, spikeKnockback: true, selfLaunch: true, selfLaunchForce: 15, duration: 35, cooldown: 80, hitbox: { width: 20, height: 80, offsetX: 20, offsetY: 40 } },
  downHeavy: { name: 'Dual Blast', type: 'heavy', baseDamage: 8, knockbackMultiplier: 1.5, duration: 40, cooldown: 85, hitbox: { width: 100, height: 40, offsetX: 70, offsetY: 10 }, hitbox2: { width: 100, height: 40, offsetX: -110, offsetY: 10 } },
  // Shield (Special)
  shield: {
    name: 'Orb Shield',
    type: 'shield',
    duration: 60, // frames (example)
    cooldown: 90, // frames (example)
    description: 'Kaon summons his three orbs to spin rapidly around him, forming a glowing, animated shield with a pulsing aura. Blocks incoming attacks while active.',
    visual: 'Three golden orbs spin in a triangle, glowing brightly, with a pulsing aura behind Kaon.'
  },
  // Kaon is floaty and jumps higher, but does not move faster
  weight: 1.2, // Lighter/floaty
  jumpForce: -16, // Higher jump
  moveSpeed: 4.2, // Slightly slower movement (default is 5.0)
};

// Draw Kaon's custom shield (spinning orbs + pulsing aura)
export function drawKaonShield(ctx, player) {
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2 - 32;
  // Animate orbs: spin faster, glow brighter
  player.orbs.forEach((orb, i) => {
    const fastAngle = orb.angle + Date.now() * 0.08 + i * 2;
    const r = 32 + Math.sin(Date.now() * 0.01 + i) * 2;
    const orbX = centerX + Math.cos(fastAngle) * r;
    const orbY = centerY + Math.sin(fastAngle) * r;
    ctx.save();
    ctx.shadowColor = '#ffe53b';
    ctx.shadowBlur = 24;
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#ffe53b';
    ctx.beginPath();
    ctx.arc(orbX, orbY, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    ctx.restore();
  });
  // Draw pulsing aura
  ctx.save();
  const pulse = 38 + Math.sin(Date.now() * 0.008) * 8;
  ctx.globalAlpha = 0.22 + 0.08 * Math.abs(Math.sin(Date.now() * 0.008));
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulse, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.restore();
} 