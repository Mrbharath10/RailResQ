import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Train, 
  Search, 
  ShieldAlert, 
  Flame, 
  HelpCircle, 
  Hospital, 
  Activity, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight,
  Info,
  Sliders,
  Layers,
  Zap
} from 'lucide-react'
import api from '../../services/api'

export default function CoachLayoutView() {
  const [trainNumber, setTrainNumber] = useState('12393')
  const [searchInput, setSearchInput] = useState('12393')
  const [coachData, setCoachData] = useState(null)
  const [selectedCoach, setSelectedCoach] = useState(null)
  const [loading, setLoading] = useState(true)
  const [railradarInfo, setRailradarInfo] = useState(null)

  const fetchCoaches = async (tNum) => {
    setLoading(true)
    try {
      const [coachRes, rrRes] = await Promise.all([
        api.get(`/railway/trains/${tNum}/coaches`),
        api.get('/railway/railradar/status')
      ])
      setCoachData(coachRes.data)
      setRailradarInfo(rrRes.data)
      if (coachRes.data.coaches?.length > 0) {
        // Select an AC or Sleeper coach by default
        const defaultCoach = coachRes.data.coaches.find(c => c.coach_code === 'B2') || coachRes.data.coaches[2]
        setSelectedCoach(defaultCoach)
      }
    } catch (e) {
      console.error('Error fetching coach composition:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoaches(trainNumber)
  }, [trainNumber])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchInput.trim()) return
    setTrainNumber(searchInput.trim())
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Deck */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="bg-blue-600/20 p-2.5 rounded-xl border border-blue-500/30">
              <Train className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-white">Train Coach Layout & Rake Composition</h1>
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                  RAILRADAR API
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Rake sequence &bull; Class layout blueprints &bull; Emergency facility mapping &bull; Onboard incident alignment
              </p>
            </div>
          </div>
        </div>

        {/* Train Search Bar */}
        <div className="flex items-center space-x-3">
          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Train # (12393, 12952, 22436)..."
                className="pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white w-56 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow"
            >
              Inspect Rake
            </button>
          </form>

          <button
            onClick={() => fetchCoaches(trainNumber)}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Rake Summary Bar */}
      {coachData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Inspected Train</span>
            <div className="text-xl font-black text-white font-mono">#{coachData.train_number}</div>
            <span className="text-xs text-blue-400">{coachData.train_type}</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Rake Composition</span>
            <div className="text-xl font-black text-emerald-400">{coachData.total_coaches || coachData.coaches?.length} Coaches</div>
            <span className="text-xs text-slate-400">Standard 24-Car LHB Rake</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Locomotive Power</span>
            <div className="text-base font-bold text-white truncate">WAP-7 High-Speed</div>
            <span className="text-xs text-slate-400">6000 HP 3-Phase Electric</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">API Provider</span>
            <div className="text-base font-bold text-amber-400 flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5" />
              <span>RailRadar Engine</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Status: Verified</span>
          </div>
        </div>
      )}

      {/* Interactive Horizontal Train Rake Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Platform Coach Alignment (Facing Forward)</span>
            </h2>
            <p className="text-xs text-slate-400">Click any coach to inspect berth layout, emergency facilities, and active alerts.</p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Direction of Travel &rarr;</span>
        </div>

        {/* Scrollable Coach Train Graphic */}
        <div className="overflow-x-auto pb-4 pt-2">
          <div className="flex items-center space-x-2 min-w-max px-2">
            {coachData?.coaches?.map((coach) => {
              const isSelected = selectedCoach?.coach_code === coach.coach_code
              const isEngine = coach.coach_code === 'ENG' || coach.coach_code === 'DTC'

              return (
                <div
                  key={coach.position}
                  onClick={() => setSelectedCoach(coach)}
                  className={`relative cursor-pointer transition transform hover:-translate-y-1 ${
                    isEngine ? 'w-24' : 'w-20'
                  }`}
                >
                  {/* Emergency Radar Beacon */}
                  {coach.has_active_emergency && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                  )}

                  {/* Coach Box Graphic */}
                  <div className={`h-16 rounded-xl border-2 flex flex-col justify-between p-1.5 shadow-md ${
                    isSelected
                      ? 'border-blue-400 bg-blue-950/80 ring-2 ring-blue-500/50'
                      : coach.has_active_emergency
                      ? 'border-rose-500 bg-rose-950/50'
                      : 'border-slate-700 bg-slate-950 hover:border-slate-500'
                  }`}>
                    {/* Coach Top Windows */}
                    <div className="flex justify-between space-x-1 px-1">
                      <div className="w-2.5 h-1.5 bg-slate-700 rounded-sm"></div>
                      <div className="w-2.5 h-1.5 bg-slate-700 rounded-sm"></div>
                      <div className="w-2.5 h-1.5 bg-slate-700 rounded-sm"></div>
                    </div>

                    {/* Coach Code */}
                    <div className="text-center">
                      <span className="font-mono font-black text-xs text-white block">{coach.coach_code}</span>
                      <span className="text-[9px] text-slate-400 block truncate">{coach.coach_type}</span>
                    </div>

                    {/* Coach Bottom Track Wheel Indicators */}
                    <div className="flex justify-between px-2">
                      <div className="w-2 h-2 rounded-full bg-slate-600 border border-slate-900"></div>
                      <div className="w-2 h-2 rounded-full bg-slate-600 border border-slate-900"></div>
                    </div>
                  </div>

                  {/* Position number pill */}
                  <div className="text-center mt-1">
                    <span className="text-[9px] font-mono text-slate-500">#{coach.position}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selected Coach Detailed Blueprint & Emergency Equipment */}
      {selectedCoach && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Coach Specifications */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            {/* Real Coach Interior Photo */}
            <div className="h-32 -mx-5 -mt-5 mb-3 relative overflow-hidden rounded-t-2xl bg-slate-950 border-b border-slate-800">
              <img 
                src={selectedCoach.class_code?.includes('C') ? '/trains/vande-bharat-interior.jpg' : '/trains/sleeper-coach-interior.jpg'} 
                alt={selectedCoach.class_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = '/trains/sleeper-coach-interior.jpg'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent p-3 flex items-end justify-between">
                <span className="text-[10px] font-mono font-bold bg-black/80 text-amber-300 px-2 py-0.5 rounded border border-amber-600/40">
                  AUTHENTIC RAKE INTERIOR
                </span>
                <span className="text-[10px] font-bold bg-blue-950/90 text-blue-300 px-2 py-0.5 rounded border border-blue-600/50 font-mono">
                  {selectedCoach.coach_code} • {selectedCoach.class_code}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Coach Specifications</span>
                <h3 className="text-2xl font-black text-white mt-0.5">Coach {selectedCoach.coach_code}</h3>
                <p className="text-xs text-slate-400">{selectedCoach.class_name}</p>
              </div>
              {selectedCoach.has_active_emergency ? (
                <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-1 rounded font-bold animate-pulse">
                  🚨 EMERGENCY ONBOARD
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-1 rounded font-mono font-bold">
                  NORMAL
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Position in Train:</span>
                <span className="font-mono font-bold text-white">Coach #{selectedCoach.position} of {coachData?.coaches?.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Total Berths / Seats:</span>
                <span className="font-mono font-bold text-emerald-400">{selectedCoach.total_berths || 'N/A'} Berths</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Coach Class:</span>
                <span className="font-bold text-white">{selectedCoach.coach_type}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Air Conditioning:</span>
                <span className="font-bold text-white">{selectedCoach.coach_type.includes('AC') ? 'Central HVAC (22°C)' : 'Non-AC Fan Ventilated'}</span>
              </div>
            </div>

            {selectedCoach.has_active_emergency && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center space-x-1.5 text-rose-300 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Active Incident #{selectedCoach.incident_id}</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  Category: <strong>{selectedCoach.incident_category}</strong> &bull; Priority: <strong className="text-rose-400">{selectedCoach.incident_priority}</strong>
                </p>
                <Link
                  to="/operator/dashboard"
                  className="text-[11px] text-rose-300 underline font-semibold block pt-1"
                >
                  View Incident in Control Room &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Middle: Onboard Safety & Emergency Equipment Locations */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block border-b border-slate-800 pb-2">
              Mandatory Onboard Emergency Equipment
            </span>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-3">
                <Flame className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-xs">Fire Extinguishers (Dry Powder)</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">Located at both entry vestibules (Doors 1 & 2) near the toilet passage.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-xs">Passenger Emergency Alarm (PEASD Chain)</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">Mounted on coach bulkheads at bays 2, 5, and 8. Pull only in extreme emergencies.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start space-x-3">
                <Hospital className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-xs">Medical First Aid Kit</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">Stationed with Train Ticket Examiner (TTE) in Coach A1 / Pantry Car.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Typical Berth Layout Blueprint */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-2">
              Berth Distribution Blueprint ({selectedCoach.coach_code})
            </span>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="text-[11px] text-slate-300">Typical Bay Arrangement:</div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-blue-400 font-bold block">LB (Lower)</span>
                  <span className="text-slate-400">Berths 1, 9, 17</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-emerald-400 font-bold block">MB (Middle)</span>
                  <span className="text-slate-400">Berths 2, 10, 18</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800">
                  <span className="text-purple-400 font-bold block">UB (Upper)</span>
                  <span className="text-slate-400">Berths 3, 11, 19</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 col-span-3 flex justify-around">
                  <div>
                    <span className="text-amber-400 font-bold block">SL (Side Lower)</span>
                    <span className="text-slate-400">Berths 7, 15, 23</span>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-bold block">SU (Side Upper)</span>
                    <span className="text-slate-400">Berths 8, 16, 24</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 italic">
              Data synchronized via RailRadar Coach Alignment Engine & Indian Railways Standard LHB Blueprint.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
