"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Wallet,
  CreditCard,
  Target,
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Layers,
  ChevronDown,
} from "lucide-react";
import { useCurrency, SUPPORTED_CURRENCIES } from "@/app/context/CurrencyContext";
import { CurrencySwitcher } from "@/app/dashboard/components/CurrencySwitcher";

// --- TYPES ---

interface IncomeItem {
  id: string;
  name: string;
  amount: number;
  currency: string;
  frequency: "monthly" | "weekly" | "quarterly" | "annually";
  isActive: boolean;
}

interface ExpenseItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  currency: string;
  frequency: "monthly" | "quarterly" | "annually";
  isEssential: boolean;
  isActive: boolean;
}

interface AssetRecord {
  id: number;
  name: string;
  asset_type: string;
  current_value: number;
  expected_return_rate: number;
  currency?: string;
}

interface LiabilityRecord {
  id: number;
  name: string;
  principal_remaining: number;
  interest_rate: number;
  monthly_payment: number;
  currency?: string;
}

interface GoalRecord {
  id: number;
  name: string;
  target_amount: number;
  target_years: number;
  priority: "Essential" | "Important" | "Aspirational";
  inflation_rate: number;
  currency?: string;
  status?: string;
}

interface UserProfileData {
  id: number;
  name: string;
  email: string;
  age: number;
  date_of_birth?: string;
  occupation?: string;
  risk_tolerance: string;
  base_salary: number;
  monthly_expenses: number;
  currency: string;
  created_at?: string;
  assets: AssetRecord[];
  liabilities: LiabilityRecord[];
  goals: GoalRecord[];
  net_worth: number;
  monthly_investable_surplus: number;
  months_of_runway: number;
}

// Frequency normalization multipliers to monthly
const FREQUENCY_TO_MONTHLY: Record<string, number> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  annually: 1 / 12,
};

const OCCUPATION_OPTIONS = [
  "Technology & Software",
  "Finance & Banking",
  "Healthcare & Medicine",
  "Engineering & Manufacturing",
  "Consulting & Advisory",
  "Business & Management",
  "Legal & Compliance",
  "Education & Research",
  "Sales & Marketing",
  "Design & Media",
  "Founder & Entrepreneur",
  "Student",
  "Retired",
  "Other",
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<
    "overview" | "personal" | "cashflow" | "balancesheet" | "goals" | "assumptions" | "income" | "expenses" | "assets" | "liabilities"
  >("overview");

  // Success Notification Banner
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Additional Incomes & Itemized Expenses (Client synchronizable with canonical totals)
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);

  // Modals state
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeItem | null>(null);

  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetRecord | null>(null);

  const [isAddingLiability, setIsAddingLiability] = useState(false);
  const [editingLiability, setEditingLiability] = useState<LiabilityRecord | null>(null);

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalRecord | null>(null);

  // Risk Tolerance Dropdown State
  const [isRiskDropdownOpen, setIsRiskDropdownOpen] = useState(false);
  const riskDropdownRef = useRef<HTMLDivElement>(null);

  // Occupation Dropdown State
  const [isOccupationDropdownOpen, setIsOccupationDropdownOpen] = useState(false);
  const [isCustomOccupationMode, setIsCustomOccupationMode] = useState(false);
  const [customOccupationText, setCustomOccupationText] = useState("");
  const occupationDropdownRef = useRef<HTMLDivElement>(null);

  // Retirement Age Dropdown State
  const [isRetirementDropdownOpen, setIsRetirementDropdownOpen] = useState(false);
  const [isCustomRetirementMode, setIsCustomRetirementMode] = useState(false);
  const [customRetirementInput, setCustomRetirementInput] = useState("");
  const retirementDropdownRef = useRef<HTMLDivElement>(null);

  // Deletion Confirmation Dialog State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: "income" | "expense" | "asset" | "liability" | "goal";
    id: string | number;
    name: string;
  }>({ isOpen: false, type: "asset", id: 0, name: "" });

  // Form Fields
  // Personal
  const [nameInput, setNameInput] = useState("");
  const [ageInput, setAgeInput] = useState("");
  const [dobInput, setDobInput] = useState("2001-01-15");
  const [occupationInput, setOccupationInput] = useState("");
  const [riskInput, setRiskInput] = useState("Moderate");
  const [currencyInput, setCurrencyInput] = useState("INR");

  const handleDobChange = (newDob: string) => {
    setDobInput(newDob);
    if (newDob) {
      const birthDate = new Date(newDob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge >= 0 && calculatedAge <= 120) {
        setAgeInput(String(calculatedAge));
      }
    }
  };

  const handleAgeChange = (newAge: string) => {
    setAgeInput(newAge);
    const parsed = parseInt(newAge, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 120) {
      const estYear = new Date().getFullYear() - parsed;
      const currentMonthDay = dobInput && dobInput.length >= 10 ? dobInput.substring(4) : "-01-15";
      setDobInput(`${estYear}${currentMonthDay}`);
    }
  };

  // Income Form
  const [incomeName, setIncomeName] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeFreq, setIncomeFreq] = useState<"monthly" | "weekly" | "quarterly" | "annually">("monthly");

  // Expense Form
  const [expenseName, setExpenseName] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Housing");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseFreq, setExpenseFreq] = useState<"monthly" | "quarterly" | "annually">("monthly");
  const [expenseIsEssential, setExpenseIsEssential] = useState(true);

  // Asset Form
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("Equity");
  const [assetValue, setAssetValue] = useState("");
  const [assetReturn, setAssetReturn] = useState("12");

  // Liability Form
  const [liabName, setLiabName] = useState("");
  const [liabPrincipal, setLiabPrincipal] = useState("");
  const [liabRate, setLiabRate] = useState("9.0");
  const [liabPayment, setLiabPayment] = useState("");

  // Goal Form
  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalYears, setGoalYears] = useState("5");
  const [goalPriority, setGoalPriority] = useState<"Essential" | "Important" | "Aspirational">("Essential");
  const [goalInflation, setGoalInflation] = useState("6.0");

  // Assumptions
  const [assumptionInflation] = useState("6.0");
  const [assumptionReturn] = useState("12.0");
  const [assumptionRetirementAge, setAssumptionRetirementAge] = useState("60");
  const [assumptionHorizon] = useState("30");

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token") || new URLSearchParams(window.location.search).get("token");
  };

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      if (!token) throw new Error("No authentication token detected. Please sign in.");

      const res = await fetch("/api/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/";
        }
        throw new Error(`Profile fetch failed: ${res.statusText}`);
      }

      const data: UserProfileData = await res.json();
      setProfile(data);

      // Populate personal info
      setNameInput(data.name || "");
      setAgeInput(String(data.age || 25));
      setDobInput(data.date_of_birth || `${new Date().getFullYear() - (data.age || 25)}-01-15`);
      setOccupationInput(data.occupation || "Professional / Tech");
      setRiskInput(data.risk_tolerance || "Moderate");
      setCurrencyInput(data.currency || "INR");

      // Load saved retirement age from local storage if available
      if (typeof window !== "undefined") {
        const savedRetAge = localStorage.getItem(`chronofi_retirement_age_${data.id}`) || localStorage.getItem("chronofi_retirement_age");
        if (savedRetAge) {
          setAssumptionRetirementAge(savedRetAge);
        }
      }

      // Initialize default income sources if empty
      const storedIncomes = localStorage.getItem(`chronofi_incomes_${data.id}`);
      if (storedIncomes) {
        setIncomes(JSON.parse(storedIncomes));
      } else {
        const initialIncome: IncomeItem[] = [
          {
            id: "inc-1",
            name: "Primary Professional Salary",
            amount: data.base_salary || 100000,
            currency: data.currency || "INR",
            frequency: "monthly",
            isActive: true,
          },
        ];
        setIncomes(initialIncome);
        localStorage.setItem(`chronofi_incomes_${data.id}`, JSON.stringify(initialIncome));
      }

      // Initialize default expenses if empty
      const storedExpenses = localStorage.getItem(`chronofi_expenses_${data.id}`);
      if (storedExpenses) {
        setExpenses(JSON.parse(storedExpenses));
      } else {
        const baseExp = data.monthly_expenses > 0 ? data.monthly_expenses : (data.base_salary * 0.4);
        const initialExpenses: ExpenseItem[] = [
          {
            id: "exp-1",
            name: "Living & Household Essentials",
            category: "Housing",
            amount: Math.round(baseExp * 0.65),
            currency: data.currency || "INR",
            frequency: "monthly",
            isEssential: true,
            isActive: true,
          },
          {
            id: "exp-2",
            name: "Discretionary & Leisure",
            category: "Leisure",
            amount: Math.round(baseExp * 0.35),
            currency: data.currency || "INR",
            frequency: "monthly",
            isEssential: false,
            isActive: true,
          },
        ];
        setExpenses(initialExpenses);
        localStorage.setItem(`chronofi_expenses_${data.id}`, JSON.stringify(initialExpenses));
      }
    } catch (err) {
      setError((err as Error).message || "An unexpected error occurred while loading profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
    const interval = setInterval(() => {
      fetchProfileData();
    }, THREE_HOURS_MS);
    return () => clearInterval(interval);
  }, [fetchProfileData]);

  // Close risk dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (riskDropdownRef.current && !riskDropdownRef.current.contains(event.target as Node)) {
        setIsRiskDropdownOpen(false);
      }
    }
    if (isRiskDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isRiskDropdownOpen]);

  // Quick Inline Risk Tolerance Updater
  const handleUpdateRiskTolerance = async (newRisk: string) => {
    if (!profile) return;
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Authentication token required.");

      // Optimistic update
      setProfile({ ...profile, risk_tolerance: newRisk });
      setRiskInput(newRisk);

      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: profile.name,
          age: profile.age,
          occupation: profile.occupation || "Professional / Tech",
          risk_tolerance: newRisk,
          currency: profile.currency || "INR",
          date_of_birth: profile.date_of_birth || "2001-01-15",
        }),
      });

      if (!res.ok) throw new Error("Failed to update risk tolerance.");
      const updated = await res.json();
      setProfile(updated);
      showNotification(`Risk profile updated to ${newRisk}.`);
    } catch (err) {
      showNotification((err as Error).message, "error");
      fetchProfileData();
    }
  };

  // Close occupation dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (occupationDropdownRef.current && !occupationDropdownRef.current.contains(event.target as Node)) {
        setIsOccupationDropdownOpen(false);
        setIsCustomOccupationMode(false);
      }
    }
    if (isOccupationDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOccupationDropdownOpen]);

  // Quick Inline Occupation Updater
  const handleUpdateOccupation = async (newOcc: string) => {
    if (!profile) return;
    const occToSave = newOcc.trim() || "Professional / Tech";
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Authentication token required.");

      // Optimistic update
      setProfile({ ...profile, occupation: occToSave });
      setOccupationInput(occToSave);

      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: profile.name,
          age: profile.age,
          occupation: occToSave,
          risk_tolerance: profile.risk_tolerance || "Moderate",
          currency: profile.currency || "INR",
          date_of_birth: profile.date_of_birth || "2001-01-15",
        }),
      });

      if (!res.ok) throw new Error("Failed to update occupation.");
      const updated = await res.json();
      setProfile(updated);
      showNotification(`Occupation updated to '${occToSave}'.`);
    } catch (err) {
      showNotification((err as Error).message, "error");
      fetchProfileData();
    }
  };

  // Close retirement age dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (retirementDropdownRef.current && !retirementDropdownRef.current.contains(event.target as Node)) {
        setIsRetirementDropdownOpen(false);
        setIsCustomRetirementMode(false);
      }
    }
    if (isRetirementDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isRetirementDropdownOpen]);

  // Quick Inline Retirement Age Updater
  const handleUpdateRetirementAge = (newAge: string) => {
    const ageNum = parseInt(newAge, 10);
    if (isNaN(ageNum) || ageNum < 30 || ageNum > 100) {
      showNotification("Please enter a valid retirement age between 30 and 100.", "error");
      return;
    }
    setAssumptionRetirementAge(String(ageNum));
    if (typeof window !== "undefined") {
      localStorage.setItem(`chronofi_retirement_age_${profile?.id || "default"}`, String(ageNum));
      localStorage.setItem("chronofi_retirement_age", String(ageNum));
    }
    showNotification(`Retirement age set to ${ageNum} years.`);
    setIsRetirementDropdownOpen(false);
    setIsCustomRetirementMode(false);
  };

  // Save updated cashflow totals to backend
  const syncCashflowToBackend = async (newSalary: number, newExpenses: number) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          base_salary: Math.max(0, newSalary),
          monthly_expenses: Math.max(0, newExpenses),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
      }
    } catch (err) {
      console.error("Failed to synchronize cash flow with engine:", err);
    }
  };

  const { displayCurrency, setDisplayCurrency, formatMoney: globalFormatMoney } = useCurrency();

  // Currency Formatter with live exchange-rate conversion across display currencies
  const formatMoney = useCallback(
    (val: number, cur: string = "INR") => {
      return globalFormatMoney(val, cur);
    },
    [globalFormatMoney]
  );

  // Normalized monthly income & expenses calculations
  const totalMonthlyIncome = useMemo(() => {
    return incomes
      .filter((i) => i.isActive)
      .reduce((sum, item) => sum + item.amount * (FREQUENCY_TO_MONTHLY[item.frequency] || 1), 0);
  }, [incomes]);

  const totalMonthlyExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.isActive)
      .reduce((sum, item) => sum + item.amount * (FREQUENCY_TO_MONTHLY[item.frequency] || 1), 0);
  }, [expenses]);

  const totalAssets = useMemo(() => {
    return profile?.assets.reduce((sum, a) => sum + a.current_value, 0) || 0;
  }, [profile?.assets]);

  const totalLiabilities = useMemo(() => {
    return profile?.liabilities.reduce((sum, l) => sum + l.principal_remaining, 0) || 0;
  }, [profile?.liabilities]);

  const totalEMIs = useMemo(() => {
    return profile?.liabilities.reduce((sum, l) => sum + l.monthly_payment, 0) || 0;
  }, [profile?.liabilities]);

  const computedNetWorth = totalAssets - totalLiabilities;
  const computedSurplus = Math.max(0, totalMonthlyIncome - totalMonthlyExpenses - totalEMIs);

  // --- HANDLERS: PERSONAL INFORMATION ---
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Authentication token required.");

      const ageNum = parseInt(ageInput, 10) || 25;
      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: nameInput.trim(),
          age: ageNum,
          occupation: occupationInput.trim(),
          risk_tolerance: riskInput,
          currency: currencyInput,
          date_of_birth: dobInput,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile settings.");
      const updated = await res.json();
      setProfile(updated);
      if (currencyInput && currencyInput !== displayCurrency) {
        await setDisplayCurrency(currencyInput);
      }
      setIsEditingPersonal(false);
      showNotification("Personal details updated successfully.");
    } catch (err) {
      showNotification((err as Error).message, "error");
    }
  };

  // --- HANDLERS: INCOME ---
  const handleSaveIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(incomeAmount);
    if (!incomeName.trim() || isNaN(amt) || amt < 0) {
      showNotification("Please provide a valid income name and non-negative amount.", "error");
      return;
    }

    let updatedList: IncomeItem[];
    if (editingIncome) {
      updatedList = incomes.map((i) =>
        i.id === editingIncome.id
          ? { ...i, name: incomeName.trim(), amount: amt, frequency: incomeFreq }
          : i
      );
      showNotification(`Income '${incomeName}' updated.`);
    } else {
      const newItem: IncomeItem = {
        id: `inc-${Date.now()}`,
        name: incomeName.trim(),
        amount: amt,
        currency: profile?.currency || "INR",
        frequency: incomeFreq,
        isActive: true,
      };
      updatedList = [...incomes, newItem];
      showNotification(`Income source '${incomeName}' added.`);
    }

    setIncomes(updatedList);
    if (profile?.id) localStorage.setItem(`chronofi_incomes_${profile.id}`, JSON.stringify(updatedList));

    const newSalary = updatedList
      .filter((i) => i.isActive)
      .reduce((sum, item) => sum + item.amount * (FREQUENCY_TO_MONTHLY[item.frequency] || 1), 0);
    syncCashflowToBackend(newSalary, totalMonthlyExpenses);

    setIsAddingIncome(false);
    setEditingIncome(null);
    setIncomeName("");
    setIncomeAmount("");
    setIncomeFreq("monthly");
  };

  const handleToggleIncome = (id: string) => {
    const updated = incomes.map((i) => (i.id === id ? { ...i, isActive: !i.isActive } : i));
    setIncomes(updated);
    if (profile?.id) localStorage.setItem(`chronofi_incomes_${profile.id}`, JSON.stringify(updated));

    const newSalary = updated
      .filter((i) => i.isActive)
      .reduce((sum, item) => sum + item.amount * (FREQUENCY_TO_MONTHLY[item.frequency] || 1), 0);
    syncCashflowToBackend(newSalary, totalMonthlyExpenses);
    showNotification("Income stream status toggled.");
  };

  // --- HANDLERS: EXPENSE ---
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (!expenseName.trim() || isNaN(amt) || amt < 0) {
      showNotification("Please enter a valid expense name and non-negative amount.", "error");
      return;
    }

    let updatedList: ExpenseItem[];
    if (editingExpense) {
      updatedList = expenses.map((exp) =>
        exp.id === editingExpense.id
          ? {
              ...exp,
              name: expenseName.trim(),
              category: expenseCategory,
              amount: amt,
              frequency: expenseFreq,
              isEssential: expenseIsEssential,
            }
          : exp
      );
      showNotification(`Expense '${expenseName}' updated.`);
    } else {
      const newItem: ExpenseItem = {
        id: `exp-${Date.now()}`,
        name: expenseName.trim(),
        category: expenseCategory,
        amount: amt,
        currency: profile?.currency || "INR",
        frequency: expenseFreq,
        isEssential: expenseIsEssential,
        isActive: true,
      };
      updatedList = [...expenses, newItem];
      showNotification(`Expense '${expenseName}' added.`);
    }

    setExpenses(updatedList);
    if (profile?.id) localStorage.setItem(`chronofi_expenses_${profile.id}`, JSON.stringify(updatedList));

    const newExpenses = updatedList
      .filter((e) => e.isActive)
      .reduce((sum, item) => sum + item.amount * (FREQUENCY_TO_MONTHLY[item.frequency] || 1), 0);
    syncCashflowToBackend(totalMonthlyIncome, newExpenses);

    setIsAddingExpense(false);
    setEditingExpense(null);
    setExpenseName("");
    setExpenseAmount("");
  };

  const handleToggleExpense = (id: string) => {
    const updated = expenses.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e));
    setExpenses(updated);
    if (profile?.id) localStorage.setItem(`chronofi_expenses_${profile.id}`, JSON.stringify(updated));

    const newExpenses = updated
      .filter((e) => e.isActive)
      .reduce((sum, item) => sum + item.amount * (FREQUENCY_TO_MONTHLY[item.frequency] || 1), 0);
    syncCashflowToBackend(totalMonthlyIncome, newExpenses);
    showNotification("Expense status toggled.");
  };

  // --- HANDLERS: ASSET CRUD ---
  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(assetValue);
    const ret = parseFloat(assetReturn);
    if (!assetName.trim() || isNaN(val) || val < 0) {
      showNotification("Please provide a valid asset name and non-negative value.", "error");
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Auth token required.");

      if (editingAsset) {
        const res = await fetch(`/api/profile/assets/${editingAsset.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: assetName.trim(),
            asset_type: assetType,
            current_value: val,
            expected_return_rate: isNaN(ret) ? 0.1 : ret / 100,
          }),
        });
        if (!res.ok) throw new Error("Failed to update asset.");
        showNotification(`Asset '${assetName}' updated.`);
      } else {
        const res = await fetch("/api/profile/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: assetName.trim(),
            asset_type: assetType,
            current_value: val,
            expected_return_rate: isNaN(ret) ? 0.1 : ret / 100,
          }),
        });
        if (!res.ok) throw new Error("Failed to create asset.");
        showNotification(`Asset '${assetName}' created.`);
      }

      setIsAddingAsset(false);
      setEditingAsset(null);
      setAssetName("");
      setAssetValue("");
      fetchProfileData();
    } catch (err) {
      showNotification((err as Error).message, "error");
    }
  };

  // --- HANDLERS: LIABILITY CRUD ---
  const handleSaveLiability = async (e: React.FormEvent) => {
    e.preventDefault();
    const princ = parseFloat(liabPrincipal);
    const rate = parseFloat(liabRate);
    const emi = parseFloat(liabPayment);
    if (!liabName.trim() || isNaN(princ) || princ < 0) {
      showNotification("Please provide a valid liability name and non-negative principal.", "error");
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Auth token required.");

      if (editingLiability) {
        const res = await fetch(`/api/profile/liabilities/${editingLiability.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: liabName.trim(),
            principal_remaining: princ,
            interest_rate: isNaN(rate) ? 0.09 : rate / 100,
            monthly_payment: isNaN(emi) ? 0 : emi,
          }),
        });
        if (!res.ok) throw new Error("Failed to update liability.");
        showNotification(`Liability '${liabName}' updated.`);
      } else {
        const res = await fetch("/api/profile/liabilities", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: liabName.trim(),
            principal_remaining: princ,
            interest_rate: isNaN(rate) ? 0.09 : rate / 100,
            monthly_payment: isNaN(emi) ? 0 : emi,
          }),
        });
        if (!res.ok) throw new Error("Failed to create liability.");
        showNotification(`Liability '${liabName}' created.`);
      }

      setIsAddingLiability(false);
      setEditingLiability(null);
      setLiabName("");
      setLiabPrincipal("");
      setLiabPayment("");
      fetchProfileData();
    } catch (err) {
      showNotification((err as Error).message, "error");
    }
  };

  // --- HANDLERS: GOAL CRUD ---
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalAmount);
    const years = parseInt(goalYears, 10);
    const inf = parseFloat(goalInflation);
    if (!goalName.trim() || isNaN(target) || target < 0 || isNaN(years) || years < 1) {
      showNotification("Please provide a valid goal name, positive target, and horizon >= 1 year.", "error");
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Auth token required.");

      if (editingGoal) {
        const res = await fetch(`/api/profile/goals/${editingGoal.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: goalName.trim(),
            target_amount: target,
            target_years: years,
            priority: goalPriority,
            inflation_rate: isNaN(inf) ? 0.06 : inf / 100,
          }),
        });
        if (!res.ok) throw new Error("Failed to update goal.");
        showNotification(`Goal '${goalName}' updated.`);
      } else {
        const res = await fetch("/api/profile/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: goalName.trim(),
            target_amount: target,
            target_years: years,
            priority: goalPriority,
            inflation_rate: isNaN(inf) ? 0.06 : inf / 100,
          }),
        });
        if (!res.ok) throw new Error("Failed to create goal.");
        showNotification(`Goal '${goalName}' created.`);
      }

      setIsAddingGoal(false);
      setEditingGoal(null);
      setGoalName("");
      setGoalAmount("");
      fetchProfileData();
    } catch (err) {
      showNotification((err as Error).message, "error");
    }
  };

  // --- CONFIRMED DELETION DISPATCHER ---
  const handleExecuteDelete = async () => {
    const { type, id, name } = deleteConfirmation;
    try {
      const token = getAuthToken();
      if (type === "income") {
        const updated = incomes.filter((i) => i.id !== id);
        setIncomes(updated);
        if (profile?.id) localStorage.setItem(`chronofi_incomes_${profile.id}`, JSON.stringify(updated));
        const newSalary = updated
          .filter((i) => i.isActive)
          .reduce((sum, item) => sum + item.amount * (FREQUENCY_TO_MONTHLY[item.frequency] || 1), 0);
        syncCashflowToBackend(newSalary, totalMonthlyExpenses);
        showNotification(`Income '${name}' deleted.`);
      } else if (type === "expense") {
        const updated = expenses.filter((e) => e.id !== id);
        setExpenses(updated);
        if (profile?.id) localStorage.setItem(`chronofi_expenses_${profile.id}`, JSON.stringify(updated));
        const newExpenses = updated
          .filter((e) => e.isActive)
          .reduce((sum, item) => sum + item.amount * (FREQUENCY_TO_MONTHLY[item.frequency] || 1), 0);
        syncCashflowToBackend(totalMonthlyIncome, newExpenses);
        showNotification(`Expense '${name}' deleted.`);
      } else if (type === "asset") {
        const res = await fetch(`/api/profile/assets/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete asset.");
        showNotification(`Asset '${name}' deleted.`);
        fetchProfileData();
      } else if (type === "liability") {
        const res = await fetch(`/api/profile/liabilities/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete liability.");
        showNotification(`Liability '${name}' deleted.`);
        fetchProfileData();
      } else if (type === "goal") {
        const res = await fetch(`/api/profile/goals/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to delete goal.");
        showNotification(`Goal '${name}' deleted.`);
        fetchProfileData();
      }
    } catch (err) {
      showNotification((err as Error).message, "error");
    } finally {
      setDeleteConfirmation({ isOpen: false, type: "asset", id: 0, name: "" });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
          <p className="text-xs text-zinc-400 tracking-wider uppercase font-mono">Loading Profile Records...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center text-center gap-4">
        <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-200">Unable to Load Profile</h2>
        <p className="text-xs text-zinc-400 max-w-md">{error || "Connection error."}</p>
        <button
          onClick={fetchProfileData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-40 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-900/95 shadow-xl text-xs text-zinc-200 backdrop-blur-md"
          >
            {notification.type === "success" ? <ShieldCheck className="w-4 h-4 text-zinc-300" /> : <AlertTriangle className="w-4 h-4 text-zinc-300" />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-sans">
            Profile
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <CurrencySwitcher variant="header" />
        </div>
      </div>

      {/* Section H: Compact Financial Overview Cards (Derived & Canonical) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold font-mono">Net Worth</p>
          <p className="text-lg font-bold font-mono text-zinc-100 tracking-tight mt-1">
            {formatMoney(computedNetWorth)}
          </p>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Assets - Liabilities</p>
        </div>

        <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold font-mono">Total Assets</p>
          <p className="text-lg font-bold font-mono text-zinc-100 tracking-tight mt-1">{formatMoney(totalAssets)}</p>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{profile.assets.length} active holdings</p>
        </div>

        <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold font-mono">Total Liabilities</p>
          <p className="text-lg font-bold font-mono text-zinc-100 tracking-tight mt-1">{formatMoney(totalLiabilities)}</p>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{profile.liabilities.length} active loans</p>
        </div>

        <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold font-mono">Monthly Income</p>
          <p className="text-lg font-bold font-mono text-zinc-100 tracking-tight mt-1">{formatMoney(totalMonthlyIncome)}</p>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Across active streams</p>
        </div>

        <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold font-mono">Monthly Outflows</p>
          <p className="text-lg font-bold font-mono text-zinc-100 tracking-tight mt-1">{formatMoney(totalMonthlyExpenses + totalEMIs)}</p>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Expenses + EMIs</p>
        </div>

        <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold font-mono">Investable Surplus</p>
          <p className="text-lg font-bold font-mono text-zinc-100 tracking-tight mt-1">{formatMoney(computedSurplus)}/mo</p>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Runway: {profile.months_of_runway} mos</p>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs border-b border-zinc-800/60">
        {[
          { key: "overview", label: "Overview", icon: Layers },
          { key: "personal", label: "Personal", icon: User },
          { key: "cashflow", label: "Cash Flow", icon: TrendingUp },
          { key: "balancesheet", label: "Assets & Liabilities", icon: Wallet },
          { key: "goals", label: "Goals", icon: Target },
          { key: "assumptions", label: "Assumptions", icon: SlidersHorizontal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/50"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENT SECTIONS */}
      <div className="space-y-6">
        {/* SECTION A: PERSONAL */}
        {/* SECTION A: PERSONAL */}
        {(activeSection === "overview" || activeSection === "personal") && (
          <div className="relative z-30 p-5 rounded-xl border border-zinc-800/80 bg-zinc-950/50 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-400" />
                <h2 className="text-base font-bold text-zinc-100 tracking-tight">Personal</h2>
              </div>
              <button
                onClick={() => {
                  setNameInput(profile.name);
                  setAgeInput(String(profile.age));
                  setOccupationInput(profile.occupation || "Professional / Tech");
                  setRiskInput(profile.risk_tolerance || "Aggressive");
                  setIsEditingPersonal(true);
                }}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition"
              >
                <Edit3 className="w-3.5 h-3.5 text-zinc-400" /> Edit
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Full Legal Name */}
              <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50 flex flex-col justify-between">
                <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-semibold">Full Legal Name</p>
                <p className="text-zinc-100 font-semibold mt-1 text-sm">{profile.name}</p>
              </div>

              {/* Email */}
              <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50 flex flex-col justify-between">
                <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-semibold">Email</p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className="text-zinc-200 font-mono text-xs truncate">{profile.email}</p>
                  <div
                    className="relative group/tick cursor-pointer inline-flex items-center justify-center shrink-0"
                  >
                    <Check className="w-3.5 h-3.5 text-zinc-400 group-hover/tick:text-zinc-100 transition-colors" />
                    <div className="pointer-events-none absolute bottom-full right-0 mb-1.5 hidden group-hover/tick:flex flex-col items-center z-30">
                      <div className="px-2 py-0.5 text-[10px] font-sans font-medium text-zinc-100 bg-zinc-800 border border-zinc-700/80 rounded shadow-lg whitespace-nowrap">
                        Email verified
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Age */}
              <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50 flex flex-col justify-between">
                <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-semibold">Age</p>
                <p className="text-zinc-100 font-semibold mt-1 text-sm">{profile.age} Years</p>
              </div>

              {/* Occupation (Selectable + Custom Other) */}
              <div
                ref={occupationDropdownRef}
                className={`relative p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700/70 transition flex flex-col justify-between ${
                  isOccupationDropdownOpen ? "z-50 ring-1 ring-zinc-700" : "z-10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-semibold">Occupation</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOccupationDropdownOpen(!isOccupationDropdownOpen);
                      if (!isOccupationDropdownOpen) {
                        setIsCustomOccupationMode(false);
                      }
                    }}
                    className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold border border-zinc-700/80 uppercase cursor-pointer transition shadow-sm"
                    title="Click to select or change occupation"
                  >
                    <span>{OCCUPATION_OPTIONS.includes(profile.occupation || "") ? "Select" : "Custom"}</span>
                    <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isOccupationDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>

                <div
                  onClick={() => {
                    setIsOccupationDropdownOpen(!isOccupationDropdownOpen);
                    if (!isOccupationDropdownOpen) {
                      setIsCustomOccupationMode(false);
                    }
                  }}
                  className="cursor-pointer group/desc flex items-center justify-between mt-1"
                  title="Click to select or change occupation"
                >
                  <p className="text-zinc-200 group-hover/desc:text-zinc-100 font-medium text-sm truncate transition-colors">
                    {profile.occupation || occupationInput || "Select occupation"}
                  </p>
                  <span className="text-[10px] text-zinc-500 font-mono group-hover/desc:text-zinc-300 shrink-0 ml-1">
                    Change ▾
                  </span>
                </div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isOccupationDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-1 z-50 backdrop-blur-md max-h-72 overflow-y-auto custom-scrollbar pr-1.5"
                    >
                      {isCustomOccupationMode ? (
                        <div className="p-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-200">Custom Occupation</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsCustomOccupationMode(false);
                              }}
                              className="text-[10px] text-zinc-400 hover:text-zinc-200 font-mono"
                            >
                              ← Presets
                            </button>
                          </div>
                          <input
                            type="text"
                            value={customOccupationText}
                            onChange={(e) => setCustomOccupationText(e.target.value)}
                            placeholder="Type your occupation..."
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (customOccupationText.trim()) {
                                  handleUpdateOccupation(customOccupationText.trim());
                                  setIsOccupationDropdownOpen(false);
                                  setIsCustomOccupationMode(false);
                                }
                              }
                            }}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                          />
                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsCustomOccupationMode(false);
                              }}
                              className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (customOccupationText.trim()) {
                                  handleUpdateOccupation(customOccupationText.trim());
                                  setIsOccupationDropdownOpen(false);
                                  setIsCustomOccupationMode(false);
                                }
                              }}
                              className="px-3 py-1 text-xs font-semibold bg-zinc-100 text-zinc-950 rounded hover:bg-white transition"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {OCCUPATION_OPTIONS.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (opt === "Other") {
                                  setIsCustomOccupationMode(true);
                                  setCustomOccupationText(
                                    OCCUPATION_OPTIONS.includes(profile.occupation || "")
                                      ? ""
                                      : profile.occupation || ""
                                  );
                                } else {
                                  handleUpdateOccupation(opt);
                                  setIsOccupationDropdownOpen(false);
                                }
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded text-left text-xs transition ${
                                profile.occupation === opt
                                  ? "bg-zinc-800 text-zinc-100 font-medium"
                                  : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900"
                              }`}
                            >
                              <span className="truncate">{opt}</span>
                              {opt === "Other" ? (
                                <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono ml-1">
                                  <span>Custom</span>
                                  <Edit3 className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                                </span>
                              ) : profile.occupation === opt ? (
                                <Check className="w-3.5 h-3.5 text-zinc-200 shrink-0 ml-1" />
                              ) : null}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Risk Tolerance (Selectable) */}
              <div
                ref={riskDropdownRef}
                onClick={() => setIsRiskDropdownOpen(!isRiskDropdownOpen)}
                className={`relative p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700/70 transition flex flex-col justify-between cursor-pointer group/risk ${
                  isRiskDropdownOpen ? "z-50 ring-1 ring-zinc-700" : "z-10"
                }`}
                title="Click to select risk tolerance"
              >
                <div className="flex items-center justify-between">
                  <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-semibold">Risk Tolerance</p>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 group-hover/risk:text-zinc-300 transition-transform ${isRiskDropdownOpen ? "rotate-180" : ""}`} />
                </div>

                <p className="text-zinc-100 font-semibold mt-1 text-sm group-hover/risk:text-white transition-colors">
                  {profile.risk_tolerance}
                </p>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isRiskDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-1 z-50 space-y-0.5 backdrop-blur-md"
                    >
                      {[
                        { value: "Conservative", label: "Conservative" },
                        { value: "Moderate", label: "Moderate" },
                        { value: "Aggressive", label: "Aggressive" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateRiskTolerance(opt.value);
                            setIsRiskDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded text-left text-xs transition ${
                            profile.risk_tolerance === opt.value
                              ? "bg-zinc-800 text-zinc-100 font-medium"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                          }`}
                        >
                          <span className="font-semibold text-xs text-zinc-200">{opt.label}</span>
                          {profile.risk_tolerance === opt.value && (
                            <Check className="w-3.5 h-3.5 text-zinc-200 shrink-0" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Account ID */}
              <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50 flex flex-col justify-between">
                <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-semibold">Account ID</p>
                <p className="text-zinc-300 font-mono mt-1 font-medium">#{profile.id}</p>
              </div>

              {/* Member Since */}
              <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50 flex flex-col justify-between">
                <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-semibold">Member Since</p>
                <p className="text-zinc-300 font-mono mt-1">
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Jan 1, 2026"}
                </p>
              </div>

              {/* Data Security */}
              <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50 flex flex-col justify-between">
                <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-semibold">Data Security</p>
                <p className="text-zinc-300 font-mono mt-1 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" /> User Isolated
                </p>
              </div>
            </div>
          </div>
        )}



        {/* COMBINED SECTION: CASH FLOW (INCOME & EXPENSES) */}
        {(activeSection === "overview" || activeSection === "cashflow" || activeSection === "income" || activeSection === "expenses") && (
          <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950/50 backdrop-blur-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-zinc-400" />
                <h2 className="text-base font-bold text-zinc-100 tracking-tight">Cash Flow</h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setEditingIncome(null);
                    setIncomeName("");
                    setIncomeAmount("");
                    setIncomeFreq("monthly");
                    setIsAddingIncome(true);
                  }}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-400" /> Add Income
                </button>
                <button
                  onClick={() => {
                    setEditingExpense(null);
                    setExpenseName("");
                    setExpenseAmount("");
                    setIsAddingExpense(true);
                  }}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-400" /> Add Expense
                </button>
                <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
                <span className="text-xs font-mono text-zinc-400">
                  Net: <span className="font-semibold text-zinc-100">{formatMoney(computedSurplus)}/mo</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Income Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-zinc-800/40">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Income</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                      {incomes.length}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-100">{formatMoney(totalMonthlyIncome)}/mo</span>
                </div>

                <div className="space-y-2">
                  {incomes.map((inc) => (
                    <div
                      key={inc.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border text-xs transition ${
                        inc.isActive ? "bg-zinc-900/40 border-zinc-800/60" : "bg-zinc-950/40 border-zinc-800/30 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleIncome(inc.id)}
                          className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                            inc.isActive ? "bg-zinc-800 border-zinc-600 text-zinc-100" : "bg-zinc-900 border-zinc-800 text-transparent"
                          }`}
                          title={inc.isActive ? "Deactivate source" : "Activate source"}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <div>
                          <p className="font-semibold text-zinc-200 text-sm">{inc.name}</p>
                          {inc.frequency !== "monthly" && (
                            <p className="text-[11px] text-zinc-500 capitalize font-mono mt-0.5">
                              {inc.frequency} • {formatMoney(inc.amount * (FREQUENCY_TO_MONTHLY[inc.frequency] || 1))}/mo
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0">
                        <span className="font-mono text-zinc-100 font-bold text-sm">
                          {formatMoney(inc.amount, inc.currency)}
                          <span className="text-xs font-normal text-zinc-400 font-sans">
                            {inc.frequency === "monthly" ? "/mo" : `/${inc.frequency.slice(0, 2)}`}
                          </span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingIncome(inc);
                              setIncomeName(inc.name);
                              setIncomeAmount(String(inc.amount));
                              setIncomeFreq(inc.frequency);
                              setIsAddingIncome(true);
                            }}
                            className="p-1 text-zinc-500 hover:text-zinc-200 transition"
                            title="Edit Income"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirmation({
                                isOpen: true,
                                type: "income",
                                id: inc.id,
                                name: inc.name,
                              })
                            }
                            className="p-1 text-zinc-500 hover:text-zinc-200 transition"
                            title="Delete Income"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {incomes.length === 0 && (
                    <div className="p-4 rounded-lg border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                      No income streams recorded
                    </div>
                  )}
                </div>
              </div>

              {/* Expenses Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-zinc-800/40">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Expenses</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                      {expenses.length}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-100">{formatMoney(totalMonthlyExpenses)}/mo</span>
                </div>

                <div className="space-y-2">
                  {expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border text-xs transition ${
                        exp.isActive ? "bg-zinc-900/40 border-zinc-800/60" : "bg-zinc-950/40 border-zinc-800/30 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleExpense(exp.id)}
                          className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                            exp.isActive ? "bg-zinc-800 border-zinc-600 text-zinc-100" : "bg-zinc-900 border-zinc-800 text-transparent"
                          }`}
                          title={exp.isActive ? "Deactivate expense" : "Activate expense"}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <div>
                          <p className="font-semibold text-zinc-200 text-sm">{exp.name}</p>
                          <p className="text-[11px] text-zinc-500 capitalize font-mono mt-0.5">
                            {exp.category}
                            {exp.frequency !== "monthly" &&
                              ` • ${exp.frequency} (${formatMoney(exp.amount * (FREQUENCY_TO_MONTHLY[exp.frequency] || 1))}/mo)`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0">
                        <span className="font-mono text-zinc-100 font-bold text-sm">
                          {formatMoney(exp.amount, exp.currency)}
                          <span className="text-xs font-normal text-zinc-400 font-sans">
                            {exp.frequency === "monthly" ? "/mo" : `/${exp.frequency.slice(0, 2)}`}
                          </span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingExpense(exp);
                              setExpenseName(exp.name);
                              setExpenseCategory(exp.category);
                              setExpenseAmount(String(exp.amount));
                              setExpenseFreq(exp.frequency);
                              setExpenseIsEssential(exp.isEssential);
                              setIsAddingExpense(true);
                            }}
                            className="p-1 text-zinc-500 hover:text-zinc-200 transition"
                            title="Edit Expense"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirmation({
                                isOpen: true,
                                type: "expense",
                                id: exp.id,
                                name: exp.name,
                              })
                            }
                            className="p-1 text-zinc-500 hover:text-zinc-200 transition"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <div className="p-4 rounded-lg border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                      No expenses recorded
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMBINED SECTION: ASSETS & LIABILITIES (BALANCE SHEET) */}
        {(activeSection === "overview" || activeSection === "balancesheet" || activeSection === "assets" || activeSection === "liabilities") && (
          <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950/50 backdrop-blur-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-zinc-400" />
                <h2 className="text-base font-bold text-zinc-100 tracking-tight">Assets & Liabilities</h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setEditingAsset(null);
                    setAssetName("");
                    setAssetValue("");
                    setAssetReturn("12");
                    setIsAddingAsset(true);
                  }}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-400" /> Add Asset
                </button>
                <button
                  onClick={() => {
                    setEditingLiability(null);
                    setLiabName("");
                    setLiabPrincipal("");
                    setLiabPayment("");
                    setLiabRate("9.0");
                    setIsAddingLiability(true);
                  }}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-400" /> Add Liability
                </button>
                <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
                <span className="text-xs font-mono text-zinc-400">
                  Net Worth: <span className="font-semibold text-zinc-100">{formatMoney(computedNetWorth)}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assets Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-zinc-800/40">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Assets</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                      {profile.assets.length}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-100">{formatMoney(totalAssets)}</span>
                </div>

                <div className="space-y-2">
                  {profile.assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-zinc-200 text-sm">{asset.name}</p>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-mono uppercase tracking-wider font-semibold">
                            {asset.asset_type}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Expected Return: {((asset.expected_return_rate || 0.1) * 100).toFixed(1)}% p.a. • Currency: {asset.currency || profile.currency}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0">
                        <span className="font-mono text-zinc-100 font-bold text-sm">{formatMoney(asset.current_value, asset.currency)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingAsset(asset);
                              setAssetName(asset.name);
                              setAssetType(asset.asset_type);
                              setAssetValue(String(asset.current_value));
                              setAssetReturn(String(((asset.expected_return_rate || 0.1) * 100).toFixed(1)));
                              setIsAddingAsset(true);
                            }}
                            className="p-1 text-zinc-500 hover:text-zinc-200 transition"
                            title="Edit Asset"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirmation({
                                isOpen: true,
                                type: "asset",
                                id: asset.id,
                                name: asset.name,
                              })
                            }
                            className="p-1 text-zinc-500 hover:text-zinc-200 transition"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {profile.assets.length === 0 && (
                    <div className="p-4 rounded-lg border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                      No assets recorded
                    </div>
                  )}
                </div>
              </div>

              {/* Liabilities Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-zinc-800/40">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Liabilities</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                      {profile.liabilities.length}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-100">{formatMoney(totalLiabilities)}</span>
                </div>

                <div className="space-y-2">
                  {profile.liabilities.map((liab) => (
                    <div
                      key={liab.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-zinc-200 text-sm">{liab.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Interest: {(liab.interest_rate * 100).toFixed(1)}% APR • Monthly EMI: {formatMoney(liab.monthly_payment, liab.currency)}/mo
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0">
                        <span className="font-mono text-zinc-100 font-bold text-sm">{formatMoney(liab.principal_remaining, liab.currency)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingLiability(liab);
                              setLiabName(liab.name);
                              setLiabPrincipal(String(liab.principal_remaining));
                              setLiabRate(String((liab.interest_rate * 100).toFixed(1)));
                              setLiabPayment(String(liab.monthly_payment));
                              setIsAddingLiability(true);
                            }}
                            className="p-1 text-zinc-500 hover:text-zinc-200 transition"
                            title="Edit Liability"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirmation({
                                isOpen: true,
                                type: "liability",
                                id: liab.id,
                                name: liab.name,
                              })
                            }
                            className="p-1 text-zinc-500 hover:text-zinc-200 transition"
                            title="Delete Liability"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {profile.liabilities.length === 0 && (
                    <div className="p-4 rounded-lg border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                      No liabilities recorded
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION F: FINANCIAL GOALS */}
        {(activeSection === "overview" || activeSection === "goals") && (
          <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-950/50 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-zinc-400" />
                <h2 className="text-base font-bold text-zinc-100 tracking-tight">Goals</h2>
              </div>
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setGoalName("");
                  setGoalAmount("");
                  setGoalYears("5");
                  setGoalPriority("Essential");
                  setGoalInflation("6.0");
                  setIsAddingGoal(true);
                }}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-400" /> Add Goal
              </button>
            </div>

            <div className="space-y-2">
              {profile.goals.map((g) => {
                const inflatedTarget = g.target_amount * Math.pow(1 + (g.inflation_rate || 0.06), g.target_years);
                return (
                  <div
                    key={g.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-zinc-800/60 bg-zinc-900/40 text-xs gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-zinc-100 text-sm">{g.name}</p>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider ${
                            g.priority === "Essential"
                              ? "bg-zinc-800 text-zinc-100 border border-zinc-600 font-bold"
                              : g.priority === "Important"
                              ? "bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 font-medium"
                              : "bg-zinc-900 text-zinc-400 border border-zinc-800 font-normal"
                          }`}
                        >
                          {g.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-mono mt-1">
                        Horizon: <span className="text-zinc-200 font-medium">{g.target_years} Years</span> • Inflated Target ({((g.inflation_rate || 0.06) * 100).toFixed(0)}% p.a.):{" "}
                        <span className="font-mono text-zinc-100 font-medium">{formatMoney(inflatedTarget, g.currency)}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Target Amount</p>
                        <p className="font-mono text-zinc-100 font-bold text-sm">{formatMoney(g.target_amount, g.currency)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingGoal(g);
                            setGoalName(g.name);
                            setGoalAmount(String(g.target_amount));
                            setGoalYears(String(g.target_years));
                            setGoalPriority(g.priority);
                            setGoalInflation(String(((g.inflation_rate || 0.06) * 100).toFixed(1)));
                            setIsAddingGoal(true);
                          }}
                          className="p-1 text-zinc-500 hover:text-zinc-200 transition"
                          title="Edit Goal"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirmation({
                              isOpen: true,
                              type: "goal",
                              id: g.id,
                              name: g.name,
                            })
                          }
                          className="p-1 text-zinc-500 hover:text-zinc-200 transition"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION: PLANNING ASSUMPTIONS (SIMPLIFIED) */}
        {(activeSection === "overview" || activeSection === "assumptions") && (
          <div className="relative z-20 p-5 rounded-xl border border-zinc-800/80 bg-zinc-950/50 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
                <h2 className="text-base font-bold text-zinc-100 tracking-tight">Assumptions</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50 flex flex-col justify-between">
                <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-semibold">Inflation</p>
                <p className="text-zinc-100 font-semibold mt-1 text-sm font-mono">{assumptionInflation}%</p>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50 flex flex-col justify-between">
                <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-semibold">Expected Return</p>
                <p className="text-zinc-100 font-semibold mt-1 text-sm font-mono">{assumptionReturn}%</p>
              </div>

              {/* Retirement Age (Selectable) */}
              <div
                ref={retirementDropdownRef}
                onClick={() => {
                  setIsRetirementDropdownOpen(!isRetirementDropdownOpen);
                  if (!isRetirementDropdownOpen) setIsCustomRetirementMode(false);
                }}
                className={`relative p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700/70 transition flex flex-col justify-between cursor-pointer group/ret ${
                  isRetirementDropdownOpen ? "z-50 ring-1 ring-zinc-700" : "z-10"
                }`}
                title="Click to select retirement age"
              >
                <div className="flex items-center justify-between">
                  <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-semibold">Retirement Age</p>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 group-hover/ret:text-zinc-300 transition-transform ${isRetirementDropdownOpen ? "rotate-180" : ""}`} />
                </div>
                <p className="text-zinc-100 font-semibold mt-1 text-sm font-mono group-hover/ret:text-white transition-colors">
                  {assumptionRetirementAge} Years
                </p>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isRetirementDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-1 z-50 backdrop-blur-md max-h-80 overflow-y-auto custom-scrollbar pr-1.5"
                    >
                      {isCustomRetirementMode ? (
                        <div className="p-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-200">Custom Age</span>
                            <button
                              type="button"
                              onClick={() => setIsCustomRetirementMode(false)}
                              className="text-[10px] text-zinc-400 hover:text-zinc-200 font-mono"
                            >
                              ← Presets
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={30}
                              max={100}
                              value={customRetirementInput}
                              onChange={(e) => setCustomRetirementInput(e.target.value)}
                              placeholder="e.g. 58"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (customRetirementInput.trim()) {
                                    handleUpdateRetirementAge(customRetirementInput.trim());
                                  }
                                }
                              }}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
                            />
                            <span className="text-xs text-zinc-400 font-mono">Yrs</span>
                          </div>
                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsCustomRetirementMode(false)}
                              className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (customRetirementInput.trim()) {
                                  handleUpdateRetirementAge(customRetirementInput.trim());
                                }
                              }}
                              className="px-3 py-1 text-xs font-semibold bg-zinc-100 text-zinc-950 rounded hover:bg-white transition"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {[
                            { value: "50", label: "50 Years" },
                            { value: "55", label: "55 Years" },
                            { value: "58", label: "58 Years" },
                            { value: "60", label: "60 Years" },
                            { value: "62", label: "62 Years" },
                            { value: "65", label: "65 Years" },
                            { value: "70", label: "70 Years" },
                            { value: "custom", label: "Custom Age..." },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (opt.value === "custom") {
                                  setIsCustomRetirementMode(true);
                                  setCustomRetirementInput(assumptionRetirementAge);
                                } else {
                                  handleUpdateRetirementAge(opt.value);
                                }
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded text-left text-xs transition ${
                                assumptionRetirementAge === opt.value
                                  ? "bg-zinc-800 text-zinc-100 font-medium"
                                  : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900"
                              }`}
                            >
                              <span className="font-mono">{opt.label}</span>
                              {opt.value === "custom" ? (
                                <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono ml-1">
                                  <Edit3 className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                                </span>
                              ) : assumptionRetirementAge === opt.value ? (
                                <Check className="w-3.5 h-3.5 text-zinc-200 shrink-0 ml-1" />
                              ) : null}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50 flex flex-col justify-between">
                <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-wider font-semibold">Simulation Horizon</p>
                <p className="text-zinc-100 font-semibold mt-1 text-sm font-mono">{assumptionHorizon} Years</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL DIALOGS --- */}

      {/* 1. EDIT PERSONAL INFO MODAL */}
      <AnimatePresence>
        {isEditingPersonal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-semibold text-zinc-100 text-sm">Edit Personal Details</h3>
                <button onClick={() => setIsEditingPersonal(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePersonal} className="space-y-3">
                {/* Full Legal Name */}
                <div>
                  <label className="text-zinc-400 block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Legal Full Name"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                    required
                  />
                </div>

                {/* Email (Read-Only) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-400">Email</label>
                    <div
                      className="relative group/modal-tick cursor-pointer inline-flex items-center justify-center shrink-0"
                    >
                      <Check className="w-3.5 h-3.5 text-zinc-400 group-hover/modal-tick:text-zinc-100 transition-colors" />
                      <div className="pointer-events-none absolute bottom-full right-0 mb-1 hidden group-hover/modal-tick:flex flex-col items-center z-30">
                        <div className="px-2 py-0.5 text-[10px] font-sans font-medium text-zinc-100 bg-zinc-800 border border-zinc-700/80 rounded shadow-lg whitespace-nowrap">
                          Email verified
                        </div>
                      </div>
                    </div>
                  </div>

                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded px-2.5 py-1.5 text-zinc-400 font-mono cursor-not-allowed select-none"
                  />
                </div>

                {/* Age & Risk Profile */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-400 block mb-1">Age</label>
                    <input
                      type="number"
                      min="18"
                      max="120"
                      value={ageInput}
                      onChange={(e) => setAgeInput(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Risk Profile</label>
                    <select
                      value={riskInput}
                      onChange={(e) => setRiskInput(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                    >
                      <option value="Conservative">Conservative</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Aggressive">Aggressive</option>
                    </select>
                  </div>
                </div>

                {/* Occupation */}
                <div>
                  <label className="text-zinc-400 block mb-1">Occupation</label>
                  <select
                    value={
                      OCCUPATION_OPTIONS.slice(0, -1).includes(occupationInput)
                        ? occupationInput
                        : "Other"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "Other") {
                        if (OCCUPATION_OPTIONS.includes(occupationInput)) {
                          setOccupationInput("");
                        }
                      } else {
                        setOccupationInput(val);
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700 text-xs"
                  >
                    {OCCUPATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>

                  {/* If custom occupation or 'Other' selected, provide custom text input */}
                  {!OCCUPATION_OPTIONS.slice(0, -1).includes(occupationInput) && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={occupationInput}
                        onChange={(e) => setOccupationInput(e.target.value)}
                        placeholder="Type custom occupation..."
                        autoFocus
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600"
                      />
                    </div>
                  )}
                </div>


                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingPersonal(false)}
                    className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. ADD/EDIT INCOME MODAL */}
      <AnimatePresence>
        {isAddingIncome && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-semibold text-zinc-100 text-sm">
                  {editingIncome ? "Edit Income Stream" : "Add Income Stream"}
                </h3>
                <button onClick={() => setIsAddingIncome(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveIncome} className="space-y-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Source Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Consulting, Rental, Primary Salary"
                    value={incomeName}
                    onChange={(e) => setIncomeName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-400 block mb-1">Amount ({profile.currency})</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Amount"
                      value={incomeAmount}
                      onChange={(e) => setIncomeAmount(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Recurrence</label>
                    <select
                      value={incomeFreq}
                      onChange={(e) => setIncomeFreq(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingIncome(false)}
                    className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-semibold"
                  >
                    Save Income
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. ADD/EDIT EXPENSE MODAL */}
      <AnimatePresence>
        {isAddingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-semibold text-zinc-100 text-sm">
                  {editingExpense ? "Edit Expense Item" : "Add Recurring Expense"}
                </h3>
                <button onClick={() => setIsAddingExpense(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="space-y-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Expense Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Rent, Groceries, Insurance"
                    value={expenseName}
                    onChange={(e) => setExpenseName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-400 block mb-1">Amount ({profile.currency})</label>
                    <input
                      type="number"
                      min="0"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Category</label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                    >
                      <option value="Housing">Housing / Rent</option>
                      <option value="Food">Groceries & Food</option>
                      <option value="Utilities">Utilities & Bills</option>
                      <option value="Transport">Transport / Fuel</option>
                      <option value="Healthcare">Healthcare & Insurance</option>
                      <option value="Education">Education</option>
                      <option value="Leisure">Leisure & Lifestyle</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-400 block mb-1">Frequency</label>
                    <select
                      value={expenseFreq}
                      onChange={(e) => setExpenseFreq(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Classification</label>
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setExpenseIsEssential(true)}
                        className={`flex-1 py-1 rounded text-center font-medium border ${
                          expenseIsEssential
                            ? "bg-zinc-800 border-zinc-600 text-zinc-100 font-semibold"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400"
                        }`}
                      >
                        Essential
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpenseIsEssential(false)}
                        className={`flex-1 py-1 rounded text-center font-medium border ${
                          !expenseIsEssential
                            ? "bg-zinc-800 border-zinc-700 text-zinc-200"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400"
                        }`}
                      >
                        Discretionary
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingExpense(false)}
                    className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-semibold"
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. ADD/EDIT ASSET MODAL */}
      <AnimatePresence>
        {isAddingAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-semibold text-zinc-100 text-sm">
                  {editingAsset ? "Edit Asset Holding" : "Add Portfolio Asset"}
                </h3>
                <button onClick={() => setIsAddingAsset(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAsset} className="space-y-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Asset Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Nifty Index Fund, Cash FD"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-400 block mb-1">Current Value ({profile.currency})</label>
                    <input
                      type="number"
                      min="0"
                      value={assetValue}
                      onChange={(e) => setAssetValue(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Asset Class</label>
                    <select
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                    >
                      <option value="Equity">Equity</option>
                      <option value="Cash">Cash / Liquid</option>
                      <option value="Debt">Fixed Income / EPF</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Gold">Gold</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Expected Return (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={assetReturn}
                    onChange={(e) => setAssetReturn(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingAsset(false)}
                    className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-semibold"
                  >
                    Save Asset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. ADD/EDIT LIABILITY MODAL */}
      <AnimatePresence>
        {isAddingLiability && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-semibold text-zinc-100 text-sm">
                  {editingLiability ? "Edit Liability" : "Add Loan / Debt"}
                </h3>
                <button onClick={() => setIsAddingLiability(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveLiability} className="space-y-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Loan / Liability Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Car Loan, Home Mortgage"
                    value={liabName}
                    onChange={(e) => setLiabName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-400 block mb-1">Principal Remaining ({profile.currency})</label>
                    <input
                      type="number"
                      min="0"
                      value={liabPrincipal}
                      onChange={(e) => setLiabPrincipal(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Interest Rate (% APR)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={liabRate}
                      onChange={(e) => setLiabRate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Monthly Payment / EMI ({profile.currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={liabPayment}
                    onChange={(e) => setLiabPayment(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingLiability(false)}
                    className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-semibold"
                  >
                    Save Liability
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. ADD/EDIT GOAL MODAL */}
      <AnimatePresence>
        {isAddingGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-semibold text-zinc-100 text-sm">
                  {editingGoal ? "Edit Financial Goal" : "Create Life Financial Goal"}
                </h3>
                <button onClick={() => setIsAddingGoal(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveGoal} className="space-y-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Goal Milestone Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Child Higher Education, House Down Payment"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-400 block mb-1">Target Amount ({profile.currency})</label>
                    <input
                      type="number"
                      min="0"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Target Horizon (Years)</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={goalYears}
                      onChange={(e) => setGoalYears(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-zinc-400 block mb-1">Priority Tier</label>
                    <select
                      value={goalPriority}
                      onChange={(e) => setGoalPriority(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                    >
                      <option value="Essential">Essential (Cannot fail)</option>
                      <option value="Important">Important (High priority)</option>
                      <option value="Aspirational">Aspirational (Flexible)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Annual Inflation (% p.a.)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={goalInflation}
                      onChange={(e) => setGoalInflation(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingGoal(false)}
                    className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-semibold"
                  >
                    Save Life Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. REUSABLE DELETION CONFIRMATION DIALOG */}
      <AnimatePresence>
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm">Confirm Deletion</h3>
                  <p className="text-zinc-400 mt-0.5">
                    Are you sure you want to remove <span className="text-zinc-200 font-medium">&ldquo;{deleteConfirmation.name}&rdquo;</span>?
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-zinc-500">
                This record will be permanently deleted from your profile and will no longer contribute to your Monte Carlo and multi-goal waterfall models.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmation({ isOpen: false, type: "asset", id: 0, name: "" })}
                  className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="px-3 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-semibold transition"
                >
                  Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
