/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { Header } from '@/components/Header';
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
import Movies from '@/pages/Movies';
import Series from '@/pages/Series';
import Games from '@/pages/Games';
import { Admin } from '@/pages/Admin';
import { useStore } from '@/store/useStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { usePWAStore } from '@/store/usePWAStore';
import { useThemeStore } from '@/store/useThemeStore';
import { Toaster } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase';
import { Footer } from '@/components/Footer';

import { NetflixLayout } from '@/layouts/NetflixLayout';
import { DisneyLayout } from '@/layouts/DisneyLayout';
import { HBOLayout } from '@/layouts/HBOLayout';
import { fetchTrendingMovies, fetchTrendingSeries, fetchTopRatedGames } from '@/services/api';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { session } = useStore();
  const { themeName } = useThemeStore();
  
  if (!session) {
    return <Navigate to="/onboarding" replace />;
  }

  if (themeName === 'netflix') {
    return <NetflixLayout>{children}</NetflixLayout>;
  }
  
  if (themeName === 'disney') {
    return <DisneyLayout>{children}</DisneyLayout>;
  }

  if (themeName === 'hbo') {
    return <HBOLayout>{children}</HBOLayout>;
  }

  return (
    <div className="flex min-h-screen bg-background text-[var(--color-text)] pb-20 md:pb-0">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 overflow-auto flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </div>
      </main>
      <BottomNav />
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

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [setDeferredPrompt, clearDeferredPrompt]);

  useEffect(() => {
    // Check for initial session immediately with try/catch
    const fetchInitialSession = async () => {
      try {
        console.log('Fetching initial Supabase session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          console.log('Session found, initializing user data...');
          setSession(session);
          
          // Pre-fetch trending data in background
          const warmCache = async () => {
            console.log('Warming cache...');
            fetchTrendingMovies().catch(() => {});
            fetchTrendingSeries().catch(() => {});
            fetchTopRatedGames().catch(() => {});
          };
          warmCache();

          // Only fetch critical user data here
          setTimeout(async () => {
            try {
              await fetchWatchlist();
            } catch (e) {
              console.error('Watchlist fetch failed but continuing:', e);
            }
          }, 1000);
        } else {
          console.log('No active session found.');
          setSession(null);
        }
      } catch (err) {
        console.error('Initial session fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialSession();

    // Handle subsequent auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, !!session);
      
      if (event === 'SIGNED_IN') {
        setSession(session);
        
        // Pre-fetch trending data
        const warmCache = async () => {
          console.log('Warming cache after sign-in...');
          fetchTrendingMovies().catch(() => {});
          fetchTrendingSeries().catch(() => {});
          fetchTopRatedGames().catch(() => {});
        };
        warmCache();

        setTimeout(() => {
          fetchWatchlist();
        }, 1000);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, fetchWatchlist]);

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

