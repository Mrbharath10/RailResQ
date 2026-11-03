import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Train, 
  Bell, 
  User as UserIcon, 
  LogOut, 
  Wifi, 
  WifiOff, 
  ChevronDown,
  ShieldCheck,
  Radio,
  Sliders,
  Check,
  Sun,
  Moon
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../services/api'
import { isDeviceOnline, getPendingSyncCount, listenOfflineSyncEvents } from '../../services/offlineSync'

export default function Navbar() {
  const { user, logout, switchRole } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [offlinePendingCount, setOfflinePendingCount] = useState(getPendingSyncCount())
  const [onlineStatus, setOnlineStatus] = useState(isDeviceOnline())

  useEffect(() => {
    const unsub = listenOfflineSyncEvents(() => {
      setOfflinePendingCount(getPendingSyncCount())
      setOnlineStatus(isDeviceOnline())
    })
    const timer = setInterval(() => {
      setOfflinePendingCount(getPendingSyncCount())
      setOnlineStatus(isDeviceOnline())
    }, 4000)
    return () => {
      unsub()
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/analytics/notifications?limit=5')
        setNotifications(res.data)
      } catch (e) {
        // ignore
      }
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 15000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleRoleSelect = async (newRole) => {
    await switchRole(newRole)
    if (newRole === 'operator') {
      navigate('/operator/dashboard')
    } else if (newRole === 'passenger') {
      navigate('/passenger/dashboard')
    } else {
      navigate('/admin')
    }
  }

  return (
    <header className="h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-sm">
      
      {/* 1. Left: Brand Logo & Title */}
      <div className="flex items-center space-x-3">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <img 
            src="/railresq-icon.png" 
            alt="RailResQ" 
            className="w-10 h-10 rounded-xl object-contain shadow-md shadow-blue-950/50 group-hover:scale-105 transition border border-slate-700/60" 
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-lg tracking-tight text-white group-hover:text-cyan-300 transition">
                RailResQ
              </span>
              <span className="text-[10px] font-bold bg-blue-950 text-cyan-300 border border-blue-700/60 px-2 py-0.5 rounded-full font-mono">
                SUPER APP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden xl:block font-medium">
              Smart Railway &bull; Safer Journeys
            </p>
          </div>
        </Link>
      </div>

      {/* 2. Center: Sleek 3-Persona Segmented Control (Clean & Uncluttered) */}
      <div className="hidden md:flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800/90 shadow-inner">
        <button
          onClick={() => handleRoleSelect('passenger')}
          className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
            user?.role === 'passenger'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Passenger Portal</span>
        </button>

        <button
          onClick={() => handleRoleSelect('operator')}
          className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
            user?.role === 'operator'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Control Room Ops</span>
        </button>

        <button
          onClick={() => handleRoleSelect('admin')}
          className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
            user?.role === 'admin'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Admin & Config</span>
        </button>
      </div>

      {/* 3. Right: Clean Status, Notifications & Profile */}
      <div className="flex items-center space-x-3">
        
        {/* Offline / Online Sync Indicator */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border ${
            offlinePendingCount > 0
              ? 'bg-amber-950/80 text-amber-300 border-amber-600/80 animate-pulse'
              : !onlineStatus
              ? 'bg-rose-950/80 text-rose-300 border-rose-700'
              : 'bg-slate-950 text-slate-400 border-slate-800'
          }`}
          title={offlinePendingCount > 0 ? `${offlinePendingCount} offline pending reports` : 'IndexedDB Online Sync'}
        >
          <span className={`w-2 h-2 rounded-full ${onlineStatus ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
          <span className="text-[11px] font-mono hidden sm:inline">
            {offlinePendingCount > 0 ? `Sync (${offlinePendingCount})` : onlineStatus ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Dark / Light Mode Switcher */}
        <button
          onClick={toggleTheme}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm ${
            isDark 
              ? 'bg-slate-950 hover:bg-slate-800 text-amber-300 border-slate-800 hover:border-amber-400/40' 
              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
          }`}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <span className="text-[11px] font-bold hidden sm:inline text-slate-300">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600/20" />
              <span className="text-[11px] font-bold hidden sm:inline text-slate-700">Dark</span>
            </>
          )}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="w-9 h-9 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3 animate-scale-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200">Recent Notifications</span>
                <span className="text-[10px] text-slate-400 font-mono">{notifications.length} Total</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No new notifications</p>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} className="text-xs p-2 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                      <div className="font-semibold text-slate-200">{n.title || n.message}</div>
                      <div className="text-[10px] text-slate-500">{n.created_at || 'Just now'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 transition"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-[11px]">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <span className="font-semibold hidden sm:inline max-w-[120px] truncate">
              {user?.full_name || 'Passenger'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 text-xs animate-scale-in">
              <div className="px-3 py-2 border-b border-slate-800">
                <div className="font-bold text-slate-200">{user?.full_name || 'Rail Passenger'}</div>
                <div className="text-[10px] text-slate-400 font-mono uppercase">{user?.role}</div>
              </div>

              {/* Mobile Role Switching */}
              <div className="md:hidden py-1 border-b border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 px-3 font-semibold uppercase">Switch View:</span>
                <button
                  onClick={() => { setShowUserMenu(false); handleRoleSelect('passenger'); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
                >
                  Passenger Portal
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); handleRoleSelect('operator'); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
                >
                  Control Room Ops
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); handleRoleSelect('admin'); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
                >
                  Admin & Config
                </button>
              </div>

              {/* Theme Toggle in Dropdown */}
              <button
                onClick={() => {
                  toggleTheme()
                  setShowUserMenu(false)
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 flex items-center justify-between font-semibold transition"
              >
                <span className="flex items-center space-x-2">
                  {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400">
                  {theme}
                </span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false)
                  logout()
                  navigate('/login')
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 flex items-center space-x-2 font-semibold transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
