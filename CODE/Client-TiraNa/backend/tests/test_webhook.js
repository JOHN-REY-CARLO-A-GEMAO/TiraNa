const crypto = require('crypto');
const axios = require('axios');

// Mock data
const PAYMONGO_WEBHOOK_SECRET = 'whsec_test_secret';
const WEBHOOK_URL = 'http://localhost:5000/api/webhook/paymongo';

const payload = {
  data: {
    id: 'evt_123',
    type: 'event',
    attributes: {
      type: 'checkout_session.payment.paid',
      data: {
        id: 'cs_123',
        type: 'checkout_session',
        attributes: {
          amount: 100000, // 1000.00 PHP
          currency: 'PHP',
          metadata: {
            booking_id: '1',
          },
          payments: [
            {
              id: 'pay_123',
              attributes: {
                amount: 100000,
                status: 'paid',
                source: {
                  type: 'gcash'
                }
              }
            }
          ]
        }
      }
    }
  }
};

const timestamp = Math.floor(Date.now() / 1000);
const bodyString = JSON.stringify(payload);
const baseString = `${timestamp}.${bodyString}`;

const signature = crypto
  .createHmac('sha256', PAYMONGO_WEBHOOK_SECRET)
  .update(baseString)
  .digest('hex');

const paymongoSignature = `t=${timestamp},v1=${signature}`;

console.log('Sending mock webhook...');
console.log('Payload:', bodyString);
console.log('Signature:', paymongoSignature);

axios.post(WEBHOOK_URL, payload, {
  headers: {
    'Content-Type': 'application/json',
    'paymongo-signature': paymongoSignature
  }
})
.then(response => {
  console.log('Response:', response.status, response.data);
})
.catch(error => {
  console.error('Error:', error.response ? error.response.data : error.message);
});
