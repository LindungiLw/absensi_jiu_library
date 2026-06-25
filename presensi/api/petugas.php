<?php
session_start();
if (empty($_SESSION['admin_logged_in'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Unauthorized access."]);
    exit;
}
require_once '../config/koneksi.php';

$method = $_SERVER['REQUEST_METHOD'];

if (in_array($method, ['POST', 'DELETE'])) {
    $headers = getallheaders();
    $csrfToken = $headers['X-CSRF-Token'] ?? $headers['x-csrf-token'] ?? '';
    if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $csrfToken)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'CSRF token mismatch.']);
        exit;
    }
}

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT id, username, pin, lastOpenedAt FROM petugaskiosk ORDER BY id DESC");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "data" => $data]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    $pin = $input['pin'] ?? '';
    
    if (!$username || strlen($pin) !== 6) {
        echo json_encode(["success" => false, "error" => "Username valid & 6-Digit PIN wajib diisi!"]);
        exit;
    }
    try {
        $hashedPin = password_hash($pin, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("INSERT INTO petugaskiosk (username, pin) VALUES (:username, :pin)");
        $stmt->execute(['username' => $username, 'pin' => $hashedPin]);
        echo json_encode(["success" => true, "message" => "Akun akses berhasil ditambahkan!"]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Integrity constraint violation (duplicate username)
            echo json_encode(["success" => false, "error" => "Username sudah digunakan!"]);
        } else {
            echo json_encode(["success" => false, "error" => "Terjadi kesalahan server"]);
        }
    }
    exit;
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM petugaskiosk WHERE id = :id");
        $stmt->execute(['id' => $id]);
        echo json_encode(["success" => true, "message" => "Izin akses berhasil dicabut!"]);
    } else {
        echo json_encode(["success" => false, "error" => "ID tidak ditemukan"]);
    }
    exit;
}
