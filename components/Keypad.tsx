import React from 'react';

interface KeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onNext: () => void;
  onClearCarry?: () => void; // Specific feature requested
}

const Keypad: React.FC<KeypadProps> = ({ onKeyPress, onDelete, onNext, onClearCarry }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className="bg-white pb-6 pt-2 px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] border-t border-gray-100 sticky bottom-0 z-50">
      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-4 gap-2 mb-2">
            <div className="col-span-3 grid grid-cols-3 gap-2">
                {keys.map((k) => (
                    <button
                    key={k}
                    onClick={() => onKeyPress(k)}
                    className="h-14 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-slate-700 text-2xl font-bold rounded-xl shadow-sm border-b-4 border-blue-200 active:border-b-0 active:translate-y-1 transition-all"
                    >
                    {k}
                    </button>
                ))}
            </div>
            
            <div className="col-span-1 flex flex-col gap-2">
                <button
                    onClick={onDelete}
                    className="flex-1 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-500 rounded-xl flex items-center justify-center shadow-sm border-b-4 border-red-200 active:border-b-0 active:translate-y-1 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
                </button>
                <button
                    onClick={onNext}
                    className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl flex items-center justify-center shadow-sm border-b-4 border-green-700 active:border-b-0 active:translate-y-1 transition-all"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Keypad;
