export function showCharacterName(name, playerNumber) {
  const box = playerNumber === '1' ? document.getElementById('player1Box') : document.getElementById('player2Box');

  // Check if there's already a name box and preserve CPU state
  const existingNameBox = box.querySelector('.playerNameBox');
  const wasCPU = existingNameBox ? existingNameBox.classList.contains('cpu') : false;
  
  // Remove existing name box if it exists
  if (existingNameBox) {
    existingNameBox.remove();
  }

  // Create a solid color box for the player name
  let nameBox = document.createElement('div');
  nameBox.className = 'playerNameBox'; // Use CSS class for styling
  
  // Set initial text and CPU state based on existing state or window variables
  if (playerNumber === '1') {
    const isCPU = window.player1IsCPU !== undefined ? window.player1IsCPU : wasCPU;
    nameBox.innerText = isCPU ? 'CPU' : 'Player 1';
    if (isCPU) {
      nameBox.classList.add('cpu');
      window.player1IsCPU = true;
    }
  } else {
    const isCPU = window.player2IsCPU !== undefined ? window.player2IsCPU : wasCPU;
    nameBox.innerText = isCPU ? 'CPU' : 'Player 2';
    if (isCPU) {
      nameBox.classList.add('cpu');
      window.player2IsCPU = true;
    }
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
      if (window.player1IsCPU) {
        nameBox.innerText = 'CPU';
        nameBox.classList.add('cpu');
        console.log('Player 1 is now CPU (grey)');
      } else {
        nameBox.innerText = 'Player 1';
        nameBox.classList.remove('cpu');
        console.log('Player 1 is now Human (blue)');
      }
    } else {
      if (window.player2IsCPU === undefined) window.player2IsCPU = false;
      const wasCPU = window.player2IsCPU;
      window.player2IsCPU = !window.player2IsCPU;
      console.log(`Player 2: ${wasCPU ? 'CPU' : 'Human'} → ${window.player2IsCPU ? 'CPU' : 'Human'}`);
      
      // Update visual state
      if (window.player2IsCPU) {
        nameBox.innerText = 'CPU';
        nameBox.classList.add('cpu');
        console.log('Player 2 is now CPU (grey)');
      } else {
        nameBox.innerText = 'Player 2';
        nameBox.classList.remove('cpu');
        console.log('Player 2 is now Human (red)');
      }
    }
  });
  
  // Append name box to the player box
  box.appendChild(nameBox);

  // Create a character name display
  let characterNameDisplay = document.createElement('div');
  characterNameDisplay.className = 'characterNameDisplay';
  characterNameDisplay.setAttribute('data-player', playerNumber);
  characterNameDisplay.innerText = name; // Set character name

  // Append character name display to the box
  box.appendChild(characterNameDisplay); // Append directly to the box
} // Added missing closing brace

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