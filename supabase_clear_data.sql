-- ==============================================================================
-- PEMBERSIHAN DATA OPERASIONAL RUMAH MAKAN PANORAMA (RESET KE AWAL)
-- Akun Login (auth.users & profiles) serta Akun Kas Tetap AMAN & TIDAK DIHAPUS
-- ==============================================================================

-- 1. Hapus Semua Data Penjualan & Rincian Menu Penjualan
DELETE FROM public.daily_sale_items;
DELETE FROM public.daily_sales;

-- 2. Hapus Semua Catatan Transaksi Kas (Pemasukan, Pengeluaran & Riwayat Mutasi)
DELETE FROM public.cash_transactions;

-- 3. Hapus Semua Catatan Servis & Perawatan Aset
DELETE FROM public.asset_maintenance;

-- 4. Hapus Semua Data Aset Inventaris & Aset Masuk
DELETE FROM public.fixed_assets;

-- 5. Hapus Master Menu Makanan & Minuman
DELETE FROM public.menus;
DELETE FROM public.menu_categories;

-- 6. Hapus Log Aktivitas Sistem
DELETE FROM public.activity_logs;

-- 7. Reset Saldo Awal Akun Kas Utama Menjadi Rp 0 (Akun Kas Tidak Dihapus)
UPDATE public.cash_accounts SET initial_balance = 0;

-- Pastikan 3 Akun Kas Standar Tersedia dengan Saldo Rp 0
INSERT INTO public.cash_accounts (id, name, account_type, initial_balance) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Kas Laci Kasir (Tunai)', 'CASH', 0),
  ('22222222-2222-2222-2222-222222222222', 'Rekening Operasional (BCA)', 'BANK', 0),
  ('33333333-3333-3333-3333-333333333333', 'Settlement QRIS Statis', 'QRIS', 0)
ON CONFLICT (id) DO UPDATE SET initial_balance = 0;

-- ------------------------------------------------------------------------------
-- VERIFIKASI HASIL PEMBERSIHAN (AKUN USER TETAP UTUH)
-- ------------------------------------------------------------------------------
SELECT 'Akun Login Aktif' AS status, count(*) AS total FROM public.profiles
UNION ALL
SELECT 'Akun Kas', count(*) FROM public.cash_accounts
UNION ALL
SELECT 'Transaksi Kas', count(*) FROM public.cash_transactions
UNION ALL
SELECT 'Penjualan Resto', count(*) FROM public.daily_sales
UNION ALL
SELECT 'Daftar Menu', count(*) FROM public.menus
UNION ALL
SELECT 'Aset Tetap', count(*) FROM public.fixed_assets;
