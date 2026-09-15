// Vignette 3D de la page d'accueil — réutilise le vrai modèle glTF et le
// même principe de texture que le configurateur
// (src/scripts/personnalisateur/render.ts) : la couleur et le visuel
// imprimé sont composités dans un canvas puis appliqués comme
// baseColorTexture du matériau, plutôt qu'un rendu 3D maison.
//
// On ne réutilise pas le module personnalisateur tel quel : il suppose
// tout le DOM et l'état global (S) du configurateur, absents ici. Cette
// version est un sous-ensemble volontairement minimal (pas de calques
// éditables, pas de sauvegarde) — les zones d'impression et l'échelle de
// texture viennent de personnalisateur/print-zones.ts (source unique,
// partagée avec le configurateur et le modèle du quiz).
import { catalogueColoris, type Emplacement } from '../../config/parametres-metier';
import { PRINT_RECT, PANEL_SCALE } from '../personnalisateur/print-zones';
import { showEggToast } from '../../lib/easter-egg';

const TEXTURE_URL = '/personnalisateur/model/textures/Material_baseColor.png';

// Un design peut être un simple logo (1 élément) ou une composition
// fidèle à un vrai visuel client avec plusieurs éléments indépendants
// répartis sur la face et le dos (demande Milio du 2026-09-08 : ne plus
// se limiter aux logos Presstee, reproduire les vrais visuels envoyés).
interface DesignElement {
	url: string;
	place: Emplacement;
	xFrac: number; // position horizontale dans la zone d'impression, 0.5 = centré
	yFrac: number; // position verticale dans la zone (0 = ourlet, 1 = col — cf. buildTexture)
	wFrac: number; // largeur de l'élément, fraction de la largeur de la zone d'impression
}
interface Design {
	elements: DesignElement[];
}

function single(url: string, place: Emplacement, wFrac: number, yFrac: number, xFrac = 0.5): Design {
	return { elements: [{ url, place, xFrac, yFrac, wFrac }] };
}

// Premier vrai visuel client reproduit fidèlement (mockup « ASPEN /
// Lotus Elan 2+2 1969 » fourni par Milio le 2026-09-08) : chaque élément
// du mockup (numéro, logos, texte, illustration) est extrait en PNG
// détouré et repositionné ici selon les proportions mesurées sur le
// mockup d'origine — pas un simple logo unique. D'autres visuels
// viendront remplacer les 3 logos Presstee restants au fil des envois.
const ASPEN_LOTUS: Design = {
	elements: [
		{ url: '/hero-designs/aspen-lotus-1969/numero-29.png', place: 'face', xFrac: 0.492, yFrac: 0.949, wFrac: 0.106 },
		{ url: '/hero-designs/aspen-lotus-1969/lotus-logo.png', place: 'face', xFrac: 0.268, yFrac: 0.815, wFrac: 0.118 },
		{ url: '/hero-designs/aspen-lotus-1969/gsr-logo.png', place: 'face', xFrac: 0.717, yFrac: 0.819, wFrac: 0.097 },
		{ url: '/hero-designs/aspen-lotus-1969/aspen-wordmark.png', place: 'face', xFrac: 0.5, yFrac: 0.63, wFrac: 0.56 },
		{ url: '/hero-designs/aspen-lotus-1969/lotus-elan-text.png', place: 'dos', xFrac: 0.499, yFrac: 0.95, wFrac: 0.561 },
		{ url: '/hero-designs/aspen-lotus-1969/annee-1969.png', place: 'dos', xFrac: 0.505, yFrac: 0.802, wFrac: 0.173 },
		{ url: '/hero-designs/aspen-lotus-1969/voiture.png', place: 'dos', xFrac: 0.5, yFrac: 0.606, wFrac: 0.58 },
		// Textes de manche (mockup d'origine) : ajoutés le 2026-09-08, une
		// fois l'emplacement manche disponible dans l'atlas (cf. PRINT_RECT
		// ci-dessus) — simplifiés à un seul mot par manche (les détails
		// "F.LASAIRES"/petit "29" du mockup, spécifiques à la vue de face,
		// sont redondants avec le "29" déjà bien visible sur la face/dos).
		{ url: '/hero-designs/aspen-lotus-1969/manche-aspen.png', place: 'manche-droite', xFrac: 0.5, yFrac: 0.5, wFrac: 0.7 },
		{ url: '/hero-designs/aspen-lotus-1969/manche-presstee.png', place: 'manche-gauche', xFrac: 0.5, yFrac: 0.5, wFrac: 0.75 },
	],
};

// Deuxième visuel client reproduit fidèlement (mockup « ASPEN / Lotus »
// décliné en vert bouteille, fourni par Milio le 2026-09-08), même
// principe que ASPEN_LOTUS : la bande centrale (face et dos) n'est pas
// extraite de la photo (vert sur vert, très peu de contraste dans le
// mockup) mais recréée directement en 3 aplats verticaux (vert-crème-
// vert, mêmes proportions que le mockup) — plus fiable que d'essayer de
// détourer un vert à peine différent du t-shirt lui-même.
// V2 (Milio, 2026-09-15 : « ça remplace entièrement ce qui est déjà en
// place, c'était bugué ») — chaque élément extrait de la planche fournie
// (roundel Lotus + F.LASAIRES et GSR/ASPEN sur la face, LOTUS ELAN 2+2 et
// Green Spirit Racing/ASPEN au dos, chiffres "9"/"2" séparés). Positions
// posées au jugé à partir des proportions de la planche d'origine, à
// ajuster une fois vues sur le vrai modèle 3D.
const GREEN_ASPEN: Design = {
	elements: [
		{ url: '/hero-designs/aspen-lotus-green/bande.png', place: 'face', xFrac: 0.5, yFrac: 0.5, wFrac: 0.24 },
		{ url: '/hero-designs/aspen-lotus-green/roundel-lasaires.png', place: 'face', xFrac: 0.5, yFrac: 0.76, wFrac: 0.3 },
		{ url: '/hero-designs/aspen-lotus-green/gsr-aspen.png', place: 'face', xFrac: 0.82, yFrac: 0.78, wFrac: 0.32 },
		{ url: '/hero-designs/aspen-lotus-green/chiffre-9.png', place: 'face', xFrac: 0.1, yFrac: 0.78, wFrac: 0.14 },
		{ url: '/hero-designs/aspen-lotus-green/chiffre-2.png', place: 'face', xFrac: 0.95, yFrac: 0.78, wFrac: 0.14 },
		{ url: '/hero-designs/aspen-lotus-green/bande.png', place: 'dos', xFrac: 0.5, yFrac: 0.5, wFrac: 0.24 },
		{ url: '/hero-designs/aspen-lotus-green/lotus-elan.png', place: 'dos', xFrac: 0.5, yFrac: 0.72, wFrac: 0.8 },
		{ url: '/hero-designs/aspen-lotus-green/green-spirit-aspen.png', place: 'dos', xFrac: 0.5, yFrac: 0.32, wFrac: 0.45 },
		{ url: '/hero-designs/aspen-lotus-green/chiffre-2.png', place: 'dos', xFrac: 0.87, yFrac: 0.5, wFrac: 0.14 },
		{ url: '/hero-designs/aspen-lotus-green/manche-aspen.png', place: 'manche-droite', xFrac: 0.5, yFrac: 0.5, wFrac: 0.55 },
		{ url: '/hero-designs/aspen-lotus-green/manche-presstee.png', place: 'manche-gauche', xFrac: 0.5, yFrac: 0.5, wFrac: 0.55 },
	],
};

// Un design par coloris (PALETTE ci-dessous), pas 4 alternés en boucle :
// dès que la couleur change, le design change aussi (demande Milio du
// 2026-09-04), et chaque vrai visuel reçu reste apparié à SON coloris
// d'origine plutôt que de retomber au hasard sur un autre. yFrac des
// logos Presstee restants calibré empiriquement en rendant plusieurs
// repères sur le modèle réel (pas déduit de l'atlas, très trompeur une
// fois projeté sur la surface courbe) : le logo horizontal à ~3 cm sous
// l'encolure, l'icône seule vraiment centrée sur son emplacement.
const LOGOS: Design[] = [
	ASPEN_LOTUS, // Blanc
	single('/hero-designs/presstee-villa-sable/presstee-villa.png', 'face', 0.55, 0.68), // Sable
	single('/logo/presstee-icone-jaune.svg', 'coeur', 0.6, 0.5), // Indigo Presstee
	single('/logo/presstee-icone.svg', 'dos', 0.46, 0.6), // Noir
	single('/logo/presstee-horizontal.svg', 'face', 0.35, 0.85), // Jaune Presstee
	single('/logo/presstee-icone-jaune.svg', 'coeur', 0.6, 0.5), // Bleu marine
	single('/logo/presstee-icone.svg', 'dos', 0.46, 0.6), // Rouge
	GREEN_ASPEN, // Vert bouteille
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

async function buildTexture(hex: string, design: Design): Promise<string> {
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

	const imgs = await Promise.all(design.elements.map((el) => loadPrintCached(el.url)));
	design.elements.forEach((el, i) => {
		const rect = PRINT_RECT[el.place];
		const img = imgs[i];
		const w = rect.w * el.wFrac;
		const ratio = img.naturalWidth && img.naturalHeight ? img.naturalHeight / img.naturalWidth : 1;
		const h = w * ratio;
		const cx = rect.x + rect.w * el.xFrac;
		const cy = rect.y + rect.h * el.yFrac;
		ctx.save();
		ctx.translate(cx, cy);
		// Chaque panneau a son propre retournement dans l'atlas UV (cf.
		// PANEL_SCALE ci-dessus) : on recompense en dessinant le visuel
		// inversé sur l'axe correspondant.
		const panelScale = PANEL_SCALE[el.place];
		ctx.scale(panelScale.x, panelScale.y);
		ctx.drawImage(img, -w / 2, -h / 2, w, h);
		ctx.restore();
	});

	return c.toDataURL('image/png');
}

export function initHero3D(): void {
	const mv = document.getElementById('heroStage') as any;
	if (!mv) return;

	let hex = PALETTE[0].hex;
	let ic = 0;
	let il = 0;
	// L'essai d'un visuel perso (input file) remplace tout le design
	// courant par un seul élément centré sur la face — comportement
	// simple et prévisible plutôt que de choisir arbitrairement lequel
	// des éléments du design en cours il faudrait remplacer.
	let designOverride: Design | null = null;

	function currentDesign(): Design {
		return designOverride ?? LOGOS[il];
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
			const dataUrl = await buildTexture(hex, currentDesign());
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

	// Dès que le visiteur a vraiment touché au modèle (glissé pour le
	// faire tourner, changé de coloris, importé son propre visuel), on
	// arrête pour de bon la démo automatique (rotation + zoom au repos,
	// et le cycle de coloris/design toutes les 2 s) : elle reprendrait
	// sinon la main sur un choix que le visiteur vient de faire lui-même
	// (demande Milio du 2026-09-08).
	let userInteracted = false;
	function markInteracted(): void {
		userInteracted = true;
	}

	// Angle de départ de la rotation au repos : si le design a du contenu
	// sur la face (le cas le plus courant, y compris les designs
	// multi-éléments qui couvrent face ET dos), on démarre face visible ;
	// sinon (design uniquement au dos) on démarre dos visible.
	function baseTheta(): number {
		const hasFront = currentDesign().elements.some((el) => el.place !== 'dos');
		return hasFront ? 0 : 180;
	}

	// Clin d'œil : un tour complet (360°) fait à la main pendant un seul
	// glisser continu déclenche un petit rebond du modèle, comme s'il
	// saluait (Milio, 2026-09-09, menu d'easter eggs validé). On cumule le
	// delta d'angle réel entre deux 'camera-change' plutôt que la distance
	// en pixels glissés : fiable quel que soit le zoom ou la sensibilité
	// de l'orbite. defensive : si l'API diffère d'une version à l'autre de
	// model-viewer, on abandonne silencieusement plutôt que de casser quoi
	// que ce soit d'autre.
	let dragAccumDeg = 0;
	let lastDragThetaDeg: number | null = null;
	function onCameraChange(): void {
		if (!dragging) {
			lastDragThetaDeg = null;
			return;
		}
		try {
			const orbit = mv.getCameraOrbit();
			const thetaDeg = (orbit.theta * 180) / Math.PI;
			if (lastDragThetaDeg != null) {
				const delta = (((thetaDeg - lastDragThetaDeg + 180) % 360) + 360) % 360 - 180;
				dragAccumDeg += Math.abs(delta);
				if (dragAccumDeg >= 360) {
					dragAccumDeg = -Infinity; // un seul rebond par glisser, même si le tour continue
					bounceHeroZone();
				}
			}
			lastDragThetaDeg = thetaDeg;
		} catch {
			// API absente : pas d'easter egg, tant pis.
		}
	}
	function bounceHeroZone(): void {
		const zone = document.getElementById('heroZone');
		if (!zone) return;
		zone.classList.remove('spin-bounce');
		void zone.offsetWidth;
		zone.classList.add('spin-bounce');
	}
	mv.addEventListener('camera-change', onCameraChange);

	mv.addEventListener('pointerdown', () => {
		dragging = true;
		dragAccumDeg = 0;
		lastDragThetaDeg = null;
	});
	window.addEventListener('pointerup', () => {
		if (!dragging) return;
		dragging = false;
		pausedUntil = performance.now() + RESUME_DELAY_MS;
		markInteracted();
	});
	window.addEventListener('pointercancel', () => {
		dragging = false;
		pausedUntil = performance.now() + RESUME_DELAY_MS;
	});

	function idleFrame(now: number): void {
		if (lastFrame == null) lastFrame = now;
		const dt = now - lastFrame;
		lastFrame = now;
		if (!dragging && !spinning && !userInteracted && now >= pausedUntil && mv.loaded) {
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

	// ---- Coloris, design, mots interactifs, import -----------------------
	const swatches = [...document.querySelectorAll<HTMLButtonElement>('#heroColoris button')];

	// Clin d'œil : essayer les deux couleurs de la marque (vérifiées dans
	// les vrais fichiers logo, pas devinées) — le jaune et le violet
	// utilisés partout dans /public/logo/*.svg.
	const BRAND_HEXES = ['#FFC500', '#9B07FF'];
	const brandColorsSeen = new Set<string>();
	let brandEggShown = false;
	function checkBrandColors(h: string): void {
		const low = h.toLowerCase();
		if (!BRAND_HEXES.includes(low)) return;
		brandColorsSeen.add(low);
		if (!brandEggShown && BRAND_HEXES.every((b) => brandColorsSeen.has(b))) {
			brandEggShown = true;
			showEggToast('Vous avez trouvé nos couleurs.');
		}
	}

	function setColorIndex(i: number): void {
		ic = wrap(i, PALETTE.length);
		il = wrap(i, LOGOS.length); // le design change avec la couleur (demande Milio)
		hex = PALETTE[ic].hex;
		checkBrandColors(hex);
		swatches.forEach((b, n) => b.classList.toggle('on', n === ic));
		refresh();
	}
	function setLogoIndex(i: number): void {
		il = wrap(i, LOGOS.length);
		refresh();
	}

	// Seul un clic explicite déclenche l'aperçu ludique (couleur/placement/
	// spin) : au survol, le texte se surligne (CSS pur) mais le t-shirt 3D
	// ne bouge plus — ça perturbait trop les visiteurs qui lisaient juste
	// le texte (retour Milio du 2026-09-15).
	document.querySelectorAll<HTMLElement>('[data-jeu]').forEach((el) => {
		const type = el.dataset.jeu;
		const jouer = () => {
			if (type === 'couleur') setColorIndex(ic + 1);
			else if (type === 'placement') setLogoIndex(il + 1);
			else spin();
		};
		el.addEventListener('click', () => {
			jouer();
			markInteracted();
		});
	});

	swatches.forEach((b, n) =>
		b.addEventListener('click', () => {
			setColorIndex(n);
			markInteracted();
		})
	);

	document.getElementById('heroFile')?.addEventListener('change', (e) => {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (!f) return;
		const r = new FileReader();
		r.onload = () => {
			designOverride = single(String(r.result), 'face', 0.55, 0.5);
			markInteracted();
			refresh();
		};
		r.readAsDataURL(f);
	});

	swatches.forEach((b, n) => b.classList.toggle('on', n === 0));
	refresh();

	// Changement automatique de coloris (et donc de design) toutes les 2
	// secondes. En pause si l'onglet est en arrière-plan (pour ne pas
	// relancer une texture 2048² à vide) ou si le visiteur a pris la main.
	setInterval(() => {
		if (document.hidden || userInteracted) return;
		setColorIndex(ic + 1);
	}, 2000);
}
