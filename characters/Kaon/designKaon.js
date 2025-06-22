// characters/Kaon/designKaon.js

// Orb states: 'idle', 'attacking', 'returning'
function setOrbsState(player, state, targetPositions = null) {
  player.orbs.forEach((orb, i) => {
    orb.state = state;
    if (state === 'attacking' && targetPositions) {
      orb.targetX = targetPositions[i].x;
      orb.targetY = targetPositions[i].y;
    }
  });
}

// Helper to reset orbs to idle state and recalculate positions (slightly lower)
function resetOrbs(player) {
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2 - 42; // Lowered from -52 to -42
  const numOrbs = 3;
  const radius = 24;
  player.orbs.forEach((orb, i) => {
    orb.state = 'idle';
    orb.angle = (i / numOrbs) * 2 * Math.PI;
    orb.distance = radius;
    orb.x = centerX + Math.cos(orb.angle) * orb.distance;
    orb.y = centerY + Math.sin(orb.angle) * orb.distance;
  });
}

export function initializeKaon(player) {
  player.orbs = [];
  const numOrbs = 3;
  for (let i = 0; i < numOrbs; i++) {
    player.orbs.push({
      angle: (i / numOrbs) * 2 * Math.PI,
      distance: 24,
      size: 8, // Slightly smaller orb
      state: 'idle',
      x: 0, y: 0,
      targetX: 0, targetY: 0
    });
  }
  resetOrbs(player);
}

export function updateKaon(player) {
  // Animate orbs based on their state
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2 - 42; // Lowered from -52 to -42
  player.orbs.forEach((orb, i) => {
    if (orb.state === 'idle') {
      orb.angle += 0.03;
      orb.distance = 24 + Math.sin(Date.now() * 0.003 + i) * 1.5;
      orb.x = centerX + Math.cos(orb.angle) * orb.distance;
      orb.y = centerY + Math.sin(orb.angle) * orb.distance;
    } else if (orb.state === 'attacking') {
      orb.x += (orb.targetX - orb.x) * 0.22;
      orb.y += (orb.targetY - orb.y) * 0.22;
      if (Math.abs(orb.x - orb.targetX) < 1 && Math.abs(orb.y - orb.targetY) < 1) {
        orb.x = orb.targetX;
        orb.y = orb.targetY;
      }
    } else if (orb.state === 'returning') {
      const idleX = centerX + Math.cos(orb.angle) * 24;
      const idleY = centerY + Math.sin(orb.angle) * 24;
      orb.x += (idleX - orb.x) * 0.18;
      orb.y += (idleY - orb.y) * 0.18;
      if (Math.abs(orb.x - idleX) < 1 && Math.abs(orb.y - idleY) < 1) {
        orb.state = 'idle';
      }
    }
  });
}

// --- Orbs: Draw first, so stickman is in front ---
function drawOrbs(ctx, player, bobOffset) {
  player.orbs.forEach((orb, i) => {
    ctx.save();
    ctx.shadowColor = '#ffe53b';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffe53b';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.size + Math.sin(Date.now() * 0.005 + i) * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  });
}

// --- Cartoonish/cool stickman, meditative pose, smaller, levitating lower ---
function drawKaonBody(ctx, player, bobOffset) {
  const { x, y, width, height, color } = player;
  // Meditative floating pose, smaller, slightly lower
  const baseY = y + height + bobOffset - 52; // Lowered from -62 to -52
  const centerX = x + width / 2;
  // Head (blue/player color, smaller)
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 7;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, baseY - 28, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  // Torso (thinner, cartoonish)
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(centerX, baseY - 16);
  ctx.lineTo(centerX, baseY + 4);
  ctx.stroke();
  // Arms (thinner, more dynamic, palms up)
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(centerX, baseY - 14);
  ctx.quadraticCurveTo(centerX - 20, baseY - 2, centerX - 16, baseY + 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(centerX, baseY - 14);
  ctx.quadraticCurveTo(centerX + 20, baseY - 2, centerX + 16, baseY + 12);
  ctx.stroke();
  // Hands (cartoonish, round)
  ctx.beginPath();
  ctx.arc(centerX - 16, baseY + 12, 3, 0, Math.PI * 2);
  ctx.arc(centerX + 16, baseY + 12, 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // Legs (crossed, thinner, cartoonish)
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(centerX, baseY + 4);
  ctx.lineTo(centerX - 10, baseY + 28);
  ctx.lineTo(centerX + 10, baseY + 28);
  ctx.lineTo(centerX, baseY + 4);
  ctx.stroke();
  // Feet (cartoonish, round)
  ctx.beginPath();
  ctx.arc(centerX - 10, baseY + 28, 3, 0, Math.PI * 2);
  ctx.arc(centerX + 10, baseY + 28, 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

// --- Attack Poses: Orbs animate for every move, fix side heavy ---
function drawKaonAttackPose(ctx, player, bobOffset) {
  const { activeMove, attackHitbox, attackHitbox2, facing } = player;
  if (!activeMove) return;
  let orbTargets = Array(player.orbs.length).fill(null);
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2 - 36;
  if (activeMove.name === 'Big Bang Attack') {
    // All orbs combine into one big yellow orb before launching
    const bbX = facing > 0 ? attackHitbox.x + attackHitbox.width / 2 : attackHitbox.x - attackHitbox.width / 2;
    const bbY = attackHitbox.y;
    orbTargets = orbTargets.map(() => ({ x: bbX, y: bbY }));
    setOrbsState(player, 'attacking', orbTargets);
    // Draw only one big yellow orb (no extra dot)
    ctx.save();
    ctx.shadowColor = '#ffe53b';
    ctx.shadowBlur = 36;
    ctx.fillStyle = '#ffe53b';
    ctx.beginPath();
    ctx.arc(bbX, bbY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  } else if (activeMove.name === 'Core Beam') {
    // Orbs spiral tightly and merge at beam origin
    const beamX = facing > 0 ? attackHitbox.x : attackHitbox.x + attackHitbox.width;
    const beamY = attackHitbox.y + attackHitbox.height / 2;
    orbTargets = orbTargets.map((_, i) => {
      const angle = (i / orbTargets.length) * 2 * Math.PI + Date.now() * 0.01;
      return {
        x: beamX + Math.cos(angle) * 12,
        y: beamY + Math.sin(angle) * 12
      };
    });
    setOrbsState(player, 'attacking', orbTargets);
  } else if (activeMove.name === 'Gravity Spike') {
    // Orbs align vertically and pulse
    const spikeX = attackHitbox.x + attackHitbox.width / 2;
    const spikeY = attackHitbox.y;
    orbTargets = orbTargets.map((_, i) => ({ x: spikeX, y: spikeY - i * 16 }));
    setOrbsState(player, 'attacking', orbTargets);
  } else if (activeMove.name === 'Dual Blast') {
    // Orbs split: some to each blast, some stay
    const leftX = attackHitbox2 ? attackHitbox2.x + attackHitbox2.width / 2 : centerX - 16;
    const rightX = attackHitbox.x + attackHitbox.width / 2;
    const y = attackHitbox.y + attackHitbox.height / 2;
    orbTargets = [
      { x: leftX, y: y },
      { x: rightX, y: y },
      ...Array(player.orbs.length - 2).fill({ x: centerX, y: centerY })
    ];
    setOrbsState(player, 'attacking', orbTargets);
  } else {
    // Light attacks: orbs stretch out and pulse
    const dir = facing > 0 ? 1 : -1;
    orbTargets = orbTargets.map((_, i) => ({
      x: centerX + dir * (18 + i * 8),
      y: centerY + Math.sin(Date.now() * 0.01 + i) * 6
    }));
    setOrbsState(player, 'attacking', orbTargets);
  }
  // Draw orbs first, then body (so body is in front)
  drawOrbs(ctx, player, bobOffset);
  drawKaonBody(ctx, player, bobOffset);
}

// --- DBZ/Cartoonish Attack Visuals ---
function drawAttackVisuals(ctx, player) {
  const { attackHitbox, attackHitbox2, activeMove, attackType, chargeLevel } = player;
  if (!attackHitbox || !activeMove) return;
  // DBZ-style energy and cartoon impact
  if (activeMove.name === 'Core Beam') {
    // Beam: thick, glowing, animated
    ctx.save();
    ctx.shadowColor = '#6cf';
    ctx.shadowBlur = 30;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(100,200,255,0.7)';
    ctx.fillRect(attackHitbox.x, attackHitbox.y, attackHitbox.width, attackHitbox.height);
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
    // Inner core
    ctx.fillStyle = 'white';
    ctx.fillRect(attackHitbox.x + attackHitbox.width * 0.2, attackHitbox.y + attackHitbox.height * 0.2, attackHitbox.width * 0.6, attackHitbox.height * 0.6);
    // Energy lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = 'rgba(100,200,255,0.7)';
      ctx.beginPath();
      ctx.moveTo(attackHitbox.x + Math.random() * attackHitbox.width, attackHitbox.y);
      ctx.lineTo(attackHitbox.x + Math.random() * attackHitbox.width, attackHitbox.y + attackHitbox.height);
      ctx.stroke();
    }
    ctx.restore();
  } else if (activeMove.name === 'Big Bang Attack') {
    // Big glowing ball
    ctx.save();
    const bbX = attackHitbox.x + attackHitbox.width / 2;
    const bbY = attackHitbox.y + attackHitbox.height / 2;
    const r = Math.max(attackHitbox.width, attackHitbox.height) / 2;
    const grad = ctx.createRadialGradient(bbX, bbY, r * 0.2, bbX, bbY, r);
    grad.addColorStop(0, 'white');
    grad.addColorStop(0.4, '#ffe53b');
    grad.addColorStop(0.7, '#ff9800');
    grad.addColorStop(1, 'rgba(255,152,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bbX, bbY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (activeMove.name === 'Ki Orb') {
    // Fast orb projectile
    ctx.save();
    const orbX = attackHitbox.x + attackHitbox.width / 2;
    const orbY = attackHitbox.y + attackHitbox.height / 2;
    ctx.shadowColor = '#6cf';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#6cf';
    ctx.beginPath();
    ctx.arc(orbX, orbY, attackHitbox.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (activeMove.name === 'Gravity Spike') {
    // Vertical energy spike
    ctx.save();
    ctx.shadowColor = '#ffe53b';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(255,229,59,0.7)';
    ctx.fillRect(attackHitbox.x, attackHitbox.y, attackHitbox.width, attackHitbox.height);
    ctx.restore();
    // Impact ring
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,0,0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(attackHitbox.x + attackHitbox.width / 2, attackHitbox.y + attackHitbox.height, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (activeMove.name === 'Dual Blast') {
    // Two cartoonish blasts
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,0,0.5)';
    ctx.fillRect(attackHitbox.x, attackHitbox.y, attackHitbox.width, attackHitbox.height);
    if (attackHitbox2) ctx.fillRect(attackHitbox2.x, attackHitbox2.y, attackHitbox2.width, attackHitbox2.height);
    // Impact rings
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(attackHitbox.x + attackHitbox.width / 2, attackHitbox.y + attackHitbox.height / 2, 12, 0, Math.PI * 2);
    ctx.stroke();
    if (attackHitbox2) {
      ctx.beginPath();
      ctx.arc(attackHitbox2.x + attackHitbox2.width / 2, attackHitbox2.y + attackHitbox2.height / 2, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // Light attacks: quick orb smears
    ctx.save();
    ctx.strokeStyle = '#6cf';
    ctx.lineWidth = 8;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y + player.height / 2);
    ctx.lineTo(attackHitbox.x + attackHitbox.width / 2, attackHitbox.y + attackHitbox.height / 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }
}

function drawKaonChargingPose(ctx, player, bobOffset) {
  drawKaonBody(ctx, player, bobOffset);
  // Orbs spiral tightly and glow
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2 + bobOffset - 10;
  player.orbs.forEach((orb, i) => {
    orb.angle += 0.08 + player.chargeLevel * 0.2;
    orb.distance = 30 + player.chargeLevel * 40;
    orb.x = centerX + Math.cos(orb.angle) * orb.distance;
    orb.y = centerY + Math.sin(orb.angle) * orb.distance;
  });
}

function drawChargeIndicator(ctx, player) {
  const { x, y, width, chargeLevel } = player;
  const barWidth = 60;
  const barHeight = 10;
  const barX = x;
  const barY = y - 30;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  const chargeColor = chargeLevel < 0.5 ? '#ff6b6b' : chargeLevel < 0.8 ? '#ffd93d' : '#6bcf7f';
  ctx.fillStyle = chargeColor;
  ctx.fillRect(barX, barY, barWidth * chargeLevel, barHeight);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  ctx.restore();
}

// --- Main draw: orbs first, then body ---
export function drawKaon(ctx, player) {
  const bobOffset = Math.sin(Date.now() * 0.002) * 4;
  if (player.isAttacking && player.activeMove) {
    drawKaonAttackPose(ctx, player, bobOffset);
    drawAttackVisuals(ctx, player);
  } else if (player.isCharging) {
    drawOrbs(ctx, player, bobOffset);
    drawKaonBody(ctx, player, bobOffset);
    drawChargeIndicator(ctx, player);
  } else {
    drawOrbs(ctx, player, bobOffset);
    drawKaonBody(ctx, player, bobOffset);
    resetOrbs(player);
  }
} 