import { Router } from 'express'
import pool from '../db.js'
import axios from 'axios'
import crypto from 'crypto'

const router = Router()

const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:8000'
const ADMIN_INTERNAL_API_KEY = process.env.ADMIN_INTERNAL_API_KEY || 'tirana_secret_sync_key_2024'
const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET

router.post('/paymongo', async (req, res) => {
  try {
    // 1. Webhook Signature Verification
    const signature = req.headers['paymongo-signature']
    if (!signature || !PAYMONGO_WEBHOOK_SECRET) {
      console.error('Missing signature or webhook secret')
      return res.status(400).json({ error: 'Invalid request' })
    }

    const [tPart, v1Part] = signature.split(',')
    const timestamp = tPart?.split('=')[1]
    const paymongoSignature = v1Part?.split('=')[1]

    if (!timestamp || !paymongoSignature) {
      console.error('Malformed signature header')
      return res.status(400).json({ error: 'Invalid signature header' })
    }

    const payload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body)

    const baseString = `${timestamp}.${payload}`
    const expectedSignature = crypto
      .createHmac('sha256', PAYMONGO_WEBHOOK_SECRET)
      .update(baseString)
      .digest('hex')

    const sigBuffer = Buffer.from(paymongoSignature)
    const expectedBuffer = Buffer.from(expectedSignature)

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      console.error('Invalid PayMongo signature')
      return res.status(400).json({ error: 'Invalid signature' })
    }

    const { data } = req.body
    const eventType = data.attributes.type
    const resourceData = data.attributes.data

    console.log(`Received PayMongo Webhook: ${eventType}`)

    // Only handle checkout_session.payment.paid (source.chargeable is legacy)
    if (eventType === 'checkout_session.payment.paid') {
      const bookingId = resourceData.attributes.metadata.booking_id
      const payments = resourceData.attributes.payments
      const latestPayment = payments && payments.length > 0 ? payments[0] : null

      // Normalize to payment ID
      const paymentId = latestPayment ? latestPayment.id : resourceData.id
      const amount = resourceData.attributes.amount / 100

      // 2. Idempotency check: Get booking and skip if already confirmed
      const bookingCheck = await pool.query(
        `SELECT status, user_id FROM bookings WHERE id = $1`,
        [bookingId]
      )

      if (bookingCheck.rows.length === 0) {
        console.warn(`Booking ${bookingId} not found`)
        return res.json({ received: true })
      }

      const currentBooking = bookingCheck.rows[0]
      if (currentBooking.status === 'confirmed') {
        console.log(`Booking ${bookingId} is already confirmed. Skipping sync.`)
        return res.json({ received: true })
      }
        
      // 3. Update Booking Status in Client DB
      await pool.query(
        `UPDATE bookings SET status = 'confirmed' WHERE id = $1`,
        [bookingId]
      )

      // Fetch user details for sync
      const userResult = await pool.query(
        `SELECT u.email, p.full_name
          FROM client_users u
          LEFT JOIN personal_information p ON p.user_id = u.id
          WHERE u.id = $1`,
        [currentBooking.user_id]
      )
      const user = userResult.rows[0]

      // 4. Sync to Admin Backend
      try {
        await axios.post(
          `${ADMIN_API_URL}/api/admin/internal/payment-confirmed`,
          {
            booking_external_id: String(bookingId),
            payment_id: paymentId,
            amount: amount,
            currency: 'PHP',
            payment_method: latestPayment?.attributes?.source?.type || 'online',
            payer_name: user?.full_name || 'Guest',
            payer_email: user?.email || 'guest@example.com',
            status: 'paid'
          },
          {
            headers: {
              'X-Internal-API-Key': ADMIN_INTERNAL_API_KEY
            }
          }
        )
        console.log(`Synced payment ${paymentId} to Admin for booking ${bookingId}`)
      } catch (adminErr) {
        console.error('Failed to sync to Admin:', adminErr.response?.data || adminErr.message)
      }
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
