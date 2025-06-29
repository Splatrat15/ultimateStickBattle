// characters/Rakka/designRakka.js

// Initialize Rakka's visual state
export function initializeRakka(player) {
  player.shadowAfterimages = [];
  player.shadowSneak = {
    active: false,
    x: 0,
    y: 0,
    distance: 0,
    direction: 1
  };
  player.demonFangEffects = {
    mistParticles: [],
    chargeAngle: 0,
    originalX: 0,
    thrustDistance: 0
  };
  // Phantom Slash effects
  player.phantomSlashEffects = {
    shadowWings: {
      isActive: false,
      frame: 0,
      wingAngle: 0,
      wingFlapSpeed: 0.4
    },
    circlingBlade: {
      isActive: false,
      swingAngle: 0, // Current swing angle
      swingDirection: 1, // 1 for right, -1 for left
      bladeTrails: [],
      hitFrame: 0
    },
    // Demonic/shadow effects
    demonicAura: {
      isActive: false,
      intensity: 0,
      particles: []
    }
  };
  // Void Splitter effects
  player.voidSplitterEffects = {
    wave: {
      isActive: false,
      x: 0,
      y: 0,
      distance: 0,
      direction: 1,
      frame: 0,
      particles: [],
      lastHitTarget: null,
      hitCooldown: 0
    },
    groundSlam: {
      isActive: false,
      frame: 0,
      slamAngle: 0,
      shockwaveParticles: [],
      groundCrack: {
        isActive: false,
        frame: 0,
        width: 0
      }
    }
  };
  // Shadow Slice sword swing animation
  player.shadowSliceSwing = {
    isActive: false,
    frame: 0,
    maxFrames: 35, // Updated to match the new Shadow Slice duration
    angle: 0,
    startAngle: -Math.PI / 3, // Start angle (60 degrees back)
    endAngle: Math.PI / 3, // End angle (60 degrees forward)
    glowIntensity: 0,
    shadowTrails: [], // Array of shadow trail effects
    trailFrame: 0
  };
  // Rising Cut sword swing animation
  player.risingCutSwing = {
    isActive: false,
    frame: 0,
    maxFrames: 30, // Duration of the Rising Cut move
    angle: 0,
    startAngle: -Math.PI / 2, // Start angle (90 degrees up - from top of head)
    endAngle: Math.PI / 6, // End angle (30 degrees forward and down - higher on the side)
    glowIntensity: 0,
    shadowTrails: [], // Array of shadow trail effects
    trailFrame: 0
  };
  // Down Light sword swing animation
  player.downLightSwing = {
    isActive: false,
    frame: 0,
    maxFrames: 28, // Duration of the Down Light move
    angle: 0,
    startAngle: 0, // Will be set based on grounded/aerial state
    endAngle: 0, // Will be set based on grounded/aerial state
    glowIntensity: 0,
    shadowTrails: [], // Array of shadow trail effects
    trailFrame: 0,
    isGrounded: true // Track whether this was a grounded or aerial attack
  };
  player.sword = {
    length: 54,
    width: 7,
    color: '#222',
    hiltColor: '#a00',
    sheathColor: '#111',
    offsetX: 18,
    offsetY: 38
  };
  // Sword swing animation for Shadow Sneak
  player.swordSwing = {
    isActive: false,
    frame: 0,
    maxFrames: 18, // Increased from 12 to 18 frames for slower swing
    angle: 0,
    startAngle: -Math.PI / 2, // Start behind the player
    endAngle: Math.PI / 2, // End in front of the player
    glowIntensity: 0
  };
  // Slow down animation speed
  player.animation.speed = 8; // Update frame every 8 game frames instead of 4
  player.animation.numFrames = 4; // More frames for smoother animation
}

// Update Rakka's animation state (e.g., afterimages for shadowstep)
export function updateRakka(player) {
  // Handle Shadow Sneak charging and shadow movement
  if (player.isCharging && player.activeMove && player.activeMove.name === 'Shadow Sneak') {
    if (!player.shadowSneak.active) {
      // Initialize shadow position when starting charge
      player.shadowSneak.active = true;
      player.shadowSneak.x = player.x;
      player.shadowSneak.y = player.y;
      player.shadowSneak.distance = 0;
      player.shadowSneak.direction = player.facing;
    }
    
    // Move shadow forward while charging
    const shadow = player.activeMove.shadow;
    const maxDistance = shadow.maxDistance * (1 + (player.chargeLevel || 0) * player.activeMove.chargeScaling.distance);
    if (player.shadowSneak.distance < maxDistance) {
      player.shadowSneak.x += shadow.speed * player.shadowSneak.direction;
      player.shadowSneak.distance += shadow.speed;
    }
  } else if (player.isAttacking && player.activeMove && player.activeMove.name === 'Shadow Sneak') {
    // When attack is released, teleport to shadow position and create afterimages
    if (player.shadowSneak.active) {
      player.x = player.shadowSneak.x;
      player.shadowSneak.active = false;
      
      // Create afterimages for the teleport effect
      for (let i = 0; i < 3; i++) {
        player.shadowAfterimages.push({
          x: player.x - (player.shadowSneak.direction * i * 30),
          y: player.y,
          alpha: 0.5 - (i * 0.1),
          facing: player.facing
        });
      }
    }
  } else {
    // Reset shadow state when not charging or attacking
    player.shadowSneak.active = false;
  }

  // --- Shadow Slice (sideLight) shadow trail effect ---
  if (player.rakkaShadowSliceActive) {
    if (!player._shadowSliceTrailFrame) player._shadowSliceTrailFrame = 0;
    player._shadowSliceTrailFrame++;
    if (player._shadowSliceTrailFrame % 2 === 0) { // Every 2 frames
      player.shadowAfterimages.push({
        x: player.x,
        y: player.y,
        alpha: 0.5,
        facing: player.facing
      });
    }
    // Limit afterimages
    if (player.shadowAfterimages.length > 6) {
      player.shadowAfterimages.shift();
    }
    
    // Initialize Shadow Slice sword swing animation
    if (!player.shadowSliceSwing.isActive) {
      player.shadowSliceSwing.isActive = true;
      player.shadowSliceSwing.frame = 0;
      player.shadowSliceSwing.angle = player.shadowSliceSwing.startAngle;
      player.shadowSliceSwing.glowIntensity = 0;
      player.shadowSliceSwing.shadowTrails = [];
      player.shadowSliceSwing.trailFrame = 0;
    }
  } else {
    player._shadowSliceTrailFrame = 0;
    // Reset Shadow Slice sword swing when not active
    if (player.shadowSliceSwing.isActive) {
      player.shadowSliceSwing.isActive = false;
      player.shadowSliceSwing.shadowTrails = [];
    }
  }

  // Update Shadow Slice sword swing animation
  if (player.shadowSliceSwing.isActive) {
    player.shadowSliceSwing.frame++;
    player.shadowSliceSwing.trailFrame++;
    
    // Calculate swing progress (0 to 1)
    const progress = player.shadowSliceSwing.frame / player.shadowSliceSwing.maxFrames;
    
    // Use ease-out function for smooth swing
    const easeProgress = 1 - Math.pow(1 - progress, 2);
    
    // Interpolate angle from start to end
    player.shadowSliceSwing.angle = player.shadowSliceSwing.startAngle + 
      (player.shadowSliceSwing.endAngle - player.shadowSliceSwing.startAngle) * easeProgress;
    
    // Calculate glow intensity (peak at middle of swing)
    const glowProgress = Math.sin(progress * Math.PI);
    player.shadowSliceSwing.glowIntensity = glowProgress;
    
    // Create shadow trails every few frames
    if (player.shadowSliceSwing.trailFrame % 3 === 0) { // Every 3 frames
      player.shadowSliceSwing.shadowTrails.push({
        angle: player.shadowSliceSwing.angle,
        alpha: 0.8,
        scale: 1.0,
        glowIntensity: player.shadowSliceSwing.glowIntensity * 0.7
      });
    }
    
    // Limit trail count
    if (player.shadowSliceSwing.shadowTrails.length > 8) {
      player.shadowSliceSwing.shadowTrails.shift();
    }
    
    // Update shadow trails
    player.shadowSliceSwing.shadowTrails.forEach((trail, i) => {
      trail.alpha -= 0.08;
      trail.scale -= 0.02;
      trail.glowIntensity *= 0.95;
    });
    
    // Remove faded trails
    player.shadowSliceSwing.shadowTrails = player.shadowSliceSwing.shadowTrails.filter(trail => trail.alpha > 0);
    
    // End animation when complete
    if (player.shadowSliceSwing.frame >= player.shadowSliceSwing.maxFrames) {
      player.shadowSliceSwing.isActive = false;
      player.shadowSliceSwing.frame = 0;
      player.shadowSliceSwing.glowIntensity = 0;
      player.shadowSliceSwing.shadowTrails = [];
    }
  }

  // Update Rising Cut sword swing animation
  if (player.risingCutSwing.isActive) {
    player.risingCutSwing.frame++;
    player.risingCutSwing.trailFrame++;
    
    // Calculate swing progress (0 to 1)
    const progress = player.risingCutSwing.frame / player.risingCutSwing.maxFrames;
    
    // Use ease-out function for smooth swing
    const easeProgress = 1 - Math.pow(1 - progress, 2);
    
    // Interpolate angle from start to end
    player.risingCutSwing.angle = player.risingCutSwing.startAngle + 
      (player.risingCutSwing.endAngle - player.risingCutSwing.startAngle) * easeProgress;
    
    // Calculate glow intensity (peak at middle of swing)
    const glowProgress = Math.sin(progress * Math.PI);
    player.risingCutSwing.glowIntensity = glowProgress;
    
    // Create shadow trails every few frames
    if (player.risingCutSwing.trailFrame % 3 === 0) { // Every 3 frames
      player.risingCutSwing.shadowTrails.push({
        angle: player.risingCutSwing.angle,
        alpha: 0.8,
        scale: 1.0,
        glowIntensity: player.risingCutSwing.glowIntensity * 0.7
      });
    }
    
    // Limit trail count
    if (player.risingCutSwing.shadowTrails.length > 8) {
      player.risingCutSwing.shadowTrails.shift();
    }
    
    // Update shadow trails
    player.risingCutSwing.shadowTrails.forEach((trail, i) => {
      trail.alpha -= 0.08;
      trail.scale -= 0.02;
      trail.glowIntensity *= 0.95;
    });
    
    // Remove faded trails
    player.risingCutSwing.shadowTrails = player.risingCutSwing.shadowTrails.filter(trail => trail.alpha > 0);
    
    // End animation when complete
    if (player.risingCutSwing.frame >= player.risingCutSwing.maxFrames) {
      player.risingCutSwing.isActive = false;
      player.risingCutSwing.frame = 0;
      player.risingCutSwing.glowIntensity = 0;
      player.risingCutSwing.shadowTrails = [];
    }
  }

  // Update Down Light sword swing animation
  if (player.downLightSwing.isActive) {
    player.downLightSwing.frame++;
    player.downLightSwing.trailFrame++;
    
    // Calculate swing progress (0 to 1)
    const progress = player.downLightSwing.frame / player.downLightSwing.maxFrames;
    
    // Use ease-out function for smooth swing
    const easeProgress = 1 - Math.pow(1 - progress, 2);
    
    // Interpolate angle from start to end
    player.downLightSwing.angle = player.downLightSwing.startAngle + 
      (player.downLightSwing.endAngle - player.downLightSwing.startAngle) * easeProgress;
    
    // Calculate glow intensity (peak at middle of swing)
    const glowProgress = Math.sin(progress * Math.PI);
    player.downLightSwing.glowIntensity = glowProgress;
    
    // Create shadow trails every few frames
    if (player.downLightSwing.trailFrame % 3 === 0) { // Every 3 frames
      player.downLightSwing.shadowTrails.push({
        angle: player.downLightSwing.angle,
        alpha: 0.8,
        scale: 1.0,
        glowIntensity: player.downLightSwing.glowIntensity * 0.7
      });
    }
    
    // Limit trail count
    if (player.downLightSwing.shadowTrails.length > 8) {
      player.downLightSwing.shadowTrails.shift();
    }
    
    // Update shadow trails
    player.downLightSwing.shadowTrails.forEach((trail, i) => {
      trail.alpha -= 0.08;
      trail.scale -= 0.02;
      trail.glowIntensity *= 0.95;
    });
    
    // Remove faded trails
    player.downLightSwing.shadowTrails = player.downLightSwing.shadowTrails.filter(trail => trail.alpha > 0);
    
    // End animation when complete
    if (player.downLightSwing.frame >= player.downLightSwing.maxFrames) {
      player.downLightSwing.isActive = false;
      player.downLightSwing.frame = 0;
      player.downLightSwing.glowIntensity = 0;
      player.downLightSwing.shadowTrails = [];
    }
  }

  // Shadowstep afterimages for Side Heavy
  if (player.isAttacking && player.activeMove && player.activeMove.name === 'Shadowstep Strike') {
    if (player.shadowAfterimages.length < 6) {
      player.shadowAfterimages.push({
        x: player.x,
        y: player.y,
        alpha: 0.5,
        facing: player.facing
      });
    }
  } else {
    player.shadowAfterimages = [];
  }

  // Update Demon Fang effects
  if (player.isCharging && player.activeMove && player.activeMove.name === 'Demon Fang') {
    // Store original position when starting charge
    if (player.demonFangEffects.originalX === 0) {
      player.demonFangEffects.originalX = player.x;
    }
    
    // Add mist particles during charge
    if (player.demonFangEffects.mistParticles.length < 15) {
      player.demonFangEffects.mistParticles.push({
        x: player.x + (Math.random() - 0.5) * 60,
        y: player.y + Math.random() * 60,
        alpha: 0.6 + Math.random() * 0.4,
        size: 5 + Math.random() * 10,
        speed: Math.random() * 2
      });
    }
  } else if (player.isAttacking && player.activeMove && player.activeMove.name === 'Demon Fang') {
    // During thrust animation
    if (player.demonFangEffects.thrustDistance > 0) {
      player.demonFangEffects.thrustDistance -= 15; // Return to original position
      if (player.demonFangEffects.thrustDistance < 0) {
        player.demonFangEffects.thrustDistance = 0;
      }
    }
  } else {
    // Reset effects when not charging or attacking
    player.demonFangEffects.mistParticles = [];
    player.demonFangEffects.chargeAngle = 0;
    player.demonFangEffects.originalX = 0;
    player.demonFangEffects.thrustDistance = 0;
  }

  // Update mist particles
  player.demonFangEffects.mistParticles.forEach((particle, i) => {
    particle.y -= particle.speed;
    particle.alpha -= 0.02;
    if (particle.alpha <= 0) {
      player.demonFangEffects.mistParticles.splice(i, 1);
    }
  });

  // Update existing afterimages
  if (player.shadowAfterimages.length > 0) {
    player.shadowAfterimages.forEach((image, i) => {
      image.alpha -= 0.05;
      if (image.alpha <= 0) {
        player.shadowAfterimages.splice(i, 1);
      }
    });
  }

  // Update sword swing animation for Shadow Sneak
  if (player.swordSwing.isActive) {
    player.swordSwing.frame++;
    
    // Calculate swing progress (0 to 1)
    const progress = player.swordSwing.frame / player.swordSwing.maxFrames;
    
    // Use ease-out function for smooth swing
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    
    // Interpolate angle from start to end
    player.swordSwing.angle = player.swordSwing.startAngle + 
      (player.swordSwing.endAngle - player.swordSwing.startAngle) * easeProgress;
    
    // Calculate glow intensity (peak at middle of swing)
    const glowProgress = Math.sin(progress * Math.PI);
    player.swordSwing.glowIntensity = glowProgress;
    
    // End animation when complete
    if (player.swordSwing.frame >= player.swordSwing.maxFrames) {
      player.swordSwing.isActive = false;
      player.swordSwing.frame = 0;
      player.swordSwing.glowIntensity = 0;
    }
  }

  // Update Phantom Slash effects
  if (player.isAttacking && player.activeMove && player.activeMove.name === 'Phantom Slash') {
    const effects = player.phantomSlashEffects;
    const move = player.activeMove;
    
    // Initialize effects if not already active
    if (!effects.shadowWings.isActive) {
      effects.shadowWings.isActive = true;
      effects.shadowWings.frame = 0;
      effects.circlingBlade.isActive = true;
      effects.circlingBlade.swingAngle = 0;
      effects.circlingBlade.swingDirection = 1;
      effects.circlingBlade.bladeTrails = [];
      effects.circlingBlade.hitFrame = 0;
      // Initialize demonic aura
      effects.demonicAura.isActive = true;
      effects.demonicAura.intensity = 0;
      effects.demonicAura.particles = [];
    }
    
    // Update shadow wings animation
    effects.shadowWings.frame++;
    effects.shadowWings.wingAngle += effects.shadowWings.wingFlapSpeed;
    
    // Update circling blade
    if (move.circlingBlade) {
      // Horizontal swinging motion around waist
      const swingSpeed = move.circlingBlade.swingSpeed;
      const swingRange = move.circlingBlade.swingRange;
      
      // Update swing angle
      effects.circlingBlade.swingAngle += swingSpeed * effects.circlingBlade.swingDirection;
      
      // Reverse direction when reaching swing limits
      if (effects.circlingBlade.swingAngle >= swingRange) {
        effects.circlingBlade.swingDirection = -1;
        effects.circlingBlade.swingAngle = swingRange;
      } else if (effects.circlingBlade.swingAngle <= -swingRange) {
        effects.circlingBlade.swingDirection = 1;
        effects.circlingBlade.swingAngle = -swingRange;
      }
      
      // Create blade trail effects
      if (effects.shadowWings.frame % 3 === 0) { // Every 3 frames
        effects.circlingBlade.bladeTrails.push({
          angle: effects.circlingBlade.swingAngle,
          alpha: 0.7,
          scale: 1.0
        });
      }
      
      // Limit trail count
      if (effects.circlingBlade.bladeTrails.length > move.circlingBlade.bladeCount) {
        effects.circlingBlade.bladeTrails.shift();
      }
      
      // Update trail effects
      effects.circlingBlade.bladeTrails.forEach((trail, i) => {
        trail.alpha -= 0.1;
        trail.scale -= 0.05;
      });
      
      // Remove faded trails
      effects.circlingBlade.bladeTrails = effects.circlingBlade.bladeTrails.filter(trail => trail.alpha > 0);
    }
    
    // Update demonic aura effects
    if (effects.demonicAura.isActive) {
      // Increase aura intensity over time
      effects.demonicAura.intensity = Math.min(effects.demonicAura.intensity + 0.02, 1.0);
      
      // Create shadow particles
      if (effects.shadowWings.frame % 2 === 0) { // Every 2 frames
        effects.demonicAura.particles.push({
          x: player.x + (Math.random() - 0.5) * 80,
          y: player.y + (Math.random() - 0.5) * 60,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          alpha: 0.8 + Math.random() * 0.2,
          size: 3 + Math.random() * 6,
          life: 30 + Math.random() * 20
        });
      }
      
      // Update and remove particles
      effects.demonicAura.particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.alpha -= 0.02;
        particle.life--;
        
        if (particle.life <= 0 || particle.alpha <= 0) {
          effects.demonicAura.particles.splice(i, 1);
        }
      });
    }
    
    // End effects when attack is complete
    if (player.attackCooldown <= 0) {
      effects.shadowWings.isActive = false;
      effects.circlingBlade.isActive = false;
      effects.circlingBlade.bladeTrails = [];
      effects.demonicAura.isActive = false;
      effects.demonicAura.particles = [];
    }
  } else {
    // Reset Phantom Slash effects when not attacking
    if (player.phantomSlashEffects.shadowWings.isActive) {
      player.phantomSlashEffects.shadowWings.isActive = false;
    }
    if (player.phantomSlashEffects.circlingBlade.isActive) {
      player.phantomSlashEffects.circlingBlade.isActive = false;
      player.phantomSlashEffects.circlingBlade.bladeTrails = [];
    }
    if (player.phantomSlashEffects.demonicAura.isActive) {
      player.phantomSlashEffects.demonicAura.isActive = false;
      player.phantomSlashEffects.demonicAura.particles = [];
    }
  }

  // Update Void Splitter effects
  if (player.isAttacking && player.activeMove && player.activeMove.name === 'Void Splitter') {
    const effects = player.voidSplitterEffects;
    const move = player.activeMove;
    
    // Initialize effects if not already active
    if (!effects.groundSlam.isActive) {
      effects.groundSlam.isActive = true;
      effects.groundSlam.frame = 0;
      effects.groundSlam.slamAngle = 0;
      effects.groundSlam.shockwaveParticles = [];
      effects.groundSlam.groundCrack.isActive = true;
      effects.groundSlam.groundCrack.frame = 0;
      effects.groundSlam.groundCrack.width = 0;
      
      // Initialize wave
      effects.wave.isActive = true;
      effects.wave.x = player.x + (player.facing > 0 ? 60 : -60); // Closer to player since shadow is shorter
      effects.wave.y = player.y + 20;
      effects.wave.distance = 0;
      effects.wave.direction = player.facing;
      effects.wave.frame = 0;
      effects.wave.particles = [];
      effects.wave.lastHitTarget = null;
      effects.wave.hitCooldown = 0;
    }
    
    // Update ground slam animation
    if (move.groundSlam) {
      effects.groundSlam.frame++;
      
      // Slam angle animation (sword goes from raised to slammed)
      const slamProgress = Math.min(effects.groundSlam.frame / move.groundSlam.slamDuration, 1.0);
      effects.groundSlam.slamAngle = Math.PI / 2 * slamProgress; // 0 to 90 degrees
      
      // Create shockwave particles on impact
      if (effects.groundSlam.frame === Math.floor(move.groundSlam.slamDuration / 2)) {
        // Create impact particles
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const distance = 20 + Math.random() * 40;
          effects.groundSlam.shockwaveParticles.push({
            x: player.x + player.width / 2 + Math.cos(angle) * distance,
            y: player.y + player.height + Math.sin(angle) * distance,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            alpha: 0.8 + Math.random() * 0.2,
            size: 4 + Math.random() * 6,
            life: 20 + Math.random() * 15
          });
        }
      }
      
      // Update ground crack
      if (effects.groundSlam.groundCrack.isActive) {
        effects.groundSlam.groundCrack.frame++;
        const crackProgress = Math.min(effects.groundSlam.groundCrack.frame / 10, 1.0);
        effects.groundSlam.groundCrack.width = move.groundSlam.shockwaveRadius * crackProgress;
      }
      
      // Update shockwave particles
      effects.groundSlam.shockwaveParticles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.alpha -= 0.03;
        particle.life--;
        
        if (particle.life <= 0 || particle.alpha <= 0) {
          effects.groundSlam.shockwaveParticles.splice(i, 1);
        }
      });
    }
    
    // Update wave
    if (move.wave && effects.wave.isActive) {
      effects.wave.frame++;
      
      // Move wave forward
      if (effects.wave.distance < move.wave.maxDistance) {
        effects.wave.x += move.wave.speed * effects.wave.direction;
        effects.wave.distance += move.wave.speed;
      }
      
      // Create wave particles (dark fire effect)
      if (effects.wave.frame % 2 === 0) { // Every 2 frames
        effects.wave.particles.push({
          x: effects.wave.x + (Math.random() - 0.5) * move.wave.width,
          y: effects.wave.y + (Math.random() - 0.5) * move.wave.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          alpha: 0.9 + Math.random() * 0.1,
          size: 3 + Math.random() * 8,
          life: 15 + Math.random() * 10,
          type: Math.random() > 0.7 ? 'flame' : 'shadow' // 30% chance for flame effect
        });
      }
      
      // Update wave particles
      effects.wave.particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.alpha -= 0.04;
        particle.life--;
        
        if (particle.life <= 0 || particle.alpha <= 0) {
          effects.wave.particles.splice(i, 1);
        }
      });
      
      // Update hit cooldown
      if (effects.wave.hitCooldown > 0) {
        effects.wave.hitCooldown--;
      }
    }
    
    // End effects when attack is complete
    if (player.attackCooldown <= 0) {
      effects.groundSlam.isActive = false;
      effects.groundSlam.shockwaveParticles = [];
      effects.groundSlam.groundCrack.isActive = false;
      effects.wave.isActive = false;
      effects.wave.particles = [];
    }
  } else {
    // Reset Void Splitter effects when not attacking
    if (player.voidSplitterEffects.groundSlam.isActive) {
      player.voidSplitterEffects.groundSlam.isActive = false;
      player.voidSplitterEffects.groundSlam.shockwaveParticles = [];
      player.voidSplitterEffects.groundSlam.groundCrack.isActive = false;
    }
    if (player.voidSplitterEffects.wave.isActive) {
      player.voidSplitterEffects.wave.isActive = false;
      player.voidSplitterEffects.wave.particles = [];
    }
  }
}

// Draw Rakka (main function)
export function drawRakka(ctx, player) {
  const { x, y, width, height, facing, color } = player;
  const centerX = x + width / 2;
  const baseY = y + height - 26;

  // Draw shadow afterimages (for shadowstep)
  player.shadowAfterimages.forEach((img, i) => {
    ctx.save();
    ctx.globalAlpha = img.alpha * (1 - i * 0.15);
    drawRakkaBody(ctx, img.x, img.y - 26, width, height, facing, true, color, player);
    ctx.globalAlpha = 1.0;
    ctx.restore();
  });

  // Draw demonic mist particles
  player.demonFangEffects.mistParticles.forEach(particle => {
    ctx.save();
    ctx.globalAlpha = particle.alpha;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
    
    // Add red glow to particles
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#600';
    ctx.fill();
    ctx.restore();
  });

  // Draw shadow/mist trail (simple effect)
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.ellipse(centerX, baseY + 8, 32, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#111';
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.restore();

  // Draw main body
  drawRakkaBody(ctx, x, y - 26, width, height, facing, false, color, player);
  
  // Draw katana with special handling for Demon Fang and sword swing
  if (player.isCharging && player.activeMove && player.activeMove.name === 'Demon Fang') {
    drawDemonFangStance(ctx, x, y - 26, width, height, facing, player);
  } else if (player.swordSwing.isActive) {
    // Draw swinging sword for Shadow Sneak
    drawSwingingSword(ctx, x, y - 26, width, height, facing, player);
  } else if (player.shadowSliceSwing.isActive) {
    // Draw Shadow Slice sword animation with shadow trails
    drawShadowSliceSword(ctx, x, y - 26, width, height, facing, player);
  } else if (player.risingCutSwing.isActive) {
    // Draw Rising Cut sword animation with shadow trails
    drawRisingCutSword(ctx, x, y - 26, width, height, facing, player);
  } else if (player.downLightSwing.isActive) {
    // Draw Down Light sword animation with shadow trails
    drawDownLightSword(ctx, x, y - 26, width, height, facing, player);
  } else if (player.isAttacking && player.activeMove && player.activeMove.name === 'Void Splitter') {
    // Draw slamming sword for Void Splitter
    drawVoidSplitterSword(ctx, x, y - 26, width, height, facing, player);
  } else {
    drawRakkaKatana(ctx, x, y - 26, width, height, facing, player.sword);
  }
  
  // Draw hat with 鬼 and ribbon
  drawRakkaHat(ctx, x, y - 26, width, height, facing, player);
  
  // Draw charge indicator if charging
  if (player.isCharging && player.activeMove && player.activeMove.name === 'Demon Fang') {
    drawChargeIndicator(ctx, player);
  }

  // Draw Shadow Sneak shadow if active
  if (player.shadowSneak.active) {
    ctx.save();
    ctx.globalAlpha = 0.7;
    // Draw black stick figure body (shadow)
    drawRakkaBody(ctx, player.shadowSneak.x, player.shadowSneak.y - 26, player.width, player.height, player.shadowSneak.direction, true, '#000', player);
    // Draw red eyes (very transparent)
    const centerX = player.shadowSneak.x + player.width / 2;
    const baseY = player.shadowSneak.y + player.height - 26;
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#f00';
    // Eyes are positioned relative to the head
    ctx.beginPath();
    ctx.arc(centerX - 5, baseY - 48, 3, 0, Math.PI * 2); // Left eye
    ctx.arc(centerX + 5, baseY - 48, 3, 0, Math.PI * 2); // Right eye
    ctx.fill();
    ctx.restore();
  }

  // Draw Phantom Slash effects
  if (player.isAttacking && player.activeMove && player.activeMove.name === 'Phantom Slash') {
    // Draw demonic aura and shadow particles first (behind everything)
    if (player.phantomSlashEffects.demonicAura.isActive) {
      drawDemonicAura(ctx, x, y - 26, width, height, facing, player);
    }
    
    // Draw shadow wings
    if (player.phantomSlashEffects.shadowWings.isActive) {
      drawShadowWings(ctx, x, y - 26, width, height, facing, player);
    }
    
    // Draw circling blade
    if (player.phantomSlashEffects.circlingBlade.isActive) {
      drawCirclingBlade(ctx, x, y - 26, width, height, facing, player);
    }
  }

  // Draw Void Splitter effects
  if (player.isAttacking && player.activeMove && player.activeMove.name === 'Void Splitter') {
    // Draw ground slam effects first (behind everything)
    if (player.voidSplitterEffects.groundSlam.isActive) {
      drawGroundSlam(ctx, x, y - 26, width, height, facing, player);
    }
    
    // Draw dark wave
    if (player.voidSplitterEffects.wave.isActive) {
      drawDarkWave(ctx, x, y - 26, width, height, facing, player);
    }
  }
}

// Draw stick figure body
function drawRakkaBody(ctx, x, y, width, height, facing, isShadow, color, player) {
  const centerX = x + width / 2;
  const baseY = y + height; // Feet at bottom
  ctx.save();
  ctx.strokeStyle = isShadow ? '#222' : color || '#000';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';

  // Check if charging Demon Fang for special stance
  const isChargingDemonFang = player.isCharging && player.activeMove && player.activeMove.name === 'Demon Fang';
  const chargeLevel = player.chargeLevel || 0;

  // Check if performing Void Splitter for special stance
  const isVoidSplitter = player.isAttacking && player.activeMove && player.activeMove.name === 'Void Splitter';
  const voidSplitterEffects = player.voidSplitterEffects;

  if (isChargingDemonFang) {
    // Lower stance - body tilted forward
    const leanAngle = 0.3 + (chargeLevel * 0.2); // Lean more as charge increases
    const bodyYOffset = 6; // Move body up to connect with hat and handle

    // --- Draw Rotated Upper Body ---
    ctx.save();
    ctx.translate(0, bodyYOffset); // Raise only the body
    ctx.translate(centerX, baseY - 25);
    ctx.rotate(leanAngle * facing);
    ctx.translate(-centerX, -(baseY - 25));

    // Body - leaning forward
    ctx.beginPath();
    ctx.moveTo(centerX, baseY - 42);
    ctx.lineTo(centerX + (10 * facing), baseY - 10);
    ctx.stroke();

    // Arms in ready position
    ctx.beginPath();
    ctx.moveTo(centerX, baseY - 32);
    ctx.lineTo(centerX - (28 * facing), baseY - 28);
    // Sword arm (extended back, adjusted to meet the new sword angle)
    ctx.moveTo(centerX, baseY - 32);
    ctx.lineTo(centerX + (28 * facing), baseY - 25);
    ctx.stroke();
    
    // Head - slightly lowered
    ctx.beginPath();
    ctx.arc(centerX + (8 * facing), baseY - 48, 14, 0, Math.PI * 2);
    ctx.fillStyle = isShadow ? '#222' : color || '#000';
    ctx.fill();

    ctx.restore(); // Restore from rotation transform

    // --- Draw Legs: L-shaped front leg, steeper/longer back leg, both feet on ground ---
    // Hip position: a bit lower and to the left of the torso
    const hipX = centerX + (2 * facing) - (10 * facing); // 10px left from center, 2px for subtle offset
    const hipY = baseY - 2 + bodyYOffset; // 8px lower than previous

    ctx.beginPath();
    // Front leg (L-shape: bend closer to hip, shin goes farther down)
    const frontKneeX = hipX + 18 * facing;
    const frontKneeY = hipY;
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(frontKneeX, frontKneeY); // Thigh forward (horizontal, shorter)
    ctx.lineTo(frontKneeX, baseY + 22); // Shin farther down, foot on ground

    // Back leg (steeper, longer)
    const backLegLength = 48;
    const backLegAngle = facing > 0 ? Math.PI * 5 / 6 : -Math.PI * 5 / 6; // ~150 deg from horizontal (steep)
    const backFootX = hipX + backLegLength * Math.cos(backLegAngle);
    const backFootY = hipY + backLegLength * Math.sin(backLegAngle);
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(backFootX, backFootY);
    ctx.stroke();

  } else if (isVoidSplitter) {
    // Void Splitter stance - crouching with sword raised for slam
    const slamAngle = voidSplitterEffects.groundSlam.slamAngle;
    const bodyYOffset = 8; // Lower stance

    // --- Draw Crouched Body ---
    ctx.save();
    ctx.translate(0, bodyYOffset);

    // Body - crouched position
    ctx.beginPath();
    ctx.moveTo(centerX, baseY - 35); // Shorter body
    ctx.lineTo(centerX, baseY - 5);
    ctx.stroke();

    // Arms in slam position
    ctx.beginPath();
    // Left arm (supporting)
    ctx.moveTo(centerX, baseY - 25);
    ctx.lineTo(centerX - (20 * facing), baseY - 15);
    // Right arm (raised for slam)
    ctx.moveTo(centerX, baseY - 25);
    ctx.lineTo(centerX + (25 * facing), baseY - 35);
    ctx.stroke();
    
    // Head - lowered
    ctx.beginPath();
    ctx.arc(centerX + (5 * facing), baseY - 40, 12, 0, Math.PI * 2);
    ctx.fillStyle = isShadow ? '#222' : color || '#000';
    ctx.fill();

    ctx.restore();

    // --- Draw Legs: Crouched stance ---
    // Hip position: lower and wider stance
    const hipX = centerX;
    const hipY = baseY - 2 + bodyYOffset;

    ctx.beginPath();
    // Left leg (bent)
    const leftKneeX = hipX - 15;
    const leftKneeY = hipY + 8;
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(leftKneeX, leftKneeY);
    ctx.lineTo(leftKneeX - 5, baseY + 15);

    // Right leg (bent)
    const rightKneeX = hipX + 15;
    const rightKneeY = hipY + 8;
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(rightKneeX, rightKneeY);
    ctx.lineTo(rightKneeX + 5, baseY + 15);
    ctx.stroke();

  } else {
    // Normal stance - original code
    // Body
    ctx.beginPath();
    ctx.moveTo(centerX, baseY - 42);
    ctx.lineTo(centerX, baseY);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    // Resting arm (closer to body)
    ctx.moveTo(centerX, baseY - 32);
    ctx.lineTo(centerX - 24 * facing, baseY - 22);
    // Katana-holding arm (reaching lower to handle)
    ctx.moveTo(centerX, baseY - 32);
    ctx.lineTo(centerX + 24 * facing, baseY - 22);
    ctx.stroke();
    
    // Legs with walking animation
    ctx.beginPath();
    if (player.animation.isWalking) {
      const walkCycle = (player.animation.frame / player.animation.numFrames) * Math.PI * 2;
      const legSwing = Math.sin(walkCycle) * 8;
      // Left leg
      ctx.moveTo(centerX, baseY);
      ctx.lineTo(centerX - 12 + legSwing, baseY + 26);
      // Right leg
      ctx.moveTo(centerX, baseY);
      ctx.lineTo(centerX + 12 - legSwing, baseY + 26);
    } else {
      // Standing still
      ctx.moveTo(centerX, baseY);
      ctx.lineTo(centerX - 12, baseY + 26);
      ctx.moveTo(centerX, baseY);
      ctx.lineTo(centerX + 12, baseY + 26);
    }
    ctx.stroke();
    
    // Head
    ctx.beginPath();
    ctx.arc(centerX, baseY - 48, 14, 0, Math.PI * 2);
    ctx.fillStyle = isShadow ? '#222' : color || '#000';
    ctx.fill();
  }
  
  ctx.restore();
}

// Draw katana at waist
function drawRakkaKatana(ctx, x, y, width, height, facing, sword) {
  const centerX = x + width / 2;
  // Raise the katana slightly and move it closer to the body
  const baseY = y + height - 12;
  const sheathOffset = 8 * facing; // Reduced offset to bring katana closer
  ctx.save();
  ctx.translate(centerX + sheathOffset, baseY);
  if (facing < 0) ctx.scale(-1, 1); // Mirror horizontally for left
  ctx.rotate(0.08 - 0.35); // Always angle downward and back
  // Sheath (thinner)
  const sheathWidth = sword.width * 0.6;
  ctx.fillStyle = sword.sheathColor;
  ctx.fillRect(-sword.length * 0.7, -sheathWidth / 2, sword.length, sheathWidth);
  // Sheath outline
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = '#bbb';
  ctx.strokeRect(-sword.length * 0.7, -sheathWidth / 2, sword.length, sheathWidth);
  // Hilt (handle just past waist, positioned where the hand reaches)
  ctx.fillStyle = sword.hiltColor;
  ctx.fillRect(sword.length * 0.3 - 2, -sheathWidth / 2 - 1, 12, sheathWidth + 2); // Made handle slightly larger
  ctx.restore();
}

// Draw swinging sword for Shadow Sneak
function drawSwingingSword(ctx, x, y, width, height, facing, player) {
  const centerX = x + width / 2;
  const baseY = y + height;
  const sword = player.sword;
  const swing = player.swordSwing;
  
  ctx.save();
  
  // Position at the sword arm (right arm when facing right, left when facing left)
  const armX = centerX + (24 * facing);
  const armY = baseY - 22;
  
  ctx.translate(armX, armY);
  
  // Apply facing direction
  if (facing < 0) {
    ctx.scale(-1, 1);
  }
  
  // Apply swing angle
  ctx.rotate(swing.angle);
  
  // Draw sword with glow effect
  const glowIntensity = swing.glowIntensity;
  
  // Outer glow
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 15 + (glowIntensity * 10);
  
  // Sword blade
  ctx.fillStyle = '#222';
  ctx.fillRect(0, -sword.width/2, sword.length, sword.width);
  
  // Red energy glow along the blade
  const gradient = ctx.createLinearGradient(0, 0, sword.length, 0);
  gradient.addColorStop(0, `rgba(255,0,0,${glowIntensity * 0.8})`);
  gradient.addColorStop(0.5, `rgba(255,0,0,${glowIntensity * 0.4})`);
  gradient.addColorStop(1, 'rgba(255,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, -sword.width/2, sword.length, sword.width);
  
  // Hilt
  ctx.shadowBlur = 0;
  ctx.fillStyle = sword.hiltColor;
  ctx.fillRect(-12, -sword.width/2 - 1, 12, sword.width + 2);
  
  // Add motion blur effect (trail)
  if (glowIntensity > 0.3) {
    ctx.save();
    ctx.globalAlpha = glowIntensity * 0.3;
    ctx.translate(-sword.length * 0.3, 0);
    ctx.rotate(-0.2);
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, -sword.width/2, sword.length * 0.6, sword.width);
    ctx.restore();
  }
  
  ctx.restore();
}

// Draw slamming sword for Void Splitter
function drawVoidSplitterSword(ctx, x, y, width, height, facing, player) {
  const centerX = x + width / 2;
  const baseY = y + height;
  const sword = player.sword;
  const effects = player.voidSplitterEffects;
  
  ctx.save();
  
  // Position at the sword arm (right arm when facing right, left when facing left)
  const armX = centerX + (25 * facing);
  const armY = baseY - 35;
  
  ctx.translate(armX, armY);
  
  // Apply facing direction
  if (facing < 0) {
    ctx.scale(-1, 1);
  }
  
  // Apply slam angle
  const slamAngle = effects.groundSlam.slamAngle;
  ctx.rotate(slamAngle);
  
  // Draw sword with demonic effect
  const slamProgress = Math.min(effects.groundSlam.frame / 25, 1.0);
  const glowIntensity = slamProgress;
  
  // Outer glow
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 20 + (glowIntensity * 15);
  
  // Sword blade
  ctx.fillStyle = '#222';
  ctx.fillRect(0, -sword.width/2, sword.length, sword.width);
  
  // Red energy glow along the blade
  const gradient = ctx.createLinearGradient(0, 0, sword.length, 0);
  gradient.addColorStop(0, `rgba(255,0,0,${glowIntensity * 0.9})`);
  gradient.addColorStop(0.5, `rgba(255,0,0,${glowIntensity * 0.6})`);
  gradient.addColorStop(1, 'rgba(255,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, -sword.width/2, sword.length, sword.width);
  
  // Hilt
  ctx.shadowBlur = 0;
  ctx.fillStyle = sword.hiltColor;
  ctx.fillRect(-12, -sword.width/2 - 1, 12, sword.width + 2);
  
  // Add motion blur effect (trail) when slamming
  if (glowIntensity > 0.5) {
    ctx.save();
    ctx.globalAlpha = glowIntensity * 0.4;
    ctx.translate(-sword.length * 0.2, 0);
    ctx.rotate(-0.1);
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, -sword.width/2, sword.length * 0.4, sword.width);
    ctx.restore();
  }
  
  ctx.restore();
}

// Draw hat with 鬼 and ribbon
function drawRakkaHat(ctx, x, y, width, height, facing, player) {
  const centerX = x + width / 2;
  // Adjust hat position based on charging state
  const isChargingDemonFang = player.isCharging && player.activeMove && player.activeMove.name === 'Demon Fang';
  const chargeLevel = player.chargeLevel || 0;
  
  // Check if performing Void Splitter for special stance
  const isVoidSplitter = player.isAttacking && player.activeMove && player.activeMove.name === 'Void Splitter';
  
  // Base hat position
  let hatY = y + height - 48 - 12;
  let hatOffsetX = 0;
  
  if (isChargingDemonFang) {
    // Move hat forward during charge to stay on head (increased offset)
    hatOffsetX = (16 + (chargeLevel * 12)) * facing;
    // Add tiny backward offset
    hatOffsetX -= 3 * facing;
    // Adjust Y position slightly to stay with head
    hatY += 8;
  } else if (isVoidSplitter) {
    // Move hat with the lowered head during Void Splitter
    hatOffsetX = (5 * facing); // Small forward offset to stay with head
    hatY += 8; // Lower the hat to match the crouched head position
  }
  
  ctx.save();
  ctx.translate(centerX + hatOffsetX, hatY);

  // Adjust hat rotation based on charging state
  if (isChargingDemonFang) {
    // Match body's lean angle during charge
    const leanAngle = (0.3 + (chargeLevel * 0.2)) * facing;
    ctx.rotate(leanAngle);
  } else if (isVoidSplitter) {
    // Slight forward tilt for Void Splitter stance
    ctx.rotate(0.15 * facing);
  } else {
    // Normal hat tilt
    ctx.rotate(0.12 * facing);
  }

  // Hat base (smaller)
  ctx.beginPath();
  ctx.moveTo(-22, 10);
  ctx.lineTo(0, -14);
  ctx.lineTo(22, 10);
  ctx.closePath();
  ctx.fillStyle = '#111';
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // 鬼 kanji (slightly larger)
  ctx.save();
  ctx.font = 'bold 15px serif';
  ctx.fillStyle = '#f00';
  ctx.globalAlpha = 0.92;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 5;
  ctx.fillText('鬼', 0, -2);
  ctx.restore();
  
  // Demonic effect: extra glow
  ctx.beginPath();
  ctx.arc(0, -2, 9, 0, Math.PI * 2);
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#f00';
  ctx.fill();
  ctx.globalAlpha = 1.0;
  
  // Ribbon (opposite to facing direction)
  ctx.save();
  ctx.strokeStyle = '#a00';
  ctx.fillStyle = '#a00';
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.7;
  const ribbonX = -22 * facing;
  const ribbonY = 8;
  ctx.beginPath();
  ctx.moveTo(ribbonX, ribbonY);
  ctx.lineTo(ribbonX - 10 * facing, ribbonY + 16);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(ribbonX - 10 * facing, ribbonY + 16, 3, 6, Math.PI / 8 * facing, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

// New function for Demon Fang charging stance
function drawDemonFangStance(ctx, x, y, width, height, facing, player) {
  const centerX = x + width / 2;
  const baseY = y + height;
  const chargeLevel = player.chargeLevel || 0;
  
  ctx.save();
  ctx.translate(centerX + (8 * facing), baseY - 12);
  if (facing < 0) ctx.scale(-1, 1);

  // Angle sword based on charge - less steep angle
  const chargeAngle = 0.4 + (chargeLevel * 0.15); // Positive angle to point forward/up
  ctx.rotate(chargeAngle);

  // Draw sword with demonic effect
  const sword = player.sword;
  
  // Demonic aura
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 15 + (chargeLevel * 10);
  
  // Sword blade with increasing glow
  ctx.fillStyle = '#222';
  ctx.fillRect(-sword.length, -sword.width/2, sword.length, sword.width);
  
  // Add red energy along the blade
  const gradient = ctx.createLinearGradient(-sword.length, 0, 0, 0);
  gradient.addColorStop(0, `rgba(255,0,0,${chargeLevel * 0.7})`);
  gradient.addColorStop(1, 'rgba(255,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(-sword.length, -sword.width/2, sword.length, sword.width);
  
  // Hilt
  ctx.shadowBlur = 0;
  ctx.fillStyle = sword.hiltColor;
  ctx.fillRect(0, -sword.width/2 - 1, 12, sword.width + 2);
  
  ctx.restore();
}

// Draw charge indicator
function drawChargeIndicator(ctx, player) {
  const { x, y, width, chargeLevel } = player;
  const barWidth = 60;
  const barHeight = 8;
  const barX = x;
  const barY = y - 42; // Moved up from -30
  
  // Draw background bar
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // Draw charge level with demonic color scheme
  const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth * chargeLevel, barY);
  gradient.addColorStop(0, '#600');
  gradient.addColorStop(1, '#f00');
  ctx.fillStyle = gradient;
  ctx.fillRect(barX, barY, barWidth * chargeLevel, barHeight);
  
  // Add glow effect
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = '#f00';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  
  ctx.restore();
}

// Draw shadow wings
function drawShadowWings(ctx, x, y, width, height, facing, player) {
  const effects = player.phantomSlashEffects;
  const move = player.activeMove;
  
  ctx.save();
  
  // Position at the center of the player
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  ctx.translate(centerX, centerY);
  
  // Apply facing direction
  if (facing < 0) {
    ctx.scale(-1, 1);
  }
  
  // Draw shadow wings
  const wingAngle = effects.shadowWings.wingAngle;
  const wingSpan = move.shadowWings.wingSpan;
  const wingHeight = move.shadowWings.wingHeight;
  
  // Left wing
  ctx.save();
  ctx.translate(-20, -10);
  ctx.rotate(Math.sin(wingAngle) * 0.3); // Flapping motion
  
  // Wing shadow effect
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 8;
  
  // Wing shape (bat-like)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-wingSpan/2, -wingHeight/2, -wingSpan, -wingHeight);
  ctx.quadraticCurveTo(-wingSpan/2, -wingHeight/3, 0, -wingHeight/4);
  ctx.quadraticCurveTo(-wingSpan/3, -wingHeight/6, 0, 0);
  ctx.fillStyle = '#111';
  ctx.fill();
  
  // Wing glow
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 12;
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#600';
  ctx.fill();
  
  ctx.restore();
  
  // Right wing
  ctx.save();
  ctx.translate(20, -10);
  ctx.rotate(-Math.sin(wingAngle) * 0.3); // Opposite flapping motion
  
  // Wing shadow effect
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 8;
  
  // Wing shape (bat-like)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(wingSpan/2, -wingHeight/2, wingSpan, -wingHeight);
  ctx.quadraticCurveTo(wingSpan/2, -wingHeight/3, 0, -wingHeight/4);
  ctx.quadraticCurveTo(wingSpan/3, -wingHeight/6, 0, 0);
  ctx.fillStyle = '#111';
  ctx.fill();
  
  // Wing glow
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 12;
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#600';
  ctx.fill();
  
  ctx.restore();
  
  ctx.restore();
}

// Draw circling blade
function drawCirclingBlade(ctx, x, y, width, height, facing, player) {
  const effects = player.phantomSlashEffects;
  const move = player.activeMove;
  
  ctx.save();
  
  // Position at the waist level of the player
  const centerX = x + width / 2;
  const centerY = y + height / 2 + 5; // At waist level
  
  ctx.translate(centerX, centerY);
  
  // Apply facing direction
  if (facing < 0) {
    ctx.scale(-1, 1);
  }
  
  // Draw circling blade
  const swingAngle = effects.circlingBlade.swingAngle;
  const bladeTrails = effects.circlingBlade.bladeTrails;
  const radius = move.circlingBlade.radius;
  
  // Draw blade trails (afterimages)
  bladeTrails.forEach((trail, i) => {
    ctx.save();
    ctx.rotate(trail.angle);
    ctx.translate(0, -radius);
    
    // Blade glow
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 8 + (trail.alpha * 10);
    
    // Blade shape - positioned to swing around waist
    ctx.beginPath();
    ctx.moveTo(-6 * trail.scale, 0);
    ctx.lineTo(6 * trail.scale, 0);
    ctx.lineTo(3 * trail.scale, -25 * trail.scale);
    ctx.lineTo(-3 * trail.scale, -25 * trail.scale);
    ctx.closePath();
    
    // Blade color based on alpha
    if (trail.alpha > 0.5) {
      ctx.fillStyle = '#f00';
    } else {
      ctx.fillStyle = '#600';
    }
    ctx.globalAlpha = trail.alpha;
    ctx.fill();
    
    ctx.restore();
  });
  
  // Draw main swinging blade
  ctx.save();
  ctx.rotate(swingAngle);
  ctx.translate(0, -radius);
  
  // Strong glow for main blade
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 15;
  
  // Main blade shape - sized to swing around waist
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(8, 0);
  ctx.lineTo(4, -30);
  ctx.lineTo(-4, -30);
  ctx.closePath();
  ctx.fillStyle = '#f00';
  ctx.fill();
  
  // Blade hilt
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#a00';
  ctx.fill();
  
  ctx.restore();
  
  ctx.restore();
}

// Draw demonic aura and shadow particles
function drawDemonicAura(ctx, x, y, width, height, facing, player) {
  const effects = player.phantomSlashEffects.demonicAura;
  
  ctx.save();
  
  // Draw shadow particles
  effects.particles.forEach(particle => {
    ctx.save();
    ctx.globalAlpha = particle.alpha * 0.6; // Reduced from full alpha
    
    // Shadow particle with subtle red glow
    ctx.shadowColor = '#600';
    ctx.shadowBlur = 4; // Reduced from 8
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
    
    // Subtle red core
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#300'; // Darker red
    ctx.fill();
    
    ctx.restore();
  });
  
  // Draw demonic aura around player
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const auraRadius = 50 + (effects.intensity * 20);
  
  // Outer aura glow - much more subtle
  ctx.save();
  ctx.globalAlpha = effects.intensity * 0.15; // Reduced from 0.3
  ctx.shadowColor = '#600';
  ctx.shadowBlur = 10; // Reduced from 20
  ctx.beginPath();
  ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#300'; // Darker red
  ctx.fill();
  ctx.restore();
  
  // Inner aura pulse - more subtle
  ctx.save();
  ctx.globalAlpha = effects.intensity * 0.25; // Reduced from 0.6
  ctx.shadowColor = '#600';
  ctx.shadowBlur = 8; // Reduced from 15
  ctx.beginPath();
  ctx.arc(centerX, centerY, auraRadius * 0.7, 0, Math.PI * 2);
  ctx.fillStyle = '#400'; // Darker red
  ctx.fill();
  ctx.restore();
  
  // Demonic energy tendrils - much more subtle
  for (let i = 0; i < 6; i++) { // Reduced from 8 to 6
    const angle = (i / 6) * Math.PI * 2 + (effects.intensity * Math.PI);
    const tendrilLength = 20 + (effects.intensity * 15); // Reduced length
    const tendrilX = centerX + Math.cos(angle) * tendrilLength;
    const tendrilY = centerY + Math.sin(angle) * tendrilLength;
    
    ctx.save();
    ctx.globalAlpha = effects.intensity * 0.2; // Reduced from 0.4
    ctx.shadowColor = '#600';
    ctx.shadowBlur = 5; // Reduced from 10
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(tendrilX, tendrilY);
    ctx.strokeStyle = '#400'; // Darker red
    ctx.lineWidth = 2; // Reduced from 3
    ctx.stroke();
    ctx.restore();
  }
  
  ctx.restore();
}

// Draw ground slam effects
function drawGroundSlam(ctx, x, y, width, height, facing, player) {
  const effects = player.voidSplitterEffects.groundSlam;
  const move = player.activeMove;
  
  ctx.save();
  
  // Draw shockwave particles
  effects.shockwaveParticles.forEach(particle => {
    ctx.save();
    ctx.globalAlpha = particle.alpha;
    
    // Shadow particle with red glow
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
    
    // Red core
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#600';
    ctx.fill();
    
    ctx.restore();
  });
  
  // Draw ground crack
  if (effects.groundCrack.isActive) {
    const centerX = x + width / 2;
    const groundY = y + height + 10; // Slightly below player
    
    ctx.save();
    ctx.globalAlpha = 0.8;
    
    // Crack shadow
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    
    // Draw crack as jagged line
    ctx.beginPath();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 4;
    
    const crackWidth = effects.groundCrack.width;
    const segments = 8;
    
    ctx.moveTo(centerX - crackWidth/2, groundY);
    for (let i = 1; i <= segments; i++) {
      const xPos = centerX - crackWidth/2 + (crackWidth * i / segments);
      const yOffset = (Math.random() - 0.5) * 8; // Random jaggedness
      ctx.lineTo(xPos, groundY + yOffset);
    }
    ctx.stroke();
    
    // Red glow along crack
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#600';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
  }
  
  ctx.restore();
}

// Draw dark wave
function drawDarkWave(ctx, x, y, width, height, facing, player) {
  const effects = player.voidSplitterEffects.wave;
  const move = player.activeMove;
  
  ctx.save();
  
  // Draw wave particles (dark fire effect)
  effects.particles.forEach(particle => {
    ctx.save();
    ctx.globalAlpha = particle.alpha;
    
    if (particle.type === 'flame') {
      // Flame particles - red/orange with glow
      ctx.shadowColor = '#f00';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = '#f00';
      ctx.fill();
      
      // Inner flame
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = '#ff6600';
      ctx.fill();
      
      // Core
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffff00';
      ctx.fill();
    } else {
      // Shadow particles - dark with red glow
      ctx.shadowColor = '#f00';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();
      
      // Red core
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = '#600';
      ctx.fill();
    }
    
    ctx.restore();
  });
  
  // Draw wave outline/aura
  const waveWidth = move.wave.width;
  const waveHeight = move.wave.height;
  const waveX = effects.x - waveWidth/2;
  const waveY = effects.y - waveHeight/2;
  
  ctx.save();
  ctx.globalAlpha = 0.3;
  
  // Wave shadow
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#111';
  ctx.fillRect(waveX, waveY, waveWidth, waveHeight);
  
  // Red glow around wave
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 20;
  ctx.strokeStyle = '#600';
  ctx.lineWidth = 3;
  ctx.strokeRect(waveX, waveY, waveWidth, waveHeight);
  
  ctx.restore();
  
  ctx.restore();
}

// Draw Shadow Slice sword animation with shadow trails
function drawShadowSliceSword(ctx, x, y, width, height, facing, player) {
  const centerX = x + width / 2;
  const baseY = y + height;
  const sword = player.sword;
  const swing = player.shadowSliceSwing;
  
  ctx.save();
  
  // Position at the sword arm (right arm when facing right, left when facing left)
  const armX = centerX + (24 * facing);
  const armY = baseY - 22;
  
  ctx.translate(armX, armY);
  
  // Apply facing direction
  if (facing < 0) {
    ctx.scale(-1, 1);
  }
  
  // Draw shadow trails first (behind the main sword)
  swing.shadowTrails.forEach((trail, i) => {
    ctx.save();
    ctx.rotate(trail.angle);
    
    // Shadow trail glow
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 8 + (trail.glowIntensity * 8);
    
    // Shadow trail blade (slightly transparent and smaller)
    ctx.globalAlpha = trail.alpha * 0.6;
    ctx.fillStyle = '#600';
    ctx.fillRect(0, -sword.width/2 * trail.scale, sword.length * trail.scale, sword.width * trail.scale);
    
    // Add red energy glow to shadow trail
    const gradient = ctx.createLinearGradient(0, 0, sword.length * trail.scale, 0);
    gradient.addColorStop(0, `rgba(255,0,0,${trail.alpha * 0.4})`);
    gradient.addColorStop(0.5, `rgba(255,0,0,${trail.alpha * 0.2})`);
    gradient.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, -sword.width/2 * trail.scale, sword.length * trail.scale, sword.width * trail.scale);
    
    ctx.restore();
  });
  
  // Apply main sword swing angle
  ctx.rotate(swing.angle);
  
  // Draw main sword with glow effect
  const glowIntensity = swing.glowIntensity;
  
  // Outer glow
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 12 + (glowIntensity * 8);
  
  // Sword blade
  ctx.fillStyle = '#222';
  ctx.fillRect(0, -sword.width/2, sword.length, sword.width);
  
  // Red energy glow along the blade
  const gradient = ctx.createLinearGradient(0, 0, sword.length, 0);
  gradient.addColorStop(0, `rgba(255,0,0,${glowIntensity * 0.9})`);
  gradient.addColorStop(0.5, `rgba(255,0,0,${glowIntensity * 0.6})`);
  gradient.addColorStop(1, 'rgba(255,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, -sword.width/2, sword.length, sword.width);
  
  // Hilt
  ctx.shadowBlur = 0;
  ctx.fillStyle = sword.hiltColor;
  ctx.fillRect(-12, -sword.width/2 - 1, 12, sword.width + 2);
  
  // Add motion blur effect (trail) when swinging
  if (glowIntensity > 0.4) {
    ctx.save();
    ctx.globalAlpha = glowIntensity * 0.4;
    ctx.translate(-sword.length * 0.25, 0);
    ctx.rotate(-0.15);
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, -sword.width/2, sword.length * 0.5, sword.width);
    ctx.restore();
  }
  
  ctx.restore();
}

// Draw Rising Cut sword animation with shadow trails
function drawRisingCutSword(ctx, x, y, width, height, facing, player) {
  const centerX = x + width / 2;
  const baseY = y + height;
  const sword = player.sword;
  const swing = player.risingCutSwing;
  
  ctx.save();
  
  // Position at the sword arm (right arm when facing right, left when facing left)
  const armX = centerX + (24 * facing);
  const armY = baseY - 22;
  
  ctx.translate(armX, armY);
  
  // Apply facing direction
  if (facing < 0) {
    ctx.scale(-1, 1);
  }
  
  // Draw shadow trails first (behind the main sword)
  swing.shadowTrails.forEach((trail, i) => {
    ctx.save();
    ctx.rotate(trail.angle);
    
    // Shadow trail glow
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 8 + (trail.glowIntensity * 8);
    
    // Shadow trail blade (slightly transparent and smaller)
    ctx.globalAlpha = trail.alpha * 0.6;
    ctx.fillStyle = '#600';
    ctx.fillRect(0, -sword.width/2 * trail.scale, sword.length * trail.scale, sword.width * trail.scale);
    
    // Add red energy glow to shadow trail
    const gradient = ctx.createLinearGradient(0, 0, sword.length * trail.scale, 0);
    gradient.addColorStop(0, `rgba(255,0,0,${trail.alpha * 0.4})`);
    gradient.addColorStop(0.5, `rgba(255,0,0,${trail.alpha * 0.2})`);
    gradient.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, -sword.width/2 * trail.scale, sword.length * trail.scale, sword.width * trail.scale);
    
    ctx.restore();
  });
  
  // Apply main sword swing angle
  ctx.rotate(swing.angle);
  
  // Draw main sword with glow effect
  const glowIntensity = swing.glowIntensity;
  
  // Outer glow
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 12 + (glowIntensity * 8);
  
  // Sword blade
  ctx.fillStyle = '#222';
  ctx.fillRect(0, -sword.width/2, sword.length, sword.width);
  
  // Red energy glow along the blade
  const gradient = ctx.createLinearGradient(0, 0, sword.length, 0);
  gradient.addColorStop(0, `rgba(255,0,0,${glowIntensity * 0.9})`);
  gradient.addColorStop(0.5, `rgba(255,0,0,${glowIntensity * 0.6})`);
  gradient.addColorStop(1, 'rgba(255,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, -sword.width/2, sword.length, sword.width);
  
  // Hilt
  ctx.shadowBlur = 0;
  ctx.fillStyle = sword.hiltColor;
  ctx.fillRect(-12, -sword.width/2 - 1, 12, sword.width + 2);
  
  // Add motion blur effect (trail) when swinging
  if (glowIntensity > 0.4) {
    ctx.save();
    ctx.globalAlpha = glowIntensity * 0.4;
    ctx.translate(-sword.length * 0.25, 0);
    ctx.rotate(-0.15);
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, -sword.width/2, sword.length * 0.5, sword.width);
    ctx.restore();
  }
  
  ctx.restore();
}

// Draw Down Light sword animation with shadow trails
function drawDownLightSword(ctx, x, y, width, height, facing, player) {
  const centerX = x + width / 2;
  const baseY = y + height;
  const sword = player.sword;
  const swing = player.downLightSwing;
  
  ctx.save();
  
  // Position at the sword arm (right arm when facing right, left when facing left)
  const armX = centerX + (24 * facing);
  const armY = baseY - 22;
  
  ctx.translate(armX, armY);
  
  // Apply facing direction
  if (facing < 0) {
    ctx.scale(-1, 1);
  }
  
  // Draw shadow trails first (behind the main sword)
  swing.shadowTrails.forEach((trail, i) => {
    ctx.save();
    ctx.rotate(trail.angle);
    
    // Shadow trail glow
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 8 + (trail.glowIntensity * 8);
    
    // Shadow trail blade (slightly transparent and smaller)
    ctx.globalAlpha = trail.alpha * 0.6;
    ctx.fillStyle = '#600';
    ctx.fillRect(0, -sword.width/2 * trail.scale, sword.length * trail.scale, sword.width * trail.scale);
    
    // Add red energy glow to shadow trail
    const gradient = ctx.createLinearGradient(0, 0, sword.length * trail.scale, 0);
    gradient.addColorStop(0, `rgba(255,0,0,${trail.alpha * 0.4})`);
    gradient.addColorStop(0.5, `rgba(255,0,0,${trail.alpha * 0.2})`);
    gradient.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, -sword.width/2 * trail.scale, sword.length * trail.scale, sword.width * trail.scale);
    
    ctx.restore();
  });
  
  // Apply main sword swing angle
  ctx.rotate(swing.angle);
  
  // Draw main sword with glow effect
  const glowIntensity = swing.glowIntensity;
  
  // Outer glow
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 12 + (glowIntensity * 8);
  
  // Sword blade
  ctx.fillStyle = '#222';
  ctx.fillRect(0, -sword.width/2, sword.length, sword.width);
  
  // Red energy glow along the blade
  const gradient = ctx.createLinearGradient(0, 0, sword.length, 0);
  gradient.addColorStop(0, `rgba(255,0,0,${glowIntensity * 0.9})`);
  gradient.addColorStop(0.5, `rgba(255,0,0,${glowIntensity * 0.6})`);
  gradient.addColorStop(1, 'rgba(255,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, -sword.width/2, sword.length, sword.width);
  
  // Hilt
  ctx.shadowBlur = 0;
  ctx.fillStyle = sword.hiltColor;
  ctx.fillRect(-12, -sword.width/2 - 1, 12, sword.width + 2);
  
  // Add motion blur effect (trail) when swinging
  if (glowIntensity > 0.4) {
    ctx.save();
    ctx.globalAlpha = glowIntensity * 0.4;
    ctx.translate(-sword.length * 0.25, 0);
    ctx.rotate(-0.15);
    ctx.fillStyle = '#f00';
    ctx.fillRect(0, -sword.width/2, sword.length * 0.5, sword.width);
    ctx.restore();
  }
  
  ctx.restore();
} 

// Draw Rakka's demon shadow samurai shield
export function drawRakkaShield(ctx, player) {
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  const time = Date.now() * 0.01;
  
  // Draw outer shadow aura (bigger)
  ctx.save();
  const outerPulse = 65 + Math.sin(time * 0.5) * 8; // Increased from 45 to 65
  ctx.globalAlpha = 0.15 + 0.05 * Math.abs(Math.sin(time * 0.3));
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 25; // Increased from 20 to 25
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerPulse, 0, Math.PI * 2);
  ctx.fillStyle = '#300';
  ctx.fill();
  ctx.restore();
  
  // Draw inner demonic shield (bigger)
  ctx.save();
  const innerPulse = 50 + Math.sin(time * 0.4) * 5; // Increased from 35 to 50
  ctx.globalAlpha = 0.25 + 0.1 * Math.abs(Math.sin(time * 0.4));
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 20; // Increased from 15 to 20
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerPulse, 0, Math.PI * 2);
  ctx.fillStyle = '#600';
  ctx.fill();
  ctx.restore();
  
  // Draw swirling shadow energy (bigger radius)
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + time * 0.8;
    const radius = 45 + Math.sin(time * 0.6 + i) * 12; // Increased from 30 to 45
    const swirlX = centerX + Math.cos(angle) * radius;
    const swirlY = centerY + Math.sin(angle) * radius;
    
    ctx.save();
    ctx.globalAlpha = 0.4 + 0.2 * Math.abs(Math.sin(time * 0.5 + i));
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 10; // Increased from 8 to 10
    ctx.beginPath();
    ctx.arc(swirlX, swirlY, 6 + Math.sin(time * 0.3 + i) * 3, 0, Math.PI * 2); // Increased from 4 to 6
    ctx.fillStyle = '#f00';
    ctx.fill();
    ctx.restore();
  }
  
  // Draw demonic runes around the shield (bigger radius)
  const runeCount = 6;
  for (let i = 0; i < runeCount; i++) {
    const runeAngle = (i / runeCount) * Math.PI * 2 + time * 0.2;
    const runeRadius = 55; // Increased from 40 to 55
    const runeX = centerX + Math.cos(runeAngle) * runeRadius;
    const runeY = centerY + Math.sin(runeAngle) * runeRadius;
    
    ctx.save();
    ctx.translate(runeX, runeY);
    ctx.rotate(runeAngle + Math.PI / 2);
    ctx.globalAlpha = 0.7 + 0.3 * Math.abs(Math.sin(time * 0.4 + i));
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 8; // Increased from 6 to 8
    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 3; // Increased from 2 to 3
    
    // Draw demonic rune symbol (bigger)
    ctx.beginPath();
    ctx.moveTo(-4, -8); // Increased from -3,-6 to -4,-8
    ctx.lineTo(4, -8);  // Increased from 3,-6 to 4,-8
    ctx.moveTo(0, -8);  // Increased from 0,-6 to 0,-8
    ctx.lineTo(0, 8);   // Increased from 0,6 to 0,8
    ctx.moveTo(-4, 0);  // Increased from -3,0 to -4,0
    ctx.lineTo(4, 0);   // Increased from 3,0 to 4,0
    ctx.stroke();
    
    ctx.restore();
  }
  
  // Draw shadow particles (bigger radius)
  for (let i = 0; i < 12; i++) {
    const particleAngle = (i / 12) * Math.PI * 2 + time * 0.3;
    const particleRadius = 35 + Math.random() * 20; // Increased from 25+15 to 35+20
    const particleX = centerX + Math.cos(particleAngle) * particleRadius;
    const particleY = centerY + Math.sin(particleAngle) * particleRadius;
    
    ctx.save();
    ctx.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(time * 0.2 + i));
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6; // Increased from 4 to 6
    ctx.beginPath();
    ctx.arc(particleX, particleY, 3 + Math.sin(time * 0.1 + i), 0, Math.PI * 2); // Increased from 2 to 3
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.restore();
  }
  
  // Draw shield energy bar
  const shieldBarWidth = 60;
  const shieldBarHeight = 8;
  const shieldBarX = player.x;
  const shieldBarY = player.y - 15;
  
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(shieldBarX, shieldBarY, shieldBarWidth, shieldBarHeight);
  
  const shieldPercentage = player.shieldDuration / player.maxShieldDuration;
  const gradient = ctx.createLinearGradient(shieldBarX, shieldBarY, shieldBarX + shieldBarWidth * shieldPercentage, shieldBarY);
  gradient.addColorStop(0, '#600');
  gradient.addColorStop(1, '#f00');
  ctx.fillStyle = gradient;
  ctx.fillRect(shieldBarX, shieldBarY, shieldBarWidth * shieldPercentage, shieldBarHeight);
  
  // Add demonic glow to shield bar
  ctx.shadowColor = '#f00';
  ctx.shadowBlur = 8;
  ctx.strokeStyle = '#f00';
  ctx.lineWidth = 1;
  ctx.strokeRect(shieldBarX, shieldBarY, shieldBarWidth, shieldBarHeight);
  ctx.restore();
}