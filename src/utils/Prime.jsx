import { upsertUser } from '../store/slices/usersSlice';
import { hydratePosts, resetPosts } from '../store/slices/postsSlice';
import { hydrateStories } from '../store/slices/storiesSlice';
import { hydrateChats } from '../store/slices/chatSlice';
import { setTrending, setResults } from '../store/slices/exploreSlice';

const ensureStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )
  );
};

const sanitizeString = (value, fallback = null) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return fallback;
};

const safeAvatarUri = (uri) => {
  if (typeof uri === 'string' && uri.startsWith('http')) {
    return uri;
  }
  return null;
};

const normalizeUserProfile = (overrides = {}) => {
  const id = overrides.id ?? overrides.userId ?? overrides.$id ?? null;
  if (!id) {
    return null;
  }

  return {
    id,
    name: sanitizeString(overrides.name, 'You'),
    email: sanitizeString(overrides.email),
    avatarUri: safeAvatarUri(overrides.avatarUri),
    bio: sanitizeString(overrides.bio, ''),
    location: sanitizeString(overrides.location ?? overrides.city ?? '', ''),
    status: sanitizeString(overrides.status, ''),
    interests: ensureStringArray(overrides.interests),
    followers: ensureStringArray(overrides.followers),
    following: ensureStringArray(overrides.following),
    age: overrides.age ?? null,
    createdAt: overrides.createdAt ?? null,
  };
};

const normalizePosts = (posts) => {
  if (!Array.isArray(posts)) return [];
  return posts
    .filter((post) => post && post.id && post.userId)
    .map((post) => {
      const likes = ensureStringArray(post.likes);
      const commentCount =
        typeof post.commentCount === 'number'
          ? post.commentCount
          : Array.isArray(post.comments)
          ? post.comments.length
          : 0;

      return {
        ...post,
        likes,
        comments: [],
        commentCount,
      };
    });
};

const normalizeStoryItems = (items, story) => {
  // If items array exists, normalize it
  if (Array.isArray(items) && items.length > 0) {
    return items.map((item) => ({
      ...item,
      mediaUri: item.mediaUri || item.mediaUrl,
      views: ensureStringArray(item?.views),
    }));
  }

  // If no items array but story has mediaUrl/mediaType, create item from story
  if (story?.mediaUrl || story?.mediaUri) {
    return [{
      id: story?.id || `story-item-${Date.now()}`,
      mediaUri: story.mediaUri || story.mediaUrl,
      mediaType: story.mediaType,
      caption: story.caption || '',
      views: ensureStringArray(story?.views),
      createdAt: story?.createdAt || new Date().toISOString(),
    }];
  }

  return [];
};

const normalizeStories = (stories) => {
  if (!Array.isArray(stories)) return [];
  return stories
    .filter((story) => story && story.userId)
    .map((story) => ({
      ...story,
      items: normalizeStoryItems(story.items, story),
      views: ensureStringArray(story.views),
    }));
};

const normalizeChatsPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return { chats: [], messagesByChatId: {} };
  }

  const chats = Array.isArray(payload.chats) ? payload.chats : [];
  const messagesByChatId =
    payload.messagesByChatId && typeof payload.messagesByChatId === 'object'
      ? payload.messagesByChatId
      : {};

  return {
    chats,
    messagesByChatId,
  };
};

export const primeExperience = (dispatch, userOverrides = {}, content = {}) => {
  const currentUser = normalizeUserProfile(userOverrides);

  if (currentUser) {
    dispatch(upsertUser(currentUser));
  }

  const posts = normalizePosts(content.posts);
  if (posts.length) {
    dispatch(resetPosts());
    dispatch(hydratePosts(posts));
  } else {
    dispatch(resetPosts());
  }

  const stories = normalizeStories(content.stories);
  dispatch(hydrateStories(stories));

  const chatPayload = normalizeChatsPayload(content.chats);
  dispatch(hydrateChats(chatPayload));

  const trendingPosts = Array.isArray(content.trending) ? content.trending : [];
  const resultsPosts = Array.isArray(content.results) ? content.results : [];

  dispatch(setTrending(trendingPosts));
  dispatch(setResults(resultsPosts));

  return currentUser;
};
