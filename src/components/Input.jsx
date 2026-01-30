import React from 'react';
import { useAppTheme } from '../theme';
import { radii, spacing } from '../theme/tokens';

export const Input = React.forwardRef(({ label, error, style, ...props }, ref) => {
  const theme = useAppTheme();

  return (
    <div style={{ width: '100%' }}>
      {label ? (
        <label
          style={{
            display: 'block',
            color: theme.subText,
            marginBottom: spacing.sm,
            fontWeight: 500,
          }}
        >
          {label}
        </label>
      ) : null}

      <input
        ref={ref}
        style={{
          backgroundColor: theme.card,
          borderRadius: radii.input,
          padding: spacing.lg,
          border: `1px solid ${error ? '#FF5A5F' : theme.border}`,
          color: theme.text,
          width: '100%',
          boxSizing: 'border-box',
          ...style,
        }}
        {...props}
      />

      {error ? (
        <span
          style={{
            color: '#FF5A5F',
            marginTop: spacing.xs,
            fontSize: 12,
            display: 'block',
          }}
        >
          {error}
        </span>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
