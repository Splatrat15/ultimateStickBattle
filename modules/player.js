export function createPlayer({ x, y, color, facing }) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    color,
    moveLeft: false,
    moveRight: false,
    isOnGround: true,
    facing,
    activeHitbox: null,
    jumpCount: 0,
    damage: 0,
    wasHitByAttack: false,
    score: 0
  };
}
