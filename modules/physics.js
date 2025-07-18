// Physics constants
export const MOVE_SPEED = 5;
export const FRICTION = 0.9;
export const GRAVITY = 0.35;
export const JUMP_FORCE = -14;
export const SECOND_JUMP_FORCE = -12;
export const MAX_FALL_SPEED = 12;
export const COLLISION_DAMPING = 0.1;
export const CONTROL_SWITCH_COOLDOWN = 10; // Frames to wait after switching controls

// Knockback constants
export const BASE_KNOCKBACK = 8;
export const KNOCKBACK_SCALING = 0.3;
export const VERTICAL_KNOCKBACK = 0.05;

export class PhysicsBody {
  constructor(x, y, width, height, weight = 1.0, jumpForce = JUMP_FORCE) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = false;
    this.facing = 1;
    this.invincibilityFrames = 0;
    this.controlSwitchCooldown = 0;
    this.damage = 0; // Add damage property for knockback calculation
    this.isAttacking = false; // Track if player is attacking
    this.isShielding = false; // Track if player is shielding
    this.isCharging = false; // Track if player is charging
    this.attackLag = 0; // Track attack lag frames
    // --- Customizable physics properties ---
    this.weight = weight; // 1.0 = normal, <1 = floaty, >1 = heavy
    this.jumpForce = jumpForce; // -14 = normal, more negative = higher jump
    window.debugLog('PhysicsBody created', { x, y, width, height, weight, jumpForce });
  }

  applyKnockback(direction, damage) {
    // Calculate knockback based on damage
    const knockbackForce = BASE_KNOCKBACK + (damage * KNOCKBACK_SCALING);
    
    // Apply moderate horizontal knockback (reduced for more balanced gameplay)
    this.vx = direction * knockbackForce * 1.8; // Reduced from 2.5
    
    // Apply minimal vertical knockback (just a tiny upward boost)
    this.vy = -knockbackForce * VERTICAL_KNOCKBACK;
    
    // Ensure the player is not grounded when knocked back
    this.isGrounded = false;
    

  }

  update(platforms) {
    // Store old position
    const oldX = this.x;
    const oldY = this.y;
    
    // Apply horizontal movement
    this.x += this.vx;
    
    // Apply vertical movement
    // Smaller weight numbers = heavier = more gravity effect
    this.vy += GRAVITY * this.weight; // Weight affects gravity (smaller weight = more gravity)
    if (this.vy > MAX_FALL_SPEED) {
      this.vy = MAX_FALL_SPEED;
    }
    this.y += this.vy;
    
    // Apply friction
    this.vx *= FRICTION;
    if (Math.abs(this.vx) < 0.1) {
      this.vx = 0;
    }
    
    // Update cooldowns
    if (this.invincibilityFrames > 0) this.invincibilityFrames--;
    if (this.controlSwitchCooldown > 0) this.controlSwitchCooldown--;

    // Check platform collisions (simplified for single platform)
    this.isGrounded = false;
    for (const platform of platforms) {
      // Check if player is above platform
      if (this.x + this.width > platform.x && 
          this.x < platform.x + platform.width) {
        // Check if player is falling and would land on platform
        if (this.vy > 0 && 
            oldY + this.height <= platform.y && 
            this.y + this.height >= platform.y) {
          // Only ground the player if they're not trying to jump off
          if (!(this.vy < 0 && this.y + this.height > platform.y + 5)) {
            this.y = platform.y - this.height;
            this.vy = 0;
            this.isGrounded = true;
          }
          break;
        }
      }
    }
  }

  move(direction) {
    // Don't allow movement if charging or in attack lag
    if (this.isCharging || this.attackLag > 0) {
      return;
    }
    
    // If we're switching controls, set cooldown
    if (this.vx === 0 && direction !== 0) {
      this.controlSwitchCooldown = CONTROL_SWITCH_COOLDOWN;
    }
    
    // Only allow movement if not being knocked back (invincibility frames indicate recent hit)
    if (this.invincibilityFrames === 0) {
      // Check if player is attacking or shielding - if so, don't allow movement
      if (!this.isAttacking && !this.isShielding) {
        this.vx = direction * (this.moveSpeed || MOVE_SPEED);
      } else {
        // If attacking or shielding, stop horizontal movement but keep vertical movement (gravity)
        this.vx = 0;
      }
    } else {
      // If being knocked back, only allow movement in the same direction as knockback
      // This prevents players from fighting against the knockback
      if ((direction > 0 && this.vx > 0) || (direction < 0 && this.vx < 0)) {
        // Allow movement in the same direction as knockback (slight boost)
        this.vx += direction * MOVE_SPEED * 0.5;
      }
      // If trying to move against knockback direction, ignore the input
    }
    
    // Only update facing direction if not attacking (prevents direction flipping mid-attack)
    if (!this.isAttacking) {
      this.facing = direction;
    } else if (this.lockedFacingDirection !== undefined) {
      // Use locked facing direction during attacks
      this.facing = this.lockedFacingDirection;
    }
    
    window.debugLog('Player moved', {
      direction,
      vx: this.vx.toFixed(2),
      invincibilityFrames: this.invincibilityFrames,
      isAttacking: this.isAttacking,
      isShielding: this.isShielding,
      isCharging: this.isCharging
    });
  }

  jump() {
    // Only allow jumping if grounded, not attacking/shielding
    if (this.isGrounded && !this.isAttacking && !this.isShielding) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
    }
  }

  resetPosition(x, y) {
    window.debugLog('Resetting position', {
      oldX: Math.round(this.x),
      oldY: Math.round(this.y),
      newX: x,
      newY: y
    });
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = true;
  }

  checkPlayerCollision(other) {
    // Skip collision if either player is invincible
    if (this.invincibilityFrames > 0 || other.invincibilityFrames > 0) {
      return;
    }

    // Calculate overlaps
    const verticalOverlap = Math.min(this.y + this.height, other.y + other.height) - Math.max(this.y, other.y);
    const horizontalOverlap = Math.min(this.x + this.width, other.x + other.width) - Math.max(this.x, other.x);

    // If no overlap at all, no collision
    if (verticalOverlap <= 0 || horizontalOverlap <= 0) {
      return;
    }

    // Calculate center points
    const thisCenterX = this.x + this.width / 2;
    const otherCenterX = other.x + other.width / 2;
    const thisCenterY = this.y + this.height / 2;
    const otherCenterY = other.y + other.height / 2;

    // Note: Push power is now calculated directly in applyMomentumPush based on weight and speed
    


    // Determine which direction has the smaller overlap
    if (verticalOverlap < horizontalOverlap) {
      // Resolve vertical overlap
      if (thisCenterY < otherCenterY) {
        // This player is above
        this.y = other.y - this.height;
        // Apply momentum-based horizontal push
        this.applyMomentumPush(other);
      } else {
        // This player is below
        this.y = other.y + other.height;
        // Apply momentum-based horizontal push
        this.applyMomentumPush(other);
      }
    } else {
      // Resolve horizontal overlap - prioritize this for charging players
      if (thisCenterX < otherCenterX) {
        // This player is to the left
        this.x = other.x - this.width;
        // Apply momentum-based push
        this.applyMomentumPush(other);
      } else {
        // This player is to the right
        this.x = other.x + other.width;
        // Apply momentum-based push
        this.applyMomentumPush(other);
      }
    }
  }



  // Apply pushing power-based collision between two players
  applyMomentumPush(other) {
    // Get current movement states
    const thisMoving = Math.abs(this.vx) > 0.1;
    const otherMoving = Math.abs(other.vx) > 0.1;
    const movingTowardEachOther = thisMoving && otherMoving && (this.vx * other.vx < 0);
    
    // Get pushing power and weight data
    const thisPushingPower = this.pushingPower || 1;
    const otherPushingPower = other.pushingPower || 1;
    const thisWeight = this.weight || 1.0;
    const otherWeight = other.weight || 1.0;
    
    // Calculate effective pushing power (0 if not moving)
    const thisEffectivePower = thisMoving ? thisPushingPower : 0;
    const otherEffectivePower = otherMoving ? otherPushingPower : 0;
    
    // Determine push direction based on relative positions
    const thisCenterX = this.x + this.width / 2;
    const otherCenterX = other.x + other.width / 2;
    const pushDirection = thisCenterX < otherCenterX ? 1 : -1; // 1 = push right, -1 = push left
    
    // Debug logging
    console.log('Push Debug:', {
      thisChar: this.characterName || 'Unknown',
      otherChar: other.characterName || 'Unknown',
      thisPushingPower: thisPushingPower,
      otherPushingPower: otherPushingPower,
      thisWeight: thisWeight + ' (smaller=heavier)',
      otherWeight: otherWeight + ' (smaller=heavier)',
      thisMoving: thisMoving,
      otherMoving: otherMoving,
      thisEffectivePower: thisEffectivePower,
      otherEffectivePower: otherEffectivePower,
      movingTowardEachOther: movingTowardEachOther
    });
    
    // Handle different scenarios
    if (movingTowardEachOther) {
      // Both moving toward each other - compare pushing power
      console.log(`Moving toward each other: This=${thisEffectivePower}, Other=${otherEffectivePower}`);
      if (thisEffectivePower === otherEffectivePower) {
        // Equal pushing power - neither moves (same character or equal power)
        console.log('Equal pushing power - stopping both players');
        this.vx = 0;
        other.vx = 0;
      } else if (thisEffectivePower > otherEffectivePower) {
        // This player wins
        const powerDiff = thisEffectivePower - otherEffectivePower;
        const pushForce = this.calculatePushForce(powerDiff, otherWeight);
        console.log(`This player wins with power diff ${powerDiff}, push force ${pushForce}`);
        this.vx = pushDirection * pushForce;
        other.vx = -pushDirection * pushForce;
      } else {
        // Other player wins
        const powerDiff = otherEffectivePower - thisEffectivePower;
        const pushForce = other.calculatePushForce(powerDiff, thisWeight);
        console.log(`Other player wins with power diff ${powerDiff}, push force ${pushForce}`);
        this.vx = -pushDirection * pushForce;
        other.vx = pushDirection * pushForce;
      }
    } else if (thisMoving && !otherMoving) {
      // Only this player is moving - push the stationary player
      const pushForce = this.calculatePushForce(thisEffectivePower, otherWeight);
      console.log(`This player pushing stationary: power=${thisEffectivePower}, targetWeight=${otherWeight}, force=${pushForce}`);
      this.vx = pushDirection * pushForce;
      other.vx = pushDirection * pushForce;
    } else if (!thisMoving && otherMoving) {
      // Only other player is moving - push this stationary player
      const pushForce = other.calculatePushForce(otherEffectivePower, thisWeight);
      console.log(`Other player pushing stationary: power=${otherEffectivePower}, targetWeight=${thisWeight}, force=${pushForce}`);
      this.vx = -pushDirection * pushForce;
      other.vx = -pushDirection * pushForce;
    } else {
      // Both stationary or moving in same direction - minimal interaction
      const pushForce = 1;
      this.vx = pushDirection * pushForce;
      other.vx = -pushDirection * pushForce;
    }
    
    // Add small vertical variation for more dynamic feel
    const verticalPush = (Math.random() - 0.5) * 1;
    this.vy += verticalPush;
    other.vy -= verticalPush;
  }
  
  // Calculate push force based on pushing power difference and target weight
  calculatePushForce(powerDiff, targetWeight) {
    // Base force from power difference
    const baseForce = powerDiff * 2;
    
    // Weight resistance: smaller weight numbers = heavier = harder to push
    // But we need to make it less punishing so pushing power still matters
    const weightResistance = (1 / targetWeight) * 0.2; // Reduced from 0.5 to 0.2
    
    // Final force: base force reduced by weight resistance, minimum of 1
    const finalForce = Math.max(1, baseForce - weightResistance);
    
    console.log(`Push force calc: powerDiff=${powerDiff}, targetWeight=${targetWeight}, baseForce=${baseForce}, weightResistance=${weightResistance.toFixed(3)}, finalForce=${finalForce}`);
    
    return finalForce;
  }
} 