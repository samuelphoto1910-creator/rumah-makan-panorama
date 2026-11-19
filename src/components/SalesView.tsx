import React, { useState } from "react";
import { DailySale, DailySaleItem, MenuItem, RecordingMethod } from "../types";
import { DEFAULT_CASH_ACCOUNT_IDS } from "../data/mockData";
import { IconReceipt, IconPlus, IconTrash, IconCheck } from "./icons";

interface SalesViewProps {
  sales: DailySale[];
  menus: MenuItem[];
  onAddSale: (sale: DailySale) => void;
  onCancelSale: (saleId: string, reason: string) => void;
  userRole: "Owner" | "Admin" | "Staff";
}

export function SalesView({
  sales,
  menus,
  onAddSale,
  onCancelSale,
  userRole,
}: SalesViewProps) {
  // Mode toggle: Recording Form vs History List
  const [activeSubTab, setActiveSubTab] = useState<"record" | "history">("record");

  // Form State
  const [method, setMethod] = useState<RecordingMethod>("PER_MENU");
  const [businessDate, setBusinessDate] = useState("2026-11-19");
  const [creditAmountInput, setCreditAmountInput] = useState<number | "">(""); // Diskon / Retur
  const [isComparisonOnly, setIsComparisonOnly] = useState(false); // Draf / Rekap Pembanding
  const [notes, setNotes] = useState("");
  const [dailyTotalInput, setDailyTotalInput] = useState<number | "">("");

  // Method A Items State
  const [cartItems, setCartItems] = useState<{ menuId: string; quantity: number }[]>([
    { menuId: menus[0]?.id || "", quantity: 10 },
  ]);

  // Selected Sale for Detail Modal & Cancel Modal
  const [selectedDetailSale, setSelectedDetailSale] = useState<DailySale | null>(null);
  const [cancelModalSaleId, setCancelModalSaleId] = useState<string | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState("");

  // Filter state for history
  const [filterMethod, setFilterMethod] = useState<string>("ALL");
  const [filterDate, setFilterDate] = useState<string>("");

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Compute calculated subtotal and total for Method A
  const computedItems: (DailySaleItem & { price: number })[] = cartItems.map((item, idx) => {
    const menuObj = menus.find((m) => m.id === item.menuId);
    const price = menuObj ? menuObj.price : 0;
    const name = menuObj ? menuObj.name : "Menu tidak diketahui";
    const subtotal = price * (item.quantity > 0 ? item.quantity : 0);
    return {
      id: `temp-${idx}`,
      dailySaleId: "",
      menuId: item.menuId,
      menuNameSnapshot: name,
      unitPriceSnapshot: price,
      quantity: item.quantity,
      subtotal,
      price,
    };
  });

  const computedTotalPerMenu = computedItems.reduce((acc, curr) => acc + curr.subtotal, 0);

  // Debit (Omzet Kotor), Kredit (Potongan/Diskon), Net (Kas Bersih)
  const grossDebit = method === "PER_MENU" ? computedTotalPerMenu : Number(dailyTotalInput) || 0;
  const creditDeduction = Number(creditAmountInput) || 0;
  const netAmount = Math.max(0, grossDebit - creditDeduction);

  const handleAddItemRow = () => {
    const firstActive = menus.find((m) => m.status === "active") || menus[0];
    setCartItems([...cartItems, { menuId: firstActive?.id || "", quantity: 1 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (cartItems.length <= 1) return;
    setCartItems(cartItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: "menuId" | "quantity", value: string | number) => {
    const updated = [...cartItems];
    if (field === "menuId") {
      updated[idx].menuId = value as string;
    } else {
      updated[idx].quantity = Math.max(1, Number(value) || 1);
    }
    setCartItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let saleItems: DailySaleItem[] | undefined = undefined;

    if (method === "PER_MENU") {
      if (computedItems.length === 0 || computedTotalPerMenu <= 0) {
        alert("Harap masukkan minimal satu menu dengan porsi yang valid.");
        return;
      }
      saleItems = computedItems.map((item, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        dailySaleId: "",
        menuId: item.menuId,
        menuNameSnapshot: item.menuNameSnapshot,
        unitPriceSnapshot: item.unitPriceSnapshot,
        quantity: item.quantity,
        subtotal: item.subtotal,
      }));
    } else {
      const parsedTotal = Number(dailyTotalInput);
      if (!parsedTotal || parsedTotal <= 0) {
        alert("Harap masukkan total omzet penjualan yang valid.");
        return;
      }
    }

    const newSaleId = `sale-${Date.now()}`;
    if (saleItems) {
      saleItems.forEach((it) => (it.dailySaleId = newSaleId));
    }

    const newSale: DailySale = {
      id: newSaleId,
      businessDate,
      recordingMethod: method,
      recordType: isComparisonOnly ? "COMPARISON" : "PRIMARY",
      isComparisonOnly,
      cashAccountId: DEFAULT_CASH_ACCOUNT_IDS.CASH, // Default Kas Laci Tunai Resto
      debitAmount: grossDebit,
      creditAmount: creditDeduction,
      netAmount,
      reportedTotal: netAmount,
      notes: notes.trim() || undefined,
      createdBy: userRole,
      createdAt: new Date().toISOString(),
      status: "ACTIVE",
      items: saleItems,
    };

    onAddSale(newSale);
    alert("Catatan penjualan berhasil disimpan!");
    setActiveSubTab("history");
    setNotes("");
    setDailyTotalInput("");
    setCreditAmountInput("");
    setIsComparisonOnly(false);
  };

  // Filtered sales history
  const filteredSales = sales.filter((s) => {
    if (filterMethod !== "ALL" && s.recordingMethod !== filterMethod) return false;
    if (filterDate && s.businessDate !== filterDate) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Nav Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab("record")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeSubTab === "record"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Form Input Penjualan
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("history")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeSubTab === "history"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Riwayat Penjualan ({sales.length})
        </button>
      </div>

      {activeSubTab === "record" ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header info */}
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Catat Penjualan Restoran
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Masukkan penjualan harian yang langsung tercatat ke dalam kas masuk resto.
              </p>
            </div>

            {/* Date Selection */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Penjualan *
              </label>
              <input
                type="date"
                value={businessDate}
                onChange={(e) => setBusinessDate(e.target.value)}
                className="w-full sm:w-72 text-xs font-semibold p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-slate-900"
                required
              />
            </div>

            {/* Method Chooser */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Pilih Cara Catat Penjualan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    method === "PER_MENU"
                      ? "border-emerald-600 bg-emerald-50/50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value="PER_MENU"
                    checked={method === "PER_MENU"}
                    onChange={() => setMethod("PER_MENU")}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Metode A: Rincian Per Menu
                    </span>
                    {method === "PER_MENU" && (
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <IconCheck className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pilih nama makanan/minuman dan kuantitas porsi terjual (otomatis hitung menu terlaris).
                  </p>
                </label>

                <label
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    method === "DAILY_TOTAL"
                      ? "border-amber-600 bg-amber-50/50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="method"
                    value="DAILY_TOTAL"
                    checked={method === "DAILY_TOTAL"}
                    onChange={() => setMethod("DAILY_TOTAL")}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Metode B: Total Omzet Langsung
                    </span>
                    {method === "DAILY_TOTAL" && (
                      <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center">
                        <IconCheck className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Cukup masukkan 1 angka total omzet dari rekapan bon kasir tanpa rincian per porsi.
                  </p>
                </label>
              </div>
            </div>

            {/* Form Fields: Method A (Per Menu) */}
            {method === "PER_MENU" && (
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Daftar Menu Terjual
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <IconPlus className="w-3.5 h-3.5" />
                    <span>Tambah Menu</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {cartItems.map((cartItem, idx) => {
                    const currentMenu = menus.find((m) => m.id === cartItem.menuId);
                    const subtotal = (currentMenu?.price || 0) * cartItem.quantity;

                    return (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200"
                      >
                        <div className="flex-1 w-full sm:w-auto">
                          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                            Pilih Menu (#{idx + 1})
                          </label>
                          <select
                            value={cartItem.menuId}
                            onChange={(e) => handleItemChange(idx, "menuId", e.target.value)}
                            className="w-full text-xs font-semibold p-2 rounded border border-slate-300 bg-white"
                          >
                            {menus.map((m) => (
                              <option key={m.id} value={m.id} disabled={m.status === "inactive"}>
                                {m.name} ({formatIDR(m.price)}) {m.status === "inactive" ? "- [Nonaktif]" : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-full sm:w-28">
                          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                            Porsi
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={cartItem.quantity}
                            onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                            className="w-full text-xs font-bold p-2 rounded border border-slate-300 bg-white text-right"
                            required
                          />
                        </div>

                        <div className="w-full sm:w-36 text-right">
                          <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                            Subtotal (Debit)
                          </label>
                          <div className="text-xs font-bold text-slate-900 py-2">
                            {formatIDR(subtotal)}
                          </div>
                        </div>

                        <div className="pt-4 sm:pt-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            disabled={cartItems.length <= 1}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Hapus baris"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Form Fields: Method B (Daily Total) */}
            {method === "DAILY_TOTAL" && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Penjualan Kotor (Debit Kas) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={dailyTotalInput}
                      onChange={(e) => setDailyTotalInput(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Contoh: 3500000"
                      className="w-full text-base font-bold pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-slate-900"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Debit & Kredit Calculation Breakdown */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Rincian Kas Penjualan
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Debit */}
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] font-semibold text-emerald-800 block">
                    + Uang Masuk / Debit (Kotor)
                  </span>
                  <span className="text-base font-bold text-slate-900 mt-1 block">
                    {formatIDR(grossDebit)}
                  </span>
                  <span className="text-[10px] text-slate-500">Omzet kotor dari pesanan</span>
                </div>

                {/* Kredit (Potongan/Retur) */}
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <label className="text-[11px] font-semibold text-rose-800 block mb-1">
                    - Potongan / Kredit (Diskon/Retur)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={creditAmountInput}
                    onChange={(e) => setCreditAmountInput(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0"
                    className="w-full p-1.5 rounded border border-slate-300 text-xs font-bold text-right"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">Diskon, komisi, atau retur</span>
                </div>

                {/* Net (Total Bersih) */}
                <div className="p-3 bg-slate-900 text-white rounded-lg">
                  <span className="text-[11px] font-semibold text-amber-400 block">
                    = Kas Bersih Masuk (Net)
                  </span>
                  <span className="text-base font-bold text-emerald-400 mt-1 block">
                    {formatIDR(netAmount)}
                  </span>
                  <span className="text-[10px] text-slate-400">Masuk ke kas resto</span>
                </div>
              </div>
            </div>

            {/* Catatan / Keterangan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Keterangan Tambahan (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Penjualan ramai makan siang, ada rombongan arisan 25 orang."
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-slate-900"
              />
            </div>

            {/* Checkbox Sederhana: Draf / Rekap Pembanding */}
            <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isComparisonOnly}
                  onChange={(e) => setIsComparisonOnly(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">
                    Simpan hanya sebagai draf pembanding kasir
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Centang ini jika catatan ini hanyalah draf rekap bon sementara yang tidak ingin langsung menambah saldo kas resto.
                  </span>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow-sm transition-colors"
              >
                Simpan Penjualan
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* History SubTab */
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Riwayat Penjualan</h3>
              <p className="text-xs text-slate-500">
                Menampilkan seluruh catatan penjualan, rincian omzet masuk, dan potongan.
              </p>
            </div>

            {/* Filter tools */}
            <div className="flex items-center gap-2">
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="ALL">Semua Cara Catat</option>
                <option value="PER_MENU">Rincian Per Menu</option>
                <option value="DAILY_TOTAL">Total Omzet</option>
              </select>

              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
              />
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate("")}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Metode</th>
                  <th className="py-2.5 px-3 text-right text-emerald-800">Debit (Masuk)</th>
                  <th className="py-2.5 px-3 text-right text-rose-800">Kredit (Potongan)</th>
                  <th className="py-2.5 px-3 text-right">Kas Bersih</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => {
                  const isCancelled = sale.status === "CANCELLED";

                  return (
                    <tr key={sale.id} className={`hover:bg-slate-50 ${isCancelled ? "opacity-50" : ""}`}>
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {sale.businessDate}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            sale.recordingMethod === "PER_MENU"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {sale.recordingMethod === "PER_MENU" ? "Per Menu" : "Total Langsung"}
                        </span>
                        {sale.isComparisonOnly && (
                          <span className="ml-1 inline-block px-1.5 py-0.5 rounded text-[9px] bg-slate-200 text-slate-700">
                            Pembanding
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                        {formatIDR(sale.debitAmount || sale.reportedTotal)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-700 whitespace-nowrap">
                        {sale.creditAmount ? formatIDR(sale.creditAmount) : "-"}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 bg-slate-50/50 whitespace-nowrap">
                        {formatIDR(sale.netAmount || sale.reportedTotal)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isCancelled ? (
                          <span className="text-rose-600 font-semibold text-[10px] bg-rose-50 px-2 py-0.5 rounded">
                            Dibatalkan
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-2 py-0.5 rounded">
                            Masuk Kas
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailSale(sale)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]"
                        >
                          Rincian
                        </button>
                        {!isCancelled && (userRole === "Owner" || userRole === "Admin") && (
                          <button
                            type="button"
                            onClick={() => setCancelModalSaleId(sale.id)}
                            className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px]"
                          >
                            Batalkan
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDetailSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                Rincian Penjualan #{selectedDetailSale.id}
              </h4>
              <button
                type="button"
                onClick={() => setSelectedDetailSale(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-600">
              <p>
                <strong>Tanggal Penjualan:</strong> {selectedDetailSale.businessDate}
              </p>
              <p>
                <strong>Pencatat:</strong> {selectedDetailSale.createdBy}
              </p>
              {selectedDetailSale.notes && (
                <p>
                  <strong>Keterangan:</strong> {selectedDetailSale.notes}
                </p>
              )}
            </div>

            {/* Debit & Credit Summary in Modal */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg text-xs border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold">Debit (Kotor)</span>
                <p className="font-bold text-emerald-800">
                  {formatIDR(selectedDetailSale.debitAmount || selectedDetailSale.reportedTotal)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold">Kredit (Potongan)</span>
                <p className="font-bold text-rose-700">
                  {selectedDetailSale.creditAmount ? formatIDR(selectedDetailSale.creditAmount) : "Rp 0"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold">Kas Bersih Masuk</span>
                <p className="font-bold text-slate-900">
                  {formatIDR(selectedDetailSale.netAmount || selectedDetailSale.reportedTotal)}
                </p>
              </div>
            </div>

            {selectedDetailSale.items && selectedDetailSale.items.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b">
                    <tr>
                      <th className="p-2">Item Menu</th>
                      <th className="p-2 text-right">Harga</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDetailSale.items.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2 font-medium text-slate-800">{it.menuNameSnapshot}</td>
                        <td className="p-2 text-right text-slate-600">{formatIDR(it.unitPriceSnapshot)}</td>
                        <td className="p-2 text-center font-bold text-slate-800">{it.quantity}</td>
                        <td className="p-2 text-right font-bold text-slate-900">{formatIDR(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedDetailSale(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal (Audit Trail) */}
      {cancelModalSaleId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-5 space-y-3">
            <h4 className="font-bold text-rose-800 text-sm">
              Batalkan Catatan Penjualan #{cancelModalSaleId}
            </h4>
            <p className="text-xs text-slate-600">
              Transaksi yang dibatalkan akan otomatis membalikkan mutasi kas masuk di Buku Kas dan menyimpan alasan pembatalan untuk audit.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alasan Pembatalan *
              </label>
              <textarea
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="Contoh: Salah hitung bon fisik, diganti transaksi baru."
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCancelModalSaleId(null);
                  setCancelReasonInput("");
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!cancelReasonInput.trim()) {
                    alert("Alasan pembatalan wajib diisi.");
                    return;
                  }
                  onCancelSale(cancelModalSaleId, cancelReasonInput.trim());
                  setCancelModalSaleId(null);
                  setCancelReasonInput("");
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700"
              >
                Konfirmasi Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
