import { useState, useEffect, useCallback } from 'react'
import { getReviews, hideReview, showReview } from '../../api/admin'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try { setReviews(await getReviews({ search })) }
    catch (err) { setError(err.message) }
    setLoading(false)
  }, [search])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const toggleVisibility = async (review) => {
    try {
      if (review.is_hidden) await showReview(review.id)
      else await hideReview(review.id)
      fetchReviews()
    } catch (err) { setError(err.message) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reviews</h1>
        <input type="text" placeholder="Search reviews..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500"><p className="text-sm">No reviews found.</p></div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reviews.map((r) => (
              <div key={r.id} className={`p-4 ${r.is_hidden ? 'bg-red-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{r.guest_name || 'Anonymous'}</span>
                      <span className="text-yellow-500 text-sm">{'★'.repeat(r.rating || 0)}{'☆'.repeat(5 - (r.rating || 0))}</span>
                      {r.is_hidden && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">Hidden</span>}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{r.listing_title || 'Unknown listing'}</p>
                    <p className="text-sm text-gray-700">{r.comment || 'No comment'}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => toggleVisibility(r)} className={`ml-4 px-3 py-1 text-xs rounded-lg font-medium transition-colors ${r.is_hidden ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                    {r.is_hidden ? 'Show' : 'Hide'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
