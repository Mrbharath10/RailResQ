import React, { useState, useEffect, useRef } from 'react'
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  CheckCircle2, 
  Languages, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw,
  Volume2,
  FileText,
  SlidersHorizontal
} from 'lucide-react'
import api from '../../services/api'

const REGIONAL_LANGUAGES = [
  { code: 'ta-IN', short: 'ta', name: 'Tamil', native: 'தமிழ்', placeholder: 'எ.கா: ரயில் எண் 12393 கோச் B2 கழிப்பறை மிகவும் அசுத்தமாக உள்ளது...' },
  { code: 'hi-IN', short: 'hi', name: 'Hindi', native: 'हिन्दी', placeholder: 'उदा: ट्रेन 12393 बोगी B2 में शौचालय बहुत गंदा है और पानी नहीं है...' },
  { code: 'te-IN', short: 'te', name: 'Telugu', native: 'తెలుగు', placeholder: 'ఉదా: రైలు 12393 కోచ్ B2 లో బాత్‌రూమ్ చాలా అపరిశుభ్రంగా ఉంది...' },
  { code: 'kn-IN', short: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', placeholder: 'ಉದಾ: ರೈಲು 12393 ಕೋಚ್ B2 ನಲ್ಲಿ ಶೌಚಾಲಯ ಸ್ವಚ್ಛವಾಗಿಲ್ಲ...' },
  { code: 'ml-IN', short: 'ml', name: 'Malayalam', native: 'മലയാളം', placeholder: 'ഉദാ: ട്രെയിൻ 12393 കോച്ച് B2 ലെ ശൗചാലയം വളരെ വൃത്തിഹീനമാണ്...' },
  { code: 'bn-IN', short: 'bn', name: 'Bengali', native: 'বাংলা', placeholder: 'उदा: ট্রেন 12393 কোচ B2 এর বাথরুম খুব অপরিচ্ছন্ন...' },
  { code: 'mr-IN', short: 'mr', name: 'Marathi', native: 'मराठी', placeholder: 'उदा: ट्रेन 12393 डब्बा B2 मधील शौचालय खूप अस्वच्छ आहे...' },
  { code: 'en-IN', short: 'en', name: 'English', native: 'English', placeholder: 'e.g. Train 12393 Coach B2 toilet is very dirty, garbage is lying near door...' }
]

export default function MultilingualVoiceAssistant({ onApplyDraft }) {
  const [selectedLang, setSelectedLang] = useState(REGIONAL_LANGUAGES[0]) // Default Tamil
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [speechSupported, setSpeechSupported] = useState(true)

  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = selectedLang.code

      recognition.onresult = (event) => {
        let currentText = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript
        }
        if (currentText.trim()) {
          setTranscript(currentText)
        }
      }

      recognition.onerror = (event) => {
        console.warn('Speech recognition event:', event.error)
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
    } catch (e) {
      setSpeechSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // ignore
        }
      }
    }
  }, [selectedLang])

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setErrorMsg('Speech recognition not supported in this browser. You can type or paste in your regional language below.')
      return
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop()
      } catch (e) {}
      setIsRecording(false)
    } else {
      setErrorMsg(null)
      setTranscript('')
      setAiResult(null)
      try {
        recognitionRef.current.lang = selectedLang.code
        recognitionRef.current.start()
        setIsRecording(true)
      } catch (e) {
        console.error('Failed to start recognition:', e)
        setIsRecording(false)
      }
    }
  }

  const handleAnalyzeVoice = async () => {
    if (!transcript.trim()) {
      setErrorMsg('Please record or type your complaint text first.')
      return
    }

    setAnalyzing(true)
    setErrorMsg(null)

    try {
      const res = await api.post('/incidents/voice-assist', {
        audio_transcript: transcript.trim(),
        selected_language: selectedLang.short
      })

      if (res.data.success) {
        setAiResult(res.data)
      } else {
        setErrorMsg(res.data.error || 'Failed to analyze speech.')
      }
    } catch (err) {
      console.error('Voice AI analysis error:', err)
      setErrorMsg('Error processing speech. Please verify connection.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleApplyToForm = () => {
    if (!aiResult) return

    onApplyDraft({
      title: aiResult.english_title || '',
      description: aiResult.english_description || transcript,
      category: aiResult.suggested_category || 'Cleanliness & Sanitation',
      train_number: aiResult.extracted_train_number || '',
      coach_number: aiResult.extracted_coach_number || '',
      seat_number: aiResult.extracted_seat_number || '',
      reported_language: aiResult.detected_language_code || selectedLang.short,
      source_module: 'VOICE'
    })
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Module 1 Header */}
      <div className="flex flex-wrap justify-between items-start gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600/20 p-2.5 rounded-xl border border-blue-500/30">
            <Languages className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-base">Module 1: Multilingual Voice-Based Complaint Assistant</h3>
              <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                GEMINI AI
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Speak comfortably in Tamil, Hindi, or your regional language. RailResQ translates and drafts a verified railway complaint.
            </p>
          </div>
        </div>

        {/* Language Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Speaking in:</span>
          <select
            value={selectedLang.code}
            onChange={(e) => {
              const found = REGIONAL_LANGUAGES.find((l) => l.code === e.target.value)
              if (found) setSelectedLang(found)
            }}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-semibold focus:border-blue-500 focus:outline-none"
          >
            {REGIONAL_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.native} ({lang.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recording Interface Deck */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <span className="font-semibold">Target Language:</span>
            <span className="bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-700/60">
              {selectedLang.native} ({selectedLang.name})
            </span>
          </div>

          {/* Microphone Record Button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-900/50'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isRecording ? 'Stop Recording' : `Speak in ${selectedLang.name}`}</span>
          </button>
        </div>

        {/* Live Audio Visualizer Wave */}
        {isRecording && (
          <div className="bg-slate-900/90 border border-rose-800/60 rounded-xl p-3 flex items-center justify-center space-x-1.5">
            <span className="w-1.5 h-6 bg-rose-500 rounded-full animate-bounce"></span>
            <span className="w-1.5 h-10 bg-rose-400 rounded-full animate-bounce [animation-delay:0.1s]"></span>
            <span className="w-1.5 h-8 bg-rose-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-12 bg-rose-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
            <span className="w-1.5 h-7 bg-rose-500 rounded-full animate-bounce [animation-delay:0.15s]"></span>
            <span className="text-xs font-bold text-rose-300 ml-3">Listening to your voice... Speak clearly.</span>
          </div>
        )}

        {/* Transcript Area (Live Spoken Text & Manual Edit) */}
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1.5 flex justify-between">
            <span>Spoken Speech Transcript ({selectedLang.native}):</span>
            {transcript && (
              <button
                type="button"
                onClick={() => setTranscript('')}
                className="text-[11px] text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </label>
          <textarea
            rows={3}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={selectedLang.placeholder}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Action Button: Analyze Voice with AI */}
        <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
          <div className="text-[11px] text-slate-400">
            {!speechSupported && (
              <span className="text-amber-400">
                &bull; Microphone not accessible in this browser view. You can type or paste regional text directly.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAnalyzeVoice}
            disabled={analyzing || !transcript.trim()}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-900/30"
          >
            <Sparkles className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Translating & Structuring with Gemini...' : 'Analyze Speech with Gemini AI &rarr;'}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* AI Bilingual Analysis & Review Deck (Displayed in Passenger's Language & English) */}
      {aiResult && (
        <div className="bg-slate-950 border border-blue-900/70 rounded-xl p-4 space-y-4 shadow-xl">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs text-white">
                Speech Successfully Processed ({aiResult.detected_language_name})
              </span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
              Source: {aiResult.source}
            </span>
          </div>

          {/* Bilingual Draft Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Passenger's Regional Language Confirmation Card */}
            <div className="bg-blue-950/30 border border-blue-800/60 rounded-xl p-3.5 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                {aiResult.detected_language_name} (Passenger Review Confirmation)
              </span>
              <h4 className="font-bold text-xs text-white">
                {aiResult.regional_title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {aiResult.regional_description}
              </p>
            </div>

            {/* Official English Railway Operation Draft Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Official English Draft (Railway Operations / TTE)
              </span>
              <h4 className="font-bold text-xs text-white">
                {aiResult.english_title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {aiResult.english_description}
              </p>
            </div>
          </div>

          {/* Extracted Structured Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Suggested Category:</span>
              <span className="font-bold text-emerald-400">{aiResult.suggested_category}</span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Train Number:</span>
              <span className="font-bold text-blue-400 font-mono">
                {aiResult.extracted_train_number || 'Not mentioned'}
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Coach Number:</span>
              <span className="font-bold text-cyan-400 font-mono">
                {aiResult.extracted_coach_number || 'Not mentioned'}
              </span>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Seat / Berth:</span>
              <span className="font-bold text-amber-400 font-mono">
                {aiResult.extracted_seat_number || 'Not mentioned'}
              </span>
            </div>
          </div>

          {/* Missing Details Alert Prompt */}
          {aiResult.missing_details_to_ask?.length > 0 && (
            <div className="p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-xl text-xs text-amber-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <span className="font-bold">Missing Information Prompt: </span>
                <span>Please ensure you provide your <strong>{aiResult.missing_details_to_ask.join(', ')}</strong> before final submission so squads can locate you.</span>
              </div>
            </div>
          )}

          {/* Apply to Main Complaint Form */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleApplyToForm}
              className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Review, Edit & Confirm Complaint Draft &rarr;</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
