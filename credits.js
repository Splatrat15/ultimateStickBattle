// credits.js
// Show credits overlay only when triggered by 'showCreditsOverlay' event

let creditsOverlay = null;

function showCreditsOverlay() {
  if (creditsOverlay) {
    creditsOverlay.style.display = 'flex';
    return;
  }
  creditsOverlay = document.createElement('div');
  creditsOverlay.style.position = 'fixed';
  creditsOverlay.style.top = '0';
  creditsOverlay.style.left = '0';
  creditsOverlay.style.width = '100vw';
  creditsOverlay.style.height = '100vh';
  creditsOverlay.style.background = 'rgba(20, 20, 40, 0.97)';
  creditsOverlay.style.display = 'flex';
  creditsOverlay.style.flexDirection = 'column';
  creditsOverlay.style.justifyContent = 'center';
  creditsOverlay.style.alignItems = 'center';
  creditsOverlay.style.zIndex = '9999';
  creditsOverlay.innerHTML = `
    <div style="background: #222; padding: 32px 48px; border-radius: 16px; box-shadow: 0 4px 32px #000a; text-align: center; color: #fff; max-width: 90vw; position: relative; min-width: 320px;">
      <h1 style="margin-bottom: 16px;">Ultimate Stick Battle</h1>
      <h2 style="margin-bottom: 24px;">Credits</h2>
      <p style="font-size: 1.2em; margin-bottom: 18px;">Creator, designer, and programmer: <b>Robert Thiel</b></p>
      <p style="font-size: 1.2em; margin-bottom: 28px;">Backers: <b>[Your Name]</b></p>
      <button id="backToMenuBtn" style="margin-top: 16px; padding: 10px 28px; font-size: 1.1em; background: #1976d2; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Back</button>
    </div>
  `;
  document.body.appendChild(creditsOverlay);

  document.getElementById('backToMenuBtn').onclick = () => {
    creditsOverlay.style.display = 'none';
  };
}

window.addEventListener('showCreditsOverlay', showCreditsOverlay); 