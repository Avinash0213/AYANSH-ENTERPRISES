import { useState, useEffect } from 'react';
import { 
  Users, FileText, DollarSign, History, 
  CheckCircle2, Loader2, Pencil 
} from 'lucide-react';
import { api } from '../api/axios';
import { fmtDate } from '../lib/utils';
import Modal from './Modal';
import CustomSelect from './CustomSelect';
import DateInput from './DateInput';

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  customerId: number | null;
  onSuccess: () => void;
  initialType?: number; // Optional type override
}

const emptyForm = {
  ownerName: '', ownerPhone: '', ownerEmail: '',
  tenantName: '', tenantPhone: '', tenantEmail: '',
  tokenNumber: '', inquiryFrom: '', comment: '', type: 0, status: 0,
  startDate: new Date().toISOString().split('T')[0],
  period: 12,
  receivedAmount: 0,
  governmentCharges: 0,
  employeeCommission: 0,
  paymentDate: new Date().toISOString().split('T')[0],
  paymentComment: '',
  collectorName: '',
  address: '',
  rent: 0,
  deposit: 0,
  quotedAmount: 0,
  remainingAmount: 0
};

export default function CustomerFormModal({ open, onClose, customerId, onSuccess, initialType }: CustomerFormModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerPayments, setCustomerPayments] = useState<any[]>([]);
  const [editPayment, setEditPayment] = useState<any>(null);

  useEffect(() => {
    if (open) {
      if (customerId) {
        fetchCustomer(customerId);
        fetchPayments(customerId);
      } else {
        setForm({ ...emptyForm, type: initialType ?? 0 });
        setCustomerPayments([]);
      }
    }
  }, [open, customerId, initialType]);

  const fetchCustomer = async (id: number) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/customers/${id}`);
      setForm({
        ...emptyForm,
        ownerName: data.ownerName, ownerPhone: data.ownerPhone || '', ownerEmail: data.ownerEmail || '',
        tenantName: data.tenantName, tenantPhone: data.tenantPhone || '', tenantEmail: data.tenantEmail || '',
        tokenNumber: data.tokenNumber || '', inquiryFrom: data.inquiryFrom || '', comment: data.comment || '',
        address: data.address || '',
        type: initialType ?? data.type,
        status: data.status,
        startDate: data.startDate || '',
        period: data.period || 11,
        rent: data.rent || 0,
        deposit: data.deposit || 0,
        quotedAmount: data.quotedAmount || 0,
        remainingAmount: data.remainingAmount || 0
      });
    } catch (err) { console.error('Error fetching customer', err); }
    finally { setLoading(false); }
  };

  const fetchPayments = async (id: number) => {
    try {
      const { data } = await api.get(`/payments/customer/${id}`);
      setCustomerPayments(data);
    } catch { console.error('Error fetching payments'); }
  };

  const updateField = (field: string, value: any) => {
    setForm(f => {
      const newForm = { ...f, [field]: value };
      if (field === 'type' && value === 0) {
        newForm.startDate = new Date().toISOString().split('T')[0];
      }
      return newForm;
    });
  };

  const getCalculatedEndDate = () => {
    if (!form.startDate || !form.period) return '—';
    try {
      const d = new Date(form.startDate);
      d.setMonth(d.getMonth() + form.period);
      return fmtDate(d);
    } catch { return '—'; }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        ownerPhone: form.ownerPhone || null,
        ownerEmail: form.ownerEmail || null,
        tenantPhone: form.tenantPhone || null,
        tenantEmail: form.tenantEmail || null,
        tokenNumber: form.tokenNumber || null,
        inquiryFrom: form.inquiryFrom || null,
        comment: form.comment || null,
        address: form.address || null,
        rent: form.rent,
        deposit: form.deposit,
        quotedAmount: form.quotedAmount
      };

      let currentId = customerId;
      if (customerId) {
        await api.put(`/customers/${customerId}`, payload);
      } else {
        const { data } = await api.post('/customers', payload);
        currentId = data.id;
      }

      if (form.receivedAmount && form.receivedAmount !== 0 && currentId) {
        await api.post('/payments', {
          customerId: currentId,
          receivedAmount: form.receivedAmount,
          governmentCharges: form.governmentCharges || 0,
          employeeCommission: form.employeeCommission || 0,
          paymentDate: form.paymentDate || new Date().toISOString().split('T')[0],
          comment: form.paymentComment || null,
          collectorName: form.collectorName || null
        });
      }

      onSuccess();
      onClose();
    } catch (err) { console.error('Save error', err); }
    finally { setSaving(false); }
  };

  const updatePaymentRecord = async () => {
    if (!editPayment) return;
    setSaving(true);
    try {
      await api.put(`/payments/${editPayment.id}`, editPayment);
      setEditPayment(null);
      if (customerId) fetchPayments(customerId);
    } catch { console.error('Payment update error'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} 
      title={customerId ? 'Edit Customer Agreement' : 'Initialize New Agreement'}>
      {loading ? (
        <div className="p-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-red-500" />
          <p className="text-sm font-medium text-muted-foreground italic">Fetching agreement details...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Parties */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Users className="w-4 h-4 text-red-600" />
              <h2 className="text-sm font-semibold text-foreground">Primary parties</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-background p-4 rounded-xl border border-border">
              <div className="space-y-3">
                <span className="inline-flex px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">Owner</span>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Full name *</label>
                  <input value={form.ownerName} onChange={e => updateField('ownerName', e.target.value)} className="input-field" placeholder="Owner Name" />
                </div>
                <input value={form.ownerPhone} onChange={e => updateField('ownerPhone', e.target.value)} className="input-field" placeholder="Phone" />
                <input value={form.ownerEmail} onChange={e => updateField('ownerEmail', e.target.value)} className="input-field" placeholder="Email" />
              </div>
              <div className="space-y-3">
                <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">Tenant</span>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Full name *</label>
                  <input value={form.tenantName} onChange={e => updateField('tenantName', e.target.value)} className="input-field" placeholder="Tenant Name" />
                </div>
                <input value={form.tenantPhone} onChange={e => updateField('tenantPhone', e.target.value)} className="input-field" placeholder="Phone" />
                <input value={form.tenantEmail} onChange={e => updateField('tenantEmail', e.target.value)} className="input-field" placeholder="Email" />
              </div>
            </div>
          </section>

          {/* Section 2: Details */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <FileText className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-foreground">Agreement details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Address</label>
                <textarea value={form.address} onChange={e => updateField('address', e.target.value)} className="input-field resize-none" rows={2} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Type *</label>
                <CustomSelect value={form.type} onChange={v => updateField('type', parseInt(String(v)))} 
                  options={[{value: 0, label: 'New'}, {value: 1, label: 'Renewal'}, {value: 2, label: 'Cancel'}]} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Status *</label>
                <CustomSelect value={form.status} onChange={v => updateField('status', parseInt(String(v)))} 
                  options={[{value: 0, label: 'Prep'}, {value: 1, label: 'KYC Pending'}, {value: 2, label: 'Sent'}, {value: 3, label: 'Done'}]} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Duration (M)</label>
                <input type="number" value={form.period} onChange={e => updateField('period', parseInt(e.target.value) || 1)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Start Date *</label>
                <DateInput value={form.startDate} onChange={v => updateField('startDate', v)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1 text-red-600">Calculated Expiry</label>
                <div className="input-field bg-muted/50 font-bold text-red-700">{getCalculatedEndDate()}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Token #</label>
                <input value={form.tokenNumber} onChange={e => updateField('tokenNumber', e.target.value)} className="input-field font-mono" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Inquiry From</label>
                <CustomSelect value={form.inquiryFrom} onChange={v => updateField('inquiryFrom', String(v))} 
                  options={[{value: '', label: 'Select Source'}, {value: 'Self', label: 'Self'}, {value: 'Agent', label: 'Agent'}]} />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Administrative Notes / Comments</label>
                <textarea value={form.comment} onChange={e => updateField('comment', e.target.value)} className="input-field resize-none" rows={2} placeholder="Add any specific notes about this customer..." />
              </div>
            </div>
          </section>

          {/* Section: Financial Terms */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-foreground">Financial Terms</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Monthly Rent</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">₹</span>
                  <input type="number" value={form.rent || ''} onChange={e => updateField('rent', parseFloat(e.target.value) || 0)} className="input-field pl-7" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Security Deposit</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">₹</span>
                  <input type="number" value={form.deposit || ''} onChange={e => updateField('deposit', parseFloat(e.target.value) || 0)} className="input-field pl-7" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Quoted Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">₹</span>
                  <input type="number" value={form.quotedAmount || ''} onChange={e => updateField('quotedAmount', parseFloat(e.target.value) || 0)} className="input-field pl-7" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1 text-red-600">Remaining Balance</label>
                <div className="input-field bg-red-50 dark:bg-red-900/20 font-bold text-red-700 dark:text-red-400">
                  ₹ {form.remainingAmount?.toLocaleString() || '0'}
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Transaction Record */}
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
                <label className="block text-xs font-medium text-muted-foreground mb-1">Govt charges</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">₹</span>
                  <input type="number" value={form.governmentCharges || ''} onChange={e => updateField('governmentCharges', parseFloat(e.target.value) || 0)}
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
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Net Profit</label>
                <div className="h-9 px-3 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm shadow-emerald-500/20">
                  ₹ {((form.receivedAmount || 0) - (form.governmentCharges || 0) - (form.employeeCommission || 0)).toLocaleString()}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Transaction date</label>
                <DateInput value={form.paymentDate} onChange={v => updateField('paymentDate', v)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Remarks</label>
                <input type="text" value={form.paymentComment || ''} onChange={e => updateField('paymentComment', e.target.value)}
                  className="input-field py-2" placeholder="e.g. Paid via GPay" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Executive</label>
                <input type="text" value={form.collectorName || ''} onChange={e => updateField('collectorName', e.target.value)}
                  className="input-field py-2" placeholder="Who executed?" />
              </div>
            </div>
          </section>

          {/* History */}
          {customerId && customerPayments.length > 0 && (
            <section className="space-y-4">
               <h2 className="text-xs font-bold text-muted-foreground flex items-center gap-2"><History className="w-3 h-3"/> Payment History</h2>
               <div className="divide-y divide-border border rounded-xl overflow-hidden">
                 {customerPayments.map(p => (
                   <div key={p.id} className="p-3 flex items-center justify-between text-sm hover:bg-muted/50">
                     <div>
                       <p className="font-bold">₹ {p.receivedAmount.toLocaleString()}</p>
                       <p className="text-xs text-muted-foreground">{fmtDate(p.paymentDate)}</p>
                     </div>
                     <button onClick={() => setEditPayment(p)} className="p-2 hover:text-red-600"><Pencil className="w-4 h-4"/></button>
                   </div>
                 ))}
               </div>
            </section>
          )}

          <div className="flex justify-end gap-3 pt-5 border-t border-border mt-6">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving || !form.ownerName || !form.tenantName}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {customerId ? 'Save Record' : 'Confirm'}
            </button>
          </div>
        </div>
      )}

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
                 <label className="block text-xs font-medium text-muted-foreground mb-1">Executive</label>
                 <input type="text" value={editPayment.collectorName || ''} onChange={e => setEditPayment({...editPayment, collectorName: e.target.value})} className="input-field py-2" placeholder="Who executed?" />
             </div>
             
             <div className="flex justify-end gap-3 pt-4 border-t border-border">
               <button onClick={() => setEditPayment(null)} className="px-4 py-2 text-sm font-medium text-muted-foreground">Discard</button>
               <button onClick={updatePaymentRecord} className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-500/20 active:scale-95 transition-all">Save Updates</button>
             </div>
          </div>
        )}
      </Modal>
    </Modal>
  );
}
