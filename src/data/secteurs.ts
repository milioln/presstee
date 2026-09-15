// Source unique du contenu par secteur d'activité — utilisée par la
// liste de puces "Des conseils par activité" de l'accueil et du guide
// (teaser : juste le nom) et par les pages dédiées /secteurs/[slug]
// (contenu complet, pour être trouvable depuis une recherche Google
// propre à ce secteur — Milio, 2026-09-10 : « développer beaucoup plus,
// écrire pour le référencement, parler au client, l'aider à commander »,
// puis 2026-09-15 : « plus d'éléments graphiques, un meilleur article »).
//
// Pas de photo réelle par secteur pour l'instant (aucune fournie) — les
// icônes ci-dessous tiennent cette place en attendant de vraies images ;
// à remplacer dès que Milio en fournit (cf. échange du 2026-09-15).
export interface Secteur {
	slug: string;
	nom: string;
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
		icon: '<path d="M12 21s-6.5-4.2-9-8.6C1.3 8.9 2.4 5 6 5c2 0 3.6 1.4 6 4 2.4-2.6 4-4 6-4 3.6 0 4.7 3.9 3 7.4-2.5 4.4-9 8.6-9 8.6z"/>',
	},
	{
		slug: 'bde-ecoles',
		nom: 'BDE et écoles',
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
		icon: '<path d="M12 3 2 8l10 5 10-5-10-5z"/><path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5"/><path d="M22 8v6"/>',
	},
	{
		slug: 'entreprises',
		nom: 'Entreprises',
		texte:
			"Vous voulez uniformiser vos équipes ou faire porter votre image de marque en dehors des bureaux ? Un polo ou une chemise personnalisée avec sobriété tient mieux dans la durée qu'un textile pensé pour un seul événement.",
		motivation:
			"L'enjeu, pour une entreprise, n'est pas seulement d'avoir un logo brodé : c'est que le vêtement reste net, présentable et identifiable après des dizaines de lavages, sur des quantités souvent plus réduites (10 à 100 pièces) mais renouvelées régulièrement au fil des recrutements.",
		insight:
			"Un polo floqué croisé dans la rue ou sur les réseaux vaut largement son coût de fabrication en visibilité : porté par les salariés en dehors du travail — trajet, sport, weekend —, le vêtement aux couleurs de l'entreprise devient une publicité mobile gratuite.",
		conseil:
			"Pour une entreprise, la broderie sur le cœur reste la référence sur polo ou chemise : elle tient particulièrement bien dans le temps et donne un rendu plus qualitatif qu'un marquage imprimé. Le transfert monochrome est une alternative plus économique sur de petites séries, ou pour un logo très détaillé que la broderie rendrait mal.",
		exemple:
			"Une entreprise qui recrute régulièrement commande par exemple 20 polos brodés à chaque nouvelle arrivée, plutôt qu'une grosse série ponctuelle — la référence et le prix restent identiques d'une commande à l'autre grâce au projet enregistré.",
		techniqueSlug: 'broderie',
		icon: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>',
	},
	{
		slug: 'bars-restaurants',
		nom: 'Bars et restaurants',
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
		slug: 'commerces',
		nom: 'Commerces',
		texte:
			"Vous tenez un commerce et voulez proposer une pièce à l'effigie de votre enseigne ou de votre quartier ? Une petite série bien choisie peut devenir un vrai produit, pas seulement un support de communication.",
		motivation:
			"Contrairement à un vêtement de travail, le textile vendu en commerce doit plaire visuellement autant qu'il doit être rentable — le rendu du marquage compte alors autant que le prix, puisque c'est votre client qui l'achète, pas vous qui l'offrez.",
		insight:
			"À l'effigie du commerce ou du quartier, une petite série en édition limitée devient un produit à part entière que le client achète en plus de son passage habituel, pas un simple support de communication offert. Tester une petite quantité avant de réassortir limite le risque si le visuel ne rencontre pas son public.",
		conseil:
			"Un coton lourd (200 g/m² et plus) donne un tombé plus qualitatif, apprécié sur un produit vendu plutôt qu'offert. La sérigraphie reste la référence pour un rendu net sur de petites séries (20 à 100 pièces) ; le transfert monochrome convient mieux à un visuel unique très détaillé.",
		exemple:
			"Une boutique de quartier commande une série limitée de 40 t-shirts à l'occasion d'un anniversaire ou d'une ouverture, pour les offrir aux premiers clients ou les vendre en édition limitée.",
		techniqueSlug: 'serigraphie',
		icon: '<path d="M4 9.5 5 4h14l1 5.5"/><path d="M4 9.5a2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0"/><path d="M5.5 9.5V20h13V9.5"/>',
	},
	{
		slug: 'boulangeries',
		nom: 'Boulangeries',
		texte:
			"Vous voulez habiller votre équipe avec un tablier ou un polo qui renforce l'image artisanale de votre boulangerie ? Le textile doit avant tout encaisser la farine, la chaleur du fournil et des lavages fréquents.",
		motivation:
			"Un tablier brodé au nom de la boulangerie donne une image professionnelle immédiate, sans dénaturer le côté artisanal qui fait la différence avec une chaîne. La broderie, contrairement à un marquage imprimé, ne craint ni la chaleur ni les frottements répétés contre le plan de travail.",
		insight:
			"Certaines boulangeries ajoutent en caisse un petit tote bag personnalisé à prix doux, en plus du tablier de l'équipe : un produit d'appel qui fidélise sans effort commercial et se glisse facilement dans le panier moyen.",
		conseil:
			"La broderie est le choix le plus adapté sur tablier ou polo : elle tient mieux dans la durée que n'importe quel marquage imprimé face à la chaleur et aux lavages répétés. Sur de petites séries (10 à 30 pièces), le surcoût de la broderie reste raisonnable au regard de sa longévité.",
		exemple:
			"Une boulangerie qui renouvelle ses tabliers chaque année en commande une dizaine, brodés au nom de l'enseigne, en même temps que quelques tote bags proposés en caisse.",
		techniqueSlug: 'broderie',
		icon: '<path d="M4 13c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 4-8 4-8 .4-8-4z"/><path d="M8 13h.01M12 13h.01M16 13h.01"/>',
	},
	{
		slug: 'clubs-sportifs',
		nom: 'Clubs sportifs',
		texte:
			"Vous gérez un club sportif et voulez des maillots floqués au nom et au numéro de chaque joueur ? Le textile technique demande une attention particulière : un marquage classique tient mal sur un tissu conçu pour évacuer la transpiration.",
		motivation:
			"Entre les maillots de match, les survêtements d'entraînement et le renouvellement partiel chaque saison, un club a rarement besoin d'une commande unique figée dans le temps, mais d'un partenaire capable de reproduire le même flocage saison après saison, joueur après joueur.",
		insight:
			"Floqué au nom du joueur, le maillot crée un attachement individuel qui pousse à l'achat même hors saison — beaucoup de clubs le revendent aussi aux familles ou aux supporters en plus de l'équipement officiel, une source de revenu complémentaire.",
		conseil:
			"Le transfert monochrome est la technique la plus adaptée aux textiles techniques (polyester respirant) : il adhère bien à une matière que la sérigraphie classique accroche mal, et permet un flocage individuel nom et numéro sans repartir de zéro pour chaque joueur.",
		exemple:
			"Un club de football qui lance sa nouvelle saison commande 25 maillots floqués au nom et au numéro de chaque joueur, avec la possibilité d'en recommander en cours de saison pour les nouvelles recrues.",
		techniqueSlug: 'transfert-monochrome',
		icon: '<path d="M7 3h10v4a5 5 0 0 1-10 0V3z"/><path d="M7 4H4a1 1 0 0 0-1 1c0 2.8 1.8 5 4 5"/><path d="M17 4h3a1 1 0 0 1 1 1c0 2.8-1.8 5-4 5"/><path d="M12 12v4"/><path d="M9 20h6"/><path d="M10 16h4v4h-4z"/>',
	},
];

export function getSecteur(slug: string): Secteur | undefined {
	return SECTEURS.find((s) => s.slug === slug);
}
