// ==================== PROTEKSI ====================
let isAdminLoggedIn = sessionStorage.getItem('nx_admin') === 'true';
if (!isAdminLoggedIn) window.location.href = 'admin-login.html';

// ==================== CONFIG DATABASE (SAMA KAYAK script.js) ====================
// Paste URL Web app Google Sheets yang sama di sini biar admin bisa lihat semua user.
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycby5MJLzJVv-eluw-8XHTcfmYDA7t9hA_LLTuvcYS60eBTPCIdluhjVgRxDnKngxxYs-ow/exec';

let adminUsersCache = [];

// ==================== DATA ====================
let paket = JSON.parse(localStorage.getItem('nx_paket')) || [
    {
        id: 1,
        nama: "EXTERNAL",
        desc: "Paket dasar untuk kebutuhan PC.",
        tiers: [
            { label: "1 Day",   days: 1,   harga: 5000 },
            { label: "3 Days",  days: 3,   harga: 20000 },
            { label: "7 Days",  days: 7,   harga: 45000 },
            { label: "28 Days", days: 28,  harga: 75000 },
            { label: "30 Days", days: 30,  harga: 120000 },
            { label: "1 AOB",   days: 365, harga: 200000 }
        ]
    },
    {
        id: 2,
        nama: "INTERNAL",
        desc: "Fitur lengkap dengan dukungan prioritas.",
        tiers: [
            { label: "1 Day",   days: 1,   harga: 15000 },
            { label: "7 Days",  days: 7,   harga: 35000 },
            { label: "28 Days", days: 28,  harga: 75000 },
            { label: "30 Days", days: 30,  harga: 150000 },
            { label: "1 AOB",   days: 365, harga: 280000 }
        ]
    }
];

let faq = JSON.parse(localStorage.getItem('nx_faq')) || [
    { id: 1, tanya: "Bagaimana cara order?", jawab: "Pilih paket, atur durasi, lalu klik Bayar Sekarang." }
];
let transaksi = JSON.parse(localStorage.getItem('nx_transaksi')) || [];
let users = JSON.parse(localStorage.getItem('nx_users')) || [];
let diskon = JSON.parse(localStorage.getItem('nx_diskon')) || [
    { kode: "HEMAT50", persen: 10 }
];
let kontak = JSON.parse(localStorage.getItem('nx_kontak')) || {
    wa: "6281234567890",
    discord: "https://discord.gg/nullex"
};
let pembayaran = JSON.parse(localStorage.getItem('nx_pembayaran')) || {
    dana: "083869704161",
    gopay: "",
    qris: "",
    menit: 15
};

function saveAdminData() {
    saveAdminDataLocal();
    // dorong semua ke database online biar user di Netlify ikut kebawa
    if (fbOn()) { fsSaveSnapshot(fsSnapshot()).catch(() => {}); return; }
    pushAdminKey('paket', paket);
    pushAdminKey('faq', faq);
    pushAdminKey('transaksi', transaksi);
    pushAdminKey('diskon', diskon);
    pushAdminKey('kontak', kontak);
    pushAdminKey('pembayaran', pembayaran);
}

function pushAdminKey(key, value) {
    if (!SHEETS_URL) return;
    fetch(SHEETS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'save_key', key, value })
    }).catch(() => {});
}

async function loadAdminShared() {
    if (fbOn()) {
        try {
            const d = await fsGetData();
            if (d) {
                if (Array.isArray(d.paket) && d.paket.length) paket = d.paket;
                if (Array.isArray(d.faq) && d.faq.length) faq = d.faq;
                if (Array.isArray(d.transaksi)) transaksi = d.transaksi;
                if (Array.isArray(d.diskon) && d.diskon.length) diskon = d.diskon;
                if (d.kontak && d.kontak.wa) kontak = d.kontak;
                if (d.pembayaran && (d.pembayaran.dana || d.pembayaran.gopay || d.pembayaran.qris)) pembayaran = d.pembayaran;
            }
            try {
                const fu = await fsListUsers();
                const lokal = users.map(u => u.email);
                fu.forEach(u => { if (!lokal.includes(u.email)) users.push({ email: u.email, username: u.username, password: '' }); });
            } catch (e) { /* users opsional */ }
            saveAdminDataLocal();
            return;
        } catch (e) { console.warn('loadAdminShared firebase gagal:', e); }
    }
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
            if (j.data.pembayaran && (j.data.pembayaran.dana || j.data.pembayaran.gopay || j.data.pembayaran.qris)) pembayaran = j.data.pembayaran;
            if (Array.isArray(j.users) && j.users.length) {
                const lokal = users.map(u => u.email);
                j.users.forEach(u => { if (!lokal.includes(u.email)) users.push({ email: u.email, username: u.username, password: '' }); });
            }
            saveAdminDataLocal();
        }
    } catch (e) { console.warn('loadAdminShared gagal:', e); }
}

function saveAdminDataLocal() {
    localStorage.setItem('nx_paket', JSON.stringify(paket));
    localStorage.setItem('nx_faq', JSON.stringify(faq));
    localStorage.setItem('nx_transaksi', JSON.stringify(transaksi));
    localStorage.setItem('nx_diskon', JSON.stringify(diskon));
    localStorage.setItem('nx_kontak', JSON.stringify(kontak));
    localStorage.setItem('nx_pembayaran', JSON.stringify(pembayaran));
}

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
    const close = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 250); };
    overlay.querySelector('[data-action="confirm"]').onclick = () => { close(); if (onConfirm) onConfirm(); };
    if (showCancel) overlay.querySelector('[data-action="cancel"]').onclick = close;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}
function showAlert(t, m, ty = 'info') { showModal({ title: t, message: m, type: ty }); }
function showConfirm(t, m, cb, ty = 'warning') { showModal({ title: t, message: m, type: ty, showCancel: true, confirmText: 'Ya, Lanjutkan', cancelText: 'Batal', onConfirm: cb }); }

// ==================== NAVIGASI ====================
function showAdminPage(pageId, e) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('admin-' + pageId + '-page');
    if (target) target.classList.add('active');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (e?.target) e.target.classList.add('active');

    if (pageId === 'dashboard') renderDashboard();
    if (pageId === 'produk') renderAdminProduk();
    if (pageId === 'faq') renderAdminFAQ();
    if (pageId === 'transaksi') renderAdminTransaksi();
    if (pageId === 'bayar') renderAdminBayar();
    if (pageId === 'users') loadUsersAdmin();
    if (pageId === 'diskon') renderAdminDiskon();
    if (pageId === 'kontak') renderAdminKontak();
}

function logoutAdmin() {
    showConfirm('Logout Admin', 'Yakin ingin keluar dari dashboard admin?', () => {
        sessionStorage.removeItem('nx_admin');
        window.location.href = 'admin-login.html';
    });
}

// ==================== DASHBOARD ====================
function renderDashboard() {
    document.getElementById('stat-produk').innerText = paket.length;
    document.getElementById('stat-transaksi').innerText = transaksi.length;
    document.getElementById('stat-user').innerText = users.length;
    const total = transaksi.filter(t => t.status === 'Sukses').reduce((s, t) => s + (t.total || 0), 0);
    document.getElementById('stat-pendapatan').innerText = 'Rp ' + total.toLocaleString('id-ID');
}

// ==================== USERS (DATABASE + NOTEPAD) ====================
async function loadUsersAdmin() {
    const tbody = document.getElementById('admin-users-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem;">Loading...</td></tr>';

    let gabungan = [];
    // 1) lokal (browser admin ini aja)
    users.forEach(u => gabungan.push({ email: u.email, username: u.username, tanggal: '-', sumber: 'Lokal' }));

    // 2) Firebase (semua HP, database resmi) - prioritas
    if (fbOn()) {
        try {
            const fu = await fsListUsers();
            fu.forEach(u => {
                if (!gabungan.find(x => x.email === u.email)) gabungan.push({ ...u, sumber: 'Firebase' });
            });
        } catch (e) { console.warn('fsListUsers gagal:', e); }
    }

    // 3) Google Sheets (semua HP, database asli)
    if (SHEETS_URL) {
        try {
            const res = await fetch(SHEETS_URL + '?action=list_users');
            const j = await res.json();
            if (j.success && Array.isArray(j.users)) {
                j.users.forEach(u => {
                    if (!gabungan.find(x => x.email === u.email)) gabungan.push({ ...u, sumber: 'Sheets' });
                    else {
                        const idx = gabungan.findIndex(x => x.email === u.email);
                        gabungan[idx].sumber = 'Sheets';
                        gabungan[idx].tanggal = u.tanggal || gabungan[idx].tanggal;
                    }
                });
            }
            // coba juga api.php kalau ada (yang punya hosting PHP)
            try {
                const r2 = await fetch('api.php?action=list_users');
                const j2 = await r2.json();
                if (j2.success) j2.users.forEach(u => {
                    if (!gabungan.find(x => x.email === u.email)) gabungan.push({ email: u.email, username: u.username, tanggal: u.created_at || '-', sumber: 'MySQL' });
                });
            } catch {}
        } catch (e) { console.warn('Sheets offline:', e); }
    }

    adminUsersCache = gabungan;
    renderUsersAdmin();
    const statUser = document.getElementById('stat-user');
    if (statUser) statUser.innerText = gabungan.length;
}

function renderUsersAdmin() {
    const tbody = document.getElementById('admin-users-body');
    if (!tbody) return;
    if (adminUsersCache.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#737373; padding:2rem;">Belum ada user. Isi SHEETS_URL dulu (lihat apps-script.gs) biar data dari semua HP masuk sini.</td></tr>';
        return;
    }
    tbody.innerHTML = adminUsersCache.map(u => `<tr><td>${u.email}</td><td><strong>${u.username}</strong></td><td>${u.tanggal || '-'}</td><td>${u.sumber}</td></tr>`).join('');
}

function downloadFile(nama, isi, tipe) {
    const blob = new Blob([isi], { type: tipe });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nama;
    a.click();
}

// Ini yang lu maksud "masuk notepad" bro -> download .txt bisa dibuka di Notepad
function exportUsersNotepad() {
    if (adminUsersCache.length === 0) { showAlert('Tidak Ada Data', 'Belum ada user.', 'warning'); return; }
    let txt = 'DATA USER NULL-X - ' + new Date().toLocaleString('id-ID') + '\n';
    txt += '==========================================\n';
    adminUsersCache.forEach((u, i) => { txt += `${i + 1}. ${u.username} | ${u.email} | ${u.tanggal || '-'} | ${u.sumber}\n`; });
    downloadFile('users-nullx.txt', txt, 'text/plain;charset=utf-8');
    showAlert('Berhasil', 'File users-nullx.txt ke-download, buka pake Notepad.', 'success');
}

function exportUsersCSV() {
    if (adminUsersCache.length === 0) { showAlert('Tidak Ada Data', 'Belum ada user.', 'warning'); return; }
    let csv = 'No,Username,Email,Tanggal,Sumber\n';
    adminUsersCache.forEach((u, i) => { csv += `${i + 1},${u.username},${u.email},${u.tanggal || '-'},${u.sumber}\n`; });
    downloadFile('users-nullx.csv', csv, 'text/csv;charset=utf-8');
    showAlert('Berhasil', 'File users-nullx.csv ke-download.', 'success');
}

// ==================== PEMBAYARAN (DANA/GOPAY/QRIS) ====================
function renderAdminBayar() {
    document.getElementById('bayar-dana').value = pembayaran.dana || '';
    document.getElementById('bayar-gopay').value = pembayaran.gopay || '';
    document.getElementById('bayar-qris').value = pembayaran.qris || '';
    document.getElementById('bayar-menit').value = pembayaran.menit || 15;
}

function simpanPembayaran() {
    const dana = document.getElementById('bayar-dana').value.trim();
    const gopay = document.getElementById('bayar-gopay').value.trim();
    const qris = document.getElementById('bayar-qris').value.trim();
    const menit = parseInt(document.getElementById('bayar-menit').value) || 15;
    if (!dana && !gopay && !qris) { showAlert('Field Kosong', 'Isi minimal 1 metode (Dana/GoPay/QRIS).', 'warning'); return; }
    pembayaran = { dana, gopay, qris, menit: Math.min(120, Math.max(1, menit)) };
    saveAdminData();
    showAlert('Pembayaran Disimpan', 'Nomor Dana/GoPay/QRIS + batas ' + pembayaran.menit + ' menit langsung live di web user.', 'success');
}

// ==================== PAKET ====================
function tambahPaket() {
    const nama = document.getElementById('prod-nama').value.trim();
    const desc = document.getElementById('prod-desc').value.trim();
    const tierInput = document.getElementById('prod-tiers').value.trim();

    if (!nama || !desc) { showAlert('Field Kosong', 'Isi nama dan deskripsi paket.', 'warning'); return; }
    if (!tierInput) { showAlert('Tier Kosong', 'Isi minimal 1 tier. Format: 1 Day:5000, 7 Days:35000', 'warning'); return; }

    const tiers = tierInput.split(',').map(t => {
        const parts = t.split(':').map(s => s.trim());
        const label = parts[0];
        const harga = parseInt(parts[1]);
        return { label, days: 1, harga: harga || 0 };
    }).filter(t => t.label && t.harga > 0);

    if (tiers.length === 0) { showAlert('Tier Tidak Valid', 'Format tier salah. Contoh: 1 Day:5000, 7 Days:35000', 'error'); return; }

    paket.push({ id: Date.now(), nama, desc, tiers });
    saveAdminData();
    renderAdminProduk();
    document.getElementById('prod-nama').value = '';
    document.getElementById('prod-desc').value = '';
    document.getElementById('prod-tiers').value = '';
    showAlert('Paket Ditambahkan', nama + ' berhasil ditambahkan.', 'success');
}

function hapusPaket(id) {
    showConfirm('Hapus Paket', 'Paket ini akan dihapus permanen. Lanjutkan?', () => {
        paket = paket.filter(p => p.id !== id);
        saveAdminData();
        renderAdminProduk();
        showAlert('Paket Dihapus', 'Paket berhasil dihapus.', 'success');
    });
}

function renderAdminProduk() {
    const tbody = document.getElementById('admin-produk-body');
    if (!tbody) return;
    if (paket.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#737373; padding:2rem;">Belum ada paket.</td></tr>';
        return;
    }
    tbody.innerHTML = paket.map(p => `
        <tr>
            <td><strong>${p.nama}</strong></td>
            <td>${p.desc}</td>
            <td>
                ${p.tiers.map(t => `<div style="font-size:0.8rem; color:#a1a1aa;">${t.label} — Rp ${t.harga.toLocaleString('id-ID')}</div>`).join('')}
            </td>
            <td>
                <button onclick="editPaket(${p.id})" title="Edit Paket" style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.4rem 0.9rem;font-size:0.75rem;font-weight:600;color:#c4b5fd;background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(99,102,241,0.08));border:1px solid rgba(139,92,246,0.45);border-radius:8px;cursor:pointer;margin-right:0.5rem;transition:all 0.25s ease;box-shadow:0 0 0 0 rgba(139,92,246,0);">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    Edit
                </button>
                <button onclick="hapusPaket(${p.id})" title="Hapus Paket" style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.4rem 0.9rem;font-size:0.75rem;font-weight:600;color:#fca5a5;background:linear-gradient(135deg,rgba(239,68,68,0.12),rgba(220,38,38,0.06));border:1px solid rgba(239,68,68,0.35);border-radius:8px;cursor:pointer;transition:all 0.25s ease;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    Hapus
                </button>
            </td>
        </tr>
    `).join('');
}

function editPaket(id) {
    const p = paket.find(x => x.id === id);
    if (!p) return;
    showModal({
        title: 'Edit Paket',
        type: 'info',
        customHTML: `
            <div class="order-field"><label>NAMA PAKET</label><input type="text" id="ep-nama" value="${p.nama}"></div>
            <div class="order-field"><label>DESKRIPSI</label><input type="text" id="ep-desc" value="${p.desc}"></div>
            <div class="order-field"><label>TIER HARGA (per baris: Label — Harga)</label><textarea id="ep-tiers" rows="8" style="width:100%;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:8px;color:#ededed;padding:0.6rem;font-family:monospace;">${p.tiers.map(t => t.label + ' — ' + t.harga).join('\n')}</textarea></div>`,
        confirmText: 'Simpan',
        showCancel: true,
        cancelText: 'Batal',
        onConfirm: () => {
            const nama = document.getElementById('ep-nama').value.trim();
            const desc = document.getElementById('ep-desc').value.trim();
            const tiersRaw = document.getElementById('ep-tiers').value.trim();
            if (!nama || !desc) { showAlert('Field Kosong', 'Isi nama dan deskripsi.', 'warning'); return; }
            const tiers = tiersRaw.split('\n').map(line => {
                const parts = line.split('—').map(s => s.trim());
                return { label: parts[0], days: 1, harga: parseInt(parts[1]) || 0 };
            }).filter(t => t.label && t.harga > 0);
            if (tiers.length === 0) { showAlert('Tier Kosong', 'Isi minimal 1 tier.', 'warning'); return; }
            p.nama = nama; p.desc = desc; p.tiers = tiers;
            saveAdminData();
            renderAdminProduk();
            showAlert('Paket Diperbarui', nama + ' berhasil disimpan.', 'success');
        }
    });
}

// ==================== FAQ ====================
function tambahFAQ() {
    const tanya = document.getElementById('faq-pertanyaan').value.trim();
    const jawab = document.getElementById('faq-jawaban').value.trim();
    if (!tanya || !jawab) { showAlert('Field Kosong', 'Isi pertanyaan dan jawaban.', 'warning'); return; }
    faq.push({ id: Date.now(), tanya, jawab });
    saveAdminData();
    renderAdminFAQ();
    document.getElementById('faq-pertanyaan').value = '';
    document.getElementById('faq-jawaban').value = '';
    showAlert('FAQ Ditambahkan', 'FAQ berhasil ditambahkan.', 'success');
}

function hapusFAQ(id) {
    showConfirm('Hapus FAQ', 'FAQ ini akan dihapus permanen. Lanjutkan?', () => {
        faq = faq.filter(f => f.id !== id);
        saveAdminData();
        renderAdminFAQ();
        showAlert('FAQ Dihapus', 'FAQ berhasil dihapus.', 'success');
    });
}

function renderAdminFAQ() {
    const tbody = document.getElementById('admin-faq-body');
    if (!tbody) return;
    if (faq.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#737373; padding:2rem;">Belum ada FAQ.</td></tr>';
        return;
    }
    tbody.innerHTML = faq.map(f => `
        <tr>
            <td><strong>${f.tanya}</strong></td>
            <td>${f.jawab}</td>
            <td>
                <button onclick="editFAQ(${f.id})" title="Edit FAQ" style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.4rem 0.9rem;font-size:0.75rem;font-weight:600;color:#c4b5fd;background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(99,102,241,0.08));border:1px solid rgba(139,92,246,0.45);border-radius:8px;cursor:pointer;margin-right:0.5rem;transition:all 0.25s ease;box-shadow:0 0 0 0 rgba(139,92,246,0);">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    Edit
                </button>
                <button onclick="hapusFAQ(${f.id})" title="Hapus FAQ" style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.4rem 0.9rem;font-size:0.75rem;font-weight:600;color:#fca5a5;background:linear-gradient(135deg,rgba(239,68,68,0.12),rgba(220,38,38,0.06));border:1px solid rgba(239,68,68,0.35);border-radius:8px;cursor:pointer;transition:all 0.25s ease;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    Hapus
                </button>
            </td>
        </tr>
    `).join('');
}

function editFAQ(id) {
    const f = faq.find(x => x.id === id);
    if (!f) return;
    showModal({
        title: 'Edit FAQ',
        type: 'info',
        customHTML: `
            <div class="order-field"><label>PERTANYAAN</label><input type="text" id="ef-tanya" value="${f.tanya}"></div>
            <div class="order-field"><label>JAWABAN</label><textarea id="ef-jawab" rows="4" style="width:100%;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:8px;color:#ededed;padding:0.6rem;">${f.jawab}</textarea></div>`,
        confirmText: 'Simpan',
        showCancel: true,
        cancelText: 'Batal',
        onConfirm: () => {
            const tanya = document.getElementById('ef-tanya').value.trim();
            const jawab = document.getElementById('ef-jawab').value.trim();
            if (!tanya || !jawab) { showAlert('Field Kosong', 'Isi pertanyaan dan jawaban.', 'warning'); return; }
            f.tanya = tanya; f.jawab = jawab;
            saveAdminData();
            renderAdminFAQ();
            showAlert('FAQ Diperbarui', 'FAQ berhasil disimpan.', 'success');
        }
    });
}

// ==================== TRANSAKSI ====================
function renderAdminTransaksi() {
    const tbody = document.getElementById('admin-transaksi-body');
    if (!tbody) return;
    if (transaksi.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#737373; padding:2rem;">Belum ada transaksi.</td></tr>';
        return;
    }
    tbody.innerHTML = transaksi.map(t => `
        <tr>
            <td>${t.id}</td>
            <td><strong>${t.user}</strong></td>
            <td>${t.paket} - ${t.tier}<br><small style="opacity:0.7;">${t.method || 'QRIS'}</small></td>
            <td>${t.durasi} ${t.satuan}</td>
            <td>Rp ${(t.total || 0).toLocaleString('id-ID')}</td>
            <td>${t.tanggal}</td>
            <td>
                <select onchange="updateStatus('${t.id}', this.value)" style="padding:4px 8px; background:#0a0a0a; border:1px solid #1a1a1a; border-radius:6px; color:#ededed; font-size:0.75rem;">
                    <option value="Pending" ${t.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Sukses" ${t.status === 'Sukses' ? 'selected' : ''}>Sukses</option>
                    <option value="Batal" ${t.status === 'Batal' ? 'selected' : ''}>Batal</option>
                </select>
            </td>
            <td>
                <button class="btn-outline" style="padding:0.35rem 0.6rem; font-size:0.7rem; border-color:rgba(239,68,68,0.3); color:#ef4444;" onclick="hapusTransaksi('${t.id}')">Hapus</button>
            </td>
        </tr>
    `).join('');
}

function updateStatus(id, status) {
    const t = transaksi.find(x => x.id === id);
    if (t) { t.status = status; saveAdminData(); }
}

function hapusTransaksi(id) {
    showConfirm('Hapus Transaksi', 'Data transaksi ini akan dihapus permanen. Lanjutkan?', () => {
        transaksi = transaksi.filter(t => t.id !== id);
        saveAdminData();
        renderAdminTransaksi();
        showAlert('Transaksi Dihapus', 'Data transaksi berhasil dihapus.', 'success');
    });
}

// ==================== DISKON ====================
function tambahDiskon() {
    const kode = document.getElementById('diskon-kode').value.trim().toUpperCase();
    const persen = parseInt(document.getElementById('diskon-persen').value);
    if (!kode || !persen || persen <= 0 || persen > 100) {
        showAlert('Data Tidak Valid', 'Isi kode dan persen diskon (1-100).', 'warning');
        return;
    }
    if (diskon.find(d => d.kode === kode)) {
        showAlert('Kode Duplikat', 'Kode diskon ini sudah ada.', 'error');
        return;
    }
    diskon.push({ kode, persen });
    saveAdminData();
    renderAdminDiskon();
    document.getElementById('diskon-kode').value = '';
    document.getElementById('diskon-persen').value = '';
    showAlert('Diskon Ditambahkan', 'Kode ' + kode + ' sekarang aktif.', 'success');
}

function editDiskon(kode) {
    const d = diskon.find(x => x.kode === kode);
    if (!d) return;
    showModal({
        title: 'Edit Diskon',
        type: 'info',
        customHTML: `
            <div class="order-field"><label>KODE DISKON</label><input type="text" id="ed-kode" value="${d.kode}" style="text-transform:uppercase;"></div>
            <div class="order-field"><label>PERSEN (%)</label><input type="number" id="ed-persen" value="${d.persen}" min="1" max="100"></div>`,
        confirmText: 'Simpan',
        showCancel: true,
        cancelText: 'Batal',
        onConfirm: () => {
            const newKode = document.getElementById('ed-kode').value.trim().toUpperCase();
            const newPersen = parseInt(document.getElementById('ed-persen').value);
            if (!newKode || !newPersen || newPersen <= 0 || newPersen > 100) { showAlert('Data Tidak Valid', 'Isi kode dan persen (1-100).', 'warning'); return; }
            if (newKode !== kode && diskon.find(x => x.kode === newKode)) { showAlert('Kode Duplikat', 'Kode diskon ini sudah ada.', 'error'); return; }
            d.kode = newKode; d.persen = newPersen;
            saveAdminData();
            renderAdminDiskon();
            showAlert('Diskon Diperbarui', 'Kode ' + newKode + ' berhasil disimpan.', 'success');
        }
    });
}

function hapusDiskon(kode) {
    showConfirm('Hapus Diskon', 'Kode diskon ini akan dihapus. Lanjutkan?', () => {
        diskon = diskon.filter(d => d.kode !== kode);
        saveAdminData();
        renderAdminDiskon();
        showAlert('Diskon Dihapus', 'Kode diskon berhasil dihapus.', 'success');
    });
}

function renderAdminDiskon() {
    const tbody = document.getElementById('admin-diskon-body');
    if (!tbody) return;
    if (diskon.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#737373; padding:2rem;">Belum ada kode diskon.</td></tr>';
        return;
    }
    tbody.innerHTML = diskon.map(d => `
        <tr>
            <td><strong>${d.kode}</strong></td>
            <td>${d.persen}%</td>
            <td>
                <button onclick="editDiskon('${d.kode}')" title="Edit Diskon" style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.4rem 0.9rem;font-size:0.75rem;font-weight:600;color:#c4b5fd;background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(99,102,241,0.08));border:1px solid rgba(139,92,246,0.45);border-radius:8px;cursor:pointer;margin-right:0.5rem;transition:all 0.25s ease;box-shadow:0 0 0 0 rgba(139,92,246,0);">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    Edit
                </button>
                <button onclick="hapusDiskon('${d.kode}')" title="Hapus Diskon" style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.4rem 0.9rem;font-size:0.75rem;font-weight:600;color:#fca5a5;background:linear-gradient(135deg,rgba(239,68,68,0.12),rgba(220,38,38,0.06));border:1px solid rgba(239,68,68,0.35);border-radius:8px;cursor:pointer;transition:all 0.25s ease;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    Hapus
                </button>
            </td>
        </tr>
    `).join('');
}

// ==================== KONTAK ====================
function simpanKontak() {
    const wa = document.getElementById('kontak-wa').value.trim();
    const dc = document.getElementById('kontak-discord').value.trim();
    if (!wa || !dc) { showAlert('Field Kosong', 'Isi WhatsApp dan Discord terlebih dahulu.', 'warning'); return; }
    kontak = { wa, discord: dc };
    saveAdminData();
    showAlert('Kontak Disimpan', 'Kontak pembayaran berhasil diperbarui.', 'success');
}

function renderAdminKontak() {
    document.getElementById('kontak-wa').value = kontak.wa || '';
    document.getElementById('kontak-discord').value = kontak.discord || '';
}

// ==================== EXPORT EXCEL ====================
function exportToExcel() {
    if (transaksi.length === 0) { showAlert('Tidak Ada Data', 'Belum ada transaksi yang bisa dicetak.', 'warning'); return; }
    let csv = 'ID,User,Email,Paket,Tier,Durasi,Satuan,Subtotal,Diskon(%),Total,Tanggal,Status\n';
    transaksi.forEach(t => {
        csv += `${t.id},${t.user},${t.email || '-'},${t.paket},${t.tier},${t.durasi},${t.satuan},${t.subtotal || 0},${t.diskon || 0},${t.total || 0},${t.tanggal},${t.status}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'Transaksi_NULL-X.csv');
    link.click();
    showAlert('Export Berhasil', 'File CSV transaksi berhasil di-download.', 'success');
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
    showAdminPage('dashboard');
    await loadAdminShared();
    showAdminPage('dashboard');
    renderDashboard();
});