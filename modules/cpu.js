// CPU AI module for computer-controlled players
// --- FSM States ---
const CPU_STATES = {
  IDLE: 'idle',
  APPROACH: 'approach',
  ATTACK: 'attack',
  BLOCK: 'block',
  DODGE: 'dodge',
  RECOVER: 'recover',
};

export class CPU {
  constructor(player, otherPlayer, platform, difficulty = 'MEDIUM') {
    this.player = player;
    this.otherPlayer = otherPlayer;
    this.platform = platform;
    this.difficulty = difficulty;
    this.setDifficultyParams(difficulty);
    this.state = CPU_STATES.IDLE;
    this.stateTimer = 0;
    this.reactionTimer = 0;
    this.lastAction = null;
    this.targetDirection = 0;
    this.isApproaching = false;
    this.distanceToTarget = 0;
    this.shieldTimer = 0;
    this.chargeTimer = 0; // Timer for charging neutral heavy attacks
    this.isCharging = false; // Track if CPU is currently charging
    this.recoveryJumpTimer = 0; // Timer to space out jumps during recovery
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
      // Update timers
      if (this.shieldTimer > 0) {
        this.shieldTimer--;
        if (this.shieldTimer === 0) {
          this.player.deactivateShield();
        }
      }
      if (this.chargeTimer > 0) {
        this.chargeTimer--;
        if (this.chargeTimer === 0 && this.isCharging) {
          this.player.releaseCharge();
          this.isCharging = false;
        }
      }
      if (this.reactionTimer > 0) {
        this.reactionTimer--;
        return; // Wait for reaction delay
      }
      // FSM: State update
      this.updateState();
      // Always handle emergency situations
      this.handleEmergency();
    } catch (error) {
      console.error('CPU update error:', error);
      // Reset CPU state to prevent further crashes
      this.state = CPU_STATES.IDLE;
      this.stateTimer = 0;
      this.reactionTimer = 0;
      this.shieldTimer = 0;
      this.chargeTimer = 0;
      this.isCharging = false;
    }
  }

  updateState() {
    // Calculate context
    this.distanceToTarget = Math.abs(this.player.x - this.otherPlayer.x);
    const isGrounded = this.player.isGrounded;
    const inRange = this.distanceToTarget < 100 && Math.abs(this.player.y - this.otherPlayer.y) < 60;
    const shouldBlock = this.otherPlayer.isAttacking && this.distanceToTarget < 80;
    const shouldDodge = (this.otherPlayer.isAttacking || this.otherPlayer.isCharging) && Math.random() < (this.difficulty === 'EXPERT' ? 0.7 : this.difficulty === 'HARD' ? 0.5 : 0.2) && isGrounded;
    const shouldRecover = this.player.y > this.platform.y + 120;
    const shouldApproach = this.distanceToTarget > 60;
    const shouldAttack = inRange && !this.player.isAttacking && !this.isCharging;
    const oppHighPercent = this.otherPlayer.damage > 100;
    const selfHighPercent = this.player.damage > 120;
    // --- EXPERT: Frame-perfect, always optimal ---
    if (this.difficulty === 'EXPERT') {
      // Always recover if offstage
      if (shouldRecover) {
        this.changeState(CPU_STATES.RECOVER);
        return;
      }
      // Always block if player is attacking and in range
      if (shouldBlock && !this.player.isShielding) {
        this.changeState(CPU_STATES.BLOCK);
        return;
      }
      // Always dodge if player is attacking/charging and not blocking
      if ((this.otherPlayer.isAttacking || this.otherPlayer.isCharging) && !this.player.isShielding && isGrounded) {
        this.changeState(CPU_STATES.DODGE);
        return;
      }
      // Always attack if in range and not attacking/charging
      if (shouldAttack) {
        this.changeState(CPU_STATES.ATTACK);
        return;
      }
      // Always approach if not in range
      if (shouldApproach) {
        this.changeState(CPU_STATES.APPROACH);
        return;
      }
      // Otherwise idle
      this.changeState(CPU_STATES.IDLE);
      return;
    }
    // --- END EXPERT ---
    // State transitions for other difficulties
    switch (this.state) {
      case CPU_STATES.IDLE:
        if (shouldRecover) {
          this.changeState(CPU_STATES.RECOVER);
        } else if (shouldBlock && Math.random() < this.shieldChance) {
          this.changeState(CPU_STATES.BLOCK);
        } else if (shouldDodge && Math.random() < 0.7) {
          this.changeState(CPU_STATES.DODGE);
        } else if (shouldAttack && !selfHighPercent) {
          this.changeState(CPU_STATES.ATTACK);
        } else if (shouldApproach && !selfHighPercent) {
          this.changeState(CPU_STATES.APPROACH);
        }
        break;
      case CPU_STATES.APPROACH:
        if (shouldAttack && !selfHighPercent) {
          this.changeState(CPU_STATES.ATTACK);
        } else if (!shouldApproach || selfHighPercent) {
          this.changeState(CPU_STATES.IDLE);
        }
        break;
      case CPU_STATES.ATTACK:
        if (!shouldAttack || selfHighPercent) {
          this.changeState(CPU_STATES.IDLE);
        }
        break;
      case CPU_STATES.BLOCK:
        if (!shouldBlock) {
          this.changeState(CPU_STATES.IDLE);
        }
        break;
      case CPU_STATES.DODGE:
        this.changeState(CPU_STATES.IDLE);
        break;
      case CPU_STATES.RECOVER:
        if (isGrounded) {
          this.changeState(CPU_STATES.IDLE);
        }
        break;
    }
    // State actions
    this.runState();
  }

  changeState(newState) {
    this.state = newState;
    this.stateTimer = 0;
    // Set reaction delay based on difficulty
    switch (this.difficulty) {
      case 'EASY': this.reactionTimer = 30; break; // ~500ms at 60fps
      case 'MEDIUM': this.reactionTimer = 18; break; // ~300ms
      case 'HARD': this.reactionTimer = 6; break; // ~100ms
      case 'EXPERT': this.reactionTimer = 0; break; // frame-perfect
      default: this.reactionTimer = 18;
    }
  }

  runState() {
    switch (this.state) {
      case CPU_STATES.IDLE:
        // Stand still, maybe taunt or reposition
        // Occasionally reposition or jump to avoid being too passive
        if (Math.random() < 0.04 * (this.difficulty === 'EASY' ? 0.5 : 1)) {
          // Small random reposition
          const dir = Math.random() < 0.5 ? -1 : 1;
          this.player.move(dir);
        }
        // Occasionally jump in place (for higher difficulties)
        if (this.difficulty !== 'EASY' && Math.random() < 0.01 * (this.difficulty === 'EXPERT' ? 3 : 1)) {
          this.tryJump();
        }
        break;
      case CPU_STATES.APPROACH:
        this.approachPlayer();
        // Occasionally jump while approaching (for aerial approach)
        if (this.difficulty !== 'EASY' && Math.random() < 0.02 * (this.difficulty === 'EXPERT' ? 2 : 1)) {
          this.tryJump();
        }
        break;
      case CPU_STATES.ATTACK:
        this.executeAttack();
        break;
      case CPU_STATES.BLOCK:
        this.executeShield();
        break;
      case CPU_STATES.DODGE:
        this.executeDodge();
        break;
      case CPU_STATES.RECOVER:
        this.executeRecover();
        break;
    }
    this.stateTimer++;
  }

  // Try to jump if possible (for movement, dodging, or recovery)
  tryJump() {
    if (this.player.jumpsRemaining > 0 && !this.player.isJumpKeyPressed && !this.player.isAttacking && !this.player.isShielding) {
      this.player.jump();
    }
  }

  approachPlayer() {
    // Move toward or away from the opponent based on distance and character
    const char = this.player.characterName;
    const dist = this.distanceToTarget;
    const opp = this.otherPlayer;
    const platformCenter = this.platform.x + this.platform.width / 2;
    const stageEdgeBuffer = 60; // How close to the edge before being cautious
    // If near the edge, prefer to move toward center unless edgeguarding
    if ((this.player.x < this.platform.x + stageEdgeBuffer || this.player.x > this.platform.x + this.platform.width - stageEdgeBuffer)) {
      // If opponent is not offstage, move toward center
      if (!(opp.y > this.platform.y + 60 || opp.x < this.platform.x - 40 || opp.x > this.platform.x + this.platform.width + 40)) {
        const dirToCenter = platformCenter > this.player.x ? 1 : -1;
        this.player.move(dirToCenter);
        // Sometimes jump to center for higher difficulties
        if (this.difficulty !== 'EASY' && Math.random() < 0.03 * (this.difficulty === 'EXPERT' ? 2 : 1)) {
          this.tryJump();
        }
        return;
      }
    }
    // If opponent is offstage, do NOT follow them offstage. Stay near the edge but don't move off.
    const oppOffstage = (opp.y > this.platform.y + 60 || opp.x < this.platform.x - 40 || opp.x > this.platform.x + this.platform.width + 40);
    if (oppOffstage) {
      // Stay near the edge, but not past it
      if (this.player.x < this.platform.x + stageEdgeBuffer) {
        this.player.move(1); // Move right, away from edge
      } else if (this.player.x > this.platform.x + this.platform.width - stageEdgeBuffer) {
        this.player.move(-1); // Move left, away from edge
      } else {
        this.player.move(0); // Hold position
      }
      return;
    }
    // For Rakka, sometimes approach with a jump (aggressive)
    if (char === 'Rakka' && dist > 80 && Math.random() < 0.08 * (this.difficulty === 'EXPERT' ? 2 : 1)) {
      this.tryJump();
    }
    // For Kaon, floaty approach (sometimes jump)
    if (char === 'Kaon' && dist > 80 && Math.random() < 0.05 * (this.difficulty === 'EXPERT' ? 2 : 1)) {
      this.tryJump();
    }
    // Retreat if high damage and close to opponent (defensive play)
    if (this.player.damage > 100 && dist < 60 && Math.random() < 0.2 * (this.difficulty === 'HARD' ? 2 : 1)) {
      this.player.move(this.player.x < opp.x ? -1 : 1);
      return;
    }
    // Default: approach
    if (this.player.x < opp.x - 10) {
      this.player.move(1);
    } else if (this.player.x > opp.x + 10) {
      this.player.move(-1);
    } else {
      this.player.move(0);
    }
  }

  executeAttack() {
    const char = this.player.characterName;
    const opp = this.otherPlayer;
    const dist = this.distanceToTarget;
    const above = opp.y < this.player.y - 30;
    const below = opp.y > this.player.y + 30;
    const inRange = dist < 100 && Math.abs(this.player.y - opp.y) < 60;
    const vulnerable = !opp.isAttacking && !opp.isShielding;
    const onEdge = opp.y > this.platform.y + 60 || opp.x < this.platform.x - 40 || opp.x > this.platform.x + this.platform.width + 40;
    const canCombo = Math.random() < this.comboChance;
    const canHeavy = Math.random() < this.heavyChance;
    const canCharge = Math.random() < this.chargeChance;
    const oppHighPercent = opp.damage > 100;
    // --- Edgeguard safety check ---
    const canRecover = this.player.jumpsRemaining > 0 || (!this.player.isGrounded && !this.player.isAttacking && this.player.heavyAttackCooldown === 0);
    // --- Character-specific logic ---
    if (char === 'Kaon') {
      // If opponent is at high percent, always prefer kill moves
      if (oppHighPercent && !this.player.isAttacking) {
        if (canHeavy && Math.random() < 0.5) this.player.attack('side', 'heavy');
        else if (canHeavy) this.player.attack('up', 'heavy');
        else this.player.attack('neutral', 'heavy');
        return;
      }
      if (dist > 120 && canHeavy) {
        // Use Core Beam or Big Bang Attack at range
        if (!this.player.isAttacking && !this.isCharging) {
          if (Math.random() < 0.5) this.player.attack('neutral', 'heavy');
          else this.player.attack('side', 'heavy');
        }
        return;
      }
      if (above && !this.player.isAttacking) {
        // Anti-air
        if (canCombo) this.player.attack('up', 'light');
        else if (canHeavy) this.player.attack('up', 'heavy');
        return;
      }
      if (below && !this.player.isAttacking && canHeavy) {
        // Spike
        this.player.attack('down', 'heavy');
        return;
      }
      if (inRange && !this.player.isAttacking) {
        // Combo or light attack
        if (canCombo) {
          this.player.attack('neutral', 'light');
          setTimeout(() => this.player.attack('side', 'light'), 30);
        } else {
          this.player.attack('neutral', 'light');
        }
        return;
      }
      // Prefer high knockback moves if opponent is at high damage or near edge
      if ((opp.damage > 80 || onEdge) && canHeavy && !this.player.isAttacking) {
        this.player.attack('side', 'heavy');
        return;
      }
    } else if (char === 'Rakka') {
      // If opponent is at high percent, always prefer kill moves
      if (oppHighPercent && !this.player.isAttacking) {
        if (canHeavy && Math.random() < 0.5) this.player.attack('side', 'heavy');
        else if (canHeavy) this.player.attack('up', 'heavy');
        else this.player.attack('down', 'heavy');
        return;
      }
      if (dist > 120 && canCharge && !this.player.isAttacking && !this.isCharging) {
        // Charge Demon Fang or use Shadow Sneak
        if (Math.random() < 0.5) {
          this.player.startCharge();
          this.isCharging = true;
          this.chargeTimer = 10;
        } else {
          this.player.attack('side', 'heavy');
        }
        return;
      }
      // Only edgeguard if at low damage and can recover
      if (onEdge && this.player.isGrounded && canHeavy && this.player.damage < 60 && canRecover) {
        // Edgeguard with down heavy
        this.player.attack('down', 'heavy');
        return;
      }
      // If edgeguarding is too risky, stay on stage and control center
      if (onEdge && (!canRecover || this.player.damage >= 60)) {
        // Move toward center instead of attacking
        const platformCenter = this.platform.x + this.platform.width / 2;
        const dirToCenter = platformCenter > this.player.x ? 1 : -1;
        this.player.move(dirToCenter);
        return;
      }
      if (above && !this.player.isAttacking) {
        // Anti-air
        if (canCombo) this.player.attack('up', 'light');
        else if (canHeavy) this.player.attack('up', 'heavy');
        return;
      }
      if (below && !this.player.isAttacking && canHeavy) {
        // Spike
        this.player.attack('down', 'light');
        return;
      }
      if (inRange && !this.player.isAttacking) {
        // Jab combo
        if (canCombo) {
          this.player.attack('neutral', 'light');
          setTimeout(() => this.player.attack('neutral', 'light'), 30);
          setTimeout(() => this.player.attack('neutral', 'heavy'), 60);
        } else {
          this.player.attack('neutral', 'light');
        }
        return;
      }
      // Prefer high knockback moves if opponent is at high damage or near edge
      if ((opp.damage > 80 || onEdge) && canHeavy && !this.player.isAttacking) {
        this.player.attack('side', 'heavy');
        return;
      }
    }
    // Fallback: default attack
    if (!this.player.isAttacking && !this.isCharging) {
      this.player.attack('neutral', 'light');
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

  executeDodge() {
    // Placeholder: jump as a "dodge"
    if (this.player.isGrounded) {
      this.player.jump();
    }
  }

  executeRecover() {
    // Overhauled recovery logic for full recovery and edge snapping
    const platformLeft = this.platform.x;
    const platformRight = this.platform.x + this.platform.width;
    const platformY = this.platform.y;
    const cpuCenterX = this.player.x + this.player.width / 2;
    const cpuBottomY = this.player.y + this.player.height;
    // Find the closest safe x-position on the platform
    let targetX = Math.max(platformLeft + 10, Math.min(cpuCenterX, platformRight - 10));
    // If below the platform, aim for the nearest edge
    if (cpuBottomY > platformY + 10) {
      if (cpuCenterX < platformLeft) targetX = platformLeft + 12;
      else if (cpuCenterX > platformRight) targetX = platformRight - 12;
    }
    // If under the stage, prioritize moving horizontally to get out from under
    const underStage = cpuBottomY > platformY + 10 && cpuCenterX > platformLeft && cpuCenterX < platformRight;
    let direction = 0;
    if (Math.abs(cpuCenterX - targetX) > 6) {
      direction = cpuCenterX < targetX ? 1 : -1;
    }
    // Edge snap: if close to the edge, stop moving horizontally
    if ((Math.abs(cpuCenterX - platformLeft) < 10 && cpuBottomY > platformY - 30) ||
        (Math.abs(cpuCenterX - platformRight) < 10 && cpuBottomY > platformY - 30)) {
      direction = 0;
      // Snap to edge
      if (cpuCenterX < platformLeft) this.player.x = platformLeft - this.player.width / 2 + 1;
      if (cpuCenterX > platformRight) this.player.x = platformRight - this.player.width / 2 - 1;
    }
    // Only use a jump if falling and below the platform, and space out jumps
    const belowStage = cpuBottomY > platformY + 10;
    const isFalling = this.player.vy > 0.5;
    if (this.player.jumpsRemaining > 0 && belowStage && isFalling && this.recoveryJumpTimer <= 0) {
      this.player.jump();
      this.recoveryJumpTimer = 18 + Math.floor(Math.random() * 8); // Wait ~18-26 frames before next jump
    }
    if (this.recoveryJumpTimer > 0) {
      this.recoveryJumpTimer--;
    }
    // Only use up heavy for recovery if jumps are exhausted or if far below the platform
    if ((this.player.jumpsRemaining === 0 || (this.player.y > platformY + 60 && Math.abs(cpuCenterX - targetX) < this.platform.width / 2))
      && !this.player.isGrounded && !this.player.isAttacking && this.player.heavyAttackCooldown === 0) {
      this.player.attack('up', 'heavy');
    }
    // Move horizontally toward the target
    this.player.move(direction);
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