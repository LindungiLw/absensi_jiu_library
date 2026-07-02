<?php
header('Content-Type: application/json');

// 1. SECURITY PROTECTION BLOCK (Kiosk Lock Session)
session_start();
if (empty($_SESSION['kiosk_unlocked'])) {
    http_response_code(401);
    echo json_encode(["error" => "Access Denied! Scanner has not been activated by the librarian."]);
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

// Read raw POST data (JSON)
$inputJSON = file_get_contents('php://input');
$body = json_decode($inputJSON, TRUE);

$rawId = isset($body['nim']) ? $body['nim'] : (isset($body['id']) ? $body['id'] : null);

if (!$rawId) {
    http_response_code(400);
    echo json_encode(["error" => "ID is required."]);
    exit;
}

$cleanId = trim((string)$rawId);

// Set timezone
date_default_timezone_set('Asia/Jakarta');
$hari = date('w'); // 0 (Sunday) - 6 (Saturday)
$currentHHMM = date('H:i');
$tanggalHariIni = date('Y-m-d');
$currentMonth = (int)date('n');
$currentYearNum = date('Y');

try {
    // 2. GET SESSION SETTINGS
    $stmtSesi = $pdo->query("SELECT * FROM pengaturansesi"); // Lowercase for Linux/Hostinger
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

    // 3. CHECK MEMBER
    $stmtAnggota = $pdo->prepare("SELECT * FROM anggota WHERE id_anggota = :id");
    $stmtAnggota->execute(['id' => $cleanId]);
    $anggota = $stmtAnggota->fetch(PDO::FETCH_ASSOC);

    if (!$anggota) {
        http_response_code(404);
        echo json_encode(["error" => "ID ($cleanId) is not registered. Please contact the librarian!"]);
        exit;
    }

    // 4. CHECK IF ALREADY ATTENDED IN THIS SESSION
    $stmtCekKehadiran = $pdo->prepare("SELECT id FROM kehadiran WHERE id_anggota = :id AND sesi = :sesi AND tanggal = :tanggal LIMIT 1");
    $stmtCekKehadiran->execute([
        'id' => $cleanId,
        'sesi' => $sesiSaatIni,
        'tanggal' => $tanggalHariIni
    ]);

    if ($stmtCekKehadiran->fetch()) {
        http_response_code(403);
        echo json_encode(["error" => "You have already checked in for the $sesiSaatIni session!"]);
        exit;
    }

    // 5. TRANSACTION: SAVE ATTENDANCE & UPDATE VISITS
    $pdo->beginTransaction();

    try {
        $stmtInsert = $pdo->prepare("INSERT INTO kehadiran (id_anggota, sesi, tanggal, waktu) VALUES (:id, :sesi, :tanggal, NOW())");
        $stmtInsert->execute([
            'id' => $cleanId,
            'sesi' => $sesiSaatIni,
            'tanggal' => $tanggalHariIni
        ]);

        $stmtUpdate = $pdo->prepare("UPDATE anggota SET total_kunjungan = total_kunjungan + 1 WHERE id_anggota = :id");
        $stmtUpdate->execute(['id' => $cleanId]);

        $pdo->commit();
    } catch (PDOException $e) {
        $pdo->rollBack();
        // SQLSTATE 23000 (Integrity constraint violation - e.g. duplicate entry)
        if ($e->getCode() == 23000) {
            http_response_code(403);
            echo json_encode(["error" => "Hold on! You have already checked in for this session."]);
            exit;
        }
        throw $e;
    }

    // 6. CALCULATE RANKING (SEMESTERLY)
    if ($currentMonth >= 1 && $currentMonth <= 6) {
        $semStartDate = "$currentYearNum-01-01";
        $semEndDate = "$currentYearNum-06-30";
    } else {
        $semStartDate = "$currentYearNum-07-01";
        $semEndDate = "$currentYearNum-12-31";
    }

    $stmtMyVisits = $pdo->prepare("SELECT COUNT(*) as total_visits, MIN(waktu) as first_visit FROM kehadiran WHERE id_anggota = :id AND tanggal >= :start AND tanggal <= :end");
    $stmtMyVisits->execute(['id' => $cleanId, 'start' => $semStartDate, 'end' => $semEndDate]);
    $myVisitData = $stmtMyVisits->fetch(PDO::FETCH_ASSOC);
    $myCurrentSemesterVisits = (int) ($myVisitData['total_visits'] ?? 0);
    $myFirstVisit = $myVisitData['first_visit'] ?? '';

    $queryGroup = "
        SELECT k.id_anggota, COUNT(k.id_anggota) as jml_kunjungan, MIN(k.waktu) as first_visit
        FROM kehadiran k
        JOIN anggota a ON k.id_anggota = a.id_anggota
        WHERE k.tanggal >= :start AND k.tanggal <= :end AND a.role = :role
        GROUP BY k.id_anggota
        HAVING jml_kunjungan >= :myVisits
    ";
    $stmtGroup = $pdo->prepare($queryGroup);
    $stmtGroup->execute([
        'start' => $semStartDate,
        'end' => $semEndDate,
        'role' => $anggota['role'],
        'myVisits' => $myCurrentSemesterVisits
    ]);
    
    $groupResults = $stmtGroup->fetchAll(PDO::FETCH_ASSOC);

    $orangLebihRajin = 0;
    $orangPoinSamaLebihSenior = 0;

    foreach ($groupResults as $g) {
        if ($g['id_anggota'] === $cleanId) continue;
        $totalKunjunganSmtIni = (int) $g['jml_kunjungan'];

        if ($totalKunjunganSmtIni > $myCurrentSemesterVisits) {
            $orangLebihRajin++;
        } else if ($totalKunjunganSmtIni === $myCurrentSemesterVisits) {
            if ($g['first_visit'] < $myFirstVisit) {
                $orangPoinSamaLebihSenior++;
            } else if ($g['first_visit'] === $myFirstVisit && strcmp($g['id_anggota'], $cleanId) < 0) {
                $orangPoinSamaLebihSenior++;
            }
        }
    }

    $rankingSaatIni = $orangLebihRajin + $orangPoinSamaLebihSenior + 1;

    // 7. RETURN SUCCESS RESPONSE
    echo json_encode([
        "success" => true,
        "nim" => htmlspecialchars($anggota['id_anggota']),
        "nama" => htmlspecialchars($anggota['nama']),
        "role" => htmlspecialchars($anggota['role']),
        "sesi" => $sesiSaatIni,
        "waktu" => $currentHHMM,
        "negara" => htmlspecialchars($anggota['negara'] ?: "ID"),
        "pulau" => htmlspecialchars($anggota['pulau'] ?: ""),
        "ranking" => $rankingSaatIni
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to process attendance on the server: " . $e->getMessage()]);
}
?>
