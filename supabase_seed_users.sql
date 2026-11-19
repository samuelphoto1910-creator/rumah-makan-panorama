-- ==============================================================================
-- SKRIP PEMBERSIHAN DATA & PEMBUATAN AKUN LOGIN RESMI
-- RUMAH MAKAN PANORAMA v3.0
-- ==============================================================================
-- Petunjuk:
-- Salin dan jalankan seluruh query ini di Supabase SQL Editor.
-- Query ini akan:
-- 1. Menghapus seluruh data pengujian/dummy (hanya menyisakan akun login & akun kas bersih).
-- 2. Memperbaiki dan membuat 3 akun pengguna resmi (Owner, Admin, Staff).
-- 3. Mengatur hak akses definitif pada tabel public.profiles.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- LANGKAH 1: BERSIHKAN DATA PENGUJIAN / TRANSAKSI DUMMY
-- ------------------------------------------------------------------------------
TRUNCATE TABLE public.daily_sale_items CASCADE;
TRUNCATE TABLE public.daily_sales CASCADE;
TRUNCATE TABLE public.cash_transactions CASCADE;
TRUNCATE TABLE public.asset_maintenance CASCADE;
TRUNCATE TABLE public.fixed_assets CASCADE;
TRUNCATE TABLE public.activity_logs CASCADE;
TRUNCATE TABLE public.menus CASCADE;

-- ------------------------------------------------------------------------------
-- LANGKAH 2: SIAPKAN AKUN KAS RESMI (Saldo Awal Rp 0)
-- ------------------------------------------------------------------------------
DELETE FROM public.cash_accounts;
INSERT INTO public.cash_accounts (id, name, account_type, initial_balance) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Kas Laci Kasir (Tunai)', 'CASH', 0),
  ('22222222-2222-2222-2222-222222222222', 'Rekening Operasional (BCA)', 'BANK', 0),
  ('33333333-3333-3333-3333-333333333333', 'Settlement QRIS Statis', 'QRIS', 0)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  account_type = EXCLUDED.account_type,
  initial_balance = EXCLUDED.initial_balance;

-- ------------------------------------------------------------------------------
-- LANGKAH 3: BERSIHKAN AKUN AUTH LAMA JIKA ADA
-- ------------------------------------------------------------------------------
DELETE FROM auth.identities WHERE identity_data->>'email' IN ('owner@panorama.com', 'admin@panorama.com', 'staff@panorama.com');
DELETE FROM auth.users WHERE email IN ('owner@panorama.com', 'admin@panorama.com', 'staff@panorama.com');

-- ------------------------------------------------------------------------------
-- LANGKAH 4: BUAT 3 PENGGUNA RESMI DENGAN FIELD LENGKAP SUPABASE (BEBAS ERROR NULL SCAN)
-- Password untuk semua akun: panrama
-- ------------------------------------------------------------------------------

-- 4A. AKUN OWNER (Akses Penuh)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  phone_change,
  phone_change_token,
  email_change_token_current,
  reauthentication_token,
  is_sso_user,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'owner@panorama.com',
  crypt('panorama', gen_salt('bf')),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Pemilik Resto","role":"Owner"}'::jsonb,
  false,
  now(),
  now(),
  '', '', '', '', '', '', '', '',
  false,
  false
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  '{"sub":"a1111111-1111-1111-1111-111111111111","email":"owner@panorama.com"}'::jsonb,
  'email',
  'owner@panorama.com',
  now(),
  now(),
  now()
);

-- 4B. AKUN ADMIN (Akses Operasional Penuh)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  phone_change,
  phone_change_token,
  email_change_token_current,
  reauthentication_token,
  is_sso_user,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b2222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'admin@panorama.com',
  crypt('panorama', gen_salt('bf')),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Admin Pengelola","role":"Admin"}'::jsonb,
  false,
  now(),
  now(),
  '', '', '', '', '', '', '', '',
  false,
  false
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'b2222222-2222-2222-2222-222222222222',
  'b2222222-2222-2222-2222-222222222222',
  '{"sub":"b2222222-2222-2222-2222-222222222222","email":"admin@panorama.com"}'::jsonb,
  'email',
  'admin@panorama.com',
  now(),
  now(),
  now()
);

-- 4C. AKUN STAFF (Pencatatan Penjualan & Lihat Saja)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  phone_change,
  phone_change_token,
  email_change_token_current,
  reauthentication_token,
  is_sso_user,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'c3333333-3333-3333-3333-333333333333',
  'authenticated',
  'authenticated',
  'staff@panorama.com',
  crypt('panorama', gen_salt('bf')),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Staf Kasir Harian","role":"Staff"}'::jsonb,
  false,
  now(),
  now(),
  '', '', '', '', '', '', '', '',
  false,
  false
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'c3333333-3333-3333-3333-333333333333',
  '{"sub":"c3333333-3333-3333-3333-333333333333","email":"staff@panorama.com"}'::jsonb,
  'email',
  'staff@panorama.com',
  now(),
  now(),
  now()
);

-- ------------------------------------------------------------------------------
-- LANGKAH 5: TETAPKAN HAK AKSES RESMI PADA PUBLIC.PROFILES
-- ------------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name, role) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'owner@panorama.com', 'Pemilik Resto', 'Owner'),
  ('b2222222-2222-2222-2222-222222222222', 'admin@panorama.com', 'Admin Pengelola', 'Admin'),
  ('c3333333-3333-3333-3333-333333333333', 'staff@panorama.com', 'Staf Kasir Harian', 'Staff')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = now();

-- ------------------------------------------------------------------------------
-- VERIFIKASI AKUN YANG BERHASIL DIBUAT
-- ------------------------------------------------------------------------------
SELECT id, email, full_name, role FROM public.profiles ORDER BY role;
