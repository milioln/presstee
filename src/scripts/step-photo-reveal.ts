// Clin d'œil : les photos d'étapes des pages /techniques/* se "révèlent"
// au survol, comme un tirage qui se développe (Milio, 2026-09-09, round 2
// du menu d'easter eggs — validé). Rejoue à chaque nouveau survol plutôt
// qu'une seule fois : c'est un clin d'œil, pas une transition d'état.
export function initStepPhotoReveal(): void {
  document.querySelectorAll<HTMLImageElement>('.steps-list .step-photo').forEach((img) => {
    img.addEventListener('mouseenter', () => {
      img.classList.remove('developing');
      void img.offsetWidth;
      img.classList.add('developing');
    });
  });
}
