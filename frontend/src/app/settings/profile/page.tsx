'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user, loading: authLoading, updateUser } = useAuth() as any;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/users/me', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (res.ok) {
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        if (updateUser) {
          updateUser(data);
        }
      } else {
        setProfileMessage({ type: 'error', text: data.message || 'Failed to update profile.' });
      }
    } catch (err) {
      setProfileMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordMessage(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/users/me/password', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: data.message || 'Failed to update password.' });
      }
    } catch (err) {
      setPasswordMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-medium text-red-600">
        User profile not found. Please log in again.
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Page Title & Subtitle Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your personal details and account credentials ({user.role?.toUpperCase() || 'MEMBER'}).
        </p>
      </div>

      {/* Personal Info Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900">Personal Information</h2>
          <p className="text-xs text-gray-500">Update your basic profile details.</p>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-5 space-y-4">
          {profileMessage && (
            <div className={`p-4 rounded-lg text-xs font-medium ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {profileMessage.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-lg bg-indigo-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Security Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900">Security</h2>
          <p className="text-xs text-gray-500">Update your account password.</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="p-5 space-y-4">
          {passwordMessage && (
            <div className={`p-4 rounded-lg text-xs font-medium ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {passwordMessage.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="rounded-lg bg-indigo-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}