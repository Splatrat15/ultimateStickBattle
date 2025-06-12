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
    score: 0,
    moveForward() {
      this.x += 8; // Move forward by 8 units
    },
    moveBackward() {
      this.x -= 8; // Move backward by 8 units
    },
    jump() {
      if (this.isOnGround) {
        this.vy = -jumpStrength; // Set vertical velocity for jumping
        this.isOnGround = false; // Set to false until the player lands
        this.jumpCount++;
      }
    }
  };
}
