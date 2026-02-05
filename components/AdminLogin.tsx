import React, { useState } from 'react';
import { authenticateAdmin } from '../services/firebase';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBack }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (authenticateAdmin(password)) {
      onLogin();
    } else {
      setError('Password salah! Cuba lagi.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-700 to-slate-900 flex flex-col items-center justify-center p-6 text-white">
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl w-full max-w-md shadow-xl border border-white/20">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-3xl font-bold mb-2">Admin Login</h1>
          <p className="text-white/70 text-sm">Masukkan password untuk akses dashboard</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-white/20 text-white border border-white/30 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/40"
              placeholder="Masukkan password admin"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
          >
            Login
          </button>

          <button
            onClick={onBack}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all"
          >
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
