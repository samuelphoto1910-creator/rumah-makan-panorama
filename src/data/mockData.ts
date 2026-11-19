import { MenuItem, DailySale, CashAccount, CashTransaction, FixedAsset, AssetMaintenance } from "../types";

// Master menu awal kosong (dapat diinput oleh Owner / Admin)
export const initialMenuItems: MenuItem[] = [];

// Akun kas utama operasional resto (saldo awal Rp 0)
export const initialCashAccounts: CashAccount[] = [
  { id: "acc-1", name: "Kas Laci Kasir (Tunai)", accountType: "CASH", initialBalance: 0 },
  { id: "acc-2", name: "Rekening Operasional (BCA)", accountType: "BANK", initialBalance: 0 },
  { id: "acc-3", name: "Settlement QRIS Statis", accountType: "QRIS", initialBalance: 0 },
];

// Data transaksi awal bersih (tanpa data dummy/simulasi)
export const initialSales: DailySale[] = [];
export const initialTransactions: CashTransaction[] = [];
export const initialFixedAssets: FixedAsset[] = [];
export const initialAssetMaintenance: AssetMaintenance[] = [];
