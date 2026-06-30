/**
 * Seed script to create payment transactions for existing bookings
 * Run this once to populate payment_transactions table with existing booking data
 * 
 * Usage: node scripts/seed_payments.js
 */

import pool from '../db.js';

async function seedPayments() {
  try {
    console.log('🔍 Checking for bookings without payment transactions...');
    
    // Find bookings without payment transactions
    const bookingsWithoutPayments = await pool.query(`
      SELECT b.id, b.user_id, b.total_price, b.payment_method, b.status, b.created_at
      FROM bookings b
      WHERE NOT EXISTS (
        SELECT 1 FROM payment_transactions pt WHERE pt.booking_id = b.id
      )
    `);
    
    if (bookingsWithoutPayments.rows.length === 0) {
      console.log('✅ All bookings already have payment transactions!');
      return;
    }
    
    console.log(`📊 Found ${bookingsWithoutPayments.rows.length} bookings without payment transactions`);
    
    // Create payment transactions for each booking
    for (const booking of bookingsWithoutPayments.rows) {
      const paymentMethod = booking.payment_method;
      const status = paymentMethod === 'cash' ? 'completed' : 'pending';
      
      await pool.query(`
        INSERT INTO payment_transactions 
        (booking_id, user_id, amount, payment_method, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        booking.id,
        booking.user_id,
        booking.total_price,
        booking.payment_method,
        status,
        booking.created_at
      ]);
      
      console.log(`✅ Created payment transaction for booking: ${booking.id}`);
    }
    
    console.log('🎉 Payment transactions seeded successfully!');
    
    // Verify
    const count = await pool.query('SELECT COUNT(*) FROM payment_transactions');
    console.log(`📈 Total payment transactions: ${count.rows[0].count}`);
    
  } catch (err) {
    console.error('❌ Error seeding payments:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seedPayments();
