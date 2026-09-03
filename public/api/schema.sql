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
-- des lignes) — à revoir si ce besoin apparaît. Le numéro n'a pas
-- encore de compteur persistant dédié (étape 5 du README) : il est
-- fourni tel quel à l'insertion.
CREATE TABLE IF NOT EXISTS commandes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(20) NOT NULL UNIQUE,
  type ENUM('devis', 'facture') NOT NULL,
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
