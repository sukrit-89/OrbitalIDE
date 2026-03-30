# Orbital IDE - Client

Browser-based IDE for Soroban smart contract development with AI assistance.

## Quickstart

### Prerequisites

- Node.js 18+
- npm

### Frontend Only

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

### Full Local Stack (Frontend + Compiler Backend)

In terminal 1:

```bash
cd server
npm install
npm start
```

In terminal 2:

```bash
cd client
npm install
npm run dev
```

Optional `client/.env`:

```env
VITE_COMPILER_URL=http://localhost:3001
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Optional endpoint overrides (frontend)
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_STELLAR_EXPLORER_BASE_URL=https://stellar.expert/explorer/testnet
VITE_GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions

# Optional resource links shown in UI
VITE_SOROBAN_DOCS_URL=https://soroban.stellar.org/docs
VITE_FRIENDBOT_URL=https://friendbot.stellar.org/
VITE_GROQ_CONSOLE_URL=https://console.groq.com
```

## 📁 Project Structure

```
client/
├── src/
│   ├── components/       # React components
│   │   ├── Landing.jsx   # Landing page
│   │   └── ...
│   ├── services/         # Business logic
│   │   ├── ai.js         # AI assistant (Groq)
│   │   ├── deploy.js     # Contract deployment
│   │   ├── compiler.js   # WASM compilation
│   │   ├── wallet.js     # Wallet integration
│   │   └── stellar.js    # Stellar SDK utilities
│   ├── contracts/        # Example contracts
│   │   └── examples.js   # Pre-built contracts
│   ├── App.jsx           # Main IDE component
│   ├── App.css           # IDE styles
│   └── main.jsx          # Entry point
├── public/               # Static assets
│   ├── wasm/             # Pre-compiled WASM files
│   └── Orbital-IDE.png   # Logo
└── index.html            # HTML template
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
# Backend compiler service base URL
VITE_COMPILER_URL=http://localhost:3001

# Blockchain endpoints used by deploy/invoke/event flows
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_HORIZON_URL=https://horizon-testnet.stellar.org

# Explorer and AI endpoints
VITE_STELLAR_EXPLORER_BASE_URL=https://stellar.expert/explorer/testnet
VITE_GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
```

### AI Assistant Setup

1. Get a free API key from [Groq Console](https://console.groq.com)
2. Click Settings ⚙️ in the AI Assistant panel
3. Enter your API key
4. Start using AI features!

## 🌟 Features

- **Monaco Editor** - VS Code-quality editing
- **AI Assistant** - Code generation, explanation, debugging
- **Real Deployment** - Deploy to Stellar Testnet
- **Contract Interaction** - Call contract functions
- **Transaction History** - Track all operations
- **Multi-Wallet Support** - Freighter integration

## 📦 Dependencies

- React 19.2.0
- Monaco Editor
- Stellar SDK 14.5.0
- Freighter API 6.0.1
- Lucide React (icons)
- Groq AI API

## 🛠️ Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📚 Learn More

- [Soroban Documentation](https://soroban.stellar.org)
- [Stellar SDK](https://github.com/stellar/js-stellar-sdk)
- [Freighter Wallet](https://www.freighter.app/)
