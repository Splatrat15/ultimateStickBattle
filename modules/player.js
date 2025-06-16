import { PhysicsBody } from './physics.js';

export class Player extends PhysicsBody {
  constructor(x, y, color, facing) {
    super(x, y, 60, 60); // 60x60 is the player size
    this.color = color;
    this.facing = facing;
    this.damage = 0;
    this.score = 0;
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.attackHitbox = null;
    this.width = 60;  // Explicitly set width
    this.height = 60; // Explicitly set height
    this.vy = 0;      // Initialize vertical velocity
    this.attackType = null; // 'light' or 'heavy'
  }

  update(platforms, otherPlayer) {
    super.update(platforms);
    
    // Only check collision if this player is moving
    if (this.vx !== 0) {
      this.checkPlayerCollision(otherPlayer);
    }
    
    // Update attack cooldown
    if (this.attackCooldown > 0) {
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
  }

  attack(type) {
    if (this.attackCooldown <= 0) {
      this.isAttacking = true;
      this.attackType = type;
      this.attackCooldown = type === 'heavy' ? 40 : 20; // Heavy attacks have longer cooldown
      this.createAttackHitbox();
    }
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

  takeDamage(amount) {
    this.damage += amount;
    this.invincibilityFrames = 30; // 30 frames of invincibility after being hit
  }

  resetPosition(x, y) {
    super.resetPosition(x, y);  // Call parent class's resetPosition
    this.damage = 0;  // Reset damage when position is reset
  }
}
