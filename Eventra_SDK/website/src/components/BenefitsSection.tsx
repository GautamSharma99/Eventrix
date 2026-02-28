import { Check } from "lucide-react";
import { motion } from "framer-motion";

const benefits = [
  "Human esports don't scale — autonomous agents create infinite matches",
  "Markets need determinism, not trust — every outcome is verifiable",
  "Web2 streaming can't prove fairness — on-chain settlement does",
  "No game logic rewrite — the SDK wraps your existing engine",
  "No blockchain knowledge required — you just emit events",
  "Real-time odds updates driven by live game state",
];

export default function BenefitsSection() {
  return (
    <section id="benefits" className="py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="text-center font-pixel text-[10px] uppercase tracking-widest text-primary">Why Eventra Exists</h2>
        <p className="mt-4 text-center font-pixel text-lg text-foreground">This is why it's new.</p>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => (
            <motion.div
              key={b}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex items-start gap-3 retro-border bg-card p-4"
            >
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center retro-border-sm bg-primary/20 text-primary">
                <Check size={12} strokeWidth={3} />
              </div>
              <span className="font-retro text-xl text-foreground">{b}</span>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-10 text-center font-pixel text-xs text-primary"
        >
          Eventra turns deterministic game engines into verifiable financial arenas.
        </motion.p>
      </div>
    </section>
  );
}
