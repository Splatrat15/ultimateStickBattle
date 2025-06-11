export function updateCube(cube, opponent) {
  // Apply movement based on the cube's state
  if (cube.moveLeft) {
    cube.x -= moveSpeed; // Move left
  }
  if (cube.moveRight) {
    cube.x += moveSpeed; // Move right
  }

  // Apply gravity and other physics here if needed
  // Example: cube.y += gravity; // Apply gravity
}

export function resetPlayerToPlatform(cube, side) {
  const margin = 20;
  cube.x = side === 'left' ? platform.x + margin : platform.x + platform.width - cubeSize - margin;
  cube.y = platform.y - cubeSize;
  cube.vx = 0;
  cube.vy = 0;
}
