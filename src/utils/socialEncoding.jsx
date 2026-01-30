const LIKE_TOKEN_LENGTH = 5;

const coerceString = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "[object Object]") {
    return null;
  }

  return trimmed;
};

export const encodeLikeToken = (userId) => {
  const normalized = coerceString(
    typeof userId === "string" || typeof userId === "number"
      ? String(userId)
      : ""
  );

  if (!normalized) {
    return null;
  }

  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }

  const positive = Math.abs(hash);
  const encoded = positive.toString(36).padStart(LIKE_TOKEN_LENGTH, "0");
  return encoded.slice(-LIKE_TOKEN_LENGTH);
};

export const normalizeLikeToken = (value) => {
  const direct = coerceString(value);
  if (!direct) {
    return null;
  }

  if (direct.length === LIKE_TOKEN_LENGTH) {
    return direct;
  }

  if (direct.length > LIKE_TOKEN_LENGTH) {
    return encodeLikeToken(direct);
  }

  return direct.padStart(LIKE_TOKEN_LENGTH, "0").slice(-LIKE_TOKEN_LENGTH);
};

export const normalizeLikeTokenArray = (likes) => {
  if (Array.isArray(likes)) {
    return likes
      .map((item) => normalizeLikeToken(item))
      .filter((token) => typeof token === "string" && token.length > 0);
  }

  if (likes === null || likes === undefined) {
    return [];
  }

  const token = normalizeLikeToken(likes);
  return token ? [token] : [];
};

export const encodeCommentRecord = (comment) => {
  if (!comment || typeof comment !== "object") {
    return null;
  }

  const payload = {
    ...comment,
    likes: Array.isArray(comment.likes) ? comment.likes : [],
    replies: Array.isArray(comment.replies) ? comment.replies : [],
  };

  try {
    const encoded = JSON.stringify(payload);
    return encoded.length > 950 ? encoded.slice(0, 950) : encoded;
  } catch (error) {
    return null;
  }
};

export const encodeCommentArray = (comments) => {
  if (!Array.isArray(comments)) {
    const encoded = encodeCommentRecord(comments);
    return encoded ? [encoded] : [];
  }

  return comments
    .map((comment) => {
      if (typeof comment === "string") {
        return coerceString(comment);
      }
      return encodeCommentRecord(comment);
    })
    .filter((encoded) => typeof encoded === "string" && encoded.length > 0);
};

export const decodeCommentRecord = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "object") {
    return {
      ...value,
      likes: Array.isArray(value.likes) ? value.likes : [],
      replies: Array.isArray(value.replies) ? value.replies : [],
    };
  }

  const candidate = coerceString(value);
  if (!candidate) {
    return null;
  }

  try {
    const parsed = JSON.parse(candidate);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return {
      ...parsed,
      likes: Array.isArray(parsed.likes) ? parsed.likes : [],
      replies: Array.isArray(parsed.replies) ? parsed.replies : [],
    };
  } catch (error) {
    return {
      id: encodeLikeToken(candidate) ?? candidate,
      text: candidate,
      likes: [],
      replies: [],
      createdAt: new Date().toISOString(),
    };
  }
};

export const decodeCommentArray = (comments) => {
  if (!Array.isArray(comments)) {
    const decoded = decodeCommentRecord(comments);
    return decoded ? [decoded] : [];
  }

  return comments
    .map((comment) => decodeCommentRecord(comment))
    .filter((decoded) => decoded && typeof decoded === "object");
};
