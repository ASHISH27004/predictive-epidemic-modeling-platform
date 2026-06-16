import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { login, loading, error } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await login(username, password);
      onClose();
    } catch {
      // error state is handled in context
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-slate-700/60 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Operator Sign In</h2>
            <p className="text-xs text-slate-400">Use admin/admin to access history and operator controls.</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">Close</button>
        </div>

        <label className="block text-slate-300 text-xs uppercase tracking-[0.18em] mb-2">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-teal-400"
          autoComplete="username"
        />

        <label className="block text-slate-300 text-xs uppercase tracking-[0.18em] mt-4 mb-2">Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-teal-400"
          autoComplete="current-password"
        />

        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
