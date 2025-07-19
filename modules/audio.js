// modules/audio.js - Audio management system

class AudioManager {
  constructor() {
    this.backgroundMusic = null;
    this.isMusicLoaded = false;
    this.isMusicPlaying = false;
    this.audioContext = null;
    this.userHasInteracted = false;
    this.isStartingMusic = false; // Prevent multiple simultaneous start attempts
    
    // Get initial volume from settings or use defaults
    const masterVolume = window.masterVolume || 100;
    const musicVolume = window.musicVolume || 50;
    const effectiveMusicVolume = (masterVolume * musicVolume) / 100;
    this.musicVolume = effectiveMusicVolume / 100;
    
    console.log(`AudioManager initialized - Master: ${masterVolume}%, Music: ${musicVolume}%, Effective: ${effectiveMusicVolume.toFixed(1)}%, Normalized: ${this.musicVolume.toFixed(3)}`);
    
    // Initialize the audio context and music
    this.initAudio();
    
    // Listen for first user interaction
    this.setupUserInteractionListener();
  }

  setupUserInteractionListener() {
    const handleUserInteraction = () => {
      if (!this.userHasInteracted) {
        this.userHasInteracted = true;
        console.log('First user interaction detected, creating AudioContext and ensuring music plays');
        
        // Create AudioContext after user interaction
        this.createAudioContext();
        
        // Try to start music if it's not playing
        if (!this.isMusicPlaying && this.shouldBePlaying()) {
          this.startMusic();
        }
        
        // Remove listeners after first interaction
        ['click', 'keydown', 'touchstart'].forEach(eventType => {
          document.removeEventListener(eventType, handleUserInteraction);
        });
      }
    };

    // Listen for user interactions
    ['click', 'keydown', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, handleUserInteraction, { once: false });
    });
  }

  initAudio() {
    try {
      // Create audio element for background music
      this.backgroundMusic = new Audio();
      this.backgroundMusic.src = 'assets/music/screenMusic.mp3';
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = this.musicVolume;
      this.backgroundMusic.preload = 'auto';
      
      // Handle music loading
      this.backgroundMusic.addEventListener('canplaythrough', () => {
        this.isMusicLoaded = true;
        console.log('Background music loaded successfully');
        
        // Only start music if user has interacted and not already playing
        if (this.userHasInteracted && !this.isMusicPlaying && !this.isStartingMusic) {
          this.startMusic();
        }
      });
      
      // Handle music errors
      this.backgroundMusic.addEventListener('error', (e) => {
        console.error('Error loading background music:', e);
        this.isMusicLoaded = false;
      });
      
      // Handle music end
      this.backgroundMusic.addEventListener('ended', () => {
        this.isMusicPlaying = false;
      });
      
      // Handle play event
      this.backgroundMusic.addEventListener('play', () => {
        this.isMusicPlaying = true;
        this.isStartingMusic = false;
      });
      
      // Handle pause event
      this.backgroundMusic.addEventListener('pause', () => {
        this.isMusicPlaying = false;
      });
      
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }

  // Create AudioContext after user interaction
  createAudioContext() {
    if (!this.audioContext && (window.AudioContext || window.webkitAudioContext)) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('AudioContext created after user interaction');
    }
  }

  // Main method to start music - this is the single trigger
  startMusic() {
    // Only start music if user has interacted
    if (!this.userHasInteracted) {
      console.log('Cannot start music - user has not interacted yet');
      return;
    }
    
    // Prevent multiple simultaneous start attempts
    if (this.isStartingMusic) {
      return;
    }
    
    this.isStartingMusic = true;
    
    // Resume audio context if suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        this.attemptPlay();
      }).catch(error => {
        console.error('Failed to resume audio context:', error);
        this.attemptPlay();
      });
    } else {
      this.attemptPlay();
    }
  }

  // Attempt to play the music
  attemptPlay() {
    if (!this.backgroundMusic || !this.isMusicLoaded) {
      this.isStartingMusic = false;
      return;
    }

    if (this.musicVolume <= 0) {
      this.isStartingMusic = false;
      return;
    }

    try {
      // Reset to beginning and play
      this.backgroundMusic.currentTime = 0;
      this.backgroundMusic.volume = this.musicVolume;
      
      this.backgroundMusic.play().then(() => {
        console.log('Background music started playing successfully');
        this.isMusicPlaying = true;
        this.isStartingMusic = false;
      }).catch(error => {
        console.error('Error playing music:', error);
        this.isMusicPlaying = false;
        this.isStartingMusic = false;
        
        // If autoplay blocked, try muted approach
        if (error.name === 'NotAllowedError') {
          this.backgroundMusic.muted = true;
          this.backgroundMusic.play().then(() => {
            this.backgroundMusic.muted = false;
            this.isMusicPlaying = true;
            this.isStartingMusic = false;
          }).catch(muteError => {
            this.isStartingMusic = false;
          });
        }
      });
    } catch (error) {
      console.error('Error in attemptPlay:', error);
      this.isMusicPlaying = false;
      this.isStartingMusic = false;
    }
  }

  // Restart music (used after games)
  restartMusic() {
    console.log('Restarting music...');
    this.stopMusic();
    setTimeout(() => {
      this.startMusic();
    }, 100);
  }

  // Stop music
  stopMusic() {
    if (this.backgroundMusic && this.isMusicPlaying) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
      this.isMusicPlaying = false;
      console.log('Music stopped');
    }
  }

  // Debug method to check audio status
  debugStatus() {
    console.log('=== Audio Debug Status ===');
    console.log(`isMusicLoaded: ${this.isMusicLoaded}`);
    console.log(`isMusicPlaying: ${this.isMusicPlaying}`);
    console.log(`musicVolume: ${this.musicVolume}`);
    console.log(`userHasInteracted: ${this.userHasInteracted}`);
    
    if (this.backgroundMusic) {
      console.log(`Audio element readyState: ${this.backgroundMusic.readyState}`);
      console.log(`Audio element networkState: ${this.backgroundMusic.networkState}`);
      console.log(`Audio element currentTime: ${this.backgroundMusic.currentTime}`);
      console.log(`Audio element volume: ${this.backgroundMusic.volume}`);
      console.log(`Audio element paused: ${this.backgroundMusic.paused}`);
      console.log(`Audio element src: ${this.backgroundMusic.src}`);
      console.log(`Audio element error: ${this.backgroundMusic.error ? this.backgroundMusic.error.message : 'None'}`);
    } else {
      console.log('No audio element');
    }
    
    if (this.audioContext) {
      console.log(`Audio context state: ${this.audioContext.state}`);
    } else {
      console.log('No audio context');
    }
    console.log('========================');
  }

  // Force restart music (for debugging)
  forceRestart() {
    console.log('Force restarting music...');
    this.isMusicLoaded = false;
    this.isMusicPlaying = false;
    
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
      this.backgroundMusic.load(); // Reload the audio
    }
    
    setTimeout(() => {
      this.startMusic();
    }, 500);
  }

  // Set music volume
  setMusicVolume(volume) {
    const oldVolume = this.musicVolume;
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    console.log(`setMusicVolume called - Old: ${oldVolume.toFixed(3)}, New: ${this.musicVolume.toFixed(3)}`);
    
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume;
      
      // If volume is 0, pause the music immediately and don't try to restart
      if (this.musicVolume === 0) {
        console.log('Volume set to 0, pausing music');
        this.backgroundMusic.pause();
        this.isMusicPlaying = false;
        this.isStartingMusic = false; // Prevent any restart attempts
      } else if (this.isMusicLoaded && !this.isMusicPlaying && this.userHasInteracted) {
        // Only resume if volume is greater than 0
        this.startMusic();
      }
    }
  }

  // Get current music volume
  getMusicVolume() {
    return this.musicVolume;
  }

  // Check if music is currently playing
  isPlaying() {
    return this.isMusicPlaying;
  }

  // Check if music is loaded
  isLoaded() {
    return this.isMusicLoaded;
  }
  
  // Check if music should be playing
  shouldBePlaying() {
    return this.isMusicLoaded && this.musicVolume > 0;
  }
  
  // Force mute
  forceMute() {
    console.log('Force muting audio...');
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = 0;
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
      this.isMusicPlaying = false;
      this.musicVolume = 0;
      
      // Double-check that it's actually muted
      setTimeout(() => {
        if (this.backgroundMusic && this.backgroundMusic.volume > 0) {
          console.log('Volume still not 0, forcing again');
          this.backgroundMusic.volume = 0;
          this.backgroundMusic.pause();
        }
      }, 10);
    }
  }
  
  // Force unmute
  forceUnmute(volume) {
    if (this.backgroundMusic) {
      this.musicVolume = Math.max(0, Math.min(1, volume));
      this.backgroundMusic.volume = this.musicVolume;
      if (this.isMusicLoaded && this.musicVolume > 0) {
        this.startMusic();
      }
    }
  }
}

// Create global audio manager instance
const audioManager = new AudioManager();

// Make audio manager globally available
window.audioManager = audioManager;

// Add global debug commands
window.debugAudio = () => {
  if (audioManager) {
    audioManager.debugStatus();
  } else {
    console.log('AudioManager not available');
  }
};

window.forceRestartAudio = () => {
  if (audioManager) {
    audioManager.forceRestart();
  } else {
    console.log('AudioManager not available');
  }
};

window.startAudio = () => {
  if (audioManager) {
    audioManager.startMusic();
  } else {
    console.log('AudioManager not available');
  }
};

// Update volume when settings are ready
window.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for settings to initialize
  setTimeout(() => {
    if (window.settings && typeof window.settings.updateAudioVolume === 'function') {
      console.log('Settings ready, updating audio volume...');
      window.settings.updateAudioVolume();
    }
  }, 500);
});

// Add a fallback mechanism to ensure audio plays
window.addEventListener('startupComplete', () => {
  console.log('Startup complete, ensuring audio is ready...');
  if (audioManager && !audioManager.isPlaying() && audioManager.shouldBePlaying()) {
    console.log('Audio should be playing but isn\'t, attempting to start...');
    audioManager.startMusic();
  }
});

// Export for use in other modules
export { audioManager }; 