import { useState, useEffect, useCallback } from 'react'
import { getPayments, refundPayment, getRevenueStats } from '../../api/admin'

export default function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [revenue, setRevenue] = useState(null)
  const [refundModal, setRefundModal] = useState(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [acting, setActing] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [p, r] = await Promise.all([
        getPayments({ search, status: statusFilter }),
        getRevenueStats(),
      ])
      setPayments(p)
      setRevenue(r)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRefund = async () => {
    if (!refundModal || !refundAmount || !refundReason.trim()) return
    setActing(true)
    try {
      await refundPayment(refundModal.id, parseFloat(refundAmount), refundReason)
      setRefundModal(null)
      setRefundAmount('')
      setRefundReason('')
      fetchData()
    } catch (err) { setError(err.message) }
    setActing(false)
  }

  const statusColor = (s) => {
    const c = { completed: 'bg-green-100 text-green-800', pending: 'bg-yellow-100 text-yellow-800', failed: 'bg-red-100 text-red-800', refunded: 'bg-purple-100 text-purple-800' }
    return c[s] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
          <input type="text" placeholder="Search payments..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
        </div>
      </div>

      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">₱{Number(revenue.total_revenue).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Total Refunded</p>
            <p className="text-2xl font-bold text-red-600">₱{Number(revenue.total_refunded).toLocaleString()}</p>
          </div>
        </div>
      )}

      {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500"><p className="text-sm">No payments found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Payer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Booking</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{p.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{p.payer_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.booking_external_id || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">₱{Number(p.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.method || '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'completed' && (
                        <button onClick={() => { setRefundModal(p); setRefundAmount(String(p.amount)) }} className="px-2 py-1 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors">Refund</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {refundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Refund Payment</h2>
            <p className="text-gray-500 text-sm mb-4">Payment #{refundModal.id} — {refundModal.payer_name}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount (max ₱{refundModal.amount})</label>
              <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} min="0" max={refundModal.amount} step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Refund reason (required)..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
            <div className="flex gap-3">
              <button onClick={() => setRefundModal(null)} disabled={acting} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={handleRefund} disabled={acting || !refundAmount || !refundReason.trim()} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50">{acting ? 'Processing...' : 'Confirm Refund'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
