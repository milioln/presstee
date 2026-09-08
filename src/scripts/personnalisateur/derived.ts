// Valeurs dérivées de l'état — port direct de la V0.
import { S, activeLayer } from './state';
import { GARMENTS, zoneCm } from './garments';
import { PALIERS_TARIF, prixVente, type PalierTarif } from '../../config/tarification';
import { coutBaseSupportUnique, TAILLES, type Emplacement } from '../../config/parametres-metier';

export function place(): Emplacement {
  const g = GARMENTS[S.garment];
  if (g.noCoeur && S.place === 'coeur') return 'face';
  if (g.noManche && (S.place === 'manche-droite' || S.place === 'manche-gauche')) return 'face';
  return S.place;
}

export function currentZoneCm(): number {
  return zoneCm(S.garment, place());
}

export function widthCm(): number {
  const layer = activeLayer();
  return layer ? layer.w * currentZoneCm() : 0;
}

export function heightCm(): number | null {
  const layer = activeLayer();
  return layer && layer.natW ? widthCm() * (layer.natH / layer.natW) : null;
}

export function dpi(): number | null {
  const layer = activeLayer();
  return layer && layer.natW && widthCm() > 0 ? layer.natW / (widthCm() / 2.54) : null;
}

// Nombre de couleurs total, tous calques confondus — c'est ce qui
// détermine réellement le coût de calage en sérigraphie (autant
// d'écrans à préparer que de couleurs cumulées sur l'ensemble du
// projet, pas seulement sur le visuel actuellement sélectionné). Un
// calque dont l'analyse a échoué (SVG non rasterisable) compte pour 1
// par défaut plutôt que de rendre le total entier inutilisable.
export function totalColors(): number | null {
  // Sans visuel déposé, le client peut avoir indiqué un nombre de
  // couleurs souhaité dans l'espace "Pas de visuel ?" — ça suffit pour
  // que la recommandation de technique reste pertinente.
  if (S.layers.length === 0) return S.designHelp.colors;
  const sum = S.layers.reduce((s, l) => s + (l.colors ?? 1), 0);
  return Math.max(1, sum);
}

export function qtyTotal(): number {
  return TAILLES.reduce((sum, t) => sum + S.sizeDist[t], 0);
}

export function palierActuel(): PalierTarif {
  const qty = qtyTotal();
  return PALIERS_TARIF.find((p) => qty >= p.min && (p.max == null || qty <= p.max)) || PALIERS_TARIF[PALIERS_TARIF.length - 1];
}

export function prixUnitaire(): number {
  return Math.round(prixVente(coutBaseSupportUnique, palierActuel().marge) * 100) / 100;
}

export function prixTotal(): number {
  return Math.round(prixUnitaire() * qtyTotal() * 100) / 100;
}
