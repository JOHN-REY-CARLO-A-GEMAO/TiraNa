import { Router } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

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

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { booking_id, rating, review_text } = req.body

    if (!booking_id || !rating) {
      return res.status(400).json({ error: 'Booking ID and rating are required' })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }

    const booking = await pool.query(
      `SELECT id, property_id, check_out AT TIME ZONE 'Asia/Manila' AS check_out_ph, user_id, status FROM bookings WHERE id = $1`,
      [booking_id]
    )

    if (booking.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const b = booking.rows[0]

    if (b.user_id !== req.user.id) {
      return res.status(403).json({ error: 'This booking does not belong to you' })
    }

    const checkOut = new Date(b.check_out_ph)
    if (checkOut >= new Date() && b.status !== 'completed') {
      return res.status(400).json({ error: 'You can only review after the booking is completed' })
    }

    const existing = await pool.query(
      `SELECT id FROM reviews WHERE booking_id = $1`,
      [booking_id]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this booking' })
    }

    const result = await pool.query(
      `INSERT INTO reviews (booking_id, user_id, property_id, rating, review_text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [booking_id, req.user.id, b.property_id, rating, review_text || '']
    )

    res.status(201).json({
      message: 'Review submitted successfully',
      data: result.rows[0],
    })
  } catch (err) {
    console.error('Review create error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/property/:propertyId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.rating, r.review_text, r.created_at,
              COALESCE(p.first_name, '') as first_name,
              COALESCE(p.last_name, '') as last_name,
              COALESCE(p.avatar_url, '') as avatar_url
       FROM reviews r
       LEFT JOIN personal_information p ON p.user_id = r.user_id
       WHERE r.property_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.propertyId]
    )

    const reviews = result.rows.map(row => ({
      id: row.id,
      rating: row.rating,
      text: row.review_text,
      date: row.created_at,
      name: [row.first_name, row.last_name].filter(Boolean).join(' ') || 'Anonymous',
      avatar: row.avatar_url,
    }))

    res.json({ data: reviews })
  } catch (err) {
    console.error('Fetch reviews error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.booking_id, r.property_id, r.rating, r.review_text, r.created_at
       FROM reviews r
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    )
    res.json({ data: result.rows })
  } catch (err) {
    console.error('Fetch my reviews error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/check/:bookingId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id FROM reviews WHERE booking_id = $1 AND user_id = $2`,
      [req.params.bookingId, req.user.id]
    )
    res.json({ exists: result.rows.length > 0 })
  } catch (err) {
    console.error('Check review error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
