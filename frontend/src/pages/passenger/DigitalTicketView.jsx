import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Train, 
  Printer, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CreditCard, 
  Copy, 
  Check, 
  ArrowLeft,
  Share2,
  FileText
} from 'lucide-react'
import api from '../../services/api'
import DemoTicketQRCode from '../../components/booking/DemoTicketQRCode'

export default function DigitalTicketView() {
  const { pnr } = useParams()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await api.get(`/booking/ticket/${pnr}`)
        setTicket(res.data)
      } catch (err) {
        console.error('Failed to load digital ticket:', err)
        setErrorMsg(`Unable to locate ticket with Demo PNR ${pnr}.`)
      } finally {
        setLoading(false)
      }
    }
    fetchTicket()
  }, [pnr])

  const handleCopyPNR = () => {
    if (!ticket) return
    navigator.clipboard.writeText(ticket.demo_pnr)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center max-w-3xl mx-auto space-y-3">
        <Train className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-300 font-semibold">Generating Official Digital Demo Ticket...</p>
      </div>
    )
  }

  if (errorMsg || !ticket) {
    return (
      <div className="bg-slate-900 border border-rose-900/60 rounded-2xl p-10 text-center max-w-xl mx-auto space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-white">Ticket Not Found</h3>
        <p className="text-xs text-slate-400">{errorMsg}</p>
        <Link
          to="/train-search"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
        >
          Book New Ticket
        </Link>
      </div>
    )
  }

  // Pre-fill parameters for seamless Emergency SOS reporting integration
  const primaryPassenger = ticket.passengers?.[0]
  const emergencyReportUrl = `/passenger/report?train=${ticket.train_number}&trainName=${encodeURIComponent(ticket.train_name)}&coach=${primaryPassenger?.coach || 'B1'}&seat=${primaryPassenger?.berth || '34'}&passengerName=${encodeURIComponent(primaryPassenger?.name || 'Passenger')}&pnr=${ticket.demo_pnr}`

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Top Controls Action Deck (Hidden during Print) */}
      <div className="flex flex-wrap justify-between items-center gap-3 print:hidden">
        <button
          type="button"
          onClick={() => navigate('/my-bookings')}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Bookings</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Emergency SOS Shortcut Integration */}
          <Link
            to={emergencyReportUrl}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition shadow"
            title="Pre-fill emergency distress report with this ticket's Coach & Berth"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Emergency SOS for this Train &rarr;</span>
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ticket</span>
          </button>
        </div>
      </div>

      {/* Main Digital Ticket Paper Container */}
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl space-y-0 print:border print:bg-white print:text-black">
        {/* MANDATORY PROMINENT DISCLAIMER HEADER */}
        <div className="bg-rose-950/90 border-b-2 border-rose-600 p-3 text-center print:bg-rose-100 print:text-rose-900">
          <div className="flex items-center justify-center space-x-2 text-rose-300 print:text-rose-900 font-black text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>DEMO TICKET – NOT VALID FOR ACTUAL RAILWAY TRAVEL</span>
          </div>
          <p className="text-[10px] text-rose-300/80 print:text-rose-800 mt-0.5">
            Simulated academic decision-support record for RailResQ project evaluation.
          </p>
        </div>

        {/* Official Ticket Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 p-6 border-b border-slate-800 text-white flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2.5 rounded-2xl text-blue-900 shadow">
              <Train className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-xl tracking-tight">RailResQ e-Ticketing Service</span>
                <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-mono font-bold">
                  ELECTRONIC RESERVATION SLIP
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Indian Railways Simulated Decision-Support & Coordination Prototype
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-blue-300 block font-semibold uppercase">Booking Status:</span>
            <span className={`text-xs font-black px-2.5 py-1 rounded-md uppercase font-mono ${
              ticket.is_cancelled
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {ticket.booking_status}
            </span>
          </div>
        </div>

        {/* PNR & QR Code Verification Section */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              10-Digit Unique Demo PNR Number:
            </span>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-3xl font-black text-white tracking-widest bg-slate-900 border border-slate-700 px-4 py-1.5 rounded-xl shadow-inner">
                {ticket.demo_pnr}
              </span>
              <button
                type="button"
                onClick={handleCopyPNR}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                title="Copy PNR to Clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Ref: <strong className="text-slate-200 font-mono">{ticket.booking_reference}</strong> &bull; Quota: <strong className="text-white">{ticket.quota}</strong> &bull; Class: <strong className="text-blue-400 font-mono">{ticket.travel_class}</strong>
            </p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-1">
            <DemoTicketQRCode value={ticket.qr_code_data} size={110} />
            <span className="text-[9px] text-slate-500 font-mono uppercase">Ticket Verification QR</span>
          </div>
        </div>

        {/* Journey Details Card */}
        <div className="p-6 border-b border-slate-800 space-y-4">
          <div className="flex flex-wrap justify-between items-start gap-2">
            <div>
              <span className="font-mono text-sm font-black bg-blue-900 text-blue-300 px-2.5 py-0.5 rounded-lg border border-blue-700">
                #{ticket.train_number}
              </span>
              <h3 className="text-lg font-bold text-white mt-1">{ticket.train_name}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Date of Journey:</span>
              <span className="font-bold text-white text-sm font-mono">{ticket.journey_date}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Departure (Boarding):</span>
              <span className="text-sm font-bold text-white">{ticket.source_station}</span>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className="font-mono text-base font-black text-emerald-400">{ticket.departure_time}</span>
                <span className="text-xs text-slate-400 font-mono">({ticket.source_station_code})</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Arrival (Destination):</span>
              <span className="text-sm font-bold text-white">{ticket.destination_station}</span>
              <div className="flex items-center justify-end space-x-1.5 mt-1">
                <span className="font-mono text-base font-black text-blue-400">{ticket.arrival_time}</span>
                <span className="text-xs text-slate-400 font-mono">({ticket.destination_station_code})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Passenger Seat & Berth Allocation Table */}
        <div className="p-6 border-b border-slate-800 space-y-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider block">
            Passenger Details & Allocated Berths ({ticket.passengers?.length}):
          </span>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Passenger Name</th>
                  <th className="py-2.5 px-3">Age / Gender</th>
                  <th className="py-2.5 px-3">Booking Status</th>
                  <th className="py-2.5 px-3">Allocated Coach</th>
                  <th className="py-2.5 px-3">Berth / Seat</th>
                  <th className="py-2.5 px-3">Berth Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-mono">
                {ticket.passengers?.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-white font-sans">{p.name}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">{p.age} yrs / {p.gender}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'CNF'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-cyan-400">{p.coach}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-400">{p.berth}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans text-[11px] font-semibold">{p.berth_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fare Breakdown & Payment Transaction Card */}
        <div className="p-6 bg-slate-950 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Payment & Transaction Info:
            </span>
            <div className="flex justify-between text-slate-400">
              <span>Transaction Ref:</span>
              <span className="font-mono text-slate-300">{ticket.transaction_id}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Payment Mode:</span>
              <span className="font-bold text-white">{ticket.payment_method}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Payment Status:</span>
              <span className="font-bold text-emerald-400">{ticket.payment_status}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Issued Date:</span>
              <span className="text-slate-300">{new Date(ticket.issued_at).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs bg-slate-900 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Ticket Fare Summary:
            </span>
            <div className="flex justify-between text-slate-400">
              <span>Ticket Base Fare:</span>
              <span className="font-mono text-slate-200">₹{ticket.fare_breakdown?.base_fare}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Reservation & Superfast Fee:</span>
              <span className="font-mono text-slate-200">
                ₹{(ticket.fare_breakdown?.reservation_charge || 0) + (ticket.fare_breakdown?.superfast_charge || 0)}
              </span>
            </div>
            {ticket.fare_breakdown?.gst_amount > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>GST (5% AC Rail):</span>
                <span className="font-mono text-slate-200">₹{ticket.fare_breakdown?.gst_amount}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-bold text-sm pt-1.5 border-t border-slate-800">
              <span>Total Fare Paid:</span>
              <span className="font-mono text-emerald-400 text-base">₹{ticket.fare_breakdown?.total_fare}</span>
            </div>
          </div>
        </div>

        {/* Cancellation Notice if ticket is cancelled */}
        {ticket.is_cancelled && (
          <div className="p-4 bg-rose-950/80 border-t border-rose-800 text-xs text-rose-200 space-y-1">
            <div className="font-bold flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>THIS TICKET HAS BEEN CANCELLED</span>
            </div>
            <p>
              Simulated refund of <strong>₹{ticket.refund_amount}</strong> was calculated and processed back to your payment method.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
