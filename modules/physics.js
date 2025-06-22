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
    
    console.log('Knockback applied:', {
      direction: direction,
      damage: damage,
      knockbackForce: knockbackForce,
      vx: this.vx,
      vy: this.vy
    });
  }

  update(platforms) {
    // Store old position
    const oldX = this.x;
    const oldY = this.y;
    
    // Apply horizontal movement
    this.x += this.vx;
    
    // Apply vertical movement
    this.vy += GRAVITY * (1 / this.weight); // Weight affects gravity
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

    // Check platform collisions
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
    // Don't allow movement if charging
    if (this.isCharging) {
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
    
    this.facing = direction;
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
      console.log('PhysicsBody jump executed', { jumpForce: this.jumpForce });
    } else {
      console.log('Jump blocked - grounded:', this.isGrounded, 'attacking:', this.isAttacking, 'shielding:', this.isShielding);
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

    // Determine which direction has the smaller overlap
    if (verticalOverlap < horizontalOverlap) {
      // Resolve vertical overlap
      if (thisCenterY < otherCenterY) {
        // This player is above
        this.y = other.y - this.height;
        // Push both players apart horizontally with reduced force
        const pushForce = 4; // Reduced push force to prevent excessive movement
        if (thisCenterX < otherCenterX) {
          this.vx = -pushForce;
          other.vx = pushForce;
        } else {
          this.vx = pushForce;
          other.vx = -pushForce;
        }
        // Don't reset vertical velocity or grounding state here
        // Let the physics system handle it naturally
      } else {
        // This player is below
        this.y = other.y + other.height;
        // Push both players apart horizontally with reduced force
        const pushForce = 4; // Reduced push force to prevent excessive movement
        if (thisCenterX < otherCenterX) {
          this.vx = -pushForce;
          other.vx = pushForce;
        } else {
          this.vx = pushForce;
          other.vx = -pushForce;
        }
        // Don't reset vertical velocity here
        // Let the physics system handle it naturally
      }
    } else {
      // Resolve horizontal overlap - prioritize this for charging players
      if (thisCenterX < otherCenterX) {
        // This player is to the left
        this.x = other.x - this.width;
        // Stop horizontal movement if moving into the other player
        if (this.vx > 0) {
          this.vx = 0;
        }
        // Also stop the other player if they're moving into this player
        if (other.vx < 0) {
          other.vx = 0;
        }
      } else {
        // This player is to the right
        this.x = other.x + other.width;
        // Stop horizontal movement if moving into the other player
        if (this.vx < 0) {
          this.vx = 0;
        }
        // Also stop the other player if they're moving into this player
        if (other.vx > 0) {
          other.vx = 0;
        }
      }
    }
  }
} 