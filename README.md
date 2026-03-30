# 🚀 Orbital IDE

<div align="center">

### The Complete Soroban Smart Contract Development Environment

**Write • Compile • Deploy • Interact — All in Your Browser**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue.svg)](https://stellar.org/)
[![Tests](https://img.shields.io/badge/Tests-25%2F25%20Passing-success.svg)](#running-tests)

[🎥 Demo Video](#) • [📚 Documentation](#documentation) • [🤝 Contributing](#contributing)

</div>

---

## ✨ Overview

Orbital IDE is a **browser-based development environment** for building, deploying, and testing Soroban smart contracts on the Stellar Testnet. Write Rust contracts, compile them to WebAssembly, deploy on-chain, invoke contract functions with a type-safe UI, and monitor live events — all from the browser.

No complicated setup. No local Rust toolchain required (unless you prefer it). Just open the browser and start building.

---

## 🎯 Key Features

### 🖥️ **Integrated Code Editor**
- **Monaco Editor** with full Rust syntax highlighting
- **5 Curated Example Contracts** (counter, token, escrow, voting, hello_world)
- Smart code completion with AI-assisted suggestions

### 🔨 **Smart Compilation Pipeline**
- Precompiled WASM for example contracts (instant 0ms deploy)
- Live backend compilation for custom Rust code via Express server
- Fallback to local `cargo` compilation if available
- Clear error messages with line numbers and suggestions

### 🌐 **On-Chain Deployment**
- One-click deploy to Stellar Testnet
- Transaction tracking with Stellar Expert links
- Real-time deployment progress indicators
- Safe error handling for insufficient balance, network issues, etc.

### ⚡ **Interactive Contract Invocation**
- **Typed Parameter UI** with validation for all Soroban primitives
  - Integers (u32, i32, u64, i64, u128, i128)
  - Booleans, addresses, strings, symbols, bytes
  - Complex types (Vec, Map, Tuple, Struct, Enum, UDT)
- **Raw Call Mode** for advanced users (function name + JSON args)
- Real-time result display with JSON formatting

### 📡 **Live Event Streaming**
- Real-time contract event polling (5-second intervals)
- Cursor-based pagination for efficient event tracking
- Event history persisted to localStorage
- Works across page refreshes

### 💾 **Session Persistence**
- Deployed contract state survives page refresh
- Transaction history preserved
- Event cursors maintained per contract
- Automatic recovery on reconnect

### 🔐 **Multi-Wallet Support**
| Wallet | Status | Notes |
|--------|--------|-------|
| **Freighter** | ✅ Fully Supported | Recommended for Stellar |
| **Albedo** | ✅ Fully Supported | Alternative option |
| **WalletConnect** | ✅ Fully Supported | Universal protocol |
| **LOBSTR** | ✅ Fully Supported | Mobile-friendly |
| xBull / Rabet | 🔨 Coming Soon | Scaffolding in place |

- **Smart Error Handling**
  - `NOT_INSTALLED` — wallet extension not found
  - `USER_REJECTED` — user declined transaction
  - `INSUFFICIENT_BALANCE` — not enough XLM
  - `NETWORK_ERROR` — connection issues with retry logic

### 🤖 **AI-Powered Assistant**
- **Explain Code** — understand contracts in plain English
- **Debug Issues** — AI identifies potential bugs and suggests fixes
- **Improve Code** — optimization suggestions and best practices
- **Generate Contracts** — create boilerplate from natural language description
- **Chat Mode** — ask questions, get instant answers

> 🔒 **Privacy First:** Your Gemini API key is stored **only in your browser's localStorage**. It is never sent to any server except directly to Google's API. You remain in full control.

---

## 📖 Documentation

Complete documentation is available in the [`dev-docs/`](dev-docs/) directory:

- **[Architecture](dev-docs/architecture.md)** — System design and component overview
- **[Feature Status](dev-docs/features-status.md)** — Detailed feature matrix
- **[Backend Compiler](dev-docs/backend-compiler.md)** — Compilation pipeline internals
- **[Local Development](dev-docs/local-development.md)** — Setup and debugging guide
- **[Troubleshooting](dev-docs/troubleshooting.md)** — Common issues and solutions

---

## 🚀 Quick Start

Choose your preferred method to get up and running:

### Option 1: Docker 🐳 (Recommended)

**Best for:** First-time users, Windows users, avoiding system complications

```bash
docker compose up
```

The application will be available at:
- **Frontend:** http://localhost:5173 — Open this in your browser
- **Compiler Backend:** http://localhost:3001 — API endpoint for compilation

No additional setup required. Everything is containerized.

---

### Option 2: Local Development 💻

**Best for:** Contributors, advanced users, custom configuration

#### Prerequisites
- Node.js 18 or later
- Rust toolchain: `rustc` + `cargo`
- Stellar CLI: `stellar`

```bash
# Add WebAssembly target support (one-time setup)
rustup target add wasm32-unknown-unknown
```

#### Installation

**Terminal 1 — Frontend (React/Vite)**
```bash
cd client
npm install
npm run dev
# Frontend will be served at http://localhost:5173
```

**Terminal 2 — Backend (Node.js Compiler)**
```bash
cd server
npm install
npm start
# Compiler API listening on http://localhost:3001
```

#### Windows PowerShell Shortcut

For Windows users, use the provided development script:
```powershell
.\scripts\dev-start.ps1
```

This automatically starts both services in separate terminals.

---

### Environment Configuration (Optional)

Create `client/.env` to customize settings:

```env
# Backend compiler URL (default: http://localhost:3001)
VITE_COMPILER_URL=http://localhost:3001

# WalletConnect project ID for mobile wallet support
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Without these variables, defaults are used. The backend compiler is required for custom contract compilation; precompiled examples work without it.

---

## 🧪 Testing

Orbital IDE has comprehensive test coverage across the entire stack.

```bash
cd client

# Run all tests
npm test

# Watch mode (re-run on file changes)
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Test Coverage

**25 tests across 7 files:**
- ✅ **Deployment Pipeline** — compile, upload WASM, deploy instance
- ✅ **Contract Interaction** — function discovery, typed params, raw calls
- ✅ **Event Streaming** — live polling, cursor persistence
- ✅ **Cache Persistence** — localStorage recovery, session state
- ✅ **Wallet Integration** — error categorization, transaction signing
- ✅ **Compiler Integration** — precompilation, fallback paths
- ✅ **AI Assistant** — code explanation, debugging, generation

All tests pass. Run `npm test` to verify.

---

## 🔌 Backend API Reference

The compiler backend provides a minimal REST API:

### Health Check
```bash
GET /health
```

Returns compiler readiness and toolchain versions:
```json
{
  "ready": true,
  "rust": "rustc 1.93.0",
  "stellarCli": "stellar 25.3.0",
  "activeCompilations": 0
}
```

**Use case:** Verify compiler availability before submitting compilation requests.

### Compile Contract
```bash
POST /compile
Content-Type: application/json

{
  "source": "#[contract]\n#[contractimpl]\npub struct Counter {...}",
  "packageName": "counter"
}
```

Returns compiled WebAssembly as base64:
```json
{
  "wasm": "AGFzbQEAAAAALQgBnYCAA...",
  "size": 45821,
  "compiledIn": 2150
}
```

**Use case:** Compile custom Rust contracts to WASM.

### Quick Backend Health Check
```bash
# Windows PowerShell
.\scripts\backend-smoke.ps1

# Linux / macOS
bash scripts/backend-smoke.sh
```

Runs a quick health check and compilation test.

---

## 📁 Project Structure

```
Dojo/
│
├── 📄 README.md ........................... You are here
├── 📄 docker-compose.yml ................. Full-stack orchestration
│
├── 💻 client/ ............................ Frontend (React + Vite)
│   ├── src/
│   │   ├── App.jsx ....................... Main IDE shell (1263 lines)
│   │   ├── Landing.jsx ................... Entry page
│   │   ├── main.jsx ...................... React entry point
│   │   ├── App.css ....................... Styling
│   │   │
│   │   ├── hooks/
│   │   │   └── useEventPolling.js ........ Live event sync hook
│   │   │
│   │   ├── services/
│   │   │   ├── wallet.js ................. Multi-wallet abstraction
│   │   │   ├── deploy.js ................. WASM upload, deploy, invoke
│   │   │   ├── compiler.js ............... Dual-path compilation
│   │   │   ├── cache.js .................. localStorage persistence
│   │   │   ├── ai.js ..................... Gemini AI integration
│   │   │   └── endpoints.js .............. Network configuration
│   │   │
│   │   ├── contracts/
│   │   │   └── examples.js ............... Curated example contracts
│   │   │
│   │   ├── tests/
│   │   │   └── setup.js .................. Test configuration
│   │   │
│   │   ├── *test.jsx ..................... Component tests
│   │   └── *test.js ....................... Service layer tests
│   │
│   ├── package.json ....................... Dependencies
│   ├── vite.config.js ...................... Build config
│   ├── tailwind.config.js .................. Styling config
│   ├── eslint.config.js .................... Linting rules
│   └── postcss.config.js ................... CSS processing
│
├── 🌐 server/ ............................. Backend (Node.js)
│   ├── index.js ........................... Express app + API routes
│   ├── build-examples.js .................. Pre-compile example contracts
│   ├── package.json ....................... Dependencies
│   ├── templates/
│   │   └── Cargo.toml ..................... Rust build template
│   └── Dockerfile ......................... Container image
│
├── 📚 dev-docs/ ........................... Detailed documentation
│   ├── README.md .......................... Documentation index
│   ├── architecture.md .................... System design deep-dive
│   ├── features-status.md ................. Feature matrix & roadmap
│   ├── backend-compiler.md ................ Compiler internals
│   ├── local-development.md ............... Development guide
│   ├── troubleshooting.md ................. Common issues & fixes
│   └── release-checklist.md ............... Pre-submission checklist
│
└── 🛠️ scripts/ ............................. Utility scripts
    ├── dev-start.ps1 ...................... Start dev environment (Windows)
    └── backend-smoke.ps1 .................. Health check (Windows)
```

---

## 🎨 Architecture Highlights

### Clean Separation of Concerns
- **Monaco Editor** for code writing (read-only from App state)
- **Service Layer** abstracts wallet, compilation, and deployment logic
- **Custom Hooks** manage complex state (event polling, cache persistence)
- **Component Tests** verify integration between DOM and services

### Smart Compilation Strategy
1. **Precompiled Examples** (0 ms compile time)
2. **Backend Compilation** via Express (fallback for custom code)
3. **Local Cargo** as last resort (if available)

### Event-Driven Architecture
- Polling-based event sync (not real-time, but sufficient for Testnet)
- Cursor-based pagination for efficiency
- Persisted cursors survive page refresh

### Error Handling
- Wallet errors categorized by type (user-friendly recovery)
- Network timeouts with retry logic
- Clear validation messages for parameter input
- Graceful degradation when services unavailable

---

## ⚙️ System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Node.js** | 18.x | 20.x LTS |
| **Rust** | 1.70 | Latest stable |
| **Browser** | Chrome 90+ | Chrome/Edge latest |
| **RAM** | 2 GB | 4+ GB |
| **Disk** | 500 MB | 2+ GB |

### Browser Support
- ✅ Chrome / Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari 15+
- ❌ IE 11 (not supported)

---

## 🔒 Security & Privacy

### Gemini API Key
- **Stored Locally:** API key is kept only in browser's `localStorage`
- **Never Proxied:** Direct connection to Google's API servers
- **User Controlled:** Users can delete the key anytime
- **Clear Warning:** UI displays privacy notice on input

### Wallet Integration
- **Hardware-Ready:** Full support for hardware wallets via Freighter
- **No Key Storage:** Private keys never leave the wallet extension
- **Transaction Signing:** All sensitive operations require wallet authorization

### Network Security
- HTTPS recommended for production deployment
- CORS configured for trusted origins only
- No persistent session storage (stateless design)

---

## 📊 Known Limitations

### Windows Application Control
**Issue:** Local `cargo` execution may fail with `os error 4551` on hardened Windows machines

**Solution:** Use Docker instead (recommended) or disable Application Control

```powershell
# Check Application Control (Windows)
Get-AppLockerPolicy -Effective | Select-Object -ExpandProperty RuleCollections
```

### Bundle Size
Stellar SDK + Monaco Editor result in a larger bundle (~1.2 MB gzipped), which exceeds Vite's default warning threshold. This is expected and acceptable for this feature set.

### Complex Type Labels
`Vec<T>`, `Map<K,V>`, nested structs render as generic `vec`, `map`, `udt` labels. Users can switch to **Raw Call Mode** to pass complex types as JSON.

**Example:**
```javascript
// UI shows parameter type as "vec" (not "Vec<u32>")
// Use Raw Call Mode with JSON: [1, 2, 3]
```

---

## 🤝 Contributing

Contributions are welcome! Please check [`dev-docs/local-development.md`](dev-docs/local-development.md) for development setup.

### Guidelines
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Write tests for new functionality
4. Ensure all tests pass: `npm test`
5. Submit a pull request

---

## 📝 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) file for details.

---

## 🎯 Roadmap

**Current Sprint:**
- ✅ Multi-wallet support
- ✅ Event streaming
- ✅ AI-assisted development
- ✅ Comprehensive test coverage

**Next Phase:**
- 🔨 Advanced debugging tools
- 🔨 Contract state inspection
- 🔨 Transaction simulation
- 🔨 Deployment analytics

**Future Vision:**
- 🌟 Team collaboration features
- 🌟 Contract templates & marketplace
- 🌟 Integration with GitHub

---

## 📞 Support

**Issues & Bug reports:** [GitHub Issues](https://github.com/your-org/orbital-ide/issues)

**Documentation:** [`dev-docs/`](dev-docs/) directory

**Community:** Stellar Discord & Forums
