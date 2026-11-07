
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { History } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useHistory } from "@/lib/history";

interface NavBarProps {
  onFloCalClick: (type: 'basic' | 'scientific' | 'financial') => void;
  isCalculatorVisible?: boolean;
  calculatorType?: 'basic' | 'scientific' | 'financial';
  onOpenHistory?: () => void;
}

// Keyboard input is handled by each calculator itself (see CalculatorShell).
const NavBar = ({ onFloCalClick, isCalculatorVisible, calculatorType, onOpenHistory }: NavBarProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { unsavedCount } = useHistory();

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            {/* Logo */}
            <a href="#" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-brand-blue">Float Calci</span>
            </a>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            {/* Navigation links */}
            <a href="#features" className="text-sm font-medium text-foreground/75 hover:text-brand-blue">Features</a>
            <a href="#demo" className="text-sm font-medium text-foreground/75 hover:text-brand-blue">Demo</a>
            <a href="#download" className="text-sm font-medium text-foreground/75 hover:text-brand-blue">Download</a>

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
                  className="absolute right-0 mt-2 w-48 bg-popover text-popover-foreground rounded-md shadow-lg py-1 z-10 border border-border"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className={cn(
                      "flex items-center w-full px-4 py-2 text-sm text-left hover:bg-accent",
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
                      "flex items-center w-full px-4 py-2 text-sm text-left hover:bg-accent",
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
                      "flex items-center w-full px-4 py-2 text-sm text-left hover:bg-accent",
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

            {/* History + theme */}
            <button
              onClick={onOpenHistory}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/80 hover:bg-accent hover:text-foreground"
              aria-label="Calculation history"
              title="History"
            >
              <History className="h-4 w-4" />
              {unsavedCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[1.1rem] rounded-full bg-brand-blue px-1 text-[10px] font-semibold leading-[1.1rem] text-white">
                  {unsavedCount > 99 ? "99+" : unsavedCount}
                </span>
              )}
            </button>
            <ThemeToggle />
          </nav>

          {/* Mobile: theme + history */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenHistory}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border"
              aria-label="Calculation history"
            >
              <History className="h-4 w-4" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
