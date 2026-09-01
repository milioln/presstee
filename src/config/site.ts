// Configuration centrale du site. Valeurs de la V0, provisoires — voir le
// document de passage section 8. Ne jamais dupliquer ces valeurs dans les
// pages ou composants : toujours importer `siteConfig`.

export const siteConfig = {
  nom: 'Presstee',
  baseline: 'Textile personnalisé à taille humaine',

  // Provisoire — vraie ligne à fournir par Milio.
  telephone: '06 00 00 00 00',
  email: 'contact@presstee.fr',

  adresse: {
    ville: 'Angoulême',
    departement: 'Charente',
    // Zone d'intervention non précisée dans les maquettes — à demander.
    zoneIntervention: null as string | null,
  },

  // Vide tant que non immatriculé. Tant que ce champ est vide, le
  // formulaire d'envoi reste désactivé et les mentions légales affichent
  // un avertissement de site en préparation (section 8 et 9 du document).
  siret: '',

  reseauxSociaux: {
    // Aucun compte fourni dans les maquettes — à compléter.
    instagram: null as string | null,
    facebook: null as string | null,
  },

  // Non précisés dans les maquettes — à demander à Milio.
  horaires: null as string | null,
} as const;
