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
    { label: 'Verified Users', value: stats.verified_users, color: 'bg-[#CB2957]', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Unverified Users', value: stats.unverified_users, color: 'bg-[#DDDDDD]', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#000000] mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-[#EEEEEE] rounded-xl shadow-sm border border-[#DDDDDD] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#DDDDDD] font-medium">{card.label}</p>
                <p className="text-3xl font-bold text-[#000000] mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#EEEEEE] rounded-xl shadow-sm border border-[#DDDDDD] p-6">
        <h2 className="text-lg font-semibold text-[#000000] mb-4">User Status Breakdown</h2>
        {stats.total_users > 0 ? (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-[#000000] mb-1">
                <span>Verified ({stats.verified_users})</span>
                <span>{Math.round((stats.verified_users / stats.total_users) * 100)}%</span>
              </div>
              <div className="w-full bg-[#DDDDDD] rounded-full h-2.5">
                <div className="bg-[#CB2957] h-2.5 rounded-full" style={{ width: `${(stats.verified_users / stats.total_users) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-[#000000] mb-1">
                <span>Unverified ({stats.unverified_users})</span>
                <span>{Math.round((stats.unverified_users / stats.total_users) * 100)}%</span>
              </div>
              <div className="w-full bg-[#DDDDDD] rounded-full h-2.5">
                <div className="bg-[#DDDDDD] h-2.5 rounded-full" style={{ width: `${(stats.unverified_users / stats.total_users) * 100}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[#DDDDDD] text-sm">No users yet.</p>
        )}
      </div>
    </div>
  )
}
