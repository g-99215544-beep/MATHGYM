import React from 'react';
import { Assignment, DifficultyLevel, OperationType } from '../types';

interface AssignmentSelectionModalProps {
  assignments: Assignment[];
  studentName: string;
  onSelectAssignment: (assignment: Assignment) => void;
}

const AssignmentSelectionModal: React.FC<AssignmentSelectionModalProps> = ({
  assignments,
  studentName,
  onSelectAssignment
}) => {
  const getOperationLabel = (op: OperationType) => {
    const labels = { add: 'Tambah', subtract: 'Tolak', multiply: 'Darab', divide: 'Bahagi' };
    return labels[op];
  };

  const getDifficultyLabel = (diff: DifficultyLevel) => {
    const labels = { easy: 'Mudah', medium: 'Sederhana', pro: 'Pro' };
    return labels[diff];
  };

  const getOperationColor = (op: OperationType) => {
    const colors = {
      add: 'from-sky-400 to-indigo-500',
      subtract: 'from-rose-400 to-pink-600',
      multiply: 'from-orange-400 to-amber-600',
      divide: 'from-emerald-400 to-teal-600'
    };
    return colors[op];
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
          <h2 className="text-2xl font-bold mb-2">Tugasan untuk {studentName}</h2>
          <p className="text-indigo-100 text-sm">
            {assignments.length === 1
              ? 'Anda mempunyai 1 tugasan yang perlu disiapkan'
              : `Anda mempunyai ${assignments.length} tugasan yang perlu disiapkan. Pilih mana satu untuk mula dahulu.`}
          </p>
        </div>

        {/* Assignments List */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                onClick={() => onSelectAssignment(assignment)}
                className={`cursor-pointer transform hover:scale-105 transition-all duration-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl border-2 border-transparent hover:border-indigo-400`}
              >
                {/* Card Header with gradient based on operation */}
                <div className={`bg-gradient-to-r ${getOperationColor(assignment.operation)} text-white p-4`}>
                  <h3 className="text-xl font-bold mb-1">{assignment.title}</h3>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="bg-white/20 px-2 py-1 rounded-full">
                      {getOperationLabel(assignment.operation)}
                    </span>
                    <span className="bg-white/20 px-2 py-1 rounded-full">
                      {getDifficultyLabel(assignment.difficulty)}
                    </span>
                    <span className="bg-white/20 px-2 py-1 rounded-full">
                      {assignment.questionCount} soalan
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Klik untuk mula tugasan ini
                    </div>
                    <div className="text-indigo-600 font-bold">
                      Mula →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Footer */}
        <div className="bg-amber-50 border-t-2 border-amber-200 p-4 text-center">
          <p className="text-amber-800 text-sm font-semibold">
            Anda tidak boleh skip tugasan ini. Sila siapkan tugasan untuk teruskan.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssignmentSelectionModal;
