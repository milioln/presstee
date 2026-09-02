// Sélecteur d'emplacement (face / cœur / dos) — port direct de la V0.
// Le cœur est désactivé sur casquette (GARMENTS.casquette.noCoeur).
// Changer d'emplacement ne touche plus à la position d'un visuel
// unique : chaque calque garde la sienne, propre à son propre
// emplacement (cf. state.ts, layers.ts).
import { S } from './state';
import { place } from './derived';
import { syncEditor } from './layers';

export function syncPlace(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-p]').forEach((b) => {
    b.classList.toggle('on', b.dataset.p === place());
  });
}

export function bindPlacement(): void {
  document.getElementById('place')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-p]');
    if (!b) return;
    S.place = b.dataset.p as typeof S.place;
    syncPlace();
    syncEditor();
  });
}
