import React, { useState, useEffect } from 'react'
import { 
  Car, 
  Bike, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Phone, 
  KeyRound, 
  Navigation, 
  X, 
  ChevronRight,
  Sparkles,
  Search
} from 'lucide-react'
import api from '../../services/api'

// Local high-definition transport fleet assets
const TRANSPORT_IMAGES = {
  'BIKE_TAXI': '/transport/bike-taxi.jpg',
  'AUTO_RICKSHAW': '/transport/auto-rickshaw.jpg',
  'MINI_CAB': '/transport/cab-sedan.jpg',
  'SEDAN_CAB': '/transport/cab-sedan.jpg',
  'SUV_CAB': '/transport/transport-fleet.jpg'
}

export default function LocalTransportPage() {
  const [vehicles, setVehicles] = useState([])
  const [pickup, setPickup] = useState('Chennai Central Railway Station (Main Portico)')
  const [drop, setDrop] = useState('Marina Beach Promenade, Chennai')
  const [distanceKm, setDistanceKm] = useState(4.8)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [loading, setLoading] = useState(true)

  // Booking states
  const [bookingInProgress, setBookingInProgress] = useState(false)
  const [activeRide, setActiveRide] = useState(null)
  const [myRides, setMyRides] = useState([])
  const [activeTab, setActiveTab] = useState('book') // 'book' | 'my-rides'

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const res = await api.get('/transport/vehicles')
      setVehicles(res.data)
      if (res.data.length > 0) {
        setSelectedVehicle(res.data[0])
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyRides = async () => {
    try {
      const res = await api.get('/transport/rides/my-rides')
      setMyRides(res.data)
    } catch (err) {
      console.error('Error fetching past rides:', err)
    }
  }

  useEffect(() => {
    fetchVehicles()
  }, [])

  useEffect(() => {
    if (activeTab === 'my-rides') {
      fetchMyRides()
    }
  }, [activeTab])

  // Calculate fare
  const computeFare = (v) => {
    if (!v) return 0
    return Math.round(v.base_fare + (distanceKm * v.per_km_rate))
  }

  const handleBookRide = async () => {
    if (!selectedVehicle) return
    setBookingInProgress(true)
    try {
      const fare = computeFare(selectedVehicle)
      const res = await api.post('/transport/book', {
        vehicle_type: selectedVehicle.vehicle_type,
        pickup_location: pickup,
        drop_location: drop,
        distance_km: distanceKm,
        estimated_fare: fare,
        payment_method: 'UPI_SIMULATED'
      })
      setActiveRide(res.data)
    } catch (err) {
      console.error('Ride booking error:', err)
      alert('Unable to confirm ride booking: ' + (err.response?.data?.detail || err.message))
    } finally {
      setBookingInProgress(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      
      {/* Top Banner (Rapido / Ola / Uber Style) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-700 p-6 md:p-8 text-white shadow-xl shadow-amber-950/30">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-amber-200 border border-amber-300/30">
            <Bike className="w-3.5 h-3.5 text-yellow-300" />
            <span>Station Quick Transit Hub • Rapido & Cabs</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950">
            Instant Bike Taxis, Autos & Cabs at Railway Station
          </h1>
          <p className="text-sm md:text-base text-slate-900 font-medium leading-relaxed">
            Pre-fixed transparent fares, verified local drivers, and zero surge pricing for rail passengers stepping off the train.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button 
              onClick={() => setActiveTab('book')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow ${
                activeTab === 'book' ? 'bg-slate-950 text-white' : 'bg-black/20 text-slate-950 hover:bg-black/30'
              }`}
            >
              🚖 Book Station Ride
            </button>
            <button 
              onClick={() => setActiveTab('my-rides')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow ${
                activeTab === 'my-rides' ? 'bg-slate-950 text-white' : 'bg-black/20 text-slate-950 hover:bg-black/30'
              }`}
            >
              📋 My Rides
            </button>
          </div>
        </div>

        {/* Academic Simulation Tag */}
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg border border-black/20 text-[11px] text-amber-200 font-mono">
          Demo Transit • Fleet Dispatch Simulation
        </div>
      </div>

      {activeTab === 'book' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Route Inputs & Vehicle Fleet */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* Route Selector Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-amber-400" />
                <span>Select Pickup & Drop Locations</span>
              </h3>

              <div className="space-y-3">
                {/* Pickup */}
                <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider block">Pickup Point</label>
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-100 font-medium focus:outline-none"
                    />
                  </div>
                </div>

                {/* Drop */}
                <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></span>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider block">Drop Destination</label>
                    <input
                      type="text"
                      value={drop}
                      onChange={(e) => setDrop(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-100 font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Distance Slider / Chip */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Estimated Journey Distance:</span>
                <span className="font-bold text-amber-400 font-mono">{distanceKm} KM (~{Math.round(distanceKm * 3.5)} Mins)</span>
              </div>
            </div>

            {/* Vehicle Options List */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Car className="w-4 h-4 text-amber-400" />
                <span>Available Local Transport Options</span>
              </h3>

              {loading ? (
                <div className="text-center p-8">
                  <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-slate-400">Discovering station fleet...</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {vehicles.map(v => {
                    const isSelected = selectedVehicle?.id === v.id
                    const fare = computeFare(v)
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVehicle(v)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/30'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-14 h-14 rounded-xl overflow-hidden border shrink-0 transition-transform ${
                            isSelected ? 'border-amber-400 ring-2 ring-amber-400/30 scale-105' : 'border-slate-800'
                          }`}>
                            <img 
                              src={TRANSPORT_IMAGES[v.vehicle_type] || '/transport/transport-fleet.jpg'} 
                              alt={v.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-bold text-slate-100">{v.name}</h4>
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                                {v.capacity_passengers} Seat{v.capacity_passengers > 1 ? 's' : ''}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                              <Clock className="w-3 h-3 text-emerald-400" />
                              <span>{v.eta_mins} mins away from station</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black text-amber-400">₹{fare}</div>
                          <span className="text-[10px] text-slate-500">₹{v.per_km_rate}/km rate</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Fare Breakdown & Instant Booking */}
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Trip & Fare Summary</span>
              </h3>

              {selectedVehicle ? (
                <div className="space-y-3">
                  <div className="bg-slate-950 p-3 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Vehicle Selected:</span>
                      <span className="font-bold text-slate-200">{selectedVehicle.name}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Base Fare:</span>
                      <span>₹{selectedVehicle.base_fare}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Distance Charge ({distanceKm} km):</span>
                      <span>₹{Math.round(distanceKm * selectedVehicle.per_km_rate)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Surge Pricing:</span>
                      <span className="text-emerald-400 font-bold">₹0 (ZERO SURGE)</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-black text-amber-400">
                      <span>Total Estimated Fare:</span>
                      <span>₹{computeFare(selectedVehicle)}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl space-y-1">
                    <p className="text-slate-300 font-medium">🛡️ Safe Ride Guarantee:</p>
                    <p>• Verified commercial driver license</p>
                    <p>• 4-digit OTP security match</p>
                    <p>• Direct RPF Emergency SOS integration</p>
                  </div>

                  <button
                    onClick={handleBookRide}
                    disabled={bookingInProgress}
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black py-3 rounded-xl text-xs shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    {bookingInProgress ? (
                      <span>Dispatching Nearest Driver...</span>
                    ) : (
                      <>
                        <Car className="w-4 h-4" />
                        <span>Book {selectedVehicle.name} (₹{computeFare(selectedVehicle)})</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Select a vehicle from the list to view fare.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* My Past Rides */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <Car className="w-5 h-5 text-amber-400" />
              <span>Your Ride History</span>
            </h2>
            <button onClick={fetchMyRides} className="text-xs text-amber-400 font-semibold hover:underline">
              Refresh History
            </button>
          </div>

          {myRides.length === 0 ? (
            <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <Car className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-medium">No rides booked yet.</p>
              <button 
                onClick={() => setActiveTab('book')}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400"
              >
                Book Your First Station Ride
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRides.map(r => (
                <div key={r.ride_reference} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">{r.ride_reference}</span>
                      <h4 className="text-sm font-bold text-slate-100">{r.vehicle_type}</h4>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">
                      {r.ride_status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Route:</span>
                      <span className="font-semibold text-slate-300 line-clamp-1">{r.pickup_location} → {r.drop_location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Driver & Vehicle:</span>
                      <span className="text-slate-300 font-medium">{r.driver_name} ({r.vehicle_number})</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1 font-bold text-slate-200">
                      <span>Fare Paid:</span>
                      <span className="text-amber-400">₹{r.estimated_fare}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ride Confirmed Modal */}
      {activeRide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl animate-scale-in">
            <div className="w-14 h-14 bg-amber-950 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-600/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">{activeRide.ride_reference}</span>
              <h3 className="text-xl font-black text-slate-100">Driver Assigned!</h3>
              <p className="text-xs text-slate-400">
                Your driver is approaching the station pickup portico.
              </p>
            </div>

            {/* OTP Badge */}
            <div className="bg-gradient-to-r from-amber-950 to-slate-950 border border-amber-500/40 p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-amber-300">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">Start Ride OTP:</span>
              </div>
              <span className="text-xl font-black font-mono tracking-widest text-white bg-slate-900 px-3 py-1 rounded-xl border border-amber-500">
                {activeRide.otp_code}
              </span>
            </div>

            {/* Driver Details Card */}
            <div className="bg-slate-950 p-3 rounded-2xl text-xs text-left space-y-2 border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Driver:</span>
                <span className="font-bold text-slate-200">{activeRide.driver_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vehicle No:</span>
                <span className="font-mono font-bold text-amber-400">{activeRide.vehicle_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="font-bold text-slate-200">{activeRide.driver_phone}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1">
                <span className="text-slate-400">Estimated Fare:</span>
                <span className="font-bold text-emerald-400">₹{activeRide.estimated_fare}</span>
              </div>
            </div>

            <button
              onClick={() => { setActiveRide(null); setActiveTab('my-rides'); }}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 rounded-xl text-xs transition"
            >
              Track Driver Live on Map
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
