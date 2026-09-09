// Modèle 3D miniature pour la question "projet" du quiz (support,
// coloris, emplacement) — une troisième instance indépendante du modèle,
// sur le même principe que hero/tshirt-hero.ts : pas de calques ni
// d'état partagé avec le vrai configurateur (personnalisateur/state.ts),
// juste une teinte et les zones choisies en surbrillance. Les zones
// d'impression viennent de personnalisateur/print-zones.ts (source
// unique, partagée avec le configurateur et la vignette d'accueil).
//
// Plusieurs emplacements peuvent être choisis à la fois (Milio,
// 2026-09 : "pouvoir sélectionner plusieurs zones, face, dos et
// manche") — chacun est surligné sur le modèle. Le modèle tourne aussi
// vers la zone qu'on vient de choisir, pour qu'un clic sur "Dos" montre
// vraiment le dos plutôt que de surligner une zone hors champ.
//
// La sélection fonctionne aussi dans l'autre sens — cliquer directement
// sur le modèle détermine quel emplacement a été visé (placeFromHit),
// l'inverse de hitOnPlace() dans drag3d.ts qui vérifie un emplacement
// déjà connu.
import type { Emplacement, Garment } from '../config/parametres-metier';
import { PRINT_RECT, TEXTURE_SIZE } from './personnalisateur/print-zones';

// Un seul modèle 3D existe aujourd'hui (le t-shirt low poly, licence
// CC-BY-4.0) : pas de quoi représenter fidèlement un sweat, une chemise
// ou une casquette. Demande de Milio (2026-09-09) notée pour la suite :
// un vrai modèle par vêtement demande une modélisation 3D dédiée, hors de
// portée de ce qui peut être fait ici en code — cette table est prête à
// recevoir ces fichiers dès qu'ils existent (un par vêtement), en
// attendant elle retombe partout sur le même modèle.
const MODEL_PAR_GARMENT: Record<Garment, string> = {
  tshirt: '/personnalisateur/model/scene.gltf',
  sweat: '/personnalisateur/model/scene.gltf',
  chemise: '/personnalisateur/model/scene.gltf',
  casquette: '/personnalisateur/model/scene.gltf',
};
const TEXTURE_URL = '/personnalisateur/model/textures/Material_baseColor.png';

// Angle de caméra qui montre bien chaque zone (thêta autour du modèle, à
// 85° de hauteur et 105% de la distance "idéale" — mêmes valeurs que le
// vrai configurateur). Face/cœur restent sur la vue par défaut ; dos à
// l'opposé ; les manches à un angle 3/4 (45°, pas plus) qui garde le
// vêtement entier reconnaissable — vérifié à l'écran : au-delà de ~60°
// la zone imprimable de la manche sort du champ et on ne voit plus
// qu'un gros plan flou, exactement le "zones pas bien délimitées"
// signalé par Milio. Signe vérifié à l'écran aussi (pas supposé) :
// deviner le sens a fait tourner la caméra du mauvais côté une première
// fois — "manche-droite" (repère écran : à droite en vue de face,
// cf. render.ts) s'obtient avec un thêta positif, "manche-gauche" avec
// un thêta négatif.
const CAMERA_FOR_PLACE: Record<Emplacement, string> = {
  face: '0deg 85deg 105%',
  coeur: '0deg 85deg 105%',
  dos: '180deg 85deg 105%',
  'manche-droite': '45deg 85deg 105%',
  'manche-gauche': '-45deg 85deg 105%',
};

function uvFrac(u: number): number {
  return u - Math.floor(u);
}

function inRect(px: number, py: number, r: { x: number; y: number; w: number; h: number }): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Reconstruit, à partir d'un point touché sur le modèle, quel emplacement
// a été visé. Manches : test de zone directement en coordonnées atlas
// (comme hitOnPlace() pour les manches). Face/cœur/dos : hémisphère avant/
// arrière via la normale, puis test de zone pour distinguer le cœur (une
// petite région dans l'hémisphère avant) de la face.
function placeFromHit(hit: any): Emplacement | null {
  if (!hit || !hit.uv || !hit.normal) return null;
  const px = uvFrac(hit.uv.u) * TEXTURE_SIZE;
  const py = uvFrac(hit.uv.v) * TEXTURE_SIZE;
  for (const p of ['manche-droite', 'manche-gauche'] as const) {
    if (inRect(px, py, PRINT_RECT[p])) return p;
  }
  if (hit.normal.z > 0.25) {
    return inRect(px, py, PRINT_RECT.coeur) ? 'coeur' : 'face';
  }
  if (hit.normal.z < -0.25) return 'dos';
  return null;
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

async function buildTexture(hex: string, places: ReadonlySet<Emplacement>): Promise<string> {
  const base = await loadBaseImg();
  const c = document.createElement('canvas');
  c.width = base.naturalWidth;
  c.height = base.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(base, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.globalCompositeOperation = 'source-over';
  for (const place of places) {
    const r = PRINT_RECT[place];
    ctx.fillStyle = 'rgba(157,131,207,0.4)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = 'rgba(157,131,207,0.95)';
    ctx.lineWidth = 8;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  }
  return c.toDataURL('image/png');
}

let mv: any = null;
let applying = false;
let queued: { hex: string; places: Set<Emplacement> } | null = null;
let lastHex = '#FFFFFF';
let lastPlaces: Set<Emplacement> = new Set(['face']);
let lastGarment: Garment = 'tshirt';

async function apply(hex: string, places: Set<Emplacement>): Promise<void> {
  if (!mv || !mv.model) return;
  if (applying) {
    queued = { hex, places };
    return;
  }
  applying = true;
  try {
    const dataUrl = await buildTexture(hex, places);
    const material = mv.model.materials[0];
    const texture = await mv.createTexture(dataUrl);
    material.pbrMetallicRoughness.baseColorTexture.setTexture(texture);
  } finally {
    applying = false;
  }
  if (queued) {
    const next = queued;
    queued = null;
    void apply(next.hex, next.places);
  }
}

// Initialise le modèle une seule fois (import différé de model-viewer,
// comme partout ailleurs sur le site) et branche le clic-pour-choisir.
// `onPickPlace` répercute le choix dans l'état du quiz (bascule
// l'emplacement cliqué, comme une pastille).
export async function initQuiz3d(onPickPlace: (place: Emplacement) => void): Promise<void> {
  await import('@google/model-viewer');
  mv = document.getElementById('qzStage');
  if (!mv) return;
  mv.src = MODEL_PAR_GARMENT[lastGarment];
  mv.cameraOrbit = CAMERA_FOR_PLACE.face;
  const refresh = () => void apply(lastHex, lastPlaces);
  if (mv.loaded) refresh();
  else mv.addEventListener('load', refresh, { once: true });

  mv.addEventListener('pointerdown', (e: PointerEvent) => {
    const hit = mv.positionAndNormalFromPoint(e.clientX, e.clientY);
    const place = placeFromHit(hit);
    if (place) onPickPlace(place);
  });
}

// `focus`, si fourni, fait pivoter la caméra vers cette zone précise (la
// dernière ajoutée à la sélection) — sans ça, choisir "Dos" surlignerait
// une zone qu'on ne voit pas depuis la vue de face. Un changement de
// vêtement recharge le modèle correspondant (cf. MODEL_PAR_GARMENT) —
// sans effet visible tant qu'un seul fichier existe, mais prêt dès qu'un
// vrai modèle par vêtement sera disponible.
export function updateQuiz3d(hex: string, places: Set<Emplacement>, garment: Garment, focus?: Emplacement): void {
  lastHex = hex;
  lastPlaces = places;
  if (garment !== lastGarment) {
    lastGarment = garment;
    if (mv) mv.src = MODEL_PAR_GARMENT[garment];
  }
  void apply(hex, places);
  if (focus && mv) mv.cameraOrbit = CAMERA_FOR_PLACE[focus];
}
