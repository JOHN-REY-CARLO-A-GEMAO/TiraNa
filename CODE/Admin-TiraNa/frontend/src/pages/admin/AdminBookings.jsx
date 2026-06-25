import { useState, useCallback, useEffect } from 'react'
import { getBookings, cancelBooking, exportBookings } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SearchInput } from '../../components/ui/SearchInput'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Alert } from '../../components/ui/Alert'
import { useDebounce } from '../../hooks/useDebounce'

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [statusFilter, setStatusFilter] = useState('')
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [acting, setActing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [detailModal, setDetailModal] = useState(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getBookings({ search: debouncedSearch, status: statusFilter })
      setBookings(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleCancel = async () => {
    if (!cancelModal || !cancelReason.trim()) return
    setActing(true)
    try {
      await cancelBooking(cancelModal.id, cancelReason)
      setCancelModal(null)
      setCancelReason('')
      fetchBookings()
    } catch (err) {
      setError(err.message)
    }
    setActing(false)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await exportBookings({ search: debouncedSearch, status: statusFilter })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bookings_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    }
    setExporting(false)
  }

  const headers = [
    { label: 'ID' },
    { label: 'Listing' },
    { label: 'Guest' },
    { label: 'Check-in' },
    { label: 'Check-out' },
    { label: 'Total' },
    { label: 'Status' },
    { label: 'Actions', className: 'text-right' },
  ]

  const renderRow = (b) => (
    <tr key={b.id} className="hover:bg-gray-light/30 transition-colors group">
      <td className="px-6 py-4 text-sm text-gray-500 font-medium">#{b.id}</td>
      <td className="px-6 py-4 text-sm font-bold text-dark max-w-[200px] truncate">{b.listing_title || '—'}</td>
      <td className="px-6 py-4 text-sm text-dark font-medium">{b.guest_name || '—'}</td>
      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{b.check_in ? new Date(b.check_in).toLocaleDateString() : '—'}</td>
      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{b.check_out ? new Date(b.check_out).toLocaleDateString() : '—'}</td>
      <td className="px-6 py-4 text-sm font-bold text-brand">{b.total_price ? `₱${b.total_price.toLocaleString()}` : '—'}</td>
      <td className="px-6 py-4">
        <StatusBadge status={b.status} />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDetailModal(b)}>Details</Button>
          {b.status === 'confirmed' && (
            <Button variant="danger" size="sm" onClick={() => setCancelModal(b)}>Cancel</Button>
          )}
        </div>
      </td>
    </tr>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-dark tracking-tight">Bookings Management</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport} 
            loading={exporting}
            className="hidden sm:flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export CSV
          </Button>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="All Status"
            options={[
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
          <SearchInput
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <DataTable
        headers={headers}
        data={bookings}
        loading={loading}
        emptyMessage={search || statusFilter ? 'No bookings match your filters.' : 'No bookings found.'}
        renderRow={renderRow}
      />

      {/* Booking Detail Modal */}
      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="Booking Details"
        maxWidth="max-w-2xl"
      >
        {detailModal && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Listing</p>
                <p className="text-lg font-bold text-dark">{detailModal.listing_title}</p>
                <p className="text-sm text-gray-500">ID: #{detailModal.listing_id}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                <StatusBadge status={detailModal.status} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 p-4 bg-white rounded-xl border border-gray-light shadow-sm">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Guest Info</p>
                <p className="font-bold text-dark">{detailModal.guest_name}</p>
                <p className="text-sm text-gray-500">{detailModal.guest_email}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Dates & Duration</p>
                <p className="font-bold text-dark">
                  {new Date(detailModal.check_in).toLocaleDateString()} — {new Date(detailModal.check_out).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">{detailModal.nights} nights total</p>
              </div>
            </div>

            <div className="p-4 bg-brand/5 rounded-xl border border-brand/10">
              <div className="flex justify-between items-center">
                <p className="font-bold text-dark">Total Price</p>
                <p className="text-xl font-black text-brand">₱{detailModal.total_price?.toLocaleString()}</p>
              </div>
            </div>

            {detailModal.cancellation_reason && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Cancellation Reason</p>
                <p className="text-sm text-red-700">{detailModal.cancellation_reason}</p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button variant="secondary" onClick={() => setDetailModal(null)}>Close Details</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancelModal}
        onClose={() => setCancelModal(null)}
        title="Cancel Booking"
      >
        {cancelModal && (
          <div className="space-y-4">
            <Alert type="error">
              This action cannot be undone. This will cancel the booking for <strong>{cancelModal.guest_name}</strong>.
            </Alert>
            <div className="space-y-1">
              <label className="text-sm font-bold text-dark">Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please explain why this booking is being cancelled..."
                className="w-full px-4 py-3 border border-gray-light rounded-xl text-sm focus:ring-2 focus:ring-brand focus:outline-none min-h-[100px]"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setCancelModal(null)} disabled={acting}>Keep Booking</Button>
              <Button variant="danger" className="flex-1" onClick={handleCancel} loading={acting} disabled={!cancelReason.trim()}>Confirm Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
