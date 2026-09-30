// ==================== CONFIG BACKEND ====================
// PILIH SALAH SATU:
// A) Punya hosting PHP -> isi API_BASE dengan URL api.php (contoh di bawah)
// B) Cuma punya GitHub + Netlify (kasus lu) -> pakai Google Sheets GRATIS:
//    1. Ikuti cara di file apps-script.gs (buat Sheet + Deploy Web app)
//    2. Paste URL Web app di SHEETS_URL bawah ini, push ke GitHub -> Netlify.
//    Semua user yang daftar/login otomatis masuk ke Sheet = database + keliatan kayak notepad.
// const API_BASE = 'https://namadomainamu.com/api.php';
const API_BASE = 'api.php';
// Contoh: const SHEETS_URL = 'https://script.google.com/macros/s/AKfycxxxx/exec';
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbzlkCjA-EvttTsHthD0s-A5Py4e5l0EcW68DnCTomSF3lQU49xKloSEbx1JC9BdyTQHeQ/exec';

async function sheetsCall(action, payload) {
    if (!SHEETS_URL) throw new Error('SHEETS_URL kosong');
    const res = await fetch(SHEETS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, ...payload })
    });
    return res.json();
}

async function apiCall(action, payload) {
    const res = await fetch(API_BASE + '?action=' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    // kalau api.php tidak ada (misal dibuka via Netlify static / file://), lempar error biar fallback ke localStorage
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        try { return JSON.parse(txt); } catch { throw new Error('API offline'); }
    }
    return res.json();
}

// ==================== DATA (fallback lokal) ====================
let users = JSON.parse(localStorage.getItem('nx_users')) || [];

let paket = JSON.parse(localStorage.getItem('nx_paket')) || [
    {
        id: 1,
        nama: "EXTERNAL",
        desc: "Paket dasar untuk kebutuhan PC.",
        tiers: [
            { label: "1 Day",  desc: "Akses penuh 24 jam", features: ["AimBot Collider", "AimBot FOV", "Windows 10 / 11 (x64)", "MSI App Player (recommended)", "Free Fire V7A Only"], harga: 5000 },
            { label: "3 Days", desc: "Akses 3 hari berturut-turut", features: ["AimBot Collider", "AimBot FOV", "Windows 10 / 11 (x64)", "MSI App Player (recommended)", "Free Fire V7A Only"], harga: 20000 },
            { label: "7 Days", desc: "Akses 1 minggu penuh", features: ["AimBot Collider", "AimBot FOV", "Windows 10 / 11 (x64)", "MSI App Player (recommended)", "Free Fire V7A Only"], harga: 45000 },
            { label: "28 Days", desc: "Hemat untuk pemakaian bulanan", features: ["AimBot Collider", "AimBot FOV", "Windows 10 / 11 (x64)", "MSI App Player (recommended)", "Free Fire V7A Only"], harga: 75000 },
            { label: "30 Days", desc: "Full akses 1 bulan", features: ["AimBot Collider", "AimBot FOV", "Windows 10 / 11 (x64)", "MSI App Player (recommended)", "Free Fire V7A Only"], harga: 120000 },
            { label: "1 AOB", desc: "Akses setahun full benefit", features: ["AimBot Collider", "AimBot FOV", "Windows 10 / 11 (x64)", "MSI App Player (recommended)", "Free Fire V7A Only"], harga: 200000 }
        ]
    },
    {
        id: 2,
        nama: "INTERNAL",
        desc: "Fitur lengkap dengan dukungan prioritas.",
        tiers: [
            { label: "1 Day",  desc: "Coba semua fitur internal", features: ["AimBot · AimBot External", "AimFov · Silent Aim", "Fast Fire · No Reload", "Speed Hack · Auto Fire", "Sniper Scope · Sniper Switch", "ALL ESP Type", "And Others Features", "Windows 10 / 11 x64", "MSI App Player & Bluestacks App Player", "Free Fire V7A Only"], harga: 15000 },
            { label: "7 Days", desc: "Akses 1 minggu dengan prioritas", features: ["AimBot · AimBot External", "AimFov · Silent Aim", "Fast Fire · No Reload", "Speed Hack · Auto Fire", "Sniper Scope · Sniper Switch", "ALL ESP Type", "And Others Features", "Windows 10 / 11 x64", "MSI App Player & Bluestacks App Player", "Free Fire V7A Only"], harga: 35000 },
            { label: "28 Days", desc: "Hemat untuk pemakaian rutin", features: ["AimBot · AimBot External", "AimFov · Silent Aim", "Fast Fire · No Reload", "Speed Hack · Auto Fire", "Sniper Scope · Sniper Switch", "ALL ESP Type", "And Others Features", "Windows 10 / 11 x64", "MSI App Player & Bluestacks App Player", "Free Fire V7A Only"], harga: 75000 },
            { label: "30 Days", desc: "Full akses 1 bulan internal", features: ["AimBot · AimBot External", "AimFov · Silent Aim", "Fast Fire · No Reload", "Speed Hack · Auto Fire", "Sniper Scope · Sniper Switch", "ALL ESP Type", "And Others Features", "Windows 10 / 11 x64", "MSI App Player & Bluestacks App Player", "Free Fire V7A Only"], harga: 150000 },
            { label: "1 AOB", desc: "Full akses 1 tahun dengan semua fitur", features: ["AimBot · AimBot External", "AimFov · Silent Aim", "Fast Fire · No Reload", "Speed Hack · Auto Fire", "Sniper Scope · Sniper Switch", "ALL ESP Type", "And Others Features", "Windows 10 / 11 x64", "MSI App Player & Bluestacks App Player", "Free Fire V7A Only"], harga: 280000 }
        ]
    }
];

let faq = JSON.parse(localStorage.getItem('nx_faq')) || [
    { id: 1, tanya: "Bagaimana cara order?", jawab: "Pilih paket, atur durasi, lalu klik Bayar Sekarang. Kamu akan diarahkan ke WhatsApp atau Discord untuk konfirmasi." }
];

let transaksi = JSON.parse(localStorage.getItem('nx_transaksi')) || [];
let diskon = JSON.parse(localStorage.getItem('nx_diskon')) || [
    { kode: "HEMAT50", persen: 10 }
];

let kontak = JSON.parse(localStorage.getItem('nx_kontak')) || {
    wa: "62881010369513",
    discord: "https://discord.gg/hXUYgFwRK"
};

function saveData() {
    localStorage.setItem('nx_users', JSON.stringify(users));
    localStorage.setItem('nx_paket', JSON.stringify(paket));
    localStorage.setItem('nx_faq', JSON.stringify(faq));
    localStorage.setItem('nx_transaksi', JSON.stringify(transaksi));
    localStorage.setItem('nx_diskon', JSON.stringify(diskon));
    localStorage.setItem('nx_kontak', JSON.stringify(kontak));
    // user hanya dorong transaksi ke database online (paket/faq/diskon/kontak milik admin,
    // kalau ikut didorong dari sini bisa nimpa settingan admin yang lebih baru)
    pushKey('transaksi', transaksi);
}

// ==================== SYNC ONLINE (biar Netlify kebawa) ====================
// GET load_all saat buka web, POST save_key tiap ada perubahan.
function pushKey(key, value) {
    if (!SHEETS_URL) return;
    fetch(SHEETS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'save_key', key, value })
    }).catch(() => {});
}

async function loadShared() {
    if (!SHEETS_URL) return;
    try {
        const res = await fetch(SHEETS_URL + '?action=load_all');
        const j = await res.json();
        if (j.success && j.data) {
            if (Array.isArray(j.data.paket) && j.data.paket.length) paket = j.data.paket;
            if (Array.isArray(j.data.faq) && j.data.faq.length) faq = j.data.faq;
            if (Array.isArray(j.data.transaksi)) transaksi = j.data.transaksi;
            if (Array.isArray(j.data.diskon) && j.data.diskon.length) diskon = j.data.diskon;
            if (j.data.kontak && j.data.kontak.wa) kontak = j.data.kontak;
            localStorage.setItem('nx_paket', JSON.stringify(paket));
            localStorage.setItem('nx_faq', JSON.stringify(faq));
            localStorage.setItem('nx_transaksi', JSON.stringify(transaksi));
            localStorage.setItem('nx_diskon', JSON.stringify(diskon));
            localStorage.setItem('nx_kontak', JSON.stringify(kontak));
        }
    } catch (e) { console.warn('loadShared gagal, pakai lokal:', e); }
}

let currentUser = JSON.parse(localStorage.getItem('nx_currentUser')) || null;
let isLoginMode = true;

// ==================== MODAL SYSTEM ====================
const ICONS = {
    success: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    error:   '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info:    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};

function showModal(options) {
    const { title, message, type = 'info', confirmText = 'OK', onConfirm, showCancel = false, cancelText = 'Batal', customHTML = null } = options;
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box">
            <div class="modal-icon ${type}">${ICONS[type]}</div>
            <h3 class="modal-title">${title}</h3>
            <div class="modal-message">${customHTML || message}</div>
            <div class="modal-actions">
                ${showCancel ? `<button class="modal-btn modal-btn-secondary" data-action="cancel">${cancelText}</button>` : ''}
                <button class="modal-btn modal-btn-primary" data-action="confirm">${confirmText}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    const close = () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 250);
    };
    overlay.querySelector('[data-action="confirm"]').onclick = () => { close(); if (onConfirm) onConfirm(); };
    if (showCancel) overlay.querySelector('[data-action="cancel"]').onclick = close;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

function showAlert(title, message, type = 'info') { showModal({ title, message, type }); }
function showConfirm(title, message, onConfirm, type = 'warning') { showModal({ title, message, type, showCancel: true, confirmText: 'Ya, Lanjutkan', cancelText: 'Batal', onConfirm }); }

// ==================== NAVIGASI ====================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId + '-page').classList.add('active');
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

    if (pageId === 'auth') {
        document.getElementById('auth-form').reset();
        isLoginMode = true;
        updateAuthUI();
    }
    if (pageId === 'home') renderHome();
    if (pageId === 'faq') {
        if (!currentUser) { showAlert('Akses Ditolak', 'Login dulu untuk akses FAQ.', 'warning'); showPage('auth'); return; }
        renderFAQ();
    }
    if (pageId === 'transaksi') {
        if (!currentUser) { showAlert('Akses Ditolak', 'Login dulu untuk akses Transaksi.', 'warning'); showPage('auth'); return; }
        renderTransaksiUser();
    }
}

function handleNavClick() {
    if (currentUser) {
        showConfirm('Logout', 'Yakin ingin logout dari akun ' + currentUser.username + '?', () => {
            currentUser = null;
            localStorage.removeItem('nx_currentUser');
            updateNavbar();
            showPage('home');
        });
    } else {
        showPage('auth');
    }
}

function updateNavbar() {
    const btn = document.getElementById('nav-btn');
    const span = btn.querySelector('span');
    if (currentUser) span.innerText = 'Halo, ' + currentUser.username;
    else span.innerText = 'Masuk Akun';
}

function renderHome() {
    const locked = document.getElementById('locked-state');
    const unlocked = document.getElementById('unlocked-state');
    const navLinks = document.getElementById('nav-links');

    if (currentUser) {
        locked.style.display = 'none';
        unlocked.style.display = 'block';
        navLinks.style.display = 'flex';
        document.getElementById('hero-username').innerText = currentUser.username.toUpperCase();
        document.getElementById('hero-name').innerText = currentUser.username;
        renderProduk();
    } else {
        locked.style.display = 'block';
        unlocked.style.display = 'none';
        navLinks.style.display = 'none';
    }
}

// ==================== AUTH ====================
function toggleAuthMode() { isLoginMode = !isLoginMode; updateAuthUI(); }

function updateAuthUI() {
    const title = document.getElementById('auth-title-text');
    const sub = document.getElementById('auth-sub-text');
    const btn = document.getElementById('auth-btn').querySelector('span');
    const toggleText = document.getElementById('toggle-text');
    const toggleLink = document.getElementById('toggle-link');
    const usernameGroup = document.getElementById('username-group');
    const usernameInput = document.getElementById('username');

    if (isLoginMode) {
        title.innerHTML = 'WELCOME TO <span class="text-gradient">NULL-X</span>';
        sub.innerText = 'Masuk untuk melanjutkan. Belum punya akun? Daftar dulu.';
        btn.innerText = 'Masuk';
        toggleText.innerText = 'Belum punya akun?';
        toggleLink.innerText = 'Daftar sekarang';
        usernameGroup.style.display = 'none';
        usernameInput.required = false;
    } else {
        title.innerHTML = 'REGISTRY <span class="text-gradient">NULL-X</span>';
        sub.innerText = 'Daftarkan akun baru. Email hanya bisa dipakai sekali.';
        btn.innerText = 'Daftar';
        toggleText.innerText = 'Sudah punya akun?';
        toggleLink.innerText = 'Masuk di sini';
        usernameGroup.style.display = 'block';
        usernameInput.required = true;
    }
}

async function handleAuth(event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) { showAlert('Field Kosong', 'Email dan password wajib diisi.', 'warning'); return; }
    if (!email.includes('@') || !email.includes('.')) { showAlert('Email Tidak Valid', 'Format email salah.', 'error'); return; }

    const btn = document.getElementById('auth-btn').querySelector('span');
    const oldBtn = btn.innerText;
    btn.innerText = 'Loading...';

    // 1) Coba Google Sheets dulu (paling cocok buat GitHub + Netlify, tanpa hosting PHP)
    // 2) Kalau gagal, coba api.php (buat yang punya hosting PHP)
    // 3) Terakhir fallback localStorage (offline, pindah HP hilang)
    try {
        let r = null;
        try { r = await sheetsCall(isLoginMode ? 'login' : 'register', { email, username, password }); }
        catch (eSheets) { r = await apiCall(isLoginMode ? 'login' : 'register', { email, username, password }); }

        if (isLoginMode) {
            if (r.success) { loginSukses(r.user); return; }
            else {
                showAlert(r.message.includes('terdaftar') ? 'Akun Tidak Ditemukan' : 'Gagal Login', r.message, 'error');
                return;
            }
        } else {
            if (username.length < 3) { showAlert('Username Terlalu Pendek', 'Username minimal 3 karakter.', 'warning'); return; }
            if (r.success) {
                if (!users.find(u => u.email && u.email.toLowerCase() === email)) {
                    users.push({ email, username, password });
                    saveData();
                }
                showModal({
                    title: 'Pendaftaran Berhasil',
                    message: r.message + ' Sudah masuk database, bisa login dari HP mana aja.',
                    type: 'success',
                    confirmText: 'Login Sekarang',
                    onConfirm: () => { isLoginMode = true; updateAuthUI(); document.getElementById('auth-form').reset(); }
                });
                return;
            } else {
                showAlert('Gagal Daftar', r.message, 'error');
                return;
            }
        }
    } catch (e) {
        console.warn('Backend offline, pakai localStorage:', e);
    } finally {
        btn.innerText = oldBtn;
    }

    if (isLoginMode) {
        const user = users.find(u => u.email && u.email.toLowerCase() === email && u.password === password);
        if (user) {
            loginSukses(user, true);
        } else {
            const emailExist = users.find(u => u.email && u.email.toLowerCase() === email);
            if (emailExist) showAlert('Password Salah', 'Email terdaftar (lokal), tapi password salah. Catatan: ini mode offline, pindah HP tidak terbawa.', 'error');
            else showAlert('Akun Tidak Ditemukan', 'Email belum terdaftar. Silakan daftar dulu. (Mode offline: backend PHP belum terhubung)', 'error');
        }
    } else {
        if (username.length < 3) { showAlert('Username Terlalu Pendek', 'Username minimal 3 karakter.', 'warning'); return; }
        if (users.find(u => u.email && u.email.toLowerCase() === email)) { showAlert('Email Sudah Terdaftar', 'Email ini sudah dipakai.', 'error'); return; }
        if (users.find(u => u.username && u.username.toLowerCase() === username.toLowerCase())) { showAlert('Username Sudah Dipakai', 'Username ini sudah digunakan.', 'error'); return; }

        users.push({ email, username, password });
        saveData();
        showModal({
            title: 'Pendaftaran Berhasil (Lokal)',
            message: 'Backend PHP belum terhubung, jadi akun hanya tersimpan di browser ini. Upload api.php + config.php ke hosting PHP agar permanen.',
            type: 'success',
            confirmText: 'Login Sekarang',
            onConfirm: () => { isLoginMode = true; updateAuthUI(); document.getElementById('auth-form').reset(); }
        });
    }
}

function loginSukses(user, lokal = false) {
    currentUser = user;
    localStorage.setItem('nx_currentUser', JSON.stringify(user));
    updateNavbar();
    showModal({ title: 'Login Berhasil', message: 'Selamat datang kembali, ' + user.username + '.' + (lokal ? ' (mode lokal)' : ''), type: 'success', confirmText: 'Lanjutkan', onConfirm: () => showPage('home') });
}

// ==================== LUPA PASSWORD (OTP Gmail via Sheets) ====================
let resetEmail = '';

function forgotStep1() {
    if (!SHEETS_URL) { showAlert('Belum Aktif', 'Isi SHEETS_URL dulu (lihat apps-script.gs) biar bisa kirim kode ke Gmail.', 'warning'); return; }
    showModal({
        title: 'Lupa Password',
        type: 'info',
        customHTML: `<div class="order-field"><label>EMAIL TERDAFTAR</label><input type="email" id="fp-email" placeholder="nama@email.com"></div>`,
        confirmText: 'Kirim Kode',
        showCancel: true,
        cancelText: 'Batal',
        onConfirm: async () => {
            const em = document.getElementById('fp-email');
            const email = em ? em.value.trim().toLowerCase() : document.getElementById('email').value.trim().toLowerCase();
            if (!email) { showAlert('Field Kosong', 'Isi email dulu.', 'warning'); return; }
            resetEmail = email;
            try {
                const r = await sheetsCall('request_reset', { email });
                if (r.success) setTimeout(() => forgotStep2(), 300);
                else showAlert('Gagal', r.message, 'error');
            } catch (e) { showAlert('Gagal', 'Tidak bisa hubungi database. Cek SHEETS_URL.', 'error'); }
        }
    });
}

function forgotStep2() {
    showModal({
        title: 'Masukkan Kode Gmail',
        type: 'info',
        customHTML: `
            <p style="font-size:0.85rem; opacity:0.8; margin-bottom:1rem;">Kode 6 digit terkirim ke ${resetEmail}. Berlaku 15 menit. Cek inbox/spam.</p>
            <div class="order-field"><label>KODE</label><input type="text" id="fp-kode" placeholder="123456" maxlength="6"></div>
            <div class="order-field"><label>PASSWORD BARU</label><input type="password" id="fp-baru" placeholder="Password baru"></div>`,
        confirmText: 'Ganti Password',
        showCancel: true,
        cancelText: 'Batal',
        onConfirm: async () => {
            const kode = document.getElementById('fp-kode').value.trim();
            const baru = document.getElementById('fp-baru').value.trim();
            if (!kode || !baru) { showAlert('Field Kosong', 'Isi kode dan password baru.', 'warning'); return; }
            try {
                const r = await sheetsCall('reset_password', { email: resetEmail, kode, newPassword: baru });
                if (r.success) {
                    // update juga lokal biar sinkron
                    const u = users.find(x => x.email && x.email.toLowerCase() === resetEmail);
                    if (u) { u.password = baru; saveData(); }
                    showAlert('Berhasil', r.message + ' Password di database juga udah ke-update.', 'success');
                } else showAlert('Gagal', r.message, 'error');
            } catch (e) { showAlert('Gagal', 'Tidak bisa hubungi database.', 'error'); }
        }
    });
}

// ==================== PRODUK ====================
function renderProduk() {
    const container = document.getElementById('produk-list');
    if (!container) return;
    if (paket.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#737373; grid-column: 1/-1;">Belum ada paket tersedia.</p>';
        return;
    }
    container.innerHTML = paket.map(p => {
        const termurah = p.tiers.reduce((a, b) => a.harga < b.harga ? a : b);
        const features = termurah.features || [];
        return `
            <div class="pricing-card">
                <h3>${p.nama}</h3>
                <p class="desc">${p.desc}</p>
                <div class="price-label">Mulai dari</div>
                <div class="price">Rp ${termurah.harga.toLocaleString('id-ID')}</div>
                ${features.length > 0 ? `
                    <div class="card-features-preview">
                        ${features.map(f => `<div class="card-feature-item">${f}</div>`).join('')}
                    </div>
                ` : ''}
                <button class="card-btn" onclick="openOrderForm(${p.id})">Pilih Paket</button>
            </div>
        `;
    }).join('');
}

// ==================== ORDER FORM ====================
let orderState = {
    paketId: null,
    tierIndex: 0,
    diskonPersen: 0,
    diskonKode: ''
};

function openOrderForm(paketId) {
    if (!currentUser) { showAlert('Belum Login', 'Login dulu untuk order.', 'warning'); showPage('auth'); return; }
    const p = paket.find(x => x.id === paketId);
    if (!p) return;

    orderState = { paketId, tierIndex: 0, diskonPersen: 0, diskonKode: '' };

    const tierPreviewHTML = p.tiers.map((t, i) => `
        <div class="tier-preview-row ${i === 0 ? 'active' : ''}" data-tier="${i}" onclick="selectTier(${i})">
            <span class="tier-label-text">${t.label}</span>
            <span class="tier-price-text">Rp ${t.harga.toLocaleString('id-ID')}</span>
        </div>
    `).join('');

    const firstTier = p.tiers[0];
    const firstFeaturesHTML = (firstTier.features || []).map(f => `<div class="feature-item">${f}</div>`).join('');

    showModal({
        title: 'Form Order',
        type: 'info',
        customHTML: `
            <div class="order-info-box">
                <div class="order-info-label">PAKET PILIHANMU</div>
                <div class="order-info-name">${p.nama}</div>
                <div class="order-info-sub" id="order-info-sub">${firstTier.label}</div>
                <div class="order-info-desc" id="order-info-desc">${firstTier.desc || ''}</div>
                ${firstFeaturesHTML ? `<div class="order-info-features" id="order-info-features">${firstFeaturesHTML}</div>` : ''}
            </div>

            <div class="order-field">
                <label>USERNAME</label>
                <input type="text" id="order-username" placeholder="Nama pengguna" value="${currentUser.username}">
            </div>

            <div class="order-field">
                <label>PASSWORD</label>
                <input type="text" id="order-password" placeholder="Password (bebas)">
            </div>

            <div class="order-field">
                <label>PILIH DURASI</label>
                <select id="order-tier" onchange="selectTier(this.value)">
                    ${p.tiers.map((t, i) => `<option value="${i}">${t.label} - Rp ${t.harga.toLocaleString('id-ID')}</option>`).join('')}
                </select>
            </div>

            <div class="tier-preview">
                <div class="tier-preview-title">Daftar Durasi ${p.nama}</div>
                ${tierPreviewHTML}
            </div>

            <div class="order-total-row">
                <div>Total</div>
                <div class="order-total-value" id="order-total">Rp 0</div>
            </div>

            <div class="order-field">
                <label>KODE DISKON (OPSIONAL)</label>
                <input type="text" id="order-diskon" placeholder="Contoh: HEMAT50">
            </div>

            <button class="order-diskon-btn" onclick="applyDiskon()">Pakai Kode</button>
        `,
        confirmText: 'Bayar Sekarang',
        showCancel: true,
        cancelText: 'Batal',
        onConfirm: () => proceedPayment()
    });

    setTimeout(() => updateOrderPrice(), 50);
}

function selectTier(index) {
    index = parseInt(index);
    orderState.tierIndex = index;
    const p = paket.find(x => x.id === orderState.paketId);
    const tier = p.tiers[index];

    const tierSelect = document.getElementById('order-tier');
    if (tierSelect) tierSelect.value = index;

    document.querySelectorAll('.tier-preview-row').forEach(row => {
        row.classList.toggle('active', parseInt(row.dataset.tier) === index);
    });

    const infoSub = document.getElementById('order-info-sub');
    if (infoSub) infoSub.innerText = tier.label;
    const infoDesc = document.getElementById('order-info-desc');
    if (infoDesc) infoDesc.innerText = tier.desc || '';

    const featuresContainer = document.getElementById('order-info-features');
    if (featuresContainer) {
        if (tier.features && tier.features.length > 0) {
            featuresContainer.innerHTML = tier.features.map(f => `<div class="feature-item">${f}</div>`).join('');
            featuresContainer.style.display = 'flex';
        } else {
            featuresContainer.innerHTML = '';
            featuresContainer.style.display = 'none';
        }
    }

    updateOrderPrice();
}

function updateOrderPrice() {
    const p = paket.find(x => x.id === orderState.paketId);
    if (!p) return;

    const tierSelect = document.getElementById('order-tier');
    if (!tierSelect) return;

    const tierIndex = parseInt(tierSelect.value);
    const tier = p.tiers[tierIndex];

    orderState.tierIndex = tierIndex;

    // Total = harga tier - diskon (TANPA perkalian jumlah)
    let base = tier.harga;
    let potongan = base * (orderState.diskonPersen / 100);
    let total = base - potongan;

    document.getElementById('order-total').innerText = 'Rp ' + total.toLocaleString('id-ID');
}

function applyDiskon() {
    const kodeInput = document.getElementById('order-diskon');
    const kode = kodeInput.value.trim().toUpperCase();
    if (!kode) return;

    const found = diskon.find(d => d.kode.toUpperCase() === kode);
    if (!found) {
        showAlert('Kode Tidak Valid', 'Kode diskon tidak ditemukan.', 'error');
        orderState.diskonPersen = 0;
        orderState.diskonKode = '';
        updateOrderPrice();
        return;
    }

    orderState.diskonPersen = found.persen;
    orderState.diskonKode = kode;
    updateOrderPrice();
    showAlert('Kode Diterapkan', `Diskon ${found.persen}% berhasil dipakai.`, 'success');
}

function proceedPayment() {
    const p = paket.find(x => x.id === orderState.paketId);
    const tier = p.tiers[orderState.tierIndex];
    const username = document.getElementById('order-username').value.trim();
    const password = document.getElementById('order-password').value.trim();

    if (!username) { showAlert('Field Kosong', 'Username wajib diisi.', 'warning'); return; }
    if (!password) { showAlert('Field Kosong', 'Password wajib diisi.', 'warning'); return; }

    const subtotal = tier.harga;
    const potongan = subtotal * (orderState.diskonPersen / 100);
    const total = subtotal - potongan;

    const trx = {
        id: 'TRX-' + Date.now(),
        user: currentUser.username,
        email: currentUser.email,
        paket: p.nama,
        tier: tier.label,
        tierDesc: tier.desc || '',
        features: tier.features || [],
        durasi: tier.label,
        satuan: '-',
        hargaSatuan: tier.harga,
        subtotal,
        diskon: orderState.diskonPersen,
        diskonKode: orderState.diskonKode,
        total,
        orderUser: username,
        orderPass: password,
        tanggal: new Date().toLocaleString('id-ID'),
        status: 'Pending'
    };
    transaksi.push(trx);
    saveData();

    setTimeout(() => showPaymentPopup(trx), 300);
}

function showPaymentPopup(trx) {
    const waMessage = encodeURIComponent(
        `Halo Admin NULL-X, saya ingin order:\n\n` +
        `ID: ${trx.id}\n` +
        `Paket: ${trx.paket} (${trx.tier})\n` +
        (trx.tierDesc ? `Deskripsi: ${trx.tierDesc}\n` : '') +
        `Durasi: ${trx.tier}\n` +
        `Subtotal: Rp ${trx.subtotal.toLocaleString('id-ID')}\n` +
        (trx.diskon > 0 ? `Diskon: ${trx.diskon}% (${trx.diskonKode})\n` : '') +
        `Total: Rp ${trx.total.toLocaleString('id-ID')}\n\n` +
        `Username: ${trx.orderUser}\n` +
        `Password: ${trx.orderPass}\n\n` +
        `Mohon diproses ya. Terima kasih.`
    );

    const waLink = `https://wa.me/${kontak.wa}?text=${waMessage}`;
    const discordLink = kontak.discord;

    showModal({
        title: 'Pilih Metode Pembayaran',
        type: 'success',
        customHTML: `
            <div class="payment-summary">
                <div class="payment-row"><span>ID Transaksi</span><span>${trx.id}</span></div>
                <div class="payment-row"><span>Paket</span><span>${trx.paket} - ${trx.tier}</span></div>
                ${trx.tierDesc ? `<div class="payment-row"><span>Deskripsi</span><span>${trx.tierDesc}</span></div>` : ''}
                <div class="payment-row"><span>Durasi</span><span>${trx.tier}</span></div>
                <div class="payment-row"><span>Username</span><span>${trx.orderUser}</span></div>
                <div class="payment-row"><span>Password</span><span>${trx.orderPass}</span></div>
                <div class="payment-row"><span>Subtotal</span><span>Rp ${trx.subtotal.toLocaleString('id-ID')}</span></div>
                ${trx.diskon > 0 ? `<div class="payment-row"><span>Diskon</span><span>-${trx.diskon}% (${trx.diskonKode})</span></div>` : ''}
                <div class="payment-row payment-total"><span>Total</span><span>Rp ${trx.total.toLocaleString('id-ID')}</span></div>
            </div>
            <p class="payment-note">Hubungi admin untuk menyelesaikan pembayaran:</p>
            <div class="payment-buttons">
                <a href="${waLink}" target="_blank" class="payment-btn payment-wa">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.4"/></svg>
                    Bayar via WhatsApp
                </a>
                <a href="${discordLink}" target="_blank" class="payment-btn payment-discord">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.04.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.077.077 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.418 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.418 0 1.334-.946 2.419-2.157 2.419z"/></svg>
                    Bayar via Discord
                </a>
            </div>
        `,
        confirmText: 'Sudah Bayar',
        showCancel: true,
        cancelText: 'Nanti',
        onConfirm: () => {
            showAlert('Terima Kasih', 'Admin akan segera memproses pesanan kamu.', 'success');
            showPage('transaksi');
        }
    });
}

// ==================== FAQ ====================
function renderFAQ() {
    const container = document.getElementById('faq-list');
    if (!container) return;
    if (faq.length === 0) { container.innerHTML = '<p style="text-align:center; color:#737373;">Belum ada FAQ.</p>'; return; }
    container.innerHTML = faq.map(f => `<div class="faq-item"><h4>${f.tanya}</h4><p>${f.jawab}</p></div>`).join('');
}

// ==================== TRANSAKSI ====================
function renderTransaksiUser() {
    const tbody = document.getElementById('user-transaksi-body');
    if (!tbody) return;
    const userTrx = transaksi.filter(t => t.email === currentUser?.email);
    if (userTrx.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#737373; padding:2rem;">Belum ada transaksi.</td></tr>';
        return;
    }
    tbody.innerHTML = userTrx.map(t => `
        <tr>
            <td>${t.id}</td>
            <td>${t.paket} - ${t.tier}</td>
            <td>${t.tier || t.durasi}</td>
            <td>Rp ${t.total.toLocaleString('id-ID')}</td>
            <td>${t.tanggal}</td>
            <td><span class="badge-status ${t.status === 'Sukses' ? 'badge-success' : 'badge-warning'}">${t.status}</span></td>
        </tr>
    `).join('');
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
    updateNavbar();
    showPage('home');
    await loadShared();
    updateNavbar();
    showPage('home');
});