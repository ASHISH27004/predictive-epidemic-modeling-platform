import { type FormEvent } from 'react';
import type { HistoryEntry } from '../types';

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  loading: boolean;
  onRefresh: () => void;
  onAdd: (title: string, details: string) => Promise<void>;
}

export function HistoryModal({ open, onClose, history, loading, onRefresh, onAdd }: HistoryModalProps) {
  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value.trim();
    const details = (form.elements.namedItem('details') as HTMLTextAreaElement).value.trim();
    if (!title || !details) return;
    await onAdd(title, details);
    form.reset();
    onRefresh();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-slate-700/60 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">History Records</h2>
            <p className="text-sm text-slate-400">Stored operator history entries from the backend database.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">Close</button>
        </div>

        <div className="grid gap-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-300">Total records: {history.length}</span>
            <button onClick={onRefresh} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800">Refresh</button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-72 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">No history entries available yet.</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-700/80 bg-slate-900/90 p-4">
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>{item.user ?? (item as any).username}</span>
                    <span>{item.created_at ?? ''}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{item.details}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAdd} className="space-y-3 rounded-3xl border border-slate-700/80 bg-slate-950/80 p-4">
            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-slate-400">New Entry Title</label>
              <input name="title" className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-white outline-none focus:border-teal-400" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Details</label>
              <textarea name="details" rows={3} className="mt-2 w-full resize-none rounded-2xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-white outline-none focus:border-teal-400" />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Saving…' : 'Save History Entry'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
