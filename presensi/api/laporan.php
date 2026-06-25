<?php
session_start();
if (empty($_SESSION['admin_logged_in'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Unauthorized access."]);
    exit;
}
require_once '../config/koneksi.php';

$date = $_GET['date'] ?? null;
$startDate = $_GET['startDate'] ?? null;
$endDate = $_GET['endDate'] ?? null;
$isExport = isset($_GET['isExport']) && $_GET['isExport'] === 'true';

$whereClause = "";
$params = [];

if ($date) {
    $whereClause = "WHERE k.tanggal = :date";
    $params['date'] = $date;
} else if ($startDate && $endDate) {
    $whereClause = "WHERE k.tanggal >= :start AND k.tanggal <= :end";
    $params['start'] = $startDate;
    $params['end'] = $endDate;
}

$shouldLimit = !$date && !$isExport && (!$startDate || !$endDate);
$limitClause = $shouldLimit ? "LIMIT 3000" : "";

$sql = "
    SELECT k.id, k.waktu, k.sesi, k.tanggal, a.id_anggota, a.nama, a.role, a.jurusan, a.batch 
    FROM kehadiran k 
    LEFT JOIN anggota a ON k.id_anggota = a.id_anggota 
    $whereClause 
    ORDER BY k.waktu DESC 
    $limitClause
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

$formatted = array_map(function($log) {
    return [
        'id' => $log['id'],
        'id_anggota' => $log['id_anggota'],
        'nama' => $log['nama'] ?: 'Data Terhapus',
        'role' => $log['role'] ?: 'unknown',
        'jurusan' => $log['jurusan'] ?: '-',
        'batch' => $log['batch'] ?: '-',
        'sesi' => $log['sesi'],
        'waktu' => $log['waktu'],
        'tanggal' => $log['tanggal']
    ];
}, $data);

echo json_encode(["success" => true, "data" => $formatted]);
exit;
