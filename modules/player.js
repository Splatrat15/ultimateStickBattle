import { PhysicsBody } from './physics.js';

export class Player extends PhysicsBody {
  constructor(x, y, color, facing) {
    super(x, y, 60, 60); // 60x60 is the player size
    this.color = color;
    this.facing = facing;
    this.damage = 0;
    this.score = 0;
    this.isAttacking = false;
    this.lightAttackCooldown = 0;
    this.heavyAttackCooldown = 0;
    this.attackHitbox = null;
    this.width = 60;  // Explicitly set width
    this.height = 60; // Explicitly set height
    this.vy = 0;      // Initialize vertical velocity
    this.attackType = null; // 'light' or 'heavy'
    this.jumpsRemaining = 2; // Track number of jumps available
  }

  update(platforms, otherPlayer) {
    super.update(platforms);
    
    // Only check collision if this player is moving
    if (this.vx !== 0) {
      this.checkPlayerCollision(otherPlayer);
    }
    
    // Update attack cooldowns
    if (this.lightAttackCooldown > 0) {
      this.lightAttackCooldown--;
    }
    if (this.heavyAttackCooldown > 0) {
      this.heavyAttackCooldown--;
    }
    
    // Update attack state
    if (this.isAttacking) {
      this.attackCooldown--;
      if (this.attackCooldown === 0) {
        this.isAttacking = false;
        this.attackHitbox = null;
        this.attackType = null;
      }
    }
    
    // Update attack hitbox
    if (this.isAttacking) {
      this.updateAttackHitbox();
    }

    // Reset jumps when landing on ground
    if (this.isGrounded) {
      this.jumpsRemaining = 2;
    }
  }

  attack(type) {
    // Check if the specific attack type is on cooldown
    if (type === 'light' && this.lightAttackCooldown > 0) {
      return; // Can't use light attack yet
    }
    if (type === 'heavy' && this.heavyAttackCooldown > 0) {
      return; // Can't use heavy attack yet
    }

    this.isAttacking = true;
    this.attackType = type;
    
    // Set cooldowns based on attack type
    if (type === 'heavy') {
      this.attackCooldown = 30; // Duration of heavy attack
      this.heavyAttackCooldown = 60; // Cooldown before next heavy attack
    } else {
      this.attackCooldown = 15; // Duration of light attack
      this.lightAttackCooldown = 20; // Cooldown before next light attack
    }
    
    this.createAttackHitbox();
  }

  createAttackHitbox() {
    const isHeavy = this.attackType === 'heavy';
    const hitboxSize = isHeavy ? 60 : 40; // Heavy attacks are larger
    const offset = this.facing > 0 ? this.width : -hitboxSize;
    this.attackHitbox = {
      x: this.x + offset,
      y: this.y + (this.height - hitboxSize) / 2,
      width: hitboxSize,
      height: hitboxSize
    };
  }

  updateAttackHitbox() {
    if (this.attackHitbox) {
      const offset = this.facing > 0 ? this.width : -this.attackHitbox.width;
      this.attackHitbox.x = this.x + offset;
      this.attackHitbox.y = this.y + (this.height - this.attackHitbox.height) / 2;
    }
  }

  checkAttackHit(otherPlayer) {
    if (!this.isAttacking || !this.attackHitbox) return false;

    return (
      this.attackHitbox.x < otherPlayer.x + otherPlayer.width &&
      this.attackHitbox.x + this.attackHitbox.width > otherPlayer.x &&
      this.attackHitbox.y < otherPlayer.y + otherPlayer.height &&
      this.attackHitbox.y + this.attackHitbox.height > otherPlayer.y
    );
  }

  takeDamage(amount, attacker) {
    // Add damage but cap at 999%
    this.damage = Math.min(this.damage + amount, 999);
    this.invincibilityFrames = 30; // 30 frames of invincibility after being hit
    
    // Calculate knockback direction based on attacker's position
    const knockbackDirection = attacker.x < this.x ? 1 : -1;
    this.applyKnockback(knockbackDirection, this.damage);
  }

  jump() {
    if (this.jumpsRemaining > 0) {
      this.vy = JUMP_FORCE;
      this.isGrounded = false;
      this.jumpsRemaining--;
    }
  }

  resetPosition(x, y) {
    super.resetPosition(x, y);  // Call parent class's resetPosition
    this.damage = 0;  // Reset damage when position is reset
    this.jumpsRemaining = 2; // Reset jumps when position is reset
  }
}
