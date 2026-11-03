import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'

// Pages
import LandingPage from '../pages/public/LandingPage'
import LoginPage from '../pages/public/LoginPage'
import RegisterPage from '../pages/public/RegisterPage'
import ReportIncidentPage from '../pages/passenger/ReportIncidentPage'
import MyReportsPage from '../pages/passenger/MyReportsPage'
import AIChatbotPage from '../pages/passenger/AIChatbotPage'
import ControlRoomDashboard from '../pages/operator/ControlRoomDashboard'
import StationHandoverView from '../pages/operator/StationHandoverView'
import LiveTrainTrackingView from '../pages/operator/LiveTrainTrackingView'
import CoachLayoutView from '../pages/operator/CoachLayoutView'
import StationBoardView from '../pages/operator/StationBoardView'
import DuplicateTriageView from '../pages/operator/DuplicateTriageView'
import ResourcesView from '../pages/operator/ResourcesView'
import SimulatorView from '../pages/operator/SimulatorView'
import AuditTrailView from '../pages/admin/AuditTrailView'
import AdminDashboard from '../pages/admin/AdminDashboard'

// Mock Railway Booking System Pages
import TrainSearchPage from '../pages/passenger/TrainSearchPage'
import DigitalTicketView from '../pages/passenger/DigitalTicketView'
import MyBookingsPage from '../pages/passenger/MyBookingsPage'
import PNRVerificationPage from '../pages/passenger/PNRVerificationPage'
import AdminBookingManagementView from '../pages/admin/AdminBookingManagementView'

// Super App Companion Modules
import PassengerSuperDashboard from '../pages/passenger/PassengerSuperDashboard'
import FoodOrderingPage from '../pages/passenger/FoodOrderingPage'
import GroceryEssentialsPage from '../pages/passenger/GroceryEssentialsPage'
import PoliceAssistancePage from '../pages/passenger/PoliceAssistancePage'
import MedicalAssistancePage from '../pages/passenger/MedicalAssistancePage'
import LocalTransportPage from '../pages/passenger/LocalTransportPage'
import ExploreDestinationsPage from '../pages/passenger/ExploreDestinationsPage'
import HotelBookingPage from '../pages/passenger/HotelBookingPage'
import AITravelGuidePage from '../pages/passenger/AITravelGuidePage'
import RailGuidePage from '../pages/passenger/RailGuidePage'
import AdminSuperConsoleView from '../pages/admin/AdminSuperConsoleView'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public & Evaluator Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/simulator" element={<SimulatorView />} />
        <Route path="/audit-trail" element={<AuditTrailView />} />

        {/* Mock Railway Ticket Booking Engine Routes */}
        <Route path="/train-search" element={<TrainSearchPage />} />
        <Route path="/booking" element={<TrainSearchPage />} />
        <Route path="/ticket/:pnr" element={<DigitalTicketView />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/passenger/bookings" element={<MyBookingsPage />} />
        <Route path="/pnr-status" element={<PNRVerificationPage />} />
        <Route path="/pnr" element={<PNRVerificationPage />} />

        {/* Real-time Fleet Live GPS Tracking & NTES Running Status */}
        <Route path="/train-tracking" element={<LiveTrainTrackingView />} />
        <Route path="/operator/live-tracking" element={<LiveTrainTrackingView />} />
        <Route path="/passenger/train-tracking" element={<LiveTrainTrackingView />} />

        {/* RailRadar Powered Coach Layout & Station Boards */}
        <Route path="/coaches" element={<CoachLayoutView />} />
        <Route path="/coach-layout" element={<CoachLayoutView />} />
        <Route path="/station-board" element={<StationBoardView />} />

        {/* Passenger Emergency Routes */}
        <Route path="/chatbot" element={<AIChatbotPage />} />
        <Route path="/passenger/chatbot" element={<AIChatbotPage />} />
        <Route path="/passenger/report" element={<ReportIncidentPage />} />
        <Route path="/passenger/reports" element={<MyReportsPage />} />

        {/* Operator Routes */}
        <Route path="/operator/dashboard" element={<ControlRoomDashboard />} />
        <Route path="/operator/handover" element={<StationHandoverView />} />
        <Route path="/operator/duplicates" element={<DuplicateTriageView />} />
        <Route path="/operator/resources" element={<ResourcesView />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/bookings" element={<AdminBookingManagementView />} />
        <Route path="/admin/super-app" element={<AdminSuperConsoleView />} />

        {/* Super App Passenger Companion Routes */}
        <Route path="/passenger/dashboard" element={<PassengerSuperDashboard />} />
        <Route path="/passenger" element={<PassengerSuperDashboard />} />
        <Route path="/food" element={<FoodOrderingPage />} />
        <Route path="/grocery" element={<GroceryEssentialsPage />} />
        <Route path="/police" element={<PoliceAssistancePage />} />
        <Route path="/medical" element={<MedicalAssistancePage />} />
        <Route path="/transport" element={<LocalTransportPage />} />
        <Route path="/explore" element={<ExploreDestinationsPage />} />
        <Route path="/hotels" element={<HotelBookingPage />} />
        <Route path="/travel-guide" element={<AITravelGuidePage />} />
        <Route path="/rail-guide" element={<RailGuidePage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
