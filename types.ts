export type YearLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type OperationType = 'add' | 'subtract' | 'multiply' | 'divide';
export type QuizMode = 'check-one' | 'check-all';

export interface MathProblem {
  id: string;
  num1: number;
  num2: number;
  operation: OperationType;
  columns: MathColumn[]; // Ordered from Least Significant (Ones) to Most Significant
}

export interface MathColumn {
  digit1: number | null; // Top number digit (Dividend for division)
  digit2: number | null; // Bottom number digit (Divisor for division)
  correctSumDigit: number; // The correct answer for this column
  correctCarryIn: number; // Carry/Borrow/Remainder value
  correctCarryOut: number; 
}

export interface UserAnswerState {
  // Map of column index to user input string
  answerDigits: Record<number, string>; 
  carryDigits: Record<number, string>;
  borrowDigits: Record<number, string>; // The small '1' next to the digit (for subtraction)
  remainderDigits: Record<number, string>; // For Division: Remainder written next to the digit
  slashedCols: Record<number, boolean>; // Which top digits are slashed (for subtraction or division)
}

export interface ValidationResult {
  isCorrect: boolean;
  score: number;
  columnResults: {
    answerCorrect: boolean;
    carryCorrect: boolean | null; 
    remainderCorrect?: boolean | null;
  }[];
}

export type ActiveCell = {
  problemId: string;
  columnIndex: number;
  type: 'answer' | 'carry' | 'borrow' | 'remainder';
};