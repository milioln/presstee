// Rendu de la scène (modèle 3D rotatif), du diagnostic et du
// récapitulatif. Le support est un vrai modèle 3D (glTF, licence
// CC-BY-4.0 — crédit affiché en bas de page) : la couleur choisie et
// tous les calques déposés (image et texte, plusieurs à la fois) sont
// composités dans la texture du vêtement (canvas 2D), puis appliqués
// comme baseColorTexture du matériau — les visuels suivent donc le
// tissu quand on fait pivoter le modèle, au lieu d'un calque plat
// superposé à l'écran.
import { S, activeLayer } from './state';
import { place, widthCm, heightCm, dpi, qtyTotal, palierActuel, prixUnitaire, prixTotal, currentZoneCm, totalColors } from './derived';
import { lum, lumRGB } from './color-utils';
import { TECHS, reco } from './recommendation';
import { saveState } from './state';
import { TAILLES, type Emplacement } from '../../config/parametres-metier';

export const activeTech = () => (S.tech === 'auto' ? reco(totalColors(), qtyTotal()).k : S.tech);

const TEXTURE_URL = '/personnalisateur/model/textures/Material_baseColor.png';
export const TEXTURE_SIZE = 2048;

// Zones d'impression calibrées empiriquement sur l'atlas de texture
// (patron à plat 2048×2048) en affichant une grille de repères sur le
// modèle chargé et en relevant où ils tombent sur le tissu. Le
// panneau "dos" est estimé par symétrie horizontale du panneau
// "face" — non calibré aussi précisément faute de vue arrière testée.
// La plage verticale (h) va nettement au-delà d'un cadrage "poitrine"
// classique pour laisser remonter un visuel jusque près du col.
// Exporté : réutilisé par drag3d.ts pour convertir les coordonnées UV
// du raycast en repère du visuel (layer.x/layer.y).
export const PRINT_RECT: Record<Emplacement, { x: number; y: number; w: number; h: number }> = {
  face: { x: 370, y: 210, w: 360, h: 750 },
  coeur: { x: 630, y: 170, w: 130, h: 320 },
  dos: { x: 1270, y: 210, w: 360, h: 750 },
};

let baseImgPromise: Promise<HTMLImageElement> | null = null;
function loadBaseImg(): Promise<HTMLImageElement> {
  if (!baseImgPromise) {
    baseImgPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = TEXTURE_URL;
    });
  }
  return baseImgPromise;
}

// Cache par data URL : le repositionnement (glisser, flèches) déclenche
// un rendu à chaque frame, avec plusieurs calques il serait coûteux de
// redécoder chaque image à chaque fois.
const imgCache = new Map<string, Promise<HTMLImageElement>>();
function loadImgCached(src: string): Promise<HTMLImageElement> {
  let p = imgCache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    imgCache.set(src, p);
  }
  return p;
}

async function buildTextureDataUrl(): Promise<string> {
  const base = await loadBaseImg();
  const c = document.createElement('canvas');
  c.width = base.naturalWidth;
  c.height = base.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(base, 0, 0);
  // Teinte tout le vêtement (silhouette préservée par l'alpha du PNG).
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = S.color.hex;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.globalCompositeOperation = 'source-over';
  for (const layer of S.layers) {
    const rect = PRINT_RECT[layer.place];
    const logo = await loadImgCached(layer.img);
    const w = rect.w * layer.w;
    const ratio = logo.naturalWidth && logo.naturalHeight ? logo.naturalHeight / logo.naturalWidth : 1;
    const h = w * ratio;
    const cx = rect.x + rect.w * layer.x;
    const cy = rect.y + rect.h * layer.y;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((layer.rot * Math.PI) / 180);
    // Le panneau avant du modèle est retourné verticalement dans l'atlas
    // UV (vérifié empiriquement avec un visuel directionnel) : on
    // recompense en dessinant le visuel inversé sur l'axe Y, pour qu'il
    // se lise normalement une fois plaqué sur le tissu.
    ctx.scale(1, -1);
    ctx.drawImage(logo, -w / 2, -h / 2, w, h);
    ctx.restore();
  }
  return c.toDataURL('image/png');
}

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

// Le typage de <model-viewer> vient du package mais son API interne
// (model.materials, createTexture) n'est pas exposée dans les .d.ts —
// on la traite en any à cette frontière précise.
function stage(): any {
  return document.getElementById('stage');
}

let applying = false;
let reapplyQueued = false;

async function applyTexture(): Promise<void> {
  const mv = stage();
  if (!mv || !mv.model) return;
  if (applying) {
    reapplyQueued = true;
    return;
  }
  applying = true;
  try {
    const dataUrl = await buildTextureDataUrl();
    const material = mv.model.materials[0];
    const texture = await mv.createTexture(dataUrl);
    material.pbrMetallicRoughness.baseColorTexture.setTexture(texture);
  } finally {
    applying = false;
    if (reapplyQueued) {
      reapplyQueued = false;
      applyTexture();
    }
  }
}

export function syncCamera(): void {
  const mv = stage();
  if (!mv) return;
  mv.cameraOrbit = place() === 'dos' ? '180deg 85deg 105%' : '0deg 85deg 105%';
}

export function render(): void {
  const mv = stage();
  if (mv && mv.loaded) {
    applyTexture();
  } else if (mv) {
    mv.addEventListener('load', () => applyTexture(), { once: true });
  }
  syncCamera();
  paintTechs();
  paintDiag();
  paintRecap();
  saveState();
}

export function paintTechs(): void {
  const total = totalColors();
  const r = reco(total, qtyTotal());
  const act = activeTech();
  el('techs').innerHTML = (Object.keys(TECHS) as (keyof typeof TECHS)[])
    .map((k) => {
      const note = S.tech === 'auto' && act === k ? 'Recommandé' : S.tech === k ? 'Choisi' : '';
      return `<button class="tech${act === k ? ' on' : ''}" data-t="${k}">
      <div class="th">${TECHS[k].n}${note ? `<span class="tag">${note}</span>` : ''}</div>
      <p>${TECHS[k].d}</p></button>`;
    })
    .join('');
  el('resetTech').style.display = S.tech === 'auto' ? 'none' : 'block';
  let box = `<strong>${TECHS[r.k].n}</strong> — ${r.why}`;
  if (S.tech !== 'auto' && S.tech !== r.k) box += `<br><br>Vous avez choisi ${TECHS[S.tech].n}. ${TECHS[S.tech].good}`;
  if (activeTech() === 'serigraphie' && total != null && total > 5) {
    box += `<br><br>Attention : ${total} couleurs cumulées en sérigraphie, c'est autant d'écrans à préparer. Le calage devient long et le prix grimpe vite.`;
  }
  el('recoBox').innerHTML = box;
}

export function paintWidth(): void {
  const layer = activeLayer();
  const zone = currentZoneCm();
  const wEl = el('wCm');
  const pEl = el('wPct');
  if (!layer) {
    wEl.textContent = '';
    pEl.textContent = '';
    return;
  }
  wEl.textContent = (layer.w * zone).toFixed(1).replace('.', ',') + ' cm';
  pEl.textContent = `${Math.round(layer.w * 100)} % de la zone imprimable (${zone} cm)`;
}

export function paintRotate(): void {
  const layer = activeLayer();
  el('rDeg').textContent = `${Math.round(layer ? layer.rot : 0)}°`;
}

export function paintSizeDist(): void {
  const max = Math.max(1, ...TAILLES.map((t) => S.sizeDist[t]));
  el('sizeRows').innerHTML = TAILLES.map(
    (t) => `<div class="szrow">
      <span class="szcode">${t}</span>
      <div class="szbar"><div style="width:${Math.min(100, (S.sizeDist[t] / max) * 100)}%"></div></div>
      <span class="szn">${S.sizeDist[t]}</span>
      <button class="mini-step" data-sz="${t}" data-d="-1" aria-label="Moins de ${t}">−</button>
      <button class="mini-step" data-sz="${t}" data-d="1" aria-label="Plus de ${t}">+</button>
    </div>`
  ).join('');
  el('sizeTotal').textContent = `${qtyTotal()} pièce${qtyTotal() > 1 ? 's' : ''}`;
}

export function paintDiag(): void {
  const diag = el('diag');
  const layer = activeLayer();
  if (!layer) {
    diag.style.display = 'none';
    return;
  }
  diag.style.display = 'grid';
  const w = widthCm();
  const h = heightCm();
  const dp = dpi();
  let rows = `<div class="dt">Analyse du visuel sélectionné</div>`;
  rows += `<div class="line"><b>Format</b><span>${layer.vector ? 'Vectoriel (SVG)' : `${layer.natW} × ${layer.natH} px`}</span></div>`;
  rows += `<div class="line"><b>Taille imprimée</b><span>${w.toFixed(1)} cm${h ? ` × ${h.toFixed(1)} cm` : ''}</span></div>`;
  rows += `<div class="line"><b>Couleurs</b><span>${layer.vector ? 'à contrôler manuellement' : layer.colors == null ? 'non analysées' : layer.colors >= 12 ? '12 et plus' : layer.colors}</span></div>`;
  if (layer.colorSwatches && layer.colorSwatches.length) {
    rows += `<div class="line"><b>Détail</b><span class="colorswatches">${layer.colorSwatches.map((h) => `<i style="background:${h}" title="${h}"></i>`).join('')}</span></div>`;
  }
  if (S.layers.length > 1) {
    const total = totalColors();
    rows += `<div class="line"><b>Total tous visuels</b><span>${total == null ? 'à contrôler manuellement' : total >= 12 ? '12 et plus' : total}</span></div>`;
  }
  const flags: [string, string][] = [];
  if (layer.vector) {
    flags.push(['ok', 'Fichier vectoriel : la qualité sera parfaite quelle que soit la taille d’impression.']);
  } else if (dp != null) {
    if (dp >= 250) flags.push(['ok', `Résolution d’environ ${Math.round(dp)} dpi à cette taille : largement suffisante.`]);
    else if (dp >= 150) flags.push(['ok', `Résolution d’environ ${Math.round(dp)} dpi : correcte pour du textile.`]);
    else flags.push(['warn', `Résolution d’environ ${Math.round(dp)} dpi : trop basse à cette taille. Réduisez le visuel ou envoyez un fichier plus grand, idéalement vectoriel.`]);
  }
  if (layer.dom) {
    const dl = lumRGB(...layer.dom);
    const gl = lum(S.color.hex);
    if (Math.abs(dl - gl) < 0.1) {
      flags.push(['warn', 'Votre visuel et la couleur du vêtement sont très proches : le marquage risque de ne pas ressortir. Pensez à un contour ou à un autre coloris.']);
    }
  }
  if (layer.colors != null && layer.colors <= 3) {
    flags.push(['ok', `${layer.colors} couleur${layer.colors > 1 ? 's' : ''} à plat : c’est le cas idéal pour la sérigraphie.`]);
  }
  rows += flags.map(([kind, text]) => `<div class="flag ${kind}">${text}</div>`).join('');
  diag.innerHTML = rows;
}

export function paintRecap(): void {
  const t = activeTech();
  const qty = qtyTotal();
  const palier = palierActuel();
  el('recap').innerHTML =
    `<div class="line"><b>Textile · palier ${palier.label}</b><span>${prixUnitaire().toFixed(2).replace('.', ',')} € / pièce</span></div>` +
    `<div class="line"><b>${qty} pièce${qty > 1 ? 's' : ''}</b><span>${prixTotal().toFixed(2).replace('.', ',')} €</span></div>` +
    `<div class="line"><b>Marquage ${TECHS[t].n}</b><span>chiffré à l'atelier</span></div>`;
}
