<?php
session_start();
require_once '../config/koneksi.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// CSRF Validation for all POST requests
if ($method === 'POST') {
    $headers = getallheaders();
    $csrfToken = $headers['X-CSRF-Token'] ?? $headers['x-csrf-token'] ?? '';
    
    if (empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $csrfToken)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'CSRF token mismatch or missing.']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    
    // Fallback if action is passed in body
    if (empty($action) && isset($input['action'])) {
        $action = $input['action'];
    }

    if ($action === 'login') {
        // RATE LIMITING (Anti Brute-Force)
        if (isset($_SESSION['lockout_time']) && time() < $_SESSION['lockout_time']) {
            $remaining = ceil(($_SESSION['lockout_time'] - time()) / 60);
            http_response_code(429);
            echo json_encode(['success' => false, 'error' => "Terlalu banyak percobaan. Coba lagi dalam $remaining menit."]);
            exit;
        }

        $type = $input['type'] ?? 'kiosk'; // Default to kiosk
        $username = trim($input['username'] ?? $input['email'] ?? '');
        $passcode = $input['passcode'] ?? $input['password'] ?? $input['pin'] ?? '';

        if ($type === 'admin') {
            // LOGIN SUPERADMIN (SECURE BCRYPT HASH)
            $stmt = $pdo->prepare("SELECT * FROM superadmin WHERE username = :username");
            $stmt->execute(['username' => $username]);
            $admin = $stmt->fetch();

            if ($admin && password_verify($passcode, $admin['password_hash'])) {
                session_regenerate_id(true); // Mencegah Session Fixation
                $_SESSION['admin_logged_in'] = true;
                $_SESSION['admin_username'] = $admin['username'];
                $_SESSION['login_attempts'] = 0; // Reset attempts
                echo json_encode(['success' => true]);
            } else {
                sleep(1); // Delay untuk memperlambat brute-force
                $_SESSION['login_attempts'] = ($_SESSION['login_attempts'] ?? 0) + 1;
                if ($_SESSION['login_attempts'] >= 5) {
                    $_SESSION['lockout_time'] = time() + (3 * 60); // Kunci 3 menit
                }
                echo json_encode(['success' => false, 'error' => 'Username atau password admin salah.']);
            }
        } else {
            // LOGIN KIOSK SCANNER (SECURE PIN)
            $stmt = $pdo->prepare("SELECT * FROM petugaskiosk WHERE username = :username");
            $stmt->execute(['username' => $username]);
            $petugas = $stmt->fetch();

            if ($petugas && password_verify($passcode, $petugas['pin'])) {
                session_regenerate_id(true); // Mencegah Session Fixation
                $_SESSION['kiosk_unlocked'] = true;
                $update = $pdo->prepare("UPDATE petugaskiosk SET lastOpenedAt = NOW() WHERE id = :id");
                $update->execute(['id' => $petugas['id']]);
                $_SESSION['login_attempts'] = 0; // Reset attempts
                echo json_encode(['success' => true]);
            } else {
                sleep(1); // Delay
                $_SESSION['login_attempts'] = ($_SESSION['login_attempts'] ?? 0) + 1;
                if ($_SESSION['login_attempts'] >= 5) {
                    $_SESSION['lockout_time'] = time() + (3 * 60); // Kunci 3 menit
                }
                echo json_encode(['success' => false, 'error' => 'Kredensial salah atau akses ditolak.']);
            }
        }
        exit;
    }

    if ($action === 'logout') {
        $type = $input['type'] ?? 'kiosk';
        
        if ($type === 'admin') {
            unset($_SESSION['admin_logged_in']);
            unset($_SESSION['admin_username']);
        } else {
            unset($_SESSION['kiosk_unlocked']);
        }
        echo json_encode(['success' => true]);
        exit;
    }
}
?>
