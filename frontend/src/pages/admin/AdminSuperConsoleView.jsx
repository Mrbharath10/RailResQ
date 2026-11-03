import React, { useState, useEffect } from 'react'
import { 
  Sliders, 
  Activity, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  TrendingUp, 
  Utensils, 
  ShoppingBag, 
  Car, 
  Ticket, 
  ShieldAlert, 
  Server,
  Zap,
  Globe
} from 'lucide-react'
import api from '../../services/api'

export default function AdminSuperConsoleView() {
  const [overview, setOverview] = useState(null)
  const [adapters, setAdapters] = useState([])
  const [ordersFeed, setOrdersFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingAdapter, setUpdatingAdapter] = useState(null)

  const fetchAdminData = async () => {
    setLoading(true)
    try {
      const [ovRes, adRes, fdRes] = await Promise.all([
        api.get('/super-admin/overview'),
        api.get('/super-admin/adapters'),
        api.get('/super-admin/all-orders')
      ])
      setOverview(ovRes.data)
      setAdapters(adRes.data)
      setOrdersFeed(fdRes.data)
    } catch (err) {
      console.error('Super Admin fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  const handleToggleAdapter = async (serviceName, currentStatus) => {
    setUpdatingAdapter(serviceName)
    try {
      // Toggle between DEMO, LIVE, PENDING_APPROVAL
      let nextStatus = 'LIVE'
      if (currentStatus === 'DEMO') nextStatus = 'LIVE'
      else if (currentStatus === 'LIVE') nextStatus = 'PENDING_APPROVAL'
      else nextStatus = 'DEMO'

      await api.put(`/super-admin/adapters/${serviceName}/status`, {
        adapter_status: nextStatus,
        notes: `Operational state updated by Administrator to ${nextStatus}.`
      })
      // Refresh
      const adRes = await api.get('/super-admin/adapters')
      setAdapters(adRes.data)
    } catch (err) {
      console.error('Error toggling adapter:', err)
      alert('Unable to toggle adapter: ' + (err.response?.data?.detail || err.message))
    } finally {
      setUpdatingAdapter(null)
    }
  }

  const getStatusBadge = (st) => {
    switch (st) {
      case 'LIVE':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 font-mono">LIVE API</span>
      case 'DEMO':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-600 font-mono">DEMO SIMULATED</span>
      case 'PENDING_APPROVAL':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600 font-mono">PENDING APPROVAL</span>
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600 font-mono">UNAVAILABLE</span>
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 p-6 md:p-8 text-white shadow-xl shadow-purple-950/40 border border-purple-700/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-purple-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-purple-200 border border-purple-500/40">
              <Server className="w-3.5 h-3.5 text-purple-300" />
              <span>Super Administrator Operations Console</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              RailResQ Super App Administration & API Registry
            </h1>
            <p className="text-sm md:text-base text-purple-200/90 leading-relaxed">
              Unified control center managing simulated railway bookings, food delivery partners, dark store groceries, local transport fleet, and third-party API adapters.
            </p>
          </div>

          <button
            onClick={fetchAdminData}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow transition shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Analytics</span>
          </button>
        </div>

        {/* Academic Prototype Notice */}
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-[11px] text-purple-200 font-mono">
          Master API Gateway & Control Deck
        </div>
      </div>

      {/* Top Metrics KPI Cards */}
      {overview?.metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Train Bookings</span>
              <Ticket className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-slate-100">{overview.metrics.total_bookings}</div>
            <div className="text-[10px] text-emerald-400 font-mono">RailYatri Engine</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Food Orders</span>
              <Utensils className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-slate-100">{overview.metrics.total_food_orders}</div>
            <div className="text-[10px] text-orange-400 font-mono">₹{overview.revenue_breakdown?.food_ordering} GMV</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Grocery Orders</span>
              <ShoppingBag className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-slate-100">{overview.metrics.total_grocery_orders}</div>
            <div className="text-[10px] text-teal-400 font-mono">₹{overview.revenue_breakdown?.grocery_essentials} GMV</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Local Transit Rides</span>
              <Car className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-black text-slate-100">{overview.metrics.total_rides_booked}</div>
            <div className="text-[10px] text-yellow-400 font-mono">₹{overview.revenue_breakdown?.local_transit} GMV</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Emergency Incidents</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400">{overview.metrics.total_emergency_incidents}</div>
            <div className="text-[10px] text-rose-400 font-mono">Triage Operational</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>API Adapters</span>
              <Globe className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">{adapters.length} Registered</div>
            <div className="text-[10px] text-cyan-400 font-mono">{overview.metrics.live_adapters_count} LIVE • {overview.metrics.demo_adapters_count} DEMO</div>
          </div>

        </div>
      )}

      {/* External API Integration Adapters Registry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Globe className="w-5 h-5 text-purple-400" />
              <span>External Service Integration Adapters Registry</span>
            </h3>
            <p className="text-xs text-slate-400">
              Manage operational states (LIVE, DEMO, PENDING APPROVAL) across food, transit, grocery, and railway APIs.
            </p>
          </div>

          <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-950 px-3 py-1 rounded-full border border-emerald-700/60 flex items-center space-x-1.5 self-start">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>ALL APIS MONITORED</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Service & Provider</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Adapter Mode</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {adapters.map(a => (
                <tr key={a.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-100">{a.service_name}</div>
                    <div className="text-[11px] text-slate-400">{a.provider_name}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                      {a.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400 line-clamp-1">
                    {a.endpoint_url}
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-400">
                    {a.latency_ms} ms
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(a.adapter_status)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleAdapter(a.service_name, a.adapter_status)}
                      disabled={updatingAdapter === a.service_name}
                      className="bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white px-3 py-1 rounded-lg text-xs font-bold transition border border-slate-700"
                    >
                      {updatingAdapter === a.service_name ? 'Updating...' : 'Toggle Mode'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Live Multi-Service Order Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100">Live Multi-Service Transactions Feed</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">REAL-TIME CONSOLE</span>
        </div>

        {ordersFeed.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No transactions recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {ordersFeed.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between text-xs hover:border-slate-700 transition"
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    item.type === 'FOOD' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                    item.type === 'GROCERY' ? 'bg-teal-950 text-teal-400 border border-teal-800' :
                    'bg-yellow-950 text-yellow-400 border border-yellow-800'
                  }`}>
                    {item.type === 'FOOD' ? '🍽️' : item.type === 'GROCERY' ? '🛍️' : '🚖'}
                  </span>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-100">{item.reference}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{item.customer}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{item.details}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-emerald-400">₹{item.amount}</div>
                  <span className="text-[10px] font-mono text-slate-400">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
