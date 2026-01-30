import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FiArrowLeft,
  FiMapPin,
  FiShare2,
} from "react-icons/fi";
import { Avatar } from "../../components/Avatar";
import { Chip } from "../../components/Chip";
import { Button } from "../../components/Button";
import { useAppTheme } from "../../theme";
import { spacing, colors } from "../../theme/tokens";
import { getUserById } from "../../lib/usersApi";
import { getPostsByUser } from "../../lib/postsApi";
import { listReels, mapReelDocument } from "../../lib/reelsApi";
import { upsertUser } from "../../store/slices/usersSlice";
import { hydratePosts } from "../../store/slices/postsSlice";
import {
  databases,
  APPWRITE_DATABASE_ID,
  COLLECTION_POSTS_ID,
  COLLECTION_REELS_ID,
  Query,
} from "../../lib/Appwrite";

const TABS = [
  { key: "media", label: "Media", icon: "grid" },
  { key: "reels", label: "Reels", icon: "film" },
];

const formatCount = (value = 0) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(value);
};

const resolveMediaCover = (post) => {
  if (!post) return null;
  if (Array.isArray(post.mediaUrl) && post.mediaUrl.length) {
    return post.mediaUrl[0];
  }
  if (Array.isArray(post.media) && post.media.length) {
    return post.media[0]?.uri ?? post.media[0]?.url ?? null;
  }
  if (typeof post.mediaUrl === "string") {
    return post.mediaUrl;
  }
  if (typeof post.mediaUri === "string") {
    return post.mediaUri;
  }
  return null;
};

export const PublicProfileScreen = () => {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId } = useParams();

  const viewedUser = useSelector((state) => state.users.byId[userId]);
  const postsState = useSelector((state) => state.posts);

  const [activeTab, setActiveTab] = useState("media");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingReels, setLoadingReels] = useState(false);
  const [userReels, setUserReels] = useState([]);

  // Hydrate profile data
  useEffect(() => {
    let cancelled = false;

    const hydrateProfile = async () => {
      if (!userId || viewedUser) {
        return;
      }

      try {
        setLoadingProfile(true);
        const doc = await getUserById(userId);
        if (!doc || cancelled) return;
        dispatch(upsertUser(doc));
      } catch (error) {
        console.warn("Profile load failed", error);
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    };

    hydrateProfile();

    return () => {
      cancelled = true;
    };
  }, [dispatch, viewedUser, userId]);

  // Load posts
  useEffect(() => {
    let cancelled = false;

    const loadPosts = async () => {
      if (!userId) {
        return;
      }

      try {
        setLoadingPosts(true);
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTION_POSTS_ID,
          [
            Query.equal("userId", userId),
            Query.equal("visibility", "public"), // Only public posts
            Query.equal("archived", false),
            Query.orderDesc("$createdAt"),
          ],
        );

        if (cancelled) {
          return;
        }

        const mapped = response.documents.map((doc) => ({
          id: doc.$id,
          ...doc,
        }));

        dispatch(hydratePosts(mapped));
      } catch (error) {
        console.error("Unable to load profile posts", error);
      } finally {
        if (!cancelled) {
          setLoadingPosts(false);
        }
      }
    };

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, [dispatch, userId]);

  // Load reels
  useEffect(() => {
    let cancelled = false;

    const loadReels = async () => {
      if (!userId) {
        return;
      }

      try {
        setLoadingReels(true);
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTION_REELS_ID,
          [
            Query.equal("userId", userId),
            Query.equal("archived", false),
            Query.orderDesc("$createdAt"),
          ],
        );

        if (cancelled) {
          return;
        }

        const mapped = response.documents.map((doc) =>
          mapReelDocument({ ...doc, id: doc.$id }),
        );
        setUserReels(mapped);
      } catch (error) {
        console.error("Unable to load profile reels", error);
      } finally {
        if (!cancelled) {
          setLoadingReels(false);
        }
      }
    };

    loadReels();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const profilePosts = useMemo(() => {
    return postsState.allIds
      .map((id) => postsState.byId[id])
      .filter(
        (post) =>
          post &&
          post.userId === userId &&
          post.visibility === "public" && // Only public posts
          (post.archived === undefined || post.archived === false),
      )
      .sort((a, b) => {
        const aDate = new Date(a.$createdAt || a.createdAt || 0).getTime();
        const bDate = new Date(b.$createdAt || b.createdAt || 0).getTime();
        return bDate - aDate;
      });
  }, [postsState, userId]);

  const stats = useMemo(
    () => ({
      posts: profilePosts.length,
      followers: viewedUser?.followers?.length ?? 0,
      following: viewedUser?.following?.length ?? 0,
    }),
    [profilePosts.length, viewedUser?.followers, viewedUser?.following],
  );

  const displayUser = useMemo(
    () =>
      viewedUser ?? {
        id: userId,
        name: "Auri Friend",
        avatarUri: null,
        bio: "",
        location: "",
        interests: [],
        status: "",
        links: {},
      },
    [viewedUser, userId],
  );

  const handleBackPress = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/u/${userId}`;
    const shareText = `Check out ${displayUser.name}'s profile on Auri 🌿\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayUser.name} on Auri`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error - fallback to copy
        navigator.clipboard.writeText(shareUrl);
      }
    } else {
      // Fallback for browsers without Web Share API
      navigator.clipboard.writeText(shareUrl);
    }
  }, [userId, displayUser.name]);

  const renderPlaceholder = useCallback(
    (icon, label) => (
      <div className="profile-placeholder" style={{ color: theme.subText }}>
        {icon}
        <p className="profile-placeholder-text">{label}</p>
      </div>
    ),
    [theme.subText]
  );

  const renderContent = useMemo(() => {
    if (activeTab === "reels") {
      if (loadingReels) {
        return (
          <div className="profile-placeholder" style={{ color: theme.subText }}>
            <div className="reel-spinner" />
            <p className="profile-placeholder-text">Loading reels...</p>
          </div>
        );
      }

      if (!userReels.length) {
        return renderPlaceholder(
          <span>🎬</span>,
          "No reels to show"
        );
      }

      return (
        <div className="profile-grid">
          {userReels.map((reel) => {
            const cover = reel.media?.[0]?.uri ?? null;
            if (!cover) return null;

            return (
              <div key={reel.id} className="profile-grid-item">
                <img src={cover} alt="" className="profile-grid-image" />
                <div className="profile-reel-badge">
                  <span>▶️</span>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === "media") {
      if (loadingPosts) {
        return (
          <div className="profile-placeholder" style={{ color: theme.subText }}>
            <div className="reel-spinner" />
            <p className="profile-placeholder-text">Loading posts...</p>
          </div>
        );
      }

      if (!profilePosts.length) {
        return renderPlaceholder(
          <span>📷</span>,
          "No public posts to show"
        );
      }

      return (
        <div className="profile-grid">
          {profilePosts.map((post) => {
            const cover = resolveMediaCover(post);
            if (!cover) return null;

            return (
              <div key={post.id} className="profile-grid-item">
                <img src={cover} alt="" className="profile-grid-image" />
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  }, [
    activeTab,
    renderPlaceholder,
    userReels,
    loadingReels,
    loadingPosts,
    profilePosts,
    theme.subText,
  ]);

  return (
    <div
      className="profile-container"
      style={{ backgroundColor: theme.background }}
    >
      {/* Header with back and share */}
      <div className="public-profile-header">
        <button
          className="public-profile-back-btn"
          onClick={handleBackPress}
          style={{ color: theme.text }}
        >
          <FiArrowLeft size={24} />
        </button>
        <h1 className="public-profile-title" style={{ color: theme.text }}>
          Profile
        </h1>
        <button
          className="public-profile-share-btn"
          onClick={handleShare}
          style={{ color: theme.text }}
        >
          <FiShare2 size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="profile-main">
        {/* Banner */}
        <div className="profile-banner" />

        {/* Profile Header */}
        <div className="profile-header-content">
          <Avatar uri={displayUser.avatarUri} size={120} />

          {loadingProfile && !viewedUser && (
            <div className="profile-loading-indicator">
              <div className="reel-spinner" />
            </div>
          )}

          <h1 className="profile-name" style={{ color: theme.text }}>
            {displayUser.name}
          </h1>

          {displayUser.location && (
            <p className="profile-location" style={{ color: theme.subText }}>
              <FiMapPin size={14} />
              {displayUser.location}
            </p>
          )}

          {displayUser.status && (
            <p className="profile-status" style={{ color: theme.subText }}>
              {displayUser.status}
            </p>
          )}

          {displayUser.bio && (
            <p className="profile-bio" style={{ color: theme.text }}>
              {displayUser.bio}
            </p>
          )}

          {/* Stats Row */}
          <div className="profile-stats-row">
            <div className="profile-stat-item">
              <p className="profile-stat-value" style={{ color: theme.text }}>
                {formatCount(stats.posts)}
              </p>
              <p
                className="profile-stat-label"
                style={{ color: theme.subText }}
              >
                Posts
              </p>
            </div>
            <div className="profile-stat-item">
              <p className="profile-stat-value" style={{ color: theme.text }}>
                {formatCount(stats.followers)}
              </p>
              <p
                className="profile-stat-label"
                style={{ color: theme.subText }}
              >
                Followers
              </p>
            </div>
            <div className="profile-stat-item">
              <p className="profile-stat-value" style={{ color: theme.text }}>
                {formatCount(stats.following)}
              </p>
              <p
                className="profile-stat-label"
                style={{ color: theme.subText }}
              >
                Following
              </p>
            </div>
          </div>

          {/* Interests */}
          {displayUser.interests?.length > 0 && (
            <div className="profile-interests-row">
              {displayUser.interests.map((interest) => (
                <Chip key={interest} label={interest} />
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="profile-tabs-row">
          {TABS.map((tab) => {
            const focused = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                className="profile-tab-btn"
                onClick={() => setActiveTab(tab.key)}
              >
                <p
                  className="profile-tab-text"
                  style={{ color: focused ? theme.text : theme.subText }}
                >
                  {tab.label}
                </p>
                {focused && (
                  <div
                    className="profile-tab-indicator"
                    style={{ backgroundColor: colors.peach }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Grid */}
        <div className="profile-content">{renderContent}</div>
      </div>
    </div>
  );
};

export default PublicProfileScreen;
