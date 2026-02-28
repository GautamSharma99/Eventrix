
# Core Design Shift — Eventra SDK

## Key Insight

**Games must not manage agents, networking, or prediction markets.**

Games are responsible only for:

* Validating rules
* Maintaining authoritative game state
* Applying actions

**Eventra SDK owns everything else.**

This separation is fundamental to Eventra's architecture and is required for deterministic gameplay, verifiable outcomes, and trustless market settlement.

---

## Design Principle

> **Games emit state. Eventra injects behavior.**

The SDK acts as an orchestration layer that:

* Injects autonomous agent behavior
* Streams game activity to the Eventrix platform
* Generates and resolves prediction markets from game logs

Games remain simple, deterministic engines.

---

> You are a senior developer-experience designer and frontend engineer.
>
> Your task is to **redesign and implement the Eventra SDK documentation website** as a **single-page application**.
>
> The SDK is called **Eventrix Prediction Arena SDK** (short name: **Eventra**).
>
> Eventra lets developers plug in games, inject autonomous agents, stream gameplay live, and generate real-time decentralized prediction markets that settle on BNB Chain.
>
> ---
>
> ## CORE GOALS
>
> * Make the system **feel powerful but not complicated**
> * Assume the reader is a **Web2 game developer**
> * Explain *what happens*, *why it exists*, and *how to integrate* — in that order
> * No crypto hype, no buzzwords
> * Clear mental models over exhaustive detail
>
> ---
>
> ## HARD CONSTRAINTS
>
> * **Single Page Application**
> * Scroll-based navigation
> * Embedded documentation (GitBook-style, but inline)
> * No multi-page routing
> * No popups or modals for core docs
> * Clean, modern, infra-style UI (Vercel / Stripe / GitBook vibes)
>
> ---
>
> ## PAGE STRUCTURE (STRICT ORDER)
>
> ### 1. HERO
>
> Headline:
> **"Prediction Markets for Autonomous Games."**
>
> Subheadline:
> "Eventra is an SDK and arena where games plug in, autonomous agents play, gameplay is streamed live, and real-time prediction markets form and settle on BNB Chain."
>
> CTAs:
>
> * Primary: **Read the Docs**
> * Secondary: **View Demo**
>
> Visual:
>
> * Subtle grid / gradient
> * No characters, no mascots
>
> ---
>
> ### 2. WHAT EVENTRA IS (MENTAL MODEL)
>
> Explain in **exactly 4 steps**, visually:
>
> 1. Games connect via SDK
> 2. Agents play the game autonomously
> 3. Events stream live
> 4. Markets form and settle on-chain
>
> Each step gets **one sentence only**.
>
> ---
>
> ### 3. WHY EVENTRA EXISTS
>
> This section explains *why this is new*.
>
> Bullets only:
>
> * Human esports don't scale
> * Autonomous agents create infinite matches
> * Markets need determinism, not trust
> * Web2 streaming can't prove fairness
>
> Close with:
> **"Eventra turns deterministic game engines into verifiable financial arenas."**
>
> ---
>
> ### 4. SYSTEM ARCHITECTURE (SIMPLIFIED)
>
> Show a **clean horizontal diagram**:
>
> ```
> Game → Adapter → Agents → Match Engine
>                ↓
>         Event Stream → Markets → BNB Chain
> ```
>
> Add short captions under each block.
>
> Do NOT show file trees here.
>
> ---
>
> ### 5. DEVELOPER QUICK START
>
> This is the **most important section**.
>
> Show only:
>
> * Install
> * Initialize SDK
> * Emit one event
>
> Code example must be **under 10 lines**.
>
> Add explanation text below:
> "Once events flow, markets are generated automatically."
>
> ---
>
> ### 6. EMBEDDED DOCS (GITBOOK STYLE)
>
> This section behaves like a documentation reader **inside the page**.
>
> #### Layout:
>
> * Left: fixed sidebar
> * Right: scrollable content
>
> #### Sidebar Sections:
>
> * Introduction
> * Core Concepts
> * SDK Architecture
> * Agents
> * Markets
> * Blockchain Settlement
> * Demo Walkthrough
>
> #### Writing Rules:
>
> * Short paragraphs
> * No walls of text
> * Every concept answers: *What*, *Why*, *How*
>
> Treat this as **calm technical writing**, not marketing.
>
> ---
>
> ### 7. PREDICTION MARKETS EXPLAINED
>
> Explain markets as **state-derivatives**, not betting.
>
> Cover:
>
> * When markets are created
> * How odds update
> * How settlement works
> * Why there are no oracles
>
> Use diagrams or step cards.
>
> ---
>
> ### 8. DEMO FLOW
>
> Show a vertical timeline:
>
> * Match starts
> * Agents act
> * Events emitted
> * Markets open
> * Match ends
> * Hash settles markets
>
> Emphasize **determinism** repeatedly.
>
> ---
>
> ### 9. FAQ (VERY SHORT)
>
> Include only:
>
> * "Do I need crypto knowledge?" → Minimal
> * "Can this work with my game?" → Yes, if deterministic
> * "Why autonomous agents?" → Scale + fairness
> * "Why BNB Chain?" → Fees + finality
>
> ---
>
> ### 10. FINAL CTA
>
> Headline:
> **"Build Autonomous Prediction Arenas."**
>
> Buttons:
>
> * Open Docs
> * GitHub
>
> Footer:
>
> * No socials
> * No newsletter
> * Just links
>
> ---
>
> ## VISUAL DESIGN RULES
>
> * Dark background
> * Neutral greys + one accent color
> * Inter / Geist font
> * Rounded cards
> * Thin borders
> * Subtle motion only on scroll
>
> ---
>
> ## TONE
>
> * Confident
> * Technical
> * Calm
> * No hype
> * No gambling language
>
> ---
>
> ## FINAL INSTRUCTION
>
> This should feel like **infrastructure documentation**, not a crypto landing page.
>
> Prioritize clarity over completeness.
> The goal is instant understanding.

---

## ⚠️ Blunt feedback (important)

Your narrative is **strong**, but without this docs cleanup:

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

* Devs will feel intimidated
* Judges will think it's overengineered
* The real innovation (deterministic markets) gets buried
