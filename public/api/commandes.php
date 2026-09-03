<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

// Lu au moment du build (getStaticPaths de src/pages/devis/[numero].astro
// et facture/[numero].astro), pas depuis le navigateur d'un visiteur : le
// site reste statique, seule la génération se met à jour à chaque
// déploiement. ?type=devis|facture filtre ; sans paramètre, retourne tout.
$type = $_GET['type'] ?? null;
if ($type !== null && !in_array($type, ['devis', 'facture'], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Paramètre type invalide.']);
    exit;
}

$pdo = getPDO();

if ($type !== null) {
    $stmt = $pdo->prepare('SELECT * FROM commandes WHERE type = ? ORDER BY numero');
    $stmt->execute([$type]);
} else {
    $stmt = $pdo->query('SELECT * FROM commandes ORDER BY numero');
}

$commandes = array_map(function (array $r): array {
    return [
        'numero' => $r['numero'],
        'type' => $r['type'],
        'dateEmission' => $r['date_emission'],
        'dateEcheance' => $r['date_echeance'],
        'objet' => $r['objet'],
        'client' => [
            'nom' => $r['client_nom'],
            'adresse' => json_decode($r['client_adresse'], true),
            'contact' => $r['client_contact'],
        ],
        'lignes' => json_decode($r['lignes'], true),
        'frais' => $r['frais'] !== null ? json_decode($r['frais'], true) : [],
    ];
}, $stmt->fetchAll());

echo json_encode($commandes);
