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

  // Win condition state
  let winScore = 5; // Default win score
  if (window.winScore === undefined) window.winScore = 5;

  // Create win condition selector
  const winConditionSelector = document.createElement('div');
  winConditionSelector.className = 'winConditionSelector';
  winConditionSelector.innerHTML = `
    <div class="winConditionTitle">Win Condition</div>
    <div class="winConditionControls">
      <button class="winConditionButton" id="decreaseWinScore">-</button>
      <div class="winConditionValue" id="winScoreValue">${winScore}</div>
      <button class="winConditionButton" id="increaseWinScore">+</button>
    </div>
  `;
  
  // Insert after the title
  const title = menu.querySelector('h1');
  title.parentNode.insertBefore(winConditionSelector, title.nextSibling);

  // Add event listeners for win condition buttons
  document.getElementById('decreaseWinScore').addEventListener('click', () => {
    if (winScore > 1) {
      winScore--;
      window.winScore = winScore;
      document.getElementById('winScoreValue').textContent = winScore;
    }
  });

  document.getElementById('increaseWinScore').addEventListener('click', () => {
    if (winScore < 20) {
      winScore++;
      window.winScore = winScore;
      document.getElementById('winScoreValue').textContent = winScore;
    }
  });

  // Function to reset character selection state
  function resetCharacterSelection() {
    selectedCharacter1 = null;
    selectedCharacter2 = null;
    player1Selected = false;
    player2Selected = false;
    
    // Reset choice text visibility
    if (player1Choice) player1Choice.style.display = 'block';
    if (player2Choice) player2Choice.style.display = 'none';
    if (startButton) startButton.style.display = 'none';
    
    // Clear any existing character selections
    const characterBoxes = document.querySelectorAll('.characterBox');
    characterBoxes.forEach(box => {
      box.style.border = '2px solid #fff';
      box.style.transform = 'scale(1)';
    });

    // Reset player boxes to their initial state
    showCharacterName(null, '1');
    showCharacterName(null, '2');
    
    console.log('Character selection reset complete');
  }

  // Listen for game reset event
  window.addEventListener('gameReset', () => {
    console.log('=== CHARACTER MENU RESET ===');
    resetCharacterSelection();
  });

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
    // Dispatch an event with all the game settings
    const event = new CustomEvent('startGame', {
      detail: {
        character1: selectedCharacter1,
        character2: selectedCharacter2,
        player1IsCPU: window.player1IsCPU,
        player2IsCPU: window.player2IsCPU,
        winScore: window.winScore,
      }
    });
    window.dispatchEvent(event);

    menu.style.display = 'none';

    // Log to verify game start
    console.log('=== GAME START EVENT DISPATCHED ===');
  });

  // Show initial character names
  showCharacterName(selectedCharacter1, '1');
  showCharacterName(selectedCharacter2, '2');
});