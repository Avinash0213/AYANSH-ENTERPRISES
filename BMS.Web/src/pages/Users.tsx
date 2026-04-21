import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Edit3, Trash2, Loader2, UserPlus, Key } from 'lucide-react';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import CustomSelect from '../components/CustomSelect';
import { cn } from '../lib/utils';
import PasswordField from '../components/PasswordField';
import type { User as UserType, CreateUserRequest, UserPermission } from '../types';

const emptyForm: CreateUserRequest = { name: '', email: '', password: '', roleId: 2 };

export default function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateUserRequest>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [permUserId, setPermUserId] = useState<number | null>(null);
  const [userPerms, setUserPerms] = useState<UserPermission[]>([]);
  const [permLoading, setPermLoading] = useState(false);
  const { can, user } = useAuth();

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) { console.error('Fetch error', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (u: UserType) => {
    setForm({ name: u.name, email: u.email, password: '', roleId: u.roleId });
    setEditingId(u.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, { name: form.name, email: form.email, roleId: form.roleId, password: form.password || undefined });
      } else {
        await api.post('/users', form);
      }
      setModalOpen(false);
      setLoading(true);
      await fetchUsers();
    } catch (err) { console.error('Save error', err); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/users/${deleteId}`);
      setDeleteId(null);
      setLoading(true);
      await fetchUsers();
    } catch (err) { console.error('Delete error', err); }
  };

  const openPermissions = async (userId: number) => {
    setPermUserId(userId);
    setPermLoading(true);
    try {
      const { data } = await api.get(`/permissions/user/${userId}`);
      setUserPerms(data);
    } catch (err) { console.error('Permission fetch error', err); }
    finally { setPermLoading(false); }
  };

  const togglePermission = async (p: UserPermission) => {
    try {
      if (p.isGranted) {
        await api.post('/permissions/revoke', { userId: permUserId, permissionId: p.permissionId });
      } else {
        await api.post('/permissions/grant', { userId: permUserId, permissionId: p.permissionId });
      }
      // Refresh
      const { data } = await api.get(`/permissions/user/${permUserId}`);
      setUserPerms(data);
    } catch (err) { console.error('Toggle error', err); }
  };

  const updateField = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight leading-snug">Team Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your office staff and their system access levels</p>
        </div>
        {can('USER_CREATE') && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition focus-visible:ring-2 focus-visible:ring-red-500/30 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        )}
      </div>

      <div className="relative group max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-red-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </span>
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search users"
          className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition"
        />
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.filter(u => 
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
        ).map((u, i) => (
          <motion.div key={u.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border border-border shadow-none p-5 hover:border-border/80 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold",
                  u.roleId === 1 ? "bg-gradient-to-br from-red-600 to-red-700" : "bg-gradient-to-br from-gray-500 to-gray-600"
                )}>
                  {u.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              </div>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                u.roleId === 1 ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-muted text-muted-foreground border border-border"
              )}>
                {u.roleName}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-border">
              {can('ACCESS_MANAGE') && (
                <button
                  onClick={() => openPermissions(u.id)}
                  aria-label={`Manage permissions for ${u.name}`}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20"
                >
                  <Shield className="w-3.5 h-3.5" /> Permissions
                </button>
              )}
              {can('USER_UPDATE') && (u.roleId !== 1 || user?.roleId === 1) && (
                <button
                  onClick={() => openEdit(u)}
                  aria-label={`Edit user ${u.name}`}
                  className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              {can('USER_DELETE') && u.roleId !== 1 && (
                <button
                  onClick={() => setDeleteId(u.id)}
                  aria-label={`Delete user ${u.name}`}
                  className="p-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-rose-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit User' : 'Create User'} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Full name *</label>
            <input value={form.name} onChange={e => updateField('name', e.target.value)}
              className="input-field" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)}
              className="input-field" placeholder="user@bms.com" />
          </div>
          <div>
            <PasswordField
              label={editingId ? 'Password (leave blank to keep)' : 'Password *'}
              value={form.password}
              onChange={e => updateField('password', e.target.value)}
              placeholder="••••••••"
              icon={<Key className="w-3.5 h-3.5" />}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Role *</label>
            <CustomSelect
              value={form.roleId}
              onChange={(v) => updateField('roleId', parseInt(String(v)))}
              disabled={user?.roleId !== 1}
              options={[
                ...(user?.roleId === 1 ? [{ value: 1, label: 'Admin' }] : []),
                { value: 2, label: 'Employee' },
              ]}
            />
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
            disabled={saving || !form.name || !form.email || (!editingId && !form.password)}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {editingId ? 'Update' : 'Create'} User
          </button>
        </div>
      </Modal>

      {/* Permissions Modal */}
      <Modal open={!!permUserId} onClose={() => setPermUserId(null)} title="Permission Overrides" maxWidth="max-w-lg">
        {permLoading ? (
          <div className="flex justify-center py-8" role="status" aria-live="polite">
            <Loader2 className="w-5 h-5 animate-spin text-red-600" />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-4">Toggle permissions for this user. Overrides take priority over role defaults.</p>
            {userPerms.map(p => (
              <div key={p.permissionId}
                className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.permissionName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Source: {p.source}
                  </p>
                </div>
                <button
                  onClick={() => togglePermission(p)}
                  role="switch"
                  aria-checked={p.isGranted}
                  aria-label={`Toggle permission ${p.permissionName}`}
                  className={cn(
                    "w-10 h-6 rounded-full transition-all duration-300 relative focus-visible:ring-2 focus-visible:ring-emerald-500/30",
                    p.isGranted ? "bg-emerald-500" : "bg-muted border border-border"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm",
                    p.isGranted ? "left-5" : "left-1"
                  )} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete User" maxWidth="max-w-md">
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">Are you sure you want to remove this user? They will no longer be able to access the system.</p>
        <div className="flex justify-end gap-3 pt-5 border-t border-border">
          <button
            onClick={() => setDeleteId(null)}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500/20"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500/30"
          >
            Delete User
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
