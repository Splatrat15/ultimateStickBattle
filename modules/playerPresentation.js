export function showCharacterName(name, playerNumber) {
  const box = playerNumber === '1' ? document.getElementById('player1Box') : document.getElementById('player2Box');

  // Create a solid color box for the player name
  let nameBox = document.createElement('div');
  nameBox.className = 'playerNameBox'; // Use CSS class for styling
  nameBox.innerText = playerNumber === '1' ? 'Player 1' : 'Player 2';

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