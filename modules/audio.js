// modules/audio.js - Audio management system

class AudioManager {
  constructor() {
    this.backgroundMusic = null;
    this.isMusicLoaded = false;
    this.isMusicPlaying = false;
    
    // Get initial volume from settings or use defaults
    const masterVolume = window.masterVolume || 100;
    const musicVolume = window.musicVolume || 80;
    const effectiveMusicVolume = (masterVolume * musicVolume) / 100;
    this.musicVolume = effectiveMusicVolume / 100; // Convert to 0.0-1.0 range
    
    console.log(`AudioManager initialized - Master: ${masterVolume}%, Music: ${musicVolume}%, Effective: ${effectiveMusicVolume.toFixed(1)}%, Normalized: ${this.musicVolume.toFixed(3)}`);
    
    // Initialize the audio context and music
    this.initAudio();
  }

  initAudio() {
    try {
      // Create audio element for background music
      this.backgroundMusic = new Audio();
      this.backgroundMusic.src = 'assets/music/screenMusic.mp3';
      this.backgroundMusic.loop = true; // Loop the music
      this.backgroundMusic.volume = this.musicVolume;
      this.backgroundMusic.preload = 'auto';
      
      // Handle music loading
      this.backgroundMusic.addEventListener('canplaythrough', () => {
        this.isMusicLoaded = true;
        console.log('Background music loaded successfully');
      });
      
      // Handle music errors
      this.backgroundMusic.addEventListener('error', (e) => {
        console.error('Error loading background music:', e);
        this.isMusicLoaded = false;
      });
      
      // Handle music end (for non-looping scenarios)
      this.backgroundMusic.addEventListener('ended', () => {
        this.isMusicPlaying = false;
      });
      
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }

  // Start playing background music
  playMusic() {
    if (this.backgroundMusic && this.isMusicLoaded) {
      try {
        // Reset to beginning and play
        this.backgroundMusic.currentTime = 0;
        
        // Only play if volume is not 0
        if (this.musicVolume > 0) {
          this.backgroundMusic.play().then(() => {
            this.isMusicPlaying = true;
            console.log('Background music started playing');
          }).catch(error => {
            console.error('Error playing music:', error);
            this.isMusicPlaying = false;
          });
        } else {
          // If volume is 0, don't play but mark as ready
          this.isMusicPlaying = false;
          console.log('Music ready but muted (volume is 0)');
        }
      } catch (error) {
        console.error('Error playing music:', error);
        this.isMusicPlaying = false;
      }
    } else {
      console.warn('Music not loaded yet, cannot play');
    }
  }

  // Stop playing background music
  stopMusic() {
    if (this.backgroundMusic && this.isMusicPlaying) {
      try {
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
        this.isMusicPlaying = false;
        console.log('Background music stopped');
      } catch (error) {
        console.error('Error stopping music:', error);
      }
    }
  }

  // Restart music (stop and start again)
  restartMusic() {
    this.stopMusic();
    // Small delay to ensure stop completes
    setTimeout(() => {
      this.playMusic();
    }, 100);
  }

  // Set music volume (0.0 to 1.0)
  setMusicVolume(volume) {
    const oldVolume = this.musicVolume;
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    console.log(`setMusicVolume called - Old: ${oldVolume.toFixed(3)}, New: ${this.musicVolume.toFixed(3)}, Volume param: ${volume.toFixed(3)}`);
    
    if (this.backgroundMusic) {
      // Force the volume to be set and verify it
      this.backgroundMusic.volume = this.musicVolume;
      
      // Double-check that the volume was actually set
      setTimeout(() => {
        const actualVolume = this.backgroundMusic.volume;
        console.log(`Audio element volume verification - Expected: ${this.musicVolume.toFixed(3)}, Actual: ${actualVolume.toFixed(3)}`);
        
        if (Math.abs(actualVolume - this.musicVolume) > 0.001) {
          console.warn('Volume mismatch detected, forcing volume again');
          this.backgroundMusic.volume = this.musicVolume;
        }
      }, 10);
      
      console.log(`Audio element volume set to: ${this.backgroundMusic.volume.toFixed(3)}`);
      
      // If volume is 0, pause the music (mute it)
      if (this.musicVolume === 0) {
        console.log('Volume is 0, pausing music');
        this.backgroundMusic.pause();
        this.isMusicPlaying = false;
      } else if (this.isMusicLoaded && !this.isMusicPlaying) {
        // If volume is not 0 and music was previously playing, resume it
        console.log('Volume > 0, resuming music');
        this.backgroundMusic.play().then(() => {
          this.isMusicPlaying = true;
          console.log('Music resumed successfully');
        }).catch(error => {
          console.error('Error resuming music:', error);
          this.isMusicPlaying = false;
        });
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
  
  // Check if music should be playing (loaded and volume > 0)
  shouldBePlaying() {
    return this.isMusicLoaded && this.musicVolume > 0;
  }
  
  // Force mute the audio element
  forceMute() {
    if (this.backgroundMusic) {
      console.log('Force muting audio element');
      this.backgroundMusic.volume = 0;
      this.backgroundMusic.pause();
      this.isMusicPlaying = false;
      this.musicVolume = 0;
      
      // Double-check that it's actually muted
      setTimeout(() => {
        if (this.backgroundMusic.volume > 0) {
          console.warn('Volume still not 0, forcing again');
          this.backgroundMusic.volume = 0;
          this.backgroundMusic.pause();
        }
        console.log(`Final volume check: ${this.backgroundMusic.volume}`);
      }, 50);
    }
  }
  
  // Force unmute the audio element
  forceUnmute(volume) {
    if (this.backgroundMusic) {
      console.log(`Force unmuting audio element with volume: ${volume}`);
      this.musicVolume = Math.max(0, Math.min(1, volume));
      this.backgroundMusic.volume = this.musicVolume;
      if (this.isMusicLoaded && this.musicVolume > 0) {
        this.backgroundMusic.play().then(() => {
          this.isMusicPlaying = true;
        }).catch(error => {
          console.error('Error resuming music:', error);
          this.isMusicPlaying = false;
        });
      }
    }
  }
}

// Create global audio manager instance
const audioManager = new AudioManager();

// Make audio manager globally available
window.audioManager = audioManager;

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

// Export for use in other modules
export { audioManager }; 