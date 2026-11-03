import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { 
  Train, 
  ArrowRightLeft, 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  CreditCard, 
  Users, 
  Sparkles,
  ChevronRight,
  Info,
  X,
  Plus,
  Trash2,
  Lock,
  ArrowRight,
  Zap,
  Star,
  Check,
  ChevronDown,
  Navigation,
  Share2,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const POPULAR_ROUTES = [
  { label: 'Chennai → Madurai', src: 'MS', dest: 'MDU', tag: 'Pandian / Vaigai' },
  { label: 'Chennai → Coimbatore', src: 'MAS', dest: 'CBE', tag: 'Kovai / Vande Bharat' },
  { label: 'Chennai → Bengaluru', src: 'MAS', dest: 'SBC', tag: 'Shatabdi / Vande Bharat' },
  { label: 'Chennai → Hyderabad', src: 'MAS', dest: 'HYB', tag: 'Charminar Express' },
  { label: 'Bengaluru → Chennai', src: 'SBC', dest: 'MAS', tag: 'Brindavan / Vande Bharat' },
  { label: 'Bengaluru → Hyderabad', src: 'SBC', dest: 'HYB', tag: 'Kacheguda SF' }
]

const TRAVEL_CLASSES = [
  { code: 'ALL', name: 'All Classes' },
  { code: '3A', name: 'AC 3 Tier (3A)' },
  { code: '2A', name: 'AC 2 Tier (2A)' },
  { code: '1A', name: 'AC First Class (1A)' },
  { code: 'CC', name: 'AC Chair Car (CC)' },
  { code: 'EC', name: 'Exec. Chair Car (EC)' },
  { code: 'SL', name: 'Sleeper (SL)' }
]

const getTrainPhoto = (t) => {
  const name = (t?.train_name || t?.name || '').toLowerCase()
  const type = (t?.train_type || t?.type || '').toLowerCase()
  if (name.includes('vande') || type.includes('vande')) return '/trains/vande-bharat-express.jpg'
  if (name.includes('tejas') || type.includes('tejas')) return '/trains/tejas-express.jpg'
  if (name.includes('rajdhani') || type.includes('rajdhani')) return '/trains/rajdhani-express.jpg'
  return '/trains/wap7-loco.jpg'
}

const BERTH_PREFERENCES = [
  'No Preference',
  'Lower Berth',
  'Middle Berth',
  'Upper Berth',
  'Side Lower',
  'Side Upper',
  'Window Seat'
]

export default function TrainSearchPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [stations, setStations] = useState([])
  const [sourceCode, setSourceCode] = useState(searchParams.get('source') || 'MAS')
  const [destCode, setDestCode] = useState(searchParams.get('dest') || 'MDU')
  const [journeyDate, setJourneyDate] = useState(
    searchParams.get('date') || new Date().toISOString().split('T')[0]
  )
  const [selectedClass, setSelectedClass] = useState('ALL')
  const [filterType, setFilterType] = useState('ALL')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sortBy, setSortBy] = useState('DEPARTURE') // 'DEPARTURE' | 'DURATION'

  const [searching, setSearching] = useState(false)
  const [trains, setTrains] = useState([])
  const [searchInitiated, setSearchInitiated] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  // Selected Class per Train: { [trainNumber]: classObj }
  const [selectedClassPerTrain, setSelectedClassPerTrain] = useState({})

  // Route & Halts Modal State
  const [activeRouteModal, setActiveRouteModal] = useState(null)

  // Booking Checkout Drawer State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [activeTrain, setActiveTrain] = useState(null)
  const [activeClass, setActiveClass] = useState(null)
  const [passengers, setPassengers] = useState([
    { name: user?.full_name || 'Passenger 1', age: 29, gender: 'Male', berth_preference: 'No Preference' }
  ])
  const [contactEmail, setContactEmail] = useState(user?.email || 'passenger@railresq.gov.in')
  const [contactPhone, setContactPhone] = useState('+91 94440 12345')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState(null)

  // Fetch stations on load
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await api.get('/booking/stations')
        const stList = Array.isArray(res.data) ? res.data : (res.data?.stations || [])
        setStations(stList)
      } catch (err) {
        console.error('Error fetching station directory:', err)
      }
    }
    fetchStations()
  }, [])

  // Auto-execute search
  const executeSearch = async (src, dest, date, cls) => {
    if (!src || !dest) return
    if (src === dest) {
      setErrorMsg('Source and Destination stations cannot be identical.')
      return
    }

    setSearching(true)
    setErrorMsg(null)
    setSearchInitiated(true)

    try {
      const params = {
        source: src,
        destination: dest,
        date: date
      }
      if (cls && cls !== 'ALL') params.travel_class = cls

      const res = await api.get('/booking/trains/search', { params })
      const trainList = Array.isArray(res.data) ? res.data : (res.data?.trains || [])
      setTrains(trainList)

      // Auto select first available class for each train
      const defaults = {}
      trainList.forEach(t => {
        if (t.classes && t.classes.length > 0) {
          defaults[t.train_number] = t.classes[0]
        }
      })
      setSelectedClassPerTrain(defaults)
    } catch (err) {
      console.error('Train search error:', err)
      setErrorMsg('Unable to retrieve train availability. Please check station and journey date.')
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    executeSearch(sourceCode, destCode, journeyDate, selectedClass)
  }, [])

  const handleSwapStations = () => {
    const temp = sourceCode
    setSourceCode(destCode)
    setDestCode(temp)
    executeSearch(destCode, temp, journeyDate, selectedClass)
  }

  const handleSelectPopularRoute = (route) => {
    setSourceCode(route.src)
    setDestCode(route.dest)
    executeSearch(route.src, route.dest, journeyDate, selectedClass)
  }

  const handleSelectClass = (train, cls) => {
    setSelectedClassPerTrain(prev => ({
      ...prev,
      [train.train_number]: cls
    }))
  }

  const handleOpenBooking = (train) => {
    const cls = selectedClassPerTrain[train.train_number] || train.classes[0]
    setActiveTrain(train)
    setActiveClass(cls)
    setPassengers([
      { name: user?.full_name || 'Passenger 1', age: 29, gender: 'Male', berth_preference: 'No Preference' }
    ])
    setBookingError(null)
    setCheckoutModalOpen(true)
  }

  const handleAddPassenger = () => {
    if (passengers.length >= 6) return
    setPassengers([
      ...passengers,
      { name: '', age: 25, gender: 'Male', berth_preference: 'No Preference' }
    ])
  }

  const handleRemovePassenger = (index) => {
    if (passengers.length <= 1) return
    setPassengers(passengers.filter((_, i) => i !== index))
  }

  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers]
    updated[index][field] = value
    setPassengers(updated)
  }

  const calculateTotalFare = () => {
    if (!activeClass) return { baseTotal: 0, resCharge: 0, sfCharge: 0, gst: 0, grandTotal: 0 }
    const baseUnit = activeClass.base_fare || 500
    const count = passengers.length
    const baseTotal = baseUnit * count
    const resCharge = (['1A', 'EC'].includes(activeClass.travel_class) ? 60 : 40) * count
    const sfCharge = 45.0
    const isAc = ['1A', '2A', '3A', 'CC', 'EC'].includes(activeClass.travel_class)
    const gst = isAc ? Math.round((baseTotal + resCharge + sfCharge) * 0.05 * 100) / 100 : 0
    return {
      baseTotal,
      resCharge,
      sfCharge,
      gst,
      grandTotal: Math.round((baseTotal + resCharge + sfCharge + gst) * 100) / 100
    }
  }

  const handleConfirmBooking = async () => {
    for (let p of passengers) {
      if (!p.name || p.name.trim().length === 0) {
        setBookingError('Please enter full name for all passengers.')
        return
      }
      if (!p.age || p.age < 1 || p.age > 120) {
        setBookingError('Please enter valid age for all passengers.')
        return
      }
    }

    setBookingLoading(true)
    setBookingError(null)

    try {
      const payload = {
        train_number: activeTrain.train_number,
        journey_date: journeyDate,
        travel_class: activeClass.travel_class,
        passengers: passengers.map(p => ({
          name: p.name.trim(),
          age: parseInt(p.age),
          gender: p.gender,
          berth_preference: p.berth_preference
        })),
        payment_method: paymentMethod,
        simulate_failure: false,
        contact_email: contactEmail,
        contact_phone: contactPhone
      }

      const res = await api.post('/booking/initiate', payload)

      if (res.data.success) {
        setCheckoutModalOpen(false)
        navigate(`/ticket/${res.data.demo_pnr}`)
      } else {
        setBookingError(res.data.message || 'Payment simulation failed. Try again.')
      }
    } catch (err) {
      console.error('Booking submission failed:', err)
      setBookingError(err.response?.data?.detail || 'Booking failed. Please try again.')
    } finally {
      setBookingLoading(false)
    }
  }

  // Filter & Sort trains
  const filteredTrains = (Array.isArray(trains) ? trains : [])
    .filter(t => {
      if (filterType === 'VANDE_BHARAT' && !t.train_type?.includes('Vande')) return false
      if (filterType === 'SUPERFAST' && t.train_type !== 'Superfast') return false
      if (filterType === 'SHATABDI_RAJDHANI' && !['Shatabdi', 'Rajdhani'].includes(t.train_type)) return false
      if (availableOnly) {
        const hasAvail = t.classes?.some(c => c.status_badge === 'AVAILABLE')
        if (!hasAvail) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'DEPARTURE') return (a.departure_time || '').localeCompare(b.departure_time || '')
      if (sortBy === 'DURATION') return (a.duration_hours || '').localeCompare(b.duration_hours || '')
      return 0
    })

  const fareEstimate = calculateTotalFare()

  const getStationLabel = (code) => {
    const s = stations.find(st => st.code === code)
    return s ? `${s.name} (${s.code})` : code
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 text-slate-100">
      
      {/* 1. RailYatri Signature Search Deck (Clean, Spacious, Uncluttered) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        
        {/* Header title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black text-white tracking-tight">Train Ticket Booking</span>
              <span className="text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-700/60 px-2.5 py-0.5 rounded-full font-mono">
                RAILYATRI ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live seat availability, transparent fare calculation & simulated demo PNR confirmation.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/my-bookings"
              className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span>My Bookings</span>
            </Link>
            <Link
              to="/pnr-status"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify PNR</span>
            </Link>
          </div>
        </div>

        {/* Search Inputs Row */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            executeSearch(sourceCode, destCode, journeyDate, selectedClass)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Origin (From) */}
            <div className="md:col-span-4 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-2xl p-3 transition focus-within:border-blue-500">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                From Station
              </label>
              <select
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
              >
                {stations.map(st => (
                  <option key={st.code} value={st.code} className="bg-slate-900 text-white">
                    {st.name} ({st.code}) - {st.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Station Swap Button */}
            <div className="md:col-span-1 flex justify-center">
              <button
                type="button"
                onClick={handleSwapStations}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-blue-600 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition shadow-md active:rotate-180 duration-200"
                title="Swap Stations"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Destination (To) */}
            <div className="md:col-span-4 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-2xl p-3 transition focus-within:border-blue-500">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                To Station
              </label>
              <select
                value={destCode}
                onChange={(e) => setDestCode(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
              >
                {stations.map(st => (
                  <option key={st.code} value={st.code} className="bg-slate-900 text-white">
                    {st.name} ({st.code}) - {st.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Journey Date */}
            <div className="md:col-span-3 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-2xl p-3 transition focus-within:border-blue-500">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Journey Date
              </label>
              <input
                type="date"
                value={journeyDate}
                onChange={(e) => setJourneyDate(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Search Button & Popular Route Chips */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                Popular:
              </span>
              {POPULAR_ROUTES.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectPopularRoute(r)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition border ${
                    sourceCode === r.src && destCode === r.dest
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={searching}
              className="w-full sm:w-auto px-8 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs sm:text-sm font-black transition shadow-lg shadow-orange-950/30 flex items-center justify-center space-x-2 shrink-0"
            >
              <Search className={`w-4 h-4 ${searching ? 'animate-spin' : ''}`} />
              <span>{searching ? 'Checking Seats...' : 'SEARCH TRAINS'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Results Header & Clean Filter Pills */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-white">
            {filteredTrains.length} Trains Available
          </span>
          <span className="text-xs text-slate-400">
            from {sourceCode} to {destCode}
          </span>
        </div>

        {/* Clean Filter Options */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              filterType === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('VANDE_BHARAT')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              filterType === 'VANDE_BHARAT' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Vande Bharat
          </button>
          <button
            onClick={() => setFilterType('SUPERFAST')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
              filterType === 'SUPERFAST' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            Superfast
          </button>
          <button
            onClick={() => setAvailableOnly(!availableOnly)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold border transition ${
              availableOnly ? 'bg-emerald-950 text-emerald-300 border-emerald-600' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            🟢 Available Only
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl px-2.5 py-1 focus:outline-none"
          >
            <option value="DEPARTURE">Departure Time</option>
            <option value="DURATION">Fastest Journey</option>
          </select>
        </div>
      </div>

      {/* 3. Train Results Cards (Authentic RailYatri Style) */}
      {searching ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-white">Querying Indian Railways Seat Availability...</h3>
          <p className="text-xs text-slate-400">Loading quota inventory and real-time confirmation probabilities.</p>
        </div>
      ) : filteredTrains.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-3">
          <Train className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No trains matching your filter</h3>
          <p className="text-xs text-slate-400">Try turning off 'Available Only' or pick a popular corridor above.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredTrains.map((train) => {
            const currentSelectedClass = selectedClassPerTrain[train.train_number] || train.classes[0]

            return (
              <div
                key={train.train_number}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl transition space-y-4"
              >
                {/* Train Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2.5 flex-wrap">
                    <img 
                      src={getTrainPhoto(train)} 
                      alt={train.train_name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0 shadow-md"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = '/trains/vande-bharat-express.jpg'
                      }}
                    />
                    <span className="font-mono text-xs font-black bg-blue-900/80 text-blue-200 border border-blue-700 px-2 py-0.5 rounded-lg">
                      #{train.train_number}
                    </span>
                    <h3 className="text-base font-black text-white tracking-tight">
                      {train.train_name}
                    </h3>
                    <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 uppercase">
                      {train.train_type}
                    </span>
                    {train.punctuality_pct && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                        {train.punctuality_pct}% Punctual
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <div className="flex items-center space-x-1 font-mono text-[10px] font-bold">
                      <span className="text-slate-500 mr-1 font-normal">Runs:</span>
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                        <span key={idx} className="w-4 h-4 rounded-full bg-slate-950 text-emerald-400 border border-emerald-700/60 flex items-center justify-center">
                          {day}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveRouteModal(train)}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline flex items-center space-x-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Timetable</span>
                    </button>
                  </div>
                </div>

                {/* RailYatri 3-Column Journey Timeline */}
                <div className="grid grid-cols-12 gap-3 bg-slate-950/90 p-4 rounded-2xl border border-slate-800/80 items-center">
                  
                  {/* Departure */}
                  <div className="col-span-4 text-left">
                    <span className="text-2xl font-black font-mono text-white tracking-tight">
                      {train.departure_time}
                    </span>
                    <div className="text-xs font-bold text-slate-200 truncate">
                      {train.source_station_name}
                    </div>
                    <span className="text-[11px] font-mono font-bold text-blue-400">
                      {train.source_station_code}
                    </span>
                  </div>

                  {/* Duration Line */}
                  <div className="col-span-4 text-center space-y-1">
                    <span className="text-xs font-bold font-mono text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full">
                      {train.duration_hours}
                    </span>
                    <div className="w-full flex items-center justify-center space-x-1 relative my-1">
                      <div className="h-0.5 w-full bg-slate-700 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {train.distance_km} km &bull; Direct Route
                    </span>
                  </div>

                  {/* Arrival */}
                  <div className="col-span-4 text-right">
                    <span className="text-2xl font-black font-mono text-white tracking-tight">
                      {train.arrival_time}
                    </span>
                    <div className="text-xs font-bold text-slate-200 truncate">
                      {train.destination_station_name}
                    </div>
                    <span className="text-[11px] font-mono font-bold text-emerald-400">
                      {train.destination_station_code}
                    </span>
                  </div>
                </div>

                {/* RailYatri Signature Horizontal Class Availability Strip */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Select Travel Class:</span>
                    <span className="text-[10px] text-slate-500 font-normal">Click class box to preview fare & reserve</span>
                  </div>

                  {/* Horizontal Class Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                    {train.classes.map((cls) => {
                      const isSelected = currentSelectedClass?.travel_class === cls.travel_class
                      const isAvailable = cls.status_badge === 'AVAILABLE'

                      return (
                        <div
                          key={cls.travel_class}
                          onClick={() => handleSelectClass(train, cls)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                            isSelected
                              ? 'bg-orange-950/40 border-orange-500 shadow-md shadow-orange-950/30 ring-1 ring-orange-500/50'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-sm font-black text-white">
                              {cls.travel_class}
                            </span>
                            <span className="font-mono text-xs font-bold text-amber-400">
                              ₹{cls.total_fare}
                            </span>
                          </div>

                          <div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg block text-center ${
                              isAvailable
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-bold'
                                : 'bg-amber-950 text-amber-300 border border-amber-700/80'
                            }`}>
                              {cls.status_text}
                            </span>
                            <span className="text-[9px] text-slate-400 block text-center mt-1 font-mono">
                              {cls.confirm_probability || '98% Confirm'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Selected Class Action Drawer Strip (RailYatri Signature Checkout Bar) */}
                {currentSelectedClass && (
                  <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-800/80 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-xs">
                        {currentSelectedClass.travel_class}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center space-x-2">
                          <span>Class: {currentSelectedClass.travel_class}</span>
                          <span className="text-emerald-400 font-normal">({currentSelectedClass.status_text})</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Total Ticket Fare: <strong className="text-amber-400 font-mono">₹{currentSelectedClass.total_fare}</strong> / passenger
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenBooking(train)}
                      className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg transition flex items-center justify-center space-x-1.5 self-end sm:self-auto shrink-0"
                    >
                      <span>BOOK TICKET NOW</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 4. Timetable & Halts Modal */}
      {activeRouteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-3xl">
              <div>
                <span className="font-mono text-xs font-black bg-blue-600 text-white px-2 py-0.5 rounded">
                  #{activeRouteModal.train_number}
                </span>
                <h3 className="text-base font-black text-white mt-1">{activeRouteModal.train_name}</h3>
                <p className="text-xs text-slate-400">Official Station Halts & Schedule</p>
              </div>
              <button
                onClick={() => setActiveRouteModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              {(activeRouteModal.route_stations || []).map((st, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div>
                    <div className="font-bold text-white">{st.name} ({st.code})</div>
                    <span className="text-[10px] text-slate-500 font-mono">Platform {st.platform || (idx % 3 + 1)}</span>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-slate-300">Arr: <strong>{st.arr}</strong></div>
                    <div className="text-slate-300">Dep: <strong>{st.dep}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. RailYatri Booking Modal (Clean, Numbered Steps, Uncluttered) */}
      {checkoutModalOpen && activeTrain && activeClass && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-blue-950 to-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider font-mono">
                  Confirm Ticket Reservation
                </span>
                <h3 className="text-lg font-black text-white">
                  {activeTrain.train_name} (#{activeTrain.train_number})
                </h3>
                <p className="text-xs text-slate-400">
                  {activeTrain.source_station_name} → {activeTrain.destination_station_name} • Class: <strong className="text-cyan-300">{activeClass.travel_class}</strong>
                </p>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              
              {bookingError && (
                <div className="p-3 bg-rose-950 border border-rose-700 rounded-xl text-xs text-rose-200">
                  {bookingError}
                </div>
              )}

              {/* Step 1: Passenger Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-400">
                    1. Passenger Details ({passengers.length}/6)
                  </h4>
                  {passengers.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddPassenger}
                      className="text-xs text-cyan-400 hover:underline font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Passenger</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {passengers.map((p, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Passenger #{idx + 1}</span>
                        {passengers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePassenger(idx)}
                            className="text-rose-400 hover:text-rose-300 text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-6">
                          <input
                            type="text"
                            placeholder="Full Name as per ID"
                            value={p.name}
                            onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            placeholder="Age"
                            min="1"
                            max="120"
                            value={p.age}
                            onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="col-span-3">
                          <select
                            value={p.gender}
                            onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Transgender">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <select
                          value={p.berth_preference}
                          onChange={(e) => handlePassengerChange(idx, 'berth_preference', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
                        >
                          {BERTH_PREFERENCES.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Contact Information */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-blue-400">
                  2. Contact for SMS & Digital Ticket
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Mobile Number"
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Email Address"
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Step 3: Fare Breakdown */}
              <div className="bg-slate-950 p-3.5 rounded-2xl space-y-1.5 text-xs border border-slate-800">
                <div className="flex justify-between text-slate-400">
                  <span>Base Ticket Fare ({passengers.length} passenger{passengers.length > 1 ? 's' : ''}):</span>
                  <span>₹{fareEstimate.baseTotal}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Reservation & Superfast Charges:</span>
                  <span>₹{fareEstimate.resCharge + fareEstimate.sfCharge}</span>
                </div>
                {fareEstimate.gst > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>GST (5% for AC Class):</span>
                    <span>₹{fareEstimate.gst}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-800 pt-1.5 text-sm font-black text-emerald-400">
                  <span>Grand Total to Pay:</span>
                  <span>₹{fareEstimate.grandTotal}</span>
                </div>
              </div>

              {/* Step 4: Simulated Payment Mode */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-blue-400">
                  3. Simulated Instant Payment
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {['UPI', 'NETBANKING', 'CARD'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        paymentMethod === m
                          ? 'bg-orange-950/80 border-orange-500 text-orange-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {m === 'UPI' ? '⚡ UPI Instant' : m === 'NETBANKING' ? '🏦 NetBanking' : '💳 Debit Card'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400">Total Payable Amount</span>
                <div className="text-lg font-black text-emerald-400">₹{fareEstimate.grandTotal}</div>
              </div>

              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black px-6 py-2.5 rounded-xl text-xs shadow-xl transition flex items-center space-x-2"
              >
                {bookingLoading ? (
                  <span>Generating Demo PNR & Ticket...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Generate Demo Ticket</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
