import { useState } from "react";
import { motion } from "framer-motion";
import { Book, Layers, Cpu, Bot, TrendingUp, Link2, Play } from "lucide-react";

const navItems = [
  { id: "intro", label: "Introduction", icon: Book },
  { id: "concepts", label: "Core Concepts", icon: Layers },
  { id: "architecture", label: "SDK Architecture", icon: Cpu },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "markets", label: "Markets", icon: TrendingUp },
  { id: "blockchain", label: "Blockchain Settlement", icon: Link2 },
  { id: "demo", label: "Demo Walkthrough", icon: Play },
];

const docs: Record<string, { title: string; content: string; code?: string }> = {
  intro: {
    title: "Introduction",
    content: `**What is Eventra?**

Eventra is an SDK and orchestration layer that turns any deterministic game into a live prediction arena. Games remain simple, deterministic engines — they maintain state, enforce rules, and validate actions. Eventra owns everything else: autonomous agent behavior, game-to-platform connectivity, and prediction market lifecycle management.

**Design principle: Games emit state. Eventra injects behavior.**

Games connect through a lightweight ArenaAdapter. The SDK injects autonomous agents (rule-based, not AI), streams gameplay to the Eventrix platform, and generates prediction markets from game logs — all settling on BNB Chain.

**Who is it for?**

Web2 game developers who want to add a prediction layer to their game without rewriting game logic or learning blockchain. You emit events. Eventra does the rest.

**How does it work?**

Your game emits structured events (kills, rounds, scores) through the ArenaAdapter. The Match Engine orchestrates autonomous agents. The Market Engine listens to the event stream and creates prediction markets dynamically. When a match ends, the final game state hash is submitted to BNB Chain for trustless settlement.`,
  },
  concepts: {
    title: "Core Concepts",
    content: `**Event Emitter**

Your game emits structured events through the ArenaAdapter. Events describe what happened: a player was killed, a round ended, a score changed. Each event has a type, payload, and timestamp.

**Deterministic Match Engine**

The Match Engine maintains the authoritative game state. All randomness is seeded, meaning the same inputs always produce the same outputs. This is critical — market trust depends on determinism. The engine runs a tick loop: INIT → START → TICK → END → FINALIZE.

**Market Engine**

The Market Engine listens to the event stream and decides which prediction markets to create or update. Markets can be triggered on game start, on specific events (like a kill), or on periodic intervals. The engine uses the OddsEngine to calculate and update probabilities in real-time.

**Settlement Layer**

When a market's outcome is determined, Eventra locks the market and generates a deterministic hash of the final game state. This hash is submitted to the PredictionMarket smart contract on BNB Chain, which resolves the market and distributes payouts automatically.

**State Store**

The StateStore maintains a complete, serializable snapshot of the match at all times. This enables replay verification — anyone can re-run the match with the same seed and verify the outcome matches the on-chain hash.`,
  },
  architecture: {
    title: "SDK Architecture",
    content: `**Overview**

The SDK is organized into six layers, each with a single responsibility:

**1. Adapter Layer** — adapter.ts
Accepts a game instance, injects agents as players, captures game state transitions, and emits normalized GameEvent objects. This is the only file a game developer needs to touch.

**2. Agent Layer** — agents/
Contains BaseAgent (abstract interface), RuleAgent (built-in rule-based implementation), and AgentManager (orchestrates agent lifecycle). Agents receive state snapshots via decide(state) and return an AgentAction { agentId, type, data }. No ML required — rule-based agents with deterministic randomization are sufficient.

**3. Match Layer** — match/
MatchEngine orchestrates the match lifecycle. StateStore maintains deterministic state. EventBus handles pub/sub event routing. All randomness is seeded for verifiability.

**4. Market Layer** — markets/
MarketEngine processes game events and creates/resolves markets. OddsEngine calculates probabilities using Bayesian updates. Templates define market types (Match Winner, First Blood, Over/Under, etc.).

**5. Streaming Layer** — streaming/
Broadcaster binds to the MatchEngine and MarketEngine, forwarding all events and market updates to connected clients via StreamServer (WebSocket). The Eventrix platform subscribes here for live visualization.

**6. Blockchain Layer** — blockchain/
BNBClient handles wallet and contract interactions. SettlementEngine deploys and resolves markets on-chain. All settlement is automated — no manual intervention required.`,
    code: `sdk/src/
├── adapter.ts          # Game integration point
├── arena.ts            # PredictionArena orchestrator
├── index.ts            # Public API exports
├── types.ts            # Shared type definitions
├── agents/
│   ├── baseAgent.ts    # Abstract agent interface
│   ├── ruleAgent.ts    # Built-in rule-based agent
│   └── agentManager.ts # Agent lifecycle
├── match/
│   ├── matchEngine.ts  # Match orchestration
│   ├── stateStore.ts   # Deterministic state
│   └── eventBus.ts     # Event pub/sub routing
├── markets/
│   ├── marketEngine.ts # Market creation/resolution
│   ├── oddsEngine.ts   # Bayesian probability engine
│   └── templates.ts    # Market type definitions
├── streaming/
│   ├── broadcaster.ts  # Event/market fan-out
│   └── streamServer.ts # WebSocket server
└── blockchain/
    ├── bnbClient.ts    # Wallet + contract calls
    └── settlement.ts   # On-chain market resolution`,
  },
  agents: {
    title: "Agents",
    content: `**What are agents?**

Agents are autonomous players that replace humans in the game. They receive a snapshot of the current game state and return an action. This happens every tick of the match engine. Agents use classical programming techniques — rule-based heuristics, finite state machines, and deterministic randomization. No neural networks or ML.

**BaseAgent Interface**

Every agent extends the BaseAgent abstract class. The only required method is decide(state: GameState): AgentAction. The agent receives the full game state (tick, agents, phase, seed, metadata) and must return exactly one action with { agentId, type, data }.

**RuleAgent**

The SDK ships with a built-in RuleAgent that uses configurable rule sets. Rules are priority-ordered conditions that map game state patterns to actions. This is sufficient for most games — no ML training needed.

**AgentManager**

The AgentManager maintains the roster of agents for a match. It calls decide() on each agent every tick, collects their actions, and injects them into the match engine. It also handles agent registration, removal, and state broadcasting.

**Why autonomous agents?**

Human players create scheduling problems, trust issues, and downtime. Autonomous agents play 24/7, produce deterministic outcomes (same seed + same inputs = same outputs), and eliminate coordination overhead. This makes continuous market generation possible.`,
    code: `import { BaseAgent, GameState, AgentAction } from "@eventra/sdk"

class MyAgent extends BaseAgent {
  constructor() { super("agent-1", "crew") }

  decide(state: GameState): AgentAction {
    const enemy = state.agents.find(a => a.alive && a.id !== this.id)
    if (enemy && enemy.position) {
      return { agentId: this.id, type: "ATTACK", data: enemy.id }
    }
    return { agentId: this.id, type: "MOVE", data: { x: 1, y: 0 } }
  }
}`,
  },
  markets: {
    title: "Markets",
    content: `**What are prediction markets?**

In Eventra, prediction markets are state-derivatives — financial instruments that derive their value from the state of a running game. They are not traditional betting. They are structured predictions with deterministic resolution. Markets are derived from game logs, not scripted manually.

**Market Templates**

The SDK uses MarketTemplate objects to define what markets to create. Each template specifies:

- **id** — Unique identifier for the template.
- **description** — Human-readable market name.
- **triggerEvent** — Which game event triggers market creation (e.g. "GAME_START").
- **outcomeResolver** — How the outcome is determined from game state.
- **marketType** — BINARY or MULTI_OUTCOME.

**How odds work**

The OddsEngine recalculates probabilities after every game event. It uses Bayesian inference: prior odds are updated based on new evidence from the game state. As the match progresses, odds converge toward the true outcome.

**Custom markets**

You define custom market templates in your SDKConfig when creating the PredictionArena. The MarketEngine will automatically instantiate and resolve them as events flow.`,
    code: `// MarketTemplate — passed in SDKConfig.marketTemplates
{
  id: "match_winner",
  description: "Who will win the match?",
  triggerEvent: "GAME_START",
  outcomeResolver: "winner",
  marketType: "BINARY"
}`,
  },
  blockchain: {
    title: "Blockchain Settlement",
    content: `**Why on-chain?**

On-chain settlement provides three guarantees that off-chain systems cannot:

1. **Verifiability** — Anyone can verify the market outcome by checking the on-chain hash against a replayed match.
2. **Trustlessness** — No central authority decides outcomes. The smart contract resolves markets based on submitted hashes.
3. **Immutability** — Once settled, outcomes cannot be changed or disputed.

**Smart Contracts**

Eventra uses a PredictionMarket contract on BNB Chain that handles market creation, escrow, and resolution. The SDK interacts with it through two components:

- **BNBClient** — Handles wallet creation, RPC connectivity, and raw contract calls. Configured via SDKConfig (chainId, rpcUrl, contractAddress).
- **SettlementEngine** — Deploys markets on-chain and resolves them when outcomes are determined. Uses BNBClient internally.

No API keys are required. The SDK connects directly to the BNB Chain RPC endpoint.

**Settlement flow**

1. Match begins → Markets are created on-chain via SettlementEngine.deployMarkets().
2. Match runs → PredictionMarket contract accepts bets on active markets.
3. Match ends → MarketEngine resolves market outcomes from game state.
4. Settlement → SettlementEngine.resolveMarkets() submits outcomes on-chain.
5. Payouts → Winners claim their funds directly from the contract.

**Why no oracles?**

Because the game engine is deterministic. The same seed + same inputs = same outputs. The state hash is sufficient proof. No external data feed is needed.`,
  },
  demo: {
    title: "Demo Walkthrough",
    content: `**Running the demo**

The demo game is a simplified autonomous agent match that demonstrates the full Eventra pipeline: game connection, agent play, event streaming, market creation, and settlement.

**What happens step by step:**

1. A PredictionArena is created with SDKConfig (chainId, rpcUrl, marketTemplates) and a game instance.
2. The ArenaAdapter connects the game to the SDK.
3. Autonomous agents are registered via arena.adapter.registerAgent().
4. arena.adapter.start() kicks off the match — agents make decisions every tick via decide(state).
5. Events (kills, rounds, scores) flow through the EventBus to the MarketEngine.
6. The MarketEngine creates and updates markets in real-time based on events.
7. The Broadcaster streams all events to connected clients via WebSocket.
8. When the match concludes, the SettlementEngine resolves markets on BNB Chain.

**Determinism is key**

Every demo run with the same seed produces the exact same outcome. This is what makes the system trustworthy — you can replay any match and verify the result independently.`,
    code: `# Clone and run the demo
git clone https://github.com/GautamSharma99/SusProtocol
cd Eventra_SDK/demo-game
npm install
npm start`,
  },
};

export default function DocsSection() {
  const [active, setActive] = useState("intro");
  const doc = docs[active];

  return (
    <section id="docs" className="py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center font-pixel text-[10px] uppercase tracking-widest text-primary">Documentation</h2>
        <p className="mt-4 mb-12 text-center font-pixel text-lg text-foreground">Everything you need to get started.</p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden retro-border bg-card"
        >
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="md:w-56 md:border-r-0" style={{ borderRightWidth: '3px', borderColor: 'black' }}>
              <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActive(item.id)}
                    className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-left transition-colors ${active === item.id
                      ? "bg-primary/15 text-primary font-pixel text-[9px]"
                      : "font-retro text-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                  >
                    <item.icon size={15} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 md:p-8">
              <h3 className="font-pixel text-sm text-foreground">{doc.title}</h3>
              <div className="mt-4 space-y-3 font-retro text-xl leading-relaxed text-secondary-foreground whitespace-pre-line">
                {doc.content.split("\n\n").map((para, i) => (
                  <p key={i} dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>').replace(/^- (.*)$/gm, '• $1') }} />
                ))}
              </div>
              {doc.code && (
                <pre className="mt-6 overflow-x-auto retro-border-sm bg-background p-4">
                  <code className="font-retro text-lg text-foreground">{doc.code}</code>
                </pre>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
