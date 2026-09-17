// Rendu de la scène (modèle 3D rotatif), du diagnostic et du
// récapitulatif. Le support est un vrai modèle 3D (glTF, licence
// CC-BY-4.0 — crédit affiché en bas de page) : la couleur choisie et
// tous les calques déposés (image et texte, plusieurs à la fois) sont
// composités dans la texture du vêtement (canvas 2D), puis appliqués
// comme baseColorTexture du matériau — les visuels suivent donc le
// tissu quand on fait pivoter le modèle, au lieu d'un calque plat
// superposé à l'écran.
import { S, activeLayer } from './state';
import { place, widthCm, heightCm, dpi, qtyTotal, qtyActiveColor, palierActuel, prixUnitaire, prixTotal, currentZoneCm, totalColors } from './derived';
import { lum, lumRGB } from './color-utils';
import { TECHS, reco } from './recommendation';
import { saveState } from './state';
import { TAILLES, seuils, PLACE_LABEL, type Garment } from '../../config/parametres-metier';
import { PRINT_RECT, PANEL_SCALE, TEXTURE_SIZE } from './print-zones';

export const activeTech = () => (S.tech === 'auto' ? reco(totalColors(), qtyTotal()).k : S.tech);

const TEXTURE_URL = '/personnalisateur/model/textures/Material_baseColor.png';

// Sweat garde le même patron que le t-shirt (torse, UV) et prolonge
// juste des sommets (manches, capuche) : la texture et les zones
// d'impression (print-zones.ts) restent donc valables sans changement.
// Chemise, polo et casquette ont une topologie totalement différente
// (personnages Quaternius posés, dôme+visière pour la casquette — cf.
// leur crédit dans main.ts) mais réutilisent la MÊME texture partagée :
// chaque maillage a été repeint avec un UV qui pointe panneau avant
// vers le rectangle d'impression "face", panneau arrière vers "dos",
// manches vers "manche-droite/gauche", donc les visuels déposés dans le
// configurateur s'y affichent correctement sans rien changer ici.
// Le nom de fichier ne change jamais d'un correctif à l'autre : sans
// paramètre de version, OVH/le navigateur peuvent continuer à servir
// l'ancien .gltf en cache après un déploiement (cf. la même remarque déjà
// faite pour les photos secteurs). On ne bump la version que pour les
// modèles réellement retouchés.
const MODEL_URL: Partial<Record<Garment, string>> = {
  sweat: '/personnalisateur/model/sweat/scene.gltf',
  chemise: '/personnalisateur/model/chemise/scene.gltf?v=4',
  polo: '/personnalisateur/model/polo/scene.gltf?v=3',
  casquette: '/personnalisateur/model/casquette/scene.gltf?v=3',
};
const DEFAULT_MODEL_URL = '/personnalisateur/model/scene.gltf';

export function modelUrlForGarment(garment: Garment): string {
  return MODEL_URL[garment] ?? DEFAULT_MODEL_URL;
}

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

// Boutons de la chemise/du polo (Milio, 2026-09-17 : « il ne faut pas
// que les boutons soient par-dessus le textile », puis « le polo il n'y
// a pas les trois boutons sur le col de devant ») — peints à même la
// texture plutôt que modélisés en relief : un petit bombé 3D collé sur
// la surface se voyait toujours comme un objet posé au-dessus du tissu,
// quels que soient ses normales. Un décalque ton sur ton (assombrissement
// semi-transparent, pas une couleur fixe) s'adapte automatiquement au
// coloris choisi et reste toujours à plat sur le tissu.
// Repères en pixels dans le rectangle d'impression "face" de l'atlas
// (PRINT_RECT.face, 2048×2048) — le panneau y est inversé verticalement
// (cf. PANEL_SCALE.face.y = -1) : le haut physique du vêtement (près du
// col) correspond au bas du rectangle en pixels, pas au haut.
const BUTTON_COLUMN_V_FRAC: Partial<Record<Garment, number[]>> = {
  polo: [0.87, 0.77, 0.67],
  chemise: [0.92, 0.78, 0.64, 0.5, 0.36, 0.22],
};
const BUTTON_RADIUS_PX = 15;

function drawButtons(ctx: CanvasRenderingContext2D): void {
  const vFracs = BUTTON_COLUMN_V_FRAC[S.garment];
  if (!vFracs) return;
  const rect = PRINT_RECT.face;
  const cx = rect.x + rect.w * 0.5;
  // Un décalque à assombrissement fixe devient invisible sur un coloris
  // déjà foncé (noir sur noir) : un léger "emboss" (ombre + reflet des
  // deux côtés) reste lisible quel que soit le coloris choisi, sans
  // avoir à connaître sa luminosité. Les trous de couture, eux, changent
  // de teinte selon la luminance du coloris pour rester visibles.
  const dark = lum(S.color.hex) > 0.4;
  const holeColor = dark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)';
  for (const vFrac of vFracs) {
    // v_frac=1 (haut physique, près du col) -> bas du rectangle pixel
    // (rect.y + rect.h) : mapping direct, comme dans le script Python qui
    // peint cet UV (v = v0 + v_frac*(v1-v0)) — PANEL_SCALE ne compense que
    // l'orientation d'une IMAGE dessinée, pas un point posé directement.
    const cy = rect.y + rect.h * vFrac;
    const r = BUTTON_RADIUS_PX;
    ctx.beginPath();
    ctx.arc(cx + 1.6, cy + 1.6, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - 1.6, cy - 1.6, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.stroke();
    // deux petits trous de couture, discrets.
    ctx.fillStyle = holeColor;
    ctx.beginPath();
    ctx.arc(cx - 4, cy, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 4, cy, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
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
  drawButtons(ctx);
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
    // Cadre discret autour du visuel : montre que c'est une zone
    // cliquable/déplaçable directement sur le mockup, sans se faire
    // remarquer plus que ça (Milio, 2026-09-09 : « un cadre... pas trop
    // visible »). En pointillés pour bien le distinguer d'un vrai
    // contour imprimé. Clin d'œil : le cadre du calque qu'on vient de
    // sélectionner (cf. pulseLayerFrame) se resserre brièvement, comme un
    // déclic d'appareil photo (menu d'easter eggs validé le même jour).
    const pulsing = layer.id === pulseLayerId;
    const pulseT = pulsing ? Math.min(1, (performance.now() - pulseStartedAt) / PULSE_DURATION) : 0;
    const pulseEase = Math.sin(pulseT * Math.PI);
    ctx.setLineDash([18, 10]);
    ctx.lineWidth = 5 + pulseEase * 5;
    ctx.strokeStyle = `rgba(157,131,207,${(0.55 + pulseEase * 0.4).toFixed(2)})`;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
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

// Budget large (3s) plutôt qu'un compte de frames : sur les modèles
// custom (chemise/polo/casquette), qui ont depuis gagné pas mal de
// sommets (uv seamless, cf. assign_uv_seamless), mv.model peut mettre
// plus de quelques frames à être prêt après 'load' selon la machine —
// avec seulement 5 tentatives, ce cas restait bloqué sur la silhouette
// brute indéfiniment (Milio, 2026-09-18 : "la manche droite est buggée"
// — en réalité la texture pas encore appliquée, pas une vraie casse de
// géométrie, confirmé en forçant un nouveau rendu à la main).
const APPLY_TEXTURE_RETRY_MS = 3000;
const APPLY_TEXTURE_RETRY_STEP_MS = 100;

async function applyTexture(elapsedMs = 0): Promise<void> {
  const mv = stage();
  if (!mv) return;
  if (!mv.model) {
    if (elapsedMs < APPLY_TEXTURE_RETRY_MS) {
      window.setTimeout(() => applyTexture(elapsedMs + APPLY_TEXTURE_RETRY_STEP_MS), APPLY_TEXTURE_RETRY_STEP_MS);
    }
    return;
  }
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
  } catch (err) {
    // Juste après 'load', le matériau interne de <model-viewer> peut ne
    // pas encore être prêt à recevoir une texture (upload GPU du glTF
    // encore en cours) : setTexture() échoue alors silencieusement et la
    // silhouette brute du PNG (non teintée) reste affichée indéfiniment
    // (Milio, 2026-09-17). On retente pendant quelques secondes plutôt
    // que d'abandonner.
    if (elapsedMs < APPLY_TEXTURE_RETRY_MS) {
      window.setTimeout(() => applyTexture(elapsedMs + APPLY_TEXTURE_RETRY_STEP_MS), APPLY_TEXTURE_RETRY_STEP_MS);
    }
  } finally {
    applying = false;
    if (reapplyQueued) {
      reapplyQueued = false;
      applyTexture();
    }
  }
}

// render() est appelé très souvent (glisser un calque, ajuster sa
// taille/rotation, changer de coloris ou de technique...), pas
// seulement quand on bascule face/dos. Réassigner cameraOrbit à chaque
// fois écrasait le zoom/l'angle que le visiteur venait de régler à la
// main, donnant l'impression que le t-shirt "décentrait" tout seul au
// moindre clic (Milio, 2026-09-15). On ne recadre donc la caméra que
// lorsque la face affichée change réellement ; force=true (bouton
// "réinitialiser la vue") l'impose malgré tout.
let lastSyncedKey: string | null = null;

// La casquette n'a pas de face plate comme un t-shirt : vue de face
// pile (0deg), la visière se voit à peine (raccourci) et le dôme
// paraît juste rond. Un angle 3/4 la montre bien mieux — cf. Milio,
// 2026-09-16 : « elle tire la gueule » (le dôme+visière vus de face se
// confondaient en silhouette ronde).
function cameraOrbitFor(target: 'face' | 'dos'): string {
  if (S.garment === 'casquette') return target === 'dos' ? '205deg 80deg 100%' : '25deg 80deg 100%';
  return target === 'dos' ? '180deg 85deg 105%' : '0deg 85deg 105%';
}

export function syncCamera(force = false): void {
  const mv = stage();
  if (!mv) return;
  const target = place() === 'dos' ? 'dos' : 'face';
  const key = `${S.garment}:${target}`;
  if (!force && key === lastSyncedKey) return;
  lastSyncedKey = key;
  mv.cameraOrbit = cameraOrbitFor(target);
}

// Même logique que syncCamera : ne change le src du <model-viewer> que
// lorsque le vêtement change vraiment (pas à chaque render()), sinon le
// modèle se recharge en boucle et perd son angle de vue à chaque clic.
let lastSyncedGarment: Garment | null = null;

// 'load' se déclenche parfois avant que <model-viewer> ait vraiment fini
// de préparer son matériau interne — on attend qu'il ait digéré ce
// premier cycle de rendu (updateComplete + deux frames) avant de peindre
// notre texture, sinon le setTexture() de applyTexture() atterrit trop
// tôt et la silhouette brute du glTF (non teintée) reste affichée
// indéfiniment au premier chargement (Milio, 2026-09-17).
async function applyTextureWhenReady(): Promise<void> {
  const mv = stage();
  if (!mv) return;
  if (mv.updateComplete) await mv.updateComplete;
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  await applyTexture();
}

// Retourne true si le vêtement vient de changer (un nouveau modèle est en
// cours de chargement) : render() ne doit alors pas poser son propre
// listener 'load' en plus de celui-ci, ni s'appuyer sur mv.loaded qui
// reste momentanément à sa valeur précédente juste après avoir modifié
// mv.src (Milio, 2026-09-17 : sweat/chemise/polo/casquette affichés en
// noir et blanc au tout premier chargement, à cause de ce double listener
// et de ce mv.loaded pas encore fiable).
export function syncModel(): boolean {
  const mv = stage();
  if (!mv) return false;
  if (S.garment === lastSyncedGarment) return false;
  lastSyncedGarment = S.garment;
  // Le listener est posé AVANT de changer mv.src : si le glTF est déjà en
  // cache et que 'load' se déclenche très vite, on ne veut pas risquer de
  // le manquer en l'attachant après coup.
  mv.addEventListener('load', () => { void applyTextureWhenReady(); }, { once: true });
  mv.src = modelUrlForGarment(S.garment);
  return true;
}

export function render(): void {
  const mv = stage();
  const justSwitchedModel = syncModel();
  if (!justSwitchedModel && mv && mv.loaded) {
    applyTexture();
  }
  syncCamera();
  paintTechs();
  paintDiag();
  paintRecap();
  saveState();
}

// Clin d'œil : fait "clicker" brièvement le cadre du calque qu'on vient
// de sélectionner directement sur le mockup (cf. layers.ts, selectLayer)
// — quelques repeints successifs de la texture le temps d'un court pulse
// plutôt qu'une vraie boucle d'animation, cohérent avec le reste du
// module qui ne fait déjà que peindre un canvas à la demande.
let pulseLayerId: string | null = null;
let pulseStartedAt = 0;
const PULSE_DURATION = 420;

export function pulseLayerFrame(id: string): void {
  pulseLayerId = id;
  pulseStartedAt = performance.now();
  const tick = () => {
    if (!pulseLayerId) return;
    if (performance.now() - pulseStartedAt >= PULSE_DURATION) {
      pulseLayerId = null;
      render();
      return;
    }
    render();
    window.setTimeout(tick, 60);
  };
  tick();
}

export function paintTechs(): void {
  const total = totalColors();
  const r = reco(total, qtyTotal());
  const act = activeTech();
  // La technique recommandée passe toujours en tête de liste et garde
  // son étiquette "Recommandé", même si le client a choisi autre chose
  // à la main — auparavant l'étiquette disparaissait dès qu'on
  // s'écartait du conseil, sans plus rien distinguer les deux cartes
  // (Milio, 2026-09-09 : « il faut toujours mettre en premier la case
  // conseillée »).
  const keys = (Object.keys(TECHS) as (keyof typeof TECHS)[]).sort((a, b) => (a === r.k ? -1 : b === r.k ? 1 : 0));
  el('techs').innerHTML = keys
    .map((k) => {
      const note = k === r.k ? 'Recommandé' : S.tech !== 'auto' && S.tech === k ? 'Choisi' : '';
      return `<button class="tech${act === k ? ' on' : ''}" data-t="${k}">
      <div class="th">${TECHS[k].n}${note ? `<span class="tag">${note}</span>` : ''}</div>
      <p>${TECHS[k].d}</p></button>`;
    })
    .join('');
  el('resetTech').style.display = S.tech === 'auto' ? 'none' : 'block';
  // Deux informations différentes, jusqu'ici mélangées dans un seul bloc
  // de texte : pourquoi on conseille X, et ce qu'implique le fait d'avoir
  // choisi Y à la place — bien séparées visuellement plutôt qu'un
  // paragraphe qui enchaîne les deux sans le dire (Milio, 2026-09-10 :
  // « une séparation entre l'info sur le conseil et l'info de la
  // personnalisation choisie »).
  let box = `<div class="recoBlock recoBlock-conseil"><span class="recoBlock-label">Conseillé</span><p><strong>${TECHS[r.k].n}</strong> — ${r.why}</p></div>`;
  if (S.tech !== 'auto' && S.tech !== r.k) {
    box += `<div class="recoBlock recoBlock-choix"><span class="recoBlock-label">Votre choix</span><p><strong>${TECHS[S.tech].n}</strong> — ${TECHS[S.tech].good}</p></div>`;
  }
  if (activeTech() === 'serigraphie' && total != null && total > seuils.couleursMaxSerigraphie) {
    box += `<div class="recoBlock recoBlock-attention"><span class="recoBlock-label">Attention</span><p>${total} couleurs cumulées en sérigraphie, c'est autant d'écrans à préparer. Le calage devient long et le prix grimpe vite.</p></div>`;
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
  // Le total de ce panneau porte sur le seul coloris affiché — le total
  // du projet, tous coloris confondus, reste dans le récap (paintRecap).
  const activeQty = qtyActiveColor();
  el('sizeTotal').textContent = `${activeQty} pièce${activeQty > 1 ? 's' : ''}`;
  const sizeActiveColorEl = document.getElementById('sizeActiveColor');
  if (sizeActiveColorEl) {
    sizeActiveColorEl.innerHTML = S.colorLots.length > 1 ? `Pour <b>${S.color.nom}</b> — cliquez un autre coloris dans le panneau 2 pour éditer le sien.` : '';
  }
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
    else {
      flags.push([
        'warn',
        `Résolution d’environ ${Math.round(dp)} dpi : trop basse à cette taille. Réduisez le visuel ou envoyez un fichier plus grand, idéalement vectoriel.` +
          `<label class="diagAssist"><input type="checkbox" id="qualiteAssistance"${layer.qualiteAssistance ? ' checked' : ''} /> Laissez-nous nous en occuper — je continue ma commande, l’atelier améliore le fichier avant impression</label>`,
      ]);
    }
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

export function paintRecap(): void {
  const t = activeTech();
  const qty = qtyTotal();
  const palier = palierActuel();
  // Petit résumé visuel (coloris + emplacement) en tête du récap, à côté
  // des lignes de prix déjà là — pendant de l'aperçu vivant du simulateur,
  // sans dupliquer le modèle 3D déjà visible juste au-dessus.
  el('recap').innerHTML =
    `<div class="recapPreview"><span class="recapPreview-sw" style="background:${S.color.hex}"></span><span>${S.color.nom} · ${PLACE_LABEL[place()]}</span></div>` +
    `<div class="line"><b>Textile · palier ${palier.label}</b><span>${prixUnitaire().toFixed(2).replace('.', ',')} € / pièce</span></div>` +
    `<div class="line"><b>${qty} pièce${qty > 1 ? 's' : ''}</b><span>${prixTotal().toFixed(2).replace('.', ',')} €</span></div>` +
    `<div class="line"><b>Marquage ${TECHS[t].n}</b><span>chiffré à l'atelier</span></div>`;
}
