import { PhysicsBody, JUMP_FORCE, SECOND_JUMP_FORCE } from './physics.js';
import { initializeKaon, updateKaon } from '../characters/Kaon/designKaon.js';
import { initializeRakka, updateRakka } from '../characters/Rakka/designRakka.js';

export class Player extends PhysicsBody {
  constructor(x, y, color, facing, characterData) {
    const moveset = characterData.moveset || {};
    const weight = typeof moveset.weight === 'number' ? moveset.weight : 1.0;
    const jumpForce = typeof moveset.jumpForce === 'number' ? moveset.jumpForce : JUMP_FORCE;
    super(x, y, 60, 60, weight, jumpForce);
    this.moveSpeed = typeof moveset.moveSpeed === 'number' ? moveset.moveSpeed : 5;
    
    // Store initial properties that don't change
    this.initialX = x;
    this.initialY = y;
    this.initialColor = color;
    this.initialFacing = facing;
    this.width = 60;
    this.height = 60;
    this.maxShieldDuration = 120; // 6 seconds of shield
    this.shieldRechargeTime = 120; // 6 seconds to recharge shield

    // Store character-specific data
    this.characterName = characterData.name;
    this.moveset = characterData.moveset;
    this.animation = {
      isWalking: false,
      frame: 0,
      timer: 0,
      speed: 4, // Update frame every 4 game frames
      numFrames: 2
    };

    // Aerial restrictions
    this.upHeavyUsedInAir = false;
    this.fastFallActive = false;

    // Charging system for neutral heavy
    this.isCharging = false;
    this.chargeTime = 0;
    this.maxChargeTime = 120; // 2 seconds at 60fps (increased from 60)
    this.chargeLevel = 0; // 0-1 scale

    // Initialize character-specific properties
    if (this.characterName === 'Kaon') {
      initializeKaon(this);
      this.attackFrame = 0; // For orb animation
    }
    if (this.characterName === 'Rakka') {
      initializeRakka(this);
    }

    // Multi-hit tracking for moves like Phantom Slash
    this.multiHitData = {
      currentHit: 0,
      maxHits: 0,
      hitCooldown: 0,
      lastHitTarget: null,
      hitTiming: [] // Array of frame numbers when hits should occur
    };

    // Set initial state
    this.fullReset();
  }

  fullReset() {
    this.x = this.initialX;
    this.y = this.initialY;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = true;

    this.color = this.initialColor;
    this.facing = this.initialFacing;
    this.damage = 0;
    this.score = 0;

    this.isAttacking = false;
    this.attackCooldown = 0;
    this.lightAttackCooldown = 0;
    this.heavyAttackCooldown = 0;
    this.attackHitbox = null;
    this.attackHitbox2 = null;
    this.attackType = null;
    
    this.jumpsRemaining = 2;
    this.isJumpKeyPressed = false;
    this.lastHitTarget = null;
    this.hitCooldown = 0;
    
    this.respawnInvincibilityFrames = 0;
    this.isBlinking = false;
    this.gameStarted = false;
    
    this.isShielding = false;
    this.shieldCooldown = 0;
    this.shieldDuration = 0;
    this.animation = {
      isWalking: false,
      frame: 0,
      timer: 0,
      speed: 4,
      numFrames: 2
    };

    // Reset aerial restrictions
    this.upHeavyUsedInAir = false;
    this.fastFallActive = false;

    // Reset charging system
    this.isCharging = false;
    this.chargeTime = 0;
    this.chargeLevel = 0;

    // Reset character-specific properties
    if (this.characterName === 'Kaon') {
      initializeKaon(this);
      this.attackFrame = 0;
    }
    if (this.characterName === 'Rakka') {
      initializeRakka(this);
    }

    // Reset multi-hit data
    this.multiHitData = {
      currentHit: 0,
      maxHits: 0,
      hitCooldown: 0,
      lastHitTarget: null,
      hitTiming: []
    };

    console.log('Player state has been fully reset for:', this.color);
  }

  update(platforms, otherPlayer) {
    // Sync attack and shield states with parent PhysicsBody
    super.isAttacking = this.isAttacking;
    super.isShielding = this.isShielding;
    super.isCharging = this.isCharging;
    
    super.update(platforms);
    
    // Update animation state
    if (Math.abs(this.vx) > 0.1 && this.isGrounded) {
      this.animation.isWalking = true;
      this.animation.timer++;
      if (this.animation.timer >= this.animation.speed) {
        this.animation.timer = 0;
        this.animation.frame = (this.animation.frame + 1) % this.animation.numFrames;
      }
    } else {
      this.animation.isWalking = false;
      this.animation.frame = 0;
      this.animation.timer = 0;
    }

    // Update character-specific animations
    if (this.characterName === 'Kaon') {
      updateKaon(this);
      if (this.isAttacking) {
        this.attackFrame = (this.attackFrame || 0) + 1;
      } else {
        this.attackFrame = 0;
      }
    } else if (this.characterName === 'Rakka') {
      updateRakka(this);
      
      // For Demon Fang, only reset stance and effects after attack ends
      if (!this.isCharging && !this.isAttacking && this.demonFangEffects?.originalX !== undefined) {
        // Clear effects but keep the new position
        this.demonFangEffects.originalX = undefined;
        this.demonFangEffects.thrustDistance = 0;
      }
    }

    // Update attack cooldowns
    if (this.lightAttackCooldown > 0) {
      this.lightAttackCooldown--;
    }
    if (this.heavyAttackCooldown > 0) {
      this.heavyAttackCooldown--;
    }
    
    // Update hit cooldown
    if (this.hitCooldown > 0) {
      this.hitCooldown--;
    }
    
    // Update multi-hit cooldown
    if (this.multiHitData.hitCooldown > 0) {
      this.multiHitData.hitCooldown--;
    }
    
    // Update shield mechanics
    if (this.isShielding) {
      this.shieldDuration++;
      // Deactivate shield if duration is exhausted
      if (this.shieldDuration >= this.maxShieldDuration) {
        this.isShielding = false;
        this.shieldCooldown = this.shieldRechargeTime;
        console.log('Shield exhausted for:', this.color);
      }
    } else {
      // Recharge shield when not shielding
      if (this.shieldDuration > 0) {
        this.shieldDuration--;
      }
      // Reduce cooldown
      if (this.shieldCooldown > 0) {
        this.shieldCooldown--;
      }
    }
    
    // Update respawn invincibility
    if (this.respawnInvincibilityFrames > 0) {
      this.respawnInvincibilityFrames--;
      // Blink every 3 frames for visual effect
      this.isBlinking = (this.respawnInvincibilityFrames % 6) < 3;
    } else {
      this.isBlinking = false;
    }
    
    // Update attack state
    if (this.isAttacking) {
      this.attackCooldown--;
      if (this.attackCooldown === 0) {
        this.isAttacking = false;
        this.attackHitbox = null;
        this.attackHitbox2 = null;
        this.attackType = null;
        this.activeMove = null; // Reset active move
        this.lastHitTarget = null; // Reset last hit target when attack ends
        
        // Reset sword swing animation when attack ends
        if (this.swordSwing) {
          this.swordSwing.isActive = false;
          this.swordSwing.frame = 0;
          this.swordSwing.glowIntensity = 0;
        }
      }
    }
    
    // Update attack hitbox
    if (this.isAttacking) {
      this.updateAttackHitbox();
    }

    // Reset jumps when landing on ground
    if (this.isGrounded && this.jumpsRemaining !== 2) {
      console.log('=== RESETTING JUMPS ===');
      console.log('Previous jumps remaining:', this.jumpsRemaining);
      this.jumpsRemaining = 2;
      console.log('New jumps remaining:', this.jumpsRemaining);
    }

    // Reset aerial restrictions when landing
    if (this.isGrounded) {
      this.upHeavyUsedInAir = false;
      this.fastFallActive = false;
    }

    // Update charging system
    if (this.isCharging) {
      this.chargeTime++;
      this.chargeLevel = Math.min(this.chargeTime / this.maxChargeTime, 1.0);
      
      // Keep charge at maximum when fully charged
      if (this.chargeTime >= this.maxChargeTime) {
        this.chargeTime = this.maxChargeTime;
        this.chargeLevel = 1.0;
      }
      
      // Debug logging every 30 frames
      if (this.chargeTime % 30 === 0) {
        console.log('Charging update:', {
          character: this.characterName,
          chargeTime: this.chargeTime,
          chargeLevel: this.chargeLevel.toFixed(3),
          maxChargeTime: this.maxChargeTime,
          isCharging: this.isCharging,
          isAttacking: this.isAttacking,
          isShielding: this.isShielding
        });
      }
    } else {
      // Debug when not charging but should be
      if (this.chargeTime > 0) {
        console.log('Charging stopped unexpectedly:', {
          character: this.characterName,
          chargeTime: this.chargeTime,
          chargeLevel: this.chargeLevel.toFixed(3),
          isCharging: this.isCharging,
          isAttacking: this.isAttacking,
          isShielding: this.isShielding
        });
      }
    }

    // === DEMON FANG THRUST LOGIC ===
    if (
      this.characterName === 'Rakka' &&
      this.isAttacking &&
      this.activeMove &&
      this.activeMove.name === 'Demon Fang' &&
      this.demonFangEffects &&
      this.demonFangEffects.thrustDistance > 0
    ) {
      // THIS LOGIC IS BEING MOVED TO fireChargedAttack()
    } else {
      this.canAct = true;
      if (this.demonFangEffects && this.demonFangEffects.lockedFacing !== undefined) {
        delete this.demonFangEffects.lockedFacing;
      }
      if (this.demonFangEffects && this.demonFangEffects.dashHitbox) {
        this.demonFangEffects.dashHitbox = null;
        this.demonFangEffects.hasHitOpponent = false;
      }
    }

    // Always check collision to prevent passing through other players
    this.checkPlayerCollision(otherPlayer);
  }

  attack(direction, type) {
    const moveName = `${direction}${type.charAt(0).toUpperCase() + type.slice(1)}`; // e.g., "sideLight"
    const move = this.moveset[moveName];

    if (!move) {
      console.error(`Move ${moveName} not found for character ${this.characterName}`);
      return;
    }

    // Check if the specific attack type is on cooldown
    const cooldownType = `${type}AttackCooldown`;
    if (this[cooldownType] > 0) {
      return; // Can't use this attack type yet
    }

    // For Rakka's Shadow Sneak (sideHeavy), start charging instead of immediate attack
    if (this.characterName === 'Rakka' && move.name === 'Shadow Sneak') {
      this.startCharge(move);
      return;
    }

    // Aerial restrictions for heavy attacks
    if (type === 'heavy') {
      if (direction === 'up' && !this.isGrounded && this.upHeavyUsedInAir) {
        console.log('Up heavy blocked - already used in air');
        return; // Can't use up heavy again until landing
      }
      if (direction === 'down' && !this.isGrounded) {
        console.log('Down heavy blocked - cannot use in air');
        return; // Can't use down heavy in air
      }
    }

    this.isAttacking = true;
    this.attackType = type;
    this.activeMove = move; // Store the active move data
    
    // Set cooldowns based on attack type
    this.attackCooldown = move.duration; // Duration of the attack
    this[cooldownType] = move.cooldown; // Cooldown before next attack of this type
    
    // Track up heavy usage in air
    if (direction === 'up' && type === 'heavy' && !this.isGrounded) {
      this.upHeavyUsedInAir = true;
      console.log('Up heavy used in air - will be blocked until landing');
    }
    
    // Trigger self-launch immediately for Gravity Spike (for recovery purposes)
    if (move.selfLaunch) {
      const launchForce = move.selfLaunchForce || 20;
      this.vy = -launchForce; // Launch the attacker upward immediately
      console.log('Self-launch triggered immediately for:', this.characterName, 'with force:', launchForce);
    }
    
    this.createAttackHitbox();

    // Reset attackFrame for Kaon
    if (this.characterName === 'Kaon') {
      this.attackFrame = 0;
    }

    // Handle character-specific charged attacks
    if (this.characterName === 'Rakka') {
      if (move.name === 'Demon Fang') {
        const thrustDistance = move.chargeScaling.thrust * this.chargeLevel;
        // Store original position and set thrust distance
        if (this.demonFangEffects) {
          this.demonFangEffects.originalX = this.x;
          this.demonFangEffects.thrustDistance = thrustDistance;
          // Apply immediate forward thrust
          this.x += thrustDistance * this.facing;
        }
        
        // Scale hitbox based on charge level
        const rangeMultiplier = 1.0 + (this.chargeLevel * move.chargeScaling.range);
        this.activeMove.hitbox = {
          ...move.hitbox,
          width: Math.floor(move.hitbox.width * rangeMultiplier),
          offsetX: Math.floor(move.hitbox.offsetX * rangeMultiplier)
        };
      } else if (move.name === 'Shadow Sneak') {
        // Teleport to shadow position
        if (this.shadowSneak && this.shadowSneak.active) {
          this.x = this.shadowSneak.x;
          this.shadowSneak.active = false;
        }
        
        // Start sword swing animation
        if (this.swordSwing) {
          this.swordSwing.isActive = true;
          this.swordSwing.frame = 0;
          this.swordSwing.angle = this.swordSwing.startAngle;
          this.swordSwing.glowIntensity = 0;
        }
        
        // Create a sword swing hitbox at the new position
        const swingHitbox = {
          width: 90,
          height: 22,
          offsetX: this.facing > 0 ? 40 : -70,
          offsetY: 8
        };
        this.activeMove.hitbox = swingHitbox;
        this.createAttackHitbox();
      } else if (move.name === 'Phantom Slash') {
        // Set up multi-hit data for Phantom Slash
        this.multiHitData.maxHits = move.multiHit || 4;
        this.multiHitData.currentHit = 0;
        this.multiHitData.hitCooldown = 0;
        this.multiHitData.lastHitTarget = null;
        
        // Set up hit timing (hits at frames 8, 16, 24, 32 of the 54-frame duration)
        this.multiHitData.hitTiming = [8, 16, 24, 32];
        
        // Apply self-launch for upward movement
        if (move.selfLaunch) {
          const launchForce = move.selfLaunchForce || 16;
          this.vy = -launchForce;
          console.log('Phantom Slash self-launch triggered with force:', launchForce);
        }
        
        // Create initial hitbox
        this.createAttackHitbox();
      }
    }
  }

  createAttackHitbox() {
    if (!this.activeMove || !this.activeMove.hitbox) return;

    // For Demon Fang, do not create a normal attack hitbox; use body collision during thrust instead
    if (this.characterName === 'Rakka' && this.activeMove.name === 'Demon Fang') {
      this.attackHitbox = null;
      this.attackHitbox2 = null;
      return;
    }

    // For Void Splitter, do not create a normal attack hitbox; only the shadow wave is the hitbox
    if (this.characterName === 'Rakka' && this.activeMove.name === 'Void Splitter') {
      this.attackHitbox = null;
      this.attackHitbox2 = null;
      return;
    }

    const hitboxData = this.activeMove.hitbox;
    
    console.log('Creating attack hitbox:', {
      moveName: this.activeMove.name,
      chargeLevel: this.chargeLevel,
      isCharged: this.chargeLevel > 0,
      originalWidth: hitboxData.width,
      originalHeight: hitboxData.height,
      originalOffsetX: hitboxData.offsetX
    });
    
    // Scale hitbox for charged neutral heavy attacks
    let hitboxWidth = hitboxData.width;
    let hitboxHeight = hitboxData.height;
    let hitboxOffsetX = hitboxData.offsetX;
    
    if (this.attackType === 'heavy' && this.activeMove.name === 'Core Beam' && this.chargeLevel > 0) {
      // Scale hitbox size and range based on charge level (1.0x to 4.0x)
      const sizeMultiplier = 1.0 + (this.chargeLevel * 3.0);
      hitboxWidth = Math.floor(hitboxData.width * sizeMultiplier);
      hitboxHeight = Math.floor(hitboxData.height * sizeMultiplier);
      hitboxOffsetX = Math.floor(hitboxData.offsetX * sizeMultiplier);
      
      console.log('Scaled hitbox for charged attack:', {
        chargeLevel: this.chargeLevel.toFixed(3),
        sizeMultiplier: sizeMultiplier.toFixed(3),
        originalWidth: hitboxData.width,
        newWidth: hitboxWidth,
        originalHeight: hitboxData.height,
        newHeight: hitboxHeight,
        originalOffsetX: hitboxData.offsetX,
        newOffsetX: hitboxOffsetX
      });
    }
    
    // Position hitbox in front of the player based on facing direction
    let hitboxX;
    if (this.facing > 0) {
      // Facing right, use offsetX as is
      hitboxX = this.x + hitboxOffsetX;
    } else {
      // Facing left, invert offsetX and adjust for player and hitbox width
      hitboxX = this.x - hitboxOffsetX - hitboxWidth + this.width;
    }
    
    this.attackHitbox = {
      x: hitboxX,
      y: this.y + hitboxData.offsetY,
      width: hitboxWidth,
      height: hitboxHeight
    };

    // Handle dual hitboxes for downHeavy (Dual Blast)
    if (this.activeMove.hitbox2) {
      const hitbox2Data = this.activeMove.hitbox2;
      let hitbox2X;
      if (this.facing > 0) {
        hitbox2X = this.x + hitbox2Data.offsetX;
      } else {
        hitbox2X = this.x - hitbox2Data.offsetX - hitbox2Data.width + this.width;
      }
      
      this.attackHitbox2 = {
        x: hitbox2X,
        y: this.y + hitbox2Data.offsetY,
        width: hitbox2Data.width,
        height: hitbox2Data.height
      };
    } else {
      this.attackHitbox2 = null;
    }
  }

  updateAttackHitbox() {
    if (!this.activeMove || !this.activeMove.hitbox || !this.attackHitbox) return;
    
    const hitboxData = this.activeMove.hitbox;
    
    // Only update position, not size (size is set in createAttackHitbox)
    let hitboxOffsetX = hitboxData.offsetX;
    
    // For charged Core Beam, use the scaled offset that was already calculated
    if (this.attackType === 'heavy' && this.activeMove.name === 'Core Beam' && this.chargeLevel > 0) {
      const sizeMultiplier = 1.0 + (this.chargeLevel * 3.0);
      hitboxOffsetX = Math.floor(hitboxData.offsetX * sizeMultiplier);
    }
      
    // Position hitbox in front of the player based on facing direction
    let hitboxX;
    if (this.facing > 0) {
      hitboxX = this.x + hitboxOffsetX;
    } else {
      hitboxX = this.x - hitboxOffsetX - this.attackHitbox.width + this.width;
    }
    
    this.attackHitbox.x = hitboxX;
    this.attackHitbox.y = this.y + hitboxData.offsetY;
    // Don't change width/height here - they're already set in createAttackHitbox

    // Update second hitbox if it exists
    if (this.attackHitbox2 && this.activeMove.hitbox2) {
      const hitbox2Data = this.activeMove.hitbox2;
      let hitbox2X;
      if (this.facing > 0) {
        hitbox2X = this.x + hitbox2Data.offsetX;
      } else {
        hitbox2X = this.x - hitbox2Data.offsetX - hitbox2Data.width + this.width;
      }
      
      this.attackHitbox2.x = hitbox2X;
      this.attackHitbox2.y = this.y + hitbox2Data.offsetY;
    }
  }

  checkAttackHit(otherPlayer) {
    // Special handling for Void Splitter wave (no normal hitbox)
    if (this.activeMove && this.activeMove.name === 'Void Splitter') {
      return this.checkVoidSplitterHit(otherPlayer);
    }
    
    if (!this.isAttacking || !this.attackHitbox) return false;
    
    // Check if we've already hit this target recently (prevent spam damage)
    if (this.lastHitTarget === otherPlayer && this.hitCooldown > 0) {
      return false;
    }

    // Special handling for Phantom Slash multi-hit
    if (this.activeMove && this.activeMove.name === 'Phantom Slash') {
      return this.checkPhantomSlashHit(otherPlayer);
    }

    // Check primary hitbox
    const hit = this.checkHitboxCollision(this.attackHitbox, otherPlayer);
    
    // Check secondary hitbox if it exists
    const hit2 = this.attackHitbox2 ? this.checkHitboxCollision(this.attackHitbox2, otherPlayer) : false;
    
    // If either hitbox hits, set cooldown and mark target
    if (hit || hit2) {
      this.lastHitTarget = otherPlayer;
      this.hitCooldown = 10; // 10 frames cooldown between hits on same target
      
      console.log('Attack hit detected!', {
        attacker: this.characterName,
        move: this.activeMove.name,
        target: otherPlayer.characterName,
        attackType: this.attackType,
        hitbox1Hit: hit,
        hitbox2Hit: hit2,
        cooldownSet: this.hitCooldown
      });
    }
    
    return hit || hit2;
  }

  checkPhantomSlashHit(otherPlayer) {
    const move = this.activeMove;
    const multiHit = this.multiHitData;
    
    // Check if it's time for the next hit
    const currentFrame = move.duration - this.attackCooldown;
    const nextHitFrame = multiHit.hitTiming[multiHit.currentHit];
    
    if (currentFrame < nextHitFrame) {
      return false; // Not time for this hit yet
    }
    
    // Check if we've already hit this target with this specific hit
    if (multiHit.lastHitTarget === otherPlayer && multiHit.hitCooldown > 0) {
      return false;
    }
    
    // Check hitbox collision
    const hit = this.checkHitboxCollision(this.attackHitbox, otherPlayer);
    
    if (hit) {
      // Determine if this is the final hit
      const isFinalHit = multiHit.currentHit === multiHit.maxHits - 1;
      
      // Calculate damage and knockback
      let damage = move.damage;
      let knockback = move.knockback;
      
      if (isFinalHit) {
        // Final hit has extra damage and knockback
        damage = move.finalHitDamage || move.damage * 1.5;
        knockback = move.finalHitKnockback || move.knockback * 2;
      }
      
      // Apply damage
      otherPlayer.takeDamage(damage, this);
      
      // Set cooldown for this specific hit
      multiHit.hitCooldown = 8; // 8 frames between hits
      multiHit.lastHitTarget = otherPlayer;
      
      // Move to next hit
      multiHit.currentHit++;
      
      console.log('Phantom Slash hit!', {
        hitNumber: multiHit.currentHit,
        isFinalHit: isFinalHit,
        damage: damage,
        knockback: knockback,
        target: otherPlayer.characterName
      });
      
      return true;
    }
    
    return false;
  }

  checkVoidSplitterHit(otherPlayer) {
    const move = this.activeMove;
    const effects = this.voidSplitterEffects;
    
    // Check if wave is active and has hit cooldown
    if (effects.wave.hitCooldown > 0) {
      return false;
    }
    
    // Only check wave hitbox - shadow is the only hitbox
    let waveHit = false;
    if (effects.wave.isActive && move.wave) {
      const waveHitbox = {
        x: effects.wave.x - move.wave.width/2,
        y: effects.wave.y - move.wave.height/2,
        width: move.wave.width,
        height: move.wave.height
      };
      waveHit = this.checkHitboxCollision(waveHitbox, otherPlayer);
    }
    
    if (waveHit) {
      // Wave hit - wave damage
      otherPlayer.takeDamage(move.wave.damage, this);
      effects.wave.lastHitTarget = otherPlayer;
      effects.wave.hitCooldown = move.wave.hitCooldown;
      console.log('Void Splitter wave hit!', {
        attacker: this.characterName,
        target: otherPlayer.characterName,
        damage: move.wave.damage,
        waveDistance: effects.wave.distance
      });
      
      return true;
    }
    
    return false;
  }

  checkHitboxCollision(hitbox, otherPlayer) {
    return (
      hitbox.x < otherPlayer.x + otherPlayer.width &&
      hitbox.x + hitbox.width > otherPlayer.x &&
      hitbox.y < otherPlayer.y + otherPlayer.height &&
      hitbox.y + hitbox.height > otherPlayer.y
    );
  }

  takeDamage(amount, attacker) {
    // Don't take damage if respawn invincibility is active
    if (this.respawnInvincibilityFrames > 0) {
      console.log('Damage blocked by respawn invincibility:', {
        target: this.color,
        attacker: attacker.color,
        remainingFrames: this.respawnInvincibilityFrames
      });
      return;
    }
    
    // Check if shield is active and block the attack
    if (this.isShielding) {
      console.log('Attack blocked by shield:', {
        target: this.color,
        attacker: attacker.color,
        shieldDuration: this.shieldDuration
      });
      return; // Shield blocks all damage and knockback
    }
    
    // Add damage but cap at 999%
    this.damage = Math.min(this.damage + amount, 999);
    this.invincibilityFrames = 30; // 30 frames of invincibility after being hit (reduced from 120)
    
    // Handle special knockback effects
    let knockbackDirection = attacker.facing;
    let knockbackForce = attacker.activeMove ? (attacker.activeMove.knockback || 1) : 1;
    
    // Handle spike knockback (downward force)
    if (attacker.activeMove && attacker.activeMove.spikeKnockback) {
      knockbackDirection = 0; // No horizontal knockback
      knockbackForce = 15; // Strong downward force
      this.vy = Math.abs(knockbackForce); // Force downward movement
    }
    
    // Handle upward knockback (Ki Blast)
    if (attacker.activeMove && attacker.activeMove.upwardKnockback) {
      knockbackDirection = 0; // No horizontal knockback
      knockbackForce = 15; // Strong upward force
      this.vy = -Math.abs(knockbackForce); // Force upward movement
    }
    
    // Handle self-launch for the attacker (Gravity Spike)
    if (attacker.activeMove && attacker.activeMove.selfLaunch) {
      const launchForce = attacker.activeMove.selfLaunchForce || 20; // Use custom force or default
      attacker.vy = -launchForce; // Launch the attacker upward
      console.log('Self-launch triggered for:', attacker.characterName, 'with force:', launchForce);
    }
    
    console.log('Taking damage:', {
      target: this.characterName,
      attacker: attacker.characterName,
      damage: amount,
      totalDamage: this.damage,
      knockbackDirection: knockbackDirection,
      knockbackForce: knockbackForce,
      spikeKnockback: attacker.activeMove?.spikeKnockback || false,
      upwardKnockback: attacker.activeMove?.upwardKnockback || false,
      selfLaunch: attacker.activeMove?.selfLaunch || false
    });
    
    // Apply knockback (skip if it's a spike or upward blast)
    if (!attacker.activeMove?.spikeKnockback && !attacker.activeMove?.upwardKnockback) {
      this.applyKnockback(knockbackDirection, this.damage);
    }
  }

  jump() {
    console.log('=== JUMP ATTEMPT ===');
    console.log('Jumps remaining:', this.jumpsRemaining);
    console.log('Is grounded:', this.isGrounded);
    console.log('Is jump key pressed:', this.isJumpKeyPressed);
    console.log('Is shielding:', this.isShielding);
    console.log('Is attacking:', this.isAttacking);
    
    // Don't allow jumping if shielding or attacking
    if (this.isShielding || this.isAttacking) {
      console.log('Jump blocked - shielding or attacking');
      return;
    }
    
    // If this is a new jump press (key wasn't pressed before)
    if (!this.isJumpKeyPressed && this.jumpsRemaining > 0) {
      // Use different jump forces for first and second jump
      const jumpForce = this.jumpsRemaining === 2 ? JUMP_FORCE : SECOND_JUMP_FORCE;
      this.vy = jumpForce;
      this.isGrounded = false;
      this.jumpsRemaining--;
      console.log('Jump successful!');
      console.log('Used force:', jumpForce);
      console.log('Jumps remaining after jump:', this.jumpsRemaining);
    }
    
    this.isJumpKeyPressed = true;
  }

  resetPosition(x, y) {
    super.resetPosition(x, y);  // Call parent class's resetPosition
    this.damage = 0;  // Reset damage when position is reset
    this.jumpsRemaining = 2; // Reset jumps when position is reset
    this.isGrounded = true; // Ensure grounded state is set
    this.isJumpKeyPressed = false; // Reset jump key state
    
    // Only activate respawn invincibility if game has started (not during initial setup)
    if (this.gameStarted) {
      // Activate respawn invincibility (210 frames of blinking invincibility)
      this.respawnInvincibilityFrames = 210;
      this.isBlinking = true;
      
      console.log('Player respawned with invincibility:', {
        color: this.color,
        x: x,
        y: y,
        invincibilityFrames: this.respawnInvincibilityFrames
      });
    } else {
      // During initial setup, ensure no invincibility
      this.respawnInvincibilityFrames = 0;
      this.isBlinking = false;
    }
  }

  setGameStarted(status) {
    this.gameStarted = status;
    if (status) {
      console.log('Game started for player:', this.color);
    } else {
      console.log('Game stopped for player:', this.color);
    }
  }

  setInitialPosition(x, y) {
    // This function sets the definitive starting position for a player
    // It should be called once the platform is established.
    this.initialX = x;
    this.initialY = y;
    
    // Set position without triggering invincibility (for initial setup only)
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = true;
    this.damage = 0;
    this.jumpsRemaining = 2;
    this.isJumpKeyPressed = false;
    this.respawnInvincibilityFrames = 0;
    this.isBlinking = false;
    
    console.log('Player initial position set and stored:', {
      color: this.color,
      x: x,
      y: y
    });
  }

  activateShield() {
    // Can only shield if not on cooldown and shield duration is available
    if (this.shieldCooldown === 0 && this.shieldDuration < this.maxShieldDuration) {
      this.isShielding = true;
      console.log('Shield activated for:', this.color);
    }
  }

  deactivateShield() {
    this.isShielding = false;
  }

  startCharge(move) {
    console.log('startCharge called for:', this.characterName, {
      isAttacking: this.isAttacking,
      isShielding: this.isShielding,
      isCharging: this.isCharging,
      chargeTime: this.chargeTime,
      chargeLevel: this.chargeLevel
    });
    
    // Don't start charging if already charging, attacking, or shielding
    if (this.isCharging || this.isAttacking || this.isShielding) {
      console.log('Cannot start charging - already charging:', this.isCharging, 'attacking:', this.isAttacking, 'shielding:', this.isShielding);
      return;
    }
    
    // Set the active move. Default to neutralHeavy if no move is passed.
    this.activeMove = move || this.moveset.neutralHeavy;
    
    this.isCharging = true;
    this.chargeTime = 0;
    this.chargeLevel = 0;
    console.log('Started charging for:', this.characterName, {
      chargeTime: this.chargeTime,
      chargeLevel: this.chargeLevel,
      isCharging: this.isCharging,
      activeMove: this.activeMove?.name
    });
  }

  releaseCharge() {
    if (this.isCharging) {
      console.log('Releasing charge for:', this.characterName, {
        finalChargeTime: this.chargeTime,
        finalChargeLevel: this.chargeLevel.toFixed(3)
      });
      
      this.isCharging = false;
      
      // Only fire if we have some charge and the move is chargeable
      if (this.activeMove && this.activeMove.chargeable && this.chargeLevel > 0.1) {
        this.fireChargedAttack();
      } else {
        // If not enough charge, just reset the activeMove
        this.activeMove = null;
      }
      
      // Reset charge after attack is created
      this.chargeTime = 0;
      this.chargeLevel = 0;
      console.log('Released charge with level:', this.chargeLevel);
    } else {
      console.log('Cannot release charge - not charging');
    }
  }

  fireChargedAttack() {
    const move = this.activeMove;
    if (!move) return;

    this.isAttacking = true;
    this.attackType = 'heavy';
    
    // Scale damage, knockback, and duration based on charge level (0.2x to 2.0x)
    const chargeMultiplier = 0.2 + (this.chargeLevel * 1.8);
    
    // Create scaled properties without overwriting the original move
    this.activeMove = {
      ...move,
      damage: Math.floor(move.damage * chargeMultiplier),
      knockback: move.knockback * chargeMultiplier,
      duration: Math.floor(move.duration * (0.7 + this.chargeLevel * 0.8))
    };

    // Handle character-specific charged attacks
    if (this.characterName === 'Rakka') {
      if (move.name === 'Demon Fang') {
        const thrustDistance = move.chargeScaling.thrust * this.chargeLevel;
        if (this.demonFangEffects) {
          this.demonFangEffects.originalX = this.x;
          this.demonFangEffects.thrustDistance = thrustDistance;
          this.x += thrustDistance * this.facing;
        }
        const rangeMultiplier = 1.0 + (this.chargeLevel * move.chargeScaling.range);
        this.activeMove.hitbox = {
          ...move.hitbox,
          width: Math.floor(move.hitbox.width * rangeMultiplier),
          offsetX: Math.floor(move.hitbox.offsetX * rangeMultiplier)
        };
        this.createAttackHitbox();
      } else if (move.name === 'Shadow Sneak') {
        // Teleport to shadow position
        if (this.shadowSneak && this.shadowSneak.active) {
          this.x = this.shadowSneak.x;
          this.shadowSneak.active = false;
        }
        
        // Start sword swing animation
        if (this.swordSwing) {
          this.swordSwing.isActive = true;
          this.swordSwing.frame = 0;
          this.swordSwing.angle = this.swordSwing.startAngle;
          this.swordSwing.glowIntensity = 0;
        }
        
        // Create a sword swing hitbox at the new position
        const swingHitbox = {
          width: 90,
          height: 22,
          offsetX: this.facing > 0 ? 40 : -70,
          offsetY: 8
        };
        this.activeMove.hitbox = swingHitbox;
        this.createAttackHitbox();
      } else if (move.name === 'Phantom Slash') {
        // Set up multi-hit data for Phantom Slash
        this.multiHitData.maxHits = move.multiHit || 4;
        this.multiHitData.currentHit = 0;
        this.multiHitData.hitCooldown = 0;
        this.multiHitData.lastHitTarget = null;
        
        // Set up hit timing (hits at frames 8, 16, 24, 32 of the 54-frame duration)
        this.multiHitData.hitTiming = [8, 16, 24, 32];
        
        // Apply self-launch for upward movement
        if (move.selfLaunch) {
          const launchForce = move.selfLaunchForce || 16;
          this.vy = -launchForce;
          console.log('Phantom Slash self-launch triggered with force:', launchForce);
        }
        
        // Create initial hitbox
        this.createAttackHitbox();
      }
    } else {
      this.createAttackHitbox();
    }
    
    this.attackCooldown = this.activeMove.duration;
    this.heavyAttackCooldown = move.cooldown;
    
    console.log('Fired charged attack:', {
      character: this.characterName,
      move: move.name,
      chargeLevel: this.chargeLevel.toFixed(3),
      damage: this.activeMove.damage,
      multiplier: chargeMultiplier.toFixed(3)
    });
  }
}
