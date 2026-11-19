export type RecordingMethod = "PER_MENU" | "DAILY_TOTAL";
export type RecordType = "PRIMARY" | "COMPARISON";
export type SaleStatus = "ACTIVE" | "CANCELLED";

export interface MenuItem {
  id: string;
  name: string;
  category: "Makanan" | "Minuman" | "Lauk / Tambahan";
  price: number;
  status: "active" | "inactive";
  description?: string;
}

export interface DailySaleItem {
  id: string;
  dailySaleId: string;
  menuId: string;
  menuNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  subtotal: number;
}

export interface DailySale {
  id: string;
  businessDate: string; // YYYY-MM-DD
  recordingMethod: RecordingMethod;
  recordType: RecordType;
  isComparisonOnly?: boolean;
  cashAccountId: string; // Akun kas penerima (Kas Laci Tunai, BCA, QRIS)
  debitAmount: number; // Kas Masuk (Debit)
  creditAmount: number; // Potongan / Retur / Diskon (Kredit)
  netAmount: number; // Total Bersih (Debit - Kredit)
  reportedTotal: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  status: SaleStatus;
  cancelReason?: string;
  items?: DailySaleItem[];
}

export type CashDirection = "IN" | "OUT";

export interface CashAccount {
  id: string;
  name: string;
  accountType: "CASH" | "BANK" | "QRIS";
  initialBalance: number;
}

export interface CashCategory {
  id: string;
  name: string;
  type: "IN" | "OUT";
}

export interface CashTransaction {
  id: string;
  transactionDate: string;
  cashAccountId: string;
  categoryId: string;
  categoryName: string;
  direction: CashDirection;
  amount: number;
  description: string;
  sourceType?: "SALES" | "MANUAL" | "ASSET_MAINTENANCE";
  sourceId?: string;
  createdBy: string;
  createdAt: string;
  status: "ACTIVE" | "CANCELLED";
  cancelReason?: string;
}

export interface FixedAsset {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchasePrice?: number;
  condition: "Baik" | "Perlu Perbaikan" | "Rusak";
  location: string;
  status: "active" | "maintenance" | "inactive";
  notes?: string;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  assetName: string;
  maintenanceDate: string;
  maintenanceType: string;
  description: string;
  cost: number;
  notes?: string;
  cashTransactionId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: "Owner" | "Admin" | "Staff";
}

export type ActiveTab =
  | "dashboard"
  | "sales"
  | "menu"
  | "income"
  | "expense"
  | "cashbook"
  | "assets"
  | "reports";
