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

Eventra is an SDK and runtime that turns any deterministic game into a live prediction arena. Games connect through a lightweight adapter, autonomous agents replace human players, and real-time events drive the creation of decentralized prediction markets that settle on BNB Chain.

**Why does it exist?**

Human esports require coordination, scheduling, and trust. Autonomous agents eliminate all three. When agents play, matches run continuously, outcomes are deterministic, and market settlement becomes cryptographically provable — no oracles, no disputes.

**Who is it for?**

Web2 game developers who want to add a prediction layer to their game without rewriting game logic or learning blockchain. You emit events. Eventra does the rest.

**How does it work?**

Your game emits structured events (kills, rounds, scores) through the Eventra adapter. The Match Engine orchestrates autonomous agents. The Market Engine listens to the event stream and creates prediction markets dynamically. When a match ends, the final game state hash is submitted to BNB Chain for trustless settlement.`,
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

The SDK is organized into five layers, each with a single responsibility:

**1. Adapter Layer** — adapter.ts
Accepts game integration, injects agents as players, captures game state transitions, and emits normalized GameEvent objects. This is the only file a game developer needs to touch.

**2. Agent Layer** — agents/
Contains BaseAgent (abstract interface), RuleAgent (built-in rule-based implementation), and AgentManager (orchestrates agent lifecycle). Agents receive state snapshots via decide(state) and return an AgentAction. No ML required — rule-based agents are sufficient.

**3. Match Layer** — match/
MatchEngine orchestrates the match lifecycle. StateStore maintains deterministic state. EventBus handles pub/sub event routing. All randomness is seeded for verifiability.

**4. Market Layer** — markets/
MarketEngine processes game events and creates/resolves markets. OddsEngine calculates probabilities using Bayesian updates. Templates define market types (Match Winner, First Blood, Over/Under, etc.).

**5. Blockchain Layer** — blockchain/
BnbClient handles wallet and contract interactions. Settlement submits final state hashes and resolves markets on-chain. All settlement is automated — no manual intervention required.`,
    code: `sdk/src/
├── adapter.ts          # Game integration
├── arena.ts            # Main orchestrator
├── agents/
│   ├── baseAgent.ts    # Abstract agent interface
│   ├── ruleAgent.ts    # Built-in rule-based agent
│   └── agentManager.ts # Agent lifecycle
├── match/
│   ├── matchEngine.ts  # Match orchestration
│   ├── stateStore.ts   # Deterministic state
│   └── eventBus.ts     # Event routing
├── markets/
│   ├── marketEngine.ts # Market creation/resolution
│   ├── oddsEngine.ts   # Probability calculation
│   └── templates.ts    # Market type definitions
├── blockchain/
│   ├── bnbClient.ts    # Chain interaction
│   └── settlement.ts   # On-chain resolution
└── types.ts            # Shared type definitions`,
  },
  agents: {
    title: "Agents",
    content: `**What are agents?**

Agents are autonomous players that replace humans in the game. They receive a snapshot of the current game state and return an action. This happens every tick of the match engine.

**BaseAgent Interface**

Every agent implements the BaseAgent abstract class. The only required method is decide(state: GameState): AgentAction. The agent receives the full game state and must return exactly one action.

**RuleAgent**

The SDK ships with a built-in RuleAgent that uses configurable rule sets. Rules are priority-ordered conditions that map game state patterns to actions. This is sufficient for most games — no ML training needed.

**AgentManager**

The AgentManager maintains the roster of agents for a match. It calls decide() on each agent every tick, collects their actions, and injects them into the match engine. It also handles agent registration, removal, and state broadcasting.

**Why autonomous agents?**

Human players create scheduling problems, trust issues, and downtime. Autonomous agents play 24/7, produce deterministic outcomes, and eliminate coordination overhead. This makes continuous market generation possible.`,
    code: `import { BaseAgent, GameState, AgentAction } from "@eventra/sdk"

class MyAgent extends BaseAgent {
  decide(state: GameState): AgentAction {
    // Check if an enemy is nearby
    if (state.nearestEnemy && state.nearestEnemy.distance < 50) {
      return { type: "ATTACK", target: state.nearestEnemy.id }
    }

    // Otherwise, move toward the objective
    return { type: "MOVE", direction: state.objectiveDirection }
  }
}`,
  },
  markets: {
    title: "Markets",
    content: `**What are prediction markets?**

In Eventra, prediction markets are state-derivatives — financial instruments that derive their value from the state of a running game. They are not traditional betting. They are structured predictions with deterministic resolution.

**Market Types**

The SDK includes built-in market templates:

- **Match Winner** — Who will win the match? Created on GAME_START.
- **First Blood** — Who gets the first kill? Created on GAME_START, resolved on first KILL event.
- **Over/Under** — Will total kills exceed a threshold? Created periodically during the match.
- **Next Eliminated** — Which agent will be eliminated next? Created after each elimination event.
- **Survive N Seconds** — Will a specific agent survive the next 30 seconds? Created on intervals.

**How odds work**

The OddsEngine recalculates probabilities after every game event. It uses Bayesian inference: prior odds are updated based on new evidence from the game state. As the match progresses, odds converge toward the true outcome.

**Custom markets**

You can define custom market templates by specifying the trigger event, the resolution condition, and the outcome set. The MarketEngine will automatically instantiate and resolve them.`,
    code: `// Built-in market template example
{
  id: "match_winner",
  name: "Match Winner",
  trigger: "GAME_START",
  outcomes: ["team_a", "team_b"],
  resolution: "GAME_END",
  resolveFrom: (state) => state.winner
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

Eventra uses three contracts on BNB Chain:

- **ArenaRegistry.sol** — Registers matches and stores metadata (agent roster, seed, config hash).
- **PredictionMarket.sol** — Manages betting pools, holds funds in escrow, and distributes winnings on resolution.
- **MatchSettlement.sol** — Accepts the final game state hash, verifies it against the registered match, and triggers market resolution.

**Settlement flow**

1. Match begins → ArenaRegistry records the match with its config hash.
2. Match runs → PredictionMarket accepts bets on active markets.
3. Match ends → Match Engine produces a final state hash.
4. Settlement → MatchSettlement receives the hash, verifies it, and calls PredictionMarket.resolveMarket() for each market.
5. Payouts → Winners claim their funds directly from the contract.

**Why no oracles?**

Because the game engine is deterministic. The same seed + same inputs = same outputs. The state hash is sufficient proof. No external data feed is needed.`,
  },
  demo: {
    title: "Demo Walkthrough",
    content: `**Running the demo**

The demo game is a simplified autonomous agent match that demonstrates the full Eventra pipeline: game connection, agent play, event streaming, market creation, and settlement.

**What happens step by step:**

1. The demo initializes the PredictionArena with a BNB testnet configuration.
2. Market templates are registered (Match Winner, First Blood, Survivor).
3. Autonomous agents are created and registered with the AgentManager.
4. The Match Engine starts the game loop — agents make decisions every tick.
5. Events (kills, rounds, scores) flow through the EventBus.
6. The Market Engine creates and updates markets in real-time based on events.
7. When the match concludes, the final state hash is generated.
8. Markets are resolved and settlement is submitted to BNB Chain.

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
