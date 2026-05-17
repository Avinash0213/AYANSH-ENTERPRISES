import { useState, useEffect } from 'react';
import { 
  Search, Plus, Loader2, Edit2, 
  Phone, Mail, CheckCircle2, XCircle,
  Contact
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { agentService } from '../api/agentService';
import type { Agent, CreateAgentRequest } from '../types';
import { cn } from '../lib/utils';
import Modal from '../components/Modal';

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState<CreateAgentRequest>({ name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const data = await agentService.getAll();
      setAgents(data);
    } catch (err) {
      console.error('Error fetching agents', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent);
      setForm({ name: agent.name, phone: agent.phone || '', email: agent.email || '' });
    } else {
      setEditingAgent(null);
      setForm({ name: '', phone: '', email: '' });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingAgent) {
        await agentService.update(editingAgent.id, { ...form, isActive: editingAgent.isActive });
      } else {
        await agentService.create(form);
      }
      fetchAgents();
      setModalOpen(false);
    } catch (err) {
      console.error('Error saving agent', err);
      alert('Failed to save agent details.');
    } finally {
      setSaving(false);
    }
  };



  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.phone && a.phone.includes(search)) ||
    (a.email && a.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Agent Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage external agents and referral sources</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center justify-center gap-2 w-full md:w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Agent</span>
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="toolbar">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-red-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="toolbar-search"
            />
          </div>
          <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
            {filteredAgents.length} Agents total
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-[40%]">Agent Details</th>
                <th>Contact Information</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
                    <p className="text-sm text-muted-foreground mt-4 italic font-medium">Loading agent records...</p>
                  </td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 opacity-20" />
                      <p>No agents found matching your search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredAgents.map(agent => (
                    <motion.tr 
                      key={agent.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs shadow-sm group-hover:scale-110 transition-transform">
                            {agent.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{agent.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5">ID: AGT-{agent.id.toString().padStart(4, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-1.5">
                          {agent.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                                <Phone className="w-3 h-3 text-red-500" />
                              </div>
                              <span className="font-medium">{agent.phone}</span>
                            </div>
                          )}
                          {agent.email && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <div className="w-5 h-5 rounded bg-muted flex items-center justify-center">
                                <Mail className="w-3 h-3 text-red-500" />
                              </div>
                              <span className="font-medium">{agent.email}</span>
                            </div>
                          )}
                          {!agent.phone && !agent.email && <span className="text-xs text-muted-foreground italic">No contact info</span>}
                        </div>
                      </td>
                      <td>
                        <span className={cn(
                          "badge",
                          agent.isActive ? "badge-completed" : "badge-neutral"
                        )}>
                          {agent.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Inactive</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenModal(agent)}
                            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Edit Agent"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-border">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto" />
              <p className="text-sm text-muted-foreground mt-4 italic font-medium">Loading agent records...</p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <Search className="w-8 h-8 opacity-20" />
                <p>No agents found matching your search.</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredAgents.map(agent => (
                <motion.div 
                  key={agent.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm shadow-sm">
                        {agent.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{agent.name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">ID: AGT-{agent.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "badge",
                      agent.isActive ? "badge-completed" : "badge-neutral"
                    )}>
                      {agent.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 bg-muted/30 p-3 rounded-xl border border-border">
                    {agent.phone && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="font-medium">{agent.phone}</span>
                      </div>
                    )}
                    {agent.email && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="truncate font-medium">{agent.email}</span>
                      </div>
                    )}
                    {!agent.phone && !agent.email && <span className="text-xs text-muted-foreground italic">No contact info provided</span>}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleOpenModal(agent)}
                      className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground bg-muted/50 rounded-xl transition-all active:scale-95"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Details
                    </button>

                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAgent ? 'Edit Agent Details' : 'Register New Agent'}
      >
        <div className="space-y-5 pt-2">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Full Name *</label>
            <div className="relative">
              <Contact className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="input-field pl-10"
                placeholder="Enter agent's full name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="input-field pl-10"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input-field pl-10"
                  placeholder="agent@example.com"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-6 border-t border-border mt-6">
            <button
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name}
              className="btn-primary min-w-[160px] flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{editingAgent ? 'Update Records' : 'Save Agent'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
