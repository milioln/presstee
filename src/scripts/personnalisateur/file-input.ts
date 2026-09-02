// Dépôt de fichier par glisser-déposer ou par clic — port direct de la V0.
// loadDataUrl() est le cœur partagé, réutilisé par le mode "Texte"
// (text-input.ts) qui produit lui aussi un visuel sous forme de data
// URL plutôt qu'un vrai fichier.
import { S } from './state';
import { render, paintWidth } from './render';
import { analyse } from './file-analysis';
import { syncPlace } from './placement';

export function loadDataUrl(dataUrl: string, name: string, isVector: boolean): void {
  Object.assign(S, {
    img: dataUrl,
    fileName: name,
    vector: isVector,
    x: 0.5,
    y: 0.5,
    w: 0.62,
    rot: 0,
    colors: null,
    dom: null,
    natW: 0,
    natH: 0,
  });
  paintFileInfo(name);
  showPostUploadBlocks();
  syncPlace();
  paintWidth();
  analyse();
  render();
}

function loadFile(f: File): void {
  const r = new FileReader();
  r.onload = () => loadDataUrl(r.result as string, f.name, f.type.includes('svg'));
  r.readAsDataURL(f);
}

function paintFileInfo(name: string): void {
  const info = document.getElementById('fileInfo')!;
  info.innerHTML = `<div class="filerow"><img src="${S.img}" alt=""><span>${name}</span><button class="mini-btn" id="rm">Retirer</button></div>`;
  document.getElementById('rm')!.addEventListener('click', () => {
    Object.assign(S, { img: null, colors: null, dom: null });
    info.innerHTML = '';
    hidePostUploadBlocks();
    // render() persiste l'état courant (saveState), y compris img:null —
    // pas besoin d'un clearState() séparé, qui serait de toute façon
    // immédiatement écrasé.
    render();
  });
}

function showPostUploadBlocks(): void {
  const placeBlock = document.getElementById('placeBlock')!;
  const adjust = document.getElementById('adjust')!;
  placeBlock.style.display = 'block';
  adjust.style.display = 'block';
}

function hidePostUploadBlocks(): void {
  const placeBlock = document.getElementById('placeBlock')!;
  const adjust = document.getElementById('adjust')!;
  const diag = document.getElementById('diag')!;
  placeBlock.style.display = 'none';
  adjust.style.display = 'none';
  diag.style.display = 'none';
}

export function bindFileInput(): void {
  const drop = document.getElementById('drop')!;
  const file = document.getElementById('file') as HTMLInputElement;

  drop.addEventListener('click', () => file.click());
  file.addEventListener('change', (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) loadFile(f);
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

// Réaffiche l'UI de fichier déposé après restauration depuis le
// stockage local (persistance V1, section 6 du document de passage).
export function restoreFileUI(): void {
  if (!S.img) return;
  paintFileInfo(S.fileName || 'Visuel restauré');
  showPostUploadBlocks();
  syncPlace();
  paintWidth();
  analyse();
}
