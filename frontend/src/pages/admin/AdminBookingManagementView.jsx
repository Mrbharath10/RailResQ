import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Sliders, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  CreditCard, 
  Users, 
  Train, 
  Search, 
  RefreshCw,
  Edit,
  Database,
  Calendar,
  X,
  FileText
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts'
import api from '../../services/api'

export default function AdminBookingManagementView() {
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Inventory adjustment modal
  const [modalOpen, setModalOpen] = useState(false)
  const [invTrain, setInvTrain] = useState('20607')
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0])
  const [invClass, setInvClass] = useState('CC')
  const [invSeats, setInvSeats] = useState(55)
  const [invFare, setInvFare] = useState(985.0)
  const [updating, setUpdating] = useState(false)
  const [updateMsg, setUpdateMsg] = useState(null)

  const fetchOverview = async () => {
    try {
      const res = await api.get('/booking/admin/overview')
      setOverview(res.data)
    } catch (err) {
      console.error('Failed to load admin booking overview:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOverview()
  }, [])

  const handleUpdateInventory = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setUpdateMsg(null)

    try {
      const res = await api.post('/booking/admin/inventory', {
        train_number: invTrain,
        journey_date: invDate,
        travel_class: invClass,
        available_seats: parseInt(invSeats),
        fare_amount: parseFloat(invFare)
      })

      if (res.data.success) {
        setUpdateMsg({ type: 'success', text: res.data.message })
        fetchOverview()
      }
    } catch (err) {
      setUpdateMsg({ type: 'error', text: 'Failed to update inventory.' })
    } finally {
      setUpdating(false)
    }
  }

  const filteredBookings = overview?.recent_bookings?.filter((b) => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return (
      b.pnr.toLowerCase().includes(q) ||
      b.train.toLowerCase().includes(q) ||
      b.route.toLowerCase().includes(q) ||
      b.status.toLowerCase().includes(q)
    )
  }) || []

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center max-w-4xl mx-auto space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading booking telemetry and revenue metrics...</p>
      </div>
    )
  }

  const metrics = overview?.metrics || {}

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="bg-purple-600/20 p-2.5 rounded-xl border border-purple-500/30">
              <Sliders className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-white">Admin Booking & Fleet Inventory Console</h1>
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded font-mono font-bold">
                  ADMIN OPS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated booking management &bull; Dynamic seat quotas &bull; Fare matrix configuration &bull; Revenue analytics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/30"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Configure Seat Inventory</span>
          </button>

          <button
            type="button"
            onClick={fetchOverview}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Metrics Deck */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Demo Bookings
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-white font-mono">{metrics.total_bookings}</span>
            <span className="text-xs bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-mono font-bold">
              {metrics.confirmed_bookings} Active
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
            Net Simulated Revenue
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono">₹{metrics.net_revenue}</span>
            <span className="text-[10px] text-slate-400 font-mono">Gross: ₹{metrics.simulated_gross_revenue}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
            Cancelled Bookings
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-rose-400 font-mono">{metrics.cancelled_bookings}</span>
            <span className="text-xs bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-mono font-bold">
              {metrics.cancellation_rate_percent}% Rate
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
            Simulated Refunds
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-cyan-400 font-mono">₹{metrics.simulated_refunds_processed}</span>
            <span className="text-[10px] text-slate-400 font-mono">Re-credited</span>
          </div>
        </div>
      </div>

      {/* Analytics Chart & Popular Trains */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Top Trains by Booking Volume</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Real-time DB Counts</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview?.top_trains || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="train_number" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                />
                <Bar dataKey="bookings" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm mb-3">Popular Corridor Routes</h3>
            <div className="space-y-2">
              {overview?.top_trains?.map((t) => (
                <div key={t.train_number} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white block">{t.train_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">#{t.train_number}</span>
                  </div>
                  <span className="font-mono font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                    {t.bookings} booked
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            &bull; All booking transactions are strictly simulated within PostgreSQL/SQLite and cross-linked with RailResQ emergency incident triage.
          </div>
        </div>
      </div>

      {/* Booking Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Simulated Booking Ledger ({filteredBookings.length})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Complete list of demo bookings, PNR references, fares, and cancellation status.
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search PNR, train, route..."
              className="pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-blue-500 focus:outline-none w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Demo PNR</th>
                <th className="py-3 px-3">Train Details</th>
                <th className="py-3 px-3">Route</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Class</th>
                <th className="py-3 px-3">Pax</th>
                <th className="py-3 px-3">Total Fare</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono">
              {filteredBookings.map((b) => (
                <tr key={b.pnr} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-white tracking-wider">{b.pnr}</td>
                  <td className="py-3 px-3 text-slate-200 font-sans font-medium">{b.train}</td>
                  <td className="py-3 px-3 text-cyan-400 font-bold">{b.route}</td>
                  <td className="py-3 px-3 text-slate-400">{b.date}</td>
                  <td className="py-3 px-3 text-blue-400 font-bold">{b.class}</td>
                  <td className="py-3 px-3 text-slate-300">{b.passengers}</td>
                  <td className="py-3 px-3 font-bold text-emerald-400">₹{b.fare}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.status === 'CONFIRMED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to={`/ticket/${b.pnr}`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded text-[11px] font-sans font-semibold transition"
                    >
                      Ticket
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory & Fare Adjustment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Seat Inventory & Quota Manager</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateInventory} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Train Number:</label>
                <input
                  type="text"
                  value={invTrain}
                  onChange={(e) => setInvTrain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Journey Date:</label>
                <input
                  type="date"
                  value={invDate}
                  onChange={(e) => setInvDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Travel Class:</label>
                  <select
                    value={invClass}
                    onChange={(e) => setInvClass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-purple-500 focus:outline-none"
                  >
                    <option value="CC">CC</option>
                    <option value="EC">EC</option>
                    <option value="3A">3A</option>
                    <option value="2A">2A</option>
                    <option value="1A">1A</option>
                    <option value="SL">SL</option>
                    <option value="2S">2S</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Available Seats:</label>
                  <input
                    type="number"
                    min={0}
                    value={invSeats}
                    onChange={(e) => setInvSeats(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Base Fare Amount (₹):</label>
                <input
                  type="number"
                  min={50}
                  step={10}
                  value={invFare}
                  onChange={(e) => setInvFare(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              {updateMsg && (
                <div className={`p-2.5 rounded-xl border ${
                  updateMsg.type === 'success'
                    ? 'bg-emerald-950 text-emerald-200 border-emerald-700'
                    : 'bg-rose-950 text-rose-200 border-rose-800'
                }`}>
                  {updateMsg.text}
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition shadow-lg shadow-purple-600/30"
                >
                  {updating ? 'Updating...' : 'Save Inventory & Fares'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
