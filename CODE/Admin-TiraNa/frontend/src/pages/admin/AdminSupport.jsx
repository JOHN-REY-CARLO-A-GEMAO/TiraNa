import { useState, useEffect, useCallback } from 'react'
import { getTickets, updateTicket } from '../../api/admin'

export default function AdminSupport() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [update, setUpdate] = useState({})

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try { setTickets(await getTickets({ search, status: statusFilter, priority: priorityFilter })) }
    catch (err) { setError(err.message) }
    setLoading(false)
  }, [search, statusFilter, priorityFilter])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  useEffect(() => {
    if (selected) {
      setUpdate({ status: selected.status, assigned_to: selected.assigned_to || '', priority: selected.priority, resolution: selected.resolution || '' })
    }
  }, [selected])

  const handleUpdate = async () => {
    try {
      await updateTicket(selected.id, update)
      setSelected(null)
      fetchTickets()
    } catch (err) { setError(err.message) }
  }

  const statusColor = (s) => {
    const c = { open: 'bg-[#DDDDDD] text-[#000000]', 'in-progress': 'bg-[#CB2957]/10 text-[#000000]', resolved: 'bg-[#CB2957]/10 text-[#CB2957]', closed: 'bg-[#DDDDDD] text-[#000000]' }
    return c[s] || 'bg-[#DDDDDD] text-[#000000]'
  }

  const priorityColor = (p) => {
    const c = { urgent: 'text-[#CB2957]', high: 'text-[#CB2957]', medium: 'text-[#DDDDDD]', low: 'text-[#DDDDDD]' }
    return c[p] || 'text-[#DDDDDD]'
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#000000]">Support Tickets</h1>
        <div className="flex gap-3 flex-wrap">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-[#EEEEEE] border border-[#DDDDDD] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CB2957]">
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 bg-[#EEEEEE] border border-[#DDDDDD] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CB2957]">
            <option value="">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input type="text" placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 bg-[#EEEEEE] border border-[#DDDDDD] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CB2957] w-48" />
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-[#CB2957]/10 border border-[#CB2957]/30 rounded-lg text-[#CB2957] text-sm">{error}</div>}

      <div className="bg-[#EEEEEE] rounded-xl shadow-sm border border-[#DDDDDD] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-[#CB2957] border-t-transparent rounded-full animate-spin" /></div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#DDDDDD]"><p className="text-sm">No tickets found.</p></div>
        ) : (
          <div className="divide-y divide-[#DDDDDD]">
            {tickets.map((t) => (
              <div key={t.id} onClick={() => setSelected(t)} className="p-4 hover:bg-[#DDDDDD] cursor-pointer transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#000000]">#{t.id}</span>
                    <span className="text-[#000000]">{t.subject}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(t.status)}`}>{t.status}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-[#DDDDDD]">
                  <span className={priorityColor(t.priority)}>{t.priority}</span>
                  <span>{t.category}</span>
                  <span>{t.requester_name || t.requester_email}</span>
                  <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  {t.assigned_to && <span>→ {t.assigned_to}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#EEEEEE] rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#000000]">Ticket #{selected.id}</h2>
              <button onClick={() => setSelected(null)} className="text-[#DDDDDD] hover:text-[#000000]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mb-4 text-sm">
              <p className="text-[#000000]"><strong>From:</strong> {selected.requester_name} ({selected.requester_email})</p>
              <p className="text-[#000000]"><strong>Category:</strong> {selected.category}</p>
              <p className="text-[#000000] mt-2">{selected.description}</p>
            </div>
            <div className="space-y-3 border-t pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#DDDDDD] mb-1">Status</label>
                  <select value={update.status || ''} onChange={(e) => setUpdate({ ...update, status: e.target.value })} className="w-full px-3 py-2 border border-[#DDDDDD] rounded-lg text-sm">
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#DDDDDD] mb-1">Priority</label>
                  <select value={update.priority || ''} onChange={(e) => setUpdate({ ...update, priority: e.target.value })} className="w-full px-3 py-2 border border-[#DDDDDD] rounded-lg text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#DDDDDD] mb-1">Assigned To</label>
                <input type="text" value={update.assigned_to || ''} onChange={(e) => setUpdate({ ...update, assigned_to: e.target.value })} placeholder="Admin name..." className="w-full px-3 py-2 border border-[#DDDDDD] rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#DDDDDD] mb-1">Resolution Notes</label>
                <textarea value={update.resolution || ''} onChange={(e) => setUpdate({ ...update, resolution: e.target.value })} placeholder="Resolution details..." className="w-full px-3 py-2 border border-[#DDDDDD] rounded-lg text-sm" rows={3} />
              </div>
              <button onClick={handleUpdate} className="w-full py-3 bg-[#CB2957] hover:bg-[#CB2957]/80 text-white rounded-xl font-medium transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
