import { Player } from './modules/player.js';
import { characters } from './modules/characters.js';
import { CPU } from './modules/cpu.js';
import { drawKaon } from './characters/Kaon/designKaon.js';
import { drawKaonShield } from './characters/Kaon/movesetKaon.js';
import { drawRakka } from './characters/Rakka/designRakka.js';
import { drawRakkaShield } from './characters/Rakka/designRakka.js';
import { audioManager } from './modules/audio.js';

const canvas = document.getElementById('gameCanvas');
window.gameCanvas = canvas;
const ctx = canvas.getContext('2d');

// Game state
let gameStarted = false;
let frameCount = 0;
let lastResetFrame = 0;
const RESET_COOLDOWN = 30; // Frames to wait between resets

// Pause state
let isPaused = false;

// Victory screen state
let showVictoryScreen = false;
let victoryText = '';
let victoryColor = '#ffffff';
let victoryStartTime = 0;
const VICTORY_DISPLAY_TIME = 10000; // 3 seconds to display victory screen

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

// --- PERCENTAGE-BASED SCALING CONSTANTS ---
const PLATFORM_WIDTH_PERCENT = 0.62; // 80% of window width
const CHARACTER_SIZE_PERCENT = 0.045; // 8% of platform width
const PLAYER_NAME_TEXT_PERCENT = 0.04; // 3% of platform width
const DAMAGE_TEXT_PERCENT = 0.025; // 2.5% of platform width
const TIMER_TEXT_PERCENT = 0.04; // 3% of platform width
const LIVES_TEXT_PERCENT = 0.03; // 2% of platform width

// --- RESPONSIVE SCALING SYSTEM ---
// Base dimensions for a 1920x1080 screen (reference size)
const BASE_SCREEN_WIDTH = 1920;
const BASE_SCREEN_HEIGHT = 1080;
const BASE_SCREEN_DIAGONAL = Math.sqrt(BASE_SCREEN_WIDTH * BASE_SCREEN_WIDTH + BASE_SCREEN_HEIGHT * BASE_SCREEN_HEIGHT);

// Scaling factors
let screenScale = 1.0;
let textScale = 1.0;
let uiScale = 1.0;

// Base sizes (for 1920x1080 reference)
const BASE_PLATFORM_WIDTH = 1200; // Increased width for wider stage
const BASE_PLATFORM_HEIGHT = 48;
const BASE_PLATFORM_Y_POSITION = 0.6; // 60% from top
const BASE_PLAYER_SIZE = 60;
const BASE_PLAYER_SPACING = 120; // Distance from platform edges
const BASE_TEXT_SIZE = {
  playerNames: 32,
  damage: 28,
  timer: 36,
  fps: 16
};
const BASE_UI_SPACING = {
  playerNameY: 40,
  damageY: 75,
  livesY: 110,
  timerY: 50,
  sideMargin: 20
};

// Blast zone constants (areas outside screen where players die)
const BLAST_ZONE_LEFT = -100;   // 100px left of screen
const BLAST_ZONE_RIGHT = 100;   // 100px right of screen  
const BLAST_ZONE_TOP = -400;    // 400px above screen (increased to prevent self-kills)
const BLAST_ZONE_BOTTOM = 100;  // 100px below screen

// Platform properties
const platform = {
  x: 0,
  y: 0,
  width: 0,
  height: 32
};

// Platform design constants
const BASE_PLATFORM_THICKNESS = 40; // Thicker platform like Battlefield

// Initialize players with default character data (will be re-initialized when game starts)
let player1 = new Player(100, 100, '#2196f3', 1, characters.kaon, 60);  // Blue for player1
let player2 = new Player(400, 100, '#e53935', -1, characters.rakka, 60); // Red for player2

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

// --- GAMEPAD SUPPORT ---
// Gamepad button mappings (standard mapping):
// 0: A (bottom, A on Xbox, Cross on PS) - JUMP
// 1: B (right, B on Xbox, Circle on PS)
// 2: X (left, X on Xbox, Square on PS) - HEAVY ATTACK
// 3: Y (top, Y on Xbox, Triangle on PS)
// 4: L1, 5: R1, 6: L2 (shield), 7: R2 (light attack), 8: Select, 9: Start
// We'll use:
// 0: A (jump)
// 2: X (heavy attack)
// 6: L2 (shield)
// 7: R2 (light attack)

let prevGamepadStates = [{}, {}]; // For debouncing per player

// Controller active flags
let controllerActiveForPlayer1 = false;
let controllerActiveForPlayer2 = false;

// Debounce state for pause/leave game per player
let lastPauseButtonState = [false, false];
let lastLeaveButtonState = [false, false];

// --- SCALING FUNCTIONS ---
function calculateScreenScale() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return 1.0;
  
  // Use a more balanced scaling approach that considers both width and height
  const currentDiagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
  const baseScale = currentDiagonal / BASE_SCREEN_DIAGONAL;
  
  // Apply a more conservative scaling curve to prevent excessive shrinking
  // Use a square root curve to reduce scaling for smaller screens
  const conservativeScale = Math.sqrt(baseScale);
  
  // Clamp the scale between 0.5 and 2.0 to prevent extreme values
  return Math.max(0.5, Math.min(2.0, conservativeScale));
}

function getStageScaledSize(baseSize) {
  // Scales based on platform width relative to base platform width
  return Math.round(baseSize * (platform.width / BASE_PLATFORM_WIDTH));
}

function updateScaling() {
  screenScale = calculateScreenScale();
  textScale = Math.min(screenScale, 2.0); // Cap text scaling at 2x
  uiScale = Math.min(screenScale, 1.5); // Cap UI scaling at 1.5x
  // Debug logging (can be removed in production)
  if (window.showDebugInfo) {
    console.log('Scaling updated:', {
      screenScale: screenScale.toFixed(2),
      textScale: textScale.toFixed(2),
      uiScale: uiScale.toFixed(2),
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      platformWidth: platform.width
    });
  }
}

function getScaledSize(baseSize) {
  return Math.round(baseSize * screenScale);
}

function getScaledTextSize(baseSize) {
  return Math.round(baseSize * textScale);
}

function getScaledUISize(baseSize) {
  return Math.round(baseSize * uiScale);
}

// Make scaling functions globally available for character files
window.getScaledSize = getScaledSize;
window.getScaledTextSize = getScaledTextSize;
window.getScaledUISize = getScaledUISize;

function getScaledPosition(basePosition, isPercentage = false) {
  if (isPercentage) {
    return basePosition; // Percentages stay the same
  }
  return Math.round(basePosition * screenScale);
}

function resetKeys() {
  for (const key in keys) {
    if (Object.hasOwnProperty.call(keys, key)) {
      keys[key] = false;
    }
  }
  console.log('Input keys have been reset.');
}

function setupPlayersOnPlatform() {
  // Calculate scaled positions
  const scaledPlayerSpacing = getScaledSize(BASE_PLAYER_SPACING);
  const scaledPlayerSize = getScaledSize(BASE_PLAYER_SIZE);
  
  // Position players relative to platform edges
  const player1X = platform.x + scaledPlayerSpacing;
  const player2X = platform.x + platform.width - scaledPlayerSpacing - scaledPlayerSize;
  const playerY = platform.y - scaledPlayerSize;
  
  // Use setInitialPosition to place players without triggering invincibility
  player1.setInitialPosition(player1X, playerY);
  player2.setInitialPosition(player2X, playerY);
  
  // Store initial platform ratios for consistent positioning during resize
  player1._platformRatio = scaledPlayerSpacing / platform.width;
  player2._platformRatio = (platform.width - scaledPlayerSpacing - scaledPlayerSize) / platform.width;
  
  console.log('Players have been set up on the platform.');
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Set platform width and height based on window size
  platform.width = Math.round(window.innerWidth * PLATFORM_WIDTH_PERCENT);
  platform.height = getScaledSize(BASE_PLATFORM_HEIGHT);
  platform.x = (canvas.width - platform.width) / 2;
  platform.y = canvas.height * BASE_PLATFORM_Y_POSITION;

  // Update scaling factors
  updateScaling();

  // If game is running, update player positions to maintain relative positions
  if (gameStarted && player1 && player2) {
    // Store current platform ratios if they don't exist
    if (player1._platformRatio === undefined) {
      player1._platformRatio = ((player1.x + player1.width / 2) - platform.x) / platform.width;
    }
    if (player2._platformRatio === undefined) {
      player2._platformRatio = ((player2.x + player2.width / 2) - platform.x) / platform.width;
    }
    
    // Update player dimensions with better size calculation
    const charSize = Math.round(platform.width * CHARACTER_SIZE_PERCENT);
    const minCharSize = Math.round(getScaledSize(40)); // Minimum character size
    const maxCharSize = Math.round(getScaledSize(80)); // Maximum character size
    const finalCharSize = Math.max(minCharSize, Math.min(maxCharSize, charSize));
    
    player1.width = finalCharSize;
    player1.height = finalCharSize;
    player2.width = finalCharSize;
    player2.height = finalCharSize;
    
    // Restore player positions using their stored ratio
    player1.x = platform.x + player1._platformRatio * platform.width - player1.width / 2;
    player2.x = platform.x + player2._platformRatio * platform.width - player2.width / 2;
    
    // Handle Y positioning
    if (player1.isGrounded) {
      player1.y = platform.y - player1.height;
    }
    if (player2.isGrounded) {
      player2.y = platform.y - player2.height;
    }
    
    // Clamp positions to keep players within platform bounds
    const scaledPlayerSpacing = getScaledSize(BASE_PLAYER_SPACING);
    const minX = platform.x + scaledPlayerSpacing;
    const maxX = platform.x + platform.width - scaledPlayerSpacing - finalCharSize;
    
    player1.x = Math.max(minX, Math.min(maxX, player1.x));
    player2.x = Math.max(minX, Math.min(maxX, player2.x));
    
    // Update ratios after clamping
    player1._platformRatio = ((player1.x + player1.width / 2) - platform.x) / platform.width;
    player2._platformRatio = ((player2.x + player2.width / 2) - platform.x) / platform.width;
  }
}

// Helper functions for percentage-based text sizes
function getPlatformTextSize(percent) {
  return Math.round(platform.width * percent);
}

function drawStage() {
  // Clear canvas with competitive background
  drawCompetitiveBackground();
  
  // Draw platform with Battlefield style
  drawBattlefieldPlatform();
  
  // If victory screen is active and game is started, draw it and return early
  if (showVictoryScreen && gameStarted) {
    drawVictoryScreen();
    return;
  }
  
  // Draw players
  [player1, player2].forEach((player, index) => {
    // Determine player color based on CPU status
    let playerColor = player.color;
    if ((index === 0 && window.player1IsCPU) || (index === 1 && window.player2IsCPU)) {
      playerColor = '#808080'; // Grey for CPU players
      // Update the player's color property to ensure drawing functions use the correct color
      player.color = playerColor;
    } else {
      // Restore original color for human players
      if (index === 0) {
        player.color = '#2196f3'; // Blue for player 1
      } else {
        player.color = '#e53935'; // Red for player 2
      }
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
        const scaledShieldBarWidth = getScaledSize(60);
        const scaledShieldBarHeight = getScaledSize(8);
        const scaledShieldBarX = player.x;
        const scaledShieldBarY = player.y - getScaledSize(15);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(scaledShieldBarX, scaledShieldBarY, scaledShieldBarWidth, scaledShieldBarHeight);
        const shieldPercentage = player.shieldDuration / player.maxShieldDuration;
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.fillRect(scaledShieldBarX, scaledShieldBarY, scaledShieldBarWidth * shieldPercentage, scaledShieldBarHeight);
      }
    }
    
    // Attack lag indicator removed - no more red box with LAG text
    
    // Draw attack hitbox if attacking
    if (player.isAttacking && player.attackHitbox) {
      // Kaon's drawing function handles his own attack visuals.
      // We only need to draw hitboxes for other characters.
      if (player.characterName !== 'Kaon') {
        // Don't draw red box for Shadow Sneak - the sword swing is the visual
        if (player.activeMove && player.activeMove.name === 'Shadow Sneak') {
          // Skip drawing hitbox for Shadow Sneak
        } else if (player.activeMove && player.activeMove.name && (player.activeMove.name.startsWith('Quick Draw') || player.activeMove.name === 'Quick Draw')) {
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
  const playerNameSize = getPlatformTextSize(PLAYER_NAME_TEXT_PERCENT);
  const sideMargin = getPlatformTextSize(0.015); // 1.5% of platform width
  const playerNameY = getPlatformTextSize(0.02) + 10; // 2% of platform width + offset
  ctx.font = `bold ${playerNameSize}px Arial`;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  const player1Name = window.player1IsCPU ? 
    (window.selectedCharacter1 || 'Player 1') + ' (CPU)' : 
    (window.selectedCharacter1 || 'Player 1');
  ctx.fillText(player1Name, sideMargin, playerNameY);
  ctx.textAlign = 'right';
  const player2Name = window.player2IsCPU ? 
    (window.selectedCharacter2 || 'Player 2') + ' (CPU)' : 
    (window.selectedCharacter2 || 'Player 2');
  ctx.fillText(player2Name, canvas.width - sideMargin, playerNameY);

  // Draw damage percentages and lives
  const damageSize = getPlatformTextSize(DAMAGE_TEXT_PERCENT);
  const damageY = getPlatformTextSize(0.045) + 10; // 4.5% of platform width + offset
  const livesY = getPlatformTextSize(0.07) + 10; // 7% of platform width + offset
  ctx.font = `bold ${damageSize}px Arial`;
  ctx.textAlign = 'left';
  ctx.fillText(player1.damage + '%', sideMargin, damageY);
  ctx.fillText('Lives: ' + player1Lives, sideMargin, livesY);
  ctx.textAlign = 'right';
  ctx.fillText(player2.damage + '%', canvas.width - sideMargin, damageY);
  ctx.fillText('Lives: ' + player2Lives, canvas.width - sideMargin, livesY);

  // Draw timer in middle top
  let timerText;
  if (gameTimer > 420) {
    timerText = '∞';
  } else {
    const minutes = Math.floor(gameTimer / 60);
    const seconds = gameTimer % 60;
    timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  const timerSize = getPlatformTextSize(TIMER_TEXT_PERCENT);
  const timerY = getPlatformTextSize(0.03) + 10; // 3% of platform width + offset
  ctx.font = `bold ${timerSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillStyle = gameTimer <= 30 && gameTimer <= 420 ? '#ff4444' : '#ffffff';
  ctx.fillText(timerText, canvas.width / 2, timerY);

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
    const scaledFpsBoxWidth = getScaledUISize(80);
    const scaledFpsBoxHeight = getScaledUISize(30);
    const scaledFpsBoxX = getScaledUISize(10);
    const scaledFpsBoxY = canvas.height - scaledFpsBoxHeight - getScaledUISize(10);
    
    // Draw background box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(scaledFpsBoxX, scaledFpsBoxY, scaledFpsBoxWidth, scaledFpsBoxHeight);
    
    // Draw border
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = getScaledUISize(2);
    ctx.strokeRect(scaledFpsBoxX, scaledFpsBoxY, scaledFpsBoxWidth, scaledFpsBoxHeight);
    
    // Draw FPS text
    const scaledFpsTextSize = getScaledTextSize(BASE_TEXT_SIZE.fps);
    ctx.font = `bold ${scaledFpsTextSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ff00';
    ctx.fillText(`${averageFPS} FPS`, scaledFpsBoxX + scaledFpsBoxWidth / 2, scaledFpsBoxY + scaledFpsBoxHeight / 2 + getScaledUISize(5));
  }
}

function drawCompetitiveBackground() {
  // Create a competitive fighting game background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#0a0a0a');   // Very dark at top
  gradient.addColorStop(0.3, '#1a1a1a'); // Slightly lighter
  gradient.addColorStop(0.7, '#0f0f0f'); // Dark in middle
  gradient.addColorStop(1, '#050505');   // Very dark at bottom
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw subtle fighting aura effect
  drawFightingAura();
}

function drawFightingAura() {
  const time = Date.now() * 0.001;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Draw expanding energy rings
  for (let i = 0; i < 3; i++) {
    const ringRadius = getScaledSize(100) + Math.sin(time + i) * getScaledSize(20) + i * getScaledSize(50);
    const alpha = 0.05 - (i * 0.01);
    
    ctx.strokeStyle = `rgba(100, 150, 255, ${alpha})`;
    ctx.lineWidth = getScaledSize(2);
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  // Draw subtle energy particles
  for (let i = 0; i < 15; i++) {
    const angle = (i / 15) * Math.PI * 2 + time * 0.5;
    const radius = getScaledSize(200) + Math.sin(time + i) * getScaledSize(30);
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const size = Math.sin(time + i) * getScaledSize(2) + getScaledSize(3);
    
    ctx.fillStyle = `rgba(150, 200, 255, ${0.1 + Math.sin(time + i) * 0.05})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBattlefieldPlatform() {
  const x = platform.x;
  const y = platform.y;
  const width = platform.width;
  const height = platform.height;
  
  // Draw platform shadow for thickness
  const scaledPlatformThickness = getScaledSize(BASE_PLATFORM_THICKNESS);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(x + getScaledSize(4), y + height, width - getScaledSize(8), scaledPlatformThickness);
  
  // Draw platform side faces (3D effect)
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(x, y + height, width, scaledPlatformThickness);
  
  // Draw main platform (black base)
  ctx.fillStyle = '#000000';
  ctx.fillRect(x, y, width, height);
  
  // Draw enhanced USB design
  drawEnhancedUSBDesign(x, y, width, height);
  
  // Draw platform edge highlights
  ctx.strokeStyle = '#333';
  ctx.lineWidth = getScaledSize(2);
  ctx.strokeRect(x, y, width, height);
}

function drawEnhancedUSBDesign(x, y, width, height) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Draw blue energy line from left, stopping before the text
  ctx.strokeStyle = '#0066cc';
  ctx.lineWidth = getScaledSize(4);
  ctx.beginPath();
  ctx.moveTo(x + getScaledSize(30), centerY);
  ctx.lineTo(centerX - getScaledSize(60), centerY);
  ctx.stroke();

  // Draw red energy line from right, stopping before the text
  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = getScaledSize(4);
  ctx.beginPath();
  ctx.moveTo(x + width - getScaledSize(30), centerY);
  ctx.lineTo(centerX + getScaledSize(60), centerY);
  ctx.stroke();

  // Draw large, bold, perfectly centered 'USB' text
  const scaledUsbTextSize = getScaledTextSize(32);
  ctx.font = `bold ${scaledUsbTextSize}px Arial`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('USB', centerX, centerY);
}

function drawVictoryScreen() {
  // Safety check - don't draw if game is not properly initialized
  if (!gameStarted || !canvas) {
    return;
  }
  
  const currentTime = Date.now();
  const timeElapsed = currentTime - victoryStartTime;
  
  // Draw animated background with fighting game effects
  drawVictoryBackground(timeElapsed);
  
  // Draw victory text with enhanced styling
  const victoryTextSize = getScaledTextSize(64);
  const subtitleTextSize = getScaledTextSize(28);
  
  // Draw victory text with glow effect
  ctx.font = `bold ${victoryTextSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw glow effect
  ctx.shadowColor = victoryColor;
  ctx.shadowBlur = getScaledSize(20);
  ctx.fillStyle = victoryColor;
  ctx.fillText(victoryText, canvas.width / 2, canvas.height / 2 - getScaledSize(80));
  
  // Reset shadow
  ctx.shadowBlur = 0;
  
  // Draw subtitle with animation
  ctx.font = `bold ${subtitleTextSize}px Arial`;
  ctx.fillStyle = '#ffffff';
  
  if (timeElapsed < 2000) {
    // First 2 seconds - show "Victory!" message with pulse effect
    const pulseScale = 1 + Math.sin(timeElapsed * 0.01) * 0.1;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2 + getScaledSize(20));
    ctx.scale(pulseScale, pulseScale);
    ctx.fillText('Victory!', 0, 0);
    ctx.restore();
  } else {
    // After 2 seconds - show skip instruction
    ctx.fillText('Press any key or button to continue', canvas.width / 2, canvas.height / 2 + getScaledSize(20));
  }
  
  // Draw kill count with fighting game style
  drawKillCount();
  
  // Draw victory effects
  drawVictoryEffects(timeElapsed);
}

function drawVictoryBackground(timeElapsed) {
  // Safety check
  if (!canvas || !ctx) {
    return;
  }
  
  // Create animated gradient background
  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width / 2
  );
  
  // Animate colors based on time
  const hue = (timeElapsed * 0.1) % 360;
  const saturation = 50 + Math.sin(timeElapsed * 0.005) * 20;
  
  gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, 20%, 0.9)`);
  gradient.addColorStop(0.5, `hsla(${hue + 30}, ${saturation}%, 15%, 0.8)`);
  gradient.addColorStop(1, `hsla(${hue + 60}, ${saturation}%, 10%, 0.9)`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw animated energy rings
  for (let i = 0; i < 5; i++) {
    const ringRadius = getScaledSize(100) + Math.sin(timeElapsed * 0.002 + i) * getScaledSize(50) + i * getScaledSize(80);
    const alpha = 0.1 - (i * 0.02);
    
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = getScaledSize(3);
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawKillCount() {
  // Safety check
  if (!canvas || !ctx) {
    return;
  }
  
  const killTextSize = getScaledTextSize(32);
  const killY = canvas.height / 2 + getScaledSize(120);
  
  ctx.font = `bold ${killTextSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  
  // Calculate kills (3 - remaining lives)
  const player1Kills = 3 - player1Lives;
  const player2Kills = 3 - player2Lives;
  
  // Draw kill count with fighting game style
  ctx.fillText(`Kills: ${player1Kills} - ${player2Kills}`, canvas.width / 2, killY);
  
  // Draw character names above kills
  const nameTextSize = getScaledTextSize(24);
  ctx.font = `bold ${nameTextSize}px Arial`;
  
  const player1Name = window.selectedCharacter1 || 'Player 1';
  const player2Name = window.selectedCharacter2 || 'Player 2';
  
  ctx.fillStyle = '#2196f3'; // Blue for player 1
  ctx.fillText(player1Name, canvas.width / 2 - getScaledSize(150), killY - getScaledSize(40));
  
  ctx.fillStyle = '#e53935'; // Red for player 2
  ctx.fillText(player2Name, canvas.width / 2 + getScaledSize(150), killY - getScaledSize(40));
}

function drawVictoryEffects(timeElapsed) {
  // Safety check
  if (!canvas || !ctx) {
    return;
  }
  
  // Draw floating particles
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2 + timeElapsed * 0.001;
    const radius = getScaledSize(200) + Math.sin(timeElapsed * 0.002 + i) * getScaledSize(50);
    const x = canvas.width / 2 + Math.cos(angle) * radius;
    const y = canvas.height / 2 + Math.sin(angle) * radius;
    const size = Math.max(1, Math.sin(timeElapsed * 0.003 + i) * getScaledSize(3) + getScaledSize(2));
    
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(timeElapsed * 0.002 + i) * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw victory sparkles
  for (let i = 0; i < 15; i++) {
    const sparkleX = canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.8;
    const sparkleY = canvas.height / 2 + (Math.random() - 0.5) * canvas.height * 0.6;
    const sparkleSize = Math.max(1, getScaledSize(4));
    
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + Math.sin(timeElapsed * 0.005 + i) * 0.3})`;
    ctx.lineWidth = getScaledSize(2);
    
    // Draw star shape
    ctx.beginPath();
    for (let j = 0; j < 5; j++) {
      const angle = (j / 5) * Math.PI * 2;
      const x = sparkleX + Math.cos(angle) * sparkleSize;
      const y = sparkleY + Math.sin(angle) * sparkleSize;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
}

function resetGame() {
  // Prevent update loop from running after leaving game
  window.gameIsTrulyOver = true;
  // Set timer and lives to null to fully disable win/timer logic
  gameTimer = null;
  player1Lives = null;
  player2Lives = null;
  gameStarted = false;
  window.gameStarted = false;
  isPaused = false; // Reset pause state
  frameCount = 0;
  lastResetFrame = 0;
  
  // Reset victory screen state
  showVictoryScreen = false;
  victoryText = '';
  victoryColor = '#ffffff';
  victoryStartTime = 0;
  
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
  
  // Stop battle music and restart background music when returning to character menu
  if (audioManager) {
    if (typeof audioManager.stopBattleMusic === 'function') {
      audioManager.stopBattleMusic();
    }
    if (typeof audioManager.restartMusic === 'function') {
      audioManager.restartMusic();
    }
  }
}

// --- GLOBAL GAMEPAD POLLING LOOP ---
function pollGamepadsLoop() {
  pollGamepads();
  requestAnimationFrame(pollGamepadsLoop);
}
requestAnimationFrame(pollGamepadsLoop);

function handleGamepadForPlayer(gp, player, prevIndex) {
  // Handle victory screen input
  if (showVictoryScreen) {
    // Allow skipping victory screen after minimum time (2 seconds)
    const currentTime = Date.now();
    if (currentTime - victoryStartTime >= 2000) {
      const anyButtonPressed = gp.buttons.some(btn => btn?.pressed);
      const anyStickMovement = Math.abs(gp.axes[0]) > 0.2 || Math.abs(gp.axes[1]) > 0.2;
      if (anyButtonPressed || anyStickMovement) {
        resetGame();
        return;
      }
    }
  }
  
  // Axes: 0 = left/right, 1 = up/down
  const lx = gp.axes[0] || 0;
  const ly = gp.axes[1] || 0;
  // Deadzone for stick
  const DEADZONE = 0.22;
  // --- Direction for attacks ---
  let direction = 'neutral';
  if (lx < -DEADZONE || lx > DEADZONE) direction = 'side';
  else if (ly < -DEADZONE) direction = 'up';
  else if (ly > DEADZONE) direction = 'down';
  // Movement
  if (lx < -DEADZONE) player.move(-1);
  else if (lx > DEADZONE) player.move(1);
  // Fast fall (down on stick)
  if (ly > 0.5 && !player.isGrounded) {
    player.vy = Math.min(player.vy + 0.8, 15);
  }
  // --- BUTTONS ---
  // 0: A (jump), 1: B (leave game), 2: X (heavy), 6: L2 (shield), 7: R2 (light), 9: Menu/Start (pause)
  const btnA = gp.buttons[0]?.pressed;
  const btnB = gp.buttons[1]?.pressed;
  const btnX = gp.buttons[2]?.pressed;
  const btnL2 = gp.buttons[6]?.pressed;
  const btnR2 = gp.buttons[7]?.pressed;
  const btnMenu = gp.buttons[9]?.pressed;
  // Debounce state
  const prev = prevGamepadStates[prevIndex] || {};
  // --- Detect UI context ---
  const characterMenu = document.getElementById('characterMenu');
  const gameCanvas = document.getElementById('gameCanvas');
  const menuVisible = characterMenu && characterMenu.style.display !== 'none';
  const gameVisible = gameCanvas && gameCanvas.style.display !== 'none';
  // --- Pause/Settings logic ---
  if (btnMenu && !lastPauseButtonState[prevIndex]) {
    if (menuVisible && window.settings && typeof window.settings.toggleSettings === 'function') {
      window.settings.toggleSettings();
    } else if (gameVisible && window.pauseMenu && typeof window.pauseMenu.togglePause === 'function') {
      window.pauseMenu.togglePause();
    }
  }
  lastPauseButtonState[prevIndex] = btnMenu;
  // --- Leave Game (A or B button while paused, only if game is visible) ---
  if (gameVisible && window.pauseMenu && window.pauseMenu.isPaused && ((btnA && !lastLeaveButtonState[prevIndex]) || (btnB && !lastLeaveButtonState[prevIndex]))) {
    if (typeof window.pauseMenu.leaveGame === 'function') {
      window.pauseMenu.leaveGame();
    }
  }
  lastLeaveButtonState[prevIndex] = btnA || btnB;
  // --- Jump (A) ---
  if (btnA && !prev.btnA && !(window.pauseMenu && window.pauseMenu.isPaused)) {
    player.jump();
  }
  // --- Reset jump key state on A release (for double jump/grounded jump logic) ---
  if (!btnA && prev.btnA) {
    player.isJumpKeyPressed = false;
  }
  // --- Light Attack (R2) ---
  if (btnR2 && !prev.btnR2 && !(window.pauseMenu && window.pauseMenu.isPaused)) {
    player.attack(direction, 'light');
  }
  // --- Heavy Attack (X) ---
  if (btnX && !prev.btnX && !(window.pauseMenu && window.pauseMenu.isPaused)) {
    // For neutral heavy, start charging; for others, attack
    if (direction !== 'neutral') {
      player.attack(direction, 'heavy');
    } else {
      player.startCharge();
    }
  }
  // --- Release charge on X release ---
  if (!btnX && prev.btnX) {
    player.releaseCharge();
  }
  // --- Shield (L2) ---
  if (btnL2 && !prev.btnL2 && !(window.pauseMenu && window.pauseMenu.isPaused)) {
    player.activateShield();
  }
  if (!btnL2 && prev.btnL2) {
    player.deactivateShield();
  }
  // --- Jab combo keyup for Rakka ---
  if (!btnR2 && prev.btnR2 && player.onJabKeyUp) {
    player.onJabKeyUp();
  }
  // Update previous state
  prevGamepadStates[prevIndex] = { btnA, btnB, btnX, btnL2, btnR2, btnMenu };
}

function update() {
  // Prevent update loop from running after leaving game
  if (window.gameIsTrulyOver) {
    requestAnimationFrame(update);
    return;
  }
  // If timer or lives are null, do not process win/timer logic
  if (gameTimer === null || player1Lives === null || player2Lives === null) {
    requestAnimationFrame(update);
    return;
  }
  frameCount++;
  
  if (!gameStarted) {
    requestAnimationFrame(update);
    return;
  }

  // Check if victory screen is active
  if (showVictoryScreen) {
    // Check if enough time has passed
    const currentTime = Date.now();
    if (currentTime - victoryStartTime >= VICTORY_DISPLAY_TIME) {
      // Return to character menu after the full display time
      resetGame();
      requestAnimationFrame(update);
      return;
    }
    
    // Draw victory screen
    drawStage();
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
    
    // Set up victory screen
    if (winnerName === 'Tie') {
      victoryText = 'Tie';
      victoryColor = '#ffffff'; // White for tie
    } else {
      // Determine color based on winner
      if (winner === player1) {
        // Player 1 wins - use blue color
        victoryColor = '#2196f3';
      } else if (winner === player2) {
        // Player 2 wins - use red color
        victoryColor = '#e53935';
      } else {
        // CPU wins - use grey color
        victoryColor = '#808080';
      }
      
      // Set victory text to character name
      victoryText = `${winnerCharacter} Wins!`;
    }
    
    // Show victory screen
    showVictoryScreen = true;
    victoryStartTime = Date.now();
    
    // Continue the game loop to show victory screen
    requestAnimationFrame(update);
    return;
  }

  // --- POLL GAMEPADS ---
  pollGamepads();

  // Handle Player 1 movement (WASD) - Blue cube
  if (!window.player1IsCPU && !controllerActiveForPlayer1) {
    // Human player - handle input (keyboard only if no controller)
    if (keys.a) player1.move(-1);
    if (keys.d) player1.move(1);
    if (keys.w) player1.jump();
    // Fast fall
    if (keys.s && !player1.isGrounded) {
      player1.vy = Math.min(player1.vy + 0.8, 15); // Increase fall speed
    }
  } else if (window.player1IsCPU) {
    // CPU player - update AI
    if (cpu1) {
      cpu1.update();
      cpu1.handleEmergency();
    }
  }

  // Handle Player 2 movement (Arrow keys) - Red cube
  if (!window.player2IsCPU && !controllerActiveForPlayer2) {
    // Human player - handle input (keyboard only if no controller)
    if (keys.ArrowLeft) player2.move(-1);
    if (keys.ArrowRight) player2.move(1);
    if (keys.ArrowUp) player2.jump();
    // Fast fall
    if (keys.ArrowDown && !player2.isGrounded) {
      player2.vy = Math.min(player2.vy + 0.8, 15); // Increase fall speed
    }
  } else if (window.player2IsCPU) {
    // CPU player - update AI
    if (cpu2) {
      cpu2.update();
      cpu2.handleEmergency();
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
    const scaledBlastZoneLeft = getScaledSize(BLAST_ZONE_LEFT);
    const scaledBlastZoneRight = getScaledSize(BLAST_ZONE_RIGHT);
    const scaledBlastZoneTop = getScaledSize(BLAST_ZONE_TOP);
    const scaledBlastZoneBottom = getScaledSize(BLAST_ZONE_BOTTOM);
    
    if (player1.x + player1.width < scaledBlastZoneLeft || 
        player1.x > canvas.width + scaledBlastZoneRight ||
        player1.y + player1.height < scaledBlastZoneTop ||
        player1.y > canvas.height + scaledBlastZoneBottom) {
      player1Lives--;
      const scaledPlayerSpacing = getScaledSize(BASE_PLAYER_SPACING);
      player1.resetPosition(platform.x + scaledPlayerSpacing, platform.y - player1.height);
      player1.damage = 0; // Reset damage
      lastResetFrame = frameCount;
    }
    
    // Check if player2 is outside any blast zone
    if (player2.x + player2.width < scaledBlastZoneLeft || 
        player2.x > canvas.width + scaledBlastZoneRight ||
        player2.y + player2.height < scaledBlastZoneTop ||
        player2.y > canvas.height + scaledBlastZoneBottom) {
      player2Lives--;
      const scaledPlayerSpacing = getScaledSize(BASE_PLAYER_SPACING);
      player2.resetPosition(platform.x + platform.width - scaledPlayerSpacing - player2.width, platform.y - player2.height);
      player2.damage = 0; // Reset damage
      lastResetFrame = frameCount;
    }
  }

  drawStage();
  requestAnimationFrame(update);
}

// Input handling
window.addEventListener('keydown', (e) => {
  // Handle victory screen input
  if (showVictoryScreen) {
    // Allow skipping victory screen after minimum time (2 seconds)
    const currentTime = Date.now();
    if (currentTime - victoryStartTime >= 2000) {
      resetGame();
      return;
    }
  }
  
  if (!gameStarted) return;
  // Don't process game input if paused
  if (isPaused) return;
  // --- BLOCK KEYBOARD INPUT IF CONTROLLER IS ACTIVE ---
  // Player 1 keys: WASD, f, g, e
  if ((['w','a','s','d','f','g','e','E'].includes(e.key)) && controllerActiveForPlayer1) return;
  // Player 2 keys: Arrow keys, l, k, o
  if ((['ArrowUp','ArrowLeft','ArrowDown','ArrowRight','l','k','o','O'].includes(e.key)) && controllerActiveForPlayer2) return;
  if (e.key in keys) {
    keys[e.key] = true;
  }
  // Attack controls - only for human players
  if (!window.player1IsCPU && !controllerActiveForPlayer1) {
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
  if (!window.player2IsCPU && !controllerActiveForPlayer2) {
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
  if (!window.player1IsCPU && !controllerActiveForPlayer1) {
    if (e.key === 'e' || e.key === 'E') player1.activateShield(); // Player 1 (blue) shield with E
  }
  if (!window.player2IsCPU && !controllerActiveForPlayer2) {
    if (e.key === 'o' || e.key === 'O') player2.activateShield(); // Player 2 (red) shield with O
  }
});

window.addEventListener('keyup', (e) => {
  if (!gameStarted) return;
  // --- BLOCK KEYBOARD INPUT IF CONTROLLER IS ACTIVE ---
  if ((['w','a','s','d','f','g','e','E'].includes(e.key)) && controllerActiveForPlayer1) return;
  if ((['ArrowUp','ArrowLeft','ArrowDown','ArrowRight','l','k','o','O'].includes(e.key)) && controllerActiveForPlayer2) return;
  if (e.key in keys) {
    keys[e.key] = false;
    // Reset jump key state when key is released
    if (e.key === 'w') player1.isJumpKeyPressed = false;
    if (e.key === 'ArrowUp') player2.isJumpKeyPressed = false;
  }
  // --- Reset jab press state for Rakka jab combo ---
  if (!window.player1IsCPU && !controllerActiveForPlayer1 && e.key === 'g' && player1.onJabKeyUp) player1.onJabKeyUp();
  if (!window.player2IsCPU && !controllerActiveForPlayer2 && e.key === 'k' && player2.onJabKeyUp) player2.onJabKeyUp();
  // Release charged attacks
  if (!window.player1IsCPU && !controllerActiveForPlayer1) {
    if (e.key === 'f') {
      player1.releaseCharge();
    }
  }
  if (!window.player2IsCPU && !controllerActiveForPlayer2) {
    if (e.key === 'l') {
      player2.releaseCharge();
    }
  }
  // Shield deactivation controls - only for human players
  if (!window.player1IsCPU && !controllerActiveForPlayer1) {
    if (e.key === 'e' || e.key === 'E') player1.deactivateShield(); // Player 1 (blue) deactivate shield
  }
  if (!window.player2IsCPU && !controllerActiveForPlayer2) {
    if (e.key === 'o' || e.key === 'O') player2.deactivateShield(); // Player 2 (red) deactivate shield
  }
});

// Stop all movement if window loses focus
window.addEventListener('blur', () => {
  // Reset all movement keys
  for (const key in keys) {
    keys[key] = false;
  }
  // Stop player movement immediately
  if (player1) {
    player1.vx = 0;
    player1.isJumpKeyPressed = false;
  }
  if (player2) {
    player2.vx = 0;
    player2.isJumpKeyPressed = false;
  }
});

// Stop all movement if a modifier/special key is pressed (e.g., CapsLock, Tab, Alt, Control, Meta, Escape)
window.addEventListener('keydown', (e) => {
  const resetKeys = [
    'CapsLock', 'Tab', 'Alt', 'AltGraph', 'Control', 'Meta', 'Escape'
  ];
  if (resetKeys.includes(e.key)) {
    for (const key in keys) {
      keys[key] = false;
    }
    if (player1) {
      player1.vx = 0;
      player1.isJumpKeyPressed = false;
    }
    if (player2) {
      player2.vx = 0;
      player2.isJumpKeyPressed = false;
    }
  }
});

// Initialize game
window.addEventListener('resize', () => {
  resizeCanvas();
  // If game is running, also update scaling factors for any ongoing calculations
  if (gameStarted) {
    updateScaling();
  }
});
resizeCanvas();
setupPlayersOnPlatform(); // Set initial positions on first load

window.addEventListener('startGame', (e) => {
  const { character1, character2, player1IsCPU, player2IsCPU, winScore } = e.detail;
  
  // Store settings
  window.selectedCharacter1 = character1;
  window.selectedCharacter2 = character2;
  window.player1IsCPU = !!player1IsCPU;
  window.player2IsCPU = !!player2IsCPU;
  window.winScore = winScore;

  gameStarted = true;
  window.gameStarted = true; // Expose to window for pause menu
  
  // Reset the game over flag so update loop resumes
  window.gameIsTrulyOver = false;
  
  // Reset victory screen state
  showVictoryScreen = false;
  victoryText = '';
  victoryColor = '#ffffff';
  victoryStartTime = 0;
  
  // Initialize timer and lives from settings - ensure they are never null
  gameTimer = window.gameTimer || 300;
  gameLives = window.gameLives || 3;
  player1Lives = gameLives;
  player2Lives = gameLives;
  lastTimerUpdate = 0; // Reset timer to initialize on first frame
  
  // Re-initialize players with the correct character data
  const player1CharacterData = characters[character1.toLowerCase()];
  const player2CharacterData = characters[character2.toLowerCase()];
  
  if (!player1CharacterData) {
    return;
  }
  if (!player2CharacterData) {
    return;
  }
  
  try {
    const scaledPlayerSize = getScaledSize(BASE_PLAYER_SIZE);
    player1 = new Player(100, 100, '#2196f3', 1, player1CharacterData, scaledPlayerSize);
    player2 = new Player(400, 100, '#e53935', -1, player2CharacterData, scaledPlayerSize);
  } catch (error) {
    return;
  }
  
  // Create CPU instances if needed
  try {
    if (player1IsCPU) {
      cpu1 = new CPU(player1, player2, platform);
    }
    if (player2IsCPU) {
      cpu2 = new CPU(player2, player1, platform);
    }
  } catch (error) {
    // Continue without CPU if there's an error
    cpu1 = null;
    cpu2 = null;
  }
  
  // Mark that the game has started for both players
  player1.setGameStarted(true);
  player2.setGameStarted(true);
  
  // Show canvas and resize
  canvas.style.display = 'block';
  resizeCanvas();
  
  // Set up players on the platform for the new game
  setupPlayersOnPlatform();
  
  // Start battle music when game starts
  if (audioManager && typeof audioManager.startBattleMusic === 'function') {
    audioManager.startBattleMusic();
  }
});

// Start game loop
update();

// Pause menu event listeners
window.addEventListener('gamePaused', () => {
  isPaused = true;
});

window.addEventListener('gameResumed', () => {
  isPaused = false;
});

// Game reset event listener (for pause menu leave game)
window.addEventListener('gameReset', () => {
  console.log('Game reset event received, calling resetGame()');
  resetGame();
});

function pollGamepads() {
  controllerActiveForPlayer1 = false;
  controllerActiveForPlayer2 = false;
  const gamepadsRaw = navigator.getGamepads ? navigator.getGamepads() : [];
  // Filter out null/undefined gamepads and only allow real game controllers
  const controllerKeywords = [
    'xbox', 'playstation', 'dualshock', 'switch', 'pro controller', '8bitdo', 'logitech', 'nintendo', 'controller', 'ps4', 'ps5', 'sony', 'gamepad'
  ];
  const connectedGamepads = [];
  for (let i = 0; i < gamepadsRaw.length; i++) {
    const gp = gamepadsRaw[i];
    if (!gp) continue;
    // Only allow mapping === 'standard' and id contains a controller keyword
    const idLower = gp.id ? gp.id.toLowerCase() : '';
    const isController = gp.mapping === 'standard' && controllerKeywords.some(keyword => idLower.includes(keyword));
    if (isController) connectedGamepads.push(gp);
  }
  // Assign controllers in order: first to player 1, second to player 2
  let padIndex = 0;
  if (!window.player1IsCPU && connectedGamepads[padIndex]) {
    handleGamepadForPlayer(connectedGamepads[padIndex], player1, 0);
    controllerActiveForPlayer1 = true;
    padIndex++;
  }
  if (!window.player2IsCPU && connectedGamepads[padIndex]) {
    handleGamepadForPlayer(connectedGamepads[padIndex], player2, 1);
    controllerActiveForPlayer2 = true;
    padIndex++;
  }
}
