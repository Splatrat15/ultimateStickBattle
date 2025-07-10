// characters/Kaon/designKaon.js

// Helper function to get scaled size
function getScaledSize(baseSize) {
  if (typeof window !== 'undefined' && window.getScaledSize) {
    return window.getScaledSize(baseSize);
  }
  return baseSize;
}

// Helper function to get scaled text size
function getScaledTextSize(baseSize) {
  if (typeof window !== 'undefined' && window.getScaledTextSize) {
    return window.getScaledTextSize(baseSize);
  }
  return baseSize;
}

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
  const centerY = player.y + player.height / 2 - player.width * 0.5; // Scale with character size
  const numOrbs = 3;
  const radius = player.width * 0.4; // Scale with character size
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
      distance: player.width * 0.4, // Scale with character size
      size: player.width * 0.13, // Scale with character size
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
  const centerY = player.y + player.height / 2 - player.width * 0.5; // Scale with character size
  
  // Handle charging state first
  if (player.isCharging) {
    player.orbs.forEach((orb, i) => {
      orb.angle += 0.08 + player.chargeLevel * 0.2;
      orb.distance = player.width * 0.33 + player.chargeLevel * player.width * 0.5; // Scale with character size
      orb.x = centerX + Math.cos(orb.angle) * orb.distance;
      orb.y = centerY + Math.sin(orb.angle) * orb.distance;
    });
    return; // Skip other orb updates when charging
  }
  
  // If Kaon is attacking with a light move, do not update the first orb (handled in drawKaonAttackPose)
  const skipFirst = player.isAttacking && player.activeMove && player.activeMove.type === 'light';
  player.orbs.forEach((orb, i) => {
    if (skipFirst && i === 0) return;
    if (orb.state === 'idle') {
      orb.angle += 0.03;
      orb.distance = player.width * 0.4 + Math.sin(Date.now() * 0.003 + i) * player.width * 0.025; // Scale with character size
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
      const idleX = centerX + Math.cos(orb.angle) * player.width * 0.4; // Scale with character size
      const idleY = centerY + Math.sin(orb.angle) * player.width * 0.4; // Scale with character size
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
  // Use orb size proportional to player width
  const orbRadius = player.width * 0.13;
  player.orbs.forEach((orb, i) => {
    ctx.save();
    ctx.shadowColor = '#ffe53b';
    ctx.shadowBlur = orbRadius * 1.5;
    ctx.fillStyle = '#ffe53b';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orbRadius + Math.sin(Date.now() * 0.005 + i) * (orbRadius * 0.07), 0, Math.PI * 2);
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
  // Proportional sizes
  const auraRadius = width * 0.53;
  const headRadius = width * 0.22;
  const bodyLineWidth = width * 0.1;
  const armLineWidth = width * 0.08;
  const legLineWidth = width * 0.08;
  const handRadius = width * 0.05;
  const footRadius = width * 0.05;
  const armLength = width * 0.53;
  const medArmLength = width * 0.27;
  const legLength = width * 0.53;
  const crossLegLength = width * 0.33;
  // Meditative floating pose, smaller, even lower
  const baseY = y + height + bobOffset - height * 0.7;
  const centerX = x + width / 2;
  // Draw faint aura/circle behind character
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(centerX, baseY - headRadius * 0.8, auraRadius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.restore();
  // Head
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = headRadius * 0.5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, baseY - headRadius * 2, headRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  // Main vertical body line (neck to belly)
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = bodyLineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(centerX, baseY - headRadius * 1.1); // Just below head
  ctx.lineTo(centerX, baseY + headRadius * 0.6);  // Top of belly
  ctx.stroke();
  // Torso (Buddha-like: rounded belly, chest curve, hint of shoulders)
  // Chest/shoulders
  ctx.beginPath();
  ctx.arc(centerX, baseY - headRadius * 0.7, width * 0.27, Math.PI * 0.95, Math.PI * 0.05, false);
  ctx.stroke();
  // Belly/abdomen
  ctx.beginPath();
  ctx.arc(centerX, baseY + headRadius * 0.6, width * 0.17, Math.PI * 1.1, Math.PI * -0.1, false);
  ctx.stroke();
  // Neck line
  ctx.beginPath();
  ctx.arc(centerX, baseY - headRadius * 1.4, width * 0.1, Math.PI, 2 * Math.PI, false);
  ctx.stroke();
  // Arms (pose-dependent, always 2 arms, no thickness change)
  ctx.lineWidth = armLineWidth;
  if (pose === 'sideHeavy') {
    if (facing > 0) {
      // Right arm straight right, left arm meditative
      ctx.beginPath();
      ctx.moveTo(centerX + medArmLength * 0.3, baseY - headRadius * 0.7);
      ctx.lineTo(centerX + armLength, baseY - headRadius * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX + armLength, baseY - headRadius * 0.9, handRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      // Left arm meditative
      ctx.beginPath();
      ctx.moveTo(centerX - medArmLength * 0.3, baseY - headRadius * 0.7);
      ctx.lineTo(centerX - medArmLength, baseY + medArmLength * 0.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX - medArmLength, baseY + medArmLength * 0.45, handRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      // Left arm straight left, right arm meditative
      ctx.beginPath();
      ctx.moveTo(centerX - medArmLength * 0.3, baseY - headRadius * 0.7);
      ctx.lineTo(centerX - armLength, baseY - headRadius * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX - armLength, baseY - headRadius * 0.9, handRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      // Right arm meditative
      ctx.beginPath();
      ctx.moveTo(centerX + medArmLength * 0.3, baseY - headRadius * 0.7);
      ctx.lineTo(centerX + medArmLength, baseY + medArmLength * 0.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX + medArmLength, baseY + medArmLength * 0.45, handRadius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  } else if (pose === 'downHeavy') {
    // Both arms straight down (slam down)
    ctx.beginPath();
    ctx.moveTo(centerX - medArmLength * 0.3, baseY - headRadius * 0.7);
    ctx.lineTo(centerX - medArmLength * 0.35, baseY + armLength);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + medArmLength * 0.3, baseY - headRadius * 0.7);
    ctx.lineTo(centerX + medArmLength * 0.35, baseY + armLength);
    ctx.stroke();
    // Hands
    ctx.beginPath();
    ctx.arc(centerX - medArmLength * 0.35, baseY + armLength, handRadius, 0, Math.PI * 2);
    ctx.arc(centerX + medArmLength * 0.35, baseY + armLength, handRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    // Default meditative arms
    ctx.beginPath();
    ctx.moveTo(centerX - medArmLength * 0.3, baseY - headRadius * 0.7);
    ctx.lineTo(centerX - medArmLength, baseY + medArmLength * 0.45);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + medArmLength * 0.3, baseY - headRadius * 0.7);
    ctx.lineTo(centerX + medArmLength, baseY + medArmLength * 0.45);
    ctx.stroke();
    // Hands
    ctx.beginPath();
    ctx.arc(centerX - medArmLength, baseY + medArmLength * 0.45, handRadius, 0, Math.PI * 2);
    ctx.arc(centerX + medArmLength, baseY + medArmLength * 0.45, handRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  // Legs (crossed, thinner, cartoonish)
  ctx.lineWidth = legLineWidth;
  ctx.beginPath();
  ctx.moveTo(centerX, baseY + headRadius * 0.3);
  ctx.lineTo(centerX - crossLegLength, baseY + legLength);
  ctx.lineTo(centerX + crossLegLength, baseY + legLength);
  ctx.lineTo(centerX, baseY + headRadius * 0.3);
  ctx.stroke();
  // Feet
  ctx.beginPath();
  ctx.arc(centerX - crossLegLength, baseY + legLength, footRadius, 0, Math.PI * 2);
  ctx.arc(centerX + crossLegLength, baseY + legLength, footRadius, 0, Math.PI * 2);
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
  const centerY = player.y + player.height / 2 - player.width * 0.5; // Scale with character size
  const charSize = player.width; // Use character width for scaling
  
  // --- Custom all-orb light attacks ---
  if (activeMove.type === 'light') {
    // Animate only the first orb for light attacks
    const orb = player.orbs[0];
    const t = Math.min((player.attackFrame || 0) / (activeMove.duration || 20), 1); // 0 to 1
    let orbPath = { x: orb.x, y: orb.y };
    if (activeMove.name === 'Orb Jab') {
      // Neutral: straight out, then return
      const dist = charSize * 1.0; // Scale with character
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
      const dashDist = charSize * 0.67; // Scale with character
      const curveDist = charSize * 1.0; // Scale with character
      const dir = facing > 0 ? 1 : -1;
      const startX = centerX + dir * charSize * 0.3; // Scale with character
      const startY = centerY;
      const endX = centerX + dir * (dashDist + curveDist);
      const endY = centerY - charSize * 0.17; // Scale with character
      // Control points for S-curve (very low dip)
      const cp1X = centerX + dir * (dashDist * 0.7); // More forward
      const cp1Y = centerY + charSize * 2.0; // Scale with character
      const cp2X = centerX + dir * (dashDist + curveDist * 0.7);
      const cp2Y = centerY - charSize * 0.33; // Scale with character
      // Cubic Bezier interpolation
      orbPath.x = Math.pow(1 - t, 3) * startX + 3 * Math.pow(1 - t, 2) * t * cp1X + 3 * (1 - t) * t * t * cp2X + Math.pow(t, 3) * endX;
      orbPath.y = Math.pow(1 - t, 3) * startY + 3 * Math.pow(1 - t, 2) * t * cp1Y + 3 * (1 - t) * t * t * cp2Y + Math.pow(t, 3) * endY;
    } else if (activeMove.name === 'Orb Pop') {
      // Up: curve from left to right above Kaon
      const arcRadius = charSize * 0.8; // Scale with character
      const arcT = t * Math.PI;
      orbPath.x = centerX - arcRadius * Math.cos(arcT);
      orbPath.y = centerY - charSize * 0.53 - arcRadius * Math.sin(arcT); // Scale with character
    } else if (activeMove.name === 'Pulse Sweep') {
      if (isGrounded) {
        // Down (grounded): roll like a bowling ball
        const rollDist = charSize * 1.33; // Scale with character
        const dir = facing > 0 ? 1 : -1;
        orbPath.x = centerX + dir * rollDist * t;
        orbPath.y = centerY + charSize * 0.53 + charSize * 0.2 * Math.sin(Math.PI * 2 * t); // Scale with character
      } else {
        // Down (air): drop to bottom left, curve to other side
        const dropRadius = charSize * 0.8; // Scale with character
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
    ctx.shadowBlur = charSize * 0.3; // Scale shadow with character
    ctx.fillStyle = '#ffe53b';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.size + charSize * 0.03, 0, Math.PI * 2); // Scale with character
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    // Draw the other orbs in idle orbit
    for (let i = 1; i < player.orbs.length; i++) {
      const idleOrb = player.orbs[i];
      ctx.save();
      ctx.shadowColor = '#ffe53b';
      ctx.shadowBlur = charSize * 0.2; // Scale shadow with character
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
    // Draw only one big yellow orb, always centered - scale with player size
    ctx.save();
    ctx.shadowColor = '#ffe53b';
    ctx.shadowBlur = getScaledSize(36); // Scaled from 36
    ctx.fillStyle = '#ffe53b';
    ctx.beginPath();
    // Scale the orb size relative to player size instead of fixed pixels
    const orbSize = Math.max(player.width * 0.4, getScaledSize(12)); // At least 12px scaled, but proportional to player
    ctx.arc(bbX, bbY, orbSize, 0, Math.PI * 2);
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
        x: beamX + Math.cos(angle) * getScaledSize(12), // Scaled from 12
        y: beamY + Math.sin(angle) * getScaledSize(12) // Scaled from 12
      };
    });
    setOrbsState(player, 'attacking', orbTargets);
  } else if (activeMove.name === 'Gravity Spike') {
    // Orbs align vertically and pulse
    const spikeX = attackHitbox.x + attackHitbox.width / 2;
    const spikeY = attackHitbox.y;
    orbTargets = orbTargets.map((_, i) => ({ x: spikeX, y: spikeY - i * getScaledSize(16) })); // Scaled from 16
    setOrbsState(player, 'attacking', orbTargets);
  } else if (activeMove.name === 'Dual Blast') {
    // Orbs split: 2 orbs go to sides, rest stay
    // Calculate side positions based on facing direction
    const sideDistance = getScaledSize(60); // Distance from center
    const leftX = centerX - sideDistance;
    const rightX = centerX + sideDistance;
    const y = attackHitbox.y + attackHitbox.height / 2;
    
    orbTargets = [
      { x: leftX, y: y },  // Left orb
      { x: rightX, y: y }, // Right orb
      ...Array(player.orbs.length - 2).fill({ x: centerX, y: centerY }) // Rest stay in center
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
      x: centerX + dir * (getScaledSize(18) + i * getScaledSize(8)), // Scaled from 18 and 8
      y: centerY + Math.sin(Date.now() * 0.01 + i) * getScaledSize(6) // Scaled from 6
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
    ctx.shadowBlur = getScaledSize(30); // Scaled from 30
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
    ctx.shadowBlur = getScaledSize(20); // Scaled from 20
    ctx.fillStyle = '#6cf';
    ctx.beginPath();
    ctx.arc(orbX, orbY, attackHitbox.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (activeMove.name === 'Gravity Spike') {
    // Vertical energy spike
    ctx.save();
    ctx.shadowColor = '#ffe53b';
    ctx.shadowBlur = getScaledSize(20); // Scaled from 20
    ctx.fillStyle = 'rgba(255,229,59,0.7)';
    ctx.fillRect(attackHitbox.x, attackHitbox.y, attackHitbox.width, attackHitbox.height);
    ctx.restore();
    // Impact ring
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,0,0.7)';
    ctx.lineWidth = getScaledSize(4); // Scaled from 4
    ctx.beginPath();
    ctx.arc(attackHitbox.x + attackHitbox.width / 2, attackHitbox.y + attackHitbox.height, getScaledSize(18), 0, Math.PI * 2); // Scaled from 18
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
    ctx.lineWidth = getScaledSize(3); // Scaled from 3
    ctx.beginPath();
    ctx.arc(attackHitbox.x + attackHitbox.width / 2, attackHitbox.y + attackHitbox.height / 2, getScaledSize(12), 0, Math.PI * 2); // Scaled from 12
    ctx.stroke();
    if (attackHitbox2) {
      ctx.beginPath();
      ctx.arc(attackHitbox2.x + attackHitbox2.width / 2, attackHitbox2.y + attackHitbox2.height / 2, getScaledSize(12), 0, Math.PI * 2); // Scaled from 12
      ctx.stroke();
    }
    ctx.restore();
  } else {
    // Light attacks: quick orb smears
    ctx.save();
    ctx.strokeStyle = '#6cf';
    ctx.lineWidth = getScaledSize(8); // Scaled from 8
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
  // Orbs spiral tightly around head/torso and glow
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2 - getScaledSize(32); // Same as idle position (around head/torso)
  player.orbs.forEach((orb, i) => {
    orb.angle += 0.08 + player.chargeLevel * 0.2;
    orb.distance = getScaledSize(20) + player.chargeLevel * getScaledSize(30); // Scaled from 20 and 30
    orb.x = centerX + Math.cos(orb.angle) * orb.distance;
    orb.y = centerY + Math.sin(orb.angle) * orb.distance;
  });
}

function drawChargeIndicator(ctx, player) {
  const { x, y, width, chargeLevel } = player;
  // Scale charge bar relative to character size
  const barWidth = width * 1.2; // 120% of character width
  const barHeight = width * 0.15; // 15% of character width
  const barX = x - (barWidth - width) / 2; // Center the bar on the character
  const barY = y - width * 0.5; // 50% of character width above
  
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  const chargeColor = chargeLevel < 0.5 ? '#ff6b6b' : chargeLevel < 0.8 ? '#ffd93d' : '#6bcf7f';
  ctx.fillStyle = chargeColor;
  ctx.fillRect(barX, barY, barWidth * chargeLevel, barHeight);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = Math.max(1, width * 0.03); // Scale line width with character
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  ctx.restore();
}

// --- Main draw: orbs first, then body ---
export function drawKaon(ctx, player) {
  const bobOffset = Math.sin(Date.now() * 0.002) * player.width * 0.07; // Scale with character
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