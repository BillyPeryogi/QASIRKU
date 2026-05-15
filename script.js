/**
 * KUKAMI ENGINE v2.2 - FINAL STABLE
 * Sinkronisasi Otomatis HTML + CSS + GAS
 */

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwB8_0wPWBjqnCawghWBGXfLmGM3yEp855P4RFOKCtem8IQmzeDZRTe4Up7h9gXPpfQ/exec";

let curRider = {}, masterTarif = [], cart = [], curNomStr = "0";

// --- 1. UTILS ---
const showLoading = (s) => { 
    const l = document.getElementById('loader'); 
    if(l) l.style.display = s ? 'flex' : 'none'; 
};

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

// --- 2. CORE LOGIN ---
function prosesLogin() { 
    showLoading(true); 
    const user = document.getElementById('user').value;
    const pin = document.getElementById('pin').value;
    
    if(!user || !pin) { showLoading(false); return alert("Isi Nama & PIN!"); }

    const url = WEB_APP_URL + "?action=login&user=" + encodeURIComponent(user) + "&pin=" + encodeURIComponent(pin) + "&fp=" + getFingerprint() + "&ua=" + encodeURIComponent(navigator.userAgent);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if(res.status === "success") { 
                        curRider = res.rider; 
                        localStorage.setItem('kukami_session', JSON.stringify(curRider)); 
                        initDashboard(); 
                    } else {
                        showLoading(false);
                        alert("Akses Ditolak: " + (res.message || "Nama/PIN Salah"));
                    }
                } catch(e) {
                    showLoading(false);
                    alert("Gagal memproses data server!");
                }
            } else {
                showLoading(false);
                alert("Koneksi Google Bermasalah");
            }
        }
    };
    xhr.send();
}

// --- 3. DASHBOARD ENGINE (ANTI-MUTER) ---
function initDashboard() {
    // Pindah layar duluan agar user tidak bosan melihat loader di login
    document.getElementById('p-login').classList.remove('active');
    document.getElementById('app-content').style.display = 'block';
    showLoading(true);

    const session = JSON.parse(localStorage.getItem('kukami_session') || "{}");
    const targetId = curRider.id || session.id;

    if(!targetId) { logout(); return; }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", WEB_APP_URL + "?action=getDashboard&id=" + encodeURIComponent(targetId), true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            showLoading(false);
            if (xhr.status == 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    renderDashboardUI(res);
                } catch(e) {
                    console.error("Gagal render data dashboard", e);
                }
            }
        }
    };
    xhr.send();
}

// --- 4. RENDER DATA KE HTML (Sesuai ID HTML Bos) ---
function renderDashboardUI(res) {
    // Nama & Sapaan (Kolom B & X)
    const elNama = document.getElementById('r-nama');
    if(elNama) {
        // Teks Sapaan (X) + Nama (B)
        const sapaan = res.sapaan ? res.sapaan + ", " : "";
        elNama.innerText = sapaan + res.namaAsli;
    }

    // Saldo (Kolom Q)
    if(document.getElementById('r-saldo')) {
        document.getElementById('r-saldo').innerText = "Rp " + Number(res.saldo || 0).toLocaleString('id-ID');
    }

    // Foto (Kolom D)
    if(res.foto && document.getElementById('r-foto')) {
        document.getElementById('r-foto').src = res.foto;
    }

    // Stats Hari Ini (R & S)
    if(res.stats && res.stats.hari) {
        document.getElementById('h-total').innerText = res.stats.hari.total || 0;
        document.getElementById('h-on').innerText = res.stats.hari.on || 0;
        document.getElementById('h-off').innerText = res.stats.hari.off || 0;
        
        // Peringkat (Z) - Gunakan class rank-badge dari CSS Bos
        const rkOn = document.getElementById('rk-h-on');
        if(rkOn && res.stats.hari.rank_on) {
            rkOn.innerHTML = `<span class="rank-badge bg-rank-hari-top">${res.stats.hari.rank_on}</span>`;
        }
    }

    // Stats Bulan Ini (T & U)
    if(res.stats && res.stats.bulan) {
        document.getElementById('b-total').innerText = res.stats.bulan.total || 0;
        document.getElementById('b-on').innerText = res.stats.bulan.on || 0;
        document.getElementById('b-off').innerText = res.stats.bulan.off || 0;
    }

    // List Tarif & Kategori
    masterTarif = res.listTarif || [];
    const catList = document.getElementById('cat-list');
    if(catList && masterTarif.length > 0) {
        let cats = [...new Set(masterTarif.map(x => x.kategori))];
        catList.innerHTML = cats.map(cat => 
            `<div class="chip" onclick="renderGrid('${cat}')">${cat}</div>`).join('');
        renderGrid(cats[0]);
    }
}

// --- 5. FUNGSI NAVIGASI & TAB ---
function switchMainTab(tab) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    if(tab === 'home') {
        document.getElementById('p-home').classList.add('active');
        document.getElementById('n-home').classList.add('active');
    } else {
        document.getElementById('p-riwayat').classList.add('active');
        document.getElementById('n-riwayat').classList.add('active');
    }
}

function setSubTab(n) {
    const fManual = document.getElementById('f-manual');
    const fTarif = document.getElementById('f-tarif');
    const tb1 = document.getElementById('tb1');
    const tb2 = document.getElementById('tb2');

    if(n === 1) {
        fManual.style.display = 'block';
        fTarif.style.display = 'none';
        tb1.className = 'tab-btn tab-active';
        tb2.className = 'tab-btn tab-inactive';
    } else {
        fManual.style.display = 'none';
        fTarif.style.display = 'block';
        tb1.className = 'tab-btn tab-inactive';
        tb2.className = 'tab-btn tab-active';
    }
}

function renderGrid(cat) {
    const grid = document.getElementById('grid-list');
    if(!grid) return;
    const filtered = masterTarif.filter(t => t.kategori === cat);
    grid.innerHTML = filtered.map(t => `
        <div class="service-card" onclick="addToCart('${t.layanan}', ${t.nominal}, ${t.potongan})">
            <b>${t.layanan}</b>
            <span>Rp ${Number(t.nominal).toLocaleString('id-ID')}</span>
        </div>
    `).join('');
}

function logout() {
    localStorage.removeItem('kukami_session');
    location.reload();
}

// --- 6. INITIAL LOAD ---
window.onload = function() {
    const s = localStorage.getItem('kukami_session');
    if(s) {
        curRider = JSON.parse(s);
        initDashboard();
    }
};

// Fungsi pendukung Kalkulator Manual
function pressNum(v) {
    const input = document.getElementById('m-nom');
    if(v === 'C') { curNomStr = "0"; }
    else if(v === '⌫') { curNomStr = curNomStr.length > 1 ? curNomStr.slice(0, -1) : "0"; }
    else { curNomStr = curNomStr === "0" ? v : curNomStr + v; }
    input.value = "Rp " + formatRibuan(curNomStr);
}
