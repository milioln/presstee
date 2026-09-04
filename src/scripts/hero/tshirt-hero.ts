// Vignette 3D de la page d'accueil — réutilise le vrai modèle glTF et le
// même principe de texture que le configurateur
// (src/scripts/personnalisateur/render.ts) : la couleur et le visuel
// imprimé sont composités dans un canvas puis appliqués comme
// baseColorTexture du matériau, plutôt qu'un rendu 3D maison.
//
// On ne réutilise pas le module personnalisateur tel quel : il suppose
// tout le DOM et l'état global (S) du configurateur, absents ici. Cette
// version est un sous-ensemble volontairement minimal (un seul visuel,
// pas de calques multiples, pas de sauvegarde) — les constantes de zone
// d'impression et de texture sont dupliquées depuis render.ts, à garder
// synchronisées si l'atlas de texture change.
import { catalogueColoris, type Emplacement } from '../../config/parametres-metier';

const TEXTURE_URL = '/personnalisateur/model/textures/Material_baseColor.png';
const DEFAULT_PRINT = '/logo/presstee-vertical.svg';
const DEFAULT_PLACE: Emplacement = 'coeur';

const PRINT_RECT: Record<Emplacement, { x: number; y: number; w: number; h: number }> = {
	face: { x: 370, y: 210, w: 360, h: 750 },
	coeur: { x: 630, y: 750, w: 130, h: 280 },
	dos: { x: 1270, y: 210, w: 360, h: 750 },
};

// Sous-ensemble du vrai catalogue (config/parametres-metier.ts), pas une
// palette inventée : chaque coloris montré ici est réellement commandable.
const PALETTE = ['Blanc', 'Sable', 'Indigo Presstee', 'Noir', 'Jaune Presstee', 'Bleu marine', 'Rouge', 'Vert bouteille']
	.map((nom) => catalogueColoris.find((c) => c.nom === nom))
	.filter((c): c is { nom: string; hex: string } => !!c);

const PLACES: Emplacement[] = ['face', 'coeur', 'dos'];
const PLACE_LABELS: Record<Emplacement, string> = { face: 'Face', coeur: 'Cœur', dos: 'Dos' };

function loadImg(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}

let baseImgPromise: Promise<HTMLImageElement> | null = null;
function loadBaseImg(): Promise<HTMLImageElement> {
	if (!baseImgPromise) baseImgPromise = loadImg(TEXTURE_URL);
	return baseImgPromise;
}

const printCache = new Map<string, Promise<HTMLImageElement>>();
function loadPrintCached(src: string): Promise<HTMLImageElement> {
	let p = printCache.get(src);
	if (!p) {
		p = loadImg(src);
		printCache.set(src, p);
	}
	return p;
}

async function buildTexture(hex: string, place: Emplacement, printUrl: string): Promise<string> {
	const base = await loadBaseImg();
	const c = document.createElement('canvas');
	c.width = base.naturalWidth;
	c.height = base.naturalHeight;
	const ctx = c.getContext('2d')!;
	ctx.drawImage(base, 0, 0);
	// Teinte tout le vêtement (silhouette préservée par l'alpha du PNG).
	ctx.globalCompositeOperation = 'source-atop';
	ctx.fillStyle = hex;
	ctx.fillRect(0, 0, c.width, c.height);
	ctx.globalCompositeOperation = 'source-over';

	const rect = PRINT_RECT[place];
	const logo = await loadPrintCached(printUrl);
	const w = rect.w * 0.55;
	const ratio = logo.naturalWidth && logo.naturalHeight ? logo.naturalHeight / logo.naturalWidth : 1;
	const h = w * ratio;
	ctx.save();
	ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
	// Le panneau avant du modèle est retourné verticalement dans l'atlas
	// UV (cf. render.ts) : on recompense en dessinant le visuel inversé.
	ctx.scale(1, -1);
	ctx.drawImage(logo, -w / 2, -h / 2, w, h);
	ctx.restore();

	return c.toDataURL('image/png');
}

export function initHero3D(): void {
	const mv = document.getElementById('heroStage') as any;
	if (!mv) return;

	let hex = PALETTE[0].hex;
	let place: Emplacement = DEFAULT_PLACE;
	let printUrl = DEFAULT_PRINT;

	let applying = false;
	let queued = false;
	async function apply(): Promise<void> {
		if (!mv.model) return;
		if (applying) {
			queued = true;
			return;
		}
		applying = true;
		try {
			const dataUrl = await buildTexture(hex, place, printUrl);
			const material = mv.model.materials[0];
			const texture = await mv.createTexture(dataUrl);
			material.pbrMetallicRoughness.baseColorTexture.setTexture(texture);
		} finally {
			applying = false;
			if (queued) {
				queued = false;
				apply();
			}
		}
	}
	function syncCamera(): void {
		mv.cameraOrbit = place === 'dos' ? '180deg 85deg 105%' : '0deg 85deg 105%';
	}
	function refresh(): void {
		if (mv.loaded) apply();
		else mv.addEventListener('load', () => apply(), { once: true });
		syncCamera();
	}

	function spin(): void {
		const current = mv.getCameraOrbit ? mv.getCameraOrbit() : null;
		const startDeg = current ? (current.theta * 180) / Math.PI : 0;
		const start = performance.now();
		const duration = 900;
		function frame(now: number) {
			const t = Math.min(1, (now - start) / duration);
			const eased = 1 - Math.pow(1 - t, 3);
			mv.cameraOrbit = `${startDeg + eased * 360}deg 85deg 105%`;
			if (t < 1) requestAnimationFrame(frame);
			else syncCamera();
		}
		requestAnimationFrame(frame);
	}

	const hint = document.getElementById('heroHint');
	const dire = (t: string) => {
		if (hint) hint.textContent = t;
	};

	let ic = 0;
	const swatches = [...document.querySelectorAll<HTMLButtonElement>('#heroColoris button')];
	function setColorIndex(i: number, muet = false): void {
		ic = ((i % PALETTE.length) + PALETTE.length) % PALETTE.length;
		hex = PALETTE[ic].hex;
		if (!muet) dire('Coloris — ' + PALETTE[ic].nom);
		swatches.forEach((b, n) => b.classList.toggle('on', n === ic));
		refresh();
	}

	let ip = PLACES.indexOf(DEFAULT_PLACE);
	function setPlaceIndex(i: number): void {
		ip = ((i % PLACES.length) + PLACES.length) % PLACES.length;
		place = PLACES[ip];
		dire('Emplacement — ' + PLACE_LABELS[place]);
		refresh();
	}

	document.querySelectorAll<HTMLElement>('[data-jeu]').forEach((el) => {
		const type = el.dataset.jeu;
		const jouer = () => {
			if (type === 'couleur') setColorIndex(ic + 1);
			else if (type === 'placement') setPlaceIndex(ip + 1);
			else {
				spin();
				dire('Un tour, et on lance la série');
			}
		};
		el.addEventListener('mouseenter', jouer);
		el.addEventListener('click', jouer);
	});

	swatches.forEach((b, n) => b.addEventListener('click', () => setColorIndex(n)));

	document.getElementById('heroFile')?.addEventListener('change', (e) => {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (!f) return;
		const r = new FileReader();
		r.onload = () => {
			printUrl = String(r.result);
			dire('Votre visuel est en place');
			refresh();
		};
		r.readAsDataURL(f);
	});

	swatches.forEach((b, n) => b.classList.toggle('on', n === 0));
	refresh();

	// Changement automatique de coloris toutes les 2 secondes (demande
	// Milio) — silencieux (ne réécrit pas #heroHint) pour ne pas noyer les
	// messages déclenchés par une vraie interaction. En pause si l'onglet
	// est en arrière-plan, pour ne pas relancer une texture 2048² à vide.
	setInterval(() => {
		if (document.hidden) return;
		setColorIndex(ic + 1, true);
	}, 2000);
}
