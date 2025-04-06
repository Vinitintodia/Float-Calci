import React from "react";
import FloatingCalculator from "@/components/FloatingCalculator";
import ScientificCalculator from "@/components/ScientificCalculator";
import FinancialCalculator from "@/components/FinancialCalculator";

interface CalculatorManagerProps {
  type: 'basic' | 'scientific' | 'financial';
  input?: string;
  onInputChange?: (value: string) => void;
  onKeyboardInput?: (key: string) => void;
}

const CalculatorManager: React.FC<CalculatorManagerProps> = ({ 
  type, 
  input, 
  onInputChange,
  onKeyboardInput
}) => {
  switch (type) {
    case 'scientific':
      return <ScientificCalculator input={input} onInputChange={onInputChange} onKeyboardInput={onKeyboardInput} />;
    case 'financial':
      return <FinancialCalculator input={input} onInputChange={onInputChange} onKeyboardInput={onKeyboardInput} />;
    case 'basic':
    default:
      return <FloatingCalculator input={input} onInputChange={onInputChange} onKeyboardInput={onKeyboardInput} />;
  }
};

export default CalculatorManager;