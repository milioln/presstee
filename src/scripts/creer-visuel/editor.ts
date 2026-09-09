// Éditeur de visuel « style Canva » — espace de création simplifié pour
// que le client fabrique son propre logo/texte/visuel avant de l'utiliser
// dans le configurateur, plutôt que d'être bloqué faute de fichier prêt.
// Canvas 2D fait main (texte, formes, image importée ; déplacer,
// redimensionner, faire pivoter, réordonner) — pas de librairie externe :
// le reste du site (bat.ts, drag3d.ts, hero) est déjà construit ainsi,
// et l'éventail de fonctions nécessaire ici (sélection, poignées,
// rotation) reste raisonnable à la main.
//
// Le résultat exporté (PNG) est ensuite traité exactement comme un
// visuel importé par le client : même pipeline d'analyse de couleurs
// (file-analysis.ts) une fois dans le configurateur, même stockage
// (presstee:personnalisateur:v2, cf. state.ts/seedFromItem) — cet
// éditeur ne fait qu'alimenter ce pipeline en amont, il ne le duplique
// pas.
import type { Emplacement } from '../../config/parametres-metier';
import { getZoneImpressionCm, repartitionTaillesParDefaut, seuils } from '../../config/parametres-metier';

const CANVAS_SIZE = 900;

type ElType = 'text' | 'shape' | 'image';
type ShapeKind = 'rect' | 'circle' | 'triangle' | 'star';

interface Base {
	id: string;
	type: ElType;
	x: number;
	y: number;
	w: number;
	h: number;
	rot: number; // degrés
}
interface TextEl extends Base {
	type: 'text';
	text: string;
	font: string;
	size: number;
	color: string;
	bold: boolean;
}
interface ShapeEl extends Base {
	type: 'shape';
	shape: ShapeKind;
	color: string;
}
interface ImageEl extends Base {
	type: 'image';
	src: string;
	img: HTMLImageElement;
}
type El = TextEl | ShapeEl | ImageEl;

const FONTS = ['Sora', 'Manrope', 'Shantell Sans', 'Bebas Neue'];
const SHAPE_LABELS: Record<ShapeKind, string> = { rect: 'Rectangle', circle: 'Cercle', triangle: 'Triangle', star: 'Étoile' };

function uid(): string {
	return `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function el<T extends HTMLElement = HTMLElement>(id: string): T {
	return document.getElementById(id) as T;
}

export function initEditor(): void {
	const canvas = el<HTMLCanvasElement>('creerCanvas');
	if (!canvas) return;
	canvas.width = CANVAS_SIZE;
	canvas.height = CANVAS_SIZE;
	const ctx = canvas.getContext('2d')!;

	const layersList = el('creerLayers');
	const propsPanel = el('creerProps');
	const emptyHint = el('creerEmptyHint');
	const colorBadge = el('creerColorCount');
	const colorWarning = el('creerColorWarning');
	const placeMax = el('creerPlaceMax');
	const placeSelect = el<HTMLSelectElement>('creerPlace');
	const techSelect = el<HTMLSelectElement>('creerTech');

	let els: El[] = [];
	let selectedId: string | null = null;

	function selected(): El | null {
		return els.find((e) => e.id === selectedId) || null;
	}

	// ---- Géométrie : espace local (non pivoté) <-> espace canvas ---------
	function toLocal(e: El, px: number, py: number): { x: number; y: number } {
		const rad = (-e.rot * Math.PI) / 180;
		const dx = px - e.x;
		const dy = py - e.y;
		return { x: dx * Math.cos(rad) - dy * Math.sin(rad), y: dx * Math.sin(rad) + dy * Math.cos(rad) };
	}
	function toCanvas(e: El, lx: number, ly: number): { x: number; y: number } {
		const rad = (e.rot * Math.PI) / 180;
		return { x: e.x + lx * Math.cos(rad) - ly * Math.sin(rad), y: e.y + lx * Math.sin(rad) + ly * Math.cos(rad) };
	}
	function resizeHandlePos(e: El): { x: number; y: number } {
		return toCanvas(e, e.w / 2, e.h / 2);
	}
	function rotateHandlePos(e: El): { x: number; y: number } {
		return toCanvas(e, 0, -e.h / 2 - 34);
	}

	// ---- Rendu -------------------------------------------------------------
	function drawShape(shape: ShapeKind, w: number, h: number): Path2D {
		const p = new Path2D();
		if (shape === 'rect') {
			p.rect(-w / 2, -h / 2, w, h);
		} else if (shape === 'circle') {
			p.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
		} else if (shape === 'triangle') {
			p.moveTo(0, -h / 2);
			p.lineTo(w / 2, h / 2);
			p.lineTo(-w / 2, h / 2);
			p.closePath();
		} else {
			const spikes = 5;
			const outerX = w / 2;
			const outerY = h / 2;
			const innerX = outerX * 0.42;
			const innerY = outerY * 0.42;
			let rot = -Math.PI / 2;
			const step = Math.PI / spikes;
			p.moveTo(Math.cos(rot) * outerX, Math.sin(rot) * outerY);
			for (let i = 0; i < spikes; i++) {
				rot += step;
				p.lineTo(Math.cos(rot) * innerX, Math.sin(rot) * innerY);
				rot += step;
				p.lineTo(Math.cos(rot) * outerX, Math.sin(rot) * outerY);
			}
			p.closePath();
		}
		return p;
	}

	function textLines(t: TextEl): string[] {
		return t.text.split('\n');
	}

	function measureText(t: TextEl): { w: number; h: number } {
		ctx.font = `${t.bold ? '700' : '500'} ${t.size}px "${t.font}", sans-serif`;
		const lines = textLines(t);
		const w = Math.max(20, ...lines.map((l) => ctx.measureText(l || ' ').width));
		const h = Math.max(20, lines.length * t.size * 1.25);
		return { w, h };
	}

	function drawEl(e: El, target: CanvasRenderingContext2D): void {
		target.save();
		target.translate(e.x, e.y);
		target.rotate((e.rot * Math.PI) / 180);
		if (e.type === 'shape') {
			target.fillStyle = e.color;
			target.fill(drawShape(e.shape, e.w, e.h));
		} else if (e.type === 'image') {
			target.drawImage(e.img, -e.w / 2, -e.h / 2, e.w, e.h);
		} else {
			target.font = `${e.bold ? '700' : '500'} ${e.size}px "${e.font}", sans-serif`;
			target.fillStyle = e.color;
			target.textAlign = 'center';
			target.textBaseline = 'middle';
			const lines = textLines(e);
			const lh = e.size * 1.25;
			const startY = -((lines.length - 1) * lh) / 2;
			lines.forEach((line, i) => target.fillText(line, 0, startY + i * lh));
		}
		target.restore();
	}

	function paint(): void {
		ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
		els.forEach((e) => drawEl(e, ctx));
		const s = selected();
		if (s) {
			ctx.save();
			ctx.translate(s.x, s.y);
			ctx.rotate((s.rot * Math.PI) / 180);
			ctx.strokeStyle = '#9d83cf';
			ctx.lineWidth = 2;
			ctx.setLineDash([6, 5]);
			ctx.strokeRect(-s.w / 2 - 6, -s.h / 2 - 6, s.w + 12, s.h + 12);
			ctx.restore();
			ctx.setLineDash([]);
			const rh = resizeHandlePos(s);
			const oh = rotateHandlePos(s);
			ctx.beginPath();
			ctx.moveTo(toCanvas(s, 0, -s.h / 2 - 6).x, toCanvas(s, 0, -s.h / 2 - 6).y);
			ctx.lineTo(oh.x, oh.y);
			ctx.strokeStyle = '#c9bdea';
			ctx.lineWidth = 1.5;
			ctx.stroke();
			ctx.fillStyle = '#fff';
			ctx.strokeStyle = '#9d83cf';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(rh.x, rh.y, 9, 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(oh.x, oh.y, 9, 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
		}
		emptyHint.style.display = els.length === 0 ? 'flex' : 'none';
	}

	function exportPNG(): string {
		const off = document.createElement('canvas');
		off.width = CANVAS_SIZE;
		off.height = CANVAS_SIZE;
		const octx = off.getContext('2d')!;
		els.forEach((e) => drawEl(e, octx));
		return off.toDataURL('image/png');
	}

	// ---- Estimation des couleurs (même logique que file-analysis.ts) -----
	function estimateColorCount(): number {
		const off = document.createElement('canvas');
		const n = 96;
		off.width = n;
		off.height = n;
		const octx = off.getContext('2d', { willReadFrequently: true })!;
		octx.imageSmoothingEnabled = false;
		const full = document.createElement('canvas');
		full.width = CANVAS_SIZE;
		full.height = CANVAS_SIZE;
		const fctx = full.getContext('2d')!;
		els.forEach((e) => drawEl(e, fctx));
		octx.drawImage(full, 0, 0, n, n);
		const d = octx.getImageData(0, 0, n, n).data;
		const map = new Map<number, number>();
		let tot = 0;
		for (let i = 0; i < d.length; i += 4) {
			if (d[i + 3] < 128) continue;
			tot++;
			const k = ((d[i] >> 5) << 10) | ((d[i + 1] >> 5) << 5) | (d[i + 2] >> 5);
			map.set(k, (map.get(k) || 0) + 1);
		}
		if (tot === 0) return 0;
		return [...map.values()].filter((c) => c > tot * 0.015).length || (tot > 0 ? 1 : 0);
	}

	function refreshConstraints(): void {
		const n = estimateColorCount();
		colorBadge.textContent = n === 0 ? 'Aucun élément' : `${n} couleur${n > 1 ? 's' : ''} détectée${n > 1 ? 's' : ''}`;
		const tech = techSelect.value;
		let max: number | null = null;
		if (tech === 'serigraphie') max = seuils.couleursMaxSerigraphie;
		else if (tech === 'broderie') max = seuils.couleursMaxBroderie;
		if (max != null && n > max) {
			colorWarning.style.display = 'block';
			colorWarning.textContent = `Au-delà de ${max} couleurs, cette technique n'est plus adaptée — le configurateur vous proposera une alternative.`;
		} else {
			colorWarning.style.display = 'none';
		}
	}

	function refreshPlaceLabel(): void {
		const cm = getZoneImpressionCm('tshirt', placeSelect.value as Emplacement);
		placeMax.textContent = `Largeur d'impression max pour cet emplacement : ${cm} cm.`;
	}

	// ---- Panneau de calques --------------------------------------------
	function elLabel(e: El): string {
		if (e.type === 'text') return e.text.trim() ? `« ${e.text.trim().slice(0, 18)} »` : 'Texte vide';
		if (e.type === 'shape') return SHAPE_LABELS[e.shape];
		return 'Image';
	}

	function paintLayers(): void {
		layersList.innerHTML = '';
		[...els].reverse().forEach((e) => {
			const row = document.createElement('div');
			row.className = 'creer-layer-row' + (e.id === selectedId ? ' on' : '');
			row.innerHTML = `<span>${elLabel(e)}</span>`;
			row.addEventListener('click', () => {
				selectedId = e.id;
				paint();
				paintLayers();
				paintProps();
			});
			const actions = document.createElement('div');
			actions.className = 'creer-layer-actions';
			const upBtn = document.createElement('button');
			upBtn.type = 'button';
			upBtn.setAttribute('aria-label', 'Avancer');
			upBtn.textContent = '↑';
			upBtn.addEventListener('click', (ev) => {
				ev.stopPropagation();
				const i = els.findIndex((x) => x.id === e.id);
				if (i < els.length - 1) {
					[els[i], els[i + 1]] = [els[i + 1], els[i]];
					paint();
					paintLayers();
				}
			});
			const downBtn = document.createElement('button');
			downBtn.type = 'button';
			downBtn.setAttribute('aria-label', 'Reculer');
			downBtn.textContent = '↓';
			downBtn.addEventListener('click', (ev) => {
				ev.stopPropagation();
				const i = els.findIndex((x) => x.id === e.id);
				if (i > 0) {
					[els[i], els[i - 1]] = [els[i - 1], els[i]];
					paint();
					paintLayers();
				}
			});
			const delBtn = document.createElement('button');
			delBtn.type = 'button';
			delBtn.setAttribute('aria-label', 'Supprimer');
			delBtn.textContent = '×';
			delBtn.addEventListener('click', (ev) => {
				ev.stopPropagation();
				els = els.filter((x) => x.id !== e.id);
				if (selectedId === e.id) selectedId = null;
				paint();
				paintLayers();
				paintProps();
				refreshConstraints();
			});
			actions.append(upBtn, downBtn, delBtn);
			row.appendChild(actions);
			layersList.appendChild(row);
		});
	}

	// ---- Panneau de propriétés ------------------------------------------
	function paintProps(): void {
		propsPanel.innerHTML = '';
		const s = selected();
		if (!s) {
			propsPanel.innerHTML = '<p class="creer-props-empty">Sélectionnez un élément sur le visuel, ou ajoutez-en un ci-dessus.</p>';
			return;
		}
		if (s.type === 'text') {
			const wrap = document.createElement('div');
			wrap.className = 'creer-props-grid';
			wrap.innerHTML = `
				<label class="creer-field creer-field-full">
					<span>Texte</span>
					<textarea rows="2" id="pText">${s.text.replace(/</g, '&lt;')}</textarea>
				</label>
				<label class="creer-field">
					<span>Police</span>
					<select id="pFont">${FONTS.map((f) => `<option value="${f}" ${f === s.font ? 'selected' : ''}>${f}</option>`).join('')}</select>
				</label>
				<label class="creer-field">
					<span>Taille</span>
					<input type="range" id="pSize" min="16" max="220" value="${s.size}" />
				</label>
				<label class="creer-field">
					<span>Couleur</span>
					<input type="color" id="pColor" value="${s.color}" />
				</label>
				<label class="creer-field creer-field-check">
					<input type="checkbox" id="pBold" ${s.bold ? 'checked' : ''} />
					<span>Gras</span>
				</label>
			`;
			propsPanel.appendChild(wrap);
			el<HTMLTextAreaElement>('pText').addEventListener('input', (e) => {
				s.text = (e.target as HTMLTextAreaElement).value;
				const { w, h } = measureText(s);
				s.w = w;
				s.h = h;
				paint();
				paintLayers();
				refreshConstraints();
			});
			el<HTMLSelectElement>('pFont').addEventListener('change', (e) => {
				s.font = (e.target as HTMLSelectElement).value;
				const { w, h } = measureText(s);
				s.w = w;
				s.h = h;
				paint();
			});
			el<HTMLInputElement>('pSize').addEventListener('input', (e) => {
				s.size = Number((e.target as HTMLInputElement).value);
				const { w, h } = measureText(s);
				s.w = w;
				s.h = h;
				paint();
			});
			el<HTMLInputElement>('pColor').addEventListener('input', (e) => {
				s.color = (e.target as HTMLInputElement).value;
				paint();
				refreshConstraints();
			});
			el<HTMLInputElement>('pBold').addEventListener('change', (e) => {
				s.bold = (e.target as HTMLInputElement).checked;
				const { w, h } = measureText(s);
				s.w = w;
				s.h = h;
				paint();
			});
		} else if (s.type === 'shape') {
			const wrap = document.createElement('div');
			wrap.className = 'creer-props-grid';
			wrap.innerHTML = `
				<label class="creer-field">
					<span>Couleur</span>
					<input type="color" id="pColor" value="${s.color}" />
				</label>
			`;
			propsPanel.appendChild(wrap);
			el<HTMLInputElement>('pColor').addEventListener('input', (e) => {
				s.color = (e.target as HTMLInputElement).value;
				paint();
				refreshConstraints();
			});
		} else {
			propsPanel.innerHTML = '<p class="creer-props-empty">Faites glisser les poignées sur le visuel pour repositionner, redimensionner ou pivoter cette image.</p>';
		}
	}

	// ---- Ajout d'éléments -------------------------------------------------
	// Décale chaque nouvel élément en cascade plutôt que de toujours viser
	// le centre exact : sinon formes/texte s'empilent pile les uns sur les
	// autres et se masquent totalement (repéré en testant : un rectangle
	// ajouté après une étoile la cachait complètement).
	function spawnPoint(): { x: number; y: number } {
		const step = 36;
		const cycle = els.length % 8;
		return { x: CANVAS_SIZE / 2 + cycle * step - 4 * step, y: CANVAS_SIZE / 2 + cycle * step - 4 * step };
	}

	function addText(): void {
		const p = spawnPoint();
		const t: TextEl = { id: uid(), type: 'text', x: p.x, y: p.y, w: 10, h: 10, rot: 0, text: 'Votre texte', font: 'Sora', size: 64, color: '#17131F', bold: true };
		const { w, h } = measureText(t);
		t.w = w;
		t.h = h;
		els.push(t);
		selectedId = t.id;
		paint();
		paintLayers();
		paintProps();
		refreshConstraints();
	}

	function addShape(shape: ShapeKind): void {
		const p = spawnPoint();
		const s: ShapeEl = { id: uid(), type: 'shape', x: p.x, y: p.y, w: 220, h: 220, rot: 0, shape, color: '#9d83cf' };
		els.push(s);
		selectedId = s.id;
		paint();
		paintLayers();
		paintProps();
		refreshConstraints();
	}

	function addImageFromFile(file: File): void {
		const reader = new FileReader();
		reader.onload = () => {
			const src = String(reader.result);
			const img = new Image();
			img.onload = () => {
				const maxW = CANVAS_SIZE * 0.55;
				const ratio = img.naturalHeight / img.naturalWidth || 1;
				const w = Math.min(maxW, img.naturalWidth);
				const h = w * ratio;
				const p = spawnPoint();
				const im: ImageEl = { id: uid(), type: 'image', x: p.x, y: p.y, w, h, rot: 0, src, img };
				els.push(im);
				selectedId = im.id;
				paint();
				paintLayers();
				paintProps();
				refreshConstraints();
			};
			img.src = src;
		};
		reader.readAsDataURL(file);
	}

	// ---- Interaction pointeur ---------------------------------------------
	type Mode = 'move' | 'resize' | 'rotate' | null;
	let mode: Mode = null;
	let dragStart = { x: 0, y: 0 };
	let elStart = { x: 0, y: 0, w: 0, h: 0, rot: 0, size: 0 };

	function canvasPoint(ev: PointerEvent): { x: number; y: number } {
		const r = canvas.getBoundingClientRect();
		return { x: ((ev.clientX - r.left) / r.width) * CANVAS_SIZE, y: ((ev.clientY - r.top) / r.height) * CANVAS_SIZE };
	}

	function hit(px: number, py: number): El | null {
		for (let i = els.length - 1; i >= 0; i--) {
			const e = els[i];
			const l = toLocal(e, px, py);
			if (Math.abs(l.x) <= e.w / 2 && Math.abs(l.y) <= e.h / 2) return e;
		}
		return null;
	}

	function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
		return Math.hypot(a.x - b.x, a.y - b.y);
	}

	canvas.addEventListener('pointerdown', (ev) => {
		const p = canvasPoint(ev);
		const s = selected();
		if (s) {
			if (dist(p, resizeHandlePos(s)) < 16) {
				mode = 'resize';
				dragStart = p;
				elStart = { x: s.x, y: s.y, w: s.w, h: s.h, rot: s.rot, size: s.type === 'text' ? s.size : 0 };
				canvas.setPointerCapture(ev.pointerId);
				return;
			}
			if (dist(p, rotateHandlePos(s)) < 16) {
				mode = 'rotate';
				dragStart = p;
				elStart = { x: s.x, y: s.y, w: s.w, h: s.h, rot: s.rot, size: 0 };
				canvas.setPointerCapture(ev.pointerId);
				return;
			}
		}
		const target = hit(p.x, p.y);
		if (target) {
			selectedId = target.id;
			mode = 'move';
			dragStart = p;
			elStart = { x: target.x, y: target.y, w: target.w, h: target.h, rot: target.rot, size: 0 };
			canvas.setPointerCapture(ev.pointerId);
		} else {
			selectedId = null;
		}
		paint();
		paintLayers();
		paintProps();
	});

	canvas.addEventListener('pointermove', (ev) => {
		if (!mode) return;
		const s = selected();
		if (!s) return;
		const p = canvasPoint(ev);
		if (mode === 'move') {
			s.x = elStart.x + (p.x - dragStart.x);
			s.y = elStart.y + (p.y - dragStart.y);
		} else if (mode === 'rotate') {
			const start = Math.atan2(dragStart.y - elStart.y, dragStart.x - elStart.x);
			const cur = Math.atan2(p.y - elStart.y, p.x - elStart.x);
			s.rot = elStart.rot + ((cur - start) * 180) / Math.PI;
		} else if (mode === 'resize') {
			if (s.type === 'text') {
				const startDist = Math.max(1, dist({ x: elStart.x, y: elStart.y }, resizeHandlePosAt(elStart)));
				const curDist = dist({ x: elStart.x, y: elStart.y }, p);
				const scale = Math.max(0.2, curDist / startDist);
				s.size = Math.max(12, Math.min(260, elStart.size * scale));
				const { w, h } = measureText(s);
				s.w = w;
				s.h = h;
			} else {
				const l = toLocal(s, p.x, p.y);
				s.w = Math.max(16, Math.abs(l.x) * 2);
				s.h = Math.max(16, Math.abs(l.y) * 2);
			}
		}
		paint();
	});

	function resizeHandlePosAt(start: { x: number; y: number; w: number; h: number; rot: number }): { x: number; y: number } {
		const rad = (start.rot * Math.PI) / 180;
		const lx = start.w / 2;
		const ly = start.h / 2;
		return { x: start.x + lx * Math.cos(rad) - ly * Math.sin(rad), y: start.y + lx * Math.sin(rad) + ly * Math.cos(rad) };
	}

	function endDrag(ev: PointerEvent): void {
		if (!mode) return;
		mode = null;
		try {
			canvas.releasePointerCapture(ev.pointerId);
		} catch {
			// ignore
		}
		paintLayers();
		refreshConstraints();
	}
	canvas.addEventListener('pointerup', endDrag);
	canvas.addEventListener('pointercancel', endDrag);

	window.addEventListener('keydown', (ev) => {
		if ((ev.key === 'Backspace' || ev.key === 'Delete') && selectedId) {
			const active = document.activeElement;
			if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) return;
			els = els.filter((x) => x.id !== selectedId);
			selectedId = null;
			paint();
			paintLayers();
			paintProps();
			refreshConstraints();
		}
	});

	// ---- Barre d'outils -----------------------------------------------
	el('creerAddText').addEventListener('click', addText);
	document.querySelectorAll<HTMLButtonElement>('[data-shape]').forEach((b) => {
		b.addEventListener('click', () => addShape(b.dataset.shape as ShapeKind));
	});
	el<HTMLInputElement>('creerAddImage').addEventListener('change', (e) => {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (f) addImageFromFile(f);
		(e.target as HTMLInputElement).value = '';
	});
	el('creerDuplicate').addEventListener('click', () => {
		const s = selected();
		if (!s) return;
		const copy: El = { ...s, id: uid(), x: s.x + 24, y: s.y + 24 };
		els.push(copy);
		selectedId = copy.id;
		paint();
		paintLayers();
		paintProps();
		refreshConstraints();
	});
	placeSelect.addEventListener('change', refreshPlaceLabel);
	techSelect.addEventListener('change', refreshConstraints);

	el('creerDownload').addEventListener('click', () => {
		const a = document.createElement('a');
		a.href = exportPNG();
		a.download = 'mon-visuel-presstee.png';
		a.click();
	});

	el('creerUse').addEventListener('click', () => {
		if (els.length === 0) return;
		const dataUrl = exportPNG();
		const place = placeSelect.value as Emplacement;
		const layer = {
			id: uid(),
			place,
			img: dataUrl,
			fileName: 'mon-visuel-presstee.png',
			vector: false,
			knownColor: null,
			natW: 0,
			natH: 0,
			colors: null,
			dom: null,
			colorSwatches: null,
			x: 0.5,
			y: 0.5,
			w: 0.62,
			rot: 0,
		};
		const colorIndex = 0;
		const payload = {
			garment: 'tshirt',
			place,
			coupe: 'droite',
			manche: 'courte',
			col: 'rond',
			colorIndex,
			layers: [layer],
			activeLayerId: layer.id,
			sizeDist: { ...repartitionTaillesParDefaut },
			tech: techSelect.value === 'serigraphie' || techSelect.value === 'broderie' ? techSelect.value : 'auto',
			delai: 'standard',
			designHelp: { colors: null, format: '', notes: '' },
			batConfirme: null,
		};
		try {
			localStorage.setItem('presstee:personnalisateur:v2', JSON.stringify(payload));
		} catch {
			// Stockage indisponible : le clic reste sans effet plutôt que de
			// planter — l'utilisateur peut toujours télécharger le PNG.
			return;
		}
		window.location.href = '/personnaliser';
	});

	refreshPlaceLabel();
	refreshConstraints();
	paint();
	paintLayers();
	paintProps();
}
