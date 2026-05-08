import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { votersApi } from '../../api/voters.api';
import { useAuthStore } from '../../store/auth.store';

function StatCard({ label, value, color }: { label: string; value: number | undefined; color: string }) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
    </div>
  );
}

export default function CoordinatorDashboardPage() {
  const fullName = useAuthStore((s) => s.fullName);
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: votersApi.getDashboard,
  });

  const arrived = data?.arrivedVoters ?? 0;
  const total = data?.totalVoters ?? 0;
  const pct = total > 0 ? Math.round((arrived / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {fullName}</h1>
        <p className="text-gray-500 text-sm mt-1">Track voter turnout for your constituency</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse h-24 bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Voters" value={data?.totalVoters} color="text-navy-500" />
          <StatCard label="Arrived" value={data?.arrivedVoters} color="text-green-600" />
          <StatCard label="Pending" value={data?.pendingVoters} color="text-amber-600" />
        </div>
      )}

      {!isLoading && total > 0 && (
        <div className="card">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Turnout Progress</span>
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

      <div className="flex gap-3">
        <Link to="/voters" className="btn-primary">
          View My Voters
        </Link>
      </div>
    </div>
  );
}
