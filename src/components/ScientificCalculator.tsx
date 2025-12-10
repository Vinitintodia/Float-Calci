import React, { useState, useRef, useEffect } from "react";

interface ScientificCalculatorProps {
  input?: string;
  onInputChange?: (value: string) => void;
  onKeyboardInput?: (key: string) => void;
}

const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({
  input,
  onInputChange,
  onKeyboardInput
}) => {
  // Use local state if no external state is provided
  const [expression, setExpression] = useState<string>(input || "");
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 150, y: 100 });
  const calcRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  // Add state for transparency
  const [isHovered, setIsHovered] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Update local state when input prop changes
  useEffect(() => {
    if (input !== undefined) {
      setExpression(input);
    }
  }, [input]);

  // Handle mouse enter/leave for transparency effect
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent handling if focus is elsewhere (like in an input field)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key;

      // Map Enter key to equals sign
      if (key === 'Enter') {
        handleClick('=');
        e.preventDefault();
        return;
      }

      // Map other keys to calculator buttons
      const keyMap: Record<string, string> = {
        'Escape': 'C',
        'Backspace': '⌫',
        'Delete': 'C',
        '/': '/',
        '*': '*',
        '-': '-',
        '+': '+',
        '.': '.',
        '%': '%',
        '^': '^',
        '(': '(',
        ')': ')',
        's': 'sin',
        'c': 'cos',
        't': 'tan',
        'l': 'log',
        'r': '√',
        'p': 'π',
        ' ': ')', // Spacebar closes bracket
      };

      // Handle numeric keys and mapped keys
      if (/^[0-9]$/.test(key) || Object.keys(keyMap).includes(key)) {
        const mappedKey = keyMap[key] || key;
        handleClick(mappedKey);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [expression]); // Add expression as dependency to ensure latest state is used

  // Scientific calculator buttons
  const buttons = [
    ["sin", "cos", "tan", "C", "⌫"],
    ["π", "e", "^", "√", "log"],
    ["(", ")", "%", "±", "/"],
    ["7", "8", "9", "x²", "*"],
    ["4", "5", "6", "x³", "-"],
    ["1", "2", "3", "EXP", "+"],
    ["0", ".", "×10^", "Ans", "="]
  ];

  // Handle button click
  // Handle button click for scientific calculator
  const handleClick = (val: string) => {
    if (val === "C") {
      const newValue = "";
      setExpression(newValue);
      onInputChange?.(newValue);
    } else if (val === "⌫") {
      const newValue = expression.slice(0, -1);
      setExpression(newValue);
      onInputChange?.(newValue);
    } else if (val === "=") {
      try {
        // Handle special scientific functions with degree-to-radian conversion
        let processedExpression = expression
          // Convert trig functions from degrees to radians
          .replace(/sin\(([^)]+)\)/g, (match, p1) => `Math.sin((${p1}) * Math.PI / 180)`)
          .replace(/cos\(([^)]+)\)/g, (match, p1) => `Math.cos((${p1}) * Math.PI / 180)`)
          .replace(/tan\(([^)]+)\)/g, (match, p1) => `Math.tan((${p1}) * Math.PI / 180)`)
          // Other functions
          .replace(/log\(/g, "Math.log10(")
          .replace(/ln\(/g, "Math.log(")
          .replace(/sqrt\(/g, "Math.sqrt(")
          // Constants - be careful with 'e' to not replace it in scientific notation
          .replace(/π/g, "Math.PI")
          .replace(/\be\b/g, "Math.E")  // Only replace standalone 'e'
          // Operators
          .replace(/\^/g, "**");

        // Safely evaluate the expression
        const result = Function('"use strict";return (' + processedExpression + ')')();

        // Format the result
        let newValue;
        if (Number.isFinite(result)) {
          // For scientific calculations, we need more precision
          if (Math.abs(result) < 0.000001 && result !== 0) {
            newValue = result.toExponential(6);
          } else if (Math.abs(result) > 1000000) {
            newValue = result.toExponential(6);
          } else {
            newValue = Number.isInteger(result)
              ? result.toString()
              : result.toFixed(8).replace(/\.?0+$/, "");
          }
        } else {
          newValue = "Error";
        }

        setExpression(newValue);
        onInputChange?.(newValue);
      } catch (error) {
        console.error("Scientific calculation error:", error);
        setExpression("Error");
        onInputChange?.("Error");
      }
    } else if (val === "x²") {
      try {
        const num = parseFloat(expression);
        if (!isNaN(num)) {
          const newValue = (num * num).toString();
          setExpression(newValue);
          onInputChange?.(newValue);
        }
      } catch {
        setExpression("Error");
        onInputChange?.("Error");
      }
    } else if (val === "x³") {
      try {
        const num = parseFloat(expression);
        if (!isNaN(num)) {
          const newValue = (num * num * num).toString();
          setExpression(newValue);
          onInputChange?.(newValue);
        }
      } catch {
        setExpression("Error");
        onInputChange?.("Error");
      }
    } else if (val === "√") {
      // Add sqrt function with opening parenthesis only
      const newValue = expression + "sqrt(";
      setExpression(newValue);
      onInputChange?.(newValue);
    } else if (["sin", "cos", "tan", "log", "ln"].includes(val)) {
      // Add function with opening parenthesis only
      const newValue = expression + val + "(";
      setExpression(newValue);
      onInputChange?.(newValue);
    } else if (val === "(") {
      // Add opening bracket only
      const newValue = expression + "(";
      setExpression(newValue);
      onInputChange?.(newValue);
    } else if (val === "π") {
      // Add pi constant
      const newValue = expression + "π";
      setExpression(newValue);
      onInputChange?.(newValue);
    } else if (val === "e") {
      // Add Euler's number constant
      const newValue = expression + "e";
      setExpression(newValue);
      onInputChange?.(newValue);
    } else {
      // Handle operators and numbers
      if (expression === "Error") {
        // Clear error before adding new input
        const newValue = val;
        setExpression(newValue);
        onInputChange?.(newValue);
      } else {
        // Prevent multiple consecutive operators
        const operators = ['+', '-', '*', '/', '%', '^'];
        const lastChar = expression.slice(-1);

        // If current input is an operator and last character is also an operator, replace it
        if (operators.includes(val) && operators.includes(lastChar)) {
          const newValue = expression.slice(0, -1) + val;
          setExpression(newValue);
          onInputChange?.(newValue);
        } else {
          const newValue = expression + val;
          setExpression(newValue);
          onInputChange?.(newValue);
        }
      }
    }
  };

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
    const calcHeight = calcRef.current?.offsetHeight || 500;

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
        backgroundColor: "rgba(255, 255, 255, 0.6)", // More transparent background
        userSelect: "none",
        zIndex: 1000,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        opacity: isHovered ? 1 : 0.7, // Even more transparent when not hovered
        transition: "opacity 0.3s ease, background-color 0.3s ease",
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
            onClick={() => window.dispatchEvent(new CustomEvent('closeCalculator', { detail: 'scientific' }))}
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
          Scientific Calculator
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
              backgroundColor: "rgba(255, 255, 255, 0.95)", // Keep result box clearly visible
              borderBottom: "1px solid rgba(221, 221, 221, 0.5)",
            }}
          >
            {expression || "0"}
          </div>

          {/* Buttons Grid - More transparent */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "0.5rem",
              padding: "1rem",
              backgroundColor: isHovered ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.5)",
              transition: "background-color 0.3s ease",
            }}
          >
            {/* Rest of the buttons code remains the same */}
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
                    ["sin", "cos", "tan", "π", "e", "^", "√", "log", "(", ")", "x²", "x³", "EXP", "×10^", "Ans"].includes(val)
                      ? "#e6f7ff"
                      : ["C", "⌫", "%", "±", "/", "*", "-", "+", "="].includes(val)
                        ? "#4da6ff"
                        : "#f2f2f2",
                  color:
                    ["C", "⌫", "%", "±", "/", "*", "-", "+", "="].includes(val)
                      ? "white"
                      : ["sin", "cos", "tan", "π", "e", "^", "√", "log", "(", ")", "x²", "x³", "EXP", "×10^", "Ans"].includes(val)
                        ? "#0066cc"
                        : "black",
                  cursor: "pointer",
                  fontWeight: ["sin", "cos", "tan", "π", "e", "^", "√", "log", "(", ")", "x²", "x³", "EXP", "×10^", "Ans"].includes(val) ? "bold" : "normal",
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

export default ScientificCalculator;