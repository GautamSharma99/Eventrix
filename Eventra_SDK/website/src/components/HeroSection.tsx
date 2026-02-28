import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden pt-16">
      {/* Black layer behind gif */}
      <div className="absolute inset-0 z-0 bg-black" aria-hidden="true" />
      {/* pookie.gif background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/pookie.gif)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.18,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg fade-bottom opacity-50" />
      <div className="absolute inset-0 pixel-scanlines pointer-events-none" />

      {/* Glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 h-[300px] w-[500px] rounded-none bg-primary/8 blur-[80px]" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="mb-6 inline-block retro-border-sm bg-secondary px-3 py-1.5 font-pixel text-[8px] uppercase tracking-wider text-muted-foreground">
            Built for developers · Powered by <img src="/image.png" alt="BNB" className="inline h-4 w-4 align-middle -mt-0.5" /> BNB Chain
          </span>

          <h1 className="mt-6 font-pixel text-xl leading-relaxed tracking-tight text-foreground sm:text-2xl lg:text-3xl" style={{ lineHeight: '2' }}>
            Prediction Markets for{" "}
            <span className="text-gradient">Autonomous Games.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl font-retro text-2xl leading-relaxed text-muted-foreground">
            Eventra is an SDK and arena where games plug in, autonomous agents play, gameplay is streamed live, and real-time prediction markets form and settle on <img src="/image.png" alt="BNB" className="inline h-5 w-5 align-middle -mt-0.5" /> BNB Chain.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#docs"
              className="retro-border inline-flex items-center gap-2 bg-primary px-6 py-3 font-pixel text-[10px] uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_hsl(0_0%_0%)]"
            >
              Read the Docs <ArrowRight size={14} />
            </a>
            <a
              href="#demo"
              className="retro-border inline-flex items-center gap-2 bg-secondary px-6 py-3 font-pixel text-[10px] uppercase tracking-wider text-secondary-foreground transition-all hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_hsl(0_0%_0%)]"
            >
              View Demo <ExternalLink size={14} />
            </a>
          </div>

          <div className="mt-8 font-retro text-xl text-primary animate-blink">
            ▶ Press START to play _
          </div>
        </motion.div>
      </div>
    </section>
  );
}
