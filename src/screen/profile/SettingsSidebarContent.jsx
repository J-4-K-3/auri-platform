import React, { useState, useMemo } from "react";
import {
  FiChevronLeft,
  FiHeart,
  FiGift,
  FiUsers,
  FiShoppingBag,
  FiPackage,
  FiLock,
  FiRefreshCw,
  FiShield,
  FiCreditCard,
  FiEye,
  FiMessageSquare,
  FiBell,
  FiMail,
  FiSliders,
  FiPlay,
  FiImage,
  FiHelpCircle,
  FiAlertTriangle,
  FiInfo,
  FiZap,
  FiPlayCircle,
  FiShare2,
  FiCopy,
  FiAward,
  FiStar,
  FiCheck,
  FiExternalLink,
  FiArrowRight,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAppTheme } from "../../theme";
import { colors } from "../../theme/tokens";
import { Button } from "../../components/Button";
import {
  setTheme,
  toggleHaptics,
  toggleReduceMotion,
  toggleDataSaver,
  toggleShowStatusReels,
} from "../../store/slices/uiSlice";
import { logout } from "../../store/slices/authSlice";

// GCash QR image path
const GCASH_QR_IMAGE = "/photos/gcash_qr.jpeg";

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "amoled", label: "AMOLED" },
  { value: "blush", label: "Blush" },
  { value: "purple", label: "Purple" },
];

// Reusable Row Component
const Row = ({ label, subtext, right, onPress, icon: Icon }) => {
  const theme = useAppTheme();
  const [busy, setBusy] = useState(false);

  const handlePress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onPress?.();
      // No delay - instant response
    } finally {
      setBusy(false);
    }
  };

  const content = (
    <div style={styles.row}>
      <div
        style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}
      >
        {Icon && <Icon size={20} color={theme.text} />}
        <div style={{ flex: 1 }}>
          <span
            style={{
              ...styles.rowLabel,
              color: theme.text,
            }}
          >
            {label}
          </span>
          {subtext && (
            <span
              style={{
                ...styles.rowSubtext,
                color: theme.subText,
              }}
            >
              {subtext}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {busy ? <span style={{ color: theme.text }}>Loading...</span> : right}
      </div>
    </div>
  );

  if (typeof onPress === "function") {
    return (
      <button
        onClick={handlePress}
        disabled={busy}
        style={{
          ...styles.row,
          background: "transparent",
          border: "none",
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.7 : 1,
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

// Reusable Section Component
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

// Theme Switches Component
const ThemeSwitches = ({ currentTheme, onThemeChange }) => {
  const theme = useAppTheme();

  return (
    <Section title="Theme">
      {THEMES.map((option) => (
        <Row
          key={option.value}
          label={option.label}
          onPress={() => onThemeChange?.(option.value)}
          right={
            <div style={{ pointerEvents: "none" }}>
              <input
                type="checkbox"
                checked={currentTheme === option.value}
                onChange={() => onThemeChange?.(option.value)}
                style={{
                  accentColor: colors.peach,
                  width: 20,
                  height: 20,
                  cursor: "pointer",
                }}
              />
            </div>
          }
        />
      ))}
    </Section>
  );
};

// Preference Switches Component
const PreferenceSwitches = ({
  haptics,
  reduceMotion,
  dataSaver,
  showStatusReels,
  onHapticsChange,
  onReduceMotionChange,
  onDataSaverChange,
  onShowStatusReelsChange,
}) => {
  const theme = useAppTheme();

  return (
    <Section title="Preferences">
      <Row
        label="Haptics"
        onPress={() => onHapticsChange?.(!haptics)}
        right={
          <input
            type="checkbox"
            checked={haptics}
            onChange={(e) => onHapticsChange?.(e.target.checked)}
            style={{
              accentColor: colors.peach,
              width: 20,
              height: 20,
              cursor: "pointer",
            }}
          />
        }
        icon="smartphone"
      />
      <Row
        label="Reduce Motion"
        onPress={() => onReduceMotionChange?.(!reduceMotion)}
        right={
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(e) => onReduceMotionChange?.(e.target.checked)}
            style={{
              accentColor: colors.peach,
              width: 20,
              height: 20,
              cursor: "pointer",
            }}
          />
        }
        icon="activity"
      />
      <Row
        label="Data Saver"
        onPress={() => onDataSaverChange?.(!dataSaver)}
        right={
          <input
            type="checkbox"
            checked={dataSaver}
            onChange={(e) => onDataSaverChange?.(e.target.checked)}
            style={{
              accentColor: colors.peach,
              width: 20,
              height: 20,
              cursor: "pointer",
            }}
          />
        }
        icon="wifi-off"
      />
      <Row
        label="Show stories in Reels"
        onPress={() => onShowStatusReelsChange?.(!showStatusReels)}
        right={
          <input
            type="checkbox"
            checked={showStatusReels}
            onChange={(e) => onShowStatusReelsChange?.(e.target.checked)}
            style={{
              accentColor: colors.peach,
              width: 20,
              height: 20,
              cursor: "pointer",
            }}
          />
        }
        icon="film"
      />
    </Section>
  );
};

// Support Section Component
const SupportSection = ({ onSupportAuri, onWishlist }) => {
  const theme = useAppTheme();

  return (
    <Section title="Support Auri">
      <Row
        label="Support Auri"
        subtext="Help Auri grow with donations"
        icon={FiHeart}
        onPress={onSupportAuri}
      />
      <Row
        label="Wishlist Program"
        subtext="3 dream items"
        icon={FiGift}
        onPress={onWishlist}
      />
    </Section>
  );
};

// Referral Section Component
const ReferralSection = ({ referralDetails, onCopyCode, onShareCode }) => {
  const theme = useAppTheme();

  return (
    <Section title="Referral Rewards">
      <p style={{ color: theme.subText, marginBottom: "16px" }}>
        Invite friends and earn Auri rewards. Share your referral code and track
        progress right here.
      </p>
      <div style={styles.referralCard}>
        <span
          style={{ color: theme.text, fontWeight: "600", fontSize: "16px" }}
        >
          Your referral code
        </span>
        <div style={styles.referralCodeBox}>
          <span
            style={{
              color: theme.text,
              fontSize: "20px",
              fontWeight: "700",
              letterSpacing: "2px",
            }}
          >
            {referralDetails?.code || "AURI-GROW-2025"}
          </span>
        </div>
        <p style={{ color: theme.subText, fontSize: "12px", marginTop: "8px" }}>
          Share this code to unlock extra creator perks for both of you.
        </p>
        <div style={styles.inlineActions}>
          <Button
            title="Copy Code"
            variant="ghost"
            onPress={onCopyCode}
            style={{ borderColor: colors.peach, color: colors.peach }}
          />
          <Button
            title="Share Code"
            variant="ghost"
            onPress={onShareCode}
            style={{ borderColor: colors.peach, color: colors.peach }}
          />
        </div>
      </div>
      <p style={{ color: theme.subText, fontSize: "12px", marginTop: "12px" }}>
        Your success rate is tracked in real-time behind the scenes. Earn
        rewards as your friends join and create with Auri.
      </p>
    </Section>
  );
};

// Participation Section Component
const ParticipationSection = ({ onLearnAbout }) => {
  const theme = useAppTheme();
  const [auriGiveaways, setAuriGiveaways] = useState(true);
  const [showAndTell, setShowAndTell] = useState(false);

  return (
    <Section title="Participation">
      <Row
        label="Auri Giveaways"
        onPress={() => setAuriGiveaways(!auriGiveaways)}
        right={
          <div style={{ pointerEvents: "none" }}>
            <input
              type="checkbox"
              checked={auriGiveaways}
              onChange={() => {}}
              disabled={true}
              style={{
                accentColor: colors.peach,
                width: 20,
                height: 20,
                cursor: "pointer",
              }}
            />
          </div>
        }
        icon={FiGift}
      />
      <Row
        label="Show and Tell"
        onPress={() => setShowAndTell(!showAndTell)}
        right={
          <div style={{ pointerEvents: "none" }}>
            <input
              type="checkbox"
              checked={showAndTell}
              onChange={() => {}}
              disabled={true}
              style={{
                accentColor: colors.peach,
                width: 20,
                height: 20,
                cursor: "pointer",
              }}
            />
          </div>
        }
        icon={FiStar}
      />
      <Button
        title="Learn about this"
        variant="ghost"
        onPress={onLearnAbout}
        style={{
          marginTop: "12px",
          borderColor: colors.peach,
          color: colors.peach,
          width: "100%",
        }}
      />
    </Section>
  );
};

// Pill Button Component
const PillButton = ({ label, isSelected, onPress }) => {
  const theme = useAppTheme();
  return (
    <button
      onClick={onPress}
      style={{
        ...styles.optionPill,
        backgroundColor: isSelected ? colors.peach : "transparent",
        borderColor: colors.peach,
      }}
    >
      <span
        style={{
          ...styles.optionPillText,
          color: isSelected ? "#fff" : theme.text,
        }}
      >
        {label}
      </span>
    </button>
  );
};

// Toggle Row Component
const ToggleRow = ({ label, isEnabled, onToggle }) => {
  const theme = useAppTheme();
  return (
    <div style={styles.toggleRow}>
      <span style={{ ...styles.label, color: theme.text }}>{label}</span>
      <input
        type="checkbox"
        checked={isEnabled}
        onChange={onToggle}
        style={{
          accentColor: colors.peach,
          width: 20,
          height: 20,
          cursor: "pointer",
        }}
      />
    </div>
  );
};

// Enhanced Shopping Preferences Section
const ShoppingPreferencesSection = ({
  shoppingPreferences,
  onPreferenceChange,
  onPreferenceToggle,
}) => {
  const theme = useAppTheme();

  return (
    <Section title="Shopping Preferences">
      <p
        style={{ color: theme.subText, marginBottom: "16px", fontSize: "13px" }}
      >
        Customize your shopping experience with personalized preferences and
        advanced settings.
      </p>

      {/* Region */}
      <div style={{ marginBottom: "16px" }}>
        <span
          style={{
            color: theme.subText,
            fontSize: "12px",
            display: "block",
            marginBottom: "8px",
          }}
        >
          Show items from
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          {["Local", "Nationwide", "Global"].map((item) => (
            <button
              key={item}
              onClick={() => onPreferenceChange?.("region", item)}
              style={{
                ...styles.optionPill,
                backgroundColor:
                  shoppingPreferences?.region === item
                    ? colors.peach
                    : "transparent",
                borderColor: colors.peach,
              }}
            >
              <span
                style={{
                  ...styles.optionPillText,
                  color:
                    shoppingPreferences?.region === item ? "#fff" : theme.text,
                }}
              >
                {item}
              </span>
            </button>
          ))}
        </div>
      </div>
      {/* Price Comfort */}
      <div style={{ marginBottom: "16px" }}>
        <span
          style={{
            color: theme.subText,
            fontSize: "12px",
            display: "block",
            marginBottom: "8px",
          }}
        >
          Price comfort
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          {["Budget-friendly", "Balanced", "Premium"].map((item) => (
            <button
              key={item}
              onClick={() => onPreferenceChange?.("priceComfort", item)}
              style={{
                ...styles.optionPill,
                backgroundColor:
                  shoppingPreferences?.priceComfort === item
                    ? colors.peach
                    : "transparent",
                borderColor: colors.peach,
              }}
            >
              <span
                style={{
                  ...styles.optionPillText,
                  color:
                    shoppingPreferences?.priceComfort === item
                      ? "#fff"
                      : theme.text,
                }}
              >
                {item}
              </span>
            </button>
          ))}
        </div>
      </div>
      {/* Delivery Time */}
      <div style={{ marginBottom: "16px" }}>
        <span
          style={{
            color: theme.subText,
            fontSize: "12px",
            display: "block",
            marginBottom: "8px",
          }}
        >
          Preferred delivery time
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          {["Any", "Same day", "Next day"].map((item) => (
            <button
              key={item}
              onClick={() => onPreferenceChange?.("deliveryTime", item)}
              style={{
                ...styles.optionPill,
                backgroundColor:
                  shoppingPreferences?.deliveryTime === item
                    ? colors.peach
                    : "transparent",
                borderColor: colors.peach,
              }}
            >
              <span
                style={{
                  ...styles.optionPillText,
                  color:
                    shoppingPreferences?.deliveryTime === item
                      ? "#fff"
                      : theme.text,
                }}
              >
                {item}
              </span>
            </button>
          ))}
        </div>
      </div>
      {/* Autoplay */}
      <Row
        label="Autoplay highlights"
        onPress={() => onPreferenceToggle?.("autoplay")}
        right={
          <input
            type="checkbox"
            checked={shoppingPreferences?.autoplay ?? true}
            onChange={() => {}}
            disabled={true}
            style={{
              accentColor: colors.peach,
              width: 20,
              height: 20,
            }}
          />
        }
      />

      <div
        style={{ borderTop: `1px solid ${theme.border}`, margin: "16px 0" }}
      />

      {/* Sort & Filter Settings */}
      <span
        style={{
          color: theme.text,
          fontWeight: "600",
          display: "block",
          marginBottom: "12px",
        }}
      >
        Sort & Filter Settings
      </span>

      <span
        style={{
          color: theme.subText,
          fontSize: "12px",
          display: "block",
          marginBottom: "8px",
        }}
      >
        Default sorting
      </span>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        {[
          "Relevance",
          "Price Low-High",
          "Price High-Low",
          "Newest",
          "Rating",
        ].map((item) => (
          <button
            key={item}
            onClick={() => onPreferenceChange?.("sortBy", item)}
            style={{
              ...styles.optionPill,
              backgroundColor:
                shoppingPreferences?.sortBy === item
                  ? colors.peach
                  : "transparent",
              borderColor: colors.peach,
              fontSize: "12px",
              padding: "6px 12px",
            }}
          >
            <span
              style={{
                ...styles.optionPillText,
                color:
                  shoppingPreferences?.sortBy === item ? "#fff" : theme.text,
                fontSize: "12px",
              }}
            >
              {item}
            </span>
          </button>
        ))}
      </div>

      <Row
        label="Minimum 4★ rating"
        onPress={() =>
          onPreferenceChange?.(
            "minimumRating",
            shoppingPreferences?.minimumRating >= 4 ? 0 : 4,
          )
        }
        right={
          <input
            type="checkbox"
            checked={(shoppingPreferences?.minimumRating ?? 0) >= 4}
            onChange={() => {}}
            disabled={true}
            style={{ accentColor: colors.peach, width: 20, height: 20 }}
          />
        }
      />
      <Row
        label="Discount only"
        onPress={() => onPreferenceToggle?.("discountOnly")}
        right={
          <input
            type="checkbox"
            checked={shoppingPreferences?.discountOnly ?? false}
            onChange={() => {}}
            disabled={true}
            style={{ accentColor: colors.peach, width: 20, height: 20 }}
          />
        }
      />
      <Row
        label="Free shipping"
        onPress={() => onPreferenceToggle?.("freeShipping")}
        right={
          <input
            type="checkbox"
            checked={shoppingPreferences?.freeShipping ?? false}
            onChange={() => {}}
            disabled={true}
            style={{ accentColor: colors.peach, width: 20, height: 20 }}
          />
        }
      />
      <Row
        label="In stock only"
        onPress={() => onPreferenceToggle?.("inStock")}
        right={
          <input
            type="checkbox"
            checked={shoppingPreferences?.inStock ?? false}
            onChange={() => {}}
            disabled={true}
            style={{ accentColor: colors.peach, width: 20, height: 20 }}
          />
        }
      />
      <Row
        label="On sale items"
        onPress={() => onPreferenceToggle?.("onSale")}
        right={
          <input
            type="checkbox"
            checked={shoppingPreferences?.onSale ?? false}
            onChange={() => {}}
            disabled={true}
            style={{ accentColor: colors.peach, width: 20, height: 20 }}
          />
        }
      />

      <div
        style={{ borderTop: `1px solid ${theme.border}`, margin: "16px 0" }}
      />

      {/* Customization Choices */}
      <span
        style={{
          color: theme.text,
          fontWeight: "600",
          display: "block",
          marginBottom: "12px",
        }}
      >
        Customization Choices
      </span>

      <Row
        label="Grid view (vs List view)"
        onPress={() => onPreferenceToggle?.("gridView")}
        right={
          <input
            type="checkbox"
            checked={shoppingPreferences?.gridView ?? true}
            onChange={() => {}}
            disabled={true}
            style={{ accentColor: colors.peach, width: 20, height: 20 }}
          />
        }
      />
      <Row
        label="Auto-refresh listings"
        onPress={() => onPreferenceToggle?.("autoRefresh")}
        right={
          <input
            type="checkbox"
            checked={shoppingPreferences?.autoRefresh ?? false}
            onChange={() => {}}
            disabled={true}
            style={{ accentColor: colors.peach, width: 20, height: 20 }}
          />
        }
      />

      <div
        style={{ borderTop: `1px solid ${theme.border}`, margin: "16px 0" }}
      />

      {/* Advanced Settings */}
      <span
        style={{
          color: theme.text,
          fontWeight: "600",
          display: "block",
          marginBottom: "12px",
        }}
      >
        Advanced Settings
      </span>

      <Row
        label="Data saver mode"
        onPress={() => onPreferenceToggle?.("dataSaverMode")}
        right={
          <input
            type="checkbox"
            checked={shoppingPreferences?.dataSaverMode ?? false}
            onChange={() => {}}
            disabled={true}
            style={{ accentColor: colors.peach, width: 20, height: 20 }}
          />
        }
      />
      <Row
        label="Offline browsing"
        onPress={() => onPreferenceToggle?.("offlineBrowsing")}
        right={
          <input
            type="checkbox"
            checked={shoppingPreferences?.offlineBrowsing ?? false}
            onChange={() => {}}
            disabled={true}
            style={{ accentColor: colors.peach, width: 20, height: 20 }}
          />
        }
      />
      <Row
        label="Push notifications for deals"
        onPress={() => onPreferenceToggle?.("pushNotificationsDeals")}
        right={
          <input
            type="checkbox"
            checked={shoppingPreferences?.pushNotificationsDeals ?? true}
            onChange={() => {}}
            disabled={true}
            style={{ accentColor: colors.peach, width: 20, height: 20 }}
          />
        }
      />
    </Section>
  );
};

// Shopping Section Component
const ShoppingSection = ({ onShoppingPreferences, onBecomeSeller }) => {
  const theme = useAppTheme();

  return (
    <Section title="Shopping">
      <Row
        label="Shopping Preferences"
        subtext="Customize your shopping experience"
        icon={FiShoppingBag}
        onPress={onShoppingPreferences}
      />
      <Row
        label="Become a Seller"
        subtext="Start selling on Auri"
        icon={FiPackage}
        onPress={onBecomeSeller}
      />
    </Section>
  );
};

// Account Section Component
const AccountSection = ({
  onAuriPremium,
  onChangePassword,
  onSyncPlatforms,
  onTwoFactor,
  onPayments,
}) => {
  return (
    <Section title="Account">
      <Row
        label="Auri Premium"
        subtext="Unlock exclusive layouts & customization"
        icon={FiZap}
        onPress={onAuriPremium}
        right={
          <span
            style={{ color: colors.peach, fontSize: "12px", fontWeight: "600" }}
          >
            PREMIUM
          </span>
        }
        isPremium={true}
      />
      <Row
        label="Change Password"
        subtext="Update your credentials"
        icon={FiLock}
        onPress={onChangePassword}
      />
      <Row
        label="Sync Platforms"
        subtext="Seamless data across Innoxation apps"
        icon={FiRefreshCw}
        onPress={onSyncPlatforms}
      />
      <Row
        label="Two-Factor Auth"
        subtext="Add extra security"
        icon={FiShield}
        onPress={onTwoFactor}
      />
      <Row
        label="Payments"
        subtext="Manage payment methods"
        icon={FiCreditCard}
        onPress={onPayments}
      />
    </Section>
  );
};

// Privacy Section Component
const PrivacySection = ({
  onBlockedAccounts,
  onActivityStatus,
  onCommentsMessages,
}) => {
  const theme = useAppTheme();

  return (
    <Section title="Privacy & Security">
      <Row
        label="Blocked Accounts"
        subtext="Manage who you've blocked"
        icon={FiEye}
        onPress={onBlockedAccounts}
      />
      <Row
        label="Activity Status"
        subtext="Show when you're active"
        icon={FiEye}
        onPress={onActivityStatus}
      />
      <Row
        label="Comments & Messages"
        subtext="Control who can interact"
        icon={FiMessageSquare}
        onPress={onCommentsMessages}
      />
    </Section>
  );
};

// Notifications Section Component
const NotificationsSection = ({
  onPushNotifications,
  onEmailNotifications,
  onCategories,
}) => {
  const theme = useAppTheme();

  return (
    <Section title="Notifications">
      <Row
        label="Push Notifications"
        icon={FiBell}
        onPress={onPushNotifications}
      />
      <Row
        label="Email Notifications"
        icon={FiMail}
        onPress={onEmailNotifications}
      />
      <Row
        label="Categories"
        subtext="Likes, Comments, Follows..."
        icon={FiSliders}
        onPress={onCategories}
      />
    </Section>
  );
};

// Content & Media Section Component
const ContentMediaSection = ({ onAutoplayVideos, onHighQualityMedia }) => {
  const theme = useAppTheme();

  return (
    <Section title="Content & Media">
      <Row label="Autoplay Videos" icon={FiPlay} onPress={onAutoplayVideos} />
      <Row
        label="High Quality Media"
        subtext="Always or Wi-Fi only"
        icon={FiImage}
        onPress={onHighQualityMedia}
      />
    </Section>
  );
};

// Support & Help Section Component
const SupportHelpSection = ({
  onTakeTutorial,
  onHelpCenter,
  onReportProblem,
  onAbout,
}) => {
  return (
    <Section title="Support">
      <Row
        label="Take Tutorial"
        subtext="Learn how to use Auri"
        icon={FiPlayCircle}
        onPress={onTakeTutorial}
      />

      <Row label="Help Center" icon={FiHelpCircle} onPress={onHelpCenter} />
      <Row
        label="Report a Problem"
        icon={FiAlertTriangle}
        onPress={onReportProblem}
      />
      <Row
        label="About"
        subtext="Version, Terms, Privacy"
        icon={FiInfo}
        onPress={onAbout}
      />
    </Section>
  );
};

// Support Auri Content
const SupportAuriContent = () => {
  const theme = useAppTheme();
  const [showGcashQR, setShowGcashQR] = useState(false);

  const handlePayPal = () =>
    window.open("https://www.paypal.me/aurisupport/10", "_blank");

  return (
    <div style={styles.subBlock}>
      <p style={{ color: theme.subText, marginBottom: "16px" }}>
        Support Auri's growth by donating $10 and gain access to Auri perks as a
        thank you message.
      </p>
      <div style={styles.subBlock}>
        <span
          style={{
            ...styles.label,
            color: theme.subText,
            display: "block",
            marginBottom: "8px",
          }}
        >
          Donate via PayPal
        </span>
        <Button
          title="Go to PayPal"
          onPress={handlePayPal}
          style={{ backgroundColor: colors.peach, width: "auto" }}
        />
      </div>
      <div style={styles.subBlock}>
        <span
          style={{
            ...styles.label,
            color: theme.subText,
            display: "block",
            marginBottom: "8px",
          }}
        >
          Donate via GCash
        </span>
        <Button
          title={showGcashQR ? "Hide QR Code" : "Show QR Code"}
          variant="ghost"
          onPress={() => setShowGcashQR(!showGcashQR)}
          style={{
            borderColor: colors.peach,
            color: colors.peach,
            width: "auto",
          }}
        />
        {showGcashQR && (
          <div style={styles.qrPlaceholder}>
            <div
              style={{
                color: theme.text,
                textAlign: "center",
                padding: "20px",
              }}
            >
              <p>GCash QR Code</p>
              <p style={{ fontSize: "12px", color: theme.subText }}>
                Scan to donate via GCash
              </p>
            </div>
          </div>
        )}
      </div>
      <p style={{ color: theme.subText, fontSize: "12px", marginTop: "16px" }}>
        Thank you for your support!
      </p>
    </div>
  );
};

// Referral Content with stats
const ReferralContent = ({ referralDetails }) => {
  const theme = useAppTheme();
  const handleCopy = () => {
    navigator.clipboard.writeText(referralDetails?.code || "AURI-GROW-2025");
    alert("Copied!");
  };
  const handleShare = async () => {
    const message = `Download Auri, use my code ${referralDetails?.code || "AURI-GROW-2025"}`;
    if (navigator.share) {
      await navigator.share({ title: "Share Auri", message });
    } else {
      handleCopy();
    }
  };
  return (
    <div style={styles.subBlock}>
      <p style={{ color: theme.subText, marginBottom: "16px" }}>
        Invite friends and earn Auri rewards. Share your referral code and track
        progress right here.
      </p>
      <div style={styles.referralCard}>
        <span
          style={{ color: theme.text, fontWeight: "600", fontSize: "16px" }}
        >
          Your referral code
        </span>
        <div style={styles.referralCodeBox}>
          <span
            style={{
              color: theme.text,
              fontSize: "20px",
              fontWeight: "700",
              letterSpacing: "2px",
            }}
          >
            {referralDetails?.code || "AURI-GROW-2025"}
          </span>
        </div>
        <div style={styles.inlineActions}>
          <Button
            title="Copy Code"
            variant="ghost"
            onPress={handleCopy}
            style={{ borderColor: colors.peach, color: colors.peach }}
          />
          <Button
            title="Share Code"
            variant="ghost"
            onPress={handleShare}
            style={{ borderColor: colors.peach, color: colors.peach }}
          />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginTop: "16px",
        }}
      >
        <div style={styles.statCard}>
          <span
            style={{ fontSize: "24px", fontWeight: "700", color: colors.peach }}
          >
            {referralDetails?.invitesSent || 0}
          </span>
          <span style={{ fontSize: "12px", color: theme.subText }}>
            Invites Sent
          </span>
        </div>
        <div style={styles.statCard}>
          <span
            style={{ fontSize: "24px", fontWeight: "700", color: colors.peach }}
          >
            {referralDetails?.successfulReferrals || 0}
          </span>
          <span style={{ fontSize: "12px", color: theme.subText }}>
            Successful
          </span>
        </div>
        <div style={styles.statCard}>
          <span
            style={{ fontSize: "24px", fontWeight: "700", color: colors.peach }}
          >
            ${referralDetails?.totalRewardsUSD || 0}
          </span>
          <span style={{ fontSize: "12px", color: theme.subText }}>
            Total Rewards
          </span>
        </div>
        <div style={styles.statCard}>
          <span
            style={{ fontSize: "24px", fontWeight: "700", color: colors.peach }}
          >
            #{referralDetails?.leaderboardPosition || "-"}
          </span>
          <span style={{ fontSize: "12px", color: theme.subText }}>
            Leaderboard
          </span>
        </div>
      </div>
    </div>
  );
};

// Account Change Password Content
const AccountChangePasswordContent = () => {
  const theme = useAppTheme();
  return (
    <div style={styles.subBlock}>
      <input
        type="password"
        placeholder="New Password"
        placeholderTextColor={theme.subText}
        style={styles.textInput}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        placeholderTextColor={theme.subText}
        style={styles.textInput}
      />
      <div style={styles.inlineActions}>
        <Button
          title="Update Password"
          onPress={() => alert("Coming soon")}
          style={{ backgroundColor: colors.peach, flex: 1 }}
        />
        <Button
          title="Verify Email"
          variant="ghost"
          style={{ borderColor: colors.peach, color: colors.peach, flex: 1 }}
        />
      </div>
      <p style={{ color: theme.subText, fontSize: "12px", marginTop: "12px" }}>
        Use at least 8 characters with letters, numbers and symbols.
      </p>
    </div>
  );
};

// Account Sync Platforms Content
const AccountSyncPlatformsContent = () => {
  const theme = useAppTheme();
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  return (
    <div style={styles.subBlock}>
      <p style={{ color: theme.subText, marginBottom: "16px" }}>
        Sync Auri with other Innoxation platforms for a seamless experience.
      </p>
      <div style={styles.toggleRow}>
        <span style={{ ...styles.label, color: theme.text }}>Sync Auri</span>
        <input
          type="checkbox"
          checked={isSyncEnabled}
          onChange={() => setIsSyncEnabled(!isSyncEnabled)}
          style={{ accentColor: colors.peach, width: 20, height: 20 }}
        />
      </div>
      <p style={{ color: theme.subText, fontSize: "12px", marginTop: "16px" }}>
        Auri support is handled by Innoxation.
      </p>
      <Button
        title="Contact Support"
        variant="ghost"
        onPress={() =>
          window.open("mailto:innoxation.tech@gmail.com", "_blank")
        }
        style={{
          borderColor: colors.peach,
          color: colors.peach,
          marginTop: "12px",
        }}
      />
    </div>
  );
};

// Account Two Factor Content
const AccountTwoFactorContent = () => {
  const theme = useAppTheme();
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  return (
    <div style={styles.subBlock}>
      <div style={styles.toggleRow}>
        <span style={{ ...styles.label, color: theme.text }}>
          Two-Factor Auth
        </span>
        <input
          type="checkbox"
          checked={isTwoFactorEnabled}
          onChange={() => setIsTwoFactorEnabled(!isTwoFactorEnabled)}
          style={{ accentColor: colors.peach, width: 20, height: 20 }}
        />
      </div>
      <p style={{ color: theme.subText, marginTop: "8px" }}>
        Adds extra protection to your Auri account.
      </p>
      <Button
        title="Learn How 2FA Works"
        variant="ghost"
        onPress={() =>
          window.open(
            "https://www.csoonline.com/article/563753/two-factor-authentication-2fa-explained.html",
            "_blank",
          )
        }
        style={{
          borderColor: colors.peach,
          color: colors.peach,
          marginTop: "12px",
        }}
      />
    </div>
  );
};

// Account Payments Content
const AccountPaymentsContent = () => {
  const theme = useAppTheme();
  return (
    <div style={styles.subBlock}>
      <span
        style={{
          ...styles.label,
          color: theme.text,
          marginBottom: "8px",
          display: "block",
        }}
      >
        Manage Payment Methods
      </span>
      <p
        style={{ color: theme.subText, fontSize: "12px", marginBottom: "16px" }}
      >
        Save your preferred payment methods for quick checkout.
      </p>
      <div style={styles.paymentRow}>
        <div
          style={{
            ...styles.paymentIcon,
            backgroundColor: "#006FEB",
            borderRadius: "8px",
          }}
        >
          <span
            style={{ color: "white", fontWeight: "bold", fontSize: "12px" }}
          >
            GC
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ ...styles.label, color: theme.text }}>GCash</span>
          <span
            style={{
              ...styles.subText,
              color: theme.subText,
              display: "block",
            }}
          >
            Southern Asia mobile wallet
          </span>
        </div>
      </div>
      <div style={styles.paymentRow}>
        <div
          style={{
            ...styles.paymentIcon,
            backgroundColor: "#003087",
            borderRadius: "8px",
          }}
        >
          <span
            style={{ color: "white", fontWeight: "bold", fontSize: "10px" }}
          >
            PayPal
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ ...styles.label, color: theme.text }}>PayPal</span>
          <span
            style={{
              ...styles.subText,
              color: theme.subText,
              display: "block",
            }}
          >
            Global payment platform
          </span>
        </div>
      </div>
      <div style={styles.paymentRow}>
        <div
          style={{
            ...styles.paymentIcon,
            backgroundColor: "#1A1F71",
            borderRadius: "8px",
          }}
        >
          <span
            style={{ color: "white", fontWeight: "bold", fontSize: "10px" }}
          >
            VISA
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ ...styles.label, color: theme.text }}>
            Credit/Debit Cards
          </span>
          <span
            style={{
              ...styles.subText,
              color: theme.subText,
              display: "block",
            }}
          >
            Visa, Mastercard, etc.
          </span>
        </div>
      </div>
    </div>
  );
};

// Privacy Content Components
const PrivacyBlockedAccountsContent = () => {
  const theme = useAppTheme();
  return (
    <div style={styles.subBlock}>
      <div style={styles.placeholderCard}>
        <span
          style={{
            ...styles.label,
            color: theme.text,
            display: "block",
            marginBottom: "8px",
          }}
        >
          Manage Blocked Accounts
        </span>
        <p style={{ color: theme.subText }}>
          This section is under development.
        </p>
      </div>
      <input
        type="text"
        placeholder="Search blocked accounts..."
        placeholderTextColor={theme.subText}
        style={{ ...styles.textInput, opacity: 0.5 }}
        disabled
      />
    </div>
  );
};

const PrivacyActivityStatusContent = () => {
  const theme = useAppTheme();
  const [showActivityStatus, setShowActivityStatus] = useState(true);
  return (
    <div style={styles.subBlock}>
      <div style={styles.toggleRow}>
        <span style={{ ...styles.label, color: theme.text }}>
          Show Activity Status
        </span>
        <input
          type="checkbox"
          checked={showActivityStatus}
          onChange={() => setShowActivityStatus(!showActivityStatus)}
          style={{ accentColor: colors.peach, width: 20, height: 20 }}
        />
      </div>
      <p style={{ color: theme.subText, marginTop: "8px" }}>
        Turning this off hides when you were last active.
      </p>
    </div>
  );
};

const PrivacyCommentsContent = () => {
  const theme = useAppTheme();
  const [commentsVisibility, setCommentsVisibility] = useState("everyone");
  return (
    <div style={styles.subBlock}>
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "12px",
        }}
      >
        {["Everyone", "Followers", "No one"].map((option) => (
          <PillButton
            key={option}
            label={option}
            isSelected={commentsVisibility === option.toLowerCase()}
            onPress={() => setCommentsVisibility(option.toLowerCase())}
          />
        ))}
      </div>
      <p style={{ color: theme.subText }}>
        Choose who can reply or send message requests.
      </p>
    </div>
  );
};

// Notifications Content
const NotificationsPushContent = () => {
  const theme = useAppTheme();
  const [pushEnabled, setPushEnabled] = useState(true);
  return (
    <div style={styles.subBlock}>
      <div style={styles.toggleRow}>
        <span style={{ ...styles.label, color: theme.text }}>
          Push Notifications
        </span>
        <input
          type="checkbox"
          checked={pushEnabled}
          onChange={() => setPushEnabled(!pushEnabled)}
          style={{ accentColor: colors.peach, width: 20, height: 20 }}
        />
      </div>
      <p style={{ color: theme.subText, marginTop: "8px" }}>
        Keep push alerts on for new followers, mentions and updates.
      </p>
    </div>
  );
};

const NotificationsEmailContent = () => {
  const theme = useAppTheme();
  const [emailEnabled, setEmailEnabled] = useState(true);
  return (
    <div style={styles.subBlock}>
      <div style={styles.toggleRow}>
        <span style={{ ...styles.label, color: theme.text }}>
          Email Notifications
        </span>
        <input
          type="checkbox"
          checked={emailEnabled}
          onChange={() => setEmailEnabled(!emailEnabled)}
          style={{ accentColor: colors.peach, width: 20, height: 20 }}
        />
      </div>
      <p style={{ color: theme.subText, marginTop: "8px" }}>
        We'll only send essentials: activity recaps, billing updates and
        security alerts.
      </p>
    </div>
  );
};

const NotificationsCategoriesContent = () => {
  const theme = useAppTheme();
  const [categories, setCategories] = useState({
    likes: true,
    comments: true,
    follows: true,
  });
  return (
    <div style={styles.subBlock}>
      {Object.entries({
        likes: "Likes",
        comments: "Comments",
        follows: "Follows",
      }).map(([key, label]) => (
        <div key={key} style={styles.toggleRow}>
          <span style={{ ...styles.label, color: theme.text }}>{label}</span>
          <input
            type="checkbox"
            checked={categories[key]}
            onChange={() =>
              setCategories((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            style={{ accentColor: colors.peach, width: 20, height: 20 }}
          />
        </div>
      ))}
    </div>
  );
};

// Content & Media
const ContentAutoplayContent = () => {
  const theme = useAppTheme();
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  return (
    <div style={styles.subBlock}>
      <div style={styles.toggleRow}>
        <span style={{ ...styles.label, color: theme.text }}>
          Autoplay Videos
        </span>
        <input
          type="checkbox"
          checked={autoplayEnabled}
          onChange={() => setAutoplayEnabled(!autoplayEnabled)}
          style={{ accentColor: colors.peach, width: 20, height: 20 }}
        />
      </div>
      <p style={{ color: theme.subText, marginTop: "8px" }}>
        Autoplay previews clips in your feed without sound.
      </p>
    </div>
  );
};

const ContentHighQualityContent = () => {
  const theme = useAppTheme();
  const [hqEnabled, setHqEnabled] = useState(false);
  return (
    <div style={styles.subBlock}>
      <div style={styles.toggleRow}>
        <span style={{ ...styles.label, color: theme.text }}>
          High-Quality Uploads
        </span>
        <input
          type="checkbox"
          checked={hqEnabled}
          onChange={() => setHqEnabled(!hqEnabled)}
          style={{ accentColor: colors.peach, width: 20, height: 20 }}
        />
      </div>
      <p style={{ color: theme.subText, marginTop: "8px" }}>
        When enabled, media is uploaded at highest resolution.
      </p>
    </div>
  );
};

// Support Content
const SupportHelpCenterContent = () => {
  const theme = useAppTheme();
  return (
    <div style={styles.subBlock}>
      <p style={{ color: theme.subText }}>
        Contact Innoxation or explore resources to get the most out of Auri.
      </p>
      <Button
        title="Contact Innoxation"
        variant="ghost"
        onPress={() =>
          window.open("mailto:innoxation.tech@gmail.com", "_blank")
        }
        style={{
          borderColor: colors.peach,
          color: colors.peach,
          marginTop: "12px",
        }}
      />
    </div>
  );
};

const SupportReportProblemContent = () => {
  const theme = useAppTheme();
  return (
    <div style={styles.subBlock}>
      <p style={{ color: theme.subText }}>
        Reach Innoxation support team directly if something isn't working as
        expected.
      </p>
      <Button
        title="Contact Support"
        variant="ghost"
        onPress={() =>
          window.open("mailto:innoxation.tech@gmail.com", "_blank")
        }
        style={{
          borderColor: colors.peach,
          color: colors.peach,
          marginTop: "12px",
        }}
      />
      <p style={{ color: theme.subText, fontSize: "12px", marginTop: "12px" }}>
        Typical reply time: under 24 hours on weekdays
      </p>
    </div>
  );
};

const SupportAboutContent = () => {
  const theme = useAppTheme();
  return (
    <div style={styles.subBlock}>
      <Button
        title="About Auri"
        variant="ghost"
        onPress={() => alert("Auri v1.0.0\n© Innoxation Tech Inc. 2025")}
        style={{ borderColor: colors.peach, color: colors.peach }}
      />
      <p style={{ color: theme.subText, marginTop: "12px" }}>
        Auri is crafted by Innoxation Tech to help everyone grow intentionally.
      </p>
      <p style={{ color: theme.subText, fontSize: "12px", marginTop: "12px" }}>
        Version 1.0.0 - Innoxation Tech Inc, 2025
      </p>
    </div>
  );
};

// Auri Premium Content
const AuriPremiumContent = () => {
  const theme = useAppTheme();
  return (
    <div style={styles.subBlock}>
      {/*<div style={styles.premiumCard}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div style={{ ...styles.premiumIcon, backgroundColor: colors.peach }}>
            <FiZap size={24} color="white" />
          </div>
          <div>
            <span
              style={{
                ...styles.label,
                color: theme.text,
                fontSize: "18px",
                display: "block",
              }}
            >
              Auri Premium
            </span>
            <span style={{ ...styles.subText, color: theme.subText }}>
              Unlock exclusive layouts
            </span>
          </div>
        </div>
        <p style={{ color: theme.subText, marginBottom: "16px" }}>
          Premium gives you access to 5 unique app layouts:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {["Social Feed", "Immersive", "Compact", "Auri Pulse", "Canvas"].map(
            (feature) => (
              <div
                key={feature}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <FiCheck size={16} color={colors.peach} />
                <span style={{ color: theme.text }}>{feature}</span>
              </div>
            ),
          )}
        </div>
      </div>
      <Button
        title="Get Premium"
        onPress={() => alert("Premium coming soon!")}
        style={{ backgroundColor: colors.peach, marginTop: "16px" }}
      />*/}
      <p style={{ fontSize: 20, color: theme.text }}>It's coming soon</p>
    </div>
  );
};

// Become Seller Content
const BecomeSellerContent = () => {
  const theme = useAppTheme();
  return (
    <div style={styles.subBlock}>
      <p style={{ color: theme.subText, marginBottom: "16px" }}>
        Ready to start selling on Auri? Join our marketplace and start reaching
        customers today.
      </p>
      <div style={styles.placeholderCard}>
        <span
          style={{
            ...styles.label,
            color: theme.text,
            display: "block",
            marginBottom: "8px",
          }}
        >
          🚀 Why Sell on Auri?
        </span>
        <p style={{ color: theme.subText, fontSize: "12px" }}>
          • Reach engaged audience
        </p>
        <p style={{ color: theme.subText, fontSize: "12px" }}>
          • Low fees and secure payments
        </p>
        <p style={{ color: theme.subText, fontSize: "12px" }}>
          • Built-in analytics
        </p>
        <p style={{ color: theme.subText, fontSize: "12px" }}>
          • 24/7 seller support
        </p>
      </div>
      <Button
        title="Go to Seller Dashboard"
        //onPress={() => window.open("https://auri-sellers.vercel.app", "_blank")}
        style={{ backgroundColor: colors.peach, marginTop: "16px", opacity: 0.75 }}
      />
    </div>
  );
};

export const SettingsSidebarContent = ({
  onClose,
  // Navigation callbacks for sub-settings
  onSupportAuri,
  onWishlistProgram,
  onReferrals,
  onShoppingPreferences,
  onBecomeSeller,
  onChangePassword,
  onSyncPlatforms,
  onTwoFactorAuth,
  onPayments,
  onBlockedAccounts,
  onActivityStatus,
  onCommentsMessages,
  onPushNotifications,
  onEmailNotifications,
  onNotificationCategories,
  onAutoplayVideos,
  onHighQualityMedia,
  onHelpCenter,
  onReportProblem,
  onAbout,
  onTakeTutorial,
  onAuriPremium,
  onLearnAboutParticipation,
  // Referral
  referralDetails,
  onCopyReferralCode,
  onShareReferralCode,
  // Shopping Preferences
  shoppingPreferences,
  onShoppingPreferenceChange,
  onShoppingPreferenceToggle,
  // Switch Accounts & Logout
  onSwitchAccounts,
  onLogout,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const appTheme = useAppTheme();

  // Get theme and preferences from Redux
  const currentTheme = useSelector((state) => state.ui.theme);
  const ui = useSelector((state) => state.ui);

  // Sub-settings navigation state
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [showGcashQR, setShowGcashQR] = useState(false);

  // Theme switching handler
  const handleThemeChange = (themeValue) => {
    dispatch(setTheme(themeValue));
  };

  // Preference toggles
  const handleHapticsChange = () => {
    dispatch(toggleHaptics());
  };

  const handleReduceMotionChange = () => {
    dispatch(toggleReduceMotion());
  };

  const handleDataSaverChange = () => {
    dispatch(toggleDataSaver());
  };

  const handleShowStatusReelsChange = () => {
    dispatch(toggleShowStatusReels());
  };

  // Handle logout - navigate to AuthFlow
  const handleLogout = () => {
    dispatch(logout());
    navigate("/auth");
  };

  // Handle back button in sub-settings
  const handleBack = () => {
    if (selectedSetting) {
      setSelectedSetting(null);
    } else {
      onClose?.();
    }
  };

  // Get header title based on selected setting
  const settingTitleMap = {
    supportAuri: "Support Auri",
    referrals: "Referral Rewards",
    shoppingPreferences: "Shopping Preferences",
    becomeSeller: "Become a Seller",
    account: "Account Settings",
    changePassword: "Change Password",
    syncPlatforms: "Sync Platforms",
    twoFactorAuth: "Two-Factor Auth",
    payments: "Payments",
    privacySecurity: "Privacy & Security",
    blockedAccounts: "Blocked Accounts",
    activityStatus: "Activity Status",
    commentsMessages: "Interactions",
    notifications: "Notifications",
    pushNotifications: "Push Notifications",
    emailNotifications: "Email Notifications",
    notificationCategories: "Notification Categories",
    contentMedia: "Content & Media Preferences",
    autoplayVideos: "Autoplay Videos",
    highQualityMedia: "High Quality Media",
    support: "Support & Help",
    helpCenter: "Help Center",
    reportProblem: "Report a Problem",
    aboutSupport: "About",
    auriPremium: "Auri Premium",
  };

  const headerTitle = selectedSetting
    ? settingTitleMap[selectedSetting] || "Settings"
    : "Settings";

  // Render sub-setting content
  const renderSubSetting = () => {
    const theme = appTheme;

    switch (selectedSetting) {
      case "supportAuri":
        return (
          <Section title="Support Auri">
            <div style={styles.subSectionContent}>
              <p style={{ color: theme.subText, marginBottom: "16px" }}>
                Support Auri's growth by donating $10 and gain access to Auri
                perks as a thank you message.
              </p>
              <div style={styles.subBlock}>
                <span
                  style={{
                    ...styles.label,
                    color: theme.subText,
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Donate via PayPal
                </span>
                <Button
                  title="Go to PayPal"
                  onPress={() =>
                    window.open(
                      "https://www.paypal.me/aurisupport/10",
                      "_blank",
                    )
                  }
                  style={{ backgroundColor: colors.peach, width: "auto" }}
                />
              </div>
              <div style={{ ...styles.subBlock, marginTop: "16px" }}>
                <span
                  style={{
                    ...styles.label,
                    color: theme.subText,
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Donate via GCash
                </span>
                <Button
                  title={showGcashQR ? "Hide QR Code" : "Show QR Code"}
                  variant="ghost"
                  onPress={() => setShowGcashQR(!showGcashQR)}
                  style={{
                    borderColor: colors.peach,
                    color: colors.peach,
                    width: "auto",
                  }}
                />
                {showGcashQR && (
                  <div style={styles.qrPlaceholder}>
                    <img
                      src={GCASH_QR_IMAGE}
                      alt="GCash QR Code"
                      style={{
                        width: "100%",
                        maxWidth: "200px",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                )}
              </div>
              <p
                style={{
                  color: theme.subText,
                  fontSize: "12px",
                  marginTop: "16px",
                }}
              >
                Thank you for your support!
              </p>
            </div>
          </Section>
        );

      case "referrals":
        return (
          <Section title="Referral Rewards">
            <div style={styles.subSectionContent}>
              <p style={{ color: theme.subText, marginBottom: "16px" }}>
                Invite friends and earn Auri rewards. Share your referral code
                and track progress right here.
              </p>
              <div style={styles.subBlock}>
                <span style={{ ...styles.label, color: theme.text }}>
                  Your referral code
                </span>
                <div style={styles.referralCard}>
                  <span
                    style={{
                      color: theme.text,
                      fontSize: "20px",
                      fontWeight: "700",
                      letterSpacing: "2px",
                    }}
                  >
                    {referralDetails?.code || "AURI-GROW-2025"}
                  </span>
                  <p
                    style={{
                      color: theme.subText,
                      fontSize: "12px",
                      marginTop: "8px",
                    }}
                  >
                    Share this code to unlock extra creator perks for both of
                    you.
                  </p>
                </div>
                <div style={styles.inlineActions}>
                  <Button
                    title="Copy Code"
                    variant="ghost"
                    onPress={onCopyReferralCode}
                    style={{ borderColor: colors.peach, color: colors.peach }}
                  />
                  <Button
                    title="Share Code"
                    variant="ghost"
                    onPress={onShareReferralCode}
                    style={{ borderColor: colors.peach, color: colors.peach }}
                  />
                </div>
              </div>
              <p
                style={{
                  color: theme.subText,
                  fontSize: "12px",
                  marginTop: "12px",
                }}
              >
                Your success rate is tracked in real-time behind the scenes.
                Earn rewards as your friends join and create with Auri.
              </p>
            </div>
          </Section>
        );

      case "shopping":
        return (
          <Section title="Shopping">
            <div style={styles.subSectionContent}>
              <div style={styles.subBlock}>
                <span
                  style={{
                    ...styles.label,
                    color: theme.text,
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Shopping Preferences
                </span>
                <p
                  style={{
                    color: theme.subText,
                    fontSize: "13px",
                    marginBottom: "12px",
                  }}
                >
                  Customize your shopping experience with personalized
                  preferences.
                </p>
                <Button
                  title="Customize Preferences"
                  variant="ghost"
                  onPress={() => setSelectedSetting("shoppingPreferences")}
                  style={{
                    borderColor: colors.peach,
                    color: colors.peach,
                    width: "auto",
                  }}
                />
              </div>
              <div style={styles.divider} />
              <div style={styles.subBlock}>
                <span
                  style={{
                    ...styles.label,
                    color: theme.text,
                    marginBottom: "8px",
                    display: "block",
                  }}
                >
                  Become a Seller
                </span>
                <p
                  style={{
                    color: theme.subText,
                    fontSize: "13px",
                    marginBottom: "12px",
                  }}
                >
                  Ready to start selling on Auri? Set up your seller dashboard.
                </p>
                <Button
                  title="Go to Dashboard"
                  variant="ghost"
                  onPress={() =>
                    window.open("https://auri-sellers.vercel.app", "_blank")
                  }
                  style={{
                    borderColor: colors.peach,
                    color: colors.peach,
                    width: "auto",
                  }}
                />
              </div>
            </div>
          </Section>
        );

      case "shoppingPreferences":
        return (
          <Section title="Shopping Preferences">
            <div style={styles.subSectionContent}>
              <ShoppingPreferencesSection
                shoppingPreferences={shoppingPreferences}
                onPreferenceChange={onShoppingPreferenceChange}
                onPreferenceToggle={onShoppingPreferenceToggle}
              />
            </div>
          </Section>
        );

      case "becomeSeller":
        return (
          <Section title="Become a Seller">
            <div style={styles.subSectionContent}>
              <BecomeSellerContent />
            </div>
          </Section>
        );

      case "account":
        return (
          <Section title="Account Settings">
            <div style={styles.subSectionContent}>
              <AccountChangePasswordContent />
              <div style={styles.divider} />
              <AccountSyncPlatformsContent />
              <div style={styles.divider} />
              <AccountTwoFactorContent />
            </div>
          </Section>
        );

      case "changePassword":
        return (
          <Section title="Change Password">
            <div style={styles.subSectionContent}>
              <AccountChangePasswordContent />
            </div>
          </Section>
        );

      case "syncPlatforms":
        return (
          <Section title="Sync Platforms">
            <div style={styles.subSectionContent}>
              <AccountSyncPlatformsContent />
            </div>
          </Section>
        );

      case "twoFactorAuth":
        return (
          <Section title="Two-Factor Authentication">
            <div style={styles.subSectionContent}>
              <AccountTwoFactorContent />
            </div>
          </Section>
        );

      case "payments":
        return (
          <Section title="Payments">
            <div style={styles.subSectionContent}>
              <AccountPaymentsContent />
            </div>
          </Section>
        );

      case "privacySecurity":
        return (
          <Section title="Privacy & Security">
            <div style={styles.subSectionContent}>
              <PrivacyBlockedAccountsContent />
              <div style={styles.divider} />
              <PrivacyActivityStatusContent />
              <div style={styles.divider} />
              <PrivacyCommentsContent />
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: theme.subText, fontSize: "13px" }}>
                  Your privacy matters. Manage how people interact with you on
                  Auri.
                </p>
              </div>
            </div>
          </Section>
        );

      case "blockedAccounts":
        return (
          <Section title="Blocked Accounts">
            <div style={styles.subSectionContent}>
              <PrivacyBlockedAccountsContent />
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: theme.subText, fontSize: "13px" }}>
                  Your privacy matters. Manage how people interact with you on
                  Auri.
                </p>
              </div>
            </div>
          </Section>
        );

      case "activityStatus":
        return (
          <Section title="Activity Status">
            <div style={styles.subSectionContent}>
              <PrivacyActivityStatusContent />
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: theme.subText, fontSize: "13px" }}>
                  Your privacy matters. Manage how people interact with you on
                  Auri.
                </p>
              </div>
            </div>
          </Section>
        );

      case "commentsMessages":
        return (
          <Section title="Allow Comments & Messages">
            <div style={styles.subSectionContent}>
              <PrivacyCommentsContent />
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: theme.subText, fontSize: "13px" }}>
                  Your privacy matters. Manage how people interact with you on
                  Auri.
                </p>
              </div>
            </div>
          </Section>
        );

      case "notifications":
        return (
          <Section title="Notifications">
            <div style={styles.subSectionContent}>
              <NotificationsPushContent />
              <div style={styles.divider} />
              <NotificationsEmailContent />
              <div style={styles.divider} />
              <NotificationsCategoriesContent />
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: theme.subText, fontSize: "13px" }}>
                  Stay connected to the Auri community. Customize what alerts
                  you receive.
                </p>
              </div>
            </div>
          </Section>
        );

      case "pushNotifications":
        return (
          <Section title="Push Notifications">
            <div style={styles.subSectionContent}>
              <NotificationsPushContent />
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: theme.subText, fontSize: "13px" }}>
                  Stay connected to the Auri community. Customize what alerts
                  you receive.
                </p>
              </div>
            </div>
          </Section>
        );

      case "emailNotifications":
        return (
          <Section title="Email Notifications">
            <div style={styles.subSectionContent}>
              <NotificationsEmailContent />
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: theme.subText, fontSize: "13px" }}>
                  Stay connected to the Auri community. Customize what alerts
                  you receive.
                </p>
              </div>
            </div>
          </Section>
        );

      case "notificationCategories":
        return (
          <Section title="Notification Categories">
            <div style={styles.subSectionContent}>
              <NotificationsCategoriesContent />
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: theme.subText, fontSize: "13px" }}>
                  Stay connected to the Auri community. Customize what alerts
                  you receive.
                </p>
              </div>
            </div>
          </Section>
        );

      case "contentMedia":
        return (
          <Section title="Content & Media">
            <div style={styles.subSectionContent}>
              <ContentAutoplayContent />
              <div style={styles.divider} />
              <ContentHighQualityContent />
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: theme.subText, fontSize: "13px" }}>
                  For smoother performance, high-quality uploads and autoplay
                  are recommended only on Wi-Fi.
                </p>
              </div>
            </div>
          </Section>
        );

      case "autoplayVideos":
        return (
          <Section title="Autoplay Videos">
            <div style={styles.subSectionContent}>
              <ContentAutoplayContent />
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: theme.subText, fontSize: "13px" }}>
                  For smoother performance, high-quality uploads and autoplay
                  are recommended only on Wi-Fi.
                </p>
              </div>
            </div>
          </Section>
        );

      case "highQualityMedia":
        return (
          <Section title="High Quality Media">
            <div style={styles.subSectionContent}>
              <ContentHighQualityContent />
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: theme.subText, fontSize: "13px" }}>
                  For smoother performance, high-quality uploads and autoplay
                  are recommended only on Wi-Fi.
                </p>
              </div>
            </div>
          </Section>
        );

      case "support":
        return (
          <Section title="Support">
            <div style={styles.subSectionContent}>
              <SupportHelpCenterContent />
              <div style={styles.divider} />
              <SupportReportProblemContent />
              <div style={styles.divider} />
              <SupportAboutContent />
            </div>
          </Section>
        );

      case "helpCenter":
        return (
          <Section title="Help Center">
            <div style={styles.subSectionContent}>
              <SupportHelpCenterContent />
            </div>
          </Section>
        );

      case "reportProblem":
        return (
          <Section title="Report a Problem">
            <div style={styles.subSectionContent}>
              <SupportReportProblemContent />
            </div>
          </Section>
        );

      case "aboutSupport":
        return (
          <Section title="About">
            <div style={styles.subSectionContent}>
              <SupportAboutContent />
            </div>
          </Section>
        );

      case "auriPremium":
        return (
          <Section title="Auri Premium">
            <div style={styles.subSectionContent}>
              <AuriPremiumContent />
            </div>
          </Section>
        );

      default:
        return (
          <Section title={headerTitle}>
            <div style={styles.subSectionContent}>
              <p style={{ color: theme.subText, marginBottom: "16px" }}>
                This section is under development. Content for {headerTitle}{" "}
                will appear.
              </p>
              <Button
                title="Go Back"
                variant="ghost"
                onPress={() => setSelectedSetting(null)}
                style={{ borderColor: colors.peach, color: colors.peach }}
              />
            </div>
          </Section>
        );
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button
          className="settings-back-btn"
          onClick={handleBack}
          style={styles.backButton}
        >
          <FiChevronLeft size={24} color={appTheme.text} />
        </button>
        <h2
          style={{
            ...styles.title,
            color: appTheme.text,
          }}
        >
          {headerTitle}
        </h2>
        <div style={{ width: 24 }} />
      </div>

      <div className="profile-settings-content" style={styles.content}>
        {!selectedSetting ? (
          <>
            {/* Theme */}
            <ThemeSwitches
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
            />

            {/* Preferences */}
            <PreferenceSwitches
              haptics={ui.haptics}
              reduceMotion={ui.reduceMotion}
              dataSaver={ui.dataSaver}
              showStatusReels={ui.showStatusReels}
              onHapticsChange={handleHapticsChange}
              onReduceMotionChange={handleReduceMotionChange}
              onDataSaverChange={handleDataSaverChange}
              onShowStatusReelsChange={handleShowStatusReelsChange}
            />

            <ParticipationSection onLearnAbout={onLearnAboutParticipation} />

            {/* Support Auri */}
            <Section title="Support Auri">
              <Row
                label="Support Auri"
                subtext="Help Auri grow with donations"
                icon={FiHeart}
                onPress={() => setSelectedSetting("supportAuri")}
              />
              <Row
                label="Referral Rewards"
                subtext="Invite friends and earn Auri rewards"
                icon={FiUsers}
                onPress={() => setSelectedSetting("referrals")}
              />
            </Section>

            {/* Shopping */}
            <Section title="Shopping">
              <Row
                label="Shopping Preferences"
                subtext="Customize your shopping experience"
                icon={FiShoppingBag}
                onPress={() => setSelectedSetting("shoppingPreferences")}
              />
              <Row
                label="Become a Seller"
                subtext="Start selling on Auri"
                icon={FiPackage}
                onPress={() => setSelectedSetting("becomeSeller")}
              />
            </Section>

            {/* Account */}
            <Section title="Account">
              <Row
                label="Auri Premium"
                subtext="Unlock exclusive layouts & customization"
                icon={FiZap}
                onPress={() => setSelectedSetting("auriPremium")}
                right={
                  <span
                    style={{
                      color: colors.peach,
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    PREMIUM
                  </span>
                }
                isPremium={true}
              />
              <Row
                label="Change Password"
                subtext="Update your credentials"
                icon={FiLock}
                onPress={() => setSelectedSetting("changePassword")}
              />
              <Row
                label="Sync Platforms"
                subtext="Seamless data across Innoxation apps"
                icon={FiRefreshCw}
                onPress={() => setSelectedSetting("syncPlatforms")}
              />
              <Row
                label="Two-Factor Auth"
                subtext="Add extra security"
                icon={FiShield}
                onPress={() => setSelectedSetting("twoFactorAuth")}
              />
              <Row
                label="Payments"
                subtext="Manage payment methods"
                icon={FiCreditCard}
                onPress={() => setSelectedSetting("payments")}
              />
            </Section>

            {/* Privacy & Security */}
            <Section title="Privacy & Security">
              <Row
                label="Blocked Accounts"
                subtext="Manage who you've blocked"
                icon={FiEye}
                onPress={() => setSelectedSetting("blockedAccounts")}
              />
              <Row
                label="Activity Status"
                subtext="Show when you're active"
                icon={FiEye}
                onPress={() => setSelectedSetting("activityStatus")}
              />
              <Row
                label="Comments & Messages"
                subtext="Control who can interact"
                icon={FiMessageSquare}
                onPress={() => setSelectedSetting("commentsMessages")}
              />
            </Section>

            {/* Notifications */}
            <Section title="Notifications">
              <Row
                label="Push Notifications"
                icon={FiBell}
                onPress={() => setSelectedSetting("pushNotifications")}
              />
              <Row
                label="Email Notifications"
                icon={FiMail}
                onPress={() => setSelectedSetting("emailNotifications")}
              />
              <Row
                label="Categories"
                subtext="Likes, Comments, Follows..."
                icon={FiSliders}
                onPress={() => setSelectedSetting("notificationCategories")}
              />
            </Section>

            {/* Content & Media */}
            <Section title="Content & Media">
              <Row
                label="Autoplay Videos"
                icon={FiPlay}
                onPress={() => setSelectedSetting("autoplayVideos")}
              />
              <Row
                label="High Quality Media"
                subtext="Always or Wi-Fi only"
                icon={FiImage}
                onPress={() => setSelectedSetting("highQualityMedia")}
              />
            </Section>

            {/* Support */}
            <Section title="Support">
              <Row
                label="Take Tutorial"
                subtext="Learn how to use Auri"
                icon={FiPlayCircle}
                onPress={onTakeTutorial}
              />
              <Row
                label="Help Center"
                icon={FiHelpCircle}
                onPress={() => setSelectedSetting("helpCenter")}
              />
              <Row
                label="Report a Problem"
                icon={FiAlertTriangle}
                onPress={() => setSelectedSetting("reportProblem")}
              />
              <Row
                label="About"
                subtext="Version, Terms, Privacy"
                icon={FiInfo}
                onPress={() => setSelectedSetting("aboutSupport")}
              />
            </Section>
          </>
        ) : (
          renderSubSetting()
        )}

        <div style={styles.footerButtons}>
          <Button
            title="Switch Accounts"
            variant="ghost"
            onPress={onSwitchAccounts}
            style={{ width: "100%" }}
          />

          {/* Logout */}
          <Button
            title="Logout"
            variant="ghost"
            onPress={handleLogout}
            style={{
              width: "100%",
              borderColor: colors.error,
              color: colors.error,
            }}
          />
        </div>
      </div>

      {/* Switch Accounts */}
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
  },
  content: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    borderRadius: "24px",
    padding: "24px",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: "8px",
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
  toggleRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  subText: {
    fontSize: 13,
    lineHeight: 18,
  },
  footerButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    paddingTop: "12px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  referralCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "12px",
    padding: "16px",
    marginTop: "12px",
  },
  referralCodeBox: {
    backgroundColor: "rgba(255,140,101,0.1)",
    border: `1px solid ${colors.peach}`,
    borderRadius: "8px",
    padding: "12px",
    marginTop: "8px",
    textAlign: "center",
  },
  inlineActions: {
    display: "flex",
    gap: "12px",
    marginTop: "12px",
  },
  optionPill: {
    border: `1px solid ${colors.peach}`,
    borderRadius: "20px",
    padding: "8px 16px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  optionPillText: {
    fontSize: "14px",
    fontWeight: "500",
  },
  subBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  qrPlaceholder: {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: `1px dashed ${colors.peach}`,
    borderRadius: "12px",
    marginTop: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "120px",
  },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  placeholderCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "16px",
  },
  textInput: {
    backgroundColor: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "12px 16px",
    color: "#FFFFFF",
    fontSize: "14px",
    width: "100%",
    marginBottom: "12px",
  },
  paymentRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  paymentIcon: {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumCard: {
    backgroundColor: "rgba(255,140,101,0.1)",
    border: `1px solid ${colors.peach}`,
    borderRadius: "16px",
    padding: "20px",
  },
  premiumIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  subSectionContent: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  divider: {
    borderTop: "1px solid rgba(255,255,255,0.1)",
    margin: "16px 0",
  },
};

export default SettingsSidebarContent;
