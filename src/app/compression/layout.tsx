import React from 'react'

type Props = { children: React.ReactNode }

export default function layout({ children }: Props) {
    return (
        <div className="w-full relative flex flex-col bg-background text-foreground">
            <div className="fixed inset-0 z-[-1]">
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]" />
                <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background dark:to-background/80" />
                <div className="absolute inset-0 bg-noise-pattern opacity-[0.015] dark:opacity-[0.03]" />
            </div>
            <main className="flex-grow flex items-center justify-center w-full">
                <div className="w-full mx-auto px-4 py-2">
                    {children}
                </div>
            </main>
            <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-transparent to-transparent pointer-events-none" />
        </div>
    )
}