import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  LogIn, 
  AlertCircle, 
  ShieldCheck, 
  KeyRound, 
  User as UserIcon, 
  Radio, 
  Sliders, 
  Lock, 
  Mail, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Train
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login, register, loginAsDemo } = useAuth()
  const navigate = useNavigate()

  // Active persona tab: 'passenger' | 'operator' | 'admin'
  const [activeRole, setActiveRole] = useState('passenger')
  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState('login')

  // Login form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [division, setDivision] = useState('Chennai Division (MAS)')
  const [badgeId, setBadgeId] = useState('CR-OPS-8842')

  // Register form states (for passenger)
  const [regFullName, setRegFullName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPhone, setRegPhone] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Quick switch role tab
  const handleSelectRole = (role) => {
    setActiveRole(role)
    setError(null)
    if (role === 'passenger') {
      setEmail('passenger@railresq.gov.in')
      setPassword('passenger123')
    } else if (role === 'operator') {
      setEmail('operator@railresq.gov.in')
      setPassword('operator123')
    } else {
      setEmail('admin@railresq.gov.in')
      setPassword('admin123')
    }
  }

  // Handle Login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const loggedUser = await login(email, password)
      if (loggedUser.role === 'operator') {
        navigate('/operator/dashboard')
      } else if (loggedUser.role === 'passenger') {
        navigate('/passenger/dashboard')
      } else {
        navigate('/admin')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Registration submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const newUser = await register({
        full_name: regFullName,
        email: regEmail,
        password: regPassword,
        role: 'passenger'
      })
      navigate('/passenger/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle 1-Click Demo Login
  const handleDemoLogin = async (role) => {
    setError(null)
    setLoading(true)
    try {
      const loggedUser = await loginAsDemo(role)
      if (loggedUser.role === 'operator') {
        navigate('/operator/dashboard')
      } else if (loggedUser.role === 'passenger') {
        navigate('/passenger/dashboard')
      } else {
        navigate('/admin')
      }
    } catch (err) {
      setError('Could not complete demo login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      
      {/* Main Authentication Container */}
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-scale-in">
        
        {/* Top Official Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-block p-1 bg-white rounded-2xl shadow-lg shadow-blue-950/40 mb-2">
            <img 
              src="/railresq-logo.png" 
              alt="RailResQ Logo" 
              className="h-14 sm:h-16 w-auto object-contain rounded-xl"
            />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            RailResQ Authentication Portal
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Secure Role-Based Access for Passengers, Control Room Operators, and System Administrators.
          </p>
        </div>

        {/* 3-Persona Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleSelectRole('passenger')}
            className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              activeRole === 'passenger'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Passenger</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRole('operator')}
            className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              activeRole === 'operator'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Control Room</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRole('admin')}
            className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              activeRole === 'admin'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Persona Banner Info Box */}
        <div className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
          activeRole === 'passenger' 
            ? 'bg-blue-950/60 border-blue-800/80 text-blue-200' :
          activeRole === 'operator' 
            ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200' :
            'bg-purple-950/60 border-purple-800/80 text-purple-200'
        }`}>
          <div className="flex items-center justify-between font-bold">
            <span className="uppercase tracking-wider text-[11px]">
              {activeRole === 'passenger' ? '👤 Passenger Super App Portal' :
               activeRole === 'operator' ? '🚨 Railway Control Room Operations Desk' :
               '⚙️ Central System Administration & Root Engine'}
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/40">
              {activeRole === 'passenger' ? 'CITIZEN' : activeRole === 'operator' ? 'STAFF' : 'ROOT'}
            </span>
          </div>
          <p className="text-[11px] opacity-90 leading-relaxed">
            {activeRole === 'passenger' && 'Book train tickets, order hot food to your berth, 15-min station groceries, local Rapido transit, and emergency SOS.'}
            {activeRole === 'operator' && 'Real-time multi-agent emergency incident triage, duplicate report detection, and automated station handover dispatch.'}
            {activeRole === 'admin' && 'Manage safety priority rule weights, railway station directories, mock booking fleet, and external API adapters.'}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-700 rounded-xl text-xs text-rose-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Passenger Login / Register Toggle */}
        {activeRole === 'passenger' && (
          <div className="flex border-b border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`pb-2 px-4 transition border-b-2 ${
                authMode === 'login' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`pb-2 px-4 transition border-b-2 ${
                authMode === 'register' ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Create New Passenger Account
            </button>
          </div>
        )}

        {/* Authentication Forms */}
        {authMode === 'login' || activeRole !== 'passenger' ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {activeRole === 'operator' ? 'Railway Staff Email / Username' :
                 activeRole === 'admin' ? 'System Administrator Email' :
                 'Passenger Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    activeRole === 'operator' ? 'operator@railresq.gov.in' :
                    activeRole === 'admin' ? 'admin@railresq.gov.in' :
                    'passenger@railresq.gov.in'
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Operator Division & Badge ID (Shown for Control Room role) */}
            {activeRole === 'operator' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Division Desk</label>
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Chennai Division (MAS)">Chennai Division (MAS)</option>
                    <option value="Madurai Division (MDU)">Madurai Division (MDU)</option>
                    <option value="Salem Division (SA)">Salem Division (SA)</option>
                    <option value="Southern Railway HQ">Southern Railway HQ</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Operator Badge ID</label>
                  <input
                    type="text"
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {activeRole === 'admin' ? 'Root Clearance Password' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-xl text-xs font-black shadow-lg transition flex items-center justify-center space-x-2 ${
                activeRole === 'passenger'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30' :
                activeRole === 'operator'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30' :
                  'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
              }`}
            >
              {loading ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>
                    Sign In as {activeRole === 'passenger' ? 'Passenger' : activeRole === 'operator' ? 'Operator' : 'Administrator'}
                  </span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* PASSENGER REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="e.g. Ramesh Kannan"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. ramesh@example.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Mobile Number (For WhatsApp / SMS Ticket)</label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="+91 94440 12345"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Choose a strong password"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-lg transition flex items-center justify-center space-x-2 mt-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Create Passenger Account & Enter</span>
            </button>
          </form>
        )}

        {/* 1-Click Fast Evaluator Sign-In Bar (For Defense / Presentation) */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold uppercase tracking-wider flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Project Evaluator Demo Sign-In:</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">PRE-SEEDED</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('passenger')}
              className="px-2 py-1.5 bg-blue-950/70 hover:bg-blue-900 border border-blue-700/60 rounded-xl text-blue-200 font-bold text-[11px] transition text-center shadow-sm"
            >
              👤 Passenger
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('operator')}
              className="px-2 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 rounded-xl text-emerald-200 font-bold text-[11px] transition text-center shadow-sm"
            >
              🚨 Operator
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="px-2 py-1.5 bg-purple-950/70 hover:bg-purple-900 border border-purple-700/60 rounded-xl text-purple-200 font-bold text-[11px] transition text-center shadow-sm"
            >
              ⚙️ Administrator
            </button>
          </div>
        </div>

      </div>

      {/* Discrete Academic Disclaimer */}
      <div className="mt-4 text-center text-[11px] text-slate-500 font-mono">
        RailResQ Academic Decision Support System &bull; Multi-Role Access Control
      </div>

    </div>
  )
}
