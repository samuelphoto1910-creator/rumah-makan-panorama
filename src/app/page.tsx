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

  // Application Data State
  const [sales, setSales] = useState<DailySale[]>(initialSales);
  const [menus, setMenus] = useState<MenuItem[]>(initialMenuItems);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>(initialCashAccounts);
  const [transactions, setTransactions] = useState<CashTransaction[]>(initialTransactions);
  const [assets, setAssets] = useState<FixedAsset[]>(initialFixedAssets);
  const [maintenances, setMaintenances] = useState<AssetMaintenance[]>(initialAssetMaintenance);

  const currentDateStr = "19 November 2026 (WIB)";

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

  // Fetch initial database records
  const fetchSupabaseData = async (supabase: ReturnType<typeof createClient>) => {
    if (!supabase) return;
    try {
      // 1. Menus
      const { data: menuData } = await supabase.from("menus").select("*");
      if (menuData && menuData.length > 0) {
        setMenus(
          menuData.map((m: Record<string, unknown>) => ({
            id: String(m.id),
            name: String(m.name),
            category: m.category as MenuItem["category"],
            price: Number(m.price),
            status: m.status as MenuItem["status"],
            description: m.description ? String(m.description) : undefined,
          }))
        );
      }

      // 2. Cash Accounts
      const { data: accData } = await supabase.from("cash_accounts").select("*");
      if (accData && accData.length > 0) {
        setCashAccounts(
          accData.map((a: Record<string, unknown>) => ({
            id: String(a.id),
            name: String(a.name),
            accountType: a.account_type as CashAccount["accountType"],
            initialBalance: Number(a.initial_balance),
          }))
        );
      }

      // 3. Daily Sales
      const { data: salesData } = await supabase
        .from("daily_sales")
        .select("*, daily_sale_items(*)")
        .order("business_date", { ascending: false });

      if (salesData && salesData.length > 0) {
        setSales(
          salesData.map((s: Record<string, unknown>) => ({
            id: String(s.id),
            businessDate: String(s.business_date),
            recordingMethod: s.recording_method as DailySale["recordingMethod"],
            recordType: s.record_type as DailySale["recordType"],
            isComparisonOnly: s.record_type === "COMPARISON",
            cashAccountId: s.cash_account_id ? String(s.cash_account_id) : "acc-1",
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
          }))
        );
      }

      // 4. Cash Transactions
      const { data: txData } = await supabase
        .from("cash_transactions")
        .select("*")
        .order("transaction_date", { ascending: false });

      if (txData && txData.length > 0) {
        setTransactions(
          txData.map((t: Record<string, unknown>) => ({
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
          }))
        );
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
    setSales([newSale, ...sales]);

    // Jika BUKAN pembanding, otomatis buat mutasi kas masuk (Debit Kas)
    if (!newSale.isComparisonOnly) {
      const targetAccount = cashAccounts.find((a) => a.id === newSale.cashAccountId);
      const autoCashTx: CashTransaction = {
        id: `tx-sale-${newSale.id}`,
        transactionDate: newSale.businessDate,
        cashAccountId: newSale.cashAccountId,
        categoryId: "cat-sale",
        categoryName: "Hasil Penjualan Resto",
        direction: "IN",
        amount: newSale.netAmount,
        description: `Omzet penjualan ${newSale.businessDate} ke ${targetAccount?.name || "Kas"} (${
          newSale.recordingMethod === "PER_MENU" ? "Per Menu" : "Total Langsung"
        })${newSale.creditAmount > 0 ? ` [Potongan Rp ${newSale.creditAmount}]` : ""}`,
        sourceType: "SALES",
        sourceId: newSale.id,
        createdBy: newSale.createdBy,
        createdAt: new Date().toISOString(),
        status: "ACTIVE",
      };
      setTransactions((prev) => [autoCashTx, ...prev]);
    }

    // Persist to Supabase if connected
    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.from("daily_sales").insert({
          business_date: newSale.businessDate,
          recording_method: newSale.recordingMethod,
          record_type: newSale.recordType,
          cash_account_id: newSale.cashAccountId.startsWith("acc-") ? null : newSale.cashAccountId,
          debit_amount: newSale.debitAmount,
          credit_amount: newSale.creditAmount,
          net_amount: newSale.netAmount,
          reported_total: newSale.reportedTotal,
          notes: newSale.notes,
          created_by: currentUser?.fullName || newSale.createdBy,
          status: newSale.status,
        });
      } catch (err) {
        console.error("Gagal menyimpan ke Supabase daily_sales:", err);
      }
    }
  };

  const handleCancelSale = async (saleId: string, reason: string) => {
    setSales(
      sales.map((s) =>
        s.id === saleId ? { ...s, status: "CANCELLED", cancelReason: reason } : s
      )
    );

    setTransactions(
      transactions.map((t) =>
        t.sourceId === saleId
          ? { ...t, status: "CANCELLED", cancelReason: `Penjualan #${saleId} dibatalkan: ${reason}` }
          : t
      )
    );

    const supabase = createClient();
    if (supabase) {
      try {
        await supabase
          .from("daily_sales")
          .update({ status: "CANCELLED", cancel_reason: reason })
          .eq("id", saleId);
      } catch (err) {
        console.error("Gagal membatalkan di Supabase:", err);
      }
    }
  };

  // Handlers for CashFlow CRUD (Pemasukan & Pengeluaran)
  const handleAddTransaction = async (newTx: CashTransaction) => {
    setTransactions([newTx, ...transactions]);

    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.from("cash_transactions").insert({
          transaction_date: newTx.transactionDate,
          cash_account_id: newTx.cashAccountId.startsWith("acc-") ? null : newTx.cashAccountId,
          category_name: newTx.categoryName,
          direction: newTx.direction,
          amount: newTx.amount,
          description: newTx.description,
          source_type: newTx.sourceType || "MANUAL",
          created_by: currentUser?.fullName || newTx.createdBy,
          status: "ACTIVE",
        });
      } catch (err) {
        console.error("Gagal simpan transaksi ke Supabase:", err);
      }
    }
  };

  const handleUpdateTransaction = async (updatedTx: CashTransaction) => {
    setTransactions(
      transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );

    const supabase = createClient();
    if (supabase) {
      try {
        await supabase
          .from("cash_transactions")
          .update({
            transaction_date: updatedTx.transactionDate,
            category_name: updatedTx.categoryName,
            amount: updatedTx.amount,
            description: updatedTx.description,
          })
          .eq("id", updatedTx.id);
      } catch (err) {
        console.error("Gagal update transaksi ke Supabase:", err);
      }
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    setTransactions(transactions.filter((t) => t.id !== txId));

    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.from("cash_transactions").delete().eq("id", txId);
      } catch (err) {
        console.error("Gagal delete transaksi di Supabase:", err);
      }
    }
  };

  // Handlers for Master Menu
  const handleAddMenu = async (newMenu: MenuItem) => {
    setMenus([...menus, newMenu]);

    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.from("menus").insert({
          name: newMenu.name,
          category: newMenu.category,
          price: newMenu.price,
          status: newMenu.status,
          description: newMenu.description,
        });
      } catch (err) {
        console.error("Gagal tambah menu ke Supabase:", err);
      }
    }
  };

  const handleToggleMenuStatus = async (menuId: string) => {
    const updatedStatus = menus.find((m) => m.id === menuId)?.status === "active" ? "inactive" : "active";
    setMenus(
      menus.map((m) =>
        m.id === menuId ? { ...m, status: updatedStatus } : m
      )
    );

    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.from("menus").update({ status: updatedStatus }).eq("id", menuId);
      } catch (err) {
        console.error("Gagal update status menu di Supabase:", err);
      }
    }
  };

  // Handlers for Fixed Assets
  const handleAddMaintenance = (newMnt: AssetMaintenance) => {
    setMaintenances([newMnt, ...maintenances]);

    if (newMnt.cost > 0) {
      const maintenanceTx: CashTransaction = {
        id: `tx-mnt-${newMnt.id}`,
        transactionDate: newMnt.maintenanceDate,
        cashAccountId: "acc-1", // Kas Tunai
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
      setTransactions((prev) => [maintenanceTx, ...prev]);
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
