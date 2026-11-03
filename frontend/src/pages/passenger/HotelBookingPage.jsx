import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  MapPin, 
  Clock, 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  Filter, 
  Sparkles, 
  Bed, 
  Wifi, 
  Tv, 
  Coffee, 
  Calendar, 
  User, 
  Phone, 
  ChevronRight, 
  X, 
  CreditCard, 
  Ticket, 
  Check, 
  DoorClosed,
  Luggage,
  Wind
} from 'lucide-react'

// Authentic Station Retiring Rooms & Transit Hotels
const HOTELS_DATA = [
  {
    id: 'htl-1',
    name: 'IRCTC Executive AC Retiring Room & Dormitory',
    type: 'RETIRING_ROOM',
    categoryName: 'IRCTC Retiring Room',
    station_code: 'MAS',
    station_name: 'MGR Chennai Central',
    city: 'Chennai',
    proximity: 'Inside Platform 1 Concourse (0.05 km)',
    rating: 4.8,
    reviews_count: 1840,
    price_hourly_3h: 299,
    price_hourly_6h: 499,
    price_hourly_12h: 850,
    price_night: 1399,
    image_url: '/hotels/irctc-retiring-room.jpg',
    description: 'Official Indian Railways premium AC retiring rooms located inside Chennai Central concourse. Spotless double beds, ensuite hot shower, 24/7 security, and priority boarding access.',
    amenities: ['Platform 1 Direct Concourse Access', 'High-Speed RailWire Wi-Fi', 'Ensuite Hot Shower', '24/7 IRCTC Reception', 'Luggage Cloakroom', 'AC Climate Control'],
    badge: 'Official IRCTC Lounge'
  },
  {
    id: 'htl-2',
    name: 'Urban Pod Station Capsule Hotel & Lounge',
    type: 'POD_HOTEL',
    categoryName: 'Station Capsule Pods',
    station_code: 'MAS',
    station_name: 'MGR Chennai Central',
    city: 'Chennai',
    proximity: 'Platform 4 Waiting Hall Level 1 (0.1 km)',
    rating: 4.9,
    reviews_count: 2450,
    price_hourly_3h: 399,
    price_hourly_6h: 649,
    price_hourly_12h: 999,
    price_night: 1599,
    image_url: '/hotels/station-pod-hotel.jpg',
    description: 'Futuristic private sleeping pods designed for modern train passengers. Each private cabin includes ambient mood lighting, charging ports, high-density memory foam bed, and smart keycard access.',
    amenities: ['Individual Sleep Capsule', 'High-Speed Wi-Fi', 'Smart Keycard Entry', 'USB Fast Chargers', 'Soundproof Privacy Blinds', 'Shared Luxury Restrooms'],
    badge: 'Popular Transit Choice'
  },
  {
    id: 'htl-3',
    name: 'Ginger Hotel Rail Yatri Transit',
    type: 'TRANSIT_BUDGET',
    categoryName: 'Budget Transit Hotel',
    station_code: 'MS',
    station_name: 'Chennai Egmore',
    city: 'Chennai',
    proximity: 'Opposite Egmore Station Main Portico (0.2 km)',
    rating: 4.6,
    reviews_count: 1120,
    price_hourly_3h: 499,
    price_hourly_6h: 799,
    price_hourly_12h: 1299,
    price_night: 2199,
    image_url: '/hotels/ginger-transit-hotel.jpg',
    description: 'Contemporary 3-star railway transit hotel offering smart queen rooms, express 24/7 check-in, in-house cafe, and automated wake-up calls synchronized with train departures.',
    amenities: ['Smart Queen Bed', 'Ergonomic Work Desk', '24/7 Express Check-in', 'Train Departure Alert Screen', 'In-room Coffee Maker', 'Elevator Access'],
    badge: 'Smart Business Transit'
  },
  {
    id: 'htl-4',
    name: 'Taj Connemara Heritage Suite & Lounge',
    type: 'HERITAGE_LUXURY',
    categoryName: '5-Star Heritage Luxury',
    station_code: 'MAS',
    station_name: 'MGR Chennai Central',
    city: 'Chennai',
    proximity: 'Binny Road, 2.5 km from Central Station',
    rating: 4.9,
    reviews_count: 3200,
    price_hourly_3h: 1999,
    price_hourly_6h: 3499,
    price_hourly_12h: 5499,
    price_night: 7999,
    image_url: '/hotels/taj-connemara.jpg',
    description: "Chennai's oldest luxury colonial hotel established in 1891. Features teakwood four-poster beds, tranquil courtyard gardens, butler service, and complimentary luxury station transfers.",
    amenities: ['Free Station Chauffeur Transfer', 'Colonial Heritage Architecture', 'Outdoor Courtyard Swimming Pool', 'Fine Dining Restaurants', '24/7 Luxury Concierge', 'Spacious Bathtub'],
    badge: '5-Star Grand Heritage'
  },
  {
    id: 'htl-5',
    name: 'The Residency Towers Executive Transit',
    type: 'BUSINESS_4STAR',
    categoryName: '4-Star Business Hotel',
    station_code: 'MS',
    station_name: 'Chennai Egmore',
    city: 'Chennai',
    proximity: '1.8 km from Egmore Station / T. Nagar Hub',
    rating: 4.7,
    reviews_count: 1780,
    price_hourly_3h: 899,
    price_hourly_6h: 1499,
    price_hourly_12h: 2299,
    price_night: 3899,
    image_url: '/hotels/residency-towers.jpg',
    description: 'Premier 4-star business hotel with plush king suites, 24/7 coffee shop, fitness center, express laundry, and dedicated railway traveler transit amenities.',
    amenities: ['Plush King Suite', '24/7 All-Day Dining', 'Express Laundry for Travelers', 'High-Speed Fiber Wi-Fi', 'Airport/Station Cab Desk', 'Smart LED TV'],
    badge: '4-Star Business Class'
  },
  {
    id: 'htl-6',
    name: 'Heritage Madurai Courtyard Resort & Spa',
    type: 'HERITAGE_LUXURY',
    categoryName: '5-Star Heritage Luxury',
    station_code: 'MDU',
    station_name: 'Madurai Junction',
    city: 'Madurai',
    proximity: 'Kochadai, 3.2 km from Madurai Jn Station',
    rating: 4.9,
    reviews_count: 2100,
    price_hourly_3h: 1499,
    price_hourly_6h: 2499,
    price_hourly_12h: 3999,
    price_night: 5499,
    image_url: '/hotels/heritage-madurai.jpg',
    description: 'Stunning Geoffrey Bawa-designed heritage sanctuary amidst 17 acres of ancient banyan trees. Traditional temple-style stone carvings, private plunge pools, and temple darshan assistance.',
    amenities: ['Private Courtyard View', 'Temple Tour Shuttle', 'Geoffrey Bawa Architecture', 'Ayurvedic Spa & Wellness', 'Plush Silk Bedding', 'Traditional South Indian Dining'],
    badge: 'Temple City Heritage'
  },
  {
    id: 'htl-7',
    name: 'The Residency Coimbatore Station Transit',
    type: 'BUSINESS_4STAR',
    categoryName: '4-Star Business Hotel',
    station_code: 'CBE',
    station_name: 'Coimbatore Junction',
    city: 'Coimbatore',
    proximity: 'Avinashi Road, 1.2 km from Coimbatore Jn',
    rating: 4.7,
    reviews_count: 1490,
    price_hourly_3h: 799,
    price_hourly_6h: 1299,
    price_hourly_12h: 1999,
    price_night: 3299,
    image_url: '/hotels/coimbatore-residency.jpg',
    description: 'Leading upscale transit hotel situated minutes from Coimbatore Junction. Modern soundproof rooms, business center, complimentary buffet breakfast, and train departure assistance.',
    amenities: ['Soundproof City View Rooms', 'Buffet Breakfast Included', 'Direct Railway Transfer Service', '24/7 Room Dining', 'Swimming Pool & Gym', 'Valet Parking'],
    badge: 'Top Rated in CBE'
  },
  {
    id: 'htl-8',
    name: 'ITC Grand Chola Luxury Palace Stay',
    type: 'HERITAGE_LUXURY',
    categoryName: '5-Star Heritage Luxury',
    station_code: 'SBC',
    station_name: 'KSR Bengaluru / Chennai',
    city: 'Bengaluru / Chennai',
    proximity: 'Guindy Grand Concourse, Metro connected to Central',
    rating: 4.9,
    reviews_count: 4800,
    price_hourly_3h: 2499,
    price_hourly_6h: 4299,
    price_hourly_12h: 6999,
    price_night: 9999,
    image_url: '/hotels/itc-grand-chola.jpg',
    description: 'Magnificent architectural ode to the imperial Chola dynasty. Opulent marble suites, world-class signature restaurants, luxury spa, and customized concierge service.',
    amenities: ['Royal Chola Architecture', 'Chauffeured Luxury Transfers', '10 Signature Restaurants', 'Royal Spa & Wellness', 'Butler Service', 'Expansive Marble Bathroom'],
    badge: 'Imperial Grandeur'
  }
]

export default function HotelBookingPage() {
  const [selectedStation, setSelectedStation] = useState('ALL')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [stayDurationType, setStayDurationType] = useState('HOURLY_6H') // 'HOURLY_3H', 'HOURLY_6H', 'HOURLY_12H', 'NIGHT'
  const [searchQuery, setSearchQuery] = useState('')
  
  // Booking modal
  const [activeHotel, setActiveHotel] = useState(null)
  const [checkInDate, setCheckInDate] = useState(() => new Date().toISOString().split('T')[0])
  const [checkInTime, setCheckInTime] = useState('14:00')
  const [guestName, setGuestName] = useState('Ravi Kumar')
  const [guestPhone, setGuestPhone] = useState('+91 98401 22334')
  const [pnrNumber, setPnrNumber] = useState('4231890254')
  const [roomCount, setRoomCount] = useState(1)
  const [appliedPnrDiscount, setAppliedPnrDiscount] = useState(true)
  
  // Confirmation state
  const [confirmedBooking, setConfirmedBooking] = useState(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // Filter logic
  const filteredHotels = HOTELS_DATA.filter(hotel => {
    const matchStation = selectedStation === 'ALL' || hotel.station_code === selectedStation
    const matchCategory = selectedCategory === 'ALL' || hotel.type === selectedCategory
    const matchSearch = searchQuery.trim() === '' || 
      hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.proximity.toLowerCase().includes(searchQuery.toLowerCase())
    return matchStation && matchCategory && matchSearch
  })

  const getPriceForDuration = (hotel) => {
    switch (stayDurationType) {
      case 'HOURLY_3H': return { amount: hotel.price_hourly_3h, label: '3 Hours Transit' }
      case 'HOURLY_6H': return { amount: hotel.price_hourly_6h, label: '6 Hours Transit' }
      case 'HOURLY_12H': return { amount: hotel.price_hourly_12h, label: '12 Hours Day/Night' }
      case 'NIGHT': return { amount: hotel.price_night, label: '24 Hours / 1 Night' }
      default: return { amount: hotel.price_hourly_6h, label: '6 Hours Transit' }
    }
  }

  const handleStartBooking = (hotel) => {
    setActiveHotel(hotel)
    setBookingSuccess(false)
    setConfirmedBooking(null)
  }

  const handleConfirmReservation = (e) => {
    e.preventDefault()
    const rateInfo = getPriceForDuration(activeHotel)
    const basePrice = rateInfo.amount * roomCount
    const discount = appliedPnrDiscount ? Math.round(basePrice * 0.10) : 0
    const finalAmount = basePrice - discount

    const bookingRef = `RRQ-HTL-${Math.floor(100000 + Math.random() * 900000)}`
    const reservation = {
      bookingRef,
      hotelName: activeHotel.name,
      hotelImage: activeHotel.image_url,
      stationCode: activeHotel.station_code,
      stationName: activeHotel.station_name,
      proximity: activeHotel.proximity,
      guestName,
      guestPhone,
      pnrNumber,
      checkInDate,
      checkInTime,
      stayType: rateInfo.label,
      roomCount,
      totalPaid: finalAmount,
      discountSaved: discount,
      bookedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      qrPayload: `RAILRESQ:HOTEL:${bookingRef}:${guestName}:${activeHotel.station_code}`
    }

    // Save to local storage
    try {
      const existing = JSON.parse(localStorage.getItem('railresq_hotel_reservations') || '[]')
      localStorage.setItem('railresq_hotel_reservations', JSON.stringify([reservation, ...existing]))
    } catch (err) {
      console.warn('Storage save skipped', err)
    }

    setConfirmedBooking(reservation)
    setBookingSuccess(true)
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 p-6 md:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
              <Building2 className="w-3.5 h-3.5" />
              <span>IRCTC Verified Retiring Rooms & Station-Side Hotels</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Hotels & Station Retiring Rooms
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Book official IRCTC AC Retiring Rooms, futuristic capsule sleep pods, and premium station-side hotels with flexible hourly transit slots (3h/6h/12h) or overnight stays.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Rail Yatri Perk</p>
                <p className="text-xs font-black text-white">Flat 10% OFF with PNR</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar: Station & Duration Type */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-4 shadow-lg backdrop-blur-sm">
        {/* Row 1: Search and Stay Duration Toggle */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search hotel name, station, concourse or landmark..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Stay Duration Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>SLOT:</span>
            </span>
            {[
              { id: 'HOURLY_3H', label: '3 Hours' },
              { id: 'HOURLY_6H', label: '6 Hours' },
              { id: 'HOURLY_12H', label: '12 Hours' },
              { id: 'NIGHT', label: 'Overnight (24h)' }
            ].map(slot => (
              <button
                key={slot.id}
                onClick={() => setStayDurationType(slot.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  stayDurationType === slot.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Station Selector & Category Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pr-1 flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>Station:</span>
            </span>
            {[
              { code: 'ALL', label: 'All Stations' },
              { code: 'MAS', label: 'MAS • Chennai Central' },
              { code: 'MS', label: 'MS • Chennai Egmore' },
              { code: 'MDU', label: 'MDU • Madurai Jn' },
              { code: 'CBE', label: 'CBE • Coimbatore' },
              { code: 'SBC', label: 'SBC • Bengaluru' }
            ].map(st => (
              <button
                key={st.code}
                onClick={() => setSelectedStation(st.code)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedStation === st.code
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: 'All Lodgings' },
              { id: 'RETIRING_ROOM', label: 'IRCTC Retiring Room' },
              { id: 'POD_HOTEL', label: 'Station Capsule Pods' },
              { id: 'TRANSIT_BUDGET', label: 'Budget Transit' },
              { id: 'BUSINESS_4STAR', label: '4-Star Business' },
              { id: 'HERITAGE_LUXURY', label: '5-Star Heritage' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-600'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hotel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHotels.map(hotel => {
          const rate = getPriceForDuration(hotel)
          return (
            <div 
              key={hotel.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-950/30 flex flex-col justify-between group"
            >
              <div>
                {/* Real Hotel Cover Photo */}
                <div className="h-52 relative overflow-hidden bg-slate-950">
                  <img 
                    src={hotel.image_url} 
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = '/hotels/irctc-retiring-room.jpg'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30 p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-amber-300 border border-amber-500/40 font-mono shadow-sm">
                        {hotel.station_code} • {hotel.city}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-indigo-950/90 text-indigo-300 border border-indigo-600/50 backdrop-blur-md shadow-sm">
                        {hotel.badge}
                      </span>
                    </div>

                    <div className="flex items-end justify-between">
                      <div className="flex items-center space-x-1 bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-md">
                        <Star className="w-3.5 h-3.5 fill-current text-amber-200" />
                        <span>{hotel.rating}</span>
                        <span className="text-[10px] opacity-80">({hotel.reviews_count})</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-100 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/50 shadow-sm flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span>{hotel.proximity}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hotel Details */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-base font-black text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {hotel.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {hotel.description}
                    </p>
                  </div>

                  {/* Amenities Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                      <span 
                        key={idx} 
                        className="text-[10px] font-medium bg-slate-950 text-slate-300 border border-slate-800 px-2 py-0.5 rounded-md flex items-center space-x-1"
                      >
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                        <span>{amenity}</span>
                      </span>
                    ))}
                    {hotel.amenities.length > 3 && (
                      <span className="text-[10px] font-medium bg-slate-950 text-indigo-400 border border-indigo-900/40 px-1.5 py-0.5 rounded-md">
                        +{hotel.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer: Pricing & Action */}
              <div className="p-5 pt-3 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/40">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {rate.label}
                  </span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-lg font-black text-emerald-400">₹{rate.amount}</span>
                    <span className="text-[11px] text-slate-400">/ room</span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartBooking(hotel)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-950 transition flex items-center space-x-1.5 group-hover:shadow-indigo-600/30"
                >
                  <span>Book Now</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reservation & Instant Voucher Modal */}
      {activeHotel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="relative h-32 bg-slate-950 overflow-hidden border-b border-slate-800">
              <img 
                src={activeHotel.image_url} 
                alt={activeHotel.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-black/40 p-5 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider bg-black/70 px-2.5 py-0.5 rounded border border-amber-500/40 backdrop-blur-sm">
                    {activeHotel.station_code} • {activeHotel.station_name}
                  </span>
                  <h2 className="text-lg font-black text-white mt-1 line-clamp-1">{activeHotel.name}</h2>
                </div>
                <button
                  onClick={() => setActiveHotel(null)}
                  className="w-8 h-8 rounded-full bg-black/60 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {bookingSuccess && confirmedBooking ? (
                /* Success Voucher View */
                <div className="space-y-4 animate-scale-in">
                  <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-2">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black text-white">Reservation Confirmed!</h3>
                    <p className="text-xs text-emerald-300">
                      Your room has been reserved with Indian Railways transit priority. An SMS voucher with check-in QR code has been dispatched.
                    </p>
                  </div>

                  {/* Boarding Pass Style Digital Voucher */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Booking Reference</span>
                        <p className="text-sm font-mono font-black text-indigo-400">{confirmedBooking.bookingRef}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</span>
                        <span className="inline-block text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                          CONFIRMED
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px]">Primary Guest</span>
                        <p className="font-bold text-white">{confirmedBooking.guestName}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Contact Mobile</span>
                        <p className="font-bold text-white">{confirmedBooking.guestPhone}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Check-In Schedule</span>
                        <p className="font-bold text-white">{confirmedBooking.checkInDate} at {confirmedBooking.checkInTime}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Duration Reserved</span>
                        <p className="font-bold text-white">{confirmedBooking.stayType}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Location</span>
                        <p className="font-bold text-white">{confirmedBooking.proximity}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Total Paid</span>
                        <p className="font-black text-emerald-400 text-sm">₹{confirmedBooking.totalPaid}</p>
                      </div>
                    </div>

                    {confirmedBooking.discountSaved > 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/30 text-[11px] text-amber-300 flex items-center space-x-2">
                        <Ticket className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>PNR Railway Concession applied! Saved ₹{confirmedBooking.discountSaved}.</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveHotel(null)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
                  >
                    Done & Return to Hotels
                  </button>
                </div>
              ) : (
                /* Reservation Form */
                <form onSubmit={handleConfirmReservation} className="space-y-4">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Duration:</span>
                      <strong className="text-white ml-1.5">{getPriceForDuration(activeHotel).label}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Base Rate:</span>
                      <strong className="text-emerald-400 ml-1.5">₹{getPriceForDuration(activeHotel).amount}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Check-in Date</label>
                      <input 
                        type="date" 
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Estimated Check-in Time</label>
                      <input 
                        type="time" 
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Guest Full Name</label>
                      <input 
                        type="text" 
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Mobile Number (SMS)</label>
                      <input 
                        type="text" 
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1">
                      <span>Railway Ticket PNR (For 10% Discount)</span>
                      <span className="text-[10px] text-amber-400 font-bold">10% OFF APPLIED</span>
                    </label>
                    <input 
                      type="text" 
                      value={pnrNumber}
                      onChange={(e) => setPnrNumber(e.target.value)}
                      placeholder="e.g. 4231890254"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Summary */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Total Payable</span>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-lg font-black text-emerald-400">
                          ₹{appliedPnrDiscount 
                            ? Math.round(getPriceForDuration(activeHotel).amount * 0.9) 
                            : getPriceForDuration(activeHotel).amount}
                        </span>
                        {appliedPnrDiscount && (
                          <span className="text-[11px] text-slate-500 line-through">
                            ₹{getPriceForDuration(activeHotel).amount}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-950 transition flex items-center space-x-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm & Book</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
