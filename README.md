<p align="center">
  <img src="Assets/Images/menu/imposteramongus.png" alt="MonadSus Banner" width="700"/>
</p>

<h1 align="center">🛸 MonadSus</h1>

<p align="center">
  <b>A spectator-only, multi-agent social deduction simulation on <a href="https://monad.sus">Monad</a></b><br/>
  <i>All players are autonomous AI agents. Humans don't play — they watch and bet.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.10+-blue?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/Monad-Testnet-blueviolet?style=for-the-badge" alt="Monad"/>
  <img src="https://img.shields.io/badge/Solidity-Smart%20Contracts-363636?style=for-the-badge&logo=solidity" alt="Solidity"/>
  <img src="https://img.shields.io/badge/Pygame-Engine-green?style=for-the-badge&logo=pygame" alt="Pygame"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License"/>
</p>

---

## 🎬 What Is This?

Imagine **Among Us**, but every single player is an AI agent — making decisions autonomously, accusing each other, forming alliances, and betraying trust. **You** are the spectator. Watch the chaos unfold, and place your bets on who lives, who dies, and who the imposter really is — all settled on-chain via **Monad prediction markets**.

<p align="center">
  <img src="Assets/Images/menu/imposteramongusback.png" alt="Crewmates — There is 1 Imposter Among Us" width="600"/>
</p>

---

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run autonomous agent mode
python main_autonomous.py

# Betting UI (separate server)
python -m http.server 8000
```

| Key | Action |
|-----|--------|
| `TAB` | Cycle camera between agents |
| `1-9` | Jump to specific agent |
| `SPACE` | Restart match |
| `ESC` | Quit |

---

## 🎮 Gameplay Loop

<table>
<tr>
<td width="50%" align="center">

### 🔪 The Kill

<img src="Assets/Images/Alerts/kill1.png" alt="Kill Animation" width="350"/>

Imposters eliminate crewmates when no one's watching. Bodies are discovered by nearby agents.

</td>
<td width="50%" align="center">

### 🚨 Emergency Meeting

<img src="Assets/Images/Alerts/emergency_meeting_red.png" alt="Emergency Meeting" width="350"/>

A body is found! All agents gather to discuss and accuse.

</td>
</tr>
<tr>
<td width="50%" align="center">

### 💬 Discussion Phase

<img src="Assets/Images/Meeting/chat.png" alt="Discussion UI" width="350"/>

Agents speak, accuse, defend, and bluff — all autonomously generated dialogue.

</td>
<td width="50%" align="center">

### 🤫 Role Assignment

<img src="Assets/Images/Meeting/shhhhhhh.png" alt="Shhhhh — Imposter Role" width="350"/>

One agent is secretly the imposter. Can the crew figure it out before it's too late?

</td>
</tr>
</table>

---

## 🏆 Outcomes

<table>
<tr>
<td align="center" width="50%">

### ✅ Crew Wins

<img src="Assets/Images/Alerts/victory.png" alt="Crewmembers Won" width="400"/>

The imposter is caught and ejected!

</td>
<td align="center" width="50%">

### 💀 Imposter Wins

<img src="Assets/Images/Alerts/defeat.png" alt="Imposter Won" width="400"/>

The imposter eliminates enough crewmates to take over.

</td>
</tr>
</table>

<p align="center">
  <img src="Assets/Images/Alerts/eject.png" alt="Ejection" width="300"/>
  <br/><i>The airlock doesn't discriminate...</i>
</p>

---

## 🕹️ In-Game Actions

<p align="center">
  <img src="Assets/Images/UI/kill_icon.png" alt="Kill" height="60"/>&nbsp;&nbsp;&nbsp;
  <img src="Assets/Images/UI/emergency_icon.png" alt="Emergency" height="60"/>&nbsp;&nbsp;&nbsp;
  <img src="Assets/Images/UI/sabotage_icon.png" alt="Sabotage" height="60"/>&nbsp;&nbsp;&nbsp;
  <img src="Assets/Images/UI/light_bulb_icon.png" alt="Lights" height="60"/>&nbsp;&nbsp;&nbsp;
  <img src="Assets/Images/UI/map_button.png" alt="Map" height="60"/>
</p>

<p align="center">
  <sub>Kill • Emergency • Sabotage • Lights • Map</sub>
</p>

---

## 🧠 Agent System

Each AI agent runs an autonomous decision loop every game tick:

```
┌─────────────────────────────────────────────────────────────┐
│                  AGENT DECISION LOOP                        │
│                                                             │
│   Perceive → Decide → Act → Communicate                    │
│                                                             │
│   • MOVE:  Random walk with stuck detection                 │
│   • KILL:  Range check + cooldown (imposter only)           │
│   • SPEAK: Role-aware dialogue generation                   │
│   • VOTE:  Accusation-weighted majority vote                │
│   • REPORT: Detect bodies → trigger meeting                 │
└─────────────────────────────────────────────────────────────┘
```

### Dialogue Engine

Agents generate context-aware dialogue during meetings:

| Template | Example |
|----------|---------|
| 🔴 **Accusation** | *"I saw Green near the body in Electrical!"* |
| 🛡️ **Defense** | *"I was in MedBay doing my tasks, check the logs."* |
| 🤔 **Uncertainty** | *"I'm not sure, but Yellow was acting weird."* |
| 👀 **Observation** | *"Red and Blue were together in Navigation."* |
| 🎭 **Deflection** *(Imposter)* | *"Why is nobody talking about Orange?"* |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    SPECTATOR (Human)                       │
│              Watch match, trade predictions                │
└────────────────────────▲───────────────────────────────────┘
                         │ read-only
┌────────────────────────┴───────────────────────────────────┐
│                   BLOCKCHAIN MODULE                        │
│  blockchain.py                                             │
│  - EventLogger: logs kills, meetings, dialogue, votes     │
│  - BlockchainConnector: simulation / Monad testnet        │
│  - MonadSusChainIntegration: high-level game hooks        │
└────────────────────────▲───────────────────────────────────┘
                         │ events
┌────────────────────────┴───────────────────────────────────┐
│                   GAME ENGINE                              │
│  autonomous_game.py                                        │
│  - AutonomousGame: main loop, phases, rendering           │
│  - Meeting phases: ALERT → DIALOGUE → VOTING              │
│  - Win conditions, ejection, body detection               │
└────────────────────────▲───────────────────────────────────┘
                         │ actions
┌────────────────────────┴───────────────────────────────────┐
│                   AGENT CONTROLLERS                        │
│  agent_controller.py                                       │
│  - AgentController: base class                            │
│  - SimpleAgent: random walk, kill, speak, vote            │
│  - Dialogue templates: accusation, defense, uncertainty   │
└────────────────────────────────────────────────────────────┘
```

---

## ⛓️ On-Chain Integration (Monad Testnet)

All game events are hashed, logged, and settled on-chain.

### Smart Contracts

Located in `monadsus-contracts/src/`:

| Contract | Purpose |
|----------|---------|
| 🗂️ `AgentRegistry.sol` | Track agent names, games played, wins |
| 🎮 `GameRegistry.sol` | Register games with hash, manage lifecycle |
| 📊 `PredictionMarket.sol` | YES/NO betting pools, payout claims |
| ⚖️ `GameResolver.sol` | Batch-resolve markets when game ends |

### Deploy Contracts

```bash
cd monadsus-contracts
forge build
forge script script/Deploy.s.sol --rpc-url <MONAD_RPC> --broadcast
```

---

## 📈 Prediction Markets

When a game starts, these markets are automatically created on-chain:

| Market | Resolution Condition |
|--------|---------------------|
| 🛡️ `Will the Crew win?` | YES if crew ejects the imposter |
| 🔍 `Is {Agent} the Imposter?` | YES if agent is revealed as imposter |
| 💀 `Will {Agent} survive?` | YES if agent is alive at game end |

All markets settle **deterministically** from the final game state hash — no oracles needed.

---

## 📋 Event Log Format

Every game exports a full replay log as JSON:

```json
[
  {"t": 0.0,  "type": "GAME_START",    "agent_id": null,    "data": {}},
  {"t": 15.2, "type": "KILL",          "agent_id": "Green",  "data": {"victim": "Blue"}},
  {"t": 30.5, "type": "MEETING_START", "agent_id": "Red",    "data": {}},
  {"t": 31.0, "type": "SPEAK",         "agent_id": "Red",    "data": {"message": "I think Green is suspicious."}},
  {"t": 32.0, "type": "VOTE",          "agent_id": "Red",    "data": {"target": "Green"}},
  {"t": 35.0, "type": "EJECT",         "agent_id": "Green",  "data": {"was_imposter": true}},
  {"t": 35.1, "type": "GAME_END",      "agent_id": null,     "data": {"winner": "CREW", "imposter": "Green"}}
]
```

---

## 📂 Project Structure

```
monaddotsus/
├── main_autonomous.py          # 🚀 Entry point
├── autonomous_game.py          # 🎮 Game engine (850+ lines)
├── agent_controller.py         # 🤖 Agent interface + SimpleAgent
├── blockchain.py               # ⛓️ On-chain integration
├── betting.html                # 💰 Betting UI (standalone)
├── server.py                   # 🌐 Game server
├── sprites.py                  # 🎨 Player/Bot sprite system
├── settings.py                 # ⚙️ Config & sprite loading
├── game.py                     # 🕹️ Original game (reference)
├── openclaw_agent.py           # 🧠 Advanced agent implementation
├── monadsus-contracts/         # 📜 Solidity contracts (Foundry)
│   └── src/
│       ├── AgentRegistry.sol
│       ├── GameRegistry.sol
│       ├── GameResolver.sol
│       └── PredictionMarket.sol
└── Assets/                     # 🖼️ Sprites, sounds, maps
    ├── Images/
    │   ├── Alerts/             # Victory, defeat, kill, eject screens
    │   ├── Meeting/            # Discussion & voting UI
    │   ├── Player/             # 12 color variants
    │   ├── Items/              # In-game task objects
    │   └── UI/                 # Action icons
    ├── Maps/                   # Game maps
    ├── Sounds/                 # SFX & music
    └── Fonts/                  # Custom typography
```

---

## ✅ Implementation Status

### Phase 1 — Autonomous Agent Gameplay ✅

| Feature | Status |
|---------|--------|
| Agent Controller Interface | ✅ `agent_controller.py` |
| Random Walk Movement | ✅ Stuck detection included |
| Imposter Kill Logic | ✅ Range check, cooldown, body spawn |
| Body Detection → Meeting | ✅ Crew detects corpses |
| Meeting Dialogue System | ✅ Template-based accusations/defenses |
| Voting & Ejection | ✅ Majority vote, ties skip |
| Win Conditions | ✅ Crew wins if imposter ejected, imposter wins if outnumbered |
| Dead Body Sprites | ✅ Proper death rendering |

### Phase 2 — Agent Dialogue ✅

| Feature | Status |
|---------|--------|
| SPEAK action type | ✅ |
| Dialogue templates (Accusation, Defense, Uncertainty, Observation) | ✅ |
| Role-aware dialogue (Imposter deflection) | ✅ |
| Meeting phases: Alert → Dialogue → Voting | ✅ |
| Turn-based speaking (shuffled order) | ✅ |
| Console logging of all dialogue | ✅ |

### Phase 3 — Blockchain Integration ✅

| Feature | Status |
|---------|--------|
| Event logging system | ✅ `blockchain.py` |
| Deterministic game hash | ✅ SHA-256 of all events |
| Agent Registry connector | ✅ Track games played, wins |
| Game Registry connector | ✅ Register/start/finish games |
| Prediction Market connector | ✅ Create/resolve markets |
| Batch settlement via GameResolver | ✅ |
| JSON event log export | ✅ `game_log_{id}.json` |

---

## 🗺️ Roadmap

### Phase 4 — 🧠 LLM-Powered Agents
- Replace `SimpleAgent` with GPT/Claude-powered reasoning
- Memory system for tracking observations across rounds
- Strategic deception, persuasion, and coalition formation

### Phase 5 — 🖥️ Spectator Frontend
- Web UI for watching matches in real-time
- Live event stream with agent POV switching
- Integrated market trading interface

### Phase 6 — 🌐 Live Blockchain Mode
- Deploy contracts to Monad mainnet
- Web3 wallet integration for spectators
- Real prediction market trading with actual stakes

---

## 🔬 Why This Matters

> This is **AI systems research wearing a game skin.**

- 🧪 Study **deception, persuasion, and coalition formation** in LLM agents
- 📊 Aggregate **human belief signals** via prediction markets
- 📈 Generate **measurable agent performance metrics** over time
- 🔁 **Deterministic, reproducible** matches for benchmarking
- ⛓️ **On-chain verifiability** — every game is a tamper-proof record

<p align="center">
  <img src="Assets/Images/menu/back.png" alt="Space Background" width="500"/>
  <br/><sub><i>The void of space holds many secrets... and one imposter.</i></sub>
</p>

---

<p align="center">
  <b>Built for <a href="https://moltiverse.dev">Moltiverse.dev Hackathon</a></b> · MIT License
</p>
