import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FiArrowLeft, FiShare2, FiHeart, FiMessageCircle, FiBookmark } from "react-icons/fi";
import { Avatar } from "../../components/Avatar";
import { useAppTheme } from "../../theme";
import { timeAgo } from "../../utils/time";
import { upsertUser } from "../../store/slices/usersSlice";
import {
  databases,
  APPWRITE_DATABASE_ID,
  COLLECTION_POSTS_ID,
} from "../../lib/Appwrite";
import "./PublicPostScreen.css";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop";

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

export const PublicPostScreen = () => {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { postId } = useParams();

  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadPost = async () => {
      if (!postId) {
        setError("Post not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const postDoc = await getPostById(postId);
        
        if (!postDoc) {
          setError("Post not found");
          setLoading(false);
          return;
        }

        if (postDoc.visibility && postDoc.visibility !== "public") {
          setError("This post is private");
          setLoading(false);
          return;
        }

        if (cancelled) return;

        setPost(postDoc);
        setLikeCount(postDoc.likes?.length || 0);
        setIsLiked(false);

        if (postDoc.userId) {
          try {
            const userDoc = await getUserById(postDoc.userId);
            if (!cancelled && userDoc) {
              setAuthor({
                id: userDoc.$id,
                name: userDoc.name ?? "Auri Friend",
                avatarUri: userDoc.avatarUri,
                bio: userDoc.bio,
                location: userDoc.location,
              });
              dispatch(upsertUser(userDoc));
            }
          } catch (userError) {
            console.warn("Failed to load author", userError);
          }
        }
      } catch (err) {
        console.error("Failed to load post", err);
        setError("Failed to load post");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPost();

    return () => {
      cancelled = true;
    };
  }, [dispatch, postId]);

  const handleBackPress = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/p/${postId}`;
    const shareText = post?.caption 
      ? `Check out this post on Auri\n\n${post.caption}\n\n${shareUrl}`
      : `Check out this post on Auri\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Post on Auri",
          text: shareText,
          url: shareUrl,
        });
      } catch (shareError) {
        navigator.clipboard.writeText(shareUrl);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  }, [postId, post?.caption]);

  const media = useMemo(() => {
    if (!post?.mediaUrl) return [];
    if (Array.isArray(post.mediaUrl)) {
      return post.mediaUrl
        .map((url, index) => {
          const uri = ensureMediaUriString(url);
          if (!uri) return null;
          return {
            type: Array.isArray(post?.mediaType) ? post.mediaType[index] : post?.mediaType || "image",
            uri,
          };
        })
        .filter(Boolean);
    }
    const uri = ensureMediaUriString(post.mediaUrl);
    return uri ? [{ type: "image", uri }] : [];
  }, [post?.mediaUrl, post?.mediaType]);

  const safeTags = useMemo(() => (Array.isArray(post?.tags) ? post.tags : []), [post?.tags]);
  const safeComments = useMemo(() => (Array.isArray(post?.comments) ? post.comments : []), [post?.comments]);
  const commentCount = post?.commentCount || safeComments.length;

  const displayAuthor = author || {
    name: "Auri Friend",
    avatarUri: DEFAULT_AVATAR,
  };

  if (loading) {
    return (
      React.createElement("div", {
        className: "public-post-container",
        style: { backgroundColor: theme.background }
      },
        React.createElement("div", { className: "public-post-header" },
          React.createElement("button", {
            className: "public-post-back-btn",
            onClick: handleBackPress,
            style: { color: theme.text }
          },
            React.createElement(FiArrowLeft, { size: 24 })
          ),
          React.createElement("h1", {
            className: "public-post-title",
            style: { color: theme.text }
          }, "Post"),
          React.createElement("div", { className: "public-post-spacer" })
        ),
        React.createElement("div", {
          className: "public-post-loading",
          style: { color: theme.text }
        },
          React.createElement("div", { className: "reel-spinner" }),
          React.createElement("p", null, "Loading post...")
        )
      )
    );
  }

  if (error) {
    return (
      React.createElement("div", {
        className: "public-post-container",
        style: { backgroundColor: theme.background }
      },
        React.createElement("div", { className: "public-post-header" },
          React.createElement("button", {
            className: "public-post-back-btn",
            onClick: handleBackPress,
            style: { color: theme.text }
          },
            React.createElement(FiArrowLeft, { size: 24 })
          ),
          React.createElement("h1", {
            className: "public-post-title",
            style: { color: theme.text }
          }, "Post"),
          React.createElement("div", { className: "public-post-spacer" })
        ),
        React.createElement("div", {
          className: "public-post-error",
          style: { color: theme.text }
        },
          React.createElement("p", null, error)
        )
      )
    );
  }

  return React.createElement(
    "div",
    { className: "public-post-container", style: { backgroundColor: theme.background } },
    React.createElement("div", { className: "public-post-header" },
      React.createElement("button", {
        className: "public-post-back-btn",
        onClick: handleBackPress,
        style: { color: theme.text }
      },
        React.createElement(FiArrowLeft, { size: 24 })
      ),
      React.createElement("h1", {
        className: "public-post-title",
        style: { color: theme.text }
      }, "Post"),
      React.createElement("button", {
        className: "public-post-share-btn",
        onClick: handleShare,
        style: { color: theme.text }
      },
        React.createElement(FiShare2, { size: 20 })
      )
    ),
    React.createElement("div", { className: "public-post-content" },
      React.createElement("div", { className: "public-post-author-row" },
        React.createElement(Avatar, { uri: displayAuthor.avatarUri, size: 44 }),
        React.createElement("div", { className: "public-post-author-details" },
          React.createElement("span", {
            className: "public-post-author-name",
            style: { color: theme.text }
          }, displayAuthor.name),
          React.createElement("span", {
            className: "public-post-timestamp",
            style: { color: theme.text, opacity: 0.7 }
          }, timeAgo(post?.$createdAt || post?.createdAt))
        )
      ),
      media.length > 0 && React.createElement(
        "div",
        { className: "public-post-media-container" },
        React.createElement("div", { className: "public-post-media-scroll" },
          media.map((item, idx) =>
            React.createElement("div", { key: idx, className: "public-post-media-item" },
              item.type?.includes("video")
                ? React.createElement("video", {
                    src: item.uri,
                    className: "public-post-media",
                    controls: true,
                    playsInline: true,
                    preload: "metadata"
                  })
                : React.createElement("img", {
                    src: item.uri,
                    alt: "media-" + idx,
                    className: "public-post-media",
                    loading: "lazy",
                    decoding: "async"
                  })
            )
          )
        )
      ),
      React.createElement("div", { className: "public-post-actions-row" },
        React.createElement("button", {
          className: "public-post-action",
          "aria-label": "Like"
        },
          React.createElement(FiHeart, {
            size: 20,
            color: isLiked ? "#ff4d4d" : theme.text,
            style: isLiked ? { fill: "#ff4d4d" } : {}
          }),
          React.createElement("span", {
            className: "public-post-action-text",
            style: { color: theme.text }
          }, likeCount)
        ),
        React.createElement("button", {
          className: "public-post-action",
          "aria-label": "Comment"
        },
          React.createElement(FiMessageCircle, { size: 20, color: theme.text }),
          React.createElement("span", {
            className: "public-post-action-text",
            style: { color: theme.text }
          }, commentCount)
        ),
        React.createElement("button", {
          className: "public-post-action",
          "aria-label": "Save"
        },
          React.createElement(FiBookmark, { size: 20, color: theme.text })
        ),
        React.createElement("button", {
          className: "public-post-action",
          onClick: handleShare,
          "aria-label": "Share"
        },
          React.createElement(FiShare2, { size: 20, color: theme.text })
        )
      ),
      (post?.text || post?.caption) && React.createElement(
        "p",
        { className: "public-post-caption", style: { color: theme.text } },
        React.createElement("span", {
          className: "public-post-caption-author",
          style: { color: theme.text }
        }, displayAuthor.name),
        " ",
        post.caption || post.text
      ),
      safeTags.length > 0 && React.createElement(
        "p",
        { className: "public-post-tags", style: { color: theme.text } },
        safeTags.map((t) => "#" + t).join(" ")
      )
    )
  );
};

export default PublicPostScreen;

