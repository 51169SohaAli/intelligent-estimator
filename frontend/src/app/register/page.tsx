'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function AuthPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '', // Holds the string workspace name from the input
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🌐 OAuth Redirection Handlers
  const handleSocialLogin = (provider: 'google' | 'github') => {
    // Redirects the full browser window to your NestJS Passport strategy endpoints
    window.location.href = `http://localhost:5000/auth/${provider}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? 'login' : 'register';

    // Construct the explicit payload to match backend schema expectations
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : { 
          name: formData.name, 
          email: formData.email, 
          password: formData.password, 
          companyName: formData.companyName // Maps 'companyName' text to 'workspace' for NestJS
        };

    try {
      const response = await fetch(`http://localhost:5000/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (data.token && data.user) {
        login(data.token, data.user);
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  

  // Helper to clear form state nicely when toggling between login and signup
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ name: '', email: '', password: '', companyName: '' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 text-zinc-900 antialiased font-sans selection:bg-zinc-100">
      <div className="w-full max-w-sm space-y-6">
        
        {/* Minimalist Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-9 w-9 bg-black rounded-lg flex items-center justify-center shadow-xs">
            <span className="text-white font-black text-lg tracking-tighter">S</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            {isLogin ? 'Sign in to SprintFlow' : 'Create your workspace'}
          </h1>
        </div>

        {/* Frameless Form Box Container */}
        <div className="space-y-4">
          {/* Social SSO Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button 
              type="button" 
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 active:scale-[0.98] transition-all shadow-2xs cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.64 15.01 1 12 1 7.24 1 3.21 3.73 1.34 7.73l3.87 3a7.17 7.17 0 0 1 6.79-5.69z"/>
                <path fill="#4285F4" d="M23.45 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.43a5.5 5.5 0 0 1-2.39 3.61l3.71 2.87c2.17-2 3.7-4.94 3.7-8.61z"/>
                <path fill="#FBBC05" d="M5.21 14.73A7.12 7.12 0 0 1 4.8 12c0-.96.16-1.9.41-2.73L1.34 6.27A11.95 11.95 0 0 0 0 12c0 2.1.55 4.07 1.5 5.79l3.71-3.06z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.71-2.87c-1.03.69-2.35 1.1-4.25 1.1a7.17 7.17 0 0 1-6.79-5.69l-3.87 3A11.95 11.95 0 0 0 12 23z"/>
              </svg>
              Google
            </button>
            
            <button 
              type="button" 
              onClick={() => handleSocialLogin('github')}
              className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 active:scale-[0.98] transition-all shadow-2xs cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-100"></div>
            <span className="flex-shrink mx-3 text-xs text-zinc-400">or use email</span>
            <div className="flex-grow border-t border-zinc-100"></div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-2.5 text-center text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-600">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required={!isLogin}
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all shadow-2xs"
                  placeholder="Soha Ali"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-600">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all shadow-2xs"
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-medium text-zinc-600">Password</label>
                {isLogin && (
                  <button type="button" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                    Forgot?
                  </button>
                )}
              </div>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all shadow-2xs"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-600">Workspace Name</label>
                <input
                  type="text"
                  name="companyName"
                  required={!isLogin}
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all shadow-2xs"
                  placeholder="e.g. Acme Corp"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Continue'}
            </button>
          </form>

          <div className="text-center pt-4 mt-4">
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-xs font-medium text-zinc-500 transition-colors group"
            >
              {isLogin ? (
                <span>
                  Don't have an account?{' '}
                  <span className="text-zinc-900 underline underline-offset-4 decoration-zinc-300 group-hover:decoration-zinc-900 transition-colors cursor-pointer font-semibold">
                    Sign up
                  </span>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <span className="text-zinc-900 underline underline-offset-4 decoration-zinc-300 group-hover:decoration-zinc-900 transition-colors cursor-pointer font-semibold">
                    Sign in
                  </span>
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}