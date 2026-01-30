import React from 'react';
import { radii, spacing, colors } from '../theme/tokens';

// Fallback gradient colors
const fallbackBackgrounds = ['#FFC14D', '#FF8A65', '#F76E8E'];

const FallbackAvatar = ({ size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(45deg, ${fallbackBackgrounds.join(', ')})`,
      willChange: 'transform',
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden'
    }}
  >
    <span
      style={{
        color: colors.white,
        fontWeight: 700,
        fontSize: 25,
      }}
    >
      A
    </span>
  </div>
);

export const Avatar = ({ uri, size = 64, ring = false }) => {
  const innerSize = ring ? size - 6 : size;
  const hasUri = Boolean(uri);

  const core = hasUri ? (
    <img
      src={uri}
      alt="avatar"
      style={{
        width: innerSize,
        height: innerSize,
        borderRadius: innerSize / 2,
        border: `1px solid ${colors.black}`,
        objectFit: 'cover',
        willChange: 'transform',
    backfaceVisibility: 'hidden',
      }}
    />
  ) : (
    <FallbackAvatar size={innerSize} />
  );

  if (!ring) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
        }}
      >
        {core}
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        padding: spacing.xs,
        borderRadius: size / 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(45deg, ${fallbackBackgrounds.join(', ')})`,
      }}
    >
      <div
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          overflow: 'hidden',
          backgroundColor: 'rgba(0,0,0,0.4)',
        }}
      >
        {core}
      </div>
    </div>
  );
};
