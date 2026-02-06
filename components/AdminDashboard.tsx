import React, { useState, useEffect, useMemo } from 'react';
import { loadAllScores, ScoreRecord, deleteStudentScores } from '../services/firebase';
import StudentDetailModal from './StudentDetailModal';

interface AdminDashboardProps {
  onLogout: () => void;
  onManageAssignments: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onManageAssignments }) => {
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterOperation, setFilterOperation] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<{ name: string; class: string } | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<{ name: string; class: string } | null>(null);

  const fetchScores = async () => {
    setLoading(true);
    const scoreList = await loadAllScores();
    setScores(scoreList);
    setLoading(false);
  };

  useEffect(() => {
    fetchScores();
  }, []);

  // Get unique classes and operations for filters
  const classes = Array.from(new Set(scores.map(s => s.kelas))).sort();
  const operations = Array.from(new Set(scores.map(s => s.operation))).sort();

  // Filter scores
  const filteredScores = scores.filter(score => {
    if (filterClass && score.kelas !== filterClass) return false;
    if (filterOperation && score.operation !== filterOperation) return false;
    return true;
  });

  // Group scores by class, then by student
  const studentsByClass = useMemo(() => {
    const byClass: Record<string, Record<string, { name: string; scores: ScoreRecord[] }>> = {};

    filteredScores.forEach(score => {
      if (!byClass[score.kelas]) byClass[score.kelas] = {};
      const studentKey = score.studentName;
      if (!byClass[score.kelas][studentKey]) {
        byClass[score.kelas][studentKey] = { name: score.studentName, scores: [] };
      }
      byClass[score.kelas][studentKey].scores.push(score);
    });

    return byClass;
  }, [filteredScores]);

  // Count unique students
  const totalStudents = useMemo(() => {
    const studentSet = new Set(filteredScores.map(s => `${s.kelas}-${s.studentName}`));
    return studentSet.size;
  }, [filteredScores]);

  const handleDeleteStudent = async (name: string, kelas: string) => {
    const success = await deleteStudentScores(name, kelas);
    if (success) {
      setScores(prev => prev.filter(s => !(s.studentName === name && s.kelas === kelas)));
    }
    setDeletingStudent(null);
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

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 text-white p-6 shadow-lg z-10 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
            <p className="text-slate-300 text-sm">MathGym - Laporan Prestasi Murid</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchScores}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={onManageAssignments}
              className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-lg font-bold transition-all"
            >
              Urus Assignment
            </button>
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-lg font-bold transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">

      {/* Stats Summary */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-600 text-sm font-semibold mb-1">Jumlah Rekod</div>
            <div className="text-3xl font-bold text-blue-900">{filteredScores.length}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-600 text-sm font-semibold mb-1">Lulus (&gt;50%)</div>
            <div className="text-3xl font-bold text-green-900">
              {filteredScores.filter(s => s.percentage > 50).length}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-600 text-sm font-semibold mb-1">Gagal (&le;50%)</div>
            <div className="text-3xl font-bold text-red-900">
              {filteredScores.filter(s => s.percentage <= 50).length}
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-purple-600 text-sm font-semibold mb-1">Jumlah Murid</div>
            <div className="text-3xl font-bold text-purple-900">{totalStudents}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="max-w-7xl mx-auto flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1">FILTER KELAS</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kelas</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1">FILTER OPERASI</label>
            <select
              value={filterOperation}
              onChange={(e) => setFilterOperation(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Operasi</option>
              {operations.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-slate-500 text-lg">Memuatkan data...</div>
          </div>
        ) : filteredScores.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 text-lg">Tiada rekod dijumpai</div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(studentsByClass).sort().map(kelas => {
              const studentsInClass = studentsByClass[kelas];
              const studentNames = Object.keys(studentsInClass).sort();
              const totalRecords = studentNames.reduce((sum, name) => sum + studentsInClass[name].scores.length, 0);

              return (
                <div key={kelas} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                  <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">Kelas {kelas}</h2>
                    <p className="text-sm text-slate-600">{studentNames.length} murid | {totalRecords} rekod</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Nama Murid</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Cubaan</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Purata</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Terbaik</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Operasi Terkini</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Tarikh Terkini</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentNames.map(studentName => {
                          const studentData = studentsInClass[studentName];
                          const studentScores = studentData.scores;
                          const avgPercentage = Math.round(studentScores.reduce((sum, s) => sum + s.percentage, 0) / studentScores.length);
                          const bestPercentage = Math.max(...studentScores.map(s => s.percentage));
                          const latestScore = studentScores.sort((a, b) => b.timestamp - a.timestamp)[0];
                          const uniqueOps = Array.from(new Set(studentScores.map(s => s.operation)));

                          return (
                            <tr
                              key={studentName}
                              className="hover:bg-blue-50 cursor-pointer transition-colors"
                              onClick={() => setSelectedStudent({ name: studentName, class: kelas })}
                            >
                              <td className="px-4 py-3 text-sm font-medium">
                                <span className="text-blue-600 hover:text-blue-800 font-semibold">
                                  {studentName}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-center text-slate-600">{studentScores.length}</td>
                              <td className="px-4 py-3 text-center">
                                <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${
                                  avgPercentage > 50
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : 'bg-red-100 text-red-800 border border-red-300'
                                }`}>
                                  {avgPercentage}%
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${
                                  bestPercentage > 50
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : 'bg-red-100 text-red-800 border border-red-300'
                                }`}>
                                  {bestPercentage}%
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                <div className="flex flex-wrap gap-1">
                                  {uniqueOps.map(op => (
                                    <span key={op} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium">{op}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500">{formatDate(latestScore.timestamp)}</td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingStudent({ name: studentName, class: kelas });
                                  }}
                                  className="bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 p-2 rounded-lg transition-all"
                                  title="Padam data murid"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      </div>{/* End scrollable content */}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          studentName={selectedStudent.name}
          studentClass={selectedStudent.class}
          scores={scores.filter(s => s.studentName === selectedStudent.name && s.kelas === selectedStudent.class)}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeletingStudent(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Padam Data Murid?</h3>
              <p className="text-sm text-slate-600 mb-6">
                Semua rekod markah untuk <span className="font-bold">{deletingStudent.name}</span> (Kelas {deletingStudent.class}) akan dipadam. Tindakan ini tidak boleh dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingStudent(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDeleteStudent(deletingStudent.name, deletingStudent.class)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-bold transition-all"
                >
                  Padam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
