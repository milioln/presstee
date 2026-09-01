// Valeurs dérivées de l'état — port direct de la V0.
import { S } from './state';
import { GARMENTS, zoneCm } from './garments';
import type { Emplacement } from '../../config/parametres-metier';

export function place(): Emplacement {
  return GARMENTS[S.garment].noCoeur && S.place === 'coeur' ? 'face' : S.place;
}

export function placeSide(): 0 | 1 {
  return place() === 'dos' ? 1 : 0;
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
