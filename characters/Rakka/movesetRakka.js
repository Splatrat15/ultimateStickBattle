export const rakkaMoveset = {
  // Light Attacks
  neutralLight: {
    name: 'Quick Draw',
    type: 'light',
    damage: 1.5, // Each hit, 3 hits rapid
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
    duration: 22,
    cooldown: 24,
    hitbox: { width: 48, height: 20, offsetX: 70, offsetY: 12 },
    description: 'Lunging cut, leaves a shadow trail.'
  },
  upLight: {
    name: 'Rising Cut',
    type: 'light',
    damage: 3.5,
    knockback: 3.5,
    verticalKnockback: true,
    duration: 20,
    cooldown: 22,
    hitbox: { width: 32, height: 48, offsetX: 18, offsetY: -38 },
    description: 'Diagonal anti-air slash, sword glows red.'
  },
  downLight: {
    name: 'Leg Sweep',
    type: 'light',
    damage: 2.5,
    knockback: 1.8,
    duration: 20,
    cooldown: 26,
    hitbox: { width: 60, height: 18, offsetX: 10, offsetY: 38 },
    description: 'Low spinning sweep, shadowy effect.'
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
}; 