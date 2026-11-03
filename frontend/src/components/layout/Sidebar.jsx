import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home,
  LayoutDashboard, 
  AlertCircle, 
  Activity, 
  MapPin, 
  Users, 
  FileText, 
  Sliders, 
  Layers, 
  Compass, 
  Cpu,
  History,
  Train,
  Radio,
  Sparkles,
  Clock,
  LayoutGrid,
  Ticket,
  ShieldCheck,
  CreditCard,
  User,
  ShieldAlert,
  Search,
  Utensils,
  ShoppingBag,
  Car,
  HeartPulse,
  Building2,
  Globe,
  Bot,
  Bed
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const { user } = useAuth()
  const role = user?.role || 'passenger'

  const linkClass = ({ isActive }) =>
    `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-bold'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
    }`

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between p-3 shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="space-y-4 overflow-y-auto pr-1">
        
        {/* =========================================================================
            ROLE 1: PASSENGER PORTAL
           ========================================================================= */}
        {role === 'passenger' && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Section 1: Tickets & Travel */}
            <div className="space-y-1">
              <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase px-3 py-1">
                Tickets & Travel
              </div>
              <nav className="space-y-0.5">
                <NavLink to="/passenger/dashboard" className={linkClass}>
                  <Home className="w-4 h-4 text-blue-400" />
                  <span>Super App Home</span>
                </NavLink>
                <NavLink to="/train-search" className={linkClass}>
                  <Ticket className="w-4 h-4 text-blue-400" />
                  <span>Search & Book Trains</span>
                </NavLink>
                <NavLink to="/pnr-status" className={linkClass}>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>PNR Status & Chart</span>
                </NavLink>
                <NavLink to="/my-bookings" className={linkClass}>
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>My Bookings</span>
                </NavLink>
              </nav>
            </div>

            {/* Section 2: Smart Super App Services */}
            <div className="space-y-1">
              <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase px-3 py-1">
                Travel Services
              </div>
              <nav className="space-y-0.5">
                <NavLink to="/food" className={linkClass}>
                  <Utensils className="w-4 h-4 text-orange-400" />
                  <span>Food on Train</span>
                </NavLink>
                <NavLink to="/grocery" className={linkClass}>
                  <ShoppingBag className="w-4 h-4 text-teal-400" />
                  <span>15-Min Essentials</span>
                </NavLink>
                <NavLink to="/transport" className={linkClass}>
                  <Car className="w-4 h-4 text-yellow-400" />
                  <span>Rapido Bikes & Cabs</span>
                </NavLink>
                <NavLink to="/explore" className={linkClass}>
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Explore Destinations</span>
                </NavLink>
                <NavLink to="/hotels" className={linkClass}>
                  <Bed className="w-4 h-4 text-indigo-400" />
                  <span>Hotels & Retiring Rooms</span>
                </NavLink>
                <NavLink to="/travel-guide" className={linkClass}>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>AI Travel Guide</span>
                </NavLink>
                <NavLink to="/rail-guide" className={linkClass}>
                  <Building2 className="w-4 h-4 text-blue-300" />
                  <span>Station Rail Guide</span>
                </NavLink>
              </nav>
            </div>

            {/* Section 3: Safety & Emergency */}
            <div className="space-y-1">
              <div className="text-[10px] font-black tracking-wider text-rose-400 uppercase px-3 py-1">
                Safety & Emergency
              </div>
              <nav className="space-y-0.5">
                <NavLink to="/passenger/report" className={linkClass}>
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <div className="flex items-center justify-between flex-1">
                    <span>Report Emergency (SOS)</span>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  </div>
                </NavLink>
                <NavLink to="/police" className={linkClass}>
                  <ShieldAlert className="w-4 h-4 text-blue-400" />
                  <span>Police & Safety (112)</span>
                </NavLink>
                <NavLink to="/medical" className={linkClass}>
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  <span>Ambulance & Hospital</span>
                </NavLink>
                <NavLink to="/chatbot" className={linkClass}>
                  <Bot className="w-4 h-4 text-amber-400" />
                  <span>AI Safety Chatbot</span>
                </NavLink>
                <NavLink to="/passenger/reports" className={linkClass}>
                  <History className="w-4 h-4 text-slate-400" />
                  <span>Track My Reports</span>
                </NavLink>
              </nav>
            </div>

            {/* Section 4: Live Travel Tools */}
            <div className="space-y-1">
              <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase px-3 py-1">
                Live Tools
              </div>
              <nav className="space-y-0.5">
                <NavLink to="/passenger/train-tracking" className={linkClass}>
                  <Train className="w-4 h-4 text-emerald-400" />
                  <span>Live Train Running Status</span>
                </NavLink>
                <NavLink to="/station-board" className={linkClass}>
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Station Live Board</span>
                </NavLink>
                <NavLink to="/coaches" className={linkClass}>
                  <LayoutGrid className="w-4 h-4 text-cyan-400" />
                  <span>Coach Layout & Berths</span>
                </NavLink>
              </nav>
            </div>

          </div>
        )}

        {/* =========================================================================
            ROLE 2: CONTROL ROOM OPERATOR
           ========================================================================= */}
        {role === 'operator' && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1">
              <div className="text-[10px] font-black tracking-wider text-emerald-400 uppercase px-3 py-1">
                Command Operations
              </div>
              <nav className="space-y-0.5">
                <NavLink to="/operator/dashboard" className={linkClass}>
                  <LayoutDashboard className="w-4 h-4 text-blue-400" />
                  <span>Command Dashboard</span>
                </NavLink>
                <NavLink to="/train-tracking" className={linkClass}>
                  <Train className="w-4 h-4 text-emerald-400" />
                  <span>Fleet Live Telemetry</span>
                </NavLink>
                <NavLink to="/station-board" className={linkClass}>
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Station Live Board</span>
                </NavLink>
                <NavLink to="/coaches" className={linkClass}>
                  <LayoutGrid className="w-4 h-4 text-cyan-400" />
                  <span>24-Coach Layout Inspector</span>
                </NavLink>
              </nav>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-black tracking-wider text-purple-400 uppercase px-3 py-1">
                Incident Triage
              </div>
              <nav className="space-y-0.5">
                <NavLink to="/operator/handover" className={linkClass}>
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Station Handover</span>
                </NavLink>
                <NavLink to="/operator/duplicates" className={linkClass}>
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>AI Duplicate Triage</span>
                </NavLink>
                <NavLink to="/operator/resources" className={linkClass}>
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Response Squads</span>
                </NavLink>
              </nav>
            </div>
          </div>
        )}

        {/* =========================================================================
            ROLE 3: SYSTEM ADMINISTRATOR
           ========================================================================= */}
        {role === 'admin' && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1">
              <div className="text-[10px] font-black tracking-wider text-purple-400 uppercase px-3 py-1">
                Administration
              </div>
              <nav className="space-y-0.5">
                <NavLink to="/admin" className={linkClass}>
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Rules & Stations Config</span>
                </NavLink>
                <NavLink to="/admin/super-app" className={linkClass}>
                  <Globe className="w-4 h-4 text-purple-400" />
                  <span>Super App & API Registry</span>
                </NavLink>
                <NavLink to="/admin/bookings" className={linkClass}>
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>Booking & Fleet Console</span>
                </NavLink>
                <NavLink to="/operator/resources" className={linkClass}>
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Squad Readiness</span>
                </NavLink>
              </nav>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-black tracking-wider text-amber-400 uppercase px-3 py-1">
                Compliance & Testing
              </div>
              <nav className="space-y-0.5">
                <NavLink to="/audit-trail" className={linkClass}>
                  <FileText className="w-4 h-4 text-slate-300" />
                  <span>Audit Trail & Security</span>
                </NavLink>
                <NavLink to="/simulator" className={linkClass}>
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <span>Scenario Simulation</span>
                </NavLink>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Discrete Role Scope Footer */}
      <div className="border-t border-slate-800/80 pt-2 text-[11px] text-slate-500 px-3 flex items-center justify-between">
        <span>Role: <strong className="uppercase text-slate-300">{role}</strong></span>
        <span className="font-mono text-[10px] text-emerald-400">SECURE</span>
      </div>
    </aside>
  )
}
