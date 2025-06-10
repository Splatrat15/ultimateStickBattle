const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const borderWidth = 8; // matches CSS border
let cubeSize = 60; // will be set responsively

// Platform properties
let platform = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};

// Movement and physics constants
const moveSpeed = 8;
const friction = 0.85;
const gravity = 0.2;
const jumpStrength = 10;

// Player factory
function createPlayer({ x, y, color, facing }) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    color,
    moveLeft: false,
    moveRight: false,
    isOnGround: true,
    facing,
    activeHitbox: null,
    jumpCount: 0, // for double jump
    damage: 0, // percentage
    wasHitByAttack: false, // to prevent multiple hits per attack
    score: 0 // player score
  };
}

let cube1;
let cube2;

function resetPlayerToPlatform(cube, side) {
  // side: 'left' or 'right'
  const margin = 20;
  if (side === 'left') {
    cube.x = platform.x + margin;
  } else {
    cube.x = platform.x + platform.width - cubeSize - margin;
  }
  cube.y = platform.y - cubeSize;
  cube.vx = 0;
  cube.vy = 0;
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cubeSize = Math.min(60, canvas.width * 0.15, canvas.height * 0.15);
  // Platform: centered, 60% width, 40px tall, 1/3 from top
  platform.width = Math.max(300, canvas.width * 0.6);
  platform.height = 32;
  platform.x = (canvas.width - platform.width) / 2;
  platform.y = canvas.height * 0.6;
  // Place cubes on platform
  cube1 = createPlayer({ x: platform.x + 20, y: platform.y - cubeSize, color: '#2196f3', facing: 1 });
  cube2 = createPlayer({ x: platform.x + platform.width - cubeSize - 20, y: platform.y - cubeSize, color: '#e53935', facing: -1 });
  drawStage();
}

function updateCube(cube, opponent) {
  // Prevent movement and jumping if attacking, but allow falling
  if (cube.activeHitbox) {
    // Update hitbox position to follow the cube
    const size = cube.activeHitbox.size;
    if (cube.facing === 1) {
      cube.activeHitbox.x = cube.x + cubeSize;
    } else {
      cube.activeHitbox.x = cube.x - size;
    }
    cube.activeHitbox.y = cube.y + cubeSize * 0.2;
    cube.vx = 0;
    // Still apply gravity and vertical movement
    if (!cube.isOnGround) {
      cube.vy += gravity;
      cube.y += cube.vy;
    }
    // Platform collision
    const onPlatform =
      cube.y + cubeSize <= platform.y + platform.height &&
      cube.y + cubeSize + cube.vy >= platform.y &&
      cube.x + cubeSize > platform.x &&
      cube.x < platform.x + platform.width;

    if (onPlatform && cube.vy >= 0) {
      cube.y = platform.y - cubeSize;
      cube.vy = 0;
      if (!cube.isOnGround) cube.jumpCount = 0;
      cube.isOnGround = true;
    } else {
      cube.isOnGround = false;
    }

    cube.x += cube.vx;
    const minX = borderWidth;
    const maxX = canvas.width - borderWidth - cubeSize;
    if (cube.x < minX) {
      cube.x = minX;
      cube.vx = 0;
    }
    if (cube.x > maxX) {
      cube.x = maxX;
      cube.vx = 0;
    }

    // If cube falls below the screen, reset to platform, reset damage, and increment opponent's score
    if (cube.y > canvas.height) {
      if (cube === cube1) {
        resetPlayerToPlatform(cube, 'left');
        cube.damage = 0;
        cube2.score += 1;
      } else {
        resetPlayerToPlatform(cube, 'right');
        cube.damage = 0;
        cube1.score += 1;
      }
    }
    return;
  }
  if (cube.moveLeft) {
    cube.vx = Math.max(cube.vx - 2, -moveSpeed);
    cube.facing = -1;
  } else if (cube.moveRight) {
    cube.vx = Math.min(cube.vx + 2, moveSpeed);
    cube.facing = 1;
  } else cube.vx *= friction;

  if (Math.abs(cube.vx) < 0.5) cube.vx = 0;

  if (!cube.isOnGround) {
    cube.vy += gravity;
    cube.y += cube.vy;
  }

  // Platform collision
  const onPlatform =
    cube.y + cubeSize <= platform.y + platform.height &&
    cube.y + cubeSize + cube.vy >= platform.y &&
    cube.x + cubeSize > platform.x &&
    cube.x < platform.x + platform.width;

  if (onPlatform && cube.vy >= 0) {
    cube.y = platform.y - cubeSize;
    cube.vy = 0;
    if (!cube.isOnGround) cube.jumpCount = 0;
    cube.isOnGround = true;
  } else {
    cube.isOnGround = false;
  }

  cube.x += cube.vx;
  const minX = borderWidth;
  const maxX = canvas.width - borderWidth - cubeSize;
  if (cube.x < minX) {
    cube.x = minX;
    cube.vx = 0;
  }
  if (cube.x > maxX) {
    cube.x = maxX;
    cube.vx = 0;
  }

  // If cube falls below the screen, reset to platform, reset damage, and increment opponent's score
  if (cube.y > canvas.height) {
    if (cube === cube1) {
      resetPlayerToPlatform(cube, 'left');
      cube.damage = 0;
      cube2.score += 1;
    } else {
      resetPlayerToPlatform(cube, 'right');
      cube.damage = 0;
      cube1.score += 1;
    }
  }
}

function checkCubeCollision(c1, c2) {
  return (
    c1.x < c2.x + cubeSize &&
    c1.x + cubeSize > c2.x &&
    c1.y < c2.y + cubeSize &&
    c1.y + cubeSize > c2.y
  );
}

function resolveCubeCollision(c1, c2) {
  if (!checkCubeCollision(c1, c2)) return;
  const overlapLeft = c1.x + cubeSize - c2.x;
  const overlapRight = c2.x + cubeSize - c1.x;
  if (overlapLeft > 0 && c1.x < c2.x) {
    const push = overlapLeft / 2;
    c1.x -= push;
    c2.x += push;
    if (c1.vx > 0) c1.vx = 0;
    if (c2.vx < 0) c2.vx = 0;
  } else if (overlapRight > 0 && c2.x < c1.x) {
    const push = overlapRight / 2;
    c1.x += push;
    c2.x -= push;
    if (c1.vx < 0) c1.vx = 0;
    if (c2.vx > 0) c2.vx = 0;
  }
}

function checkHitAndApplyDamage(attacker, defender, type) {
  if (!attacker.activeHitbox) return;
  // Only allow one hit per attack
  if (defender.wasHitByAttack) return;
  // AABB collision
  const h = attacker.activeHitbox;
  if (
    h.x < defender.x + cubeSize &&
    h.x + h.size > defender.x &&
    h.y < defender.y + cubeSize &&
    h.y + h.size > defender.y
  ) {
    defender.wasHitByAttack = true;
    defender.damage += type === 'light' ? 6 : 15;
    // Knockback calculation
    const baseKnockback = type === 'light' ? 6 : 13;
    const knockbackScale = type === 'light' ? 0.18 : 0.32;
    const totalKnockback = baseKnockback + defender.damage * knockbackScale;
    // Knockback direction based on relative position
    const defenderCenterY = defender.y + cubeSize / 2;
    const hitboxCenterY = h.y + h.size / 2;
    let knockbackX = (attacker.facing === 1 ? 1 : -1) * totalKnockback;
    let knockbackY = 0;
    if (defender.isOnGround && attacker.isOnGround) {
      // Both on ground: mostly horizontal, slight up
      knockbackY = -totalKnockback * 0.18;
    } else if (defenderCenterY < hitboxCenterY - h.size * 0.2) {
      // Defender is above the hitbox: knock up and away
      knockbackY = -totalKnockback * 0.9;
    } else if (defenderCenterY > hitboxCenterY + h.size * 0.2) {
      // Defender is below the hitbox: knock down and away
      knockbackY = totalKnockback * 0.9;
    } else {
      // Side/center: knock slightly up and away
      knockbackY = -totalKnockback * 0.5;
    }
    defender.vx = knockbackX;
    defender.vy = knockbackY;
  }
}

function spawnHitbox(cube, type) {
  // type: 'light' or 'heavy'
  const size = type === 'light' ? cubeSize * 0.4 : cubeSize * 0.7;
  const color = type === 'light' ? 'yellow' : 'red';
  let x;
  if (cube.facing === 1) {
    // Facing right: hitbox to the right of the cube
    x = cube.x + cubeSize;
  } else {
    // Facing left: hitbox flush with the left edge of the cube
    x = cube.x - size;
  }
  const y = cube.y + cubeSize * 0.2;
  cube.activeHitbox = { x, y, size, color, facing: cube.facing, type };
  setTimeout(() => { cube.activeHitbox = null; }, 200);
  // Reset wasHitByAttack for the other player
  if (cube === cube1) cube2.wasHitByAttack = false;
  if (cube === cube2) cube1.wasHitByAttack = false;
}

function drawHitbox(ctx, hitbox) {
  ctx.fillStyle = hitbox.color;
  ctx.fillRect(
    hitbox.x,
    hitbox.y,
    hitbox.size,
    hitbox.size
  );
}

function drawStage() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw platform
  ctx.fillStyle = '#888';
  ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  // Draw cubes
  [cube1, cube2].forEach(cube => {
    ctx.fillStyle = cube.color;
    ctx.fillRect(cube.x, cube.y, cubeSize, cubeSize);
    if (cube.activeHitbox) {
      drawHitbox(ctx, cube.activeHitbox);
    }
  });
  // Draw player labels, percentages, and scores
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.fillText('Player 1', 24, 40);
  ctx.font = 'bold 28px Arial';
  ctx.fillText(cube1.damage + '%', 24, 75);
  ctx.font = 'bold 24px Arial';
  ctx.fillText('Score: ' + cube1.score, 24, 110);
  ctx.textAlign = 'right';
  ctx.font = 'bold 32px Arial';
  ctx.fillText('Player 2', canvas.width - 24, 40);
  ctx.font = 'bold 28px Arial';
  ctx.fillText(cube2.damage + '%', canvas.width - 24, 75);
  ctx.font = 'bold 24px Arial';
  ctx.fillText('Score: ' + cube2.score, canvas.width - 24, 110);
}

function update() {
  updateCube(cube1, cube2);
  updateCube(cube2, cube1);
  resolveCubeCollision(cube1, cube2);
  // Check for attack hits
  checkHitAndApplyDamage(cube1, cube2, cube1.activeHitbox ? cube1.activeHitbox.type : null);
  checkHitAndApplyDamage(cube2, cube1, cube2.activeHitbox ? cube2.activeHitbox.type : null);
  drawStage();
  requestAnimationFrame(update);
}

window.addEventListener('keydown', (e) => {
  // Blue cube (WASD)
  if (!(cube1.activeHitbox)) {
    if (e.key === 'a' || e.key === 'A') cube1.moveLeft = true;
    if (e.key === 'd' || e.key === 'D') cube1.moveRight = true;
    if ((e.key === 'w' || e.key === 'W') && cube1.jumpCount < 2) {
      cube1.vy = -jumpStrength;
      cube1.isOnGround = false;
      cube1.jumpCount++;
    }
  }
  // Red cube (Arrows)
  if (!(cube2.activeHitbox)) {
    if (e.key === 'ArrowLeft') cube2.moveLeft = true;
    if (e.key === 'ArrowRight') cube2.moveRight = true;
    if (e.key === 'ArrowUp' && cube2.jumpCount < 2) {
      cube2.vy = -jumpStrength;
      cube2.isOnGround = false;
      cube2.jumpCount++;
    }
  }
  // Player 1 attacks
  if (e.key === 'q' || e.key === 'Q') spawnHitbox(cube1, 'light');
  if (e.key === 'e' || e.key === 'E') spawnHitbox(cube1, 'heavy');
  // Player 2 attacks
  if (e.key === '.') spawnHitbox(cube2, 'light');
  if (e.key === '/') spawnHitbox(cube2, 'heavy');
});
window.addEventListener('keyup', (e) => {
  // Blue cube (WASD)
  if (e.key === 'a' || e.key === 'A') cube1.moveLeft = false;
  if (e.key === 'd' || e.key === 'D') cube1.moveRight = false;
  // Red cube (Arrows)
  if (e.key === 'ArrowLeft') cube2.moveLeft = false;
  if (e.key === 'ArrowRight') cube2.moveRight = false;
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
update();
