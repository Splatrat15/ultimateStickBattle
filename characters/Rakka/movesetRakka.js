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
    duration: 32,
    cooldown: 70,
    chargeable: true,
    hitbox: { width: 90, height: 18, offsetX: 80, offsetY: 0 },
    description: 'Charged forward thrust, sword glows, black mist.'
  },
  sideHeavy: {
    name: 'Shadowstep Strike',
    type: 'heavy',
    damage: 12,
    knockback: 8,
    duration: 28,
    cooldown: 80,
    blink: true,
    hitbox: { width: 70, height: 22, offsetX: 120, offsetY: 8 },
    description: 'Teleport/blink forward, slashing through enemies. Summons shadow silhouette at start and end.'
  },
  upHeavy: {
    name: 'Phantom Slash',
    type: 'heavy',
    damage: 8,
    knockback: 6,
    multiHit: 3,
    verticalKnockback: true,
    duration: 36,
    cooldown: 75,
    hitbox: { width: 36, height: 70, offsetX: 18, offsetY: -60 },
    description: 'Rising multi-hit spin, shadow afterimages.'
  },
  downHeavy: {
    name: 'Void Splitter',
    type: 'heavy',
    damage: 14,
    knockback: 10,
    duration: 40,
    cooldown: 90,
    hitbox: { width: 100, height: 36, offsetX: 10, offsetY: 50 },
    wave: true,
    description: 'Powerful ground slam, sends a dark wave forward.'
  },
  // Rakka stats
  weight: 1.0, // Standard
  jumpForce: -15, // Agile
  moveSpeed: 5.5, // Fast
}; 