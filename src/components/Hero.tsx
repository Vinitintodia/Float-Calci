import React from 'react';
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/ui-custom/GlassCard";
import AnimatedText from "@/components/ui-custom/AnimatedText";
import { ArrowRight, Pin } from "lucide-react";
import { supportsAlwaysOnTop } from "@/lib/env";


/**
 * Hero Component
 * 
 * The main landing section of Float Calci.
 * It displays the app's headline, description, call-to-action buttons,
 * and a preview of the calculator interface.
 */
interface HeroProps {
  /** Open the calculator in the always-on-top window */
  onFloatEverywhere: () => void;
}

const Hero = ({ onFloatEverywhere }: HeroProps) => {
  const canFloat = supportsAlwaysOnTop();
  /**
   * Smooth scrolls to the download section when "Add to Chrome" is clicked
   */
  const scrollToDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    const downloadSection = document.getElementById('download');
    if (downloadSection) {
      downloadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * Smooth scrolls to the live demo when "Try it now" is clicked
   */
  const scrollToDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    const demoSection = document.getElementById('demo');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden pt-24 pb-20 flex items-center justify-center bg-mesh-gradient">
      {/* Background decorative elements - blurred circles for visual appeal */}
      <div className="absolute top-20 right-[10%] w-64 h-64 rounded-full bg-brand-purple-light/20 filter blur-3xl animate-pulse-subtle"></div>
      <div className="absolute bottom-20 left-[10%] w-72 h-72 rounded-full bg-brand-blue/10 filter blur-3xl animate-pulse-subtle" style={{ animationDelay: '2s' }}></div>

      <div className="container px-4 md:px-6 flex flex-col items-center text-center z-10">
        {/* Hero content section with headline and description */}
        <div className="space-y-4 max-w-[800px]">
          {/* Badge/tag showing the product name */}
          <div className="inline-block animate-fade-in-up">
            <span className="inline-flex items-center rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-1 text-sm font-medium text-brand-blue">
              Introducing Float Calci
            </span>
          </div>

          {/* Main headline with animation */}
          <AnimatedText
            text="The Calculator That Floats While You Browse"
            element="h1"
            animation="fade-in-up"
            delay={100}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-tight"
          />

          {/* Subheadline/description with animation */}
          <AnimatedText
            text="Basic, scientific and financial calculators that stay on top of every tab and app. Pin one beside your spreadsheet, keep your history, and never switch windows to do a quick sum again."
            element="p"
            animation="fade-in-up"
            delay={200}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-balance"
          />

          {/* Call-to-action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            {/* Primary: float it over everything (Chrome/Edge desktop), otherwise try it here */}
            <Button
              size="lg"
              className="bg-brand-blue hover:bg-brand-blue/90 text-white rounded-full px-8 gap-2"
              onClick={canFloat ? () => onFloatEverywhere() : scrollToDemo}
            >
              {canFloat ? (
                <>
                  <Pin className="h-4 w-4" /> Float it over everything
                </>
              ) : (
                "Try it now"
              )}
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-6 group" onClick={scrollToDownload}>
              Install the app or extension
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        {/* Calculator Preview Section - Shows a visual demo of the app */}
        <div className="mt-16 w-full max-w-3xl mx-auto animate-fade-in-up animate-delay-500">
          <GlassCard intensity="high" className="p-6 sm:p-8 shadow-xl">
            <div className="aspect-[16/9] bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden relative flex items-center justify-center">
              {/* Calculator UI mockup */}
              <div className="w-[280px] h-[400px] bg-card rounded-xl shadow-2xl overflow-hidden animate-float">
                {/* Calculator window header with macOS-style controls */}
                <div className="h-14 bg-brand-gray-light border-b border-border flex items-center justify-between px-4">
                  <div className="text-sm font-medium text-brand-gray-dark">Calculator</div>
                  <div className="flex space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  </div>
                </div>
                {/* Calculator display and keypad */}
                <div className="p-4">
                  {/* Calculator result display */}
                  <div className="text-right text-3xl font-light mb-4 font-mono">
                    1,234.56
                  </div>
                  {/* Calculator buttons grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {/* Map through calculator keys and render buttons with appropriate styling */}
                    {["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "="].map((key, index) => (
                      <div
                        key={index}
                        className={`h-12 rounded-lg flex items-center justify-center text-lg ${["C", "±", "%", "÷", "×", "-", "+", "="].includes(key)
                            ? "bg-brand-blue text-white"
                            : "bg-brand-gray-light/60 text-brand-gray-dark"
                          }`}
                      >
                        {key}
                      </div>
                    ))}
                  </div>

                  {/* Pinned-on-top badge */}
                  <div className="mt-6 flex items-center justify-between rounded-lg bg-brand-gray-light/50 p-3 text-xs">
                    <span className="flex items-center gap-2 font-medium text-brand-blue">
                      <Pin className="h-3.5 w-3.5" /> Pinned on top
                    </span>
                    <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-brand-gray-medium">
                      Alt+Shift+F
                    </kbd>
                  </div>
                </div>
              </div>
              {/* Floating caption below the calculator */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <div className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
                  Stays on top while you browse, read or work in other apps
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
};

export default Hero;
