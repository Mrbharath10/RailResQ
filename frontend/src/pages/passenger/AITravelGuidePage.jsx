import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Sparkles, 
  Send, 
  MapPin, 
  Calendar, 
  Clock, 
  Compass, 
  Coffee, 
  Utensils, 
  Camera, 
  Sun, 
  ShoppingBag, 
  Smile, 
  Info,
  ChevronRight,
  Bot
} from 'lucide-react'
import api from '../../services/api'

export default function AITravelGuidePage() {
  const [searchParams] = useSearchParams()
  const initialCity = searchParams.get('city') || 'Chennai'

  const [selectedCity, setSelectedCity] = useState(initialCity)
  const [days, setDays] = useState(1)
  const [travelType, setTravelType] = useState('Family')
  const [itinerary, setItinerary] = useState(null)
  const [itineraryLoading, setItineraryLoading] = useState(false)

  // AI Ask box
  const [prompt, setPrompt] = useState('')
  const [aiAnswer, setAiAnswer] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const CITIES = ['Chennai', 'Madurai', 'Coimbatore', 'Ooty', 'Bengaluru']

  const PROMPT_SUGGESTIONS = [
    { city: 'Chennai', prompt: 'Top 5 things to do within 5 km of Chennai Central' },
    { city: 'Madurai', prompt: 'Where to get authentic Jigarthanda and Kari Dosa in Madurai?' },
    { city: 'Ooty', prompt: 'Nilgiri Mountain Railway toy train schedule & best viewpoints' },
    { city: 'Bengaluru', prompt: 'Best traditional South Indian filter coffee & dosa walk' }
  ]

  const fetchItinerary = async () => {
    setItineraryLoading(true)
    try {
      const res = await api.post('/travel-guide/itinerary', {
        city: selectedCity,
        days: days,
        budget_level: 'Moderate',
        interests: ['Attractions', 'Local Food', 'Heritage']
      })
      setItinerary(res.data)
    } catch (err) {
      console.error('Itinerary error:', err)
    } finally {
      setItineraryLoading(false)
    }
  }

  const handleAskAI = async (customPrompt) => {
    const q = customPrompt || prompt
    if (!q.trim()) return

    setAiLoading(true)
    setAiAnswer(null)
    try {
      const res = await api.post('/travel-guide/ask', {
        prompt: q,
        destination_city: selectedCity,
        travel_type: travelType
      })
      setAiAnswer(res.data)
      setPrompt('')
    } catch (err) {
      console.error('AI ask error:', err)
      setAiAnswer({
        reply: 'Sorry, the AI guide service is momentarily unavailable. Please retry shortly.',
        source: 'ERROR'
      })
    } finally {
      setAiLoading(false)
    }
  }

  useEffect(() => {
    fetchItinerary()
  }, [selectedCity, days])

  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'Coffee': return <Coffee className="w-4 h-4 text-amber-400" />
      case 'MapPin': return <MapPin className="w-4 h-4 text-rose-400" />
      case 'Utensils': return <Utensils className="w-4 h-4 text-orange-400" />
      case 'Camera': return <Camera className="w-4 h-4 text-cyan-400" />
      case 'Sun': return <Sun className="w-4 h-4 text-yellow-400" />
      case 'ShoppingBag': return <ShoppingBag className="w-4 h-4 text-emerald-400" />
      default: return <Compass className="w-4 h-4 text-blue-400" />
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-800 via-indigo-900 to-blue-900 p-6 md:p-8 text-white shadow-xl shadow-purple-950/30">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-purple-200 border border-purple-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Powered by Google Gemini 1.5 & Railway Intelligence</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            AI Travel Guide & Itinerary Planner
          </h1>
          <p className="text-sm md:text-base text-purple-100/90 leading-relaxed">
            Personalized sightseeing itineraries, hidden food spots, local transport guides, and real-time rail travel recommendations.
          </p>
        </div>

        {/* Academic Simulation Tag */}
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-[11px] text-purple-200 font-mono">
          Gemini AI Assistant • Southern Railway
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Itinerary Generator Controls & Results */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* City Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">City:</span>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs text-slate-100 rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500 font-bold"
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Days Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">Duration:</span>
                <div className="flex rounded-xl bg-slate-950 p-0.5 border border-slate-800">
                  <button
                    onClick={() => setDays(1)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      days === 1 ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1-Day Express
                  </button>
                  <button
                    onClick={() => setDays(2)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      days === 2 ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2-Day Complete
                  </button>
                </div>
              </div>

              {/* Style Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">Style:</span>
                <select
                  value={travelType}
                  onChange={(e) => setTravelType(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs text-slate-100 rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500 font-medium"
                >
                  <option value="Family">Family Friendly</option>
                  <option value="Budget">Budget Backpacker</option>
                  <option value="Pilgrim">Pilgrimage / Heritage</option>
                  <option value="Solo">Solo Traveler</option>
                </select>
              </div>
            </div>
          </div>

          {/* Itinerary Timeline Display */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>AI-Generated Schedule for {selectedCity}</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">TIMED STOPS</span>
            </div>

            {itineraryLoading ? (
              <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-slate-400">Synthesizing optimum route plan...</p>
              </div>
            ) : itinerary?.itinerary ? (
              <div className="space-y-6">
                {itinerary.itinerary.map(dayPlan => (
                  <div key={dayPlan.day} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-sm font-black text-purple-300 uppercase tracking-wider">
                        {dayPlan.title}
                      </h4>
                      <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded font-mono">
                        {dayPlan.stops?.length} STOPS
                      </span>
                    </div>

                    <div className="space-y-3 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                      {dayPlan.stops.map((stop, sIdx) => (
                        <div key={sIdx} className="relative group">
                          {/* Timeline dot */}
                          <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-slate-900"></div>

                          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-1 hover:border-purple-500/40 transition">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-amber-400 flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>{stop.time}</span>
                              </span>
                              <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                                {renderIcon(stop.icon)}
                                <span className="font-semibold text-slate-300">{stop.location}</span>
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed pt-0.5">{stop.activity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Click generate to view your itinerary.</p>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Gemini AI Travel Ask Box */}
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-slate-100">Ask RailResQ AI Guide</h3>
            </div>
            <p className="text-xs text-slate-400">
              Get customized local travel advice, safety tips, train connections, and food guides powered by Gemini.
            </p>

            {/* Suggestions Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Suggested Questions:</span>
              <div className="space-y-1.5">
                {PROMPT_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskAI(item.prompt)}
                    className="w-full text-left bg-slate-950 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-600/50 p-2 rounded-xl text-[11px] text-slate-300 transition flex items-center justify-between"
                  >
                    <span className="line-clamp-1">{item.prompt}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleAskAI(); }} className="space-y-2">
              <div className="relative">
                <textarea
                  rows="3"
                  placeholder={`Ask anything about travelling in ${selectedCity}...`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={aiLoading || !prompt.trim()}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow"
              >
                {aiLoading ? (
                  <span>Consulting Gemini AI...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask AI Travel Assistant</span>
                  </>
                )}
              </button>
            </form>

            {/* AI Response Output */}
            {aiAnswer && (
              <div className="bg-slate-950 border border-purple-900/60 p-4 rounded-xl space-y-2 animate-fade-in text-xs text-slate-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">
                    AI Guide Recommendation
                  </span>
                  <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.2 rounded font-mono">
                    {aiAnswer.source}
                  </span>
                </div>
                <div className="whitespace-pre-line leading-relaxed text-slate-300">
                  {aiAnswer.reply}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
