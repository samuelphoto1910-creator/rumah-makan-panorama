import React, { useState } from "react";
import { CashTransaction, CashAccount } from "../types";
import { IconArrowDownLeft, IconArrowUpRight, IconPlus, IconEdit, IconTrash } from "./icons";

interface CashFlowViewProps {
  type: "INCOME" | "EXPENSE";
  transactions: CashTransaction[];
  cashAccounts: CashAccount[];
  onAddTransaction: (tx: CashTransaction) => void;
  onUpdateTransaction: (tx: CashTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  userRole: "Owner" | "Admin" | "Staff";
}

export function CashFlowView({
  type,
  transactions,
  cashAccounts,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  userRole,
}: CashFlowViewProps) {
  const isIncome = type === "INCOME";

  // Form State for Adding
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [transactionDate, setTransactionDate] = useState("2026-11-19");
  const [accountId, setAccountId] = useState(cashAccounts[0]?.id || "");
  const [categoryName, setCategoryName] = useState(
    isIncome ? "Pendapatan Lain-Lain" : "Bahan Baku & Belanja Harian"
  );
  const [amount, setAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");

  // Edit Modal State
  const [editingTx, setEditingTx] = useState<CashTransaction | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editAccountId, setEditAccountId] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editAmount, setEditAmount] = useState<number | "">("");
  const [editDescription, setEditDescription] = useState("");

  // Delete / Cancel Confirmation Modal State
  const [deleteTargetTx, setDeleteTargetTx] = useState<CashTransaction | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterAccount, setFilterAccount] = useState<string>("ALL");

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const expenseCategories = [
    "Bahan Baku & Belanja Harian",
    "Gaji & Upah Staf",
    "Listrik, Air & Gas",
    "Perawatan Alat / Dapur",
    "Transportasi & Logistik",
    "Kebersihan & Perlengkapan Resto",
    "Pengeluaran Lain-Lain",
  ];

  const incomeCategories = [
    "Pendapatan Lain-Lain",
    "Sponsorship / Promosi",
    "Bagi Hasil Kemitraan",
    "Penjualan Minyak Bekas / Sisa",
  ];

  const categories = isIncome ? incomeCategories : expenseCategories;

  // Handle Add Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      alert("Harap masukkan nominal transaksi yang valid (lebih dari 0).");
      return;
    }

    const newTx: CashTransaction = {
      id: `tx-${Date.now()}`,
      transactionDate,
      cashAccountId: accountId || cashAccounts[0]?.id || "acc-1",
      categoryId: `cat-${Date.now()}`,
      categoryName,
      direction: isIncome ? "IN" : "OUT",
      amount: parsedAmount,
      description: description.trim() || categoryName,
      sourceType: "MANUAL",
      createdBy: userRole,
      createdAt: new Date().toISOString(),
      status: "ACTIVE",
    };

    onAddTransaction(newTx);
    setIsAddFormOpen(false);
    setAmount("");
    setDescription("");
  };

  // Open Edit Modal
  const openEditModal = (tx: CashTransaction) => {
    setEditingTx(tx);
    setEditDate(tx.transactionDate);
    setEditAccountId(tx.cashAccountId);
    setEditCategoryName(tx.categoryName);
    setEditAmount(tx.amount);
    setEditDescription(tx.description);
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    const parsedAmount = Number(editAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      alert("Harap masukkan nominal yang valid.");
      return;
    }

    const updated: CashTransaction = {
      ...editingTx,
      transactionDate: editDate,
      cashAccountId: editAccountId,
      categoryName: editCategoryName,
      amount: parsedAmount,
      description: editDescription.trim(),
    };

    onUpdateTransaction(updated);
    setEditingTx(null);
  };

  // Handle Delete Confirmation
  const confirmDelete = () => {
    if (!deleteTargetTx) return;
    onDeleteTransaction(deleteTargetTx.id);
    setDeleteTargetTx(null);
  };

  const filteredTransactions = transactions.filter((t) => {
    const isDirectionMatch = isIncome
      ? t.direction === "IN" && t.sourceType !== "SALES"
      : t.direction === "OUT";
    if (!isDirectionMatch) return false;
    if (filterCategory !== "ALL" && t.categoryName !== filterCategory) return false;
    if (filterAccount !== "ALL" && t.cashAccountId !== filterAccount) return false;
    return true;
  });

  const activeFiltered = filteredTransactions.filter((t) => t.status === "ACTIVE");
  const totalNominal = activeFiltered.reduce((acc, t) => acc + t.amount, 0);

  const canModify = userRole === "Owner" || userRole === "Admin";

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            {isIncome ? (
              <span className="p-1 rounded bg-emerald-100 text-emerald-800">
                <IconArrowDownLeft className="w-4 h-4" />
              </span>
            ) : (
              <span className="p-1 rounded bg-rose-100 text-rose-800">
                <IconArrowUpRight className="w-4 h-4" />
              </span>
            )}
            <span>{isIncome ? "Pencatatan Pemasukan Lain" : "Pencatatan Pengeluaran Operasional"}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isIncome
              ? "Uang masuk di luar omzet penjualan harian (PRD 7)."
              : "Biaya belanja bahan, upah staf, utilitas resto, dan perawatan (PRD 8)."}
          </p>
        </div>

        {canModify && (
          <button
            type="button"
            onClick={() => setIsAddFormOpen(!isAddFormOpen)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
              isIncome
                ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                : "bg-rose-700 hover:bg-rose-800 text-white"
            }`}
          >
            <IconPlus className="w-4 h-4" />
            <span>{isAddFormOpen ? "Tutup Form" : isIncome ? "+ Catat Pemasukan Baru" : "+ Catat Pengeluaran Baru"}</span>
          </button>
        )}
      </div>

      {/* Add Form Section */}
      {isAddFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-2xl">
          <h4 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Formulir Tambah {isIncome ? "Pemasukan Lain" : "Pengeluaran Operasional"}
          </h4>

          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Transaksi *</label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isIncome ? "Akun Kas Penerima *" : "Akun Kas Sumber Pengeluaran *"}
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  {cashAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.accountType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori *</label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="Contoh: 250000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Keterangan / Deskripsi *
              </label>
              <textarea
                placeholder="Rincian transaksi, nama toko/penerima, nomor nota..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className={`px-5 py-2 rounded-lg text-white font-semibold ${
                  isIncome ? "bg-emerald-700 hover:bg-emerald-800" : "bg-rose-700 hover:bg-rose-800"
                }`}
              >
                Simpan Transaksi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary KPI & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 text-white">
        <div>
          <p className="text-xs text-slate-400 font-medium">
            Total {isIncome ? "Pemasukan Lain" : "Pengeluaran"} Aktif
          </p>
          <div className={`text-2xl font-bold mt-0.5 ${isIncome ? "text-emerald-400" : "text-rose-400"}`}>
            {formatIDR(totalNominal)}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="text-xs p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
          >
            <option value="ALL">Semua Akun</option>
            {cashAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table with CRUD Action Buttons */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Deskripsi</th>
                <th className="py-3 px-4">Akun Kas</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4">Pencatat</th>
                <th className="py-3 px-4 text-center">Status</th>
                {canModify && <th className="py-3 px-4 text-center">Aksi (CRUD)</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada data transaksi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const account = cashAccounts.find((a) => a.id === tx.cashAccountId);
                  const isCancelled = tx.status === "CANCELLED";

                  return (
                    <tr key={tx.id} className={`hover:bg-slate-50/80 ${isCancelled ? "opacity-50 bg-slate-50" : ""}`}>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {tx.transactionDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {tx.categoryName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 max-w-sm">
                        <span className={isCancelled ? "line-through" : ""}>{tx.description}</span>
                        {tx.cancelReason && (
                          <span className="block text-[10px] text-rose-600 mt-0.5">
                            Alasan batal: {tx.cancelReason}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {account?.name || tx.cashAccountId}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${
                          isCancelled
                            ? "text-slate-400 line-through"
                            : isIncome
                            ? "text-emerald-700"
                            : "text-rose-700"
                        }`}
                      >
                        {formatIDR(tx.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{tx.createdBy}</td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCancelled
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isCancelled ? "Dibatalkan" : "Aktif"}
                        </span>
                      </td>
                      {canModify && (
                        <td className="py-3.5 px-4 text-center whitespace-nowrap space-x-1.5">
                          {!isCancelled ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(tx)}
                                className="p-1.5 rounded-md text-amber-700 hover:bg-amber-50 border border-amber-300"
                                title="Edit Transaksi"
                              >
                                <IconEdit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTargetTx(tx)}
                                className="p-1.5 rounded-md text-rose-700 hover:bg-rose-50 border border-rose-300"
                                title="Hapus / Batalkan Transaksi"
                              >
                                <IconTrash className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal (Update) */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">
                Edit {isIncome ? "Pemasukan" : "Pengeluaran"} #{editingTx.id}
              </h4>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal *</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Akun Kas *</label>
                  <select
                    value={editAccountId}
                    onChange={(e) => setEditAccountId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    {cashAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori *</label>
                <select
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan *</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Cancel Confirmation Modal */}
      {deleteTargetTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-5 space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">
              Hapus / Batalkan Transaksi Ini?
            </h4>
            <div className="p-3 bg-slate-50 rounded-lg space-y-1 text-slate-600">
              <p><strong>Deskripsi:</strong> {deleteTargetTx.description}</p>
              <p><strong>Nominal:</strong> {formatIDR(deleteTargetTx.amount)}</p>
              <p><strong>Tanggal:</strong> {deleteTargetTx.transactionDate}</p>
            </div>
            <p className="text-slate-500">
              Menghapus transaksi ini akan secara otomatis memperbarui saldo buku kas Anda.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetTx(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Ya, Hapus Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
