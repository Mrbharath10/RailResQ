import React, { useState, useEffect, useRef } from 'react'
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  Minimize2, 
  Maximize2, 
  ShieldAlert, 
  Train, 
  MessageSquare
} from 'lucide-react'
import api from '../../services/api'

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hi! I am **RailResQ AI Assistant** powered by **Google Gemini**.\nHow can I assist you with passenger safety or train status?',
      source: 'Google Gemini',
      timestamp: 'Now'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const userText = input.trim()
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      timestamp: 'Now'
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const historyPayload = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text
      }))

      const res = await api.post('/chat/message', {
        message: userText,
        conversation_history: historyPayload
      })

      const botReply = {
        id: Date.now() + 1,
        sender: 'bot',
        text: res.data.reply,
        source: res.data.source,
        timestamp: 'Now'
      }

      setMessages((prev) => [...prev, botReply])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Emergency guidance available. If this is an urgent matter, please notify the TTE immediately.',
          source: 'Safety Engine',
          timestamp: 'Now'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Action Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-2xl shadow-blue-500/40 transition transform hover:scale-105 border border-blue-400/30"
          title="Open RailResQ Gemini AI Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-1 -right-1 animate-ping"></span>
          </div>
          <span className="font-bold text-xs tracking-wide hidden sm:inline">Ask RailResQ AI</span>
        </button>
      )}

      {/* Expanded Chat Widget Window */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-white">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <div>
                <h4 className="font-bold text-xs">RailResQ AI Assistant</h4>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Google Gemini Online</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-2.5 rounded-xl max-w-[85%] whitespace-pre-wrap leading-relaxed shadow ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></div>
                <span className="italic text-[11px]">Gemini is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything (e.g. Where is train 12393?)..."
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
