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
import { ForYou } from '@/pages/ForYou';
import { Library } from '@/pages/Library';
import { Profile } from '@/pages/Profile';
import { PublicProfile } from '@/pages/PublicProfile';
import { Settings } from '@/pages/Settings';
import { Onboarding } from '@/pages/Onboarding';
import { Wrapped } from '@/pages/Wrapped';
import Movies from '@/pages/Movies';
import Series from '@/pages/Series';
import Games from '@/pages/Games';
import { Admin } from '@/pages/Admin';
import { useStore } from '@/store/useStore';
import { useLanguageStore } from '@/store/useLanguageStore';
import { Toaster } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase';
import { Footer } from '@/components/Footer';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { session } = useStore();
  
  if (!session) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#0a0f1e] text-white pb-16 md:pb-0">
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchWatchlist();
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchWatchlist();
    });

    return () => subscription.unsubscribe();
  }, [setSession, fetchWatchlist]);

  if (loading) {
    return <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language} className={language === 'ar' ? 'font-tajawal' : ''}>
      <Router>
        <Routes>
          <Route path="/onboarding" element={session ? <Navigate to="/" replace /> : <Onboarding />} />
          <Route path="/" element={<ProtectedLayout><Home /></ProtectedLayout>} />
          <Route path="/games" element={<ProtectedLayout><Games /></ProtectedLayout>} />
          <Route path="/movies" element={<ProtectedLayout><Movies /></ProtectedLayout>} />
          <Route path="/series" element={<ProtectedLayout><Series /></ProtectedLayout>} />
          <Route path="/content/:id" element={<ProtectedLayout><ContentDetail /></ProtectedLayout>} />
          <Route path="/wiki/:id" element={<ProtectedLayout><GameWiki /></ProtectedLayout>} />
          <Route path="/for-you" element={<ProtectedLayout><ForYou /></ProtectedLayout>} />
          <Route path="/library" element={<ProtectedLayout><Library /></ProtectedLayout>} />
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

