import { useState, useRef, useEffect, useCallback } from 'react';

const StudentCalculator = ({ onClose, defaultPosition }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [memory, setMemory] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [angleMode, setAngleMode] = useState('deg'); // 'deg' | 'rad'
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Dragging
  const panelRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const [pos, setPos] = useState(defaultPosition || { x: null, y: null });

  useEffect(() => {
    const onMove = (e) => {
      if (!dragState.current.dragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const dx = clientX - dragState.current.startX;
      const dy = clientY - dragState.current.startY;
      setPos({ x: dragState.current.origX + dx, y: dragState.current.origY + dy });
    };
    const onUp = () => { dragState.current.dragging = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const startDrag = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = panelRef.current.getBoundingClientRect();
    dragState.current = { dragging: true, startX: clientX, startY: clientY, origX: rect.left, origY: rect.top };
    e.preventDefault();
  };

  const toRad = (val) => angleMode === 'deg' ? val * (Math.PI / 180) : val;

  const inputDigit = (digit) => {
    if (waitingForOperand) {
      setDisplay(String(digit));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(digit) : display + digit);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) { setDisplay('0.'); setWaitingForOperand(false); return; }
    if (!display.includes('.')) setDisplay(display + '.');
  };

  const clear = () => {
    setDisplay('0'); setExpression(''); setMemory(null);
    setOperation(null); setWaitingForOperand(false);
  };
  const clearEntry = () => { setDisplay('0'); };
  const backspace = () => {
    if (display.length > 1) setDisplay(display.slice(0, -1));
    else setDisplay('0');
  };

  const calculate = (a, b, op) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? 'Error' : a / b;
      case '%': return (a / 100) * b;
      case '^': return Math.pow(a, b);
      default: return b;
    }
  };

  const formatResult = (val) => {
    if (typeof val === 'string') return val;
    if (!isFinite(val)) return 'Error';
    // Avoid floating point noise
    const rounded = parseFloat(val.toPrecision(12));
    return String(rounded);
  };

  const performOperation = (nextOp) => {
    const inputValue = parseFloat(display);
    if (memory === null) {
      setMemory(inputValue);
      setExpression(`${display} ${nextOp}`);
    } else if (operation) {
      const result = calculate(memory, inputValue, operation);
      const formatted = formatResult(result);
      setDisplay(formatted);
      setMemory(parseFloat(formatted));
      setExpression(`${formatted} ${nextOp}`);
      if (nextOp === '=') {
        setHistory(h => [`${expression} ${display} = ${formatted}`, ...h].slice(0, 20));
        setMemory(null); setOperation(null); setExpression('');
        setWaitingForOperand(false);
        return;
      }
    }
    setWaitingForOperand(true);
    setOperation(nextOp);
  };

  const scientificOp = (func) => {
    const value = parseFloat(display);
    let result;
    switch (func) {
      case 'sin':   result = Math.sin(toRad(value)); break;
      case 'cos':   result = Math.cos(toRad(value)); break;
      case 'tan':   result = Math.tan(toRad(value)); break;
      case 'asin':  result = angleMode === 'deg' ? Math.asin(value) * (180 / Math.PI) : Math.asin(value); break;
      case 'acos':  result = angleMode === 'deg' ? Math.acos(value) * (180 / Math.PI) : Math.acos(value); break;
      case 'atan':  result = angleMode === 'deg' ? Math.atan(value) * (180 / Math.PI) : Math.atan(value); break;
      case 'log':   result = Math.log10(value); break;
      case 'log2':  result = Math.log2(value); break;
      case 'ln':    result = Math.log(value); break;
      case 'sqrt':  result = Math.sqrt(value); break;
      case 'cbrt':  result = Math.cbrt(value); break;
      case 'sq':    result = value * value; break;
      case 'cube':  result = value * value * value; break;
      case 'inv':   result = value === 0 ? 'Error' : 1 / value; break;
      case 'abs':   result = Math.abs(value); break;
      case 'fact':  result = factorial(value); break;
      case 'exp':   result = Math.exp(value); break;
      case 'pi':    result = Math.PI; break;
      case 'e':     result = Math.E; break;
      case 'ceil':  result = Math.ceil(value); break;
      case 'floor': result = Math.floor(value); break;
      case 'neg':   result = -value; break;
      case '10x':   result = Math.pow(10, value); break;
      case 'ex':    result = Math.exp(value); break;
      default: return;
    }
    const formatted = formatResult(result);
    setDisplay(formatted);
    setWaitingForOperand(true);
  };

  const factorial = (n) => {
    if (n < 0 || !Number.isInteger(n)) return 'Error';
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  };

  const Btn = ({ children, onClick, className = '', wide = false, title }) => (
    <button
      onClick={onClick}
      title={title}
      className={`
        ${wide ? 'col-span-2' : ''}
        flex items-center justify-center
        px-1 py-2 rounded text-xs font-medium transition-all active:scale-95
        ${className || 'bg-gray-100 hover:bg-gray-200 text-gray-900'}
      `}
    >
      {children}
    </button>
  );

  const posStyle = pos.x !== null
    ? { position: 'fixed', left: pos.x, top: pos.y, bottom: 'auto', right: 'auto' }
    : { position: 'fixed', left: 16, bottom: 100 };

  return (
    <div
      ref={panelRef}
      style={{ ...posStyle, zIndex: 45, width: 280, userSelect: 'none' }}
      className="bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Drag handle / header */}
      <div
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className="flex items-center justify-between px-3 py-2 bg-purple-700 text-white cursor-move shrink-0 select-none"
      >
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 opacity-60" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
          </svg>
          <span className="text-xs font-semibold tracking-wide">Scientific Calculator</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHistory(h => !h)}
            className="text-xs px-1.5 py-0.5 rounded bg-purple-600 hover:bg-purple-500"
            title="History"
          >⏱</button>
          <button
            onClick={() => setAngleMode(m => m === 'deg' ? 'rad' : 'deg')}
            className="text-xs px-1.5 py-0.5 rounded bg-purple-600 hover:bg-purple-500"
          >{angleMode.toUpperCase()}</button>
          <button onClick={onClose} className="ml-1 p-0.5 rounded hover:bg-purple-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="bg-gray-900 text-green-400 text-xs font-mono p-2 max-h-28 overflow-y-auto">
          {history.length === 0
            ? <span className="text-gray-500">No history yet</span>
            : history.map((h, i) => <div key={i} className="truncate">{h}</div>)
          }
        </div>
      )}

      {/* Display */}
      <div className="bg-gray-900 px-3 py-2 text-right">
        <div className="text-gray-400 text-xs font-mono h-4 truncate">{expression}</div>
        <div className="text-white text-2xl font-mono break-all leading-tight mt-0.5">{display}</div>
      </div>

      {/* Scientific rows */}
      <div className="bg-gray-50 border-b px-2 py-1.5">
        <div className="grid grid-cols-5 gap-1">
          <Btn onClick={() => scientificOp('sin')} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-900">sin</Btn>
          <Btn onClick={() => scientificOp('cos')} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-900">cos</Btn>
          <Btn onClick={() => scientificOp('tan')} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-900">tan</Btn>
          <Btn onClick={() => scientificOp('log')} className="bg-indigo-100 hover:bg-indigo-200 text-indigo-900">log</Btn>
          <Btn onClick={() => scientificOp('ln')}  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-900">ln</Btn>
          <Btn onClick={() => scientificOp('asin')} className="bg-violet-100 hover:bg-violet-200 text-violet-900" title="Inverse sin">sin⁻¹</Btn>
          <Btn onClick={() => scientificOp('acos')} className="bg-violet-100 hover:bg-violet-200 text-violet-900" title="Inverse cos">cos⁻¹</Btn>
          <Btn onClick={() => scientificOp('atan')} className="bg-violet-100 hover:bg-violet-200 text-violet-900" title="Inverse tan">tan⁻¹</Btn>
          <Btn onClick={() => scientificOp('10x')} className="bg-violet-100 hover:bg-violet-200 text-violet-900" title="10 to the power x">10ˣ</Btn>
          <Btn onClick={() => scientificOp('ex')}  className="bg-violet-100 hover:bg-violet-200 text-violet-900" title="e to the power x">eˣ</Btn>

          <Btn onClick={() => scientificOp('sqrt')} className="bg-teal-100 hover:bg-teal-200 text-teal-900">√x</Btn>
          <Btn onClick={() => scientificOp('cbrt')} className="bg-teal-100 hover:bg-teal-200 text-teal-900">∛x</Btn>
          <Btn onClick={() => scientificOp('sq')}   className="bg-teal-100 hover:bg-teal-200 text-teal-900">x²</Btn>
          <Btn onClick={() => scientificOp('cube')} className="bg-teal-100 hover:bg-teal-200 text-teal-900">x³</Btn>
          <Btn onClick={() => performOperation('^')} className="bg-teal-100 hover:bg-teal-200 text-teal-900">xʸ</Btn>

          <Btn onClick={() => scientificOp('pi')}   className="bg-amber-100 hover:bg-amber-200 text-amber-900">π</Btn>
          <Btn onClick={() => scientificOp('e')}    className="bg-amber-100 hover:bg-amber-200 text-amber-900">e</Btn>
          <Btn onClick={() => scientificOp('fact')} className="bg-amber-100 hover:bg-amber-200 text-amber-900">n!</Btn>
          <Btn onClick={() => scientificOp('inv')}  className="bg-amber-100 hover:bg-amber-200 text-amber-900">1/x</Btn>
          <Btn onClick={() => scientificOp('abs')}  className="bg-amber-100 hover:bg-amber-200 text-amber-900">|x|</Btn>
        </div>
      </div>

      {/* Basic keypad */}
      <div className="p-2">
        <div className="grid grid-cols-4 gap-1.5">
          <Btn onClick={clearEntry} className="bg-red-100 hover:bg-red-200 text-red-900">CE</Btn>
          <Btn onClick={clear}      className="bg-red-100 hover:bg-red-200 text-red-900">C</Btn>
          <Btn onClick={backspace}  className="bg-gray-200 hover:bg-gray-300 text-gray-800">⌫</Btn>
          <Btn onClick={() => performOperation('/')} className="bg-orange-100 hover:bg-orange-200 text-orange-900">÷</Btn>

          <Btn onClick={() => inputDigit(7)}>7</Btn>
          <Btn onClick={() => inputDigit(8)}>8</Btn>
          <Btn onClick={() => inputDigit(9)}>9</Btn>
          <Btn onClick={() => performOperation('*')} className="bg-orange-100 hover:bg-orange-200 text-orange-900">×</Btn>

          <Btn onClick={() => inputDigit(4)}>4</Btn>
          <Btn onClick={() => inputDigit(5)}>5</Btn>
          <Btn onClick={() => inputDigit(6)}>6</Btn>
          <Btn onClick={() => performOperation('-')} className="bg-orange-100 hover:bg-orange-200 text-orange-900">−</Btn>

          <Btn onClick={() => inputDigit(1)}>1</Btn>
          <Btn onClick={() => inputDigit(2)}>2</Btn>
          <Btn onClick={() => inputDigit(3)}>3</Btn>
          <Btn onClick={() => performOperation('+')} className="bg-orange-100 hover:bg-orange-200 text-orange-900">+</Btn>

          <Btn onClick={() => scientificOp('neg')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">±</Btn>
          <Btn onClick={() => inputDigit(0)}>0</Btn>
          <Btn onClick={inputDot}>.</Btn>
          <Btn onClick={() => performOperation('=')} className="bg-purple-700 hover:bg-purple-800 text-white font-bold">=</Btn>
        </div>
      </div>

      <div className="px-3 pb-2 text-xs text-gray-400 text-center">
        Results for reference — show working in your answer
      </div>
    </div>
  );
};

export default StudentCalculator;