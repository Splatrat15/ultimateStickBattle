export const kaonMoveset = {
  // Light Attacks
  neutralLight: { name: 'Orb Jab', type: 'light', damage: 2, knockback: 1, duration: 15, cooldown: 20, hitbox: { width: 20, height: 20, offsetX: 60, offsetY: 20 } },
  sideLight: { name: 'Ki Orb', type: 'light', damage: 3, knockback: 2, duration: 25, cooldown: 30, hitbox: { width: 15, height: 15, offsetX: 80, offsetY: 25 } },
  upLight: { name: 'Orb Pop', type: 'light', damage: 2, knockback: 4, verticalKnockback: true, duration: 20, cooldown: 25, hitbox: { width: 40, height: 40, offsetX: 10, offsetY: -40 } },
  downLight: { name: 'Pulse Sweep', type: 'light', damage: 1, knockback: 0.5, duration: 15, cooldown: 30, hitbox: { width: 100, height: 20, offsetX: -20, offsetY: 40 } },
  // Heavy Attacks
  neutralHeavy: { name: 'Core Beam', type: 'heavy', damage: 8, knockback: 6, duration: 30, cooldown: 70, hitbox: { width: 130, height: 12, offsetX: 80, offsetY: -5 } },
  sideHeavy: { name: 'Big Bang Attack', type: 'heavy', damage: 15, knockback: 12, duration: 60, cooldown: 90, hitbox: { width: 120, height: 80, offsetX: 80, offsetY: -20 } },
  upHeavy: { name: 'Gravity Spike', type: 'heavy', damage: 12, knockback: 8, verticalKnockback: true, spikeKnockback: true, selfLaunch: true, selfLaunchForce: 15, duration: 35, cooldown: 80, hitbox: { width: 20, height: 80, offsetX: 20, offsetY: 40 } },
  downHeavy: { name: 'Dual Blast', type: 'heavy', damage: 8, knockback: 6, duration: 40, cooldown: 85, hitbox: { width: 100, height: 40, offsetX: 70, offsetY: 10 }, hitbox2: { width: 100, height: 40, offsetX: -110, offsetY: 10 } },
}; 