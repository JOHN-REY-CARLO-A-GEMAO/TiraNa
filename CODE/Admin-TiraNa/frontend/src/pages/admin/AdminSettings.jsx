import { useState, useEffect, useCallback } from 'react'
import { getSettings, updateSetting } from '../../api/admin'

const SETTING_CONFIG = {
  platform_name: {
    label: 'Platform Name',
    section: 'general',
    type: 'text',
    placeholder: 'TiraNa',
  },
  support_email: {
    label: 'Support Email',
    section: 'general',
    type: 'email',
    placeholder: 'support@example.com',
  },
  commission_percentage: {
    label: 'Commission Percentage',
    section: 'financial',
    type: 'number',
    min: 0,
    max: 100,
    suffix: '%',
    placeholder: '10',
  },
  min_payout_amount: {
    label: 'Minimum Payout',
    section: 'financial',
    type: 'number',
    min: 0,
    suffix: 'PHP',
    placeholder: '500',
  },
  max_refund_days: {
    label: 'Max Refund Days',
    section: 'financial',
    type: 'number',
    min: 1,
    max: 365,
    suffix: 'days',
    placeholder: '30',
  },
  paymongo_secret_key: {
    label: 'Secret Key',
    section: 'paymongo',
    type: 'password',
    placeholder: 'sk_test_...',
  },
  paymongo_public_key: {
    label: 'Public Key',
    section: 'paymongo',
    type: 'password',
    placeholder: 'pk_test_...',
  },
  paymongo_webhook_secret: {
    label: 'Webhook Secret',
    section: 'paymongo',
    type: 'password',
    placeholder: 'whsec_...',
  },
}

const SECTIONS = [
  { id: 'general', label: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'financial', label: 'Financial', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'paymongo', label: 'PayMongo', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
]

export default function AdminSettings() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editKey, setEditKey] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [showSecrets, setShowSecrets] = useState({})
  const [validationError, setValidationError] = useState('')

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try { setSettings(await getSettings()) }
    catch (err) { setError(err.message) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const validate = (key, value) => {
    const config = SETTING_CONFIG[key]
    if (!config) return ''

    if (config.type === 'number') {
      const num = parseFloat(value)
      if (isNaN(num)) return 'Must be a valid number'
      if (config.min !== undefined && num < config.min) return `Minimum value is ${config.min}`
      if (config.max !== undefined && num > config.max) return `Maximum value is ${config.max}`
    }

    if (config.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) return 'Must be a valid email address'
    }

    return ''
  }

  const handleSave = async () => {
    if (!editKey) return

    const valErr = validate(editKey, editValue)
    if (valErr) {
      setValidationError(valErr)
      return
    }

    setSaving(true)
    setValidationError('')
    try {
      const setting = settings.find((s) => s.key === editKey)
      await updateSetting(editKey, editValue, setting?.description)
      setEditKey(null)
      setSuccess('Setting saved successfully')
      setTimeout(() => setSuccess(''), 3000)
      fetchSettings()
    } catch (err) { setError(err.message) }
    setSaving(false)
  }

  const toggleSecret = (key) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const getDisplayValue = (setting) => {
    const config = SETTING_CONFIG[setting.key]
    if (config?.type === 'password' && !showSecrets[setting.key]) {
      return setting.value ? '••••••••' : '—'
    }
    if (setting.value && config?.suffix) {
      return `${setting.value} ${config.suffix}`
    }
    return setting.value || '—'
  }

  const groupedSettings = SECTIONS.map((section) => ({
    ...section,
    settings: settings.filter((s) => SETTING_CONFIG[s.key]?.section === section.id),
  })).filter((section) => section.settings.length > 0)

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">System Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage platform configuration and integrations</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-brand/10 border border-brand/30 rounded-lg text-brand text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {groupedSettings.map((section) => (
            <div key={section.id} className="bg-gray-lighter rounded-xl shadow-sm border border-gray-light overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-light bg-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                    </svg>
                  </div>
                  <h2 className="text-sm font-bold text-dark uppercase tracking-wider">{section.label}</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-light">
                {section.settings.map((s) => {
                  const config = SETTING_CONFIG[s.key] || {}
                  const isEditing = editKey === s.key
                  const isPassword = config.type === 'password'

                  return (
                    <div key={s.key} className={`px-6 py-4 transition-colors ${isEditing ? 'bg-white' : 'hover:bg-gray-200/50'}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark">{config.label || s.key}</p>
                          {s.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="relative">
                              <input
                                type={isPassword && !showSecrets[s.key] ? 'password' : 'text'}
                                value={editValue}
                                onChange={(e) => {
                                  setEditValue(e.target.value)
                                  setValidationError('')
                                }}
                                min={config.min}
                                max={config.max}
                                placeholder={config.placeholder}
                                className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand w-64 ${validationError ? 'border-brand' : 'border-gray-light'}`}
                              />
                              {isPassword && (
                                <button
                                  type="button"
                                  onClick={() => toggleSecret(s.key)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-dark"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {showSecrets[s.key] ? (
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    ) : (
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    )}
                                  </svg>
                                </button>
                              )}
                            </div>
                            {validationError && isEditing && (
                              <p className="absolute mt-1 text-xs text-brand">{validationError}</p>
                            )}
                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className="px-4 py-2 bg-brand hover:bg-brand/80 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => { setEditKey(null); setValidationError('') }}
                              className="px-4 py-2 bg-gray-light hover:bg-gray-light/80 text-dark text-sm font-medium rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`text-sm font-mono px-3 py-1.5 rounded-lg ${s.value ? 'bg-gray-light text-dark' : 'text-gray-400 italic'}`}>
                              {getDisplayValue(s)}
                            </span>
                            {isPassword && s.value && (
                              <button
                                onClick={() => toggleSecret(s.key)}
                                className="p-1.5 text-gray-500 hover:text-dark hover:bg-gray-light rounded-lg transition-colors"
                                title={showSecrets[s.key] ? 'Hide' : 'Show'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {showSecrets[s.key] ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  )}
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => { setEditKey(s.key); setEditValue(s.value || ''); setValidationError('') }}
                              className="px-3 py-1.5 text-sm text-brand hover:text-brand/80 hover:bg-brand/10 font-medium rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
