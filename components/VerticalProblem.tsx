import React from 'react';
import { MathProblem, ActiveCell, ValidationResult } from '../types';

interface VerticalProblemProps {
  problem: MathProblem;
  userAnswers: {
      answerDigits: Record<number, string>;
      carryDigits: Record<number, string>;
      borrowDigits: Record<number, string>;
      remainderDigits: Record<number, string>;
      slashedCols: Record<number, boolean>;
  };
  activeCell: ActiveCell | null;
  onCellClick: (colIndex: number, type: 'answer' | 'carry' | 'borrow' | 'remainder') => void;
  onToggleSlash?: (colIndex: number) => void;
  validationResult?: ValidationResult;
  isSubmitted: boolean;
  warnCol?: number | null;
  blockedAnswerColumns?: Set<number>;
}

const VerticalProblem: React.FC<VerticalProblemProps> = ({
  problem,
  userAnswers,
  activeCell,
  onCellClick,
  onToggleSlash,
  validationResult,
  isSubmitted,
  warnCol,
  blockedAnswerColumns = new Set()
}) => {
  const isDivision = problem.operation === 'divide';
  const isSubtraction = problem.operation === 'subtract';
  const displayColumns = [...problem.columns].map((col, idx) => ({ ...col, originalIndex: idx })).reverse();
  
  const opSymbol = {
      'add': '+',
      'subtract': '-',
      'multiply': '×',
      'divide': '÷' 
  }[problem.operation];

  const isDivisionGroupStart = isDivision && (displayColumns[0]?.digit1 || 0) < problem.num2;

  const renderCell = (colIndex: number, type: 'answer' | 'carry' | 'borrow' | 'remainder', value: string, correctVal: number, isCorrect: boolean | null | undefined, colData: any) => {
      const isActive = activeCell?.problemId === problem.id && activeCell.columnIndex === colIndex && activeCell.type === type;
      const isBlocked = type === 'answer' && blockedAnswerColumns.has(colIndex) && !isSubmitted;

      let bg = 'bg-slate-50 border-slate-200';
      let text = 'text-slate-800';
      let widthClass = 'w-14';
      let heightClass = 'h-16 mt-2';
      let textSize = 'text-3xl';
      let borderClass = 'border-b-4';
      let roundedClass = 'rounded-xl';

      if (type === 'carry') {
          widthClass = 'w-10';
          heightClass = 'h-10 mb-0'; 
          textSize = 'text-xl';
          text = 'text-indigo-600';
      } else if (type === 'borrow') {
          widthClass = 'w-8';
          heightClass = 'h-12';
          textSize = 'text-3xl';
          text = 'text-green-600';
          bg = 'bg-transparent border-transparent';
          borderClass = 'border-2 border-transparent';
          
          if (value || isActive) {
               bg = 'bg-white border-slate-200';
               borderClass = 'border-2';
               if (!value && isActive) borderClass = 'border-2 border-dashed';
          }
      } else if (type === 'remainder') {
          widthClass = 'w-10';
          heightClass = 'h-12';
          textSize = 'text-2xl';
          text = 'text-purple-600';
          bg = 'bg-purple-50 border-purple-200';
          borderClass = 'border-2';
      }
      
      let shouldBlink = false;
      if (!isSubmitted) {
          if (problem.operation === 'add' && type === 'carry') {
              const prevColIndex = colIndex - 1;
              if (prevColIndex >= 0) {
                  const prevCol = problem.columns[prevColIndex];
                  const prevAns = userAnswers.answerDigits[prevColIndex];
                  if (prevCol.correctCarryOut > 0 && prevAns && prevAns !== '') {
                      if (!value || value === '') shouldBlink = true;
                  }
              }
          } else if (problem.operation === 'subtract') {
              if (type === 'carry' && userAnswers.slashedCols[colIndex] && !value) shouldBlink = true;
              else if (type === 'borrow') {
                  const nextColIndex = colIndex + 1;
                  if (userAnswers.slashedCols[nextColIndex] && userAnswers.carryDigits[nextColIndex] && !value) shouldBlink = true;
              }
          } else if (problem.operation === 'divide' && type === 'remainder') {
              if (userAnswers.slashedCols[colIndex] && !value && colData.correctCarryOut > 0) shouldBlink = true;
          }

          if (warnCol === colIndex) {
              if (problem.operation === 'multiply' && type === 'carry') shouldBlink = true;
              if (problem.operation === 'add' || problem.operation === 'subtract' || problem.operation === 'multiply') {
                  if (type === 'answer') shouldBlink = true;
              }
              if (problem.operation === 'divide' && type === 'answer') shouldBlink = true;
              
              if (problem.operation === 'subtract') {
                   if (type === 'carry' && userAnswers.slashedCols[colIndex]) shouldBlink = true;
                   if (type === 'borrow') shouldBlink = true;
              }
          }
      }

      if (type === 'answer') {
         if (isBlocked) {
             // Blocked state - disabled appearance
             bg = 'bg-slate-200 border-slate-300';
             text = 'text-slate-400';
         } else if (isActive) {
             bg = 'bg-blue-100 border-blue-500';
         }
         if (isSubmitted && isCorrect !== undefined) {
             bg = isCorrect ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500';
             text = isCorrect ? 'text-green-700' : 'text-red-700';
         }
      } else {
         if (type !== 'borrow' && (type !== 'carry' || !value) && type !== 'remainder') {
            if (!isActive) bg = 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200';
         }
         
         if (isActive) bg = 'bg-indigo-100 border-indigo-400';
         
         if (isSubmitted && isCorrect !== undefined && isCorrect !== null) {
             bg = isCorrect ? 'bg-blue-100 border-blue-500' : 'bg-orange-100 border-orange-400';
         }
      }
      
      if (shouldBlink && !isSubmitted) {
          bg = 'animate-blink-custom border-amber-400 bg-amber-50';
          if (type === 'borrow') {
              text = 'text-green-600';
              widthClass = 'w-8 border-2'; 
              bg = 'animate-blink-custom bg-green-50';
          } else if (type === 'remainder') {
              text = 'text-purple-600';
          } else if (type === 'answer') {
              text = 'text-amber-700';
          } else {
              text = 'text-amber-600';
          }
      }

      if (type === 'borrow' && !value && !isActive && bg.indexOf('animate') === -1 && !isSubmitted) {
           return <div className="w-0 overflow-hidden"></div>; 
      }
      if (type === 'remainder' && !isSubmitted) {
          if (!userAnswers.slashedCols[colIndex]) return <div className="w-0 overflow-hidden"></div>;
          if (colData.correctCarryOut === 0) return <div className="w-0 overflow-hidden"></div>;
      }
      if (type === 'remainder' && isSubmitted && !value) {
           return <div className="w-0 overflow-hidden"></div>;
      }

      const cursorClass = isBlocked ? 'cursor-not-allowed' : 'cursor-pointer';

      return (
        <div
            className={`${widthClass} ${heightClass} ${roundedClass} ${borderClass} flex items-center justify-center font-bold ${cursorClass} transition-all shadow-sm ${bg} ${text} ${textSize} ${type === 'borrow' ? '-mr-1 z-10' : ''} ${type === 'remainder' ? 'ml-1' : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                if (!isSubmitted && !isBlocked) {
                    onCellClick(colIndex, type);
                }
            }}
        >
            {value}
        </div>
      );
  };

  const VerticalLayout = () => {
    if (isDivision) {
        return (
         <div className="flex flex-row overflow-x-auto pb-4 no-scrollbar items-stretch w-full">
             {/* Sticky Divisor */}
             <div className="flex items-end sticky left-0 z-20 bg-white pl-3 pr-2 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                 <div className="text-4xl font-bold text-slate-700 mr-1 pb-4">{problem.num2}</div>
                 <div className="relative h-[110px] w-4">
                     <div className="w-4 h-full border-r-4 border-slate-700 rounded-tr-3xl absolute bottom-0 right-0"></div>
                 </div>
             </div>

             {/* Dividend & Quotient Cols */}
             <div className="flex flex-row gap-0 px-2 min-w-fit">
                 {displayColumns.map((col, idx) => {
                     const colIndex = col.originalIndex;
                     const val = userAnswers.answerDigits[colIndex] || '';
                     const res = validationResult?.columnResults[colIndex];
                     const isSlashed = userAnswers.slashedCols[colIndex];
                     const ansFilled = userAnswers.answerDigits[colIndex] && userAnswers.answerDigits[colIndex] !== '';
                     const shouldBlinkDividend = ansFilled && !isSlashed && !isSubmitted && col.correctCarryOut > 0;
                     const remVal = userAnswers.remainderDigits[colIndex] || '';
                     const remRes = validationResult?.columnResults[colIndex]?.remainderCorrect;

                     const isGroupSecondDigit = isDivisionGroupStart && idx === 1;
                     const isGroupFirstDigit = isDivisionGroupStart && idx === 0;

                     // Determine Strike Type
                     let strikeElement = null;
                     if (isSlashed) {
                         let width = 'w-[120%]';
                         let translate = '-translate-x-1/2';
                         let left = 'left-1/2';
                         let rotate = '-rotate-45';
                         
                         if (isGroupSecondDigit) {
                             // Initial double digit (e.g., 27)
                             width = 'w-[180%]'; // Reduced from 240%
                             left = 'left-0';
                             translate = '-translate-x-[40%]'; // Shift left to cover prev digit
                             rotate = '-rotate-[30deg]';
                         } else if (col.correctCarryIn > 0) {
                             // Carry-in remainder (e.g., small 2 next to 7)
                             width = 'w-[160%]'; // Reduced from 260%
                             left = 'left-0';
                             translate = '-translate-x-[45%]'; // Shift left towards remainder
                             rotate = '-rotate-[30deg]';
                         }
                         
                         // Skip strike for first digit in group (it's covered by second digit's long strike)
                         if (!isGroupFirstDigit) {
                            strikeElement = (
                                <div 
                                    className={`absolute top-1/2 h-[3px] bg-red-500 opacity-80 z-50 pointer-events-none ${width} ${left} ${translate} -translate-y-1/2 ${rotate}`}
                                ></div>
                            );
                         }
                     }

                     return (
                         <div key={`col-${colIndex}`} className="flex flex-col items-center w-[4.5rem]"> 
                             {/* Quotient Cell */}
                             <div className="flex justify-center mb-1 w-full">
                                 {renderCell(colIndex, 'answer', val, col.correctSumDigit, res?.answerCorrect, col)}
                             </div>
                             
                             {/* Line Segment */}
                             <div className="w-full h-1 bg-slate-700 mb-2 transform scale-x-110"></div>
                             
                             {/* Dividend Cell */}
                             <div className="flex items-center justify-center w-full relative">
                                 <div 
                                     className={`w-14 h-12 flex items-center justify-center text-4xl font-sans font-medium text-slate-700 select-none z-10 relative
                                         ${shouldBlinkDividend ? 'animate-blink-custom cursor-pointer rounded-lg bg-amber-50' : ''}
                                     `}
                                     onClick={() => {
                                         if (shouldBlinkDividend && onToggleSlash) onToggleSlash(colIndex);
                                     }}
                                 >
                                     {col.digit1}
                                     {strikeElement}
                                 </div>
                                 {/* Remainder absolute positioned. Z-20 ensures it's above normal content, but Strike is Z-50 so Strike wins. */}
                                 <div className="absolute left-[70%] z-20">
                                     {renderCell(colIndex, 'remainder', remVal, 0, remRes, col)}
                                 </div>
                             </div>
                         </div>
                     );
                 })}
             </div>
         </div>
       );
   }

   // Standard Layout
   return (
       <div className="overflow-x-auto pb-4 no-scrollbar w-full">
           <div className="flex flex-row justify-center gap-2 min-w-min px-4">
             <div className="flex flex-col items-center mr-2">
                <div className="w-8 h-10 mb-0"></div>
                <div className="w-8 h-14"></div>
                <div className="w-8 h-14 flex items-center justify-center text-4xl font-bold text-slate-400">
                  {opSymbol}
                </div>
                <div className="w-8 h-16 mt-2"></div>
             </div>

             {displayColumns.map((col, idx) => {
               const colIndex = col.originalIndex;
               const ansVal = userAnswers.answerDigits[colIndex] || '';
               const carryVal = userAnswers.carryDigits[colIndex] || '';
               const borrowVal = userAnswers.borrowDigits[colIndex] || '';
               const isSlashed = userAnswers.slashedCols[colIndex];
               const colResult = validationResult?.columnResults[colIndex];
               const isWarned = warnCol === colIndex;
               const isDigitWarned = isWarned && problem.operation === 'subtract'; 

               return (
                 <div key={colIndex} className="flex flex-col items-center">
                   <div className="flex items-end justify-center h-10 w-full mb-0">
                       {renderCell(colIndex, 'carry', carryVal, 0, colResult?.carryCorrect, col)}
                   </div>

                   <div className="h-14 flex items-center justify-center relative">
                       <div className="flex items-center justify-center">
                             {renderCell(colIndex, 'borrow', borrowVal, 0, null, col)}
                             <div 
                                 className={`w-12 h-14 flex items-center justify-center text-4xl font-sans font-medium text-slate-700 select-none 
                                     ${isSubtraction && !isSubmitted ? 'cursor-pointer hover:text-slate-500' : ''} 
                                     ${isSlashed ? 'diagonal-strike' : ''}
                                     ${isDigitWarned ? 'animate-blink-custom text-red-600 bg-red-50 rounded-lg' : ''}
                                 `}
                                 onClick={() => isSubtraction && !isSubmitted && onToggleSlash && onToggleSlash(colIndex)}
                             >
                                 {col.digit1 !== null ? col.digit1 : ''}
                             </div>
                       </div>
                   </div>

                   <div className="w-12 h-14 flex items-center justify-center text-4xl font-sans font-medium text-slate-700 border-b-4 border-slate-700">
                     {col.digit2 !== null ? col.digit2 : ''}
                   </div>

                   {renderCell(colIndex, 'answer', ansVal, col.correctSumDigit, colResult?.answerCorrect, col)}
                 </div>
               );
             })}
           </div>
       </div>
   );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-blue-100 mx-auto relative w-fit min-w-[300px] overflow-hidden">
        {/* Header Badges */}
        <div className="absolute left-0 top-0 p-2 flex gap-2 z-30 pointer-events-none">
             <div className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm pointer-events-auto">
                {parseInt(problem.id) + 1}
             </div>
        </div>

        <div className="flex flex-row">
            {/* Main Content including Sifir in one scroll area for Division */}
            <div className={`flex-1 min-w-0 ${isDivision ? 'pt-12 pb-3' : 'p-4 pt-14 pb-3'}`}>
                 <VerticalLayout />
            </div>
        </div>
    </div>
  );
};

export default VerticalProblem;