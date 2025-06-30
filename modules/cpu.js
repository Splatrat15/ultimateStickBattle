// CPU AI module for computer-controlled players
export class CPU {
  constructor(player, otherPlayer, platform, difficulty = 'MEDIUM') {
    this.player = player;
    this.otherPlayer = otherPlayer;
    this.platform = platform;
    this.difficulty = difficulty;
    this.setDifficultyParams(difficulty);
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

  setDifficultyParams(difficulty) {
    switch (difficulty) {
      case 'EASY':
        this.reactionMin = 30; // slow
        this.reactionMax = 60;
        this.attackAccuracy = 0.5; // 50% chance to attack when in range
        this.shieldChance = 0.1; // 10% chance to shield
        this.comboChance = 0.1;
        this.heavyChance = 0.1;
        this.chargeChance = 0.0;
        break;
      case 'MEDIUM':
        this.reactionMin = 15;
        this.reactionMax = 30;
        this.attackAccuracy = 0.8;
        this.shieldChance = 0.3;
        this.comboChance = 0.5;
        this.heavyChance = 0.4;
        this.chargeChance = 0.3;
        break;
      case 'HARD':
        this.reactionMin = 5;
        this.reactionMax = 15;
        this.attackAccuracy = 0.97;
        this.shieldChance = 0.6;
        this.comboChance = 0.8;
        this.heavyChance = 0.7;
        this.chargeChance = 0.7;
        break;
      case 'EXPERT':
        this.reactionMin = 1;
        this.reactionMax = 3;
        this.attackAccuracy = 1.0;
        this.shieldChance = 0.98;
        this.comboChance = 1.0;
        this.heavyChance = 1.0;
        this.chargeChance = 1.0;
        break;
      default:
        this.reactionMin = 15;
        this.reactionMax = 30;
        this.attackAccuracy = 0.8;
        this.shieldChance = 0.3;
        this.comboChance = 0.5;
        this.heavyChance = 0.4;
        this.chargeChance = 0.3;
    }
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

      // Make decisions based on difficulty
      if (this.decisionTimer === 0) {
        this.makeDecision();
        this.decisionTimer = Math.floor(Math.random() * (this.reactionMax - this.reactionMin + 1)) + this.reactionMin;
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

      // Choose action based on situation
      const actions = ['move', 'attack', 'shield', 'jump'];
      let weights;
      switch (this.difficulty) {
        case 'EASY':
          weights = [0.5, 0.3, 0.1, 0.1];
          break;
        case 'MEDIUM':
          weights = [0.3, 0.4, 0.2, 0.1];
          break;
        case 'HARD':
          weights = [0.2, 0.5, 0.2, 0.1];
          break;
        case 'EXPERT':
          weights = [0.1, 0.7, 0.15, 0.05];
          break;
        default:
          weights = [0.3, 0.4, 0.2, 0.1];
      }

      // Adjust weights based on situation
      if (this.distanceToTarget < 80) weights[1] += 0.2;
      if (this.distanceToTarget < 50) weights[1] += 0.2;
      if (this.player.damage > 60) weights[2] += 0.2;
      if (!this.player.isGrounded) weights[3] += 0.2;

      // Normalize weights
      const total = weights.reduce((a, b) => a + b, 0);
      weights = weights.map(w => w / total);

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

      // Set action cooldown based on difficulty
      this.actionCooldown = Math.floor(Math.random() * (this.reactionMax - this.reactionMin + 1)) + this.reactionMin;
      
      console.log(`CPU decision: ${this.lastAction}, distance: ${this.distanceToTarget}, approaching: ${this.isApproaching}`);
    } catch (error) {
      console.error('CPU makeDecision error:', error);
      this.lastAction = 'move';
      this.actionCooldown = this.reactionMax;
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
      // Predictive movement: anticipate where the opponent will be
      let targetX = this.otherPlayer.x;
      let targetY = this.otherPlayer.y;
      if (this.difficulty === 'HARD' || this.difficulty === 'EXPERT') {
        // Predict based on velocity (simple prediction)
        targetX += this.otherPlayer.vx * 10;
        targetY += this.otherPlayer.vy * 10;
      }
      // Edge guarding: if opponent is off-stage, move to edge
      if ((this.difficulty === 'HARD' || this.difficulty === 'EXPERT') &&
          (this.otherPlayer.y > this.platform.y + 60 || this.otherPlayer.x < this.platform.x - 40 || this.otherPlayer.x > this.platform.x + this.platform.width + 40)) {
        // Move to edge
        if (this.otherPlayer.x < this.platform.x) {
          this.targetDirection = -1;
        } else if (this.otherPlayer.x > this.platform.x + this.platform.width) {
          this.targetDirection = 1;
        } else {
          this.targetDirection = 0;
        }
      } else if (this.difficulty === 'EXPERT' && Math.abs(targetX - this.player.x) < 40 && Math.abs(targetY - this.player.y) < 40) {
        // EXPERT: microspacing, move slightly to optimal range
        this.targetDirection = (targetX > this.player.x) ? 1 : -1;
      } else if (this.difficulty === 'EASY' && Math.random() < 0.2) {
        this.targetDirection = Math.random() < 0.5 ? 1 : -1;
      } else if (this.isApproaching) {
        this.targetDirection = targetX > this.player.x ? 1 : -1;
      } else {
        this.targetDirection = targetX > this.player.x ? -1 : 1;
      }
      this.player.move(this.targetDirection);
    } catch (error) {
      console.error('CPU executeMovement error:', error);
    }
  }

  executeAttack() {
    try {
      // Only attack if in range and not attacking
      const inRange = this.distanceToTarget < 100 && Math.abs(this.player.y - this.otherPlayer.y) < 60;
      if (!inRange || this.player.isAttacking || this.isCharging) return;
      // EASY: sometimes misses
      if (this.difficulty === 'EASY' && Math.random() > this.attackAccuracy) return;
      // MEDIUM: sometimes misses
      if (this.difficulty === 'MEDIUM' && Math.random() > this.attackAccuracy) return;
      // HARD: rarely misses
      if (this.difficulty === 'HARD' && Math.random() > this.attackAccuracy) return;
      // EXPERT: never misses
      // Directional logic
      let direction = 'neutral';
      if (this.otherPlayer.x > this.player.x + 30) direction = 'side';
      else if (this.otherPlayer.x < this.player.x - 30) direction = 'side';
      else if (this.otherPlayer.y < this.player.y - 20) direction = 'up';
      else if (this.otherPlayer.y > this.player.y + 20) direction = 'down';
      // Punish shield: if opponent is shielding, use heavy or charge
      let attackType = 'light';
      let combo = false;
      if ((this.difficulty === 'HARD' || this.difficulty === 'EXPERT') && this.otherPlayer.isShielding) {
        attackType = 'heavy';
        if (Math.random() < this.chargeChance) {
          this.player.startCharge();
          this.isCharging = true;
          this.chargeTimer = this.difficulty === 'EXPERT' ? 40 : 80;
          return;
        }
      }
      // EXPERT: read player movement and intercept
      if (this.difficulty === 'EXPERT' && Math.abs(this.otherPlayer.vx) > 1) {
        if ((this.otherPlayer.vx > 0 && this.player.x < this.otherPlayer.x) || (this.otherPlayer.vx < 0 && this.player.x > this.otherPlayer.x)) {
          direction = 'side';
        }
      }
      // Combo logic
      if (this.difficulty === 'EASY') {
        if (Math.random() < this.heavyChance) attackType = 'heavy';
      } else if (this.difficulty === 'MEDIUM') {
        if (Math.random() < this.heavyChance) attackType = 'heavy';
        if (Math.random() < this.comboChance) combo = true;
      } else if (this.difficulty === 'HARD') {
        if (Math.random() < this.heavyChance) attackType = 'heavy';
        if (Math.random() < this.comboChance) combo = true;
      } else if (this.difficulty === 'EXPERT') {
        attackType = Math.random() < 0.5 ? 'heavy' : 'light';
        combo = true;
      }
      // Charge logic
      if (attackType === 'heavy' && Math.random() < this.chargeChance) {
        this.player.startCharge();
        this.isCharging = true;
        this.chargeTimer = this.difficulty === 'EXPERT' ? 40 : Math.floor(Math.random() * 40) + 20;
        return;
      }
      // Combo chaining for Rakka and Kaon
      if (combo && this.player.characterName === 'Rakka') {
        // Rakka jab combo: light, light, heavy
        this.player.attack(direction, 'light');
        setTimeout(() => this.player.attack(direction, 'light'), 120 / (this.difficulty === 'EXPERT' ? 2 : 1));
        setTimeout(() => this.player.attack(direction, 'heavy'), 240 / (this.difficulty === 'EXPERT' ? 2 : 1));
      } else if (combo && this.player.characterName === 'Kaon') {
        // Kaon combo: light, heavy
        this.player.attack(direction, 'light');
        setTimeout(() => this.player.attack(direction, 'heavy'), 120 / (this.difficulty === 'EXPERT' ? 2 : 1));
      } else {
        this.player.attack(direction, attackType);
      }
    } catch (error) {
      console.error('CPU executeAttack error:', error);
    }
  }

  executeShield() {
    try {
      if (Math.random() < this.shieldChance) {
        this.player.activateShield();
        this.shieldTimer = Math.floor(Math.random() * 20) + 15;
      }
    } catch (error) {
      console.error('CPU executeShield error:', error);
    }
  }

  executeJump() {
    try {
      if (this.player.isGrounded) {
        if (this.isApproaching && this.distanceToTarget > 80) {
          this.player.jump();
        } else if (!this.isApproaching && this.distanceToTarget < 60) {
          this.player.jump();
        } else if (Math.random() < 0.3) {
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
      if (this.player.y > this.platform.y + 150) {
        if (this.player.jumpsRemaining > 0) {
          this.player.jump();
        }
        const platformCenter = this.platform.x + this.platform.width / 2;
        const direction = platformCenter > this.player.x ? 1 : -1;
        this.player.move(direction);
      }
      if (this.player.damage > 70 && Math.random() < this.shieldChance) {
        if (!this.player.isShielding && this.shieldTimer === 0) {
          this.player.activateShield();
          this.shieldTimer = 30;
        }
      }
      if (this.otherPlayer.isAttacking && this.distanceToTarget < 80 && Math.random() < this.shieldChance && this.shieldTimer === 0) {
        this.player.activateShield();
        this.shieldTimer = 15;
      }
    } catch (error) {
      console.error('CPU handleEmergency error:', error);
    }
  }
} 