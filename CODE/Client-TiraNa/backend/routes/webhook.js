import { Router } from 'express'
import pool from '../db.js'
import axios from 'axios'

const router = Router()

const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:8000'
const ADMIN_INTERNAL_API_KEY = process.env.ADMIN_INTERNAL_API_KEY || 'tirana_secret_sync_key_2024'

router.post('/paymongo', async (req, res) => {
  try {
    const { data } = req.body
    const eventType = req.body.data.attributes.type
    const resourceData = data.attributes.data

    console.log(`Received PayMongo Webhook: ${eventType}`)

    if (eventType === 'source.chargeable') {
      const sourceId = resourceData.id
      const amount = resourceData.attributes.amount / 100
      const bookingId = resourceData.attributes.metadata.booking_id
      const paymentMethod = resourceData.attributes.type

      // 1. Update Booking Status in Client DB
      const bookingUpdate = await pool.query(
        `UPDATE bookings SET status = 'confirmed' WHERE id = $1 RETURNING *`,
        [bookingId]
      )

      if (bookingUpdate.rows.length > 0) {
        const booking = bookingUpdate.rows[0]
        
        // Fetch user details for sync
        const userResult = await pool.query(
          `SELECT u.email, p.full_name 
           FROM client_users u 
           LEFT JOIN personal_information p ON p.user_id = u.id 
           WHERE u.id = $1`,
          [booking.user_id]
        )
        const user = userResult.rows[0]

        // 2. Sync to Admin Backend
        try {
          await axios.post(
            `${ADMIN_API_URL}/api/admin/internal/payment-confirmed`,
            {
              booking_external_id: String(bookingId),
              payment_id: sourceId,
              amount: amount,
              currency: 'PHP',
              payment_method: paymentMethod,
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
          console.log(`Synced payment ${sourceId} to Admin for booking ${bookingId}`)
        } catch (adminErr) {
          console.error('Failed to sync to Admin:', adminErr.response?.data || adminErr.message)
        }
      }
    } else if (eventType === 'checkout_session.payment.paid') {
        const session = resourceData // For checkout sessions, data is directly the session or payment
        const bookingId = resourceData.attributes.metadata.booking_id
        const payments = resourceData.attributes.payments
        const latestPayment = payments && payments.length > 0 ? payments[0] : null
        
        const sourceId = latestPayment ? latestPayment.id : resourceData.id
        const amount = resourceData.attributes.amount / 100
        
        // 1. Update Booking Status in Client DB
        const bookingUpdate = await pool.query(
          `UPDATE bookings SET status = 'confirmed' WHERE id = $1 RETURNING *`,
          [bookingId]
        )
  
        if (bookingUpdate.rows.length > 0) {
          const booking = bookingUpdate.rows[0]
          
          // Fetch user details for sync
          const userResult = await pool.query(
            `SELECT u.email, p.full_name 
             FROM client_users u 
             LEFT JOIN personal_information p ON p.user_id = u.id 
             WHERE u.id = $1`,
            [booking.user_id]
          )
          const user = userResult.rows[0]
  
          // 2. Sync to Admin Backend
          try {
            await axios.post(
              `${ADMIN_API_URL}/api/admin/internal/payment-confirmed`,
              {
                booking_external_id: String(bookingId),
                payment_id: sourceId,
                amount: amount,
                currency: 'PHP',
                payment_method: latestPayment?.source?.type || 'online',
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
          } catch (adminErr) {
            console.error('Failed to sync to Admin:', adminErr.response?.data || adminErr.message)
          }
        }
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
