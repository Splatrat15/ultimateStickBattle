// characters/Rakka/designRakka.js

// Initialize Rakka's visual state
export function initializeRakka(player) {
  player.shadowAfterimages = [];
  player.demonFangEffects = {
    mistParticles: [],
    chargeAngle: 0,
    originalX: 0,
    thrustDistance: 0
  };
  player.sword = {
    length: 54,
    width: 7,
    color: '#222',
    hiltColor: '#a00',
    sheathColor: '#111',
    offsetX: 18,
    offsetY: 38
  };
  // Slow down animation speed
  player.animation.speed = 8; // Update frame every 8 game frames instead of 4
  player.animation.numFrames = 4; // More frames for smoother animation
}

// Update Rakka's animation state (e.g., afterimages for shadowstep)
export function updateRakka(player) {
  // Shadowstep afterimages for Side Heavy
  if (player.isAttacking && player.activeMove && player.activeMove.name === 'Shadowstep Strike') {
    if (player.shadowAfterimages.length < 6) {
      player.shadowAfterimages.push({
        x: player.x,
        y: player.y,
        alpha: 0.5,
        facing: player.facing
      });
    }
  } else {
    player.shadowAfterimages = [];
  }

  // Update Demon Fang effects
  if (player.isCharging && player.activeMove && player.activeMove.name === 'Demon Fang') {
    // Store original position when starting charge
    if (player.demonFangEffects.originalX === 0) {
      player.demonFangEffects.originalX = player.x;
    }
    
    // Add mist particles during charge
    if (player.demonFangEffects.mistParticles.length < 15) {
      player.demonFangEffects.mistParticles.push({
        x: player.x + (Math.random() - 0.5) * 60,
        y: player.y + Math.random() * 60,
        alpha: 0.6 + Math.random() * 0.4,
        size: 5 + Math.random() * 10,
        speed: Math.random() * 2
      });
    }
  } else if (player.isAttacking && player.activeMove && player.activeMove.name === 'Demon Fang') {
    // During thrust animation
    if (player.demonFangEffects.thrustDistance > 0) {
      player.demonFangEffects.thrustDistance -= 15; // Return to original position
      if (player.demonFangEffects.thrustDistance < 0) {
        player.demonFangEffects.thrustDistance = 0;
      }
    }
  } else {
    // Reset effects when not charging or attacking
    player.demonFangEffects.mistParticles = [];
    player.demonFangEffects.chargeAngle = 0;
    player.demonFangEffects.originalX = 0;
    player.demonFangEffects.thrustDistance = 0;
  }

  // Update mist particles
  player.demonFangEffects.mistParticles.forEach((particle, i) => {
    particle.y -= particle.speed;
    particle.alpha -= 0.02;
    if (particle.alpha <= 0) {
      player.demonFangEffects.mistParticles.splice(i, 1);
    }
  });
}

// Draw Rakka (main function)
export function drawRakka(ctx, player) {
  const { x, y, width, height, facing, color } = player;
  const centerX = x + width / 2;
  const baseY = y + height - 26;

  // Draw shadow afterimages (for shadowstep)
  player.shadowAfterimages.forEach((img, i) => {
    ctx.save();
    ctx.globalAlpha = img.alpha * (1 - i * 0.15);
    drawRakkaBody(ctx, img.x, img.y - 26, width, height, facing, true, color, player);
    ctx.globalAlpha = 1.0;
    ctx.restore();
  });

  // Draw demonic mist particles
  player.demonFangEffects.mistParticles.forEach(particle => {
    ctx.save();
    ctx.globalAlpha = particle.alpha;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
    
    // Add red glow to particles
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#600';
    ctx.fill();
    ctx.restore();
  });

  // Draw shadow/mist trail (simple effect)
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.ellipse(centerX, baseY + 8, 32, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.restore();

  // Draw main body
  drawRakkaBody(ctx, x, y - 26, width, height, facing, false, color, player);
  
  // Draw katana with special handling for Demon Fang
  if (player.isCharging && player.activeMove && player.activeMove.name === 'Demon Fang') {
    drawDemonFangStance(ctx, x, y - 26, width, height, facing, player);
  } else {
    drawRakkaKatana(ctx, x, y - 26, width, height, facing, player.sword);
  }
  
  // Draw hat with 鬼 and ribbon
  drawRakkaHat(ctx, x, y - 26, width, height, facing, player);
  
  // Draw charge indicator if charging
  if (player.isCharging && player.activeMove && player.activeMove.name === 'Demon Fang') {
    drawChargeIndicator(ctx, player);
  }
}

// Draw stick figure body
function drawRakkaBody(ctx, x, y, width, height, facing, isShadow, color, player) {
  const centerX = x + width / 2;
  const baseY = y + height; // Feet at bottom
  ctx.save();
  ctx.strokeStyle = isShadow ? '#222' : color || '#000';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';

  // Check if charging Demon Fang for special stance
  const isChargingDemonFang = player.isCharging && player.activeMove && player.activeMove.name === 'Demon Fang';
  const chargeLevel = player.chargeLevel || 0;

  if (isChargingDemonFang) {
    // Lower stance - body tilted forward
    const leanAngle = 0.3 + (chargeLevel * 0.2); // Lean more as charge increases
    const bodyYOffset = 6; // Move body up to connect with hat and handle

    // --- Draw Rotated Upper Body ---
    ctx.save();
    ctx.translate(0, bodyYOffset); // Raise only the body
    ctx.translate(centerX, baseY - 25);
    ctx.rotate(leanAngle * facing);
    ctx.translate(-centerX, -(baseY - 25));

    // Body - leaning forward
    ctx.beginPath();
    ctx.moveTo(centerX, baseY - 42);
    ctx.lineTo(centerX + (10 * facing), baseY - 10);
    ctx.stroke();

    // Arms in ready position
    ctx.beginPath();
    ctx.moveTo(centerX, baseY - 32);
    ctx.lineTo(centerX - (28 * facing), baseY - 28);
    // Sword arm (extended back, adjusted to meet the new sword angle)
    ctx.moveTo(centerX, baseY - 32);
    ctx.lineTo(centerX + (28 * facing), baseY - 25);
    ctx.stroke();
    
    // Head - slightly lowered
    ctx.beginPath();
    ctx.arc(centerX + (8 * facing), baseY - 48, 14, 0, Math.PI * 2);
    ctx.fillStyle = isShadow ? '#222' : color || '#000';
    ctx.fill();

    ctx.restore(); // Restore from rotation transform

    // --- Draw Legs: L-shaped front leg, steeper/longer back leg, both feet on ground ---
    // Hip position: a bit lower and to the left of the torso
    const hipX = centerX + (2 * facing) - (10 * facing); // 10px left from center, 2px for subtle offset
    const hipY = baseY - 2 + bodyYOffset; // 8px lower than previous

    ctx.beginPath();
    // Front leg (L-shape: bend closer to hip, shin goes farther down)
    const frontKneeX = hipX + 18 * facing;
    const frontKneeY = hipY;
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(frontKneeX, frontKneeY); // Thigh forward (horizontal, shorter)
    ctx.lineTo(frontKneeX, baseY + 22); // Shin farther down, foot on ground

    // Back leg (steeper, longer)
    const backLegLength = 48;
    const backLegAngle = facing > 0 ? Math.PI * 5 / 6 : -Math.PI * 5 / 6; // ~150 deg from horizontal (steep)
    const backFootX = hipX + backLegLength * Math.cos(backLegAngle);
    const backFootY = hipY + backLegLength * Math.sin(backLegAngle);
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(backFootX, backFootY);
    ctx.stroke();

  } else {
    // Normal stance - original code
    // Body
    ctx.beginPath();
    ctx.moveTo(centerX, baseY - 42);
    ctx.lineTo(centerX, baseY);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    // Resting arm (closer to body)
    ctx.moveTo(centerX, baseY - 32);
    ctx.lineTo(centerX - 24 * facing, baseY - 22);
    // Katana-holding arm (reaching lower to handle)
    ctx.moveTo(centerX, baseY - 32);
    ctx.lineTo(centerX + 24 * facing, baseY - 22);
    ctx.stroke();
    
    // Legs with walking animation
    ctx.beginPath();
    if (player.animation.isWalking) {
      const walkCycle = (player.animation.frame / player.animation.numFrames) * Math.PI * 2;
      const legSwing = Math.sin(walkCycle) * 8;
      // Left leg
      ctx.moveTo(centerX, baseY);
      ctx.lineTo(centerX - 12 + legSwing, baseY + 26);
      // Right leg
      ctx.moveTo(centerX, baseY);
      ctx.lineTo(centerX + 12 - legSwing, baseY + 26);
    } else {
      // Standing still
      ctx.moveTo(centerX, baseY);
      ctx.lineTo(centerX - 12, baseY + 26);
      ctx.moveTo(centerX, baseY);
      ctx.lineTo(centerX + 12, baseY + 26);
    }
    ctx.stroke();
    
    // Head
    ctx.beginPath();
    ctx.arc(centerX, baseY - 48, 14, 0, Math.PI * 2);
    ctx.fillStyle = isShadow ? '#222' : color || '#000';
    ctx.fill();
  }
  
  ctx.restore();
}

// Draw katana at waist
function drawRakkaKatana(ctx, x, y, width, height, facing, sword) {
  const centerX = x + width / 2;
  // Raise the katana slightly and move it closer to the body
  const baseY = y + height - 12;
  const sheathOffset = 8 * facing; // Reduced offset to bring katana closer
  ctx.save();
  ctx.translate(centerX + sheathOffset, baseY);
  if (facing < 0) ctx.scale(-1, 1); // Mirror horizontally for left
  ctx.rotate(0.08 - 0.35); // Always angle downward and back
  // Sheath (thinner)
  const sheathWidth = sword.width * 0.6;
  ctx.fillStyle = sword.sheathColor;
  ctx.fillRect(-sword.length * 0.7, -sheathWidth / 2, sword.length, sheathWidth);
  // Sheath outline
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#bbb';
  ctx.strokeRect(-sword.length * 0.7, -sheathWidth / 2, sword.length, sheathWidth);
  // Hilt (handle just past waist, positioned where the hand reaches)
  ctx.fillStyle = sword.hiltColor;
  ctx.fillRect(sword.length * 0.3 - 2, -sheathWidth / 2 - 1, 12, sheathWidth + 2); // Made handle slightly larger
  ctx.restore();
}

// Draw hat with 鬼 and ribbon
function drawRakkaHat(ctx, x, y, width, height, facing, player) {
  const centerX = x + width / 2;
  // Adjust hat position based on charging state
  const isChargingDemonFang = player.isCharging && player.activeMove && player.activeMove.name === 'Demon Fang';
  const chargeLevel = player.chargeLevel || 0;
  
  // Base hat position
  let hatY = y + height - 48 - 12;
  let hatOffsetX = 0;
  
  if (isChargingDemonFang) {
    // Move hat forward during charge to stay on head (increased offset)
    hatOffsetX = (16 + (chargeLevel * 12)) * facing;
    // Add tiny backward offset
    hatOffsetX -= 3 * facing;
    // Adjust Y position slightly to stay with head
    hatY += 8;
  }
  
  ctx.save();
  ctx.translate(centerX + hatOffsetX, hatY);

  // Adjust hat rotation based on charging state
  if (isChargingDemonFang) {
    // Match body's lean angle during charge
    const leanAngle = (0.3 + (chargeLevel * 0.2)) * facing;
    ctx.rotate(leanAngle);
  } else {
    // Normal hat tilt
    ctx.rotate(0.12 * facing);
  }

  // Hat base (smaller)
  ctx.beginPath();
  ctx.moveTo(-22, 10);
  ctx.lineTo(0, -14);
  ctx.lineTo(22, 10);
  ctx.closePath();
  ctx.fillStyle = '#111';
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // 鬼 kanji (slightly larger)
  ctx.save();
  ctx.font = 'bold 15px serif';
  ctx.fillStyle = '#f00';
  ctx.globalAlpha = 0.92;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 5;
  ctx.fillText('鬼', 0, -2);
  ctx.restore();
  
  // Demonic effect: extra glow
  ctx.beginPath();
  ctx.arc(0, -2, 9, 0, Math.PI * 2);
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#f00';
  ctx.fill();
  ctx.globalAlpha = 1.0;
  
  // Ribbon (opposite to facing direction)
  ctx.save();
  ctx.strokeStyle = '#a00';
  ctx.fillStyle = '#a00';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.7;
  const ribbonX = -22 * facing;
  const ribbonY = 8;
  ctx.beginPath();
  ctx.moveTo(ribbonX, ribbonY);
  ctx.lineTo(ribbonX - 10 * facing, ribbonY + 16);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(ribbonX - 10 * facing, ribbonY + 16, 3, 6, Math.PI / 8 * facing, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

// New function for Demon Fang charging stance
function drawDemonFangStance(ctx, x, y, width, height, facing, player) {
  const centerX = x + width / 2;
  const baseY = y + height;
  const chargeLevel = player.chargeLevel || 0;
  
  ctx.save();
  ctx.translate(centerX + (8 * facing), baseY - 12);
  if (facing < 0) ctx.scale(-1, 1);

  // Angle sword based on charge - less steep angle
  const chargeAngle = 0.4 + (chargeLevel * 0.15); // Positive angle to point forward/up
  ctx.rotate(chargeAngle);

  // Draw sword with demonic effect
  const sword = player.sword;
  
  // Demonic aura
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 15 + (chargeLevel * 10);
  
  // Sword blade with increasing glow
  ctx.fillStyle = '#222';
  ctx.fillRect(-sword.length, -sword.width/2, sword.length, sword.width);
  
  // Add red energy along the blade
  const gradient = ctx.createLinearGradient(-sword.length, 0, 0, 0);
  gradient.addColorStop(0, `rgba(255,0,0,${chargeLevel * 0.7})`);
  gradient.addColorStop(1, 'rgba(255,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(-sword.length, -sword.width/2, sword.length, sword.width);
  
  // Hilt
  ctx.shadowBlur = 0;
  ctx.fillStyle = sword.hiltColor;
  ctx.fillRect(0, -sword.width/2 - 1, 12, sword.width + 2);
  
  ctx.restore();
}

// Draw charge indicator
function drawChargeIndicator(ctx, player) {
  const { x, y, width, chargeLevel } = player;
  const barWidth = 60;
  const barHeight = 8;
  const barX = x;
  const barY = y - 42; // Moved up from -30
  
  // Draw background bar
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // Draw charge level with demonic color scheme
  const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth * chargeLevel, barY);
  gradient.addColorStop(0, '#600');
  gradient.addColorStop(1, '#f00');
  ctx.fillStyle = gradient;
  ctx.fillRect(barX, barY, barWidth * chargeLevel, barHeight);
  
  // Add glow effect
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = '#f00';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  
  ctx.restore();
} 