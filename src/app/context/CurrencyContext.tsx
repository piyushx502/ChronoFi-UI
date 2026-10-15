"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  minor_units: number;
  locale: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", minor_units: 2, locale: "en-IN" },
  USD: { code: "USD", name: "US Dollar", symbol: "$", minor_units: 2, locale: "en-US" },
  EUR: { code: "EUR", name: "Euro", symbol: "€", minor_units: 2, locale: "de-DE" },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", minor_units: 2, locale: "en-GB" },
  JPY: { code: "JPY", name: "Japanese Yen", symbol: "¥", minor_units: 0, locale: "ja-JP" },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "CA$", minor_units: 2, locale: "en-CA" },
  AUD: { code: "AUD", name: "Australian Dollar", symbol: "AU$", minor_units: 2, locale: "en-AU" },
  SGD: { code: "SGD", name: "Singapore Dollar", symbol: "SG$", minor_units: 2, locale: "en-SG" },
  AED: { code: "AED", name: "UAE Dirham", symbol: "AED", minor_units: 2, locale: "en-AE" },
};

export interface RateMetadata {
  provider: string;
  lastUpdated: string;
  nextUpdate?: string;
  isStale: boolean;
  staleWarning?: string;
  freshness: string;
  isLoading: boolean;
  error?: string;
}

export interface ConversionResult {
  convertedAmount: number;
  originalAmount: number;
  exchangeRate: number;
  isIdentity: boolean;
}

interface CurrencyContextValue {
  displayCurrency: string;
  displayCurrencyInfo: CurrencyInfo;
  supportedCurrencies: Record<string, CurrencyInfo>;
  rates: Record<string, number>;
  rateMetadata: RateMetadata;
  setDisplayCurrency: (currency: string) => Promise<void>;
  refreshRates: (force?: boolean) => Promise<void>;
  convert: (amount: number, fromCurrency?: string, toCurrency?: string) => ConversionResult;
  formatMoney: (
    amount: number,
    fromCurrency?: string,
    options?: { showCode?: boolean; maximumFractionDigits?: number }
  ) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [displayCurrency, setDisplayCurrencyState] = useState<string>("INR");
  const [rates, setRates] = useState<Record<string, number>>({ INR: 1.0 });
  const [rateMetadata, setRateMetadata] = useState<RateMetadata>({
    provider: "ExchangeRate-API (Daily Reference)",
    lastUpdated: "Initializing...",
    isStale: false,
    freshness: "Daily Reference Rate",
    isLoading: true,
  });

  // 1. Initial hydration: restore stored currency and cached rates from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCurrency = localStorage.getItem("chronofi_display_currency");
      if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency.toUpperCase()]) {
        setDisplayCurrencyState(savedCurrency.toUpperCase());
      }

      const cachedRates = localStorage.getItem("chronofi_rates_cache");
      if (cachedRates) {
        try {
          const parsed = JSON.parse(cachedRates);
          if (parsed.rates && parsed.rates.INR) {
            setRates(parsed.rates);
            setRateMetadata((prev) => ({
              ...prev,
              provider: parsed.provider || prev.provider,
              lastUpdated: parsed.last_updated || prev.lastUpdated,
              nextUpdate: parsed.next_update,
              isStale: !!parsed.is_stale,
              staleWarning: parsed.stale_warning,
              isLoading: false,
            }));
          }
        } catch {
          // ignore corrupted local cache
        }
      }
    }
  }, []);

  // 2. Fetch fresh live exchange rates from backend service
  const fetchRates = useCallback(async (force = false) => {
    setRateMetadata((prev) => ({ ...prev, isLoading: true, error: undefined }));
    try {
      const res = await fetch(`/api/rates/latest?base=INR${force ? "&force_refresh=true" : ""}`, {
        cache: force ? "no-store" : "default",
      });

      if (!res.ok) {
        throw new Error(`Exchange rate provider returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.rates) {
        setRates(data.rates);
        setRateMetadata({
          provider: data.provider || "ExchangeRate-API (Daily Reference)",
          lastUpdated: data.last_updated || new Date().toUTCString(),
          nextUpdate: data.next_update,
          isStale: !!data.is_stale,
          staleWarning: data.stale_warning,
          freshness: data.freshness || "Daily Reference Rate",
          isLoading: false,
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("chronofi_rates_cache", JSON.stringify(data));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch exchange rates:", err);
      setRateMetadata((prev) => ({
        ...prev,
        isLoading: false,
        isStale: true,
        staleWarning: (err as Error).message || "Upstream rates offline. Displaying cached reference rates.",
      }));
    }
  }, []);

  // Auto-refresh exchange rates every 3 hours (3 * 60 * 60 * 1000 ms)
  useEffect(() => {
    fetchRates();
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
    const intervalId = setInterval(() => {
      fetchRates(true);
    }, THREE_HOURS_MS);
    return () => clearInterval(intervalId);
  }, [fetchRates]);

  // 3. User changes preferred display currency
  const setDisplayCurrency = useCallback(async (newCurr: string) => {
    const code = newCurr.toUpperCase().trim();
    if (!SUPPORTED_CURRENCIES[code]) return;

    setDisplayCurrencyState(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("chronofi_display_currency", code);
    }

    // Persist in profile on the backend without altering transaction records
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token") || new URLSearchParams(window.location.search).get("token")
          : null;
      if (token) {
        await fetch("/api/profile/me", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ currency: code }),
        });
      }
    } catch (err) {
      console.warn("Could not sync currency preference to backend:", err);
    }
  }, []);

  // 4. Safe decimal conversion engine
  const convert = useCallback(
    (amount: number, fromCurrency = "INR", toCurrency?: string): ConversionResult => {
      const target = (toCurrency || displayCurrency).toUpperCase();
      const source = fromCurrency.toUpperCase();

      if (isNaN(amount) || amount === 0 || source === target) {
        return {
          convertedAmount: amount,
          originalAmount: amount,
          exchangeRate: 1.0,
          isIdentity: true,
        };
      }

      // Rates are base INR
      const rateSource = rates[source] ?? (source === "INR" ? 1.0 : undefined);
      const rateTarget = rates[target] ?? (target === "INR" ? 1.0 : undefined);

      if (!rateSource || !rateTarget || rateSource <= 0) {
        return {
          convertedAmount: amount,
          originalAmount: amount,
          exchangeRate: 1.0,
          isIdentity: true,
        };
      }

      const crossRate = rateTarget / rateSource;
      const targetInfo = SUPPORTED_CURRENCIES[target] || { minor_units: 2 };
      const factor = Math.pow(10, targetInfo.minor_units);
      const converted = Math.round(amount * crossRate * factor) / factor;

      return {
        convertedAmount: converted,
        originalAmount: amount,
        exchangeRate: crossRate,
        isIdentity: false,
      };
    },
    [rates, displayCurrency]
  );

  // 5. Global currency formatter
  const formatMoney = useCallback(
    (
      amount: number,
      fromCurrency = "INR",
      options?: { showCode?: boolean; maximumFractionDigits?: number }
    ): string => {
      if (isNaN(amount)) return "—";
      const { convertedAmount } = convert(amount, fromCurrency, displayCurrency);
      const info =
        SUPPORTED_CURRENCIES[displayCurrency] || {
          symbol: displayCurrency,
          locale: "en-US",
          minor_units: 2,
        };

      const maxDigits =
        options?.maximumFractionDigits !== undefined ? options.maximumFractionDigits : info.minor_units;

      try {
        const formatted = new Intl.NumberFormat(info.locale, {
          style: "currency",
          currency: displayCurrency,
          maximumFractionDigits: maxDigits,
          minimumFractionDigits: maxDigits === 0 ? 0 : Number.isInteger(convertedAmount) ? 0 : 2,
        }).format(convertedAmount);

        return options?.showCode ? `${formatted} ${displayCurrency}` : formatted;
      } catch {
        return `${info.symbol}${convertedAmount.toLocaleString()}`;
      }
    },
    [convert, displayCurrency]
  );

  const displayCurrencyInfo = useMemo(() => {
    return SUPPORTED_CURRENCIES[displayCurrency] || SUPPORTED_CURRENCIES.INR;
  }, [displayCurrency]);

  const value = useMemo(
    () => ({
      displayCurrency,
      displayCurrencyInfo,
      supportedCurrencies: SUPPORTED_CURRENCIES,
      rates,
      rateMetadata,
      setDisplayCurrency,
      refreshRates: fetchRates,
      convert,
      formatMoney,
    }),
    [displayCurrency, displayCurrencyInfo, rates, rateMetadata, setDisplayCurrency, fetchRates, convert, formatMoney]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
