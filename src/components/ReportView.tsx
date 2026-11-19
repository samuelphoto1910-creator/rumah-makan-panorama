import React, { useState } from "react";
import { DailySale, CashTransaction, CashAccount } from "../types";
import { IconFileText } from "./icons";

interface ReportViewProps {
  sales: DailySale[];
  transactions: CashTransaction[];
  cashAccounts: CashAccount[];
}

export function ReportView({ sales, transactions, cashAccounts }: ReportViewProps) {
  const [reportType, setReportType] = useState<"sales" | "cashflow" | "menu">("sales");
  const [selectedMonth, setSelectedMonth] = useState("2026-11");

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Filter sales for the selected month and status ACTIVE
  const monthSales = sales.filter(
    (s) => s.status === "ACTIVE" && s.businessDate.startsWith(selectedMonth)
  );

  // Primary Omzet Only (PRD 11.2)
  const primarySales = monthSales.filter((s) => s.recordType === "PRIMARY");
  const comparisonSales = monthSales.filter((s) => s.recordType === "COMPARISON");

  const totalPrimaryOmzet = primarySales.reduce((sum, s) => sum + s.reportedTotal, 0);

  // Filter transactions for the selected month
  const monthTx = transactions.filter(
    (t) => t.status === "ACTIVE" && t.transactionDate.startsWith(selectedMonth)
  );

  const totalIn = monthTx.filter((t) => t.direction === "IN").reduce((sum, t) => sum + t.amount, 0);
  const totalOut = monthTx.filter((t) => t.direction === "OUT").reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalIn - totalOut;

  // Menu sales aggregated (ONLY from PER_MENU records - PRD 11.2)
  const menuSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  monthSales
    .filter((s) => s.recordingMethod === "PER_MENU" && s.items)
    .forEach((s) => {
      s.items?.forEach((it) => {
        if (!menuSalesMap[it.menuId]) {
          menuSalesMap[it.menuId] = {
            name: it.menuNameSnapshot,
            qty: 0,
            revenue: 0,
          };
        }
        menuSalesMap[it.menuId].qty += it.quantity;
        menuSalesMap[it.menuId].revenue += it.subtotal;
      });
    });

  const menuReportList = Object.values(menuSalesMap).sort((a, b) => b.qty - a.qty);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (reportType === "sales") {
      csvContent += "Tanggal,Metode,Tipe,Total Omzet,Status,Pencatat\n";
      monthSales.forEach((s) => {
        csvContent += `"${s.businessDate}","${s.recordingMethod}","${s.recordType}","${s.reportedTotal}","${s.status}","${s.createdBy}"\n`;
      });
    } else if (reportType === "cashflow") {
      csvContent += "Tanggal,Kategori,Deskripsi,Arah,Nominal,Pencatat\n";
      monthTx.forEach((t) => {
        csvContent += `"${t.transactionDate}","${t.categoryName}","${t.description}","${t.direction}","${t.amount}","${t.createdBy}"\n`;
      });
    } else {
      csvContent += "Nama Menu,Kuantitas Porsi Terjual,Total Nilai Penjualan\n";
      menuReportList.forEach((m) => {
        csvContent += `"${m.name}","${m.qty}","${m.revenue}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_panorama_${reportType}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Action */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <IconFileText className="w-5 h-5 text-amber-600" />
            <span>Laporan Rekapitulasi & Ekspor Data</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekap omzet, rincian kuantitas per menu, dan arus kas bulanan sesuai aturan PRD 11.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors"
          >
            Cetak / PDF
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Ekspor Excel (CSV)
          </button>
        </div>
      </div>

      {/* Filter and Tab Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
          {[
            { id: "sales", label: "Rekap Penjualan" },
            { id: "menu", label: "Detail Penjualan Per Menu" },
            { id: "cashflow", label: "Rekap Arus Kas" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReportType(tab.id as typeof reportType)}
              className={`px-3.5 py-2 rounded-lg font-semibold transition-colors ${
                reportType === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Pilih Bulan:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold p-2 rounded-lg border border-slate-300 bg-white"
          />
        </div>
      </div>

      {/* Report Content based on Selected Tab */}
      {reportType === "sales" && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total Omzet Laporan Utama</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatIDR(totalPrimaryOmzet)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {primarySales.length} hari catatan acuan utama
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Catatan Pembanding</span>
              <p className="text-xl font-bold text-slate-600 mt-1">
                {comparisonSales.length} Catatan
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tidak digabungkan ke total omzet (PRD 11.2)
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Rata-rata Omzet / Hari Aktif</span>
              <p className="text-xl font-bold text-emerald-700 mt-1">
                {primarySales.length > 0
                  ? formatIDR(totalPrimaryOmzet / primarySales.length)
                  : formatIDR(0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Performa harian bulan berjalan</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Rincian Rekap Penjualan Bulan {selectedMonth}
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Tanggal Bisnis</th>
                    <th className="py-3 px-4">Metode</th>
                    <th className="py-3 px-4">Tipe Catatan</th>
                    <th className="py-3 px-4 text-right">Nilai Omzet</th>
                    <th className="py-3 px-4">Pencatat</th>
                    <th className="py-3 px-4">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{s.businessDate}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {s.recordingMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.recordType === "PRIMARY"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {s.recordType === "PRIMARY" ? "Acuan Utama" : "Pembanding"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatIDR(s.reportedTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{s.createdBy}</td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{s.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === "menu" && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <strong>Catatan Validasi Data (PRD 11.2):</strong> Rekap kuantitas menu terlaris hanya
            dihitung dari transaksi dengan <strong>Metode A (Per Menu)</strong>. Transaksi total
            harian tanpa rincian tidak mempengaruhi perhitungan kuantitas item.
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Detail Menu Terjual Bulan {selectedMonth}
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Peringkat</th>
                    <th className="py-3 px-4">Nama Menu</th>
                    <th className="py-3 px-4 text-right">Kuantitas Terjual</th>
                    <th className="py-3 px-4 text-right">Total Nilai Penjualan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {menuReportList.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{m.name}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-800">
                        {m.qty} porsi
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatIDR(m.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === "cashflow" && (
        <div className="space-y-4">
          {/* Cashflow KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total Kas Masuk (Debit)</span>
              <p className="text-xl font-bold text-emerald-700 mt-1">{formatIDR(totalIn)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total Kas Keluar (Kredit)</span>
              <p className="text-xl font-bold text-rose-700 mt-1">{formatIDR(totalOut)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Surplus / Defisit Kas</span>
              <p
                className={`text-xl font-bold mt-1 ${
                  netCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {formatIDR(netCashFlow)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Mutasi Kas Bulan {selectedMonth}
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Deskripsi</th>
                    <th className="py-3 px-4">Arah</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthTx.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{tx.transactionDate}</td>
                      <td className="py-3.5 px-4 text-slate-600">{tx.categoryName}</td>
                      <td className="py-3.5 px-4 text-slate-800 max-w-sm">{tx.description}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.direction === "IN"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {tx.direction === "IN" ? "Masuk" : "Keluar"}
                        </span>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold ${
                          tx.direction === "IN" ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {formatIDR(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
