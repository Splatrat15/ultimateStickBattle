🕹️ Project Summary: Ultimate Stick Battle
🎯 Goal:
Build a 2D local multiplayer platform-fighter game (like Super Smash Bros) using only JavaScript, HTML5 Canvas, and CSS. The game is coded from scratch with no engines or frameworks.

🧠 Game Concept:
Title: Ultimate Stick Battle

Style: Stick figure visuals

Genre: 2D Platform Fighter

Players: Local 1v1 only for MVP

Core Gameplay:

Players knock each other off a stage

% damage increases knockback

Last one on the stage wins

🧱 MVP (Minimum Viable Product) Requirements:
✅ Local 1v1 controls (keyboard)

✅ 1 flat-stage (Final Destination style)

✅ 2 playable characters:

Kaon: Uses energy orbs/projectiles

Rakka: Shadowy sword-wielding samurai

✅ Basic movement: left/right/jump/fall

✅ At least 1 attack per character (with damage + knockback)

✅ Hitboxes, hurtboxes, and simple collision detection

✅ % Damage system that increases knockback

✅ Basic KO detection (falling off stage = lose)

✅ Minimal HUD: player names + % damage

✅ Win screen: “Player X Wins”

🛠 Tech Stack:
HTML5 Canvas for rendering

JavaScript (ES6+) for game logic

CSS for layout/styling

GitHub for version control

No frameworks or Docker (for now)

🧩 Planned Structure:
bash
Copy
Edit
ultimate-stick-battle/
├── index.html         # Launch page with <canvas>
├── style.css          # Basic styling
├── game.js            # Game loop + engine core
├── characters/        # Kaon.js, Rakka.js (character classes)
├── assets/            # Placeholder art/sounds
├── utils/             # Math, physics, input helpers
└── README.md
🔄 Development Approach:
Start with bare minimum prototype

Add complexity only after core is rock solid

Focus on tight controls and game feel

Future plans include:

More characters (balanced, unique playstyles)

More stages (some interactive)

Menu, character select, and online modes (later)