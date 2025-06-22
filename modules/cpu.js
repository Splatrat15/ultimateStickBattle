// CPU AI module for computer-controlled players
export class CPU {
  constructor(player, otherPlayer, platform) {
    this.player = player;
    this.otherPlayer = otherPlayer;
    this.platform = platform;
    this.decisionTimer = 0;
    this.actionCooldown = 0;
    this.lastAction = null;
    this.targetDirection = 0;
    this.isApproaching = false;
    this.distanceToTarget = 0;
    this.shieldTimer = 0;
    this.chargeTimer = 0; // Timer for charging neutral heavy attacks
    this.isCharging = false; // Track if CPU is currently charging
  }

  update() {
    try {
      // Update cooldowns
      if (this.actionCooldown > 0) {
        this.actionCooldown--;
      }
      if (this.decisionTimer > 0) {
        this.decisionTimer--;
      }
      if (this.shieldTimer > 0) {
        this.shieldTimer--;
        if (this.shieldTimer === 0) {
          this.player.deactivateShield();
        }
      }
      
      // Handle charging timer
      if (this.chargeTimer > 0) {
        this.chargeTimer--;
        if (this.chargeTimer === 0 && this.isCharging) {
          this.player.releaseCharge();
          this.isCharging = false;
        }
      }

      // Make decisions more frequently
      if (this.decisionTimer === 0) {
        this.makeDecision();
        this.decisionTimer = Math.floor(Math.random() * 15) + 5; // Much faster decisions
      }

      // Execute current action
      this.executeAction();
      
      // Always handle emergency situations
      this.handleEmergency();
    } catch (error) {
      console.error('CPU update error:', error);
      // Reset CPU state to prevent further crashes
      this.decisionTimer = 0;
      this.actionCooldown = 0;
      this.shieldTimer = 0;
      this.chargeTimer = 0;
      this.isCharging = false;
    }
  }

  makeDecision() {
    try {
      // Calculate distance to other player
      this.distanceToTarget = Math.abs(this.player.x - this.otherPlayer.x);
      
      // Determine if we should approach or retreat
      const idealDistance = 70; // Closer ideal distance for more aggressive play
      this.isApproaching = this.distanceToTarget > idealDistance;

      // Choose action based on situation - more aggressive weights
      const actions = ['move', 'attack', 'shield', 'jump'];
      let weights = [0.3, 0.4, 0.2, 0.1]; // More likely to attack

      // Adjust weights based on situation
      if (this.distanceToTarget < 80) {
        weights = [0.1, 0.6, 0.2, 0.1]; // Much more likely to attack when close
      }
      if (this.distanceToTarget < 50) {
        weights = [0.05, 0.7, 0.2, 0.05]; // Very aggressive when very close
      }
      if (this.player.damage > 60) {
        weights = [0.2, 0.3, 0.4, 0.1]; // More defensive at high damage
      }
      if (!this.player.isGrounded) {
        weights = [0.2, 0.3, 0.2, 0.3]; // More likely to jump when in air
      }

      // Select action based on weights
      const random = Math.random();
      let cumulativeWeight = 0;
      for (let i = 0; i < actions.length; i++) {
        cumulativeWeight += weights[i];
        if (random <= cumulativeWeight) {
          this.lastAction = actions[i];
          break;
        }
      }

      // Set shorter action cooldown
      this.actionCooldown = Math.floor(Math.random() * 10) + 5;
      
      console.log(`CPU decision: ${this.lastAction}, distance: ${this.distanceToTarget}, approaching: ${this.isApproaching}`);
    } catch (error) {
      console.error('CPU makeDecision error:', error);
      // Set a default action if decision making fails
      this.lastAction = 'move';
      this.actionCooldown = 10;
    }
  }

  executeAction() {
    if (this.actionCooldown > 0) return;

    switch (this.lastAction) {
      case 'move':
        this.executeMovement();
        break;
      case 'attack':
        this.executeAttack();
        break;
      case 'shield':
        this.executeShield();
        break;
      case 'jump':
        this.executeJump();
        break;
    }
    
    console.log(`CPU executing: ${this.lastAction}`);
  }

  executeMovement() {
    try {
      // Determine movement direction
      if (this.isApproaching) {
        // Move towards the other player
        this.targetDirection = this.otherPlayer.x > this.player.x ? 1 : -1;
      } else {
        // Move away from the other player
        this.targetDirection = this.otherPlayer.x > this.player.x ? -1 : 1;
      }

      // Execute movement
      this.player.move(this.targetDirection);
    } catch (error) {
      console.error('CPU executeMovement error:', error);
    }
  }

  executeAttack() {
    try {
      // Attack more aggressively - higher range and more frequent
      if (this.distanceToTarget < 100 && !this.player.isAttacking && !this.isCharging) {
        // Choose attack type based on distance and damage
        let attackType = 'light';
        if (this.distanceToTarget < 60 || this.otherPlayer.damage > 20) {
          attackType = 'heavy';
        }

        // Higher chance to use heavy attack
        if (Math.random() < 0.5) {
          attackType = 'heavy';
        }

        // Determine attack direction based on opponent position
        let direction = 'neutral';
        if (this.otherPlayer.x > this.player.x + 30) {
          direction = 'side'; // Opponent is to the right
        } else if (this.otherPlayer.x < this.player.x - 30) {
          direction = 'side'; // Opponent is to the left
        } else if (this.otherPlayer.y < this.player.y - 20) {
          direction = 'up'; // Opponent is above
        } else if (this.otherPlayer.y > this.player.y + 20) {
          direction = 'down'; // Opponent is below
        }

        // For neutral heavy attacks, use charging system
        if (direction === 'neutral' && attackType === 'heavy') {
          this.player.startCharge();
          this.isCharging = true;
          // Set charge timer for random duration between 30-90 frames (0.5-1.5 seconds at 60fps)
          this.chargeTimer = Math.floor(Math.random() * 60) + 30;
        } else {
          // Use regular directional attacks
          this.player.attack(direction, attackType);
        }
      }
    } catch (error) {
      console.error('CPU executeAttack error:', error);
    }
  }

  executeShield() {
    try {
      // Shield more intelligently
      if (this.otherPlayer.isAttacking || this.player.damage > 30) {
        this.player.activateShield();
        
        // Set shield timer for automatic deactivation
        this.shieldTimer = Math.floor(Math.random() * 20) + 15;
      }
    } catch (error) {
      console.error('CPU executeShield error:', error);
    }
  }

  executeJump() {
    try {
      // Jump more frequently for movement and evasion
      if (this.player.isGrounded) {
        // Jump to approach or retreat
        if (this.isApproaching && this.distanceToTarget > 80) {
          this.player.jump();
        } else if (!this.isApproaching && this.distanceToTarget < 60) {
          this.player.jump();
        } else if (Math.random() < 0.3) {
          // Random jumping for unpredictability
          this.player.jump();
        }
      }
    } catch (error) {
      console.error('CPU executeJump error:', error);
    }
  }

  // Emergency actions for survival
  handleEmergency() {
    try {
      // If falling off screen, try to recover
      if (this.player.y > this.platform.y + 150) {
        // Jump to try to recover
        if (this.player.jumpsRemaining > 0) {
          this.player.jump();
        }
        
        // Move towards platform center
        const platformCenter = this.platform.x + this.platform.width / 2;
        const direction = platformCenter > this.player.x ? 1 : -1;
        this.player.move(direction);
      }

      // If at very high damage, be more defensive
      if (this.player.damage > 70) {
        if (!this.player.isShielding && this.shieldTimer === 0) {
          this.player.activateShield();
          this.shieldTimer = 30;
        }
      }
      
      // If opponent is attacking and we're close, shield
      if (this.otherPlayer.isAttacking && this.distanceToTarget < 80 && this.shieldTimer === 0) {
        this.player.activateShield();
        this.shieldTimer = 15;
      }
    } catch (error) {
      console.error('CPU handleEmergency error:', error);
    }
  }
} 