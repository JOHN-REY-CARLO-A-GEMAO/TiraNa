import { useState, useEffect, useCallback } from 'react'
import { getHostRooms, hideHostRoom, showHostRoom } from '../../api/admin'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Select } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import { Card } from '../../components/ui/Card'
import { Alert } from '../../components/ui/Alert'

export default function AdminRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState({ status: '' })
  const [actionLoading, setActionLoading] = useState(false)
  const [detailRoom, setDetailRoom] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getHostRooms(filter)
      setRooms(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [filter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleToggleStatus = async (room) => {
    const action = room.status === 'hidden' ? 'show' : 'hide'
    setActionLoading(true)
    try {
      if (action === 'show') {
        await showHostRoom(room.id)
      } else {
        await hideHostRoom(room.id)
      }
      fetchData()
    } catch (err) {
      setError(err.message)
    }
    setActionLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-dark tracking-tight">Rooms & Properties</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <Select 
            value={filter.status} 
            onChange={e => setFilter({...filter, status: e.target.value})}
            placeholder="All Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'hidden', label: 'Hidden' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-light text-gray-400">
           <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="font-medium">No rooms found matching your selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {rooms.map(room => (
            <Card key={room.id} className="p-0 flex flex-col group overflow-hidden">
              <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                {room.photo_url ? (
                  <img src={room.photo_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={room.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <StatusBadge status={room.status} />
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="font-bold text-dark truncate text-lg group-hover:text-brand transition-colors" title={room.name}>{room.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="text-xs text-gray-500 font-medium">Host: <span className="text-dark">{room.host_name}</span></span>
                  </div>
                </div>
                
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-2xl font-black text-brand">₱{Number(room.price_per_night).toLocaleString()}</span>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">/ night</span>
                </div>

                <div className="mt-auto flex gap-2">
                  <Button 
                    variant={room.status === 'hidden' ? 'primary' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleToggleStatus(room)}
                    loading={actionLoading}
                  >
                    {room.status === 'hidden' ? 'Show' : 'Hide'}
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="px-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
