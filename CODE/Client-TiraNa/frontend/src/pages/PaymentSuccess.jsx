import { Link, useSearchParams } from 'react-router-dom'

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('booking_id')

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
          <CheckIcon className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-charcoal mb-3">Payment Successful!</h1>
        <p className="text-sm text-gray-500 mb-6">
          Thank you for your payment. Your booking #{bookingId} has been confirmed. 
          You can now view your itinerary in your bookings.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/client/bookings"
            className="px-6 py-3 bg-sage text-white font-medium uppercase tracking-wider text-sm hover:bg-olive transition-colors"
          >
            My Bookings
          </Link>
          <Link
            to="/"
            className="px-6 py-3 border border-gray-200 text-charcoal font-medium uppercase tracking-wider text-sm hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccess
