import React, { useEffect, useState } from "react";
import { BarChart3, Calculator, ChevronDown, FlaskConical, History, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import { useHistory, type CalculatorType } from "@/lib/history";

interface NavBarProps {
  onFloCalClick: (type: CalculatorType) => void;
  isCalculatorVisible?: boolean;
  calculatorType?: CalculatorType;
  onOpenHistory?: () => void;
}

const CALCS: { type: CalculatorType; label: string; icon: React.ReactNode }[] = [
  { type: "basic", label: "Basic", icon: <Calculator className="h-4 w-4" /> },
  { type: "scientific", label: "Scientific", icon: <FlaskConical className="h-4 w-4" /> },
  { type: "financial", label: "Financial", icon: <BarChart3 className="h-4 w-4" /> },
];

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#demo", label: "Demo" },
  { href: "#download", label: "Download" },
];

// Keyboard input is handled by each calculator itself (see CalculatorShell).
const NavBar = ({ onFloCalClick, isCalculatorVisible, calculatorType, onOpenHistory }: NavBarProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { unsavedCount } = useHistory();

  // Close the dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const close = () => setDropdownOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [dropdownOpen]);

  const isOpen = (type: CalculatorType) => isCalculatorVisible && calculatorType === type;

  const historyButton = (
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
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <a href="#" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-brand-blue">Float Calci</span>
          </a>

          {/* Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-foreground/75 hover:text-brand-blue">
                {l.label}
              </a>
            ))}

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className={cn("rounded-full flex items-center gap-1.5", isCalculatorVisible && "bg-brand-blue text-white hover:bg-brand-blue/90")}
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen((o) => !o);
                }}
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
              >
                <Calculator className="h-4 w-4" />
                Try Calci
                <ChevronDown className={cn("h-4 w-4 transition-transform", dropdownOpen && "rotate-180")} />
              </Button>

              {dropdownOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 bg-popover text-popover-foreground rounded-md shadow-lg py-1 z-10 border border-border"
                  onClick={(e) => e.stopPropagation()}
                >
                  {CALCS.map((c) => (
                    <button
                      key={c.type}
                      role="menuitem"
                      className={cn(
                        "flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-accent",
                        isOpen(c.type) && "text-brand-blue font-medium",
                      )}
                      onClick={() => {
                        onFloCalClick(c.type);
                        setDropdownOpen(false);
                      }}
                    >
                      {c.icon}
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {historyButton}
            <ThemeToggle />
          </nav>

          {/* Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            {historyButton}
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-[85vw] max-w-xs">
          <SheetHeader>
            <SheetTitle className="text-left text-brand-blue">Float Calci</SheetTitle>
          </SheetHeader>

          <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open a calculator</p>
          <div className="grid gap-2">
            {CALCS.map((c) => (
              <button
                key={c.type}
                onClick={() => {
                  setMobileOpen(false);
                  onFloCalClick(c.type);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-accent",
                  isOpen(c.type) && "border-brand-blue text-brand-blue",
                )}
              >
                {c.icon}
                {c.label}
              </button>
            ))}
          </div>

          <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Go to</p>
          <nav className="grid">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="rounded-md px-2 py-2 text-sm hover:bg-accent">
                {l.label}
              </a>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default NavBar;
