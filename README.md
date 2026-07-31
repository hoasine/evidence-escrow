# Evidence Escrow

Two-party dispute escrow on [GenLayer](https://genlayer.com). Plaintiff and defendant each lock GEN with evidence URLs; AI validators scrape both sides and pay out the escrow.

## Flow

1. **File** — Plaintiff stakes GEN + claim + evidence URLs  
2. **Defend** — Defendant matches the stake + defense + evidence URLs  
3. **Judge** — Intelligent Contract scrapes URLs, AI returns verdict  
4. **Payout** — Winner gets the full pool (or both refunded on `INSUFFICIENT_EVIDENCE`)

## Stack

- GenLayer Intelligent Contract (`contracts/evidence_escrow.py`)
- Next.js 16 + genlayer-js + MetaMask (Studionet `61999`)

## Quick start

```bash
cd frontend && npm install && npm run dev
```

Deploy:

```bash
genlayer network
genlayer deploy
```

Then set `NEXT_PUBLIC_CONTRACT_ADDRESS` in `frontend/.env`.

## Verdicts

| Verdict | Payout |
|---------|--------|
| `PLAINTIFF_WINS` | Full escrow → plaintiff |
| `DEFENDANT_WINS` | Full escrow → defendant |
| `INSUFFICIENT_EVIDENCE` | Each party refunded |

## Security notes

- Prompt-injection hardened (`BEGIN/END` markers + truncated inputs)
- Defense stake must equal plaintiff stake
- State marked `JUDGED` / `paid_out` before transfers
- Consensus: verdict match + confidence within ±2
