import { useState, useEffect, useCallback } from 'react'
import { getBookings, cancelBooking } from '../../api/admin'

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [acting, setActing] = useState(false)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try { setBookings(await getBookings({ search, status: statusFilter })) }
    catch (err) { setError(err.message) }
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const handleCancel = async () => {
    if (!cancelModal || !cancelReason.trim()) return
    setActing(true)
    try {
      await cancelBooking(cancelModal.id, cancelReason)
      setCancelModal(null)
      setCancelReason('')
      fetchBookings()
    } catch (err) { setError(err.message) }
    setActing(false)
  }

  const statusColor = (s) => {
    const c = { confirmed: 'bg-green-100 text-green-800', completed: 'bg-blue-100 text-blue-800', cancelled: 'bg-red-100 text-red-800', pending: 'bg-yellow-100 text-yellow-800' }
    return c[s] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bookings</h1>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
          <input type="text" placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500"><p className="text-sm">No bookings found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Listing</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Guest</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Check-in</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Check-out</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nights</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{b.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[180px] truncate">{b.listing_title || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.guest_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.check_in ? new Date(b.check_in).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.check_out ? new Date(b.check_out).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.nights || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{b.total_price ? `₱${b.total_price}` : '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(b.status)}`}>{b.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      {b.status === 'confirmed' && (
                        <button onClick={() => setCancelModal(b)} className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors">Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {cancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Cancel Booking</h2>
            <p className="text-gray-500 text-sm mb-4">{cancelModal.listing_title} — {cancelModal.guest_name}</p>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Cancellation reason (required)..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
            <div className="flex gap-3">
              <button onClick={() => setCancelModal(null)} disabled={acting} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">Keep Booking</button>
              <button onClick={handleCancel} disabled={acting || !cancelReason.trim()} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50">{acting ? 'Cancelling...' : 'Cancel Booking'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
