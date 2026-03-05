import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FiBell,
  FiSearch,
  FiShoppingBag,
  FiChevronRight,
  FiX,
  FiClock,
  FiAlertTriangle,
  FiLoader,
  FiArrowLeft,
  FiUserPlus,
  FiCheck,
  FiGift,
  FiMessageCircle,
  FiGrid,
  FiFilm,
  FiBookmark,
  FiUsers,
  FiPlay,
  FiZap,
  FiSmartphone,
  FiTool,
  FiEdit3,
  FiExternalLink,
  FiBellOff,
  FiCamera,
} from "react-icons/fi";
import { MdVerified } from "react-icons/md";
import { AiOutlineQrcode } from "react-icons/ai";
import {
  databases,
  storage,
  IDs,
  APPWRITE_DATABASE_ID,
  APPWRITE_BUCKET_ID,
  COLLECTION_POSTS_ID,
  COLLECTION_STORIES_ID,
  COLLECTION_REELS_ID,
  Permission,
  Role,
  appwriteConfig,
} from "../../lib/Appwrite";
import { StoryRing } from "../../components/StoryRing";
import { PostCard } from "../../components/PostCard";
import { SegmentedControl } from "../../components/SegmentedControl";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { Avatar } from "../../components/Avatar";
import { useAppTheme } from "../../theme";
import { spacing, colors, radii } from "../../theme/tokens";
import { timeAgo } from "../../utils/time";
import { guardNSFW } from "../../utils/Validators";
import { selectNotifications } from "../../store";
import { upsertUser } from "../../store/slices/usersSlice";
import { searchUsers, getUserById, followUser } from "../../lib/usersApi";
import { createNotification } from "../../lib/notificationsApi";
import {
  hydrateNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
} from "../../store/slices/notificationsSlice";
import {
  hydratePosts,
  createPostOptimistic,
  createPostSuccess,
  createPostFailure,
} from "../../store/slices/postsSlice";
import {
  listNotificationsForUser,
  markNotificationReadRemote,
  markNotificationsReadBulk,
} from "../../lib/notificationsApi";
import {
  PreferencesPopup,
  RewardVoucherPopup,
  BecomeSellerPopup,
  DigitalCategoryPopup,
} from "../../popup/ShopPopups";

// Mock users data
const DEFAULT_AVATAR =
  "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg";

// Helper function to group notifications by day
const groupByDay = (notifications) => {
  return notifications.reduce((acc, notification) => {
    const date = notification.createdAt
      ? new Date(notification.createdAt)
      : new Date();
    const key = date.toDateString();

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(notification);
    return acc;
  }, {});
};

// Helper function to format section label
const formatSectionLabel = (dateKey) => {
  const target = new Date(dateKey);
  const today = new Date();
  const diffDays = Math.floor(
    (today.setHours(0, 0, 0, 0) - target.setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return target.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Helper function to generate notification message
const notificationMessage = (notification, usersById) => {
  const actor = usersById[notification.actorId];
  const actorName = actor?.name ?? "Someone";

  switch (notification.type) {
    case "like":
      return `${actorName} liked your post`;
    case "comment":
      return `${actorName} commented on your post`;
    case "donate":
      return `${actorName} sent you a donation`;
    case "follow":
      return `${actorName} started following you`;
    default:
      return `${actorName} sent a notification`;
  }
};

// Helper function to parse hashtags
const parseHashtags = (value = "") =>
  Array.from(
    new Set(
      (value || "")
        .split(/[\s,]+/)
        .map((token) => token.trim())
        .filter(Boolean)
        .map((token) => (token.startsWith("#") ? token.slice(1) : token)),
    ),
  );

// Create Sidebar Content Component
const CreateSidebarContent = ({ theme, onClose }) => {
  const dispatch = useDispatch();
  const currentUserId = useSelector((state) => state.auth.userId);
  const fileInputRef = useRef(null);
  const [tab, setTab] = useState("post");
  const [text, setText] = useState("");
  const [media, setMedia] = useState([]);
  const [hashtags, setHashtags] = useState("");
  const [visibility, setVisibility] = useState("friends");
  const [donations, setDonations] = useState(false);
  const [remix, setRemix] = useState(true);
  const [eligibleReels, setEligibleReels] = useState(false);
  const [warning, setWarning] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const handleTabChange = useCallback((value) => {
    setTab(value);
    setMedia([]);
    setWarning(null);
    if (value !== "story") {
      setEligibleReels(false);
    }
  }, []);

  const handleAddMedia = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback(
    (e) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const limit = tab === "post" ? 4 : 1;
      const newMedia = files.map((file) => ({
        uri: URL.createObjectURL(file),
        name: file.name,
        type: file.type,
        size: file.size,
      }));

      setMedia((prev) => {
        const combined = [...prev, ...newMedia];
        return combined.slice(0, limit);
      });
      setWarning(null);

      // Reset the input so the same file can be selected again
      e.target.value = "";
    },
    [tab],
  );

  const handleRemoveMedia = useCallback((index) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleReset = useCallback(() => {
    setText("");
    setMedia([]);
    setHashtags("");
    setDonations(false);
    setRemix(true);
    setEligibleReels(false);
    setWarning(null);
  }, []);

  const handlePublish = useCallback(async () => {
    if (publishing) return;

    if (!currentUserId) {
      setWarning("Please sign in again before publishing.");
      return;
    }

    if (!text.trim() && media.length === 0) {
      setWarning("Please add some text or media before publishing.");
      return;
    }

    if (tab === "reel" && !media.some((item) => item.type?.includes("video"))) {
      setWarning("Reels require a video clip to share.");
      return;
    }

    if (
      tab === "story" &&
      eligibleReels &&
      !media.some((item) => item.type?.includes("video"))
    ) {
      setWarning("Stories shared to Reels also need a video clip.");
      return;
    }

    const nsfwHits = guardNSFW(`${text} ${hashtags}`);
    if (nsfwHits) {
      setWarning(`We keep Auri warm. Please avoid: ${nsfwHits.join(", ")}`);
      return;
    }

    const normalizedTags = parseHashtags(hashtags);
    const mediaTypes = media.map((asset) =>
      (asset.type || "").includes("video") ? "video" : "image",
    );

    setPublishing(true);

    try {
      // Upload all media files
      const resolvedFileUrls = [];
      let fileName = null;

      for (const asset of media) {
        fileName = asset.name || `auri-${Date.now()}-${Math.random()}.jpg`;
        const fileType = asset.type || "image/jpeg";

        // Fetch the blob and create a File object for web
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: fileType });

        // Upload to Appwrite Storage
        const uploadedFile = await storage.createFile(
          APPWRITE_BUCKET_ID,
          IDs.unique(),
          file,
          [
            Permission.read(Role.any()),
            Permission.read(Role.user(currentUserId)),
            Permission.update(Role.user(currentUserId)),
            Permission.delete(Role.user(currentUserId)),
          ],
        );

        // Get public URL for the uploaded file
        const fileUrl = `${appwriteConfig.endpoint}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${appwriteConfig.projectId}`;
        resolvedFileUrls.push(fileUrl);
      }

      // Create permissions
      const permissions = [
        Permission.read(Role.any()),
        Permission.update(Role.user(currentUserId)),
        Permission.update(Role.users()),
        Permission.delete(Role.user(currentUserId)),
      ];

      if (tab === "story") {
        const now = new Date();
        const storyPayload = {
          userId: currentUserId,
          caption: text,
          mediaUrl: resolvedFileUrls[0],
          mediaType: mediaTypes[0],
          expiresAt: new Date(
            now.getTime() + 24 * 60 * 60 * 1000,
          ).toISOString(),
          archived: false,
        };

        await databases.createDocument(
          APPWRITE_DATABASE_ID,
          COLLECTION_STORIES_ID,
          IDs.unique(),
          storyPayload,
          permissions,
        );

        // Create reel from story if eligible
        if (eligibleReels && mediaTypes[0] === "video") {
          const reelPayload = {
            userId: currentUserId,
            caption: text,
            videoUrl: resolvedFileUrls[0],
            likes: [],
            tags: normalizedTags,
            hashtags: normalizedTags,
            remixEnabled: remix,
            donationsEnabled: donations,
          };

          await databases.createDocument(
            APPWRITE_DATABASE_ID,
            COLLECTION_REELS_ID,
            IDs.unique(),
            reelPayload,
            permissions,
          );
        }
      } else if (tab === "reel") {
        const reelPayload = {
          userId: currentUserId,
          caption: text,
          videoUrl: resolvedFileUrls[0],
          likes: [],
          tags: normalizedTags,
          hashtags: normalizedTags,
          remixEnabled: remix,
          donationsEnabled: donations,
        };

        await databases.createDocument(
          APPWRITE_DATABASE_ID,
          COLLECTION_REELS_ID,
          IDs.unique(),
          reelPayload,
          permissions,
        );
      } else {
        // Create post
        const postPayload = {
          name: fileName,
          userId: currentUserId,
          caption: text,
          text: text,
          mediaUrl: resolvedFileUrls,
          mediaType: mediaTypes,
          likes: [],
          visibility: String(visibility || "public"),
          tags: Array.isArray(normalizedTags) ? normalizedTags : [],
          hashtags: Array.isArray(normalizedTags) ? normalizedTags : [],
          remixEnabled: Boolean(remix),
          archived: false,
        };

        const newPost = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          COLLECTION_POSTS_ID,
          IDs.unique(),
          postPayload,
          permissions,
        );

        // Add to Redux
        const normalizedPost = {
          id: newPost.$id,
          ...newPost,
          mediaUrl: Array.isArray(newPost.mediaUrl)
            ? newPost.mediaUrl
            : resolvedFileUrls,
          hashtags: Array.isArray(newPost.hashtags)
            ? newPost.hashtags
            : normalizedTags,
        };
        normalizedPost.likes = [];
        normalizedPost.comments = [];
        normalizedPost.commentCount = 0;

        dispatch(hydratePosts([normalizedPost]));
      }

      handleReset();
      onClose();
    } catch (error) {
      console.warn("Error publishing:", error);
      setWarning("Something went wrong while publishing.");
    } finally {
      setPublishing(false);
    }
  }, [
    currentUserId,
    dispatch,
    eligibleReels,
    hashtags,
    media,
    navigation,
    donations,
    remix,
    tab,
    text,
    visibility,
    publishing,
    handleReset,
    onClose,
  ]);

  const hasVideoSelected = useMemo(
    () => media.some((item) => (item?.type || "").includes("video")),
    [media],
  );

  const canPublish = useMemo(() => {
    if (tab === "reel") return hasVideoSelected;
    if (tab === "story") return media.length > 0 || text.trim().length > 0;
    return text.trim().length > 0 || media.length > 0;
  }, [tab, hasVideoSelected, media, text]);

  return (
    <div className="homescreen-create-container">
      {/* Hidden file input for media selection */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={tab !== "reel"}
        accept={tab === "reel" ? "video/*" : "image/*,video/*"}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <div className="homescreen-create-header">
        <button className="homescreen-create-back-btn" onClick={onClose}>
          <FiX size={18} color={theme.text} />
        </button>
        <h2 className="homescreen-create-title" style={{ color: theme.text }}>
          Create
        </h2>
        <button
          className="homescreen-create-back-btn"
          style={{ opacity: 0.65 }}
        >
          <FiCamera size={18} color={theme.text} />
        </button>
      </div>

      {/* <div className="homescreen-create-spacer" /> */}

      <div className="homescreen-create-content">
        <div className="homescreen-create-segmented">
          <SegmentedControl
            value={tab}
            onChange={handleTabChange}
            options={[
              { label: "Post", value: "post" },
              { label: "Story", value: "story" },
              { label: "Reel", value: "reel" },
            ]}
          />
        </div>

        <div className="homescreen-create-input-container">
          <label style={{ color: theme.text }}>
            {tab === "post"
              ? "Post text"
              : tab === "story"
                ? "Story caption"
                : "Reel caption"}
          </label>
          <textarea
            className="homescreen-create-textarea"
            placeholder="Share your thoughts..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              backgroundColor: theme.card,
              borderColor: theme.border,
              color: theme.text,
            }}
          />
        </div>

        <Button
          title="Add media"
          variant="ghost"
          onPress={handleAddMedia}
          style={{ width: "100%", marginBottom: spacing.md, color: theme.text }}
        />

        {media.length > 0 && (
          <div className="homescreen-create-media-preview">
            {media.map((item, index) => (
              <div key={index} className="homescreen-create-media-item">
                {item.type?.includes("video") ? (
                  <video
                    src={item.uri}
                    className="homescreen-create-media-image"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <img
                    src={item.uri}
                    alt={item.name}
                    className="homescreen-create-media-image"
                  />
                )}
                <button
                  className="homescreen-create-media-remove"
                  onClick={() => handleRemoveMedia(index)}
                >
                  <FiX size={12} color="#FFFFFF" />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "post" && (
          <>
            <div className="homescreen-create-input-container">
              <label style={{ color: theme.text }}>Hashtags</label>
              <input
                type="text"
                className="homescreen-create-textarea"
                placeholder="#auri #sunset"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                style={{ minHeight: "60px", color: theme.text }}
              />
            </div>

            <div className="homescreen-create-toggle-row">
              <p
                className="homescreen-create-toggle-label"
                style={{ color: theme.text }}
              >
                Visibility:{" "}
                {visibility === "friends" ? "Friends & Family" : "Public"}
              </p>
              <input
                type="checkbox"
                className="homescreen-create-toggle"
                checked={visibility === "public"}
                onChange={(e) =>
                  setVisibility(e.target.checked ? "public" : "friends")
                }
              />
            </div>

            <div className="homescreen-create-toggle-row">
              <p
                className="homescreen-create-toggle-label"
                style={{ color: theme.text }}
              >
                Allow Donations
              </p>
              <input
                type="checkbox"
                className="homescreen-create-toggle"
                checked={donations}
                onChange={(e) => setDonations(e.target.checked)}
              />
            </div>

            <div className="homescreen-create-toggle-row">
              <p
                className="homescreen-create-toggle-label"
                style={{ color: theme.text }}
              >
                Allow Remix/Reshare
              </p>
              <input
                type="checkbox"
                className="homescreen-create-toggle"
                checked={remix}
                onChange={(e) => setRemix(e.target.checked)}
              />
            </div>
          </>
        )}

        {tab === "story" && (
          <div className="homescreen-create-toggle-row">
            <p
              className="homescreen-create-toggle-label"
              style={{ color: theme.text }}
            >
              Also eligible for Reels
            </p>
            <input
              type="checkbox"
              className="homescreen-create-toggle"
              checked={eligibleReels}
              onChange={(e) => setEligibleReels(e.target.checked)}
            />
          </div>
        )}

        {tab === "reel" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div className="homescreen-create-toggle-row">
              <p
                className="homescreen-create-toggle-label"
                style={{ color: theme.text }}
              >
                Allow Remix/Reshare
              </p>
              <input
                type="checkbox"
                className="homescreen-create-toggle"
                checked={remix}
                onChange={(e) => setRemix(e.target.checked)}
              />
            </div>
            <div className="homescreen-create-toggle-row">
              <p
                className="homescreen-create-toggle-label"
                style={{ color: theme.text }}
              >
                Allow Donations
              </p>
              <input
                type="checkbox"
                className="homescreen-create-toggle"
                checked={donations}
                onChange={(e) => setDonations(e.target.checked)}
              />
            </div>
            {!hasVideoSelected && (
              <p className="homescreen-create-reel-hint">
                Pick a video clip to share as a reel.
              </p>
            )}
          </div>
        )}

        {warning && (
          <div className="homescreen-create-warning">
            <p className="homescreen-create-warning-text">{warning}</p>
          </div>
        )}

        <Button
          title="Publish"
          disabled={!canPublish || publishing}
          loading={publishing}
          onPress={handlePublish}
          style={{ width: "100%", marginBottom: spacing.md }}
        />
      </div>
    </div>
  );
};

export const SearchSidebarContent = ({ theme, onUserPress, onClose }) => {
  const searchInputRef = useRef(null);
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const lastRequestRef = useRef(0);

  // Profile view state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [followPending, setFollowPending] = useState(false);
  const [activeTab, setActiveTab] = useState("media");
  const authUserId = useSelector((state) => state.auth.userId);
  const currentUser = useSelector((state) => state.users.byId[authUserId]);

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("@auri_search_history");
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load search history", e);
    }
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Search effect with 300ms debounce - matches mobile logic
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setLoading(false);
      setUserResults([]);
      setSearchError(null);
      return;
    }
    setLoading(true);
    setSearchError(null);
    const requestId = Date.now();
    lastRequestRef.current = requestId;
    const timeout = setTimeout(async () => {
      try {
        const matches = await searchUsers(trimmed, { limit: 8 });
        if (lastRequestRef.current !== requestId) return;
        setUserResults(matches);
        matches.forEach((user) => {
          if (user?.id) {
            dispatch(upsertUser(user));
          }
        });
        setLoading(false);
      } catch (error) {
        if (lastRequestRef.current !== requestId) return;
        console.warn("User search failed", error);
        setSearchError("Unable to search right now.");
        setUserResults([]);
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const saveSearchHistory = useCallback(
    (query) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      const newHistory = [
        trimmed,
        ...searchHistory.filter((h) => h !== trimmed),
      ].slice(0, 10);
      setSearchHistory(newHistory);
      try {
        localStorage.setItem(
          "@auri_search_history",
          JSON.stringify(newHistory),
        );
      } catch (e) {
        console.warn("Failed to save search history", e);
      }
    },
    [searchHistory],
  );

  const handleChangeText = useCallback((text) => {
    setSearchQuery(text);
  }, []);

  const handleRemoveHistoryItem = useCallback(
    (itemToRemove) => {
      const newHistory = searchHistory.filter((item) => item !== itemToRemove);
      setSearchHistory(newHistory);
      try {
        localStorage.setItem(
          "@auri_search_history",
          JSON.stringify(newHistory),
        );
      } catch (e) {
        console.warn("Failed to save search history", e);
      }
    },
    [searchHistory],
  );

  const handleHistoryItemPress = useCallback((item) => {
    setSearchQuery(item);
  }, []);

  const handleClearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem("@auri_search_history");
    } catch (e) {
      console.warn("Failed to clear search history", e);
    }
  }, []);

  const handleUserPress = useCallback(
    async (user) => {
      if (!user?.id && !user?.$id) return;
      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery) {
        saveSearchHistory(trimmedQuery);
      }

      // Always show user profile in sidebar - replace search UI with profile UI
      setSearchQuery("");
      setUserResults([]);
      setSelectedUser(user);
      setProfileLoading(true);

      try {
        // Use $id (Appwrite document ID) or fall back to id
        const userDocId = user.$id || user.id;
        const profile = await getUserById(userDocId);
        setUserProfile(profile);
        if (profile) {
          dispatch(upsertUser(profile));
        } else {
          // Fallback to search result data if profile fetch fails
          setUserProfile(user);
        }
      } catch (error) {
        console.warn("Failed to load user profile", error);
        setUserProfile(user); // Fallback to search result data
      } finally {
        setProfileLoading(false);
      }

      // Also call onUserPress if provided (for any additional actions)
      if (onUserPress) {
        onUserPress(user);
      }
    },
    [searchQuery, onUserPress, saveSearchHistory, dispatch],
  );

  const handleBackToSearch = useCallback(() => {
    setSelectedUser(null);
    setUserProfile(null);
  }, []);

  // Stats for profile display
  const formatCount = useCallback((value = 0) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return String(value);
  }, []);

  // Get profile data - prefer full profile data, fallback to selected user
  const displayProfile = useMemo(() => {
    return (
      userProfile ??
      selectedUser ?? {
        id: null,
        name: "Auri Friend",
        avatarUri: null,
        bio: "",
        location: "",
        interests: [],
        status: "",
      }
    );
  }, [userProfile, selectedUser]);

  const isFollowing = useMemo(() => {
    if (!currentUser || displayProfile?.id === authUserId) return false;
    return currentUser.following?.includes(displayProfile?.id) ?? false;
  }, [currentUser, displayProfile, authUserId]);

  const donateEnabled = useMemo(() => {
    const raw = displayProfile?.links?.donation;
    return typeof raw === "string" && raw.trim().length > 0;
  }, [displayProfile?.links?.donation]);

  const TABS = [
    { key: "media", label: "Media", icon: "grid" },
    { key: "reels", label: "Reels", icon: "film" },
    { key: "connections", label: "Connections", icon: "users" },
  ];

  const handleFollowToggle = useCallback(async () => {
    if (
      followPending ||
      !authUserId ||
      !displayProfile?.id ||
      displayProfile.id === authUserId
    ) {
      return;
    }

    try {
      setFollowPending(true);
      const result = await followUser(authUserId, displayProfile.id);

      const nextFollowing = result?.following ?? currentUser?.following;
      const nextFollowers = result?.followers ?? displayProfile?.followers;

      if (currentUser) {
        dispatch(
          upsertUser({
            ...currentUser,
            id: currentUser.id ?? authUserId,
            following: nextFollowing,
          }),
        );
      }

      if (displayProfile) {
        dispatch(
          upsertUser({
            ...displayProfile,
            id: displayProfile.id,
            followers: nextFollowers,
          }),
        );
      }

      if (authUserId !== displayProfile.id) {
        try {
          await createNotification({
            toUserId: displayProfile.id,
            actorId: authUserId,
            type: "follow",
          });
        } catch (error) {
          console.warn("Failed to create follow notification", error);
        }
      }
    } catch (error) {
      console.warn("Follow toggle failed", error);
    } finally {
      setFollowPending(false);
    }
  }, [authUserId, currentUser, displayProfile, dispatch, followPending]);

  const handleDonatePress = useCallback(() => {
    if (!displayProfile?.links?.donation) {
      alert("This person hasn't added a donation link yet.");
      return;
    }

    window.open(displayProfile.links.donation, "_blank");

    if (authUserId && displayProfile.id && authUserId !== displayProfile.id) {
      createNotification({
        toUserId: displayProfile.id,
        actorId: authUserId,
        type: "donate",
      }).catch(() => undefined);
    }
  }, [authUserId, displayProfile]);

  const handleMessagePress = useCallback(() => {
    alert("Direct messaging will be available soon.");
  }, []);

  const renderUserResult = useCallback(
    (user) => {
      const avatarUri =
        typeof user.avatarUri === "string" && user.avatarUri.length
          ? user.avatarUri
          : DEFAULT_AVATAR;
      return (
        <div
          key={user.id}
          className="homescreen-search-user-item"
          onClick={() => handleUserPress(user)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.sm,
            padding: spacing.sm,
            paddingHorizontal: spacing.md,
            cursor: "pointer",
          }}
        >
          <img
            src={avatarUri}
            alt=""
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.border,
              objectFit: "cover",
            }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ color: theme.text, fontWeight: 600, fontSize: 14 }}>
              {user.name ?? "Auri Friend"}
            </p>
            {user.location && (
              <p style={{ color: theme.subText, fontSize: 12 }}>
                {user.location}
              </p>
            )}
          </div>
          <FiChevronRight size={16} color={theme.subText} />
        </div>
      );
    },
    [theme, handleUserPress],
  );

  return (
    <div className="homescreen-search-container">
      {/* User Profile View */}
      {selectedUser ? (
        <div className="homescreen-profile-view">
          {/* Back button and header - Fixed */}
          <div
            className="homescreen-profile-header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: spacing.md,
              marginBottom: spacing.lg,
              marginTop: spacing.lg,
              flexShrink: 0,
            }}
          >
            <button
              className="homescreen-profile-back-btn"
              onClick={handleBackToSearch}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                border: `1px solid ${theme.border}`,
                backgroundColor: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 10,
              }}
            >
              <FiArrowLeft size={18} color={theme.text} />
            </button>
            <h2
              className="homescreen-profile-title"
              style={{ color: theme.text, fontSize: 18, fontWeight: 700 }}
            >
              {/*Profile*/}
            </h2>
            <div style={{ display: "flex", flexDirection: "row", gap: 5, alignItems: 'center' }}>
              <button
                className="homescreen-profile-back-btn"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: "transparent",
                  cursor: "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AiOutlineQrcode size={18} color={theme.text} />
              </button>
              <button
                className="homescreen-profile-back-btn"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  border: `1px solid ${theme.border}`,
                  backgroundColor: "transparent",
                  cursor: "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <FiUsers size={18} color={theme.text} />
              </button>
            </div>
          </div>

          {/* Scrollable profile content */}
          <div
            className="homescreen-profile-scroll-container"
            style={{
              flex: 1,
              overflowY: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <style>{`
              .homescreen-profile-scroll-container::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {profileLoading ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  padding: spacing.xl,
                  justifyContent: "center",
                }}
              >
                <FiLoader
                  size={24}
                  color={theme.subText}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                <span style={{ color: theme.subText, fontSize: 14 }}>
                  Loading profile...
                </span>
              </div>
            ) : (
              <>
                {/* Avatar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: spacing.md,
                  }}
                >
                  <Avatar uri={displayProfile.avatarUri} size={80} />
                </div>

                {/* Name */}
                <h3
                  style={{
                    color: theme.text,
                    fontSize: 20,
                    fontWeight: 700,
                    justifyContent: "center",
                    alignItems: "center",
                    display: "flex",
                    gap: 10,
                    marginBottom: spacing.xs,
                  }}
                >
                  {displayProfile.name ?? "Auri Friend"}{" "}
                  {displayProfile.verified && (
                    <MdVerified size={24} color="#FF8A65" />
                  )}
                </h3>

                {/* Location */}
                {displayProfile.location && (
                  <p
                    style={{
                      color: theme.subText,
                      fontSize: 14,
                      textAlign: "center",
                      marginBottom: spacing.sm,
                    }}
                  >
                    {displayProfile.location}
                  </p>
                )}

                {/* Status */}
                {displayProfile.status && (
                  <p
                    style={{
                      color: theme.subText,
                      fontSize: 14,
                      textAlign: "center",
                      marginBottom: spacing.md,
                      fontStyle: "italic",
                    }}
                  >
                    {displayProfile.status}
                  </p>
                )}

                {/* Bio */}
                {displayProfile.bio && (
                  <p
                    style={{
                      color: theme.text,
                      fontSize: 14,
                      textAlign: "center",
                      marginBottom: spacing.lg,
                      paddingHorizontal: spacing.md,
                    }}
                  >
                    {displayProfile.bio}
                  </p>
                )}

                {/* Stats Row */}
                <div
                  className="homescreen-profile-stats-row"
                  style={{
                    display: "flex",
                    justifyContent: "space-evenly",
                    gap: spacing.xl,
                    marginTop: spacing.xxl,
                    marginBottom: spacing.xxl,
                    paddingVertical: spacing.md,
                  }}
                >
                  <div
                    className="homescreen-profile-stat-item"
                    style={{ textAlign: "center" }}
                  >
                    <p
                      className="homescreen-profile-stat-value"
                      style={{
                        color: theme.text,
                        fontSize: 18,
                        fontWeight: 700,
                      }}
                    >
                      {formatCount(displayProfile.posts || 0)}
                    </p>
                    <p
                      className="homescreen-profile-stat-label"
                      style={{ color: theme.subText, fontSize: 12 }}
                    >
                      Posts
                    </p>
                  </div>
                  <div
                    className="homescreen-profile-stat-item"
                    style={{ textAlign: "center" }}
                  >
                    <p
                      className="homescreen-profile-stat-value"
                      style={{
                        color: theme.text,
                        fontSize: 18,
                        fontWeight: 700,
                      }}
                    >
                      {formatCount(displayProfile.followers?.length || 0)}
                    </p>
                    <p
                      className="homescreen-profile-stat-label"
                      style={{ color: theme.subText, fontSize: 12 }}
                    >
                      Followers
                    </p>
                  </div>
                  <div
                    className="homescreen-profile-stat-item"
                    style={{ textAlign: "center" }}
                  >
                    <p
                      className="homescreen-profile-stat-value"
                      style={{
                        color: theme.text,
                        fontSize: 18,
                        fontWeight: 700,
                      }}
                    >
                      {formatCount(displayProfile.following?.length || 0)}
                    </p>
                    <p
                      className="homescreen-profile-stat-label"
                      style={{ color: theme.subText, fontSize: 12 }}
                    >
                      Following
                    </p>
                  </div>
                </div>

                {/* Interests */}
                {displayProfile.interests?.length > 0 && (
                  <div
                    className="homescreen-profile-interests"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: spacing.sm,
                      justifyContent: "center",
                      paddingHorizontal: spacing.md,
                    }}
                  >
                    {displayProfile.interests.map((interest) => (
                      <div
                        key={interest}
                        style={{
                          backgroundColor: theme.border,
                          borderRadius: 16,
                          padding: 12,
                          fontSize: 12,
                          color: theme.text,
                          marginBottom: spacing.xs,
                        }}
                      >
                        <span style={{ color: theme.text, fontSize: 12 }}>
                          {interest}
                        </span>
                      </div>
                    ))}
                    {/* Action Buttons Row */}
                    <div
                      className="homescreen-profile-buttons-row"
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        flexWrap: "wrap",
                        gap: spacing.md,
                        marginTop: spacing.lg,
                        marginBottom: spacing.lg,
                      }}
                    >
                      <button
                        className="homescreen-profile-button"
                        onClick={handleFollowToggle}
                        disabled={followPending || profileLoading}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: spacing.sm,
                          padding: 12,
                          borderRadius: radii.pill,
                          border: `1px solid ${theme.border}`,
                          backgroundColor: isFollowing
                            ? "transparent"
                            : colors.peach,
                          color: isFollowing ? theme.text : colors.white,
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 600,
                          minWidth: 140,
                          opacity: followPending || profileLoading ? 0.6 : 1,
                        }}
                      >
                        {isFollowing ? (
                          <FiCheck size={18} />
                        ) : (
                          <FiUserPlus size={18} />
                        )}
                        <span>
                          {followPending || profileLoading
                            ? "Updating..."
                            : isFollowing
                              ? "Following"
                              : "Follow"}
                        </span>
                      </button>

                      <button
                        className="homescreen-profile-button"
                        onClick={handleDonatePress}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: spacing.sm,
                          padding: 12,
                          borderRadius: radii.pill,
                          border: `1px solid ${theme.border}`,
                          backgroundColor: donateEnabled
                            ? colors.peach
                            : "transparent",
                          color: donateEnabled ? colors.white : theme.text,
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 600,
                          minWidth: 140,
                        }}
                      >
                        <FiGift size={18} />
                        <span>Donate</span>
                      </button>

                      <button
                        className="homescreen-profile-button"
                        onClick={handleMessagePress}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: spacing.sm,
                          padding: 12,
                          borderRadius: radii.pill,
                          border: `1px solid ${theme.border}`,
                          backgroundColor: "transparent",
                          color: theme.text,
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 600,
                          minWidth: 140,
                        }}
                      >
                        <FiMessageCircle size={18} />
                        <span>Message</span>
                      </button>
                    </div>
                    {/* Tabs Row */}
                    <div
                      className="homescreen-profile-tabs-row"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        //justifyContent: 'space-between'
                        width: "100%",
                        gap: spacing.xxl,
                        marginTop: spacing.md,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.border,
                        borderBottomStyle: "solid",
                      }}
                    >
                      {TABS.map((tab) => {
                        const focused = tab.key === activeTab;
                        return (
                          <button
                            key={tab.key}
                            className="homescreen-profile-tab-btn"
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                              flex: 1,
                              alignItems: "center",
                              paddingVertical: spacing.sm,
                              cursor: "pointer",
                              backgroundColor: "transparent",
                              border: "none",
                            }}
                          >
                            <span
                              style={{
                                color: focused ? theme.text : theme.subText,
                                fontSize: 13,
                                fontWeight: 600,
                              }}
                            >
                              {tab.label}
                            </span>
                            {focused && (
                              <div
                                style={{
                                  height: 3,
                                  width: 92,
                                  borderRadius: 2,
                                  backgroundColor: colors.peach,
                                  marginTop: spacing.xs,
                                  marginLeft: 15
                                }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Content Area */}
                <div
                  className="homescreen-profile-content"
                  style={{
                    flex: 1,
                    paddingTop: spacing.lg,
                  }}
                >
                  {activeTab === "media" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: spacing.xl,
                      }}
                    >
                      <FiGrid size={36} color={theme.subText} />
                      <p
                        style={{
                          color: theme.subText,
                          fontSize: 14,
                          marginTop: spacing.md,
                        }}
                      >
                        Media content will appear here
                      </p>
                    </div>
                  )}

                  {activeTab === "reels" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: spacing.xl,
                      }}
                    >
                      <FiFilm size={36} color={theme.subText} />
                      <p
                        style={{
                          color: theme.subText,
                          fontSize: 14,
                          marginTop: spacing.md,
                        }}
                      >
                        Reels will appear here
                      </p>
                    </div>
                  )}

                  {activeTab === "saved" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: spacing.xl,
                      }}
                    >
                      <FiBookmark size={36} color={theme.subText} />
                      <p
                        style={{
                          color: theme.subText,
                          fontSize: 14,
                          marginTop: spacing.md,
                        }}
                      >
                        Saved posts will appear here
                      </p>
                    </div>
                  )}

                  {activeTab === "connections" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: spacing.xl,
                      }}
                    >
                      <FiUsers size={36} color={theme.subText} />
                      <p
                        style={{
                          color: theme.subText,
                          fontSize: 14,
                          marginTop: spacing.md,
                        }}
                      >
                        Connections will appear here
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Search UI */
        <>
          <div
            className="homescreen-search-header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: spacing.md,
            }}
          >
            <button
              className="homescreen-search-back-btn"
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                border: `1px solid ${theme.border}`,
                backgroundColor: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiX size={18} color={theme.text} />
            </button>
            <h2
              className="homescreen-search-title"
              style={{ color: theme.text, fontSize: 18, fontWeight: 700 }}
            >
              Search
            </h2>
            <div style={{ width: 36 }} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 30,
              marginBottom: spacing.md,
              width: "100%",
            }}
          >
            <input
              ref={searchInputRef}
              type="text"
              className="homescreen-search-input"
              placeholder="Search Auri..."
              value={searchQuery}
              onChange={(e) => handleChangeText(e.target.value)}
              style={{
                flex: 1,
                marginLeft: spacing.sm,
                backgroundColor: "transparent",
                border: `1px solid ${theme.border}`,
                outline: "none",
                color: theme.text,
                fontSize: 15,
                width: "90%",
              }}
            />
          </div>

          {searchQuery.trim().length > 0 ? (
            <>
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                    padding: spacing.md,
                    justifyContent: "center",
                  }}
                >
                  <FiLoader
                    size={16}
                    color={theme.subText}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  <span style={{ color: theme.subText, fontSize: 14 }}>
                    Searching Auri...
                  </span>
                </div>
              ) : searchError ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                    padding: spacing.md,
                    justifyContent: "center",
                  }}
                >
                  <FiAlertTriangle size={16} color={theme.subText} />
                  <span style={{ color: theme.subText, fontSize: 14 }}>
                    {searchError}
                  </span>
                </div>
              ) : userResults.length > 0 ? (
                <div
                  className="search-results-container"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "auto",
                    flex: 1,
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  <style>{`
                    .search-results-container::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  {userResults.map(renderUserResult)}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                    padding: spacing.md,
                    justifyContent: "center",
                  }}
                >
                  <FiSearch size={16} color={theme.subText} />
                  <span style={{ color: theme.subText, fontSize: 14 }}>
                    No users found for "{searchQuery}"
                  </span>
                </div>
              )}
            </>
          ) : searchHistory.length > 0 ? (
            <div className="homescreen-search-history">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: spacing.sm,
                }}
              >
                <span style={{ color: theme.subText, fontSize: 14 }}>
                  Recent searches
                </span>
                <button
                  onClick={handleClearHistory}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: theme.subText,
                    fontSize: 12,
                  }}
                >
                  Clear
                </button>
              </div>
              {searchHistory.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: spacing.sm,
                    padding: spacing.sm,
                    paddingHorizontal: spacing.md,
                    cursor: "pointer",
                  }}
                  onClick={() => handleHistoryItemPress(item)}
                >
                  <FiClock size={16} color={theme.subText} />
                  <span style={{ flex: 1, color: theme.text, fontSize: 14 }}>
                    {item}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveHistoryItem(item);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    <FiX size={14} color={theme.subText} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: spacing.xxl,
              }}
            >
              <FiSearch size={36} color={theme.subText} />
              <p
                style={{
                  color: theme.subText,
                  fontSize: 14,
                  marginTop: spacing.md,
                  textAlign: "center",
                }}
              >
                Search for people on Auri
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const NotificationsSidebarContent = ({ theme, onClose }) => {
  const dispatch = useDispatch();
  const notificationsState = useSelector(selectNotifications);
  const usersById = useSelector((state) => state.users.byId);
  const authUserId = useSelector((state) => state.auth.userId);

  const [loading, setLoading] = useState(true);

  // Get notifications from Redux store (same logic as mobile)
  const notifications = useMemo(() => {
    return notificationsState.allIds
      .map((id) => notificationsState.byId[id])
      .filter(Boolean);
  }, [notificationsState.allIds, notificationsState.byId]);

  // Fetch notifications from Appwrite on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!authUserId) {
        setLoading(false);
        return;
      }

      try {
        const fetchedNotifications = await listNotificationsForUser(authUserId);
        if (fetchedNotifications.length > 0) {
          dispatch(hydrateNotifications(fetchedNotifications));
        }
      } catch (error) {
        console.warn("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [dispatch, authUserId]);

  // Notifications logic - grouped by day (same as mobile)
  const groupedEntries = useMemo(() => {
    const grouped = groupByDay(notifications);
    return Object.entries(grouped)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .map(([dateKey, items]) => ({
        section: formatSectionLabel(dateKey),
        items: items.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        ),
      }));
  }, [notifications]);

  const dataSource = useMemo(() => {
    if (!groupedEntries.length) {
      return [{ type: "empty" }];
    }

    return groupedEntries.flatMap((entry) => [
      { type: "section", label: entry.section },
      ...entry.items.map((notification) => ({
        type: "notification",
        notification,
      })),
    ]);
  }, [groupedEntries]);

  const handlePressNotification = useCallback(
    async (notification) => {
      if (!notification?.id) return;

      // Mark as read in Redux
      dispatch(markNotificationRead(notification.id));

      // Mark as read in Appwrite
      try {
        await markNotificationReadRemote(notification.id);
      } catch (error) {
        console.warn("Unable to mark notification read", error);
      }
    },
    [dispatch],
  );

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = notifications
      .filter((item) => !item.read)
      .map((item) => item.id)
      .filter(Boolean);

    // Mark all as read in Redux
    dispatch(markAllNotificationsRead());

    // Mark all as read in Appwrite
    if (unreadIds.length) {
      try {
        await markNotificationsReadBulk(unreadIds);
      } catch (error) {
        console.warn("Unable to mark notifications read", error);
      }
    }
  }, [dispatch, notifications]);

  const handleClearAll = useCallback(() => {
    // Clear all notifications in Redux only (local clear)
    dispatch(clearNotifications());
  }, [dispatch]);

  const renderNotificationItem = useCallback(
    (item) => {
      // Use Redux usersById for actor info, fallback to mock data
      const users = usersById;
      const message = notificationMessage(item, users);
      const actor = users[item.actorId];
      const avatarUri = actor?.avatarUri;

      return (
        <React.Fragment key={item.id}>
          <div
            className={`homescreen-notifications-item ${!item.read ? "homescreen-notifications-item-unread" : ""}`}
            onClick={() => handlePressNotification(item)}
          >
            <div className="homescreen-notifications-avatar-container">
              {avatarUri ? (
                <img
                  src={avatarUri}
                  alt=""
                  className="homescreen-notifications-avatar"
                />
              ) : (
                <div className="homescreen-notifications-avatar-placeholder" />
              )}
              {!item.read && (
                <div className="homescreen-notifications-unread-dot" />
              )}
            </div>
            <div className="homescreen-notifications-content">
              <p
                className="homescreen-notifications-message"
                style={{ color: theme.text }}
              >
                {message}
              </p>
              {item.postId && (
                <p
                  className="homescreen-notifications-subtext"
                  style={{ color: theme.subText }}
                >
                  Tap to view post
                </p>
              )}
            </div>
            <div className="homescreen-notifications-right">
              <p
                className="homescreen-notifications-time"
                style={{ color: theme.subText }}
              >
                {timeAgo(item.createdAt)}
              </p>
            </div>
          </div>
          <div className="homescreen-notifications-separator" />
        </React.Fragment>
      );
    },
    [theme, usersById, handlePressNotification],
  );

  // Show loading state or empty state
  if (loading) {
    return (
      <div className="homescreen-notifications-empty">
        <FiBell
          size={36}
          className="homescreen-notifications-empty-icon"
          color={theme.subText}
        />
        <p
          className="homescreen-notifications-empty-text"
          style={{ color: theme.subText }}
        >
          Loading...
        </p>
      </div>
    );
  }

  if (
    !dataSource.length ||
    (dataSource.length === 1 && dataSource[0].type === "empty")
  ) {
    return (
      <div className="homescreen-notifications-empty">
        <FiBell
          size={36}
          className="homescreen-notifications-empty-icon"
          color={theme.subText}
        />
        <p
          className="homescreen-notifications-empty-text"
          style={{ color: theme.subText }}
        >
          You are all caught up!
        </p>
      </div>
    );
  }

  return (
    <div className="homescreen-notifications-list">
      {dataSource.map((item) => {
        if (item.type === "section") {
          return (
            <p
              key={`section-${item.label}`}
              className="homescreen-notifications-section"
              style={{ color: theme.subText }}
            >
              {item.label}
            </p>
          );
        }
        if (item.type === "notification") {
          return renderNotificationItem(item.notification);
        }
        return null;
      })}
    </div>
  );
};

export const ShopSidebarContent = ({ theme, onClose }) => {
  const [activeTab, setActiveTab] = useState("digital");
  const [auroGiveawayEnabled, setAuroGiveawayEnabled] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("utilities");

  // Popup state
  const [showPreferences, setShowPreferences] = useState(false);
  const [showRewardVoucher, setShowRewardVoucher] = useState(false);
  const [showBecomeSeller, setShowBecomeSeller] = useState(false);
  const [showDigitalCategory, setShowDigitalCategory] = useState(false);
  const [region, setRegion] = useState("Both");
  const [price, setPrice] = useState("Balanced");

  // Digital subcategories
  const utilitiesSubcategories = [
    { id: "mobile_data", name: "Mobile Data", icon: "smartphone" },
    { id: "esim", name: "eSIM", icon: "radio" },
    { id: "gift_cards", name: "Gift Cards", icon: "gift" },
    { id: "game_credits", name: "Game Vouchers", icon: "slack" },
  ];

  const servicesSubcategories = [
    { id: "cv_design", name: "CV Design", icon: "file-text" },
    { id: "ui_design", name: "UI Design", icon: "layout" },
    { id: "house_plans", name: "House Plans", icon: "home" },
    { id: "seller_cards", name: "Seller Cards", icon: "credit-card" },
    { id: "tech_help", name: "Tech Help", icon: "help-circle" },
  ];

  const designsSubcategories = [
    { id: "profile_pic", name: "Profile Pic", icon: "user" },
    { id: "couple_drawing", name: "Couple Drawing", icon: "users" },
    { id: "family_art", name: "Family Art", icon: "users" },
    { id: "minimal_portrait", name: "Minimal Portrait", icon: "image" },
    { id: "logo_mascot", name: "Logo & Mascot", icon: "aperture" },
  ];

  // compute current category info for popup (must come after arrays)
  const categoryTitle = useMemo(() => {
    if (selectedCategory === "utilities") return "Digital Utilities";
    if (selectedCategory === "services") return "Digital Services";
    if (selectedCategory === "designs") return "Custom Designs";
    return "";
  }, [selectedCategory]);

  const categoryItems = useMemo(() => {
    if (selectedCategory === "utilities") return utilitiesSubcategories;
    if (selectedCategory === "services") return servicesSubcategories;
    if (selectedCategory === "designs") return designsSubcategories;
    return [];
  }, [selectedCategory]);

  const quickAccessItems = [
    ...utilitiesSubcategories,
    ...servicesSubcategories,
    ...designsSubcategories,
  ];

  const handleReviewAuri = () => {
    alert(
      "Opening a public Review page at auri-green.vercel.app\n\nContact us if you have any questions!",
    );
    window.open("https://auri-green.vercel.app/reviews", "_blank");
  };

  const allSubcategories = useMemo(() => {
    return utilitiesSubcategories
      .concat(servicesSubcategories)
      .concat(designsSubcategories);
  }, []);

  return (
    <div className="homescreen-shop-container">
      <div className="homescreen-shop-header">
        <button className="homescreen-shop-back-btn" onClick={onClose}>
          <FiX size={18} color={theme.text} />
        </button>
        <h2 className="homescreen-shop-title" style={{ color: theme.text }}>
          Shop
        </h2>
        <div className="homescreen-shop-spacer" />
      </div>

      <div
        className="homescreen-shop-content"
        style={{ padding: spacing.md, overflowY: "auto" }}
      >
        <style>{`
          .homescreen-shop-content::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {/* Tab Switcher Pill - Shop / Digital */}
        <div
          className="homescreen-shop-tab-switcher"
          style={{
            display: "flex",
            backgroundColor: theme.card,
            borderRadius: 24,
            padding: 4,
            marginBottom: spacing.lg,
            border: `1px solid ${theme.border}`,
          }}
        >
          <button
            onClick={() => setActiveTab("shop")}
            style={{
              flex: 1,
              padding: spacing.sm,
              borderRadius: 20,
              border: "none",
              backgroundColor:
                activeTab === "shop" ? colors.peach : "transparent",
              color: activeTab === "shop" ? colors.white : theme.text,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Shop
          </button>
          <button
            onClick={() => setActiveTab("digital")}
            style={{
              flex: 1,
              padding: spacing.sm,
              borderRadius: 20,
              border: "none",
              backgroundColor:
                activeTab === "digital" ? colors.peach : "transparent",
              color: activeTab === "digital" ? colors.white : theme.text,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Digital
          </button>
        </div>

        {activeTab === "shop" ? (
          /* SHOP TAB - Physical Products (Placeholder) */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: spacing.xxl * 2,
            }}
          >
            <FiShoppingBag size={56} color={colors.peach} />
            <p
              style={{
                color: theme.text,
                marginTop: spacing.md,
                fontSize: 18,
                fontWeight: "600",
              }}
            >
              This section is being workshopped
            </p>
            <p
              style={{
                color: theme.subText,
                marginTop: spacing.sm,
                textAlign: "center",
              }}
            >
              We're preparing something special for you
            </p>
          </div>
        ) : (
          /* DIGITAL TAB - Auri Mini - Digital Products */
          <div className="homescreen-shop-digital-content">
            {/* Auri Mini Hero Section */}
            <div
              className="homescreen-shop-digital-hero"
              style={{
                background:
                  "linear-gradient(135deg, #6366F1, #8B5CF6, #A855F7)",
                borderRadius: 16,
                padding: spacing.lg,
                marginBottom: spacing.lg,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3
                  style={{
                    color: colors.white,
                    fontSize: 22,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  Auri Mini
                </h3>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
                  Digital Marketplace • Sell & Buy
                </p>
              </div>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: 12,
                  padding: spacing.sm,
                }}
              >
                <FiZap size={40} color={colors.white} />
              </div>
            </div>

            {/* Auro Giveaway Section - Free Items */}
            <div
              className="homescreen-shop-auro-giveaway"
              style={{
                backgroundColor: theme.card,
                borderRadius: 12,
                padding: spacing.md,
                marginBottom: spacing.lg,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ display: "flex", gap: spacing.sm }}>
                  <div
                    style={{
                      backgroundColor: `${colors.peach}20`,
                      borderRadius: 10,
                      padding: spacing.sm,
                    }}
                  >
                    <FiGift size={20} color={colors.peach} />
                  </div>
                  <div>
                    <p
                      style={{
                        color: theme.text,
                        fontWeight: 600,
                        fontSize: 15,
                      }}
                    >
                      Auri Giveaway
                    </p>
                    <p style={{ color: theme.subText, fontSize: 12 }}>
                      Free items - Auri picks for you
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!auroGiveawayEnabled) {
                      alert(
                        "Auro Giveaway\n\nAuri will pick free items for you! You'll receive randomly selected free digital products. Toggle off if you don't want to receive free items.",
                      );
                      setAuroGiveawayEnabled(true);
                    } else {
                      setAuroGiveawayEnabled(false);
                    }
                  }}
                  style={{
                    backgroundColor: auroGiveawayEnabled
                      ? colors.peach
                      : "transparent",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 20,
                    padding: "6px 12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {auroGiveawayEnabled ? (
                    <FiBell size={16} color={colors.white} />
                  ) : (
                    <FiBellOff size={16} color={theme.subText} />
                  )}
                </button>
              </div>
              {auroGiveawayEnabled && (
                <div
                  style={{
                    backgroundColor: `${colors.peach}15`,
                    borderRadius: 8,
                    padding: spacing.sm,
                    marginTop: spacing.sm,
                    display: "flex",
                    alignItems: "center",
                    gap: spacing.xs,
                  }}
                >
                  <FiCheck size={14} color={colors.peach} />
                  <span style={{ color: colors.peach, fontSize: 12 }}>
                    Enabled - Auri will notify you of free items
                  </span>
                </div>
              )}
            </div>

            {/* Quick Actions Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: spacing.sm,
                marginBottom: spacing.lg,
              }}
            >
              {/* Preferences Button
              <button
                onClick={() => setShowPreferences(true)}
                style={{
                  backgroundColor: theme.card,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 12,
                  padding: spacing.md,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: spacing.xs,
                }}
              >
                <div style={{
                  backgroundColor: `${colors.peach}20`,
                  borderRadius: 10,
                  padding: spacing.sm,
                }}>
                  <FiTool size={22} color={colors.peach} />
                </div>
                <span style={{ color: theme.text, fontSize: 11, fontWeight: 500, textAlign: "center" }}>
                  Preferences
                </span>
              </button>
              */}

              {/* Reward Vouchers Button */}
              <button
                onClick={() => setShowRewardVoucher(true)}
                style={{
                  backgroundColor: theme.card,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 12,
                  padding: spacing.md,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: spacing.xs,
                }}
              >
                <div
                  style={{
                    backgroundColor: `${colors.peach}20`,
                    borderRadius: 10,
                    padding: spacing.sm,
                  }}
                >
                  <FiGift size={22} color={colors.peach} />
                </div>
                <span
                  style={{
                    color: theme.text,
                    fontSize: 11,
                    fontWeight: 500,
                    textAlign: "center",
                  }}
                >
                  Reward
                  <br />
                  Vouchers
                </span>
              </button>

              {/* Become Seller Button */}
              <button
                onClick={() => setShowBecomeSeller(true)}
                style={{
                  backgroundColor: theme.card,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 12,
                  padding: spacing.md,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: spacing.xs,
                }}
              >
                <div
                  style={{
                    backgroundColor: `${colors.peach}20`,
                    borderRadius: 10,
                    padding: spacing.sm,
                  }}
                >
                  <FiShoppingBag size={22} color={colors.peach} />
                </div>
                <span
                  style={{
                    color: theme.text,
                    fontSize: 11,
                    fontWeight: 500,
                    textAlign: "center",
                  }}
                >
                  Become
                  <br />
                  Seller
                </span>
              </button>

              {/* Review Auri Button */}
              <button
                onClick={handleReviewAuri}
                style={{
                  backgroundColor: theme.card,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 12,
                  padding: spacing.md,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: spacing.xs,
                }}
              >
                <div
                  style={{
                    backgroundColor: `${colors.peach}20`,
                    borderRadius: 10,
                    padding: spacing.sm,
                  }}
                >
                  <FiExternalLink size={22} color={colors.peach} />
                </div>
                <span
                  style={{
                    color: theme.text,
                    fontSize: 11,
                    fontWeight: 500,
                    textAlign: "center",
                  }}
                >
                  Review
                  <br />
                  Auri
                </span>
              </button>
            </div>

            {/* Digital Categories - Beautiful Cards */}
            <div style={{ marginBottom: spacing.lg }}>
              <p
                style={{
                  color: theme.text,
                  fontWeight: 600,
                  fontSize: 16,
                  marginBottom: spacing.sm,
                }}
              >
                Browse Categories
              </p>

              {/* Utilities - Gradient Card */}
              <button
                onClick={() => {
                  setSelectedCategory("utilities");
                  setShowDigitalCategory(true);
                }}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  border: "none",
                  borderRadius: 12,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: spacing.sm,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: 8,
                      padding: spacing.xs,
                    }}
                  >
                    <FiSmartphone size={28} color={colors.white} />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <p
                      style={{
                        color: colors.white,
                        fontWeight: 600,
                        fontSize: 15,
                      }}
                    >
                      Digital Utilities
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                      Mobile Data • eSIM • Gift Cards
                    </p>
                  </div>
                </div>
                <FiChevronRight size={20} color={colors.white} />
              </button>

              {/* Services - Gradient Card */}
              <button
                onClick={() => {
                  setSelectedCategory("services");
                  setShowDigitalCategory(true);
                }}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  border: "none",
                  borderRadius: 12,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: spacing.sm,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: 8,
                      padding: spacing.xs,
                    }}
                  >
                    <FiTool size={28} color={colors.white} />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <p
                      style={{
                        color: colors.white,
                        fontWeight: 600,
                        fontSize: 15,
                      }}
                    >
                      Digital Services
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                      CV Design • UI Design • House Plans
                    </p>
                  </div>
                </div>
                <FiChevronRight size={20} color={colors.white} />
              </button>

              {/* Designs - Gradient Card */}
              <button
                onClick={() => {
                  setSelectedCategory("designs");
                  setShowDigitalCategory(true);
                }}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  border: "none",
                  borderRadius: 12,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: spacing.sm,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: 8,
                      padding: spacing.xs,
                    }}
                  >
                    <FiEdit3 size={28} color={colors.white} />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <p
                      style={{
                        color: colors.white,
                        fontWeight: 600,
                        fontSize: 15,
                      }}
                    >
                      Custom Designs
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>
                      Portraits • Logos • Illustrations
                    </p>
                  </div>
                </div>
                <FiChevronRight size={20} color={colors.white} />
              </button>
            </div>

            {/* Quick Access Grid */}
            <div>
              <p
                style={{
                  color: theme.text,
                  fontWeight: 600,
                  fontSize: 16,
                  marginBottom: spacing.sm,
                }}
              >
                Quick Access
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: spacing.sm,
                }}
              >
                {quickAccessItems.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => alert(`${sub.name} - Coming soon!`)}
                    style={{
                      backgroundColor: theme.card,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 12,
                      padding: spacing.sm,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: spacing.xs,
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: `${colors.peach}15`,
                        borderRadius: 8,
                        padding: spacing.xs,
                      }}
                    >
                      {sub.icon === "smartphone" && (
                        <FiSmartphone size={18} color={colors.peach} />
                      )}
                      {sub.icon === "radio" && (
                        <FiPlay size={18} color={colors.peach} />
                      )}
                      {sub.icon === "gift" && (
                        <FiGift size={18} color={colors.peach} />
                      )}
                      {sub.icon === "slack" && (
                        <FiPlay size={18} color={colors.peach} />
                      )}
                      {sub.icon === "file-text" && (
                        <FiGrid size={18} color={colors.peach} />
                      )}
                      {sub.icon === "layout" && (
                        <FiGrid size={18} color={colors.peach} />
                      )}
                      {sub.icon === "home" && (
                        <FiGrid size={18} color={colors.peach} />
                      )}
                      {sub.icon === "credit-card" && (
                        <FiGrid size={18} color={colors.peach} />
                      )}
                      {sub.icon === "help-circle" && (
                        <FiGrid size={18} color={colors.peach} />
                      )}
                      {sub.icon === "user" && (
                        <FiGrid size={18} color={colors.peach} />
                      )}
                      {sub.icon === "users" && (
                        <FiUsers size={18} color={colors.peach} />
                      )}
                      {sub.icon === "image" && (
                        <FiGrid size={18} color={colors.peach} />
                      )}
                      {sub.icon === "aperture" && (
                        <FiGrid size={18} color={colors.peach} />
                      )}
                    </div>
                    <span
                      style={{
                        color: theme.text,
                        fontSize: 10,
                        textAlign: "center",
                      }}
                    >
                      {sub.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* popups */}
      <PreferencesPopup
        showPreferences={showPreferences}
        setShowPreferences={setShowPreferences}
        region={region}
        setRegion={setRegion}
        price={price}
        setPrice={setPrice}
      />
      <RewardVoucherPopup
        showRewardVoucher={showRewardVoucher}
        setShowRewardVoucher={setShowRewardVoucher}
      />
      <BecomeSellerPopup
        showBecomeSeller={showBecomeSeller}
        setShowBecomeSeller={setShowBecomeSeller}
      />
      <DigitalCategoryPopup
        showDigitalCategory={showDigitalCategory}
        setShowDigitalCategory={setShowDigitalCategory}
        categoryTitle={categoryTitle}
        categoryItems={categoryItems}
      />
    </div>
  );
};

export const DefaultSidebarContent = ({ theme }) => {
  return (
    <div className="homescreen-sidebar-default">
      <div className="homescreen-sidebar-welcome">
        <h3 style={{ color: theme.text }}>Welcome to Auri!</h3>
        <p style={{ color: theme.subText }}>
          Click on the buttons above to see notifications, search, shop, or
          create a new post.
        </p>
      </div>
      <div className="homescreen-sidebar-quicklinks">
        <h4 style={{ color: theme.text }}>Quick Links</h4>
        <button className="homescreen-quicklink-btn">My Profile</button>
        <button className="homescreen-quicklink-btn">Messages</button>
        <button className="homescreen-quicklink-btn">Settings</button>
      </div>
    </div>
  );
};

export { CreateSidebarContent };
