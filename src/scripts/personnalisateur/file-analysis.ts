// Analyse automatique du fichier déposé : dimensions natives, estimation
// du nombre de couleurs, couleur dominante — port direct de la V0.
import { S } from './state';
import { paintDiag, paintTechs, paintRecap } from './render';

export function analyse(): void {
  const diag = document.getElementById('diag')!;
  if (!S.img) {
    diag.style.display = 'none';
    return;
  }
  diag.style.display = 'grid';
  if (S.vector) {
    S.colors = null;
    S.dom = null;
    paintDiag();
    return;
  }
  const im = new Image();
  im.onload = () => {
    S.natW = im.naturalWidth;
    S.natH = im.naturalHeight;
    try {
      const n = 72;
      const c = document.createElement('canvas');
      c.width = c.height = n;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(im, 0, 0, n, n);
      const d = ctx.getImageData(0, 0, n, n).data;
      const map = new Map<number, { c: number; r: number; g: number; b: number }>();
      let tot = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 40) continue;
        tot++;
        const k = ((d[i] >> 5) << 10) | ((d[i + 1] >> 5) << 5) | (d[i + 2] >> 5);
        const e = map.get(k) || { c: 0, r: 0, g: 0, b: 0 };
        e.c++;
        e.r += d[i];
        e.g += d[i + 1];
        e.b += d[i + 2];
        map.set(k, e);
      }
      const sig = [...map.values()].filter((e) => e.c > tot * 0.012).sort((a, b) => b.c - a.c);
      S.colors = Math.max(1, sig.length);
      const t = sig[0];
      S.dom = t ? [t.r / t.c, t.g / t.c, t.b / t.c] : null;
    } catch {
      S.colors = null;
      S.dom = null;
    }
    paintDiag();
    paintTechs();
    paintRecap();
  };
  im.onerror = () => {
    S.colors = null;
    paintDiag();
  };
  im.src = S.img;
}
