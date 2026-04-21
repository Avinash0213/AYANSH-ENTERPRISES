import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart, Download, Filter, Calendar, Loader2, User, Building2, Wallet } from 'lucide-react';
import { api } from '../api/axios';
import { cn, fmtDate } from '../lib/utils';
import CustomSelect from '../components/CustomSelect';
import DateInput from '../components/DateInput';

export default function Reports() {
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingLedger, setExportingLedger] = useState(false);
  const [filters, setFilters] = useState({ from: '', to: '', type: '', source: 'all' });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.type) params.append('type', filters.type);

      const { data } = await api.get(`/reports/customers?${params.toString()}`);
      setReportData(data);
    } catch (err) { console.error('Report error', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.type) params.append('type', filters.type);

      const response = await api.get(`/reports/export/excel?${params.toString()}`, {
        responseType: 'blob'
      });

      // Explicitly check for successful response
      if (response.status !== 200) throw new Error('Export failed');

      // Create blob with explicit MIME type to prevent corruption
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bms-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup with delay to ensure Chrome has time to initiate download with the correct name
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) { 
      console.error('Export error', err);
      alert('Failed to export Excel. Please try again later.');
    }
    finally { setExporting(false); }
  };

  const handleExportLedger = async () => {
    setExportingLedger(true);
    try {
      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.source && filters.source !== 'all') params.append('source', filters.source);

      const response = await api.get(`/reports/export/ledger?${params.toString()}`, {
        responseType: 'blob'
      });

      if (response.status !== 200) throw new Error('Export failed');

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment-ledger-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) { 
      console.error('Export error', err);
      alert('Failed to export Tax Ledger. Please try again later.');
    }
    finally { setExportingLedger(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight leading-snug">MIS Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate and export detailed data for monthly reviews</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportLedger}
            disabled={exportingLedger}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition focus-visible:ring-2 focus-visible:ring-indigo-500/30 active:scale-95 disabled:opacity-50"
          >
            {exportingLedger ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            Payment Ledger
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition focus-visible:ring-2 focus-visible:ring-emerald-500/30 active:scale-95 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Agreement Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <section aria-labelledby="filters-heading" className="bg-card rounded-xl border border-border shadow-none p-5">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-red-600" />
          <h2 id="filters-heading" className="text-sm font-semibold text-foreground mr-3">Filters</h2>
          
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'This Month', range: () => {
                const now = new Date();
                return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
              }},
              { label: 'Last Month', range: () => {
                const now = new Date();
                return { 
                  from: new Date(now.getFullYear(), now.getMonth() - 1, 1), 
                  to: new Date(now.getFullYear(), now.getMonth(), 0) 
                };
              }},
              { label: 'Financial Year', range: () => {
                const now = new Date();
                const year = now.getMonth() + 1 < 4 ? now.getFullYear() - 1 : now.getFullYear();
                return { from: new Date(year, 3, 1), to: now };
              }},
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => {
                  const { from, to } = btn.range();
                  setFilters(f => ({ 
                    ...f, 
                    from: from.toISOString().split('T')[0], 
                    to: to.toISOString().split('T')[0] 
                  }));
                }}
                className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20"
              >
                {btn.label}
              </button>
            ))}
            <button
              onClick={() => setFilters({ from: '', to: '', type: '', source: 'all' })}
              className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20"
            >
              Reset
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">From date</label>
            <DateInput value={filters.from} onChange={v => setFilters(f => ({ ...f, from: v }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">To date</label>
            <DateInput value={filters.to} onChange={v => setFilters(f => ({ ...f, to: v }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Source</label>
            <CustomSelect
              value={filters.source || 'all'}
              onChange={(v) => setFilters(f => ({ ...f, source: String(v) }))}
              options={[
                { value: 'all', label: 'Combined' },
                { value: 'customer', label: 'Customer' },
                { value: 'visit', label: 'Client Visit' },
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Customer Type</label>
            <CustomSelect
              value={filters.type}
              onChange={(v) => setFilters(f => ({ ...f, type: String(v) }))}
              options={[
                { value: '', label: 'All Types' },
                { value: '0', label: 'New' },
                { value: '1', label: 'Renewal' },
                { value: '2', label: 'Cancel' },
              ]}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReport}
              className="btn-primary w-full flex items-center justify-center gap-2 active:scale-95"
            >
              <Calendar className="w-4 h-4" /> Apply Filters
            </button>
          </div>
        </div>
      </section>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-5 text-white shadow-sm shadow-red-200/50 dark:shadow-none">
          <p className="text-red-200 text-sm font-medium">Total Records</p>
          <p className="text-3xl font-semibold mt-1">{reportData.length}</p>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border shadow-none">
          <p className="text-muted-foreground text-sm font-medium">New Contracts</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {reportData.filter((r: any) => r.type === 'New').length}
          </p>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border shadow-none">
          <p className="text-muted-foreground text-sm font-medium">Renewals</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {reportData.filter((r: any) => r.type === 'Renewal').length}
          </p>
        </div>
      </div>

      {/* Report Table */}
      <section aria-label="Customer report" className="rounded-xl border border-border bg-card shadow-none overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <FileBarChart className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-semibold text-foreground">Customer Report</h2>
          </div>
          <span className="text-xs text-muted-foreground" role="status" aria-live="polite">{reportData.length} results</span>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left" role="table">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Serial</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Owner</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Tenant</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Type</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Start</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">End</th>
                <th scope="col" className="px-5 py-3 text-xs font-medium text-muted-foreground">Created By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reportData.map((r: any) => (
                <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-4 text-sm font-medium text-foreground">{r.serialNumber}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{r.ownerName}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{r.tenantName}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.type === 'New' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                      r.type === 'Renewal' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                      'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                    }`}>{r.type}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{fmtDate(r.startDate)}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{fmtDate(r.endDate)}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{r.createdBy}</td>
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
              {reportData.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-sm text-muted-foreground">No data matches the selected filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-border">
          {reportData.map((r: any) => (
            <div key={r.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{r.serialNumber}</span>
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  r.type === 'New' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" :
                  r.type === 'Renewal' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" :
                  "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                )}>{r.type}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-xl border border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="w-3 h-3" />
                    Owner
                  </div>
                  <p className="text-xs font-medium text-foreground line-clamp-1">{r.ownerName}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    Tenant
                  </div>
                  <p className="text-xs font-medium text-foreground line-clamp-1">{r.tenantName}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Start</span>
                  <span className="font-medium text-foreground">{fmtDate(r.startDate)}</span>
                </div>
                <div className="flex flex-col gap-0.5 text-right">
                  <span className="text-muted-foreground">Expiry</span>
                  <span className="font-medium text-rose-600">{fmtDate(r.endDate)}</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">Created by: {r.createdBy}</span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground" role="status" aria-live="polite">
              <Loader2 className="w-7 h-7 animate-spin text-red-500" />
              <span className="text-sm font-medium">Loading data...</span>
            </div>
          )}
          {reportData.length === 0 && !loading && (
            <div className="p-12 text-center text-sm text-muted-foreground">No results found</div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
