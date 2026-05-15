// DEBUG: Jika muncul alert ini, berarti koneksi GitHub ke APK AMAN
alert("QASIRKU Engine v1.1 Dimuat!");

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwtwVwGsKA4edGm6Cl-2Qnyxsk4jLyNjQICecbUhmIqkf92-oEK-L82EcsW4jSaxrWC/exec";

let curRider = {}, masterTarif = [], cart = [], curNomStr = "0";

// --- UTILS ---
const getFingerprint = () => localStorage.getItem('kukami_fp') || (() => { 
    let id = 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase(); 
    localStorage.setItem('kukami_fp', id); return id; 
})();

const formatRibuan = (v) => v.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const getAngka = (v) => Number(v.toString().replace(/\./g, ""));

const showLoading = (s) => { 
    const l = document.getElementById('loader'); 
    if(l) l.style.display = s ? 'flex' : 'none'; 
    // Auto-stop loading setelah 12 detik agar tidak muter selamanya jika sinyal buruk
    if(s) setTimeout(() => { if(l) l.style.display = 'none'; }, 12000);
};

const toast = (m) => { 
    const c = document.getElementById('toast-container'); 
    if(c) { 
        const d = document.createElement('div'); 
        d.className = 'toast'; d.innerHTML = m; 
        c.appendChild(d); setTimeout(() => d.remove(), 2500); 
    } 
};

// --- AUTH ---
function prosesLogin() { 
    showLoading(true); 
    const user = document.getElementById('user').value;
    const pin = document.getElementById('pin').value;
    
    if(!user || !pin) { showLoading(false); return alert("Isi Nama & PIN!"); }

    const url = `${WEB_APP_URL}?action=login&user=${encodeURIComponent(user)}&pin=${encodeURIComponent(pin)}&fp=${getFingerprint()}&ua=${navigator.userAgent}`;

    fetch(url, { method: 'GET', mode: 'cors', redirect: 'follow' })
    .then(res => res.json())
    .then(res => {
        showLoading(false);
        if(res.status === "success") { 
            curRider = res.rider; // Berisi ID dari Kolom A dan Nama dari Kolom B
            localStorage.setItem('kukami_session', JSON.stringify(curRider)); 
            initDashboard(); 
        } else {
            alert("Akses Ditolak: Periksa Nama & PIN kembali.");
        }
    })
    .catch(err => {
        showLoading(false);
        alert("Gagal Terhubung ke Server Google!");
        console.error(err);
    });
}

// --- DASHBOARD ---
function initDashboard() {
    document.getElementById('p-login').style.display = 'none'; 
    document.getElementById('app-content').style.display = 'block';
    showLoading(true);

    // Ambil ID Rider (Kolom A) dari session
    const targetId = curRider.id || JSON.parse(localStorage.getItem('kukami_session') || "{}").id;
    
    fetch(`${WEB_APP_URL}?action=getDashboard&id=${targetId}`, { redirect: 'follow' })
    .then(res => res.json())
    .then(res => {
        showLoading(false);
        if(!res) return;

        // Render Profile & Saldo
        document.getElementById('r-nama').innerHTML = (res.sapaan || curRider.nama || "Rider");
        document.getElementById('r-saldo').innerText = "Rp " + Number(res.saldo || 0).toLocaleString();
        if(res.foto) document.getElementById('r-foto').src = res.foto;
        
        // Render Stats (Hari & Bulan)
        document.getElementById('h-total').innerText = res.stats.hari.total;
        document.getElementById('h-on').innerText = res.stats.hari.on;
        document.getElementById('h-off').innerText = res.stats.hari.off;
        document.getElementById('b-total').innerText = res.stats.bulan.total;
        document.getElementById('b-on').innerText = res.stats.bulan.on;
        document.getElementById('b-off').innerText = res.stats.bulan.off;

        // Render Ranking
        if(typeof updateRank === 'function') {
            updateRank('rk-h-on', res.stats.hari.rank_on, 'hari');
            updateRank('rk-h-off', res.stats.hari.rank_off, 'hari');
            updateRank('rk-on', res.stats.bulan.rank_on, 'bulan');
            updateRank('rk-off', res.stats.bulan.rank_off, 'bulan');
        }

        // Render Tarif & Riwayat
        masterTarif = res.listTarif || [];
        if(typeof renderRiwayat === 'function') renderRiwayat(res.riwayat);
        
        // Render Kategori Chips
        let cats = [...new Set(masterTarif.map(x => x.kategori))];
        if (cats.length > 0) {
            document.getElementById('cat-list').innerHTML = cats.map(cat => 
                `<div class="chip" onclick="renderGrid('${cat}')">${cat}</div>`).join('');
            if(typeof renderGrid === 'function') renderGrid(cats[0]);
        }
    })
    .catch(err => {
        showLoading(false);
        console.error("Dashboard Error:", err);
    });
}

function logout() {
    localStorage.removeItem('kukami_session');
    location.reload();
}

// --- INITIALIZE ---
window.onload = function() { 
    const s = localStorage.getItem('kukami_session'); 
    if (s) { 
        curRider = JSON.parse(s); 
        initDashboard(); 
    } 
    
    // Auto-format input nominal topup
    const topupInput = document.getElementById('u-nom');
    if(topupInput) {
        topupInput.addEventListener('input', function(e) { 
            this.value = formatRibuan(this.value); 
        });
    }
};
