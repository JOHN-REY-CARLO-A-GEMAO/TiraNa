import axios from 'axios';

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_BASE_URL = 'https://api.paymongo.com/v1';

const authHeader = {
  Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
  'Content-Type': 'application/json',
};

export const createPaymentSource = async (amount, bookingId, redirectUrls) => {
  try {
    const response = await axios.post(
      `${PAYMONGO_BASE_URL}/sources`,
      {
        data: {
          attributes: {
            amount: Math.round(amount * 100), // convert to cents
            currency: 'PHP',
            type: 'gcash', // We'll default to gash but PayMongo Checkout supports more. 
            // Wait, if we use /sources we need to specify type. 
            // If we want the full checkout experience, we might want Checkout Sessions.
            // But the instructions mentioned Sources. Let's use Checkout Sessions for a better UI if possible, 
            // or stick to Sources as requested.
            // Actually, the prompt says "Redirect to PayMongo Checkout (hosted page)". 
            // PayMongo Checkout is usually done via Checkout Sessions.
            redirect: {
              success: redirectUrls.success,
              failed: redirectUrls.failed,
            },
            metadata: {
              booking_id: bookingId,
            },
          },
        },
      },
      { headers: authHeader }
    );
    return response.data.data;
  } catch (error) {
    console.error('PayMongo Create Source Error:', error.response?.data || error.message);
    throw error;
  }
};

export const createCheckoutSession = async (amount, bookingId, description, redirectUrls) => {
    try {
      const response = await axios.post(
        `${PAYMONGO_BASE_URL}/checkout_sessions`,
        {
          data: {
            attributes: {
              send_email_receipt: true,
              show_description: true,
              show_line_items: true,
              line_items: [
                {
                  amount: Math.round(amount * 100),
                  currency: 'PHP',
                  description: description,
                  name: 'Property Booking',
                  quantity: 1,
                },
              ],
              payment_method_types: ['gcash', 'paymaya', 'card', 'dob', 'dob_ubp'],
              success_url: redirectUrls.success,
              cancel_url: redirectUrls.failed,
              metadata: {
                booking_id: bookingId,
              },
            },
          },
        },
        { headers: authHeader }
      );
      return response.data.data;
    } catch (error) {
      console.error('PayMongo Create Checkout Session Error:', error.response?.data || error.message);
      throw error;
    }
  };

export const retrieveSource = async (sourceId) => {
  try {
    const response = await axios.get(`${PAYMONGO_BASE_URL}/sources/${sourceId}`, {
      headers: authHeader,
    });
    return response.data.data;
  } catch (error) {
    console.error('PayMongo Retrieve Source Error:', error.response?.data || error.message);
    throw error;
  }
};
