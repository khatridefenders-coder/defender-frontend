import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

function HomeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M12 3l7 4v5c0 4.418-3.134 8-7 9-3.866-1-7-4.582-7-9V7l7-4z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role, fullName, logout } = useAuthStore();
  const navigate = useNavigate();

  const coordinatorNav: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { to: '/voters', label: 'Voters', icon: <UsersIcon /> },
  ];

  const adminNav: NavItem[] = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { to: '/admin/voters', label: 'Voters', icon: <UsersIcon /> },
    { to: '/admin/coordinators', label: 'Coordinators', icon: <ShieldIcon /> },
  ];

  const navItems = role === 'ADMIN' ? adminNav : coordinatorNav;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const sidebar = (
    <div className="flex flex-col h-full bg-navy-700 text-white">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-navy-600">
        <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
          <ShieldIcon />
        </div>
        <div>
          <p className="font-bold text-sm leading-none">Constitution</p>
          <p className="text-xs text-navy-100 mt-0.5">Defender</p>
        </div>
      </div>

      <div className="px-3 py-4 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-navy-100 uppercase tracking-wider px-3 mb-2">
          {role === 'ADMIN' ? 'Admin Panel' : 'Coordinator Panel'}
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-navy-500 text-white'
                    : 'text-navy-100 hover:bg-navy-600 hover:text-white'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="px-3 py-4 border-t border-navy-600">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-navy-100">Signed in as</p>
          <p className="text-sm font-medium truncate">{fullName}</p>
          <p className="text-xs text-navy-100 capitalize">{role?.toLowerCase()}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-navy-100 hover:bg-navy-600 hover:text-white transition-colors"
        >
          <LogoutIcon />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 lg:w-64">
        {sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 flex-shrink-0 z-50">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-navy-700 text-white border-b border-navy-600">
          <button onClick={() => setSidebarOpen(true)} className="p-1 rounded-md hover:bg-navy-600">
            <MenuIcon />
          </button>
          <span className="font-bold text-sm">Constitution Defender</span>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1 rounded-md hover:bg-navy-600">
              <CloseIcon />
            </button>
          )}
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
