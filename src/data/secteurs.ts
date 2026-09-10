// Source unique du contenu par secteur d'activité — utilisée à la fois
// par le sélecteur interactif de l'accueil (SectorSelector.astro) et par
// les pages dédiées /secteurs/[slug] (une page par secteur, pour être
// trouvable depuis une recherche Google propre à ce secteur plutôt que
// seulement depuis le panneau interactif de l'accueil).
//
// Contenu éditorial (fourchettes de volumes, grammages, techniques
// conseillées par secteur) — à valider par Milio avant publication.
export interface Secteur {
	slug: string;
	nom: string;
	texte: string;
	textile: string;
	marquage: string;
	volumes: string;
	// Un angle métier propre à ce secteur, au-delà du simple besoin
	// d'uniforme (Milio, 2026-09-10 : « pour bar et restaurant, tu dis
	// qu'ils habillent leurs équipes mais peuvent aussi en vendre, ça se
	// fait de plus en plus à l'étranger, ça marche bien, belle marge » —
	// même exercice pour chaque secteur plutôt qu'un contenu générique).
	insight: string;
}

export const SECTEURS: Secteur[] = [
	{
		slug: 'associations',
		nom: 'Associations',
		texte: "Budgets serrés, commandes groupées et renouvellement régulier au fil des événements. L'enjeu est d'obtenir une pièce correcte sans faire exploser la cotisation des adhérents.",
		textile: 'T-shirt coton 150 à 180 g/m²',
		marquage: 'Sérigraphie à partir d’une trentaine de pièces',
		volumes: '30 à 150 pièces',
		insight:
			"Le t-shirt de l'association peut aussi devenir une petite source de financement : vendu aux adhérents ou lors d'un événement (loto, kermesse, tournoi), il finance une partie du budget sans passer par une hausse de cotisation.",
	},
	{
		slug: 'bde-ecoles',
		nom: 'BDE et écoles',
		texte: 'Intégration, week-ends, soirées : de grosses séries commandées d’un coup, souvent avec un visuel unique et un délai serré autour de la rentrée.',
		textile: 'Sweat molleton 280 à 320 g/m²',
		marquage: 'Sérigraphie, très rentable sur ces volumes',
		volumes: '80 à 400 pièces',
		insight:
			"Le sweat ou le t-shirt de promo devient souvent un objet-souvenir gardé des années après la sortie — ce qui pousse à en commander pour davantage que les seuls présents à l'événement, y compris pour ceux qui n'y participeront pas.",
	},
	{
		slug: 'entreprises',
		nom: 'Entreprises',
		texte: 'Uniformiser les équipes et porter l’image de marque, avec une exigence de sobriété et de tenue dans le temps plus forte que sur un textile événementiel.',
		textile: 'Polo piqué ou chemise',
		marquage: 'Broderie sur le cœur, ou transfert monochrome',
		volumes: '10 à 100 pièces',
		insight:
			"Porté par les salariés en dehors du travail (trajet, sport, weekend), le vêtement floqué aux couleurs de l'entreprise devient une publicité mobile gratuite — un polo croisé dans la rue vaut largement son coût de fabrication.",
	},
	{
		slug: 'bars-restaurants',
		nom: 'Bars et restaurants',
		texte: 'Tenues portées tous les jours et lavées à haute température. Le marquage doit tenir plusieurs centaines de lavages sans se fissurer.',
		textile: 'T-shirt épais 185 g/m² ou tablier',
		marquage: 'Transfert monochrome sous 25 pièces, sérigraphie au-delà',
		volumes: '10 à 60 pièces',
		insight:
			"Au-delà de l'uniforme de service, de plus en plus d'établissements vendent aussi le t-shirt ou le tote bag à leur clientèle — une pratique déjà courante à l'étranger, qui fonctionne bien. Entre le prix d'achat en gros et le prix de vente à l'unité, la marge est confortable pour un produit qui ne demande presque pas de stock.",
	},
	{
		slug: 'evenements',
		nom: 'Événements',
		texte: 'Délai court, quantité parfois incertaine jusqu’au dernier moment, et un visuel souvent riche en couleurs. La réactivité prime sur la durabilité.',
		textile: 'T-shirt léger 150 g/m²',
		marquage: 'Transfert quadrichromie, sans frais de calage',
		volumes: '20 à 300 pièces',
		insight:
			"Le t-shirt de l'événement est souvent le seul souvenir tangible qui reste une fois la soirée finie — porté ensuite dans la rue par les participants, il fait une publicité gratuite et durable pour l'édition suivante.",
	},
	{
		slug: 'commerces',
		nom: 'Commerces',
		texte: 'Petites séries, parfois des collections capsule à tester avant de réassortir. Le rendu compte autant que le prix, puisque la pièce est vendue.',
		textile: 'Coton lourd 200 g/m² et plus',
		marquage: 'Sérigraphie ou transfert monochrome',
		volumes: '20 à 100 pièces',
		insight:
			"Une petite série en édition limitée, à l'effigie du commerce ou du quartier, devient un produit à part entière que le client achète en plus de son passage habituel — pas seulement un support de communication gratuit.",
	},
	{
		slug: 'boulangeries',
		nom: 'Boulangeries',
		texte: 'Image artisanale et tenue professionnelle, avec un textile qui encaisse la farine, la chaleur et les lavages fréquents.',
		textile: 'Tablier ou polo',
		marquage: 'Broderie, pour le rendu et la tenue',
		volumes: '10 à 30 pièces',
		insight:
			"Au-delà du tablier de l'équipe, de plus en plus de boulangeries proposent en caisse un petit tote bag personnalisé à prix doux — un produit d'appel qui fidélise sans effort commercial et se glisse facilement dans le panier moyen.",
	},
	{
		slug: 'clubs-sportifs',
		nom: 'Clubs sportifs',
		texte: 'Maillots techniques, floquage de noms et de numéros, et un renouvellement partiel chaque saison plutôt qu’une commande unique.',
		textile: 'Maillot polyester respirant',
		marquage: 'Transfert monochrome, adapté aux textiles techniques',
		volumes: '15 à 60 pièces',
		insight:
			"Le maillot floqué au nom du joueur crée un attachement individuel qui pousse à l'achat même hors saison, et se revend souvent aux familles ou aux supporters en plus de l'équipement officiel — une source de revenu complémentaire pour le club.",
	},
];

export function getSecteur(slug: string): Secteur | undefined {
	return SECTEURS.find((s) => s.slug === slug);
}
