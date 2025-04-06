
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Add onFloCalClick prop to the component and keyboard input handling
interface NavBarProps {
  onFloCalClick: (type: 'basic' | 'scientific' | 'financial') => void;
  isCalculatorVisible?: boolean;
  calculatorType?: 'basic' | 'scientific' | 'financial';
  onKeyboardInput?: (key: string) => void;
}

const NavBar = ({ onFloCalClick, isCalculatorVisible, calculatorType, onKeyboardInput }: NavBarProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Add keyboard event listener when calculator is visible
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCalculatorVisible) return;
      
      // Handle numeric keys, operators, and other calculator inputs
      const key = e.key;
      
      // Define valid keys based on calculator type
      let validKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '+', '-', '*', '/', '=', 'Enter', 'Backspace', 'Escape', 'c', 'C'];
      
      // Add scientific calculator specific keys
      if (calculatorType === 'scientific') {
        validKeys = [...validKeys, '(', ')', '^', 'p', 'e', 's', 'o', 't', 'l', 'r', 'q'];
      }
      
      // Add financial calculator specific keys
      if (calculatorType === 'financial') {
        validKeys = [...validKeys, 'p', 'i', 'n', 't', 'f', 'r', 'Tab'];
      }
      
      if (validKeys.includes(key)) {
        // Map keys based on calculator type
        let mappedKey = key;
        
        // Basic calculator mappings
        if (key === 'Enter') mappedKey = '=';
        else if (key === '*') mappedKey = '×';
        else if (key === '/') mappedKey = '÷';
        else if (key === 'c' || key === 'C') mappedKey = 'C';
        else if (key === 'Backspace') mappedKey = '⌫';
        else if (key === 'Escape') mappedKey = 'C';
        
        // Scientific calculator specific mappings
        if (calculatorType === 'scientific') {
          if (key === 'p') mappedKey = 'π';
          else if (key === 'e') mappedKey = 'e';
          else if (key === 's') mappedKey = 'sin';
          else if (key === 'o') mappedKey = 'cos';
          else if (key === 't') mappedKey = 'tan';
          else if (key === 'l') mappedKey = 'log';
          else if (key === 'r') mappedKey = '√';
          else if (key === 'q') mappedKey = 'x²';
          else if (key === '^') mappedKey = '^';
        }
        
        // Financial calculator specific mappings
        if (calculatorType === 'financial') {
          if (key === 'p') mappedKey = 'PV';
          else if (key === 'i') mappedKey = 'i%';
          else if (key === 'n') mappedKey = 'n';
          else if (key === 't') mappedKey = 'PMT';
          else if (key === 'f') mappedKey = 'FV';
          else if (key === 'r') mappedKey = 'ROI';
          else if (key === 'Tab') mappedKey = 'Tab'; // For switching fields
        }
        
        // Pass the key to the calculator
        if (onKeyboardInput) {
          onKeyboardInput(mappedKey);
        }
        
        // Prevent default behavior for calculator keys
        e.preventDefault();
      }
    };
    
    if (isCalculatorVisible) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCalculatorVisible, calculatorType, onKeyboardInput]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setDropdownOpen(false);
    };

    if (dropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [dropdownOpen]);
  
  // Handle dropdown toggle
  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  // Handle calculator selection
  const handleCalcSelect = (type: 'basic' | 'scientific' | 'financial', e: React.MouseEvent) => {
    e.stopPropagation();
    onFloCalClick(type);
    setDropdownOpen(false);
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            {/* Logo */}
            <a href="#" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-brand-blue">VoiceCalc</span>
            </a>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            {/* Navigation links */}
            <a href="#features" className="text-sm font-medium text-gray-700 hover:text-brand-blue">Features</a>
            <a href="#demo" className="text-sm font-medium text-gray-700 hover:text-brand-blue">Demo</a>
            <a href="#download" className="text-sm font-medium text-gray-700 hover:text-brand-blue">Download</a>
            
            {/* Try Calci dropdown */}
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "rounded-full flex items-center gap-1.5",
                  isCalculatorVisible && "bg-brand-blue text-white hover:bg-brand-blue/90"
                )}
                onClick={toggleDropdown}
              >
                <span role="img" aria-label="calculator" className="text-lg">
                  🧮
                </span>
                Try Calci
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className={cn("ml-1 transition-transform", dropdownOpen && "transform rotate-180")}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </Button>
              
              {/* Dropdown menu */}
              {dropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className={cn(
                      "flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100",
                      isCalculatorVisible && calculatorType === 'basic' && "text-brand-blue font-medium"
                    )}
                    onClick={(e) => handleCalcSelect('basic', e)}
                  >
                    <span role="img" aria-label="calculator" className="mr-2">
                      🧮
                    </span>
                    Basic
                  </button>
                  <button
                    className={cn(
                      "flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100",
                      isCalculatorVisible && calculatorType === 'scientific' && "text-brand-blue font-medium"
                    )}
                    onClick={(e) => handleCalcSelect('scientific', e)}
                  >
                    <span role="img" aria-label="scientific calculator" className="mr-2">
                      📐
                    </span>
                    SciCal
                  </button>
                  <button
                    className={cn(
                      "flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100",
                      isCalculatorVisible && calculatorType === 'financial' && "text-brand-blue font-medium"
                    )}
                    onClick={(e) => handleCalcSelect('financial', e)}
                  >
                    <span role="img" aria-label="financial calculator" className="mr-2">
                      💰
                    </span>
                    FinCal
                  </button>
                </div>
              )}
            </div>
          </nav>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            {/* Your mobile menu button */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
