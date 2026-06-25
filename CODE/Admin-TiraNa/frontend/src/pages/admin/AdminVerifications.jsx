import { useState, useEffect } from 'react'
import { getHostVerifications, approveHostVerification, rejectHostVerification } from '../../api/admin'

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', type: '' })
  const [selected, setSelected] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getHostVerifications(filter)
      setVerifications(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [filter])

  const handleApprove = async (id) => {
    if (!confirm('Approve this account?')) return
    setActionLoading(true)
    try {
      await approveHostVerification(id)
      fetchData()
      setSelected(null)
    } catch (err) {
      alert(err.message)
    }
    setActionLoading(false)
  }

  const handleReject = async (id) => {
    if (!rejectReason) return alert('Please provide a reason')
    setActionLoading(true)
    try {
      await rejectHostVerification(id, rejectReason)
      fetchData()
      setSelected(null)
      setRejectReason('')
    } catch (err) {
      alert(err.message)
    }
    setActionLoading(false)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Account Verification</h1>
        <div className="flex gap-4">
          <select 
            value={filter.status} 
            onChange={e => setFilter({...filter, status: e.target.value})}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select 
            value={filter.type} 
            onChange={e => setFilter({...filter, type: e.target.value})}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Types</option>
            <option value="host">Hosts</option>
            <option value="guest">Guests</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {verifications.map(v => (
            <div key={v.id} className="bg-white p-6 rounded-xl shadow-sm border border-[#DDDDDD]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#EEEEEE] rounded-full flex items-center justify-center font-bold text-[#CB2957]">
                  {v.name?.[0] || 'U'}
                </div>
                <div>
                  <h3 className="font-bold">{v.name}</h3>
                  <p className="text-sm text-gray-500">{v.email}</p>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${v.type === 'host' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                  {v.type}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${v.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : v.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {v.status}
                </span>
              </div>
              <button 
                onClick={() => setSelected(v)}
                className="w-full py-2 bg-[#EEEEEE] hover:bg-[#DDDDDD] rounded-lg font-medium transition-colors"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
            <div className="flex-1 p-6 bg-gray-50 border-r">
              <h2 className="text-xl font-bold mb-4">Documents</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">ID Document</p>
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    {selected.id_url ? <img src={selected.id_url} className="w-full h-full object-cover rounded-lg" /> : 'No image'}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Selfie</p>
                  <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                    {selected.selfie_url ? <img src={selected.selfie_url} className="w-full h-full object-cover rounded-lg" /> : 'No image'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selected.name}</h2>
                  <p className="text-gray-500">{selected.email}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-black">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                  <p className="font-medium">{selected.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Registered Date</label>
                  <p className="font-medium">{new Date(selected.created_at).toLocaleDateString()}</p>
                </div>
                {selected.status === 'pending' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Rejection Reason (required for reject)</label>
                    <textarea 
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-[#CB2957] outline-none"
                      placeholder="Explain why the verification was rejected..."
                    ></textarea>
                  </div>
                )}
              </div>

              {selected.status === 'pending' && (
                <div className="flex gap-4 mt-8">
                  <button 
                    onClick={() => handleReject(selected.id)}
                    disabled={actionLoading}
                    className="flex-1 py-3 border-2 border-[#CB2957] text-[#CB2957] font-bold rounded-xl hover:bg-[#CB2957]/5 transition-colors"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleApprove(selected.id)}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-[#CB2957] text-white font-bold rounded-xl hover:bg-[#CB2957]/90 transition-colors shadow-lg shadow-[#CB2957]/20"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
