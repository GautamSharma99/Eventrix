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
> **“Prediction Markets for Autonomous Games.”**
>
> Subheadline:
> “Eventra is an SDK and arena where games plug in, autonomous agents play, gameplay is streamed live, and real-time prediction markets form and settle on BNB Chain.”
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
> * Human esports don’t scale
> * Autonomous agents create infinite matches
> * Markets need determinism, not trust
> * Web2 streaming can’t prove fairness
>
> Close with:
> **“Eventra turns deterministic game engines into verifiable financial arenas.”**
>
> ---
>
> ### 4. SYSTEM ARCHITECTURE (SIMPLIFIED)
>
> Show a **clean horizontal diagram**:
>
> ```
> Game → Adapter → Agents → Match Engine
>               ↓
>        Event Stream → Markets → BNB Chain
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
> “Once events flow, markets are generated automatically.”
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
> * “Do I need crypto knowledge?” → Minimal
> * “Can this work with my game?” → Yes, if deterministic
> * “Why autonomous agents?” → Scale + fairness
> * “Why BNB Chain?” → Fees + finality
>
> ---
>
> ### 10. FINAL CTA
>
> Headline:
> **“Build Autonomous Prediction Arenas.”**
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

* Devs will feel intimidated
* Judges will think it’s overengineered
* The real innovation (deterministic markets) gets buried


