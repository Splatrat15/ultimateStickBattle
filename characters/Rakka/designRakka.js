// characters/Rakka/designRakka.js

// Initialize Rakka's visual state
export function initializeRakka(player) {
  player.shadowAfterimages = [];
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
  // Draw katana at waist (lowered)
  drawRakkaKatana(ctx, x, y - 26, width, height, facing, player.sword);
  // Draw hat with 鬼 and ribbon
  drawRakkaHat(ctx, x, y - 26, width, height, facing);
}

// Draw stick figure body
function drawRakkaBody(ctx, x, y, width, height, facing, isShadow, color, player) {
  const centerX = x + width / 2;
  const baseY = y + height; // Feet at bottom
  ctx.save();
  ctx.strokeStyle = isShadow ? '#222' : color || '#000';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  // Body
  ctx.beginPath();
  ctx.moveTo(centerX, baseY - 42);
  ctx.lineTo(centerX, baseY);
  ctx.stroke();
  // Arms - One grabbing katana handle, one resting
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
    // Walking animation - slower and more subtle
    const walkCycle = (player.animation.frame / player.animation.numFrames) * Math.PI * 2;
    const legSwing = Math.sin(walkCycle) * 8; // Reduced swing amplitude from 12 to 8
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
function drawRakkaHat(ctx, x, y, width, height, facing) {
  const centerX = x + width / 2;
  // Raise the hat slightly, decrease size, and tilt forward (down)
  const hatY = y + height - 48 - 16;
  ctx.save();
  ctx.translate(centerX, hatY);
  ctx.rotate(0.12 * facing); // Tilt forward (down) for right, up for left
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