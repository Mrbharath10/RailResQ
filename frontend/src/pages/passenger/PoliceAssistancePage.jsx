import React, { useState, useEffect } from 'react'
import { 
  ShieldAlert, 
  Phone, 
  MapPin, 
  Share2, 
  Search, 
  AlertCircle, 
  ExternalLink, 
  Clock, 
  Check, 
  Radio,
  Copy
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

export default function PoliceAssistancePage() {
  const [facilities, setFacilities] = useState([])
  const [selectedCity, setSelectedCity] = useState('ALL')
  const [loading, setLoading] = useState(true)

  // Location share state
  const [sharing, setSharing] = useState(false)
  const [shareData, setShareData] = useState(null)
  const [copied, setCopied] = useState(false)

  const CITIES = ['ALL', 'Chennai', 'Madurai', 'Coimbatore', 'Bengaluru']

  const fetchFacilities = async () => {
    setLoading(true)
    try {
      const params = { facility_type: 'POLICE' }
      if (selectedCity !== 'ALL') params.city = selectedCity
      const res = await api.get('/safety/facilities', { params })
      setFacilities(res.data)
    } catch (err) {
      console.error('Error fetching police facilities:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFacilities()
  }, [selectedCity])

  const handleShareLocation = async () => {
    setSharing(true)
    try {
      const res = await api.post('/safety/share-location', {
        passenger_name: 'Passenger',
        contact_phone: '+91 94440 12345',
        latitude: 13.0827,
        longitude: 80.2707,
        location_label: 'Chennai Central En Route',
        train_coach: 'Train #12637 Coach B4'
      })
      setShareData(res.data)
    } catch (err) {
      console.error('Share error:', err)
      alert('Unable to generate location share link')
    } finally {
      setSharing(false)
    }
  }

  const copyShareLink = () => {
    if (shareData?.tracking_url) {
      navigator.clipboard.writeText(shareData.tracking_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-xl shadow-blue-950/40 border border-blue-700/40">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-blue-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-blue-200 border border-blue-500/40">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-300" />
            <span>RPF & GRP Railway Security Network</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Police & Passenger Safety Assistance
          </h1>
          <p className="text-sm md:text-base text-blue-200/90 leading-relaxed">
            Immediate connection to Railway Protection Force (RPF), Government Railway Police (GRP), and 112 National Emergency responders across all stations.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="tel:112"
              className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg flex items-center space-x-2 transition"
            >
              <Phone className="w-4 h-4" />
              <span>Call 112 (National Emergency)</span>
            </a>
            <a
              href="tel:182"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg flex items-center space-x-2 transition"
            >
              <Radio className="w-4 h-4" />
              <span>RPF Security Desk: 182 / 139</span>
            </a>
          </div>
        </div>

        {/* Emergency SOS Shortcut */}
        <div className="absolute top-4 right-4 hidden md:block">
          <Link
            to="/passenger/report"
            className="bg-rose-950/80 border border-rose-500/60 hover:bg-rose-900 text-rose-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition shadow"
          >
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>File Live Incident SOS</span>
          </Link>
        </div>
      </div>

      {/* Live Location Sharing Tool */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Share2 className="w-4 h-4 text-blue-400" />
              <span>Share Live Travel Location with Family or RPF</span>
            </h3>
            <p className="text-xs text-slate-400">
              Generate an encrypted live tracking link with your train coordinates for trusted contacts.
            </p>
          </div>

          <button
            onClick={handleShareLocation}
            disabled={sharing}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow transition shrink-0"
          >
            <MapPin className="w-4 h-4" />
            <span>{sharing ? 'Generating...' : 'Broadcast My Coordinates'}</span>
          </button>
        </div>

        {shareData && (
          <div className="bg-slate-950 border border-blue-900/60 p-4 rounded-xl space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-blue-400 font-bold uppercase">
                Active Broadcast: {shareData.share_token}
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-mono">
                BROADCAST ACTIVE
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shareData.tracking_url}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
              />
              <button
                onClick={copyShareLink}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* City Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center mr-1">
          <MapPin className="w-3.5 h-3.5 mr-1 text-blue-400" /> City:
        </span>
        {CITIES.map(city => (
          <button
            key={city}
            onClick={() => setSelectedCity(city)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
              selectedCity === city
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {city === 'ALL' ? 'All Stations' : city}
          </button>
        ))}
      </div>

      {/* Police Stations Directory */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-blue-400" />
          <span>Station Police Posts & RPF Directory ({facilities.length})</span>
        </h3>

        {loading ? (
          <div className="text-center p-12">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Locating police outposts...</p>
          </div>
        ) : facilities.length === 0 ? (
          <div className="text-center p-10 bg-slate-900 border border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-400">No police stations listed for this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map(f => (
              <div
                key={f.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all duration-200"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60">
                      {f.station_code || f.city}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                      24x7 DESK
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{f.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{f.address}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Station Distance:</span>
                    <span className="font-semibold text-slate-200">{f.distance_km} km</span>
                  </div>

                  <a
                    href={`tel:${f.phone_number}`}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call: {f.phone_number}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
