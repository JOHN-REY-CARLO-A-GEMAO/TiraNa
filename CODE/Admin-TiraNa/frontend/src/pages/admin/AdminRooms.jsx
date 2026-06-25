import { useState, useEffect } from 'react'
import { getHostRooms, hideHostRoom, showHostRoom } from '../../api/admin'

export default function AdminRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '' })
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getHostRooms(filter)
      setRooms(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [filter])

  const handleToggleStatus = async (id, currentStatus) => {
    const action = currentStatus === 'hidden' ? 'show' : 'hide'
    if (!confirm(`Are you sure you want to ${action} this room?`)) return
    
    setActionLoading(true)
    try {
      if (action === 'show') {
        await showHostRoom(id)
      } else {
        await hideHostRoom(id)
      }
      fetchData()
    } catch (err) {
      alert(err.message)
    }
    setActionLoading(false)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rooms Management</h1>
        <div className="flex gap-4">
          <select 
            value={filter.status} 
            onChange={e => setFilter({...filter, status: e.target.value})}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {rooms.map(room => (
            <div key={room.id} className="bg-white rounded-xl shadow-sm border border-[#DDDDDD] overflow-hidden group">
              <div className="aspect-square relative overflow-hidden bg-gray-100">
                {room.photo_url ? (
                  <img src={room.photo_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={room.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Photo</div>
                )}
                <div className={`absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${room.status === 'active' ? 'bg-green-500 text-white' : room.status === 'hidden' ? 'bg-gray-500 text-white' : 'bg-yellow-500 text-white'}`}>
                  {room.status}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold truncate text-lg">{room.name}</h3>
                <p className="text-sm text-gray-500 mb-2">Hosted by <span className="font-medium text-black">{room.host_name}</span></p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="font-bold text-[#CB2957]">₱{room.price_per_night}</span>
                  <span className="text-xs text-gray-500">/ night</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggleStatus(room.id, room.status)}
                    disabled={actionLoading}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${room.status === 'hidden' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                  >
                    {room.status === 'hidden' ? 'Show Room' : 'Hide Room'}
                  </button>
                  <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
