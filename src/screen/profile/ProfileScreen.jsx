import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FiEdit3,
  FiSettings,
  FiShoppingBag,
  FiGrid,
  FiFilm,
  FiBookmark,
  FiUsers,
  FiImage,
  FiPlay,
  FiMapPin,
  FiShare2,
} from "react-icons/fi";
import { MdVerified } from "react-icons/md"
import { Avatar } from "../../components/Avatar";
import { Chip } from "../../components/Chip";
import { Button } from "../../components/Button";
import { useAppTheme } from "../../theme";
import { spacing, colors } from "../../theme/tokens";
import { EditProfileSidebarContent } from "./EditProfileSidebarContent";
import { StoreCenterSidebarContent } from "./StoreCenterSidebarContent";
import { SettingsSidebarContent } from "./SettingsSidebarContent";
import "./ProfileScreen.css";
// Import API functions
import { getUserById } from "../../lib/usersApi";
import { getPostsByUser } from "../../lib/postsApi";
import { listReels, mapReelDocument } from "../../lib/reelsApi";
import { fetchBookmarksForUser } from "../../lib/postsApi";
// Import Redux actions
import { upsertUser } from "../../store/slices/usersSlice";
import { hydratePosts } from "../../store/slices/postsSlice";
import { hydrateSavedPostsFromRemote } from "../../store/slices/savedPostsSlice";
import { selectSavedPosts } from "../../store";
// Import Appwrite constants
import {
  databases,
  APPWRITE_DATABASE_ID,
  COLLECTION_POSTS_ID,
  COLLECTION_REELS_ID,
  Query,
} from "../../lib/Appwrite";

const TABS = [
  { key: "media", label: "Media", icon: FiGrid },
  { key: "reels", label: "Reels", icon: FiFilm },
  { key: "saved", label: "Saved", icon: FiBookmark },
  { key: "connections", label: "Connections", icon: FiUsers },
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

export const ProfileScreen = () => {
  const theme = useAppTheme();
  const dispatch = useDispatch();

  // User identification
  const authUserId = useSelector((state) => state.auth.userId);
  const viewedUserId = authUserId; // For now, always show own profile
  const viewedUser = useSelector((state) => state.users.byId[viewedUserId]);
  const currentUser = useSelector((state) => state.users.byId[authUserId]);
  const postsState = useSelector((state) => state.posts);
  const savedPostsState = useSelector(selectSavedPosts);

  const [activeTab, setActiveTab] = useState("media");
  const [activeSidebar, setActiveSidebar] = useState(null);

   // Loading states
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingReels, setLoadingReels] = useState(false);
  
  // Data states
  const [userReels, setUserReels] = useState([]);

  // Edit Profile State
  const [editUser, setEditUser] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  // Settings State
  const [settingsState, setSettingsState] = useState({
    notifications: true,
    darkMode: true,
    privacy: "friends",
  });

  const isOwnProfile = viewedUserId === authUserId;
  const availableTabs = useMemo(() => {
    return TABS.filter((tab) => {
      if (tab.key === "saved") {
        return isOwnProfile;
      }
      return true;
    });
  }, [isOwnProfile]);

  useEffect(() => {
    if (!availableTabs.some((tab) => tab.key === activeTab)) {
      const fallback = availableTabs[0]?.key ?? "media";
      setActiveTab(fallback);
    }
  }, [availableTabs, activeTab]);

  // Hydrate profile data
  useEffect(() => {
    let cancelled = false;

    const hydrateProfile = async () => {
      if (!viewedUserId || viewedUser) {
        return;
      }

      try {
        setLoadingProfile(true);
        const doc = await getUserById(viewedUserId);
        if (!doc || cancelled) return;
        dispatch(upsertUser(doc));
      } catch (error) {
        // Profile load failed - continue with empty state
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
  }, [dispatch, viewedUser, viewedUserId]);

  // Load posts
  useEffect(() => {
    let cancelled = false;

    const loadPosts = async () => {
      if (!viewedUserId) {
        return;
      }

      try {
        setLoadingPosts(true);
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTION_POSTS_ID,
          [
            Query.equal("userId", viewedUserId),
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
  }, [dispatch, viewedUserId]);

  // Load reels
  useEffect(() => {
    let cancelled = false;

    const loadReels = async () => {
      if (!viewedUserId) {
        return;
      }

      try {
        setLoadingReels(true);
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTION_REELS_ID,
          [
            Query.equal("userId", viewedUserId),
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
  }, [viewedUserId]);

  // Load bookmarks when saved tab is active
  useEffect(() => {
    let cancelled = false;

    const loadBookmarks = async () => {
      if (!isOwnProfile || !authUserId) {
        return;
      }

      if (activeTab !== "saved") {
        return;
      }

      try {
        console.log("[ProfileScreen] Fetching bookmarks from Appwrite for user:", authUserId);
        const bookmarks = await fetchBookmarksForUser({ userId: authUserId });
        
        if (cancelled) {
          return;
        }

        console.log("[ProfileScreen] Fetched bookmarks:", bookmarks.length);
        
        dispatch(hydrateSavedPostsFromRemote({
          userId: authUserId,
          bookmarks,
        }));
      } catch (error) {
        console.error("Unable to load bookmarks", error);
      }
    };

    loadBookmarks();

    return () => {
      cancelled = true;
    };
  }, [activeTab, isOwnProfile, authUserId, dispatch]);

  // Initialize edit user state
  useEffect(() => {
    if (viewedUser && !editUser) {
      setEditUser(viewedUser);
    }
  }, [viewedUser, editUser]);

  const profilePosts = useMemo(() => {
    return postsState.allIds
      .map((id) => postsState.byId[id])
      .filter(
        (post) =>
          post &&
          post.userId === viewedUserId &&
          (post.archived === undefined || post.archived === false),
      )
      .sort((a, b) => {
        const aDate = new Date(a.$createdAt || a.createdAt || 0).getTime();
        const bDate = new Date(b.$createdAt || b.createdAt || 0).getTime();
        return bDate - aDate;
      });
  }, [postsState, viewedUserId]);

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
        id: viewedUserId,
        name: "Auri Friend",
        avatarUri: null,
        bio: "",
        location: "",
        interests: [],
        status: "",
        links: {},
      },
    [viewedUser, viewedUserId],
  );

  const handleEditProfile = useCallback(() => {
    setActiveSidebar((prev) => (prev === "editProfile" ? null : "editProfile"));
  }, []);

  const handleSettingsPress = useCallback(() => {
    setActiveSidebar((prev) => (prev === "settings" ? null : "settings"));
  }, []);

  const handleStorePress = useCallback(() => {
    setActiveSidebar((prev) => (prev === "store" ? null : "store"));
  }, []);

  const handleSharePress = useCallback(async () => {
    const shareUrl = `${window.location.origin}/u/${authUserId}`;
    const shareText = `Check out my profile on Auri 🌿\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Auri Profile",
          text: shareText,
          url: shareUrl,
        });
      } catch (shareError) {
        navigator.clipboard.writeText(shareUrl);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  }, [authUserId]);

  const closeSidebar = useCallback(() => {
    setActiveSidebar(null);
  }, []);


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
    if (activeTab === "saved") {
      const savedPosts = savedPostsState.allIds
        .map((id) => savedPostsState.byId[id])
        .filter((post) => post);

      console.log(
        "[ProfileScreen] renderContent: saved tab - allIds:",
        savedPostsState.allIds,
        "posts:",
        savedPosts,
      );

      if (!savedPosts.length) {
        return renderPlaceholder(
          <FiBookmark size={36} />,
          "Saved posts will appear here"
        );
      }

      return (
        <div className="profile-grid">
          {savedPosts.map((post) => {
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
          <FiFilm size={36} />,
          "Reels will appear here"
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
                  <FiPlay size={16} color={colors.white} />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === "connections") {
      return renderPlaceholder(
        <FiUsers size={36} />,
        "Connections will appear here"
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
          <FiImage size={36} />,
          "Posts you share will show up here"
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
    savedPostsState,
    userReels,
    loadingReels,
    loadingPosts,
    profilePosts,
    theme.subText,
  ]);

  const renderSidebarContent = () => {
    switch (activeSidebar) {
      case "editProfile":
        return (
          <EditProfileSidebarContent
            theme={theme}
            onClose={closeSidebar}
            user={editUser}
            saving={editSaving}
            onSave={async () => {
              setEditSaving(true);
              await new Promise((r) => setTimeout(r, 1000));
              setEditSaving(false);
              closeSidebar();
            }}
            onNameChange={(v) => setEditUser((p) => ({ ...p, name: v }))}
            onBioChange={(v) => setEditUser((p) => ({ ...p, bio: v }))}
            onLocationChange={(v) =>
              setEditUser((p) => ({ ...p, location: v }))
            }
            onStatusChange={(v) => setEditUser((p) => ({ ...p, status: v }))}
            onLinkChange={(k, v) =>
              setEditUser((p) => ({ ...p, links: { ...p.links, [k]: v } }))
            }
            onToggleInterest={(i) =>
              setEditUser((p) => ({
                ...p,
                interests: p.interests?.includes(i)
                  ? p.interests.filter((x) => x !== i)
                  : [...(p.interests || []), i],
              }))
            }
            onUpdateAvatar={() => {}}
          />
        );
      case "store":
        return (
          <StoreCenterSidebarContent theme={theme} onClose={closeSidebar} />
        );
      case "settings":
        return (
          <SettingsSidebarContent
            theme={theme}
            onClose={closeSidebar}
            notifications={settingsState.notifications}
            darkMode={settingsState.darkMode}
            privacy={settingsState.privacy}
            onNotificationsChange={(v) =>
              setSettingsState((p) => ({ ...p, notifications: v }))
            }
            onDarkModeChange={(v) =>
              setSettingsState((p) => ({ ...p, darkMode: v }))
            }
            onPrivacyChange={(v) =>
              setSettingsState((p) => ({ ...p, privacy: v }))
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="profile-container"
      style={{ backgroundColor: theme.background }}
    >
      {/* Main Content Area - 70% */}
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
            {displayUser.name} {displayUser.verified && <MdVerified size={24} color="#FF8A65" />}
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

          {/* Action Buttons */}
          <div className="profile-buttons-row">
            <button
              className="profile-primary-button"
              onClick={handleEditProfile}
              style={{ backgroundColor: colors.peach }}
            >
              <FiEdit3 size={18} color={colors.white} />
              <span>Edit Profile</span>
            </button>

            <button
              className="profile-secondary-button"
              onClick={handleSettingsPress}
            >
              <FiSettings size={18} color={theme.text} />
              <span style={{ color: theme.text }}>Settings</span>
            </button>

            <button
              className="profile-secondary-button"
              onClick={handleStorePress}
            >
              <FiShoppingBag size={18} color={theme.text} />
              <span style={{ color: theme.text }}>Store Center</span>
            </button>

            {/*<button
              className="profile-secondary-button"
              onClick={handleSharePress}
            >
              <FiShare2 size={18} color={theme.text} />
              <span style={{ color: theme.text }}>Share</span>
            </button>*/}
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
          {availableTabs.map((tab) => {
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

{/* Sidebar - 30% */}
      <div
        className={`profile-sidebar ${activeSidebar ? "active" : ""} ${activeSidebar ? "fullscreen" : ""}`}
        style={{ backgroundColor: theme.card }}
      >
        {activeSidebar && renderSidebarContent()}
      </div>
    </div>
  );
};

export default ProfileScreen;