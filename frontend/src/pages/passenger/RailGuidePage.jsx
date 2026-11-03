import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Utensils, 
  Navigation, 
  CreditCard, 
  Users, 
  Info,
  CheckCircle2,
  ChevronRight,
  Luggage,
  Train
} from 'lucide-react'
import api from '../../services/api'

export default function RailGuidePage() {
  const [selectedStation, setSelectedStation] = useState('MAS')
  const [stationData, setStationData] = useState(null)
  const [loading, setLoading] = useState(true)

  const STATIONS = [
    { code: 'MAS', name: 'Chennai Central (MAS)' },
    { code: 'MS', name: 'Chennai Egmore (MS)' },
    { code: 'MDU', name: 'Madurai Jn (MDU)' },
    { code: 'CBE', name: 'Coimbatore Jn (CBE)' },
    { code: 'SBC', name: 'KSR Bengaluru City (SBC)' }
  ]

  const fetchStationGuide = async (code) => {
    setLoading(true)
    try {
      const res = await api.get(`/travel-guide/rail-guide/station/${code}`)
      setStationData(res.data)
    } catch (err) {
      console.error('Error fetching station rail guide:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStationGuide(selectedStation)
  }, [selectedStation])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 md:p-8 text-white shadow-xl shadow-blue-950/40 border border-blue-700/40">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-blue-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-blue-200 border border-blue-500/40">
            <Building2 className="w-3.5 h-3.5 text-blue-300" />
            <span>Passenger Station Amenities & Cloakroom Directory</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Rail Guide: Station Facilities & Cloakrooms
          </h1>
          <p className="text-sm md:text-base text-blue-200/90 leading-relaxed">
            Everything you need to know about waiting lounges, 24x7 cloakrooms, wheelchair assistance, IRCTC food courts, and metro connections.
          </p>
        </div>

        {/* Academic Simulation Notice */}
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-[11px] text-blue-200 font-mono">
          Official Station Amenities Guide
        </div>
      </div>

      {/* Station Selector Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-lg">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center mr-1">
          <Train className="w-3.5 h-3.5 mr-1 text-blue-400" /> Select Junction:
        </span>
        {STATIONS.map(st => (
          <button
            key={st.code}
            onClick={() => setSelectedStation(st.code)}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
              selectedStation === st.code
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {st.name}
          </button>
        ))}
      </div>

      {/* Station Facilities Content */}
      {loading ? (
        <div className="text-center p-16">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-400 text-sm">Fetching station amenities layout...</p>
        </div>
      ) : stationData ? (
        <div className="space-y-6">
          
          {/* Station Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">{stationData.division}</span>
              <h2 className="text-xl font-black text-slate-100">{stationData.name}</h2>
              <p className="text-xs text-slate-400">{stationData.city} • {stationData.platforms} Platforms</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700 px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>24x7 Cloakroom & Help Desk Active</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Waiting Rooms & Executive Lounges */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Waiting Rooms & Executive Lounges</span>
              </h3>

              <div className="space-y-2.5">
                {stationData.waiting_rooms?.map((wr, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-200">{wr.type}</h4>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60">
                        {wr.rate}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">📍 Location: {wr.location}</p>
                    <p className="text-[11px] text-slate-400">✨ Amenities: {wr.amenities}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Cloak Rooms & Baggage Storage */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Luggage className="w-4 h-4 text-amber-400" />
                <span>24x7 Cloak Room & Luggage Locker</span>
              </h3>

              {stationData.cloak_rooms && (
                <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-2.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-semibold text-slate-200">{stationData.cloak_rooms.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Operating Hours:</span>
                    <span className="font-bold text-emerald-400">{stationData.cloak_rooms.operating_hours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Government Tariff:</span>
                    <span className="font-bold text-amber-400">{stationData.cloak_rooms.charges}</span>
                  </div>

                  <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/40 p-2.5 rounded-xl">
                    ⚠️ Mandatory Rule: Bags must be properly locked with padlock. Valid confirmed/RAC/Waiting railway ticket required for deposit.
                  </div>
                </div>
              )}
            </div>

            {/* 3. Accessibility & Differently-Abled Support */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Accessibility & Senior Citizen Facilities</span>
              </h3>

              {stationData.accessibility && (
                <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-2 text-xs text-slate-300">
                  <p>• <strong>Wheelchairs:</strong> {stationData.accessibility.wheelchairs}</p>
                  <p>• <strong>Battery Buggies:</strong> {stationData.accessibility.battery_operated_cars}</p>
                  <p>• <strong>Braille & Ramps:</strong> {stationData.accessibility.braille_signage}</p>
                </div>
              )}
            </div>

            {/* 4. Food Plaza & Metro Connectivity */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span>Metro Transfer & Station Food Plaza</span>
              </h3>

              <div className="space-y-3">
                {/* Metro */}
                {stationData.metro_connectivity && (
                  <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl space-y-1 text-xs">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Metro / City Transit</span>
                    <h4 className="font-bold text-slate-200">{stationData.metro_connectivity.station}</h4>
                    <p className="text-[11px] text-slate-400">{stationData.metro_connectivity.lines}</p>
                    <p className="text-[11px] text-emerald-400 font-semibold">Walk Time: {stationData.metro_connectivity.walk_time}</p>
                  </div>
                )}

                {/* Food Plaza */}
                <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl space-y-1 text-xs">
                  <span className="text-[10px] font-mono text-orange-400 font-bold uppercase">Popular Station Eateries</span>
                  <div className="space-y-1 pt-1">
                    {stationData.food_plaza?.map((fp, i) => (
                      <div key={i} className="flex justify-between text-[11px] text-slate-300 border-b border-slate-800/40 pb-1">
                        <span className="font-bold text-slate-200">{fp.brand}</span>
                        <span className="text-slate-400">{fp.platform} ({fp.type})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : null}

    </div>
  )
}
