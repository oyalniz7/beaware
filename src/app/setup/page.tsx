import { isSystemSetup } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import SetupForm from './SetupForm';

export default async function SetupPage() {
    const isSetup = await isSystemSetup();
    if (isSetup) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">VulnAnalyzer</h1>
                    <h2 className="mt-4 text-xl font-semibold text-gray-400">Initial Setup</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        No users found. Please create an administrator account to continue.
                    </p>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-xl shadow-lg backdrop-blur-sm">
                    <SetupForm />
                </div>
            </div>
        </div>
    );
}
