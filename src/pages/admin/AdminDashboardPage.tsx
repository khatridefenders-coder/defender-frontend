import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { votersApi, SyncStatusResult } from '../../api/voters.api';

function StatCard({ label, value, color, to }: { label: string; value: number | undefined; color: string; to?: string }) {
  const content = (
    <div className="card flex flex-col gap-1 hover:shadow-md transition-shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

function SyncStateBadge({ state }: { state: SyncStatusResult['state'] }) {
  const map: Record<string, string> = {
    waiting: 'bg-yellow-100 text-yellow-700',
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    unknown: 'bg-gray-100 text-gray-600',
  };
  return <span className={`badge ${map[state] ?? map.unknown} capitalize`}>{state}</span>;
}


function ResetArrivedCard() {
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const mutation = useMutation({
    mutationFn: votersApi.resetAllArrived,
    onSuccess: () => {
      setConfirming(false);
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">Reset All Arrivals</h3>
          <p className="text-xs text-gray-500 mt-0.5">Mark every voter as not arrived — cannot be undone</p>
        </div>
        {!confirming ? (
          <button
            className="btn-secondary text-sm bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
            onClick={() => setConfirming(true)}
          >
            Reset Arrivals
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-700 font-medium">Are you sure?</span>
            <button
              className="btn-secondary text-sm"
              onClick={() => setConfirming(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              className="btn-secondary text-sm bg-red-600 text-white border-red-600 hover:bg-red-700"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Resetting…' : 'Yes, Reset'}
            </button>
          </div>
        )}
      </div>

      {mutation.isSuccess && (
        <div className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
          Reset {mutation.data.reset} voter{mutation.data.reset !== 1 ? 's' : ''} successfully.
        </div>
      )}

      {mutation.isError && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {(mutation.error as any)?.response?.data?.message ?? 'Failed to reset arrivals'}
        </div>
      )}
    </div>
  );
}

function MarkingToggleCard({ enabled }: { enabled: boolean | undefined }) {
  const qc = useQueryClient();

  const enableMutation = useMutation({
    mutationFn: votersApi.enableMarking,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-dashboard'] }),
  });

  const disableMutation = useMutation({
    mutationFn: votersApi.disableMarking,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-dashboard'] }),
  });

  const isPending = enableMutation.isPending || disableMutation.isPending;
  const error = (enableMutation.error || disableMutation.error) as any;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">Voter Marking</h3>
          <p className="text-xs text-gray-500 mt-0.5">Control whether coordinators can mark voters as arrived</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {enabled === undefined ? '—' : enabled ? 'Open' : 'Locked'}
          </span>
          {enabled ? (
            <button
              className="btn-secondary text-sm bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              onClick={() => disableMutation.mutate()}
              disabled={isPending || enabled === undefined}
            >
              {disableMutation.isPending ? 'Locking…' : 'Lock Marking'}
            </button>
          ) : (
            <button
              className="btn-primary text-sm"
              onClick={() => enableMutation.mutate()}
              disabled={isPending || enabled === undefined}
            >
              {enableMutation.isPending ? 'Opening…' : 'Open Marking'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error?.response?.data?.message ?? 'Failed to update marking status'}
        </div>
      )}
    </div>
  );
}

function SyncCard() {
  const qc = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatusResult | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  useEffect(() => () => stopPolling(), []);

  function startPolling(id: string) {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const s = await votersApi.getSyncStatus(id);
        setStatus(s);
        if (s.state === 'completed' || s.state === 'failed') {
          stopPolling();
          if (s.state === 'completed') {
            qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
          }
        }
      } catch { stopPolling(); }
    }, 3000);
  }

  const triggerMutation = useMutation({
    mutationFn: votersApi.triggerSync,
    onSuccess: (data) => {
      setJobId(data.jobId);
      setStatus(null);
      startPolling(data.jobId);
    },
  });

  const isActive = status?.state === 'waiting' || status?.state === 'active';
  const progress = status?.progress ?? 0;

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">Google Sheets Sync</h3>
          <p className="text-xs text-gray-500 mt-0.5">Re-import latest voter + coordinator data</p>
        </div>
        <button
          className="btn-primary text-sm"
          onClick={() => triggerMutation.mutate()}
          disabled={isActive || triggerMutation.isPending}
        >
          {isActive ? 'Syncing…' : 'Sync Now'}
        </button>
      </div>

      {triggerMutation.isError && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {(triggerMutation.error as any)?.response?.data?.message ?? 'Failed to start sync'}
        </div>
      )}

      {status && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <SyncStateBadge state={status.state} />
            <span className="text-xs text-gray-400">Job #{jobId}</span>
          </div>

          {(isActive || status.state === 'completed') && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-navy-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status.state === 'completed' && status.result && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {[
                { label: 'Voters Created', value: status.result.votersCreated },
                { label: 'Voters Updated', value: status.result.votersUpdated },
                { label: 'Coords Created', value: status.result.coordinatorsCreated },
                { label: 'Coords Updated', value: status.result.coordinatorsUpdated },
                { label: 'Skipped', value: status.result.skipped },
                { label: 'Duration', value: `${(status.result.durationMs / 1000).toFixed(1)}s` },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {status.state === 'failed' && status.failReason && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{status.failReason}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: votersApi.adminGetDashboard,
  });

  const arrived = data?.arrivedVoters ?? 0;
  const total = data?.totalVoters ?? 0;
  const pct = total > 0 ? Math.round((arrived / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overall voter turnout overview</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse h-24 bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Voters" value={data?.totalVoters} color="text-navy-500" to="/admin/voters" />
          <StatCard label="Arrived" value={data?.arrivedVoters} color="text-green-600" />
          <StatCard label="Pending" value={data?.pendingVoters} color="text-amber-600" />
          <StatCard label="Coordinators" value={data?.coordinatorCount} color="text-purple-600" to="/admin/coordinators" />
        </div>
      )}

      {!isLoading && total > 0 && (
        <div className="card">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Turnout</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-navy-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <MarkingToggleCard enabled={data?.markingEnabled} />
      <ResetArrivedCard />
      <SyncCard />
    </div>
  );
}
