<?php
session_start();
if (empty($_SESSION['admin_logged_in'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Unauthorized access."]);
    exit;
}
require_once '../config/koneksi.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT id, tanggal, keterangan FROM harilibur ORDER BY tanggal ASC");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "data" => $data]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $tanggal = $input['tanggal'] ?? '';
    $keterangan = $input['keterangan'] ?? '';
    
    if (!$tanggal) {
        echo json_encode(["success" => false, "error" => "Tanggal harus diisi"]);
        exit;
    }
    
    $stmt = $pdo->prepare("INSERT INTO harilibur (tanggal, keterangan) VALUES (:tanggal, :keterangan) ON DUPLICATE KEY UPDATE keterangan = VALUES(keterangan)");
    $stmt->execute(['tanggal' => $tanggal, 'keterangan' => $keterangan]);
    echo json_encode(["success" => true]);
    exit;
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM harilibur WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
    echo json_encode(["success" => true]);
    exit;
}
