// Mode "Texte" : une alternative au dépôt de fichier — le texte tapé
// est rendu sur un canvas puis injecté dans le même circuit que
// n'importe quel visuel (loadDataUrl), donc l'analyse, le
// positionnement et le rendu 3D fonctionnent sans changement.
import { loadDataUrl } from './file-input';

let textColor = '#17131F';

async function renderTextToDataUrl(text: string, color: string): Promise<string> {
  const fontSize = 140;
  const padding = 28;
  const font = `800 ${fontSize}px Archivo, sans-serif`;
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
    const dataUrl = await renderTextToDataUrl(text, textColor);
    loadDataUrl(dataUrl, `Texte : « ${text} »`, false);
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
}

export function bindModeTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode]'));
  tabs.forEach((b) =>
    b.addEventListener('click', () => {
      tabs.forEach((x) => x.classList.toggle('on', x === b));
      const mode = b.dataset.mode;
      el('drop').style.display = mode === 'image' ? 'block' : 'none';
      el('textMode').style.display = mode === 'text' ? 'grid' : 'none';
    })
  );
}
