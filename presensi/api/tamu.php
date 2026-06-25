<?php
header('Content-Type: application/json');

// 1. BLOK PELINDUNG KEAMANAN (Kiosk Lock Session)
session_start();
if (empty($_SESSION['kiosk_unlocked'])) {
    http_response_code(401);
    echo json_encode(["error" => "Access Denied! Scanner has not been activated."]);
    exit;
}

require_once '../config/koneksi.php';

// Security Headers for API
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");

// CSRF Validation
$headers = getallheaders();
$csrfToken = $headers['X-CSRF-Token'] ?? $headers['x-csrf-token'] ?? '';
if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $csrfToken)) {
    http_response_code(403);
    echo json_encode(['error' => 'CSRF token mismatch.']);
    exit;
}

// Membaca raw POST data (JSON)
$inputJSON = file_get_contents('php://input');
$body = json_decode($inputJSON, TRUE);

$nama = isset($body['nama']) ? trim($body['nama']) : '';
$instansi = isset($body['instansi']) ? trim($body['instansi']) : '';
$jumlah_orang = isset($body['jumlah_orang']) ? (int)$body['jumlah_orang'] : 1;

if (empty($nama)) {
    http_response_code(400);
    echo json_encode(["error" => "Visitor name is required."]);
    exit;
}
if ($jumlah_orang < 1) $jumlah_orang = 1;

// Mengatur zona waktu
date_default_timezone_set('Asia/Jakarta');
$hari = date('w'); // 0 (Sunday) - 6 (Saturday)
$currentHHMM = date('H:i');
$tanggalHariIni = date('Y-m-d');

try {
    // 2. AMBIL PENGATURAN SESI
    $stmtSesi = $pdo->query("SELECT * FROM pengaturansesi");
    $pengaturans = $stmtSesi->fetchAll(PDO::FETCH_ASSOC);

    if (count($pengaturans) === 0) {
        $pengaturans = [
            ["nama_sesi" => "Morning", "jam_mulai" => "08:00", "jam_selesai" => "11:59"],
            ["nama_sesi" => "Afternoon", "jam_mulai" => "13:00", "jam_selesai" => "16:59"],
            ["nama_sesi" => "Evening", "jam_mulai" => "18:00", "jam_selesai" => "20:59"]
        ];
    }

    $sesiSaatIni = "Luar Jam";
    foreach ($pengaturans as $sesi) {
        if ($currentHHMM >= $sesi['jam_mulai'] && $currentHHMM <= $sesi['jam_selesai']) {
            if ($sesi['nama_sesi'] === "Evening" && ($hari == 0 || $hari == 6)) continue;
            $sesiSaatIni = $sesi['nama_sesi'];
            break;
        }
    }

    if ($sesiSaatIni === "Luar Jam") {
        http_response_code(403);
        echo json_encode(["error" => "Library is currently closed or on break. Please return during operating hours."]);
        exit;
    }

    // 3. SIMPAN KEHADIRAN TAMU
    $stmtInsert = $pdo->prepare("INSERT INTO tamu (nama_pengunjung, instansi, jumlah_orang, waktu, sesi, tanggal) VALUES (:nama, :instansi, :jumlah, NOW(), :sesi, :tanggal)");
    $stmtInsert->execute([
        'nama' => $nama,
        'instansi' => $instansi,
        'jumlah' => $jumlah_orang,
        'sesi' => $sesiSaatIni,
        'tanggal' => $tanggalHariIni
    ]);

    // 4. KEMBALIKAN RESPONSE SUKSES
    echo json_encode([
        "success" => true,
        "nama" => htmlspecialchars($nama),
        "jumlah_orang" => $jumlah_orang,
        "sesi" => $sesiSaatIni,
        "waktu" => $currentHHMM
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to process guest check-in: " . $e->getMessage()]);
}
?>
