/**
 * Video Cache Utility using Cache API
 * Reduces bandwidth by caching Reels videos in browser
 */

const CACHE_NAME = 'auri-reels-cache-v1';
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB max cache

/**
 * Open or create the video cache
 */
export async function openVideoCache() {
  if ('caches' in window) {
    return await caches.open(CACHE_NAME);
  }
  return null;
}

/**
 * Get cached video response
 */
export async function getCachedVideo(url) {
  if (!('caches' in window)) return null;
  
  try {
    const cache = await openVideoCache();
    const response = await cache.match(url);
    return response || null;
  } catch (error) {
    console.warn('Video cache read error:', error);
    return null;
  }
}

/**
 * Cache a video URL
 */
export async function cacheVideo(url) {
  if (!('caches' in window)) return false;
  
  try {
    const cache = await openVideoCache();
    
    // Check if already cached
    const existingResponse = await cache.match(url);
    if (existingResponse) {
      console.log('Video already cached:', url);
      return true;
    }
    
    // Fetch and cache the video
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'same-origin'
    });
    
    if (response.ok) {
      await cache.put(url, response.clone());
      console.log('Video cached successfully:', url);
      
      // Clean up old caches if over limit
      await cleanupOldCaches();
      return true;
    }
  } catch (error) {
    console.warn('Video caching failed:', url, error);
  }
  return false;
}

/**
 * Check if video is cached
 */
export async function isVideoCached(url) {
  if (!('caches' in window)) return false;
  
  try {
    const cache = await openVideoCache();
    const response = await cache.match(url);
    return !!response;
  } catch (error) {
    return false;
  }
}

/**
 * Remove a video from cache
 */
export async function removeCachedVideo(url) {
  if (!('caches' in window)) return false;
  
  try {
    const cache = await openVideoCache();
    await cache.delete(url);
    console.log('Video removed from cache:', url);
    return true;
  } catch (error) {
    console.warn('Video cache removal failed:', error);
    return false;
  }
}

/**
 * Clear all cached videos
 */
export async function clearVideoCache() {
  if (!('caches' in window)) return;
  
  try {
    const cache = await openVideoCache();
    const keys = await cache.keys();
    
    for (const request of keys) {
      await cache.delete(request);
    }
    console.log('Video cache cleared');
  } catch (error) {
    console.warn('Failed to clear video cache:', error);
  }
}

/**
 * Get total cache size
 */
export async function getCacheSize() {
  if (!('caches' in window)) return 0;
  
  try {
    const cache = await openVideoCache();
    const keys = await cache.keys();
    let totalSize = 0;
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.clone().blob();
        totalSize += blob.size;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.warn('Cache size calculation failed:', error);
    return 0;
  }
}

/**
 * Cleanup old caches when over size limit
 */
async function cleanupOldCaches() {
  try {
    const currentSize = await getCacheSize();
    
    if (currentSize > MAX_CACHE_SIZE) {
      console.log('Cache size over limit, cleaning up...');
      const cache = await openVideoCache();
      const keys = await cache.keys();
      
      // Sort by date (oldest first) - this would require storing metadata
      // For now, just clear everything
      for (const request of keys) {
        await cache.delete(request);
      }
      console.log('Cache cleaned up');
    }
  } catch (error) {
    console.warn('Cache cleanup failed:', error);
  }
}

/**
 * Precache videos for upcoming reels
 */
export async function precacheUpcomingReels(reels, startIndex = 0, count = 3) {
  const videosToCache = reels
    .slice(startIndex, startIndex + count)
    .map(reel => reel?.videoUrl || reel?.media?.[0]?.uri)
    .filter(url => url && typeof url === 'string');
  
  const cachePromises = videosToCache.map(url => cacheVideo(url));
  
  await Promise.allSettled(cachePromises);
  console.log(`Precached ${cachePromises.length} upcoming videos`);
}

/**
 * Get cached URL for a video (returns cached URL or original)
 */
export async function getVideoUrl(url) {
  if (!url) return url;
  
  try {
    const cached = await getCachedVideo(url);
    if (cached) {
      return URL.createObjectURL(await cached.blob());
    }
  } catch (error) {
    // Fall back to original URL
  }
  
  return url;
}

