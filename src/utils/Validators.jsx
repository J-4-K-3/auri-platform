const NSFW_TERMS = ['nsfw', 'explicit', 'porn', 'nudity', 'violence'];

export const validatePassword = (value) => {
  if (!value || value.length < 8) {
    return 'Use at least 8 characters.';
  }
  if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
    return 'Include a number and uppercase letter.';
  }
  return null;
};

export const validateAge = (age) => {
  if (!age) return 'Age is required';
  if (Number(age) < 13) return 'You must be at least 13 to join Auri.';
  return null;
};

export const guardNSFW = (text = '') => {
  const lower = text.toLowerCase();
  const triggers = NSFW_TERMS.filter((term) => lower.includes(term));
  return triggers.length ? triggers : null;
};

