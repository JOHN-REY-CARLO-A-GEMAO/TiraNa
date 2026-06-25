import { useState, useEffect } from 'react'
import { getDashboardStats } from '../../api/admin'

export default function DashboardHome() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#CB2957] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-[#CB2957]/10 border border-[#CB2957]/30 rounded-lg text-[#CB2957]">
        {error}
      </div>
    )
  }

  const cards = [
    { label: 'Total Users', value: stats.total_users, color: 'bg-[#CB2957]', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197' },
    { label: 'Active Listings', value: stats.active_listings, color: 'bg-blue-500', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label: 'Total Bookings', value: stats.total_bookings, color: 'bg-green-500', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Monthly Revenue', value: `₱${stats.revenue_this_month}`, color: 'bg-purple-500', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Pending Payouts', value: stats.pending_withdrawals, color: 'bg-orange-500', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'Support Tickets', value: stats.open_support_tickets, color: 'bg-red-500', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#000000]">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-[#DDDDDD] p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{card.label}</p>
                <p className="text-3xl font-bold text-[#000000] mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center shadow-lg shadow-gray-200`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-[#DDDDDD] p-6">
            <h2 className="text-lg font-semibold text-[#000000] mb-4">User Status Breakdown</h2>
            {stats.total_users > 0 ? (
            <div className="space-y-6">
                <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span className="font-medium">Verified Users ({stats.verified_users})</span>
                    <span className="font-bold">{Math.round((stats.verified_users / stats.total_users) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full shadow-sm" style={{ width: `${(stats.verified_users / stats.total_users) * 100}%` }} />
                </div>
                </div>
                <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span className="font-medium">Unverified Users ({stats.unverified_users})</span>
                    <span className="font-bold">{Math.round((stats.unverified_users / stats.total_users) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-[#CB2957] h-3 rounded-full shadow-sm" style={{ width: `${(stats.unverified_users / stats.total_users) * 100}%` }} />
                </div>
                </div>
            </div>
            ) : (
            <p className="text-gray-400 text-sm">No users yet.</p>
            )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#DDDDDD] p-6">
            <h2 className="text-lg font-semibold text-[#000000] mb-4">System Alerts</h2>
            <div className="space-y-4">
                {stats.open_support_tickets > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-sm font-medium">{stats.open_support_tickets} Unresolved Support Tickets</span>
                    </div>
                )}
                {stats.pending_withdrawals > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-orange-50 text-orange-700 rounded-lg border border-orange-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-sm font-medium">{stats.pending_withdrawals} Pending Payout Requests</span>
                    </div>
                )}
                {stats.open_support_tickets === 0 && stats.pending_withdrawals === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-sm">No critical alerts</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
