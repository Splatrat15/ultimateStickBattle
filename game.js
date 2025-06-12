import { spawnHitbox, checkHitAndApplyDamage } from './modules/attacks.js';
import { updateCube, resetPlayerToPlatform } from './modules/movement.js';
import { createPlayer } from './modules/player.js';
import { characters } from './modules/characters.js';
import { resolveCubeCollision } from './modules/collisions.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Access selected characters
const player1Character = window.selectedCharacter1 || characters.kaon.name;
const player2Character = window.selectedCharacter2 || characters.rakka.name;

// Use player1Character and player2Character in your game logic
console.log(`Player 1 selected: ${player1Character}`);
console.log(`Player 2 selected: ${player2Character}`);

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

// Initialize players
let cube1 = createPlayer({ x: 100, y: 100, color: '#2196f3', facing: 1 });
let cube2 = createPlayer({ x: 200, y: 100, color: '#e53935', facing: -1 });

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
  
  // Draw player names
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.fillText(window.selectedCharacter1, 24, 40); // Display Player 1's character name
  ctx.textAlign = 'right';
  ctx.fillText(window.selectedCharacter2, canvas.width - 24, 40); // Display Player 2's character name

  // Draw damage percentages and scores
  ctx.font = 'bold 28px Arial';
  ctx.fillText(cube1.damage + '%', 80, 75); // Adjusted x position for Player 1's damage percentage
  ctx.fillText('Score: ' + cube1.score, 115, 110); // Adjusted x position for Player 1's score
  ctx.textAlign = 'right';
  ctx.fillText(cube2.damage + '%', canvas.width - 24, 75); // Display Player 2's damage percentage
  ctx.fillText('Score: ' + cube2.score, canvas.width - 24, 110); // Display Player 2's score
}

function update() {
  // Move Player 1 (WASD)
  if (cube1.moveLeft) {
    cube1.moveBackward();
  }
  if (cube1.moveRight) {
    cube1.moveForward();
  }

  // Move Player 2 (Arrow keys)
  if (cube2.moveLeft) {
    cube2.moveBackward();
  }
  if (cube2.moveRight) {
    cube2.moveForward();
  }

  // Update positions and check collisions
  resolveCubeCollision(cube1, cube2, cubeSize);
  drawStage();
  requestAnimationFrame(update);
}

window.addEventListener('keydown', (e) => {
  // Player 1 controls (WASD)
  if (e.key === 'a' || e.key === 'A') cube1.moveLeft = true;
  if (e.key === 'd' || e.key === 'D') cube1.moveRight = true;

  // Player 2 controls (Arrow keys)
  if (e.key === 'ArrowLeft') cube2.moveLeft = true;
  if (e.key === 'ArrowRight') cube2.moveRight = true;
});

window.addEventListener('keyup', (e) => {
  // Player 1 controls (WASD)
  if (e.key === 'a' || e.key === 'A') cube1.moveLeft = false;
  if (e.key === 'd' || e.key === 'D') cube1.moveRight = false;

  // Player 2 controls (Arrow keys)
  if (e.key === 'ArrowLeft') cube2.moveLeft = false;
  if (e.key === 'ArrowRight') cube2.moveRight = false;
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
update();
