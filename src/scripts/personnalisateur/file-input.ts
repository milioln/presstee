// Dépôt de fichier par glisser-déposer ou par clic — port direct de la
// V0. loadDataUrl() est le cœur partagé, réutilisé par le mode "Texte"
// (text-input.ts) qui produit lui aussi un visuel sous forme de data
// URL plutôt qu'un vrai fichier. Chaque appel ajoute un nouveau calque
// plutôt que de remplacer le visuel courant : plusieurs fichiers
// peuvent coexister (cf. layers.ts).
import { S, createLayer } from './state';
import { syncEditor } from './layers';

export function loadDataUrl(dataUrl: string, name: string, isVector: boolean, forcedColor?: string): void {
  const layer = createLayer({ img: dataUrl, fileName: name, vector: isVector, knownColor: forcedColor ?? null });
  S.layers.push(layer);
  S.activeLayerId = layer.id;
  syncEditor();
}

function loadFile(f: File): void {
  const r = new FileReader();
  r.onload = () => loadDataUrl(r.result as string, f.name, f.type.includes('svg'));
  r.readAsDataURL(f);
}

export function bindFileInput(): void {
  const drop = document.getElementById('drop')!;
  const file = document.getElementById('file') as HTMLInputElement;

  drop.addEventListener('click', () => file.click());
  file.addEventListener('change', (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) loadFile(f);
    file.value = '';
  });
  ['dragenter', 'dragover'].forEach((t) =>
    drop.addEventListener(t, (e) => {
      e.preventDefault();
      drop.classList.add('over');
    })
  );
  ['dragleave', 'drop'].forEach((t) =>
    drop.addEventListener(t, (e) => {
      e.preventDefault();
      drop.classList.remove('over');
    })
  );
  drop.addEventListener('drop', (e: DragEvent) => {
    const f = e.dataTransfer?.files?.[0];
    if (f && f.type.startsWith('image/')) loadFile(f);
  });
}
