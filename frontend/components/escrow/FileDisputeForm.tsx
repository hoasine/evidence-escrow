"use client";

import { useState } from "react";
import { Loader2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFileDispute } from "@/lib/hooks/useEvidenceEscrow";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { parseGenToWei } from "@/lib/utils/format";
import { success, error as toastError } from "@/lib/utils/toast";

const RESPONSE_DEADLINE_OPTIONS = [
  { value: "0", label: "Immediate (0s) — test recover path", seconds: 0 },
  { value: "3600", label: "1 hour", seconds: 60 * 60 },
  { value: "86400", label: "24 hours", seconds: 24 * 60 * 60 },
  { value: "259200", label: "72 hours (default)", seconds: 72 * 60 * 60 },
  { value: "604800", label: "7 days", seconds: 7 * 24 * 60 * 60 },
  { value: "custom", label: "Custom…", seconds: -1 },
] as const;

function formatDeadlineHint(seconds: number) {
  if (seconds <= 0) {
    return "Deadline is immediate. You can recover stake right after filing if no response arrives.";
  }
  if (seconds < 3600) return `Response window: ${seconds} seconds.`;
  if (seconds < 86400) return `Response window: ${Math.round(seconds / 3600)} hour(s).`;
  return `Response window: ${Math.round(seconds / 86400)} day(s).`;
}

export function FileDisputeForm({ onDone }: { onDone?: () => void }) {
  const { isConnected, address } = useWallet();
  const file = useFileDispute();
  const [defendant, setDefendant] = useState("");
  const [title, setTitle] = useState("");
  const [claim, setClaim] = useState("");
  const [urls, setUrls] = useState("");
  const [stake, setStake] = useState("0.1");
  const [deadlineOption, setDeadlineOption] = useState("259200");
  const [customHours, setCustomHours] = useState("2");

  const pending = file.isPending;

  const resolveResponseWindowSeconds = (): number | null => {
    if (deadlineOption === "custom") {
      const hours = Number(customHours);
      if (!Number.isFinite(hours) || hours < 0) return null;
      const seconds = Math.floor(hours * 60 * 60);
      if (seconds > 30 * 24 * 60 * 60) return null;
      return seconds;
    }
    const selected = RESPONSE_DEADLINE_OPTIONS.find((o) => o.value === deadlineOption);
    return selected && selected.seconds >= 0 ? selected.seconds : null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      toastError("Connect your wallet to continue");
      return;
    }
    if (
      address &&
      defendant.trim().toLowerCase() === address.toLowerCase()
    ) {
      toastError("Invalid respondent", {
        description: "You cannot file a case against your own address.",
      });
      return;
    }
    const responseWindowSeconds = resolveResponseWindowSeconds();
    if (responseWindowSeconds === null) {
      toastError("Invalid deadline", {
        description: "Choose a preset or enter custom hours between 0 and 720 (30 days).",
      });
      return;
    }
    try {
      const id = await file.mutateAsync({
        defendant: defendant.trim(),
        title: title.trim(),
        claim: claim.trim(),
        evidenceUrls: urls.trim(),
        stakeWei: parseGenToWei(stake),
        responseWindowSeconds,
      });
      success("Case filed", {
        description:
          responseWindowSeconds === 0
            ? `Docket #${id} filed with immediate deadline. You can recover stake if no response arrives.`
            : `Docket #${id} is on-chain. Settlement begins when the respondent matches the stake.`,
      });
      setTitle("");
      setClaim("");
      setUrls("");
      onDone?.();
    } catch (err) {
      toastError("Unable to file case", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <form onSubmit={submit} className="glass-card space-y-6 p-6 md:p-8">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          New case
        </p>
        <h2 className="font-display text-xl font-bold">File a dispute</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Lock GEN against a counterparty. They must match your stake and submit defense evidence
          before judgment can run.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose a response deadline below. If no response arrives in time, you can recover your stake.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defendant">Respondent wallet</Label>
        <Input
          id="defendant"
          required
          value={defendant}
          onChange={(e) => setDefendant(e.target.value)}
          placeholder="0x… (must differ from your address)"
          className="font-mono"
          disabled={!isConnected || pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Case title</Label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="e.g. Unpaid invoice for delivered web work"
          disabled={!isConnected || pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="claim">Statement of claim</Label>
        <Textarea
          id="claim"
          required
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          rows={4}
          placeholder="Summarize the facts, the obligation, and the remedy you seek."
          disabled={!isConnected || pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="urls">Evidence URLs</Label>
        <Input
          id="urls"
          required
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder="https://…, https://… (public pages only)"
          disabled={!isConnected || pending}
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated public links. Validators will fetch these during judgment.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="deadline">Response deadline</Label>
        <select
          id="deadline"
          value={deadlineOption}
          onChange={(e) => setDeadlineOption(e.target.value)}
          disabled={!isConnected || pending}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {RESPONSE_DEADLINE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {deadlineOption === "custom" && (
          <div className="flex items-center gap-2">
            <Input
              id="customHours"
              required
              value={customHours}
              onChange={(e) => setCustomHours(e.target.value)}
              inputMode="decimal"
              className="max-w-[8rem]"
              placeholder="Hours"
              disabled={!isConnected || pending}
            />
            <span className="text-sm text-muted-foreground">hours (0–720)</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {(() => {
            const seconds = resolveResponseWindowSeconds();
            if (seconds === null) {
              return "Enter custom hours between 0 and 720 (30 days).";
            }
            return formatDeadlineHint(seconds);
          })()}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stake">Escrow stake (GEN)</Label>
        <Input
          id="stake"
          required
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          inputMode="decimal"
          className="max-w-[10rem]"
          disabled={!isConnected || pending}
        />
      </div>

      <Button type="submit" variant="gradient" className="w-full" disabled={!isConnected || pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting case…
          </>
        ) : (
          <>
            <Scale className="mr-2 h-4 w-4" />
            Lock stake and file
          </>
        )}
      </Button>
    </form>
  );
}
