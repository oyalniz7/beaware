import Link from 'next/link';
import { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen w-full bg-background text-foreground">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
                <div className="p-6 border-b border-border">
                    <h1 className="text-xl font-bold tracking-tight text-primary">BeAware</h1>
                    <p className="text-xs text-muted-foreground">v0.1.0-alpha</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium">
                        Overview
                    </Link>
                    <Link href="/dashboard/assets" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium">
                        Assets
                    </Link>
                    <Link href="/dashboard/risks" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium">
                        Risk Analysis
                    </Link>
                    <Link href="/dashboard/monitoring" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium">
                        Live Monitoring
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium">
                        Settings
                    </Link>
                </nav>
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">U</div>
                        <div className="text-sm">
                            <p className="font-medium">User</p>
                            <p className="text-xs text-muted-foreground">Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-14 border-b border-border flex items-center px-6 md:hidden bg-card">
                    <span className="font-bold">BeAware</span>
                </header>
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
