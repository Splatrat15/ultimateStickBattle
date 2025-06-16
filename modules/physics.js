// Physics constants
export const MOVE_SPEED = 5;
export const FRICTION = 0.9;
export const GRAVITY = 0.8;
export const JUMP_FORCE = -15;
export const MAX_FALL_SPEED = 15;
export const COLLISION_DAMPING = 0.1;
export const CONTROL_SWITCH_COOLDOWN = 10; // Frames to wait after switching controls

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
    window.debugLog('PhysicsBody created', { x, y, width, height });
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

    // Only check horizontal collision if players are at similar heights
    // This allows jumping over each other
    const verticalOverlap = Math.min(this.y + this.height, other.y + other.height) - Math.max(this.y, other.y);
    if (verticalOverlap <= 0) {
      return; // No vertical overlap, can't collide
    }

    // Check if players are overlapping horizontally
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