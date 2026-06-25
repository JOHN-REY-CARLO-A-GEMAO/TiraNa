import { useState, useEffect, useCallback } from 'react'
import { getPayments, refundPayment, getRevenueStats } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SearchInput } from '../../components/ui/SearchInput'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { useDebounce } from '../../hooks/useDebounce'

export default function AdminPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [statusFilter, setStatusFilter] = useState('')
  const [revenue, setRevenue] = useState(null)
  const [refundModal, setRefundModal] = useState(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [acting, setActing] = useState(false)
  const [detailModal, setDetailModal] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [p, r] = await Promise.all([
        getPayments({ search: debouncedSearch, status: statusFilter }),
        getRevenueStats(),
      ])
      setPayments(p)
      setRevenue(r)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefund = async () => {
    if (!refundModal || !refundAmount || !refundReason.trim()) return
    setActing(true)
    try {
      await refundPayment(refundModal.id, parseFloat(refundAmount), refundReason)
      setRefundModal(null)
      setRefundAmount('')
      setRefundReason('')
      fetchData()
    } catch (err) {
      setError(err.message)
    }
    setActing(false)
  }

  const headers = [
    { label: 'ID' },
    { label: 'Payer' },
    { label: 'Amount' },
    { label: 'Method' },
    { label: 'Status' },
    { label: 'Date' },
    { label: 'Actions', className: 'text-right' },
  ]

  const renderRow = (p) => (
    <tr key={p.id} className="hover:bg-gray-light/30 transition-colors">
      <td className="px-6 py-4 text-sm text-gray-500 font-medium">#{p.id}</td>
      <td className="px-6 py-4 text-sm font-bold text-dark">{p.payer_name || '—'}</td>
      <td className="px-6 py-4 text-sm font-bold text-brand">₱{Number(p.amount).toLocaleString()}</td>
      <td className="px-6 py-4 text-sm text-gray-600 font-medium uppercase tracking-wider text-xs">{p.method || '—'}</td>
      <td className="px-6 py-4">
        <StatusBadge status={p.status} />
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDetailModal(p)}>Details</Button>
          {p.status === 'completed' && (
            <Button variant="outline" size="sm" onClick={() => { setRefundModal(p); setRefundAmount(String(p.amount)) }}>Refund</Button>
          )}
        </div>
      </td>
    </tr>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-dark tracking-tight">Payments & Revenue</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="All Status"
            options={[
              { value: 'completed', label: 'Completed' },
              { value: 'pending', label: 'Pending' },
              { value: 'refunded', label: 'Refunded' },
              { value: 'failed', label: 'Failed' },
            ]}
          />
          <SearchInput
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-green-100 bg-green-50/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Total Revenue</p>
                <p className="text-3xl font-black text-green-700">₱{Number(revenue.total_revenue).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </Card>
          <Card className="border-red-100 bg-red-50/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Total Refunded</p>
                <p className="text-3xl font-black text-red-700">₱{Number(revenue.total_refunded).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>
              </div>
            </div>
          </Card>
        </div>
      )}

      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      <DataTable
        headers={headers}
        data={payments}
        loading={loading}
        emptyMessage={search || statusFilter ? 'No payments match your search.' : 'No payments found.'}
        renderRow={renderRow}
      />

      {/* Payment Detail Modal */}
      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="Payment Details"
      >
        {detailModal && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Transaction ID</p>
                <p className="text-lg font-bold text-dark">#{detailModal.id}</p>
              </div>
              <StatusBadge status={detailModal.status} />
            </div>

            <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-light">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Payer</p>
                <p className="font-bold text-dark">{detailModal.payer_name}</p>
                <p className="text-xs text-gray-500">Booking Ref: {detailModal.booking_external_id}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Amount</p>
                <p className="text-xl font-black text-brand">₱{Number(detailModal.amount).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Payment Method</p>
                <p className="font-bold uppercase">{detailModal.method}</p>
              </div>
              <div>
                <p className="text-gray-500">Date Paid</p>
                <p className="font-bold">{new Date(detailModal.created_at).toLocaleString()}</p>
              </div>
            </div>

            {detailModal.refund_reason && (
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Refund Information</p>
                <p className="text-sm text-purple-700 font-medium">Reason: {detailModal.refund_reason}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-lighter">
              <Button variant="secondary" onClick={() => setDetailModal(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Refund Modal */}
      <Modal
        isOpen={!!refundModal}
        onClose={() => setRefundModal(null)}
        title="Refund Payment"
      >
        {refundModal && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-purple-700 text-sm">
              Process a refund for <strong>{refundModal.payer_name}</strong>'s payment of ₱{Number(refundModal.amount).toLocaleString()}.
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-dark mb-1.5">Refund Amount (max ₱{refundModal.amount})</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₱</span>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    max={refundModal.amount}
                    className="w-full pl-8 pr-4 py-3 bg-white border border-gray-light rounded-xl focus:ring-2 focus:ring-brand focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-dark mb-1.5">Reason for Refund</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Explain why this refund is being issued..."
                  className="w-full px-4 py-3 border border-gray-light rounded-xl text-sm focus:ring-2 focus:ring-brand focus:outline-none min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-lighter">
              <Button variant="ghost" className="flex-1" onClick={() => setRefundModal(null)} disabled={acting}>Cancel</Button>
              <Button variant="primary" className="flex-1 bg-purple-600 hover:bg-purple-700 shadow-purple-200" onClick={handleRefund} loading={acting} disabled={!refundAmount || !refundReason.trim()}>Issue Refund</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
