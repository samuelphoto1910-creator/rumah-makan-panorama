import React, { useState } from "react";
import { CashTransaction, CashAccount } from "../types";
import { IconWallet, IconArrowDownLeft, IconArrowUpRight } from "./icons";

interface CashBookViewProps {
  transactions: CashTransaction[];
  cashAccounts: CashAccount[];
}

export function CashBookView({ transactions, cashAccounts }: CashBookViewProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("ALL");
  const [filterDirection, setFilterDirection] = useState<"ALL" | "IN" | "OUT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Active transactions sorted chronologically
  const activeTx = [...transactions]
    .filter((t) => t.status === "ACTIVE")
    .sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

  // Compute Balances per Account (Laci, Bank, QRIS)
  const accountStats = cashAccounts.map((acc) => {
    const inTotal = activeTx
      .filter((t) => t.cashAccountId === acc.id && t.direction === "IN")
      .reduce((sum, t) => sum + t.amount, 0);
    const outTotal = activeTx
      .filter((t) => t.cashAccountId === acc.id && t.direction === "OUT")
      .reduce((sum, t) => sum + t.amount, 0);
    const currentBalance = acc.initialBalance + inTotal - outTotal;
    return {
      ...acc,
      inTotal,
      outTotal,
      currentBalance,
    };
  });

  const totalAllBalance = accountStats.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const totalAllIn = activeTx.filter((t) => t.direction === "IN").reduce((sum, t) => sum + t.amount, 0);
  const totalAllOut = activeTx.filter((t) => t.direction === "OUT").reduce((sum, t) => sum + t.amount, 0);

  // Compute Running Balance
  let running = 0;
  if (selectedAccountId !== "ALL") {
    const acc = cashAccounts.find((a) => a.id === selectedAccountId);
    running = acc ? acc.initialBalance : 0;
  } else {
    running = cashAccounts.reduce((sum, a) => sum + a.initialBalance, 0);
  }

  const rowsWithBalance = activeTx
    .filter((t) => selectedAccountId === "ALL" || t.cashAccountId === selectedAccountId)
    .map((tx) => {
      if (tx.direction === "IN") {
        running += tx.amount;
      } else {
        running -= tx.amount;
      }
      return {
        ...tx,
        runningBalance: running,
      };
    });

  // Filtered rows for display
  const displayRows = rowsWithBalance.filter((row) => {
    if (filterDirection === "IN" && row.direction !== "IN") return false;
    if (filterDirection === "OUT" && row.direction !== "OUT") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDesc = row.description.toLowerCase().includes(q);
      const matchCat = row.categoryName.toLowerCase().includes(q);
      if (!matchDesc && !matchCat) return false;
    }
    return true;
  });

  // Display newest transactions first in the table for quick reading
  const tableRows = [...displayRows].reverse();

  return (
    <div className="space-y-6">
      {/* 1. Header Ringkasan Ramah Orang Awam */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <IconWallet className="w-5 h-5 text-amber-600" />
            <span>Buku Kas Keluar & Masuk</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan uang masuk dan uang keluar yang mudah dibaca siapa saja tanpa perlu paham akuntansi.
          </p>
        </div>
      </div>

      {/* 2. Kartu Besar: Total Sisa Uang, Uang Masuk, Uang Keluar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Sisa Uang Resto */}
        <div className="p-5 rounded-xl bg-slate-900 text-white shadow-xs border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Sisa Uang Resto Saat Ini
            </span>
            <span className="p-1.5 rounded-md bg-slate-800 text-amber-400">
              <IconWallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-1">
            {formatIDR(totalAllBalance)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total saldo nyata siap pakai (Laci Kasir + Bank + QRIS)
          </p>
        </div>

        {/* Total Uang Masuk */}
        <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Uang Masuk (+)
            </span>
            <span className="p-1.5 rounded-md bg-emerald-100 text-emerald-800">
              <IconArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            +{formatIDR(totalAllIn)}
          </div>
          <p className="text-[11px] text-emerald-800 mt-1">
            Dari omzet penjualan resto & pemasukan lain
          </p>
        </div>

        {/* Total Uang Keluar */}
        <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 shadow-xs">
          <div className="flex items-center justify-between text-rose-800 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Uang Keluar (-)
            </span>
            <span className="p-1.5 rounded-md bg-rose-100 text-rose-800">
              <IconArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">
            -{formatIDR(totalAllOut)}
          </div>
          <p className="text-[11px] text-rose-800 mt-1">
            Belanja bahan, gaji staf, listrik, gas & operasional
          </p>
        </div>
      </div>

      {/* 3. Tempat Penyimpanan Uang (Bisa Diklik Sederhana) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Tempat Penyimpanan Uang:
          </span>
          {selectedAccountId !== "ALL" && (
            <button
              type="button"
              onClick={() => setSelectedAccountId("ALL")}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline"
            >
              Tampilkan Semua Penyimpanan
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          {/* Tombol Semua */}
          <button
            type="button"
            onClick={() => setSelectedAccountId("ALL")}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedAccountId === "ALL"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
            }`}
          >
            <span className="text-[10px] font-semibold opacity-75 block">Semua Gabungan</span>
            <span className="text-sm font-bold block mt-0.5">{formatIDR(totalAllBalance)}</span>
          </button>

          {/* Kotak Per Akun */}
          {accountStats.map((acc) => {
            const isSelected = selectedAccountId === acc.id;
            const iconBadge = acc.accountType === "CASH" ? "💵" : acc.accountType === "BANK" ? "🏦" : "📱";

            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => setSelectedAccountId(isSelected ? "ALL" : acc.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs truncate">
                    {iconBadge} {acc.name}
                  </span>
                </div>
                <div className="text-sm font-bold mt-1">
                  {formatIDR(acc.currentBalance)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Filter Praktis (Uang Masuk / Keluar / Cari) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {/* Tab Filter Sederhana */}
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilterDirection("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterDirection === "ALL"
                ? "bg-slate-900 text-white font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua Catatan
          </button>
          <button
            type="button"
            onClick={() => setFilterDirection("IN")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              filterDirection === "IN"
                ? "bg-emerald-700 text-white font-bold"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <span>🟢 Uang Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterDirection("OUT")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              filterDirection === "OUT"
                ? "bg-rose-700 text-white font-bold"
                : "bg-rose-50 text-rose-800 hover:bg-rose-100"
            }`}
          >
            <span>🔴 Uang Keluar</span>
          </button>
        </div>

        {/* Kotak Cari Catatan */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Cari catatan (misal: sayur, bon, ayam)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
          />
        </div>
      </div>

      {/* 5. Tabel Catatan Keluar Masuk Uang Ramah Orang Awam */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Keperluan / Keterangan</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Tempat Uang</th>
                <th className="py-3 px-4 text-right text-emerald-800">Uang Masuk (+)</th>
                <th className="py-3 px-4 text-right text-rose-800">Uang Keluar (-)</th>
                <th className="py-3 px-4 text-right">Sisa Uang (Saldo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada catatan yang sesuai dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => {
                  const isIncoming = row.direction === "IN";
                  const account = cashAccounts.find((a) => a.id === row.cashAccountId);

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {row.transactionDate}
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 font-bold max-w-sm">
                        {row.description}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {row.categoryName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {account?.name || "Kas Resto"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                        {isIncoming ? `+ ${formatIDR(row.amount)}` : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-rose-700 whitespace-nowrap">
                        {!isIncoming ? `- ${formatIDR(row.amount)}` : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 bg-slate-50/60 whitespace-nowrap">
                        {formatIDR(row.runningBalance)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
          <span>* Catatan terbaru ditampilkan di bagian paling atas agar mudah dilihat.</span>
          <span className="font-semibold text-slate-700">Total {displayRows.length} Catatan</span>
        </div>
      </div>
    </div>
  );
}
