import { Gamepad2, Bot, Radio, Link2 } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Gamepad2,
    title: "Games connect via SDK",
    desc: "Any game plugs into the Eventra adapter with a few lines of code.",
  },
  {
    icon: Bot,
    title: "Agents play autonomously",
    desc: "Rule-based autonomous agents replace human players entirely.",
  },
  {
    icon: Radio,
    title: "Events stream live",
    desc: "Every action, kill, and round result is broadcast in real-time.",
  },
  {
    icon: Link2,
    title: "Markets form & settle on-chain",
    desc: "Prediction markets are created dynamically and settle on BNB Chain.",
  },
];

export default function WhatSection() {
  return (
    <section id="how" className="py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center font-pixel text-[10px] uppercase tracking-widest text-primary">What Eventra Is</h2>
        <p className="mt-4 text-center font-pixel text-lg text-foreground">Four steps. Zero complexity.</p>

        <div className="mt-16 grid gap-8 md:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="group retro-border bg-card p-6 text-center transition-all hover:glow-border"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center retro-border-sm bg-primary/15 text-primary">
                <s.icon size={24} />
              </div>
              <h3 className="font-pixel text-xs text-foreground">{s.title}</h3>
              <p className="mt-3 font-retro text-xl text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
