import { Router } from 'express'
import pool from '../db.js'
import internalAuth from '../middleware/internalAuth.js'

const router = Router()

router.get('/stats/summary', internalAuth, async (req, res) => {
  try {
    const bookingResult = await pool.query(
      `SELECT COUNT(*) AS total_bookings, COALESCE(SUM(total_price), 0) AS total_revenue
       FROM bookings
       WHERE status NOT IN ('cancelled', 'declined')`
    )

    const { total_bookings, total_revenue } = bookingResult.rows[0]

    res.json({
      data: {
        total_bookings: parseInt(total_bookings, 10),
        total_revenue: parseFloat(total_revenue),
      },
    })
  } catch (err) {
    console.error('Stats summary error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const ratingResult = await pool.query(
      `SELECT
         COALESCE(AVG(rating)::numeric(3,1), 0) AS average_rating,
         COUNT(*) AS total_reviews
       FROM reviews`
    )

    const bookingResult = await pool.query(
      `SELECT COUNT(*) AS total_completed
       FROM bookings
       WHERE status = 'completed'`
    )

    const { average_rating, total_reviews } = ratingResult.rows[0]
    const { total_completed } = bookingResult.rows[0]

    res.json({
      data: {
        average_rating: parseFloat(average_rating),
        total_reviews: parseInt(total_reviews, 10),
        total_completed_bookings: parseInt(total_completed, 10),
      },
    })
  } catch (err) {
    console.error('Stats error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
