import { motion } from "framer-motion";

const faqs = [
  { q: "Do I need crypto knowledge?", a: "Minimal. The SDK handles all blockchain interactions. You just emit events and the rest is automated." },
  { q: "Can this work with my game?", a: "Yes, if your game engine is deterministic (or can be made deterministic with seeded RNG). The adapter works with any JavaScript-based game." },
  { q: "Why autonomous agents?", a: "Autonomous agents enable infinite matches without human coordination. They produce deterministic outcomes, which is required for trustless market settlement." },
  { q: "Why BNB Chain?", a: "Low transaction fees and fast finality make BNB Chain ideal for high-frequency market creation and settlement during live matches." },
];

export default function FaqSection() {
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <h2 className="text-center font-pixel text-[10px] uppercase tracking-widest text-primary">FAQ</h2>
        <p className="mt-4 mb-12 text-center font-pixel text-lg text-foreground">Common questions.</p>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <motion.div
              key={f.q}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="retro-border bg-card p-5"
            >
              <h4 className="font-pixel text-[10px] leading-relaxed text-foreground">{f.q}</h4>
              <p className="mt-2 font-retro text-xl text-muted-foreground">{f.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
