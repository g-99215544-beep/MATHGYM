import React, { useState, useEffect } from 'react';
import { Assignment, DifficultyLevel, OperationType } from '../types';
import { loadStudents, getClasses, getStudentsByClass, Student, createAssignment, loadAllAssignments, deleteAssignment } from '../services/firebase';

interface AdminAssignmentProps {
  onBack: () => void;
}

const AdminAssignment: React.FC<AdminAssignmentProps> = ({ onBack }) => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [operation, setOperation] = useState<OperationType>('add');
  const [questionCount, setQuestionCount] = useState(10);
  const [includeBorrowing, setIncludeBorrowing] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const studentList = await loadStudents();
    const assignmentList = await loadAllAssignments();
    setStudents(studentList);
    setAssignments(assignmentList);
    setLoading(false);
  };

  const classes = getClasses(students);
  const studentsInClass = selectedClass ? getStudentsByClass(students, selectedClass) : [];

  // When class is selected, auto-select all students
  useEffect(() => {
    if (selectedClass) {
      const classStudents = getStudentsByClass(students, selectedClass);
      setSelectedStudentIds(classStudents.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  }, [selectedClass, students]);

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleCreateAssignment = async () => {
    if (!title.trim() || !selectedClass || selectedStudentIds.length === 0) {
      alert('Sila isi semua maklumat yang diperlukan');
      return;
    }

    setCreating(true);

    const newAssignment: Omit<Assignment, 'id'> = {
      title: title.trim(),
      kelas: selectedClass,
      assignedStudentIds: selectedStudentIds,
      difficulty,
      operation,
      questionCount,
      includeBorrowing: operation === 'subtract' ? includeBorrowing : undefined,
      createdAt: Date.now(),
      completedBy: []
    };

    const assignmentId = await createAssignment(newAssignment);

    if (assignmentId) {
      alert('Assignment berjaya dicipta!');
      // Reset form
      setTitle('');
      setSelectedClass('');
      setSelectedStudentIds([]);
      setDifficulty('easy');
      setOperation('add');
      setQuestionCount(10);
      setIncludeBorrowing(true);
      // Refresh data
      await fetchData();
      setView('list');
    } else {
      alert('Gagal mencipta assignment');
    }

    setCreating(false);
  };

  const handleDeleteAssignment = async (assignmentId: string, title: string) => {
    if (confirm(`Adakah anda pasti mahu padam assignment "${title}"?`)) {
      const success = await deleteAssignment(assignmentId);
      if (success) {
        alert('Assignment berjaya dipadam');
        await fetchData();
      } else {
        alert('Gagal memadam assignment');
      }
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOperationLabel = (op: OperationType) => {
    const labels = { add: 'Tambah', subtract: 'Tolak', multiply: 'Darab', divide: 'Bahagi' };
    return labels[op];
  };

  const getDifficultyLabel = (diff: DifficultyLevel) => {
    const labels = { easy: 'Mudah', medium: 'Sederhana', pro: 'Pro' };
    return labels[diff];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 text-lg">Memuatkan data...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-6 shadow-lg flex-shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">Pengurusan Assignment</h1>
            <p className="text-indigo-100 text-sm">Cipta dan urus tugasan untuk murid</p>
          </div>
          <button
            onClick={onBack}
            className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg font-bold transition-all"
          >
            Kembali
          </button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6"><div className="max-w-7xl mx-auto">
        {/* View Toggle */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setView('list')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              view === 'list'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            Senarai Assignment ({assignments.length})
          </button>
          <button
            onClick={() => setView('create')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              view === 'create'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            + Cipta Assignment Baru
          </button>
        </div>

        {/* List View */}
        {view === 'list' && (
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-md">
                <div className="text-slate-400 text-lg mb-2">Tiada assignment lagi</div>
                <button
                  onClick={() => setView('create')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold"
                >
                  Cipta Assignment Pertama
                </button>
              </div>
            ) : (
              assignments.map(assignment => {
                const completionRate = (assignment.completedBy.length / assignment.assignedStudentIds.length) * 100;
                return (
                  <div key={assignment.id} className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">{assignment.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                            Kelas {assignment.kelas}
                          </span>
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {getOperationLabel(assignment.operation)}
                          </span>
                          <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {getDifficultyLabel(assignment.difficulty)}
                          </span>
                          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {assignment.questionCount} soalan
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          <div>Dicipta: {formatDate(assignment.createdAt)}</div>
                          <div className="mt-1">
                            Murid: {assignment.assignedStudentIds.length} |
                            Selesai: {assignment.completedBy.length} ({Math.round(completionRate)}%)
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-semibold transition-all"
                      >
                        Padam
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Student List */}
                    <details className="mt-4">
                      <summary className="cursor-pointer text-indigo-600 font-semibold hover:text-indigo-800">
                        Lihat senarai murid ({assignment.assignedStudentIds.length})
                      </summary>
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {assignment.assignedStudentIds.map(studentId => {
                          const student = students.find(s => s.id === studentId);
                          const completed = assignment.completedBy.includes(studentId);
                          return (
                            <div
                              key={studentId}
                              className={`p-2 rounded-lg text-sm ${
                                completed
                                  ? 'bg-green-100 text-green-800 font-semibold'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {completed && '✓ '}
                              {student?.nama || studentId}
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Create View */}
        {view === 'create' && (
          <div className="bg-white rounded-xl p-8 shadow-lg border border-slate-200 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Cipta Assignment Baru</h2>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  TAJUK ASSIGNMENT <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Latihan Raya"
                  className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Class Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  PILIH KELAS <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              {/* Student Selection */}
              {selectedClass && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    PILIH MURID <span className="text-red-500">*</span>
                  </label>
                  <div className="text-xs text-slate-500 mb-3">
                    Semua murid dipilih secara automatik. Untick murid yang tidak perlu jawab.
                  </div>
                  <div className="border-2 border-slate-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                      {studentsInClass.map(student => (
                        <label
                          key={student.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => toggleStudent(student.id)}
                            className="w-5 h-5 text-indigo-600"
                          />
                          <span className="text-slate-700">{student.nama}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 mt-2">
                    {selectedStudentIds.length} / {studentsInClass.length} murid dipilih
                  </div>
                </div>
              )}

              {/* Operation */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">JENIS OPERASI</label>
                <div className="grid grid-cols-4 gap-3">
                  {(['add', 'subtract', 'multiply', 'divide'] as OperationType[]).map(op => (
                    <button
                      key={op}
                      onClick={() => setOperation(op)}
                      className={`py-3 rounded-lg font-bold transition-all ${
                        operation === op
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {getOperationLabel(op)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">TAHAP KESUKARAN</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['easy', 'medium', 'pro'] as DifficultyLevel[]).map(diff => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`py-3 rounded-lg font-bold transition-all ${
                        difficulty === diff
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {getDifficultyLabel(diff)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">JUMLAH SOALAN</label>
                <div className="grid grid-cols-4 gap-3">
                  {[5, 10, 20, 50].map(count => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`py-3 rounded-lg font-bold transition-all ${
                        questionCount === count
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Borrowing Option - only for subtraction */}
              {operation === 'subtract' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">PENGUMPULAN SEMULA (PINJAM)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setIncludeBorrowing(true)}
                      className={`py-3 rounded-lg font-bold transition-all ${
                        includeBorrowing
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Ya (Dengan pinjam)
                    </button>
                    <button
                      onClick={() => setIncludeBorrowing(false)}
                      className={`py-3 rounded-lg font-bold transition-all ${
                        !includeBorrowing
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Tidak (Tanpa pinjam)
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCreateAssignment}
                  disabled={creating || !title.trim() || !selectedClass || selectedStudentIds.length === 0}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all"
                >
                  {creating ? 'Mencipta...' : 'Cipta Assignment'}
                </button>
                <button
                  onClick={() => setView('list')}
                  className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 py-4 rounded-xl font-bold transition-all"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </div></div>
    </div>
  );
};

export default AdminAssignment;
