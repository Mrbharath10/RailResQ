import React, { useState, useEffect } from 'react'
import { 
  Compass, 
  MapPin, 
  Star, 
  Heart, 
  Search, 
  Sparkles, 
  Clock, 
  Ticket, 
  Calendar, 
  ChevronRight,
  ExternalLink,
  Tag,
  Landmark,
  Eye,
  Bed
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

// Local authentic tourist destination photography
const DESTINATION_IMAGE_MAP = {
  "Arulmigu Meenakshi Amman Temple": "/destinations/meenakshi-temple.jpg",
  "Adiyogi Shiva Statue & Isha Yoga Center": "/destinations/adiyogi-shiva.jpg",
  "Kapaleeshwarar Temple": "/destinations/kapaleeshwarar-temple.jpg",
  "Marina Beach": "/destinations/marina-beach.jpg",
  "Santhome Cathedral Basilica": "/destinations/santhome-basilica.jpg",
  "Arignar Anna Zoological Park (Vandalur Zoo)": "/destinations/vandalur-zoo.jpg",
  "T. Nagar Ranganathan Street Shopping Hub": "/destinations/tnagar-market.jpg",
  "Thirumalai Nayakkar Mahal": "/destinations/thirumalai-mahal.jpg",
  "Famous Jigarthanda Stall (East Gate)": "/destinations/jigarthanda.jpg",
  "Marudhamalai Murugan Temple": "/destinations/marudhamalai-temple.jpg",
  "Siruvani Waterfalls & Dam": "/destinations/siruvani-waterfalls.jpg",
  "Ooty Botanical Gardens": "/destinations/ooty-botanical.jpg",
  "Ooty Lake & Boathouse": "/destinations/ooty-lake.jpg",
  "Bengaluru Palace": "/destinations/bengaluru-palace.jpg",
  "Lalbagh Botanical Garden": "/destinations/lalbagh-glasshouse.jpg"
}

const getDestinationImage = (p) => {
  if (p?.image_url && p.image_url.startsWith('/destinations/')) {
    return p.image_url
  }
  if (p?.name && DESTINATION_IMAGE_MAP[p.name]) {
    return DESTINATION_IMAGE_MAP[p.name]
  }
  const name = (p?.name || '').toLowerCase()
  if (name.includes('meenakshi') || (name.includes('temple') && name.includes('madurai'))) return '/destinations/meenakshi-temple.jpg'
  if (name.includes('adiyogi') || name.includes('isha')) return '/destinations/adiyogi-shiva.jpg'
  if (name.includes('kapaleeshwarar') || name.includes('mylapore')) return '/destinations/kapaleeshwarar-temple.jpg'
  if (name.includes('marina') || name.includes('beach')) return '/destinations/marina-beach.jpg'
  if (name.includes('santhome') || name.includes('basilica') || name.includes('church')) return '/destinations/santhome-basilica.jpg'
  if (name.includes('zoo') || name.includes('vandalur') || name.includes('safari')) return '/destinations/vandalur-zoo.jpg'
  if (name.includes('nagar') || name.includes('market') || name.includes('bazaar') || name.includes('street')) return '/destinations/tnagar-market.jpg'
  if (name.includes('thirumalai') || name.includes('mahal') || (name.includes('palace') && name.includes('madurai'))) return '/destinations/thirumalai-mahal.jpg'
  if (name.includes('jigarthanda') || name.includes('dessert') || name.includes('stall')) return '/destinations/jigarthanda.jpg'
  if (name.includes('marudhamalai') || name.includes('murugan')) return '/destinations/marudhamalai-temple.jpg'
  if (name.includes('waterfall') || name.includes('siruvani') || name.includes('falls')) return '/destinations/siruvani-waterfalls.jpg'
  if (name.includes('botanical') || (name.includes('garden') && name.includes('ooty'))) return '/destinations/ooty-botanical.jpg'
  if (name.includes('lake') || name.includes('boathouse')) return '/destinations/ooty-lake.jpg'
  if (name.includes('palace') && name.includes('bengaluru')) return '/destinations/bengaluru-palace.jpg'
  if (name.includes('lalbagh') || name.includes('glass')) return '/destinations/lalbagh-glasshouse.jpg'
  return '/destinations/meenakshi-temple.jpg'
}

export default function ExploreDestinationsPage() {
  const [places, setPlaces] = useState([])
  const [cities, setCities] = useState([])
  const [selectedCity, setSelectedCity] = useState('ALL')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Wishlist
  const [wishlist, setWishlist] = useState([])
  const [activeTab, setActiveTab] = useState('explore') // 'explore' | 'wishlist'

  const CATEGORIES = [
    { code: 'ALL', label: 'All Places', icon: '✨' },
    { code: 'ATTRACTION', label: 'Monuments & Sights', icon: '🏛️' },
    { code: 'RELIGIOUS', label: 'Temples & Holy Sites', icon: '🛕' },
    { code: 'NATURE_RECREATION', label: 'Nature, Lakes & Waterfalls', icon: '🌿' },
    { code: 'FOOD_DINING', label: 'Iconic Regional Eateries', icon: '🍛' },
    { code: 'SHOPPING', label: 'Bazaars & Silk Markets', icon: '🛍️' },
    { code: 'TRAVEL_FACILITY', label: 'Cloakrooms & Facilities', icon: '🧳' }
  ]

  const fetchCities = async () => {
    try {
      const res = await api.get('/tourism/cities')
      setCities(res.data)
    } catch (err) {
      console.error('Error fetching cities:', err)
    }
  }

  const fetchPlaces = async () => {
    setLoading(true)
    try {
      const params = {}
      if (selectedCity !== 'ALL') params.city = selectedCity
      if (selectedCategory !== 'ALL') params.category = selectedCategory
      if (searchQuery.trim()) params.search = searchQuery.trim()

      const res = await api.get('/tourism/places', { params })
      setPlaces(res.data)
    } catch (err) {
      console.error('Error fetching tourist places:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/tourism/wishlist')
      setWishlist(res.data)
    } catch (err) {
      console.error('Error fetching wishlist:', err)
    }
  }

  useEffect(() => {
    fetchCities()
    fetchWishlist()
  }, [])

  useEffect(() => {
    fetchPlaces()
  }, [selectedCity, selectedCategory])

  const toggleWishlist = async (placeId) => {
    try {
      const res = await api.post('/tourism/wishlist/toggle', { place_id: placeId })
      fetchWishlist()
    } catch (err) {
      console.error('Wishlist toggle error:', err)
    }
  }

  const isWishlisted = (placeId) => {
    return wishlist.some(w => w.place_id === placeId)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-700 to-indigo-800 p-6 md:p-8 text-white shadow-xl shadow-cyan-950/30">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-cyan-200 border border-cyan-300/30">
            <Compass className="w-3.5 h-3.5 text-cyan-300" />
            <span>AI Tourist Companion & Smart Destination Discovery</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Explore Heritage, Temples, Nature & Iconic Food
          </h1>
          <p className="text-sm md:text-base text-cyan-100/90 leading-relaxed">
            Discover breathtaking attractions, holy shrines, lakes, waterfalls, authentic regional dining, and shopping bazaars around every railway junction.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button 
              onClick={() => setActiveTab('explore')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow ${
                activeTab === 'explore' ? 'bg-white text-blue-950' : 'bg-black/30 text-white hover:bg-black/40'
              }`}
            >
              🏛️ Explore Places
            </button>
            <button 
              onClick={() => setActiveTab('wishlist')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow flex items-center space-x-1.5 ${
                activeTab === 'wishlist' ? 'bg-white text-blue-950' : 'bg-black/30 text-white hover:bg-black/40'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>Saved Wishlist ({wishlist.length})</span>
            </button>
            <Link
              to="/travel-guide"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition shadow flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Itinerary Planner</span>
            </Link>
          </div>
        </div>

        {/* Academic Simulation Notice */}
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-[11px] text-cyan-200 font-mono">
          Curated Southern Railway Tourist Directory
        </div>
      </div>

      {activeTab === 'explore' ? (
        <div className="space-y-4">
          
          {/* City & Category Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
            
            {/* City Selector Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center mr-1">
                <MapPin className="w-3.5 h-3.5 mr-1 text-cyan-400" /> City:
              </span>
              <button
                onClick={() => setSelectedCity('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                  selectedCity === 'ALL'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                All Destinations
              </button>
              {cities.map(c => (
                <button
                  key={c.city}
                  onClick={() => setSelectedCity(c.city)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                    selectedCity === c.city
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {c.city} ({c.count})
                </button>
              ))}
            </div>

            {/* Category Selector Scroller */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 border-t border-slate-800/80 pt-2.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.code}
                  onClick={() => setSelectedCategory(cat.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center space-x-1.5 ${
                    selectedCategory === cat.code
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative pt-1">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search monuments, temples, waterfalls, idli spots, silk markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchPlaces()}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Station Retiring Rooms & Hotels Partner Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/70 border border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md mt-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Bed className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>Need Station Lodging or Retiring Room?</span>
                    <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-600/40">10% OFF with PNR</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">IRCTC AC Retiring Rooms, modern sleeping pods, and 5-star heritage hotels at your destination.</p>
                </div>
              </div>
              <Link
                to="/hotels"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1 shrink-0 shadow-md shadow-indigo-950"
              >
                <span>View Hotels</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Tourist Places Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm">Discovering extraordinary places...</p>
            </div>
          ) : places.length === 0 ? (
            <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-2xl">
              <Landmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold">No destinations match your current filter.</p>
              <button 
                onClick={() => { setSelectedCity('ALL'); setSelectedCategory('ALL'); setSearchQuery('') }} 
                className="mt-3 text-xs text-cyan-400 hover:underline font-bold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {places.map(p => {
                const wishlisted = isWishlisted(p.id)
                return (
                  <div
                    key={p.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-cyan-950/20 flex flex-col justify-between"
                  >
                    <div>
                      {/* Photo Banner with Gradient Scrim */}
                      <div className="h-44 relative overflow-hidden group bg-slate-950">
                        <img 
                          src={getDestinationImage(p)} 
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = '/destinations/meenakshi-temple.jpg'
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30 p-4 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-cyan-300 border border-cyan-500/40 shadow-sm">
                              {p.city} • {p.sub_category}
                            </span>
                            <button
                              onClick={() => toggleWishlist(p.id)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition shadow-md ${
                                wishlisted ? 'bg-rose-950 text-rose-400 border border-rose-600' : 'bg-black/60 text-slate-200 hover:text-white border border-slate-700/50'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
                            </button>
                          </div>

                          <div className="flex items-end justify-between">
                            <div className="flex items-center space-x-1 bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-lg shadow">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span>{p.rating.toFixed(1)}</span>
                              <span className="text-[10px] text-slate-800 font-normal">({p.reviews_count})</span>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-100 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-700/50">
                              {p.entry_fee}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <h3 className="text-base font-bold text-slate-100">{p.name}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>
                        
                        <div className="pt-2 border-t border-slate-800 space-y-1 text-xs text-slate-400">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-cyan-400" />
                              <span>From {p.nearby_station_code || p.city} Station:</span>
                            </span>
                            <span className="font-bold text-slate-200">{p.distance_from_station_km} km</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Timings:</span>
                            </span>
                            <span className="text-[11px] text-slate-300">{p.opening_hours}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="p-4 pt-0">
                      <Link
                        to={`/travel-guide?city=${encodeURIComponent(p.city)}`}
                        className="w-full bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-2 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Plan 1-Day Visit with AI</span>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* Saved Wishlist Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
              <span>Your Saved Travel Wishlist ({wishlist.length})</span>
            </h2>
            <button onClick={fetchWishlist} className="text-xs text-cyan-400 font-semibold hover:underline">
              Refresh Wishlist
            </button>
          </div>

          {wishlist.length === 0 ? (
            <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <Heart className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-medium">Your travel wishlist is currently empty.</p>
              <button 
                onClick={() => setActiveTab('explore')}
                className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-xl text-xs hover:bg-cyan-500"
              >
                Browse Top Destinations & Save
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlist.map(w => (
                <div key={w.wishlist_id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <img 
                        src={getDestinationImage(w)} 
                        alt={w.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0 shadow-sm"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = '/destinations/meenakshi-temple.jpg'
                        }}
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">{w.city}</span>
                        <h4 className="text-sm font-bold text-slate-100 truncate">{w.name}</h4>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleWishlist(w.place_id)}
                      className="text-rose-400 hover:text-rose-300 text-xs font-bold shrink-0 ml-2"
                    >
                      Remove
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1">{w.address}</p>

                  <Link
                    to={`/travel-guide?city=${encodeURIComponent(w.city)}`}
                    className="w-full bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition"
                  >
                    <span>View Itinerary</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
