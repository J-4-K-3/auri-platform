/**
 * Combined Video Cache Manager
 * Uses Cache API for session storage + IndexedDB for persistent storage
 * Prioritizes cached videos to reduce Appwrite bandwidth
 */

import { 
  openVideoCache, 
  getCachedVideo, 
  cacheVideo as cacheVideoToCacheAPI,
  isVideoCached,
  clearVideoCache,
  getCacheSize
} from './videoCache';
import {
  initVideoDB,
  storeVideoInDB,
  getVideoFromDB,
  hasVideoInDB,
  removeVideoFromDB,
  clearAllCachedVideos,
  getTotalCacheSize,
  cleanupOldVideos
} from './videoCacheDB';

// Initialize DB on module load
initVideoDB();

/**
 * Check if video is cached in either storage
 */
export async function isVideoAvailable(url) {
  if (!url) return false;
  
  try {
    // Check Cache API first (faster)
    const inCacheAPI = await isVideoCached(url);
    if (inCacheAPI) return true;
    
    // Check IndexedDB
    const inIndexedDB = await hasVideoInDB(url);
    return inIndexedDB;
  } catch (error) {
    console.warn('Cache check failed:', error);
    return false;
  }
}

/**
 * Get cached video URL - returns blob URL if cached
 */
export async function getCachedVideoUrl(url) {
  if (!url) return url;
  
  try {
    // Try Cache API first
    const cacheAPIResponse = await getCachedVideo(url);
    if (cacheAPIResponse) {
      const blob = await cacheAPIResponse.blob();
      return URL.createObjectURL(blob);
    }
    
    // Try IndexedDB
    const idbData = await getVideoFromDB(url);
    if (idbData && idbData.blob) {
      return URL.createObjectURL(idbData.blob);
    }
  } catch (error) {
    console.warn('Failed to get cached video URL:', error);
  }
  
  return url;
}

/**
 * Cache a video to both storage systems
 * Fetches once, stores to both Cache API and IndexedDB
 */
export async function cacheVideo(url, options = {}) {
  if (!url) return false;
  
  const { 
    preferIndexedDB = true, 
    skipIfCached = true 
  } = options;
  
  try {
    // Check if already cached
    if (skipIfCached && await isVideoAvailable(url)) {
      return true;
    }
    
    // Fetch video ONCE and clone for both storages
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      console.warn('Failed to fetch video for caching:', url);
      return false;
    }
    
    // Clone response for Cache API (stores the full Response object)
    const cacheClone = response.clone();
    
    // Clone again for IndexedDB blob conversion
    const idbBlob = await response.blob();
    
    // Store in both caches in parallel
    const cachePromise = cacheVideoToCacheAPI(url);
    const idbPromise = storeVideoInDB(url, idbBlob, {
      cachedAt: new Date().toISOString(),
      size: idbBlob.size,
      mimeType: idbBlob.type
    });
    
    // Also store the Response in Cache API properly
    const cachePutPromise = (async () => {
      try {
        const cache = await openVideoCache();
        await cache.put(url, cacheClone);
      } catch (e) {
        console.warn('Failed to put in Cache API:', e);
      }
    })();
    
    await Promise.allSettled([cachePromise, idbPromise, cachePutPromise]);
    
    console.log('Video cached:', url);
    return true;
  } catch (error) {
    console.warn('Video caching failed:', url, error);
    return false;
  }
}

/**
 * Smart cache video with bandwidth consideration
 */
export async function smartCacheVideo(url, options = {}) {
  if (!url) return false;
  
  const {
    onlyCacheOnWifi = false,
    maxSizeMB = 10
  } = options;
  
  // Skip if only on wifi and not on wifi
  if (onlyCacheOnWifi) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection && !connection.saveData && connection.type !== 'wifi') {
      return false;
    }
  }
  
  return cacheVideo(url, options);
}

/**
 * Remove video from all caches
 */
export async function removeVideo(url) {
  if (!url) return false;
  
  const cachePromise = removeVideoFromCache(url);
  const idbPromise = removeVideoFromDB(url);
  
  await Promise.allSettled([cachePromise, idbPromise]);
  return true;
}

/**
 * Remove video from Cache API
 */
export async function removeVideoFromCache(url) {
  if (!('caches' in window)) return false;
  
  try {
    const cache = await openVideoCache();
    await cache.delete(url);
    return true;
  } catch (error) {
    console.warn('Failed to remove from cache:', error);
    return false;
  }
}

/**
 * Clear all cached videos
 */
export async function clearAllVideos() {
  await Promise.allSettled([
    clearVideoCache(),
    clearAllCachedVideos()
  ]);
  console.log('All video caches cleared');
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  const [cacheSize, idbSize, cacheAPIKeys, idbVideos] = await Promise.all([
    getCacheSize(),
    getTotalCacheSize(),
    getAllCacheKeys(),
    getAllCachedVideos()
  ]);
  
  return {
    cacheAPI: {
      size: cacheSize,
      count: cacheAPIKeys.length
    },
    indexedDB: {
      size: idbSize,
      count: idbVideos.length
    },
    total: {
      size: cacheSize + idbSize,
      count: cacheAPIKeys.length + idbVideos.length
    }
  };
}

/**
 * Get all keys from Cache API
 */
async function getAllCacheKeys() {
  if (!('caches' in window)) return [];
  
  try {
    const cache = await openVideoCache();
    return await cache.keys();
  } catch (error) {
    return [];
  }
}

/**
 * Precache upcoming reels
 */
export async function precacheReels(reels, options = {}) {
  const {
    startIndex = 0,
    count = 3,
    wifiOnly = false,
    maxCacheSizeMB = 50
  } = options;
  
  // Check network conditions
  if (wifiOnly) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection && connection.type !== 'wifi' && !connection.saveData) {
      console.log('Skipping precache - not on WiFi');
      return;
    }
  }
  
  // Check cache size
  const stats = await getCacheStats();
  if (stats.total.size > maxCacheSizeMB * 1024 * 1024) {
    await cleanupOldVideos(maxCacheSizeMB);
  }
  
  // Get videos to cache - using for loop to handle await properly
  const upcomingReels = reels.slice(startIndex, startIndex + count);
  const videosToCache = [];
  
  for (const reel of upcomingReels) {
    const url = reel?.videoUrl || reel?.media?.[0]?.uri;
    if (url && typeof url === 'string') {
      const isCached = await isVideoAvailable(url);
      if (!isCached) {
        videosToCache.push(url);
      }
    }
  }
  
  if (videosToCache.length === 0) {
    console.log('No videos to cache');
    return;
  }
  
  console.log(`Precaching ${videosToCache.length} videos...`);
  
  // Cache in background
  const cachePromises = videosToCache.map(url => 
    smartCacheVideo(url, { onlyCacheOnWifi: wifiOnly })
  );
  
  await Promise.allSettled(cachePromises);
  console.log('Precaching complete');
}

/**
 * Get video blob for advanced usage
 */
export async function getVideoBlob(url) {
  // Try Cache API first
  const cacheResponse = await getCachedVideo(url);
  if (cacheResponse) {
    return await cacheResponse.blob();
  }
  
  // Try IndexedDB
  const idbData = await getVideoFromDB(url);
  if (idbData) {
    return idbData.blob;
  }
  
  return null;
}

