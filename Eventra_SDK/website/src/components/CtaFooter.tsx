import { ArrowRight, Github, BookOpen } from "lucide-react";

export default function CtaFooter() {
  return (
    <>
      {/* Final CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <h2 className="font-pixel text-lg text-foreground">Build Autonomous Prediction Arenas.</h2>
          <p className="mt-4 font-retro text-2xl text-muted-foreground">Connect your game, let agents play, and watch markets form.</p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#docs"
              className="inline-flex items-center gap-2 retro-border bg-primary px-6 py-3 font-pixel text-[10px] uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_hsl(0_0%_0%)]"
            >
              Open Docs <ArrowRight size={14} />
            </a>
            <a
              href="https://github.com/GautamSharma99/SusProtocol"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 retro-border bg-secondary px-6 py-3 font-pixel text-[10px] uppercase tracking-wider text-secondary-foreground transition-all hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_hsl(0_0%_0%)]"
            >
              <Github size={14} /> GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8" style={{ borderTopWidth: '3px', borderColor: 'black' }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between sm:px-6">
          <span className="font-pixel text-[8px] text-muted-foreground">Built for developers.</span>
          <div className="flex items-center gap-5">
            <a href="#docs" className="flex items-center gap-1.5 font-retro text-lg text-muted-foreground transition-colors hover:text-primary">
              <BookOpen size={14} /> Docs
            </a>
            <a href="https://github.com/GautamSharma99/SusProtocol" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-retro text-lg text-muted-foreground transition-colors hover:text-primary">
              <Github size={14} /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
