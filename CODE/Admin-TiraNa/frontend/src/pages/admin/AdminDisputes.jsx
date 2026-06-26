import { useState, useEffect, useCallback } from 'react'
import { getDisputes, updateDispute } from '../../api/admin'

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [update, setUpdate] = useState({})

  const fetchDisputes = useCallback(async () => {
    setLoading(true)
    try { setDisputes(await getDisputes({ status: statusFilter })) }
    catch (err) { setError(err.message) }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { fetchDisputes() }, [fetchDisputes])

  useEffect(() => {
    if (selected) {
      setUpdate({ status: selected.status, resolution: selected.resolution || '', resolved_by: selected.resolved_by || '' })
    }
  }, [selected])

  const handleUpdate = async () => {
    try {
      await updateDispute(selected.id, update)
      setSelected(null)
      fetchDisputes()
    } catch (err) { setError(err.message) }
  }

  const statusColor = (s) => {
    const c = { open: 'bg-gray-light text-dark', 'in-review': 'bg-brand/10 text-dark', resolved: 'bg-brand/10 text-brand', dismissed: 'bg-gray-light text-dark' }
    return c[s] || 'bg-gray-light text-dark'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark">Disputes</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-gray-lighter border border-gray-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in-review">In Review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {error && <div className="mb-4 p-3 bg-brand/10 border border-brand/30 rounded-lg text-brand text-sm">{error}</div>}

      <div className="bg-gray-lighter rounded-xl shadow-sm border border-gray-light overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>
        ) : disputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400"><p className="text-sm">No disputes found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-light border-b border-gray-light">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Filed By</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Booking</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-light">
                {disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-light cursor-pointer" onClick={() => setSelected(d)}>
                    <td className="px-4 py-3 text-sm text-dark">{d.id}</td>
                    <td className="px-4 py-3 text-sm text-dark">{d.filed_by}</td>
                    <td className="px-4 py-3 text-sm text-dark max-w-[200px] truncate">{d.reason}</td>
                    <td className="px-4 py-3 text-sm text-dark">{d.booking_external_id || '—'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(d.status)}`}>{d.status}</span></td>
                    <td className="px-4 py-3 text-sm text-dark">{new Date(d.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right"><button className="text-brand hover:text-brand/80 text-sm">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-gray-lighter rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-dark">Dispute #{selected.id}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-light hover:text-dark">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mb-4 text-sm space-y-1">
              <p className="text-dark"><strong>Filed by:</strong> {selected.filed_by} ({selected.filed_by_email})</p>
              <p className="text-dark"><strong>Booking:</strong> {selected.booking_external_id || 'N/A'}</p>
              <p className="text-dark mt-2">{selected.reason}</p>
              {selected.evidence && <p className="text-gray-light mt-1"><strong>Evidence:</strong> {selected.evidence}</p>}
            </div>
            <div className="space-y-3 border-t pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-light mb-1">Status</label>
                  <select value={update.status || ''} onChange={(e) => setUpdate({ ...update, status: e.target.value })} className="w-full px-3 py-2 border border-gray-light rounded-lg text-sm">
                    <option value="open">Open</option>
                    <option value="in-review">In Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-light mb-1">Resolved By</label>
                  <input type="text" value={update.resolved_by || ''} onChange={(e) => setUpdate({ ...update, resolved_by: e.target.value })} className="w-full px-3 py-2 border border-gray-light rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-light mb-1">Resolution</label>
                <textarea value={update.resolution || ''} onChange={(e) => setUpdate({ ...update, resolution: e.target.value })} placeholder="Resolution details..." className="w-full px-3 py-2 border border-gray-light rounded-lg text-sm" rows={3} />
              </div>
              <button onClick={handleUpdate} className="w-full py-3 bg-brand hover:bg-brand/80 text-white rounded-xl font-medium transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
