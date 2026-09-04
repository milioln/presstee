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

// Synchronisé avec src/scripts/personnalisateur/render.ts : face/dos
// élargis et recentrés le 2026-09-04 sur la vraie largeur du panneau
// mesurée sur l'atlas (l'ancien rect était ~40 % trop étroit et décalé
// d'une soixantaine de px par rapport au centre réel — cf. le
// commentaire détaillé dans render.ts). Les échelles des logos
// ci-dessous sont ajustées en conséquence pour garder la même taille
// affichée à l'écran qu'avant cet élargissement (échelle × ancienne
// largeur / nouvelle largeur), pas la même fraction.
const PRINT_RECT: Record<Emplacement, { x: number; y: number; w: number; h: number }> = {
	face: { x: 324, y: 210, w: 580, h: 750 },
	coeur: { x: 630, y: 750, w: 130, h: 280 },
	dos: { x: 1238, y: 210, w: 580, h: 750 },
};

interface LogoDef {
	url: string;
	place: Emplacement;
	scale: number; // fraction de la largeur de la zone d'impression
	cyFrac: number; // position verticale dans la zone (0 = ourlet, 1 = col — cf. buildTexture)
}

// 4 déclinaisons du logo Presstee, alternées avec le coloris (demande
// Milio du 2026-09-04) : dès que la couleur change, le logo change
// aussi. cyFrac calibré empiriquement en rendant plusieurs repères sur
// le modèle réel (pas déduit de l'atlas, qui est très trompeur une fois
// projeté sur la surface courbe) : le logo 2 (horizontal, avec
// « Presstee ») à ~3 cm sous le col et centré horizontalement, le logo
// 4 (icône seule, en grand) vraiment centré sur le dos.
const LOGOS: LogoDef[] = [
	{ url: '/logo/presstee-vertical.svg', place: 'coeur', scale: 0.6, cyFrac: 0.5 },
	{ url: '/logo/presstee-horizontal.svg', place: 'face', scale: 0.35, cyFrac: 0.85 },
	{ url: '/logo/presstee-icone-jaune.svg', place: 'coeur', scale: 0.6, cyFrac: 0.5 },
	{ url: '/logo/presstee-icone.svg', place: 'dos', scale: 0.46, cyFrac: 0.6 },
];

// Sous-ensemble du vrai catalogue (config/parametres-metier.ts), pas une
// palette inventée : chaque coloris montré ici est réellement commandable.
const PALETTE = ['Blanc', 'Sable', 'Indigo Presstee', 'Noir', 'Jaune Presstee', 'Bleu marine', 'Rouge', 'Vert bouteille']
	.map((nom) => catalogueColoris.find((c) => c.nom === nom))
	.filter((c): c is { nom: string; hex: string } => !!c);

function wrap(i: number, n: number): number {
	return ((i % n) + n) % n;
}

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

async function buildTexture(hex: string, printUrl: string, logo: LogoDef): Promise<string> {
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

	const rect = PRINT_RECT[logo.place];
	const img = await loadPrintCached(printUrl);
	const w = rect.w * logo.scale;
	const ratio = img.naturalWidth && img.naturalHeight ? img.naturalHeight / img.naturalWidth : 1;
	const h = w * ratio;
	const cx = rect.x + rect.w / 2;
	const cy = rect.y + rect.h * logo.cyFrac;
	ctx.save();
	ctx.translate(cx, cy);
	// Le panneau avant du modèle est retourné verticalement dans l'atlas
	// UV (cf. render.ts) : on recompense en dessinant le visuel inversé.
	ctx.scale(1, -1);
	ctx.drawImage(img, -w / 2, -h / 2, w, h);
	ctx.restore();

	return c.toDataURL('image/png');
}

export function initHero3D(): void {
	const mv = document.getElementById('heroStage') as any;
	if (!mv) return;

	let hex = PALETTE[0].hex;
	let ic = 0;
	let il = 0;
	let printOverride: string | null = null;

	function currentLogo(): LogoDef {
		return LOGOS[il];
	}
	function currentPrint(): string {
		return printOverride ?? currentLogo().url;
	}

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
			const dataUrl = await buildTexture(hex, currentPrint(), currentLogo());
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
	function refresh(): void {
		if (mv.loaded) apply();
		else mv.addEventListener('load', () => apply(), { once: true });
	}

	// ---- Rotation continue + zoom automatiques au repos -------------------
	// Vrai tour de présentoir (rotation continue à 360°, pas juste un léger
	// balancement) tant que personne ne fait glisser le modèle à la main ;
	// reprend 3,2 s après le dernier glisser. Cadrage large (pas de
	// camera-target resserré sur le buste) : le vêtement entier reste
	// visible à tout angle de rotation, y compris de profil — un cadrage
	// trop serré coupait le bas du t-shirt et le faisait paraître minuscule
	// une fois la boîte forcée à un autre ratio sur mobile.
	const ROTATE_DEG_PER_SEC = 14;
	const ZOOM_PERIOD_MS = 3400;
	const ZOOM_BASE = 92;
	const ZOOM_AMPLITUDE = 6;
	const RESUME_DELAY_MS = 3200;

	let dragging = false;
	let pausedUntil = 0;
	let spinning = false;
	let driftDeg = 0;
	let lastFrame: number | null = null;

	function baseTheta(): number {
		return currentLogo().place === 'dos' ? 180 : 0;
	}

	mv.addEventListener('pointerdown', () => {
		dragging = true;
	});
	window.addEventListener('pointerup', () => {
		if (!dragging) return;
		dragging = false;
		pausedUntil = performance.now() + RESUME_DELAY_MS;
	});
	window.addEventListener('pointercancel', () => {
		dragging = false;
		pausedUntil = performance.now() + RESUME_DELAY_MS;
	});

	function idleFrame(now: number): void {
		if (lastFrame == null) lastFrame = now;
		const dt = now - lastFrame;
		lastFrame = now;
		if (!dragging && !spinning && now >= pausedUntil && mv.loaded) {
			driftDeg = (driftDeg + (dt / 1000) * ROTATE_DEG_PER_SEC) % 360;
			const zoom = ZOOM_BASE + Math.sin(now / ZOOM_PERIOD_MS + 1) * ZOOM_AMPLITUDE;
			mv.cameraOrbit = `${baseTheta() + driftDeg}deg 85deg ${zoom.toFixed(1)}%`;
		}
		requestAnimationFrame(idleFrame);
	}
	requestAnimationFrame(idleFrame);

	function spin(): void {
		spinning = true;
		const startDrift = driftDeg;
		const start = performance.now();
		const duration = 900;
		function frame(now: number) {
			const t = Math.min(1, (now - start) / duration);
			const eased = 1 - Math.pow(1 - t, 3);
			driftDeg = (startDrift + eased * 360) % 360;
			mv.cameraOrbit = `${baseTheta() + driftDeg}deg 85deg ${ZOOM_BASE}%`;
			if (t < 1) requestAnimationFrame(frame);
			else spinning = false;
		}
		requestAnimationFrame(frame);
	}

	// ---- Coloris, logo, mots interactifs, import -----------------------
	const swatches = [...document.querySelectorAll<HTMLButtonElement>('#heroColoris button')];
	function setColorIndex(i: number): void {
		ic = wrap(i, PALETTE.length);
		il = wrap(i, LOGOS.length); // le logo change avec la couleur (demande Milio)
		hex = PALETTE[ic].hex;
		swatches.forEach((b, n) => b.classList.toggle('on', n === ic));
		refresh();
	}
	function setLogoIndex(i: number): void {
		il = wrap(i, LOGOS.length);
		refresh();
	}

	document.querySelectorAll<HTMLElement>('[data-jeu]').forEach((el) => {
		const type = el.dataset.jeu;
		const jouer = () => {
			if (type === 'couleur') setColorIndex(ic + 1);
			else if (type === 'placement') setLogoIndex(il + 1);
			else spin();
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
			printOverride = String(r.result);
			refresh();
		};
		r.readAsDataURL(f);
	});

	swatches.forEach((b, n) => b.classList.toggle('on', n === 0));
	refresh();

	// Changement automatique de coloris (et donc de logo) toutes les 2
	// secondes. En pause si l'onglet est en arrière-plan, pour ne pas
	// relancer une texture 2048² à vide.
	setInterval(() => {
		if (document.hidden) return;
		setColorIndex(ic + 1);
	}, 2000);
}
