const stage = {
  x: 150,
  y: 550,
  width: 500,
  height: 20
};

function drawStage(ctx) {
  ctx.fillStyle = '#444';
  ctx.fillRect(stage.x, stage.y, stage.width, stage.height);
}
