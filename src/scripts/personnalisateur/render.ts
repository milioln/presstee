// Rendu de la scène (modèle 3D rotatif), du diagnostic et du
// récapitulatif. Le support est un vrai modèle 3D (glTF, licence
// CC-BY-4.0 — crédit affiché en bas de page) : la couleur choisie et le visuel
// déposé sont composités dans la texture du vêtement (canvas 2D),
// puis appliqués comme baseColorTexture du matériau — le visuel suit
// donc le tissu quand on fait pivoter le modèle, au lieu d'un calque
// plat superposé à l'écran.
import { S } from './state';
import { place, widthCm, heightCm, dpi, qtyTotal, palierActuel, prixUnitaire, prixTotal, currentZoneCm } from './derived';
import { lum, lumRGB } from './color-utils';
import { TECHS, reco } from './recommendation';
import { saveState } from './state';
import { TAILLES, type Emplacement } from '../../config/parametres-metier';

export const activeTech = () => (S.tech === 'auto' ? reco(S.colors, qtyTotal()).k : S.tech);

const TEXTURE_URL = '/personnalisateur/model/textures/Material_baseColor.png';

// Zones d'impression calibrées empiriquement sur l'atlas de texture
// (patron à plat 2048×2048) en affichant une grille de repères sur le
// modèle chargé et en relevant où ils tombent sur le tissu. Le
// panneau "dos" est estimé par symétrie horizontale du panneau
// "face" — non calibré aussi précisément faute de vue arrière testée.
const PRINT_RECT: Record<Emplacement, { x: number; y: number; w: number; h: number }> = {
  face: { x: 370, y: 280, w: 360, h: 340 },
  coeur: { x: 630, y: 230, w: 130, h: 130 },
  dos: { x: 1270, y: 280, w: 360, h: 340 },
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

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
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
  if (S.img) {
    const rect = PRINT_RECT[place()];
    const logo = await loadImg(S.img);
    const w = rect.w * S.w;
    const h = w * (logo.naturalHeight / logo.naturalWidth);
    const cx = rect.x + rect.w * S.x;
    const cy = rect.y + rect.h * S.y;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((S.rot * Math.PI) / 180);
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
  const r = reco(S.colors, qtyTotal());
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
  if (activeTech() === 'serigraphie' && S.colors != null && S.colors > 5) {
    box += `<br><br>Attention : ${S.colors} couleurs en sérigraphie, c'est autant d'écrans à préparer. Le calage devient long et le prix grimpe vite.`;
  }
  el('recoBox').innerHTML = box;
}

export function paintWidth(): void {
  const zone = currentZoneCm();
  el('wCm').textContent = (S.w * zone).toFixed(1).replace('.', ',') + ' cm';
  el('wPct').textContent = `${Math.round(S.w * 100)} % de la zone imprimable (${zone} cm)`;
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
  if (!S.img) return;
  const w = widthCm();
  const h = heightCm();
  const dp = dpi();
  let rows = `<div class="dt">Analyse du fichier</div>`;
  rows += `<div class="line"><b>Format</b><span>${S.vector ? 'Vectoriel (SVG)' : `${S.natW} × ${S.natH} px`}</span></div>`;
  rows += `<div class="line"><b>Taille imprimée</b><span>${w.toFixed(1)} cm${h ? ` × ${h.toFixed(1)} cm` : ''}</span></div>`;
  rows += `<div class="line"><b>Couleurs</b><span>${S.vector ? 'à contrôler manuellement' : S.colors == null ? 'non analysées' : S.colors >= 12 ? '12 et plus' : S.colors}</span></div>`;
  const flags: [string, string][] = [];
  if (S.vector) {
    flags.push(['ok', 'Fichier vectoriel : la qualité sera parfaite quelle que soit la taille d’impression.']);
  } else if (dp != null) {
    if (dp >= 250) flags.push(['ok', `Résolution d’environ ${Math.round(dp)} dpi à cette taille : largement suffisante.`]);
    else if (dp >= 150) flags.push(['ok', `Résolution d’environ ${Math.round(dp)} dpi : correcte pour du textile.`]);
    else flags.push(['warn', `Résolution d’environ ${Math.round(dp)} dpi : trop basse à cette taille. Réduisez le visuel ou envoyez un fichier plus grand, idéalement vectoriel.`]);
  }
  if (S.dom) {
    const dl = lumRGB(...S.dom);
    const gl = lum(S.color.hex);
    if (Math.abs(dl - gl) < 0.1) {
      flags.push(['warn', 'Votre visuel et la couleur du vêtement sont très proches : le marquage risque de ne pas ressortir. Pensez à un contour ou à un autre coloris.']);
    }
  }
  if (S.colors != null && S.colors <= 3) {
    flags.push(['ok', `${S.colors} couleur${S.colors > 1 ? 's' : ''} à plat : c’est le cas idéal pour la sérigraphie.`]);
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
