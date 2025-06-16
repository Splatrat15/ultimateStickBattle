import { Player } from './modules/player.js';
import { characters } from './modules/characters.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameStarted = false;
let frameCount = 0;
let lastResetFrame = 0;
const RESET_COOLDOWN = 30; // Frames to wait between resets

// Access selected characters
const player1Character = window.selectedCharacter1 || characters.kaon.name;
const player2Character = window.selectedCharacter2 || characters.rakka.name;

// Platform properties
const platform = {
  x: 0,
  y: 0,
  width: 0,
  height: 32
};

// Initialize players with explicit positions
let player1 = new Player(100, 100, '#2196f3', 1);  // Blue for player1
let player2 = new Player(400, 100, '#e53935', -1); // Red for player2

// Input states
const keys = {
  // Player 1 (WASD) - Blue cube
  w: false,
  a: false,
  d: false,
  // Player 2 (Arrow keys) - Red cube
  ArrowUp: false,
  ArrowLeft: false,
  ArrowRight: false
};

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Platform: centered, 60% width, 40px tall, 1/3 from top
  platform.width = Math.max(300, canvas.width * 0.6);
  platform.height = 32;
  platform.x = (canvas.width - platform.width) / 2;
  platform.y = canvas.height * 0.6;

  // Set player positions on opposite sides of the platform
  player1.resetPosition(platform.x + 50, platform.y - player1.height);
  player2.resetPosition(platform.x + platform.width - 110, platform.y - player2.height);
}

function drawStage() {
  // Clear canvas
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw platform
  ctx.fillStyle = '#888';
  ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  
  // Draw players
  [player1, player2].forEach(player => {
    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw attack hitbox if attacking
    if (player.isAttacking && player.attackHitbox) {
      // Set color based on attack type
      ctx.fillStyle = player.attackType === 'heavy' ? 
        'rgba(255, 0, 0, 0.3)' : // Red for heavy attacks
        'rgba(255, 255, 0, 0.3)'; // Yellow for light attacks
      ctx.fillRect(
        player.attackHitbox.x,
        player.attackHitbox.y,
        player.attackHitbox.width,
        player.attackHitbox.height
      );
    }
  });
  
  // Draw player names
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.fillText(window.selectedCharacter1 || 'Player 1', 20, 40);
  ctx.textAlign = 'right';
  ctx.fillText(window.selectedCharacter2 || 'Player 2', canvas.width - 20, 40);

  // Draw damage percentages and scores
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(player1.damage + '%', 20, 75);
  ctx.fillText('Score: ' + player1.score, 20, 110);
  ctx.textAlign = 'right';
  ctx.fillText(player2.damage + '%', canvas.width - 20, 75);
  ctx.fillText('Score: ' + player2.score, canvas.width - 20, 110);
}

function update() {
  frameCount++;
  
  if (!gameStarted) {
    requestAnimationFrame(update);
    return;
  }

  // Handle Player 1 movement (WASD) - Blue cube
  if (keys.a) player1.move(-1);
  if (keys.d) player1.move(1);
  if (keys.w) player1.jump();

  // Handle Player 2 movement (Arrow keys) - Red cube
  if (keys.ArrowLeft) player2.move(-1);
  if (keys.ArrowRight) player2.move(1);
  if (keys.ArrowUp) player2.jump();

  // Update players
  player1.update([platform], player2);
  player2.update([platform], player1);

  // Check for attacks
  if (player1.checkAttackHit(player2)) {
    const damage = player1.attackType === 'heavy' ? 5 : 2;
    player2.takeDamage(damage);
  }
  if (player2.checkAttackHit(player1)) {
    const damage = player2.attackType === 'heavy' ? 5 : 2;
    player1.takeDamage(damage);
  }

  // Check if players hit the bottom of the screen
  if (player1.y > canvas.height && frameCount - lastResetFrame > RESET_COOLDOWN) {
    player1.resetPosition(platform.x + 50, platform.y - player1.height);
    player1.damage = 0; // Reset damage
    player2.score++;
    lastResetFrame = frameCount;
  }
  
  if (player2.y > canvas.height && frameCount - lastResetFrame > RESET_COOLDOWN) {
    player2.resetPosition(platform.x + platform.width - 110, platform.y - player2.height);
    player2.damage = 0; // Reset damage
    player1.score++;
    lastResetFrame = frameCount;
  }

  drawStage();
  requestAnimationFrame(update);
}

// Input handling
window.addEventListener('keydown', (e) => {
  if (!gameStarted) return;
  if (e.key in keys) {
    keys[e.key] = true;
  }
  // Attack controls
  if (e.key === 'f') player1.attack('heavy'); // Player 1 (blue) heavy attack with F
  if (e.key === 'g') player1.attack('light'); // Player 1 (blue) light attack with G
  if (e.key === 'l') player2.attack('heavy'); // Player 2 (red) heavy attack with L
  if (e.key === 'k') player2.attack('light'); // Player 2 (red) light attack with K
});

window.addEventListener('keyup', (e) => {
  if (!gameStarted) return;
  if (e.key in keys) {
    keys[e.key] = false;
  }
});

// Initialize game
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Start game when start button is clicked
document.getElementById('startButton').addEventListener('click', () => {
  gameStarted = true;
});

// Start game loop
update();
