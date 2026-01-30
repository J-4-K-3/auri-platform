import React, { useState, useMemo, useCallback, memo } from "react";
import { useSelector } from "react-redux";
import {
  FiHeart,
  FiMessageCircle,
  FiBookmark,
  FiShare2,
  FiMoreHorizontal,
  FiX,
} from "react-icons/fi";
import { Avatar } from "./Avatar";
import { useAppTheme } from "../theme";
import { timeAgo } from "../utils/time";
import { toggleLike } from "../lib/postsApi";
import CommentsPopup from "../screen/home/CommentsPopup";
import "./PostCard.css";

const DEFAULT_AVATAR =
  "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg";

const ensureMediaUriString = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed && trimmed !== "[object Object]" ? trimmed : null;
  }
  if (typeof value.uri === "string") return value.uri;
  if (typeof value.url === "string") return value.url;
  if (typeof value.href === "string") return value.href;
  return null;
};

const PostCardContent = memo(function PostCardContent({
  post,
  author,
  onCommentPress,
  onShare,
  onDonate,
  theme,
  isLiked = false,
  likeCount = 0,
  onLike,
}) {
  const [menuVisible, setMenuVisible] = useState(false);

  const media = useMemo(() => {
    if (!post?.mediaUrl) return [];
    if (Array.isArray(post.mediaUrl)) {
      return post.mediaUrl
        .map((url, index) => {
          const uri = ensureMediaUriString(url);
          if (!uri) return null;
          return {
            type: Array.isArray(post?.mediaType)
              ? post.mediaType[index]
              : post?.mediaType || "image",
            uri,
          };
        })
        .filter(Boolean);
    }
    const uri = ensureMediaUriString(post.mediaUrl);
    return uri ? [{ type: "image", uri }] : [];
  }, [post?.mediaUrl, post?.mediaType]);

  const displayAuthor = author || {
    name: "Auri Friend",
    avatarUri: DEFAULT_AVATAR,
  };
  const safeLikes = useMemo(
    () => (Array.isArray(post?.likes) ? post.likes : []),
    [post?.likes],
  );
  const safeTags = useMemo(
    () => (Array.isArray(post?.tags) ? post.tags : []),
    [post?.tags],
  );
  const safeComments = useMemo(
    () => (Array.isArray(post?.comments) ? post.comments : []),
    [post?.comments],
  );
  const commentCount = post?.commentCount || safeComments.length;

  const handleMenuOpen = useCallback(() => setMenuVisible(true), []);
  const handleMenuClose = useCallback(() => setMenuVisible(false), []);
  const handleSave = useCallback(() => {}, []);

  // Share handler for the share button
  const handleShare = useCallback(async () => {
    if (!post?.id) return;
    
    const shareUrl = `${window.location.origin}/p/${post.id}`;
    const shareText = post?.caption 
      ? `Check out this post on Auri 🌿\n\n${post.caption}\n\n${shareUrl}`
      : `Check out this post on Auri 🌿\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Post on Auri",
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
  }, [post?.id, post?.caption]);

  const menuOptions = useMemo(
    () => [
      { key: "copy", label: "Copy link", action: () => navigator.clipboard.writeText(`${window.location.origin}/p/${post?.id}`) },
      {
        key: "report",
        label: "Report post",
        action: () => {},
        destructive: true,
      },
    ],
    [post?.id],
  );

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "div",
      { className: "postcard-top-row" },
      React.createElement(
        "div",
        { className: "postcard-user-info" },
        React.createElement(Avatar, { uri: displayAuthor.avatarUri, size: 44 }),
        React.createElement(
          "div",
          { className: "postcard-user-details" },
          React.createElement(
            "span",
            { className: "postcard-user-name", style: { color: theme.text } },
            displayAuthor.name,
          ),
          React.createElement(
            "span",
            { className: "postcard-timestamp", style: { color: theme.text, opacity: 0.70 } },
            timeAgo(post?.$createdAt || post?.createdAt),
          ),
        ),
      ),
      React.createElement(
        "button",
        {
          className: "postcard-kebab",
          onClick: handleMenuOpen,
          "aria-label": "More options",
        },
        React.createElement(FiMoreHorizontal, { size: 20, color: theme.text }),
      ),
    ),
    media.length > 0 &&
      React.createElement(
        "div",
        {
          className: `postcard-media-container ${media.length === 1 ? "single-media" : "multi-media"}`,
        },
        React.createElement(
          "div",
          { className: "postcard-media-scroll" },
          media.map((item, idx) =>
            React.createElement(
              "div",
              { key: idx, className: "postcard-media-item" },
              item.type?.includes("video")
                ? React.createElement("video", {
                    src: item.uri,
                    className: "postcard-media",
                    controls: true,
                    playsInline: true,
                    preload: "metadata",
                  })
                : React.createElement("img", {
                    src: item.uri,
                    loading: "lazy",
                    alt: `media-${idx}`,
                    className: "postcard-media",
                    decoding: "async",
                  }),
            ),
          ),
        ),
      ),
    React.createElement(
      "div",
      { className: "postcard-bottom-block" },
      React.createElement(
        "div",
        { className: "postcard-actions-row" },
        React.createElement(
          "button",
          {
            className: "postcard-action",
            onClick: onLike,
            "aria-label": "Like",
          },
          React.createElement(FiHeart, { 
            size: 20, 
            color: isLiked ? "#ff4d4d" : theme.text,
            style: isLiked ? { fill: "#ff4d4d" } : {}
          }),
          React.createElement(
            "span",
            { className: "postcard-action-text", style: { color: theme.text } },
            likeCount || safeLikes.length,
          ),
        ),
        React.createElement(
          "button",
          {
            className: "postcard-action",
            onClick: onCommentPress,
            "aria-label": "Comment",
          },
          React.createElement(FiMessageCircle, { size: 20, color: theme.text }),
          React.createElement(
            "span",
            { className: "postcard-action-text", style: { color: theme.text } },
            commentCount,
          ),
        ),
        React.createElement(
          "button",
          {
            className: "postcard-action",
            onClick: handleSave,
            "aria-label": "Save",
          },
          React.createElement(FiBookmark, { size: 20, color: theme.text }),
        ),
        React.createElement(
          "button",
          {
            className: "postcard-action",
            onClick: handleShare,
            "aria-label": "Share",
          },
          React.createElement(FiShare2, { size: 20, color: theme.text }),
        ),
        post?.donationsEnabled &&
          React.createElement(
            "button",
            {
              className: "postcard-donate",
              onClick: () => onDonate?.(post),
            },
            "Donate",
          ),
      ),
      (post?.text || post?.caption) &&
        React.createElement(
          "p",
          { className: "postcard-caption", style: { color: theme.text } },
          post.caption || post.text,
        ),
      safeTags.length > 0 &&
        React.createElement(
          "p",
          { className: "postcard-tags" },
          safeTags.map((t) => `#${t}`).join(" "),
        ),
    ),
    React.createElement(
      "div",
      {
        className: `postcard-menu-overlay ${menuVisible ? "visible" : ""}`,
        onClick: handleMenuClose,
      },
      React.createElement(
        "div",
        {
          className: "postcard-menu-container",
          onClick: (e) => e.stopPropagation(),
        },
        menuOptions.map((option) =>
          React.createElement(
            "button",
            {
              key: option.key,
              className: `postcard-menu-item ${option.destructive ? "danger" : ""}`,
              onClick: () => {
                option.action();
                handleMenuClose();
              },
            },
            option.label,
          ),
        ),
        React.createElement(
          "button",
          {
            className: "postcard-menu-close",
            onClick: handleMenuClose,
          },
          React.createElement(FiX, { size: 20 }),
        ),
      ),
    ),
  );
});

export const PostCard = memo(function PostCard({
  post,
  author,
  onCommentPress,
  onShare,
  onDonate,
}) {
  const theme = useAppTheme();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const authUserId = useSelector((state) => state.auth.userId);
  
  const [isLiked, setIsLiked] = useState(() => {
    if (!authUserId || !post?.likes) return false;
    return post.likes.includes(authUserId);
  });
  
  const [likeCount, setLikeCount] = useState(() => {
    return post?.likes?.length || 0;
  });

  const handleCommentPress = useCallback(() => {
    setIsCommentsOpen(true);
  }, []);

  const handleCloseComments = useCallback(() => {
    setIsCommentsOpen(false);
  }, []);

  const handleLike = useCallback(async () => {
    if (!authUserId) {
      alert("Please sign in to like posts");
      return;
    }

    // Optimistic update
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount((prev) => (newIsLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await toggleLike(post.id, authUserId);
    } catch (error) {
      // Revert on error
      setIsLiked(isLiked);
      setLikeCount(post?.likes?.length || 0);
      console.warn("Like failed:", error);
    }
  }, [authUserId, post?.id, post?.likes, isLiked]);

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "div",
      {
        className: "postcard-card",
        style: { background: theme.background },
      },
      React.createElement(PostCardContent, {
        post: { ...post, likes: post?.likes || [] },
        author,
        onCommentPress: handleCommentPress,
        onShare,
        onDonate,
        theme,
        isLiked,
        likeCount,
        onLike: handleLike,
      }),
    ),
    React.createElement(CommentsPopup, {
      isOpen: isCommentsOpen,
      onClose: handleCloseComments,
      post,
    }),
  );
});

export default PostCard;
