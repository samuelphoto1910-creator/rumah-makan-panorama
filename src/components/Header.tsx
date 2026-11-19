import React from "react";
import { IconMenuBurger } from "./icons";
import { ActiveTab } from "../types";

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenMobileMenu: () => void;
  userRole: "Owner" | "Admin" | "Staff";
  userEmail?: string;
  userName?: string;
  onLogout: () => void;
  currentDateStr: string;
}

const tabTitles: Record<ActiveTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Dashboard Ringkasan",
    subtitle: "Pantau omzet penjualan, saldo kas, dan status pencatatan harian.",
  },
  sales: {
    title: "Pencatatan & Riwayat Penjualan",
    subtitle: "Catat omzet harian dengan Metode A (Per Menu) atau Metode B (Total Harian).",
  },
  menu: {
    title: "Master Daftar Menu",
    subtitle: "Kelola referensi makanan, minuman, harga jual, dan status ketersediaan.",
  },
  income: {
    title: "Pemasukan Lain",
    subtitle: "Catat penerimaan kas di luar transaksi penjualan harian.",
  },
  expense: {
    title: "Pengeluaran Operasional",
    subtitle: "Pencatatan biaya belanja bahan, gaji, utilitas, dan perawatan.",
  },
  cashbook: {
    title: "Buku Kas & Saldo",
    subtitle: "Mutasi arus kas masuk (debit), kas keluar (kredit), dan saldo terkini tiap akun.",
  },
  assets: {
    title: "Pencatatan Aset Tetap",
    subtitle: "Inventarisasi peralatan dapur, pendingin, mebel, dan riwayat perbaikan.",
  },
  reports: {
    title: "Laporan & Rekapitulasi",
    subtitle: "Rekapitulasi penjualan, arus kas, rincian menu terjual, dan ringkasan siap ekspor.",
  },
};

export function Header({
  activeTab,
  onOpenMobileMenu,
  userRole,
  userEmail,
  userName,
  onLogout,
  currentDateStr,
}: HeaderProps) {
  const currentTabInfo = tabTitles[activeTab];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden"
          aria-label="Buka Menu"
        >
          <IconMenuBurger className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-slate-800 leading-tight">
            {currentTabInfo.title}
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block">
            {currentTabInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden md:block">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Tanggal Bisnis
          </p>
          <p className="text-sm font-semibold text-slate-800">{currentDateStr}</p>
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs border border-amber-300">
            {userRole.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">
              {userName || userEmail || "RM Panorama"}
            </p>
            <span className="inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
              Role: {userRole}
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="ml-2 px-2.5 py-1.5 rounded-md text-[11px] font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
            title="Keluar dari sesi ini"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
