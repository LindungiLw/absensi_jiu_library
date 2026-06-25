<?php
session_start();
if (empty($_SESSION['admin_logged_in'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Unauthorized access."]);
    exit;
}
require_once '../config/koneksi.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'PUT') {
    $headers = getallheaders();
    $csrfToken = $headers['X-CSRF-Token'] ?? $headers['x-csrf-token'] ?? '';
    if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $csrfToken)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'CSRF token mismatch.']);
        exit;
    }
}

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT id, nama_sesi, jam_mulai, jam_selesai FROM pengaturansesi ORDER BY id ASC");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if(count($data) === 0) {
        $data = [
            ["id" => 1, "nama_sesi" => "Morning", "jam_mulai" => "08:00", "jam_selesai" => "11:59"],
            ["id" => 2, "nama_sesi" => "Afternoon", "jam_mulai" => "13:00", "jam_selesai" => "16:59"],
            ["id" => 3, "nama_sesi" => "Evening", "jam_mulai" => "18:00", "jam_selesai" => "20:59"]
        ];
    }
    
    echo json_encode(["success" => true, "data" => $data]);
    exit;
}

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    if(is_array($input)) {
        $pdo->query("TRUNCATE TABLE pengaturansesi");
        $stmt = $pdo->prepare("INSERT INTO pengaturansesi (id, nama_sesi, jam_mulai, jam_selesai) VALUES (:id, :nama, :mulai, :selesai)");
        foreach($input as $sesi) {
            $stmt->execute([
                'id' => $sesi['id'] ?? null,
                'nama' => $sesi['nama_sesi'],
                'mulai' => $sesi['jam_mulai'],
                'selesai' => $sesi['jam_selesai']
            ]);
        }
    }
    echo json_encode(["success" => true]);
    exit;
}
