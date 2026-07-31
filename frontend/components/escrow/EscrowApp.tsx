"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus,
  Library,
  Scale,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContractSetupBanner } from "@/components/ContractSetupBanner";
import { StatsCards } from "@/components/escrow/StatsCards";
import { HowItWorks } from "@/components/escrow/HowItWorks";
import { FileDisputeForm } from "@/components/escrow/FileDisputeForm";
import { DisputeCard } from "@/components/escrow/DisputeCard";
import { useDisputes } from "@/lib/hooks/useEvidenceEscrow";
import { getContractAddress } from "@/lib/genlayer/client";
import { Button } from "@/components/ui/button";

type Tab = "overview" | "file" | "dockets";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "file", label: "New case", icon: FilePlus },
  { id: "dockets", label: "Dockets", icon: Library },
];

export function EscrowApp() {
  const searchParams = useSearchParams();
  const initial = (searchParams.get("tab") as Tab) || "overview";
  const [tab, setTab] = useState<Tab>(
    TABS.some((t) => t.id === initial) ? initial : "overview"
  );

  useEffect(() => {
    const t = searchParams.get("tab") as Tab | null;
    if (t && TABS.some((x) => x.id === t)) setTab(t);
  }, [searchParams]);

  const contractAddr = getContractAddress();
  const { data: disputes = [], isLoading, isError, refetch, isFetching } = useDisputes();
  const sorted = [...disputes].sort((a, b) => Number(b.id) - Number(a.id));
  const ready = sorted.filter((d) => d.status === "READY");
  const open = sorted.filter((d) => d.status === "OPEN");

  return (
    <div className="space-y-8">
      <ContractSetupBanner />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-2 rounded-xl border border-white/5 bg-black/40 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                tab === t.id
                  ? "gradient-brand text-[oklch(0.14_0.02_220)] shadow-md font-semibold"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>

        {contractAddr && (
          <p className="font-mono text-[11px] text-muted-foreground sm:text-right">
            Contract {contractAddr.slice(0, 8)}…{contractAddr.slice(-6)}
          </p>
        )}
      </div>

      {tab === "overview" && (
        <div className="animate-fade-in space-y-8">
          <StatsCards />
          <HowItWorks />

          {(ready.length > 0 || open.length > 0) && (
            <section className="space-y-4">
              {ready.length > 0 && (
                <div className="glass-card space-y-4 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Scale className="h-5 w-5 text-accent" />
                      <h2 className="font-display text-xl font-bold">Pending judgment</h2>
                    </div>
                    <span className="text-xs text-muted-foreground">{ready.length} case(s)</span>
                  </div>
                  {ready.map((d) => (
                    <DisputeCard key={d.id} dispute={d} />
                  ))}
                </div>
              )}
              {open.length > 0 && (
                <div className="glass-card space-y-4 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-xl font-bold">Awaiting defense</h2>
                    <span className="text-xs text-muted-foreground">{open.length} case(s)</span>
                  </div>
                  {open.slice(0, 3).map((d) => (
                    <DisputeCard key={d.id} dispute={d} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {tab === "file" && (
        <div className="mx-auto max-w-xl animate-fade-in">
          <FileDisputeForm onDone={() => setTab("dockets")} />
        </div>
      )}

      {tab === "dockets" && (
        <div className="animate-fade-in space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold">Case docket</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                All on-chain disputes, newest first.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn("mr-2 h-3.5 w-3.5", isFetching && "animate-spin")} />
              Refresh
            </Button>
          </div>
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading dockets…</p>
          )}
          {isError && (
            <p className="text-sm text-destructive">
              Unable to load disputes. Confirm Studionet connectivity and try again.
            </p>
          )}
          {!isLoading && sorted.length === 0 && (
            <div className="glass-card space-y-3 p-10 text-center">
              <p className="font-display text-lg font-semibold">No cases yet</p>
              <p className="text-sm text-muted-foreground">
                Open a new case to lock escrow and begin settlement.
              </p>
              <Button variant="gradient" onClick={() => setTab("file")}>
                File a case
              </Button>
            </div>
          )}
          <div className="space-y-4">
            {sorted.map((d) => (
              <DisputeCard key={d.id} dispute={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
