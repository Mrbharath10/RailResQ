import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Train, 
  MapPin, 
  Activity, 
  Gauge, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldAlert,
  Hospital,
  Flame,
  Layers,
  Zap,
  TrendingUp,
  SlidersHorizontal,
  Compass,
  X,
  KeyRound,
  ExternalLink,
  LayoutGrid
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import api from '../../services/api'

// Custom Train Marker Icon with color differentiation and emergency radar
const createTrainMarkerIcon = (trainNum, isSelected, hasEmergency) => {
  const bgColor = hasEmergency ? '#dc2626' : (isSelected ? '#2563eb' : '#059669')
  const ringColor = hasEmergency ? 'rgba(239, 68, 68, 0.5)' : (isSelected ? 'rgba(37, 99, 235, 0.4)' : 'rgba(5, 150, 105, 0.3)')

  return L.divIcon({
    className: 'custom-fleet-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 52px; height: 52px;">
        ${(hasEmergency || isSelected) ? `<div style="position: absolute; width: 52px; height: 52px; border-radius: 9999px; background-color: ${ringColor}; animation: ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
        <div style="position: relative; width: 34px; height: 34px; border-radius: 9999px; background-color: ${bgColor}; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.6);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/>
          </svg>
        </div>
        <div style="background-color: #0f172a; color: #ffffff; border: 1px solid #475569; padding: 1px 5px; border-radius: 4px; font-size: 9px; font-weight: 800; font-family: monospace; margin-top: 2px; white-space: nowrap; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);">
          ${trainNum}
        </div>
      </div>
    `,
    iconSize: [52, 52],
    iconAnchor: [26, 26],
  })
}

// Custom Station Marker Icon
const createStationIcon = (code, isNext) => {
  return L.divIcon({
    className: 'custom-station-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="background-color: ${isNext ? '#059669' : '#1e293b'}; color: ${isNext ? '#a7f3d0' : '#ffffff'}; border: 2px solid ${isNext ? '#10b981' : '#64748b'}; padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: 800; font-family: monospace; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);">
          ${code}
        </div>
        <div style="width: 2px; height: 8px; background-color: ${isNext ? '#10b981' : '#64748b'};"></div>
      </div>
    `,
    iconSize: [42, 32],
    iconAnchor: [21, 32],
  })
}

function MapRecenter({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.panTo(center, { animate: true })
    }
  }, [center, map])
  return null
}

const getTrainPhoto = (t) => {
  const name = (t?.train_name || t?.name || '').toLowerCase()
  const type = (t?.train_type || t?.type || '').toLowerCase()
  if (name.includes('vande') || type.includes('vande')) return '/trains/vande-bharat-express.jpg'
  if (name.includes('tejas') || type.includes('tejas')) return '/trains/tejas-express.jpg'
  if (name.includes('rajdhani') || type.includes('rajdhani')) return '/trains/rajdhani-express.jpg'
  return '/trains/wap7-loco.jpg'
}

export default function LiveTrainTrackingView() {
  const [selectedTrain, setSelectedTrain] = useState('12393')
  const [searchInput, setSearchInput] = useState('')
  const [mode, setMode] = useState('LIVE')
  const [fleet, setFleet] = useState([])
  const [activeTrainStatus, setActiveTrainStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastSyncSeconds, setLastSyncSeconds] = useState(0)
  const [typeFilter, setTypeFilter] = useState('ALL') // 'ALL', 'SAMPOORNA', 'VANDE_BHARAT', 'RAJDHANI', 'EMERGENCY', 'DELAYED'

  // QRail.in Developer API State
  const [showQrailModal, setShowQrailModal] = useState(false)
  const [qrailConfig, setQrailConfig] = useState(null)
  const [inputKey, setInputKey] = useState('')
  const [testingKey, setTestingKey] = useState(false)
  const [qrailTestResult, setQrailTestResult] = useState(null)

  const fetchQrailConfig = async () => {
    try {
      const res = await api.get('/railway/qrail/status')
      setQrailConfig(res.data)
    } catch (e) {
      console.error('Failed to load QRail status:', e)
    }
  }

  const fetchFleetTelemetry = async () => {
    try {
      const [fleetRes, activeRes] = await Promise.all([
        api.get(`/railway/trains/live-fleet?mode=${mode}`),
        api.get(`/railway/trains/${selectedTrain}/status?mode=${mode}`)
      ])
      setFleet(fleetRes.data)
      setActiveTrainStatus(activeRes.data)
      setLastSyncSeconds(0)
    } catch (err) {
      console.error('Error fetching fleet telemetry:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQrailConfig()
  }, [])

  // Poll real-time live telemetry every 3 seconds for continuous smooth motion
  useEffect(() => {
    fetchFleetTelemetry()
    const pollInterval = setInterval(fetchFleetTelemetry, 3000)
    const clockInterval = setInterval(() => setLastSyncSeconds((s) => s + 1), 1000)

    return () => {
      clearInterval(pollInterval)
      clearInterval(clockInterval)
    }
  }, [selectedTrain, mode])

  const handleSelectTrain = (trainNum) => {
    setSelectedTrain(trainNum)
    setLoading(true)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchInput.trim()) return
    setSelectedTrain(searchInput.trim())
    setLoading(true)
  }

  const toggleMode = () => {
    setMode((m) => (m === 'LIVE' ? 'SIMULATED' : 'LIVE'))
    setLoading(true)
  }

  const handleSaveQrailKey = async (e) => {
    e.preventDefault()
    if (!inputKey.trim()) return
    try {
      const res = await api.post('/railway/qrail/configure', { api_key: inputKey.trim() })
      setQrailConfig(res.data.config)
      setQrailTestResult({
        success: true,
        message: 'QRail.in API Key successfully saved and activated!'
      })
      fetchFleetTelemetry()
    } catch (err) {
      setQrailTestResult({
        success: false,
        message: 'Error saving QRail API key.'
      })
    }
  }

  const handleTestQrail = async (testTrainNo = '12393') => {
    setTestingKey(true)
    setQrailTestResult(null)
    try {
      const res = await api.post(`/railway/qrail/test?train_number=${testTrainNo}&api_key=${inputKey.trim() || ''}`)
      setQrailTestResult(res.data)
      if (res.data.success) {
        setSelectedTrain(testTrainNo)
        fetchFleetTelemetry()
      }
    } catch (err) {
      setQrailTestResult({
        success: false,
        message: 'Network request to QRail.in failed or timed out.'
      })
    } finally {
      setTestingKey(false)
    }
  }

  // Filter fleet based on category and search
  const filteredFleet = fleet.filter((t) => {
    // Search filter
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase()
      const matchNum = t.train_number.toLowerCase().includes(q)
      const matchName = t.train_name.toLowerCase().includes(q)
      const matchNext = t.next_station_name.toLowerCase().includes(q)
      if (!matchNum && !matchName && !matchNext) return false
    }

    // Type filter
    if (typeFilter === 'EMERGENCY') return t.has_active_emergency
    if (typeFilter === 'DELAYED') return t.delay_minutes > 0
    if (typeFilter === 'SAMPOORNA') return t.train_number === '12393'
    if (typeFilter === 'VANDE_BHARAT') return t.train_type?.toLowerCase().includes('vande')
    if (typeFilter === 'RAJDHANI') return t.train_type?.toLowerCase().includes('rajdhani')
    return true
  })

  const trainLat = activeTrainStatus?.current_gps?.latitude || 26.4547
  const trainLng = activeTrainStatus?.current_gps?.longitude || 80.3507
  const polylineCoords = activeTrainStatus?.schedule?.map((s) => [s.latitude, s.longitude]) || []

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Control Deck */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="bg-emerald-600/20 p-2 rounded-xl border border-emerald-500/30">
              <Train className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-white">All-Train Realtime Live Tracking & NTES Status</h1>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                  {fleet.length} CORRIDOR TRAINS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                QRail.in Official Indian Railways Developers API &bull; Live IR-GPS Telemetry &bull; Station Countdown &bull; Emergency Coordination Sync
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* QRail.in Developer API Connect Button */}
          <button
            onClick={() => setShowQrailModal(true)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition border shadow-lg ${
              qrailConfig?.configured
                ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-amber-900/30'
                : 'bg-slate-800 hover:bg-slate-750 border-amber-600/50 text-amber-300'
            }`}
            title="Configure QRail.in Developers API"
          >
            <Zap className={`w-3.5 h-3.5 ${qrailConfig?.configured ? 'text-amber-400 animate-pulse' : 'text-amber-400'}`} />
            <span>{qrailConfig?.configured ? `⚡ QRAIL API: ${qrailConfig.masked_key}` : '⚡ Connect QRail.in API'}</span>
          </button>

          <button
            onClick={toggleMode}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-black transition border shadow-lg ${
              mode === 'LIVE'
                ? 'bg-rose-950/80 border-rose-600 text-rose-300 shadow-rose-900/30'
                : 'bg-emerald-950/80 border-emerald-600 text-emerald-300 shadow-emerald-900/30'
            }`}
            title="Toggle between Live Telemetry and Simulated Baseline"
          >
            <Radio className={`w-3.5 h-3.5 ${mode === 'LIVE' ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
            <span>MODE: {mode} TELEMETRY</span>
          </button>

          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search train (12393, 12301...)"
                className="pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white w-48 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="text-xs text-slate-400 hover:text-white px-1"
              >
                Clear
              </button>
            )}
          </form>

          <button
            onClick={fetchFleetTelemetry}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition"
            title="Refresh Fleet Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* RailRadar & Innovation Quick Navigation Strip */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Railway Data Provider:</span>
          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
            ⚡ RailRadar API: rg_ce67...048a
          </span>
          <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-mono">
            National GIS Mesh Active
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/coaches?train=${selectedTrain}`}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 transition shadow-sm"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span>Coach Blueprint (#{selectedTrain}) &rarr;</span>
          </Link>

          <Link
            to={`/station-board?station=${activeTrainStatus?.next_station || 'CNB'}`}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 transition shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Station Live Board ({activeTrainStatus?.next_station || 'CNB'}) &rarr;</span>
          </Link>

          <Link
            to="/passenger/report"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 transition shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Innovation 3: Offline-First Queue &rarr;</span>
          </Link>
        </div>
      </div>

      {/* QRail.in API Integration Modal */}
      {showQrailModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="bg-amber-500/20 p-2 rounded-lg border border-amber-500/30">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">QRail.in Indian Railways Developers API</h3>
                  <p className="text-xs text-slate-400">Live PNR, Train Schedule & Official NTES Real-Time Running Status</p>
                </div>
              </div>
              <button
                onClick={() => setShowQrailModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* API Endpoint Visual from User's Documentation */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                Target Live Running Status Endpoint
              </span>
              <div className="bg-slate-900 px-3 py-2 rounded-lg font-mono text-xs text-emerald-300 overflow-x-auto border border-slate-800">
                curl &quot;https://qrail.in/api/v3/trains/running/12393/today/<span className="text-amber-400">YOUR_API_KEY</span>&quot;
              </div>
              <p className="text-[11px] text-slate-400">
                Replace <code className="text-amber-400 font-mono">YOUR_API_KEY</code> with your account token from <a href="https://qrail.in" target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center">qrail.in <ExternalLink className="w-2.5 h-2.5 ml-0.5" /></a>.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSaveQrailKey} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Enter Your QRail.in API Key:
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="Paste your QRail API key here..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {qrailTestResult && (
                <div className={`p-3 rounded-xl border text-xs ${
                  qrailTestResult.success
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                    : 'bg-amber-950/80 border-amber-700 text-amber-200'
                }`}>
                  <div className="font-bold">{qrailTestResult.message}</div>
                  {qrailTestResult.fallback_telemetry && (
                    <div className="text-[11px] text-slate-300 mt-1">
                      &bull; High-precision corridor telemetry is active as fallback for train #{qrailTestResult.test_train}.
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleTestQrail('12393')}
                  disabled={testingKey}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700 flex items-center space-x-1.5"
                >
                  <Train className="w-3.5 h-3.5 text-blue-400" />
                  <span>{testingKey ? 'Testing 12393...' : 'Test Train #12393 (Sampoorna Kranti)'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowQrailModal(false)}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-500/20"
                  >
                    Save & Activate QRail Key
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fleet Live KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Active Fleet Monitored
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-white">{fleet.length} Trains</span>
            <span className="text-xs bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-mono">
              Live IR-GPS
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
            Punctuality Performance
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-400">
              {Math.round((fleet.filter(f => f.delay_minutes === 0).length / Math.max(1, fleet.length)) * 100)}%
            </span>
            <span className="text-xs text-slate-400 font-mono">Right Time</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-900/60 rounded-xl p-4 bg-rose-950/20 shadow">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
            Emergency Alerts
          </span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-rose-500">
              {fleet.filter(f => f.has_active_emergency).length} Active
            </span>
            <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-bold animate-pulse">
              Coordination Req.
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Corridor Telemetry Sync
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-white font-mono">Auto-Sync</span>
            <span className="text-xs text-emerald-400 font-mono flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{lastSyncSeconds}s ago</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Leaflet Map (Left) & NTES Live Status Board (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive National Leaflet Map (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col h-[560px]">
          <div className="flex justify-between items-center mb-3 px-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Live National Railway GIS Map &bull; Tracking {fleet.length} Superfast Trains
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
              <span>Following: <strong className="text-blue-400">#{selectedTrain}</strong> ({activeTrainStatus?.train_name})</span>
            </div>
          </div>

          <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-800 relative">
            <MapContainer
              center={[trainLat, trainLng]}
              zoom={6}
              scrollWheelZoom={true}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapRecenter center={[trainLat, trainLng]} />

              {/* Active Train Polyline */}
              {polylineCoords.length > 0 && (
                <Polyline
                  positions={polylineCoords}
                  pathOptions={{
                    color: activeTrainStatus?.has_active_emergency ? '#dc2626' : (selectedTrain === '12393' ? '#f59e0b' : '#2563eb'),
                    weight: 4,
                    opacity: 0.85,
                    dashArray: '8, 8',
                  }}
                />
              )}

              {/* Station Markers for active route */}
              {activeTrainStatus?.schedule?.map((st) => (
                <Marker
                  key={st.station_code}
                  position={[st.latitude, st.longitude]}
                  icon={createStationIcon(st.station_code, st.station_code === activeTrainStatus.next_station)}
                >
                  <Popup>
                    <div className="text-xs p-1 space-y-1">
                      <div className="font-bold text-white text-sm">{st.station_name} ({st.station_code})</div>
                      <div className="text-slate-300">Scheduled Arrival: <strong className="text-emerald-400">{st.sch_arr}</strong></div>
                      <div className="text-slate-300">Platform: <strong>{st.platform}</strong> &bull; Distance: {st.distance_km} km</div>
                      <div className="text-[10px] text-emerald-300 pt-1 border-t border-slate-700">
                        {st.has_medical && <span>&bull; Level-2 Trauma Unit Available<br /></span>}
                        {st.has_fire && <span>&bull; Fire Response Tender Stationed<br /></span>}
                        <span>&bull; Station Master Direct Emergency Line</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Markers for ALL Trains in the Fleet Moving Simultaneously */}
              {fleet.map((t) => {
                const isSelected = t.train_number === selectedTrain
                const lat = t.current_gps?.latitude || 26.4547
                const lng = t.current_gps?.longitude || 80.3507

                return (
                  <Marker
                    key={t.train_number}
                    position={[lat, lng]}
                    icon={createTrainMarkerIcon(t.train_number, isSelected, t.has_active_emergency)}
                    eventHandlers={{
                      click: () => handleSelectTrain(t.train_number)
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1 space-y-1">
                        <div className="font-bold text-white text-sm">🚆 {t.train_name} (#{t.train_number})</div>
                        <div className="text-slate-300">Type: <strong className="text-slate-100">{t.train_type}</strong></div>
                        <div className="text-slate-300">Speed: <strong className="text-emerald-400 font-mono">{t.speed_kmph} km/h</strong></div>
                        <div className="text-slate-300">Next Halt: <strong className="text-blue-400">{t.next_station_name}</strong> (~{t.eta_next_station_minutes}m)</div>
                        <div className="text-slate-300">Running Status: <strong className={t.delay_minutes === 0 ? 'text-emerald-400' : 'text-amber-400'}>
                          {t.delay_minutes === 0 ? 'Right Time' : `+${t.delay_minutes}m Delayed`}
                        </strong></div>
                        {t.has_active_emergency && (
                          <div className="p-1 bg-rose-950 text-rose-300 rounded text-[10px] font-bold border border-rose-800">
                            🚨 ACTIVE EMERGENCY ONBOARD (Incident #{t.active_emergency_id})
                          </div>
                        )}
                        <button
                          onClick={() => handleSelectTrain(t.train_number)}
                          className="w-full mt-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold"
                        >
                          Lock & View NTES Schedule
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>
        </div>

        {/* Selected Train NTES Live Running Status Panel (1 Col) */}
        {activeTrainStatus && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between h-[560px] overflow-y-auto space-y-4">
            <div>
              {/* Real-Time Train Cover Photo Banner */}
              <div className="h-32 -mx-5 -mt-5 mb-4 relative overflow-hidden rounded-t-2xl bg-slate-950 border-b border-slate-800">
                <img 
                  src={getTrainPhoto(activeTrainStatus)} 
                  alt={activeTrainStatus.train_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = '/trains/vande-bharat-express.jpg'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-black/30 p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-amber-300 border border-amber-500/40 shadow-sm">
                      LIVE FLEET TELEMETRY
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/90 backdrop-blur-md text-blue-200 border border-blue-500/40 font-mono shadow-sm">
                      {activeTrainStatus.train_type || 'EXPRESS'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white drop-shadow-md">
                      #{activeTrainStatus.train_number} • {activeTrainStatus.train_name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Header with Name and Badge */}
              <div className="border-b border-slate-800 pb-3 mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-lg text-white">{activeTrainStatus.train_name}</span>
                      <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded font-mono font-bold">
                        #{activeTrainStatus.train_number}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{activeTrainStatus.route_name}</p>
                    <span className="text-[10px] text-slate-500 font-mono block">{activeTrainStatus.zone}</span>
                  </div>

                  {activeTrainStatus.has_active_emergency ? (
                    <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-1 rounded font-bold animate-pulse">
                      🚨 EMERGENCY
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-1 rounded font-bold">
                      NORMAL OPS
                    </span>
                  )}
                </div>

                {/* Emergency banner with link */}
                {activeTrainStatus.has_active_emergency && (
                  <div className="mt-2.5 p-2.5 bg-rose-950/60 border border-rose-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="text-xs text-rose-200 font-semibold">Active passenger report under triage</span>
                    </div>
                    <Link
                      to="/operator/dashboard"
                      className="text-[10px] bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded font-bold transition shrink-0"
                    >
                      Open Triage &rarr;
                    </Link>
                  </div>
                )}
              </div>

              {/* Running Status Gauges */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase flex items-center space-x-1">
                    <Gauge className="w-3 h-3 text-emerald-400" />
                    <span>Current Speed</span>
                  </span>
                  <div className="flex items-baseline space-x-1.5 mt-0.5">
                    <span className="font-mono font-bold text-emerald-400 text-base">{activeTrainStatus.speed_kmph}</span>
                    <span className="text-[10px] text-slate-400">km/h (Max: {activeTrainStatus.max_speed_kmph})</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>Schedule Delay</span>
                  </span>
                  <div className="mt-0.5">
                    <span className={`font-mono font-bold text-sm ${activeTrainStatus.delay_minutes === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {activeTrainStatus.delay_minutes === 0 ? 'Right Time (0m)' : `+${activeTrainStatus.delay_minutes} mins delay`}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Next Station Halt & ETA</span>
                    <span className="text-[10px] text-slate-400 font-mono">Platform {activeTrainStatus.schedule?.find(s => s.station_code === activeTrainStatus.next_station)?.platform || '1'}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-bold text-emerald-300 text-xs">
                      {activeTrainStatus.next_station_name} ({activeTrainStatus.next_station})
                    </span>
                    <span className="font-mono text-amber-400 font-bold text-xs">
                      ~{activeTrainStatus.eta_next_station_minutes} mins ({activeTrainStatus.distance_to_next_km} km)
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Jump to 24-Coach Layout and Station Live Timetable */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Link
                  to={`/coaches?train=${activeTrainStatus.train_number}`}
                  className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-cyan-800/60 hover:border-cyan-500 rounded-xl text-center transition group flex flex-col justify-center items-center shadow"
                >
                  <div className="flex items-center space-x-1 text-cyan-400 font-bold text-xs">
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>24-Coach Rake</span>
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-white mt-0.5">
                    Berths & Equipment &rarr;
                  </span>
                </Link>

                <Link
                  to={`/station-board?station=${activeTrainStatus.next_station || 'CNB'}`}
                  className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-amber-800/60 hover:border-amber-500 rounded-xl text-center transition group flex flex-col justify-center items-center shadow"
                >
                  <div className="flex items-center space-x-1 text-amber-400 font-bold text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Station Board</span>
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-white mt-0.5">
                    {activeTrainStatus.next_station || 'CNB'} Arrivals &rarr;
                  </span>
                </Link>
              </div>

              {/* Journey Progress Bar */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 mb-3">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                  <span>Covered: {activeTrainStatus.distance_covered_km} km</span>
                  <span className="text-white font-bold">{activeTrainStatus.progress_percent}%</span>
                  <span>Total: {activeTrainStatus.total_route_km} km</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${activeTrainStatus.progress_percent}%` }}
                  ></div>
                </div>
              </div>

              {/* NTES-style Station-by-Station Running Status List */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Station Itinerary (NTES Live Board)
                </span>
                {activeTrainStatus.schedule?.map((st) => {
                  const isNext = st.station_code === activeTrainStatus.next_station
                  const isPassed = st.status === 'PASSED'

                  return (
                    <div
                      key={st.station_code}
                      className={`p-2 rounded-lg border text-xs flex justify-between items-center transition ${
                        isNext
                          ? 'bg-emerald-950/60 border-emerald-600 shadow-md ring-1 ring-emerald-500/30'
                          : isPassed
                          ? 'bg-slate-950/40 border-slate-800 opacity-60'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white">{st.station_name}</span>
                          <span className="font-mono text-[10px] text-slate-400">({st.station_code})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                          <span>Plat. {st.platform}</span>
                          <span>&bull;</span>
                          <span>{st.distance_km} km</span>
                          {st.has_medical && <span className="text-rose-400 font-semibold">&bull; Trauma Unit</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-200 block">{st.sch_arr}</span>
                        {isNext && (
                          <span className="text-[9px] bg-emerald-900 text-emerald-200 font-bold px-1.5 py-0.2 rounded uppercase animate-pulse">
                            NEXT HALT
                          </span>
                        )}
                        {isPassed && (
                          <span className="text-[9px] text-slate-500 font-mono">
                            DEPARTED
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
              <span className="text-amber-400 font-semibold">{activeTrainStatus.source}</span>
              <span className="text-emerald-400 font-mono font-bold">GPS LOCK ({Math.round(activeTrainStatus.confidence * 100)}%)</span>
            </div>
          </div>
        )}
      </div>

      {/* National Fleet Live Running Status Wall (All Monitored Trains) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Train className="w-5 h-5 text-blue-400" />
              <span>National Railway Fleet Live Running Status Wall</span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time corridor view across all {fleet.length} active trains. Click any card to follow live.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: `All Trains (${fleet.length})` },
              { id: 'SAMPOORNA', label: '⭐ Sampoorna Kranti (#12393)' },
              { id: 'VANDE_BHARAT', label: 'Vande Bharat' },
              { id: 'RAJDHANI', label: 'Rajdhani' },
              { id: 'EMERGENCY', label: `🚨 Alerts (${fleet.filter(f => f.has_active_emergency).length})` },
              { id: 'DELAYED', label: 'Delayed' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  typeFilter === f.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFleet.map((t) => {
            const isSelected = t.train_number === selectedTrain

            return (
              <div
                key={t.train_number}
                onClick={() => handleSelectTrain(t.train_number)}
                className={`rounded-2xl border cursor-pointer transition shadow-lg flex flex-col justify-between overflow-hidden group ${
                  isSelected
                    ? 'bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/40'
                    : t.train_number === '12393'
                    ? 'bg-amber-950/20 border-amber-800/80 hover:bg-amber-950/30'
                    : t.has_active_emergency
                    ? 'bg-rose-950/20 border-rose-800 hover:bg-rose-950/30'
                    : 'bg-slate-950 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                {/* Real Train Photo Thumbnail */}
                <div className="h-24 relative overflow-hidden bg-slate-900 border-b border-slate-800/80">
                  <img 
                    src={getTrainPhoto(t)} 
                    alt={t.train_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = '/trains/vande-bharat-express.jpg'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-2.5 flex items-end justify-between">
                    <span className="text-[10px] font-mono font-bold bg-black/80 text-amber-300 px-2 py-0.5 rounded border border-amber-600/40">
                      #{t.train_number}
                    </span>
                    <span className="text-[10px] font-bold bg-black/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/60 font-mono">
                      {t.train_type || 'EXPRESS'}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-white text-sm block line-clamp-1">{t.train_name}</span>
                        <span className="font-mono text-xs font-bold text-blue-400">{t.source_station || 'MAS'} &rarr; {t.destination_station || 'MDU'}</span>
                      </div>
                      {t.has_active_emergency ? (
                        <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-bold px-1.5 py-0.5 rounded animate-pulse">
                          ALERT
                        </span>
                      ) : t.train_number === '12393' ? (
                        <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 font-bold px-1.5 py-0.5 rounded font-mono">
                          QRAIL DEMO
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold px-1.5 py-0.5 rounded font-mono">
                          {t.delay_minutes === 0 ? 'ON TIME' : `+${t.delay_minutes}m`}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 space-y-1 mb-3">
                      <div>Next Halt: <strong className="text-slate-200">{t.next_station_name}</strong></div>
                      <div>ETA: <strong className="text-amber-400">~{t.eta_next_station_minutes} mins</strong> ({t.distance_to_next_km} km)</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                    <span className="font-mono text-emerald-400 font-semibold">{t.speed_kmph} km/h</span>
                    <span className="text-blue-400 font-semibold hover:underline flex items-center space-x-1">
                      <span>{isSelected ? 'Selected' : 'Track Route'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
