/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PremiumBottomNav } from '@/components/premium';
import { Toaster } from 'sonner';
import { Home } from '@/pages/Home';
import { ContentDetail } from '@/pages/ContentDetail';
import { GameWiki } from '@/pages/GameWiki';
import { Feed } from '@/pages/Feed';
import { Countdown } from '@/pages/Countdown';
import { ForYou } from '@/pages/ForYou';
import { Friends } from '@/pages/Friends';
import { Library } from '@/pages/Library';
import { Profile } from '@/pages/Profile';
import { PublicProfile } from '@/pages/PublicProfile';
import { Settings } from '@/pages/Settings';
import { ReleaseCalendar } from '@/pages/ReleaseCalendar';
import { Onboarding } from '@/pages/Onboarding';
import { Wrapped } from '@/pages/Wrapped';
import { Achievements } from '@/pages/Achievements';
import Movies from '@/pages/Movies';
import Series from '@/pages/Series';
import Games from '@/pages/Games';
import { Admin } from '@/pages/Admin';
import { useStore } from '@/store/useStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { usePWAStore } from '@/store/usePWAStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/lib/supabase';
import { Home as HomeIcon, Library as LibraryIcon, Sparkles, User, Activity } from 'lucide-react';
import { fetchTrendingMovies, fetchTrendingSeries, fetchTopRatedGames } from '@/services/api';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { session } = useStore();
  const { language } = useLanguageStore();
  const { t } = useTranslation();
  
  if (!session) {
    return <Navigate to="/onboarding" replace />;
  }

  const navItems = [
    { icon: HomeIcon, label: t('home'), path: '/' },
    { icon: Sparkles, label: t('forYou'), path: '/for-you' },
    { icon: Activity, label: t('feed'), path: '/feed' },
    { icon: LibraryIcon, label: t('myLibrary'), path: '/library' },
    { icon: User, label: t('profile'), path: '/profile' },
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#030308] text-white overflow-x-hidden selection:bg-primary/30">
      {/* Mobile-First App Shell */}
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-[84px] safe-bottom">
        <div className="flex-1 w-full max-w-md mx-auto px-0 md:max-w-2xl lg:max-w-4xl relative">
          {children}
        </div>
      </main>

      {/* Persistent Bottom Navigation - Higher Z-Index, Mobile Optimized */}
      <PremiumBottomNav items={navItems} />
      
      {/* Floating Elements / Ambient Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}

export default function App() {
  const { session, setSession, fetchWatchlist } = useStore();
  const { language } = useLanguageStore();
  const { setDeferredPrompt, clearDeferredPrompt } = usePWAStore();
  const { themeName, applyTheme } = useThemeStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyTheme(themeName);
  }, [themeName, applyTheme]);

  useEffect(() => {
    console.log('App component mounting...');
    
    // Safety timeout to prevent stuck loading screen
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Session check exceeded 5s limit, forcing load...');
        setLoading(false);
      }
    }, 5000);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      clearDeferredPrompt();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial session fetch and auth listener
    let mounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, !!session);
      
      if (!mounted) return;

      if (session) {
        setSession(session);
        
        // Only fetch data on SIGNED_IN or when state was previously null
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || (event as any) === 'TOKEN_REFRESHED') {
          // Cache warming
          const warmCache = async () => {
            fetchTrendingMovies().catch(() => {});
            fetchTrendingSeries().catch(() => {});
            fetchTopRatedGames().catch(() => {});
          };
          warmCache();

          // Fetch user specific data with a slight delay to avoid initial congestion
          setTimeout(() => {
            if (mounted) fetchWatchlist().catch(() => {});
          }, 500);
        }
      } else {
        setSession(null);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [setSession, fetchWatchlist, setLoading, setDeferredPrompt, clearDeferredPrompt, loading]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language} className={language === 'ar' ? 'font-tajawal' : ''}>
      <Router>
        <Routes>
          <Route path="/onboarding" element={session ? <Navigate to="/" replace /> : <Onboarding />} />
          <Route path="/" element={<ProtectedLayout><Home /></ProtectedLayout>} />
          <Route path="/feed" element={<ProtectedLayout><Feed /></ProtectedLayout>} />
          <Route path="/calendar" element={<ProtectedLayout><ReleaseCalendar /></ProtectedLayout>} />
          <Route path="/countdown" element={<ProtectedLayout><Countdown /></ProtectedLayout>} />
          <Route path="/games" element={<ProtectedLayout><Games /></ProtectedLayout>} />
          <Route path="/movies" element={<ProtectedLayout><Movies /></ProtectedLayout>} />
          <Route path="/series" element={<ProtectedLayout><Series /></ProtectedLayout>} />
          <Route path="/content/:id" element={<ProtectedLayout><ContentDetail /></ProtectedLayout>} />
          <Route path="/wiki/:id" element={<ProtectedLayout><GameWiki /></ProtectedLayout>} />
          <Route path="/for-you" element={<ProtectedLayout><ForYou /></ProtectedLayout>} />
          <Route path="/library" element={<ProtectedLayout><Library /></ProtectedLayout>} />
          <Route path="/friends" element={<ProtectedLayout><Friends /></ProtectedLayout>} />
          <Route path="/achievements" element={<ProtectedLayout><Achievements /></ProtectedLayout>} />
          <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
          <Route path="/wrapped" element={<ProtectedLayout><Wrapped /></ProtectedLayout>} />
          <Route path="/admin" element={<ProtectedLayout><Admin /></ProtectedLayout>} />
          <Route path="/user/:username" element={<PublicProfile />} />
          <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster theme="dark" />
      </Router>
    </div>
  );
}

