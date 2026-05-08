import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { votersApi, Coordinator, CreateCoordinatorPayload } from '../../api/voters.api';

function StatsTable() {
  const { data: stats = [], isLoading } = useQuery({
    queryKey: ['coordinator-stats'],
    queryFn: votersApi.getCoordinatorStats,
  });

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Turnout by Coordinator</h2>
        <p className="text-xs text-gray-500 mt-0.5">Sorted by total voters (highest first)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['#', 'Coordinator', 'Total', 'Arrived', 'Pending', 'Progress'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">Loading…</td>
              </tr>
            ) : stats.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">No data yet — run a sync first</td>
              </tr>
            ) : (
              stats.map((row, i) => {
                const pct = row.total > 0 ? Math.round((row.arrived / row.total) * 100) : 0;
                return (
                  <tr key={row.coordinatorId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-400 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.coordinatorName}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-navy-500 tabular-nums">{row.total}</td>
                    <td className="px-4 py-3 text-sm text-green-600 tabular-nums">{row.arrived}</td>
                    <td className="px-4 py-3 text-sm text-amber-600 tabular-nums">{row.pending}</td>
                    <td className="px-4 py-3 min-w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-navy-500 h-2 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 tabular-nums w-8 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div className="w-10 h-10 rounded-full bg-navy-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {initials}
    </div>
  );
}

function CreateCoordinatorModal({
  onClose,
  onCreate,
  creating,
  error,
}: {
  onClose: () => void;
  onCreate: (payload: CreateCoordinatorPayload) => void;
  creating: boolean;
  error: string;
}) {
  const [form, setForm] = useState<CreateCoordinatorPayload>({ username: '', fullName: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  function update(field: keyof CreateCoordinatorPayload, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: CreateCoordinatorPayload = {
      username: form.username.trim(),
      fullName: form.fullName.trim(),
      password: form.password,
    };
    if (form.phone?.trim()) payload.phone = form.phone.trim();
    onCreate(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">New Coordinator</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                className="input"
                placeholder="e.g. john_doe"
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                required
                disabled={creating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                className="input"
                placeholder="Full name"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                required
                disabled={creating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
              <input
                className="input"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                disabled={creating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Password</label>
              <div className="relative">
                <input
                  className="input pr-20"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                  minLength={8}
                  disabled={creating}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-navy-500 hover:text-navy-700"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Coordinator will be forced to change this on first login</p>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={creating}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCoordinatorsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [createError, setCreateError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Coordinator | null>(null);
  const qc = useQueryClient();

  const { data: coordinators = [], isLoading } = useQuery({
    queryKey: ['coordinators'],
    queryFn: votersApi.getCoordinators,
  });

  const createMutation = useMutation({
    mutationFn: votersApi.createCoordinator,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coordinators'] });
      setShowModal(false);
      setCreateError('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      setCreateError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Failed to create coordinator');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => votersApi.deleteCoordinator(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coordinators'] });
      qc.invalidateQueries({ queryKey: ['admin-voters'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setDeleteTarget(null);
    },
  });

  const filtered = coordinators.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {showModal && (
        <CreateCoordinatorModal
          onClose={() => { setShowModal(false); setCreateError(''); }}
          onCreate={(payload) => createMutation.mutate(payload)}
          creating={createMutation.isPending}
          error={createError}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Delete Coordinator?</h2>
            <p className="text-sm text-gray-600">
              <span className="font-medium">{deleteTarget.fullName}</span> will be permanently deleted.
              All voters assigned to them will become unassigned.
            </p>
            {deleteMutation.isError && (
              <p className="text-sm text-red-600">
                {(deleteMutation.error as any)?.response?.data?.message ?? 'Failed to delete'}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                className="btn-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Coordinators</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Coordinator
        </button>
      </div>

      <StatsTable />

      <input
        className="input max-w-sm"
        placeholder="Search by name or username…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse h-24 bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center text-gray-400 py-12">
          {coordinators.length === 0 ? 'No coordinators yet. Create one to get started.' : 'No results match your search.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="card flex items-start gap-4">
              <Avatar name={c.fullName} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{c.fullName}</p>
                <p className="text-sm text-gray-500">@{c.username}</p>
                {c.phone && <p className="text-sm text-gray-600 mt-0.5">{c.phone}</p>}
                {c.mustChangePassword && (
                  <span className="badge bg-amber-100 text-amber-700 mt-1">
                    Password change required
                  </span>
                )}
              </div>
              <button
                className="text-xs text-red-500 hover:text-red-700 underline flex-shrink-0"
                onClick={() => setDeleteTarget(c)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
