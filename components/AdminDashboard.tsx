import React, { useState, useEffect } from 'react';
import { loadAllScores, ScoreRecord } from '../services/firebase';
import StudentDetailModal from './StudentDetailModal';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterOperation, setFilterOperation] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<{ name: string; class: string } | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      const scoreList = await loadAllScores();
      setScores(scoreList);
      setLoading(false);
    };
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

  // Group scores by class
  const scoresByClass = filteredScores.reduce((acc, score) => {
    if (!acc[score.kelas]) acc[score.kelas] = [];
    acc[score.kelas].push(score);
    return acc;
  }, {} as Record<string, ScoreRecord[]>);

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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-800 text-white p-6 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
            <p className="text-slate-300 text-sm">MathGym - Laporan Prestasi Murid</p>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-lg font-bold transition-all"
          >
            Logout
          </button>
        </div>
      </div>

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
            <div className="text-purple-600 text-sm font-semibold mb-1">Jumlah Kelas</div>
            <div className="text-3xl font-bold text-purple-900">{classes.length}</div>
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
            {Object.keys(scoresByClass).sort().map(kelas => (
              <div key={kelas} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
                  <h2 className="text-xl font-bold text-slate-800">Kelas {kelas}</h2>
                  <p className="text-sm text-slate-600">{scoresByClass[kelas].length} rekod</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Nama Murid</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Tahun</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Operasi</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Soalan</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Betul</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Salah</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Markah</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Tarikh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scoresByClass[kelas].map((score, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium">
                            <button
                              onClick={() => setSelectedStudent({ name: score.studentName, class: score.kelas })}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-semibold transition-colors"
                            >
                              {score.studentName}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{score.tahun}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{score.operation}</td>
                          <td className="px-4 py-3 text-sm text-center text-slate-600">{score.totalQuestions}</td>
                          <td className="px-4 py-3 text-sm text-center font-semibold text-green-600">{score.correctAnswers}</td>
                          <td className="px-4 py-3 text-sm text-center font-semibold text-red-600">{score.wrongAnswers}</td>
                          <td className="px-4 py-3">
                            <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${
                              score.percentage > 50
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : 'bg-red-100 text-red-800 border border-red-300'
                            }`}>
                              {score.percentage}%
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">{formatDate(score.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          studentName={selectedStudent.name}
          studentClass={selectedStudent.class}
          scores={scores.filter(s => s.studentName === selectedStudent.name && s.kelas === selectedStudent.class)}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
