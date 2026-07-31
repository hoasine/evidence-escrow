"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { DisputeView } from "@/lib/contracts/EvidenceEscrow";
import {
  useJudgeDispute,
  useSubmitDefense,
} from "@/lib/hooks/useEvidenceEscrow";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { formatGen, shortAddr } from "@/lib/utils/format";
import { success, error as toastError } from "@/lib/utils/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

function statusLabel(status: string) {
  if (status === "OPEN") return "Awaiting response";
  if (status === "READY") return "Ready for judgment";
  if (status === "JUDGED") return "Settled";
  return status;
}

function verdictClass(v: string) {
  if (v === "PLAINTIFF_WINS") return "text-green-400";
  if (v === "DEFENDANT_WINS") return "text-blue-400";
  if (v === "INSUFFICIENT_EVIDENCE") return "text-amber-400";
  return "text-muted-foreground";
}

export function DisputeCard({ dispute }: { dispute: DisputeView }) {
  const { address } = useWallet();
  const defend = useSubmitDefense();
  const judge = useJudgeDispute();
  const [defense, setDefense] = useState("");
  const [urls, setUrls] = useState("");
  const [open, setOpen] = useState(false);

  const me = address?.toLowerCase();
  const isDefendant = me && dispute.defendant.toLowerCase() === me;
  const canDefend = dispute.status === "OPEN" && isDefendant;
  const canJudge = dispute.status === "READY";

  const onDefend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await defend.mutateAsync({
        disputeId: dispute.id,
        defense: defense.trim(),
        evidenceUrls: urls.trim(),
        stakeWei: BigInt(dispute.plaintiff_stake),
      });
      success("Response recorded", {
        description: "Stake matched. The case is ready for AI judgment.",
      });
      setOpen(false);
    } catch (err) {
      toastError("Unable to submit response", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const onJudge = async () => {
    try {
      await judge.mutateAsync(dispute.id);
      success("Settlement complete", {
        description: "Verdict finalized and escrow distributed on-chain.",
      });
    } catch (err) {
      toastError("Judgment failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <article className="glass-card space-y-4 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-accent/40 text-accent">
              #{dispute.id}
            </Badge>
            <Badge variant="secondary">{statusLabel(dispute.status)}</Badge>
          </div>
          <h3 className="font-display text-xl font-bold">{dispute.title}</h3>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-bold text-accent">
            {formatGen(dispute.escrow)} GEN
          </p>
          <p className="text-xs text-muted-foreground">escrow balance</p>
        </div>
      </div>

      <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
        <p>
          Claimant{" "}
          <span className="font-mono text-foreground">{shortAddr(dispute.plaintiff)}</span>
        </p>
        <p>
          Respondent{" "}
          <span className="font-mono text-foreground">{shortAddr(dispute.defendant)}</span>
        </p>
      </div>

      <p className="text-sm leading-relaxed">{dispute.claim}</p>
      <p className="truncate text-xs text-muted-foreground" title={dispute.plaintiff_urls}>
        Evidence · {dispute.plaintiff_urls}
      </p>

      <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="text-accent">Filed</span>
        <span className="h-px flex-1 bg-white/10" />
        <span className={dispute.status !== "OPEN" ? "text-accent" : ""}>Response</span>
        <span className="h-px flex-1 bg-white/10" />
        <span className={dispute.status === "JUDGED" ? "text-accent" : ""}>Settled</span>
      </div>

      {dispute.status !== "OPEN" && dispute.defense && (
        <div className="space-y-1 border-t border-white/10 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Response
          </p>
          <p className="text-sm leading-relaxed">{dispute.defense}</p>
          <p className="truncate text-xs text-muted-foreground">{dispute.defense_urls}</p>
        </div>
      )}

      {dispute.status === "JUDGED" && (
        <div className="space-y-2 border-t border-white/10 pt-4">
          <p className={`text-sm font-semibold ${verdictClass(dispute.verdict)}`}>
            {dispute.verdict.replaceAll("_", " ")} · confidence {dispute.confidence}/10
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">{dispute.reasoning}</p>
          {dispute.paid_out && (
            <p className="text-xs font-medium text-green-400">Escrow paid out on-chain</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {canDefend && (
          <Button variant="outline" onClick={() => setOpen((v) => !v)}>
            {open ? "Cancel" : "Submit response"}
          </Button>
        )}
        {canJudge && (
          <Button variant="gradient" onClick={onJudge} disabled={judge.isPending}>
            {judge.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running judgment…
              </>
            ) : (
              "Execute judgment"
            )}
          </Button>
        )}
      </div>

      {open && canDefend && (
        <form onSubmit={onDefend} className="space-y-3 border-t border-white/10 pt-4">
          <p className="text-xs text-muted-foreground">
            Required matching stake: {formatGen(dispute.plaintiff_stake)} GEN
          </p>
          <Textarea
            required
            value={defense}
            onChange={(e) => setDefense(e.target.value)}
            rows={3}
            placeholder="State your defense and supporting facts…"
            disabled={defend.isPending}
          />
          <Input
            required
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="Defense evidence URLs (comma-separated)"
            disabled={defend.isPending}
          />
          <Button type="submit" variant="gradient" disabled={defend.isPending}>
            {defend.isPending ? "Submitting…" : "Match stake and respond"}
          </Button>
        </form>
      )}
    </article>
  );
}
