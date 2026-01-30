import { shadows } from './tokens';

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isAndroid = /Android/.test(navigator.userAgent);

export const shadowForPlatform = isIOS
  ? shadows.ios
  : isAndroid
  ? shadows.android
  : shadows.default ?? {};
