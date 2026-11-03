import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Train, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Search, 
  RefreshCw,
  Trash2,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  X
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function MyBookingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming' | 'past' | 'cancelled'
  const [bookingsData, setBookingsData] = useState({ upcoming: [], past: [], cancelled: [], total_bookings: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Cancellation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [cancelReason, setCancelReason] = useState('Change of travel plan')
  const [cancelling, setCancelling] = useState(false)
  const [cancelResult, setCancelResult] = useState(null)
  const [cancelError, setCancelError] = useState(null)

  const fetchBookings = async () => {
    try {
      const res = await api.get('/booking/my-bookings')
      setBookingsData(res.data)
    } catch (err) {
      console.error('Failed to load my bookings:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleOpenCancelModal = (booking) => {
    setSelectedBooking(booking)
    setCancelReason('Change of travel plan')
    setCancelResult(null)
    setCancelError(null)
    setCancelModalOpen(true)
  }

  const handleConfirmCancel = async (e) => {
    e.preventDefault()
    if (!selectedBooking) return

    setCancelling(true)
    setCancelError(null)

    try {
      const res = await api.post(`/booking/cancel/${selectedBooking.demo_pnr}`, {
        reason: cancelReason
      })

      if (res.data.success) {
        setCancelResult(res.data)
        fetchBookings()
      }
    } catch (err) {
      console.error('Cancellation failed:', err)
      const detail = err.response?.data?.detail || 'Cancellation could not be completed.'
      setCancelError(detail)
    } finally {
      setCancelling(false)
    }
  }

  const currentList = bookingsData[activeTab] || []

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="bg-blue-600/20 p-2.5 rounded-xl border border-blue-500/30">
              <Train className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-white">My Railway Bookings</h1>
                <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                  {bookingsData.total_bookings} DEMO TICKETS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated ticket bookings &bull; 10-Digit Demo PNR &bull; Live cancellation & refund &bull; Linked emergency reporting
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true)
              fetchBookings()
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Refresh Bookings"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          <Link
            to="/train-search"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Book New Train</span>
          </Link>
        </div>
      </div>

      {/* Tabs Deck */}
      <div className="flex border-b border-slate-800 space-x-4">
        {[
          { id: 'upcoming', label: `Upcoming Journeys (${bookingsData.upcoming?.length || 0})` },
          { id: 'past', label: `Past Completed (${bookingsData.past?.length || 0})` },
          { id: 'cancelled', label: `Cancelled (${bookingsData.cancelled?.length || 0})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-2 text-xs font-bold border-b-2 transition ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Train className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading your demo booking history...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Train className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No {activeTab} bookings found</h3>
          <p className="text-xs text-slate-400">
            {activeTab === 'upcoming'
              ? 'You have no active train bookings scheduled. Search trains to book a simulated demo ticket!'
              : `No ${activeTab} journey records available.`}
          </p>
          {activeTab === 'upcoming' && (
            <Link
              to="/train-search"
              className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
            >
              Search & Book Trains
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((b) => {
            const firstPass = b.passengers?.[0]
            const sosUrl = `/passenger/report?train=${b.train_number}&trainName=${encodeURIComponent(b.train_name)}&coach=${firstPass?.coach || 'B1'}&seat=${firstPass?.berth || '34'}&passengerName=${encodeURIComponent(firstPass?.name || 'Passenger')}&pnr=${b.demo_pnr}`

            return (
              <div
                key={b.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition space-y-4"
              >
                {/* Header: PNR & Status */}
                <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Demo PNR:</span>
                      <span className="font-mono text-base font-black text-white tracking-wider">
                        {b.demo_pnr}
                      </span>
                    </div>
                    <span className="text-slate-600">&bull;</span>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Booking Ref:</span>
                      <span className="font-mono text-xs text-slate-300 font-semibold">
                        {b.booking_reference}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono ${
                      b.is_cancelled
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {b.booking_status}
                    </span>
                    <span className="text-xs font-black text-emerald-400 font-mono">
                      ₹{b.total_fare}
                    </span>
                  </div>
                </div>

                {/* Train Details */}
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black bg-blue-900 text-blue-300 px-2 py-0.5 rounded">
                        #{b.train_number}
                      </span>
                      <h3 className="font-bold text-white text-sm">{b.train_name}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {b.source} &rarr; {b.destination} &bull; Class: <strong className="text-blue-400 font-mono">{b.travel_class}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Journey Date:</span>
                    <span className="font-bold text-white text-xs font-mono">{b.journey_date}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Dep: {b.departure_time}</span>
                  </div>
                </div>

                {/* Passengers & Seat Allocation Pills */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Allocated Berths ({b.passengers?.length} Passenger{b.passengers?.length > 1 ? 's' : ''}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {b.passengers?.map((p, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs flex items-center space-x-2"
                      >
                        <span className="font-semibold text-white">{p.name}</span>
                        <span className="text-cyan-400 font-mono font-bold">Coach {p.coach}</span>
                        <span className="text-amber-400 font-mono font-bold">Berth {p.berth}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({p.type})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
                  {/* Emergency SOS Shortcut Integration */}
                  <Link
                    to={sosUrl}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/80 transition"
                    title="File an emergency incident pre-filled with this booking's train and coach"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Report Emergency for this Journey &rarr;</span>
                  </Link>

                  <div className="flex items-center space-x-2">
                    {!b.is_cancelled && activeTab === 'upcoming' && (
                      <button
                        type="button"
                        onClick={() => handleOpenCancelModal(b)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition"
                      >
                        Cancel Ticket
                      </button>
                    )}

                    <Link
                      to={`/ticket/${b.demo_pnr}`}
                      className="flex items-center space-x-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Digital Ticket</span>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Ticket Cancellation Confirmation Modal */}
      {cancelModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-400 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Cancel Demo Railway Ticket</h3>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!cancelResult ? (
              <form onSubmit={handleConfirmCancel} className="space-y-4">
                <p className="text-xs text-slate-300">
                  Are you sure you want to cancel booking for Demo PNR <strong className="font-mono text-white">{selectedBooking.demo_pnr}</strong> (#{selectedBooking.train_number} - {selectedBooking.train_name})?
                </p>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Fare Paid:</span>
                    <span className="font-mono text-white">₹{selectedBooking.total_fare}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Simulated Cancellation Fee:</span>
                    <span className="font-mono text-amber-400">
                      ₹{selectedBooking.travel_class in ['1A', 'EC'] ? 240 * selectedBooking.passenger_count : 180 * selectedBooking.passenger_count}
                    </span>
                  </div>
                  <div className="flex justify-between text-white font-bold pt-1 border-t border-slate-800">
                    <span>Estimated Refund:</span>
                    <span className="font-mono text-emerald-400">
                      ₹{Math.max(0, selectedBooking.total_fare - (selectedBooking.travel_class in ['1A', 'EC'] ? 240 * selectedBooking.passenger_count : 180 * selectedBooking.passenger_count))}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Select Cancellation Reason:
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Change of travel plan">Change of travel plan</option>
                    <option value="Booked alternate train">Booked alternate train</option>
                    <option value="Personal emergency">Personal emergency</option>
                    <option value="Testing RailResQ cancellation engine">Testing RailResQ cancellation engine</option>
                  </select>
                </div>

                {cancelError && (
                  <div className="p-3 bg-rose-950 border border-rose-800 rounded-xl text-xs text-rose-300">
                    {cancelError}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setCancelModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Abort
                  </button>

                  <button
                    type="submit"
                    disabled={cancelling}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-900/40"
                  >
                    {cancelling ? 'Cancelling & Refunding...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-950/80 border border-emerald-700 rounded-xl text-xs text-emerald-200 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ticket Cancelled Successfully!</span>
                  </div>
                  <p>{cancelResult.message}</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Refund Amount:</span>
                    <span className="font-mono text-emerald-400 font-bold">₹{cancelResult.refund_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Refund Transaction Ref:</span>
                    <span className="font-mono text-slate-300 text-[11px]">{cancelResult.refund_transaction_id}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
                >
                  Close & Refresh
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
