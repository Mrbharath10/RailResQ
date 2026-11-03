import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { 
  ShieldAlert, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Compass, 
  FileText,
  Image as ImageIcon,
  Wifi,
  WifiOff,
  RefreshCw,
  Clock,
  Layers,
  Train,
  CheckCircle,
  Languages,
  Camera,
  Edit3,
  Database,
  Trash2,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { 
  isDeviceOnline, 
  isSimulatedOffline, 
  setSimulatedOfflineMode, 
  saveOfflineComplaint, 
  getAllOfflineComplaints, 
  syncOfflineComplaints,
  subscribeOfflineSync,
  clearSyncedOfflineComplaints
} from '../../services/indexedDbSync'

import MultilingualVoiceAssistant from '../../components/complaints/MultilingualVoiceAssistant'
import ImageVisionAssistant from '../../components/complaints/ImageVisionAssistant'

const INCIDENT_CATEGORIES = [
  'Cleanliness & Sanitation',
  'Coach Maintenance / Broken Fitting',
  'Medical emergency',
  'Security threat / Theft',
  'Electrical & Air Conditioning',
  'Water Availability & Washroom',
  'Food & Catering Quality',
  'Passenger safety issue',
  'Other emergency'
]

const LANGUAGES = [
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'mr', label: 'मराठी (Marathi)' }
]

export default function ReportIncidentPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Active filing assistant tab: 'VOICE' | 'IMAGE' | 'MANUAL'
  const [activeTab, setActiveTab] = useState('VOICE')

  // Linked Demo PNR (optional, from ticket or PNR verification)
  const [linkedPnr, setLinkedPnr] = useState(null)

  // Form Fields
  const [trainNumber, setTrainNumber] = useState('12393')
  const [trainName, setTrainName] = useState('Sampoorna Kranti Express')
  const [coachNumber, setCoachNumber] = useState('B2')
  const [seatNumber, setSeatNumber] = useState('34')
  const [category, setCategory] = useState('Cleanliness & Sanitation')
  const [reportedLanguage, setReportedLanguage] = useState('ta')
  const [title, setTitle] = useState('Unclean Coach and Lavatory Sanitation Issue')
  const [location, setLocation] = useState('Enroute between Kanpur Central and Prayagraj')
  const [description, setDescription] = useState(
    'Coach lavatory is dirty and water is overflowing on floor. Passenger requests cleaning squad.'
  )
  const [passengerContact, setPassengerContact] = useState('+91 98765 43210')
  const [imageBase64, setImageBase64] = useState('')
  const [sourceModule, setSourceModule] = useState('VOICE')

  // Auto-fill from URL query parameters (e.g. from Digital Ticket or PNR Verification)
  useEffect(() => {
    const pnrParam = searchParams.get('pnr')
    const trainParam = searchParams.get('train')
    const trainNameParam = searchParams.get('trainName')
    const coachParam = searchParams.get('coach')
    const seatParam = searchParams.get('seat')
    const passengerParam = searchParams.get('passenger')
    const locParam = searchParams.get('location') || searchParams.get('route')

    if (pnrParam) {
      setLinkedPnr(pnrParam)
      setActiveTab('MANUAL')
      setTitle(`Emergency Distress - Train ${trainParam || ''} (PNR ${pnrParam})`)
      setDescription((prev) => 
        `Emergency distress report linked to verified Demo Booking PNR: ${pnrParam}.\nTrain: ${trainParam || ''} ${trainNameParam ? '(' + trainNameParam + ')' : ''}\nCoach: ${coachParam || 'N/A'}, Seat/Berth: ${seatParam || 'N/A'}\nPassenger: ${passengerParam || user?.full_name || 'Passenger'}`
      )
    }
    if (trainParam) setTrainNumber(trainParam)
    if (trainNameParam) setTrainName(trainNameParam)
    if (coachParam) setCoachNumber(coachParam)
    if (seatParam) setSeatNumber(seatParam)
    if (locParam) setLocation(locParam)
  }, [searchParams])

  const [loading, setLoading] = useState(false)
  const [submittedResult, setSubmittedResult] = useState(null)
  const [offlineResult, setOfflineResult] = useState(null)
  const [error, setError] = useState(null)

  // Module 2: IndexedDB Offline Engine State
  const [online, setOnline] = useState(isDeviceOnline())
  const [simOffline, setSimOffline] = useState(isSimulatedOffline())
  const [offlineQueue, setOfflineQueue] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [syncNotice, setSyncNotice] = useState(null)
  const [showQueueDrawer, setShowQueueDrawer] = useState(false)

  const reloadQueue = async () => {
    const items = await getAllOfflineComplaints()
    setOfflineQueue(items)
  }

  useEffect(() => {
    reloadQueue()
    const unsub = subscribeOfflineSync(() => {
      setOnline(isDeviceOnline())
      setSimOffline(isSimulatedOffline())
      reloadQueue()
    })
    return unsub
  }, [])

  const handleToggleSimulatedOffline = () => {
    const nextState = !simOffline
    setSimulatedOfflineMode(nextState)
    setSimOffline(nextState)
    setOnline(!nextState)
  }

  const handleManualSync = async () => {
    setSyncing(true)
    setSyncNotice(null)
    const res = await syncOfflineComplaints()
    setSyncing(false)
    if (res.success && res.count > 0) {
      setSyncNotice({
        type: 'success',
        text: `Successfully synchronized ${res.count} offline complaint(s) with RailResQ Control Room database!`
      })
      reloadQueue()
    } else if (res.success && res.count === 0) {
      setSyncNotice({
        type: 'info',
        text: 'All offline complaints are already synchronized.'
      })
    } else if (!res.success && res.reason === 'DEVICE_OFFLINE') {
      setSyncNotice({
        type: 'warning',
        text: 'Cannot synchronize: Device is currently in simulated tunnel dead-zone mode.'
      })
    }
  }

  // Receives extracted draft from Module 1 (Voice) or Module 3 (Image Vision)
  const handleApplyDraft = (draft) => {
    if (draft.title) setTitle(draft.title)
    if (draft.description) setDescription(draft.description)
    if (draft.category) setCategory(draft.category)
    if (draft.train_number) setTrainNumber(draft.train_number)
    if (draft.coach_number) setCoachNumber(draft.coach_number)
    if (draft.seat_number) setSeatNumber(draft.seat_number)
    if (draft.reported_language) setReportedLanguage(draft.reported_language)
    if (draft.image_base64) setImageBase64(draft.image_base64)
    if (draft.source_module) setSourceModule(draft.source_module)

    // Switch to manual review card so passenger can review & confirm before saving
    setActiveTab('MANUAL')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSubmittedResult(null)
    setOfflineResult(null)

    const payload = {
      train_number: trainNumber,
      train_name: trainName,
      coach_number: coachNumber,
      seat_number: seatNumber,
      title,
      description,
      category,
      reported_language: reportedLanguage,
      reported_location: location,
      passenger_name: user?.full_name || 'Passenger',
      passenger_contact: passengerContact,
      image_base64: imageBase64 || null,
      source_module: sourceModule
    }

    // Module 2: Offline-First Flow via IndexedDB
    if (!isDeviceOnline()) {
      const savedDraft = await saveOfflineComplaint(payload)
      setOfflineResult(savedDraft)
      await reloadQueue()
      setLoading(false)
      return
    }

    try {
      const res = await api.post('/incidents', payload)
      setSubmittedResult(res.data)
      setLoading(false)
    } catch (err) {
      // If server is unreachable despite navigator.onLine, gracefully save in IndexedDB
      console.warn('Direct submission error, safely saving into IndexedDB offline storage:', err)
      const savedDraft = await saveOfflineComplaint(payload)
      setOfflineResult(savedDraft)
      await reloadQueue()
      setLoading(false)
    }
  }

  const pendingCount = offlineQueue.filter((i) => i.status === 'SAVED_OFFLINE_PENDING_SYNC').length

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Banner & Connectivity Status Deck */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] bg-blue-900 text-blue-300 border border-blue-700 px-2 py-0.5 rounded font-mono font-bold">
                INDIAN RAILWAYS PASSENGER ASSISTANT
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                3 AI & OFFLINE MODULES
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">Passenger Emergency & Service Complaint Portal</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Multilingual Voice Assistant &bull; Offline IndexedDB Persistence &bull; Computer Vision Defect Extraction
            </p>
          </div>

          {/* Module 2: Viva Connectivity & Tunnel Simulation Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Simulation Mode Toggle Button */}
            <button
              type="button"
              onClick={handleToggleSimulatedOffline}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition border shadow-md ${
                simOffline
                  ? 'bg-rose-950 border-rose-600 text-rose-300 animate-pulse shadow-rose-900/40'
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
              }`}
              title="Toggle to simulate train entering cellular dead-zone or tunnel"
            >
              {simOffline ? <WifiOff className="w-4 h-4 text-rose-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
              <span>{simOffline ? 'Simulating Tunnel Dead-Zone' : 'Simulate Tunnel Dead-Zone'}</span>
            </button>

            {/* Offline IndexedDB Queue Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowQueueDrawer(!showQueueDrawer)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>IndexedDB Queue ({offlineQueue.length})</span>
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Cellular Connectivity Banner */}
        <div className={`p-3 rounded-xl border text-xs flex flex-wrap justify-between items-center gap-2 transition ${
          online
            ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
            : 'bg-amber-950/70 border-amber-600 text-amber-200'
        }`}>
          <div className="flex items-center space-x-2">
            {online ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-400 animate-bounce" />}
            <div>
              <span className="font-bold">
                {online ? 'Cellular Connection Active (Online Sync Enabled)' : 'Offline Mode (Cellular Dead-Zone / Tunnel Active)'}
              </span>
              <p className="text-[11px] opacity-80 mt-0.2">
                {online
                  ? 'Complaints submit directly to RailResQ central servers.'
                  : 'Module 2 Active: Complaints are preserved securely in your browser IndexedDB until signal returns.'}
              </p>
            </div>
          </div>

          {pendingCount > 0 && (
            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing || !online}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold transition shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Synchronizing...' : `Sync ${pendingCount} Offline Drafts Now`}</span>
            </button>
          )}
        </div>

        {syncNotice && (
          <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            syncNotice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
              : 'bg-amber-950/80 border-amber-700 text-amber-200'
          }`}>
            <span>{syncNotice.text}</span>
            <button onClick={() => setSyncNotice(null)} className="text-slate-400 hover:text-white font-bold ml-2">✕</button>
          </div>
        )}
      </div>

      {/* Module Navigation Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('VOICE')}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-bold transition border ${
            activeTab === 'VOICE'
              ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
          }`}
        >
          <Languages className="w-4 h-4 text-blue-300" />
          <span>Module 1: Voice Assistant (Tamil/Hindi)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('IMAGE')}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-bold transition border ${
            activeTab === 'IMAGE'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
              : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
          }`}
        >
          <Camera className="w-4 h-4 text-emerald-300" />
          <span>Module 3: Image Vision Assistant</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MANUAL')}
          className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-bold transition border ${
            activeTab === 'MANUAL'
              ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
          }`}
        >
          <Edit3 className="w-4 h-4 text-purple-300" />
          <span>Review & Manual Submission Form</span>
        </button>
      </div>

      {/* Tab 1: Module 1 Multilingual Voice Assistant */}
      {activeTab === 'VOICE' && (
        <MultilingualVoiceAssistant onApplyDraft={handleApplyDraft} />
      )}

      {/* Tab 2: Module 3 AI Image Vision Assistant */}
      {activeTab === 'IMAGE' && (
        <ImageVisionAssistant onApplyDraft={handleApplyDraft} />
      )}

      {/* Tab 3: Structured Review & Submission Form (Module 2 Integrated) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <span>Review, Edit and Submit Complaint</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify all extracted details. Works offline in tunnels and automatically syncs when signal returns.
            </p>
          </div>

          <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
            Source: {sourceModule}
          </span>
        </div>

        {/* Linked Verified Demo Booking Banner */}
        {linkedPnr && (
          <div className="bg-blue-950/60 border border-blue-600/60 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Train className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-blue-300">Linked to Verified Demo Booking</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-900/80 text-blue-200 border border-blue-700">
                    PNR: {linkedPnr}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Train: <strong className="text-white">{trainNumber} {trainName}</strong> &bull; Coach: <strong className="text-white">{coachNumber}</strong> &bull; Seat/Berth: <strong className="text-white">{seatNumber}</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLinkedPnr(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700"
              title="Clear linked ticket reference"
            >
              Unlink
            </button>
          </div>
        )}

        {/* Offline Submission Result Notification Card */}
        {offlineResult && (
          <div className="bg-amber-950/70 border-2 border-amber-600 rounded-2xl p-5 space-y-3.5 shadow-2xl animate-fade-in">
            <div className="flex items-center space-x-2.5 text-amber-300 font-black text-base">
              <WifiOff className="w-5 h-5 text-amber-400" />
              <span>Saved Offline – Pending Sync</span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              You are currently travelling in an area with poor or no internet connectivity (tunnel/dead-zone). Your complaint has been securely preserved on your device inside <strong>browser IndexedDB</strong>.
            </p>

            {/* Offline Ticket Details */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Local Offline Ticket ID:</span>
                <span className="font-mono text-amber-400 font-bold">{offlineResult.offline_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Idempotency Key:</span>
                <span className="font-mono text-slate-400 text-[11px]">{offlineResult.idempotency_key}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Local Record Time:</span>
                <span className="text-slate-300">{offlineResult.offline_timestamp}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Train & Coach:</span>
                <span className="text-white font-bold font-mono">#{offlineResult.train_number} &bull; Coach {offlineResult.coach_number}</span>
              </div>
            </div>

            {/* Mandatory Clear Distinction Disclaimer */}
            <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5 uppercase tracking-wide">
                  ⚠️ Important Distinction Notice:
                </strong>
                <span>
                  Offline saving does <strong>NOT</strong> mean the complaint has been officially submitted to Indian Railways. This is a locally saved draft. As soon as cellular connectivity returns, RailResQ will automatically synchronize this draft to central servers and assign an official railway ticket.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
              <span className="text-[11px] text-amber-300/80 font-mono">
                Automatic retry daemon is monitoring your connection.
              </span>
              <button
                type="button"
                onClick={() => setOfflineResult(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                File Another Complaint
              </button>
            </div>
          </div>
        )}

        {/* Online Submission Success Card */}
        {submittedResult && (
          <div className="bg-emerald-950/70 border-2 border-emerald-600 rounded-2xl p-5 space-y-3.5 shadow-2xl animate-fade-in">
            <div className="flex items-center space-x-2.5 text-emerald-300 font-black text-base">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>OFFICIALLY RECEIVED BY RAILRESQ & INDIAN RAILWAYS</span>
            </div>

            <p className="text-xs text-slate-200">
              Your emergency complaint has been successfully transmitted to the Control Room, triaged by the AI Multi-Agent Coordinator, and registered in the immutable audit log.
            </p>

            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Official Incident Ticket:</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  #{submittedResult.incident?.id || submittedResult.id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Assigned Priority:</span>
                <span className="font-bold text-rose-400">
                  {submittedResult.incident?.suggested_priority || submittedResult.suggested_priority || 'HIGH'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Triage Status:</span>
                <span className="font-bold text-blue-400">TRIAGED & QUEUED FOR OPERATOR DISPATCH</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
              <Link
                to="/passenger/reports"
                className="text-xs text-blue-400 underline font-semibold flex items-center space-x-1"
              >
                <span>Track My Active Incident Status &rarr;</span>
              </Link>
              <button
                type="button"
                onClick={() => setSubmittedResult(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                Submit New Report
              </button>
            </div>
          </div>
        )}

        {/* The Complaint Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Train, Coach, Seat Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Train Number:
              </label>
              <input
                type="text"
                value={trainNumber}
                onChange={(e) => setTrainNumber(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                placeholder="12393, 12301..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Coach Number:
              </label>
              <input
                type="text"
                value={coachNumber}
                onChange={(e) => setCoachNumber(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none uppercase"
                placeholder="B2, S4, A1..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Seat / Berth Number:
              </label>
              <input
                type="text"
                value={seatNumber}
                onChange={(e) => setSeatNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                placeholder="34, 45, SL..."
              />
            </div>
          </div>

          {/* Category & Language Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Complaint Category (AI Suggested / Editable):
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                {INCIDENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Original Spoken Language:
              </label>
              <select
                value={reportedLanguage}
                onChange={(e) => setReportedLanguage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Complaint Title:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              placeholder="Concise summary of defect or emergency..."
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Detailed Description & Observations:
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-blue-500 focus:outline-none"
              placeholder="State what is happening or visible..."
            />
          </div>

          {/* Location & Contact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Current Route Location (GPS / Landmark):
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                placeholder="Between stations, tunnel, kilometer post..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Passenger Phone / Contact:
              </label>
              <input
                type="text"
                value={passengerContact}
                onChange={(e) => setPassengerContact(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                placeholder="+91 Mobile number for TTE / RPF contact"
              />
            </div>
          </div>

          {/* Attached Image Preview if available */}
          {imageBase64 && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-300 font-semibold">Photographic evidence attached</span>
              </div>
              <button
                type="button"
                onClick={() => setImageBase64('')}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                Remove
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-950 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-xl ${
                !online
                  ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-amber-900/40'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
              }`}
            >
              <Send className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>
                {loading
                  ? 'Processing...'
                  : !online
                  ? 'Save Complaint in Offline IndexedDB (Pending Sync)'
                  : 'Submit Official Emergency Complaint to Indian Railways'}
              </span>
            </button>
            <p className="text-[11px] text-center text-slate-500 mt-2">
              {!online
                ? '⚠️ You are currently offline. This draft will be stored locally and automatically submitted when signal returns.'
                : 'Decision-Support Academic Prototype: All emergency actions require human operator review and approval.'}
            </p>
          </div>
        </form>
      </div>

      {/* Module 2: Dedicated IndexedDB Offline Storage Queue Drawer */}
      {showQueueDrawer && (
        <div className="bg-slate-900 border border-cyan-800/80 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <Database className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-bold text-white text-sm">Browser IndexedDB Storage Engine (RailResQ_IndexedDB)</h3>
                <p className="text-[11px] text-slate-400">
                  Total stored on this device: {offlineQueue.length} record(s) &bull; Pending sync: {pendingCount}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={clearSyncedOfflineComplaints}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1"
                title="Remove synced items from local device"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Synced</span>
              </button>
              <button
                type="button"
                onClick={() => setShowQueueDrawer(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                Close Drawer
              </button>
            </div>
          </div>

          {offlineQueue.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              IndexedDB queue is currently empty. No offline complaints stored on this device.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {offlineQueue.map((item) => {
                const isPending = item.status === 'SAVED_OFFLINE_PENDING_SYNC'

                return (
                  <div
                    key={item.idempotency_key}
                    className={`p-3 rounded-xl border text-xs flex flex-wrap justify-between items-start gap-2 ${
                      isPending
                        ? 'bg-amber-950/30 border-amber-800/80'
                        : 'bg-slate-950 border-slate-800 opacity-80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-white">#{item.train_number}</span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="text-cyan-400 font-bold font-mono">Coach {item.coach_number}</span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="text-slate-200 font-medium">{item.category}</span>
                      </div>
                      <p className="text-slate-300 line-clamp-1">{item.description}</p>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Idempotency Key: {item.idempotency_key} &bull; Recorded: {item.offline_timestamp}
                      </div>
                    </div>

                    <div className="text-right">
                      {isPending ? (
                        <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-700 px-2 py-0.5 rounded font-bold block animate-pulse">
                          SAVED OFFLINE (PENDING SYNC)
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-bold block">
                          OFFICIALLY RECEIVED (#{item.server_incident_id})
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Tier: {item.submission_tier}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
