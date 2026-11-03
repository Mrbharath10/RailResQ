import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Clock, CheckCircle2, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react'
import api from '../../services/api'

export default function MyReportsPage() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await api.get('/incidents?limit=20')
      setIncidents(res.data.items)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Clock className="w-6 h-6 text-blue-400" />
            <span>Passenger Incident Tracking</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live status of your submitted emergency reports</p>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading incident records...</div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Incidents Reported</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            You haven't filed any emergency reports yet.
          </p>
          <Link
            to="/passenger/report"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
          >
            Report Emergency
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3"
            >
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-white">Incident #{inc.id}</span>
                    <span className="text-xs font-semibold text-slate-400">&bull; Train {inc.train_number} ({inc.coach_number})</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inc.approved_priority === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : inc.approved_priority === 'HIGH'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}
                    >
                      {inc.approved_priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{inc.category}</p>
                </div>
                <span className="text-xs font-mono bg-slate-800 text-emerald-400 px-2.5 py-1 rounded-full border border-slate-700">
                  {inc.status}
                </span>
              </div>

              <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block mb-0.5 font-semibold">AI Incident Summary:</span>
                {inc.ai_summary || inc.description}
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                <span>Reported: {new Date(inc.created_at).toLocaleString()}</span>
                <span className="text-slate-400">Location: {inc.reported_location || 'Enroute'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
