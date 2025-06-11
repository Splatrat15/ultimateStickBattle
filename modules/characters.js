// modules/characters.js

// Character data
export const characters = {
  kaon: {
    name: 'Kaon',
    image: 'path/to/kaon/image.png', // Replace with actual image path
  },
  rakka: {
    name: 'Rakka',
    image: 'path/to/rakka/image.png', // Replace with actual image path
  },
  vanta: {
    name: 'Vanta',
    image: 'path/to/vanta/image.png', // Replace with actual image path
  },
  glitch: {
    name: 'Glitch',
    image: 'path/to/glitch/image.png', // Replace with actual image path
  },
  ember: {
    name: 'Ember',
    image: 'path/to/ember/image.png', // Replace with actual image path
  },
  aeon: {
    name: 'Aeon',
    image: 'path/to/aeon/image.png', // Replace with actual image path
  },
  ace: {
    name: 'Ace',
    image: 'path/to/ace/image.png', // Replace with actual image path
  },
  onyx: {
    name: 'Onyx',
    image: 'path/to/onyx/image.png', // Replace with actual image path
  },
  random: {
    name: 'Random',
    image: 'path/to/random/image.png', // Replace with actual image path
  }
};

// Function to get character by name
export function getCharacter(name) {
  return characters[name.toLowerCase()] || null;
}
