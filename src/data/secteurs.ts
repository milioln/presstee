// Source unique du contenu par secteur d'activité — utilisée par la
// liste de puces "Des conseils par activité" de l'accueil et du guide
// (teaser : juste le nom) et par les pages dédiées /secteurs/[slug]
// (contenu complet, pour être trouvable depuis une recherche Google
// propre à ce secteur — Milio, 2026-09-10 : « développer beaucoup plus,
// écrire pour le référencement, parler au client, l'aider à commander »,
// puis 2026-09-15 : « plus d'éléments graphiques, un meilleur article »).
//
// Photos libres de droits (Pexels), une par secteur (Milio, 2026-09-15 :
// « télécharge des photos libres de droit... on va les flouter, c'est
// pas grave de ce qu'on voit dessus, il faut juste qu'on comprenne que
// ça soit en lien ») — le flou appliqué en case (.tcard-bg) rend le
// détail exact de la photo secondaire, seule l'ambiance générale compte.
export interface Secteur {
	slug: string;
	nom: string;
	// Une phrase très courte, dans l'esprit de l'accroche des fiches
	// technique (ex. "Le plus économique... à partir de 25 pièces.") —
	// utilisée dans la case compacte du guide, pas sur la page dédiée.
	accroche: string;
	// Photo réelle en fond flouté de la case du guide (cf. accroche
	// ci-dessus).
	image: string | null;
	// Accroche courte, adressée directement au lecteur — utilisée en haut
	// de la page dédiée et comme teaser dans le panneau de l'accueil.
	texte: string;
	// Le vrai besoin derrière la demande : pourquoi ce secteur personnalise
	// du textile, ce qui coince en général avant de commander.
	motivation: string;
	// Un angle métier propre à ce secteur, au-delà du simple besoin
	// d'uniforme.
	insight: string;
	// Pourquoi ce textile et cette technique précisément, pas une autre —
	// inclut déjà le marquage conseillé, pas besoin d'une fiche à part.
	conseil: string;
	// Un cas de figure concret et réaliste, pour rendre la page plus
	// parlante qu'une simple liste de repères — clairement présenté comme
	// un exemple type, jamais comme un vrai client cité.
	exemple: string;
	// Technique la plus pertinente pour ce secteur — lien direct vers sa
	// fiche technique (cf. src/lib/techniques-data.ts).
	techniqueSlug: string;
	// Icône (contenu SVG brut, sans balise <svg> englobante) illustrant le
	// secteur en tête de page, en l'absence de vraie photo.
	icon: string;
}

export const SECTEURS: Secteur[] = [
	{
		slug: 'associations',
		nom: 'Associations',
		accroche: 'Financez vos événements avec des t-shirts vendus aux adhérents.',
		image: '/secteurs/associations.webp',
		texte:
			"Vous représentez une association ? Un textile personnalisé — t-shirt, sweat, tote bag — donne une présence visible à votre structure lors d'un événement, d'une sortie ou d'un forum, sans faire exploser un budget déjà serré.",
		motivation:
			"La difficulté n'est rarement l'envie : c'est de savoir, avant de s'engager, combien coûtera vraiment la commande une fois le nombre de pièces et les couleurs fixés. Beaucoup d'associations renoncent ou attendent le dernier moment faute d'une estimation claire. Le test guidé de Presstee répond à cette question en quelques clics, sans échange de mail préalable ni devis à réclamer.",
		insight:
			"Vendu aux adhérents ou lors d'un événement — loto, kermesse, tournoi —, le t-shirt de l'association devient une petite source de financement : sur une série de 50 pièces revendues 12 à 15 € l'unité, la marge couvre souvent une bonne partie du coût de la commande, sans toucher à la cotisation.",
		conseil:
			"Pour une association, le bon compromis est presque toujours un t-shirt coton 150 à 180 g/m² : assez épais pour ne pas être transparent, assez léger pour être porté toute l'année. Au-delà d'une trentaine de pièces, la sérigraphie devient la technique la plus économique — son coût de calage se répartit sur toute la série, ce qui fait mécaniquement baisser le prix unitaire à mesure que la commande grossit.",
		exemple:
			"Une association sportive qui organise son tournoi de fin de saison commande par exemple 60 t-shirts en sérigraphie, aux couleurs du club, pour ses joueurs et son bureau — une partie est ensuite vendue aux familles présentes, ce qui finance une bonne part de la commande.",
		techniqueSlug: 'serigraphie',
		icon: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c0-3.4 2.5-6 5.5-6s5.5 2.6 5.5 6"/><circle cx="17" cy="8.5" r="2.4"/><path d="M15.8 14.2c2.7.3 4.7 2.7 4.7 5.8"/>',
	},
	{
		slug: 'bde-ecoles',
		nom: 'BDE et écoles',
		accroche: "Le sweat de promo que tout le monde s'arrache à la rentrée.",
		image: '/secteurs/bde-ecoles.webp',
		texte:
			"Vous organisez l'intégration, un week-end ou une soirée pour votre BDE, votre association étudiante ou votre école ? Le sweat ou le t-shirt de promo est souvent le seul objet qui reste une fois l'événement terminé — et celui que tout le monde veut porter le jour J.",
		motivation:
			"La contrainte est presque toujours la même : un délai serré autour de la rentrée, un visuel unique décidé collectivement, et une grosse série à commander d'un coup sans mauvaise surprise sur le prix. Plus la commande est grande, plus l'écart entre une estimation approximative et le prix réel peut peser sur le budget de la promo.",
		insight:
			"Beaucoup d'anciens élèves commandent le sweat ou le t-shirt de promo des années après avoir quitté l'école : l'objet dépasse largement le cercle des présents le jour J, ce qui justifie de prévoir plus de pièces que de participants annoncés.",
		conseil:
			"Sur ces volumes, souvent 80 à 400 pièces, un sweat molleton 280 à 320 g/m² en sérigraphie est la combinaison la plus rentable : un visuel unique, valable pour toute la promo, imprimé en une seule fois sur des écrans qui serviront pour toute la série.",
		exemple:
			"Un BDE qui prépare son week-end d'intégration commande souvent 150 sweats à capuche floqués du nom de la promo, livrés avant le départ — largement au-delà du nombre d'étudiants inscrits, pour couvrir aussi ceux qui les commandent après coup.",
		techniqueSlug: 'serigraphie',
		icon: '<path d="M3.5 5.2c2.7-1 5.4-1 7.5.6v13c-2.1-1.6-4.8-1.6-7.5-.6V5.2z"/><path d="M20.5 5.2c-2.7-1-5.4-1-7.5.6v13c2.1-1.6 4.8-1.6 7.5-.6V5.2z"/>',
	},
	{
		slug: 'bars-restaurants',
		nom: 'Bars et restaurants',
		accroche: 'Un uniforme qui tient au lavage, commande après commande.',
		image: '/secteurs/bars-restaurants.webp',
		texte:
			"Vous voulez habiller votre équipe en salle ou en cuisine avec un t-shirt ou un tablier reconnaissable ? Le textile professionnel dans la restauration doit avant tout résister à un usage quotidien et à des lavages fréquents à haute température.",
		motivation:
			"Un tablier ou un t-shirt floqué au nom de l'établissement renforce l'identité du lieu autant qu'il évite la confusion en salle sur qui fait partie du service. Le vrai critère de choix n'est pas esthétique en premier lieu : c'est la tenue du marquage dans le temps, lavage après lavage.",
		insight:
			"Certains établissements vont plus loin que l'uniforme de service : ils vendent le t-shirt ou le tote bag directement à leur clientèle, une pratique déjà courante à l'étranger. Entre le prix d'achat en gros et le prix de vente à l'unité, la marge est confortable pour un produit qui ne demande presque pas de stock.",
		conseil:
			"Sous 25 pièces, le transfert monochrome est le plus économique et suffisant pour un logo simple ; au-delà, la sérigraphie prend le relais et tient mieux sur le long terme. Un t-shirt épais (185 g/m²) ou un tablier en toile résistante encaissent mieux les lavages répétés qu'un textile plus léger.",
		exemple:
			"Un restaurant qui renouvelle sa tenue de salle chaque saison commande une trentaine de t-shirts floqués pour l'équipe, et en profite pour en faire imprimer quelques-uns de plus, vendus ensuite au comptoir.",
		techniqueSlug: 'transfert-monochrome',
		icon: '<path d="M6 3h12l-1.4 11.2a4 4 0 0 1-4 3.5h-1.2a4 4 0 0 1-4-3.5L6 3z"/><path d="M9 21h6"/><path d="M12 17.7V21"/>',
	},
	{
		slug: 'evenements',
		nom: 'Événements',
		accroche: "Un visuel prêt en quelques jours, même dans l'urgence.",
		image: '/secteurs/evenements.webp',
		texte:
			"Vous organisez un événement — festival, course, salon, soirée — et avez besoin d'un t-shirt visuel, produit vite et en quantité ? La contrainte n'est presque jamais le budget : c'est le délai.",
		motivation:
			"Un visuel riche en couleurs, une quantité parfois révisée jusqu'au dernier moment, un délai serré : la réactivité compte plus que la durabilité, puisque le t-shirt sera surtout porté le jour même et dans les semaines qui suivent.",
		insight:
			"Une fois la soirée terminée, le t-shirt de l'événement est souvent tout ce qu'il en reste concrètement — porté ensuite dans la rue par les participants, il continue de faire de la publicité pour l'édition suivante, longtemps après coup.",
		conseil:
			"Le transfert quadrichromie est la technique la plus adaptée : couleurs et dégradés illimités, sans frais de calage à amortir, ce qui le rend rentable même sur une série décidée dans l'urgence. Un t-shirt léger (150 g/m²) reste le plus confortable à porter toute une journée, en intérieur comme en extérieur.",
		exemple:
			"Un festival local commande 200 t-shirts en transfert quadrichromie quelques semaines avant la date, avec un visuel finalisé au dernier moment — sans frais de calage à amortir, le prix ne change pas si le nombre de couleurs augmente.",
		techniqueSlug: 'transfert-quadrichromie',
		icon: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
	},
	{
		slug: 'marques-de-vetements',
		nom: 'Marques de vêtements',
		accroche: "Le même calage, reproductible à l'identique d'un drop à l'autre.",
		image: '/secteurs/marques-de-vetements.webp',
		texte:
			"Vous créez votre propre marque de vêtements et cherchez un atelier pour produire vos pièces ? Contrairement à un événement ponctuel, chaque collection doit pouvoir être reproduite à l'identique, saison après saison, avec un rendu qui tient la comparaison avec ce que vendent déjà les marques établies.",
		motivation:
			"Le vrai enjeu pour une marque n'est pas de réussir une seule série : c'est de pouvoir la refaire à l'identique six mois plus tard pour réassortir un best-seller ou lancer un nouveau drop, sans repartir de zéro à chaque fois — même textile, mêmes coloris, même calage.",
		insight:
			"Beaucoup de marques démarrent sur de très petites séries (30 à 100 pièces) pour tester un visuel avant d'investir dans une production plus large — mieux vaut découvrir qu'un motif ne se vend pas sur 50 pièces que sur 500.",
		conseil:
			"Pour une marque, le choix du textile compte autant que la technique : un coton épais et bien coupé (180 à 220 g/m²) donne un tombé qui se remarque en photo comme en boutique. La sérigraphie reste la référence dès qu'un même visuel doit être refait à l'identique sur plusieurs commandes — une fois réglé, le calage se réutilise d'une série à l'autre sans frais supplémentaire.",
		exemple:
			"Une marque de streetwear qui lance un nouveau drop commande par exemple 80 hoodies en sérigraphie sur un coton épais, avec le même calage réutilisé trois mois plus tard pour un réassort de 50 pièces supplémentaires sur le même visuel.",
		techniqueSlug: 'serigraphie',
		icon: '<path d="M12.6 2.6H20a1.4 1.4 0 0 1 1.4 1.4v7.4a2 2 0 0 1-.6 1.4l-8.8 8.8a2 2 0 0 1-2.8 0L2.6 15a2 2 0 0 1 0-2.8l8.8-8.8a2 2 0 0 1 1.2-.8z"/><circle cx="16.5" cy="7.5" r="1.6"/>',
	},
];

export function getSecteur(slug: string): Secteur | undefined {
	return SECTEURS.find((s) => s.slug === slug);
}
