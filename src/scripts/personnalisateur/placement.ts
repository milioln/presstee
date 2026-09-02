// Sélecteur d'emplacement (face / cœur / dos) — port direct de la V0.
// Le cœur est désactivé sur casquette (GARMENTS.casquette.noCoeur).
import { S } from './state';
import { place, placeSide } from './derived';
import { render, paintWidth } from './render';

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
    S.x = 0.5;
    S.y = 0.5;
    S.view = placeSide();
    syncPlace();
    paintWidth();
    render();
  });
}
