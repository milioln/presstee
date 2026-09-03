// Mode "Texte" : une alternative au dépôt de fichier — le texte tapé
// est rendu sur un canvas puis injecté dans le même circuit que
// n'importe quel visuel (loadDataUrl), donc l'analyse, le
// positionnement et le rendu 3D fonctionnent sans changement. Chaque
// validation ajoute un nouveau calque texte (cf. file-input.ts).
import { loadDataUrl } from './file-input';

export const FONTS = {
  archivo: { css: "'Archivo', sans-serif", weight: '800', label: 'Sans' },
  oswald: { css: "'Oswald', sans-serif", weight: '600', label: 'Condensé' },
  playfair: { css: "'Playfair Display', serif", weight: '700', label: 'Serif' },
  anton: { css: "'Anton', sans-serif", weight: '400', label: 'Impact' },
  bebas: { css: "'Bebas Neue', sans-serif", weight: '400', label: 'Affiche' },
  caveat: { css: "'Caveat', cursive", weight: '700', label: 'Script' },
  pacifico: { css: "'Pacifico', cursive", weight: '400', label: 'Manuscrit' },
  marker: { css: "'Permanent Marker', cursive", weight: '400', label: 'Feutre' },
  spacemono: { css: "'Space Mono', monospace", weight: '700', label: 'Mono' },
} as const;
type FontId = keyof typeof FONTS;

let textColor = '#17131F';
let fontId: FontId = 'archivo';

async function renderTextToDataUrl(text: string, color: string, fid: FontId): Promise<string> {
  const f = FONTS[fid];
  const fontSize = 140;
  const padding = 28;
  const font = `${f.weight} ${fontSize}px ${f.css}`;
  try {
    await document.fonts.load(font);
  } catch {
    // tant pis, on dessine avec la police de repli du navigateur
  }
  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = font;
  const width = Math.ceil(measure.measureText(text).width) + padding * 2;
  const height = fontSize + padding * 2;
  const c = document.createElement('canvas');
  c.width = Math.max(width, 40);
  c.height = height;
  const ctx = c.getContext('2d')!;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, c.width / 2, height / 2 + fontSize * 0.03);
  return c.toDataURL('image/png');
}

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

export function bindTextInput(): void {
  const input = el<HTMLInputElement>('textInput');
  const apply = async () => {
    const text = input.value.trim();
    if (!text) return;
    const dataUrl = await renderTextToDataUrl(text, textColor, fontId);
    loadDataUrl(dataUrl, `Texte : « ${text} »`, false, textColor);
    input.value = '';
    input.focus();
  };
  el('textApply').addEventListener('click', apply);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') apply();
  });
  el('textColors').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tc]');
    if (!b) return;
    textColor = b.dataset.tc!;
    el('textColors')
      .querySelectorAll('[data-tc]')
      .forEach((x) => x.classList.toggle('on', x === b));
  });
  el('textFonts').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tf]');
    if (!b) return;
    fontId = b.dataset.tf as FontId;
    el('textFonts')
      .querySelectorAll('[data-tf]')
      .forEach((x) => x.classList.toggle('on', x === b));
  });
}

export function bindModeTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode]'));
  tabs.forEach((b) =>
    b.addEventListener('click', () => {
      tabs.forEach((x) => x.classList.toggle('on', x === b));
      const mode = b.dataset.mode;
      el('drop').style.display = mode === 'image' ? 'block' : 'none';
      el('textMode').style.display = mode === 'text' ? 'grid' : 'none';
      el('designMode').style.display = mode === 'design' ? 'grid' : 'none';
    })
  );
}
