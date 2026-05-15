/** * KUKAMI SCRIPT v2.8 - FIX SINKRONISASI */
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwL1lgTEzQ1dsos6bHzcA3ox26Yv7KsO20LHHT4wvO1PQvc36HOqYU4e6GLHvfFQ9I6/exec";

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
      } catch(e) { showLoading(false); alert("Respon server tidak valid!"); }
    }
  };
  xhr.send();
}

function initDashboard() {
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
          // ISI DATA KE ID HTML ASLI BOS
          if(document.getElementById('r-nama')) 
            document.getElementById('r-nama').innerText = (res.sapaan ? res.sapaan + ", " : "") + res.namaAsli;
          
          if(document.getElementById('r-saldo')) 
            document.getElementById('r-saldo').innerText = "Rp " + Number(res.saldo || 0).toLocaleString('id-ID');
          
          if(document.getElementById('h-total')) document.getElementById('h-total').innerText = res.stats.hari.total;
          if(document.getElementById('h-on')) document.getElementById('h-on').innerText = res.stats.hari.on;
          if(document.getElementById('h-off')) document.getElementById('h-off').innerText = res.stats.hari.off;
          
          if(res.foto && document.getElementById('r-foto')) document.getElementById('r-foto').src = res.foto;
        }
      } catch(e) { console.log("Render failed"); }
    }
  };
  xhr.send();
}

window.onload = function() {
  if (localStorage.getItem('kukami_session')) initDashboard();
};
