import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats } from '../../api/admin'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { Alert } from '../../components/ui/Alert'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'

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
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return <Alert type="error">{error}</Alert>
  }

  const statCards = [
    { label: 'Total Users', value: stats.total_users, color: 'bg-brand', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197' },
    { label: 'Active Listings', value: stats.active_listings, color: 'bg-blue-500', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label: 'Total Bookings', value: stats.total_bookings, color: 'bg-green-500', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Monthly Revenue', value: `₱${Number(stats.revenue_this_month).toLocaleString()}`, color: 'bg-purple-500', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]

  const verifiedPercentage = stats.total_users > 0 ? Math.round((stats.verified_users / stats.total_users) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-dark tracking-tight">System Overview</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Platform performance and health metrics.</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Last Updated</p>
          <p className="text-sm font-bold text-dark">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <Card key={card.label} className="border-none shadow-lg shadow-gray-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
                <p className="text-2xl font-black text-dark">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200 text-white`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={card.icon} />
                </svg>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Breakdown Chart (CSS Only) */}
        <Card title="User Verification Status" subtitle="Breakdown of account trust" className="lg:col-span-1">
          <div className="flex flex-col items-center justify-center h-64">
             {/* Simple CSS-only Donut Chart */}
             <div className="relative w-48 h-48 rounded-full flex items-center justify-center" style={{
               background: `conic-gradient(#CB2957 ${100 - verifiedPercentage}%, #10B981 0%)`
             }}>
                <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                   <p className="text-3xl font-black text-dark">{verifiedPercentage}%</p>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verified</p>
                </div>
             </div>
             <div className="flex gap-6 mt-8">
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-green-500" />
                   <span className="text-xs font-bold text-dark">Verified ({stats.verified_users})</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-brand" />
                   <span className="text-xs font-bold text-dark">Pending ({stats.unverified_users})</span>
                </div>
             </div>
          </div>
        </Card>

        {/* System Alerts & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Critical Alerts" subtitle="Actions requiring attention">
            <div className="space-y-4">
                {stats.open_support_tickets > 0 && (
                    <div className="flex items-center justify-between p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          </div>
                          <div>
                            <p className="font-bold">{stats.open_support_tickets} Unresolved Tickets</p>
                            <p className="text-xs opacity-70">Support requests awaiting response</p>
                          </div>
                        </div>
                        <Link to="/admin/support">
                          <Button size="sm" variant="danger">View Tickets</Button>
                        </Link>
                    </div>
                )}
                {stats.pending_withdrawals > 0 && (
                    <div className="flex items-center justify-between p-4 bg-orange-50 text-orange-700 rounded-2xl border border-orange-100 group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <div>
                            <p className="font-bold">{stats.pending_withdrawals} Payout Requests</p>
                            <p className="text-xs opacity-70">Host withdrawals pending approval</p>
                          </div>
                        </div>
                        <Link to="/admin/withdrawals">
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white border-none">Review Payouts</Button>
                        </Link>
                    </div>
                )}
                {stats.open_support_tickets === 0 && stats.pending_withdrawals === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-light">
                        <svg className="w-10 h-10 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-xs font-bold uppercase tracking-widest">Everything is under control</p>
                    </div>
                )}
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <Card className="hover:border-brand/30 transition-all group">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Host Verification</p>
                <div className="flex items-end justify-between">
                   <h4 className="text-xl font-bold text-dark group-hover:text-brand">Pending Review</h4>
                   <Link to="/admin/verifications">
                     <Button size="sm" variant="ghost">Moderate →</Button>
                   </Link>
                </div>
             </Card>
             <Card className="hover:border-brand/30 transition-all group">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Listings Approval</p>
                <div className="flex items-end justify-between">
                   <h4 className="text-xl font-bold text-dark group-hover:text-brand">New Properties</h4>
                   <Link to="/admin/listings">
                     <Button size="sm" variant="ghost">Review →</Button>
                   </Link>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
