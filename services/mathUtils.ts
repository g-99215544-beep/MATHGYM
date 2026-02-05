import { MathProblem, MathColumn, YearLevel, DifficultyLevel, OperationType, ValidationResult } from '../types';

// Legacy function for backward compatibility
export const generateProblem = (year: YearLevel, index: number, operation: OperationType): MathProblem => {
  // Map year to difficulty for backward compatibility
  let difficulty: DifficultyLevel = 'easy';
  if (year >= 3 && year <= 4) difficulty = 'medium';
  if (year >= 5) difficulty = 'pro';
  return generateProblemByDifficulty(difficulty, index, operation);
};

// New function using difficulty levels
export const generateProblemByDifficulty = (difficulty: DifficultyLevel, index: number, operation: OperationType): MathProblem => {
  let min = 1;
  let max = 10;
  let num1 = 0;
  let num2 = 0;

  // Adjust difficulty based on level
  // Easy: 2 digits max (10-99)
  // Medium: 3 digits (100-999)
  // Pro: 4 digits (1000-9999)
  switch (difficulty) {
    case 'easy': min = 10; max = 99; break;
    case 'medium': min = 100; max = 999; break;
    case 'pro': min = 1000; max = 9999; break;
  }

  // Adjust specific numbers based on operation
  if (operation === 'add') {
     num1 = Math.floor(Math.random() * (max - min)) + min;
     num2 = Math.floor(Math.random() * (max - min)) + min;
  } else if (operation === 'subtract') {
     // Ensure Num1 > Num2
     num1 = Math.floor(Math.random() * (max - min)) + min;
     num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
  } else if (operation === 'multiply') {
     // Strict Single Digit Multiplier for this UI to work with standard Vertical Form
     const maxMult = 9;
     num1 = Math.floor(Math.random() * (max - min)) + min;
     num2 = Math.floor(Math.random() * (maxMult - 2)) + 2;
  } else if (operation === 'divide') {
     // Limit divisor to max 9
     num2 = Math.floor(Math.random() * 8) + 2;
     num1 = Math.floor(Math.random() * (max - min)) + min;
  }

  return createMathProblem(index.toString(), num1, num2, operation);
};

const createMathProblem = (id: string, num1: number, num2: number, operation: OperationType): MathProblem => {
  let columns: MathColumn[] = [];
  
  if (operation === 'divide') {
     // Standard Short Division Logic
     // We process from Left (Most Significant) to Right.
     // num1 is Dividend, num2 is Divisor.
     
     const dividendStr = num1.toString();
     const digits = dividendStr.split('').map(Number);
     let currentRemainder = 0;
     
     // We need to reverse the array to match the "Least Significant at Index 0" structure of the App,
     // BUT Short Division is calculated Left-to-Right.
     // Let's calculate L-to-R first, then map to the app's R-to-L storage.
     
     const tempCols = [];
     
     for (let i = 0; i < digits.length; i++) {
         const digit = digits[i];
         const val = currentRemainder * 10 + digit;
         const quotientDigit = Math.floor(val / num2);
         const nextRemainder = val % num2;
         
         tempCols.push({
             digit1: digit,
             digit2: null,
             correctSumDigit: quotientDigit,
             correctCarryIn: currentRemainder, // Remainder from previous step (written top left usually, but here implied)
             correctCarryOut: nextRemainder // Remainder after this step (written next to digit)
         });
         
         currentRemainder = nextRemainder;
     }
     
     // Reverse to match app standard (Index 0 = Ones place)
     columns = tempCols.reverse();
     
  } else {
    // Add, Subtract, Multiply
    let result = 0;
    if (operation === 'add') result = num1 + num2;
    if (operation === 'subtract') result = num1 - num2;
    if (operation === 'multiply') result = num1 * num2;
    
    const num1Str = num1.toString().split('').reverse();
    const num2Str = num2.toString().split('').reverse();
    const resStr = result.toString().split('').reverse();
    
    const totalCols = Math.max(num1Str.length, num2Str.length, resStr.length);
    
    let currentCarry = 0; 

    for (let i = 0; i < totalCols; i++) {
      const d1 = i < num1Str.length ? parseInt(num1Str[i]) : null;
      const d2 = i < num2Str.length ? parseInt(num2Str[i]) : null;
      
      const val1 = d1 ?? 0;
      const val2 = d2 ?? 0;
      
      let ansDigit = i < resStr.length ? parseInt(resStr[i]) : 0;
      let nextCarry = 0;
      let colCarryIn = 0;

      if (operation === 'add') {
          colCarryIn = currentCarry;
          const sum = val1 + val2 + currentCarry;
          nextCarry = Math.floor(sum / 10);
      } else if (operation === 'multiply') {
          // Multiply Logic: TopDigit * Multiplier + PreviousCarry
          const multiplier = num2; 
          colCarryIn = currentCarry;
          
          const topDigit = val1; 
          const product = topDigit * multiplier + currentCarry;
          
          ansDigit = product % 10;
          nextCarry = Math.floor(product / 10);
      }
      
      columns.push({
        digit1: d1,
        digit2: d2,
        correctSumDigit: ansDigit,
        correctCarryIn: colCarryIn,
        correctCarryOut: nextCarry
      });

      currentCarry = nextCarry;
    }
  }

  return { id, num1, num2, operation, columns };
};

export const checkAnswer = (problem: MathProblem, userAnswer: { answerDigits: Record<number, string>, carryDigits: Record<number, string>, remainderDigits: Record<number, string> }): ValidationResult => {
  let allAnswersCorrect = true;
  
  const columnResults = problem.columns.map((col, idx) => {
    // Check main answer
    const userAns = userAnswer.answerDigits[idx] || '';
    
    let isAnswerCorrect = false;
    if (problem.operation === 'divide') {
        // Division: If leading zero (at the highest index), it's optional.
        if (col.correctSumDigit === 0 && idx === problem.columns.length - 1 && (userAns === '' || userAns === '0')) {
             isAnswerCorrect = true;
        } else {
             isAnswerCorrect = userAns === col.correctSumDigit.toString();
        }
    } else {
         isAnswerCorrect = userAns === col.correctSumDigit.toString();
    }
    
    const userCarry = userAnswer.carryDigits[idx] || '';
    let isCarryCorrect: boolean | null = null;
    let isRemainderCorrect: boolean | null = null;

    if (problem.operation === 'divide') {
        // Check remainder (stored in remainderDigits)
        const userRem = userAnswer.remainderDigits[idx] || '';
        // In this flow, we write the remainder AFTER the calculation, next to the digit.
        // col.correctCarryOut is the remainder passed to the NEXT step.
        // Note: For the last digit (index 0), it's the final remainder.
        
        if (col.correctCarryOut > 0) {
            isRemainderCorrect = userRem === col.correctCarryOut.toString();
        } else {
            // If remainder is 0, user shouldn't write anything, or write 0.
            if (userRem !== '' && userRem !== '0') isRemainderCorrect = false;
            else isRemainderCorrect = true;
        }
    }
    
    // Strict carry check for Addition AND Multiply
    else if (problem.operation === 'add' || problem.operation === 'multiply') {
        const isOverflowCol = problem.operation === 'multiply' && col.digit1 === null;

        if (col.correctCarryIn > 0) {
            if (userCarry === '') {
                if (isOverflowCol) isCarryCorrect = null;
                else isCarryCorrect = false;
            } else {
                isCarryCorrect = userCarry === col.correctCarryIn.toString();
            }
        } else {
             if (userCarry !== '' && userCarry !== '0') isCarryCorrect = false;
             else isCarryCorrect = true;
        }
    } else {
        isCarryCorrect = null;
    }

    if (!isAnswerCorrect) allAnswersCorrect = false;
    if (problem.operation === 'multiply' && isCarryCorrect === false) allAnswersCorrect = false;
    if (problem.operation === 'divide' && isRemainderCorrect === false) allAnswersCorrect = false;

    return {
      answerCorrect: isAnswerCorrect,
      carryCorrect: isCarryCorrect,
      remainderCorrect: isRemainderCorrect
    };
  });

  return {
    isCorrect: allAnswersCorrect,
    score: allAnswersCorrect ? 1 : 0,
    columnResults
  };
};