import Link from 'next/link';
import { ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const session = await getServerSession(authOptions);
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
                    <Link href="/dashboard/topology" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm font-medium">
                        Network Topology
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

                    {/* Admin Link */}
                    {(session?.user as any)?.role === 'admin' && (
                        <Link href="/dashboard/admin" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/10 text-primary hover:text-primary transition-colors text-sm font-medium mt-4 border-t border-border pt-4">
                            Admin Console
                        </Link>
                    )}
                </nav>
                <div className="p-4 border-t border-border space-y-4">
                    <ThemeToggle />
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                            {session?.user?.name?.[0] || 'U'}
                        </div>
                        <div className="text-sm">
                            <p className="font-medium">{session?.user?.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground capitalize">{(session?.user as any)?.role || 'User'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-14 border-b border-border flex items-center justify-between px-6 md:hidden bg-card">
                    <span className="font-bold">BeAware</span>
                    <ThemeToggle />
                </header>
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
