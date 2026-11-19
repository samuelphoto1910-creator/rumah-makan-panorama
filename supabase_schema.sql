-- ==============================================================================
-- SKEMA DATABASE SUPABASE: SISTEM PENCATATAN RUMAH MAKAN PANORAMA
-- Versi: 3.0 (Berdasarkan PRD Rumah Makan Panorama)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL PROFILES (Terkoneksi dengan auth.users Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Staff' CHECK (role IN ('Owner', 'Admin', 'Staff')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABEL KATEGORI MENU & MASTER MENU
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Makanan', 'Minuman', 'Lauk / Tambahan')),
  price NUMERIC NOT NULL CHECK (price >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABEL AKUN KAS
CREATE TABLE IF NOT EXISTS public.cash_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('CASH', 'BANK', 'QRIS')),
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABEL PENCATATAN PENJUALAN HARIAN (Metode A & Metode B)
CREATE TABLE IF NOT EXISTS public.daily_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_date DATE NOT NULL,
  recording_method TEXT NOT NULL CHECK (recording_method IN ('PER_MENU', 'DAILY_TOTAL')),
  record_type TEXT NOT NULL DEFAULT 'PRIMARY' CHECK (record_type IN ('PRIMARY', 'COMPARISON')),
  cash_account_id UUID REFERENCES public.cash_accounts(id),
  debit_amount NUMERIC NOT NULL DEFAULT 0 CHECK (debit_amount >= 0),
  credit_amount NUMERIC NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
  net_amount NUMERIC NOT NULL DEFAULT 0 CHECK (net_amount >= 0),
  reported_total NUMERIC NOT NULL DEFAULT 0 CHECK (reported_total >= 0),
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED')),
  cancel_reason TEXT
);

-- 6. TABEL RINCIAN ITEM PENJUALAN (Khusus Metode A: PER_MENU)
CREATE TABLE IF NOT EXISTS public.daily_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_sale_id UUID NOT NULL REFERENCES public.daily_sales(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES public.menus(id),
  menu_name_snapshot TEXT NOT NULL,
  unit_price_snapshot NUMERIC NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC NOT NULL
);

-- 7. TABEL BUKU KAS, PEMASUKAN LAIN & PENGELUARAN OPERASIONAL
CREATE TABLE IF NOT EXISTS public.cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL,
  cash_account_id UUID NOT NULL REFERENCES public.cash_accounts(id),
  category_name TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('IN', 'OUT')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  source_type TEXT DEFAULT 'MANUAL' CHECK (source_type IN ('SALES', 'MANUAL', 'ASSET_MAINTENANCE')),
  source_id TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED')),
  cancel_reason TEXT
);

-- 8. TABEL ASET TETAP & RIWAYAT PERAWATAN
CREATE TABLE IF NOT EXISTS public.fixed_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  purchase_price NUMERIC,
  condition TEXT NOT NULL DEFAULT 'Baik' CHECK (condition IN ('Baik', 'Perlu Perbaikan', 'Rusak')),
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asset_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.fixed_assets(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  maintenance_date DATE NOT NULL,
  maintenance_type TEXT NOT NULL,
  description TEXT NOT NULL,
  cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. TABEL LOG AKTIVITAS (Audit Trail)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT,
  user_role TEXT,
  action_type TEXT NOT NULL,
  module_name TEXT NOT NULL,
  record_id TEXT,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy Profiles: User can read all profiles, update own
CREATE POLICY "Profiles readable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Policies for Authenticated Staff/Admin/Owner:
CREATE POLICY "Authenticated users can read menus" ON public.menus FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can modify menus" ON public.menus FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can read cash accounts" ON public.cash_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can modify cash accounts" ON public.cash_accounts FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage daily sales" ON public.daily_sales FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage daily sale items" ON public.daily_sale_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage cash transactions" ON public.cash_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage fixed assets" ON public.fixed_assets FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage maintenance" ON public.asset_maintenance FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage activity logs" ON public.activity_logs FOR ALL TO authenticated USING (true);

-- ==============================================================================
-- TRIGGER AUTO-CREATE PROFILE ON USER SIGNUP (BULLETPROOF)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Staff')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Jangan pernah biarkan trigger menghentikan proses pembuatan user di auth
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- INITIAL SEED DATA
-- ==============================================================================

-- Akun Kas Bawaan
INSERT INTO public.cash_accounts (name, account_type, initial_balance) VALUES
  ('Kas Laci Kasir (Tunai)', 'CASH', 1500000),
  ('Rekening Operasional (BCA)', 'BANK', 12500000),
  ('Settlement QRIS Statis', 'QRIS', 3200000)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- GRANT HAK AKSES (MENCEGAH ERROR 42501: permission denied)
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- RLS policies WITH CHECK (true) agar INSERT & UPDATE tidak diblokir
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.cash_transactions;
CREATE POLICY "Allow all for authenticated users" ON public.cash_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.daily_sales;
CREATE POLICY "Allow all for authenticated users" ON public.daily_sales FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.daily_sale_items;
CREATE POLICY "Allow all for authenticated users" ON public.daily_sale_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.menus;
CREATE POLICY "Allow all for authenticated users" ON public.menus FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.cash_accounts;
CREATE POLICY "Allow all for authenticated users" ON public.cash_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.fixed_assets;
CREATE POLICY "Allow all for authenticated users" ON public.fixed_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.asset_maintenance;
CREATE POLICY "Allow all for authenticated users" ON public.asset_maintenance FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.activity_logs;
CREATE POLICY "Allow all for authenticated users" ON public.activity_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Menu Bawaan
INSERT INTO public.menus (name, category, price, status, description) VALUES
  ('Gurame Bakar Panorama', 'Makanan', 65000, 'active', 'Ikan gurame bakar bumbu rempah khas Panorama dengan sambal terasi segar.'),
  ('Ayam Kampung Goreng Kremes', 'Makanan', 38000, 'active', 'Ayam kampung ungkep gurih dengan taburan kremes renyah.'),
  ('Bebek Goreng Sambal Korek', 'Makanan', 45000, 'active', 'Bebek empuk dengan lumuran sambal korek pedas gurih.'),
  ('Tumis Kangkung Terasi', 'Lauk / Tambahan', 18000, 'active', 'Kangkung segar dimasak dengan bumbu terasi wangi.'),
  ('Sayur Asem Khas Sunda', 'Lauk / Tambahan', 15000, 'active', 'Sayur asem segar dengan kuah bening asam manis.'),
  ('Tahu & Tempe Bacem', 'Lauk / Tambahan', 12000, 'active', 'Seporsi tahu dan tempe bacem bumbu legit gurih.'),
  ('Es Jeruk Kelapa Muda', 'Minuman', 18000, 'active', 'Perasan jeruk murni dipadu serutan kelapa muda segar.'),
  ('Es Teh Manis Jumbo', 'Minuman', 8000, 'active', 'Teh melati wangi gula tebu porsi besar.'),
  ('Kopi Tubruk Gula Aren', 'Minuman', 14000, 'active', 'Kopi robusta seduh tradisional pemanis aren cair.')
ON CONFLICT DO NOTHING;

-- Aset Tetap Bawaan
INSERT INTO public.fixed_assets (name, category, purchase_date, purchase_price, condition, location, status, notes) VALUES
  ('Kompor Gas Wok Range 2 Tunggu High Pressure', 'Peralatan Dapur', '2024-03-15', 6500000, 'Baik', 'Dapur Utama', 'active', 'Kondisi api biru stabil, servis berkala tiap 3 bulan.'),
  ('Freezer Box Pembeku Daging 500 Liter (Gea)', 'Pendingin & Elektronik', '2023-11-10', 4800000, 'Baik', 'Ruang Penyimpanan Belakang', 'active', 'Suhu stabil -18C untuk penyimpanan ikan gurame & ayam segar.'),
  ('Set Meja & 4 Kursi Kayu Jati Belanda (10 Set)', 'Mebel & Interior', '2024-01-20', 12000000, 'Baik', 'Area Dine-in Utama', 'active', 'Vernis ulang terakhir Agustus 2026.'),
  ('Kulkas Showcase Minuman 2 Pintu', 'Pendingin & Elektronik', '2024-06-05', 5200000, 'Perlu Perbaikan', 'Area Kasir / Bar Minuman', 'maintenance', 'Lampu LED interior redup dan kipas evaporator bergetar pelan.')
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- GRANT HAK AKSES (MENCEGAH ERROR 42501: permission denied)
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- RLS policies WITH CHECK (true) agar INSERT & UPDATE tidak diblokir
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.cash_transactions;
CREATE POLICY "Allow all for authenticated users" ON public.cash_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.daily_sales;
CREATE POLICY "Allow all for authenticated users" ON public.daily_sales FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.daily_sale_items;
CREATE POLICY "Allow all for authenticated users" ON public.daily_sale_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.menus;
CREATE POLICY "Allow all for authenticated users" ON public.menus FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.cash_accounts;
CREATE POLICY "Allow all for authenticated users" ON public.cash_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.fixed_assets;
CREATE POLICY "Allow all for authenticated users" ON public.fixed_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.asset_maintenance;
CREATE POLICY "Allow all for authenticated users" ON public.asset_maintenance FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.activity_logs;
CREATE POLICY "Allow all for authenticated users" ON public.activity_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
