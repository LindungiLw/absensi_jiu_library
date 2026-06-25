<?php
require_once 'koneksi.php';

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Menambahkan index...\n";

    // Index tabel kehadiran
    $pdo->exec("ALTER TABLE kehadiran ADD INDEX idx_tanggal (tanggal);");
    echo "Index idx_tanggal pada tabel kehadiran ditambahkan.\n";
    
    $pdo->exec("ALTER TABLE kehadiran ADD INDEX idx_anggota_tanggal (id_anggota, tanggal);");
    echo "Index idx_anggota_tanggal pada tabel kehadiran ditambahkan.\n";
    
    $pdo->exec("ALTER TABLE kehadiran ADD INDEX idx_sesi (sesi);");
    echo "Index idx_sesi pada tabel kehadiran ditambahkan.\n";

    // Index tabel anggota
    $pdo->exec("ALTER TABLE anggota ADD INDEX idx_role (role);");
    echo "Index idx_role pada tabel anggota ditambahkan.\n";

    echo "Semua index berhasil ditambahkan!\n";

} catch (PDOException $e) {
    if ($e->getCode() == '42000' || strpos($e->getMessage(), 'Duplicate key name') !== false) {
        echo "Beberapa index mungkin sudah ada. Pesan: " . $e->getMessage() . "\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
