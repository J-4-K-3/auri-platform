import { gradients } from './tokens';

export const buildGradient = (type = 'warm') => {
  switch (type) {
    case 'warm':
      return gradients.warm;
    case 'subtle':
      return gradients.subtle;
    case 'headerFade':
      return gradients.headerFade;
    default:
      return gradients.warm;
  }
};
