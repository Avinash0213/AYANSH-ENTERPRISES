import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Plus, Loader2, DollarSign, Building2, Filter, Calendar } from 'lucide-react';
import { api } from '../api/axios';
import { cn, fmtDate } from '../lib/utils';
import Modal from '../components/Modal';
import CustomSelect from '../components/CustomSelect';
import DateInput from '../components/DateInput';
import type { Payment, PaymentSummary, Customer, CreatePaymentRequest } from '../types';

const emptyForm: CreatePaymentRequest = {
  customerId: 0,
  receivedAmount: 0,
  governmentCharges: 0,
  employeeCommission: 0,
  paymentDate: new Date().toISOString().split('T')[0],
  comment: '',
  collectorName: ''
};

const getDefaultDates = () => {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 7);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0]
  };
};

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CreatePaymentRequest>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFilters, setDateFilters] = useState(getDefaultDates());

  const fetchData = async (from?: string, to?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const [paymentsRes, summaryRes, custRes] = await Promise.all([
        api.get(`/payments?${params.toString()}`),
        api.get(`/payments/summary?${params.toString()}`),
        api.get('/customers')
      ]);
      setPayments(paymentsRes.data.items || []);
      setSummary(summaryRes.data);
      setCustomers(custRes.data.items || []);
    } catch (err) { console.error('Fetch error', err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData(dateFilters.from, dateFilters.to);
  }, [dateFilters.from, dateFilters.to]);

  const filteredPayments = (payments || []).filter(p => {
    const matchesSearch = (p.customerOwner || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.customerSerial || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sataraVisitCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.collectorName || '').toLowerCase().includes(searchTerm.toLowerCase());

    let matchesSource = true;
    if (sourceFilter === 'customer') {
      matchesSource = p.customerId != null;
    } else if (sourceFilter === 'visit') {
      matchesSource = p.sataraVisitCode != null;
    }

    return matchesSearch && matchesSource;
  });

  const computedProfit = form.receivedAmount - form.governmentCharges - form.employeeCommission;

  const handleSave = async () => {
    if (form.customerId === 0) return;
    setSaving(true);
    try {
      await api.post('/payments', form);
      setModalOpen(false);
      setForm(emptyForm);
      setLoading(true);
      await fetchData();
    } catch (err) { console.error('Save error', err); }
    finally { setSaving(false); }
  };

  const updateField = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  const summaryCards = summary ? [
    { label: 'Total Revenue', value: summary.totalReceived, color: 'from-red-600 to-red-700', light: false },
    { label: 'Govt Charges', value: summary.totalGovernmentCharges, color: '', light: true },
    { label: 'Visit Charges', value: summary.totalCommission, color: '', light: true },
    { label: 'Net Profit', value: summary.totalProfit, color: 'from-emerald-600 to-emerald-700', light: false },
  ] : [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight leading-snug">Accounts Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">Maintain a clean record of all service charges and profits</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition focus-visible:ring-2 focus-visible:ring-red-500/30 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      {/* Date Filters */}
      <section aria-labelledby="filters-heading" className="bg-card rounded-xl border border-border shadow-none p-5">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-red-600" />
          <h2 id="filters-heading" className="text-sm font-semibold text-foreground mr-3">Date Filter</h2>

          <div className="flex flex-wrap gap-2">
            {[
              {
                label: 'Today', range: () => {
                  const now = new Date();
                  return { from: now, to: now };
                }
              },
              {
                label: 'This Week', range: () => {
                  const now = new Date();
                  const day = now.getDay() || 7;
                  const from = new Date(now);
                  from.setDate(now.getDate() - day + 1);
                  return { from, to: now };
                }
              },
              {
                label: 'This Month', range: () => {
                  const now = new Date();
                  return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
                }
              },
              {
                label: 'Financial Year', range: () => {
                  const now = new Date();
                  const year = now.getMonth() + 1 < 4 ? now.getFullYear() - 1 : now.getFullYear();
                  return { from: new Date(year, 3, 1), to: now };
                }
              },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => {
                  const { from, to } = btn.range();
                  setDateFilters({
                    from: from.toISOString().split('T')[0],
                    to: to.toISOString().split('T')[0]
                  });
                }}
                className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20"
              >
                {btn.label}
              </button>
            ))}
            <button
              onClick={() => setDateFilters(getDefaultDates())}
              className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">From date</label>
            <DateInput value={dateFilters.from} onChange={v => setDateFilters(f => ({ ...f, from: v }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">To date</label>
            <DateInput value={dateFilters.to} onChange={v => setDateFilters(f => ({ ...f, to: v }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Source</label>
            <CustomSelect
              value={sourceFilter}
              onChange={(v) => setSourceFilter(String(v))}
              options={[
                { value: 'all', label: 'Combined' },
                { value: 'customer', label: 'Customer' },
                { value: 'visit', label: 'Client Visit' }
              ]}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => fetchData(dateFilters.from, dateFilters.to)}
              className="btn-primary w-full flex items-center justify-center gap-2 active:scale-95"
            >
              <Calendar className="w-4 h-4" /> Apply Filters
            </button>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl p-5 ${card.light
                ? 'bg-card border border-border shadow-none'
                : `bg-gradient-to-br ${card.color} text-white shadow-sm`}`}>
              <p className={`text-sm font-medium ${card.light ? 'text-muted-foreground' : 'text-white/70'}`}>{card.label}</p>
              <p className={`text-2xl font-semibold mt-1 ${card.light ? 'text-foreground' : ''}`}>
                ₹ {card.value.toLocaleString()}
              </p>
              {!card.light && card.label === 'Total Revenue' && (
                <p className="text-white/60 text-xs mt-1.5">{summary.totalPayments} payments</p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Payments Table */}
      <section aria-label="Payment records" className="rounded-xl border border-border bg-card shadow-none overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col md:flex-row gap-3 md:items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-semibold text-foreground">Payment Records</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </span>
              <input
                type="text"
                placeholder="Search by customer name, serial number, or visit code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search payments"
                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition"
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap" role="status" aria-live="polite">{filteredPayments.length} entries</span>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left" role="table">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Customer</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Received</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Govt</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Visit Charges</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Profit</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Executive</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center border border-border shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.customerOwner || 'Satara Visit'}</p>
                        <p className="text-xs text-muted-foreground">{p.customerSerial || p.sataraVisitCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-medium text-foreground">₹ {p.receivedAmount.toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">₹ {p.governmentCharges.toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">₹ {p.employeeCommission.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-medium ${p.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      ₹ {p.profit.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{p.collectorName || '-'}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{fmtDate(p.paymentDate)}</td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={7} className="p-12">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground" role="status" aria-live="polite">
                      <Loader2 className="w-7 h-7 animate-spin text-red-500" />
                      <span className="text-sm font-medium">Loading data...</span>
                    </div>
                  </td>
                </tr>
              )}
              {payments.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-sm text-muted-foreground">No payments recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-border">
          {filteredPayments.map(p => (
            <div key={p.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center border border-border text-red-600 shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.customerOwner || 'Satara Visit'}</p>
                    <p className="text-xs text-muted-foreground">{p.customerSerial || p.sataraVisitCode} {p.collectorName && `• ${p.collectorName}`}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Profit</p>
                  <p className={cn("text-sm font-medium", p.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    ₹ {p.profit.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-xl border border-border">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Received</p>
                  <p className="text-sm font-medium text-foreground">₹ {p.receivedAmount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Date</p>
                  <p className="text-sm text-muted-foreground">{fmtDate(p.paymentDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 px-1">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Govt</span>
                  <span className="text-xs font-medium text-foreground">₹ {p.governmentCharges.toLocaleString()}</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">V. Charges</span>
                  <span className="text-xs font-medium text-foreground">₹ {p.employeeCommission.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground" role="status" aria-live="polite">
              <Loader2 className="w-7 h-7 animate-spin text-red-500" />
              <span className="text-sm font-medium">Loading data...</span>
            </div>
          )}
          {payments.length === 0 && !loading && (
            <div className="p-12 text-center text-sm text-muted-foreground">No payments recorded yet</div>
          )}
        </div>
      </section>

      {/* Add Payment Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Customer *</label>
            <CustomSelect
              value={form.customerId ?? 0}
              onChange={(v) => updateField('customerId', parseInt(String(v)))}
              options={[
                { value: 0, label: 'Select a customer...' },
                ...customers.filter(c => c.type !== 2).map(c => ({ value: c.id, label: `${c.serialNumber} — ${c.ownerName}` }))
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Received amount *</label>
              <input type="number" min="0" step="0.01" value={form.receivedAmount || ''}
                onChange={e => updateField('receivedAmount', parseFloat(e.target.value) || 0)}
                className="input-field" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Govt charges</label>
              <input type="number" min="0" step="0.01" value={form.governmentCharges || ''}
                onChange={e => updateField('governmentCharges', parseFloat(e.target.value) || 0)}
                className="input-field" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Visit Charges</label>
              <input type="number" min="0" step="0.01" value={form.employeeCommission || ''}
                onChange={e => updateField('employeeCommission', parseFloat(e.target.value) || 0)}
                className="input-field" placeholder="0.00" />
            </div>
          </div>

          {/* Live Profit Preview */}
          <div className={`p-4 rounded-xl border ${computedProfit >= 0
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
            : 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Calculated Profit</span>
              <span className={`text-xl font-semibold ${computedProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                ₹ {computedProfit.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Received − Govt − Visit Charges</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Payment date *</label>
              <DateInput value={form.paymentDate} onChange={v => updateField('paymentDate', v)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Executive</label>
              <input type="text" value={form.collectorName || ''} onChange={e => updateField('collectorName', e.target.value)}
                className="input-field" placeholder="Who executed?" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Comment</label>
              <input type="text" value={form.comment || ''} onChange={e => updateField('comment', e.target.value)}
                className="input-field" placeholder="Optional details..." />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-border">
          <button
            onClick={() => setModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || form.customerId === 0 || form.receivedAmount <= 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
            Record Payment
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
