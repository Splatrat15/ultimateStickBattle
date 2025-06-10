// characterMenu.js
window.addEventListener('DOMContentLoaded', () => {
  const menu = document.getElementById('characterMenu');
  const canvas = document.getElementById('gameCanvas');
  const startButton = document.getElementById('startButton');

  // Create player boxes
  const player1Box = document.createElement('div');
  player1Box.id = 'player1Box';
  player1Box.className = 'playerBox';

  const player1Image = document.createElement('div');
  player1Image.className = 'playerImage';
  player1Image.style.backgroundImage = 'url(path/to/player1/image.png)'; // Replace with actual image path

  const player1Name = document.createElement('div');
  player1Name.className = 'playerName';
  player1Name.innerHTML = '<p>Player 1</p>';

  player1Box.appendChild(player1Image);
  player1Box.appendChild(player1Name);

  const player2Box = document.createElement('div');
  player2Box.id = 'player2Box';
  player2Box.className = 'playerBox';

  const player2Image = document.createElement('div');
  player2Image.className = 'playerImage';
  player2Image.style.backgroundImage = 'url(path/to/player2/image.png)'; // Replace with actual image path

  const player2Name = document.createElement('div');
  player2Name.className = 'playerName';
  player2Name.innerHTML = '<p>Player 2</p>';

  player2Box.appendChild(player2Image);
  player2Box.appendChild(player2Name);

  // Append player boxes to the character menu
  menu.appendChild(player1Box);
  menu.appendChild(player2Box);

  // Show menu, hide game by default
  menu.style.display = '';
  canvas.style.display = 'none';

  startButton.addEventListener('click', () => {
    menu.style.display = 'none';
    canvas.style.display = '';
    // Start the game
    if (typeof resizeCanvas === 'function') resizeCanvas();
    if (typeof update === 'function') update();
    window.addEventListener('resize', resizeCanvas);
  });
}); 