const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw7j6EgsMRnOLIlFBoA1heXgx7Gx147wur-l3LUTK2JbsbYThEM8kzH6vKGFaqribUC/exec";

function prosesLogin() {
    showLoading(true);
    const u = document.getElementById('user').value;
    const p = document.getElementById('pin').value;
    
    fetch(`${WEB_APP_URL}?action=login&user=${encodeURIComponent(u)}&pin=${encodeURIComponent(p)}`)
    .then(r => r.json())
    .then(res => {
        if(res.status === "success") {
            localStorage.setItem('kukami_session', JSON.stringify(res.rider));
            initDashboard();
        } else {
            showLoading(false);
            alert(res.message);
        }
    })
    .catch(err => {
        showLoading(false);
        alert("Koneksi bermasalah, tapi tetap mencoba masuk...");
        // Jalur darurat: Tetap paksa masuk jika data lokal ada
        initDashboard();
    });
}

function initDashboard() {
    document.getElementById('p-login').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    showLoading(true);

    const session = JSON.parse(localStorage.getItem('kukami_session') || "{}");
    if(!session.id) return logout();

    fetch(`${WEB_APP_URL}?action=getDashboard&id=${session.id}`)
    .then(r => r.json())
    .then(res => {
        showLoading(false);
        if(res.status === "success") {
            document.getElementById('r-nama').innerText = (res.sapaan ? res.sapaan + ", " : "") + res.namaAsli;
            document.getElementById('r-saldo').innerText = "Rp " + Number(res.saldo).toLocaleString('id-ID');
            document.getElementById('h-total').innerText = res.stats.hari.total;
        }
    })
    .catch(() => showLoading(false));
}
