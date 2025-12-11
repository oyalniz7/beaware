"use client"

import * as React from "react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />
    }

    return (
        <div className="flex items-center space-x-2 border border-input rounded-md p-1 bg-card">
            <button
                onClick={() => setTheme("light")}
                className={`px-3 py-1 text-xs rounded-sm transition-all ${theme === 'light' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
                Light
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`px-3 py-1 text-xs rounded-sm transition-all ${theme === 'dark' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
                Dark
            </button>
            <button
                onClick={() => setTheme("system")}
                className={`px-3 py-1 text-xs rounded-sm transition-all ${theme === 'system' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
                System
            </button>
        </div>
    )
}
