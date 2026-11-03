import React, { useState, useEffect } from 'react'
import { 
  Utensils, 
  Search, 
  MapPin, 
  Clock, 
  Star, 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  CheckCircle2, 
  Train, 
  ChevronRight, 
  Sparkles,
  Phone,
  Flame,
  Leaf,
  CreditCard,
  Truck
} from 'lucide-react'
import api from '../../services/api'

// Local high-resolution food image assets
const RESTAURANT_IMAGES = {
  'Murugan Idli Shop': '/food/murugan-idli.jpg',
  'Dindigul Thalappakatti Biryani': '/food/dindigul-biryani.jpg',
  'Hotel Saravana Bhavan': '/food/saravana-bhavan.jpg',
  'Junior Kuppanna (Kongu Cuisine)': '/food/junior-kuppanna.jpg',
  'Vidyarthi Bhavan Express': '/food/vidyarthi-bhavan.jpg'
}

const DEFAULT_FOOD_IMG = '/food/vidyarthi-bhavan.jpg'

const getRestaurantImage = (r) => {
  if (r?.image_url && r.image_url.startsWith('/food/')) return r.image_url
  if (r?.name && RESTAURANT_IMAGES[r.name]) return RESTAURANT_IMAGES[r.name]
  const name = (r?.name || '').toLowerCase()
  if (name.includes('murugan') || name.includes('idli')) return '/food/murugan-idli.jpg'
  if (name.includes('thalappakatti') || name.includes('biryani')) return '/food/dindigul-biryani.jpg'
  if (name.includes('saravana') || name.includes('thali') || name.includes('veg')) return '/food/saravana-bhavan.jpg'
  if (name.includes('kuppanna') || name.includes('kongu') || name.includes('chicken')) return '/food/junior-kuppanna.jpg'
  if (name.includes('vidyarthi') || name.includes('dosa') || name.includes('bhavan')) return '/food/vidyarthi-bhavan.jpg'
  return DEFAULT_FOOD_IMG
}

const getDishImage = (item) => {
  if (item?.image_url && item.image_url.trim()) return item.image_url
  const name = (item?.name || '').toLowerCase()
  if (name.includes('biryani') || name.includes('rice') || name.includes('pulao')) return '/food/dindigul-biryani.jpg'
  if (name.includes('idli') || name.includes('vada') || name.includes('sambar')) return '/food/murugan-idli.jpg'
  if (name.includes('dosa') || name.includes('coffee') || name.includes('tiffin')) return '/food/vidyarthi-bhavan.jpg'
  if (name.includes('thali') || name.includes('meal') || name.includes('paneer') || name.includes('curd')) return '/food/saravana-bhavan.jpg'
  if (name.includes('chicken') || name.includes('mutton') || name.includes('chukka') || name.includes('parotta') || name.includes('curry')) return '/food/junior-kuppanna.jpg'
  return '/food/vidyarthi-bhavan.jpg'
}

export default function FoodOrderingPage() {
  const [restaurants, setRestaurants] = useState([])
  const [selectedStation, setSelectedStation] = useState('ALL')
  const [vegOnly, setVegOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Selected restaurant for menu view
  const [activeRestaurant, setActiveRestaurant] = useState(null)
  const [restaurantMenu, setRestaurantMenu] = useState(null)
  const [menuLoading, setMenuLoading] = useState(false)

  // Cart: { [itemId]: { item, quantity } }
  const [cart, setCart] = useState({})
  const [showCartDrawer, setShowCartDrawer] = useState(false)

  // Checkout modal
  const [showCheckout, setShowCheckout] = useState(false)
  const [passengerName, setPassengerName] = useState('Ravi Kumar')
  const [passengerPhone, setPassengerPhone] = useState('+91 98401 22334')
  const [trainNumber, setTrainNumber] = useState('12637')
  const [coachNumber, setCoachNumber] = useState('B4')
  const [seatBerth, setSeatBerth] = useState('42 (Lower Berth)')
  const [paymentMethod, setPaymentMethod] = useState('UPI_SIMULATED')
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [placedOrder, setPlacedOrder] = useState(null)

  // My Orders tab
  const [activeTab, setActiveTab] = useState('restaurants') // 'restaurants' | 'my-orders'
  const [myOrders, setMyOrders] = useState([])

  const STATIONS = [
    { code: 'ALL', name: 'All Stations' },
    { code: 'MAS', name: 'Chennai Central (MAS)' },
    { code: 'MS', name: 'Chennai Egmore (MS)' },
    { code: 'MDU', name: 'Madurai Jn (MDU)' },
    { code: 'CBE', name: 'Coimbatore Jn (CBE)' },
    { code: 'SBC', name: 'Bengaluru City (SBC)' }
  ]

  const fetchRestaurants = async () => {
    setLoading(true)
    try {
      const params = {}
      if (selectedStation !== 'ALL') params.station = selectedStation
      if (vegOnly) params.veg_only = true
      if (searchQuery.trim()) params.search = searchQuery.trim()

      const res = await api.get('/food/restaurants', { params })
      setRestaurants(res.data)
    } catch (err) {
      console.error('Error fetching restaurants:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRestaurantDetail = async (id) => {
    setMenuLoading(true)
    try {
      const res = await api.get(`/food/restaurants/${id}`)
      setRestaurantMenu(res.data)
      setActiveRestaurant(res.data)
    } catch (err) {
      console.error('Error fetching menu:', err)
    } finally {
      setMenuLoading(false)
    }
  }

  const fetchMyOrders = async () => {
    try {
      const res = await api.get('/food/orders/my-orders')
      setMyOrders(res.data)
    } catch (err) {
      console.error('Error fetching my orders:', err)
    }
  }

  useEffect(() => {
    fetchRestaurants()
  }, [selectedStation, vegOnly])

  useEffect(() => {
    if (activeTab === 'my-orders') {
      fetchMyOrders()
    }
  }, [activeTab])

  // Cart operations
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev[item.id]
      const newQty = (existing?.quantity || 0) + 1
      return {
        ...prev,
        [item.id]: { item, quantity: newQty }
      }
    })
  }

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const existing = prev[itemId]
      if (!existing) return prev
      if (existing.quantity <= 1) {
        const copy = { ...prev }
        delete copy[itemId]
        return copy
      }
      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity - 1 }
      }
    })
  }

  const cartItems = Object.values(cart)
  const cartSubtotal = cartItems.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0)
  const cartDeliveryFee = cartItems.length > 0 ? 30.0 : 0
  const cartGst = Math.round(cartSubtotal * 0.05)
  const cartTotal = cartSubtotal + cartDeliveryFee + cartGst

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (cartItems.length === 0) return

    setOrderSubmitting(true)
    try {
      const payload = {
        restaurant_id: activeRestaurant?.id || (restaurants[0]?.id || 1),
        delivery_station_code: selectedStation !== 'ALL' ? selectedStation : 'MAS',
        train_number: trainNumber,
        coach_number: coachNumber,
        seat_berth: seatBerth,
        passenger_name: passengerName,
        passenger_phone: passengerPhone,
        items: cartItems.map(c => ({
          item_id: c.item.id,
          name: c.item.name,
          price: c.item.price,
          quantity: c.quantity,
          is_veg: c.item.is_veg
        })),
        payment_method: paymentMethod
      }

      const res = await api.post('/food/orders', payload)
      setPlacedOrder(res.data)
      setCart({})
      setShowCheckout(false)
      setActiveRestaurant(null)
    } catch (err) {
      console.error('Order error:', err)
      alert('Failed to place food order: ' + (err.response?.data?.detail || err.message))
    } finally {
      setOrderSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 p-6 md:p-8 text-white shadow-xl shadow-orange-900/20">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-amber-200 border border-amber-300/30">
            <Utensils className="w-3.5 h-3.5 text-amber-300" />
            <span>IRCTC E-Catering Partner & Station Food Hub</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Order Delicious Meals Directly to Your Train Berth
          </h1>
          <p className="text-sm md:text-base text-amber-100/90 leading-relaxed">
            Hygienic food from top partner restaurants delivered right to your seat or station platform upon arrival.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button 
              onClick={() => setActiveTab('restaurants')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow ${
                activeTab === 'restaurants' ? 'bg-white text-orange-900' : 'bg-black/30 text-white hover:bg-black/40'
              }`}
            >
              🍽️ Explore Restaurants
            </button>
            <button 
              onClick={() => setActiveTab('my-orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow ${
                activeTab === 'my-orders' ? 'bg-white text-orange-900' : 'bg-black/30 text-white hover:bg-black/40'
              }`}
            >
              📦 My Food Orders
            </button>
          </div>
        </div>

        {/* Academic Prototype Notice */}
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-[11px] text-amber-200 font-mono">
          Demo Food Service • Academic Simulation
        </div>
      </div>

      {activeTab === 'restaurants' ? (
        <>
          {/* Filter Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
            
            {/* Station Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider shrink-0 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-orange-400" /> Station:
              </span>
              {STATIONS.map(st => (
                <button
                  key={st.code}
                  onClick={() => setSelectedStation(st.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                    selectedStation === st.code
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {st.name}
                </button>
              ))}
            </div>

            {/* Search & Veg Only */}
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search restaurant or dish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchRestaurants()}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                onClick={() => setVegOnly(!vegOnly)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  vegOnly
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pure Veg</span>
              </button>
            </div>
          </div>

          {/* Restaurant Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm">Discovering top railway partner eateries...</p>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-2xl">
              <Utensils className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold">No restaurants match your search criteria.</p>
              <button 
                onClick={() => { setSelectedStation('ALL'); setVegOnly(false); setSearchQuery('') }} 
                className="mt-3 text-xs text-orange-400 hover:underline font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {restaurants.map(r => (
                <div 
                  key={r.id} 
                  className="bg-slate-900/90 border border-slate-800 hover:border-orange-500/50 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-orange-950/20 flex flex-col justify-between"
                >
                  <div>
                    {/* Header Image with Photo Banner & Gradient Overlay */}
                    <div className="h-44 relative overflow-hidden group bg-slate-950">
                      <img 
                        src={getRestaurantImage(r)} 
                        alt={r.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = DEFAULT_FOOD_IMG
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30 p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-amber-300 border border-amber-500/40 font-mono shadow-sm">
                            {r.station_code} • {r.city}
                          </span>
                          {r.is_veg_only && (
                            <span className="flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-600/50 backdrop-blur-md shadow-sm">
                              <Leaf className="w-3 h-3 text-emerald-400" />
                              <span>PURE VEG</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-end justify-between">
                          <div className="flex items-center space-x-1 bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-md">
                            <Star className="w-3.5 h-3.5 fill-current text-amber-200" />
                            <span>{r.rating ? r.rating.toFixed(1) : '4.5'}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs font-semibold text-slate-100 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/50 shadow-sm">
                            <Clock className="w-3 h-3 text-orange-400" />
                            <span>{r.delivery_time_mins} mins</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-2">
                      <h3 className="text-base font-bold text-slate-100">{r.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{r.cuisine_type}</p>
                      
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <span>₹{r.price_for_two} for two</span>
                        <span>Min. ₹{r.min_order_amount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => fetchRestaurantDetail(r.id)}
                      className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition"
                    >
                      <span>View Menu & Order</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* My Past Orders View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-orange-400" />
              <span>Your Food Order History</span>
            </h2>
            <button onClick={fetchMyOrders} className="text-xs text-orange-400 font-semibold hover:underline">
              Refresh Orders
            </button>
          </div>

          {myOrders.length === 0 ? (
            <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <Utensils className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-medium">You have not placed any train food orders yet.</p>
              <button 
                onClick={() => setActiveTab('restaurants')}
                className="px-4 py-2 bg-orange-600 text-white font-bold rounded-xl text-xs hover:bg-orange-500"
              >
                Explore Partner Eateries
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myOrders.map(o => (
                <div key={o.order_reference} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-orange-400 font-bold uppercase">{o.order_reference}</span>
                      <h4 className="text-sm font-bold text-slate-100">{o.restaurant_name}</h4>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                      {o.order_status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delivery Target:</span>
                      <span className="font-semibold text-slate-300">{o.train_coach} (Station {o.station_code})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Items:</span>
                      <span className="text-slate-300 font-medium">
                        {o.items?.map(it => `${it.quantity}x ${it.name}`).join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1 font-bold text-slate-200">
                      <span>Total Paid:</span>
                      <span className="text-emerald-400">₹{o.total_amount}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>ETA: {o.estimated_delivery_time}</span>
                    <span className="text-[11px] text-slate-400">{o.created_at ? new Date(o.created_at).toLocaleTimeString() : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Restaurant Menu Modal */}
      {activeRestaurant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header with Restaurant Photo Banner */}
            <div className="relative h-36 bg-slate-950 overflow-hidden border-b border-slate-800">
              <img 
                src={getRestaurantImage(activeRestaurant)} 
                alt={activeRestaurant.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = DEFAULT_FOOD_IMG
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-black/40 p-5 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-wider bg-black/70 px-2.5 py-0.5 rounded border border-orange-500/40 backdrop-blur-sm">
                    Station {activeRestaurant.station_code} • {activeRestaurant.city}
                  </span>
                  <h2 className="text-xl font-black text-slate-100 mt-1">{activeRestaurant.name}</h2>
                  <p className="text-xs text-slate-300">{activeRestaurant.cuisine_type}</p>
                </div>
                <button 
                  onClick={() => setActiveRestaurant(null)}
                  className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700/60 shadow-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Menu List */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              {menuLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs text-slate-400">Loading fresh menu...</p>
                </div>
              ) : restaurantMenu?.categories && Object.keys(restaurantMenu.categories).length > 0 ? (
                Object.entries(restaurantMenu.categories).map(([category, items]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-orange-400 border-b border-slate-800 pb-1">
                      {category}
                    </h3>
                    <div className="space-y-2.5">
                      {items.map(item => {
                        const inCartQty = cart[item.id]?.quantity || 0
                        return (
                          <div 
                            key={item.id} 
                            className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between hover:border-slate-700 transition gap-3"
                          >
                            <img 
                              src={getDishImage(item)}
                              alt={item.name}
                              className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0 shadow-sm"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = DEFAULT_FOOD_IMG
                              }}
                            />
                            <div className="space-y-1 pr-2 flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                  item.is_veg ? 'border-emerald-500' : 'border-rose-500'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}></span>
                                </span>
                                <h4 className="text-xs font-bold text-slate-200 truncate">{item.name}</h4>
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1">{item.description}</p>
                              <div className="text-xs font-bold text-amber-400">₹{item.price}</div>
                            </div>

                            {/* Cart Stepper */}
                            <div className="shrink-0">
                              {inCartQty > 0 ? (
                                <div className="flex items-center space-x-2 bg-orange-950 border border-orange-700 px-2 py-1 rounded-xl">
                                  <button onClick={() => removeFromCart(item.id)} className="text-orange-300 hover:text-white">
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-xs font-bold text-white px-1">{inCartQty}</span>
                                  <button onClick={() => addToCart(item)} className="text-orange-300 hover:text-white">
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="bg-slate-800 hover:bg-orange-600 text-slate-200 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>ADD</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-400 py-6">No menu items found for this restaurant.</p>
              )}
            </div>

            {/* Modal Footer with Cart Summary */}
            {cartItems.length > 0 && (
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400">{cartItems.length} items in cart</span>
                  <div className="text-base font-black text-emerald-400">₹{cartTotal} <span className="text-[11px] font-normal text-slate-400">(incl. taxes)</span></div>
                </div>
                <button
                  onClick={() => setShowCheckout(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-lg transition flex items-center space-x-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Proceed to Coach Delivery</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Cart Button (when items in cart and modal is closed) */}
      {!activeRestaurant && cartItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-bounce">
          <button
            onClick={() => setShowCheckout(true)}
            className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 font-bold text-sm border border-amber-400/40"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>{cartItems.length} Items (₹{cartTotal})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Train className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-bold text-slate-100">Coach Delivery Checkout</h3>
              </div>
              <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Passenger Name</label>
                  <input
                    type="text"
                    required
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Coach & Berth Delivery */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center">
                  <MapPin className="w-3 h-3 mr-1" /> Seat / Berth Delivery Target
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Train No.</label>
                    <input
                      type="text"
                      required
                      value={trainNumber}
                      onChange={(e) => setTrainNumber(e.target.value)}
                      className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Coach</label>
                    <input
                      type="text"
                      required
                      value={coachNumber}
                      onChange={(e) => setCoachNumber(e.target.value)}
                      className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Seat / Berth</label>
                    <input
                      type="text"
                      required
                      value={seatBerth}
                      onChange={(e) => setSeatBerth(e.target.value)}
                      className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Order Bill Summary */}
              <div className="bg-slate-950 p-3 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Items Subtotal:</span>
                  <span>₹{cartSubtotal}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Platform Delivery Fee:</span>
                  <span>₹{cartDeliveryFee}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST & Service Charge (5%):</span>
                  <span>₹{cartGst}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1.5 text-sm font-black text-emerald-400">
                  <span>Grand Total:</span>
                  <span>₹{cartTotal}</span>
                </div>
              </div>

              {/* Simulated Payment */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Payment Simulation</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI_SIMULATED')}
                    className={`p-2 rounded-xl border text-xs font-bold text-left transition ${
                      paymentMethod === 'UPI_SIMULATED' ? 'bg-orange-950/80 border-orange-500 text-orange-200' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    ⚡ UPI Instant (Demo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                    className={`p-2 rounded-xl border text-xs font-bold text-left transition ${
                      paymentMethod === 'CASH_ON_DELIVERY' ? 'bg-orange-950/80 border-orange-500 text-orange-200' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    💵 Cash at Seat
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={orderSubmitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg transition flex items-center justify-center space-x-2"
              >
                {orderSubmitting ? (
                  <span>Dispatching Order...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Deliver to Coach (₹{cartTotal})</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order Confirmed Success Modal */}
      {placedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl animate-scale-in">
            <div className="w-14 h-14 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-600/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-orange-400 font-bold uppercase">{placedOrder.order_reference}</span>
              <h3 className="text-xl font-black text-slate-100">Food Order Confirmed!</h3>
              <p className="text-xs text-slate-400">
                {placedOrder.restaurant_name} is preparing your hot meal.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl text-xs text-left space-y-1 border border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Delivery Coach:</span>
                <span className="font-bold text-slate-200">{placedOrder.coach_berth}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Station:</span>
                <span className="font-bold text-slate-200">{placedOrder.station_code}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Arrival:</span>
                <span className="font-bold text-amber-400">{placedOrder.estimated_delivery_time}</span>
              </div>
            </div>

            <div className="text-[11px] text-amber-300/80 bg-amber-950/40 border border-amber-800/40 p-2.5 rounded-xl font-mono">
              Delivery agent will meet you at Coach {coachNumber} door. Keep exact change or scan delivery QR.
            </div>

            <button
              onClick={() => { setPlacedOrder(null); setActiveTab('my-orders'); }}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-xl text-xs transition"
            >
              Track Live Order
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
