import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Building2, UserPlus, Calendar,
  Edit3, Loader2, ChevronLeft, ChevronRight, History,
  CheckCircle2, Hash, ShieldCheck, User, MapPin,
  Clock, Phone, Mail, Pencil, DollarSign
} from 'lucide-react';
import { api } from '../api/axios';
import { cn, fmtDate } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import CustomSelect from '../components/CustomSelect';
import DateInput from '../components/DateInput';
import CustomerFormModal from '../components/CustomerFormModal';
import type { Customer } from '../types';

const PAGE_SIZE = 8;

export default function Customers() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || '';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [customerPayments, setCustomerPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [editPayment, setEditPayment] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const { can } = useAuth();

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const fetchCustomers = async (search?: string, type?: number | null, status?: number | null, date?: string, pageNum: number = 1) => {
    try {
      let url = `/customers?page=${pageNum}&pageSize=${PAGE_SIZE}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (type !== null && type !== undefined) url += `type=${type}&`;
      if (status !== null && status !== undefined) url += `status=${status}&`;
      if (date) url += `dateFilter=${date}&`;

      const { data } = await api.get(url);
      setCustomers(data.items);
      setTotalCount(data.totalCount);
    } catch { console.error('Error fetching customers'); }
    finally { setLoading(false); }
  };

  const updatePaymentRecord = async () => {
    if (!editPayment) return;
    const pId = editPayment.id || editPayment.Id;

    if (!pId) {
      alert("System Error: Payment ID is missing from the record.");
      return;
    }

    try {
      setSaving(true);
      await api.put(`/payments/${pId}`, {
        receivedAmount: Number(editPayment.receivedAmount || 0),
        governmentCharges: Number(editPayment.governmentCharges || 0),
        employeeCommission: Number(editPayment.employeeCommission || 0),
        paymentDate: editPayment.paymentDate,
        comment: editPayment.comment,
        collectorName: editPayment.collectorName
      });

      const customerId = viewCustomer?.id || editingId;
      if (customerId) {
        setLoadingPayments(true);
        const { data } = await api.get(`/payments/customer/${customerId}`);
        setCustomerPayments(data);
      }
      setEditPayment(null);
    } catch (err: any) {
      console.error('Update payment error', err);
      const msg = err.response?.data?.message || err.response?.data || err.message;
      alert(`Update Failed: ${msg}`);
    }
    finally {
      setSaving(false);
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q !== null && q !== searchTerm) {
      setSearchTerm(q);
      setPage(1);
    }

    const renewId = params.get('renewId');
    if (renewId) {
      setEditingId(parseInt(renewId));
      setModalOpen(true);
      navigate(location.pathname, { replace: true });
    }

    const isNew = params.get('new');
    if (isNew) {
      openCreate();
      navigate(location.pathname, { replace: true });
    }
  }, [location.search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setLoading(true);
    fetchCustomers(debouncedSearchTerm, typeFilter, statusFilter, dateFilter, page);
  }, [debouncedSearchTerm, typeFilter, statusFilter, dateFilter, page]);

  useEffect(() => {
    const customerId = viewCustomer?.id || editingId;
    if (customerId) {
      const fetchPayments = async () => {
        setLoadingPayments(true);
        try {
          const { data } = await api.get(`/payments/customer/${customerId}`);
          setCustomerPayments(data);
        } catch { console.error('Error fetching payments'); }
        finally { setLoadingPayments(false); }
      };
      fetchPayments();
    } else {
      setCustomerPayments([]);
    }
  }, [viewCustomer, editingId]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const paginatedCustomers = customers; // Already server-side paginated

  const openCreate = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingId(c.id);
    setModalOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight leading-snug">One Platform</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage customer and tenant records</p>
        </div>
        {can('USER_CREATE') && (
          <button
            onClick={openCreate}
            aria-label="Add new customer"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition focus-visible:ring-2 focus-visible:ring-red-500/30 active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Customer
          </button>
        )}
      </div>

      {/* Table card */}
      <section aria-label="Customer records" className="rounded-xl border border-border bg-card shadow-none">
        <div className="px-5 py-4 border-b border-border flex flex-col md:flex-row gap-3 md:items-center justify-between bg-muted/30 rounded-t-xl">
          <div className="flex flex-col md:flex-row flex-1 gap-3 max-w-3xl w-full">
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-red-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by customer name or serial..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                aria-label="Search customers"
                className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition"
              />
            </div>
            <div className="flex flex-wrap md:flex-nowrap gap-2 w-full md:w-auto">
              <CustomSelect
                value={typeFilter === null ? '' : String(typeFilter)}
                onChange={(v) => { setTypeFilter(v === '' ? null : parseInt(String(v))); setPage(1); }}
                options={[
                  { value: '', label: 'All Types' },
                  { value: '0', label: 'New' },
                  { value: '1', label: 'Renewal' },
                  { value: '2', label: 'Cancel' },
                ]}
                className="!w-auto min-w-[140px]"
              />
              <CustomSelect
                value={statusFilter === null ? '' : String(statusFilter)}
                onChange={(v) => { setStatusFilter(v === '' ? null : parseInt(String(v))); setPage(1); }}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: '0', label: 'Preparation' },
                  { value: '1', label: 'KYC Pending' },
                  { value: '2', label: 'Submitted' },
                  { value: '3', label: 'Completed' },
                ]}
                className="!w-auto min-w-[170px]"
              />
              <CustomSelect
                value={dateFilter}
                onChange={(v) => { setDateFilter(String(v)); setPage(1); }}
                options={[
                  { value: '', label: 'All Time' },
                  { value: 'day', label: 'Today' },
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                ]}
                className="!w-auto min-w-[140px]"
              />
            </div>
          </div>
          <span className="text-xs font-medium text-muted-foreground" role="status" aria-live="polite">
            {customers.length} records
          </span>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left" role="table">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Serial &amp; Type</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Contact</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Address</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Start &amp; End</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Created Date</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Inquiry &amp; Notes</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <AnimatePresence mode="popLayout">
                {paginatedCustomers.map(c => (
                  <motion.tr key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="group hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-2">
                        <span
                          onClick={() => setViewCustomer(c)}
                          role="button"
                          tabIndex={0}
                          aria-label={`View details for ${c.serialNumber}`}
                          className="text-sm font-semibold text-foreground cursor-pointer hover:text-red-600 hover:underline transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20 rounded"
                        >
                          {c.serialNumber}
                        </span>
                        <div className="flex flex-col gap-1 items-start">
                          <span className={cn(
                            "inline-flex w-fit px-2 py-0.5 rounded-full text-xs font-medium",
                            c.type === 0 ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" :
                              c.type === 1 ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" :
                                "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"
                          )}>
                            {c.typeName}
                          </span>
                          <span className={cn(
                            "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                            c.status === 0 ? "bg-blue-50 text-blue-700" :
                              c.status === 1 ? "bg-amber-50 text-amber-700" :
                                c.status === 2 ? "bg-purple-50 text-purple-700" :
                                  "bg-emerald-50 text-emerald-700"
                          )}>
                            {c.status === 0 ? 'Preparation' : c.status === 1 ? 'KYC' : c.status === 2 ? 'Submitted' : 'Completed'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium text-foreground">{c.ownerName}</span>
                          <span className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-xs">Owner</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">{c.tenantName}</span>
                          <span className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-xs">Tenant</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-muted-foreground line-clamp-2 max-w-[200px] leading-relaxed" title={c.address}>
                        {c.address || <span className="text-muted-foreground/50">—</span>}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="w-3.5 h-3.5 rounded bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground shrink-0">S</span>
                          {c.startDate ? fmtDate(c.startDate) : '—'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                          <span className="w-3.5 h-3.5 rounded bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-[8px] font-bold shrink-0">E</span>
                          {c.endDate ? fmtDate(c.endDate) : '—'}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground font-medium">
                          {fmtDate(c.createdDate)}
                        </span>
                        {c.tokenNumber && (
                          <span className="text-[10px] font-mono bg-muted dark:bg-muted/10 px-1.5 py-0.5 rounded text-muted-foreground w-fit border border-border/50">
                            #{c.tokenNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        {c.inquiryFrom && (
                          <span className={cn(
                            "inline-flex w-fit px-2 py-0.5 rounded-full text-xs font-medium",
                            c.inquiryFrom === 'Agent'
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                              : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                          )}>
                            {c.inquiryFrom}
                          </span>
                        )}
                        {c.comment && (
                          <p className="text-xs text-muted-foreground line-clamp-2 max-w-[180px] leading-relaxed" title={c.comment}>
                            {c.comment}
                          </p>
                        )}
                        {!c.inquiryFrom && !c.comment && (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        {can('USER_UPDATE') && (
                          <button
                            onClick={() => openEdit(c)}
                            aria-label={`Edit customer ${c.serialNumber}`}
                            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
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
              {customers.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-sm text-muted-foreground">
                    No matching records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-border">
          <AnimatePresence mode="popLayout">
            {paginatedCustomers.map(c => (
              <motion.div key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p
                        onClick={() => setViewCustomer(c)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for ${c.serialNumber}`}
                        className="text-sm font-semibold text-foreground cursor-pointer active:text-red-600 focus-visible:ring-2 focus-visible:ring-red-500/20 rounded"
                      >
                        {c.serialNumber}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                          c.type === 0 ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" :
                            c.type === 1 ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" :
                              "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"
                        )}>
                          {c.typeName}
                        </span>
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                          c.status === 0 ? "bg-blue-50 text-blue-700" :
                            c.status === 1 ? "bg-amber-50 text-amber-700" :
                              c.status === 2 ? "bg-purple-50 text-purple-700" :
                                "bg-emerald-50 text-emerald-700"
                        )}>
                          {c.status === 0 ? 'Preparation' : c.status === 1 ? 'KYC' : c.status === 2 ? 'Submitted' : 'Completed'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {can('USER_UPDATE') && (
                      <button
                        onClick={() => openEdit(c)}
                        aria-label={`Edit customer ${c.serialNumber}`}
                        className="p-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors active:scale-90 focus-visible:ring-2 focus-visible:ring-red-500/20"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-xl border border-border">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Owner</p>
                    <p className="text-sm font-medium text-foreground line-clamp-1">{c.ownerName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Tenant</p>
                    <p className="text-sm font-medium text-foreground line-clamp-1">{c.tenantName}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Address</p>
                    <p className="text-xs text-foreground leading-relaxed line-clamp-2">{c.address || '—'}</p>
                  </div>
                  {c.inquiryFrom && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">Inquiry From</p>
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                        c.inquiryFrom === 'Agent' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                      )}>{c.inquiryFrom}</span>
                    </div>
                  )}
                  {c.comment && (
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">Comment</p>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{c.comment}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Start: {c.startDate ? fmtDate(c.startDate) : '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                      <Calendar className="w-3 h-3" />
                      <span>Expiry: {c.endDate ? fmtDate(c.endDate) : '—'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Created: {fmtDate(c.createdDate)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground" role="status" aria-live="polite">
              <Loader2 className="w-7 h-7 animate-spin text-red-500" />
              <span className="text-sm font-medium">Loading data...</span>
            </div>
          )}
          {customers.length === 0 && !loading && (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No matching records found
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="p-2 rounded-lg hover:bg-muted border border-transparent hover:border-border disabled:opacity-30 transition-colors text-foreground focus-visible:ring-2 focus-visible:ring-red-500/20"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                className="p-2 rounded-lg hover:bg-muted border border-transparent hover:border-border disabled:opacity-30 transition-colors text-foreground focus-visible:ring-2 focus-visible:ring-red-500/20"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      <CustomerFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        customerId={editingId}
        onSuccess={() => {
          fetchCustomers();
          setEditingId(null);
        }}
      />

      {/* Customer Detail View */}
      <Modal open={!!viewCustomer} onClose={() => setViewCustomer(null)} title="Agreement Insight">
        {viewCustomer && (
          <div className="space-y-6">
            {/* Status Banner for KYC Pending */}
            {viewCustomer.status === 1 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                  Attention: KYC Pending
                </p>
              </motion.div>
            )}

            {/* Header Badge Row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 bg-card border border-border rounded-lg flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-red-600" />
                <span className="text-sm font-semibold text-foreground">{viewCustomer.serialNumber}</span>
              </div>
              <div className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5",
                viewCustomer.type === 0 ? "bg-red-50 text-red-700 border-red-100" :
                  viewCustomer.type === 1 ? "bg-amber-50 text-amber-700 border-amber-100" :
                    "bg-muted text-muted-foreground border-border"
              )}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {viewCustomer.typeName}
              </div>
              <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Expires: {fmtDate(viewCustomer.endDate)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1: Parties */}
              <div className="space-y-5">
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <User className="w-3 h-3" /> Property Owner
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-2">
                    <p className="text-base font-semibold text-foreground">{viewCustomer.ownerName}</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" /> {viewCustomer.ownerPhone || 'No phone recorded'}
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" /> {viewCustomer.ownerEmail || 'No email recorded'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <UserPlus className="w-3 h-3" /> Current Tenant
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-2">
                    <p className="text-base font-semibold text-foreground">{viewCustomer.tenantName}</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" /> {viewCustomer.tenantPhone || 'No phone recorded'}
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" /> {viewCustomer.tenantEmail || 'No email recorded'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <MapPin className="w-3 h-3" /> Location
                  </h3>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{viewCustomer.address || 'Address not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Column 2: Agreement & History */}
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card p-4 rounded-xl border border-border text-center">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Duration</p>
                    <p className="text-xl font-semibold text-red-600">{viewCustomer.period} <span className="text-xs font-normal text-muted-foreground">months</span></p>
                  </div>
                  <div className="bg-card p-4 rounded-xl border border-border text-center">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Token #</p>
                    <p className="text-sm font-semibold text-foreground font-mono">{viewCustomer.tokenNumber || '—'}</p>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/20 space-y-4">
                  <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                    Agreement Terms
                    <DollarSign className="w-3.5 h-3.5" />
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                    <div>
                      <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500 uppercase">Rent / Month</p>
                      <p className="text-lg font-bold text-foreground">₹ {viewCustomer.rent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500 uppercase">Security Deposit</p>
                      <p className="text-lg font-bold text-foreground">₹ {viewCustomer.deposit.toLocaleString()}</p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500 uppercase">Quoted Premium</p>
                        <p className="text-xl font-black text-foreground">₹ {viewCustomer.quotedAmount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-medium text-red-600 dark:text-red-400 uppercase">Remaining</p>
                        <p className="text-xl font-black text-red-600 dark:text-red-400">₹ {viewCustomer.remainingAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card p-5 rounded-xl border border-border space-y-4">
                  <h3 className="text-xs font-medium text-foreground flex items-center justify-between">
                    Agreement Timeline
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  </h3>
                  <div className="space-y-3 pt-1">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Commencement</p>
                        <p className="text-sm text-foreground">{viewCustomer.startDate ? fmtDate(viewCustomer.startDate) : '—'}</p>
                      </div>
                    </div>
                    {viewCustomer.renewalDate && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Latest Renewal</p>
                          <p className="text-sm text-foreground">{fmtDate(viewCustomer.renewalDate)}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Scheduled Expiry</p>
                        <p className="text-sm text-foreground">{viewCustomer.endDate ? fmtDate(viewCustomer.endDate) : '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-600 p-5 rounded-xl text-white shadow-sm shadow-indigo-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-medium text-indigo-100">Financial Snapshot</h3>
                    <History className="w-4 h-4 opacity-50" />
                  </div>
                  <div className="space-y-3" role="status" aria-live="polite">
                    {loadingPayments ? (
                      <div className="flex items-center gap-2 text-indigo-200">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-xs font-medium">Syncing Ledger...</span>
                      </div>
                    ) : customerPayments.length > 0 ? (
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-end justify-between border-b border-indigo-500/50 pb-3">
                          <div>
                            <p className="text-xs text-indigo-200">Received Total</p>
                            <p className="text-xl font-semibold">₹ {customerPayments.reduce((acc, p) => acc + p.receivedAmount, 0).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-indigo-200">Net Assets</p>
                            <p className="text-base font-semibold text-emerald-300">₹ {customerPayments.reduce((acc, p) => acc + p.profit, 0).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="max-h-[180px] overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
                          {customerPayments.map(p => (
                            <div key={p.id} className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/10 hover:bg-white/15 transition-colors">
                              <div className="flex justify-between items-start gap-3 mb-2">
                                <span className="text-base font-bold text-white tracking-tight">₹ {p.receivedAmount.toLocaleString()}</span>
                                <span className="text-[10px] font-semibold text-indigo-200 bg-indigo-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {fmtDate(p.paymentDate)}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1.5 text-xs text-indigo-100">
                                <div className="flex items-center justify-between">
                                  <span className="opacity-70">Internal Profit:</span>
                                  <span className="font-semibold text-emerald-300">₹ {p.profit.toLocaleString()}</span>
                                </div>
                                {(p.collectorName || p.comment) && (
                                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-white/5 mt-0.5">
                                    {p.collectorName && (
                                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/20 text-[9px] font-bold rounded text-indigo-100 border border-indigo-400/20 max-w-full" title="Executive">
                                        <span className="opacity-60 uppercase">E:</span>
                                        <span className="truncate max-w-[120px]">{p.collectorName}</span>
                                      </div>
                                    )}
                                    {p.comment && (
                                      <span className="italic opacity-60 truncate max-w-[150px] text-[11px]" title={p.comment}>
                                        "{p.comment}"
                                      </span>
                                    )}
                                    <div className="flex-1" />
                                    <button
                                      onClick={() => setEditPayment({ ...p })}
                                      className="p-1.5 bg-white/5 hover:bg-white/20 rounded-lg text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/20 ml-auto"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-indigo-200 italic opacity-80">Pending financial initialization</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl border border-border border-dashed">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">Case Notes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                {viewCustomer.comment || 'No specific administrative remarks recorded for this agreement.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-muted-foreground">System Footprint</span>
                <span className="text-xs text-muted-foreground">Registered by {viewCustomer.createdByName || 'System Auto'} on {fmtDate(viewCustomer.createdDate)}</span>
              </div>
              <button
                onClick={() => setViewCustomer(null)}
                className="px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-colors active:scale-95 focus-visible:ring-2 focus-visible:ring-foreground/30"
              >
                Close View
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Payment Sub-Modal */}
      <Modal open={!!editPayment} onClose={() => setEditPayment(null)} title="Modify Ledger Entry">
        {editPayment && (
          <div className="space-y-5">
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-4 rounded-xl flex items-start gap-3">
              <History className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-700">Updating Existing Receipt</p>
                <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                  Modifying this entry will instantly recalculate the associated profit and update the overall customer ledger.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Received Amount (₹) *</label>
                <input type="number" value={editPayment.receivedAmount} onChange={e => setEditPayment({ ...editPayment, receivedAmount: e.target.value })}
                  className="input-field" placeholder="e.g. 15000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Date *</label>
                <DateInput value={editPayment.paymentDate} onChange={v => setEditPayment({ ...editPayment, paymentDate: v })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Govt Charges (₹)</label>
                <input type="number" value={editPayment.governmentCharges} onChange={e => setEditPayment({ ...editPayment, governmentCharges: e.target.value })}
                  className="input-field" placeholder="e.g. 500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Visit Charges (₹)</label>
                <input type="number" value={editPayment.employeeCommission} onChange={e => setEditPayment({ ...editPayment, employeeCommission: e.target.value })}
                  className="input-field" placeholder="e.g. 1000" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Reference / Comment</label>
              <textarea value={editPayment.comment || ''} onChange={e => setEditPayment({ ...editPayment, comment: e.target.value })}
                className="input-field min-h-[72px] resize-none" rows={2} placeholder="Add any details about this update..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Executive</label>
              <input type="text" value={editPayment.collectorName || ''} onChange={e => setEditPayment({ ...editPayment, collectorName: e.target.value })}
                className="input-field" placeholder="Who executed?" />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setEditPayment(null)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20"
              >
                Cancel
              </button>
              <button
                onClick={updatePaymentRecord}
                disabled={saving || !editPayment.receivedAmount}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-red-500/30",
                  saving || !editPayment.receivedAmount
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700 active:scale-95"
                )}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm Update
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
