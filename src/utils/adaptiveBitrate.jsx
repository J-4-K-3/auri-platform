/**
 * Adaptive Bitrate Streaming Utility
 * Selects optimal video quality based on network conditions and device capabilities
 */

/**
 * Video quality definitions
 * Represents different encoding profiles available on the server
 */
export const VIDEO_QUALITIES = {
  ULTRA_LOW: { label: '240p', bitrate: 300, mbps: 0.3, quality: 'ultraLow' },
  LOW: { label: '360p', bitrate: 600, mbps: 0.6, quality: 'low' },
  MEDIUM: { label: '720p', bitrate: 1500, mbps: 1.5, quality: 'medium' },
  HIGH: { label: '1080p', bitrate: 3000, mbps: 3.0, quality: 'high' },
  ULTRA_HIGH: { label: '4K', bitrate: 6000, mbps: 6.0, quality: 'ultraHigh' },
};

/**
 * Network type strength mapping
 * Used to determine available bitrates for current connection
 */
const NETWORK_STRENGTH_MAP = {
  'none': { strength: 0, maxMbps: 0 },
  'unknown': { strength: 1, maxMbps: 0.5 },
  'cellular': { strength: 2, maxMbps: 2.5 }, // 4G LTE typical
  'wifi': { strength: 3, maxMbps: 25 }, // WiFi typical
  'ethernet': { strength: 4, maxMbps: 100 }, // Wired typical
};

/**
 * WiFi signal strength levels (rssi-based)
 * Signal strength determines quality within WiFi networks
 */
const WIFI_STRENGTH_LEVELS = {
  EXCELLENT: { min: -50, max: -1, strength: 4, label: 'Excellent' },
  GOOD: { min: -70, max: -50, strength: 3, label: 'Good' },
  FAIR: { min: -85, max: -70, strength: 2, label: 'Fair' },
  WEAK: { min: -100, max: -85, strength: 1, label: 'Weak' },
  VERY_WEAK: { min: -120, max: -100, strength: 0, label: 'Very Weak' },
};

/**
 * Determine WiFi signal strength level from RSSI
 */
export const getWiFiStrengthLevel = (rssi) => {
  if (rssi >= WIFI_STRENGTH_LEVELS.EXCELLENT.min) return WIFI_STRENGTH_LEVELS.EXCELLENT;
  if (rssi >= WIFI_STRENGTH_LEVELS.GOOD.min) return WIFI_STRENGTH_LEVELS.GOOD;
  if (rssi >= WIFI_STRENGTH_LEVELS.FAIR.min) return WIFI_STRENGTH_LEVELS.FAIR;
  if (rssi >= WIFI_STRENGTH_LEVELS.WEAK.min) return WIFI_STRENGTH_LEVELS.WEAK;
  return WIFI_STRENGTH_LEVELS.VERY_WEAK;
};

/**
 * Select optimal video quality based on network state and battery status
 * @param {Object} networkState - NetInfo network state object
 * @param {boolean} isLowPowerMode - Whether device is in low power mode
 * @param {boolean} forceQuality - Force specific quality (optional)
 * @returns {Object} Selected quality profile
 */
export const selectOptimalQuality = (networkState, isLowPowerMode = false, forceQuality = null) => {
  // If quality is forced, return it
  if (forceQuality && VIDEO_QUALITIES[forceQuality]) {
    return VIDEO_QUALITIES[forceQuality];
  }

  // No connection - return ultra low
  if (!networkState || networkState.isConnected === false) {
    return VIDEO_QUALITIES.ULTRA_LOW;
  }

  // Low power mode - reduce quality
  if (isLowPowerMode) {
    return VIDEO_QUALITIES.LOW;
  }

  const networkType = networkState.type;
  const baseStrength = NETWORK_STRENGTH_MAP[networkType];

  if (!baseStrength) {
    return VIDEO_QUALITIES.MEDIUM; // Default fallback
  }

  let effectiveStrength = baseStrength.strength;
  let maxBitrate = baseStrength.maxMbps;

  // For WiFi, check signal strength
  if (networkType === 'wifi' && networkState.details) {
    const signalStrength = networkState.details.strength || networkState.details.rssi;
    if (signalStrength) {
      const wifiLevel = getWiFiStrengthLevel(signalStrength);
      effectiveStrength = wifiLevel.strength;
      // Adjust max bitrate based on WiFi signal strength
      maxBitrate = baseStrength.maxMbps * (effectiveStrength / 4);
    }
  }

  // Select quality based on available bitrate
  // Start from highest quality and work down
  if (maxBitrate >= VIDEO_QUALITIES.ULTRA_HIGH.mbps) {
    return VIDEO_QUALITIES.ULTRA_HIGH;
  }
  if (maxBitrate >= VIDEO_QUALITIES.HIGH.mbps) {
    return VIDEO_QUALITIES.HIGH;
  }
  if (maxBitrate >= VIDEO_QUALITIES.MEDIUM.mbps) {
    return VIDEO_QUALITIES.MEDIUM;
  }
  if (maxBitrate >= VIDEO_QUALITIES.LOW.mbps) {
    return VIDEO_QUALITIES.LOW;
  }
  return VIDEO_QUALITIES.ULTRA_LOW;
};

/**
 * Generate video URL for specific quality
 * Assumes video URI follows pattern: /path/to/video.mp4
 * Quality suffix appended: /path/to/video_360p.mp4 or /path/to/video_720p.mp4
 * 
 * @param {string} videoUri - Original video URI
 * @param {Object} quality - Quality object from VIDEO_QUALITIES
 * @returns {string} Quality-specific video URI
 */
export const getQualityVideoUri = (videoUri, quality) => {
  if (!videoUri || !quality) return videoUri;

  // If already has quality suffix, don't modify
  if (
    videoUri.includes('_240p') ||
    videoUri.includes('_360p') ||
    videoUri.includes('_720p') ||
    videoUri.includes('_1080p') ||
    videoUri.includes('_4k')
  ) {
    return videoUri;
  }

  // Split extension
  const lastDotIndex = videoUri.lastIndexOf('.');
  if (lastDotIndex === -1) return videoUri;

  const basePath = videoUri.substring(0, lastDotIndex);
  const extension = videoUri.substring(lastDotIndex);

  // Map quality to URL suffix
  const qualitySuffixes = {
    ultraLow: '_240p',
    low: '_360p',
    medium: '_720p',
    high: '_1080p',
    ultraHigh: '_4k',
  };

  const suffix = qualitySuffixes[quality.quality] || '';
  return `${basePath}${suffix}${extension}`;
};

/**
 * Calculate quality switch priority
 * Returns true if new quality is significantly better/worse to warrant switching
 * Prevents constant quality switching due to minor network fluctuations
 * 
 * @param {Object} currentQuality - Current quality profile
 * @param {Object} newQuality - New quality profile
 * @returns {boolean} Should switch quality
 */
export const shouldSwitchQuality = (currentQuality, newQuality) => {
  if (!currentQuality || !newQuality) return true;
  
  // Don't switch if qualities are the same
  if (currentQuality.quality === newQuality.quality) return false;

  // Always switch if going up by 2+ tiers (e.g., 360p → 1080p)
  const qualityOrder = ['ultraLow', 'low', 'medium', 'high', 'ultraHigh'];
  const currentIndex = qualityOrder.indexOf(currentQuality.quality);
  const newIndex = qualityOrder.indexOf(newQuality.quality);

  return Math.abs(currentIndex - newIndex) >= 2;
};

/**
 * Format quality info for display
 * @param {Object} quality - Quality profile
 * @returns {string} Formatted quality label
 */
export const formatQualityLabel = (quality) => {
  if (!quality) return 'Auto';
  return `${quality.label} (${quality.bitrate}kbps)`;
};

/**
 * Get recommended cache size for quality
 * Higher quality videos need more cache buffer
 * 
 * @param {Object} quality - Quality profile
 * @returns {number} Recommended cache size in seconds
 */
export const getRecommendedBufferSize = (quality) => {
  if (!quality) return 8;

  // Map bitrate to buffer time
  if (quality.bitrate <= 300) return 4; // Ultra low - minimal buffer
  if (quality.bitrate <= 600) return 6; // Low
  if (quality.bitrate <= 1500) return 8; // Medium
  if (quality.bitrate <= 3000) return 10; // High
  return 12; // Ultra high - need more buffer
};

/**
 * Monitor network changes and determine if quality adjustment is needed
 * Returns object with quality recommendation and reason
 * 
 * @param {Object} previousNetworkState - Previous network state
 * @param {Object} currentNetworkState - Current network state
 * @param {Object} currentQuality - Currently playing quality
 * @returns {Object} { shouldChange: boolean, newQuality: Object, reason: string }
 */
export const analyzeNetworkChange = (
  previousNetworkState,
  currentNetworkState,
  currentQuality
) => {
  const newQuality = selectOptimalQuality(currentNetworkState);

  // Check if network type changed significantly
  const typeChanged = previousNetworkState?.type !== currentNetworkState?.type;

  // Check if we should switch based on bitrate availability
  const shouldSwitch = shouldSwitchQuality(currentQuality, newQuality);

  let reason = 'Quality unchanged - stable network';
  if (typeChanged) {
    reason = `Network type changed: ${previousNetworkState?.type} → ${currentNetworkState?.type}`;
  }
  if (shouldSwitch) {
    reason = `Network quality changed: ${currentQuality?.label} → ${newQuality?.label}`;
  }

  return {
    shouldChange: typeChanged || shouldSwitch,
    newQuality,
    reason,
    typeChanged,
  };
};
