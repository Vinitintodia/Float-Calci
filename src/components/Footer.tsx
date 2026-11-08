import React from "react";
import { Github } from "lucide-react";

const REPO = "https://github.com/Vinitintodia/voice-calc-vision";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "Live demo", href: "#demo" },
  { label: "Download", href: "#download" },
  { label: "Extension guide", href: `${REPO}/blob/main/CHROME_EXTENSION_GUIDE.md` },
  { label: "GitHub", href: REPO },
];

const Footer = () => (
  <footer className="bg-card border-t border-border">
    <div className="container px-4 md:px-6 py-10">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3 max-w-sm">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-brand-blue flex items-center justify-center text-white font-bold">FC</div>
            <span className="font-medium text-lg">Float Calci</span>
          </div>
          <p className="text-muted-foreground text-sm">The calculator that floats while you browse.</p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Float Calci · Open source</p>
        <a href={REPO} target="_blank" rel="noreferrer" aria-label="Float Calci on GitHub" className="text-muted-foreground hover:text-brand-blue">
          <Github className="h-5 w-5" />
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
