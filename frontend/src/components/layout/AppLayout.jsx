import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import AIChatWidget from '../chat/AIChatWidget'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-950/40 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      {/* Floating AI Chatbot Widget (Google Gemini Powered) */}
      <AIChatWidget />
    </div>
  )
}
