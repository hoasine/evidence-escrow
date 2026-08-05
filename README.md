# Evidence Escrow

<div align="center">

## AI-Settled Bilateral Escrow on GenLayer

| **Evidence Escrow Platform** |
|---|
| **Lock GEN with evidence URLs. Match the stake. Let AI consensus settle the dispute.** |

[![Live App](https://img.shields.io/badge/Live-evidence--escrow.vercel.app-0f172a?style=for-the-badge&logo=vercel)](https://evidence-escrow.vercel.app)
[![Contract](https://img.shields.io/badge/Contract-GenLayer_Python-1f6feb?style=for-the-badge)](#core-contract-api)
[![Frontend](https://img.shields.io/badge/Frontend-Next.js_+_TypeScript-111827?style=for-the-badge)](#project-structure)
[![Network](https://img.shields.io/badge/Network-GenLayer_Studionet-16a34a?style=for-the-badge)](#environment-variables)

</div>

---

## Overview

Evidence Escrow is a bilateral dispute settlement protocol where two parties lock equal GEN against public evidence URLs. GenLayer validators independently fetch both sides, reach consensus on a verdict, and settle the escrow on-chain.

The protocol is designed to remove middlemen from small commercial disputes with a strict matched-stake flow:

1. `file_dispute` locks the claimant’s GEN with a claim, evidence URLs, and a response window
2. `submit_defense` requires the respondent to **match the same stake** before judgment
3. Each case has a **response deadline**, preventing indefinite claimant fund lock
4. `cancel_expired_dispute` lets the claimant recover stake if no response arrives in time
5. `judge_dispute` issues a first verdict and opens a timed appeal window
6. `appeal_dispute` lets the losing side post new evidence with matching stake
7. `resolve_appeal` or `finalize_dispute` executes final settlement on-chain

This means neither party can rush a one-sided judgment, and payouts are driven by on-chain consensus over public web evidence.

## Core Value Proposition

- **Matched escrow:** both parties commit equal GEN before settlement
- **Public evidence only:** validators fetch URLs with `web.render` — no private uploads
- **AI consensus judgment:** Optimistic Democracy over both sides’ records
- **Appeal layer:** loser can challenge within a bounded window using fresh evidence
- **Deterministic finalization:** payout runs after appeal resolution or appeal timeout
- **Automatic payout:** winner receives the pool; insufficient evidence refunds both
- **Timeout recovery path:** claimant can cancel and recover if respondent misses deadline
- **Configurable deadlines:** file form presets (including `0s` for recover demos) plus custom hours
- **Prompt-injection hardened:** user data wrapped in `BEGIN/END` markers and truncated

## Protocol Flow

1. **Claimant files a case** (title, claim, evidence URLs) and locks GEN
2. **Respondent matches stake** and submits defense + evidence URLs
3. **Anyone triggers first judgment** once the case is `READY`
4. **Validators scrape both URL sets** and produce verdict + confidence
5. **Appeal window opens** (`JUDGED`) for the losing side only
6. **Loser may appeal** with matching stake + new evidence (`APPEALED`)
7. **Contract finalizes payout** via `resolve_appeal` or `finalize_dispute`

## Appeal Layer (MVP)

- **Window:** default 24h after first judgment (`default_appeal_window_seconds`)
- **Who can appeal:** only the losing party of `PLAINTIFF_WINS` / `DEFENDANT_WINS`
- **Stake rule:** appeal stake must match the original plaintiff stake
- **Evidence rule:** appeal requires reason text + new evidence URLs
- **Resolution:** AI re-evaluates full record plus appeal evidence
- **Outcome economics:**
  - If verdict is unchanged, appealer loses appeal stake (awarded to winner)
  - If verdict is reversed, appeal succeeds and final payout follows reversed verdict

## Response Deadline Controls

Claimants choose a response window when filing:

| Preset | Use |
|--------|-----|
| Immediate (`0s`) | Demo / test `cancel_expired_dispute` right after filing |
| 1 hour / 24 hours / 72 hours / 7 days | Normal production windows |
| Custom hours (0–720) | Flexible deadlines up to 30 days |

- Contract timestamps use GenVM transaction clock (`datetime.now` / `time.time`), not a hard-coded 2023 fallback
- After the deadline, only the claimant can call `cancel_expired_dispute` and recover stake
- UI shows the on-chain deadline and the **Recover expired stake** action when eligible

## Risk Controls

| Risk | Mitigation in Evidence Escrow |
|------|-------------------------------|
| Self-dispute / griefing own case | Claimant cannot file against their own address |
| One-sided rush to judgment | Defense + matched stake required before `judge_dispute` |
| Low confidence in single-pass AI verdict | Bounded appeal window with stake-backed challenge |
| Claimant funds locked forever by silence | Response deadline + `cancel_expired_dispute` recovery path |
| Unequal capital pressure | Defense stake must equal plaintiff stake exactly |
| Prompt injection via evidence text | `BEGIN/END` markers + truncated inputs/scrapes |
| Unstable AI severity scores | Verdict must match; confidence within ±2 tolerance |
| Double payout / reentrancy-style issues | `paid_out` guard + terminal `FINALIZED` state before/at transfer |
| Opaque settlement | Verdict, reasoning, and escrow amounts stored on-chain |

## Core Contract API

| Function | Type | Description |
|----------|------|-------------|
| `file_dispute` | write (payable) | Opens a case and locks claimant GEN with evidence URLs + `response_window_seconds` |
| `submit_defense` | write (payable) | Respondent matches stake and posts defense evidence |
| `cancel_expired_dispute` | write | After deadline, claimant cancels unresponsive case and recovers stake |
| `judge_dispute` | write | AI scrapes both sides and writes first verdict + appeal deadline |
| `appeal_dispute` | write (payable) | Losing side locks appeal stake and submits new evidence URLs |
| `resolve_appeal` | write | AI re-judges with appeal evidence and finalizes payout |
| `finalize_dispute` | write | Finalizes payout when appeal window expires with no appeal |
| `get_dispute` | view | Returns full case state (claim, stakes, verdict, status) |
| `get_all_disputes` | view | Lists all dockets |
| `get_dispute_count` | view | Total number of cases |
| `get_contract_balance` | view | Native GEN held by the contract |

### Verdicts

| Verdict | Payout |
|---------|--------|
| `PLAINTIFF_WINS` | Full escrow → claimant |
| `DEFENDANT_WINS` | Full escrow → respondent |
| `INSUFFICIENT_EVIDENCE` | Each party refunded their stake |

## Behavioral Tests

`tests/direct/test_evidence_escrow.py` covers:

- Expired no-response recovery (`cancel_expired_dispute`)
- Settlement payout branch: `PLAINTIFF_WINS`
- Settlement payout branch: `DEFENDANT_WINS`
- Settlement refund branch: `INSUFFICIENT_EVIDENCE`
- Appeal branch: loser appeals and verdict can be reversed before finalization

Run:

```bash
python -m pytest tests/direct/test_evidence_escrow.py
```

## Project Structure

```text
contracts/   # GenLayer intelligent contract (Python)
deploy/      # Contract deployment scripts
frontend/    # Next.js application (TypeScript)
tests/       # Contract/integration tests
```

## Environment Variables

Configure in `frontend/.env` (see `frontend/.env.example`):

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_CHAIN_NAME=GenLayer Studionet
NEXT_PUBLIC_GENLAYER_SYMBOL=GEN
```

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Deploy contract first, then update `NEXT_PUBLIC_CONTRACT_ADDRESS`.

## Links

- Live app: [https://evidence-escrow.vercel.app](https://evidence-escrow.vercel.app)
- GitHub: [https://github.com/hoasine/evidence-escrow](https://github.com/hoasine/evidence-escrow)

## Disclaimer

Prototype/demo software. Not financial or legal advice. Private escrow arbitration — not a court of law.
