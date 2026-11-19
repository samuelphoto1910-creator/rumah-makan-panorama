import React, { useState } from "react";
import { FixedAsset, AssetMaintenance } from "../types";
import { IconBox, IconPlus } from "./icons";

interface AssetViewProps {
  assets: FixedAsset[];
  maintenances: AssetMaintenance[];
  onAddMaintenance: (m: AssetMaintenance) => void;
  userRole: "Owner" | "Admin" | "Staff";
}

export function AssetView({
  assets,
  maintenances,
  onAddMaintenance,
  userRole,
}: AssetViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"assets" | "maintenance">("assets");

  // Maintenance Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id || "");
  const [maintenanceDate, setMaintenanceDate] = useState("2026-11-19");
  const [maintenanceType, setMaintenanceType] = useState("Servis Berkala");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

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
      description: description.trim() || maintenanceType,
      cost: Number(cost) || 0,
      notes: notes.trim() || undefined,
    };

    onAddMaintenance(newMnt);
    setIsModalOpen(false);
    setDescription("");
    setCost("");
    setNotes("");
    setActiveSubTab("maintenance");
  };

  const totalAssetValue = assets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);
  const totalMaintenanceCost = maintenances.reduce((sum, m) => sum + m.cost, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <IconBox className="w-5 h-5 text-amber-600" />
            <span>Pencatatan Aset Tetap & Peralatan Resto</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mendata kompor, kulkas, freezer, mebel, dan riwayat perawatannya (PRD 10).
          </p>
        </div>

        {(userRole === "Owner" || userRole === "Admin") && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <IconPlus className="w-4 h-4" />
            <span>+ Catat Perawatan Aset</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab("assets")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeSubTab === "assets"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Daftar Aset Tetap ({assets.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("maintenance")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeSubTab === "maintenance"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Riwayat Perawatan & Servis ({maintenances.length})
        </button>
      </div>

      {activeSubTab === "assets" ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Aset</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Lokasi</th>
                  <th className="py-3 px-4">Tgl Perolehan</th>
                  <th className="py-3 px-4 text-right">Harga Perolehan</th>
                  <th className="py-3 px-4 text-center">Kondisi</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((ast) => (
                  <tr key={ast.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{ast.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{ast.category}</td>
                    <td className="py-3.5 px-4 text-slate-600">{ast.location}</td>
                    <td className="py-3.5 px-4 text-slate-600">{ast.purchaseDate}</td>
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
                      <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wider">
                        {ast.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right text-slate-600">
                    Total Nilai Aset Terdaftar:
                  </td>
                  <td className="py-3 px-4 text-right text-slate-900">
                    {formatIDR(totalAssetValue)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Tanggal Servis</th>
                  <th className="py-3 px-4">Nama Aset</th>
                  <th className="py-3 px-4">Jenis Perawatan</th>
                  <th className="py-3 px-4">Rincian Perbaikan</th>
                  <th className="py-3 px-4 text-right">Biaya</th>
                  <th className="py-3 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {maintenances.map((mnt) => (
                  <tr key={mnt.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{mnt.maintenanceDate}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{mnt.assetName}</td>
                    <td className="py-3.5 px-4 text-slate-700">{mnt.maintenanceType}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-sm">{mnt.description}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-700">
                      {formatIDR(mnt.cost)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{mnt.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right text-slate-600">
                    Total Biaya Perawatan:
                  </td>
                  <td className="py-3 px-4 text-right text-rose-700">
                    {formatIDR(totalMaintenanceCost)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">Catat Perawatan Aset</h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitMaintenance} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Aset *</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Perawatan *</label>
                <input
                  type="date"
                  value={maintenanceDate}
                  onChange={(e) => setMaintenanceDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Perawatan *</label>
                <input
                  type="text"
                  placeholder="Misal: Servis Api Kompor, Pengisian Freon Kulkas"
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Biaya Perawatan (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Contoh: 150000"
                  value={cost}
                  onChange={(e) => setCost(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rincian Deskripsi</label>
                <textarea
                  placeholder="Keterangan suku cadang yang diganti, nama teknisi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
