"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { DisputeView } from "@/lib/contracts/EvidenceEscrow";
import {
  useAppealDispute,
  useCancelExpiredDispute,
  useFinalizeDispute,
  useJudgeDispute,
  useResolveAppeal,
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
  if (status === "JUDGED") return "Appeal window active";
  if (status === "APPEALED") return "Appeal pending review";
  if (status === "FINALIZED") return "Settled";
  if (status === "CANCELLED") return "Cancelled";
  return status;
}

function verdictClass(v: string) {
  if (v === "PLAINTIFF_WINS") return "text-green-400";
  if (v === "DEFENDANT_WINS") return "text-blue-400";
  if (v === "INSUFFICIENT_EVIDENCE") return "text-amber-400";
  if (v === "EXPIRED_NO_RESPONSE") return "text-amber-300";
  return "text-muted-foreground";
}

export function DisputeCard({ dispute }: { dispute: DisputeView }) {
  const { address, isConnected } = useWallet();
  const defend = useSubmitDefense();
  const judge = useJudgeDispute();
  const cancelExpired = useCancelExpiredDispute();
  const appeal = useAppealDispute();
  const resolveAppeal = useResolveAppeal();
  const finalize = useFinalizeDispute();
  const [defense, setDefense] = useState("");
  const [urls, setUrls] = useState("");
  const [open, setOpen] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [appealUrls, setAppealUrls] = useState("");

  const me = address?.toLowerCase();
  const isDefendant = me && dispute.defendant.toLowerCase() === me;
  const isClaimant = me && dispute.plaintiff.toLowerCase() === me;
  const canDefend = Boolean(isConnected) && dispute.status === "OPEN" && isDefendant;
  const canJudge = Boolean(isConnected) && dispute.status === "READY";
  const isExpired =
    dispute.status === "OPEN" &&
    typeof dispute.response_deadline_at === "number" &&
    Math.floor(Date.now() / 1000) > dispute.response_deadline_at;
  const canCancelExpired = Boolean(isConnected) && Boolean(isClaimant) && isExpired;
  const nowEpoch = Math.floor(Date.now() / 1000);
  const appealWindowOpen = dispute.status === "JUDGED" && nowEpoch <= dispute.appeal_deadline_at;
  const appealWindowClosed = dispute.status === "JUDGED" && nowEpoch > dispute.appeal_deadline_at;
  const loserIsClaimant = dispute.verdict === "DEFENDANT_WINS";
  const loserIsDefendant = dispute.verdict === "PLAINTIFF_WINS";
  const canAppeal =
    Boolean(isConnected) &&
    appealWindowOpen &&
    ((Boolean(isClaimant) && loserIsClaimant) || (Boolean(isDefendant) && loserIsDefendant));
  const canFinalize = Boolean(isConnected) && appealWindowClosed;
  const canResolveAppeal = Boolean(isConnected) && dispute.status === "APPEALED";

  const onDefend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      toastError("Wallet disconnected", {
        description: "Please connect your wallet again before submitting a response.",
      });
      return;
    }
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
    if (!isConnected) {
      toastError("Wallet disconnected", {
        description: "Please connect your wallet again before executing judgment.",
      });
      return;
    }
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

  const onCancelExpired = async () => {
    if (!isConnected) {
      toastError("Wallet disconnected", {
        description: "Please connect your wallet again before recovering funds.",
      });
      return;
    }
    try {
      await cancelExpired.mutateAsync(dispute.id);
      success("Stake recovered", {
        description: "Response deadline passed. The case was cancelled and funds returned.",
      });
    } catch (err) {
      toastError("Cancellation failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const onAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      toastError("Wallet disconnected", {
        description: "Please connect your wallet again before filing appeal.",
      });
      return;
    }
    try {
      await appeal.mutateAsync({
        disputeId: dispute.id,
        reason: appealReason.trim(),
        evidenceUrls: appealUrls.trim(),
        stakeWei: BigInt(dispute.plaintiff_stake),
      });
      success("Appeal submitted", {
        description: "Appeal stake locked and case moved to appeal review.",
      });
      setAppealOpen(false);
    } catch (err) {
      toastError("Appeal failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const onResolveAppeal = async () => {
    if (!isConnected) {
      toastError("Wallet disconnected", {
        description: "Please connect your wallet again before resolving appeal.",
      });
      return;
    }
    try {
      await resolveAppeal.mutateAsync(dispute.id);
      success("Appeal resolved", {
        description: "Appeal judgment completed and escrow finalized on-chain.",
      });
    } catch (err) {
      toastError("Resolve appeal failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const onFinalize = async () => {
    if (!isConnected) {
      toastError("Wallet disconnected", {
        description: "Please connect your wallet again before finalization.",
      });
      return;
    }
    try {
      await finalize.mutateAsync(dispute.id);
      success("Settlement finalized", {
        description: "Appeal window ended. Escrow payout executed.",
      });
    } catch (err) {
      toastError("Finalization failed", {
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
      {dispute.status === "OPEN" && (
        <p className="text-xs text-muted-foreground">
          Response deadline:{" "}
          {new Date(dispute.response_deadline_at * 1000).toLocaleString()}
        </p>
      )}

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

      {(dispute.status === "JUDGED" ||
        dispute.status === "APPEALED" ||
        dispute.status === "FINALIZED") && (
        <div className="space-y-2 border-t border-white/10 pt-4">
          <p className={`text-sm font-semibold ${verdictClass(dispute.verdict)}`}>
            {dispute.verdict.replaceAll("_", " ")} · confidence {dispute.confidence}/10
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">{dispute.reasoning}</p>
          {dispute.status === "JUDGED" && (
            <p className="text-xs text-muted-foreground">
              Appeal deadline: {new Date(dispute.appeal_deadline_at * 1000).toLocaleString()}
            </p>
          )}
          {dispute.status === "APPEALED" && (
            <p className="text-xs text-amber-300">
              Appeal by {shortAddr(dispute.appeal_by)} · extra stake{" "}
              {formatGen(dispute.appeal_stake)} GEN
            </p>
          )}
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
        {canCancelExpired && (
          <Button
            variant="outline"
            onClick={onCancelExpired}
            disabled={cancelExpired.isPending}
          >
            {cancelExpired.isPending ? "Recovering…" : "Recover expired stake"}
          </Button>
        )}
        {canAppeal && (
          <Button variant="outline" onClick={() => setAppealOpen((v) => !v)}>
            {appealOpen ? "Cancel appeal" : "File appeal"}
          </Button>
        )}
        {canResolveAppeal && (
          <Button
            variant="gradient"
            onClick={onResolveAppeal}
            disabled={resolveAppeal.isPending}
          >
            {resolveAppeal.isPending ? "Resolving appeal..." : "Resolve appeal"}
          </Button>
        )}
        {canFinalize && (
          <Button variant="gradient" onClick={onFinalize} disabled={finalize.isPending}>
            {finalize.isPending ? "Finalizing..." : "Finalize settlement"}
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
      {appealOpen && canAppeal && (
        <form onSubmit={onAppeal} className="space-y-3 border-t border-white/10 pt-4">
          <p className="text-xs text-muted-foreground">
            Appeal stake required: {formatGen(dispute.plaintiff_stake)} GEN
          </p>
          <Textarea
            required
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
            rows={3}
            placeholder="What was missed in the first verdict?"
            disabled={appeal.isPending}
          />
          <Input
            required
            value={appealUrls}
            onChange={(e) => setAppealUrls(e.target.value)}
            placeholder="New appeal evidence URLs (comma-separated)"
            disabled={appeal.isPending}
          />
          <Button type="submit" variant="gradient" disabled={appeal.isPending}>
            {appeal.isPending ? "Submitting appeal..." : "Lock stake and submit appeal"}
          </Button>
        </form>
      )}
    </article>
  );
}
