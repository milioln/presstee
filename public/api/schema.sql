-- Schéma du compte client et des documents commerciaux — à exécuter
-- une fois sur la base MySQL OVH (phpMyAdmin, fourni par le manager
-- OVH, ou en ligne de commande). Ré-exécutable sans risque (IF NOT
-- EXISTS) si de nouvelles tables sont ajoutées plus tard dans ce fichier.

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Devis et factures — voir design_handoff_devis_facture/README.md pour
-- le détail du gabarit (src/components/DocumentCommercial.astro). Une
-- ligne par commande ; les lignes de produits/marquages et les frais
-- sont stockés en JSON plutôt que dans des tables séparées, faute d'en
-- avoir besoin ailleurs pour l'instant (pas de requêtes sur le détail
-- des lignes) — à revoir si ce besoin apparaît. devis_origine trace
-- quel devis a donné lieu à une facture (numéro propre à la facture,
-- le devis garde le sien — cf. README : "Un devis accepté conserve son
-- numéro et donne une facture avec son propre numéro").
CREATE TABLE IF NOT EXISTS commandes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(20) NOT NULL UNIQUE,
  type ENUM('devis', 'facture') NOT NULL,
  devis_origine VARCHAR(20) NULL,
  date_emission DATE NOT NULL,
  date_echeance DATE NOT NULL,
  objet VARCHAR(255) NOT NULL,
  client_nom VARCHAR(255) NOT NULL,
  client_adresse JSON NOT NULL,
  client_contact VARCHAR(255) NULL,
  lignes JSON NOT NULL,
  frais JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compteur persistant du numéro de devis/facture (étape 5) — un
-- SELECT ... FOR UPDATE dans une transaction (cf. public/api/numerotation.php)
-- garantit qu'aucun numéro n'est attribué deux fois si deux commandes se
-- créent en même temps.
CREATE TABLE IF NOT EXISTS compteurs_numerotation (
  type ENUM('devis', 'facture') NOT NULL PRIMARY KEY,
  dernier_numero INT UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO compteurs_numerotation (type, dernier_numero) VALUES ('devis', 0), ('facture', 0);
