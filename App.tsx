import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { MathProblem, YearLevel, UserAnswerState, ActiveCell, ValidationResult, OperationType, QuizMode } from './types';
import { generateProblem, checkAnswer } from './services/mathUtils';
import VerticalProblem from './components/VerticalProblem';
import Keypad from './components/Keypad';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import { loadStudents, getClasses, getStudentsByClass, Student, saveScore } from './services/firebase';

const HomeScreen = ({ onStart, onAdminClick }: { onStart: (year: YearLevel, count: number, op: OperationType, quizMode: QuizMode, student?: Student) => void, onAdminClick: () => void }) => {
  const [year, setYear] = useState<YearLevel>(1);
  const [count, setCount] = useState<number>(10);
  const [op, setOp] = useState<OperationType>('add');
  const [quizMode, setQuizMode] = useState<QuizMode>('check-all');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      const studentList = await loadStudents();
      setStudents(studentList);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const classes = getClasses(students);
  const studentsInClass = selectedClass ? getStudentsByClass(students, selectedClass) : [];

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
      {/* Admin Button */}
      <button
        onClick={onAdminClick}
        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold transition-all border border-white/30"
      >
        Admin 🔐
      </button>

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
          {/* Student Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2 uppercase tracking-wider text-white/80">Pilih Murid (Opsional)</label>
            {loading ? (
              <div className="text-center text-white/70 text-sm py-2">Memuatkan senarai murid...</div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedStudent(undefined);
                  }}
                  className="w-full bg-white/20 text-white border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="" className="text-slate-800">-- Pilih Kelas --</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls} className="text-slate-800">{cls}</option>
                  ))}
                </select>
                {selectedClass && (
                  <select
                    value={selectedStudent?.id || ''}
                    onChange={(e) => {
                      const student = studentsInClass.find(s => s.id === e.target.value);
                      setSelectedStudent(student);
                    }}
                    className="w-full bg-white/20 text-white border border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="" className="text-slate-800">-- Pilih Nama --</option>
                    {studentsInClass.map((student) => (
                      <option key={student.id} value={student.id} className="text-slate-800">{student.nama}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
            {!selectedStudent && (
              <p className="text-white/60 text-xs mt-2">* Markah tidak akan direkod jika tidak pilih murid</p>
            )}
          </div>

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
          <div>
            <label className="block text-sm font-semibold mb-2 uppercase tracking-wider text-white/80">Mod Semakan</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setQuizMode('check-all')}
                className={`py-3 px-2 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                  quizMode === 'check-all' ? 'bg-white text-slate-800 scale-105 ring-4 ring-white/30' : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                Semak Semua
              </button>
              <button
                onClick={() => setQuizMode('check-one')}
                className={`py-3 px-2 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                  quizMode === 'check-one' ? 'bg-white text-slate-800 scale-105 ring-4 ring-white/30' : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                Satu-satu
              </button>
            </div>
            <p className="text-white/60 text-xs mt-2">
              {quizMode === 'check-all'
                ? '* Semak semua soalan sekaligus'
                : '* Semak dan kunci jawapan setiap soalan'}
            </p>
          </div>
          <button onClick={() => onStart(year, count, op, quizMode, selectedStudent)} className="w-full bg-yellow-400 hover:bg-yellow-300 text-yellow-900 text-2xl font-bold py-4 rounded-2xl shadow-[0_4px_0_rgb(161,98,7)] active:shadow-none active:translate-y-1 transition-all mt-4">Mula Latihan</button>
        </div>
      </div>
    </div>
  );
};

const QuizScreen = ({
  year,
  count,
  op,
  quizMode,
  student,
  onFinish
}: {
  year: YearLevel,
  count: number,
  op: OperationType,
  quizMode: QuizMode,
  student?: Student,
  onFinish: (results: { problem: MathProblem, userAnswer: UserAnswerState, validation: ValidationResult }[], student?: Student) => void
}) => {
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswerState>>({});
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [warnCol, setWarnCol] = useState<{probId: string, col: number, type?: 'slash' | 'carry' | 'borrow'} | null>(null);
  const [sifirOpen, setSifirOpen] = useState<Record<string, boolean>>({});
  const [lockedProblems, setLockedProblems] = useState<Set<string>>(new Set()); // Problems that have been checked
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({}); // Results for checked problems
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

  // Check if there's a blinking field that must be filled first
  const checkBlinkingField = (problem: MathProblem, colIndex: number, type: 'answer' | 'carry' | 'borrow' | 'remainder', userAns: UserAnswerState): { hasBlinking: boolean, redirect?: ActiveCell } => {
      // Only check when user tries to fill answer field
      if (type !== 'answer') return { hasBlinking: false };

      if (op === 'add') {
          // Check if previous column has unfilled carry
          const prevColIndex = colIndex - 1;
          if (prevColIndex >= 0) {
              const prevCol = problem.columns[prevColIndex];
              const prevAns = userAns.answerDigits[prevColIndex];
              if (prevCol.correctCarryOut > 0 && prevAns && prevAns !== '') {
                  if (!userAns.carryDigits[colIndex] || userAns.carryDigits[colIndex] === '') {
                      return { hasBlinking: true, redirect: { problemId: problem.id, columnIndex: colIndex, type: 'carry' } };
                  }
              }
          }
      } else if (op === 'subtract') {
          // Check if there's unfilled carry or borrow from slashed column
          if (userAns.slashedCols[colIndex] && (!userAns.carryDigits[colIndex] || userAns.carryDigits[colIndex] === '')) {
              return { hasBlinking: true, redirect: { problemId: problem.id, columnIndex: colIndex, type: 'carry' } };
          }
          const nextColIndex = colIndex + 1;
          if (userAns.slashedCols[nextColIndex] && userAns.carryDigits[nextColIndex] && (!userAns.borrowDigits[colIndex] || userAns.borrowDigits[colIndex] === '')) {
              return { hasBlinking: true, redirect: { problemId: problem.id, columnIndex: colIndex, type: 'borrow' } };
          }
      } else if (op === 'divide') {
          // Check if there's unfilled remainder
          if (userAns.slashedCols[colIndex] && problem.columns[colIndex].correctCarryOut > 0) {
              if (!userAns.remainderDigits[colIndex] || userAns.remainderDigits[colIndex] === '') {
                  return { hasBlinking: true, redirect: { problemId: problem.id, columnIndex: colIndex, type: 'remainder' } };
              }
          }
      } else if (op === 'multiply') {
          // Check if previous column has unfilled carry
          const prevColIndex = colIndex - 1;
          if (prevColIndex >= 0) {
              const prevCol = problem.columns[prevColIndex];
              const prevAns = userAns.answerDigits[prevColIndex];
              if (prevCol.correctCarryOut > 0 && prevAns && prevAns !== '') {
                  if (!userAns.carryDigits[colIndex] || userAns.carryDigits[colIndex] === '') {
                      return { hasBlinking: true, redirect: { problemId: problem.id, columnIndex: colIndex, type: 'carry' } };
                  }
              }
          }
      }

      return { hasBlinking: false };
  };

  const handleCellClick = (problemId: string, colIndex: number, type: 'answer' | 'carry' | 'borrow' | 'remainder') => {
      const prob = problems.find(p => p.id === problemId);
      const userAns = userAnswers[problemId];
      if (!prob || !userAns) return;

      // Prevent editing locked problems in check-one mode
      if (quizMode === 'check-one' && lockedProblems.has(problemId)) {
        return;
      }

      // Check if there's a blinking field that must be filled first
      const blinkingCheck = checkBlinkingField(prob, colIndex, type, userAns);
      if (blinkingCheck.hasBlinking && blinkingCheck.redirect) {
          setActiveCell(blinkingCheck.redirect);
          triggerWarning(problemId, blinkingCheck.redirect.columnIndex);
          return;
      }

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

  // Get columns that are blocked (answer box blocked until carry/borrow filled)
  const getBlockedAnswerColumns = (problem: MathProblem, userAns: UserAnswerState): Set<number> => {
    const blockedCols = new Set<number>();

    if (op === 'add' || op === 'multiply') {
      // Block answer column if previous column has unfilled carry
      for (let i = 0; i < problem.columns.length; i++) {
        const prevColIndex = i - 1;
        if (prevColIndex >= 0) {
          const prevCol = problem.columns[prevColIndex];
          const prevAns = userAns.answerDigits[prevColIndex];
          if (prevCol.correctCarryOut > 0 && prevAns && prevAns !== '') {
            if (!userAns.carryDigits[i] || userAns.carryDigits[i] === '') {
              blockedCols.add(i);
            }
          }
        }
      }
    } else if (op === 'subtract') {
      // Block answer column if slashed but carry not filled, or if borrow not filled
      for (let i = 0; i < problem.columns.length; i++) {
        if (userAns.slashedCols[i] && (!userAns.carryDigits[i] || userAns.carryDigits[i] === '')) {
          blockedCols.add(i);
        }
        const nextColIndex = i + 1;
        if (userAns.slashedCols[nextColIndex] && userAns.carryDigits[nextColIndex] && (!userAns.borrowDigits[i] || userAns.borrowDigits[i] === '')) {
          blockedCols.add(i);
        }
      }
    } else if (op === 'divide') {
      // Block answer column if remainder needs to be filled
      for (let i = 0; i < problem.columns.length; i++) {
        if (userAns.slashedCols[i] && problem.columns[i].correctCarryOut > 0) {
          if (!userAns.remainderDigits[i] || userAns.remainderDigits[i] === '') {
            // Block the next column (to the right in display, lower index)
            if (i > 0) {
              blockedCols.add(i - 1);
            }
          }
        }
      }
    }

    return blockedCols;
  };

  // Check if a problem is complete (all required fields filled)
  const isProblemComplete = (problem: MathProblem, userAns: UserAnswerState): boolean => {
    // Check all answer digits are filled
    for (let i = 0; i < problem.columns.length; i++) {
      if (!userAns.answerDigits[i]) return false;
    }

    // Check required carries/borrows/remainders based on operation
    if (op === 'add' || op === 'multiply') {
      for (let i = 0; i < problem.columns.length; i++) {
        const col = problem.columns[i];
        if (col.correctCarryOut > 0 && i + 1 < problem.columns.length) {
          if (!userAns.carryDigits[i + 1]) return false;
        }
      }
    } else if (op === 'subtract') {
      for (let i = 0; i < problem.columns.length; i++) {
        const col = problem.columns[i];
        const d1 = col.digit1 || 0;
        const d2 = col.digit2 || 0;
        if (d1 < d2) {
          const nextIdx = i + 1;
          if (!userAns.slashedCols[nextIdx]) return false;
          if (!userAns.carryDigits[nextIdx]) return false;
          if (!userAns.borrowDigits[i]) return false;
        }
      }
    } else if (op === 'divide') {
      for (let i = 0; i < problem.columns.length; i++) {
        if (!userAns.slashedCols[i]) return false;
        const col = problem.columns[i];
        if (col.correctCarryOut > 0) {
          if (!userAns.remainderDigits[i]) return false;
        }
      }
    }

    return true;
  };

  // Handle checking a single problem
  const handleCheckOne = (problemId: string) => {
    const prob = problems.find(p => p.id === problemId);
    if (!prob) return;

    const validation = checkAnswer(prob, userAnswers[problemId]);

    // Lock this problem
    setLockedProblems(prev => new Set(prev).add(problemId));

    // Store validation result
    setValidationResults(prev => ({ ...prev, [problemId]: validation }));

    // Clear active cell - user must click "Seterusnya" to navigate to next problem
    setActiveCell(null);
  };

  // Handle moving to next problem
  const handleMoveToNext = (currentProblemId: string) => {
    const currentIdx = problems.findIndex(p => p.id === currentProblemId);
    if (currentIdx < problems.length - 1) {
      const nextProb = problems[currentIdx + 1];
      const nextElement = document.getElementById(`prob-${nextProb.id}`);
      if (nextElement) {
        nextElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Set active cell to first cell of next problem
      if (op === 'divide') {
        const startCol = getDivisionStartColumn(nextProb);
        setActiveCell({ problemId: nextProb.id, columnIndex: startCol, type: 'answer' });
      } else {
        setActiveCell({ problemId: nextProb.id, columnIndex: 0, type: 'answer' });
      }
    }
  };

  const handleSubmit = () => {
    const res = problems.map(p => ({ problem: p, userAnswer: userAnswers[p.id], validation: checkAnswer(p, userAnswers[p.id]) }));
    onFinish(res, student);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="bg-white p-4 shadow-sm z-10 flex justify-between items-center border-b border-gray-100">
        <div>
          <h2 className={`font-bold text-lg text-slate-700`}>{op === 'divide' ? 'Latihan Bahagi' : 'Latihan Matematik'}</h2>
          <p className="text-slate-500 text-xs">Tahun {year} • {problems.length} Soalan{quizMode === 'check-one' ? ` • ${lockedProblems.size} disemak` : ''}</p>
        </div>
        {quizMode === 'check-all' && (
          <button onClick={handleSubmit} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-bold shadow-md">Semak</button>
        )}
        {quizMode === 'check-one' && lockedProblems.size === problems.length && (
          <button onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-md animate-pulse">Lihat Keputusan</button>
        )}
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 pb-32 no-scrollbar">
        <div className="w-full max-w-full mx-auto flex flex-col items-center gap-3">
            {problems.map((prob, idx) => {
                const isLocked = lockedProblems.has(prob.id);
                const isComplete = isProblemComplete(prob, userAnswers[prob.id]);
                const validation = validationResults[prob.id];
                const hasNext = idx < problems.length - 1;

                return (
                <div key={prob.id} id={`prob-${prob.id}`} className="w-full flex flex-col items-center">
                    {/* Problem Card Wrapper with Green Border - shown for both modes when complete */}
                    <div className={`transition-all duration-300 ${
                        isComplete && !isLocked
                          ? 'ring-4 ring-green-400 rounded-3xl'
                          : ''
                    }`}>
                        <VerticalProblem
                            problem={prob}
                            userAnswers={userAnswers[prob.id]}
                            activeCell={activeCell}
                            onCellClick={(col, type) => handleCellClick(prob.id, col, type)}
                            onToggleSlash={(col) => handleToggleSlash(prob.id, col)}
                            isSubmitted={isLocked}
                            validationResult={validation}
                            warnCol={warnCol?.probId === prob.id ? warnCol.col : null}
                            showSifir={sifirOpen[prob.id]}
                            onToggleSifir={op !== 'add' && op !== 'subtract' ? () => toggleSifir(prob.id) : undefined}
                            blockedAnswerColumns={getBlockedAnswerColumns(prob, userAnswers[prob.id])}
                        />
                    </div>

                    {/* Check/Next Buttons for check-one mode */}
                    {quizMode === 'check-one' && (
                        <div className="mt-3 flex gap-3 flex-wrap justify-center">
                            {!isLocked && isComplete && (
                                <button
                                    onClick={() => handleCheckOne(prob.id)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg animate-bounce"
                                >
                                    Semak Jawapan
                                </button>
                            )}

                            {isLocked && hasNext && (
                                <button
                                    onClick={() => handleMoveToNext(prob.id)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg"
                                >
                                    Seterusnya
                                </button>
                            )}

                            {isLocked && (
                                <div className={`px-5 py-2.5 rounded-full font-bold ${
                                    validation?.isCorrect
                                        ? 'bg-green-100 text-green-800 border-2 border-green-400'
                                        : 'bg-red-100 text-red-800 border-2 border-red-400'
                                }`}>
                                    {validation?.isCorrect ? 'Betul' : 'Salah'}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Next Button for check-all mode when problem is complete */}
                    {quizMode === 'check-all' && isComplete && hasNext && (
                        <div className="mt-3 flex justify-center">
                            <button
                                onClick={() => handleMoveToNext(prob.id)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg"
                            >
                                Seterusnya
                            </button>
                        </div>
                    )}
                </div>
                );
            })}
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
  const [screen, setScreen] = useState<'home' | 'quiz' | 'result' | 'adminLogin' | 'adminDashboard'>('home');
  const [config, setConfig] = useState<{ year: YearLevel, count: number, op: OperationType, quizMode: QuizMode, student?: Student }>({ year: 1, count: 10, op: 'add', quizMode: 'check-all' });
  const [results, setResults] = useState<any[]>([]);

  const startQuiz = (year: YearLevel, count: number, op: OperationType, quizMode: QuizMode, student?: Student) => {
    setConfig({ year, count, op, quizMode, student });
    setScreen('quiz');
  };

  const finishQuiz = async (res: any[], student?: Student) => {
    setResults(res);

    // Save score to Firebase if student is selected
    if (student) {
      const totalCorrect = res.filter((r: any) => r.validation.isCorrect).length;
      const totalWrong = res.length - totalCorrect;
      const percentage = Math.round((totalCorrect / res.length) * 100);

      const opLabels = {
        add: 'Tambah',
        subtract: 'Tolak',
        multiply: 'Darab',
        divide: 'Bahagi'
      };

      const scoreRecord = {
        studentId: student.id,
        studentName: student.nama,
        kelas: student.kelas,
        tahun: config.year,
        operation: opLabels[config.op],
        totalQuestions: res.length,
        correctAnswers: totalCorrect,
        wrongAnswers: totalWrong,
        percentage: percentage,
        timestamp: Date.now(),
        details: res.map((r: any) => ({
          problemId: r.problem.id,
          isCorrect: r.validation.isCorrect
        }))
      };

      await saveScore(scoreRecord);
    }

    setScreen('result');
  };

  const restart = () => { setScreen('home'); setResults([]); };
  const goToAdminLogin = () => setScreen('adminLogin');
  const onAdminLogin = () => setScreen('adminDashboard');
  const onAdminLogout = () => setScreen('home');
  const backToHome = () => setScreen('home');

  return (
    <>
      {screen === 'home' && <HomeScreen onStart={startQuiz} onAdminClick={goToAdminLogin} />}
      {screen === 'quiz' && <QuizScreen year={config.year} count={config.count} op={config.op} quizMode={config.quizMode} student={config.student} onFinish={finishQuiz} />}
      {screen === 'result' && <ResultScreen results={results} onRestart={restart} />}
      {screen === 'adminLogin' && <AdminLogin onLogin={onAdminLogin} onBack={backToHome} />}
      {screen === 'adminDashboard' && <AdminDashboard onLogout={onAdminLogout} />}
    </>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);

export default App;