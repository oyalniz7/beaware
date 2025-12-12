
import Link from 'next/link';
import { isSystemSetup } from '@/app/actions/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const setup = await isSystemSetup();

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0A0A] text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 p-8 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center text-center">
        {/* Logo / Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
          VulnAnalyzer
        </h1>
        <p className="text-gray-400 mb-8 text-sm">
          Advanced Vulnerability & Network Monitoring
        </p>

        <div className="w-full space-y-3">
          <Link
            href="/login"
            className="block w-full py-3 px-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            Login
          </Link>

          <Link
            href="/setup"
            className={`block w-full py-3 px-4 bg-white/5 border border-white/10 text-white font-semibold rounded-lg hover:bg-white/10 transition-all transform hover:scale-[1.02] ${setup ? 'cursor-default opacity-50' : ''}`}
          >
            {setup ? 'Account Created' : 'Create Account'}
          </Link>
        </div>

        {setup && (
          <p className="mt-6 text-xs text-gray-500">
            System is already configured. Please login.
          </p>
        )}

        <div className="mt-8 pt-6 border-t border-white/5 w-full flex justify-between text-xs text-gray-600 font-mono">
          <span>v1.0.0</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Secure
          </span>
        </div>
      </div>
    </main>
  );
}
