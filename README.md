<p align="center">
  <h1 align="center">Eventrix — Autonomous Game Prediction Arena</h1>
</p>

<p align="center">
  <b>Games plug in → Autonomous agents play → Live streamed → Real-time prediction markets form → Settled on-chain.</b><br/>
  <i>Built on BNB Smart Chain Testnet.</i>
</p>

---

## 🎬 What Is This?

Eventrix is a platform and SDK where:

1. **Games connect** via the Arena SDK — the game emits state, the SDK injects behavior.
2. **Autonomous agents play** — rule-based, deterministic AI agents control all characters (no humans playing).
3. **Gameplay is live-streamed** — WebSocket frame streaming to a spectator web app.
4. **AI generates prediction markets** — GPT analyzes real-time game events and creates dynamic YES/NO betting questions.
5. **Spectators bet with real BNB** — on-chain prediction markets with proportional payouts.
6. **Markets settle trustlessly** — via the `GameResolver` contract on BNB Chain.

This turns any autonomous game into a **verifiable, financialized esports arena**.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Game Engine (Python/Pygame)               │
│  autonomous_game.py → sprites, tasks, voting, kills             │
└──────────────┬──────────────────────────────────────────────────┘
               │  WebSocket frames + game events
               ▼
┌──────────────────────────┐     ┌────────────────────────────────┐
│   Bridge Server (FastAPI) │────▶│   Next.js Spectator App        │
│   bridge_server.py        │     │   Live stream + Betting UI     │
│   /ws/stream, /ws/game    │     │   Prediction markets panel     │
└──────────────────────────┘     │   AI-generated suggestions     │
                                  │   Wallet integration (MetaMask)│
                                  └───────────────┬────────────────┘
                                                  │  betYes / betNo
                                                  ▼
                                  ┌────────────────────────────────┐
                                  │   BNB Smart Chain (Testnet)     │
                                  │   PredictionMarket.sol          │
                                  │   GameRegistry.sol              │
                                  │   GameResolver.sol              │
                                  │   GamePrizePool.sol             │
                                  │   AgentTokenRegistry.sol        │
                                  │   PersistentAgentToken.sol      │
                                  └────────────────────────────────┘
```

---

## 📦 Project Structure

```
Eventrix/
├── game/                       # Autonomous game engine (Python)
│   ├── autonomous_game.py          # Core game loop + agent behavior
│   ├── sprites.py                  # Game sprites + physics
│   ├── bridge_server.py            # FastAPI WebSocket bridge
│   ├── main_autonomous.py          # Entry point for the game
│   └── bnb/
│       ├── blockchain.py           # On-chain integration (register, markets, settle)
│       ├── tokenization.py         # Agent token trading
│       └── contracts/              # Foundry project with all Solidity contracts
│           └── src/                # 7 deployed smart contracts
│
├── app/                        # Next.js spectator web app
│   ├── components/spectator/
│   │   ├── spectator-app.tsx       # Main spectator layout
│   │   ├── prediction-markets.tsx  # On-chain markets + AI suggestions
│   │   ├── stream-player.tsx       # Live game stream viewer
│   │   └── token-launchpad.tsx     # Agent token trading UI
│   ├── app/api/
│   │   ├── ai-model/route.ts       # GPT-powered market question generator
│   │   └── create-market/route.ts  # Server-side market creation (owner key)
│   ├── lib/
│   │   ├── abis.ts                 # Contract ABIs
│   │   ├── contracts.ts            # Contract addresses + metadata
│   │   └── contract-hooks.ts       # React hooks for contract interaction
│   └── hooks/
│       ├── wallet.ts               # MetaMask wallet integration
│       └── use-game-store.ts       # Game state store (Zustand)
│
├── Eventra_SDK/                # SDK package + documentation website
│   ├── sdk/                        # Core TypeScript SDK
│   │   └── src/
│   │       ├── arena.ts            # PredictionArena entry point
│   │       ├── adapter.ts          # Game integration adapter
│   │       ├── agents/             # BaseAgent, RuleAgent
│   │       ├── markets/            # MarketEngine, OddsEngine
│   │       ├── streaming/          # Broadcaster, StreamServer
│   │       └── blockchain/         # BNBClient, SettlementEngine
│   ├── website/                    # SDK documentation site (React)
│   └── contracts/                  # Reference contract copies
│
└── demo_game/                  # Demo game implementation
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** with `pygame-ce`, `fastapi`, `uvicorn`, `web3`
- **Node.js 18+** with `npm`
- **MetaMask** browser extension (for betting)
- **BNB Testnet tBNB** — get from [BNB Faucet](https://testnet.bnbchain.org/faucet-smart)

### 1. Start the Bridge Server

```bash
cd game
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python bridge_server.py
```

### 2. Start the Game Engine

```bash
cd game
python main_autonomous.py
```

### 3. Start the Web App

```bash
cd app
npm install
npm run dev
```

Open `http://localhost:3000/game/game-001` to watch the live stream and interact with prediction markets.

### 4. (Optional) Run the SDK Website

```bash
cd Eventra_SDK/website
npm install
npm run dev
```

---

## ⛓️ Smart Contracts (BNB Testnet)

All contracts are deployed on **BNB Smart Chain Testnet** (Chain ID: 97).

| Contract | Address | Purpose |
|---|---|---|
| **GameRegistry** | `0xA07DdE4d7Cc3d2122aC20F70133520946E588eCE` | Registers games, manages lifecycle (CREATED → RUNNING → FINISHED) |
| **PredictionMarket** | `0x6Bf43E463011066fAa65cFC5499CBc872a6b248E` | Binary YES/NO markets — bet BNB, winners split the pool |
| **GameResolver** | `0x60eaEA0Edde98bf0B5A8C3C2FAc48213444bCCd9` | Atomically finishes game + resolves all linked markets |
| **GamePrizePool** | `0x01555aeb46F240D4437823d10fad21D032323B92` | Prize pool (90/10 split) — distributes BNB to winning agent tokens |
| **AgentRegistry** | `0x77BEba0C93E0F93BEa328e79c1C9A7694a5c2615` | Tracks agent stats (games played, wins) |
| **AgentTokenRegistry** | `0xdbfc97A6560a360ff02dd5f8F641B2991dB1024d` | Factory for PersistentAgentToken (1M supply each) |
| **PersistentAgentToken** | `0x7603a62D192033ee58842ecDe5b07AE3429617E3` | ERC20 per agent — tracks stats, receives BNB rewards |

> 📄 Full contract documentation: [`game/bnb/contracts/CONTRACTS.md`](game/bnb/contracts/CONTRACTS.md)

---

## 📊 Prediction Markets Flow

```
Game Event (kill, meeting, vote)
        │
        ▼
  AI Model (GPT-4o-mini) analyzes event logs
        │
        ▼
  Generates 3 dynamic YES/NO questions
        │
        ▼
  User clicks YES or NO
        │
        ├─ Server creates market on-chain (createMarket)
        └─ User's MetaMask places bet (betYes / betNo) — 0.01 tBNB
        │
        ▼
  Market appears in "On-Chain Markets" panel
        │
        ▼
  Game ends → GameResolver.resolveGame() settles all markets
        │
        ▼
  Winners call claim() to collect proportional payouts
```

**Payout formula:** `payout = (userBet × totalPool) / winningPool`

---

## 🤖 Autonomous Agents

All game characters are controlled by **rule-based deterministic agents**:

- **Crew agents** — patrol waypoints, do tasks, report suspicious behavior, vote during meetings
- **Impostor agent** — stalks targets, kills when alone, deflects accusations during meetings

Agents are deterministic by design — this ensures **verifiable outcomes** for on-chain market settlement.

---

## ⚙️ Core Modules

### Game Engine (`game/`)
- `autonomous_game.py` — Main game loop with boundary clamping, agent controllers, kill/vote mechanics
- `bridge_server.py` — FastAPI server with WebSocket endpoints for frame streaming and game events
- `bnb/blockchain.py` — On-chain integration for game registration, market creation, and settlement

### Web App (`app/`)
- `prediction-markets.tsx` — On-chain market cards with live odds + AI-generated betting suggestions
- `stream-player.tsx` — Real-time game frame viewer via WebSocket
- `/api/create-market` — Server-side market creation using owner's private key
- `/api/ai-model` — GPT integration for dynamic prediction question generation

### SDK (`Eventra_SDK/sdk/`)
- `PredictionArena` — Main entry point: `new PredictionArena(SDKConfig, gameInstance, privateKey?)`
- `ArenaAdapter` — Game integration layer for registering agents and starting matches
- `BaseAgent` / `RuleAgent` — Agent abstraction with `decide(state) → AgentAction`
- `MarketEngine` / `OddsEngine` — Dynamic market creation and odds calculation
- `Broadcaster` / `StreamServer` — WebSocket event streaming
- `BNBClient` / `SettlementEngine` — Blockchain settlement (no API keys required)

---

## 🔧 Environment Variables

Create `app/.env`:

```env
PRIVATE_KEY="0x..."                          # Contract owner private key (for market creation)
NEXT_PUBLIC_BSC_TESTNET_RPC="https://bsc-testnet-dataseed.bnbchain.org"
NEXT_PUBLIC_CHAIN_ID=97

# Core contracts
NEXT_PUBLIC_GAME_REGISTRY=0xA07DdE4d7Cc3d2122aC20F70133520946E588eCE
NEXT_PUBLIC_PREDICTION_MARKET=0x6Bf43E463011066fAa65cFC5499CBc872a6b248E
NEXT_PUBLIC_GAME_RESOLVER=0x60eaEA0Edde98bf0B5A8C3C2FAc48213444bCCd9
NEXT_PUBLIC_GAME_PRIZE_POOL=0x01555aeb46F240D4437823d10fad21D032323B92

# Agent contracts
NEXT_PUBLIC_AGENT_REGISTRY=0x77BEba0C93E0F93BEa328e79c1C9A7694a5c2615
NEXT_PUBLIC_AGENT_TOKEN_REGISTRY=0xdbfc97A6560a360ff02dd5f8F641B2991dB1024d
NEXT_PUBLIC_PERSISTENT_AGENT_TOKEN=0x7603a62D192033ee58842ecDe5b07AE3429617E3

# AI integration
OPENAI_API_KEY=sk-proj-...
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Game Engine | Python 3.11, Pygame-CE |
| Bridge Server | FastAPI, Uvicorn, WebSockets |
| Web App | Next.js 16, React, TypeScript, Tailwind CSS |
| Wallet | ethers.js v6, MetaMask |
| Smart Contracts | Solidity ^0.8.20, Foundry |
| Blockchain | BNB Smart Chain Testnet (Chain ID 97) |
| AI | OpenAI GPT-4o-mini |
| State Management | Zustand |

---

## 🏆 Key Design Principles

1. **Games emit state. Eventrix injects behavior.** — Clean separation between game engine and SDK.
2. **Deterministic agents** — Rule-based, not ML-based. Critical for verifiable on-chain settlement.
3. **No API keys for blockchain** — Direct RPC connection to BNB Chain. No intermediaries.
4. **Dynamic markets** — AI observes game events in real-time and generates context-aware prediction questions.
5. **Fully on-chain settlement** — All bets, markets, and payouts are transparent on BNB testnet.

---

## 📜 License

MIT

