/**
 * Script to fix payment transaction statuses for confirmed bookings
 * Online payments that have confirmed bookings should have status = 'completed'
 */

import pool from '../db.js';

async function fixPaymentStatuses() {
  try {
    // Get all confirmed bookings with online payment
    const confirmedBookings = await pool.query(`
      SELECT b.id, b.payment_method, pt.id as payment_id, pt.status as payment_status
      FROM bookings b
      JOIN payment_transactions pt ON pt.booking_id = b.id
      WHERE b.status = 'confirmed'
        AND b.payment_method = 'online'
        AND pt.status = 'pending'
    `);

    console.log(`Found ${confirmedBookings.rows.length} confirmed bookings with pending online payments`);

    for (const row of confirmedBookings.rows) {
      console.log(`Updating payment ${row.payment_id} for booking ${row.id} from pending to completed`);
      await pool.query(
        `UPDATE payment_transactions SET status = 'completed' WHERE id = $1`,
        [row.payment_id]
      );
    }

    console.log('Payment statuses updated successfully!');

    // Verify
    const updated = await pool.query(`
      SELECT COUNT(*) 
      FROM bookings b
      JOIN payment_transactions pt ON pt.booking_id = b.id
      WHERE b.status = 'confirmed'
        AND b.payment_method = 'online'
        AND pt.status = 'completed'
    `);
    console.log(`Now ${updated.rows[0].count} confirmed online bookings have completed payments`);

  } catch (err) {
    console.error('Error fixing payment statuses:', err);
    process.exit(1);
  }
}

fixPaymentStatuses().then(() => process.exit(0));
