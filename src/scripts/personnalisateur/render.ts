// Rendu de la scène, du diagnostic et du récapitulatif — le support est
// une vraie photo produit (assets/tshirt-col-rond-blanc.webp de la
// maquette), teintée à la couleur choisie par un calque de fond en
// mix-blend-mode:multiply — technique de mockup standard, pas un
// habillage SVG. Les zones d'impression (GARMENTS.tshirt.print) sont
// réutilisées telles quelles : calibrées à l'origine sur le tracé
// vectoriel, elles restent une bonne approximation sur la photo,
// cadrée de façon comparable.
import { S } from './state';
import { GARMENTS } from './garments';
import { place, widthCm, heightCm, dpi, qtyTotal, palierActuel, prixUnitaire, prixTotal, currentZoneCm } from './derived';
import { lum, lumRGB } from './color-utils';
import { TECHS, reco } from './recommendation';
import { bindStage } from './interactions';
import { saveState } from './state';
import { TAILLES } from '../../config/parametres-metier';

export const activeTech = () => (S.tech === 'auto' ? reco(S.colors, qtyTotal()).k : S.tech);

function designHTML(live: boolean): string {
  if (!S.img) return live ? `<div class="empty">Déposez votre visuel</div>` : '';
  return `<div class="design${live && S.sel ? ' sel' : ''}" style="left:${S.x * 100}%;top:${S.y * 100}%;width:${S.w * 100}%;transform:translate(-50%,-50%) rotate(${S.rot}deg)">
    <img src="${S.img}" alt="">${live ? '<div class="ring"></div><div class="hdl rz"></div><div class="hdl rt"></div>' : ''}</div>`;
}

function stageHTML(live: boolean): string {
  const p = GARMENTS.tshirt.print[place()].flat;
  const tee = `<div style="position:absolute;inset:0;background:${S.color.hex}"></div>
    <img src="/personnalisateur/tshirt-col-rond-blanc.webp" alt="T-shirt col rond" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply">`;
  return tee + `<div class="printarea" style="left:${p.x}%;top:${p.y}%;width:${p.w}%;height:${p.h}%">${designHTML(live)}</div>`;
}

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

export function render(): void {
  el('stage').innerHTML = stageHTML(true);
  applyZoom();
  bindStage();
  paintTechs();
  paintDiag();
  paintRecap();
  saveState();
}

export function applyZoom(): void {
  const zoomwrap = el('zoomwrap');
  const m = ((S.z - 1) / 2) * 100;
  S.px = Math.max(-m, Math.min(m, S.px));
  S.py = Math.max(-m, Math.min(m, S.py));
  zoomwrap.style.transform = `translate(${S.px}%,${S.py}%) scale(${S.z})`;
  el('zVal').textContent = Math.round(S.z * 100) + ' %';
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
