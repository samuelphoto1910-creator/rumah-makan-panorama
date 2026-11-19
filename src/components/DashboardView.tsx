import React, { useState } from "react";
import { DailySale, CashTransaction, CashAccount, MenuItem, FixedAsset, ActiveTab } from "../types";
import { IconAlertTriangle, IconReceipt, IconWallet, IconUtensils, IconArrowUpRight, IconArrowDownLeft } from "./icons";

interface DashboardViewProps {
  sales: DailySale[];
  transactions: CashTransaction[];
  cashAccounts: CashAccount[];
  menus: MenuItem[];
  assets: FixedAsset[];
  setActiveTab: (tab: ActiveTab) => void;
  onNavigateToRecordSale: () => void;
}

export function DashboardView({
  sales,
  transactions,
  cashAccounts,
  menus,
  assets,
  setActiveTab,
  onNavigateToRecordSale,
}: DashboardViewProps) {
  const [period, setPeriod] = useState<"today" | "yesterday" | "7days" | "month">("today");

  // Format IDR currency
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Check for potential duplicate records on the same date (Reconciliation alert from PRD 4.4)
  const salesByDate: Record<string, DailySale[]> = {};
  sales.forEach((s) => {
    if (s.status === "ACTIVE") {
      if (!salesByDate[s.businessDate]) {
        salesByDate[s.businessDate] = [];
      }
      salesByDate[s.businessDate].push(s);
    }
  });

  const datesWithDuplicates = Object.keys(salesByDate).filter((date) => {
    const list = salesByDate[date];
    const hasPerMenu = list.some((item) => item.recordingMethod === "PER_MENU");
    const hasDailyTotal = list.some((item) => item.recordingMethod === "DAILY_TOTAL");
    return hasPerMenu && hasDailyTotal;
  });

  // Calculate Primary Revenue (only PRIMARY records to prevent double counting - PRD 4.4)
  const primarySales = sales.filter((s) => s.status === "ACTIVE" && s.recordType === "PRIMARY");

  const todayStr = "2026-11-18";
  const yesterdayStr = "2026-11-17";

  const todaySalesTotal = primarySales
    .filter((s) => s.businessDate === todayStr)
    .reduce((sum, s) => sum + s.reportedTotal, 0);

  const monthSalesTotal = primarySales
    .filter((s) => s.businessDate.startsWith("2026-11"))
    .reduce((sum, s) => sum + s.reportedTotal, 0);

  const activeDaysCount = new Set(primarySales.map((s) => s.businessDate)).size;

  // Total Other Income & Total Expenses
  const activeTransactions = transactions.filter((t) => t.status === "ACTIVE");
  const totalOtherIncome = activeTransactions
    .filter((t) => t.direction === "IN" && t.sourceType !== "SALES")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = activeTransactions
    .filter((t) => t.direction === "OUT")
    .reduce((sum, t) => sum + t.amount, 0);

  // Compute Current Balances per Account (Initial + In - Out)
  const accountBalances = cashAccounts.map((acc) => {
    const inTotal = activeTransactions
      .filter((t) => t.cashAccountId === acc.id && t.direction === "IN")
      .reduce((sum, t) => sum + t.amount, 0);
    const outTotal = activeTransactions
      .filter((t) => t.cashAccountId === acc.id && t.direction === "OUT")
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = acc.initialBalance + inTotal - outTotal;
    return { ...acc, currentBalance: balance };
  });

  const totalAllCash = accountBalances.reduce((sum, acc) => sum + acc.currentBalance, 0);

  // Calculate Top Selling Items ONLY from PER_MENU records (PRD 4.2 & 11.2)
  const itemCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};
  sales
    .filter((s) => s.status === "ACTIVE" && s.recordingMethod === "PER_MENU" && s.items)
    .forEach((s) => {
      s.items?.forEach((item) => {
        if (!itemCounts[item.menuId]) {
          itemCounts[item.menuId] = {
            name: item.menuNameSnapshot,
            quantity: 0,
            revenue: 0,
          };
        }
        itemCounts[item.menuId].quantity += item.quantity;
        itemCounts[item.menuId].revenue += item.subtotal;
      });
    });

  const topSellingList = Object.values(itemCounts)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const activeMenuCount = menus.filter((m) => m.status === "active").length;
  const activeAssetCount = assets.filter((a) => a.status === "active").length;

  return (
    <div className="space-y-6">
      {/* Alert banner if date has both PER_MENU and DAILY_TOTAL (PRD 4.4 Rule) */}
      {datesWithDuplicates.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
          <IconAlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">
              Perhatian Rekonsiliasi Omzet Ganda ({datesWithDuplicates.length} tanggal terdeteksi)
            </p>
            <p className="text-amber-800 text-xs mt-0.5">
              Pada tanggal <strong>{datesWithDuplicates.join(", ")}</strong> terdapat catatan{" "}
              <em>Per Menu</em> dan <em>Total Harian</em>. Sesuai aturan PRD, angka omzet kedua
              metode tidak otomatis dijumlahkan agar tidak terhitung ganda. Pastikan salah satu
              ditetapkan sebagai catatan pembanding (<em>COMPARISON</em>).
            </p>
          </div>
        </div>
      )}

      {/* Period Filter Tabs & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
          <span className="text-slate-400 font-semibold px-2">Periode:</span>
          {[
            { id: "today", label: "Hari Ini" },
            { id: "yesterday", label: "Kemarin" },
            { id: "7days", label: "7 Hari Terakhir" },
            { id: "month", label: "Bulan Ini (Nov)" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id as typeof period)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                period === item.id
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onNavigateToRecordSale}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <IconReceipt className="w-4 h-4" />
          <span>+ Catat Penjualan Baru</span>
        </button>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omzet Hari Ini */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Omzet Hari Ini</span>
            <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
              <IconReceipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900">{formatIDR(todaySalesTotal)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Berdasarkan acuan omzet utama 18 Nov 2026
          </p>
        </div>

        {/* Omzet Bulan Ini */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Omzet Bulan Berjalan</span>
            <span className="p-1.5 rounded-md bg-blue-50 text-blue-700">
              <IconReceipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900">{formatIDR(monthSalesTotal)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Tercatat di {activeDaysCount} hari aktif penjualan
          </p>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Pengeluaran</span>
            <span className="p-1.5 rounded-md bg-rose-50 text-rose-700">
              <IconArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-rose-900">{formatIDR(totalExpense)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Belanja bahan & biaya operasional</p>
        </div>

        {/* Total Saldo Kas Tersedia */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Saldo Kas Riil</span>
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-700">
              <IconWallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900">{formatIDR(totalAllCash)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Gabungan kas tunai, bank, & QRIS</p>
        </div>
      </div>

      {/* 2 Columns: Account Balances & Top Selling Menu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kas Berdasarkan Akun */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-1">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <IconWallet className="w-4 h-4 text-amber-600" />
              <span>Saldo Kas per Akun</span>
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab("cashbook")}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              Lihat Buku Kas →
            </button>
          </div>

          <div className="space-y-3">
            {accountBalances.map((acc) => (
              <div
                key={acc.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800">{acc.name}</p>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                    Tipe: {acc.accountType}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {formatIDR(acc.currentBalance)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Master Terdaftar:</span>
            <div className="flex items-center gap-3 font-semibold text-slate-700">
              <span>{activeMenuCount} Menu</span>
              <span>•</span>
              <span>{activeAssetCount} Aset</span>
            </div>
          </div>
        </div>

        {/* Menu Terlaris (Khusus Per Menu - PRD 4.2) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <IconUtensils className="w-4 h-4 text-emerald-600" />
                <span>Menu Terlaris (Kuantitas Terjual)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Hanya dihitung dari transaksi metode <strong>Pencatatan Per Menu</strong> sesuai
                PRD 4.2
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("menu")}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Master Menu →
            </button>
          </div>

          {topSellingList.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Belum ada data penjualan per menu yang dicatat.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="py-2 px-1">Menu</th>
                    <th className="py-2 text-right">Terjual</th>
                    <th className="py-2 text-right">Total Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topSellingList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-1 font-medium text-slate-800">
                        <span className="w-4 inline-block font-semibold text-slate-400">
                          {idx + 1}.
                        </span>
                        {item.name}
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900">
                        {item.quantity} porsi
                      </td>
                      <td className="py-2.5 text-right text-slate-700 font-medium">
                        {formatIDR(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Riwayat Penjualan Terbaru */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Catatan Penjualan Terakhir</h3>
            <p className="text-xs text-slate-500">
              Menampilkan rincian metode pencatatan yang digunakan
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("sales")}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
          >
            Buka Riwayat Lengkap
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Metode Pencatatan</th>
                <th className="py-2.5 px-3">Tipe Catatan</th>
                <th className="py-2.5 px-3 text-right">Total Nilai</th>
                <th className="py-2.5 px-3">Pencatat</th>
                <th className="py-2.5 px-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.slice(0, 5).map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-semibold text-slate-800">{sale.businessDate}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        sale.recordingMethod === "PER_MENU"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {sale.recordingMethod === "PER_MENU" ? "Metode A (Per Menu)" : "Metode B (Total Harian)"}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        sale.recordType === "PRIMARY"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-600 border border-slate-300"
                      }`}
                    >
                      {sale.recordType === "PRIMARY" ? "Acuan Utama" : "Pembanding"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {formatIDR(sale.reportedTotal)}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{sale.createdBy}</td>
                  <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{sale.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
