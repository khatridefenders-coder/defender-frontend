import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { votersApi, Voter, Coordinator } from '../../api/voters.api';

const PAGE_SIZE = 50;

type StatusFilter = 'all' | 'pending' | 'arrived';

function AssignCoordinatorModal({
  voter,
  coordinators,
  onClose,
  onAssign,
  assigning,
}: {
  voter: Voter;
  coordinators: Coordinator[];
  onClose: () => void;
  onAssign: (coordId: string | null) => void;
  assigning: boolean;
}) {
  const [search, setSearch] = useState('');
  const filtered = coordinators.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Assign Coordinator</h2>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{voter.fullName}</p>
        </div>
        <div className="px-6 py-4 space-y-3">
          <input
            className="input"
            placeholder="Search coordinators…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {/* Unassign option */}
            <button
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm flex items-center justify-between hover:bg-gray-50 disabled:opacity-50 transition-colors ${!voter.coordinator ? 'bg-gray-100 border border-gray-300' : ''}`}
              onClick={() => onAssign(null)}
              disabled={assigning || !voter.coordinator}
            >
              <span className="text-gray-500 italic">Unassigned</span>
              {!voter.coordinator && <span className="text-xs text-gray-400">Current</span>}
            </button>

            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No coordinators found</p>
            )}
            {filtered.map((c) => {
              const isCurrent = voter.coordinator?.id === c.id;
              return (
                <button
                  key={c.id}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm flex items-center justify-between hover:bg-gray-50 disabled:opacity-50 transition-colors ${isCurrent ? 'bg-navy-50 border border-navy-200' : ''}`}
                  onClick={() => onAssign(c.id)}
                  disabled={assigning || isCurrent}
                >
                  <span className="font-medium text-gray-900">{c.fullName}</span>
                  {isCurrent && <span className="text-xs text-navy-500">Current</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function VoterRow({
  voter,
  isAdmin,
  onAssign,
  onMark,
  onUnmark,
}: {
  voter: Voter;
  isAdmin: boolean;
  onAssign: (v: Voter) => void;
  onMark: (v: Voter) => void;
  onUnmark: (v: Voter) => void;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-400 tabular-nums">
        {voter.sheetRowIndex != null ? voter.sheetRowIndex + 1 : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{voter.fCardNo || '—'}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{voter.fullName}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{voter.cardNo || '—'}</td>
      {isAdmin && <td className="px-4 py-3 text-sm text-gray-600">{voter.phone || '—'}</td>}
      <td className="px-4 py-3 text-sm text-gray-600">
        {voter.coordinator?.fullName ?? <span className="text-gray-400">Unassigned</span>}
      </td>
      <td className="px-4 py-3">
        {voter.isArrived ? (
          <div className="flex items-center gap-2">
            <span className="badge bg-green-100 text-green-700">Arrived</span>
            <button
              className="text-xs text-red-500 hover:text-red-700 underline"
              onClick={() => onUnmark(voter)}
            >
              Revert
            </button>
          </div>
        ) : (
          <button
            className="btn-primary text-xs px-3 py-1"
            onClick={() => onMark(voter)}
          >
            Mark Arrived
          </button>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          className="text-xs text-navy-500 hover:text-navy-700 underline"
          onClick={() => onAssign(voter)}
        >
          Reassign
        </button>
      </td>
    </tr>
  );
}

export default function AdminVotersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [selectedCoordId, setSelectedCoordId] = useState('');
  const [page, setPage] = useState(0);
  const [assignTarget, setAssignTarget] = useState<Voter | null>(null);
  const qc = useQueryClient();

  function handleSearchChange(v: string) {
    setSearch(v);
    clearTimeout((window as any)._searchTimer);
    (window as any)._searchTimer = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(0);
    }, 400);
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-voters', debouncedSearch, status, selectedCoordId, page],
    queryFn: () =>
      votersApi.adminGetVoters({
        search: debouncedSearch || undefined,
        coordinatorId: selectedCoordId || undefined,
        status: status === 'all' ? undefined : status,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  });

  const { data: coordinators = [] } = useQuery({
    queryKey: ['coordinators'],
    queryFn: votersApi.getCoordinators,
  });

  const assignMutation = useMutation({
    mutationFn: ({ voterId, coordId }: { voterId: string; coordId: string | null }) =>
      votersApi.assignCoordinator(voterId, coordId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-voters'] });
      setAssignTarget(null);
    },
  });

  const markMutation = useMutation({
    mutationFn: (voterId: string) => votersApi.adminMarkArrived(voterId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-voters'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });

  const unmarkMutation = useMutation({
    mutationFn: (voterId: string) => votersApi.unmarkArrived(voterId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-voters'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });

  const voters = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {assignTarget && (
        <AssignCoordinatorModal
          voter={assignTarget}
          coordinators={coordinators}
          onClose={() => setAssignTarget(null)}
          onAssign={(coordId) => assignMutation.mutate({ voterId: assignTarget.id, coordId: coordId ?? null })}
          assigning={assignMutation.isPending}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Voters</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <input
          className="input flex-1 min-w-48"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <select
          className="input w-auto"
          value={selectedCoordId}
          onChange={(e) => { setSelectedCoordId(e.target.value); setPage(0); }}
        >
          <option value="">All Coordinators</option>
          {coordinators.map((c) => (
            <option key={c.id} value={c.id}>{c.fullName}</option>
          ))}
        </select>
        <div className="flex rounded-lg overflow-hidden border border-gray-300">
          {(['all', 'pending', 'arrived'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(0); }}
              className={`px-3 py-2 text-sm font-medium capitalize transition-colors ${
                status === s ? 'bg-navy-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'FCard No', 'Full Name', 'Card No', 'Phone', 'Coordinator', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading…</td>
                </tr>
              ) : voters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">No voters found</td>
                </tr>
              ) : (
                voters.map((v) => (
                  <VoterRow
                    key={v.id}
                    voter={v}
                    isAdmin
                    onAssign={setAssignTarget}
                    onMark={(voter) => markMutation.mutate(voter.id)}
                    onUnmark={(voter) => unmarkMutation.mutate(voter.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <button
              className="btn-secondary text-sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isFetching}
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
            <button
              className="btn-secondary text-sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || isFetching}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
