import React, { useState, useMemo } from 'react';
import { ScoreRecord } from '../services/firebase';
import PerformanceLineChart from './PerformanceLineChart';

interface StudentDetailModalProps {
  studentName: string;
  studentClass: string;
  scores: ScoreRecord[];
  onClose: () => void;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentName,
  studentClass,
  scores,
  onClose
}) => {
  const [filterOperation, setFilterOperation] = useState<string>('');

  // Get unique operations for this student
  const operations = useMemo(() => {
    return Array.from(new Set(scores.map(s => s.operation))).sort();
  }, [scores]);

  // Filter scores by operation
  const filteredScores = useMemo(() => {
    if (!filterOperation) return scores;
    return scores.filter(s => s.operation === filterOperation);
  }, [scores, filterOperation]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredScores.length;
    const passed = filteredScores.filter(s => s.percentage > 50).length;
    const failed = total - passed;
    const avgPercentage = total > 0
      ? Math.round(filteredScores.reduce((sum, s) => sum + s.percentage, 0) / total)
      : 0;

    // Stats by operation
    const byOperation: Record<string, { total: number; avg: number; passed: number }> = {};
    operations.forEach(op => {
      const opScores = scores.filter(s => s.operation === op);
      if (opScores.length > 0) {
        byOperation[op] = {
          total: opScores.length,
          avg: Math.round(opScores.reduce((sum, s) => sum + s.percentage, 0) / opScores.length),
          passed: opScores.filter(s => s.percentage > 50).length
        };
      }
    });

    return { total, passed, failed, avgPercentage, byOperation };
  }, [filteredScores, scores, operations]);

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

  const formatShortDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    return filteredScores.map(score => ({
      date: formatShortDate(score.timestamp),
      percentage: score.percentage,
      timestamp: score.timestamp
    }));
  }, [filteredScores]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center transition-all"
          >
            ✕
          </button>
          <h2 className="text-2xl font-bold mb-1">{studentName}</h2>
          <p className="text-indigo-100">Kelas {studentClass}</p>
        </div>

        {/* Stats Overview */}
        <div className="bg-slate-50 border-b border-slate-200 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-slate-600 text-xs font-semibold mb-1">JUMLAH CUBAAN</div>
              <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-green-700 text-xs font-semibold mb-1">LULUS (&gt;50%)</div>
              <div className="text-3xl font-bold text-green-800">{stats.passed}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-red-700 text-xs font-semibold mb-1">GAGAL (&le;50%)</div>
              <div className="text-3xl font-bold text-red-800">{stats.failed}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-blue-700 text-xs font-semibold mb-1">PURATA</div>
              <div className="text-3xl font-bold text-blue-800">{stats.avgPercentage}%</div>
            </div>
          </div>

          {/* Performance by Operation */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Prestasi Mengikut Kemahiran</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {operations.map(op => {
                const opStats = stats.byOperation[op];
                const color = opStats.avg > 70 ? 'green' : opStats.avg > 50 ? 'yellow' : 'red';
                return (
                  <div key={op} className={`bg-white rounded-lg p-3 border-2 ${
                    color === 'green' ? 'border-green-300' :
                    color === 'yellow' ? 'border-yellow-300' : 'border-red-300'
                  }`}>
                    <div className="text-xs font-semibold text-slate-600 mb-1">{op}</div>
                    <div className={`text-2xl font-bold ${
                      color === 'green' ? 'text-green-700' :
                      color === 'yellow' ? 'text-yellow-700' : 'text-red-700'
                    }`}>{opStats.avg}%</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {opStats.passed}/{opStats.total} lulus
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Performance Trend Chart */}
        <div className="p-6 bg-slate-50">
          <PerformanceLineChart data={chartData} operation={filterOperation || undefined} />
        </div>

        {/* Filter */}
        <div className="bg-white border-b border-slate-200 p-4">
          <label className="block text-xs font-semibold text-slate-600 mb-2">FILTER KEMAHIRAN</label>
          <select
            value={filterOperation}
            onChange={(e) => setFilterOperation(e.target.value)}
            className="w-full md:w-64 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Semua Kemahiran</option>
            {operations.map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        </div>

        {/* Score History */}
        <div className="overflow-y-auto max-h-[400px]">
          {filteredScores.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              Tiada rekod dijumpai
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Tarikh</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Tahun</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Kemahiran</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Soalan</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Betul</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Salah</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Markah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScores.map((score, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(score.timestamp)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{score.tahun}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{score.operation}</td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">{score.totalQuestions}</td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-green-600">{score.correctAnswers}</td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-red-600">{score.wrongAnswers}</td>
                    <td className="px-4 py-3 text-center">
                      <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${
                        score.percentage > 50
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {score.percentage}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;
