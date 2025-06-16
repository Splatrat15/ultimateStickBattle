import { Player } from './modules/player.js';
import { characters } from './modules/characters.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const debugOverlay = document.getElementById('debugOverlay');

// Debug logging
console.log('Game.js loaded');
console.log('Canvas element:', canvas);
console.log('Canvas context:', ctx);
console.log('Canvas style:', window.getComputedStyle(canvas));

// Game state
let gameStarted = false;
let frameCount = 0;
let lastResetFrame = 0;
const RESET_COOLDOWN = 30; // Frames to wait between resets

// Access selected characters
const player1Character = window.selectedCharacter1 || characters.kaon.name;
const player2Character = window.selectedCharacter2 || characters.rakka.name;

console.log('Player 1 character:', player1Character);
console.log('Player 2 character:', player2Character);

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

console.log('Players initialized:', { player1, player2 });

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

function updateDebugInfo() {
  debugOverlay.innerHTML = `
    Game Started: ${gameStarted}<br>
    Frame: ${frameCount}<br>
    Canvas: ${canvas.width}x${canvas.height}<br>
    Platform: x=${platform.x}, y=${platform.y}, w=${platform.width}, h=${platform.height}<br>
    Player1: x=${Math.round(player1.x)}, y=${Math.round(player1.y)}, vy=${player1.vy.toFixed(2)}, grounded=${player1.isGrounded}<br>
    Player2: x=${Math.round(player2.x)}, y=${Math.round(player2.y)}, vy=${player2.vy.toFixed(2)}, grounded=${player2.isGrounded}<br>
    Scores: P1=${player1.score}, P2=${player2.score}<br>
    Last Reset: ${lastResetFrame}<br>
    Frame Diff: ${frameCount - lastResetFrame}
  `;
}

function resizeCanvas() {
  console.log('Resizing canvas');
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
  
  console.log('Canvas resized:', { width: canvas.width, height: canvas.height });
  console.log('Platform position:', platform);
  console.log('Player positions:', { 
    player1: { x: player1.x, y: player1.y },
    player2: { x: player2.x, y: player2.y }
  });
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
      ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
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
  ctx.fillText(window.selectedCharacter1 || 'Player 1', 24, 40);
  ctx.textAlign = 'right';
  ctx.fillText(window.selectedCharacter2 || 'Player 2', canvas.width - 24, 40);

  // Draw damage percentages and scores
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(player1.damage + '%', 80, 75);
  ctx.fillText('Score: ' + player1.score, 115, 110);
  ctx.textAlign = 'right';
  ctx.fillText(player2.damage + '%', canvas.width - 24, 75);
  ctx.fillText('Score: ' + player2.score, canvas.width - 24, 110);

  // Update debug info
  updateDebugInfo();
}

function update() {
  frameCount++;
  
  if (!gameStarted) {
    requestAnimationFrame(update);
    return;
  }

  // Log physics state every 30 frames
  if (frameCount % 30 === 0) {
    window.debugLog('Physics State', {
      frameCount,
      lastResetFrame,
      frameDiff: frameCount - lastResetFrame,
      player1: {
        x: Math.round(player1.x),
        y: Math.round(player1.y),
        vy: player1.vy.toFixed(2),
        isGrounded: player1.isGrounded,
        lastY: Math.round(player1.lastY)
      },
      player2: {
        x: Math.round(player2.x),
        y: Math.round(player2.y),
        vy: player2.vy.toFixed(2),
        isGrounded: player2.isGrounded,
        lastY: Math.round(player2.lastY)
      },
      platform: {
        x: platform.x,
        y: platform.y,
        width: platform.width,
        height: platform.height
      }
    });
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
    player2.takeDamage(10);
  }
  if (player2.checkAttackHit(player1)) {
    player1.takeDamage(10);
  }

  // Check if players hit the bottom of the screen
  if (player1.y > canvas.height && frameCount - lastResetFrame > RESET_COOLDOWN) {
    window.debugLog('Player 1 hit bottom', { 
      y: Math.round(player1.y), 
      canvasHeight: canvas.height,
      frameCount,
      lastResetFrame,
      frameDiff: frameCount - lastResetFrame
    });
    player1.resetPosition(platform.x + 50, platform.y - player1.height);
    player2.score++;
    lastResetFrame = frameCount;
  }
  
  if (player2.y > canvas.height && frameCount - lastResetFrame > RESET_COOLDOWN) {
    window.debugLog('Player 2 hit bottom', { 
      y: Math.round(player2.y), 
      canvasHeight: canvas.height,
      frameCount,
      lastResetFrame,
      frameDiff: frameCount - lastResetFrame
    });
    player2.resetPosition(platform.x + platform.width - 110, platform.y - player2.height);
    player1.score++;
    lastResetFrame = frameCount;
  }

  // Keep players within platform bounds
  if (player1.x < platform.x) {
    window.debugLog('Player 1 hit left edge', { x: player1.x, platformX: platform.x });
    player1.x = platform.x;
    player1.vx = 0;
  }
  if (player1.x + player1.width > platform.x + platform.width) {
    window.debugLog('Player 1 hit right edge', { 
      x: player1.x + player1.width, 
      platformRight: platform.x + platform.width 
    });
    player1.x = platform.x + platform.width - player1.width;
    player1.vx = 0;
  }
  if (player2.x < platform.x) {
    window.debugLog('Player 2 hit left edge', { x: player2.x, platformX: platform.x });
    player2.x = platform.x;
    player2.vx = 0;
  }
  if (player2.x + player2.width > platform.x + platform.width) {
    window.debugLog('Player 2 hit right edge', { 
      x: player2.x + player2.width, 
      platformRight: platform.x + platform.width 
    });
    player2.x = platform.x + platform.width - player2.width;
    player2.vx = 0;
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
  if (e.key === 'f') player1.attack(); // Player 1 (red) attacks with F
  if (e.key === 'l') player2.attack(); // Player 2 (blue) attacks with L
});

window.addEventListener('keyup', (e) => {
  if (!gameStarted) return;
  if (e.key in keys) {
    keys[e.key] = false;
  }
});

// Initialize game
console.log('Initializing game...');
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Start game when start button is clicked
document.getElementById('startButton').addEventListener('click', () => {
  gameStarted = true;
  console.log('Game started!');
});

// Start game loop
update();
console.log('Game loop initialized');
