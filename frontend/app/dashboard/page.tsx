"use client";

import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { EscrowApp } from "@/components/escrow/EscrowApp";

function DashboardBody() {
  return <EscrowApp />;
}

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-grow px-4 pt-24 pb-16 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-10 animate-fade-in">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Operations
            </p>
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              Settlement <span className="text-gradient">dashboard</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
              Monitor escrow activity, open new cases, and review dockets awaiting defense or
              judgment.
            </p>
          </header>

          <Suspense
            fallback={
              <div className="glass-card p-8 text-center text-sm text-muted-foreground">
                Loading dashboard…
              </div>
            }
          >
            <DashboardBody />
          </Suspense>
        </div>
      </main>

      <footer className="border-t border-white/5 px-4 py-6">
        <p className="text-center text-xs text-muted-foreground">
          Evidence Escrow · Studionet chain 61999 · Optimistic Democracy consensus
        </p>
      </footer>
    </div>
  );
}
