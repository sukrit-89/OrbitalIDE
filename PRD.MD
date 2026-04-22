# StreamFlow — Product Requirements Document

**Version:** 1.0  
**Author:** Sukrit  
**Program:** Stellar Rise In — Belt System (Levels 3 & 4)  
**Status:** Pre-Development  
**Last Updated:** April 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [Market Context](#4-market-context)
5. [User Personas](#5-user-personas)
6. [Product Goals & Success Metrics](#6-product-goals--success-metrics)
7. [Scope by Belt Level](#7-scope-by-belt-level)
8. [Functional Requirements — Level 3](#8-functional-requirements--level-3-green-belt)
9. [Functional Requirements — Level 4](#9-functional-requirements--level-4-black-belt)
10. [Smart Contract Architecture](#10-smart-contract-architecture)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Data Model](#12-data-model)
13. [Contract Interface Specification](#13-contract-interface-specification)
14. [Test Requirements](#14-test-requirements)
15. [CI/CD Pipeline](#15-cicd-pipeline)
16. [Non-Functional Requirements](#16-non-functional-requirements)
17. [Tech Stack](#17-tech-stack)
18. [Milestones & Timeline](#18-milestones--timeline)
19. [Risk Register](#19-risk-register)
20. [Open Questions](#20-open-questions)

---

## 1. Executive Summary

**StreamFlow** is a real-time payment streaming protocol built on Stellar's Soroban smart contract platform. It enables continuous per-second fund transfers between two parties — so a freelancer is paid the moment they work, not 30 days later.

The differentiating innovation is the **Blend yield composability layer**: while a stream is live, idle deposited funds are automatically deployed into a Blend lending pool to earn interest. The recipient receives principal plus accrued yield. This makes StreamFlow the first protocol on Soroban that turns a payment in transit into a productive asset.

StreamFlow is built across two belt levels:

- **Level 3 (Green Belt):** Core `StreamVault` contract — create, withdraw from, and cancel a real-time stream. Full mini-dApp with a live-ticking UI, 3 passing tests, documentation, and a demo video.
- **Level 4 (Black Belt):** Production-grade extension — `StreamFactory` contract for per-pair stream isolation (inter-contract call), Blend yield integration (second inter-contract call), a transferable `FLOW` receipt token (custom SEP-41 token), advanced event streaming, CI/CD pipeline, and full mobile responsiveness.

---

## 2. Problem Statement

### 2.1 The Timing Gap in Payments

The global payments system is built on batches and delays. Employers run payroll weekly or monthly. Freelancers wait 30–90 days for invoices. Contractors stop working when payments are late. This timing gap represents a structural inefficiency that costs workers and businesses billions in lost productivity, factoring fees, and cash flow friction.

### 2.2 Idle Money in Transit

When funds are sent in a traditional lump-sum transfer, the capital sits idle between the sender's action and the recipient's use of it. In a streaming model, the same problem exists: funds deposited to back a stream are locked and earning nothing while the stream is active. No protocol on Stellar addresses this.

### 2.3 No Streaming on Soroban

Superfluid (Ethereum) and Zebec (Solana) have demonstrated real demand for streaming payment protocols. Both have active user bases and multiple downstream integrations. Soroban — despite Stellar's core identity as a payments network — has nothing equivalent. This is the gap StreamFlow fills.

---

## 3. Solution Overview

StreamFlow allows a sender (payer) to create a stream specifying:
- The recipient address
- The token (USDC, XLM, PYUSD, or any SEP-41 token)
- The flow rate (tokens per second)
- The stream duration

Once created, the recipient can call `withdraw()` at any time to claim the portion of funds that has accrued since stream creation (or last withdrawal). The sender can cancel the stream at any time; remaining unstreamed funds are returned.

The key mechanism is the **real-time balance formula**:

```
claimable = (current_ledger_timestamp - start_timestamp) * rate_per_second
           - already_withdrawn
```

This computation is done on-chain in a view function with zero gas overhead. The frontend polls this every few seconds and displays a live-incrementing balance — the primary "wow" moment of the demo.

### 3.1 Yield Layer (Level 4)

In Level 4, the `StreamVault` does not hold idle funds passively. Upon stream creation, deposited funds are forwarded to a Blend lending pool contract via an inter-contract call. When the recipient withdraws, the Vault redeems from Blend first (principal + earned interest), then transfers to the recipient. The sender's stream deposit effectively becomes a Blend deposit with a streaming payment obligation on top.

---

## 4. Market Context

### 4.1 Competitive Positioning

| Protocol | Chain | Type | Key Limitation |
|---|---|---|---|
| Superfluid | Ethereum/Polygon | Streaming | High gas, not payment-focused |
| Zebec | Solana | Streaming | Not composable with lending |
| Blend | Stellar/Soroban | Lending primitive | No streaming capability |
| Slender | Stellar/Soroban | Lending | No streaming capability |
| StreamFlow | Stellar/Soroban | Streaming + Yield | **This product** |

StreamFlow does not compete with Blend. It composes with Blend — making Blend a dependency that strengthens both products. This is the explicit strategy SDF has communicated for the Soroban ecosystem: build composable layers, not competing silos.

### 4.2 Ecosystem Tailwinds

- Stellar's stablecoin market cap grew 53% YoY to $243M (USDC + PYUSD), providing the liquid assets that make streaming practical.
- Protocol 25 (January 2026) added ZK primitives, and Protocol 26 "Yardstick" (testnet April 2026) adds benchmarking — indicating Soroban is maturing fast for production apps.
- Stellar TVL grew 193% in 2025 alone, with composability cited as the primary driver.
- Huma Finance's PayFi Ecosystem Map includes Stellar as a key chain for real-world payment flows — streaming is the logical on-chain primitive for PayFi.

### 4.3 Why Now

The combination of PYUSD on Stellar, growing institutional stablecoin adoption, and Blend as a live audited lending primitive creates the exact conditions for a streaming + yield protocol to have real assets to work with on day one.

---

## 5. User Personas

### Persona 1 — The Freelancer (Recipient)
**Name:** Priya, 26, UX designer, Bangalore  
**Problem:** Clients pay 30–90 days after project completion. She needs working capital, often takes personal loans at high interest.  
**How StreamFlow helps:** Client creates a stream; Priya sees her balance tick up in real time as she works. She withdraws whenever she needs cash. No invoice delays, no factoring fees.

### Persona 2 — The Employer / Payer (Sender)
**Name:** Marcus, 34, startup founder, Lagos  
**Problem:** Running payroll in USDC for a remote team across 5 countries. Monthly batch payments are inefficient and create FX risk.  
**How StreamFlow helps:** Marcus deposits 3 months of salary into a stream per employee. Funds earn Blend yield while streaming, offsetting payroll cost. Employees are paid continuously and can withdraw daily.

### Persona 3 — The DeFi Developer (Integrator)
**Name:** Kai, 22, Soroban developer  
**Problem:** Building a subscription-based dApp and needs per-second billing without writing streaming infrastructure from scratch.  
**How StreamFlow helps:** Kai integrates StreamFlow's `StreamFactory` contract — his dApp calls `create_stream()` and gets streaming payments out of the box. The FLOW receipt token is composable with other Soroban DeFi.

---

## 6. Product Goals & Success Metrics

### 6.1 Belt-Level Goals

| Goal | Level 3 | Level 4 |
|---|---|---|
| Functional completeness | Core stream lifecycle working | Full production architecture |
| Test coverage | 3 passing tests | 8+ passing tests |
| Documentation | README with all required sections | Same + CI/CD badge, contract addresses |
| Demo | 1-minute video | Mobile-responsive screenshots |
| Commits | 3+ meaningful commits | 8+ meaningful commits |

### 6.2 Technical Quality Goals

- Contract functions execute in under 500ms on testnet
- Frontend reflects stream balance within 5 seconds of real ledger time
- Zero failed transactions in demo video
- All test output screenshots clearly show pass/fail status

### 6.3 Strategic Goals (Post-Belt)

- Position StreamFlow as a candidate for Stellar Community Fund (SCF) award (up to $150K XLM)
- Demonstrate composability with Blend to attract ecosystem integrations
- Establish Orbital IDE as the development tool used to build and deploy StreamFlow (unified belt narrative)

---

## 7. Scope by Belt Level

### 7.1 Level 3 — In Scope

- `StreamVault` single Soroban contract (Rust)
- 4 contract functions: `create_stream`, `withdraw`, `cancel`, `get_claimable`
- React frontend: stream creation form, active stream dashboard, live ticking balance
- Loading states on all async contract calls
- localStorage caching for stream metadata
- Vitest test suite: 3 passing tests
- Full README (live link, test screenshot, demo video link)
- Testnet deployment with public contract address
- 1-minute demo video
- Vercel deployment

### 7.2 Level 3 — Out of Scope

- Multiple streams per wallet (single stream per pair for MVP)
- Yield integration (Level 4)
- Custom token (Level 4)
- Mobile optimization (Level 4)
- CI/CD pipeline (Level 4)

### 7.3 Level 4 — Additional In Scope

- `StreamFactory` contract — manages stream registry, calls `StreamVault` (inter-contract call #1)
- `StreamVault` → Blend pool integration (inter-contract call #2)
- `FLOW` SEP-41 token contract — transferable receipt token
- Multiple concurrent streams per wallet
- Advanced event streaming with cursor persistence
- GitHub Actions CI/CD pipeline
- Mobile-responsive design (Tailwind breakpoints)
- Updated README with all Level 4 checklist items

### 7.4 Level 4 — Out of Scope

- Mainnet deployment (testnet is sufficient for belt)
- Stream NFT marketplace
- Governance token or DAO
- Cross-chain bridge

---

## 8. Functional Requirements — Level 3 (Green Belt)

### 8.1 Smart Contract — `StreamVault`

#### FR-L3-01: Create Stream
- The contract MUST accept a `create_stream` invocation with parameters: `sender: Address`, `recipient: Address`, `token: Address`, `rate_per_second: i128`, `duration_seconds: u64`
- The contract MUST lock the total deposit (`rate_per_second * duration_seconds`) from the sender's balance
- The contract MUST store stream metadata in contract storage keyed by a unique `stream_id` (u64, auto-incremented)
- The contract MUST record `start_ledger_time` using `env.ledger().timestamp()`
- The contract MUST emit a `StreamCreated` event with: `stream_id`, `sender`, `recipient`, `rate`, `total_amount`
- The contract MUST reject if `rate_per_second <= 0` or `duration_seconds == 0`
- The contract MUST reject if sender has insufficient token balance

#### FR-L3-02: Withdraw Accrued Funds
- The contract MUST accept a `withdraw` invocation with `stream_id: u64` called by the recipient
- The contract MUST compute `claimable = (current_timestamp - start_timestamp) * rate_per_second - already_withdrawn`
- The contract MUST cap claimable at `total_deposit - already_withdrawn` (stream cannot over-pay)
- The contract MUST transfer claimable tokens to the recipient
- The contract MUST update `already_withdrawn` in storage
- The contract MUST emit a `Withdrawal` event with: `stream_id`, `recipient`, `amount`, `timestamp`
- The contract MUST reject if caller is not the recipient
- The contract MUST reject if `claimable == 0`

#### FR-L3-03: Cancel Stream
- The contract MUST accept a `cancel` invocation with `stream_id: u64` called by the sender
- The contract MUST compute: `recipient_owed = claimable at time of cancel`, `sender_refund = total_deposit - already_withdrawn - recipient_owed`
- The contract MUST transfer `recipient_owed` to recipient and `sender_refund` to sender in the same transaction
- The contract MUST mark the stream as `Cancelled` in storage
- The contract MUST emit a `StreamCancelled` event with: `stream_id`, `recipient_owed`, `sender_refund`
- The contract MUST reject if caller is not the sender
- The contract MUST reject if stream is already cancelled or fully completed

#### FR-L3-04: Get Claimable (View)
- The contract MUST expose a `get_claimable(stream_id: u64) -> i128` read function
- This function MUST return the current claimable amount without modifying state
- This function MUST be callable by anyone (no auth required)
- This function MUST return 0 if stream is cancelled or fully withdrawn

#### FR-L3-05: Get Stream Info (View)
- The contract MUST expose a `get_stream(stream_id: u64) -> StreamData` function returning all stream metadata
- `StreamData` MUST include: `sender`, `recipient`, `token`, `rate_per_second`, `total_deposit`, `already_withdrawn`, `start_timestamp`, `end_timestamp`, `status` (Active/Cancelled/Completed)

### 8.2 Frontend — Stream Creation

#### FR-L3-06: Wallet Connection
- The app MUST support Freighter wallet connection using StellarWalletsKit (reuse from Orbital IDE)
- The app MUST display connected wallet address (truncated) in the header
- The app MUST show a Connect Wallet prompt if no wallet is connected

#### FR-L3-07: Create Stream Form
- The UI MUST render a form with fields: Recipient Address, Token (dropdown: USDC, XLM), Flow Rate (tokens/day, converted to per-second internally), Duration (days)
- The UI MUST show a live preview: "Total deposit: X USDC — Recipient gets Y USDC/day"
- On submit, the UI MUST show a 3-step progress indicator: "Signing → Submitting → Confirmed"
- On success, the UI MUST navigate to the Stream Dashboard for the new stream
- On failure, the UI MUST show an error toast with the failure reason

#### FR-L3-08: Stream Dashboard
- The UI MUST display a card for the active stream showing: Sender, Recipient, Token, Flow Rate, Total Deposit, Claimable Now (live-ticking), Already Withdrawn, Stream End Time
- The "Claimable Now" amount MUST update every 5 seconds by calling `get_claimable` on-chain OR by incrementing locally using the known rate (local interpolation preferred for smoothness, with on-chain sync every 30 seconds)
- The balance increment animation MUST be visually clear — a number that visibly counts up
- Stream metadata MUST be cached in localStorage so the dashboard loads instantly on re-visit without waiting for an RPC call

#### FR-L3-09: Withdraw Action
- The recipient view MUST show a "Withdraw" button when `claimable > 0`
- On click, the UI MUST show the exact claimable amount and ask for confirmation
- After confirmation, the UI MUST show a loading spinner and submit the `withdraw` transaction
- On success, the UI MUST show the withdrawn amount in a success toast and reset the claimable display

#### FR-L3-10: Cancel Action
- The sender view MUST show a "Cancel Stream" button
- On click, the UI MUST show a warning: "Recipient will receive X tokens for work done. You will receive Y tokens back."
- After confirmation, the UI MUST submit the `cancel` transaction
- On success, the UI MUST mark the stream as cancelled and disable further actions

#### FR-L3-11: Loading States
- Every contract interaction MUST show a loading state (spinner or skeleton) while the transaction is pending
- The stream dashboard MUST show a skeleton loader on first load before data resolves
- Balance updates MUST not cause layout shift

### 8.3 Documentation — Level 3

#### FR-L3-12: README
The README MUST contain:
- Project title and one-sentence description
- Live demo link (Vercel)
- Architecture overview (contract functions + frontend interaction diagram)
- Complete contract function table (name, params, description, auth)
- Local development setup instructions
- Screenshot of test output showing 3+ passing tests
- Demo video link (1 minute, Loom or YouTube)
- Testnet contract address
- Tech stack table

---

## 9. Functional Requirements — Level 4 (Black Belt)

### 9.1 `StreamFactory` Contract (Inter-Contract Call #1)

#### FR-L4-01: Factory Pattern
- A new `StreamFactory` contract MUST be deployed separately from any individual vault
- `StreamFactory` MUST expose `create_stream(...)` — same parameters as the Level 3 vault
- `StreamFactory` MUST deploy or invoke a per-stream `StreamVault` instance via cross-contract call
- `StreamFactory` MUST maintain a registry: `sender_address → Vec<stream_id>` and `recipient_address → Vec<stream_id>`
- `StreamFactory` MUST expose `get_streams_by_sender(sender: Address) -> Vec<u64>` and `get_streams_by_recipient(recipient: Address) -> Vec<u64>`

#### FR-L4-02: Multiple Concurrent Streams
- A single wallet MUST be able to have multiple active streams simultaneously (to different recipients, or of different tokens)
- The factory registry MUST correctly enumerate all streams for a wallet
- The UI MUST render a list of all active streams for the connected wallet

### 9.2 Blend Integration (Inter-Contract Call #2)

#### FR-L4-03: Auto-Yield on Deposit
- When a stream is created, the `StreamVault` MUST call Blend's pool contract to deposit the full stream principal
- The Blend pool contract address MUST be stored as a configurable parameter in the `StreamVault` (set at initialization)
- The vault MUST track the bToken (Blend receipt token) balance representing its deposited position

#### FR-L4-04: Yield-Inclusive Withdrawal
- When `withdraw` is called, the vault MUST first call Blend's pool contract to redeem the claimable portion
- The redeemed amount (principal + accrued interest) MUST be transferred to the recipient
- Any yield earned above the stream principal MUST be split: 90% to recipient, 10% held in the vault as a fee reserve (configurable)

#### FR-L4-05: Yield-Inclusive Cancellation
- On `cancel`, the vault MUST redeem ALL remaining Blend principal + yield
- Yield attribution: recipient gets yield on their earned portion, sender gets yield on their refunded portion
- Both transfers MUST occur atomically in one transaction

### 9.3 `FLOW` Token — Custom SEP-41 Token

#### FR-L4-06: Token Issuance
- A `FLOW` SEP-41 token contract MUST be deployed separately
- When a stream is created, the `StreamVault` MUST mint `FLOW` tokens equal to the total stream deposit and send them to the recipient
- `FLOW` tokens represent the recipient's claim on the stream — they are transferable

#### FR-L4-07: Token Redemption
- When the recipient calls `withdraw`, the corresponding `FLOW` tokens MUST be burned
- When a stream is cancelled, all remaining `FLOW` tokens in the recipient's wallet for that stream MUST be burned
- The `StreamVault` MUST validate FLOW token balance before allowing withdrawal (prevents double-claim)

#### FR-L4-08: Token Metadata
- `FLOW` token MUST implement full SEP-41 interface: `name()`, `symbol()`, `decimals()`, `balance()`, `transfer()`, `mint()`, `burn()`
- Symbol: `FLOW`, Decimals: 7 (consistent with USDC on Stellar)

### 9.4 Advanced Event Streaming (Frontend)

#### FR-L4-09: Real-Time Event Feed
- The frontend MUST subscribe to Soroban contract events using cursor-based polling (reuse pattern from Orbital IDE)
- Events to stream in real-time: `StreamCreated`, `Withdrawal`, `StreamCancelled`
- The UI MUST display a live "Activity Feed" panel showing the last 20 events with timestamp, event type, and amount
- Cursor position MUST be persisted in localStorage so polling resumes from the correct ledger after page reload

#### FR-L4-10: Live Position Updates
- Active stream balances MUST be updated via event-driven recalculation when a `Withdrawal` event is detected
- No full page refresh should be required to see another user's withdrawal reflected in the stream state

### 9.5 CI/CD Pipeline

#### FR-L4-11: GitHub Actions Workflow
The repository MUST include a `.github/workflows/ci.yml` that runs on every push to `main` and on every pull request:

```yaml
Jobs:
  1. contract-test   — cargo test (runs all Soroban unit tests)
  2. frontend-test   — vitest run (runs all frontend tests)
  3. deploy          — vercel deploy --prod (only on push to main, after tests pass)
```

- The pipeline MUST fail and block merge if any test fails
- The README MUST include a CI status badge from GitHub Actions

### 9.6 Mobile Responsive Design

#### FR-L4-12: Responsive Breakpoints
- The app MUST be fully functional at 375px width (iPhone SE) and 768px width (iPad)
- Stream dashboard MUST collapse to a single-column card layout on mobile
- The activity feed MUST be collapsible on mobile (hidden by default, toggle button to reveal)
- All buttons MUST have minimum tap target of 44x44px
- Input forms MUST use native mobile keyboard types (`type="number"` for amounts, `inputMode="decimal"`)

---

## 10. Smart Contract Architecture

### 10.1 Level 3 — Single Contract

```
┌─────────────────────────────────┐
│         StreamVault             │
│                                 │
│  Storage:                       │
│  ├── next_stream_id: u64        │
│  ├── streams: Map<u64, Stream>  │
│  └── token_client: Address      │
│                                 │
│  Functions:                     │
│  ├── create_stream(...)         │
│  ├── withdraw(stream_id)        │
│  ├── cancel(stream_id)          │
│  ├── get_claimable(stream_id)   │
│  └── get_stream(stream_id)      │
└─────────────────────────────────┘
```

### 10.2 Level 4 — Three-Contract System

```
User Wallet
    │
    ▼
┌──────────────────┐   create_stream()   ┌─────────────────────┐
│  StreamFactory   │ ──────────────────► │    StreamVault       │
│                  │                     │  (per-stream logic)  │
│  - stream registry│                    │                      │
│  - wallet index  │                     │  On deposit:         │
└──────────────────┘                     │  ┌───────────────┐   │
                                         │  │  Blend Pool   │   │
                                         │  │  Contract     │◄──┤
                                         │  └───────────────┘   │
                                         │                      │
                                         │  On mint:            │
                                         │  ┌───────────────┐   │
                                         │  │  FLOW Token   │   │
                                         │  │  Contract     │◄──┤
                                         │  └───────────────┘   │
                                         └─────────────────────┘
```

### 10.3 Inter-Contract Call Sequence (Level 4 Create Stream)

```
1. User → StreamFactory.create_stream(recipient, token, rate, duration)
2. StreamFactory → StreamVault.initialize(params)          [Inter-contract call #1]
3. StreamVault → token_client.transfer(vault, amount)      [Transfer from user to vault]
4. StreamVault → BlendPool.deposit(token, amount)          [Inter-contract call #2]
5. StreamVault → FlowToken.mint(recipient, amount)         [Inter-contract call #3]
6. StreamFactory: records stream_id in registry
7. StreamVault: emits StreamCreated event
```

---

## 11. Frontend Architecture

### 11.1 Component Tree

```
App
├── Layout
│   ├── Header (wallet connect, nav)
│   └── Footer
├── Pages
│   ├── HomePage — hero, CTA, "How it works" explainer
│   ├── CreateStreamPage — stream creation form
│   ├── DashboardPage — list of all streams for connected wallet
│   │   ├── StreamList (sender view + recipient view tabs)
│   │   └── ActivityFeed (live event stream)
│   └── StreamDetailPage — single stream view
│       ├── StreamCard (live ticking balance)
│       ├── WithdrawButton (recipient only)
│       ├── CancelButton (sender only)
│       └── StreamHistory (past withdrawals)
└── Components
    ├── WalletConnectButton
    ├── TickingBalance (animated number)
    ├── TransactionModal (3-step progress indicator)
    ├── SkeletonLoader
    └── Toast (success / error notifications)
```

### 11.2 State Management

- Local React state (`useState`) for UI state (form values, modal open/close, loading flags)
- `useEffect` + `setInterval` for the balance polling loop (5-second interval)
- localStorage for: stream metadata cache, last seen event cursor, wallet address
- No global state library needed at this scale (keep it simple)

### 11.3 Stellar / Soroban Integration

```typescript
// Contract interaction pattern
const callContract = async (method: string, params: xdr.ScVal[]) => {
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
    .addOperation(
      contract.call(method, ...params)
    )
    .setTimeout(30)
    .build();
  
  const signed = await kit.sign({ tx: tx.toXDR() });
  const result = await server.sendTransaction(signed);
  return pollForResult(result.hash);
};
```

### 11.4 Balance Tick Interpolation

To avoid expensive on-chain calls every second, the balance animates locally using the known rate and syncs with chain every 30 seconds:

```typescript
// Local interpolation — runs every 100ms for smooth animation
const tick = () => {
  const elapsed = (Date.now() / 1000) - stream.startTimestamp;
  const local = elapsed * stream.ratePerSecond - stream.alreadyWithdrawn;
  setDisplayBalance(Math.min(local, stream.totalDeposit - stream.alreadyWithdrawn));
};

// On-chain sync — runs every 30 seconds
const syncFromChain = async () => {
  const onchain = await contract.get_claimable(streamId);
  setAlreadyWithdrawn(prev => prev); // reconcile if drift detected
};
```

### 11.5 Design System

Following the Orbital IDE design language (Vercel/Linear/Raycast aesthetic):

| Token | Value |
|---|---|
| Background | `#0a0a0a` (near-void black) |
| Surface | `#111111` |
| Border | `#1f1f1f` |
| Text Primary | `#f5f5f5` |
| Text Secondary | `#737373` |
| Accent | `#22c55e` (green — money, payments) |
| Error | `#ef4444` |
| Font | Inter, system-ui |

**No gradients. No glow effects. No neon. No blur.**

The live ticking balance is displayed in a large monospace font (`font-mono text-4xl`) with the accent green color. This is the visual hero of the product.

---

## 12. Data Model

### 12.1 On-Chain Stream Struct (Rust)

```rust
#[contracttype]
pub struct Stream {
    pub sender: Address,
    pub recipient: Address,
    pub token: Address,
    pub rate_per_second: i128,       // smallest token unit per second
    pub total_deposit: i128,
    pub already_withdrawn: i128,
    pub start_timestamp: u64,        // Unix timestamp at stream creation
    pub end_timestamp: u64,          // start + duration
    pub status: StreamStatus,
    pub blend_position: i128,        // Level 4: bToken amount in Blend (0 in L3)
}

#[contracttype]
pub enum StreamStatus {
    Active,
    Cancelled,
    Completed,
}
```

### 12.2 localStorage Cache Schema (Frontend)

```typescript
interface CachedStream {
  streamId: string;
  sender: string;
  recipient: string;
  token: 'USDC' | 'XLM';
  ratePerSecond: number;
  totalDeposit: number;
  alreadyWithdrawn: number;
  startTimestamp: number;
  endTimestamp: number;
  status: 'Active' | 'Cancelled' | 'Completed';
  lastSyncedAt: number; // Unix timestamp of last on-chain sync
}

// Key: `stream:${streamId}`
// Event cursor key: `streamflow:event_cursor`
```

---

## 13. Contract Interface Specification

### 13.1 `StreamVault` — Full Interface

| Function | Auth | Params | Returns | Mutates State |
|---|---|---|---|---|
| `create_stream` | sender must sign | `recipient: Address, token: Address, rate_per_second: i128, duration_seconds: u64` | `stream_id: u64` | Yes |
| `withdraw` | recipient must sign | `stream_id: u64` | `amount: i128` | Yes |
| `cancel` | sender must sign | `stream_id: u64` | `(recipient_owed: i128, sender_refund: i128)` | Yes |
| `get_claimable` | None | `stream_id: u64` | `i128` | No |
| `get_stream` | None | `stream_id: u64` | `Stream` | No |
| `get_stream_count` | None | — | `u64` | No |

### 13.2 `StreamFactory` — Level 4 Interface

| Function | Auth | Params | Returns |
|---|---|---|---|
| `create_stream` | sender must sign | All StreamVault params + `vault_wasm_hash: BytesN<32>` | `stream_id: u64` |
| `get_streams_by_sender` | None | `sender: Address` | `Vec<u64>` |
| `get_streams_by_recipient` | None | `recipient: Address` | `Vec<u64>` |

### 13.3 `FLOW` Token — SEP-41 Interface

| Function | Auth | Params | Returns |
|---|---|---|---|
| `mint` | StreamVault contract only | `to: Address, amount: i128` | — |
| `burn` | StreamVault contract only | `from: Address, amount: i128` | — |
| `transfer` | token holder | `from: Address, to: Address, amount: i128` | — |
| `balance` | None | `id: Address` | `i128` |
| `name` | None | — | `String` ("StreamFlow") |
| `symbol` | None | — | `String` ("FLOW") |
| `decimals` | None | — | `u32` (7) |

### 13.4 Events Schema

```rust
// StreamCreated
symbol: "StreamCreated"
data: (stream_id: u64, sender: Address, recipient: Address, token: Address, rate: i128, total: i128)

// Withdrawal
symbol: "Withdrawal"
data: (stream_id: u64, recipient: Address, amount: i128, yield_earned: i128, timestamp: u64)

// StreamCancelled
symbol: "StreamCancelled"  
data: (stream_id: u64, recipient_owed: i128, sender_refund: i128, timestamp: u64)
```

---

## 14. Test Requirements

### 14.1 Level 3 — Minimum 3 Tests (Vitest + Soroban Test SDK)

| Test ID | Name | Description | Expected Result |
|---|---|---|---|
| T-01 | `test_create_stream_stores_correctly` | Create a stream and verify all stored fields match input params | `get_stream(0).rate_per_second == input_rate` ✅ |
| T-02 | `test_withdraw_calculates_correctly` | Advance ledger time by N seconds, call withdraw, verify amount = N * rate | Transfer amount == N * rate ✅ |
| T-03 | `test_cancel_returns_correct_split` | Create stream, advance time by 50%, cancel, verify recipient gets 50% and sender gets 50% | Both transfers correct ✅ |

### 14.2 Level 4 — Minimum 8 Tests (additional 5)

| Test ID | Name | Description |
|---|---|---|
| T-04 | `test_create_fails_insufficient_balance` | Create stream with more than sender's balance — must revert |
| T-05 | `test_withdraw_only_by_recipient` | Sender calling withdraw must revert with auth error |
| T-06 | `test_cancel_only_by_sender` | Recipient calling cancel must revert with auth error |
| T-07 | `test_multiple_withdrawals_accumulate` | Two withdrawals at t=50% and t=100% sum to total deposit |
| T-08 | `test_flow_token_minted_on_create` | After stream creation, recipient's FLOW balance equals total_deposit |
| T-09 | `test_flow_token_burned_on_withdraw` | After withdraw, FLOW balance reduces proportionally |
| T-10 | `test_factory_registry_correct` | After 3 streams created, `get_streams_by_sender` returns all 3 stream IDs |

### 14.3 Test Output Requirement

The test run output displayed in the README screenshot MUST clearly show:
- Number of tests run
- Number passing
- Duration
- All test names visible

Use `vitest run --reporter=verbose` to produce this output.

---

## 15. CI/CD Pipeline

### 15.1 Pipeline File: `.github/workflows/ci.yml`

```yaml
name: StreamFlow CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  contract-tests:
    name: Soroban Contract Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: wasm32-unknown-unknown
      - name: Run contract tests
        working-directory: ./contracts
        run: cargo test

  frontend-tests:
    name: Frontend Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test

  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    needs: [contract-tests, frontend-tests]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 15.2 Required GitHub Secrets

- `VERCEL_TOKEN` — personal access token from vercel.com
- `VERCEL_ORG_ID` — from `.vercel/project.json` after first deploy
- `VERCEL_PROJECT_ID` — from `.vercel/project.json` after first deploy

---

## 16. Non-Functional Requirements

### 16.1 Performance
- Initial page load (Vercel CDN): under 2 seconds on 4G
- Contract call round-trip (testnet): tolerate up to 10 seconds; show loading state for anything over 500ms
- Balance update frequency: every 5 seconds on-chain poll, every 100ms local interpolation

### 16.2 Security
- Never store private keys or mnemonics in any frontend state or localStorage
- All contract auth uses Soroban's built-in `require_auth()` — no custom auth logic
- Input validation on frontend before submitting any transaction (check address format, positive amounts, non-zero duration)
- Testnet only for belt submission — no real funds at risk

### 16.3 Reliability
- Frontend MUST gracefully handle RPC failures with retry logic (max 3 retries, exponential backoff)
- localStorage cache prevents data loss on page refresh
- If event polling fails, the UI MUST show a "reconnecting..." indicator rather than silently breaking

### 16.4 Accessibility
- All interactive elements MUST be keyboard-navigable
- Color is NOT the only indicator of status (use text labels alongside color)
- Form inputs MUST have visible labels (not just placeholders)

---

## 17. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Smart Contracts | Rust + Soroban SDK | Required for Soroban |
| Contract Testing | Soroban Test SDK (`soroban_sdk::testutils`) | Native Soroban test environment |
| Frontend Framework | React + Vite | Reuse Orbital IDE setup |
| Styling | Tailwind CSS | Rapid responsive layout |
| Wallet Integration | StellarWalletsKit (Freighter + Albedo) | Reuse from Orbital IDE |
| Stellar SDK | `@stellar/stellar-sdk` | Standard JS SDK |
| Frontend Testing | Vitest | Already in Orbital IDE setup |
| Deployment (Frontend) | Vercel | Belt requirement, free tier |
| Deployment (Contract) | Soroban Testnet | Belt requirement |
| CI/CD | GitHub Actions | Belt requirement |
| Version Control | Git / GitHub | Belt requirement |
| Video Demo | Loom | Fast 1-minute capture |

---

## 18. Milestones & Timeline

### Level 3 Milestones

| # | Milestone | Deliverable | Est. Time |
|---|---|---|---|
| M1 | Contract scaffold | `StreamVault` compiles, storage defined | 1 day |
| M2 | Core functions complete | create, withdraw, cancel, get_claimable all working | 2 days |
| M3 | Tests passing | 3 tests green in CI | 1 day |
| M4 | Frontend skeleton | Wallet connect, form, dashboard routing | 1 day |
| M5 | Live ticking balance | TickingBalance component working end-to-end | 1 day |
| M6 | Testnet deployment | Contract address recorded, app live on Vercel | 1 day |
| M7 | Demo video + README | All checklist items complete | 1 day |
| **Total** | | | **~8 days** |

### Level 4 Milestones

| # | Milestone | Deliverable | Est. Time |
|---|---|---|---|
| M8 | Factory contract | StreamFactory compiles, registry works | 2 days |
| M9 | Blend integration | Inter-contract deposit/withdraw working on testnet | 3 days |
| M10 | FLOW token | SEP-41 contract deployed, mint/burn on stream lifecycle | 2 days |
| M11 | Event streaming | Cursor-based polling with live activity feed | 1 day |
| M12 | Mobile responsive | All breakpoints tested on 375px + 768px | 1 day |
| M13 | CI/CD live | Pipeline green on GitHub Actions | 1 day |
| M14 | Level 4 README | All checklist items, contract addresses, CI badge | 1 day |
| **Total** | | | **~11 days** |

---

## 19. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Blend's pool contract interface changes between dev and submission | Medium | High | Pin to specific Blend v2 contract addresses on testnet; test integration early |
| Soroban testnet instability delays deployment | Medium | Medium | Use `soroban-cli` local sandbox for development; only push to testnet for final demo |
| Balance interpolation drifts from on-chain truth | Low | Low | 30-second on-chain sync corrects drift; show a "last synced" timestamp |
| FLOW token mint/burn gas too high for some transactions | Low | Medium | Batch operations where possible; document gas estimates in README |
| Blend integration is too complex for belt timeline | Medium | High | **Mitigation:** stub the Blend call with a mock in Level 4 if needed; document it as "ready for mainnet Blend address" |
| Demo video shows a failed transaction | Low | High | Record demo on a freshly funded testnet wallet; practice the demo flow 3 times before recording |
| GitHub Actions pipeline fails on Rust install | Low | Medium | Cache Rust toolchain in CI using `actions/cache`; test pipeline on a branch first |

---

## 20. Open Questions

| # | Question | Owner | Target Resolution |
|---|---|---|---|
| OQ-01 | Which specific Blend v2 pool address to use on testnet for USDC? | Sukrit | Before M9 — check Blend docs / Discord |
| OQ-02 | Should FLOW tokens be transferable from day 1, or locked to recipient for MVP? | Sukrit | Before M10 — transferable is more impressive for demo |
| OQ-03 | What unit should the UI display flow rate in — per day or per hour? | Sukrit | Design decision — per day is most intuitive for salary/freelance use case |
| OQ-04 | Should the factory deploy a new contract per stream (expensive) or use a single vault with multiple stream IDs? | Sukrit | Before M8 — single vault with multiple streams is simpler and cheaper |
| OQ-05 | Will the belt judges verify Blend integration actually calls the live Blend contract, or is a testnet mock acceptable? | Belt organizers | Ask in program Discord before M9 |

---

## Appendix A — Commit Convention

Use conventional commits for all meaningful commits to satisfy the 3+ and 8+ commit requirements:

```
feat: add StreamVault create_stream function
feat: implement withdraw with claimable calculation
feat: add cancel with correct balance split
test: add 3 passing unit tests for vault lifecycle
feat: implement live-ticking balance component
feat: deploy StreamVault to testnet
docs: complete README with demo video and test screenshot
feat: add StreamFactory with per-pair registry
feat: integrate Blend deposit on stream creation
feat: add FLOW SEP-41 token with mint/burn lifecycle
feat: implement cursor-based event streaming
feat: mobile responsive layout with Tailwind breakpoints
ci: add GitHub Actions pipeline with test + deploy jobs
docs: update README with Level 4 checklist items
```

---

## Appendix B — Testnet Deployment Checklist

Before recording the demo video:

- [ ] `StreamVault` (L3) deployed to Soroban testnet — address recorded
- [ ] `StreamFactory` (L4) deployed — address recorded
- [ ] `FLOW` token contract deployed — address recorded  
- [ ] Blend pool address confirmed on testnet
- [ ] Wallet funded with testnet USDC (use Stellar Friendbot + DEX)
- [ ] One complete stream created, withdrawn from, and cancelled successfully on testnet before recording
- [ ] Vercel deployment live and loading without errors
- [ ] GitHub Actions pipeline green on latest commit

---

*This document is a living PRD. Update version number and Last Updated date on any significant change.*
