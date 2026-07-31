"use client";

import { Scale, FileText, Gavel, Coins } from "lucide-react";
import { useDisputes } from "@/lib/hooks/useEvidenceEscrow";

export function StatsCards() {
  const { data: disputes = [], isLoading } = useDisputes();

  const open = disputes.filter((d) => d.status === "OPEN").length;
  const ready = disputes.filter((d) => d.status === "READY").length;
  const judged = disputes.filter((d) => d.status === "JUDGED").length;
  const escrowTotal = disputes.reduce((sum, d) => sum + Number(d.escrow || 0), 0);

  const formatWei = (wei: number) => {
    try {
      const n = BigInt(Math.trunc(wei));
      const whole = n / 10n ** 18n;
      const frac = (n % 10n ** 18n).toString().padStart(18, "0").slice(0, 2);
      return `${whole}.${frac}`;
    } catch {
      return "0";
    }
  };

  const items = [
    {
      label: "Cases filed",
      value: isLoading ? "—" : String(disputes.length),
      icon: FileText,
      hint: "All-time dockets",
    },
    {
      label: "Awaiting defense",
      value: isLoading ? "—" : String(open),
      icon: Scale,
      hint: "Open for response",
    },
    {
      label: "Ready to settle",
      value: isLoading ? "—" : String(ready),
      icon: Gavel,
      hint: `${judged} already settled`,
    },
    {
      label: "Escrow locked",
      value: isLoading ? "—" : `${formatWei(escrowTotal)} GEN`,
      icon: Coins,
      hint: "Across active cases",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="glass-card flex flex-col gap-2 p-5 brand-card-hover">
          <div className="flex items-center justify-between">
            <item.icon className="h-5 w-5 text-accent" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {item.hint}
            </span>
          </div>
          <p className="font-display text-2xl font-bold md:text-3xl">{item.value}</p>
          <p className="text-sm text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
