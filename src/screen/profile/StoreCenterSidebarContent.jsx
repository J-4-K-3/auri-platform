import React from "react";
import { FiX, FiShoppingBag } from "react-icons/fi";
import { useAppTheme } from "../../theme";
import { spacing } from "../../theme/tokens";

export const StoreCenterSidebarContent = ({ theme, onClose }) => {
  const appTheme = theme || useAppTheme();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: spacing.xl,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.xl,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: spacing.xs,
          }}
        >
          <FiX size={24} color={appTheme.text} />
        </button>
        <h2
          style={{
            color: appTheme.text,
            fontSize: 20,
            fontWeight: "600",
            marginTop: 0,
            marginRight: 0,
            marginBottom: 0,
            marginLeft: 0,
          }}
        >
          Store Center
        </h2>
        <div style={{ width: 24 }} />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: spacing.md,
        }}
      >
        <FiShoppingBag size={64} color={appTheme.subText} />
        <h3
          style={{
            color: appTheme.text,
            fontSize: 20,
            fontWeight: "600",
            marginTop: 0,
            marginRight: 0,
            marginBottom: 0,
            marginLeft: 0,
          }}
        >
          Store is almost ready!
        </h3>
        <p
          style={{
            color: appTheme.subText,
            fontSize: 14,
            maxWidth: 250,
            lineHeight: 1.5,
          }}
        >
          We're curating the best products for you. Stay tuned!
        </p>
      </div>
    </div>
  );
};

export default StoreCenterSidebarContent;
