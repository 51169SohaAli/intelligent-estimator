'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Or your correct path

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  // 🚨 This ref will prevent the effect from running twice (React 18 Double-Effect Guard)
  const isProcessing = useRef(false);

  useEffect(() => {
    if (isProcessing.current) return;

    const token = searchParams.get('token');
    const userString = searchParams.get('user');

    if (token && userString) {
      isProcessing.current = true; // Mark as processing so it never runs again
      
      try {
        const userData = JSON.parse(decodeURIComponent(userString));
        
        // 🚀 Log in and immediately push to home/dashboard
        login(token, userData);
        
      } catch (error) {
        console.error('❌ Failed to parse social user payload:', error);
        router.push('/login?error=oauth_parse_failed');
      }
    } else {
      router.push('/login');
    }
  }, [searchParams, login, router]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      <p className="text-gray-600">Securing your workspace connection...</p>
    </div>
  );
}