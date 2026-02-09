import React, { useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor } from "./store";
import { loginSuccess, logout } from "./store/slices/authSlice";
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
  const dispatch = useDispatch();
  const { isAuthenticated, userId, onboardingDone } = useSelector((state) => state.auth);

  // Check auth on initial load only
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (isMounted && user?.$id) {
          dispatch(loginSuccess({ userId: user.$id }));
        }
      } catch (error) {
        // No active session - user needs to log in
        if (isMounted) {
          dispatch(logout());
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  // Don't show splash screen after initial load
  if (loading) {
    return <SplashScreen />;
  }

  // If not authenticated, show auth flow
  if (!isAuthenticated || !userId) {
    return (
      <Routes>
        <Route path="/auth/*" element={<AuthFlow />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // If authenticated but onboarding not done, redirect to onboarding
  if (!onboardingDone) {
    return (
      <Routes>
        <Route path="/auth/onboarding" element={<AuthFlow />} />
        <Route path="*" element={<Navigate to="/auth/onboarding" replace />} />
      </Routes>
    );
  }

  // Authenticated and onboarding done - show main app
  return (
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
