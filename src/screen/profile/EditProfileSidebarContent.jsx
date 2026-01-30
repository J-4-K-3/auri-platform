import React from "react";
import { FiX } from "react-icons/fi";
import { Avatar } from "../../components/Avatar";
import { Button } from "../../components/Button";
import { Chip } from "../../components/Chip";
import { spacing } from "../../theme/tokens";

const INTEREST_OPTIONS = [
  "Travel",
  "Food",
  "Photography",
  "Music",
  "Wellness",
  "Fashion",
  "Tech",
  "Outdoors",
  "Art",
  "Gaming",
  "Books",
  "Film",
  "Fitness",
  "Coffee",
  "Nature",
  "Cooking",
  "Sports",
  "Movies",
  "Writing",
  "Design",
];

export const EditProfileSidebarContent = ({
  theme,
  onClose,
  user,
  saving,
  onSave,
  onNameChange,
  onBioChange,
  onLocationChange,
  onStatusChange,
  onLinkChange,
  onToggleInterest,
  onUpdateAvatar,
}) => (
  <div
    className="profile-edit-container"
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
        className="profile-edit-back-btn"
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: spacing.xs,
        }}
      >
        <FiX size={24} color={theme.text} />
      </button>
      <h2
        style={{
          color: theme.text,
          fontSize: 20,
          fontWeight: "600",
          marginTop: 0,
          marginRight: 0,
          marginBottom: 0,
          marginLeft: 0,
        }}
      >
        Edit Profile
      </h2>
      <div style={{ width: 24 }} />
    </div>

    <div
      className="profile-edit-content"
      style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: spacing.lg,
        }}
      >
        <Avatar uri={user?.avatarUri} size={100} />
      </div>

      <Button
        title="Update Avatar"
        variant="ghost"
        style={{ width: "100%", marginBottom: spacing.lg }}
        onPress={onUpdateAvatar}
      />

      <div style={{ marginBottom: spacing.lg }}>
        <label
          style={{
            display: "block",
            color: theme.text,
            fontWeight: 500,
            marginBottom: spacing.sm,
            fontSize: 14,
          }}
        >
          Name
        </label>
        <input
          type="text"
          value={user?.name || ""}
          onChange={(e) => onNameChange?.(e.target.value)}
          placeholder="Your name"
          style={{
            width: "100%",
            padding: spacing.md,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.card,
            color: theme.text,
            fontSize: 16,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: spacing.lg }}>
        <label
          style={{
            display: "block",
            color: theme.text,
            fontWeight: 500,
            marginBottom: spacing.sm,
            fontSize: 14,
          }}
        >
          Bio
        </label>
        <textarea
          value={user?.bio || ""}
          onChange={(e) => onBioChange?.(e.target.value)}
          placeholder="Tell us about yourself"
          rows={4}
          style={{
            width: "100%",
            padding: spacing.md,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.card,
            color: theme.text,
            fontSize: 16,
            resize: "vertical",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: spacing.lg }}>
        <label
          style={{
            display: "block",
            color: theme.text,
            fontWeight: 500,
            marginBottom: spacing.sm,
            fontSize: 14,
          }}
        >
          Location
        </label>
        <input
          type="text"
          value={user?.location || ""}
          onChange={(e) => onLocationChange?.(e.target.value)}
          placeholder="City, Country"
          style={{
            width: "100%",
            padding: spacing.md,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.card,
            color: theme.text,
            fontSize: 16,
            boxSizing: "border-box",
          }}
        />
      </div>

      <Button
        title="Set location automatically"
        variant="ghost"
        style={{ width: "100%", marginBottom: spacing.lg }}
      />

      <div style={{ marginBottom: spacing.lg }}>
        <label
          style={{
            display: "block",
            color: theme.text,
            fontWeight: 500,
            marginBottom: spacing.sm,
            fontSize: 14,
          }}
        >
          Status
        </label>
        <input
          type="text"
          value={user?.status || ""}
          onChange={(e) => onStatusChange?.(e.target.value)}
          placeholder="How are you feeling?"
          style={{
            width: "100%",
            padding: spacing.md,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.card,
            color: theme.text,
            fontSize: 16,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: spacing.lg }}>
        <label
          style={{
            display: "block",
            color: theme.text,
            fontWeight: 500,
            marginBottom: spacing.sm,
            fontSize: 14,
          }}
        >
          Website
        </label>
        <input
          type="text"
          value={user?.links?.website || ""}
          onChange={(e) => onLinkChange?.("website", e.target.value)}
          placeholder="https://yourwebsite.com"
          style={{
            width: "100%",
            padding: spacing.md,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.card,
            color: theme.text,
            fontSize: 16,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: spacing.lg }}>
        <label
          style={{
            display: "block",
            color: theme.text,
            fontWeight: 500,
            marginBottom: spacing.sm,
            fontSize: 14,
          }}
        >
          Donation Link
        </label>
        <input
          type="text"
          value={user?.links?.donation || ""}
          onChange={(e) => onLinkChange?.("donation", e.target.value)}
          placeholder="https://support.me/yourname"
          style={{
            width: "100%",
            padding: spacing.md,
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.card,
            color: theme.text,
            fontSize: 16,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: spacing.xl }}>
        <p
          style={{
            color: theme.subText,
            fontWeight: 500,
            marginBottom: spacing.md,
            fontSize: 14,
          }}
        >
          Interests
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: spacing.sm }}>
          {INTEREST_OPTIONS.map((interest) => (
            <Chip
              key={interest}
              label={interest}
              active={user?.interests?.includes(interest)}
              onClick={() => onToggleInterest?.(interest)}
            />
          ))}
        </div>
      </div>

      <Button
        title={saving ? "Saving..." : "Save Changes"}
        onPress={onSave}
        disabled={saving}
        loading={saving}
        style={{ width: "100%" }}
      />
    </div>
  </div>
);

export default EditProfileSidebarContent;
