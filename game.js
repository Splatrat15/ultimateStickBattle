import { Player } from './modules/player.js';
import { characters } from './modules/characters.js';
import { CPU } from './modules/cpu.js';
import { drawKaon } from './characters/Kaon/designKaon.js';
import { drawKaonShield } from './characters/Kaon/movesetKaon.js';
import { drawRakka } from './characters/Rakka/designRakka.js';
import { drawRakkaShield } from './characters/Rakka/designRakka.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameStarted = false;
let frameCount = 0;
let lastResetFrame = 0;
const RESET_COOLDOWN = 30; // Frames to wait between resets

// Pause state
let isPaused = false;

// Timer and lives state
let gameTimer = 300; // 5 minutes in seconds (default)
let gameLives = 3; // Default lives
let player1Lives = 3;
let player2Lives = 3;
let lastTimerUpdate = 0; // Track last timer update in milliseconds
let lastFrameTime = 0; // Track last frame time for FPS calculation

// FPS calculation variables
let fpsSamples = []; // Array to store FPS samples
let fpsUpdateTime = 0; // Track when to update FPS display
const FPS_SAMPLE_COUNT = 30; // Number of samples to average over
const FPS_UPDATE_INTERVAL = 500; // Update FPS display every 500ms

// Blast zone constants (areas outside screen where players die)
const BLAST_ZONE_LEFT = -100;   // 100px left of screen
const BLAST_ZONE_RIGHT = 100;   // 100px right of screen  
const BLAST_ZONE_TOP = -400;    // 400px above screen (increased to prevent self-kills)
const BLAST_ZONE_BOTTOM = 100;  // 100px below screen

// Access selected characters
const player1CharacterName = window.selectedCharacter1 || 'kaon';
const player2CharacterName = window.selectedCharacter2 || 'rakka';
const player1CharacterData = characters[player1CharacterName.toLowerCase()];
const player2CharacterData = characters[player2CharacterName.toLowerCase()];

// Platform properties
const platform = {
  x: 0,
  y: 0,
  width: 0,
  height: 32
};

// Initialize players with explicit positions
let player1 = new Player(100, 100, '#2196f3', 1, player1CharacterData);  // Blue for player1
let player2 = new Player(400, 100, '#e53935', -1, player2CharacterData); // Red for player2

// CPU instances (will be created if needed)
let cpu1 = null;
let cpu2 = null;

// Input states
const keys = {
  // Player 1 (WASD) - Blue cube
  w: false,
  a: false,
  s: false,
  d: false,
  // Player 2 (Arrow keys) - Red cube
  ArrowUp: false,
  ArrowLeft: false,
  ArrowDown: false,
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
      if (player.characterName === 'Kaon') {
        drawKaon(ctx, player);
      } else if (player.characterName === 'Rakka') {
        drawRakka(ctx, player);
      } else {
        ctx.fillStyle = playerColor;
        ctx.fillRect(player.x, player.y, player.width, player.height);
      }
    }
    
    // Draw shield effect if shielding
    if (player.isShielding) {
      if (player.characterName === 'Kaon') {
        drawKaonShield(ctx, player);
      } else if (player.characterName === 'Rakka') {
        drawRakkaShield(ctx, player);
      } else {
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; // Cyan shield outline
        ctx.lineWidth = 4;
        ctx.strokeRect(player.x - 2, player.y - 2, player.width + 4, player.height + 4);
        // Draw shield energy bar
        const shieldBarWidth = 60;
        const shieldBarHeight = 8;
        const shieldBarX = player.x;
        const shieldBarY = player.y - 15;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(shieldBarX, shieldBarY, shieldBarWidth, shieldBarHeight);
        const shieldPercentage = player.shieldDuration / player.maxShieldDuration;
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.fillRect(shieldBarX, shieldBarY, shieldBarWidth * shieldPercentage, shieldBarHeight);
      }
    }
    
    // Draw attack hitbox if attacking
    if (player.isAttacking && player.attackHitbox) {
      // Kaon's drawing function handles his own attack visuals.
      // We only need to draw hitboxes for other characters.
      if (player.characterName !== 'Kaon') {
        // Don't draw red box for Shadow Sneak - the sword swing is the visual
        if (player.activeMove && player.activeMove.name === 'Shadow Sneak') {
          // Skip drawing hitbox for Shadow Sneak
        } else if (player.activeMove && player.activeMove.name && player.activeMove.name.startsWith('Quick Draw')) {
          // Skip drawing hitbox for Rakka's jab (Quick Draw)
        } else if (player.activeMove && player.activeMove.name === 'Shadow Slice') {
          // Skip drawing hitbox for Shadow Slice - the sword swing is the visual
        } else if (player.activeMove && player.activeMove.name === 'Rising Cut') {
          // Skip drawing hitbox for Rising Cut - the sword swing is the visual
        } else if (player.activeMove && player.activeMove.name === 'Ground Poke') {
          // Skip drawing hitbox for Ground Poke - the sword swing is the visual
        } else {
          // Set color based on attack type
          ctx.fillStyle = player.attackType === 'heavy' ? 
            'rgba(255, 0, 0, 0.3)' : // Red for heavy attacks
            'rgba(255, 255, 0, 0.3)'; // Yellow for light attacks
          // Draw primary hitbox
          ctx.fillRect(
            player.attackHitbox.x,
            player.attackHitbox.y,
            player.attackHitbox.width,
            player.attackHitbox.height
          );
          // Draw secondary hitbox if it exists (for Dual Blast)
          if (player.attackHitbox2) {
            ctx.fillRect(
              player.attackHitbox2.x,
              player.attackHitbox2.y,
              player.attackHitbox2.width,
              player.attackHitbox2.height
            );
          }
        }
      }
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

  // Draw damage percentages and lives
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(player1.damage + '%', 20, 75);
  ctx.fillText('Lives: ' + player1Lives, 20, 110);
  ctx.textAlign = 'right';
  ctx.fillText(player2.damage + '%', canvas.width - 20, 75);
  ctx.fillText('Lives: ' + player2Lives, canvas.width - 20, 110);

  // Draw timer in middle top
  let timerText;
  if (gameTimer > 420) {
    // Beyond 7:00 (infinity), show infinity symbol
    timerText = '∞';
  } else {
    const minutes = Math.floor(gameTimer / 60);
    const seconds = gameTimer % 60;
    timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = gameTimer <= 30 && gameTimer <= 420 ? '#ff4444' : '#ffffff'; // Red when 30 seconds or less (but not infinity)
  ctx.fillText(timerText, canvas.width / 2, 50);

  // Draw FPS if enabled
  if (window.showFPS) {
    const currentTime = Date.now();
    
    // Calculate instantaneous FPS
    if (lastFrameTime > 0) {
      const frameTime = currentTime - lastFrameTime;
      const instantFPS = frameTime > 0 ? Math.round(1000 / frameTime) : 0;
      
      // Add to samples array
      fpsSamples.push(instantFPS);
      
      // Keep only the last N samples
      if (fpsSamples.length > FPS_SAMPLE_COUNT) {
        fpsSamples.shift();
      }
    }
    
    lastFrameTime = currentTime;
    
    // Update FPS display periodically
    if (currentTime - fpsUpdateTime >= FPS_UPDATE_INTERVAL) {
      fpsUpdateTime = currentTime;
    }
    
    // Calculate average FPS
    let averageFPS = 0;
    if (fpsSamples.length > 0) {
      const sum = fpsSamples.reduce((acc, fps) => acc + fps, 0);
      averageFPS = Math.round(sum / fpsSamples.length);
    }
    
    // Draw FPS box in bottom left
    const fpsBoxWidth = 80;
    const fpsBoxHeight = 30;
    const fpsBoxX = 10;
    const fpsBoxY = canvas.height - fpsBoxHeight - 10;
    
    // Draw background box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(fpsBoxX, fpsBoxY, fpsBoxWidth, fpsBoxHeight);
    
    // Draw border
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(fpsBoxX, fpsBoxY, fpsBoxWidth, fpsBoxHeight);
    
    // Draw FPS text
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ff00';
    ctx.fillText(`${averageFPS} FPS`, fpsBoxX + fpsBoxWidth / 2, fpsBoxY + fpsBoxHeight / 2 + 5);
  }
}

function resetGame() {
  console.log('=== GAME RESET ===');
  
  // Reset game state
  gameStarted = false;
  window.gameStarted = false; // Reset for pause menu
  isPaused = false; // Reset pause state
  frameCount = 0;
  lastResetFrame = 0;
  
  // Reset timer and lives
  gameTimer = window.gameTimer || 300;
  gameLives = window.gameLives || 3;
  player1Lives = gameLives;
  player2Lives = gameLives;
  lastTimerUpdate = 0; // Reset timer to initialize on first frame
  
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
  
  // Reset pause menu state
  if (window.pauseMenu && typeof window.pauseMenu.resetPauseState === 'function') {
    window.pauseMenu.resetPauseState();
  }
  
  console.log('Game reset complete - returning to character menu');
}

function update() {
  frameCount++;
  
  if (!gameStarted) {
    requestAnimationFrame(update);
    return;
  }

  // Check if game is paused
  if (isPaused) {
    // Still draw the stage but don't update game logic
    drawStage();
    requestAnimationFrame(update);
    return;
  }

  // Update timer using real-time (independent of FPS)
  const currentTime = Date.now();
  if (lastTimerUpdate === 0) {
    lastTimerUpdate = currentTime; // Initialize on first frame
  }
  
  // Check if 1000ms (1 second) has passed
  if (currentTime - lastTimerUpdate >= 1000 && gameTimer > 0 && gameTimer <= 420) {
    gameTimer--;
    lastTimerUpdate = currentTime;
  }

  // Check for win conditions
  if ((gameTimer <= 0 && gameTimer <= 420) || player1Lives <= 0 || player2Lives <= 0) {
    let winner = null;
    let winnerName = '';
    let winnerCharacter = '';
    
    if (gameTimer <= 0 && gameTimer <= 420) {
      // Time ran out (but not infinity) - winner is player with most lives, then most damage
      if (player1Lives > player2Lives) {
        winner = player1;
        winnerName = window.player1IsCPU ? 'CPU' : 'Player 1';
        winnerCharacter = window.selectedCharacter1;
      } else if (player2Lives > player1Lives) {
        winner = player2;
        winnerName = window.player2IsCPU ? 'CPU' : 'Player 2';
        winnerCharacter = window.selectedCharacter2;
      } else {
        // Same lives - check damage (lower damage wins)
        if (player1.damage < player2.damage) {
          winner = player1;
          winnerName = window.player1IsCPU ? 'CPU' : 'Player 1';
          winnerCharacter = window.selectedCharacter1;
        } else if (player2.damage < player1.damage) {
          winner = player2;
          winnerName = window.player2IsCPU ? 'CPU' : 'Player 2';
          winnerCharacter = window.selectedCharacter2;
        } else {
          // Tie
          winnerName = 'Tie';
          winnerCharacter = 'Both Players';
        }
      }
    } else if (player1Lives <= 0) {
      winner = player2;
      winnerName = window.player2IsCPU ? 'CPU' : 'Player 2';
      winnerCharacter = window.selectedCharacter2;
    } else if (player2Lives <= 0) {
      winner = player1;
      winnerName = window.player1IsCPU ? 'CPU' : 'Player 1';
      winnerCharacter = window.selectedCharacter1;
    }
    
    console.log(`=== GAME OVER ===`);
    if (winnerName === 'Tie') {
      console.log(`Result: Tie!`);
      alert(`Game Over - Tie! Final Score - Player 1: ${player1Lives} lives, ${player1.damage}% damage | Player 2: ${player2Lives} lives, ${player2.damage}% damage`);
    } else {
      console.log(`Winner: ${winnerName} (${winnerCharacter})`);
      alert(`${winnerName} (${winnerCharacter}) wins! Final Score - Player 1: ${player1Lives} lives, ${player1.damage}% damage | Player 2: ${player2Lives} lives, ${player2.damage}% damage`);
    }
    
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
    // Fast fall
    if (keys.s && !player1.isGrounded) {
      player1.vy = Math.min(player1.vy + 0.8, 15); // Increase fall speed
    }
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
    // Fast fall
    if (keys.ArrowDown && !player2.isGrounded) {
      player2.vy = Math.min(player2.vy + 0.8, 15); // Increase fall speed
    }
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
    const damage = player1.activeMove ? player1.activeMove.damage : (player1.attackType === 'heavy' ? 5 : 2);
    player2.takeDamage(damage, player1);
  }
  if (player2.checkAttackHit(player1)) {
    const damage = player2.activeMove ? player2.activeMove.damage : (player2.attackType === 'heavy' ? 5 : 2);
    player1.takeDamage(damage, player2);
  }

  // Check if players hit the blast zones (die when outside screen boundaries)
  if (frameCount - lastResetFrame > RESET_COOLDOWN) {
    // Check if player1 is outside any blast zone
    if (player1.x + player1.width < BLAST_ZONE_LEFT || 
        player1.x > canvas.width + BLAST_ZONE_RIGHT ||
        player1.y + player1.height < BLAST_ZONE_TOP ||
        player1.y > canvas.height + BLAST_ZONE_BOTTOM) {
      player1Lives--;
      player1.resetPosition(platform.x + 50, platform.y - player1.height);
      player1.damage = 0; // Reset damage
      lastResetFrame = frameCount;
    }
    
    // Check if player2 is outside any blast zone
    if (player2.x + player2.width < BLAST_ZONE_LEFT || 
        player2.x > canvas.width + BLAST_ZONE_RIGHT ||
        player2.y + player2.height < BLAST_ZONE_TOP ||
        player2.y > canvas.height + BLAST_ZONE_BOTTOM) {
      player2Lives--;
      player2.resetPosition(platform.x + platform.width - 110, platform.y - player2.height);
      player2.damage = 0; // Reset damage
      lastResetFrame = frameCount;
    }
  }

  drawStage();
  requestAnimationFrame(update);
}

// Input handling
window.addEventListener('keydown', (e) => {
  if (!gameStarted) return;
  
  // Don't process game input if paused
  if (isPaused) return;
  
  if (e.key in keys) {
    keys[e.key] = true;
  }
  // Attack controls - only for human players
  if (!window.player1IsCPU) {
    if (e.key === 'g') { // Light Attack
      let direction = 'neutral';
      if (keys.a || keys.d) direction = 'side';
      else if (keys.w) direction = 'up';
      else if (keys.s) direction = 'down';
      player1.attack(direction, 'light');
    }
    if (e.key === 'f') { // Use directional heavy attacks or start neutral charging
      let direction = 'neutral';
      if (keys.a || keys.d) direction = 'side';
      else if (keys.w) direction = 'up';
      else if (keys.s) direction = 'down';
      
      // Use instant attacks for directional heavy
      if (direction !== 'neutral') {
        player1.attack(direction, 'heavy');
      } else {
        // For neutral heavy, start charging
        player1.startCharge();
      }
    }
  }
  if (!window.player2IsCPU) {
    if (e.key === 'k') { // Light Attack
      let direction = 'neutral';
      if (keys.ArrowLeft || keys.ArrowRight) direction = 'side';
      else if (keys.ArrowUp) direction = 'up';
      else if (keys.ArrowDown) direction = 'down';
      player2.attack(direction, 'light');
    }
    if (e.key === 'l') { // Use directional heavy attacks or start neutral charging
      let direction = 'neutral';
      if (keys.ArrowLeft || keys.ArrowRight) direction = 'side';
      else if (keys.ArrowUp) direction = 'up';
      else if (keys.ArrowDown) direction = 'down';
      
      // Use instant attacks for directional heavy
      if (direction !== 'neutral') {
        player2.attack(direction, 'heavy');
      } else {
        // For neutral heavy, start charging
        player2.startCharge();
      }
    }
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
  // --- Reset jab press state for Rakka jab combo ---
  if (!window.player1IsCPU && e.key === 'g' && player1.onJabKeyUp) player1.onJabKeyUp();
  if (!window.player2IsCPU && e.key === 'k' && player2.onJabKeyUp) player2.onJabKeyUp();
  
  // Release charged attacks
  if (!window.player1IsCPU) {
    if (e.key === 'f') {
      player1.releaseCharge();
    }
  }
  if (!window.player2IsCPU) {
    if (e.key === 'l') {
      player2.releaseCharge();
    }
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
  window.gameStarted = true; // Expose to window for pause menu
  
  // Initialize timer and lives from settings
  gameTimer = window.gameTimer || 300;
  gameLives = window.gameLives || 3;
  player1Lives = gameLives;
  player2Lives = gameLives;
  lastTimerUpdate = 0; // Reset timer to initialize on first frame
  
  console.log('Game starting...');
  console.log('Player 1:', character1, 'CPU:', player1IsCPU);
  console.log('Player 2:', character2, 'CPU:', player2IsCPU);
  console.log('Timer:', gameTimer, 'seconds, Lives:', gameLives);
  
  // Re-initialize players with the correct character data
  player1 = new Player(100, 100, '#2196f3', 1, characters[character1.toLowerCase()]);
  player2 = new Player(400, 100, '#e53935', -1, characters[character2.toLowerCase()]);
  
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

// Pause menu event listeners
window.addEventListener('gamePaused', () => {
  console.log('Game paused');
  isPaused = true;
});

window.addEventListener('gameResumed', () => {
  console.log('Game resumed');
  isPaused = false;
});
