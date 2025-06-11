export function isOverlapping(token, box) {
  const tokenRect = token.getBoundingClientRect();
  const boxRect = box.getBoundingClientRect();

  return !(
    tokenRect.right < boxRect.left ||
    tokenRect.left > boxRect.right ||
    tokenRect.bottom < boxRect.top ||
    tokenRect.top > boxRect.bottom
  );
}

export function resolveCubeCollision(cube1, cube2, cubeSize) {
  // Simple AABB collision resolution
  const overlapX = (cube1.x + cubeSize) - cube2.x;
  const overlapY = (cube1.y + cubeSize) - cube2.y;

  if (overlapX > 0 && overlapY > 0) {
    // Collision detected, resolve it
    if (overlapX < overlapY) {
      // Resolve horizontally
      if (cube1.x < cube2.x) {
        cube1.x -= overlapX; // Move cube1 left
      } else {
        cube1.x += overlapX; // Move cube1 right
      }
    } else {
      // Resolve vertically
      if (cube1.y < cube2.y) {
        cube1.y -= overlapY; // Move cube1 up
      } else {
        cube1.y += overlapY; // Move cube1 down
      }
    }
  }
}
