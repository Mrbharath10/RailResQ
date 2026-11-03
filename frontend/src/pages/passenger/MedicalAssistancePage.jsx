import React, { useState, useEffect } from 'react'
import { 
  HeartPulse, 
  Phone, 
  MapPin, 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Truck, 
  CheckCircle2, 
  Info,
  ChevronRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

export default function MedicalAssistancePage() {
  const [facilities, setFacilities] = useState([])
  const [selectedCity, setSelectedCity] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [activeGuideTab, setActiveGuideTab] = useState('cpr')

  const CITIES = ['ALL', 'Chennai', 'Madurai', 'Coimbatore', 'Bengaluru']

  const fetchHospitals = async () => {
    setLoading(true)
    try {
      const params = {}
      if (selectedCity !== 'ALL') params.city = selectedCity
      const res = await api.get('/safety/facilities', { params })
      // Filter hospitals and ambulances
      const medical = res.data.filter(f => f.facility_type === 'HOSPITAL' || f.facility_type === 'AMBULANCE_PROVIDER')
      setFacilities(medical)
    } catch (err) {
      console.error('Error fetching medical facilities:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHospitals()
  }, [selectedCity])

  const FIRST_AID_PROTOCOLS = {
    cpr: {
      title: 'Cardiac Arrest & Chest Compressions (CPR)',
      steps: [
        'Check passenger responsiveness: Tap shoulders firmly and shout "Are you okay?".',
        'Call for onboard doctor immediately using the train PA or alert the TTE.',
        'Place heel of one hand in center of passenger\'s chest; interlock fingers with other hand.',
        'Push hard and fast: 100-120 compressions per minute at least 2 inches deep.',
        'Allow chest to recoil fully between compressions until medical squad arrives at next station.'
      ],
      warning: 'Do not delay compressions. Immediate CPR triples survival chances in train environments.'
    },
    bleeding: {
      title: 'Severe Bleeding & Wound Management',
      steps: [
        'Apply firm, continuous direct pressure over the wound using a clean cloth, towel, or sterile gauze.',
        'Keep passenger lying down and elevate the injured limb above heart level if no fracture is suspected.',
        'Do not remove blood-soaked cloths; place fresh layers on top and continue direct pressure.',
        'Inform TTE to arrange medical triage handover at the next upcoming halt station.'
      ],
      warning: 'Never apply a tourniquet around neck or loose limbs unless trained.'
    },
    stroke: {
      title: 'FAST Stroke Identification Protocol',
      steps: [
        'Face: Ask person to smile. Does one side of the face droop?',
        'Arms: Ask person to raise both arms. Does one arm drift downward?',
        'Speech: Ask person to repeat a simple phrase. Is speech slurred or strange?',
        'Time: If you observe any of these signs, immediately trigger the RailResQ Medical Emergency SOS.'
      ],
      warning: 'Every minute counts: ischemic brain damage progresses rapidly without prompt clot-dissolving treatment.'
    },
    fainting: {
      title: 'Heat Exhaustion & Syncope (Fainting)',
      steps: [
        'Lay passenger flat on their back and elevate legs 12 inches to restore blood flow to the brain.',
        'Loosen restrictive clothing around collar and chest; open emergency windows for fresh ventilation.',
        'Offer small sips of cool water or electrolyte solution once passenger is fully conscious.',
        'If passenger does not regain consciousness within 1 minute, treat as high-priority medical emergency.'
      ],
      warning: 'Do not give oral liquids to a passenger who is drowsy or unconscious.'
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-700 via-red-800 to-slate-900 p-6 md:p-8 text-white shadow-xl shadow-red-950/40 border border-red-700/40">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-rose-200 border border-rose-400/40">
            <HeartPulse className="w-3.5 h-3.5 text-rose-300" />
            <span>24x7 Rapid Medical Coordination Network</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Ambulance & Emergency Medical Assistance
          </h1>
          <p className="text-sm md:text-base text-rose-100/90 leading-relaxed">
            Immediate dispatch coordination with 108 Emergency Ambulances and nearby railway empanelled trauma care hospitals.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="tel:108"
              className="bg-white text-red-700 hover:bg-rose-50 px-5 py-2.5 rounded-xl text-xs font-black shadow-lg flex items-center space-x-2 transition"
            >
              <Truck className="w-4 h-4 text-red-600" />
              <span>Call 108 (National Ambulance)</span>
            </a>
            <Link
              to="/passenger/report"
              className="bg-black/40 hover:bg-black/60 text-white px-5 py-2.5 rounded-xl text-xs font-bold border border-white/20 flex items-center space-x-2 transition shadow"
            >
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>File Medical SOS to Control Room</span>
            </Link>
          </div>
        </div>

        {/* Academic Simulation Notice */}
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-[11px] text-rose-200 font-mono">
          Simulated Medical Network • Decision Support
        </div>
      </div>

      {/* Interactive First-Aid Emergency Reference Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-rose-400" />
            <span>Onboard First-Aid Guidance (Step-by-Step)</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">STABILIZATION PROTOCOLS</span>
        </div>

        {/* Protocol Selector Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {[
            { id: 'cpr', label: '🫀 CPR / Cardiac' },
            { id: 'bleeding', label: '🩸 Severe Bleeding' },
            { id: 'stroke', label: '🧠 Stroke (FAST)' },
            { id: 'fainting', label: '💧 Heat & Fainting' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveGuideTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                activeGuideTab === tab.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Protocol Card */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-rose-300">
            {FIRST_AID_PROTOCOLS[activeGuideTab].title}
          </h4>

          <ol className="space-y-2 text-xs text-slate-300 list-decimal pl-4">
            {FIRST_AID_PROTOCOLS[activeGuideTab].steps.map((st, idx) => (
              <li key={idx} className="leading-relaxed">{st}</li>
            ))}
          </ol>

          <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/40 p-2.5 rounded-xl flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{FIRST_AID_PROTOCOLS[activeGuideTab].warning}</span>
          </div>
        </div>
      </div>

      {/* City Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center mr-1">
          <MapPin className="w-3.5 h-3.5 mr-1 text-rose-400" /> City:
        </span>
        {CITIES.map(city => (
          <button
            key={city}
            onClick={() => setSelectedCity(city)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
              selectedCity === city
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {city === 'ALL' ? 'All Stations' : city}
          </button>
        ))}
      </div>

      {/* Hospitals & Ambulance Hubs Directory */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
          <HeartPulse className="w-4 h-4 text-rose-400" />
          <span>Empanelled Hospitals & 24x7 Trauma Centers ({facilities.length})</span>
        </h3>

        {loading ? (
          <div className="text-center p-12">
            <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Loading nearby medical centers...</p>
          </div>
        ) : facilities.length === 0 ? (
          <div className="text-center p-10 bg-slate-900 border border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-400">No medical facilities found for this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map(f => (
              <div
                key={f.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all duration-200"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
                      {f.station_code || f.city}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{f.has_icu ? 'ICU READY' : 'PRIMARY CARE'}</span>
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
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Ambulances Stationed:</span>
                    <span className="font-bold text-emerald-400">{f.ambulances_available} Available</span>
                  </div>

                  <a
                    href={`tel:${f.phone_number}`}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Emergency Call: {f.phone_number}</span>
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
