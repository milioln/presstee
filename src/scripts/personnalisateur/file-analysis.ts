// Analyse automatique du visuel actif : dimensions natives, estimation
// du nombre de couleurs, couleur dominante — port direct de la V0,
// étendu pour opérer sur le calque sélectionné plutôt que sur un
// visuel unique.
import { activeLayer } from './state';
import { paintDiag, paintTechs, paintRecap } from './render';

function toHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

// Le mode "Texte" connaît sa couleur avec certitude (c'est lui qui l'a
// dessinée) : layer.knownColor court-circuite l'échantillonnage de
// pixels, qui se laisse sinon tromper par l'anti-crénelage des
// contours de lettres (des pixels à moitié transparents, comptés à
// tort comme une deuxième couleur). Persisté avec le calque : ce
// raccourci doit aussi s'appliquer après un rechargement de page, pas
// seulement à la création du texte.
export function analyse(): void {
  const diag = document.getElementById('diag')!;
  const layer = activeLayer();
  if (!layer) {
    diag.style.display = 'none';
    return;
  }
  diag.style.display = 'grid';

  if (layer.knownColor) {
    const forcedColor = layer.knownColor;
    const im = new Image();
    im.onload = () => {
      layer.natW = im.naturalWidth;
      layer.natH = im.naturalHeight;
      layer.colors = 1;
      layer.colorSwatches = [forcedColor];
      const r = parseInt(forcedColor.slice(1, 3), 16);
      const g = parseInt(forcedColor.slice(3, 5), 16);
      const b = parseInt(forcedColor.slice(5, 7), 16);
      layer.dom = [r, g, b];
      paintDiag();
      paintTechs();
      paintRecap();
    };
    im.src = layer.img;
    return;
  }

  if (layer.vector) {
    // Toujours mesurer les dimensions natives (pour l'affichage "Taille
    // imprimée"), même si le nombre de couleurs d'un SVG ne se déduit
    // pas d'un échantillonnage pixel.
    const im = new Image();
    im.onload = () => {
      layer.natW = im.naturalWidth || 0;
      layer.natH = im.naturalHeight || 0;
      layer.colors = null;
      layer.dom = null;
      layer.colorSwatches = null;
      paintDiag();
      paintTechs();
      paintRecap();
    };
    im.onerror = () => {
      layer.colors = null;
      paintDiag();
    };
    im.src = layer.img;
    return;
  }

  const im = new Image();
  im.onload = () => {
    layer.natW = im.naturalWidth;
    layer.natH = im.naturalHeight;
    try {
      const n = 96;
      const c = document.createElement('canvas');
      c.width = c.height = n;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      // Pas de lissage à la réduction : l'interpolation par défaut mélange
      // les pixels voisins et invente des teintes intermédiaires qui
      // n'existent pas dans le fichier d'origine (faux positifs sur des
      // visuels à aplats francs).
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(im, 0, 0, n, n);
      const d = ctx.getImageData(0, 0, n, n).data;
      const map = new Map<number, { c: number; r: number; g: number; b: number }>();
      let tot = 0;
      for (let i = 0; i < d.length; i += 4) {
        // Seuil relevé : les pixels à demi transparents des contours
        // anti-crénelés (texte, formes) ne comptent pas comme une couleur.
        if (d[i + 3] < 128) continue;
        tot++;
        const k = ((d[i] >> 5) << 10) | ((d[i + 1] >> 5) << 5) | (d[i + 2] >> 5);
        const e = map.get(k) || { c: 0, r: 0, g: 0, b: 0 };
        e.c++;
        e.r += d[i];
        e.g += d[i + 1];
        e.b += d[i + 2];
        map.set(k, e);
      }
      const sig = [...map.values()].filter((e) => e.c > tot * 0.015).sort((a, b) => b.c - a.c);
      layer.colors = Math.max(1, sig.length);
      layer.colorSwatches = sig.slice(0, 12).map((e) => toHex(e.r / e.c, e.g / e.c, e.b / e.c));
      const t = sig[0];
      layer.dom = t ? [t.r / t.c, t.g / t.c, t.b / t.c] : null;
    } catch {
      layer.colors = null;
      layer.dom = null;
      layer.colorSwatches = null;
    }
    paintDiag();
    paintTechs();
    paintRecap();
  };
  im.onerror = () => {
    layer.colors = null;
    paintDiag();
  };
  im.src = layer.img;
}
