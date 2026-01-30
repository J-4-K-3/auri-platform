import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors } from '../../theme/tokens';

const WAVE_WIDTH = 240;
export const SplashScreen = () => {
  const navigate = useNavigate();
  const shimmerRef = useRef(null);

  useEffect(() => {
    // Animate shimmer wave using CSS
    if (shimmerRef.current) {
      shimmerRef.current.animate(
        [
          { transform: `translateX(-${WAVE_WIDTH}px)` },
          { transform: `translateX(${WAVE_WIDTH * 2}px)` },
        ],
        {
          duration: 2500,
          iterations: Infinity,
        }
      );
    }

    // Redirect after 10 seconds
    const timeout = setTimeout(() => {
      navigate('/onboarding');
    }, 10000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.gradient,
          background: `linear-gradient(to right, #FFC14D, #FF8A65, #F76E8E)`,
        }}
      >
        <div style={styles.logoContainer}>
          <div style={styles.logo}>Auri</div>
          <div style={styles.tagline}>A calm place to share your world.</div>
        </div>

        <div ref={shimmerRef} style={styles.wave}>
          <div
            style={{
              ...styles.waveFill,
              background: `linear-gradient(to right, rgba(255,255,255,0.2), rgba(255,255,255,0.05))`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    height: '100vh',
    backgroundColor: colors.gold,
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    zIndex: 2,
  },
  logo: {
    fontSize: 42,
    fontWeight: 700,
    color: colors.slate900,
    letterSpacing: 4,
  },
  tagline: {
    color: 'rgba(15,18,32,0.7)',
    fontSize: 16,
  },
  wave: {
    position: 'absolute',
    width: WAVE_WIDTH,
    height: WAVE_WIDTH,
    bottom: 120,
    opacity: 0.4,
    borderRadius: WAVE_WIDTH,
    overflow: 'hidden',
  },
  waveFill: {
    width: '100%',
    height: '100%',
    borderRadius: WAVE_WIDTH,
  },
};
