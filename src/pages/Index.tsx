import React, { useState } from "react";
import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import AppDemo from "@/components/AppDemo";
import DownloadSection from "@/components/DownloadSection";
import Footer from "@/components/Footer";
import CalculatorManager from "@/components/CalculatorManager";
import HistoryPanel from "@/components/HistoryPanel";
import { CalculatorHostContext, type CalculatorHost } from "@/components/calculator/CalculatorHost";
import { useSaveOnClose } from "@/hooks/use-save-on-close";
import { PIN_EVENT } from "@/components/calculator/CalculatorShell";
import type { CalculatorType } from "@/lib/history";

const Index = () => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorType, setCalculatorType] = useState<CalculatorType>("basic");
  const [historyOpen, setHistoryOpen] = useState(false);

  const [floatNow, setFloatNow] = useState(false);
  const { requestClose, dialog } = useSaveOnClose(() => {
    setShowCalculator(false);
    setFloatNow(false);
  });

  // "Float it over everything": open the chosen calculator straight into the
  // always-on-top window, above every tab and app.
  const floatEverywhere = (type: CalculatorType = "basic") => {
    if (showCalculator && calculatorType === type) {
      window.dispatchEvent(new Event(PIN_EVENT));
      return;
    }
    // A different type (or none open yet): the keyed calculator remounts and starts on top
    setCalculatorType(type);
    setFloatNow(true);
    setShowCalculator(true);
  };

  // Open a calculator, or close it if the same one is clicked again.
  const toggleCalculator = (type: CalculatorType) => {
    if (showCalculator && calculatorType === type) {
      requestClose(type);
    } else {
      setShowCalculator(true);
      setCalculatorType(type);
    }
  };

  const host: CalculatorHost = {
    docked: false,
    requestClose,
    startAlwaysOnTop: floatNow,
    onAlwaysOnTopChange: (active) => active && setFloatNow(false),
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        onFloCalClick={toggleCalculator}
        onFloatEverywhere={floatEverywhere}
        isCalculatorVisible={showCalculator}
        calculatorType={calculatorType}
        onOpenHistory={() => setHistoryOpen(true)}
      />
      <Hero onFloatEverywhere={floatEverywhere} />
      <Features />
      <AppDemo />
      <DownloadSection onFloatEverywhere={floatEverywhere} />
      <Footer />

      {showCalculator && (
        <CalculatorHostContext.Provider value={host}>
          {/* key: a fresh calculator each time you switch type */}
          <CalculatorManager key={calculatorType} type={calculatorType} />
        </CalculatorHostContext.Provider>
      )}

      <HistoryPanel open={historyOpen} onOpenChange={setHistoryOpen} />
      {dialog}
    </div>
  );
};

export default Index;
