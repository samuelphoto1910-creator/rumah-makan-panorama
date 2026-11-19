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
  // Sub-tabs: 'list' (Daftar Aset), 'incoming' (Asset Masuk), 'maintenance' (Servis & Perawatan)
  const [activeSubTab, setActiveSubTab] = useState<"list" | "incoming" | "maintenance">("list");

  // Form State: Asset Masuk (Perolehan Aset Baru)
  const [assetName, setAssetName] = useState("");
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

  // Filter State
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterCondition, setFilterCondition] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Submit Handler: Asset Masuk (Perolehan Baru)
  const handleSaveIncomingAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) return;

    setIsSubmittingAsset(true);
    setSuccessMsg("");

    const newAsset: FixedAsset = {
      id: `ast-${Date.now()}`,
      name: assetName.trim(),
      category,
      purchaseDate,
      purchasePrice: purchasePrice === "" ? 0 : Number(purchasePrice),
      condition,
      location: location.trim() || "Area Resto",
      status: "active",
      notes: notes.trim() || undefined,
    };

    const deductAccountId = paymentSource === "CASH_ACCOUNT" ? selectedCashAccountId : undefined;

    await onAddAsset(newAsset, deductAccountId);

    setIsSubmittingAsset(false);
    setSuccessMsg(`Asset "${newAsset.name}" berhasil dicatat dan masuk ke inventaris resto!`);

    // Reset Form
    setAssetName("");
    setPurchasePrice("");
    setNotes("");

    // Auto clear success message after 4 seconds
    setTimeout(() => {
      setSuccessMsg("");
    }, 4000);
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

  // Filtered Assets for Table
  const filteredAssets = assets.filter((a) => {
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

  const canEdit = userRole === "Owner" || userRole === "Admin";

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Jelas Tombolnya (Tidak Bikin Bingung) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              <IconBox className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Manajemen Fasilitas & Inventaris
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">
            Pencatatan Aset Tetap Resto
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mendata kompor, kulkas, showcase, mebel, pencatatan perolehan aset masuk, dan jadwal servis alat.
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Jelas 1: Catat Asset Masuk */}
            <button
              type="button"
              onClick={() => setActiveSubTab("incoming")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                activeSubTab === "incoming"
                  ? "bg-amber-600 text-white ring-2 ring-amber-400"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              <IconArrowDownLeft className="w-4 h-4" />
              <span>+ Catat Asset Masuk</span>
            </button>

            {/* Tombol Jelas 2: Catat Servis / Perawatan */}
            <button
              type="button"
              onClick={() => {
                if (assets.length === 0) {
                  alert("Belum ada aset terdaftar. Silakan catat asset masuk terlebih dahulu sebelum mencatat servis.");
                  setActiveSubTab("incoming");
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

      {/* 2. Kartu Statistik Ringkas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Unit Aset Terdaftar
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {assets.length} <span className="text-xs font-normal text-slate-400">barang</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Inventaris dapur, ruang makan & pendingin</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Estimasi Nilai Total Aset
          </span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {formatIDR(totalAssetValue)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Total nilai beli seluruh peralatan resto</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Pengeluaran Servis
          </span>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">
            {formatIDR(totalMaintenanceCost)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Dari {maintenances.length} kali riwayat perbaikan</span>
        </div>
      </div>

      {/* 3. Tab Navigasi Tiga Halaman */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab("list")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
            activeSubTab === "list"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>📦 Daftar Inventaris Aset</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeSubTab === "list" ? "bg-slate-700 text-amber-300" : "bg-slate-100 text-slate-600"
          }`}>
            {assets.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("incoming")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
            activeSubTab === "incoming"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>📥 Catat Asset Masuk</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeSubTab === "incoming" ? "bg-amber-700 text-white" : "bg-amber-50 text-amber-700 font-bold"
          }`}>
            Form Baru
          </span>
        </button>

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

      {/* ========================================================================= */}
      {/* 4. HALAMAN 1: DAFTAR INVENTARIS ASET TETAP */}
      {/* ========================================================================= */}
      {activeSubTab === "list" && (
        <div className="space-y-4">
          {/* Filter Bar */}
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
                placeholder="Cari aset (misal: kompor, meja)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Tabel Aset */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Aset</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Lokasi Penempatan</th>
                    <th className="py-3 px-4">Tgl Masuk</th>
                    <th className="py-3 px-4 text-right">Harga Perolehan</th>
                    <th className="py-3 px-4 text-center">Kondisi</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    {canEdit && <th className="py-3 px-4 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 8 : 7} className="py-12 text-center text-slate-400 space-y-3">
                        <IconBox className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="font-semibold text-slate-600">Belum ada aset tetap yang terdaftar</p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Mulai masukkan inventaris dapur, freezer, dan perabot dengan mengklik tombol Asset Masuk.
                        </p>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => setActiveSubTab("incoming")}
                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                          >
                            <IconArrowDownLeft className="w-4 h-4" />
                            <span>+ Catat Asset Masuk Pertama</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((ast) => (
                      <tr key={ast.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{ast.name}</span>
                          {ast.notes && <span className="text-[11px] text-slate-400 block mt-0.5">{ast.notes}</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{ast.category}</td>
                        <td className="py-3.5 px-4 text-slate-600">{ast.location}</td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{ast.purchaseDate}</td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                          {ast.purchasePrice ? formatIDR(ast.purchasePrice) : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
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
                            {ast.status}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAssetId(ast.id);
                                setIsMaintenanceModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition-colors"
                              title="Catat perbaikan atau servis untuk barang ini"
                            >
                              + Servis
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredAssets.length > 0 && (
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-right text-slate-600">
                        Total Nilai Aset Terpilih:
                      </td>
                      <td className="py-3 px-4 text-right text-slate-900">
                        {formatIDR(
                          filteredAssets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0)
                        )}
                      </td>
                      <td colSpan={canEdit ? 3 : 2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. HALAMAN 2: CATAT ASSET MASUK (PEROLEHAN ASET BARU) */}
      {/* ========================================================================= */}
      {activeSubTab === "incoming" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-3xl">
            <div className="border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <IconArrowDownLeft className="w-4 h-4" />
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  Formulir Pencatatan Asset Masuk
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Catat barang, alat dapur, mesin pendingin, atau mebel baru yang dibeli/diterima untuk operasional rumah makan.
              </p>
            </div>

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <IconCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveIncomingAsset} className="space-y-4 text-xs">
              {/* Nama Aset & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Barang / Aset Masuk *
                  </label>
                  <input
                    type="text"
                    required
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="Contoh: Kompor Gas Wok 2 Tungku SNI"
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-slate-900"
                  />
                </div>

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
                    <option value="Pendingin & Elektronik">Pendingin & Elektronik (Freezer, Kulkas, AC)</option>
                    <option value="Mebel & Interior">Mebel & Interior (Meja, Kursi, Rak Piring)</option>
                    <option value="Kendaraan Operasional">Kendaraan Operasional (Motor Belanja)</option>
                    <option value="Peralatan Kasir">Peralatan Kasir (Tablet, Printer Bon, Laci Kasir)</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
              </div>

              {/* Tanggal Masuk & Harga Beli */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Masuk / Pembelian *
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
                    Harga Beli / Perolehan (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Contoh: 4500000"
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
                  Sumber Dana Pembelian Aset:
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
                        Otomatis dicatat sebagai pengeluaran di Buku Kas harian.
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
                      <span className="font-bold text-slate-900 block">Modal Pemilik / Hibah (Non-Kas)</span>
                      <span className="text-[11px] text-slate-500">
                        Tidak mengurangi saldo uang operasional resto saat ini.
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
                          {acc.name} ({formatIDR(acc.initialBalance)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Lokasi & Kondisi Awal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Lokasi Penempatan *
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
                    Kondisi Saat Masuk *
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as FixedAsset["condition"])}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-slate-900"
                  >
                    <option value="Baik">Baik (Baru / Berfungsi Sempurna)</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan (Bekas / Ada Kekurangan)</option>
                    <option value="Rusak">Rusak</option>
                  </select>
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Keterangan Tambahan / Nomor Seri / Garansi (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Garansi toko 1 tahun sampai Nov 2027, dibeli di Toko Elektronik Berkah Jaya."
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:outline-slate-900"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveSubTab("list")}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Kembali ke Daftar Aset
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAsset}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmittingAsset ? "Menyimpan..." : "Simpan & Masukkan ke Aset Resto"}
                </button>
              </div>
            </form>
          </div>

          {/* Riwayat Asset Masuk Terakhir */}
          {assets.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs max-w-3xl space-y-3">
              <h5 className="font-bold text-xs text-slate-900">
                Aset yang Baru Masuk Terakhir
              </h5>
              <div className="divide-y divide-slate-100">
                {assets.slice(0, 5).map((a) => (
                  <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{a.name}</span>
                      <span className="text-[11px] text-slate-500">
                        {a.category} • {a.location} • Masuk: {a.purchaseDate}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800 block">
                        {a.purchasePrice ? formatIDR(a.purchasePrice) : "-"}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        Kondisi: {a.condition}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. HALAMAN 3: RIWAYAT SERVIS & PERAWATAN ASET */}
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
                    setActiveSubTab("incoming");
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
                    <th className="py-3 px-4">Keterangan</th>
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
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">
                Catat Servis / Perawatan Aset
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Biaya servis yang dimasukkan akan otomatis memotong kas operasional resto.
              </p>
            </div>

            <form onSubmit={handleSubmitMaintenance} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Aset *</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Biaya Perbaikan (Rp) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={maintenanceCost}
                  onChange={(e) => setMaintenanceCost(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Misal: 350000"
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teknisi / Catatan (Opsional)</label>
                <input
                  type="text"
                  value={maintenanceNotes}
                  onChange={(e) => setMaintenanceNotes(e.target.value)}
                  placeholder="Misal: Teknisi Pak Joko (0812xxxx)"
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
