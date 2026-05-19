# Dokumentasi Teknis & Workflow KUKAMI Superapp v2.5

Dokumen ini merangkum alur kerja (*workflow*), logika sistem (*logic*), dan fungsi dari masing-masing komponen file utama proyek KUKAMI Superapp.

---

## 🏗️ 1. Arsitektur Sistem
KUKAMI Superapp dibangun dengan pendekatan **Serverless Web App** menggunakan ekosistem Google Workspace:
* **Backend & API**: Google Apps Script (`Code.gs`, `commandcenter.gs`)
* **Database**: Google Sheets (`DB_DASHBOARD`, `CMD_CONTROL`, `Log_Bulanan`, `Tarif`, dll.)
* **Frontend**: HTML, CSS, & Vanilla JavaScript (`Index.html`, `Rating.html`)
* **UI/UX**: Desain *"Locked UI"* premium dengan palet warna khas Maroon (`#800000`), Navy (`#000080`), dan Gold (`#D4AF37`).

---

## 📂 2. Struktur File & Logika Inti

### A. `Code.gs` (Core Backend Engine)
Ini adalah otak utama pemrosesan data di sisi *server*.
* **Logika Routing (`doGet`)**: 
    * Jika URL memiliki parameter `?page=rating`, maka sistem akan merender tampilan `Rating.html` sekaligus menangkap data Invoice (`inv`) dan ID Rider (`rider`).
    * Jika tanpa parameter, sistem akan merender `Index.html` (Dashboard Aplikasi Rider).
* **Logika Keamanan Perangkat (`loginRider`)**: 
    * Sistem membaca `DB_DASHBOARD` untuk mencocokkan Nama dan PIN.
    * **Double-Lock Security (Device Fingerprint)**: Saat Rider pertama kali *login*, *Device ID* HP akan dicatat di database. Jika Rider mencoba masuk menggunakan HP lain, akses akan **diblokir** kecuali Admin menghapus *Device ID* yang lama.
* **Logika Statistik Terpusat**: Mengekstrak total jumlah Trip (ON/OFF) beserta **Ranking Harian & Bulanan** dari `DB_DASHBOARD` dan meneruskannya ke antarmuka Rider.
* **Logika Partisi Data (`getMonthlyLogSheet`)**: Untuk menjaga aplikasi tetap ringan, riwayat transaksi dipisah/dibuatkan *sheet* otomatis setiap berganti bulan (contoh: `Log_MAY_2026`).

### B. `commandcenter.gs` (Pusat Kendali Admin)
Skrip khusus yang digunakan Admin untuk manajemen operasional massal.
* **Logika `CMD_CONTROL`**: Skrip ini secara otomatis membuat dan membaca *sheet* konfigurasi sentral yang bisa diedit Admin, meliputi:
    * `BROADCAST_LIVE`: Pengiriman pesan darurat/informasi ke seluruh HP Rider secara *real-time*.
    * `TARGET_GROWTH_PCT`: Pengaturan persentase target harian.
    * `REWARD_OFFLINE_TOP10`: Otomatisasi pengaturan nominal bonus/reward.
* **Manajemen Performa (`RAPOR_RIDER`)**: Logika untuk merangkum, mengevaluasi, dan mencetak rekapitulasi nilai kerja setiap Rider.

### C. `Index.html` (Frontend Dashboard Rider)
Antarmuka satu halaman (*Single Page Application*) yang digunakan oleh Rider di lapangan.
* **Logika UI (Locked UI)**: Menggunakan struktur CSS statis (Tabel tak kasat mata / *Flexbox Align*) agar *layout* tampilan statistik ranking tidak bergeser *(layout shift)* walau digit angkanya bertambah, sangat *mobile-friendly*.
* **Alur Kerja (*Workflow*) Rider**:
    1.  **Login**: Memasukkan akun, memvalidasi keamanan *Device ID*.
    2.  **Home / Dashboard**: Melihat rekap Trip (Harian/Bulanan), Ranking Emas, Saldo, serta Tombol Top-Up (+).
    3.  **Transaksi**: Tersedia fungsi input `MANUAL` dan `TARIF` (Layanan).
    4.  **Validasi Keranjang (Cart)**: Terdapat logika Peringatan Dini (Warning Alert) jika ada ongkos kirim ganda (*double ongkir*), atau jika Rider melanggar batas QTY.
    5.  **Log & Riwayat**: Menampilkan catatan *history* secara terbalik (*reverse*) agar transaksi terbaru muncul di atas.

### D. `Rating.html` (Frontend Ulasan Pelanggan)
Antarmuka publik bagi pelanggan untuk menilai layanan Rider (skala Bintang 1-5 dan ulasan teks).
* **Alur Kerja & Logika Anti-Fraud**:
    1.  Pelanggan memindai QR Code atau membuka tautan yang dikirimkan.
    2.  Halaman merender foto Rider, nama Rider (kapital), dan nomor *Invoice*.
    3.  **Blokir Kecurangan (Fraud blocked)**: Algoritma memblokir jika Rider terdeteksi mencoba mengeklik tautan *rating* untuk memberi nilai bintang 5 kepada dirinya sendiri.
    4.  **Blokir Duplikasi**: Memastikan satu nomor Invoice/Nota hanya bisa diberikan *rating* satu kali saja.
    5.  Setelah *rating* berhasil diunggah, halaman memiliki logika *auto-close* (tertutup otomatis) dalam waktu 5 detik.

---

## 🔄 3. Alur Data Global (Data Workflow)
1.  **Sesi Buka Aplikasi**: Aplikasi dimuat -> Skrip `Code.gs` merender `Index.html` -> Validasi Fingerprint -> Menerima rincian Saldo & Statistik.
2.  **Sesi Eksekusi Transaksi**: Rider klik Layanan -> Masuk Keranjang -> Validasi Logika Frontend -> Dikirim ke *Server* (`Code.gs`) -> Saldo Rider di-update -> Data tertulis di Sheet Log Bulan berjalan.
3.  **Sesi Ulasan (Rating)**: Link dibuat dari transaksi sukses -> Pelanggan membuka Link -> `Code.gs` melempar `Rating.html` -> Pelanggan input Bintang -> Validasi Anti-Fraud di Server -> Nilai dirangkum dalam `RAPOR_RIDER` (via `commandcenter.gs`).

---

**Dokumen ini merupakan intisari cetak biru (Blueprint) sistem yang merujuk pada versi kode terkini (Tahap 5).**
