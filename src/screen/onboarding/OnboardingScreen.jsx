import React, { useState, useEffect } from "react"; 
import { motion, AnimatePresence } from "framer-motion"; 
import { colors, spacing } from "../../theme/tokens";
import { LoginScreen } from "../auth/LoginScreen";
import { SignupScreen } from "../auth/SignupScreen";

const OnboardingScreen = () => {
  const slides = [
    { id: "share", copy: "Share your world", image: "/photos/share_your_world.jpg" },
    { id: "circle", copy: "Stay close with your circle", image: "/photos/your_circle.jpg" },
    { id: "memories", copy: "Stories that fade, memories that stay", image: "/photos/stories_memories.jpg" },
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[index];

  return (
    <div style={styles.hero}>
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.6 }}
          style={{
            ...styles.heroImage,
            backgroundImage: `url(${slide.image})`,
          }}
        />
      </AnimatePresence>

      <div style={styles.heroContent}>
        <h1 style={styles.heroTitle}>{slide.copy}</h1>
        <p style={styles.heroMeta}>
          Auri keeps your corner of the internet warm and respectful.
        </p>
      </div>
    </div>
  );
};

export const AuthFlow = () => {
  const [screen, setScreen] = useState("login");

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .auth-shell .left {
            display: none !important;
          }
          .auth-shell .right {
            flex: 1 !important;
            width: 100% !important;
            min-width: 100% !important;
            max-width: 100% !important;
          }
          .auth-shell {
            flex-direction: column !important;
          }
        }
      `}</style>
      <div style={styles.shell} className="auth-shell">
        {/* LEFT — Onboarding visuals */}
        <div style={styles.left} className="left">
          <OnboardingScreen />
        </div>

        {/* RIGHT — Auth */}
        <div style={styles.right} className="right">
          <AnimatePresence mode="wait">
            {screen === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <LoginScreen onSignup={() => setScreen("signup")} />
              </motion.div>
            )}

            {screen === "signup" && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <SignupScreen onBack={() => setScreen("login")} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

const styles = {
  shell: {
    width: "100%",
    height: "100vh",
    display: "flex",
    backgroundColor: colors.slate900,
  },

  /* LEFT */
  left: {
    flex: 1.6,
    position: "relative",
    overflow: "hidden",
  },

  hero: {
    width: "100%",
    height: "100%",
    position: "relative",
  },

  heroImage: {
    position: "absolute",
    inset: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
  },

  heroContent: {
    position: "absolute",
    bottom: spacing.xxl * 2,
    left: spacing.xxl,
    maxWidth: 520,
    color: "#fff",
  },

  heroTitle: {
    fontSize: 48,
    fontWeight: 800,
    lineHeight: "1.1",
    marginBottom: spacing.md,
  },

  heroMeta: {
    fontSize: 16,
    opacity: 0.75,
  },

  /* RIGHT */
  right: {
    flex: 1,
    backgroundColor: colors.slate900,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  authContainer: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: 14,
    width: 360,
    display: "flex",
    flexDirection: "column",
    gap: spacing.lg,
    boxShadow: "0px 10px 30px rgba(0,0,0,0.25)",
  },

  title: {
    fontSize: 28,
    fontWeight: 700,
  },

  subtitle: {
    fontSize: 16,
    color: colors.slate600,
  },

  meta: {
    fontSize: 14,
    color: colors.slate500,
  },

  link: {
    color: colors.peach,
    cursor: "pointer",
    fontWeight: 600,
  },
};

