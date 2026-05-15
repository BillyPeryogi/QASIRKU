/**
 * KUKAMI ENGINE v2.6 - FINAL STABLE
 */

// GANTI DENGAN URL WEB APP ANDA
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxzgAQlFhP3VYAEmXGI7whw4aFgUa26R6dv3arKgX1BgIjW_dR_6nIdzGXz2_DgKyJW/exec";

const showLoading = (s) => { 
    document.getElementById('loader').style.display = s ? 'flex' : 'none'; 
};

function prosesLogin() { 
    const u = document.getElementById('user').value;
    const p = document.getElementById('pin').value;
    
    if(!u || !p) return alert("Nama & PIN wajib diisi!");
    
    showLoading(true);
    const url = WEB_APP_URL + "?action=login&user=" + encodeURIComponent(u) + "&pin=" + encodeURIComponent(p) + "&fp=" + (localStorage.getItem('kukami_fp') || "");

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if(res.status === "success") { 
                        localStorage.setItem('kukami_session', JSON.stringify(res.rider)); 
                        initDashboard(); 
                    } else {
                        showLoading(false);
                        alert(res.message);
                    }
                } catch(e) {
                    showLoading(false);
                    alert("Respon server tidak valid!");
                }
            } else {
                showLoading(false);
                alert("Gagal koneksi ke Google!");
            }
        }
    };
    xhr.send();
}

function initDashboard() {
    const session = JSON.parse(localStorage.getItem('kukami_session') || "{}");
    if(!session.id) return;

    // Sembunyikan login, tampilkan app
    document.getElementById('p-login').style.display = 'none';
    document.getElementById('app-content').style.display = 'flex';
    showLoading(true);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", WEB_APP_URL + "?action=getDashboard&id=" + encodeURIComponent(session.id), true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            showLoading(false);
            if (xhr.status == 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if(res.status === "success") {
                        // Render Data
                        document.getElementById('r-nama').innerText = (res.sapaan ? res.sapaan + ", " : "") + res.namaAsli;
                        document.getElementById('r-saldo').innerText = "Rp " + Number(res.saldo || 0).toLocaleString('id-ID');
                        document.getElementById('r-kelas').innerText = res.kelas || "Rider";
                        document.getElementById('h-total').innerText = res.stats.hari.total || 0;
                        document.getElementById('h-on').innerText = res.stats.hari.on || 0;
                        document.getElementById('h-off').innerText = res.stats.hari.off || 0;
                        document.getElementById('b-total').innerText = res.stats.bulan.total || 0;
                        
                        if(res.foto) document.getElementById('r-foto').src = res.foto;
                        
                        const rk = document.getElementById('rk-h-on');
                        if(res.stats.hari.rank_on && res.stats.hari.rank_on !== "-") {
                            rk.innerHTML = '<span class="rank-badge">RANK ' + res.stats.hari.rank_on + '</span>';
                        }
                    }
                } catch(e) { console.error("Parse error", e); }
            }
        }
    };
    xhr.send();
}

function logout() {
    localStorage.removeItem('kukami_session');
    location.reload();
}

window.onload = function() {
    // Generate simple Fingerprint
    if(!localStorage.getItem('kukami_fp')) {
        localStorage.setItem('kukami_fp', 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase());
    }
    
    const s = localStorage.getItem('kukami_session');
    if (s) initDashboard();
};
