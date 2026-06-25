import { useState, useEffect, useCallback } from 'react'
import { getListings, approveListing, rejectListing, suspendListing } from '../../api/admin'

export default function AdminListings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionModal, setActionModal] = useState(null)
  const [actionType, setActionType] = useState('')
  const [actionReason, setActionReason] = useState('')
  const [acting, setActing] = useState(false)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getListings({ search, status: statusFilter })
      setListings(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => { fetchListings() }, [fetchListings])

  const handleAction = async () => {
    if (!actionModal) return
    setActing(true)
    try {
      if (actionType === 'approve') await approveListing(actionModal.id)
      else if (actionType === 'reject') await rejectListing(actionModal.id, actionReason)
      else if (actionType === 'suspend') await suspendListing(actionModal.id, actionReason)
      setActionModal(null)
      setActionReason('')
      fetchListings()
    } catch (err) {
      setError(err.message)
    }
    setActing(false)
  }

  const openAction = (listing, type) => {
    setActionModal(listing)
    setActionType(type)
    setActionReason('')
  }

  const statusColor = (s) => {
    const colors = { pending: 'bg-[#DDDDDD] text-[#000000]', approved: 'bg-[#CB2957]/10 text-[#CB2957]', rejected: 'bg-[#CB2957]/10 text-[#CB2957]', suspended: 'bg-[#CB2957]/10 text-[#CB2957]' }
    return colors[s] || 'bg-[#DDDDDD] text-[#000000]'
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#000000]">Listings</h1>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-[#EEEEEE] border border-[#DDDDDD] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CB2957]">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          <input type="text" placeholder="Search listings..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 bg-[#EEEEEE] border border-[#DDDDDD] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CB2957] w-48" />
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-[#CB2957]/10 border border-[#CB2957]/30 rounded-lg text-[#CB2957] text-sm">{error}</div>}

      <div className="bg-[#EEEEEE] rounded-xl shadow-sm border border-[#DDDDDD] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-[#CB2957] border-t-transparent rounded-full animate-spin" /></div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#888888]">
            <p className="text-sm">No listings found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#DDDDDD] border-b border-[#DDDDDD]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase">Host</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase">Price/Night</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#555555] uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[#555555] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDDDDD]">
                {listings.map((l) => (
                  <tr key={l.id} className="hover:bg-[#DDDDDD]">
                    <td className="px-4 py-3 text-sm text-[#000000]">{l.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#000000] max-w-[200px] truncate">{l.title}</td>
                    <td className="px-4 py-3 text-sm text-[#000000]">{l.host_email || '—'}</td>
                    <td className="px-4 py-3 text-sm text-[#000000] max-w-[150px] truncate">{l.location || '—'}</td>
                    <td className="px-4 py-3 text-sm text-[#000000]">{l.price_per_night ? `₱${l.price_per_night}` : '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(l.status)}`}>{l.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {l.status === 'pending' && (
                          <>
                            <button onClick={() => openAction(l, 'approve')} className="px-2 py-1 text-xs bg-[#CB2957] hover:bg-[#CB2957]/80 text-white rounded transition-colors">Approve</button>
                            <button onClick={() => openAction(l, 'reject')} className="px-2 py-1 text-xs bg-[#CB2957] hover:bg-[#CB2957]/80 text-white rounded transition-colors">Reject</button>
                          </>
                        )}
                        {(l.status === 'approved' || l.status === 'pending') && (
                          <button onClick={() => openAction(l, 'suspend')} className="px-2 py-1 text-xs bg-[#CB2957] hover:bg-[#CB2957]/80 text-white rounded transition-colors">Suspend</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {actionModal && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#EEEEEE] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-[#000000] mb-2 capitalize">{actionType} Listing</h2>
            <p className="text-[#DDDDDD] text-sm mb-4">"{actionModal.title}"</p>
            {(actionType === 'reject' || actionType === 'suspend') && (
              <textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="Reason..." className="w-full px-3 py-2 border border-[#DDDDDD] rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#CB2957]" rows={3} />
            )}
            <div className="flex gap-3">
              <button onClick={() => setActionModal(null)} disabled={acting} className="flex-1 py-3 bg-[#DDDDDD] hover:bg-[#DDDDDD]/80 rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={handleAction} disabled={acting} className={`flex-1 py-3 text-white rounded-xl font-medium transition-colors disabled:opacity-50 ${actionType === 'approve' ? 'bg-[#CB2957] hover:bg-[#CB2957]/80' : actionType === 'reject' ? 'bg-[#CB2957] hover:bg-[#CB2957]/80' : 'bg-[#CB2957] hover:bg-[#CB2957]/80'}`}>
                {acting ? 'Processing...' : actionType.charAt(0).toUpperCase() + actionType.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
