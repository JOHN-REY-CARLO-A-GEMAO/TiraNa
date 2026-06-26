import { useState, useEffect, useCallback } from 'react'
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, inviteAdmin } from '../../api/admin'

export default function AdminManagement() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [inviteForm, setInviteForm] = useState({ username: '', email: '' })
  const [creating, setCreating] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    try { setAdmins(await getAdmins()) }
    catch (err) { setError(err.message) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAdmins() }, [fetchAdmins])

  const handleCreate = async () => {
    setCreating(true)
    try {
      await createAdmin(form.username, form.email, form.password)
      setShowCreate(false)
      setForm({ username: '', email: '', password: '' })
      fetchAdmins()
    } catch (err) { setError(err.message) }
    setCreating(false)
  }

  const handleInvite = async () => {
    setInviting(true)
    try {
      await inviteAdmin(inviteForm.username, inviteForm.email)
      setShowInvite(false)
      setInviteForm({ username: '', email: '' })
      fetchAdmins()
    } catch (err) { setError(err.message) }
    setInviting(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try { await deleteAdmin(deleteTarget.id); setDeleteTarget(null); fetchAdmins() }
    catch (err) { setError(err.message) }
    setDeleting(false)
  }

  const toggleActive = async (admin) => {
    try { await updateAdmin(admin.id, { is_active: !admin.is_active }); fetchAdmins() }
    catch (err) { setError(err.message) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark">Admin Management</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowInvite(true)} className="px-4 py-2 bg-brand hover:bg-brand/80 text-white text-sm font-medium rounded-lg transition-colors">
            + Invite Admin
          </button>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-brand hover:bg-brand/80 text-white text-sm font-medium rounded-lg transition-colors">
            + New Admin
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-brand/10 border border-brand/30 rounded-lg text-brand text-sm">{error}</div>}

      <div className="bg-gray-lighter rounded-xl shadow-sm border border-gray-light overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-light border-b border-gray-light">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-light">
              {admins.map((a) => (
                <tr key={a.id} className="hover:bg-gray-light">
                  <td className="px-6 py-4 text-sm text-dark">{a.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-dark">{a.username}</td>
                  <td className="px-6 py-4 text-sm text-dark">{a.email}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleActive(a)} className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${a.is_active ? 'bg-brand/10 text-brand hover:bg-brand/20' : 'bg-gray-light text-dark hover:bg-gray-light/80'}`}>
                      {a.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setDeleteTarget(a)} className="text-brand hover:text-brand/80 text-sm font-medium transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gray-lighter rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-dark mb-4">New Admin (Manual)</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowCreate(false)} disabled={creating} className="flex-1 py-3 bg-gray-light hover:bg-gray-light/80 rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={creating || !form.username || !form.email || !form.password} className="flex-1 py-3 bg-brand hover:bg-brand/80 text-white rounded-xl font-medium transition-colors disabled:opacity-50">{creating ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gray-lighter rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-dark mb-4">Invite New Admin</h2>
            <p className="text-sm text-gray-500 mb-4">An invitation code will be sent to the email address. The user will be able to set their own password.</p>
            <div className="space-y-3">
              <input type="text" placeholder="Username" value={inviteForm.username} onChange={(e) => setInviteForm({ ...inviteForm, username: e.target.value })} className="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              <input type="email" placeholder="Email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowInvite(false)} disabled={inviting} className="flex-1 py-3 bg-gray-light hover:bg-gray-light/80 rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={handleInvite} disabled={inviting || !inviteForm.username || !inviteForm.email} className="flex-1 py-3 bg-brand hover:bg-brand/80 text-white rounded-xl font-medium transition-colors disabled:opacity-50">{inviting ? 'Sending Invite...' : 'Send Invitation'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gray-lighter rounded-2xl p-6 w-full max-w-md shadow-2xl text-center">
            <h2 className="text-xl font-bold text-dark mb-2">Delete Admin</h2>
            <p className="text-gray-light text-sm mb-6">Are you sure you want to delete <strong>{deleteTarget.username}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 py-3 bg-gray-light hover:bg-gray-light/80 rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 bg-brand hover:bg-brand/80 text-white rounded-xl font-medium transition-colors disabled:opacity-50">{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
