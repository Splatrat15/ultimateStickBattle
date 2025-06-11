// characterMenu.js
import { showCharacterName, hideCharacterName } from './modules/playerPresentation.js';
import { characters } from './modules/characters.js';

window.addEventListener('DOMContentLoaded', () => {
  const menu = document.getElementById('characterMenu');
  const canvas = document.getElementById('gameCanvas');
  const startButton = document.getElementById('startButton');
  const characterGrid = document.getElementById('characterGrid');

  // Create player boxes
  const player1Box = document.createElement('div');
  player1Box.id = 'player1Box';
  player1Box.className = 'playerBox';
  player1Box.style.background = 'rgba(0, 0, 255, 0.2)'; // Player 1 color

  const player2Box = document.createElement('div');
  player2Box.id = 'player2Box';
  player2Box.className = 'playerBox';
  player2Box.style.background = 'rgba(255, 0, 0, 0.2)'; // Player 2 color

  // Append player boxes to the character menu
  menu.appendChild(player1Box);
  menu.appendChild(player2Box);

  // Store selected characters
  let selectedCharacter1 = null; // Set to null initially
  let selectedCharacter2 = null; // Set to null initially

  // Create character boxes
  function createCharacterBoxes() {
    for (const key in characters) {
      const characterBox = document.createElement('div');
      characterBox.className = 'characterBox';
      characterBox.id = `${key}Box`;

      const characterName = document.createElement('p');
      characterName.textContent = characters[key].name;
      characterName.className = 'characterName';

      characterBox.appendChild(characterName);
      characterGrid.appendChild(characterBox);
      console.log(`Character box created for: ${characters[key].name}`);

      // Add click event listener to each character box
      characterBox.addEventListener('click', () => {
        if (!selectedCharacter1) {
          // If Player 1 is not selected, set this character
          selectedCharacter1 = characters[key].name;
          showCharacterName(selectedCharacter1, '1');
          player1Box.innerHTML = `<span class="playerName">${selectedCharacter1}</span>`; // Update Player 1 box with name
          document.getElementById('player1Choice').style.display = 'none'; // Hide Player 1 Choose text
          document.getElementById('player2Choice').style.display = 'block'; // Show Player 2 Choose text
        } else if (!selectedCharacter2) {
          // If Player 2 is not selected, set this character
          selectedCharacter2 = characters[key].name;
          showCharacterName(selectedCharacter2, '2');
          player2Box.innerHTML = `<span class="playerName">${selectedCharacter2}</span>`; // Update Player 2 box with name
          document.getElementById('player2Choice').style.display = 'none'; // Hide Player 2 Choose text
          document.getElementById('startButton').style.display = 'block'; // Show Start Game button
        }
      });
    }
  }

  createCharacterBoxes();

  startButton.addEventListener('click', () => {
    hideCharacterName(1);
    hideCharacterName(2);

    // Store selected characters in the window object
    window.selectedCharacter1 = selectedCharacter1;
    window.selectedCharacter2 = selectedCharacter2;

    // Show player names in the game
    showCharacterName(selectedCharacter1, '1');
    showCharacterName(selectedCharacter2, '2');

    menu.style.display = 'none';
    canvas.style.display = '';
    if (typeof resizeCanvas === 'function') resizeCanvas();
    if (typeof update === 'function') update();
    window.addEventListener('resize', resizeCanvas);
  });

  // Show initial character names
  showCharacterName(selectedCharacter1, '1');
  showCharacterName(selectedCharacter2, '2');
});