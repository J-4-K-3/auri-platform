import { databases, APPWRITE_DATABASE_ID, COLLECTION_NOTIFICATIONS_ID, IDs, Permission, Role, Query } from "./Appwrite";

export const mapNotificationDocument = (doc) => {
  if (!doc) return null;
  return {
    id: doc.$id || doc.id,
    toUserId: doc.toUserId,
    type: doc.type,
    actorId: doc.actorId,
    postId: doc.postId ?? null,
    read: Boolean(doc.read),
    archived: Boolean(doc.archived),
    createdAt: doc.createdAt ?? doc.$createdAt ?? new Date().toISOString(),
    updatedAt: doc.updatedAt ?? doc.$updatedAt ?? null,
  };
};

const buildNotificationPermissions = (toUserId, actorId) => [
  Permission.read(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.user(actorId)),
];

export const createNotification = async ({ toUserId, type, actorId, postId }) => {
  if (!toUserId || !type || !actorId || toUserId === actorId) return null;
  const payload = { toUserId, type, actorId, postId: postId ?? null, read: false, archived: false, createdAt: new Date().toISOString() };
  try {
    const document = await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTION_NOTIFICATIONS_ID, IDs.unique(), payload, buildNotificationPermissions(toUserId, actorId));
    return mapNotificationDocument(document);
  } catch (error) { console.warn("createNotification failed", error); return null; }
};

export const listNotificationsForUser = async (userId, { limit = 100 } = {}) => {
  if (!userId) return [];
  try {
    const response = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTION_NOTIFICATIONS_ID, [Query.equal("toUserId", userId), Query.orderDesc("$createdAt"), Query.limit(limit)]);
    return (response.documents || []).map((doc) => mapNotificationDocument({ ...doc, id: doc.$id })).filter((n) => !n?.archived);
  } catch (error) { console.warn("listNotificationsForUser failed", error); return []; }
};

export const markNotificationReadRemote = async (notificationId) => {
  if (!notificationId) return null;
  try {
    const document = await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTION_NOTIFICATIONS_ID, notificationId, { read: true });
    return mapNotificationDocument(document);
  } catch (error) { console.warn("markNotificationReadRemote failed", error); return null; }
};

export const markNotificationsReadBulk = async (notificationIds = []) => {
  const mapped = await Promise.all(notificationIds.map((id) => markNotificationReadRemote(id).catch(() => null)));
  return mapped.filter(Boolean);
};

export const archiveNotification = async (notificationId) => {
  if (!notificationId) return null;
  try {
    const document = await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTION_NOTIFICATIONS_ID, notificationId, { archived: true });
    return mapNotificationDocument(document);
  } catch (error) { console.warn("archiveNotification failed", error); return null; }
};

export const deleteNotification = async (notificationId) => {
  if (!notificationId) return;
  try { await databases.deleteDocument(APPWRITE_DATABASE_ID, COLLECTION_NOTIFICATIONS_ID, notificationId); return true; }
  catch (error) { console.warn("deleteNotification failed", error); return false; }
};

export const getUnreadNotificationCount = async (userId) => {
  if (!userId) return 0;
  try {
    const response = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTION_NOTIFICATIONS_ID, [Query.equal("toUserId", userId), Query.equal("read", false), Query.limit(1)]);
    return response.total || 0;
  } catch (error) { console.warn("getUnreadNotificationCount failed", error); return 0; }
};

