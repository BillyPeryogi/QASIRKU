// DEBUG: Jika muncul alert ini, koneksi GitHub ke APK AMAN
alert("KUKAMI Engine v1.1 Aktif!");

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzjusUcLi9En6KwZwsxU8UGg44NFrffqj0bSkBygQmDCvdPCDKL4DMhaTsAJiznBbn5/exec";

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
    // Emergency stop: Jika 15 detik masih muter, matikan paksa
    if(s) setTimeout(() => { if(l) l.style.display = 'none'; }, 15000);
};

// --- AUTH (PROSES LOGIN) ---
function prosesLogin() { 
    showLoading(true); 
    const user = document.getElementById('user').value;
    const pin = document.getElementById('pin').value;
    
    if(!user || !pin) { showLoading(false); return alert("Isi Nama & PIN!"); }

    // Memastikan parameter action=login terkirim dengan benar
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
            showLoading(false);
            if (xhr.status == 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if(res.status === "success") { 
                        curRider = res.rider; 
                        localStorage.setItem('kukami_session', JSON.stringify(curRider)); 
                        initDashboard(); 
                    } else {
                        alert("Gagal: " + (res.message || "Nama atau PIN salah"));
                    }
                } catch(e) {
                    alert("Respon Server Error! Pastikan GAS sudah di-Deploy sebagai 'Anyone'.");
                }
            } else {
                alert("Koneksi Error. Status: " + xhr.status);
            }
        }
    };
    
    xhr.onerror = function() {
        showLoading(false);
        alert("Panggilan Diblokir! Cek URL GAS di script.js.");
    };
    
    xhr.send();
}

// --- DASHBOARD ---
function initDashboard() {
    document.getElementById('p-login').style.display = 'none'; 
    document.getElementById('app-content').style.display = 'block';
    showLoading(true);

    const targetId = curRider.id || JSON.parse(localStorage.getItem('kukami_session') || "{}").id;
    const url = WEB_APP_URL + "?action=getDashboard&id=" + targetId;
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            showLoading(false);
            if (xhr.status == 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    
                    // RENDER DATA KE UI
                    document.getElementById('r-nama').innerHTML = (res.sapaan || curRider.nama || "Rider");
                    document.getElementById('r-saldo').innerText = "Rp " + Number(res.saldo || 0).toLocaleString();
                    if(res.foto) document.getElementById('r-foto').src = res.foto;
                    
                    // Stats
                    document.getElementById('h-total').innerText = res.stats.hari.total;
                    document.getElementById('h-on').innerText = res.stats.hari.on;
                    document.getElementById('h-off').innerText = res.stats.hari.off;
                    document.getElementById('b-total').innerText = res.stats.bulan.total;
                    document.getElementById('b-on').innerText = res.stats.bulan.on;
                    document.getElementById('b-off').innerText = res.stats.bulan.off;

                    masterTarif = res.listTarif || [];
                    if(typeof renderRiwayat === 'function') renderRiwayat(res.riwayat);
                    
                    let cats = [...new Set(masterTarif.map(x => x.kategori))];
                    if (cats.length > 0) {
                        document.getElementById('cat-list').innerHTML = cats.map(cat => 
                            `<div class="chip" onclick="renderGrid('${cat}')">${cat}</div>`).join('');
                        if(typeof renderGrid === 'function') renderGrid(cats[0]);
                    }
                } catch(e) {
                    console.error("Gagal Render Dashboard", e);
                }
            }
        }
    };
    xhr.send();
}

// --- INITIALIZE ---
window.onload = function() { 
    const s = localStorage.getItem('kukami_session'); 
    if (s) { 
        curRider = JSON.parse(s); 
        initDashboard(); 
    } 
    
    const topupInput = document.getElementById('u-nom');
    if(topupInput) {
        topupInput.addEventListener('input', function() { 
            this.value = formatRibuan(this.value); 
        });
    }
};
