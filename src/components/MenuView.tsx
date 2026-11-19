import React, { useState } from "react";
import { MenuItem } from "../types";
import { IconUtensils, IconPlus, IconCheck } from "./icons";

interface MenuViewProps {
  menus: MenuItem[];
  onAddMenu: (menu: MenuItem) => void;
  onToggleStatus: (menuId: string) => void;
  userRole: "Owner" | "Admin" | "Staff";
}

export function MenuView({ menus, onAddMenu, onToggleStatus, userRole }: MenuViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State for Add Menu
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"Makanan" | "Minuman" | "Lauk / Tambahan">("Makanan");
  const [price, setPrice] = useState<number | "">("");
  const [description, setDescription] = useState("");

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || Number(price) <= 0) {
      alert("Harap lengkapi nama menu dan harga jual yang valid.");
      return;
    }

    const newMenuItem: MenuItem = {
      id: `menu-${Date.now()}`,
      name: name.trim(),
      category,
      price: Number(price),
      status: "active",
      description: description.trim() || undefined,
    };

    onAddMenu(newMenuItem);
    setIsModalOpen(false);
    setName("");
    setPrice("");
    setDescription("");
  };

  const filteredMenus = menus.filter((m) => {
    if (selectedCategory !== "ALL" && m.category !== selectedCategory) return false;
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const canEdit = userRole === "Owner" || userRole === "Admin";

  return (
    <div className="space-y-6">
      {/* Top Banner and Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <IconUtensils className="w-5 h-5 text-amber-600" />
            <span>Master Daftar Makanan & Minuman</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Data referensi yang digunakan saat pencatatan penjualan per menu (PRD 5.1).
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <IconPlus className="w-4 h-4" />
            <span>+ Tambah Menu Baru</span>
          </button>
        )}
      </div>

      {/* Filter Category & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
          {(["ALL", "Makanan", "Minuman", "Lauk / Tambahan"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat === "ALL" ? "Semua Kategori" : cat}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Cari nama menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
          />
        </div>
      </div>

      {/* Menu Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Nama Menu</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-4">Deskripsi</th>
                <th className="py-3 px-4 text-center">Status</th>
                {canEdit && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMenus.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{item.name}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                    {formatIDR(item.price)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                    {item.description || "-"}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.status === "active" ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(item.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                          item.status === "active"
                            ? "border-slate-300 text-slate-600 hover:bg-slate-100"
                            : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        }`}
                        title="Ubah status menu"
                      >
                        {item.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
          * Catatan PRD 5.2: Menu yang pernah digunakan dalam transaksi tidak dihapus permanen,
          melainkan diubah statusnya menjadi nonaktif agar riwayat penjualan tetap utuh.
        </div>
      </div>

      {/* Add Menu Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">Tambah Menu Baru</h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Menu *</label>
                <input
                  type="text"
                  placeholder="Misal: Nila Bakar Sambal Mangga"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as typeof category)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Lauk / Tambahan">Lauk / Tambahan</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Harga Jual (Rp) *</label>
                <input
                  type="number"
                  placeholder="Contoh: 35000"
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Menu (Opsional)</label>
                <textarea
                  placeholder="Rincian bumbu, porsi, atau keterangan lauk..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
