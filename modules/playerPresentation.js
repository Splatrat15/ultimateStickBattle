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
    console.log(`=== PLAYER ${playerNumber} NAME BOX CLICKED ===`);
    // Toggle CPU state
    if (playerNumber === '1') {
      if (window.player1IsCPU === undefined) window.player1IsCPU = false;
      const wasCPU = window.player1IsCPU;
      window.player1IsCPU = !window.player1IsCPU;
      console.log(`Player 1: ${wasCPU ? 'CPU' : 'Human'} → ${window.player1IsCPU ? 'CPU' : 'Human'}`);
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
      }
    } else {
      if (window.player2IsCPU === undefined) window.player2IsCPU = false;
      const wasCPU = window.player2IsCPU;
      window.player2IsCPU = !window.player2IsCPU;
      console.log(`Player 2: ${wasCPU ? 'CPU' : 'Human'} → ${window.player2IsCPU ? 'CPU' : 'Human'}`);
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