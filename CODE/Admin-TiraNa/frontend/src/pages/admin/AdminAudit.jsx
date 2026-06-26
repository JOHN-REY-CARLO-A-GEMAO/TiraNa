import { useState, useEffect, useCallback } from 'react'
import { getAuditLogs } from '../../api/admin'

export default function AdminAudit() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try { setLogs(await getAuditLogs({ action: actionFilter })) }
    catch (err) { setError(err.message) }
    setLoading(false)
  }, [actionFilter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const actionColor = (a) => {
    if (a.includes('DELETE') || a.includes('REJECT') || a.includes('CANCEL')) return 'bg-brand/10 text-brand'
    if (a.includes('APPROVE') || a.includes('SHOW')) return 'bg-brand/10 text-brand'
    if (a.includes('CREATE')) return 'bg-brand/10 text-brand'
    return 'bg-gray-light text-dark'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark">Audit Log</h1>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="px-3 py-2 bg-gray-lighter border border-gray-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand">
          <option value="">All Actions</option>
          <option value="APPROVE_LISTING">Approve Listing</option>
          <option value="REJECT_LISTING">Reject Listing</option>
          <option value="SUSPEND_LISTING">Suspend Listing</option>
          <option value="CANCEL_BOOKING">Cancel Booking</option>
          <option value="REFUND_PAYMENT">Refund Payment</option>
          <option value="HIDE_REVIEW">Hide Review</option>
          <option value="SHOW_REVIEW">Show Review</option>
          <option value="UPDATE_TICKET">Update Ticket</option>
          <option value="UPDATE_DISPUTE">Update Dispute</option>
          <option value="APPROVE_WITHDRAWAL">Approve Withdrawal</option>
          <option value="REJECT_WITHDRAWAL">Reject Withdrawal</option>
          <option value="UPDATE_SETTING">Update Setting</option>
          <option value="CREATE_ADMIN">Create Admin</option>
          <option value="UPDATE_ADMIN">Update Admin</option>
          <option value="DELETE_ADMIN">Delete Admin</option>
          <option value="DELETE_USER">Delete User</option>
        </select>
      </div>

      {error && <div className="mb-4 p-3 bg-brand/10 border border-brand/30 rounded-lg text-brand text-sm">{error}</div>}

      <div className="bg-gray-lighter rounded-xl shadow-sm border border-gray-light overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400"><p className="text-sm">No audit logs found.</p></div>
        ) : (
          <div className="divide-y divide-gray-light">
            {logs.map((log) => (
              <div key={log.id} className="px-6 py-3 flex items-center gap-4">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${actionColor(log.action)}`}>{log.action}</span>
                <span className="text-sm text-dark flex-1">{log.details}</span>
                <span className="text-xs text-gray-500 whitespace-nowrap">{log.admin_username}</span>
                <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
