import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

function SignIn() {
  const { login, verifyOtp, isAuthenticated } = useAdminAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [requiresOtp, setRequiresOtp] = useState(false)
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [tempToken, setTempToken] = useState('')
  const [otpEmail, setOtpEmail] = useState('')

  useEffect(() => {
    if (isAuthenticated) navigate('/admin', { replace: true })
  }, [isAuthenticated, navigate])

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await login(form.username, form.password)
      if (data.requires_otp) {
        setRequiresOtp(true)
        setTempToken(data.temp_token)
        setOtpEmail(data.admin?.email || form.username)
      }
    } catch (err) {
      setError(err.message || 'Sign in failed')
    }
    setLoading(false)
  }

  const handleOtpCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...otpCode]
    newCode[index] = value.slice(-1)
    setOtpCode(newCode)
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = pasted.split('').concat(Array(6 - pasted.length).fill(''))
    setOtpCode(newCode)
    const lastIndex = Math.min(pasted.length, 5)
    const lastInput = document.getElementById(`otp-${lastIndex}`)
    if (lastInput) lastInput.focus()
  }

  const handleOtpSubmit = async () => {
    setOtpError('')
    setOtpLoading(true)
    const code = otpCode.join('')

    if (code.length !== 6) {
      setOtpError('Please enter all 6 digits')
      setOtpLoading(false)
      return
    }

    try {
      const data = await verifyOtp(otpEmail, code, tempToken)
      if (data.admin?.password_changed === false) {
        navigate('/admin/change-password')
      } else {
        navigate('/admin')
      }
    } catch (err) {
      setOtpError(err.message || 'OTP verification failed')
    }
    setOtpLoading(false)
  }

  const backToLogin = () => {
    setRequiresOtp(false)
    setOtpCode(['', '', '', '', '', ''])
    setOtpError('')
    setTempToken('')
    setOtpEmail('')
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#CB2957] mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Admin Login</h1>
          <p className="text-[#DDDDDD] mt-2">
            {requiresOtp ? 'Enter the 6-digit code sent to your email' : 'Sign in to the admin panel'}
          </p>
        </div>

        <div className="bg-[#000000] backdrop-blur-sm rounded-2xl p-8 border border-[#DDDDDD] shadow-xl">
          {error && (
            <div className="mb-5 p-3 bg-[#CB2957]/10 border border-[#CB2957]/30 rounded-lg text-[#CB2957] text-sm text-center">
              {error}
            </div>
          )}

          {!requiresOtp ? (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">Username / Email</label>
                <input
                  type="text"
                  placeholder="Enter admin username or email"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-3 bg-[#EEEEEE] border border-[#DDDDDD] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CB2957] focus:border-transparent placeholder-[#DDDDDD] text-[#000000] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 pr-12 py-3 bg-[#EEEEEE] border border-[#DDDDDD] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CB2957] focus:border-transparent placeholder-[#DDDDDD] text-[#000000] transition-all"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#DDDDDD] hover:text-[#000000]">
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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#CB2957] hover:bg-[#CB2957]/80 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              {otpError && (
                <div className="p-3 bg-[#CB2957]/10 border border-[#CB2957]/30 rounded-lg text-[#CB2957] text-sm text-center">
                  {otpError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#DDDDDD] mb-2">OTP Code</label>
                <div className="flex justify-center gap-3">
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-12 h-14 text-center text-xl font-bold bg-[#EEEEEE] border border-[#DDDDDD] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CB2957] focus:border-transparent text-[#000000] transition-all"
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleOtpSubmit}
                disabled={otpLoading}
                className="w-full py-3 bg-[#CB2957] hover:bg-[#CB2957]/80 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {otpLoading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={backToLogin}
                className="w-full text-sm text-[#DDDDDD] hover:text-white transition-colors"
              >
                Back to login
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-[#DDDDDD] text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#CB2957] hover:text-[#CB2957]/80 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignIn
