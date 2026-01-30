import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { useAppTheme } from "../../theme";
import { spacing } from "../../theme/tokens";
import { SignupProfilePopup } from "../../components/SignupProfilePopup";
import { signupWithEmail } from "../../lib/Auth";
import { validatePassword } from "../../utils/Validators";

export const SignupScreen = ({ navigation, onBack }) => {
  const theme = useAppTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("you@auri.app");
  const [password, setPassword] = useState("AuriPass1");
  const [confirm, setConfirm] = useState("AuriPass1");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const handleContinue = async () => {
    const pwdError = validatePassword(password);
    if (pwdError) return setError(pwdError);
    if (password !== confirm) return setError("Passwords must match.");

    setLoading(true);
    setError(null);
    
    try {
      // Create new Appwrite account with default name
      await signupWithEmail(email, password, "Auri User");

      // Continue to profile setup
      setShowProfilePopup(true);
    } catch (err) {
      setError(err?.message || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePopupComplete = () => {
    setShowProfilePopup(false);
    // Navigate to main app
    navigate("/home", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100%",
        paddingLeft: spacing.xl,
        paddingRight: spacing.xl,
        borderRadius: 16,
        width: '100%',
        backgroundColor: theme.background,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: spacing.xxl }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: theme.text, marginTop: 30, marginBottom: 10 }}>
          Secure your space
        </h1>
        <p style={{ fontSize: 15, color: theme.subText, flexDirection: 'row' }}>
          We keep Auri safe for you and your circle, get started with us.
        </p>
      </div>

      {/* Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: spacing.xl }}>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error}
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      {/* Footer */}
      <div style={{ marginTop: spacing.xxl }}>
        <Button 
          title="Continue" 
          loading={loading} 
          style={{ width: '100%' }}
          onPress={handleContinue}
        />
      </div>

      {/* Login link */}
      <div style={{ marginTop: spacing.md, marginBottom: 30 }}>
        <p style={{ color: theme.subText }}>
          Already have an account?{" "}
          <span
            style={{ color: theme.text, fontWeight: 600, cursor: "pointer" }}
            onClick={onBack}
          >
            Login
          </span>
        </p>
      </div>

      {/* Profile Popup */}
      <SignupProfilePopup
        isOpen={showProfilePopup}
        onClose={() => setShowProfilePopup(false)}
        onComplete={handlePopupComplete}
      />
    </div>
  );
};

