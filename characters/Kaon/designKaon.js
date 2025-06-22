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

// Helper to reset orbs to idle state and recalculate positions (even lower)
function resetOrbs(player) {
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2 - 32; // Lowered from -42 to -32
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

// Helper to reset orbs after attack ends
function resetOrbsAfterAttack(player) {
  if (!player.isAttacking && player.orbs) {
    resetOrbs(player);
  }
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
  const centerY = player.y + player.height / 2 - 32; // Lowered from -42 to -32
  // If Kaon is attacking with a light move, do not update the first orb (handled in drawKaonAttackPose)
  const skipFirst = player.isAttacking && player.activeMove && player.activeMove.type === 'light';
  player.orbs.forEach((orb, i) => {
    if (skipFirst && i === 0) return;
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
  // Always reset orbs after attack ends
  resetOrbsAfterAttack(player);
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

// --- Cartoonish/cool stickman, meditative pose, smaller, levitating even lower ---
// --- 2 arms only, straight arm poses for heavies, no thickness change ---
// --- Side heavy: only move corresponding arm, more Buddha-like torso, aura ---
function drawKaonBody(ctx, player, bobOffset, pose = 'default', facing = 1) {
  const { x, y, width, height, color } = player;
  // Meditative floating pose, smaller, even lower
  const baseY = y + height + bobOffset - 42;
  const centerX = x + width / 2;
  // Draw faint aura/circle behind character
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(centerX, baseY - 10, 32, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.restore();
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
  // Main vertical body line (neck to belly)
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(centerX, baseY - 15); // Just below head
  ctx.lineTo(centerX, baseY + 8);  // Top of belly
  ctx.stroke();
  // Torso (Buddha-like: rounded belly, chest curve, hint of shoulders)
  // Chest/shoulders
  ctx.beginPath();
  ctx.arc(centerX, baseY - 10, 16, Math.PI * 0.95, Math.PI * 0.05, false);
  ctx.stroke();
  // Belly/abdomen
  ctx.beginPath();
  ctx.arc(centerX, baseY + 8, 10, Math.PI * 1.1, Math.PI * -0.1, false);
  ctx.stroke();
  // Neck line
  ctx.beginPath();
  ctx.arc(centerX, baseY - 18, 6, Math.PI, 2 * Math.PI, false);
  ctx.stroke();
  // Arms (pose-dependent, always 2 arms, no thickness change)
  ctx.lineWidth = 5;
  if (pose === 'sideHeavy') {
    // Only move the corresponding arm (left or right) in the direction of the attack
    if (facing > 0) {
      // Right arm straight right, left arm meditative
      ctx.beginPath();
      ctx.moveTo(centerX + 8, baseY - 10); // Connect from right side of chest
      ctx.lineTo(centerX + 32, baseY - 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX + 32, baseY - 14, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      // Left arm meditative, connect from left side of chest
      ctx.beginPath();
      ctx.moveTo(centerX - 8, baseY - 10);
      ctx.lineTo(centerX - 16, baseY + 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX - 16, baseY + 12, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      // Left arm straight left, right arm meditative
      ctx.beginPath();
      ctx.moveTo(centerX - 8, baseY - 10); // Connect from left side of chest
      ctx.lineTo(centerX - 32, baseY - 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX - 32, baseY - 14, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      // Right arm meditative, connect from right side of chest
      ctx.beginPath();
      ctx.moveTo(centerX + 8, baseY - 10);
      ctx.lineTo(centerX + 16, baseY + 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX + 16, baseY + 12, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  } else if (pose === 'downHeavy') {
    // Both arms straight down (slam down)
    ctx.beginPath();
    ctx.moveTo(centerX - 8, baseY - 10);
    ctx.lineTo(centerX - 10, baseY + 38);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + 8, baseY - 10);
    ctx.lineTo(centerX + 10, baseY + 38);
    ctx.stroke();
    // Hands (cartoonish, round)
    ctx.beginPath();
    ctx.arc(centerX - 10, baseY + 38, 3, 0, Math.PI * 2);
    ctx.arc(centerX + 10, baseY + 38, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    // Default meditative arms, connect from sides of chest to hands
    ctx.beginPath();
    ctx.moveTo(centerX - 8, baseY - 10);
    ctx.lineTo(centerX - 16, baseY + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + 8, baseY - 10);
    ctx.lineTo(centerX + 16, baseY + 12);
    ctx.stroke();
    // Hands (cartoonish, round)
    ctx.beginPath();
    ctx.arc(centerX - 16, baseY + 12, 3, 0, Math.PI * 2);
    ctx.arc(centerX + 16, baseY + 12, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
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
// --- Patch drawKaonAttackPose to use new arm poses and pass facing ---
function drawKaonAttackPose(ctx, player, bobOffset) {
  const { activeMove, attackHitbox, attackHitbox2, facing, isGrounded } = player;
  if (!activeMove) return;
  let orbTargets = Array(player.orbs.length).fill(null);
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2 - 32;
  // --- Custom all-orb light attacks ---
  if (activeMove.type === 'light') {
    // Animate only the first orb for light attacks
    const orb = player.orbs[0];
    const t = Math.min((player.attackFrame || 0) / (activeMove.duration || 20), 1); // 0 to 1
    let orbPath = { x: orb.x, y: orb.y };
    if (activeMove.name === 'Orb Jab') {
      // Neutral: straight out, then return
      const dist = 60;
      const dir = facing > 0 ? 1 : -1;
      if (t < 0.5) {
        orbPath.x = centerX + dir * dist * (t / 0.5);
        orbPath.y = centerY;
      } else {
        orbPath.x = centerX + dir * dist * (1 - (t - 0.5) / 0.5);
        orbPath.y = centerY;
      }
    } else if (activeMove.name === 'Ki Orb') {
      // Side: dash with Kaon, S-curve: start in front, dip very low (almost floor), then curve up
      const dashDist = 40;
      const curveDist = 60;
      const dir = facing > 0 ? 1 : -1;
      const startX = centerX + dir * 18; // Start just in front of Kaon
      const startY = centerY;
      const endX = centerX + dir * (dashDist + curveDist);
      const endY = centerY - 10; // End just slightly above start
      // Control points for S-curve (very low dip)
      const cp1X = centerX + dir * (dashDist * 0.7); // More forward
      const cp1Y = centerY + 120; // Dip very low, almost floor
      const cp2X = centerX + dir * (dashDist + curveDist * 0.7);
      const cp2Y = centerY - 20; // Shallower curve up
      // Cubic Bezier interpolation
      orbPath.x = Math.pow(1 - t, 3) * startX + 3 * Math.pow(1 - t, 2) * t * cp1X + 3 * (1 - t) * t * t * cp2X + Math.pow(t, 3) * endX;
      orbPath.y = Math.pow(1 - t, 3) * startY + 3 * Math.pow(1 - t, 2) * t * cp1Y + 3 * (1 - t) * t * t * cp2Y + Math.pow(t, 3) * endY;
    } else if (activeMove.name === 'Orb Pop') {
      // Up: curve from left to right above Kaon
      const arcRadius = 48;
      const arcT = t * Math.PI;
      orbPath.x = centerX - arcRadius * Math.cos(arcT);
      orbPath.y = centerY - 32 - arcRadius * Math.sin(arcT);
    } else if (activeMove.name === 'Pulse Sweep') {
      if (isGrounded) {
        // Down (grounded): roll like a bowling ball
        const rollDist = 80;
        const dir = facing > 0 ? 1 : -1;
        orbPath.x = centerX + dir * rollDist * t;
        orbPath.y = centerY + 32 + 12 * Math.sin(Math.PI * 2 * t);
      } else {
        // Down (air): drop to bottom left, curve to other side
        const dropRadius = 48;
        const dropT = t * Math.PI;
        orbPath.x = centerX - dropRadius * Math.cos(dropT);
        orbPath.y = centerY + dropRadius * Math.sin(dropT);
      }
    }
    // Animate orb to orbPath
    orb.state = 'attacking';
    orb.x = orbPath.x;
    orb.y = orbPath.y;
    // Draw the attacking orb
    ctx.save();
    ctx.shadowColor = '#ffe53b';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffe53b';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.size + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    // Draw the other orbs in idle orbit
    for (let i = 1; i < player.orbs.length; i++) {
      const idleOrb = player.orbs[i];
      ctx.save();
      ctx.shadowColor = '#ffe53b';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffe53b';
      ctx.beginPath();
      ctx.arc(idleOrb.x, idleOrb.y, idleOrb.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    drawKaonBody(ctx, player, bobOffset);
    return;
  }
  if (activeMove.name === 'Big Bang Attack') {
    // All orbs move directly behind the big yellow orb (hidden)
    // Center the big orb at the middle of the attack hitbox (symmetrical for both facings)
    const bbX = attackHitbox.x + attackHitbox.width / 2;
    const bbY = attackHitbox.y + attackHitbox.height / 2;
    orbTargets = orbTargets.map(() => ({ x: bbX, y: bbY }));
    setOrbsState(player, 'attacking', orbTargets);
    // Do NOT draw the orbs (they are hidden behind the big orb)
    // Draw only one big yellow orb, always centered
    ctx.save();
    ctx.shadowColor = '#ffe53b';
    ctx.shadowBlur = 36;
    ctx.fillStyle = '#ffe53b';
    ctx.beginPath();
    ctx.arc(bbX, bbY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    // Draw the body in front of the orb, with side heavy pose and correct facing
    drawKaonBody(ctx, player, bobOffset, 'sideHeavy', facing);
    return;
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
    // Draw orbs first, then body with down heavy pose
    drawOrbs(ctx, player, bobOffset);
    drawKaonBody(ctx, player, bobOffset, 'downHeavy');
    return;
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
  const { attackHitbox, attackHitbox2, activeMove, attackType, chargeLevel, characterName } = player;
  if (!attackHitbox || !activeMove) return;
  // For Kaon's light attacks, do not draw any extra visuals (handled in drawKaonAttackPose)
  if (characterName === 'Kaon' && activeMove.type === 'light') {
    return;
  }
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