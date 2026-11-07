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
import type { CalculatorType } from "@/lib/history";

const Index = () => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorType, setCalculatorType] = useState<CalculatorType>("basic");
  const [historyOpen, setHistoryOpen] = useState(false);

  const { requestClose, dialog } = useSaveOnClose(() => setShowCalculator(false));

  // Open a calculator, or close it if the same one is clicked again.
  const toggleCalculator = (type: CalculatorType) => {
    if (showCalculator && calculatorType === type) {
      requestClose(type);
    } else {
      setShowCalculator(true);
      setCalculatorType(type);
    }
  };

  const host: CalculatorHost = { docked: false, requestClose };

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        onFloCalClick={toggleCalculator}
        isCalculatorVisible={showCalculator}
        calculatorType={calculatorType}
        onOpenHistory={() => setHistoryOpen(true)}
      />
      <Hero />
      <Features />
      <AppDemo />
      <DownloadSection />
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
