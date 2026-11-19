import React from "react";
import { ActiveTab } from "../types";
import {
  IconDashboard,
  IconReceipt,
  IconUtensils,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconWallet,
  IconBox,
  IconFileText,
  IconClose,
} from "./icons";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  userRole: "Owner" | "Admin" | "Staff";
  userEmail?: string;
  userName?: string;
  onLogout?: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  userRole,
  userEmail,
  userName,
  onLogout,
}: SidebarProps) {
  // All navigation items
  const allMenuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string; roles: ("Owner" | "Admin" | "Staff")[] }[] = [
    { id: "dashboard", label: "Dashboard", icon: <IconDashboard />, roles: ["Owner", "Admin", "Staff"] },
    { id: "sales", label: "Penjualan", icon: <IconReceipt />, badge: "2 Metode", roles: ["Owner", "Admin", "Staff"] },
    { id: "menu", label: "Daftar Menu", icon: <IconUtensils />, roles: ["Owner", "Admin", "Staff"] },
    { id: "income", label: "Pemasukan Lain", icon: <IconArrowDownLeft />, roles: ["Owner", "Admin"] },
    { id: "expense", label: "Pengeluaran", icon: <IconArrowUpRight />, roles: ["Owner", "Admin"] },
    { id: "cashbook", label: "Buku Kas", icon: <IconWallet />, roles: ["Owner", "Admin"] },
    { id: "assets", label: "Aset Tetap", icon: <IconBox />, roles: ["Owner", "Admin", "Staff"] },
    { id: "reports", label: "Laporan & Ekspor", icon: <IconFileText />, roles: ["Owner", "Admin"] },
  ];

  // Filter menu strictly by user role (no simulation)
  const accessibleMenuItems = allMenuItems.filter((item) => item.roles.includes(userRole));

  const roleLabel =
    userRole === "Owner"
      ? "Pemilik (Akses Penuh)"
      : userRole === "Admin"
      ? "Admin (Operasional Penuh)"
      : "Staf (Pencatatan Harian)";

  const roleColor =
    userRole === "Owner"
      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
      : userRole === "Admin"
      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Sistem Pencatatan
              </span>
            </div>
            <h1 className="text-lg font-bold text-white mt-0.5 tracking-tight">
              RM Panorama
            </h1>
          </div>
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => setIsOpen(false)}
            aria-label="Tutup Menu"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        {/* Real User Role Badge (Locked - No Simulation) */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Hak Akses Terverifikasi:
          </span>
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold border ${roleColor}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {userRole}
            </span>
            <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
              {userName || userEmail?.split("@")[0] || ""}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {roleLabel}
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {accessibleMenuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-amber-600/90 text-white font-semibold shadow-xs"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? "text-white" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-300">Rumah Makan Panorama</p>
              <p className="text-[11px] text-slate-400">v3.0 • Asia/Jakarta (WIB)</p>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-[11px] font-semibold transition-colors"
                title="Keluar dari sesi"
              >
                Keluar
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
