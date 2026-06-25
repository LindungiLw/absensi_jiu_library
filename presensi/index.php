<?php
session_start();
require_once 'config/koneksi.php';

// 1. Cek Hari Libur
$today = date('Y-m-d');
$stmt = $pdo->prepare("SELECT keterangan FROM harilibur WHERE tanggal = :tanggal");
$stmt->execute(['tanggal' => $today]);
$libur = $stmt->fetch();

$isLibur = $libur ? true : false;
$ketLibur = $libur['keterangan'] ?? 'National Holiday / Official Campus Closure.';

// 2. Cek Lock Status (Persisten hingga dikunci manual)
$isLocked = true;
if (isset($_SESSION['kiosk_unlocked']) && $_SESSION['kiosk_unlocked'] === true) {
    $isLocked = false;
}

// Generate CSRF Token
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scanner Presensi - JIU Library</title>
    <meta name="csrf-token" content="<?= $_SESSION['csrf_token'] ?? '' ?>">
    <link rel="icon" type="image/png" href="assets/images/jiu_logo.png">
    <script src="assets/js/tailwindcss.js"></script>
    <link rel="stylesheet" href="assets/css/poppins.css">
    <link rel="stylesheet" href="assets/animations.css">
    <style>
        body { font-family: 'Poppins', sans-serif; }
    </style>
</head>
<body class="bg-white text-slate-800 flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden select-none">

<?php if ($isLibur): ?>
    <!-- KIOSK CLOSED SCREEN -->
    <div id="closed-screen" class="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-xl p-10 text-center z-10 relative">
        <div class="flex justify-center mb-6">
            <img src="assets/images/jiu_logo.png" alt="JIU Library" class="h-20 md:h-24 w-auto object-contain grayscale opacity-50" />
        </div>
        <div class="text-6xl mb-4">📢</div>
        <h1 class="text-4xl font-black text-rose-600 mb-2 tracking-widest">LIBRARY CLOSED TODAY</h1>
        <p class="text-slate-700 text-base font-bold bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-xl inline-block mb-4">
            Note: <?= htmlspecialchars($ketLibur) ?>
        </p>
        <p class="text-slate-500 text-sm">Attendance system is temporarily disabled. Please return tomorrow.</p>
    </div>
<?php else: ?>

    <!-- KIOSK LOCK SCREEN -->
    <div id="lock-screen" class="w-full max-w-md bg-white border border-slate-200 rounded-[32px] p-8 shadow-2xl z-50 relative text-center <?= $isLocked ? '' : 'hidden' ?>">
        <div class="flex justify-center mb-6">
            <img src="assets/images/jiu_logo.png" alt="JIU Library" class="h-16 w-auto object-contain" />
        </div>
        <h2 class="text-xl font-black tracking-wide text-blue-700 uppercase">PRESENSI LOCKED</h2>
        <p class="text-xs text-slate-500 mt-1 mb-6">Input username and PIN credentials</p>

        <form id="form-unlock" class="space-y-5 text-left">
            <div class="space-y-1">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Username</label>
                <input type="text" id="lock-username" required placeholder="username" class="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 transition-all placeholder:text-slate-400 shadow-inner" />
            </div>

            <div class="space-y-2">
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">6 Digit PIN</label>
                <div class="flex justify-between gap-2 sm:gap-3">
                    <?php for ($i=0; $i<6; $i++): ?>
                    <input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="pin-input w-10 h-12 sm:w-12 sm:h-14 text-center font-mono text-2xl font-bold bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 transition-all shadow-inner" data-index="<?= $i ?>" />
                    <?php endfor; ?>
                </div>
            </div>

            <p id="lock-error" class="text-xs font-bold text-rose-600 text-center animate-pulse pt-1 hidden"></p>

            <button type="submit" id="btn-unlock" disabled class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 mt-2">
                Activate
            </button>
        </form>
    </div>

    <!-- MAIN KIOSK SCREEN -->
    <div id="main-screen" class="w-full flex flex-col items-center justify-center relative z-20 <?= $isLocked ? 'hidden' : '' ?>">
        
        <!-- Background Animations -->
        <div class="bb-scene" id="bg-scene">
            <!-- Rendered by JS -->
        </div>

        <div class="absolute -top-12 right-0 z-50">
            <button onclick="handleLock()" class="flex items-center gap-2 bg-white/80 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-600 rounded-xl px-4 py-2 text-xs font-bold shadow-sm backdrop-blur-sm transition-all">
                Lock Station
            </button>
        </div>

        <!-- Float 3D Card -->
        <div class="relative w-full max-w-2xl mx-auto z-10" style="perspective: 1200px;">
            <div class="relative z-10 w-full bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]" style="transform-style: preserve-3d; animation: float3D 8s ease-in-out infinite;">
                
                <div class="text-center space-y-2 mb-8 relative z-30">
                    <div class="flex justify-center mb-5">
                        <img src="assets/images/jiu_logo.png" alt="JIU Library" class="h-20 md:h-24 w-auto object-contain" />
                    </div>
                    <h1 class="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-800 via-blue-600 to-sky-500 bg-clip-text text-transparent tracking-tight">DREAM BLUE LIBRARY</h1>
                    <div class="text-slate-500 text-sm font-medium flex items-center justify-center gap-2">
                        Please tap your ID card on the scanner for presence check-in
                        <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/></svg>
                    </div>
                </div>

                <form id="form-scan" class="space-y-4 flex flex-col items-center relative z-30">
                    <input type="text" id="scan-input" placeholder="Scan / Type your ID..." autocomplete="off" class="w-full max-w-md bg-white border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-2xl px-6 py-4 text-center font-mono text-xl tracking-widest outline-none text-slate-800 placeholder:text-slate-400 transition-all duration-300 shadow-sm hover:border-slate-300" />
                    <button type="submit" id="btn-scan" class="w-full max-w-md py-3.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-md">Check In</button>
                </form>

                <!-- Guest Button -->
                <div class="mt-5 text-center relative z-30">
                    <button onclick="openGuestModal()" class="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors underline decoration-2 underline-offset-4 decoration-blue-200 hover:decoration-blue-500">
                        Not a Member? Guest Check-in here
                    </button>
                </div>

                <div class="min-h-[70px] flex items-center justify-center w-full max-w-md mx-auto my-4 relative z-30">
                    <div id="scan-notif" class="hidden w-full p-4 text-center font-bold rounded-2xl text-base border-2 shadow-lg transition-all duration-300"></div>
                </div>

                <div id="scan-result" class="w-full max-w-md mx-auto relative z-30 min-h-[120px] flex items-center justify-center">
                    <p class="text-slate-400 text-sm py-2 text-center italic tracking-wide">Waiting for card scan...</p>
                </div>

            </div>
        </div>
    </div>

    <!-- GUEST MODAL -->
    <div id="guest-modal" class="fixed inset-0 z-[100] flex items-center justify-center hidden">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onclick="closeGuestModal()"></div>
        <div class="relative bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-200 transform scale-95 opacity-0 transition-all duration-300" id="guest-modal-content">
            <button onclick="closeGuestModal()" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors focus:outline-none">
                ✕
            </button>
            <h2 class="text-2xl font-black text-blue-800 mb-1">Guest Check-In</h2>
            <p class="text-xs text-slate-500 mb-6 font-medium">Please complete your visit details.</p>
            
            <form id="form-guest" class="space-y-4">
                <div class="space-y-1">
                    <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Visitor Name (Required)</label>
                    <input type="text" id="guest-name" required placeholder="Enter your name..." class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 transition-all placeholder:text-slate-400" />
                </div>
                <div class="space-y-1">
                    <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Institution / Origin (Optional)</label>
                    <input type="text" id="guest-instansi" placeholder="Example: XYZ University, Public, etc..." class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 transition-all placeholder:text-slate-400" />
                </div>
                <div class="space-y-1">
                    <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Number of People</label>
                    <input type="number" id="guest-jumlah" min="1" value="1" required class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 transition-all" />
                </div>
                
                <button type="submit" id="btn-guest-submit" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 mt-2">
                    Check In Now
                </button>
            </form>
        </div>
    </div>

    <!-- SCRIPT LOCK SCREEN & SCANNER LOGIC -->
    <script>
        const inputs = document.querySelectorAll('.pin-input');
        const btnUnlock = document.getElementById('btn-unlock');
        const errLock = document.getElementById('lock-error');
        const usernameInput = document.getElementById('lock-username');

        // Pin Box Logic
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                input.value = input.value.replace(/[^0-9]/g, '');
                if (input.value && index < 5) inputs[index + 1].focus();
                checkPinComplete();
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !input.value && index > 0) {
                    inputs[index - 1].value = '';
                    inputs[index - 1].focus();
                }
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').substring(0, 6);
                for (let i = 0; i < paste.length; i++) {
                    inputs[i].value = paste[i];
                }
                if (paste.length > 0) {
                    inputs[Math.min(paste.length, 5)].focus();
                }
                checkPinComplete();
            });
        });

        function checkPinComplete() {
            const pin = Array.from(inputs).map(i => i.value).join('');
            btnUnlock.disabled = pin.length !== 6 || usernameInput.value.trim() === '';
        }

        usernameInput.addEventListener('input', checkPinComplete);

        // Unlock Action
        document.getElementById('form-unlock').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = usernameInput.value;
            const pin = Array.from(inputs).map(i => i.value).join('');
            
            btnUnlock.disabled = true;
            btnUnlock.innerText = "Verifying...";
            
            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                const res = await fetch('api/auth.php?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                    body: JSON.stringify({ type: 'kiosk', email: username, password: pin })
                });
                const data = await res.json();

                if (data.success) {
                    document.getElementById('lock-screen').classList.add('hidden');
                    document.getElementById('main-screen').classList.remove('hidden');
                    inputs.forEach(i => i.value = '');
                    usernameInput.value = '';
                    setTimeout(() => document.getElementById('scan-input').focus(), 100);
                } else {
                    errLock.innerText = data.error;
                    errLock.classList.remove('hidden');
                    inputs.forEach(i => i.value = '');
                    inputs[0].focus();
                }
            } catch (err) {
                errLock.innerText = "Failed to connect to server";
                errLock.classList.remove('hidden');
            } finally {
                btnUnlock.innerText = "Activate";
                checkPinComplete();
            }
        });

        // Lock Action
        async function handleLock() {
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            await fetch('api/auth.php?action=logout', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                body: JSON.stringify({ type: 'kiosk' })
            });
            document.getElementById('main-screen').classList.add('hidden');
            document.getElementById('lock-screen').classList.remove('hidden');
            document.getElementById('scan-result').innerHTML = '<p class="text-slate-400 text-sm py-2 text-center italic tracking-wide">Waiting for card scan...</p>';
            usernameInput.focus();
        }

        // Scanner Focus Lock (Keep cursor in input if user clicks away)
        document.addEventListener('click', (e) => {
            const isMainVisible = !document.getElementById('main-screen').classList.contains('hidden');
            const isGuestModalHidden = document.getElementById('guest-modal').classList.contains('hidden');
            
            // Only focus scan input if main is visible, guest modal is closed, and we aren't selecting text
            if (isMainVisible && isGuestModalHidden && window.getSelection().toString() === '') {
                // Don't steal focus if clicking inside the scan form
                if (!e.target.closest('#form-scan')) {
                    document.getElementById('scan-input').focus();
                }
            }
        });

        // Guest Logic
        function openGuestModal() {
            const modal = document.getElementById('guest-modal');
            const content = document.getElementById('guest-modal-content');
            modal.classList.remove('hidden');
            setTimeout(() => {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
                document.getElementById('guest-name').focus();
            }, 10);
        }

        function closeGuestModal() {
            const modal = document.getElementById('guest-modal');
            const content = document.getElementById('guest-modal-content');
            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                document.getElementById('scan-input').focus();
            }, 300);
        }

        document.getElementById('form-guest').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-guest-submit');
            const name = document.getElementById('guest-name').value.trim();
            const instansi = document.getElementById('guest-instansi').value.trim();
            const jumlah = document.getElementById('guest-jumlah').value;

            if (!name) return;

            btn.disabled = true;
            btn.innerHTML = `<span class="flex items-center justify-center gap-2"><span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>Processing...</span>`;

            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                const response = await fetch('api/tamu.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                    body: JSON.stringify({ nama: name, instansi: instansi, jumlah_orang: jumlah })
                });
                
                const data = await response.json();

                if (response.ok && data.success) {
                    closeGuestModal();
                    document.getElementById('form-guest').reset();
                    showScanNotif(`Welcome, ${data.nama}! 👋 Enjoy your visit!`, true);
                } else {
                    alert(data.error || "Failed to process guest check-in.");
                }
            } catch (err) {
                alert("Network connection error during check-in.");
            } finally {
                btn.disabled = false;
                btn.innerText = "Check In Now";
            }
        });

        // Main Check-In Logic
        let notifTimeout = null;
        function showScanNotif(msg, isSuccess) {
            const box = document.getElementById('scan-notif');
            box.innerText = msg;
            box.className = `w-full p-4 text-center font-bold rounded-2xl text-base border-2 shadow-lg transform transition-all duration-300 animate-in zoom-in-95 slide-in-from-top-2 ${isSuccess ? 'bg-emerald-50/90 backdrop-blur-sm border-emerald-300 text-emerald-800 shadow-emerald-200/50' : 'bg-rose-50/90 backdrop-blur-sm border-rose-300 text-rose-800 shadow-rose-200/50'}`;
            box.classList.remove('hidden');
            
            if (notifTimeout) clearTimeout(notifTimeout);
            notifTimeout = setTimeout(() => box.classList.add('hidden'), 3000);
        }

        document.getElementById('form-scan').addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('scan-input');
            const scannedID = input.value.trim();
            const btn = document.getElementById('btn-scan');
            
            if (!scannedID || btn.disabled) return;

            btn.disabled = true;
            btn.innerHTML = `<span class="flex items-center justify-center gap-2"><span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>Processing...</span>`;
            input.value = '';

            try {
                const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                const response = await fetch('api/absensi.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                    body: JSON.stringify({ nim: scannedID })
                });
                
                const data = await response.json();

                if (response.ok && data.success) {
                    // Sapaan Cerdas
                    let sapaan = `Hello, ${data.nama}! 👋 Have a great day!`;
                    if (data.negara === "KR") sapaan = `안녕하세요, ${data.nama}! 👋 Have a great day!`;
                    else if (data.negara === "JP") sapaan = `こんにちは, ${data.nama}! 👋 Have a great day!`;
                    else if (data.negara === "AF") sapaan = `سلام, ${data.nama}! 👋 Have a great day!`;
                    else if (data.negara === "ID") {
                        if (data.pulau === "Sumatera") sapaan = `Horas! Hello, ${data.nama}! 👋 Have a great day!`;
                        else if (data.pulau === "Jawa") sapaan = `Sugeng rawuh! Hello, ${data.nama}! 👋 Have a great day!`;
                        else if (data.pulau === "Sulawesi") sapaan = `Aga kareba? Hello, ${data.nama}! 👋 Have a great day!`;
                        else if (data.pulau === "Papua") sapaan = `Halo Pace/Mace ${data.nama}! 👋 Have a great day!`;
                        else if (data.pulau === "Nias") sapaan = `Ya'ahowu! Hello, ${data.nama}! 👋 Have a great day!`;
                    }
                    showScanNotif(sapaan, true);

                    // Render Result UI
                    const roleTitle = data.role === "student" ? "STUDENT RANK" : (data.role === "lecturer" ? "LECTURER RANK" : "STAFF RANK");
                    const initial = data.nama.charAt(0).toUpperCase();

                    document.getElementById('scan-result').innerHTML = `
                        <div class="flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-500 w-full">
                            <div class="flex flex-col items-center justify-center mb-5">
                                <span class="text-sm font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-sm">${roleTitle}</span>
                                <span class="text-7xl font-black text-blue-700 leading-none tracking-tight mt-3">${data.ranking}</span>
                            </div>
                            <div class="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                                <div class="flex justify-between items-center px-5 py-3 hover:bg-white/90 transition-colors">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-base font-bold text-blue-700 border border-blue-200 shadow-inner">
                                            ${initial}
                                        </div>
                                        <div>
                                            <p class="font-bold text-slate-800 text-sm leading-tight">${data.nama}</p>
                                            <p class="font-mono text-[10px] text-slate-500 mt-0.5">${data.nim}</p>
                                        </div>
                                    </div>
                                    <div class="text-right flex flex-col items-end justify-center">
                                        <span class="text-[10px] uppercase font-black bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100 shadow-sm">${data.sesi}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    showScanNotif(data.error || "Failed to process data", false);
                }
            } catch (err) {
                showScanNotif("Campus network connection issue", false);
            } finally {
                btn.disabled = false;
                btn.innerHTML = "Check In";
                setTimeout(() => input.focus(), 100);
            }
        });

        <?php if (!$isLocked): ?>
        setTimeout(() => document.getElementById('scan-input').focus(), 100);
        <?php else: ?>
        setTimeout(() => usernameInput.focus(), 100);
        <?php endif; ?>

        // Background Rendering (JS ported from BookBackground.tsx)
        const scene = document.getElementById('bg-scene');
        if (scene) {
            // 1. Data Kata-Kata & Warna
            const subjects = [
                { word: "Psychology", color: "rgba(192, 132, 252, 0.6)" },
                { word: "English", color: "rgba(125, 211, 252, 0.6)" },
                { word: "Art", color: "rgba(251, 113, 133, 0.6)" },
                { word: "Novel", color: "rgba(251, 191, 36, 0.6)" },
                { word: "Dream Blue Library", color: "rgba(56, 189, 248, 0.8)" },
                { word: "JIU", color: "rgba(59, 130, 246, 0.8)" },
                { word: "Bible", color: "rgba(250, 204, 21, 0.7)" },
                { word: "Technology", color: "rgba(45, 212, 191, 0.6)" },
                { word: "Sciences", color: "rgba(52, 211, 153, 0.6)" },
                { word: "Accounting", color: "rgba(148, 163, 184, 0.7)" },
                { word: "Information System", color: "rgba(129, 140, 248, 0.6)" },
                { word: "Japanese", color: "rgba(248, 113, 113, 0.6)" },
                { word: "Education", color: "rgba(96, 165, 250, 0.6)" },
                { word: "Coding", color: "rgba(74, 222, 128, 0.65)" },
                { word: "Management", color: "rgba(156, 163, 175, 0.6)" },
                { word: "Algorithms", color: "rgba(167, 139, 250, 0.6)" },
                { word: "UI/UX Design", color: "rgba(232, 121, 249, 0.6)" },
                { word: "Business", color: "rgba(16, 185, 129, 0.6)" },
                { word: "Cyber Security", color: "rgba(239, 68, 68, 0.6)" },
                { word: "Data Science", color: "rgba(34, 211, 238, 0.6)" }
            ];

            // 2. Generate Floating Words HTML
            let wordsHTML = subjects.map((subj, i) => {
                const left = (Math.random() * 85 + 5) + '%';
                const top = (Math.random() * 85 + 5) + '%';
                const fontSize = (Math.random() * 6 + 10) + 'px';
                const delayFloat = (Math.random() * -20) + 's';
                const delayType = (Math.random() * -15) + 's';
                const duration = (Math.random() * 6 + 10) + 's';

                return `
                    <div class="bg-knowledge-word" style="left: ${left}; top: ${top}; font-size: ${fontSize}; animation-delay: ${delayFloat}; --word-color: ${subj.color};">
                        <span class="typewriter-inner" style="animation-delay: ${delayType}; animation-duration: ${duration};">${subj.word}</span>
                    </div>
                `;
            }).join('');

            // 3. Generate Floating Icons HTML
            const svgIcons = [
                '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>',
                '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.17 3.25a2.5 2.5 0 0 0-3.54 0L3.25 17.63a2.5 2.5 0 0 0 3.54 3.54L21.17 6.79a2.5 2.5 0 0 0 0-3.54z" /><path d="M6 14l2 2" /><path d="M9 11l2 2" /><path d="M12 8l2 2" /><path d="M15 5l2 2" /></svg>',
                '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1" /><ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(45 12 12)" /><ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-45 12 12)" /></svg>',
                '<span class="font-serif italic font-bold text-xl tracking-widest">∫ f(x) = y</span>'
            ];

            let iconsHTML = Array.from({ length: 14 }).map((_, i) => {
                const left = (Math.random() * 90) + '%';
                const delay = (Math.random() * -25) + 's';
                const duration = (Math.random() * 15 + 20) + 's';
                const typeIndex = i % 4;

                return `
                    <div class="bg-knowledge-icon" style="left: ${left}; animation-delay: ${delay}; animation-duration: ${duration};">
                        ${svgIcons[typeIndex]}
                    </div>
                `;
            }).join('');

            // 4. Inject Book + Words + Icons
            scene.innerHTML = wordsHTML + iconsHTML + `
                <div style="transform: scale(1.6) translateY(5%); transform-origin: center center;">
                    <div class="bb-book-wrap"><div class="bb-book">
                        <div class="bb-spine"></div><div class="bb-ghost"></div>
                        <div class="bb-page bb-page-left"><div class="bb-page-surface">
                            <div class="bb-page-header">JIU // ARCHIVE</div>
                            <div class="bb-page-text bb-text-right">
                                <span class="bb-wl">Establishing connection...</span><br/>
                                <span class="bb-wl" style="animation-delay: 1s">Network: SECURE</span><br/>
                                <span class="bb-wl" style="animation-delay: 2s">Syncing database.</span><br/><br/>
                                <span class="bb-wl" style="animation-delay: 3.5s">DREAM BLUE LIBRARY</span><br/>
                                <span class="bb-wl" style="animation-delay: 4.5s">Knowledge is Power.</span>
                            </div>
                        </div></div>
                        <div class="bb-page bb-page-right"><div class="bb-page-surface">
                            <div class="bb-page-header">SCAN // PROTOCOL</div>
                            <div class="bb-page-text bb-text-left">
                                <span class="bb-wl" style="animation-delay: 1.5s">System monitoring.</span><br/>
                                <span class="bb-wl" style="animation-delay: 2.5s">Waiting for RFID...</span><br/>
                                <span class="bb-wl" style="animation-delay: 3.5s">Validating member.</span><br/><br/>
                                <span class="bb-wl" style="animation-delay: 4.5s">Please tap card.</span><br/>
                                <span class="bb-wl" style="animation-delay: 6.5s">STATUS: LISTENING</span>
                            </div>
                        </div></div>
                    </div></div>
                </div>
            `;
        }

        // Kiosk Auto-Refresh at 03:00 AM to prevent memory leaks
        function checkAutoRefresh() {
            const now = new Date();
            if (now.getHours() === 3 && now.getMinutes() === 0 && now.getSeconds() < 10) {
                window.location.reload();
            }
        }
        setInterval(checkAutoRefresh, 5000);

    </script>
<?php endif; ?>
</body>
</html>
