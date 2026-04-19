import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, ArrowUpRight, ShieldCheck, FileText } from 'lucide-react';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import type { Customer } from '../types';

const StatCard = ({ title, value, icon: Icon, color, prefix = '' }: any) => (
  <motion.div
    whileHover={{ y: -3 }}
    className="bg-card p-5 rounded-xl border border-border shadow-none transition-all duration-300 group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-lg ${color} group-hover:scale-105 transition-transform duration-200`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-sm text-muted-foreground">{title}</p>
    <div className="flex items-baseline gap-1 mt-1">
      <span className="text-2xl font-semibold text-foreground">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}</span>
    </div>
  </motion.div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, renewals: 0, active: 0 });
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const { can } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: customers }, { data: renewals }] = await Promise.all([
          api.get('/customers'),
          api.get('/renewals')
        ]);
        
        setStats({
          total: customers.length,
          active: customers.filter((c: Customer) => c.type !== 2).length,
          renewals: renewals.length
        });
        setRecentCustomers(customers.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard stats');
      }
    };
    fetchData();
  }, [can]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight leading-snug">Business Snapshot</h1>
        <p className="text-sm text-muted-foreground mt-1">Quick look at your daily agreement activity and growth</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Customers" value={stats.total} icon={Users} color="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" />
        <StatCard title="Active Customers" value={stats.active} icon={ShieldCheck} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Renewal Pipeline" value={stats.renewals} icon={Clock} color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" />
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Customers */}
        <section aria-labelledby="recent-heading" className="lg:col-span-2 bg-card rounded-xl border border-border shadow-none overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-border">
            <h2 id="recent-heading" className="text-sm font-semibold text-foreground">Recent Customers</h2>
            <a href="/customers" className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 group">
              View All <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
          <div className="divide-y divide-border">
            {recentCustomers.map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-sm font-medium text-muted-foreground border border-border">
                    {c.ownerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.ownerName}</p>
                    <p className="text-xs text-muted-foreground">{c.serialNumber}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  c.type === 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                  c.type === 1 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                  'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                }`}>
                  {c.typeName}
                </span>
              </div>
            ))}
            {recentCustomers.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No customers yet</div>
            )}
          </div>
        </section>

        {/* Quick Action Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white relative overflow-hidden shadow-sm">
          <div className="relative z-10">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold mb-1.5">Quick Add</h2>
            <p className="text-gray-400 text-sm mb-5 leading-relaxed">
              Create a new customer record with auto-generated serial number.
            </p>
            <Link
              to="/customers?new=true"
              className="inline-flex items-center gap-2 bg-white text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors active:scale-95 text-sm focus-visible:ring-2 focus-visible:ring-white/30"
            >
              New Customer <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-red-500/10 rounded-full blur-2xl"></div>
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
        </div>
      </motion.div>
    </motion.div>
  );
}
