import React, { useState, useRef, useEffect } from "react";

interface FinancialCalculatorProps {
  input?: string;
  onInputChange?: (value: string) => void;
  onKeyboardInput?: (key: string) => void;
}

const FinancialCalculator: React.FC<FinancialCalculatorProps> = ({
  input,
  onInputChange,
  onKeyboardInput
}) => {
  // Use local state if no external state is provided
  const [expression, setExpression] = useState<string>(input || "");
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 200, y: 100 });
  const calcRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  // Financial variables
  const [principal, setPrincipal] = useState<string>("");
  const [rate, setRate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [activeField, setActiveField] = useState<string>("principal");
  const [isMinimized, setIsMinimized] = useState(false);

  // Update local state when input prop changes
  useEffect(() => {
    if (input !== undefined) {
      setExpression(input);
    }
  }, [input]);

  // Handle keyboard input - this is where the error might be
  useEffect(() => {
    // We don't need to reassign onKeyboardInput
    // Just use it directly in the component

    // If you need to handle keyboard input specifically for this component,
    // you can do it here, but don't try to modify the onKeyboardInput prop
  }, []);

  // Financial calculator buttons
  const buttons = [
    ["PV", "FV", "PMT", "C", "⌫"],
    ["n", "i%", "NPV", "IRR", "/"],
    ["7", "8", "9", "ROI", "*"],
    ["4", "5", "6", "Amort", "-"],
    ["1", "2", "3", "Tax", "+"],
    ["0", ".", "Cmpd", "Calc", "="]
  ];

  // Handle button click
  const handleClick = (val: string) => {
    if (val === "C") {
      // Clear all fields
      setPrincipal("");
      setRate("");
      setTime("");
      setResult("");
      setExpression("");
      onInputChange?.("");
    } else if (val === "⌫") {
      // Handle backspace for active field
      switch (activeField) {
        case "principal":
          setPrincipal(prev => prev.slice(0, -1));
          break;
        case "rate":
          setRate(prev => prev.slice(0, -1));
          break;
        case "time":
          setTime(prev => prev.slice(0, -1));
          break;
        default:
          break;
      }
    } else if (val === "=") {
      // Calculate based on active calculation
      calculateResult();
    } else if (val === "PV") {
      setActiveField("principal");
    } else if (val === "i%") {
      setActiveField("rate");
    } else if (val === "n") {
      setActiveField("time");
    } else if (val === "Calc") {
      calculateResult();
    } else if (val === "Cmpd") {
      // Set up for compound interest calculation
      setActiveField("principal");
    } else if (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."].includes(val)) {
      // Add number to active field
      switch (activeField) {
        case "principal":
          setPrincipal(prev => prev + val);
          break;
        case "rate":
          setRate(prev => prev + val);
          break;
        case "time":
          setTime(prev => prev + val);
          break;
        default:
          break;
      }
    }
  };

  // Set up keyboard input handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent handling if focus is elsewhere
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key;

      // Handle arrow keys directly
      if (key === "ArrowUp" || key === "ArrowLeft") {
        setActiveField(prev => {
          if (prev === "rate") return "principal";
          if (prev === "time") return "rate";
          return "time"; // Wrap around from principal to time
        });
        e.preventDefault();
        return;
      }

      if (key === "ArrowDown" || key === "ArrowRight") {
        setActiveField(prev => {
          if (prev === "principal") return "rate";
          if (prev === "rate") return "time";
          return "principal"; // Wrap around from time to principal
        });
        e.preventDefault();
        return;
      }

      const validKeys = [
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.',
        '+', '-', '*', '/', '=', 'Enter', 'Backspace', 'Escape',
        'c', 'C', 'Tab'
      ];

      if (validKeys.includes(key)) {
        // Map keys
        let mappedKey = key;
        if (key === 'Enter') mappedKey = '=';
        else if (key === 'Backspace') mappedKey = '⌫';
        else if (key === 'Escape') mappedKey = 'C';
        else if (key === 'c' || key === 'C') mappedKey = 'C';

        // Handle key input directly
        if (mappedKey === "Tab") {
          // Cycle through input fields
          setActiveField(prev => {
            if (prev === "principal") return "rate";
            if (prev === "rate") return "time";
            return "principal";
          });
        } else if (mappedKey === 'C') {
          // Clear the active field
          if (activeField === 'principal') setPrincipal('');
          else if (activeField === 'rate') setRate('');
          else if (activeField === 'time') setTime('');
        } else if (mappedKey === '⌫') {
          // Backspace - remove last character
          if (activeField === 'principal') setPrincipal(prev => prev.slice(0, -1));
          else if (activeField === 'rate') setRate(prev => prev.slice(0, -1));
          else if (activeField === 'time') setTime(prev => prev.slice(0, -1));
        } else if (mappedKey === '=' || mappedKey === 'Enter') {
          // Calculate result
          calculateResult();
        } else if (/^[0-9.]$/.test(mappedKey)) {
          // Only allow numbers and decimal point for input fields
          if (activeField === 'principal') setPrincipal(prev => prev + mappedKey);
          else if (activeField === 'rate') setRate(prev => prev + mappedKey);
          else if (activeField === 'time') setTime(prev => prev + mappedKey);
        } else {
          // Pass other keys to regular click handler
          handleClick(mappedKey);
        }

        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeField]); // Keep activeField as dependency

  // Calculate financial result
  const calculateResult = () => {
    try {
      // Simple compound interest calculation: A = P(1 + r/n)^(nt)
      const p = parseFloat(principal);
      const r = parseFloat(rate) / 100; // Convert percentage to decimal
      const t = parseFloat(time);

      if (isNaN(p) || isNaN(r) || isNaN(t)) {
        setResult("Missing values");
        return;
      }

      // Compound interest formula
      const amount = p * Math.pow(1 + r, t);
      const interest = amount - p;

      // Format result to fit in calculator
      const formattedAmount = formatCurrency(amount);
      const formattedInterest = formatCurrency(interest);

      setResult(`${formattedAmount} (Int: ${formattedInterest})`);
    } catch (error) {
      setResult("Error");
    }
  };

  // Format currency to fit in calculator
  const formatCurrency = (value: number): string => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  // Add blinking cursor state
  const [showCursor, setShowCursor] = useState(true);

  // Blinking cursor effect with slower speed
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 1000); // Increased from 500ms to 800ms for slower blinking

    return () => clearInterval(cursorInterval);
  }, []);

  // Drag handlers, voice recognition, and render methods

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;

    // Get calculator dimensions
    const calcWidth = calcRef.current?.offsetWidth || 350;
    const calcHeight = calcRef.current?.offsetHeight || 600;

    // Calculate new position
    let newX = e.clientX - dragStart.current.x;
    let newY = e.clientY - dragStart.current.y;

    // Apply boundary constraints
    const minX = 0;
    const minY = 0;
    const maxX = window.innerWidth - calcWidth;
    const maxY = window.innerHeight - calcHeight;

    // Clamp values within boundaries
    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));

    setOffset({
      x: newX,
      y: newY,
    });
  };

  const handleMouseUp = () => setDragging(false);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);


  // Add state for transparency
  const [isHovered, setIsHovered] = useState(false);

  // Handle mouse enter/leave for transparency effect
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      ref={calcRef}
      style={{
        position: "fixed",
        top: offset.y,
        left: offset.x,
        width: 350,
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        backgroundColor: "rgba(255, 255, 255, 0.6)",
        userSelect: "none",
        zIndex: 1000,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        opacity: isHovered ? 1 : 0.7,
        transition: "opacity 0.3s ease, background-color 0.3s ease",
        pointerEvents: "auto", // Ensure clicks are captured even when transparent
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Drag Bar */}
      <div
        style={{
          padding: "0.75rem 1rem",
          background: isHovered ? "#f0f8ff" : "rgba(240, 248, 255, 0.7)",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderBottomLeftRadius: isMinimized ? 16 : 0,
          borderBottomRightRadius: isMinimized ? 16 : 0,
          fontWeight: "500",
          borderBottom: isMinimized ? "none" : "1px solid #ddd",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "background 0.3s ease",
        }}
      >
        {/* macOS-style window controls */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('closeCalculator', { detail: 'financial' }))}
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#FF5F57",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            title="Close"
          />
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#FFBD2E",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            title={isMinimized ? "Maximize" : "Minimize"}
          />
          <button
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#28C840",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            title="Maximize"
          />
        </div>

        {/* Title - draggable area */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "move",
            flex: 1,
            justifyContent: "center",
            fontSize: "0.875rem",
            color: "#666",
          }}
        >
          Financial Calculator
        </div>

        {/* Empty space for symmetry */}
        <div style={{ width: "60px" }} />
      </div>

      {!isMinimized && (
        <>
          {/* Display - Keep this fully visible */}
          <div
            style={{
              padding: "1rem",
              textAlign: "right",
              fontSize: "1.8rem",
              fontWeight: 600,
              minHeight: "4rem",
              fontFamily: "monospace",
              overflowX: "auto",
              whiteSpace: "nowrap",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderBottom: "1px solid rgba(221, 221, 221, 0.5)",
            }}
          >
            {result || "0"}
          </div>

          {/* Financial Input Fields */}
          <div style={{
            padding: "1rem",
            borderBottom: "1px solid #eee",
            backgroundColor: isHovered ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.5)",
            transition: "background-color 0.3s ease",
          }}>
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.25rem",
                alignItems: "center"
              }}>
                <label style={{ fontSize: "0.9rem", fontWeight: "bold" }}>Principal (PV):</label>
                <div
                  style={{
                    padding: "0.5rem",
                    border: activeField === "principal" ? "2px solid #4da6ff" : "1px solid #ddd",
                    borderRadius: "4px",
                    width: "60%",
                    textAlign: "right",
                    cursor: "pointer",
                    background: activeField === "principal" ? "#f0f8ff" : "white",
                    zIndex: 10, // Higher z-index to ensure clicks are captured
                  }}
                  onClick={() => setActiveField("principal")}
                >
                  {principal || "$0"}{activeField === "principal" && showCursor ? "|" : ""}
                </div>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.25rem",
                alignItems: "center"
              }}>
                <label style={{ fontSize: "0.9rem", fontWeight: "bold" }}>Rate (i%):</label>
                <div
                  style={{
                    padding: "0.5rem",
                    border: activeField === "rate" ? "2px solid #4da6ff" : "1px solid #ddd",
                    borderRadius: "4px",
                    width: "60%",
                    textAlign: "right",
                    cursor: "pointer",
                    background: activeField === "rate" ? "#f0f8ff" : "white"
                  }}
                  onClick={() => setActiveField("rate")}
                >
                  {rate || "0%"}{activeField === "rate" && showCursor ? "|" : ""}
                </div>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <label style={{ fontSize: "0.9rem", fontWeight: "bold" }}>Time (n):</label>
                <div
                  style={{
                    padding: "0.5rem",
                    border: activeField === "time" ? "2px solid #4da6ff" : "1px solid #ddd",
                    borderRadius: "4px",
                    width: "60%",
                    textAlign: "right",
                    cursor: "pointer",
                    background: activeField === "time" ? "#f0f8ff" : "white"
                  }}
                  onClick={() => setActiveField("time")}
                >
                  {time || "0 years"}{activeField === "time" && showCursor ? "|" : ""}
                </div>
              </div>
            </div>

            {/* Result Display */}
            <div style={{
              marginTop: "0.75rem",
              padding: "0.75rem",
              background: "#f9f9f9",
              borderRadius: "8px",
              textAlign: "right",
              fontWeight: "bold",
              fontSize: "1.2rem",
              color: "#2a9d8f",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%"
            }}>
              {result || "Result will appear here"}
            </div>
          </div>

          {/* Buttons Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "0.5rem",
              padding: "1rem",
            }}
          >
            {buttons.flat().map((val, idx) => (
              <button
                key={idx}
                onClick={() => handleClick(val)}
                style={{
                  padding: "0.75rem 0.5rem",
                  fontSize: "0.9rem",
                  border: "none",
                  borderRadius: 8,
                  backgroundColor:
                    ["PV", "FV", "PMT", "n", "i%", "NPV", "IRR", "ROI", "Amort", "Tax", "Cmpd", "Calc"].includes(val)
                      ? "#e6fff0"
                      : ["C", "⌫", "/", "*", "-", "+", "="].includes(val)
                        ? "#4da6ff"
                        : "#f2f2f2",
                  color:
                    ["C", "⌫", "/", "*", "-", "+", "="].includes(val)
                      ? "white"
                      : ["PV", "FV", "PMT", "n", "i%", "NPV", "IRR", "ROI", "Amort", "Tax", "Cmpd", "Calc"].includes(val)
                        ? "#2a9d8f"
                        : "black",
                  cursor: "pointer",
                  fontWeight: ["PV", "FV", "PMT", "n", "i%", "NPV", "IRR", "ROI", "Amort", "Tax", "Cmpd", "Calc"].includes(val) ? "bold" : "normal",
                }}
              >
                {val}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FinancialCalculator;