import React from 'react';
import { useAppTheme } from '../theme';
import { colors, radii, spacing } from '../theme/tokens';

const gradientMap = {
  primary: ['#FFC14D', '#FF8A65', '#F76E8E'],
  subtle: ['rgba(255, 138, 101, 0.7)', 'rgba(247, 110, 142, 0.85)'],
};

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  accessory,
}) => {
  const theme = useAppTheme();

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        borderRadius: radii.pill,
        gap: spacing.md,
      }}
    >
      {loading ? (
        <p
        style={{
          color: colors.white,
          fontWeight: 600,
          fontSize: 14,
        }}
        >
          Laoding...
        </p>
      ) : (
        <>
          <span
            style={{
              color: variant === 'ghost' ? theme.text : colors.white,
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {title}
          </span>
          {accessory}
        </>
      )}
    </div>
  );

  const baseStyle = {
    borderRadius: radii.pill,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'opacity 0.2s',
  };

  if (variant === 'primary') {
    return (
      <button
        onClick={onPress}
        disabled={disabled || loading}
        style={{
          ...baseStyle,
          background: `linear-gradient(45deg, ${gradientMap.primary.join(', ')})`,
          border: 'none',
          ...style,
        }}
      >
        {content}
      </button>
    );
  }

  if (variant === 'subtle') {
    return (
      <button
        onClick={onPress}
        disabled={disabled || loading}
        style={{
          ...baseStyle,
          background: `linear-gradient(45deg, ${gradientMap.subtle.join(', ')})`,
          border: 'none',
          ...style,
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <button
      onClick={onPress}
      disabled={disabled || loading}
      style={{
        ...baseStyle,
        border: `1px solid ${theme.border}`,
        background: 'transparent',
        ...style,
      }}
    >
      {content}
    </button>
  );
};
