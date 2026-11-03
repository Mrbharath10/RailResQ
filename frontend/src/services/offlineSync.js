/**
 * RailResQ Offline-First Emergency Sync Engine (Innovation 3)
 * Bridges native IndexedDB storage with legacy hooks and reactive listeners.
 */

export {
  isDeviceOnline,
  isSimulatedOffline,
  setSimulatedOfflineMode,
  saveOfflineComplaint,
  getAllOfflineComplaints,
  getAllOfflineComplaints as getOfflineQueue,
  syncOfflineComplaints,
  syncOfflineComplaints as syncOfflineIncidents,
  getPendingSyncCount,
  subscribeOfflineSync,
  subscribeOfflineSync as listenOfflineSyncEvents,
  clearSyncedOfflineComplaints,
  clearSyncedOfflineComplaints as clearSyncedQueue
} from './indexedDbSync'
