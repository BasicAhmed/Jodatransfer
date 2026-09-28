"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeftRight, BarChart3, LogOut, Plus, RefreshCw, Target, TrendingUp, Wallet } from "lucide-react";
import {
  getRatesWithMargin,
  setPairMargin,
  setSdgUsdtOverride,
  computeRate,
  updateRatesFromLiveFx,
  type RateRow,
} from "@/lib/rates";
import { formatSmart } from "@/lib/format";
import { formatRelativeTime } from "@/lib/relativeTime";
import { getDailyTarget, setDailyTarget, setMarginPercent } from "@/lib/settings";
import { addSale, getRecentSales, type SaleEntry } from "@/lib/sales";
import { PAIRS, CURRENCIES } from "@/lib/corridors";

type Tab = "rates" | "profit";

function todayStr() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <RefreshCw size={20} className="animate-spin text-primary" />
    </div>
  );
}

function SmallButton({
  onClick,
  busy,
  children,
}: {
  onClick: () => void;
  busy?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="shrink-0 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-ink shadow-soft transition-all hover:-translate-y-px hover:border-primary/60 disabled:opacity-60"
    >
      {busy ? "…" : children}
    </button>
  );
}

export default function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>("rates");

  // Rates tab state
  const [ratesLoaded, setRatesLoaded] = useState(false);
  const [margin, setMargin] = useState(3.5);
  const [marginInput, setMarginInput] = useState("3.5");
  const [savingMargin, setSavingMargin] = useState(false);
  const [rates, setRates] = useState<RateRow[]>([]);
  const [marginInputs, setMarginInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fxUpdating, setFxUpdating] = useState(false);
  const [fxMessage, setFxMessage] = useState<string | null>(null);
  const [sdgOverrideInput, setSdgOverrideInput] = useState("");
  const [savingSdgOverride, setSavingSdgOverride] = useState(false);

  // Profit tab state
  const [profitLoaded, setProfitLoaded] = useState(false);
  const [saleDate, setSaleDate] = useState(todayStr());
  const [usdSold, setUsdSold] = useState("");
  const [savingSale, setSavingSale] = useState(false);
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [dailyTarget, setDailyTargetState] = useState(2000);
  const [targetInput, setTargetInput] = useState("2000");
  const [savingTarget, setSavingTarget] = useState(false);

  // Load only the active tab's data — switching tabs loads on demand, not upfront.
  useEffect(() => {
    if (tab === "rates" && !ratesLoaded) {
      getRatesWithMargin().then(({ rates, defaultMargin }) => {
        setRates(rates);
        setMargin(defaultMargin);
        setMarginInput(String(defaultMargin));
        setRatesLoaded(true);
      });
    }
    if (tab === "profit" && !profitLoaded) {
      Promise.all([getRecentSales(400), getDailyTarget()]).then(([salesData, target]) => {
        setSales(salesData);
        setDailyTargetState(target);
        setTargetInput(String(target));
        setProfitLoaded(true);
      });
    }
  }, [tab, ratesLoaded, profitLoaded]);

  const todaysSale = sales.find((s) => s.date === todayStr());
  const todaysUsd = todaysSale?.usdSold ?? 0;
  const targetProgress = dailyTarget > 0 ? Math.min(100, (todaysUsd / dailyTarget) * 100) : 0;

  const currentMonth = todayStr().slice(0, 7);
  const thisMonthSales = sales.filter((s) => s.date.startsWith(currentMonth));
  const thisMonthProfit = thisMonthSales.reduce((sum, s) => sum + s.profit, 0);
  const thisMonthUsd = thisMonthSales.reduce((sum, s) => sum + s.usdSold, 0);

  const monthlyMap = new Map<string, { usdSold: number; profit: number }>();
  for (const s of sales) {
    const month = s.date.slice(0, 7);
    const existing = monthlyMap.get(month) ?? { usdSold: 0, profit: 0 };
    monthlyMap.set(month, {
      usdSold: existing.usdSold + s.usdSold,
      profit: existing.profit + s.profit,
    });
  }
  const monthlyTotals = Array.from(monthlyMap.entries())
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => (a.month < b.month ? 1 : -1))
    .slice(0, 12);

  const currentSdgUsdt = rates.find((r) => (r.from === "SDG" || r.to === "SDG") && r.sdgSource)?.sdgSource
    ?.usdtToSdg;

  const lastUpdated = rates
    .map((r) => r.updatedAt)
    .filter((d): d is string => !!d)
    .sort()
    .pop();

  /** Applies a save result to local state directly — no refetch. */
  function patchRatePair(a: string, b: string, updates: Partial<RateRow>) {
    setRates((prev) =>
      prev.map((r) => {
        if ((r.from === a && r.to === b) || (r.from === b && r.to === a)) {
          const merged = { ...r, ...updates };
          return { ...merged, rate: computeRate(r.from, r.to, merged.marketPrice, merged.marginPercent) };
        }
        return r;
      })
    );
  }

  async function savePair(a: (typeof PAIRS)[number]["a"], b: (typeof PAIRS)[number]["b"]) {
    const key = `${a}_${b}`;
    const row = rates.find((r) => r.from === a && r.to === b);
    if (!row) return;

    // Market price is only ever set by the automated FX update — this
    // just saves the margin override for this pair.
    const marginRaw = marginInputs[key];
    const newMarginOverride = marginRaw === undefined || marginRaw.trim() === "" ? null : parseFloat(marginRaw);

    setSaving(key);
    setSaveError(null);
    try {
      await setPairMargin(a, b, newMarginOverride);
      const effectiveMargin = newMarginOverride ?? margin;
      patchRatePair(a, b, {
        marginPercent: effectiveMargin,
        marginOverride: newMarginOverride ?? undefined,
        updatedAt: new Date().toISOString(),
      });
      setMarginInputs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
    setSaving(null);
  }

  async function saveGlobalMargin() {
    setSavingMargin(true);
    setSaveError(null);
    try {
      const val = parseFloat(marginInput);
      await setMarginPercent(val);
      setMargin(val);
      setRates((prev) =>
        prev.map((r) =>
          r.marginOverride == null
            ? { ...r, marginPercent: val, rate: computeRate(r.from, r.to, r.marketPrice, val) }
            : r
        )
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
    setSavingMargin(false);
  }

  async function updateNow() {
    setFxUpdating(true);
    setFxMessage(null);
    try {
      const { updated, skipped } = await updateRatesFromLiveFx();
      const stamp = new Date().toISOString();
      for (const u of updated) {
        patchRatePair(u.from, u.to, { marketPrice: u.marketPrice, sdgSource: u.sdgSource, updatedAt: stamp });
      }
      setFxMessage(
        skipped.length > 0
          ? `✅ ${updated.length} تحديث — تعذر: ${skipped.join(", ")}`
          : `✅ تم تحديث ${updated.length} زوج`
      );
    } catch (err) {
      setFxMessage(`❌ ${err instanceof Error ? err.message : String(err)}`);
    }
    setFxUpdating(false);
  }

  async function saveSdgOverride() {
    const val = parseFloat(sdgOverrideInput);
    if (!val) return;
    setSavingSdgOverride(true);
    setSaveError(null);
    try {
      await setSdgUsdtOverride(val);
      setRates((prev) =>
        prev.map((r) => {
          if ((r.from !== "SDG" && r.to !== "SDG") || !r.sdgSource) return r;
          const ratio = val / r.sdgSource.usdtToSdg;
          const newMarketPrice = r.marketPrice * ratio;
          return {
            ...r,
            marketPrice: newMarketPrice,
            rate: computeRate(r.from, r.to, newMarketPrice, r.marginPercent),
            sdgSource: { usdtToSdg: val, prices: [] },
            updatedAt: new Date().toISOString(),
          };
        })
      );
      setSdgOverrideInput("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
    setSavingSdgOverride(false);
  }

  async function addSaleEntry() {
    const val = parseFloat(usdSold);
    if (!val) return;
    setSavingSale(true);
    try {
      await addSale(saleDate, val, margin);
      const profitDelta = val * (margin / 100);
      setSales((prev) => {
        const existing = prev.find((s) => s.date === saleDate);
        const updatedEntry: SaleEntry = existing
          ? { ...existing, usdSold: existing.usdSold + val, profit: existing.profit + profitDelta }
          : { date: saleDate, usdSold: val, profit: profitDelta, updatedAt: new Date().toISOString() };
        const rest = prev.filter((s) => s.date !== saleDate);
        return [updatedEntry, ...rest].sort((x, y) => (x.date < y.date ? 1 : -1));
      });
      setUsdSold("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
    setSavingSale(false);
  }

  async function saveTarget() {
    setSavingTarget(true);
    try {
      const val = parseFloat(targetInput);
      await setDailyTarget(val);
      setDailyTargetState(val);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
    setSavingTarget(false);
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-brand-navy p-1.5 shadow-soft">
              <Image src="/logo-icon.png" alt="" width={24} height={28} className="h-7 w-auto" />
            </div>
            <div className="leading-tight">
              <p className="font-display text-sm font-bold text-ink">
                Joda<span className="text-primary">transfer</span>
              </p>
              <p className="text-[11px] text-subtle">لوحة الإدارة</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            aria-label="تسجيل الخروج"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted shadow-soft transition-colors hover:text-ink"
          >
            <LogOut size={14} /> خروج
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 pt-6">
        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border/70 bg-surface2 p-1 shadow-well">
          {(
            [
              ["rates", "الأسعار", TrendingUp],
              ["profit", "الأرباح", Wallet],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className="relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold"
            >
              {tab === value && (
                <motion.span
                  layoutId="admin-tab"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-primary shadow-glow"
                />
              )}
              <span className={`relative flex items-center gap-2 ${tab === value ? "text-bg" : "text-muted"}`}>
                <Icon size={15} /> {label}
              </span>
            </button>
          ))}
        </div>

        {saveError && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
            فشل الحفظ: {saveError} — تأكد من نشر قواعد Firestore.
          </p>
        )}

        {tab === "rates" &&
          (!ratesLoaded ? (
            <Spinner />
          ) : (
            <div className="mt-5 space-y-4">
              {/* Controls */}
              <div className="card overflow-hidden p-0">
                <div className="flex items-center justify-between gap-3 bg-gradient-to-br from-primary/15 via-transparent to-accent/10 p-5">
                  <div>
                    <p className="text-xs text-muted">آخر تحديث للأسعار</p>
                    <p className="mt-0.5 font-display text-lg font-bold text-ink">
                      {lastUpdated ? formatRelativeTime(lastUpdated) : "لم تُحدَّث بعد"}
                    </p>
                  </div>
                  <button onClick={updateNow} disabled={fxUpdating} className="btn-primary px-5 py-3 text-sm">
                    <RefreshCw size={15} className={fxUpdating ? "animate-spin" : ""} />
                    {fxUpdating ? "جارٍ التحديث…" : "تحديث الآن"}
                  </button>
                </div>
                {fxMessage && (
                  <p className="border-t border-border/60 px-5 py-2.5 text-xs text-muted">{fxMessage}</p>
                )}

                <div className="grid gap-4 border-t border-border/60 p-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-subtle">الهامش العام</label>
                    <div className="flex gap-2" dir="ltr">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={marginInput}
                          onChange={(e) => setMarginInput(e.target.value)}
                          className="field py-2.5 pl-3.5 pr-8 font-mono text-sm font-semibold"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-subtle">
                          %
                        </span>
                      </div>
                      <SmallButton onClick={saveGlobalMargin} busy={savingMargin}>
                        حفظ
                      </SmallButton>
                    </div>
                  </div>

                  {currentSdgUsdt !== undefined && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-subtle">
                        سعر USDT/SDG — الحالي{" "}
                        <span className="font-mono font-semibold text-ink">{currentSdgUsdt.toFixed(2)}</span>
                      </label>
                      <div className="flex gap-2" dir="ltr">
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={sdgOverrideInput}
                          onChange={(e) => setSdgOverrideInput(e.target.value)}
                          placeholder="سعر جديد"
                          className="field flex-1 px-3.5 py-2.5 font-mono text-sm font-semibold"
                        />
                        <SmallButton onClick={saveSdgOverride} busy={savingSdgOverride}>
                          تطبيق
                        </SmallButton>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pair cards */}
              <div className="grid gap-3 sm:grid-cols-2">
                {PAIRS.map(({ a, b }) => {
                  const row = rates.find((r) => r.from === a && r.to === b);
                  if (!row) return null;
                  const fromC = CURRENCIES[a];
                  const toC = CURRENCIES[b];
                  const key = `${a}_${b}`;
                  const marginValue =
                    marginInputs[key] ?? (row.marginOverride != null ? String(row.marginOverride) : "");
                  const isSdg = a === "SDG" || b === "SDG";

                  return (
                    <div key={key} className="card-sm p-4">
                      <div className="flex items-center justify-between" dir="ltr">
                        <div className="flex items-center gap-2.5">
                          <div className="flex -space-x-2">
                            <span className="flex size-8 items-center justify-center rounded-full border-2 border-surface bg-surface2 text-base shadow-soft">
                              {fromC.flag}
                            </span>
                            <span className="flex size-8 items-center justify-center rounded-full border-2 border-surface bg-surface2 text-base shadow-soft">
                              {toC.flag}
                            </span>
                          </div>
                          <span className="flex items-center gap-1.5 font-mono text-sm font-bold text-ink">
                            {a} <ArrowLeftRight size={12} className="text-subtle" /> {b}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {row.marginOverride != null && (
                            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                              هامش خاص
                            </span>
                          )}
                          <span className="text-[11px] text-subtle">
                            {row.updatedAt ? formatRelativeTime(row.updatedAt) : "—"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2" dir="ltr">
                        {(
                          [
                            [a, b],
                            [b, a],
                          ] as const
                        ).map(([x, y]) => (
                          <div key={`${x}${y}`} className="rounded-xl bg-surface2 px-3 py-2.5 shadow-well">
                            <p className="font-mono text-[10px] font-medium text-subtle">
                              {x} → {y}
                            </p>
                            <p className="mt-0.5 font-mono text-base font-bold text-primary">
                              {formatSmart(computeRate(x, y, row.marketPrice, row.marginPercent))}
                            </p>
                          </div>
                        ))}
                      </div>

                      {isSdg && row.sdgSource && (
                        <p className="mt-2 text-[11px] text-subtle" dir="ltr">
                          USDT → SDG{" "}
                          <span className="font-mono font-semibold text-muted">{row.sdgSource.usdtToSdg.toFixed(2)}</span>
                        </p>
                      )}

                      <p className="mt-3 mb-1.5 text-[11px] text-subtle">
                        هامش هذا الزوج — اتركه فاضي لاستخدام الهامش العام ({margin}%)
                      </p>
                      <div className="flex gap-2" dir="ltr">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="any"
                            inputMode="decimal"
                            value={marginValue}
                            onChange={(e) => setMarginInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                            placeholder={String(margin)}
                            aria-label="هامش هذا الزوج"
                            className="field py-2.5 pl-3.5 pr-8 font-mono text-sm"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-subtle">
                            %
                          </span>
                        </div>
                        <button
                          onClick={() => savePair(a, b)}
                          className="btn-primary shrink-0 px-5 py-2.5 text-xs"
                        >
                          {saving === key ? "…" : "حفظ"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

        {tab === "profit" &&
          (!profitLoaded ? (
            <Spinner />
          ) : (
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* This month's profit */}
                <div className="card relative overflow-hidden p-5">
                  <div aria-hidden="true" className="absolute inset-0 -z-0 bg-gradient-to-br from-primary/20 via-primary/5 to-accent/15" />
                  <div className="relative">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                      <BarChart3 size={14} className="text-primary" /> أرباحك هذا الشهر
                    </p>
                    <p className="mt-2 font-mono text-3xl font-extrabold text-ink" dir="ltr">
                      ${thisMonthProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      من مبيعات <span className="font-mono" dir="ltr">${thisMonthUsd.toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                {/* Daily target */}
                <div className="card p-5">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                      <Target size={14} className="text-primary" /> هدف اليوم
                    </p>
                    <span className="font-mono text-xs font-bold text-primary">{targetProgress.toFixed(0)}%</span>
                  </div>
                  <p className="mt-2 font-mono text-xl font-bold text-ink" dir="ltr">
                    ${todaysUsd.toLocaleString()}{" "}
                    <span className="text-sm font-medium text-subtle">/ ${dailyTarget.toLocaleString()}</span>
                  </p>
                  <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface2 shadow-well">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${targetProgress}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-brand-gradient"
                    />
                  </div>
                  <div className="mt-3 flex gap-2" dir="ltr">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-subtle">
                        $
                      </span>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={targetInput}
                        onChange={(e) => setTargetInput(e.target.value)}
                        aria-label="الهدف اليومي"
                        className="field py-2 pl-7 pr-3 font-mono text-sm"
                      />
                    </div>
                    <SmallButton onClick={saveTarget} busy={savingTarget}>
                      حفظ الهدف
                    </SmallButton>
                  </div>
                </div>
              </div>

              {/* Add a sale */}
              <div className="card p-5">
                <p className="text-sm font-semibold text-ink">تسجيل عملية</p>
                <div className="mt-3 grid grid-cols-2 gap-2.5" dir="ltr">
                  <label className="text-[11px] font-medium text-subtle">
                    التاريخ
                    <input
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="field mt-1 px-3 py-2.5 text-sm"
                    />
                  </label>
                  <label className="text-[11px] font-medium text-subtle">
                    مبلغ العملية ($)
                    <input
                      type="number"
                      step="any"
                      inputMode="decimal"
                      value={usdSold}
                      onChange={(e) => setUsdSold(e.target.value)}
                      placeholder="200"
                      className="field mt-1 px-3 py-2.5 font-mono text-sm"
                    />
                  </label>
                </div>
                <button onClick={addSaleEntry} disabled={savingSale} className="btn-primary mt-3 w-full py-3 text-sm">
                  <Plus size={16} /> {savingSale ? "جارٍ الإضافة…" : "إضافة العملية"}
                </button>
              </div>

              {/* Monthly totals */}
              {monthlyTotals.length > 0 && (
                <div className="card overflow-hidden p-0">
                  <p className="border-b border-border/60 px-5 py-3.5 text-sm font-semibold text-ink">الإجمالي الشهري</p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[360px] border-collapse text-left font-mono text-sm" dir="ltr">
                      <thead>
                        <tr className="bg-surface2 text-xs text-subtle">
                          <th className="px-5 py-2.5 font-medium">Month</th>
                          <th className="px-5 py-2.5 font-medium">USD Sold</th>
                          <th className="px-5 py-2.5 font-medium">Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyTotals.map((m) => (
                          <tr key={m.month} className="border-t border-border/50">
                            <td className="px-5 py-3 text-ink">{m.month}</td>
                            <td className="px-5 py-3 text-muted">${m.usdSold.toLocaleString()}</td>
                            <td className="px-5 py-3 font-semibold text-primary">
                              ${m.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
