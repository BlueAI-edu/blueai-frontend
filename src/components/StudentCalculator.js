import React, { useState } from 'react';

const StudentCalculator = ({ mode = 'basic', onClose }) => {
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [scientificMode, setScientificMode] = useState(mode === 'scientific');

  const inputDigit = (digit) => {
    if (waitingForOperand) {
      setDisplay(String(digit));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(digit) : display + digit);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setMemory(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const clearEntry = () => {
    setDisplay('0');
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation) => {
    const inputValue = parseFloat(display);

    if (memory === null) {
      setMemory(inputValue);
    } else if (operation) {
      const currentValue = memory || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setMemory(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstOperand, secondOperand, operation) => {
    switch (operation) {
      case '+':
        return firstOperand + secondOperand;
      case '-':
        return firstOperand - secondOperand;
      case '*':
        return firstOperand * secondOperand;
      case '/':
        return firstOperand / secondOperand;
      case '%':
        return (firstOperand / 100) * secondOperand;
      case '^':
        return Math.pow(firstOperand, secondOperand);
      default:
        return secondOperand;
    }
  };

  const scientificOperation = (func) => {
    const value = parseFloat(display);
    let result;

    switch (func) {
      case 'sin':
        result = Math.sin(value * (Math.PI / 180));
        break;
      case 'cos':
        result = Math.cos(value * (Math.PI / 180));
        break;
      case 'tan':
        result = Math.tan(value * (Math.PI / 180));
        break;
      case 'log':
        result = Math.log10(value);
        break;
      case 'ln':
        result = Math.log(value);
        break;
      case 'sqrt':
        result = Math.sqrt(value);
        break;
      case 'square':
        result = value * value;
        break;
      case 'pi':
        result = Math.PI;
        break;
      case 'e':
        result = Math.E;
        break;
      case 'exp':
        result = Math.exp(value);
        break;
      case 'inv':
        result = 1 / value;
        break;
      case 'abs':
        result = Math.abs(value);
        break;
      case 'fact':
        result = factorial(value);
        break;
      default:
        return;
    }

    setDisplay(String(result));
    setWaitingForOperand(true);
  };

  const factorial = (n) => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  const toggleSign = () => {
    const value = parseFloat(display);
    setDisplay(String(value * -1));
  };

  const Button = ({ children, onClick, className = '', colSpan = 1 }) => (
    <button
      onClick={onClick}
      className={`
        ${colSpan === 2 ? 'col-span-2' : ''}
        px-4 py-3 rounded font-medium transition-colors
        ${className || 'bg-gray-100 hover:bg-gray-200 text-gray-900'}
      `}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg w-full max-w-sm">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900">Calculator</h4>
          {mode === 'scientific' && (
            <button
              onClick={() => setScientificMode(!scientificMode)}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              {scientificMode ? 'Basic' : 'Scientific'}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close calculator"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Display */}
      <div className="p-4 bg-gray-900 text-white">
        <div className="text-right text-3xl font-mono break-all">
          {display}
        </div>
      </div>

      {/* Scientific Functions (if enabled) */}
      {scientificMode && mode === 'scientific' && (
        <div className="p-3 bg-gray-50 border-b">
          <div className="grid grid-cols-5 gap-1">
            <Button onClick={() => scientificOperation('sin')} className="bg-blue-100 hover:bg-blue-200 text-blue-900 text-sm">sin</Button>
            <Button onClick={() => scientificOperation('cos')} className="bg-blue-100 hover:bg-blue-200 text-blue-900 text-sm">cos</Button>
            <Button onClick={() => scientificOperation('tan')} className="bg-blue-100 hover:bg-blue-200 text-blue-900 text-sm">tan</Button>
            <Button onClick={() => scientificOperation('log')} className="bg-blue-100 hover:bg-blue-200 text-blue-900 text-sm">log</Button>
            <Button onClick={() => scientificOperation('ln')} className="bg-blue-100 hover:bg-blue-200 text-blue-900 text-sm">ln</Button>
            <Button onClick={() => scientificOperation('sqrt')} className="bg-blue-100 hover:bg-blue-200 text-blue-900 text-sm">√</Button>
            <Button onClick={() => scientificOperation('square')} className="bg-blue-100 hover:bg-blue-200 text-blue-900 text-sm">x²</Button>
            <Button onClick={() => performOperation('^')} className="bg-blue-100 hover:bg-blue-200 text-blue-900 text-sm">xʸ</Button>
            <Button onClick={() => scientificOperation('pi')} className="bg-blue-100 hover:bg-blue-200 text-blue-900 text-sm">π</Button>
            <Button onClick={() => scientificOperation('e')} className="bg-blue-100 hover:bg-blue-200 text-blue-900 text-sm">e</Button>
          </div>
        </div>
      )}

      {/* Basic Keypad */}
      <div className="p-3">
        <div className="grid grid-cols-4 gap-2">
          <Button onClick={clearEntry} className="bg-red-100 hover:bg-red-200 text-red-900">CE</Button>
          <Button onClick={clear} className="bg-red-100 hover:bg-red-200 text-red-900">C</Button>
          <Button onClick={toggleSign} className="bg-gray-200 hover:bg-gray-300 text-gray-900">±</Button>
          <Button onClick={() => performOperation('/')} className="bg-orange-100 hover:bg-orange-200 text-orange-900">÷</Button>

          <Button onClick={() => inputDigit(7)}>7</Button>
          <Button onClick={() => inputDigit(8)}>8</Button>
          <Button onClick={() => inputDigit(9)}>9</Button>
          <Button onClick={() => performOperation('*')} className="bg-orange-100 hover:bg-orange-200 text-orange-900">×</Button>

          <Button onClick={() => inputDigit(4)}>4</Button>
          <Button onClick={() => inputDigit(5)}>5</Button>
          <Button onClick={() => inputDigit(6)}>6</Button>
          <Button onClick={() => performOperation('-')} className="bg-orange-100 hover:bg-orange-200 text-orange-900">−</Button>

          <Button onClick={() => inputDigit(1)}>1</Button>
          <Button onClick={() => inputDigit(2)}>2</Button>
          <Button onClick={() => inputDigit(3)}>3</Button>
          <Button onClick={() => performOperation('+')} className="bg-orange-100 hover:bg-orange-200 text-orange-900">+</Button>

          <Button onClick={() => inputDigit(0)} colSpan={2}>0</Button>
          <Button onClick={inputDot}>.</Button>
          <Button onClick={() => performOperation('=')} className="bg-blue-600 hover:bg-blue-700 text-white">=</Button>
        </div>
      </div>

      {/* Help Text */}
      <div className="p-3 bg-gray-50 border-t text-xs text-gray-600">
        <strong>Note:</strong> Calculator results are for reference. Show your working in the answer box.
      </div>
    </div>
  );
};

export default StudentCalculator;
