export const rakkaMoveset = {
  // Light Attacks
  neutralLight: {
    name: 'Quick Draw',
    type: 'light',
    damage: 2, // Each hit, 3 hits rapid
    knockback: 1.2,
    duration: 18, // Fast
    cooldown: 16,
    multiHit: 3,
    hitbox: { width: 38, height: 18, offsetX: 60, offsetY: 10 },
    description: 'Rapid 3-hit katana slash with anime-style afterimages.'
  },
  sideLight: {
    name: 'Shadow Slice',
    type: 'light',
    damage: 4,
    knockback: 2.5,
    duration: 35, // Increased from 22 to 35 for longer dash
    cooldown: 24,
    useSwordHitbox: true, // Flag to use dynamic sword hitbox instead of static hitbox
    hitbox: { width: 48, height: 20, offsetX: 70, offsetY: 12 }, // This will be overridden by sword hitbox
    description: 'Lunging cut, leaves a shadow trail.'
  },
  upLight: {
    name: 'Rising Cut',
    type: 'light',
    damage: 3.5,
    knockback: 3.5,
    verticalKnockback: true,
    duration: 30, // Increased from 20 to 30 for longer diagonal slash
    cooldown: 22,
    useSwordHitbox: true, // Flag to use dynamic sword hitbox instead of static hitbox
    hitbox: { width: 32, height: 48, offsetX: 18, offsetY: -38 }, // This will be overridden by sword hitbox
    description: 'Diagonal anti-air slash, sword glows red.'
  },
  downLight: {
    name: 'Ground Poke',
    type: 'light',
    damage: 2.5,
    knockback: 1.8,
    duration: 28,
    cooldown: 26,
    useSwordHitbox: true, // Flag to use dynamic sword hitbox instead of static hitbox
    hitbox: { width: 60, height: 18, offsetX: 10, offsetY: 38 }, // This will be overridden by sword hitbox
    // Ground version: sword poke near the ground
    groundSwing: {
      startAngle: Math.PI / 6, // 30 degrees down and forward
      endAngle: Math.PI / 3, // 60 degrees down and forward
      description: 'Low sword poke near the ground, shadowy effect.'
    },
    // Aerial version: downward sword slash
    aerialSwing: {
      startAngle: -Math.PI / 6, // 30 degrees up and forward
      endAngle: Math.PI / 2, // 90 degrees straight down
      spikeKnockback: true, // Send opponent down
      description: 'Downward sword slash that sends opponents down.'
    },
    description: 'Ground poke when grounded, downward slash when aerial.'
  },
  // Heavy Attacks
  neutralHeavy: {
    name: 'Demon Fang',
    type: 'heavy',
    damage: 10,
    knockback: 7,
    duration: 45, // Increased to account for charge animation
    cooldown: 70,
    hitbox: { 
      width: 90, 
      height: 18, 
      offsetX: 80, 
      offsetY: 0 
    },
    description: 'Takes a low stance and charges up dark energy before unleashing a devastating forward thrust.'
  },
  sideHeavy: {
    name: 'Shadow Sneak',
    type: 'heavy',
    damage: 12,
    knockback: 8,
    duration: 28,
    cooldown: 80,
    blink: true,
    chargeable: true,
    chargeScaling: {
      distance: 2.0 // Distance multiplier at max charge
    },
    shadow: {
      speed: 6,
      maxDistance: 400, // Maximum distance the shadow can travel
      width: 30,
      height: 40
    },
    hitbox: { width: 70, height: 22, offsetX: 120, offsetY: 8 },
    description: 'Send a shadow forward while charging, then teleport to its position and slash through enemies on release.'
  },
  upHeavy: {
    name: 'Phantom Slash',
    type: 'heavy',
    damage: 3, // Per hit, 4 hits total = 12 damage
    knockback: 2, // Per hit, final hit has stronger knockback
    multiHit: 4, // 4 hits total
    verticalKnockback: true,
    duration: 54, // Increased from 42 to 54 frames for longer attack
    cooldown: 75,
    selfLaunch: true, // Launches Rakka upward
    selfLaunchForce: 16, // Increased from 12 to 16 for higher launch
    finalHitKnockback: 8, // Strong knockback on the final hit
    finalHitDamage: 4, // Extra damage on final hit
    hitbox: { width: 36, height: 70, offsetX: 18, offsetY: -60 },
    shadowWings: {
      active: true,
      duration: 54,
      wingSpan: 80,
      wingHeight: 40
    },
    circlingBlade: {
      active: true,
      radius: 45,
      swingSpeed: 0.2, // Speed of horizontal swing (radians per frame)
      swingRange: Math.PI / 2, // Range of swing (90 degrees each way)
      bladeCount: 3, // Number of blade afterimages
      bladeDamage: 2, // Damage per blade hit
      bladeKnockback: 1.5
    },
    description: 'Shadow wings propel Rakka upward while his blade swings horizontally around his waist, creating a devastating multi-hit aerial assault.'
  },
  downHeavy: {
    name: 'Void Splitter',
    type: 'heavy',
    damage: 14,
    knockback: 10,
    duration: 60, // Increased from 40 to 60 frames for slower move
    cooldown: 90,
    hitbox: { width: 100, height: 36, offsetX: 10, offsetY: 50 }, // This will be disabled for shadow hitbox
    wave: {
      active: true,
      speed: 4, // Reduced from 8 to 4 for slower shadow
      maxDistance: 200, // Reduced from 300 to 200 for shorter shadow
      width: 80, // Width of the wave
      height: 30, // Height of the wave
      damage: 8, // Damage per wave hit
      knockback: 6, // Knockback per wave hit
      duration: 30, // How long wave lasts
      hitCooldown: 15 // Cooldown between wave hits on same target
    },
    groundSlam: {
      active: true,
      slamForce: 12, // Force of the ground slam
      slamDuration: 25, // Increased from 15 to 25 for longer slam animation
      shockwaveRadius: 60 // Radius of ground impact effect
    },
    description: 'Rakka slams his sword into the ground, creating a devastating dark wave that travels forward like demonic shadow fire.'
  },
  // Rakka stats
  weight: 1.0, // Standard
  jumpForce: -15, // Agile
  moveSpeed: 5.5, // Fast
  
  // Shield (Special)
  shield: {
    name: 'Demon Shadow Shield',
    type: 'shield',
    duration: 60, // frames
    cooldown: 90, // frames
    description: 'Rakka channels his demonic energy to create a shadow samurai shield. Dark energy swirls around him, forming a protective barrier with demonic runes and shadow particles.',
    visual: 'Dark shadow energy swirls around Rakka, forming a demonic shield with red runes and shadow particles. The shield pulses with demonic energy.'
  }
}; 