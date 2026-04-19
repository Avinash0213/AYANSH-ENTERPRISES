import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Phone, Calendar, Clock,
  Loader2, History, Pencil,
  Edit3, Key,
  User, Hash,
  ChevronLeft, ChevronRight, CheckCircle2,
  DollarSign, MapPin
} from 'lucide-react';
import { api } from '../api/axios';
import { cn, fmtDate } from '../lib/utils';
import Modal from '../components/Modal';
import CustomSelect from '../components/CustomSelect';
import DateInput from '../components/DateInput';
import type { SataraVisit, UpdateSataraVisitRequest, Payment } from '../types';

const emptyForm = {
  personName: '', phoneNumber: '', address: '',
  scheduledTime: new Date().toISOString(), taskType: '', tokenNumber: '',
  password: '', remarks: '', status: 'Pending' as any,
  receivedAmount: 0, employeeCommission: 0, paymentDate: new Date().toISOString().split('T')[0],
  comment: '', collectorName: ''
};

const PAGE_SIZE = 8;

export default function SataraVisits() {
  const [visits, setVisits] = useState<SataraVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewVisit, setViewVisit] = useState<SataraVisit | null>(null);
  const [editPayment, setEditPayment] = useState<any>(null);

  const [visitPayments, setVisitPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/satara-visits');
      setVisits(data);
    } catch { console.error('Error fetching visits'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVisits(); }, []);

  const fetchVisitPayments = async (visitCode: string) => {
    setLoadingPayments(true);
    setVisitPayments([]);
    try {
      try {
        const { data } = await api.get(`/payments/visit/${visitCode}`);
        if (Array.isArray(data)) {
          setVisitPayments(data);
          setLoadingPayments(false);
          return;
        }
      } catch (e: any) {
        if (e.response?.status === 404) {
          console.warn('Visit-specific endpoint not found (404), using master-list fallback.');
        } else {
          throw e;
        }
      }
      
      // Fallback: Fetch all payments and filter locally
      const { data } = await api.get(`/payments?from=2024-01-01`); // Ensure we get a wide range
      const filtered = (data || []).filter((p: any) => 
        (p.sataraVisitCode || '').toLowerCase() === visitCode.toLowerCase()
      );
      setVisitPayments(filtered);
    } catch (err) { 
      console.error('Error fetching payments:', err); 
    }
    finally { setLoadingPayments(false); }
  };

  useEffect(() => {
    if (viewVisit) {
      fetchVisitPayments(viewVisit.visitCode);
    } else if (modalOpen && editingId) {
      const visit = visits.find(v => v.id === editingId);
      if (visit) fetchVisitPayments(visit.visitCode);
    } else if (!modalOpen && !viewVisit) {
      setVisitPayments([]);
    }
  }, [viewVisit, modalOpen, editingId, visits]);

  const filteredVisits = visits.filter(v => {
    const matchesSearch = v.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.visitCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.phoneNumber || '').includes(searchTerm);
    const matchesStatus = statusFilter === '' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredVisits.length / PAGE_SIZE);
  const paginatedVisits = filteredVisits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateField = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.personName) return;
    setSaving(true);
    try {
      const payload: UpdateSataraVisitRequest = {
        personName: form.personName,
        phoneNumber: form.phoneNumber,
        address: form.address,
        scheduledTime: form.scheduledTime,
        taskType: form.taskType,
        tokenNumber: form.tokenNumber,
        password: form.password,
        remarks: form.remarks,
        status: form.status
      };

      let visitCode = '';
      if (editingId) {
        const res = await api.put(`/satara-visits/${editingId}`, payload);
        visitCode = res.data.visitCode;
      } else {
        const res = await api.post('/satara-visits', payload);
        visitCode = res.data.visitCode;
      }

      if (form.receivedAmount > 0) {
        await api.post('/payments', {
          sataraVisitCode: visitCode,
          receivedAmount: form.receivedAmount,
          governmentCharges: 0,
          employeeCommission: form.employeeCommission,
          paymentDate: form.paymentDate || new Date().toISOString().split('T')[0],
          comment: form.comment || `Payment for Satara Visit: ${visitCode}`,
          collectorName: form.collectorName
        });
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchVisits();
    } catch (err) {
      console.error('Save error', err);
      alert("Error saving record. Please check all fields.");
    }
    finally { setSaving(false); }
  };

  const updatePaymentRecord = async () => {
    if (!editPayment) return;
    setSaving(true);
    try {
      await api.put(`/payments/${editPayment.id}`, editPayment);
      setEditPayment(null);
      if (editingId) {
        const visit = visits.find(v => v.id === editingId);
        if (visit) fetchVisitPayments(visit.visitCode);
      } else if (viewVisit) {
        fetchVisitPayments(viewVisit.visitCode);
      }
    } catch { console.error('Payment update error'); }
    finally { setSaving(false); }
  };

  const openEdit = (v: SataraVisit) => {
    setEditingId(v.id);
    setForm({
      ...emptyForm,
      personName: v.personName,
      phoneNumber: v.phoneNumber || '',
      address: v.address || '',
      scheduledTime: v.scheduledTime,
      taskType: v.taskType || '',
      tokenNumber: v.tokenNumber || '',
      password: v.password || '',
      remarks: v.remarks || '',
      status: v.status as any,
    });
    setModalOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight leading-snug">Satara Operations</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage field visits</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm(emptyForm); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition focus-visible:ring-2 focus-visible:ring-red-500/30 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Schedule Visit
        </button>
      </div>

      <section className="rounded-xl border border-border bg-card shadow-none">
        <div className="px-5 py-4 border-b border-border flex flex-col md:flex-row gap-3 md:items-center justify-between bg-muted/30 rounded-t-xl">
          <div className="flex flex-col md:flex-row flex-1 gap-3 max-w-2xl w-full">
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-red-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by client name, visit code..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition"
              />
            </div>
            <CustomSelect
              value={statusFilter}
              onChange={(v) => { setStatusFilter(String(v)); setPage(1); }}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
              className="!w-auto min-w-[170px]"
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {filteredVisits.length} records
          </span>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Visit ID</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Client & Contact</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Address</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Schedule & Status</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <AnimatePresence mode="popLayout">
                {paginatedVisits.map(v => (
                  <motion.tr key={v.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-4">
                      <span
                        onClick={() => setViewVisit(v)}
                        className="text-sm font-semibold text-foreground cursor-pointer hover:text-red-600 hover:underline transition-colors rounded"
                      >
                        {v.visitCode}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{v.personName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="w-3 h-3" /> {v.phoneNumber || '—'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-muted-foreground line-clamp-2 max-w-[200px] leading-relaxed" title={v.address}>
                        {v.address || <span className="text-muted-foreground/50">—</span>}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {fmtDate(v.scheduledTime)} {new Date(v.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                          v.status === 'Pending' ? "bg-amber-50 text-amber-700" :
                            v.status === 'Completed' ? "bg-emerald-50 text-emerald-700" :
                              "bg-rose-50 text-rose-700"
                        )}>
                          {v.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openEdit(v)}
                        className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-border">
          {paginatedVisits.map(v => (
            <div key={v.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p
                    onClick={() => setViewVisit(v)}
                    className="text-sm font-semibold text-foreground cursor-pointer active:text-red-600 rounded"
                  >
                    #{v.visitCode}
                  </p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{v.personName}</p>
                  <span className={cn(
                    "inline-flex px-2 py-0.5 mt-1 rounded-full text-xs font-medium",
                    v.status === 'Pending' ? "bg-amber-50 text-amber-700" :
                      v.status === 'Completed' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  )}>{v.status}</span>
                </div>
                <button onClick={() => openEdit(v)} className="p-2 text-red-600 bg-red-50 rounded-lg active:scale-90 transition">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-xl border border-border">
                <div className="col-span-2">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Address</p>
                  <p className="text-xs text-foreground leading-relaxed line-clamp-2">{v.address || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">Sch. Date</p>
                  <p className="text-xs text-foreground">{fmtDate(v.scheduledTime)} {new Date(v.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-7 h-7 animate-spin text-red-500" />
            <span className="text-sm font-medium">Loading data...</span>
          </div>
        )}
        {!loading && filteredVisits.length === 0 && (
          <div className="p-12 text-center text-sm text-muted-foreground">
            No matching records found
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-muted border border-transparent hover:border-border disabled:opacity-30 transition-colors text-foreground focus-visible:ring-2 focus-visible:ring-red-500/20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-muted border border-transparent hover:border-border disabled:opacity-30 transition-colors text-foreground focus-visible:ring-2 focus-visible:ring-red-500/20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Field Record' : 'Schedule Field Operation'}>
        <div className="space-y-6">
          <section className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Client / Person Name *</label>
                <input type="text" value={form.personName} onChange={e => updateField('personName', e.target.value)}
                  className="input-field" placeholder="e.g. Rahul Deshmukh" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Contact Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input type="text" value={form.phoneNumber} onChange={e => updateField('phoneNumber', e.target.value)}
                    className="input-field pl-9" placeholder="+91 XXXXX" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Visit Status</label>
                <CustomSelect value={form.status} onChange={v => updateField('status', v)}
                  options={[{ value: 'Pending', label: 'Pending' }, { value: 'Completed', label: 'Completed' }, { value: 'Cancelled', label: 'Cancelled' }]}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Scheduled Date & Time *</label>
                <input type="datetime-local" value={form.scheduledTime.substring(0, 16)} onChange={e => updateField('scheduledTime', new Date(e.target.value).toISOString())}
                  className="input-field" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Full Visit Address</label>
                <textarea value={form.address} onChange={e => updateField('address', e.target.value)}
                  className="input-field min-h-[70px] resize-none" placeholder="Street name, landmark, area..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Task Classification</label>
                <input type="text" value={form.taskType} onChange={e => updateField('taskType', e.target.value)}
                  className="input-field" placeholder="e.g. KYC, Inspection" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Reference Token</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input type="text" value={form.tokenNumber} onChange={e => updateField('tokenNumber', e.target.value)}
                    className="input-field pl-9" placeholder="Ref ID" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Agreement Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input type="text" value={form.password} onChange={e => updateField('password', e.target.value)}
                    className="input-field pl-9" placeholder="Security Pass" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Remarks</label>
                <input type="text" value={form.remarks} onChange={e => updateField('remarks', e.target.value)}
                  className="input-field" placeholder="Special instructions..." />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-foreground">Transaction Record</h2>
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Optional</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/20">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Amount received</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">₹</span>
                  <input type="number" value={form.receivedAmount || ''} onChange={e => updateField('receivedAmount', parseFloat(e.target.value) || 0)}
                    className="input-field pl-7 py-2" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Visit Charges</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">₹</span>
                  <input type="number" value={form.employeeCommission || ''} onChange={e => updateField('employeeCommission', parseFloat(e.target.value) || 0)}
                    className="input-field pl-7 py-2" placeholder="0.00" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Net Profit</label>
                <div className="h-9 px-3 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm shadow-emerald-500/20">
                  ₹ {((form.receivedAmount || 0) - (form.employeeCommission || 0)).toLocaleString()}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Transaction date</label>
                <DateInput value={form.paymentDate} onChange={v => updateField('paymentDate', v)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Collector</label>
                <input type="text" value={form.collectorName || ''} onChange={e => updateField('collectorName', e.target.value)}
                  className="input-field py-2" placeholder="Who collected?" />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Remarks</label>
                <input type="text" value={form.comment || ''} onChange={e => updateField('comment', e.target.value)}
                  className="input-field py-2" placeholder="e.g. Reference..." />
              </div>
            </div>
          </section>

          {editingId && (
            <section className="space-y-4">
              <h2 className="text-xs font-bold text-muted-foreground flex items-center gap-2"><History className="w-3 h-3" /> Payment History</h2>
              <div className="divide-y divide-border border rounded-xl overflow-hidden bg-card">
                {loadingPayments ? (
                  <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin"/> Fetching records...
                  </div>
                ) : visitPayments.length > 0 ? (
                  visitPayments.map(p => (
                    <div key={p.id} className="p-3 flex items-center justify-between text-sm hover:bg-muted/50">
                      <div>
                        <p className="font-bold">₹ {p.receivedAmount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(p.paymentDate)}</p>
                      </div>
                      <button onClick={() => setEditPayment(p)} className="p-2 hover:text-red-600"><Pencil className="w-4 h-4"/></button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No transaction history found for {visits.find(v=>v.id===editingId)?.visitCode}.
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="flex justify-end gap-3 pt-5 border-t border-border mt-6">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving || !form.personName}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {editingId ? 'Save Record' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!viewVisit} onClose={() => setViewVisit(null)} title="Field Operation Details">
        {viewVisit && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 bg-card border border-border rounded-lg flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-red-600" />
                <span className="text-sm font-semibold text-foreground">{viewVisit.visitCode}</span>
              </div>
              <div className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5",
                viewVisit.status === 'Pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                  viewVisit.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                    "bg-rose-50 text-rose-700 border-rose-100"
              )}>
                {viewVisit.status}
              </div>
              <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Sch: {fmtDate(viewVisit.scheduledTime)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <User className="w-3 h-3" /> Case Subject
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-2">
                    <p className="text-base font-semibold text-foreground">{viewVisit.personName}</p>
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" /> {viewVisit.phoneNumber || 'Contact Unavailable'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <MapPin className="w-3 h-3" /> Location
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{viewVisit.address || 'Address not established'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card p-4 rounded-xl border border-border text-center">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Type</p>
                    <p className="text-sm font-semibold text-foreground">{viewVisit.taskType || 'Standard'}</p>
                  </div>
                  <div className="bg-card p-4 rounded-xl border border-border text-center">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Security Pin</p>
                    <p className="text-sm font-semibold text-red-600 font-mono">{viewVisit.password || '—'}</p>
                  </div>
                </div>

                <div className="bg-card p-5 rounded-xl border border-border space-y-4">
                  <h3 className="text-xs font-medium text-foreground flex items-center justify-between">
                    Event Timeline
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  </h3>
                  <div className="space-y-3 pt-1">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Scheduled Time</p>
                        <p className="text-sm text-foreground">{fmtDate(viewVisit.scheduledTime)} {new Date(viewVisit.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Created At</p>
                        <p className="text-sm text-foreground">{fmtDate(viewVisit.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {!loadingPayments && visitPayments.length > 0 && (
                  <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-medium text-emerald-800">Financial Snapshot</h3>
                      <History className="w-4 h-4 text-emerald-600 opacity-50" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-end justify-between border-b border-emerald-200 pb-3">
                        <div>
                          <p className="text-xs text-emerald-600">Total Received</p>
                          <p className="text-xl font-semibold text-emerald-900">₹ {visitPayments.reduce((acc, p) => acc + p.receivedAmount, 0).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-emerald-600">Net Profit</p>
                          <p className="text-base font-semibold text-emerald-700">₹ {visitPayments.reduce((acc, p) => acc + p.profit, 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {visitPayments.map(p => (
                          <div key={p.id} className="bg-white p-3 rounded-lg text-sm border border-emerald-100">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-emerald-900">₹ {p.receivedAmount.toLocaleString()}</span>
                              <span className="text-xs text-emerald-600">{fmtDate(p.paymentDate)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-emerald-700">
                              <span>Profit: ₹ {p.profit.toLocaleString()}</span>
                              <span className="italic line-clamp-1 max-w-[120px] opacity-80" title={p.comment}>"{p.comment || 'General Rec.'}"</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl border border-border border-dashed">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">Subject Remarks</h3>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                {viewVisit.remarks || 'No specific remarks recorded.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-muted-foreground">System Footprint</span>
                <span className="text-xs text-muted-foreground">Registered by {viewVisit.createdByName || 'User'}</span>
              </div>
              <button
                onClick={() => setViewVisit(null)}
                className="px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-foreground/30"
              >
                Close View
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Edit Sub-modal */}
      <Modal open={!!editPayment} onClose={() => setEditPayment(null)} title="Update Transaction">
        {editPayment && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-medium text-muted-foreground mb-1">Amount received</label>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">₹</span>
                   <input type="number" value={editPayment.receivedAmount} onChange={e => setEditPayment({...editPayment, receivedAmount: parseFloat(e.target.value) || 0})} className="input-field pl-7 py-2" />
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Date</label>
                 <DateInput value={editPayment.paymentDate} onChange={v => setEditPayment({...editPayment, paymentDate: v})} />
               </div>
               <div>
                 <label className="block text-xs font-medium text-muted-foreground mb-1">Govt charges</label>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">₹</span>
                   <input type="number" value={editPayment.governmentCharges} onChange={e => setEditPayment({...editPayment, governmentCharges: parseFloat(e.target.value) || 0})} className="input-field pl-7 py-2" />
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-medium text-muted-foreground mb-1">Visit Charges</label>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">₹</span>
                   <input type="number" value={editPayment.employeeCommission} onChange={e => setEditPayment({...editPayment, employeeCommission: parseFloat(e.target.value) || 0})} className="input-field pl-7 py-2" />
                 </div>
               </div>
             </div>
             
             <div className="pt-2">
                 <label className="block text-xs font-medium text-muted-foreground mb-1">Collector Name</label>
                 <input type="text" value={editPayment.collectorName || ''} onChange={e => setEditPayment({...editPayment, collectorName: e.target.value})} className="input-field py-2" placeholder="Agent or collector name" />
             </div>
             
             <div className="flex justify-end gap-3 pt-4 border-t border-border">
               <button onClick={() => setEditPayment(null)} className="px-4 py-2 text-sm font-medium text-muted-foreground">Discard</button>
               <button onClick={updatePaymentRecord} disabled={saving} className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
                 {saving && <Loader2 className="w-4 h-4 animate-spin"/>} Save Updates
               </button>
             </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
