<?php
session_start();
if (empty($_SESSION['admin_logged_in'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Unauthorized access."]);
    exit;
}
require_once '../config/koneksi.php';

header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];

if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
    $headers = getallheaders();
    $csrfToken = $headers['X-CSRF-Token'] ?? $headers['x-csrf-token'] ?? '';
    if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $csrfToken)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'CSRF token mismatch.']);
        exit;
    }
}

$inputJSON = file_get_contents('php://input');
$body = json_decode($inputJSON, TRUE);

if ($method === 'GET') {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $role = isset($_GET['role']) ? $_GET['role'] : '';

    $offset = ($page - 1) * $limit;
    
    $where = [];
    $params = [];
    
    if ($role && $role !== 'all') {
        $where[] = "role = :role";
        $params['role'] = $role;
    }
    
    if ($search) {
        $where[] = "(id_anggota LIKE :search1 OR nama LIKE :search2 OR jurusan LIKE :search3 OR batch LIKE :search4)";
        $params['search1'] = "%$search%";
        $params['search2'] = "%$search%";
        $params['search3'] = "%$search%";
        $params['search4'] = "%$search%";
    }
    
    $whereStr = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";
    
    // Hitung total data
    $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM anggota $whereStr");
    $stmtCount->execute($params);
    $total = $stmtCount->fetchColumn();
    
    // Ambil data
    $query = "SELECT id_anggota, nama, role, jurusan, batch, negara, pulau, total_kunjungan as total_absensi 
              FROM anggota $whereStr ORDER BY batch ASC, id_anggota ASC LIMIT $limit OFFSET $offset";
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Hitung stats
    $stmtRoleCount = $pdo->query("SELECT role, COUNT(*) as count FROM anggota GROUP BY role");
    $roleCounts = $stmtRoleCount->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $stats = [
        'student' => $roleCounts['student'] ?? 0,
        'lecturer' => $roleCounts['lecturer'] ?? 0,
        'staff' => $roleCounts['staff'] ?? 0
    ];

    echo json_encode([
        "success" => true,
        "data" => $data,
        "meta" => [
            "total" => $total,
            "page" => $page,
            "totalPages" => ceil($total / $limit),
            "stats" => $stats
        ]
    ]);
    exit;
}

if ($method === 'POST') {
    $pdo->beginTransaction();
    try {
        if (isset($body[0])) { 
            // Array of items (Excel Import)
            $stmt = $pdo->prepare("INSERT INTO anggota (id_anggota, nama, role, jurusan, batch, negara, pulau) VALUES (:id, :nama, :role, :jurusan, :batch, 'ID', '') ON DUPLICATE KEY UPDATE nama=VALUES(nama), role=VALUES(role), jurusan=VALUES(jurusan), batch=VALUES(batch)");
            foreach ($body as $row) {
                $stmt->execute([
                    'id' => $row['id_anggota'],
                    'nama' => $row['nama'],
                    'role' => $row['role'],
                    'jurusan' => $row['jurusan'] ?? null,
                    'batch' => $row['batch'] ?? null
                ]);
            }
            $msg = count($body) . " data berhasil diimpor!";
        } else {
            // Single Item (Manual Add)
            $stmt = $pdo->prepare("INSERT INTO anggota (id_anggota, nama, role, jurusan, batch, negara, pulau) VALUES (:id, :nama, :role, :jurusan, :batch, :negara, :pulau)");
            $stmt->execute([
                'id' => $body['id_anggota'],
                'nama' => $body['nama'],
                'role' => $body['role'],
                'jurusan' => $body['jurusan'] ?: null,
                'batch' => $body['batch'] ?: null,
                'negara' => $body['negara'] ?: 'ID',
                'pulau' => $body['pulau'] ?: null
            ]);
            $msg = "Data {$body['nama']} berhasil ditambahkan!";
        }
        $pdo->commit();
        echo json_encode(["success" => true, "message" => $msg]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(["success" => false, "error" => "ID Anggota mungkin sudah ada. " . $e->getMessage()]);
    }
    exit;
}

if ($method === 'PUT') {
    try {
        $stmt = $pdo->prepare("UPDATE anggota SET nama=:nama, role=:role, jurusan=:jurusan, batch=:batch, negara=:negara, pulau=:pulau WHERE id_anggota=:id");
        $stmt->execute([
            'id' => $body['id_anggota'],
            'nama' => $body['nama'],
            'role' => $body['role'],
            'jurusan' => $body['jurusan'] ?: null,
            'batch' => $body['batch'] ?: null,
            'negara' => $body['negara'] ?: 'ID',
            'pulau' => $body['pulau'] ?: null
        ]);
        echo json_encode(["success" => true, "message" => "Data berhasil diperbarui!"]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
    exit;
}

if ($method === 'DELETE') {
    $pdo->beginTransaction();
    try {
        if (isset($_GET['id'])) {
            // Delete Single
            $stmt = $pdo->prepare("DELETE FROM anggota WHERE id_anggota = :id");
            $stmt->execute(['id' => $_GET['id']]);
            $msg = "Data berhasil dihapus!";
        } else if (isset($body['ids']) && is_array($body['ids'])) {
            // Bulk Delete
            $placeholders = str_repeat('?,', count($body['ids']) - 1) . '?';
            $stmt = $pdo->prepare("DELETE FROM anggota WHERE id_anggota IN ($placeholders)");
            $stmt->execute($body['ids']);
            $msg = count($body['ids']) . " data berhasil dihapus!";
        } else {
             throw new Exception("ID tidak ditemukan");
        }
        $pdo->commit();
        echo json_encode(["success" => true, "message" => $msg]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
    exit;
}
?>
