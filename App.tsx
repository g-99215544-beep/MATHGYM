import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { MathProblem, YearLevel, DifficultyLevel, UserAnswerState, ActiveCell, ValidationResult, OperationType, QuizMode, Assignment } from './types';
import { generateProblemByDifficulty, checkAnswer } from './services/mathUtils';
import VerticalProblem from './components/VerticalProblem';
import Keypad from './components/Keypad';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminAssignment from './components/AdminAssignment';
import AssignmentSelectionModal from './components/AssignmentSelectionModal';
import { loadStudents, getClasses, getStudentsByClass, Student, saveScore, getPendingAssignments, completeAssignment } from './services/firebase';

// Sound effects utility
const playSound = (type: 'keypress' | 'correct' | 'wrong') => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  if (type === 'keypress') {
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.1;
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.05);
  } else if (type === 'correct') {
    // Happy ascending tone
    oscillator.frequency.value = 523.25; // C5
    oscillator.type = 'sine';
    gainNode.gain.value = 0.15;
    oscillator.start();
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    oscillator.stop(audioContext.currentTime + 0.3);
  } else if (type === 'wrong') {
    // Descending buzzer tone
    oscillator.frequency.value = 300;
    oscillator.type = 'square';
    gainNode.gain.value = 0.1;
    oscillator.start();
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.15);
    oscillator.stop(audioContext.currentTime + 0.25);
  }
};

const HomeScreen = ({ onStart, onAdminClick, onStartAssignment }: {
  onStart: (difficulty: DifficultyLevel, count: number, op: OperationType, student?: Student, includeBorrowing?: boolean) => void,
  onAdminClick: () => void,
  onStartAssignment: (assignment: Assignment, student: Student) => void
}) => {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [count, setCount] = useState<number>(10);
  const [op, setOp] = useState<OperationType>('add');
  const [includeBorrowing, setIncludeBorrowing] = useState<boolean>(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      const studentList = await loadStudents();
      setStudents(studentList);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  // Check for pending assignments when student is selected
  useEffect(() => {
    const checkAssignments = async () => {
      if (selectedStudent) {
        const assignments = await getPendingAssignments(selectedStudent.id, selectedStudent.kelas);
        setPendingAssignments(assignments);
        if (assignments.length > 0) {
          setShowAssignmentModal(true);
        }
      } else {
        setPendingAssignments([]);
        setShowAssignmentModal(false);
      }
    };
    checkAssignments();
  }, [selectedStudent]);

  const classes = getClasses(students);
  const studentsInClass = selectedClass ? getStudentsByClass(students, selectedClass) : [];

  const handleSelectAssignment = (assignment: Assignment) => {
    if (selectedStudent) {
      setShowAssignmentModal(false);
      onStartAssignment(assignment, selectedStudent);
    }
  };

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
    <div className={`h-screen overflow-y-auto bg-gradient-to-b ${themes[op]} flex flex-col items-center justify-center p-6 text-white transition-colors duration-500`}>
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
            <label className="block text-sm font-semibold mb-2 uppercase tracking-wider text-white/80">Tahap Kesukaran</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { id: 'easy', label: 'Mudah', desc: '2 digit' },
                { id: 'medium', label: 'Sederhana', desc: '3 digit' },
                { id: 'pro', label: 'Pro', desc: '4 digit' }
              ] as const).map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`py-3 rounded-xl font-bold transition-all shadow-lg ${difficulty === d.id ? 'bg-white text-slate-800 scale-105 ring-4 ring-white/30' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                >
                  <div className="text-lg">{d.label}</div>
                  <div className="text-xs opacity-70">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>
          {/* Borrowing Option - only show for subtraction */}
          {op === 'subtract' && (
            <div>
              <label className="block text-sm font-semibold mb-2 uppercase tracking-wider text-white/80">Pengumpulan Semula (Pinjam)</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIncludeBorrowing(true)}
                  className={`py-3 rounded-xl font-bold transition-all shadow-lg ${includeBorrowing ? 'bg-white text-slate-800 scale-105 ring-4 ring-white/30' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                >
                  <div className="text-lg">Ya</div>
                  <div className="text-xs opacity-70">Dengan pinjam</div>
                </button>
                <button
                  onClick={() => setIncludeBorrowing(false)}
                  className={`py-3 rounded-xl font-bold transition-all shadow-lg ${!includeBorrowing ? 'bg-white text-slate-800 scale-105 ring-4 ring-white/30' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                >
                  <div className="text-lg">Tidak</div>
                  <div className="text-xs opacity-70">Tanpa pinjam</div>
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-2 uppercase tracking-wider text-white/80">Jumlah Soalan</label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, 50].map((c) => (
                <button key={c} onClick={() => setCount(c)} className={`py-2 rounded-lg font-bold transition-all ${count === c ? 'bg-white text-slate-800 shadow-inner' : 'bg-white/20 hover:bg-white/30'}`}>{c}</button>
              ))}
            </div>
          </div>
          <button
            onClick={() => onStart(difficulty, count, op, selectedStudent, op === 'subtract' ? includeBorrowing : undefined)}
            disabled={pendingAssignments.length > 0}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-300 disabled:cursor-not-allowed text-yellow-900 text-2xl font-bold py-4 rounded-2xl shadow-[0_4px_0_rgb(161,98,7)] active:shadow-none active:translate-y-1 transition-all mt-4"
          >
            Mula Latihan
          </button>
          {pendingAssignments.length > 0 && (
            <p className="text-white/90 text-sm mt-3 text-center bg-amber-500/30 p-3 rounded-lg border border-white/30">
              Anda mempunyai {pendingAssignments.length} tugasan yang perlu disiapkan terlebih dahulu.
            </p>
          )}
        </div>
      </div>

      {/* Assignment Selection Modal */}
      {showAssignmentModal && selectedStudent && pendingAssignments.length > 0 && (
        <AssignmentSelectionModal
          assignments={pendingAssignments}
          studentName={selectedStudent.nama}
          onSelectAssignment={handleSelectAssignment}
        />
      )}
    </div>
  );
};

const QuizScreen = ({
  difficulty,
  count,
  op,
  student,
  includeBorrowing,
  onFinish,
  onSaveScore,
  onHome,
  assignment
}: {
  difficulty: DifficultyLevel,
  count: number,
  op: OperationType,
  student?: Student,
  includeBorrowing?: boolean,
  onFinish: (results: { problem: MathProblem, userAnswer: UserAnswerState, validation: ValidationResult }[], student?: Student) => void,
  onSaveScore: (results: { problem: MathProblem, userAnswer: UserAnswerState, validation: ValidationResult }[], student?: Student) => void,
  onHome: () => void,
  assignment?: Assignment | null
}) => {
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, UserAnswerState>>({});
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [warnCol, setWarnCol] = useState<{probId: string, col: number, type?: 'slash' | 'carry' | 'borrow'} | null>(null);
  const [lockedProblems, setLockedProblems] = useState<Set<string>>(new Set()); // Problems that have been checked
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({}); // Results for checked problems
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null); // For zoom view
  const [correctionProblemId, setCorrectionProblemId] = useState<string | null>(null); // For correction mode
  const [correctionValidation, setCorrectionValidation] = useState<ValidationResult | null>(null); // Correction check result
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
    const generated = Array.from({ length: count }).map((_, i) => generateProblemByDifficulty(difficulty, i, op, includeBorrowing));
    setProblems(generated);
    const initialAnswers: Record<string, UserAnswerState> = {};
    generated.forEach(p => {
      initialAnswers[p.id] = {
          answerDigits: {},
          carryDigits: {},
          borrowDigits: {},
          remainderDigits: {},
          slashedCols: {}
      };
    });
    setUserAnswers(initialAnswers);

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
  }, [difficulty, count, op, includeBorrowing, getDivisionStartColumn]);

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

      // Prevent editing locked problems (except during correction mode)
      if (lockedProblems.has(problemId) && correctionProblemId !== problemId) {
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
    // Play keypress sound
    if (key !== '') {
      playSound('keypress');
    }
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
                        // For add/multiply, move to carry if current column has carry out
                        if ((op === 'add' || op === 'multiply') && prob.columns[activeCell.columnIndex].correctCarryOut > 0) {
                            setTimeout(() => setActiveCell({ problemId: activeCell.problemId, columnIndex: nextColIdx, type: 'carry' }), 150);
                        } else {
                            setTimeout(() => setActiveCell({ problemId: activeCell.problemId, columnIndex: nextColIdx, type: 'answer' }), 150);
                        }
                   }
              }
              // For add/multiply, after filling carry, move to answer only if answer is empty
              if (activeCell.type === 'carry' && (op === 'add' || op === 'multiply')) {
                  const currentAns = currentProblemAns.answerDigits[activeCell.columnIndex];
                  if (!currentAns || currentAns === '') {
                      setTimeout(() => setActiveCell({ ...activeCell, type: 'answer' }), 150);
                  } else {
                      // Answer already filled, move to next column's answer
                      const nextColIdx = activeCell.columnIndex + 1;
                      if (prob && nextColIdx < prob.columns.length) {
                          setTimeout(() => setActiveCell({ problemId: activeCell.problemId, columnIndex: nextColIdx, type: 'answer' }), 150);
                      }
                  }
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
    if (op === 'divide') {
      // For division, only check columns from start column to 0
      const startCol = getDivisionStartColumn(problem);
      for (let i = startCol; i >= 0; i--) {
        if (!userAns.answerDigits[i]) return false;
        if (!userAns.slashedCols[i]) return false;
        const col = problem.columns[i];
        if (col.correctCarryOut > 0) {
          if (!userAns.remainderDigits[i]) return false;
        }
      }
      return true;
    }

    // For other operations, check all answer digits are filled
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
    }

    return true;
  };

  // Handle checking a single problem
  const handleCheckOne = (problemId: string) => {
    const prob = problems.find(p => p.id === problemId);
    if (!prob) return;

    const validation = checkAnswer(prob, userAnswers[problemId]);

    // Play sound based on result
    playSound(validation.isCorrect ? 'correct' : 'wrong');

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

  // Check all problems at once (stay in QuizScreen, show overview)
  const handleCheckAll = () => {
    const newValidations: Record<string, ValidationResult> = {};
    const newLocked = new Set<string>();
    let correctCount = 0;

    problems.forEach(prob => {
      const validation = checkAnswer(prob, userAnswers[prob.id]);
      newValidations[prob.id] = validation;
      newLocked.add(prob.id);
      if (validation.isCorrect) correctCount++;
    });

    setValidationResults(newValidations);
    setLockedProblems(newLocked);
    setActiveCell(null);

    // Play sound based on overall result
    playSound(correctCount === problems.length ? 'correct' : 'wrong');

    // Mark score as saved (will be saved by useEffect or here)
    setScoreSaved(true);

    // Save score to Firebase if student is selected
    if (student) {
      const res = problems.map(p => ({ problem: p, userAnswer: userAnswers[p.id], validation: newValidations[p.id] }));
      onFinish(res, student);
    }
  };

  // Difficulty labels
  const difficultyLabels: Record<DifficultyLevel, string> = {
    easy: 'Mudah',
    medium: 'Sederhana',
    pro: 'Pro'
  };

  // Check if all problems are complete (have green cards)
  const allProblemsComplete = problems.length > 0 && problems.every(p => isProblemComplete(p, userAnswers[p.id]));
  // Check if all problems are checked/locked
  const allProblemsChecked = problems.length > 0 && lockedProblems.size === problems.length;
  // Calculate score
  const totalCorrect = Object.values(validationResults).filter(v => v.isCorrect).length;

  // Auto-save score when all problems are checked individually
  const [scoreSaved, setScoreSaved] = useState(false);
  useEffect(() => {
    if (allProblemsChecked && !scoreSaved && student) {
      setScoreSaved(true);
      const res = problems.map(p => ({ problem: p, userAnswer: userAnswers[p.id], validation: validationResults[p.id] }));
      onSaveScore(res, student);
    }
  }, [allProblemsChecked, scoreSaved]);

  // Handle "Semak dan Hantar" - check all problems (even incomplete) and submit to Firebase
  // Stays on quiz screen to show overview grid instead of navigating to result screen
  const handleSubmitAll = () => {
    const newValidations: Record<string, ValidationResult> = {};
    const newLocked = new Set<string>();
    let correctCount = 0;

    problems.forEach(prob => {
      const validation = checkAnswer(prob, userAnswers[prob.id]);
      newValidations[prob.id] = validation;
      newLocked.add(prob.id);
      if (validation.isCorrect) correctCount++;
    });

    setValidationResults(newValidations);
    setLockedProblems(newLocked);
    setActiveCell(null);

    playSound(correctCount === problems.length ? 'correct' : 'wrong');

    setScoreSaved(true);

    // Save to Firebase without navigating away - stay on quiz screen to show overview grid
    if (student) {
      const res = problems.map(p => ({ problem: p, userAnswer: userAnswers[p.id], validation: newValidations[p.id] }));
      onSaveScore(res, student);
    }
  };

  // Start correction mode for a wrong problem
  const handleStartCorrection = (problemId: string) => {
    // Reset the user answers for this problem
    setUserAnswers(prev => ({
      ...prev,
      [problemId]: {
        answerDigits: {},
        carryDigits: {},
        borrowDigits: {},
        remainderDigits: {},
        slashedCols: {}
      }
    }));
    setCorrectionValidation(null);
    setSelectedProblemId(null);
    setCorrectionProblemId(problemId);

    // Set active cell to first cell
    const prob = problems.find(p => p.id === problemId);
    if (prob) {
      if (op === 'divide') {
        const startCol = getDivisionStartColumn(prob);
        setActiveCell({ problemId, columnIndex: startCol, type: 'answer' });
      } else {
        setActiveCell({ problemId, columnIndex: 0, type: 'answer' });
      }
    }
  };

  // Check correction answer (does NOT change the saved score)
  const handleCheckCorrection = () => {
    if (!correctionProblemId) return;
    const prob = problems.find(p => p.id === correctionProblemId);
    if (!prob) return;

    const validation = checkAnswer(prob, userAnswers[correctionProblemId]);
    setCorrectionValidation(validation);
    setActiveCell(null);
    playSound(validation.isCorrect ? 'correct' : 'wrong');
  };

  // Exit correction mode back to overview
  const handleExitCorrection = () => {
    // Restore original validation result answers for overview display
    if (correctionProblemId) {
      // Keep the correction answers so overview shows the corrected work
    }
    setCorrectionProblemId(null);
    setCorrectionValidation(null);
    setActiveCell(null);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <div className="bg-white p-4 shadow-sm z-10 flex justify-between items-center border-b border-gray-100">
        <div>
          {assignment ? (
            <>
              <h2 className={`font-bold text-lg text-slate-700`}>Tugasan: {assignment.title}</h2>
              <p className="text-slate-500 text-xs">{difficultyLabels[difficulty]} • {problems.length} Soalan • {lockedProblems.size} disemak</p>
            </>
          ) : (
            <>
              <h2 className={`font-bold text-lg text-slate-700`}>{op === 'divide' ? 'Latihan Bahagi' : 'Latihan Matematik'}</h2>
              <p className="text-slate-500 text-xs">{difficultyLabels[difficulty]} • {problems.length} Soalan • {lockedProblems.size} disemak</p>
            </>
          )}
        </div>
        {/* Show "Semak Semua" only when ALL problems are complete but not all checked yet */}
        {allProblemsComplete && !allProblemsChecked && (
          <button onClick={handleCheckAll} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-bold shadow-md animate-pulse">Semak Semua</button>
        )}
        {/* Show score and home button when all problems are checked */}
        {allProblemsChecked && (
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-full font-bold ${totalCorrect === problems.length ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {totalCorrect}/{problems.length} Betul
            </div>
            <button
              onClick={onHome}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-full shadow-md transition-all"
              title="Kembali ke Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Overview Grid Mode - when all problems checked */}
      {allProblemsChecked && !selectedProblemId && !correctionProblemId && (
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
            {problems.map((prob, idx) => {
              const validation = validationResults[prob.id];
              return (
                <div
                  key={prob.id}
                  onClick={() => setSelectedProblemId(prob.id)}
                  className={`cursor-pointer transform hover:scale-105 transition-all duration-200 rounded-2xl p-2 ${
                    validation?.isCorrect
                      ? 'bg-green-50 ring-2 ring-green-400'
                      : 'bg-red-50 ring-2 ring-red-400'
                  }`}
                >
                  <div className="h-[120px] overflow-hidden">
                    <div className="transform scale-[0.45] origin-top-center">
                      <VerticalProblem
                        problem={prob}
                        userAnswers={userAnswers[prob.id]}
                        activeCell={null}
                        onCellClick={() => {}}
                        isSubmitted={true}
                        validationResult={validation}
                      />
                    </div>
                  </div>
                  <div className={`text-center font-bold text-sm ${
                    validation?.isCorrect ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {idx + 1}. {validation?.isCorrect ? 'Betul' : 'Salah'}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Floating Home Button */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={onHome}
              className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Menu Utama
            </button>
          </div>
        </div>
      )}

      {/* Zoomed View - when a problem is selected */}
      {allProblemsChecked && selectedProblemId && !correctionProblemId && (
        <div className="flex-1 overflow-y-auto p-4 pb-8">
          <div className="flex flex-col items-center">
            <button
              onClick={() => setSelectedProblemId(null)}
              className="mb-4 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-full font-semibold flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali ke Overview
            </button>
            {(() => {
              const prob = problems.find(p => p.id === selectedProblemId);
              const validation = validationResults[selectedProblemId];
              const idx = problems.findIndex(p => p.id === selectedProblemId);
              if (!prob) return null;
              return (
                <div className={`rounded-3xl p-1 ${
                  validation?.isCorrect ? 'ring-4 ring-green-400' : 'ring-4 ring-red-400'
                }`}>
                  <VerticalProblem
                    problem={prob}
                    userAnswers={userAnswers[prob.id]}
                    activeCell={null}
                    onCellClick={() => {}}
                    isSubmitted={true}
                    validationResult={validation}
                  />
                  <div className={`text-center font-bold text-lg mt-2 ${
                    validation?.isCorrect ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Soalan {idx + 1}: {validation?.isCorrect ? 'Betul' : 'Salah'}
                  </div>
                </div>
              );
            })()}
            {/* Buttons */}
            <div className="flex gap-4 mt-4 flex-wrap justify-center">
              {/* Correction button - only for wrong answers */}
              {!validationResults[selectedProblemId]?.isCorrect && (
                <button
                  onClick={() => handleStartCorrection(selectedProblemId)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-full font-bold shadow-lg"
                >
                  Buat Pembetulan
                </button>
              )}
              {/* Navigation buttons */}
              {problems.findIndex(p => p.id === selectedProblemId) > 0 && (
                <button
                  onClick={() => {
                    const idx = problems.findIndex(p => p.id === selectedProblemId);
                    setSelectedProblemId(problems[idx - 1].id);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full font-semibold"
                >
                  Sebelum
                </button>
              )}
              {problems.findIndex(p => p.id === selectedProblemId) < problems.length - 1 && (
                <button
                  onClick={() => {
                    const idx = problems.findIndex(p => p.id === selectedProblemId);
                    setSelectedProblemId(problems[idx + 1].id);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full font-semibold"
                >
                  Seterusnya
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Correction Mode - redo a wrong problem */}
      {correctionProblemId && (() => {
        const prob = problems.find(p => p.id === correctionProblemId);
        const idx = problems.findIndex(p => p.id === correctionProblemId);
        if (!prob) return null;
        const correctionComplete = isProblemComplete(prob, userAnswers[correctionProblemId]);
        return (
          <>
            <div className="flex-1 overflow-y-auto p-4 pb-32 no-scrollbar">
              <div className="w-full max-w-full mx-auto flex flex-col items-center gap-3">
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 w-full max-w-sm text-center">
                  <p className="text-amber-800 font-bold text-sm">Pembetulan Soalan {idx + 1}</p>
                  <p className="text-amber-600 text-xs">Markah tidak akan berubah</p>
                </div>
                <div className={`transition-all duration-300 ${
                  correctionValidation
                    ? correctionValidation.isCorrect
                      ? 'ring-4 ring-green-400 rounded-3xl'
                      : 'ring-4 ring-red-400 rounded-3xl'
                    : correctionComplete
                      ? 'ring-4 ring-green-400 rounded-3xl'
                      : ''
                }`}>
                  <VerticalProblem
                    problem={prob}
                    userAnswers={userAnswers[correctionProblemId]}
                    activeCell={activeCell}
                    onCellClick={(col, type) => !correctionValidation && handleCellClick(correctionProblemId, col, type)}
                    onToggleSlash={(col) => !correctionValidation && handleToggleSlash(correctionProblemId, col)}
                    isSubmitted={!!correctionValidation}
                    validationResult={correctionValidation || undefined}
                    warnCol={warnCol?.probId === correctionProblemId ? warnCol.col : null}
                    blockedAnswerColumns={getBlockedAnswerColumns(prob, userAnswers[correctionProblemId])}
                  />
                </div>
                {/* Semak button when complete but not checked yet */}
                {correctionComplete && !correctionValidation && (
                  <button
                    onClick={handleCheckCorrection}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg animate-bounce"
                  >
                    Semak Jawapan
                  </button>
                )}
                {/* Result after checking */}
                {correctionValidation && (
                  <div className="flex flex-col items-center gap-3">
                    <div className={`px-5 py-2.5 rounded-full font-bold ${
                      correctionValidation.isCorrect
                        ? 'bg-green-100 text-green-800 border-2 border-green-400'
                        : 'bg-red-100 text-red-800 border-2 border-red-400'
                    }`}>
                      {correctionValidation.isCorrect ? 'Betul' : 'Salah'}
                    </div>
                    <button
                      onClick={handleExitCorrection}
                      className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full font-bold shadow-lg"
                    >
                      Kembali ke Overview
                    </button>
                  </div>
                )}
              </div>
            </div>
            {!correctionValidation && <Keypad onKeyPress={handleKeyPress} onDelete={handleDelete} onNext={handleNext} />}
          </>
        );
      })()}

      {/* Normal Quiz Mode - when not all checked */}
      {!allProblemsChecked && (
        <>
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 pb-32 no-scrollbar">
            <div className="w-full max-w-full mx-auto flex flex-col items-center gap-3">
                {problems.map((prob, idx) => {
                    const isLocked = lockedProblems.has(prob.id);
                    const isComplete = isProblemComplete(prob, userAnswers[prob.id]);
                    const validation = validationResults[prob.id];
                    const hasNext = idx < problems.length - 1;

                    return (
                    <div key={prob.id} id={`prob-${prob.id}`} className="w-full flex flex-col items-center">
                        {/* Problem Card Wrapper with Border - green when complete, green/red when locked based on result */}
                        <div className={`transition-all duration-300 ${
                            isLocked
                              ? validation?.isCorrect
                                ? 'ring-4 ring-green-400 rounded-3xl'
                                : 'ring-4 ring-red-400 rounded-3xl'
                              : isComplete
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
                                blockedAnswerColumns={getBlockedAnswerColumns(prob, userAnswers[prob.id])}
                            />
                        </div>

                        {/* Check/Next/Result Buttons */}
                        <div className="mt-3 flex gap-3 flex-wrap justify-center">
                            {/* Show "Semak Jawapan" when complete but not locked */}
                            {!isLocked && isComplete && (
                                <button
                                    onClick={() => handleCheckOne(prob.id)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg animate-bounce"
                                >
                                    Semak Jawapan
                                </button>
                            )}

                            {/* Show "Seterusnya" when locked and has next, OR when complete but not locked and has next */}
                            {((isLocked && hasNext) || (!isLocked && isComplete && hasNext)) && (
                                <button
                                    onClick={() => handleMoveToNext(prob.id)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg"
                                >
                                    Seterusnya
                                </button>
                            )}

                            {/* Show result badge when locked */}
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
                    </div>
                    );
                })}

                {/* Semak dan Hantar button - always at the end of questions */}
                <div className="mt-8 mb-4 w-full flex justify-center">
                  <button
                    onClick={handleSubmitAll}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all active:scale-95"
                  >
                    Semak dan Hantar
                  </button>
                </div>
            </div>
          </div>
          <Keypad onKeyPress={handleKeyPress} onDelete={handleDelete} onNext={handleNext} />
        </>
      )}
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
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
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
  const [screen, setScreen] = useState<'home' | 'quiz' | 'result' | 'adminLogin' | 'adminDashboard' | 'adminAssignment'>('home');
  const [config, setConfig] = useState<{ difficulty: DifficultyLevel, count: number, op: OperationType, student?: Student, includeBorrowing?: boolean }>({ difficulty: 'easy', count: 10, op: 'add' });
  const [results, setResults] = useState<any[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);

  const startQuiz = (difficulty: DifficultyLevel, count: number, op: OperationType, student?: Student, includeBorrowing?: boolean) => {
    setConfig({ difficulty, count, op, student, includeBorrowing });
    setCurrentAssignment(null);
    setScreen('quiz');
  };

  const startAssignmentQuiz = (assignment: Assignment, student: Student) => {
    setConfig({
      difficulty: assignment.difficulty,
      count: assignment.questionCount,
      op: assignment.operation,
      student,
      includeBorrowing: assignment.includeBorrowing
    });
    setCurrentAssignment(assignment);
    setScreen('quiz');
  };

  // Save score without navigating to result screen (used for individual check mode)
  const saveScoreOnly = async (res: any[], student?: Student) => {
    if (!student) return;

    // Mark assignment as completed if this was an assignment quiz
    if (currentAssignment) {
      await completeAssignment(currentAssignment.id, student.id);
    }

    const totalCorrect = res.filter((r: any) => r.validation.isCorrect).length;
    const totalWrong = res.length - totalCorrect;
    const percentage = Math.round((totalCorrect / res.length) * 100);

    const opLabels: Record<string, string> = { add: 'Tambah', subtract: 'Tolak', multiply: 'Darab', divide: 'Bahagi' };
    const difficultyLabels: Record<string, string> = { easy: 'Mudah', medium: 'Sederhana', pro: 'Pro' };
    const tahun = parseInt(student.kelas.replace(/[^0-9]/g, '')) || 1;

    const scoreRecord = {
      studentId: student.id,
      studentName: student.nama,
      kelas: student.kelas,
      tahun,
      difficulty: difficultyLabels[config.difficulty],
      operation: opLabels[config.op],
      totalQuestions: res.length,
      correctAnswers: totalCorrect,
      wrongAnswers: totalWrong,
      percentage,
      timestamp: Date.now(),
      details: res.map((r: any) => ({ problemId: r.problem.id, isCorrect: r.validation.isCorrect }))
    };

    await saveScore(scoreRecord);
  };

  const finishQuiz = async (res: any[], student?: Student) => {
    setResults(res);

    // Mark assignment as completed if this was an assignment quiz
    if (currentAssignment && student) {
      await completeAssignment(currentAssignment.id, student.id);
    }

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

      const difficultyLabels = {
        easy: 'Mudah',
        medium: 'Sederhana',
        pro: 'Pro'
      };

      // Extract year from class name (e.g., "1A" -> 1, "2B" -> 2)
      const tahun = parseInt(student.kelas.replace(/[^0-9]/g, '')) || 1;

      const scoreRecord = {
        studentId: student.id,
        studentName: student.nama,
        kelas: student.kelas,
        tahun: tahun,
        difficulty: difficultyLabels[config.difficulty],
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

  const restart = () => { setScreen('home'); setResults([]); setCurrentAssignment(null); };
  const goToAdminLogin = () => setScreen('adminLogin');
  const onAdminLogin = () => setScreen('adminDashboard');
  const onAdminLogout = () => setScreen('home');
  const backToHome = () => setScreen('home');
  const goToAdminAssignment = () => setScreen('adminAssignment');
  const backToAdminDashboard = () => setScreen('adminDashboard');

  return (
    <>
      {screen === 'home' && <HomeScreen onStart={startQuiz} onAdminClick={goToAdminLogin} onStartAssignment={startAssignmentQuiz} />}
      {screen === 'quiz' && <QuizScreen difficulty={config.difficulty} count={config.count} op={config.op} student={config.student} includeBorrowing={config.includeBorrowing} onFinish={finishQuiz} onSaveScore={saveScoreOnly} onHome={restart} assignment={currentAssignment} />}
      {screen === 'result' && <ResultScreen results={results} onRestart={restart} />}
      {screen === 'adminLogin' && <AdminLogin onLogin={onAdminLogin} onBack={backToHome} />}
      {screen === 'adminDashboard' && <AdminDashboard onLogout={onAdminLogout} onManageAssignments={goToAdminAssignment} />}
      {screen === 'adminAssignment' && <AdminAssignment onBack={backToAdminDashboard} />}
    </>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = createRoot(rootElement);
root.render(<React.StrictMode><App /></React.StrictMode>);

export default App;