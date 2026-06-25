import { useState, useEffect, useCallback } from 'react'
import { getListings, approveListing, rejectListing, suspendListing } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SearchInput } from '../../components/ui/SearchInput'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Alert } from '../../components/ui/Alert'
import { useDebounce } from '../../hooks/useDebounce'

export default function AdminListings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [statusFilter, setStatusFilter] = useState('')
  const [actionModal, setActionModal] = useState(null)
  const [actionType, setActionType] = useState('')
  const [actionReason, setActionReason] = useState('')
  const [acting, setActing] = useState(false)
  const [detailListing, setDetailListing] = useState(null)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getListings({ search: debouncedSearch, status: statusFilter })
      setListings(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [debouncedSearch, statusFilter])

  useEffect(() => { fetchListings() }, [fetchListings])

  const handleAction = async () => {
    if (!actionModal) return
    setActing(true)
    try {
      if (actionType === 'approve') await approveListing(actionModal.id)
      else if (actionType === 'reject') await rejectListing(actionModal.id, actionReason)
      else if (actionType === 'suspend') await suspendListing(actionModal.id, actionReason)
      setActionModal(null)
      setActionReason('')
      fetchListings()
    } catch (err) {
      setError(err.message)
    }
    setActing(false)
  }

  const openAction = (listing, type) => {
    setActionModal(listing)
    setActionType(type)
    setActionReason('')
  }

  const headers = [
    { label: 'ID' },
    { label: 'Title' },
    { label: 'Host' },
    { label: 'Price/Night' },
    { label: 'Status' },
    { label: 'Actions', className: 'text-right' },
  ]

  const renderRow = (l) => (
    <tr key={l.id} className="hover:bg-gray-light/30 transition-colors">
      <td className="px-6 py-4 text-sm text-gray-500 font-medium">#{l.id}</td>
      <td className="px-6 py-4 text-sm font-bold text-dark max-w-[200px] truncate">{l.title}</td>
      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{l.host_email || '—'}</td>
      <td className="px-6 py-4 text-sm font-bold text-brand">{l.price_per_night ? `₱${Number(l.price_per_night).toLocaleString()}` : '—'}</td>
      <td className="px-6 py-4">
        <StatusBadge status={l.status} />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDetailListing(l)}>View</Button>
          {l.status === 'pending' && (
            <>
              <Button variant="primary" size="sm" onClick={() => openAction(l, 'approve')}>Approve</Button>
              <Button variant="outline" size="sm" onClick={() => openAction(l, 'reject')}>Reject</Button>
            </>
          )}
          {(l.status === 'approved' || l.status === 'pending') && (
            <Button variant="danger" size="sm" onClick={() => openAction(l, 'suspend')}>Suspend</Button>
          )}
        </div>
      </td>
    </tr>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-dark tracking-tight">Listings Moderation</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="All Status"
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
          <SearchInput
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <DataTable
        headers={headers}
        data={listings}
        loading={loading}
        emptyMessage="No listings found matching your criteria."
        renderRow={renderRow}
      />

      {/* Listing Detail Modal */}
      <Modal
        isOpen={!!detailListing}
        onClose={() => setDetailListing(null)}
        title="Listing Details"
        maxWidth="max-w-3xl"
      >
        {detailListing && (
          <div className="space-y-6">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-lighter">
              {detailListing.photo_url ? (
                <img src={detailListing.photo_url} className="w-full h-full object-cover" alt={detailListing.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">No Preview Image</div>
              )}
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-dark mb-1">{detailListing.title}</h2>
                <p className="text-gray-500 font-medium flex items-center gap-1 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {detailListing.location || 'Location not specified'}
                </p>
              </div>
              <StatusBadge status={detailListing.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-light">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Host Information</p>
                <p className="font-bold text-dark">{detailListing.host_email}</p>
                <p className="text-xs text-gray-500">ID: #{detailListing.host_id}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pricing</p>
                <p className="text-xl font-black text-brand">₱{Number(detailListing.price_per_night).toLocaleString()}<span className="text-xs font-bold text-gray-400 uppercase ml-1">/ night</span></p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</p>
              <p className="text-sm text-gray-600 leading-relaxed bg-white p-4 rounded-xl border border-gray-lighter shadow-inner">
                {detailListing.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-lighter">
              <Button variant="secondary" className="flex-1" onClick={() => setDetailListing(null)}>Close</Button>
              {detailListing.status === 'pending' && (
                <Button variant="primary" className="flex-1" onClick={() => { setDetailListing(null); openAction(detailListing, 'approve'); }}>Approve Listing</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Action Modal (Approve/Reject/Suspend) */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Listing`}
      >
        {actionModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              You are about to <strong>{actionType}</strong> the listing:
              <br />
              <span className="text-dark font-bold">"{actionModal.title}"</span>
            </p>
            
            {(actionType === 'reject' || actionType === 'suspend') && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-dark">Reason for {actionType}</label>
                <textarea 
                  value={actionReason} 
                  onChange={(e) => setActionReason(e.target.value)} 
                  placeholder="Explain why this action is being taken..." 
                  className="w-full px-4 py-3 border border-gray-light rounded-xl text-sm focus:ring-2 focus:ring-brand focus:outline-none min-h-[100px]" 
                />
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-lighter">
              <Button variant="ghost" className="flex-1" onClick={() => setActionModal(null)} disabled={acting}>Cancel</Button>
              <Button 
                variant={actionType === 'approve' ? 'primary' : 'danger'} 
                className="flex-1" 
                onClick={handleAction} 
                loading={acting}
                disabled={(actionType !== 'approve' && !actionReason.trim())}
              >
                Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
