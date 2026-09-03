<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/numerotation.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Méthode non autorisée.']);
    exit;
}

// Garde-fou minimal en attendant un vrai compte staff distinct des
// comptes clients (users) — voir config.example.php.
$cle = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
if (!hash_equals(ADMIN_KEY, $cle)) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Clé invalide.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'JSON invalide.']);
    exit;
}

$type = $input['type'] ?? null;
if (!in_array($type, ['devis', 'facture'], true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => "type doit être 'devis' ou 'facture'."]);
    exit;
}

$requis = ['dateEmission', 'dateEcheance', 'objet', 'client', 'lignes'];
foreach ($requis as $champ) {
    if (!isset($input[$champ])) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => "Champ manquant : $champ."]);
        exit;
    }
}

$client = $input['client'];
if (!isset($client['nom'], $client['adresse']) || !is_array($client['adresse'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'client.nom et client.adresse (tableau) sont requis.']);
    exit;
}

// Décode et enregistre un visuel exporté depuis le configurateur
// (layer.img, déjà la bonne image — recadrée/recolorée — sous forme de
// data URL) : sans cette persistance côté serveur, la vignette du
// document ne serait plus reproductible dès que le client vide son
// stockage local ou change d'appareil (cf. README, « Vignette du visuel
// imprimé »). Nom de fichier aléatoire, jamais celui fourni par
// l'appelant ; extension et contenu validés depuis les octets décodés,
// jamais depuis l'en-tête déclaré par le client.
function enregistrerVisuel(string $dataUrl): string {
    if (!preg_match('/^data:image\/(png|jpe?g|webp);base64,(.+)$/', $dataUrl, $m)) {
        throw new InvalidArgumentException('Format de visuel non reconnu (PNG/JPEG/WEBP attendu).');
    }
    $donnees = base64_decode($m[2], true);
    if ($donnees === false) {
        throw new InvalidArgumentException('Visuel : données base64 invalides.');
    }
    if (strlen($donnees) > 5 * 1024 * 1024) {
        throw new InvalidArgumentException('Visuel trop volumineux (5 Mo maximum).');
    }
    $info = getimagesizefromstring($donnees);
    if ($info === false) {
        throw new InvalidArgumentException('Visuel : contenu non reconnu comme une image.');
    }
    $extensions = [IMAGETYPE_PNG => 'png', IMAGETYPE_JPEG => 'jpg', IMAGETYPE_WEBP => 'webp'];
    $ext = $extensions[$info[2]] ?? null;
    if ($ext === null) {
        throw new InvalidArgumentException('Visuel : type d’image non supporté.');
    }

    $dossier = __DIR__ . '/../uploads/visuels';
    if (!is_dir($dossier) && !mkdir($dossier, 0755, true) && !is_dir($dossier)) {
        throw new RuntimeException('Impossible de créer le dossier de stockage des visuels.');
    }

    $nom = bin2hex(random_bytes(16)) . '.' . $ext;
    if (file_put_contents($dossier . '/' . $nom, $donnees) === false) {
        throw new RuntimeException('Échec de l’enregistrement du visuel.');
    }

    return '/uploads/visuels/' . $nom;
}

try {
    $lignes = array_map(function (array $l): array {
        $marquages = array_map(function (array $m): array {
            if (!empty($m['visuelDataUrl'])) {
                $m['visuelUrl'] = enregistrerVisuel($m['visuelDataUrl']);
            } elseif (!isset($m['visuelUrl'])) {
                $m['visuelUrl'] = null;
            }
            unset($m['visuelDataUrl']);
            return $m;
        }, $l['marquages'] ?? []);
        $l['marquages'] = $marquages;
        return $l;
    }, $input['lignes']);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
    exit;
}

$pdo = getPDO();

// Le numéro et l'insertion partagent une seule transaction : si
// l'insertion échoue, le numéro n'est jamais consommé (pas de trou dans
// la séquence) — cf. numerotation.php.
$pdo->beginTransaction();
try {
    $numero = prochainNumero($pdo, $type);

    $stmt = $pdo->prepare(
        'INSERT INTO commandes (numero, type, devis_origine, date_emission, date_echeance, objet, client_nom, client_adresse, client_contact, lignes, frais)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $numero,
        $type,
        $input['devisOrigine'] ?? null,
        $input['dateEmission'],
        $input['dateEcheance'],
        $input['objet'],
        $client['nom'],
        json_encode($client['adresse']),
        $client['contact'] ?? null,
        json_encode($lignes),
        json_encode($input['frais'] ?? []),
    ]);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
}

echo json_encode(['ok' => true, 'numero' => $numero]);
