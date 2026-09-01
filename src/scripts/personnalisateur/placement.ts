// Sélecteur d'emplacement (face / cœur / dos) — port direct de la V0.
// Le cœur est désactivé sur casquette (GARMENTS.casquette.noCoeur).
import { S } from './state';
import { GARMENTS } from './garments';
import { place, placeSide } from './derived';
import { render } from './render';
import { syncSliders } from './sliders';

export function syncPlace(): void {
  const noC = !!GARMENTS[S.garment].noCoeur;
  document.querySelectorAll<HTMLButtonElement>('[data-p]').forEach((b) => {
    b.disabled = noC && b.dataset.p === 'coeur';
    b.classList.toggle('on', b.dataset.p === place());
  });
  const hint = document.getElementById('placeHint');
  if (hint) {
    hint.textContent = noC ? 'Face ou dos uniquement sur une casquette.' : 'Un seul emplacement par pièce. Le recto-verso se chiffre comme deux marquages.';
  }
}

export function bindPlacement(): void {
  document.getElementById('place')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-p]');
    if (!b || b.disabled) return;
    S.place = b.dataset.p as typeof S.place;
    S.x = 0.5;
    S.y = 0.5;
    S.view = placeSide();
    syncPlace();
    syncSliders();
    render();
  });
}
