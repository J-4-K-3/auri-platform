import React, { useState, useMemo, useCallback } from "react";
import { FiX, FiHeart, FiMessageCircle, FiBookmark } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import { savePostForUser, unsavePostForUser } from "../../store/slices/savedPostsSlice";
import { selectSavedPosts } from "../../store";
import { spacing, colors } from "../../theme/tokens";
import { timeAgo } from "../../utils/time";

// Helper to extract URI string from various media formats
const ensureMediaUriString = (value) => {
  const coerce = (candidate) => {
    if (typeof candidate !== "string") {
      return null;
    }
    const trimmed = candidate.trim();
    if (!trimmed || trimmed === "[object Object]") {
      return null;
    }
    return trimmed;
  };

  const direct = coerce(value);
  if (direct) {
    return direct;
  }

  if (value && typeof value.uri === "string") {
    const uriString = coerce(value.uri);
    if (uriString) {
      return uriString;
    }
  }

  if (value && typeof value.url === "string") {
    const urlString = coerce(value.url);
    if (urlString) {
      return urlString;
    }
  }

  if (value && typeof value.href === "string") {
    const hrefString = coerce(value.href);
    if (hrefString) {
      return hrefString;
    }
  }

  return null;
};

export const PostDetailSidebarContent = ({ theme, onClose, post, user }) => {
  const dispatch = useDispatch();
  const authUserId = useSelector((state) => state.auth.userId);
  const savedPostsState = useSelector(selectSavedPosts);
  const [currentIndex, setCurrentIndex] = useState(0);

  const isSaved = useMemo(
    () => savedPostsState.allIds.includes(post?.id),
    [savedPostsState.allIds, post?.id],
  );

  const normalizedLikes = useMemo(() => {
    if (!post?.likes) return 0;
    if (Array.isArray(post.likes)) return post.likes.length;
    return 0;
  }, [post?.likes]);

  // Extract and normalize media items
  const mediaItems = useMemo(() => {
    if (!post) return [];

    // Try post.mediaUrl first (array of URLs)
    if (Array.isArray(post.mediaUrl)) {
      const normalized = post.mediaUrl
        .map((url) => {
          const uri = ensureMediaUriString(url);
          return uri ? { uri } : null;
        })
        .filter((item) => item && typeof item?.uri === "string");
      if (normalized.length > 0) {
        return normalized;
      }
    }

    // Try post.media (array of media objects)
    if (Array.isArray(post.media)) {
      const normalized = post.media
        .map((item) => {
          const uri = ensureMediaUriString(item);
          return uri ? { uri } : null;
        })
        .filter((item) => item && typeof item?.uri === "string");
      if (normalized.length > 0) {
        return normalized;
      }
    }

    // Fallback to single mediaUrl string
    if (typeof post.mediaUrl === "string") {
      const uri = ensureMediaUriString(post.mediaUrl);
      if (uri) {
        return [{ uri }];
      }
    }

    return [];
  }, [post]);

  const handleScroll = (event) => {
    const scrollLeft = event.target.scrollLeft;
    const itemWidth = event.target.clientWidth;
    const index = Math.round(scrollLeft / itemWidth);
    setCurrentIndex(index);
  };

  const handleSave = useCallback(() => {
    if (isSaved) {
      dispatch(unsavePostForUser({ userId: authUserId, postId: post.id }));
    } else {
      dispatch(savePostForUser({ userId: authUserId, post }));
    }
  }, [isSaved, dispatch, authUserId, post]);

  const handleComment = useCallback(() => {
    // For now, just close the sidebar - comments can be handled later
    onClose();
  }, [onClose]);

  if (!post) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: spacing.xl,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: spacing.xl,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: spacing.xs,
            }}
          >
            <FiX size={24} color={theme.text} />
          </button>
          <h2 style={{ color: theme.text, fontSize: 20, fontWeight: "600", margin: 0 }}>
            Post
          </h2>
          <div style={{ width: 24 }} />
        </div>
        <p style={{ color: theme.subText }}>Post not found</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        paddingTop: spacing.xl,
        paddingRight: spacing.xl,
        paddingLeft: spacing.xl,
        paddingBottom: spacing.sm, // reduce bottom whitespace
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.md,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: spacing.xs,
          }}
        >
          <FiX size={24} color={theme.text} />
        </button>
        <h2 style={{ color: theme.text, fontSize: 20, fontWeight: "600", margin: 0 }}>
          {user?.name?.split(" ")[0] || "Friend"}'s Post
        </h2>
        <div style={{ width: 24 }} />
      </div>

      {/* Content - Scrollable */}
      <style>{`
        .post-detail-content::-webkit-scrollbar { display: none; }
        .post-detail-content { scrollbar-width: none; -ms-overflow-style: none; }

        .media-gallery::-webkit-scrollbar { display: none; }
        .media-gallery { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
      <div
        className="post-detail-content"
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          /* remove extra gap; individual margins control spacing */
        }}
      >
        {/* Media Gallery */}
        <div
          style={{
            position: "relative",
            marginBottom: spacing.xs,
          }}
        >
          <div
            className="media-gallery"
            style={{
              display: "flex",
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              gap: spacing.sm,
              borderRadius: 12,
              scrollbarWidth: "none",
            }}
            onScroll={handleScroll}
          >
            {mediaItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  minWidth: "100%",
                  scrollSnapAlign: "start",
                  height: 300,
                }}
              >
                <img
                  src={item.uri}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    borderRadius: 12,
                    backgroundColor: "black",
                  }}
                />
              </div>
            ))}
          </div>

          {mediaItems.length > 1 && (
            <div
              style={{
                position: "absolute",
                top: spacing.md,
                right: spacing.md,
                backgroundColor: "rgba(0,0,0,0.4)",
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: 8,
              }}
            >
              <span style={{ color: "white", fontWeight: "600", fontSize: 12 }}>
                {currentIndex + 1}/{mediaItems.length}
              </span>
            </div>
          )}
        </div>

        {/* Caption */}
        {post.caption || post.text ? (
          <p
            style={{
              color: theme.text,
              fontSize: 15,
              lineHeight: 22,
              fontWeight: "500",
              marginBottom: spacing.xs,
            }}
          >
            {post.caption || post.text}
          </p>
        ) : null}

        {/* Stats Row */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.sm,
            backgroundColor: theme.border,
            borderRadius: 12,
            marginBottom: spacing.xs,
            gap: spacing.sm,
          }}
        >
          <button
            onClick={() => {}}
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing.xs,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: spacing.sm,
            }}
          >
            <FiHeart size={20} color={colors.peach} />
            <span style={{ color: theme.text, fontWeight: "700", fontSize: 14 }}>
              {normalizedLikes}
            </span>
          </button>

          <button
            onClick={handleComment}
            style={{
              display: "flex",
              alignItems: "center",
              gap: spacing.xs,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: spacing.sm,
            }}
          >
            <FiMessageCircle size={20} color={colors.peach} />
            <span style={{ color: theme.text, fontWeight: "700", fontSize: 14 }}>
              {post.commentCount || 0}
            </span>
          </button>

          <button
            onClick={handleSave}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: spacing.sm,
            }}
          >
            <FiBookmark
              size={20}
              color={isSaved ? colors.peach : theme.text}
              fill={isSaved ? colors.peach : "none"}
            />
          </button>
        </div>

        {/* Timestamp */}
        <p style={{ color: theme.subText, fontSize: 13, fontWeight: "400" }}>
          {timeAgo(post.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default PostDetailSidebarContent;

