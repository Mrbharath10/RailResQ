import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Bot, 
  Send, 
  Sparkles, 
  Train, 
  ShieldAlert, 
  Hospital, 
  Clock, 
  Activity, 
  AlertCircle,
  HelpCircle,
  CornerDownLeft,
  ArrowRight,
  Flame,
  CheckCircle2,
  RefreshCw,
  Zap
} from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function AIChatbotPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hello! I am **RailResQ AI Assistant** powered by **Google Gemini**.\n\nI can assist you with:\n• **Emergency Guidance & First-Aid:** Steps for medical emergencies, fires, and safety threats.\n• **Live Train Telemetry:** Real-time running status, delays, and speeds (e.g. *Where is train 12393?*).\n• **Direct Incident Reporting:** Tell me what happened, and I can file an emergency report to the Control Room.`,
      source: 'Google Gemini (gemini-1.5-flash)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'Where is train 12393 right now?',
        'Passenger has chest pain in coach B2',
        'Fire in coach S4, what to do?',
        'What medical care is at Kanpur Central?'
      ]
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [geminiStatus, setGeminiStatus] = useState(null)
  const [filingIncident, setFilingIncident] = useState(false)
  const [incidentFiledSuccess, setIncidentFiledSuccess] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchStatus = async () => {
    try {
      const res = await api.get('/chat/status')
      setGeminiStatus(res.data)
    } catch (e) {
      console.error('Failed to fetch chat status:', e)
    }
  }

  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputMessage
    if (!text.trim() || loading) return

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInputMessage('')
    setLoading(true)

    try {
      const historyPayload = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text
      }))

      const res = await api.post('/chat/message', {
        message: text.trim(),
        conversation_history: historyPayload,
        user_role: user?.role || 'passenger'
      })

      const botReply = {
        id: Date.now() + 1,
        sender: 'bot',
        text: res.data.reply,
        source: res.data.source,
        intent: res.data.intent,
        action_data: res.data.action_data,
        train_context: res.data.train_context,
        suggestions: res.data.suggested_actions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }

      setMessages((prev) => [...prev, botReply])
    } catch (err) {
      const errorReply = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Sorry, I encountered a temporary connection issue. If this is an urgent emergency, please pull the alarm chain or contact the Coach Attendant / TTE immediately.',
        source: 'RailResQ Safety Engine',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages((prev) => [...prev, errorReply])
    } finally {
      setLoading(false)
    }
  }

  const handleFileIncident = async (actionData) => {
    if (!actionData) return
    setFilingIncident(true)
    setIncidentFiledSuccess(null)
    try {
      const payload = {
        train_number: actionData.train_number || '12393',
        coach_number: actionData.coach_number || 'B1',
        description: actionData.description || 'Emergency reported via RailResQ Gemini Chatbot',
        category: actionData.category || 'Medical emergency',
        reported_language: 'en'
      }

      const res = await api.post('/chat/quick-report', payload)
      setIncidentFiledSuccess({
        incident_id: res.data.incident_id,
        priority: res.data.suggested_priority,
        message: `Incident #${res.data.incident_id} successfully transmitted to Control Room!`
      })
    } catch (err) {
      console.error('Error filing incident from chat:', err)
    } finally {
      setFilingIncident(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-6.5rem)] flex flex-col space-y-4">
      {/* Header Deck */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20 text-white">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-white">RailResQ AI Emergency Assistant</h1>
              <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-mono font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>GEMINI 1.5 FLASH</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multilingual Emergency Dispatch &bull; Real-time NTES Running Status &bull; First-Aid Coordination
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <Link
            to="/train-tracking"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition"
          >
            <Train className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Radar Map</span>
          </Link>
          <Link
            to="/passenger/report"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Full Report Form</span>
          </Link>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start space-x-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'bot' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
            )}

            <div className={`max-w-xl space-y-2 ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Message Bubble */}
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-lg ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {m.text}
              </div>

              {/* Live Train Context Card if returned */}
              {m.train_context && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-bold text-white flex items-center space-x-1.5">
                      <Train className="w-3.5 h-3.5 text-blue-400" />
                      <span>{m.train_context.train_name} (#{m.train_context.train_number})</span>
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                      {m.train_context.delay_status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>Speed: <strong className="text-emerald-400 font-mono">{m.train_context.speed_kmph} km/h</strong></div>
                    <div>Next Halt: <strong className="text-blue-300">{m.train_context.next_station_name}</strong></div>
                    <div>ETA: <strong className="text-amber-400 font-mono">~{m.train_context.eta_next_station_minutes} mins</strong></div>
                    <div>Status: <strong className="text-white">{m.train_context.current_status}</strong></div>
                  </div>
                  <Link
                    to="/train-tracking"
                    className="block text-center w-full py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg font-semibold text-[11px] transition"
                  >
                    Track #{m.train_context.train_number} Live on GPS Map &rarr;
                  </Link>
                </div>
              )}

              {/* Action Card: One-Click Emergency Incident Submission */}
              {m.action_data && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-rose-300 flex items-center space-x-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>Detected Emergency: {m.action_data.category}</span>
                    </span>
                    <span className="text-[10px] text-rose-400 font-mono font-bold">PRIORITY ASSISTANCE</span>
                  </div>

                  <p className="text-[11px] text-slate-300">
                    Train: <strong>#{m.action_data.train_number}</strong> &bull; Coach: <strong>{m.action_data.coach_number}</strong>
                  </p>

                  {incidentFiledSuccess ? (
                    <div className="p-2 bg-emerald-950 border border-emerald-700 rounded-lg text-emerald-300 text-[11px] font-bold flex items-center justify-between">
                      <span>{incidentFiledSuccess.message}</span>
                      <Link
                        to="/operator/dashboard"
                        className="underline text-emerald-200"
                      >
                        View in Control Room
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleFileIncident(m.action_data)}
                      disabled={filingIncident}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs transition shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{filingIncident ? 'Transmitting to Control Room...' : '🚨 1-Click Transmit Incident to Control Room'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Suggested Follow-up Action Buttons */}
              {m.suggestions && m.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {m.suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(s)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Metadata tag */}
              <div className="flex items-center space-x-2 text-[10px] text-slate-500 px-1">
                {m.source && <span className="text-blue-400 font-mono">{m.source}</span>}
                <span>&bull;</span>
                <span>{m.timestamp}</span>
              </div>
            </div>

            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-md">
                {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-3 text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
              <span>Gemini AI is analyzing railway safety context...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative shrink-0">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask in any language: 'Passenger has chest pain in B2', 'Where is train 12393?', 'Fire safety protocol'..."
          className="w-full pl-4 pr-24 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 shadow-xl"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="absolute right-2 top-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-blue-600/30"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  )
}
