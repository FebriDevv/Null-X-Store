// ==================== BACKEND FIREBASE (auth + database online) ====================
// Dipakai script.js (user) dan admin.js (admin). Prioritas: Firebase > Sheets > lokal.
// Cara aktifin (sekali aja, ~5 menit):
// 1. console.firebase.google.com > Add project (bebas nama, Analytics OFF juga bisa) > Create
// 2. Build > Authentication > Get started > Sign-in method > Email/Password > Enable > Save
// 3. Build > Firestore Database > Create database > Start in production mode > Enable
//    - Tab Rules > ganti isinya dengan rules di bawah > Publish:
//      rules_version = '2';
//      service cloud.firestore {
//        match /databases/{database}/documents {
//          match /{document=**} { allow read, write: if true; }
//        }
//      }
// 4. Project Overview > </> (Add web app) > daftarin nama bebas > copy apiKey dan projectId
// 5. Paste ke FIREBASE_API_KEY + FIREBASE_PROJECT_ID di bawah > push GitHub > Netlify.
// Database keliatan di console Firebase (Authentication = user login, Firestore = data users+toko).
// Lupa password = link reset resmi dikirim ke Gmail user (otomatis, tanpa setting SMTP).

const FIREBASE_API_KEY = 'AIzaSyBCnfd-pG00D1fxfD0R8gfqwy2LNp_ZIEY';
const FIREBASE_PROJECT_ID = 'null-x';

function fbOn() {
    return FIREBASE_API_KEY !== '' && FIREBASE_PROJECT_ID !== '';
}

async function fbAuthReq(path, body) {
    const res = await fetch('https://identitytoolkit.googleapis.com/v1/' + path + '?key=' + FIREBASE_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
        const code = (j.error && j.error.message) || 'UNKNOWN';
        throw new Error(fbPesan(code));
    }
    return j;
}

function fbPesan(code) {
    if (code.includes('EMAIL_EXISTS')) return 'Email sudah terdaftar.';
    if (code.includes('EMAIL_NOT_FOUND')) return 'Email belum terdaftar. Silakan daftar dulu.';
    if (code.includes('INVALID_PASSWORD') || code.includes('INVALID_LOGIN_CREDENTIALS')) return 'Password salah.';
    if (code.includes('WEAK_PASSWORD')) return 'Password minimal 6 karakter.';
    if (code.includes('INVALID_EMAIL')) return 'Format email salah.';
    if (code.includes('TOO_MANY_ATTEMPTS')) return 'Terlalu banyak percobaan. Coba lagi nanti.';
    return 'Firebase: ' + code;
}

function fsDocId(email) { return email.trim().toLowerCase(); }

async function fbRegister(email, username, password) {
    await fbAuthReq('accounts:signUp', { email, password, returnSecureToken: true });
    await fsPutUser(email, username);
    return { success: true, message: 'Akun tersimpan di database Firebase.', user: { email, username } };
}

async function fbLogin(email, password) {
    await fbAuthReq('accounts:signInWithPassword', { email, password, returnSecureToken: true });
    let username = email.split('@')[0];
    try {
        const u = await fsGetUser(email);
        if (u && u.username) username = u.username;
    } catch (e) { /* user lama tanpa doc, pakai default */ }
    return { success: true, message: 'Login berhasil.', user: { email, username } };
}

function fbReset(email) {
    return fbAuthReq('accounts:sendOobCode', { requestType: 'PASSWORD_RESET', email });
}

function fsBase() {
    return 'https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT_ID + '/databases/(default)/documents';
}

async function fsPutUser(email, username) {
    const res = await fetch(fsBase() + '/users/' + encodeURIComponent(fsDocId(email)) + '?key=' + FIREBASE_API_KEY, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: {
            email: { stringValue: email },
            username: { stringValue: username },
            tanggal: { stringValue: new Date().toLocaleString('id-ID') }
        }})
    });
    if (!res.ok) throw new Error('Gagal simpan user.');
}

async function fsGetUser(email) {
    const res = await fetch(fsBase() + '/users/' + encodeURIComponent(fsDocId(email)) + '?key=' + FIREBASE_API_KEY);
    if (!res.ok) return null;
    const j = await res.json();
    const f = j.fields || {};
    return { email: (f.email || {}).stringValue || email, username: (f.username || {}).stringValue || '', tanggal: (f.tanggal || {}).stringValue || '-' };
}

async function fsListUsers() {
    const res = await fetch(fsBase() + '/users?pageSize=200&key=' + FIREBASE_API_KEY);
    if (!res.ok) throw new Error('Gagal baca users.');
    const j = await res.json();
    return (j.documents || []).map(d => {
        const f = d.fields || {};
        return {
            email: (f.email || {}).stringValue || '',
            username: (f.username || {}).stringValue || '',
            tanggal: (f.tanggal || {}).stringValue || '-'
        };
    }).filter(u => u.email);
}

async function fsGetData() {
    const res = await fetch(fsBase() + '/app/config?key=' + FIREBASE_API_KEY);
    if (!res.ok) return null;
    const j = await res.json();
    try { return JSON.parse((((j.fields || {}).data || {}).stringValue) || 'null'); }
    catch (e) { return null; }
}

async function fsSaveSnapshot(snap) {
    const res = await fetch(fsBase() + '/app/config?key=' + FIREBASE_API_KEY, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { data: { stringValue: JSON.stringify(snap) } } })
    });
    if (!res.ok) throw new Error('Gagal simpan data.');
}

function fsSnapshot() {
    return {
        paket: (typeof paket !== 'undefined') ? paket : [],
        faq: (typeof faq !== 'undefined') ? faq : [],
        transaksi: (typeof transaksi !== 'undefined') ? transaksi : [],
        diskon: (typeof diskon !== 'undefined') ? diskon : [],
        kontak: (typeof kontak !== 'undefined') ? kontak : {}
    };
}
