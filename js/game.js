const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let keys = {};

window.addEventListener('keydown', e => {
  keys[e.key] = true;
});

window.addEventListener('keyup', e => {
  keys[e.key] = false;
});

const player1Controls = { left: 'a', right: 'd' };
const player2Controls = { left: 'ArrowLeft', right: 'ArrowRight' };

const player1 = new Player(stage.x + 50, 'red', player1Controls);
const player2 = new Player(stage.x + stage.width - 90, 'blue', player2Controls);

// Initialize players on stage
player1.reset(stage);
player2.reset(stage);

function clearScreen() {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawScores() {
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Player 1 Score: ${player1.score}`, 20, 30);
  ctx.fillText(`Player 2 Score: ${player2.score}`, canvas.width - 180, 30);
}

function gameLoop() {
  clearScreen();
  drawStage(ctx);

  // Player 1 movement
  if (keys[player1.controls.left]) player1.moveLeft();
  if (keys[player1.controls.right]) player1.moveRight();

  // Player 2 movement
  if (keys[player2.controls.left]) player2.moveLeft();
  if (keys[player2.controls.right]) player2.moveRight();

  player1.update(stage);
  player2.update(stage);

  // Check if players fell off bottom of canvas => KO
  if (player1.y > canvas.height + player1.height) {
    player2.score++;
    player1.reset(stage);
  }
  if (player2.y > canvas.height + player2.height) {
    player1.score++;
    player2.reset(stage);
  }

  player1.draw(ctx);
  player2.draw(ctx);

  drawScores();

  requestAnimationFrame(gameLoop);
}

gameLoop();
