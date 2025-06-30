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
            <label>Timer (minutes:seconds)</label>
            <div class="timerControls">
              <button id="decreaseTimer" class="settingsButton">-</button>
              <div class="timerDisplay" id="timerDisplay">5:00</div>
              <button id="increaseTimer" class="settingsButton">+</button>
            </div>
          </div>
          
          <div class="settingItem">
            <label>Lives</label>
            <div class="livesControls">
              <button id="decreaseLives" class="settingsButton">-</button>
              <div class="livesDisplay" id="livesDisplay">3</div>
              <button id="increaseLives" class="settingsButton">+</button>
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

    // Lives controls
    document.addEventListener('click', (e) => {
      if (e.target.id === 'decreaseLives') {
        this.decreaseLives();
      } else if (e.target.id === 'increaseLives') {
        this.increaseLives();
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

  decreaseTimer() {
    if (this.gameSettings.timer > 60) { // Minimum 1 minute
      this.gameSettings.timer -= 60;
      this.updateModalDisplay();
    }
  }

  increaseTimer() {
    if (this.gameSettings.timer < 1800) { // Maximum 30 minutes
      this.gameSettings.timer += 60;
      this.updateModalDisplay();
    }
  }

  decreaseLives() {
    if (this.gameSettings.lives > 1) {
      this.gameSettings.lives--;
      this.updateModalDisplay();
    }
  }

  increaseLives() {
    if (this.gameSettings.lives < 10) {
      this.gameSettings.lives++;
      this.updateModalDisplay();
    }
  }

  updateModalDisplay() {
    const timerDisplay = document.getElementById('timerDisplay');
    const livesDisplay = document.getElementById('livesDisplay');
    
    if (timerDisplay) {
      const minutes = Math.floor(this.gameSettings.timer / 60);
      const seconds = this.gameSettings.timer % 60;
      timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    if (livesDisplay) {
      livesDisplay.textContent = this.gameSettings.lives;
    }
  }

  applySettings() {
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
      const minutes = Math.floor(this.gameSettings.timer / 60);
      const seconds = this.gameSettings.timer % 60;
      timerLivesText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')} - ${this.gameSettings.lives} Lives`;
    }
  }

  // Public method to get current settings
  getSettings() {
    return {
      timer: this.gameSettings.timer,
      lives: this.gameSettings.lives
    };
  }
}

// Initialize settings when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.settings = new Settings();
});

// Export for potential use in other modules
export { Settings }; 