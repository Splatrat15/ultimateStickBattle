// characterMenu.js
import { showCharacterName, hideCharacterName } from './modules/playerPresentation.js';
import { characters } from './modules/characters.js';

window.addEventListener('DOMContentLoaded', () => {
  const menu = document.getElementById('characterMenu');
  const canvas = document.getElementById('gameCanvas');
  const startButton = document.getElementById('startButton');
  const characterGrid = document.getElementById('characterGrid');
  const player1Choice = document.getElementById('player1Choice');
  const player2Choice = document.getElementById('player2Choice');

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

  // Initialize character selection state
  let player1Selected = false;
  let player2Selected = false;

  // CPU state tracking - use window variables to sync with playerPresentation.js
  // Initialize window variables if they don't exist
  if (window.player1IsCPU === undefined) window.player1IsCPU = false;
  if (window.player2IsCPU === undefined) window.player2IsCPU = false;

  // Show start button when both players have selected
  function checkGameStart() {
    if (player1Selected && player2Selected) {
      startButton.style.display = 'block';
    }
  }

  // Function to update player choice text styling (restore original)
  function updatePlayerChoiceText() {
    // Update Player 1 choice text
    player1Choice.textContent = 'Player 1 Choose';
    player1Choice.style.background = 'rgba(0, 0, 255, 0.5)'; // Blue for human
    player1Choice.style.cursor = 'default';

    // Update Player 2 choice text
    player2Choice.textContent = 'Player 2 Choose';
    player2Choice.style.background = 'rgba(255, 0, 0, 0.5)'; // Red for human
    player2Choice.style.cursor = 'default';
  }

  // Initialize player choice text styling
  updatePlayerChoiceText();

  // Temporary debug button to force CPU mode
  const debugButton = document.createElement('button');
  debugButton.textContent = 'DEBUG: Force Both CPU';
  debugButton.style.position = 'absolute';
  debugButton.style.top = '10px';
  debugButton.style.right = '10px';
  debugButton.style.zIndex = '1000';
  debugButton.addEventListener('click', () => {
    window.player1IsCPU = true;
    window.player2IsCPU = true;
    updatePlayerBoxes();
    console.log('DEBUG: Forced both players to CPU mode');
  });
  document.body.appendChild(debugButton);

  // Test button to manually trigger update
  const testButton = document.createElement('button');
  testButton.textContent = 'TEST: Update Boxes';
  testButton.style.position = 'absolute';
  testButton.style.top = '50px';
  testButton.style.right = '10px';
  testButton.style.zIndex = '1000';
  testButton.addEventListener('click', () => {
    console.log('=== MANUAL TEST TRIGGER ===');
    updatePlayerBoxes();
  });
  document.body.appendChild(testButton);

  // Function to update player boxes with CPU status
  function updatePlayerBoxes() {
    console.log('=== UPDATING PLAYER BOXES ===');
    console.log('Player 1 selected:', player1Selected, 'CPU:', window.player1IsCPU);
    console.log('Player 2 selected:', player2Selected, 'CPU:', window.player2IsCPU);
    
    // Update Player 1 box
    if (player1Selected) {
      const player1NameBox = player1Box.querySelector('.playerNameBox');
      console.log('Player 1 name box found:', !!player1NameBox);
      if (player1NameBox) {
        console.log('Player 1 name box text before:', player1NameBox.innerText);
        console.log('Player 1 name box classes before:', player1NameBox.className);
        
        if (window.player1IsCPU) {
          player1NameBox.innerText = 'CPU';
          player1NameBox.classList.add('cpu');
        } else {
          player1NameBox.innerText = 'Player 1';
          player1NameBox.classList.remove('cpu');
        }
        
        console.log('Player 1 name box text after:', player1NameBox.innerText);
        console.log('Player 1 name box classes after:', player1NameBox.className);
        console.log('Player 1 updated:', window.player1IsCPU ? 'CPU' : 'Human');
      }
    }

    // Update Player 2 box
    if (player2Selected) {
      const player2NameBox = player2Box.querySelector('.playerNameBox');
      console.log('Player 2 name box found:', !!player2NameBox);
      if (player2NameBox) {
        console.log('Player 2 name box text before:', player2NameBox.innerText);
        console.log('Player 2 name box classes before:', player2NameBox.className);
        
        if (window.player2IsCPU) {
          player2NameBox.innerText = 'CPU';
          player2NameBox.classList.add('cpu');
        } else {
          player2NameBox.innerText = 'Player 2';
          player2NameBox.classList.remove('cpu');
        }
        
        console.log('Player 2 name box text after:', player2NameBox.innerText);
        console.log('Player 2 name box classes after:', player2NameBox.className);
        console.log('Player 2 updated:', window.player2IsCPU ? 'CPU' : 'Human');
      }
    }
  }

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
          document.getElementById('player1Choice').style.display = 'none'; // Hide Player 1 Choose text
          document.getElementById('player2Choice').style.display = 'block'; // Show Player 2 Choose text
          player1Selected = true;
          updatePlayerBoxes(); // Update to show CPU toggle capability
          checkGameStart();
        } else if (!selectedCharacter2) {
          // If Player 2 is not selected, set this character
          selectedCharacter2 = characters[key].name;
          showCharacterName(selectedCharacter2, '2');
          document.getElementById('player2Choice').style.display = 'none'; // Hide Player 2 Choose text
          player2Selected = true;
          updatePlayerBoxes(); // Update to show CPU toggle capability
          checkGameStart();
        }
      });
    }
  }

  createCharacterBoxes();

  startButton.addEventListener('click', () => {
    hideCharacterName(1);
    hideCharacterName(2);

    // Store selected characters and CPU states in the window object
    window.selectedCharacter1 = selectedCharacter1;
    window.selectedCharacter2 = selectedCharacter2;
    window.player1IsCPU = window.player1IsCPU;
    window.player2IsCPU = window.player2IsCPU;

    // Show player names in the game
    showCharacterName(selectedCharacter1, '1');
    showCharacterName(selectedCharacter2, '2');

    menu.style.display = 'none';
    canvas.style.display = 'block';
    window.dispatchEvent(new Event('resize'));
    window.gameStarted = true;

    // Log to verify game start
    console.log('=== GAME START DEBUG ===');
    console.log('Game started!');
    console.log('Player 1 CPU:', window.player1IsCPU);
    console.log('Player 2 CPU:', window.player2IsCPU);
    console.log('Window Player 1 CPU:', window.player1IsCPU);
    console.log('Window Player 2 CPU:', window.player2IsCPU);
    console.log('Canvas visible:', canvas.style.display);
    console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
    console.log('========================');
  });

  // Show initial character names
  showCharacterName(selectedCharacter1, '1');
  showCharacterName(selectedCharacter2, '2');
});