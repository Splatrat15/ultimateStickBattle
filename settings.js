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
      lives: 3,
      displayMode: 'windowed',
      showFPS: false,
      audioDevice: 'default',
      masterVolume: 100, // Master volume (0-100)
      musicVolume: 80,   // Music volume (0-100)
      sfxVolume: 90      // SFX volume (0-100)
    };
    
    // Initialize window variables if they don't exist
    if (window.gameTimer === undefined) window.gameTimer = this.gameSettings.timer;
    if (window.gameLives === undefined) window.gameLives = this.gameSettings.lives;
    if (window.displayMode === undefined) window.displayMode = this.gameSettings.displayMode;
    if (window.showFPS === undefined) window.showFPS = this.gameSettings.showFPS;
    if (window.audioDevice === undefined) window.audioDevice = this.gameSettings.audioDevice;
    if (window.masterVolume === undefined) window.masterVolume = this.gameSettings.masterVolume;
    if (window.musicVolume === undefined) window.musicVolume = this.gameSettings.musicVolume;
    if (window.sfxVolume === undefined) window.sfxVolume = this.gameSettings.sfxVolume;
    
    this.init();
  }

  init() {
    // ✅ Initialize EmailJS ONCE after DOM is ready
    if (typeof emailjs !== 'undefined') {
      emailjs.init('v_6THrO7foWXXRzq2');
    }
    
    this.createSettingsButton();
    this.createSettingsModal();
    this.addEventListeners();
    this.updateCharacterMenuDisplay();
    this.loadAudioDevices();
  }

  async loadAudioDevices() {
    try {
      // Request permission to access audio devices
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      
      // Get available audio devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Filter for audio output devices only and remove duplicates
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
      const uniqueDevices = [];
      const seenLabels = new Set();
      
      audioOutputs.forEach(device => {
        // Clean up device label
        let cleanLabel = device.label || `Audio Device ${device.deviceId.slice(0, 8)}`;
        
        // Remove common prefixes that make labels too long
        cleanLabel = cleanLabel.replace(/^(Default - |System Default - |Default Device - )/i, '');
        
        // If we haven't seen this label before, add it
        if (!seenLabels.has(cleanLabel)) {
          seenLabels.add(cleanLabel);
          uniqueDevices.push({
            deviceId: device.deviceId,
            label: cleanLabel
          });
        }
      });
      
      // Populate the audio device dropdown
      const audioDeviceSelect = document.getElementById('audioDevice');
      if (audioDeviceSelect) {
        // Clear existing options except the first one
        audioDeviceSelect.innerHTML = '<option value="default">Default Device</option>';
        
        // Add available audio output devices
        uniqueDevices.forEach(device => {
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.textContent = device.label;
          audioDeviceSelect.appendChild(option);
        });
        

      }
    } catch (error) {

      // Keep the default option if we can't access devices
    }
  }

  createSettingsButton() {
    // Only create the button if it doesn't already exist
    if (document.getElementById('settingsButton')) return;
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
    // Only show when characterMenu is visible and gameCanvas is hidden
    const characterMenu = document.getElementById('characterMenu');
    const gameCanvas = document.getElementById('gameCanvas');
    const updateButtonVisibility = () => {
      if (
        characterMenu && characterMenu.style.display !== 'none' &&
        gameCanvas && gameCanvas.style.display === 'none'
      ) {
        this.settingsButton.style.display = 'block';
      } else {
        this.settingsButton.style.display = 'none';
      }
    };
    // Listen for menu/game show/hide events
    window.addEventListener('gameReset', () => setTimeout(updateButtonVisibility, 0));
    window.addEventListener('startGame', updateButtonVisibility);
    window.addEventListener('DOMContentLoaded', () => setTimeout(updateButtonVisibility, 100));
    setTimeout(updateButtonVisibility, 200);
    updateButtonVisibility();
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
        
        <div class="settingsTabs">
          <button class="tabButton active" data-tab="game">Game</button>
          <button class="tabButton" data-tab="audio">Audio</button>
          <button class="tabButton" data-tab="display">Display</button>
          <button class="tabButton" data-tab="other">Other</button>
        </div>
        
        <div class="tabContent">
          <div id="gameTab" class="tabPanel active">
            <div class="settingsSection">
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
          </div>
          
          <div id="audioTab" class="tabPanel">
            <div class="settingsSection">
              <div class="settingItem">
                <label>Output Device</label>
                <div class="deviceContainer">
                  <select id="audioDevice" class="settingsSelect">
                    <option value="default">Default Device</option>
                  </select>
                </div>
              </div>
              
              <div class="settingItem">
                <label>Master Volume</label>
                <div class="volumeContainer">
                  <input type="range" id="masterVolume" class="volumeSlider" min="0" max="100" value="100">
                  <span class="volumeValue" id="masterVolumeValue">100%</span>
                </div>
              </div>
              
              <div class="settingItem">
                <label>Music Volume</label>
                <div class="volumeContainer">
                  <input type="range" id="musicVolume" class="volumeSlider" min="0" max="100" value="80">
                  <span class="volumeValue" id="musicVolumeValue">80%</span>
                </div>
              </div>
              
              <div class="settingItem">
                <label>SFX Volume</label>
                <div class="volumeContainer">
                  <input type="range" id="sfxVolume" class="volumeSlider" min="0" max="100" value="90">
                  <span class="volumeValue" id="sfxVolumeValue">90%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div id="displayTab" class="tabPanel">
            <div class="settingsSection">
              <div class="settingItem">
                <label>Display Mode</label>
                <div class="displayModeContainer">
                  <select id="displayMode" class="settingsSelect">
                    <option value="windowed">Windowed</option>
                    <option value="borderless">Borderless</option>
                    <option value="fullscreen">Fullscreen</option>
                  </select>
                </div>
              </div>
              
              <div class="settingItem">
                <label>Show FPS</label>
                <div class="toggleContainer">
                  <input type="checkbox" id="fpsToggle" class="toggleSwitch">
                  <label for="fpsToggle" class="toggleLabel"></label>
                </div>
              </div>
            </div>
          </div>
          
          <div id="otherTab" class="tabPanel">
            <div class="settingsSection">
              <div class="settingItem">
                <label>Discord</label>
                <div class="discordContainer">
                  <button id="discordButton" class="discordIconButton">
                    <div class="discordLogo"></div>
                  </button>
                </div>
              </div>
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

    // Global ESC key listener for settings
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Only handle escape if character menu is visible
        const characterMenu = document.getElementById('characterMenu');
        if (characterMenu && characterMenu.style.display !== 'none') {
          this.toggleSettings();
        }
      }
    });

    // Close button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'closeSettings') {
        this.closeSettings();
      }
    });

    // Tab switching
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('tabButton')) {
        this.switchTab(e.target.dataset.tab);
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

    // Volume sliders
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('volumeSlider')) {
        this.updateVolumeDisplay(e.target);
        // Update volume in real-time
        this.updateVolumeInRealTime(e.target);
      }
    });

    // Apply settings
    document.addEventListener('click', (e) => {
      if (e.target.id === 'applySettings') {
        this.applySettings();
      }
    });

    // Discord button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'discordButton') {
        this.openDiscord();
      }
    });

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) {
        this.closeSettings();
      }
    });

    // --- CONTROLLER SUPPORT ---
    let lastR1 = false;
    let lastL1 = false;
    let lastStart = false;
    const tabOrder = ['game', 'audio', 'display', 'other'];
    
    const pollControllerInput = () => {
      // Check for settings button press (Start button)
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (let i = 0; i < 2; i++) {
        const gp = gamepads[i];
        if (!gp || gp.mapping !== 'standard') continue;
        
        const btnStart = gp.buttons[9]?.pressed; // Start button
        
        // Toggle settings with Start button when character menu is visible
        if (btnStart && !lastStart) {
          const characterMenu = document.getElementById('characterMenu');
          if (characterMenu && characterMenu.style.display !== 'none') {
            this.toggleSettings();
          }
        }
        lastStart = btnStart;
      }
      
            // Only poll for tab switching if settings modal is open
      if (this.settingsModal && this.settingsModal.style.display !== 'none') {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < 2; i++) {
          const gp = gamepads[i];
          if (!gp || gp.mapping !== 'standard') continue;
          const btnL1 = gp.buttons[4]?.pressed;
          const btnR1 = gp.buttons[5]?.pressed;
          // Find current tab
          const activeTabBtn = document.querySelector('.tabButton.active');
          let currentTab = activeTabBtn ? activeTabBtn.dataset.tab : 'game';
          let idx = tabOrder.indexOf(currentTab);
          // L1 = left
          if (btnL1 && !lastL1 && idx > 0) {
            this.switchTab(tabOrder[idx - 1]);
          }
          // R1 = right
          if (btnR1 && !lastR1 && idx < tabOrder.length - 1) {
            this.switchTab(tabOrder[idx + 1]);
          }
          lastL1 = btnL1;
          lastR1 = btnR1;
        }
      }
      requestAnimationFrame(pollControllerInput);
    };
    requestAnimationFrame(pollControllerInput);
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
    const displayMode = document.getElementById('displayMode');
    const fpsToggle = document.getElementById('fpsToggle');
    const audioDevice = document.getElementById('audioDevice');
    
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
    
    if (displayMode) {
      displayMode.value = this.gameSettings.displayMode;
    }
    
    if (fpsToggle) {
      fpsToggle.checked = this.gameSettings.showFPS;
    }
    
    if (audioDevice) {
      audioDevice.value = this.gameSettings.audioDevice;
    }
    
    // Update volume sliders and displays
    const masterVolumeSlider = document.getElementById('masterVolume');
    const musicVolumeSlider = document.getElementById('musicVolume');
    const sfxVolumeSlider = document.getElementById('sfxVolume');
    
    if (masterVolumeSlider) {
      masterVolumeSlider.value = this.gameSettings.masterVolume;
      this.updateVolumeDisplay(masterVolumeSlider);
    }
    
    if (musicVolumeSlider) {
      musicVolumeSlider.value = this.gameSettings.musicVolume;
      this.updateVolumeDisplay(musicVolumeSlider);
    }
    
    if (sfxVolumeSlider) {
      sfxVolumeSlider.value = this.gameSettings.sfxVolume;
      this.updateVolumeDisplay(sfxVolumeSlider);
    }
  }

  applySettings() {
    // Read lives value from input field
    const livesInput = document.getElementById('livesInput');
    
    if (livesInput) {
      this.gameSettings.lives = parseInt(livesInput.value) || 3;
    }
    
    // Read display settings
    const displayMode = document.getElementById('displayMode');
    const fpsToggle = document.getElementById('fpsToggle');
    
    if (displayMode) {
      this.gameSettings.displayMode = displayMode.value;
    }
    
    if (fpsToggle) {
      this.gameSettings.showFPS = fpsToggle.checked;
    }
    
    // Read audio device setting
    const audioDevice = document.getElementById('audioDevice');
    if (audioDevice) {
      this.gameSettings.audioDevice = audioDevice.value;
    }
    
    // Read volume settings
    const masterVolumeSlider = document.getElementById('masterVolume');
    const musicVolumeSlider = document.getElementById('musicVolume');
    const sfxVolumeSlider = document.getElementById('sfxVolume');
    
    if (masterVolumeSlider) {
      this.gameSettings.masterVolume = parseInt(masterVolumeSlider.value) || 100;
    }
    
    if (musicVolumeSlider) {
      this.gameSettings.musicVolume = parseInt(musicVolumeSlider.value) || 80;
    }
    
    if (sfxVolumeSlider) {
      this.gameSettings.sfxVolume = parseInt(sfxVolumeSlider.value) || 90;
    }
    
    // Update window variables
    window.gameTimer = this.gameSettings.timer;
    window.gameLives = this.gameSettings.lives;
    window.displayMode = this.gameSettings.displayMode;
    window.showFPS = this.gameSettings.showFPS;
    window.audioDevice = this.gameSettings.audioDevice;
    window.masterVolume = this.gameSettings.masterVolume;
    window.musicVolume = this.gameSettings.musicVolume;
    window.sfxVolume = this.gameSettings.sfxVolume;
    
    // Apply display mode immediately
    this.applyDisplayMode();
    
    // Update audio volume
    this.updateAudioVolume();
    
    // Update character menu display
    this.updateCharacterMenuDisplay();
    
    // Close settings
    this.closeSettings();
    

  }

  applyDisplayMode() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    switch (this.gameSettings.displayMode) {
      case 'fullscreen':
        this.enterFullscreen();
        break;
      case 'borderless':
        this.enterBorderless();
        break;
      case 'windowed':
        this.exitFullscreen();
        break;
    }
  }

  enterFullscreen() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    if (canvas.requestFullscreen) {
      canvas.requestFullscreen();
    } else if (canvas.webkitRequestFullscreen) {
      canvas.webkitRequestFullscreen();
    } else if (canvas.msRequestFullscreen) {
      canvas.msRequestFullscreen();
    }
  }

  enterBorderless() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    // Exit fullscreen first if in fullscreen
    this.exitFullscreen();
    
    // Set canvas to fill the entire screen
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.border = 'none';
  }

  exitFullscreen() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    // Exit fullscreen if in fullscreen mode
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    
    // Reset canvas to normal windowed mode
    canvas.style.position = 'relative';
    canvas.style.top = '';
    canvas.style.left = '';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.border = '8px solid white';
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
      lives: this.gameSettings.lives,
      displayMode: this.gameSettings.displayMode,
      showFPS: this.gameSettings.showFPS,
      audioDevice: this.gameSettings.audioDevice,
      masterVolume: this.gameSettings.masterVolume,
      musicVolume: this.gameSettings.musicVolume,
      sfxVolume: this.gameSettings.sfxVolume
    };
  }
  
  // Update audio volume based on settings
  updateAudioVolume() {
    // Direct check for 0% volume first
    if (this.gameSettings.masterVolume === 0 || this.gameSettings.musicVolume === 0) {
      console.log('Volume is 0%, forcing mute');
      if (window.audioManager && typeof window.audioManager.forceMute === 'function') {
        window.audioManager.forceMute();
      }
      return;
    }
    
    // Calculate effective music volume (master volume * music volume / 100)
    const effectiveMusicVolume = (this.gameSettings.masterVolume * this.gameSettings.musicVolume) / 100;
    const normalizedMusicVolume = effectiveMusicVolume / 100; // Convert to 0.0-1.0 range
    
    console.log(`updateAudioVolume called - Master: ${this.gameSettings.masterVolume}%, Music: ${this.gameSettings.musicVolume}%, Effective: ${effectiveMusicVolume.toFixed(1)}%, Normalized: ${normalizedMusicVolume.toFixed(3)}`);
    
    // Update audio manager if it exists
    if (window.audioManager && typeof window.audioManager.setMusicVolume === 'function') {
      console.log('Calling audioManager.setMusicVolume...');
      window.audioManager.setMusicVolume(normalizedMusicVolume);
    } else {
      console.warn('Audio manager not available');
    }
    
    console.log(`Audio volume updated - Master: ${this.gameSettings.masterVolume}%, Music: ${this.gameSettings.musicVolume}%, Effective: ${effectiveMusicVolume.toFixed(1)}%`);
  }
  
  // Update volume in real-time when sliders are moved
  updateVolumeInRealTime(slider) {
    // Update the corresponding setting based on which slider was moved
    if (slider.id === 'masterVolume') {
      this.gameSettings.masterVolume = parseInt(slider.value) || 100;
    } else if (slider.id === 'musicVolume') {
      this.gameSettings.musicVolume = parseInt(slider.value) || 80;
    } else if (slider.id === 'sfxVolume') {
      this.gameSettings.sfxVolume = parseInt(slider.value) || 90;
    }
    
    // Check if either master volume or music volume is 0%
    if (this.gameSettings.masterVolume === 0 || this.gameSettings.musicVolume === 0) {
      console.log('Volume is 0%, forcing mute');
      if (window.audioManager && typeof window.audioManager.forceMute === 'function') {
        window.audioManager.forceMute();
      }
    } else {
      // Update audio volume normally
      this.updateAudioVolume();
    }
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

  switchTab(tabName) {
    // Remove active class from all tabs and panels
    document.querySelectorAll('.tabButton').forEach(button => {
      button.classList.remove('active');
    });
    document.querySelectorAll('.tabPanel').forEach(panel => {
      panel.classList.remove('active');
    });
    
    // Add active class to selected tab and panel
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
  }

  updateVolumeDisplay(slider) {
    const valueDisplay = document.getElementById(`${slider.id}Value`);
    if (valueDisplay) {
      valueDisplay.textContent = `${slider.value}%`;
    }
  }

  openDiscord() {
    // Open Discord invite link in a new tab
    window.open('https://discord.gg/KGfQQCcWkx', '_blank');
  }
}

// Initialize settings when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.settings = new Settings();
});

// Export for potential use in other modules
export { Settings }; 