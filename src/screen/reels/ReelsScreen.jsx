import { useState, useRef, useCallback, useEffect, memo } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./ReelsScreen.css";
import { useAppTheme } from "../../theme";
import {
  IoHeart,
  IoHeartOutline,
  IoChatbubbleOutline,
  IoShareSocialOutline,
  IoBookmarkOutline,
  IoBookmark,
  IoEllipsisHorizontal,
  IoPlay,
  IoVolumeMute,
  IoVolumeHigh,
  IoMic,
  IoText,
  IoClose,
  IoDownloadOutline,
  IoFlagOutline,
  IoInformationCircleOutline,
  IoCheckmark,
  IoWifi,
  IoCellular,
  IoCloudOffline,
  IoAlertCircleOutline,
} from "react-icons/io5";
import {
  VIDEO_QUALITIES,
  selectOptimalQuality,
} from "../../utils/adaptiveBitrate";
import { getCurrentUser } from "../../lib/Auth";
import { listReels, likeReel, mapReelDocument } from "../../lib/reelsApi";
import { listUsersByIds } from "../../lib/usersApi";
import { upsertUser } from "../../store/slices/usersSlice";
import client, {
  APPWRITE_DATABASE_ID,
  COLLECTION_REELS_ID,
} from "../../lib/Appwrite";

// Video caching imports
import {
  cacheVideo,
  getCachedVideoUrl,
  isVideoAvailable,
  precacheReels,
  getCacheStats,
  clearAllVideos
} from "../../utils/videoCacheManager";

const DOUBLE_TAP_DELAY = 320;

// Helper function to normalize likes (simplified for frontend)
const normalizeLikes = (likes) => {
  if (!Array.isArray(likes)) return [];
  return likes;
};

// Fisher-Yates shuffle algorithm for randomizing arrays
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Action Button Component for Right Rail
function ActionButton({ icon, iconColor, label, onPress, isActive, labelColor }) {
  return (
    <button
      className={`reel-action-button ${isActive ? "liked" : ""}`}
      onClick={onPress}
      aria-label={label || "Action button"}
    >
      {icon}
      {label && <span className="reel-action-label" style={{ color: labelColor }}>{label}</span>}
    </button>
  );
}

// Utility Button Component for Left Rail
function UtilityButton({ icon, label, onPress, isActive, showPulse}) {
  return (
    <button
      className={`reel-utility-button ${isActive ? "active" : ""} ${showPulse ? "reel-mic-button" : ""}`}
      onClick={onPress}
      aria-label={label}
    >
      {showPulse && <div className="reel-mic-pulse" />}
      {icon}
      {label && <span className="reel-utility-label">{label}</span>}
    </button>
  );
}

// Circular Progress Component
function CircularProgress({ progress }) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    setDisplayProgress(progress * 100);
  }, [progress]);

  return (
    <div className="reel-circular-progress">
      <div className="reel-circular-ring" />
      <div
        className="reel-circular-ring animated"
        style={{
          transform: `rotate(${displayProgress * 3.6}deg)`,
          borderRightColor:
            displayProgress > 50 ? "var(--colors-peach)" : "transparent",
          borderBottomColor:
            displayProgress > 50 ? "var(--colors-peach)" : "transparent",
        }}
      />
      <span className="reel-progress-text">{Math.round(displayProgress)}%</span>
    </div>
  );
}

// Individual Reel Card Component
function ReelCard({
  reel,
  isActive,
  onToggleLike,
  authUserId,
  voiceActive,
  onVoiceToggle,
  theme,
}) {
  const videoRef = useRef(null);
  const lastTapRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay to work
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(1);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false); // Track if video has successfully loaded at least once
  const [cachedVideoUrl, setCachedVideoUrl] = useState(null); // Cached video URL
  const previousBlobUrlRef = useRef(null); // Track previous blob URL for cleanup

  // Reset error state when reel changes
  useEffect(() => {
    // Revoke previous blob URL to prevent memory leaks
    if (previousBlobUrlRef.current) {
      URL.revokeObjectURL(previousBlobUrlRef.current);
      previousBlobUrlRef.current = null;
    }
    
    setHasError(false);
    setIsBuffering(false);
    setHasLoaded(false);
    setVideoProgress(0);
    setCachedVideoUrl(null);
  }, [reel?.id]);

  // Initialize like state from reel data
  useEffect(() => {
    if (reel?.likes) {
      const normalized = normalizeLikes(reel.likes);
      setLikeCount(normalized.length);
      // Check if current user has liked this reel
      // In a real implementation, you'd decode the like token
      setLiked(normalized.includes(authUserId));
    }
  }, [reel?.likes, authUserId]);

  // Handle video playback based on active state
  useEffect(() => {
    if (videoRef.current) {
      if (isActive && !isPaused) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive, isPaused]);

  // Handle mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Track video progress
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const progress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
      setVideoDuration(videoRef.current.duration);
    }
  }, []);

  // Handle video ended - loop
  const handleVideoEnded = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // Handle buffering
  const handleWaiting = useCallback(() => {
    setIsBuffering(true);
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsBuffering(false);
  }, []);

  // Double tap to like
  const handleVideoPress = useCallback(
    (event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const now = Date.now();
      if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
        // Double tap - show heart animation and like
        setHeartPosition({ x, y });
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 1000);

        if (!liked) {
          setLiked(true);
          setLikeCount((prev) => prev + 1);
          onToggleLike?.();
        }
      }
      lastTapRef.current = now;
    },
    [liked, onToggleLike],
  );

  // Single tap to pause/play
  const handleSingleTap = useCallback((event) => {
    const now = Date.now();
    if (now - lastTapRef.current >= DOUBLE_TAP_DELAY) {
      setIsPaused((prev) => !prev);
    }
  }, []);

  const handleDoubleTap = useCallback((event) => {
    event.stopPropagation();
  }, []);

  // Toggle like
  const handleLikePress = useCallback(() => {
    setLiked((prev) => {
      setLikeCount((count) => count + (prev ? -1 : 1));
      return !prev;
    });
    onToggleLike?.();
  }, [liked, onToggleLike]);

  // Toggle bookmark
  const handleBookmarkPress = useCallback(() => {
    setBookmarked((prev) => !prev);
  }, []);

  // Toggle share
  const handleSharePress = useCallback(async () => {
    if (!reel?.id) return;
    
    const shareUrl = `${window.location.origin}/p/${reel.id}`;
    const shareText = reel?.caption 
      ? `Check out this reel on Auri 🌿\n\n${reel.caption}\n\n${shareUrl}`
      : `Check out this reel on Auri 🌿\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Reel on Auri",
          text: shareText,
          url: shareUrl,
        });
      } catch (shareError) {
        // User cancelled or error - fallback to copy
        navigator.clipboard.writeText(shareUrl);
      }
    } else {
      // Fallback for browsers without Web Share API
      navigator.clipboard.writeText(shareUrl);
    }
  }, [reel?.id, reel?.caption]);

  // Toggle caption visibility
  const toggleCaption = useCallback(() => {
    setCaptionExpanded((prev) => !prev);
  }, []);

  // Display caption logic
  const displayCaption = reel.caption || "Enjoy the latest reel on Auri.";
  const shouldTruncate = displayCaption.length > 50;
  const truncatedCaption =
    shouldTruncate && !captionExpanded
      ? displayCaption.substring(0, 50) + "..."
      : displayCaption;

  // Handle video error
  const handleError = useCallback(() => {
    setHasError(true);
    setIsBuffering(false);
  }, []);

  // Retry loading video
  const handleRetry = useCallback(() => {
    setHasError(false);
    setVideoProgress(0);
  }, []);

  // Get author info from reel or use defaults
  const authorName = reel?.author?.name || reel?.authorName || "Auri Friend";
  const authorAvatar = reel?.author?.avatarUri || reel?.authorAvatar || null;
  const videoUrl = reel?.videoUrl || reel?.media?.[0]?.uri || "";

  // Fetch cached video URL when reel changes
  useEffect(() => {
    const fetchCachedUrl = async () => {
      if (videoUrl) {
        const cachedUrl = await getCachedVideoUrl(videoUrl);
        if (cachedUrl) {
          // Revoke previous blob URL before setting new one
          if (previousBlobUrlRef.current) {
            URL.revokeObjectURL(previousBlobUrlRef.current);
          }
          // Store new blob URL for future cleanup
          previousBlobUrlRef.current = cachedUrl;
          setCachedVideoUrl(cachedUrl);
        } else {
          setCachedVideoUrl(null);
        }
      }
    };
    fetchCachedUrl();
  }, [videoUrl]);

  // Use cached URL if available, otherwise use original
  const displayVideoUrl = cachedVideoUrl || videoUrl;

  return (
    <div className="reel-page" data-reel-id={reel?.id}>
      {/* Video Element */}
      {!hasError && videoUrl ? (
        <div className="reel-video-wrapper" onClick={handleSingleTap}>
          <video
            ref={videoRef}
            className="reel-video"
            src={displayVideoUrl}
            loop
            playsInline
            muted
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            onWaiting={handleWaiting}
            onCanPlay={handleCanPlay}
            onError={handleError}
            onClick={handleVideoPress}
            onDoubleClick={handleDoubleTap}
            tabIndex={0}
            aria-label={`Video by ${authorName}`}
          />

          {/* Paused Indicator */}
          {isPaused && (
            <div
              className="reel-paused-indicator"
              onClick={() => setIsPaused(false)}
            >
              <IoPlay />
            </div>
          )}
        </div>
      ) : (
        <p>Enjoy Your Time On Auri</p>
        /* Fallback when video fails
        <div className="reel-video-fallback">
          <div className="reel-fallback-content">
            <IoAlertCircleOutline />
            <p className="reel-fallback-text">Video Unavailable</p>
            <p className="reel-fallback-subtext">
              Try refreshing or check your connection
            </p>
            <button className="reel-fallback-retry" onClick={handleRetry}>
              <span className="reel-fallback-retry-text">Retry</span>
            </button>
          </div>
        </div>*/
      )}

      {/* Buffering Overlay */}
      {isBuffering && (
        <div className="reel-buffering-overlay">
          <div className="reel-spinner" />
        </div>
      )}

      {/* Top Status Bar 
      <div className="reel-top-status">
        <div className="reel-status-indicator">
          <div 
            className="reel-status-dot" 
            style={{ backgroundColor: isActive ? 'var(--colors-peach)' : '#666' }} 
          />
        </div>
        <div className="reel-network-indicator">
          <IoWifi />
        </div>
      </div>*/}

      {/* Progress Bar 
      <div className="reel-progress-bar">
        <div 
          className="reel-progress-fill" 
          style={{ width: `${videoProgress}%` }} 
        />
      </div>*/}

      {/* Heart Animation on Double Tap */}
      {showHeart && (
        <div
          className="reel-heart-animation"
          style={{
            left: `${heartPosition.x - 40}px`,
            top: `${heartPosition.y - 40}px`,
          }}
        >
          <IoHeart />
        </div>
      )}

      {/* ===== LEFT RAIL - Utilities (Bottom) ===== */}
      <div className="reel-left-rail">
        <div className="reel-utility-container reel-left-rail-text" style={{ '--theme-text': theme.text }}>
          {/* Microphone - Voice Activation */}
          <UtilityButton
            icon={<IoMic style={{ color: voiceActive ? "var(--colors-peach)" : theme.text }} />}
            label="Voice"
            onPress={onVoiceToggle}
            isActive={voiceActive}
            showPulse={voiceActive}
          />

          {/* Sound Toggle */}
          <UtilityButton
            icon={isMuted ? <IoVolumeMute style={{ color: theme.text }} /> : <IoVolumeHigh style={{ color: theme.text }} />}
            label={isMuted ? "Off" : "On"}
            onPress={() => setIsMuted((prev) => !prev)}
            isActive={isMuted}
            style={{ color: theme.text}}
          />
        </div>
      </div>

      {/* ===== RIGHT RAIL - Action Buttons ===== */}
      <div className="reel-right-rail">
        <div className="reel-glass-container reel-right-rail-text" style={{ '--theme-text': theme.text }}>
          {/* Like Button */}
          <ActionButton
            icon={<IoHeart style={{ color: liked ? "var(--colors-peach)" : theme.text }} />}
            iconColor={liked ? "var(--colors-peach)" : theme.text}
            label={likeCount > 0 ? String(likeCount) : ""}
            onPress={handleLikePress}
            isActive={liked}
            labelColor={theme.text}
          />

          {/* Comment Button */}
          <ActionButton
            icon={<IoChatbubbleOutline style={{ color: theme.text }} />}
            iconColor={theme.text}
            label={reel.commentCount > 0 ? String(reel.commentCount) : ""}
            onPress={() => {}}
            labelColor={theme.text}
          />

          {/* Share Button */}
          <ActionButton
            icon={<IoShareSocialOutline style={{ color: theme.text }} />}
            iconColor={theme.text}
            onPress={handleSharePress}
          />

          {/* Bookmark Button */}
          <ActionButton
            icon={<IoBookmark style={{ color: bookmarked ? "var(--colors-peach)" : theme.text }} />}
            iconColor={bookmarked ? "var(--colors-peach)" : theme.text}
            onPress={handleBookmarkPress}
            isActive={bookmarked}
          />

          {/* More Menu Button */}
          <ActionButton
            icon={<IoEllipsisHorizontal style={{ color: theme.text }} />}
            iconColor={theme.text}
            onPress={() => setShowMoreMenu(true)}
          />

          {/* Circular Progress */}
          <CircularProgress progress={videoProgress / 100} />
        </div>
      </div>

      {/* ===== BOTTOM OVERLAY ===== */}
      <div className="reel-bottom-overlay">
        {/* User Info */}
        <div className="reel-user-row">
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorName} className="reel-avatar" />
          ) : (
            <div className="reel-avatar-placeholder" />
          )}
          <span className="reel-username" style={{ color: theme.text }}>{authorName || "Auri Friend"}</span>
          {reel?.userId !== authUserId && (
            <button className="reel-follow-btn">
              <span className="reel-follow-txt" style={{ color: theme.text }}>Follow</span>
            </button>
          )}
        </div>

        {/* Caption */}
        <div className="reel-caption-container">
          <p className="reel-caption" style={{ color: theme.text }} onClick={toggleCaption}>
            {truncatedCaption}
            {shouldTruncate && (
              <span className="reel-caption-more">
                {captionExpanded ? " less" : " more"}
              </span>
            )}
          </p>
        </div>

        {/* Audio Row */}
        <div className="reel-audio-row">
          <button
            className="reel-mute-button"
            onClick={() => setIsMuted((prev) => !prev)}
          >
            {isMuted ? <IoVolumeMute style={{ color: theme.text }} /> : <IoVolumeHigh style={{ color: theme.text }} />}
          </button>

          {/* Sound Wave Animation - only when not muted and active */}
          {!isMuted && isActive && !isPaused && (
            <div className="reel-sound-wave">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="reel-wave-bar"
                  style={{
                    height: `${12 + Math.sin(i * 0.5) * 8}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}

          <span className="reel-audio-name" style={{ color: theme.text }}>
            {reel?.audio || "Original Audio"}
          </span>
        </div>
      </div>

      {/* More Menu Modal */}
      {showMoreMenu && (
        <div
          className="reel-modal-overlay"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="reel-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="reel-modal-option"
              onClick={() => setShowMoreMenu(false)}
            >
              <IoDownloadOutline />
              <span className="reel-modal-option-text">Download</span>
            </button>

            <button
              className="reel-modal-option"
              onClick={() => setShowMoreMenu(false)}
            >
              <IoFlagOutline />
              <span className="reel-modal-option-text">Report</span>
            </button>

            <button
              className="reel-modal-option"
              onClick={() => setShowMoreMenu(false)}
            >
              <IoInformationCircleOutline />
              <span className="reel-modal-option-text">More</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Memoized ReelCard to prevent unnecessary re-renders
const MemoizedReelCard = memo(ReelCard, (prevProps, nextProps) => {
  return (
    prevProps.reel?.id === nextProps.reel?.id &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.authUserId === nextProps.authUserId &&
    prevProps.voiceActive === nextProps.voiceActive
  );
});

// Helper function to speak text aloud
const speakText = (text) => {
  if ("speechSynthesis" in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.2;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }
};

// Helper function to check if command matches navigation keywords
const isNextCommand = (command) => {
  const nextKeywords = ["next", "n", "forward", "skip", "down", "d"];
  const cmd = command.toLowerCase().trim();

  // Check if any keyword is contained in the command
  for (const keyword of nextKeywords) {
    if (cmd.includes(keyword)) return true;
  }
  return false;
};

const isPreviousCommand = (command) => {
  const prevKeywords = ["previous", "p", "back", "before", "up", "u"];
  const cmd = command.toLowerCase().trim();

  // Check if any keyword is contained in the command
  for (const keyword of prevKeywords) {
    if (cmd.includes(keyword)) return true;
  }
  return false;
};

// Helper to merge reels with new data
const mergeReels = (previous, incoming) => {
  const map = new Map(previous.map((item) => [item.id, item]));
  incoming.forEach((reel) => {
    if (!reel?.id) return;
    const existing = map.get(reel.id) ?? {};
    const likes = normalizeLikes(
      Array.isArray(reel.likes) ? reel.likes : existing.likes,
    );
    const commentCount =
      typeof reel.commentCount === "number"
        ? reel.commentCount
        : typeof existing.commentCount === "number"
          ? existing.commentCount
          : Array.isArray(reel.comments)
            ? reel.comments.length
            : Array.isArray(existing.comments)
              ? existing.comments.length
              : 0;

    map.set(reel.id, {
      ...existing,
      ...reel,
      likes,
      commentCount,
    });
  });

  return Array.from(map.values());
};

// Hydrate authors for reels
const hydrateAuthors = async (reels, usersById, dispatch) => {
  const userIds = Array.from(
    new Set(
      reels
        .map((doc) => doc?.userId)
        .filter((value) => typeof value === "string" && value.length),
    ),
  ).filter((id) => !usersById[id]);

  if (!userIds.length) {
    return {};
  }

  try {
    const fetched = await listUsersByIds(userIds);
    fetched.forEach((user) => {
      if (user?.id) {
        dispatch(
          upsertUser({
            id: user.id,
            name: user.name ?? user.displayName ?? user.email ?? "Auri Friend",
            email: user.email,
            avatarUri: user.avatarUri,
            bio: user.bio,
            location: user.location ?? user.city,
            status: user.status,
            interests: Array.isArray(user.interests) ? user.interests : [],
            followers: Array.isArray(user.followers) ? user.followers : [],
            following: Array.isArray(user.following) ? user.following : [],
            age: user.age,
          }),
        );
      }
    });

    return fetched.reduce((acc, user) => {
      if (user?.id) {
        acc[user.id] = user;
      }
      return acc;
    }, {});
  } catch (error) {
    console.warn("Unable to preload reel authors", error);
    return {};
  }
};

// Main ReelsScreen Component
export default function ReelsScreen() {
  const dispatch = useDispatch();
  const { userId: authUserId } = useSelector((state) => state.auth);
  const { byId: usersById } = useSelector((state) => state.users);
  const theme = useAppTheme();

  const [reels, setReels] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState("");
  const [showToast, setShowToast] = useState(false);
  const scrollContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const lastVoiceCommandRef = useRef(0);
  const currentReelIndexRef = useRef(0);

  // Update ref whenever activeIndex changes
  useEffect(() => {
    currentReelIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Initialize user on mount
  useEffect(() => {
    const initUser = async () => {
      try {
        const appwriteUser = await getCurrentUser();
        if (appwriteUser?.$id && !usersById[appwriteUser.$id]) {
          dispatch(
            upsertUser({
              id: appwriteUser.$id,
              name: appwriteUser.name ?? "Auri Friend",
              email: appwriteUser.email,
              avatarUri: appwriteUser.avatarUri ?? null,
              bio: appwriteUser.bio,
              location: appwriteUser.location ?? appwriteUser.city,
              status: appwriteUser.status,
              interests: Array.isArray(appwriteUser.interests)
                ? appwriteUser.interests
                : [],
              followers: Array.isArray(appwriteUser.followers)
                ? appwriteUser.followers
                : [],
              following: Array.isArray(appwriteUser.following)
                ? appwriteUser.following
                : [],
              age: appwriteUser.age,
            }),
          );
        }
      } catch (err) {
        console.warn("initUser error:", err);
      }
    };

    initUser();
  }, [dispatch, usersById]);

  // Load reels from backend
  const loadReels = useCallback(async () => {
    try {
      setLoading(true);
      const documents = await listReels();
      // Shuffle the reels for random order
      const shuffledDocuments = shuffleArray(documents);
      const authorMap = await hydrateAuthors(shuffledDocuments, usersById, dispatch);

      const withAuthors = shuffledDocuments.map((reel) => ({
        ...reel,
        author:
          reel.author ??
          authorMap[reel.userId] ??
          usersById[reel.userId] ??
          null,
      }));

      setReels((prev) => mergeReels(prev, withAuthors));
    } catch (error) {
      console.error("Unable to load reels", error);
      setReels([]);
    } finally {
      setLoading(false);
    }
  }, [dispatch, usersById]);

  // Load reels on mount
  useEffect(() => {
    loadReels();
  }, [loadReels]);

  // Real-time subscription for new reels
  useEffect(() => {
    const subscription = client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${COLLECTION_REELS_ID}.documents`,
      async (event) => {
        const { payload } = event;
        if (!payload) return;

        const mapped = mapReelDocument({ ...payload, id: payload.$id });
        const authors = await hydrateAuthors([mapped], usersById, dispatch);
        const enriched = {
          ...mapped,
          author: authors[mapped.userId] ?? usersById[mapped.userId] ?? null,
        };

        setReels((prev) => mergeReels(prev, [enriched]));
      },
    );

    return () => {
      subscription();
    };
  }, [dispatch, usersById]);

  // Handle scroll to detect active video
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const scrollTop = scrollContainerRef.current.scrollTop;
      const windowHeight = window.innerHeight;
      const index = Math.floor((scrollTop + windowHeight * 0.5) / windowHeight);
      setActiveIndex(Math.max(0, Math.min(index, reels.length - 1)));
    }
  }, [reels.length]);

  // Scroll to specific reel by index
  const scrollToReel = useCallback(
    (index) => {
      if (scrollContainerRef.current && reels[index]) {
        const containerHeight = scrollContainerRef.current.offsetHeight;
        scrollContainerRef.current.scrollTo({
          top: index * containerHeight,
          behavior: "smooth",
        });
      }
    },
    [reels],
  );

  // Show toast notification
  const showToastNotification = useCallback((message) => {
    setVoiceCommand(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, []);

  // Handle voice commands for scrolling
  const handleVoiceCommand = useCallback(
    (transcript, confidence = 0) => {
      const now = Date.now();
      if (now - lastVoiceCommandRef.current < 300) return;
      lastVoiceCommandRef.current = now;

      // Clean and validate the transcript
      const command = (transcript || "").toLowerCase().trim();

      // Ignore empty or too short transcripts
      if (!command || command.length < 1) {
        console.log("Ignoring empty transcript");
        return;
      }

      // Accept results with valid confidence (>= 0.3) OR if confidence is 0/undefined
      // (some browsers return 0 for confidence even when recognition is accurate)
      const isLowConfidence = confidence > 0 && confidence < 0.3;
      if (isLowConfidence) {
        console.log("Ignoring low confidence transcript:", confidence);
        return;
      }

      console.log("Voice command:", command, "confidence:", confidence);

      // Use ref for current index to avoid stale closure
      const currentIndex = currentReelIndexRef.current;

      if (isNextCommand(command)) {
        const newIndex = Math.min(reels.length - 1, currentIndex + 1);
        console.log("Going to next reel:", currentIndex, "->", newIndex);
        scrollToReel(newIndex);
        showToastNotification("Next");
      } else if (isPreviousCommand(command)) {
        const newIndex = Math.max(0, currentIndex - 1);
        console.log("Going to previous reel:", currentIndex, "->", newIndex);
        scrollToReel(newIndex);
        showToastNotification("Previous");
      } else {
        // Unrecognized command - speak feedback only if it seems like an actual command
        console.log("Unrecognized command:", command);
        showToastNotification("Unrecognized");
        speakText("Haha thats not my commands");
      }
    },
    [reels.length, scrollToReel, showToastNotification],
  );

  // Start voice recognition
  const startVoiceRecognition = useCallback(() => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert(
        "Voice recognition is not supported in this browser. Please use Chrome or Edge.",
      );
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      // Get the final result only (not interim)
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const transcript = result[0].transcript.trim();
          const confidence = result[0].confidence;

          console.log(
            "Voice result (final):",
            transcript,
            "confidence:",
            confidence,
          );

          if (transcript) {
            handleVoiceCommand(transcript, confidence);
          }
        } else {
          // Log interim results for debugging
          console.log(
            "Voice result (interim):",
            event.results[i][0].transcript,
          );
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      // Restart if still supposed to be listening
      if (recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch (e) {
          console.log("Recognition already started");
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  }, [handleVoiceCommand]);

  // Stop voice recognition
  const stopVoiceRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  // Toggle voice mode - triggers when button is pressed
  const handleVoiceToggle = useCallback(() => {
    const newState = !voiceActive;
    setVoiceActive(newState);
    if (newState) {
      startVoiceRecognition();
    } else {
      stopVoiceRecognition();
    }
  }, [voiceActive, startVoiceRecognition, stopVoiceRecognition]);

  // Handle toggle like for a specific reel
  const handleToggleLike = useCallback(
    async (reelId) => {
      if (!authUserId || !reelId) return;

      try {
        await likeReel({
          reelId,
          userId: authUserId,
          currentLikes: [],
          ownerId: null,
        });
      } catch (error) {
        console.error("Unable to toggle like", error);
      }
    },
    [authUserId],
  );

  // Initial load effect
  useEffect(() => {
    // Auto-scroll to first reel and start playing
    if (scrollContainerRef.current && reels.length > 0) {
      scrollContainerRef.current.scrollTop = 0;
    }

    // Cleanup on unmount
    return () => {
      stopVoiceRecognition();
    };
  }, [reels, stopVoiceRecognition]);

  // Get author info for a reel
  const getReelAuthor = useCallback(
    (reel) => {
      if (!reel?.userId) {
        return { name: "Auri Friend", avatarUri: null };
      }

      if (reel.author) {
        return reel.author;
      }

      if (usersById[reel.userId]) {
        return usersById[reel.userId];
      }

      return {
        id: reel.userId,
        name: "Auri Friend",
        avatarUri: null,
      };
    },
    [usersById],
  );

  // ===== VIDEO CACHING =====
  
  // Cache videos after reels load
  useEffect(() => {
    if (reels.length > 0) {
      console.log('Starting video caching for reels...');
      
      // Cache videos in background
      reels.forEach((reel) => {
        const videoUrl = reel?.videoUrl || reel?.media?.[0]?.uri;
        if (videoUrl) {
          // Cache without blocking - runs in background
          cacheVideo(videoUrl, { skipIfCached: true }).catch(() => {});
        }
      });
    }
  }, [reels]);

  // Precache upcoming videos when active index changes
  useEffect(() => {
    if (reels.length > 0) {
      const upcomingReels = reels.slice(activeIndex, activeIndex + 3);
      precacheReels(upcomingReels, {
        startIndex: 0,
        count: 3,
        wifiOnly: true,
        maxCacheSizeMB: 50
      }).catch(() => {});
    }
  }, [activeIndex, reels]);

  // Log cache stats periodically
  useEffect(() => {
    const logStats = async () => {
      try {
        const stats = await getCacheStats();
        console.log('Video cache stats:', {
          cacheAPI: `${(stats.cacheAPI.size / 1024 / 1024).toFixed(2)}MB (${stats.cacheAPI.count} videos)`,
          indexedDB: `${(stats.indexedDB.size / 1024 / 1024).toFixed(2)}MB (${stats.indexedDB.count} videos)`
        });
      } catch (e) {
        // Ignore
      }
    };
    
    const interval = setInterval(logStats, 60000); // Log every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="reels-container" style={{ backgroundColor: theme.background }}>
      {/* Loading Overlay */}
      {loading && reels.length === 0 && (
        <div className="reels-loader">
          <div className="reel-spinner" />
        </div>
      )}

      {/* Voice Command Toast Notification */}
      {showToast && (
        <div className="reel-voice-toast">
          <span className="reel-voice-toast-text">{voiceCommand}</span>
        </div>
      )}

      {/* Scrollable Reels Container */}
      <div
        ref={scrollContainerRef}
        className="reels-scroll-container"
        onScroll={handleScroll}
      >
        {reels.length > 0
          ? reels.map((reel, index) => (
              <MemoizedReelCard
                key={reel.id}
                reel={reel}
                isActive={index === activeIndex}
                onToggleLike={() => handleToggleLike(reel.id)}
                voiceActive={voiceActive}
                onVoiceToggle={handleVoiceToggle}
                authUserId={authUserId}
                theme={theme}
              />
            ))
          : !loading && (
              <div className="reels-empty" style={{ color: theme.text }}>
                <p>No reels available</p>
              </div>
            )}
      </div>
    </div>
  );
}
