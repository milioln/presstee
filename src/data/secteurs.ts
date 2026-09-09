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
	pro: boolean;
}

export const SECTEURS: Secteur[] = [
	{
		slug: 'associations',
		nom: 'Associations',
		texte: "Budgets serrés, commandes groupées et renouvellement régulier au fil des événements. L'enjeu est d'obtenir une pièce correcte sans faire exploser la cotisation des adhérents.",
		textile: 'T-shirt coton 150 à 180 g/m²',
		marquage: 'Sérigraphie à partir d’une trentaine de pièces',
		volumes: '30 à 150 pièces',
		pro: false,
	},
	{
		slug: 'bde-ecoles',
		nom: 'BDE et écoles',
		texte: 'Intégration, week-ends, soirées : de grosses séries commandées d’un coup, souvent avec un visuel unique et un délai serré autour de la rentrée.',
		textile: 'Sweat molleton 280 à 320 g/m²',
		marquage: 'Sérigraphie, très rentable sur ces volumes',
		volumes: '80 à 400 pièces',
		pro: false,
	},
	{
		slug: 'entreprises',
		nom: 'Entreprises',
		texte: 'Uniformiser les équipes et porter l’image de marque, avec une exigence de sobriété et de tenue dans le temps plus forte que sur un textile événementiel.',
		textile: 'Polo piqué ou chemise',
		marquage: 'Broderie sur le cœur, ou transfert monochrome',
		volumes: '10 à 100 pièces',
		pro: true,
	},
	{
		slug: 'bars-restaurants',
		nom: 'Bars et restaurants',
		texte: 'Tenues portées tous les jours et lavées à haute température. Le marquage doit tenir plusieurs centaines de lavages sans se fissurer.',
		textile: 'T-shirt épais 185 g/m² ou tablier',
		marquage: 'Transfert monochrome sous 25 pièces, sérigraphie au-delà',
		volumes: '10 à 60 pièces',
		pro: true,
	},
	{
		slug: 'evenements',
		nom: 'Événements',
		texte: 'Délai court, quantité parfois incertaine jusqu’au dernier moment, et un visuel souvent riche en couleurs. La réactivité prime sur la durabilité.',
		textile: 'T-shirt léger 150 g/m²',
		marquage: 'Transfert quadrichromie, sans frais de calage',
		volumes: '20 à 300 pièces',
		pro: false,
	},
	{
		slug: 'commerces',
		nom: 'Commerces',
		texte: 'Petites séries, parfois des collections capsule à tester avant de réassortir. Le rendu compte autant que le prix, puisque la pièce est vendue.',
		textile: 'Coton lourd 200 g/m² et plus',
		marquage: 'Sérigraphie ou transfert monochrome',
		volumes: '20 à 100 pièces',
		pro: true,
	},
	{
		slug: 'boulangeries',
		nom: 'Boulangeries',
		texte: 'Image artisanale et tenue professionnelle, avec un textile qui encaisse la farine, la chaleur et les lavages fréquents.',
		textile: 'Tablier ou polo',
		marquage: 'Broderie, pour le rendu et la tenue',
		volumes: '10 à 30 pièces',
		pro: true,
	},
	{
		slug: 'clubs-sportifs',
		nom: 'Clubs sportifs',
		texte: 'Maillots techniques, floquage de noms et de numéros, et un renouvellement partiel chaque saison plutôt qu’une commande unique.',
		textile: 'Maillot polyester respirant',
		marquage: 'Transfert monochrome, adapté aux textiles techniques',
		volumes: '15 à 60 pièces',
		pro: false,
	},
];

export function getSecteur(slug: string): Secteur | undefined {
	return SECTEURS.find((s) => s.slug === slug);
}
