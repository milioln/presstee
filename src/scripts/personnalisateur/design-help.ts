// Espace "Pas de visuel ?" — le client peut décrire son projet
// (nombre de couleurs, format, notes libres) plutôt que d'être
// bloqué par l'absence de fichier. Le nombre de couleurs nourrit
// quand même la recommandation de technique (cf. derived.ts,
// totalColors()) ; format et notes sont de l'information libre à
// l'attention de l'atelier, incluse dans le devis (cf. cart.ts).
import { S, saveState } from './state';
import { paintTechs, paintRecap } from './render';

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

export function syncDesignHelp(): void {
  el<HTMLSelectElement>('designColors').value = S.designHelp.colors == null ? '' : String(S.designHelp.colors);
  el<HTMLInputElement>('designFormat').value = S.designHelp.format;
  el<HTMLTextAreaElement>('designNotes').value = S.designHelp.notes;

  // Un projet rechargé (« Modifier » depuis le panier, projet
  // enregistré) sans visuel mais avec une description doit rouvrir
  // directement l'onglet « Aide design », plutôt que de laisser la
  // saisie invisible derrière l'onglet "Image" par défaut.
  const { colors, format, notes } = S.designHelp;
  if (S.layers.length === 0 && (colors != null || format || notes)) {
    const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode]'));
    const designTab = tabs.find((b) => b.dataset.mode === 'design');
    if (designTab) {
      tabs.forEach((x) => x.classList.toggle('on', x === designTab));
      el('drop').style.display = 'none';
      el('textMode').style.display = 'none';
      el('designMode').style.display = 'grid';
    }
  }
}

export function bindDesignHelp(): void {
  el<HTMLSelectElement>('designColors').addEventListener('change', (e) => {
    const v = (e.target as HTMLSelectElement).value;
    S.designHelp.colors = v === '' ? null : parseInt(v, 10);
    paintTechs();
    paintRecap();
    saveState();
  });
  el<HTMLInputElement>('designFormat').addEventListener('input', (e) => {
    S.designHelp.format = (e.target as HTMLInputElement).value;
    saveState();
  });
  el<HTMLTextAreaElement>('designNotes').addEventListener('input', (e) => {
    S.designHelp.notes = (e.target as HTMLTextAreaElement).value;
    saveState();
  });
}
