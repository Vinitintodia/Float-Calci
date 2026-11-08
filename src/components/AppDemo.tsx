// "Try it right here": the real calculators, embedded in the page.
import React, { useState } from "react";
import { toast } from "sonner";
import { BarChart3, Calculator, FlaskConical } from "lucide-react";
import AnimatedText from "@/components/ui-custom/AnimatedText";
import CalculatorManager from "@/components/CalculatorManager";
import { CalculatorHostContext, type CalculatorHost } from "@/components/calculator/CalculatorHost";
import type { CalculatorType } from "@/lib/history";
import { cn } from "@/lib/utils";

const TABS: { type: CalculatorType; label: string; icon: React.ReactNode; blurb: string }[] = [
  { type: "basic", label: "Basic", icon: <Calculator className="h-4 w-4" />, blurb: "Everyday sums. Type on your keyboard or tap the keys." },
  {
    type: "scientific",
    label: "Scientific",
    icon: <FlaskConical className="h-4 w-4" />,
    blurb: "Trig in degrees, logs, powers, roots, π and e, EXP and Ans.",
  },
  {
    type: "financial",
    label: "Financial",
    icon: <BarChart3 className="h-4 w-4" />,
    blurb: "TVM, cash flows, NPV, IRR, amortization, bonds, in the currency you choose.",
  },
];

// Demo calculators sit in the page: they only take the keyboard once clicked,
// and the green dot still pops them out on top of all apps.
const demoHost: CalculatorHost = {
  docked: true,
  autoKeyboard: false,
  requestClose: () => toast("This one lives in the page. Use Try Calci in the menu to open a floating one."),
};

const AppDemo = () => {
  const [type, setType] = useState<CalculatorType>("financial");
  const active = TABS.find((t) => t.type === type)!;

  return (
    <section id="demo" className="py-20 bg-brand-gray-light/30 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-background to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-background to-transparent"></div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-block mb-4">
            <span className="inline-flex items-center rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-1 text-sm font-medium text-brand-blue">
              Live demo
            </span>
          </div>

          <AnimatedText
            text="Try It Right Here"
            element="h2"
            animation="fade-in-up"
            className="text-3xl md:text-4xl font-bold tracking-tight text-balance mb-4"
          />

          <AnimatedText
            text="These are the real calculators. Click one to use your keyboard, or press the green dot to float it on top of all your apps."
            element="p"
            animation="fade-in-up"
            delay={100}
            className="text-lg text-muted-foreground"
          />
        </div>

        <div className="mx-auto flex max-w-md justify-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.type}
              role="tab"
              aria-selected={type === t.type}
              onClick={() => setType(t.type)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                type === t.type ? "bg-brand-blue text-white" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">{active.blurb}</p>

        <div className="mx-auto mt-6 w-full max-w-[400px]">
          <CalculatorHostContext.Provider value={demoHost}>
            <CalculatorManager key={type} type={type} />
          </CalculatorHostContext.Provider>
        </div>
      </div>
    </section>
  );
};

export default AppDemo;
