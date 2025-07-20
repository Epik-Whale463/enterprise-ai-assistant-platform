import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })
const jakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-jakarta',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'AI Assistant Pro',
    description: 'Enterprise-grade AI Assistant with advanced tools and capabilities',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${jakarta.className} ${jakarta.variable}`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <div className="min-h-screen bg-background">
                        {children}
                    </div>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    )
}