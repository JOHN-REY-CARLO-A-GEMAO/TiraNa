const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getHeaders() {
  const token = localStorage.getItem('admin_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, { headers: getHeaders(), ...options })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

// ── Auth ──

export async function getAdminMe() {
  return api('/admin/auth/me')
}

// ── Dashboard Stats ──

export async function getDashboardStats() {
  return api('/admin/dashboard/stats')
}

// ── Users ──

export async function getAdminUsers({ skip = 0, limit = 50, search = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (search) params.append('search', search)
  return api(`/admin/users/?${params}`)
}

export async function deleteAdminUser(userId) {
  return api(`/admin/users/${userId}`, { method: 'DELETE' })
}

// ── Listings ──

export async function getListings({ skip = 0, limit = 50, status = '', search = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.append('status', status)
  if (search) params.append('search', search)
  return api(`/admin/listings/?${params}`)
}

export async function getListingCount({ status = '', search = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (search) params.append('search', search)
  return api(`/admin/listings/count?${params}`)
}

export async function approveListing(id) {
  return api(`/admin/listings/${id}/approve`, { method: 'POST', body: JSON.stringify({}) })
}

export async function rejectListing(id, reason) {
  return api(`/admin/listings/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) })
}

export async function suspendListing(id, reason) {
  return api(`/admin/listings/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) })
}

// ── Bookings ──

export async function getBookings({ skip = 0, limit = 50, status = '', search = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.append('status', status)
  if (search) params.append('search', search)
  return api(`/admin/bookings/?${params}`)
}

export async function getBookingCount({ status = '', search = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (search) params.append('search', search)
  return api(`/admin/bookings/count?${params}`)
}

export async function cancelBooking(id, reason) {
  return api(`/admin/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) })
}

// ── Payments ──

export async function getPayments({ skip = 0, limit = 50, status = '', search = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.append('status', status)
  if (search) params.append('search', search)
  return api(`/admin/payments/?${params}`)
}

export async function getPaymentCount({ status = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  return api(`/admin/payments/count?${params}`)
}

export async function getRevenueStats() {
  return api('/admin/payments/revenue')
}

export async function refundPayment(id, amount, reason) {
  return api(`/admin/payments/${id}/refund`, {
    method: 'POST',
    body: JSON.stringify({ amount, reason }),
  })
}

// ── Reviews ──

export async function getReviews({ skip = 0, limit = 50, search = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (search) params.append('search', search)
  return api(`/admin/reviews/?${params}`)
}

export async function getReviewCount({ search = '' } = {}) {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  return api(`/admin/reviews/count?${params}`)
}

export async function hideReview(id) {
  return api(`/admin/reviews/${id}/hide`, { method: 'POST' })
}

export async function showReview(id) {
  return api(`/admin/reviews/${id}/show`, { method: 'POST' })
}

// ── Support Tickets ──

export async function getTickets({ skip = 0, limit = 50, status = '', priority = '', category = '', search = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.append('status', status)
  if (priority) params.append('priority', priority)
  if (category) params.append('category', category)
  if (search) params.append('search', search)
  return api(`/admin/support/?${params}`)
}

export async function getTicketCount({ status = '', priority = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (priority) params.append('priority', priority)
  return api(`/admin/support/count?${params}`)
}

export async function updateTicket(id, data) {
  return api(`/admin/support/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

// ── Disputes ──

export async function getDisputes({ skip = 0, limit = 50, status = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.append('status', status)
  return api(`/admin/disputes/?${params}`)
}

export async function getDisputeCount({ status = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  return api(`/admin/disputes/count?${params}`)
}

export async function updateDispute(id, data) {
  return api(`/admin/disputes/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

// ── Withdrawals ──

export async function getWithdrawals({ skip = 0, limit = 50, status = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (status) params.append('status', status)
  return api(`/admin/withdrawals/?${params}`)
}

export async function getWithdrawalCount({ status = '' } = {}) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  return api(`/admin/withdrawals/count?${params}`)
}

export async function approveWithdrawal(id) {
  return api(`/admin/withdrawals/${id}/approve`, { method: 'POST', body: JSON.stringify({}) })
}

export async function rejectWithdrawal(id, reason) {
  return api(`/admin/withdrawals/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) })
}

// ── Settings ──

export async function getSettings() {
  return api('/admin/settings/')
}

export async function updateSetting(key, value, description) {
  return api(`/admin/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value, description }),
  })
}

// ── Admin Management ──

export async function getAdmins() {
  return api('/admin/management/')
}

export async function createAdmin(username, email, password) {
  return api('/admin/management/', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  })
}

export async function updateAdmin(id, data) {
  return api(`/admin/management/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteAdmin(id) {
  return api(`/admin/management/${id}`, { method: 'DELETE' })
}

// ── Audit Log ──

export async function getAuditLogs({ skip = 0, limit = 100, action = '', admin_username = '' } = {}) {
  const params = new URLSearchParams({ skip, limit })
  if (action) params.append('action', action)
  if (admin_username) params.append('admin_username', admin_username)
  return api(`/admin/audit/?${params}`)
}
