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
  const [voiceText, setVoiceText] = useState("");

  // Add state for transparency
  const [isHovered, setIsHovered] = useState(false);

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
    if (onKeyboardInput) {
      onKeyboardInput = (key: string) => {
        handleClick(key);
      };
    }
  }, [onKeyboardInput]);

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
        // Handle special scientific functions
        let processedExpression = expression
          .replace(/sin\(/g, "Math.sin(")
          .replace(/cos\(/g, "Math.cos(")
          .replace(/tan\(/g, "Math.tan(")
          .replace(/log\(/g, "Math.log10(")
          .replace(/ln\(/g, "Math.log(")
          .replace(/sqrt\(/g, "Math.sqrt(")
          .replace(/π/g, "Math.PI")
          .replace(/e/g, "Math.E")
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
        const newValue = (num * num).toString();
        setExpression(newValue);
        onInputChange?.(newValue);
      } catch {
        setExpression("Error");
        onInputChange?.("Error");
      }
    } else if (val === "√") {
      // Add sqrt function with parenthesis
      const newValue = expression + "sqrt(";
      setExpression(newValue);
      onInputChange?.(newValue);
    } else if (["sin", "cos", "tan", "log", "ln"].includes(val)) {
      // Add function with parenthesis
      const newValue = expression + val + "(";
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
        const newValue = expression + val;
        setExpression(newValue);
        onInputChange?.(newValue);
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
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
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

  // Voice Recognition
  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech Recognition not supported");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceText(`"${transcript}"`);

      // Parse scientific voice commands
      if (transcript.toLowerCase().includes("sine of")) {
        const angle = transcript.toLowerCase().split("sine of")[1].trim();
        const newValue = `sin(${angle})`;
        setExpression(newValue);
        onInputChange?.(newValue);
      } else if (transcript.toLowerCase().includes("cosine of")) {
        const angle = transcript.toLowerCase().split("cosine of")[1].trim();
        const newValue = `cos(${angle})`;
        setExpression(newValue);
        onInputChange?.(newValue);
      } else if (transcript.toLowerCase().includes("square root of")) {
        const number = transcript.toLowerCase().split("square root of")[1].trim();
        const newValue = `√(${number})`;
        setExpression(newValue);
        onInputChange?.(newValue);
      }
    };
    recognition.start();
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
        onMouseDown={handleMouseDown}
        style={{
          padding: "1rem",
          background: isHovered ? "#f0f8ff" : "rgba(240, 248, 255, 0.7)",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          fontWeight: "bold",
          cursor: "move",
          borderBottom: "1px solid #ddd",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          transition: "background 0.3s ease",
        }}
      >
        <span role="img" aria-label="scientific calculator" style={{ fontSize: "1.2rem" }}>
          📐
        </span>
        SciCal
      </div>

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

      {/* Voice Input */}
      <div
        style={{
          padding: "1rem",
          borderTop: "1px solid #ddd",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontStyle: "italic",
          background: "#f9f9f9",
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}
      >
        <button
          onClick={handleVoice}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "1.5rem",
          }}
        >
          🎤
        </button>
        <span>{voiceText || '"Try saying: sine of 30 degrees"'}</span>
      </div>
    </div>
  );
};

export default ScientificCalculator;