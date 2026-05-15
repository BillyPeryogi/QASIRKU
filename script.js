const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbytMxAOfbdtSoF9g5G_6D_mkQwZPW1UOVbMwxlvYl9nRoTW6yvVjnI3CZidkEVWjWb8/exec";

function showLoading(s) { 
    const l = document.getElementById('loader');
    if(l) l.style.display = s ? 'flex' : 'none'; 
}

function prosesLogin() { 
    showLoading(true);
    const u = document.getElementById('user').value;
    const p = document.getElementById('pin').value;
    
    const url = WEB_APP_URL + "?action=login&user=" + encodeURIComponent(u) + "&pin=" + encodeURIComponent(p);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            try {
                var res = JSON.parse(xhr.responseText);
                if(res.status === "success") {
                    localStorage.setItem('kukami_session', JSON.stringify(res.rider));
                    initDashboard();
                } else { showLoading(false); alert(res.message); }
            } catch(e) { showLoading(false); alert("Respon Server Error"); }
        }
    };
    xhr.send();
}

function initDashboard() {
    // Paksa Pindah Halaman Dulu!
    document.getElementById('p-login').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    showLoading(true);

    const session = JSON.parse(localStorage.getItem('kukami_session') || "{}");
    const url = WEB_APP_URL + "?action=getDashboard&id=" + encodeURIComponent(session.id);
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            showLoading(false);
            try {
                var res = JSON.parse(xhr.responseText);
                if(res.status === "success") {
                    // Update Nama & Sapaan
                    document.getElementById('r-nama').innerText = (res.sapaan ? res.sapaan + ", " : "") + res.namaAsli;
                    document.getElementById('r-saldo').innerText = "Rp " + Number(res.saldo).toLocaleString('id-ID');
                    document.getElementById('h-on').innerText = res.stats.hari.on;
                    document.getElementById('h-off').innerText = res.stats.hari.off;
                    document.getElementById('h-total').innerText = Number(res.stats.hari.on) + Number(res.stats.hari.off);
                    if(res.foto) document.getElementById('r-foto').src = res.foto;
                }
            } catch(e) { console.log("Render Error"); }
        }
    };
    xhr.send();
}

window.onload = function() {
    if (localStorage.getItem('kukami_session')) initDashboard();
};
