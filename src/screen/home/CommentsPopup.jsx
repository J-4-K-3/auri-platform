import React, { useState, useCallback, useEffect } from "react";
import { FiX, FiMessageCircle, FiCopy, FiFlag } from "react-icons/fi";
import { useSelector } from "react-redux";
import { useAppTheme } from "../../theme";
import { selectPosts } from "../../store";
import { fetchCommentsByPost, createCommentRemote, updateCommentReaction, copyCommentText } from "../../lib/postsApi";
import { IDs } from "../../lib/Appwrite";
import { timeAgo } from "../../utils/time";
import "./CommentsPopup.css";

// Emoji assets - using simple emoji characters for web
const emojiAssets = {
  heart: "❤️",
  dislike: "👎",
  laugh: "😂",
  wow: "😮",
};

// Reaction button component
const ReactionButton = ({ icon, count, onPress, active, theme }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    onPress?.();
    setTimeout(() => setIsPressed(false), 200);
  };

  return (
    <button
      className={`reaction-btn ${active ? "active" : ""}`}
      onClick={handlePress}
      style={{
        color: active ? "#ff9191" : theme.subText,
      }}
    >
      <span className="reaction-emoji">{icon}</span>
      {count > 0 && (
        <span className="reaction-count" style={{ color: active ? "#ff9191" : theme.subText }}>
          {count}
        </span>
      )}
    </button>
  );
};

// Individual comment card component
const CommentCard = ({ comment, author, theme, onCopy, onReport }) => {
  const [expanded, setExpanded] = useState(false);
  const [userReactions, setUserReactions] = useState({
    heart: false,
    dislike: false,
    laugh: false,
    wow: false,
  });
  const [reactionCounts, setReactionCounts] = useState({
    likes: comment.likes ?? 0,
    dislikes: comment.dislikes ?? 0,
    laughs: comment.laughs ?? 0,
    wows: comment.wows ?? 0,
  });
  const [reported, setReported] = useState(false);

  const safeText = comment.text || "";
  const textTooLong = safeText.length > 100;
  const displayedText = expanded || !textTooLong ? safeText : `${safeText.slice(0, 100)}...`;

  const handleReaction = async (type) => {
    const newReactions = { ...userReactions };
    newReactions[type] = !newReactions[type];
    setUserReactions(newReactions);

    const reactionKey = type === "heart" ? "likes" : `${type}s`;
    const currentCount = reactionCounts[reactionKey] || 0;
    const newCount = newReactions[type] ? currentCount + 1 : Math.max(0, currentCount - 1);
    setReactionCounts((prev) => ({ ...prev, [reactionKey]: newCount }));

    try {
      await updateCommentReaction(comment.id, reactionKey, newCount);
    } catch (error) {
      console.error(`Failed to update ${type} reaction:`, error);
      setUserReactions({ ...userReactions });
      setReactionCounts((prev) => ({ ...prev, [reactionKey]: currentCount }));
    }
  };

  const handleCopyText = async () => {
    const success = await copyCommentText(safeText);
    if (success) {
      onCopy?.();
    }
  };

  const handleReport = () => {
    setReported(true);
    onReport?.();
  };

  return (
    <div
      className="comment-card"
      style={{
        backgroundColor: theme.background,
        borderColor: theme.border,
      }}
    >
      {/* Comment Header */}
      <div className="comment-header">
        <div className="comment-avatar">
          {author?.avatarUri ? (
            <img src={author.avatarUri} alt="avatar" />
          ) : (
            <div
              className="comment-avatar-placeholder"
              style={{ backgroundColor: theme.card }}
            />
          )}
        </div>
        <span className="comment-author" style={{ color: theme.text }}>
          {author?.name || "Friend"}
        </span>
        <span className="comment-dot" style={{ color: theme.subText }}>•</span>
        <span className="comment-timestamp" style={{ color: theme.subText }}>
          {timeAgo(comment.createdAt)}
        </span>
      </div>

      {/* Comment Text */}
      <p className="comment-text" style={{ color: theme.text }}>
        {displayedText}
      </p>
      {textTooLong && (
        <button
          className="comment-show-more"
          onClick={() => setExpanded(!expanded)}
          style={{ color: theme.link }}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      {/* Reactions Row */}
      <div className="comment-reactions">
        <ReactionButton
          icon={emojiAssets.heart}
          count={reactionCounts.likes}
          onPress={() => handleReaction("heart")}
          active={userReactions.heart}
          theme={theme}
        />
        <ReactionButton
          icon={emojiAssets.dislike}
          count={reactionCounts.dislikes}
          onPress={() => handleReaction("dislike")}
          active={userReactions.dislike}
          theme={theme}
        />
        <ReactionButton
          icon={emojiAssets.laugh}
          count={reactionCounts.laughs}
          onPress={() => handleReaction("laugh")}
          active={userReactions.laugh}
          theme={theme}
        />
        <ReactionButton
          icon={emojiAssets.wow}
          count={reactionCounts.wows}
          onPress={() => handleReaction("wow")}
          active={userReactions.wow}
          theme={theme}
        />
      </div>

      {/* Footer Actions */}
      <div className="comment-footer">
        <button
          className="comment-footer-action"
          style={{ color: theme.text }}
        >
          Reply {comment.replyCount > 0 ? `(${comment.replyCount})` : ""}
        </button>
        <span className="comment-dot" style={{ color: theme.subText }}>•</span>
        <button
          className="comment-footer-action"
          onClick={handleCopyText}
          style={{ color: theme.text }}
        >
          Copy text
        </button>
        <span className="comment-dot" style={{ color: theme.subText }}>•</span>
        <button
          className="comment-footer-action"
          onClick={handleReport}
          style={{ color: reported ? "#ef4444" : theme.text }}
        >
          {reported ? "Reported" : "Report"}
        </button>
      </div>
    </div>
  );
};

// Toast notification component
const Toast = ({ message, visible, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="toast">
      {message}
    </div>
  );
};

// Main CommentsPopup component
export default function CommentsPopup({ isOpen, onClose, post }) {
  const theme = useAppTheme();
  const { byId } = useSelector(selectPosts);
  const usersById = useSelector((state) => state.users.byId);
  const authUserId = useSelector((state) => state.auth.userId);
  const currentUser = usersById[authUserId];

  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const postId = post?.id || post?.$id;

  const showToast = useCallback((message) => {
    setToast({ visible: true, message });
  }, []);

  const loadComments = useCallback(async () => {
    if (!postId) return;

    setCommentsLoading(true);
    try {
      const { comments: fetchedComments } = await fetchCommentsByPost({ postId });
      setComments(fetchedComments);
    } catch (error) {
      console.warn("CommentsPopup:loadComments", error);
    } finally {
      setCommentsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (isOpen && postId) {
      loadComments();
    }
  }, [isOpen, postId, loadComments]);

  const handleSend = useCallback(async () => {
    const trimmed = commentText.trim();

    if (!trimmed || !postId || submitting) {
      return;
    }

    if (!authUserId) {
      showToast("Please sign in to comment");
      return;
    }

    const optimisticId = IDs.unique();
    const previousComments = [...comments];
    const optimisticComment = {
      id: optimisticId,
      userId: authUserId,
      text: trimmed,
      createdAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      laughs: 0,
      wows: 0,
      replyCount: 0,
    };

    // Optimistic update
    setComments((prev) => [...prev, optimisticComment]);
    setCommentText("");
    setSubmitting(true);

    try {
      const createdComment = await createCommentRemote({
        postId,
        userId: authUserId,
        text: trimmed,
        ownerId: post?.userId,
      });

      // Replace optimistic comment with real one
      setComments((prev) =>
        prev.map((c) => (c.id === optimisticId ? createdComment : c))
      );

      await loadComments();
    } catch (error) {
      console.error("Unable to send comment", error);
      showToast("Failed to send comment");
      setComments(previousComments);
    } finally {
      setSubmitting(false);
    }
  }, [authUserId, commentText, comments, postId, post?.userId, submitting, showToast, loadComments]);

  const handleCopy = useCallback(() => {
    showToast("Text copied to clipboard");
  }, [showToast]);

  const handleReport = useCallback(() => {
    showToast("Thanks for letting us know");
  }, [showToast]);

  const commentCount = post?.commentCount || comments.length;

  if (!isOpen) return null;

  return (
    <div className="comments-popup-overlay" onClick={onClose}>
      <div className="comments-popup-container" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: theme.background }}>
        {/* Header */}
        <div className="comments-popup-header">
          <h3 style={{ color: theme.text }}>Comments</h3>
          <span style={{ color: theme.subText }}>{commentCount} comments</span>
          <button className="comments-popup-close" onClick={onClose}>
            <FiX size={24} color={theme.text} />
          </button>
        </div>

        {/* Comments List */}
        <div className="comments-popup-list">
          {commentsLoading ? (
            <div className="comments-loading">
              <div className="loading-spinner" />
              <span style={{ color: theme.subText }}>Loading comments</span>
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => {
              const author =
                usersById[comment.userId] ??
                (comment.userId === authUserId ? currentUser : undefined);
              return (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  author={author}
                  theme={theme}
                  onCopy={handleCopy}
                  onReport={handleReport}
                />
              );
            })
          ) : (
            <div className="comments-empty">
              <FiMessageCircle size={48} color={theme.subText} />
              <p style={{ color: theme.subText }}>
                Be the first to comment!
              </p>
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div
          className="comments-popup-input"
          style={{
            backgroundColor: theme.card,
            borderColor: theme.border,
          }}
        >
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={submitting}
            style={{
              backgroundColor: theme.background,
              color: theme.text,
              borderColor: theme.border,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!commentText.trim() || submitting}
            style={{
              color: commentText.trim() && !submitting ? theme.text : theme.text,
              opacity: submitting ? 0.6 : 1,
            }}
          >
            Post
          </button>
        </div>

        {/* Toast Notification */}
        <Toast
          message={toast.message}
          visible={toast.visible}
          onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
        />
      </div>
    </div>
  );
}

