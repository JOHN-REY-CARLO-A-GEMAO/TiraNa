import { useState, useEffect, useCallback } from 'react'
import { getWithdrawals, approveWithdrawal, rejectWithdrawal } from '../../api/admin'

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [acting, setActing] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try { setWithdrawals(await getWithdrawals({ status: statusFilter })) }
    catch (err) { setError(err.message) }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleApprove = async (id) => {
    setActing(true)
    try { await approveWithdrawal(id); fetchData() }
    catch (err) { setError(err.message) }
    setActing(false)
  }

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return
    setActing(true)
    try { await rejectWithdrawal(rejectModal.id, rejectReason); setRejectModal(null); setRejectReason(''); fetchData() }
    catch (err) { setError(err.message) }
    setActing(false)
  }

  const statusColor = (s) => {
    const c = { pending: 'bg-[#DDDDDD] text-[#000000]', approved: 'bg-[#CB2957]/10 text-[#CB2957]', rejected: 'bg-[#CB2957]/10 text-[#CB2957]' }
    return c[s] || 'bg-[#DDDDDD] text-[#000000]'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#000000]">Withdrawals</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-[#EEEEEE] border border-[#DDDDDD] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CB2957]">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && <div className="mb-4 p-3 bg-[#CB2957]/10 border border-[#CB2957]/30 rounded-lg text-[#CB2957] text-sm">{error}</div>}

      <div className="bg-[#EEEEEE] rounded-xl shadow-sm border border-[#DDDDDD] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-[#CB2957] border-t-transparent rounded-full animate-spin" /></div>
        ) : withdrawals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#DDDDDD]"><p className="text-sm">No withdrawals found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#DDDDDD] border-b border-[#DDDDDD]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#DDDDDD] uppercase">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#DDDDDD] uppercase">Host</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#DDDDDD] uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#DDDDDD] uppercase">Method</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#DDDDDD] uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#DDDDDD] uppercase">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[#DDDDDD] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDDDDD]">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-[#DDDDDD]">
                    <td className="px-4 py-3 text-sm text-[#DDDDDD]">{w.id}</td>
                    <td className="px-4 py-3 text-sm text-[#000000]">{w.host_name || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#000000]">₱{Number(w.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-[#000000]">{w.method || '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(w.status)}`}>{w.status}</span></td>
                    <td className="px-4 py-3 text-sm text-[#000000]">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {w.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleApprove(w.id)} disabled={acting} className="px-2 py-1 text-xs bg-[#CB2957] hover:bg-[#CB2957]/80 text-white rounded transition-colors disabled:opacity-50">Approve</button>
                          <button onClick={() => setRejectModal(w)} disabled={acting} className="px-2 py-1 text-xs bg-[#CB2957] hover:bg-[#CB2957]/80 text-white rounded transition-colors disabled:opacity-50">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#EEEEEE] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-[#000000] mb-2">Reject Withdrawal</h2>
            <p className="text-[#DDDDDD] text-sm mb-4">{rejectModal.host_name} — ₱{rejectModal.amount}</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Rejection reason (required)..." className="w-full px-3 py-2 border border-[#DDDDDD] rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#CB2957]" rows={3} />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} disabled={acting} className="flex-1 py-3 bg-[#DDDDDD] hover:bg-[#DDDDDD]/80 rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={handleReject} disabled={acting || !rejectReason.trim()} className="flex-1 py-3 bg-[#CB2957] hover:bg-[#CB2957]/80 text-white rounded-xl font-medium transition-colors disabled:opacity-50">{acting ? 'Rejecting...' : 'Reject'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
