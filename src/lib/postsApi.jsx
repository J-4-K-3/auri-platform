import {
  databases,
  APPWRITE_DATABASE_ID,
  COLLECTION_POSTS_ID,
  COLLECTION_SHOP_BOOKMARKS_ID,
  COLLECTION_COMMENTS_ID,
  Query,
  Permission,
  Role,
  IDs,
} from "./Appwrite";

// Helper to ensure arrays
const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
};

// Sanitize string fields
const sanitizeString = (value, maxLength = null) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return maxLength ? trimmed.slice(0, maxLength) : trimmed;
};

// Normalize a single post
const normalizePost = (post) => {
  if (!post || !post.id && !post.$id) return null;
  
  const id = post.id || post.$id;
  
  return {
    id,
    $id: id,
    userId: sanitizeString(post.userId, 50),
    text: sanitizeString(post.text, 2000),
    caption: sanitizeString(post.caption, 2000),
    mediaUrl: ensureArray(post.mediaUrl || post.mediaurl || post.mediaUrlArray),
    mediaType: ensureArray(post.mediaType || post.mediatype || post.mediaTypeArray),
    likes: ensureArray(post.likes).filter((l) => typeof l === "string"),
    commentCount: Number(post.commentCount ?? post.commentcount ?? 0),
    tags: ensureArray(post.tags).filter((t) => typeof t === "string"),
    $createdAt: post.$createdAt || post.createdAt || new Date().toISOString(),
    donationsEnabled: Boolean(post.donationsEnabled ?? post.donationsenabled),
  };
};

/**
 * Fetch posts from the posts collection
 * @param {number} limit - Maximum number of posts to fetch (default 50)
 * @returns {Promise<Array>} Array of normalized post objects
 */
export const getPosts = async (limit = 50) => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTION_POSTS_ID,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
      ]
    );

    if (!response || !response.documents) {
      return [];
    }

    return response.documents.map(normalizePost).filter(Boolean);
  } catch (error) {
    console.warn("getPosts: Unable to fetch posts", error);
    return [];
  }
};

/**
 * Fetch posts by specific user IDs (for feed - follows + own posts)
 * @param {Array<string>} userIds - Array of user IDs to fetch posts from
 * @param {number} limit - Maximum number of posts to fetch
 * @returns {Promise<Array>} Array of normalized post objects
 */
export const getPostsByUserIds = async (userIds, limit = 50) => {
  if (!userIds || userIds.length === 0) {
    return [];
  }
  
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTION_POSTS_ID,
      [
        Query.equal("userId", userIds),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
      ]
    );

    if (!response || !response.documents) {
      return [];
    }

    return response.documents.map(normalizePost).filter(Boolean);
  } catch (error) {
    console.warn("getPostsByUserIds: Unable to fetch posts", error);
    return [];
  }
};

/**
 * Fetch posts by specific user
 * @param {string} userId - The user ID to filter by
 * @param {number} limit - Maximum number of posts
 * @returns {Promise<Array>} Array of normalized post objects
 */
export const getPostsByUser = async (userId, limit = 50) => {
  if (!userId) return [];
  
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTION_POSTS_ID,
      [
        Query.equal("userId", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
      ]
    );

    if (!response || !response.documents) {
      return [];
    }

    return response.documents.map(normalizePost).filter(Boolean);
  } catch (error) {
    console.warn("getPostsByUser: Unable to fetch posts", error);
    return [];
  }
};

/**
 * Create a new post
 * @param {object} postData - Post data { userId, text, caption, mediaUrl, mediaType, tags }
 * @returns {Promise<object>} Created post document
 */
export const createPost = async (postData) => {
  if (!postData.userId) {
    throw new Error("User ID is required to create a post.");
  }

  const payload = {
    userId: sanitizeString(postData.userId, 50),
    text: sanitizeString(postData.text, 2000),
    caption: sanitizeString(postData.caption, 2000),
    mediaUrl: ensureArray(postData.mediaUrl),
    mediaType: ensureArray(postData.mediaType),
    tags: ensureArray(postData.tags).filter((t) => typeof t === "string"),
    likes: [],
    commentCount: 0,
    donationsEnabled: Boolean(postData.donationsEnabled),
  };

  try {
    const { ID, databases } = await import("./Appwrite");
    const response = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTION_POSTS_ID,
      ID.unique(),
      payload
    );
    return normalizePost(response);
  } catch (error) {
    console.warn("createPost: Unable to create post", error);
    throw error;
  }
};

/**
 * Like or unlike a post
 * @param {string} postId - The post ID
 * @param {string} userId - The user ID liking the post
 * @returns {Promise<object>} Updated post
 */
export const toggleLike = async (postId, userId) => {
  if (!postId || !userId) {
    throw new Error("Post ID and User ID are required.");
  }

  try {
    const { databases, Query: AppQuery } = await import("./Appwrite");
    
    // Get current post
    const post = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTION_POSTS_ID,
      postId
    );

    if (!post) {
      throw new Error("Post not found.");
    }

    const currentLikes = ensureArray(post.likes);
    const isLiked = currentLikes.includes(userId);

    let newLikes;
    if (isLiked) {
      newLikes = currentLikes.filter((id) => id !== userId);
    } else {
      newLikes = [...currentLikes, userId];
    }

    const response = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTION_POSTS_ID,
      postId,
      { likes: newLikes }
    );

    return normalizePost(response);
  } catch (error) {
    console.warn("toggleLike: Unable to toggle like", error);
    throw error;
  }
};

/**
 * Delete a post
 * @param {string} postId - The post ID to delete
 * @returns {Promise<void>}
 */
export const deletePost = async (postId) => {
  if (!postId) {
    throw new Error("Post ID is required.");
  }

  try {
    const { databases } = await import("./Appwrite");
    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      COLLECTION_POSTS_ID,
      postId
    );
  } catch (error) {
    console.warn("deletePost: Unable to delete post", error);
    throw error;
  }
};

// ============================================
// BOOKMARK FUNCTIONS - For saving posts to bookmark collection
// ============================================

/**
 * Check if a post is already bookmarked by user
 * @param {string} userId - The user ID
 * @param {string} postId - The post ID to check
 * @returns {Promise<boolean>} - True if bookmarked, false otherwise
 */
export const checkIsBookmarked = async ({ userId, postId }) => {
  if (!userId || !postId) {
    return false;
  }

  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTION_SHOP_BOOKMARKS_ID,
      [
        Query.equal("userId", userId),
        Query.equal("postId", postId),
      ]
    );
    return response.documents && response.documents.length > 0;
  } catch (error) {
    console.warn("checkIsBookmarked error:", error);
    return false;
  }
};

/**
 * Save a post to user's bookmarks
 * @param {object} params - Parameters
 * @param {string} params.userId - The user ID
 * @param {string} params.postId - The post ID to save
 * @param {string} [params.title] - Optional title for the bookmark
 * @param {string} [params.description] - Optional description
 * @returns {Promise<object>} - The created bookmark document
 */
export const saveBookmarkToRemote = async ({ userId, postId, title, description }) => {
  if (!userId || !postId) {
    throw new Error("saveBookmarkToRemote requires userId and postId.");
  }

  const payload = {
    userId: userId,
    postId: postId,
    createdAt: new Date().toISOString(),
    archived: false,
  };

  // Add optional fields if provided
  if (title !== undefined) {
    payload.title = title;
  }
  if (description !== undefined) {
    payload.description = description;
  }

  const permissions = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];

  const document = await databases.createDocument(
    APPWRITE_DATABASE_ID,
    COLLECTION_SHOP_BOOKMARKS_ID,
    IDs.unique(),
    payload,
    permissions
  );

  console.log("[postsApi] Bookmark created:", document.$id);
  return document;
};

/**
 * Remove a post from user's bookmarks
 * @param {object} params - Parameters
 * @param {string} params.userId - The user ID
 * @param {string} params.postId - The post ID to remove
 * @returns {Promise<{success: boolean}>}
 */
export const removeBookmarkFromRemote = async ({ userId, postId }) => {
  if (!userId || !postId) {
    throw new Error("removeBookmarkFromRemote requires userId and postId.");
  }

  try {
    // First, find the bookmark document
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTION_SHOP_BOOKMARKS_ID,
      [
        Query.equal("userId", userId),
        Query.equal("postId", postId),
      ]
    );

    if (response.documents && response.documents.length > 0) {
      // Delete the first matching bookmark
      const bookmarkDoc = response.documents[0];
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        COLLECTION_SHOP_BOOKMARKS_ID,
        bookmarkDoc.$id
      );
      console.log("[postsApi] Bookmark removed:", bookmarkDoc.$id);
    }

    return { success: true };
  } catch (error) {
    console.warn("removeBookmarkFromRemote error:", error);
    throw error;
  }
};

/**
 * Fetch all bookmarks for a user
 * @param {object} params - Parameters
 * @param {string} params.userId - The user ID
 * @returns {Promise<Array>} - Array of bookmark documents with post data
 */
export const fetchBookmarksForUser = async ({ userId }) => {
  if (!userId) {
    console.warn("[postsApi] fetchBookmarksForUser: missing userId");
    return [];
  }

  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTION_SHOP_BOOKMARKS_ID,
      [
        Query.equal("userId", userId),
        Query.equal("archived", false),
        Query.orderDesc("createdAt"),
      ]
    );

    const bookmarks = response.documents || [];
    console.log("[postsApi] Fetched bookmarks:", bookmarks.length);

    return bookmarks;
  } catch (error) {
    console.warn("fetchBookmarksForUser error:", error);
    return [];
  }
};

/**
 * Toggle bookmark status for a post
 * @param {object} params - Parameters
 * @param {string} params.userId - The user ID
 * @param {string} params.postId - The post ID to toggle
 * @param {string} [params.title] - Optional title for the bookmark
 * @param {string} [params.description] - Optional description
 * @returns {Promise<{isBookmarked: boolean, bookmark?: object}>}
 */
export const toggleBookmark = async ({ userId, postId, title, description }) => {
  if (!userId || !postId) {
    throw new Error("toggleBookmark requires userId and postId.");
  }

  const isCurrentlyBookmarked = await checkIsBookmarked({ userId, postId });

  if (isCurrentlyBookmarked) {
    await removeBookmarkFromRemote({ userId, postId });
    return { isBookmarked: false };
  } else {
    const bookmark = await saveBookmarkToRemote({ userId, postId, title, description });
    return { isBookmarked: true, bookmark };
  }
};

// ============================================
// COMMENT FUNCTIONS - Match mobile CommentsScreen
// ============================================

/**
 * Normalize a comment document from Appwrite
 * @param {object} comment - Raw comment document
 * @returns {object} Normalized comment
 */
const normalizeComment = (comment) => {
  if (!comment || (!comment.id && !comment.$id)) return null;
  
  const id = comment.id || comment.$id;
  
  return {
    id,
    $id: id,
    postId: sanitizeString(comment.postId, 100),
    userId: sanitizeString(comment.userId, 100),
    text: sanitizeString(comment.text, 1000) || sanitizeString(comment.content, 500),
    content: sanitizeString(comment.content, 500),
    createdAt: comment.createdAt || comment.$createdAt,
    $createdAt: comment.$createdAt || comment.createdAt,
    $updatedAt: comment.$updatedAt,
    likes: Number(comment.likes ?? 0),
    dislikes: Number(comment.dislikes ?? 0),
    laughs: Number(comment.laughs ?? 0),
    wows: Number(comment.wows ?? 0),
    parentId: sanitizeString(comment.parentId, 100),
    commentId: sanitizeString(comment.commentId, 100),
    replies: Array.isArray(comment.replies) ? comment.replies : [],
    replyCount: 0, // Will be calculated
  };
};

/**
 * Fetch comments for a post
 * @param {object} params - Parameters
 * @param {string} params.postId - The post ID
 * @param {Array} [params.queries] - Optional Appwrite queries
 * @returns {Promise<{comments: Array, total: number}>}
 */
export const fetchCommentsByPost = async ({ postId, queries = [] }) => {
  if (!postId) {
    return { comments: [], total: 0 };
  }

  try {
    const defaultQueries = [
      Query.equal("postId", postId),
      Query.orderAsc("createdAt"),
    ];

    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTION_COMMENTS_ID,
      [...defaultQueries, ...queries]
    );

    if (!response || !response.documents) {
      return { comments: [], total: 0 };
    }

    const comments = response.documents.map(normalizeComment).filter(Boolean);
    
    // Calculate reply counts for each top-level comment
    const replyCounts = {};
    const allComments = [...comments];
    
    allComments.forEach(comment => {
      if (comment.parentId) {
        replyCounts[comment.parentId] = (replyCounts[comment.parentId] || 0) + 1;
      }
    });

    // Add reply counts to top-level comments
    const topLevelComments = allComments
      .filter(comment => !comment.parentId)
      .map(comment => ({
        ...comment,
        replyCount: replyCounts[comment.id] || 0
      }));

    return {
      comments: topLevelComments,
      total: topLevelComments.length,
    };
  } catch (error) {
    console.warn("fetchCommentsByPost: Unable to fetch comments", error);
    return { comments: [], total: 0 };
  }
};

/**
 * Create a new comment on a post
 * @param {object} params - Parameters
 * @param {string} params.postId - The post ID
 * @param {string} params.userId - The user ID creating the comment
 * @param {string} params.text - The comment text
 * @param {string} params.ownerId - The post owner's user ID
 * @returns {Promise<object>} Created comment
 */
export const createCommentRemote = async ({ postId, userId, text, ownerId }) => {
  if (!postId || !userId || !text) {
    throw new Error("postId, userId, and text are required.");
  }

  const commentId = IDs.unique();
  
  const payload = {
    postId: sanitizeString(postId, 100),
    userId: sanitizeString(userId, 100),
    text: sanitizeString(text, 1000),
    content: sanitizeString(text, 500),
    commentId: commentId,
    likes: 0,
    dislikes: 0,
    laughs: 0,
    wows: 0,
    replies: [],
    createdAt: new Date().toISOString(),
  };

  try {
    const response = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTION_COMMENTS_ID,
      IDs.unique(),
      payload
    );

    // Increment comment count on the post
    try {
      const post = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        COLLECTION_POSTS_ID,
        postId
      );
      
      const currentCommentCount = Number(post.commentCount ?? 0);
      
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        COLLECTION_POSTS_ID,
        postId,
        { commentCount: currentCommentCount + 1 }
      );
    } catch (postError) {
      console.warn("createCommentRemote: Failed to update post comment count", postError);
    }

    return normalizeComment(response);
  } catch (error) {
    console.warn("createCommentRemote: Unable to create comment", error);
    throw error;
  }
};

/**
 * Update a comment's reaction count
 * @param {string} commentId - The comment ID
 * @param {string} reactionType - 'likes', 'dislikes', 'laughs', or 'wows'
 * @param {number} newCount - The new count
 * @returns {Promise<object>} Updated comment
 */
export const updateCommentReaction = async (commentId, reactionType, newCount) => {
  if (!commentId || !reactionType || newCount === undefined) {
    throw new Error("commentId, reactionType, and newCount are required.");
  }

  try {
    const updates = { [reactionType]: newCount };
    const response = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTION_COMMENTS_ID,
      commentId,
      updates
    );

    return normalizeComment(response);
  } catch (error) {
    console.warn("updateCommentReaction: Unable to update reaction", error);
    throw error;
  }
};

/**
 * Report a comment (soft flag)
 * @param {string} commentId - The comment ID
 * @returns {Promise<void>}
 */
export const reportComment = async (commentId) => {
  if (!commentId) {
    throw new Error("Comment ID is required.");
  }

  // In a real app, this would create a report document
  // For now, we just log it
  console.log("Comment reported:", commentId);
  return { success: true };
};

/**
 * Copy comment text to clipboard (web implementation)
 * @param {string} text - The text to copy
 */
export const copyCommentText = async (text) => {
  if (!text) return false;
  
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn("copyCommentText: Failed to copy", error);
    return false;
  }
};

