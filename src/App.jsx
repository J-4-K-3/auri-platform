import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor } from "./store";
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
import { Helmet } from 'react-helmet';
import './App.css'

function AppContent() {
  const dispatch = useDispatch();
  const { isAuthenticated, userId } = useSelector((state) => state.auth);

  // Check for existing Appwrite session on mount to restore auth state
  useEffect(() => {
    let isMounted = true;

    const checkAndRestoreAuth = async () => {
      // If already authenticated via persisted state, skip
      if (isMounted && isAuthenticated && userId) {
        return;
      }

      try {
        const user = await getCurrentUser();
        if (isMounted && user?.$id) {
          dispatch(loginSuccess({ userId: user.$id }));
        }
      } catch (error) {
        // No active session - that's fine, rely on persisted state
      }
    };

    checkAndRestoreAuth();

    return () => {
      isMounted = false;
    };
  }, [dispatch, isAuthenticated, userId]);

  // If not authenticated, show auth flow
  if (!isAuthenticated || !userId) {
    return (
      <Routes>
        <Route path="/auth/*" element={<AuthFlow />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // Authenticated - show main app
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
    <>
      {/* SEO & share metadata */}
      <Helmet>
        <title>Auri Platform</title>
        <meta name="description" content="Auri Platform" />
        <meta name="keywords" content="social, chat, moments, reels, games, Auri, Auri Platform, apps, media, new app" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://auri-platform.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Auri Platform" />
        <meta property="og:description" content="Auri Platform" />
        <meta property="og:url" content="https://auri-platform.vercel.app/" />
        <meta property="og:image" content="https://fra.cloud.appwrite.io/v1/storage/buckets/68d7fd750014343acda8/files/6934a338000ec353cfce/view?project=68d7f6bb000b001fe1e7&mode=admin" />
        <meta property="og:image:alt" content="Auri Logo" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Auri Platform" />
        <meta name="twitter:description" content="Auri Platform" />
        <meta name="twitter:image" content="https://fra.cloud.appwrite.io/v1/storage/buckets/68d7fd750014343acda8/files/6934a338000ec353cfce/view?project=68d7f6bb000b001fe1e7&mode=admin" />
        {/* basic schema.org JSON‑LD */}
        <script type="application/ld+json">{`{
          "@context": "http://schema.org",
          "@type": "WebSite",
          "name": "Auri Platform",
          "url": "https://auri-platform.vercel.app/",
          "logo": "https://fra.cloud.appwrite.io/v1/storage/buckets/68d7fd750014343acda8/files/6934a338000ec353cfce/view?project=68d7f6bb000b001fe1e7&mode=admin",
          "description": "Auri Platform"
        }`}</script>
      </Helmet>
      <PersistGate loading={<SplashScreen />} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </>
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
