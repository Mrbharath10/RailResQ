import React, { useState, useRef } from 'react'
import { 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Image as ImageIcon,
  X,
  Layers,
  ArrowRight
} from 'lucide-react'
import api from '../../services/api'

// Preset sample photographic scenarios for rapid viva demonstration
const PRESET_SAMPLE_PHOTOS = [
  {
    id: 'trash',
    label: '🗑️ Trash Near Lavatory',
    filename: 'unclean_washroom_trash.jpg',
    description: 'Photo showing plastic bottles and garbage accumulated near train toilet',
    previewUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 'seat',
    label: '🪑 Broken Berth Cushion',
    filename: 'damaged_seat_cushion.jpg',
    description: 'Photo showing torn seat leather and exposed spring in sleeper coach',
    previewUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=60'
  },
  {
    id: 'washbasin',
    label: '🚰 Clogged Washbasin',
    filename: 'clogged_sink_washroom.jpg',
    description: 'Photo showing overflowing washbasin with stagnant dirty water',
    previewUrl: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=400&auto=format&fit=crop&q=60'
  }
]

export default function ImageVisionAssistant({ onApplyDraft }) {
  const [imageBase64, setImageBase64] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [fileName, setFileName] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setErrorMsg(null)
    setAiResult(null)

    const reader = new FileReader()
    reader.onload = () => {
      const fullBase64 = reader.result
      setImagePreview(fullBase64)
      // Extract raw base64 data without data:image/...;base64,
      const rawData = fullBase64.split(',')[1] || fullBase64
      setImageBase64(rawData)
    }
    reader.readAsDataURL(file)
  }

  const handleSelectPreset = (preset) => {
    setFileName(preset.filename)
    setImagePreview(preset.previewUrl)
    // Convert to mock base64 token
    setImageBase64(`mock_base64_${preset.id}`)
    setErrorMsg(null)
    setAiResult(null)
  }

  const handleClearImage = () => {
    setImageBase64('')
    setImagePreview('')
    setFileName('')
    setAiResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAnalyzeImage = async () => {
    if (!imageBase64 && !imagePreview) {
      setErrorMsg('Please upload or capture a photograph first.')
      return
    }

    setAnalyzing(true)
    setErrorMsg(null)

    try {
      const res = await api.post('/incidents/image-assist', {
        image_base64: imageBase64 || 'data_image_preset',
        mime_type: 'image/jpeg',
        filename: fileName
      })

      if (res.data.success) {
        setAiResult(res.data)
      } else {
        setErrorMsg(res.data.error || 'Failed to analyze photograph.')
      }
    } catch (err) {
      console.error('Vision analysis error:', err)
      setErrorMsg('Error querying Gemini Vision service. Please check connection.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleApplyToForm = () => {
    if (!aiResult) return

    onApplyDraft({
      title: aiResult.suggested_title || 'Visual Coach Defect Reported',
      description: aiResult.suggested_description || aiResult.observed_issue,
      category: aiResult.suggested_category || 'Cleanliness & Sanitation',
      image_base64: imagePreview,
      source_module: 'IMAGE'
    })
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Module 3 Header */}
      <div className="flex flex-wrap justify-between items-start gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-600/20 p-2.5 rounded-xl border border-emerald-500/30">
            <Camera className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-base">Module 3: AI-Powered Image-Based Complaint Assistant</h3>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                GEMINI VISION
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Photograph broken seats, dirty washrooms, or trash. Gemini Vision analyzes observable defects and formulates your draft.
            </p>
          </div>
        </div>

        {/* AI Disclaimer Pill */}
        <div className="flex items-center space-x-1.5 text-[11px] text-amber-300 bg-amber-950/60 border border-amber-800/70 px-2.5 py-1 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>AI suggests category only — does not make final judgement</span>
        </div>
      </div>

      {/* Upload & Capture Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload Box / Dropzone */}
        <div className="space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition flex flex-col items-center justify-center space-y-2.5 h-56"
            >
              <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Click to Upload or Capture Photo</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Supports JPG, PNG from camera or gallery</p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 h-56 flex items-center justify-center">
              <img
                src={imagePreview}
                alt="Complaint Photograph Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleClearImage}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white transition border border-slate-700"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 bg-slate-950/90 text-[10px] text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 font-mono">
                {fileName || 'Captured Photograph'}
              </div>
            </div>
          )}

          {/* Quick Demo Preset Photos */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Quick Viva Demonstration Scenarios:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_SAMPLE_PHOTOS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Analysis Action & Information Side */}
        <div className="flex flex-col justify-between space-y-3 bg-slate-950 border border-slate-800/80 rounded-xl p-4">
          <div className="space-y-3 text-xs text-slate-300">
            <h4 className="font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Gemini Vision Defect Extraction Rules</span>
            </h4>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li className="flex items-start space-x-1.5">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span><strong>No Unverified Assumptions:</strong> AI will not assume coach or train numbers that cannot be verified from the photograph.</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span><strong>Category Suggestion:</strong> AI categorizes based purely on visible condition (Sanitation, Broken Fitting, Electrical, etc.).</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span><strong>Passenger Confirmation Gate:</strong> You will review and enter specific Coach and Berth location.</span>
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleAnalyzeImage}
              disabled={analyzing || !imagePreview}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/30"
            >
              <Sparkles className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'Analyzing with Gemini Vision...' : 'Analyze Photo with Gemini AI &rarr;'}</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Vision Results Deck */}
      {aiResult && (
        <div className="bg-slate-950 border border-emerald-900/70 rounded-xl p-4 space-y-4 shadow-xl">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs text-white">Visual Defect Analysis Complete</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
              Engine: {aiResult.source}
            </span>
          </div>

          {/* Observed Condition & Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Observed Physical Problem (from photograph)
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {aiResult.observed_issue}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  AI Suggested Category
                </span>
                <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.2 rounded font-bold">
                  VERIFY
                </span>
              </div>
              <div className="text-sm font-bold text-white">
                {aiResult.suggested_category}
              </div>
              <p className="text-[10px] text-slate-400 italic">
                &bull; {aiResult.ai_judgement_notice}
              </p>
            </div>
          </div>

          {/* Formulated Draft Title & Description */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
              Formulated Complaint Draft (Review Before Submitting)
            </span>
            <h4 className="font-bold text-xs text-white">
              {aiResult.suggested_title}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {aiResult.suggested_description}
            </p>
          </div>

          {/* Missing Details Prompt (Coach, Seat, Train Number) */}
          {aiResult.missing_details_to_ask?.length > 0 && (
            <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-xl text-xs text-amber-300 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <span className="font-bold">Missing Coach Details: </span>
                <span>The photograph cannot identify your coach or seat location. Please add: <strong>{aiResult.missing_details_to_ask.join(', ')}</strong> in the form below so response teams can locate the defect.</span>
              </div>
            </div>
          )}

          {/* Apply to Main Form Button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleApplyToForm}
              className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Use Photo Draft & Add Missing Coach Details &rarr;</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
