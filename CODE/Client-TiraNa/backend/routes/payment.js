import { Router } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../db.js'
import { createCheckoutSession } from '../services/paymongo.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

router.post('/create-checkout', authMiddleware, async (req, res) => {
  try {
    const { booking_id } = req.body

    if (!booking_id) {
      return res.status(400).json({ error: 'Booking ID is required' })
    }

    const result = await pool.query(
      `SELECT b.*, p.title 
       FROM bookings b 
       JOIN properties p ON b.property_id = p.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [booking_id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const booking = result.rows[0]
    
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    const redirectUrls = {
      success: `${clientUrl}/payment/success?booking_id=${booking_id}`,
      failed: `${clientUrl}/payment/failed?booking_id=${booking_id}`
    }

    const session = await createCheckoutSession(
      booking.total_price,
      booking.id,
      `Payment for ${booking.title}`,
      redirectUrls
    )

    res.json({
      checkout_url: session.attributes.checkout_url
    })

  } catch (err) {
    console.error('Create checkout error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
