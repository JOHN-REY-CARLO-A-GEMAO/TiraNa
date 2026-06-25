import { useState, useEffect, useCallback } from 'react'
import { getHostVerifications, approveHostVerification, rejectHostVerification } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Alert } from '../../components/ui/Alert'
import { Spinner } from '../../components/ui/Spinner'
import { Card } from '../../components/ui/Card'

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState({ status: '', type: '' })
  const [selected, setSelected] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getHostVerifications(filter)
      setVerifications(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApprove = async (id) => {
    setActionLoading(true)
    try {
      await approveHostVerification(id)
      fetchData()
      setSelected(null)
    } catch (err) {
      setError(err.message)
    }
    setActionLoading(false)
  }

  const handleReject = async (id) => {
    if (!rejectReason) return
    setActionLoading(true)
    try {
      await rejectHostVerification(id, rejectReason)
      fetchData()
      setSelected(null)
      setRejectReason('')
    } catch (err) {
      setError(err.message)
    }
    setActionLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-dark tracking-tight">Account Verifications</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <Select 
            value={filter.status} 
            onChange={e => setFilter({...filter, status: e.target.value})}
            placeholder="All Status"
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <Select 
            value={filter.type} 
            onChange={e => setFilter({...filter, type: e.target.value})}
            placeholder="All Types"
            options={[
              { value: 'host', label: 'Hosts' },
              { value: 'guest', label: 'Guests' },
            ]}
          />
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : verifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-light text-gray-400">
           <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="font-medium">No verification requests found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {verifications.map(v => (
            <Card 
              key={v.id} 
              className="group cursor-pointer hover:border-brand/30"
            >
              <div onClick={() => setSelected(v)}>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center font-black text-brand text-xl group-hover:bg-brand group-hover:text-white transition-all">
                    {v.name?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold text-dark group-hover:text-brand transition-colors">{v.name}</h3>
                    <p className="text-xs text-gray-500 font-medium truncate max-w-[150px]">{v.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${v.type === 'host' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {v.type}
                    </span>
                    <StatusBadge status={v.status} />
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">{new Date(v.created_at).toLocaleDateString()}</span>
                </div>
                <Button variant="secondary" size="sm" className="w-full mt-5">Review Documents</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Review Verification"
        maxWidth="max-w-5xl"
      >
        {selected && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Documents Section */}
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">ID Document</h3>
                <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-light flex items-center justify-center group relative">
                  {selected.id_url ? (
                    <>
                      <img src={selected.id_url} className="w-full h-full object-cover" alt="ID Document" />
                      <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <a href={selected.id_url} target="_blank" rel="noreferrer" className="bg-white text-dark p-3 rounded-full shadow-xl hover:scale-110 transition-transform">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </a>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 font-medium">No ID image uploaded</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Verification Selfie</h3>
                <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-light flex items-center justify-center group relative">
                  {selected.selfie_url ? (
                    <>
                      <img src={selected.selfie_url} className="w-full h-full object-cover" alt="Selfie" />
                      <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <a href={selected.selfie_url} target="_blank" rel="noreferrer" className="bg-white text-dark p-3 rounded-full shadow-xl hover:scale-110 transition-transform">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </a>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 font-medium">No selfie image uploaded</p>
                  )}
                </div>
              </div>
            </div>

            {/* Information & Actions */}
            <div className="w-full lg:w-80 flex flex-col">
              <div className="bg-white p-6 rounded-2xl border border-gray-light shadow-sm mb-6">
                <h2 className="text-2xl font-black text-dark mb-1">{selected.name}</h2>
                <p className="text-sm text-gray-500 font-medium mb-6">{selected.email}</p>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">User Type</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${selected.type === 'host' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {selected.type}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                    <p className="text-sm font-bold text-dark">{selected.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Joined Date</p>
                    <p className="text-sm font-bold text-dark">{new Date(selected.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {selected.status === 'pending' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rejection Reason</label>
                    <textarea 
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      className="w-full p-4 border border-gray-light rounded-2xl h-32 focus:ring-2 focus:ring-brand focus:outline-none text-sm shadow-inner bg-gray-50"
                      placeholder="Why is this being rejected? (Required for rejection)"
                    ></textarea>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-gray-300 text-gray-500 hover:bg-gray-50"
                      onClick={() => handleReject(selected.id)}
                      disabled={actionLoading || !rejectReason.trim()}
                      loading={actionLoading && !!rejectReason}
                    >
                      Reject
                    </Button>
                    <Button 
                      variant="primary" 
                      className="flex-1"
                      onClick={() => handleApprove(selected.id)}
                      disabled={actionLoading}
                      loading={actionLoading && !rejectReason}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${selected.status === 'approved' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest">Final Status</p>
                    <p className="font-black text-lg capitalize">{selected.status}</p>
                  </div>
                  <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
