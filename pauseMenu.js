// pauseMenu.js
// Pause menu system for Ultimate Stick Battle

class PauseMenu {
  constructor() {
    this.isPaused = false;
    this.pauseMenuElement = null;
    this.gameCanvas = null;
    this.characterMenu = null;
    
    this.init();
  }

  init() {
    // Get DOM elements
    this.gameCanvas = document.getElementById('gameCanvas');
    this.characterMenu = document.getElementById('characterMenu');
    
    // Create pause menu element
    this.createPauseMenu();
    
    // Add event listeners
    this.addEventListeners();
    

  }

  createPauseMenu() {
    // Create pause menu container
    this.pauseMenuElement = document.createElement('div');
    this.pauseMenuElement.id = 'pauseMenu';
    this.pauseMenuElement.className = 'pauseMenu';
    this.pauseMenuElement.style.display = 'none';
    
    // Create pause menu content
    this.pauseMenuElement.innerHTML = `
      <div class="pauseMenuContent">
        <h2 class="pauseTitle">PAUSED</h2>
        <div class="pauseMenuButtons">
          <button id="leaveGameButton" class="pauseMenuButton">Leave Game</button>
        </div>
      </div>
    `;
    
    // Append to body
    document.body.appendChild(this.pauseMenuElement);
  }

  addEventListeners() {
    // Listen for Escape key to toggle pause (only when game is running)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && window.gameStarted && this.gameCanvas && this.gameCanvas.style.display !== 'none') {
        this.togglePause();
      }
    });

    // Listen for leave game button click
    document.addEventListener('click', (e) => {
      if (e.target.id === 'leaveGameButton') {
        this.leaveGame();
      }
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      this.showPauseMenu();
    } else {
      this.hidePauseMenu();
    }
    

  }

  showPauseMenu() {
    this.pauseMenuElement.style.display = 'flex';
    
    // Dispatch pause event for game to handle
    window.dispatchEvent(new CustomEvent('gamePaused'));
  }

  hidePauseMenu() {
    this.pauseMenuElement.style.display = 'none';
    
    // Dispatch resume event for game to handle
    window.dispatchEvent(new CustomEvent('gameResumed'));
  }

  leaveGame() {
    
    // Hide pause menu
    this.hidePauseMenu();
    this.isPaused = false;
    
    // Dispatch game reset event to return to character menu
    window.dispatchEvent(new CustomEvent('gameReset'));
    
    // Hide canvas and show character menu
    if (this.gameCanvas) {
      this.gameCanvas.style.display = 'none';
    }
    if (this.characterMenu) {
      this.characterMenu.style.display = 'flex';
    }
    

  }

  // Public method to check if game is paused
  isGamePaused() {
    return this.isPaused;
  }

  // Public method to reset pause menu state
  resetPauseState() {
    this.isPaused = false;
    this.hidePauseMenu();
  }
}

// Initialize pause menu when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.pauseMenu = new PauseMenu();
});

// Export for potential use in other modules
export { PauseMenu }; 