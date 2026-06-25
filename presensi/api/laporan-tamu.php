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

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action === 'harian') {
    $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM tamu WHERE tanggal = :tanggal ORDER BY waktu DESC");
        $stmt->execute(['tanggal' => $date]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["success" => true, "data" => $data]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Gagal mengambil data tamu: " . $e->getMessage()]);
    }
} else if ($action === 'export') {
    $startDate = isset($_GET['startDate']) ? $_GET['startDate'] : date('Y-m-d');
    $endDate = isset($_GET['endDate']) ? $_GET['endDate'] : date('Y-m-d');
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM tamu WHERE tanggal >= :start AND tanggal <= :end ORDER BY tanggal DESC, waktu DESC");
        $stmt->execute(['start' => $startDate, 'end' => $endDate]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(["success" => true, "data" => $data]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Gagal mengambil data export tamu: " . $e->getMessage()]);
    }
} else if ($action === 'semua_tamu') {
    // Pagination (opsional, tapi disarankan)
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    try {
        $stmt = $pdo->prepare("SELECT * FROM tamu ORDER BY tanggal DESC, waktu DESC LIMIT :limit");
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["success" => true, "data" => $data]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Gagal mengambil data tamu: " . $e->getMessage()]);
    }
} else if ($action === 'update_tamu') {
    // PUT / POST
    $inputJSON = file_get_contents('php://input');
    $body = json_decode($inputJSON, TRUE);
    $id = isset($body['id']) ? (int)$body['id'] : 0;
    $nama = isset($body['nama_pengunjung']) ? trim($body['nama_pengunjung']) : '';
    $instansi = isset($body['instansi']) ? trim($body['instansi']) : '';
    $jumlah_orang = isset($body['jumlah_orang']) ? (int)$body['jumlah_orang'] : 1;

    if ($id <= 0 || empty($nama)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Data tidak lengkap."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE tamu SET nama_pengunjung = :nama, instansi = :instansi, jumlah_orang = :jumlah WHERE id = :id");
        $stmt->execute([
            'nama' => $nama,
            'instansi' => $instansi,
            'jumlah' => $jumlah_orang,
            'id' => $id
        ]);
        echo json_encode(["success" => true, "message" => "Data tamu berhasil diupdate."]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Gagal update tamu: " . $e->getMessage()]);
    }
} else if ($action === 'delete_tamu') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "ID tidak valid."]);
        exit;
    }
    try {
        $stmt = $pdo->prepare("DELETE FROM tamu WHERE id = :id");
        $stmt->execute(['id' => $id]);
        echo json_encode(["success" => true, "message" => "Data tamu berhasil dihapus."]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Gagal menghapus tamu: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid action specified."]);
}
?>
