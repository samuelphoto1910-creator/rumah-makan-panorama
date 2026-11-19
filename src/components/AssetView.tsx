import React, { useState } from "react";
import { FixedAsset, AssetMaintenance, CashAccount } from "../types";
import { IconBox, IconPlus, IconArrowDownLeft, IconCheck } from "./icons";

interface AssetViewProps {
  assets: FixedAsset[];
  maintenances: AssetMaintenance[];
  cashAccounts: CashAccount[];
  onAddAsset: (asset: FixedAsset, deductCashAccountId?: string) => Promise<void> | void;
  onAddMaintenance: (m: AssetMaintenance) => void;
  userRole: "Owner" | "Admin" | "Staff";
}

export function AssetView({
  assets,
  maintenances,
  cashAccounts,
  onAddAsset,
  onAddMaintenance,
  userRole,
}: AssetViewProps) {
  // Sub-tabs yang terpisah dengan sangat jelas:
  // 1. 'inventory': DAFTAR INVENTARIS ASET (Katalog fisik aktif yang dimiliki resto saat ini)
  // 2. 'incoming_history': RIWAYAT ASSET MASUK (Log transaksi pembelian, bon/faktur, vendor & perolehan barang masuk)
  // 3. 'maintenance': RIWAYAT SERVIS & PERAWATAN (Pemeliharaan berkala & perbaikan)
  const [activeSubTab, setActiveSubTab] = useState<"inventory" | "incoming_history" | "maintenance">("inventory");

  // Toggle buka/tutup form input di halaman Riwayat Asset Masuk
  const [isIncomingFormOpen, setIsIncomingFormOpen] = useState(false);

  // Form State: Input Asset Masuk Baru
  const [assetName, setAssetName] = useState("");
  const [vendor, setVendor] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [category, setCategory] = useState("Peralatan Dapur");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [purchasePrice, setPurchasePrice] = useState<number | "">("");
  const [condition, setCondition] = useState<FixedAsset["condition"]>("Baik");
  const [location, setLocation] = useState("Dapur Utama");
  const [notes, setNotes] = useState("");
  const [paymentSource, setPaymentSource] = useState<"CASH_ACCOUNT" | "OWNER_CAPITAL">("CASH_ACCOUNT");
  const [selectedCashAccountId, setSelectedCashAccountId] = useState(cashAccounts[0]?.id || "acc-1");
  const [isSubmittingAsset, setIsSubmittingAsset] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Modal State: Servis / Perawatan Aset
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || "");
  const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [maintenanceType, setMaintenanceType] = useState("Servis Berkala");
  const [maintenanceDesc, setMaintenanceDesc] = useState("");
  const [maintenanceCost, setMaintenanceCost] = useState<number | "">("");
  const [maintenanceNotes, setMaintenanceNotes] = useState("");

  // Filter State untuk Daftar Inventaris
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterCondition, setFilterCondition] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter State untuk Riwayat Masuk
  const [incomingSearchQuery, setIncomingSearchQuery] = useState("");

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Submit Handler: Asset Masuk Baru
  const handleSaveIncomingAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) return;

    setIsSubmittingAsset(true);
    setSuccessMsg("");

    const targetAccount = cashAccounts.find((a) => a.id === selectedCashAccountId);
    const paymentLabel =
      paymentSource === "CASH_ACCOUNT"
        ? `Kas Resto (${targetAccount?.name || "Kas Tunai"})`
        : "Modal Pemilik (Non-Kas)";

    const newAsset: FixedAsset = {
      id: `ast-${Date.now()}`,
      name: assetName.trim(),
      vendor: vendor.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      category,
      purchaseDate,
      purchasePrice: purchasePrice === "" ? 0 : Number(purchasePrice),
      paymentSource: paymentLabel,
      recordedBy: userRole,
      condition,
      location: location.trim() || "Area Resto",
      status: "active",
      notes: notes.trim() || undefined,
    };

    const deductAccountId = paymentSource === "CASH_ACCOUNT" ? selectedCashAccountId : undefined;

    await onAddAsset(newAsset, deductAccountId);

    setIsSubmittingAsset(false);
    setSuccessMsg(`Asset masuk "${newAsset.name}" berhasil dicatat ke Riwayat Masuk dan ditambahkan ke Inventaris!`);

    // Reset Form
    setAssetName("");
    setVendor("");
    setInvoiceNumber("");
    setPurchasePrice("");
    setNotes("");
    setIsIncomingFormOpen(false);

    // Auto clear success message after 4 seconds
    setTimeout(() => {
      setSuccessMsg("");
    }, 4500);
  };

  // Submit Handler: Servis / Perawatan Aset
  const handleSubmitMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find((a) => a.id === selectedAssetId);
    if (!asset) return;

    const newMnt: AssetMaintenance = {
      id: `mnt-${Date.now()}`,
      assetId: asset.id,
      assetName: asset.name,
      maintenanceDate,
      maintenanceType,
      description: maintenanceDesc.trim() || maintenanceType,
      cost: Number(maintenanceCost) || 0,
      notes: maintenanceNotes.trim() || undefined,
    };

    onAddMaintenance(newMnt);
    setIsMaintenanceModalOpen(false);
    setMaintenanceDesc("");
    setMaintenanceCost("");
    setMaintenanceNotes("");
    setActiveSubTab("maintenance");
  };

  const totalAssetValue = assets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);
  const totalMaintenanceCost = maintenances.reduce((sum, m) => sum + m.cost, 0);

  // 1. Data Inventaris Aktif
  const filteredInventory = assets.filter((a) => {
    if (filterCategory !== "ALL" && a.category !== filterCategory) return false;
    if (filterCondition !== "ALL" && a.condition !== filterCondition) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = a.name.toLowerCase().includes(q);
      const matchLoc = a.location.toLowerCase().includes(q);
      if (!matchName && !matchLoc) return false;
    }
    return true;
  });

  // 2. Data Riwayat Asset Masuk (Urutkan dari tanggal terbaru)
  const incomingHistory = [...assets]
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
    .filter((a) => {
      if (!incomingSearchQuery) return true;
      const q = incomingSearchQuery.toLowerCase();
      const matchName = a.name.toLowerCase().includes(q);
      const matchVendor = (a.vendor || "").toLowerCase().includes(q);
      const matchInvoice = (a.invoiceNumber || "").toLowerCase().includes(q);
      return matchName || matchVendor || matchInvoice;
    });

  const canEdit = userRole === "Owner" || userRole === "Admin";

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Nama Tombol Yang Jelas (Tidak Membingungkan) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              <IconBox className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Manajemen Fasilitas & Aset
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">
            Pencatatan & Riwayat Aset Resto
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Bedakan antara <strong>Daftar Inventaris Fisik</strong> yang sedang aktif dengan <strong>Riwayat Pembelian/Asset Masuk</strong>.
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Jelas 1: Catat Asset Masuk Baru */}
            <button
              type="button"
              onClick={() => {
                setActiveSubTab("incoming_history");
                setIsIncomingFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <IconArrowDownLeft className="w-4 h-4" />
              <span>+ Input Asset Masuk Baru</span>
            </button>

            {/* Tombol Jelas 2: Catat Servis / Perawatan */}
            <button
              type="button"
              onClick={() => {
                if (assets.length === 0) {
                  alert("Belum ada aset terdaftar. Silakan catat asset masuk terlebih dahulu sebelum mencatat servis.");
                  setActiveSubTab("incoming_history");
                  setIsIncomingFormOpen(true);
                  return;
                }
                setSelectedAssetId(assets[0].id);
                setIsMaintenanceModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs transition-colors"
            >
              <IconPlus className="w-4 h-4 text-slate-500" />
              <span>+ Catat Servis / Perawatan</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Kartu Ringkasan Indikator */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Unit Aset Aktif di Resto
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {assets.length} <span className="text-xs font-normal text-slate-400">barang</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {assets.filter((a) => a.condition === "Baik").length} Baik • {assets.filter((a) => a.condition === "Perlu Perbaikan").length} Butuh Servis
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Dana Pembelian Asset Masuk
          </span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {formatIDR(totalAssetValue)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Akumulasi nilai perolehan seluruh barang yang pernah masuk
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Biaya Pemeliharaan & Servis
          </span>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">
            {formatIDR(totalMaintenanceCost)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Dari {maintenances.length} kali riwayat perbaikan alat dapur
          </span>
        </div>
      </div>

      {/* 3. Tiga Tab Utama (Terpisah Tegas) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {/* TAB 1: DAFTAR INVENTARIS ASET */}
        <button
          type="button"
          onClick={() => setActiveSubTab("inventory")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
            activeSubTab === "inventory"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>📋 Daftar Inventaris Aset</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeSubTab === "inventory" ? "bg-slate-700 text-amber-300" : "bg-slate-100 text-slate-600"
          }`}>
            {assets.length}
          </span>
        </button>

        {/* TAB 2: RIWAYAT ASSET MASUK */}
        <button
          type="button"
          onClick={() => setActiveSubTab("incoming_history")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
            activeSubTab === "incoming_history"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>📥 Riwayat Asset Masuk</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeSubTab === "incoming_history" ? "bg-amber-700 text-white" : "bg-amber-100 text-amber-800 font-bold"
          }`}>
            Log Masuk ({assets.length})
          </span>
        </button>

        {/* TAB 3: RIWAYAT SERVIS & PERAWATAN */}
        <button
          type="button"
          onClick={() => setActiveSubTab("maintenance")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
            activeSubTab === "maintenance"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>🔧 Riwayat Servis & Perawatan</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeSubTab === "maintenance" ? "bg-slate-700 text-amber-300" : "bg-slate-100 text-slate-600"
          }`}>
            {maintenances.length}
          </span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB 1: DAFTAR INVENTARIS ASET (Katalog Fisik Aktif Resto) */}
      {/* ========================================================================= */}
      {activeSubTab === "inventory" && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <p>
              💡 <strong>Daftar Inventaris Aset</strong> menampilkan seluruh peralatan dan barang fisik yang <em>saat ini berada dan digunakan di restoran</em>.
            </p>
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab("incoming_history");
                  setIsIncomingFormOpen(true);
                }}
                className="text-amber-700 hover:text-amber-800 font-bold underline shrink-0 ml-2"
              >
                + Beli / Input Barang Baru
              </button>
            )}
          </div>

          {/* Filter Bar Inventaris */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Peralatan Dapur">Peralatan Dapur</option>
                <option value="Pendingin & Elektronik">Pendingin & Elektronik</option>
                <option value="Mebel & Interior">Mebel & Interior</option>
                <option value="Kendaraan Operasional">Kendaraan Operasional</option>
                <option value="Peralatan Kasir">Peralatan Kasir</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>

              <select
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value)}
                className="text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="ALL">Semua Kondisi</option>
                <option value="Baik">Kondisi: Baik</option>
                <option value="Perlu Perbaikan">Kondisi: Perlu Perbaikan</option>
                <option value="Rusak">Kondisi: Rusak</option>
              </select>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Cari inventaris (misal: kompor, meja)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Tabel Inventaris Fisik */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Aset</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Lokasi Penempatan</th>
                    <th className="py-3 px-4 text-center">Kondisi Terkini</th>
                    <th className="py-3 px-4 text-center">Status Operasional</th>
                    <th className="py-3 px-4 text-right">Nilai / Harga Beli</th>
                    {canEdit && <th className="py-3 px-4 text-center">Aksi Cepat</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 7 : 6} className="py-12 text-center text-slate-400 space-y-3">
                        <IconBox className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="font-semibold text-slate-600">Belum ada inventaris aset fisik yang terdaftar</p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Semua barang yang Anda input di halaman Riwayat Asset Masuk akan otomatis muncul di sini.
                        </p>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSubTab("incoming_history");
                              setIsIncomingFormOpen(true);
                            }}
                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                          >
                            <IconArrowDownLeft className="w-4 h-4" />
                            <span>+ Input Asset Masuk Sekarang</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((ast) => (
                      <tr key={ast.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{ast.name}</span>
                          {ast.notes && <span className="text-[11px] text-slate-400 block mt-0.5">{ast.notes}</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{ast.category}</td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">📍 {ast.location}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              ast.condition === "Baik"
                                ? "bg-emerald-100 text-emerald-800"
                                : ast.condition === "Perlu Perbaikan"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {ast.condition}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                            {ast.status === "active" ? "Aktif Dipakai" : ast.status === "maintenance" ? "Dalam Servis" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                          {ast.purchasePrice ? formatIDR(ast.purchasePrice) : "-"}
                        </td>
                        {canEdit && (
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAssetId(ast.id);
                                setIsMaintenanceModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                              title="Catat servis atau perbaikan untuk alat ini"
                            >
                              + Servis
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredInventory.length > 0 && (
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                    <tr>
                      <td colSpan={5} className="py-3 px-4 text-right text-slate-600">
                        Total Nilai Inventaris Terpilih:
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900">
                        {formatIDR(
                          filteredInventory.reduce((sum, a) => sum + (a.purchasePrice || 0), 0)
                        )}
                      </td>
                      {canEdit && <td></td>}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 2: RIWAYAT ASSET MASUK (Log Pembelian & Bon Perolehan Barang) */}
      {/* ========================================================================= */}
      {activeSubTab === "incoming_history" && (
        <div className="space-y-5">
          {/* Top Bar Riwayat Masuk dengan Tombol Input */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="p-1 rounded bg-amber-100 text-amber-800">
                  <IconArrowDownLeft className="w-4 h-4" />
                </span>
                <span>Jurnal Riwayat Asset Masuk (Perolehan & Pembelian)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Mencatat kronologi pembelian barang masuk, nomor nota, toko/vendor, harga beli, dan sumber dana kas resto.
              </p>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => setIsIncomingFormOpen(!isIncomingFormOpen)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  isIncomingFormOpen
                    ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                }`}
              >
                {isIncomingFormOpen ? "Tutup Formulir Input" : "+ Input Bon / Asset Masuk"}
              </button>
            )}
          </div>

          {/* FORM INPUT ASSET MASUK (Bisa dibuka/tutup) */}
          {isIncomingFormOpen && (
            <div className="bg-white p-6 rounded-2xl border-2 border-amber-500/30 shadow-md">
              <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Formulir Input Bon / Asset Masuk Baru
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Data yang disimpan akan otomatis masuk ke <strong>Riwayat Asset Masuk</strong> dan <strong>Daftar Inventaris</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIncomingFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  ✕ Batal
                </button>
              </div>

              <form onSubmit={handleSaveIncomingAsset} className="space-y-4 text-xs">
                {/* Baris 1: Nama Aset, Toko/Vendor, No. Nota */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Barang / Aset Masuk *
                    </label>
                    <input
                      type="text"
                      required
                      value={assetName}
                      onChange={(e) => setAssetName(e.target.value)}
                      placeholder="Misal: Kompor Gas Wok 2 Tungku"
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Toko / Pemasok / Vendor (Opsional)
                    </label>
                    <input
                      type="text"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      placeholder="Misal: Toko Dapur Mandiri SNI"
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nomor Nota / Bon / Faktur (Opsional)
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="Misal: NOTA-2026-118"
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-slate-900"
                    />
                  </div>
                </div>

                {/* Baris 2: Kategori, Tanggal Masuk, Harga Beli */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Kategori Aset *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-slate-900"
                    >
                      <option value="Peralatan Dapur">Peralatan Dapur (Kompor, Wajan, Blender)</option>
                      <option value="Pendingin & Elektronik">Pendingin & Elektronik (Freezer, Chiller, AC)</option>
                      <option value="Mebel & Interior">Mebel & Interior (Meja, Kursi, Meja Kasir)</option>
                      <option value="Kendaraan Operasional">Kendaraan Operasional (Motor Belanja)</option>
                      <option value="Peralatan Kasir">Peralatan Kasir (Tablet, Printer Bon, Laci Kasir)</option>
                      <option value="Lain-lain">Lain-lain</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tanggal Pembelian / Masuk *
                    </label>
                    <input
                      type="date"
                      required
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Harga Beli / Nilai Perolehan (Rp) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Misal: 4500000"
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-slate-900"
                    />
                    {purchasePrice !== "" && Number(purchasePrice) > 0 && (
                      <span className="text-[11px] text-emerald-700 font-bold block mt-1">
                        {formatIDR(Number(purchasePrice))}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sumber Dana Pembelian */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="block font-bold text-slate-800">
                    Sumber Pembayaran / Dana Beli:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label
                      className={`p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-colors ${
                        paymentSource === "CASH_ACCOUNT"
                          ? "bg-white border-amber-500 shadow-xs ring-1 ring-amber-400"
                          : "bg-white/60 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentSource"
                        checked={paymentSource === "CASH_ACCOUNT"}
                        onChange={() => setPaymentSource("CASH_ACCOUNT")}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">Potong Saldo Kas Resto</span>
                        <span className="text-[11px] text-slate-500">
                          Otomatis dicatat sebagai pengeluaran di Buku Kas operasional.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-colors ${
                        paymentSource === "OWNER_CAPITAL"
                          ? "bg-white border-amber-500 shadow-xs ring-1 ring-amber-400"
                          : "bg-white/60 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentSource"
                        checked={paymentSource === "OWNER_CAPITAL"}
                        onChange={() => setPaymentSource("OWNER_CAPITAL")}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">Modal Pemilik / Non-Kas</span>
                        <span className="text-[11px] text-slate-500">
                          Tidak mengurangi saldo uang kas siap pakai resto saat ini.
                        </span>
                      </div>
                    </label>
                  </div>

                  {paymentSource === "CASH_ACCOUNT" && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Pilih Akun Kas yang Digunakan untuk Membayar:
                      </label>
                      <select
                        value={selectedCashAccountId}
                        onChange={(e) => setSelectedCashAccountId(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white font-medium text-xs"
                      >
                        {cashAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} (Saldo: {formatIDR(acc.initialBalance)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Lokasi & Kondisi Awal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Lokasi Penempatan Aset *
                    </label>
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Misal: Dapur Utama / Ruang Makan / Area Kasir"
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Kondisi Saat Barang Diterima *
                    </label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as FixedAsset["condition"])}
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-slate-900"
                    >
                      <option value="Baik">Baik (Baru / Berfungsi Sempurna)</option>
                      <option value="Perlu Perbaikan">Perlu Perbaikan (Bekas / Butuh Servis Awal)</option>
                      <option value="Rusak">Rusak</option>
                    </select>
                  </div>
                </div>

                {/* Catatan / Garansi */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Garansi / Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Misal: Garansi toko 1 tahun sampai Nov 2027"
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-slate-900"
                  />
                </div>

                {/* Tombol Simpan */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsIncomingFormOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAsset}
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isSubmittingAsset ? "Menyimpan..." : "Simpan ke Riwayat Masuk & Inventaris"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TABEL JURNAL RIWAYAT ASSET MASUK */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h5 className="font-bold text-xs text-slate-900">
                  Tabel Log Transaksi Pembelian & Perolehan Aset Masuk
                </h5>
                <p className="text-[11px] text-slate-500">
                  Menampilkan seluruh riwayat barang yang pernah dibeli/diterima masuk ke resto.
                </p>
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Cari riwayat (nama, toko, no. nota)..."
                  value={incomingSearchQuery}
                  onChange={(e) => setIncomingSearchQuery(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Tgl Masuk</th>
                    <th className="py-3 px-4">Nama Barang & No. Nota</th>
                    <th className="py-3 px-4">Toko / Pemasok</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-right">Harga Beli</th>
                    <th className="py-3 px-4">Sumber Dana Pembayaran</th>
                    <th className="py-3 px-4 text-center">Petugas</th>
                    <th className="py-3 px-4">Lokasi & Kondisi Awal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incomingHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400 space-y-2">
                        <IconArrowDownLeft className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="font-semibold text-slate-600">Belum ada riwayat pembelian / asset masuk yang dicatat</p>
                        <p className="text-xs text-slate-400">
                          Klik tombol &quot;+ Input Bon / Asset Masuk&quot; di atas untuk mencatat perolehan pertama.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    incomingHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          {item.purchaseDate}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{item.name}</span>
                          {item.invoiceNumber && (
                            <span className="text-[10px] font-mono text-slate-500 block">
                              No. Nota: {item.invoiceNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {item.vendor || <span className="text-slate-400">-</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{item.category}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                          {item.purchasePrice ? formatIDR(item.purchasePrice) : "-"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {item.paymentSource || "Kas Resto"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-600 text-[11px]">
                          {item.recordedBy || "Owner"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                          📍 {item.location} ({item.condition})
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {incomingHistory.length > 0 && (
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-right text-slate-600">
                        Total Pembelian Asset Masuk:
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-800">
                        {formatIDR(
                          incomingHistory.reduce((sum, a) => sum + (a.purchasePrice || 0), 0)
                        )}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 3: RIWAYAT SERVIS & PERAWATAN ASET */}
      {/* ========================================================================= */}
      {activeSubTab === "maintenance" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs text-slate-900">
                Riwayat Pemeliharaan & Servis Alat Resto
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mencatat servis berkala kompor, penggantian freon chiller, dan perbaikan perabot resto.
              </p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  if (assets.length === 0) {
                    alert("Belum ada aset terdaftar. Silakan catat asset masuk terlebih dahulu.");
                    setActiveSubTab("incoming_history");
                    setIsIncomingFormOpen(true);
                    return;
                  }
                  setSelectedAssetId(assets[0].id);
                  setIsMaintenanceModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
              >
                + Tambah Servis
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Tanggal Servis</th>
                    <th className="py-3 px-4">Nama Aset</th>
                    <th className="py-3 px-4">Jenis Perawatan</th>
                    <th className="py-3 px-4">Rincian Perbaikan</th>
                    <th className="py-3 px-4 text-right">Biaya Servis</th>
                    <th className="py-3 px-4">Teknisi / Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {maintenances.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada riwayat servis atau perbaikan yang dicatat.
                      </td>
                    </tr>
                  ) : (
                    maintenances.map((mnt) => (
                      <tr key={mnt.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          {mnt.maintenanceDate}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{mnt.assetName}</td>
                        <td className="py-3.5 px-4 text-slate-700">{mnt.maintenanceType}</td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-sm">{mnt.description}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-rose-700">
                          {formatIDR(mnt.cost)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{mnt.notes || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: CATAT SERVIS / PERAWATAN ASET */}
      {/* ========================================================================= */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-xs text-slate-900 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Catat Servis / Perawatan Aset
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Biaya servis yang dimasukkan akan otomatis memotong kas operasional resto.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitMaintenance} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Aset yang Diservis *</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.category} - {a.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Servis *</label>
                <input
                  type="date"
                  required
                  value={maintenanceDate}
                  onChange={(e) => setMaintenanceDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Perawatan *</label>
                <select
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="Servis Berkala">Servis Berkala / Rutin</option>
                  <option value="Perbaikan Kerusakan">Perbaikan Kerusakan</option>
                  <option value="Ganti Sparepart">Ganti Sparepart / Suku Cadang</option>
                  <option value="Pembersihan Total">Pembersihan Kerak / Deep Clean</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rincian Pekerjaan *</label>
                <input
                  type="text"
                  required
                  value={maintenanceDesc}
                  onChange={(e) => setMaintenanceDesc(e.target.value)}
                  placeholder="Misal: Isi freon kulkas showcase dan ganti kipas pendingin"
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Biaya Servis (Rp) *</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={maintenanceCost}
                  onChange={(e) => setMaintenanceCost(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Misal: 350000"
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teknisi / Bengkel Servis (Opsional)</label>
                <input
                  type="text"
                  value={maintenanceNotes}
                  onChange={(e) => setMaintenanceNotes(e.target.value)}
                  placeholder="Misal: Pak Joko Teknisi AC (0812xxxx)"
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  Simpan Catatan Servis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
