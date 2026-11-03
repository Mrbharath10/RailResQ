import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Train, 
  ShieldAlert, 
  Cpu, 
  Layers, 
  Compass, 
  Users, 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  User,
  Sliders
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function LandingPage() {
  const { loginAsDemo } = useAuth()
  const navigate = useNavigate()

  const handleQuickDemo = async (role) => {
    await loginAsDemo(role)
    if (role === 'operator') {
      navigate('/operator/dashboard')
    } else if (role === 'passenger') {
      navigate('/train-search')
    } else {
      navigate('/admin')
    }
  }

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Top Banner Notice */}
      <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 flex items-start space-x-3 text-amber-300 text-xs sm:text-sm">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Academic Decision-Support Prototype:</span> RailResQ is developed as a final-year B.Tech CSE (Data Science & AI) project. It provides AI-assisted incident understanding, triage, and handover recommendations. It is strictly not connected to official live dispatch. Human railway operators must approve all consequential actions.
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-6 pt-4 pb-2">
        <div className="inline-block p-1.5 bg-white rounded-2xl shadow-xl shadow-blue-950/40 mb-2">
          <img 
            src="/railresq-logo.png" 
            alt="RailResQ Logo" 
            className="h-16 sm:h-20 w-auto object-contain rounded-xl"
          />
        </div>

        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-800 text-xs text-blue-300 font-medium">
          <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>Agentic AI-Powered Railway Emergency Coordination & Super App</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Intelligent Station Handover & Emergency Coordination
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
          RailResQ transforms passenger emergency reports into actionable, prioritized response plans. 
          Combining multilingual AI understanding, deterministic safety triage rules, duplicate incident detection, 
          and station handover recommendations for railway control rooms.
        </p>

        {/* Quick Launch Buttons for the 3 distinct roles */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => handleQuickDemo('passenger')}
            className="flex items-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-xl shadow-blue-600/30 active:scale-95"
          >
            <User className="w-4 h-4" />
            <span>Launch Passenger Portal</span>
          </button>

          <button
            onClick={() => handleQuickDemo('operator')}
            className="flex items-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-xl shadow-emerald-600/30 active:scale-95"
          >
            <Train className="w-4 h-4" />
            <span>Launch Control Room Ops</span>
          </button>

          <button
            onClick={() => handleQuickDemo('admin')}
            className="flex items-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition shadow-xl shadow-purple-600/30 active:scale-95"
          >
            <Sliders className="w-4 h-4" />
            <span>Launch Admin & Config</span>
          </button>
        </div>
      </div>

      {/* Core Workflow Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur relative overflow-hidden">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl w-fit mb-4 border border-blue-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Multilingual AI Understanding</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Accepts passenger emergency reports in Hindi, English, Tamil, Telugu, and more. 
            Extracts vital clinical symptoms, hazards, and missing info into structured JSON.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur relative overflow-hidden">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl w-fit mb-4 border border-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Deterministic Safety Rules</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Priorities (CRITICAL, HIGH, MEDIUM, LOW) are evaluated via transparent, verified safety rules — 
            never relying blindly on LLM probabilities for life-critical decisions.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur relative overflow-hidden">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-4 border border-emerald-500/20">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Intelligent Station Handover</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Calculates train ETA, evaluates platform medical & fire infrastructure at upcoming stations, 
            and alerts registered response squads for seamless passenger handover.
          </p>
        </div>
      </div>

      {/* 1-Click Role Switcher For Demo */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
          Demo Evaluator Quick-Role Switcher
        </h3>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => handleQuickDemo('operator')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold rounded-lg text-blue-300 transition"
          >
            Sign in as Control-Room Operator
          </button>
          <button
            onClick={() => handleQuickDemo('passenger')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold rounded-lg text-emerald-300 transition"
          >
            Sign in as Passenger
          </button>
          <button
            onClick={() => handleQuickDemo('admin')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold rounded-lg text-purple-300 transition"
          >
            Sign in as System Administrator
          </button>
        </div>
      </div>
    </div>
  )
}
