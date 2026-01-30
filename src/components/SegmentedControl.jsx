import React from 'react';
import { useAppTheme } from '../theme';
import { radii, spacing, colors } from '../theme/tokens';

export const SegmentedControl = ({ options, value, onChange }) => {
  const theme = useAppTheme();

  return (
    <div
      style={{
        display: 'flex',
        backgroundColor: theme.card,
        padding: spacing.xs,
        borderRadius: radii.pill,
        border: `1px solid ${theme.border}`,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            style={{
              flex: 1,
              padding: `${spacing.sm}px 0`,
              borderRadius: radii.pill,
              backgroundColor: active ? colors.peach : 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                color: active ? '#fff' : theme.text,
                fontWeight: 600,
              }}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
