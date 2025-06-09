class Player {
  constructor(x, color, controls) {
    this.x = x;
    this.y = 0;
    this.width = 40;
    this.height = 80;
    this.color = color;
    this.speed = 5;
    this.vy = 0;
    this.onGround = false;
    this.score = 0;
    this.controls = controls; // Object with keys for left/right attack
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
  }

  update(stage) {
    // Apply gravity if not on ground
    if (!this.onGround) {
      this.vy += 0.5; // gravity acceleration
      this.y += this.vy;

      // Land on stage platform if within stage bounds
      if (
        this.y >= stage.y &&
        this.x + this.width > stage.x &&
        this.x < stage.x + stage.width
      ) {
        this.y = stage.y;
        this.vy = 0;
        this.onGround = true;
      }
    }

    // Prevent walking on stage edges (only horizontal bounds inside stage)
    if (this.onGround) {
      if (this.x < stage.x - this.width) this.x = stage.x - this.width; // allow falling off left
      if (this.x > stage.x + stage.width) this.x = stage.x + stage.width; // allow falling off right
    }
  }

  moveLeft() {
    this.x -= this.speed;
    this.onGround = false; // if moving off stage, start falling
  }

  moveRight() {
    this.x += this.speed;
    this.onGround = false;
  }

  reset(stage) {
    this.x = stage.x + stage.width / 2 - this.width / 2;
    this.y = stage.y;
    this.vy = 0;
    this.onGround = true;
  }
}
