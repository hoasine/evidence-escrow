import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import {
  extractTxErrorMessage,
  isFailureResultName,
  isPendingResultName,
  isSuccessResultName,
} from "./tx-error";

export type DisputeView = {
  id: number;
  plaintiff: string;
  defendant: string;
  title: string;
  claim: string;
  plaintiff_urls: string;
  defense: string;
  defense_urls: string;
  plaintiff_stake: number;
  defendant_stake: number;
  escrow: number;
  verdict: string;
  reasoning: string;
  confidence: number;
  status: string;
  paid_out: boolean;
};

const AI_TX_WAIT = {
  retries: 90,
  interval: 2000,
  status: TransactionStatus.ACCEPTED,
};
const FAST_TX_WAIT = {
  retries: 40,
  interval: 2000,
  status: TransactionStatus.ACCEPTED,
};

function normalizeReadValue(value: unknown): unknown {
  if (value instanceof Map) {
    const obj: Record<string, unknown> = {};
    for (const [key, entry] of value.entries()) {
      obj[String(key)] = normalizeReadValue(entry);
    }
    return obj;
  }
  if (typeof value === "bigint") {
    const n = Number(value);
    return Number.isSafeInteger(n) ? n : value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(normalizeReadValue);
  }
  return value;
}

function normalizeReadResult<T>(raw: unknown): T {
  return normalizeReadValue(raw) as T;
}

export class EvidenceEscrowClient {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(contractAddress: string, account?: string | null, endpoint?: string) {
    this.contractAddress = contractAddress as `0x${string}`;
    const config: Record<string, unknown> = { chain: studionet };
    if (account) config.account = account as `0x${string}`;
    if (endpoint) config.endpoint = endpoint;
    this.client = createClient(config as Parameters<typeof createClient>[0]);
  }

  updateAccount(address: string, endpoint?: string) {
    const config: Record<string, unknown> = {
      chain: studionet,
      account: address as `0x${string}`,
    };
    if (endpoint) config.endpoint = endpoint;
    this.client = createClient(config as Parameters<typeof createClient>[0]);
  }

  private async waitForWrite(
    hash: Awaited<ReturnType<typeof this.client.writeContract>>,
    options: {
      retries: number;
      interval: number;
      status?: TransactionStatus;
      requireFinalized?: boolean;
    } = AI_TX_WAIT
  ) {
    const targetStatus = options.requireFinalized
      ? TransactionStatus.FINALIZED
      : (options.status ?? TransactionStatus.ACCEPTED);

    const receipt = await this.client.waitForTransactionReceipt({
      hash,
      status: targetStatus,
      retries: options.retries,
      interval: options.interval,
      fullTransaction: true,
    } as Parameters<typeof this.client.waitForTransactionReceipt>[0] & {
      fullTransaction?: boolean;
    });

    const statusName = String(
      (receipt as { statusName?: string }).statusName ?? ""
    ).toUpperCase();
    const resultName = (receipt as { resultName?: string }).resultName;

    if (statusName.includes("CANCEL") || statusName.includes("TIMEOUT")) {
      throw new Error(`Transaction ${statusName.toLowerCase().replace(/_/g, " ")}.`);
    }

    if (!isPendingResultName(resultName) && !isSuccessResultName(resultName)) {
      let errMsg = extractTxErrorMessage(receipt);
      if (!errMsg || errMsg.includes("UserWarning")) {
        try {
          const fullTx = await this.client.getTransaction({ hash });
          errMsg = extractTxErrorMessage(fullTx) ?? errMsg;
        } catch {
          // keep prior
        }
      }
      if (errMsg) throw new Error(errMsg);
    }

    if (isFailureResultName(resultName)) {
      const errMsg = extractTxErrorMessage(receipt);
      throw new Error(
        errMsg ?? `Transaction failed (${String(resultName)}). Check GenLayer Studio.`
      );
    }

    return receipt;
  }

  async getDisputeCount(): Promise<number> {
    const raw = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_dispute_count",
      args: [],
    });
    return Number(normalizeReadResult<number>(raw) ?? 0);
  }

  async getAllDisputes(): Promise<DisputeView[]> {
    const raw = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_all_disputes",
      args: [],
    });
    const list = normalizeReadResult<DisputeView[]>(raw);
    return Array.isArray(list) ? list : [];
  }

  async getDispute(id: number): Promise<DisputeView> {
    const raw = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_dispute",
      args: [id],
    });
    return normalizeReadResult<DisputeView>(raw);
  }

  async fileDispute(
    defendant: string,
    title: string,
    claim: string,
    evidenceUrls: string,
    stakeWei: bigint
  ) {
    const before = await this.getDisputeCount();
    const hash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "file_dispute",
      args: [defendant, title, claim, evidenceUrls],
      value: stakeWei,
    });
    await this.waitForWrite(hash, { ...FAST_TX_WAIT, requireFinalized: true });
    for (let i = 0; i < 20; i++) {
      const n = await this.getDisputeCount();
      if (n > before) return n - 1;
      await new Promise((r) => setTimeout(r, 1500));
    }
    return Math.max(0, before);
  }

  async submitDefense(
    disputeId: number,
    defense: string,
    evidenceUrls: string,
    stakeWei: bigint
  ) {
    const hash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "submit_defense",
      args: [disputeId, defense, evidenceUrls],
      value: stakeWei,
    });
    return this.waitForWrite(hash, { ...FAST_TX_WAIT, requireFinalized: true });
  }

  async judgeDispute(disputeId: number) {
    const hash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "judge_dispute",
      args: [disputeId],
      value: 0n,
    });
    return this.waitForWrite(hash, { ...AI_TX_WAIT, requireFinalized: true });
  }
}
