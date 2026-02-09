import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./store";
import { loginSuccess } from "./store/slices/authSlice";
import { getCurrentUser } from "./lib/Auth";
import { SplashScreen } from "../src/screen/splash/SplashScreen";
import { AuthFlow } from "../src/screen/onboarding/OnboardingScreen";
import HomeScreen from "../src/screen/home/HomeScreen";
import ReelsScreen from "../src/screen/reels/ReelsScreen";
import MomentsScreen from "../src/screen/moments/MomentsScreen";
import ChatsScreen from "../src/screen/chat/ChatsScreen";
import ProfileScreen from "../src/screen/profile/ProfileScreen";
import PublicProfileScreen from "../src/screen/profile/PublicProfileScreen";
import PublicPostScreen from "../src/screen/home/PublicPostScreen";
import { FloatingNav } from "../src/components/FloatingNav";
import { useAppTheme } from './theme';
import './App.css'

function AppContent() {
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, userId } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check for existing session on app load
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user?.$id) {
          // User is logged in, update Redux state
          dispatch(loginSuccess({ userId: user.$id }));
          // Navigate to home
          navigate("/home", { replace: true });
        }
      } catch (error) {
        // No active session or session expired - stay on auth
        console.log("No active session:", error.message);
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    };

    checkAuth();
  }, [dispatch, navigate]);

  // Don't render routes until we've checked auth
  if (loading) {
    return <SplashScreen />;
  }

  // Determine redirect destination based on auth state
  const redirectTo = isAuthenticated && userId ? "/home" : "/auth";

  return (
    <Routes>
      {/* Auth flow */}
      <Route path="/auth/*" element={<AuthFlow />} />

      {/* Main App Layout with Floating Nav */}
      <Route
        path="/*"
        element={
          isAuthenticated && userId ? (
            <MainLayout>
              <Routes>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/home" element={<HomeScreen />} />
                <Route path="/reels" element={<ReelsScreen />} />
                <Route path="/moments" element={<MomentsScreen />} />
                <Route path="/chat" element={<ChatsScreen />} />
                <Route path="/profile" element={<ProfileScreen />} />
                {/* Public shareable routes */}
                <Route path="/u/:userId" element={<PublicProfileScreen />} />
                <Route path="/p/:postId" element={<PublicPostScreen />} />
              </Routes>
            </MainLayout>
          ) : (
            // Not authenticated, redirect to auth
            <Navigate to="/auth" replace />
          )
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={redirectTo} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <PersistGate loading={<SplashScreen />} persistor={persistor}>
      <AppContent />
    </PersistGate>
  );
}

function MainLayout({ children }) {
  const theme = useAppTheme();
  return (
    <div className="main-layout" style={{ backgroundColor: theme.background }}>
      <FloatingNav />
      <main className="main-content">
        <div className="main-content-inner">
          {children}
        </div>
      </main>
    </div>
  );
}
