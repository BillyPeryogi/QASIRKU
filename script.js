/**
 * KUKAMI SUPERAPP v1.2 - PRODUCTION READY
 * Build Date: 2026-05-15
 * Perbaikan: Nama Rider (Kolom B), Sapaan (Kolom X), Anti-Kickback
 */

alert("KUKAMI Engine v1.2 Aktif!");

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzaiD8Bf1081aih6JvO28MBmWMkPttOsL0Yj8uXX8MeeTrygS8gebvJ6sfCVSR9ch6M/exec";

let curRider = {}, masterTarif = [], cart = [], curNomStr = "0";

// --- 1. UTILS ---
const getFingerprint = () => {
    let id = localStorage.getItem('kukami_fp');
    if (!id) {
        id = 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        localStorage.setItem('kukami_fp', id);
    }
    return id;
};

const formatRibuan = (v) => v.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const getAngka = (v) => Number(v.toString().replace(/\./g, ""));

const showLoading = (s) => { 
    const l = document.getElementById('loader'); 
    if(l) l.style.display = s ? 'flex' : 'none'; 
    // Auto-mati setelah 15 detik jika stuck
    if(s) setTimeout(() => { if(l) l.style.display = 'none'; }, 15000);
};

// --- 2. AUTH (LOGIN) ---
function prosesLogin() { 
    showLoading(true); 
    const user = document.getElementById('user').value;
    const pin = document.getElementById('pin').value;
    
    if(!user || !pin) { showLoading(false); return alert("Isi Nama & PIN!"); }

    const params = "?action=login" + 
                   "&user=" + encodeURIComponent(user) + 
                   "&pin=" + encodeURIComponent(pin) + 
                   "&fp=" + getFingerprint() + 
                   "&ua=" + encodeURIComponent(navigator.userAgent);

    const url = WEB_APP_URL + params;

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if(res.status === "success") { 
                        curRider = res.rider; // Mengambil ID (A) dan Nama (B)
                        localStorage.setItem('kukami_session', JSON.stringify(curRider)); 
                        alert("Berhasil! Selamat Datang " + curRider.nama);
                        initDashboard(); 
                    } else {
                        showLoading(false);
                        alert("Gagal: " + (res.message || "Akses Ditolak"));
                    }
                } catch(e) {
                    showLoading(false);
                    alert("Data Server Tidak Terbaca!");
                }
            } else {
                showLoading(false);
                alert("Koneksi Error: " + xhr.status);
            }
        }
    };
    xhr.send();
}

// --- 3. DASHBOARD ENGINE ---
function initDashboard() {
    // Paksa Pindah Layar (Anti-Kickback)
    const pLogin = document.getElementById('p-login');
    const pApp = document.getElementById('app-content');
    if(pLogin) pLogin.style.display = 'none';
    if(pApp) pApp.style.display = 'block';
    
    showLoading(true);

    const storedSession = JSON.parse(localStorage.getItem('kukami_session') || "{}");
    const targetId = curRider.id || storedSession.id;

    if(!targetId) {
        logout();
        return;
    }

    const url = WEB_APP_URL + "?action=getDashboard&id=" + encodeURIComponent(targetId);
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            showLoading(false);
            if (xhr.status == 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if(res.status === "error") {
                        alert(res.message);
                        return;
                    }
                    
                    renderUI(res);
                } catch(e) {
                    console.error("Render Error:", e);
                }
            }
        }
    };
    xhr.send();
}

// --- 4. RENDER UI DATA ---
function renderUI(res) {
    const elNama = document.getElementById('r-nama');
    if(elNama) {
        // Logika: Jika ada Sapaan di kolom X, tampilkan "Sapaan, NamaAsli"
        // Jika kolom X kosong, tampilkan NamaAsli saja.
        let teksHeader = "";
        if (res.sapaan && res.sapaan.trim() !== "") {
            teksHeader = res.sapaan + ", " + res.namaAsli;
        } else {
            teksHeader = res.namaAsli;
        }
        
        elNama.innerText = teksHeader;
    }
    
    // Matikan loading di akhir render
    showLoading(false);
    // Saldo (Kolom Q)
    const elSaldo = document.getElementById('r-saldo');
    if(elSaldo) {
        elSaldo.innerText = "Rp " + Number(res.saldo || 0).toLocaleString('id-ID');
    }

    // Foto (Kolom D)
    const elFoto = document.getElementById('r-foto');
    if(elFoto && res.foto) {
        elFoto.src = res.foto;
    }

    // Stats Hari (Kolom R & S)
    if(res.stats && res.stats.hari) {
        if(document.getElementById('h-total')) document.getElementById('h-total').innerText = res.stats.hari.total;
        if(document.getElementById('h-on')) document.getElementById('h-on').innerText = res.stats.hari.on;
        if(document.getElementById('h-off')) document.getElementById('h-off').innerText = res.stats.hari.off;
        
        // Ranking Hari (Kolom Z & AA)
        if(document.getElementById('rk-h-on')) document.getElementById('rk-h-on').innerText = "Peringkat: " + res.stats.hari.rank_on;
    }

    // Stats Bulan (Kolom T & U)
    if(res.stats && res.stats.bulan) {
        if(document.getElementById('b-total')) document.getElementById('b-total').innerText = res.stats.bulan.total;
        if(document.getElementById('b-on')) document.getElementById('b-on').innerText = res.stats.bulan.on;
        if(document.getElementById('b-off')) document.getElementById('b-off').innerText = res.stats.bulan.off;
    }

    // Riwayat & Tarif
    masterTarif = res.listTarif || [];
    if(typeof renderRiwayat === 'function') renderRiwayat(res.riwayat);
    
    // Kategori Chips
    let cats = [...new Set(masterTarif.map(x => x.kategori))];
    const catList = document.getElementById('cat-list');
    if (cats.length > 0 && catList) {
        catList.innerHTML = cats.map(cat => 
            `<div class="chip" onclick="renderGrid('${cat}')">${cat}</div>`).join('');
        if(typeof renderGrid === 'function') renderGrid(cats[0]);
    }
}

// --- 5. SYSTEM ---
function logout() {
    localStorage.removeItem('kukami_session');
    location.reload();
}

window.onload = function() { 
    const s = localStorage.getItem('kukami_session'); 
    if (s) { 
        curRider = JSON.parse(s); 
        initDashboard(); 
    } 
    
    // Auto-format input topup nominal
    const topupInput = document.getElementById('u-nom');
    if(topupInput) {
        topupInput.addEventListener('input', function() { 
            this.value = formatRibuan(this.value); 
        });
    }
};
