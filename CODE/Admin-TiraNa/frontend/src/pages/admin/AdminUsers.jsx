import { useState, useEffect, useCallback } from 'react'
import { getAdminUsers, deleteAdminUser } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SearchInput } from '../../components/ui/SearchInput'
import { Modal } from '../../components/ui/Modal'
import { Alert } from '../../components/ui/Alert'
import { useDebounce } from '../../hooks/useDebounce'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [detailUser, setDetailUser] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAdminUsers({ search: debouncedSearch })
      setUsers(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [debouncedSearch])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAdminUser(deleteTarget.id)
      setDeleteTarget(null)
      fetchUsers()
    } catch (err) {
      setError(err.message)
    }
    setDeleting(false)
  }

  const headers = [
    { label: 'ID' },
    { label: 'Username' },
    { label: 'Email' },
    { label: 'Status' },
    { label: 'Created' },
    { label: 'Actions', className: 'text-right' },
  ]

  const renderRow = (user) => (
    <tr key={user.id} className="hover:bg-gray-light/30 transition-colors">
      <td className="px-6 py-4 text-sm text-gray-500 font-medium">#{user.id}</td>
      <td className="px-6 py-4 text-sm font-bold text-dark">{user.username}</td>
      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{user.email}</td>
      <td className="px-6 py-4">
        <StatusBadge status={user.is_verified ? 'verified' : 'pending'} />
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 font-medium">
        {new Date(user.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDetailUser(user)}>View</Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteTarget(user)}>Delete</Button>
        </div>
      </td>
    </tr>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-dark tracking-tight">Users Management</h1>
        <SearchInput
          placeholder="Search by username or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80"
        />
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <DataTable
        headers={headers}
        data={users}
        loading={loading}
        emptyMessage={search ? 'No users match your search.' : 'No users registered yet.'}
        renderRow={renderRow}
      />

      {/* User Detail Modal */}
      <Modal
        isOpen={!!detailUser}
        onClose={() => setDetailUser(null)}
        title="User Profile"
        maxWidth="max-w-xl"
      >
        {detailUser && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center text-brand text-4xl font-black shadow-inner">
                {detailUser.username?.[0]?.toUpperCase()}
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-black text-dark">{detailUser.username}</h2>
                <p className="text-gray-500 font-medium">{detailUser.email}</p>
              </div>
              <StatusBadge status={detailUser.is_verified ? 'verified' : 'pending'} />
            </div>

            <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-light shadow-inner">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">User ID</p>
                <p className="text-sm font-bold text-dark">#{detailUser.id}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Registration Date</p>
                <p className="text-sm font-bold text-dark">{new Date(detailUser.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-lighter">
              <Button variant="secondary" className="flex-1" onClick={() => setDetailUser(null)}>Close</Button>
              <Button variant="danger" className="flex-1" onClick={() => { setDetailUser(null); setDeleteTarget(detailUser); }}>Delete Account</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete User Account"
      >
        {deleteTarget && (
          <div className="space-y-6">
            <Alert type="error">
              This action is permanent and cannot be undone. All data associated with <strong>{deleteTarget.username}</strong> will be lost.
            </Alert>
            <div className="text-center">
              <p className="text-sm text-gray-500">Are you sure you want to delete this user?</p>
              <p className="text-lg font-bold text-dark">{deleteTarget.email}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={handleDelete} loading={deleting}>Permanently Delete</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
