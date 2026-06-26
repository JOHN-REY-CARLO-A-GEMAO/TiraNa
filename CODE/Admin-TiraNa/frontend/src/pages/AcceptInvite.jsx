import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { acceptInvite } from '../api/admin'

function AcceptInvite() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [form, setForm] = useState({
    email: searchParams.get('email') || '',
    code: searchParams.get('code') || '',
    password: '',
    confirmPassword: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await acceptInvite(form.email, form.code, form.password)
      setSuccess('Invitation accepted! You can now log in.')
      setTimeout(() => navigate('/signin'), 3000)
    } catch (err) {
      setError(err.message || 'Failed to accept invitation')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-dark text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Accept Invitation</h1>
          <p className="text-gray-light mt-2">Set your password to activate your admin account</p>
        </div>

        <div className="bg-dark backdrop-blur-sm rounded-2xl p-8 border border-gray-light shadow-xl">
          {error && (
            <div className="mb-5 p-3 bg-brand/10 border border-brand/30 rounded-lg text-brand text-sm text-center">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-5 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-sm text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-light mb-2">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-lighter border border-gray-light rounded-xl focus:outline-none focus:ring-2 focus:ring-brand text-dark"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-light mb-2">Invitation Code</label>
              <input
                type="text"
                placeholder="6-digit code from email"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-4 py-3 bg-gray-lighter border border-gray-light rounded-xl focus:outline-none focus:ring-2 focus:ring-brand text-dark"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-light mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 pr-12 py-3 bg-gray-lighter border border-gray-light rounded-xl focus:outline-none focus:ring-2 focus:ring-brand text-dark"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-light">
                   {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-light mb-2">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-gray-lighter border border-gray-light rounded-xl focus:outline-none focus:ring-2 focus:ring-brand text-dark"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand hover:bg-brand/80 rounded-xl font-medium transition-all disabled:opacity-50"
            >
              {loading ? 'Activating Account...' : 'Activate Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AcceptInvite
