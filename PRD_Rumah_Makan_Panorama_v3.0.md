# PRD — Sistem Pencatatan Rumah Makan Panorama

**Versi:** 3.0  
**Tanggal:** 18 November 2026  
**Status:** Draft spesifikasi pengembangan  
**Platform:** Web application  
**Bahasa:** Indonesia  
**Mata uang:** Rupiah (IDR)  
**Zona waktu:** Asia/Jakarta (WIB)

---

## 1. Ringkasan Proyek

Sistem Pencatatan Rumah Makan Panorama adalah aplikasi web untuk membantu pemilik dan staf mencatat serta memantau aktivitas administrasi rumah makan. Aplikasi ini **bukan sistem operasional restoran atau POS kasir penuh**. Fokus utamanya adalah pencatatan data, rekapitulasi, dan pembuatan laporan.

Aplikasi mendukung dua metode pencatatan penjualan:
1. **Pencatatan per menu:** pengguna memasukkan menu dan jumlah terjual. Sistem menghitung nilai penjualan berdasarkan harga menu.
2. **Pencatatan total harian:** pengguna memasukkan total omzet untuk satu tanggal tanpa rincian menu.

Kedua metode dapat digunakan sesuai kebutuhan. Sistem harus membedakan sumber pencatatan agar angka dari kedua metode tidak otomatis dijumlahkan sebagai omzet yang berbeda untuk tanggal dan cakupan penjualan yang sama.

Sistem dirancang untuk sekitar 2–3 pengguna dan dapat diakses secara online melalui laptop maupun smartphone.

### 1.1 Tujuan

- Mendigitalisasi pencatatan penjualan, pemasukan, dan pengeluaran.
- Menyediakan rekap omzet harian dan bulanan.
- Menyediakan rincian menu terjual apabila pencatatan per menu digunakan.
- Menyediakan daftar menu sebagai data referensi.
- Mendata aset tetap rumah makan.
- Menampilkan saldo kas berdasarkan pencatatan uang masuk dan keluar.
- Menyediakan laporan yang dapat difilter dan diekspor.

### 1.2 Prinsip ruang lingkup

- Aplikasi berfungsi sebagai **buku pencatatan digital**.
- Pengguna memasukkan data secara manual.
- Sistem menghitung subtotal, total, rekap, dan saldo berdasarkan data yang dimasukkan.
- Sistem tidak mengendalikan proses pelayanan, dapur, pembayaran pelanggan, atau stok bahan baku.
- Data yang tidak dicatat oleh pengguna tidak dapat dianggap tercatat oleh sistem.

### 1.3 Fitur yang termasuk

- Login dan hak akses pengguna.
- Dashboard ringkasan.
- Master daftar menu dan kategori.
- Pencatatan penjualan per menu.
- Pencatatan total penjualan harian.
- Riwayat dan rekap penjualan.
- Pencatatan pemasukan lain.
- Pencatatan pengeluaran.
- Buku kas dan saldo.
- Pencatatan aset tetap.
- Laporan dan ekspor Excel/PDF.
- Riwayat aktivitas pengguna.

### 1.4 Fitur yang tidak termasuk

- POS/kasir penuh dan alur checkout pelanggan.
- Pembayaran otomatis atau integrasi payment gateway/QRIS.
- Cetak struk thermal.
- Inventory, stok bahan baku, dan stock movement.
- Pengurangan bahan baku berdasarkan resep.
- Purchase order dan manajemen pemasok.
- Akuntansi double-entry penuh.
- Perhitungan penyusutan aset otomatis.
- Multi-cabang.
- Aplikasi mobile native.

---

## 2. Teknologi dan Arsitektur

| Komponen | Teknologi |
|---|---|
| Framework | Next.js App Router |
| Bahasa | TypeScript |
| Styling | Tailwind CSS |
| UI components | shadcn/ui |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Supabase integration | `@supabase/ssr` |
| Backend logic | Server Actions dan Route Handlers |
| Hosting | Vercel |
| Version control | GitHub |
| Export Excel | ExcelJS |
| Export PDF | jsPDF atau library PDF setara |

### 2.1 Arsitektur singkat

1. Pengguna mengakses aplikasi melalui browser.
2. Next.js menangani tampilan, validasi, autentikasi, dan proses bisnis.
3. Supabase menyediakan PostgreSQL dan autentikasi.
4. Vercel digunakan untuk deployment aplikasi.
5. GitHub digunakan untuk version control dan integrasi deployment.

### 2.2 Keamanan teknis

- Gunakan `@supabase/ssr` untuk autentikasi Next.js berbasis cookie.
- Aktifkan Row Level Security (RLS) pada tabel yang dapat diakses melalui Supabase API.
- Jangan mengekspos service-role key ke browser.
- Simpan kredensial di environment variables.
- Validasi data dan hak akses di server.
- Gunakan HTTPS.
- Terapkan backup database dan uji pemulihan secara berkala.

---

## 3. Pengguna dan Hak Akses

Sistem ditujukan untuk 2–3 pengguna. Hak akses awal:

| Fitur | Owner | Admin | Staff |
|---|---|---|---|
| Dashboard | Penuh | Lihat | Lihat |
| Daftar menu | Penuh | Penuh | Lihat |
| Catat penjualan | Penuh | Penuh | Penuh |
| Riwayat penjualan | Penuh | Penuh | Terbatas |
| Pemasukan dan pengeluaran | Penuh | Penuh | Tidak |
| Buku kas | Penuh | Penuh | Tidak |
| Aset | Penuh | Penuh | Lihat |
| Laporan | Penuh | Penuh | Terbatas |
| Manajemen pengguna | Penuh | Tidak | Tidak |
| Pengaturan sistem | Penuh | Terbatas | Tidak |

Pemeriksaan role wajib dilakukan di server dan melalui kebijakan RLS yang sesuai. Menyembunyikan tombol pada frontend saja tidak cukup.

---

## 4. Dashboard

Dashboard menjadi halaman utama setelah pengguna login.

### 4.1 Ringkasan informasi

- Omzet hari ini.
- Omzet bulan berjalan.
- Jumlah hari yang memiliki catatan penjualan.
- Total pemasukan lain.
- Total pengeluaran.
- Saldo kas berdasarkan akun.
- Jumlah menu aktif.
- Jumlah aset yang terdaftar.

### 4.2 Grafik dan rekap

- Grafik omzet harian.
- Grafik omzet bulanan.
- Ringkasan pemasukan dan pengeluaran.
- Menu terlaris berdasarkan kuantitas, **hanya dari data penjualan per menu**.

### 4.3 Filter periode

- Hari ini.
- Kemarin.
- 7 hari terakhir.
- Bulan ini.
- Bulan tertentu.
- Rentang tanggal khusus.

### 4.4 Aturan sumber data dashboard

Dashboard harus memperlihatkan sumber atau metode pencatatan penjualan yang digunakan. Jika pada tanggal yang sama terdapat catatan per menu dan catatan total harian, sistem tidak boleh menjumlahkan keduanya secara otomatis sebagai dua omzet terpisah.

Untuk rekap omzet utama, gunakan satu nilai yang ditetapkan sebagai **nilai omzet laporan** per tanggal. Jika kedua metode tersedia pada tanggal yang sama, pengguna harus memilih catatan mana yang menjadi acuan laporan atau melakukan rekonsiliasi terlebih dahulu. Tampilkan peringatan jika keduanya berpotensi mencatat penjualan yang sama.

---

## 5. Master Daftar Menu

Modul ini menyimpan daftar makanan dan minuman sebagai referensi pencatatan.

### 5.1 Data menu

- Nama menu.
- Kategori: makanan atau minuman.
- Harga jual.
- Status: aktif atau nonaktif.
- Deskripsi (opsional).
- Foto (opsional).

### 5.2 Aturan

- Menu nonaktif tidak dapat dipilih untuk pencatatan baru, tetapi tetap tampil pada riwayat lama.
- Perubahan harga tidak mengubah catatan penjualan yang sudah tersimpan.
- Penghapusan permanen menu yang pernah digunakan dalam catatan penjualan tidak diperbolehkan; gunakan status nonaktif.

---

## 6. Pencatatan Penjualan

Modul ini menyediakan dua metode pencatatan. Pengguna memilih metode sesuai data yang tersedia.

### 6.1 Metode A — Pencatatan per menu

Pengguna memasukkan rincian menu yang terjual pada tanggal tertentu.

**Data yang dicatat:**
- Tanggal penjualan.
- Daftar menu.
- Kuantitas setiap menu.
- Harga jual saat pencatatan.
- Subtotal setiap menu.
- Total penjualan hasil perhitungan.
- Catatan (opsional).
- Pengguna yang mencatat.

**Alur:**
1. Pengguna memilih tanggal.
2. Pengguna menambahkan satu atau beberapa menu.
3. Pengguna memasukkan kuantitas terjual.
4. Sistem mengambil harga menu yang berlaku sebagai nilai awal.
5. Sistem menghitung subtotal per menu dan total penjualan.
6. Pengguna memeriksa lalu menyimpan catatan.

**Rumus:**

`Subtotal item = kuantitas × harga satuan`

`Total penjualan per menu = jumlah seluruh subtotal item`

Harga satuan disimpan sebagai snapshot agar perubahan harga menu berikutnya tidak mengubah catatan lama.

### 6.2 Metode B — Pencatatan total harian

Pengguna memasukkan satu nilai omzet untuk satu tanggal tanpa rincian menu.

**Data yang dicatat:**
- Tanggal penjualan.
- Total omzet harian.
- Catatan/sumber rekap (opsional).
- Pengguna yang mencatat.

**Alur:**
1. Pengguna memilih tanggal.
2. Pengguna memasukkan total omzet.
3. Pengguna menambahkan catatan jika diperlukan.
4. Sistem memvalidasi nominal dan menyimpan catatan.

Metode ini tidak menghasilkan informasi kuantitas menu terjual atau menu terlaris.

### 6.3 Penggunaan kedua metode

Kedua metode tersedia dalam sistem, tetapi pengguna perlu memahami perbedaan cakupan datanya.

- Jika pencatatan per menu dan total harian adalah dua cara mencatat penjualan yang sama pada tanggal yang sama, **jangan menjumlahkan keduanya**.
- Jika total harian merupakan rekap pembanding dari rincian per menu, simpan sebagai nilai pembanding/rekonsiliasi, bukan omzet tambahan.
- Jika keduanya memang mencakup transaksi yang berbeda, pengguna harus menandai cakupan masing-masing secara jelas sebelum nilai digabungkan dalam laporan.
- Sistem harus memberi peringatan ketika terdapat dua catatan dengan tanggal dan cakupan yang berpotensi sama.
- Laporan omzet utama menggunakan nilai yang ditetapkan sebagai acuan untuk tanggal tersebut.
- Perubahan atau koreksi catatan harus menyimpan waktu dan pengguna yang melakukan perubahan.

**Rekomendasi implementasi:** sediakan satu catatan penjualan harian dengan pilihan metode `PER_MENU` atau `TOTAL_HARIAN`. Untuk kebutuhan rekonsiliasi, catatan total harian dapat diberi jenis `PEMBANDING` sehingga tidak masuk ke penjumlahan omzet utama. Pendekatan ini mengurangi risiko omzet terhitung ganda.

### 6.4 Riwayat penjualan

Riwayat menampilkan:
- Tanggal.
- Metode pencatatan.
- Total nilai.
- Jumlah jenis menu (jika per menu).
- Pengguna pencatat.
- Status catatan.
- Catatan tambahan.

Fitur:
- Filter tanggal dan metode.
- Pencarian berdasarkan tanggal.
- Lihat detail.
- Koreksi catatan sesuai hak akses.
- Tandai catatan dibatalkan dengan alasan; jangan menghapus jejak audit.

---

## 7. Pencatatan Pemasukan

Digunakan untuk mencatat uang masuk selain penjualan, misalnya pendapatan lain.

**Data:**
- Tanggal.
- Kategori pemasukan.
- Deskripsi.
- Nominal.
- Akun kas tujuan (tunai/bank/QRIS atau akun lain yang disediakan).
- Pengguna pencatat.
- Lampiran bukti (opsional).

Pemasukan dari penjualan tidak boleh dicatat ulang sebagai pemasukan lain jika sudah dimasukkan ke buku kas melalui mekanisme pencatatan penjualan.

---

## 8. Pencatatan Pengeluaran

Digunakan untuk mencatat biaya operasional dan pengeluaran rumah makan.

Contoh kategori:
- Bahan belanja operasional.
- Gaji/upah.
- Listrik dan air.
- Internet/telepon.
- Perawatan aset.
- Transportasi.
- Lain-lain.

**Data:**
- Tanggal.
- Kategori pengeluaran.
- Deskripsi.
- Nominal.
- Akun kas sumber.
- Pengguna pencatat.
- Lampiran bukti (opsional).

Kategori dapat ditambah atau diubah oleh Owner/Admin.

---

## 9. Buku Kas

Buku kas menampilkan seluruh arus uang yang dicatat.

### 9.1 Akun kas

Akun dapat dipisahkan, misalnya:
- Kas tunai.
- Rekening bank.
- Saldo QRIS yang belum/ sudah diselesaikan, jika memang ingin dipantau.

### 9.2 Kolom buku kas

- Tanggal.
- Nomor referensi.
- Deskripsi.
- Kategori.
- Akun kas.
- Debit (uang masuk).
- Kredit (uang keluar).
- Saldo.

### 9.3 Rumus saldo

`Saldo akhir = saldo awal + total debit - total kredit`

Dalam aplikasi ini:
- Debit berarti uang masuk.
- Kredit berarti uang keluar.

Istilah tersebut digunakan untuk buku kas sederhana dan **bukan implementasi akuntansi double-entry penuh**.

### 9.4 Integritas pencatatan

- Setiap catatan pemasukan/pengeluaran menghasilkan satu entri buku kas.
- Penjualan yang ditetapkan sebagai omzet laporan dapat menghasilkan entri kas sesuai nominal yang benar-benar diterima dan akun penerima.
- Catatan pembanding/rekonsiliasi tidak menghasilkan entri kas.
- Hindari pencatatan ganda saat pengguna mengirim formulir lebih dari sekali.
- Transaksi yang sudah tercatat tidak dihapus permanen; koreksi dilakukan melalui pembatalan atau transaksi penyesuaian yang memiliki jejak audit.
- Saldo dihitung dari saldo awal dan seluruh transaksi akun terkait.

---

## 10. Pencatatan Aset Tetap

Modul sederhana untuk mendata barang milik rumah makan, bukan inventory bahan baku.

Contoh:
- Kompor.
- Kulkas.
- Freezer.
- Meja dan kursi.
- Peralatan dapur.

**Data aset:**
- Nama aset.
- Kategori.
- Tanggal pembelian/perolehan.
- Harga perolehan (opsional).
- Kondisi.
- Lokasi.
- Keterangan.
- Status: aktif, rusak, atau tidak digunakan.

### 10.1 Riwayat perawatan

- Tanggal perawatan.
- Jenis perawatan/perbaikan.
- Deskripsi.
- Biaya.
- Catatan.

Jika biaya perawatan dicatat di modul aset, sistem harus menyediakan pilihan untuk membuat atau menautkan satu catatan pengeluaran agar biaya tidak masuk dua kali ke laporan keuangan.

---

## 11. Laporan dan Ekspor

### 11.1 Jenis laporan

- Rekap penjualan harian.
- Rekap penjualan bulanan.
- Detail penjualan per menu.
- Rekap pemasukan.
- Rekap pengeluaran.
- Buku kas per akun.
- Daftar aset.
- Riwayat perawatan aset.

### 11.2 Aturan laporan penjualan

- Laporan utama hanya menjumlahkan catatan yang ditetapkan sebagai omzet laporan.
- Catatan pembanding tidak dijumlahkan sebagai omzet tambahan.
- Laporan harus menampilkan metode pencatatan.
- Data total harian tidak boleh digunakan untuk menghitung menu terlaris.
- Menu terlaris hanya dihitung dari rincian penjualan per menu.
- Jika ada tanggal yang belum direkonsiliasi karena dua catatan berpotensi tumpang tindih, tampilkan penanda/peringatan.

### 11.3 Filter dan ekspor

- Filter rentang tanggal.
- Filter kategori.
- Filter akun kas.
- Filter metode pencatatan.
- Ekspor Excel (.xlsx).
- Ekspor PDF.
- Tampilkan periode laporan dan waktu pembuatan file.

---

## 12. Activity Log

Catat aktivitas penting:
- Login (opsional sesuai kebutuhan).
- Membuat/mengubah/membatalkan catatan penjualan.
- Membuat/mengubah pemasukan dan pengeluaran.
- Perubahan daftar menu.
- Perubahan data aset.
- Perubahan pengguna dan hak akses.

Data log minimal:
- Pengguna.
- Jenis aktivitas.
- Modul terkait.
- ID data terkait.
- Waktu aktivitas.
- Ringkasan perubahan yang aman disimpan.

---

## 13. Rancangan Database Awal

Rancangan berikut merupakan baseline dan dapat disesuaikan saat implementasi.

| Tabel | Fungsi |
|---|---|
| `profiles` | Profil pengguna dan role |
| `menu_categories` | Kategori menu |
| `menus` | Master daftar menu |
| `daily_sales` | Header catatan penjualan harian dan metode pencatatan |
| `daily_sale_items` | Rincian menu dan kuantitas untuk metode per menu |
| `cash_accounts` | Akun kas |
| `cash_categories` | Kategori pemasukan/pengeluaran |
| `cash_transactions` | Buku kas, pemasukan, dan pengeluaran |
| `fixed_assets` | Data aset tetap |
| `asset_maintenance` | Riwayat perawatan aset |
| `activity_logs` | Jejak aktivitas |

### 13.1 Struktur penting `daily_sales`

Kolom yang disarankan:
- `id`
- `business_date`
- `recording_method` (`PER_MENU` atau `DAILY_TOTAL`)
- `record_type` (`PRIMARY` atau `COMPARISON`)
- `reported_total`
- `notes`
- `created_by`
- `created_at`
- `updated_at`
- `status`

Untuk metode `PER_MENU`, nilai `reported_total` harus sesuai hasil penjumlahan `daily_sale_items`, kecuali ada mekanisme koreksi yang eksplisit. Untuk metode `DAILY_TOTAL`, nilai tersebut berasal dari input pengguna.

### 13.2 Struktur penting `daily_sale_items`

- `id`
- `daily_sale_id`
- `menu_id`
- `menu_name_snapshot`
- `unit_price_snapshot`
- `quantity`
- `subtotal`

### 13.3 Struktur penting `cash_transactions`

- `id`
- `transaction_date`
- `cash_account_id`
- `category_id`
- `direction` (`IN` atau `OUT`)
- `amount`
- `description`
- `source_type`
- `source_id`
- `created_by`
- `created_at`
- `status`

Gunakan referensi sumber (`source_type` dan `source_id`) atau mekanisme idempotensi untuk mencegah satu catatan menghasilkan entri kas lebih dari satu kali.

---

## 14. Aturan Validasi dan Integritas Data

- Nominal harus lebih besar dari atau sama dengan nol; untuk catatan penjualan dan transaksi kas, nominal harus lebih besar dari nol.
- Kuantitas menu harus bilangan bulat positif.
- Harga dan subtotal dihitung/ditinjau di server, bukan hanya mengandalkan nilai frontend.
- Tanggal wajib diisi.
- Catatan penjualan per menu harus memiliki minimal satu item.
- Catatan total harian harus memiliki nilai total.
- Satu tanggal tidak boleh memiliki lebih dari satu catatan omzet utama dengan cakupan yang sama.
- Catatan pembanding tidak boleh otomatis menambah omzet utama atau saldo kas.
- Setiap koreksi dan pembatalan harus menyimpan pengguna, waktu, dan alasan.
- Gunakan transaksi database untuk operasi yang harus berhasil atau gagal secara bersamaan.
- Terapkan RLS dan pemeriksaan role untuk mencegah akses tidak sah.

---

## 15. Antarmuka dan Pengalaman Pengguna

Menu navigasi utama:
1. Dashboard
2. Penjualan
   - Catat penjualan
   - Riwayat penjualan
3. Daftar Menu
4. Pemasukan
5. Pengeluaran
6. Buku Kas
7. Aset
8. Laporan
9. Pengaturan

Prinsip UI:
- Bahasa Indonesia.
- Responsif untuk desktop dan smartphone.
- Formulir singkat dan mudah dipahami.
- Konfirmasi sebelum pembatalan.
- Pesan validasi yang jelas.
- Tampilkan label metode pencatatan secara konsisten.
- Hindari istilah POS/kasir pada navigasi karena aplikasi berfokus pada pencatatan.

---

## 16. Prioritas Pengembangan

### Tahap 1 — Fondasi
- Setup Next.js, TypeScript, Tailwind, shadcn/ui.
- Setup Supabase dan autentikasi.
- Profil pengguna dan role.
- Layout aplikasi dan navigasi.

### Tahap 2 — Pencatatan inti
- Master daftar menu.
- Pencatatan penjualan per menu.
- Pencatatan total harian.
- Riwayat penjualan.
- Validasi pencegahan omzet ganda.

### Tahap 3 — Keuangan
- Akun kas.
- Pemasukan.
- Pengeluaran.
- Buku kas dan saldo.

### Tahap 4 — Aset dan laporan
- Data aset.
- Riwayat perawatan.
- Dashboard.
- Laporan dan ekspor Excel/PDF.

### Tahap 5 — Penguatan
- Activity log.
- Pengujian hak akses dan RLS.
- Pengujian integritas data.
- Backup dan uji pemulihan.
- Deployment Vercel.

---

## 17. Kriteria Penerimaan

Aplikasi dianggap memenuhi kebutuhan versi awal apabila:

1. Pengguna yang berwenang dapat login dan mengakses modul sesuai role.
2. Pengguna dapat mengelola daftar menu.
3. Pengguna dapat mencatat penjualan dengan rincian per menu.
4. Sistem menghitung subtotal dan total penjualan per menu dengan benar.
5. Pengguna dapat mencatat total omzet harian tanpa rincian menu.
6. Sistem membedakan catatan utama dan catatan pembanding.
7. Sistem memberi peringatan jika dua metode berpotensi mencatat penjualan yang sama.
8. Laporan omzet tidak menjumlahkan catatan yang tumpang tindih.
9. Menu terlaris hanya dihitung dari catatan per menu.
10. Pengguna dapat mencatat pemasukan dan pengeluaran.
11. Buku kas menghitung saldo berdasarkan saldo awal, debit, dan kredit.
12. Pengguna dapat mendata aset dan riwayat perawatannya.
13. Laporan dapat difilter dan diekspor ke Excel/PDF.
14. Data terlindungi oleh autentikasi, otorisasi server, dan RLS.
15. Aplikasi dapat digunakan melalui browser desktop dan smartphone.

---

## 18. Catatan Keputusan Produk

- Produk ini adalah **sistem pencatatan dan rekap administrasi**, bukan POS operasional.
- Tidak ada inventory atau pengelolaan stok.
- Pencatatan penjualan mendukung metode per menu dan total harian.
- Dua metode tersebut tidak boleh otomatis dijumlahkan apabila cakupannya sama.
- Jika pemilik ingin menggunakan total harian sebagai angka final dan rincian per menu hanya sebagai pembanding, sistem harus mempertahankan kedua data tetapi hanya memasukkan satu nilai ke omzet utama.
- Detail mekanisme rekonsiliasi perlu dikonfirmasi sebelum implementasi agar alur pencatatan sesuai kebiasaan Rumah Makan Panorama.
