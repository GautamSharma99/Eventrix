import { motion } from "framer-motion";

const code = `import { PredictionArena } from "@eventra/sdk"

const arena = new PredictionArena({
  chainId: 97,
  rpcUrl: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
  marketTemplates: [{ id: "winner", triggerEvent: "GAME_START",
    description: "Match Winner", outcomeResolver: "winner" }]
}, myGameInstance)

arena.adapter.start()  // events flow → markets auto-generate`;

export default function CodeSection() {
  return (
    <section id="quickstart" className="py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center font-pixel text-[10px] uppercase tracking-widest text-primary">Developer Quick Start</h2>
        <p className="mt-4 mb-12 text-center font-pixel text-lg text-foreground">Integrate in under 10 lines.</p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden retro-border glow-border"
        >
          {/* Tab bar */}
          <div className="flex items-center gap-3 border-b-3 bg-secondary/60 px-4 py-3" style={{ borderBottomWidth: '3px', borderColor: 'black' }}>
            <span className="h-3 w-3 retro-border-sm bg-destructive" />
            <span className="h-3 w-3 retro-border-sm bg-accent" />
            <span className="h-3 w-3 retro-border-sm bg-primary" />
            <span className="ml-3 font-pixel text-[8px] text-muted-foreground">game-adapter.ts</span>
          </div>

          <pre className="overflow-x-auto bg-card p-6 text-lg leading-relaxed">
            <code className="font-retro text-foreground">{code}</code>
          </pre>
        </motion.div>

        <div className="mt-6 space-y-2 text-center">
          <p className="font-retro text-xl text-muted-foreground">▸ Once events flow, markets are generated automatically.</p>
          <p className="font-retro text-xl text-muted-foreground">▸ No manual market definitions required.</p>
        </div>
      </div>
    </section>
  );
}
