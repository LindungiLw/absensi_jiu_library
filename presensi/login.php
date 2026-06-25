<?php
session_start();

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Jika sudah login, langsung ke dashboard
if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
    header("Location: admin/index.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="<?= $_SESSION['csrf_token'] ?? '' ?>">
    <title>Admin Login - JIU Library</title>
    <link rel="icon" type="image/png" href="assets/images/jiu_logo.png">
    <script src="assets/js/tailwindcss.js"></script>
    <link rel="stylesheet" href="assets/css/poppins.css">
    <style>
        body { font-family: 'Poppins', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 flex items-center justify-center min-h-screen p-4">

    <div class="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div class="p-8 sm:p-10">
            <div class="text-center mb-8">
                <img src="assets/images/logo.png" alt="JIU Logo" class="h-16 w-auto mx-auto mb-4 object-contain">
                <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">Admin Area</h1>
                <p class="text-sm text-slate-500 mt-2">Masukan kredensial petugas untuk melanjutkan</p>
            </div>

            <form id="loginForm" class="space-y-5">
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1">Username</label>
                    <input type="text" id="username" required class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" placeholder="Masukkan username">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1">Passcode / PIN</label>
                    <input type="password" id="passcode" required class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none" placeholder="••••••••">
                </div>
                
                <div id="errorMsg" class="hidden text-sm text-rose-600 font-bold text-center bg-rose-50 py-2 rounded-lg"></div>

                <button type="submit" id="submitBtn" class="w-full py-3.5 mt-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md hover:shadow-blue-500/30">
                    <span id="btnText">Masuk ke Dashboard</span>
                    <span id="btnLoading" class="hidden flex items-center justify-center gap-2">
                        <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Memverifikasi...
                    </span>
                </button>
            </form>
            
            <div class="mt-8 text-center">
                <a href="index.html" class="text-sm font-semibold text-slate-400 hover:text-blue-600 transition-colors">
                    ← Kembali ke Kiosk Scanner
                </a>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const passcode = document.getElementById('passcode').value;
            const errorMsg = document.getElementById('errorMsg');
            
            const btnText = document.getElementById('btnText');
            const btnLoading = document.getElementById('btnLoading');
            const submitBtn = document.getElementById('submitBtn');

            // Loading state
            submitBtn.disabled = true;
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
            errorMsg.classList.add('hidden');

            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                const res = await fetch('api/auth.php', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({ action: 'login', type: 'admin', username, passcode })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    window.location.href = 'admin/index.php';
                } else {
                    errorMsg.innerText = data.error || 'Username atau password salah.';
                    errorMsg.classList.remove('hidden');
                    document.getElementById('passcode').value = '';
                }
            } catch (err) {
                errorMsg.innerText = 'Koneksi ke server gagal.';
                errorMsg.classList.remove('hidden');
            } finally {
                submitBtn.disabled = false;
                btnText.classList.remove('hidden');
                btnLoading.classList.add('hidden');
            }
        });
    </script>
</body>
</html>
