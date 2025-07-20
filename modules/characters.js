// modules/characters.js
import { kaonMoveset } from '../characters/Kaon/movesetKaon.js';
import { rakkaMoveset } from '../characters/Rakka/movesetRakka.js';
import { drawKaon } from '../characters/Kaon/designKaon.js';
import { drawRakka } from '../characters/Rakka/designRakka.js';
import { drawKaonShield } from '../characters/Kaon/movesetKaon.js';
import { drawRakkaShield } from '../characters/Rakka/designRakka.js';

// A default moveset for characters without a unique one
const defaultMoveset = {
  neutralLight: { name: 'Jab', type: 'light', damage: 2, knockback: 2, duration: 15, cooldown: 20, hitbox: { width: 40, height: 40, offsetX: 60, offsetY: 10 } },
  sideLight: { name: 'Side Punch', type: 'light', damage: 3, knockback: 3, duration: 15, cooldown: 25, hitbox: { width: 50, height: 40, offsetX: 60, offsetY: 10 } },
  upLight: { name: 'Upper', type: 'light', damage: 2, knockback: 4, verticalKnockback: true, duration: 20, cooldown: 25, hitbox: { width: 40, height: 50, offsetX: 10, offsetY: -40 } },
  downLight: { name: 'Low Kick', type: 'light', damage: 1, knockback: 1, duration: 15, cooldown: 30, hitbox: { width: 60, height: 30, offsetX: 50, offsetY: 30 } },
  neutralHeavy: { name: 'Heavy Punch', type: 'heavy', damage: 8, knockback: 8, duration: 30, cooldown: 60, hitbox: { width: 60, height: 60, offsetX: 60, offsetY: 0 } },
  sideHeavy: { name: 'Heavy Side', type: 'heavy', damage: 10, knockback: 10, duration: 35, cooldown: 70, hitbox: { width: 70, height: 60, offsetX: 60, offsetY: 0 } },
  upHeavy: { name: 'Heavy Upper', type: 'heavy', damage: 9, knockback: 9, verticalKnockback: true, duration: 40, cooldown: 75, hitbox: { width: 50, height: 70, offsetX: 5, offsetY: -60 } },
  downHeavy: { name: 'Ground Slam', type: 'heavy', damage: 7, knockback: 7, duration: 30, cooldown: 80, hitbox: { width: 100, height: 40, offsetX: -20, offsetY: 20 } },
};

// Character data
export const characters = {
  kaon: {
    name: 'Kaon',
    image: 'path/to/kaon/image.png', // Replace with actual image path
    moveset: kaonMoveset,
    draw: drawKaon
  },
  rakka: {
    name: 'Rakka',
    image: 'path/to/rakka/image.png', // Replace with actual image path
    moveset: rakkaMoveset,
    draw: drawRakka
  },
  vanta: {
    name: 'Vanta',
    image: 'path/to/vanta/image.png', // Replace with actual image path
    moveset: defaultMoveset,
  },
  glitch: {
    name: 'Glitch',
    image: 'path/to/glitch/image.png', // Replace with actual image path
    moveset: defaultMoveset,
  },
  ember: {
    name: 'Ember',
    image: 'path/to/ember/image.png', // Replace with actual image path
    moveset: defaultMoveset,
  },
  aeon: {
    name: 'Aeon',
    image: 'path/to/aeon/image.png', // Replace with actual image path
    moveset: defaultMoveset,
  },
  ace: {
    name: 'Ace',
    image: 'path/to/ace/image.png', // Replace with actual image path
    moveset: defaultMoveset,
  },
  onyx: {
    name: 'Onyx',
    image: 'path/to/onyx/image.png', // Replace with actual image path
    moveset: defaultMoveset,
  },
  random: {
    name: 'Random',
    image: 'path/to/random/image.png', // Replace with actual image path
    moveset: defaultMoveset,
  }
};
// Function to get character by name
export function getCharacter(name) {
  return characters[name.toLowerCase()] || null;
}

