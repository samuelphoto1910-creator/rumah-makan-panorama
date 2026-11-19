import { MenuItem, DailySale, CashAccount, CashTransaction, FixedAsset, AssetMaintenance } from "../types";

// Standard constant UUIDs for the 3 default cash accounts in Supabase
export const DEFAULT_CASH_ACCOUNT_IDS = {
  CASH: "11111111-1111-1111-1111-111111111111",
  BANK: "22222222-2222-2222-2222-222222222222",
  QRIS: "33333333-3333-3333-3333-333333333333",
};

export const sanitizeCashAccountId = (id?: string): string => {
  if (!id) return DEFAULT_CASH_ACCOUNT_IDS.CASH;
  if (id === "acc-1") return DEFAULT_CASH_ACCOUNT_IDS.CASH;
  if (id === "acc-2") return DEFAULT_CASH_ACCOUNT_IDS.BANK;
  if (id === "acc-3") return DEFAULT_CASH_ACCOUNT_IDS.QRIS;
  // If it's a valid UUID string format, return it
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  return DEFAULT_CASH_ACCOUNT_IDS.CASH;
};

// Akun kas utama operasional resto (saldo awal Rp 0) dengan ID UUID standar Supabase
export const initialCashAccounts: CashAccount[] = [
  { id: DEFAULT_CASH_ACCOUNT_IDS.CASH, name: "Kas Laci Kasir (Tunai)", accountType: "CASH", initialBalance: 0 },
  { id: DEFAULT_CASH_ACCOUNT_IDS.BANK, name: "Rekening Operasional (BCA)", accountType: "BANK", initialBalance: 0 },
  { id: DEFAULT_CASH_ACCOUNT_IDS.QRIS, name: "Settlement QRIS Statis", accountType: "QRIS", initialBalance: 0 },
];

// Master menu awal kosong
export const initialMenuItems: MenuItem[] = [];

// Data transaksi awal bersih (tanpa data dummy)
export const initialSales: DailySale[] = [];
export const initialTransactions: CashTransaction[] = [];
export const initialFixedAssets: FixedAsset[] = [];
export const initialAssetMaintenance: AssetMaintenance[] = [];
