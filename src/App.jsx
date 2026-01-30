import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // simulate boot logic (fonts, auth check, config, etc.)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // adjust as needed

    return () => clearTimeout(timer);
  }, []);

  return (
    <Routes>
      {/* Splash / Loading */}
      <Route
        path="/"
        element={loading ? <SplashScreen /> : <Navigate to="/auth" replace />}
      />

      {/* Auth flow */}
      <Route path="/auth/*" element={<AuthFlow />} />

      {/* Main App Layout with Floating Nav */}
      <Route
        path="/*"
        element={
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
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
