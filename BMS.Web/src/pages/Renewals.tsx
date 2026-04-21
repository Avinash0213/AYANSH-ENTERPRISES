import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertCircle, Calendar, Mail, MessageCircle, User, Users, CheckCircle2, X, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../api/axios';
import { cn, fmtDate } from '../lib/utils';
import CustomerFormModal from '../components/CustomerFormModal';

export default function Renewals() {
  const [renewals, setRenewals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'urgent'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'info' });
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev: any) => ({ ...prev, show: false })), 4000);
  };

  const fetchRenewals = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/renewals');
      setRenewals(data);
    } catch (err) { console.error('Error fetching renewals'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchRenewals();
  }, []);

  const getUrgency = (endDate: string) => {
    const diff = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 7) return 'urgent';
    if (diff < 15) return 'near';
    return 'normal';
  };

  const getDaysLeft = (endDate: string) => {
    return Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const openRenewalModal = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setModalOpen(true);
  };

  const filtered = renewals.filter((r: any) => {
    const matchesFilter = filter === 'urgent' ? getUrgency(r.endDate) === 'urgent' : true;
    const matchesSearch = r.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         r.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleEmail = async (customerId: number, name: string, serialNumber: string, endDate: string, targetEmail?: string) => {
    const key = `email-${customerId}-${targetEmail}`;
    if (processing[key]) return;
    
    try {
      setProcessing(p => ({ ...p, [key]: true }));
      showToast(`Sending renewal email to ${name}...`, 'info');
      await api.post(`/notifications/renewal/${customerId}`, {
        targetEmail: targetEmail
      });
      showToast(`Renewal email sent successfully to ${name}`, 'success');
    } catch (err) {
      console.error('Error sending email', err);
      showToast(`Failed to send email to ${name}`, 'error');
    } finally {
      setProcessing(p => ({ ...p, [key]: false }));
    }
  };

  const handleSms = async (customerId: number, name: string, serialNumber: string, endDate: string, targetPhone?: string) => {
    const key = `sms-${customerId}-${targetPhone}`;
    if (processing[key]) return;
    
    try {
      setProcessing(p => ({ ...p, [key]: true }));
      showToast(`Sending renewal SMS to ${name}...`, 'info');
      await api.post(`/notifications/renewal/${customerId}`, {
        targetPhone: targetPhone
      });
      showToast(`Renewal SMS sent successfully to ${name}`, 'success');
    } catch (err) {
      console.error('Error sending SMS', err);
      showToast(`Failed to send SMS to ${name}`, 'error');
    } finally {
      setProcessing(p => ({ ...p, [key]: false }));
    }
  };

  const handleNotifyAll = async (customerId: number, ownerName: string) => {
    const key = `all-${customerId}`;
    if (processing[key]) return;

    try {
      setProcessing(p => ({ ...p, [key]: true }));
      showToast(`Sending all notifications for ${ownerName}...`, 'info');
      await api.post(`/notifications/renewal/${customerId}`, {});
      showToast(`All notifications sent successfully for ${ownerName}`, 'success');
    } catch (err) {
      console.error('Error sending all notifications', err);
      showToast(`Failed to send all notifications for ${ownerName}`, 'error');
    } finally {
      setProcessing(p => ({ ...p, [key]: false }));
    }
  };

  return (
    <>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 relative">
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className={cn(
              "fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border backdrop-blur-md min-w-[300px] max-w-md",
              toast.type === 'success' 
                ? "bg-emerald-500/90 text-white border-emerald-400" 
                : toast.type === 'error'
                  ? "bg-red-600/90 text-white border-red-500"
                  : "bg-indigo-600/90 text-white border-indigo-500"
            )}
            role="status"
            aria-live="polite"
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <MessageCircle className="w-5 h-5 shrink-0" />}
            <div className="flex-1">
              <p className="text-sm font-medium leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast((prev: any) => ({ ...prev, show: false }))}
              aria-label="Dismiss notification"
              className="p-1 hover:bg-white/20 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight leading-snug">Renewal Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">Proactively track agreement expirations to ensure zero gaps</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <button
            onClick={fetchRenewals}
            aria-label="Refresh renewal data"
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20 group"
          >
            <RefreshCw className={cn("w-4 h-4 text-muted-foreground group-hover:text-red-600 transition-colors", loading && "animate-spin")} />
            Refresh
          </button>
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-red-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
            <input
              type="text"
              placeholder="Search renewals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search renewals"
              className="pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm w-full md:w-56 text-foreground outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition"
            />
          </div>
          <div className="flex bg-card rounded-lg border border-border p-1 self-start">
            <button
              onClick={() => setFilter('all')}
              className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                filter === 'all' ? "text-red-600 bg-red-50 dark:bg-red-900/20" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Pending
            </button>
            <button
              onClick={() => setFilter('urgent')}
              className={cn("px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                filter === 'urgent' ? "text-rose-600 bg-rose-50 dark:bg-rose-900/20" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Urgent Only
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-xl p-5 text-white shadow-sm shadow-rose-200 dark:shadow-rose-900/10">
          <p className="text-rose-200 text-sm font-medium">Urgent (&lt; 7 days)</p>
          <p className="text-3xl font-semibold mt-1">{renewals.filter(r => getUrgency(r.endDate) === 'urgent').length}</p>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border shadow-none">
          <p className="text-muted-foreground text-sm font-medium">Near (&lt; 15 days)</p>
          <p className="text-2xl font-semibold text-amber-600 mt-1">{renewals.filter(r => getUrgency(r.endDate) === 'near').length}</p>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border shadow-none">
          <p className="text-muted-foreground text-sm font-medium">Total Due</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{renewals.length}</p>
        </div>
      </div>

      {/* Table */}
      <section aria-label="Renewal queue" className="rounded-xl border border-border bg-card shadow-none overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-semibold text-foreground">Renewal Queue</h2>
          </div>
          <span className="text-xs text-muted-foreground" role="status" aria-live="polite">{filtered.length} records</span>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left" role="table">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Customer</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Type</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Expiry date</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Days left</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r: any) => {
                const urgency = getUrgency(r.endDate);
                const days = getDaysLeft(r.endDate);
                return (
                  <tr key={r.id} className="group hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center font-medium text-sm border transition-colors",
                          urgency === 'urgent'
                            ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30"
                            : "bg-muted text-muted-foreground border-border group-hover:text-red-600"
                        )}>
                          {r.ownerName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{r.ownerName}</p>
                          <button 
                            onClick={() => openRenewalModal(r.id)}
                            className="text-xs text-red-600 font-semibold hover:underline hover:text-red-700 transition-all focus:outline-none"
                          >
                            {r.serialNumber}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                        {r.type === 1 ? 'Renewal' : 'New'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className={cn("text-sm font-medium",
                          urgency === 'urgent' ? "text-rose-600" : urgency === 'near' ? "text-amber-600" : "text-foreground"
                        )}>
                          {fmtDate(r.endDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
                        urgency === 'urgent' ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 animate-pulse" :
                        urgency === 'near' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {urgency === 'urgent' && <AlertCircle className="w-3 h-3" />}
                        {days} days
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">

                        {/* Owner Actions */}
                        <div className="flex flex-col items-end gap-1 p-2 bg-red-500/5 rounded-lg border border-red-500/10 min-w-[76px]">
                          <div className="flex items-center gap-1 text-xs font-medium text-red-500 mb-0.5">
                            <User className="w-2.5 h-2.5" />
                            Owner
                          </div>
                          <div className="flex items-center gap-1.5">
                            {r.ownerEmail ? (
                              <button
                                onClick={() => handleEmail(r.id, r.ownerName, r.serialNumber, r.endDate, r.ownerEmail)}
                                disabled={processing[`email-${r.id}-${r.ownerEmail}`]}
                                aria-label={`Email owner ${r.ownerName}`}
                                className="w-7 h-7 rounded-md bg-card border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20 disabled:opacity-50"
                              >
                                {processing[`email-${r.id}-${r.ownerEmail}`] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                              </button>
                            ) : (
                              <div className="w-7 h-7 rounded-md bg-muted border border-border flex items-center justify-center text-muted-foreground/40" title="No email">
                                <Mail className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {r.ownerPhone ? (
                              <button
                                onClick={() => handleSms(r.id, r.ownerName, r.serialNumber, r.endDate, r.ownerPhone)}
                                disabled={processing[`sms-${r.id}-${r.ownerPhone}`]}
                                aria-label={`WhatsApp owner ${r.ownerName}`}
                                className="w-7 h-7 rounded-md bg-card border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20 disabled:opacity-50"
                              >
                                {processing[`sms-${r.id}-${r.ownerPhone}`] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                              </button>
                            ) : (
                              <div className="w-7 h-7 rounded-md bg-muted border border-border flex items-center justify-center text-muted-foreground/40" title="No phone">
                                <MessageCircle className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tenant Actions */}
                        <div className="flex flex-col items-end gap-1 p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10 min-w-[76px]">
                          <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 mb-0.5">
                            <Users className="w-2.5 h-2.5" />
                            Tenant
                          </div>
                          <div className="flex items-center gap-1.5">
                            {r.tenantEmail ? (
                              <button
                                onClick={() => handleEmail(r.id, r.tenantName || 'Tenant', r.serialNumber, r.endDate, r.tenantEmail)}
                                disabled={processing[`email-${r.id}-${r.tenantEmail}`]}
                                aria-label={`Email tenant ${r.tenantName}`}
                                className="w-7 h-7 rounded-md bg-card border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/20 disabled:opacity-50"
                              >
                                {processing[`email-${r.id}-${r.tenantEmail}`] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                              </button>
                            ) : (
                              <div className="w-7 h-7 rounded-md bg-muted border border-border flex items-center justify-center text-muted-foreground/40" title="No email">
                                <Mail className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {r.tenantPhone ? (
                              <button
                                onClick={() => handleSms(r.id, r.tenantName || 'Tenant', r.serialNumber, r.endDate, r.tenantPhone)}
                                disabled={processing[`sms-${r.id}-${r.tenantPhone}`]}
                                aria-label={`WhatsApp tenant ${r.tenantName}`}
                                className="w-7 h-7 rounded-md bg-card border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500/20 disabled:opacity-50"
                              >
                                {processing[`sms-${r.id}-${r.tenantPhone}`] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                              </button>
                            ) : (
                              <div className="w-7 h-7 rounded-md bg-muted border border-border flex items-center justify-center text-muted-foreground/40" title="No phone">
                                <MessageCircle className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Notify All */}
                        <button
                          onClick={() => handleNotifyAll(r.id, r.ownerName)}
                          disabled={processing[`all-${r.id}`]}
                          className="flex items-center gap-2 px-3 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 h-full min-h-[60px]"
                          title="Notify All Parties (Email & SMS)"
                        >
                          {processing[`all-${r.id}`] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <div className="flex flex-col items-center">
                              <CheckCircle2 className="w-4 h-4 mb-1" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Notify All</span>
                            </div>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {loading && (
                <tr>
                  <td colSpan={5} className="p-12">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground" role="status" aria-live="polite">
                      <Loader2 className="w-7 h-7 animate-spin text-red-500" />
                      <span className="text-sm font-medium">Loading data...</span>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center border border-border">
                        <AlertCircle className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No renewals in the selected filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-border">
          {filtered.map((r: any) => {
            const urgency = getUrgency(r.endDate);
            const days = getDaysLeft(r.endDate);
            return (
              <div key={r.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center font-medium text-sm border",
                      urgency === 'urgent' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-red-50 text-red-600 border-red-100"
                    )}>
                      {r.ownerName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.ownerName}</p>
                      <button 
                        onClick={() => openRenewalModal(r.id)}
                        className="text-xs text-red-600 font-semibold hover:underline"
                      >
                        {r.serialNumber}
                      </button>
                    </div>
                  </div>
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                    urgency === 'urgent' ? "bg-rose-50 text-rose-600" :
                    urgency === 'near' ? "bg-amber-50 text-amber-600" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {days} days
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-y border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {fmtDate(r.endDate)}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                    {r.type === 1 ? 'Renewal' : 'New'}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Owner Row */}
                  <div className="flex items-center justify-between bg-red-500/5 p-2.5 rounded-lg border border-red-500/10">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-red-400" />
                      <span className="text-xs font-medium text-red-600">Owner</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.ownerEmail ? (
                        <button
                          onClick={() => handleEmail(r.id, r.ownerName, r.serialNumber, r.endDate, r.ownerEmail)}
                          disabled={processing[`email-${r.id}-${r.ownerEmail}`]}
                          aria-label={`Email owner ${r.ownerName}`}
                          className="w-7 h-7 rounded-md bg-card border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-600 focus-visible:ring-2 focus-visible:ring-red-500/20 disabled:opacity-50"
                        >
                          {processing[`email-${r.id}-${r.ownerEmail}`] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground/40">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {r.ownerPhone ? (
                        <button
                          onClick={() => handleSms(r.id, r.ownerName, r.serialNumber, r.endDate, r.ownerPhone)}
                          disabled={processing[`sms-${r.id}-${r.ownerPhone}`]}
                          aria-label={`WhatsApp owner ${r.ownerName}`}
                          className="w-7 h-7 rounded-md bg-card border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-600 focus-visible:ring-2 focus-visible:ring-red-500/20 disabled:opacity-50"
                        >
                          {processing[`sms-${r.id}-${r.ownerPhone}`] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground/40">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tenant Row */}
                  <div className="flex items-center justify-between bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10">
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600">Tenant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.tenantEmail ? (
                        <button
                          onClick={() => handleEmail(r.id, r.tenantName || 'Tenant', r.serialNumber, r.endDate, r.tenantEmail)}
                          disabled={processing[`email-${r.id}-${r.tenantEmail}`]}
                          aria-label={`Email tenant ${r.tenantName}`}
                          className="w-7 h-7 rounded-md bg-card border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/20 disabled:opacity-50"
                        >
                          {processing[`email-${r.id}-${r.tenantEmail}`] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground/40">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {r.tenantPhone ? (
                        <button
                          onClick={() => handleSms(r.id, r.tenantName || 'Tenant', r.serialNumber, r.endDate, r.tenantPhone)}
                          disabled={processing[`sms-${r.id}-${r.tenantPhone}`]}
                          aria-label={`WhatsApp tenant ${r.tenantName}`}
                          className="w-7 h-7 rounded-md bg-card border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/20 disabled:opacity-50"
                        >
                          {processing[`sms-${r.id}-${r.tenantPhone}`] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground/40">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notify All Mobile */}
                  <button
                    onClick={() => handleNotifyAll(r.id, r.ownerName)}
                    disabled={processing[`all-${r.id}`]}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                  >
                    {processing[`all-${r.id}`] ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Notify All Parties
                  </button>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground" role="status" aria-live="polite">
              <Loader2 className="w-7 h-7 animate-spin text-red-500" />
              <span className="text-sm font-medium">Loading data...</span>
            </div>
          )}
          {filtered.length === 0 && !loading && (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No matching records found
            </div>
          )}
        </div>
      </section>
    </motion.div>
    
    <CustomerFormModal 
      open={modalOpen} 
      onClose={() => setModalOpen(false)} 
      customerId={selectedCustomerId}
      onSuccess={() => {
        showToast('Agreement updated successfully', 'success');
        fetchRenewals();
      }}
      initialType={1} // Suggest Renewal type
    />
    </>
  );
}
