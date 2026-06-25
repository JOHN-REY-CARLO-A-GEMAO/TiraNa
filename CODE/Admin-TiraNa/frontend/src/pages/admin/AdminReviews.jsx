import { useState, useEffect, useCallback } from 'react'
import { getReviews, hideReview, showReview } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { DataTable } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SearchInput } from '../../components/ui/SearchInput'
import { Modal } from '../../components/ui/Modal'
import { Alert } from '../../components/ui/Alert'
import { useDebounce } from '../../hooks/useDebounce'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [acting, setActing] = useState(false)
  const [detailModal, setDetailModal] = useState(null)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getReviews({ search: debouncedSearch })
      setReviews(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [debouncedSearch])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleToggleHide = async (review) => {
    setActing(true)
    try {
      if (review.is_hidden) {
        await showReview(review.id)
      } else {
        await hideReview(review.id)
      }
      fetchReviews()
      setDetailModal(null)
    } catch (err) {
      setError(err.message)
    }
    setActing(false)
  }

  const headers = [
    { label: 'Rating' },
    { label: 'Reviewer' },
    { label: 'Comment' },
    { label: 'Status' },
    { label: 'Date' },
    { label: 'Actions', className: 'text-right' },
  ]

  const renderRow = (r) => (
    <tr key={r.id} className="hover:bg-gray-light/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-1 text-brand font-black">
          <span>{r.rating}</span>
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-bold text-dark">{r.user_name || 'Anonymous'}</td>
      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate font-medium">{r.comment || '—'}</td>
      <td className="px-6 py-4">
        <StatusBadge status={r.is_hidden ? 'hidden' : 'active'} />
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
      <td className="px-6 py-4 text-right">
        <Button variant="ghost" size="sm" onClick={() => setDetailModal(r)}>View & Moderate</Button>
      </td>
    </tr>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-dark tracking-tight">Reviews Moderation</h1>
        <SearchInput
          placeholder="Search by reviewer or comment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80"
        />
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <DataTable
        headers={headers}
        data={reviews}
        loading={loading}
        emptyMessage="No reviews found matching your search."
        renderRow={renderRow}
      />

      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="Review Details"
        maxWidth="max-w-xl"
      >
        {detailModal && (
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-light">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center text-brand font-black text-xl">
                  {detailModal.user_name?.[0] || 'A'}
                </div>
                <div>
                  <p className="font-bold text-dark text-lg">{detailModal.user_name}</p>
                  <p className="text-sm text-gray-500">{new Date(detailModal.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-brand/20">
                <span className="text-brand font-black text-xl">{detailModal.rating}</span>
                <svg className="w-5 h-5 text-brand fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Review Comment</p>
              <p className="text-dark leading-relaxed italic bg-white p-4 rounded-xl border border-gray-lighter shadow-inner">
                "{detailModal.comment || 'No written comment provided.'}"
              </p>
            </div>

            <div className="p-4 rounded-xl border flex items-center justify-between transition-colors bg-white border-gray-light">
              <div>
                <p className="text-sm font-bold text-dark">Visibility Status</p>
                <p className="text-xs text-gray-500">
                  {detailModal.is_hidden ? 'This review is currently hidden from public view.' : 'This review is visible to all users.'}
                </p>
              </div>
              <StatusBadge status={detailModal.is_hidden ? 'hidden' : 'active'} />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-lighter">
              <Button variant="ghost" className="flex-1" onClick={() => setDetailModal(null)}>Close</Button>
              <Button 
                variant={detailModal.is_hidden ? 'primary' : 'danger'} 
                className="flex-1" 
                onClick={() => handleToggleHide(detailModal)}
                loading={acting}
              >
                {detailModal.is_hidden ? 'Show Review' : 'Hide Review'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
