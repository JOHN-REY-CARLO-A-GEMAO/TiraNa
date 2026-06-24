import { useState, useEffect, useCallback } from 'react'
import { getAdminUsers, deleteAdminUser } from '../../api/admin'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAdminUsers({ search })
      setUsers(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [search])

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#000000]">Users</h1>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#DDDDDD]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-[#EEEEEE] border border-[#DDDDDD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB2957] focus:border-transparent w-64"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[#CB2957]/10 border border-[#CB2957]/30 rounded-lg text-[#CB2957] text-sm">
          {error}
        </div>
      )}

      <div className="bg-[#EEEEEE] rounded-xl shadow-sm border border-[#DDDDDD] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-[#CB2957] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#DDDDDD]">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <p className="text-sm">{search ? 'No users match your search.' : 'No users registered yet.'}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#DDDDDD] border-b border-[#DDDDDD]">
                <th className="text-left px-6 py-3 text-xs font-medium text-[#DDDDDD] uppercase tracking-wider">ID</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[#DDDDDD] uppercase tracking-wider">Username</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[#DDDDDD] uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[#DDDDDD] uppercase tracking-wider">Verified</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-[#DDDDDD] uppercase tracking-wider">Created At</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-[#DDDDDD] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDDDDD]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#DDDDDD] transition-colors">
                  <td className="px-6 py-4 text-sm text-[#DDDDDD]">{user.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[#000000]">{user.username}</td>
                  <td className="px-6 py-4 text-sm text-[#000000]">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_verified ? 'bg-[#CB2957]/10 text-[#CB2957]' : 'bg-[#DDDDDD] text-[#000000]'
                    }`}>
                      {user.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#DDDDDD]">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setDeleteTarget(user)}
                      className="text-[#CB2957] hover:text-[#CB2957]/80 text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#EEEEEE] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#CB2957]/10 mb-4">
                <svg className="w-7 h-7 text-[#CB2957]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#000000]">Delete User</h2>
              <p className="text-[#DDDDDD] text-sm mt-2">
                Are you sure you want to permanently delete{' '}
                <span className="font-medium text-[#000000]">{deleteTarget.username}</span>?
              </p>
              <p className="text-[#DDDDDD] text-xs mt-1">Email: {deleteTarget.email}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-[#CB2957]/10 border border-[#CB2957]/30 rounded-lg text-[#CB2957] text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-3 bg-[#DDDDDD] hover:bg-[#DDDDDD]/80 text-[#000000] rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-[#CB2957] hover:bg-[#CB2957]/80 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Deleting...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
