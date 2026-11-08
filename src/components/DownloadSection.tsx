import React from "react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui-custom/GlassCard";
import AnimatedText from "@/components/ui-custom/AnimatedText";
import { ArrowRight, Chrome, Github, Globe } from "lucide-react";

const REPO = "https://github.com/Vinitintodia/voice-calc-vision";
const GUIDE = `${REPO}/blob/main/CHROME_EXTENSION_GUIDE.md`;

const scrollToDemo = () => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });

const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <li className="flex gap-3">
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue/15 text-xs font-semibold text-brand-blue">
      {n}
    </span>
    <span className="text-sm text-muted-foreground">{children}</span>
  </li>
);

const DownloadSection = () => (
  <section id="download" className="py-24 relative overflow-hidden">
    <div className="absolute top-40 left-[15%] w-64 h-64 rounded-full bg-brand-blue/10 filter blur-3xl"></div>
    <div className="absolute bottom-20 right-[10%] w-72 h-72 rounded-full bg-brand-purple-light/10 filter blur-3xl"></div>

    <div className="container px-4 md:px-6 relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-block mb-4">
          <span className="inline-flex items-center rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-1 text-sm font-medium text-brand-blue">
            Get Float Calci
          </span>
        </div>
        <AnimatedText
          text="Keep a Calculator on Top of Everything"
          element="h2"
          animation="fade-in-up"
          className="text-3xl md:text-4xl font-bold tracking-tight text-balance mb-4"
        />
        <AnimatedText
          text="Add the Chrome extension to float it over any app, or use it right here in your browser. It's free and open source."
          element="p"
          animation="fade-in-up"
          delay={100}
          className="text-lg text-muted-foreground"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <GlassCard className="p-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="flex flex-col h-full">
            <div className="bg-brand-blue/10 p-4 rounded-lg inline-flex self-start mb-4">
              <Chrome className="h-6 w-6 text-brand-blue" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Chrome extension</h3>
            <ol className="space-y-3 mb-6 flex-grow">
              <Step n={1}>Build it (see the last card), or download a ready-made build when one is released.</Step>
              <Step n={2}>
                Open <code className="rounded bg-muted px-1">chrome://extensions</code> and turn on Developer mode.
              </Step>
              <Step n={3}>
                Click <strong>Load unpacked</strong> and choose the <code className="rounded bg-muted px-1">dist</code> folder.
              </Step>
            </ol>
            <Button className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white group" onClick={() => window.open(GUIDE, "_blank")}>
              Setup guide
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="p-6 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <div className="flex flex-col h-full">
            <div className="bg-emerald-500/10 p-4 rounded-lg inline-flex self-start mb-4">
              <Globe className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Use it on the web</h3>
            <p className="text-muted-foreground mb-6 flex-grow text-sm">
              No install needed. Open any calculator from <strong>Try Calci</strong> in the menu and drag it anywhere on the
              page. Press the green dot to float it over your other apps (Chrome or Edge on a computer).
            </p>
            <Button variant="outline" className="w-full group" onClick={scrollToDemo}>
              Try it now
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="p-6 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <div className="flex flex-col h-full">
            <div className="bg-brand-purple-light/10 p-4 rounded-lg inline-flex self-start mb-4">
              <Github className="h-6 w-6 text-brand-purple-dark dark:text-brand-purple-medium" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Build from source</h3>
            <div className="bg-muted rounded-lg p-4 mb-6 font-mono text-xs overflow-auto flex-grow">
              <p className="text-muted-foreground"># Clone and install</p>
              <p className="text-brand-blue mb-2 break-all">git clone {REPO}.git</p>
              <p className="text-brand-blue mb-2">npm install</p>
              <p className="text-muted-foreground"># Build the site + extension</p>
              <p className="text-brand-blue">npm run build</p>
            </div>
            <Button variant="outline" className="w-full group" onClick={() => window.open(REPO, "_blank")}>
              View on GitHub
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </GlassCard>
      </div>

      <p className="mt-12 text-center text-sm text-muted-foreground">
        Floating over other apps needs Chrome or Edge 116+ on Windows, macOS, Linux or ChromeOS. Everything else works in any
        modern browser.
      </p>
    </div>
  </section>
);

export default DownloadSection;
