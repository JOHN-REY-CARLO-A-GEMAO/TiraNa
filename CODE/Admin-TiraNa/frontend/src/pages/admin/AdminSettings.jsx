import { useState, useEffect, useCallback } from 'react'
import { getSettings, updateSetting } from '../../api/admin'

export default function AdminSettings() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editKey, setEditKey] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try { setSettings(await getSettings()) }
    catch (err) { setError(err.message) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    if (!editKey) return
    setSaving(true)
    try {
      const setting = settings.find((s) => s.key === editKey)
      await updateSetting(editKey, editValue, setting?.description)
      setEditKey(null)
      fetchSettings()
    } catch (err) { setError(err.message) }
    setSaving(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#000000] mb-6">System Settings</h1>

      {error && <div className="mb-4 p-3 bg-[#CB2957]/10 border border-[#CB2957]/30 rounded-lg text-[#CB2957] text-sm">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-[#CB2957] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-[#EEEEEE] rounded-xl shadow-sm border border-[#DDDDDD] divide-y divide-[#DDDDDD]">
          {settings.map((s) => (
            <div key={s.key} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#000000]">{s.key}</p>
                  {s.description && <p className="text-xs text-[#DDDDDD] mt-0.5">{s.description}</p>}
                </div>
                {editKey === s.key ? (
                  <div className="flex items-center gap-2 ml-4">
                    <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="px-3 py-1 border border-[#DDDDDD] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#CB2957] w-64" />
                    <button onClick={handleSave} disabled={saving} className="px-3 py-1 bg-[#CB2957] hover:bg-[#CB2957]/80 text-white text-sm rounded-lg transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => setEditKey(null)} className="px-3 py-1 bg-[#DDDDDD] hover:bg-[#DDDDDD]/80 text-[#000000] text-sm rounded-lg transition-colors">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm text-[#000000] font-mono bg-[#DDDDDD] px-2 py-1 rounded">{s.value || '—'}</span>
                    <button onClick={() => { setEditKey(s.key); setEditValue(s.value || '') }} className="px-3 py-1 text-sm text-[#CB2957] hover:text-[#CB2957]/80 font-medium transition-colors">Edit</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
