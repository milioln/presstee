// Valeurs dérivées de l'état — port direct de la V0.
import { S } from './state';
import { GARMENTS, zoneCm } from './garments';
import { PALIERS_TARIF, prixVente, type PalierTarif } from '../../config/tarification';
import { coutBaseSupportUnique, TAILLES, type Emplacement } from '../../config/parametres-metier';

export function place(): Emplacement {
  return GARMENTS[S.garment].noCoeur && S.place === 'coeur' ? 'face' : S.place;
}

export function currentZoneCm(): number {
  return zoneCm(S.garment, place());
}

export function widthCm(): number {
  return S.w * currentZoneCm();
}

export function heightCm(): number | null {
  return S.natW ? widthCm() * (S.natH / S.natW) : null;
}

export function dpi(): number | null {
  return S.natW && widthCm() > 0 ? S.natW / (widthCm() / 2.54) : null;
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
