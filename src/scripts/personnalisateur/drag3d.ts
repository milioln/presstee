// Glisser le visuel directement sur le modèle 3D.
//
// model-viewer expose positionAndNormalFromPoint(x, y), un raycast
// écran → surface qui renvoie { position, normal, uv } — le uv est le
// point clé : il permet de savoir exactement où sur la texture on a
// cliqué, sans recalibrage manuel.
//
// Deux subtilités vérifiées empiriquement sur ce modèle :
// - la relation pixel-écran → uv dépend du zoom/angle de caméra du
//   moment, donc on la mesure à chaque prise (deux micro-raycasts
//   décalés de quelques pixels) plutôt que d'utiliser une constante
//   figée ;
// - l'axe v de ce modèle est inversé par rapport à l'axe y du canvas
//   (v augmente vers le haut, y vers le bas) — cohérent avec le
//   retournement déjà observé sur le contenu du visuel dans render.ts.
//
// Le point de départ du glisser doit tomber sur la face du vêtement
// qui correspond à l'emplacement choisi (avant pour face/cœur, dos
// pour dos) : ailleurs sur le vêtement (manches, tranches), le
// glisser continue de faire tourner la caméra normalement.
//
// Écoute en phase capture : model-viewer branche son propre
// pointerdown (pour l'orbite caméra) en phase bulle sur ce même
// élément. Enregistré pareil, notre handler arriverait après le sien
// et l'orbite aurait déjà démarré avant qu'on ait pu l'annuler. En
// phase capture, le nôtre passe en premier et peut couper net la
// propagation avec stopImmediatePropagation().
import { S } from './state';
import { place } from './derived';
import { render, PRINT_RECT, TEXTURE_SIZE } from './render';

function stage(): any {
  return document.getElementById('stage');
}

function uvFrac(u: number): number {
  return u - Math.floor(u);
}

function onPointerDown(e: PointerEvent): void {
  const mv = stage();
  if (!mv || !S.img) return;
  const hit = mv.positionAndNormalFromPoint(e.clientX, e.clientY);
  if (!hit) return;
  // Face avant pour face/cœur, face arrière pour dos — sinon (manche,
  // tranche) on laisse la caméra tourner.
  const front = hit.normal.z > 0.25;
  const back = hit.normal.z < -0.25;
  if (place() === 'dos' ? !back : !front) return;

  const probe = 24;
  const px = mv.positionAndNormalFromPoint(e.clientX + probe, e.clientY);
  const py = mv.positionAndNormalFromPoint(e.clientX, e.clientY + probe);
  if (!px || !py) return;
  const duPerPxX = (uvFrac(px.uv.u) - uvFrac(hit.uv.u)) / probe;
  const dvPerPxY = (py.uv.v - hit.uv.v) / probe;
  if (!isFinite(duPerPxX) || !isFinite(dvPerPxY) || (duPerPxX === 0 && dvPerPxY === 0)) return;

  e.preventDefault();
  e.stopImmediatePropagation();
  const hadControls = mv.hasAttribute('camera-controls');
  mv.removeAttribute('camera-controls');
  // setPointerCapture peut lever (pointeur de test synthétique, ou
  // navigateur qui refuse) : ça ne doit pas empêcher le glisser de
  // fonctionner, juste le rendre moins robuste si le doigt/curseur
  // sort du canevas en cours de geste.
  try {
    mv.setPointerCapture(e.pointerId);
  } catch {
    // ignore
  }

  const rect = PRINT_RECT[place()];
  const x0 = S.x;
  const y0 = S.y;
  const startX = e.clientX;
  const startY = e.clientY;

  const move = (ev: PointerEvent) => {
    const du = duPerPxX * (ev.clientX - startX);
    const dv = dvPerPxY * (ev.clientY - startY);
    const dSx = (du * TEXTURE_SIZE) / rect.w;
    const dSy = (dv * TEXTURE_SIZE) / rect.h;
    S.x = Math.max(0, Math.min(1, x0 + dSx));
    S.y = Math.max(0, Math.min(1, y0 + dSy));
    render();
  };
  const up = () => {
    mv.removeEventListener('pointermove', move);
    mv.removeEventListener('pointerup', up);
    mv.removeEventListener('pointercancel', up);
    if (hadControls) mv.setAttribute('camera-controls', '');
  };
  mv.addEventListener('pointermove', move);
  mv.addEventListener('pointerup', up);
  mv.addEventListener('pointercancel', up);
}

export function bindModelDrag(): void {
  const mv = stage();
  if (!mv) return;
  mv.addEventListener('pointerdown', onPointerDown, true);
}
