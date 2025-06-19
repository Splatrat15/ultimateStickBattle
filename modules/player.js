import { PhysicsBody, JUMP_FORCE, SECOND_JUMP_FORCE } from './physics.js';

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
    this.isJumpKeyPressed = false; // Track if jump key is currently pressed
    this.lastHitTarget = null; // Track last target hit to prevent spam damage
    this.hitCooldown = 0; // Cooldown to prevent rapid damage from same attack
    this.respawnInvincibilityFrames = 0; // Frames of invincibility after respawning
    this.isBlinking = false; // Track if player should be blinking
    this.gameStarted = false; // Track if game has started to prevent initial invincibility
  }

  //TODO: Get rid of inital invincibility off rip of loading into the game

  update(platforms, otherPlayer) {
    super.update(platforms);
    
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
        this.attackType = null;
        this.lastHitTarget = null; // Reset last hit target when attack ends
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

    // Always check collision to prevent passing through other players
    this.checkPlayerCollision(otherPlayer);
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
    
    // Position hitbox in front of the player based on facing direction
    let hitboxX;
    if (this.facing > 0) {
      // Facing right, hitbox to the right of player
      hitboxX = this.x + this.width;
    } else {
      // Facing left, hitbox to the left of player
      hitboxX = this.x - hitboxSize;
    }
    
    this.attackHitbox = {
      x: hitboxX,
      y: this.y + (this.height - hitboxSize) / 2,
      width: hitboxSize,
      height: hitboxSize
    };
    
    // Debug log to verify hitbox positioning
    console.log('Attack hitbox created:', {
      playerX: this.x,
      playerY: this.y,
      facing: this.facing,
      hitboxX: this.attackHitbox.x,
      hitboxY: this.attackHitbox.y,
      hitboxWidth: this.attackHitbox.width,
      hitboxHeight: this.attackHitbox.height,
      attackType: this.attackType
    });
  }

  updateAttackHitbox() {
    if (this.attackHitbox) {
      // Position hitbox in front of the player based on facing direction
      let hitboxX;
      if (this.facing > 0) {
        // Facing right, hitbox to the right of player
        hitboxX = this.x + this.width;
      } else {
        // Facing left, hitbox to the left of player
        hitboxX = this.x - this.attackHitbox.width;
      }
      
      this.attackHitbox.x = hitboxX;
      this.attackHitbox.y = this.y + (this.height - this.attackHitbox.height) / 2;
    }
  }

  checkAttackHit(otherPlayer) {
    if (!this.isAttacking || !this.attackHitbox) return false;
    
    // Check if we've already hit this target recently (prevent spam damage)
    if (this.lastHitTarget === otherPlayer && this.hitCooldown > 0) {
      return false;
    }

    // Check if attack hitbox overlaps with other player
    const hit = (
      this.attackHitbox.x < otherPlayer.x + otherPlayer.width &&
      this.attackHitbox.x + this.attackHitbox.width > otherPlayer.x &&
      this.attackHitbox.y < otherPlayer.y + otherPlayer.height &&
      this.attackHitbox.y + this.attackHitbox.height > otherPlayer.y
    );
    
    // If hit, set cooldown and mark target
    if (hit) {
      this.lastHitTarget = otherPlayer;
      this.hitCooldown = 10; // 10 frames cooldown between hits on same target
      
      console.log('Attack hit detected!', {
        attacker: this.color,
        target: otherPlayer.color,
        attackType: this.attackType,
        attackerX: this.x,
        targetX: otherPlayer.x,
        hitboxX: this.attackHitbox.x,
        cooldownSet: this.hitCooldown
      });
    }
    
    return hit;
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
    
    // Add damage but cap at 999%
    this.damage = Math.min(this.damage + amount, 999);
    this.invincibilityFrames = 120; // 120 frames of invincibility after being hit
    
    // Always use the attacker's facing direction for knockback
    // This ensures players are sent in the direction the attacker is facing
    const knockbackDirection = attacker.facing;
    
    console.log('Taking damage:', {
      target: this.color,
      attacker: attacker.color,
      damage: amount,
      totalDamage: this.damage,
      knockbackDirection: knockbackDirection,
      attackerFacing: attacker.facing,
      attackerX: attacker.x,
      targetX: this.x
    });
    
    this.applyKnockback(knockbackDirection, this.damage);
  }

  jump() {
    console.log('=== JUMP ATTEMPT ===');
    console.log('Jumps remaining:', this.jumpsRemaining);
    console.log('Is grounded:', this.isGrounded);
    console.log('Is jump key pressed:', this.isJumpKeyPressed);
    
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

  setGameStarted() {
    this.gameStarted = true;
    console.log('Game started for player:', this.color);
  }

  setInitialPosition(x, y) {
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
    
    console.log('Player initial position set:', {
      color: this.color,
      x: x,
      y: y
    });
  }
}
