import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Hero from '../components/Hero.jsx'
import Footer from '../components/Footer.jsx'

const destinations = [
  { name: 'Baguio', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', listings: 48 },
  { name: 'Siargao', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', listings: 36 },
  { name: 'Cebu', image: 'https://images.unsplash.com/photo-1562832135-14a35d25edef?w=400&h=300&fit=crop', listings: 52 },
  { name: 'Palawan', image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=400&h=300&fit=crop', listings: 29 },
  { name: 'Boracay', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', listings: 41 },
  { name: 'Tagaytay', image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=300&fit=crop', listings: 33 },
]

const featuredRooms = [
  { id: 1, name: 'Transient House sa Baguio', location: 'Baguio, Benguet', price: 1890, rating: 4.8, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop' },
  { id: 2, name: 'Beachfront Cottage sa Siargao', location: 'Siargao, Surigao del Norte', price: 1720, rating: 4.9, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop' },
  { id: 3, name: 'City Condo sa Cebu', location: 'Cebu City, Cebu', price: 3495, rating: 4.7, image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=400&h=300&fit=crop' },
  { id: 4, name: 'Beachfront Villa sa Palawan', location: 'El Nido, Palawan', price: 4120, rating: 4.9, image: 'https://images.unsplash.com/photo-1499793983690-e29ba59ef1c2?w=400&h=300&fit=crop' },
  { id: 5, name: 'Heritage House sa Vigan', location: 'Vigan, Ilocos Sur', price: 2610, rating: 4.6, image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop' },
  { id: 6, name: 'Bayview Penthouse sa Manila', location: 'Manila, Philippines', price: 3965, rating: 4.8, image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop' },
]

const nearbyRooms = [
  { id: 7, name: 'Kamalig sa Tagaytay', location: 'Tagaytay, Cavite', price: 1855, rating: 4.5, image: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=400&h=300&fit=crop' },
  { id: 8, name: 'Studio Unit sa Makati', location: 'Makati, Metro Manila', price: 1968, rating: 4.3, image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop' },
  { id: 9, name: 'Riverside Cabin sa Antipolo', location: 'Antipolo, Rizal', price: 1982, rating: 4.7, image: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=400&h=300&fit=crop' },
]

function Homepage() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />

      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mb-3">Popular Destinations</h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-lg mx-auto">Explore the best destinations the Philippines has to offer.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {destinations.map((d) => (
              <Link
                key={d.name}
                to={`/rooms?location=${encodeURIComponent(d.name)}`}
                className="group relative h-48 sm:h-56 overflow-hidden bg-charcoal"
              >
                <img
                  src={d.image}
                  alt={d.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-base sm:text-lg font-bold text-white">{d.name}</h3>
                  <p className="text-xs text-white/70">{d.listings} listings</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mb-3">Featured Rooms</h2>
              <p className="text-sm sm:text-base text-gray-500">Hand-picked accommodations for your next adventure.</p>
            </div>
            <Link
              to="/rooms"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-teal hover:text-olive transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredRooms.map((room) => (
              <Link
                key={room.id}
                to={`/rooms/${room.id}`}
                className="group bg-white shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img
                    src={room.image}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-bold text-charcoal">
                    &#x20B1;{room.price.toLocaleString()} <span className="font-normal text-gray-500">/ night</span>
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm sm:text-base font-semibold text-charcoal group-hover:text-teal transition-colors">{room.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-600 shrink-0 ml-2">
                      <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      {room.rating}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3">{room.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-teal">&#x20B1;{room.price.toLocaleString()}<span className="text-xs font-normal text-gray-400">/night</span></span>
                    <span className="text-xs font-medium text-olive group-hover:underline">View Details</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/rooms"
              className="inline-flex items-center gap-1 text-sm font-medium text-teal hover:text-olive transition-colors"
            >
              View All Rooms
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal mb-3">Explore Nearby</h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-lg mx-auto">Discover great places to stay close to your current location.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {nearbyRooms.map((room) => (
              <Link
                key={room.id}
                to={`/rooms/${room.id}`}
                className="group bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-300"
              >
                <div className="relative h-44 sm:h-48 overflow-hidden">
                  <img src={room.image} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-bold text-charcoal">
                    &#x20B1;{room.price.toLocaleString()}<span className="font-normal text-gray-500">/night</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1 text-xs text-sage mb-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {room.location}
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-charcoal group-hover:text-teal transition-colors">{room.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-charcoal">&#x20B1;{room.price.toLocaleString()}<span className="text-xs font-normal text-gray-400">/night</span></span>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      {room.rating}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {!user && (
        <section className="py-16 sm:py-20 bg-gradient-to-br from-charcoal via-teal to-charcoal text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
            <p className="text-sm sm:text-base text-white/70 mb-8 max-w-lg mx-auto">Join thousands of travelers who trust TiraNa for their perfect stay.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/client/signup"
                replace
                className="inline-block px-8 sm:px-10 py-3 sm:py-4 bg-sage text-white font-medium uppercase tracking-wider text-sm sm:text-base hover:bg-olive transition-colors"
              >
                Book a Stay
              </Link>
              <button
                type="button"
                className="inline-block px-8 sm:px-10 py-3 sm:py-4 border border-white/30 text-white font-medium uppercase tracking-wider text-sm sm:text-base hover:bg-white/10 transition-colors"
              >
                List Your Property
              </button>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}

export default Homepage
