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
import { TAILLES, seuils, type Emplacement } from '../../config/parametres-metier';

export const activeTech = () => (S.tech === 'auto' ? reco(totalColors(), qtyTotal()).k : S.tech);

const TEXTURE_URL = '/personnalisateur/model/textures/Material_baseColor.png';
export const TEXTURE_SIZE = 2048;

// Zones d'impression calibrées empiriquement sur l'atlas de texture
// (patron à plat 2048×2048) en affichant une grille de repères sur le
// modèle chargé et en relevant où ils tombent sur le tissu.
// "coeur" recalibré le 2026-09-03 (Milio a signalé que ça retombait au
// niveau du bas du tee-shirt) : le panneau avant est inversé
// verticalement dans l'atlas (cf. buildTextureDataUrl ci-dessous), donc
// un y proche du haut du patron (petit y) retombe près de l'ourlet une
// fois porté — l'ancien y:170 y était presque. Repéré en superposant le
// rectangle sur l'atlas et en mesurant le contour de l'encolure par
// échantillonnage de pixels (le panneau va de y≈112, l'ourlet, à
// y≈1020-1040 selon x, l'encolure) : le nouveau y place le centre par
// défaut vers 80 % de cette hauteur, sous l'encolure, au niveau du
// cœur — à réajuster si un vrai rendu à plat le dément.
// "face" et "dos" élargis le 2026-09-04 (Milio a signalé qu'un visuel à
// 100 % de largeur n'atteignait pas la zone attendue) : l'ancienne
// largeur (360) ne couvrait qu'environ 40 % du panneau réellement
// disponible (mesuré par échantillonnage de pixels sur l'atlas — le
// tissu blanc s'étend sur ~880-900px de large à hauteur de poitrine,
// contre 360px pour la zone déclarée). Repris à 620px, centré sur le
// panneau mesuré : assez large pour occuper la majeure partie de la
// poitrine/du dos sans empiéter sur les coutures latérales/emmanchures
// (vérifié en rendant plusieurs largeurs candidates sur le vrai modèle
// et en comparant visuellement où elles tombent par rapport aux
// coutures). "dos" n'est plus une simple symétrie de "face" : mesuré
// indépendamment, son panneau s'est révélé très proche (comme "face",
// à quelques px près) mais ce n'est plus une hypothèse. Resserré à
// 580px le jour même (Milio : « réduit un tout petit peu »), toujours
// centré sur le panneau mesuré.
// "manche-droite"/"manche-gauche" ajoutées le 2026-09-08 (demande Milio :
// permettre l'impression sur les manches) : repérées sous les deux
// grands panneaux face/dos dans l'atlas (deux formes trapézoïdales à
// bord inférieur incurvé — l'emmanchure). Identité droite/gauche
// vérifiée en rendant un texte directionnel sur chaque rectangle
// candidat et en lisant à l'écran, caméra de face (0deg) : le rectangle
// le plus à gauche de l'atlas (x≈750, "manche-droite") tombe sur la
// manche qui apparaît à l'écran à DROITE — convention "écran", comme sur
// une photo produit, pas le bras anatomique du porteur.
export const PRINT_RECT: Record<Emplacement, { x: number; y: number; w: number; h: number }> = {
  face: { x: 324, y: 210, w: 580, h: 750 },
  coeur: { x: 630, y: 750, w: 130, h: 280 },
  dos: { x: 1238, y: 210, w: 580, h: 750 },
  'manche-droite': { x: 750, y: 1325, w: 480, h: 195 },
  'manche-gauche': { x: 1360, y: 1325, w: 540, h: 195 },
};

// Tous les panneaux sont inversés verticalement dans l'atlas — vérifié
// empiriquement pour les manches avec un repère directionnel (une lettre
// asymétrique) le 2026-09-08 : un premier réglage à l'horizontale
// semblait correct sur un texte de 2-3 lettres à un angle particulier,
// mais un mot entier relu à plusieurs angles a confirmé que c'est bien
// l'axe vertical qui est inversé, comme face/cœur/dos — jamais fier
// d'une lecture rapide sur la surface courbe, toujours revérifier avec
// un mot lisible sous plusieurs angles.
const PANEL_SCALE: Record<Emplacement, { x: number; y: number }> = {
  face: { x: 1, y: -1 },
  coeur: { x: 1, y: -1 },
  dos: { x: 1, y: -1 },
  'manche-droite': { x: 1, y: -1 },
  'manche-gauche': { x: 1, y: -1 },
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
    // Chaque panneau a son propre retournement dans l'atlas UV (cf.
    // PANEL_SCALE ci-dessus) : on recompense en dessinant le visuel
    // inversé sur l'axe correspondant, pour qu'il se lise normalement
    // une fois plaqué sur le tissu.
    const panelScale = PANEL_SCALE[layer.place];
    ctx.scale(panelScale.x, panelScale.y);
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
  if (activeTech() === 'serigraphie' && total != null && total > seuils.couleursMaxSerigraphie) {
    box += `<br><br>Attention : ${total} couleurs cumulées en sérigraphie, c'est autant d'écrans à préparer. Le calage devient long et le prix grimpe vite.`;
  }
  el('recoBox').innerHTML = box;
}

export function paintWidth(): void {
  const layer = activeLayer();
  const zone = currentZoneCm();
  const wEl = el('wCm');
  const pEl = el('wPct');
  const lpSize = document.getElementById('lpSize') as HTMLInputElement | null;
  if (!layer) {
    wEl.textContent = '';
    pEl.textContent = '';
    return;
  }
  wEl.textContent = (layer.w * zone).toFixed(1).replace('.', ',') + ' cm';
  pEl.textContent = `${Math.round(layer.w * 100)} % de la zone imprimable (${zone} cm)`;
  // Curseur de la popup sur le mockup — même valeur que les boutons du
  // panneau latéral, synchronisée dans les deux sens (cf. layer-popup.ts).
  if (lpSize) lpSize.value = String(Math.round(layer.w * 100));
}

// Ramène un angle quelconque (les boutons ⟲/⟳ l'incrémentent sans
// limite) dans [-180, 180] : au-delà, le curseur de rotation (borné à
// cette plage) ne pourrait plus refléter l'angle réel du calque.
function normalizeDeg(deg: number): number {
  return (((deg % 360) + 540) % 360) - 180;
}

export function paintRotate(): void {
  const layer = activeLayer();
  const deg = Math.round(normalizeDeg(layer ? layer.rot : 0));
  el('rDeg').textContent = `${deg}°`;
  const rSlider = document.getElementById('rSlider') as HTMLInputElement | null;
  if (rSlider) rSlider.value = String(deg);
  const lpRotate = document.getElementById('lpRotate') as HTMLInputElement | null;
  const lpRotateVal = document.getElementById('lpRotateVal');
  if (lpRotate) lpRotate.value = String(deg);
  if (lpRotateVal) lpRotateVal.textContent = `${deg}°`;
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
  rows += `<div class="line"><b>Couleurs</b><span>${layer.colors == null ? 'à contrôler manuellement' : layer.colors >= 12 ? '12 et plus' : layer.colors}</span></div>`;
  if (layer.colorSwatches && layer.colorSwatches.length) {
    const removable = layer.colorSwatches.length > 1;
    rows += `<div class="line"><b>Détail</b><span class="colorswatches">${layer.colorSwatches
      .map(
        (h, i) =>
          `<button type="button" class="swatch${removable ? ' removable' : ''}" data-swatch="${i}" style="background:${h}" title="${removable ? `Retirer cette couleur (${h})` : h}" aria-label="${removable ? `Retirer cette couleur (${h})` : h}"></button>`
      )
      .join('')}</span></div>`;
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

// Retire une teinte détectée à tort (bruit d'anti-crénelage, fond
// parasite...) de l'analyse : décrémente le compte de couleurs utilisé
// pour la recommandation de technique et le calage sérigraphie/broderie,
// sans toucher aux pixels du visuel. Le dernier swatch ne peut pas être
// retiré (un visuel a toujours au moins une couleur).
export function removeColorSwatch(index: number): void {
  const layer = activeLayer();
  if (!layer || !layer.colorSwatches || layer.colorSwatches.length <= 1) return;
  layer.colorSwatches = layer.colorSwatches.filter((_, i) => i !== index);
  layer.colors = layer.colorSwatches.length;
  layer.colorsEdited = true;
  paintDiag();
  paintTechs();
  paintRecap();
  saveState();
}

const PLACE_LABEL_RECAP: Record<Emplacement, string> = { face: 'Face', coeur: 'Cœur', dos: 'Dos', 'manche-droite': 'Manche droite', 'manche-gauche': 'Manche gauche' };

export function paintRecap(): void {
  const t = activeTech();
  const qty = qtyTotal();
  const palier = palierActuel();
  // Petit résumé visuel (coloris + emplacement) en tête du récap, à côté
  // des lignes de prix déjà là — pendant de l'aperçu vivant du simulateur,
  // sans dupliquer le modèle 3D déjà visible juste au-dessus.
  el('recap').innerHTML =
    `<div class="recapPreview"><span class="recapPreview-sw" style="background:${S.color.hex}"></span><span>${S.color.nom} · ${PLACE_LABEL_RECAP[place()]}</span></div>` +
    `<div class="line"><b>Textile · palier ${palier.label}</b><span>${prixUnitaire().toFixed(2).replace('.', ',')} € / pièce</span></div>` +
    `<div class="line"><b>${qty} pièce${qty > 1 ? 's' : ''}</b><span>${prixTotal().toFixed(2).replace('.', ',')} €</span></div>` +
    `<div class="line"><b>Marquage ${TECHS[t].n}</b><span>chiffré à l'atelier</span></div>`;
}
