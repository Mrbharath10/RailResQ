import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Building2, 
  Search, 
  Clock, 
  Train, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight,
  Hospital,
  Flame,
  Zap,
  Filter
} from 'lucide-react'
import api from '../../services/api'

const POPULAR_STATIONS = [
  { code: 'NDLS', name: 'New Delhi' },
  { code: 'CNB', name: 'Kanpur Central' },
  { code: 'PRYJ', name: 'Prayagraj Junction' },
  { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya' },
  { code: 'HWH', name: 'Howrah Junction' },
  { code: 'BPL', name: 'Bhopal Junction' },
  { code: 'CSMT', name: 'Mumbai CSMT' },
  { code: 'SBC', name: 'KSR Bengaluru' },
  { code: 'MAS', name: 'MGR Chennai Central' }
]

export default function StationBoardView() {
  const [stationCode, setStationCode] = useState('NDLS')
  const [searchInput, setSearchInput] = useState('NDLS')
  const [boardData, setBoardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('ALL') // 'ALL', 'ARRIVALS', 'DEPARTURES', 'DELAYED'
  const [hoursAhead, setHoursAhead] = useState(4)

  const fetchBoard = async (stCode) => {
    setLoading(true)
    try {
      const res = await api.get(`/railway/stations/${stCode}/live-board?hours_ahead=${hoursAhead}`)
      setBoardData(res.data)
    } catch (e) {
      console.error('Error fetching station board:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBoard(stationCode)
  }, [stationCode, hoursAhead])

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchInput.trim()) return
    setStationCode(searchInput.trim().toUpperCase())
  }

  const filteredTrains = boardData?.trains?.filter((t) => {
    if (filterType === 'DELAYED') return t.delay_minutes > 0
    return true
  }) || []

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Deck */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="bg-emerald-600/20 p-2.5 rounded-xl border border-emerald-500/30">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-white">Station Live Arrivals & Departures Board</h1>
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono font-bold">
                  RAILRADAR API
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time NTES platform timetable &bull; Live delay tracking &bull; Emergency facility readiness
              </p>
            </div>
          </div>
        </div>

        {/* Station Search Bar */}
        <div className="flex items-center space-x-3">
          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Station Code (NDLS, CNB, HWH)..."
                className="pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white w-52 font-mono uppercase focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
            >
              Search
            </button>
          </form>

          <button
            onClick={() => fetchBoard(stationCode)}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Popular Station Quick Buttons */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 text-[11px] font-bold uppercase shrink-0">Quick Junctions:</span>
        {POPULAR_STATIONS.map((st) => (
          <button
            key={st.code}
            onClick={() => {
              setStationCode(st.code)
              setSearchInput(st.code)
            }}
            className={`px-3 py-1.5 rounded-lg font-mono font-bold transition shrink-0 ${
              stationCode === st.code
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {st.code} - {st.name}
          </button>
        ))}
      </div>

      {/* Station Information & Emergency Readiness Banner */}
      {boardData && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Active Station</span>
            <div className="text-xl font-black text-white">{boardData.station_name}</div>
            <span className="text-xs font-mono text-emerald-400 font-bold">{boardData.station_code}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Upcoming Trains</span>
            <div className="text-xl font-black text-white">{boardData.trains?.length} Trains</div>
            <span className="text-xs text-slate-400">Within next {boardData.hours_ahead} hours</span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Medical Trauma Readiness</span>
            <div className="text-sm font-bold text-emerald-400 flex items-center space-x-1.5">
              <Hospital className="w-4 h-4" />
              <span>Level-2 Emergency Hospital</span>
            </div>
            <span className="text-[10px] text-slate-400">Ambulance Ramp on Platform 1</span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Data Source</span>
            <div className="text-sm font-bold text-amber-400 flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5" />
              <span>RailRadar Official Feed</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Sync: {boardData.last_updated}</span>
          </div>
        </div>
      )}

      {/* Station Timetable Board */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Live Electronic Display Board ({boardData?.station_code})</span>
            </h2>
            <p className="text-xs text-slate-400">Scheduled arrival vs live estimated arrival with platform numbers.</p>
          </div>

          {/* Filter Pills */}
          <div className="flex space-x-2">
            {[
              { id: 'ALL', label: 'All Trains' },
              { id: 'DELAYED', label: 'Delayed Trains' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterType === f.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timetable Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Train # & Name</th>
                <th className="p-3">Route</th>
                <th className="p-3">Platform</th>
                <th className="p-3">Scheduled Arr/Dep</th>
                <th className="p-3">Expected Time</th>
                <th className="p-3">Delay</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredTrains.map((t) => {
                const isDelayed = t.delay_minutes > 0

                return (
                  <tr key={t.train_number} className="hover:bg-slate-850 transition">
                    <td className="p-3">
                      <div className="font-bold text-white text-sm">{t.train_name}</div>
                      <span className="font-mono text-xs font-bold text-blue-400">#{t.train_number}</span>
                    </td>
                    <td className="p-3 text-slate-300">
                      <span>{t.origin} &rarr; {t.destination}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 bg-slate-950 text-white font-mono font-bold text-xs rounded border border-slate-700">
                        PF {t.platform}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-300">
                      <span>{t.scheduled_arrival} / {t.scheduled_departure}</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-400">
                      <span>{t.expected_arrival}</span>
                    </td>
                    <td className="p-3">
                      {isDelayed ? (
                        <span className="text-amber-400 font-bold font-mono">+{t.delay_minutes} mins</span>
                      ) : (
                        <span className="text-emerald-400 font-bold font-mono">Right Time</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        t.status === 'AT_PLATFORM' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 animate-pulse' :
                        t.status === 'APPROACHING' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                        t.status === 'DELAYED' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to={`/train-tracking`}
                        className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center space-x-1"
                      >
                        <span>Live GPS</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
