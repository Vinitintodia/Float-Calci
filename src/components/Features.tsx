
import React from 'react';
import GlassCard from "@/components/ui-custom/GlassCard";
import { Pin, Calculator, Keyboard, History, Coins, Moon } from "lucide-react";
import AnimatedText from "@/components/ui-custom/AnimatedText";

const features = [
  {
    icon: <Pin className="h-6 w-6 text-brand-blue" />,
    title: "Floats Over Everything",
    description: "Pin the calculator above every tab and app with one click, and keep it there while you browse or work.",
  },
  {
    icon: <Calculator className="h-6 w-6 text-brand-blue" />,
    title: "Three Calculators",
    description: "Basic, Scientific, and a full financial calculator with TVM, NPV, IRR, amortization and bond worksheets.",
  },
  {
    icon: <Keyboard className="h-6 w-6 text-brand-blue" />,
    title: "Keyboard First",
    description: "Every key has a shortcut. Open the calculator with Alt+Shift+C and the floating window with Alt+Shift+F.",
  },
  {
    icon: <History className="h-6 w-6 text-brand-blue" />,
    title: "Calculation History",
    description: "Every result is saved. Keep them under your name or Google account, then copy any result back with a click.",
  },
  {
    icon: <Coins className="h-6 w-6 text-brand-blue" />,
    title: "Your Currency",
    description: "Rupees, dollars, euros, pounds, yen and more, with big amounts written out in millions and billions.",
  },
  {
    icon: <Moon className="h-6 w-6 text-brand-blue" />,
    title: "Light and Dark",
    description: "Follows your system theme, or switch with one click. The floating window always matches.",
  },
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
            text="Everything You Need, Right on Top"
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
