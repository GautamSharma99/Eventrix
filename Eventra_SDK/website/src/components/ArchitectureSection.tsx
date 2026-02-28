import { motion } from "framer-motion";

const blocks = [
    { label: "Game", caption: "Your game engine" },
    { label: "Adapter", caption: "SDK integration layer" },
    { label: "Agents", caption: "Autonomous players" },
    { label: "Match Engine", caption: "Deterministic state" },
];

const bottomBlocks = [
    { label: "Event Stream", caption: "Real-time broadcast" },
    { label: "Markets", caption: "Dynamic odds" },
    { label: "BNB Chain", caption: "On-chain settlement" },
];

export default function ArchitectureSection() {
    return (
        <section id="architecture" className="py-24">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <h2 className="text-center font-pixel text-[10px] uppercase tracking-widest text-primary">System Architecture</h2>
                <p className="mt-4 mb-14 text-center font-pixel text-lg text-foreground">How the pieces connect.</p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="retro-border bg-card p-8"
                >
                    {/* Top row: Game → Adapter → Agents → Match Engine */}
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-0">
                        {blocks.map((b, i) => (
                            <div key={b.label} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className="retro-border-sm bg-primary/15 px-4 py-3 text-center min-w-[120px]">
                                        <span className="font-pixel text-[9px] text-foreground">{b.label}</span>
                                    </div>
                                    <span className="mt-2 font-retro text-lg text-muted-foreground">{b.caption}</span>
                                </div>
                                {i < blocks.length - 1 && (
                                    <span className="hidden sm:block mx-3 font-pixel text-primary text-lg">→</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Arrow down */}
                    <div className="flex justify-center my-6">
                        <span className="font-pixel text-primary text-2xl">↓</span>
                    </div>

                    {/* Bottom row: Event Stream → Markets → BNB Chain */}
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-0">
                        {bottomBlocks.map((b, i) => (
                            <div key={b.label} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className="retro-border-sm bg-primary/15 px-4 py-3 text-center min-w-[120px]">
                                        <span className="font-pixel text-[9px] text-foreground">{b.label}</span>
                                    </div>
                                    <span className="mt-2 font-retro text-lg text-muted-foreground">{b.caption}</span>
                                </div>
                                {i < bottomBlocks.length - 1 && (
                                    <span className="hidden sm:block mx-3 font-pixel text-primary text-lg">→</span>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
