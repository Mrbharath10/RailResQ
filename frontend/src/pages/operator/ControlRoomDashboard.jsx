import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ShieldAlert, 
  AlertTriangle, 
  Users, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  Compass, 
  Send, 
  X,
  Sparkles,
  PhoneCall,
  Flame,
  Activity,
  Layers,
  Train
} from 'lucide-react'
import api from '../../services/api'

export default function ControlRoomDashboard() {
  const [kpis, setKpis] = useState(null)
  const [incidents, setIncidents] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterPriority, setFilterPriority] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Selected Incident for Detail Modal
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Dispatch state
  const [selectedResourceId, setSelectedResourceId] = useState('')
  const [dispatchDeadline, setDispatchDeadline] = useState(5)
  const [dispatching, setDispatching] = useState(false)

  // Action status message
  const [actionNotice, setActionNotice] = useState(null)

  const fetchData = async () => {
    try {
      const [kpiRes, incRes, resRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get(`/incidents?priority=${filterPriority}&category=${filterCategory}&status=${filterStatus}&search=${searchQuery}&limit=50`),
        api.get('/resources?availability=AVAILABLE')
      ])
      setKpis(kpiRes.data)
      setIncidents(incRes.data.items)
      setResources(resRes.data)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      fetchData()
      // Also automatically trigger background acknowledgement deadline monitor
      api.post('/assignments/check-deadlines').catch(() => {})
    }, 8000)
    return () => clearInterval(interval)
  }, [filterPriority, filterCategory, filterStatus, searchQuery])

  const openIncidentModal = async (inc) => {
    setSelectedIncident(inc)
    setLoadingDetail(true)
    try {
      const res = await api.get(`/incidents/${inc.id}`)
      setSelectedIncidentDetail(res.data)
      if (resources.length > 0) {
        setSelectedResourceId(resources[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleUpdatePriority = async (newPriority) => {
    if (!selectedIncident) return
    try {
      await api.patch(`/incidents/${selectedIncident.id}`, {
        approved_priority: newPriority,
        explanation: 'Operator manual priority override'
      })
      setActionNotice(`Priority updated to ${newPriority}`)
      openIncidentModal(selectedIncident)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleApproveHandover = async (recommendationId, action) => {
    try {
      await api.patch(`/handover/${recommendationId}/approve`, {
        action,
        notes: `Operator ${action.toLowerCase()}ed station handover recommendation`
      })
      setActionNotice(`Station handover plan ${action.toUpperCase()}D successfully`)
      openIncidentModal(selectedIncident)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDispatchResource = async (e) => {
    e.preventDefault()
    if (!selectedResourceId || !selectedIncident) return
    setDispatching(true)
    try {
      await api.post('/assignments', {
        incident_id: selectedIncident.id,
        resource_id: parseInt(selectedResourceId),
        deadline_minutes: parseInt(dispatchDeadline),
        notes: 'Dispatched from Control-Room Command Dashboard'
      })
      setActionNotice('Emergency response team dispatched. Acknowledgement timer started.')
      openIncidentModal(selectedIncident)
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setDispatching(false)
    }
  }

  const handleAcknowledge = async (assignmentId) => {
    try {
      await api.patch(`/assignments/${assignmentId}/acknowledge`)
      setActionNotice('Resource acknowledgement recorded.')
      openIncidentModal(selectedIncident)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleCompleteAssignment = async (assignmentId) => {
    try {
      await api.patch(`/assignments/${assignmentId}/status?status_val=COMPLETED`)
      setActionNotice('Incident marked RESOLVED & Resource freed.')
      openIncidentModal(selectedIncident)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2.5">
            <LayoutDashboard className="w-7 h-7 text-blue-500" />
            <span>Control-Room Command Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time emergency coordination &bull; AI Agent triage &bull; Intelligent station handover
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/train-tracking"
            className="flex items-center space-x-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-600/20"
          >
            <Train className="w-3.5 h-3.5" />
            <span>Track All Trains Live</span>
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
          </Link>
          <button
            onClick={() => {
              setLoading(true)
              fetchData()
            }}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Live Sync</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs rounded-xl flex items-center justify-between shadow-lg">
          <span className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionNotice}</span>
          </span>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Incidents
          </span>
          <span className="text-2xl font-black text-white">{kpis?.summary?.total_incidents ?? 0}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block mb-1">
            Active Triage
          </span>
          <span className="text-2xl font-black text-blue-400">{kpis?.summary?.active_incidents ?? 0}</span>
        </div>

        <div className="bg-slate-900 border border-rose-900/60 rounded-xl p-4 shadow bg-rose-950/20">
          <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block mb-1">
            Critical Alerts
          </span>
          <span className="text-2xl font-black text-rose-500">{kpis?.priority_distribution?.CRITICAL ?? 0}</span>
        </div>

        <div className="bg-slate-900 border border-amber-900/60 rounded-xl p-4 shadow bg-amber-950/20">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block mb-1">
            Overdue Deadlines
          </span>
          <span className="text-2xl font-black text-amber-400">{kpis?.summary?.overdue_alerts ?? 0}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
            Available Squads
          </span>
          <span className="text-2xl font-black text-emerald-400">{kpis?.summary?.available_resources ?? 0}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search train number, coach, description..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
          />
        </div>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
        >
          <option value="">All Categories</option>
          <option value="Medical emergency">Medical emergency</option>
          <option value="Fire or smoke">Fire or smoke</option>
          <option value="Security threat">Security threat</option>
          <option value="Passenger safety issue">Passenger safety issue</option>
          <option value="Equipment failure">Equipment failure</option>
          <option value="Unattended suspicious object">Unattended suspicious object</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
        >
          <option value="">All Statuses</option>
          <option value="REPORTED">REPORTED</option>
          <option value="TRIAGED">TRIAGED</option>
          <option value="ASSIGNED">ASSIGNED</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>
      </div>

      {/* Incidents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-bold">Priority</th>
                <th className="py-3 px-4 font-bold">Incident / Train</th>
                <th className="py-3 px-4 font-bold">Category</th>
                <th className="py-3 px-4 font-bold">AI Summary</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No emergency incidents match current filters.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                          inc.approved_priority === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : inc.approved_priority === 'HIGH'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}
                      >
                        {inc.approved_priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-white">#{inc.id} &bull; Train {inc.train_number}</div>
                      <div className="text-[11px] text-slate-400">Coach {inc.coach_number} {inc.seat_number ? `(Seat ${inc.seat_number})` : ''}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-300">
                      {inc.category}
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-300 truncate font-mono text-[11px]">
                      {inc.ai_summary || inc.description}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-mono bg-slate-800 px-2.5 py-0.5 rounded text-emerald-400 border border-slate-700">
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => openIncidentModal(inc)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition"
                      >
                        Manage & Triage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deep Incident Management Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <span className="text-xl font-bold text-white">Incident #{selectedIncident.id}</span>
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                      selectedIncident.approved_priority === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : selectedIncident.approved_priority === 'HIGH'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-blue-950 text-blue-400 border border-blue-800'
                    }`}
                  >
                    {selectedIncident.approved_priority}
                  </span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                    {selectedIncident.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Train {selectedIncident.train_number} ({selectedIncident.train_name}) &bull; Coach {selectedIncident.coach_number} &bull; Passenger: {selectedIncident.passenger_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading incident intelligence...</div>
            ) : selectedIncidentDetail ? (
              <div className="space-y-6">
                {/* AI Extraction & Summary Card */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Incident Extraction & Multilingual Summary</span>
                  </div>
                  <p className="text-xs text-slate-200 font-mono bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed">
                    {selectedIncidentDetail.ai_summary}
                  </p>
                  <div className="text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">Original Description: </span>
                    <span>"{selectedIncidentDetail.description}"</span>
                  </div>
                  {selectedIncidentDetail.priority_rules_triggered?.length > 0 && (
                    <div className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Deterministic Safety Rules Triggered: </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedIncidentDetail.priority_rules_triggered.map((rule, idx) => (
                          <span key={idx} className="bg-rose-950/80 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded text-[10px] font-mono">
                            {rule}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Operator Priority Override Buttons */}
                <div className="flex flex-wrap items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 gap-3">
                  <span className="text-xs font-semibold text-slate-300">Operator Priority Override:</span>
                  <div className="flex space-x-2">
                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                      <button
                        key={p}
                        onClick={() => handleUpdatePriority(p)}
                        className={`px-3 py-1 rounded text-xs font-bold transition ${
                          selectedIncidentDetail.approved_priority === p
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Station Handover Card */}
                {selectedIncidentDetail.handovers?.length > 0 && (
                  <div className="bg-emerald-950/30 border border-emerald-800/60 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                        <Compass className="w-4 h-4" />
                        <span>Intelligent Station Handover Recommendation</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        selectedIncidentDetail.handovers[0].approval_status === 'APPROVED'
                          ? 'bg-emerald-900 text-emerald-200'
                          : 'bg-amber-900 text-amber-200'
                      }`}>
                        Status: {selectedIncidentDetail.handovers[0].approval_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400">Target Station:</span>
                        <p className="font-bold text-white mt-0.5 text-sm">
                          {selectedIncidentDetail.handovers[0].station_name} ({selectedIncidentDetail.handovers[0].station_code})
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Estimated Arrival (ETA):</span>
                        <p className="font-bold text-emerald-300 mt-0.5 text-sm">
                          ~{selectedIncidentDetail.handovers[0].eta_minutes} minutes
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400">Recommendation Rationale:</span>
                        <p className="text-slate-300 text-xs mt-0.5 bg-slate-900/60 p-2.5 rounded border border-emerald-900/40">
                          {selectedIncidentDetail.handovers[0].reason}
                        </p>
                      </div>
                    </div>

                    {selectedIncidentDetail.handovers[0].approval_status === 'PENDING' && (
                      <div className="flex space-x-3 pt-2">
                        <button
                          onClick={() => handleApproveHandover(selectedIncidentDetail.handovers[0].id, 'APPROVE')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition"
                        >
                          Approve Station Handover
                        </button>
                        <button
                          onClick={() => handleApproveHandover(selectedIncidentDetail.handovers[0].id, 'REJECT')}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Dispatched Teams & Acknowledgement Tracking */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>Response Squad Dispatch & Acknowledgement Monitoring</span>
                    </span>
                  </div>

                  {selectedIncidentDetail.assignments?.length === 0 ? (
                    <p className="text-xs text-slate-500">No emergency response unit assigned yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedIncidentDetail.assignments.map((a) => (
                        <div key={a.id} className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-wrap justify-between items-center gap-2 text-xs">
                          <div>
                            <span className="font-bold text-white block">{a.resource_name}</span>
                            <span className="text-slate-400 text-[11px]">{a.resource_type} &bull; Deadline: {new Date(a.deadline_at).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                              a.assignment_status === 'OVERDUE'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                                : a.assignment_status === 'ACKNOWLEDGED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}>
                              {a.assignment_status}
                            </span>

                            {a.assignment_status === 'ASSIGNED' && (
                              <button
                                onClick={() => handleAcknowledge(a.id)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold"
                              >
                                Record Ack
                              </button>
                            )}

                            {a.assignment_status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleCompleteAssignment(a.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                              >
                                Mark Completed
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dispatch New Resource Form */}
                  <form onSubmit={handleDispatchResource} className="pt-3 border-t border-slate-800 flex flex-wrap gap-2 items-center">
                    <select
                      value={selectedResourceId}
                      onChange={(e) => setSelectedResourceId(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      {resources.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.resource_name} ({r.resource_type} @ {r.station_code})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={dispatchDeadline}
                      onChange={(e) => setDispatchDeadline(e.target.value)}
                      className="w-20 px-2 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white text-center"
                      title="Acknowledgement Deadline in Minutes"
                    />
                    <span className="text-slate-400 text-xs">mins deadline</span>

                    <button
                      type="submit"
                      disabled={dispatching || resources.length === 0}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition disabled:opacity-50"
                    >
                      {dispatching ? 'Dispatching...' : 'Dispatch Squad'}
                    </button>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
