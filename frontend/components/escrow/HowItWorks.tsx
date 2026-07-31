"use client";

import { FilePlus, Shield, Brain, Coins } from "lucide-react";

const steps = [
  {
    icon: FilePlus,
    title: "File the claim",
    desc: "Submit the dispute narrative, attach public evidence URLs, and lock GEN as collateral.",
  },
  {
    icon: Shield,
    title: "Match & respond",
    desc: "The counterparty posts a defense with evidence and deposits an equal stake.",
  },
  {
    icon: Brain,
    title: "Consensus review",
    desc: "Validators independently fetch both evidence sets and agree on a verdict.",
  },
  {
    icon: Coins,
    title: "Automatic settlement",
    desc: "The escrow pays the prevailing party, or returns both stakes if evidence is insufficient.",
  },
];

export function HowItWorks() {
  return (
    <section className="glass-card p-6 md:p-8">
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Protocol
        </p>
        <h2 className="font-display text-2xl font-bold">How settlement works</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.title} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
                {i + 1}
              </span>
              <s.icon className="h-5 w-5 text-accent" />
            </div>
            <h3 className="font-semibold">{s.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
