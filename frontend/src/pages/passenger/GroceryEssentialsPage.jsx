import React, { useState, useEffect } from 'react'
import { 
  ShoppingBag, 
  Search, 
  Zap, 
  Clock, 
  Plus, 
  Minus, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  Tag, 
  MapPin, 
  Phone,
  ShieldCheck,
  Package
} from 'lucide-react'
import api from '../../services/api'

// Local high-definition authentic product images
const GROCERY_IMAGE_MAP = {
  "Kinley Mineral Water (1 Litre)": "/grocery/kinley-water.jpg",
  "Lay's India's Magic Masala Chips": "/grocery/lays-chips.jpg",
  "Haldiram's Aloo Bhujia": "/grocery/aloo-bhujia.jpg",
  "Amul Taaza Homogenised Toned Milk": "/grocery/amul-milk.jpg",
  "Fresh Bananas (Robusta)": "/grocery/fresh-bananas.jpg",
  "Britannia 100% Whole Wheat Bread": "/grocery/wheat-bread.jpg",
  "Dettol Antiseptic Wet Wipes (25 Pcs)": "/grocery/dettol-wipes.jpg",
  "Lifebuoy Hand Sanitizer Gel (100ml)": "/grocery/lifebuoy-sanitizer.jpg",
  "Colgate Total Travel Toothbrush & Paste Kit": "/grocery/colgate-kit.jpg",
  "Tropicana 100% Real Mixed Fruit Juice": "/grocery/fruit-juice.jpg",
  "Nescafe Classic Ready-to-Drink Hazelnut Cold Coffee": "/grocery/cold-coffee.jpg",
  "Travel Inflatable Neck Pillow & Eye Mask": "/grocery/neck-pillow.jpg"
}

const getGroceryImage = (item) => {
  if (item?.image_url && item.image_url.startsWith('/grocery/')) {
    return item.image_url
  }
  if (item?.name && GROCERY_IMAGE_MAP[item.name]) {
    return GROCERY_IMAGE_MAP[item.name]
  }
  const name = (item?.name || '').toLowerCase()
  if (name.includes('water') || name.includes('kinley') || name.includes('bisleri')) return '/grocery/kinley-water.jpg'
  if (name.includes('chip') || name.includes('lay')) return '/grocery/lays-chips.jpg'
  if (name.includes('bhujia') || name.includes('sev') || name.includes('haldiram')) return '/grocery/aloo-bhujia.jpg'
  if (name.includes('milk') || name.includes('amul') || name.includes('dairy')) return '/grocery/amul-milk.jpg'
  if (name.includes('banana') || name.includes('fruit') || name.includes('apple')) return '/grocery/fresh-bananas.jpg'
  if (name.includes('bread') || name.includes('toast') || name.includes('wheat')) return '/grocery/wheat-bread.jpg'
  if (name.includes('dettol') || name.includes('wipe')) return '/grocery/dettol-wipes.jpg'
  if (name.includes('sanitizer') || name.includes('lifebuoy') || name.includes('soap')) return '/grocery/lifebuoy-sanitizer.jpg'
  if (name.includes('colgate') || name.includes('paste') || name.includes('brush') || name.includes('dental')) return '/grocery/colgate-kit.jpg'
  if (name.includes('coffee') || name.includes('nescafe')) return '/grocery/cold-coffee.jpg'
  if (name.includes('juice') || name.includes('tropicana')) return '/grocery/fruit-juice.jpg'
  if (name.includes('pillow') || name.includes('mask') || name.includes('travel')) return '/grocery/neck-pillow.jpg'
  return '/grocery/travel-kit.jpg'
}

export default function GroceryEssentialsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Cart: { [productId]: { product, quantity } }
  const [cart, setCart] = useState({})
  const [showCheckout, setShowCheckout] = useState(false)
  const [recipientName, setRecipientName] = useState('Priya Sharma')
  const [recipientPhone, setRecipientPhone] = useState('+91 94440 98765')
  const [deliveryAddress, setDeliveryAddress] = useState('Platform 1 AC Waiting Hall, Chennai Central Station')
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [placedOrder, setPlacedOrder] = useState(null)

  // Past orders tab
  const [activeTab, setActiveTab] = useState('store') // 'store' | 'orders'
  const [pastOrders, setPastOrders] = useState([])

  const fetchCategories = async () => {
    try {
      const res = await api.get('/grocery/categories')
      setCategories(res.data)
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = {}
      if (selectedCategory !== 'ALL') params.category = selectedCategory
      if (searchQuery.trim()) params.search = searchQuery.trim()

      const res = await api.get('/grocery/products', { params })
      setProducts(res.data)
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPastOrders = async () => {
    try {
      const res = await api.get('/grocery/orders/my-orders')
      setPastOrders(res.data)
    } catch (err) {
      console.error('Error fetching grocery orders:', err)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchPastOrders()
    }
  }, [activeTab])

  // Cart operations
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev[product.id]
      const newQty = (existing?.quantity || 0) + 1
      return {
        ...prev,
        [product.id]: { product, quantity: newQty }
      }
    })
  }

  const removeFromCart = (productId) => {
    setCart(prev => {
      const existing = prev[productId]
      if (!existing) return prev
      if (existing.quantity <= 1) {
        const copy = { ...prev }
        delete copy[productId]
        return copy
      }
      return {
        ...prev,
        [productId]: { ...existing, quantity: existing.quantity - 1 }
      }
    })
  }

  const cartItems = Object.values(cart)
  const cartSubtotal = cartItems.reduce((acc, curr) => acc + (curr.product.price * curr.quantity), 0)
  const deliveryFee = cartSubtotal > 299 || cartItems.length === 0 ? 0 : 25
  const cartTotal = cartSubtotal + deliveryFee

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    if (cartItems.length === 0) return

    setOrderSubmitting(true)
    try {
      const payload = {
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        delivery_address: deliveryAddress,
        delivery_station_code: 'MAS',
        items: cartItems.map(c => ({
          product_id: c.product.id,
          name: c.product.name,
          price: c.product.price,
          quantity: c.quantity,
          unit: c.product.unit
        })),
        payment_method: 'UPI_SIMULATED'
      }

      const res = await api.post('/grocery/orders', payload)
      setPlacedOrder(res.data)
      setCart({})
      setShowCheckout(false)
    } catch (err) {
      console.error('Grocery order error:', err)
      alert('Order failed: ' + (err.response?.data?.detail || err.message))
    } finally {
      setOrderSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      
      {/* Top Banner (Blinkit / Instamart Style) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 md:p-8 text-white shadow-xl shadow-teal-950/30">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-200 border border-emerald-300/30">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>15-Minute Instant Railway Delivery</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Travel Essentials & Groceries Delivered in 15 Minutes
          </h1>
          <p className="text-sm md:text-base text-emerald-100/90 leading-relaxed">
            Water bottles, travel pillows, instant snacks, first aid, baby items, wet wipes, and chargers delivered straight to your platform or waiting lounge.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button 
              onClick={() => setActiveTab('store')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow ${
                activeTab === 'store' ? 'bg-white text-emerald-950' : 'bg-black/30 text-white hover:bg-black/40'
              }`}
            >
              🛍️ Instant Supermarket
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow ${
                activeTab === 'orders' ? 'bg-white text-emerald-950' : 'bg-black/30 text-white hover:bg-black/40'
              }`}
            >
              📦 My Grocery Orders
            </button>
          </div>
        </div>

        {/* Academic Prototype Notice */}
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-[11px] text-emerald-200 font-mono">
          Demo Instant Grocery • Dark Store Simulation
        </div>
      </div>

      {activeTab === 'store' ? (
        <>
          {/* Category Chips Bar & Search */}
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search water, wet wipes, charger, snacks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Free delivery promo badge */}
              <div className="text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-3 py-1.5 rounded-xl font-medium flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-300" />
                <span>Free delivery on orders above ₹299 • Flat 15-min delivery</span>
              </div>
            </div>

            {/* Category Horizontal Scroller */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                  selectedCategory === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                All Items
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-sm">Loading instant grocery store...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-2xl">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold">No grocery items found for this filter.</p>
              <button 
                onClick={() => { setSelectedCategory('ALL'); setSearchQuery('') }} 
                className="mt-3 text-xs text-emerald-400 hover:underline font-bold"
              >
                Reset Store Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(p => {
                const inCartQty = cart[p.id]?.quantity || 0
                return (
                  <div
                    key={p.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:shadow-emerald-950/20"
                  >
                    <div className="space-y-2">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {p.brand}
                        </span>
                        {p.discount_pct > 0 && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-600/40 px-1.5 py-0.2 rounded">
                            {p.discount_pct}% OFF
                          </span>
                        )}
                      </div>

                      {/* Real Product Image with Soft Ambient Backing */}
                      <div className="h-36 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800/80 relative group">
                        <img 
                          src={getGroceryImage(p)}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = '/grocery/travel-kit.jpg'
                          }}
                        />
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{p.name}</h4>
                        <p className="text-[11px] text-slate-400">{p.unit}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between mt-2">
                      <div className="text-xs font-black text-emerald-400">
                        ₹{p.price}
                      </div>

                      {inCartQty > 0 ? (
                        <div className="flex items-center space-x-1.5 bg-emerald-950 border border-emerald-600 px-2 py-0.5 rounded-lg">
                          <button onClick={() => removeFromCart(p.id)} className="text-emerald-300 hover:text-white">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white px-1">{inCartQty}</span>
                          <button onClick={() => addToCart(p)} className="text-emerald-300 hover:text-white">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(p)}
                          className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1"
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
          )}
        </>
      ) : (
        /* Past Grocery Orders */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <span>Grocery Order History</span>
            </h2>
            <button onClick={fetchPastOrders} className="text-xs text-emerald-400 font-semibold hover:underline">
              Refresh History
            </button>
          </div>

          {pastOrders.length === 0 ? (
            <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-medium">No grocery orders placed yet.</p>
              <button 
                onClick={() => setActiveTab('store')}
                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-500"
              >
                Browse Quick Essentials
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastOrders.map(o => (
                <div key={o.order_reference} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">{o.order_reference}</span>
                      <h4 className="text-sm font-bold text-slate-100">Dark Store Instant Order</h4>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                      {o.order_status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Destination:</span>
                      <span className="font-semibold text-slate-300 line-clamp-1">{o.delivery_address}</span>
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
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>Delivered in {o.estimated_delivery_mins} mins</span>
                    </span>
                    <span className="text-[11px] text-slate-400">{o.created_at ? new Date(o.created_at).toLocaleTimeString() : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 inset-x-4 md:inset-x-auto md:right-8 z-40">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center justify-between space-x-6 border border-emerald-400/40 max-w-md ml-auto">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="w-5 h-5 text-amber-300" />
              <div>
                <div className="text-xs font-bold">{cartItems.length} items added</div>
                <div className="text-sm font-black">₹{cartTotal} <span className="text-[10px] font-normal text-emerald-200">({deliveryFee === 0 ? 'Free Delivery' : '+₹25 Delivery'})</span></div>
              </div>
            </div>

            <button
              onClick={() => setShowCheckout(true)}
              className="bg-white text-emerald-950 px-4 py-2 rounded-xl text-xs font-black shadow hover:bg-emerald-50 transition flex items-center space-x-1"
            >
              <span>View Cart & Pay</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-slate-100">15-Minute Instant Checkout</h3>
              </div>
              <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400">Delivery Location / Platform / Hotel</label>
                <textarea
                  rows="2"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Items Summary */}
              <div className="bg-slate-950 p-3 rounded-2xl space-y-2 text-xs max-h-40 overflow-y-auto">
                {cartItems.map(c => (
                  <div key={c.product.id} className="flex items-center justify-between text-slate-300 gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <img 
                        src={getGroceryImage(c.product)} 
                        alt={c.product.name} 
                        className="w-7 h-7 rounded object-cover border border-slate-800 shrink-0" 
                      />
                      <span className="truncate">{c.quantity}x {c.product.name}</span>
                    </div>
                    <span className="font-semibold shrink-0">₹{c.product.price * c.quantity}</span>
                  </div>
                ))}
                <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1">
                  <span>Delivery Fee:</span>
                  <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1 text-sm font-black text-emerald-400">
                  <span>Grand Total:</span>
                  <span>₹{cartTotal}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={orderSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg transition flex items-center justify-center space-x-2"
              >
                {orderSubmitting ? (
                  <span>Dispatching Instant Order...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Pay ₹{cartTotal} & Deliver in 15 Mins</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Order Confirmed Modal */}
      {placedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl animate-scale-in">
            <div className="w-14 h-14 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-600/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">{placedOrder.order_reference}</span>
              <h3 className="text-xl font-black text-slate-100">15-Min Delivery Dispatched!</h3>
              <p className="text-xs text-slate-400">
                Rider has picked up your essentials from the station dark store.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl text-xs text-left space-y-1 border border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Deliver To:</span>
                <span className="font-bold text-slate-200 line-clamp-1">{placedOrder.delivery_address}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Arrival:</span>
                <span className="font-bold text-amber-400">{placedOrder.estimated_delivery_mins} Minutes</span>
              </div>
            </div>

            <button
              onClick={() => { setPlacedOrder(null); setActiveTab('orders'); }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition"
            >
              Track Order Live
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
