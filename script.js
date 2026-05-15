/** * KUKAMI ENGINE v2.3 - EMERGENCY FIX
 * ANTI-KICKBACK & SILENT ERROR HANDLING
 */

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwB8_0wPWBjqnCawghWBGXfLmGM3yEp855P4RFOKCtem8IQmzeDZRTe4Up7h9gXPpfQ/exec";

let curRider = {}, masterTarif = [], cart = [], curNomStr = "0";

// --- UTILS ---
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

// --- LOGIN ---
function prosesLogin() { 
    showLoading(true); 
    const user = document.getElementById('user').value;
    const pin = document.getElementById('pin').value;
    
    if(!user || !pin) { showLoading(false); return alert("Nama & PIN wajib diisi!"); }

    const url = WEB_APP_URL + "?action=login&user=" + encodeURIComponent(user) + "&pin=" + encodeURIComponent(pin) + "&fp=" + getFingerprint() + "&ua=" + encodeURIComponent(navigator.userAgent);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            try {
                var res = JSON.parse(xhr.responseText);
                if(res.status === "success") { 
                    curRider = res.rider; 
                    localStorage.setItem('kukami_session', JSON.stringify(curRider)); 
                    initDashboard(); 
                } else {
                    showLoading(false);
                    alert("Akses Ditolak: Periksa Nama & PIN");
                }
            } catch(e) {
                showLoading(false);
                alert("Server Error: Pastikan GAS Anyone & New Version");
            }
        }
    };
    xhr.send();
}

// --- DASHBOARD ENGINE (PASTI MASUK) ---
function initDashboard() {
    // 1. PINDAH HALAMAN DULUAN (KUNCI AGAR TIDAK BALIK LOGIN)
    document.getElementById('p-login').classList.remove('active');
    document.getElementById('p-login').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    showLoading(true);

    const session = JSON.parse(localStorage.getItem('kukami_session') || "{}");
    const targetId = curRider.id || session.id;

    if(!targetId) { logout(); return; }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", WEB_APP_URL + "?action=getDashboard&id=" + encodeURIComponent(targetId), true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            showLoading(false); // MATIKAN LOADING APAPUN YANG TERJADI
            if (xhr.status == 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    renderUI(res);
                } catch(e) {
                    console.log("Data diterima tapi gagal render: " + e);
                }
            }
        }
    };
    xhr.send();
}

// --- RENDER UI (DENGAN PENGAMAN TIAP BARIS) ---
function renderUI(res) {
    try {
        // Nama & Sapaan
        const nameEl = document.getElementById('r-nama');
        if(nameEl) nameEl.innerText = (res.sapaan ? res.sapaan + ", " : "") + (res.namaAsli || curRider.nama);

        // Saldo
        const saldoEl = document.getElementById('r-saldo');
        if(saldoEl) saldoEl.innerText = "Rp " + Number(res.saldo || 0).toLocaleString('id-ID');

        // Foto
        const fotoEl = document.getElementById('r-foto');
        if(fotoEl && res.foto) fotoEl.src = res.foto;

        // Stats Hari Ini
        if(res.stats && res.stats.hari) {
            document.getElementById('h-total').innerText = res.stats.hari.total || 0;
            document.getElementById('h-on').innerText = res.stats.hari.on || 0;
            document.getElementById('h-off').innerText = res.stats.hari.off || 0;
            
            // Badge Ranking
            const rkOn = document.getElementById('rk-h-on');
            if(rkOn && res.stats.hari.rank_on) {
                rkOn.innerHTML = `<span class="rank-badge bg-rank-hari-top">${res.stats.hari.rank_on}</span>`;
            }
        }

        // Stats Bulan Ini
        if(res.stats && res.stats.bulan) {
            document.getElementById('b-total').innerText = res.stats.bulan.total || 0;
            document.getElementById('b-on').innerText = res.stats.bulan.on || 0;
            document.getElementById('b-off').innerText = res.stats.bulan.off || 0;
        }

        // Tarif & Kategori
        masterTarif = res.listTarif || [];
        const catList = document.getElementById('cat-list');
        if(catList && masterTarif.length > 0) {
            let cats = [...new Set(masterTarif.map(x => x.kategori))];
            catList.innerHTML = cats.map(cat => `<div class="chip" onclick="renderGrid('${cat}')">${cat}</div>`).join('');
            renderGrid(cats[0]);
        }
        
        // Riwayat
        if(typeof renderRiwayat === 'function') renderRiwayat(res.riwayat);

    } catch (err) {
        console.error("Ada elemen HTML yang tidak ditemukan: ", err);
    }
}

// --- FUNGSI PENDUKUNG ---
function pressNum(v) {
    const input = document.getElementById('m-nom');
    if(v === 'C') { curNomStr = "0"; }
    else if(v === '⌫') { curNomStr = curNomStr.length > 1 ? curNomStr.slice(0, -1) : "0"; }
    else { curNomStr = curNomStr === "0" ? v : curNomStr + v; }
    input.value = "Rp " + formatRibuan(curNomStr);
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

function switchMainTab(tab) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('p-' + tab).classList.add('active');
    document.getElementById('n-' + tab).classList.add('active');
}

function setSubTab(n) {
    document.getElementById('f-manual').style.display = n === 1 ? 'block' : 'none';
    document.getElementById('f-tarif').style.display = n === 2 ? 'block' : 'none';
    document.getElementById('tb1').className = n === 1 ? 'tab-btn tab-active' : 'tab-btn tab-inactive';
    document.getElementById('tb2').className = n === 2 ? 'tab-btn tab-active' : 'tab-btn tab-inactive';
}

function logout() {
    localStorage.removeItem('kukami_session');
    location.reload();
}

window.onload = function() {
    const s = localStorage.getItem('kukami_session');
    if(s) {
        curRider = JSON.parse(s);
        initDashboard();
    }
};
