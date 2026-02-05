import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { MathProblem, YearLevel, UserAnswerState, ActiveCell, ValidationResult, OperationType } from './types';
import { generateProblem, checkAnswer } from './services/mathUtils';
import VerticalProblem from './components/VerticalProblem';
import Keypad from './components/Keypad';

const HomeScreen = ({ onStart }: { onStart: (year: YearLevel, count: number, op: OperationType) => void }) => {
  const [year, setYear] = useState<YearLevel>(1);
  const [count, setCount] = useState<number>(10);
  const [op, setOp] = useState<OperationType>('add');

  const themes = {
    add: 'from-sky-400 to-indigo-500',
    subtract: 'from-rose-400 to-pink-600',
    multiply: 'from-orange-400 to-amber-600',
    divide: 'from-emerald-400 to-teal-600'
  };

  const tabs: {id: OperationType, label: string}[] = [
      { id: 'add', label: 'Tambah' },
      { id: 'subtract', label: 'Tolak' },
      { id: 'multiply', label: 'Darab' },
      { id: 'divide', label: 'Bahagi' }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b ${themes[op]} flex flex-col items-center justify-center p-6 text-white transition-colors duration-500`}>
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl w-full max-w-md shadow-xl border border-white/20">
        <h1 className="text-4xl font-bold text-center mb-1 drop-shadow-md">MathGym</h1>
        <p className="text-center text-white/80 mb-6 text-sm">Latihan Matematik Sekolah Rendah</p>
        <div className="flex bg-black/20 p-1 rounded-xl mb-6">
            {tabs.map(t => (
                <button
                    key={t.id}
                    onClick={() => setOp(t.id)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                        op === t.id ? 'bg-white text-slate-800 shadow-md' : 'text-white/70 hover:bg-white/10'
                    }`}
                >
                    {t.label}
                </button>
            ))}
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 uppercase tracking-wider text-white/80">Pilih Tahun</label>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((y) => (
                <button key={y} onClick={() => setYear(y as YearLevel)} className={`py-3 rounded-xl font-bold text-xl transition-all shadow-lg ${year === y ? 'bg-white text-slate-800 scale-105 ring-4 ring-white/30' : 'bg-white/20 hover:bg-white/30 text-white'}`}>{y}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 uppercase tracking-wider text-white/80">Jumlah Soalan</label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, 50].map((c) => (
                <button key={c} onClick={() => setCount(c)} className={`py-2 rounded-lg font-bold transition-all ${count === c ? 'bg-white text-slate-800 shadow-inner' : 'bg-white/20 hover:bg-white/30'}`}>{c}</button>
              ))}
            </div>
          </div>
          <button onClick={() => onStart(year, count, op)} className="w-full bg-yellow-400 hover:bg-yellow-300 text-yellow-900 text-2xl font-bold py-4 rounded-2xl shadow-[0_4px_0_rgb(161,98,7)] active:shadow-none active:translate-y-1 transition-all mt-4">Mula Latihan</button>
        </div>
      </div>
    </div>
  );
};

const QuizScreen = ({ 
  year, 
  count,
  op, 
  onFinish 
}: { 
  year: YearLevel, 
  count: number, 
  op: OperationType,
  onFinish: (results: { problem: MathProblem, userAnswer: UserAnswerState, validation: ValidationResult }[]) => void 
}) => {
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswerState>>({});
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [warnCol, setWarnCol] = useState<{probId: string, col: number, type?: 'slash' | 'carry' | 'borrow'} | null>(null);
  const [sifirOpen, setSifirOpen] = useState<Record<string, boolean>>({}); 
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getDivisionStartColumn = useCallback((problem: MathProblem): number => {
      if (problem.operation !== 'divide') return -1;
      const maxIdx = problem.columns.length - 1;
      const firstDigit = problem.columns[maxIdx].digit1 || 0;
      if (firstDigit < problem.num2) {
          return maxIdx - 1;
      }
      return maxIdx;
  }, []);

  useEffect(() => {
    const generated = Array.from({ length: count }).map((_, i) => generateProblem(year, i, op));
    setProblems(generated);
    const initialAnswers: Record<string, UserAnswerState> = {};
    const initialSifir: Record<string, boolean> = {};
    generated.forEach(p => {
      initialAnswers[p.id] = { 
          answerDigits: {}, 
          carryDigits: {},
          borrowDigits: {},
          remainderDigits: {},
          slashedCols: {}
      };
      initialSifir[p.id] = false;
    });
    setUserAnswers(initialAnswers);
    setSifirOpen(initialSifir);

    if (generated.length > 0) {
      const firstProb = generated[0];
      if (op === 'divide') {
           const startCol = getDivisionStartColumn(firstProb);
           setActiveCell({ problemId: firstProb.id, columnIndex: startCol, type: 'answer' });
      } else if (op === 'subtract') {
           setActiveCell({ problemId: firstProb.id, columnIndex: 0, type: 'answer' });
      } else {
          setActiveCell({ problemId: firstProb.id, columnIndex: 0, type: 'answer' });
      }
    }
  }, [year, count, op, getDivisionStartColumn]);

  const toggleSifir = (probId: string) => {
      setSifirOpen(prev => ({ ...prev, [probId]: !prev[probId] }));
  };

  const checkSubtractionReady = (problem: MathProblem, colIndex: number, userAns: UserAnswerState): { ready: boolean, redirect?: ActiveCell } => {
      const col = problem.columns[colIndex];
      const d1 = col.digit1 || 0;
      const d2 = col.digit2 || 0;
      if (d1 >= d2) return { ready: true };

      const neighborIdx = colIndex + 1;
      if (neighborIdx >= problem.columns.length) return { ready: true };

      if (!userAns.slashedCols[neighborIdx]) return { ready: false, redirect: undefined };
      if (!userAns.carryDigits[neighborIdx]) return { ready: false, redirect: { problemId: problem.id, columnIndex: neighborIdx, type: 'carry' } };
      if (!userAns.borrowDigits[colIndex]) return { ready: false, redirect: { problemId: problem.id, columnIndex: colIndex, type: 'borrow' } };

      return { ready: true };
  };

  const handleCellClick = (problemId: string, colIndex: number, type: 'answer' | 'carry' | 'borrow' | 'remainder') => {
      const prob = problems.find(p => p.id === problemId);
      const userAns = userAnswers[problemId];
      if (!prob || !userAns) return;

      if (op === 'divide' && type === 'answer') {
          const startCol = getDivisionStartColumn(prob);
          if (colIndex > startCol) {
              triggerWarning(problemId, startCol);
              return;
          }
      }

      if (type === 'answer') {
          if (op === 'divide') {
               const startCol = getDivisionStartColumn(prob);
               let target = -1;
               for (let i = startCol; i >= 0; i--) {
                   if (!userAns.answerDigits[i]) {
                       target = i;
                       break;
                   }
               }
               if (target !== -1 && colIndex < target) {
                   triggerWarning(problemId, target);
                   return;
               }
          }
          if (op === 'add' || op === 'subtract' || op === 'multiply') {
               let target = -1;
               for (let i = 0; i < prob.columns.length; i++) {
                   if (!userAns.answerDigits[i]) {
                       target = i;
                       break;
                   }
               }
               if (target !== -1 && colIndex > target) {
                   triggerWarning(problemId, target);
                   return;
               }
          }
      }

      if (op === 'subtract' && type === 'answer') {
           const status = checkSubtractionReady(prob, colIndex, userAns);
           if (!status.ready) {
               if (status.redirect) {
                   setActiveCell(status.redirect);
               } else {
                   triggerWarning(problemId, colIndex + 1, 'slash');
               }
               return;
           }
      }

      setActiveCell({ problemId, columnIndex: colIndex, type });
  };

  const handleToggleSlash = (problemId: string, colIndex: number) => {
      setUserAnswers(prev => {
          const current = prev[problemId];
          const isSlashed = !current.slashedCols[colIndex];
          
          if (op === 'divide' && isSlashed) {
              setTimeout(() => {
                  setActiveCell({ problemId, columnIndex: colIndex, type: 'remainder' });
              }, 50);
          } else if (op === 'subtract' && isSlashed) {
              setTimeout(() => {
                  setActiveCell({ problemId, columnIndex: colIndex, type: 'carry' });
              }, 50);
          }

          return {
              ...prev,
              [problemId]: { ...current, slashedCols: { ...current.slashedCols, [colIndex]: isSlashed } }
          };
      });
  };

  const handleKeyPress = (key: string) => {
    if (!activeCell) return;
    setUserAnswers(prev => {
      const currentProblemAns = prev[activeCell.problemId];
      let targetRecord: 'answerDigits' | 'carryDigits' | 'borrowDigits' | 'remainderDigits';
      
      if (activeCell.type === 'answer') targetRecord = 'answerDigits';
      else if (activeCell.type === 'carry') targetRecord = 'carryDigits';
      else if (activeCell.type === 'borrow') targetRecord = 'borrowDigits';
      else targetRecord = 'remainderDigits';
      
      const updatedRecord = { ...currentProblemAns[targetRecord], [activeCell.columnIndex]: key };
      
      // Auto-Slash Logic for Division
      let updatedSlashedCols = currentProblemAns.slashedCols;
      if (op === 'divide' && activeCell.type === 'answer' && key !== '') {
          updatedSlashedCols = { ...updatedSlashedCols, [activeCell.columnIndex]: true };
      }

      const nextState = { 
          ...prev, 
          [activeCell.problemId]: { 
              ...currentProblemAns, 
              [targetRecord]: updatedRecord,
              slashedCols: updatedSlashedCols
          } 
      };

      if (key !== '') {
          const prob = problems.find(p => p.id === activeCell.problemId);
          if (op === 'divide' && prob) {
               if (activeCell.type === 'answer') {
                   const col = prob.columns[activeCell.columnIndex];
                   if (col.correctCarryOut === 0) {
                       const nextIdx = activeCell.columnIndex - 1;
                       if (nextIdx >= 0) {
                           setTimeout(() => setActiveCell({ problemId: activeCell.problemId, columnIndex: nextIdx, type: 'answer' }), 150);
                       }
                   } else {
                        // Move to remainder if needed, else stop
                        setTimeout(() => setActiveCell({ problemId: activeCell.problemId, columnIndex: activeCell.columnIndex, type: 'remainder' }), 50);
                   }
               }
               if (activeCell.type === 'remainder') {
                   const nextIdx = activeCell.columnIndex - 1;
                   if (nextIdx >= 0) {
                       setTimeout(() => setActiveCell({ problemId: activeCell.problemId, columnIndex: nextIdx, type: 'answer' }), 150);
                   }
               }
          } else if (op === 'subtract' && prob) {
              if (activeCell.type === 'carry') {
                   setTimeout(() => setActiveCell({ ...activeCell, columnIndex: activeCell.columnIndex - 1, type: 'borrow' }), 150);
              }
              if (activeCell.type === 'borrow') {
                  setTimeout(() => setActiveCell({ ...activeCell, type: 'answer' }), 150);
              }
              if (activeCell.type === 'answer') {
                  const nextColIdx = activeCell.columnIndex + 1;
                  if (nextColIdx < prob.columns.length) {
                       setTimeout(() => setActiveCell({ problemId: activeCell.problemId, columnIndex: nextColIdx, type: 'answer' }), 150);
                  }
              }
          } else {
              if (activeCell.type === 'answer') {
                   const nextColIdx = activeCell.columnIndex + 1;
                   if (prob && nextColIdx < prob.columns.length) {
                        if (op === 'multiply' && prob.columns[activeCell.columnIndex].correctCarryOut > 0) {
                            setTimeout(() => setActiveCell({ problemId: activeCell.problemId, columnIndex: nextColIdx, type: 'carry' }), 150);
                        } else {
                            setTimeout(() => setActiveCell({ problemId: activeCell.problemId, columnIndex: nextColIdx, type: 'answer' }), 150);
                        }
                   }
              }
              if (activeCell.type === 'carry' && op === 'multiply') {
                  setTimeout(() => setActiveCell({ ...activeCell, type: 'answer' }), 150);
              }
          }
      }
      return nextState;
    });
  };

  const handleDelete = () => {
    if (!activeCell) return;
    setUserAnswers(prev => {
        const cur = prev[activeCell.problemId];
        let target: 'answerDigits' | 'carryDigits' | 'borrowDigits' | 'remainderDigits' = 'answerDigits';
        if (activeCell.type === 'carry') target = 'carryDigits';
        if (activeCell.type === 'borrow') target = 'borrowDigits';
        if (activeCell.type === 'remainder') target = 'remainderDigits';
        const updated = { ...cur[target] };
        delete updated[activeCell.columnIndex];
        return { ...prev, [activeCell.problemId]: { ...cur, [target]: updated } };
    });
  };

  const handleNext = () => { };

  const triggerWarning = (probId: string, col: number, type?: 'slash' | 'carry' | 'borrow') => {
      setWarnCol({ probId, col, type });
      setTimeout(() => setWarnCol(null), 1000);
  };

  const handleSubmit = () => {
    const res = problems.map(p => ({ problem: p, userAnswer: userAnswers[p.id], validation: checkAnswer(p, userAnswers[p.id]) }));
    onFinish(res);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="bg-white p-4 shadow-sm z-10 flex justify-between items-center border-b border-gray-100">
        <div>
          <h2 className={`font-bold text-lg text-slate-700`}>{op === 'divide' ? 'Latihan Bahagi' : 'Latihan Matematik'}</h2>
          <p className="text-slate-500 text-xs">Tahun {year} • {problems.length} Soalan</p>
        </div>
        <button onClick={handleSubmit} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-bold shadow-md">Semak ✓</button>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 pb-40 no-scrollbar">
        <div className="w-full max-w-full mx-auto flex flex-col items-center">
            {problems.map((prob) => (
            <div key={prob.id} id={`prob-${prob.id}`}>
                <VerticalProblem
                    problem={prob}
                    userAnswers={userAnswers[prob.id]}
                    activeCell={activeCell}
                    onCellClick={(col, type) => handleCellClick(prob.id, col, type)}
                    onToggleSlash={(col) => handleToggleSlash(prob.id, col)}
                    isSubmitted={false}
                    warnCol={warnCol?.probId === prob.id ? warnCol.col : null}
                    showSifir={sifirOpen[prob.id]}
                    onToggleSifir={op !== 'add' && op !== 'subtract' ? () => toggleSifir(prob.id) : undefined}
                />
            </div>
            ))}
        </div>
      </div>

      <Keypad onKeyPress={handleKeyPress} onDelete={handleDelete} onNext={handleNext} />
    </div>
  );
};

const ResultScreen = ({ results, onRestart }: { results: { problem: MathProblem, userAnswer: UserAnswerState, validation: ValidationResult }[], onRestart: () => void }) => {
  const totalCorrect = results.filter(r => r.validation.isCorrect).length;
  const percentage = Math.round((totalCorrect / results.length) * 100);
  let message = "Teruskan Usaha!", emoji = "💪";
  if (percentage === 100) { message = "Hebat Sekali!"; emoji = "🏆"; }
  else if (percentage >= 80) { message = "Syabas!"; emoji = "🌟"; }
  else if (percentage >= 50) { message = "Bagus!"; emoji = "👍"; }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-slate-800 p-8 text-white rounded-b-[3rem] shadow-xl text-center z-10 sticky top-0">
        <div className="text-6xl mb-2">{emoji}</div>
        <h2 className="text-3xl font-bold mb-1">{message}</h2>
        <div className="text-xl opacity-90">{totalCorrect} / {results.length} Betul</div>
        <div className="mt-6 flex justify-center gap-4">
             <button onClick={onRestart} className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-all">Mula Semula</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full pb-10">
        <h3 className="text-slate-500 font-bold mb-4 mt-4 uppercase tracking-wider text-sm">Semakan Jawapan</h3>
        {results.map((res) => (
            <div key={res.problem.id} className="relative">
                 <div className={`absolute top-0 right-0 p-2 rounded-bl-xl z-10 ${res.validation.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{res.validation.isCorrect ? '✓' : '✗'}</div>
                <VerticalProblem problem={res.problem} userAnswers={res.userAnswer} activeCell={null} onCellClick={() => {}} isSubmitted={true} validationResult={res.validation} />
            </div>
        ))}
      </div>
    </div>
  );
};

const App = () => {
  const [screen, setScreen] = useState<'home' | 'quiz' | 'result'>('home');
  const [config, setConfig] = useState<{ year: YearLevel, count: number, op: OperationType }>({ year: 1, count: 10, op: 'add' });
  const [results, setResults] = useState<any[]>([]);

  const startQuiz = (year: YearLevel, count: number, op: OperationType) => { setConfig({ year, count, op }); setScreen('quiz'); };
  const finishQuiz = (res: any[]) => { setResults(res); setScreen('result'); };
  const restart = () => { setScreen('home'); setResults([]); };

  return (
    <>
      {screen === 'home' && <HomeScreen onStart={startQuiz} />}
      {screen === 'quiz' && <QuizScreen year={config.year} count={config.count} op={config.op} onFinish={finishQuiz} />}
      {screen === 'result' && <ResultScreen results={results} onRestart={restart} />}
    </>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);

export default App;