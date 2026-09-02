// Popup contextuelle sur un tap (clic sans glisser) directement sur le
// visuel affiché sur le modèle 3D : recadrer, recolorer, supprimer —
// sans repasser par la bande de vignettes. drag3d.ts distingue le tap
// du glisser par le déplacement total du pointeur entre pointerdown et
// pointerup : sous quelques pixels, c'est un tap.
import { S, activeLayer, type Layer } from './state';
import { syncEditor } from './layers';

// Même palette que le mode Texte (text-input.ts) — dupliquée plutôt que
// partagée pour ne pas coupler ce module au panneau texte : elle
// s'applique ici à n'importe quel calque à couleur connue, pas
// seulement au texte fraîchement créé.
const RECOLOR_SWATCHES = ['#17131F', '#ffffff', '#C81E1E', '#1E4FC8', '#F2C230', '#1F8A4C', '#F2790C', '#E0499B', '#6D28D9', '#7A4B2A', '#6B7280'];

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}

// Une couleur connue est un aplat unique sur fond transparent (texte
// généré, ou tout calque déjà recoloré par cette fonction) : la
// recoloration revient à substituer les pixels non transparents par la
// nouvelle teinte, sans avoir besoin de connaître le texte ou la police
// d'origine — même trick que la teinte du vêtement dans render.ts.
async function recolor(layer: Layer, hex: string): Promise<void> {
  const im = await loadImg(layer.img);
  const c = document.createElement('canvas');
  c.width = im.naturalWidth;
  c.height = im.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(im, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, c.width, c.height);
  layer.img = c.toDataURL('image/png');
  layer.knownColor = hex;
  layer.colors = 1;
  layer.colorSwatches = [hex];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  layer.dom = [r, g, b];
}

export function closeLayerPopup(): void {
  el('layerPopup').style.display = 'none';
}

export function openLayerPopup(layer: Layer, clientX: number, clientY: number): void {
  S.activeLayerId = layer.id;
  const popup = el('layerPopup');
  const croppable = !layer.knownColor;
  const recolorable = !!layer.knownColor;

  el('lpCrop').style.display = croppable ? '' : 'none';
  const colors = el('lpColors');
  colors.style.display = recolorable ? 'flex' : 'none';
  if (recolorable && !colors.childElementCount) {
    colors.innerHTML = RECOLOR_SWATCHES.map((hex) => `<button type="button" data-lpc="${hex}" style="background:${hex}" aria-label="Recolorer en ${hex}"></button>`).join('');
  }

  popup.style.display = 'flex';
  const rect = popup.getBoundingClientRect();
  const pad = 10;
  const left = Math.min(Math.max(pad, clientX - rect.width / 2), window.innerWidth - rect.width - pad);
  const top = Math.min(Math.max(pad, clientY - rect.height - 14), window.innerHeight - rect.height - pad);
  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
}

export function bindLayerPopup(): void {
  const popup = el('layerPopup');

  el('lpCrop').addEventListener('click', () => {
    closeLayerPopup();
    syncEditor();
    // #cropBtn est rendu visible par syncEditor() ci-dessus (le calque
    // ciblé vient d'être confirmé recadrable) juste avant ce clic
    // programmatique — ouvre directement l'outil de recadrage.
    document.getElementById('cropBtn')?.click();
  });

  el('lpDelete').addEventListener('click', () => {
    const layer = activeLayer();
    if (!layer) return;
    S.layers = S.layers.filter((l) => l.id !== layer.id);
    closeLayerPopup();
    syncEditor();
  });

  el('lpColors').addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-lpc]');
    if (!b) return;
    const layer = activeLayer();
    if (!layer) return;
    await recolor(layer, b.dataset.lpc!);
    syncEditor();
  });

  // Un clic n'importe où en dehors de la popup la referme — sur
  // pointerdown, pour se déclencher avant qu'un éventuel autre geste
  // (glisser sur le modèle) ne démarre.
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (popup.style.display === 'none') return;
      if (popup.contains(e.target as Node)) return;
      closeLayerPopup();
    },
    true
  );
}
