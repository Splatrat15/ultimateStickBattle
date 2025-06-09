const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const borderWidth = 8; // matches CSS border
let cubeSize = 60; // will be set responsively

// Movement and physics constants
const moveSpeed = 8;
const friction = 0.85;
const gravity = 1.2;
const jumpStrength = 22;

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
    activeHitbox: null
  };
}

let cube1;
let cube2;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cubeSize = Math.min(100, canvas.width * 0.15, canvas.height * 0.15);
  cube1 = createPlayer({ x: canvas.width / 2 - cubeSize * 1.5, y: canvas.height - borderWidth - cubeSize, color: '#2196f3', facing: 1 });
  cube2 = createPlayer({ x: canvas.width / 2 + cubeSize * 0.5, y: canvas.height - borderWidth - cubeSize, color: '#e53935', facing: -1 });
  drawStage();
}

function updateCube(cube) {
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

  const groundY = canvas.height - borderWidth - cubeSize;
  if (cube.y >= groundY) {
    cube.y = groundY;
    cube.vy = 0;
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
  cube.activeHitbox = { x, y, size, color, facing: cube.facing };
  setTimeout(() => { cube.activeHitbox = null; }, 200);
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
  [cube1, cube2].forEach(cube => {
    ctx.fillStyle = cube.color;
    ctx.fillRect(cube.x, cube.y, cubeSize, cubeSize);
    if (cube.activeHitbox) {
      drawHitbox(ctx, cube.activeHitbox);
    }
  });
}

function update() {
  updateCube(cube1);
  updateCube(cube2);
  resolveCubeCollision(cube1, cube2);
  drawStage();
  requestAnimationFrame(update);
}

window.addEventListener('keydown', (e) => {
  // Blue cube (WASD)
  if (e.key === 'a' || e.key === 'A') cube1.moveLeft = true;
  if (e.key === 'd' || e.key === 'D') cube1.moveRight = true;
  if ((e.key === 'w' || e.key === 'W') && cube1.isOnGround) {
    cube1.vy = -jumpStrength;
    cube1.isOnGround = false;
  }
  // Red cube (Arrows)
  if (e.key === 'ArrowLeft') cube2.moveLeft = true;
  if (e.key === 'ArrowRight') cube2.moveRight = true;
  if (e.key === 'ArrowUp' && cube2.isOnGround) {
    cube2.vy = -jumpStrength;
    cube2.isOnGround = false;
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
