import {
  databases,
  APPWRITE_DATABASE_ID,
  COLLECTION_USERS_ID,
  Query,
} from "./Appwrite";

const DEFAULT_AVATAR = "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg";

/**
 * Normalize user document - matches mobile logic
 */
const normalizeUserDoc = (doc) => {
  if (!doc) return null;

  const preferredId = doc.userId ?? doc.$id ?? doc.id ?? null;
  const documentId = doc.$id ?? preferredId;
  const id = preferredId ?? documentId;

  const avatarUri =
    typeof doc.avatarUri === "string" && doc.avatarUri.startsWith("http")
      ? doc.avatarUri
      : null;

  let parsedLinks = {};
  if (typeof doc.links === "string") {
    const trimmedLinks = doc.links.trim();
    if (trimmedLinks.length) {
      try {
        const maybeObject = JSON.parse(trimmedLinks);
        if (maybeObject && typeof maybeObject === "object") {
          parsedLinks = maybeObject;
        }
      } catch {
        parsedLinks = { donation: trimmedLinks };
      }
    }
  } else if (doc.links && typeof doc.links === "object") {
    parsedLinks = { ...doc.links };
  }

  return {
    ...doc,
    id,
    $id: documentId ?? id,
    userId: doc.userId ?? id ?? undefined,
    avatarUri: avatarUri || null,
    links: parsedLinks,
  };
};

/**
 * List users by their IDs - matches mobile logic
 * @param {Array<string>} userIds - Array of user IDs to fetch
 * @returns {Promise<Array>} Array of normalized user documents
 */
export const listUsersByIds = async (userIds) => {
  if (!userIds || userIds.length === 0) {
    return [];
  }

  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTION_USERS_ID,
      [
        Query.equal("$id", userIds),
        Query.limit(userIds.length),
      ]
    );

    return (response.documents || []).map(normalizeUserDoc);
  } catch (error) {
    console.warn("listUsersByIds: Unable to fetch users", error);
    return [];
  }
};

/**
 * Get a single user by ID
 * @param {string} userId - The user ID
 * @returns {Promise<object|null>} Normalized user document or null
 */
export const getUserById = async (userId) => {
  if (!userId) {
    return null;
  }

  try {
    const doc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTION_USERS_ID,
      userId
    );
    return normalizeUserDoc(doc);
  } catch (error) {
    console.warn("getUserById: Unable to fetch user", error);
    return null;
  }
};

/**
 * Search users by name - matches mobile ExploreScreen.js logic
 * Uses Appwrite Query.search with fallback to local filtering
 * @param {string} searchTerm - Search term
 * @param {object} options - { limit: number }
 * @returns {Promise<Array>} Array of normalized user documents
 */
export const searchUsers = async (searchTerm, { limit = 8 } = {}) => {
  const query = typeof searchTerm === "string" ? searchTerm.trim() : "";
  if (!query) {
    return [];
  }

  const searchLimit = Math.max(1, Math.min(Number(limit) || 8, 25));
  const lowerQuery = query.toLowerCase();

  try {
    // Primary: Use Appwrite full-text search on "name" attribute
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTION_USERS_ID,
      [
        Query.search("name", query),
        Query.limit(searchLimit),
      ]
    );

    return (response.documents || []).map(normalizeUserDoc);
  } catch (searchError) {
    console.warn("searchUsers: Search failed, trying fallback", searchError);

    try {
      // Fallback: Fetch all users and filter locally by name/username/email
      const fallbackResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTION_USERS_ID,
        [Query.limit(50)]
      );

      return (fallbackResponse.documents || [])
        .map(normalizeUserDoc)
        .filter((user) => {
          const haystack = [user?.name, user?.username, user?.email]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(lowerQuery);
        })
        .slice(0, searchLimit);
    } catch (fallbackError) {
      console.error("searchUsers: Final error", fallbackError);
      return [];
    }
  }
};

/**
 * Update user profile
 * @param {string} userId - The user ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated user document
 */
export const updateUser = async (userId, updates) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const doc = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTION_USERS_ID,
      userId,
      updates
    );
    return normalizeUserDoc(doc);
  } catch (error) {
    console.warn("updateUser: Unable to update user", error);
    throw error;
  }
};

/**
 * Follow a user
 * @param {string} currentUserId - The current user's ID
 * @param {string} targetUserId - The user to follow
 * @returns {Promise<object>} Result with isFollowing status
 */
export const followUser = async (currentUserId, targetUserId) => {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return { isFollowing: false };
  }

  const currentUser = await getUserById(currentUserId);
  if (!currentUser) {
    throw new Error("User not found");
  }

  const following = Array.isArray(currentUser.following) ? [...currentUser.following] : [];
  let isFollowing = false;

  if (following.includes(targetUserId)) {
    // Unfollow
    await updateUser(currentUserId, {
      following: following.filter((id) => id !== targetUserId),
    });
    
    const targetUser = await getUserById(targetUserId);
    if (targetUser) {
      const followers = Array.isArray(targetUser.followers) ? targetUser.followers : [];
      await updateUser(targetUserId, {
        followers: followers.filter((id) => id !== currentUserId),
      });
    }
    isFollowing = false;
  } else {
    // Follow
    await updateUser(currentUserId, {
      following: [...following, targetUserId],
    });
    
    const targetUser = await getUserById(targetUserId);
    if (targetUser) {
      const followers = Array.isArray(targetUser.followers) ? [...targetUser.followers] : [];
      await updateUser(targetUserId, {
        followers: [...followers, currentUserId],
      });
    }
    isFollowing = true;
  }

  return { isFollowing };
};

/**
 * Get followers of a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of follower user documents
 */
export const getFollowers = async (userId) => {
  if (!userId) return [];
  
  try {
    const user = await getUserById(userId);
    if (!user || !Array.isArray(user.followers)) return [];
    
    return await listUsersByIds(user.followers);
  } catch (error) {
    console.warn("getFollowers: Unable to fetch followers", error);
    return [];
  }
};

/**
 * Get users that a user is following
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of following user documents
 */
export const getFollowing = async (userId) => {
  if (!userId) return [];
  
  try {
    const user = await getUserById(userId);
    if (!user || !Array.isArray(user.following)) return [];
    
    return await listUsersByIds(user.following);
  } catch (error) {
    console.warn("getFollowing: Unable to fetch following", error);
    return [];
  }
};

export { normalizeUserDoc, DEFAULT_AVATAR };

