import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Ticket, 
  ShieldCheck, 
  Utensils, 
  ShoppingBag, 
  Car, 
  ShieldAlert, 
  HeartPulse, 
  Compass, 
  Sparkles, 
  Building2, 
  Train, 
  AlertTriangle, 
  Clock, 
  ChevronRight, 
  Phone, 
  Radio, 
  Zap,
  Star,
  MapPin,
  Bot,
  Bed
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function PassengerSuperDashboard() {
  const { user } = useAuth()
  const [recentBookings, setRecentBookings] = useState([])
  const [recentFoodOrders, setRecentFoodOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const quickServices = [
    {
      title: 'Search & Book Trains',
      desc: 'RailYatri 40+ trains across 35+ junctions',
      icon: Ticket,
      link: '/train-search',
      color: 'from-blue-600 to-indigo-700',
      tag: '40 TRAINS'
    },
    {
      title: 'Verify PNR Status',
      desc: '10-digit demo PNR verification & live chart',
      icon: ShieldCheck,
      link: '/pnr-status',
      color: 'from-emerald-600 to-teal-700',
      tag: 'INSTANT'
    },
    {
      title: 'Order Food to Berth',
      desc: 'Hot meals from station partner restaurants',
      icon: Utensils,
      link: '/food',
      color: 'from-amber-600 to-orange-700',
      tag: 'HOT MEALS'
    },
    {
      title: '15-Min Essentials & Grocery',
      desc: 'Dark store snacks, water bottles, travel pillows',
      icon: ShoppingBag,
      link: '/grocery',
      color: 'from-teal-600 to-cyan-700',
      tag: '15 MINS'
    },
    {
      title: 'Rapido Bike, Auto & Cabs',
      desc: 'Station pickup, zero surge, verified drivers',
      icon: Car,
      link: '/transport',
      color: 'from-yellow-600 to-amber-700',
      tag: 'LOCAL RIDES'
    },
    {
      title: 'Police & Security (RPF)',
      desc: '112 emergency calling & station police post directory',
      icon: ShieldAlert,
      link: '/police',
      color: 'from-blue-700 to-indigo-900',
      tag: '24x7 DESK'
    },
    {
      title: 'Ambulance & Hospitals',
      desc: '108 ambulance dispatch & nearby ICU directory',
      icon: HeartPulse,
      link: '/medical',
      color: 'from-rose-600 to-red-800',
      tag: 'EMERGENCY'
    },
    {
      title: 'AI Tourist Discovery',
      desc: 'Temples, beaches, nature waterfalls & iconic foods',
      icon: Compass,
      link: '/explore',
      color: 'from-cyan-600 to-blue-700',
      tag: 'TOURISM'
    },
    {
      title: 'Hotels & Retiring Rooms',
      desc: 'IRCTC AC retiring rooms, sleep pods & station hotels',
      icon: Bed,
      link: '/hotels',
      color: 'from-indigo-600 to-violet-800',
      tag: 'LODGING & TRANSIT'
    },
    {
      title: 'AI Travel Assistant',
      desc: 'Gemini-powered itinerary planner & advice',
      icon: Sparkles,
      link: '/travel-guide',
      color: 'from-purple-600 to-indigo-800',
      tag: 'GEMINI AI'
    },
    {
      title: 'Station Rail & Cloakroom',
      desc: 'AC waiting lounges, luggage lockers & metro transfers',
      icon: Building2,
      link: '/rail-guide',
      color: 'from-slate-700 to-slate-900',
      tag: 'AMENITIES'
    }
  ]

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const [bRes, fRes] = await Promise.all([
          api.get('/booking/my-bookings').catch(() => ({ data: [] })),
          api.get('/food/orders/my-orders').catch(() => ({ data: [] }))
        ])
        setRecentBookings(bRes.data || [])
        setRecentFoodOrders(fRes.data || [])
      } catch (err) {
        console.error('Error fetching dashboard summary:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRecent()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      
      {/* Top Welcome & SOS Action Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 p-6 md:p-8 border border-blue-700/50 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-blue-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-blue-300 border border-blue-500/30">
              <Train className="w-3.5 h-3.5 text-blue-400" />
              <span>RailResQ Passenger Super App • Complete Travel Hub</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              Welcome aboard, {user?.full_name || 'Passenger'}!
            </h1>
            <p className="text-xs md:text-sm text-blue-200/80 leading-relaxed">
              Your unified railway companion for tickets, food delivered to your berth, 15-minute station groceries, local Rapido cabs, tourist discovery, and 24x7 emergency safety.
            </p>
          </div>

          {/* Quick Emergency SOS Action Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/passenger/report"
              className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black px-6 py-3 rounded-2xl text-xs shadow-xl shadow-rose-950/50 flex items-center justify-center space-x-2 border border-rose-400/30 transition transform hover:-translate-y-0.5"
            >
              <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
              <span>EMERGENCY SOS (OFFLINE READY)</span>
            </Link>

            <Link
              to="/chatbot"
              className="w-full sm:w-auto bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-bold px-4 py-3 rounded-2xl text-xs border border-amber-500/40 flex items-center justify-center space-x-2 transition"
            >
              <Bot className="w-4 h-4" />
              <span>AI Chatbot</span>
            </Link>
          </div>
        </div>

        {/* Academic Prototype Notice */}
        <div className="absolute top-4 right-4 hidden lg:block text-[10px] font-mono bg-black/40 px-2.5 py-0.5 rounded text-blue-300 border border-white/10">
          Simulation Mode Active • IR Decision Support
        </div>
      </div>

      {/* Active Demo Journey Card (Fast Shortcut) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Train className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-slate-100">Live Journey In Focus</h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-700/60 font-bold flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1"></span>
            <span>ON TIME • EN ROUTE</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">Train #12637 • Pandian Superfast Express</span>
            <div className="text-base font-bold text-slate-100">Chennai Egmore (MS) → Madurai Jn (MDU)</div>
            <div className="text-xs text-slate-400">Coach: <strong>B4</strong> • Seat: <strong>42 (Lower Berth)</strong> • Class: <strong>3A</strong></div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-2xl space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Demo PNR:</span>
              <span className="font-mono font-bold text-amber-400">4829103847</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Next Halt:</span>
              <span className="font-semibold text-slate-200">Dindigul Jn (ETA 22 mins)</span>
            </div>
          </div>

          {/* Quick In-Journey Actions */}
          <div className="flex flex-col gap-2">
            <Link
              to="/food"
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow transition"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Order Food to Coach B4</span>
            </Link>
            <Link
              to="/transport"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition"
            >
              <Car className="w-3.5 h-3.5 text-yellow-400" />
              <span>Book Cab at Madurai Jn</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Services Grid (All 10 Modules) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span>Passenger Services & Travel Tools</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">10 UNIFIED MODULES</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {quickServices.map((srv, idx) => {
            const Icon = srv.icon
            return (
              <Link
                key={idx}
                to={srv.link}
                className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-blue-950/20 transition-all duration-200 group transform hover:-translate-y-1"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${srv.color} text-white flex items-center justify-center shadow`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-300 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                      {srv.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition">
                      {srv.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      {srv.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-xs font-bold text-blue-400 group-hover:text-blue-300 pt-2 border-t border-slate-800/80">
                  <span>Open Service</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1 transition group-hover:translate-x-1" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

    </div>
  )
}
