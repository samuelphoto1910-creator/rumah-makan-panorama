"use client";

import React, { useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!supabase) {
      setErrorMsg(
        "Kredensial Supabase belum terisi di .env.local! Periksa NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Email atau kata sandi salah. Silakan periksa kembali.");
        } else if (error.message.includes("Email not confirmed")) {
          throw new Error(
            "Akun ini belum dikonfirmasi. Harap centang 'Auto Confirm User' saat membuat akun di Supabase."
          );
        }
        throw error;
      }

      if (data.session) {
        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || "Gagal melakukan proses login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block"></span>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Sistem Pencatatan
          </span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
          Rumah Makan Panorama
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Masuk untuk mengakses pembukuan dan administrasi resto
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 text-slate-900 border border-slate-200">
          <div className="border-b border-slate-200 pb-3 mb-5">
            <h3 className="text-base font-bold text-slate-900">
              Masuk ke Sistem
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan akun resmi staf, admin, atau pemilik yang terdaftar
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed">
              <strong>Gagal Masuk:</strong> {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Pengguna *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kata Sandi *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "Memverifikasi..." : "Masuk ke Sistem"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
            Terhubung ke Supabase Database
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          © 2026 Rumah Makan Panorama • Hak Cipta Dilindungi
        </p>
      </div>
    </div>
  );
}
