import React, { useState, useEffect } from 'react'
import { 
  Cpu, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  ShieldAlert, 
  Compass, 
  Users, 
  Clock, 
  Layers,
  FileCheck
} from 'lucide-react'
import api from '../../services/api'

export default function SimulatorView() {
  const [scenarios, setScenarios] = useState([])
  const [selectedScenario, setSelectedScenario] = useState('medical_emergency')
  const [running, setRunning] = useState(false)
  const [simulationResult, setSimulationResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const res = await api.get('/simulator/scenarios')
        setScenarios(res.data)
      } catch (e) {
        console.error(e)
      }
    }
    fetchScenarios()
  }, [])

  const handleRun = async () => {
    setRunning(true)
    setError(null)
    setSimulationResult(null)
    try {
      const res = await api.post('/simulator/run', { scenario_id: selectedScenario })
      setSimulationResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Simulation failed.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-amber-950/80 border border-amber-800/80 text-[11px] text-amber-300 font-bold mb-2">
            <span>Final-Year B.Tech CSE Evaluation Testbed</span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2.5">
            <Cpu className="w-7 h-7 text-amber-400" />
            <span>Emergency Scenario Simulator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate end-to-end multi-agent emergency coordination workflows across 9 evaluation scenarios.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center space-x-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition shadow-xl shadow-amber-500/20 disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{running ? 'Executing Multi-Agent Workflow...' : 'Execute Scenario Simulation'}</span>
        </button>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow">
        <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
          Select Evaluation Scenario:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => {
                setSelectedScenario(sc.id)
                setSimulationResult(null)
              }}
              className={`p-3 rounded-xl text-left border text-xs transition ${
                selectedScenario === sc.id
                  ? 'bg-blue-600/20 border-blue-500 text-white shadow'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <span className="font-bold block text-white line-clamp-1">{sc.title}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Train {sc.train} &bull; {sc.category}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Live Stage-by-Stage Visual Pipeline Execution */}
      {simulationResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
                Simulation Pipeline Completed
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">{simulationResult.title}</h2>
            </div>
            <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full font-bold">
              Incident #{simulationResult.incident_id}
            </span>
          </div>

          {/* Sequential Stages Stepper */}
          <div className="space-y-4">
            {simulationResult.stages.map((stage) => (
              <div
                key={stage.stage_number}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                      {stage.stage_number}
                    </div>
                    <span className="font-bold text-xs text-white">{stage.stage_name}</span>
                  </div>
                  <span className="text-[10px] bg-slate-900 text-emerald-400 px-2 py-0.5 rounded font-mono border border-slate-800">
                    {stage.status}
                  </span>
                </div>

                <div className="text-xs text-slate-300 font-mono bg-slate-900/80 p-3 rounded-lg border border-slate-850 overflow-x-auto">
                  <pre className="text-[11px] text-slate-300">
                    {JSON.stringify(stage.details, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>

          {/* Final Evaluator Summary Box */}
          <div className="bg-blue-950/30 border border-blue-800/60 p-5 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-blue-300 text-sm flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-blue-400" />
              <span>Final Demonstration Evaluation Outcome</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 pt-2">
              <div>&bull; Handover Station: <strong className="text-white">{simulationResult.final_outcome.handover_station}</strong></div>
              <div>&bull; Recommended Team: <strong className="text-white">{simulationResult.final_outcome.recommended_resource}</strong></div>
              <div>&bull; Evaluated Priority: <strong className="text-rose-400">{simulationResult.final_outcome.approved_priority}</strong></div>
              <div>&bull; Human Review Gate: <strong className="text-amber-400">Enforced (Human Operator Approval Required)</strong></div>
            </div>
            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 italic">
              {simulationResult.final_outcome.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
