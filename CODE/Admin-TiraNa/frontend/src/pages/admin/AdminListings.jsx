import { useState, useEffect, useCallback, useRef } from 'react'
import { getListings, approveListing, rejectListing, hideListing, unhideListing, deleteListing } from '../../api/admin'
import { useDebounce } from '../../hooks/useDebounce'

export default function AdminListings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [statusFilter, setStatusFilter] = useState('')
  const [detailListing, setDetailListing] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [confirmType, setConfirmType] = useState('')
  const [confirmReason, setConfirmReason] = useState('')
  const [acting, setActing] = useState(false)
  const [hostModal, setHostModal] = useState(null)
  const dropdownRef = useRef(null)

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleConfirm = async () => {
    if (!confirmModal) return
    setActing(true)
    try {
      if (confirmType === 'approve') await approveListing(confirmModal.id)
      else if (confirmType === 'reject') await rejectListing(confirmModal.id, confirmReason)
      else if (confirmType === 'takedown') await rejectListing(confirmModal.id, confirmReason)
      else if (confirmType === 'hide') await hideListing(confirmModal.id)
      else if (confirmType === 'unhide') await unhideListing(confirmModal.id)
      else if (confirmType === 'delete') await deleteListing(confirmModal.id)
      setConfirmModal(null)
      setConfirmReason('')
      fetchListings()
    } catch (err) {
      setError(err.message)
    }
    setActing(false)
  }

  const openConfirm = (listing, type) => {
    setDropdownOpen(null)
    setConfirmModal(listing)
    setConfirmType(type)
    setConfirmReason('')
  }

  const menuItems = (l) => {
    const items = [
      { key: 'view', label: 'View Details', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', onClick: () => { setDropdownOpen(null); setDetailListing(l) } },
      { key: 'host', label: 'View Host Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', onClick: () => { setDropdownOpen(null); setHostModal(l) } },
    ]
    if (l.status === 'active') {
      items.push({ key: 'hide', label: 'Hide Listing', icon: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21', danger: false, onClick: () => openConfirm(l, 'hide') })
      items.push({ key: 'takedown', label: 'Take Down', icon: 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', danger: true, onClick: () => openConfirm(l, 'takedown') })
    }
    if (l.status === 'pending') {
      items.push({ key: 'approve', label: 'Approve', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', danger: false, onClick: () => openConfirm(l, 'approve') })
      items.push({ key: 'reject', label: 'Reject', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', danger: true, onClick: () => openConfirm(l, 'reject') })
    }
    if (l.status === 'hidden') {
      items.push({ key: 'unhide', label: 'Unhide Listing', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', danger: false, onClick: () => openConfirm(l, 'unhide') })
    }
    items.push({ key: 'delete', label: 'Delete', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', danger: true, onClick: () => openConfirm(l, 'delete') })
    return items
  }

  const confirmTitle = {
    approve: 'Approve Listing',
    reject: 'Reject Listing',
    takedown: 'Take Down Listing',
    hide: 'Hide Listing',
    unhide: 'Unhide Listing',
    delete: 'Delete Listing',
  }

  const confirmBtnClass = {
    approve: 'btn-brand',
    reject: 'btn-danger',
    takedown: 'btn-danger',
    hide: 'btn-warning',
    unhide: 'btn-brand',
    delete: 'btn-danger',
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Listings Moderation</h1>
        <div className="page-actions">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="hidden">Hidden</option>
            <option value="rejected">Rejected</option>
          </select>
          <input type="text" placeholder="Search listings..." value={search} onChange={(e) => setSearch(e.target.value)} className="filter-input" />
        </div>
      </div>

      {error && <div className="alert-strip alert-danger" style={{marginBottom:16}}><div className="alert-strip-content"><p>Error</p><p>{error}</p></div></div>}

      <div className="table-container">
        {loading ? (
          <div className="loader"><div className="spin" /></div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <p>No listings found matching your criteria.</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Host</th>
                  <th>Price/Night</th>
                  <th>Status</th>
                  <th style={{textAlign:'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id}>
                    <td className="td-id">#{l.id}</td>
                    <td>
                      <span className="td-main" style={{cursor:'pointer',color:'var(--brand)'}} onClick={() => setDetailListing(l)}>
                        {l.title}
                      </span>
                    </td>
                    <td className="td-muted">{l.host_email || '—'}</td>
                    <td className="td-amount">{l.price_per_night ? `₱${Number(l.price_per_night).toLocaleString()}` : '—'}</td>
                    <td><span className={`badge badge-${l.status}`}>{l.status}</span></td>
                    <td>
                      <div className="td-actions" style={{justifyContent:'flex-end'}}>
                        <div className="dropdown" style={{position:'relative'}} ref={dropdownOpen === l.id ? dropdownRef : undefined}>
                          <button className="btn btn-ghost btn-sm dropdown-toggle" onClick={() => setDropdownOpen(dropdownOpen === l.id ? null : l.id)}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                          </button>
                          {dropdownOpen === l.id && (
                            <div className="dropdown-menu" style={{position:'absolute',right:0,top:'100%',marginTop:4,zIndex:100,background:'#fff',border:'1px solid var(--gray-light)',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,0.15)',minWidth:200,overflow:'hidden',padding:'6px 0'}}>
                              {menuItems(l).map(item => (
                                <button
                                  key={item.key}
                                  onClick={item.onClick}
                                  style={{
                                    display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 16px',border:'none',background:'none',cursor:'pointer',fontSize:13,fontWeight:500,color: item.danger ? 'var(--red)' : 'var(--dark)',textAlign:'left',
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <div className="pagination-info">{listings.length} listing(s)</div>
            </div>
          </>
        )}
      </div>

      {detailListing && (
        <div className="modal-overlay open" onClick={() => setDetailListing(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Listing Details</h2>
              <button onClick={() => setDetailListing(null)} className="modal-close">&times;</button>
            </div>
            <div style={{aspectRatio:'16/9',width:'100%',borderRadius:12,overflow:'hidden',background:'#f3f4f6',border:'1px solid var(--gray-light)',marginBottom:16}}>
              {detailListing.photo_url ? (
                <img src={detailListing.photo_url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={detailListing.title} />
              ) : (
                <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af',fontWeight:700}}>No Preview Image</div>
              )}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
              <div>
                <h2 style={{fontSize:20,fontWeight:900,color:'var(--dark)',marginBottom:4}}>{detailListing.title}</h2>
                <p style={{fontSize:13,color:'#6b7280',fontWeight:500,display:'flex',alignItems:'center',gap:4}}>
                  <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {detailListing.location || 'Location not specified'}
                </p>
              </div>
              <span className={`badge badge-${detailListing.status}`}>{detailListing.status}</span>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <p>Host Information</p>
                <p>{detailListing.host_email}</p>
                <p className="td-sub">ID: #{detailListing.host_id}</p>
              </div>
              <div className="info-item">
                <p>Pricing</p>
                <p style={{color:'var(--brand)',fontSize:20}}>₱{Number(detailListing.price_per_night).toLocaleString()}</p>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <p style={{fontSize:10,fontWeight:900,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:6}}>Description</p>
              <p style={{fontSize:13,color:'#6b7280',lineHeight:1.6,background:'#fff',padding:14,borderRadius:10,border:'1px solid var(--gray-light)'}}>
                {detailListing.description || 'No description provided.'}
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDetailListing(null)} className="btn btn-ghost">Close</button>
              {detailListing.status === 'pending' && (
                <button onClick={() => { setDetailListing(null); openConfirm(detailListing, 'approve'); }} className="btn btn-brand">Approve Listing</button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="modal-overlay open" onClick={() => setConfirmModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{confirmTitle[confirmType]}</h2>
              <button onClick={() => setConfirmModal(null)} className="modal-close">&times;</button>
            </div>
            <p style={{fontSize:13,color:'#6b7280',marginBottom:16}}>
              You are about to <strong>{confirmType}</strong> the listing:
              <br />
              <span style={{color:'var(--dark)',fontWeight:700}}>"{confirmModal.title}"</span>
            </p>
            {(confirmType === 'reject' || confirmType === 'takedown') && (
              <div className="form-group">
                <label className="form-label">Reason for rejection</label>
                <textarea value={confirmReason} onChange={(e) => setConfirmReason(e.target.value)} placeholder="Explain why this listing is being rejected..." className="form-textarea" style={{minHeight:100}} />
              </div>
            )}
            {confirmType === 'delete' && (
              <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:14,marginBottom:16}}>
                <p style={{fontSize:13,color:'#991b1b',fontWeight:600}}>Warning: This action cannot be undone.</p>
                <p style={{fontSize:12,color:'#b91c1c',marginTop:4}}>The listing will be permanently removed from the system.</p>
              </div>
            )}
            <div className="modal-footer">
              <button onClick={() => setConfirmModal(null)} disabled={acting} className="btn btn-ghost">Cancel</button>
              <button
                onClick={handleConfirm}
                disabled={acting || ((confirmType === 'reject' || confirmType === 'takedown') && !confirmReason.trim())}
                className={`btn ${confirmBtnClass[confirmType]}`}
              >
                {acting ? 'Processing...' : `Confirm ${confirmTitle[confirmType]}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {hostModal && (
        <div className="modal-overlay open" onClick={() => setHostModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Host Profile</h2>
              <button onClick={() => setHostModal(null)} className="modal-close">&times;</button>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
              <div style={{width:56,height:56,borderRadius:'50%',background:'var(--brand)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:900}}>
                {hostModal.host_name?.[0] || 'H'}
              </div>
              <div>
                <p style={{fontSize:16,fontWeight:800,color:'var(--dark)'}}>{hostModal.host_name || 'Unknown Host'}</p>
                <p style={{fontSize:13,color:'#6b7280'}}>{hostModal.host_email || '—'}</p>
              </div>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <p>Host ID</p>
                <p>#{hostModal.host_id}</p>
              </div>
              <div className="info-item">
                <p>Listed Property</p>
                <p>{hostModal.title}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setHostModal(null)} className="btn btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
