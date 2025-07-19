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

  // Hide character menu initially (startup screen will handle showing it)
  if (menu) menu.style.display = 'none';

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
  if (window.player1CPULevel === undefined) window.player1CPULevel = 1;
  if (window.player2CPULevel === undefined) window.player2CPULevel = 1;

  // Win condition state
  let winScore = 5; // Default win score
  if (window.winScore === undefined) window.winScore = 5;

  // Create timer and lives display as a clickable button
  const timerLivesDisplay = document.createElement('button');
  timerLivesDisplay.className = 'timerLivesDisplay';
  timerLivesDisplay.innerHTML = `
    <div class="timerLivesText">5:00 - 3 Lives</div>
  `;
  
  // Insert after the title
  const title = menu.querySelector('h1');
  title.parentNode.insertBefore(timerLivesDisplay, title.nextSibling);

  // Add click event listener to toggle settings
  timerLivesDisplay.addEventListener('click', () => {
    if (window.settings && typeof window.settings.toggleSettings === 'function') {
      window.settings.toggleSettings();
    }
  });

  // Function to reset character selection state
  function resetCharacterSelection() {
    // Only ensure the character menu is visible after a game reset
    menu.style.display = '';
    selectedCharacter1 = null;
    selectedCharacter2 = null;
    player1Selected = false;
    player2Selected = false;
    
    // Reset choice text visibility
    if (player1Choice) player1Choice.style.display = 'none';
    if (player2Choice) player2Choice.style.display = 'none';
    if (startButton) startButton.style.display = '';
    // Do NOT hide the start button; keep it visible and update its state below
    // if (startButton) startButton.style.display = 'none';
    
    // Clear any existing character selections
    const characterBoxes = document.querySelectorAll('.characterBox');
    characterBoxes.forEach(box => {
      box.style.border = '2px solid #fff';
      box.style.transform = 'scale(1)';
    });

    // Reset player boxes to their initial state
    showCharacterName(null, '1');
    showCharacterName(null, '2');

    // Move tokens back to 'Random' (or index 0 if not found)
    characterBoxElements = Array.from(characterGrid.getElementsByClassName('characterBox'));
    let randomIndex = characterBoxElements.findIndex(box => box.id.toLowerCase().includes('random'));
    if (randomIndex === -1) randomIndex = 0;
    p1Index = randomIndex;
    p2Index = randomIndex;
    positionToken(p1Token, p1Index);
    positionToken(p2Token, p2Index);

    // Set playerPresentation panels to blank (initial state)
    showCharacterName(null, '1');
    showCharacterName(null, '2');

    // Update Start button state (enabled/disabled)
    updateStartButtonState();
    

  }

  // Listen for game reset event
  window.addEventListener('gameReset', () => {
    // Always reset CPU flags to false unless toggled by user
    window.player1IsCPU = false;
    window.player2IsCPU = false;
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
    // Update Player 1 box
    if (player1Selected) {
      const player1NameBox = player1Box.querySelector('.playerNameBox');
      if (player1NameBox) {
        if (window.player1IsCPU) {
          player1NameBox.innerText = 'CPU';
          player1NameBox.classList.add('cpu');
        } else {
          player1NameBox.innerText = 'Player 1';
          player1NameBox.classList.remove('cpu');
        }
      }
    }

    // Update Player 2 box
    if (player2Selected) {
      const player2NameBox = player2Box.querySelector('.playerNameBox');
      if (player2NameBox) {
        if (window.player2IsCPU) {
          player2NameBox.innerText = 'CPU';
          player2NameBox.classList.add('cpu');
        } else {
          player2NameBox.innerText = 'Player 2';
          player2NameBox.classList.remove('cpu');
        }
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

      // Add UNDER CONSTRUCTION overlay and disable for all except Kaon, Rakka, and Random
      const isPlayable = (key === 'kaon' || key === 'rakka' || key === 'random');
      if (!isPlayable) {
        // Add yellow tape overlay
        const overlay = document.createElement('div');
        overlay.className = 'underConstructionOverlay';
        overlay.innerText = 'UNDER CONSTRUCTION';
        characterBox.appendChild(overlay);
        // Visually gray out
        characterBox.style.filter = 'grayscale(1) brightness(1.3)';
        characterBox.style.position = 'relative';
        characterBox.style.pointerEvents = 'none'; // Prevent mouse events
      }

      characterGrid.appendChild(characterBox);

      // Removed click event listener so clicking does nothing
      // characterBox.addEventListener('click', ... );
    }
  }

  createCharacterBoxes();

  // Remove player1Choice and player2Choice elements from the UI
  if (player1Choice) player1Choice.remove();
  if (player2Choice) player2Choice.remove();

  // Create player tokens after character boxes are created
  const p1Token = document.createElement('div');
  p1Token.id = 'p1Token';
  p1Token.className = 'playerToken p1';
  p1Token.innerText = 'P1';
  p1Token.style.position = 'absolute';
  p1Token.style.zIndex = '10';
  p1Token.style.background = 'rgba(0, 0, 255, 0.7)';
  p1Token.style.color = '#fff';
  p1Token.style.padding = '4px 10px';
  p1Token.style.borderRadius = '8px';
  p1Token.style.fontWeight = 'bold';
  p1Token.style.pointerEvents = 'auto';

  const p2Token = document.createElement('div');
  p2Token.id = 'p2Token';
  p2Token.className = 'playerToken p2';
  p2Token.innerText = 'P2';
  p2Token.style.position = 'absolute';
  p2Token.style.zIndex = '10';
  p2Token.style.background = 'rgba(255, 0, 0, 0.7)';
  p2Token.style.color = '#fff';
  p2Token.style.padding = '4px 10px';
  p2Token.style.borderRadius = '8px';
  p2Token.style.fontWeight = 'bold';
  p2Token.style.pointerEvents = 'auto';

  characterGrid.style.position = 'relative';
  characterGrid.appendChild(p1Token);
  characterGrid.appendChild(p2Token);

  // Now initialize characterBoxElements and indices
  let characterBoxElements = Array.from(characterGrid.getElementsByClassName('characterBox'));
  // Mark unselectable indices for under construction characters
  let unselectableIndices = characterBoxElements.map((box, idx) => {
    const id = box.id.toLowerCase();
    return (id.includes('kaon') || id.includes('rakka') || id.includes('random')) ? null : idx;
  }).filter(idx => idx !== null);
  let randomIndex = characterBoxElements.findIndex(box => box.id.toLowerCase().includes('random'));
  if (randomIndex === -1) randomIndex = 0; // fallback
  let p1Index = randomIndex;
  let p2Index = randomIndex;

  function positionToken(token, index) {
    const box = characterBoxElements[index];
    if (box && characterGrid) {
      const rect = box.getBoundingClientRect();
      const gridRect = characterGrid.getBoundingClientRect();
      
      // Check if elements are properly rendered
      if (rect.width > 0 && rect.height > 0 && gridRect.width > 0) {
        if (token === p1Token) {
          // Top left
          token.style.left = (rect.left - gridRect.left + 4) + 'px';
          token.style.top = (rect.top - gridRect.top + 4) + 'px';
        } else if (token === p2Token) {
          // Top right
          token.style.left = (rect.left - gridRect.left + rect.width - token.offsetWidth - 4) + 'px';
          token.style.top = (rect.top - gridRect.top + 4) + 'px';
        }
      } else {
        // If elements aren't properly rendered, try again after a short delay
        setTimeout(() => positionToken(token, index), 50);
      }
    }
  }

  // Initial placement on Random
  positionToken(p1Token, p1Index);
  positionToken(p2Token, p2Index);

  // Function to reposition tokens after startup screen
  function repositionTokensAfterStartup() {
    // Multiple attempts to ensure proper positioning
    const attempts = [100, 200, 500]; // Try at 100ms, 200ms, and 500ms
    
    attempts.forEach(delay => {
      setTimeout(() => {
        positionToken(p1Token, p1Index);
        positionToken(p2Token, p2Index);
      }, delay);
    });
  }

  // Listen for startup completion
  window.addEventListener('startupComplete', () => {
    repositionTokensAfterStartup();
  });

  // Listen for window resize to reposition tokens
  window.addEventListener('resize', () => {
    setTimeout(() => {
      positionToken(p1Token, p1Index);
      positionToken(p2Token, p2Index);
    }, 100);
  });

  // Drag-and-drop logic for tokens
  let draggingToken = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  function getNearestCharacterBox(mouseX, mouseY) {
    let minDist = Infinity;
    let nearestIdx = 0;
    characterBoxElements.forEach((box, idx) => {
      // Skip unselectable boxes
      if (unselectableIndices.includes(idx)) return;
      const rect = box.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(centerX - mouseX, centerY - mouseY);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = idx;
      }
    });
    return nearestIdx;
  }

  function onTokenMouseDown(e, token, tokenName) {
    e.preventDefault();
    draggingToken = tokenName;
    const rect = token.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    document.body.style.userSelect = 'none';
  }

  function onMouseMove(e) {
    if (!draggingToken) return;
    const token = draggingToken === 'p1' ? p1Token : p2Token;
    const gridRect = characterGrid.getBoundingClientRect();
    token.style.left = (e.clientX - gridRect.left - dragOffsetX + token.offsetWidth / 2) + 'px';
    token.style.top = (e.clientY - gridRect.top - dragOffsetY + token.offsetHeight / 2) + 'px';
    token.style.pointerEvents = 'none';
  }

  function onMouseUp(e) {
    if (!draggingToken) return;
    const token = draggingToken === 'p1' ? p1Token : p2Token;
    const idx = getNearestCharacterBox(e.clientX, e.clientY);
    if (draggingToken === 'p1') {
      p1Index = idx;
      // Update player 1 presentation
      const characterName = characterBoxElements[p1Index]?.querySelector('.characterName')?.textContent;
      showCharacterName(characterName, '1');
    } else {
      p2Index = idx;
      // Update player 2 presentation
      const characterName = characterBoxElements[p2Index]?.querySelector('.characterName')?.textContent;
      showCharacterName(characterName, '2');
    }
    positionToken(token, idx);
    draggingToken = null;
    document.body.style.userSelect = '';
    token.style.pointerEvents = 'auto'; // Allow token to be picked up again
    updateStartButtonState();
  }

  // Remove any click event listeners from character boxes (if any were set)
  characterBoxElements.forEach((box) => {
    box.onclick = null;
    box.onmousedown = null;
    box.onmouseup = null;
  });

  p1Token.addEventListener('mousedown', (e) => onTokenMouseDown(e, p1Token, 'p1'));
  p2Token.addEventListener('mousedown', (e) => onTokenMouseDown(e, p2Token, 'p2'));
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // Update Start Game button state
  function updateStartButtonState() {
    // Both tokens must be on a character box and not being dragged
    const bothPlaced = !draggingToken && typeof p1Index === 'number' && typeof p2Index === 'number';
    if (bothPlaced && p1Index !== null && p2Index !== null) {
      startButton.disabled = false;
      startButton.style.opacity = '1';
      startButton.style.pointerEvents = 'auto';
      startButton.style.filter = '';
    } else {
      startButton.disabled = true;
      startButton.style.opacity = '0.5';
      startButton.style.pointerEvents = 'none';
      startButton.style.filter = 'grayscale(1)';
    }
  }

  // Always show start button, but unlit by default
  startButton.style.display = 'block';
  updateStartButtonState();

  // --- Always-visible CPU Difficulty Controls ---
  if (window.player1CPUDifficulty === undefined) window.player1CPUDifficulty = 'EASY';
  if (window.player2CPUDifficulty === undefined) window.player2CPUDifficulty = 'EASY';
  const cpuDifficulties = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'];

  // Remove any old CPU controls (cpuAlwaysBox, cpuToggleBox) for both player boxes
  const oldCPUBox1 = player1Box.querySelector('.cpuAlwaysBox');
  if (oldCPUBox1) oldCPUBox1.remove();
  const oldCPUBox2 = player2Box.querySelector('.cpuAlwaysBox');
  if (oldCPUBox2) oldCPUBox2.remove();
  const oldToggleBox1 = player1Box.querySelector('.cpuToggleBox');
  if (oldToggleBox1) oldToggleBox1.remove();
  const oldToggleBox2 = player2Box.querySelector('.cpuToggleBox');
  if (oldToggleBox2) oldToggleBox2.remove();
  // Do NOT call createAlwaysVisibleCPUBox or append its result to either player box

  // On start, use the character under each token
  startButton.addEventListener('click', () => {
    // List of playable character names (not under construction, not Random)
    const playableNames = ['Kaon', 'Rakka'];
    // Get selected character names
    let character1 = characterBoxElements[p1Index]?.querySelector('.characterName')?.textContent;
    let character2 = characterBoxElements[p2Index]?.querySelector('.characterName')?.textContent;
    // If Random, pick a random playable character
    if (character1 === 'Random') {
      character1 = playableNames[Math.floor(Math.random() * playableNames.length)];
    }
    if (character2 === 'Random') {
      character2 = playableNames[Math.floor(Math.random() * playableNames.length)];
    }
    const event = new CustomEvent('startGame', {
      detail: {
        character1,
        character2,
        player1IsCPU: window.player1IsCPU,
        player2IsCPU: window.player2IsCPU,
        winScore: window.winScore,
        player1CPUDifficulty: window.player1CPUDifficulty,
        player2CPUDifficulty: window.player2CPUDifficulty,
      }
    });
    window.dispatchEvent(event);
    menu.style.display = 'none';
  });

  // On initial placement, show both as Random (or whatever is under the token)
  showCharacterName(characterBoxElements[p1Index]?.querySelector('.characterName')?.textContent, '1');
  showCharacterName(characterBoxElements[p2Index]?.querySelector('.characterName')?.textContent, '2');
  


  // Remove any old controls for player label boxes (these are now handled by showCharacterName)
  const oldP1Controls = player1Box.querySelector('.playerLabelBox');
  if (oldP1Controls) oldP1Controls.remove();
  const oldP2Controls = player2Box.querySelector('.playerLabelBox');
  if (oldP2Controls) oldP2Controls.remove();
  // Do NOT create or append any new playerLabelBox here for either player1Box or player2Box
});