import { useAppTheme } from '../theme';
import { radii, spacing } from '../theme/tokens';
import { shadowForPlatform } from '../theme/shadows';

export const Card = ({ children, style }) => {
  const { theme } = useAppTheme();
  return (
    <div
      style={[
        {
        backgroundColor: theme.card,
        borderRadius: radii.card,
        ...shadowForPlatform,
        padding: spacing.xl,
       border: `1px solid ${theme.border}`,
      },
     style,
    ]}
    >
      {children}
    </div>
  )
}