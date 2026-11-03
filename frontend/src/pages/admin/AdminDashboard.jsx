import React, { useState, useEffect } from 'react'
import { Sliders, Shield, MapPin, Users, CheckCircle2, RefreshCw, Plus } from 'lucide-react'
import api from '../../services/api'

export default function AdminDashboard() {
  const [stations, setStations] = useState([])
  const [resources, setResources] = useState([])
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [stRes, resRes, kpiRes] = await Promise.all([
        api.get('/railway/stations'),
        api.get('/resources'),
        api.get('/analytics/overview')
      ])
      setStations(stRes.data)
      setResources(resRes.data)
      setKpis(kpiRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2.5">
            <Sliders className="w-7 h-7 text-purple-400" />
            <span>System Administration & Config</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage priority safety rules, station emergency datasets, and registered response infrastructure.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Admin stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Registered Stations</span>
          <span className="text-2xl font-black text-white">{stations.length}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Response Squads Registered</span>
          <span className="text-2xl font-black text-purple-400">{resources.length}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-semibold block mb-1">Safety Priority Rules Active</span>
          <span className="text-2xl font-black text-emerald-400">4 Core Rules</span>
        </div>
      </div>

      {/* Configured Safety Rules Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <span>Configured Safety Priority Engine Rules</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-bold">Rule Name</th>
                <th className="py-2.5 px-4 font-bold">Category</th>
                <th className="py-2.5 px-4 font-bold">Trigger Keywords</th>
                <th className="py-2.5 px-4 font-bold">Assigned Priority</th>
                <th className="py-2.5 px-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-4 font-bold text-white">Active Fire or Smoke In Coach</td>
                <td className="py-3 px-4 text-slate-300">Fire or smoke</td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">fire, smoke, sparks, burning</td>
                <td className="py-3 px-4"><span className="bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">CRITICAL</span></td>
                <td className="py-3 px-4 text-emerald-400 font-bold text-[10px]">ACTIVE</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-4 font-bold text-white">Life Threatening Medical Distress</td>
                <td className="py-3 px-4 text-slate-300">Medical emergency</td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">unconscious, heart attack, chest pain, bleeding</td>
                <td className="py-3 px-4"><span className="bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">CRITICAL</span></td>
                <td className="py-3 px-4 text-emerald-400 font-bold text-[10px]">ACTIVE</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-4 font-bold text-white">Violent Security Threat or Weapon</td>
                <td className="py-3 px-4 text-slate-300">Security threat</td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">gun, knife, assault, robbery</td>
                <td className="py-3 px-4"><span className="bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">CRITICAL</span></td>
                <td className="py-3 px-4 text-emerald-400 font-bold text-[10px]">ACTIVE</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-3 px-4 font-bold text-white">Unattended Suspicious Baggage</td>
                <td className="py-3 px-4 text-slate-300">Unattended suspicious object</td>
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400">bomb, suspicious box, explosive</td>
                <td className="py-3 px-4"><span className="bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">HIGH</span></td>
                <td className="py-3 px-4 text-emerald-400 font-bold text-[10px]">ACTIVE</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
