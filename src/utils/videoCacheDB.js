/**
 * IndexedDB Video Cache for persistent storage
 * Stores video blobs and metadata for offline/repeated access
 */

const DB_NAME = 'AuriVideoDB';
const DB_VERSION = 1;
const STORE_NAME = 'cachedVideos';

let db = null;

/**
 * Initialize IndexedDB
 */
export async function initVideoDB() {
  if (typeof window === 'undefined') return null;
  
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported');
      resolve(null);
      return;
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.warn('IndexedDB open failed:', request.error);
      resolve(null);
    };
    
    request.onsuccess = () => {
      db = request.result;
      console.log('Video DB initialized');
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('size', 'size', { unique: false });
        console.log('Video store created');
      }
    };
  });
}

/**
 * Store video in IndexedDB
 */
export async function storeVideoInDB(url, blob, metadata = {}) {
  if (!db) {
    await initVideoDB();
    if (!db) return false;
  }
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const record = {
      url,
      blob,
      size: blob.size,
      timestamp: Date.now(),
      mimeType: blob.type,
      ...metadata
    };
    
    const request = store.put(record);
    
    request.onsuccess = () => {
      console.log('Video stored in DB:', url);
      resolve(true);
    };
    
    request.onerror = () => {
      console.warn('Failed to store video in DB:', request.error);
      resolve(false);
    };
  });
}

/**
 * Get video from IndexedDB
 */
export async function getVideoFromDB(url) {
  if (!db) {
    await initVideoDB();
    if (!db) return null;
  }
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(url);
    
    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        resolve({
          blob: result.blob,
          timestamp: result.timestamp,
          size: result.size,
          mimeType: result.mimeType
        });
      } else {
        resolve(null);
      }
    };
    
    request.onerror = () => {
      console.warn('Failed to get video from DB:', request.error);
      resolve(null);
    };
  });
}

/**
 * Check if video exists in IndexedDB
 */
export async function hasVideoInDB(url) {
  if (!db) {
    await initVideoDB();
    if (!db) return false;
  }
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.has(url);
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      resolve(false);
    };
  });
}

/**
 * Remove video from IndexedDB
 */
export async function removeVideoFromDB(url) {
  if (!db) {
    await initVideoDB();
    if (!db) return false;
  }
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(url);
    
    request.onsuccess = () => {
      console.log('Video removed from DB:', url);
      resolve(true);
    };
    
    request.onerror = () => {
      console.warn('Failed to remove video from DB:', request.error);
      resolve(false);
    };
  });
}

/**
 * Get all cached videos
 */
export async function getAllCachedVideos() {
  if (!db) {
    await initVideoDB();
    if (!db) return [];
  }
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result || []);
    };
    
    request.onerror = () => {
      console.warn('Failed to get all videos:', request.error);
      resolve([]);
    }
  });
}

/**
 * Clear all cached videos
 */
export async function clearAllCachedVideos() {
  if (!db) {
    await initVideoDB();
    if (!db) return false;
  }
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => {
      console.log('All cached videos cleared from DB');
      resolve(true);
    };
    
    request.onerror = () => {
      console.warn('Failed to clear videos:', request.error);
      resolve(false);
    };
  });
}

/**
 * Get total cache size
 */
export async function getTotalCacheSize() {
  const videos = await getAllCachedVideos();
  return videos.reduce((total, video) => total + (video.size || 0), 0);
}

/**
 * Remove oldest videos to free up space
 */
export async function cleanupOldVideos(maxSizeMB = 50) {
  const videos = await getAllCachedVideos();
  const maxSize = maxSizeMB * 1024 * 1024;
  const sortedVideos = videos.sort((a, b) => a.timestamp - b.timestamp);
  
  let currentSize = await getTotalCacheSize();
  
  for (const video of sortedVideos) {
    if (currentSize <= maxSize) break;
    
    await removeVideoFromDB(video.url);
    currentSize -= video.size;
  }
  
  console.log(`Cleaned up old videos, new size: ${(currentSize / 1024 / 1024).toFixed(2)}MB`);
}

