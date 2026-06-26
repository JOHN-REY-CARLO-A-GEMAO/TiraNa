import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword } from '../../api/admin'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminChangePassword() {
  const navigate = useNavigate()
  const { logout } = useAdminAuth()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (form.newPassword !== form.confirmPassword) {
      return setError('New passwords do not match')
    }
    
    if (form.newPassword.length < 6) {
      return setError('Password must be at least 6 characters')
    }

    setLoading(true)
    try {
      await changePassword(form.currentPassword, form.newPassword)
      setSuccess(true)
      setTimeout(() => {
        logout()
        navigate('/signin')
      }, 2000)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-lighter flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-light">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-dark">Change Password</h1>
          <p className="text-gray-600 mt-2">Update your password to secure your account</p>
        </div>

        {success ? (
          <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-green-700 text-center">
            Password changed successfully! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-brand/10 border border-brand/30 rounded-lg text-brand text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Current Password</label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                className="w-full px-4 py-3 bg-gray-lighter border border-gray-light rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">New Password</label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                className="w-full px-4 py-3 bg-gray-lighter border border-gray-light rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-gray-lighter border border-gray-light rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand text-white hover:bg-brand/90 rounded-xl font-medium transition-all disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
