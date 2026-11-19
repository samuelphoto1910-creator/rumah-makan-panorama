"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ActiveTab,
  DailySale,
  MenuItem,
  CashTransaction,
  CashAccount,
  FixedAsset,
  AssetMaintenance,
} from "../types";
import {
  initialMenuItems,
  initialCashAccounts,
  initialSales,
  initialTransactions,
  initialFixedAssets,
  initialAssetMaintenance,
  DEFAULT_CASH_ACCOUNT_IDS,
  sanitizeCashAccountId,
} from "../data/mockData";
import { createClient } from "../lib/supabase/client";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { DashboardView } from "../components/DashboardView";
import { SalesView } from "../components/SalesView";
import { MenuView } from "../components/MenuView";
import { CashFlowView } from "../components/CashFlowView";
import { CashBookView } from "../components/CashBookView";
import { AssetView } from "../components/AssetView";
import { ReportView } from "../components/ReportView";

const STORAGE_KEYS = {
  TRANSACTIONS: "panorama_cash_transactions_v2",
  SALES: "panorama_daily_sales_v2",
  MENUS: "panorama_menus_v2",
  ASSETS: "panorama_fixed_assets_v2",
  MAINTENANCES: "panorama_asset_maintenance_v2",
  ACCOUNTS: "panorama_cash_accounts_v2",
};

function loadStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Gagal membaca ${key} dari localStorage:`, e);
    return fallback;
  }
}

function saveStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Gagal menyimpan ${key} ke localStorage:`, e);
  }
}

export default function Home() {
  const router = useRouter();

  // Authentication State
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    fullName: string;
    role: "Owner" | "Admin" | "Staff";
  } | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [userRole, setUserRole] = useState<"Owner" | "Admin" | "Staff">("Staff");

  // Application Data State — load dari localStorage dulu, fallback ke initial
  const [sales, setSales] = useState<DailySale[]>(() =>
    loadStorage(STORAGE_KEYS.SALES, initialSales)
  );
  const [menus, setMenus] = useState<MenuItem[]>(() =>
    loadStorage(STORAGE_KEYS.MENUS, initialMenuItems)
  );
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>(() =>
    loadStorage(STORAGE_KEYS.ACCOUNTS, initialCashAccounts)
  );
  const [transactions, setTransactions] = useState<CashTransaction[]>(() =>
    loadStorage(STORAGE_KEYS.TRANSACTIONS, initialTransactions)
  );
  const [assets, setAssets] = useState<FixedAsset[]>(() =>
    loadStorage(STORAGE_KEYS.ASSETS, initialFixedAssets)
  );
  const [maintenances, setMaintenances] = useState<AssetMaintenance[]>(() =>
    loadStorage(STORAGE_KEYS.MAINTENANCES, initialAssetMaintenance)
  );

  const currentDateStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }) + " (WIB)";

  // Check login status on page mount (Strict Supabase Auth - No Demo)
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();

      if (!supabase) {
        setIsAuthenticated(false);
        setAuthLoading(false);
        router.replace("/login");
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session?.user) {
          setIsAuthenticated(false);
          setAuthLoading(false);
          router.replace("/login");
          return;
        }

        const user = data.session.user;
        let role: "Owner" | "Admin" | "Staff" =
          (user.user_metadata?.role as "Owner" | "Admin" | "Staff") || "Staff";
        let fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
        const email = user.email || "";

        // Query profiles table for definitive assigned role
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.role) {
            role = profile.role as "Owner" | "Admin" | "Staff";
          }
          if (profile?.full_name) {
            fullName = profile.full_name;
          }
        } catch {
          // Fallback to metadata
        }

        setCurrentUser({ email, fullName, role });
        setUserRole(role);
        setIsAuthenticated(true);
        setAuthLoading(false);

        // Fetch clean data from Supabase tables
        fetchSupabaseData(supabase);
      } catch {
        setIsAuthenticated(false);
        setAuthLoading(false);
        router.replace("/login");
      }
    }

    checkAuth();
  }, [router]);

  // Enforce role-based access control (Staff cannot access protected financial tabs)
  useEffect(() => {
    if (userRole === "Staff") {
      const restrictedTabs: ActiveTab[] = ["income", "expense", "cashbook", "reports"];
      if (restrictedTabs.includes(activeTab)) {
        setActiveTab("dashboard");
      }
    }
  }, [userRole, activeTab]);

  // Fetch initial database records and persist to localStorage
  const fetchSupabaseData = async (supabase: ReturnType<typeof createClient>) => {
    if (!supabase) return;
    try {
      // 1. Menus
      const { data: menuData, error: menuErr } = await supabase.from("menus").select("*");
      if (menuErr) console.error("Supabase menus error:", menuErr);
      if (!menuErr && menuData) {
        const parsed = menuData.map((m: Record<string, unknown>) => ({
          id: String(m.id),
          name: String(m.name),
          category: m.category as MenuItem["category"],
          price: Number(m.price),
          status: m.status as MenuItem["status"],
          description: m.description ? String(m.description) : undefined,
        }));
        setMenus(parsed);
        saveStorage(STORAGE_KEYS.MENUS, parsed);
      }

      // 2. Cash Accounts — upsert defaults if empty
      const { data: accData, error: accErr } = await supabase.from("cash_accounts").select("*");
      if (accErr) console.error("Supabase cash_accounts error:", accErr);
      if (accData && accData.length > 0) {
        const parsed = accData.map((a: Record<string, unknown>) => ({
          id: String(a.id),
          name: String(a.name),
          accountType: a.account_type as CashAccount["accountType"],
          initialBalance: Number(a.initial_balance),
        }));
        setCashAccounts(parsed);
        saveStorage(STORAGE_KEYS.ACCOUNTS, parsed);
      } else {
        // Auto-upsert 3 default cash accounts
        for (const acc of initialCashAccounts) {
          await supabase.from("cash_accounts").upsert({
            id: acc.id,
            name: acc.name,
            account_type: acc.accountType,
            initial_balance: acc.initialBalance,
          }, { onConflict: "id" });
        }
        setCashAccounts(initialCashAccounts);
        saveStorage(STORAGE_KEYS.ACCOUNTS, initialCashAccounts);
      }

      // 3. Daily Sales
      const { data: salesData, error: salesErr } = await supabase
        .from("daily_sales")
        .select("*, daily_sale_items(*)")
        .order("business_date", { ascending: false });
      if (salesErr) console.error("Supabase daily_sales error:", salesErr);
      if (!salesErr && salesData) {
        const parsed = salesData.map((s: Record<string, unknown>) => ({
          id: String(s.id),
          businessDate: String(s.business_date),
          recordingMethod: s.recording_method as DailySale["recordingMethod"],
          recordType: s.record_type as DailySale["recordType"],
          isComparisonOnly: s.record_type === "COMPARISON",
          cashAccountId: s.cash_account_id ? String(s.cash_account_id) : DEFAULT_CASH_ACCOUNT_IDS.CASH,
          debitAmount: Number(s.debit_amount) || Number(s.reported_total),
          creditAmount: Number(s.credit_amount) || 0,
          netAmount: Number(s.net_amount) || Number(s.reported_total),
          reportedTotal: Number(s.reported_total),
          notes: s.notes ? String(s.notes) : undefined,
          createdBy: String(s.created_by),
          createdAt: String(s.created_at),
          status: s.status as DailySale["status"],
          cancelReason: s.cancel_reason ? String(s.cancel_reason) : undefined,
          items: Array.isArray(s.daily_sale_items)
            ? (s.daily_sale_items as Record<string, unknown>[]).map((it) => ({
                id: String(it.id),
                dailySaleId: String(it.daily_sale_id),
                menuId: String(it.menu_id),
                menuNameSnapshot: String(it.menu_name_snapshot),
                unitPriceSnapshot: Number(it.unit_price_snapshot),
                quantity: Number(it.quantity),
                subtotal: Number(it.subtotal),
              }))
            : undefined,
        }));
        setSales(parsed);
        saveStorage(STORAGE_KEYS.SALES, parsed);
      }

      // 4. Cash Transactions
      const { data: txData, error: txErr } = await supabase
        .from("cash_transactions")
        .select("*")
        .order("transaction_date", { ascending: false });
      if (txErr) console.error("Supabase cash_transactions error:", txErr);
      if (!txErr && txData) {
        const parsed = txData.map((t: Record<string, unknown>) => ({
          id: String(t.id),
          transactionDate: String(t.transaction_date),
          cashAccountId: String(t.cash_account_id),
          categoryId: String(t.id),
          categoryName: String(t.category_name),
          direction: t.direction as CashTransaction["direction"],
          amount: Number(t.amount),
          description: String(t.description),
          sourceType: t.source_type as CashTransaction["sourceType"],
          sourceId: t.source_id ? String(t.source_id) : undefined,
          createdBy: String(t.created_by),
          createdAt: String(t.created_at),
          status: t.status as CashTransaction["status"],
          cancelReason: t.cancel_reason ? String(t.cancel_reason) : undefined,
        }));
        setTransactions(parsed);
        saveStorage(STORAGE_KEYS.TRANSACTIONS, parsed);
      }

      // 5. Fixed Assets
      const { data: assetData, error: assetErr } = await supabase
        .from("fixed_assets")
        .select("*")
        .order("purchase_date", { ascending: false });
      if (assetErr) console.error("Supabase fixed_assets error:", assetErr);
      if (!assetErr && assetData) {
        const parsed = assetData.map((a: Record<string, unknown>) => ({
          id: String(a.id),
          name: String(a.name),
          category: String(a.category),
          purchaseDate: String(a.purchase_date),
          purchasePrice: a.purchase_price ? Number(a.purchase_price) : undefined,
          condition: a.condition as FixedAsset["condition"],
          location: String(a.location),
          status: a.status as FixedAsset["status"],
          notes: a.notes ? String(a.notes) : undefined,
        }));
        setAssets(parsed);
        saveStorage(STORAGE_KEYS.ASSETS, parsed);
      }

      // 6. Asset Maintenance
      const { data: mntData, error: mntErr } = await supabase
        .from("asset_maintenance")
        .select("*")
        .order("maintenance_date", { ascending: false });
      if (mntErr) console.error("Supabase asset_maintenance error:", mntErr);
      if (!mntErr && mntData) {
        const parsed = mntData.map((m: Record<string, unknown>) => ({
          id: String(m.id),
          assetId: String(m.asset_id),
          assetName: String(m.asset_name),
          maintenanceDate: String(m.maintenance_date),
          maintenanceType: String(m.maintenance_type),
          description: String(m.description),
          cost: Number(m.cost),
          notes: m.notes ? String(m.notes) : undefined,
        }));
        setMaintenances(parsed);
        saveStorage(STORAGE_KEYS.MAINTENANCES, parsed);
      }
    } catch (e) {
      console.error("Gagal mengambil data dari Supabase:", e);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // Ignore
    }
    setIsAuthenticated(false);
    router.replace("/login");
  };

  // Handlers for Penjualan (Sales) with Debit & Kredit
  const handleAddSale = async (newSale: DailySale) => {
    const safeSale = { ...newSale, cashAccountId: sanitizeCashAccountId(newSale.cashAccountId) };
    const updatedSales = [safeSale, ...sales];
    setSales(updatedSales);
    saveStorage(STORAGE_KEYS.SALES, updatedSales);

    // Jika BUKAN pembanding, otomatis buat mutasi kas masuk (Debit Kas)
    if (!safeSale.isComparisonOnly) {
      const targetAccount = cashAccounts.find((a) => a.id === safeSale.cashAccountId);
      const autoCashTx: CashTransaction = {
        id: `tx-sale-${safeSale.id}`,
        transactionDate: safeSale.businessDate,
        cashAccountId: safeSale.cashAccountId,
        categoryId: "cat-sale",
        categoryName: "Hasil Penjualan Resto",
        direction: "IN",
        amount: safeSale.netAmount,
        description: `Omzet penjualan ${safeSale.businessDate} ke ${targetAccount?.name || "Kas"} (${
          safeSale.recordingMethod === "PER_MENU" ? "Per Menu" : "Total Langsung"
        })${safeSale.creditAmount > 0 ? ` [Potongan Rp ${safeSale.creditAmount}]` : ""}`,
        sourceType: "SALES",
        sourceId: safeSale.id,
        createdBy: safeSale.createdBy,
        createdAt: new Date().toISOString(),
        status: "ACTIVE",
      };
      setTransactions((prev) => {
        const next = [autoCashTx, ...prev];
        saveStorage(STORAGE_KEYS.TRANSACTIONS, next);
        return next;
      });
    }

    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase.from("daily_sales").insert({
        business_date: safeSale.businessDate,
        recording_method: safeSale.recordingMethod,
        record_type: safeSale.recordType,
        cash_account_id: safeSale.cashAccountId,
        debit_amount: safeSale.debitAmount,
        credit_amount: safeSale.creditAmount,
        net_amount: safeSale.netAmount,
        reported_total: safeSale.reportedTotal,
        notes: safeSale.notes,
        created_by: currentUser?.fullName || safeSale.createdBy,
        status: safeSale.status,
      });
      if (error) console.error("Gagal menyimpan ke Supabase daily_sales:", error);
    }
  };

  const handleCancelSale = async (saleId: string, reason: string) => {
    const updatedSales = sales.map((s) =>
      s.id === saleId ? { ...s, status: "CANCELLED" as const, cancelReason: reason } : s
    );
    setSales(updatedSales);
    saveStorage(STORAGE_KEYS.SALES, updatedSales);

    const updatedTx = transactions.map((t) =>
      t.sourceId === saleId
        ? { ...t, status: "CANCELLED" as const, cancelReason: `Penjualan #${saleId} dibatalkan: ${reason}` }
        : t
    );
    setTransactions(updatedTx);
    saveStorage(STORAGE_KEYS.TRANSACTIONS, updatedTx);

    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase
        .from("daily_sales")
        .update({ status: "CANCELLED", cancel_reason: reason })
        .eq("id", saleId);
      if (error) console.error("Gagal membatalkan di Supabase:", error);
    }
  };

  // Handlers for CashFlow CRUD (Pemasukan & Pengeluaran)
  const handleAddTransaction = async (newTx: CashTransaction) => {
    const safeTx = { ...newTx, cashAccountId: sanitizeCashAccountId(newTx.cashAccountId) };
    const updatedTx = [safeTx, ...transactions];
    setTransactions(updatedTx);
    saveStorage(STORAGE_KEYS.TRANSACTIONS, updatedTx);

    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase.from("cash_transactions").insert({
        transaction_date: safeTx.transactionDate,
        cash_account_id: safeTx.cashAccountId,
        category_name: safeTx.categoryName,
        direction: safeTx.direction,
        amount: safeTx.amount,
        description: safeTx.description,
        source_type: safeTx.sourceType || "MANUAL",
        created_by: currentUser?.fullName || safeTx.createdBy,
        status: "ACTIVE",
      });
      if (error) console.error("Gagal simpan transaksi ke Supabase:", error);
    }
  };

  const handleUpdateTransaction = async (updatedTx: CashTransaction) => {
    const safeTx = { ...updatedTx, cashAccountId: sanitizeCashAccountId(updatedTx.cashAccountId) };
    const updatedList = transactions.map((t) => (t.id === safeTx.id ? safeTx : t));
    setTransactions(updatedList);
    saveStorage(STORAGE_KEYS.TRANSACTIONS, updatedList);

    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase
        .from("cash_transactions")
        .update({
          transaction_date: safeTx.transactionDate,
          cash_account_id: safeTx.cashAccountId,
          category_name: safeTx.categoryName,
          amount: safeTx.amount,
          description: safeTx.description,
        })
        .eq("id", safeTx.id);
      if (error) console.error("Gagal update transaksi ke Supabase:", error);
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    const updatedTx = transactions.filter((t) => t.id !== txId);
    setTransactions(updatedTx);
    saveStorage(STORAGE_KEYS.TRANSACTIONS, updatedTx);

    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase.from("cash_transactions").delete().eq("id", txId);
      if (error) console.error("Gagal delete transaksi di Supabase:", error);
    }
  };

  // Handlers for Master Menu
  const handleAddMenu = async (newMenu: MenuItem) => {
    const updatedMenus = [...menus, newMenu];
    setMenus(updatedMenus);
    saveStorage(STORAGE_KEYS.MENUS, updatedMenus);

    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase.from("menus").insert({
        name: newMenu.name,
        category: newMenu.category,
        price: newMenu.price,
        status: newMenu.status,
        description: newMenu.description,
      });
      if (error) console.error("Gagal tambah menu ke Supabase:", error);
    }
  };

  const handleToggleMenuStatus = async (menuId: string) => {
    const updatedStatus = menus.find((m) => m.id === menuId)?.status === "active" ? "inactive" : "active";
    const updatedMenus = menus.map((m) =>
      m.id === menuId ? { ...m, status: updatedStatus as MenuItem["status"] } : m
    );
    setMenus(updatedMenus);
    saveStorage(STORAGE_KEYS.MENUS, updatedMenus);

    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase.from("menus").update({ status: updatedStatus }).eq("id", menuId);
      if (error) console.error("Gagal update status menu di Supabase:", error);
    }
  };

  // Handlers for Fixed Assets & Asset Masuk
  const handleAddAsset = async (newAsset: FixedAsset, deductCashAccountId?: string) => {
    setAssets((prev) => {
      const next = [newAsset, ...prev];
      saveStorage(STORAGE_KEYS.ASSETS, next);
      return next;
    });

    const safeCashId = deductCashAccountId ? sanitizeCashAccountId(deductCashAccountId) : undefined;

    // Jika dipotong dari kas resto, otomatis buat transaksi kas keluar
    if (safeCashId && (newAsset.purchasePrice || 0) > 0) {
      const price = newAsset.purchasePrice || 0;
      const targetAcc = cashAccounts.find((a) => a.id === safeCashId);
      const assetTx: CashTransaction = {
        id: `tx-ast-${newAsset.id}`,
        transactionDate: newAsset.purchaseDate,
        cashAccountId: safeCashId,
        categoryId: "cat-exp-asset",
        categoryName: "Pembelian / Perolehan Aset",
        direction: "OUT",
        amount: price,
        description: `Beli aset masuk: ${newAsset.name} (${newAsset.category}) via ${targetAcc?.name || "Kas"}`,
        sourceType: "MANUAL",
        sourceId: newAsset.id,
        createdBy: userRole,
        createdAt: new Date().toISOString(),
        status: "ACTIVE",
      };
      setTransactions((prev) => {
        const next = [assetTx, ...prev];
        saveStorage(STORAGE_KEYS.TRANSACTIONS, next);
        return next;
      });

      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase.from("cash_transactions").insert({
          transaction_date: assetTx.transactionDate,
          cash_account_id: assetTx.cashAccountId,
          category_name: assetTx.categoryName,
          direction: assetTx.direction,
          amount: assetTx.amount,
          description: assetTx.description,
          source_type: assetTx.sourceType,
          source_id: assetTx.sourceId,
          created_by: assetTx.createdBy,
        });
        if (error) console.error("Gagal simpan transaksi kas beli aset ke Supabase:", error);
      }
    }

    const supabase = createClient();
    if (supabase) {
      const combinedNotes = [
        newAsset.notes,
        newAsset.vendor ? `Toko: ${newAsset.vendor}` : null,
        newAsset.invoiceNumber ? `No. Nota: ${newAsset.invoiceNumber}` : null,
        newAsset.paymentSource ? `Sumber: ${newAsset.paymentSource}` : null,
      ]
        .filter(Boolean)
        .join(" • ");

      const { error } = await supabase.from("fixed_assets").insert({
        name: newAsset.name,
        category: newAsset.category,
        purchase_date: newAsset.purchaseDate,
        purchase_price: newAsset.purchasePrice,
        condition: newAsset.condition,
        location: newAsset.location,
        status: newAsset.status,
        notes: combinedNotes || undefined,
      });
      if (error) console.error("Gagal simpan aset baru ke Supabase:", error);
    }
  };

  const handleAddMaintenance = async (newMnt: AssetMaintenance) => {
    setMaintenances((prev) => {
      const next = [newMnt, ...prev];
      saveStorage(STORAGE_KEYS.MAINTENANCES, next);
      return next;
    });

    if (newMnt.cost > 0) {
      const maintenanceTx: CashTransaction = {
        id: `tx-mnt-${newMnt.id}`,
        transactionDate: newMnt.maintenanceDate,
        cashAccountId: DEFAULT_CASH_ACCOUNT_IDS.CASH,
        categoryId: "cat-exp-mnt",
        categoryName: "Perawatan Alat / Dapur",
        direction: "OUT",
        amount: newMnt.cost,
        description: `Biaya servis aset: ${newMnt.assetName} (${newMnt.description})`,
        sourceType: "ASSET_MAINTENANCE",
        sourceId: newMnt.id,
        createdBy: userRole,
        createdAt: new Date().toISOString(),
        status: "ACTIVE",
      };
      setTransactions((prev) => {
        const next = [maintenanceTx, ...prev];
        saveStorage(STORAGE_KEYS.TRANSACTIONS, next);
        return next;
      });

      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase.from("cash_transactions").insert({
          transaction_date: maintenanceTx.transactionDate,
          cash_account_id: maintenanceTx.cashAccountId,
          category_name: maintenanceTx.categoryName,
          direction: maintenanceTx.direction,
          amount: maintenanceTx.amount,
          description: maintenanceTx.description,
          source_type: maintenanceTx.sourceType,
          source_id: maintenanceTx.sourceId,
          created_by: maintenanceTx.createdBy,
        });
        if (error) console.error("Gagal simpan transaksi servis aset ke Supabase:", error);
      }
    }

    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase.from("asset_maintenance").insert({
        asset_id: newMnt.assetId,
        asset_name: newMnt.assetName,
        maintenance_date: newMnt.maintenanceDate,
        maintenance_type: newMnt.maintenanceType,
        description: newMnt.description,
        cost: newMnt.cost,
        notes: newMnt.notes,
      });
      if (error) console.error("Gagal simpan servis aset ke Supabase:", error);
    }
  };

  // If loading authentication status, show loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-slate-300">Memeriksa status login Supabase...</p>
        <p className="text-xs text-slate-500 mt-1">Sistem Pencatatan Rumah Makan Panorama</p>
      </div>
    );
  }

  // If unauthenticated, router.replace('/login') is already triggered
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
        userRole={userRole}
        userEmail={currentUser?.email}
        userName={currentUser?.fullName}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileNavOpen(true)}
          userRole={userRole}
          userName={currentUser?.fullName}
          userEmail={currentUser?.email}
          onLogout={handleLogout}
          currentDateStr={currentDateStr}
        />

        <main className="flex-1 p-4 lg:p-8">
          {activeTab === "dashboard" && (
            <DashboardView
              sales={sales}
              transactions={transactions}
              cashAccounts={cashAccounts}
              menus={menus}
              assets={assets}
              setActiveTab={setActiveTab}
              onNavigateToRecordSale={() => setActiveTab("sales")}
            />
          )}

          {activeTab === "sales" && (
            <SalesView
              sales={sales}
              menus={menus}
              onAddSale={handleAddSale}
              onCancelSale={handleCancelSale}
              userRole={userRole}
            />
          )}

          {activeTab === "menu" && (
            <MenuView
              menus={menus}
              onAddMenu={handleAddMenu}
              onToggleStatus={handleToggleMenuStatus}
              userRole={userRole}
            />
          )}

          {activeTab === "income" && (
            <CashFlowView
              type="INCOME"
              transactions={transactions}
              cashAccounts={cashAccounts}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              userRole={userRole}
            />
          )}

          {activeTab === "expense" && (
            <CashFlowView
              type="EXPENSE"
              transactions={transactions}
              cashAccounts={cashAccounts}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              userRole={userRole}
            />
          )}

          {activeTab === "cashbook" && (
            <CashBookView
              transactions={transactions}
              cashAccounts={cashAccounts}
            />
          )}

          {activeTab === "assets" && (
            <AssetView
              assets={assets}
              maintenances={maintenances}
              cashAccounts={cashAccounts}
              onAddAsset={handleAddAsset}
              onAddMaintenance={handleAddMaintenance}
              userRole={userRole}
            />
          )}

          {activeTab === "reports" && (
            <ReportView
              sales={sales}
              transactions={transactions}
              cashAccounts={cashAccounts}
            />
          )}
        </main>
      </div>
    </div>
  );
}
