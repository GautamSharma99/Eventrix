
# Core Design Shift — Eventra SDK

## Key Insight

**Games must not manage agents, networking, or prediction markets.**

Games are responsible only for:

* Validating rules
* Maintaining authoritative game state
* Applying actions

**Eventra SDK owns everything else.**

This separation is fundamental to Eventra’s architecture and is required for deterministic gameplay, verifiable outcomes, and trustless market settlement.

---

## Design Principle

> **Games emit state. Eventra injects behavior.**

The SDK acts as an orchestration layer that:

* Injects autonomous agent behavior
* Streams game activity to the Eventrix platform
* Generates and resolves prediction markets from game logs

Games remain simple, deterministic engines.

---

## Responsibilities by Layer

### Game Engine (Web2 or Local)

The game **must not**:

* Decide agent behavior
* Handle WebSocket connections
* Create or manage prediction markets

The game **must**:

* Maintain authoritative state
* Enforce game rules
* Validate actions
* Emit observations
* Apply actions returned by the SDK

---

### Eventra SDK (Control Layer)

The SDK is the **single source of behavioral truth**.

It is responsible for:

1. **Agentic behavior injection**
2. **Game-to-platform connectivity**
3. **Prediction market lifecycle management**

---

## 1. Agentic Behavior Injection (Rule-Based, Non-AI)

Eventra injects autonomous agents using **classical programming techniques**, not AI or machine learning.

### Supported Techniques

* Rule-based heuristics
* Finite state machines
* Probabilistic decision trees
* Deterministic randomization (seeded)

No learning, no neural networks, no external inference.

---

### Agent Contract

Each agent follows a strict input/output contract:

**Input (Observation):**

* Current game state snapshot
* Legal actions available
* Phase or turn context

**Output (Action):**

* One valid action allowed by the game rules

The SDK guarantees that:

* All actions are legal
* Behavior is reproducible given the same seed
* No game logic is duplicated

---

### Chess Example (Rule-Based Agents)

In a chess integration:

* The game emits board state and legal moves
* Eventra selects a move using deterministic randomness
* The game validates and applies the move

**The game never chooses moves.**

This mirrors the same philosophy used for autonomous agents in other games (e.g., social deduction or arena games), scaled down to turn-based logic.

---

## 2. Game-to-Platform Connectivity (WebSockets)

Eventra SDK owns all networking.

### Python Game Integration

* Games connect to Eventra via the SDK
* SDK establishes and maintains WebSocket connections
* Game engines never open sockets directly

**Responsibilities handled by the SDK:**

* Connection lifecycle
* Reconnection logic
* Event batching
* Stream normalization

Games simply emit events.

---

### Event Stream Contract

All game activity is streamed as structured events:

* GAME_STARTED
* TURN_STARTED
* MOVE_APPLIED
* CAPTURE_OCCURRED
* GAME_ENDED

These logs are:

* Deterministic
* Replayable
* Verifiable

---

### TypeScript Client & Eventrix Website

* TypeScript clients subscribe to live streams
* Eventrix renders gameplay and market activity
* Streaming is read-only and non-authoritative

The platform **never influences gameplay**.

---

## 3. Prediction Market Generation (Log-Driven)

Prediction markets are created and resolved **entirely from game logs**.

### Market Lifecycle

1. SDK detects a market trigger from emitted events
2. Market is created automatically
3. Odds update as the game progresses
4. Final outcome resolves the market

No manual market configuration is required at runtime.

---

### Chess Market Examples

* Who will win the match?
* Will the game end in checkmate or draw?
* Which color will capture the first piece?
* Will the game last more than N moves?

Markets are derived, not scripted.

---

## Determinism & Verifiability

This architecture guarantees:

* **Deterministic behavior**
  Same seed + same inputs → same outcomes

* **Replayability**
  Entire matches can be reconstructed from logs

* **Auditability**
  Every action traces back to a rule

* **Market integrity**
  No hidden logic, no operator discretion

---

## Explicit Non-Goals

Eventra SDK intentionally does **not**:

* Perform learning or adaptation
* Optimize agent strategies
* Use AI models for decision-making
* Modify game rules

The SDK is a behavioral orchestrator, not an intelligence engine.

---

## Summary

Eventra introduces a strict separation of concerns:

| Component         | Responsibility                    |
| ----------------- | --------------------------------- |
| Game              | State, rules, validation          |
| Eventra SDK       | Agents, networking, markets       |
| Eventrix Platform | Streaming, visualization, betting |

This design enables:

* Plug-and-play game integration
* Autonomous gameplay without AI
* Trustless, verifiable prediction markets

**Games emit state. Eventra controls behavior.**

---

