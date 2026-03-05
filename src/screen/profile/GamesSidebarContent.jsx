import React, { useState } from "react";
import {
  FiChevronLeft,
  FiSlack,
  FiDollarSign,
  FiX,
} from "react-icons/fi";
import { useAppTheme } from "../../theme";
import { colors } from "../../theme/tokens";
import { Button } from "../../components/Button";

// Section Component
const Section = ({ title, children }) => {
  const theme = useAppTheme();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        borderRadius: "24px",
        padding: "24px",
        backgroundColor: theme.card,
      }}
    >
      <span
        style={{
          fontSize: 18,
          fontWeight: "600",
          marginBottom: "8px",
          color: theme.text,
        }}
      >
        {title}
      </span>
      {children}
    </div>
  );
};

// Row Component
const Row = ({ label, subtext, right, onPress, icon: Icon }) => {
  const theme = useAppTheme();

  const content = (
    <div style={styles.row}>
      <div
        style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}
      >
        {Icon && <Icon size={20} color={theme.text} />}
        <div style={{ flex: 1 }}>
          <span style={{ ...styles.rowLabel, color: theme.text }}>
            {label}
          </span>
          {subtext && (
            <span style={{ ...styles.rowSubtext, color: theme.subText }}>
              {subtext}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {right}
      </div>
    </div>
  );

  if (typeof onPress === "function") {
    return (
      <button
        onClick={onPress}
        style={{
          ...styles.row,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
        }}
      >
        {content}
      </button>
    );
  }

  return content;
};

// Games List Component
const GamesList = ({ onGameSelect }) => {
  const theme = useAppTheme();

  const games = [
    { id: "tictactoe", name: "Tic-Tac-Toe", icon: "🎮", comingSoon: false },
    { id: "memory", name: "Memory Card Game", icon: "🃏", comingSoon: false },
    { id: "snake", name: "Snake", icon: "🐍", comingSoon: false },
    { id: "puzzle", name: "Puzzle Slider", icon: "🧩", comingSoon: false },
    { id: "wordguess", name: "Word Guessing Game", icon: "🔤", comingSoon: false },
    { id: "trivia", name: "Simple Trivia", icon: "❓", comingSoon: false },
  ];

  return (
    <div style={styles.gamesList}>
      {games.map((game) => (
        <div
          key={game.id}
          style={{
            ...styles.gameCard,
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          onClick={() => !game.comingSoon && onGameSelect?.(game.id)}
        >
          <span style={{ fontSize: "32px" }}>{game.icon}</span>
          <span style={{ color: theme.text, fontWeight: "500" }}>
            {game.name}
          </span>
          {game.comingSoon && (
            <span
              style={{
                fontSize: "10px",
                color: colors.peach,
                backgroundColor: "rgba(255,140,101,0.2)",
                padding: "2px 8px",
                borderRadius: "10px",
              }}
            >
              Coming Soon
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// Fun Rewards Info Component
const FunRewardsInfo = () => {
  const theme = useAppTheme();

  return (
    <div style={styles.rewardsCard}>
      <div style={styles.rewardsHeader}>
        <FiDollarSign size={24} color={colors.peach} />
        <span style={{ color: theme.text, fontWeight: "600", fontSize: "16px" }}>
          Fun Rewards
        </span>
      </div>
      <p style={{ color: theme.subText, fontSize: "13px", marginTop: "12px" }}>
        Fun Rewards is our way of saying thanks to our amazing community! Play
        simple mini-games for entertainment and earn $0.50 via PayPal as a token
        of appreciation.
      </p>
      <p
        style={{
          color: theme.subText,
          fontSize: "13px",
          marginTop: "8px",
        }}
      >
        The more our community grows, the more rewards we'll be able to share.
        No promises, just genuine appreciation for being part of Auri.
      </p>
      <Button
        title="Learn More"
        variant="ghost"
        style={{
          marginTop: "16px",
          borderColor: colors.peach,
          color: colors.peach,
          width: "auto",
        }}
        onPress={() => alert("Fun Rewards - Coming Soon!\n\nWe're working on bringing you exciting mini-games with rewards!")}
      />
    </div>
  );
};

export const GamesSidebarContent = ({
  theme,
  onClose,
}) => {
  const appTheme = useAppTheme();
  const effectiveTheme = theme || appTheme;
  const [selectedGame, setSelectedGame] = useState(null);

  const handleBack = () => {
    if (selectedGame) {
      setSelectedGame(null);
    } else {
      onClose?.();
    }
  };

  const handleGameSelect = (gameId) => {
    // For now, show an alert that the game is coming soon
    alert(`${gameId} - Coming Soon!\n\nWe're working on bringing you this exciting game!`);
  };

  const getTitle = () => {
    if (selectedGame) {
      return selectedGame.charAt(0).toUpperCase() + selectedGame.slice(1);
    }
    return "Mini Games";
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button
          className="games-back-btn"
          onClick={handleBack}
          style={styles.backButton}
        >
          <FiX size={24} color={effectiveTheme.text} />
        </button>
        <h2
          style={{
            ...styles.title,
            color: effectiveTheme.text,
          }}
        >
          {getTitle()}
        </h2>
        <button
          style={{
            ...styles.closeButton,
            opacity: 0.50,
          }}
        >
          <FiDollarSign size={24} color={effectiveTheme.text} />
        </button>
      </div>

      <div className="profile-games-content" style={styles.content}>
        <style>{`
          .profile-games-content::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {/* Games Coming Soon Banner */}
        <div
          style={{
            ...styles.banner,
            backgroundColor: "rgba(255,140,101,0.1)",
            border: `1px solid ${colors.peach}`,
          }}
        >
          <FiSlack size={48} color={colors.peach} />
          <span
            style={{
              color: effectiveTheme.text,
              fontSize: "18px",
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            Games Coming Soon!
          </span>
          <span
            style={{
              color: effectiveTheme.subText,
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            We're working on bringing you fun mini-games. Here are some ideas for
            what we have in mind:
          </span>
        </div>

        {/* Games List */}
        <Section title="Available Games">
          <GamesList onGameSelect={handleGameSelect} />
        </Section>

        {/* Fun Rewards Section */}
        <Section title="Fun Rewards">
          <FunRewardsInfo />
        </Section>

        <div style={styles.footerInfo}>
          <p style={{ color: effectiveTheme.subText, fontSize: "12px", textAlign: "center" }}>
            🎮 Play games, earn rewards! Stay tuned for updates.
          </p>
        </div>
      </div>
    </div>
  );
};

// Inline Styles
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "24px",
    gap: "24px",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    textAlign: "center",
    flex: 1,
  },
  content: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  banner: {
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  gamesList: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
  },
  gameCard: {
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  rewardsCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "16px",
  },
  rewardsHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "4px",
    paddingBottom: "4px",
    width: "100%",
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "500",
    display: "block",
  },
  rowSubtext: {
    fontSize: 12,
    display: "block",
  },
  footerInfo: {
    paddingTop: "12px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
};

export default GamesSidebarContent;

