"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { FxRates } from "@/lib/lottery/fx";
import { orderGames } from "@/lib/lottery/games";
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
const HIDDEN_KEY = "lote:hiddenGames";

type PreferencesValue = {
  currency: CurrencyPreference;
  setCurrency: (next: CurrencyPreference) => void;
  gameOrder: LotteryGameId[] | undefined;
  setGameOrder: (next: LotteryGameId[]) => void;
  hiddenGames: LotteryGameId[];
  isHidden: (id: LotteryGameId) => boolean;
  toggleHidden: (id: LotteryGameId) => void;
  showAllGames: () => void;
  resetGames: () => void;
  /** Applies the saved order and drops hidden games in one step. */
  arrangeGames: <T extends { id: LotteryGameId }>(list: T[], keepId?: LotteryGameId) => T[];
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
  const [hiddenGames, setHiddenGamesState] = useState<LotteryGameId[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read persisted choices after mount so the server-rendered markup matches.
  useEffect(() => {
    setCurrencyState(readCurrency());
    setGameOrderState(readOrder(defaultOrder));
    setHiddenGamesState(readHidden(defaultOrder));
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

  const toggleHidden = useCallback(
    (id: LotteryGameId) => {
      setHiddenGamesState((current) => {
        const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
        // Hiding everything would leave an empty dashboard with no way back.
        if (next.length >= defaultOrder.length) return current;

        writeStorage(HIDDEN_KEY, JSON.stringify(next));
        return next;
      });
    },
    [defaultOrder]
  );

  const showAllGames = useCallback(() => {
    setHiddenGamesState([]);
    writeStorage(HIDDEN_KEY, null);
  }, []);

  const resetGames = useCallback(() => {
    setGameOrderState(defaultOrder);
    setHiddenGamesState([]);
    writeStorage(ORDER_KEY, null);
    writeStorage(HIDDEN_KEY, null);
  }, [defaultOrder]);

  const value = useMemo<PreferencesValue>(() => {
    const target = (source: CurrencyCode) => (currency === "native" ? source : currency);
    const hidden = new Set(hiddenGames);

    return {
      currency,
      setCurrency,
      gameOrder,
      setGameOrder,
      hiddenGames,
      toggleHidden,
      showAllGames,
      resetGames,
      rates,
      hydrated,
      isHidden: (id) => hidden.has(id),
      arrangeGames(list, keepId) {
        // keepId keeps the game being viewed on screen even when it is hidden.
        return orderGames(list, gameOrder).filter((item) => !hidden.has(item.id) || item.id === keepId);
      },
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
  }, [
    currency,
    setCurrency,
    gameOrder,
    setGameOrder,
    hiddenGames,
    toggleHidden,
    showAllGames,
    resetGames,
    rates,
    hydrated
  ]);

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
  const known = readIdList(ORDER_KEY, defaultOrder);
  if (!known) return defaultOrder;

  const seen = new Set(known);
  // Append games added since the preference was saved so none disappear.
  return [...known, ...defaultOrder.filter((id) => !seen.has(id))];
}

function readHidden(defaultOrder: LotteryGameId[]): LotteryGameId[] {
  const known = readIdList(HIDDEN_KEY, defaultOrder) ?? [];
  // A stored list that hides everything is treated as corrupt rather than obeyed.
  return known.length >= defaultOrder.length ? [] : known;
}

/** Parses a stored id array, dropping anything that is no longer a real game. */
function readIdList(key: string, allowed: LotteryGameId[]): LotteryGameId[] | null {
  const stored = readStorage(key);
  if (!stored) return null;

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return null;

    const valid = new Set<string>(allowed);
    return [...new Set(parsed.filter((id): id is LotteryGameId => typeof id === "string" && valid.has(id)))];
  } catch {
    return null;
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
