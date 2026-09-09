// Petit utilitaire partagé pour les clins d'œil disséminés sur le site
// (Milio, 2026-09-09 — menu validé en bloc) : un même toast, avec
// confettis en option, plutôt que de dupliquer la création de ces
// éléments à chaque nouvel easter egg. Reprend le motif visuel du tout
// premier (le clic sur le logo, Header.astro), dont le HTML/CSS reste
// tel quel — pas la peine de le refactorer pour ça, il fonctionne déjà.
const CONFETTI_COLORS = ['#9d83cf', '#ffd77a', '#BF3B32', '#1F5A4A', '#20304F', '#E4D6BD'];

export function showEggToast(text: string, confetti = false): void {
  if (confetti) {
    const layer = document.createElement('div');
    layer.className = 'eggLayer';
    for (let i = 0; i < 18; i++) {
      const bit = document.createElement('span');
      bit.className = 'eggBit';
      bit.style.left = `${Math.random() * 100}%`;
      bit.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      bit.style.animationDelay = `${(Math.random() * 0.4).toFixed(2)}s`;
      bit.style.animationDuration = `${(1.6 + Math.random() * 0.8).toFixed(2)}s`;
      layer.appendChild(bit);
    }
    document.body.append(layer);
    window.setTimeout(() => layer.remove(), 2700);
  }
  const toast = document.createElement('div');
  toast.className = 'eggToast';
  toast.textContent = text;
  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  window.setTimeout(() => toast.classList.remove('show'), 2200);
  window.setTimeout(() => toast.remove(), 2700);
}

// Fait clignoter puis se réaligner tous les repères de calage visibles
// sur la page actuelle — utilisé au chargement du bon à tirer et par le
// code Konami sitewide (cf. Header.astro).
export function pulseRegmarks(): void {
  document.querySelectorAll<HTMLElement>('.regmark').forEach((mark) => {
    mark.classList.remove('align');
    // Force un reflow pour pouvoir rejouer l'animation même si la classe
    // était déjà présente juste avant (retrigger manuel des keyframes).
    void mark.offsetWidth;
    mark.classList.add('align');
  });
}
