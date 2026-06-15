import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

const rooms = [
  { id: 1, title: 'Transient House sa Baguio', location: 'Baguio, Benguet', price: 1890, rating: 4.8, reviews: 124, superhost: true, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop', type: 'Entire apartment', guests: 2 },
  { id: 2, title: 'Beachfront Cottage sa Siargao', location: 'Siargao, Surigao del Norte', price: 1720, rating: 4.9, reviews: 98, superhost: true, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop', type: 'Entire cottage', guests: 3 },
  { id: 3, title: 'City Condo sa Cebu', location: 'Cebu City, Cebu', price: 3495, rating: 4.7, reviews: 215, superhost: false, image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=600&h=400&fit=crop', type: 'Entire condo', guests: 4 },
  { id: 4, title: 'Beachfront Villa sa Palawan', location: 'El Nido, Palawan', price: 4120, rating: 4.9, reviews: 87, superhost: true, image: 'https://images.unsplash.com/photo-1499793983690-e29ba59ef1c2?w=600&h=400&fit=crop', type: 'Entire villa', guests: 6 },
  { id: 5, title: 'Heritage House sa Vigan', location: 'Vigan, Ilocos Sur', price: 2610, rating: 4.6, reviews: 156, superhost: false, image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop', type: 'Entire house', guests: 4 },
  { id: 6, title: 'Bayview Penthouse sa Manila', location: 'Manila, Philippines', price: 3965, rating: 4.8, reviews: 73, superhost: true, image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop', type: 'Entire penthouse', guests: 5 },
  { id: 7, title: 'Kamalig sa Tagaytay', location: 'Tagaytay, Cavite', price: 1855, rating: 4.5, reviews: 42, superhost: false, image: 'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=600&h=400&fit=crop', type: 'Entire house', guests: 2 },
  { id: 8, title: 'Studio Unit sa Makati', location: 'Makati, Metro Manila', price: 1968, rating: 4.3, reviews: 67, superhost: false, image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop', type: 'Entire apartment', guests: 3 },
  { id: 9, title: 'Riverside Cabin sa Antipolo', location: 'Antipolo, Rizal', price: 1982, rating: 4.7, reviews: 55, superhost: true, image: 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=600&h=400&fit=crop', type: 'Entire home', guests: 4 },
]

function StarIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function SuperhostBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/90 backdrop-blur-sm text-[11px] font-semibold text-charcoal uppercase tracking-wider">
      <svg className="w-3 h-3 text-teal" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      Superhost
    </span>
  )
}

function AllRooms() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('')

  const filteredRooms = useMemo(() => {
    let result = [...rooms]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
      )
    }

    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price)
    else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price)
    else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating)

    return result
  }, [search, sort])

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="bg-gradient-to-br from-charcoal via-teal to-charcoal pt-20 sm:pt-24 pb-16 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Explore All Stays
            </h1>
            <p className="text-sm sm:text-base text-white/60 max-w-lg mx-auto">
               Discover unique stays across the Philippines — from city condos to beachfront villas.
            </p>
          </div>

          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search destinations..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-sage transition-colors"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm focus:outline-none focus:border-sage transition-colors appearance-none cursor-pointer"
            >
              <option value="" className="text-charcoal">Sort by</option>
              <option value="price-asc" className="text-charcoal">Price: Low to High</option>
              <option value="price-desc" className="text-charcoal">Price: High to Low</option>
              <option value="rating" className="text-charcoal">Highest Rated</option>
            </select>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-400 mb-8">
            {filteredRooms.length} {filteredRooms.length === 1 ? 'property' : 'properties'} found
          </p>

          {filteredRooms.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-400 text-sm">No properties match your search.</p>
              <button onClick={() => setSearch('')} className="mt-3 text-sm text-teal hover:text-olive transition-colors underline underline-offset-2">
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredRooms.map((room) => (
                <Link
                  key={room.id}
                  to={`/rooms/${room.id}`}
                  className="group bg-white hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative h-52 sm:h-56 overflow-hidden bg-gray-100">
                    <img
                      src={room.image}
                      alt={room.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      {room.superhost && <SuperhostBadge />}
                    </div>
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-charcoal">
                      &#x20B1;{room.price.toLocaleString()}<span className="font-normal text-gray-400">/night</span>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm sm:text-base font-semibold text-charcoal group-hover:text-teal transition-colors leading-snug">
                        {room.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-600 shrink-0 ml-2">
                        <StarIcon />
                        <span className="font-medium">{room.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">{room.location}</p>
                    <p className="text-xs text-gray-300 mb-3">{room.type} · {room.guests} guest{room.guests > 1 ? 's' : ''}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-charcoal">
                        &#x20B1;{room.price.toLocaleString()}<span className="text-xs font-normal text-gray-400">/night</span>
                      </span>
                      <span className="text-xs font-medium text-teal group-hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default AllRooms
