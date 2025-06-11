export function spawnHitbox(cube, type) {
  const size = type === 'light' ? cubeSize * 0.4 : cubeSize * 0.7;
  const color = type === 'light' ? 'yellow' : 'red';
  let x = cube.facing === 1 ? cube.x + cubeSize : cube.x - size;
  const y = cube.y + cubeSize * 0.2;
  cube.activeHitbox = { x, y, size, color, facing: cube.facing, type };
  setTimeout(() => { cube.activeHitbox = null; }, 200);
}

export function checkHitAndApplyDamage(attacker, defender, type) {
  if (!attacker.activeHitbox) return;
  if (defender.wasHitByAttack) return;

  const h = attacker.activeHitbox;
  if (
    h.x < defender.x + cubeSize &&
    h.x + h.size > defender.x &&
    h.y < defender.y + cubeSize &&
    h.y + h.size > defender.y
  ) {
    defender.wasHitByAttack = true;
    defender.damage += type === 'light' ? 6 : 15;
    // Knockback calculation...
  }
}
