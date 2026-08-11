'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// 1. Define the Workspace shape for TypeScript
interface Workspace {
  id: string;
  name: string;
}

export default function JoinPage() {
  const { token } = useParams();
  const router = useRouter();

  // 2. Tell TypeScript workspace can be Workspace OR null
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(true);

  // 1. Verify token on load
  useEffect(() => {
    fetch(`/api/workspaces/invite/${token}`)
      .then((res) => res.json())
      .then((data) => {
        setWorkspace(data.workspace);
        setLoading(false);
      });
  }, [token]);

  // 2. Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...formData, token }),
    });

    if (res.ok) {
      router.push('/dashboard');
    } else {
      alert('Registration failed. Token might be expired.');
    }
  };

  if (loading) return <div>Validating invite...</div>;
  if (!workspace) return <div>Invalid or expired invite link.</div>;

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold mb-4">Join {workspace.name}</h1>
      <form onSubmit={handleRegister} className="space-y-4">
        <input 
          placeholder="Full Name" 
          onChange={(e) => setFormData({...formData, name: e.target.value})} 
          className="w-full p-2 border rounded"
        />
        <input 
          placeholder="Email" 
          onChange={(e) => setFormData({...formData, email: e.target.value})} 
          className="w-full p-2 border rounded"
        />
        <input 
          type="password"
          placeholder="Password" 
          onChange={(e) => setFormData({...formData, password: e.target.value})} 
          className="w-full p-2 border rounded"
        />
        <button className="w-full bg-blue-600 text-white p-2 rounded">
          Accept Invite & Join
        </button>
      </form>
    </div>
  );
}