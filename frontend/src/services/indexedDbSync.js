/**
 * Module 2: Offline Complaint Storage and Synchronisation using IndexedDB
 * 
 * Provides:
 * 1. Safe offline complaint persistence in browser IndexedDB (RailResQ_IndexedDB).
 * 2. Status tracking: "Saved Offline – Pending Sync".
 * 3. Clear distinction between local on-device drafts and official railway submissions.
 * 4. Unique Idempotency Keys to prevent duplicate submissions on retry.
 * 5. Automatic connection monitoring and retry synchronisation.
 */

import api from './api'

const DB_NAME = 'RailResQ_IndexedDB'
const DB_VERSION = 1
const STORE_NAME = 'offline_complaints'
const SIMULATED_OFFLINE_KEY = 'railresq_simulated_offline_mode'

// Listeners for reactive UI state updates
const listeners = new Set()

export const notifyListeners = () => {
  listeners.forEach((fn) => {
    try {
      fn()
    } catch (e) {
      console.error('Error notifying sync listener:', e)
    }
  })
}

export const subscribeOfflineSync = (callback) => {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

// -------------------------------------------------------------
// Connectivity State & Viva Simulation Toggle
// -------------------------------------------------------------
export const isSimulatedOffline = () => {
  return typeof localStorage !== 'undefined' && localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true'
}

export const setSimulatedOfflineMode = (enabled) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SIMULATED_OFFLINE_KEY, enabled ? 'true' : 'false')
  }
  notifyListeners()
  if (!enabled && isDeviceOnline()) {
    // When returning to online mode, trigger automatic synchronization
    syncOfflineComplaints()
  }
}

export const isDeviceOnline = () => {
  if (isSimulatedOffline()) return false
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

// -------------------------------------------------------------
// IndexedDB Database Connection Helper
// -------------------------------------------------------------
const openDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'idempotency_key' })
        store.createIndex('status', 'status', { unique: false })
        store.createIndex('created_at_epoch', 'created_at_epoch', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// -------------------------------------------------------------
// IndexedDB Operations: Save, Read, Update, Delete
// -------------------------------------------------------------

/**
 * Saves a complaint locally into IndexedDB when passenger is in a dead-zone or tunnel.
 * Generates unique idempotency key and marks as locally saved draft.
 */
export const saveOfflineComplaint = async (data) => {
  const now = new Date()
  const randomSuffix = Math.random().toString(36).substring(2, 9).toUpperCase()
  const idempotencyKey = `IDEMP-RR-${now.getTime()}-${randomSuffix}`
  const offlineId = `OFFLINE-REC-${now.getTime().toString(36).toUpperCase()}`

  const offlineDraft = {
    idempotency_key: idempotencyKey,
    offline_id: offlineId,
    // Status strictly as specified:
    status: 'SAVED_OFFLINE_PENDING_SYNC',
    // Explicit tier distinguishing local draft from official submission:
    submission_tier: 'LOCAL_DEVICE_DRAFT',
    is_officially_submitted: false,
    official_disclaimer: 'LOCALLY SAVED DRAFT: Stored in browser IndexedDB. Not yet received by Indian Railways or RailResQ central servers. Transmits automatically upon signal return.',
    
    // Complaint details
    train_number: String(data.train_number || '12393').trim(),
    train_name: data.train_name || `Train #${data.train_number || '12393'}`,
    coach_number: String(data.coach_number || 'B1').trim().toUpperCase(),
    seat_number: String(data.seat_number || '').trim(),
    category: data.category || 'Cleanliness & Sanitation',
    title: data.title || 'Passenger Emergency / Service Complaint',
    description: data.description || '',
    reported_location: data.reported_location || 'Remote Route / Tunnel Area (Offline)',
    reported_language: data.reported_language || 'en',
    passenger_name: data.passenger_name || 'Passenger',
    passenger_contact: data.passenger_contact || '',
    image_base64: data.image_base64 || '',
    source_module: data.source_module || 'MANUAL', // 'VOICE', 'IMAGE', or 'MANUAL'
    
    offline_timestamp: now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    created_at_epoch: now.getTime()
  }

  try {
    const db = await openDB()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(offlineDraft)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })

    // Also mirror to localStorage for quick synchronous reads by Navbar
    mirrorQueueToLocalStorage()
    notifyListeners()
    return offlineDraft
  } catch (err) {
    console.error('IndexedDB save error, falling back to localStorage:', err)
    saveToLocalStorageFallback(offlineDraft)
    notifyListeners()
    return offlineDraft
  }
}

/**
 * Retrieves all offline complaints stored in IndexedDB.
 */
export const getAllOfflineComplaints = async () => {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()
      req.onsuccess = () => {
        const sorted = (req.result || []).sort((a, b) => b.created_at_epoch - a.created_at_epoch)
        resolve(sorted)
      }
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('IndexedDB read error, using localStorage fallback:', err)
    return getLocalStorageFallback()
  }
}

/**
 * Gets count of complaints currently pending synchronization.
 */
export const getPendingSyncCount = () => {
  try {
    const raw = localStorage.getItem('railresq_offline_queue_mirror')
    if (!raw) return 0
    const list = JSON.parse(raw)
    return list.filter((i) => i.status === 'SAVED_OFFLINE_PENDING_SYNC').length
  } catch (e) {
    return 0
  }
}

// -------------------------------------------------------------
// Synchronisation Engine with Idempotency Validation
// -------------------------------------------------------------

/**
 * Synchronizes all pending offline complaints with the RailResQ backend.
 * Uses idempotency keys to guarantee no duplicate submissions even during network retries.
 */
export const syncOfflineComplaints = async () => {
  if (!isDeviceOnline()) {
    return {
      success: false,
      reason: 'DEVICE_OFFLINE',
      message: 'Cannot synchronize while device is offline or in simulated tunnel mode.'
    }
  }

  const allItems = await getAllOfflineComplaints()
  const pendingItems = allItems.filter((i) => i.status === 'SAVED_OFFLINE_PENDING_SYNC')

  if (pendingItems.length === 0) {
    return {
      success: true,
      count: 0,
      message: 'No pending offline complaints to synchronize.'
    }
  }

  try {
    const payload = {
      items: pendingItems.map((item) => ({
        offline_id: item.offline_id,
        idempotency_key: item.idempotency_key,
        offline_timestamp: item.offline_timestamp,
        train_number: item.train_number,
        train_name: item.train_name,
        coach_number: item.coach_number,
        seat_number: item.seat_number,
        category: item.category,
        title: item.title,
        description: item.description,
        reported_location: item.reported_location,
        reported_language: item.reported_language,
        passenger_name: item.passenger_name,
        passenger_contact: item.passenger_contact,
        image_url: item.image_base64 ? '(Attached Photographic Evidence)' : ''
      }))
    }

    const res = await api.post('/incidents/sync-offline', payload)

    if (res.data.success) {
      const syncedMap = new Map()
      res.data.synced_incidents.forEach((s) => syncedMap.set(s.idempotency_key, s))

      // Update records in IndexedDB
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)

      for (const item of pendingItems) {
        if (syncedMap.has(item.idempotency_key)) {
          const syncInfo = syncedMap.get(item.idempotency_key)
          item.status = 'OFFICIALLY_RECEIVED_BY_RAILRESQ'
          item.submission_tier = 'OFFICIALLY_RECEIVED_AND_TRIAGED'
          item.is_officially_submitted = true
          item.server_incident_id = syncInfo.server_incident_id
          item.assigned_priority = syncInfo.priority
          item.synced_at = new Date().toLocaleTimeString('en-IN')
          item.official_disclaimer = `OFFICIALLY RECEIVED: Incident #${syncInfo.server_incident_id} created in Control Room database. Verified with idempotency check.`
          store.put(item)
        }
      }

      await new Promise((resolve) => {
        tx.oncomplete = resolve
      })

      mirrorQueueToLocalStorage()
      notifyListeners()

      return {
        success: true,
        count: res.data.synced_count,
        synced_incidents: res.data.synced_incidents,
        message: res.data.message
      }
    }
  } catch (err) {
    console.error('Offline synchronization failed:', err)
    return {
      success: false,
      reason: 'SYNC_ERROR',
      error: err,
      message: 'Failed to synchronize with server. Will retry automatically when signal stabilizes.'
    }
  }
}

/**
 * Removes completed/synced drafts from local IndexedDB storage.
 */
export const clearSyncedOfflineComplaints = async () => {
  try {
    const db = await openDB()
    const all = await getAllOfflineComplaints()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    for (const item of all) {
      if (item.status === 'OFFICIALLY_RECEIVED_BY_RAILRESQ') {
        store.delete(item.idempotency_key)
      }
    }

    await new Promise((resolve) => {
      tx.oncomplete = resolve
    })
    mirrorQueueToLocalStorage()
    notifyListeners()
  } catch (e) {
    console.error('Clear synced complaints error:', e)
  }
}

// -------------------------------------------------------------
// Synchronous LocalStorage Mirroring for Navbar Badges & Fallback
// -------------------------------------------------------------
const mirrorQueueToLocalStorage = async () => {
  try {
    const all = await getAllOfflineComplaints()
    localStorage.setItem('railresq_offline_queue_mirror', JSON.stringify(all))
  } catch (e) {
    // Ignore
  }
}

const saveToLocalStorageFallback = (draft) => {
  try {
    const list = getLocalStorageFallback()
    list.unshift(draft)
    localStorage.setItem('railresq_offline_queue_mirror', JSON.stringify(list))
  } catch (e) {
    console.error('LocalStorage fallback error:', e)
  }
}

const getLocalStorageFallback = () => {
  try {
    const raw = localStorage.getItem('railresq_offline_queue_mirror')
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

// -------------------------------------------------------------
// Global Network Connection Listeners
// -------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[RailResQ IndexedDB Engine] Network connectivity restored. Initiating automatic synchronization...')
    notifyListeners()
    syncOfflineComplaints()
  })

  window.addEventListener('offline', () => {
    console.log('[RailResQ IndexedDB Engine] Cellular dead-zone detected. Safe offline IndexedDB persistence active.')
    notifyListeners()
  })

  // Initial mirror on page load
  setTimeout(() => mirrorQueueToLocalStorage(), 500)
}
