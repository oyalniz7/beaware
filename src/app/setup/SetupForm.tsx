'use client'

import { useState } from 'react';
import { createInitialUser } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

export default function SetupForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        try {
            const result = await createInitialUser({
                email: formData.email,
                password: formData.password,
                name: formData.name
            });

            if (result.success) {
                router.push('/login?setup=success');
            } else {
                setError(result.error || 'Failed to create account');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-900/20 border border-red-900 text-red-400 rounded text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Name (Optional)</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Admin User"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="admin@example.com"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••••"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Confirm Password</label>
                <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••••"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
                {loading ? 'Creating Account...' : 'Complete Setup'}
            </button>
        </form>
    );
}
