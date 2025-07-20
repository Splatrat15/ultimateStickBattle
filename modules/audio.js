// modules/audio.js - Audio management system

class AudioManager {
  constructor() {
    this.backgroundMusic = null;
    this.battleMusic = null;
    this.isMusicLoaded = false;
    this.isBattleMusicLoaded = false;
    this.isMusicPlaying = false;
    this.isBattleMusicPlaying = false;
    this.audioContext = null;
    this.userHasInteracted = false;
    this.isStartingMusic = false; // Prevent multiple simultaneous start attempts
    
    // Sound effects
    this.soundEffects = {};
    this.sfxVolume = 0.9; // Default SFX volume
    
    // Battle music shuffle system
    this.battleMusicPlaylist = [
      'assets/battleMusic/8-bit-space-123218.mp3',
      'assets/battleMusic/epic-battle-153400.mp3',
      'assets/battleMusic/8-bit-chiptune-action-music-for-video-games-329940.mp3',
      'assets/battleMusic/retro-8bit-happy-videogame-music-243997.mp3',
      'assets/battleMusic/pixify-230092.mp3',
      'assets/battleMusic/pixel-dreams-259187.mp3',
      'assets/battleMusic/palabras-perdidas-en-8-bits-263566.mp3',
      'assets/battleMusic/026491_pixel-song-8-72675.mp3'
    ];
    this.battleMusicQueue = []; // Current shuffle queue
    this.currentBattleSongIndex = 0;
    
    // Get initial volume from settings or use defaults
    const masterVolume = window.masterVolume || 100;
    const musicVolume = window.musicVolume || 35;
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
      
      // Create audio element for battle music
      this.battleMusic = new Audio();
      this.battleMusic.loop = false; // Don't loop individual songs
      this.battleMusic.volume = this.musicVolume;
      this.battleMusic.preload = 'auto';
      
      // Initialize battle music queue
      this.shuffleBattleMusic();
      
      // Load sound effects
      this.loadSoundEffect('demonBreathing', 'assets/sounds/mixkit-creepy-demon-heavy-breathing-2240.wav');
      this.loadSoundEffect('metalHitWoosh', 'assets/sounds/mixkit-metal-hit-woosh-1485.wav');
      this.loadSoundEffect('daggerWoosh', 'assets/sounds/mixkit-dagger-woosh-1487.wav');
      this.loadSoundEffect('swordStrikesArmor', 'assets/sounds/mixkit-sword-strikes-armor-2765.wav');
      
      // Handle background music loading
      this.backgroundMusic.addEventListener('canplaythrough', () => {
        this.isMusicLoaded = true;
        console.log('Background music loaded successfully');
        
        // Only start music if user has interacted and not already playing
        if (this.userHasInteracted && !this.isMusicPlaying && !this.isStartingMusic) {
          this.startMusic();
        }
      });
      
      // Handle battle music loading
      this.battleMusic.addEventListener('canplaythrough', () => {
        this.isBattleMusicLoaded = true;
        console.log('Battle music loaded successfully');
      });
      
      // Handle battle music ending - play next song
      this.battleMusic.addEventListener('ended', () => {
        console.log('Battle music ended, playing next song');
        this.playNextBattleSong();
      });
      
      // Handle music errors
      this.backgroundMusic.addEventListener('error', (e) => {
        console.error('Error loading background music:', e);
        this.isMusicLoaded = false;
      });
      
      this.battleMusic.addEventListener('error', (e) => {
        console.error('Error loading battle music:', e);
        this.isBattleMusicLoaded = false;
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
      
      this.battleMusic.addEventListener('play', () => {
        this.isBattleMusicPlaying = true;
      });
      
      // Handle pause event
      this.backgroundMusic.addEventListener('pause', () => {
        this.isMusicPlaying = false;
      });
      
      this.battleMusic.addEventListener('pause', () => {
        this.isBattleMusicPlaying = false;
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

  // Restart music
  restartMusic() {
    console.log('Restarting background music...');
    
    // Stop battle music first
    this.stopBattleMusic();
    
    // Recreate background music element if it was destroyed
    if (!this.backgroundMusic) {
      console.log('Recreating background music element...');
      this.backgroundMusic = new Audio();
      this.backgroundMusic.src = 'assets/music/screenMusic.mp3';
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = this.musicVolume;
      this.backgroundMusic.preload = 'auto';
      
      // Re-add event listeners
      this.backgroundMusic.addEventListener('canplaythrough', () => {
        this.isMusicLoaded = true;
        console.log('Background music loaded successfully');
        
        // Only start music if user has interacted and not already playing
        if (this.userHasInteracted && !this.isMusicPlaying && !this.isStartingMusic) {
          this.startMusic();
        }
      });
      
      this.backgroundMusic.addEventListener('error', (e) => {
        console.error('Error loading background music:', e);
        this.isMusicLoaded = false;
      });
      
      this.backgroundMusic.addEventListener('ended', () => {
        this.isMusicPlaying = false;
      });
      
      this.backgroundMusic.addEventListener('play', () => {
        this.isMusicPlaying = true;
        this.isStartingMusic = false;
      });
      
      this.backgroundMusic.addEventListener('pause', () => {
        this.isMusicPlaying = false;
      });
    } else {
      // Just restore volume if element still exists
      this.backgroundMusic.volume = this.musicVolume;
    }
    
    // Reset the starting flag
    this.isStartingMusic = false;
    
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
    
    // Update both background and battle music volumes
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume;
    }
    
    if (this.battleMusic) {
      this.battleMusic.volume = this.musicVolume;
    }
    
    // If volume is 0, pause all music immediately and don't try to restart
    if (this.musicVolume === 0) {
      console.log('Volume set to 0, pausing all music');
      if (this.backgroundMusic) {
        this.backgroundMusic.pause();
        this.isMusicPlaying = false;
      }
      if (this.battleMusic) {
        this.battleMusic.pause();
        this.isBattleMusicPlaying = false;
      }
      this.isStartingMusic = false; // Prevent any restart attempts
    } else if (this.isMusicLoaded && !this.isMusicPlaying && !this.isBattleMusicPlaying && this.userHasInteracted) {
      // Only resume background music if no music is playing and volume is greater than 0
      this.startMusic();
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
    }
    
    if (this.battleMusic) {
      this.battleMusic.volume = 0;
      this.battleMusic.pause();
      this.battleMusic.currentTime = 0;
      this.isBattleMusicPlaying = false;
    }
    
    this.musicVolume = 0;
    
    // Double-check that it's actually muted
    setTimeout(() => {
      if (this.backgroundMusic && this.backgroundMusic.volume > 0) {
        console.log('Background music volume still not 0, forcing again');
        this.backgroundMusic.volume = 0;
        this.backgroundMusic.pause();
      }
      if (this.battleMusic && this.battleMusic.volume > 0) {
        console.log('Battle music volume still not 0, forcing again');
        this.battleMusic.volume = 0;
        this.battleMusic.pause();
      }
    }, 10);
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

  // Shuffle battle music playlist
  shuffleBattleMusic() {
    // Create a copy of the playlist and shuffle it
    this.battleMusicQueue = [...this.battleMusicPlaylist];
    
    // Fisher-Yates shuffle algorithm
    for (let i = this.battleMusicQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.battleMusicQueue[i], this.battleMusicQueue[j]] = [this.battleMusicQueue[j], this.battleMusicQueue[i]];
    }
    
    this.currentBattleSongIndex = 0;
    console.log('Battle music playlist shuffled');
  }

  // Force stop background music (more aggressive than stopMusic)
  forceStopBackgroundMusic() {
    console.log('Force stopping background music...');
    if (this.backgroundMusic) {
      // Set volume to 0 first to immediately silence it
      this.backgroundMusic.volume = 0;
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
      this.isMusicPlaying = false;
      this.isStartingMusic = false; // Prevent any restart attempts
      
      // Try to stop it more aggressively
      try {
        this.backgroundMusic.stop && this.backgroundMusic.stop();
      } catch (e) {
        console.log('stop() method not available, using alternative approach');
      }
      
      // Double-check after a short delay
      setTimeout(() => {
        if (this.backgroundMusic && !this.backgroundMusic.paused) {
          console.log('Background music still playing, forcing pause again');
          this.backgroundMusic.pause();
          this.backgroundMusic.currentTime = 0;
          this.backgroundMusic.volume = 0;
        }
      }, 50);
      
      console.log('Background music force stopped');
    }
  }

  // Nuclear option - completely destroy and recreate background music
  nuclearStopBackgroundMusic() {
    console.log('NUCLEAR: Completely destroying background music element...');
    
    if (this.backgroundMusic) {
      // Remove all event listeners
      this.backgroundMusic.oncanplaythrough = null;
      this.backgroundMusic.onerror = null;
      this.backgroundMusic.onended = null;
      this.backgroundMusic.onplay = null;
      this.backgroundMusic.onpause = null;
      
      // Try to stop it
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
      this.backgroundMusic.volume = 0;
      
      // Remove from DOM if it was added
      if (this.backgroundMusic.parentNode) {
        this.backgroundMusic.parentNode.removeChild(this.backgroundMusic);
      }
      
      // Nullify the reference
      this.backgroundMusic = null;
      this.isMusicLoaded = false;
      this.isMusicPlaying = false;
      this.isStartingMusic = false;
      
      console.log('Background music element destroyed');
    }
  }

  // Start battle music
  startBattleMusic() {
    if (!this.userHasInteracted) {
      console.log('Cannot start battle music - user has not interacted yet');
      return;
    }
    
    console.log('Starting battle music...');
    
    // Nuclear option - completely destroy background music
    this.nuclearStopBackgroundMusic();
    
    // Ensure battle music is loaded
    if (!this.isBattleMusicLoaded) {
      console.log('Battle music not loaded yet, loading first song...');
      // Load the first song to initialize battle music
      if (this.battleMusicQueue.length > 0) {
        this.battleMusic.src = this.battleMusicQueue[0];
        this.battleMusic.load();
      }
    }
    
    // Start battle music
    this.playNextBattleSong();
  }

  // Play next battle song
  playNextBattleSong() {
    if (!this.battleMusic) {
      console.log('Battle music element not available');
      return;
    }

    if (this.musicVolume <= 0) {
      console.log('Music volume is 0, not playing battle music');
      return;
    }

    // If we've played all songs, reshuffle
    if (this.currentBattleSongIndex >= this.battleMusicQueue.length) {
      console.log('All battle songs played, reshuffling...');
      this.shuffleBattleMusic();
    }

    try {
      const currentSong = this.battleMusicQueue[this.currentBattleSongIndex];
      console.log(`Playing battle song ${this.currentBattleSongIndex + 1}/${this.battleMusicQueue.length}: ${currentSong}`);
      
      this.battleMusic.src = currentSong;
      this.battleMusic.volume = this.musicVolume;
      this.battleMusic.currentTime = 0;
      
      // Load the audio before playing
      this.battleMusic.load();
      
      this.battleMusic.play().then(() => {
        console.log('Battle music started playing successfully');
        this.isBattleMusicPlaying = true;
        this.currentBattleSongIndex++;
      }).catch(error => {
        console.error('Error playing battle music:', error);
        this.isBattleMusicPlaying = false;
        
        // If autoplay blocked, try muted approach
        if (error.name === 'NotAllowedError') {
          this.battleMusic.muted = true;
          this.battleMusic.play().then(() => {
            this.battleMusic.muted = false;
            this.isBattleMusicPlaying = true;
            this.currentBattleSongIndex++;
          }).catch(muteError => {
            console.log('Battle music muted approach also failed:', muteError);
          });
        }
      });
    } catch (error) {
      console.error('Error in playNextBattleSong:', error);
      this.isBattleMusicPlaying = false;
    }
  }

  // Stop battle music
  stopBattleMusic() {
    if (this.battleMusic && this.isBattleMusicPlaying) {
      this.battleMusic.pause();
      this.battleMusic.currentTime = 0;
      this.isBattleMusicPlaying = false;
      console.log('Battle music stopped');
    }
  }

  // Restart battle music
  restartBattleMusic() {
    console.log('Restarting battle music...');
    this.stopBattleMusic();
    this.currentBattleSongIndex = 0; // Reset to beginning of current shuffle
    setTimeout(() => {
      this.startBattleMusic();
    }, 100);
  }

  // Load a sound effect
  loadSoundEffect(name, src) {
    if (this.soundEffects[name]) {
      return; // Already loaded
    }
    
    const audio = new Audio();
    audio.src = src;
    audio.volume = this.sfxVolume;
    audio.preload = 'auto';
    
    this.soundEffects[name] = audio;
  }

  // Play a sound effect
  playSoundEffect(name, volumeMultiplier = 1.0) {
    if (!this.userHasInteracted) {
      return null; // Don't play sounds before user interaction
    }
    
    const sound = this.soundEffects[name];
    if (!sound) {
      console.warn(`Sound effect '${name}' not loaded`);
      return null;
    }
    
    try {
      // Reset to beginning and play
      sound.currentTime = 0;
      sound.volume = this.sfxVolume * volumeMultiplier;
      sound.play().catch(error => {
        console.error(`Error playing sound effect '${name}':`, error);
      });
      return sound; // Return the audio element for control
    } catch (error) {
      console.error(`Error playing sound effect '${name}':`, error);
      return null;
    }
  }

  // Play sword slash sound effect at 35% volume
  playSwordSlashSound() {
    this.playSoundEffect('metalHitWoosh', 0.35);
  }

  // Play dagger woosh sound effect for light attacks
  playDaggerWooshSound() {
    this.playSoundEffect('daggerWoosh', 0.35);
  }

  // Play sword strikes armor sound effect for hits
  playSwordStrikesArmorSound() {
    this.playSoundEffect('swordStrikesArmor', 0.35);
  }

  // Stop a sound effect
  stopSoundEffect(name) {
    const sound = this.soundEffects[name];
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  // Set SFX volume
  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all loaded sound effects
    Object.values(this.soundEffects).forEach(sound => {
      sound.volume = this.sfxVolume;
    });
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

window.startBattleAudio = () => {
  if (audioManager) {
    audioManager.startBattleMusic();
  } else {
    console.log('AudioManager not available');
  }
};

window.stopBattleAudio = () => {
  if (audioManager) {
    audioManager.stopBattleMusic();
  } else {
    console.log('AudioManager not available');
  }
};

window.nuclearStopBackground = () => {
  if (audioManager) {
    audioManager.nuclearStopBackgroundMusic();
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