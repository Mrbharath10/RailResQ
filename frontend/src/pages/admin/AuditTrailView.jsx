import React, { useState, useEffect } from 'react'
import { FileText, Shield, Clock, RefreshCw } from 'lucide-react'
import api from '../../services/api'

export default function AuditTrailView() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/analytics/audit-logs?limit=100')
      setLogs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2.5">
            <FileText className="w-7 h-7 text-blue-400" />
            <span>Immutable System Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chronological audit log recording every human and automated agent decision.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-bold">Timestamp</th>
                <th className="py-3 px-4 font-bold">Actor</th>
                <th className="py-3 px-4 font-bold">Action</th>
                <th className="py-3 px-4 font-bold">Incident</th>
                <th className="py-3 px-4 font-bold">Explanation / Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-white block">{log.actor_name}</span>
                      <span className="text-[10px] uppercase font-bold text-blue-400">{log.actor_role}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="bg-slate-800 border border-slate-700 text-emerald-400 font-mono px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-mono">
                      {log.incident_id ? `#${log.incident_id}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-sm">
                      {log.explanation}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
