// Physics constants
export const MOVE_SPEED = 5;
export const FRICTION = 0.9;
export const GRAVITY = 0.5;
export const JUMP_FORCE = -18;
export const SECOND_JUMP_FORCE = -15;
export const MAX_FALL_SPEED = 12;
export const COLLISION_DAMPING = 0.1;
export const CONTROL_SWITCH_COOLDOWN = 10; // Frames to wait after switching controls

// Knockback constants
export const BASE_KNOCKBACK = 15;
export const KNOCKBACK_SCALING = 0.5; // How much damage affects knockback
export const VERTICAL_KNOCKBACK = 0.3; // Reduced vertical component of knockback

export class PhysicsBody {
  constructor(x, y, width, height) {
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
    window.debugLog('PhysicsBody created', { x, y, width, height });
  }

  applyKnockback(direction, damage) {
    // Calculate knockback based on damage
    const knockbackForce = BASE_KNOCKBACK + (damage * KNOCKBACK_SCALING);
    
    // Apply horizontal knockback (increased)
    this.vx = direction * knockbackForce * 1.5;
    
    // Apply vertical knockback (reduced)
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
    this.vy += GRAVITY;
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
    // If we're switching controls, set cooldown
    if (this.vx === 0 && direction !== 0) {
      this.controlSwitchCooldown = CONTROL_SWITCH_COOLDOWN;
    }
    this.vx = direction * MOVE_SPEED;
    this.facing = direction;
    window.debugLog('Player moved', {
      direction,
      vx: this.vx.toFixed(2)
    });
  }

  jump() {
    if (this.isGrounded) {
      this.vy = JUMP_FORCE;
      this.isGrounded = false;
      console.log('PhysicsBody jump executed');
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
        if (this.vy > 0) {
          this.vy = 0;
          this.isGrounded = true;
        }
      } else {
        // This player is below
        this.y = other.y + other.height;
        if (this.vy < 0) {
          this.vy = 0;
        }
      }
    } else {
      // Resolve horizontal overlap
      if (thisCenterX < otherCenterX) {
        // This player is to the left
        this.x = other.x - this.width;
        if (this.vx > 0) {
          this.vx = 0;
        }
      } else {
        // This player is to the right
        this.x = other.x + other.width;
        if (this.vx < 0) {
          this.vx = 0;
        }
      }
    }
  }
} 