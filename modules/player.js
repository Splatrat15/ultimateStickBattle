import { PhysicsBody, JUMP_FORCE, SECOND_JUMP_FORCE, VERTICAL_KNOCKBACK, BASE_KNOCKBACK, KNOCKBACK_SCALING } from './physics.js';
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

    // --- Rakka Jab Combo State ---
    this.rakkaJabComboStep = 1; // 1, 2, or 3
    this.rakkaJabComboTimer = 0; // Frames left to continue combo

    // --- Rakka Shadow Slice State ---
    this.rakkaShadowSliceActive = false;
    this.rakkaShadowSliceFrames = 0;
    this.rakkaShadowSliceLungeSpeed = 0;

    // Set initial state
    this.fullReset();

    this.hitstun = 0; // Frames remaining in hitstun
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

    // --- Rakka Jab Combo State ---
    this.rakkaJabComboStep = 1; // 1, 2, or 3
    this.rakkaJabComboTimer = 0; // Frames left to continue combo

    // --- Rakka Shadow Slice State ---
    this.rakkaShadowSliceActive = false;
    this.rakkaShadowSliceFrames = 0;
    this.rakkaShadowSliceLungeSpeed = 0;

    // Reset Rising Cut sword animation when attack ends
    if (this.risingCutSwing) {
      this.risingCutSwing.isActive = false;
      this.risingCutSwing.frame = 0;
      this.risingCutSwing.glowIntensity = 0;
      this.risingCutSwing.shadowTrails = [];
    }
    
    // Reset Down Light sword animation when attack ends
    if (this.downLightSwing) {
      this.downLightSwing.isActive = false;
      this.downLightSwing.frame = 0;
      this.downLightSwing.glowIntensity = 0;
      this.downLightSwing.shadowTrails = [];
    }

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
        
        // Reset Shadow Slice sword animation when attack ends
        if (this.shadowSliceSwing) {
          this.shadowSliceSwing.isActive = false;
          this.shadowSliceSwing.frame = 0;
          this.shadowSliceSwing.glowIntensity = 0;
          this.shadowSliceSwing.shadowTrails = [];
        }
        
        // Reset Rising Cut sword animation when attack ends
        if (this.risingCutSwing) {
          this.risingCutSwing.isActive = false;
          this.risingCutSwing.frame = 0;
          this.risingCutSwing.glowIntensity = 0;
          this.risingCutSwing.shadowTrails = [];
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
    // Demon Fang now uses teleportation, no gradual movement needed
    this.canAct = true;
    if (this.demonFangEffects && this.demonFangEffects.lockedFacing !== undefined) {
      delete this.demonFangEffects.lockedFacing;
    }
    if (this.demonFangEffects && this.demonFangEffects.dashHitbox) {
      this.demonFangEffects.dashHitbox = null;
      this.demonFangEffects.hasHitOpponent = false;
    }

    // Always check collision to prevent passing through other players
    // But allow Demon Fang to pass through during dash
    if (!(this.characterName === 'Rakka' && 
          this.isAttacking && 
          this.activeMove && 
          this.activeMove.name === 'Demon Fang' && 
          this.demonFangEffects && 
          this.demonFangEffects.dashSpeed > 0)) {
      this.checkPlayerCollision(otherPlayer);
    }

    // --- Rakka Jab Combo Timer Update ---
    if (this.characterName === 'Rakka' && this.rakkaJabComboTimer > 0) {
      this.rakkaJabComboTimer--;
      if (this.rakkaJabComboTimer === 0) {
        this.rakkaJabComboStep = 1;
      }
    }

    // --- Rakka Shadow Slice Lunge Update ---
    if (this.characterName === 'Rakka' && this.rakkaShadowSliceActive) {
      this.x += this.facing * this.rakkaShadowSliceLungeSpeed;
      this.rakkaShadowSliceFrames--;
      if (this.rakkaShadowSliceFrames <= 0 || !this.isAttacking) {
        this.rakkaShadowSliceActive = false;
      }
    }

    // Update hitstun timer
    if (this.hitstun > 0) {
      this.hitstun--;
    }
  }

  attack(direction, type) {
    // Don't allow attacking if in hitstun
    if (this.hitstun > 0) return;

    // --- Rakka Quick Draw Jab Combo Logic ---
    if (this.characterName === 'Rakka' && direction === 'neutral' && type === 'light') {
      // Only allow a new jab if not already attacking and if not holding the button
      if (this.isAttacking || this.rakkaJabJustPressed) return;
      this.rakkaJabJustPressed = true; // Mark that the button is being held
      // Jab combo logic
      if (this.rakkaJabComboTimer > 0) {
        this.rakkaJabComboStep = Math.min(this.rakkaJabComboStep + 1, 3);
      } else {
        this.rakkaJabComboStep = 1;
      }
      this.rakkaJabComboTimer = 180; // 3 seconds (3 mississippis) to continue combo

      // Define jab variants with unique sword swing angles
      const jabVariants = [
        {
          name: 'Quick Draw 1',
          type: 'light',
          damage: 1.5,
          knockback: 0.5, // Very low knockback
          duration: 36, // Much slower jab
          cooldown: 34,
          hitbox: { width: 38, height: 18, offsetX: 60, offsetY: 10 },
          pull: true,
          // Full vertical slash: up to down
          swing: { start: -Math.PI / 2, end: Math.PI / 2 } 
        },
        {
          name: 'Quick Draw 2',
          type: 'light',
          damage: 1.5,
          knockback: 0.7, // Still low knockback
          duration: 38, // Much slower jab
          cooldown: 36,
          hitbox: { width: 38, height: 18, offsetX: 60, offsetY: 10 },
          pull: true,
          // Full vertical slash: down to up
          swing: { start: Math.PI / 2, end: -Math.PI / 2 } 
        },
        {
          name: 'Quick Draw 3',
          type: 'light',
          damage: 2.5,
          knockback: 3.5, // Stronger knockback
          duration: 44, // Slowest jab
          cooldown: 44,
          hitbox: { width: 44, height: 22, offsetX: 64, offsetY: 8 },
          pull: false,
          // Strong horizontal slash: slightly above to slightly below horizontal
          swing: { start: -Math.PI / 6, end: Math.PI / 6 } // -30deg to +30deg
        }
      ];
      const jab = jabVariants[this.rakkaJabComboStep - 1];
      this.isAttacking = true;
      this.attackType = 'light';
      this.activeMove = jab;
      this.attackCooldown = jab.duration;
      this.lightAttackCooldown = jab.cooldown;
      this.createAttackHitbox();
      // Trigger sword swing animation for each jab
      if (this.swordSwing) {
        this.swordSwing.isActive = true;
        this.swordSwing.frame = 0;
        this.swordSwing.startAngle = jab.swing.start;
        this.swordSwing.endAngle = jab.swing.end;
        this.swordSwing.angle = jab.swing.start;
        this.swordSwing.glowIntensity = 0;
      }
      // After jab 3, reset combo step
      if (this.rakkaJabComboStep === 3) {
        this.rakkaJabComboStep = 1;
        this.rakkaJabComboTimer = 0;
      }
      return;
    }

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

    // --- Rakka Shadow Slice (sideLight) Lunge Logic ---
    if (this.characterName === 'Rakka' && move.name === 'Shadow Slice') {
      this.rakkaShadowSliceActive = true;
      this.rakkaShadowSliceFrames = move.duration; // Lunge for the duration of the move
      this.rakkaShadowSliceLungeSpeed = 7.5; // Adjusted for longer duration (was 12, now 7.5 for similar total distance)
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

    // Handle character-specific attack logic (separate from charging)
    if (this.characterName === 'Rakka') {
      if (move.name === 'Shadow Sneak') {
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
          offsetX: 40, // Always positive, will be handled by facing direction in createAttackHitbox
          offsetY: 8
        };
        this.activeMove.hitbox = swingHitbox;
        this.createAttackHitbox();
      } else if (move.name === 'Rising Cut') {
        // Start Rising Cut sword swing animation
        if (this.risingCutSwing) {
          this.risingCutSwing.isActive = true;
          this.risingCutSwing.frame = 0;
          this.risingCutSwing.angle = this.risingCutSwing.startAngle;
          this.risingCutSwing.glowIntensity = 0;
          this.risingCutSwing.shadowTrails = [];
          this.risingCutSwing.trailFrame = 0;
        }
      } else if (move.name === 'Ground Poke') {
        // Start Down Light sword swing animation based on grounded/aerial state
        if (this.downLightSwing) {
          this.downLightSwing.isActive = true;
          this.downLightSwing.frame = 0;
          this.downLightSwing.glowIntensity = 0;
          this.downLightSwing.shadowTrails = [];
          this.downLightSwing.trailFrame = 0;
          this.downLightSwing.isGrounded = this.isGrounded;
          
          // Set swing angles based on grounded/aerial state
          if (this.isGrounded) {
            // Ground version: sword poke near the ground
            this.downLightSwing.startAngle = move.groundSwing.startAngle;
            this.downLightSwing.endAngle = move.groundSwing.endAngle;
          } else {
            // Aerial version: downward sword slash
            this.downLightSwing.startAngle = move.aerialSwing.startAngle;
            this.downLightSwing.endAngle = move.aerialSwing.endAngle;
          }
        }
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
      } else if (move.name === 'Demon Fang') {
        // For Demon Fang, teleport and hit anyone in the path
        const thrustDistance = 100 + (this.chargeLevel * 200); // 100-300px dash
        if (this.demonFangEffects) {
          this.demonFangEffects.originalX = this.x;
          this.demonFangEffects.thrustDistance = thrustDistance;
          this.demonFangEffects.startX = this.x;
          this.demonFangEffects.endX = this.x + (thrustDistance * this.facing);
          
          // Teleport to end position
          this.x = this.demonFangEffects.endX;
          
          console.log('Demon Fang teleport executed:', {
            startX: this.demonFangEffects.startX,
            endX: this.demonFangEffects.endX,
            thrustDistance: thrustDistance,
            facing: this.facing,
            chargeLevel: this.chargeLevel
          });
        }
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

    // For Shadow Slice, create a placeholder hitbox that will be overridden by dynamic sword hitbox
    if (this.characterName === 'Rakka' && this.activeMove.name === 'Shadow Slice') {
      // Create a small placeholder hitbox that will be immediately replaced by the sword hitbox
      this.attackHitbox = {
        x: this.x,
        y: this.y,
        width: 10,
        height: 10
      };
      this.attackHitbox2 = null;
      return;
    }

    // For Rising Cut, create a placeholder hitbox that will be overridden by dynamic sword hitbox
    if (this.characterName === 'Rakka' && this.activeMove.name === 'Rising Cut') {
      // Create a small placeholder hitbox that will be immediately replaced by the sword hitbox
      this.attackHitbox = {
        x: this.x,
        y: this.y,
        width: 10,
        height: 10
      };
      this.attackHitbox2 = null;
      return;
    }

    // For Down Light, create a placeholder hitbox that will be overridden by dynamic sword hitbox
    if (this.characterName === 'Rakka' && this.activeMove.name === 'Ground Poke') {
      // Create a small placeholder hitbox that will be immediately replaced by the sword hitbox
      this.attackHitbox = {
        x: this.x,
        y: this.y,
        width: 10,
        height: 10
      };
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
    // --- Rakka Jab Sword-Following Hitbox ---
    if (
      this.characterName === 'Rakka' &&
      this.activeMove &&
      this.activeMove.name &&
      this.activeMove.name.startsWith('Quick Draw') &&
      this.swordSwing && this.swordSwing.isActive
    ) {
      // Calculate sword blade as a hitbox along the full blade
      const centerX = this.x + this.width / 2;
      const baseY = this.y + this.height;
      const armX = centerX + (24 * this.facing);
      const armY = baseY - 22;
      const sword = this.sword;
      const swing = this.swordSwing;
      const angle = swing.angle;
      // The blade is a long, thin rectangle from the arm to the tip
      const bladeLength = sword.length;
      const bladeWidth = sword.width * 1.8;
      // Calculate the top-left corner of the blade hitbox
      const x1 = armX;
      const y1 = armY;
      const x2 = armX + Math.cos(angle) * bladeLength * this.facing;
      const y2 = armY + Math.sin(angle) * bladeLength;
      // The hitbox is a rectangle that covers the blade from (x1, y1) to (x2, y2)
      // For simplicity, use a bounding box that covers the whole blade
      const minX = Math.min(x1, x2) - bladeWidth / 2;
      const minY = Math.min(y1, y2) - bladeWidth / 2;
      const maxX = Math.max(x1, x2) + bladeWidth / 2;
      const maxY = Math.max(y1, y2) + bladeWidth / 2;
      this.attackHitbox = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
      return;
    }
    
    // --- Rakka Shadow Slice Sword-Following Hitbox ---
    if (
      this.characterName === 'Rakka' &&
      this.activeMove &&
      this.activeMove.name === 'Shadow Slice' &&
      this.shadowSliceSwing && this.shadowSliceSwing.isActive
    ) {
      // Calculate sword blade as a hitbox along the full blade
      const centerX = this.x + this.width / 2;
      const baseY = this.y + this.height;
      const armX = centerX + (24 * this.facing);
      const armY = baseY - 22;
      const sword = this.sword;
      const swing = this.shadowSliceSwing;
      const angle = swing.angle;
      // The blade is a long, thin rectangle from the arm to the tip
      const bladeLength = sword.length;
      const bladeWidth = sword.width * 1.8;
      // Calculate the top-left corner of the blade hitbox
      const x1 = armX;
      const y1 = armY;
      const x2 = armX + Math.cos(angle) * bladeLength * this.facing;
      const y2 = armY + Math.sin(angle) * bladeLength;
      // The hitbox is a rectangle that covers the blade from (x1, y1) to (x2, y2)
      // For simplicity, use a bounding box that covers the whole blade
      const minX = Math.min(x1, x2) - bladeWidth / 2;
      const minY = Math.min(y1, y2) - bladeWidth / 2;
      const maxX = Math.max(x1, x2) + bladeWidth / 2;
      const maxY = Math.max(y1, y2) + bladeWidth / 2;
      this.attackHitbox = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
      return;
    }
    
    // --- Rakka Rising Cut Sword-Following Hitbox ---
    if (
      this.characterName === 'Rakka' &&
      this.activeMove &&
      this.activeMove.name === 'Rising Cut' &&
      this.risingCutSwing && this.risingCutSwing.isActive
    ) {
      // Calculate sword blade as a hitbox along the full blade
      const centerX = this.x + this.width / 2;
      const baseY = this.y + this.height;
      const armX = centerX + (24 * this.facing);
      const armY = baseY - 22;
      const sword = this.sword;
      const swing = this.risingCutSwing;
      const angle = swing.angle;
      // The blade is a long, thin rectangle from the arm to the tip
      const bladeLength = sword.length;
      const bladeWidth = sword.width * 1.8;
      // Calculate the top-left corner of the blade hitbox
      const x1 = armX;
      const y1 = armY;
      const x2 = armX + Math.cos(angle) * bladeLength * this.facing;
      const y2 = armY + Math.sin(angle) * bladeLength;
      // The hitbox is a rectangle that covers the blade from (x1, y1) to (x2, y2)
      // For simplicity, use a bounding box that covers the whole blade
      const minX = Math.min(x1, x2) - bladeWidth / 2;
      const minY = Math.min(y1, y2) - bladeWidth / 2;
      const maxX = Math.max(x1, x2) + bladeWidth / 2;
      const maxY = Math.max(y1, y2) + bladeWidth / 2;
      this.attackHitbox = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
      return;
    }
    
    // --- Rakka Down Light Sword-Following Hitbox ---
    if (
      this.characterName === 'Rakka' &&
      this.activeMove &&
      this.activeMove.name === 'Ground Poke' &&
      this.downLightSwing && this.downLightSwing.isActive
    ) {
      // Calculate sword blade as a hitbox along the full blade
      const centerX = this.x + this.width / 2;
      const baseY = this.y + this.height;
      const armX = centerX + (24 * this.facing);
      const armY = baseY - 22;
      const sword = this.sword;
      const swing = this.downLightSwing;
      const angle = swing.angle;
      // The blade is a long, thin rectangle from the arm to the tip
      const bladeLength = sword.length;
      const bladeWidth = sword.width * 1.8;
      // Calculate the top-left corner of the blade hitbox
      const x1 = armX;
      const y1 = armY;
      const x2 = armX + Math.cos(angle) * bladeLength * this.facing;
      const y2 = armY + Math.sin(angle) * bladeLength;
      // The hitbox is a rectangle that covers the blade from (x1, y1) to (x2, y2)
      // For simplicity, use a bounding box that covers the whole blade
      const minX = Math.min(x1, x2) - bladeWidth / 2;
      const minY = Math.min(y1, y2) - bladeWidth / 2;
      const maxX = Math.max(x1, x2) + bladeWidth / 2;
      const maxY = Math.max(y1, y2) + bladeWidth / 2;
      this.attackHitbox = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
      return;
    }
    
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
    // --- Rakka Jab Pull/Launch Effect (PRIORITY: run this first) ---
    if (
      this.characterName === 'Rakka' &&
      this.activeMove &&
      this.activeMove.name &&
      this.activeMove.name.startsWith('Quick Draw') &&
      this.isAttacking &&
      this.attackHitbox &&
      this.checkHitboxCollision(this.attackHitbox, otherPlayer)
    ) {
      // Only allow one hit per jab
      if (this.lastHitTarget === otherPlayer && this.hitCooldown > 0) {
        return false;
      }
      this.lastHitTarget = otherPlayer;
      this.hitCooldown = this.activeMove.duration; // Prevent multiple hits per swing
      // Pull effect for jab 1 and 2
      if (this.activeMove.pull) {
        // Pull opponent toward Rakka (set vx toward Rakka, small value)
        const pullStrength = 4;
        const dir = this.facing;
        otherPlayer.vx = dir * pullStrength;
      }
      // Let the main game loop handle damage/knockback
      return true;
    }
    // --- END Rakka Jab block ---

    // Special handling for Demon Fang dash collision
    if (this.activeMove && this.activeMove.name === 'Demon Fang') {
      return this.checkDemonFangHit(otherPlayer);
    }
    // Special handling for Void Splitter wave (no normal hitbox)
    if (this.activeMove && this.activeMove.name === 'Void Splitter') {
      return this.checkVoidSplitterHit(otherPlayer);
    }
    if (!this.isAttacking || !this.attackHitbox) return false;
    // --- Only allow multi-hit if move explicitly has multiHit set ---
    const isMultiHit = this.activeMove && this.activeMove.multiHit;
    if (this.lastHitTarget === otherPlayer && this.hitCooldown > 0) {
      // If multiHit, allow more hits, else block
      if (!isMultiHit) return false;
    }
    // Check primary hitbox
    const hit = this.checkHitboxCollision(this.attackHitbox, otherPlayer);
    // Check secondary hitbox if it exists
    const hit2 = this.attackHitbox2 ? this.checkHitboxCollision(this.attackHitbox2, otherPlayer) : false;
    // If either hitbox hits, set cooldown and mark target
    if (hit || hit2) {
      this.lastHitTarget = otherPlayer;
      // For multi-hit moves, short cooldown; for others, long cooldown to prevent multi-hits
      this.hitCooldown = isMultiHit ? 10 : this.activeMove.duration;
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

  checkDemonFangHit(otherPlayer) {
    // Only allow hit if actually attacking (not charging)
    if (!this.isAttacking) return false;
    // Prevent hitting the same target more than once per Demon Fang
    if (this.demonFangAlreadyHit && this.demonFangAlreadyHit.has(otherPlayer)) {
      return false;
    }
    console.log('checkDemonFangHit called:', {
      attackerX: this.x,
      attackerY: this.y,
      targetX: otherPlayer.x,
      targetY: otherPlayer.y,
      isAttacking: this.isAttacking,
      attackCooldown: this.attackCooldown
    });
    
    // Check if we've already hit this target recently (prevent spam damage)
    if (this.lastHitTarget === otherPlayer && this.hitCooldown > 0) {
      console.log('Demon Fang hit blocked by cooldown');
      return false;
    }
    
    // For Demon Fang, check if the teleport path intersects with the opponent
    if (this.demonFangEffects && this.demonFangEffects.startX !== undefined) {
      const startX = this.demonFangEffects.startX;
      const endX = this.demonFangEffects.endX;
      const pathStart = Math.min(startX, endX);
      const pathEnd = Math.max(startX, endX);
      
      // Check if opponent is in the horizontal path of the teleport
      const opponentStart = otherPlayer.x;
      const opponentEnd = otherPlayer.x + otherPlayer.width;
      
      const horizontalHit = (opponentStart < pathEnd && opponentEnd > pathStart);
      
      // Check if opponent is at the same vertical level (with some tolerance)
      const verticalHit = (otherPlayer.y < this.y + this.height && 
                          otherPlayer.y + otherPlayer.height > this.y);
      
      const hit = horizontalHit && verticalHit;
      
      console.log('Demon Fang path collision check:', {
        pathStart: pathStart,
        pathEnd: pathEnd,
        opponentStart: opponentStart,
        opponentEnd: opponentEnd,
        horizontalHit: horizontalHit,
        verticalHit: verticalHit,
        finalHit: hit
      });
      
      if (hit) {
        // Apply damage to the opponent
        otherPlayer.takeDamage(this.activeMove.damage, this);
        // Mark as already hit
        if (this.demonFangAlreadyHit) this.demonFangAlreadyHit.add(otherPlayer);
        this.lastHitTarget = otherPlayer;
        this.hitCooldown = 10; // 10 frames cooldown between hits on same target
        
        console.log('Demon Fang teleport hit detected!', {
          attacker: this.characterName,
          target: otherPlayer.characterName,
          damage: this.activeMove.damage,
          cooldownSet: this.hitCooldown
        });
        
        return true;
      }
    }
    
    return false;
  }

  checkVoidSplitterHit(otherPlayer) {
    // For Void Splitter, check if the shadow wave hits the opponent
    if (this.voidSplitterEffects && this.voidSplitterEffects.wave.isActive) {
      const wave = this.voidSplitterEffects.wave;
      const move = this.activeMove;
      
      // Check if this opponent has already been hit by this wave
      if (wave.lastHitTarget === otherPlayer) {
        return false;
      }
      
      // Check collision with the wave
      const waveX = wave.x - move.wave.width / 2;
      const waveY = wave.y - move.wave.height / 2;
      
      const hit = (
        waveX < otherPlayer.x + otherPlayer.width &&
        waveX + move.wave.width > otherPlayer.x &&
        waveY < otherPlayer.y + otherPlayer.height &&
        waveY + move.wave.height > otherPlayer.y
      );
      
      if (hit) {
        // Apply damage to the opponent
        otherPlayer.takeDamage(move.wave.damage, this);
        
        // Mark this opponent as hit by this wave
        wave.lastHitTarget = otherPlayer;
        
        console.log('Void Splitter wave hit detected!', {
          attacker: this.characterName,
          target: otherPlayer.characterName,
          damage: move.wave.damage
        });
        
        return true;
      }
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
    // --- Rakka Jab Combo Custom Knockback ---
    if (
      attacker.characterName === 'Rakka' &&
      attacker.activeMove &&
      attacker.activeMove.name &&
      attacker.activeMove.name.startsWith('Quick Draw')
    ) {
      if (attacker.activeMove.name === 'Quick Draw 1' || attacker.activeMove.name === 'Quick Draw 2') {
        // Pull or keep opponent in place for first two jabs
        knockbackForce = 0; // No knockback
      }
      // Quick Draw 3 uses its normal knockback
    }
    // Handle spike knockback (downward force)
    if (attacker.activeMove && attacker.activeMove.spikeKnockback) {
      knockbackDirection = 0; // No horizontal knockback
      knockbackForce = 15; // Strong downward force
      this.vy = Math.abs(knockbackForce); // Force downward movement
    }
    // Handle aerial down light spike knockback
    if (attacker.characterName === 'Rakka' && 
        attacker.activeMove && 
        attacker.activeMove.name === 'Ground Poke' && 
        attacker.downLightSwing && 
        !attacker.downLightSwing.isGrounded) {
      // Aerial version sends opponent down
      knockbackDirection = 0; // No horizontal knockback
      knockbackForce = 12; // Strong downward force
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
    // --- Rakka heavy attacks: apply diagonal upward knockback only for heavy moves ---
    if (
      attacker.characterName === 'Rakka' &&
      attacker.activeMove &&
      attacker.activeMove.type === 'heavy' &&
      !attacker.activeMove.spikeKnockback &&
      !(attacker.activeMove.name === 'Ground Poke' && attacker.downLightSwing && !attacker.downLightSwing.isGrounded)
    ) {
      // Custom upward knockback for Rakka's heavy attacks (stronger vertical)
      this.applyKnockback(knockbackDirection, this.damage, knockbackForce, 0.5); // 0.5 vertical factor for more KO power
    } else if (!attacker.activeMove?.spikeKnockback && !attacker.activeMove?.upwardKnockback) {
      this.applyKnockback(knockbackDirection, this.damage, knockbackForce);
    }
    // Add hitstun on hit (1 second = 60 frames)
    this.hitstun = 60;
  }

  jump() {
    console.log('=== JUMP ATTEMPT ===');
    console.log('Jumps remaining:', this.jumpsRemaining);
    console.log('Is grounded:', this.isGrounded);
    console.log('Is jump key pressed:', this.isJumpKeyPressed);
    console.log('Is shielding:', this.isShielding);
    console.log('Is attacking:', this.isAttacking);
    
    // Don't allow jumping if shielding, attacking, or in hitstun
    if (this.isShielding || this.isAttacking || this.hitstun > 0) {
      console.log('Jump blocked - shielding, attacking, or in hitstun');
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
    // Don't allow shielding if in hitstun
    if (this.hitstun > 0) return;
    // Can only shield if not on cooldown and shield duration is available
    if (this.shieldCooldown === 0 && this.shieldDuration < this.maxShieldDuration) {
      this.isShielding = true;
      console.log('Shield activated for:', this.color);
    }
  }

  deactivateShield() {
    this.isShielding = false;
  }

  startCharge(move = null) {
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
    
    // Set the active move. Use passed move or default to neutralHeavy
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
      if (this.chargeLevel > 0.1) {
        this.fireChargedAttack();
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
    // Use the active move if set, otherwise default to neutralHeavy
    const move = this.activeMove || this.moveset.neutralHeavy;
    if (!move) return;

    this.isAttacking = true;
    this.attackType = 'heavy';
    this.activeMove = move; // Keep original move data for hitbox scaling
    
    // Scale damage, knockback, and duration based on charge level (0.2x to 2.0x)
    const chargeMultiplier = 0.2 + (this.chargeLevel * 1.8); // 0.2x to 2.0x scaling
    
    // Create scaled properties without overwriting the original move
    let scaledDamage = Math.floor(move.damage * chargeMultiplier);
    if (this.characterName === 'Rakka' && move.name === 'Demon Fang') {
      // Cap Demon Fang's damage at 15
      scaledDamage = Math.min(scaledDamage, 15);
    }
    this.activeMove = {
      ...move,
      damage: scaledDamage,
      knockback: move.knockback * chargeMultiplier,
      duration: Math.floor(move.duration * (0.7 + this.chargeLevel * 0.8)) // Longer duration for more charge
    };
    
    this.attackCooldown = this.activeMove.duration;
    this.heavyAttackCooldown = move.cooldown;
    
    // Handle character-specific charged attacks
    if (this.characterName === 'Rakka') {
      if (move.name === 'Demon Fang') {
        // For Demon Fang, teleport and hit anyone in the path
        const thrustDistance = 100 + (this.chargeLevel * 200); // 100-300px dash
        if (this.demonFangEffects) {
          this.demonFangEffects.originalX = this.x;
          this.demonFangEffects.thrustDistance = thrustDistance;
          this.demonFangEffects.startX = this.x;
          this.demonFangEffects.endX = this.x + (thrustDistance * this.facing);
          
          // Teleport to end position
          this.x = this.demonFangEffects.endX;
          
          // Track already hit targets for this Demon Fang
          this.demonFangAlreadyHit = new Set();
          console.log('Demon Fang teleport executed:', {
            startX: this.demonFangEffects.startX,
            endX: this.demonFangEffects.endX,
            thrustDistance: thrustDistance,
            facing: this.facing,
            chargeLevel: this.chargeLevel
          });
        }
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
          offsetX: 40, // Always positive, will be handled by facing direction in createAttackHitbox
          offsetY: 8
        };
        this.activeMove.hitbox = swingHitbox;
      }
    }
    
    this.createAttackHitbox();
    
    console.log('Fired charged attack with level:', this.chargeLevel.toFixed(3), 'damage:', this.activeMove.damage, 'multiplier:', chargeMultiplier.toFixed(3));
  }

  // Add a method to reset the jab press state on keyup
  onJabKeyUp() {
    if (this.characterName === 'Rakka') {
      this.rakkaJabJustPressed = false;
    }
  }

  // Restore original applyKnockback (remove lastAttacker logic)
  applyKnockback(direction, damage, customForce = null, customVertical = null) {
    // Calculate knockback based on damage
    const knockbackForce = customForce !== null ? customForce : (BASE_KNOCKBACK + (damage * KNOCKBACK_SCALING));
    // Apply moderate horizontal knockback (reduced for more balanced gameplay)
    this.vx = direction * knockbackForce * 1.8; // Reduced from 2.5
    // Apply vertical knockback (default or custom for Rakka heavy)
    const verticalFactor = customVertical !== null ? customVertical : VERTICAL_KNOCKBACK;
    this.vy = -knockbackForce * verticalFactor;
    // Ensure the player is not grounded when knocked back
    this.isGrounded = false;
    console.log('Knockback applied:', {
      direction: direction,
      damage: damage,
      knockbackForce: knockbackForce,
      vx: this.vx,
      vy: this.vy
    });
  }
}
