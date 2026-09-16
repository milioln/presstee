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
// Anti-cache pour les photos de secteur (Milio, 2026-09-16 : après avoir
// remplacé ces fichiers, le rendu affiché restait l'ancien — même nom de
// fichier, donc le navigateur (voire le cache OVH) sert la version en
// cache au lieu de la nouvelle). À incrémenter à chaque remplacement de
// ces fichiers pour forcer le rechargement, plutôt que de compter sur un
// vidage de cache manuel.
export const SECTEUR_IMG_V = 2;

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
			"Vous représentez une association ? Sortie, forum, tournoi, kermesse : un t-shirt aux couleurs du club rend votre structure visible en deux secondes, là où un flyer se perd dans une poche. Et contrairement à ce qu'on imagine, ça ne veut pas dire exploser le budget.",
		motivation:
			"La difficulté n'est presque jamais l'envie — c'est l'incertitude sur le prix final une fois le nombre de pièces et les couleurs arrêtés. Résultat : beaucoup d'associations renoncent, ou s'y prennent au dernier moment faute d'un chiffre clair à présenter au bureau. Le test guidé de Presstee tranche la question en quelques clics, sans mail à envoyer ni devis à réclamer.",
		insight:
			"Revendu aux adhérents ou lors d'un événement — loto, kermesse, tournoi —, le t-shirt de l'association devient une petite source de financement. Sur une série de 50 pièces cédées 12 à 15 € l'unité, la marge couvre souvent l'essentiel de la commande — sans toucher un centime à la cotisation.",
		conseil:
			"Pour une association, le compromis qui marche presque à chaque fois, c'est le t-shirt coton 150 à 180 g/m² : assez épais pour ne pas être transparent, assez léger pour se porter toute l'année. Passé la trentaine de pièces, la sérigraphie prend l'avantage — le coût du calage se dilue dans la série, et le prix unitaire baisse mécaniquement à mesure que la commande grossit.",
		exemple:
			"Une association sportive qui organise son tournoi de fin de saison commande par exemple 60 t-shirts en sérigraphie, aux couleurs du club, pour ses joueurs et son bureau. Une partie repart ensuite dans les mains des familles présentes — de quoi financer une bonne part de la facture.",
		techniqueSlug: 'serigraphie',
		icon: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c0-3.4 2.5-6 5.5-6s5.5 2.6 5.5 6"/><circle cx="17" cy="8.5" r="2.4"/><path d="M15.8 14.2c2.7.3 4.7 2.7 4.7 5.8"/>',
	},
	{
		slug: 'bde-ecoles',
		nom: 'BDE et écoles',
		accroche: "Le sweat de promo que tout le monde s'arrache à la rentrée.",
		image: '/secteurs/bde-ecoles.webp',
		texte:
			"Vous organisez l'intégration, un week-end ou une soirée pour votre BDE ou votre école ? Une fois les banderoles rangées et les souvenirs un peu flous, il reste une chose : le sweat de promo. L'objet que tout le monde veut porter le jour J — et que personne ne veut rater à la commande.",
		motivation:
			"La contrainte est presque toujours la même : un délai serré collé à la rentrée, un visuel décidé à quinze en amphi, et une grosse série à commander d'un coup, sans surprise sur le prix. Plus la commande grossit, plus le moindre écart entre l'estimation et la facture réelle pèse sur le budget de la promo.",
		insight:
			"Il y a toujours quelqu'un qui recommande le sweat de promo des années après avoir quitté l'école. L'objet dépasse largement le cercle des présents le jour J — une bonne raison de prévoir plus de pièces que d'inscrits annoncés.",
		conseil:
			"Sur ces volumes — souvent 80 à 400 pièces — le sweat molleton 280 à 320 g/m² en sérigraphie est imbattable : un seul visuel, gravé une seule fois, imprimé sur toute la série sans surcoût supplémentaire.",
		exemple:
			"Un BDE qui prépare son week-end d'intégration commande souvent 150 sweats à capuche floqués du nom de la promo, livrés avant le départ — bien au-delà du nombre d'inscrits, pour couvrir ceux qui craquent après coup.",
		techniqueSlug: 'serigraphie',
		icon: '<path d="M3.5 5.2c2.7-1 5.4-1 7.5.6v13c-2.1-1.6-4.8-1.6-7.5-.6V5.2z"/><path d="M20.5 5.2c-2.7-1-5.4-1-7.5.6v13c2.1-1.6 4.8-1.6 7.5-.6V5.2z"/>',
	},
	{
		slug: 'bars-restaurants',
		nom: 'Bars et restaurants',
		accroche: 'Un uniforme qui tient au lavage, commande après commande.',
		image: '/secteurs/bars-restaurants.webp',
		texte:
			"Vous voulez habiller votre équipe en salle ou en cuisine avec un t-shirt ou un tablier reconnaissable ? En restauration, le textile encaisse un lavage quotidien à haute température — la première question n'est pas esthétique, c'est : est-ce que ça va tenir jusqu'à la saison prochaine ?",
		motivation:
			"Un tablier ou un t-shirt floqué au nom de l'établissement fait deux choses à la fois : il installe l'identité du lieu, et il évite qu'un client demande le service à un habitué assis au bar. Mais le vrai critère de choix reste le même — un marquage qui tient, lavage après lavage, pas un logo qui craquelle après dix passages en machine.",
		insight:
			"Certains établissements ne s'arrêtent pas à l'uniforme : ils vendent le t-shirt ou le tote bag du restaurant directement au comptoir, une pratique déjà banale ailleurs et encore rare ici. Entre le prix d'achat en gros et le prix de vente à l'unité, la marge est confortable pour un produit qui ne demande quasiment aucun stock.",
		conseil:
			"Sous 25 pièces, le transfert monochrome suffit largement pour un logo simple et reste le plus économique. Au-delà, la sérigraphie prend le relais et tient mieux sur la durée. Côté textile, un t-shirt épais (185 g/m²) ou un tablier en toile résistante encaisse mieux les lavages répétés qu'une matière plus légère — un détail qui se voit après trois mois, pas le premier jour.",
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
			"Vous organisez un événement — festival, course, salon, soirée — et avez besoin d'un t-shirt visuel, produit vite et en quantité ? Ici, la contrainte n'est presque jamais le budget. C'est le calendrier, et il ne négocie pas.",
		motivation:
			"Un visuel riche en couleurs, une quantité qui bouge jusqu'au dernier moment, un délai qui ne bouge pas : ici, la réactivité prime sur la durabilité. Le t-shirt sera surtout porté le jour même, et dans les quelques semaines qui suivent — pas pendant dix ans.",
		insight:
			"Une fois la soirée terminée, le t-shirt est souvent tout ce qu'il en reste. Porté ensuite dans la rue, dans le métro, en soirée, il continue de faire la publicité de l'édition suivante bien après que les lumières se sont éteintes.",
		conseil:
			"Le transfert quadrichromie est la technique la plus logique ici : couleurs et dégradés illimités, aucun frais de calage à amortir — donc rentable même sur une série décidée à la dernière minute. Un t-shirt léger (150 g/m²) reste le plus confortable à porter du matin au soir, en intérieur comme en extérieur.",
		exemple:
			"Un festival local commande 200 t-shirts en transfert quadrichromie quelques semaines avant la date, avec un visuel finalisé à la dernière minute — et sans surprise sur le prix, même avec un dégradé à six couleurs.",
		techniqueSlug: 'transfert-quadrichromie',
		icon: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
	},
	{
		slug: 'marques-de-vetements',
		nom: 'Marques de vêtements',
		accroche: "Le même calage, reproductible à l'identique d'un drop à l'autre.",
		image: '/secteurs/marques-de-vetements.webp',
		texte:
			"Vous créez votre propre marque de vêtements et cherchez un atelier de confiance ? Contrairement à un événement ponctuel, une collection doit pouvoir se refaire à l'identique, saison après saison — avec un rendu qui tient la comparaison face aux marques déjà installées, pas une version approximative.",
		motivation:
			"Le vrai enjeu n'est pas de réussir une série : n'importe qui peut avoir de la chance une fois. C'est de pouvoir la refaire à l'identique six mois plus tard pour réassortir un best-seller ou lancer un nouveau drop — sans repartir de zéro. Même textile, mêmes coloris, même calage.",
		insight:
			"Beaucoup de marques démarrent sur de très petites séries — 30 à 100 pièces — pour tester un visuel avant d'investir plus large. Mieux vaut découvrir qu'un motif ne prend pas sur 50 pièces que sur 500.",
		conseil:
			"Pour une marque, le textile compte autant que la technique. Un coton épais et bien coupé (180 à 220 g/m²) donne un tombé qui se voit — en photo comme en boutique. Et la sérigraphie reste la référence dès qu'un visuel doit être refait à l'identique sur plusieurs commandes : une fois le calage réglé, il se réutilise d'une série à l'autre, sans frais supplémentaire.",
		exemple:
			"Une marque de streetwear qui lance un nouveau drop commande par exemple 80 hoodies en sérigraphie sur un coton épais — puis réutilise le même calage trois mois plus tard pour un réassort de 50 pièces, sur le même visuel.",
		techniqueSlug: 'serigraphie',
		icon: '<path d="M12.6 2.6H20a1.4 1.4 0 0 1 1.4 1.4v7.4a2 2 0 0 1-.6 1.4l-8.8 8.8a2 2 0 0 1-2.8 0L2.6 15a2 2 0 0 1 0-2.8l8.8-8.8a2 2 0 0 1 1.2-.8z"/><circle cx="16.5" cy="7.5" r="1.6"/>',
	},
];

export function getSecteur(slug: string): Secteur | undefined {
	return SECTEURS.find((s) => s.slug === slug);
}
