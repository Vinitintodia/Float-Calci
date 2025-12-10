import { createRoot } from 'react-dom/client';
import './index.css';
import FloatingCalculator from './components/FloatingCalculator';
import ScientificCalculator from './components/ScientificCalculator';
import FinancialCalculator from './components/FinancialCalculator';
import { useState } from 'react';

const Popup = () => {
    const [calculatorType, setCalculatorType] = useState<'basic' | 'scientific' | 'financial'>('basic');
    const [calculatorInput, setCalculatorInput] = useState("");

    const handleKeyboardInput = (key: string) => {
        console.log(`Key pressed: ${key}`);
    };

    return (
        <div style={{
            width: '400px',
            minHeight: '500px',
            background: '#f5f5f5',
            padding: '1rem'
        }}>
            {/* Calculator Type Selector */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem',
                background: 'white',
                padding: '0.5rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <button
                    onClick={() => setCalculatorType('basic')}
                    style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: 'none',
                        borderRadius: '4px',
                        background: calculatorType === 'basic' ? '#0EA5E9' : '#e5e7eb',
                        color: calculatorType === 'basic' ? 'white' : '#374151',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.875rem'
                    }}
                >
                    Basic
                </button>
                <button
                    onClick={() => setCalculatorType('scientific')}
                    style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: 'none',
                        borderRadius: '4px',
                        background: calculatorType === 'scientific' ? '#0EA5E9' : '#e5e7eb',
                        color: calculatorType === 'scientific' ? 'white' : '#374151',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.875rem'
                    }}
                >
                    Scientific
                </button>
                <button
                    onClick={() => setCalculatorType('financial')}
                    style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: 'none',
                        borderRadius: '4px',
                        background: calculatorType === 'financial' ? '#0EA5E9' : '#e5e7eb',
                        color: calculatorType === 'financial' ? 'white' : '#374151',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.875rem'
                    }}
                >
                    Financial
                </button>
            </div>

            {/* Calculator Display */}
            <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
                {calculatorType === 'basic' && (
                    <FloatingCalculator
                        input={calculatorInput}
                        onInputChange={setCalculatorInput}
                        onKeyboardInput={handleKeyboardInput}
                    />
                )}
                {calculatorType === 'scientific' && (
                    <ScientificCalculator
                        input={calculatorInput}
                        onInputChange={setCalculatorInput}
                        onKeyboardInput={handleKeyboardInput}
                    />
                )}
                {calculatorType === 'financial' && (
                    <FinancialCalculator
                        input={calculatorInput}
                        onInputChange={setCalculatorInput}
                        onKeyboardInput={handleKeyboardInput}
                    />
                )}
            </div>
        </div>
    );
};

createRoot(document.getElementById("root")!).render(<Popup />);
