const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.fillText("Ultimate Stick Battle", 300, 300);

  requestAnimationFrame(gameLoop);
}

gameLoop();
