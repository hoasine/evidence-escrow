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

const DEFAULT_RESPONSE_WINDOW_SECONDS = 72 * 60 * 60;

export function FileDisputeForm({ onDone }: { onDone?: () => void }) {
  const { isConnected, address } = useWallet();
  const file = useFileDispute();
  const [defendant, setDefendant] = useState("");
  const [title, setTitle] = useState("");
  const [claim, setClaim] = useState("");
  const [urls, setUrls] = useState("");
  const [stake, setStake] = useState("0.1");

  const pending = file.isPending;

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
    try {
      const id = await file.mutateAsync({
        defendant: defendant.trim(),
        title: title.trim(),
        claim: claim.trim(),
        evidenceUrls: urls.trim(),
        stakeWei: parseGenToWei(stake),
        responseWindowSeconds: DEFAULT_RESPONSE_WINDOW_SECONDS,
      });
      success("Case filed", {
        description: `Docket #${id} is on-chain. Settlement begins when the respondent matches the stake.`,
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
          Response deadline: 72 hours. If no response arrives, you can recover your stake.
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
