"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { FxRates } from "@/lib/lottery/fx";
import {
  convertMoney,
  formatMoney,
  isCurrencyPreference,
  type CurrencyCode,
  type CurrencyPreference,
  type FormatMoneyOptions,
  type Money
} from "@/lib/lottery/money";
import type { LotteryGameId } from "@/lib/lottery/types";

const CURRENCY_KEY = "lote:currency";
const ORDER_KEY = "lote:gameOrder";

type PreferencesValue = {
  currency: CurrencyPreference;
  setCurrency: (next: CurrencyPreference) => void;
  gameOrder: LotteryGameId[] | undefined;
  setGameOrder: (next: LotteryGameId[]) => void;
  resetGameOrder: () => void;
  rates: FxRates;
  /** Formats in the preferred currency, converting from the source currency when needed. */
  format: (value: Money | null | undefined, options?: FormatMoneyOptions) => string;
  /** The converted-to-VND reading of a non-VND amount, or null when no conversion applies. */
  toVnd: (value: Money | null | undefined) => Money | null;
  hydrated: boolean;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function PreferencesProvider({
  rates,
  defaultOrder,
  children
}: {
  rates: FxRates;
  defaultOrder: LotteryGameId[];
  children: React.ReactNode;
}) {
  const [currency, setCurrencyState] = useState<CurrencyPreference>("native");
  const [gameOrder, setGameOrderState] = useState<LotteryGameId[] | undefined>(undefined);
  const [hydrated, setHydrated] = useState(false);

  // Read persisted choices after mount so the server-rendered markup matches.
  useEffect(() => {
    setCurrencyState(readCurrency());
    setGameOrderState(readOrder(defaultOrder));
    setHydrated(true);
  }, [defaultOrder]);

  const setCurrency = useCallback((next: CurrencyPreference) => {
    setCurrencyState(next);
    writeStorage(CURRENCY_KEY, next);
  }, []);

  const setGameOrder = useCallback((next: LotteryGameId[]) => {
    setGameOrderState(next);
    writeStorage(ORDER_KEY, JSON.stringify(next));
  }, []);

  const resetGameOrder = useCallback(() => {
    setGameOrderState(defaultOrder);
    writeStorage(ORDER_KEY, null);
  }, [defaultOrder]);

  const value = useMemo<PreferencesValue>(() => {
    const target = (source: CurrencyCode) => (currency === "native" ? source : currency);

    return {
      currency,
      setCurrency,
      gameOrder,
      setGameOrder,
      resetGameOrder,
      rates,
      hydrated,
      format(input, options) {
        if (!input) return "—";
        const converted = convertMoney(input, target(input.currency), rates.rates);
        return formatMoney(converted ?? input, options);
      },
      toVnd(input) {
        if (!input || input.currency === "VND") return null;
        return convertMoney(input, "VND", rates.rates);
      }
    };
  }, [currency, setCurrency, gameOrder, setGameOrder, resetGameOrder, rates, hydrated]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) {
    throw new Error("usePreferences must be used inside a PreferencesProvider.");
  }
  return value;
}

function readCurrency(): CurrencyPreference {
  const stored = readStorage(CURRENCY_KEY);
  return isCurrencyPreference(stored) ? stored : "native";
}

function readOrder(defaultOrder: LotteryGameId[]): LotteryGameId[] {
  const stored = readStorage(ORDER_KEY);
  if (!stored) return defaultOrder;

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return defaultOrder;

    const allowed = new Set<string>(defaultOrder);
    const kept = parsed.filter((id): id is LotteryGameId => typeof id === "string" && allowed.has(id));
    const seen = new Set(kept);

    // Append games added since the preference was saved so none disappear.
    return [...kept, ...defaultOrder.filter((id) => !seen.has(id))];
  } catch {
    return defaultOrder;
  }
}

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the choice still applies for this session.
  }
}
