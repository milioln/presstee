<?php
// Cookie de session sécurisé : "secure" ne s'active qu'en HTTPS (donc
// pas en local pendant les tests), "httponly" empêche tout accès en
// JavaScript, "samesite=Lax" limite l'envoi du cookie aux requêtes
// same-site — une protection de base contre le CSRF pour ce site qui
// n'appelle son API que depuis ses propres pages.
function startAuthSession(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}
