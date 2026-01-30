import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useAppTheme } from "../../theme";
import { spacing } from "../../theme/tokens";
import { safeLogin } from "../../lib/Auth";
import { databases, APPWRITE_DATABASE_ID, COLLECTION_USERS_ID } from "../../lib/Appwrite";
import { upsertUser } from "../../store/slices/usersSlice";
import { loginSuccess } from "../../store/slices/authSlice";

export const LoginScreen = ({ navigation, onSignup }) => {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("you@auri.app");
  const [password, setPassword] = useState("AuriPass1");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError(null);
    setLoading(true);

    const normalizedEmail = email.trim();

    try {
      const user = await safeLogin(normalizedEmail, password);
      console.log("Logged in account:", user);

      let profileDoc = null;
      try {
        profileDoc = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          COLLECTION_USERS_ID,
          user.$id
        );
      } catch (profileError) {
        console.warn("Unable to load profile after login", profileError);
      }

      const profilePayload = profileDoc
        ? {
            id: profileDoc.$id,
            name:
              profileDoc.name ??
              user.name ??
              profileDoc.displayName ??
              user.email,
            email: profileDoc.email ?? user.email,
            avatarUri:
              typeof profileDoc.avatarUri === "string" &&
              profileDoc.avatarUri.startsWith("http")
                ? profileDoc.avatarUri
                : null,
            bio: profileDoc.bio ?? "",
            location: profileDoc.location ?? profileDoc.city ?? "",
            city: profileDoc.city ?? "",
            status: profileDoc.status ?? "",
            interests: Array.isArray(profileDoc.interests)
              ? profileDoc.interests
              : [],
            age: profileDoc.age,
            followers: Array.isArray(profileDoc.followers)
              ? profileDoc.followers
              : [],
            following: Array.isArray(profileDoc.following)
              ? profileDoc.following
              : [],
          }
        : {
            id: user.$id,
            name: user.name || normalizedEmail,
            email: user.email,
            avatarUri: null,
            bio: "",
            location: "",
            city: "",
            status: "",
            interests: [],
            followers: [],
            following: [],
          };

      dispatch(loginSuccess({ userId: user.$id }));
      dispatch(upsertUser(profilePayload));

      // Navigate to home on web
      if (navigation?.onLoginSuccess) {
        navigation.onLoginSuccess();
      } else {
        window.location.href = "/home";
      }
    } catch (err) {
      console.error("Login failed", err);
      const friendly = typeof err?.message === "string"
        ? err.message.replace("AppwriteException:", "").trim()
        : null;
      setError(friendly || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = () => {
    setError("Password reset link (mock) sent to your inbox.");
  };

  return (
    <div
      style={{
        minHeight: "100%",
        paddingLeft: `${spacing.xl}px`,
        paddingRight: `${spacing.xl}px`,
        borderRadius: 16,
        width: '100%',
        backgroundColor: theme.background,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: spacing.xxl }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: theme.text, marginTop: 30, marginBottom: 10 }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 16, color: theme.subText }}>
          Your circle has been waiting, log back in and join them
        </p>
      </div>

      {/* Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.xl }}>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {/*<button
          style={{
            background: "none",
            border: "none",
            color: theme.subText,
            cursor: "pointer",
            textAlign: "left",
            fontSize: 14,
          }}
          onClick={handleForgot}
        >
          Trouble signing in?
        </button>*/}
      </div>

      {/* Footer */}
      <div style={{ marginTop: spacing.xxl, display: "flex", marginBottom: 30, flexDirection: "column", gap: spacing.md }}>
        <Button 
          title="Sign in" 
          onPress={handleLogin} 
          loading={loading}
        />
        <p style={{ color: theme.subText }}>
          New here?{" "}
          <span
            style={{ color: theme.text, fontWeight: 600, opacity: 0.75, cursor: "pointer" }}
            onClick={onSignup}
          >
            Create account
          </span>
        </p>
      </div>
    </div>
  );
};

