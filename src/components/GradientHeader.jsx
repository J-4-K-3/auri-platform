import React from 'react';
import { gradients, spacing } from '../theme/tokens';

export const GradientHeader = ({ title, subtitle, right }) => {
  return (
    <div
      style={{
        background: `linear-gradient(to right, ${gradients.warm[0]}, ${gradients.warm[1]})`,
        padding: `${spacing.xxl}px ${spacing.xl}px`,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xl,
        }}
      >
        <div style={{ flex: 1 }}>
          {title ? (
            <div
              style={{
                color: '#0F1220',
                fontWeight: 700,
                fontSize: 24,
              }}
            >
              {title}
            </div>
          ) : null}
          {subtitle ? (
            <div
              style={{
                color: 'rgba(15, 18, 32, 0.72)',
                marginTop: spacing.sm,
                fontSize: 14,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        {right}
      </div>
    </div>
  );
};
