// Dépôt de fichier par glisser-déposer ou par clic — port direct de la V0.
import { S } from './state';
import { render, paintWidth } from './render';
import { analyse } from './file-analysis';
import { syncPlace } from './placement';

function loadFile(f: File): void {
  const r = new FileReader();
  r.onload = () => {
    Object.assign(S, {
      img: r.result as string,
      fileName: f.name,
      vector: f.type.includes('svg'),
      x: 0.5,
      y: 0.5,
      w: 0.62,
      rot: 0,
      colors: null,
      dom: null,
      natW: 0,
      natH: 0,
    });
    paintFileInfo(f.name);
    showPostUploadBlocks();
    syncPlace();
    paintWidth();
    analyse();
    render();
  };
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
