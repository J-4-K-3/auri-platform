// authService.js
import {
  account,
  IDs,
  databases,
  APPWRITE_DATABASE_ID,
  COLLECTION_USERS_ID,
  COLLECTION_USER_ACCOUNTS_ID,
  Permission,
  Role,
  Query,
} from "./Appwrite";

const sanitizeString = (value, maxLength, fallback = "") => {
  if (typeof value !== "string") {
    const cleanedFallback = typeof fallback === "string" ? fallback.trim() : "";
    return maxLength ? cleanedFallback.slice(0, maxLength) : cleanedFallback;
  }

  const trimmed = value.trim();
  if (!trimmed && fallback) {
    return sanitizeString(fallback, maxLength);
  }

  return maxLength ? trimmed.slice(0, maxLength) : trimmed;
};

const sanitizeStringArray = (value, maxItems, itemMaxLength) => {
  if (!Array.isArray(value) || maxItems <= 0) {
    return [];
  }

  const unique = [];
  value.forEach((item) => {
    if (typeof item !== "string") {
      return;
    }
    const sanitized = sanitizeString(item, itemMaxLength);
    if (!sanitized) {
      return;
    }
    if (!unique.includes(sanitized)) {
      unique.push(sanitized);
    }
  });

  return unique.slice(0, maxItems);
};

const sanitizeLink = (value, maxLength = 280) => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return maxLength ? trimmed.slice(0, maxLength) : trimmed;
};

const sanitizeAge = (value) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    const clamped = Math.max(13, Math.min(parsed, 120));
    return Math.round(clamped);
  }
  return undefined;
};

const sanitizeProfilePayload = (userId, profileData = {}) => {
  const email = sanitizeString(profileData.email, 320);
  const name = sanitizeString(profileData.name, 255, "Auri Friend");
  const bio = sanitizeString(profileData.bio, 150);
  const city = sanitizeString(profileData.city ?? profileData.location, 100);
  const status = sanitizeString(profileData.status, 150);
  const location = sanitizeString(profileData.location, 100);
  const age = sanitizeAge(profileData.age);
  const interests = sanitizeStringArray(profileData.interests, 20, 60);
  const active = profileData.active ?? true;
  const archived = profileData.archived ?? false;

  const payload = {
    userId,
    name,
    email,
    bio,
    city,
    status,
    interests,
    active: Boolean(active),
    archived: Boolean(archived),
  };

  const originalAvatarUri =
    typeof profileData.avatarUri === "string" ? profileData.avatarUri.trim() : "";
  if (originalAvatarUri) {
    const sanitizedFullAvatar = sanitizeString(
      originalAvatarUri,
      2048,
      String(originalAvatarUri)
    );
    payload.avatarUri = sanitizedFullAvatar || String(originalAvatarUri);
  }

  const incomingLinks = profileData.links;
  if (incomingLinks && typeof incomingLinks === "object") {
    const sanitizedLinks = {};
    const website = sanitizeLink(incomingLinks.website);
    if (website) {
      sanitizedLinks.website = website;
    }
    const donation = sanitizeLink(incomingLinks.donation);
    if (donation) {
      sanitizedLinks.donation = donation;
    }
    const knownLinkKeys = ["website", "donation"].some((key) =>
      Object.prototype.hasOwnProperty.call(incomingLinks, key)
    );
    if (Object.keys(sanitizedLinks).length > 0 || knownLinkKeys) {
      let serialized = "";
      if (Object.keys(sanitizedLinks).length > 0) {
        serialized = JSON.stringify(sanitizedLinks);
        if (serialized.length > 300 && sanitizedLinks.donation) {
          serialized = JSON.stringify({
            donation: sanitizedLinks.donation.slice(0, 260),
          });
        }
        if (serialized.length > 300) {
          serialized = "";
        }
      }
      payload.links = serialized;
    }
  } else if (
    typeof incomingLinks === "string" &&
    incomingLinks.trim().length > 0
  ) {
    payload.links = incomingLinks.trim().slice(0, 300);
  }

  if (typeof location === "string" && location.length) {
    payload.location = location;
  }

  if (typeof age === "number") {
    payload.age = age;
  }

  return payload;
};

const formatAppwriteError = (error, fallbackMessage) => {
  const message = error?.response?.message || error?.message || fallbackMessage;
  return message || "Something went wrong. Please try again.";
};

// SIGN UP - Web compatible (creates account and session)
export const signupWithEmail = async (email, password, name = "Auri User") => {
  const normalizedEmail = sanitizeString(email, 320);
  const normalizedName = sanitizeString(name, 255, "Auri User");
  
  // Create the account
  await account.create(IDs.unique(), normalizedEmail, password, normalizedName);
  
  // Create session so user is logged in
  return await account.createEmailPasswordSession(normalizedEmail, password);
};

// Safe login: Check if already logged in with matching email, else create session
export const safeLogin = async (email, password) => {
  const normalizedEmail = sanitizeString(email, 320);
  if (!normalizedEmail || !password) {
    throw new Error("Email and password are required.");
  }

  try {
    const currentUser = await account.get();
    if (currentUser && currentUser.email?.toLowerCase() === normalizedEmail.toLowerCase()) {
      return currentUser;
    }
    await account.deleteSessions('current');
  } catch (error) {
    // No active session or unable to clear sessions; proceed to login
  }

  try {
    await account.createEmailPasswordSession(normalizedEmail, password);
  } catch (sessionError) {
    throw new Error(formatAppwriteError(sessionError, "Unable to sign in with those credentials."));
  }

  try {
    return await account.get();
  } catch (getError) {
    throw new Error(formatAppwriteError(getError, "Signed in but unable to load your account."));
  }
};

// LOGIN (new method name) - deprecated, use safeLogin
export const loginWithEmail = async (email, password) => {
  return await safeLogin(email, password);
};

// LOGOUT (delete all sessions)
export const logoutCurrent = async () => {
  return await account.deleteSessions('current');
};

// WHO AM I?
export const getCurrentUser = async () => {
  return await account.get();
};

// Safe upsert user profile: Try create with permissions, fallback to update
export const safeUpsertUserProfile = async (userId, profileData) => {
  if (!userId) {
    throw new Error("Missing user identifier while saving profile.");
  }

  const payload = sanitizeProfilePayload(userId, profileData);
  const creationPermissions = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];

  let encounteredUnauthorized = false;
  let createConflict = false;

  const tryUpdateDocument = async (documentId) => {
    if (!documentId) {
      return null;
    }

    try {
      return await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        COLLECTION_USERS_ID,
        documentId,
        payload
      );
    } catch (updateError) {
      const code = updateError?.code ?? updateError?.response?.code;
      if (code === 401 || code === 403) {
        encounteredUnauthorized = true;
        console.warn("safeUpsertUserProfile:update unauthorized", updateError);
        return null;
      }
      if (code === 1008) {
        encounteredUnauthorized = true;
        console.warn("safeUpsertUserProfile:update server error fallback", updateError);
        return null;
      }
      if (code === 404) {
        return null;
      }

      const message = String(
        updateError?.message ?? updateError?.response?.message ?? ""
      );
      if (message.includes("Permissions must be one of")) {
        console.warn("safeUpsertUserProfile:update permissions fallback", updateError);
        return null;
      }

      throw new Error(formatAppwriteError(updateError, "Unable to update profile."));
    }
  };

  const resolveExistingDocumentId = async () => {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTION_USERS_ID,
        [Query.equal("userId", userId), Query.orderDesc("$updatedAt"), Query.limit(1)]
      );

      const candidate = response?.documents?.[0];
      if (candidate?.$id) {
        return candidate.$id;
      }
      if (candidate?.id) {
        return candidate.id;
      }
    } catch (lookupError) {
      console.warn("safeUpsertUserProfile:lookup", lookupError);
    }
    return null;
  };

  const updatedByRequestedId = await tryUpdateDocument(userId);
  if (updatedByRequestedId) {
    return updatedByRequestedId;
  }

  let existingDocumentId = await resolveExistingDocumentId();
  if (existingDocumentId && existingDocumentId !== userId) {
    const updatedByLookup = await tryUpdateDocument(existingDocumentId);
      if (updatedByLookup) {
        return updatedByLookup;
      }
  }

  try {
    return await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTION_USERS_ID,
      userId,
      payload,
      creationPermissions
    );
  } catch (error) {
    const code = error?.code ?? error?.response?.code;
    const message = String(error?.message ?? error?.response?.message ?? "");
    const isConflict =
      code === 409 ||
      error?.type === "document_already_exists" ||
      /already exists/i.test(message);

    if (isConflict) {
      createConflict = true;
      if (!existingDocumentId) {
        existingDocumentId = await resolveExistingDocumentId();
      }
      const updatedAfterConflict = await tryUpdateDocument(existingDocumentId || userId);
      if (updatedAfterConflict) {
        return updatedAfterConflict;
      }
      if (encounteredUnauthorized) {
        const fallbackDocId = IDs.unique();
        try {
          return await databases.createDocument(
            APPWRITE_DATABASE_ID,
            COLLECTION_USERS_ID,
            fallbackDocId,
            payload,
            creationPermissions
          );
        } catch (fallbackCreateError) {
          const fallbackCode =
            fallbackCreateError?.code ?? fallbackCreateError?.response?.code;
          if (fallbackCode === 409) {
            throw new Error(
              "We couldn't update your profile because of conflicting records. Please contact support."
            );
          }
          throw new Error(
            formatAppwriteError(
              fallbackCreateError,
              "Unable to finalize profile save. Please retry shortly."
            )
          );
        }
      }
    }

    if (encounteredUnauthorized && !createConflict) {
      throw new Error(
        "We couldn't update this profile yet because of access settings. Please retry after refreshing."
      );
    }

    throw new Error(formatAppwriteError(error, "Unable to save profile."));
  }
};

// ==========================================
// USER ACCOUNTS - For multi-account support
// ==========================================

/**
 * Create a new user account in the user_accounts collection
 * @param {string} ownerId - The user ID who owns this account
 * @param {object} accountData - Account data { username, avatarUri, email }
 * @returns {Promise<object>} Created account document
 */
export const createUserAccount = async (ownerId, accountData) => {
  if (!ownerId) {
    throw new Error("Owner ID is required to create an account.");
  }

  const username = sanitizeString(accountData.username, 150, "User");
  const avatarUri = sanitizeString(accountData.avatarUri, 500, "");
  const email = sanitizeString(accountData.email, 100, "");

  const payload = {
    ownerId,
    username,
    avatarUri: avatarUri || null,
    email: email || null,
    lastActive: new Date().toISOString(),
  };

  const permissions = [
    Permission.read(Role.any()),
    Permission.update(Role.user(ownerId)),
    Permission.delete(Role.user(ownerId)),
  ];

  return await databases.createDocument(
    APPWRITE_DATABASE_ID,
    COLLECTION_USER_ACCOUNTS_ID,
    IDs.unique(),
    payload,
    permissions
  );
};

/**
 * Get all accounts from the user_accounts collection
 * @returns {Promise<Array>} Array of account documents
 */
export const getUserAccounts = async () => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTION_USER_ACCOUNTS_ID,
      [Query.orderDesc("lastActive"), Query.limit(100)]
    );
    return response.documents || [];
  } catch (error) {
    console.warn("getUserAccounts: Unable to fetch accounts", error);
    return [];
  }
};

/**
 * Get a single account by account ID
 * @param {string} accountId - The account document ID
 * @returns {Promise<object|null>} Account document or null
 */
export const getAccountById = async (accountId) => {
  if (!accountId) {
    return null;
  }

  try {
    return await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTION_USER_ACCOUNTS_ID,
      accountId
    );
  } catch (error) {
    console.warn("getAccountById: Unable to fetch account", error);
    return null;
  }
};

/**
 * Update an account's lastActive timestamp
 * @param {string} accountId - The account document ID
 * @returns {Promise<object>} Updated account document
 */
export const updateAccountLastActive = async (accountId) => {
  if (!accountId) {
    throw new Error("Account ID is required.");
  }

  return await databases.updateDocument(
    APPWRITE_DATABASE_ID,
    COLLECTION_USER_ACCOUNTS_ID,
    accountId,
    { lastActive: new Date().toISOString() }
  );
};

/**
 * Update an account's profile
 * @param {string} accountId - The account document ID
 * @param {object} updates - Fields to update { username, avatarUri, email }
 * @returns {Promise<object>} Updated account document
 */
export const updateUserAccount = async (accountId, updates) => {
  if (!accountId) {
    throw new Error("Account ID is required.");
  }

  const payload = {};

  if (updates.username !== undefined) {
    payload.username = sanitizeString(updates.username, 150, "User");
  }
  if (updates.avatarUri !== undefined) {
    payload.avatarUri = sanitizeString(updates.avatarUri, 500, "");
  }
  if (updates.email !== undefined) {
    payload.email = sanitizeString(updates.email, 100, "");
  }

  return await databases.updateDocument(
    APPWRITE_DATABASE_ID,
    COLLECTION_USER_ACCOUNTS_ID,
    accountId,
    payload
  );
};

/**
 * Delete a user account
 * @param {string} accountId - The account document ID
 * @returns {Promise<void>}
 */
export const deleteUserAccount = async (accountId) => {
  if (!accountId) {
    throw new Error("Account ID is required.");
  }

  return await databases.deleteDocument(
    APPWRITE_DATABASE_ID,
    COLLECTION_USER_ACCOUNTS_ID,
    accountId
  );
};

/**
 * Count how many accounts a user has
 * @param {string} ownerId - The user ID
 * @returns {Promise<number>} Number of accounts
 */
export const countUserAccounts = async (ownerId) => {
  if (!ownerId) {
    return 0;
  }

  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTION_USER_ACCOUNTS_ID,
      [Query.equal("ownerId", ownerId), Query.limit(1)]
    );
    return response.total || 0;
  } catch (error) {
    console.warn("countUserAccounts: Unable to count accounts", error);
    return 0;
  }
};

/**
 * Get the active account from localStorage (web compatible)
 * @returns {Promise<string|null>} Active account ID or null
 */
export const getActiveAccountId = async () => {
  try {
    return localStorage.getItem("@auri_active_account_id");
  } catch (error) {
    console.warn("getActiveAccountId: Unable to get from storage", error);
    return null;
  }
};

/**
 * Set the active account in localStorage (web compatible)
 * @param {string} accountId - The account document ID to set as active
 * @returns {Promise<void>}
 */
export const setActiveAccountId = async (accountId) => {
  try {
    if (accountId) {
      localStorage.setItem("@auri_active_account_id", accountId);
    } else {
      localStorage.removeItem("@auri_active_account_id");
    }
  } catch (error) {
    console.warn("setActiveAccountId: Unable to set in storage", error);
  }
};

/**
 * Create the first account for a new user (from their profile)
 * @param {string} ownerId - The user ID
 * @param {object} userProfile - User profile data { name, email, avatarUri }
 * @returns {Promise<object>} Created account document
 */
export const createFirstUserAccount = async (ownerId, userProfile) => {
  return await createUserAccount(ownerId, {
    username: userProfile.name || "User",
    avatarUri: userProfile.avatarUri || null,
    email: userProfile.email || null,
  });
};

/**
 * Fix permissions on all user accounts to allow any user to read them
 * @returns {Promise<number>} Number of accounts updated
 */
export const fixAccountPermissions = async () => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTION_USER_ACCOUNTS_ID,
      [Query.limit(100)]
    );

    let updatedCount = 0;

    for (const accountDoc of response.documents || []) {
      const ownerId = accountDoc.ownerId;
      
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        COLLECTION_USER_ACCOUNTS_ID,
        accountDoc.$id,
        { lastActive: accountDoc.lastActive },
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(ownerId)),
          Permission.delete(Role.user(ownerId)),
        ]
      );
      
      updatedCount++;
      console.log(`Fixed permissions for account: ${accountDoc.$id}`);
    }

    console.log(`Fixed permissions on ${updatedCount} accounts`);
    return updatedCount;
  } catch (error) {
    console.error("Failed to fix account permissions:", error);
    throw error;
  }
};

/**
 * Ensure the owner account exists in user_accounts collection
 * @param {string} ownerId - The user ID
 * @param {object} userProfile - User profile data { name, email, avatarUri }
 * @returns {Promise<object>} The owner (primary) account document
 */
export const ensureOwnerAccountExists = async (ownerId, userProfile) => {
  if (!ownerId) {
    throw new Error("Owner ID is required.");
  }

  try {
    const existing = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTION_USER_ACCOUNTS_ID,
      [Query.equal("ownerId", ownerId), Query.equal("isPrimary", true), Query.limit(1)]
    );

    if (existing.total > 0) {
      console.log("Owner account already exists:", existing.documents[0].$id);
      return existing.documents[0];
    }

    console.log("Creating owner account for:", ownerId);
    const payload = {
      ownerId,
      username: userProfile.name || "Me",
      avatarUri: userProfile.avatarUri || null,
      email: userProfile.email || null,
      lastActive: new Date().toISOString(),
      isPrimary: true,
    };

    const permissions = [
      Permission.read(Role.any()),
      Permission.update(Role.user(ownerId)),
      Permission.delete(Role.user(ownerId)),
    ];

    return await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTION_USER_ACCOUNTS_ID,
      IDs.unique(),
      payload,
      permissions
    );
  } catch (error) {
    console.error("ensureOwnerAccountExists failed:", error);
    throw error;
  }
};

