const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const borderWidth = 8; // matches CSS border
let cubeSize = 60; // will be set responsively

// Blue cube (Player 1 - WASD)
let cube1 = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  color: '#2196f3',
  moveLeft: false,
  moveRight: false,
  isOnGround: true
};

// Red cube (Player 2 - Arrows)
let cube2 = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  color: '#e53935',
  moveLeft: false,
  moveRight: false,
  isOnGround: true
};

const moveSpeed = 8; // max velocity in px/frame
const friction = 0.85;
const gravity = 1.2;
const jumpStrength = 22;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cubeSize = Math.min(100, canvas.width * 0.15, canvas.height * 0.15);
  // Blue cube starts left of center, red right of center
  cube1.x = canvas.width / 2 - cubeSize * 1.5;
  cube2.x = canvas.width / 2 + cubeSize * 0.5;
  cube1.y = cube2.y = canvas.height - borderWidth - cubeSize;
  cube1.vx = cube2.vx = 0;
  cube1.vy = cube2.vy = 0;
  cube1.isOnGround = cube2.isOnGround = true;
  drawStage();
}

function drawStage() {
  // Fill background
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw cubes
  [cube1, cube2].forEach(cube => {
    ctx.fillStyle = cube.color;
    ctx.fillRect(cube.x, cube.y, cubeSize, cubeSize);
  });
}

function checkCubeCollision(c1, c2) {
  // Axis-Aligned Bounding Box (AABB) collision
  return (
    c1.x < c2.x + cubeSize &&
    c1.x + cubeSize > c2.x &&
    c1.y < c2.y + cubeSize &&
    c1.y + cubeSize > c2.y
  );
}

function resolveCubeCollision(c1, c2) {
  // Only resolve horizontal overlap (side bumping)
  if (!checkCubeCollision(c1, c2)) return;
  // Find the overlap
  const overlapLeft = c1.x + cubeSize - c2.x;
  const overlapRight = c2.x + cubeSize - c1.x;
  // Push cubes apart only horizontally
  if (overlapLeft > 0 && c1.x < c2.x) {
    // c1 is left of c2
    const push = overlapLeft / 2;
    c1.x -= push;
    c2.x += push;
    // Stop their velocities toward each other
    if (c1.vx > 0) c1.vx = 0;
    if (c2.vx < 0) c2.vx = 0;
  } else if (overlapRight > 0 && c2.x < c1.x) {
    // c2 is left of c1
    const push = overlapRight / 2;
    c1.x += push;
    c2.x -= push;
    if (c1.vx < 0) c1.vx = 0;
    if (c2.vx > 0) c2.vx = 0;
  }
}

function updateCube(cube) {
  // Handle input
  if (cube.moveLeft) cube.vx = Math.max(cube.vx - 2, -moveSpeed);
  else if (cube.moveRight) cube.vx = Math.min(cube.vx + 2, moveSpeed);
  else cube.vx *= friction;

  // Stop tiny velocities
  if (Math.abs(cube.vx) < 0.5) cube.vx = 0;

  // Gravity and jumping
  if (!cube.isOnGround) {
    cube.vy += gravity;
    cube.y += cube.vy;
  }

  // Ground collision
  const groundY = canvas.height - borderWidth - cubeSize;
  if (cube.y >= groundY) {
    cube.y = groundY;
    cube.vy = 0;
    cube.isOnGround = true;
  } else {
    cube.isOnGround = false;
  }

  // Update position X
  cube.x += cube.vx;
  // Clamp so cube stays inside border
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

function update() {
  updateCube(cube1);
  updateCube(cube2);
  // Resolve collision after both cubes move
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
