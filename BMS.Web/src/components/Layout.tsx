import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  LayoutDashboard,
  Clock,
  LogOut,
  CreditCard,
  FileBarChart,
  Shield,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
  MapPin
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ProfileModal from './ProfileModal';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
}

const NavItem = ({ to, icon: Icon, label, active, badge, onClick }: NavItemProps) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors duration-200 group relative focus-visible:ring-2 focus-visible:ring-red-500/30 outline-none",
      active
        ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-sm shadow-red-200/50 dark:shadow-red-900/20"
        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
    )}
  >
    <Icon className={cn("w-5 h-5 shrink-0", active ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
    <span className="font-medium text-sm">{label}</span>
    {badge && (
      <span className={cn(
        "ml-auto text-xs font-medium px-2 py-0.5 rounded-full",
        active ? "bg-white/20 text-white" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
      )}>
        {badge}
      </span>
    )}
  </Link>
);

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, can, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Dynamic Title Management for SEO
  React.useEffect(() => {
    const pageName = location.pathname === '/' 
      ? 'Dashboard' 
      : location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2);
    document.title = `${pageName} | Ayansh Enterprises`;
  }, [location]);

  const handleGlobalSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      navigate(`/customers?search=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch('');
    }
  };

  const closeSidebar = () => setSidebarOpen(false);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { to: '/customers', icon: Users, label: 'Customers', show: true },
    { to: '/renewals', icon: Clock, label: 'Renewals', show: can('RENEWAL_VIEW') },
    { to: '/payments', icon: CreditCard, label: 'Payments', show: can('PAYMENT_VIEW') },
    { to: '/reports', icon: FileBarChart, label: 'Reports', show: can('REPORT_VIEW') },
    { to: '/satara-visits', icon: MapPin, label: 'Satara Visits', show: can('SATARA_VIEW') },
    { to: '/users', icon: Shield, label: 'Users', show: can('USER_VIEW') },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-card border-r border-border p-5 flex flex-col fixed h-full z-40 transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 px-1">
            <img src="/logo.svg" alt="Ayansh Enterprises" className="w-10 h-10 pointer-events-none drop-shadow-md" />
            <div>
              <span className="text-xl font-extrabold tracking-tight text-foreground uppercase">AYANSH</span>
              <span className="block text-[8px] font-black text-red-600 tracking-[0.5em] uppercase -mt-1 ml-0.5 opacity-90">ENTERPRISES</span>
            </div>
          </div>
          <button onClick={closeSidebar} aria-label="Close sidebar" className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 px-2">
          <span className="text-xs font-medium text-muted-foreground/60">Navigation</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.filter(n => n.show).map(item => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to}
              onClick={closeSidebar}
            />
          ))}
        </nav>

        <div className="pt-5 mt-5 border-t border-border">
          <button
            onClick={() => { logout(); closeSidebar(); }}
            className="flex items-center gap-3 px-4 py-2.5 w-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Topbar */}
        <header className="h-14 bg-card/80 backdrop-blur-xl border-b border-border px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-2 text-xs font-bold">
              <span className="text-gray-400">Home</span>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className="text-foreground capitalize">{location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search customers... (Press Enter)"
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                onKeyDown={handleGlobalSearch}
                aria-label="Global customer search"
                className="w-64 bg-background border border-border rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition text-sm outline-none"
              />
            </div>
            
            <button
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20"
            >
              {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="View notifications"
                className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg relative transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-background"></span>
              </button>

              {showNotifications && (
                <div className="absolute top-11 right-0 w-80 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-border bg-muted/30 flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
                    <span className="text-xs font-medium bg-rose-50 dark:bg-rose-900/20 text-rose-600 px-2 py-0.5 rounded-full">2 New</span>
                  </div>
                  <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                    <div className="p-4 hover:bg-muted/50 cursor-pointer transition-colors" 
                         onClick={() => { navigate('/renewals'); setShowNotifications(false); }}>
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span> Urgent Renewals
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 ml-4 leading-relaxed">
                        There are agreements expiring within the next 7 days requiring immediate engagement.
                      </p>
                    </div>
                    <div className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                         onClick={() => { navigate('/payments'); setShowNotifications(false); }}>
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span> Financial Report
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 ml-4 leading-relaxed">
                        Previous payments successfully cleared and metrics updated in dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setProfileOpen(true)}
              aria-label="Open profile"
              className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center text-white text-xs font-semibold shadow-sm hover:scale-105 active:scale-95 transition-transform z-10 focus-visible:ring-2 focus-visible:ring-red-500/30"
            >
              {(user?.email || 'AD').substring(0, 2).toUpperCase()}
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>

      {/* Profile Modal */}
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
