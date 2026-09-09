// Sélecteur d'emplacement (face / cœur / dos / manches) — port direct de
// la V0. Changer d'emplacement ne touche plus à la position d'un visuel
// unique : chaque calque garde la sienne, propre à son propre
// emplacement (cf. state.ts, layers.ts).
import { S } from './state';
import { place } from './derived';
import { syncEditor } from './layers';
import { emplacementsValides } from './garments';
import { getZoneImpressionCm, PLACE_LABEL, type Emplacement } from '../../config/parametres-metier';

// Les pastilles n'étaient jamais masquées ni réétiquetées selon le
// vêtement (S.garment) : on pouvait cliquer "Cœur" sur une casquette,
// qui n'a pas de cœur — place() le rabattait déjà silencieusement sur
// "face", sans jamais l'expliquer. Désormais la pastille elle-même
// disparaît, et son texte en cm max reflète le vrai vêtement plutôt que
// des valeurs figées dans le HTML (Milio, 2026-09-09 : « il ne faut pas
// mettre cœur [sur une casquette] »).
export function syncPlace(): void {
  const valides = new Set(emplacementsValides(S.garment));
  document.querySelectorAll<HTMLButtonElement>('[data-p]').forEach((b) => {
    const p = b.dataset.p as Emplacement;
    const ok = valides.has(p);
    b.hidden = !ok;
    b.classList.toggle('on', ok && p === place());
    if (ok) {
      const em = b.querySelector('em');
      if (em) em.textContent = `${getZoneImpressionCm(S.garment, p)} cm max`;
      const strong = b.querySelector('strong');
      if (strong) strong.textContent = PLACE_LABEL[p];
    }
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
