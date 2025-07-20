export function showCharacterName(name, playerNumber) {
  const box = playerNumber === '1' ? document.getElementById('player1Box') : document.getElementById('player2Box');

  // Check if there's already a name box and preserve CPU state
  const existingNameBox = box.querySelector('.playerNameBox');
  const wasCPU = existingNameBox ? existingNameBox.classList.contains('cpu') : false;
  
  // Remove existing name box if it exists
  if (existingNameBox) {
    existingNameBox.remove();
  }

  // Also remove the existing character name display
  const existingCharacterDisplay = box.querySelector('.characterNameDisplay');
  if (existingCharacterDisplay) {
    existingCharacterDisplay.remove();
  }

  // Create a solid color box for the player name
  let nameBox = document.createElement('div');
  nameBox.className = 'playerNameBox'; // Use CSS class for styling
  nameBox.style.display = 'flex';
  nameBox.style.alignItems = 'center';
  nameBox.style.justifyContent = 'center';
  
  // Set initial text and CPU state based on existing state or window variables
  const isCPU = playerNumber === '1'
    ? (window.player1IsCPU !== undefined ? window.player1IsCPU : wasCPU)
    : (window.player2IsCPU !== undefined ? window.player2IsCPU : wasCPU);

  // Add custom styles for the dropdown and CPU label if not already present
  if (!document.getElementById('cpuDropdownStyles')) {
    const style = document.createElement('style');
    style.id = 'cpuDropdownStyles';
    style.innerHTML = `
      .playerNameBox.cpu {
        background: #23232b !important;
        border: 2.5px solid #00eaff;
        box-shadow: 0 0 16px #00eaff88, 0 0 4px #000;
      }
      .cpuDifficultyDropdown {
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        border: none;
        outline: none;
        background: #18181c;
        color: #fff;
        font-weight: bold;
        border-radius: 18px;
        padding: 6px 22px;
        margin-left: 8px;
        font-size: 1.1rem;
        box-shadow: 0 0 8px #000, 0 0 2px #00eaff;
        cursor: pointer;
        position: relative;
      }
      .cpuDifficultyDropdown option[value='EASY'] {
        background: #1e4023;
        color: #00ff5a;
        font-weight: bold;
      }
      .cpuDifficultyDropdown option[value='MEDIUM'] {
        background: #3a3700;
        color: #ffe600;
        font-weight: bold;
      }
      .cpuDifficultyDropdown option[value='HARD'] {
        background: #400000;
        color: #ff2a2a;
        font-weight: bold;
      }
      .cpuDifficultyDropdown option[value='EXPERT'] {
        background: #1a0000;
        color: #ff0033;
        font-weight: bold;
      }
      .cpuLabelStyled {
        font-size: 2.1rem;
        font-weight: 900;
        color: #fff;
        text-shadow: 0 0 8px #fff, 0 0 2px #00eaff, 0 0 2px #000;
        letter-spacing: 2px;
        margin-right: 16px;
        margin-left: 2px;
        font-family: 'Impact', 'Arial Black', Arial, sans-serif;
        text-transform: uppercase;
      }
      .cpuDifficultyDropdown::-ms-expand { display: none; }
      .cpuDifficultyDropdown::-webkit-select-arrow { display: none; }
      .cpuDifficultyDropdown::-webkit-inner-spin-button, .cpuDifficultyDropdown::-webkit-outer-spin-button { display: none; }
      .cpuDifficultyDropdown:focus { outline: 2px solid #00eaff; }
    `;
    document.head.appendChild(style);
  }

  // Helper to set CPU box color based on difficulty
  function setCPUBoxColor(box, difficulty) {
    if (!box.classList.contains('cpu')) return;
    switch (difficulty) {
      case 'EASY':
        box.style.background = '#1e4023';
        break;
      case 'MEDIUM':
        box.style.background = '#3a3700';
        break;
      case 'HARD':
        box.style.background = '#400000';
        break;
      case 'EXPERT':
        box.style.background = '#1a0000';
        break;
      default:
        box.style.background = '#23232b';
    }
  }

  if (isCPU) {
    nameBox.classList.add('cpu');
    if (playerNumber === '1') window.player1IsCPU = true;
    else window.player2IsCPU = true;
    // --- Add CPU label and dropdown ---
    const cpuLabel = document.createElement('span');
    cpuLabel.textContent = 'CPU';
    cpuLabel.className = 'cpuLabelStyled';
    nameBox.appendChild(cpuLabel);
    // Dropdown
    const diffKey = playerNumber === '1' ? 'player1CPUDifficulty' : 'player2CPUDifficulty';
    if (window[diffKey] === undefined) window[diffKey] = 'EASY';
    const cpuDropdown = document.createElement('select');
    cpuDropdown.className = 'cpuDifficultyDropdown';
    ['EASY', 'MEDIUM', 'HARD', 'EXPERT'].forEach(level => {
      const option = document.createElement('option');
      option.value = level;
      option.textContent = level;
      cpuDropdown.appendChild(option);
    });
    cpuDropdown.value = window[diffKey];
    setCPUBoxColor(nameBox, cpuDropdown.value);
    cpuDropdown.addEventListener('change', e => {
      window[diffKey] = e.target.value;
      setCPUBoxColor(nameBox, e.target.value);
    });
    cpuDropdown.addEventListener('mousedown', e => e.stopPropagation());
    cpuDropdown.addEventListener('click', e => e.stopPropagation());
    nameBox.appendChild(cpuDropdown);
  } else {
    nameBox.innerText = playerNumber === '1' ? 'Player 1' : 'Player 2';
    nameBox.style.background = '';
  }
  
  // Add click handler for CPU toggle
  nameBox.addEventListener('click', (e) => {
    e.stopPropagation();
    // Toggle CPU state
    if (playerNumber === '1') {
      if (window.player1IsCPU === undefined) window.player1IsCPU = false;
      const wasCPU = window.player1IsCPU;
      window.player1IsCPU = !window.player1IsCPU;
      // Update visual state
      nameBox.innerHTML = '';
      if (window.player1IsCPU) {
        nameBox.classList.add('cpu');
        // Add CPU label and dropdown
        const cpuLabel = document.createElement('span');
        cpuLabel.textContent = 'CPU';
        cpuLabel.className = 'cpuLabelStyled';
        nameBox.appendChild(cpuLabel);
        // Dropdown
        if (window.player1CPUDifficulty === undefined) window.player1CPUDifficulty = 'EASY';
        const cpuDropdown = document.createElement('select');
        cpuDropdown.className = 'cpuDifficultyDropdown';
        ['EASY', 'MEDIUM', 'HARD', 'EXPERT'].forEach(level => {
          const option = document.createElement('option');
          option.value = level;
          option.textContent = level;
          cpuDropdown.appendChild(option);
        });
        cpuDropdown.value = window.player1CPUDifficulty;
        cpuDropdown.addEventListener('change', e => {
          window.player1CPUDifficulty = e.target.value;
        });
        cpuDropdown.addEventListener('mousedown', e => e.stopPropagation());
        cpuDropdown.addEventListener('click', e => e.stopPropagation());
        nameBox.appendChild(cpuDropdown);
      } else {
        nameBox.classList.remove('cpu');
        nameBox.innerText = 'Player 1';
        // Restore Player 1 blue color
        nameBox.style.background = 'blue';
      }
    } else {
      if (window.player2IsCPU === undefined) window.player2IsCPU = false;
      const wasCPU = window.player2IsCPU;
      window.player2IsCPU = !window.player2IsCPU;
      // Update visual state
      nameBox.innerHTML = '';
      if (window.player2IsCPU) {
        nameBox.classList.add('cpu');
        // Add CPU label and dropdown
        const cpuLabel = document.createElement('span');
        cpuLabel.textContent = 'CPU';
        cpuLabel.className = 'cpuLabelStyled';
        nameBox.appendChild(cpuLabel);
        // Dropdown
        if (window.player2CPUDifficulty === undefined) window.player2CPUDifficulty = 'EASY';
        const cpuDropdown = document.createElement('select');
        cpuDropdown.className = 'cpuDifficultyDropdown';
        ['EASY', 'MEDIUM', 'HARD', 'EXPERT'].forEach(level => {
          const option = document.createElement('option');
          option.value = level;
          option.textContent = level;
          cpuDropdown.appendChild(option);
        });
        cpuDropdown.value = window.player2CPUDifficulty;
        cpuDropdown.addEventListener('change', e => {
          window.player2CPUDifficulty = e.target.value;
        });
        cpuDropdown.addEventListener('mousedown', e => e.stopPropagation());
        cpuDropdown.addEventListener('click', e => e.stopPropagation());
        nameBox.appendChild(cpuDropdown);
      } else {
        nameBox.classList.remove('cpu');
        nameBox.innerText = 'Player 2';
        // Restore Player 2 red color
        nameBox.style.background = 'red';
      }
    }
  });
  
  // Append name box to the player box
  box.appendChild(nameBox);

  // Create a character name display
  let characterNameDisplay = document.createElement('div');
  characterNameDisplay.className = 'characterNameDisplay';
  characterNameDisplay.setAttribute('data-player', playerNumber);
  characterNameDisplay.innerText = name || ''; // Set character name, default to empty string

  // Append character name display to the box
  box.appendChild(characterNameDisplay); // Append directly to the box
}

export function hideCharacterName(playerNumber) {
  const box = playerNumber === '1' ? document.getElementById('player1Box') : document.getElementById('player2Box');
  
  // Remove the name box
  const nameBox = box.querySelector('.playerNameBox');
  if (nameBox) {
    nameBox.remove();
  }

  const characterNameDisplay = box.querySelector(`.characterNameDisplay[data-player="${playerNumber}"]`);
  if (characterNameDisplay) {
    characterNameDisplay.remove();
  }
}

// === CONTROLLER CURSOR SUPPORT ===
const controllerCursors = [
  {
    x: window.innerWidth * 0.25,
    y: window.innerHeight * 0.5,
    color: '#2196f3', // Blue for player 1
    el: null,
    active: false,
    lastA: false
  },
  {
    x: window.innerWidth * 0.75,
    y: window.innerHeight * 0.5,
    color: '#e53935', // Red for player 2
    el: null,
    active: false,
    lastA: false
  }
];

function createControllerCursor(idx) {
  let el = document.createElement('div');
  el.className = 'controller-cursor';
  el.style.position = 'fixed';
  el.style.width = '28px';
  el.style.height = '28px';
  el.style.borderRadius = '50%';
  el.style.background = controllerCursors[idx].color;
  el.style.boxShadow = `0 0 8px ${controllerCursors[idx].color}88`;
  el.style.zIndex = 9999;
  el.style.pointerEvents = 'none';
  el.style.transition = 'background 0.1s';
  el.style.display = 'none';
  document.body.appendChild(el);
  controllerCursors[idx].el = el;
}
createControllerCursor(0);
createControllerCursor(1);

// Helper to get the connected controllers in the same order as game.js
function getAssignedControllerIndexForPlayer(playerIdx) {
  // playerIdx: 0 for player 1, 1 for player 2
  const gamepadsRaw = navigator.getGamepads ? navigator.getGamepads() : [];
  const controllerKeywords = [
    'xbox', 'playstation', 'dualshock', 'switch', 'pro controller', '8bitdo', 'logitech', 'nintendo', 'controller', 'ps4', 'ps5', 'sony', 'gamepad'
  ];
  const connectedGamepads = [];
  for (let i = 0; i < gamepadsRaw.length; i++) {
    const gp = gamepadsRaw[i];
    if (!gp) continue;
    const idLower = gp.id ? gp.id.toLowerCase() : '';
    const isController = gp.mapping === 'standard' && controllerKeywords.some(keyword => idLower.includes(keyword));
    if (isController) connectedGamepads.push({ gp, index: i });
  }
  // Assign controllers in order: first to player 1, second to player 2
  if (playerIdx === 0 && !window.player1IsCPU && connectedGamepads[0]) return connectedGamepads[0].index;
  if (playerIdx === 1 && !window.player2IsCPU && connectedGamepads[1]) return connectedGamepads[1].index;
  return null;
}

function updateControllerCursors() {
  // Only show in character menu/settings
  const menu = document.getElementById('characterMenu');
  const settingsModal = document.getElementById('settingsModal');
  const menuVisible = menu && menu.style.display !== 'none';
  const settingsVisible = settingsModal && settingsModal.style.display !== 'none';
  for (let i = 0; i < 2; i++) {
    const cursor = controllerCursors[i];
    // Only show if controller is assigned to this player
    const assignedIndex = getAssignedControllerIndexForPlayer(i);
    if (cursor.el) {
      if ((menuVisible || settingsVisible) && assignedIndex !== null) {
        cursor.el.style.display = 'block';
        cursor.el.style.left = `${cursor.x - 14}px`;
        cursor.el.style.top = `${cursor.y - 14}px`;
      } else {
        cursor.el.style.display = 'none';
      }
    }
  }
}

// --- CONTROLLER CURSOR TOKEN DRAG SUPPORT ---
// These will be set by characterMenu.js, but we need to hook into them
let characterGrid = null;
let p1Token = null;
let p2Token = null;
let characterBoxElements = null;
let unselectableIndices = null;
let draggingToken = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let p1Index = null;
let p2Index = null;
let positionToken = null;
let getNearestCharacterBox = null;
let updateStartButtonState = null;

// Wait for DOMContentLoaded and characterMenu.js to set up tokens and helpers
window.addEventListener('DOMContentLoaded', () => {
  // Try to get references from characterMenu.js scope
  characterGrid = document.getElementById('characterGrid');
  p1Token = document.getElementById('p1Token');
  p2Token = document.getElementById('p2Token');
  characterBoxElements = characterGrid ? Array.from(characterGrid.getElementsByClassName('characterBox')) : null;
  // Only assign helpers if not already defined, but DO NOT assign showCharacterName to avoid redeclaration
  if (!positionToken) positionToken = window.positionToken || null;
  if (!getNearestCharacterBox) getNearestCharacterBox = window.getNearestCharacterBox || null;
  if (!updateStartButtonState) updateStartButtonState = window.updateStartButtonState || null;
  // Try to get indices from window
  p1Index = window.p1Index;
  p2Index = window.p2Index;
  // Try to get unselectableIndices from window
  unselectableIndices = window.unselectableIndices;
});

function controllerDragToken(token, cursorX, cursorY, playerNum) {
  if (!characterGrid || !token) return;
  const gridRect = characterGrid.getBoundingClientRect();
  // Use same dragOffset as mouse (centered on token)
  const offsetX = token.offsetWidth / 2;
  const offsetY = token.offsetHeight / 2;
  token.style.left = (cursorX - gridRect.left - offsetX) + 'px';
  token.style.top = (cursorY - gridRect.top - offsetY) + 'px';
  token.style.pointerEvents = 'none';
}

function controllerDropToken(token, cursorX, cursorY, playerNum) {
  if (!characterBoxElements || !getNearestCharacterBox) return;
  const idx = getNearestCharacterBox(cursorX, cursorY);
  if (playerNum === 1) {
    window.p1Index = idx;
    if (window.showCharacterName) {
      const characterName = characterBoxElements[idx]?.querySelector('.characterName')?.textContent;
      window.showCharacterName(characterName, '1');
    }
  } else {
    window.p2Index = idx;
    if (window.showCharacterName) {
      const characterName = characterBoxElements[idx]?.querySelector('.characterName')?.textContent;
      window.showCharacterName(characterName, '2');
    }
  }
  if (positionToken) positionToken(token, idx);
  draggingToken = null;
  document.body.style.userSelect = '';
  token.style.pointerEvents = 'auto';
  if (updateStartButtonState) updateStartButtonState();
}

// --- PATCH CONTROLLER CURSOR LOGIC ---
function pollControllerCursors() {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (let i = 0; i < 2; i++) {
    const assignedIndex = getAssignedControllerIndexForPlayer(i);
    const cursor = controllerCursors[i];
    if (assignedIndex === null) {
      cursor.active = false;
      continue;
    }
    const gp = gamepads[assignedIndex];
    if (!gp || gp.mapping !== 'standard') {
      cursor.active = false;
      continue;
    }
    cursor.active = true;
    // Move with left stick
    const speed = 13;
    const lx = gp.axes[0] || 0;
    const ly = gp.axes[1] || 0;
    if (Math.abs(lx) > 0.18) cursor.x += lx * speed;
    if (Math.abs(ly) > 0.18) cursor.y += ly * speed;
    // Clamp to window
    cursor.x = Math.max(0, Math.min(window.innerWidth, cursor.x));
    cursor.y = Math.max(0, Math.min(window.innerHeight, cursor.y));
    // A button logic
    const btnA = gp.buttons[0]?.pressed;
    // --- TOKEN DRAG LOGIC ---
    // Only allow drag if in character menu and tokens exist
    const menu = document.getElementById('characterMenu');
    const menuVisible = menu && menu.style.display !== 'none';
    if (menuVisible && p1Token && p2Token && characterGrid) {
      // If A is pressed and not already dragging, check if cursor is over a token
      if (btnA && !cursor.lastA && !draggingToken) {
        const el = document.elementFromPoint(cursor.x, cursor.y);
        if (el === p1Token && i === 0) {
          draggingToken = 'p1';
          document.body.style.userSelect = 'none';
        } else if (el === p2Token && i === 1) {
          draggingToken = 'p2';
          document.body.style.userSelect = 'none';
        }
      }
      // If dragging with this controller, update token position
      if (btnA && draggingToken && ((draggingToken === 'p1' && i === 0) || (draggingToken === 'p2' && i === 1))) {
        const token = draggingToken === 'p1' ? p1Token : p2Token;
        controllerDragToken(token, cursor.x, cursor.y, i + 1);
      }
      // If A is released and was dragging, drop the token
      if (!btnA && cursor.lastA && draggingToken && ((draggingToken === 'p1' && i === 0) || (draggingToken === 'p2' && i === 1))) {
        const token = draggingToken === 'p1' ? p1Token : p2Token;
        controllerDropToken(token, cursor.x, cursor.y, i + 1);
      }
    }
    // --- END TOKEN DRAG LOGIC ---
    // If not dragging, do normal click logic for A
    if (btnA && !cursor.lastA && !draggingToken) {
      const el = document.elementFromPoint(cursor.x, cursor.y);
      if (el) {
        el.focus();
        // Dispatch mousedown
        const downEvt = new MouseEvent('mousedown', { bubbles: true, clientX: cursor.x, clientY: cursor.y });
        el.dispatchEvent(downEvt);
      }
      // Visual feedback
      cursor.el.style.background = '#fff';
      setTimeout(() => { cursor.el.style.background = cursor.color; }, 120);
    }
    if (!btnA && cursor.lastA && !draggingToken) {
      const el = document.elementFromPoint(cursor.x, cursor.y);
      if (el) {
        // Dispatch mouseup and click
        const upEvt = new MouseEvent('mouseup', { bubbles: true, clientX: cursor.x, clientY: cursor.y });
        el.dispatchEvent(upEvt);
        const clickEvt = new MouseEvent('click', { bubbles: true, clientX: cursor.x, clientY: cursor.y });
        el.dispatchEvent(clickEvt);
      }
    }
    cursor.lastA = btnA;
  }
  updateControllerCursors();
  requestAnimationFrame(pollControllerCursors);
}
requestAnimationFrame(pollControllerCursors);