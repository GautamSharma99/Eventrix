<p align="center">
  <h1 align="center">🛸 Eventrix Prediction Arena SDK</h1>
</p>

<p align="center">
  <b>Infrastructure where games plug in → autonomous agents play → live streamed → real-time markets form.</b><br/>
  <i>Built for BNB Chain.</i>
</p>

---

## 🎬 What Is This?

Eventrix Prediction Arena is a platform and SDK where:
1. **Developers connect their games** using the Arena SDK.
2. The SDK **wraps the game with autonomous agent controllers**.
3. **Agents play the game** (no humans required!).
4. Gameplay is **streamed live** on Eventrix.
5. **Prediction markets are dynamically created** mid-match based on real-time events.
6. **Spectators bet in real-time** on the outcome.
7. Markets **settle trustlessly on BNB Chain**.

This transforms an autonomous engine into a verifiable, financialized esports arena.

---

## 🏗️ Architecture

```text
Game → Arena Adapter → Agent Controller → Match Engine
         ↓
   Event Stream → Market Engine → Blockchain (BNB)
         ↓
      Eventrix Web (Streaming + Betting UI)
```

The SDK provides 4 core layers out-of-the-box:
1. **Wrap game engines**
2. **Inject autonomous agents** 
3. **Stream match state**
4. **Generate prediction markets dynamically**

---

## 📦 Project Structure

```text
Eventrix/
├── Eventra_SDK/
│   ├── sdk/                # Core Eventrix Prediction Arena SDK
│   │   ├── src/
│   │   │   ├── adapter.ts      # Game integration layer
│   │   │   ├── agents/         # Autonomous agents logic
│   │   │   ├── match/          # Deterministic match engine
│   │   │   ├── markets/        # Dynamic prediction market generation
│   │   │   ├── streaming/      # WebSocket streaming to frontend
│   │   │   └── blockchain/     # BNB Chain settlement
│   ├── contracts/          # Smart Contracts (PredictionMarket, etc.)
│   ├── demo-game/          # Demo implementation using the SDK
│   └── website/            # Landing page / streaming UI
└── app/                    # Web App UI for streaming and betting
```

---

## 🚀 Quick Start (Demo Game)

Run the demo autonomous game built using the Eventrix SDK:

```bash
cd Eventra_SDK/demo-game
npm install
npm start
```

This will run the deterministic match engine, initialize agents, run the game loop, and simultaneously create odds and settle simulated markets.

---

## ⚙️ Core Modules

### 1. Game Connection Layer (`adapter.ts`)
Hooks into any external game loop to inject agents and extract normalized `GameEvent`s. 

### 2. Autonomous Agent Layer (`agents/`)
Rule-based agents that receive game state snapshots, 'decide' on an action via `decide(state)`, and output an `AgentAction` per game tick.

### 3. Match Engine (`match/`)
Maintains the deterministic state of the match, handles tick loops, and ensures verifiable outcomes because Market trust relies on determinism.

### 4. Market Engine (`markets/`)
Listens to the `GameEvent` stream from the Match Engine and dynamically spins up markets. Supports dynamically updating odds for:
- Match Winner
- Next Eliminated Player
- Over/Under metrics

### 5. Blockchain Layer (`blockchain/`)
Handles the bridging to BNB Chain. Registers matches, manages the betting liquidity pools, and settles markets based on cryptographic hashes of the Match Engine's final state.

---

## ⛓️ Smart Contracts (BNB Testnet)

Located in `Eventra_SDK/contracts/`:

| Contract | Purpose |
|----------|---------|
| `ArenaRegistry.sol` | Registers matches and stores metadata |
| `PredictionMarket.sol` | Manages betting pools and payouts |
| `MatchSettlement.sol` | Verifies final hashes and resolves markets |

---

## 📈 Prediction Markets

Eventrix isn't just a betting platform; it dynamically turns the game's state into financial assets. Markets settle deterministically based strictly on the final game state hash processed by the engine — entirely eliminating oracle risk.

---

## 🏆 Hackathon Scope

This project was built focusing on creating the **infrastructure** to turn any game into a financialized spectator arena using autonomous agents. 

We explicitly focus on delivering verifiable determinism, agent orchestration, and automated on-chain settlement over a generic multi-game backend.

