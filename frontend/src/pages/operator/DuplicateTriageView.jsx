import React, { useState, useEffect } from 'react'
import { Layers, AlertCircle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import api from '../../services/api'

export default function DuplicateTriageView() {
  const [duplicates, setDuplicates] = useState([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState(null)

  const fetchDuplicates = async () => {
    setLoading(true)
    try {
      const res = await api.get('/duplicates')
      setDuplicates(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDuplicates()
  }, [])

  const handleReview = async (id, decision) => {
    try {
      await api.post('/duplicates/review', {
        duplicate_record_id: id,
        review_status: decision,
        notes: `Operator marked match as ${decision}`
      })
      setNotice(`Match record #${id} updated: ${decision}`)
      fetchDuplicates()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2.5">
            <Layers className="w-7 h-7 text-amber-400" />
            <span>Duplicate Incident Detection & Triage</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic similarity analysis comparing train, coach, category, and text tokens.
          </p>
        </div>
        <button
          onClick={fetchDuplicates}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs rounded-xl shadow">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Loading duplicate pairs...</div>
      ) : duplicates.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Duplicate Conflicts</h3>
          <p className="text-xs text-slate-400 mt-1">
            All current incoming emergency reports appear distinct and unique.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {duplicates.map((dup) => (
            <div
              key={dup.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-white">Comparison Record #{dup.id}</span>
                  <span className="text-xs bg-amber-950 text-amber-400 px-2 py-0.5 rounded font-mono border border-amber-800">
                    Similarity Score: {Math.round(dup.similarity_score * 100)}%
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  dup.review_status === 'CONFIRMED_DUPLICATE'
                    ? 'bg-rose-900 text-rose-200'
                    : dup.review_status === 'REJECTED_DIFFERENT'
                    ? 'bg-emerald-900 text-emerald-200'
                    : 'bg-amber-900 text-amber-200'
                }`}>
                  {dup.review_status}
                </span>
              </div>

              {/* Side by side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-blue-400">Incident #{dup.incident_id}</div>
                  <div className="text-xs text-white">
                    Train: <span className="font-semibold">{dup.incident_train}</span> &bull; Coach: <span className="font-semibold">{dup.incident_coach}</span>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800">
                    "{dup.incident_desc}"
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-amber-400">Possible Duplicate #{dup.possible_duplicate_id}</div>
                  <div className="text-xs text-white">
                    Train: <span className="font-semibold">{dup.possible_duplicate_train}</span> &bull; Coach: <span className="font-semibold">{dup.possible_duplicate_coach}</span>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800">
                    "{dup.possible_duplicate_desc}"
                  </p>
                </div>
              </div>

              {/* Match Factors */}
              {dup.match_reasons?.length > 0 && (
                <div className="text-xs text-slate-400 pt-1">
                  <span className="font-semibold text-slate-300 block mb-1">Similarity Evaluation Factors:</span>
                  <div className="flex flex-wrap gap-2">
                    {dup.match_reasons.map((reason, idx) => (
                      <span key={idx} className="bg-slate-800 px-2.5 py-1 rounded text-[11px] text-slate-300 border border-slate-700">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Operator Action Buttons */}
              {dup.review_status === 'PENDING_REVIEW' && (
                <div className="flex space-x-3 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleReview(dup.id, 'CONFIRMED_DUPLICATE')}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Duplicate (Link Reports)</span>
                  </button>
                  <button
                    onClick={() => handleReview(dup.id, 'REJECTED_DIFFERENT')}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Match (Keep Independent)</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
