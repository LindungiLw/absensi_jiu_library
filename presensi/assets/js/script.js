const VALUES_TEXT = ["Love", "Integrity", "Faithfulness", "Excellence"];

// Injeksi Background Words
const bgWordsContainer = document.getElementById('bgWordsContainer');
VALUES_TEXT.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-400';
    span.style.animation = `cycleWord 20s ease-in-out infinite`;
    span.style.animationDelay = `${i * 5}s`;
    span.style.opacity = '0';
    span.innerText = word;
    bgWordsContainer.appendChild(span);
});

// Setup Confetti
const CONFETTI_COLORS = ["bg-blue-500", "bg-sky-400", "bg-indigo-500", "bg-rose-500", "bg-amber-400", "bg-emerald-400"];
const confettiContainer = document.getElementById('confettiContainer');

function triggerFastConfetti() {
    confettiContainer.innerHTML = '';
    confettiContainer.classList.remove('hidden');
    
    for(let i=0; i<60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 150 + Math.random() * 350;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity - 80;
        const rot = Math.random() * 360 + 180;
        const delay = Math.random() * 0.1;
        const size = Math.floor(Math.random() * 8) + 6;
        const isCircle = Math.random() > 0.5;
        const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        
        const particle = document.createElement('div');
        particle.className = `absolute ${color} ${isCircle ? "rounded-full" : "rounded-sm"} shadow-sm`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.setProperty('--rot', `${rot}deg`);
        particle.style.animation = `confettiFirework 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.opacity = '0';
        
        confettiContainer.appendChild(particle);
    }
    
    setTimeout(() => {
        confettiContainer.classList.add('hidden');
    }, 1200);
}

// Elemen DOM
const form = document.getElementById('absenForm');
const inputID = document.getElementById('inputID');
const btnText = document.getElementById('btnText');
const btnLoading = document.getElementById('btnLoading');
const submitBtn = document.getElementById('submitBtn');

const notifBox = document.getElementById('notifBox');
const logArea = document.getElementById('logArea');
const waitingText = document.getElementById('waitingText');

const logRole = document.getElementById('logRole');
const logRank = document.getElementById('logRank');
const logInitial = document.getElementById('logInitial');
const logNama = document.getElementById('logNama');
const logNIM = document.getElementById('logNIM');
const logSesi = document.getElementById('logSesi');

let notifTimeout = null;

// Mengatur Auto-Focus 
document.addEventListener('click', () => {
    if (window.getSelection()?.toString() === "") {
        inputID.focus();
    }
});

function showNotification(type, msg) {
    if (notifTimeout) clearTimeout(notifTimeout);
    
    notifBox.classList.remove('hidden', 'bg-emerald-50/90', 'border-emerald-300', 'text-emerald-800', 'shadow-emerald-200/50', 'bg-rose-50/90', 'border-rose-300', 'text-rose-800', 'shadow-rose-200/50');
    
    if(type === 'success') {
        notifBox.classList.add('bg-emerald-50/90', 'border-emerald-300', 'text-emerald-800', 'shadow-emerald-200/50');
    } else {
        notifBox.classList.add('bg-rose-50/90', 'border-rose-300', 'text-rose-800', 'shadow-rose-200/50');
    }
    
    notifBox.innerText = msg;
    
    notifTimeout = setTimeout(() => {
        notifBox.classList.add('hidden');
    }, 3000);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const scannedID = inputID.value.trim();
    if (!scannedID) return;

    // Loading State
    inputID.disabled = true;
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    
    logArea.classList.add('hidden');
    notifBox.classList.add('hidden');
    waitingText.classList.remove('hidden');

    try {
        const response = await fetch('api/absensi.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nim: scannedID })
        });
        
        const data = await response.json();

        if (response.ok && data.success) {
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
                else sapaan = `Hello, ${data.nama}! 👋 Welcome to the library!`;
            }

            showNotification("success", sapaan);

            // Update Log Area
            waitingText.classList.add('hidden');
            logArea.classList.remove('hidden');
            
            logRole.innerText = data.role === "student" ? "STUDENT RANK" : (data.role === "lecturer" ? "LECTURER RANK" : "STAFF RANK");
            logRank.innerText = data.ranking;
            logNama.innerText = data.nama;
            logNIM.innerText = data.nim;
            logSesi.innerText = data.sesi;
            logInitial.innerText = data.nama.charAt(0).toUpperCase();

            triggerFastConfetti();
        } else {
            showNotification("error", data.error || "Failed to process data.");
        }
    } catch (err) {
        showNotification("error", "Failed to connect to server.");
    } finally {
        // Reset state
        inputID.value = '';
        inputID.disabled = false;
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
        
        setTimeout(() => {
            inputID.focus();
        }, 10);
    }
});
