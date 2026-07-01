<?php
session_start();
if (empty($_SESSION['admin_logged_in'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Unauthorized access."]);
    exit;
}
require_once '../config/koneksi.php';

header('Content-Type: application/json');

try {
    $today = date('Y-m-d');
    
    // 1. DATA HARI INI
    // Total Hadir Hari Ini
    $stmtTotalHadir = $pdo->prepare("SELECT COUNT(*) FROM kehadiran WHERE tanggal = :today");
    $stmtTotalHadir->execute(['today' => $today]);
    $totalHadir = $stmtTotalHadir->fetchColumn();

    // Hadir berdasarkan role (Join dengan anggota)
    $stmtRoleHadir = $pdo->prepare("
        SELECT a.role, COUNT(*) as jumlah 
        FROM kehadiran k 
        JOIN anggota a ON k.id_anggota = a.id_anggota 
        WHERE k.tanggal = :today 
        GROUP BY a.role
    ");
    $stmtRoleHadir->execute(['today' => $today]);
    $roleHadir = $stmtRoleHadir->fetchAll(PDO::FETCH_ASSOC);

    $hadirMahasiswa = 0;
    $hadirStaffDosen = 0;
    foreach ($roleHadir as $r) {
        if ($r['role'] === 'student') $hadirMahasiswa += $r['jumlah'];
        else $hadirStaffDosen += $r['jumlah'];
    }

    // 2. DATA DATABASE (Total Anggota Aktif)
    $stmtAnggota = $pdo->query("SELECT role, COUNT(*) as jumlah FROM anggota GROUP BY role");
    $dataAnggota = $stmtAnggota->fetchAll(PDO::FETCH_ASSOC);

    $totalStudent = 0;
    $totalLecturer = 0;
    $totalStaff = 0;
    foreach ($dataAnggota as $a) {
        if ($a['role'] === 'student') $totalStudent = $a['jumlah'];
        if ($a['role'] === 'lecturer') $totalLecturer = $a['jumlah'];
        if ($a['role'] === 'staff') $totalStaff = $a['jumlah'];
    }

    // 3. GRAFIK KUNJUNGAN (6 Bulan Terakhir)
    $sixMonthsAgo = date('Y-m-d', strtotime('-6 months'));
    $stmtGrafik = $pdo->prepare("
        SELECT tanggal, COUNT(*) as total 
        FROM kehadiran 
        WHERE tanggal >= :start_date 
        GROUP BY tanggal 
        ORDER BY tanggal ASC
    ");
    $stmtGrafik->execute(['start_date' => $sixMonthsAgo]);
    $grafik = $stmtGrafik->fetchAll(PDO::FETCH_ASSOC);

    // 4. LEADERBOARD (Semester & All-Time)
    $currentMonth = (int)date('n');
    $currentYearNum = date('Y');
    if ($currentMonth >= 1 && $currentMonth <= 6) {
        $semStartDate = "$currentYearNum-01-01";
        $semEndDate = "$currentYearNum-06-30";
    } else {
        $semStartDate = "$currentYearNum-07-01";
        $semEndDate = "$currentYearNum-12-31";
    }

    // Top 10 Semester Ini
    $stmtTopSemester = $pdo->prepare("
        SELECT a.id_anggota, a.nama, a.role, a.jurusan, COUNT(k.id) as total_hadir, MIN(k.waktu) as first_visit
        FROM kehadiran k
        JOIN anggota a ON k.id_anggota = a.id_anggota
        WHERE k.tanggal >= :start AND k.tanggal <= :end
        GROUP BY a.id_anggota
        ORDER BY total_hadir DESC, first_visit ASC
        LIMIT 10
    ");
    $stmtTopSemester->execute(['start' => $semStartDate, 'end' => $semEndDate]);
    $topSemester = $stmtTopSemester->fetchAll(PDO::FETCH_ASSOC);

    // Top 3 All Time per Role
    $topAllTime = [];
    $roles = ['student', 'lecturer', 'staff'];
    foreach ($roles as $r) {
        $stmtTopRole = $pdo->prepare("
            SELECT a.id_anggota, a.nama, a.role, a.jurusan, a.total_kunjungan,
                   (SELECT MIN(waktu) FROM kehadiran k WHERE k.id_anggota = a.id_anggota) as first_visit
            FROM anggota a
            WHERE a.role = :role AND a.total_kunjungan > 0
            ORDER BY a.total_kunjungan DESC, first_visit ASC 
            LIMIT 3
        ");
        $stmtTopRole->execute(['role' => $r]);
        $topAllTime[$r] = $stmtTopRole->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        "success" => true,
        "data" => [
            "hariIni" => [
                "total" => (int)$totalHadir,
                "mahasiswa" => (int)$hadirMahasiswa,
                "staff" => (int)$hadirStaffDosen
            ],
            "database" => [
                "student" => (int)$totalStudent,
                "lecturer" => (int)$totalLecturer,
                "staff" => (int)$totalStaff
            ],
            "grafik" => $grafik,
            "leaderboard" => [
                "semester" => $topSemester,
                "allTime" => $topAllTime
            ]
        ]
    ]);
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => "Database error: " . $e->getMessage()
    ]);
}
?>
