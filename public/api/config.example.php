<?php
// Copie ce fichier en config.php DIRECTEMENT SUR LE SERVEUR (via le
// gestionnaire de fichiers OVH ou un client FTP), jamais dans git — le
// dépôt ignore déjà config.php (voir .gitignore). Le déploiement
// automatique ne touche jamais ce fichier : il ne fait qu'ajouter/mettre
// à jour les fichiers présents dans dist/, jamais le supprimer.
//
// Les 4 informations viennent du manager OVH (Hébergements > Bases de
// données > la base MySQL créée pour ce site) :
//   - DB_HOST : l'hôte indiqué par OVH (souvent un nom du type
//     xxxsqlxxx.hosting.ovh.net, pas forcément "localhost")
//   - DB_NAME, DB_USER, DB_PASS : ceux choisis/affichés à la création
//     de la base.

define('DB_HOST', 'localhost');
define('DB_NAME', 'nom_de_la_base');
define('DB_USER', 'nom_utilisateur');
define('DB_PASS', 'mot_de_passe');

// Clé partagée pour créer un devis/facture (public/api/creer-commande.php)
// — il n'y a pas encore de vrai compte administrateur/staff distinct des
// comptes clients, donc cette clé fait office de garde-fou minimal en
// attendant. Choisis une chaîne longue et aléatoire (par exemple générée
// par un gestionnaire de mots de passe), à fournir dans l'en-tête
// X-Admin-Key de chaque appel à cet endpoint.
define('ADMIN_KEY', 'à-changer-avant-la-mise-en-ligne');
