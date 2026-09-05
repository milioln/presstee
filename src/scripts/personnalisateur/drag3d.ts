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
// Interaction en deux temps (demande Milio du 2026-09-05) : un premier
// appui sur la zone du calque actif l'« arme » (le rend modifiable et
// déplaçable) sans rien déplacer ni faire tourner la caméra sur ce
// même geste ; tant qu'il reste armé, les appuis suivants dans cette
// même zone glissent réellement le visuel (ou ouvrent la popup
// contextuelle sur un simple tap, cf. onUp ci-dessous). Un appui en
// dehors de cette zone désarme et laisse le geste piloter librement la
// caméra du modèle 3D, comme si le visuel n'existait pas.
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
// propagation avec stopImmediatePropagation() — y compris pour le
// simple appui qui arme le calque, qui ne doit pas non plus déclencher
// d'orbite.
import { activeLayer } from './state';
import { render, PRINT_RECT, TEXTURE_SIZE } from './render';
import { openLayerPopup } from './layer-popup';

function stage(): any {
  return document.getElementById('stage');
}

function uvFrac(u: number): number {
  return u - Math.floor(u);
}

// Calque actuellement armé (modifiable/déplaçable sur le modèle 3D) :
// remis à null dès qu'un appui tombe hors de sa zone, ou qu'un autre
// calque devient actif entretemps.
let armedLayerId: string | null = null;

function onPointerDown(e: PointerEvent): void {
  const mv = stage();
  const layer = activeLayer();
  if (!mv || !layer) return;
  const hit = mv.positionAndNormalFromPoint(e.clientX, e.clientY);
  // Face avant pour face/cœur, face arrière pour dos — sinon (manche,
  // tranche, ou hors du modèle) on est en dehors de la zone du calque
  // actif : on désarme et on laisse la caméra réagir normalement.
  const front = !!hit && hit.normal.z > 0.25;
  const back = !!hit && hit.normal.z < -0.25;
  const onZone = layer.place === 'dos' ? back : front;
  if (!onZone) {
    armedLayerId = null;
    return;
  }

  if (armedLayerId !== layer.id) {
    // Premier appui sur la zone : arme le calque sans le déplacer ni
    // laisser l'orbite démarrer sur ce même geste.
    armedLayerId = layer.id;
    e.preventDefault();
    e.stopImmediatePropagation();
    return;
  }

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

  const rect = PRINT_RECT[layer.place];
  const x0 = layer.x;
  const y0 = layer.y;
  const startX = e.clientX;
  const startY = e.clientY;

  const move = (ev: PointerEvent) => {
    const du = duPerPxX * (ev.clientX - startX);
    const dv = dvPerPxY * (ev.clientY - startY);
    const dSx = (du * TEXTURE_SIZE) / rect.w;
    const dSy = (dv * TEXTURE_SIZE) / rect.h;
    layer.x = Math.max(0, Math.min(1, x0 + dSx));
    layer.y = Math.max(0, Math.min(1, y0 + dSy));
    render();
  };
  const cleanup = () => {
    mv.removeEventListener('pointermove', move);
    mv.removeEventListener('pointerup', onUp);
    mv.removeEventListener('pointercancel', onCancel);
    if (hadControls) mv.setAttribute('camera-controls', '');
  };
  // Un tap (relâché à peu près là où le geste a commencé) ouvre la
  // popup contextuelle du calque plutôt que de simplement terminer un
  // glisser de quelques pixels sans effet perceptible.
  const onUp = (ev: PointerEvent) => {
    cleanup();
    const moved = Math.hypot(ev.clientX - startX, ev.clientY - startY);
    if (moved < 6) openLayerPopup(layer, ev.clientX, ev.clientY);
  };
  const onCancel = () => cleanup();
  mv.addEventListener('pointermove', move);
  mv.addEventListener('pointerup', onUp);
  mv.addEventListener('pointercancel', onCancel);
}

export function bindModelDrag(): void {
  const mv = stage();
  if (!mv) return;
  mv.addEventListener('pointerdown', onPointerDown, true);
}
