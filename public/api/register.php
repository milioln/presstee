<?php
declare(strict_types=1);
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/session.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Méthode non autorisée.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$email = trim((string)($input['email'] ?? ''));
$password = (string)($input['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Adresse e-mail invalide.']);
    exit;
}
if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Le mot de passe doit contenir au moins 8 caractères.']);
    exit;
}

$pdo = getPDO();

try {
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    $stmt->execute([$email, $hash]);
} catch (PDOException $e) {
    // Code 23000 = violation de contrainte unique (email déjà pris) —
    // on s'appuie sur la contrainte SQL plutôt que sur un SELECT
    // préalable pour éviter une course entre deux inscriptions
    // simultanées avec la même adresse.
    if ($e->getCode() === '23000') {
        http_response_code(409);
        echo json_encode(['ok' => false, 'error' => 'Un compte existe déjà avec cette adresse e-mail.']);
        exit;
    }
    throw $e;
}

startAuthSession();
session_regenerate_id(true);
$_SESSION['user_id'] = (int)$pdo->lastInsertId();
$_SESSION['user_email'] = $email;

echo json_encode(['ok' => true, 'email' => $email]);
