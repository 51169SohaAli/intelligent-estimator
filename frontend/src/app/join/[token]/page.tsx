'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface JoinPageProps {
  params: Promise<{ token: string }>;
}

export default function JoinWorkspacePage({ params }: JoinPageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const router = useRouter();
  const { fetchUser } = useAuth();

  const [workspaceName, setWorkspaceName] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInviteInfo = async () => {
      try {
        const res = await fetch(`http://localhost:5000/workspaces/invite-info/${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Invalid or expired invite link.');
        }

        setWorkspaceName(data.name || 'Workspace');
      } catch (err: any) {
        setError(err.message || 'Could not load invitation details.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInviteInfo();
    }
  }, [token]);

  const handleJoin = async () => {
    setJoining(true);
    setError('');

    const authToken = localStorage.getItem('token');

    if (!authToken) {
      router.push(`/register?redirect=/join/${token}`);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/workspaces/join', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refetches current user details so workspaceId and roles sync instantly
        await fetchUser();
        router.push('/');
      } else {
        setError(data.message || 'Failed to join workspace.');
      }
    } catch (err) {
      setError('An error occurred while joining the workspace.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Verifying invite link...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {error ? (
          <div className="text-center space-y-4">
            <h2 className="text-lg font-semibold text-red-600">Invitation Error</h2>
            <p className="text-sm text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-2 rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="text-center space-y-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                You've been invited
              </span>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                Join {workspaceName}
              </h1>
              <p className="mt-2 text-xs text-gray-500">
                Accept this invite to collaborate with team members in this workspace.
              </p>
            </div>

            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full rounded-lg bg-indigo-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-900 disabled:opacity-50 cursor-pointer"
            >
              {joining ? 'Joining Workspace...' : `Join ${workspaceName}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}