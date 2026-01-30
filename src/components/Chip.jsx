import { useAppTheme } from "../theme";
import { colors, radii, spacing } from "../theme/tokens";

export const Chip = ({ label, active = false, onClick, style }) => {
  const theme = useAppTheme();

  const baseStyle = {
    padding: `${spacing.sm}px ${spacing.lg}px`,
    borderRadius: radii.chip,
    backgroundColor: active ? colors.peach : theme.card,
    border: `1px solid ${active ? colors.blush : theme.border}`,
    color: active ? colors.white : theme.text,
    fontWeight: active ? 600 : 500,
    fontSize: 14,
    cursor: "pointer",
    outline: "none",
  };

  return (
    <button
      onClick={onClick}
      style={{ ...baseStyle, ...style }}
    >
      {label}
    </button>
  );
};
