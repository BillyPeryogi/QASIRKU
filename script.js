/** * KUKAMI ENGINE v2.5 - FINAL REPAIR
 * Perbaikan: Sinkronisasi ID Login & Dashboard
 */

alert("KUKAMI v1.2: Jalur Cepat Aktif!");

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbycy-UG55-x9yQe_ToKvonaXo7ZN0WklvxiYA37bu-sdw4chlNEgnYDabxmaZU9T7Ci/exec";

let curRider = {}; 

const showLoading = (s) => { 
    const l = document.getElementById('loader'); 
    if(l) l.style.display = s ? 'flex' : 'none'; 
};

// 1. PROSES LOGIN
function prosesLogin() { 
    showLoading(true); 
    const user = document.getElementById('user').value;
    const pin = document.getElementById('pin').value;
    
    if(!user || !pin) { showLoading(false); return alert("Nama & PIN wajib diisi!"); }

    // Kirim Nama (B) dan PIN (C)
    const url = WEB_APP_URL + "?action=login&user=" + encodeURIComponent(user) + "&pin=" + encodeURIComponent(pin);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if(res.status === "success") { 
                        // KUNCI: Simpan hasil balikan dari Google (ID asli dari Kolom A)
                        curRider = res.rider; 
                        localStorage.setItem('kukami_session', JSON.stringify(res.rider)); 
                        
                        // LANGSUNG MASUK
                        initDashboard(); 
                    } else {
                        showLoading(false);
                        alert("Nama atau PIN salah!");
                    }
                } catch(e) {
                    showLoading(false);
                    alert("Format server salah, pastikan GAS New Version!");
                }
            } else {
                showLoading(false);
                alert("Gagal koneksi ke Google!");
            }
        }
    };
    xhr.send();
}

// 2. DASHBOARD ENGINE
function initDashboard() {
    // Paksa layar pindah dulu agar tidak stuck muter di login
    document.getElementById('p-login').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    showLoading(true);

    // Ambil ID dari memori
    const session = JSON.parse(localStorage.getItem('kukami_session') || "{}");
    const targetId = session.id;

    if(!targetId) {
        showLoading(false);
        logout();
        return;
    }

    var xhr = new XMLHttpRequest();
    // Gunakan targetId yang asli dari kolom A
    xhr.open("GET", WEB_APP_URL + "?action=getDashboard&id=" + encodeURIComponent(targetId), true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            showLoading(false); // MATIKAN LOADING SEGERA
            if (xhr.status == 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if(res.status === "success") {
                        renderUI(res);
                    } else {
                        alert("Data Dashboard Gagal Dimuat: " + res.message);
                    }
                } catch(e) {
                    console.error("Render Error:", e);
                }
            }
        }
    };
    xhr.send();
}

// 3. RENDER UI
function renderUI(res) {
    try {
        // Nama & Sapaan
        document.getElementById('r-nama').innerText = (res.sapaan ? res.sapaan + ", " : "") + res.namaAsli;
        // Saldo
        document.getElementById('r-saldo').innerText = "Rp " + Number(res.saldo || 0).toLocaleString('id-ID');
        // Foto
        if(res.foto) document.getElementById('r-foto').src = res.foto;
        // Stats Hari
        document.getElementById('h-total').innerText = res.stats.hari.total || 0;
        document.getElementById('h-on').innerText = res.stats.hari.on || 0;
        document.getElementById('h-off').innerText = res.stats.hari.off || 0;
        // Stats Bulan
        document.getElementById('b-total').innerText = res.stats.bulan.total || 0;
        
        // Peringkat
        const rk = document.getElementById('rk-h-on');
        if(rk) rk.innerHTML = `<span class="rank-badge bg-rank-hari-top">${res.stats.hari.rank_on || '-'}</span>`;

        // Render Tarif/Grid
        masterTarif = res.listTarif || [];
        if(masterTarif.length > 0) {
            let cats = [...new Set(masterTarif.map(x => x.kategori))];
            document.getElementById('cat-list').innerHTML = cats.map(cat => 
                `<div class="chip" onclick="renderGrid('${cat}')">${cat}</div>`).join('');
            renderGrid(cats[0]);
        }
    } catch(err) {
        console.warn("Cek ID elemen di HTML Bos!");
    }
}

// 4. SISTEM
function logout() {
    localStorage.removeItem('kukami_session');
    location.reload();
}

function renderGrid(cat) {
    const grid = document.getElementById('grid-list');
    if(!grid) return;
    grid.innerHTML = masterTarif.filter(t => t.kategori === cat).map(t => `
        <div class="service-card" onclick="addToCart('${t.layanan}', ${t.nominal}, ${t.potongan})">
            <b>${t.layanan}</b>
            <span>Rp ${Number(t.nominal).toLocaleString('id-ID')}</span>
        </div>
    `).join('');
}

window.onload = function() {
    const s = localStorage.getItem('kukami_session');
    if (s) {
        initDashboard();
    }
};
