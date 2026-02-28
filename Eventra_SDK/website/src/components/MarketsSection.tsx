import { motion } from "framer-motion";
import { TrendingUp, Clock, CheckCircle, ShieldCheck } from "lucide-react";

const cards = [
    {
        icon: Clock,
        title: "When markets are created",
        content: "Markets are created automatically in response to game events. A GAME_START event triggers match-level markets. Specific in-game events like kills or round ends trigger contextual markets. Periodic intervals can create time-based markets like \"Survive next 30 seconds\".",
    },
    {
        icon: TrendingUp,
        title: "How odds update",
        content: "Odds are recalculated after every game event using the OddsEngine. The engine applies Bayesian updates based on the current game state — agent positions, scores, eliminations, and round progress. Odds shift in real-time as the match unfolds.",
    },
    {
        icon: CheckCircle,
        title: "How settlement works",
        content: "When a market's outcome is determined (e.g. match ends, a player is eliminated), the MarketEngine locks the market. The final game state is hashed deterministically. This hash is submitted to the BNB Chain smart contract, which resolves the market and distributes payouts.",
    },
    {
        icon: ShieldCheck,
        title: "Why there are no oracles",
        content: "Because the match engine is fully deterministic (seeded RNG), the same inputs always produce the same outputs. The game state hash serves as cryptographic proof of the outcome. No external oracle is needed — the game itself is the source of truth.",
    },
];

export default function MarketsSection() {
    return (
        <section id="markets" className="py-24">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <h2 className="text-center font-pixel text-[10px] uppercase tracking-widest text-primary">Prediction Markets Explained</h2>
                <p className="mt-4 mb-14 text-center font-pixel text-lg text-foreground">Markets as state-derivatives, not betting.</p>

                <div className="grid gap-6 md:grid-cols-2">
                    {cards.map((c, i) => (
                        <motion.div
                            key={c.title}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.45 }}
                            className="retro-border bg-card p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center retro-border-sm bg-primary/15 text-primary">
                                    <c.icon size={18} />
                                </div>
                                <h3 className="font-pixel text-[10px] text-foreground">{c.title}</h3>
                            </div>
                            <p className="font-retro text-xl leading-relaxed text-muted-foreground">{c.content}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
