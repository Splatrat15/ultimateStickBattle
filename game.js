import { Player } from './modules/player.js';
import { characters } from './modules/characters.js';
import { CPU } from './modules/cpu.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameStarted = false;
let frameCount = 0;
let lastResetFrame = 0;
const RESET_COOLDOWN = 30; // Frames to wait between resets

// Blast zone constants (areas outside screen where players die)
const BLAST_ZONE_LEFT = -100;   // 100px left of screen
const BLAST_ZONE_RIGHT = 100;   // 100px right of screen  
const BLAST_ZONE_TOP = -100;    // 100px above screen
const BLAST_ZONE_BOTTOM = 100;  // 100px below screen

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

// CPU instances (will be created if needed)
let cpu1 = null;
let cpu2 = null;

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

function resetKeys() {
  for (const key in keys) {
    if (Object.hasOwnProperty.call(keys, key)) {
      keys[key] = false;
    }
  }
  console.log('Input keys have been reset.');
}

function setupPlayersOnPlatform() {
  // Use setInitialPosition to place players without triggering invincibility
  player1.setInitialPosition(platform.x + 50, platform.y - player1.height);
  player2.setInitialPosition(platform.x + platform.width - 110, platform.y - player2.height);
  console.log('Players have been set up on the platform.');
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Platform: centered, 60% width, 40px tall, 1/3 from top
  platform.width = Math.max(300, canvas.width * 0.6);
  platform.height = 32;
  platform.x = (canvas.width - platform.width) / 2;
  platform.y = canvas.height * 0.6;
}

function drawStage() {
  // Clear canvas
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw platform
  ctx.fillStyle = '#888';
  ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  
  // Draw players
  [player1, player2].forEach((player, index) => {
    // Determine player color based on CPU status
    let playerColor = player.color;
    if ((index === 0 && window.player1IsCPU) || (index === 1 && window.player2IsCPU)) {
      playerColor = '#808080'; // Grey for CPU players
    }
    
    // Draw player (blink if respawn invincibility is active)
    if (!player.isBlinking) {
      ctx.fillStyle = playerColor;
      ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Draw shield effect if shielding
    if (player.isShielding) {
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; // Cyan shield outline
      ctx.lineWidth = 4;
      ctx.strokeRect(player.x - 2, player.y - 2, player.width + 4, player.height + 4);
      
      // Draw shield energy bar
      const shieldBarWidth = 60;
      const shieldBarHeight = 8;
      const shieldBarX = player.x;
      const shieldBarY = player.y - 15;
      
      // Background bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(shieldBarX, shieldBarY, shieldBarWidth, shieldBarHeight);
      
      // Shield energy bar
      const shieldPercentage = player.shieldDuration / player.maxShieldDuration;
      ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
      ctx.fillRect(shieldBarX, shieldBarY, shieldBarWidth * shieldPercentage, shieldBarHeight);
    }
    
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
  const player1Name = window.player1IsCPU ? 
    (window.selectedCharacter1 || 'Player 1') + ' (CPU)' : 
    (window.selectedCharacter1 || 'Player 1');
  ctx.fillText(player1Name, 20, 40);
  ctx.textAlign = 'right';
  const player2Name = window.player2IsCPU ? 
    (window.selectedCharacter2 || 'Player 2') + ' (CPU)' : 
    (window.selectedCharacter2 || 'Player 2');
  ctx.fillText(player2Name, canvas.width - 20, 40);

  // Draw damage percentages and scores
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(player1.damage + '%', 20, 75);
  ctx.fillText('Score: ' + player1.score, 20, 110);
  ctx.textAlign = 'right';
  ctx.fillText(player2.damage + '%', canvas.width - 20, 75);
  ctx.fillText('Score: ' + player2.score, canvas.width - 20, 110);
}

function resetGame() {
  console.log('=== GAME RESET ===');
  
  // Reset game state
  gameStarted = false;
  frameCount = 0;
  lastResetFrame = 0;
  
  // Fully reset player objects to their initial state
  player1.fullReset();
  player2.fullReset();
  
  // Reset input state
  resetKeys();
  
  // Reset CPU instances
  cpu1 = null;
  cpu2 = null;
  
  // Hide canvas and show character menu
  const canvas = document.getElementById('gameCanvas');
  const menu = document.getElementById('characterMenu');
  canvas.style.display = 'none';
  menu.style.display = 'flex';
  
  // Reset player selection state
  window.selectedCharacter1 = null;
  window.selectedCharacter2 = null;
  
  // Reset choice text
  const player1Choice = document.getElementById('player1Choice');
  const player2Choice = document.getElementById('player2Choice');
  const startButton = document.getElementById('startButton');
  if (player1Choice) player1Choice.style.display = 'block';
  if (player2Choice) player2Choice.style.display = 'none';
  if (startButton) startButton.style.display = 'none';
  
  // Reset character selection state by dispatching a custom event
  // This will trigger the characterMenu.js to reset its internal state
  window.dispatchEvent(new CustomEvent('gameReset'));
  
  console.log('Game reset complete - returning to character menu');
}

function update() {
  frameCount++;
  
  if (!gameStarted) {
    requestAnimationFrame(update);
    return;
  }

  // Check for win condition
  const winScore = window.winScore || 5; // Default to 5 if not set
  if (player1.score >= winScore || player2.score >= winScore) {
    const winner = player1.score >= winScore ? player1 : player2;
    const winnerName = winner === player1 ? 
      (window.player1IsCPU ? 'CPU' : 'Player 1') : 
      (window.player2IsCPU ? 'CPU' : 'Player 2');
    const winnerCharacter = winner === player1 ? 
      window.selectedCharacter1 : window.selectedCharacter2;
    
    console.log(`=== GAME OVER ===`);
    console.log(`Winner: ${winnerName} (${winnerCharacter})`);
    console.log(`Final Score - Player 1: ${player1.score}, Player 2: ${player2.score}`);
    
    // Show winner announcement
    alert(`${winnerName} (${winnerCharacter}) wins! Final Score - Player 1: ${player1.score}, Player 2: ${player2.score}`);
    
    // Reset game and return to character menu
    resetGame();
    requestAnimationFrame(update); // Keep the game loop alive in an idle state
    return;
  }

  // Debug logging for CPU status
  if (frameCount % 60 === 0) { // Log every 60 frames (once per second)
    console.log('=== GAME LOOP DEBUG ===');
    console.log('Frame:', frameCount);
    console.log('Player 1 CPU:', window.player1IsCPU, 'CPU1 instance:', !!cpu1);
    console.log('Player 2 CPU:', window.player2IsCPU, 'CPU2 instance:', !!cpu2);
    console.log('========================');
  }

  // Handle Player 1 movement (WASD) - Blue cube
  if (!window.player1IsCPU) {
    // Human player - handle input
    if (keys.a) player1.move(-1);
    if (keys.d) player1.move(1);
    if (keys.w) player1.jump();
  } else {
    // CPU player - update AI
    if (cpu1) {
      cpu1.update();
      cpu1.handleEmergency();
    } else {
      console.log('CPU1 is null!');
    }
  }

  // Handle Player 2 movement (Arrow keys) - Red cube
  if (!window.player2IsCPU) {
    // Human player - handle input
    if (keys.ArrowLeft) player2.move(-1);
    if (keys.ArrowRight) player2.move(1);
    if (keys.ArrowUp) player2.jump();
  } else {
    // CPU player - update AI
    if (cpu2) {
      cpu2.update();
      cpu2.handleEmergency();
    } else {
      console.log('CPU2 is null!');
    }
  }

  // Update players
  player1.update([platform], player2);
  player2.update([platform], player1);

  // Check for attacks
  if (player1.checkAttackHit(player2)) {
    const damage = player1.attackType === 'heavy' ? 5 : 2;
    player2.takeDamage(damage, player1);
  }
  if (player2.checkAttackHit(player1)) {
    const damage = player2.attackType === 'heavy' ? 5 : 2;
    player1.takeDamage(damage, player2);
  }

  // Check if players hit the blast zones (die when outside screen boundaries)
  if (frameCount - lastResetFrame > RESET_COOLDOWN) {
    // Check if player1 is outside any blast zone
    if (player1.x + player1.width < BLAST_ZONE_LEFT || 
        player1.x > canvas.width + BLAST_ZONE_RIGHT ||
        player1.y + player1.height < BLAST_ZONE_TOP ||
        player1.y > canvas.height + BLAST_ZONE_BOTTOM) {
      player1.resetPosition(platform.x + 50, platform.y - player1.height);
      player1.damage = 0; // Reset damage
      player2.score++;
      lastResetFrame = frameCount;
    }
    
    // Check if player2 is outside any blast zone
    if (player2.x + player2.width < BLAST_ZONE_LEFT || 
        player2.x > canvas.width + BLAST_ZONE_RIGHT ||
        player2.y + player2.height < BLAST_ZONE_TOP ||
        player2.y > canvas.height + BLAST_ZONE_BOTTOM) {
      player2.resetPosition(platform.x + platform.width - 110, platform.y - player2.height);
      player2.damage = 0; // Reset damage
      player1.score++;
      lastResetFrame = frameCount;
    }
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
  // Attack controls - only for human players
  if (!window.player1IsCPU) {
    if (e.key === 'f') player1.attack('heavy'); // Player 1 (blue) heavy attack with F
    if (e.key === 'g') player1.attack('light'); // Player 1 (blue) light attack with G
  }
  if (!window.player2IsCPU) {
    if (e.key === 'l') player2.attack('heavy'); // Player 2 (red) heavy attack with L
    if (e.key === 'k') player2.attack('light'); // Player 2 (red) light attack with K
  }
  
  // Shield controls - only for human players
  if (!window.player1IsCPU) {
    if (e.key === 'e' || e.key === 'E') player1.activateShield(); // Player 1 (blue) shield with E
  }
  if (!window.player2IsCPU) {
    if (e.key === 'o' || e.key === 'O') player2.activateShield(); // Player 2 (red) shield with O
  }
});

window.addEventListener('keyup', (e) => {
  if (!gameStarted) return;
  if (e.key in keys) {
    keys[e.key] = false;
    // Reset jump key state when key is released
    if (e.key === 'w') player1.isJumpKeyPressed = false;
    if (e.key === 'ArrowUp') player2.isJumpKeyPressed = false;
  }
  
  // Shield deactivation controls - only for human players
  if (!window.player1IsCPU) {
    if (e.key === 'e' || e.key === 'E') player1.deactivateShield(); // Player 1 (blue) deactivate shield
  }
  if (!window.player2IsCPU) {
    if (e.key === 'o' || e.key === 'O') player2.deactivateShield(); // Player 2 (red) deactivate shield
  }
});

// Initialize game
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
setupPlayersOnPlatform(); // Set initial positions on first load

window.addEventListener('startGame', (e) => {
  const { character1, character2, player1IsCPU, player2IsCPU, winScore } = e.detail;
  
  // Store settings
  window.selectedCharacter1 = character1;
  window.selectedCharacter2 = character2;
  window.player1IsCPU = player1IsCPU;
  window.player2IsCPU = player2IsCPU;
  window.winScore = winScore;

  gameStarted = true;
  
  console.log('Game starting...');
  console.log('Player 1:', character1, 'CPU:', player1IsCPU);
  console.log('Player 2:', character2, 'CPU:', player2IsCPU);
  console.log('Win Score:', winScore);
  
  // Create CPU instances if needed
  if (player1IsCPU) {
    cpu1 = new CPU(player1, player2, platform);
    console.log('CPU 1 created successfully');
  }
  if (player2IsCPU) {
    cpu2 = new CPU(player2, player1, platform);
    console.log('CPU 2 created successfully');
  }
  
  // Mark that the game has started for both players
  player1.setGameStarted(true);
  player2.setGameStarted(true);
  
  // Show canvas and resize
  canvas.style.display = 'block';
  resizeCanvas();
  
  // Set up players on the platform for the new game
  setupPlayersOnPlatform();
  
  console.log('Game started with CPUs:', { cpu1: !!cpu1, cpu2: !!cpu2 });
});

// Start game loop
update();
