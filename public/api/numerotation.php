<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

// Attribue le prochain numéro pour ce type (devis/facture). Ne gère PAS
// sa propre transaction : à appeler à l'intérieur de la transaction de
// l'appelant (cf. creer-commande.php), pour que l'incrémentation du
// compteur et l'insertion de la commande réussissent ou échouent
// ensemble — sinon un échec d'insertion après un numéro déjà consommé
// laisserait un trou dans la séquence. SELECT ... FOR UPDATE verrouille
// la ligne du compteur le temps de la transaction : deux créations
// simultanées ne peuvent pas repartir du même dernier_numero.
function prochainNumero(PDO $pdo, string $type): string {
    $stmt = $pdo->prepare('SELECT dernier_numero FROM compteurs_numerotation WHERE type = ? FOR UPDATE');
    $stmt->execute([$type]);
    $dernier = $stmt->fetchColumn();
    if ($dernier === false) {
        throw new RuntimeException("Compteur inconnu pour le type « $type » — schema.sql n'a pas été (ré)exécuté ?");
    }
    $suivant = (int)$dernier + 1;
    $pdo->prepare('UPDATE compteurs_numerotation SET dernier_numero = ? WHERE type = ?')->execute([$suivant, $type]);

    $prefixe = $type === 'facture' ? 'FAC' : 'DEV';
    return $prefixe . str_pad((string)$suivant, 5, '0', STR_PAD_LEFT);
}
