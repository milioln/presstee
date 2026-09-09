// Modèle 3D miniature pour la question "projet" du quiz (support,
// coloris, emplacement) — une troisième instance indépendante du modèle,
// sur le même principe que hero/tshirt-hero.ts : pas de calques ni
// d'état partagé avec le vrai configurateur (personnalisateur/state.ts),
// juste une teinte et une zone en surbrillance. PRINT_RECT/PANEL_SCALE
// sont dupliqués depuis personnalisateur/render.ts (même remarque que
// dans tshirt-hero.ts : à garder synchronisés si l'atlas change).
//
// Nouveau par rapport aux deux instances existantes : la sélection
// fonctionne aussi dans l'autre sens — cliquer directement sur le modèle
// détermine quel emplacement a été visé (placeFromHit), l'inverse de
// hitOnPlace() dans drag3d.ts qui vérifie un emplacement déjà connu.
import type { Emplacement } from '../config/parametres-metier';

const MODEL_URL = '/personnalisateur/model/scene.gltf';
const TEXTURE_URL = '/personnalisateur/model/textures/Material_baseColor.png';
const TEXTURE_SIZE = 2048;

const PRINT_RECT: Record<Emplacement, { x: number; y: number; w: number; h: number }> = {
  face: { x: 324, y: 210, w: 580, h: 750 },
  coeur: { x: 630, y: 750, w: 130, h: 280 },
  dos: { x: 1238, y: 210, w: 580, h: 750 },
  'manche-droite': { x: 750, y: 1325, w: 480, h: 195 },
  'manche-gauche': { x: 1360, y: 1325, w: 540, h: 195 },
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

async function buildTexture(hex: string, place: Emplacement | null): Promise<string> {
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
  if (place) {
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
let queued: { hex: string; place: Emplacement | null } | null = null;
let lastHex = '#FFFFFF';
let lastPlace: Emplacement | null = 'face';

async function apply(hex: string, place: Emplacement | null): Promise<void> {
  if (!mv || !mv.model) return;
  if (applying) {
    queued = { hex, place };
    return;
  }
  applying = true;
  try {
    const dataUrl = await buildTexture(hex, place);
    const material = mv.model.materials[0];
    const texture = await mv.createTexture(dataUrl);
    material.pbrMetallicRoughness.baseColorTexture.setTexture(texture);
  } finally {
    applying = false;
  }
  if (queued) {
    const next = queued;
    queued = null;
    void apply(next.hex, next.place);
  }
}

// Initialise le modèle une seule fois (import différé de model-viewer,
// comme partout ailleurs sur le site) et branche le clic-pour-choisir.
// `onPickPlace` répercute le choix dans l'état du quiz.
export async function initQuiz3d(onPickPlace: (place: Emplacement) => void): Promise<void> {
  await import('@google/model-viewer');
  mv = document.getElementById('qzStage');
  if (!mv) return;
  mv.src = MODEL_URL;
  const refresh = () => void apply(lastHex, lastPlace);
  if (mv.loaded) refresh();
  else mv.addEventListener('load', refresh, { once: true });

  mv.addEventListener('pointerdown', (e: PointerEvent) => {
    const hit = mv.positionAndNormalFromPoint(e.clientX, e.clientY);
    const place = placeFromHit(hit);
    if (place) onPickPlace(place);
  });
}

export function updateQuiz3d(hex: string, place: Emplacement | null): void {
  lastHex = hex;
  lastPlace = place;
  void apply(hex, place);
}
