import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FiBell,
  FiSearch,
  FiShoppingBag,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { StoryRing } from "../../components/StoryRing";
import { PostCard } from "../../components/PostCard";
import { useAppTheme } from "../../theme";
import { spacing, colors } from "../../theme/tokens";
import {
  CreateSidebarContent,
  SearchSidebarContent,
  NotificationsSidebarContent,
  ShopSidebarContent,
  DefaultSidebarContent,
} from "./SidebarContent";
import { getCurrentUser } from "../../lib/Auth";
import { getPostsByUserIds } from "../../lib/postsApi";
import { listUsersByIds } from "../../lib/usersApi";
import { upsertUser } from "../../store/slices/usersSlice";
import "./HomeScreen.css";

// Default avatar from mobile code
const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop";

export const HomeScreen = () => {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  
  // Redux state - same as mobile
  const { userId, isAuthenticated } = useSelector((state) => state.auth);
  const { byId: usersById } = useSelector((state) => state.users);
  
  // Local state
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  // Current user profile from Redux - same as mobile
  const currentUser = useMemo(() => {
    if (userId && usersById[userId]) {
      return usersById[userId];
    }
    return null;
  }, [userId, usersById]);

  // Feed user IDs - exactly like mobile
  const feedUserIds = useMemo(() => {
    const followingIds = Array.isArray(currentUser?.following)
      ? currentUser.following.filter(
          (id) => typeof id === "string" && id.trim().length > 0
        )
      : [];
    const uniqueIds = new Set(followingIds);
    if (typeof userId === "string" && userId.trim().length > 0) {
      uniqueIds.add(userId);
    }
    return Array.from(uniqueIds);
  }, [currentUser?.following, userId]);

  // Initialize user on mount - same as mobile
  useEffect(() => {
    const initUser = async () => {
      try {
        // Check if user is logged in via Appwrite
        const appwriteUser = await getCurrentUser();
        
        if (appwriteUser?.$id) {
          // User is logged in - add to Redux if not there
          if (!usersById[appwriteUser.$id]) {
            dispatch(
              upsertUser({
                id: appwriteUser.$id,
                name: appwriteUser.name ?? "Auri Friend",
                email: appwriteUser.email,
                avatarUri: appwriteUser.avatarUri ?? null,
                bio: appwriteUser.bio,
                location: appwriteUser.location ?? appwriteUser.city,
                status: appwriteUser.status,
                interests: Array.isArray(appwriteUser.interests) ? appwriteUser.interests : [],
                followers: Array.isArray(appwriteUser.followers) ? appwriteUser.followers : [],
                following: Array.isArray(appwriteUser.following) ? appwriteUser.following : [],
                age: appwriteUser.age,
              })
            );
          }
        }
      } catch (err) {
        console.warn("initUser error:", err);
      }
    };

    initUser();
  }, [dispatch, usersById]);

  // Fetch posts based on followed users + own posts - same as mobile
  useEffect(() => {
    const fetchPosts = async () => {
      if (!feedUserIds.length) {
        setPosts([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        // Fetch posts from followed users + own posts
        const fetchedPosts = await getPostsByUserIds(feedUserIds, 50);
        setPosts(fetchedPosts || []);
        
        // Ensure authors are in Redux - same as mobile
        if (fetchedPosts?.length) {
          const candidateIds = [...new Set(
            fetchedPosts
              .map((doc) => doc?.userId)
              .filter((value) => typeof value === "string" && value.length > 0)
          )];
          
          const missing = candidateIds.filter((id) => !usersById[id]);
          if (missing.length) {
            try {
              const fetchedUsers = await listUsersByIds(missing);
              fetchedUsers.forEach((doc) => {
                dispatch(
                  upsertUser({
                    id: doc.$id,
                    name: doc.name ?? doc.displayName ?? doc.email ?? "Auri Friend",
                    email: doc.email,
                    avatarUri: doc.avatarUri,
                    bio: doc.bio,
                    location: doc.location ?? doc.city,
                    status: doc.status,
                    interests: Array.isArray(doc.interests) ? doc.interests : [],
                    followers: Array.isArray(doc.followers) ? doc.followers : [],
                    following: Array.isArray(doc.following) ? doc.following : [],
                    age: doc.age,
                  })
                );
              });
            } catch (error) {
              console.warn("Unable to fetch author profiles", error);
            }
          }
        }
      } catch (err) {
        console.warn("fetchPosts error:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [feedUserIds, dispatch, usersById]);

  // Check if popup should be shown for first-time users
  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('auri_web_popup_shown');
    if (!hasSeenPopup) {
      setShowPopup(true);
    }
  }, []);

  // Story entries - same logic as mobile
  const storyEntries = useMemo(() => {
    const entries = [];
    
    // Add current user's story placeholder
    if (userId) {
      const userAvatar = currentUser?.avatarUri ?? DEFAULT_AVATAR;
      entries.push({
        id: `placeholder-${userId}`,
        userId: userId,
        items: [],
        avatarUri: userAvatar,
        name: currentUser?.name ?? "You",
      });
    }
    
    return entries;
  }, [userId, currentUser]);

  const handleNotificationsPress = useCallback(() => {
    setActiveSidebar((prev) =>
      prev === "notifications" ? null : "notifications",
    );
  }, []);

  const handleSearchPress = useCallback(() => {
    setActiveSidebar((prev) => (prev === "search" ? null : "search"));
  }, []);

  const handleShopPress = useCallback(() => {
    setActiveSidebar((prev) => (prev === "shop" ? null : "shop"));
  }, []);

  const handleCreatePress = useCallback(() => {
    setActiveSidebar((prev) => (prev === "create" ? null : "create"));
  }, []);

  const closeSidebar = useCallback(() => {
    setActiveSidebar(null);
  }, []);

  const closePopup = useCallback(() => {
    setShowPopup(false);
    localStorage.setItem('auri_web_popup_shown', 'true');
  }, []);

  // Render story item - same as mobile, gets avatar from Redux user
  const renderStoryItem = useCallback(
    (story) => {
      // Same as mobile: get user from Redux for avatar
      const storyUser =
        usersById[story.userId] ??
        (story.userId === userId ? currentUser : undefined);
      const displayName = storyUser?.name ?? story.name ?? "Friend";
      const avatarUri =
        storyUser?.avatarUri ?? story.avatarUri ?? DEFAULT_AVATAR;
      
      const isCurrentUser = story.userId === userId;
      
      return (
        <div key={story.id || story.userId} className="homescreen-story-item">
          <StoryRing
            uri={avatarUri}
            size={72}
            isCurrentUser={isCurrentUser}
            showPlus={
              isCurrentUser && (!story.items || story.items.length === 0)
            }
          />
          <span className="homescreen-story-label" style={{ color: theme.text }}>
            {displayName.split(" ")[0]}
          </span>
        </div>
      );
    },
    [userId, currentUser, usersById]
  );

  // Get author info for a post - same as mobile
  const getPostAuthor = useCallback((post) => {
    if (!post?.userId) {
      return { name: "Auri Friend", avatarUri: DEFAULT_AVATAR };
    }
    
    // Same as mobile: check Redux first
    if (usersById[post.userId]) {
      return usersById[post.userId];
    }
    
    return {
      id: post.userId,
      name: "Auri Friend",
      avatarUri: DEFAULT_AVATAR,
    };
  }, [usersById]);

  // Check if we have posts to display
  const hasPosts = posts.length > 0;

  // Check if user is logged in
  const isLoggedIn = Boolean(userId);

  return (
    <div
      className="homescreen-container"
      style={{ backgroundColor: theme.background }}
    >
      {/* Main Content Area - 70% */}
      <div className="homescreen-main">
        {/* Header */}
        <div className="homescreen-header">
          <div className="homescreen-header-row">
            <h1 className="homescreen-wordmark" style={{ color: theme.text }}>
              Auri
            </h1>
            <div className="homescreen-header-actions">
              <button
                className="homescreen-icon-button"
                style={{ backgroundColor: theme.card }}
                onClick={handleNotificationsPress}
              >
                <FiBell size={20} color={theme.text} />
              </button>
              <button
                className="homescreen-icon-button"
                style={{ backgroundColor: theme.card }}
                onClick={handleSearchPress}
              >
                <FiSearch size={20} color={theme.text} />
              </button>
              <button
                className="homescreen-icon-button"
                style={{ backgroundColor: theme.card }}
                onClick={handleShopPress}
              >
                <FiShoppingBag size={20} color={theme.text} />
              </button>
              <button
                className="homescreen-icon-button"
                style={{ backgroundColor: colors.peach }}
                onClick={handleCreatePress}
              >
                <FiPlus size={20} color={colors.white} />
              </button>
            </div>
          </div>

          {/* Stories Section */}
          {storyEntries.length > 0 && (
            <div className="homescreen-stories-section">
              <h2
                className="homescreen-section-title"
                style={{ color: theme.text }}
              >
                Stories
              </h2>
              <div className="homescreen-stories-row">
                {storyEntries.map(renderStoryItem)}
              </div>
            </div>
          )}
        </div>

        {/* Posts Feed */}
        <div className="homescreen-feed">
          {loading ? (
            <div className="homescreen-empty-state">
              <p style={{ color: theme.subText }}>Loading...</p>
            </div>
          ) : !isLoggedIn ? (
            <div className="homescreen-empty-state">
              <h3 style={{ color: theme.text }}>Welcome to Auri</h3>
              <p style={{ color: theme.subText }}>
                Please login or create an account to see posts.
              </p>
            </div>
          ) : hasPosts ? (
            posts.map((post) => (
              <PostCard
                key={post.id || post.$id}
                post={post}
                author={getPostAuthor(post)}
                onCommentPress={() => console.log("Comment on", post.id)}
                onShare={() => console.log("Share", post.id)}
                onDonate={() => console.log("Donate to", post.userId)}
              />
            ))
          ) : (
            <div className="homescreen-empty-state">
              <h3 style={{ color: theme.text }}>No feeds to display</h3>
              <p style={{ color: theme.subText }}>
                Tap the + on top to create and share something new or explore what
                Auri has to offer
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - 30% */}
      <div
        className={`homescreen-sidebar ${activeSidebar ? "active" : ""} ${activeSidebar ? "fullscreen" : ""}`}
        style={{ backgroundColor: theme.card }}
      >
        {activeSidebar &&
          activeSidebar !== "notifications" &&
          activeSidebar !== "search" &&
          activeSidebar !== "shop" &&
          activeSidebar !== "create" && (
            <div className="homescreen-sidebar-header">
              <h2 style={{ color: theme.text }}>
                {activeSidebar
                  ? activeSidebar.charAt(0).toUpperCase() +
                    activeSidebar.slice(1)
                  : "Auri"}
              </h2>
              {activeSidebar && (
                <button
                  className="homescreen-sidebar-close"
                  onClick={closeSidebar}
                >
                  <FiX size={24} color={theme.text} />
                </button>
              )}
            </div>
          )}
        {activeSidebar === "notifications" && (
          <div className="homescreen-notifications-container">
            <div className="homescreen-notifications-header">
              <button
                className="homescreen-notifications-back-btn"
                onClick={closeSidebar}
              >
                <FiX size={18} color={theme.text} />
              </button>
              <h2
                className="homescreen-notifications-title"
                style={{ color: theme.text }}
              >
                Notifications
              </h2>
              <div className="homescreen-notifications-spacer" />
            </div>

            <div className="homescreen-notifications-action-row">
              <button
                className="homescreen-notifications-action-btn"
                onClick={() => console.log("Mark all as read")}
              >
                <p className="homescreen-notifications-action-text">
                  Mark all read
                </p>
              </button>
              <button
                className="homescreen-notifications-action-btn"
                onClick={() => console.log("Clear all notifications")}
              >
                <p className="homescreen-notifications-action-text">
                  Clear all
                </p>
              </button>
            </div>

            <NotificationsSidebarContent theme={theme} onClose={closeSidebar} />
          </div>
        )}
        {activeSidebar === "search" && (
          <SearchSidebarContent
            theme={theme}
            onUserPress={(user) => console.log("User pressed:", user.id)}
            onClose={closeSidebar}
          />
        )}
        {activeSidebar === "shop" && (
          <ShopSidebarContent theme={theme} onClose={closeSidebar} />
        )}
        {activeSidebar === "create" && (
          <CreateSidebarContent theme={theme} onClose={closeSidebar} />
        )}
        {!activeSidebar && <DefaultSidebarContent theme={theme} />}
      </div>

      {/* First-Time User Popup */}
      {showPopup && (
        <div className="homescreen-popup-overlay" onClick={closePopup}>
          <div className="homescreen-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="homescreen-popup-header">
              <h2 className="homescreen-popup-title">Welcome to Auri v2!</h2>
              <button className="homescreen-popup-close-btn" onClick={closePopup}>
                <FiX size={20} />
              </button>
            </div>
            <div className="homescreen-popup-body">
              <p>
                Hey there! We're excited to have you here. Auri version 2 is now live, and we're hard at work building out the web experience.
              </p>
              <p>
                Some features, buttons, or screens might not be fully working yet as we're actively developing and improving them. We're putting in the effort to make everything awesome for you!
              </p>
              <p>
                Thanks for your patience and for being part of our community. Let's create some amazing memories together.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;

