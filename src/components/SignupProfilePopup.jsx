import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Input } from "./Input";
import { Button } from "./Button";
import { Chip } from "./Chip";
import { useAppTheme } from "../theme";
import { colors, spacing, radii } from "../theme/tokens";
import {
  safeLogin,
  safeUpsertUserProfile,
  createFirstUserAccount,
  setActiveAccountId,
  getCurrentUser
} from "../lib/Auth";
import { account, storage, IDs, APPWRITE_BUCKET_ID, Permission, Role, appwriteConfig } from "../lib/Appwrite";
import { signupComplete } from "../store/slices/authSlice";
import { upsertUser } from "../store/slices/usersSlice";
import { primeExperience } from "../utils/Prime";
import { validateAge } from "../utils/Validators";
import './SignupProfilePopup.css'

// Using Unsplash image instead of DEFAULT_AVATAR_URI
const DEFAULT_AVATAR_URI =
  "https://th.bing.com/th/id/R.d0265dd4448b9f25881dd3b7f27c890c?rik=uAfeyvD2eT0lcA&pid=ImgRaw&r=0";

const interestOptions = [
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
];

export const SignupProfilePopup = ({ isOpen, onClose, onComplete }) => {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get credentials from Redux store
  const { userId } = useSelector((state) => state.auth);
  
  const [name, setName] = useState("You");
  const [age, setAge] = useState("24");
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR_URI);
  const [avatarFile, setAvatarFile] = useState(null);
  const [location, setLocation] = useState("Lisbon, PT");
  const [interests, setInterests] = useState([
    "Travel",
    "Photography",
    "Music",
  ]);
  const [mantra, setMantra] = useState("Staying close, softly.");
  const [status, setStatus] = useState("Available for cozy coffee chats.");
  const [donationLink, setDonationLink] = useState("");
  const [referral, setReferral] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [avatarPicking, setAvatarPicking] = useState(false);
  
  const fileInputRef = useRef(null);

  // Reset state when popup opens
  useEffect(() => {
    if (isOpen) {
      setName("You");
      setAge("24");
      setAvatar(DEFAULT_AVATAR_URI);
      setAvatarFile(null);
      setLocation("Lisbon, PT");
      setInterests(["Travel", "Photography", "Music"]);
      setMantra("Staying close, softly.");
      setStatus("Available for cozy coffee chats.");
      setDonationLink("");
      setReferral("");
      setError(null);
      setSaving(false);
    }
  }, [isOpen]);

  const toggleInterest = (option) => {
    setInterests((prev) => {
      if (prev.includes(option)) {
        return prev.filter((item) => item !== option);
      }
      return [...prev, option];
    });
  };

  // Handle avatar file selection for web
  const handleAvatarPick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setAvatar(fileUrl);
      setAvatarFile(file);
    }
  };

  // Handle location for web using browser geolocation
  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setSaving(true);
    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding API
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            
            const city = data.city || data.locality || "";
            const country = data.country_name || "";
            const locationString = city && country ? `${city}, ${country}` : (city || country || "Unknown");
            
            setLocation(locationString);
          } catch (geoError) {
            setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          }
          setSaving(false);
        },
        (geoError) => {
          setError("Unable to get location. Please enter manually.");
          setSaving(false);
        }
      );
    } catch (err) {
      setError("Unable to get location. Please enter manually.");
      setSaving(false);
    }
  };

  // Upload avatar to Appwrite Storage
  const uploadAvatar = async (userId, file) => {
    if (!file) return { url: DEFAULT_AVATAR_URI, fileId: null };

    try {
      const permissions = [
        Permission.read(Role.any()),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ];

      const uploadedFile = await storage.createFile(
        APPWRITE_BUCKET_ID,
        IDs.unique(),
        file,
        permissions
      );

      // Get file view URL
      const endpointBase = appwriteConfig.endpoint?.replace(/\/$/, "") || "https://cloud.appwrite.io/v1";
      const fileUrl = `${endpointBase}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${appwriteConfig.projectId}`;

      return { url: fileUrl, fileId: uploadedFile.$id };
    } catch (uploadError) {
      console.warn("Avatar upload failed", uploadError);
      return { url: DEFAULT_AVATAR_URI, fileId: null };
    }
  };

  const handleFinish = async () => {
    // Validation
    const ageError = validateAge(age);
    if (ageError) {
      setError(ageError);
      return;
    }

    const normalizedName = name.trim();
    if (!normalizedName) {
      setError("Please add your name.");
      return;
    }

    if (interests.length < 3) {
      setError("Pick at least three interests.");
      return;
    }

    const parsedAge = parseInt(String(age), 10);
    if (!Number.isFinite(parsedAge)) {
      setError("Age must be a number.");
      return;
    }

    const sanitizedAge = Math.max(13, Math.min(parsedAge, 120));
    const normalizedCity = location.trim().slice(0, 100);
    const normalizedBio = mantra.trim().slice(0, 150);
    const normalizedStatus = status.trim().slice(0, 150);
    
    // Normalize donation link
    let normalizedDonationLink = donationLink.trim().slice(0, 260);
    if (normalizedDonationLink && !/^[a-z][a-z0-9+.-]*:/.test(normalizedDonationLink)) {
      if (/^[\w-]+(\.[\w-]+)+/i.test(normalizedDonationLink)) {
        normalizedDonationLink = `https://${normalizedDonationLink}`;
      }
    }

    const linksPayload = normalizedDonationLink ? { donation: normalizedDonationLink } : { donation: "" };

    setError(null);
    setSaving(true);

    try {
      // Get current user
      let user = await getCurrentUser();
      
      if (!user?.$id) {
        throw new Error("We could not load your account. Please start over.");
      }

      // Update account name
      try {
        await account.updateName(normalizedName);
      } catch (updateError) {
        console.warn("Account name update failed", updateError);
      }

      // Upload avatar if changed
      let finalAvatarUri = avatar;
      let avatarStorageId = null;

      if (avatarFile && !avatar.startsWith('http')) {
        try {
          const uploadResult = await uploadAvatar(user.$id, avatarFile);
          if (uploadResult?.url) {
            finalAvatarUri = uploadResult.url;
            avatarStorageId = uploadResult.fileId;
          }
        } catch (avatarError) {
          console.warn("Avatar upload failed", avatarError);
          finalAvatarUri = DEFAULT_AVATAR_URI;
        }
      }

      // Build profile document
      const profileDoc = {
        userId: user.$id,
        name: normalizedName,
        email: user.email,
        avatarUri: finalAvatarUri,
        bio: normalizedBio,
        location: normalizedCity,
        city: normalizedCity,
        status: normalizedStatus,
        links: linksPayload,
        interests: interests.filter(Boolean).slice(0, 20),
        age: sanitizedAge,
        active: true,
        archived: false,
      };

      if (avatarStorageId) {
        profileDoc.avatarStorageId = avatarStorageId;
      }

      // Save profile
      const storedProfile = await safeUpsertUserProfile(user.$id, profileDoc);
      const resolvedAvatarUri = storedProfile?.avatarUri?.trim() || finalAvatarUri;

      // Dispatch Redux actions
      const profile = {
        id: user.$id,
        ...profileDoc,
        avatarUri: resolvedAvatarUri,
        followers: storedProfile?.followers || [],
        following: storedProfile?.following || [],
      };

      primeExperience(dispatch, profile);
      dispatch(signupComplete({ userId: user.$id, profileComplete: true }));
      dispatch(
        upsertUser({
          id: user.$id,
          name: profile.name,
          email: profile.email,
          avatarUri: resolvedAvatarUri,
          avatarStorageId: avatarStorageId || profile.avatarStorageId,
          bio: profile.bio,
          location: profile.location,
          city: profile.city,
          status: profile.status,
          links: profile.links,
          interests: profile.interests,
          age: profile.age,
          followers: profile.followers,
          following: profile.following,
        })
      );

      // Cache avatar in localStorage
      if (resolvedAvatarUri && resolvedAvatarUri.startsWith('http')) {
        try {
          localStorage.setItem(`auri:avatar:${user.$id}`, resolvedAvatarUri);
        } catch (cacheError) {
          console.warn("Unable to cache avatar locally", cacheError);
        }
      }

      // Create first user account
      try {
        console.log("Creating first user account for:", user.$id);
        const firstAccount = await createFirstUserAccount(user.$id, {
          name: normalizedName,
          email: user.email,
          avatarUri: resolvedAvatarUri,
        });
        
        // Set active account in localStorage
        await setActiveAccountId(firstAccount.$id);
        localStorage.setItem("@auri_active_account_id", firstAccount.$id);
        
        console.log("First user account created successfully:", firstAccount.$id);
      } catch (accountError) {
        console.error("CRITICAL: Failed to create first user account:", accountError);
        setError("Failed to create account. Please try again.");
        setSaving(false);
        return;
      }

      // Call onComplete callback and navigate to home
      if (onComplete) {
        onComplete();
      }
      
      // Navigate to home screen
      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Signup profile error", err);
      const friendly = typeof err?.message === "string"
        ? err.message.replace("AppwriteException:", "").trim()
        : null;
      setError(friendly || "Error finishing signup. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const containerStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const popupStyle = {
    backgroundColor: theme?.card || colors.slate700,
    borderRadius: radii?.card || 24,
    width: "90%",
    maxWidth: 500,
    maxHeight: "90vh",
    overflow: "auto",
    padding: spacing?.xl || 24,
    gap: spacing?.xxl || 32,
  };

  const titleStyle = {
    fontSize: 24,
    fontWeight: "700",
    color: theme?.text || colors.white,
    textAlign: "center",
  };

  const avatarStyle = {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.slate700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    marginBottom: 16,
    overflow: "hidden",
    cursor: "pointer",
    border: "2px solid rgba(255,255,255,0.12)",
  };

  const avatarImageStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: 60,
  };

  const sectionStyle = {
    display: "flex",
    flexDirection: "column",
    gap: spacing?.sm || 8,
  };

  const sectionTitleStyle = {
    fontSize: 18,
    fontWeight: "600",
    color: theme?.text || colors.white,
  };

  const chipsContainerStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: spacing?.sm || 8,
  };

  const errorStyle = {
    color: "tomato",
    fontSize: 13,
    textAlign: "center",
  };

  const closeButtonStyle = {
    position: "absolute",
    top: spacing?.md || 12,
    right: spacing?.md || 12,
    background: "transparent",
    border: "none",
    color: theme?.text || colors.white,
    fontSize: 24,
    cursor: "pointer",
  };

  return (
    <div style={containerStyle} onClick={onClose}>
      <div style={popupStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeButtonStyle} onClick={onClose}>
          ×
        </button>

        <h1 style={titleStyle}>Let people meet the real you</h1>

        {/* Hidden file input for avatar */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarChange}
          accept="image/*"
          style={{ display: "none" }}
        />

        {/* Avatar Section */}
        <div style={avatarStyle} onClick={handleAvatarPick}>
          {avatar ? (
            <img src={avatar} alt="Avatar" style={avatarImageStyle} />
          ) : (
            <span style={{ color: theme?.subText || "rgba(255,255,255,0.5)" }}>
              Add avatar
            </span>
          )}
        </div>

        <div style={{ textAlign: "center" }}>
          <Button 
            title="Add Avatar" 
            onPress={handleAvatarPick} 
            loading={avatarPicking} 
            variant="ghost" 
          />
        </div>

        {/* Form Fields */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: spacing?.lg || 16,
          }}
        >
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            error={error}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing?.sm || 8,
            }}
          >
            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Button
              title="Set location automatically"
              onPress={handleGetLocation}
              loading={saving}
              variant="ghost"
            />
          </div>

          <Input
            label="Bio"
            value={mantra}
            onChange={(e) => setMantra(e.target.value)}
          />

          <Input
            label="Donation Link (optional)"
            value={donationLink}
            onChange={(e) => setDonationLink(e.target.value)}
            autoCapitalize="none"
            placeholder="https://paypal.me/aurisupport"
          />

          <Input
            label="One short interest"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />

          <Input
            label="Referral Code (optional)"
            value={referral}
            onChange={(e) => setReferral(e.target.value)}
            placeholder="Enter a code"
          />
        </div>

        {/* Interests Section */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Pick your interests</h2>
          <p
            style={{
              color: theme?.subText || "rgba(255,255,255,0.5)",
              marginBottom: spacing?.md || 12,
            }}
          >
            At least three so we can tune your feed.
          </p>
          <div style={chipsContainerStyle}>
            {interestOptions.map((option) => (
              <Chip
                key={option}
                label={option}
                active={interests.includes(option)}
                onClick={() => toggleInterest(option)}
              />
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && <span style={errorStyle}>{error}</span>}

        {/* Finish Button */}
        <div style={{ marginTop: spacing?.xxl || 32 }}>
          <Button
            title="Finish"
            onPress={handleFinish}
            loading={saving}
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </div>
  );
};

