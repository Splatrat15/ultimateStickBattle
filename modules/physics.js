// Physics constants
export const MOVE_SPEED = 5;
export const FRICTION = 0.9;
export const GRAVITY = 0.8;
export const JUMP_FORCE = -15;
export const MAX_FALL_SPEED = 15;
export const COLLISION_DAMPING = 0.1;
export const CONTROL_SWITCH_COOLDOWN = 10; // Frames to wait after switching controls

// Knockback constants
export const BASE_KNOCKBACK = 10;
export const KNOCKBACK_SCALING = 0.5; // How much damage affects knockback
export const VERTICAL_KNOCKBACK = 0.7; // Vertical component of knockback

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
    
    // Apply horizontal knockback
    this.vx = direction * knockbackForce;
    
    // Apply vertical knockback
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
      // Only check collision if player is above the platform
      if (this.x + this.width > platform.x && 
          this.x < platform.x + platform.width &&
          this.y + this.height > platform.y &&
          this.y < platform.y) {
        // Check if player is falling and would land on platform
        if (this.vy > 0 && 
            oldY + this.height <= platform.y && 
            this.y + this.height >= platform.y) {
          this.y = platform.y - this.height;
          this.vy = 0;
          this.isGrounded = true;
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
      window.debugLog('Player jumped', {
        vy: this.vy.toFixed(2)
      });
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

    // If falling onto the other player
    if (this.vy > 0 && this.y + this.height > other.y && this.y < other.y) {
      // Calculate center points
      const thisCenter = this.x + (this.width / 2);
      const otherCenter = other.x + (other.width / 2);
      
      // Slide to the side based on center points
      if (thisCenter < otherCenter) {
        this.x = other.x - this.width;
      } else {
        this.x = other.x + other.width;
      }
      this.vy = 0; // Stop falling
      return;
    }

    // If the other player is falling onto this player
    if (other.vy > 0 && other.y + other.height > this.y && other.y < this.y) {
      // Calculate center points
      const thisCenter = this.x + (this.width / 2);
      const otherCenter = other.x + (other.width / 2);
      
      // Slide to the side based on center points
      if (otherCenter < thisCenter) {
        other.x = this.x - other.width;
      } else {
        other.x = this.x + this.width;
      }
      other.vy = 0; // Stop falling
      return;
    }

    // Regular horizontal collision
    if (this.x + this.width > other.x && this.x < other.x + other.width) {
      // If moving right and hitting other player's left side
      if (this.vx > 0) {
        this.x = other.x - this.width;
        this.vx = 0;
      }
      // If moving left and hitting other player's right side
      else if (this.vx < 0) {
        this.x = other.x + other.width;
        this.vx = 0;
      }
    }
  }
} 