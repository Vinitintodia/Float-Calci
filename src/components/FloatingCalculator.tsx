
import React, { useState, useRef, useEffect } from "react";

interface FloatingCalculatorProps {
  input?: string;
  onInputChange?: (value: string) => void;
  onKeyboardInput?: (key: string) => void;
}

const FloatingCalculator: React.FC<FloatingCalculatorProps> = ({ 
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
  const [voiceText, setVoiceText] = useState("");
  
  // Add blinking cursor state
  const [showCursor, setShowCursor] = useState(true);
  
  // Format display to prevent overflow
  const formatDisplay = (value: string): string => {
    // If the value is too long, convert to scientific notation
    if (value.length > 12) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return num.toExponential(6);
      }
    }
    return value;
  };
  
  // Blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 800); // Changed from 500ms to 800ms for slower blinking
    
    return () => clearInterval(cursorInterval);
  }, []);

  // Update local state when input prop changes
  useEffect(() => {
    if (input !== undefined) {
      setExpression(input);
    }
  }, [input]);

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
        'Backspace': 'C',
        '/': '/',
        '*': '*',
        '-': '-',
        '+': '+',
        '.': '.',
        '%': '%',
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

  if (onKeyboardInput) {
    // Create a handler function that will be called by the parent
    const handleKeyboardInput = (key: string) => {
      handleClick(key);
    };
    
    // Assign the handler to the onKeyboardInput prop
    onKeyboardInput = handleKeyboardInput;
  }

  // Calculator buttons
  const buttons = [
    ["C", "±", "%", "/"],
    ["7", "8", "9", "*"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "=", ""]
  ];

  // Handle button click
  const handleClick = (val: string) => {
    if (val === "C") {
      const newValue = "";
      setExpression(newValue);
      onInputChange?.(newValue);
    } else if (val === "±") {
      const newValue = expression.charAt(0) === "-" ? expression.slice(1) : "-" + expression;
      setExpression(newValue);
      onInputChange?.(newValue);
    } else if (val === "%") {
      try {
        const newValue = (parseFloat(expression) / 100).toString();
        setExpression(newValue);
        onInputChange?.(newValue);
      } catch {
        setExpression("Error");
        onInputChange?.("Error");
      }
    } else if (val === "=") {
      try {
        // Replace * and / with their proper JavaScript operators
        let sanitizedExpression = expression
          .replace(/×/g, "*")
          .replace(/÷/g, "/");
        
        // Safely evaluate the expression
        const result = Function('"use strict";return (' + sanitizedExpression + ')')();
        
        // Format the result
        let newValue;
        if (Number.isFinite(result)) {
          // Limit decimal places for readability
          newValue = Number.isInteger(result) 
            ? result.toString() 
            : result.toFixed(10).replace(/\.?0+$/, "");
        } else {
          newValue = "Error";
        }
        
        setExpression(newValue);
        onInputChange?.(newValue);
      } catch (error) {
        console.error("Calculation error:", error);
        setExpression("Error");
        onInputChange?.("Error");
      }
    } else {
      // Handle operators and numbers
      if (expression === "Error") {
        // Clear error before adding new input
        const newValue = val;
        setExpression(newValue);
        onInputChange?.(newValue);
      } else {
        // Simply append the new value
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

      // Optionally, you could parse voice to expression
      if (transcript.toLowerCase().includes("power")) {
        const [base, , , exp] = transcript.split(" ");
        const newValue = Math.pow(Number(base), Number(exp)).toString();
        setExpression(newValue);
        onInputChange?.(newValue);
      }
    };
    recognition.start();
  };

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
        width: 300,
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
        <span role="img" aria-label="calculator" style={{ fontSize: "1.2rem" }}>
          🧮
        </span>
        Basic
      </div>

      {/* Display - Keep this fully visible */}
      <div
        style={{
          padding: "1rem",
          fontSize: "1.5rem",
          textAlign: "right",
          borderBottom: "1px solid #eee",
          minHeight: "3.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
        }}
      >
        {formatDisplay(expression) || "0"}{showCursor ? "|" : ""}
      </div>

      {/* Buttons Grid - More transparent */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.5rem",
          padding: "1rem",
          backgroundColor: isHovered ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.5)",
          transition: "background-color 0.3s ease",
        }}
      >
        {buttons.flat().map((val, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(val)}
            style={{
              padding: "1rem",
              fontSize: "1.1rem",
              border: "none",
              borderRadius: 8,
              backgroundColor: ["C", "±", "%", "/", "*", "-", "+", "="].includes(val)
                ? "#4da6ff"
                : "#f2f2f2",
              color: ["C", "±", "%", "/", "*", "-", "+", "="].includes(val)
                ? "white"
                : "black",
              cursor: "pointer",
              position: "relative", // Ensure button is positioned properly
              zIndex: 10, // Higher z-index to ensure clicks are captured
              opacity: val === "" ? 0 : 1, // Hide empty buttons but keep their space
            }}
            disabled={val === ""}
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
        <span>{voiceText || '"Voice command here"'}</span>
      </div>
    </div>
  );
};

export default FloatingCalculator;
