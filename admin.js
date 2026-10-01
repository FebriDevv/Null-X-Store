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

// Escape HTML -> data admin (nama/deskripsi/FAQ) tidak bisa merusak markup atau diselipin script.
function esc(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatIDR(n) {
    return 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
}

// Ambil + trim nilai field di dalam modal form.
function val(id) {
    const el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
}

// Error validasi DI DALAM modal (bukan modal baru) -> input admin tidak hilang.
function formError(msg) {
    const el = document.getElementById('form-error');
    if (el) {
        el.textContent = msg;
        el.hidden = false;
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    console.warn('[validasi]', msg);
    return false;
}
function clearFormError() {
    const el = document.getElementById('form-error');
    if (el) { el.textContent = ''; el.hidden = true; }
}

function showModal(options) {
    const {
        title, message, type = 'info', confirmText = 'OK', onConfirm,
        showCancel = false, cancelText = 'Batal', customHTML = null,
        boxClass = '', showClose = false
    } = options;
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const isForm = boxClass.indexOf('form-modal') !== -1;
    const body = customHTML || (typeof message === 'string' ? esc(message) : (message || ''));

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box ${boxClass}">
            ${showClose ? '<button type="button" class="modal-x" data-action="x" aria-label="Tutup">&times;</button>' : ''}
            <div class="modal-icon ${type}">${ICONS[type]}</div>
            <h3 class="modal-title">${esc(title)}</h3>
            <div class="modal-message">${body}</div>
            <div class="modal-actions">
                ${showCancel ? `<button type="button" class="modal-btn modal-btn-secondary" data-action="cancel">${esc(cancelText)}</button>` : ''}
                <button type="button" class="modal-btn modal-btn-primary" data-action="confirm">${esc(confirmText)}</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));

    let done = false;
    const close = () => {
        if (done) return;
        done = true;
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 250);
        document.removeEventListener('keydown', onKey);
    };

    // onConfirm boleh return:
    //   false            -> modal TETAP terbuka (validasi gagal, input tidak hilang)
    //   { alert: {...} } -> tutup modal, lalu tampilkan notifikasi sukses
    const submit = () => {
        if (done) return;
        let result;
        try { result = onConfirm ? onConfirm() : undefined; }
        catch (err) {
            console.error(err);
            if (overlay.querySelector('#form-error')) formError('Terjadi kesalahan saat menyimpan. Cek console browser.');
            else showAlert('Gagal Menyimpan', String(err && err.message || err), 'error');
            return;
        }
        if (result === false) return;
        close();
        if (result && typeof result === 'object' && result.alert) {
            const a = result.alert;
            showAlert(a.title, a.message, a.type || 'success');
        }
    };

    const onKey = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (isForm && e.key === 'Enter' && !e.shiftKey) {
            const tag = (e.target.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea') { e.preventDefault(); submit(); }
        }
    };
    document.addEventListener('keydown', onKey);

    overlay.querySelector('[data-action="confirm"]').onclick = submit;
    const cancelBtn = overlay.querySelector('[data-action="cancel"]');
    if (cancelBtn) cancelBtn.onclick = close;
    const xBtn = overlay.querySelector('[data-action="x"]');
    if (xBtn) xBtn.onclick = close;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    if (isForm) {
        setTimeout(() => {
            const first = overlay.querySelector('.modal-box input, .modal-box textarea');
            if (first) first.focus();
        }, 60);
    }
    return { close, overlay };
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
// Tambah & Edit sekarang pake SATU form yang sama (openPaketForm) supaya format
// tier tidak lagi bentrok (dulu tambah pakai "Label:5000, ..." tapi edit pakai "Label — 5000",
// sehingga desc + features + days ikut hilang tiap kali edit).
function guessDays(label) {
    const m = String(label || '').toLowerCase().match(/(\d+)\s*(day|hari|aob|tahun|year|month|bulan|week|minggu)/);
    if (m) {
        const n = parseInt(m[1], 10);
        const unit = m[2];
        if (unit === 'aob' || unit === 'tahun' || unit === 'year') return 365;
        if (unit === 'month' || unit === 'bulan') return n * 30;
        if (unit === 'week' || unit === 'minggu') return n * 7;
        return n;
    }
    const first = String(label || '').match(/(\d+)/);
    return first ? parseInt(first[1], 10) : 1;
}

const ICON_EDIT = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
const ICON_TRASH = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';
const ICON_PLUS = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';

// Argumen di-encode -> aman walau kode diskon/data lama bawa karakter aneh,
// dan tidak bentrok sama tanda kutip di atribut onclick.
function encArg(a) { return encodeURIComponent(String(a)); }
function decArg(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }

function rowActions(editFn, delFn, arg) {
    const enc = encArg(arg);
    const edit = editFn
        ? `<button type="button" class="row-btn row-btn-edit" onclick="${editFn}('${enc}')" title="Edit">${ICON_EDIT}<span>Edit</span></button>`
        : '';
    return `
        <div class="row-actions">
            ${edit}
            <button type="button" class="row-btn row-btn-del" onclick="${delFn}('${enc}')" title="Hapus">${ICON_TRASH}<span>Hapus</span></button>
        </div>`;
}

function emptyRow(colspan, msg) {
    return `<tr><td colspan="${colspan}"><div class="table-empty">${esc(msg)}</div></td></tr>`;
}

function tierRowHTML(t, i) {
    const label = t.label || '';
    const days = t.days || guessDays(label);
    return `
    <div class="tier-row" data-i="${i}">
        <div class="tier-row-head">
            <span class="tier-num t-num">${i + 1}</span>
            <input type="text" class="t-label t-row-label" value="${esc(label)}" placeholder="Label (mis. 1 Day)" oninput="syncTierDays(this)">
            <input type="number" class="t-days" value="${esc(days)}" min="1" max="3650" title="Jumlah hari" placeholder="Hari">
            <div class="t-price-wrap">
                <span>Rp</span>
                <input type="number" class="t-harga" value="${esc(t.harga || 0)}" min="0" step="1000" placeholder="Harga">
            </div>
            <button type="button" class="t-del" onclick="hapusTierBar(this)" title="Hapus tier">&times;</button>
        </div>
        <input type="text" class="t-desc" value="${esc(t.desc || '')}" placeholder="Deskripsi tier (opsional, tampil di form order)">
        <textarea class="t-feat tier-features-input" rows="2" placeholder="Fitur, satu per baris (opsional)">${esc((t.features || []).join('\n'))}</textarea>
    </div>`;
}

function renderTierRows(tiers) {
    const wrap = document.getElementById('tier-list');
    if (!wrap) return;
    wrap.innerHTML = tiers.map((t, i) => tierRowHTML(t, i)).join('');
    updateTierFoot();
}

function tambahTierBar() {
    const wrap = document.getElementById('tier-list');
    if (!wrap) return;
    const n = wrap.children.length;
    const div = document.createElement('div');
    div.innerHTML = tierRowHTML({ label: '', days: 1, harga: 0 }, n);
    const row = div.firstElementChild;
    wrap.appendChild(row);
    updateTierFoot();
    const first = row.querySelector('.t-label');
    if (first) first.focus();
}

function hapusTierBar(btn) {
    const wrap = document.getElementById('tier-list');
    if (!wrap) return;
    if (wrap.children.length <= 1) { formError('Minimal harus ada 1 tier harga.'); return; }
    btn.closest('.tier-row').remove();
    updateTierFoot();
}

// Label "7 Days" -> kolom hari ikut terisi 7 (dulu selalu hardcode 1).
function syncTierDays(labelInput) {
    const days = labelInput.closest('.tier-row').querySelector('.t-days');
    if (days && document.activeElement !== days) days.value = guessDays(labelInput.value);
}

function updateTierFoot() {
    const wrap = document.getElementById('tier-list');
    if (!wrap) return;
    wrap.querySelectorAll('.tier-num').forEach((el, i) => el.textContent = i + 1);
    const c = document.getElementById('tier-count');
    if (c) c.textContent = wrap.children.length;
}

function collectTiers() {
    const wrap = document.getElementById('tier-list');
    if (!wrap) return [];
    const out = [];
    wrap.querySelectorAll('.tier-row').forEach(row => {
        const label = row.querySelector('.t-label').value.trim();
        const harga = parseInt(row.querySelector('.t-harga').value, 10) || 0;
        if (!label || harga <= 0) return;
        const daysRaw = parseInt(row.querySelector('.t-days').value, 10);
        out.push({
            label,
            days: daysRaw > 0 ? daysRaw : guessDays(label),
            harga,
            desc: row.querySelector('.t-desc').value.trim(),
            features: row.querySelector('.t-feat').value.split('\n').map(s => s.trim()).filter(Boolean)
        });
    });
    return out;
}

function openPaketForm(id) {
    const isEdit = id !== null && id !== undefined;
    const p = isEdit ? paket.find(x => x.id === id) : null;
    if (isEdit && !p) return;
    const startTiers = isEdit && p.tiers.length ? p.tiers : [{ label: '1 Day', days: 1, harga: 5000 }];

    showModal({
        title: isEdit ? 'Edit Paket' : 'Tambah Paket',
        type: 'info',
        boxClass: 'form-modal',
        showClose: true,
        showCancel: true,
        cancelText: 'Batal',
        confirmText: isEdit ? 'Simpan Perubahan' : 'Tambah Paket',
        customHTML: `
            <div class="form-error" id="form-error" hidden></div>
            <div class="order-grid-2">
                <div class="order-field">
                    <label>Nama Paket</label>
                    <input type="text" id="fp-nama" value="${esc(p ? p.nama : '')}" placeholder="Contoh: EXTERNAL" maxlength="40" oninput="clearFormError()">
                </div>
                <div class="order-field">
                    <label>Deskripsi</label>
                    <input type="text" id="fp-desc" value="${esc(p ? p.desc : '')}" placeholder="Paket dasar untuk kebutuhan PC." maxlength="140" oninput="clearFormError()">
                </div>
            </div>

            <div class="tier-editor">
                <div class="tier-editor-head">
                    <span>Tier Harga <em id="tier-count">0</em></span>
                    <button type="button" class="tier-add" onclick="tambahTierBar()">${ICON_PLUS} Tambah Tier</button>
                </div>
                <div class="tier-cols"><span>Label</span><span>Hari</span><span>Harga</span><span></span></div>
                <div id="tier-list"></div>
            </div>`,
        onConfirm: () => {
            const nama = val('fp-nama');
            const desc = val('fp-desc');
            const tiers = collectTiers();

            if (!nama) return formError('Nama paket wajib diisi.');
            if (!desc) return formError('Deskripsi paket wajib diisi.');
            if (paket.some(x => x.nama.toLowerCase() === nama.toLowerCase() && x.id !== (p ? p.id : -1)))
                return formError('Sudah ada paket bernama "' + nama + '".');
            if (!tiers.length) return formError('Minimal 1 tier yang punya label + harga di atas 0.');

            if (isEdit) {
                p.nama = nama; p.desc = desc; p.tiers = tiers;
            } else {
                paket.push({ id: Date.now(), nama, desc, tiers });
            }
            saveAdminData();
            renderAdminProduk();
            renderDashboard();
            return {
                alert: {
                    title: isEdit ? 'Paket Diperbarui' : 'Paket Ditambahkan',
                    message: nama + ' tersimpan dengan ' + tiers.length + ' tier, langsung live di web user.',
                    type: 'success'
                }
            };
        }
    });

    renderTierRows(startTiers);
}

function tambahPaket() { openPaketForm(null); }
function editPaket(id) { openPaketForm(Number(decArg(id))); }

function hapusPaket(id) {
    id = Number(decArg(id));
    const p = paket.find(x => x.id === id);
    if (!p) return;
    const dipakai = transaksi.filter(t => t.paket === p.nama).length;
    showConfirm('Hapus Paket', '"' + p.nama + '" akan dihapus permanen' +
        (dipakai ? ', termasuk ' + dipakai + ' transaksi yang sudah tercatat.' : '.') + ' Lanjutkan?', () => {
        paket = paket.filter(x => x.id !== id);
        saveAdminData();
        renderAdminProduk();
        renderDashboard();
        return { alert: { title: 'Paket Dihapus', message: p.nama + ' berhasil dihapus.', type: 'success' } };
    });
}

function renderAdminProduk() {
    const tbody = document.getElementById('admin-produk-body');
    if (!tbody) return;
    const c = document.getElementById('produk-count');
    if (c) c.textContent = paket.length + ' paket';
    if (paket.length === 0) {
        tbody.innerHTML = emptyRow(4, 'Belum ada paket. Klik "Tambah Paket" untuk membuat paket pertama.');
        return;
    }
    tbody.innerHTML = paket.map(p => {
        const termurah = p.tiers.reduce((a, b) => (!a || b.harga < a.harga) ? b : a, null);
        return `
        <tr>
            <td><strong>${esc(p.nama)}</strong></td>
            <td class="cell-desc">${esc(p.desc)}</td>
            <td>
                <div class="tier-cell">
                    ${p.tiers.map(t => `<div class="tier-cell-row"><span>${esc(t.label)}</span><b>Rp ${t.harga.toLocaleString('id-ID')}</b></div>`).join('')}
                </div>
                ${termurah ? `<div class="tier-cell-foot">Mulai dari <b>Rp ${termurah.harga.toLocaleString('id-ID')}</b></div>` : ''}
            </td>
            <td>${rowActions('editPaket', 'hapusPaket', p.id)}</td>
        </tr>`;
    }).join('');
}

// ==================== FAQ ====================
// Sama kayak paket: satu form untuk Tambah & Edit (dulu cuma Edit yg modal,
// tambah masih form mentah + jawaban di-render tanpa escape).
function openFAQForm(id) {
    const isEdit = id !== null && id !== undefined;
    const f = isEdit ? faq.find(x => x.id === id) : null;
    if (isEdit && !f) return;

    showModal({
        title: isEdit ? 'Edit FAQ' : 'Tambah FAQ',
        type: 'info',
        boxClass: 'form-modal',
        showClose: true,
        showCancel: true,
        cancelText: 'Batal',
        confirmText: isEdit ? 'Simpan Perubahan' : 'Tambah FAQ',
        customHTML: `
            <div class="form-error" id="form-error" hidden></div>
            <div class="order-field">
                <label>Pertanyaan</label>
                <input type="text" id="ff-tanya" value="${esc(f ? f.tanya : '')}" placeholder="Bagaimana cara order?" maxlength="160" oninput="clearFormError()">
            </div>
            <div class="order-field">
                <label>Jawaban</label>
                <textarea id="ff-jawab" rows="4" placeholder="Pilih paket, atur durasi, lalu klik Bayar Sekarang." oninput="clearFormError()">${esc(f ? f.jawab : '')}</textarea>
            </div>
            <div class="field-hint">Jawaban tampil di halaman user. Boleh panjang, enter = baris baru.</div>`,
        onConfirm: () => {
            const tanya = val('ff-tanya');
            const jawab = val('ff-jawab');
            if (!tanya) return formError('Pertanyaan wajib diisi.');
            if (!jawab) return formError('Jawaban wajib diisi.');
            if (faq.some(x => x.tanya.toLowerCase() === tanya.toLowerCase() && x.id !== (f ? f.id : -1)))
                return formError('Pertanyaan ini sudah ada di daftar FAQ.');

            if (isEdit) { f.tanya = tanya; f.jawab = jawab; }
            else faq.push({ id: Date.now(), tanya, jawab });
            saveAdminData();
            renderAdminFAQ();
            return {
                alert: {
                    title: isEdit ? 'FAQ Diperbarui' : 'FAQ Ditambahkan',
                    message: isEdit ? 'Perubahan FAQ langsung tampil di web user.' : 'FAQ baru sudah live di web user.',
                    type: 'success'
                }
            };
        }
    });
}

function tambahFAQ() { openFAQForm(null); }
function editFAQ(id) { openFAQForm(Number(decArg(id))); }

function hapusFAQ(id) {
    id = Number(decArg(id));
    const f = faq.find(x => x.id === id);
    if (!f) return;
    showConfirm('Hapus FAQ', '"' + f.tanya.slice(0, 60) + '" akan dihapus permanen. Lanjutkan?', () => {
        faq = faq.filter(x => x.id !== id);
        saveAdminData();
        renderAdminFAQ();
        return { alert: { title: 'FAQ Dihapus', message: 'FAQ berhasil dihapus.', type: 'success' } };
    });
}

function renderAdminFAQ() {
    const tbody = document.getElementById('admin-faq-body');
    if (!tbody) return;
    const c = document.getElementById('faq-count');
    if (c) c.textContent = faq.length + ' FAQ';
    if (faq.length === 0) {
        tbody.innerHTML = emptyRow(3, 'Belum ada FAQ. Klik "Tambah" untuk menambah pertanyaan.');
        return;
    }
    tbody.innerHTML = faq.map(f => `
        <tr>
            <td><strong>${esc(f.tanya)}</strong></td>
            <td class="cell-desc">${esc(f.jawab)}</td>
            <td>${rowActions('editFAQ', 'hapusFAQ', f.id)}</td>
        </tr>
    `).join('');
}

// ==================== TRANSAKSI ====================
const STATUS_LIST = [
    { v: 'Pending', cls: 'badge-warning' },
    { v: 'Sukses', cls: 'badge-success' },
    { v: 'Batal', cls: 'badge-danger' }
];

function renderAdminTransaksi() {
    const tbody = document.getElementById('admin-transaksi-body');
    if (!tbody) return;
    if (transaksi.length === 0) {
        tbody.innerHTML = emptyRow(8, 'Belum ada transaksi. Order dari web user akan muncul di sini.');
        return;
    }
    // Yang terbaru di atas
    const urut = transaksi.slice().reverse();
    tbody.innerHTML = urut.map(t => {
        const st = STATUS_LIST.find(s => s.v === t.status) || STATUS_LIST[0];
        return `
        <tr>
            <td class="cell-mono">${esc(t.id)}</td>
            <td><strong>${esc(t.user)}</strong>${t.email ? `<br><small class="cell-sub">${esc(t.email)}</small>` : ''}</td>
            <td>${esc(t.paket)} — ${esc(t.tier)}<br><small class="cell-sub">${esc(t.method || 'QRIS')}</small></td>
            <td>${esc(t.durasi)} ${esc(t.satuan || '')}</td>
            <td class="cell-price">Rp ${(t.total || 0).toLocaleString('id-ID')}</td>
            <td class="cell-sub">${esc(t.tanggal)}</td>
            <td>
                <select class="status-select" onchange="updateStatus('${encArg(t.id)}', this.value)">
                    ${STATUS_LIST.map(s => `<option value="${s.v}" ${t.status === s.v ? 'selected' : ''}>${s.v}</option>`).join('')}
                </select>
                <span class="badge-status ${st.cls}">${esc(t.status || 'Pending')}</span>
            </td>
            <td>${rowActions('', 'hapusTransaksi', t.id)}</td>
        </tr>`;
    }).join('');
}

function updateStatus(id, status) {
    id = decArg(id);
    const t = transaksi.find(x => x.id === id);
    if (!t || t.status === status) return;
    t.status = status;
    saveAdminData();
    renderAdminTransaksi();
    renderDashboard();
    showAlert('Status Diperbarui', t.id + ' -> ' + status + '.', 'success');
}

function hapusTransaksi(id) {
    id = decArg(id);
    const t = transaksi.find(x => x.id === id);
    if (!t) return;
    showConfirm('Hapus Transaksi', 'Transaksi ' + t.id + ' atas nama "' + t.user + '" akan dihapus permanen. Lanjutkan?', () => {
        transaksi = transaksi.filter(x => x.id !== id);
        saveAdminData();
        renderAdminTransaksi();
        renderDashboard();
        return { alert: { title: 'Transaksi Dihapus', message: 'Data transaksi berhasil dihapus.', type: 'success' } };
    });
}

// ==================== DISKON ====================
// Satu form untuk Tambah & Edit. Kode otomatis jadi HURUF BESAR + divalidasi,
// bukan cuma dicek pas user klik Simpan.
function openDiskonForm(kode) {
    const isEdit = kode !== null && kode !== undefined && kode !== '';
    const d = isEdit ? diskon.find(x => x.kode === kode) : null;
    if (isEdit && !d) return;

    showModal({
        title: isEdit ? 'Edit Diskon' : 'Tambah Diskon',
        type: 'info',
        boxClass: 'form-modal form-modal-sm',
        showClose: true,
        showCancel: true,
        cancelText: 'Batal',
        confirmText: isEdit ? 'Simpan Perubahan' : 'Tambah Diskon',
        customHTML: `
            <div class="form-error" id="form-error" hidden></div>
            <div class="order-field">
                <label>Kode Diskon</label>
                <input type="text" id="fd-kode" value="${esc(d ? d.kode : '')}" placeholder="HEMAT50" maxlength="20"
                       style="text-transform:uppercase;" oninput="this.value=this.value.toUpperCase()" autocomplete="off">
            </div>
            <div class="order-field">
                <label>Potongan (%)</label>
                <input type="number" id="fd-persen" value="${esc(d ? d.persen : 10)}" min="1" max="100" oninput="clearFormError()">
            </div>
            <div class="field-hint">User mengetik kode ini di form order. Potongan dihitung dari harga tier (bukan dikali jumlah).</div>`,
        onConfirm: () => {
            const newKode = val('fd-kode').toUpperCase();
            const newPersen = parseInt(val('fd-persen'), 10);

            if (!newKode) return formError('Kode diskon wajib diisi.');
            if (!/^[A-Z0-9_-]{2,20}$/.test(newKode))
                return formError('Kode hanya boleh huruf, angka, - atau _ (2-20 karakter).');
            if (!newPersen || newPersen < 1 || newPersen > 100)
                return formError('Potongan harus antara 1 sampai 100.');
            if (diskon.some(x => x.kode === newKode && x !== d))
                return formError('Kode "' + newKode + '" sudah dipakai diskon lain.');

            if (isEdit) { d.kode = newKode; d.persen = newPersen; }
            else diskon.push({ kode: newKode, persen: newPersen });
            saveAdminData();
            renderAdminDiskon();
            return {
                alert: {
                    title: isEdit ? 'Diskon Diperbarui' : 'Diskon Ditambahkan',
                    message: 'Kode ' + newKode + ' (' + newPersen + '%) sekarang aktif di web user.',
                    type: 'success'
                }
            };
        }
    });
}

function tambahDiskon() { openDiskonForm(null); }
function editDiskon(kode) { openDiskonForm(decArg(kode)); }

function hapusDiskon(kode) {
    kode = decArg(kode);
    const d = diskon.find(x => x.kode === kode);
    if (!d) return;
    showConfirm('Hapus Diskon', 'Kode ' + d.kode + ' (' + d.persen + '%) akan dihapus dan tidak bisa dipakai user lagi. Lanjutkan?', () => {
        diskon = diskon.filter(x => x.kode !== kode);
        saveAdminData();
        renderAdminDiskon();
        return { alert: { title: 'Diskon Dihapus', message: 'Kode ' + d.kode + ' berhasil dihapus.', type: 'success' } };
    });
}

function renderAdminDiskon() {
    const tbody = document.getElementById('admin-diskon-body');
    if (!tbody) return;
    const c = document.getElementById('diskon-count');
    if (c) c.textContent = diskon.length + ' kode';
    if (diskon.length === 0) {
        tbody.innerHTML = emptyRow(3, 'Belum ada kode diskon. Klik "Tambah" untuk membuat kode promo.');
        return;
    }
    tbody.innerHTML = diskon.map(d => {
        // Contoh: Rp 120.000 -> hemat Rp 12.000
        const termurah = paket.reduce((min, p) => {
            const h = p.tiers.reduce((a, t) => Math.min(a, t.harga), Infinity);
            return Math.min(min, h);
        }, Infinity);
        const hemat = isFinite(termurah) ? termurah * d.persen / 100 : 0;
        return `
        <tr>
            <td><strong class="kode-chip">${esc(d.kode)}</strong></td>
            <td class="cell-price">${d.persen}%${hemat ? `<br><small class="cell-sub">Hemat ${formatIDR(hemat)} dari ${formatIDR(termurah)}</small>` : ''}</td>
            <td>${rowActions('editDiskon', 'hapusDiskon', d.kode)}</td>
        </tr>`;
    }).join('');
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