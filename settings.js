// settings.js
// Settings system for Ultimate Stick Battle

class Settings {
  constructor() {
    this.isOpen = false;
    this.settingsButton = null;
    this.settingsModal = null;
    this.timerDisplay = null;
    this.livesDisplay = null;
    
    // Default settings
    this.gameSettings = {
      timer: 300, // 5 minutes in seconds
      lives: 3
    };
    
    // Initialize window variables if they don't exist
    if (window.gameTimer === undefined) window.gameTimer = this.gameSettings.timer;
    if (window.gameLives === undefined) window.gameLives = this.gameSettings.lives;
    
    this.init();
  }

  init() {
    this.createSettingsButton();
    this.createSettingsModal();
    this.addEventListeners();
    this.updateCharacterMenuDisplay();
    
    console.log('Settings system initialized');
  }

  createSettingsButton() {
    this.settingsButton = document.createElement('button');
    this.settingsButton.id = 'settingsButton';
    this.settingsButton.className = 'settingsButton';
    this.settingsButton.innerHTML = '⚙️';
    this.settingsButton.title = 'Settings';
    
    // Position in top right
    this.settingsButton.style.position = 'fixed';
    this.settingsButton.style.top = '20px';
    this.settingsButton.style.right = '20px';
    this.settingsButton.style.zIndex = '100';
    
    document.body.appendChild(this.settingsButton);
  }

  createSettingsModal() {
    this.settingsModal = document.createElement('div');
    this.settingsModal.id = 'settingsModal';
    this.settingsModal.className = 'settingsModal';
    this.settingsModal.style.display = 'none';
    
    this.settingsModal.innerHTML = `
      <div class="settingsContent">
        <div class="settingsHeader">
          <h2>Settings</h2>
          <button id="closeSettings" class="closeButton">×</button>
        </div>
        
        <div class="settingsSection">
          <h3>GAME</h3>
          
          <div class="settingItem">
            <label>Timer</label>
            <div class="timerControls">
              <button id="decreaseTimer" class="settingsButton">-</button>
              <div class="timerDisplay" id="timerDisplay">5:00</div>
              <button id="increaseTimer" class="settingsButton">+</button>
            </div>
          </div>
          
          <div class="settingItem">
            <label>Lives</label>
            <div class="livesInputContainer">
              <input type="number" id="livesInput" class="settingsInput" placeholder="3" min="1" max="99">
            </div>
          </div>
        </div>
        
        <div class="settingsFooter">
          <button id="applySettings" class="applyButton">Apply</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.settingsModal);
  }

  addEventListeners() {
    // Settings button click
    this.settingsButton.addEventListener('click', () => {
      this.toggleSettings();
    });

    // Close button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'closeSettings') {
        this.closeSettings();
      }
    });

    // Timer controls
    document.addEventListener('click', (e) => {
      if (e.target.id === 'decreaseTimer') {
        this.decreaseTimer();
      } else if (e.target.id === 'increaseTimer') {
        this.increaseTimer();
      }
    });

    // Lives input validation
    document.addEventListener('input', (e) => {
      if (e.target.id === 'livesInput') {
        this.validateLivesInput(e.target);
      }
    });

    // Apply settings
    document.addEventListener('click', (e) => {
      if (e.target.id === 'applySettings') {
        this.applySettings();
      }
    });

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) {
        this.closeSettings();
      }
    });
  }

  toggleSettings() {
    if (this.isOpen) {
      this.closeSettings();
    } else {
      this.openSettings();
    }
  }

  openSettings() {
    this.isOpen = true;
    this.settingsModal.style.display = 'flex';
    this.updateModalDisplay();
  }

  closeSettings() {
    this.isOpen = false;
    this.settingsModal.style.display = 'none';
  }

  updateModalDisplay() {
    const timerDisplay = document.getElementById('timerDisplay');
    const livesInput = document.getElementById('livesInput');
    
    if (timerDisplay) {
      if (this.gameSettings.timer > 420) {
        // Beyond 7:00, show infinity symbol
        timerDisplay.textContent = '∞';
      } else {
        const minutes = Math.floor(this.gameSettings.timer / 60);
        const seconds = this.gameSettings.timer % 60;
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    }
    
    if (livesInput) {
      livesInput.value = this.gameSettings.lives;
    }
  }

  applySettings() {
    // Read lives value from input field
    const livesInput = document.getElementById('livesInput');
    
    if (livesInput) {
      this.gameSettings.lives = parseInt(livesInput.value) || 3;
    }
    
    // Update window variables
    window.gameTimer = this.gameSettings.timer;
    window.gameLives = this.gameSettings.lives;
    
    // Update character menu display
    this.updateCharacterMenuDisplay();
    
    // Close settings
    this.closeSettings();
    
    console.log('Settings applied:', {
      timer: this.gameSettings.timer,
      lives: this.gameSettings.lives
    });
  }

  updateCharacterMenuDisplay() {
    const timerLivesText = document.querySelector('.timerLivesText');
    if (timerLivesText) {
      if (this.gameSettings.timer > 420) {
        // Beyond 7:00, show infinity symbol
        timerLivesText.textContent = `∞ - ${this.gameSettings.lives} Lives`;
      } else {
        const minutes = Math.floor(this.gameSettings.timer / 60);
        const seconds = this.gameSettings.timer % 60;
        timerLivesText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')} - ${this.gameSettings.lives} Lives`;
      }
    }
  }

  // Public method to get current settings
  getSettings() {
    return {
      timer: this.gameSettings.timer,
      lives: this.gameSettings.lives
    };
  }

  validateLivesInput(input) {
    let value = parseInt(input.value) || 0;
    
    // Clamp between 1 and 99
    if (value < 1) value = 1;
    if (value > 99) value = 99;
    
    input.value = value;
  }

  decreaseTimer() {
    // Define the timer increments in seconds
    const timerIncrements = [
      60,   // 1:00
      90,   // 1:30
      120,  // 2:00
      150,  // 2:30
      180,  // 3:00
      240,  // 4:00
      300,  // 5:00
      360,  // 6:00
      420   // 7:00
    ];
    
    // If currently at infinity (beyond 7:00), go back to 7:00
    if (this.gameSettings.timer > 420) {
      this.gameSettings.timer = 420;
      this.updateModalDisplay();
      return;
    }
    
    // Find current position in increments
    let currentIndex = timerIncrements.indexOf(this.gameSettings.timer);
    
    if (currentIndex !== -1) {
      // If current timer is in the predefined increments
      if (currentIndex > 0) {
        // Go to previous increment
        this.gameSettings.timer = timerIncrements[currentIndex - 1];
      }
      // If at 1:00 (index 0), don't go below 1:00
    } else {
      // Current timer is not in predefined increments
      if (this.gameSettings.timer > 60) {
        // Between 1:00 and 7:00, find previous increment
        const prevIncrement = timerIncrements.filter(increment => increment < this.gameSettings.timer).pop();
        if (prevIncrement) {
          this.gameSettings.timer = prevIncrement;
        } else {
          // Shouldn't happen, but go to 1:00
          this.gameSettings.timer = 60;
        }
      }
      // If below 1:00, stay at 1:00 (minimum)
    }
    
    this.updateModalDisplay();
  }

  increaseTimer() {
    // Define the timer increments in seconds
    const timerIncrements = [
      60,   // 1:00
      90,   // 1:30
      120,  // 2:00
      150,  // 2:30
      180,  // 3:00
      240,  // 4:00
      300,  // 5:00
      360,  // 6:00
      420   // 7:00
    ];
    
    // Find current position in increments
    let currentIndex = timerIncrements.indexOf(this.gameSettings.timer);
    
    if (currentIndex !== -1) {
      // If current timer is in the predefined increments
      if (currentIndex < timerIncrements.length - 1) {
        // Go to next increment
        this.gameSettings.timer = timerIncrements[currentIndex + 1];
      } else {
        // At 7:00, go to 8:00 (480 seconds) - start infinite progression
        this.gameSettings.timer = 480;
      }
    } else {
      // Current timer is not in predefined increments
      if (this.gameSettings.timer < 60) {
        // Below 1:00, go to 1:00
        this.gameSettings.timer = 60;
      } else if (this.gameSettings.timer < 420) {
        // Between 1:00 and 7:00, find next increment
        const nextIncrement = timerIncrements.find(increment => increment > this.gameSettings.timer);
        if (nextIncrement) {
          this.gameSettings.timer = nextIncrement;
        } else {
          // Shouldn't happen, but go to 7:00
          this.gameSettings.timer = 420;
        }
      } else {
        // At or beyond 7:00, add 60 seconds (1 minute) for infinite progression
        this.gameSettings.timer += 60;
      }
    }
    
    this.updateModalDisplay();
  }
}

// Initialize settings when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.settings = new Settings();
});

// Export for potential use in other modules
export { Settings }; 