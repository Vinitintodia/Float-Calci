
import React, { useState, useEffect } from 'react';
import NavBar from '@/components/NavBar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import AppDemo from '@/components/AppDemo';
import DownloadSection from '@/components/DownloadSection';
import Footer from '@/components/Footer';
import CalculatorManager from '@/components/CalculatorManager';

const Index = () => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorInput, setCalculatorInput] = useState("");
  const [calculatorType, setCalculatorType] = useState<'basic' | 'scientific' | 'financial'>('basic');

  // Function to toggle calculator visibility
  const toggleCalculator = (type: 'basic' | 'scientific' | 'financial') => {
    if (showCalculator && calculatorType === type) {
      // If clicking the same calculator type that's already open, close it
      setShowCalculator(false);
    } else {
      // Otherwise, show the selected calculator type
      setShowCalculator(true);
      setCalculatorType(type);
      setCalculatorInput(""); // Reset input when switching calculators
    }
  };

  // Add a keyboard input handler
  const handleKeyboardInput = (key: string) => {
    console.log(`Key pressed: ${key}`);

    // Process the key and update calculator input
    if (key === 'C') {
      // Clear the input
      setCalculatorInput("");
    } else if (key === '⌫') {
      // Handle backspace
      setCalculatorInput(prev => prev.slice(0, -1));
    } else if (key === '=') {
      // Calculate the result
      try {
        // Keep the existing calculation logic in the calculator components
        // This is just a fallback
      } catch (error) {
        console.error("Calculation error:", error);
      }
    } else {
      // For all other keys, append to the input
      // But check if the resulting string would be too long
      const newInput = calculatorInput + key;

      // Limit the input length to prevent overflow
      if (newInput.length <= 15) {
        setCalculatorInput(newInput);
      }
    }
  };

  // Listen for close calculator events
  useEffect(() => {
    const handleCloseCalculator = (event: Event) => {
      const customEvent = event as CustomEvent;
      const type = customEvent.detail;

      // Only close if the event matches the current calculator type
      if (type === calculatorType) {
        setShowCalculator(false);
      }
    };

    window.addEventListener('closeCalculator', handleCloseCalculator);

    return () => {
      window.removeEventListener('closeCalculator', handleCloseCalculator);
    };
  }, [calculatorType]);

  return (
    <div className="min-h-screen bg-white">
      <NavBar
        onFloCalClick={toggleCalculator}
        isCalculatorVisible={showCalculator}
        calculatorType={calculatorType}
        onKeyboardInput={handleKeyboardInput}
      />
      <Hero />
      <Features />
      <AppDemo />
      <DownloadSection />
      <Footer />
      {showCalculator && (
        <CalculatorManager
          type={calculatorType}
          input={calculatorInput}
          onInputChange={setCalculatorInput}
          onKeyboardInput={handleKeyboardInput}
        />
      )}
    </div>
  );
};

export default Index;
