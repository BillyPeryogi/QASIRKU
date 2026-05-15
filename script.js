const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyfrDHcyEV95PX7G8kiTUIBrsJS_y_i7NC2rRfZ0FztJV21m_cx7IzoFrL-_rKy5LtY/exec";

function showLoading(s) { 
  const loader = document.getElementById('loader');
  if(loader) loader.style.display = s ? 'flex' : 'none'; 
}

function prosesLogin() {
  showLoading(true);
  const u = document.getElementById('user').value;
  const p = document.getElementById('pin').value;
  
  // Memanggil GAS
  fetch(`${WEB_APP_URL}?action=login&user=${encodeURIComponent(u)}&pin=${p}`)
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
    .catch(() => {
      showLoading(false);
      alert("Gagal terhubung ke server.");
    });
}

function initDashboard() {
  const session = JSON.parse(localStorage.getItem('kukami_session') || "{}");
  if(!session.id) return;

  // Sembunyikan form login, tampilkan konten aplikasi Bos
  document.getElementById('p-login').style.display = 'none';
  document.getElementById('app-content').style.display = 'block';
  showLoading(true);

  fetch(`${WEB_APP_URL}?action=getDashboard&id=${session.id}`)
    .then(r => r.json())
    .then(res => {
      showLoading(false);
      if(res.status === "success") {
        // Masukkan data ke elemen HTML asli Bos
        if(document.getElementById('r-nama')) document.getElementById('r-nama').innerText = (res.sapaan ? res.sapaan + ", " : "") + res.namaAsli;
        if(document.getElementById('r-saldo')) document.getElementById('r-saldo').innerText = "Rp " + Number(res.saldo).toLocaleString('id-ID');
        if(document.getElementById('h-on')) document.getElementById('h-on').innerText = res.stats.hari.on;
        if(document.getElementById('h-off')) document.getElementById('h-off').innerText = res.stats.hari.off;
        if(document.getElementById('h-total')) document.getElementById('h-total').innerText = Number(res.stats.hari.on) + Number(res.stats.hari.off);
        if(res.foto && document.getElementById('r-foto')) document.getElementById('r-foto').src = res.foto;
      }
    })
    .catch(() => showLoading(false));
}

window.onload = function() {
  if (localStorage.getItem('kukami_session')) initDashboard();
};
