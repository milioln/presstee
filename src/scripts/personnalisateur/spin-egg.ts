// Clin d'œil : un tour complet (360°) fait à la main sur le modèle 3D du
// configurateur déclenche un petit rebond du cadre, comme un salut
// (Milio, 2026-09-09, menu d'easter eggs validé — même principe que sur
// le t-shirt de l'accueil, hero/tshirt-hero.ts). Écoute en phase bulle,
// après le glisser de visuel (drag3d.ts, phase capture) : si un calque a
// intercepté le geste, aucun 'camera-change' ne sera émis de toute façon
// puisque l'orbite n'aura pas démarré.
export function bindSpinEgg(): void {
  const mv = document.getElementById('stage') as any;
  const frameEl = document.getElementById('frame');
  if (!mv || !frameEl) return;
  const frame: HTMLElement = frameEl;

  let dragging = false;
  let dragAccumDeg = 0;
  let lastThetaDeg: number | null = null;

  function onCameraChange(): void {
    if (!dragging) {
      lastThetaDeg = null;
      return;
    }
    try {
      const orbit = mv.getCameraOrbit();
      const thetaDeg = (orbit.theta * 180) / Math.PI;
      if (lastThetaDeg != null) {
        const delta = (((thetaDeg - lastThetaDeg + 180) % 360) + 360) % 360 - 180;
        dragAccumDeg += Math.abs(delta);
        if (dragAccumDeg >= 360) {
          dragAccumDeg = -Infinity;
          frame.classList.remove('spin-bounce');
          void frame.offsetWidth;
          frame.classList.add('spin-bounce');
        }
      }
      lastThetaDeg = thetaDeg;
    } catch {
      // API absente/différente : pas d'easter egg, tant pis.
    }
  }

  mv.addEventListener('camera-change', onCameraChange);
  mv.addEventListener('pointerdown', () => {
    dragging = true;
    dragAccumDeg = 0;
    lastThetaDeg = null;
  });
  window.addEventListener('pointerup', () => {
    dragging = false;
  });
  window.addEventListener('pointercancel', () => {
    dragging = false;
  });
}
