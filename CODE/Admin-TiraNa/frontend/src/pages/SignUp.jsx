import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminRegister, adminRegisterVerify } from '../api/admin'

function SignUp() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState(['', '', '', '', '', ''])
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const data = await adminRegister(form.username, form.email, form.password)
      setVerifyEmail(form.email)
      setShowModal(true)
      setForm({ username: '', email: '', password: '', confirmPassword: '' })
    } catch (err) {
      setError(err.message || 'Registration failed')
    }
    setLoading(false)
  }

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...verifyCode]
    newCode[index] = value.slice(-1)
    setVerifyCode(newCode)
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verifyCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = pasted.split('').concat(Array(6 - pasted.length).fill(''))
    setVerifyCode(newCode)
    const lastIndex = Math.min(pasted.length, 5)
    const lastInput = document.getElementById(`code-${lastIndex}`)
    if (lastInput) lastInput.focus()
  }

  const handleVerify = async () => {
    setVerifyError('')
    setVerifyLoading(true)
    const code = verifyCode.join('')

    if (code.length !== 6) {
      setVerifyError('Please enter all 6 digits')
      setVerifyLoading(false)
      return
    }

    try {
      await adminRegisterVerify(verifyEmail, code)
      setShowModal(false)
      setVerifyCode(['', '', '', '', '', ''])
      setSuccess(true)
      setTimeout(() => {
        navigate('/signin')
      }, 2000)
    } catch (err) {
      setVerifyError(err.message || 'Verification failed')
    }
    setVerifyLoading(false)
  }

  const closeModal = () => {
    setShowModal(false)
    setVerifyCode(['', '', '', '', '', ''])
    setVerifyError('')
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
          <h1 className="text-3xl font-bold">Create Admin Account</h1>
          <p className="text-gray-light mt-2">Register as a TiraNa admin</p>
        </div>

        <div className="bg-dark backdrop-blur-sm rounded-2xl p-8 border border-gray-light shadow-xl">
          {success ? (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-center">
              Account verified successfully! Redirecting to sign in...
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-5">
              {error && (
                <div className="p-3 bg-brand/10 border border-brand/30 rounded-lg text-brand text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-light mb-2">Username</label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-lighter border border-gray-light rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-gray-light text-dark transition-all"
                  required
                  minLength={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-light mb-2">Email</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-lighter border border-gray-light rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-gray-light text-dark transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-light mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 pr-12 py-3 bg-gray-lighter border border-gray-light rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-gray-light text-dark transition-all"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-light hover:text-dark">
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-light mb-2">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-lighter border border-gray-light rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-gray-light text-dark transition-all"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand hover:bg-brand/80 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <p className="text-gray-light text-sm">
                Already have an account?{' '}
                <Link to="/signin" className="text-brand hover:text-brand/80 font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-dark rounded-2xl p-8 w-full max-w-md border border-gray-light shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand/20 mb-4">
                <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Verify Your Email</h2>
              <p className="text-gray-light text-sm mt-2">We sent a 6-digit code to</p>
              <p className="text-white font-medium mt-1">{verifyEmail}</p>
            </div>

            {verifyError && (
              <div className="mb-4 p-3 bg-brand/10 border border-brand/30 rounded-lg text-brand text-sm text-center">
                {verifyError}
              </div>
            )}

            <div className="flex justify-center gap-3 mb-6">
              {verifyCode.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-xl font-bold bg-gray-lighter border border-gray-light rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-dark transition-all"
                />
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={verifyLoading}
                className="flex-1 py-3 bg-brand hover:bg-brand/80 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifyLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Didn't receive the code? Check your spam folder.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SignUp
