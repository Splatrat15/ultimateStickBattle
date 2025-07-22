// start.js - Startup page for Ultimate Stick Battle
import { audioManager } from './modules/audio.js';

window.addEventListener('DOMContentLoaded', () => {
  // Hide character menu initially
  const characterMenu = document.getElementById('characterMenu');
  const gameCanvas = document.getElementById('gameCanvas');
  
  if (characterMenu) characterMenu.style.display = 'none';
  if (gameCanvas) gameCanvas.style.display = 'none';
  
  // Create startup screen
  createStartupScreen();
  
  // AudioManager will handle music playback automatically
  // No need to call playMusic here as it's handled in the constructor
});

function createStartupScreen() {
  // Create startup container
  const startupContainer = document.createElement('div');
  startupContainer.id = 'startupContainer';
  startupContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    font-family: 'Press Start 2P', monospace;
    color: white;
    overflow: hidden;
  `;

  // Create title
  const title = document.createElement('h1');
  title.textContent = 'ULTIMATE STICK BATTLE';
  title.style.cssText = `
    font-size: 3rem;
    text-align: center;
    margin-bottom: 2rem;
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
    animation: titleGlow 2s ease-in-out infinite alternate;
    letter-spacing: 0.2em;
  `;

  // Create subtitle
  const subtitle = document.createElement('p');
  subtitle.textContent = 'The Beta';
  subtitle.style.cssText = `
    font-size: 1.2rem;
    text-align: center;
    margin-bottom: 4rem;
    color: #888;
    letter-spacing: 0.1em;
  `;

  // Create loading bar container
  const loadingContainer = document.createElement('div');
  loadingContainer.style.cssText = `
    width: 300px;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 2rem;
  `;

  // Create loading bar
  const loadingBar = document.createElement('div');
  loadingBar.style.cssText = `
    width: 0%;
    height: 100%;
    background: linear-gradient(90deg, #2196f3, #00bcd4);
    border-radius: 8px;
    transition: width 0.3s ease;
    box-shadow: 0 0 10px rgba(33, 150, 243, 0.5);
  `;

  // Create loading text
  const loadingText = document.createElement('p');
  loadingText.textContent = 'Loading...';
  loadingText.style.cssText = `
    font-size: 1rem;
    text-align: center;
    margin-bottom: 3rem;
    color: #ccc;
  `;

  // Create start button (initially hidden)
  const startButton = document.createElement('button');
  startButton.textContent = 'START GAME';
  startButton.style.cssText = `
    padding: 1rem 2rem;
    font-size: 1.2rem;
    font-family: 'Press Start 2P', monospace;
    background: linear-gradient(135deg, #2196f3, #1976d2);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
    letter-spacing: 0.1em;
    display: none;
  `;

  // Add hover effects
  startButton.addEventListener('mouseenter', () => {
    startButton.style.transform = 'translateY(-2px)';
    startButton.style.boxShadow = '0 6px 20px rgba(33, 150, 243, 0.4)';
  });

  startButton.addEventListener('mouseleave', () => {
    startButton.style.transform = 'translateY(0)';
    startButton.style.boxShadow = '0 4px 15px rgba(33, 150, 243, 0.3)';
  });

  // Create animated background particles
  const particlesContainer = document.createElement('div');
  particlesContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: -1;
  `;

  // Add elements to containers
  loadingContainer.appendChild(loadingBar);
  startupContainer.appendChild(particlesContainer);
  startupContainer.appendChild(title);
  startupContainer.appendChild(subtitle);
  startupContainer.appendChild(loadingContainer);
  startupContainer.appendChild(loadingText);
  startupContainer.appendChild(startButton);

  // Add to body
  document.body.appendChild(startupContainer);

  // Create animated particles
  createParticles(particlesContainer);

  // Simulate loading
  simulateLoading(loadingBar, loadingText, startButton, startupContainer);
}

function createParticles(container) {
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      animation: float ${3 + Math.random() * 4}s linear infinite;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
    `;
    container.appendChild(particle);
  }
}

// --- CONTROLLER INPUT FOR STARTUP SCREEN ---
function pollControllerStartButton() {
  const startupContainer = document.getElementById('startupContainer');
  const startButton = startupContainer ? startupContainer.querySelector('button') : null;
  // Only poll if startup screen is visible and start button is shown
  if (startupContainer && startButton && startButton.style.display !== 'none') {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp || gp.mapping !== 'standard') continue;
      // If any button is pressed
      if (gp.buttons.some(btn => btn && btn.pressed)) {
        startButton.click();
        return; // Only trigger once
      }
    }
    requestAnimationFrame(pollControllerStartButton);
  }
}

// Start polling for controller input when the start button is shown
function simulateLoading(loadingBar, loadingText, startButton, startupContainer) {
  const loadingSteps = [
    { progress: 20, text: 'Initializing...' },
    { progress: 40, text: 'Loading characters...' },
    { progress: 60, text: 'Preparing battle arena...' },
    { progress: 80, text: 'Setting up controls...' },
    { progress: 100, text: 'Ready!' }
  ];

  let currentStep = 0;

  function updateLoading() {
    if (currentStep < loadingSteps.length) {
      const step = loadingSteps[currentStep];
      loadingBar.style.width = step.progress + '%';
      loadingText.textContent = step.text;
      currentStep++;
      setTimeout(updateLoading, 800);
    } else {
      // Loading complete
      setTimeout(() => {
        loadingText.style.display = 'none';
        startButton.style.display = 'block';
        startButton.style.animation = 'fadeInUp 0.5s ease-out';
        // Start polling for controller input now that the button is visible
        requestAnimationFrame(pollControllerStartButton);
      }, 500);
    }
  }

  // Start loading simulation
  setTimeout(updateLoading, 500);
}

// Handle Enter key to start
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const startButton = document.querySelector('#startupContainer button');
    if (startButton && startButton.style.display !== 'none') {
      startButton.click();
    }
  }
});

// Handle start button click
document.addEventListener('click', (e) => {
  if (e.target.textContent === 'START GAME') {
    const startupContainer = document.getElementById('startupContainer');
    const characterMenu = document.getElementById('characterMenu');
    
    if (startupContainer && characterMenu) {
      // Fade out startup screen
      startupContainer.style.animation = 'startupFadeOut 0.5s ease-out forwards';
      
      setTimeout(() => {
        // Remove startup screen
        startupContainer.remove();
        
        // Show character menu
        characterMenu.style.display = 'flex';
        
        // Ensure music is playing after user interaction
        if (audioManager && audioManager.shouldBePlaying() && !audioManager.isPlaying()) {
          console.log('User clicked start, ensuring music plays');
          audioManager.playMusic();
        }
        
        // Trigger any necessary initialization
        window.dispatchEvent(new CustomEvent('startupComplete'));
      }, 500);
    }
  }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes titleGlow {
    from {
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
    }
    to {
      text-shadow: 0 0 30px rgba(255, 255, 255, 0.8), 0 0 40px rgba(33, 150, 243, 0.6);
    }
  }

  @keyframes float {
    0% {
      transform: translateY(100vh) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translateY(-100px) rotate(360deg);
      opacity: 0;
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes startupFadeOut {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.95);
    }
  }
`;
document.head.appendChild(style); 