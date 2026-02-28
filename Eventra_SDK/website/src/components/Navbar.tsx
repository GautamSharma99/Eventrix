import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { label: "How it Works", href: "#how" },
  { label: "Architecture", href: "#architecture" },
  { label: "Quick Start", href: "#quickstart" },
  { label: "Docs", href: "#docs" },
  { label: "Markets", href: "#markets" },
  { label: "Demo", href: "#demo" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b-3 border-b border-black bg-background/95 backdrop-blur-sm" style={{ borderBottomWidth: '3px', borderColor: 'black' }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#" className="font-pixel text-sm text-foreground tracking-tight">
          Eventra<span className="text-gradient"> SDK</span>
        </a>

        {/* Desktop */}
        <div className="hidden items-center gap-5 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="font-retro text-lg text-muted-foreground transition-colors hover:text-primary">
              {l.label}
            </a>
          ))}
          <a
            href="#docs"
            className="retro-border font-pixel bg-primary px-4 py-2 text-[10px] text-primary-foreground uppercase tracking-wider transition-all hover:brightness-110 active:retro-border-pressed active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_hsl(0_0%_0%)]"
          >
            Get Started
          </a>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t-2 border-black bg-background px-4 pb-4 md:hidden">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-2 font-retro text-lg text-muted-foreground">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
