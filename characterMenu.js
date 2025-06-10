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
  menu.appendChild(player2Box);
  menu.appendChild(player1Box);

  // Function to create player tokens
  function createPlayerToken(playerNumber) {
    const token = document.createElement('div');
    token.className = 'playerToken';
    token.setAttribute('data-player', playerNumber); // Add data attribute for identification
    token.innerText = `P${playerNumber}`;
    
    document.body.appendChild(token);
    return token;
  }

  // Create player tokens
  const player1Token = createPlayerToken(1);
  const player2Token = createPlayerToken(2);

  // Function to position tokens after player boxes are rendered
  function positionTokens() {
    player1Token.style.left = `${player1Box.offsetLeft + player1Box.offsetWidth / 2 - 25}px`; // Center on player box
    player1Token.style.top = `${player1Box.offsetTop}px`; // On top of player box

    player2Token.style.left = `${player2Box.offsetLeft + player2Box.offsetWidth / 2 - 25}px`; // Center on player box
    player2Token.style.top = `${player2Box.offsetTop}px`; // On top of player box
  }

  // Call positionTokens after appending player boxes
  positionTokens();

  // Function to make an element draggable
  function makeDraggable(element) {
    let offsetX, offsetY;

    element.addEventListener('mousedown', (e) => {
      offsetX = e.clientX - element.getBoundingClientRect().left;
      offsetY = e.clientY - element.getBoundingClientRect().top;

      const onMouseMove = (e) => {
        element.style.left = `${e.clientX - offsetX}px`;
        element.style.top = `${e.clientY - offsetY}px`;

        // Check for collision with character boxes
        const characterBoxes = document.querySelectorAll('.characterBox');
        let nameToShow = '';

        characterBoxes.forEach(box => {
          if (isOverlapping(element, box)) {
            nameToShow = box.querySelector('p').innerText; // Get the character name
          }
        });

        if (nameToShow) {
          showCharacterName(nameToShow, element.getAttribute('data-player'));
        } else {
          hideCharacterName(); // Hide name if not over any character box
        }
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  // Function to check if two elements are overlapping
  function isOverlapping(token, box) {
    const tokenRect = token.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();

    return !(
      tokenRect.right < boxRect.left ||
      tokenRect.left > boxRect.right ||
      tokenRect.bottom < boxRect.top ||
      tokenRect.top > boxRect.bottom
    );
  }

  // Function to show character name in the respective player box
  function showCharacterName(name, playerNumber) {
    const box = playerNumber === '1' ? player1Box : player2Box;
    let nameDisplay = document.querySelector(`.characterNameDisplay[data-player="${playerNumber}"]`);

    // If the name display doesn't exist, create it
    if (!nameDisplay) {
      nameDisplay = document.createElement('h1');
      nameDisplay.className = 'characterNameDisplay';
      nameDisplay.setAttribute('data-player', playerNumber); // Add data attribute for identification
      document.body.appendChild(nameDisplay);
    }

    // Position the name just above the player box
    nameDisplay.style.left = `${box.offsetLeft + (box.offsetWidth / 2) - (nameDisplay.offsetWidth / 2)}px`; // Center above player box
    nameDisplay.style.top = `${box.offsetTop - 50}px`; // Adjusted position above

    // Update the text of the existing name display
    nameDisplay.innerText = name;
  }

  // Function to hide character name
  function hideCharacterName() {
    const nameDisplays = document.querySelectorAll('.characterNameDisplay');
    nameDisplays.forEach(display => display.remove());
  }

  // Make both player tokens draggable
  makeDraggable(player1Token);
  makeDraggable(player2Token);

  // Show menu, hide game by default
  menu.style.display = '';
  canvas.style.display = 'none';

  startButton.addEventListener('click', () => {
    // Remove player tokens before starting the game
    player1Token.remove();
    player2Token.remove();

    hideCharacterName(); // Hide any displayed character names

    menu.style.display = 'none';
    canvas.style.display = '';
    // Start the game
    if (typeof resizeCanvas === 'function') resizeCanvas();
    if (typeof update === 'function') update();
    window.addEventListener('resize', resizeCanvas);
  });
}); 