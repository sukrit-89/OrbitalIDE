# 🔮 Orbital IDE

> **Write, Deploy, and Test Soroban Smart Contracts Without Installing Anything**

![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue?logo=stellar)
![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-purple)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![Monaco](https://img.shields.io/badge/Monaco-Editor-007ACC?logo=visual-studio-code)

**A browser-based IDE for Soroban smart contract development with built-in AI assistance.**

---

## 📁 Project Structure

```
Dojo/
├── client/              # Frontend application (React + Vite)
│   ├── src/
│   │   ├── compiler.js  # Compilation interface (precompiled + backend)
│   │   ├── deploy.js    # Soroban deployment (upload WASM → deploy instance)
│   │   ├── wallet.js    # Freighter wallet integration
│   │   ├── ai.js        # Groq AI assistant
│   │   ├── contracts/   # Example contract source & metadata
│   │   └── App.jsx      # Main IDE component
│   ├── public/wasm/     # Pre-compiled example WASM files
│   └── package.json     # Frontend dependencies
│
├── server/              # Backend compilation service
│   ├── index.js         # Express API (POST /compile, GET /health)
│   ├── build-examples.js# Pre-compile example contracts to WASM
│   ├── templates/       # Cargo.toml template for Soroban projects
│   ├── Dockerfile       # Containerized Rust compilation environment
│   └── package.json     # Backend dependencies
│
├── docker-compose.yml   # Full-stack orchestration
└── README.md
```

## 🚀 Quick Start

### Option 1: Local Development

```bash
# Frontend
cd client
npm install
npm run dev
# → http://localhost:5173

# Backend compiler (separate terminal)
cd server
npm install
npm start
# → http://localhost:3001
```

### Option 2: Docker

```bash
docker compose up
# Frontend → http://localhost:5173
# Compiler → http://localhost:3001
```

### Prerequisites for Local Backend
- **Rust** with `wasm32-unknown-unknown` target: `rustup target add wasm32-unknown-unknown`
- **stellar-cli** (optional, for WASM optimization): `cargo install --locked stellar-cli --features opt`
- **Node.js** 18+

### Wallet Setup Notes
- The IDE now supports wallet selection in the header: **Freighter**, **Albedo**, **WalletConnect**, and **LOBSTR**.
- For WalletConnect/LOBSTR, set `VITE_WALLETCONNECT_PROJECT_ID` in `client/.env`.
- Freighter remains the default and most stable development path.

## ✨ Features

### 🔥 Core IDE Features
- **📝 Monaco Editor**: VS Code-quality Rust editing in the browser
- **🚀 Real Deployment**: Deploy contracts to Stellar Testnet with actual blockchain transactions
- **⚡ Contract Interaction**: Call functions with real on-chain invocations
- **📋 Transaction History**: Track deployments and calls with Stellar Explorer links
- **💾 5 Example Contracts**: Counter, Token, Escrow, Voting, Hello World

### 🤖 AI-Powered Coding Features
Built-in AI assistant powered by Groq (free tier available):

- **💬 AI Chat Assistant**: Ask questions about Soroban, Rust, smart contract patterns
- **🎯 AI Code Generation**: Generate complete smart contracts from natural language
- **💡 Code Explanation**: Understand any Soroban code
- **✨ Inline Code Completion**: GitHub Copilot-like autocomplete (Ctrl+Space)
- **🔍 AI Debugging**: Find issues and suggest fixes
- **⚡ Code Improvements**: Optimization suggestions for gas, security, readability

**Setup**: Click ⚙️ in AI Assistant → Add your free [Groq API key](https://console.groq.com)

### 🛠️ Technical Stack
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React 19.2.0 + Vite | UI framework |
| Editor | Monaco Editor | Code editing |
| AI | Groq (Llama 3.1/3.3) | AI assistance |
| Blockchain | Stellar SDK 14.5.0 | Contract deployment |
| Contracts | Soroban SDK 21.7.6 | Rust smart contracts |
| Wallet | Freighter API 6.0.1 | Transaction signing |
| Backend | Express + Rust + stellar-cli | Contract compilation |
| RPC | Soroban Testnet | Contract interaction |

---

## 📦 Installation

**Frontend only** (examples use pre-compiled WASM):
```bash
cd client && npm install && npm run dev
```

**Full stack** (compile any custom contract):
```bash
# Terminal 1 - Compiler backend
cd server && npm install && npm start

# Terminal 2 - Frontend
cd client && npm install && npm run dev
```

**Pre-compile examples** (one-time):
```bash
cd server && node build-examples.js
```

## 🧪 Testing

Run frontend unit tests with Vitest:

```bash
cd client
npm test
```

Watch mode during development:

```bash
cd client
npm run test:watch
```

## 🚀 First Deployment

1. **Get Testnet XLM**: Visit [Friendbot](https://friendbot.stellar.org/) with your wallet address
2. **Connect Wallet**: Click "Connect Wallet" → Approve in Freighter
3. **Choose Example**: Select "Counter" from sidebar
4. **Deploy**: Click "🚀 Deploy" → "Deploy to Testnet" → Confirm in wallet (~5 seconds)
5. **Interact**: Click "⚡ Interact" → Select function → Execute

---

## 📚 Example Contracts

### 1. Counter (Beginner)
Simple incrementing counter with persistent storage.
```rust
pub fn increment(env: Env) -> i32;
pub fn decrement(env: Env) -> i32;
pub fn get_count(env: Env) -> i32;
pub fn reset(env: Env);
```

### 2. Simple Token (Intermediate)
Basic fungible token with minting and transfers.
```rust
pub fn initialize(env: Env, admin: Address, name: String, symbol: String);
pub fn mint(env: Env, to: Address, amount: i128);
pub fn transfer(env: Env, from: Address, to: Address, amount: i128);
pub fn balance(env: Env, account: Address) -> i128;
```

### 3. Escrow (Advanced)
Secure escrow system with buyer, seller, and arbitrator.
```rust
pub fn create(env: Env, buyer: Address, seller: Address, arbitrator: Address);
pub fn fund(env: Env);
pub fn release(env: Env);
pub fn refund(env: Env);
```

### 4. Voting System (Intermediate)
On-chain governance with proposals and voting.
```rust
pub fn create_proposal(env: Env, title: String, description: String) -> u32;
pub fn vote(env: Env, voter: Address, proposal_id: u32, vote_yes: bool);
pub fn get_proposal(env: Env, proposal_id: u32) -> Proposal;
```

### 5. Hello World (Beginner)
The simplest possible Soroban contract.
```rust
pub fn hello(env: Env, to: Symbol) -> Vec<Symbol>;
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Browser IDE                           │
├──────────────┬────────────────────┬─────────────────────┤
│   Sidebar    │    Main Panel      │   Info Panel        │
│              │                    │                     │
│ Examples:    │  [Editor Tab]      │  📚 About           │
│ - Counter    │  ┌──────────────┐  │  🎯 How It Works    │
│ - Token      │  │              │  │  💡 Tips            │
│ - Escrow     │  │  Monaco      │  │  🔗 Resources       │
│ - Voting     │  │  Editor      │  │                     │
│ - Hello      │  │  (Rust)      │  │  Current Contract:  │
│              │  │              │  │  ┌────────────────┐ │
│              │  └──────────────┘  │  │ Counter        │ │
### Deploy Flow
```
User Code → Compiler Service → WASM Binary
                                    ↓
                        Upload to Stellar (WASM hash)
                                    ↓
                         Deploy Contract Instance
                                    ↓
                         Return Contract ID + Explorer Link
```

### Interact Flow
```
Function Call + Params → Prepare ScVal Arguments
                                ↓
                    Sign Transaction (Freighter)
                                ↓
                         Submit to Soroban RPC
                                ↓
    Real Deployment Process
1. **Compilation**: WASM binary loaded (precompiled or compiled via backend service)
2. **Upload**: WASM uploaded to Stellar network → Returns WASM hash
3. **Deploy**: Contract instance created from WASM hash → Returns contract ID
4. **Interact**: Functions invoked on-chain with parameter type conversion

**What Actually Happens:**
- ✅ Real transactions signed by Freighter
- ✅ Real gas fees paid in XLM
- ✅ Real contract deployed on Stellar Testnet
- ✅ Real function calls with on-chain results
- ✅ View all transactions on [Stellar Expert](https://stellar.expert/explorer/testnet)

### Parameter Types Supported
- `i32`, `u32`: Integers
- `String`: Text values
- `Address`: Stellar addresses (G...)
- `Symbol`: Soroban symbols

### 🤖 AI Features

**Setup**: Click ⚙️ in AI panel → Add [Groq API key](https://console.groq.com) → Start coding

**AI Chat**: Ask Soroban/Rust questions, get code examples  
**Code Actions**: 💡 Explain, 🔍 Debug, ⚡ Improve  
**Generation**: "Generate a token contract" → Full code in editor  
**Completion**: Type `pub fn` → AI suggests next lin
---

## 🎯 Yellow Belt Certification

This project demonstrates all Yellow Belt requirements:

### ✅ Smart Contract Integration
- **Requirement**: Deploy and interact with Soroban contract
- **Implementation**: 5 example contracts with deploy + interact UI
- **Evidence**: [src/contracts/examples.js](src/contracts/examples.js), [src/App.jsx](src/App.jsx) lines 60-145

### ✅ Multi-Wallet Support
- **Requirement**: Support multiple wallet providers
- **Implementation**: Framework for Freighter, xBull, Albedo, Rabet
- **Evidence**: [src/wallet.js](src/wallet.js) lines 20-50

### ✅ Error Handling (4+ Types)
- **Requirement**: Handle 3+ distinct error types
- **Implementation**: 4 error categories:
  1. `NOT_INSTALLED` - Wallet extension missing
  2. `USER_REJECTED` - User declined transaction
  3. `INSUFFICIENT_BALANCE` - Not enough XLM
  4. `NETWORK_ERROR` - RPC/network issues
- **Evidence**: [src/wallet.js](src/wallet.js) lines 30-35

### ✅ Transaction Status Tracking
- **Requirement**: Show pending/success/fail states
- **Implementation**: Real-time status updates with visual feedback
- **Evidence**: [src/App.jsx](src/App.jsx) lines 100-140

### ✅ Event Listening
- **Requirement**: Monitor contract events
- **Implementation**: Transaction history tracking with timestamps
- **Evidence**: [src/App.jsx](src/App.jsx) lines 130-145

---

## 🚧 Roadmap
### Current Status (March 2026)

| Track | Status | Notes |
|------|--------|-------|
| Yellow Belt | Mostly complete | Real deployment, invocation, and tx tracking are live. |
| Orange Belt | In progress | Loading states, tests, and local caching are in place; video and multi-wallet work remain. |

### Yellow Belt Checklist

- [x] Smart contract deployment to testnet
- [x] Contract function invocation from frontend
- [x] Read/write interactions via on-chain calls
- [x] Wallet error handling (not found/rejected/insufficient)
- [x] Transaction status tracking (pending/success/fail)
- [~] Multi-wallet support (Freighter live, other providers scaffolded)
- [x] Event listening/state sync (contract events polled and synchronized in UI)

### Orange Belt Checklist

- [x] Loading states and progress indicators
- [x] Basic caching implementation (API key + deploy state + transaction history persisted)
- [x] Automated tests (Vitest suite for wallet/compiler/cache)
- [x] Complete documentation with README
- [ ] 1-minute demo video

### Next Priorities

1. Expand tests to cover deploy and interaction flows.
2. Add caching for recent compile results by source hash.
3. Integrate StellarWalletsKit for true multi-wallet connections.
4. Add contract-event synchronization beyond transaction confirmation polling.
5. Record and link the demo video.

---

**Made for Stellar Monthly Builder Challenge**