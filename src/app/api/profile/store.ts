export interface Asset {
  id: number;
  name: string;
  asset_type: string;
  current_value: number;
  expected_return_rate: number;
  currency?: string;
}

export interface Liability {
  id: number;
  name: string;
  principal_remaining: number;
  interest_rate: number;
  monthly_payment: number;
  currency?: string;
}

export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  target_years: number;
  priority: "Essential" | "Important" | "Aspirational";
  inflation_rate: number;
  currency?: string;
}

export interface ProfileData {
  id: number;
  name: string;
  email: string;
  age: number;
  date_of_birth: string;
  occupation: string;
  risk_tolerance: string;
  currency: string;
  base_salary: number;
  monthly_expenses: number;
  net_worth: number;
  monthly_investable_surplus: number;
  months_of_runway: number;
  assets: Asset[];
  liabilities: Liability[];
  goals: Goal[];
}

function calculateProfileMetrics(p: Omit<ProfileData, "net_worth" | "monthly_investable_surplus" | "months_of_runway">): ProfileData {
  const totalAssets = p.assets.reduce((sum, a) => sum + (Number(a.current_value) || 0), 0);
  const totalLiabilities = p.liabilities.reduce((sum, l) => sum + (Number(l.principal_remaining) || 0), 0);
  const net_worth = Math.round(totalAssets - totalLiabilities);

  const totalMonthlyDebt = p.liabilities.reduce((sum, l) => sum + (Number(l.monthly_payment) || 0), 0);
  const monthly_investable_surplus = Math.round(Math.max(0, p.base_salary - p.monthly_expenses - totalMonthlyDebt));

  const liquidAssets = p.assets
    .filter((a) => {
      const type = (a.asset_type || "").toLowerCase();
      const name = (a.name || "").toLowerCase();
      return type === "cash" || name.includes("saving") || name.includes("deposit") || name.includes("liquid");
    })
    .reduce((sum, a) => sum + (Number(a.current_value) || 0), 0);

  const months_of_runway = p.monthly_expenses > 0
    ? Number((liquidAssets / p.monthly_expenses).toFixed(1))
    : 12.0;

  return {
    ...p,
    net_worth,
    monthly_investable_surplus,
    months_of_runway,
  };
}

const defaultArjun: ProfileData = calculateProfileMetrics({
  id: 1,
  name: "Arjun Sharma",
  email: "arjun@chronofi.demo",
  age: 25,
  date_of_birth: "2001-01-15",
  occupation: "Quantitative Developer",
  risk_tolerance: "Aggressive",
  currency: "INR",
  base_salary: 80000.0,
  monthly_expenses: 35000.0,
  assets: [
    { id: 1, name: "Equity Index Fund", asset_type: "Equity", current_value: 350000.0, expected_return_rate: 0.12, currency: "INR" },
    { id: 2, name: "Savings Account", asset_type: "Cash", current_value: 150000.0, expected_return_rate: 0.04, currency: "INR" },
    { id: 3, name: "Tech Stocks", asset_type: "Equity", current_value: 200000.0, expected_return_rate: 0.15, currency: "INR" },
  ],
  liabilities: [
    { id: 1, name: "Education Loan", principal_remaining: 300000.0, interest_rate: 0.085, monthly_payment: 12000.0, currency: "INR" },
  ],
  goals: [
    { id: 1, name: "Electric Vehicle (Down Payment)", target_amount: 500000.0, target_years: 2, priority: "Important", inflation_rate: 0.06, currency: "INR" },
    { id: 2, name: "First Home Down Payment", target_amount: 3000000.0, target_years: 7, priority: "Essential", inflation_rate: 0.06, currency: "INR" },
  ],
});

const defaultPriya: ProfileData = calculateProfileMetrics({
  id: 2,
  name: "Priya Patel",
  email: "priya@chronofi.demo",
  age: 35,
  date_of_birth: "1991-05-20",
  occupation: "Senior Product Architect",
  risk_tolerance: "Moderate",
  currency: "INR",
  base_salary: 250000.0,
  monthly_expenses: 75000.0,
  assets: [
    { id: 4, name: "Mutual Funds Portfolio", asset_type: "Equity", current_value: 3500000.0, expected_return_rate: 0.12, currency: "INR" },
    { id: 5, name: "Fixed Deposit & Liquid Cash", asset_type: "Cash", current_value: 1200000.0, expected_return_rate: 0.07, currency: "INR" },
    { id: 6, name: "Gold ETF", asset_type: "Commodity", current_value: 800000.0, expected_return_rate: 0.09, currency: "INR" },
  ],
  liabilities: [
    { id: 2, name: "Home Loan", principal_remaining: 1800000.0, interest_rate: 0.082, monthly_payment: 28000.0, currency: "INR" },
  ],
  goals: [
    { id: 3, name: "House Renovation", target_amount: 2000000.0, target_years: 2, priority: "Essential", inflation_rate: 0.06, currency: "INR" },
    { id: 4, name: "Retirement Independence", target_amount: 50000000.0, target_years: 25, priority: "Essential", inflation_rate: 0.06, currency: "INR" },
  ],
});

const defaultAdmin: ProfileData = calculateProfileMetrics({
  id: 3,
  name: "Administrator",
  email: "admin@chronofi.com",
  age: 35,
  date_of_birth: "1990-01-01",
  occupation: "System Administrator",
  risk_tolerance: "Moderate",
  currency: "INR",
  base_salary: 250000.0,
  monthly_expenses: 60000.0,
  assets: [
    { id: 10, name: "Reserve Liquidity", asset_type: "Cash", current_value: 1000000.0, expected_return_rate: 0.05, currency: "INR" },
    { id: 11, name: "Diversified Index Portfolio", asset_type: "Equity", current_value: 5000000.0, expected_return_rate: 0.12, currency: "INR" },
  ],
  liabilities: [],
  goals: [
    { id: 10, name: "Capital Independence", target_amount: 50000000.0, target_years: 15, priority: "Essential", inflation_rate: 0.06, currency: "INR" },
  ],
});

// In-memory store for active session
const profileStore: { [id: number]: ProfileData } = {
  1: { ...defaultArjun },
  2: { ...defaultPriya },
  3: { ...defaultAdmin },
};

export function getProfileByAuth(authHeader: string): ProfileData {
  const lower = authHeader.toLowerCase();
  if (lower.includes("admin")) return profileStore[3] || defaultAdmin;
  const isPriya = lower.includes("priya");
  const id = isPriya ? 2 : 1;
  return profileStore[id] || (isPriya ? defaultPriya : defaultArjun);
}

export function updateProfileByAuth(authHeader: string, updates: Partial<ProfileData>): ProfileData {
  const lower = authHeader.toLowerCase();
  const id = lower.includes("admin") ? 3 : (lower.includes("priya") ? 2 : 1);
  const fallback = id === 3 ? defaultAdmin : (id === 2 ? defaultPriya : defaultArjun);
  const current = profileStore[id] || { ...fallback };

  const updatedRaw = {
    ...current,
    ...updates,
    base_salary: updates.base_salary !== undefined ? Number(updates.base_salary) : current.base_salary,
    monthly_expenses: updates.monthly_expenses !== undefined ? Number(updates.monthly_expenses) : current.monthly_expenses,
    assets: updates.assets !== undefined ? updates.assets : current.assets,
    liabilities: updates.liabilities !== undefined ? updates.liabilities : current.liabilities,
    goals: updates.goals !== undefined ? updates.goals : current.goals,
  };

  const calculated = calculateProfileMetrics(updatedRaw);
  profileStore[id] = calculated;
  return calculated;
}

export function addAssetByAuth(authHeader: string, asset: Omit<Asset, "id">): ProfileData {
  const current = getProfileByAuth(authHeader);
  const newId = Date.now();
  const newAsset: Asset = { id: newId, ...asset };
  return updateProfileByAuth(authHeader, {
    assets: [...current.assets, newAsset],
  });
}

export function deleteAssetByAuth(authHeader: string, assetId: number): ProfileData {
  const current = getProfileByAuth(authHeader);
  return updateProfileByAuth(authHeader, {
    assets: current.assets.filter((a) => a.id !== assetId),
  });
}

export function addLiabilityByAuth(authHeader: string, liability: Omit<Liability, "id">): ProfileData {
  const current = getProfileByAuth(authHeader);
  const newId = Date.now();
  const newLiab: Liability = { id: newId, ...liability };
  return updateProfileByAuth(authHeader, {
    liabilities: [...current.liabilities, newLiab],
  });
}

export function deleteLiabilityByAuth(authHeader: string, liabilityId: number): ProfileData {
  const current = getProfileByAuth(authHeader);
  return updateProfileByAuth(authHeader, {
    liabilities: current.liabilities.filter((l) => l.id !== liabilityId),
  });
}

export function addGoalByAuth(authHeader: string, goal: Omit<Goal, "id">): ProfileData {
  const current = getProfileByAuth(authHeader);
  const newId = Date.now();
  const newGoal: Goal = { id: newId, ...goal };
  return updateProfileByAuth(authHeader, {
    goals: [...current.goals, newGoal],
  });
}

export function deleteGoalByAuth(authHeader: string, goalId: number): ProfileData {
  const current = getProfileByAuth(authHeader);
  return updateProfileByAuth(authHeader, {
    goals: current.goals.filter((g) => g.id !== goalId),
  });
}
