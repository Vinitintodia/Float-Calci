
import React from 'react';
import GlassCard from "@/components/ui-custom/GlassCard";
import { Mic, Calculator, Settings, History, Layers, Zap } from "lucide-react";
import AnimatedText from "@/components/ui-custom/AnimatedText";

const features = [
  {
    icon: <Mic className="h-6 w-6 text-brand-blue" />,
    title: "Keyboard Shortcuts",
    description: "Use keyboard shortcuts for faster calculations. Type naturally with full keyboard support."
  },
  {
    icon: <Calculator className="h-6 w-6 text-brand-blue" />,
    title: "Multiple Modes",
    description: "Choose between Basic, Scientific, and Financial calculators to suit your needs."
  },
  {
    icon: <Layers className="h-6 w-6 text-brand-blue" />,
    title: "Context-Aware UI",
    description: "The interface appears near your cursor and adapts its transparency based on usage."
  },
  {
    icon: <Zap className="h-6 w-6 text-brand-blue" />,
    title: "Smart Number Formatting",
    description: "Results are displayed with appropriate abbreviations (K, M, B, T) for readability."
  },
  {
    icon: <Settings className="h-6 w-6 text-brand-blue" />,
    title: "Customizable Settings",
    description: "Personalize shortcuts, themes, and default modes to match your preferences."
  },
  {
    icon: <History className="h-6 w-6 text-brand-blue" />,
    title: "Calculation History",
    description: "Access your recent calculations for reference or reuse with a simple gesture."
  }
];

const Features = () => {
  return (
    <section id="features" className="py-20 bg-card relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-50"></div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block mb-4">
            <span className="inline-flex items-center rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-1 text-sm font-medium text-brand-blue">
              Features
            </span>
          </div>

          <AnimatedText
            text="Smart Functionality Designed for Effortless Use"
            element="h2"
            animation="fade-in-up"
            className="text-3xl md:text-4xl font-bold tracking-tight text-balance mb-4"
          />

          <AnimatedText
            text="Every feature is thoughtfully designed to help you perform calculations with minimal effort and maximum efficiency."
            element="p"
            animation="fade-in-up"
            delay={100}
            className="text-lg text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <GlassCard intensity="medium" className="h-full p-6 hover:shadow-md transition-all duration-300 hover:translate-y-[-4px]">
                <div className="w-12 h-12 rounded-lg bg-brand-blue/10 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-balance">{feature.description}</p>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
