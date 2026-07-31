"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Brain,
  FileCheck2,
  Lock,
  Scale,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const pillars = [
  {
    icon: Lock,
    title: "Matched escrow",
    body: "Both parties commit equal GEN. Funds remain locked until consensus returns a verdict.",
  },
  {
    icon: FileCheck2,
    title: "Public evidence",
    body: "Claims are anchored to public URLs. Validators fetch the record directly — no private uploads required.",
  },
  {
    icon: Brain,
    title: "AI consensus",
    body: "GenLayer validators independently review both sides and settle under Optimistic Democracy.",
  },
];

const flow = [
  {
    step: "01",
    title: "Open a case",
    body: "Describe the claim, attach evidence URLs, and lock your stake.",
  },
  {
    step: "02",
    title: "Match the stake",
    body: "The counterparty responds with defense materials and equal GEN.",
  },
  {
    step: "03",
    title: "Settle on-chain",
    body: "Judgment runs automatically. The escrow pays the winner — or refunds both.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pt-28 pb-20 md:px-6 lg:px-8 lg:pt-36 lg:pb-28">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.55 0.08 185 / 0.22), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-5xl text-center animate-fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-medium text-accent">
              <Scale className="h-3.5 w-3.5" />
              Intelligent Contract · GenLayer Studionet
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Evidence <span className="text-gradient">Escrow</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Settle bilateral disputes with locked GEN and verifiable web evidence.
              No intermediaries — only on-chain consensus.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="gradient" size="lg" className="h-12 px-6">
                <Link href="/dashboard">
                  Open dashboard
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6">
                <Link href="/dashboard?tab=file">File a case</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                Prompt-injection hardened
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-accent" />
                Native GEN escrow
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-accent" />
                Multi-validator review
              </span>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="border-t border-white/5 px-4 py-16 md:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 max-w-xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                Why Evidence Escrow
              </p>
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Arbitration designed for on-chain trust
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {pillars.map((p) => (
                <article key={p.title} className="glass-card brand-card-hover p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15">
                    <p.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="border-t border-white/5 px-4 py-16 md:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-xl">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                  Settlement flow
                </p>
                <h2 className="font-display text-3xl font-bold md:text-4xl">
                  Three steps from claim to payout
                </h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {flow.map((f) => (
                <article key={f.step} className="glass-card relative overflow-hidden p-6">
                  <span className="font-display text-4xl font-bold text-accent/25">{f.step}</span>
                  <h3 className="mt-3 font-display text-xl font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-20 md:px-6 lg:px-8">
          <div className="glass-card relative mx-auto max-w-7xl overflow-hidden p-8 md:p-12">
            <div className="relative z-10 max-w-2xl">
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Ready to open your first case?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Connect MetaMask on Studionet, lock stake with evidence, and let consensus settle
                the dispute.
              </p>
              <Button asChild variant="gradient" size="lg" className="mt-8 h-12 px-6">
                <Link href="/dashboard?tab=file">
                  Start filing
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              aria-hidden
              style={{
                background:
                  "radial-gradient(ellipse 50% 80% at 90% 50%, oklch(0.55 0.08 185 / 0.28), transparent 70%)",
              }}
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
          <span className="font-display text-sm font-semibold text-foreground">
            Evidence Escrow
          </span>
          <p>
            Powered by GenLayer · Private escrow arbitration — not a court of law
          </p>
        </div>
      </footer>
    </div>
  );
}
