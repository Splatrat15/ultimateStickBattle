// CPU AI module for computer-controlled players
// --- FSM States ---
const CPU_STATES = {
  IDLE: 'idle',
  APPROACH: 'approach',
  ATTACK: 'attack',
  BLOCK: 'block',
  DODGE: 'dodge',
  RECOVER: 'recover',
  EDGEGUARD: 'edgeguard', // New state for edgeguarding
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
    this.chargeTime = 0; // Track how long we've been charging
    this.recoveryJumpTimer = 0; // Timer to space out jumps during recovery
    this.edgeguardTimer = 0; // Timer for edgeguarding behavior
    this.killMoveCooldown = 0; // Cooldown to prevent spam of kill moves
  }

  setDifficultyParams(difficulty) {
    switch (difficulty) {
      case 'EASY':
        this.reactionMin = 30; // slow
        this.reactionMax = 60;
        this.attackAccuracy = 0.7; // Increased from 0.5
        this.shieldChance = 0.05; // Reduced from 0.1 - less defensive
        this.comboChance = 0.3; // Increased from 0.1
        this.heavyChance = 0.6; // Increased from 0.2
        this.chargeChance = 0.3; // Increased from 0.1
        this.killMoveThreshold = 80; // Lowered from 120
        this.aggressionMultiplier = 1.2; // New: makes CPU more aggressive
        break;
      case 'MEDIUM':
        this.reactionMin = 15;
        this.reactionMax = 30;
        this.attackAccuracy = 0.9; // Increased from 0.8
        this.shieldChance = 0.15; // Reduced from 0.3 - less defensive
        this.comboChance = 0.7; // Increased from 0.5
        this.heavyChance = 0.8; // Increased from 0.6
        this.chargeChance = 0.7; // Increased from 0.5
        this.killMoveThreshold = 60; // Lowered from 80
        this.aggressionMultiplier = 1.5;
        break;
      case 'HARD':
        this.reactionMin = 5;
        this.reactionMax = 15;
        this.attackAccuracy = 0.99; // Increased from 0.97
        this.shieldChance = 0.25; // Reduced from 0.6 - less defensive
        this.comboChance = 0.9; // Increased from 0.8
        this.heavyChance = 0.95; // Increased from 0.85
        this.chargeChance = 0.9; // Increased from 0.8
        this.killMoveThreshold = 40; // Lowered from 60
        this.aggressionMultiplier = 2.0;
        break;
      case 'EXPERT':
        this.reactionMin = 1;
        this.reactionMax = 3;
        this.attackAccuracy = 1.0;
        this.shieldChance = 0.3; // Reduced from 0.98 - much less defensive
        this.comboChance = 1.0;
        this.heavyChance = 1.0;
        this.chargeChance = 1.0;
        this.killMoveThreshold = 25; // Lowered from 40
        this.aggressionMultiplier = 3.0;
        break;
      default:
        this.reactionMin = 15;
        this.reactionMax = 30;
        this.attackAccuracy = 0.9;
        this.shieldChance = 0.15;
        this.comboChance = 0.7;
        this.heavyChance = 0.8;
        this.chargeChance = 0.7;
        this.killMoveThreshold = 60;
        this.aggressionMultiplier = 1.5;
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
          this.chargeTime = 0; // Reset charge time
        }
      }
      
      // Update charge time when charging
      if (this.isCharging) {
        this.chargeTime++;
      } else {
        this.chargeTime = 0; // Reset when not charging
      }
      
      // Special handling for Demon Fang charging - release for movement and positioning
      if (this.isCharging && this.player.characterName === 'Rakka' && 
          this.player.activeMove && this.player.activeMove.name === 'Demon Fang') {
        
        // Release conditions for Demon Fang:
        // 1. Charged enough for good damage (15+ frames)
        // 2. Opponent is in good position for the dash
        // 3. We need to move to a better position
        const chargeTime = this.chargeTime || 0;
        const centerX = this.platform.x + this.platform.width / 2;
        const distanceFromCenter = Math.abs(this.player.x - centerX);
        const isNearCenter = distanceFromCenter < 100;
        
        // Check if opponent is in good position for Demon Fang
        const opponentInRange = this.distanceToTarget < 200 && this.distanceToTarget > 50;
        const opponentInDashPath = Math.abs(this.player.y - this.otherPlayer.y) < 30;
        
        // Release for damage if opponent is in good position
        const goodTarget = opponentInRange && opponentInDashPath && chargeTime > 15;
        
        // Release for movement if we're not in center and have enough charge
        const needMovement = !isNearCenter && chargeTime > 10;
        
        // Emergency release if charging too long
        const emergencyRelease = chargeTime > 50;
        
        if (goodTarget || needMovement || emergencyRelease) {
          this.player.releaseCharge();
          this.isCharging = false;
          this.chargeTimer = 0;
          this.chargeTime = 0;
        }
      }
      
      // Special handling for Shadow Sneak charging - release early if shadow is in good position
      if (this.isCharging && this.player.characterName === 'Rakka' && 
          this.player.activeMove && this.player.activeMove.name === 'Shadow Sneak') {
        
        // Check if shadow is in a good position to release
        if (this.player.shadowSneak && this.player.shadowSneak.active) {
          const shadowX = this.player.shadowSneak.x;
          const platformLeft = this.platform.x + 30;
          const platformRight = this.platform.x + this.platform.width - 30;
          
          // Check if opponent is near the shadow position (good target)
          const shadowToOpponent = Math.abs(shadowX - this.otherPlayer.x);
          const opponentNearShadow = shadowToOpponent < 80;
          
          // Check if shadow is on stage
          const shadowOnStage = shadowX >= platformLeft && shadowX <= platformRight;
          
          // Release conditions:
          // 1. Shadow is on stage AND opponent is near shadow (ideal)
          // 2. Shadow is on stage AND we've charged enough (safe)
          // 3. Emergency: shadow is going off-screen
          const idealRelease = shadowOnStage && opponentNearShadow && this.chargeTime > 10;
          const safeRelease = shadowOnStage && this.chargeTime > 20;
          const emergencyRelease = !shadowOnStage || this.chargeTime > 45;
          
          if (idealRelease || safeRelease || emergencyRelease) {
            this.player.releaseCharge();
            this.isCharging = false;
            this.chargeTimer = 0;
            this.chargeTime = 0;
          }
        }
        
        // Emergency release if charging too long
        if (this.chargeTime > 60) {
          this.player.releaseCharge();
          this.isCharging = false;
          this.chargeTimer = 0;
          this.chargeTime = 0;
        }
      }
      
      if (this.edgeguardTimer > 0) {
        this.edgeguardTimer--;
      }
      if (this.killMoveCooldown > 0) {
        this.killMoveCooldown--;
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
    const oppHighPercent = this.otherPlayer.damage > this.killMoveThreshold;
    const selfHighPercent = this.player.damage > 120;
    
    // New edgeguarding logic
    const opponentOffstage = this.otherPlayer.y > this.platform.y + 60 || 
                            this.otherPlayer.x < this.platform.x - 40 || 
                            this.otherPlayer.x > this.platform.x + this.platform.width + 40;
    const canEdgeguard = opponentOffstage && this.player.damage < 80 && 
                        (this.player.jumpsRemaining > 0 || this.player.isGrounded) &&
                        this.killMoveCooldown === 0;
    
    // --- EXPERT: Frame-perfect, always optimal ---
    if (this.difficulty === 'EXPERT') {
      // Always recover if offstage
      if (shouldRecover) {
        this.changeState(CPU_STATES.RECOVER);
        return;
      }
      // Always edgeguard if opponent is offstage and we can safely do so
      if (canEdgeguard) {
        this.changeState(CPU_STATES.EDGEGUARD);
        return;
      }
      // Only block if absolutely necessary (very low chance)
      if (shouldBlock && !this.player.isShielding && Math.random() < 0.1) {
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
    
    // State transitions for other difficulties - MUCH MORE AGGRESSIVE
    switch (this.state) {
      case CPU_STATES.IDLE:
        if (shouldRecover) {
          this.changeState(CPU_STATES.RECOVER);
        } else if (canEdgeguard && Math.random() < 0.9) { // Increased from 0.8
          this.changeState(CPU_STATES.EDGEGUARD);
        } else if (shouldBlock && Math.random() < this.shieldChance * 0.3) { // Much less likely to shield
          this.changeState(CPU_STATES.BLOCK);
        } else if (shouldDodge && Math.random() < 0.8) { // Increased from 0.7
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
        } else if (canEdgeguard && Math.random() < 0.8) { // Increased from 0.6
          this.changeState(CPU_STATES.EDGEGUARD);
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
        // Exit block state much faster - don't stay defensive
        if (!shouldBlock || Math.random() < 0.3) {
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
      case CPU_STATES.EDGEGUARD:
        if (!opponentOffstage || this.player.damage >= 80 || this.killMoveCooldown > 0) {
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
      case CPU_STATES.EDGEGUARD:
        this.executeEdgeguard();
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
    
    // Define optimal spacing based on character and situation
    let optimalDistance = 80; // Default optimal distance
    
    // Adjust optimal distance based on character
    if (char === 'Kaon') {
      optimalDistance = 90; // Kaon prefers more range for Core Beam
    } else if (char === 'Rakka') {
      optimalDistance = 70; // Rakka prefers closer range for sword attacks
    }
    
    // Adjust optimal distance based on opponent's state
    if (opp.isAttacking) {
      optimalDistance += 30; // Stay further away when opponent is attacking
    }
    if (this.player.damage > 80) {
      optimalDistance += 20; // Stay further away when at high damage
    }
    if (opp.damage > 80) {
      optimalDistance -= 15; // Get closer when opponent is at high damage (for kills)
    }
    
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
    
    // MAIN POSITIONING LOGIC - Maintain optimal distance
    const distanceDiff = dist - optimalDistance;
    const tolerance = 15; // Acceptable range around optimal distance
    
    if (Math.abs(distanceDiff) <= tolerance) {
      // At optimal distance - hold position or make small adjustments
      this.player.move(0);
      
      // Occasionally make small spacing adjustments
      if (Math.random() < 0.1) {
        if (distanceDiff > 0) {
          this.player.move(1); // Move slightly closer
        } else {
          this.player.move(-1); // Move slightly away
        }
      }
    } else if (distanceDiff > tolerance) {
      // Too far away - approach
      if (this.player.x < opp.x - 5) {
        this.player.move(1);
      } else if (this.player.x > opp.x + 5) {
        this.player.move(-1);
      }
    } else {
      // Too close - back away
      if (this.player.x < opp.x) {
        this.player.move(-1); // Move left to get away
      } else {
        this.player.move(1); // Move right to get away
      }
    }
    
    // Character-specific movement adjustments
    if (char === 'Rakka' && dist > optimalDistance + 20 && Math.random() < 0.08 * (this.difficulty === 'EXPERT' ? 2 : 1)) {
      this.tryJump(); // Rakka sometimes approaches with jumps
    }
    if (char === 'Kaon' && dist > optimalDistance + 30 && Math.random() < 0.05 * (this.difficulty === 'EXPERT' ? 2 : 1)) {
      this.tryJump(); // Kaon sometimes approaches with jumps
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
    const oppHighPercent = opp.damage > this.killMoveThreshold;
    const nearEdge = opp.x < this.platform.x + 80 || opp.x > this.platform.x + this.platform.width - 80;
    
    // AGGRESSIVE ATTACK LOGIC - Prioritize heavy attacks and kill moves
    
    // --- Character-specific logic ---
    if (char === 'Kaon') {
      // PRIORITY 1: KILL MOVES - Use immediately when opponent is at kill percent
      if (oppHighPercent && !this.player.isAttacking && this.killMoveCooldown === 0) {
        this.killMoveCooldown = 30; // Shorter cooldown for more aggression
        // Always use the best kill move for the situation
        if (nearEdge || onEdge) {
          this.player.attack('side', 'heavy'); // Big Bang Attack - strongest kill move
        } else if (above) {
          this.player.attack('up', 'light'); // Use up light for anti-air, not up heavy
        } else {
          this.player.attack('side', 'heavy'); // Big Bang Attack - most reliable
        }
        return;
      }
      
      // PRIORITY 2: HEAVY ATTACKS - Use heavy attacks much more frequently
      if (canHeavy && !this.player.isAttacking && this.killMoveCooldown === 0) {
        this.killMoveCooldown = 20; // Short cooldown
        if (dist > 100) {
          this.player.attack('neutral', 'heavy'); // Core Beam at range
        } else if (above) {
          this.player.attack('up', 'light'); // Use up light for anti-air, not up heavy
        } else if (below) {
          this.player.attack('down', 'heavy'); // Dual Blast spike
        } else if (nearEdge) {
          this.player.attack('side', 'heavy'); // Big Bang Attack for edge pressure
        } else {
          this.player.attack('side', 'heavy'); // Big Bang Attack - best general heavy
        }
        return;
      }
      
      // PRIORITY 3: RANGE ATTACKS - Use heavy attacks at range
      if (dist > 120 && !this.player.isAttacking && !this.isCharging) {
        if (Math.random() < 0.8) { // High chance to use heavy
          this.player.attack('neutral', 'heavy'); // Core Beam
        } else {
          this.player.attack('side', 'heavy'); // Big Bang Attack
        }
        return;
      }
      
      // PRIORITY 4: ANTI-AIR - Use light attacks for anti-air (up heavy is recovery)
      if (above && !this.player.isAttacking) {
        this.player.attack('up', 'light'); // Use up light for anti-air, up heavy is recovery
        return;
      }
      
      // PRIORITY 5: SPIKE - Always use heavy for spike
      if (below && !this.player.isAttacking) {
        this.player.attack('down', 'heavy'); // Dual Blast
        return;
      }
      
      // PRIORITY 6: RECOVERY - Use up heavy for recovery when needed
      if (!this.player.isAttacking && !this.player.isGrounded && this.player.jumpsRemaining === 0) {
        // Use up heavy for recovery when out of jumps
        this.player.attack('up', 'heavy'); // Gravity Spike for recovery
        return;
      }
      
      // PRIORITY 7: CLOSE RANGE - Mix of light and heavy
      if (inRange && !this.player.isAttacking) {
        if (Math.random() < 0.6) { // 60% chance for heavy even at close range
          this.player.attack('side', 'heavy'); // Big Bang Attack
        } else if (canCombo) {
          this.player.attack('neutral', 'light');
          setTimeout(() => this.player.attack('side', 'light'), 20);
        } else {
          this.player.attack('neutral', 'light');
        }
        return;
      }
      
    } else if (char === 'Rakka') {
      // PRIORITY 1: KILL MOVES - Use immediately when opponent is at kill percent
      if (oppHighPercent && !this.player.isAttacking && this.killMoveCooldown === 0) {
        this.killMoveCooldown = 30;
        // Always use the best kill move for the situation
        if (nearEdge || onEdge) {
          // For edge kills, prefer Void Splitter over Shadow Sneak (safer)
          this.player.attack('down', 'heavy'); // Void Splitter - safer edge kill
        } else if (above) {
          this.player.attack('up', 'heavy'); // Phantom Slash - aerial kill
        } else {
          this.player.attack('down', 'heavy'); // Void Splitter - strong kill
        }
        return;
      }
      
      // PRIORITY 2: HEAVY ATTACKS - Use heavy attacks much more frequently
      if (canHeavy && !this.player.isAttacking && this.killMoveCooldown === 0) {
        this.killMoveCooldown = 20;
        if (dist > 100) {
          // For range attacks, prefer Demon Fang charging over Shadow Sneak
          this.player.startCharge(); // Charge Demon Fang
          this.isCharging = true;
          this.chargeTimer = 15 + Math.floor(Math.random() * 10); // Charge for 15-25 frames
        } else if (above) {
          this.player.attack('up', 'heavy'); // Phantom Slash anti-air
        } else if (below) {
          this.player.attack('down', 'heavy'); // Void Splitter spike
        } else if (nearEdge) {
          // For edge pressure, use Void Splitter (safer than Shadow Sneak)
          this.player.attack('down', 'heavy'); // Void Splitter for edge pressure
        } else {
          // For general heavy attacks, prefer Void Splitter
          this.player.attack('down', 'heavy'); // Void Splitter - more reliable
        }
        return;
      }
      
      // PRIORITY 3: RANGE ATTACKS - Use chargeable moves
      if (dist > 120 && !this.player.isAttacking && !this.isCharging) {
        // Mix between Demon Fang charging and Shadow Sneak for movement
        if (Math.random() < 0.7) { // 70% chance for Demon Fang
          this.player.startCharge(); // Charge Demon Fang
          this.isCharging = true;
          this.chargeTimer = 15 + Math.floor(Math.random() * 15); // Charge for 15-30 frames
        } else {
          // Use Shadow Sneak for movement/positioning
          const shadowDistance = Math.min(150, dist - 30); // Don't go past opponent
          const shadowEndX = this.player.x + (shadowDistance * this.player.facing);
          const platformLeft = this.platform.x + 30;
          const platformRight = this.platform.x + this.platform.width - 30;
          
          // Use Shadow Sneak if it's safe and gives good positioning
          if (shadowEndX >= platformLeft && shadowEndX <= platformRight) {
            this.player.attack('side', 'heavy'); // Shadow Sneak for movement
          } else {
            // Fallback to Demon Fang if Shadow Sneak isn't safe
            this.player.startCharge();
            this.isCharging = true;
            this.chargeTimer = 15 + Math.floor(Math.random() * 15);
          }
        }
        return;
      }
      
      // PRIORITY 4: ANTI-AIR - Use heavy attacks for anti-air
      if (above && !this.player.isAttacking) {
        if (opp.damage > 30 || Math.random() < 0.8) { // Use heavy more often
          this.player.attack('up', 'heavy'); // Phantom Slash
        } else {
          this.player.attack('up', 'light');
        }
        return;
      }
      
      // PRIORITY 5: SPIKE - Use heavy for spike
      if (below && !this.player.isAttacking) {
        if (opp.damage > 20 || Math.random() < 0.7) { // Use heavy more often
          this.player.attack('down', 'heavy'); // Void Splitter
        } else {
          this.player.attack('down', 'light'); // Ground Poke
        }
        return;
      }
      
      // PRIORITY 6: CLOSE RANGE - Mix of light and heavy
      if (inRange && !this.player.isAttacking) {
        if (Math.random() < 0.4) { // Reduced chance for heavy at close range
          // Prefer Void Splitter over Shadow Sneak at close range
          this.player.attack('down', 'heavy'); // Void Splitter - more reliable
        } else if (canCombo) {
          this.player.attack('neutral', 'light'); // Start jab combo
          setTimeout(() => this.player.attack('neutral', 'light'), 20);
          setTimeout(() => this.player.attack('neutral', 'light'), 40);
        } else {
          this.player.attack('neutral', 'light');
        }
        return;
      }
      
      // MOVEMENT PRIORITY: Use Shadow Sneak and Demon Fang for positioning
      if (!this.player.isAttacking && !this.isCharging && this.killMoveCooldown === 0) {
        const centerX = this.platform.x + this.platform.width / 2;
        const distanceFromCenter = Math.abs(this.player.x - centerX);
        const isNearCenter = distanceFromCenter < 150; // Within 150px of center
        const hasJumps = this.player.jumpsRemaining > 0; // Has recovery options
        
        // Use Shadow Sneak for movement when in good position
        if (isNearCenter && hasJumps && Math.random() < 0.15) { // 15% chance for movement
          // Calculate movement distance based on positioning
          let shadowDistance;
          if (this.player.facing > 0 && this.player.x < centerX) {
            // Facing right but on left side - move toward center
            shadowDistance = Math.min(100, centerX - this.player.x + 50);
          } else if (this.player.facing < 0 && this.player.x > centerX) {
            // Facing left but on right side - move toward center
            shadowDistance = Math.min(100, this.player.x - centerX + 50);
          } else {
            // Move toward opponent for surprise attack
            shadowDistance = Math.min(120, dist - 20);
          }
          
          const shadowEndX = this.player.x + (shadowDistance * this.player.facing);
          const platformLeft = this.platform.x + 40;
          const platformRight = this.platform.x + this.platform.width - 40;
          
          // Use Shadow Sneak if it's safe and gives good positioning
          if (shadowEndX >= platformLeft && shadowEndX <= platformRight) {
            this.player.attack('side', 'heavy'); // Shadow Sneak for movement
            this.killMoveCooldown = 45; // Shorter cooldown for movement
          }
        }
        
        // Use Demon Fang for movement and surprise attacks
        if (Math.random() < 0.12) { // 12% chance for Demon Fang movement
          this.player.startCharge(); // Charge Demon Fang
          this.isCharging = true;
          this.chargeTimer = 10 + Math.floor(Math.random() * 20); // Variable charge time
        }
      }
    }
    
    // FALLBACK: If nothing else works, use heavy attack
    if (!this.player.isAttacking && !this.isCharging) {
      if (Math.random() < 0.7) { // 70% chance for heavy even as fallback
        this.player.attack('side', 'heavy');
      } else {
        this.player.attack('neutral', 'light');
      }
    }
  }

  executeEdgeguard() {
    const char = this.player.characterName;
    const opp = this.otherPlayer;
    const dist = this.distanceToTarget;
    const above = opp.y < this.player.y - 30;
    const below = opp.y > this.player.y + 30;
    const inRange = dist < 120 && Math.abs(this.player.y - opp.y) < 80;
    
    // Stay near the edge but not too close
    const edgeBuffer = 40;
    if (this.player.x < this.platform.x + edgeBuffer) {
      this.player.move(1);
    } else if (this.player.x > this.platform.x + this.platform.width - edgeBuffer) {
      this.player.move(-1);
    } else {
      this.player.move(0);
    }
    
    // Attack if opponent is in range
    if (inRange && !this.player.isAttacking && this.killMoveCooldown === 0) {
      this.killMoveCooldown = 30;
      
      if (char === 'Kaon') {
        if (above) {
          this.player.attack('up', 'light'); // Use up light for anti-air, not up heavy
        } else if (below) {
          this.player.attack('down', 'heavy'); // Dual Blast spike
        } else {
          this.player.attack('side', 'heavy'); // Big Bang Attack
        }
      } else if (char === 'Rakka') {
        if (above) {
          this.player.attack('up', 'heavy'); // Phantom Slash anti-air
        } else if (below) {
          this.player.attack('down', 'heavy'); // Void Splitter spike
        } else {
          // For horizontal edgeguarding, prefer Void Splitter over Shadow Sneak
          // Shadow Sneak can be risky when edgeguarding
          this.player.attack('down', 'heavy'); // Void Splitter - safer edgeguard
        }
      }
    }
    
    // Occasionally jump for better positioning
    if (Math.random() < 0.02 && this.player.jumpsRemaining > 0) {
      this.tryJump();
    }
  }

  executeShield() {
    try {
      // Much less likely to shield - be aggressive instead
      if (Math.random() < this.shieldChance * 0.2) { // Reduced shield chance by 80%
        this.player.activateShield();
        this.shieldTimer = Math.floor(Math.random() * 10) + 5; // Much shorter shield duration
      } else {
        // Instead of shielding, try to attack or dodge
        if (Math.random() < 0.7) {
          // Try to attack instead of shield
          this.executeAttack();
        } else {
          // Try to dodge instead of shield
          this.executeDodge();
        }
      }
    } catch (error) {
      console.error('CPU executeShield error:', error);
    }
  }

  executeDodge() {
    // More aggressive dodge - jump and attack
    if (this.player.isGrounded) {
      this.player.jump();
      // After dodge, immediately try to attack
      setTimeout(() => {
        if (!this.player.isAttacking && !this.isCharging) {
          this.executeAttack();
        }
      }, 10);
    }
  }

  executeRecover() {
    // Overhauled recovery logic for full recovery and edge snapping
    const platformLeft = this.platform.x;
    const platformRight = this.platform.x + this.platform.width;
    const platformY = this.platform.y;
    const cpuCenterX = this.player.x + this.player.width / 2;
    const cpuBottomY = this.player.y + this.player.height;
    
    // Check if we're off stage
    const isOffStage = this.player.x < platformLeft - 50 || 
                      this.player.x > platformRight + 50 || 
                      this.player.y > platformY + 100;
    
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
    
    // Enhanced recovery for off-stage situations
    if (isOffStage) {
      // Use jumps more aggressively when off stage
      const belowStage = cpuBottomY > platformY + 10;
      const isFalling = this.player.vy > 0.5;
      const farFromStage = Math.abs(cpuCenterX - (platformLeft + platformRight) / 2) > 200;
      
      // Use jumps immediately if we have them and are falling
      if (this.player.jumpsRemaining > 0 && (belowStage || farFromStage) && this.recoveryJumpTimer <= 0) {
        this.player.jump();
        this.recoveryJumpTimer = 15 + Math.floor(Math.random() * 5); // Shorter delay when off stage
      }
      
      // Use up heavy for recovery if jumps are exhausted or if very far from stage
      if ((this.player.jumpsRemaining === 0 || farFromStage) && 
          !this.player.isGrounded && 
          !this.player.isAttacking && 
          this.player.heavyAttackCooldown === 0) {
        this.player.attack('up', 'heavy');
      }
      
      // Move more aggressively toward the stage when off stage
      const stageCenter = (platformLeft + platformRight) / 2;
      if (cpuCenterX < stageCenter) {
        this.player.move(1); // Move right toward stage
      } else {
        this.player.move(-1); // Move left toward stage
      }
    } else {
      // Normal recovery logic when not far off stage
      // Only use a jump if falling and below the platform, and space out jumps
      const belowStage = cpuBottomY > platformY + 10;
      const isFalling = this.player.vy > 0.5;
      if (this.player.jumpsRemaining > 0 && belowStage && isFalling && this.recoveryJumpTimer <= 0) {
        this.player.jump();
        this.recoveryJumpTimer = 18 + Math.floor(Math.random() * 8); // Wait ~18-26 frames before next jump
      }
      // Only use up heavy for recovery if jumps are exhausted or if far below the platform
      if ((this.player.jumpsRemaining === 0 || (this.player.y > platformY + 60 && Math.abs(cpuCenterX - targetX) < this.platform.width / 2))
        && !this.player.isGrounded && !this.player.isAttacking && this.player.heavyAttackCooldown === 0) {
        this.player.attack('up', 'heavy');
      }
      // Move horizontally toward the target
      this.player.move(direction);
    }
    
    if (this.recoveryJumpTimer > 0) {
      this.recoveryJumpTimer--;
    }
  }

  // Emergency actions for survival - but still aggressive
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
      // Much less likely to shield in emergencies - be aggressive instead
      if (this.player.damage > 70 && Math.random() < this.shieldChance * 0.1) { // Reduced by 90%
        if (!this.player.isShielding && this.shieldTimer === 0) {
          this.player.activateShield();
          this.shieldTimer = 15; // Shorter shield
        }
      } else if (this.player.damage > 70) {
        // Instead of shielding, try to attack aggressively
        if (!this.player.isAttacking && !this.isCharging && this.distanceToTarget < 120) {
          this.executeAttack();
        }
      }
      // Very unlikely to shield when opponent attacks - dodge or attack instead
      if (this.otherPlayer.isAttacking && this.distanceToTarget < 80 && Math.random() < this.shieldChance * 0.05) { // Reduced by 95%
        this.player.activateShield();
        this.shieldTimer = 10; // Very short shield
      } else if (this.otherPlayer.isAttacking && this.distanceToTarget < 80) {
        // Instead of shielding, try to dodge or attack
        if (Math.random() < 0.6) {
          this.executeDodge();
        } else if (!this.player.isAttacking && !this.isCharging) {
          this.executeAttack();
        }
      }
    } catch (error) {
      console.error('CPU handleEmergency error:', error);
    }
  }
}