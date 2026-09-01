// Synchronisation des curseurs "Largeur" / "Rotation" avec l'état —
// module séparé pour éviter une dépendance circulaire entre interactions
// (manipulation à la souris) et main (curseurs).
import { S } from './state';
import { widthCm } from './derived';

export function syncSliders(): void {
  const rSize = document.getElementById('rSize') as HTMLInputElement | null;
  const rRot = document.getElementById('rRot') as HTMLInputElement | null;
  const vSize = document.getElementById('vSize');
  const vRot = document.getElementById('vRot');
  if (!rSize || !rRot || !vSize || !vRot) return;
  rSize.value = String(Math.round(S.w * 100));
  rRot.value = String(Math.round(S.rot));
  vSize.textContent = widthCm().toFixed(1) + ' cm';
  vRot.textContent = Math.round(S.rot) + '°';
}
