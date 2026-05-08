import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { votersApi, Voter } from '../../api/voters.api';

const PAGE_SIZE = 50;

type Tab = 'pending' | 'all';

function VoterRow({
  voter,
  onMark,
  onUnmark,
  busy,
}: {
  voter: Voter;
  onMark: (id: string) => void;
  onUnmark: (id: string) => void;
  busy: boolean;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-400 tabular-nums">
        {voter.sheetRowIndex != null ? voter.sheetRowIndex + 1 : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{voter.fCardNo || '—'}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{voter.fullName}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{voter.cardNo || '—'}</td>
      <td className="px-4 py-3">
        {voter.isArrived ? (
          <div className="flex items-center gap-2">
            <span className="badge bg-green-100 text-green-700">Arrived</span>
            <button
              className="text-xs text-red-500 hover:text-red-700 underline"
              onClick={() => onUnmark(voter.id)}
              disabled={busy}
            >
              Revert
            </button>
          </div>
        ) : (
          <button
            className="btn-primary text-xs px-3 py-1"
            onClick={() => onMark(voter.id)}
            disabled={busy}
          >
            Mark Arrived
          </button>
        )}
      </td>
    </tr>
  );
}

export default function CoordinatorVotersPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const qc = useQueryClient();

  function handleSearchChange(v: string) {
    setSearch(v);
    clearTimeout((window as any)._searchTimer);
    (window as any)._searchTimer = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(0);
    }, 400);
  }

  const queryFn = tab === 'pending'
    ? () => votersApi.getPending({ search: debouncedSearch, page, limit: PAGE_SIZE })
    : () => votersApi.getAll({ search: debouncedSearch, page, limit: PAGE_SIZE });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['coord-voters', tab, debouncedSearch, page],
    queryFn,
    placeholderData: (prev) => prev,
  });

  const markMutation = useMutation({
    mutationFn: votersApi.markArrived,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coord-voters'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const unmarkMutation = useMutation({
    mutationFn: votersApi.unmarkArrived,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coord-voters'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const voters = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Voters</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-300">
          {(['pending', 'all'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(0); }}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'bg-navy-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          className="input flex-1"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['#', 'FCard No', 'Full Name', 'Card No', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td>
                </tr>
              ) : voters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No voters found</td>
                </tr>
              ) : (
                voters.map((v) => (
                  <VoterRow
                    key={v.id}
                    voter={v}
                    onMark={(id) => markMutation.mutate(id)}
                    onUnmark={(id) => unmarkMutation.mutate(id)}
                    busy={markMutation.isPending || unmarkMutation.isPending}
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
            <span className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </span>
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
