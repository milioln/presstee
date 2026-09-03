<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Endpoint public (pas de clé requise, contrairement à
// creer-commande.php) : un formulaire de contact anonyme doit pouvoir
// joindre un visuel sans compte ni backend d'authentification. Le
// garde-fou tient donc entièrement dans la validation du fichier
// lui-même : extension autorisée, taille plafonnée, et signature
// (en-tête binaire) vérifiée pour qu'elle corresponde réellement à
// l'extension déclarée — jamais le nom fourni par le client, jamais le
// type MIME déclaré par le navigateur, qui peuvent tous deux mentir.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Méthode non autorisée.']);
    exit;
}

if (!isset($_FILES['fichier']) || $_FILES['fichier']['error'] === UPLOAD_ERR_NO_FILE) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Aucun fichier reçu.']);
    exit;
}

$fichier = $_FILES['fichier'];
if ($fichier['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Échec du téléversement.']);
    exit;
}

const MAX_TAILLE = 20 * 1024 * 1024; // 20 Mo, comme annoncé sur la page contact.
if ($fichier['size'] > MAX_TAILLE) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Fichier trop volumineux (20 Mo maximum).']);
    exit;
}

$ext = strtolower(pathinfo($fichier['name'], PATHINFO_EXTENSION));
$extensionsAutorisees = ['pdf', 'ai', 'eps', 'svg', 'png', 'jpg', 'jpeg', 'webp'];
if (!in_array($ext, $extensionsAutorisees, true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Format non accepté (PDF, AI, EPS, SVG, PNG, JPG ou WEBP attendu).']);
    exit;
}

$contenu = file_get_contents($fichier['tmp_name']);
if ($contenu === false) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Impossible de lire le fichier.']);
    exit;
}

// Vérifie que les premiers octets correspondent réellement au format
// déclaré par l'extension — un .png qui ne commence pas par la
// signature PNG, par exemple, est refusé même si l'extension est
// correcte. AI récent = PDF valide en interne (Adobe l'encapsule),
// d'où la même vérification que pour pdf.
function signatureValide(string $contenu, string $ext): bool {
    switch ($ext) {
        case 'png':
            return str_starts_with($contenu, "\x89PNG\r\n\x1a\n");
        case 'jpg':
        case 'jpeg':
            return str_starts_with($contenu, "\xFF\xD8\xFF");
        case 'webp':
            return substr($contenu, 0, 4) === 'RIFF' && substr($contenu, 8, 4) === 'WEBP';
        case 'pdf':
        case 'ai':
            return str_starts_with(ltrim($contenu), '%PDF');
        case 'eps':
            return str_starts_with($contenu, '%!PS') || substr($contenu, 0, 4) === "\xC5\xD0\xD3\xC6";
        case 'svg':
            $debut = substr($contenu, 0, 1000);
            return stripos($debut, '<svg') !== false || stripos($debut, '<?xml') !== false;
        default:
            return false;
    }
}

if (!signatureValide($contenu, $ext)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Le contenu du fichier ne correspond pas à son extension.']);
    exit;
}

$dossier = __DIR__ . '/../uploads/contact';
if (!is_dir($dossier) && !mkdir($dossier, 0755, true) && !is_dir($dossier)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Impossible de créer le dossier de stockage.']);
    exit;
}

$nom = bin2hex(random_bytes(16)) . '.' . $ext;
if (file_put_contents($dossier . '/' . $nom, $contenu) === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Échec de l’enregistrement du fichier.']);
    exit;
}

echo json_encode(['ok' => true, 'url' => '/uploads/contact/' . $nom, 'nom' => $fichier['name']]);
