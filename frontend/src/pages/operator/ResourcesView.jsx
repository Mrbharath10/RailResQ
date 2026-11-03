import React, { useState, useEffect } from 'react'
import { Users, Phone, MapPin, CheckCircle2, ShieldAlert, Plus, RefreshCw } from 'lucide-react'
import api from '../../services/api'

export default function ResourcesView() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchResources = async () => {
    setLoading(true)
    try {
      const res = await api.get('/resources')
      setResources(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResources()
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2.5">
            <Users className="w-7 h-7 text-purple-400" />
            <span>Emergency Response Resources Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered medical trauma units, RPF security squads, fire tenders, and station support teams.
          </p>
        </div>
        <button
          onClick={fetchResources}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {resources.map((r) => (
          <div
            key={r.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-white text-sm leading-tight">{r.resource_name}</h3>
                  <span className="text-xs font-mono text-purple-400 font-semibold">{r.resource_code}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  r.availability_status === 'AVAILABLE'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}>
                  {r.availability_status}
                </span>
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>Stationed at: <strong className="text-slate-200">{r.station_name} ({r.station_code})</strong></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{r.contact_information}</span>
                </div>
              </div>

              {/* Capabilities */}
              <div className="pt-3 border-t border-slate-800 mt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Capabilities & Equipment
                </span>
                <div className="flex flex-wrap gap-1">
                  {r.capabilities.map((cap, i) => (
                    <span key={i} className="text-[10px] bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
              <span>Type: {r.resource_type}</span>
              <span className="text-slate-400">ID #{r.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
