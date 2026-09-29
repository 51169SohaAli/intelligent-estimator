'use client';

import { useState, useEffect } from 'react';

interface Member {
  _id: string;
  name: string;
  email: string;
}

export default function WorkspaceSettingsPage() {
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [origin, setOrigin] = useState('');

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }

    const fetchWorkspaceData = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          setStatusMessage({ type: 'error', text: 'Authentication token not found. Please log in again.' });
          setLoading(false);
          return;
        }

        // 1. Fetch current workspace details
        const res = await fetch('http://localhost:5000/workspaces/current', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || `Server returned status ${res.status}`);
        }

        const workspaceData = data.workspace || data;
        setWorkspaceName(workspaceData.name || '');
        setInviteToken(workspaceData.inviteToken || '');
        setWorkspaceId(workspaceData._id || '');

        // 2. Fetch workspace members if workspace ID exists
        const targetId = workspaceData._id;
        if (targetId) {
          const membersRes = await fetch(`http://localhost:5000/workspaces/${targetId}/members`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const membersData = await membersRes.json();
          if (membersRes.ok) {
            setMembers(membersData);
          }
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
        setStatusMessage({
          type: 'error',
          text: err.message || 'Could not load workspace details. Check backend API logs.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceData();
  }, []);

  const inviteUrl = inviteToken ? `${origin}/join/${inviteToken}` : '';

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/workspaces/current', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: workspaceName }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Workspace updated successfully!' });

        const updatedWorkspace = data.workspace || data;

        window.dispatchEvent(
          new CustomEvent('workspaceUpdated', {
            detail: { name: updatedWorkspace.name || workspaceName },
          })
        );
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Failed to update workspace.' });
      }
    } catch (err: any) {
      console.error('Save error:', err);
      setStatusMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToken = async () => {
    if (!confirm('Are you sure? This will invalidate any previous invite links.')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/workspaces/reset-invite', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok) {
        setInviteToken(data.inviteToken);
        setStatusMessage({ type: 'success', text: 'New invite link generated!' });
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Failed to reset invite token.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to communicate with the server.' });
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Workspace Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your organization details, team links, and default preferences.
        </p>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-lg text-xs font-medium ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {statusMessage.text}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-gray-500">
          Loading workspace settings...
        </div>
      ) : (
        <>
          {/* Section 1: General Info */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5">
              <h2 className="text-base font-semibold text-gray-900">General Information</h2>
              <p className="text-xs text-gray-500">Update your workspace identity visible to members.</p>
            </div>

            <form onSubmit={handleSaveName} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Team Invite Link */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5">
              <h2 className="text-base font-semibold text-gray-900">Invite Team Members</h2>
              <p className="text-xs text-gray-500">
                Share this link with your colleagues to let them register directly into this workspace.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex max-w-md items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  placeholder="Generating invite URL..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-700 select-all"
                />
                <button
                  onClick={handleCopy}
                  disabled={!inviteUrl}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-800 whitespace-nowrap disabled:opacity-50 cursor-pointer"
                >
                  {copied ? 'Copied! ✓' : 'Copy Link'}
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleResetToken}
                  className="text-xs text-red-600 hover:text-red-700 hover:underline font-medium cursor-pointer"
                >
                  Reset Invite Link (Invalidates existing link)
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Team Members List */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5">
              <h2 className="text-base font-semibold text-gray-900">
                Workspace Members ({members.length})
              </h2>
              <p className="text-xs text-gray-500">
                Active team members in this workspace.
              </p>
            </div>

            <div className="p-5">
              {members.length === 0 ? (
                <p className="text-xs text-gray-500">No members found in this workspace yet.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {members.map((member) => (
                    <div key={member._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name || 'Unnamed Member'}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}