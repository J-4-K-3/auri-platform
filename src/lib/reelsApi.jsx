import {
  databases,
  IDs,
  APPWRITE_DATABASE_ID,
  COLLECTION_REELS_ID,
  COLLECTION_COMMENTS_ID,
  Query,
} from "./Appwrite";
import { listUsersByIds } from "./usersApi";
import { normalizeLikeTokenArray } from "../utils/socialEncoding";

const normalizeMedia = (doc) => {
  if (Array.isArray(doc.media) && doc.media.length) {
    return doc.media.map((item) =>
      typeof item === "string" ? { type: "video", uri: item } : item,
    );
  }

  if (typeof doc.videoUrl === "string" && doc.videoUrl.length) {
    return [
      {
        type: "video",
        uri: doc.videoUrl,
      },
    ];
  }

  if (typeof doc.mediaUrl === "string" && doc.mediaUrl.length) {
    return [
      {
        type: "video",
        uri: doc.mediaUrl,
      },
    ];
  }

  return [];
};

export const mapReelDocument = (doc) => {
  if (!doc) return null;

  return {
    id: doc.$id || doc.id,
    userId: doc.userId,
    caption: doc.caption ?? doc.text ?? "",
    videoUrl: doc.videoUrl ?? doc.mediaUrl ?? null,
    media: normalizeMedia(doc),
    audio: doc.audio || "Original Audio",
    likes: Array.isArray(doc.likes) ? doc.likes : [],
    commentCount: typeof doc.commentCount === "number" ? doc.commentCount : 0,
    comments: [],
    createdAt: doc.createdAt ?? doc.$createdAt ?? new Date().toISOString(),
    archived: doc.archived ?? false,
  };
};

export const listReels = async () => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTION_REELS_ID,
      [Query.orderDesc("$createdAt")],
    );

    if (!response || !response.documents) {
      return [];
    }

    return response.documents.map((doc) => mapReelDocument(doc));
  } catch (error) {
    console.warn("listReels: Unable to fetch reels", error);
    return [];
  }
};

export const likeReel = async ({ reelId, userId, currentLikes, ownerId }) => {
  if (!reelId || !userId) {
    throw new Error("reelId and userId are required");
  }

  try {
    const likesSet = new Set(Array.isArray(currentLikes) ? currentLikes : []);
    const hasLiked = likesSet.has(userId);

    if (hasLiked) {
      likesSet.delete(userId);
    } else {
      likesSet.add(userId);
    }

    const response = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTION_REELS_ID,
      reelId,
      { likes: Array.from(likesSet) },
    );

    return {
      likes: Array.from(likesSet),
      liked: !hasLiked,
    };
  } catch (error) {
    console.warn("likeReel: Unable to toggle like", error);
    throw error;
  }
};

export const addCommentToReel = async ({
  reelId,
  userId,
  text,
  comment,
  currentComments,
  ownerId,
}) => {
  if (!reelId || !userId) {
    throw new Error("reelId and userId are required");
  }

  try {
    // Create the comment document
    const commentData = {
      text: text || comment || "",
      userId,
      reelId,
      parentId: null,
      createdAt: new Date().toISOString(),
    };

    const response = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTION_COMMENTS_ID,
      IDs.unique(),
      commentData,
    );

    // Update the reel's comment count
    const currentCommentCount = Array.isArray(currentComments)
      ? currentComments.length
      : 0;

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTION_REELS_ID,
      reelId,
      { commentCount: currentCommentCount + 1 },
    );

    return {
      id: response.$id,
      ...commentData,
    };
  } catch (error) {
    console.warn("addCommentToReel: Unable to add comment", error);
    throw error;
  }
};
