import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Gamepad2, Film, Tv } from 'lucide-react';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import { toast } from 'sonner';

const GENRES = {
  games: ['RPG', 'Action', 'Strategy', 'Shooter', 'Puzzle', 'Sports'],
  movies: ['Action', 'Sci-Fi', 'Drama', 'Comedy', 'Horror', 'Romance'],
  series: ['Drama', 'Comedy', 'Sci-Fi', 'Documentary', 'Animation', 'Crime']
};

export function Onboarding() {
  const [step, setStep] = useState(-1); // -1 is Auth step
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, string[]>>({ games: [], movies: [], series: [] });
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSupabaseConfig) {
      toast.error('Supabase configuration is missing! Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your secrets.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          navigate('/');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          toast.success('Registration successful! Please check your email to confirm your account.');
          setIsLogin(true);
        } else {
          setStep(0); // Move to genre selection
        }
      }
    } catch (error: any) {
      if (error.message?.includes('Email not confirmed')) {
        toast.error('Please check your email and confirm your account before logging in.');
      } else if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password.');
      } else {
        toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (category: string, genre: string) => {
    setPreferences(prev => {
      const current = prev[category];
      const updated = current.includes(genre)
        ? current.filter(g => g !== genre)
        : [...current, genre];
      return { ...prev, [category]: updated };
    });
  };

  const handleComplete = async () => {
    // Save preferences to user metadata or a separate table if needed
    // For now, just navigate to home
    navigate('/');
  };

  const steps = [
    {
      title: "What kind of games do you play?",
      icon: Gamepad2,
      category: 'games',
      color: 'text-blue-400'
    },
    {
      title: "What movies do you enjoy?",
      icon: Film,
      category: 'movies',
      color: 'text-purple-400'
    },
    {
      title: "What series are you into?",
      icon: Tv,
      category: 'series',
      color: 'text-pink-400'
    }
  ];

  if (step === -1) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-8">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to EntertainHub</h1>
          <p className="text-gray-400 mb-8">{isLogin ? 'Sign in to continue' : 'Create an account to get started'}</p>
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-8">
            <form onSubmit={handleAuth} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white"
              />
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>
            <div className="mt-6 text-sm text-gray-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-blue-400 hover:underline">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = steps[step];

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-8">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Let's personalize your hub</h1>
        <p className="text-gray-400 mb-12">Select the genres you love to get better recommendations.</p>

        <div className="bg-[#111827] border border-white/10 rounded-3xl p-10">
          <div className="flex items-center justify-center gap-4 mb-8">
            <currentStep.icon className={`w-8 h-8 ${currentStep.color}`} />
            <h2 className="text-2xl font-semibold text-white">{currentStep.title}</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {GENRES[currentStep.category as keyof typeof GENRES].map(genre => {
              const isSelected = preferences[currentStep.category].includes(genre);
              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(currentStep.category, genre)}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105' 
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-blue-500' : 'bg-white/20'}`} />
              ))}
            </div>
            <div className="flex gap-4">
              {step > 0 && (
                <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="text-gray-400 hover:text-white">
                  Back
                </Button>
              )}
              <Button 
                onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : handleComplete()}
                className="bg-white text-black hover:bg-gray-200 px-8 rounded-full"
              >
                {step < steps.length - 1 ? 'Next' : 'Complete Setup'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
