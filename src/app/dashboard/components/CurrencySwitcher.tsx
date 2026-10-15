"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Check,
  ChevronDown,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useCurrency, SUPPORTED_CURRENCIES } from "@/app/context/CurrencyContext";

interface CurrencySwitcherProps {
  variant?: "card" | "header" | "compact";
  className?: string;
}

export function CurrencySwitcher({ variant = "card", className = "" }: CurrencySwitcherProps) {
  const {
    displayCurrency,
    displayCurrencyInfo,
    supportedCurrencies,
    rates,
    rateMetadata,
    setDisplayCurrency,
    refreshRates,
  } = useCurrency();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const currencyList = Object.values(supportedCurrencies);

  const handleSelect = async (code: string) => {
    await setDisplayCurrency(code);
    setIsOpen(false);
  };

  // Header / Compact Variant (Pill button with popup)
  if (variant === "header" || variant === "compact") {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-mono transition-colors shadow-sm"
          title="Change Global Display Currency"
        >
          <Globe className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold text-zinc-100">{displayCurrency}</span>
          <span className="text-zinc-500">({displayCurrencyInfo.symbol})</span>
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-72 rounded-xl bg-zinc-950/95 border border-zinc-800 shadow-2xl p-2 z-50 backdrop-blur-md"
            >
              <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                {currencyList.map((c) => {
                  const isSelected = c.code === displayCurrency;
                  const rateToINR = rates[c.code] ? (1 / rates[c.code]).toFixed(2) : null;
                  return (
                    <button
                      key={c.code}
                      onClick={() => handleSelect(c.code)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition ${
                        isSelected
                          ? "bg-zinc-800/80 text-zinc-100 font-medium border border-zinc-700/50"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono text-[11px] font-bold text-zinc-200">
                          {c.symbol}
                        </span>
                        <div className="text-left">
                          <p className="font-semibold text-zinc-200">{c.code}</p>
                          <p className="text-[10px] text-zinc-500">{c.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {rateToINR && c.code !== "INR" && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            1 {c.code} = ₹{rateToINR}
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-zinc-200" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Card Variant: Embedded in Personal Information Section
  const currentRate = rates[displayCurrency] || 1.0;
  const rateFormula =
    displayCurrency === "INR"
      ? "Base Reference Currency"
      : `1 INR = ${currentRate < 0.01 ? currentRate.toExponential(3) : currentRate.toFixed(4)} ${displayCurrency} (1 ${displayCurrency} = ₹${(1 / currentRate).toFixed(2)})`;

  return (
    <div
      className={`p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60 relative ${className}`}
      ref={dropdownRef}
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-zinc-500 text-[10px] uppercase font-mono flex items-center gap-1.5 font-semibold tracking-wider">
          <Globe className="w-3 h-3 text-zinc-400" />
          Preferred Display Currency
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/50 flex items-center gap-1 transition"
          >
            Change <ChevronDown className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Selected Currency Presentation */}
      <div className="flex items-baseline justify-between mt-0.5">
        <div>
          <p className="text-zinc-100 font-bold text-sm font-sans flex items-center gap-2">
            <span>{displayCurrencyInfo.name}</span>
            <span className="text-xs font-mono font-normal text-zinc-400">({displayCurrency})</span>
          </p>
          <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
            Symbol: <span className="font-bold text-zinc-200">{displayCurrencyInfo.symbol}</span> • ISO 4217
          </p>
        </div>
        <div className="text-right">
          <span className="text-lg font-mono font-black text-zinc-100 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60">
            {displayCurrencyInfo.symbol}
          </span>
        </div>
      </div>

      {/* Live Exchange Rate Metadata Strip */}
      <div className="mt-2.5 pt-2 border-t border-zinc-800/50 flex flex-col gap-1 text-[10px]">
        <div className="flex items-center justify-between text-zinc-400 font-mono">
          <span className="truncate">{rateFormula}</span>
          <span className="text-zinc-500 capitalize">{rateMetadata.freshness}</span>
        </div>

        <div className="flex items-center justify-between text-zinc-500 text-[9px]">
          <span className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            As of: {rateMetadata.lastUpdated}
          </span>
          <span className="truncate">Source: {rateMetadata.provider}</span>
        </div>

        {rateMetadata.isStale && (
          <div className="mt-1 flex items-center gap-1 text-[9px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
            <AlertTriangle className="w-3 h-3 shrink-0 text-zinc-400" />
            <span className="truncate">{rateMetadata.staleWarning || "Using cached reference rates."}</span>
          </div>
        )}
      </div>

      {/* Searchable Dropdown Modal/Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-zinc-950/95 border border-zinc-800 shadow-2xl p-2.5 z-50 backdrop-blur-md"
          >
            <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar pr-1">
              {currencyList.map((c) => {
                const isSelected = c.code === displayCurrency;
                const r = rates[c.code];
                const rateLabel =
                  c.code === "INR"
                    ? "Base (1.0000)"
                    : r
                    ? `1 INR = ${r < 0.01 ? r.toExponential(2) : r.toFixed(4)} ${c.code}`
                    : "Fetching rate...";

                return (
                  <button
                    key={c.code}
                    onClick={() => handleSelect(c.code)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition ${
                      isSelected
                        ? "bg-zinc-800 text-zinc-100 font-medium border border-zinc-700/60"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono text-xs font-bold text-zinc-200">
                        {c.symbol}
                      </span>
                      <div className="text-left">
                        <p className="font-semibold text-zinc-100">
                          {c.name} <span className="text-zinc-400 font-mono font-normal">({c.code})</span>
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono">{rateLabel}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 font-semibold">
                        <Check className="w-3 h-3 text-zinc-300" /> Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
