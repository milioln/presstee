// Rendu de la scène, des vignettes, du diagnostic et du récapitulatif —
// port direct de la V0.
import { S } from './state';
import { GARMENTS, VIEWS, flatSVG, bustSVG } from './garments';
import { place, placeSide, widthCm, heightCm, dpi } from './derived';
import { lum, lumRGB } from './color-utils';
import { TECHS, reco } from './recommendation';
import { bindStage } from './interactions';
import { saveState } from './state';

export const activeTech = () => (S.tech === 'auto' ? reco(S.colors, S.qty).k : S.tech);

function designHTML(vi: number, live: boolean): string {
  if (VIEWS[vi].side !== placeSide()) return '';
  if (!S.img) return live ? `<div class="empty">Déposez votre visuel</div>` : '';
  return `<div class="design${live && S.sel ? ' sel' : ''}" style="left:${S.x * 100}%;top:${S.y * 100}%;width:${S.w * 100}%;transform:translate(-50%,-50%) rotate(${S.rot}deg)">
    <img src="${S.img}" alt="">${live ? '<div class="ring"></div><div class="hdl rz"></div><div class="hdl rt"></div>' : ''}</div>`;
}

function stageHTML(vi: number, live: boolean): string {
  const v = VIEWS[vi];
  const dark = lum(S.color.hex) < 0.42;
  const variant = { coupe: S.coupe, manche: S.manche, col: S.col };
  const svg = v.kind === 'flat' ? flatSVG(S.garment, v.side, S.color.hex, dark, variant) : bustSVG(S.garment, v.side, S.color.hex, dark, variant);
  const p = GARMENTS[S.garment].print[place()][v.kind];
  return svg + `<div class="printarea" style="left:${p.x}%;top:${p.y}%;width:${p.w}%;height:${p.h}%">${designHTML(vi, live)}</div>`;
}

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

export function render(): void {
  const stage = el('stage');
  const shots = el('shots');
  stage.innerHTML = stageHTML(S.view, true);
  shots.innerHTML = VIEWS.map(
    (v, i) => `<button class="shot${i === S.view ? ' on' : ''}" data-v="${i}"><div class="mini">${stageHTML(i, false)}</div><div class="lbl">${v.label}</div></button>`
  ).join('');
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
  const r = reco(S.colors, S.qty);
  const act = activeTech();
  el('techs').innerHTML =
    `<button class="tech${S.tech === 'auto' ? ' on' : ''}" data-t="auto">
      <div class="th">Choix conseillé<span class="tag">Recommandé</span></div>
      <p>Nous analysons votre visuel et votre quantité, puis retenons la technique la plus pertinente.</p></button>` +
    (Object.keys(TECHS) as (keyof typeof TECHS)[])
      .map(
        (k) => `<button class="tech${S.tech === k ? ' on' : ''}" data-t="${k}">
      <div class="th">${TECHS[k].n}${S.tech === 'auto' && act === k ? '<span class="tag">Retenue</span>' : ''}</div>
      <p>${TECHS[k].d}</p></button>`
      )
      .join('');
  let box = `<strong>${TECHS[r.k].n}</strong> — ${r.why}`;
  if (S.tech !== 'auto' && S.tech !== r.k) box += `<br><br>Vous avez choisi ${TECHS[S.tech].n}. ${TECHS[S.tech].good}`;
  if (activeTech() === 'serigraphie' && S.colors != null && S.colors > 5) {
    box += `<br><br>Attention : ${S.colors} couleurs en sérigraphie, c'est autant d'écrans à préparer. Le calage devient long et le prix grimpe vite.`;
  }
  el('recoBox').innerHTML = box;
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
  const w = widthCm();
  const h = heightCm();
  const labels: Record<string, string> = { face: 'Face avant', coeur: 'Cœur', dos: 'Dos' };
  el('recap').innerHTML =
    `<div class="line"><b>Vêtement</b><span>${GARMENTS[S.garment].name}, ${S.color.nom.toLowerCase()}</span></div>` +
    `<div class="line"><b>Emplacement</b><span>${labels[place()]}</span></div>` +
    `<div class="line"><b>Marquage</b><span>${S.img ? `${w.toFixed(1)} cm${h ? ` × ${h.toFixed(1)} cm` : ''}` : 'visuel à déposer'}</span></div>` +
    `<div class="line"><b>Technique</b><span>${TECHS[t].n}${S.tech === 'auto' ? ' (conseillée)' : ''}</span></div>` +
    `<div class="line"><b>Quantité</b><span>${S.qty} pièce${S.qty > 1 ? 's' : ''}</span></div>` +
    `<div class="line"><b>Délai</b><span>${S.delai === 'express' ? 'Express, J+5 ouvrés' : 'Standard, J+10 ouvrés'} (à confirmer)</span></div>`;
}

export function syncShots(): void {
  document.querySelectorAll<HTMLElement>('#shots .design').forEach((m) => {
    m.style.left = S.x * 100 + '%';
    m.style.top = S.y * 100 + '%';
    m.style.width = S.w * 100 + '%';
    m.style.transform = `translate(-50%,-50%) rotate(${S.rot}deg)`;
  });
}
