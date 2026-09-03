<?php
require_once __DIR__ . '/session.php';

header('Content-Type: application/json; charset=utf-8');

startAuthSession();

if (!empty($_SESSION['user_id'])) {
    echo json_encode(['authenticated' => true, 'email' => $_SESSION['user_email']]);
} else {
    echo json_encode(['authenticated' => false]);
}
