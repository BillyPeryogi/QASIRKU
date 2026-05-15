/** * KUKAMI ENGINE v2.4 - STABLE SINKRON
 * Menyesuaikan Kolom A-AE & HTML Bos
 */

alert("KUKAMI Engine v2.4 Aktif!");

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxeLFPsug0f5PWHXlar47heQyXN0GaMyoBPwgpB3l1y3l9tnsyizwVDQKhACJDVXdxv/exec";

let curRider = {}, masterTarif = [], cart = [], curNomStr = "0";

const showLoading = (s) => { 
    const l = document.getElementById('loader'); 
    if(l) l.style.display = s ? 'flex' : 'none'; 
};

const formatRibuan = (v) => v.toString().replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

function prosesLogin() { 
    showLoading(true); 
    const user = document.getElementById('user').value;
    const pin = document.getElementById('pin').value;
    if(!user || !pin) { showLoading(false); return alert("Isi Nama & PIN!"); }

    const url = WEB_APP_URL + "?action=login&user="+encodeURIComponent(user)+"&pin="+encodeURIComponent(pin)+"&fp="+localStorage.getItem('kukami_fp');
    
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
                    showLoading(false); alert("Gagal: " + res.message);
                }
            } catch(e) { showLoading(false); alert("Error Server!"); }
        }
    };
    xhr.send();
}

function initDashboard() {
    // 1. PINDAH HALAMAN DULUAN (ANTI-KICKBACK)
    document.getElementById('p-login').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    showLoading(true);

    const session = JSON.parse(localStorage.getItem('kukami_session') || "{}");
    const targetId = curRider.id || session.id;

    if(!targetId) { location.reload(); return; }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", WEB_APP_URL + "?action=getDashboard&id=" + encodeURIComponent(targetId), true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            showLoading(false);
            if (xhr.status == 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if(res.status === "success") renderUI(res);
                    else alert(res.message);
                } catch(e) { console.error("Render Error", e); }
            }
        }
    };
    xhr.send();
}

function renderUI(res) {
    try {
        // Nama & Sapaan (Kolom B & X)
        const nameEl = document.getElementById('r-nama');
        if(nameEl) {
            const txt = (res.sapaan ? res.sapaan + ", " : "") + (res.namaAsli || curRider.nama);
            nameEl.innerText = txt;
        }

        // Saldo (Kolom Q)
        const saldoEl = document.getElementById('r-saldo');
        if(saldoEl) saldoEl.innerText = "Rp " + Number(res.saldo || 0).toLocaleString('id-ID');

        // Foto (Kolom D)
        if(res.foto) document.getElementById('r-foto').src = res.foto;

        // Stats Hari (R, S, Z)
        if(res.stats && res.stats.hari) {
            document.getElementById('h-total').innerText = res.stats.hari.total;
            document.getElementById('h-on').innerText = res.stats.hari.on;
            document.getElementById('h-off').innerText = res.stats.hari.off;
            const rkOn = document.getElementById('rk-h-on');
            if(rkOn) rkOn.innerHTML = `<span class="rank-badge bg-rank-hari-top">${res.stats.hari.rank_on}</span>`;
        }

        // Stats Bulan (T, U)
        if(res.stats && res.stats.bulan) {
            document.getElementById('b-total').innerText = res.stats.bulan.total;
            document.getElementById('b-on').innerText = res.stats.bulan.on;
            document.getElementById('b-off').innerText = res.stats.bulan.off;
        }

        // Render Kategori Chips
        masterTarif = res.listTarif || [];
        const catList = document.getElementById('cat-list');
        if(catList && masterTarif.length > 0) {
            let cats = [...new Set(masterTarif.map(x => x.kategori))];
            catList.innerHTML = cats.map(cat => `<div class="chip" onclick="renderGrid('${cat}')">${cat}</div>`).join('');
            renderGrid(cats[0]);
        }
    } catch(err) { console.warn("Beberapa elemen HTML tidak ditemukan."); }
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
    document.getElementById('f-manual').style.display = (n===1) ? 'block' : 'none';
    document.getElementById('f-tarif').style.display = (n===2) ? 'block' : 'none';
    document.getElementById('tb1').className = (n===1) ? 'tab-btn tab-active' : 'tab-btn tab-inactive';
    document.getElementById('tb2').className = (n===2) ? 'tab-btn tab-active' : 'tab-btn tab-inactive';
}

function pressNum(v) {
    const input = document.getElementById('m-nom');
    if(v === 'C') curNomStr = "0";
    else if(v === '⌫') curNomStr = curNomStr.length > 1 ? curNomStr.slice(0, -1) : "0";
    else curNomStr = curNomStr === "0" ? v : curNomStr + v;
    input.value = "Rp " + formatRibuan(curNomStr);
}

function logout() { localStorage.removeItem('kukami_session'); location.reload(); }

window.onload = function() {
    if(!localStorage.getItem('kukami_fp')) localStorage.setItem('kukami_fp', 'ID-' + Math.random().toString(36).substr(2,9).toUpperCase());
    const s = localStorage.getItem('kukami_session');
    if(s) { curRider = JSON.parse(s); initDashboard(); }
};
